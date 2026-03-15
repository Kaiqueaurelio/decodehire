CREATE OR REPLACE FUNCTION public.notify_user_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _plan_name text;
  _title text;
  _message text;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('confirmed', 'rejected') THEN
    SELECT name INTO _plan_name FROM public.subscription_plans WHERE id = NEW.plan_id;
    IF NEW.status = 'confirmed' THEN
      _title := 'Pagamento aprovado! ✅';
      _message := 'Seu pagamento para o plano ' || COALESCE(_plan_name, '') || ' foi confirmado. Aproveite!';
    ELSE
      _title := 'Pagamento não aprovado';
      _message := 'Seu pagamento para o plano ' || COALESCE(_plan_name, '') || ' foi recusado. Entre em contato para mais informações.';
    END IF;
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      NEW.user_id,
      _title,
      _message,
      'payment',
      jsonb_build_object('payment_request_id', NEW.id, 'status', NEW.status::text, 'plan_id', NEW.plan_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_payment_status_change
AFTER UPDATE OF status ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_payment_status();

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO public
WITH CHECK (true);