-- dux_push_log — auditoría de pushes a DUX ERP
--
-- Esta tabla vive en la MISMA DB del backend Medusa (DATABASE_URL, p.ej.
-- postgresql://.../nexovet_shop). NO es `dux_integrada`.
--
-- Correr: `psql "$DATABASE_URL" -f src/migrations/dux_push_log.sql`

CREATE TABLE IF NOT EXISTS dux_push_log (
  id              SERIAL PRIMARY KEY,
  order_id        VARCHAR      NOT NULL,
  erp_target      VARCHAR      NOT NULL,  -- 'central' | 'franquicias'
  region_key      VARCHAR,                -- sales_channel_id
  attempt         INT          NOT NULL DEFAULT 1,
  status          VARCHAR      NOT NULL,  -- 'pending' | 'success' | 'failed'
  dux_pedido_id   VARCHAR,
  error           TEXT,
  request_payload JSONB,
  response_body   JSONB,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dux_push_log_order_id_idx
  ON dux_push_log (order_id);

CREATE INDEX IF NOT EXISTS dux_push_log_status_idx
  ON dux_push_log (status);

CREATE INDEX IF NOT EXISTS dux_push_log_updated_at_idx
  ON dux_push_log (updated_at DESC);

-- Para la consulta "último success por región":
CREATE INDEX IF NOT EXISTS dux_push_log_region_success_idx
  ON dux_push_log (region_key, status, updated_at DESC);
