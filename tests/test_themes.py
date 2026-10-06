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


def test_list_themes(client):
    client.post(
        "/themes",
        json={
            "name": "Zoologia",
        },
    )

    client.post(
        "/themes",
        json={
            "name": "Arte",
        },
    )

    response = client.get("/themes")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    names = [theme["name"] for theme in data]

    assert "Zoologia" in names
    assert "Arte" in names

    assert names.index("Arte") < names.index("Zoologia")
