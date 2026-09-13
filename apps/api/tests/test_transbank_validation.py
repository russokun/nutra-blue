import pytest
from fastapi.testclient import TestClient
from app.core.config import settings
from app.core.mock_store import MOCK_ORDERS
from app.core.payments import transbank as transbank_module
from main import app

client = TestClient(app)


def create_test_order(email: str = "juan.perez@nutrablue.cl", total: int = 17990) -> dict:
    subtotal = total - 1990
    tax = int(subtotal * 0.19)
    payload = {
        "customer_name": "Juan Pérez",
        "email": email,
        "phone": "+56912345678",
        "address": "Av Providencia 1234",
        "city": "Santiago",
        "region": "Metropolitana",
        "subtotal": subtotal,
        "tax": tax,
        "shipping_cost": 1990,
        "total": total,
        "items": [{"product_id": "calm-and-focus", "quantity": 1}],
    }
    response = client.post("/orders", json=payload)
    assert response.status_code == 200, f"Error creating test order: {response.text}"
    return response.json()


@pytest.fixture(autouse=True)
def cleanup_mock_orders():
    yield
    MOCK_ORDERS.clear()


def test_transbank_init_flow(monkeypatch):
    order = create_test_order()

    fake_create_resp = {
        "token": "mock-tbk-token-valid-qa-123",
        "url": "https://webpay3gint.transbank.cl/webpayserver/initTransaction",
    }
    monkeypatch.setattr(
        transbank_module.Transaction,
        "create",
        lambda self, buy_order, session_id, amount, return_url: fake_create_resp,
    )

    response = client.post(
        "/payment/init",
        json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": order["email"],
            "gateway": "transbank",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["token"] == fake_create_resp["token"]
    assert data["url"] == fake_create_resp["url"]
    assert data["redirect_url"] == fake_create_resp["url"]
    assert data["payment_method"] == "POST"


def test_transbank_return_authorized_marks_order_paid(monkeypatch):
    order = create_test_order()

    fake_response = {
        "status": "AUTHORIZED",
        "response_code": 0,
        "amount": order["total"],
        "buy_order": order["id"].replace("-", "")[:26],
        "authorization_code": "1213",
        "payment_type_code": "VD",
        "shares_number": 0,
        "card_detail": {"card_number": "6623"},
    }
    monkeypatch.setattr(transbank_module.Transaction, "commit", lambda self, token: fake_response)

    response = client.get(
        f"/payment/transbank-return?token_ws=test-token-auth&order_id={order['id']}",
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert f"/order-confirmation/{order['id']}" in response.headers["location"]
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"
    assert MOCK_ORDERS[order["id"]]["payment_provider"] == "transbank"
    assert MOCK_ORDERS[order["id"]]["payment_id"] == "1213"
    assert MOCK_ORDERS[order["id"]]["is_test"] is True


def test_transbank_return_post_method_supported(monkeypatch):
    order = create_test_order()

    fake_response = {
        "status": "AUTHORIZED",
        "response_code": 0,
        "amount": order["total"],
        "buy_order": order["id"].replace("-", "")[:26],
        "authorization_code": "9876",
        "payment_type_code": "VN",
        "shares_number": 1,
        "card_detail": {"card_number": "6623"},
    }
    monkeypatch.setattr(transbank_module.Transaction, "commit", lambda self, token: fake_response)

    response = client.post(
        f"/payment/transbank-return?order_id={order['id']}",
        data={"token_ws": "test-token-post"},
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert f"/order-confirmation/{order['id']}" in response.headers["location"]
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"
    assert MOCK_ORDERS[order["id"]]["payment_id"] == "9876"


def test_transbank_return_rejected_by_bank(monkeypatch):
    order = create_test_order()

    fake_response = {
        "status": "FAILED",
        "response_code": -1,
        "amount": order["total"],
        "buy_order": order["id"],
    }
    monkeypatch.setattr(transbank_module.Transaction, "commit", lambda self, token: fake_response)

    response = client.get(
        f"/payment/transbank-return?token_ws=test-token-rej&order_id={order['id']}",
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert "checkout?error=rejected" in response.headers["location"]
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_transbank_return_cancelled_by_user():
    order = create_test_order()

    response = client.get(
        f"/payment/transbank-return?TBK_TOKEN=test-abort-token&order_id={order['id']}",
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert "checkout?error=cancelled" in response.headers["location"]
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_transbank_return_tampered_amount(monkeypatch):
    order = create_test_order(total=17990)

    fake_response = {
        "status": "AUTHORIZED",
        "response_code": 0,
        "amount": 500,  # Pagó solo $500 en lugar de $17.990
        "buy_order": order["id"],
        "authorization_code": "1213",
    }
    monkeypatch.setattr(transbank_module.Transaction, "commit", lambda self, token: fake_response)

    response = client.get(
        f"/payment/transbank-return?token_ws=test-token-tamper&order_id={order['id']}",
        follow_redirects=False,
    )
    assert response.status_code == 303
    assert "checkout?error=payment_validation" in response.headers["location"]
    assert MOCK_ORDERS[order["id"]]["status"] != "paid"


def test_transbank_production_guard(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "webpay_commerce_code", "597055555532")  # Código de prueba prohibido en prod
    monkeypatch.setattr(settings, "webpay_api_key", "cualquier_clave")

    with pytest.raises(transbank_module.TransbankConfigError):
        transbank_module.TransbankPayment()
