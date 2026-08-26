-- Datos de facturacion para clientes empresa.
--
-- En el checkout aparece una casilla "Soy empresa". Al marcarla se piden los datos que
-- lleva una factura chilena: RUT, razon social, giro, correo de facturacion y el
-- DOMICILIO COMERCIAL de la empresa.
--
-- El domicilio comercial NO reemplaza la direccion de entrega: son cosas distintas y a
-- menudo distintas de verdad (oficina contra bodega). La direccion de entrega sigue
-- siendo `address` / `city` / `region`, que se piden antes en el mismo formulario.
--
-- NutraBlue todavia no emite factura electronica. Estos campos son el REGISTRO de los
-- datos para emitirla despues; el checkout lo dice con todas sus letras y no promete que
-- la factura llegue con el pedido. Cuando resuelvan lo del SII, de aca salen los datos.
--
-- El RUT se guarda normalizado: sin puntos, en mayuscula y con guion ("76123456-7"). Se
-- valida por modulo 11 en la API antes de llegar aca.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_company boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_id varchar(12);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS business_activity text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_email varchar(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address text;

-- Un pedido marcado como empresa sin RUT ni razon social no sirve para emitir nada.
-- La API ya lo valida, pero esto lo deja garantizado tambien si algun dia se inserta
-- desde otro lado.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_billing_completo;
ALTER TABLE orders ADD CONSTRAINT orders_billing_completo CHECK (
    NOT is_company
    OR (
        tax_id IS NOT NULL AND length(trim(tax_id)) > 0
        AND business_name IS NOT NULL AND length(trim(business_name)) > 0
    )
);

-- Para buscar todos los pedidos de una misma empresa a la hora de facturar.
CREATE INDEX IF NOT EXISTS orders_tax_id_idx ON orders (tax_id) WHERE tax_id IS NOT NULL;


-- Version del RPC de checkout que ademas persiste los datos de facturacion.
--
-- Van en un solo `p_billing jsonb` y no como seis parametros sueltos: la firma ya tenia
-- trece y cada campo nuevo obligaba a otra sobrecarga. Con un objeto, agregar un campo
-- de facturacion mas adelante no cambia la firma.
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
    p_courier text,
    p_billing jsonb
) RETURNS jsonb AS $$
DECLARE
    v_item json;
    v_product_id uuid;
    v_quantity int;
    v_stock int;
    v_product_name text;
    v_order_id uuid;
    v_es_empresa boolean;
BEGIN
    v_es_empresa := COALESCE((p_billing->>'is_company')::boolean, false);

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
        subtotal, tax, shipping_cost, total, status, delivery_method, courier,
        is_company, tax_id, business_name, business_activity, billing_email, billing_address
    ) VALUES (
        p_customer_name, p_email, p_phone, p_address, p_city, p_region, p_items,
        p_subtotal, p_tax, p_shipping_cost, p_total, 'pending',
        COALESCE(NULLIF(p_delivery_method, ''), 'domicilio'),
        NULLIF(p_courier, ''),
        v_es_empresa,
        -- Si no es empresa se guarda NULL aunque el objeto traiga algo: no tiene sentido
        -- dejar un RUT colgado en un pedido que nadie va a facturar.
        CASE WHEN v_es_empresa THEN NULLIF(trim(p_billing->>'tax_id'), '') END,
        CASE WHEN v_es_empresa THEN NULLIF(trim(p_billing->>'business_name'), '') END,
        CASE WHEN v_es_empresa THEN NULLIF(trim(p_billing->>'business_activity'), '') END,
        CASE WHEN v_es_empresa THEN NULLIF(trim(p_billing->>'billing_email'), '') END,
        CASE WHEN v_es_empresa THEN NULLIF(trim(p_billing->>'billing_address'), '') END
    ) RETURNING id INTO v_order_id;

    RETURN jsonb_build_object('id', v_order_id, 'status', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- La firma de trece parametros pasa a delegar en la nueva, para no tener dos copias del
-- mismo cuerpo. Un pedido sin datos de facturacion es un pedido de persona natural.
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
    SELECT create_order_with_stock_check(
        p_customer_name, p_email, p_phone, p_address, p_city, p_region, p_items,
        p_subtotal, p_tax, p_shipping_cost, p_total, p_delivery_method, p_courier,
        NULL::jsonb
    );
$$ LANGUAGE sql SECURITY DEFINER;
