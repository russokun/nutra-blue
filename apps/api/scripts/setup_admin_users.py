"""Crea (o resetea) las cuentas de administracion de Nutra Blue en Supabase.

Deja exactamente las cuentas de `settings.admin_emails` operativas con la contrasena
que se entrega por variable de entorno, y reporta cualquier otro usuario de Supabase
que estuviera usandose como acceso administrativo para poder limpiarlo.

Uso (desde apps/api, con el .env que apunte al proyecto Supabase correcto):

    # PowerShell
    $env:ADMIN_SETUP_PASSWORD = "<la contrasena compartida>"
    python scripts/setup_admin_users.py

    # bash
    ADMIN_SETUP_PASSWORD='<la contrasena compartida>' python scripts/setup_admin_users.py

Requiere SUPABASE_URL y SUPABASE_SERVICE_KEY (service role) en el entorno: la API de
admin de Supabase no funciona con la anon key. La contrasena nunca se guarda en el
repositorio ni se imprime en pantalla.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client  # noqa: E402

from app.core.config import settings  # noqa: E402


def build_admin_client():
    url = settings.supabase_url
    service_key = settings.supabase_service_key
    if not url or "your-project" in url:
        sys.exit("ERROR: SUPABASE_URL no esta configurado en el entorno.")
    if not service_key or "your-" in service_key.lower():
        sys.exit("ERROR: SUPABASE_SERVICE_KEY (service role) no esta configurado en el entorno.")
    return create_client(url, service_key)


def list_existing_users(client) -> dict:
    """Devuelve {email_lower: user} de todos los usuarios de auth."""
    found = {}
    page = 1
    while True:
        users = client.auth.admin.list_users(page=page, per_page=200)
        if not users:
            break
        for user in users:
            if user.email:
                found[user.email.lower()] = user
        if len(users) < 200:
            break
        page += 1
    return found


def main() -> int:
    password = os.getenv("ADMIN_SETUP_PASSWORD", "")
    if not password:
        sys.exit(
            "ERROR: falta la variable ADMIN_SETUP_PASSWORD con la contrasena a asignar.\n"
            "       No se escribe en el repo a proposito."
        )
    if len(password) < 8:
        sys.exit("ERROR: la contrasena debe tener al menos 8 caracteres.")

    admins = sorted(settings.admin_emails)
    if not admins:
        sys.exit("ERROR: ADMIN_EMAILS esta vacio; no hay a quien darle acceso.")

    client = build_admin_client()
    existing = list_existing_users(client)

    print(f"Proyecto Supabase: {settings.supabase_url}")
    print(f"Entorno: {settings.environment}")
    print(f"Administradores declarados ({len(admins)}):")
    for email in admins:
        print(f"  - {email}")
    print()

    for email in admins:
        user = existing.get(email)
        try:
            if user is None:
                client.auth.admin.create_user(
                    {
                        "email": email,
                        "password": password,
                        "email_confirm": True,
                    }
                )
                print(f"[creado]      {email}")
            else:
                client.auth.admin.update_user_by_id(
                    user.id,
                    {"password": password, "email_confirm": True},
                )
                print(f"[actualizado] {email}")
        except Exception as exc:  # noqa: BLE001 - se reporta y se sigue con el resto
            print(f"[ERROR]       {email}: {exc}")

    otros = sorted(set(existing) - set(admins))
    if otros:
        print()
        print("Usuarios de Supabase que NO estan en la lista de administracion.")
        print("No tienen acceso al panel (la API y el panel validan contra ADMIN_EMAILS),")
        print("pero revisa si alguno era una cuenta de acceso antigua y borrala a mano:")
        for email in otros:
            print(f"  - {email}")

    print()
    print("Listo. Prueba el login del panel con cada correo antes de cerrar el tema.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
