from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CaptureCreate(BaseModel):
    type: Literal["text"]
    content: str
    theme_ids: list[int] = Field(default_factory=list)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Content cannot be empty")

        return value


class ThemeSummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CaptureResponse(BaseModel):
    id: int
    type: str
    content: str
    created_at: datetime
    last_revisited_at: datetime | None
    themes: list[ThemeSummary]

    model_config = ConfigDict(from_attributes=True)
