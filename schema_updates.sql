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
CREATE POLICY "Permitir registro público de leads" ON public.leads
    FOR INSERT WITH CHECK (true);

-- Permitir solo al administrador leer la base de leads
CREATE POLICY "Permitir lectura de leads solo a admins" ON public.leads
    FOR SELECT USING (
        auth.role() = 'service_role' 
        OR auth.jwt()->>'email' IN ('admin@nutrablue.cl', 'rodrigo@dentameet.net')
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
CREATE POLICY "Permitir lectura pública de cupones" ON public.coupons
    FOR SELECT USING (true);

-- Permitir control total sobre cupones solo a administradores
CREATE POLICY "Permitir control de cupones solo a admins" ON public.coupons
    FOR ALL USING (
        auth.role() = 'service_role' 
        OR auth.jwt()->>'email' IN ('admin@nutrablue.cl', 'rodrigo@dentameet.net')
    );
