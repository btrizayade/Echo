
import logging
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.capture import Capture
from app.models.rescue_event import RescueEvent
from app.models.theme import Theme
from app.schemas.capture import (
    CaptureCreate,
    CaptureResponse,
    CaptureUpdate,
)


router = APIRouter(
    prefix="/captures",
    tags=["captures"],
)

logger = logging.getLogger(__name__)

MEDIA_DIR = Path(__file__).resolve().parents[2] / "data" / "media"


@router.post(
    "",
    response_model=CaptureResponse,
)
def create_capture(
    capture: CaptureCreate,
    db: Session = Depends(get_db),
):
    # Rejeita IDs de temas repetidos.
    if len(capture.theme_ids) != len(set(capture.theme_ids)):
        raise HTTPException(
            status_code=422,
            detail="Duplicate theme IDs are not allowed",
        )

    # Busca os temas solicitados.
    themes = []

    if capture.theme_ids:
        statement = select(Theme).where(
            Theme.id.in_(capture.theme_ids)
        )

        result = db.execute(statement).scalars().all()
        themes_by_id = {
            theme.id: theme for theme in result
        }

        missing_ids = [
            theme_id
            for theme_id in capture.theme_ids
            if theme_id not in themes_by_id
        ]

        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"Theme IDs not found: {missing_ids}",
            )

        # Preserva a ordem dos IDs enviados pelo usuário.
        themes = [
            themes_by_id[theme_id]
            for theme_id in capture.theme_ids
        ]

    # Mantém compatibilidade com requisições sem título.
    if capture.title:
        title = capture.title
    elif capture.content:
        title = capture.content.strip()[:180]
    elif capture.type == "image":
        title = "Captura de imagem"
    else:
        title = "Captura de áudio"

    new_capture = Capture(
        type=capture.type,
        title=title,
        content=capture.content or "",
        themes=themes,
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
    statement = select(Capture).order_by(
        Capture.created_at.desc()
    )

    return db.execute(statement).scalars().all()


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


@router.patch(
    "/{capture_id}",
    response_model=CaptureResponse,
)
def update_capture(
    capture_id: int,
    updates: CaptureUpdate,
    db: Session = Depends(get_db),
):
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    # Identifica quais campos foram enviados na requisição.
    fields = updates.model_fields_set

    # Permite uma requisição sem alterações.
    if not fields:
        return capture

    # Atualiza o título somente se ele foi enviado.
    if "title" in fields:
        if updates.title is None:
            raise HTTPException(
                status_code=422,
                detail="Title cannot be null",
            )

        capture.title = updates.title

    # Atualiza o conteúdo somente se ele foi enviado.
    if "content" in fields:
        if updates.content is None:
            raise HTTPException(
                status_code=422,
                detail="Content cannot be null",
            )

        capture.content = updates.content

    # Capturas de texto precisam continuar tendo conteúdo.
    if capture.type == "text" and not capture.content.strip():
        raise HTTPException(
            status_code=422,
            detail="Text captures require non-empty content",
        )

    # Atualiza os temas somente quando theme_ids foi enviado.
    if "theme_ids" in fields:
        if updates.theme_ids is None:
            raise HTTPException(
                status_code=422,
                detail="Theme IDs cannot be null",
            )

        if len(updates.theme_ids) != len(set(updates.theme_ids)):
            raise HTTPException(
                status_code=422,
                detail="Duplicate theme IDs are not allowed",
            )

        themes = []

        if updates.theme_ids:
            statement = select(Theme).where(
                Theme.id.in_(updates.theme_ids)
            )

            result = db.execute(statement).scalars().all()

            themes_by_id = {
                theme.id: theme for theme in result
            }

            missing_ids = [
                theme_id
                for theme_id in updates.theme_ids
                if theme_id not in themes_by_id
            ]

            if missing_ids:
                raise HTTPException(
                    status_code=404,
                    detail=f"Theme IDs not found: {missing_ids}",
                )

            # Preserva a ordem dos temas enviados.
            themes = [
                themes_by_id[theme_id]
                for theme_id in updates.theme_ids
            ]

        capture.themes = themes

    try:
        db.commit()
        db.refresh(capture)
    except Exception:
        db.rollback()
        raise

    return capture


@router.delete(
    "/{capture_id}",
    status_code=204,
)
def delete_capture(
    capture_id: int,
    db: Session = Depends(get_db),
) -> Response:
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    # Guarda os nomes antes da exclusão dos registros.
    stored_filenames = [
        asset.stored_filename
        for asset in capture.assets
    ]

    try:
        # Remove os eventos de resgate associados.
        db.execute(
            delete(RescueEvent).where(
                RescueEvent.capture_id == capture_id
            )
        )

        # A relação da captura exclui os anexos do banco.
        db.delete(capture)
        db.commit()

    except Exception:
        db.rollback()
        raise

    # Remove os arquivos físicos após confirmar a exclusão
    # dos registros no banco de dados.
    for filename in stored_filenames:
        file_path = MEDIA_DIR / filename

        try:
            file_path.unlink(missing_ok=True)
        except OSError:
            logger.exception(
                "Não foi possível remover o arquivo de mídia: %s",
                file_path,
            )

    return Response(status_code=204)

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


@router.post(
    "/{capture_id}/themes/{theme_id}",
    response_model=CaptureResponse,
)
def add_theme_to_capture(
    capture_id: int,
    theme_id: int,
    db: Session = Depends(get_db),
):
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    theme = db.get(Theme, theme_id)

    if theme is None:
        raise HTTPException(
            status_code=404,
            detail="Theme not found",
        )

    if theme in capture.themes:
        raise HTTPException(
            status_code=409,
            detail="Theme already associated with capture",
        )

    capture.themes.append(theme)

    db.commit()
    db.refresh(capture)

    return capture


@router.delete(
    "/{capture_id}/themes/{theme_id}",
    status_code=204,
)
def remove_theme_from_capture(
    capture_id: int,
    theme_id: int,
    db: Session = Depends(get_db),
) -> Response:
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    theme = db.get(Theme, theme_id)

    if theme is None:
        raise HTTPException(
            status_code=404,
            detail="Theme not found",
        )

    if theme not in capture.themes:
        raise HTTPException(
            status_code=404,
            detail="Theme not associated with capture",
        )

    capture.themes.remove(theme)

    db.commit()

    return Response(status_code=204)
