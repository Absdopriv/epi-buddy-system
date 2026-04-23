ALTER TABLE public.formularios_seguranca
ADD COLUMN IF NOT EXISTS assinatura_responsavel_equipe text,
ADD COLUMN IF NOT EXISTS assinatura_responsavel_site text,
ADD COLUMN IF NOT EXISTS assinatura_tecnico_seguranca text;