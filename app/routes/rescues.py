from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database.database import get_db
from app.models.capture import Capture
from app.models.theme import Theme
from app.schemas.capture import CaptureResponse
from app.services.rescue import rank_captures


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