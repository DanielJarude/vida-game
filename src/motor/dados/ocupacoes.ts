/**
 * Ocupações: uma TAXONOMIA, não uma lista de salários.
 *
 * Cada ocupação pertence a uma TRILHA (a escada de uma carreira: balcão →
 * vendedor → supervisor → gerente) e a um SETOR (para medir diversidade e
 * para a cidade pesar: agro é forte no interior do Centro-Oeste, tecnologia
 * nas metrópoles). O que dá identidade a uma ocupação não é o salário, é:
 *
 *   - COMO SE ENTRA: currículo, diploma, qualificação curta, ofício
 *     aprendido (habilidade), concurso, oportunidade (ninguém vira jogador de
 *     futebol mandando currículo) ou abrindo o próprio negócio;
 *   - COMO SE SOBE: mérito (promoção), antiguidade (militares, servidores),
 *     clientela (autônomos) ou não se sobe (nem toda profissão tem escada);
 *   - O QUE COBRA: jornada longa, dias fora de casa, risco físico, fim
 *     precoce (atletas), renda que oscila;
 *   - ONDE EXISTE: oferta mínima do município, setor forte ou fraco na região,
 *     época (o que declina e o que surge).
 *
 *   nível: 0 aprendiz/estágio/formação · 1 entrada · 2 com alguma estrada
 *          3 profissional (a entrada de quem tem diploma) · 4 experiente
 *          5 liderança
 *
 * O nível é interno. A interface nunca diz "sênior" por causa dele: fala em
 * anos de estrada e no que a pessoa faz.
 *
 * Requisitos legais (CRM, OAB, CREA, COREN, CRP, CRO, CREFITO, CRF, CRMV,
 * CRECI, curso de vigilante) têm fundamento indicado. Onde a regra real varia
 * (limites de idade de concursos militares, escolaridade da PM por estado),
 * o jogo usa uma abstração plausível e diz isso no `fundamento`.
 *
 * Salários: bruto mensal de referência (reais de 2026); o município multiplica.
 */

import type { Contrato, Dominio, Escolaridade, NivelCurso } from '../tipos';
import type { AreaFormacao } from './cursos';

export type Setor =
  | 'comercio' | 'alimentacao' | 'beleza' | 'cuidado' | 'transporte' | 'logistica' | 'industria'
  | 'construcao' | 'manutencao' | 'agro' | 'saude' | 'educacao' | 'tecnologia' | 'criativo'
  | 'comunicacao' | 'esporte' | 'seguranca' | 'publico' | 'financas' | 'juridico' | 'administrativo' | 'engenharia';

export type Licenca = 'crm' | 'oab' | 'crea' | 'coren' | 'crp' | 'cnh' | 'cro' | 'crefito' | 'crf' | 'crmv' | 'creci' | 'crc';

export interface Ocupacao {
  id: string;
  nome: [string, string];      // [masculino, feminino]
  trilha: string;
  setor: Setor;
  nivel: 0 | 1 | 2 | 3 | 4 | 5;
  salario: number;
  contrato: Contrato;
  carga: 'integral' | 'parcial';
  idadeMin: number;
  idadeMax?: number;
  /** Idade máxima para ENTRAR (concursos com limite de idade). */
  idadeMaxIngresso?: number;
  escolaridade?: Escolaridade;
  /** Formação exigida (qualquer uma das áreas) e nível mínimo dela. */
  area?: AreaFormacao[];
  nivelCurso?: NivelCurso;
  licenca?: Licenca;
  /** Meses mínimos de experiência na mesma trilha (ou em trilhas afins). */
  experiencia?: number;
  /** Exige estar matriculado (estágio, aprendiz). */
  matriculado?: 'basica' | 'superior' | 'qualquer';
  /** Precisa de veículo próprio. */
  veiculo?: 'carro' | 'moto_ou_bike' | 'carro_ou_moto';
  /** Ingresso por concurso público. */
  concurso?: boolean;
  /**
   * Um ofício aprendido. Se `ouFormacao`, a habilidade substitui a formação
   * exigida em `area` (profissões NÃO regulamentadas: design, programação,
   * jornalismo). Sem `ouFormacao`, é exigida além do resto.
   */
  habilidade?: { dominio: Dominio; minimo: number; ouFormacao?: boolean };
  /** Não se entra por currículo: só por uma oportunidade concreta (peneira, convite, contrato). */
  entrada?: 'oportunidade' | 'negocio';
  /** Condicionamento mínimo (teste físico). */
  forma?: number;
  /** Como a carreira sobe. Padrão: mérito. */
  promocao?: 'merito' | 'antiguidade' | 'clientela';
  /** Anos mínimos no posto antes do próximo (padrão 2). */
  anosNoPosto?: number;
  /** Curso de formação pago que termina em outra ocupação. */
  formacaoInicial?: { meses: number; destino: string };
  /** Jornada que come a vida fora do trabalho (plantão: menos dias, noites e fins de semana). */
  jornada?: 'longa' | 'fora' | 'plantao';
  /** Contrato com prazo (meses): professor substituto, bolsa de pós-doutorado, temporário militar. */
  duracao?: number;
  /** Só existe onde há mar ou rio grande (pesca, Marinha). */
  lugar?: 'agua';
  /** Exige ficha limpa (segurança pública, Forças Armadas, alguns cargos de confiança). */
  idoneidade?: boolean;
  /** Trabalho que machuca. */
  risco?: boolean;
  /** Oferta mínima do município (0 pequena .. 3 metrópole). */
  oferta: 0 | 1 | 2 | 3;
  estresse: 1 | 2 | 3 | 4 | 5;
  /** Época: a função encolhe depois deste ano (automação), ou só existe a partir dele. */
  declinio?: number;
  surge?: number;
  /** Fundamento legal do requisito, quando houver. */
  fundamento?: string;
}

type O = Ocupacao;
const o = (x: O) => x;

export const OCUPACOES: readonly Ocupacao[] = [
  // ---------------------------------------------------------- Informal e rua
  o({ id: 'ambulante', nome: ['vendedor ambulante', 'vendedora ambulante'], trilha: 'informal', setor: 'comercio', nivel: 1, salario: 1300, contrato: 'informal', carga: 'parcial', idadeMin: 16, oferta: 0, estresse: 3 }),
  o({ id: 'diarista', nome: ['diarista', 'diarista'], trilha: 'cuidado', setor: 'cuidado', nivel: 1, salario: 2000, contrato: 'autonomo', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3, promocao: 'clientela' }),
  o({ id: 'entregador_app', nome: ['entregador de aplicativo', 'entregadora de aplicativo'], trilha: 'transporte', setor: 'transporte', nivel: 1, salario: 2100, contrato: 'autonomo', carga: 'integral', idadeMin: 18, veiculo: 'moto_ou_bike', oferta: 1, estresse: 3, risco: true }),
  o({ id: 'motorista_app', nome: ['motorista de aplicativo', 'motorista de aplicativo'], trilha: 'transporte', setor: 'transporte', nivel: 1, salario: 3300, contrato: 'autonomo', carga: 'integral', idadeMin: 21, licenca: 'cnh', veiculo: 'carro', oferta: 1, estresse: 3 }),

  // ------------------------------------------------ Serviços, casa e cuidado
  o({ id: 'trabalhador_domestico', nome: ['trabalhador doméstico', 'trabalhadora doméstica'], trilha: 'domestico', setor: 'cuidado', nivel: 1, salario: 1850, contrato: 'clt', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3, fundamento: 'LC 150/2015: trabalho doméstico com carteira, jornada e FGTS.' }),
  o({ id: 'baba', nome: ['babá', 'babá'], trilha: 'domestico', setor: 'cuidado', nivel: 2, salario: 2200, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 12, oferta: 0, estresse: 3 }),
  o({ id: 'aux_limpeza', nome: ['auxiliar de limpeza', 'auxiliar de limpeza'], trilha: 'limpeza', setor: 'manutencao', nivel: 1, salario: 1700, contrato: 'clt', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 2 }),
  o({ id: 'lider_limpeza', nome: ['encarregado de limpeza', 'encarregada de limpeza'], trilha: 'limpeza', setor: 'manutencao', nivel: 2, salario: 2400, contrato: 'clt', carga: 'integral', idadeMin: 21, experiencia: 36, oferta: 0, estresse: 3 }),
  o({ id: 'porteiro', nome: ['porteiro', 'porteira'], trilha: 'predial', setor: 'manutencao', nivel: 1, salario: 1950, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'fundamental', oferta: 1, estresse: 2, jornada: 'plantao', declinio: 2050 }),
  o({ id: 'zelador', nome: ['zelador', 'zeladora'], trilha: 'predial', setor: 'manutencao', nivel: 2, salario: 2500, contrato: 'clt', carga: 'integral', idadeMin: 21, experiencia: 36, oferta: 1, estresse: 2 }),
  o({ id: 'frentista', nome: ['frentista', 'frentista'], trilha: 'posto', setor: 'comercio', nivel: 1, salario: 1900, contrato: 'clt', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 2, declinio: 2060 }),
  o({ id: 'operador_telemarketing', nome: ['operador de telemarketing', 'operadora de telemarketing'], trilha: 'atendimento', setor: 'administrativo', nivel: 1, salario: 1650, contrato: 'clt', carga: 'parcial', idadeMin: 18, escolaridade: 'medio', oferta: 1, estresse: 4, declinio: 2032 }),
  o({ id: 'supervisor_atendimento', nome: ['supervisor de atendimento', 'supervisora de atendimento'], trilha: 'atendimento', setor: 'administrativo', nivel: 2, salario: 2800, contrato: 'clt', carga: 'integral', idadeMin: 21, escolaridade: 'medio', experiencia: 36, oferta: 1, estresse: 4, declinio: 2040 }),

  // ---------------------------------------------------- Rua, feira e reciclagem
  o({ id: 'feirante', nome: ['feirante', 'feirante'], trilha: 'informal', setor: 'comercio', nivel: 2, salario: 2300, contrato: 'informal', carga: 'integral', idadeMin: 16, experiencia: 12, oferta: 0, estresse: 3, promocao: 'clientela' }),
  o({ id: 'catador', nome: ['catador de recicláveis', 'catadora de recicláveis'], trilha: 'reciclagem', setor: 'manutencao', nivel: 1, salario: 1150, contrato: 'informal', carga: 'integral', idadeMin: 16, oferta: 0, estresse: 3, risco: true }),
  o({ id: 'cooperado_reciclagem', nome: ['cooperado de reciclagem', 'cooperada de reciclagem'], trilha: 'reciclagem', setor: 'manutencao', nivel: 2, salario: 1900, contrato: 'autonomo', carga: 'integral', idadeMin: 18, experiencia: 24, oferta: 1, estresse: 2 }),
  o({ id: 'motoboy', nome: ['motofretista', 'motofretista'], trilha: 'transporte', setor: 'transporte', nivel: 1, salario: 2400, contrato: 'clt', carga: 'integral', idadeMin: 21, licenca: 'cnh', veiculo: 'carro_ou_moto', oferta: 1, estresse: 4, risco: true }),
  o({ id: 'motorista_caminhao', nome: ['motorista de caminhão', 'motorista de caminhão'], trilha: 'estrada', setor: 'transporte', nivel: 2, salario: 3700, contrato: 'clt', carga: 'integral', idadeMin: 22, licenca: 'cnh', oferta: 0, estresse: 4, jornada: 'fora', declinio: 2065 }),

  // ------------------------------------------------------------- Negócios novos
  o({ id: 'empreiteiro', nome: ['dono de empreiteira', 'dona de empreiteira'], trilha: 'construcao', setor: 'construcao', nivel: 4, salario: 6400, contrato: 'autonomo', carga: 'integral', idadeMin: 23, experiencia: 72, entrada: 'negocio', oferta: 0, estresse: 4, promocao: 'clientela', jornada: 'longa' }),
  o({ id: 'dono_marcenaria', nome: ['dono de marcenaria', 'dona de marcenaria'], trilha: 'marcenaria', setor: 'construcao', nivel: 4, salario: 5600, contrato: 'autonomo', carga: 'integral', idadeMin: 23, experiencia: 48, entrada: 'negocio', oferta: 0, estresse: 3, promocao: 'clientela' }),
  o({ id: 'dono_loja_online', nome: ['dono de loja on-line', 'dona de loja on-line'], trilha: 'comercio', setor: 'comercio', nivel: 4, salario: 4300, contrato: 'autonomo', carga: 'integral', idadeMin: 18, entrada: 'negocio', oferta: 0, estresse: 4, promocao: 'clientela' }),
  o({ id: 'dono_estudio', nome: ['dono de estúdio', 'dona de estúdio'], trilha: 'imagem', setor: 'criativo', nivel: 4, salario: 5200, contrato: 'autonomo', carga: 'integral', idadeMin: 21, experiencia: 36, entrada: 'negocio', oferta: 1, estresse: 3, promocao: 'clientela' }),
  o({ id: 'consultor_ti', nome: ['consultor de tecnologia', 'consultora de tecnologia'], trilha: 'ti', setor: 'tecnologia', nivel: 5, salario: 14000, contrato: 'autonomo', carga: 'integral', idadeMin: 25, habilidade: { dominio: 'programacao', minimo: 60 }, experiencia: 60, entrada: 'negocio', oferta: 1, estresse: 4, promocao: 'clientela' }),

  // ------------------------------------------------------------- Ofícios
  o({ id: 'encanador', nome: ['encanador', 'encanadora'], trilha: 'hidraulica', setor: 'manutencao', nivel: 2, salario: 3100, contrato: 'autonomo', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'manual', minimo: 44 }, oferta: 0, estresse: 3, promocao: 'clientela' }),
  o({ id: 'pintor', nome: ['pintor de obras', 'pintora de obras'], trilha: 'construcao', setor: 'construcao', nivel: 2, salario: 2700, contrato: 'autonomo', carga: 'integral', idadeMin: 18, experiencia: 12, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'marceneiro', nome: ['marceneiro', 'marceneira'], trilha: 'marcenaria', setor: 'construcao', nivel: 2, salario: 3200, contrato: 'autonomo', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'manual', minimo: 50 }, oferta: 0, estresse: 2, promocao: 'clientela', risco: true }),
  o({ id: 'aux_marcenaria', nome: ['ajudante de marcenaria', 'ajudante de marcenaria'], trilha: 'marcenaria', setor: 'construcao', nivel: 1, salario: 1800, contrato: 'clt', carga: 'integral', idadeMin: 16, oferta: 0, estresse: 2 }),
  o({ id: 'tecnico_refrigeracao', nome: ['técnico de refrigeração', 'técnica de refrigeração'], trilha: 'eletrica', setor: 'manutencao', nivel: 2, salario: 3400, contrato: 'autonomo', carga: 'integral', idadeMin: 18, area: ['eletrotecnica', 'eletrica'], nivelCurso: 'livre', oferta: 1, estresse: 3, promocao: 'clientela' }),
  o({ id: 'tecnico_celular', nome: ['técnico de celular', 'técnica de celular'], trilha: 'reparos', setor: 'manutencao', nivel: 2, salario: 2500, contrato: 'autonomo', carga: 'integral', idadeMin: 16, habilidade: { dominio: 'manual', minimo: 42 }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'costureiro', nome: ['costureiro', 'costureira'], trilha: 'costura', setor: 'industria', nivel: 2, salario: 2200, contrato: 'autonomo', carga: 'integral', idadeMin: 16, habilidade: { dominio: 'manual', minimo: 40 }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'operador_confeccao', nome: ['costureiro de confecção', 'costureira de confecção'], trilha: 'costura', setor: 'industria', nivel: 1, salario: 1800, contrato: 'clt', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3, declinio: 2050 }),
  o({ id: 'padeiro', nome: ['padeiro', 'padeira'], trilha: 'alimentacao', setor: 'alimentacao', nivel: 2, salario: 2300, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 12, oferta: 0, estresse: 3 }),
  o({ id: 'instrutor_lutas', nome: ['professor de artes marciais', 'professora de artes marciais'], trilha: 'treino', setor: 'esporte', nivel: 3, salario: 2800, contrato: 'autonomo', carga: 'parcial', idadeMin: 20, habilidade: { dominio: 'lutas', minimo: 64 }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'preparador_fisico', nome: ['preparador físico', 'preparadora física'], trilha: 'treino', setor: 'esporte', nivel: 3, salario: 5200, contrato: 'clt', carga: 'integral', idadeMin: 23, area: ['educacao_fisica'], nivelCurso: 'superior', oferta: 1, estresse: 3, jornada: 'fora' }),

  // ------------------------------------------------------ Água e campo
  o({ id: 'pescador', nome: ['pescador artesanal', 'pescadora artesanal'], trilha: 'pesca', setor: 'agro', nivel: 2, salario: 1900, contrato: 'autonomo', carga: 'integral', idadeMin: 18, lugar: 'agua', habilidade: { dominio: 'campo', minimo: 34 }, oferta: 0, estresse: 3, risco: true, promocao: 'clientela' }),
  o({ id: 'operador_drone', nome: ['operador de drones agrícolas', 'operadora de drones agrícolas'], trilha: 'agro', setor: 'agro', nivel: 3, salario: 4300, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['agro', 'automacao', 'computacao'], nivelCurso: 'tecnico', oferta: 0, estresse: 2, surge: 2028 }),

  // ------------------------------------------------ Educação e pesquisa
  o({ id: 'professor_infantil', nome: ['professor de educação infantil', 'professora de educação infantil'], trilha: 'educacao', setor: 'educacao', nivel: 3, salario: 3300, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['educacao'], nivelCurso: 'superior', oferta: 0, estresse: 3 }),
  o({ id: 'professor_substituto', nome: ['professor substituto', 'professora substituta'], trilha: 'educacao', setor: 'educacao', nivel: 3, salario: 3800, contrato: 'temporario', carga: 'integral', idadeMin: 21, area: ['educacao', 'educacao_fisica', 'letras', 'musica_formacao'], nivelCurso: 'superior', concurso: true, duracao: 24, oferta: 0, estresse: 4, fundamento: 'Contratação temporária por processo seletivo simplificado, com prazo (Lei 8.745/1993 e leis estaduais).' }),
  o({ id: 'pesquisador_instituto', nome: ['pesquisador de instituto público', 'pesquisadora de instituto público'], trilha: 'pesquisa', setor: 'educacao', nivel: 5, salario: 11500, contrato: 'servidor', carga: 'integral', idadeMin: 27, area: ['qualquer'], nivelCurso: 'doutorado', concurso: true, oferta: 2, estresse: 3, promocao: 'antiguidade' }),

  // ------------------------------------------------------ Segurança pública
  o({ id: 'supervisor_vigilancia', nome: ['supervisor de segurança', 'supervisora de segurança'], trilha: 'vigilancia', setor: 'seguranca', nivel: 2, salario: 3600, contrato: 'clt', carga: 'integral', idadeMin: 23, area: ['vigilancia'], nivelCurso: 'livre', experiencia: 48, oferta: 1, estresse: 3 }),
  o({ id: 'policial_penal', nome: ['policial penal', 'policial penal'], trilha: 'penal', setor: 'seguranca', nivel: 2, salario: 5000, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'medio', concurso: true, idoneidade: true, forma: 45, oferta: 1, estresse: 5, promocao: 'antiguidade', jornada: 'plantao', fundamento: 'EC 104/2019: polícia penal estadual, por concurso; escolaridade e requisitos variam por estado.' }),
  o({ id: 'perito_criminal', nome: ['perito criminal', 'perita criminal'], trilha: 'pericia', setor: 'seguranca', nivel: 4, salario: 12500, contrato: 'servidor', carga: 'integral', idadeMin: 18, area: ['computacao', 'exatas', 'farmacia', 'engenharia', 'engenharia_civil', 'medicina', 'contabilidade'], nivelCurso: 'superior', concurso: true, idoneidade: true, oferta: 2, estresse: 4, promocao: 'antiguidade' }),
  o({ id: 'policial_rodoviario', nome: ['policial rodoviário federal', 'policial rodoviária federal'], trilha: 'federal', setor: 'seguranca', nivel: 4, salario: 11000, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'superior', licenca: 'cnh', concurso: true, idoneidade: true, forma: 55, oferta: 1, estresse: 4, risco: true, promocao: 'antiguidade', jornada: 'plantao', fundamento: 'Concurso federal: nível superior em qualquer área, CNH B, teste físico e curso de formação.' }),
  o({ id: 'aluno_oficial_pm', nome: ['cadete da academia da PM', 'cadete da academia da PM'], trilha: 'pm_oficial', setor: 'seguranca', nivel: 0, salario: 4200, contrato: 'militar', carga: 'integral', idadeMin: 18, idadeMaxIngresso: 30, escolaridade: 'superior', concurso: true, idoneidade: true, forma: 55, formacaoInicial: { meses: 24, destino: 'tenente_pm' }, oferta: 1, estresse: 4, fundamento: 'Curso de formação de oficiais da PM: concurso estadual; vários estados exigem graduação (abstraída como superior completo).' }),
  o({ id: 'tenente_pm', nome: ['tenente da PM', 'tenente da PM'], trilha: 'pm_oficial', setor: 'seguranca', nivel: 3, salario: 10500, contrato: 'militar', carga: 'integral', idadeMin: 21, entrada: 'oportunidade', oferta: 0, estresse: 5, promocao: 'antiguidade', anosNoPosto: 6, jornada: 'longa' }),
  o({ id: 'capitao_pm', nome: ['capitão da PM', 'capitã da PM'], trilha: 'pm_oficial', setor: 'seguranca', nivel: 4, salario: 14000, contrato: 'militar', carga: 'integral', idadeMin: 27, entrada: 'oportunidade', experiencia: 72, oferta: 0, estresse: 5, promocao: 'antiguidade' }),

  // ------------------------------------------------------ Forças Armadas (além do Exército)
  o({ id: 'aluno_oficial_tecnico', nome: ['aluno do curso de oficiais técnicos', 'aluna do curso de oficiais técnicos'], trilha: 'exercito_oficial', setor: 'seguranca', nivel: 0, salario: 7500, contrato: 'militar', carga: 'integral', idadeMin: 22, idadeMaxIngresso: 36, escolaridade: 'superior', concurso: true, idoneidade: true, forma: 45, formacaoInicial: { meses: 12, destino: 'tenente' }, oferta: 0, estresse: 3, fundamento: 'Quadros complementar, técnico e de saúde: concurso para graduados, curso de formação de cerca de um ano (idade-limite abstraída como 36).' }),
  o({ id: 'tenente_coronel', nome: ['tenente-coronel do Exército', 'tenente-coronel do Exército'], trilha: 'exercito_oficial', setor: 'seguranca', nivel: 5, salario: 20500, contrato: 'militar', carga: 'integral', idadeMin: 40, entrada: 'oportunidade', oferta: 0, estresse: 4, promocao: 'antiguidade' }),
  o({ id: 'coronel', nome: ['coronel do Exército', 'coronel do Exército'], trilha: 'exercito_oficial', setor: 'seguranca', nivel: 5, salario: 24000, contrato: 'militar', carga: 'integral', idadeMin: 45, entrada: 'oportunidade', oferta: 0, estresse: 4, promocao: 'antiguidade' }),

  // ---------------------------------------------------- Transformação do trabalho
  o({ id: 'tecnico_sistemas_automatizados', nome: ['técnico de sistemas automatizados', 'técnica de sistemas automatizados'], trilha: 'tecnico_industrial', setor: 'industria', nivel: 3, salario: 5600, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['automacao', 'eletrotecnica', 'computacao', 'mecanica'], nivelCurso: 'tecnico', oferta: 1, estresse: 3, surge: 2034 }),
  o({ id: 'tecnico_energia', nome: ['técnico de redes de energia', 'técnica de redes de energia'], trilha: 'eletrica', setor: 'manutencao', nivel: 3, salario: 4800, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['eletrotecnica', 'automacao'], nivelCurso: 'tecnico', oferta: 1, estresse: 3, risco: true, surge: 2032 }),

  // ---------------------------------------------------------- Beleza
  o({ id: 'manicure', nome: ['manicure', 'manicure'], trilha: 'beleza', setor: 'beleza', nivel: 1, salario: 1800, contrato: 'autonomo', carga: 'integral', idadeMin: 16, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'cabeleireiro', nome: ['cabeleireiro', 'cabeleireira'], trilha: 'beleza', setor: 'beleza', nivel: 2, salario: 2900, contrato: 'autonomo', carga: 'integral', idadeMin: 17, area: ['beleza'], nivelCurso: 'livre', habilidade: { dominio: 'beleza', minimo: 42, ouFormacao: true }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'barbeiro', nome: ['barbeiro', 'barbeira'], trilha: 'beleza', setor: 'beleza', nivel: 2, salario: 2700, contrato: 'autonomo', carga: 'integral', idadeMin: 17, area: ['beleza'], nivelCurso: 'livre', habilidade: { dominio: 'beleza', minimo: 40, ouFormacao: true }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'dono_salao', nome: ['dono de salão', 'dona de salão'], trilha: 'beleza', setor: 'beleza', nivel: 4, salario: 5200, contrato: 'autonomo', carga: 'integral', idadeMin: 21, experiencia: 48, entrada: 'negocio', oferta: 0, estresse: 4, promocao: 'clientela' }),

  // ---------------------------------------------------------- Comércio
  o({ id: 'atendente', nome: ['atendente de loja', 'atendente de loja'], trilha: 'comercio', setor: 'comercio', nivel: 1, salario: 1700, contrato: 'clt', carga: 'integral', idadeMin: 16, escolaridade: 'fundamental', oferta: 0, estresse: 2 }),
  o({ id: 'caixa', nome: ['operador de caixa', 'operadora de caixa'], trilha: 'comercio', setor: 'comercio', nivel: 1, salario: 1650, contrato: 'clt', carga: 'integral', idadeMin: 16, escolaridade: 'fundamental', oferta: 0, estresse: 2, declinio: 2045 }),
  o({ id: 'vendedor', nome: ['vendedor', 'vendedora'], trilha: 'comercio', setor: 'comercio', nivel: 2, salario: 2500, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', experiencia: 12, oferta: 0, estresse: 3 }),
  o({ id: 'supervisor_loja', nome: ['supervisor de loja', 'supervisora de loja'], trilha: 'comercio', setor: 'comercio', nivel: 3, salario: 3500, contrato: 'clt', carga: 'integral', idadeMin: 21, escolaridade: 'medio', experiencia: 36, oferta: 0, estresse: 3, anosNoPosto: 3 }),
  o({ id: 'gerente_loja', nome: ['gerente de loja', 'gerente de loja'], trilha: 'comercio', setor: 'comercio', nivel: 4, salario: 5400, contrato: 'clt', carga: 'integral', idadeMin: 24, escolaridade: 'medio', experiencia: 72, oferta: 0, estresse: 4, anosNoPosto: 3, jornada: 'longa' }),
  o({ id: 'representante', nome: ['representante comercial', 'representante comercial'], trilha: 'vendas', setor: 'comercio', nivel: 3, salario: 4800, contrato: 'autonomo', carga: 'integral', idadeMin: 21, licenca: 'cnh', veiculo: 'carro', habilidade: { dominio: 'vendas', minimo: 50 }, oferta: 1, estresse: 4, jornada: 'fora', promocao: 'clientela' }),
  o({ id: 'corretor_imoveis', nome: ['corretor de imóveis', 'corretora de imóveis'], trilha: 'vendas', setor: 'comercio', nivel: 3, salario: 4300, contrato: 'autonomo', carga: 'integral', idadeMin: 18, area: ['imoveis'], nivelCurso: 'tecnico', licenca: 'creci', oferta: 1, estresse: 4, promocao: 'clientela', fundamento: 'Lei 6.530/1978: corretagem exige técnico em transações imobiliárias e inscrição no CRECI.' }),
  o({ id: 'dono_comercio', nome: ['dono de comércio', 'dona de comércio'], trilha: 'comercio', setor: 'comercio', nivel: 4, salario: 5000, contrato: 'autonomo', carga: 'integral', idadeMin: 21, experiencia: 24, entrada: 'negocio', oferta: 0, estresse: 4, jornada: 'longa', promocao: 'clientela' }),

  // ------------------------------------------------------- Alimentação
  o({ id: 'aux_cozinha', nome: ['auxiliar de cozinha', 'auxiliar de cozinha'], trilha: 'alimentacao', setor: 'alimentacao', nivel: 1, salario: 1700, contrato: 'clt', carga: 'integral', idadeMin: 16, oferta: 0, estresse: 3 }),
  o({ id: 'garcom', nome: ['garçom', 'garçonete'], trilha: 'alimentacao', setor: 'alimentacao', nivel: 1, salario: 1900, contrato: 'clt', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3, jornada: 'longa' }),
  o({ id: 'cozinheiro', nome: ['cozinheiro', 'cozinheira'], trilha: 'alimentacao', setor: 'alimentacao', nivel: 2, salario: 2500, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 24, habilidade: { dominio: 'cozinha', minimo: 45, ouFormacao: true }, area: ['gastronomia'], nivelCurso: 'livre', oferta: 0, estresse: 3, jornada: 'longa' }),
  o({ id: 'confeiteiro', nome: ['confeiteiro', 'confeiteira'], trilha: 'confeitaria', setor: 'alimentacao', nivel: 2, salario: 2400, contrato: 'autonomo', carga: 'integral', idadeMin: 16, habilidade: { dominio: 'cozinha', minimo: 40, ouFormacao: true }, area: ['gastronomia'], nivelCurso: 'livre', oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'chef', nome: ['chef de cozinha', 'chef de cozinha'], trilha: 'alimentacao', setor: 'alimentacao', nivel: 4, salario: 5800, contrato: 'clt', carga: 'integral', idadeMin: 23, experiencia: 60, area: ['gastronomia'], nivelCurso: 'tecnico', oferta: 1, estresse: 4, jornada: 'longa' }),
  o({ id: 'dono_lanchonete', nome: ['dono de lanchonete', 'dona de lanchonete'], trilha: 'alimentacao', setor: 'alimentacao', nivel: 4, salario: 4800, contrato: 'autonomo', carga: 'integral', idadeMin: 21, experiencia: 24, entrada: 'negocio', oferta: 0, estresse: 4, jornada: 'longa', promocao: 'clientela' }),

  // ---------------------------------------------------- Administrativo
  o({ id: 'jovem_aprendiz', nome: ['jovem aprendiz', 'jovem aprendiz'], trilha: 'administrativo', setor: 'administrativo', nivel: 0, salario: 950, contrato: 'aprendiz', carga: 'parcial', idadeMin: 14, idadeMax: 24, matriculado: 'basica', oferta: 0, estresse: 1, fundamento: 'Lei da Aprendizagem (10.097/2000): 14 a 24 anos, contrato de até 2 anos, com escola.' }),
  o({ id: 'recepcionista', nome: ['recepcionista', 'recepcionista'], trilha: 'administrativo', setor: 'administrativo', nivel: 1, salario: 1850, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', oferta: 0, estresse: 2 }),
  o({ id: 'aux_adm', nome: ['auxiliar administrativo', 'auxiliar administrativa'], trilha: 'administrativo', setor: 'administrativo', nivel: 1, salario: 2100, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', oferta: 0, estresse: 2 }),
  o({ id: 'assistente_adm', nome: ['assistente administrativo', 'assistente administrativa'], trilha: 'administrativo', setor: 'administrativo', nivel: 2, salario: 2900, contrato: 'clt', carga: 'integral', idadeMin: 19, escolaridade: 'medio', experiencia: 24, oferta: 0, estresse: 2 }),
  o({ id: 'analista_adm', nome: ['analista administrativo', 'analista administrativa'], trilha: 'administrativo', setor: 'administrativo', nivel: 3, salario: 4400, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['administracao', 'contabilidade', 'economia'], nivelCurso: 'superior', oferta: 1, estresse: 3 }),
  o({ id: 'analista_rh', nome: ['analista de RH', 'analista de RH'], trilha: 'administrativo', setor: 'administrativo', nivel: 3, salario: 4300, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['administracao', 'psicologia'], nivelCurso: 'superior', oferta: 1, estresse: 3 }),
  o({ id: 'coordenador_adm', nome: ['coordenador administrativo', 'coordenadora administrativa'], trilha: 'administrativo', setor: 'administrativo', nivel: 4, salario: 7200, contrato: 'clt', carga: 'integral', idadeMin: 26, escolaridade: 'superior', experiencia: 72, oferta: 1, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'gerente_adm', nome: ['gerente', 'gerente'], trilha: 'administrativo', setor: 'administrativo', nivel: 5, salario: 12500, contrato: 'clt', carga: 'integral', idadeMin: 30, escolaridade: 'superior', experiencia: 120, oferta: 2, estresse: 5, anosNoPosto: 4, jornada: 'longa' }),
  o({ id: 'contador', nome: ['contador', 'contadora'], trilha: 'contabil', setor: 'financas', nivel: 3, salario: 5200, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['contabilidade'], nivelCurso: 'superior', licenca: 'crc', oferta: 0, estresse: 3, fundamento: 'Decreto-Lei 9.295/1946: contador exige bacharelado e registro no CRC.' }),
  o({ id: 'contador_socio', nome: ['contador com escritório próprio', 'contadora com escritório próprio'], trilha: 'contabil', setor: 'financas', nivel: 4, salario: 8800, contrato: 'autonomo', carga: 'integral', idadeMin: 27, area: ['contabilidade'], nivelCurso: 'superior', licenca: 'crc', experiencia: 60, oferta: 0, estresse: 4, promocao: 'clientela' }),
  o({ id: 'estagio_adm', nome: ['estagiário administrativo', 'estagiária administrativa'], trilha: 'administrativo', setor: 'administrativo', nivel: 0, salario: 1300, contrato: 'estagio', carga: 'parcial', idadeMin: 16, matriculado: 'qualquer', oferta: 1, estresse: 1, fundamento: 'Lei do Estágio (11.788/2008): exige matrícula e frequência escolar.' }),

  // ------------------------------------------------------ Logística
  o({ id: 'estoquista', nome: ['estoquista', 'estoquista'], trilha: 'logistica', setor: 'logistica', nivel: 1, salario: 1900, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'fundamental', oferta: 0, estresse: 2 }),
  o({ id: 'operador_empilhadeira', nome: ['operador de empilhadeira', 'operadora de empilhadeira'], trilha: 'logistica', setor: 'logistica', nivel: 2, salario: 2600, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['logistica'], nivelCurso: 'livre', oferta: 1, estresse: 2, fundamento: 'NR-11: operador de empilhadeira precisa de curso de capacitação.' }),
  o({ id: 'analista_logistica', nome: ['analista de logística', 'analista de logística'], trilha: 'logistica', setor: 'logistica', nivel: 3, salario: 4200, contrato: 'clt', carga: 'integral', idadeMin: 20, area: ['logistica', 'administracao'], nivelCurso: 'tecnico', oferta: 1, estresse: 3 }),
  o({ id: 'coordenador_logistica', nome: ['coordenador de logística', 'coordenadora de logística'], trilha: 'logistica', setor: 'logistica', nivel: 4, salario: 7400, contrato: 'clt', carga: 'integral', idadeMin: 26, area: ['logistica', 'administracao'], nivelCurso: 'tecnico', experiencia: 72, oferta: 1, estresse: 4, anosNoPosto: 3 }),

  // ------------------------------------------------------ Transporte
  o({ id: 'motorista_onibus', nome: ['motorista de ônibus', 'motorista de ônibus'], trilha: 'estrada', setor: 'transporte', nivel: 2, salario: 3300, contrato: 'clt', carga: 'integral', idadeMin: 24, licenca: 'cnh', escolaridade: 'fundamental', oferta: 1, estresse: 4, fundamento: 'CNH categoria D exige 21 anos e experiência prévia de direção (abstraído como 24 anos).' }),
  o({ id: 'caminhoneiro', nome: ['caminhoneiro', 'caminhoneira'], trilha: 'estrada', setor: 'transporte', nivel: 2, salario: 4600, contrato: 'autonomo', carga: 'integral', idadeMin: 22, licenca: 'cnh', oferta: 0, estresse: 4, jornada: 'fora', risco: true, fundamento: 'CNH categoria C/E exige tempo de habilitação anterior (abstraído como 22 anos).' }),

  // ------------------------------------------------------ Tecnologia
  o({ id: 'suporte_ti', nome: ['técnico de suporte', 'técnica de suporte'], trilha: 'ti', setor: 'tecnologia', nivel: 1, salario: 2400, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['computacao'], nivelCurso: 'tecnico', habilidade: { dominio: 'programacao', minimo: 35, ouFormacao: true }, oferta: 1, estresse: 2 }),
  o({ id: 'estagio_ti', nome: ['estagiário de TI', 'estagiária de TI'], trilha: 'ti', setor: 'tecnologia', nivel: 0, salario: 1700, contrato: 'estagio', carga: 'parcial', idadeMin: 16, matriculado: 'qualquer', area: ['computacao'], oferta: 1, estresse: 2 }),
  o({ id: 'dev_jr', nome: ['desenvolvedor júnior', 'desenvolvedora júnior'], trilha: 'ti', setor: 'tecnologia', nivel: 2, salario: 4300, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['computacao'], nivelCurso: 'tecnico', habilidade: { dominio: 'programacao', minimo: 58, ouFormacao: true }, oferta: 1, estresse: 3 }),
  o({ id: 'dev_pleno', nome: ['desenvolvedor pleno', 'desenvolvedora plena'], trilha: 'ti', setor: 'tecnologia', nivel: 3, salario: 7800, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['computacao'], nivelCurso: 'tecnico', habilidade: { dominio: 'programacao', minimo: 58, ouFormacao: true }, experiencia: 36, oferta: 1, estresse: 3 }),
  o({ id: 'dev_senior', nome: ['desenvolvedor sênior', 'desenvolvedora sênior'], trilha: 'ti', setor: 'tecnologia', nivel: 4, salario: 12500, contrato: 'clt', carga: 'integral', idadeMin: 24, area: ['computacao'], nivelCurso: 'tecnico', habilidade: { dominio: 'programacao', minimo: 58, ouFormacao: true }, experiencia: 72, oferta: 1, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'tech_lead', nome: ['líder técnico', 'líder técnica'], trilha: 'ti', setor: 'tecnologia', nivel: 5, salario: 17500, contrato: 'clt', carga: 'integral', idadeMin: 27, area: ['computacao'], nivelCurso: 'tecnico', habilidade: { dominio: 'programacao', minimo: 58, ouFormacao: true }, experiencia: 108, oferta: 2, estresse: 5, anosNoPosto: 3 }),
  o({ id: 'analista_dados', nome: ['analista de dados', 'analista de dados'], trilha: 'dados', setor: 'tecnologia', nivel: 3, salario: 7200, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['computacao', 'economia', 'exatas'], nivelCurso: 'superior', oferta: 2, estresse: 3 }),
  o({ id: 'cientista_dados', nome: ['cientista de dados', 'cientista de dados'], trilha: 'dados', setor: 'tecnologia', nivel: 4, salario: 12800, contrato: 'clt', carga: 'integral', idadeMin: 25, area: ['computacao', 'economia', 'exatas'], nivelCurso: 'superior', experiencia: 48, oferta: 2, estresse: 4, anosNoPosto: 3 }),

  // ------------------------------------------------------------- Saúde
  o({ id: 'cuidador', nome: ['cuidador de idosos', 'cuidadora de idosos'], trilha: 'cuidado', setor: 'cuidado', nivel: 1, salario: 1950, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'fundamental', oferta: 0, estresse: 3 }),
  o({ id: 'agente_saude', nome: ['agente comunitário de saúde', 'agente comunitária de saúde'], trilha: 'saude_publica', setor: 'saude', nivel: 2, salario: 3040, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'medio', concurso: true, oferta: 0, estresse: 3, promocao: 'antiguidade', fundamento: 'Lei 11.350/2006: seleção pública, ensino médio e morar na área em que atua.' }),
  o({ id: 'tec_enfermagem', nome: ['técnico de enfermagem', 'técnica de enfermagem'], trilha: 'enfermagem', setor: 'saude', nivel: 2, salario: 2900, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['enfermagem'], nivelCurso: 'tecnico', oferta: 0, estresse: 4, jornada: 'plantao', fundamento: 'Lei 7.498/1986: técnico de enfermagem exige formação técnica específica.' }),
  o({ id: 'tec_radiologia', nome: ['técnico em radiologia', 'técnica em radiologia'], trilha: 'radiologia', setor: 'saude', nivel: 2, salario: 3400, contrato: 'clt', carga: 'parcial', idadeMin: 18, area: ['radiologia'], nivelCurso: 'tecnico', oferta: 1, estresse: 3, fundamento: 'Lei 7.394/1985: técnico em radiologia exige curso técnico e registro no conselho.' }),
  o({ id: 'enfermeiro', nome: ['enfermeiro', 'enfermeira'], trilha: 'enfermagem', setor: 'saude', nivel: 3, salario: 5100, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['enfermagem'], nivelCurso: 'superior', licenca: 'coren', oferta: 0, estresse: 4, jornada: 'plantao', fundamento: 'Lei 7.498/1986: enfermeiro é privativo de bacharel com COREN.' }),
  o({ id: 'enfermeiro_chefe', nome: ['enfermeiro-chefe', 'enfermeira-chefe'], trilha: 'enfermagem', setor: 'saude', nivel: 4, salario: 7600, contrato: 'clt', carga: 'integral', idadeMin: 27, area: ['enfermagem'], nivelCurso: 'superior', licenca: 'coren', experiencia: 60, oferta: 1, estresse: 5, anosNoPosto: 3 }),
  o({ id: 'medico', nome: ['médico', 'médica'], trilha: 'medicina', setor: 'saude', nivel: 3, salario: 14500, contrato: 'clt', carga: 'integral', idadeMin: 23, area: ['medicina'], nivelCurso: 'superior', licenca: 'crm', oferta: 0, estresse: 5, jornada: 'plantao', fundamento: 'Lei 12.842/2013: exige graduação em Medicina e registro no CRM.' }),
  o({ id: 'medico_especialista', nome: ['médico especialista', 'médica especialista'], trilha: 'medicina', setor: 'saude', nivel: 4, salario: 26000, contrato: 'autonomo', carga: 'integral', idadeMin: 26, area: ['medicina'], nivelCurso: 'residencia', licenca: 'crm', oferta: 1, estresse: 5, jornada: 'longa', fundamento: 'Título de especialista exige residência médica.' }),
  o({ id: 'psicologo', nome: ['psicólogo', 'psicóloga'], trilha: 'psicologia', setor: 'saude', nivel: 3, salario: 4300, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['psicologia'], nivelCurso: 'superior', licenca: 'crp', oferta: 0, estresse: 3, fundamento: 'Lei 4.119/1962: exige graduação em Psicologia e CRP.' }),
  o({ id: 'psicologo_clinico', nome: ['psicólogo clínico', 'psicóloga clínica'], trilha: 'psicologia', setor: 'saude', nivel: 4, salario: 7200, contrato: 'autonomo', carga: 'integral', idadeMin: 26, area: ['psicologia'], nivelCurso: 'superior', licenca: 'crp', experiencia: 48, oferta: 1, estresse: 3, promocao: 'clientela' }),
  o({ id: 'nutricionista', nome: ['nutricionista', 'nutricionista'], trilha: 'nutricao', setor: 'saude', nivel: 3, salario: 4200, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['nutricao'], nivelCurso: 'superior', oferta: 1, estresse: 2, fundamento: 'Lei 8.234/1991: exige graduação em Nutrição e registro no CRN.' }),
  o({ id: 'fisioterapeuta', nome: ['fisioterapeuta', 'fisioterapeuta'], trilha: 'fisioterapia', setor: 'saude', nivel: 3, salario: 4600, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['fisioterapia'], nivelCurso: 'superior', licenca: 'crefito', oferta: 0, estresse: 3, fundamento: 'Decreto-Lei 938/1969: exige graduação em Fisioterapia e CREFITO.' }),
  o({ id: 'fisio_clinica', nome: ['fisioterapeuta com clínica própria', 'fisioterapeuta com clínica própria'], trilha: 'fisioterapia', setor: 'saude', nivel: 4, salario: 8200, contrato: 'autonomo', carga: 'integral', idadeMin: 27, area: ['fisioterapia'], nivelCurso: 'superior', licenca: 'crefito', experiencia: 60, oferta: 1, estresse: 4, promocao: 'clientela' }),
  o({ id: 'dentista', nome: ['dentista', 'dentista'], trilha: 'odontologia', setor: 'saude', nivel: 3, salario: 6500, contrato: 'autonomo', carga: 'integral', idadeMin: 22, area: ['odontologia'], nivelCurso: 'superior', licenca: 'cro', oferta: 0, estresse: 3, promocao: 'clientela', fundamento: 'Lei 5.081/1966: exige graduação em Odontologia e CRO.' }),
  o({ id: 'farmaceutico', nome: ['farmacêutico', 'farmacêutica'], trilha: 'farmacia', setor: 'saude', nivel: 3, salario: 5000, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['farmacia'], nivelCurso: 'superior', licenca: 'crf', oferta: 0, estresse: 3, fundamento: 'Lei 13.021/2014: farmácia exige farmacêutico responsável com CRF.' }),
  o({ id: 'veterinario', nome: ['veterinário', 'veterinária'], trilha: 'veterinaria', setor: 'agro', nivel: 3, salario: 5200, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['veterinaria'], nivelCurso: 'superior', licenca: 'crmv', oferta: 0, estresse: 3, fundamento: 'Lei 5.517/1968: exige graduação em Medicina Veterinária e CRMV.' }),
  o({ id: 'veterinario_clinica', nome: ['veterinário com clínica própria', 'veterinária com clínica própria'], trilha: 'veterinaria', setor: 'agro', nivel: 4, salario: 8800, contrato: 'autonomo', carga: 'integral', idadeMin: 27, area: ['veterinaria'], nivelCurso: 'superior', licenca: 'crmv', experiencia: 60, oferta: 0, estresse: 4, promocao: 'clientela' }),

  // ------------------------------------------------------------ Direito
  o({ id: 'estagio_direito', nome: ['estagiário de direito', 'estagiária de direito'], trilha: 'direito', setor: 'juridico', nivel: 0, salario: 1500, contrato: 'estagio', carga: 'parcial', idadeMin: 18, matriculado: 'superior', area: ['direito'], oferta: 1, estresse: 2 }),
  o({ id: 'advogado_jr', nome: ['advogado júnior', 'advogada júnior'], trilha: 'direito', setor: 'juridico', nivel: 3, salario: 4700, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['direito'], nivelCurso: 'superior', licenca: 'oab', oferta: 0, estresse: 4, fundamento: 'Lei 8.906/1994: advocacia é privativa de inscrito na OAB.' }),
  o({ id: 'advogado', nome: ['advogado', 'advogada'], trilha: 'direito', setor: 'juridico', nivel: 4, salario: 8800, contrato: 'autonomo', carga: 'integral', idadeMin: 25, area: ['direito'], nivelCurso: 'superior', licenca: 'oab', experiencia: 48, oferta: 0, estresse: 4, promocao: 'clientela' }),
  o({ id: 'socio_advocacia', nome: ['sócio de escritório', 'sócia de escritório'], trilha: 'direito', setor: 'juridico', nivel: 5, salario: 19000, contrato: 'autonomo', carga: 'integral', idadeMin: 32, area: ['direito'], nivelCurso: 'superior', licenca: 'oab', experiencia: 120, oferta: 2, estresse: 5, anosNoPosto: 4, jornada: 'longa' }),

  // --------------------------------------------------------- Engenharia
  o({ id: 'estagio_eng', nome: ['estagiário de engenharia', 'estagiária de engenharia'], trilha: 'engenharia', setor: 'engenharia', nivel: 0, salario: 1800, contrato: 'estagio', carga: 'parcial', idadeMin: 18, matriculado: 'superior', area: ['engenharia_civil', 'arquitetura', 'engenharia'], oferta: 1, estresse: 2 }),
  o({ id: 'eng_jr', nome: ['engenheiro júnior', 'engenheira júnior'], trilha: 'engenharia', setor: 'engenharia', nivel: 3, salario: 6800, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['engenharia_civil'], nivelCurso: 'superior', licenca: 'crea', oferta: 1, estresse: 4, fundamento: 'Lei 5.194/1966: engenharia exige graduação e CREA.' }),
  o({ id: 'eng_pleno', nome: ['engenheiro civil', 'engenheira civil'], trilha: 'engenharia', setor: 'engenharia', nivel: 4, salario: 10500, contrato: 'clt', carga: 'integral', idadeMin: 25, area: ['engenharia_civil'], nivelCurso: 'superior', licenca: 'crea', experiencia: 48, oferta: 1, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'gerente_obras', nome: ['gerente de obras', 'gerente de obras'], trilha: 'engenharia', setor: 'engenharia', nivel: 5, salario: 16500, contrato: 'clt', carga: 'integral', idadeMin: 30, area: ['engenharia_civil'], nivelCurso: 'superior', licenca: 'crea', experiencia: 108, oferta: 2, estresse: 5, anosNoPosto: 4, jornada: 'longa' }),
  o({ id: 'arquiteto', nome: ['arquiteto', 'arquiteta'], trilha: 'arquitetura', setor: 'engenharia', nivel: 3, salario: 5600, contrato: 'autonomo', carga: 'integral', idadeMin: 22, area: ['arquitetura'], nivelCurso: 'superior', oferta: 1, estresse: 3, promocao: 'clientela', fundamento: 'Lei 12.378/2010: arquitetura exige graduação e registro no CAU.' }),
  o({ id: 'eng_industrial_jr', nome: ['engenheiro de produção júnior', 'engenheira de produção júnior'], trilha: 'eng_industrial', setor: 'industria', nivel: 3, salario: 6900, contrato: 'clt', carga: 'integral', idadeMin: 22, area: ['engenharia'], nivelCurso: 'superior', licenca: 'crea', oferta: 1, estresse: 4 }),
  o({ id: 'eng_industrial', nome: ['engenheiro industrial', 'engenheira industrial'], trilha: 'eng_industrial', setor: 'industria', nivel: 4, salario: 11000, contrato: 'clt', carga: 'integral', idadeMin: 25, area: ['engenharia'], nivelCurso: 'superior', licenca: 'crea', experiencia: 48, oferta: 1, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'gerente_industrial', nome: ['gerente de fábrica', 'gerente de fábrica'], trilha: 'eng_industrial', setor: 'industria', nivel: 5, salario: 18000, contrato: 'clt', carga: 'integral', idadeMin: 32, area: ['engenharia', 'mecanica', 'eletrotecnica'], nivelCurso: 'tecnico', experiencia: 120, escolaridade: 'superior', oferta: 1, estresse: 5, anosNoPosto: 4, jornada: 'longa' }),

  // ----------------------------------------------------------- Educação
  o({ id: 'aux_creche', nome: ['auxiliar de creche', 'auxiliar de creche'], trilha: 'educacao', setor: 'educacao', nivel: 1, salario: 1800, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', oferta: 0, estresse: 3 }),
  o({ id: 'professor_fund', nome: ['professor do fundamental', 'professora do fundamental'], trilha: 'educacao', setor: 'educacao', nivel: 3, salario: 3900, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['educacao'], nivelCurso: 'superior', oferta: 0, estresse: 4, fundamento: 'LDB (Lei 9.394/1996): docência na educação básica exige licenciatura.' }),
  o({ id: 'professor_concursado', nome: ['professor concursado', 'professora concursada'], trilha: 'educacao', setor: 'educacao', nivel: 3, salario: 5100, contrato: 'servidor', carga: 'integral', idadeMin: 21, area: ['educacao', 'educacao_fisica', 'musica_formacao', 'letras'], nivelCurso: 'superior', concurso: true, oferta: 0, estresse: 4, promocao: 'antiguidade' }),
  o({ id: 'coordenador_ped', nome: ['coordenador pedagógico', 'coordenadora pedagógica'], trilha: 'educacao', setor: 'educacao', nivel: 4, salario: 6000, contrato: 'clt', carga: 'integral', idadeMin: 27, area: ['educacao'], nivelCurso: 'superior', experiencia: 60, oferta: 0, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'diretor_escola', nome: ['diretor de escola', 'diretora de escola'], trilha: 'educacao', setor: 'educacao', nivel: 5, salario: 8200, contrato: 'servidor', carga: 'integral', idadeMin: 32, area: ['educacao'], nivelCurso: 'superior', experiencia: 120, oferta: 0, estresse: 5, anosNoPosto: 4 }),
  o({ id: 'professor_idiomas', nome: ['professor de inglês', 'professora de inglês'], trilha: 'idiomas', setor: 'educacao', nivel: 2, salario: 2800, contrato: 'clt', carga: 'parcial', idadeMin: 18, habilidade: { dominio: 'idiomas', minimo: 68 }, oferta: 1, estresse: 2 }),
  o({ id: 'instrutor_tecnico', nome: ['instrutor de curso técnico', 'instrutora de curso técnico'], trilha: 'ensino_tecnico', setor: 'educacao', nivel: 4, salario: 5200, contrato: 'clt', carga: 'integral', idadeMin: 28, area: ['eletrotecnica', 'mecanica', 'computacao', 'enfermagem', 'agro', 'gastronomia', 'logistica', 'edificacoes', 'automacao', 'seguranca_trabalho'], nivelCurso: 'tecnico', experiencia: 72, oferta: 1, estresse: 2 }),
  o({ id: 'professor_univ', nome: ['professor universitário', 'professora universitária'], trilha: 'academia', setor: 'educacao', nivel: 5, salario: 12000, contrato: 'servidor', carga: 'integral', idadeMin: 28, area: ['qualquer'], nivelCurso: 'doutorado', concurso: true, oferta: 1, estresse: 3, promocao: 'antiguidade' }),
  o({ id: 'pesquisador', nome: ['pesquisador com bolsa', 'pesquisadora com bolsa'], trilha: 'academia', setor: 'educacao', nivel: 4, salario: 5200, contrato: 'informal', carga: 'integral', idadeMin: 26, area: ['qualquer'], nivelCurso: 'doutorado', entrada: 'oportunidade', duracao: 24, oferta: 1, estresse: 3 }),

  // --------------------------------------------- Construção e manutenção
  o({ id: 'ajudante_obras', nome: ['ajudante de obras', 'ajudante de obras'], trilha: 'construcao', setor: 'construcao', nivel: 1, salario: 1800, contrato: 'informal', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3, risco: true }),
  o({ id: 'pedreiro', nome: ['pedreiro', 'pedreira'], trilha: 'construcao', setor: 'construcao', nivel: 2, salario: 3000, contrato: 'autonomo', carga: 'integral', idadeMin: 20, experiencia: 24, oferta: 0, estresse: 3, risco: true, promocao: 'clientela' }),
  o({ id: 'mestre_obras', nome: ['mestre de obras', 'mestra de obras'], trilha: 'construcao', setor: 'construcao', nivel: 4, salario: 5300, contrato: 'clt', carga: 'integral', idadeMin: 30, experiencia: 96, oferta: 0, estresse: 4 }),
  o({ id: 'tecnico_edificacoes', nome: ['técnico em edificações', 'técnica em edificações'], trilha: 'construcao', setor: 'construcao', nivel: 3, salario: 3900, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['edificacoes'], nivelCurso: 'tecnico', oferta: 1, estresse: 3 }),
  o({ id: 'aux_manutencao', nome: ['auxiliar de manutenção', 'auxiliar de manutenção'], trilha: 'manutencao', setor: 'manutencao', nivel: 1, salario: 1900, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'fundamental', oferta: 0, estresse: 2 }),
  o({ id: 'eletricista', nome: ['eletricista', 'eletricista'], trilha: 'eletrica', setor: 'manutencao', nivel: 2, salario: 3300, contrato: 'autonomo', carga: 'integral', idadeMin: 18, area: ['eletrotecnica', 'eletrica'], nivelCurso: 'livre', oferta: 0, estresse: 3, risco: true, promocao: 'clientela', fundamento: 'NR-10: instalação elétrica exige qualificação comprovada.' }),
  o({ id: 'instalador_solar', nome: ['instalador de energia solar', 'instaladora de energia solar'], trilha: 'eletrica', setor: 'manutencao', nivel: 2, salario: 3500, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['eletrotecnica', 'eletrica'], nivelCurso: 'livre', oferta: 0, estresse: 3, risco: true, surge: 2024 }),
  o({ id: 'mecanico', nome: ['mecânico', 'mecânica'], trilha: 'mecanica', setor: 'manutencao', nivel: 2, salario: 3100, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 24, habilidade: { dominio: 'manual', minimo: 45, ouFormacao: true }, area: ['mecanica'], nivelCurso: 'livre', oferta: 0, estresse: 3 }),
  o({ id: 'dono_oficina', nome: ['dono de oficina', 'dona de oficina'], trilha: 'mecanica', setor: 'manutencao', nivel: 4, salario: 5600, contrato: 'autonomo', carga: 'integral', idadeMin: 23, experiencia: 60, entrada: 'negocio', oferta: 0, estresse: 4, promocao: 'clientela' }),
  o({ id: 'soldador', nome: ['soldador', 'soldadora'], trilha: 'industria', setor: 'industria', nivel: 2, salario: 3200, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['soldagem', 'mecanica'], nivelCurso: 'livre', oferta: 1, estresse: 3, risco: true }),
  o({ id: 'operador_producao', nome: ['operador de produção', 'operadora de produção'], trilha: 'industria', setor: 'industria', nivel: 1, salario: 2200, contrato: 'clt', carga: 'integral', idadeMin: 18, escolaridade: 'medio', oferta: 1, estresse: 3, declinio: 2055 }),
  o({ id: 'lider_producao', nome: ['líder de produção', 'líder de produção'], trilha: 'industria', setor: 'industria', nivel: 3, salario: 4100, contrato: 'clt', carga: 'integral', idadeMin: 23, escolaridade: 'medio', experiencia: 60, oferta: 1, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'tecnico_industrial', nome: ['técnico industrial', 'técnica industrial'], trilha: 'tecnico_industrial', setor: 'industria', nivel: 3, salario: 4500, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['eletrotecnica', 'mecanica'], nivelCurso: 'tecnico', oferta: 1, estresse: 3 }),
  o({ id: 'tecnico_automacao', nome: ['técnico em automação', 'técnica em automação'], trilha: 'tecnico_industrial', setor: 'industria', nivel: 3, salario: 5200, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['automacao'], nivelCurso: 'tecnico', oferta: 1, estresse: 3 }),
  o({ id: 'supervisor_manutencao', nome: ['supervisor de manutenção', 'supervisora de manutenção'], trilha: 'tecnico_industrial', setor: 'industria', nivel: 4, salario: 7600, contrato: 'clt', carga: 'integral', idadeMin: 26, area: ['eletrotecnica', 'mecanica', 'automacao'], nivelCurso: 'tecnico', experiencia: 84, oferta: 1, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'tec_seguranca', nome: ['técnico de segurança do trabalho', 'técnica de segurança do trabalho'], trilha: 'seguranca_trabalho', setor: 'industria', nivel: 3, salario: 3900, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['seguranca_trabalho'], nivelCurso: 'tecnico', oferta: 1, estresse: 3 }),

  // ---------------------------------------------------------------- Agro
  o({ id: 'trabalhador_rural', nome: ['trabalhador rural', 'trabalhadora rural'], trilha: 'agro', setor: 'agro', nivel: 1, salario: 1700, contrato: 'informal', carga: 'integral', idadeMin: 18, oferta: 0, estresse: 3, risco: true }),
  o({ id: 'operador_maquinas', nome: ['operador de máquinas agrícolas', 'operadora de máquinas agrícolas'], trilha: 'agro', setor: 'agro', nivel: 2, salario: 3300, contrato: 'clt', carga: 'integral', idadeMin: 18, experiencia: 24, oferta: 0, estresse: 3 }),
  o({ id: 'tecnico_agricola', nome: ['técnico agrícola', 'técnica agrícola'], trilha: 'agro', setor: 'agro', nivel: 3, salario: 4000, contrato: 'clt', carga: 'integral', idadeMin: 18, area: ['agro'], nivelCurso: 'tecnico', oferta: 0, estresse: 2 }),
  o({ id: 'agronomo', nome: ['agrônomo', 'agrônoma'], trilha: 'agro', setor: 'agro', nivel: 3, salario: 7200, contrato: 'clt', carga: 'integral', idadeMin: 23, area: ['agro'], nivelCurso: 'superior', licenca: 'crea', oferta: 0, estresse: 3, fundamento: 'Lei 5.194/1966: agronomia exige graduação e CREA.' }),
  o({ id: 'agronomo_consultor', nome: ['agrônomo consultor', 'agrônoma consultora'], trilha: 'agro', setor: 'agro', nivel: 4, salario: 11000, contrato: 'autonomo', carga: 'integral', idadeMin: 27, area: ['agro'], nivelCurso: 'superior', licenca: 'crea', experiencia: 60, oferta: 0, estresse: 3, promocao: 'clientela', jornada: 'fora' }),
  o({ id: 'gerente_fazenda', nome: ['gerente de fazenda', 'gerente de fazenda'], trilha: 'agro', setor: 'agro', nivel: 5, salario: 14000, contrato: 'clt', carga: 'integral', idadeMin: 30, area: ['agro'], nivelCurso: 'tecnico', experiencia: 120, oferta: 0, estresse: 4, anosNoPosto: 4 }),
  o({ id: 'produtor_rural', nome: ['produtor rural', 'produtora rural'], trilha: 'campo', setor: 'agro', nivel: 3, salario: 3600, contrato: 'autonomo', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'campo', minimo: 40 }, entrada: 'oportunidade', oferta: 0, estresse: 3, promocao: 'clientela' }),

  // ------------------------------------------------------ Design, imagem e texto
  o({ id: 'designer_jr', nome: ['designer júnior', 'designer júnior'], trilha: 'design', setor: 'criativo', nivel: 3, salario: 3400, contrato: 'clt', carga: 'integral', idadeMin: 20, area: ['design'], nivelCurso: 'superior', habilidade: { dominio: 'desenho', minimo: 68, ouFormacao: true }, oferta: 1, estresse: 3 }),
  o({ id: 'designer', nome: ['designer', 'designer'], trilha: 'design', setor: 'criativo', nivel: 4, salario: 6200, contrato: 'clt', carga: 'integral', idadeMin: 24, area: ['design'], nivelCurso: 'superior', habilidade: { dominio: 'desenho', minimo: 68, ouFormacao: true }, experiencia: 36, oferta: 2, estresse: 3, anosNoPosto: 3 }),
  o({ id: 'diretor_arte', nome: ['diretor de arte', 'diretora de arte'], trilha: 'design', setor: 'criativo', nivel: 5, salario: 11000, contrato: 'clt', carga: 'integral', idadeMin: 28, area: ['design'], nivelCurso: 'superior', habilidade: { dominio: 'desenho', minimo: 68, ouFormacao: true }, experiencia: 96, oferta: 3, estresse: 4, anosNoPosto: 4 }),
  o({ id: 'ilustrador', nome: ['ilustrador', 'ilustradora'], trilha: 'ilustracao', setor: 'criativo', nivel: 3, salario: 3200, contrato: 'autonomo', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'desenho', minimo: 62 }, oferta: 1, estresse: 3, promocao: 'clientela' }),
  o({ id: 'tatuador', nome: ['tatuador', 'tatuadora'], trilha: 'ilustracao', setor: 'criativo', nivel: 3, salario: 4200, contrato: 'autonomo', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'desenho', minimo: 55 }, oferta: 1, estresse: 2, promocao: 'clientela' }),
  o({ id: 'artesao', nome: ['artesão', 'artesã'], trilha: 'artesanato', setor: 'criativo', nivel: 2, salario: 1900, contrato: 'autonomo', carga: 'parcial', idadeMin: 16, habilidade: { dominio: 'manual', minimo: 40 }, oferta: 0, estresse: 1, promocao: 'clientela' }),
  o({ id: 'fotografo', nome: ['fotógrafo', 'fotógrafa'], trilha: 'imagem', setor: 'criativo', nivel: 3, salario: 3600, contrato: 'autonomo', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'fotografia', minimo: 55 }, oferta: 0, estresse: 3, promocao: 'clientela' }),
  o({ id: 'produtor_audiovisual', nome: ['produtor audiovisual', 'produtora audiovisual'], trilha: 'imagem', setor: 'criativo', nivel: 4, salario: 6500, contrato: 'autonomo', carga: 'integral', idadeMin: 23, habilidade: { dominio: 'fotografia', minimo: 62 }, experiencia: 36, oferta: 2, estresse: 4, promocao: 'clientela' }),
  o({ id: 'jornalista', nome: ['jornalista', 'jornalista'], trilha: 'comunicacao', setor: 'comunicacao', nivel: 3, salario: 4100, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['comunicacao', 'letras'], nivelCurso: 'superior', habilidade: { dominio: 'escrita', minimo: 70, ouFormacao: true }, oferta: 1, estresse: 4, jornada: 'longa', fundamento: 'Desde 2009 (STF) o diploma de Jornalismo não é obrigatório; o mercado ainda o prefere.' }),
  o({ id: 'redator', nome: ['redator', 'redatora'], trilha: 'comunicacao', setor: 'comunicacao', nivel: 3, salario: 3900, contrato: 'clt', carga: 'integral', idadeMin: 20, area: ['comunicacao', 'letras'], nivelCurso: 'superior', habilidade: { dominio: 'escrita', minimo: 62, ouFormacao: true }, oferta: 2, estresse: 3 }),
  o({ id: 'editor', nome: ['editor', 'editora'], trilha: 'comunicacao', setor: 'comunicacao', nivel: 4, salario: 7000, contrato: 'clt', carga: 'integral', idadeMin: 26, area: ['comunicacao', 'letras'], nivelCurso: 'superior', habilidade: { dominio: 'escrita', minimo: 62, ouFormacao: true }, experiencia: 60, oferta: 2, estresse: 4, anosNoPosto: 3 }),
  o({ id: 'criador_conteudo', nome: ['criador de conteúdo', 'criadora de conteúdo'], trilha: 'conteudo', setor: 'comunicacao', nivel: 3, salario: 4000, contrato: 'autonomo', carga: 'integral', idadeMin: 16, entrada: 'oportunidade', oferta: 0, estresse: 4, promocao: 'clientela' }),
  o({ id: 'escritor', nome: ['escritor', 'escritora'], trilha: 'literatura', setor: 'criativo', nivel: 4, salario: 3200, contrato: 'autonomo', carga: 'parcial', idadeMin: 18, habilidade: { dominio: 'escrita', minimo: 72 }, entrada: 'oportunidade', oferta: 0, estresse: 3 }),

  // -------------------------------------------------------- Música, cena e dança
  o({ id: 'musico_noite', nome: ['músico da noite', 'musicista da noite'], trilha: 'musica', setor: 'criativo', nivel: 2, salario: 2300, contrato: 'autonomo', carga: 'parcial', idadeMin: 18, habilidade: { dominio: 'musica', minimo: 52 }, oferta: 0, estresse: 3, promocao: 'clientela' }),
  o({ id: 'professor_musica', nome: ['professor de música', 'professora de música'], trilha: 'ensino_musica', setor: 'educacao', nivel: 3, salario: 2900, contrato: 'autonomo', carga: 'parcial', idadeMin: 18, habilidade: { dominio: 'musica', minimo: 62 }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'musico_profissional', nome: ['músico profissional', 'musicista profissional'], trilha: 'musica', setor: 'criativo', nivel: 4, salario: 6500, contrato: 'autonomo', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'musica', minimo: 70 }, entrada: 'oportunidade', oferta: 1, estresse: 4, jornada: 'fora', promocao: 'clientela' }),
  o({ id: 'musico_orquestra', nome: ['músico de orquestra', 'musicista de orquestra'], trilha: 'orquestra', setor: 'criativo', nivel: 4, salario: 8200, contrato: 'servidor', carga: 'integral', idadeMin: 18, habilidade: { dominio: 'musica', minimo: 80 }, concurso: true, oferta: 2, estresse: 3, promocao: 'antiguidade' }),
  o({ id: 'produtor_musical', nome: ['produtor musical', 'produtora musical'], trilha: 'musica', setor: 'criativo', nivel: 4, salario: 5200, contrato: 'autonomo', carga: 'integral', idadeMin: 22, habilidade: { dominio: 'musica', minimo: 62 }, experiencia: 36, oferta: 1, estresse: 3, promocao: 'clientela' }),
  o({ id: 'ator', nome: ['ator', 'atriz'], trilha: 'cena', setor: 'criativo', nivel: 3, salario: 2600, contrato: 'autonomo', carga: 'integral', idadeMin: 16, habilidade: { dominio: 'teatro', minimo: 58 }, entrada: 'oportunidade', oferta: 1, estresse: 4, promocao: 'clientela' }),
  o({ id: 'ator_reconhecido', nome: ['ator conhecido', 'atriz conhecida'], trilha: 'cena', setor: 'criativo', nivel: 5, salario: 15000, contrato: 'autonomo', carga: 'integral', idadeMin: 20, habilidade: { dominio: 'teatro', minimo: 75 }, entrada: 'oportunidade', oferta: 3, estresse: 4 }),
  o({ id: 'professor_danca', nome: ['professor de dança', 'professora de dança'], trilha: 'ensino_danca', setor: 'educacao', nivel: 3, salario: 2600, contrato: 'autonomo', carga: 'parcial', idadeMin: 18, habilidade: { dominio: 'danca', minimo: 60 }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'bailarino', nome: ['bailarino profissional', 'bailarina profissional'], trilha: 'danca', setor: 'criativo', nivel: 4, salario: 4200, contrato: 'clt', carga: 'integral', idadeMin: 17, habilidade: { dominio: 'danca', minimo: 72 }, entrada: 'oportunidade', oferta: 2, estresse: 4 }),

  // ------------------------------------------------------------- Esporte
  o({ id: 'jogador_futebol', nome: ['jogador de futebol', 'jogadora de futebol'], trilha: 'atleta', setor: 'esporte', nivel: 3, salario: 3200, contrato: 'clt', carga: 'integral', idadeMin: 16, entrada: 'oportunidade', oferta: 0, estresse: 4, risco: true, jornada: 'fora', fundamento: 'Lei Pelé (9.615/1998): contrato especial de trabalho desportivo, com prazo.' }),
  o({ id: 'atleta', nome: ['atleta profissional', 'atleta profissional'], trilha: 'atleta', setor: 'esporte', nivel: 3, salario: 2800, contrato: 'clt', carga: 'integral', idadeMin: 16, entrada: 'oportunidade', oferta: 0, estresse: 4, risco: true, jornada: 'fora' }),
  o({ id: 'treinador_escolinha', nome: ['treinador de escolinha', 'treinadora de escolinha'], trilha: 'treino', setor: 'esporte', nivel: 2, salario: 2200, contrato: 'autonomo', carga: 'parcial', idadeMin: 22, habilidade: { dominio: 'futebol', minimo: 62 }, oferta: 0, estresse: 2, promocao: 'clientela' }),
  o({ id: 'auxiliar_tecnico', nome: ['auxiliar técnico', 'auxiliar técnica'], trilha: 'treino', setor: 'esporte', nivel: 4, salario: 6500, contrato: 'clt', carga: 'integral', idadeMin: 28, entrada: 'oportunidade', oferta: 1, estresse: 4, jornada: 'fora' }),
  o({ id: 'arbitro', nome: ['árbitro de futebol', 'árbitra de futebol'], trilha: 'arbitragem', setor: 'esporte', nivel: 2, salario: 1800, contrato: 'autonomo', carga: 'parcial', idadeMin: 18, area: ['arbitragem'], nivelCurso: 'livre', escolaridade: 'medio', forma: 55, oferta: 1, estresse: 4 }),
  o({ id: 'personal', nome: ['personal trainer', 'personal trainer'], trilha: 'educacao_fisica', setor: 'esporte', nivel: 3, salario: 3800, contrato: 'autonomo', carga: 'integral', idadeMin: 22, area: ['educacao_fisica'], nivelCurso: 'superior', oferta: 0, estresse: 2, promocao: 'clientela', fundamento: 'Lei 9.696/1998: profissional de Educação Física exige graduação e CREF.' }),

  // ------------------------------------------------------ Segurança privada
  o({ id: 'vigilante', nome: ['vigilante', 'vigilante'], trilha: 'vigilancia', setor: 'seguranca', nivel: 1, salario: 2400, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['vigilancia'], nivelCurso: 'livre', escolaridade: 'fundamental', idoneidade: true, jornada: 'plantao', oferta: 0, estresse: 3, fundamento: 'Lei 7.102/1983: vigilante precisa de 21 anos e curso de formação.' }),

  // ------------------------------------------------------ Forças Armadas
  o({ id: 'soldado_ep', nome: ['soldado do Exército', 'soldado do Exército'], trilha: 'exercito_praca', setor: 'seguranca', nivel: 0, salario: 1500, contrato: 'militar', carga: 'integral', idadeMin: 18, idadeMax: 30, entrada: 'oportunidade', forma: 40, oferta: 0, estresse: 3, promocao: 'antiguidade', anosNoPosto: 1, idoneidade: true, fundamento: 'Serviço militar inicial (Lei 4.375/1964): obrigatório para homens aos 18, voluntário para mulheres desde 2025 (Decreto 12.154/2024); 12 meses, prorrogáveis até 8 anos como temporário (Lei 13.954/2019).' }),
  o({ id: 'cabo_ep', nome: ['cabo do Exército', 'cabo do Exército'], trilha: 'exercito_praca', setor: 'seguranca', nivel: 1, salario: 2600, contrato: 'militar', carga: 'integral', idadeMin: 19, idadeMax: 30, entrada: 'oportunidade', oferta: 0, estresse: 3, promocao: 'antiguidade' }),
  o({ id: 'aluno_sargento', nome: ['aluno da escola de sargentos', 'aluna da escola de sargentos'], trilha: 'exercito_sargento', setor: 'seguranca', nivel: 0, salario: 1900, contrato: 'militar', carga: 'integral', idadeMin: 17, idadeMaxIngresso: 24, escolaridade: 'medio', concurso: true, idoneidade: true, forma: 55, formacaoInicial: { meses: 24, destino: 'sargento' }, oferta: 0, estresse: 4, fundamento: 'Concurso de sargento: ensino médio, teste físico, inspeção de saúde e limite de idade (abstraído como 24 anos).' }),
  o({ id: 'sargento', nome: ['sargento do Exército', 'sargento do Exército'], trilha: 'exercito_sargento', setor: 'seguranca', nivel: 2, salario: 5900, contrato: 'militar', carga: 'integral', idadeMin: 19, entrada: 'oportunidade', oferta: 0, estresse: 3, promocao: 'antiguidade', anosNoPosto: 7 }),
  o({ id: 'subtenente', nome: ['subtenente do Exército', 'subtenente do Exército'], trilha: 'exercito_sargento', setor: 'seguranca', nivel: 3, salario: 8300, contrato: 'militar', carga: 'integral', idadeMin: 32, entrada: 'oportunidade', experiencia: 180, oferta: 0, estresse: 3, promocao: 'antiguidade' }),
  o({ id: 'cadete', nome: ['cadete da academia militar', 'cadete da academia militar'], trilha: 'exercito_oficial', setor: 'seguranca', nivel: 0, salario: 1600, contrato: 'militar', carga: 'integral', idadeMin: 17, idadeMaxIngresso: 22, escolaridade: 'medio', concurso: true, idoneidade: true, forma: 60, formacaoInicial: { meses: 60, destino: 'tenente' }, oferta: 0, estresse: 4, fundamento: 'Escola preparatória e academia de oficiais: médio, prova difícil, teste físico e limite de idade (abstraído como 22 anos).' }),
  o({ id: 'tenente', nome: ['tenente do Exército', 'tenente do Exército'], trilha: 'exercito_oficial', setor: 'seguranca', nivel: 3, salario: 9000, contrato: 'militar', carga: 'integral', idadeMin: 22, entrada: 'oportunidade', oferta: 0, estresse: 4, promocao: 'antiguidade', anosNoPosto: 6 }),
  o({ id: 'capitao', nome: ['capitão do Exército', 'capitã do Exército'], trilha: 'exercito_oficial', setor: 'seguranca', nivel: 4, salario: 12500, contrato: 'militar', carga: 'integral', idadeMin: 27, entrada: 'oportunidade', experiencia: 72, oferta: 0, estresse: 4, promocao: 'antiguidade', anosNoPosto: 7 }),
  o({ id: 'major', nome: ['major do Exército', 'major do Exército'], trilha: 'exercito_oficial', setor: 'seguranca', nivel: 5, salario: 16500, contrato: 'militar', carga: 'integral', idadeMin: 34, entrada: 'oportunidade', experiencia: 156, oferta: 0, estresse: 4, promocao: 'antiguidade' }),

  // ------------------------------------------------------ Polícias e bombeiros
  o({ id: 'aluno_pm', nome: ['aluno soldado da PM', 'aluna soldado da PM'], trilha: 'pm', setor: 'seguranca', nivel: 0, salario: 3300, contrato: 'militar', carga: 'integral', idadeMin: 18, idadeMaxIngresso: 30, escolaridade: 'medio', concurso: true, idoneidade: true, forma: 55, formacaoInicial: { meses: 12, destino: 'soldado_pm' }, oferta: 0, estresse: 4, fundamento: 'Concurso estadual; escolaridade, CNH e limite de idade variam por estado (abstraídos: médio, 30 anos; a CNH, quando exigida, pode ser apresentada até a formatura).' }),
  o({ id: 'soldado_pm', nome: ['soldado da PM', 'soldado da PM'], trilha: 'pm', setor: 'seguranca', nivel: 2, salario: 5000, contrato: 'militar', carga: 'integral', idadeMin: 19, entrada: 'oportunidade', oferta: 0, estresse: 5, risco: true, promocao: 'antiguidade', anosNoPosto: 6, jornada: 'plantao' }),
  o({ id: 'cabo_pm', nome: ['cabo da PM', 'cabo da PM'], trilha: 'pm', setor: 'seguranca', nivel: 3, salario: 6000, contrato: 'militar', carga: 'integral', idadeMin: 25, entrada: 'oportunidade', experiencia: 72, oferta: 0, estresse: 5, risco: true, promocao: 'antiguidade', anosNoPosto: 7, jornada: 'longa' }),
  o({ id: 'sargento_pm', nome: ['sargento da PM', 'sargento da PM'], trilha: 'pm', setor: 'seguranca', nivel: 4, salario: 7600, contrato: 'militar', carga: 'integral', idadeMin: 31, entrada: 'oportunidade', experiencia: 156, oferta: 0, estresse: 4, risco: true, promocao: 'antiguidade' }),
  o({ id: 'aluno_bombeiro', nome: ['aluno do curso de bombeiros', 'aluna do curso de bombeiros'], trilha: 'bombeiro', setor: 'seguranca', nivel: 0, salario: 3300, contrato: 'militar', carga: 'integral', idadeMin: 18, idadeMaxIngresso: 30, escolaridade: 'medio', concurso: true, idoneidade: true, forma: 62, formacaoInicial: { meses: 12, destino: 'bombeiro' }, oferta: 1, estresse: 4, fundamento: 'Concurso estadual com teste físico exigente e limite de idade (abstraído como 30 anos).' }),
  o({ id: 'bombeiro', nome: ['bombeiro militar', 'bombeira militar'], trilha: 'bombeiro', setor: 'seguranca', nivel: 2, salario: 5200, contrato: 'militar', carga: 'integral', idadeMin: 19, entrada: 'oportunidade', oferta: 1, estresse: 4, risco: true, promocao: 'antiguidade', anosNoPosto: 7, jornada: 'plantao' }),
  o({ id: 'sargento_bombeiro', nome: ['sargento bombeiro', 'sargento bombeira'], trilha: 'bombeiro', setor: 'seguranca', nivel: 3, salario: 7800, contrato: 'militar', carga: 'integral', idadeMin: 28, entrada: 'oportunidade', experiencia: 120, oferta: 1, estresse: 4, risco: true, promocao: 'antiguidade' }),
  o({ id: 'guarda_municipal', nome: ['guarda municipal', 'guarda municipal'], trilha: 'guarda', setor: 'seguranca', nivel: 2, salario: 3600, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'medio', concurso: true, idoneidade: true, forma: 45, oferta: 1, estresse: 3, promocao: 'antiguidade' }),
  o({ id: 'policial_civil', nome: ['investigador de polícia', 'investigadora de polícia'], trilha: 'policia_civil', setor: 'seguranca', nivel: 3, salario: 8500, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'superior', concurso: true, idoneidade: true, forma: 50, oferta: 1, estresse: 5, risco: true, promocao: 'antiguidade', jornada: 'longa' }),
  o({ id: 'delegado', nome: ['delegado de polícia', 'delegada de polícia'], trilha: 'policia_civil', setor: 'seguranca', nivel: 5, salario: 19000, contrato: 'servidor', carga: 'integral', idadeMin: 23, area: ['direito'], nivelCurso: 'superior', concurso: true, idoneidade: true, forma: 45, oferta: 1, estresse: 5, promocao: 'antiguidade', fundamento: 'Delegado exige bacharelado em Direito (Lei 12.830/2013); alguns estados pedem prática jurídica.' }),

  // ------------------------------------------------ Finanças e serviço público
  o({ id: 'analista_financeiro', nome: ['analista financeiro', 'analista financeira'], trilha: 'financas', setor: 'financas', nivel: 3, salario: 5800, contrato: 'clt', carga: 'integral', idadeMin: 21, area: ['economia', 'administracao', 'contabilidade', 'exatas'], nivelCurso: 'superior', oferta: 2, estresse: 4 }),
  o({ id: 'gerente_banco', nome: ['gerente de banco', 'gerente de banco'], trilha: 'financas', setor: 'financas', nivel: 4, salario: 9500, contrato: 'clt', carga: 'integral', idadeMin: 26, escolaridade: 'superior', experiencia: 60, oferta: 0, estresse: 5, anosNoPosto: 3 }),
  o({ id: 'escriturario_banco', nome: ['escriturário de banco público', 'escriturária de banco público'], trilha: 'financas', setor: 'financas', nivel: 2, salario: 4500, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'medio', concurso: true, oferta: 0, estresse: 3 }),
  o({ id: 'tecnico_publico', nome: ['técnico administrativo concursado', 'técnica administrativa concursada'], trilha: 'publico', setor: 'publico', nivel: 3, salario: 5200, contrato: 'servidor', carga: 'integral', idadeMin: 18, escolaridade: 'medio', concurso: true, oferta: 0, estresse: 2, promocao: 'antiguidade' }),
  o({ id: 'chefe_setor', nome: ['chefe de setor no serviço público', 'chefe de setor no serviço público'], trilha: 'publico', setor: 'publico', nivel: 4, salario: 7800, contrato: 'servidor', carga: 'integral', idadeMin: 28, escolaridade: 'medio', experiencia: 96, oferta: 0, estresse: 3, anosNoPosto: 4 }),
  o({ id: 'analista_judiciario', nome: ['analista judiciário', 'analista judiciária'], trilha: 'judiciario', setor: 'publico', nivel: 4, salario: 13000, contrato: 'servidor', carga: 'integral', idadeMin: 21, escolaridade: 'superior', concurso: true, oferta: 1, estresse: 3, promocao: 'antiguidade' }),
  o({ id: 'auditor_fiscal', nome: ['auditor fiscal', 'auditora fiscal'], trilha: 'fiscal', setor: 'publico', nivel: 5, salario: 22000, contrato: 'servidor', carga: 'integral', idadeMin: 21, escolaridade: 'superior', concurso: true, oferta: 2, estresse: 4, promocao: 'antiguidade' })
];

const POR_ID = new Map(OCUPACOES.map(x => [x.id, x]));
export function ocupacao(id: string): Ocupacao {
  const x = POR_ID.get(id);
  if (!x) throw new Error(`Ocupação desconhecida: ${id}`);
  return x;
}
export const ocupacaoOuNula = (id: string) => POR_ID.get(id);

/** Índice por trilha (evita varrer o catálogo inteiro a cada promoção). */
const POR_TRILHA = new Map<string, Ocupacao[]>();
for (const x of OCUPACOES) POR_TRILHA.set(x.trilha, [...(POR_TRILHA.get(x.trilha) ?? []), x]);
export const daTrilha = (trilha: string): readonly Ocupacao[] => POR_TRILHA.get(trilha) ?? [];

/**
 * Trilhas afins: experiência numa conta, em parte, na outra. Quem foi
 * vendedor de loja sabe vender como representante; quem foi atleta conhece
 * o treino; quem foi técnico de enfermagem conhece o hospital.
 */
export const AFINS: Record<string, string[]> = {
  comercio: ['vendas', 'informal'], vendas: ['comercio'], informal: ['comercio'],
  alimentacao: ['confeitaria'], confeitaria: ['alimentacao'],
  administrativo: ['publico', 'logistica', 'contabil', 'financas'], logistica: ['administrativo', 'industria'],
  industria: ['tecnico_industrial', 'manutencao', 'logistica'], tecnico_industrial: ['industria', 'manutencao', 'eletrica', 'mecanica'],
  manutencao: ['eletrica', 'mecanica', 'construcao'], eletrica: ['manutencao', 'tecnico_industrial'], mecanica: ['manutencao', 'tecnico_industrial'],
  construcao: ['manutencao'], atleta: ['treino'], treino: ['atleta', 'educacao_fisica'],
  enfermagem: ['cuidado', 'saude_publica'], cuidado: ['enfermagem'], ti: ['dados'], dados: ['ti', 'financas'],
  design: ['ilustracao', 'imagem'], ilustracao: ['design'], imagem: ['design', 'conteudo'], conteudo: ['imagem', 'comunicacao'],
  comunicacao: ['conteudo', 'literatura'], musica: ['orquestra', 'ensino_musica'], orquestra: ['musica', 'ensino_musica'], ensino_musica: ['musica'], danca: ['ensino_danca'], ensino_danca: ['danca'],
  exercito_praca: ['exercito_sargento', 'pm', 'vigilancia', 'guarda'], pm: ['guarda', 'vigilancia'], guarda: ['pm', 'vigilancia'],
  agro: ['campo', 'veterinaria', 'pesca'], campo: ['agro'], pesca: ['campo'], educacao: ['ensino_tecnico', 'idiomas'], publico: ['administrativo'],
  domestico: ['cuidado', 'limpeza'], limpeza: ['domestico', 'predial'], predial: ['limpeza', 'manutencao', 'vigilancia'], posto: ['comercio'],
  atendimento: ['administrativo', 'comercio'], reciclagem: ['informal'], hidraulica: ['construcao', 'manutencao'], marcenaria: ['construcao', 'manutencao'],
  reparos: ['manutencao', 'ti'], costura: ['artesanato', 'industria'], vigilancia: ['guarda', 'predial', 'exercito_praca'], penal: ['guarda', 'vigilancia'],
  pm_oficial: ['pm'], exercito_sargento: ['exercito_praca'], exercito_oficial: ['exercito_sargento'], pesquisa: ['academia'], academia: ['pesquisa', 'educacao'],
  estrada: ['logistica', 'transporte'], transporte: ['estrada']
};

export const ROTULO_TRILHA: Record<string, string> = {
  informal: 'trabalho de rua', cuidado: 'cuidado de pessoas', transporte: 'aplicativos', estrada: 'direção profissional', beleza: 'beleza',
  comercio: 'comércio', vendas: 'vendas', alimentacao: 'cozinha', confeitaria: 'confeitaria', administrativo: 'escritório',
  contabil: 'contabilidade', logistica: 'logística', ti: 'tecnologia', dados: 'dados', enfermagem: 'enfermagem', radiologia: 'radiologia',
  saude_publica: 'saúde pública', medicina: 'medicina', psicologia: 'psicologia', nutricao: 'nutrição', fisioterapia: 'fisioterapia',
  odontologia: 'odontologia', farmacia: 'farmácia', veterinaria: 'veterinária', educacao_fisica: 'educação física', direito: 'direito',
  engenharia: 'engenharia civil', arquitetura: 'arquitetura', eng_industrial: 'engenharia industrial', educacao: 'educação',
  idiomas: 'ensino de idiomas', ensino_tecnico: 'ensino técnico', academia: 'vida acadêmica', construcao: 'construção',
  manutencao: 'manutenção', eletrica: 'elétrica', mecanica: 'mecânica', industria: 'indústria', tecnico_industrial: 'indústria (técnica)',
  seguranca_trabalho: 'segurança do trabalho', agro: 'agropecuária', campo: 'produção rural', design: 'design', ilustracao: 'ilustração',
  artesanato: 'artesanato', imagem: 'fotografia e vídeo', comunicacao: 'comunicação', conteudo: 'internet', literatura: 'literatura',
  musica: 'música', orquestra: 'música de orquestra', ensino_musica: 'ensino de música', cena: 'teatro e audiovisual', danca: 'dança', ensino_danca: 'ensino de dança', atleta: 'esporte profissional',
  treino: 'treino esportivo', arbitragem: 'arbitragem', vigilancia: 'segurança privada', exercito_praca: 'serviço militar',
  exercito_sargento: 'carreira militar', exercito_oficial: 'carreira militar (oficial)', pm: 'Polícia Militar', bombeiro: 'Corpo de Bombeiros', guarda: 'guarda municipal',
  policia_civil: 'Polícia Civil', financas: 'finanças', publico: 'serviço público', judiciario: 'Judiciário', fiscal: 'fiscalização',
  domestico: 'trabalho doméstico', limpeza: 'limpeza', predial: 'portaria e zeladoria', posto: 'posto de combustível', atendimento: 'atendimento',
  reciclagem: 'reciclagem', hidraulica: 'hidráulica', marcenaria: 'marcenaria', reparos: 'conserto de aparelhos', costura: 'costura', pesca: 'pesca',
  pesquisa: 'pesquisa', penal: 'polícia penal', pericia: 'perícia criminal', federal: 'polícia federal de estrada', pm_oficial: 'oficialato da PM'
};

export const ROTULO_SETOR: Record<Setor, string> = {
  comercio: 'comércio', alimentacao: 'alimentação', beleza: 'beleza', cuidado: 'cuidado', transporte: 'transporte', logistica: 'logística',
  industria: 'indústria', construcao: 'construção', manutencao: 'manutenção', agro: 'agro', saude: 'saúde', educacao: 'educação',
  tecnologia: 'tecnologia', criativo: 'arte e criação', comunicacao: 'comunicação', esporte: 'esporte', seguranca: 'segurança',
  publico: 'serviço público', financas: 'finanças', juridico: 'direito', administrativo: 'escritório', engenharia: 'engenharia'
};

/** Ocupações típicas dos pais por classe — para gerar a família de origem. */
export const OCUPACOES_POR_CLASSE: Record<string, string[]> = {
  vulneravel: ['ambulante', 'diarista', 'ajudante_obras', 'trabalhador_rural', 'manicure', 'aux_cozinha', 'entregador_app', 'cuidador', 'estoquista', 'catador', 'trabalhador_domestico', 'aux_limpeza', 'feirante', 'pescador', 'costureiro'],
  trabalhadora: ['atendente', 'caixa', 'pedreiro', 'mecanico', 'aux_adm', 'garcom', 'cozinheiro', 'motorista_app', 'cabeleireiro', 'aux_manutencao', 'tec_enfermagem', 'operador_maquinas', 'operador_producao', 'vigilante', 'barbeiro', 'confeiteiro', 'motorista_onibus', 'caminhoneiro', 'porteiro', 'frentista', 'padeiro', 'pintor', 'encanador', 'operador_telemarketing', 'motorista_caminhao', 'baba'],
  media_baixa: ['vendedor', 'assistente_adm', 'tec_enfermagem', 'eletricista', 'supervisor_loja', 'professor_fund', 'escriturario_banco', 'tecnico_industrial', 'tecnico_publico', 'soldado_pm', 'sargento', 'dono_lanchonete', 'dono_comercio', 'agente_saude', 'produtor_rural', 'guarda_municipal', 'marceneiro', 'tecnico_refrigeracao', 'policial_penal', 'zelador'],
  media: ['analista_adm', 'enfermeiro', 'contador', 'professor_concursado', 'gerente_loja', 'dev_pleno', 'eng_jr', 'psicologo', 'advogado_jr', 'gerente_banco', 'fisioterapeuta', 'dono_oficina', 'agronomo', 'representante', 'farmaceutico', 'capitao'],
  alta: ['medico', 'advogado', 'eng_pleno', 'gerente_adm', 'dev_senior', 'analista_judiciario', 'socio_advocacia', 'medico_especialista', 'auditor_fiscal', 'dentista', 'delegado', 'gerente_industrial']
};
