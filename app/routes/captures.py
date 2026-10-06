from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
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


@router.get(
    "",
    response_model=list[CaptureResponse],
)
def list_captures(
    db: Session = Depends(get_db),
):
    statement = select(Capture).order_by(Capture.created_at.desc())

    captures = db.execute(statement).scalars().all()

    return captures


@router.get(
    "/{capture_id}",
    response_model=CaptureResponse,
)
def get_capture(
    capture_id: int,
    db: Session = Depends(get_db),
):
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    return capture


@router.post(
    "/{capture_id}/revisit",
    response_model=CaptureResponse,
)
def revisit_capture(
    capture_id: int,
    db: Session = Depends(get_db),
):
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    capture.last_revisited_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(capture)

    return capture
