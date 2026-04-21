// Mapeamento estático: Atividade → Riscos → EPIs sugeridos (tipo) + medidas

export const ATIVIDADES = [
  "Trabalho em Altura",
  "Espaço Confinado",
  "Içamento de carga",
  "Equipamentos móveis",
  "Energia Perigosa",
] as const;

export type Atividade = typeof ATIVIDADES[number];

interface RiscoInfo {
  riscos: string[];
  epiTipos: string[]; // tipos/palavras-chave para cruzar com EPIs cadastrados
  medidas: string[];
}

export const ATIVIDADE_MAP: Record<Atividade, RiscoInfo> = {
  "Trabalho em Altura": {
    riscos: ["Queda de altura", "Queda de objetos", "Choque elétrico em redes próximas"],
    epiTipos: ["Capacete", "Cinto de segurança", "Talabarte", "Trava-quedas", "Calçado de segurança"],
    medidas: [
      "Análise Preliminar de Risco (APR)",
      "Permissão de Trabalho (PT)",
      "Linha de vida e ancoragem certificada",
      "Treinamento NR-35",
    ],
  },
  "Espaço Confinado": {
    riscos: ["Atmosfera IPVS", "Asfixia", "Incêndio/Explosão", "Soterramento"],
    epiTipos: ["Detector de gases", "Máscara autônoma", "Cinto", "Capacete", "Tripé de resgate"],
    medidas: [
      "Permissão de Entrada e Trabalho (PET)",
      "Monitoramento contínuo de gases",
      "Vigia permanente",
      "Treinamento NR-33",
    ],
  },
  "Içamento de carga": {
    riscos: ["Queda da carga", "Tombamento do equipamento", "Esmagamento"],
    epiTipos: ["Capacete", "Calçado de segurança", "Luva", "Colete refletivo"],
    medidas: [
      "Plano de rigging (içamento)",
      "Isolamento da área",
      "Inspeção de cabos e acessórios",
      "Operador qualificado NR-11",
    ],
  },
  "Equipamentos móveis": {
    riscos: ["Atropelamento", "Colisão", "Capotamento"],
    epiTipos: ["Capacete", "Calçado de segurança", "Colete refletivo", "Protetor auricular"],
    medidas: [
      "Sinalização e segregação de vias",
      "Check-list pré-operacional",
      "Velocidade controlada",
      "Habilitação do operador",
    ],
  },
  "Energia Perigosa": {
    riscos: ["Choque elétrico", "Arco elétrico", "Liberação súbita de energia"],
    epiTipos: ["Capacete classe B", "Luva isolante", "Calçado de segurança", "Vestimenta antichama", "Protetor facial"],
    medidas: [
      "Bloqueio e Etiquetagem (LOTO)",
      "Teste de ausência de tensão",
      "Aterramento temporário",
      "Treinamento NR-10",
    ],
  },
};

export function calcularRiscos(atividades: string[]): {
  riscos: string[];
  epiTipos: string[];
  medidas: string[];
} {
  const riscos = new Set<string>();
  const epiTipos = new Set<string>();
  const medidas = new Set<string>();

  atividades.forEach(a => {
    const info = ATIVIDADE_MAP[a as Atividade];
    if (!info) return;
    info.riscos.forEach(r => riscos.add(r));
    info.epiTipos.forEach(e => epiTipos.add(e));
    info.medidas.forEach(m => medidas.add(m));
  });

  return {
    riscos: Array.from(riscos),
    epiTipos: Array.from(epiTipos),
    medidas: Array.from(medidas),
  };
}

// Cruza tipos sugeridos com EPIs cadastrados da empresa
export function cruzarComEpisCadastrados(
  epiTipos: string[],
  episCadastrados: { id: string; nome: string; tipo: string; ca: string }[]
) {
  const matches = episCadastrados.filter(epi => {
    const haystack = `${epi.nome} ${epi.tipo}`.toLowerCase();
    return epiTipos.some(t => haystack.includes(t.toLowerCase()) || t.toLowerCase().includes(epi.tipo.toLowerCase()));
  });
  return matches;
}
