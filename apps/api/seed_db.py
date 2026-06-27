import os
import sys
from dotenv import load_dotenv

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_KEY")
anon_key = os.getenv("SUPABASE_KEY")

if service_key and "your-" not in service_key.lower():
    SUPABASE_SERVICE_KEY = service_key
else:
    SUPABASE_SERVICE_KEY = anon_key

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or "your-project" in SUPABASE_URL:
    print("❌ ERROR: Please configure your active SUPABASE_URL and SUPABASE_KEY in 'apps/api/.env' first.")
    sys.exit(1)

print(f"Connecting to Supabase at: {SUPABASE_URL}...")
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
except Exception as e:
    print(f"❌ Connection error: {str(e)}")
    sys.exit(1)

products_data = [
    {
        "name": "Calm & Focus",
        "price": 18990,
        "stock": 45,
        "category": "Salud Cognitiva",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/947065a3f4ef376351578339a9ba0e35.jpg",
        "benefits": ["Mejora concentración", "Reduce niebla mental", "Adaptógeno natural"],
        "certifications": ["Orgánico", "SAG"]
    },
    {
        "name": "Dark Cacao",
        "price": 22500,
        "stock": 38,
        "category": "Longevidad",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/8b9759abb5ce079dcc1b31532e0e3ce2.jpg",
        "benefits": ["Alto en polifenoles", "Antioxidante potente", "Ceremonial"],
        "certifications": ["Orgánico", "Fair Trade"]
    },
    {
        "name": "Spirulina Premium Powder",
        "price": 16800,
        "stock": 52,
        "category": "Longevidad",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/e02764b75ff61216674c82d8bc2bef12.jpg",
        "benefits": ["Proteína completa", "Superalimento", "Energía sostenida"],
        "certifications": ["Orgánico", "Vegan"]
    },
    {
        "name": "Chlorella Premium Powder",
        "price": 17990,
        "stock": 48,
        "category": "Longevidad",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/e02764b75ff61216674c82d8bc2bef12.jpg",
        "benefits": ["Desintoxicación", "Clorofila pura", "Detox natural"],
        "certifications": ["Orgánico", "Vegan"]
    },
    {
        "name": "Matcha Ritual",
        "price": 24990,
        "stock": 35,
        "category": "Salud Cognitiva",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/db395fe43818aef950855c1429a35f3f.jpg",
        "benefits": ["L-teanina para calma", "Energía sin crash", "Ceremonial premium"],
        "certifications": ["Orgánico", "Ceremonial Grade"]
    },
    {
        "name": "Black Garlic",
        "price": 19890,
        "stock": 42,
        "category": "Gestión del Estrés",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/72ab83b10e6c22ff8c951b4965f63186.jpg",
        "benefits": ["Fermentado 90 días", "Antiestrés", "Sabor umami"],
        "certifications": ["Orgánico", "Fermentado"]
    },
    {
        "name": "Walnut & Almond Mix",
        "price": 15490,
        "stock": 60,
        "category": "Longevidad",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/92991841506fe8cbe74ac15e6cf2e749.jpg",
        "benefits": ["Omega 3 natural", "Grasas saludables", "Snack nutritivo"],
        "certifications": ["Orgánico", "Raw"]
    },
    {
        "name": "Reishi Mushroom Tea",
        "price": 21500,
        "stock": 40,
        "category": "Gestión del Estrés",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/bb35ea4887ead9552e30a342eeaef645.jpg",
        "benefits": ["Adaptógeno reishi", "Sueño profundo", "Relajación"],
        "certifications": ["Orgánico", "Hongo medicinal"]
    },
    {
        "name": "Golden Turmeric & Black Pepper Blend",
        "price": 14990,
        "stock": 55,
        "category": "Gestión del Estrés",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/6ed1571c88a0dc4195b6de03339f7ccf.jpg",
        "benefits": ["Antiinflamatorio", "Cúrcuma + pimienta", "Biodisponibilidad mejorada"],
        "certifications": ["Orgánico", "Ayurvédico"]
    },
    {
        "name": "Maca Powder",
        "price": 16500,
        "stock": 50,
        "category": "Longevidad",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/26c0a00cb124e2c1e2fc225fdcc53bc4.jpg",
        "benefits": ["Energía y vitalidad", "Adaptógeno peruano", "Hormonas balanceadas"],
        "certifications": ["Orgánico", "Peruano"]
    },
    {
        "name": "Mixed Berries Powder",
        "price": 20890,
        "stock": 44,
        "category": "Longevidad",
        "image_url": "https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/3cb4a678b3b042b7aecd3e65c1b99551.jpg",
        "benefits": ["Antioxidantes potentes", "Polifenoles", "Superfruta"],
        "certifications": ["Orgánico", "Liofilizado"]
    }
]

print("Seeding products into 'products' table...")
success_count = 0
for p in products_data:
    try:
        # Check if product already exists by name
        check_res = supabase.from_("products").select("id").eq("name", p["name"]).execute()
        if check_res.data:
            print(f"⚠️ Skipping product '{p['name']}': Already exists in database.")
            continue
            
        res = supabase.from_("products").insert(p).execute()
        if res.data:
            print(f"✅ Loaded product: {p['name']} ({p['category']}) - ${p['price']:,} CLP")
            success_count += 1
    except Exception as e:
        print(f"❌ Failed to insert '{p['name']}': {str(e)}")

print(f"\nSeeding complete! {success_count} new product(s) added successfully.")
