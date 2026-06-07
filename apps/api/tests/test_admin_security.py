from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_admin_orders_requires_auth():
    response = client.get("/admin/orders")
    assert response.status_code == 401


def test_admin_products_requires_auth():
    response = client.get("/admin/products")
    assert response.status_code == 401


def test_auth_me_unauthenticated():
    response = client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is False
