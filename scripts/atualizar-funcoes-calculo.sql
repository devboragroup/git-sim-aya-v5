-- Atualizar a função calcular_valores_unidade para incluir valorização por pavimento
CREATE OR REPLACE FUNCTION calcular_valores_unidade(p_unidade_id UUID)
RETURNS VOID AS $$
DECLARE
  v_unidade RECORD;
  v_parametro RECORD;
  v_valor_base DECIMAL;
  v_valor_adicional DECIMAL;
  v_percentual_orientacao DECIMAL := 0; -- Percentual de ajuste pela orientação solar
  v_percentual_pavimento DECIMAL := 0;  -- Percentual de ajuste pelo pavimento
  v_fator_ajuste_fino DECIMAL := 0;     -- Percentual de ajuste fino
  v_valor_calculado DECIMAL;
  v_valor_m2 DECIMAL;
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
  
  -- Determinar o valor do m² com base no tipo da unidade
  CASE v_unidade.tipo_unidade
      WHEN 'studio' THEN v_valor_m2 := v_parametro.valor_m2_studio;
      WHEN 'apartamento' THEN v_valor_m2 := v_parametro.valor_m2_apartamento;
      WHEN 'comercial' THEN v_valor_m2 := v_parametro.valor_m2_comercial;
      WHEN 'garden' THEN v_valor_m2 := v_parametro.valor_m2_garden;
      ELSE v_valor_m2 := COALESCE(v_parametro.valor_m2_apartamento, 0);
  END CASE;
  
  -- Se não houver valor específico para o tipo, usar o valor de apartamento como padrão
  IF v_valor_m2 IS NULL OR v_valor_m2 = 0 THEN
      v_valor_m2 := v_parametro.valor_m2_apartamento;
  END IF;
  
  -- Calcular valor base
  v_valor_base := v_unidade.area_privativa * v_valor_m2;
  
  -- Calcular adicionais
  v_valor_adicional := 0;
  
  -- Adicional por suítes
  IF v_unidade.suites IS NOT NULL THEN
      v_valor_adicional := v_valor_adicional + (v_unidade.suites * v_parametro.valor_adicional_suite);
  END IF;
  
  -- Adicional por vagas (diferentes tipos)
  IF v_unidade.vagas_simples IS NOT NULL THEN
      v_valor_adicional := v_valor_adicional + (v_unidade.vagas_simples * v_parametro.valor_adicional_vaga_simples);
  END IF;
  
  IF v_unidade.vagas_duplas IS NOT NULL THEN
      v_valor_adicional := v_valor_adicional + (v_unidade.vagas_duplas * v_parametro.valor_adicional_vaga_dupla);
  END IF;
  
  IF v_unidade.vagas_moto IS NOT NULL THEN
      v_valor_adicional := v_valor_adicional + (v_unidade.vagas_moto * v_parametro.valor_adicional_vaga_moto);
  END IF;
  
  -- Adicional por hobby box
  IF v_unidade.hobby_box IS NOT NULL THEN
      v_valor_adicional := v_valor_adicional + (v_unidade.hobby_box * v_parametro.valor_adicional_hobby_box);
  END IF;
  
  -- Para compatibilidade com o campo vagas antigo
  IF v_unidade.vagas IS NOT NULL AND (v_unidade.vagas_simples IS NULL OR v_unidade.vagas_simples = 0) THEN
      v_valor_adicional := v_valor_adicional + (v_unidade.vagas * v_parametro.valor_adicional_vaga_simples);
  END IF;
  
  -- Calcular subtotal antes de aplicar os fatores
  v_valor_calculado := v_valor_base + v_valor_adicional;
  
  -- Determinar percentual de ajuste pela orientação solar
  CASE v_unidade.orientacao_solar
      WHEN 'NORTE' THEN v_percentual_orientacao := (v_parametro.fator_norte - 1) * 100;
      WHEN 'SUL' THEN v_percentual_orientacao := (v_parametro.fator_sul - 1) * 100;
      WHEN 'LESTE' THEN v_percentual_orientacao := (v_parametro.fator_leste - 1) * 100;
      WHEN 'OESTE' THEN v_percentual_orientacao := (v_parametro.fator_oeste - 1) * 100;
      WHEN 'NORDESTE' THEN v_percentual_orientacao := (v_parametro.fator_nordeste - 1) * 100;
      WHEN 'NOROESTE' THEN v_percentual_orientacao := (v_parametro.fator_noroeste - 1) * 100;
      WHEN 'SUDESTE' THEN v_percentual_orientacao := (v_parametro.fator_sudeste - 1) * 100;
      WHEN 'SUDOESTE' THEN v_percentual_orientacao := (v_parametro.fator_sudoeste - 1) * 100;
      ELSE v_percentual_orientacao := 0;
  END CASE;
  
  -- Buscar percentual de ajuste pelo pavimento
  IF v_unidade.pavimento IS NOT NULL THEN
      SELECT percentual INTO v_percentual_pavimento
      FROM valorizacao_pavimentos
      WHERE parametro_id = v_parametro.id AND pavimento = v_unidade.pavimento;
      
      -- Se não encontrar percentual específico, usar 0%
      IF v_percentual_pavimento IS NULL THEN
          v_percentual_pavimento := 0;
      END IF;
  END IF;
  
  -- Verificar se a unidade tem ajuste fino
  IF v_unidade.ajuste_fino_percentual IS NOT NULL THEN
      v_fator_ajuste_fino := v_unidade.ajuste_fino_percentual;
  END IF;
  
  -- Aplicar os percentuais de ajuste ao valor calculado
  -- Aplicar percentual de orientação solar
  v_valor_calculado := v_valor_calculado * (1 + v_percentual_orientacao / 100);
  
  -- Aplicar percentual de pavimento
  v_valor_calculado := v_valor_calculado * (1 + v_percentual_pavimento / 100);
  
  -- Aplicar percentual de ajuste fino
  v_valor_calculado := v_valor_calculado * (1 + v_fator_ajuste_fino / 100);
  
  -- Atualizar valor calculado da unidade
  UPDATE unidades 
  SET valor_calculado = v_valor_calculado,
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
      1 + (v_percentual_orientacao / 100), 
      1 + (v_percentual_pavimento / 100),
      1 + (v_fator_ajuste_fino / 100),
      v_valor_calculado
  );
END;
$$ LANGUAGE plpgsql;

-- Atualizar a função simular_valores_parametro para incluir valorização por pavimento
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
          u.tipo_unidade,
          u.suites,
          u.vagas,
          u.vagas_simples,
          u.vagas_duplas,
          u.vagas_moto,
          u.hobby_box,
          u.orientacao_solar,
          u.pavimento,
          u.ajuste_fino_percentual,
          p.valor_m2_studio,
          p.valor_m2_apartamento,
          p.valor_m2_comercial,
          p.valor_m2_garden,
          p.valor_adicional_suite,
          p.valor_adicional_vaga_simples,
          p.valor_adicional_vaga_dupla,
          p.valor_adicional_vaga_moto,
          p.valor_adicional_hobby_box,
          p.fator_norte,
          p.fator_sul,
          p.fator_leste,
          p.fator_oeste,
          p.fator_nordeste,
          p.fator_noroeste,
          p.fator_sudeste,
          p.fator_sudoeste,
          COALESCE(vp.percentual, 0) AS percentual_pavimento
      FROM 
          unidades u
      CROSS JOIN 
          parametros_precificacao p
      LEFT JOIN 
          valorizacao_pavimentos vp ON vp.parametro_id = p.id AND vp.pavimento = u.pavimento
      WHERE 
          u.empreendimento_id = v_empreendimento_id
          AND p.id = p_parametro_id
  ),
  calculo AS (
      SELECT 
          s.unidade_id,
          CASE 
              WHEN s.tipo_unidade = 'studio' THEN COALESCE(s.valor_m2_studio, s.valor_m2_apartamento)
              WHEN s.tipo_unidade = 'apartamento' THEN COALESCE(s.valor_m2_apartamento, s.valor_m2_apartamento)
              WHEN s.tipo_unidade = 'comercial' THEN COALESCE(s.valor_m2_comercial, s.valor_m2_apartamento)
              WHEN s.tipo_unidade = 'garden' THEN COALESCE(s.valor_m2_garden, s.valor_m2_apartamento)
              ELSE s.valor_m2_apartamento
          END * s.area_privativa AS valor_base,
          
          COALESCE(s.suites, 0) * s.valor_adicional_suite +
          COALESCE(s.vagas_simples, 0) * s.valor_adicional_vaga_simples +
          COALESCE(s.vagas_duplas, 0) * s.valor_adicional_vaga_dupla +
          COALESCE(s.vagas_moto, 0) * s.valor_adicional_vaga_moto +
          COALESCE(s.hobby_box, 0) * s.valor_adicional_hobby_box +
          -- Para compatibilidade com o campo vagas antigo
          CASE WHEN COALESCE(s.vagas_simples, 0) = 0 THEN COALESCE(s.vagas, 0) * s.valor_adicional_vaga_simples ELSE 0 END
          AS valor_adicional,
          
          CASE 
              WHEN s.orientacao_solar = 'NORTE' THEN s.fator_norte - 1
              WHEN s.orientacao_solar = 'SUL' THEN s.fator_sul - 1
              WHEN s.orientacao_solar = 'LESTE' THEN s.fator_leste - 1
              WHEN s.orientacao_solar = 'OESTE' THEN s.fator_oeste - 1
              WHEN s.orientacao_solar = 'NORDESTE' THEN s.fator_nordeste - 1
              WHEN s.orientacao_solar = 'NOROESTE' THEN s.fator_noroeste - 1
              WHEN s.orientacao_solar = 'SUDESTE' THEN s.fator_sudeste - 1
              WHEN s.orientacao_solar = 'SUDOESTE' THEN s.fator_sudoeste - 1
              ELSE 0
          END * 100 AS percentual_orientacao,
          
          s.percentual_pavimento,
          
          COALESCE(s.ajuste_fino_percentual, 0) AS percentual_ajuste_fino
      FROM 
          simulacao s
  )
  SELECT 
      c.unidade_id,
      COALESCE(u.valor_calculado, 0) AS valor_atual,
      (c.valor_base + c.valor_adicional) * 
      (1 + c.percentual_orientacao / 100) * 
      (1 + c.percentual_pavimento / 100) * 
      (1 + c.percentual_ajuste_fino / 100) AS valor_simulado
  FROM 
      calculo c
  JOIN 
      unidades u ON u.id = c.unidade_id;
END;
$$ LANGUAGE plpgsql;

-- Atualizar a função recalcular_valores_empreendimento para usar a nova lógica
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
