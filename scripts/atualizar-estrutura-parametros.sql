-- Script para atualizar a estrutura da tabela parametros_precificacao
-- Remover os campos valor_m2_padrao e valor_adicional_vaga

-- Primeiro, verificamos se os novos campos já existem e os adicionamos se necessário
DO $$
BEGIN
    -- Verificar e adicionar campos para valores por m² específicos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_m2_studio') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_m2_studio DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_m2_apartamento') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_m2_apartamento DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_m2_comercial') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_m2_comercial DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_m2_garden') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_m2_garden DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    -- Verificar e adicionar campos para valores adicionais específicos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_adicional_vaga_simples') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_adicional_vaga_simples DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_adicional_vaga_dupla') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_adicional_vaga_dupla DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_adicional_vaga_moto') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_adicional_vaga_moto DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'valor_adicional_hobby_box') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN valor_adicional_hobby_box DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    -- Verificar e adicionar campos para fatores de orientação solar adicionais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'fator_nordeste') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_nordeste DECIMAL(5,2) DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'fator_noroeste') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_noroeste DECIMAL(5,2) DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'fator_sudeste') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_sudeste DECIMAL(5,2) DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parametros_precificacao' AND column_name = 'fator_sudoeste') THEN
        ALTER TABLE parametros_precificacao ADD COLUMN fator_sudoeste DECIMAL(5,2) DEFAULT 1;
    END IF;
END $$;

-- Migrar dados dos campos antigos para os novos campos
UPDATE parametros_precificacao
SET 
    valor_m2_studio = COALESCE(valor_m2_studio, valor_m2_padrao),
    valor_m2_apartamento = COALESCE(valor_m2_apartamento, valor_m2_padrao),
    valor_m2_comercial = COALESCE(valor_m2_comercial, valor_m2_padrao),
    valor_m2_garden = COALESCE(valor_m2_garden, valor_m2_padrao),
    valor_adicional_vaga_simples = COALESCE(valor_adicional_vaga_simples, valor_adicional_vaga)
WHERE 
    valor_m2_padrao IS NOT NULL OR valor_adicional_vaga IS NOT NULL;

-- Remover os campos antigos
ALTER TABLE parametros_precificacao DROP COLUMN IF EXISTS valor_m2_padrao;
ALTER TABLE parametros_precificacao DROP COLUMN IF EXISTS valor_adicional_vaga;
