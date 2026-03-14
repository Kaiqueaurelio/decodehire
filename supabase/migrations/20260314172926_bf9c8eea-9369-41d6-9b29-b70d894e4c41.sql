
-- Add receipt_url column to payment_requests
ALTER TABLE public.payment_requests ADD COLUMN receipt_url text;

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to view their own receipts
CREATE POLICY "Users can view own receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow admins to view all receipts
CREATE POLICY "Admins can view all receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND public.has_role(auth.uid(), 'admin'));
