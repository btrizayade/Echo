from collections.abc import Iterable
from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.capture import Capture


# Initial ranking parameters; we can tune these through experiments.
MIN_DAYS_UNATTENDED = 7
MAX_AGE_POINTS = 60
NEVER_REVISITED_BONUS = 14
FOCUS_MATCH_BONUS = 20
RESCUE_REPEAT_COOLDOWN_DAYS = 7


def _normalize_datetime(value: datetime) -> datetime:
    """Normalize datetimes to UTC without timezone information."""
    if value.tzinfo is None:
        # SQLite may return datetimes without timezone information.
        return value

    return value.astimezone(timezone.utc).replace(tzinfo=None)


def _days_since_attention(
    capture: "Capture",
    now: datetime,
) -> int:
    """Return whole days since creation or the last revisit."""
    reference_date = (
        capture.last_revisited_at
        if capture.last_revisited_at is not None
        else capture.created_at
    )

    elapsed = (
        _normalize_datetime(now)
        - _normalize_datetime(reference_date)
    )

    return max(elapsed.days, 0)


def score_capture(
    capture: "Capture",
    now: datetime,
    focus_theme_ids: set[int] | None = None,
) -> int | None:
    """
    Score a capture for rescue.

    Return None when it is too recent to be eligible.
    """
    days_unattended = _days_since_attention(capture, now)

    if days_unattended < MIN_DAYS_UNATTENDED:
        return None

    score = min(days_unattended, MAX_AGE_POINTS)

    if capture.last_revisited_at is None:
        score += NEVER_REVISITED_BONUS

    selected_theme_ids = focus_theme_ids or set()

    has_focus_match = any(
        theme.id in selected_theme_ids
        for theme in capture.themes
    )

    if has_focus_match:
        # Apply the bonus once, even if multiple themes match.
        score += FOCUS_MATCH_BONUS

    return score


def rank_captures(
    captures: Iterable["Capture"],
    now: datetime,
    focus_theme_ids: set[int] | None = None,
) -> list["Capture"]:
    """Return eligible captures from highest to lowest rescue score."""
    ranked = []

    for capture in captures:
        score = score_capture(
            capture,
            now,
            focus_theme_ids,
        )

        if score is None:
            continue

        days_unattended = _days_since_attention(capture, now)

        ranked.append(
            (
                capture,
                score,
                days_unattended,
                _normalize_datetime(capture.created_at),
            )
        )

    # Tie-breakers: more days unattended, older creation date,
    # and finally lower ID for a stable result.
    ranked.sort(
        key=lambda item: (
            -item[1],
            -item[2],
            item[3],
            item[0].id or 0,
        )
    )

    return [item[0] for item in ranked]