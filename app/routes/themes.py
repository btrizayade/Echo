
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.theme import Theme
from app.schemas.capture import CaptureResponse
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


@router.get(
    "",
    response_model=list[ThemeResponse],
)
def list_themes(
    db: Session = Depends(get_db),
):
    statement = select(Theme).order_by(Theme.name)

    themes = db.execute(statement).scalars().all()

    return themes


@router.get(
    "/{theme_id}/captures",
    response_model=list[CaptureResponse],
)
def list_theme_captures(
    theme_id: int,
    db: Session = Depends(get_db),
):
    theme = db.get(Theme, theme_id)

    if theme is None:
        raise HTTPException(
            status_code=404,
            detail="Theme not found",
        )

    return theme.captures


@router.patch(
    "/{theme_id}",
    response_model=ThemeResponse,
)
def update_theme(
    theme_id: int,
    theme_data: ThemeCreate,
    db: Session = Depends(get_db),
):
    theme = db.get(Theme, theme_id)

    if theme is None:
        raise HTTPException(
            status_code=404,
            detail="Theme not found",
        )

    # Impede que dois temas tenham o mesmo nome.
    statement = select(Theme).where(
        Theme.name == theme_data.name,
        Theme.id != theme_id,
    )

    existing_theme = db.execute(statement).scalar_one_or_none()

    if existing_theme is not None:
        raise HTTPException(
            status_code=409,
            detail="Theme already exists",
        )

    theme.name = theme_data.name

    try:
        db.commit()
        db.refresh(theme)
    except Exception:
        db.rollback()
        raise

    return theme


@router.delete(
    "/{theme_id}",
    status_code=204,
)
def delete_theme(
    theme_id: int,
    db: Session = Depends(get_db),
) -> Response:
    theme = db.get(Theme, theme_id)

    if theme is None:
        raise HTTPException(
            status_code=404,
            detail="Theme not found",
        )

    try:
        # Remove apenas as associações com as capturas.
        # As capturas e seus arquivos são preservados.
        theme.captures.clear()

        db.delete(theme)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return Response(status_code=204)
