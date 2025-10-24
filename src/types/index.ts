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
  cargo: string;
  setor: string;
}

export interface EPIAtribuicao {
  id: string;
  epiId: string;
  funcionarioId: string;
  dataEntrega: string;
  validade: string;
}
