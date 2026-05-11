CREATE TABLE IF NOT EXISTS aggregate_followers (
  brand TEXT PRIMARY KEY,
  facebook BIGINT,
  instagram BIGINT,
  twitter BIGINT,
  linkedin BIGINT,
  youtube BIGINT,
  last_updated DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS recurring_followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT,
  date_label TEXT,
  brand TEXT,
  facebook BIGINT,
  instagram BIGINT,
  twitter BIGINT,
  linkedin BIGINT,
  youtube BIGINT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE aggregate_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_followers ENABLE ROW LEVEL SECURITY;

-- Allow all for anon key
CREATE POLICY "Allow all on aggregate" ON aggregate_followers FOR ALL USING (true);
CREATE POLICY "Allow all on recurring" ON recurring_followers FOR ALL USING (true);
