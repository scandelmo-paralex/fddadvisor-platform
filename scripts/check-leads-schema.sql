-- Check the structure of the leads table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;
