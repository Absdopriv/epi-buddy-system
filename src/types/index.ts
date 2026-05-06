export interface EPI {
  id: string;
  nome: string;
  validade: string;
  ca: string;
  tipo: string;
  uso: string;
  fabricante: string;
  entrega: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  cargo: string; // nome do cargo (denormalizado para exibição)
  cargo_id?: string | null;
  setor: string;
  data_nascimento?: string | null;
  data_admissao?: string | null;
  rg?: string | null;
  telefone?: string | null;
  email?: string | null;
}

export interface EPIAtribuicao {
  id: string;
  epiId: string;
  funcionarioId: string;
  dataEntrega: string;
  validade: string;
}
