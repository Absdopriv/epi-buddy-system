-- Adicionar novos campos ao cadastro central de funcionários
ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS data_nascimento date,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text;

-- Migrar cargo (texto) para cargo_id: auto-criar Cargos faltantes por usuário
DO $$
DECLARE
  r RECORD;
  v_cargo_id uuid;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id, btrim(cargo) AS cargo_nome
    FROM public.funcionarios
    WHERE cargo_id IS NULL AND cargo IS NOT NULL AND btrim(cargo) <> ''
  LOOP
    SELECT id INTO v_cargo_id
    FROM public.cargos
    WHERE user_id = r.user_id AND lower(btrim(nome)) = lower(r.cargo_nome)
    LIMIT 1;

    IF v_cargo_id IS NULL THEN
      INSERT INTO public.cargos (user_id, nome) VALUES (r.user_id, r.cargo_nome)
      RETURNING id INTO v_cargo_id;
    END IF;

    UPDATE public.funcionarios
    SET cargo_id = v_cargo_id
    WHERE user_id = r.user_id
      AND cargo_id IS NULL
      AND lower(btrim(cargo)) = lower(r.cargo_nome);
  END LOOP;
END $$;

-- Trigger para gerar exames admissionais já existe (gerar_exames_admissionais).
-- Garantir que está ativo na tabela funcionarios:
DROP TRIGGER IF EXISTS trg_gerar_exames_admissionais ON public.funcionarios;
CREATE TRIGGER trg_gerar_exames_admissionais
AFTER INSERT ON public.funcionarios
FOR EACH ROW EXECUTE FUNCTION public.gerar_exames_admissionais();