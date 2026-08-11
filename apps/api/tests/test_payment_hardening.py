"""
Huecos de seguridad del flujo de pago, cerrados antes de cobrar de verdad en produccion.
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.config import settings
from app.core.mock_store import MOCK_ORDERS
from app.core.payments import mercadopago as mercadopago_module
from app.core.payments.factory import PaymentGatewayFactory, UnknownGatewayError
from tests.test_payment_flow import (
    create_test_order,
    install_fake_mercadopago,
    mercadopago_signature_headers,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def cleanup_mock_orders():
    yield
    MOCK_ORDERS.clear()


# ------------------------------------------------------- gateway controlado por el cliente


def test_una_pasarela_desconocida_es_rechazada():
    """
    Antes cualquier valor desconocido caia a MockPayment, cuyo redirect_url apunta
    derecho a /order-confirmation. Un cliente que mandara {"gateway": "cualquier-cosa"}
    veia la pantalla de compra exitosa sin haber pagado.
    """
    order = create_test_order()
    response = client.post(
        "/payment/init",
        json={
            "order_id": order["id"],
            "amount": order["total"],
            "email": order["email"],
            "gateway": "pasarela-que-no-existe",
        },
    )
    assert response.status_code == 400
    assert MOCK_ORDERS[order["id"]]["status"] == "pending"


def test_la_pasarela_simulada_no_se_puede_usar_en_produccion(monkeypatch):
    monkeypatch.setattr(settings, "environment", "production")
    with pytest.raises(UnknownGatewayError):
        PaymentGatewayFactory.get_gateway("mock")


def test_la_pasarela_simulada_sigue_disponible_en_desarrollo():
    gateway = PaymentGatewayFactory.get_gateway("mock")
    assert gateway.__class__.__name__ == "MockPayment"


# ------------------------------------------------------------------ firma del webhook


def test_en_produccion_el_secreto_del_webhook_es_obligatorio(monkeypatch):
    """
    El endpoint del webhook es publico y marca ordenes como pagadas. Sin secreto no hay
    forma de saber que la notificacion viene de Mercado Pago, y .env.example lo trae
    vacio, asi que era facil salir a produccion sin configurarlo.
    """
    monkeypatch.setattr(settings, "environment", "production")
    monkeypatch.setattr(settings, "mercadopago_webhook_secret", "")

    gateway = mercadopago_module.MercadoPagoPayment.__new__(mercadopago_module.MercadoPagoPayment)
    with pytest.raises(ValueError, match="MERCADOPAGO_WEBHOOK_SECRET"):
        gateway._verify_signature({"data": {"id": "1"}}, {})


def test_fuera_de_produccion_se_puede_probar_sin_secreto(monkeypatch):
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "mercadopago_webhook_secret", "")

    gateway = mercadopago_module.MercadoPagoPayment.__new__(mercadopago_module.MercadoPagoPayment)
    gateway._verify_signature({"data": {"id": "1"}}, {})  # no levanta


# --------------------------------------------------------------- monto realmente cobrado


def test_un_pago_por_menos_del_total_no_marca_la_orden_como_pagada(monkeypatch):
    """
    Antes el webhook llamaba a validate_payment_request(order_id, order["total"]), o sea
    comparaba el total de la orden contra si mismo: la comprobacion era tautologica y un
    pago aprobado por cualquier monto dejaba la orden en 'paid'.
    """
    order = create_test_order()
    secret = "webhook-secret"
    monkeypatch.setattr(settings, "mercadopago_webhook_secret", secret)
    install_fake_mercadopago(
        monkeypatch,
        order["id"],
        payment_response={
            "status": "approved",
            "external_reference": order["id"],
            "live_mode": True,
            "transaction_amount": 1,  # se pagaron $1 por una orden de $18.990
        },
    )

    response = client.post(
        "/payment/mercadopago-callback",
        json={"type": "payment", "data": {"id": "payment-999"}},
        headers=mercadopago_signature_headers("payment-999", secret),
    )

    assert response.status_code == 400
    assert MOCK_ORDERS[order["id"]]["status"] == "pending"


def test_un_pago_por_el_total_exacto_si_marca_la_orden_como_pagada(monkeypatch):
    order = create_test_order()
    secret = "webhook-secret"
    monkeypatch.setattr(settings, "mercadopago_webhook_secret", secret)
    install_fake_mercadopago(
        monkeypatch,
        order["id"],
        payment_response={
            "status": "approved",
            "external_reference": order["id"],
            "live_mode": True,
            "transaction_amount": order["total"],
        },
    )

    response = client.post(
        "/payment/mercadopago-callback",
        json={"type": "payment", "data": {"id": "payment-999"}},
        headers=mercadopago_signature_headers("payment-999", secret),
    )

    assert response.status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "paid"
    assert MOCK_ORDERS[order["id"]]["is_test"] is False


# --------------------------------------------------------------- producto oculto de prueba


def test_un_producto_oculto_no_aparece_en_el_catalogo():
    from app.core.mock_data import MOCK_PRODUCTS

    original = [dict(p) for p in MOCK_PRODUCTS]
    try:
        MOCK_PRODUCTS.append({
            "id": "producto-de-prueba",
            "name": "Producto de Prueba",
            "price": 1000,
            "stock": 5,
            "category": "System",
            "is_hidden": True,
            "benefits": [],
            "certifications": [],
        })

        catalogo = client.get("/products").json()
        assert "producto-de-prueba" not in {p["id"] for p in catalogo}

        carrusel = client.get("/products/hero-carousel").json()
        assert "producto-de-prueba" not in {p["id"] for p in carrusel}

        # Pero sigue siendo comprable por URL directa: asi se hace la compra de prueba.
        detalle = client.get("/products/producto-de-prueba")
        assert detalle.status_code == 200
        assert detalle.json()["name"] == "Producto de Prueba"
    finally:
        MOCK_PRODUCTS[:] = original
