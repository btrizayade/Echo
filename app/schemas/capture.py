
from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class CaptureCreate(BaseModel):
    type: Literal["text", "image", "audio"]
    title: str | None = None
    content: str | None = None
    theme_ids: list[int] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(
        cls,
        value: str | None,
    ) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Title cannot be blank.")

        return value.strip() if value is not None else None

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(
        cls,
        value: str | None,
    ) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Content cannot be blank.")

        return value

    @model_validator(mode="after")
    def text_capture_requires_content(self):
        if self.type == "text" and self.content is None:
            raise ValueError(
                "Text captures require non-empty content."
            )

        return self


class CaptureUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    theme_ids: list[int] | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(
        cls,
        value: str | None,
    ) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Title cannot be blank.")

        return value.strip() if value is not None else None

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(
        cls,
        value: str | None,
    ) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Content cannot be blank.")

        return value


class ThemeSummary(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class CaptureResponse(BaseModel):
    id: int
    type: Literal["text", "image", "audio"]
    title: str
    content: str
    created_at: datetime
    last_revisited_at: datetime | None
    themes: list[ThemeSummary]

    model_config = ConfigDict(from_attributes=True)
