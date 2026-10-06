from pydantic import BaseModel, ConfigDict, Field, field_validator


class ThemeCreate(BaseModel):
    name: str = Field(max_length=100)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Theme name cannot be empty")

        return value


class ThemeResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)
