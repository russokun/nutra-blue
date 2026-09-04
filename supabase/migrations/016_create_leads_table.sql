-- Tabla para suscriptores y leads capturados (pop-up magnet, footer newsletter, etc.)
--
-- Se utiliza para registrar prospectos antes de sincronizar con n8n, CRM o planillas externas.
-- La API usa upsert sobre el correo electrónico (`email`).

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'website',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
