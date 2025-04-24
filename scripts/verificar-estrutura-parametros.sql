-- Verificar a estrutura da tabela parametros_precificacao
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parametros_precificacao'
ORDER BY ordinal_position;
