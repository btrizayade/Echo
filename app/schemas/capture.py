from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CaptureCreate(BaseModel):
    type: str
    content: str


class CaptureResponse(BaseModel):
    id: int
    type: str
    content: str
    created_at: datetime
    last_revisited_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
