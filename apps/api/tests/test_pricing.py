import pytest

from app.core.pricing import (
    CHILEAN_REGIONS,
    FREE_SHIPPING_THRESHOLD,
    calculate_shipping,
    calculate_tax_breakdown,
    calculate_order_totals,
    has_free_shipping,
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


def test_free_shipping_within_rm_over_threshold():
    assert has_free_shipping(FREE_SHIPPING_THRESHOLD, "Metropolitana") is True
    assert has_free_shipping(FREE_SHIPPING_THRESHOLD - 1, "Metropolitana") is False


@pytest.mark.parametrize("region", [r for r in CHILEAN_REGIONS if r != "Metropolitana"])
def test_shipping_outside_rm_is_always_paid_by_customer(region):
    """Fuera de la RM el flete siempre lo paga el cliente, sin importar el monto."""
    assert has_free_shipping(FREE_SHIPPING_THRESHOLD, region) is False
    assert has_free_shipping(FREE_SHIPPING_THRESHOLD * 10, region) is False
