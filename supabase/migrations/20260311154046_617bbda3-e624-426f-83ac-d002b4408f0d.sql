
ALTER TABLE public.analysis_results ADD COLUMN is_favorited boolean NOT NULL DEFAULT false;

CREATE POLICY "Users can update own analyses" ON public.analysis_results
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
