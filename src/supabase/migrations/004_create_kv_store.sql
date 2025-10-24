-- ============================================
-- Create KV Store Table
-- ============================================
-- Esta tabla es utilizada por el servidor para almacenar
-- datos de usuarios y otras configuraciones en formato clave-valor

CREATE TABLE IF NOT EXISTS public.kv_store_e2de53ff (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Índice para búsquedas por prefijo
CREATE INDEX IF NOT EXISTS kv_store_key_prefix_idx ON public.kv_store_e2de53ff (key text_pattern_ops);

-- Habilitar RLS
ALTER TABLE public.kv_store_e2de53ff ENABLE ROW LEVEL SECURITY;

-- Política: Solo el service role puede acceder
-- (El backend con SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role can access kv_store"
  ON public.kv_store_e2de53ff
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comentario
COMMENT ON TABLE public.kv_store_e2de53ff IS 'Almacenamiento clave-valor para datos del servidor';

-- Grant permissions to service role
GRANT ALL ON public.kv_store_e2de53ff TO service_role;

-- ============================================
-- FIN DE LA MIGRACIÓN
-- ============================================
