-- Seguimiento de envio.
--
-- Hasta ahora no existia ninguna columna de tracking. El panel admin tenia un modal
-- que pedia el codigo de seguimiento, pero lo tiraba a la basura: solo hacia PATCH del
-- estado a 'shipped' y usaba el codigo en el texto del toast. La pagina de cuenta del
-- cliente mostraba un tracking mock hardcodeado, y el correo de pago ya prometia "un
-- nuevo correo con el codigo de seguimiento" que ningun codigo enviaba.
--
-- shipping_payment: NutraBlue no cobra el despacho en la app y el flete se resuelve por
-- fuera, asi que esto es un dato de operacion, no un cobro. 'por_pagar' es el caso
-- normal; 'pagado' queda para cuando NutraBlue ya lo cubrio.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code    VARCHAR(60);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_company VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at       TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_payment VARCHAR(20) DEFAULT 'por_pagar';

-- El cliente busca su pedido por codigo de seguimiento cuando escribe a soporte.
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code
    ON orders (tracking_code)
    WHERE tracking_code IS NOT NULL;
