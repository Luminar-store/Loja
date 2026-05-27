-- ========================================================
-- MIGRATION: FASE 4 — AUTOMATION & REVIEWS
-- TABELAS: cart_recovery, product_reviews, order_timeline
-- ========================================================

-- public.cart_recovery
CREATE TABLE IF NOT EXISTS public.cart_recovery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    cart_items JSONB NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    checkout_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_recovery_status CHECK (status IN ('pending', 'contacted', 'recovered'))
);

-- public.product_reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    rating INT NOT NULL,
    comment TEXT,
    is_verified_buyer BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5)
);

-- public.order_timeline
CREATE TABLE IF NOT EXISTS public.order_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    step_key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_cart_recovery_session ON public.cart_recovery(session_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_prod ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON public.order_timeline(order_id);

-- RLS Hardening
ALTER TABLE public.cart_recovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

-- Políticas para cart_recovery
DROP POLICY IF EXISTS "Public anonymous insert recovery" ON public.cart_recovery;
CREATE POLICY "Public anonymous insert recovery" ON public.cart_recovery FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage recovery" ON public.cart_recovery;
CREATE POLICY "Admin manage recovery" ON public.cart_recovery FOR ALL TO authenticated
    USING (auth.jwt()->>'email' IN (SELECT value FROM public.settings WHERE key = 'admin_email'));

-- Políticas para product_reviews
DROP POLICY IF EXISTS "Public read approved reviews" ON public.product_reviews;
CREATE POLICY "Public read approved reviews" ON public.product_reviews FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Public insert reviews" ON public.product_reviews;
CREATE POLICY "Public insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);

-- Políticas para order_timeline
DROP POLICY IF EXISTS "Users read own timeline" ON public.order_timeline;
CREATE POLICY "Users read own timeline" ON public.order_timeline FOR SELECT USING (
    order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
);

DROP POLICY IF EXISTS "Admin manage timeline" ON public.order_timeline;
CREATE POLICY "Admin manage timeline" ON public.order_timeline FOR ALL TO authenticated
    USING (auth.jwt()->>'email' IN (SELECT value FROM public.settings WHERE key = 'admin_email'));
