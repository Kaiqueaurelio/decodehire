-- Add business to plan_type enum
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'business';

-- Add daily_limit column to subscription_plans
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS daily_limit integer;

-- Create function to get daily usage count
CREATE OR REPLACE FUNCTION public.get_daily_usage(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.analysis_results
  WHERE user_id = _user_id
    AND created_at >= now() - interval '24 hours'
$$;