from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


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
