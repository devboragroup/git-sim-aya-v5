-- Verificar as restrições atuais nas colunas de fatores de orientação solar
SELECT 
    table_name, 
    column_name, 
    column_default, 
    is_nullable, 
    data_type, 
    character_maximum_length, 
    numeric_precision, 
    numeric_scale,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM 
    information_schema.columns c
LEFT JOIN
    pg_constraint con ON con.conrelid = (c.table_schema || '.' || c.table_name)::regclass
WHERE 
    c.table_name = 'parametros_precificacao' 
    AND c.column_name LIKE 'fator_%';
