CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_process_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZGdvYmR4dXFpb2FnaHN0Y3J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0OTMwMjgsImV4cCI6MjA5OTA2OTAyOH0.bA1wpasXOBa6l_F50XVw1pv3TN4lcZRmQ56I_mEotEo';
BEGIN
  SELECT net.http_post(
    url := 'https://cadgobdxuqioaghstcry.supabase.co/functions/v1/process-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  ) INTO request_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_process_lead_immobiliare ON public.lead_immobiliare;
CREATE TRIGGER trg_process_lead_immobiliare AFTER INSERT ON public.lead_immobiliare FOR EACH ROW EXECUTE FUNCTION public.trigger_process_lead();
DROP TRIGGER IF EXISTS trg_process_lead_fotovoltaico ON public.lead_fotovoltaico;
CREATE TRIGGER trg_process_lead_fotovoltaico AFTER INSERT ON public.lead_fotovoltaico FOR EACH ROW EXECUTE FUNCTION public.trigger_process_lead();
DROP TRIGGER IF EXISTS trg_process_lead_cessione_quinto ON public.lead_cessione_quinto;
CREATE TRIGGER trg_process_lead_cessione_quinto AFTER INSERT ON public.lead_cessione_quinto FOR EACH ROW EXECUTE FUNCTION public.trigger_process_lead();
DROP TRIGGER IF EXISTS trg_process_lead_mutui ON public.lead_mutui;
CREATE TRIGGER trg_process_lead_mutui AFTER INSERT ON public.lead_mutui FOR EACH ROW EXECUTE FUNCTION public.trigger_process_lead();
DROP TRIGGER IF EXISTS trg_process_lead_climatizzazione ON public.lead_climatizzazione;
CREATE TRIGGER trg_process_lead_climatizzazione AFTER INSERT ON public.lead_climatizzazione FOR EACH ROW EXECUTE FUNCTION public.trigger_process_lead();
DROP TRIGGER IF EXISTS trg_process_lead_efficienza_energetica ON public.lead_efficienza_energetica;
CREATE TRIGGER trg_process_lead_efficienza_energetica AFTER INSERT ON public.lead_efficienza_energetica FOR EACH ROW EXECUTE FUNCTION public.trigger_process_lead();
