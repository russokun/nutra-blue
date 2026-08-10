# Columnas de taxonomía en la planilla

La tienda clasifica cada producto con tres etiquetas. Las tres salen de la planilla de
Google Sheets, que es la fuente de verdad.

| Etiqueta | Columna en la planilla | Ejemplo |
|---|---|---|
| Categoría (objetivo) | `Categoría / Objetivo` — ya existe | `Energía` |
| Beneficio | `Beneficio` — **hay que agregarla** | `Energía Natural` |
| Tipo | `Tipo` — **hay que agregarla** | `Polvo` |

## Cómo agregarlas

**Agregar las dos columnas al final, después de `Link Doc`.**

Esto no es un detalle estético. Si el sync no encuentra una cabecera por su nombre, cae a
posiciones fijas calibradas a la disposición actual de 9 columnas: precio en la columna 6,
inventario en la 8, link en la 9. Insertar columnas en el medio corre esas posiciones y, si
además se renombra alguna cabecera, el sync puede escribir el inventario como precio.

**Nombrarlas exactamente `Beneficio` y `Tipo`.** El sync tolera mayúsculas y acentos
(`BENEFICIO`, `Tipo de producto`, `Formato` y `Presentación` también funcionan).

**Nunca llamar `Objetivo` a la columna de beneficio.** Ese nombre ya está tomado: es un
alias de la columna de categoría, y el sync se la llevaría como categoría.

## Qué pasa mientras estén vacías

Nada se rompe. Si la planilla no trae las columnas, o si una celda queda en blanco, la
tienda deriva el beneficio y el tipo a partir de la categoría y del nombre del producto
(`apps/api/app/core/taxonomy.py`). El panel de administración avisa con un mensaje al
sincronizar.

En cuanto la planilla traiga un valor, ese valor manda por sobre la derivación.

## Cargar valores sin tocar la planilla

También se pueden escribir desde el panel de administración, en el formulario de cada
producto. Mientras la planilla no tenga las columnas, el sync no los pisa: lo que se cargó
a mano se conserva en cada sincronización. Cuando se agreguen las columnas, la planilla
vuelve a mandar.

## Dónde se ven

Las tres etiquetas se muestran igual en el carrusel del inicio, en el carrusel de packs, en
la grilla de favoritos, en el catálogo y en la ficha del producto: una píldora con el
beneficio sobre la imagen, y una línea `categoría · tipo` bajo el título. En el catálogo,
además, cada una es un filtro independiente.
