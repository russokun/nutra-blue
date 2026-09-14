"""In-memory stores used when Supabase is not configured (local dev / demo mode)."""

MOCK_ORDERS: dict = {}
MOCK_CHAT_HISTORY: dict = {}

MOCK_LEADS: list = [
    {"id": "1", "email": "contacto@ignacio.cl", "source": "Footer", "created_at": "2026-06-29T10:00:00Z"},
    {"id": "2", "email": "pablo.valenzuela@gmail.com", "source": "Footer", "created_at": "2026-06-28T11:00:00Z"},
    {"id": "3", "email": "constanza.vargas@outlook.com", "source": "Footer", "created_at": "2026-06-27T12:00:00Z"}
]

MOCK_SUGGESTIONS: list = [
    {"id": 1, "text": "Creatina Monohidratada Micronizada", "status": "Pendiente", "created_at": "2026-06-29T14:00:00Z"},
    {"id": 2, "text": "Ashwagandha KSM-66 en cápsulas", "status": "Pendiente", "created_at": "2026-06-28T15:00:00Z"},
    {"id": 3, "text": "Colágeno Hidrolizado Marino", "status": "Considerado", "created_at": "2026-06-25T16:00:00Z"}
]

MOCK_COUPONS: list = [
    {"id": "c1", "code": "WELCOME15", "discount": 15, "description": "Bienvenida 15% off", "expiry": "2026-12-31", "first_purchase_only": True},
    {"id": "c2", "code": "BIENVENIDA15", "discount": 15, "description": "Bienvenida 15% off", "expiry": "2026-12-31", "first_purchase_only": True},
    {"id": "c3", "code": "NUTRA10", "discount": 10, "description": "Descuento especial 10%", "expiry": "2026-12-31", "first_purchase_only": False},
    {"id": "c4", "code": "LONGEVIDAD20", "discount": 20, "description": "Longevidad 20% off", "expiry": "2026-12-31", "first_purchase_only": False},
    {"id": "c5", "code": "BIOHACK", "discount": 12, "description": "Biohackers 12% off", "expiry": "2026-12-31", "first_purchase_only": False},
]


