from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base
from app.models.association import capture_themes


if TYPE_CHECKING:
    from app.models.capture import Capture

class Theme(Base):
    __tablename__ = "themes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
    )

    captures: Mapped[list["Capture"]] = relationship(
        secondary=capture_themes,
        back_populates="themes",
    )
