# De dónde salen las etiquetas de producto

La tienda clasifica cada producto con tres etiquetas. Se muestran igual en el carrusel
del inicio, en el de packs, en la grilla de favoritos, en el catálogo y en la ficha del
producto, y en el catálogo además son tres filtros independientes.

| Etiqueta | De dónde sale |
|---|---|
| Categoría (objetivo) | Columna `Categoría / Objetivo` de la planilla |
| Beneficio | **Títulos de las viñetas** de «Beneficios para el Cliente», en la ficha |
| Tipo | Nombre del producto y, si no lo dice, «Descripción del Tipo de Producto» |

**No hay que agregar columnas a la planilla.** El beneficio y el tipo salen de la misma
ficha de Google Docs que ya está enlazada en la columna `Link Doc`.

## Cómo se elige el beneficio

Las viñetas de la ficha tienen forma `Título: cuerpo explicativo`. **Se usa el título de
la primera viñeta que se reconozca**, porque las fichas las ordenan por importancia y el
título es lo que quiso decir quien la redactó.

El cuerpo se mira solo si ningún título se reconoce. Esto importa: el cuerpo toca muchos
temas y desvía la etiqueta. Ejemplos reales:

| Viñeta | Si se mira el cuerpo | Correcto (título) |
|---|---|---|
| «Energía y Resistencia Sostenida» (Maca) — su cuerpo dice *adaptógeno* | Manejo del Estrés | **Energía Natural** |
| «Densidad Antioxidante Duplicada» (Ajo Negro) — su cuerpo dice *estrés oxidativo* | Manejo del Estrés | **Descanso y Longevidad** |

## Cómo se elige el tipo

Primero el **nombre del producto**, después la ficha. El nombre identifica el formato del
producto que se vende («Maca en Polvo», «Melena de León en Gotas»), mientras que la ficha
describe la familia («Raíz tuberosa andina», «Extracto en polvo»). Cuando difieren, manda
el nombre.

## El vocabulario

El texto de la ficha se lleva a una lista acotada. Si cada producto mostrara su propia
frase, el filtro «Beneficio» del catálogo terminaría con un valor distinto por producto y
dejaría de servir para filtrar.

**Beneficios:** `Energía Natural`, `Foco y Calma`, `Descanso y Longevidad`,
`Manejo del Estrés`, `Nutrición Diaria`.

**Tipos:** `Polvo`, `Gotas`, `Aceite`, `Infusión`, `Cápsulas`, `Pack`, `Alimento`,
`Suplemento`.

Resultado con las cuatro fichas revisadas:

| Producto | Título de viñeta que decide | Beneficio | Tipo |
|---|---|---|---|
| Melena de León | «Regeneración Neuronal y Neuroplasticidad» | Foco y Calma | Gotas |
| Ajo Negro | «Escudo Cardiovascular Absoluto» | Nutrición Diaria | Alimento |
| Maca | «Energía y Resistencia Sostenida» | Energía Natural | Polvo |
| Superfrutos | «Máximo Poder Antioxidante y Antienvejecimiento» | Descanso y Longevidad | Polvo |

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

## Estado de la planilla hoy

Revisada la planilla de producción, sus columnas son:

```
[0] Categoría / Objetivo   [3] Contacto     [6] (Comentario)   
[1] Suplemento / Alimento  [4] $ Compra     [7] Inventario
[2] Productor              [5] $ Venta      [8] Link Doc
```

**Todavía no tiene las columnas `Beneficio` ni `Tipo`**, y no hace falta que las tenga:
esas dos salen de la ficha de Google Docs enlazada en `Link Doc`. El resto de las
columnas se detecta correctamente.

## Override desde la planilla (opcional)

El sync también acepta columnas `Beneficio` y `Tipo` en la planilla, y esas le ganan a la
ficha. No hacen falta, pero si alguna vez se agregan:

- **Al final, después de `Link Doc`.** El sync cae a posiciones fijas calibradas a la
  disposición actual de 9 columnas cuando no encuentra una cabecera por su nombre;
  insertarlas al medio corre esas posiciones y podría leer el inventario como precio.
- **Nunca llamar `Objetivo` a la columna de beneficio**: ese nombre ya es un alias de la
  columna de categoría.
