from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


class CaptureCreate(BaseModel):
    type: Literal["text"]
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Content cannot be empty")

        return value


class CaptureResponse(BaseModel):
    id: int
    type: str
    content: str
    created_at: datetime
    last_revisited_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
