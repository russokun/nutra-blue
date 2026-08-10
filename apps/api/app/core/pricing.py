"""Shared pricing logic — single source of truth for checkout calculations."""

CHILEAN_REGIONS = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Bío-Bío",
    "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
]

IVA_RATE = 0.19

# Metodo de entrega elegido en el checkout. No afecta el precio: el despacho se sigue
# cobrando por region y la entrega concreta se coordina por correo/telefono.
DELIVERY_METHODS = ["domicilio", "retiro_courier"]
COURIERS = ["blue_express", "starken", "pullman"]


# NutraBlue asume el costo del despacho ("envios por pagar"): la tienda nunca lo cobra,
# en ninguna region. La region, la direccion y el courier se siguen pidiendo porque son
# los datos con los que se coordina la entrega, no un insumo del precio.
#
# El mensaje comercial de envio gratis es marketing y vive en el front. A proposito ya no
# hay un umbral aca, para que nadie lo confunda con un calculo.
SHIPPING_COST_CLP = 0


def calculate_shipping(region: str) -> int:
    return SHIPPING_COST_CLP


def calculate_tax_breakdown(cart_total: int) -> tuple[int, int]:
    """Returns (subtotal_excl_tax, tax) for a cart total that includes 19% IVA."""
    tax = round(cart_total - (cart_total / (1 + IVA_RATE)))
    subtotal = cart_total - tax
    return subtotal, tax


def calculate_order_totals(cart_total: int, region: str) -> dict:
    subtotal, tax = calculate_tax_breakdown(cart_total)
    shipping_cost = calculate_shipping(region)
    total = cart_total + shipping_cost
    return {
        "subtotal": subtotal,
        "tax": tax,
        "shipping_cost": shipping_cost,
        "total": total,
    }
