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
