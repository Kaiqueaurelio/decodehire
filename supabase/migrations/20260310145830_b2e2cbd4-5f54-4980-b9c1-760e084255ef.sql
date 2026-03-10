-- Allow admins to update user_subscriptions (to deactivate old ones)
CREATE POLICY "Admins can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO public
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));