CREATE TABLE public.formularios_seguranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  setor TEXT NOT NULL,
  empresa TEXT NOT NULL,
  email TEXT NOT NULL,
  ptp TEXT NOT NULL,
  local TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  atividades TEXT[] NOT NULL DEFAULT '{}',
  outras_atividades TEXT,
  riscos TEXT[] NOT NULL DEFAULT '{}',
  epis_sugeridos TEXT[] NOT NULL DEFAULT '{}',
  medidas_controle TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.formularios_seguranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own formularios"
  ON public.formularios_seguranca FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own formularios"
  ON public.formularios_seguranca FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own formularios"
  ON public.formularios_seguranca FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own formularios"
  ON public.formularios_seguranca FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_formularios_seguranca_updated_at
  BEFORE UPDATE ON public.formularios_seguranca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();