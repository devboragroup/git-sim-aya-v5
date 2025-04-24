-- Script corrigido para renomear as colunas de fatores de orientação solar
-- Preservando os dados existentes

-- Verificar se as novas colunas já existem e adicioná-las se necessário
DO $$
BEGIN
    -- Adicionar colunas novas para preservar os dados
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN IF NOT EXISTS fator_norte NUMERIC;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_norte já existe';
    END;
    
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN IF NOT EXISTS fator_sul NUMERIC;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_sul já existe';
    END;
    
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN IF NOT EXISTS fator_leste NUMERIC;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_leste já existe';
    END;
    
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN IF NOT EXISTS fator_oeste NUMERIC;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_oeste já existe';
    END;
END $$;

-- Copiar os dados das colunas antigas para as novas
UPDATE parametros_precificacao
SET 
    fator_norte = COALESCE(fator_orientacao_norte, 1.0),
    fator_sul = COALESCE(fator_orientacao_sul, 1.0),
    fator_leste = COALESCE(fator_orientacao_leste, 1.0),
    fator_oeste = COALESCE(fator_orientacao_oeste, 1.0);

-- Remover as colunas antigas uma por uma para evitar erros de sintaxe
ALTER TABLE parametros_precificacao DROP COLUMN IF EXISTS fator_orientacao_norte;
ALTER TABLE parametros_precificacao DROP COLUMN IF EXISTS fator_orientacao_sul;
ALTER TABLE parametros_precificacao DROP COLUMN IF EXISTS fator_orientacao_leste;
ALTER TABLE parametros_precificacao DROP COLUMN IF EXISTS fator_orientacao_oeste;

-- Definir valores padrão para as novas colunas (1.0 é o valor neutro para fatores)
ALTER TABLE parametros_precificacao ALTER COLUMN fator_norte SET DEFAULT 1.0;
ALTER TABLE parametros_precificacao ALTER COLUMN fator_sul SET DEFAULT 1.0;
ALTER TABLE parametros_precificacao ALTER COLUMN fator_leste SET DEFAULT 1.0;
ALTER TABLE parametros_precificacao ALTER COLUMN fator_oeste SET DEFAULT 1.0;

-- Garantir que não existam valores nulos nas colunas (CORREÇÃO AQUI)
UPDATE parametros_precificacao
SET 
    fator_norte = CASE WHEN fator_norte IS NULL THEN 1.0 ELSE fator_norte END,
    fator_sul = CASE WHEN fator_sul IS NULL THEN 1.0 ELSE fator_sul END, 
    fator_leste = CASE WHEN fator_leste IS NULL THEN 1.0 ELSE fator_leste END,
    fator_oeste = CASE WHEN fator_oeste IS NULL THEN 1.0 ELSE fator_oeste END;

-- Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'parametros_precificacao' AND column_name LIKE 'fator_%'
ORDER BY column_name;
