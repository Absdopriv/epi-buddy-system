const BASE_URL = "http://localhost:3000";

// ---- Backend shapes ----
export interface BkCargo {
  id: number;
  nome: string;
  codigoCBO: string;
  descricaoAtividades: string;
  id_setor: number | null;
}
export interface BkRisco {
  id: number;
  descricao: string;
  tipo: string;
  nivel: string;
  id_cargo: number | null;
}
export interface BkExameOcupacional {
  id: number;
  nome: string;
  tipo: string;
  periodicidadeMeses: number;
  id_risco_ocupacional: number | null;
  dataemissao: string;
}
export interface BkFuncionario {
  id: number;
  matricula: string;
  nome: string;
  dataAdmissao: string;
  status: string;
  id_cargo: number | null;
  id_setor: number | null;
}
export interface BkExameFuncionario {
  id: number;
  dataRealizacao: string;
  dataVencimento: string;
  resultado: string;
  situacao: string;
  medicoResponsavel: string;
  crmMedico: string;
  observacoes: string;
  id_funcionario: number;
  id_exame_ocupacional: number;
  tipo_exame: string;
}
export interface BkAlerta {
  id: number;
  dataVencimento: string;
  diasParaVencer: number;
  nivel: string;
  resolvido: number | boolean;
  id_funcionario: number | null;
  id_exame_ocupacional: number | null;
  mensagem?: string | null;
}
export interface BkEmpresa {
  id: number;
  razaoSocial: string;
  cnpj: string;
  cnae: string;
  totalFuncionarios: number;
}
export interface BkASO {
  id: number;
  dataEmissao: string;
  tipoExame: string;
  aptidao: string;
  restricao: string;
  proximoASO: string;
  medicoResponsavel: string;
  crmMedico: string;
  id_funcionario: number;
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any).erro || `HTTP ${res.status}`);
  return body as T;
}

// Empresas
export const listarEmpresas = () => req<BkEmpresa[]>("/empresas");

// Cargos
export const listarCargos = () => req<BkCargo[]>("/cargos");
export const criarCargo = (data: { nome: string; descricao?: string | null }) =>
  req<BkCargo>("/cargos", {
    method: "POST",
    body: JSON.stringify({ nome: data.nome, descricao: data.descricao || "" }),
  });
export const deletarCargo = (id: number) => req<void>(`/cargos/${id}`, { method: "DELETE" });

// Riscos Ocupacionais
export const listarRiscos = () => req<BkRisco[]>("/riscosOcupacionais");
export const criarRisco = (data: { descricao: string; nivel: string; tipo?: string | null; id_cargo?: number | null }) =>
  req<BkRisco>("/riscosOcupacionais", {
    method: "POST",
    body: JSON.stringify({
      descricao: data.descricao,
      nivel: data.nivel,
      tipo: data.tipo || "Geral",
      id_cargo: data.id_cargo ?? null,
    }),
  });
export const atualizarRisco = (id: number, data: Partial<BkRisco>) =>
  req<void>(`/riscosOcupacionais/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletarRisco = (id: number) => req<void>(`/riscosOcupacionais/${id}`, { method: "DELETE" });

// Exames Ocupacionais
export const listarExamesOcupacionais = () => req<BkExameOcupacional[]>("/examesOcupacionais");
export const criarExameOcupacional = (data: {
  nome: string;
  tipo: string;
  periodicidade_meses: number;
  id_risco?: number | null;
}) =>
  req<BkExameOcupacional>("/examesOcupacionais", {
    method: "POST",
    body: JSON.stringify({
      nome: data.nome,
      tipo: data.tipo,
      periodicidadeMeses: data.periodicidade_meses,
      id_risco_ocupacional: data.id_risco ?? null,
      dataemissao: new Date().toISOString().split("T")[0],
    }),
  });
export const atualizarExameOcupacional = (id: number, data: Partial<BkExameOcupacional>) =>
  req<void>(`/examesOcupacionais/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletarExameOcupacional = (id: number) => req<void>(`/examesOcupacionais/${id}`, { method: "DELETE" });

// Funcionários (somente leitura — gestão no módulo próprio)
export const listarFuncionarios = () => req<BkFuncionario[]>("/funcionarios");

// Exames Funcionário
export const listarExamesFuncionario = () => req<BkExameFuncionario[]>("/examesFuncionarios");
export const criarExameFuncionario = (data: {
  id_funcionario: number;
  id_exame_ocupacional: number;
  tipo_exame?: string;
  situacao?: string;
}) =>
  req<BkExameFuncionario>("/examesFuncionarios", {
    method: "POST",
    body: JSON.stringify({
      dataRealizacao: "",
      dataVencimento: "",
      resultado: "",
      situacao: data.situacao || "PENDENTE",
      medicoResponsavel: "",
      crmMedico: "",
      observacoes: "",
      id_funcionario: data.id_funcionario,
      id_exame_ocupacional: data.id_exame_ocupacional,
      tipo_exame: data.tipo_exame || "Admissional",
    }),
  });
export const atualizarExameFuncionario = (
  id: number,
  data: {
    dataRealizacao?: string;
    dataVencimento?: string;
    resultado?: string;
    situacao?: string;
    medicoResponsavel?: string;
    crmMedico?: string;
    observacoes?: string;
    id_funcionario?: number;
    id_exame_ocupacional?: number;
    tipo_exame?: string;
  }
) => req<void>(`/examesFuncionarios/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletarExameFuncionario = (id: number) => req<void>(`/examesFuncionarios/${id}`, { method: "DELETE" });

// Alertas
export const listarAlertas = () => req<BkAlerta[]>("/alertas");
export const criarAlerta = (data: {
  dataVencimento?: string;
  diasParaVencer: number;
  nivel: string;
  id_funcionario: number;
  id_exame_ocupacional: number;
  mensagem?: string | null;
}) =>
  req<BkAlerta>("/alertas", {
    method: "POST",
    body: JSON.stringify({
      dataVencimento: data.dataVencimento || new Date().toISOString().split("T")[0],
      diasParaVencer: data.diasParaVencer,
      nivel: data.nivel,
      resolvido: false,
      id_funcionario: data.id_funcionario,
      id_exame_ocupacional: data.id_exame_ocupacional,
      mensagem: data.mensagem ?? null,
    }),
  });
export const resolverAlerta = (id: number) => req<void>(`/alertas/${id}/resolver`, { method: "PATCH" });

// ASO
export const criarASO = (data: {
  dataEmissao: string;
  tipoExame: string;
  aptidao: string;
  restricao: string;
  proximoASO: string;
  medicoResponsavel: string;
  crmMedico: string;
  id_funcionario: number;
}) =>
  req<BkASO>("/asos", {
    method: "POST",
    body: JSON.stringify({ ...data, data_criacao: new Date().toISOString() }),
  });
