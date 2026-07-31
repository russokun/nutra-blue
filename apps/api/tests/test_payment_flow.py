import hashlib
import hmac
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


def install_fake_mercadopago(monkeypatch, order_id, payment_response=None, preference_error=None):
    """
    Simula credenciales reales de Mercado Pago. Devuelve la lista donde se acumulan
    las preferencias creadas, para poder inspeccionar que se le mando a la pasarela.
    """
    monkeypatch.setattr(settings, "mercadopago_access_token", "TEST-fake-token")
    created_preferences = []

    class FakePreference:
        def create(self, data):
            created_preferences.append(data)
            if preference_error:
                raise preference_error
            return {
                "status": 201,
                "response": {"id": "pref-123", "init_point": "https://mp.example/pay"},
            }

    class FakePayment:
        def get(self, payment_id):
            return {
                "status": 200,
                "response": payment_response or {
                    "status": "approved",
                    "external_reference": order_id,
                    "live_mode": False,
                },
            }

    class FakeSDK:
        def __init__(self, token):
            pass

        def preference(self):
            return FakePreference()

        def payment(self):
            return FakePayment()

    monkeypatch.setattr(mercadopago_module.mercadopago, "SDK", FakeSDK)
    return created_preferences


def mercadopago_signature_headers(payload_data_id, secret, ts="1700000000", request_id="req-1"):
    manifest = f"id:{payload_data_id};request-id:{request_id};ts:{ts};"
    signature = hmac.new(secret.encode("utf-8"), manifest.encode("utf-8"), hashlib.sha256).hexdigest()
    return {"x-signature": f"ts={ts},v1={signature}", "x-request-id": request_id}


def test_mercadopago_flow_with_sdk_configured(monkeypatch):
    """Con credenciales reales el SDK se consulta para verificar el pago contra Mercado Pago."""
    order = create_test_order()
    install_fake_mercadopago(monkeypatch, order["id"])

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
    # El entorno lo define el token, no sandbox_init_point.
    assert init_response.json()["redirect_url"] == "https://mp.example/pay"

    webhook_response = client.post(
        "/payment/mercadopago-callback",
        json={"action": "payment.created", "type": "payment", "data": {"id": "payment-999"}},
    )
    assert webhook_response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"


def test_mercadopago_preference_uses_public_urls(monkeypatch):
    """El webhook tiene que apuntar a la URL publica de la API, no a website_domain."""
    order = create_test_order()
    monkeypatch.setattr(settings, "public_api_url_raw", "https://tunnel.example")
    monkeypatch.setattr(settings, "public_web_url_raw", "https://nutrablue.test")
    preferences = install_fake_mercadopago(monkeypatch, order["id"])

    response = client.post(
        "/payment/init",
        json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": order["email"],
            "gateway": "mercadopago",
        },
    )
    assert response.status_code == 200

    preference = preferences[0]
    assert preference["notification_url"] == "https://tunnel.example/payment/mercadopago-callback"
    assert preference["back_urls"]["success"] == f"https://nutrablue.test/order-confirmation/{order['id']}"
    assert preference["external_reference"] == order["id"]
    # El monto cobrado es la suma de los items: tiene que ser exactamente el total.
    assert sum(i["unit_price"] * i["quantity"] for i in preference["items"]) == order["total"]


def test_mercadopago_init_propagates_failure(monkeypatch):
    """Si Mercado Pago falla, el checkout falla. Nunca una URL de pago inventada."""
    order = create_test_order()
    install_fake_mercadopago(monkeypatch, order["id"], preference_error=RuntimeError("MP caido"))

    response = client.post(
        "/payment/init",
        json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": order["email"],
            "gateway": "mercadopago",
        },
    )
    assert response.status_code == 500
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_mercadopago_webhook_persists_payment_metadata(monkeypatch):
    """La orden pagada tiene que registrar con que se pago y si fue una prueba."""
    order = create_test_order()
    install_fake_mercadopago(monkeypatch, order["id"])

    response = client.post(
        "/payment/mercadopago-callback",
        json={"type": "payment", "data": {"id": "payment-999"}},
    )
    assert response.status_code == 200

    paid = MOCK_ORDERS[order["id"]]
    assert paid["status"] == "paid"
    assert paid["payment_provider"] == "mercadopago"
    assert paid["payment_id"] == "payment-999"
    assert paid["is_test"] is True  # live_mode=False -> credenciales de prueba
    assert paid["paid_at"]


def test_mercadopago_webhook_marks_live_payments_as_real(monkeypatch):
    order = create_test_order()
    install_fake_mercadopago(
        monkeypatch,
        order["id"],
        payment_response={"status": "approved", "external_reference": order["id"], "live_mode": True},
    )

    client.post("/payment/mercadopago-callback", json={"type": "payment", "data": {"id": "payment-999"}})
    assert MOCK_ORDERS[order["id"]]["is_test"] is False


def test_mercadopago_webhook_ignores_rejected_payments(monkeypatch):
    order = create_test_order()
    install_fake_mercadopago(
        monkeypatch,
        order["id"],
        payment_response={"status": "rejected", "external_reference": order["id"], "live_mode": False},
    )

    response = client.post(
        "/payment/mercadopago-callback",
        json={"type": "payment", "data": {"id": "payment-999"}},
    )
    assert response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_mercadopago_webhook_accepts_valid_signature(monkeypatch):
    order = create_test_order()
    install_fake_mercadopago(monkeypatch, order["id"])
    monkeypatch.setattr(settings, "mercadopago_webhook_secret", "webhook-secret")

    response = client.post(
        "/payment/mercadopago-callback",
        json={"type": "payment", "data": {"id": "payment999"}},
        headers=mercadopago_signature_headers("payment999", "webhook-secret"),
    )
    assert response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"


def test_mercadopago_webhook_rejects_invalid_signature(monkeypatch):
    order = create_test_order()
    install_fake_mercadopago(monkeypatch, order["id"])
    monkeypatch.setattr(settings, "mercadopago_webhook_secret", "webhook-secret")

    response = client.post(
        "/payment/mercadopago-callback",
        json={"type": "payment", "data": {"id": "payment999"}},
        headers={"x-signature": "ts=1700000000,v1=deadbeef", "x-request-id": "req-1"},
    )
    assert response.status_code == 400
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_mercadopago_webhook_rejects_missing_signature(monkeypatch):
    order = create_test_order()
    install_fake_mercadopago(monkeypatch, order["id"])
    monkeypatch.setattr(settings, "mercadopago_webhook_secret", "webhook-secret")

    response = client.post(
        "/payment/mercadopago-callback",
        json={"type": "payment", "data": {"id": "payment999"}},
    )
    assert response.status_code == 400
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_mercadopago_requires_credentials_in_production(monkeypatch):
    """Sin token en produccion el gateway no arranca: no puede caer al mock."""
    monkeypatch.setattr(settings, "mercadopago_access_token", "")
    monkeypatch.setattr(settings, "environment", "production")

    with pytest.raises(mercadopago_module.MercadoPagoConfigError):
        mercadopago_module.MercadoPagoPayment()


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
