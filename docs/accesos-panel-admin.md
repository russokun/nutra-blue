# Accesos al Panel de Administración

## Cuentas autorizadas

Son las **únicas tres** cuentas con acceso al panel:

| Correo | Rol |
|---|---|
| `fuentealba.diplan@gmail.com` | Administración |
| `monsesantibanez.f@gmail.com` | Administración |
| `f.santibanezfu@gmail.com` | Administración |

Las tres comparten la misma contraseña, definida por NutraBlue y **nunca guardada en
este repositorio**. Se entrega por el canal acordado y se carga en la variable de
entorno `ADMIN_SETUP_PASSWORD` sólo al momento de crearlas o resetearlas.

## Dónde vive la lista

La lista está en cuatro lugares, y los cuatro deben decir lo mismo:

| Lugar | Qué controla |
|---|---|
| `apps/api/app/core/config.py` → `default_admins` | Autorización real en la API (`verify_admin_user`) |
| `apps/admin/src/contexts/AuthContext.jsx` → `ADMIN_EMAILS` | Acceso al panel |
| `apps/web/src/contexts/AuthContext.jsx` → `ADMIN_EMAILS` | Flag de admin en la tienda |
| `schema_updates.sql` (policies de `leads` y `coupons`) | RLS de Supabase |

La variable `ADMIN_EMAILS` (API) y `VITE_ADMIN_EMAILS` (panel) **suman** correos a la
lista base. En producción deben contener exactamente estos tres correos.

> La autorización de verdad la hace la API: el panel consulta `/auth/me` y la API
> compara contra `ADMIN_EMAILS`. Un correo fuera de la lista puede autenticarse en
> Supabase, pero la API le responde `403 Admin access denied`.

## Crear o resetear las cuentas en Supabase

Requiere `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` (service role) apuntando al proyecto
de producción:

```bash
cd apps/api
ADMIN_SETUP_PASSWORD='<la contraseña compartida>' python scripts/setup_admin_users.py
```

En PowerShell:

```powershell
cd apps/api
$env:ADMIN_SETUP_PASSWORD = "<la contraseña compartida>"
python scripts/setup_admin_users.py
```

El script crea las que falten, resetea la contraseña de las que existan, y lista
cualquier otro usuario de Supabase para que se revise y se borre si era un acceso
antiguo.

## Accesos que se cerraron

- Se eliminaron de todas las listas: `admin@nutrablue.cl`, `rodrigo@dentameet.net`,
  `rodrigo@dentameet.cl`, `rohidalgo@alumnos.uai.cl` e `info.nutrablue@gmail.com`.
  `info.nutrablue@gmail.com` **sigue siendo el correo público de contacto** del sitio;
  lo que perdió es el permiso de administración.
- El login del panel ya no viene precargado con `admin@nutrablue.cl` / `admin123`, y
  tampoco cae a esas credenciales si se envía el formulario vacío.
- El login simulado (`VITE_ALLOW_MOCK_AUTH`) ahora sólo funciona en builds de
  desarrollo y únicamente con los correos de la lista. En un build de producción queda
  desactivado aunque la variable venga en `true`.
- El auto-registro en el panel está deshabilitado: las cuentas se crean a mano en
  Supabase.

## Checklist de producción

- [ ] `ADMIN_EMAILS` en la API = los tres correos.
- [ ] `VITE_ADMIN_EMAILS` en el panel = los tres correos.
- [ ] `VITE_ALLOW_MOCK_AUTH` = `false` (o sin definir) y `ALLOW_MOCK_AUTH` = `false`.
- [ ] `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configurados en el panel.
- [ ] `schema_updates.sql` aplicado en Supabase con los tres correos.
- [ ] Probado el login de las tres cuentas.
