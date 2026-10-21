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


def test_get_capture_includes_themes(client):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Uma ideia sobre memoria e criatividade.",
        },
    )

    assert capture_response.status_code == 200
    capture_id = capture_response.json()["id"]

    theme_response = client.post(
        "/themes",
        json={
            "name": "Tema incluido na resposta",
        },
    )

    assert theme_response.status_code == 201
    theme_id = theme_response.json()["id"]

    association_response = client.post(
        f"/captures/{capture_id}/themes/{theme_id}"
    )

    assert association_response.status_code == 200

    response = client.get(f"/captures/{capture_id}")

    assert response.status_code == 200

    data = response.json()

    assert len(data["themes"]) == 1
    assert data["themes"][0]["id"] == theme_id
    assert data["themes"][0]["name"] == "Tema incluido na resposta"


def test_remove_theme_from_capture(client):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Capture for removal test.",
        },
    )

    assert capture_response.status_code == 200
    capture_id = capture_response.json()["id"]

    theme_response = client.post(
        "/themes",
        json={
            "name": "Theme for removal test",
        },
    )

    assert theme_response.status_code == 201
    theme_id = theme_response.json()["id"]

    association_response = client.post(
        f"/captures/{capture_id}/themes/{theme_id}"
    )

    assert association_response.status_code == 200

    response = client.delete(
        f"/captures/{capture_id}/themes/{theme_id}"
    )

    assert response.status_code == 204
    assert response.content == b""

    capture_response = client.get(f"/captures/{capture_id}")

    assert capture_response.status_code == 200
    assert capture_response.json()["themes"] == []

    themes_response = client.get("/themes")

    assert themes_response.status_code == 200
    theme_ids = [theme["id"] for theme in themes_response.json()]
    assert theme_id in theme_ids


def test_remove_theme_from_capture_capture_not_found(client):
    response = client.delete(
        "/captures/999999/themes/1"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Capture not found"


def test_remove_theme_from_capture_theme_not_found(client):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Capture for missing theme test.",
        },
    )

    assert capture_response.status_code == 200
    capture_id = capture_response.json()["id"]

    response = client.delete(
        f"/captures/{capture_id}/themes/999999"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Theme not found"


def test_remove_unassociated_theme_from_capture(client):
    capture_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Capture without associated theme.",
        },
    )

    assert capture_response.status_code == 200
    capture_id = capture_response.json()["id"]

    theme_response = client.post(
        "/themes",
        json={
            "name": "Unassociated theme",
        },
    )

    assert theme_response.status_code == 201
    theme_id = theme_response.json()["id"]

    response = client.delete(
        f"/captures/{capture_id}/themes/{theme_id}"
    )

    assert response.status_code == 404
    assert (
        response.json()["detail"]
        == "Theme not associated with capture"
    )
