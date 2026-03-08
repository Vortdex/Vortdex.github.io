
CREATE TABLE public.edge_function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  function_name text NOT NULL,
  event_type text NOT NULL,
  ip_address text,
  details jsonb DEFAULT '{}'::jsonb,
  status_code integer
);

-- Index for efficient querying by function and time
CREATE INDEX idx_edge_logs_function_time ON public.edge_function_logs (function_name, created_at DESC);
CREATE INDEX idx_edge_logs_event_type ON public.edge_function_logs (event_type);

-- No RLS needed - this table is only written to by edge functions using service role key
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) to insert
CREATE POLICY "Service role can insert logs"
  ON public.edge_function_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to read
CREATE POLICY "Service role can read logs"
  ON public.edge_function_logs FOR SELECT
  TO service_role
  USING (true);
