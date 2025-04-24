-- Check the structure of the parametros_precificacao table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'parametros_precificacao'
ORDER BY ordinal_position;
