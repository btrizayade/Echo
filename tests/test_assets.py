from io import BytesIO
import wave

from PIL import Image


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


def create_png_bytes():
    buffer = BytesIO()

    image = Image.new(
        "RGB",
        (2, 2),
        color=(120, 80, 180),
    )
    image.save(buffer, format="PNG")

    return buffer.getvalue()


def create_wav_bytes():
    buffer = BytesIO()

    with wave.open(buffer, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(8000)
        audio.writeframes(b"\x00\x00" * 800)

    return buffer.getvalue()


def test_upload_and_read_image(client, tmp_path, monkeypatch):
    monkeypatch.setattr("app.routes.assets.MEDIA_DIR", tmp_path)

    capture_id = create_capture(client)
    image_bytes = create_png_bytes()

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
    audio_bytes = create_wav_bytes()

    response = client.post(
        f"/captures/{capture_id}/assets",
        files={
            "file": (
                "voice-note.wav",
                audio_bytes,
                "audio/wav",
            )
        },
    )

    assert response.status_code == 201
    assert response.json()["media_type"] == "audio"
    assert response.json()["mime_type"] == "audio/wav"


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


def test_upload_rejects_corrupted_image(
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
                "broken.png",
                b"this is not a real PNG image",
                "image/png",
            )
        },
    )

    assert response.status_code == 415
    assert list(tmp_path.iterdir()) == []


def test_upload_rejects_corrupted_audio(
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
                "broken.wav",
                b"this is not a valid WAV file",
                "audio/wav",
            )
        },
    )

    assert response.status_code == 415
    assert list(tmp_path.iterdir()) == []


def test_upload_rejects_file_over_size_limit(
    client,
    tmp_path,
    monkeypatch,
):
    monkeypatch.setattr("app.routes.assets.MEDIA_DIR", tmp_path)
    monkeypatch.setattr(
        "app.routes.assets.MAX_FILE_SIZE_BYTES",
        10,
    )

    capture_id = create_capture(client)

    response = client.post(
        f"/captures/{capture_id}/assets",
        files={
            "file": (
                "too-large.png",
                b"x" * 11,
                "image/png",
            )
        },
    )

    assert response.status_code == 413
    assert list(tmp_path.iterdir()) == []


def test_upload_rejects_mismatched_image_type(
    client,
    tmp_path,
    monkeypatch,
):
    monkeypatch.setattr("app.routes.assets.MEDIA_DIR", tmp_path)

    capture_id = create_capture(client)
    image_bytes = create_png_bytes()

    response = client.post(
        f"/captures/{capture_id}/assets",
        files={
            "file": (
                "reference.jpg",
                image_bytes,
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 415
    assert list(tmp_path.iterdir()) == []
