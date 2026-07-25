"""
Stock bidireccional entre la planilla y la tienda, y liberacion de stock de
ordenes que nunca se pagaron.
"""
import datetime
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.security import verify_admin_or_internal_key
from app.core.mock_data import MOCK_PRODUCTS
from app.core.mock_store import MOCK_ORDERS

client = TestClient(app)


async def override_auth():
    return {"id": "test-admin-id", "email": "admin@nutrablue.cl"}


# Misma estructura que la planilla real: fila de titulo, cabecera principal,
# subcabecera (donde vive "Inventario") y despues los productos.
def build_csv(stock: str, price: str = "$19,990", name: str = "Melena de Leon Gotas") -> str:
    return (
        "Lista de Suplementos y Alimentos,,,,,,,,\n"
        "Categoría / Objetivo,Suplemento / Alimento,Productor,Contacto,$ Compra,$ Venta,,,Link Doc\n"
        ",,,,,,Comentario,Inventario,\n"
        f"Estimulación Cerebral,{name},ONGO,ongo.cl,\"$11,700\",\"{price}\",,{stock},\n"
    )


def run_sync(csv_text: str):
    with patch("requests.get") as mock_get, patch("app.routers.admin.supabase_client", None):
        mock_get.return_value = MagicMock(status_code=200, text=csv_text, headers={"content-type": "text/csv"})
        response = client.post("/admin/products/sync-sheets", json={"csv_url": "http://fake-sheet.csv"})
    assert response.status_code == 200
    return response.json()["summary"]


def find_product(name: str):
    return next(p for p in MOCK_PRODUCTS if p["name"] == name)


@pytest.fixture(autouse=True)
def clean_state():
    app.dependency_overrides[verify_admin_or_internal_key] = override_auth
    original_products = [dict(p) for p in MOCK_PRODUCTS]
    original_orders = dict(MOCK_ORDERS)
    yield
    MOCK_PRODUCTS[:] = original_products
    MOCK_ORDERS.clear()
    MOCK_ORDERS.update(original_orders)
    app.dependency_overrides.clear()


def test_stock_decimal_de_la_planilla_no_rompe_la_validacion():
    """La columna Inventario viene como "30.00": debe quedar en 30, no en 3000 ni error."""
    summary = run_sync(build_csv("30.00"))

    assert summary["errors"] == []
    assert find_product("Melena de Leon Gotas")["stock"] == 30


def test_precio_toma_la_columna_de_venta_y_nunca_la_de_compra():
    summary = run_sync(build_csv("30.00"))

    assert summary["errors"] == []
    assert find_product("Melena de Leon Gotas")["price"] == 19990


def test_csv_sin_charset_se_lee_como_utf8():
    """
    Google responde "text/csv" sin charset y requests asume ISO-8859-1: sin forzar
    UTF-8, "Energía" entraba a la base como "EnergÃ­a".
    """
    csv_bytes = build_csv("30.00", name="Proteína de Chía").encode("utf-8")

    class FakeResponse:
        headers = {"content-type": "text/csv"}
        encoding = "ISO-8859-1"
        status_code = 200

        def raise_for_status(self):
            pass

        @property
        def text(self):
            return csv_bytes.decode(self.encoding)

    with patch("requests.get", return_value=FakeResponse()), patch("app.routers.admin.supabase_client", None):
        response = client.post("/admin/products/sync-sheets", json={"csv_url": "http://fake-sheet.csv"})

    assert response.status_code == 200
    assert response.json()["summary"]["errors"] == []
    assert find_product("Proteína de Chía")["category"] == "Estimulación Cerebral"


def test_primer_sync_toma_el_stock_de_la_planilla():
    summary = run_sync(build_csv("30.00"))

    assert summary["stock_writeback"] == [{"name": "Melena de Leon Gotas", "stock": 30}]


def test_venta_sobrevive_a_un_sync_con_la_planilla_sin_cambios():
    """El caso que rompia todo: el sync diario no puede revivir stock ya vendido."""
    run_sync(build_csv("30.00"))

    # Se venden 4 unidades (lo que hace create_order_with_stock_check)
    find_product("Melena de Leon Gotas")["stock"] = 26

    summary = run_sync(build_csv("30.00"))

    assert find_product("Melena de Leon Gotas")["stock"] == 26
    assert summary["stock_writeback"] == [{"name": "Melena de Leon Gotas", "stock": 26}]


def test_reposicion_en_la_planilla_se_suma_a_las_ventas_locales():
    """NutraBlue repone en el Excel (30 -> 50) y ademas hubo 4 ventas: quedan 46."""
    run_sync(build_csv("30.00"))
    find_product("Melena de Leon Gotas")["stock"] = 26

    run_sync(build_csv("50.00"))

    assert find_product("Melena de Leon Gotas")["stock"] == 46


def test_ajuste_manual_del_admin_se_preserva():
    """El admin corrige el inventario a mano (30 -> 35) y la planilla no cambia."""
    run_sync(build_csv("30.00"))
    find_product("Melena de Leon Gotas")["stock"] = 35

    run_sync(build_csv("30.00"))

    assert find_product("Melena de Leon Gotas")["stock"] == 35


def test_el_stock_nunca_queda_negativo():
    run_sync(build_csv("30.00"))
    find_product("Melena de Leon Gotas")["stock"] = 0

    run_sync(build_csv("5.00"))

    assert find_product("Melena de Leon Gotas")["stock"] == 0


def test_sync_no_pisa_la_galeria_curada_a_mano():
    run_sync(build_csv("30.00"))
    producto = find_product("Melena de Leon Gotas")
    producto["images"] = ["https://media.nutrablue.cl/melena-1.jpg"]
    producto["image_url"] = "https://media.nutrablue.cl/melena-1.jpg"

    run_sync(build_csv("30.00"))

    producto = find_product("Melena de Leon Gotas")
    assert producto["images"] == ["https://media.nutrablue.cl/melena-1.jpg"]
    assert producto["image_url"] == "https://media.nutrablue.cl/melena-1.jpg"


def test_release_expired_devuelve_el_stock_y_marca_la_orden():
    producto = MOCK_PRODUCTS[0]
    stock_inicial = int(producto["stock"])
    vieja = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=3)).isoformat()
    MOCK_ORDERS["orden-abandonada"] = {
        "id": "orden-abandonada",
        "status": "pending",
        "created_at": vieja,
        "items": [{"product_id": producto["id"], "quantity": 2}],
    }

    with patch("app.routers.admin.supabase_client", None):
        response = client.post("/admin/orders/release-expired?minutes=60")

    assert response.status_code == 200
    assert response.json() == {"expired_orders": 1, "restocked_units": 2}
    assert MOCK_ORDERS["orden-abandonada"]["status"] == "expired"
    assert int(MOCK_PRODUCTS[0]["stock"]) == stock_inicial + 2


def test_release_expired_no_toca_ordenes_recientes_ni_pagadas():
    producto = MOCK_PRODUCTS[0]
    stock_inicial = int(producto["stock"])
    ahora = datetime.datetime.now(datetime.timezone.utc).isoformat()
    vieja = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=3)).isoformat()
    MOCK_ORDERS["orden-reciente"] = {
        "id": "orden-reciente", "status": "pending", "created_at": ahora,
        "items": [{"product_id": producto["id"], "quantity": 2}],
    }
    MOCK_ORDERS["orden-pagada"] = {
        "id": "orden-pagada", "status": "paid", "created_at": vieja,
        "items": [{"product_id": producto["id"], "quantity": 5}],
    }

    with patch("app.routers.admin.supabase_client", None):
        response = client.post("/admin/orders/release-expired?minutes=60")

    assert response.json() == {"expired_orders": 0, "restocked_units": 0}
    assert int(MOCK_PRODUCTS[0]["stock"]) == stock_inicial
    assert MOCK_ORDERS["orden-reciente"]["status"] == "pending"
    assert MOCK_ORDERS["orden-pagada"]["status"] == "paid"


def test_cancelar_una_orden_pendiente_devuelve_su_stock():
    producto = MOCK_PRODUCTS[0]
    stock_inicial = int(producto["stock"])
    MOCK_ORDERS["orden-a-cancelar"] = {
        "id": "orden-a-cancelar",
        "status": "pending",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "items": [{"product_id": producto["id"], "quantity": 3}],
    }

    from app.core.security import verify_admin_user
    app.dependency_overrides[verify_admin_user] = override_auth
    with patch("app.routers.admin.supabase_client", None):
        response = client.patch("/admin/orders/orden-a-cancelar/status", json={"status": "cancelled"})

    assert response.status_code == 200
    assert MOCK_ORDERS["orden-a-cancelar"]["status"] == "cancelled"
    assert int(MOCK_PRODUCTS[0]["stock"]) == stock_inicial + 3


def test_sync_en_background_responde_al_instante_y_reporta_estado():
    with patch("requests.get") as mock_get, patch("app.routers.admin.supabase_client", None):
        mock_get.return_value = MagicMock(status_code=200, text=build_csv("30.00"))
        response = client.post(
            "/admin/products/sync-sheets?background=true", json={"csv_url": "http://fake-sheet.csv"}
        )
        assert response.status_code == 200
        assert response.json() == {"status": "started"}

        for _ in range(50):
            status = client.get("/admin/products/sync-status").json()
            if not status["running"] and status["finished_at"]:
                break
            import time
            time.sleep(0.1)

    assert status["error"] is None
    assert status["summary"]["errors"] == []
    assert status["summary"]["stock_writeback"] == [{"name": "Melena de Leon Gotas", "stock": 30}]
