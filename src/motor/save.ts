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
  Classe, Dominio, Entrada, Escolaridade, EstiloDeVida, Genero, Marco, Parentesco, Pessoa, Relevancia, Tema, Vida, Vinculo
} from './tipos';
import { anoDe, tDe, idadeEm } from './tempo';
import { municipioPorNome, MUNICIPIOS } from './dados/lugares';
import { cursoOuNulo } from './dados/cursos';
import { ocupacaoOuNula } from './dados/ocupacoes';
import { modeloVeiculo, VEICULO_ANTIGO } from './dados/bens';
import { economiaInicial } from './sistemas/economia';
import { temperamentoAleatorio } from './nucleo';
import { criarRng } from './rng';
import { visualAleatorio } from './pessoas';
import { capitalDoEstado, nivelEsc } from './sistemas/escola';
import { aptidao, MATERIAS } from './sistemas/frentes';
import { modeloRotina } from './sistemas/rotinas';
import { CURSOS_NPC } from './sistemas/filhos';
import { estrategiaPadrao, tipoNegocio } from './dados/negocios';
import { atribuirVersoesAosVeiculos } from './sistemas/versoesVeiculo';

export const VERSAO_SAVE = 14;
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
    const erro = validar(d);
    return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: d as unknown as Vida, migrado: false };
  }
  if (d.versao === 13) {
    // v13 → v14: veículos com marca e modelo reais, a história dos partidos por onde passou.
    const erro13 = validar(d, 13);
    if (erro13) return { tipo: 'invalido', motivo: erro13 };
    try {
      const v = migrarV13(d as unknown as Vida);
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (d.versao === 12) {
    // v12 → v13: negócio paralelo ou integral, jeitos de vender por tipo, sócio com parte, compromissos pendentes, espécies de bicho.
    const erro12 = validar(d, 12);
    if (erro12) return { tipo: 'invalido', motivo: erro12 };
    try {
      const v = migrarV13(migrarV12(d as unknown as Vida));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (d.versao === 11) {
    // v11 → v12: vida profissional (ritmo, clima, empresa com caixa, porte e equipe, atleta com contrato).
    const erro11 = validar(d, 11);
    if (erro11) return { tipo: 'invalido', motivo: erro11 };
    try {
      const v = migrarV13(migrarV12(migrarV11(d as unknown as Vida)));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (d.versao === 10) {
    // v10 → v11: caminhos de vida (carreira militar, campo, justiça, cuidado, MEI, ondas do trabalho).
    const erro10 = validar(d, 10);
    if (erro10) return { tipo: 'invalido', motivo: erro10 };
    try {
      const v = migrarV13(migrarV12(migrarV11(migrarV10(d as unknown as Vida))));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (d.versao === 9) {
    // v9 → v10: vida material (aplicações por produto, economia do país, bens com história, pets com cuidado).
    const erro9 = validar(d, 9);
    if (erro9) return { tipo: 'invalido', motivo: erro9 };
    try {
      const v = migrarV13(migrarV12(migrarV11(migrarV10(migrarV9(d as unknown as Vida)))));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (d.versao === 8) {
    // v8 → v9: estado pessoal com causas (abalos, histórico), processos seletivos em etapas, devolutivas.
    const erro8 = validar(d, 8);
    if (erro8) return { tipo: 'invalido', motivo: erro8 };
    try {
      const v = migrarV13(migrarV12(migrarV11(migrarV10(migrarV9(migrarV8(d as unknown as Vida))))));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (d.versao === 7) {
    // v7 → v8: caminhos de vida (frentes, marcas, oportunidades, concurso, esporte, arte, negócio).
    const erro7 = validar(d, 7);
    if (erro7) return { tipo: 'invalido', motivo: erro7 };
    try {
      const v = migrarV13(migrarV12(migrarV11(migrarV10(migrarV9(migrarV8(migrarV7(d as unknown as Vida)))))));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (d.versao === 6) {
    // v6 → v7: o modelo social ganhou confiança, história estruturada, árvore da família e luto.
    const erro6 = validarBase(d);
    if (erro6) return { tipo: 'invalido', motivo: erro6 };
    try {
      const v = migrarV13(migrarV12(migrarV11(migrarV10(migrarV9(migrarV8(migrarV7(migrarV6(d as unknown as Vida))))))));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível atualizar o save (${(e as Error).message}).` };
    }
  }
  if (typeof d.versao === 'number' && d.versao < 6 || d.personagem) {
    try {
      const v5 = migrarV5(d);
      if (!v5) return { tipo: 'invalido', motivo: 'Esta vida já tinha terminado.' };
      const v = migrarV13(migrarV12(migrarV11(migrarV10(migrarV9(migrarV8(migrarV7(migrarV6(v5))))))));
      const erro = validar(v as unknown as Record<string, unknown>);
      return erro ? { tipo: 'invalido', motivo: erro } : { tipo: 'ok', vida: v, migrado: true };
    } catch (e) {
      return { tipo: 'invalido', motivo: `Não foi possível migrar o save antigo (${(e as Error).message}).` };
    }
  }
  return { tipo: 'invalido', motivo: 'Versão de save desconhecida.' };
}

function validarBase(d: Record<string, unknown>): string | null {
  const obrig = ['eu', 'corpo', 'mente', 'pessoas', 'vinculos', 'moradia', 'educacao', 'trabalho', 'financas', 'biografia'];
  for (const k of obrig) if (!d[k] || typeof d[k] !== 'object') return `Campo ausente: ${k}.`;
  if (typeof d.t !== 'number' || !Number.isFinite(d.t)) return 'Tempo inválido.';
  const eu = d.eu as Record<string, unknown>;
  if (typeof eu.nome !== 'string' || typeof eu.tNasc !== 'number') return 'Personagem inválido.';
  if (!Array.isArray(d.biografia)) return 'Linha da Vida inválida.';
  const vinculos = d.vinculos as Record<string, { pessoaId: string }>;
  const pessoas = d.pessoas as Record<string, unknown>;
  for (const vin of Object.values(vinculos)) if (!vin || !pessoas[vin.pessoaId]) return 'Vínculo aponta para pessoa inexistente.';
  return null;
}

const finito = (x: unknown) => typeof x === 'number' && Number.isFinite(x);

/**
 * Validação do save v7. Relações corrompidas não entram: um save que passa
 * por aqui tem vínculos com números válidos, história em lista e uma árvore
 * da família que só aponta para quem existe.
 */
function validar(d: Record<string, unknown>, versao = VERSAO_SAVE): string | null {
  const base = validarBase(d);
  if (base) return base;
  if (versao >= 8) {
    const c = d.caminhos as Vida['caminhos'] | undefined;
    if (!c || typeof c !== 'object' || !c.frentes || typeof c.frentes !== 'object' || !Array.isArray(c.marcas) || !Array.isArray(c.oportunidades) || !c.concurso || !finito(c.concurso.meses) || !c.ultimas) return 'Caminhos inválidos.';
    for (const f of Object.values(c.frentes)) if (!f || !finito(f.habilidade) || !finito(f.interesse) || !finito(f.meses)) return 'Frente com valores inválidos.';
    if (!Array.isArray(d.rotinas)) return 'Rotinas inválidas.';
  }
  if (versao >= 9) {
    const m = d.mente as Vida['mente'];
    if (!Array.isArray(m.abalos) || !Array.isArray(m.historico)) return 'Estado pessoal inválido.';
    if (m.abalos.some(a => !a || !finito(a.t) || !finito(a.humor) || !finito(a.cabeca) || typeof a.texto !== 'string')) return 'Abalo inválido.';
    const c = d.caminhos as Vida['caminhos'];
    if (!c.entrevistas || !Array.isArray(c.entrevistas.recentes) || !finito(c.entrevistas.feitas) || !Array.isArray(c.devolutivas)) return 'Processos seletivos inválidos.';
    if (c.processo && (!Array.isArray(c.processo.etapas) || !finito(c.processo.atual))) return 'Processo seletivo em andamento inválido.';
  }
  if (versao >= 10) {
    const f = d.financas as Vida['financas'];
    if (!Array.isArray(f.investimentos) || !Array.isArray(f.dividas) || !Array.isArray(f.bens) || !Array.isArray(f.historico) || !finito(f.conta)) return 'Finanças inválidas.';
    if (f.investimentos.some(a => !a || !finito(a.valor) || !finito(a.aportado) || typeof a.produto !== 'string' || !Array.isArray(a.historico))) return 'Aplicação inválida.';
    if (f.dividas.some(x => !x || !finito(x.saldo) || !finito(x.parcela) || !finito(x.jurosMes))) return 'Dívida inválida.';
    if (f.bens.some(b => !b || !finito(b.valor) || (b.tipo !== 'veiculo' && b.tipo !== 'imovel'))) return 'Bem inválido.';
    const e = d.economia as Vida['economia'];
    if (!e || typeof e !== 'object' || !finito(e.semente) || !finito(e.juroReal) || !finito(e.imoveis) || !finito(e.bolsa) || !finito(e.precos) || typeof e.fase !== 'string' || !Array.isArray(e.historico)) return 'Economia inválida.';
  }
  if (versao >= 11) {
    const j = d.justica as Vida['justica'];
    if (j !== undefined && (typeof j !== 'object' || !Array.isArray(j.antecedentes) || (j.prisao && (!finito(j.prisao.tInicio) || !finito(j.prisao.tFim))))) return 'Justiça inválida.';
    const c = d.caminhos as Vida['caminhos'];
    if (c.militar && (typeof c.militar.forca !== 'string' || !finito(c.militar.tIngresso) || !Array.isArray(c.militar.cursos))) return 'Carreira militar inválida.';
    if (c.envolvimento && (!finito(c.envolvimento.exposicao) || !finito(c.envolvimento.nivel))) return 'Envolvimento inválido.';
    const t = d.trabalho as Vida['trabalho'];
    if (t.pausa && (!finito(t.pausa.tInicio) || typeof t.pausa.motivo !== 'string')) return 'Pausa inválida.';
  }
  if (versao >= 12) {
    const e = (d.trabalho as Vida['trabalho']).atual;
    if (e && ((e.clima !== undefined && !finito(e.clima)) || (e.estrutura !== undefined && !finito(e.estrutura)) || (e.ritmo !== undefined && e.ritmo !== 'leve' && e.ritmo !== 'puxado'))) return 'Emprego inválido.';
    const n = (d.caminhos as Vida['caminhos']).negocio;
    if (n && (!finito(n.caixa) || !finito(n.porte) || !finito(n.unidades) || !finito(n.reputacao) || !Array.isArray(n.equipe))) return 'Negócio inválido.';
    if (n?.equipe?.some(f => !f || typeof f.pessoaId !== 'string' || !finito(f.salario) || !(d.pessoas as Record<string, unknown>)[f.pessoaId])) return 'Equipe do negócio aponta para pessoa inexistente.';
    const es = (d.caminhos as Vida['caminhos']).esporte;
    if (es && es.contratoAte !== undefined && !finito(es.contratoAte)) return 'Carreira esportiva inválida.';
    const pol = (d.caminhos as Vida['caminhos']).politica;
    if (pol && (typeof pol.fase !== 'string' || !finito(pol.reputacao) || !finito(pol.apoio) || !finito(pol.desgaste) || !Array.isArray(pol.historico) || (pol.mandato && (!finito(pol.mandato.tFim) || !finito(pol.mandato.aprovacao))))) return 'Vida política inválida.';
  }
  if (versao >= 13) {
    const n = (d.caminhos as Vida['caminhos']).negocio;
    if (n && n.dedicacao !== undefined && n.dedicacao !== 'integral' && n.dedicacao !== 'paralela') return 'Dedicação do negócio inválida.';
    if (n?.melhorias !== undefined && !Array.isArray(n.melhorias)) return 'Negócio inválido.';
    const pend = (d.caminhos as Vida['caminhos']).pendente;
    if (pend && !pendenteValido(pend)) return 'Escolha pendente inválida.';
    const pol = (d.caminhos as Vida['caminhos']).politica;
    if (pol?.prioridade !== undefined && !PRIORIDADES_VALIDAS.includes(pol.prioridade)) return 'Bandeira política inválida.';
  }
  if (!Array.isArray(d.luto)) return 'Luto inválido.';
  const pessoas = d.pessoas as Record<string, Pessoa>;
  for (const vin of Object.values(d.vinculos as Record<string, Vinculo>)) {
    if (!finito(vin.proximidade) || !finito(vin.tensao) || !finito(vin.confianca)) return 'Vínculo com valores inválidos.';
    if (!Array.isArray(vin.historia) || !Array.isArray(vin.convivio)) return 'Vínculo sem história.';
    if (vin.romance && (!finito(vin.romance.envolvimento) || typeof vin.romance.estagio !== 'string')) return 'Relacionamento inválido.';
  }
  for (const p of Object.values(pessoas)) {
    if (p.genitores && p.genitores.some(g => g !== 'eu' && !pessoas[g])) return 'Árvore da família aponta para pessoa inexistente.';
  }
  return null;
}

/* ================================================================== v11 → v12 */

/**
 * Migra um save v11 (caminhos de vida) para v12 (vida profissional), sem
 * inventar passado:
 *  - negócio aberto ganha caixa vazio (o que sobrou até aqui já foi para a
 *    sua conta, como era a regra), porte pequeno, uma unidade, nenhuma
 *    equipe registrada (o motor antigo não tinha funcionários) e reputação
 *    igual ao movimento de hoje (é o que se sabia dele);
 *  - quem é atleta profissional ganha o espaço no time pelo que joga hoje e
 *    um contrato que vence no próximo biênio contado desde a estreia;
 *  - ritmo, clima, estrutura e preço começam ausentes (= o de sempre).
 */
const textos = (x: unknown) => Array.isArray(x) && x.every(t => typeof t === 'string');

/** Uma escolha de trajetória em aberto, inteira: o que chega (com ids que existem), por que conflita, e cada plano com o que acontece. */
function pendenteValido(p: unknown): boolean {
  if (!p || typeof p !== 'object') return false;
  const x = p as Vida['caminhos']['pendente'] & Record<string, unknown>;
  const n = x!.novo as Record<string, unknown> | undefined;
  if (!n || typeof n !== 'object' || typeof x!.oferta !== 'string' || !textos(x!.conflitos) || !Array.isArray(x!.planos) || !x!.planos.length) return false;
  if (x!.planos.some(q => !q || typeof q.texto !== 'string' || !textos(q.larga) || !textos(q.consequencias))) return false;
  switch (n.tipo) {
    case 'base': return typeof n.dominio === 'string' && typeof n.clube === 'string' && typeof n.municipioId === 'string' && MUNICIPIOS.some(m => m.id === n.municipioId);
    case 'contrato_esporte': return finito(n.nivel);
    case 'emprego': return typeof n.ocupacaoId === 'string' && !!ocupacaoOuNula(n.ocupacaoId) && typeof n.via === 'string';
    case 'negocio': return typeof n.negocioId === 'string' && !!tipoNegocio(n.negocioId);
    case 'dedicar_negocio': case 'servico_militar': return true;
    case 'curso': return typeof n.cursoId === 'string' && !!cursoOuNulo(n.cursoId) && typeof n.municipioId === 'string' && MUNICIPIOS.some(m => m.id === n.municipioId) && (n.modalidade === 'presencial' || n.modalidade === 'ead') && typeof n.instituicao === 'string';
    default: return false;
  }
}

const PRIORIDADES_VALIDAS = ['saude', 'educacao', 'mobilidade', 'emprego', 'seguranca', 'ambiente', 'contas', 'cultura'];

/**
 * v12 → v13. O negócio ganha dedicação (é o trabalho de todo dia quando o
 * emprego é o de dono; senão, fica nas horas vagas — antes, fecharia sozinho
 * no ano seguinte), melhorias, jeito de vender válido para o tipo e a parte do
 * sócio (metade, como era). Quem trabalha no negócio passa a conviver no lugar
 * do negócio. Bandeira política sem valor válido volta a "nenhuma". Nada
 * da Linha da Vida muda.
 */
export function migrarV12(v: Vida): Vida {
  const x = v as Vida & { versao: number };
  (x as { versao: number }).versao = 13;
  const n = x.caminhos.negocio;
  if (n) {
    n.melhorias ??= [];
    if (n.estado !== 'fechado') {
      const dono = x.trabalho.atual?.ocupacaoId === n.ocupacaoId;
      n.dedicacao ??= dono && !n.passivo ? 'integral' : 'paralela';
      const t = tipoNegocio(n.tipo);
      if (t && (!n.estrategia || !t.estrategias.includes(n.estrategia))) n.estrategia = n.estrategia === 'online' && t.presenca === 'online' ? 'marca' : estrategiaPadrao(t);
      const chave = `negocio:${n.nome}:${n.tInicio}`;
      for (const f of n.equipe ?? []) { const vin = x.vinculos[f.pessoaId]; if (vin) vin.ambiente = chave; }
      if (n.socioId && x.vinculos[n.socioId]?.convivio.includes('trabalho')) x.vinculos[n.socioId].ambiente = chave;
    }
    if (n.socioId) n.parteSocio ??= 0.5;
  }
  const pol = x.caminhos.politica;
  if (pol && pol.prioridade !== undefined && !PRIORIDADES_VALIDAS.includes(pol.prioridade)) delete pol.prioridade;
  // Um momento aberto de um catálogo que mudou (opção que não existe mais) fica resolvível: sem ele, o ano segue.
  if (x.momento?.situacaoId === 'neg_estrategia' && n && tipoNegocio(n.tipo)?.presenca === 'online') x.momento = null;
  return x;
}

/**
 * v13 → v14 (FIX #4). Cada veículo ganha a marca e o modelo reais do
 * catálogo (escolhidos pela própria identidade do veículo: sempre o mesmo);
 * valor, estado e história não mudam. Quem é filiado ganha a história de
 * partidos começando pelo atual. O resto do FIX #4 (retirada do negócio,
 * deslocamento, fatores da eleição, segredos) é derivado ou opcional: saves
 * antigos seguem válidos sem nada a preencher. A Linha da Vida não muda.
 */
export function migrarV13(v: Vida): Vida {
  const x = v as Vida & { versao: number };
  (x as { versao: number }).versao = 14;
  atribuirVersoesAosVeiculos(x);
  const pol = x.caminhos.politica;
  if (pol?.partido && !pol.partidos) pol.partidos = [{ sigla: pol.partido, tInicio: pol.tFiliacao ?? pol.tInicio }];
  // Morando de favor com um irmão: a casa é dele (sem isso, a "mudança" para a casa dele se repetia todo ano).
  if (x.moradia.tipo === 'parente' && !x.moradia.anfitriaoId) {
    const irmao = Object.values(x.vinculos).find(w => (w.parentesco === 'irmao' || w.parentesco === 'meio_irmao') && w.convivio.includes('casa') && x.pessoas[w.pessoaId]?.vivo);
    if (irmao) x.moradia.anfitriaoId = irmao.pessoaId;
  }
  return x;
}

/* ------------------------------------------------------------------ Exportar */

/** O formato do arquivo exportado: um envelope com a vida dentro (JSON puro — nada executável). */
export interface ArquivoDeVida { formato: 'vida-save'; versao: number; exportadoEm: string; nome: string; vida: Vida }

export function exportarVida(v: Vida, agora = new Date()): string {
  const arq: ArquivoDeVida = { formato: 'vida-save', versao: v.versao, exportadoEm: agora.toISOString(), nome: `${v.eu.nome} ${v.eu.sobrenome}`, vida: v };
  return JSON.stringify(arq);
}

/** Tamanho máximo aceito na importação (uma vida longa passa de 1 MB; 12 MB é folga, não convite). */
export const LIMITE_IMPORTACAO = 12 * 1024 * 1024;

/**
 * Lê um arquivo exportado (ou um save cru): valida, migra se for de versão
 * anterior e devolve a vida — ou um motivo compreensível. Nunca executa nada:
 * é JSON.parse e checagem de forma.
 */
export function importarVida(texto: string): Leitura {
  if (typeof texto !== 'string' || !texto.trim()) return { tipo: 'invalido', motivo: 'O arquivo está vazio.' };
  if (texto.length > LIMITE_IMPORTACAO) return { tipo: 'invalido', motivo: 'O arquivo é grande demais para ser uma vida do VIDA.' };
  let dados: unknown;
  try { dados = JSON.parse(texto); } catch { return { tipo: 'invalido', motivo: 'Esse arquivo não é uma vida exportada do VIDA (não é um JSON válido).' }; }
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return { tipo: 'invalido', motivo: 'Esse arquivo não parece uma vida exportada do VIDA.' };
  const d = dados as Record<string, unknown>;
  const miolo = d.formato === 'vida-save' ? d.vida : d;
  if (!miolo || typeof miolo !== 'object') return { tipo: 'invalido', motivo: 'O arquivo não traz uma vida dentro.' };
  const m = miolo as Record<string, unknown>;
  if (typeof m.versao === 'number' && m.versao > VERSAO_SAVE) return { tipo: 'invalido', motivo: `Essa vida foi salva numa versão mais nova do jogo (${m.versao}); esta aceita até a ${VERSAO_SAVE}.` };
  if ((m as { morte?: unknown }).morte) return { tipo: 'invalido', motivo: 'Essa vida já terminou: não há o que continuar.' };
  const r = interpretar(JSON.stringify(miolo));
  if (r.tipo === 'ok' && typeof r.vida.rng !== 'number') return { tipo: 'invalido', motivo: 'Falta o estado do acaso da vida (o arquivo está incompleto).' };
  return r;
}

export function migrarV11(v: Vida): Vida {
  const x = v as Vida & { versao: number };
  (x as { versao: number }).versao = 12;
  const n = x.caminhos.negocio;
  if (n) {
    n.caixa ??= 0;
    n.porte ??= 1;
    n.unidades ??= n.estado === 'fechado' ? 0 : 1;
    n.equipe ??= [];
    n.reputacao ??= Math.round(Math.max(10, Math.min(80, n.clientela)));
  }
  const es = x.caminhos.esporte;
  if (es?.fase === 'profissional') {
    const h = x.caminhos.frentes[es.modalidade]?.habilidade ?? 60;
    es.espaco ??= h >= 76 ? 'titular' : 'reserva';
    if (es.contratoAte === undefined) { let fim = es.tFase + 24; while (fim <= x.t) fim += 24; es.contratoAte = fim; }
  }
  return x;
}

/* ================================================================== v10 → v11 */

const QUADRO_V10: Record<string, 'temporario' | 'praca' | 'oficial'> = { soldado_ep: 'temporario', cabo_ep: 'temporario', aluno_sargento: 'praca', sargento: 'praca', subtenente: 'praca', cadete: 'oficial', tenente: 'oficial', capitao: 'oficial', major: 'oficial' };

/**
 * Migra um save v10 (ATT 3) para v11 (caminhos de vida), sem inventar
 * passado:
 *  - quem está nas Forças Armadas ganha a carreira militar: Exército (o
 *    único que existia), o quadro pelo posto, o ingresso pelo primeiro
 *    posto militar da história, a guarnição onde mora hoje, nenhuma
 *    transferência; majores já contam com o curso de aperfeiçoamento
 *    (sem ele não teriam chegado lá);
 *  - quem produz no campo ganha a vida rural: terra da família se algum
 *    parente vive disso, senão arrendada; cultura pela região;
 *  - justiça, envolvimento, pausa de cuidado, MEI: começam vazios (o
 *    motor antigo não tinha nada disso).
 */
export function migrarV10(v: Vida): Vida {
  const x = v as Vida & { versao: number };
  (x as { versao: number }).versao = 11;
  const e = x.trabalho.atual;
  if (e && QUADRO_V10[e.ocupacaoId] && !x.caminhos.militar) {
    const militares = [...x.trabalho.historico, e].filter(h => QUADRO_V10[h.ocupacaoId]);
    const tIngresso = Math.min(...militares.map(h => h.tInicio));
    x.caminhos.militar = { forca: 'exercito', quadro: QUADRO_V10[e.ocupacaoId], tIngresso, guarnicao: x.moradia.municipioId, tGuarnicao: x.t, cursos: e.ocupacaoId === 'major' ? ['aperfeicoamento'] : [], transferencias: 0 };
  }
  // O registro de contador (CRC) passou a existir como licença: quem se formou em Contábeis já o tinha.
  if (x.educacao.concluidos.some(c => c.area === 'contabilidade' && c.nivel === 'superior') && !x.trabalho.licencas.includes('crc')) x.trabalho.licencas.push('crc');
  if (e?.ocupacaoId === 'produtor_rural' && !x.caminhos.rural) {
    const rural = Object.values(x.pessoas).some(p => p.vivo && p.ocupacaoId && ['trabalhador_rural', 'produtor_rural', 'operador_maquinas', 'gerente_fazenda'].includes(p.ocupacaoId) && x.vinculos[p.id]?.parentesco);
    const regiao = municipioPorId(x.moradia.municipioId)?.regiao;
    x.caminhos.rural = { terra: rural ? 'familia' : 'arrendada', cultura: regiao === 'Sul' || regiao === 'Centro-Oeste' ? 'lavoura' : regiao === 'Sudeste' ? 'leite' : 'misto', cooperativa: false, tInicio: e.tInicio, anosRuins: 0 };
  }
  return x;
}

const municipioPorId = (id: string) => MUNICIPIOS.find(m => m.id === id);

/* =================================================================== v9 → v10 */

/** As finanças como eram até o save v9. */
type FinancasV9 = Omit<Vida['financas'], 'investimentos' | 'historico'> & { reserva: number; acoes: number; investimentos?: Vida['financas']['investimentos']; historico?: Vida['financas']['historico'] };

/**
 * Migra um save v9 (FIX pós-playtest 2) para v10 (ATT 3, vida material),
 * sem inventar patrimônio:
 *  - reserva e ações viram aplicações (o que foi posto é desconhecido: a
 *    base de custo começa igual ao valor de hoje — sem ganho nem perda
 *    fictícios);
 *  - a economia do país começa "estável" hoje (ou em crise, se o save
 *    estava no meio de uma recessão), com semente derivada da vida;
 *  - veículos antigos ganham o modelo de hoje (o "carro popular usado" vira
 *    um compacto usado de cinco anos antes da compra), preço pago = valor;
 *  - dívidas ganham prazo (o que falta pela parcela atual) e nenhum atraso;
 *  - o renegociado vira "acordo";
 *  - pets ganham porte, tutor (quem mora com eles) e um limite de vida que
 *    nunca é menor que a idade atual + 1;
 *  - a moradia alugada aceita animais (o save não sabia).
 */
export function migrarV9(v: Vida): Vida {
  const x = v as Vida & { versao: number };
  (x as { versao: number }).versao = 10;
  const f = x.financas as unknown as FinancasV9;
  const invest: Vida['financas']['investimentos'] = Array.isArray(f.investimentos) ? f.investimentos : [];
  const reserva = Number.isFinite(f.reserva) ? f.reserva : 0;
  const acoes = Number.isFinite(f.acoes) ? f.acoes : 0;
  if (reserva > 0) invest.push({ id: 'apl_reserva', produto: 'reserva', aportado: Math.round(reserva), valor: Math.round(reserva), tInicio: x.t, historico: [Math.round(reserva)], pico: Math.round(reserva) });
  if (acoes > 0) invest.push({ id: 'apl_acoes', produto: 'acoes', aportado: Math.round(acoes), valor: Math.round(acoes), tInicio: x.t, historico: [Math.round(acoes)], pico: Math.round(acoes) });
  delete (f as Partial<FinancasV9>).reserva;
  delete (f as Partial<FinancasV9>).acoes;
  f.investimentos = invest;
  if (!Array.isArray(f.historico)) f.historico = [];
  if (!x.economia) {
    x.economia = economiaInicial(hashTexto(x.id) + 17, x.t);
    if ((x.fatos['recessao_ate'] ?? 0) > x.t) { x.economia.fase = 'crise'; x.economia.tFase = x.t; }
  }
  for (const b of f.bens) {
    if (b.tipo === 'veiculo') {
      const antigo = VEICULO_ANTIGO[b.modeloId];
      if (antigo) { b.modeloId = antigo.id; b.usado = antigo.usado; }
      b.nome = modeloVeiculo(b.modeloId).nome;
      b.anoFabricacao ??= anoDe(b.tCompra) - (b.usado ? 5 : 0);
      b.precoPago ??= b.valor;
      b.historia ??= [{ t: b.tCompra, texto: 'Comprado.' }];
      b.dono ??= 'eu';
    } else {
      b.precoPago ??= b.valor;
      b.tManutencao ??= b.tCompra;
      b.historia ??= [{ t: b.tCompra, texto: 'Comprado.' }];
      b.dono ??= 'eu';
    }
  }
  for (const d of f.dividas) {
    if (d.tipo === 'emprestimo' && d.descricao === 'Acordo de renegociação') d.tipo = 'acordo';
    d.atraso ??= 0;
    if (d.parcela > 0 && d.prazo === undefined) {
      const j = d.jurosMes;
      const q = 1 - d.saldo * j / d.parcela;
      d.prazo = q <= 0 ? 360 : Math.max(1, Math.ceil(-Math.log(q) / Math.log(1 + j)));
      d.tInicio = x.t;
    }
  }
  if ((x.moradia.tipo === 'aluguel' || x.moradia.tipo === 'republica') && x.moradia.aceitaPet === undefined) x.moradia.aceitaPet = true;
  for (const p of Object.values(x.pessoas)) {
    if (!p.especie || p.pet) continue;
    const vin = x.vinculos[p.id];
    const idadeP = Math.floor((x.t - p.tNasc) / 12);
    const emCasa = !!vin?.convivio.includes('casa');
    const naFamilia = x.moradia.tipo === 'pais' || x.moradia.tipo === 'parente';
    p.pet = { porte: p.especie === 'gato' ? 'pequeno' : 'medio', origem: 'familia', tChegada: vin?.tInicio ?? x.t, tutor: emCasa && !naFamilia ? 'eu' : 'familia', jeito: p.especie === 'gato' ? 'dono da casa' : 'fiel', vidaMax: Math.max(idadeP + 1, p.especie === 'gato' ? 16 : 13) };
  }
  return x;
}

/* =================================================================== v8 → v9 */

/**
 * Migra um save v8 (ATT 2) para v9 (FIX pós-playtest 2), sem inventar nada:
 *  - o estado pessoal ganha o registro de abalos (vazio: os acontecimentos
 *    antigos não tinham nome) e o histórico (começa com o estado de hoje,
 *    então a tendência aparece depois do próximo ano);
 *  - os processos seletivos ganham memória de perguntas (vazia) e as
 *    devolutivas começam vazias; as tentativas antigas continuam na
 *    Linha da Vida e nas marcas do caminho;
 *  - uma entrevista antiga aberta no momento do save (formato de uma
 *    pergunta só) continua funcionando: o momento aberto é o mesmo.
 */
export function migrarV8(v: Vida): Vida {
  const x = v as Vida & { versao: number };
  (x as { versao: number }).versao = 9;
  const m = x.mente as Partial<Vida['mente']> & Vida['mente'];
  if (!Array.isArray(m.abalos)) m.abalos = [];
  if (!Array.isArray(m.historico)) m.historico = [{ t: x.t, humor: m.felicidade, cabeca: m.estresse, saude: x.corpo.saude }];
  const c = x.caminhos as Partial<Vida['caminhos']> & Vida['caminhos'];
  if (!c.entrevistas) c.entrevistas = { recentes: [], feitas: 0 };
  if (!Array.isArray(c.devolutivas)) c.devolutivas = [];
  return x;
}

/* =================================================================== v7 → v8 */

/** Intensidade de cada rotina antiga (o motor da ATT 1 não tinha níveis). */
const NIVEL_ANTIGO: Record<string, 1 | 2> = { musica: 2, ingles: 2, danca: 1, estudar_concurso: 2, futebol: 1 };

/**
 * Migra um save v7 (ATT 1) para v8 (melhor esforço, sem inventar conquista):
 *  - cada rotina ganha intensidade (as pagas, "regular");
 *  - as frentes praticadas nascem da rotina e do tempo que ela já durava
 *    (anos de violão viram meses de prática e alguma habilidade — nenhuma
 *    peneira, banda ou medalha é criada);
 *  - as matérias da escola nascem do desempenho e da escolaridade;
 *  - o preparo para concurso nasce do tempo de estudo que já havia;
 *  - o emprego guarda desde quando está no posto;
 *  - marcas estruturadas só para o que a biografia já registra com clareza
 *    (primeiro emprego, formaturas, aprovações).
 */
export function migrarV7(v: Vida): Vida {
  const x = v;
  (x as { versao: number }).versao = 8;
  if (!x.caminhos) x.caminhos = { frentes: {}, marcas: [], oportunidades: [], concurso: { meses: 0, tentativas: 0, aprovacoes: 0 }, ultimas: {}, entrevistas: { recentes: [], feitas: 0 }, devolutivas: [] };
  const idadeAgora = idadeEm(x.eu.tNasc, x.t);
  for (const r of x.rotinas ?? []) {
    if (r.nivel === undefined) r.nivel = NIVEL_ANTIGO[r.id] ?? 1;
    const m = modeloRotina(r.id);
    if (!m?.pratica) continue;
    const anos = Math.max(0, (x.t - r.tInicio) / 12);
    const peso = r.nivel === 2 ? 1 : 0.5;
    for (const [d, w] of Object.entries(m.pratica) as [Dominio, number][]) {
      const apt = aptidao(x, d);
      const hab = Math.round(Math.min(72, anos * 6 * peso * w * (1 + apt * 0.45)));
      x.caminhos.frentes[d] = { interesse: 55, meses: Math.round(anos * 12 * peso * w), habilidade: hab, tInicio: r.tInicio, tUltimo: x.t, retomadas: 0, auge: hab };
    }
  }
  // Matérias: da nota de hoje (ou da escolaridade, para adultos) e da cabeça em geral.
  const nota = x.educacao.basica?.desempenho ?? Math.min(80, 35 + nivelEsc(x.educacao.escolaridade) * 5);
  if (idadeAgora >= 7) {
    for (const d of MATERIAS) {
      if (x.caminhos.frentes[d]) continue;
      const hab = Math.round(Math.max(5, Math.min(90, nota * 0.7 + (x.mente.cognicao - 50) * 0.3 + aptidao(x, d) * 12)));
      x.caminhos.frentes[d] = { interesse: 45, meses: Math.min(12, idadeAgora - 6) * 9, habilidade: hab, tInicio: x.eu.tNasc + 72, tUltimo: x.educacao.basica ? x.t : x.t - 12, retomadas: 0, auge: hab };
    }
  }
  const estudo = (x.rotinas ?? []).find(r => r.id === 'estudar_concurso');
  if (estudo && !x.caminhos.concurso.meses) x.caminhos.concurso.meses = Math.round(Math.min(48, (x.t - estudo.tInicio) / 12 * 12));
  const reprovacoes = Object.entries(x.fatos).filter(([k]) => k.startsWith('concurso_')).reduce((s2, [, n]) => s2 + (n as number), 0);
  x.caminhos.concurso.tentativas = Math.max(x.caminhos.concurso.tentativas, reprovacoes);
  for (const e of [x.trabalho.atual, ...x.trabalho.historico]) if (e && e.tPosto === undefined) e.tPosto = e.tInicio;
  if (x.trabalho.historico.length || x.trabalho.atual) {
    const primeiro = x.trabalho.historico[0] ?? x.trabalho.atual!;
    if (!x.caminhos.marcas.some(m => m.tipo === 'primeiro_emprego')) {
      x.caminhos.marcas.push({ t: primeiro.tInicio, tipo: 'primeiro_emprego', texto: `Primeiro trabalho, aos ${idadeEm(x.eu.tNasc, primeiro.tInicio)}.`, peso: 2, ocupacaoId: primeiro.ocupacaoId });
    }
  }
  for (const c of x.educacao.concluidos) {
    if (!x.caminhos.marcas.some(m => m.tipo === 'formacao' && m.t === c.tFim)) x.caminhos.marcas.push({ t: c.tFim, tipo: 'formacao', texto: `Concluiu ${c.nome}.`, peso: c.nivel === 'superior' || c.nivel === 'tecnico' ? 3 : 2 });
  }
  x.caminhos.marcas.sort((a, b) => a.t - b.t);
  // O curso pendente de um filho (decisão da particular) apontava para a lista antiga de 8 cursos.
  const ANTIGOS = ['direito', 'enfermagem', 'eng_civil', 'administracao', 'pedagogia', 'computacao', 'psicologia', 'contabeis'];
  for (const k of Object.keys(x.fatos)) {
    if (!k.startsWith('fil_curso_')) continue;
    const novo = CURSOS_NPC.indexOf(ANTIGOS[x.fatos[k]] ?? 'administracao');
    x.fatos[k] = novo >= 0 ? novo : 0;
  }
  return x;
}

/* =================================================================== v6 → v7 */

const TIPO_ANTIGO: [RegExp, Marco['tipo'], number][] = [
  [/^Casaram-se/, 'casamento', 3], [/^Foram morar juntos/, 'casa', 3], [/^Começaram a namorar/, 'romance', 2], [/^Começaram a sair/, 'romance', 1],
  [/^Nasceu/, 'inicio', 2], [/^Viraram amigos de verdade/, 'amizade', 3], [/^Viraram amigos/, 'amizade', 2],
  [/^Divorciaram-se|^Terminaram/, 'conflito', 2], [/hospital|esteve lá/i, 'apoio', 2]
];

/**
 * Migra um save v6 (melhor esforço, sem inventar história):
 *  - confiança nasce do afeto e do atrito que já havia;
 *  - a história compartilhada ganha tipo e peso pelo texto;
 *  - quem morreu enquanto era parceria deixa de ser "ex": vira viuvez;
 *  - filhos ganham genitores (o jogador e a parceria da época do nascimento);
 *  - netos ganham o filho de quem são filhos (pelo sobrenome e cidade);
 *  - o luto começa vazio (perdas antigas já foram vividas).
 */
export function migrarV6(v: Vida): Vida {
  const x = v as Vida & { versao: number };
  (x as { versao: number }).versao = 7;
  if (!Array.isArray(x.luto)) x.luto = [];
  for (const vin of Object.values(x.vinculos)) {
    const p = x.pessoas[vin.pessoaId];
    if (!finito(vin.confianca)) vin.confianca = Math.max(0, Math.min(100, Math.round((vin.parentesco ? 45 + vin.proximidade * 0.4 : 20 + vin.proximidade * 0.3) - vin.tensao / 3)));
    vin.historia = (Array.isArray(vin.historia) ? vin.historia : []).filter(h => h && typeof h.texto === 'string' && finito(h.t)).map(h => {
      if (h.tipo) return h;
      const m = TIPO_ANTIGO.find(([re]) => re.test(h.texto));
      return { ...h, tipo: m?.[1] ?? 'antigo', peso: m?.[2] ?? 1 };
    });
    const rom = vin.romance;
    if (rom) {
      if (rom.tInicio === undefined) rom.tInicio = vin.historia.find(h => h.tipo === 'romance')?.t ?? vin.tInicio;
      if (rom.estagio === 'ex' && !rom.fim) {
        const viuvo = p && !p.vivo && x.biografia.some(e => e.pessoas?.includes(p.id) && /Viúv/.test(e.texto));
        if (viuvo) {
          rom.estagio = vin.historia.some(h => h.tipo === 'casamento') ? 'casamento' : vin.historia.some(h => h.tipo === 'casa') ? 'morando_junto' : 'namoro';
          rom.fim = 'morte';
        } else {
          rom.fim = x.biografia.some(e => e.pessoas?.includes(vin.pessoaId) && /divórcio/.test(e.texto)) ? 'divorcio' : 'termino';
        }
      }
    }
    if ((vin.parentesco === 'filho' || vin.parentesco === 'enteado') && p && vin.presenca === undefined) {
      vin.presenca = Math.round(vin.convivio.includes('casa') ? vin.proximidade * 0.6 : vin.proximidade * 0.35);
    }
  }
  // Árvore: filhos do jogador.
  const parcerias = Object.values(x.vinculos).filter(vin => vin.romance && vin.romance.estagio !== 'interesse');
  for (const vin of Object.values(x.vinculos)) {
    const p = x.pessoas[vin.pessoaId];
    if (!p || p.genitores || vin.parentesco !== 'filho') continue;
    const naEpoca = parcerias
      .filter(pr => (pr.romance!.tInicio ?? pr.tInicio) <= p.tNasc && (x.pessoas[pr.pessoaId]?.tMorte ?? Infinity) >= p.tNasc - 9)
      .sort((a, b) => (b.romance!.tInicio ?? b.tInicio) - (a.romance!.tInicio ?? a.tInicio))[0];
    p.genitores = ['eu', ...(naEpoca && x.fatos[`outro_genitor_${p.id}`] !== 0 ? [naEpoca.pessoaId] : [])];
  }
  // Árvore: netos (o motor antigo não guardava de quem eram filhos).
  const filhosVivos = Object.values(x.vinculos).filter(vin => vin.parentesco === 'filho').map(vin => x.pessoas[vin.pessoaId]).filter(Boolean);
  for (const vin of Object.values(x.vinculos)) {
    const n = x.pessoas[vin.pessoaId];
    if (!n || n.genitores || vin.parentesco !== 'neto') continue;
    const pai = filhosVivos.find(f => f.sobrenome === n.sobrenome && f.municipioId === n.municipioId && f.tNasc + 16 * 12 <= n.tNasc)
      ?? filhosVivos.find(f => f.tNasc + 16 * 12 <= n.tNasc);
    if (pai) n.genitores = [pai.id];
  }
  // Referências soltas nunca entram no save novo.
  for (const p of Object.values(x.pessoas)) {
    if (p.genitores) p.genitores = p.genitores.filter(g => g === 'eu' || x.pessoas[g]);
    if (p.parceiroId && p.parceiroId !== 'fora' && !x.pessoas[p.parceiroId]) p.parceiroId = undefined;
  }
  return x;
}

/* =================================================================== v5 → v6 */

/** O v5 é convertido para o formato atual e depois passa pela migração v6 → v7. */

type Antigo = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const CLASSE: Record<string, Classe> = {
  vulneravel: 'vulneravel', trabalhadora: 'trabalhadora', classe_media_baixa: 'media_baixa', classe_media: 'media', classe_alta: 'alta'
};
const ESCOLARIDADE: Record<string, Escolaridade> = {
  nenhuma: 'nenhuma', fundamental_incompleto: 'fundamental_incompleto', fundamental_completo: 'fundamental',
  medio_incompleto: 'medio_incompleto', medio_completo: 'medio', tecnico: 'tecnico',
  superior_incompleto: 'superior_incompleto', superior_completo: 'superior', pos_graduacao: 'pos'
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
    versao: 7 as unknown as 14,
    caminhos: undefined as unknown as Vida['caminhos'],
    luto: [],
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
    mente: { felicidade: num(p.stats?.felicidade, 70), estresse: num(p.hiddenStats?.estresse, 20), cognicao: num(p.stats?.inteligencia, 55), abalos: [], historico: [] },
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
    } as unknown as Vida['financas'],
    economia: undefined as unknown as Vida['economia'],
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
      pessoaId: pessoa.id, origem: 'familia', tInicio: t, proximidade: num(m.relacionamento, 50), confianca: 50, tensao: 0,
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
    const fv9 = v.financas as unknown as FinancasV9;
    if (inv.tipo === 'acoes_b3' || inv.tipo === 'cripto') fv9.acoes += saldo; else fv9.reserva += saldo;
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
