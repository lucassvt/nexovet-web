-- Club La Mascotera - Loyalty ledger + config
-- Idempotent: safe to run multiple times

CREATE TABLE IF NOT EXISTS loyalty_ledger (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  dni VARCHAR,
  tipo VARCHAR NOT NULL,
  points INT NOT NULL,
  motivo TEXT,
  order_id VARCHAR,
  ticket_flexxus VARCHAR,
  expires_at TIMESTAMP,
  source_canal VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_dni ON loyalty_ledger(dni);
CREATE INDEX IF NOT EXISTS idx_loyalty_expires ON loyalty_ledger(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_ticket_flexxus
  ON loyalty_ledger(ticket_flexxus)
  WHERE ticket_flexxus IS NOT NULL;

CREATE TABLE IF NOT EXISTS loyalty_config (
  id SERIAL PRIMARY KEY,
  pesos_por_punto INT DEFAULT 90,
  vigencia_dias INT DEFAULT 365,
  dias_inactividad INT DEFAULT 90,
  notif_dias_antes INT[] DEFAULT ARRAY[30, 15, 1],
  puntos_registro INT DEFAULT 50,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default row only if table is empty
INSERT INTO loyalty_config (pesos_por_punto, vigencia_dias, dias_inactividad, notif_dias_antes, puntos_registro)
SELECT 90, 365, 90, ARRAY[30, 15, 1], 50
WHERE NOT EXISTS (SELECT 1 FROM loyalty_config);
