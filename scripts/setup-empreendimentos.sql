-- Verificar se a função calcular_vgv_completo existe e criá-la se não existir
CREATE OR REPLACE FUNCTION calcular_vgv_completo(p_empreendimento_id UUID)
RETURNS TABLE (
    vgv_total NUMERIC,
    vgv_disponivel NUMERIC,
    vgv_reservado NUMERIC,
    vgv_vendido NUMERIC,
    unidades_total BIGINT,
    unidades_disponiveis BIGINT,
    unidades_reservadas BIGINT,
    unidades_vendidas BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(valor_calculado), 0) AS vgv_total,
        COALESCE(SUM(CASE WHEN status = 'disponivel' THEN valor_calculado ELSE 0 END), 0) AS vgv_disponivel,
        COALESCE(SUM(CASE WHEN status = 'reservado' THEN valor_calculado ELSE 0 END), 0) AS vgv_reservado,
        COALESCE(SUM(CASE WHEN status = 'vendido' THEN valor_calculado ELSE 0 END), 0) AS vgv_vendido,
        COUNT(*) AS unidades_total,
        COUNT(CASE WHEN status = 'disponivel' THEN 1 END) AS unidades_disponiveis,
        COUNT(CASE WHEN status = 'reservado' THEN 1 END) AS unidades_reservadas,
        COUNT(CASE WHEN status = 'vendido' THEN 1 END) AS unidades_vendidas
    FROM unidades
    WHERE empreendimento_id = p_empreendimento_id;
END;
$$ LANGUAGE plpgsql;

-- Verificar se a tabela log_atividades existe e criá-la se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'log_atividades') THEN
        CREATE TABLE log_atividades (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            usuario_id UUID NOT NULL,
            modulo VARCHAR(50) NOT NULL,
            acao VARCHAR(50) NOT NULL,
            descricao TEXT,
            entidade_tipo VARCHAR(50),
            entidade_id UUID,
            dados JSONB,
            ip_address VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Verificar se a função registrar_atividade existe e criá-la se não existir
CREATE OR REPLACE FUNCTION registrar_atividade(
    p_usuario_id UUID,
    p_modulo VARCHAR,
    p_acao VARCHAR,
    p_descricao TEXT,
    p_entidade_tipo VARCHAR,
    p_entidade_id UUID DEFAULT NULL,
    p_dados JSONB DEFAULT NULL,
    p_ip_address VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO log_atividades (
        usuario_id,
        modulo,
        acao,
        descricao,
        entidade_tipo,
        entidade_id,
        dados,
        ip_address
    ) VALUES (
        p_usuario_id,
        p_modulo,
        p_acao,
        p_descricao,
        p_entidade_tipo,
        p_entidade_id,
        p_dados,
        p_ip_address
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Não falhar se houver erro ao registrar atividade
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;
