import urllib.parse
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.config import settings
from app.core.mock_store import MOCK_ORDERS
from app.core.payments import mercadopago as mercadopago_module
from app.core.payments import transbank as transbank_module

client = TestClient(app)


def create_test_order(email="e2e@example.com"):
    payload = {
        "customer_name": "E2E Test",
        "email": email,
        "phone": "+56912345678",
        "address": "Calle 1",
        "city": "Santiago",
        "region": "Metropolitana",
        "items": [{"product_id": "calm-and-focus", "quantity": 1}],
        "subtotal": 1,
        "tax": 1,
        "shipping_cost": 1,
        "total": 1,
    }
    response = client.post("/orders", json=payload)
    assert response.status_code == 200
    return response.json()


@pytest.fixture(autouse=True)
def cleanup_mock_orders():
    yield
    MOCK_ORDERS.clear()


def test_payment_init_defaults_to_mock_gateway():
    order = create_test_order()
    response = client.post(
        "/payment/init",
        json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": order["email"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token"].startswith("mock_token_")
    assert data["payment_url"] == data["redirect_url"]


def test_payment_init_rejects_amount_mismatch():
    order = create_test_order()
    response = client.post(
        "/payment/init",
        json={"order_id": order["id"], "amount": order["total"] + 1, "email": order["email"]},
    )
    assert response.status_code == 400


def test_payment_init_rejects_unknown_order():
    response = client.post(
        "/payment/init",
        json={"order_id": "does-not-exist", "amount": 100, "email": "a@b.com"},
    )
    assert response.status_code == 404


def test_payment_init_rejects_email_mismatch():
    order = create_test_order()
    response = client.post(
        "/payment/init",
        json={"order_id": order["id"], "amount": order["total"], "email": "someone-else@example.com"},
    )
    assert response.status_code == 403


def test_mercadopago_flow_without_credentials():
    """Sin MERCADOPAGO_ACCESS_TOKEN configurado (estado actual), init y webhook usan el fallback mock."""
    order = create_test_order()

    init_response = client.post(
        "/payment/init",
        json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": order["email"],
            "gateway": "mercadopago",
        },
    )
    assert init_response.status_code == 200
    assert init_response.json()["token"].startswith("mp_mock_token_")

    webhook_response = client.post(
        "/payment/mercadopago-callback",
        json={"status": "approved", "order_id": order["id"]},
    )
    assert webhook_response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"


def test_mercadopago_flow_with_sdk_configured(monkeypatch):
    """Simula credenciales reales: el SDK de Mercado Pago se consulta para verificar el pago."""
    order = create_test_order()
    monkeypatch.setattr(settings, "mercadopago_access_token", "TEST-fake-token")

    class FakePreference:
        def create(self, data):
            return {"response": {"id": "pref-123", "init_point": "https://mp.example/pay", "sandbox_init_point": "https://mp.example/sandbox-pay"}}

    class FakePayment:
        def get(self, payment_id):
            return {"response": {"status": "approved", "external_reference": order["id"]}}

    class FakeSDK:
        def __init__(self, token):
            pass

        def preference(self):
            return FakePreference()

        def payment(self):
            return FakePayment()

    monkeypatch.setattr(mercadopago_module.mercadopago, "SDK", FakeSDK)

    init_response = client.post(
        "/payment/init",
        json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": order["email"],
            "gateway": "mercadopago",
        },
    )
    assert init_response.status_code == 200
    assert init_response.json()["redirect_url"] == "https://mp.example/sandbox-pay"

    webhook_response = client.post(
        "/payment/mercadopago-callback",
        json={"action": "payment.created", "type": "payment", "data": {"id": "payment-999"}},
    )
    assert webhook_response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"


def test_flow_gateway_without_credentials():
    order = create_test_order()

    init_response = client.post(
        "/payment/init",
        json={"order_id": order["id"], "amount": order["total"], "email": order["email"], "gateway": "flow"},
    )
    assert init_response.status_code == 200
    assert init_response.json()["token"].startswith("flow_mock_token_")

    webhook_response = client.post(
        "/payment/flow-callback",
        data={"token": "flow_mock_token", "status": "success", "order_id": order["id"]},
    )
    assert webhook_response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"


def test_flow_webhook_signature_verification(monkeypatch):
    """Con credenciales reales, el webhook debe validar la firma HMAC antes de marcar la orden como pagada."""
    order = create_test_order()
    monkeypatch.setattr(settings, "flow_api_key", "fake-api-key")
    monkeypatch.setattr(settings, "flow_secret_key", "fake-secret")

    from app.core.payments.flow import FlowPayment

    gateway = FlowPayment()
    response_data = urllib.parse.urlencode({"status": "2", "commerceOrder": order["id"]})
    valid_sign = gateway._sign_params({"response": response_data})

    ok_response = client.post(
        "/payment/flow-callback",
        data={"response": response_data, "sign": valid_sign},
    )
    assert ok_response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"


def test_flow_webhook_rejects_invalid_signature(monkeypatch):
    order = create_test_order()
    monkeypatch.setattr(settings, "flow_api_key", "fake-api-key")
    monkeypatch.setattr(settings, "flow_secret_key", "fake-secret")

    response_data = urllib.parse.urlencode({"status": "2", "commerceOrder": order["id"]})

    response = client.post(
        "/payment/flow-callback",
        data={"response": response_data, "sign": "tampered-signature"},
    )
    assert response.status_code == 400
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_transbank_return_marks_order_paid(monkeypatch):
    order = create_test_order()

    fake_response = SimpleNamespace(
        status="AUTHORIZED",
        response_code=0,
        buy_order=order["id"],
        payment_type_code="VD",
        shares_number=1,
        card_detail={"card_number": "6623"},
    )
    monkeypatch.setattr(transbank_module.Transaction, "commit", lambda self, token: fake_response)

    response = client.get(
        f"/payment/transbank-return?token_ws=fake-token&order_id={order['id']}",
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert f"/order-confirmation/{order['id']}" in response.headers["location"]
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"


def test_transbank_return_cancelled_by_user():
    order = create_test_order()

    response = client.get(
        f"/payment/transbank-return?TBK_TOKEN=cancelled-token&order_id={order['id']}",
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert "checkout?error=cancelled" in response.headers["location"]
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_webhook_is_idempotent_for_already_paid_orders():
    order = create_test_order()
    MOCK_ORDERS[order["id"]]["status"] = "paid"

    response = client.post(
        "/payment/mercadopago-callback",
        json={"status": "approved", "order_id": order["id"]},
    )
    assert response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"
