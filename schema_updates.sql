-- ====================================================================
-- INSTRUCCIONES DE ACTUALIZACIÓN DE BASE DE DATOS (SUPABASE)
-- Copia y pega este script en el editor SQL de tu consola de Supabase.
-- ====================================================================

-- 1. Crear tabla de leads (Suscripción y Boletín)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'Web'::text NOT NULL
);

-- Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios anónimos (visitantes de la tienda) registrar su correo
DROP POLICY IF EXISTS "Permitir registro público de leads" ON public.leads;
CREATE POLICY "Permitir registro público de leads" ON public.leads
    FOR INSERT WITH CHECK (true);

-- Permitir solo al administrador leer la base de leads
DROP POLICY IF EXISTS "Permitir lectura de leads solo a admins" ON public.leads;
CREATE POLICY "Permitir lectura de leads solo a admins" ON public.leads
    FOR SELECT USING (
        auth.role() = 'service_role' 
        OR auth.jwt()->>'email' IN ('admin@nutrablue.cl', 'rodrigo@dentameet.net', 'info.nutrablue@gmail.com', 'fuentealba.diplan@gmail.com')
    );


-- 2. Crear tabla de cupones de descuento
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    code TEXT UNIQUE NOT NULL,
    discount INT NOT NULL CHECK (discount > 0 AND discount <= 100),
    expiry DATE
);

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Permitir a cualquiera validar cupones en el checkout (lectura)
DROP POLICY IF EXISTS "Permitir lectura pública de cupones" ON public.coupons;
CREATE POLICY "Permitir lectura pública de cupones" ON public.coupons
    FOR SELECT USING (true);

-- Permitir control total sobre cupones solo a administradores
DROP POLICY IF EXISTS "Permitir control de cupones solo a admins" ON public.coupons;
CREATE POLICY "Permitir control de cupones solo a admins" ON public.coupons
    FOR ALL USING (
        auth.role() = 'service_role' 
        OR auth.jwt()->>'email' IN ('admin@nutrablue.cl', 'rodrigo@dentameet.net', 'info.nutrablue@gmail.com', 'fuentealba.diplan@gmail.com')
    );


-- 3. Producto de prueba oculto ($50 CLP) para validación en producción de Transbank Webpay Plus
-- Este producto permanece oculto del catálogo de clientes y solo se visualiza con ?prueba=1
INSERT INTO public.products (
    name,
    price,
    stock,
    category,
    image_url,
    benefits,
    certifications,
    is_hidden
) VALUES (
    'Producto de Prueba Transbank',
    50,
    999,
    'Alimentación Diaria',
    '/logo.png',
    '["Producto oculto para validación de cobro real Transbank ($50 CLP)"]'::jsonb,
    '[]'::jsonb,
    true
)
ON CONFLICT (name) DO UPDATE 
SET price = 50, stock = 999, is_hidden = true;

