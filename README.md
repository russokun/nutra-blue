# Nutra Blue — E-Commerce Monorepo

Este repositorio contiene la arquitectura completa del e-commerce **Nutra Blue** (suplementos funcionales premium para optimizar tu biología y alcanzar la longevidad). El proyecto está estructurado como un monorepo con un frontend en React (Vite) y un backend en Python (FastAPI).

---

## 🚀 Estructura del Monorepo

* **`apps/web`**: Aplicación de frontend SPA construida con React, Vite, TailwindCSS y Shadcn UI.
* **`apps/admin`**: Panel de administración (React + Vite) para gestionar productos, órdenes y cupones — desacoplado de `apps/web`.
* **`apps/api`**: Backend construida en Python con FastAPI, enrutadores modulares y validaciones estrictas con Pydantic.
* **`supabase`**: Migraciones y esquemas relacionales para base de datos PostgreSQL en Supabase.

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu máquina local:
* **Node.js** (v20 o superior recomendado)
* **Python** (v3.11 o superior recomendado)
* **Git**

---

## ⚙️ Configuración Inicial

### 1. Clonar el repositorio e instalar dependencias del Frontend
Desde la raíz del proyecto, ejecuta:
```bash
npm install
```

### 2. Configurar dependencias del Backend (Python)
Ingresa al directorio de la API e instala las librerías necesarias (se recomienda usar un entorno virtual):
```bash
cd apps/api
# Crear entorno virtual
python -m venv .venv
# Activar entorno (Windows)
.venv\Scripts\activate
# Activar entorno (macOS/Linux)
source .venv/bin/activate

# Instalar requerimientos
pip install -r requirements.txt
cd ../..
```

### 3. Configurar Variables de Entorno
Copia los archivos de plantilla y renómbralos a `.env` en cada subaplicación:

* **Para el Backend (`apps/api/.env`):**
  ```bash
  cp apps/api/.env.example apps/api/.env
  ```
  *Configura tus credenciales de Supabase (`SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`) y tu proveedor de pagos (`PAYMENT_PROVIDER=mock` para desarrollo local).*

* **Para el Frontend (`apps/web/.env`):**
  ```bash
  cp apps/web/.env.example apps/web/.env
  ```
  *Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para que el cliente cargue la tienda.*

---

## 💻 Ejecución en Desarrollo (Local)

Para levantar ambos servidores simultáneamente (Vite en puerto 3000 y FastAPI en puerto 3001), ejecuta el siguiente comando en la raíz del monorepo:
```bash
npm run dev
```

* **Frontend:** http://localhost:3000/
* **Backend API:** http://localhost:3001/
* **Documentación Interactiva API (Swagger):** http://localhost:3001/docs

---

## 💾 Inicialización de la Base de Datos (Supabase)

Cuando decidas conectar a una base de datos remota de producción en Supabase:

1. **Ejecutar Migración:** Ejecuta las consultas del archivo [supabase/migrations/initial_schema.sql](supabase/migrations/initial_schema.sql) en el Editor SQL de tu panel de control de Supabase para crear las tablas (`products`, `orders`, `ai_messages`) y la función PL/pgSQL transaccional de control de stock (`create_order_with_stock_check`).
2. **Cargar Semillas de Productos (Seed):** Levanta tu entorno virtual en `apps/api` y ejecuta el script de semillas para subir los 11 productos funcionales originales al catálogo de la base de datos:
   ```bash
   python apps/api/seed_db.py
   ```

---

## 💳 Lógica de Precios e Impuestos (IVA 19%)

* **IVA Incluido:** Todo el catálogo de productos muestra precios al cliente final con el IVA del 19% ya incluido.
* **Cálculo Sustractivo:** En el carrito (`CartPage.jsx`) y checkout (`CheckoutPage.jsx`), el IVA se desglosa sustrayendo el neto del valor del catálogo: `IVA = total - Math.round(total / 1.19)`. El total pagado corresponde exactamente a la suma de los productos más el costo de despacho, sin recargos sorpresa al comprador.

---

## 📝 Páginas Nuevas Añadidas

* **`/impacto`**: Página interactiva en formato bento-grid que explica la misión, manifiesto científico de biohacking y pilares éticos de Nutra Blue.
* **`/privacy-policy`**: Política de privacidad adaptada al cumplimiento de la **Ley N° 19.628** en Chile.
* **`/terms-of-service`**: Términos y condiciones del comercio de acuerdo a la **Ley N° 19.496** en Chile.
