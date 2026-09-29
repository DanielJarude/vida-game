/**
 * Esporte: do campinho ao contrato — e, quase sempre, de volta à vida comum.
 *
 *   jogar → treinar (escolinha, time) → destacar-se nos campeonatos → um
 *   treinador indica para a PENEIRA → passar (raro) → BASE (treino todo dia,
 *   escola à noite, às vezes longe de casa) → dispensa (o mais comum) ou
 *   CONTRATO profissional (raríssimo) → clubes, lesões, reserva, transferência
 *   → fim de carreira cedo → o próximo caminho.
 *
 * Nada disso é sorteio puro: a peneira aparece para quem pratica e se
 * destaca; passar depende da habilidade construída (facilidade × anos ×
 * intensidade × idade certa); o contrato depende de continuar evoluindo na
 * base. Tentar é bem mais comum que conseguir. Fracassar no sonho também é
 * biografia — e a escola, o trabalho e as outras frentes continuam lá.
 *
 * Futebol é o caminho mais fundo (contexto brasileiro); vôlei, natação,
 * atletismo e lutas usam a mesma estrutura, com seletivas e equipes.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraEsportiva, Dominio, Posicao, Temporada, Vida } from '../tipos';
import { escrever, idade, lembrarCom, marcarFato, pais, temFato } from '../nucleo';
import { municipio, MUNICIPIOS } from '../dados/lugares';
import { estruturaEsportiva } from '../dados/mercado';
import { ocupacao } from '../dados/ocupacoes';
import { habilidade, praticar } from './frentes';
import { marcar } from './marcas';
import { contratar, encerrarEmprego } from './trabalho';
import { capitalDoEstado } from './escola';
import { flex, ge } from '../texto';
import { novaOportunidade } from './oportunidades';
import { aoClube, clubeDoNivel, CLUBES, clubesDaCidade, DIVISAO_DO_NIVEL, doClube, equipeDaCidade, noClube, oClube, peloClube } from '../dados/clubes';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
import { abalar } from './abalo';
import { lesaoAtiva, lesionar, mesesForaNoAno } from './lesoes';
import { fatorDeRiscoFisico } from './sobrecarga';
import { SALARIO_MINIMO } from './renda';
import { anoDe } from '../tempo';

export const MODALIDADES: Dominio[] = ['futebol', 'volei', 'natacao', 'atletismo', 'lutas'];

const NOME_MOD: Partial<Record<Dominio, string>> = { futebol: 'futebol', volei: 'vôlei', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta' };
const EQUIPE: Partial<Record<Dominio, string>> = { futebol: 'a base', volei: 'a equipe de base', natacao: 'a equipe de natação', atletismo: 'a equipe de atletismo', lutas: 'a equipe de competição' };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/**
 * O clube de uma cidade: no futebol, um clube real com categorias de base
 * na cidade (ou, se não houver, na capital do estado); nos outros esportes,
 * o clube poliesportivo de referência ou a equipe da prefeitura. O que
 * acontece no clube é simulação (`dados/clubes`).
 */
export function nomeDeClube(municipioId: string, semente: string, d: Dominio = 'futebol'): string {
  const h = hash(`${municipioId}:${semente}`);
  if (d !== 'futebol') return equipeDaCidade(municipioId, municipio(municipioId).nome, h, d);
  const aqui = clubesDaCidade(municipioId);
  const lista = aqui.length ? aqui : clubesDaCidade(capitalDoEstado(municipioId));
  if (lista.length) return lista[Math.floor(h * lista.length) % lista.length].nome;
  return clubeDoNivel(2, h).nome;
}

/** Onde fica a peneira: no futebol, onde há clube com base; nos outros esportes, onde há estrutura — senão, na capital. */
export function ondeTreina(v: Vida, d: Dominio = 'futebol'): string {
  const aqui = v.moradia.municipioId;
  if (d === 'futebol') return clubesDaCidade(aqui).length ? aqui : capitalDoEstado(aqui);
  return estruturaEsportiva(aqui) >= 1 ? aqui : capitalDoEstado(aqui);
}

/** O teto de divisão de um clube na simulação (os grandes chegam à elite; os regionais, às divisões de acesso). */
const tetoDoClube = (nome: string) => { const c = CLUBES.find(x => x.nome === nome); return !c ? 2 : c.porte === 'grande' ? 4 : c.porte === 'tradicional' ? 3 : 2; };
/** Troca o clube do atleta (e o empregador), no nível da simulação. */
export function mudarDeClube(v: Vida, e: CarreiraEsportiva, nivel: 1 | 2 | 3 | 4): string {
  const novo = e.modalidade === 'futebol' ? clubeDoNivel(nivel, hash(`${v.id}:${v.t}:clube`), e.clube).nome : e.clube;
  e.clube = novo;
  e.nivel = nivel;
  const emp = v.trabalho.atual;
  if (emp && ['jogador_futebol', 'atleta'].includes(emp.ocupacaoId)) emp.empregador = oClube(novo);
  return novo;
}

/** A modalidade que a pessoa pratica com mais seriedade agora. */
export function modalidadePrincipal(v: Vida): { d: Dominio; nivel: number } | undefined {
  const lista = v.rotinas.filter(r => MODALIDADES.includes(r.id as Dominio)).map(r => ({ d: r.id as Dominio, nivel: r.nivel ?? 1 }));
  return lista.sort((a, b) => b.nivel - a.nivel || habilidade(v, b.d) - habilidade(v, a.d))[0];
}

const nivelPelaHabilidade = (h: number): 1 | 2 | 3 | 4 => (h < 74 ? 1 : h < 81 ? 2 : h < 88 ? 3 : 4);

/* ------------------------------------------------------------ Posição */

export const POSICOES: Posicao[] = ['goleiro', 'lateral', 'zagueiro', 'volante', 'meia', 'ponta', 'atacante'];
export const NOME_POSICAO: Record<Posicao, [string, string]> = {
  goleiro: ['goleiro', 'goleira'], lateral: ['lateral', 'lateral'], zagueiro: ['zagueiro', 'zagueira'], volante: ['volante', 'volante'],
  meia: ['meia', 'meia'], ponta: ['ponta', 'ponta'], atacante: ['atacante', 'atacante']
};
export const nomePosicao = (v: Vida, p: Posicao) => NOME_POSICAO[p][ge(v) === 'feminino' ? 1 : 0];
/** O que cada posição pede e o que a temporada mede (dito na hora de escolher). */
export const SOBRE_POSICAO: Record<Posicao, string> = {
  goleiro: 'Joga menos com os pés, mais com os nervos. Conta jogo sem sofrer gol. É a posição que dura mais: goleiro joga bem depois dos 35.',
  lateral: 'Sobe e volta o jogo inteiro: pede fôlego. Conta desarme, assistência, um gol de vez em quando. O fôlego cobra cedo.',
  zagueiro: 'Posicionamento, força, tempo de bola. Conta desarme e jogo sem sofrer gol; gol, só de cabeça, em escanteio. Dura bastante.',
  volante: 'Marca e distribui. Conta desarme e passe; aparece pouco no placar, muito no time.',
  meia: 'Pensa o jogo. Conta assistência e gol. Técnica pesa mais do que corpo.',
  ponta: 'Velocidade e drible. Conta gol e assistência. É a posição que o tempo cobra primeiro.',
  atacante: 'Vive do gol — e é cobrado por ele. Conta gol, acima de tudo.'
};
/** O auge físico de cada posição: depois dele, o rendimento cai um pouco a cada ano (goleiro dura mais; ponta, menos). */
export const AUGE_POSICAO: Record<Posicao, number> = { goleiro: 33, zagueiro: 31, volante: 30, meia: 30, lateral: 29, ponta: 28, atacante: 29 };
const RISCO_POSICAO: Record<Posicao, number> = { goleiro: 0.7, zagueiro: 1, volante: 1.05, meia: 0.95, lateral: 1.1, ponta: 1.15, atacante: 1.1 };

/** A posição que o jeito de jogar sugere (determinística: da semente e do corpo). */
export function posicaoSugerida(v: Vida): Posicao {
  const h = hash(`${v.id}:posicao`);
  const fis = v.predisposicoes?.fisica ?? 0;
  const pesos: Record<Posicao, number> = { goleiro: 0.8, lateral: 1.2 + fis * 0.3, zagueiro: 1 + fis * 0.4, volante: 1.2, meia: 1.3 - fis * 0.2, ponta: 1.1 + fis * 0.3, atacante: 1.4 };
  const total = POSICOES.reduce((t, p) => t + Math.max(0.1, pesos[p]), 0);
  let x = h * total;
  for (const p of POSICOES) { x -= Math.max(0.1, pesos[p]); if (x <= 0) return p; }
  return 'atacante';
}

const posicaoDe = (v: Vida, e: CarreiraEsportiva): Posicao => e.posicao ?? posicaoSugerida(v);
/** O auge do corpo para ESTE atleta: a posição no futebol; a modalidade nos outros esportes. */
const AUGE_MODALIDADE: Partial<Record<Dominio, number>> = { volei: 31, natacao: 26, atletismo: 28, lutas: 30 };
export const augeDe = (v: Vida, e: CarreiraEsportiva) => (e.modalidade === 'futebol' ? AUGE_POSICAO[posicaoDe(v, e)] : AUGE_MODALIDADE[e.modalidade] ?? 29);

/* ------------------------------------------------------------ Salário */

/**
 * O salário de um contrato de atleta (bruto, mensal): FONTE ÚNICA. A divisão
 * e o tamanho do clube, o espaço no time, o nome no mercado (reputação) e a
 * fase da carreira. Um titular consolidado da elite ganha muitas vezes o que
 * ganha um reserva da divisão de acesso — como na vida.
 */
const BASE_FUTEBOL = [0, 2200, 7500, 26000, 95000];
const BASE_OUTROS = [0, 1800, 4000, 9500, 26000];
export function salarioDoContrato(v: Vida, e: CarreiraEsportiva, nivel: number = e.nivel, espaco: CarreiraEsportiva['espaco'] = e.espaco): number {
  const i = idade(v);
  const base = (e.modalidade === 'futebol' ? BASE_FUTEBOL : BASE_OUTROS)[nivel] ?? 0;
  const rep = e.reputacao ?? 30;
  const papel = espaco === 'titular' ? 1 : 0.55;
  const nome = 0.55 + (rep / 100) * 0.95;
  const fase = i < 20 ? 0.6 : i < 23 ? 0.85 : 1;
  return Math.max(SALARIO_MINIMO, Math.round(base * papel * nome * fase / 100) * 100);
}

/** Assina (ou renova) um contrato: o salário sai daqui e só daqui. */
export function assinarContrato(v: Vida, e: CarreiraEsportiva, meses: number, fator = 1): void {
  e.contratoAte = v.t + meses;
  const emp = v.trabalho.atual;
  if (emp && ['jogador_futebol', 'atleta'].includes(emp.ocupacaoId)) emp.salario = Math.round(salarioDoContrato(v, e) * fator / 100) * 100;
}

/* ------------------------------------------------------------ Mercado */

/** O limiar de nome (reputação ajustada pela última temporada) que cada divisão pede. */
const LIMIAR_NIVEL = [0, 8, 34, 50, 64];

/** O que o mercado enxerga de você agora: o nome, a última temporada, a idade para a posição. */
export function valorDeMercado(v: Vida, e: CarreiraEsportiva): number {
  const t = e.temporadas?.[e.temporadas.length - 1];
  const nota = t ? t.nota : 6;
  const pos = posicaoDe(v, e);
  const passou = Math.max(0, idade(v) - augeDe(v, e) - (e.foco === 'preservar' ? 2 : 1));
  void pos;
  return (e.reputacao ?? 30) + (nota - 6) * 6 - passou * passou * 0.9;
}

/** A melhor divisão que ainda quer você (0 = nenhum clube). */
export function nivelQueOMercadoOferece(v: Vida, e: CarreiraEsportiva): number {
  const x = valorDeMercado(v, e);
  for (let n = 4; n >= 1; n--) if (x >= LIMIAR_NIVEL[n]) return n;
  return 0;
}

/** O clube atual quer renovar? Quer quem ainda rende para a divisão em que está. */
export function clubeQuerRenovar(v: Vida, e: CarreiraEsportiva): boolean {
  const voltouDeSuspensao = v.fatos['suspenso_doping'] !== undefined && v.t - v.fatos['suspenso_doping'] < 60;
  return nivelQueOMercadoOferece(v, e) >= e.nivel + (voltouDeSuspensao ? 1 : 0) - (e.espaco === 'titular' ? 0 : 0);
}

/* ------------------------------------------------------------ Temporada */

const PARTIDAS = [0, 20, 30, 38, 38];
const GOL: Record<Posicao, number> = { goleiro: 0, lateral: 0.05, zagueiro: 0.05, volante: 0.06, meia: 0.18, ponta: 0.3, atacante: 0.46 };
const ASSIST: Record<Posicao, number> = { goleiro: 0.005, lateral: 0.14, zagueiro: 0.03, volante: 0.1, meia: 0.27, ponta: 0.24, atacante: 0.14 };
const DEFESA: Record<Posicao, number> = { goleiro: 0.3, lateral: 1.2, zagueiro: 2.2, volante: 2, meia: 0.5, ponta: 0.2, atacante: 0.1 };

/**
 * Uma temporada, em poucos números com consequência. A nota da temporada
 * nasce da técnica diante do nível da divisão, do condicionamento, da idade
 * para a posição, da lesão (meses fora, ou jogar no sacrifício) — e do dia.
 */
export function fecharTemporada(v: Vida, r: Rng, e: CarreiraEsportiva): Temporada {
  const i = idade(v);
  const pos = posicaoDe(v, e);
  const h = habilidade(v, e.modalidade);
  const fora = mesesForaNoAno(v);
  const les = lesaoAtiva(v);
  const sacrificio = les?.lesao.cuidado === 'sacrificio';
  const futebol = e.modalidade === 'futebol';
  const passou = Math.max(0, i - augeDe(v, e));
  // Depois do auge, o corpo cobra a cada ano — menos de quem se preservou, mais de quem forçou.
  const desgaste = e.foco === 'preservar' ? 0.7 : e.foco === 'forcar' ? 1.25 : 1;
  let nota = 6 + (h - (70 + e.nivel * 3)) / 4 + (v.corpo.forma - 70) / 22 - passou * (futebol && pos === 'goleiro' ? 0.18 : 0.3) * desgaste - (sacrificio ? 0.9 : 0) + r.normal() * 0.6;
  nota = Math.round(clamp(nota, 2.5, 9.6) * 10) / 10;
  // Nos outros esportes, a temporada é um calendário de competições; o que conta são os pódios.
  const max = futebol ? PARTIDAS[e.nivel] : [0, 8, 10, 12, 12][e.nivel];
  const disp = (12 - fora) / 12;
  const partidas = Math.max(0, Math.round(max * disp * (e.espaco === 'titular' ? 0.92 : 0.45) * (0.9 + r.next() * 0.15)));
  const titular = Math.min(partidas, Math.round(partidas * (e.espaco === 'titular' ? 0.88 : 0.3)));
  const peso = (titular + (partidas - titular) * 0.35) * Math.max(0.25, nota / 6.5);
  const gols = Math.round(peso * (futebol ? GOL[pos] : clamp((nota - 5) / 8, 0.02, 0.5)) * (0.75 + r.next() * 0.5));
  const assistencias = futebol ? Math.round(peso * ASSIST[pos] * (0.75 + r.next() * 0.5)) : 0;
  const defesa = futebol && (pos === 'goleiro' || pos === 'zagueiro' || pos === 'lateral' || pos === 'volante') ? Math.round(peso * DEFESA[pos] * (0.8 + r.next() * 0.4)) : undefined;
  // Onde o time terminou: a força do clube na divisão, a sua temporada, e o resto do elenco.
  const forcaClube = (tetoDoClube(e.clube) - e.nivel) * 3;
  const colocacao = Math.round(clamp(11 - forcaClube - (nota - 6) * (e.espaco === 'titular' ? 1.6 : 0.6) + r.normal() * 4, 1, 20));
  const t: Temporada = { ano: anoDe(v.t - 6), clube: e.clube, nivel: e.nivel, posicao: e.modalidade === 'futebol' ? pos : undefined, partidas, titular, gols, assistencias, defesa, nota, colocacao, mesesFora: fora };
  (e.temporadas ??= []).push(t);
  if (e.temporadas.length > 20) e.temporadas.splice(0, e.temporadas.length - 20);
  // O nome no mercado: o que a temporada construiu (ou gastou). Divisão maior conta mais.
  const participacao = max ? titular / max : 0;
  const alvoRep = clamp((nota - 4.3) * 14 + (e.nivel - 1) * 6 + participacao * 10);
  e.reputacao = Math.round(clamp((e.reputacao ?? 30) * 0.55 + alvoRep * 0.45));
  return t;
}

/** A temporada em uma linha (tela, resumo do ano, Linha da Vida). */
export function linhaDaTemporada(_v: Vida, t: Temporada): string {
  if (!t.posicao) return `${['', 'competições regionais', 'circuito nacional de acesso', 'circuito nacional', 'elite nacional'][t.nivel]} · ${t.partidas} ${t.partidas === 1 ? 'competição' : 'competições'} · ${t.gols} ${t.gols === 1 ? 'pódio' : 'pódios'}${t.mesesFora >= 2 ? ` · ${t.mesesFora} meses fora por lesão` : ''}`;
  const div = DIVISAO_DO_NIVEL[t.nivel];
  const partes = [`${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'}`, `${t.titular} como titular`];
  if (t.posicao === 'goleiro') partes.push(`${t.defesa ?? 0} sem sofrer gol`);
  else {
    if (t.gols || t.posicao === 'atacante' || t.posicao === 'ponta' || t.posicao === 'meia') partes.push(`${t.gols} ${t.gols === 1 ? 'gol' : 'gols'}`);
    if (t.assistencias || t.posicao === 'meia' || t.posicao === 'ponta') partes.push(`${t.assistencias} ${t.assistencias === 1 ? 'assistência' : 'assistências'}`);
    if (t.defesa !== undefined) partes.push(`${t.defesa} desarmes`);
  }
  if (t.mesesFora >= 2) partes.push(`${t.mesesFora} meses fora por lesão`);
  return `${cap(div)} · ${t.colocacao}º lugar · ${partes.join(' · ')}`;
}

/** A temporada em uma palavra (o que o clube e o mercado leram). */
export const palavraDaNota = (n: number) => (n >= 8.2 ? 'temporada de destaque' : n >= 7 ? 'boa temporada' : n >= 5.8 ? 'temporada regular' : n >= 4.6 ? 'temporada fraca' : 'temporada ruim');

/** O nome no mercado, em palavras. */
export const palavraDaReputacao = (x: number) => (x >= 75 ? 'um dos nomes do campeonato' : x >= 58 ? 'nome respeitado no mercado' : x >= 40 ? 'jogador de confiança do elenco' : x >= 24 ? 'mais um no elenco' : 'pouco lembrado pelo mercado');

/* ------------------------------------------------------------ O ano */

export function processarEsporte(v: Vida, r: Rng): void {
  const i = idade(v);
  const e = v.caminhos.esporte;
  const mod = modalidadePrincipal(v);

  // Campeonatos da infância e da adolescência: destaque é marca.
  if (mod && i >= 8 && i <= 18 && !e) {
    const h = habilidade(v, mod.d);
    if (mod.nivel >= 2 && h >= 50 && !temFato(v, `destaque_${mod.d}`) && r.chance(0.5)) {
      marcarFato(v, `destaque_${mod.d}`);
      const texto = mod.d === 'futebol' ? `Foi ${flex(ge(v), 'o artilheiro', 'a artilheira')} do campeonato ${i <= 12 ? 'da escolinha' : 'entre escolas da cidade'}.` : `Ganhou a primeira medalha de ${NOME_MOD[mod.d]} num torneio regional.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
      marcar(v, 'destaque', texto, 2, { dominio: mod.d });
    }
    // A peneira aparece para quem se destaca — raramente para quem só brinca.
    const ultimaPeneira = v.caminhos.ultimas[`peneira_${mod.d}`];
    const tentativas = v.fatos[`peneiras_${mod.d}`] ?? 0;
    const janela = mod.d === 'futebol' ? i >= 11 && i <= 17 : i >= 12 && i <= 18;
    if (janela && h >= 42 && tentativas < 3 && (ultimaPeneira === undefined || v.t - ultimaPeneira >= 24)) {
      const serio = mod.nivel >= 2 ? 1 : 0.35;
      const chance = clamp((h - 36) / 32, 0, 0.6) * serio * (0.6 + estruturaEsportiva(v.moradia.municipioId) * 0.15);
      if (r.chance(chance)) {
        const lugar = ondeTreina(v, mod.d);
        const clube = nomeDeClube(lugar, `${v.id}:${i}`, mod.d);
        const longe = lugar !== v.moradia.municipioId;
        novaOportunidade(v, {
          tipo: mod.d === 'futebol' ? 'peneira' : 'seletiva', dominio: mod.d, municipioId: lugar, meses: 12, chave: `peneira_${mod.d}`,
          titulo: mod.d === 'futebol' ? `Peneira ${noClube(clube)}` : `Seletiva ${noClube(clube)}`,
          texto: `${mod.nivel >= 2 ? 'O treinador' : 'Um conhecido que entende de esporte'} viu você ${mod.d === 'futebol' ? 'jogar' : 'competir'} e indicou para ${mod.d === 'futebol' ? 'a peneira' : 'a seletiva'} ${doClube(clube)}${longe ? `, em ${municipio(lugar).nome}` : ''}. ${mod.d === 'futebol' ? 'Centenas de garotos' : 'Dezenas de atletas'}, poucas vagas.`
        });
      }
    }
  }

  // A foto da técnica, uma vez por ano: é o que deixa a tela dizer se o treino do ano apareceu.
  for (const x of v.rotinas) {
    if (!MODALIDADES.includes(x.id as Dominio)) continue;
    const agora = Math.round(habilidade(v, x.id as Dominio) * 10) / 10;
    if (v.fatos[`tec_${x.id}`] !== undefined) v.fatos[`tec_${x.id}_antes`] = v.fatos[`tec_${x.id}`];
    v.fatos[`tec_${x.id}`] = agora;
  }
  if (!e) return;
  if (e.fase === 'base') anoNaBase(v, r, e);
  else if (e.fase === 'profissional') anoProfissional(v, r, e);
}

/** A peneira em si: resultado da habilidade construída — e um pouco do dia. */
export function fazerPeneira(v: Vida, r: Rng, d: Dominio, ajuste: number): boolean {
  const h = habilidade(v, d);
  v.fatos[`peneiras_${d}`] = (v.fatos[`peneiras_${d}`] ?? 0) + 1;
  const chance = clamp((h - 58) / 27 + ajuste, 0.02, 0.75);
  const passou = r.chance(chance);
  if (!passou) marcar(v, 'fracasso', `Não passou na ${d === 'futebol' ? 'peneira' : 'seletiva'} (${NOME_MOD[d]}).`, 2, { dominio: d });
  return passou;
}

export function entrarNaBase(v: Vida, d: Dominio, municipioId: string, clube: string): void {
  v.caminhos.esporte = { modalidade: d, fase: 'base', clube, nivel: 1, tInicio: v.t, tFase: v.t, lesoes: 0, municipioId };
  const rot = v.rotinas.find(x => x.id === d);
  if (rot) rot.nivel = 3; else v.rotinas.push({ id: d, tInicio: v.t, nivel: 3 });
  const longe = municipioId !== v.moradia.municipioId;
  const texto = `Entrou para ${EQUIPE[d]} ${doClube(clube)}${longe ? `, em ${municipio(municipioId).nome}: alojamento durante a semana, casa nos domingos` : ''}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'lazer', tom: 'bom', escolha: true });
  marcar(v, 'ingresso', texto, 3, { dominio: d });
  for (const p of pais(v)) lembrarCom(v, p.id, `${d === 'futebol' ? 'A base' : 'A equipe'} ${doClube(clube)}.`, 'escola', 2);
}

function anoNaBase(v: Vida, r: Rng, e: CarreiraEsportiva): void {
  const i = idade(v);
  const h = habilidade(v, e.modalidade);
  const anos = (v.t - e.tFase) / 12;
  // Rotina dura: a escola sente, a família sente se é longe.
  if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - 5);
  if (e.municipioId !== v.moradia.municipioId) for (const p of pais(v)) { const vin = v.vinculos[p.id]; if (vin) vin.proximidade = clamp(vin.proximidade - 2); }
  // Lesão: vira uma condição de verdade (Saúde, treino, decisão de como cuidar).
  if (!lesaoAtiva(v) && r.chance(0.06 * fatorDeRiscoFisico(v))) {
    e.lesoes += 1;
    lesionar(v, r, r.chance(0.2) ? 2 : 1, 'pratica');
  }
  // Contrato profissional: só para quem segue evoluindo.
  const idadeContrato = e.modalidade === 'futebol' ? [17, 20] : [17, 22];
  const limiar = e.modalidade === 'futebol' ? 79 : 82;
  if (i >= idadeContrato[0] && i <= idadeContrato[1] && h >= limiar && r.chance(clamp((h - limiar + 2) / 16, 0.08, 0.6))) {
    const nivel = nivelPelaHabilidade(h);
    novaOportunidade(v, {
      tipo: 'convite', ocupacaoId: e.modalidade === 'futebol' ? 'jogador_futebol' : 'atleta', dominio: e.modalidade, meses: 12, chave: 'contrato_esporte',
      titulo: 'Contrato profissional',
      texto: e.modalidade === 'futebol' ? `${cap(oClube(e.clube))} ofereceu o primeiro contrato profissional${nivel > tetoDoClube(e.clube) ? ' — e há sondagem de um clube maior' : ''}. Salário de verdade, prazo de dois anos.` : `A equipe ofereceu contrato de atleta profissional, com salário e calendário de competições.`,
      bonus: nivel
    });
    return;
  }
  // Dispensa: o destino da maioria.
  const risco = clamp(0.4 - (h - 72) / 40 + e.lesoes * 0.05 + (i > idadeContrato[1] ? 0.5 : 0), 0.1, 0.95);
  if (anos >= 1 && r.chance(risco)) encerrarCarreira(v, e, 'dispensa');
}

export function profissionalizar(v: Vida, r: Rng, nivel: number): void {
  const e = v.caminhos.esporte;
  if (!e) return;
  const oc = ocupacao(e.modalidade === 'futebol' ? 'jogador_futebol' : 'atleta');
  e.fase = 'profissional';
  e.tFase = v.t;
  // O primeiro contrato é com o clube da base, na divisão que ele alcança na simulação.
  e.nivel = Math.max(1, Math.min(4, nivel, e.modalidade === 'futebol' ? tetoDoClube(e.clube) : 4)) as 1 | 2 | 3 | 4;
  if (e.modalidade === 'futebol') e.posicao ??= posicaoSugerida(v);
  e.reputacao ??= Math.round(clamp(12 + (habilidade(v, e.modalidade) - 70) * 1.5 + e.nivel * 4, 5, 45));
  // O treino de base vira treino de clube: é trabalho agora, não atividade de tempo livre (e não conta duas vezes na semana nem no corpo).
  v.rotinas = v.rotinas.filter(x => x.id !== e.modalidade);
  const emp = contratar(v, r, oc, 'oportunidade');
  emp.empregador = oClube(e.clube);
  // O primeiro contrato é curto; o espaço no time depende do que se joga.
  e.espaco = habilidade(v, e.modalidade) >= 72 + e.nivel * 2 ? 'titular' : 'reserva';
  assinarContrato(v, e, 24);
  const texto = e.modalidade === 'futebol' ? `Assinou o primeiro contrato profissional de jogador, ${peloClube(e.clube)}, aos ${idade(v)}.` : `Virou atleta profissional de ${NOME_MOD[e.modalidade]}, ${peloClube(e.clube)}, aos ${idade(v)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, 'profissional', texto, 3, { dominio: e.modalidade, ocupacaoId: oc.id });
  marcarFato(v, 'atleta_profissional');
}

function anoProfissional(v: Vida, r: Rng, e: CarreiraEsportiva): void {
  const i = idade(v);
  const emp = v.trabalho.atual;
  const f = v.caminhos.frentes[e.modalidade];
  // Suspenso pelo antidoping: parado, sem contrato, até a pena acabar.
  if (e.suspensoAte !== undefined) {
    if (v.t < e.suspensoAte) return;
    e.suspensoAte = undefined;
    if (nivelQueOMercadoOferece(v, e) >= 1 || habilidade(v, e.modalidade) >= 66) {
      novaOportunidade(v, { tipo: 'convite', ocupacaoId: e.modalidade === 'futebol' ? 'jogador_futebol' : 'atleta', dominio: e.modalidade, meses: 12, chave: 'volta_suspensao', titulo: 'Voltar a jogar', texto: 'Acabou a suspensão. Um clube pequeno topa dar uma chance — salário baixo, olhar desconfiado.', bonus: 1 });
      escrever(v, { texto: 'A suspensão acabou. O nome ficou marcado, mas um clube pequeno ligou.', relevancia: 'biografia', tema: 'trabalho' });
    } else encerrarCarreira(v, e, 'suspensao');
    return;
  }
  if (!emp || !['jogador_futebol', 'atleta'].includes(emp.ocupacaoId)) {
    // Sem clube, esperando proposta (escolheu insistir): o mercado responde — ou não.
    if (v.fatos['esp_sem_clube'] !== undefined && !emp) {
      const desde = v.fatos['esp_sem_clube'];
      const oferta = nivelQueOMercadoOferece(v, e);
      if (oferta >= 1 && v.t - desde <= 24) {
        delete v.fatos['esp_sem_clube'];
        novaOportunidade(v, { tipo: 'convite', ocupacaoId: e.modalidade === 'futebol' ? 'jogador_futebol' : 'atleta', dominio: e.modalidade, meses: 12, chave: 'volta_clube', titulo: 'Um clube ligou', texto: `Depois de meses treinando por conta, ${oferta < e.nivel ? 'um clube de divisão menor' : 'um clube'} fez proposta. Salário ${oferta < e.nivel ? 'menor' : 'parecido'}, contrato curto.`, bonus: oferta });
        return;
      }
      if (v.t - desde >= 12) { delete v.fatos['esp_sem_clube']; encerrarCarreira(v, e, 'sem_contrato'); }
      return;
    }
    e.fase = 'encerrada'; e.tFim = v.t; e.motivoFim = e.motivoFim ?? 'escolha'; return;
  }
  const pos = posicaoDe(v, e);
  const forcar = e.foco === 'forcar';
  const preservar = e.foco === 'preservar';
  const auge = augeDe(v, e);
  // O jeito de treinar: forçar evolui enquanto o corpo é novo (e machuca); preservar segura o declínio.
  if (f) {
    if (forcar) f.habilidade = clamp(f.habilidade + (i < auge ? 1.2 : -0.8));
    if (preservar && i >= auge) f.habilidade = clamp(f.habilidade + 0.4);
    // O que não aparece no exame (até aparecer): rende em campo, cobra do corpo.
    if (e.doping) { f.habilidade = clamp(f.habilidade + 2); v.corpo.saude = clamp(v.corpo.saude - 2.5); }
  }
  if (e.doping && r.chance(0.24)) { flagrado(v, e); return; }
  // Lesões: mais prováveis com a idade, o treino forçado, a posição, a semana sem descanso — e jogando machucado.
  const atual = lesaoAtiva(v);
  const lesao = (0.07 + Math.max(0, i - 26) * 0.012) * (forcar ? 1.6 : preservar ? 0.6 : 1) * (e.doping ? 1.3 : 1) * RISCO_POSICAO[pos] * fatorDeRiscoFisico(v) * (atual?.lesao.cuidado === 'sacrificio' ? 1.4 : 1);
  if ((!atual || atual.lesao.cuidado === 'sacrificio') && r.chance(lesao)) {
    e.lesoes += 1;
    const x = r.next();
    const grav: 1 | 2 | 3 = x < (forcar ? 0.2 : 0.14) ? 3 : x < 0.45 ? 2 : 1;
    lesionar(v, r, grav, 'profissional');
    if (grav >= 3) e.espaco = 'reserva';
  }
  // A temporada: o que se jogou, com o corpo que havia.
  const t = fecharTemporada(v, r, e);
  const h = habilidade(v, e.modalidade);
  const nomeClube = e.modalidade === 'futebol' ? cap(e.clube) : 'A equipe';
  // Temporadas que ficam na biografia: a primeira, a de destaque, a que foi campeã.
  const primeira = (e.temporadas?.length ?? 0) === 1;
  if (primeira || t.nota >= 8.2 || (t.colocacao === 1 && t.titular >= 10)) {
    const texto = t.colocacao === 1 && t.titular >= 10
      ? `Campeão ${e.modalidade === 'futebol' ? `${DIVISAO_DO_NIVEL[t.nivel] === 'campeonato estadual' ? 'estadual' : `da ${DIVISAO_DO_NIVEL[t.nivel]}`} com ${oClube(e.clube)}` : 'com a equipe'}: ${linhaDaTemporada(v, t).split(' · ').slice(2).join(', ')}.`.replace('Campeão', flex(ge(v), 'Campeão', 'Campeã', 'Campeão'))
      : primeira ? `A primeira temporada como profissional, ${noClube(e.clube)}: ${t.partidas} jogos${t.gols ? `, ${t.gols} ${t.gols === 1 ? 'gol' : 'gols'}` : ''}.`
        : `Temporada de destaque ${noClube(e.clube)}: ${linhaDaTemporada(v, t).split(' · ').slice(2).join(', ')}.`;
    escrever(v, { texto, relevancia: t.colocacao === 1 || t.nota >= 8.2 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'bom' });
    if (t.colocacao === 1 && t.titular >= 10) marcar(v, 'conquista', texto, t.nivel >= 3 ? 3 : 2, { dominio: e.modalidade });
  }
  // O mercado reage à temporada: um clube maior pergunta (a resposta é sua: `esp_proposta`).
  const oferta = nivelQueOMercadoOferece(v, e);
  if (oferta > e.nivel && e.nivel < 4 && t.nota >= 6.6 && r.chance(0.45)) v.fatos['esp_proposta_hoje'] = v.t;
  // Reserva de novo, temporada fraca: o clube empresta para um menor (decisão do clube, não sua).
  const ultimas = (e.temporadas ?? []).slice(-2);
  if (e.espaco === 'reserva' && ultimas.length === 2 && ultimas.every(x => x.nota < 5.6 && x.titular < 8) && e.nivel > 1 && oferta < e.nivel && r.chance(0.5)) {
    const novo = mudarDeClube(v, e, (e.nivel - 1) as 1 | 2 | 3 | 4);
    assinarContrato(v, e, 24);
    escrever(v, { texto: e.modalidade === 'futebol' ? `Sem espaço no time, foi emprestado ${aoClube(novo)}.` : 'Sem espaço na equipe principal, voltou a competir num nível abaixo.', relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // Titular ou banco na próxima: a temporada, a técnica, a conversa com o treinador, a idade para a posição.
  const conversa = v.fatos['esp_treinador_ok'] !== undefined && v.t - v.fatos['esp_treinador_ok'] <= 12 ? 3 : 0;
  const antes = e.espaco;
  const passou = Math.max(0, i - auge);
  e.espaco = h + (t.nota - 6) * 2.5 + conversa - passou * 1.2 >= 72 + e.nivel * 2 && !(lesaoAtiva(v)?.lesao.gravidade === 3) ? 'titular' : 'reserva';
  if (antes === 'titular' && e.espaco === 'reserva') { escrever(v, { texto: `${nomeClube === 'A equipe' ? 'Perdeu a vaga na equipe principal' : 'Perdeu a posição'}: a próxima temporada começa no banco.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' }); abalar(v, 'perder a posição no time', -4, 3); }
  else if (antes === 'reserva' && e.espaco === 'titular') escrever(v, { texto: 'Ganhou a posição: a próxima temporada começa como titular.', relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  // O contrato vence: renovar é conversa (`esp_renovacao`) — e o mercado é quem diz se ainda há lugar.
  e.contratoAte ??= v.t + 24;
  if (v.t >= e.contratoAte) v.fatos['esp_renovacao'] = v.t;
  // (FIX pós-REWORK 2: não há mais aposentadoria por idade fixa. O corpo declina pela posição, a temporada
  // mostra, o mercado lê: banco, divisão menor, salário menor — e, um dia, nenhum clube. Parar é escolha.)
}

/** O exame pegou: suspensão, contrato rescindido, o nome nos jornais. */
function flagrado(v: Vida, e: CarreiraEsportiva): void {
  e.doping = undefined;
  e.suspensoAte = v.t + 24;
  e.espaco = undefined;
  if (v.trabalho.atual && ['jogador_futebol', 'atleta'].includes(v.trabalho.atual.ocupacaoId)) encerrarEmprego(v, 'suspensão por doping');
  const texto = `O controle antidoping deu positivo. Dois anos de suspensão, contrato rescindido, o nome no noticiário esportivo.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'fracasso', 'Suspenso por doping.', 3, { dominio: e.modalidade });
  marcarFato(v, 'suspenso_doping');
  abalar(v, 'a suspensão por doping', -14, 14);
  for (const p of pais(v)) { const vin = v.vinculos[p.id]; if (vin) vin.confianca = clamp(vin.confianca - 8); }
}

export function encerrarCarreira(v: Vida, e: CarreiraEsportiva, motivo: NonNullable<CarreiraEsportiva['motivoFim']>): void {
  const i = idade(v);
  const eraPro = e.fase === 'profissional';
  e.fase = 'encerrada';
  e.tFim = v.t;
  e.motivoFim = motivo;
  const rot = v.rotinas.find(x => x.id === e.modalidade);
  if (rot) rot.nivel = 1;
  if (eraPro && v.trabalho.atual && ['jogador_futebol', 'atleta'].includes(v.trabalho.atual.ocupacaoId)) encerrarEmprego(v, 'fim da carreira esportiva');
  const g = ge(v);
  const texto = !eraPro
    ? motivo === 'dispensa' ? `${flex(g, 'Dispensado', 'Dispensada')} ${e.modalidade === 'futebol' ? 'da base' : 'da equipe'} ${doClube(e.clube)}, aos ${i}. O sonho de viver do ${NOME_MOD[e.modalidade]} ficou para trás.` : `Deixou ${EQUIPE[e.modalidade]} ${doClube(e.clube)}, aos ${i}.`
    : motivo === 'lesao' ? `Encerrou a carreira aos ${i}, depois de lesões demais.` : motivo === 'sem_contrato' ? `Aos ${i}, nenhum clube renovou: a carreira de ${flex(g, 'atleta', 'atleta')} acabou sem despedida.` : `Pendurou as chuteiras aos ${i}.`.replace('as chuteiras', e.modalidade === 'futebol' ? 'as chuteiras' : 'a carreira');
  escrever(v, { texto, relevancia: 'marco', tema: eraPro ? 'trabalho' : 'lazer', tom: 'ruim' });
  marcar(v, eraPro ? 'fim_carreira' : 'fracasso', texto, 3, { dominio: e.modalidade });
  marcarFato(v, eraPro ? 'fim_carreira_esportiva' : 'dispensado_base');
  // Quem se preparou ainda jogando tem para onde ir: a comissão técnica, a escolinha.
  // Quem teve nome no esporte também é lembrado (sem curso, a porta é menor e mais rara).
  const nome = (e.reputacao ?? 0) >= 50 && e.nivel >= 3 && i >= 28;
  if (eraPro && (temFato(v, 'pos_treinador') || (nome && hash(`${v.id}:comissao`) < 0.35))) {
    const oc = i >= 28 ? 'auxiliar_tecnico' : 'treinador_escolinha';
    novaOportunidade(v, { tipo: 'convite', ocupacaoId: oc, dominio: e.modalidade, meses: 24, chave: 'pos_treinador', titulo: 'Do campo para o banco', texto: oc === 'auxiliar_tecnico' ? (temFato(v, 'pos_treinador') ? 'O treinador que você conheceu no clube montou uma comissão técnica e lembrou de quem tirou os cursos ainda jogando.' : 'Um treinador que trabalhou com você montou uma comissão técnica: quer alguém que o vestiário respeite. Os cursos, você tira no caminho.') : 'Uma escolinha do bairro precisa de alguém que saiba ensinar e que já tenha jogado de verdade.' });
  }
  abalar(v, eraPro ? 'o fim da carreira no esporte' : `a dispensa ${e.modalidade === 'futebol' ? 'da base' : 'da equipe'}`, -(eraPro ? 8 : 10), 6);
}

/** Continua praticando o esporte como profissional (o treino do clube). */
export function treinoProfissional(v: Vida, r: Rng): void {
  const e = v.caminhos.esporte;
  if (e?.fase !== 'profissional' || (e.suspensoAte !== undefined && v.t < e.suspensoAte)) return;
  // O treino é do clube (a rotina de tempo livre da mesma modalidade não existe para quem é profissional).
  praticar(v, r, e.modalidade, e.foco === 'forcar' ? 1.8 : e.foco === 'preservar' ? 1.3 : 1.6, 1.45);
}

export { NOME_MOD, MUNICIPIOS };
