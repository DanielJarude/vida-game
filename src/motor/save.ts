/**
 * Save.
 *
 * A `Vida` é JSON puro, então salvar é serializar. O cuidado está em LER:
 * validar a forma, migrar saves antigos (v1–v5 do motor anterior) e nunca
 * corromper silenciosamente — um save que não pode ser lido é guardado em
 * backup e o jogo começa do zero com aviso, em vez de travar.
 *
 * MIGRAÇÃO v5 → v6 (melhor esforço):
 *   - personagem, cidade, classe, atributos e personalidade: preservados;
 *   - família e rede social: viram pessoas com vínculo (tipo → parentesco/estágio/romance);
 *   - escolaridade, curso em andamento e cursos concluídos: mapeados para o catálogo novo;
 *   - emprego atual e histórico: mapeados para as ocupações novas (experiência por trilha);
 *   - dinheiro, investimentos, dívidas e bens: preservados em valor;
 *   - Linha da Vida: preservada inteira, com relevância e tema mapeados;
 *   - NÃO migra: evento aberto (o catálogo antigo não existe mais) e histórico
 *     de eventos (os ids mudaram) — marcos de infância já vividos são marcados
 *     para não se repetirem.
 */

import type {
  Classe, Entrada, Escolaridade, EstiloDeVida, Genero, Parentesco, Pessoa, Relevancia, Tema, Vida, Vinculo
} from './tipos';
import { tDe, idadeEm } from './tempo';
import { municipioPorNome, MUNICIPIOS } from './dados/lugares';
import { cursoOuNulo } from './dados/cursos';
import { ocupacaoOuNula } from './dados/ocupacoes';
import { modeloVeiculo } from './dados/bens';
import { temperamentoAleatorio } from './nucleo';
import { criarRng } from './rng';
import { visualAleatorio } from './pessoas';
import { capitalDoEstado } from './sistemas/escola';

export const VERSAO_SAVE = 6;
export const CHAVE_SAVE = 'VIDA_GAME_SAVE_V1';
export const CHAVE_BACKUP = 'VIDA_GAME_SAVE_BACKUP';
export const CHAVE_ESTATISTICAS = 'VIDA_GLOBAL_STATS_V1';

export interface Armazenamento {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function armazenamentoPadrao(): Armazenamento | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function salvar(v: Vida, s: Armazenamento | null = armazenamentoPadrao()): boolean {
  if (!s) return false;
  try {
    s.setItem(CHAVE_SAVE, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
}

export function apagarSave(s: Armazenamento | null = armazenamentoPadrao()): void {
  try { s?.removeItem(CHAVE_SAVE); } catch { /* sem armazenamento */ }
}

export type Leitura =
  | { tipo: 'vazio' }
  | { tipo: 'ok'; vida: Vida; migrado: boolean }
  | { tipo: 'invalido'; motivo: string };

export function ler(s: Armazenamento | null = armazenamentoPadrao()): Leitura {
  if (!s) return { tipo: 'vazio' };
  let bruto: string | null = null;
  try { bruto = s.getItem(CHAVE_SAVE); } catch { return { tipo: 'vazio' }; }
  if (!bruto) return { tipo: 'vazio' };
  const res = interpretar(bruto);
  if (res.tipo === 'invalido') {
    try { s.setItem(CHAVE_BACKUP, bruto); } catch { /* sem espaço */ }
  }
  if (res.tipo === 'ok' && res.migrado) {
    try { s.setItem(CHAVE_BACKUP, bruto); s.setItem(CHAVE_SAVE, JSON.stringify(res.vida)); } catch { /* segue em memória */ }
  }
  return res;
}

export function interpretar(bruto: string): Leitura {
  let dados: unknown;
  try { dados = JSON.parse(bruto); } catch { return { tipo: 'invalido', motivo: 'O save não é um JSON válido.' }; }
  if (!dados || typeof dados !== 'object') return { tipo: 'invalido', motivo: 'Formato desconhecido.' };
  const d = dados as Record<string, unknown>;
  if (d.versao === VERSAO_SAVE) {
    const erro = validarV6(d);
    return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: d as unknown as Vida, migrado: false };
  }
  if (typeof d.versao === 'number' && d.versao < VERSAO_SAVE || d.personagem) {
    try {
      const v = migrarV5(d);
      if (!v) return { tipo: 'invalido', motivo: 'Esta vida já tinha terminado.' };
      const erro = validarV6(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível migrar o save antigo (${(e as Error).message}).` };
    }
  }
  return { tipo: 'invalido', motivo: 'Versão de save desconhecida.' };
}

function validarV6(d: Record<string, unknown>): string | null {
  const obrig = ['eu', 'corpo', 'mente', 'pessoas', 'vinculos', 'moradia', 'educacao', 'trabalho', 'financas', 'biografia'];
  for (const k of obrig) if (!d[k] || typeof d[k] !== 'object') return `Campo ausente: ${k}.`;
  if (typeof d.t !== 'number' || !Number.isFinite(d.t)) return 'Tempo inválido.';
  const eu = d.eu as Record<string, unknown>;
  if (typeof eu.nome !== 'string' || typeof eu.tNasc !== 'number') return 'Personagem inválido.';
  if (!Array.isArray(d.biografia)) return 'Linha da Vida inválida.';
  const vinculos = d.vinculos as Record<string, { pessoaId: string }>;
  const pessoas = d.pessoas as Record<string, unknown>;
  for (const vin of Object.values(vinculos)) if (!pessoas[vin.pessoaId]) return 'Vínculo aponta para pessoa inexistente.';
  return null;
}

/* =================================================================== v5 → v6 */

type Antigo = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const CLASSE: Record<string, Classe> = {
  vulneravel: 'vulneravel', trabalhadora: 'trabalhadora', classe_media_baixa: 'media_baixa', classe_media: 'media', classe_alta: 'alta'
};
const ESCOLARIDADE: Record<string, Escolaridade> = {
  nenhuma: 'nenhuma', fundamental_incompleto: 'fundamental_incompleto', fundamental_completo: 'fundamental',
  medio_incompleto: 'medio_incompleto', medio_completo: 'medio', tecnico: 'tecnico',
  superior_incompleto: 'superior_incompleto', superior_completo: 'superior', pos_graduacao: 'pos'
};
const CURSO: Record<string, string> = {
  tec_ti: 'tec_informatica', tec_eletrotecnica: 'tec_eletrotecnica', tec_enfermagem: 'tec_enfermagem', tec_adm: 'tec_administracao',
  sup_medicina: 'medicina', sup_direito: 'direito', sup_eng_software: 'computacao', sup_eng_civil: 'eng_civil', sup_adm: 'administracao',
  sup_enfermagem: 'enfermagem', sup_psicologia: 'psicologia', sup_pedagogia: 'pedagogia', sup_design: 'design', sup_ed_fisica: 'ed_fisica',
  sup_economia: 'economia', pos_mba_executivo: 'mba', pos_especializacao_medica: 'residencia'
};
const CURSO_POR_NOME: [RegExp, string][] = [
  [/medicina/i, 'medicina'], [/direito/i, 'direito'], [/software|computa/i, 'computacao'], [/civil/i, 'eng_civil'],
  [/administra/i, 'administracao'], [/enfermagem/i, 'enfermagem'], [/psicolog/i, 'psicologia'], [/pedagog|licencia/i, 'pedagogia'],
  [/design/i, 'design'], [/f[ií]sica/i, 'ed_fisica'], [/econ/i, 'economia'], [/mba/i, 'mba'], [/resid|especializa/i, 'residencia'],
  [/desenvolvimento de sistemas|inform/i, 'tec_informatica'], [/eletrot/i, 'tec_eletrotecnica']
];
const OCUPACAO: Record<string, string> = {
  jovem_aprendiz: 'jovem_aprendiz', estagiario: 'estagio_adm', atendente: 'atendente', garcom: 'garcom', vendedor: 'vendedor',
  gerente_comercial: 'gerente_loja', aux_eletrica: 'aux_manutencao', eletricista: 'eletricista', mecanico: 'mecanico',
  tec_suporte_ti: 'suporte_ti', aux_adm: 'aux_adm', analista_jr: 'analista_adm', analista_pleno: 'analista_adm',
  gerente_corporativo: 'gerente_adm', diretor_operacoes: 'gerente_adm', dev_junior: 'dev_jr', dev_pleno: 'dev_pleno',
  dev_senior: 'dev_senior', tech_lead: 'tech_lead', tec_enfermagem_job: 'tec_enfermagem', enfermeiro_chefe: 'enfermeiro_chefe',
  psicologo_clinico: 'psicologo_clinico', medico_geral: 'medico', medico_especialista: 'medico_especialista',
  eng_civil_jr: 'eng_jr', eng_civil_pleno: 'eng_pleno', gerente_obras: 'gerente_obras', advogado_jr: 'advogado_jr',
  advogado_senior: 'advogado', concurso_tecnico: 'tecnico_publico', concurso_analista: 'analista_judiciario',
  concurso_auditor: 'auditor_fiscal', professor_fundamental: 'professor_fund', professor_medio: 'professor_fund',
  professor_universitario: 'professor_univ', mestre_obras: 'mestre_obras'
};
const ESTILO: Record<string, EstiloDeVida> = { modesto: 'modesto', confortavel: 'confortavel', luxuoso: 'folgado' };

const RELEVANCIA: Record<string, Relevancia> = { marco: 'marco', normal: 'biografia', textura: 'cotidiano' };
const TEMA: Record<string, Tema> = {
  geral: 'infancia', familia: 'familia', amizade: 'amizade', lazer: 'lazer', escola: 'escola', carreira: 'trabalho',
  amor: 'amor', saude: 'saude', financas: 'dinheiro', evento: 'escolha', morte: 'morte', cotidiano: 'infancia'
};

function hashTexto(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function generoNovo(g: unknown): Genero {
  return g === 'feminino' ? 'feminino' : g === 'masculino' ? 'masculino' : 'nao_binario';
}

export function migrarV5(a: Antigo): Vida | null {
  if (a.morto) return null;
  const p = a.personagem;
  if (!p || typeof p.nome !== 'string') throw new Error('sem personagem');
  const r = criarRng(hashTexto(String(p.id ?? p.nome)));
  const anoAtual = Number(p.anoAtual) || 2026;
  const idadeAtual = Number(p.idade) || 0;
  const t = tDe(anoAtual, 0);
  const tNasc = t - idadeAtual * 12;
  const municipio = municipioPorNome(p.cidade, p.estado)?.id
    ?? MUNICIPIOS.find(m => m.uf === p.estado && m.capital)?.id
    ?? (p.estado ? capitalDoEstado(MUNICIPIOS.find(m => m.uf === p.estado)?.id ?? 'sao-paulo-sp') : 'sao-paulo-sp');
  const genero = generoNovo(p.genero);
  const classe = CLASSE[p.classeSocial] ?? 'trabalhadora';
  const tracos = { empatia: 0, generosidade: 0, disciplina: 0, impulsividade: 0, coragem: 0, sociabilidade: 0, independencia: 0, familia: 0 };
  for (const k of Object.keys(tracos) as (keyof typeof tracos)[]) {
    const val = a.personalidade?.tracos?.[k];
    if (typeof val === 'number' && Number.isFinite(val)) tracos[k] = Math.max(-100, Math.min(100, Math.round(val)));
  }

  const v: Vida = {
    versao: 6,
    id: `vida-migrada-${hashTexto(String(p.id ?? p.nome)).toString(36)}`,
    rng: r.estado(),
    seq: 5000,
    t,
    eu: {
      nome: p.nome, sobrenome: p.sobrenome ?? '', genero, tNasc, municipioNatal: municipio,
      visual: visualAleatorio(r, genero)
    },
    corpo: {
      saude: num(p.stats?.saude, 80), forma: num(p.hiddenStats?.condicionamentoFisico, 50), aparencia: num(p.stats?.aparencia, 55),
      condicoes: [], habitos: { fuma: false, bebe: 'nao', sedentario: false }, podeGestar: genero === 'feminino'
    },
    mente: { felicidade: num(p.stats?.felicidade, 70), estresse: num(p.hiddenStats?.estresse, 20), cognicao: num(p.stats?.inteligencia, 55) },
    personalidade: { tracos, evidencias: [] },
    pessoas: {},
    vinculos: {},
    origem: { classe, arranjo: 'pais_juntos' },
    moradia: { tipo: 'pais', municipioId: municipio, aluguel: 0, padrao: 3, tInicio: t },
    educacao: { escolaridade: ESCOLARIDADE[a.educacao?.nivelAtual] ?? 'nenhuma', evadiu: false, concluidos: [], enem: [], postura: 'normal', cursinho: false },
    trabalho: { historico: [], experiencia: {}, candidaturas: [], contribuicao: 0, licencas: [], horasExtras: false },
    financas: {
      conta: num(a.economia?.dinheiro, 0, -1e9, 1e12), reserva: 0, acoes: 0, dividas: [], bens: [],
      estilo: ESTILO[a.economia?.padraoDeVida] ?? 'modesto', planoDeSaude: classe === 'media' || classe === 'alta', negativado: false, razao: []
    },
    processos: [],
    rotinas: [],
    fatos: {},
    biografia: [],
    momento: null,
    ocorrencias: [],
    anoAtual: { acoes: [] }
  };

  // Família e rede social
  let temPais = false;
  for (const m of Array.isArray(a.familia) ? a.familia : []) {
    if (!m || typeof m.nome !== 'string') continue;
    const tipo = String(m.tipo);
    const pessoa: Pessoa = {
      id: String(m.id ?? `p${v.seq++}`), nome: m.nome, sobrenome: m.sobrenome ?? '', genero: generoNovo(m.genero),
      tNasc: t - num(m.idade, 30, 0, 120) * 12, vivo: m.vivo !== false, temperamento: temperamentoAleatorio(r),
      ocupacao: m.profissao, renda: num(m.renda, 0, 0, 1e6), municipioId: municipio, saude: 80,
      especie: tipo === 'pet' ? 'cachorro' : undefined, visual: tipo === 'pet' ? undefined : visualAleatorio(r, generoNovo(m.genero))
    };
    const vin: Vinculo = {
      pessoaId: pessoa.id, origem: 'familia', tInicio: t, proximidade: num(m.relacionamento, 50), tensao: 0,
      convivio: [], tUltimoContato: t, historia: []
    };
    const parentesco: Record<string, Parentesco> = { pai: 'pai', mae: 'mae', irmao: 'irmao', irma: 'irmao', filho: 'filho', filha: 'filho', pet: 'pet' };
    if (parentesco[tipo]) {
      vin.parentesco = parentesco[tipo];
      if (tipo === 'pai' || tipo === 'mae') temPais = temPais || pessoa.vivo;
    } else if (['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'].includes(tipo)) {
      vin.origem = 'romance';
      vin.estagio = 'amigo';
      vin.romance = { estagio: tipo.startsWith('espos') ? 'casamento' : 'namoro', tEstagio: t - 12, envolvimento: num(m.relacionamento, 60), planoFilhos: 'evitando' };
      if (tipo.startsWith('noiv')) v.fatos[`noivado_${pessoa.id}`] = t;
      pessoa.atracao = 'ambos';
    } else {
      vin.origem = (m.origemSocial as Vinculo['origem']) ?? 'apresentado';
      vin.estagio = tipo === 'colega' ? 'colega' : tipo === 'rival' ? 'conhecido' : m.ativo === false ? 'afastado' : 'amigo';
      if (tipo === 'rival') vin.tensao = 60;
      if (tipo === 'paixao') vin.romance = { estagio: 'interesse', tEstagio: t, envolvimento: 45 };
    }
    v.pessoas[pessoa.id] = pessoa;
    v.vinculos[pessoa.id] = vin;
  }

  // Moradia: adulto com imóvel mora nele; criança e jovem com pais moram com eles.
  const imoveis = (Array.isArray(a.economia?.propriedades) ? a.economia.propriedades : []).filter((x: Antigo) => x.tipo === 'imovel');
  const casado = Object.values(v.vinculos).some(x => x.romance?.estagio === 'casamento');
  if (idadeAtual >= 18 && (imoveis.length > 0 || casado || !temPais)) {
    v.moradia = imoveis.length
      ? { tipo: 'propria', municipioId: municipio, aluguel: 0, padrao: 3, tInicio: t, modeloId: 'apto_2q' }
      : { tipo: 'aluguel', municipioId: municipio, aluguel: 1300, padrao: 3, tInicio: t, modeloId: 'apto_2q' };
  }
  for (const vin of Object.values(v.vinculos)) {
    const pessoa = v.pessoas[vin.pessoaId];
    if (!pessoa.vivo) continue;
    const idadeP = idadeEm(pessoa.tNasc, t);
    if (v.moradia.tipo === 'pais' && ['mae', 'pai', 'irmao', 'pet'].includes(vin.parentesco ?? '')) vin.convivio = ['casa'];
    if (v.moradia.tipo !== 'pais' && (vin.romance?.estagio === 'casamento' || (vin.parentesco === 'filho' && idadeP < 18) || vin.parentesco === 'pet')) vin.convivio = ['casa'];
  }

  // Educação
  const edu = a.educacao ?? {};
  if (edu.emCurso && (edu.tipoCurso === 'fundamental' || edu.tipoCurso === 'medio')) {
    const serie = edu.tipoCurso === 'medio' ? Math.max(1, Math.min(3, idadeAtual - 14)) : Math.max(1, Math.min(9, idadeAtual - 5));
    v.educacao.basica = { etapa: edu.tipoCurso === 'medio' ? 'medio' : serie <= 5 ? 'fundamental1' : 'fundamental2', serie, rede: edu.isPublica === false ? 'privada' : 'publica', desempenho: num(edu.desempenho, 60), reprovacoes: 0 };
  } else if (edu.emCurso && edu.nomeCurso) {
    const cursoId = CURSO_POR_NOME.find(([re]) => re.test(edu.nomeCurso))?.[1];
    const c = cursoId ? cursoOuNulo(cursoId) : undefined;
    if (c) {
      const restantesSem = Math.max(1, num(edu.totalSemestres, c.meses / 6) - num(edu.semestreAtual, 1) + 1);
      v.educacao.matricula = {
        cursoId: c.id, instituicao: edu.instituicao ?? 'a faculdade', rede: edu.isPublica ? 'publica' : 'privada', modalidade: 'presencial',
        tInicio: t - 12, mesesRestantes: restantesSem * 6, mensalidade: edu.isPublica ? 0 : num(edu.mensalidade, c.mensalidade),
        desempenho: num(edu.desempenho, 60), trancado: false, municipioId: municipio
      };
    }
  } else if (idadeAtual >= 4 && idadeAtual <= 17 && v.educacao.escolaridade !== 'medio') {
    const serie = idadeAtual <= 5 ? 0 : idadeAtual <= 14 ? idadeAtual - 5 : idadeAtual - 14;
    v.educacao.basica = { etapa: idadeAtual <= 5 ? 'pre' : idadeAtual <= 10 ? 'fundamental1' : idadeAtual <= 14 ? 'fundamental2' : 'medio', serie, rede: 'publica', desempenho: 60, reprovacoes: 0 };
  }
  for (const c of Array.isArray(edu.cursosConcluidos) ? edu.cursosConcluidos : []) {
    const id = CURSO_POR_NOME.find(([re]) => re.test(String(c.nome)))?.[1];
    const novo = id ? cursoOuNulo(id) : undefined;
    if (!novo) continue;
    v.educacao.concluidos.push({ cursoId: novo.id, nome: novo.nome, nivel: novo.nivel, area: novo.area, tFim: tDe(num(c.anoConclusao, anoAtual), 0), instituicao: 'a faculdade' });
    const lic: Record<string, string> = { medicina: 'crm', enfermagem: 'coren', psicologia: 'crp', engenharia_civil: 'crea' };
    if (novo.nivel === 'superior' && lic[novo.area]) v.trabalho.licencas.push(lic[novo.area]);
    if (novo.area === 'direito' && novo.nivel === 'superior') v.trabalho.licencas.push('oab');
  }

  // Trabalho
  const car = a.carreira ?? {};
  if (car.empregado && car.cargoAtual) {
    const oc = ocupacaoOuNula(OCUPACAO[car.cargoAtual.id] ?? '') ?? ocupacaoOuNula('aux_adm')!;
    v.trabalho.atual = {
      ocupacaoId: oc.id, empregador: 'uma empresa da cidade', contrato: oc.contrato, salario: num(car.cargoAtual.salarioMensal, oc.salario, 0, 1e6),
      tInicio: t - num(car.anosNoCargo, 0, 0, 60) * 12, desempenho: num(car.desempenhoTrabalho, 60), municipioId: municipio, carga: oc.carga
    };
    v.trabalho.experiencia[oc.trilha] = num(car.anosNoCargo, 0, 0, 60) * 12;
  }
  for (const h of Array.isArray(car.historicoEmpregos) ? car.historicoEmpregos : []) {
    const anos = Math.max(0, num(h.anoFim, anoAtual) - num(h.anoInicio, anoAtual));
    v.trabalho.contribuicao += anos * 12;
    const oc = ocupacaoOuNula('aux_adm')!;
    v.trabalho.historico.push({ ocupacaoId: oc.id, empregador: String(h.empresa ?? 'um emprego anterior'), contrato: 'clt', salario: num(h.salario, 0, 0, 1e6), tInicio: tDe(num(h.anoInicio, anoAtual), 0), tFim: tDe(num(h.anoFim, anoAtual), 0), desempenho: 60, municipioId: municipio, carga: 'integral', motivo: String(h.motivoSaida ?? '') });
  }
  if (car.aposentado) v.trabalho.aposentadoria = { t, beneficio: num(car.rendaAposentadoria, 1620, 0, 1e6) };

  // Dinheiro e bens
  for (const inv of Array.isArray(a.economia?.investimentos) ? a.economia.investimentos : []) {
    const saldo = num(inv.saldo, 0, 0, 1e12);
    if (inv.tipo === 'acoes_b3' || inv.tipo === 'cripto') v.financas.acoes += saldo; else v.financas.reserva += saldo;
  }
  const divida = num(a.economia?.dividas, 0, 0, 1e9);
  if (divida > 0) v.financas.dividas.push({ id: 'dm', tipo: 'cartao', saldo: divida, jurosMes: 0.045, parcela: 0, descricao: 'Dívida antiga' });
  for (const b of Array.isArray(a.economia?.propriedades) ? a.economia.propriedades : []) {
    const valor = num(b.valorAtual, 0, 0, 1e9);
    if (b.tipo === 'veiculo') {
      const modeloId = valor < 8000 ? 'bike_eletrica' : valor < 25000 ? 'moto_usada' : valor < 60000 ? 'carro_usado' : valor < 120000 ? 'carro_novo' : 'carro_suv';
      v.financas.bens.push({ id: String(b.id), tipo: 'veiculo', modeloId, nome: modeloVeiculo(modeloId).nome, valor, tCompra: tDe(num(b.anoCompra, anoAtual), 0), estado: 70 });
    } else {
      v.financas.bens.push({ id: String(b.id), tipo: 'imovel', modeloId: 'apto_2q', nome: String(b.nome ?? 'imóvel'), valor, tCompra: tDe(num(b.anoCompra, anoAtual), 0), municipioId: municipio, estado: 80 });
    }
  }
  if (v.moradia.tipo === 'propria') v.moradia.imovelId = v.financas.bens.find(b => b.tipo === 'imovel')?.id;

  // Linha da Vida
  for (const e of Array.isArray(a.timeline) ? a.timeline : []) {
    if (!e || typeof e.texto !== 'string') continue;
    const entrada: Entrada = {
      id: `e${v.seq++}`,
      t: tDe(num(e.ano, anoAtual), 0),
      idade: num(e.idade, 0, 0, 130),
      texto: e.texto,
      relevancia: RELEVANCIA[e.relevancia] ?? (e.tipo === 'importante' ? 'marco' : e.categoria === 'cotidiano' ? 'cotidiano' : 'biografia'),
      tema: TEMA[e.categoria] ?? 'infancia'
    };
    v.biografia.push(entrada);
  }
  v.biografia.push({ id: `e${v.seq++}`, t, idade: idadeAtual, texto: 'A partir daqui, esta vida continua numa versão nova do mundo.', relevancia: 'tecnico', tema: 'escolha' });

  // Marcos de infância já vividos não se repetem.
  const hist: string[] = Array.isArray(a.historicoEventosDisparados) ? a.historicoEventosDisparados : [];
  const equivalentes: Record<string, string> = { inf_primeiros_passos: 'bb_primeiros_passos', bb_primeira_palavra: 'bb_primeira_palavra', inf_primeiro_dia_escola: 'inf_primeiro_dia_aula' };
  for (const [antigo, novo] of Object.entries(equivalentes)) {
    if (hist.includes(antigo) || idadeAtual > 7) v.ocorrencias.push({ id: novo, t, idade: idadeAtual });
  }
  if (idadeAtual > 8) v.ocorrencias.push({ id: 'inf_alfabetizacao', t, idade: idadeAtual });
  return v;
}

function num(x: unknown, padrao: number, min = 0, max = 100): number {
  const n = typeof x === 'number' && Number.isFinite(x) ? x : padrao;
  return Math.max(min, Math.min(max, n));
}

/* ------------------------------------------------------------ Estatísticas */

export interface VidaPassada {
  id: string;
  nome: string;
  idadeMorte: number;
  lugar: string;
  profissao: string;
  patrimonio: number;
  causa: string;
  ano: number;
}

export interface Estatisticas {
  vidasJogadas: number;
  totalAnosVividos: number;
  maiorIdade: number;
  maiorPatrimonio: number;
  historico: VidaPassada[];
}

export function lerEstatisticas(s: Armazenamento | null = armazenamentoPadrao()): Estatisticas {
  const vazio: Estatisticas = { vidasJogadas: 0, totalAnosVividos: 0, maiorIdade: 0, maiorPatrimonio: 0, historico: [] };
  try {
    const bruto = s?.getItem(CHAVE_ESTATISTICAS);
    if (!bruto) return vazio;
    const d = JSON.parse(bruto);
    return {
      vidasJogadas: num(d.vidasJogadas, 0, 0, 1e9),
      totalAnosVividos: num(d.totalAnosVividos, 0, 0, 1e9),
      maiorIdade: num(d.maiorIdade, 0, 0, 200),
      maiorPatrimonio: num(d.maiorPatrimonio, 0, -1e12, 1e12),
      historico: Array.isArray(d.historico) ? d.historico.slice(0, 50) : Array.isArray(d.historicoVidas)
        ? d.historicoVidas.slice(0, 50).map((x: Antigo) => ({ id: String(x.id), nome: String(x.nome), idadeMorte: num(x.idadeMorte, 0, 0, 200), lugar: `${x.cidade}, ${x.estado}`, profissao: String(x.profissao ?? ''), patrimonio: num(x.patrimonio, 0, -1e12, 1e12), causa: String(x.causaMorte ?? ''), ano: 0 }))
        : []
    };
  } catch {
    return vazio;
  }
}

export function registrarVidaPassada(p: VidaPassada, s: Armazenamento | null = armazenamentoPadrao()): void {
  const e = lerEstatisticas(s);
  e.vidasJogadas += 1;
  e.totalAnosVividos += p.idadeMorte;
  e.maiorIdade = Math.max(e.maiorIdade, p.idadeMorte);
  e.maiorPatrimonio = Math.max(e.maiorPatrimonio, p.patrimonio);
  e.historico = [p, ...e.historico].slice(0, 50);
  try { s?.setItem(CHAVE_ESTATISTICAS, JSON.stringify(e)); } catch { /* sem espaço */ }
}
