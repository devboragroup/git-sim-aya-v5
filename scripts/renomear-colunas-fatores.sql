-- Script para renomear as colunas de fatores de orientação solar
-- Preservando os dados existentes

-- Verificar se existem dados nas colunas antes de renomear
DO $$
DECLARE
    norte_count INTEGER;
    sul_count INTEGER;
    leste_count INTEGER;
    oeste_count INTEGER;
BEGIN
    -- Contar registros com valores não nulos
    SELECT COUNT(*) INTO norte_count FROM parametros_precificacao WHERE fator_orientacao_norte IS NOT NULL;
    SELECT COUNT(*) INTO sul_count FROM parametros_precificacao WHERE fator_orientacao_sul IS NOT NULL;
    SELECT COUNT(*) INTO leste_count FROM parametros_precificacao WHERE fator_orientacao_leste IS NOT NULL;
    SELECT COUNT(*) INTO oeste_count FROM parametros_precificacao WHERE fator_orientacao_oeste IS NOT NULL;
    
    RAISE NOTICE 'Registros com valores: Norte: %, Sul: %, Leste: %, Oeste: %', norte_count, sul_count, leste_count, oeste_count;
END $$;

-- Verificar se as novas colunas já existem
DO $$
BEGIN
    -- Adicionar colunas temporárias para preservar os dados
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_norte NUMERIC;
        RAISE NOTICE 'Coluna fator_norte adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_norte já existe';
    END;
    
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_sul NUMERIC;
        RAISE NOTICE 'Coluna fator_sul adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_sul já existe';
    END;
    
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_leste NUMERIC;
        RAISE NOTICE 'Coluna fator_leste adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_leste já existe';
    END;
    
    BEGIN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_oeste NUMERIC;
        RAISE NOTICE 'Coluna fator_oeste adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Coluna fator_oeste já existe';
    END;
END $$;

-- Copiar os dados das colunas antigas para as novas
UPDATE parametros_precificacao
SET 
    fator_norte = fator_orientacao_norte,
    fator_sul = fator_orientacao_sul,
    fator_leste = fator_orientacao_leste,
    fator_oeste = fator_orientacao_oeste;

-- Verificar se a cópia dos dados foi bem-sucedida
DO $$
DECLARE
    norte_count INTEGER;
    sul_count INTEGER;
    leste_count INTEGER;
    oeste_count INTEGER;
BEGIN
    -- Contar registros com valores não nulos nas novas colunas
    SELECT COUNT(*) INTO norte_count FROM parametros_precificacao WHERE fator_norte IS NOT NULL;
    SELECT COUNT(*) INTO sul_count FROM parametros_precificacao WHERE fator_sul IS NOT NULL;
    SELECT COUNT(*) INTO leste_count FROM parametros_precificacao WHERE fator_leste IS NOT NULL;
    SELECT COUNT(*) INTO oeste_count FROM parametros_precificacao WHERE fator_oeste IS NOT NULL;
    
    RAISE NOTICE 'Registros com valores nas novas colunas: Norte: %, Sul: %, Leste: %, Oeste: %', 
                 norte_count, sul_count, leste_count, oeste_count;
END $$;

-- Remover as colunas antigas
ALTER TABLE parametros_precificacao 
    DROP COLUMN IF EXISTS fator_orientacao_norte,
    DROP COLUMN IF EXISTS fator_orientacao_sul,
    DROP COLUMN IF EXISTS fator_orientacao_leste,
    DROP COLUMN IF EXISTS fator_orientacao_oeste;

-- Definir valores padrão para as novas colunas (1.0 é o valor neutro para fatores)
ALTER TABLE parametros_precificacao 
    ALTER COLUMN fator_norte SET DEFAULT 1.0,
    ALTER COLUMN fator_sul SET DEFAULT 1.0,
    ALTER COLUMN fator_leste SET DEFAULT 1.0,
    ALTER COLUMN fator_oeste SET DEFAULT 1.0;

-- Atualizar valores nulos para o valor padrão
UPDATE parametros_precificacao
SET 
    fator_norte = 1.0 WHERE fator_norte IS NULL,
    fator_sul = 1.0 WHERE fator_sul IS NULL,
    fator_leste = 1.0 WHERE fator_leste IS NULL,
    fator_oeste = 1.0 WHERE fator_oeste IS NULL;

-- Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'parametros_precificacao' AND column_name LIKE 'fator_%'
ORDER BY column_name;
