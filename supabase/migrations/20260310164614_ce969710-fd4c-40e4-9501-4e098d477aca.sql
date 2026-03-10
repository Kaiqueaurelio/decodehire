
CREATE OR REPLACE FUNCTION public.notify_admins_new_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin record;
BEGIN
  FOR _admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      _admin.user_id,
      'Nova mensagem de contato',
      'Mensagem de ' || NEW.name || ' (' || NEW.email || ')',
      'contact',
      jsonb_build_object('contact_message_id', NEW.id)
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_contact_message
  AFTER INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_contact();
