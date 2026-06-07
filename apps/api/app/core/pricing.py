"""Shared pricing logic — single source of truth for checkout calculations."""

CHILEAN_REGIONS = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble", "Bío-Bío",
    "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes",
]

IVA_RATE = 0.19


def calculate_shipping(region: str) -> int:
    if region == "Metropolitana":
        return 5000
    if region == "Valparaíso":
        return 7000
    if region == "Bío-Bío":
        return 8000
    return 10000


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
