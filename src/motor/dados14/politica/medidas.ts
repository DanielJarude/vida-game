/**
 * VIDA 14 · POLÍTICA — o catálogo das medidas concretas de um mandato (puro: só tipos). Cada uma diz quem pode
 * propor (o Executivo, o Legislativo ou os dois), se passa por votação e com que quórum, quanto custa por ano (em %
 * da receita do lugar; negativo = arrecada ou economiza), quanto tempo vale, quanto demora a fazer efeito, o que muda
 * por ano em vigor e o que muda na hora (aprovação, apoio na casa, oposição, a direção do partido) — e quem perde.
 *
 * Nada tem lado: são instrumentos de gestão (imposto, obra, programa, regra administrativa), nunca bandeiras
 * ideológicas. Os nomes são genéricos (valem em qualquer país): "o imposto sobre imóveis", não o nome local.
 */
import type { Prioridade } from '../../tipos';
import type { Escopo14, IndicadorGestao14, TipoMedida14 } from './tipos';

export interface ModeloMedida14 {
  id: string;
  tipo: TipoMedida14;
  nome: string;
  /** O que é, numa frase (para a escolha). */
  oque: string;
  quem: 'executivo' | 'legislativo' | 'ambos';
  /** Quórum da votação (% da casa); 0 = ato do Executivo, sem votação. */
  quorum: number;
  custo: number;
  duracao: number;
  carencia: number;
  porAno: Partial<Record<IndicadorGestao14, number>>;
  agora: { aprovacao?: number; apoio?: number; oposicao?: number; partido?: number };
  quemPerde: string;
  /** A bandeira com que combina (cumprir a bandeira pesa a favor). */
  bandeira?: Prioridade;
  escopos?: Escopo14[];
}

export const NOME_TIPO_MEDIDA: Record<TipoMedida14, string> = {
  lei: 'Projeto de lei', reforma: 'Reforma', investimento: 'Investimento', tributo: 'Impostos', politica: 'Política pública', administrativa: 'Decisão administrativa'
};

export const MEDIDAS_14: readonly ModeloMedida14[] = [
  { id: 'lei_transparencia', tipo: 'lei', nome: 'a lei de transparência dos contratos', oque: 'Todo contrato público na internet, com preço e fornecedor, em tempo real.', quem: 'ambos', quorum: 50, custo: 0.5, duracao: 6, carencia: 0, porAno: { instituicoes: 3 }, agora: { aprovacao: 2, apoio: -3 }, quemPerde: 'quem vivia de contrato sem concorrência', bandeira: 'contas' },
  { id: 'lei_prazos', tipo: 'lei', nome: 'a lei dos prazos do atendimento público', oque: 'Prazo máximo para licença, exame e matrícula; passou do prazo, o órgão responde.', quem: 'ambos', quorum: 50, custo: 1.5, duracao: 5, carencia: 1, porAno: { populacao: 2, instituicoes: 1 }, agora: { aprovacao: 2, apoio: -1 }, quemPerde: 'os órgãos que terão de cumprir prazo', bandeira: 'saude' },
  { id: 'lei_nascentes', tipo: 'lei', nome: 'a lei de proteção das nascentes e áreas verdes', oque: 'Faixas de proteção nos rios e um limite para construir em área de nascente.', quem: 'ambos', quorum: 50, custo: 0.5, duracao: 8, carencia: 1, porAno: { populacao: 1, economia: -0.5 }, agora: { aprovacao: 1, apoio: -2, oposicao: 3 }, quemPerde: 'construtoras e produtores da região', bandeira: 'ambiente' },
  { id: 'lei_cultura', tipo: 'lei', nome: 'a lei de incentivo à cultura e ao esporte de base', oque: 'Parte do imposto devido pode virar patrocínio de projeto cultural ou esportivo.', quem: 'ambos', quorum: 50, custo: 1, duracao: 6, carencia: 1, porAno: { populacao: 1, economia: 0.3 }, agora: { aprovacao: 1 }, quemPerde: 'o caixa, um pouco', bandeira: 'cultura' },
  { id: 'reforma_previdencia', tipo: 'reforma', nome: 'a reforma da previdência dos servidores', oque: 'Idade mínima maior e contribuição maior para quem é do serviço público.', quem: 'executivo', quorum: 60, custo: -4, duracao: 10, carencia: 1, porAno: { economia: 0.5 }, agora: { aprovacao: -5, apoio: -4, oposicao: 10 }, quemPerde: 'os servidores', bandeira: 'contas' },
  { id: 'reforma_estrutura', tipo: 'reforma', nome: 'a reforma da estrutura do governo', oque: 'Fundir secretarias, extinguir órgãos repetidos e cortar diretorias.', quem: 'executivo', quorum: 50, custo: -2, duracao: 8, carencia: 0, porAno: { instituicoes: 1 }, agora: { aprovacao: 1, apoio: -5, partido: -5 }, quemPerde: 'os aliados que perdem cargos', bandeira: 'contas' },
  { id: 'reforma_ensino', tipo: 'reforma', nome: 'a reforma do ensino em tempo integral', oque: 'Escola o dia todo, com professor em dedicação exclusiva — começando pelos bairros mais pobres.', quem: 'executivo', quorum: 50, custo: 4, duracao: 8, carencia: 2, porAno: { populacao: 2, economia: 0.5 }, agora: { aprovacao: 1, oposicao: 3 }, quemPerde: 'o orçamento de outras áreas', bandeira: 'educacao' },
  { id: 'inv_saneamento', tipo: 'investimento', nome: 'o programa de saneamento', oque: 'Rede de esgoto e água tratada nos bairros que ainda não têm.', quem: 'executivo', quorum: 0, custo: 6, duracao: 4, carencia: 2, porAno: { populacao: 3, economia: 1 }, agora: {}, quemPerde: 'outras áreas do orçamento (a obra enterrada não dá foto)', bandeira: 'ambiente' },
  { id: 'inv_transporte', tipo: 'investimento', nome: 'a obra de transporte coletivo', oque: 'Corredores de ônibus, estações e integração da tarifa.', quem: 'executivo', quorum: 0, custo: 7, duracao: 4, carencia: 2, porAno: { economia: 2, populacao: 2 }, agora: { aprovacao: -1 }, quemPerde: 'quem mora e trabalha no canteiro de obras', bandeira: 'mobilidade' },
  { id: 'inv_saude', tipo: 'investimento', nome: 'a rede de hospitais e postos', oque: 'Construir e equipar unidades de saúde onde a fila é maior.', quem: 'executivo', quorum: 0, custo: 5, duracao: 4, carencia: 1, porAno: { populacao: 3 }, agora: { aprovacao: 2 }, quemPerde: 'outras áreas do orçamento', bandeira: 'saude' },
  { id: 'inv_escolas', tipo: 'investimento', nome: 'o programa de creches e escolas', oque: 'Vagas em creche para quem está na fila e escolas reformadas.', quem: 'executivo', quorum: 0, custo: 5, duracao: 5, carencia: 2, porAno: { populacao: 2, economia: 1 }, agora: { aprovacao: 1 }, quemPerde: 'outras áreas do orçamento', bandeira: 'educacao' },
  { id: 'trib_imovel', tipo: 'tributo', nome: 'o aumento do imposto sobre imóveis', oque: 'Atualizar o valor dos imóveis na planta e a alíquota dos maiores.', quem: 'ambos', quorum: 50, custo: -5, duracao: 8, carencia: 0, porAno: { economia: -0.5 }, agora: { aprovacao: -5, apoio: -3, oposicao: 8 }, quemPerde: 'os proprietários', bandeira: 'contas' },
  { id: 'trib_servicos', tipo: 'tributo', nome: 'a redução do imposto sobre serviços', oque: 'Alíquota menor para atrair empresas e formalizar quem trabalha por conta.', quem: 'ambos', quorum: 50, custo: 4, duracao: 8, carencia: 1, porAno: { economia: 1.5 }, agora: { aprovacao: 2 }, quemPerde: 'o caixa público', bandeira: 'emprego' },
  { id: 'trib_pequenos', tipo: 'tributo', nome: 'a isenção para pequenos negócios', oque: 'Pequeno negócio do bairro paga menos imposto e menos taxa nos primeiros anos.', quem: 'ambos', quorum: 50, custo: 2, duracao: 6, carencia: 1, porAno: { economia: 1 }, agora: { aprovacao: 2 }, quemPerde: 'o caixa público', bandeira: 'emprego' },
  { id: 'trib_cobranca', tipo: 'tributo', nome: 'a cobrança dos grandes devedores', oque: 'Força-tarefa para cobrar a dívida ativa de quem deve mais.', quem: 'executivo', quorum: 0, custo: -3, duracao: 4, carencia: 1, porAno: { instituicoes: 1 }, agora: { apoio: -2, oposicao: 2 }, quemPerde: 'os grandes devedores (alguns com amigos na casa)', bandeira: 'contas' },
  { id: 'pol_renda', tipo: 'politica', nome: 'o programa de renda para as famílias mais pobres', oque: 'Um valor por mês por criança na escola e com vacina em dia.', quem: 'ambos', quorum: 50, custo: 5, duracao: 6, carencia: 0, porAno: { populacao: 3, economia: 0.5 }, agora: { aprovacao: 4, oposicao: 3 }, quemPerde: 'o orçamento de investimento', bandeira: 'emprego' },
  { id: 'pol_seguranca', tipo: 'politica', nome: 'o programa de segurança nos bairros', oque: 'Iluminação, policiamento a pé e espaços ocupados à noite.', quem: 'executivo', quorum: 0, custo: 3, duracao: 5, carencia: 1, porAno: { populacao: 2 }, agora: { aprovacao: 2 }, quemPerde: 'outras áreas do orçamento', bandeira: 'seguranca' },
  { id: 'pol_saude_familia', tipo: 'politica', nome: 'o programa de saúde da família', oque: 'Equipe de saúde que visita as casas e acompanha quem tem doença crônica.', quem: 'executivo', quorum: 0, custo: 3, duracao: 6, carencia: 1, porAno: { populacao: 2 }, agora: { aprovacao: 1 }, quemPerde: 'outras áreas do orçamento', bandeira: 'saude' },
  { id: 'pol_qualificacao', tipo: 'politica', nome: 'o programa de qualificação com vaga', oque: 'Curso técnico com vaga combinada com as empresas da região.', quem: 'ambos', quorum: 50, custo: 2, duracao: 4, carencia: 1, porAno: { economia: 1, populacao: 1 }, agora: { aprovacao: 1 }, quemPerde: 'o caixa, um pouco', bandeira: 'emprego' },
  { id: 'adm_cargos', tipo: 'administrativa', nome: 'o corte de cargos de confiança', oque: 'Metade dos cargos de indicação política extintos por decreto.', quem: 'executivo', quorum: 0, custo: -2, duracao: 4, carencia: 0, porAno: { instituicoes: 2 }, agora: { aprovacao: 3, apoio: -6, partido: -6 }, quemPerde: 'os aliados que tinham cargo', bandeira: 'contas' },
  { id: 'adm_concurso', tipo: 'administrativa', nome: 'o concurso público para a linha de frente', oque: 'Professores, médicos e fiscais concursados no lugar de contrato temporário.', quem: 'executivo', quorum: 0, custo: 2, duracao: 8, carencia: 2, porAno: { populacao: 1.5, instituicoes: 1 }, agora: { apoio: -1 }, quemPerde: 'quem indicava os temporários' },
  { id: 'adm_auditoria', tipo: 'administrativa', nome: 'a auditoria dos contratos', oque: 'Todos os contratos grandes revistos por uma equipe independente.', quem: 'executivo', quorum: 0, custo: 0.5, duracao: 2, carencia: 0, porAno: { instituicoes: 3 }, agora: { apoio: -3, partido: -2 }, quemPerde: 'quem tinha contrato mal explicado — às vezes, gente da base' },
  { id: 'adm_concessao', tipo: 'administrativa', nome: 'a concessão de um serviço à iniciativa privada', oque: 'Leilão do serviço (água, ônibus, estrada) com metas e tarifa no contrato.', quem: 'executivo', quorum: 50, custo: -3, duracao: 10, carencia: 1, porAno: { economia: 1 }, agora: { aprovacao: -2, oposicao: 6 }, quemPerde: 'quem depende da tarifa (se a fiscalização falhar)' },
  { id: 'adm_digital', tipo: 'administrativa', nome: 'os serviços públicos pela internet', oque: 'Pedido, certidão e agendamento pelo celular, sem fila.', quem: 'executivo', quorum: 0, custo: 1, duracao: 5, carencia: 1, porAno: { instituicoes: 1, populacao: 1 }, agora: { aprovacao: 1 }, quemPerde: 'ninguém de peso — só o despachante' }
];

export const medida14 = (id: string): ModeloMedida14 | undefined => MEDIDAS_14.find(m => m.id === id);

/* ============================================================ Portugal · os diplomas em Belém */

/** Um diploma que chega a Belém para promulgação: as dúvidas de constitucionalidade, o que a rua acha, o peso para o Governo. */
export interface Diploma14 { id: string; nome: string; duvida: number; rua: number; peso: number }
export const DIPLOMAS_PT: readonly Diploma14[] = [
  { id: 'arrendamento', nome: 'a nova lei do arrendamento urbano', duvida: 0.2, rua: -0.3, peso: 2 },
  { id: 'urgencias', nome: 'a reorganização das urgências hospitalares', duvida: 0.1, rua: -0.5, peso: 2 },
  { id: 'contratacao', nome: 'as regras de contratação pública em regime de urgência', duvida: 0.4, rua: -0.2, peso: 1 },
  { id: 'metadados', nome: 'o acesso das polícias aos dados das comunicações', duvida: 0.7, rua: 0.1, peso: 1 },
  { id: 'docentes', nome: 'o novo estatuto da carreira docente', duvida: 0.15, rua: 0.2, peso: 2 },
  { id: 'retificativo', nome: 'um orçamento retificativo', duvida: 0.05, rua: 0, peso: 3 },
  { id: 'lei_eleitoral', nome: 'a revisão da lei eleitoral autárquica', duvida: 0.45, rua: -0.1, peso: 1 },
  { id: 'habitacao', nome: 'o programa de habitação a custos controlados', duvida: 0.1, rua: 0.5, peso: 2 }
];
