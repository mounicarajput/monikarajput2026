-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'used')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Simple policies for demonstration (In production, restrict UPDATE to service role only if possible)
CREATE POLICY "Allow public read payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update payments" ON payments FOR UPDATE USING (true);
