-- Supabase SQL Setup for One Rupee Homepage Payment Flow

-- 1. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  txn_id TEXT UNIQUE NOT NULL,
  utr TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  amount INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  CHECK (status IN ('pending', 'verified', 'rejected'))
);

-- 2. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  owner_name TEXT,
  caption TEXT,
  txn_id TEXT NOT NULL,
  payment_id UUID NOT NULL REFERENCES payments(id),
  is_approved BOOLEAN DEFAULT TRUE,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(txn_id)
);

-- 3. Homepage State Table
CREATE TABLE IF NOT EXISTS homepage_state (
  id INT PRIMARY KEY DEFAULT 1,
  current_image_id UUID REFERENCES submissions(id),
  total_replacements INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (id = 1)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_txn_id ON payments(txn_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_utr ON payments(utr);
CREATE INDEX IF NOT EXISTS idx_submissions_txn_id ON submissions(txn_id);
CREATE INDEX IF NOT EXISTS idx_submissions_payment_id ON submissions(payment_id);

-- Initialize homepage_state with default row
INSERT INTO homepage_state (id, total_replacements)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS if needed (optional - configure based on your security requirements)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public read/write for MVP, restrict in production)
CREATE POLICY "Enable read for all" ON payments AS (SELECT) USING (true);
CREATE POLICY "Enable write for all" ON payments AS (INSERT) WITH CHECK (true);

CREATE POLICY "Enable read for all" ON submissions AS (SELECT) USING (true);
CREATE POLICY "Enable write for all" ON submissions AS (INSERT) WITH CHECK (true);

CREATE POLICY "Enable read for all" ON homepage_state AS (SELECT) USING (true);
CREATE POLICY "Enable write for all" ON homepage_state AS (UPDATE) WITH CHECK (true);
