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
