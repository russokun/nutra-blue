-- Liberar el stock de ordenes que nunca se pagaron.
--
-- `create_order_with_stock_check` descuenta el stock al CREAR la orden (estado
-- 'pending'), no al pagarla. Un checkout abandonado se queda con esas unidades
-- reservadas para siempre, lo que ademas corrompe la reconciliacion contra la
-- planilla (el sync lo lee como una venta real).
--
-- Esta funcion devuelve al inventario las unidades de las ordenes 'pending' mas
-- viejas que p_minutes y las marca como 'expired'. Es idempotente: una vez que la
-- orden deja de estar en 'pending' ya no vuelve a entrar.
CREATE OR REPLACE FUNCTION expire_pending_orders(p_minutes int DEFAULT 60)
RETURNS jsonb AS $$
DECLARE
    v_order record;
    v_item json;
    v_expired int := 0;
    v_restocked int := 0;
BEGIN
    FOR v_order IN
        SELECT id, items FROM orders
        WHERE status = 'pending'
          AND created_at < (now() - make_interval(mins => p_minutes))
        FOR UPDATE
    LOOP
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items) LOOP
            UPDATE products
            SET stock = stock + (v_item->>'quantity')::int
            WHERE id = (v_item->>'product_id')::uuid;

            IF FOUND THEN
                v_restocked := v_restocked + (v_item->>'quantity')::int;
            END IF;
        END LOOP;

        UPDATE orders SET status = 'expired' WHERE id = v_order.id;
        v_expired := v_expired + 1;
    END LOOP;

    RETURN jsonb_build_object('expired_orders', v_expired, 'restocked_units', v_restocked);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Devolver el stock de una orden puntual al cancelarla a mano desde el admin.
-- Solo repone si la orden todavia tenia el stock tomado (estado 'pending').
CREATE OR REPLACE FUNCTION cancel_order_and_restock(p_order_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_items jsonb;
    v_item json;
    v_restocked int := 0;
BEGIN
    SELECT items INTO v_items FROM orders
    WHERE id = p_order_id AND status = 'pending'
    FOR UPDATE;

    IF v_items IS NULL THEN
        -- La orden no existe o ya no tiene stock reservado: solo cambiar el estado.
        UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
        RETURN jsonb_build_object('restocked_units', 0, 'restocked', false);
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items) LOOP
        UPDATE products
        SET stock = stock + (v_item->>'quantity')::int
        WHERE id = (v_item->>'product_id')::uuid;
        v_restocked := v_restocked + (v_item->>'quantity')::int;
    END LOOP;

    UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;
    RETURN jsonb_build_object('restocked_units', v_restocked, 'restocked', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
