from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.theme import Theme
from app.schemas.theme import ThemeCreate, ThemeResponse


router = APIRouter(
    prefix="/themes",
    tags=["themes"],
)


@router.post(
    "",
    response_model=ThemeResponse,
    status_code=201,
)
def create_theme(
    theme: ThemeCreate,
    db: Session = Depends(get_db),
):
    statement = select(Theme).where(Theme.name == theme.name)
    existing_theme = db.execute(statement).scalar_one_or_none()

    if existing_theme is not None:
        raise HTTPException(
            status_code=409,
            detail="Theme already exists",
        )

    new_theme = Theme(
        name=theme.name,
    )

    db.add(new_theme)
    db.commit()
    db.refresh(new_theme)

    return new_theme
