CREATE OR REPLACE FUNCTION public.enforce_wardrobe_daily_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.wardrobe_items
      WHERE user_id = NEW.user_id
        AND created_at >= (date_trunc('day', now() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London')) >= 5 THEN
    RAISE EXCEPTION 'You can add 5 items a day. Come back tomorrow to add more.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER wardrobe_daily_limit BEFORE INSERT ON public.wardrobe_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_wardrobe_daily_limit();