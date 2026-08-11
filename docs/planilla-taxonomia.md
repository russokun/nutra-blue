# De dónde salen las etiquetas de producto

La tienda clasifica cada producto con tres etiquetas. Se muestran igual en el carrusel
del inicio, en el de packs, en la grilla de favoritos, en el catálogo y en la ficha del
producto, y en el catálogo además son tres filtros independientes.

| Etiqueta | De dónde sale |
|---|---|
| Categoría (objetivo) | Columna `Categoría / Objetivo` de la planilla |
| Beneficio | Sección **«Beneficios para el cliente»** de la ficha de Google Docs |
| Tipo | Sección **«Descripción del tipo de producto»** de la ficha de Google Docs |

**No hay que agregar columnas a la planilla.** El beneficio y el tipo salen de la misma
ficha de Google Docs que ya está enlazada en la columna `Link Doc`.

## Cómo se normaliza

En la ficha el texto es libre: cada una escribe con sus palabras («Reduce la niebla
mental», «Ayuda a conciliar el sueño», «Presentación en polvo para batidos»). La tienda
lleva ese texto a un vocabulario acotado.

Si cada producto mostrara su propia frase, el filtro «Beneficio» del catálogo terminaría
con un valor distinto por producto y dejaría de servir para filtrar.

**Beneficios:** `Energía Natural`, `Foco y Calma`, `Descanso y Longevidad`,
`Manejo del Estrés`, `Nutrición Diaria`.

**Tipos:** `Polvo`, `Gotas`, `Aceite`, `Infusión`, `Cápsulas`, `Pack`, `Alimento`,
`Suplemento`.

Ejemplos de cómo se reconoce:

| Lo que dice la ficha | Etiqueta |
|---|---|
| «Reduce la niebla mental» | Foco y Calma |
| «Aporta energía sostenida sin bajones» | Energía Natural |
| «Rico en antioxidantes y polifenoles» | Descanso y Longevidad |
| «Adaptógeno que ayuda a regular el cortisol» | Manejo del Estrés |
| «Fuente de proteína completa» | Nutrición Diaria |
| «Extracto líquido en gotas» | Gotas |
| «Presentación en polvo para batidos» | Polvo |

## Si la ficha no dice nada reconocible

No se muestra la frase suelta como etiqueta. La tienda deriva el beneficio a partir de la
categoría y el tipo a partir del nombre del producto, y el panel de administración avisa
al sincronizar con un mensaje por producto:

> No se reconoció el beneficio en la ficha de Google Docs; se usa el derivado de la
> categoría.

Si eso aparece seguido, hay dos caminos: redactar esa sección de la ficha con un término
que la tienda reconozca, o cargar el valor a mano (ver abajo).

## Cargar un valor a mano

En el formulario de cada producto del panel de administración hay campos **Beneficio** y
**Tipo**. Lo que se cargue ahí se conserva en cada sincronización, mientras la ficha no
aporte un valor reconocible.

## Override desde la planilla (opcional)

El sync también acepta columnas `Beneficio` y `Tipo` en la planilla, y esas le ganan a la
ficha. No hacen falta, pero si alguna vez se agregan:

- **Al final, después de `Link Doc`.** El sync cae a posiciones fijas calibradas a la
  disposición actual de 9 columnas cuando no encuentra una cabecera por su nombre;
  insertarlas al medio corre esas posiciones y podría leer el inventario como precio.
- **Nunca llamar `Objetivo` a la columna de beneficio**: ese nombre ya es un alias de la
  columna de categoría.
