def test_create_theme(client):
    response = client.post(
        "/themes",
        json={
            "name": "Memória",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] is not None
    assert data["name"] == "Memória"


def test_create_theme_duplicate(client):
    client.post(
        "/themes",
        json={
            "name": "Criatividade",
        },
    )

    response = client.post(
        "/themes",
        json={
            "name": "Criatividade",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Theme already exists"


def test_create_theme_empty_name(client):
    response = client.post(
        "/themes",
        json={
            "name": "   ",
        },
    )

    assert response.status_code == 422
