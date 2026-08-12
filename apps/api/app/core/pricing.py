"""Shared pricing logic — single source of truth for checkout calculations."""

CHILEAN_REGIONS = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Bío-Bío",
    "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
]

IVA_RATE = 0.19

# Metodo de entrega elegido en el checkout. No afecta el precio: el flete se resuelve
# fuera de la app y la entrega concreta se coordina por correo/telefono.
DELIVERY_METHODS = ["domicilio", "retiro_courier"]
COURIERS = ["blue_express", "starken", "pullman"]


# La tienda NUNCA cobra flete: el total que se paga por la pasarela es solo el de los
# productos. La region, la direccion y el courier se piden porque son los datos con los
# que se coordina la entrega, no un insumo del precio.
SHIPPING_COST_CLP = 0

# Politica comercial, no un cobro: sobre este monto NutraBlue asume el flete y para el
# cliente es envio gratis; bajo ese monto el pedido viaja "por pagar" y el cliente le
# paga al courier al recibirlo. Se usa solo para decidir que MENSAJE mostrar, nunca para
# sumar al total. El equivalente en el front vive en apps/web/src/lib/shipping.js.
FREE_SHIPPING_THRESHOLD = 50000


def has_free_shipping(cart_total: int) -> bool:
    return int(cart_total or 0) >= FREE_SHIPPING_THRESHOLD


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
