from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.database import get_db
from app.models.capture import Capture
from app.models.theme import Theme
from app.models.rescue_event import RescueEvent
from app.schemas.rescue_event import (
    RescueEventEvaluation,
    RescueEventResponse,
)
from app.schemas.capture import CaptureResponse
from app.services.rescue import rank_captures, score_capture


router = APIRouter(
    prefix="/rescues",
    tags=["rescues"],
)


@router.get(
    "",
    response_model=list[CaptureResponse],
)
def get_rescues(
    limit: int = Query(default=5, ge=1, le=20),
    focus_theme_ids: list[int] = Query(default=[]),
    db: Session = Depends(get_db),
):
    selected_focus_ids = set(focus_theme_ids)

    if selected_focus_ids:
        statement = select(Theme.id).where(
            Theme.id.in_(selected_focus_ids)
        )
        existing_theme_ids = set(db.execute(statement).scalars().all())

        missing_ids = sorted(selected_focus_ids - existing_theme_ids)

        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"Theme IDs not found: {missing_ids}",
            )

    statement = select(Capture).options(
        selectinload(Capture.themes)
    )
    captures = db.execute(statement).scalars().all()

    ranked_captures = rank_captures(
        captures,
        now=datetime.now(timezone.utc),
        focus_theme_ids=selected_focus_ids,
    )

    return ranked_captures[:limit]


@router.post(
    "/{capture_id}/events",
    response_model=RescueEventResponse,
    status_code=201,
)
def record_rescue_event(
    capture_id: int,
    focus_theme_ids: list[int] = Query(default=[]),
    db: Session = Depends(get_db),
):
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    selected_focus_ids = set(focus_theme_ids)

    if selected_focus_ids:
        statement = select(Theme.id).where(
            Theme.id.in_(selected_focus_ids)
        )
        existing_theme_ids = set(
            db.execute(statement).scalars().all()
        )

        missing_ids = sorted(
            selected_focus_ids - existing_theme_ids
        )

        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"Theme IDs not found: {missing_ids}",
            )

    now = datetime.now(timezone.utc)

    score = score_capture(
        capture,
        now=now,
        focus_theme_ids=selected_focus_ids,
    )

    if score is None:
        raise HTTPException(
            status_code=409,
            detail="Capture is not eligible for rescue",
        )

    event = RescueEvent(
        capture_id=capture.id,
        score_at_rescue=score,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.patch(
    "/events/{event_id}",
    response_model=RescueEventResponse,
)
def evaluate_rescue_event(
    event_id: int,
    evaluation: RescueEventEvaluation,
    db: Session = Depends(get_db),
):
    event = db.get(RescueEvent, event_id)

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Rescue event not found",
        )

    event.used = evaluation.used

    db.commit()
    db.refresh(event)

    return event
