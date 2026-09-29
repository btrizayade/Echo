from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.capture import Capture
from app.schemas.capture import CaptureCreate, CaptureResponse


router = APIRouter(
    prefix="/captures",
    tags=["captures"],
)


@router.post(
    "",
    response_model=CaptureResponse,
)
def create_capture(
    capture: CaptureCreate,
    db: Session = Depends(get_db),
):
    new_capture = Capture(
        type=capture.type,
        content=capture.content,
    )

    db.add(new_capture)
    db.commit()
    db.refresh(new_capture)

    return new_capture
