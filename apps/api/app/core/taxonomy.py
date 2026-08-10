"""
Taxonomia de producto: categoria (objetivo), beneficio y tipo.

La planilla es la fuente de verdad de las tres. Mientras las columnas Beneficio y Tipo
esten vacias, se derivan de la categoria y del nombre para que la tienda no muestre la
misma etiqueta en todas las tarjetas, que es exactamente lo que pasaba con el
"Optimización Biológica" que caia por defecto en el carrusel del home.

Se deriva al LEER, no al escribir: en la base NULL significa "la planilla no lo dice".
Guardar el valor derivado haria imposible distinguirlo de un dato real del cliente.
"""
import unicodedata

DEFAULT_BENEFIT = "Bienestar General"
DEFAULT_PRODUCT_TYPE = "Suplemento"


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
