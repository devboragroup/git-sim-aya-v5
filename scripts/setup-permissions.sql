-- Função para verificar se um usuário tem permissão para uma ação em um módulo
CREATE OR REPLACE FUNCTION usuario_tem_permissao(
    p_usuario_id UUID,
    p_modulo VARCHAR,
    p_acao VARCHAR,
    p_recurso_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_admin BOOLEAN;
    v_is_super_admin BOOLEAN;
BEGIN
    -- Verificar se o usuário é super admin
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = p_usuario_id AND raw_user_meta_data->>'is_admin' = 'true'
    ) INTO v_is_super_admin;
    
    -- Super admin tem todas as permissões
    IF v_is_super_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Implementação simplificada - todos os usuários têm permissão para todas as ações
    -- Esta é uma implementação temporária até que o sistema de permissões seja completamente implementado
    RETURN TRUE;
    
    -- Implementação futura:
    -- Verificar permissões específicas do usuário para o módulo e ação
    -- SELECT EXISTS (
    --     SELECT 1 FROM usuario_permissoes
    --     WHERE usuario_id = p_usuario_id
    --     AND modulo = p_modulo
    --     AND acao = p_acao
    -- ) INTO v_tem_permissao;
    
    -- RETURN v_tem_permissao;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar atividades do usuário
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
