"""
Taxonomia de producto: categoria (objetivo), beneficio y tipo.

El bug que reporto el cliente: el carrusel del home mostraba la misma etiqueta en
todas las tarjetas. La causa era que la derivacion tenia su propia lista de palabras
clave ('cognit', 'estres', 'longev'), que correspondia a categorias viejas y no
matcheaba ninguna de las reales, asi que todo caia al default literal.
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from app.core.taxonomy import (
    DEFAULT_BENEFIT,
    apply_taxonomy,
    derive_benefit,
    derive_product_type,
)

client = TestClient(app)

# Las cuatro categorias reales de la planilla.
CATEGORIAS_REALES = ["Energía", "Concentración y Calma", "Descanso y Longevidad", "Alimentación Diaria"]


@pytest.mark.parametrize("categoria", CATEGORIAS_REALES)
def test_ninguna_categoria_real_cae_al_default(categoria):
    """Este es exactamente el bug: todas caian al mismo valor por defecto."""
    assert derive_benefit(categoria) != DEFAULT_BENEFIT


def test_categorias_distintas_dan_beneficios_distintos():
    beneficios = {derive_benefit(c) for c in CATEGORIAS_REALES}
    assert len(beneficios) == len(CATEGORIAS_REALES)


@pytest.mark.parametrize("escrito", ["Energía", "energia", "ENERGIA", " Energía Natural "])
def test_la_derivacion_tolera_acentos_y_mayusculas(escrito):
    """La categoria se escribe a mano en la planilla y varia."""
    assert derive_benefit(escrito) == "Energía Natural"


def test_categoria_desconocida_cae_al_default():
    assert derive_benefit("Categoría Que No Existe") == DEFAULT_BENEFIT
    assert derive_benefit("") == DEFAULT_BENEFIT


@pytest.mark.parametrize(
    "nombre,esperado",
    [
        ("Melena de León en Gotas", "Gotas"),
        ("Aceite de Oliva", "Aceite"),
        ("Spirulina Premium Powder", "Polvo"),
        ("Maca en Polvo", "Polvo"),
        ("Reishi Mushroom Tea", "Infusión"),
        ("Mix de Berries", "Pack"),
    ],
)
def test_el_tipo_sale_del_nombre_del_producto(nombre, esperado):
    assert derive_product_type(nombre, "Energía") == esperado


def test_alimentacion_diaria_sin_pista_en_el_nombre_es_alimento():
    assert derive_product_type("Nueces", "Alimentación Diaria") == "Alimento"


def test_apply_taxonomy_no_pisa_lo_que_trajo_la_planilla():
    """La planilla y el admin mandan: la derivacion solo rellena vacios."""
    producto = {
        "name": "Maca en Polvo",
        "category": "Energía",
        "benefit": "Beneficio Cargado a Mano",
        "product_type": "Tipo Cargado a Mano",
    }
    resultado = apply_taxonomy(producto)
    assert resultado["benefit"] == "Beneficio Cargado a Mano"
    assert resultado["product_type"] == "Tipo Cargado a Mano"


def test_apply_taxonomy_rellena_lo_vacio():
    for vacio in (None, ""):
        resultado = apply_taxonomy({"name": "Maca en Polvo", "category": "Energía",
                                    "benefit": vacio, "product_type": vacio})
        assert resultado["benefit"] == "Energía Natural"
        assert resultado["product_type"] == "Polvo"


def test_el_catalogo_expone_la_taxonomia():
    productos = client.get("/products").json()
    assert productos
    for p in productos:
        assert p["benefit"], f"{p['name']} sin beneficio"
        assert p["product_type"], f"{p['name']} sin tipo"


def test_el_carrusel_del_home_no_repite_la_misma_etiqueta():
    """La queja literal del cliente: 'dice lo mismo para todos los productos'."""
    carrusel = client.get("/products/hero-carousel").json()
    assert len(carrusel) >= 2
    etiquetas = {p["benefit_tag"] for p in carrusel}
    assert len(etiquetas) > 1, f"todas las tarjetas dicen lo mismo: {etiquetas}"
    assert "Optimización Biológica" not in etiquetas


def test_el_carrusel_y_el_catalogo_dan_la_misma_etiqueta_para_el_mismo_producto():
    """Lo que pidio el cliente: carruseles del home sincronizados con el catalogo."""
    catalogo = {p["id"]: p for p in client.get("/products").json()}
    carrusel = client.get("/products/hero-carousel").json()

    comparados = 0
    for tarjeta in carrusel:
        producto = catalogo.get(tarjeta["id"])
        if not producto:
            continue
        comparados += 1
        assert tarjeta["benefit_tag"] == producto["benefit"]
        assert tarjeta["category"] == producto["category"]
        assert tarjeta["product_type"] == producto["product_type"]

    assert comparados > 0, "el carrusel no trajo ningun producto del catalogo"
