
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  razao_social TEXT,
  ramo_atividade TEXT,
  data_fundacao DATE,
  cnpj TEXT,
  telefone TEXT,
  endereco TEXT,
  responsavel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funcionarios table
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  cargo TEXT NOT NULL,
  setor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own funcionarios" ON public.funcionarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own funcionarios" ON public.funcionarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own funcionarios" ON public.funcionarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own funcionarios" ON public.funcionarios FOR DELETE USING (auth.uid() = user_id);

-- EPIs table
CREATE TABLE public.epis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  ca TEXT NOT NULL,
  validade DATE NOT NULL,
  tipo TEXT NOT NULL,
  uso TEXT NOT NULL DEFAULT '',
  fabricante TEXT NOT NULL DEFAULT '',
  entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.epis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own epis" ON public.epis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own epis" ON public.epis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own epis" ON public.epis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own epis" ON public.epis FOR DELETE USING (auth.uid() = user_id);

-- EPI Atribuicoes table
CREATE TABLE public.epi_atribuicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  epi_id UUID NOT NULL REFERENCES public.epis(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  data_entrega DATE NOT NULL DEFAULT CURRENT_DATE,
  validade DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.epi_atribuicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own atribuicoes" ON public.epi_atribuicoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own atribuicoes" ON public.epi_atribuicoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own atribuicoes" ON public.epi_atribuicoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own atribuicoes" ON public.epi_atribuicoes FOR DELETE USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_epis_updated_at BEFORE UPDATE ON public.epis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
