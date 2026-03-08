from enum import StrEnum


class SleepPhase(StrEnum):
    IN_BED = "in_bed"
    SLEEPING = "sleeping"
    AWAKE = "awake"
    ASLEEP_LIGHT = "light"
    ASLEEP_DEEP = "deep"
    ASLEEP_REM = "rem"
    UNKNOWN = "unknown"


# Apple HealthKit sends camelCase sleep stage values (HKCategoryValueSleepAnalysis).
# This map converts them to our normalised SleepPhase enum.
APPLE_SLEEP_PHASE_MAP: dict[str, SleepPhase] = {
    "inBed": SleepPhase.IN_BED,
    "asleepUnspecified": SleepPhase.SLEEPING,
    "asleepCore": SleepPhase.ASLEEP_LIGHT,
    "asleepDeep": SleepPhase.ASLEEP_DEEP,
    "asleepREM": SleepPhase.ASLEEP_REM,
    "awake": SleepPhase.AWAKE,
}


def get_apple_sleep_phase(apple_sleep_phase: str) -> SleepPhase | None:
    # First, try the Apple camelCase mapping (real device data).
    phase = APPLE_SLEEP_PHASE_MAP.get(apple_sleep_phase)
    if phase is not None:
        return phase

    # Fall back to direct enum value lookup (e.g. "in_bed", "light", "deep")
    # to stay compatible with synthetic/test payloads that already use our values.
    try:
        return SleepPhase(apple_sleep_phase)
    except ValueError:
        return None
