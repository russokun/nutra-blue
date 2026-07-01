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
    {"id": "c1", "code": "BIENVENIDA15", "discount": 15, "expiry": "2026-12-31", "created_at": "2026-06-01T00:00:00Z"}
]

