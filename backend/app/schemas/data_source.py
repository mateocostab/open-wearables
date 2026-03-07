from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.oauth import ProviderName


class DataSourceBase(BaseModel):
    user_id: UUID
    provider: ProviderName
    user_connection_id: UUID | None = None
    device_model: str | None = None
    software_version: str | None = None
    source: str | None = None
    device_type: str | None = None
    original_source_name: str | None = None


class DataSourceCreate(DataSourceBase):
    id: UUID


class DataSourceUpdate(BaseModel):
    provider: ProviderName | None = None
    user_connection_id: UUID | None = None
    device_model: str | None = None
    software_version: str | None = None
    source: str | None = None
    device_type: str | None = None
    original_source_name: str | None = None


class DataSourceResponse(BaseModel):
    id: UUID
    user_id: UUID
    provider: ProviderName
    user_connection_id: UUID | None = None
    device_model: str | None = None
    software_version: str | None = None
    source: str | None = None
    device_type: str | None = None
    original_source_name: str | None = None
    display_name: str | None = None

    model_config = {"from_attributes": True}


class DataSourceListResponse(BaseModel):
    items: list[DataSourceResponse]
    total: int


class MetricCoverage(BaseModel):
    series_type: str
    count: int
    earliest: datetime
    latest: datetime


class DataSourceCoverage(BaseModel):
    data_source_id: UUID
    display_name: str
    provider: ProviderName
    device_type: str | None = None
    device_model: str | None = None
    metrics: list[MetricCoverage]
    total_data_points: int
    earliest_data: datetime | None = None
    latest_data: datetime | None = None


class DataSourceCoverageListResponse(BaseModel):
    items: list[DataSourceCoverage]
