/**
 * VIDA 21 · OS NÚMEROS DE CADA OFÍCIO — o que cada trilha profissional conta (a medicina conta pacientes e plantões; a
 * cozinha, pratos; o caminhoneiro, quilômetros; a polícia, ocorrências), em vez de um único "desempenho" para todo mundo.
 *
 * `mes`: quanto se faz num mês de trabalho integral, no começo da carreira (o cargo e o desempenho multiplicam);
 * `ano`: o que se conta por ano (as turmas, os projetos, as safras). Ordens de grandeza de jogo, a partir do que é comum
 * na profissão (a jornada, o atendimento típico); não são estatísticas oficiais. `marcos`: os números redondos que viram
 * lembrança ("passou de 10.000 pacientes atendidos").
 *
 * As trilhas com sistema próprio de números (o atleta e o técnico esportivo, a música e a cena, a política, os ofícios da
 * VIDA 16) têm os deles: aqui só se aponta para lá (`PROPRIOS21`).
 */
export interface Indicador21 { id: string; rotulo: string; mes?: number; ano?: number; marcos?: number[] }

const I = (id: string, rotulo: string, x: { mes?: number; ano?: number; marcos?: number[] }): Indicador21 => ({ id, rotulo, ...x });
const M3 = [1000, 10000, 100000];
const M2 = [100, 1000, 5000];
const M1 = [10, 50, 200];

export const INDICADORES21: Record<string, Indicador21[]> = {
  medicina: [I('pacientes', 'pacientes atendidos', { mes: 280, marcos: M3 }), I('plantoes', 'plantões', { mes: 6, marcos: M2 }), I('procedimentos', 'procedimentos', { mes: 18, marcos: [100, 1000, 10000] })],
  enfermagem: [I('pacientes', 'pacientes cuidados', { mes: 220, marcos: M3 }), I('plantoes', 'plantões', { mes: 10, marcos: M2 })],
  odontologia: [I('pacientes', 'pacientes atendidos', { mes: 150, marcos: M3 }), I('tratamentos', 'tratamentos concluídos', { mes: 35, marcos: M2 })],
  fisioterapia: [I('sessoes', 'sessões de fisioterapia', { mes: 200, marcos: M3 })],
  veterinaria: [I('animais', 'animais atendidos', { mes: 140, marcos: M3 }), I('cirurgias', 'cirurgias', { mes: 6, marcos: M2 })],
  nutricao: [I('consultas', 'consultas', { mes: 110, marcos: M3 }), I('planos', 'planos alimentares montados', { mes: 50, marcos: M2 })],
  psicologia: [I('sessoes', 'sessões de terapia', { mes: 100, marcos: M3 })],
  farmacia: [I('receitas', 'receitas atendidas', { mes: 1100, marcos: [10000, 100000, 500000] })],
  radiologia: [I('exames', 'exames feitos', { mes: 550, marcos: [10000, 100000] })],
  saude_publica: [I('visitas', 'visitas domiciliares', { mes: 150, marcos: M3 })],
  direito: [I('audiencias', 'audiências', { mes: 10, marcos: M2 }), I('pecas', 'petições e pareceres', { mes: 35, marcos: M3 }), I('clientes', 'clientes atendidos', { mes: 6, marcos: M2 })],
  educacao: [I('aulas', 'aulas dadas', { mes: 80, marcos: M3 }), I('alunos', 'alunos que passaram pela sua sala', { ano: 70, marcos: [500, 1000, 3000] })],
  docencia_superior: [I('aulas', 'aulas na universidade', { mes: 40, marcos: M3 }), I('orientandos', 'orientandos formados', { ano: 3, marcos: M1 }), I('artigos', 'artigos publicados', { ano: 1.5, marcos: [10, 50, 100] })],
  pesquisa: [I('experimentos', 'experimentos conduzidos', { mes: 6, marcos: M2 }), I('artigos', 'artigos publicados', { ano: 2, marcos: [10, 50, 100] })],
  ti: [I('entregas', 'entregas em produção', { mes: 5, marcos: M2 }), I('correcoes', 'falhas corrigidas', { mes: 22, marcos: M3 })],
  dados: [I('analises', 'análises entregues', { mes: 7, marcos: M2 }), I('modelos', 'modelos colocados em produção', { ano: 2, marcos: M1 })],
  engenharia: [I('projetos', 'projetos assinados', { ano: 4, marcos: M1 }), I('vistorias', 'vistorias técnicas', { mes: 6, marcos: M2 })],
  eng_industrial: [I('melhorias', 'melhorias de processo implantadas', { ano: 6, marcos: M1 }), I('auditorias', 'auditorias de fábrica', { mes: 3, marcos: M2 })],
  arquitetura: [I('projetos', 'projetos entregues', { ano: 5, marcos: M1 }), I('obras', 'obras acompanhadas', { ano: 2, marcos: [10, 30, 100] })],
  construcao: [I('obras', 'obras levantadas', { ano: 3, marcos: M1 }), I('m2', 'metros quadrados construídos', { mes: 55, marcos: [1000, 10000, 50000] })],
  eletrica: [I('instalacoes', 'instalações feitas', { mes: 18, marcos: M3 }), I('chamados', 'chamados atendidos', { mes: 28, marcos: M3 })],
  predial: [I('chamados', 'chamados resolvidos', { mes: 40, marcos: M3 })],
  reparos: [I('consertos', 'consertos feitos', { mes: 45, marcos: M3 })],
  mecanica: [I('veiculos', 'veículos consertados', { mes: 35, marcos: M3 })],
  marcenaria: [I('moveis', 'móveis feitos', { mes: 8, marcos: M2 })],
  costura: [I('pecas', 'peças costuradas', { mes: 190, marcos: [1000, 10000, 50000] })],
  comercio: [I('vendas', 'vendas fechadas', { mes: 280, marcos: [1000, 10000, 100000] }), I('clientes', 'clientes atendidos', { mes: 450, marcos: [10000, 100000] })],
  vendas: [I('contratos', 'contratos fechados', { mes: 10, marcos: M2 })],
  atendimento: [I('atendimentos', 'atendimentos', { mes: 850, marcos: [10000, 100000, 500000] })],
  administrativo: [I('processos', 'processos e documentos tratados', { mes: 380, marcos: [10000, 100000] })],
  publico: [I('processos', 'processos despachados', { mes: 140, marcos: [1000, 10000, 50000] })],
  financas: [I('operacoes', 'operações fechadas', { mes: 55, marcos: M3 }), I('carteira', 'clientes na carteira', { ano: 18, marcos: [100, 300, 1000] })],
  contabil: [I('balancos', 'balanços fechados', { ano: 24, marcos: [100, 500, 1000] }), I('declaracoes', 'declarações entregues', { ano: 55, marcos: M3 })],
  alimentacao: [I('pratos', 'pratos servidos', { mes: 2300, marcos: [10000, 100000, 1000000] })],
  confeitaria: [I('doces', 'bolos e doces feitos', { mes: 280, marcos: [1000, 10000, 50000] }), I('encomendas', 'encomendas entregues', { mes: 35, marcos: M3 })],
  beleza: [I('atendimentos', 'clientes atendidas e atendidos', { mes: 150, marcos: M3 }), I('fieis', 'clientes fiéis', { ano: 25, marcos: [50, 200, 500] })],
  logistica: [I('entregas', 'entregas feitas', { mes: 580, marcos: [10000, 100000, 500000] })],
  transporte: [I('viagens', 'viagens', { mes: 160, marcos: M3 }), I('km', 'quilômetros rodados', { mes: 4800, marcos: [100000, 1000000] })],
  estrada: [I('fretes', 'fretes entregues', { mes: 9, marcos: M2 }), I('km', 'quilômetros rodados', { mes: 9500, marcos: [100000, 1000000, 3000000] })],
  posto: [I('abastecimentos', 'carros abastecidos', { mes: 2400, marcos: [10000, 100000, 1000000] })],
  limpeza: [I('ambientes', 'ambientes limpos', { mes: 300, marcos: M3 })],
  domestico: [I('dias', 'dias de casa cuidada', { mes: 22, marcos: [1000, 5000] })],
  cuidado: [I('turnos', 'turnos de cuidado', { mes: 22, marcos: [1000, 5000] }), I('pessoas', 'pessoas cuidadas', { ano: 1.5, marcos: M1 })],
  agro: [I('safras', 'safras colhidas', { ano: 1, marcos: [10, 30, 50] }), I('hectares', 'hectares cultivados', { ano: 60, marcos: [1000, 10000] })],
  pesca: [I('kg', 'quilos de peixe', { mes: 700, marcos: [10000, 100000] })],
  reciclagem: [I('toneladas', 'toneladas recicladas', { mes: 2, marcos: [100, 500, 1000] })],
  industria: [I('turnos', 'turnos na linha', { mes: 22, marcos: [1000, 5000] }), I('pecas', 'peças produzidas', { mes: 9000, marcos: [100000, 1000000, 10000000] })],
  tecnico_industrial: [I('manutencoes', 'manutenções em máquinas', { mes: 25, marcos: M3 })],
  pm: [I('ocorrencias', 'ocorrências atendidas', { mes: 35, marcos: M3 }), I('flagrantes', 'prisões em flagrante', { mes: 1.5, marcos: M2 })],
  pm_oficial: [I('operacoes', 'operações comandadas', { mes: 4, marcos: M2 })],
  policia_civil: [I('inqueritos', 'inquéritos conduzidos', { mes: 5, marcos: M2 })],
  pericia: [I('laudos', 'laudos assinados', { mes: 10, marcos: M3 })],
  bombeiro: [I('ocorrencias', 'ocorrências', { mes: 30, marcos: M3 }), I('resgates', 'pessoas resgatadas', { mes: 4, marcos: M2 })],
  exercito_praca: [I('exercicios', 'exercícios de campo', { ano: 4, marcos: M1 })],
  exercito_sargento: [I('exercicios', 'exercícios de campo', { ano: 5, marcos: M1 }), I('instruidos', 'recrutas instruídos', { ano: 40, marcos: [100, 500, 1000] })],
  exercito_oficial: [I('missoes', 'missões comandadas', { ano: 3, marcos: M1 })],
  vigilancia: [I('turnos', 'turnos de vigilância', { mes: 22, marcos: [1000, 5000] })],
  seguranca_trabalho: [I('inspecoes', 'inspeções de segurança', { mes: 20, marcos: M3 })],
  comunicacao: [I('materias', 'matérias e textos publicados', { mes: 18, marcos: M3 })],
  imagem: [I('trabalhos', 'ensaios e gravações', { mes: 11, marcos: M2 })],
  design: [I('pecas', 'peças entregues', { mes: 28, marcos: M3 })],
  ilustracao: [I('ilustracoes', 'ilustrações publicadas', { mes: 15, marcos: M3 })],
  academia: [I('aulas', 'aulas dadas', { mes: 60, marcos: M3 }), I('alunos', 'alunos acompanhados', { ano: 40, marcos: [100, 500, 1000] })],
  educacao_fisica: [I('aulas', 'aulas dadas', { mes: 70, marcos: M3 })],
  informal: [I('clientes', 'clientes', { mes: 280, marcos: M3 })]
};

/** Onde estão os números das trilhas que já têm sistema próprio. */
export const PROPRIOS21: Record<string, string> = {
  atleta: 'Os jogos, os gols, as assistências, os títulos e as lesões estão em "Carreira no esporte".',
  treino: 'Os jogos, as campanhas e os títulos como técnico estão em "Carreira como técnico".',
  musica: 'As músicas, os álbuns, os shows e os prêmios estão no currículo artístico.',
  cena: 'Os trabalhos, os papéis e os prêmios estão no currículo artístico.',
  politica: 'As eleições, os mandatos, os projetos e a aprovação estão na área da política.'
};
