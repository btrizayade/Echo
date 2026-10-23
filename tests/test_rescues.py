from datetime import datetime, timedelta, timezone

from app.models.capture import Capture
from app.models.theme import Theme


def test_get_rescues_returns_empty_when_no_candidates_are_eligible(client):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "A recent idea that should not be rescued yet.",
        },
    )

    assert capture_response.status_code == 200

    response = client.get("/rescues")

    assert response.status_code == 200

    assert response.json() == []


def test_get_rescues_prioritizes_focus_and_excludes_recent_captures(
    client,
    db,
):
    now = datetime.now(timezone.utc)

    focus_theme = Theme(name="Rescue focus priority theme")

    focus_capture = Capture(
        type="text",
        content="Idea related to the current focus.",
        created_at=now - timedelta(days=40),
        last_revisited_at=now - timedelta(days=20),
        themes=[focus_theme],
    )

    never_revisited = Capture(
        type="text",
        content="Old idea never revisited.",
        created_at=now - timedelta(days=20),
        last_revisited_at=None,
    )

    older_revisited = Capture(
        type="text",
        content="Idea revisited a long time ago.",
        created_at=now - timedelta(days=60),
        last_revisited_at=now - timedelta(days=30),
    )

    recent_capture = Capture(
        type="text",
        content="Very recent idea.",
        created_at=now - timedelta(days=2),
        last_revisited_at=None,
    )

    db.add_all(
        [
            focus_theme,
            focus_capture,
            never_revisited,
            older_revisited,
            recent_capture,
        ]
    )
    db.commit()

    response = client.get(
        "/rescues",
        params={"focus_theme_ids": focus_theme.id},
    )

    assert response.status_code == 200

    rescued_ids = [
        capture["id"]
        for capture in response.json()
    ]

    assert focus_capture.id in rescued_ids
    assert never_revisited.id in rescued_ids
    assert older_revisited.id in rescued_ids
    assert recent_capture.id not in rescued_ids

    assert rescued_ids.index(focus_capture.id) < rescued_ids.index(
        never_revisited.id
    )
    assert rescued_ids.index(never_revisited.id) < rescued_ids.index(
        older_revisited.id
    )


def test_get_rescues_respects_limit(client):
    all_response = client.get(
        "/rescues",
        params={"limit": 20},
    )

    assert all_response.status_code == 200

    all_ids = [
        capture["id"]
        for capture in all_response.json()
    ]

    limited_response = client.get(
        "/rescues",
        params={"limit": 2},
    )

    assert limited_response.status_code == 200

    limited_ids = [
        capture["id"]
        for capture in limited_response.json()
    ]

    assert len(limited_ids) <= 2
    assert limited_ids == all_ids[:2]


def test_get_rescues_rejects_unknown_focus_theme(client):
    response = client.get(
        "/rescues",
        params={"focus_theme_ids": 999999},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Theme IDs not found: [999999]"
    )
