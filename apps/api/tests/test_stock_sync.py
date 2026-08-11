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


# Estructura actual de la planilla: titulo, cabecera principal (con "Inventario"),
# subcabecera (solo "Comentario") y despues los productos.
def build_csv(stock: str, price: str = "$19,990", name: str = "Melena de Leon Gotas") -> str:
    return (
        "Lista de Suplementos y Alimentos,,,,,,,,\n"
        "Categoría / Objetivo,Suplemento / Alimento,Productor,Contacto,$ Compra,$ Venta,,Inventario,Link Doc\n"
        ",,,,,,Comentario,,\n"
        f"Estimulación Cerebral,{name},ONGO,ongo.cl,\"$11,700\",\"{price}\",,{stock},\n"
    )


# Disposicion anterior, con "Inventario" en la subcabecera. Se mantiene soportada.
def build_csv_inventario_en_subcabecera(stock: str, price: str = "$19,990") -> str:
    return (
        "Lista de Suplementos y Alimentos,,,,,,,,\n"
        "Categoría / Objetivo,Suplemento / Alimento,Productor,Contacto,$ Compra,$ Venta,,,Link Doc\n"
        ",,,,,,Comentario,Inventario,\n"
        f"Estimulación Cerebral,Melena de Leon Gotas,ONGO,ongo.cl,\"$11,700\",\"{price}\",,{stock},\n"
    )


# Planilla con las columnas de taxonomia agregadas al final, despues de "Link Doc",
# que es donde el cliente tiene que ponerlas. Sirve de regresion: los fallbacks
# posicionales (precio=5, stock=7, doc=8) estan calibrados a las 9 columnas originales,
# asi que agregar columnas al final no puede correrlos.
def build_csv_con_taxonomia(stock: str = "12", price: str = "$19,990",
                            beneficio: str = "Foco y Calma", tipo: str = "Gotas") -> str:
    return (
        "Lista de Suplementos y Alimentos,,,,,,,,,,\n"
        "Categoría / Objetivo,Suplemento / Alimento,Productor,Contacto,$ Compra,$ Venta,,Inventario,Link Doc,Beneficio,Tipo\n"
        ",,,,,,Comentario,,,,\n"
        f"Estimulación Cerebral,Melena de Leon Gotas,ONGO,ongo.cl,\"$11,700\",\"{price}\",,{stock},,{beneficio},{tipo}\n"
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


def test_la_columna_inventario_no_se_confunde_con_la_de_venta():
    """
    "inVENTArio" contiene "venta": con la etiqueta Inventario en la cabecera principal,
    la deteccion de precio se la llevaba a ella y todos los productos quedaban con
    precio = stock * 100 ($3.000 para un stock de 30).
    """
    summary = run_sync(build_csv("30.00", price="$19,990"))

    assert summary["errors"] == []
    producto = find_product("Melena de Leon Gotas")
    assert producto["price"] == 19990
    assert producto["stock"] == 30


def test_soporta_inventario_en_la_subcabecera():
    """La disposicion anterior de la planilla tiene que seguir funcionando."""
    summary = run_sync(build_csv_inventario_en_subcabecera("30.00"))

    assert summary["errors"] == []
    producto = find_product("Melena de Leon Gotas")
    assert producto["price"] == 19990
    assert producto["stock"] == 30


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


def test_el_catalogo_publico_no_expone_la_url_de_la_ficha():
    """
    Las fichas de Google Docs traen costos, margenes y datos del proveedor, y estan
    compartidas por enlace: publicar la URL en /products filtra todo eso. El panel
    admin si la necesita, asi que solo se excluye del catalogo publico.
    """
    run_sync(build_csv("30.00"))

    with patch("app.routers.products.supabase_client", None):
        publico = client.get("/products").json()
    assert publico, "el catalogo publico vino vacio"
    assert all("google_doc_url" not in p for p in publico)

    from app.core.security import verify_admin_user
    app.dependency_overrides[verify_admin_user] = override_auth
    with patch("app.routers.admin.supabase_client", None):
        admin = client.get("/admin/products").json()
    assert any("google_doc_url" in p for p in admin), "el admin si tiene que verla"


def build_csv_multi(productos) -> str:
    """productos: lista de (nombre, precio, stock), en el orden que tendran en la planilla."""
    filas = "".join(
        f"Estimulación Cerebral,{n},ONGO,ongo.cl,\"$11,700\",\"{p}\",,{s},\n"
        for n, p, s in productos
    )
    return (
        "Lista de Suplementos y Alimentos,,,,,,,,\n"
        "Categoría / Objetivo,Suplemento / Alimento,Productor,Contacto,$ Compra,$ Venta,,Inventario,Link Doc\n"
        ",,,,,,Comentario,,\n"
    ) + filas


def test_el_admin_lista_en_el_orden_de_la_planilla():
    """El orden del Excel manda; alfabetico daria Avena, Berro, Zanahoria."""
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_multi([("Zanahoria", "$1,000", "10"),
                              ("Avena", "$2,000", "20"),
                              ("Berro", "$3,000", "30")]))

    from app.core.security import verify_admin_user
    app.dependency_overrides[verify_admin_user] = override_auth
    with patch("app.routers.admin.supabase_client", None):
        listado = client.get("/admin/products").json()

    de_la_planilla = [p["name"] for p in listado if p.get("sort_order") is not None]
    assert de_la_planilla == ["Zanahoria", "Avena", "Berro"]


def test_los_productos_creados_a_mano_quedan_al_final():
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_multi([("Zanahoria", "$1,000", "10")]))
    MOCK_PRODUCTS.append({"id": "manual", "name": "Producto A Mano", "price": 1, "stock": 1,
                          "category": "Otros"})

    from app.core.security import verify_admin_user
    app.dependency_overrides[verify_admin_user] = override_auth
    with patch("app.routers.admin.supabase_client", None):
        listado = client.get("/admin/products").json()

    assert listado[-1]["name"] == "Producto A Mano"


def test_borra_los_productos_que_ya_no_estan_en_la_planilla():
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_multi([("Zanahoria", "$1,000", "10"), ("Avena", "$2,000", "20")]))
    assert {"Zanahoria", "Avena"} <= {p["name"] for p in MOCK_PRODUCTS}

    summary = run_sync(build_csv_multi([("Zanahoria", "$1,000", "10")]))

    assert summary["deleted"] == ["Avena"]
    assert "Avena" not in {p["name"] for p in MOCK_PRODUCTS}
    assert "Zanahoria" in {p["name"] for p in MOCK_PRODUCTS}


def test_no_borra_nada_si_hubo_errores_de_validacion():
    """Una corrida con errores puede estar viendo la planilla a medias: no se borra."""
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_multi([("Zanahoria", "$1,000", "10"), ("Avena", "$2,000", "20")]))

    summary = run_sync(build_csv_multi([("Zanahoria", "no-es-un-numero", "10")]))

    assert summary["errors"], "el test necesita que la corrida tenga errores"
    assert summary["deleted"] == []
    assert "Avena" in {p["name"] for p in MOCK_PRODUCTS}


def test_no_borra_nada_si_la_planilla_vino_casi_vacia():
    """Proteccion contra una lectura truncada: traeria pocas filas y sin errores."""
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_multi([(f"Producto {i}", "$1,000", "10") for i in range(10)]))

    summary = run_sync(build_csv_multi([("Producto 0", "$1,000", "10")]))

    assert summary["deleted"] == []
    assert summary["warnings"], "tiene que avisar por que no borro"
    # Se busca en todos los warnings, no en el primero: el sync tambien avisa por otras
    # cosas (por ejemplo que la planilla no trae las columnas Beneficio y Tipo).
    assert any("lectura incompleta" in w["error"] for w in summary["warnings"])
    assert "Producto 5" in {p["name"] for p in MOCK_PRODUCTS}


def test_el_borrado_no_toca_la_fila_interna_del_sync():
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_multi([("Zanahoria", "$1,000", "10")]))
    assert any(p["name"] == "__SYSTEM_SYNC_LOG__" for p in MOCK_PRODUCTS)

    summary = run_sync(build_csv_multi([("Zanahoria", "$1,000", "10")]))

    assert "__SYSTEM_SYNC_LOG__" not in summary["deleted"]
    assert any(p["name"] == "__SYSTEM_SYNC_LOG__" for p in MOCK_PRODUCTS)


# --------------------------------------------------------------- taxonomia


def test_la_columna_de_la_planilla_es_un_override_manual():
    """
    La taxonomia sale normalmente de la ficha de Google Docs, pero si alguien agrega
    columnas Beneficio y Tipo a la planilla, esas mandan.
    """
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_con_taxonomia(beneficio="Foco y Calma", tipo="Gotas"))

    producto = find_product("Melena de Leon Gotas")
    assert producto["benefit"] == "Foco y Calma"
    assert producto["product_type"] == "Gotas"


def test_agregar_columnas_al_final_no_corre_precio_ni_stock():
    """
    Regresion del riesgo real: los fallbacks posicionales estan calibrados a las 9
    columnas originales. Si el cliente agrega Beneficio y Tipo al final, precio, stock,
    nombre y categoria tienen que seguir mapeando igual.
    """
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_con_taxonomia(stock="12", price="$19,990"))

    producto = find_product("Melena de Leon Gotas")
    assert producto["price"] == 19990
    assert producto["stock"] == 12
    assert producto["category"] == "Estimulación Cerebral"


def test_sin_columnas_ni_ficha_no_avisa_nada():
    """
    Que la planilla no traiga columnas de taxonomia es el estado normal: los datos vienen
    de la ficha. No tiene que ensuciar el reporte con avisos en cada corrida.
    """
    MOCK_PRODUCTS.clear()
    summary = run_sync(build_csv("10"))

    assert not any("columna(s)" in w["error"] for w in summary["warnings"]), summary["warnings"]


def test_sin_valor_nuevo_no_se_borra_lo_cargado_a_mano():
    """
    Sin esta proteccion, cada sync dejaria en NULL la taxonomia que el cliente cargo
    desde el panel admin.
    """
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_con_taxonomia(beneficio="Foco y Calma", tipo="Gotas"))
    assert find_product("Melena de Leon Gotas")["benefit"] == "Foco y Calma"

    # Ahora la planilla vuelve a la disposicion sin las columnas de taxonomia.
    run_sync(build_csv("10"))

    producto = find_product("Melena de Leon Gotas")
    assert producto["benefit"] == "Foco y Calma"
    assert producto["product_type"] == "Gotas"


def test_una_columna_vacia_no_queda_como_string_vacio():
    """
    Vacio tiene que ser None, para que el backend sepa que debe derivarlo al leer, y
    nunca "" (que seria un valor y se mostraria como etiqueta en blanco).

    El tipo si queda resuelto: el producto se llama "Melena de Leon Gotas" y el nombre
    es la primera fuente del formato, antes que la ficha.
    """
    MOCK_PRODUCTS.clear()
    run_sync(build_csv_con_taxonomia(beneficio="", tipo=""))

    producto = find_product("Melena de Leon Gotas")
    assert producto["benefit"] is None
    assert producto["product_type"] == "Gotas"


# ------------------------------------------------ taxonomia desde la ficha de Google Docs


def build_csv_con_doc(doc_url: str = "https://docs.google.com/document/d/abc123/edit") -> str:
    return (
        "Lista de Suplementos y Alimentos,,,,,,,,\n"
        "Categoría / Objetivo,Suplemento / Alimento,Productor,Contacto,$ Compra,$ Venta,,Inventario,Link Doc\n"
        ",,,,,,Comentario,,\n"
        f"Estimulación Cerebral,Melena de Leon Gotas,ONGO,ongo.cl,\"$11,700\",\"$19,990\",,10,{doc_url}\n"
    )


def run_sync_con_ficha(secciones: dict, csv_text: str = None):
    """Corre el sync simulando la ficha de Google Docs que devolveria el parser."""
    ficha = {
        "description": "", "origin": "", "cross_selling": "", "product_profile": "",
        "ingredients": "", "usage": "", "precautions": "", "extracted_benefits": [],
        **secciones,
    }
    with patch("app.services.doc_parser.parse_google_doc", return_value=ficha):
        return run_sync(csv_text or build_csv_con_doc())


def test_el_beneficio_sale_de_la_ficha_normalizado():
    """
    La ficha escribe con sus palabras ("Reduce la niebla mental"). Se lleva al vocabulario
    canonico para que sirva como etiqueta Y como filtro del catalogo.
    """
    MOCK_PRODUCTS.clear()
    run_sync_con_ficha({
        "extracted_benefits": ["Reduce la niebla mental", "Mejora la memoria"],
    })

    assert find_product("Melena de Leon Gotas")["benefit"] == "Foco y Calma"


def test_el_tipo_sale_de_la_descripcion_de_la_ficha():
    MOCK_PRODUCTS.clear()
    run_sync_con_ficha({
        "description": "Extracto liquido en gotas, de uso diario bajo la lengua.",
    })

    assert find_product("Melena de Leon Gotas")["product_type"] == "Gotas"


def test_fichas_distintas_dan_beneficios_distintos():
    """El bug original era que todas las tarjetas mostraban la misma etiqueta."""
    resultados = []
    for vinetas in (
        ["Aporta energía sostenida durante el día"],
        ["Ayuda a conciliar el sueño"],
        ["Apoya tus defensas"],
    ):
        MOCK_PRODUCTS.clear()
        run_sync_con_ficha({"extracted_benefits": vinetas})
        resultados.append(find_product("Melena de Leon Gotas")["benefit"])

    assert resultados == ["Energía Natural", "Descanso y Longevidad", "Nutrición Diaria"]


def test_si_la_ficha_no_calza_avisa_y_deja_derivar():
    """No se muestra una frase suelta como etiqueta: se avisa y cae a la derivacion."""
    MOCK_PRODUCTS.clear()
    summary = run_sync_con_ficha({"extracted_benefits": ["Producto de origen chileno"]})

    assert find_product("Melena de Leon Gotas")["benefit"] is None
    assert any("No se reconoció el beneficio" in w["error"] for w in summary["warnings"])


def test_la_planilla_le_gana_a_la_ficha():
    MOCK_PRODUCTS.clear()
    run_sync_con_ficha(
        {"extracted_benefits": ["Aporta energía sostenida"]},
        csv_text=build_csv_con_taxonomia(beneficio="Manejo del Estrés", tipo="Cápsulas"),
    )

    producto = find_product("Melena de Leon Gotas")
    assert producto["benefit"] == "Manejo del Estrés"
    assert producto["product_type"] == "Cápsulas"
