-- Productos ocultos del catálogo.
--
-- Sirve para el producto de prueba con el que se valida el cobro real en producción:
-- tiene que ser comprable (Mercado Pago rechaza preferencias de $0, así que no se puede
-- probar con costo cero) pero no puede aparecerle a un cliente en la tienda.
--
-- Un producto oculto sigue siendo accesible por URL directa /product/<id>, que es como
-- se hace la compra de prueba.
--
-- Importante: los productos ocultos quedan exentos del barrido que borra lo que no está
-- en la planilla. El producto de prueba se crea a mano desde el panel, no está en la
-- planilla, y sin esta exención el siguiente sync lo borraría.

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_hidden
    ON products (is_hidden)
    WHERE is_hidden = true;
