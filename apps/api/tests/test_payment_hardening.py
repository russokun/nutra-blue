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


# El producto oculto de ejemplo ya vive en app/core/mock_data.py, para poder probar el
# modo prueba en desarrollo sin crear uno a mano. Los tests usan ese, no uno inventado.
PRODUCTO_OCULTO = "producto-de-prueba"


def test_un_producto_oculto_no_aparece_en_el_catalogo():
    catalogo = client.get("/products").json()
    assert PRODUCTO_OCULTO not in {p["id"] for p in catalogo}

    carrusel = client.get("/products/hero-carousel").json()
    assert PRODUCTO_OCULTO not in {p["id"] for p in carrusel}

    # Pero sigue siendo alcanzable por URL directa: asi se hace la compra de prueba.
    detalle = client.get(f"/products/{PRODUCTO_OCULTO}")
    assert detalle.status_code == 200
    assert detalle.json()["is_hidden"] is True


def test_el_modo_prueba_pide_los_ocultos_explicitamente():
    """
    El catalogo normal nunca trae ocultos; solo los suma cuando se piden a proposito.
    Asi NutraBlue puede recorrer la tienda completa con productos baratos.
    """
    normal = client.get("/products").json()
    prueba = client.get("/products?include_hidden=true").json()

    assert PRODUCTO_OCULTO not in {p["id"] for p in normal}
    assert PRODUCTO_OCULTO in {p["id"] for p in prueba}

    # Es el catalogo completo, no solo los de prueba: los reales siguen estando.
    assert set(p["id"] for p in normal).issubset(p["id"] for p in prueba)
    assert len(prueba) == len(normal) + 1

    # El front lo usa para marcarlos con la pildora "Prueba".
    assert next(p for p in prueba if p["id"] == PRODUCTO_OCULTO)["is_hidden"] is True

    # La fila interna del sync no se cuela ni siquiera pidiendo los ocultos.
    assert "__SYSTEM_SYNC_LOG__" not in {p["name"] for p in prueba}


def test_un_producto_oculto_se_puede_comprar():
    """
    Lo que hace util al producto oculto es que se pueda pagar de verdad. Si alguien
    agregara el filtro de visibilidad a get_product_by_id "por consistencia", la orden
    fallaria con "Product not found" y la compra de prueba quedaria imposible.
    """
    respuesta = client.post("/orders", json={
        "customer_name": "QA",
        "email": "qa@example.com",
        "phone": "+56911112222",
        "address": "Calle 1",
        "city": "Santiago",
        "region": "Metropolitana",
        "items": [{"product_id": PRODUCTO_OCULTO, "quantity": 1}],
        "subtotal": 1, "tax": 1, "shipping_cost": 0, "total": 1,
    })

    assert respuesta.status_code == 200, respuesta.text
    orden = respuesta.json()
    assert orden["total"] == 1000
    assert orden["shipping_cost"] == 0

    # Y la pasarela tiene que aceptar iniciar el pago por ese monto.
    pago = client.post("/payment/init", json={
        "order_id": orden["id"],
        "amount": orden["total"],
        "email": orden["email"],
    })
    assert pago.status_code == 200, pago.text
