-- INITIAL SUPABASE SCHEMA FOR NUTRA BLUE
-- Run this script in the Supabase SQL Editor.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    price INT NOT NULL, -- Price in CLP (e.g. 17990)
    stock INT NOT NULL CHECK (stock >= 0),
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    benefits JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    subtotal INT NOT NULL,
    tax INT NOT NULL,
    shipping_cost INT NOT NULL,
    total INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, expired, cancelled
    items JSONB NOT NULL, -- Array of [{product_id: UUID, quantity: INT}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create AI Messages Table (for storing chatbot conversations)
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- Optional, can connect to auth.users(id)
    role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content JSONB NOT NULL, -- Message blocks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Security Policies
CREATE POLICY "Permitir lectura de productos a todos" ON products 
    FOR SELECT USING (true);

CREATE POLICY "Permitir crear órdenes a cualquiera" ON orders 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura de órdenes restringida a su creador por email" ON orders 
    FOR SELECT USING (email = auth.jwt()->>'email');

CREATE POLICY "Lectura de mensajes restringida a su dueño" ON ai_messages 
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Insertar mensajes propios" ON ai_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. Create Atomic Stock Check and Order Creation Stored Procedure (RPC)
-- This function runs inside a database transaction, guaranteeing stock consistency.
CREATE OR REPLACE FUNCTION create_order_with_stock_check(
    p_customer_name text,
    p_email text,
    p_phone text,
    p_address text,
    p_city text,
    p_region text,
    p_items jsonb,
    p_subtotal int,
    p_tax int,
    p_shipping_cost int,
    p_total int
) RETURNS jsonb AS $$
DECLARE
    v_item json;
    v_product_id uuid;
    v_quantity int;
    v_stock int;
    v_product_name text;
    v_order_id uuid;
BEGIN
    -- Validate stocks first (lock rows for update)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::int;
        
        SELECT stock, name INTO v_stock, v_product_name FROM products WHERE id = v_product_id FOR UPDATE;
        
        IF v_stock IS NULL THEN
            RAISE EXCEPTION 'Product % does not exist', v_product_id;
        END IF;
        
        IF v_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product % (Available: %, Requested: %)', v_product_name, v_stock, v_quantity;
        END IF;
    END LOOP;
    
    -- Decrement stocks
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::int;
        
        UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;
    END LOOP;
    
    -- Create the order record
    INSERT INTO orders (
        customer_name, email, phone, address, city, region, items, subtotal, tax, shipping_cost, total, status
    ) VALUES (
        p_customer_name, p_email, p_phone, p_address, p_city, p_region, p_items, p_subtotal, p_tax, p_shipping_cost, p_total, 'pending'
    ) RETURNING id INTO v_order_id;
    
    RETURN jsonb_build_object('id', v_order_id, 'status', 'pending');
END;
$$ LANGUAGE plpgsql;

-- 7. Seed Products (11 records)
INSERT INTO products (name, price, stock, category, image_url, benefits, certifications)
VALUES 
('Calm & Focus', 18990, 45, 'Salud Cognitiva', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/947065a3f4ef376351578339a9ba0e35.jpg', '["Mejora concentración", "Reduce niebla mental", "Adaptógeno natural"]'::jsonb, '["Orgánico", "SAG"]'::jsonb),

('Dark Cacao', 22500, 38, 'Longevidad', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/8b9759abb5ce079dcc1b31532e0e3ce2.jpg', '["Alto en polifenoles", "Antioxidante potente", "Ceremonial"]'::jsonb, '["Orgánico", "Fair Trade"]'::jsonb),

('Spirulina Premium Powder', 16800, 52, 'Longevidad', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/e02764b75ff61216674c82d8bc2bef12.jpg', '["Proteína completa", "Superalimento", "Energía sostenida"]'::jsonb, '["Orgánico", "Vegan"]'::jsonb),

('Chlorella Premium Powder', 17990, 48, 'Longevidad', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/e02764b75ff61216674c82d8bc2bef12.jpg', '["Desintoxicación", "Clorofila pura", "Detox natural"]'::jsonb, '["Orgánico", "Vegan"]'::jsonb),

('Matcha Ritual', 24990, 35, 'Salud Cognitiva', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/db395fe43818aef950855c1429a35f3f.jpg', '["L-teanina para calma", "Energía sin crash", "Ceremonial premium"]'::jsonb, '["Orgánico", "Ceremonial Grade"]'::jsonb),

('Black Garlic', 19890, 42, 'Gestión del Estrés', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/72ab83b10e6c22ff8c951b4965f63186.jpg', '["Fermentado 90 días", "Antiestrés", "Sabor umami"]'::jsonb, '["Orgánico", "Fermentado"]'::jsonb),

('Walnut & Almond Mix', 15490, 60, 'Longevidad', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/92991841506fe8cbe74ac15e6cf2e749.jpg', '["Omega 3 natural", "Grasas saludables", "Snack nutritivo"]'::jsonb, '["Orgánico", "Raw"]'::jsonb),

('Reishi Mushroom Tea', 21500, 40, 'Gestión del Estrés', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/bb35ea4887ead9552e30a342eeaef645.jpg', '["Adaptógeno reishi", "Sueño profundo", "Relajación"]'::jsonb, '["Orgánico", "Hongo medicinal"]'::jsonb),

('Golden Turmeric & Black Pepper Blend', 14990, 55, 'Gestión del Estrés', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/6ed1571c88a0dc4195b6de03339f7ccf.jpg', '["Antiinflamatorio", "Cúrcuma + pimienta", "Biodisponibilidad mejorada"]'::jsonb, '["Orgánico", "Ayurvédico"]'::jsonb),

('Maca Powder', 16500, 50, 'Longevidad', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/26c0a00cb124e2c1e2fc225fdcc53bc4.jpg', '["Energía y vitalidad", "Adaptógeno peruano", "Hormonas balanceadas"]'::jsonb, '["Orgánico", "Peruano"]'::jsonb),

('Mixed Berries Powder', 20890, 44, 'Longevidad', 'https://horizons-cdn.hostinger.com/b35461a0-e424-4767-bd53-3b70fb21c1bf/3cb4a678b3b042b7aecd3e65c1b99551.jpg', '["Antioxidantes potentes", "Polifenoles", "Superfruta"]'::jsonb, '["Orgánico", "Liofilizado"]'::jsonb)
ON CONFLICT (name) DO NOTHING;
