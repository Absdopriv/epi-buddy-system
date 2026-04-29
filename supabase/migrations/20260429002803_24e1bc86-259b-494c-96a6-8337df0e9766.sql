
-- =========================
-- CARGOS
-- =========================
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own cargos" ON public.cargos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cargos" ON public.cargos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cargos" ON public.cargos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cargos" ON public.cargos FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_cargos_updated BEFORE UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- RISCOS OCUPACIONAIS
-- =========================
CREATE TABLE public.riscos_ocupacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  descricao TEXT NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'medio',
  tipo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.riscos_ocupacionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own riscos" ON public.riscos_ocupacionais FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own riscos" ON public.riscos_ocupacionais FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own riscos" ON public.riscos_ocupacionais FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own riscos" ON public.riscos_ocupacionais FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_riscos_updated BEFORE UPDATE ON public.riscos_ocupacionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cargo <-> Riscos
CREATE TABLE public.cargo_riscos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  risco_id UUID NOT NULL REFERENCES public.riscos_ocupacionais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cargo_id, risco_id)
);
ALTER TABLE public.cargo_riscos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own cargo_riscos" ON public.cargo_riscos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cargo_riscos" ON public.cargo_riscos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cargo_riscos" ON public.cargo_riscos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cargo_riscos" ON public.cargo_riscos FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- EXAMES OCUPACIONAIS (catálogo)
-- =========================
CREATE TABLE public.exames_ocupacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Clínico',
  periodicidade_meses INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exames_ocupacionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own exames_ocup" ON public.exames_ocupacionais FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own exames_ocup" ON public.exames_ocupacionais FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own exames_ocup" ON public.exames_ocupacionais FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own exames_ocup" ON public.exames_ocupacionais FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_exames_ocup_updated BEFORE UPDATE ON public.exames_ocupacionais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Risco <-> Exame
CREATE TABLE public.risco_exames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  risco_id UUID NOT NULL REFERENCES public.riscos_ocupacionais(id) ON DELETE CASCADE,
  exame_id UUID NOT NULL REFERENCES public.exames_ocupacionais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (risco_id, exame_id)
);
ALTER TABLE public.risco_exames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own risco_exames" ON public.risco_exames FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own risco_exames" ON public.risco_exames FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own risco_exames" ON public.risco_exames FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own risco_exames" ON public.risco_exames FOR DELETE USING (auth.uid() = user_id);

-- =========================
-- FUNCIONARIOS - novos campos
-- =========================
ALTER TABLE public.funcionarios
  ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES public.cargos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_admissao DATE;

-- =========================
-- EXAMES FUNCIONARIO
-- =========================
CREATE TABLE public.exames_funcionario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  exame_id UUID NOT NULL REFERENCES public.exames_ocupacionais(id) ON DELETE RESTRICT,
  tipo_exame TEXT NOT NULL DEFAULT 'Admissional',
  data_realizacao DATE,
  data_vencimento DATE,
  resultado TEXT,
  situacao TEXT NOT NULL DEFAULT 'PENDENTE',
  medico_responsavel TEXT,
  crm_medico TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exames_funcionario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own exames_func" ON public.exames_funcionario FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own exames_func" ON public.exames_funcionario FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own exames_func" ON public.exames_funcionario FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own exames_func" ON public.exames_funcionario FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_exames_func_updated BEFORE UPDATE ON public.exames_funcionario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_exames_func_funcionario ON public.exames_funcionario(funcionario_id);
CREATE INDEX idx_exames_func_situacao ON public.exames_funcionario(situacao);
CREATE INDEX idx_exames_func_vencimento ON public.exames_funcionario(data_vencimento);

-- =========================
-- ASOs
-- =========================
CREATE TABLE public.asos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  tipo_exame TEXT NOT NULL DEFAULT 'Admissional',
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  aptidao TEXT NOT NULL DEFAULT 'APTO',
  restricoes TEXT,
  proximo_aso DATE,
  medico_responsavel TEXT,
  crm_medico TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.asos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own asos" ON public.asos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own asos" ON public.asos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own asos" ON public.asos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own asos" ON public.asos FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_asos_updated BEFORE UPDATE ON public.asos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- ALERTAS
-- =========================
CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  exame_funcionario_id UUID REFERENCES public.exames_funcionario(id) ON DELETE CASCADE,
  exame_ocupacional_id UUID REFERENCES public.exames_ocupacionais(id) ON DELETE SET NULL,
  data_vencimento DATE,
  dias_para_vencer INTEGER,
  nivel TEXT NOT NULL DEFAULT 'INFO',
  mensagem TEXT,
  resolvido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own alertas" ON public.alertas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alertas" ON public.alertas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own alertas" ON public.alertas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alertas" ON public.alertas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_alertas_updated BEFORE UPDATE ON public.alertas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- AUDITORIA
-- =========================
CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tabela TEXT NOT NULL,
  registro_id UUID,
  acao TEXT NOT NULL,
  dados_antes JSONB,
  dados_depois JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own auditoria" ON public.auditoria FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own auditoria" ON public.auditoria FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_auditoria_tabela ON public.auditoria(tabela);
CREATE INDEX idx_auditoria_registro ON public.auditoria(registro_id);

-- =========================
-- TRIGGER: gerar exames admissionais automaticamente
-- =========================
CREATE OR REPLACE FUNCTION public.gerar_exames_admissionais()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.cargo_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.exames_funcionario (user_id, funcionario_id, exame_id, tipo_exame, situacao)
  SELECT DISTINCT NEW.user_id, NEW.id, re.exame_id, 'Admissional', 'PENDENTE'
  FROM public.cargo_riscos cr
  JOIN public.risco_exames re ON re.risco_id = cr.risco_id
  WHERE cr.cargo_id = NEW.cargo_id
    AND cr.user_id = NEW.user_id;

  INSERT INTO public.auditoria (user_id, tabela, registro_id, acao, dados_depois)
  VALUES (NEW.user_id, 'funcionarios', NEW.id, 'CREATE',
    jsonb_build_object('nome', NEW.nome, 'cargo_id', NEW.cargo_id));

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gerar_exames_admissionais
AFTER INSERT ON public.funcionarios
FOR EACH ROW EXECUTE FUNCTION public.gerar_exames_admissionais();
