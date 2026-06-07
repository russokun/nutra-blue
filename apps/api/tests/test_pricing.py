from app.core.pricing import calculate_shipping, calculate_tax_breakdown, calculate_order_totals


def test_shipping_metropolitana():
    assert calculate_shipping("Metropolitana") == 5000


def test_shipping_default():
    assert calculate_shipping("Magallanes") == 10000


def test_tax_breakdown():
    subtotal, tax = calculate_tax_breakdown(11900)
    assert subtotal + tax == 11900
    assert tax == 1900


def test_order_totals():
    totals = calculate_order_totals(18990, "Metropolitana")
    assert totals["shipping_cost"] == 5000
    assert totals["total"] == 18990 + 5000
    assert totals["subtotal"] + totals["tax"] == 18990
