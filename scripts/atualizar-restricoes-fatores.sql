-- Verificar as restrições atuais nas colunas de fatores de orientação solar
SELECT 
    table_name, 
    column_name, 
    column_default, 
    is_nullable, 
    data_type, 
    character_maximum_length, 
    numeric_precision, 
    numeric_scale
FROM 
    information_schema.columns 
WHERE 
    table_name = 'parametros_precificacao' 
    AND column_name LIKE 'fator_%';
