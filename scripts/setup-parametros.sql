-- Verificar se a tabela parametros_precificacao existe e criá-la se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'parametros_precificacao') THEN
        CREATE TABLE parametros_precificacao (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            empreendimento_id UUID NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            valor_m2_padrao DECIMAL(12,2) NOT NULL,
            valor_adicional_suite DECIMAL(12,2) DEFAULT 0,
            valor_adicional_vaga DECIMAL(12,2) DEFAULT 0,
            fator_norte DECIMAL(5,2) DEFAULT 1,
            fator_sul DECIMAL(5,2) DEFAULT 1,
            fator_leste DECIMAL(5,2) DEFAULT 1,
            fator_oeste DECIMAL(5,2) DEFAULT 1,
            ativo BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Verificar se a tabela fatores_pavimento existe e criá-la se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'fatores_pavimento') THEN
        CREATE TABLE fatores_pavimento (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parametro_id UUID NOT NULL REFERENCES parametros_precificacao(id) ON DELETE CASCADE,
            pavimento INTEGER NOT NULL,
            descricao VARCHAR(255),
            fator DECIMAL(5,2) NOT NULL DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(parametro_id, pavimento)
        );
    END IF;
END
$$;

-- Verificar se a tabela log_calculos_unidade existe e criá-la se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'log_calculos_unidade') THEN
        CREATE TABLE log_calculos_unidade (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
            parametro_id UUID NOT NULL REFERENCES parametros_precificacao(id) ON DELETE CASCADE,
            valor_base DECIMAL(12,2) NOT NULL,
            valor_adicional DECIMAL(12,2) NOT NULL,
            fator_orientacao DECIMAL(5,2) NOT NULL,
            fator_pavimento DECIMAL(5,2) NOT NULL,
            fator_ajuste_fino DECIMAL(5,2) NOT NULL,
            valor_calculado DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Verificar se a tabela historico_ajustes_unidade existe e criá-la se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'historico_ajustes_unidade') THEN
        CREATE TABLE historico_ajustes_unidade (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
            usuario_id UUID NOT NULL,
            percentual_anterior DECIMAL(5,2),
            percentual_novo DECIMAL(5,2) NOT NULL,
            motivo TEXT,
            valor_antes DECIMAL(12,2),
            valor_depois DECIMAL(12,2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Função para configurar fatores de pavimento
CREATE OR REPLACE FUNCTION configurar_fatores_pavimento(p_parametro_id UUID)
RETURNS VOID AS $$
DECLARE
    v_empreendimento_id UUID;
    v_pavimento INTEGER;
    v_pavimentos_distintos INTEGER[];
    v_max_pavimento INTEGER;
    v_min_pavimento INTEGER;
    v_fator DECIMAL;
    v_range INTEGER;
BEGIN
    -- Buscar o empreendimento do parâmetro
    SELECT empreendimento_id INTO v_empreendimento_id
    FROM parametros_precificacao
    WHERE id = p_parametro_id;
    
    -- Identificar todos os pavimentos distintos do empreendimento
    SELECT ARRAY_AGG(DISTINCT pavimento), MIN(pavimento), MAX(pavimento)
    INTO v_pavimentos_distintos, v_min_pavimento, v_max_pavimento
    FROM unidades
    WHERE empreendimento_id = v_empreendimento_id
    AND pavimento IS NOT NULL;
    
    -- Verificar se existem unidades com pavimento definido
    IF v_pavimentos_distintos IS NULL THEN
        RAISE EXCEPTION 'Não há unidades com pavimento definido para o empreendimento';
    END IF;
    
    -- Calcular a faixa de pavimentos para gradiente de valorização
    v_range := v_max_pavimento - v_min_pavimento + 1;
    
    -- Para cada pavimento, configurar um fator baseado em sua posição relativa
    FOREACH v_pavimento IN ARRAY v_pavimentos_distintos
    LOOP
        -- Fator padrão baseado na posição relativa do pavimento
        -- Pavimentos mais altos têm fator maior, criando um gradiente
        -- Térreo (ou menor pavimento) terá fator 0.9, o mais alto terá 1.3
        IF v_range > 1 THEN
            v_fator := 0.9 + (0.4 * (v_pavimento - v_min_pavimento)::DECIMAL / (v_range - 1));
        ELSE
            v_fator := 1.0; -- Se só houver um pavimento, fator neutro
        END IF;
        
        -- Arredondar para 2 casas decimais
        v_fator := ROUND(v_fator * 100) / 100;
        
        -- Inserir ou atualizar o fator para este pavimento
        INSERT INTO fatores_pavimento (parametro_id, pavimento, descricao, fator)
        VALUES (
            p_parametro_id, 
            v_pavimento, 
            CASE 
                WHEN v_pavimento = v_min_pavimento THEN 'Térreo/Primeiro Pavimento'
                WHEN v_pavimento = v_max_pavimento THEN 'Cobertura/Último Pavimento'
                ELSE 'Pavimento Intermediário'
            END,
            v_fator
        )
        ON CONFLICT (parametro_id, pavimento) DO UPDATE
        SET fator = v_fator,
            updated_at = NOW();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular valores de unidades
CREATE OR REPLACE FUNCTION calcular_valores_unidade(p_unidade_id UUID)
RETURNS VOID AS $$
DECLARE
    v_unidade RECORD;
    v_parametro RECORD;
    v_valor_base DECIMAL;
    v_valor_adicional DECIMAL;
    v_fator_orientacao DECIMAL;
    v_fator_pavimento DECIMAL := 1.0; -- Valor padrão
    v_fator_ajuste_fino DECIMAL := 1.0; -- Valor padrão para ajuste fino
    v_valor_calculado DECIMAL;
BEGIN
    -- Buscar dados da unidade
    SELECT * INTO v_unidade FROM unidades WHERE id = p_unidade_id;
    
    -- Buscar parâmetro ativo
    SELECT * INTO v_parametro FROM parametros_precificacao 
    WHERE empreendimento_id = v_unidade.empreendimento_id AND ativo = true;
    
    -- Verificar se os parâmetros existem
    IF v_parametro IS NULL THEN
        RAISE WARNING 'Não há parâmetro de precificação ativo para o empreendimento da unidade %', p_unidade_id;
        RETURN;
    END IF;
    
    -- Buscar fator de pavimento
    IF v_unidade.pavimento IS NOT NULL THEN
        SELECT fator INTO v_fator_pavimento
        FROM fatores_pavimento
        WHERE parametro_id = v_parametro.id AND pavimento = v_unidade.pavimento;
        
        -- Se não encontrar fator de pavimento, usar valor padrão
        IF v_fator_pavimento IS NULL THEN
            v_fator_pavimento := 1.0;
        END IF;
    END IF;
    
    -- Verificar se a unidade tem ajuste fino
    IF v_unidade.ajuste_fino_percentual IS NOT NULL THEN
        v_fator_ajuste_fino := 1 + (v_unidade.ajuste_fino_percentual / 100);
    END IF;
    
    -- Calcular valor base
    v_valor_base := v_unidade.area_privativa * v_parametro.valor_m2_padrao;
    
    -- Calcular adicionais
    v_valor_adicional := 0;
    IF v_unidade.suites IS NOT NULL THEN
        v_valor_adicional := v_valor_adicional + (v_unidade.suites * v_parametro.valor_adicional_suite);
    END IF;
    
    IF v_unidade.vagas IS NOT NULL THEN
        v_valor_adicional := v_valor_adicional + (v_unidade.vagas * v_parametro.valor_adicional_vaga);
    END IF;
    
    -- Aplicar fator de orientação solar
    v_fator_orientacao := CASE v_unidade.orientacao_solar
                          WHEN 'NORTE' THEN v_parametro.fator_norte
                          WHEN 'SUL' THEN v_parametro.fator_sul
                          WHEN 'LESTE' THEN v_parametro.fator_leste
                          WHEN 'OESTE' THEN v_parametro.fator_oeste
                          ELSE 1 END;
    
    -- Calcular valor final
    v_valor_calculado := (v_valor_base + v_valor_adicional) * v_fator_orientacao * v_fator_pavimento * v_fator_ajuste_fino;
    
    -- Atualizar valor inicial da unidade
    UPDATE unidades 
    SET valor_inicial_unidade = v_valor_calculado,
        updated_at = NOW()
    WHERE id = p_unidade_id;
    
    -- Registrar no log de cálculos para auditoria
    INSERT INTO log_calculos_unidade (
        unidade_id, 
        parametro_id, 
        valor_base, 
        valor_adicional, 
        fator_orientacao, 
        fator_pavimento,
        fator_ajuste_fino,
        valor_calculado
    ) VALUES (
        p_unidade_id, 
        v_parametro.id, 
        v_valor_base, 
        v_valor_adicional, 
        v_fator_orientacao, 
        v_fator_pavimento,
        v_fator_ajuste_fino,
        v_valor_calculado
    );
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular valores de todas as unidades de um empreendimento
CREATE OR REPLACE FUNCTION recalcular_valores_empreendimento(p_empreendimento_id UUID)
RETURNS VOID AS $$
DECLARE
    v_unidade_id UUID;
BEGIN
    -- Para cada unidade do empreendimento
    FOR v_unidade_id IN 
        SELECT id FROM unidades WHERE empreendimento_id = p_empreendimento_id
    LOOP
        -- Recalcular valor da unidade
        PERFORM calcular_valores_unidade(v_unidade_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para aplicar ajuste fino
CREATE OR REPLACE FUNCTION aplicar_ajuste_fino(
    p_unidade_id UUID, 
    p_percentual DECIMAL, 
    p_motivo TEXT,
    p_usuario_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_unidade RECORD;
    v_valor_anterior DECIMAL;
    v_valor_novo DECIMAL;
    v_percentual_anterior DECIMAL;
BEGIN
    -- Buscar dados da unidade
    SELECT * INTO v_unidade FROM unidades WHERE id = p_unidade_id;
    
    -- Registrar valores atuais
    v_valor_anterior := v_unidade.valor_inicial_unidade;
    v_percentual_anterior := v_unidade.ajuste_fino_percentual;
    
    -- Atualizar o ajuste fino
    UPDATE unidades 
    SET ajuste_fino_percentual = p_percentual,
        ajuste_fino_motivo = p_motivo,
        updated_at = NOW()
    WHERE id = p_unidade_id;
    
    -- Recalcular valor da unidade
    PERFORM calcular_valores_unidade(p_unidade_id);
    
    -- Buscar o novo valor calculado
    SELECT valor_inicial_unidade INTO v_valor_novo
    FROM unidades WHERE id = p_unidade_id;
    
    -- Registrar histórico
    INSERT INTO historico_ajustes_unidade (
        unidade_id,
        usuario_id,
        percentual_anterior,
        percentual_novo,
        motivo,
        valor_antes,
        valor_depois
    ) VALUES (
        p_unidade_id,
        p_usuario_id,
        v_percentual_anterior,
        p_percentual,
        p_motivo,
        v_valor_anterior,
        v_valor_novo
    );
END;
$$ LANGUAGE plpgsql;


### 13. Vamos atualizar o arquivo de tipos do Supabase para incluir as novas tabelas:
