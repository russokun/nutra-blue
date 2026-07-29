-- Trazabilidad del pago en la orden.
--
-- Hasta ahora `mark_order_as_paid` solo escribia status='paid': no quedaba rastro de
-- con que pasarela se pago, ni de que pago concreto vino, ni de si fue una prueba.
-- Sin eso es imposible conciliar contra el panel de Mercado Pago ni limpiar las
-- ordenes generadas con credenciales de prueba.
--
-- Todo es aditivo: las ordenes existentes quedan con NULL / is_test=false.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

-- El webhook puede reintentar: buscar por payment_id tiene que ser barato.
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- Para listar y limpiar las pruebas desde el admin.
CREATE INDEX IF NOT EXISTS idx_orders_is_test ON orders(is_test) WHERE is_test = true;
