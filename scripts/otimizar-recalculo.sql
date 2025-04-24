-- Otimizar a função de recálculo para lidar com muitas unidades
CREATE OR REPLACE FUNCTION recalcular_valores_empreendimento(p_empreendimento_id UUID)
RETURNS TABLE (
  unidades_processadas INTEGER,
  tempo_execucao_ms INTEGER
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_unidades_processadas INTEGER := 0;
  v_unidade_id UUID;
BEGIN
  -- Registrar tempo de início
  v_start_time := clock_timestamp();
  
  -- Para cada unidade do empreendimento
  FOR v_unidade_id IN 
    SELECT id FROM unidades WHERE empreendimento_id = p_empreendimento_id
  LOOP
    -- Recalcular valor da unidade
    PERFORM calcular_valores_unidade(v_unidade_id);
    v_unidades_processadas := v_unidades_processadas + 1;
  END LOOP;
  
  -- Retornar estatísticas de processamento
  RETURN QUERY
  SELECT 
    v_unidades_processadas AS unidades_processadas,
    EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INTEGER AS tempo_execucao_ms;
END;
$$ LANGUAGE plpgsql;
