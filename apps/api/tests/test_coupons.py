"""Pruebas para validación de cupones y regla de primera compra."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app
from app.core.mock_store import MOCK_ORDERS

client = TestClient(app)


def test_validate_coupon_welcome15_success():
    """WELCOME15 debe ser válido con 15% de descuento."""
    response = client.get("/coupons/validate/WELCOME15")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "WELCOME15"
    assert data["discount"] == 15
    assert data["valid"] is True
    assert data["first_purchase_only"] is True


def test_validate_coupon_case_insensitive():
    """La validación debe ser insensible a mayúsculas/minúsculas."""
    response = client.get("/coupons/validate/welcome15")
    assert response.status_code == 200
    assert response.json()["code"] == "WELCOME15"


def test_validate_coupon_bienvenida15_alias():
    """BIENVENIDA15 debe funcionar como alias de primera compra."""
    response = client.get("/coupons/validate/BIENVENIDA15")
    assert response.status_code == 200
    data = response.json()
    assert data["discount"] == 15
    assert data["first_purchase_only"] is True


def test_validate_coupon_not_found():
    """Un cupón que no existe debe retornar 404."""
    response = client.get("/coupons/validate/CODIGO_FANTASMA")
    assert response.status_code == 404


def test_validate_coupon_first_purchase_new_customer():
    """Un usuario sin compras previas puede usar WELCOME15."""
    response = client.get("/coupons/validate/WELCOME15?email=nuevo_comprador@gmail.com")
    assert response.status_code == 200
    assert response.json()["valid"] is True


def test_validate_coupon_first_purchase_existing_customer_rejected():
    """Un usuario con compra previa pagada no puede reutilizar WELCOME15."""
    test_email = "comprador_antiguo@gmail.com"
    # Registrar orden pagada simulada en MOCK_ORDERS
    mock_order_id = "test-ord-prev-1"
    MOCK_ORDERS[mock_order_id] = {
        "id": mock_order_id,
        "email": test_email,
        "status": "paid",
        "total": 50000,
    }

    try:
        response = client.get(f"/coupons/validate/WELCOME15?email={test_email}")
        assert response.status_code == 400
        assert "primera compra" in response.json()["detail"].lower()
    finally:
        MOCK_ORDERS.pop(mock_order_id, None)


def test_n8n_webhook_payload_enriched():
    """El webhook a n8n debe dispararse si la URL está configurada."""
    with patch("app.routers.subscribers.send_welcome_email"), \
         patch("app.routers.subscribers.settings") as mock_settings, \
         patch("app.routers.subscribers._notify_n8n") as mock_n8n:
        mock_settings.n8n_subscriber_webhook = "https://n8n.example.com/webhook/test"
        response = client.post(
            "/subscribers",
            json={"email": "lead_nuevo@test.com", "source": "Pop-up Magnet"}
        )
        assert response.status_code == 201
        assert mock_n8n.called
        args, _ = mock_n8n.call_args
        assert args[0] == "lead_nuevo@test.com"
        assert args[1] == "Pop-up Magnet"
        assert args[2] == "https://n8n.example.com/webhook/test"

