import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.mock_store import MOCK_ORDERS

client = TestClient(app)

ADMIN = {"Authorization": "Bearer mock-admin-token"}


@pytest.fixture(autouse=True)
def cleanup_mock_orders():
    yield
    MOCK_ORDERS.clear()


def crear_pedido(items=None):
    payload = {
        "customer_name": "Ana Pérez",
        "email": "ana@example.com",
        "phone": "+56911112222",
        "address": "Av. Siempre Viva 742",
        "city": "Providencia",
        "region": "Metropolitana",
        "items": items or [
            {"product_id": "calm-and-focus", "quantity": 2},
            {"product_id": "dark-cacao", "quantity": 1},
        ],
        "subtotal": 1,
        "tax": 1,
        "shipping_cost": 0,
        "total": 1,
        "delivery_method": "retiro_courier",
        "courier": "starken",
    }
    response = client.post("/orders", json=payload)
    assert response.status_code == 200, response.text
    return response.json()


def test_detalle_devuelve_los_datos_que_la_lista_descarta():
    """La lista solo muestra 7 columnas; el detalle tiene que traer todo lo demas."""
    order = crear_pedido()

    response = client.get(f"/admin/orders/{order['id']}", headers=ADMIN)
    assert response.status_code == 200
    data = response.json()

    assert data["customer_name"] == "Ana Pérez"
    assert data["email"] == "ana@example.com"
    assert data["phone"] == "+56911112222"
    assert data["address"] == "Av. Siempre Viva 742"
    assert data["city"] == "Providencia"
    assert data["region"] == "Metropolitana"
    assert data["delivery_method"] == "retiro_courier"
    assert data["courier"] == "starken"
    assert data["total"] == order["total"]


def test_detalle_completa_los_items_con_nombre_y_precio():
    """
    En la base los items se guardan como [{product_id, quantity}]: sin enriquecer,
    el panel mostraria UUIDs pelados en vez de nombres de producto.
    """
    order = crear_pedido()

    data = client.get(f"/admin/orders/{order['id']}", headers=ADMIN).json()
    items = data["items"]
    assert len(items) == 2

    for item in items:
        assert item["name"] and not item["name"].startswith("Producto ya no")
        assert item["price"] > 0
        assert item["line_total"] == item["price"] * item["quantity"]

    # El desglose de las lineas tiene que cuadrar con el total que se le cobro al cliente.
    assert sum(i["line_total"] for i in items) == data["total"]


def test_detalle_sobrevive_a_un_producto_borrado_del_catalogo():
    """Un producto que ya no existe no puede romper la vista del pedido."""
    order = crear_pedido()
    MOCK_ORDERS[order["id"]]["items"] = [{"product_id": "producto-inexistente", "quantity": 1}]

    data = client.get(f"/admin/orders/{order['id']}", headers=ADMIN).json()
    assert data["items"][0]["name"] == "Producto ya no disponible"
    assert data["items"][0]["line_total"] == 0


def test_detalle_de_pedido_inexistente_da_404():
    response = client.get("/admin/orders/no-existe", headers=ADMIN)
    assert response.status_code == 404


def test_detalle_requiere_autenticacion_de_admin():
    order = crear_pedido()
    assert client.get(f"/admin/orders/{order['id']}").status_code == 401


def test_la_ruta_recent_no_queda_capturada_por_el_detalle():
    """
    /admin/orders/{order_id} se declara despues de /admin/orders/recent a proposito:
    al reves, FastAPI resolveria "recent" como si fuera un id de pedido.
    """
    crear_pedido()
    response = client.get("/admin/orders/recent", headers=ADMIN)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
