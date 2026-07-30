-- Metodo de entrega elegido en el checkout.
--
-- Hasta ahora la orden solo guardaba la direccion, asi que no habia forma de saber si
-- el cliente queria despacho a domicilio, retirar donde el vendedor, o retirar en una
-- sucursal de courier. Se pedia por fuera y se perdia.
--
-- El costo de despacho NO cambia: se sigue calculando por region en el backend
-- (calculate_shipping) y sigue siendo gratis sobre 50.000. La coordinacion concreta de
-- la entrega se hace por correo/telefono despues de la compra.
--
-- delivery_method: 'domicilio' | 'retiro_vendedor' | 'retiro_courier'
-- courier: 'blue_express' | 'starken' | 'pullman' (solo con retiro_courier)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(30) NOT NULL DEFAULT 'domicilio';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier VARCHAR(30);


-- Nueva version del RPC de checkout que ademas persiste el metodo de entrega.
-- Es una sobrecarga: la firma vieja de 11 parametros sigue existiendo (ver abajo) para
-- que un deploy a medias no rompa el checkout.
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
    p_total int,
    p_delivery_method text,
    p_courier text
) RETURNS jsonb AS $$
DECLARE
    v_item json;
    v_product_id uuid;
    v_quantity int;
    v_stock int;
    v_product_name text;
    v_order_id uuid;
BEGIN
    -- Validar stock primero (bloqueando las filas)
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

    -- Descontar stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::int;

        UPDATE products SET stock = stock - v_quantity WHERE id = v_product_id;
    END LOOP;

    INSERT INTO orders (
        customer_name, email, phone, address, city, region, items,
        subtotal, tax, shipping_cost, total, status, delivery_method, courier
    ) VALUES (
        p_customer_name, p_email, p_phone, p_address, p_city, p_region, p_items,
        p_subtotal, p_tax, p_shipping_cost, p_total, 'pending',
        COALESCE(NULLIF(p_delivery_method, ''), 'domicilio'),
        NULLIF(p_courier, '')
    ) RETURNING id INTO v_order_id;

    RETURN jsonb_build_object('id', v_order_id, 'status', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- La firma vieja pasa a delegar en la nueva, para no tener dos copias del mismo cuerpo.
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
    SELECT create_order_with_stock_check(
        p_customer_name, p_email, p_phone, p_address, p_city, p_region, p_items,
        p_subtotal, p_tax, p_shipping_cost, p_total, 'domicilio'::text, NULL::text
    );
$$ LANGUAGE sql SECURITY DEFINER;
