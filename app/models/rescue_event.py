from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class RescueEvent(Base):
    __tablename__ = "rescue_events"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    capture_id: Mapped[int] = mapped_column(
        ForeignKey("captures.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    presented_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    score_at_rescue: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    used: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
        default=None,
    )