import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.mock_store import MOCK_ORDERS
from app.routers import admin as admin_module

client = TestClient(app)

ADMIN = {"Authorization": "Bearer mock-admin-token"}


@pytest.fixture(autouse=True)
def cleanup_mock_orders():
    yield
    MOCK_ORDERS.clear()


@pytest.fixture
def correos_enviados(monkeypatch):
    """Captura los avisos de despacho en vez de mandarlos por Resend."""
    enviados = []

    async def fake_send(order):
        enviados.append(order)
        return True

    monkeypatch.setattr(admin_module, "send_shipping_notification", fake_send)
    return enviados


def crear_pedido():
    payload = {
        "customer_name": "Ana Pérez",
        "email": "ana@example.com",
        "phone": "+56911112222",
        "address": "Av. Siempre Viva 742",
        "city": "Providencia",
        "region": "Metropolitana",
        "items": [{"product_id": "calm-and-focus", "quantity": 1}],
        "subtotal": 1, "tax": 1, "shipping_cost": 0, "total": 1,
    }
    response = client.post("/orders", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def despachar(order_id, **overrides):
    body = {"tracking_code": "ST-9481720491", "shipping_company": "starken", **overrides}
    return client.patch(f"/admin/orders/{order_id}/shipping", json=body, headers=ADMIN)


def test_despachar_guarda_el_codigo_de_seguimiento(correos_enviados):
    """
    El modal del panel pedia el codigo de tracking y lo tiraba: solo hacia PATCH del
    estado y lo usaba en el texto del toast. Ahora tiene que quedar persistido.
    """
    order = crear_pedido()

    response = despachar(order["id"])
    assert response.status_code == 200

    guardado = MOCK_ORDERS[order["id"]]
    assert guardado["tracking_code"] == "ST-9481720491"
    assert guardado["shipping_company"] == "starken"
    assert guardado["status"] == "shipped"
    assert guardado["shipped_at"]
    assert guardado["shipping_payment"] == "por_pagar"


def test_despachar_avisa_al_cliente_por_correo(correos_enviados):
    """send_payment_confirmation promete este correo; antes nadie lo enviaba."""
    order = crear_pedido()
    despachar(order["id"])

    assert len(correos_enviados) == 1
    assert correos_enviados[0]["email"] == "ana@example.com"
    assert correos_enviados[0]["tracking_code"] == "ST-9481720491"


def test_se_puede_despachar_sin_avisar(correos_enviados):
    order = crear_pedido()
    assert despachar(order["id"], notify_customer=False).status_code == 200
    assert correos_enviados == []


def test_un_correo_caido_no_deja_el_pedido_sin_despachar(monkeypatch):
    """El envio ya quedo guardado: que Resend falle no puede revertirlo."""
    order = crear_pedido()

    async def revienta(order):
        raise RuntimeError("Resend caido")

    monkeypatch.setattr(admin_module, "send_shipping_notification", revienta)

    assert despachar(order["id"]).status_code == 200
    assert MOCK_ORDERS[order["id"]]["status"] == "shipped"
    assert MOCK_ORDERS[order["id"]]["tracking_code"] == "ST-9481720491"


def test_rechaza_codigo_de_seguimiento_vacio(correos_enviados):
    order = crear_pedido()
    assert despachar(order["id"], tracking_code="   ").status_code == 400
    assert MOCK_ORDERS[order["id"]]["status"] != "shipped"


def test_rechaza_empresa_de_transporte_desconocida(correos_enviados):
    order = crear_pedido()
    assert despachar(order["id"], shipping_company="dhl").status_code == 400


def test_rechaza_estado_de_flete_invalido(correos_enviados):
    order = crear_pedido()
    assert despachar(order["id"], shipping_payment="regalado").status_code == 400


def test_despachar_pedido_inexistente_da_404(correos_enviados):
    assert despachar("no-existe").status_code == 404


def test_despachar_requiere_admin():
    order = crear_pedido()
    response = client.patch(
        f"/admin/orders/{order['id']}/shipping",
        json={"tracking_code": "X-1", "shipping_company": "starken"},
    )
    assert response.status_code == 401


def test_el_detalle_muestra_el_seguimiento_recien_guardado(correos_enviados):
    order = crear_pedido()
    despachar(order["id"], shipping_payment="pagado")

    data = client.get(f"/admin/orders/{order['id']}", headers=ADMIN).json()
    assert data["tracking_code"] == "ST-9481720491"
    assert data["shipping_company"] == "starken"
    assert data["shipping_payment"] == "pagado"
