
def create_capture(client):
    response = client.post(
        "/captures",
        json={
            "type": "text",
            "content": "Captura de teste para arquivos multimídia",
        },
    )

    assert response.status_code == 200
    return response.json()["id"]


def test_upload_and_read_image(client, tmp_path, monkeypatch):
    monkeypatch.setattr("app.routes.assets.MEDIA_DIR", tmp_path)

    capture_id = create_capture(client)
    image_bytes = b"\x89PNG\r\n\x1a\nEcho test image"

    response = client.post(
        f"/captures/{capture_id}/assets",
        files={
            "file": (
                "reference.png",
                image_bytes,
                "image/png",
            )
        },
    )

    assert response.status_code == 201

    asset = response.json()
    assert asset["capture_id"] == capture_id
    assert asset["media_type"] == "image"
    assert asset["original_filename"] == "reference.png"
    assert asset["size_bytes"] == len(image_bytes)

    listed = client.get(f"/captures/{capture_id}/assets")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    file_response = client.get(asset["file_url"])
    assert file_response.status_code == 200
    assert file_response.content == image_bytes
    assert file_response.headers["content-type"] == "image/png"


def test_upload_audio(client, tmp_path, monkeypatch):
    monkeypatch.setattr("app.routes.assets.MEDIA_DIR", tmp_path)

    capture_id = create_capture(client)

    response = client.post(
        f"/captures/{capture_id}/assets",
        files={
            "file": (
                "voice-note.mp3",
                b"ID3 Echo audio test fixture",
                "audio/mpeg",
            )
        },
    )

    assert response.status_code == 201
    assert response.json()["media_type"] == "audio"
    assert response.json()["mime_type"] == "audio/mpeg"


def test_upload_rejects_unsupported_type(
    client,
    tmp_path,
    monkeypatch,
):
    monkeypatch.setattr("app.routes.assets.MEDIA_DIR", tmp_path)

    capture_id = create_capture(client)

    response = client.post(
        f"/captures/{capture_id}/assets",
        files={
            "file": (
                "script.exe",
                b"not an accepted media file",
                "application/octet-stream",
            )
        },
    )

    assert response.status_code == 415
    assert list(tmp_path.iterdir()) == []
