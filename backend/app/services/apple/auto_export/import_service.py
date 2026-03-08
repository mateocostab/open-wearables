import json
from datetime import datetime, timedelta
from decimal import Decimal
from logging import Logger, getLogger
from typing import Iterable
from uuid import UUID, uuid4

from app.database import DbSession
from app.schemas import (
    AEWorkoutJSON,
    EventRecordCreate,
    EventRecordDetailCreate,
    EventRecordMetrics,
    HeartRateSampleCreate,
    RootJSON,
    UploadDataResponse,
)
from app.schemas.apple.auto_export.json_schemas import MetricJSON
from app.schemas.series_types import SeriesType
from app.schemas.timeseries import TimeSeriesSampleCreate
from app.services.event_record_service import event_record_service
from app.services.timeseries_service import timeseries_service
from app.utils.exceptions import handle_exceptions
from app.utils.structured_logging import log_structured

APPLE_DT_FORMAT = "%Y-%m-%d %H:%M:%S %z"

# Sleep metric name as sent by Health Auto Export
AE_SLEEP_ANALYSIS_NAME = "sleep_analysis"

# Max gap between consecutive sleep records to belong to the same session
SLEEP_SESSION_GAP = timedelta(hours=2)

# Mapping from Health Auto Export metric names to SeriesType.
# Keys are the `name` field from the JSON payload (snake_case).
AE_METRIC_TO_SERIES_TYPE: dict[str, SeriesType] = {
    # Heart & Cardiovascular
    "heart_rate": SeriesType.heart_rate,
    "resting_heart_rate": SeriesType.resting_heart_rate,
    "heart_rate_variability": SeriesType.heart_rate_variability_sdnn,
    "walking_heart_rate_average": SeriesType.walking_heart_rate_average,
    # Blood & Respiratory
    "oxygen_saturation": SeriesType.oxygen_saturation,
    "respiratory_rate": SeriesType.respiratory_rate,
    "blood_glucose": SeriesType.blood_glucose,
    # Body Composition
    "weight": SeriesType.weight,
    "body_fat_percentage": SeriesType.body_fat_percentage,
    "body_mass_index": SeriesType.body_mass_index,
    "lean_body_mass": SeriesType.lean_body_mass,
    "height": SeriesType.height,
    "body_temperature": SeriesType.body_temperature,
    "waist_circumference": SeriesType.waist_circumference,
    # Fitness
    "vo2_max": SeriesType.vo2_max,
    # Activity - Basic
    "step_count": SeriesType.steps,
    "steps": SeriesType.steps,
    "active_energy": SeriesType.energy,
    "active_energy_burned": SeriesType.energy,
    "basal_energy_burned": SeriesType.basal_energy,
    "apple_stand_time": SeriesType.stand_time,
    "stand_time": SeriesType.stand_time,
    "apple_exercise_time": SeriesType.exercise_time,
    "exercise_time": SeriesType.exercise_time,
    "flights_climbed": SeriesType.flights_climbed,
    # Activity - Distance
    "distance_walking_running": SeriesType.distance_walking_running,
    "distance_cycling": SeriesType.distance_cycling,
    "distance_swimming": SeriesType.distance_swimming,
    # Activity - Walking Metrics
    "walking_step_length": SeriesType.walking_step_length,
    "walking_speed": SeriesType.walking_speed,
    "walking_double_support_percentage": SeriesType.walking_double_support_percentage,
    "walking_asymmetry_percentage": SeriesType.walking_asymmetry_percentage,
    "walking_steadiness": SeriesType.walking_steadiness,
    "stair_descent_speed": SeriesType.stair_descent_speed,
    "stair_ascent_speed": SeriesType.stair_ascent_speed,
    # Activity - Running Metrics
    "running_power": SeriesType.running_power,
    "running_speed": SeriesType.running_speed,
    "running_stride_length": SeriesType.running_stride_length,
    "running_ground_contact_time": SeriesType.running_ground_contact_time,
    "running_vertical_oscillation": SeriesType.running_vertical_oscillation,
    # Environmental
    "environmental_audio_exposure": SeriesType.environmental_audio_exposure,
    "headphone_audio_exposure": SeriesType.headphone_audio_exposure,
    "time_in_daylight": SeriesType.time_in_daylight,
}

# Blood pressure is compound — maps to two series types
AE_BLOOD_PRESSURE_NAME = "blood_pressure"


class ImportService:
    def __init__(self, log: Logger):
        self.log = log
        self.event_record_service = event_record_service
        self.timeseries_service = timeseries_service

    def _dt(self, s: str) -> datetime:
        s = s.replace(" +", "+").replace(" ", "T", 1)
        if len(s) >= 5 and (s[-5] in {"+", "-"} and s[-3] != ":"):
            s = f"{s[:-2]}:{s[-2:]}"
        return datetime.fromisoformat(s)

    def _dec(self, x: float | int | None) -> Decimal | None:
        return None if x is None else Decimal(str(x))

    def _compute_metrics(self, workout: AEWorkoutJSON) -> EventRecordMetrics:
        hr_entries = workout.heartRateData or []

        hr_min_candidates = [self._dec(entry.min) for entry in hr_entries if entry.min is not None]
        hr_max_candidates = [self._dec(entry.max) for entry in hr_entries if entry.max is not None]
        hr_avg_candidates = [self._dec(entry.avg) for entry in hr_entries if entry.avg is not None]

        heart_rate_min = min(hr_min_candidates) if hr_min_candidates else None
        heart_rate_max = max(hr_max_candidates) if hr_max_candidates else None
        heart_rate_avg = (
            sum(hr_avg_candidates, Decimal("0")) / Decimal(len(hr_avg_candidates)) if hr_avg_candidates else None
        )

        return {
            "heart_rate_min": int(heart_rate_min) if heart_rate_min is not None else None,
            "heart_rate_max": int(heart_rate_max) if heart_rate_max is not None else None,
            "heart_rate_avg": heart_rate_avg,
            "steps_count": None,
        }

    def _get_records(
        self,
        workout: AEWorkoutJSON,
        user_id: UUID,
    ) -> list[HeartRateSampleCreate]:
        samples: list[HeartRateSampleCreate] = []

        heart_rate_fields = ("heartRate", "heartRateRecovery")
        for field in heart_rate_fields:
            entries = getattr(workout, field, None)
            if not entries:
                continue

            for entry in entries:
                value = entry.avg or entry.max or entry.min or 0
                source_name = getattr(entry, "source", None) or "Auto Export"
                samples.append(
                    HeartRateSampleCreate(
                        id=uuid4(),
                        external_id=None,
                        user_id=user_id,
                        source="apple_health_auto_export",
                        device_model=source_name,
                        recorded_at=self._dt(entry.date),
                        value=self._dec(value) or 0,
                    ),
                )

        return samples

    def _build_metric_samples(
        self,
        raw: dict,
        user_id: str,
    ) -> list[TimeSeriesSampleCreate]:
        """Parse data.metrics[] from Health Auto Export and return TimeSeriesSampleCreate objects."""
        root = RootJSON(**raw)
        metrics_raw = root.data.get("metrics", [])
        user_uuid = UUID(user_id)
        samples: list[TimeSeriesSampleCreate] = []

        # Log all incoming metric names for debugging
        metric_names = [MetricJSON(**m).name for m in metrics_raw]
        log_structured(
            self.log, "info", f"Auto Export metrics received: {metric_names}",
            provider="apple", action="apple_ae_metric_names", user_id=user_id,
        )

        for m in metrics_raw:
            metric = MetricJSON(**m)
            metric_name = metric.name.lower().replace(" ", "_")

            # Handle blood pressure (compound metric → two series)
            if metric_name == AE_BLOOD_PRESSURE_NAME:
                for dp in metric.data:
                    if dp.systolic is not None:
                        samples.append(
                            TimeSeriesSampleCreate(
                                id=uuid4(),
                                user_id=user_uuid,
                                source="apple_health_auto_export",
                                device_model=dp.source or "Apple Watch",
                                recorded_at=self._dt(dp.date),
                                value=self._dec(dp.systolic) or 0,
                                series_type=SeriesType.blood_pressure_systolic,
                            )
                        )
                    if dp.diastolic is not None:
                        samples.append(
                            TimeSeriesSampleCreate(
                                id=uuid4(),
                                user_id=user_uuid,
                                source="apple_health_auto_export",
                                device_model=dp.source or "Apple Watch",
                                recorded_at=self._dt(dp.date),
                                value=self._dec(dp.diastolic) or 0,
                                series_type=SeriesType.blood_pressure_diastolic,
                            )
                        )
                continue

            series_type = AE_METRIC_TO_SERIES_TYPE.get(metric_name)
            if series_type is None:
                continue  # Skip unsupported metrics

            for dp in metric.data:
                # Resolve the numeric value: qty for standard, Avg for HR aggregates
                value = dp.qty
                if value is None:
                    value = dp.avg or dp.max or dp.min
                if value is None:
                    continue  # Skip entries without a numeric value

                samples.append(
                    TimeSeriesSampleCreate(
                        id=uuid4(),
                        user_id=user_uuid,
                        source="apple_health_auto_export",
                        device_model=dp.source or "Apple Watch",
                        recorded_at=self._dt(dp.date),
                        value=self._dec(value) or 0,
                        series_type=series_type,
                    )
                )

        return samples

    def _build_sleep_records(
        self,
        raw: dict,
        user_id: str,
    ) -> list[tuple[EventRecordCreate, EventRecordDetailCreate]]:
        """Parse sleep_analysis from Health Auto Export and build sleep event records.

        Health Auto Export sends sleep as pre-aggregated daily summaries (NOT individual stages).
        Each data point is a dict with:
        - sleepStart/sleepEnd: session timestamps
        - inBedStart/inBedEnd: in-bed timestamps
        - core: light sleep hours
        - deep: deep sleep hours
        - rem: REM sleep hours
        - awake: awake hours
        - asleep: unspecified sleep hours
        - inBed: in-bed hours (non-sleeping)
        - totalSleep: total sleep hours
        - source: device name
        - date: date string
        """
        root = RootJSON(**raw)
        metrics_raw = root.data.get("metrics", [])
        user_uuid = UUID(user_id)

        # Find sleep_analysis metric from RAW dict (not Pydantic — it strips unknown fields)
        raw_sleep_data: list[dict] = []
        for m in metrics_raw:
            name = m.get("name", "")
            if name.lower().replace(" ", "_") == AE_SLEEP_ANALYSIS_NAME:
                raw_sleep_data = m.get("data", [])
                break

        if not raw_sleep_data:
            return []

        results = []
        skipped = 0

        for entry in raw_sleep_data:
            sleep_start_str = entry.get("sleepStart")
            sleep_end_str = entry.get("sleepEnd")

            if not sleep_start_str or not sleep_end_str:
                skipped += 1
                continue

            try:
                sleep_start = self._dt(sleep_start_str)
                sleep_end = self._dt(sleep_end_str)
            except (ValueError, TypeError):
                skipped += 1
                continue

            if sleep_end <= sleep_start:
                skipped += 1
                continue

            total_duration = (sleep_end - sleep_start).total_seconds()

            # Skip very short sessions (< 30 min)
            if total_duration < 1800:
                skipped += 1
                continue

            # Stage durations — values are in HOURS, convert to minutes
            core_hrs = entry.get("core") or 0
            deep_hrs = entry.get("deep") or 0
            rem_hrs = entry.get("rem") or 0
            awake_hrs = entry.get("awake") or 0
            asleep_hrs = entry.get("asleep") or 0  # unspecified sleep
            in_bed_hrs = entry.get("inBed") or 0

            light_min = int(round((core_hrs + asleep_hrs) * 60))
            deep_min = int(round(deep_hrs * 60))
            rem_min = int(round(rem_hrs * 60))
            awake_min = int(round(awake_hrs * 60))
            total_sleep_min = light_min + deep_min + rem_min

            # In-bed time from inBedStart/inBedEnd if available, else from duration
            in_bed_start_str = entry.get("inBedStart")
            in_bed_end_str = entry.get("inBedEnd")
            if in_bed_start_str and in_bed_end_str:
                try:
                    ib_start = self._dt(in_bed_start_str)
                    ib_end = self._dt(in_bed_end_str)
                    time_in_bed_min = int((ib_end - ib_start).total_seconds() / 60)
                except (ValueError, TypeError):
                    time_in_bed_min = int(total_duration / 60)
            else:
                time_in_bed_min = int(total_duration / 60)

            source_name = entry.get("source") or "Auto Export"
            is_nap = total_duration < 5400  # < 1.5 hours

            sleep_id = uuid4()
            record = EventRecordCreate(
                id=sleep_id,
                external_id=None,
                user_id=user_uuid,
                start_datetime=sleep_start,
                end_datetime=sleep_end,
                duration_seconds=int(total_duration),
                category="sleep",
                type="sleep_session",
                source_name=source_name,
                source="apple_health_auto_export",
                device_model=source_name,
            )

            detail = EventRecordDetailCreate(
                record_id=sleep_id,
                sleep_total_duration_minutes=total_sleep_min,
                sleep_time_in_bed_minutes=time_in_bed_min,
                sleep_deep_minutes=deep_min,
                sleep_rem_minutes=rem_min,
                sleep_light_minutes=light_min,
                sleep_awake_minutes=awake_min,
                sleep_efficiency_score=None,
                is_nap=is_nap,
            )

            results.append((record, detail))

        log_structured(
            self.log, "info",
            f"Sleep records: {len(results)} created from {len(raw_sleep_data)} entries ({skipped} skipped)",
            provider="apple", action="apple_ae_sleep_result", user_id=user_id,
        )

        return results

    def _build_import_bundles(
        self,
        raw: dict,
        user_id: str,
    ) -> Iterable[tuple[EventRecordCreate, EventRecordDetailCreate, list[HeartRateSampleCreate]]]:
        """
        Given the parsed JSON dict from HealthAutoExport, yield ImportBundles
        ready to insert the database.
        """
        root = RootJSON(**raw)
        workouts_raw = root.data.get("workouts", [])

        user_uuid = UUID(user_id)
        for w in workouts_raw:
            wjson = AEWorkoutJSON(**w)

            workout_id = uuid4()

            start_date = self._dt(wjson.start)
            end_date = self._dt(wjson.end)
            duration_seconds = int((end_date - start_date).total_seconds())

            metrics = self._compute_metrics(wjson)
            hr_samples = self._get_records(wjson, user_uuid)

            workout_type = wjson.name or "Unknown Workout"

            record = EventRecordCreate(
                category="workout",
                type=workout_type,
                source_name="Auto Export",
                device_model=None,
                duration_seconds=duration_seconds,
                start_datetime=start_date,
                end_datetime=end_date,
                id=workout_id,
                external_id=wjson.id,
                source="apple_health_auto_export",
                user_id=user_uuid,
            )

            detail = EventRecordDetailCreate(
                record_id=workout_id,
                **metrics,
            )

            yield record, detail, hr_samples

    def load_data(
        self,
        db_session: DbSession,
        raw: dict,
        user_id: str,
        batch_id: str | None = None,
    ) -> dict[str, int]:
        """
        Load data into database and return counts of saved items.

        Returns:
            dict with counts: {"workouts_saved": int, "records_saved": int, "metrics_saved": int, "sleep_saved": int}
        """
        workouts_saved = 0
        records_saved = 0
        # Collect all HR samples from all workouts for a single batch insert
        all_hr_samples: list[HeartRateSampleCreate] = []

        for record, detail, hr_samples in self._build_import_bundles(raw, user_id):
            created_record = self.event_record_service.create(db_session, record)
            detail_for_record = detail.model_copy(update={"record_id": created_record.id})
            self.event_record_service.create_detail(db_session, detail_for_record)
            workouts_saved += 1

            if hr_samples:
                all_hr_samples.extend(hr_samples)

        # Single batch insert for all HR samples
        if all_hr_samples:
            self.timeseries_service.bulk_create_samples(db_session, all_hr_samples)
            records_saved = len(all_hr_samples)

        # Parse and insert daily metrics (HR, steps, HRV, SpO2, etc.)
        metric_samples = self._build_metric_samples(raw, user_id)
        metrics_saved = 0
        if metric_samples:
            self.timeseries_service.bulk_create_samples(db_session, metric_samples)
            metrics_saved = len(metric_samples)

        # Parse and insert sleep records from sleep_analysis metric
        sleep_saved = 0
        sleep_records = self._build_sleep_records(raw, user_id)
        for sleep_record, sleep_detail in sleep_records:
            created_record = self.event_record_service.create(db_session, sleep_record)
            detail_for_record = sleep_detail.model_copy(update={"record_id": created_record.id})
            self.event_record_service.create_detail(db_session, detail_for_record, detail_type="sleep")
            sleep_saved += 1

        # Commit all changes in one transaction
        db_session.commit()

        return {
            "workouts_saved": workouts_saved,
            "records_saved": records_saved,
            "metrics_saved": metrics_saved,
            "sleep_saved": sleep_saved,
        }

    @handle_exceptions
    def import_data_from_request(
        self,
        db_session: DbSession,
        request_content: str,
        content_type: str,
        user_id: str,
        batch_id: str | None = None,
    ) -> UploadDataResponse:
        try:
            # Parse content based on type
            if "multipart/form-data" in content_type:
                data = self._parse_multipart_content(request_content)
            else:
                data = self._parse_json_content(request_content)

            if not data:
                log_structured(
                    self.log,
                    "warning",
                    "No valid data found in request",
                    provider="apple",
                    action="apple_ae_validate_data",
                    batch_id=batch_id,
                    user_id=user_id,
                )
                return UploadDataResponse(status_code=400, response="No valid data found", user_id=user_id)

            # Extract incoming counts for logging
            data_section = data.get("data", {})
            incoming_workouts = len(data_section.get("workouts", []))
            incoming_metrics = len(data_section.get("metrics", []))

            # Load data and get saved counts
            saved_counts = self.load_data(db_session, data, user_id=user_id, batch_id=batch_id)

            # Log detailed processing results
            log_structured(
                self.log,
                "info",
                "Apple Auto Export data import completed",
                provider="apple",
                action="apple_ae_import_complete",
                batch_id=batch_id,
                user_id=user_id,
                incoming_workouts=incoming_workouts,
                incoming_metrics=incoming_metrics,
                workouts_saved=saved_counts["workouts_saved"],
                records_saved=saved_counts["records_saved"],
                metrics_saved=saved_counts["metrics_saved"],
                sleep_saved=saved_counts["sleep_saved"],
            )

        except Exception as e:
            log_structured(
                self.log,
                "error",
                f"Import failed for user {user_id}: {e}",
                provider="apple",
                action="apple_ae_import_failed",
                batch_id=batch_id,
                user_id=user_id,
                error_type=type(e).__name__,
            )
            return UploadDataResponse(status_code=400, response=f"Import failed: {str(e)}", user_id=user_id)

        return UploadDataResponse(status_code=200, response="Import successful", user_id=user_id)

    def _parse_multipart_content(self, content: str) -> dict | None:
        """Parse multipart form data to extract JSON."""
        json_start = content.find('{\n  "data"')
        if json_start == -1:
            json_start = content.find('{"data"')
        if json_start == -1:
            return None

        brace_count = 0
        json_end = json_start
        for i, char in enumerate(content[json_start:], json_start):
            if char == "{":
                brace_count += 1
            elif char == "}":
                brace_count -= 1
                if brace_count == 0:
                    json_end = i
                    break

        if brace_count != 0:
            return None

        json_str = content[json_start : json_end + 1]
        return json.loads(json_str)

    def _parse_json_content(self, content: str) -> dict | None:
        """Parse JSON content directly."""
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None


import_service = ImportService(log=getLogger(__name__))
