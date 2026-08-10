import pytest

from app.core.pricing import (
    CHILEAN_REGIONS,
    calculate_shipping,
    calculate_tax_breakdown,
    calculate_order_totals,
)


@pytest.mark.parametrize("region", CHILEAN_REGIONS)
def test_shipping_is_free_in_every_region(region):
    """NutraBlue asume el despacho: la tienda no cobra envio en ninguna region."""
    assert calculate_shipping(region) == 0


def test_tax_breakdown():
    subtotal, tax = calculate_tax_breakdown(11900)
    assert subtotal + tax == 11900
    assert tax == 1900


@pytest.mark.parametrize("region", ["Metropolitana", "Magallanes"])
def test_order_total_never_includes_shipping(region):
    """Antes el total variaba por region y habia un umbral de $50.000. Ya no."""
    totals = calculate_order_totals(18990, region)
    assert totals["shipping_cost"] == 0
    assert totals["total"] == 18990
    assert totals["subtotal"] + totals["tax"] == 18990
