from sqlalchemy import Column, ForeignKey, Integer, Table

from app.database.database import Base


capture_themes = Table(
    "capture_themes",
    Base.metadata,
    Column(
        "capture_id",
        Integer,
        ForeignKey("captures.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "theme_id",
        Integer,
        ForeignKey("themes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)
