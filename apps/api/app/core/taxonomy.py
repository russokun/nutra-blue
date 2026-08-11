"""
Taxonomia de producto: categoria (objetivo), beneficio y tipo.

De donde sale cada etiqueta, en orden de prioridad:

  1. La planilla, si trae columnas "Beneficio" y "Tipo". Hoy no las tiene, pero el sync
     las soporta como override manual.
  2. La ficha de Google Docs del producto, que es el caso normal: las secciones
     "Beneficios para el cliente" y "Descripcion del tipo de producto". Ahi el texto es
     libre y distinto en cada ficha, asi que se NORMALIZA contra un vocabulario acotado:
     si cada producto trajera su propia frase, el filtro del catalogo terminaria con un
     valor por producto y dejaria de servir como filtro.
  3. Si nada de lo anterior calza, se deriva de la categoria y del nombre.

La derivacion existe porque sin ella la tienda mostraba la misma etiqueta en todas las
tarjetas del carrusel: el default literal "Optimización Biológica".

Se resuelve al LEER, no al escribir: en la base NULL significa "todavia no lo sabemos".
Guardar el valor derivado haria imposible distinguirlo de un dato real del cliente.
"""
import unicodedata
from typing import Optional

DEFAULT_BENEFIT = "Bienestar General"
DEFAULT_PRODUCT_TYPE = "Suplemento"

# Vocabulario cerrado. Es lo que se muestra como etiqueta y lo que puebla los filtros del
# catalogo, asi que tiene que ser corto: son categorias de navegacion, no descripciones.
# Agregar un valor aca es una decision de producto, no un detalle tecnico.
CANONICAL_BENEFITS = (
    "Energía Natural",
    "Foco y Calma",
    "Descanso y Longevidad",
    "Manejo del Estrés",
    "Nutrición Diaria",
)

CANONICAL_PRODUCT_TYPES = (
    "Polvo",
    "Gotas",
    "Aceite",
    "Infusión",
    "Cápsulas",
    "Pack",
    "Alimento",
    "Suplemento",
)


def _slug(value: str) -> str:
    """Minusculas y sin acentos: la planilla escribe 'Energia' o 'Energía' segun el dia."""
    v = (value or "").strip().lower()
    return "".join(c for c in unicodedata.normalize("NFD", v) if unicodedata.category(c) != "Mn")


# Coincidencia por substring porque la categoria se escribe a mano en la planilla y
# varia ("Energia", "Energía Natural", "Energia y vitalidad").
_BENEFIT_BY_CATEGORY_KEYWORD = (
    ("energ", "Energía Natural"),
    ("concentr", "Foco y Calma"),
    ("calma", "Foco y Calma"),
    ("cognit", "Foco y Calma"),
    ("descans", "Descanso y Longevidad"),
    ("longev", "Descanso y Longevidad"),
    ("sueno", "Descanso y Longevidad"),
    ("estres", "Manejo del Estrés"),
    ("aliment", "Nutrición Diaria"),
)

_TYPE_BY_NAME_KEYWORD = (
    ("gotas", "Gotas"),
    ("tintura", "Gotas"),
    ("aceite", "Aceite"),
    ("polvo", "Polvo"),
    ("powder", "Polvo"),
    ("infusion", "Infusión"),
    ("te de", "Infusión"),
    ("tea", "Infusión"),
    ("capsul", "Cápsulas"),
    ("mix", "Pack"),
    ("pack", "Pack"),
    ("blend", "Pack"),
)

# Cuando el nombre no dice nada, el tipo depende de para que sirve la categoria.
_TYPE_BY_CATEGORY_KEYWORD = (
    ("aliment", "Alimento"),
)


# Vocabulario del texto libre de la ficha -> valor canonico. Es mas amplio que el mapa
# por categoria porque acá el texto lo escribe quien redacta la ficha, con sus palabras:
# "reduce la niebla mental", "ayuda a conciliar el sueño", "apoya tus defensas".
# El orden importa: gana la primera coincidencia, asi que lo mas especifico va primero.
_BENEFIT_FROM_TEXT = (
    ("estres", "Manejo del Estrés"),
    ("cortisol", "Manejo del Estrés"),
    ("ansiedad", "Manejo del Estrés"),
    ("adaptogen", "Manejo del Estrés"),
    ("concentr", "Foco y Calma"),
    ("foco", "Foco y Calma"),
    ("enfoque", "Foco y Calma"),
    ("memoria", "Foco y Calma"),
    ("mental", "Foco y Calma"),
    ("cognit", "Foco y Calma"),
    ("claridad", "Foco y Calma"),
    ("calma", "Foco y Calma"),
    # Las fichas reales hablan de neurociencia, no de "concentracion": la de Melena de
    # Leon abre con "Regeneracion Neuronal y Neuroplasticidad".
    ("nootrop", "Foco y Calma"),
    ("neuron", "Foco y Calma"),
    ("neuroplast", "Foco y Calma"),
    ("neurogen", "Foco y Calma"),
    ("cerebr", "Foco y Calma"),
    ("sinapsis", "Foco y Calma"),
    ("brain", "Foco y Calma"),
    ("descans", "Descanso y Longevidad"),
    ("sueno", "Descanso y Longevidad"),
    ("dormir", "Descanso y Longevidad"),
    ("longev", "Descanso y Longevidad"),
    ("antioxid", "Descanso y Longevidad"),
    ("envejec", "Descanso y Longevidad"),
    ("polifenol", "Descanso y Longevidad"),
    ("energ", "Energía Natural"),
    ("vitalidad", "Energía Natural"),
    ("resistencia", "Energía Natural"),
    ("rendimiento fisico", "Energía Natural"),
    ("defensa", "Nutrición Diaria"),
    ("inmun", "Nutrición Diaria"),
    ("digest", "Nutrición Diaria"),
    ("corazon", "Nutrición Diaria"),
    ("cardio", "Nutrición Diaria"),
    ("proteina", "Nutrición Diaria"),
    ("vitamina", "Nutrición Diaria"),
    ("mineral", "Nutrición Diaria"),
    ("nutri", "Nutrición Diaria"),
)

_TYPE_FROM_TEXT = (
    ("polvo", "Polvo"),
    ("powder", "Polvo"),
    ("gotas", "Gotas"),
    ("tintura", "Gotas"),
    ("extracto liquido", "Gotas"),
    ("aceite", "Aceite"),
    ("infusion", "Infusión"),
    ("hierba", "Infusión"),
    ("te de", "Infusión"),
    ("capsul", "Cápsulas"),
    ("comprimido", "Cápsulas"),
    ("tableta", "Cápsulas"),
    ("pack", "Pack"),
    ("combo", "Pack"),
    ("mix", "Pack"),
    ("blend", "Pack"),
    # Singular y plural: "fruto seco" no matchea "frutos secos".
    ("fruto seco", "Alimento"),
    ("frutos secos", "Alimento"),
    ("semilla", "Alimento"),
    ("snack", "Alimento"),
    ("alimento", "Alimento"),
    ("suplemento", "Suplemento"),
)


def _match(texto: str, vocabulario) -> Optional[str]:
    slug = _slug(texto)
    if not slug:
        return None
    for needle, canonico in vocabulario:
        if needle in slug:
            return canonico
    return None


def normalize_benefit(texto: str) -> Optional[str]:
    """
    Lleva el texto libre de la ficha a uno de los beneficios canonicos.

    Devuelve None si no reconoce nada, para que quien llama sepa que tiene que caer a la
    derivacion por categoria en vez de mostrar una frase suelta como etiqueta.
    """
    if texto in CANONICAL_BENEFITS:
        return texto
    return _match(texto, _BENEFIT_FROM_TEXT)


def normalize_benefit_from_bullets(vinetas) -> Optional[str]:
    """
    Elige el beneficio principal de la lista de vinetas de la ficha.

    Se evalua vineta por vineta EN ORDEN y gana la primera que se reconoce, en vez de
    unir todo el texto y buscar. La diferencia no es cosmetica: en la ficha real de
    Melena de Leon, uniendo todo gana "ansiedad" (que aparece en la cuarta vineta,
    "Manejo de Ansiedad y Depresion Leve") y el producto quedaba etiquetado como "Manejo
    del Estres", cuando es un nootropico. Vineta por vineta gana la segunda,
    "Nootropico Natural de Alto Rendimiento", y queda como "Foco y Calma".

    Las fichas ordenan las vinetas por importancia, asi que la primera reconocible es el
    beneficio principal.
    """
    for vineta in vinetas or []:
        encontrado = normalize_benefit(vineta)
        if encontrado:
            return encontrado
    return None


def normalize_product_type(texto: str) -> Optional[str]:
    """Idem para el tipo. None si el texto de la ficha no calza con nada conocido."""
    if texto in CANONICAL_PRODUCT_TYPES:
        return texto
    return _match(texto, _TYPE_FROM_TEXT)


def derive_benefit(category: str) -> str:
    slug = _slug(category)
    for needle, benefit in _BENEFIT_BY_CATEGORY_KEYWORD:
        if needle in slug:
            return benefit
    return DEFAULT_BENEFIT


def derive_product_type(name: str, category: str) -> str:
    slug_nombre = _slug(name)
    for needle, ptype in _TYPE_BY_NAME_KEYWORD:
        if needle in slug_nombre:
            return ptype

    slug_categoria = _slug(category)
    for needle, ptype in _TYPE_BY_CATEGORY_KEYWORD:
        if needle in slug_categoria:
            return ptype

    return DEFAULT_PRODUCT_TYPE


def apply_taxonomy(product: dict) -> dict:
    """
    Rellena benefit y product_type cuando vienen vacios. Nunca pisa lo que trajo la
    planilla ni lo que se cargo a mano en el panel admin.
    """
    if not product.get("benefit"):
        product["benefit"] = derive_benefit(product.get("category") or "")
    if not product.get("product_type"):
        product["product_type"] = derive_product_type(
            product.get("name") or "", product.get("category") or ""
        )
    return product
