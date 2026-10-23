from datetime import datetime, timedelta, timezone

from app.models.capture import Capture
from app.models.theme import Theme
from app.services.rescue import rank_captures, score_capture


NOW = datetime(2026, 10, 22, 12, 0, tzinfo=timezone.utc)


def make_capture(
    capture_id: int,
    created_days_ago: int,
    last_revisited_days_ago: int | None = None,
    themes: list[Theme] | None = None,
) -> Capture:
    return Capture(
        id=capture_id,
        type="text",
        content=f"Capture {capture_id}",
        created_at=NOW - timedelta(days=created_days_ago),
        last_revisited_at=(
            NOW - timedelta(days=last_revisited_days_ago)
            if last_revisited_days_ago is not None
            else None
        ),
        themes=themes or [],
    )


def test_recent_capture_is_not_eligible_for_rescue():
    capture = make_capture(
        capture_id=1,
        created_days_ago=6,
    )

    assert score_capture(capture, NOW) is None


def test_never_revisited_capture_gets_bonus():
    capture = make_capture(
        capture_id=1,
        created_days_ago=10,
    )

    assert score_capture(capture, NOW) == 24


def test_last_revisit_determines_days_without_attention():
    capture = make_capture(
        capture_id=1,
        created_days_ago=100,
        last_revisited_days_ago=8,
    )

    assert score_capture(capture, NOW) == 8


def test_matching_focus_adds_bonus_only_once():
    capture = make_capture(
        capture_id=1,
        created_days_ago=30,
        last_revisited_days_ago=10,
        themes=[
            Theme(id=1, name="Memória"),
            Theme(id=2, name="Tecnologia"),
        ],
    )

    score = score_capture(
        capture,
        NOW,
        focus_theme_ids={1, 2},
    )

    assert score == 30


def test_age_points_are_capped_at_60():
    capture = make_capture(
        capture_id=1,
        created_days_ago=100,
        last_revisited_days_ago=100,
    )

    assert score_capture(capture, NOW) == 60


def test_rank_captures_prioritizes_score_and_excludes_recent_ones():
    never_revisited = make_capture(
        capture_id=1,
        created_days_ago=20,
    )

    revisited_long_ago = make_capture(
        capture_id=2,
        created_days_ago=60,
        last_revisited_days_ago=30,
    )

    focus_match = make_capture(
        capture_id=3,
        created_days_ago=40,
        last_revisited_days_ago=10,
        themes=[Theme(id=9, name="Projeto atual")],
    )

    recent_capture = make_capture(
        capture_id=4,
        created_days_ago=2,
    )

    ranked = rank_captures(
        [
            revisited_long_ago,
            recent_capture,
            focus_match,
            never_revisited,
        ],
        NOW,
        focus_theme_ids={9},
    )

    assert [capture.id for capture in ranked] == [1, 2, 3]