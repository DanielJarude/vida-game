/**
 * VIDA 28 — O ELENCO E O MERCADO AUTÔNOMO. Até aqui, o clube da vida não tinha gente: o mercado só existia para o
 * personagem (a proposta, o empréstimo, a renovação) e as estrelas do mundo (`premiosDoFutebol`) trocavam de clube
 * longe dele. Agora o clube tem um ELENCO com nome — os concorrentes na sua posição, o capitão, a estrela, o garoto que
 * subiu da base — e o mercado anda sozinho, na janela de cada ano, pelas regras da modalidade:
 *
 *   futebol e futsal  contrato com prazo e multa: o clube VENDE quem se valorizou (para um clube maior, de outra
 *                     divisão ou de fora, com taxa), EMPRESTA o jovem que não joga, LIBERA quem acabou o contrato e não
 *                     rende, RENOVA quem ainda serve, CONTRATA para a vaga que abriu e SOBE alguém da base;
 *   basquete e vôlei  contrato por temporada: no fim dela, cada um renova ou sai livre (para um rival ou para fora);
 *                     sem taxa de transferência (a regra das ligas nacionais).
 *
 * Toda decisão tem motivo nos dados (idade, nível contra a divisão, contrato, minutos, necessidade da posição, porte do
 * clube); nada é sorteado do nada. O que o mercado faz pesa na vida: o concorrente direto mais forte que chega aperta a
 * titularidade (`concorrenciaNaPosicao`); o que sai abre espaço. O concorrente e um parceiro de time são PESSOAS (com
 * vínculo: a rivalidade e a amizade de vestiário são relações de verdade, `sistemas/relacoes28`); o resto do elenco é
 * leve (nome, papel, nível, contrato) para o save não crescer sem limite.
 *
 * Os sorteios são derivados (`rngDe`): o mercado não muda a sequência do resto da vida.
 */
import { clamp, rngDe, type Rng } from '../rng';
import type { CarreiraEsportiva, Dominio, Genero, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { anoDe } from '../tempo';
import { sortearNome, sortearSobrenome } from '../dados/nomes';
import { clubesDoPais, clubePorNome, oClube, doClube } from '../dados/clubes';
import { paisDaCidade } from '../dados/lugares';
import { criarPessoa, vincular } from '../pessoas';
import { dinheiro } from '../texto';
import { efeitosDoPerfil } from './arquetipos';

export type Movimento28 = 'chegou' | 'vendido' | 'emprestado' | 'voltou' | 'livre' | 'renovou' | 'subiu_da_base' | 'aposentou';

export interface AtletaDoElenco {
  id: string;
  nome: string;
  genero: Genero;
  tNasc: number;
  /** A posição (futebol), a função (basquete, vôlei, futsal). */
  papel: string;
  /** O nível de jogo (a mesma escala da técnica). */
  nivel: number;
  potencial: number;
  contratoAte: number;
  salario: number;
  desde: number;
  /** Emprestado a outro clube até esta data (volta depois). */
  emprestadoAte?: number;
  emprestadoPara?: string;
  /** Uma Pessoa da vida (o concorrente direto, o parceiro de time): o vínculo é dela. */
  pessoaId?: string;
}

export interface Elenco28 {
  clube: string;
  /** O ano da última janela processada. */
  ano: number;
  atletas: AtletaDoElenco[];
  /** As últimas movimentações (até 24): quem chegou, quem saiu, para onde, por quanto, por quê. */
  movimentos: { ano: number; tipo: Movimento28; nome: string; papel: string; texto: string; taxa?: number }[];
}

/** O mercado da modalidade: há taxa de transferência e empréstimo? O contrato dura quanto? */
export const REGRAS_DO_MERCADO: Partial<Record<Dominio, { taxa: boolean; emprestimo: boolean; meses: [number, number]; tamanho: number }>> = {
  futebol: { taxa: true, emprestimo: true, meses: [12, 48], tamanho: 9 },
  futsal: { taxa: true, emprestimo: false, meses: [12, 24], tamanho: 7 },
  basquete: { taxa: false, emprestimo: false, meses: [12, 12], tamanho: 7 },
  volei: { taxa: false, emprestimo: false, meses: [12, 12], tamanho: 7 }
};

/** Os papéis do elenco por modalidade (o titular de cada posição; o personagem ocupa o dele e tem um concorrente). */
const PAPEIS: Partial<Record<Dominio, string[]>> = {
  futebol: ['goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'ponta', 'atacante'],
  futsal: ['goleiro', 'fixo', 'ala_esquerda', 'ala_direita', 'pivo'],
  basquete: ['armador', 'ala', 'pivo'],
  volei: ['levantador', 'ponteiro', 'oposto', 'central', 'libero']
};

const idadeDe = (v: Vida, a: AtletaDoElenco) => Math.floor((v.t - a.tNasc) / 12);

/** A régua da divisão (o nível de quem é titular nela) — a mesma conta do mercado do personagem, lida por quem chama. */
export interface ContextoDoElenco { regua: number; papel: string; salarioBase: number }

function novoAtleta(v: Vida, r: Rng, e: CarreiraEsportiva, papel: string, regua: number, salarioBase: number, k: number, faixa: [number, number], estrela = false): AtletaDoElenco {
  const pais = paisDaCidade(e.municipioId);
  const i = r.int(faixa[0], faixa[1]);
  const genero: Genero = v.eu.genero === 'feminino' ? 'feminino' : 'masculino';
  const nome = `${sortearNome(r, genero, anoDe(v.t) - i, pais)} ${sortearSobrenome(r, pais)}`;
  const nivel = Math.round(clamp(regua + r.normal() * 5 + (estrela ? 8 : 0) - (i <= 20 ? 6 : 0), 30, 97));
  const potencial = Math.round(clamp(nivel + (i <= 22 ? r.int(2, 12) : i <= 26 ? r.int(0, 4) : 0), nivel, 98));
  const regras = REGRAS_DO_MERCADO[e.modalidade]!;
  return { id: `el${anoDe(v.t)}${k}${Math.floor(r.next() * 1e6)}`, nome, genero, tNasc: v.t - i * 12 - r.int(0, 11), papel, nivel, potencial,
    contratoAte: v.t + r.int(regras.meses[0], regras.meses[1]), salario: Math.round(salarioBase * clamp(0.5 + (nivel - regua) / 20, 0.3, 2.5) / 100) * 100, desde: v.t };
}

/** O elenco do clube de agora (montado na primeira vez, e de novo ao trocar de clube). Só nas modalidades de clube. */
export function garantirElenco(v: Vida, e: CarreiraEsportiva, ctx: ContextoDoElenco): Elenco28 | undefined {
  const regras = REGRAS_DO_MERCADO[e.modalidade];
  const papeis = PAPEIS[e.modalidade];
  if (!regras || !papeis || e.fase !== 'profissional') return undefined;
  if (e.elenco28 && e.elenco28.clube === e.clube) return e.elenco28;
  const r = rngDe(v.id, 'elenco28', e.clube, e.tFase);
  const atletas: AtletaDoElenco[] = [];
  // O concorrente direto (um da mesma posição, perto do seu nível) e um jovem da posição.
  atletas.push(novoAtleta(v, r, e, ctx.papel, ctx.regua, ctx.salarioBase, 0, [22, 31]));
  atletas.push(novoAtleta(v, r, e, ctx.papel, ctx.regua - 4, ctx.salarioBase, 1, [17, 20]));
  // Os titulares das outras posições; a estrela é um deles.
  const outros = papeis.filter(p => p !== ctx.papel);
  outros.forEach((p, k) => atletas.push(novoAtleta(v, r, e, p, ctx.regua, ctx.salarioBase, k + 2, [20, 33], k === 1)));
  while (atletas.length < regras.tamanho) atletas.push(novoAtleta(v, r, e, r.pick(outros), ctx.regua - 3, ctx.salarioBase, atletas.length, [19, 30]));
  const el: Elenco28 = { clube: e.clube, ano: anoDe(v.t) - 1, atletas, movimentos: [] };
  // O concorrente direto é uma pessoa da vida (a rivalidade é uma relação); o mais velho do elenco, o capitão do grupo, também.
  const conc = atletas[0];
  conc.pessoaId = pessoaDoElenco(v, r, e, conc, 'concorrente').id;
  const veterano = [...atletas].slice(2).sort((a, b) => a.tNasc - b.tNasc)[0];
  if (veterano) veterano.pessoaId = pessoaDoElenco(v, r, e, veterano, 'parceiro').id;
  e.elenco28 = el;
  return el;
}

function pessoaDoElenco(v: Vida, r: Rng, e: CarreiraEsportiva, a: AtletaDoElenco, papel: 'concorrente' | 'parceiro') {
  const [nome, ...sob] = a.nome.split(' ');
  const p = criarPessoa(v, r, { idade: idadeDe(v, a), municipioId: e.municipioId, genero: a.genero, nome, sobrenome: sob.join(' ') || undefined });
  p.ocupacao = e.modalidade === 'futebol' ? (a.genero === 'feminino' ? 'jogadora de futebol' : 'jogador de futebol') : a.genero === 'feminino' ? 'atleta' : 'atleta';
  p.renda = a.salario;
  const vin = vincular(v, p, { origem: 'trabalho', proximidade: papel === 'parceiro' ? 30 : 18, convivio: ['trabalho'], estagio: 'colega' });
  // O ambiente é o do trabalho de atleta (o mesmo que `social.recalcularConvivio` reconhece): convivem enquanto você está no clube.
  const emp = v.trabalho.atual;
  vin.ambiente = emp ? `trabalho:${emp.empregador}:${emp.tInicio}` : `clube:${e.clube}`;
  // VIDA 28 · relações: o concorrente direto começa como rival (a disputa da vaga); o parceiro, com respeito.
  if (papel === 'concorrente') vin.rivalidade = 30; else vin.respeito = 40;
  return p;
}

/** O melhor da sua posição no elenco (sem os emprestados): é com ele que se disputa a vaga. */
export function concorrenteNaPosicao(v: Vida, e: CarreiraEsportiva, papel: string): AtletaDoElenco | undefined {
  const el = e.elenco28;
  if (!el || el.clube !== e.clube) return undefined;
  return el.atletas.filter(a => a.papel === papel && !(a.emprestadoAte && a.emprestadoAte > v.t)).sort((a, b) => b.nivel - a.nivel)[0];
}

/**
 * A concorrência na régua do treinador (pontos): o concorrente bem melhor aperta; o bem pior abre a vaga. Limitado —
 * a temporada e a técnica continuam decidindo quase tudo.
 */
export function concorrenciaNaPosicao(v: Vida, e: CarreiraEsportiva, papel: string, h: number): number {
  const c = concorrenteNaPosicao(v, e, papel);
  if (!c) return 0;
  const d = c.nivel - h;
  return d > 2 ? -clamp((d - 2) * 0.4, 0, 3) : d < -4 ? 1 : 0;
}

/** O valor de mercado de um atleta do elenco (a taxa que um clube paga): nível acima da régua, idade, contrato que resta. */
function taxaDoAtleta(v: Vida, a: AtletaDoElenco, regua: number, salarioBase: number): number {
  const i = idadeDe(v, a);
  const anos = Math.max(0, (a.contratoAte - v.t) / 12);
  return Math.round(salarioBase * 12 * clamp(1 + (a.nivel - regua) / 6, 0.2, 6) * (i <= 23 ? 1.6 : i <= 27 ? 1.2 : i <= 30 ? 0.8 : 0.4) * clamp(0.4 + anos * 0.3, 0.4, 1.3) / 1000) * 1000;
}

/** Um clube de destino: maior (venda), menor (empréstimo, liberação), do mesmo porte (troca). */
function destino(_v: Vida, e: CarreiraEsportiva, r: Rng, para: 'maior' | 'menor' | 'igual'): string {
  const pais = paisDaCidade(e.municipioId);
  const meu = clubePorNome(e.clube, pais)?.porte ?? 'regional';
  const ordem = ['regional', 'tradicional', 'grande'];
  const alvo = para === 'maior' ? ordem[Math.min(2, ordem.indexOf(meu) + 1)] : para === 'menor' ? ordem[Math.max(0, ordem.indexOf(meu) - 1)] : meu;
  if (e.modalidade !== 'futebol') return para === 'maior' && r.chance(0.35) ? 'uma equipe de fora do país' : para === 'menor' ? 'uma equipe de divisão menor' : 'uma equipe rival';
  const lista = clubesDoPais(pais).filter(c => c.porte === alvo && c.nome !== e.clube);
  if (para === 'maior' && meu === 'grande') return r.chance(0.6) ? 'um clube europeu' : r.pick(lista.length ? lista : clubesDoPais(pais)).nome;
  return (lista.length ? r.pick(lista) : r.pick(clubesDoPais(pais).filter(c => c.nome !== e.clube))).nome;
}

/**
 * A JANELA do ano (chamada no fim da temporada do personagem): cada atleta envelhece e evolui; o contrato, o nível, a
 * idade e a necessidade do clube decidem renovar, vender, emprestar, liberar; as vagas abertas são preenchidas. Devolve
 * as movimentações do ano (a tela e a História leem `elenco28.movimentos`).
 */
export function janelaDoElenco(v: Vida, e: CarreiraEsportiva, ctx: ContextoDoElenco): Elenco28['movimentos'] {
  const el = garantirElenco(v, e, ctx);
  if (!el) return [];
  const ano = anoDe(v.t);
  if (el.ano >= ano && el.movimentos.some(m => m.ano === ano)) return [];
  el.ano = ano;
  const regras = REGRAS_DO_MERCADO[e.modalidade]!;
  const r = rngDe(v.id, 'janela28', e.clube, ano);
  const feitos: Elenco28['movimentos'] = [];
  const mover = (a: AtletaDoElenco, tipo: Movimento28, texto: string, taxa?: number) => feitos.push({ ano, tipo, nome: a.nome, papel: a.papel, texto, ...(taxa ? { taxa } : {}) });
  const saem = new Set<string>();
  for (const a of el.atletas) {
    const i = idadeDe(v, a);
    // O ano no corpo: o jovem cresce para o potencial, o veterano cai.
    a.nivel = Math.round(clamp(a.nivel + (i <= 23 ? Math.min(4, (a.potencial - a.nivel) * 0.35) : i <= 29 ? r.normal() * 0.8 : -(0.5 + (i - 29) * 0.6)) + r.normal() * 0.8, 25, 98));
    // O empréstimo que acabou: volta.
    if (a.emprestadoAte && a.emprestadoAte <= v.t) { mover(a, 'voltou', `${a.nome} voltou do empréstimo ${doClube(a.emprestadoPara ?? 'outro clube')}.`); a.emprestadoAte = undefined; a.emprestadoPara = undefined; continue; }
    if (a.emprestadoAte) continue;
    // Aposentadoria.
    if (i >= 35 && (a.nivel < ctx.regua - 4 || r.chance((i - 34) * 0.25))) { saem.add(a.id); mover(a, 'aposentou', `${a.nome} pendurou ${e.modalidade === 'futebol' ? 'as chuteiras' : 'o uniforme'}, aos ${i}.`); continue; }
    // Valorizado: um clube maior paga (no futebol e no futsal, com taxa). Quanto melhor e mais novo, mais chance.
    if (regras.taxa && a.nivel >= ctx.regua + 5 && i <= 29 && r.chance(clamp(0.15 + (a.nivel - ctx.regua - 5) * 0.06, 0, 0.55))) {
      const para = destino(v, e, r, 'maior');
      const taxa = taxaDoAtleta(v, a, ctx.regua, ctx.salarioBase);
      saem.add(a.id);
      mover(a, 'vendido', `${oClube(e.clube).replace(/^./, m => m.toUpperCase())} vendeu ${a.nome} para ${para.startsWith('um') ? para : oClube(para)} por ${dinheiro(taxa)}: o clube não segurou a proposta.`, taxa);
      continue;
    }
    // O contrato acaba: renova quem ainda serve (e quer ficar); sai de graça quem não rende ou recebeu proposta melhor.
    if (a.contratoAte <= v.t + 6) {
      const serve = a.nivel >= ctx.regua - 3 && i <= 33;
      if (serve && r.chance(0.75)) { a.contratoAte = v.t + r.int(regras.meses[0], regras.meses[1]); a.salario = Math.round(a.salario * clamp(1 + (a.nivel - ctx.regua) / 40, 0.85, 1.25) / 100) * 100; mover(a, 'renovou', `${a.nome} renovou o contrato.`); continue; }
      const para = destino(v, e, r, serve ? (r.chance(0.5) ? 'igual' : 'maior') : 'menor');
      saem.add(a.id);
      mover(a, 'livre', `${a.nome} saiu de graça, no fim do contrato${serve ? `, para ${para.startsWith('um') ? para : oClube(para)} — proposta melhor` : `: ${para.startsWith('um') ? para : oClube(para)} ficou com ele`}.`);
      continue;
    }
    // O jovem que não joga: emprestado para ganhar minutos (o contrato continua aqui).
    if (regras.emprestimo && i <= 21 && a.nivel < ctx.regua - 2 && r.chance(0.4)) {
      const para = destino(v, e, r, 'menor');
      a.emprestadoAte = v.t + 12; a.emprestadoPara = para;
      mover(a, 'emprestado', `${a.nome}, ${i} anos, foi emprestado ${para.startsWith('um') ? `a ${para}` : `${oClube(para).startsWith('a ') ? 'à' : 'ao'} ${para}`} para jogar mais.`);
    }
  }
  el.atletas = el.atletas.filter(a => !saem.has(a.id));
  // As vagas: cada posição precisa de um titular; a do personagem, de um concorrente. Quem chega vem de outro clube (ou da base).
  const papeis = PAPEIS[e.modalidade]!;
  const necessarias = [...papeis, ctx.papel];
  for (const p of necessarias) {
    const tem = el.atletas.filter(a => a.papel === p && !(a.emprestadoAte && a.emprestadoAte > v.t)).length;
    const precisa = necessarias.filter(x => x === p).length - (p === ctx.papel ? 1 : 0);
    for (let k = tem; k < Math.max(precisa, p === ctx.papel ? 1 : 1); k++) {
      const daBase = r.chance(0.3);
      const novo = novoAtleta(v, r, e, p, ctx.regua - (daBase ? 4 : 0), ctx.salarioBase, el.atletas.length + k, daBase ? [17, 19] : [21, 30], !daBase && r.chance(0.15));
      el.atletas.push(novo);
      if (daBase) mover(novo, 'subiu_da_base', `${novo.nome}, ${idadeDe(v, novo)} anos, subiu da base para o elenco principal.`);
      else {
        const de = destino(v, e, r, r.chance(0.6) ? 'menor' : 'igual');
        const taxa = regras.taxa && r.chance(0.6) ? taxaDoAtleta(v, novo, ctx.regua, ctx.salarioBase) : 0;
        mover(novo, 'chegou', `${oClube(e.clube).replace(/^./, m => m.toUpperCase())} contratou ${novo.nome} ${de.startsWith('um') ? `de ${de.replace(/^um/, 'um')}` : doClube(de)}${taxa ? `, por ${dinheiro(taxa)}` : ', sem custo de transferência'}: veio para a vaga de ${nomeDoPapel(p)}.`, taxa || undefined);
      }
    }
  }
  if (el.atletas.length > regras.tamanho + 3) el.atletas.splice(0, el.atletas.length - regras.tamanho - 3);
  el.movimentos = [...el.movimentos, ...feitos].slice(-24);
  // O que mexe com a SUA vaga entra na História: o concorrente que sai, o que chega melhor que você.
  const saiu = feitos.find(m => m.papel === ctx.papel && ['vendido', 'livre', 'aposentou', 'emprestado'].includes(m.tipo));
  const chegou = feitos.find(m => m.papel === ctx.papel && m.tipo === 'chegou');
  if (saiu) escrever(v, { texto: `${saiu.texto} A disputa pela ${nomeDoPapel(ctx.papel)} ficou mais aberta.`, relevancia: 'cotidiano', tema: 'trabalho', fio: 'esporte' });
  if (chegou) { const n = el.atletas.find(a => a.nome === chegou.nome); if (n && n.nivel >= ctx.regua) escrever(v, { texto: `${chegou.texto} É concorrência direta para você.`, relevancia: 'cotidiano', tema: 'trabalho', fio: 'esporte' }); }
  // O vestiário: o perfil do personagem aproxima ou desgasta quem é do time (as pessoas do elenco).
  const vest = efeitosDoPerfil(e.perfil28).vestiario;
  for (const a of el.atletas) {
    const vin = a.pessoaId ? v.vinculos[a.pessoaId] : undefined;
    if (!vin) continue;
    vin.proximidade = clamp(vin.proximidade + vest * 2 + 1);
    if (vest < 0) vin.tensao = clamp(vin.tensao - vest * 3);
  }
  return feitos;
}

export const NOME_PAPEL28: Record<string, string> = {
  goleiro: 'posição de goleiro', zagueiro: 'zaga', lateral: 'lateral', volante: 'posição de volante', meia: 'meia', ponta: 'ponta', atacante: 'posição de atacante',
  fixo: 'posição de fixo', ala_esquerda: 'ala esquerda', ala_direita: 'ala direita', pivo: 'posição de pivô', armador: 'armação', ala: 'posição de ala',
  levantador: 'levantamento', ponteiro: 'ponta', oposto: 'posição de oposto', central: 'posição de central', libero: 'posição de líbero'
};
export const nomeDoPapel = (p: string) => NOME_PAPEL28[p] ?? p;
