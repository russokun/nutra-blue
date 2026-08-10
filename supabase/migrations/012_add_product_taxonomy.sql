-- Taxonomia real de producto, en columnas propias.
--
-- Hasta ahora la unica clasificacion era `category` (la columna "Categoría / Objetivo"
-- de la planilla). `benefits` es una lista de vinetas sacada de la ficha de Google Docs
-- -- texto libre, no una taxonomia -- asi que la tienda terminaba mostrando la misma
-- etiqueta en todas las tarjetas del carrusel y el filtro "Beneficio" del catalogo era
-- un duplicado literal de la categoria.
--
-- Ambas quedan NULL a proposito: NULL significa "la planilla todavia no lo dice" y el
-- backend lo deriva de la categoria al leer (app/core/taxonomy.py). Rellenarlas aca con
-- el valor derivado haria imposible distinguir lo que declaro el cliente de lo que
-- adivinamos nosotros, y el panel admin mostraria una suposicion como si fuera un dato.

ALTER TABLE products ADD COLUMN IF NOT EXISTS benefit      TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT;
