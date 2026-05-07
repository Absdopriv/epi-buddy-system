// Camada centralizada de API REST para o backend Express + SQLite (PCMSO).
// Mantém Supabase para auth, EPI, admin, suporte. Apenas o módulo de PCMSO /
// Cadastro de Funcionários consome este client.

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
      else if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

// =========================================================================
// DTOs (refletem o backend Express + SQLite)
// =========================================================================

export type ID = number | string;

export interface Empresa {
  id: ID;
  razaoSocial: string;
  cnpj: string;
  cnae?: string | null;
  totalFuncionarios?: number | null;
  data_criacao?: string | null;
  data_atualizacao?: string | null;
}

export interface Setor {
  id: ID;
  nome: string;
  descricao?: string | null;
  data_criacao?: string | null;
  id_empresa?: ID | null;
}

export interface Cargo {
  id: ID;
  nome: string;
  codigoCBO?: string | null;
  descricaoAtividades?: string | null;
  id_setor?: ID | null;
}

export type FuncionarioStatus = "ATIVO" | "INATIVO" | "AFASTADO";

export interface Funcionario {
  id: ID;
  matricula: string;
  nome: string;
  cpf?: string | null;
  rg?: string | null;
  dataNascimento?: string | null;
  dataAdmissao?: string | null;
  telefone?: string | null;
  email?: string | null;
  status: FuncionarioStatus;
  id_cargo?: ID | null;
  id_setor?: ID | null;
}

export type RiscoTipo = "FISICO" | "QUIMICO" | "BIOLOGICO" | "ERGONOMICO" | "ACIDENTE" | string;
export type RiscoNivel = "LEVE" | "MEDIO" | "GRAVE" | string;

export interface RiscoOcupacional {
  id: ID;
  descricao: string;
  tipo: RiscoTipo;
  nivel: RiscoNivel;
  id_cargo: ID;
}

export interface ExameOcupacional {
  id: ID;
  nome: string;
  tipo: string;
  periodicidadeMeses: number;
  id_risco_ocupacional: ID;
  dataemissao?: string | null;
}

export type ExameSituacao = "PENDENTE" | "CONCLUIDO" | "VENCIDO";

export interface ExameFuncionario {
  id: ID;
  dataRealizacao?: string | null;
  dataVencimento?: string | null;
  resultado?: string | null;
  situacao: ExameSituacao;
  medicoResponsavel?: string | null;
  crmMedico?: string | null;
  observacoes?: string | null;
  id_funcionario: ID;
  id_exame_ocupacional: ID;
}

export interface ASO {
  id: ID;
  dataEmissao: string;
  tipoExame: string;
  aptidao: "APTO" | "INAPTO" | "APTO COM RESTRIÇÕES" | string;
  restricao?: string | null;
  proximoASO?: string | null;
  medicoResponsavel?: string | null;
  crmMedico?: string | null;
  data_criacao?: string | null;
  id_funcionario: ID;
}

export interface Alerta {
  id: ID;
  dataVencimento?: string | null;
  diasParaVencer?: number | null;
  nivel: "WARN" | "CRITICO" | string;
  mensagem?: string | null;
  resolvido: 0 | 1;
  id_funcionario?: ID | null;
  id_exame_ocupacional?: ID | null;
  data_criacao?: string | null;
}

// =========================================================================
// Endpoints específicos por entidade
// =========================================================================

export const empresas = {
  list: () => api.get<Empresa[]>("/empresas"),
  get: (id: ID) => api.get<Empresa>(`/empresas/${id}`),
  create: (data: Partial<Empresa>) => api.post<Empresa>("/empresas", data),
  update: (id: ID, data: Partial<Empresa>) => api.put<Empresa>(`/empresas/${id}`, data),
  remove: (id: ID) => api.del<void>(`/empresas/${id}`),
};

export const setores = {
  list: () => api.get<Setor[]>("/setores"),
  get: (id: ID) => api.get<Setor>(`/setores/${id}`),
  create: (data: Partial<Setor>) => api.post<Setor>("/setores", data),
  update: (id: ID, data: Partial<Setor>) => api.put<Setor>(`/setores/${id}`, data),
  remove: (id: ID) => api.del<void>(`/setores/${id}`),
};

export const cargos = {
  list: () => api.get<Cargo[]>("/cargos"),
  get: (id: ID) => api.get<Cargo>(`/cargos/${id}`),
  create: (data: Partial<Cargo>) => api.post<Cargo>("/cargos", data),
  update: (id: ID, data: Partial<Cargo>) => api.put<Cargo>(`/cargos/${id}`, data),
  remove: (id: ID) => api.del<void>(`/cargos/${id}`),
};

export const funcionarios = {
  list: () => api.get<Funcionario[]>("/funcionarios"),
  get: (id: ID) => api.get<Funcionario>(`/funcionarios/${id}`),
  create: (data: Partial<Funcionario>) => api.post<Funcionario>("/funcionarios", data),
  update: (id: ID, data: Partial<Funcionario>) => api.put<Funcionario>(`/funcionarios/${id}`, data),
  remove: (id: ID) => api.del<void>(`/funcionarios/${id}`),
};

export const riscosOcupacionais = {
  list: () => api.get<RiscoOcupacional[]>("/riscosOcupacionais"),
  get: (id: ID) => api.get<RiscoOcupacional>(`/riscosOcupacionais/${id}`),
  create: (data: Partial<RiscoOcupacional>) => api.post<RiscoOcupacional>("/riscosOcupacionais", data),
  update: (id: ID, data: Partial<RiscoOcupacional>) => api.put<RiscoOcupacional>(`/riscosOcupacionais/${id}`, data),
  remove: (id: ID) => api.del<void>(`/riscosOcupacionais/${id}`),
};

export const examesOcupacionais = {
  list: () => api.get<ExameOcupacional[]>("/examesOcupacionais"),
  get: (id: ID) => api.get<ExameOcupacional>(`/examesOcupacionais/${id}`),
  create: (data: Partial<ExameOcupacional>) => api.post<ExameOcupacional>("/examesOcupacionais", data),
  update: (id: ID, data: Partial<ExameOcupacional>) => api.put<ExameOcupacional>(`/examesOcupacionais/${id}`, data),
  remove: (id: ID) => api.del<void>(`/examesOcupacionais/${id}`),
};

export const examesFuncionarios = {
  list: () => api.get<ExameFuncionario[]>("/examesFuncionarios"),
  get: (id: ID) => api.get<ExameFuncionario>(`/examesFuncionarios/${id}`),
  vencidos: () => api.get<ExameFuncionario[]>("/examesFuncionarios/vencidos"),
  proximosVencimento: (dias = 30) =>
    api.get<ExameFuncionario[]>(`/examesFuncionarios/proximosvencimento?dias=${dias}`),
  create: (data: Partial<ExameFuncionario>) => api.post<ExameFuncionario>("/examesFuncionarios", data),
  createPeriodicidade: (data: Partial<ExameFuncionario>) =>
    api.post<ExameFuncionario>("/examesFuncionarios/periodicidade", data),
  update: (id: ID, data: Partial<ExameFuncionario>) =>
    api.put<ExameFuncionario>(`/examesFuncionarios/${id}`, data),
  remove: (id: ID) => api.del<void>(`/examesFuncionarios/${id}`),
};

export const asos = {
  list: () => api.get<ASO[]>("/asos"),
  get: (id: ID) => api.get<ASO>(`/asos/${id}`),
  create: (data: Partial<ASO>) => api.post<ASO>("/asos", data),
  update: (id: ID, data: Partial<ASO>) => api.put<ASO>(`/asos/${id}`, data),
};

export const alertas = {
  list: () => api.get<Alerta[]>("/alertas"),
  get: (id: ID) => api.get<Alerta>(`/alertas/${id}`),
  create: (data: Partial<Alerta>) => api.post<Alerta>("/alertas", data),
  update: (id: ID, data: Partial<Alerta>) => api.put<Alerta>(`/alertas/${id}`, data),
  resolver: (id: ID) => api.patch<Alerta>(`/alertas/${id}/resolver`, { resolvido: 1 }),
};
