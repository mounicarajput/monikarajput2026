-- 1. Create one_rupee_payments table
CREATE TABLE IF NOT EXISTS public.one_rupee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'anonymous',
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create one_rupee_submissions table
CREATE TABLE IF NOT EXISTS public.one_rupee_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.one_rupee_payments(id) NOT NULL,
    image_url TEXT NOT NULL,
    owner_name TEXT DEFAULT 'Anonymous',
    caption TEXT DEFAULT '',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up RLS (Row Level Security) - Permissive for this MVP
ALTER TABLE public.one_rupee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_rupee_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for one_rupee_payments" ON public.one_rupee_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for one_rupee_submissions" ON public.one_rupee_submissions FOR ALL USING (true) WITH CHECK (true);
