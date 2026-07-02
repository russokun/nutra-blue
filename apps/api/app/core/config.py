import os
from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    port: int = int(os.getenv("PORT", "3001"))
    environment: str = os.getenv("ENVIRONMENT", "development")
    cors_origins: str = os.getenv("CORS_ORIGIN", "http://localhost:3000")
    internal_api_key: str = os.getenv("INTERNAL_API_KEY", "NutraBlueSync2026SecretKey!")
    
    admin_emails_raw: str = Field(default="", alias="admin_emails")

    @property
    def admin_emails(self) -> list[str]:
        return [
            e.strip().lower()
            for e in self.admin_emails_raw.split(",")
            if e.strip()
        ]

    # Email (Resend)
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    email_from: str = os.getenv("EMAIL_FROM", "Nutra Blue <onboarding@resend.dev>")
    email_enabled: bool = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
    
    # Supabase Configuration
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "") # Anon key
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "") # Service role key
    
    # Google Sheets Configuration
    google_sheet_csv_url: str = os.getenv("GOOGLE_SHEET_CSV_URL", "")
    
    # AI Integration Configuration
    integrated_ai_api_url: str = os.getenv("INTEGRATED_AI_API_URL", "")
    integrated_ai_api_key: str = os.getenv("INTEGRATED_AI_API_KEY", "")
    website_id: str = os.getenv("WEBSITE_ID", "")
    website_domain: str = os.getenv("WEBSITE_DOMAIN", "localhost")
    
    # Payment Provider Configuration
    payment_provider: str = os.getenv("PAYMENT_PROVIDER", "mock") # mock, flow, mercadopago, transbank
    
    # Flow Credentials
    flow_api_url: str = os.getenv("FLOW_API_URL", "https://sandbox.flow.cl/api")
    flow_api_key: str = os.getenv("FLOW_API_KEY", "")
    flow_secret_key: str = os.getenv("FLOW_SECRET_KEY", "")
    
    # Mercado Pago Credentials
    mercadopago_access_token: str = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
    
    # Transbank / Webpay Credentials (Default is sandbox integration)
    webpay_commerce_code: str = os.getenv("WEBPAY_COMMERCE_CODE", "597055555532")
    webpay_api_key: str = os.getenv("WEBPAY_API_KEY", "")
    
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"] if not self.is_production else []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        case_sensitive = False

settings = Settings()
