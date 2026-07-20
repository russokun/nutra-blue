import os

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")

# Bytes suficientes para pasar el sniff de tipo PNG (no necesita ser una imagen valida para el test).
FAKE_PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"0" * 100


@pytest.fixture
def cleanup_uploaded_files():
    created_paths = []
    yield created_paths
    for path in created_paths:
        if os.path.exists(path):
            os.remove(path)


def auth_headers():
    return {"Authorization": "Bearer mock-admin-token"}


def test_upload_requires_auth():
    response = client.post(
        "/admin/products/upload-image",
        files={"file": ("product.png", FAKE_PNG_BYTES, "image/png")},
    )
    assert response.status_code == 401


def test_upload_rejects_invalid_extension():
    response = client.post(
        "/admin/products/upload-image",
        files={"file": ("product.exe", FAKE_PNG_BYTES, "application/octet-stream")},
        headers=auth_headers(),
    )
    assert response.status_code == 400
    assert "Formato de imagen no permitido" in response.json()["detail"]


def test_upload_rejects_oversized_file():
    oversized = b"0" * (10 * 1024 * 1024 + 1)
    response = client.post(
        "/admin/products/upload-image",
        files={"file": ("product.png", oversized, "image/png")},
        headers=auth_headers(),
    )
    assert response.status_code == 400
    assert "10 MB" in response.json()["detail"]


def test_upload_succeeds_and_is_served_locally(cleanup_uploaded_files):
    response = client.post(
        "/admin/products/upload-image",
        files={"file": ("product.png", FAKE_PNG_BYTES, "image/png")},
        headers=auth_headers(),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["image_url"].startswith("/uploads/")

    filename = data["image_url"].split("/uploads/", 1)[1]
    cleanup_uploaded_files.append(os.path.join(UPLOAD_DIR, filename))

    served = client.get(data["image_url"])
    assert served.status_code == 200
    assert served.content == FAKE_PNG_BYTES
