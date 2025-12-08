-- Add franchise_id column to fdds table and create foreign key relationship

-- Step 1: Add the franchise_id column
ALTER TABLE fdds 
ADD COLUMN franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;

-- Step 2: Update existing records to link them to franchises by name
UPDATE fdds 
SET franchise_id = franchises.id 
FROM franchises 
WHERE fdds.franchise_name = franchises.name;

-- Step 3: Create an index for better query performance
CREATE INDEX idx_fdds_franchise_id ON fdds(franchise_id);

-- Step 4: Add a comment
COMMENT ON COLUMN fdds.franchise_id IS 'Foreign key reference to franchises table';
