-- Review trải nghiệm chụp ảnh. Chạy migration này trên schema hiện tại.
-- Không lưu rating tổng; rating luôn được tính từ các review public.

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS service_title TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_slug TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.reviews SET customer_name = author_name WHERE customer_name IS NULL;
ALTER TABLE public.reviews ALTER COLUMN booking_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN comment SET NOT NULL;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES public.booking_photo(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_booking ON public.reviews (booking_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public read published experience reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customer creates review for completed booking" ON public.reviews;
DROP POLICY IF EXISTS "Admin manages experience reviews" ON public.reviews;

CREATE POLICY "Public read published experience reviews"
ON public.reviews FOR SELECT
USING (is_public = true OR (auth.jwt() ->> 'email') = 'sdang0995@gmail.com');

CREATE POLICY "Customer creates review for completed booking"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND rating BETWEEN 1 AND 5
  AND length(trim(comment)) BETWEEN 10 AND 800
  AND EXISTS (
    SELECT 1 FROM public.booking_photo b
    WHERE b.id = booking_id
      AND b.status = 'completed'
      AND lower(b.customer_email) = lower(auth.jwt() ->> 'email')
  )
);

CREATE POLICY "Admin manages experience reviews"
ON public.reviews FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'sdang0995@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'sdang0995@gmail.com');
