import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

_ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
_ENV_SUFFIX = "PROD" if _ENVIRONMENT == "production" else "DEV"


def _envvar(name: str, default: str = "") -> str:
    """
    Permite tener credenciales de desarrollo y produccion en el mismo .env:
    si existe {name}_DEV / {name}_PROD se usa segun ENVIRONMENT; si no,
    cae al nombre plano {name} (compatibilidad con .env de un solo entorno).
    """
    suffixed = os.getenv(f"{name}_{_ENV_SUFFIX}")
    if suffixed is not None:
        return suffixed
    return os.getenv(name, default)


class Settings(BaseSettings):
    port: int = int(os.getenv("PORT", "3001"))
    environment: str = _ENVIRONMENT
    cors_origins: str = _envvar("CORS_ORIGIN", "http://localhost:3000")
    internal_api_key: str = os.getenv("INTERNAL_API_KEY", "NutraBlueSync2026SecretKey!")
    allow_mock_auth_raw: bool = os.getenv("ALLOW_MOCK_AUTH", "false").lower() == "true"

    admin_emails_raw: str = os.getenv("ADMIN_EMAILS", "")

    @property
    def admin_emails(self) -> list[str]:
        # Permite fallback a correos especificos de administracion si la variable no esta definida
        default_admins = ["admin@nutrablue.cl", "rodrigo@dentameet.net", "rodrigo@dentameet.cl", "rohidalgo@alumnos.uai.cl"]
        from_env = [
            e.strip().lower()
            for e in self.admin_emails_raw.split(",")
            if e.strip()
        ]
        return list(set(default_admins + from_env))

    # Email (Resend)
    resend_api_key: str = _envvar("RESEND_API_KEY", "")
    email_from: str = _envvar("EMAIL_FROM", "Nutra Blue <onboarding@resend.dev>")
    email_enabled: bool = _envvar("EMAIL_ENABLED", "false").lower() == "true"

    # Supabase Configuration
    supabase_url: str = _envvar("SUPABASE_URL", "")
    supabase_key: str = _envvar("SUPABASE_KEY", "") # Anon key
    supabase_service_key: str = _envvar("SUPABASE_SERVICE_KEY", "") # Service role key

    # Google Sheets Configuration
    google_sheet_csv_url: str = os.getenv("GOOGLE_SHEET_CSV_URL", "")

    # AI Integration Configuration
    integrated_ai_api_url: str = os.getenv("INTEGRATED_AI_API_URL", "")
    integrated_ai_api_key: str = os.getenv("INTEGRATED_AI_API_KEY", "")
    website_id: str = os.getenv("WEBSITE_ID", "")
    website_domain: str = _envvar("WEBSITE_DOMAIN", "localhost")

    # Payment Provider Configuration
    payment_provider: str = _envvar("PAYMENT_PROVIDER", "mock") # mock, flow, mercadopago, transbank

    # Flow Credentials
    flow_api_url: str = _envvar("FLOW_API_URL", "https://sandbox.flow.cl/api")
    flow_api_key: str = _envvar("FLOW_API_KEY", "")
    flow_secret_key: str = _envvar("FLOW_SECRET_KEY", "")

    # Mercado Pago Credentials
    mercadopago_access_token: str = _envvar("MERCADOPAGO_ACCESS_TOKEN", "")

    # Transbank / Webpay Credentials (Default is sandbox integration)
    webpay_commerce_code: str = _envvar("WEBPAY_COMMERCE_CODE", "597055555532")
    webpay_api_key: str = _envvar("WEBPAY_API_KEY", "")

    # n8n Webhooks
    n8n_subscriber_webhook: str = os.getenv("N8N_SUBSCRIBER_WEBHOOK", "")

    # Cloudflare R2 Credentials
    r2_account_id: str = _envvar("R2_ACCOUNT_ID", "")
    r2_access_key_id: str = _envvar("R2_ACCESS_KEY_ID", "")
    r2_secret_access_key: str = _envvar("R2_SECRET_ACCESS_KEY", "")
    r2_bucket_name: str = _envvar("R2_BUCKET_NAME", "nutrablue-media")
    r2_public_domain: str = _envvar("R2_PUBLIC_DOMAIN", "") # e.g. https://media.nutrablue.cl or https://pub-xxx.r2.dev

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def allow_mock_auth(self) -> bool:
        # Nunca se activa en produccion, sin importar el valor de la env var
        return self.allow_mock_auth_raw and not self.is_production

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"] if not self.is_production else []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # env_prefix con un valor que nunca existira en el entorno real: desactiva la
    # lectura automatica de env vars por nombre de campo de pydantic-settings, para
    # que los defaults calculados arriba con _envvar()/os.getenv() sean la unica
    # fuente de verdad (evita que un SUPABASE_URL plano pise a SUPABASE_URL_PROD).
    model_config = {"case_sensitive": False, "env_prefix": "NB_SETTINGS_DISABLED_AUTO_ENV__"}

settings = Settings()

