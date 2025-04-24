-- Adicionar a coluna descricao à tabela parametros_precificacao
ALTER TABLE parametros_precificacao 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Verificar se a coluna foi adicionada corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'parametros_precificacao' AND column_name = 'descricao';
