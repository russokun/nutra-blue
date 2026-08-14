"""
Acceso a la confirmacion de pedido.

Bug reportado en produccion: tras pagar de verdad y volver de Mercado Pago, la pagina de
confirmacion mostraba el pedido; al recargar un rato despues devolvia 403 "Email is
required to access this order".

La proteccion del endpoint es correcta y se conserva: sin ella cualquiera podria recorrer
identificadores de pedido y leer nombres, direcciones y telefonos. Lo que fallaba era del
lado del navegador, que perdia el correo con el que acreditarse. Estos tests fijan el
contrato que el front necesita para no volver a romperlo.
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.config import settings
from app.core.mock_data import MOCK_PRODUCTS
from app.core.mock_store import MOCK_ORDERS

client = TestClient(app)

EMAIL = "compradora@example.com"


@pytest.fixture(autouse=True)
def limpiar():
    # Tambien hay que reponer el stock: crear un pedido lo descuenta del catalogo mock, y
    # sin esto los tests que corren despues se quedan sin unidades y su POST /orders falla
    # con 400 por stock insuficiente.
    stock_inicial = {p["id"]: p.get("stock") for p in MOCK_PRODUCTS}
    yield
    MOCK_ORDERS.clear()
    for p in MOCK_PRODUCTS:
        if p["id"] in stock_inicial:
            p["stock"] = stock_inicial[p["id"]]


def crear_pedido(email=EMAIL):
    respuesta = client.post("/orders", json={
        "customer_name": "Compradora QA",
        "email": email,
        "phone": "+56911112222",
        "address": "Calle 1",
        "city": "Santiago",
        "region": "Metropolitana",
        "items": [{"product_id": "calm-and-focus", "quantity": 1}],
        "subtotal": 1, "tax": 1, "shipping_cost": 0, "total": 1,
    })
    assert respuesta.status_code == 200, respuesta.text
    return respuesta.json()


def test_en_produccion_sin_correo_no_se_puede_ver_el_pedido(monkeypatch):
    """
    Es la proteccion, no el bug: sin esto se podrian recorrer los identificadores de
    pedido y leer los datos personales de cualquier cliente.
    """
    pedido = crear_pedido()
    monkeypatch.setattr(settings, "environment", "production")

    respuesta = client.get(f"/orders/{pedido['id']}")
    assert respuesta.status_code == 403
    assert "email" in respuesta.json()["detail"].lower()


def test_en_produccion_con_el_correo_correcto_si_se_puede(monkeypatch):
    """Es lo que hace la pagina de confirmacion tras volver de la pasarela."""
    pedido = crear_pedido()
    monkeypatch.setattr(settings, "environment", "production")

    respuesta = client.get(f"/orders/{pedido['id']}", params={"email": EMAIL})
    assert respuesta.status_code == 200
    assert respuesta.json()["id"] == pedido["id"]


def test_el_correo_no_distingue_mayusculas(monkeypatch):
    """El comprador puede escribirlo distinto al volver; no puede quedar afuera por eso."""
    pedido = crear_pedido(email="Compradora@Example.com")
    monkeypatch.setattr(settings, "environment", "production")

    respuesta = client.get(f"/orders/{pedido['id']}", params={"email": "compradora@example.com"})
    assert respuesta.status_code == 200


def test_el_correo_de_otro_pedido_no_sirve(monkeypatch):
    """
    El front guardaba el correo del ultimo checkout sin mirar de que pedido era: al abrir
    la confirmacion de una compra anterior mandaba el correo equivocado.
    """
    pedido = crear_pedido(email="una@example.com")
    crear_pedido(email="otra@example.com")
    monkeypatch.setattr(settings, "environment", "production")

    respuesta = client.get(f"/orders/{pedido['id']}", params={"email": "otra@example.com"})
    assert respuesta.status_code == 403
    assert "match" in respuesta.json()["detail"].lower()


def test_mis_pedidos_traen_nombre_y_subtotal_de_cada_producto():
    """
    En la base los items se guardan solo como {product_id, quantity}. Sin completarlos,
    "Mis pedidos" mostraba el nombre vacio y el monto de cada linea como NaN, porque
    multiplicaba un precio que no existia.
    """
    crear_pedido()

    pedidos = client.get("/orders", params={"email": EMAIL}).json()
    assert pedidos

    for item in pedidos[0]["items"]:
        assert item["name"], "la linea no puede quedar sin nombre"
        assert isinstance(item["unit_price"], int) and item["unit_price"] > 0
        assert item["line_total"] == item["unit_price"] * item["quantity"]


def test_el_detalle_de_un_pedido_tambien_los_trae(monkeypatch):
    """Es la pagina de confirmacion: tiene que mostrar lo mismo que el historial."""
    pedido = crear_pedido()
    monkeypatch.setattr(settings, "environment", "production")

    detalle = client.get(f"/orders/{pedido['id']}", params={"email": EMAIL}).json()
    assert detalle["items"]
    for item in detalle["items"]:
        assert item["name"]
        assert item["line_total"] == item["unit_price"] * item["quantity"]

    # Y el desglose tiene que cuadrar con lo que se le cobro.
    assert sum(i["line_total"] for i in detalle["items"]) == detalle["total"]


def test_un_producto_borrado_no_rompe_el_historial():
    """El pedido sigue siendo legible aunque el producto ya no este en el catalogo."""
    pedido = crear_pedido()
    MOCK_ORDERS[pedido["id"]]["items"] = [{"product_id": "ya-no-existe", "quantity": 2}]

    pedidos = client.get("/orders", params={"email": EMAIL}).json()
    item = pedidos[0]["items"][0]
    assert item["name"] == "Producto ya no disponible"
    assert item["line_total"] == 0


def test_un_pedido_inexistente_da_404_no_403(monkeypatch):
    """
    Importa para el mensaje de error: 404 es "revisa el numero", 403 es "no podemos
    verificar que sea tuyo". La pagina mostraba el primero para los dos casos.
    """
    monkeypatch.setattr(settings, "environment", "production")
    assert client.get("/orders/no-existe", params={"email": EMAIL}).status_code == 404
