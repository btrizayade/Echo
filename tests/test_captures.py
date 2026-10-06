def test_create_text_capture(client):
    response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Uma ideia que quero guardar.",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["type"] == "text"
    assert data["content"] == "Uma ideia que quero guardar."
    assert data["id"] is not None
    assert data["created_at"] is not None
    assert data["last_revisited_at"] is None


def test_list_captures(client):
    expected_content = "Outra ideia para testar a listagem."

    create_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": expected_content,
        },
    )

    assert create_response.status_code == 200

    response = client.get("/captures")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert any(
        capture["content"] == expected_content
        for capture in data
    )


def test_get_capture(client):
    create_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Uma captura para buscar pelo ID.",
        },
    )

    assert create_response.status_code == 200

    created_capture = create_response.json()
    capture_id = created_capture["id"]

    response = client.get(f"/captures/{capture_id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == capture_id
    assert data["type"] == "text"
    assert data["content"] == "Uma captura para buscar pelo ID."


def test_get_capture_not_found(client):
    response = client.get("/captures/999999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Capture not found"


def test_create_capture_invalid_type(client):
    response = client.post(
        "/captures",
        json={
            "type": "audio",
            "content": "Uma captura com tipo inválido.",
        },
    )

    assert response.status_code == 422


def test_create_capture_empty_content(client):
    response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "   ",
        },
    )

    assert response.status_code == 422


def test_revisit_capture(client):
    create_response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Uma captura para testar revisita.",
        },
    )

    assert create_response.status_code == 200

    created_capture = create_response.json()
    capture_id = created_capture["id"]

    assert created_capture["last_revisited_at"] is None

    response = client.post(
        f"/captures/{capture_id}/revisit"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == capture_id
    assert data["last_revisited_at"] is not None


def test_revisit_capture_not_found(client):
    response = client.post(
        "/captures/999999/revisit"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Capture not found"
