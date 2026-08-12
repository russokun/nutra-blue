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
    CANONICAL_BENEFITS,
    CANONICAL_PRODUCT_TYPES,
    DEFAULT_BENEFIT,
    apply_taxonomy,
    derive_benefit,
    derive_product_type,
    normalize_benefit,
    normalize_benefit_from_bullets,
    normalize_product_type,
)

client = TestClient(app)

# Categorias tal cual estan escritas en la planilla de produccion, con la cantidad de
# productos de cada una. Los acentos raros ("inmunològico", "energìa") son los de verdad.
CATEGORIAS_DE_PRODUCCION = {
    "Proteína": 6,
    "Fortalecer sistema inmunològico y energìa": 5,
    "Aumento Testosterona": 5,
    "Digestión": 4,
    "Energía": 3,
    "Estimulación Cerebral": 3,
    "Mejorar Sueño": 1,
}

CATEGORIAS_REALES = list(CATEGORIAS_DE_PRODUCCION)


@pytest.mark.parametrize("categoria", CATEGORIAS_REALES)
def test_ninguna_categoria_real_cae_al_default(categoria):
    """Este es exactamente el bug: todas caian al mismo valor por defecto."""
    assert derive_benefit(categoria) != DEFAULT_BENEFIT


def test_ningun_producto_de_produccion_cae_al_default():
    """
    Fijado contra el catalogo real. El mapa de categorias vivia separado del vocabulario
    de las fichas y era mucho mas pobre: categorias tan claras como "Estimulación
    Cerebral", "Digestión" o "Proteína" caian al valor por defecto, y con ellas 15 de los
    27 productos de produccion.
    """
    al_default = {
        categoria: n
        for categoria, n in CATEGORIAS_DE_PRODUCCION.items()
        if derive_benefit(categoria) == DEFAULT_BENEFIT
    }
    assert not al_default, f"categorias sin beneficio reconocido: {al_default}"


@pytest.mark.parametrize(
    "categoria,esperado",
    [
        ("Proteína", "Nutrición Diaria"),
        ("Digestión", "Nutrición Diaria"),
        ("Estimulación Cerebral", "Foco y Calma"),
        ("Mejorar Sueño", "Descanso y Longevidad"),
        ("Energía", "Energía Natural"),
        ("Aumento Testosterona", "Energía Natural"),
    ],
)
def test_las_categorias_de_produccion_dan_el_beneficio_esperado(categoria, esperado):
    assert derive_benefit(categoria) == esperado


def test_categorias_distintas_dan_beneficios_distintos():
    """No todas distintas —son 7 categorias para 5 beneficios— pero si mas de una."""
    beneficios = {derive_benefit(c) for c in CATEGORIAS_REALES}
    assert len(beneficios) >= 4


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


# --------------------------------- normalizacion del texto libre de la ficha de Google Docs


@pytest.mark.parametrize(
    "texto,esperado",
    [
        ("Reduce la niebla mental", "Foco y Calma"),
        ("Mejora la concentración durante el día", "Foco y Calma"),
        ("Aporta energía sostenida sin bajones", "Energía Natural"),
        ("Ayuda a conciliar el sueño", "Descanso y Longevidad"),
        ("Rico en antioxidantes y polifenoles", "Descanso y Longevidad"),
        ("Adaptógeno que ayuda a regular el cortisol", "Manejo del Estrés"),
        ("Apoya tus defensas naturales", "Nutrición Diaria"),
        ("Fuente de proteína completa", "Nutrición Diaria"),
    ],
)
def test_normaliza_el_beneficio_del_texto_de_la_ficha(texto, esperado):
    assert normalize_benefit(texto) == esperado


@pytest.mark.parametrize(
    "texto,esperado",
    [
        ("Extracto líquido en gotas para uso sublingual", "Gotas"),
        ("Presentación en polvo para batidos", "Polvo"),
        ("Aceite de primera prensada en frío", "Aceite"),
        ("Hierba para infusión caliente", "Infusión"),
        ("Viene en cápsulas vegetales", "Cápsulas"),
        ("Pack de tres productos complementarios", "Pack"),
        ("Frutos secos listos para comer", "Alimento"),
    ],
)
def test_normaliza_el_tipo_del_texto_de_la_ficha(texto, esperado):
    assert normalize_product_type(texto) == esperado


def test_lo_que_no_calza_devuelve_none():
    """
    None es la senal de "no lo reconoci": quien llama tiene que caer a la derivacion en
    vez de mostrar una frase suelta como etiqueta.
    """
    assert normalize_benefit("Producto de origen chileno") is None
    assert normalize_product_type("Elaborado por productores locales") is None
    assert normalize_benefit("") is None
    assert normalize_product_type("") is None


def test_un_valor_ya_canonico_pasa_tal_cual():
    for valor in CANONICAL_BENEFITS:
        assert normalize_benefit(valor) == valor
    for valor in CANONICAL_PRODUCT_TYPES:
        assert normalize_product_type(valor) == valor


def test_la_derivacion_por_categoria_solo_usa_valores_canonicos():
    """Sin esto, los filtros del catalogo mezclarian dos vocabularios distintos."""
    for categoria in CATEGORIAS_REALES:
        assert derive_benefit(categoria) in CANONICAL_BENEFITS
        assert derive_product_type("Producto Cualquiera", categoria) in CANONICAL_PRODUCT_TYPES


# ------------------------------------------------- ficha real: Melena de Leon
#
# Texto copiado tal cual de la ficha de Google Docs que usa NutraBlue, para que los
# cambios en el vocabulario se validen contra como escriben de verdad y no contra
# ejemplos inventados.

MELENA_VINETAS = [
    "Regeneración Neuronal y Neuroplasticidad: Sus compuestos únicos (erinacinas y "
    "hericenonas) cruzan la barrera hematoencefálica y estimulan directamente la síntesis "
    "del Factor de Crecimiento Nervioso (NGF). Esto repara neuronas dañadas, forma nuevas "
    "sinapsis y protege activamente contra enfermedades como Alzheimer y demencia.",
    "Nootrópico Natural de Alto Rendimiento: Elimina la famosa 'niebla mental' (brain fog), "
    "optimizando la velocidad de procesamiento, mejorando dramáticamente la memoria a corto "
    "plazo y permitiendo períodos de trabajo profundo (Deep Work) sin el uso de "
    "estimulantes sintéticos.",
    "Apoyo al Eje Intestino-Cerebro: Es un poderoso aliado gastrointestinal. Protege y "
    "regenera la mucosa del estómago y el intestino, combatiendo úlceras, inflamación e "
    "infecciones por H. pylori, lo que indirectamente mejora el estado de ánimo.",
    "Manejo de Ansiedad y Depresión Leve: Estudios demuestran que el consumo sostenido de "
    "Melena de León reduce la inflamación sistémica, lo cual está directamente ligado a la "
    "reducción de síntomas de ansiedad y estados depresivos.",
]

MELENA_TIPO = (
    "Extracto en polvo nootrópico de hongo funcional. Elaborado mediante doble extracción "
    "a partir del 'cuerpo fructífero' maduro, con el objetivo de retener al máximo los "
    "compuestos neurogénicos (erinacinas y hericenonas) de forma completamente biodisponible."
)


def test_ficha_real_melena_de_leon_da_foco_y_calma():
    """Es un nootrópico: la etiqueta correcta es Foco y Calma."""
    assert normalize_benefit_from_bullets(MELENA_VINETAS) == "Foco y Calma"


def test_ficha_real_melena_de_leon_da_polvo():
    assert normalize_product_type(MELENA_TIPO) == "Polvo"


def test_una_vineta_secundaria_no_le_gana_a_la_principal():
    """
    Regresion concreta: uniendo todas las viñetas en un solo texto ganaba "ansiedad", que
    aparece recién en la cuarta ("Manejo de Ansiedad y Depresión Leve"), y el producto
    quedaba como "Manejo del Estrés". Las fichas ordenan por importancia.
    """
    assert normalize_benefit(" ".join(MELENA_VINETAS)) == "Manejo del Estrés"
    assert normalize_benefit_from_bullets(MELENA_VINETAS) == "Foco y Calma"


# Las cuatro fichas reales que revisamos. Se guardan los titulos de las viñetas, que es
# la señal que usa la normalizacion, en el orden en que aparecen en cada documento.
TITULOS_POR_FICHA = {
    "Melena de León": [
        "Regeneración Neuronal y Neuroplasticidad",
        "Nootrópico Natural de Alto Rendimiento",
        "Apoyo al Eje Intestino-Cerebro",
        "Manejo de Ansiedad y Depresión Leve",
    ],
    "Ajo Negro": [
        "Escudo Cardiovascular Absoluto",
        "Densidad Antioxidante Duplicada",
        "Refuerzo Inmunológico Inmediato",
        "Prebiótico de Alta Calidad sin Mal Aliento",
    ],
    "Maca": [
        "Energía y Resistencia Sostenida (Sin Cafeína)",
        "Maestría Hormonal y Menopausia",
        "Salud Reproductiva y Libido",
        "Densidad Ósea y Claridad Mental",
    ],
    "Superfrutos": [
        "Máximo Poder Antioxidante y Antienvejecimiento",
        "Salud Metabólica y Control de Peso",
        "Escudo Ocular y Neuroprotección",
        "Identidad Chilena y Vitalidad",
    ],
}


@pytest.mark.parametrize(
    "producto,esperado",
    [
        ("Melena de León", "Foco y Calma"),
        ("Ajo Negro", "Nutrición Diaria"),
        ("Maca", "Energía Natural"),
        ("Superfrutos", "Descanso y Longevidad"),
    ],
)
def test_las_cuatro_fichas_reales_dan_el_beneficio_correcto(producto, esperado):
    assert normalize_benefit_from_bullets(TITULOS_POR_FICHA[producto]) == esperado


def test_las_cuatro_fichas_reales_dan_beneficios_distintos():
    """Lo que reportó el cliente era justamente que todas decían lo mismo."""
    resultados = [normalize_benefit_from_bullets(v) for v in TITULOS_POR_FICHA.values()]
    assert len(set(resultados)) == len(resultados), resultados


@pytest.mark.parametrize(
    "titulo,cuerpo,esperado",
    [
        # Maca: el cuerpo habla de adaptógeno y de fatiga suprarrenal.
        (
            "Energía y Resistencia Sostenida (Sin Cafeína)",
            "Actúa como un tónico natural adaptógeno que combate la fatiga suprarrenal.",
            "Energía Natural",
        ),
        # Ajo Negro: el cuerpo menciona estrés oxidativo, que es antioxidantes.
        (
            "Densidad Antioxidante Duplicada",
            "El proceso de fermentación oscura duplica su capacidad de combatir el "
            "estrés oxidativo de las células.",
            "Descanso y Longevidad",
        ),
    ],
)
def test_el_titulo_de_la_vineta_le_gana_al_cuerpo(titulo, cuerpo, esperado):
    """
    El título es lo que quiso decir quien redactó la ficha; el cuerpo es prosa que toca
    muchos temas. Mirar el cuerpo primero etiquetaba ambos casos como "Manejo del Estrés".
    """
    assert normalize_benefit_from_bullets([f"{titulo}: {cuerpo}"]) == esperado


def test_el_nombre_del_producto_le_gana_a_la_ficha_para_el_tipo():
    """
    La ficha de Maca describe la materia prima ("Raíz tuberosa andina clasificada como
    superalimento"), pero el SKU que se vende es "Maca en Polvo". Manda el nombre.
    """
    ficha_maca = "Raíz tuberosa andina clasificada como superalimento y adaptógeno."
    assert normalize_product_type(ficha_maca) == "Alimento"
    assert normalize_product_type("Maca en Polvo") == "Polvo"


def test_la_ficha_resuelve_el_tipo_cuando_el_nombre_no_dice_nada():
    """"Ajo Chilote Negro" no nombra un formato; su ficha habla del bulbo."""
    assert normalize_product_type("Ajo Chilote Negro") is None
    ficha_ajo = (
        "Ajo elefante chilote en estado de maduración profunda. Se somete a un largo "
        "proceso de fermentación natural que oscurece el bulbo."
    )
    assert normalize_product_type(ficha_ajo) == "Alimento"


def test_las_vinetas_que_no_se_reconocen_se_saltan():
    """Se sigue buscando en las siguientes en vez de rendirse en la primera."""
    vinetas = ["Producto de origen chileno", "Certificado orgánico", "Aporta energía sostenida"]
    assert normalize_benefit_from_bullets(vinetas) == "Energía Natural"


def test_sin_ninguna_vineta_reconocible_devuelve_none():
    assert normalize_benefit_from_bullets(["Producto de origen chileno"]) is None
    assert normalize_benefit_from_bullets([]) is None
    assert normalize_benefit_from_bullets(None) is None


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
