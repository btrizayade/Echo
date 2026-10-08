from app.models.capture import Capture
from app.models.theme import Theme


def test_capture_theme_relationship(db):
    capture = Capture(
        type="text",
        content="Uma ideia relacionada a memória.",
    )

    theme = Theme(
        name="Tema de relacionamento",
    )

    capture.themes.append(theme)

    db.add(capture)
    db.commit()
    db.refresh(capture)

    assert len(capture.themes) == 1
    assert capture.themes[0].name == "Tema de relacionamento"

    db.refresh(theme)

    assert len(theme.captures) == 1
    assert theme.captures[0].content == "Uma ideia relacionada a memória."


def test_add_theme_to_capture(client, db):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Uma captura para testar associacao.",
        },
    )

    assert capture_response.status_code == 200

    capture_id = capture_response.json()["id"]

    theme_response = client.post(
        "/themes",
        json={
            "name": "Associacao",
        },
    )

    assert theme_response.status_code == 201

    theme_id = theme_response.json()["id"]

    response = client.post(
        f"/captures/{capture_id}/themes/{theme_id}"
    )

    assert response.status_code == 200

    db.expire_all()

    capture = db.get(Capture, capture_id)

    assert capture is not None
    assert len(capture.themes) == 1
    assert capture.themes[0].id == theme_id
    assert capture.themes[0].name == "Associacao"


def test_add_theme_to_capture_capture_not_found(client):
    response = client.post(
        "/captures/999999/themes/1"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Capture not found"


def test_add_theme_to_capture_theme_not_found(client):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Outra captura para testar erro.",
        },
    )

    assert capture_response.status_code == 200

    capture_id = capture_response.json()["id"]

    response = client.post(
        f"/captures/{capture_id}/themes/999999"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Theme not found"


def test_add_theme_to_capture_duplicate(client):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Captura para testar duplicidade.",
        },
    )

    assert capture_response.status_code == 200

    capture_id = capture_response.json()["id"]

    theme_response = client.post(
        "/themes",
        json={
            "name": "Duplicidade",
        },
    )

    assert theme_response.status_code == 201

    theme_id = theme_response.json()["id"]

    first_response = client.post(
        f"/captures/{capture_id}/themes/{theme_id}"
    )

    assert first_response.status_code == 200

    second_response = client.post(
        f"/captures/{capture_id}/themes/{theme_id}"
    )

    assert second_response.status_code == 409
    assert (
        second_response.json()["detail"]
        == "Theme already associated with capture"
    )
