-- Drop restrictive policies on job_templates
DROP POLICY IF EXISTS "Users can delete own templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can view own templates" ON public.job_templates;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view own templates" ON public.job_templates
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.job_templates
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.job_templates
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.job_templates
FOR DELETE TO authenticated
USING (auth.uid() = user_id);