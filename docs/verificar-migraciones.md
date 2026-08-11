# Cómo saber qué migraciones están aplicadas

Este proyecto **no usa la CLI de Supabase**: no hay `config.toml` ni carpeta de estado,
solo archivos `.sql` sueltos en `supabase/migrations/` que se pegan a mano en el editor
SQL. Eso significa que **no existe ningún registro de cuáles se ejecutaron**.

La forma confiable de saberlo es preguntarle a la base si las columnas existen.

## Consulta de verificación

Pegar en el editor SQL de Supabase (**Database → SQL Editor**). Solo lee, no modifica
nada:

```sql
select
    m.migracion,
    m.tabla,
    m.columna,
    case when c.column_name is null then 'FALTA' else 'aplicada' end as estado
from (values
    ('012_add_product_taxonomy',   'products', 'benefit'),
    ('012_add_product_taxonomy',   'products', 'product_type'),
    ('013_add_shipping_tracking',  'orders',   'tracking_code'),
    ('013_add_shipping_tracking',  'orders',   'shipping_company'),
    ('013_add_shipping_tracking',  'orders',   'shipped_at'),
    ('013_add_shipping_tracking',  'orders',   'shipping_payment'),
    ('014_add_product_visibility', 'products', 'is_hidden')
) as m(migracion, tabla, columna)
left join information_schema.columns c
    on  c.table_schema = 'public'
    and c.table_name   = m.tabla
    and c.column_name  = m.columna
order by m.migracion, m.columna;
```

Si alguna fila dice `FALTA`, hay que correr esa migración. Si todas dicen `aplicada`, no
hay nada que hacer.

## Correrlas es seguro aunque ya estén

Las tres usan `ADD COLUMN IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`, así que son
idempotentes: ejecutarlas de nuevo no borra datos, no pisa valores y no da error. Ante la
duda, correrlas.

Ojo con las migraciones anteriores: **no todas son idempotentes**. Las que redefinen
funciones (`004_fix_rpc_security_definer.sql`, `008_expire_pending_orders.sql`,
`011_add_delivery_method.sql`) usan `CREATE OR REPLACE FUNCTION`, que también es seguro
repetir, pero `initial_schema.sql` crea tablas y políticas: no conviene reejecutarlo a
ciegas en una base con datos.

## Verificar también los índices

```sql
select indexname, tablename
from pg_indexes
where schemaname = 'public'
  and indexname in ('idx_orders_tracking_code', 'idx_products_is_hidden');
```

Deberían aparecer los dos después de aplicar `013` y `014`.

## Para adelante

Si quieren dejar de adivinar, conviene adoptar la CLI de Supabase (`supabase link` +
`supabase db push`): lleva una tabla `supabase_migrations.schema_migrations` con lo que
ya se aplicó, y `supabase migration list` responde esta pregunta en un comando. Es un
cambio de flujo de trabajo, no urgente, pero elimina esta clase de duda.
