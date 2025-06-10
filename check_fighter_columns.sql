-- Check if Fighter table has the new columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Fighter' 
ORDER BY column_name;

-- Alternative: Check table structure
\d "Fighter" 