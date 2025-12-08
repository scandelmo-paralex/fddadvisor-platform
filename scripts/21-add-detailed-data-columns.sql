-- Add columns for detailed franchise data from Vertex AI analysis
-- Run this BEFORE importing the detailed franchise data

-- Add franchise_score_breakdown column for expandable metrics
ALTER TABLE franchises 
ADD COLUMN IF NOT EXISTS franchise_score_breakdown JSONB DEFAULT '{}'::jsonb;

-- Add investment_breakdown column for detailed cost categories
ALTER TABLE franchises
ADD COLUMN IF NOT EXISTS investment_breakdown JSONB DEFAULT '{}'::jsonb;

-- Add avg_revenue column for average revenue data
ALTER TABLE franchises
ADD COLUMN IF NOT EXISTS avg_revenue INTEGER;

-- Add revenue_data column for Item 19 details
ALTER TABLE franchises
ADD COLUMN IF NOT EXISTS revenue_data JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN franchises.franchise_score_breakdown IS 'Detailed metrics breakdown for each FranchiseScore category (systemStability, supportQuality, growthTrajectory, financialDisclosure)';
COMMENT ON COLUMN franchises.investment_breakdown IS 'Detailed cost categories for initial investment';
COMMENT ON COLUMN franchises.avg_revenue IS 'Average revenue from Item 19 financial performance data';
COMMENT ON COLUMN franchises.revenue_data IS 'Complete Item 19 revenue data including median, average, top quartile, and sample size';

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'franchises' 
AND column_name IN ('franchise_score_breakdown', 'investment_breakdown', 'avg_revenue', 'revenue_data')
ORDER BY column_name;
