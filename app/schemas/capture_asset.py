from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CaptureAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    capture_id: int
    media_type: str
    original_filename: str
    mime_type: str
    size_bytes: int
    created_at: datetime
    file_url: str