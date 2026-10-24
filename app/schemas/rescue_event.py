from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RescueEventResponse(BaseModel):
    id: int
    capture_id: int
    presented_at: datetime
    score_at_rescue: int
    used: bool | None

    model_config = ConfigDict(from_attributes=True)


class RescueEventEvaluation(BaseModel):
    used: bool
