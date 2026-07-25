-- Stock bidireccional entre la planilla de Google Sheets y la tienda.
--
-- `stock_synced` guarda el valor con el que quedo el producto en el ultimo sync.
-- La diferencia contra `stock` es exactamente lo que se movio localmente desde
-- entonces (ventas + ajustes del admin), y es lo que el sync preserva al aplicar
-- el inventario declarado en la planilla.
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_synced INT;

-- Backfill: para los productos que ya existen, tomar el stock actual como linea
-- base. Asi el primer sync posterior a esta migracion no interpreta el stock
-- previo como una venta.
UPDATE products SET stock_synced = stock WHERE stock_synced IS NULL;
