from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base
from app.models.association import capture_themes


if TYPE_CHECKING:
    from app.models.theme import Theme
    from app.models.capture_asset import CaptureAsset

class Capture(Base):
    __tablename__ = "captures"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(180),
        nullable=False,
        default="",
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    last_revisited_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    themes: Mapped[list["Theme"]] = relationship(
        secondary=capture_themes,
        back_populates="captures",
    )

    assets: Mapped[list["CaptureAsset"]] = relationship(
        back_populates="capture",
        cascade="all, delete-orphan",
    )
