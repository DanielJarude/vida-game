/**
 * Organizações (REWORK 4): onde a vida trabalha tem nome. Simuladas — nenhuma
 * empresa real —, plausíveis para o lugar: o sobrenome é do país da cidade
 * (`dados/nomes`), a raiz é inventada, o formato é o do setor. "Desenvolvedor
 * pleno · tecnologia" vira "Desenvolvedor pleno na Nexa Sistemas".
 */

export const RAIZES = ['Nexa', 'Altis', 'Brava', 'Lumen', 'Orbe', 'Vela', 'Rota', 'Prisma', 'Atlas', 'Cora', 'Varo', 'Teca', 'Aura', 'Zenit', 'Nova', 'Sela', 'Ponte', 'Ária', 'Delta', 'Horizonte', 'Ipsum', 'Faro', 'Tribo', 'Âmbar', 'Coral', 'Norte', 'Raiz', 'Sol', 'Terra', 'Vértice'];

/** {S} = sobrenome do lugar; {S2} = outro; {R} = raiz; {C} = a cidade. */
export const FORMATOS: Record<string, string[]> = {
  tecnologia: ['{R} Sistemas', '{R} Tech', '{R} Labs', '{R} Digital', '{R} Software'],
  juridico: ['{S} & {S2} Advogados', 'Escritório {S}', '{S} Advocacia'],
  saude: ['Clínica {S}', 'Hospital {R}', 'Centro Médico {R}', 'Clínica {R}'],
  educacao: ['Colégio {R}', 'Escola {S}', 'Instituto {R}', 'Colégio {S}'],
  construcao: ['Construtora {S}', '{R} Construções', '{S} Obras'],
  engenharia: ['{R} Engenharia', '{S} Projetos', '{R} Estruturas'],
  comercio: ['Lojas {R}', 'Mercado {S}', '{R} Varejo', 'Casa {S}'],
  alimentacao: ['Restaurante {S}', 'Padaria {R}', 'Cozinha {R}', 'Bistrô {S}'],
  industria: ['{R} Indústria', 'Metalúrgica {S}', '{R} Alimentos', 'Fábrica {R}'],
  logistica: ['{R} Logística', 'Transportes {S}', '{R} Entregas'],
  transporte: ['Transportes {S}', '{R} Mobilidade', 'Viação {R}'],
  financas: ['Banco {R}', '{R} Investimentos', '{S} Contábil', 'Financeira {R}'],
  comunicacao: ['Jornal de {C}', '{R} Comunicação', 'Rádio {R}', 'Agência {R}'],
  criativo: ['Estúdio {R}', '{R} Criativo', 'Ateliê {S}'],
  agro: ['Fazenda {S}', 'Cooperativa de {C}', '{R} Agro', 'Granja {S}'],
  beleza: ['Salão {R}', 'Espaço {S}', 'Studio {R}'],
  cuidado: ['Casa de Repouso {R}', 'Cuidar {R}', 'Lar {S}'],
  seguranca: ['{R} Segurança', 'Vigilância {S}'],
  administrativo: ['{R} Serviços', '{S} Consultoria', '{R} Gestão'],
  manutencao: ['{R} Manutenção', 'Oficina {S}', '{S} Reparos'],
  esporte: ['Academia {R}', 'Clube {R}', 'Arena {R}'],
  publico: ['a prefeitura de {C}']
};
