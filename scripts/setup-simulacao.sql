-- Função para simular valores com um parâmetro específico
CREATE OR REPLACE FUNCTION simular_valores_parametro(p_parametro_id UUID)
RETURNS TABLE (
    unidade_id UUID,
    valor_atual DECIMAL(12,2),
    valor_simulado DECIMAL(12,2)
) AS $$
DECLARE
    v_empreendimento_id UUID;
BEGIN
    -- Buscar o empreendimento do parâmetro
    SELECT empreendimento_id INTO v_empreendimento_id
    FROM parametros_precificacao
    WHERE id = p_parametro_id;
    
    -- Verificar se o parâmetro existe
    IF v_empreendimento_id IS NULL THEN
        RAISE EXCEPTION 'Parâmetro não encontrado';
    END IF;
    
    RETURN QUERY
    WITH simulacao AS (
        SELECT 
            u.id AS unidade_id,
            u.area_privativa,
            u.suites,
            u.vagas,
            u.orientacao_solar,
            u.pavimento,
            u.ajuste_fino_percentual,
            p.valor_m2_padrao,
            p.valor_adicional_suite,
            p.valor_adicional_vaga,
            p.fator_norte,
            p.fator_sul,
            p.fator_leste,
            p.fator_oeste,
            COALESCE(fp.fator, 1.0) AS fator_pavimento
        FROM 
            unidades u
        CROSS JOIN 
            parametros_precificacao p
        LEFT JOIN 
            fatores_pavimento fp ON fp.parametro_id = p.id AND fp.pavimento = u.pavimento
        WHERE 
            u.empreendimento_id = v_empreendimento_id
            AND p.id = p_parametro_id
    )
    SELECT 
        s.unidade_id,
        COALESCE(u.valor_calculado, 0) AS valor_atual,
        (
            s.area_privativa * s.valor_m2_padrao + 
            COALESCE(s.suites, 0) * s.valor_adicional_suite +
            COALESCE(s.vagas, 0) * s.valor_adicional_vaga
        ) * 
        CASE 
            WHEN s.orientacao_solar = 'NORTE' THEN s.fator_norte
            WHEN s.orientacao_solar = 'SUL' THEN s.fator_sul
            WHEN s.orientacao_solar = 'LESTE' THEN s.fator_leste
            WHEN s.orientacao_solar = 'OESTE' THEN s.fator_oeste
            ELSE 1
        END *
        s.fator_pavimento *
        COALESCE((1 + s.ajuste_fino_percentual / 100), 1) AS valor_simulado
    FROM 
        simulacao s
    JOIN 
        unidades u ON u.id = s.unidade_id;
END;
$$ LANGUAGE plpgsql;
