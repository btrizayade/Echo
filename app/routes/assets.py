
from pathlib import Path, PurePosixPath
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.capture import Capture
from app.models.capture_asset import CaptureAsset
from app.schemas.capture_asset import CaptureAssetResponse

from mutagen import File as MutagenFile
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4
from mutagen.oggopus import OggOpus
from mutagen.oggvorbis import OggVorbis
from mutagen.wave import WAVE
from PIL import Image


router = APIRouter(tags=["Assets"])

MEDIA_DIR = Path(__file__).resolve().parents[2] / "data" / "media"

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
CHUNK_SIZE_BYTES = 1024 * 1024

# MIME type -> tipo de mídia, MIME canônico,
# extensão interna e extensões originais permitidas.
ALLOWED_UPLOADS = {
    "image/jpeg": (
        "image", "image/jpeg", ".jpg", {".jpg", ".jpeg"}
    ),
    "image/png": (
        "image", "image/png", ".png", {".png"}
    ),
    "image/webp": (
        "image", "image/webp", ".webp", {".webp"}
    ),
    "image/gif": (
        "image", "image/gif", ".gif", {".gif"}
    ),
    "audio/mpeg": (
        "audio", "audio/mpeg", ".mp3", {".mp3"}
    ),
    "audio/wav": (
        "audio", "audio/wav", ".wav", {".wav"}
    ),
    "audio/x-wav": (
        "audio", "audio/wav", ".wav", {".wav"}
    ),
    "audio/ogg": (
        "audio", "audio/ogg", ".ogg", {".ogg"}
    ),
    "audio/mp4": (
        "audio", "audio/mp4", ".m4a", {".m4a", ".mp4"}
    ),
}


MAX_IMAGE_PIXELS = 40_000_000

IMAGE_FORMAT_BY_MIME = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WEBP",
    "image/gif": "GIF",
}

AUDIO_PARSERS_BY_MIME = {
    "audio/mpeg": (MP3,),
    "audio/wav": (WAVE,),
    "audio/ogg": (OggVorbis, OggOpus),
    "audio/mp4": (MP4,),
}


def _validate_image_file(path: Path, mime_type: str) -> None:
    expected_format = IMAGE_FORMAT_BY_MIME.get(mime_type)

    if expected_format is None:
        raise HTTPException(
            status_code=415,
            detail="Unsupported image format",
        )

    try:
        # Primeira abertura: confere a estrutura do arquivo.
        with Image.open(path) as image:
            if image.format != expected_format:
                raise HTTPException(
                    status_code=415,
                    detail="File content does not match its declared type",
                )

            total_pixels = (
                image.width
                * image.height
                * getattr(image, "n_frames", 1)
            )

            if total_pixels > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=413,
                    detail="Image dimensions exceed the supported limit",
                )

            image.verify()

        # Segunda abertura: decodifica todos os quadros.
        # É necessário reabrir depois de Image.verify().
        with Image.open(path) as image:
            if image.format != expected_format:
                raise HTTPException(
                    status_code=415,
                    detail="File content does not match its declared type",
                )

            for frame_index in range(getattr(image, "n_frames", 1)):
                image.seek(frame_index)
                image.load()

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=415,
            detail="Invalid or corrupted image file",
        ) from exc


def _validate_audio_file(path: Path, mime_type: str) -> None:
    expected_parsers = AUDIO_PARSERS_BY_MIME.get(mime_type)

    if expected_parsers is None:
        raise HTTPException(
            status_code=415,
            detail="Unsupported audio format",
        )

    try:
        audio = MutagenFile(path)
    except Exception as exc:
        raise HTTPException(
            status_code=415,
            detail="Invalid or corrupted audio file",
        ) from exc

    if audio is None or not isinstance(audio, expected_parsers):
        raise HTTPException(
            status_code=415,
            detail="File content does not match its declared type",
        )

    info = getattr(audio, "info", None)

    if info is None or getattr(info, "length", 0) <= 0:
        raise HTTPException(
            status_code=415,
            detail="Invalid or corrupted audio file",
        )


def _validate_media_content(
    path: Path,
    media_type: str,
    mime_type: str,
) -> None:
    if media_type == "image":
        _validate_image_file(path, mime_type)
    elif media_type == "audio":
        _validate_audio_file(path, mime_type)
    else:
        raise HTTPException(
            status_code=415,
            detail="Unsupported media type",
        )


def _asset_payload(asset: CaptureAsset) -> dict:
    return {
        "id": asset.id,
        "capture_id": asset.capture_id,
        "media_type": asset.media_type,
        "original_filename": asset.original_filename,
        "mime_type": asset.mime_type,
        "size_bytes": asset.size_bytes,
        "created_at": asset.created_at,
        "file_url": (
            f"/captures/{asset.capture_id}/assets/{asset.id}/file"
        ),
    }


@router.post(
    "/captures/{capture_id}/assets",
    response_model=CaptureAssetResponse,
    status_code=201,
)
async def upload_capture_asset(
    capture_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    capture = db.get(Capture, capture_id)

    if capture is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    original_filename = PurePosixPath(
        (file.filename or "").replace("\\", "/")
    ).name

    if (
        not original_filename
        or original_filename in {".", ".."}
        or len(original_filename) > 255
    ):
        raise HTTPException(
            status_code=422,
            detail="Invalid filename",
        )

    content_type = (
        (file.content_type or "")
        .split(";", 1)[0]
        .strip()
        .lower()
    )

    upload_config = ALLOWED_UPLOADS.get(content_type)

    if upload_config is None:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type",
        )

    media_type, canonical_mime, stored_extension, allowed_extensions = (
        upload_config
    )

    original_extension = PurePosixPath(
        original_filename
    ).suffix.lower()

    if original_extension not in allowed_extensions:
        raise HTTPException(
            status_code=415,
            detail="File extension does not match the supported type",
        )

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    # O nome físico é gerado pelo servidor, não pelo usuário.
    stored_filename = f"{uuid4().hex}{stored_extension}"
    stored_path = MEDIA_DIR / stored_filename
    size_bytes = 0

    try:
        with stored_path.open("xb") as destination:
            while True:
                chunk = await file.read(CHUNK_SIZE_BYTES)

                if not chunk:
                    break

                size_bytes += len(chunk)

                if size_bytes > MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="File exceeds the 25 MB limit",
                    )

                destination.write(chunk)

        if size_bytes == 0:
            raise HTTPException(
                status_code=422,
                detail="Uploaded file is empty",
            )

        _validate_media_content(
            stored_path,
            media_type,
            canonical_mime,
        )

        asset = CaptureAsset(
            capture_id=capture_id,
            media_type=media_type,
            original_filename=original_filename,
            stored_filename=stored_filename,
            mime_type=canonical_mime,
            size_bytes=size_bytes,
        )

        db.add(asset)
        db.commit()
        db.refresh(asset)

        return _asset_payload(asset)

    except HTTPException:
        db.rollback()
        stored_path.unlink(missing_ok=True)
        raise

    except Exception:
        db.rollback()
        stored_path.unlink(missing_ok=True)
        raise

    finally:
        await file.close()


@router.get(
    "/captures/{capture_id}/assets",
    response_model=list[CaptureAssetResponse],
)
def list_capture_assets(
    capture_id: int,
    db: Session = Depends(get_db),
):
    if db.get(Capture, capture_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Capture not found",
        )

    statement = (
        select(CaptureAsset)
        .where(CaptureAsset.capture_id == capture_id)
        .order_by(CaptureAsset.created_at, CaptureAsset.id)
    )

    assets = db.execute(statement).scalars().all()

    return [_asset_payload(asset) for asset in assets]


@router.get("/captures/{capture_id}/assets/{asset_id}/file")
def get_capture_asset_file(
    capture_id: int,
    asset_id: int,
    db: Session = Depends(get_db),
):
    statement = select(CaptureAsset).where(
        CaptureAsset.id == asset_id,
        CaptureAsset.capture_id == capture_id,
    )

    asset = db.execute(statement).scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found",
        )

    file_path = MEDIA_DIR / asset.stored_filename

    if not file_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Asset file not found on disk",
        )

    return FileResponse(
        path=file_path,
        media_type=asset.mime_type,
        headers={"X-Content-Type-Options": "nosniff"},
    )
