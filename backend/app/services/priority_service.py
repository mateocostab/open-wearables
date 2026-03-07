from logging import Logger
from uuid import UUID

from sqlalchemy import Date, cast, func

from app.database import DbSession
from app.models import DataPointSeries, DataSource, ProviderPriority
from app.repositories import DataSourceRepository, ProviderPriorityRepository
from app.repositories.device_type_priority_repository import DeviceTypePriorityRepository
from app.schemas.data_source import (
    DataSourceCoverage,
    DataSourceCoverageListResponse,
    DataSourceListResponse,
    DataSourceResponse,
    MetricCoverage,
)
from app.schemas.device_type import DeviceType
from app.schemas.device_type_priority import (
    DeviceTypePriorityBulkUpdate,
    DeviceTypePriorityListResponse,
    DeviceTypePriorityResponse,
)
from app.schemas.oauth import ProviderName
from app.schemas.provider_priority import (
    ProviderPriorityBulkUpdate,
    ProviderPriorityListResponse,
    ProviderPriorityResponse,
)
from app.schemas.series_types import get_series_type_from_id
from app.utils.exceptions import handle_exceptions


class PriorityService:
    def __init__(self, log: Logger):
        self.logger = log
        self.priority_repo = ProviderPriorityRepository(ProviderPriority)
        self.device_type_priority_repo = DeviceTypePriorityRepository()
        self.data_source_repo = DataSourceRepository(DataSource)

    @handle_exceptions
    async def get_provider_priorities(
        self,
        db_session: DbSession,
    ) -> ProviderPriorityListResponse:
        priorities = self.priority_repo.get_all_ordered(db_session)
        return ProviderPriorityListResponse(items=[ProviderPriorityResponse.model_validate(p) for p in priorities])

    @handle_exceptions
    async def update_provider_priority(
        self,
        db_session: DbSession,
        provider: ProviderName,
        priority: int,
    ) -> ProviderPriorityResponse:
        result = self.priority_repo.upsert(db_session, provider, priority)
        db_session.commit()
        return ProviderPriorityResponse.model_validate(result)

    @handle_exceptions
    async def bulk_update_priorities(
        self,
        db_session: DbSession,
        update: ProviderPriorityBulkUpdate,
    ) -> ProviderPriorityListResponse:
        priorities_tuples = [(p.provider, p.priority) for p in update.priorities]
        results = self.priority_repo.bulk_update(db_session, priorities_tuples)
        db_session.commit()
        return ProviderPriorityListResponse(items=[ProviderPriorityResponse.model_validate(p) for p in results])

    @handle_exceptions
    async def get_user_data_sources(
        self,
        db_session: DbSession,
        user_id: UUID,
    ) -> DataSourceListResponse:
        sources = self.data_source_repo.get_user_data_sources(db_session, user_id)
        items = [
            DataSourceResponse(
                id=ds.id,
                user_id=ds.user_id,
                provider=ds.provider,
                user_connection_id=ds.user_connection_id,
                device_model=ds.device_model,
                software_version=ds.software_version,
                source=ds.source,
                device_type=ds.device_type,
                original_source_name=ds.original_source_name,
                display_name=self._build_display_name(ds),
            )
            for ds in sources
        ]
        return DataSourceListResponse(items=items, total=len(items))

    @handle_exceptions
    async def get_device_type_priorities(
        self,
        db_session: DbSession,
    ) -> DeviceTypePriorityListResponse:
        priorities = self.device_type_priority_repo.get_all_ordered(db_session)
        return DeviceTypePriorityListResponse(items=[DeviceTypePriorityResponse.model_validate(p) for p in priorities])

    @handle_exceptions
    async def update_device_type_priority(
        self,
        db_session: DbSession,
        device_type: DeviceType,
        priority: int,
    ) -> DeviceTypePriorityResponse:
        result = self.device_type_priority_repo.upsert(db_session, device_type, priority)
        db_session.commit()
        return DeviceTypePriorityResponse.model_validate(result)

    @handle_exceptions
    async def bulk_update_device_type_priorities(
        self,
        db_session: DbSession,
        update: DeviceTypePriorityBulkUpdate,
    ) -> DeviceTypePriorityListResponse:
        priorities_tuples = [(p.device_type, p.priority) for p in update.priorities]
        results = self.device_type_priority_repo.bulk_update(db_session, priorities_tuples)
        db_session.commit()
        return DeviceTypePriorityListResponse(items=[DeviceTypePriorityResponse.model_validate(p) for p in results])

    def get_priority_data_source_ids(
        self,
        db_session: DbSession,
        user_id: UUID,
    ) -> list[UUID]:
        """Get data source IDs for a user, ordered by global priority."""
        provider_order = self.priority_repo.get_priority_order(db_session)
        device_type_order = self.device_type_priority_repo.get_priority_order(db_session)
        sources = self.data_source_repo.get_user_data_sources(db_session, user_id)

        if not sources:
            return []

        def sort_key(ds: DataSource) -> tuple[int, int, str]:
            provider_priority = provider_order.get(ds.provider, 99)
            device_type_priority = 99
            if ds.device_type:
                try:
                    dt = DeviceType(ds.device_type)
                    device_type_priority = device_type_order.get(dt, 99)
                except ValueError:
                    pass
            return (provider_priority, device_type_priority, ds.device_model or "")

        sorted_sources = sorted(sources, key=sort_key)
        return [ds.id for ds in sorted_sources]

    def get_best_data_source_id(
        self,
        db_session: DbSession,
        user_id: UUID,
    ) -> UUID | None:
        ids = self.get_priority_data_source_ids(db_session, user_id)
        return ids[0] if ids else None

    @handle_exceptions
    async def get_device_coverage(
        self,
        db_session: DbSession,
        user_id: UUID,
    ) -> DataSourceCoverageListResponse:
        """Get data coverage per device: which metrics each device tracks."""
        sources = self.data_source_repo.get_user_data_sources(db_session, user_id)
        if not sources:
            return DataSourceCoverageListResponse(items=[])

        # Query: group data points by (data_source_id, series_type_definition_id)
        rows = (
            db_session.query(
                DataPointSeries.data_source_id,
                DataPointSeries.series_type_definition_id,
                func.count(DataPointSeries.id).label("count"),
                func.min(DataPointSeries.recorded_at).label("earliest"),
                func.max(DataPointSeries.recorded_at).label("latest"),
            )
            .join(DataSource, DataPointSeries.data_source_id == DataSource.id)
            .filter(DataSource.user_id == user_id)
            .group_by(
                DataPointSeries.data_source_id,
                DataPointSeries.series_type_definition_id,
            )
            .all()
        )

        # Group by data_source_id
        coverage_map: dict[UUID, list[tuple]] = {}
        for row in rows:
            coverage_map.setdefault(row.data_source_id, []).append(row)

        # Build response
        source_lookup = {ds.id: ds for ds in sources}
        items = []
        for ds in sources:
            metrics_rows = coverage_map.get(ds.id, [])
            metrics = []
            total_points = 0
            earliest_data = None
            latest_data = None

            for row in metrics_rows:
                try:
                    series_type = get_series_type_from_id(row.series_type_definition_id)
                except KeyError:
                    continue
                metrics.append(MetricCoverage(
                    series_type=series_type.value,
                    count=row.count,
                    earliest=row.earliest,
                    latest=row.latest,
                ))
                total_points += row.count
                if earliest_data is None or row.earliest < earliest_data:
                    earliest_data = row.earliest
                if latest_data is None or row.latest > latest_data:
                    latest_data = row.latest

            if not metrics:
                continue

            items.append(DataSourceCoverage(
                data_source_id=ds.id,
                display_name=self._build_display_name(ds),
                provider=ds.provider,
                device_type=ds.device_type,
                device_model=ds.device_model,
                metrics=metrics,
                total_data_points=total_points,
                earliest_data=earliest_data,
                latest_data=latest_data,
            ))

        return DataSourceCoverageListResponse(items=items)

    def _build_display_name(self, ds: DataSource) -> str:
        parts = []
        if ds.provider:
            parts.append(ds.provider.value.capitalize())
        if ds.device_model:
            parts.append(ds.device_model)
        elif ds.original_source_name:
            parts.append(ds.original_source_name)
        return " - ".join(parts) if parts else "Unknown Source"
