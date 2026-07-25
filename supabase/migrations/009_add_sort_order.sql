-- Preservar en el panel admin el mismo orden que tienen los productos en la planilla.
--
-- El sync escribe aca la posicion de cada fila. Los productos creados a mano desde
-- el admin quedan en NULL y se listan al final.
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT;
