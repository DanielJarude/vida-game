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

import { lancar } from './extrato';
import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraEsportiva, Dominio, Posicao, PropostaDeClube, Temporada, Vida } from '../tipos';
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
import { aoClube, clubeDoNivel, clubesDoNivel, CLUBES, clubesDaCidade, DIVISAO_DO_NIVEL, doClube, equipeDaCidade, noClube, oClube, peloClube } from '../dados/clubes';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
import { abalar } from './abalo';
import { lesaoAtiva, lesionar, mesesForaNoAno } from './lesoes';
import { fatorDeRiscoFisico } from './sobrecarga';
import { SALARIO_MINIMO } from './renda';
import { anoDe } from '../tempo';
import { dinheiro } from '../texto';
import { CIRCUITO_TENIS, custoDoCircuito, custoJuvenilTenis, DIVISAO_BASQUETE, estatura, estaturaEmPalavras, funcaoBasquete, NOME_FUNCAO, circuitoDeEstreia, circuitoPeloRanking, PONTOS_CAMPEAO, PONTOS_PRINCIPAL, pontosDaRodada, premiacaoTenis, rankingPorPontos, vantagemDeEstatura, vivePremiacao } from './modalidades';
import { recursosDaFamilia } from './origem';
import { mudarAgora } from './processos';
import { pisoDoClube, registrarTemporada, registrarConquista } from './palmares';
import { processarSelecao } from './selecao';
import { nomePor } from './notoriedade';
import { daPorta, individualComEquipe, perfilDe, portaAmadora, semVinculo } from './perfisEsportivos';
import { formatarMarca, jogarLutas, jogarProvas, jogarTemporadaVolei, NOME_FUNCAO_VOLEI, numeroDaFuncao, podiosDe, type FuncaoVolei } from './provas';

export const MODALIDADES: Dominio[] = ['futebol', 'volei', 'natacao', 'atletismo', 'lutas', 'basquete', 'tenis'];

/** "a base do Bahia", "a equipe de base do Minas", "a equipe da prefeitura de Manaus", "a academia de tênis de Recife" — sem repetir "equipe". */
export function aEquipe(d: Dominio, clube: string): string {
  if (/^(equipe|academia)/i.test(clube)) return oClube(clube);
  return `${EQUIPE[d] ?? 'a equipe'} ${doClube(clube)}`;
}

/**
 * Onde a pessoa está no caminho de uma base — FONTE ÚNICA para a tela ("o
 * que você está construindo"), para o pedido de teste e para as peneiras que
 * o mundo oferece:
 *
 *   fora          ainda tentando chegar (treina, pede teste, faz peneira)
 *   convidado     passou na peneira: o clube chamou, falta responder ao convite
 *   decidindo     disse que ia; falta decidir o que fazer com o que não cabe
 *   base          está na base (ou na equipe de formação)
 *   profissional  tem contrato
 *
 * Derivada só do estado persistido (o convite é o fato `convite_base`, a
 * base é `caminhos.esporte`): vale também para saves de antes desta regra.
 */
export type EtapaDaBase = 'fora' | 'convidado' | 'decidindo' | 'base' | 'profissional';
export function etapaNaBase(v: Vida): EtapaDaBase {
  const es = v.caminhos.esporte;
  if (es?.fase === 'base') return 'base';
  if (es?.fase === 'profissional') return 'profissional';
  if (v.caminhos.pendente?.novo.tipo === 'base') return 'decidindo';
  // O convite vale enquanto a idade da base (a decisão do convite) cabe.
  if (temFato(v, 'convite_base') && idade(v) <= IDADE_CONVITE[1]) return 'convidado';
  return 'fora';
}
/** A idade em que o convite de uma base ainda é respondido (a mesma da decisão `esp_base`). */
export const IDADE_CONVITE: [number, number] = [10, 20];

/** O convite em aberto de quem passou na peneira: a modalidade, o lugar e o clube (os mesmos que a decisão do convite usa). */
export function conviteDaBase(v: Vida): { dominio: Dominio; municipioId: string; clube: string } | undefined {
  if (!temFato(v, 'convite_base')) return undefined;
  const dominio = MODALIDADES[v.fatos['peneira_mod'] ?? 0] ?? 'futebol';
  const municipioId = MUNICIPIOS[v.fatos['peneira_lugar'] ?? -1]?.id ?? v.moradia.municipioId;
  return { dominio, municipioId, clube: nomeDeClube(municipioId, `${v.id}:${v.fatos['convite_base']}`, dominio) };
}

/** A categoria de quem está na base (sub-15, sub-17...): a mesma na tela e no texto. */
export function categoriaDaBase(v: Vida, e: CarreiraEsportiva): string {
  const i = idade(v);
  return e.modalidade === 'tenis' ? 'circuito juvenil' : e.modalidade !== 'futebol' ? 'equipe de base' : i <= 15 ? 'sub-15' : i <= 17 ? 'sub-17' : 'sub-20';
}

/** O contrato profissional: a idade em que chega e a técnica que o clube pede (a mesma conta do ano na base). */
export const contratoDaBase = (d: Dominio) => ({ idade: (d === 'futebol' ? [17, 20] : [17, 22]) as [number, number], tecnica: d === 'futebol' ? 79 : 82 });

/** O nome da divisão (ou do circuito) em cada modalidade: fonte única para tela e texto. */
export function divisaoDe(d: Dominio, nivel: number): string {
  if (d === 'futebol') return DIVISAO_DO_NIVEL[nivel] ?? '';
  if (d === 'basquete') return DIVISAO_BASQUETE[nivel] ?? '';
  if (d === 'tenis') return CIRCUITO_TENIS[nivel] ?? '';
  if (d === 'volei') return DIVISAO_VOLEI[nivel] ?? '';
  return ['', 'competições regionais', 'circuito nacional de acesso', 'circuito nacional', 'elite nacional'][nivel] ?? '';
}

/** Vôlei: o estadual, a divisão de acesso nacional e a liga nacional (a elite). */
export const DIVISAO_VOLEI = ['', 'campeonato estadual', 'Superliga B', 'Superliga', 'Superliga — entre os times de ponta'];

/** Quem vive do esporte como atleta (o emprego que a carreira esportiva ocupa). */
export const OCUPACOES_DE_ATLETA = ['jogador_futebol', 'atleta', 'jogador_basquete', 'tenista'];
/** A ocupação de quem se profissionaliza em cada modalidade. */
export const ocupacaoDaModalidade = (d: Dominio) => (d === 'futebol' ? 'jogador_futebol' : d === 'basquete' ? 'jogador_basquete' : d === 'tenis' ? 'tenista' : 'atleta');

const NOME_MOD: Partial<Record<Dominio, string>> = { futebol: 'futebol', volei: 'vôlei', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta', basquete: 'basquete', tenis: 'tênis' };
const EQUIPE: Partial<Record<Dominio, string>> = { futebol: 'a base', volei: 'a equipe de base', natacao: 'a equipe de natação', atletismo: 'a equipe de atletismo', lutas: 'a equipe de competição', basquete: 'a equipe de base', tenis: 'a academia de tênis' };

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
  if (d === 'tenis') return `academia de tênis de ${municipio(municipioId).nome}`;
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
/** A modalidade que a pessoa pratica com mais seriedade agora. */
export function modalidadePrincipal(v: Vida): { d: Dominio; nivel: number } | undefined {
  // O time da escola é futebol de competição (os jogos escolares): conta como treino regular (REWORK 3).
  const lista = v.rotinas.filter(r => MODALIDADES.includes(r.id as Dominio) || r.id === 'time_escola').map(r => ({ d: (r.id === 'time_escola' ? 'futebol' : r.id) as Dominio, nivel: r.id === 'time_escola' ? 2 : r.nivel ?? 1 }));
  return lista.sort((a, b) => b.nivel - a.nivel || habilidade(v, b.d) - habilidade(v, a.d))[0];
}

/** A divisão em que a técnica de hoje joga (pela mesma barra da nota: `barraDaDivisao`). */
const nivelPelaHabilidade = (h: number): 1 | 2 | 3 | 4 => (h < 77 ? 1 : h < 83 ? 2 : h < 90 ? 3 : 4);

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
const AUGE_MODALIDADE: Partial<Record<Dominio, number>> = { volei: 31, natacao: 26, atletismo: 28, lutas: 30, basquete: 30, tenis: 27 };
/** O risco de lesão da modalidade (o joelho e o tornozelo do basquete; o ombro e o cotovelo do tênis). */
const RISCO_MODALIDADE: Partial<Record<Dominio, number>> = { basquete: 1.1, tenis: 1, volei: 1.05, lutas: 1.2, natacao: 0.8, atletismo: 1 };
export { posicaoDe };
export const augeDe = (v: Vida, e: CarreiraEsportiva) => (e.modalidade === 'futebol' ? AUGE_POSICAO[posicaoDe(v, e)] : AUGE_MODALIDADE[e.modalidade] ?? 29);

/* ------------------------------------------------------------ Salário */

/**
 * O salário de um contrato de atleta (bruto, mensal): FONTE ÚNICA.
 *
 * Não é "divisão X = salário Y". É uma distribuição que nasce do estado:
 *   divisão × tamanho do clube × espaço no time × nome no mercado (curva
 *   convexa: pouco nome paga pouco, muito nome paga desproporcionalmente) ×
 *   a última temporada × a fase da carreira — e, fora da elite, o valor de
 *   um nome conhecido (o veterano famoso num clube menor ganha muito mais
 *   que o elenco); na elite, raramente, o prêmio de estrela (reputação
 *   altíssima + notoriedade + clube grande).
 * Patrocínio e direito de imagem NÃO entram aqui: são outra renda
 * (`notoriedade.rendaDeImagem`, linha própria em Dinheiro).
 * Valores em reais de hoje (o jogo não infla preços: `sistemas/renda`).
 */
const BASE_FUTEBOL = [0, 2000, 6500, 22000, 70000];
const BASE_OUTROS = [0, 1800, 4000, 9500, 26000];
/** Basquete: o NBB paga mais que as outras modalidades de quadra; a Liga Ouro, pouco acima do mínimo. */
const BASE_BASQUETE = [0, 2200, 4500, 9500, 24000];
const PORTE_CLUBE: Record<string, number> = { grande: 1.5, tradicional: 1, regional: 0.7 };
export function salarioDoContrato(v: Vida, e: CarreiraEsportiva, nivel: number = e.nivel, espaco: CarreiraEsportiva['espaco'] = e.espaco, clube: string = e.clube): number {
  const i = idade(v);
  const futebol = e.modalidade === 'futebol';
  // Tênis não tem salário de clube: vive de premiação (`modalidades.premiacaoTenis`).
  if (vivePremiacao(e.modalidade)) return 0;
  const base = (futebol ? BASE_FUTEBOL : e.modalidade === 'basquete' ? BASE_BASQUETE : BASE_OUTROS)[nivel] ?? 0;
  const rep = e.reputacao ?? 30;
  const papel = espaco === 'titular' ? 1 : 0.55;
  const nome = 0.45 + (rep / 100) ** 2 * 2.2;
  const tamanho = futebol ? CLUBES.find(c => c.nome === clube)?.porte ?? 'regional' : 'tradicional';
  const porte = futebol ? PORTE_CLUBE[tamanho] ?? 0.8 : 1;
  const t = e.temporadas?.[e.temporadas.length - 1];
  const temporada = t ? 1 + clamp((t.nota - 6) * 0.06, -0.2, 0.2) : 1;
  const auge = augeDe(v, e);
  const fase = i < 20 ? 0.55 : i < 23 ? 0.8 : i > auge + 3 ? 0.85 : 1;
  const noto = nomePor(v, 'esporte');
  // A estrela: só na elite, só com nome altíssimo, notoriedade e clube grande — raro por construção.
  const alcance = tamanho === 'grande' ? 1 : tamanho === 'tradicional' ? 0.4 : 0.15;
  // (FIX 3.1: o prêmio de estrela e o valor do nome fora da elite são do futebol — o mercado das outras modalidades é bem menor.)
  const mercadoDoNome = futebol ? 1 : 0.2;
  const estrela = nivel >= 4 && rep >= 78 && noto >= 60 ? 1 + ((rep - 78) * 0.12 + (noto - 60) * 0.05) * alcance * mercadoDoNome : 1;
  let bruto = base * papel * nome * porte * temporada * fase * estrela;
  // Fora da elite, um nome conhecido vale por si (o veterano que o clube menor contrata pelo nome).
  if (nivel <= 3 && noto >= 45) bruto += (noto - 40) ** 2 * 60 * fase * mercadoDoNome;
  return Math.max(SALARIO_MINIMO, Math.round(bruto / 100) * 100);
}

/** Fora da elite, contrato é curto (um ano, uma temporada); na elite, dá para assinar mais longo. */
export const prazoDeContrato = (e: CarreiraEsportiva, meses: number) => (e.nivel <= 2 ? Math.min(meses, 12) : meses);

/**
 * Assina (ou renova) um contrato: o salário sai daqui e só daqui. Na renovação
 * com o mesmo clube, o contrato anterior serve de âncora para quem ainda rende
 * (`salarioDaRenovacao`).
 */
export function assinarContrato(v: Vida, e: CarreiraEsportiva, meses: number, fator = 1, renovacao = false): void {
  // O tenista não assina com ninguém: joga o circuito e recebe o que a premiação der.
  if (vivePremiacao(e.modalidade)) { e.contratoAte = undefined; return; }
  e.contratoAte = v.t + prazoDeContrato(e, meses);
  e.clausulaTitular = undefined;
  const emp = v.trabalho.atual;
  if (!emp || !OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) return;
  emp.salario = renovacao ? salarioDaRenovacao(v, e, fator) : Math.round(salarioDoContrato(v, e) * fator / 100) * 100;
}

/** O salário que a renovação oferece (o mesmo número que a decisão mostra antes de escolher). */
export function salarioDaRenovacao(v: Vida, e: CarreiraEsportiva, fator = 1): number {
  const novo = Math.round(salarioDoContrato(v, e) * fator / 100) * 100;
  const atual = v.trabalho.atual && OCUPACOES_DE_ATLETA.includes(v.trabalho.atual.ocupacaoId) ? v.trabalho.atual.salario : 0;
  // A âncora do contrato anterior só vale para quem ainda rende: o veterano em queda renova pelo que joga hoje.
  const nota = e.temporadas?.[e.temporadas.length - 1]?.nota ?? 6;
  return nota >= 6.5 ? Math.max(novo, Math.round(atual * 0.75 / 100) * 100) : novo;
}

/* ------------------------------------------------------------ Propostas */

/**
 * A proposta na mesa (P0 de integridade): criada uma vez, com clube, cidade,
 * divisão, prazo e salário FIXADOS; a decisão a exibe e o "sim" a executa
 * (`transferirPara`) — nada é sorteado de novo depois do sim. Uma proposta
 * nova nunca sobrescreve a que ainda espera resposta.
 */
export const propostaNaMesa = (v: Vida): PropostaDeClube | undefined => { const p = v.caminhos.esporte?.proposta; return p && v.t <= p.validaAte ? p : undefined; };

export function criarProposta(v: Vida, e: CarreiraEsportiva, nivel: 1 | 2 | 3 | 4, origem: PropostaDeClube['origem']): PropostaDeClube | undefined {
  if (propostaNaMesa(v)) return undefined;
  const futebol = e.modalidade === 'futebol';
  // O clube que quer você: no futebol, um clube real do porte da divisão (a liberação, de preferência no mesmo estado);
  // nos outros esportes, a estrutura é a mesma equipe, num nível acima ou abaixo.
  let clube = e.clube;
  let municipioId = v.trabalho.atual?.municipioId ?? v.moradia.municipioId;
  // A compra ao fim de um empréstimo é do clube onde se está (a mesma cidade, o mesmo clube).
  if (origem === 'compra') { clube = e.clube; municipioId = e.municipioId; }
  else if (futebol) {
    const doNivel = clubesDoNivel(nivel, e.emprestimo?.clube ?? e.clube).filter(c => c.nome !== e.clube);
    const uf = municipio(v.moradia.municipioId).uf;
    const pertos = origem === 'liberacao' || origem === 'emprestimo' ? doNivel.filter(c => municipio(c.cidade).uf === uf) : [];
    const lista = pertos.length ? pertos : doNivel;
    clube = lista[Math.floor(hash(`${v.id}:${v.t}:${origem}:proposta`) * lista.length) % lista.length].nome;
    municipioId = CLUBES.find(c => c.nome === clube)?.cidade ?? v.moradia.municipioId;
  } else if (perfilDe(e.modalidade).estrutura === 'clube') {
    // Basquete e vôlei: outra equipe, de outra cidade (a elite fica nas cidades grandes; o acesso, mais perto).
    const alvo = cidadeDeEquipe(v, e, nivel, origem);
    if (alvo) { municipioId = alvo; clube = equipeDaModalidade(e.modalidade, alvo); }
  }
  const espaco: 'titular' | 'reserva' = origem === 'emprestimo' ? 'titular' : nivel > e.nivel ? 'reserva' : 'titular';
  const meses = origem === 'emprestimo' ? Math.max(6, Math.min(12, (e.contratoAte ?? v.t + 12) - v.t)) : prazoDeContrato({ ...e, nivel }, origem === 'liberacao' ? 12 : nivel > e.nivel ? 36 : 24);
  // No empréstimo, o contrato continua o do clube detentor: o salário é o mesmo (quem recebe divide a conta).
  const atual = v.trabalho.atual && OCUPACOES_DE_ATLETA.includes(v.trabalho.atual.ocupacaoId) ? v.trabalho.atual.salario : 0;
  const p: PropostaDeClube = {
    id: `pc${v.t}${Math.floor(hash(`${v.id}:${v.t}:${origem}`) * 1e6)}`, clube, municipioId, nivel, meses, espaco,
    salario: origem === 'emprestimo' ? atual : salarioDoContrato(v, e, nivel, espaco, clube), salarioTitular: origem === 'emprestimo' ? atual : salarioDoContrato(v, e, nivel, 'titular', clube),
    t: v.t, validaAte: v.t + 11, origem
  };
  e.proposta = p;
  return p;
}

/**
 * Executa EXATAMENTE a proposta aceita: clube, divisão, prazo, salário,
 * empregador. A mudança de cidade (se houver) é de quem chama — para a
 * cidade da proposta (`p.municipioId`).
 */
export function transferirPara(v: Vida, e: CarreiraEsportiva, p: PropostaDeClube): void {
  if (p.origem === 'emprestimo') { emprestar(v, e, p); return; }
  e.clube = p.clube;
  e.nivel = p.nivel;
  e.espaco = p.espaco;
  e.contratoAte = v.t + p.meses;
  e.proposta = undefined;
  e.emprestimo = undefined;
  e.clausulaTitular = p.espaco === 'reserva' && p.salarioTitular > p.salario ? p.salarioTitular : undefined;
  if (e.modalidade === 'futebol' || perfilDe(e.modalidade).estrutura === 'clube') e.municipioId = p.municipioId;
  const emp = v.trabalho.atual;
  if (emp && OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) {
    emp.empregador = vivePremiacao(e.modalidade) ? emp.empregador : oClube(p.clube);
    emp.salario = p.espaco === 'titular' ? p.salarioTitular : p.salario;
  }
}

/** A equipe de uma modalidade coletiva numa cidade (nome descritivo, do universo do jogo — não uma marca). */
export const equipeDaModalidade = (d: Dominio, municipioId: string) => `equipe de ${NOME_MOD[d] ?? d} de ${municipio(municipioId).nome}`;

/** A cidade de outra equipe que quer o atleta: a elite nas cidades grandes; o acesso e o estadual, na região. */
function cidadeDeEquipe(v: Vida, e: CarreiraEsportiva, nivel: number, origem: PropostaDeClube['origem']): string | undefined {
  const aqui = municipio(e.municipioId ?? v.moradia.municipioId);
  const grandes = ['metropole', 'capital', 'polo'];
  const lista = MUNICIPIOS.filter(m => m.id !== aqui.id && (nivel >= 3 ? grandes.includes(m.perfil) : m.perfil !== 'pequena') && (nivel >= 3 || m.regiao === aqui.regiao));
  if (!lista.length) return undefined;
  return lista[Math.floor(hash(`${v.id}:${v.t}:${origem}:equipe`) * lista.length) % lista.length].id;
}

/* ------------------------------------------------------------ Empréstimo */

/**
 * O empréstimo de verdade: o clube detentor MANTÉM o contrato e cede o
 * atleta por um período a outro clube. O vínculo, o prazo e o salário
 * continuam os do detentor (o clube que recebe divide a conta); a temporada,
 * o time, a cidade e o histórico são do clube onde se joga. No fim do prazo,
 * a volta — ou, se o clube de agora quiser, uma proposta para ficar.
 * Diferente da transferência (outro contrato), da dispensa (sem clube) e da
 * liberação (um clube menor, contrato novo).
 */
export function emprestar(v: Vida, e: CarreiraEsportiva, p: PropostaDeClube): void {
  e.emprestimo = { clube: e.clube, municipioId: e.municipioId, nivel: e.nivel, desde: v.t, ate: Math.min(v.t + p.meses, e.contratoAte ?? v.t + p.meses) };
  e.clube = p.clube;
  e.nivel = p.nivel;
  e.espaco = 'titular';
  e.municipioId = p.municipioId;
  e.proposta = undefined;
  const emp = v.trabalho.atual;
  if (emp && OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) emp.empregador = `${oClube(p.clube)} (emprestado ${peloClube(e.emprestimo.clube)})`;
}

/** Fim do empréstimo: de volta ao clube detentor (o contrato era dele o tempo todo). Devolve o texto. */
export function voltarDoEmprestimo(v: Vida, e: CarreiraEsportiva): string {
  const x = e.emprestimo;
  if (!x) return '';
  const onde = e.clube;
  const jogos = (e.temporadas ?? []).filter(t => t.emprestado === x.clube && t.clube === onde).reduce((a, t) => a + t.partidas, 0);
  e.clube = x.clube;
  e.nivel = x.nivel;
  e.municipioId = x.municipioId;
  e.emprestimo = undefined;
  e.proposta = undefined;
  // Quem volta não volta com a vaga garantida: a técnica e a última temporada dizem onde começa.
  e.espaco = habilidade(v, e.modalidade) >= barraDeTitular(e.modalidade, e.nivel) ? 'titular' : 'reserva';
  const emp = v.trabalho.atual;
  if (emp && OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) { emp.empregador = oClube(x.clube); emp.municipioId = x.municipioId; }
  const texto = `Voltou ${aoClubeTxt(x.clube)} depois do empréstimo ${aoClubeTxt(onde)}: ${jogos} ${jogos === 1 ? 'jogo' : 'jogos'} por lá.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho' });
  marcar(v, 'retorno', texto, 2, { dominio: e.modalidade });
  if (x.municipioId !== v.moradia.municipioId) mudarAgora(v, x.municipioId, `de volta ${aoClubeTxt(x.clube)}`);
  return texto;
}
const aoClubeTxt = (nome: string) => aoClube(nome);

/* ------------------------------------------------------------ Mercado */

/** O limiar de nome (reputação ajustada pela última temporada) que cada divisão pede. */
/** (Pacote pós-playtest: recalibrado junto com a barra da divisão — o jogador médio de cada divisão fica nela; quem se destaca é chamado acima.) */
const LIMIAR_NIVEL = [0, 8, 32, 46, 56];
/** No tênis, o ranking é mundial: subir de circuito pede bem mais (o principal é para pouquíssimos). */
const LIMIAR_TENIS = [0, 8, 42, 62, 78];

/** O que o mercado enxerga de você agora: o nome, a última temporada, a idade para a posição. */
export function valorDeMercado(v: Vida, e: CarreiraEsportiva): number {
  const t = e.temporadas?.[e.temporadas.length - 1];
  const nota = t ? t.nota : 6;
  const pos = posicaoDe(v, e);
  // Treinar dobrado depois do auge envelhece o corpo mais cedo; preservar dá uns anos a mais.
  const passou = Math.max(0, idade(v) - augeDe(v, e) - (e.foco === 'preservar' ? 2 : e.foco === 'forcar' ? 0 : 1));
  void pos;
  // O nome ajuda a renovar — mas, anos depois do auge, o mercado paga o que o corpo ainda joga, não o que ele já jogou.
  const nome = (e.reputacao ?? 30) * Math.max(0.4, 1 - passou * 0.06);
  return nome + (nota - 6) * 6 - passou * passou * 0.9;
}

/** A melhor divisão que ainda quer você (0 = nenhum clube). */
export function nivelQueOMercadoOferece(v: Vida, e: CarreiraEsportiva): number {
  const x = valorDeMercado(v, e);
  const limiar = e.modalidade === 'tenis' ? LIMIAR_TENIS : LIMIAR_NIVEL;
  for (let n = 4; n >= 1; n--) if (x >= limiar[n]) return n;
  return 0;
}

/** O clube atual quer renovar? Quer quem ainda rende para a divisão em que está. */
export function clubeQuerRenovar(v: Vida, e: CarreiraEsportiva): boolean {
  const voltouDeSuspensao = v.fatos['suspenso_doping'] !== undefined && v.t - v.fatos['suspenso_doping'] < 60;
  return nivelQueOMercadoOferece(v, e) >= e.nivel + (voltouDeSuspensao ? 1 : 0) - (e.espaco === 'titular' ? 0 : 0);
}

/* ------------------------------------------------------------ Temporada */

const PARTIDAS = [0, 20, 30, 38, 38];
/**
 * A barra de cada divisão: a técnica de quem joga ali (pacote pós-playtest).
 * A nota mede a temporada CONTRA a concorrência daquela divisão — no
 * futebol, quem chega à Série A já é muito bom, e ser muito bom ali é o
 * normal, não destaque. (Antes, a barra era a mesma escada para todas as
 * divisões, e quase todo jogador de Série A fechava "temporada de destaque":
 * nota mediana 7,9, 85% titulares, nome e salário de estrela.)
 */
const BARRA_FUTEBOL = [0, 73, 77, 82, 89];
/**
 * Tênis (FIX final da generalização): a técnica de quem joga cada circuito.
 * O principal é o dos cem melhores do mundo — ali, técnica 85 é a de quem
 * mal se segura, não a de quem se destaca. (Antes, valia a escada genérica,
 * 82 no principal: quase todo profissional jogava o circuito principal como
 * destaque, e o ranking mediano era 31º.)
 */
const BARRA_TENIS = [0, 74, 80, 85, 91];
export const barraDaDivisao = (d: Dominio, nivel: number) => (d === 'futebol' ? BARRA_FUTEBOL[nivel] ?? 89 : d === 'tenis' ? BARRA_TENIS[nivel] ?? 91 : 70 + nivel * 3);
/** A técnica que a divisão pede para começar jogando (a mesma barra, um pouco acima; nos outros esportes, a escada de antes). */
export const barraDeTitular = (d: Dominio, nivel: number) => (d === 'futebol' ? (BARRA_FUTEBOL[nivel] ?? 89) + 1 : d === 'tenis' ? BARRA_TENIS[nivel] ?? 91 : 72 + nivel * 2);
/** Quantos jogos (ou competições) a temporada tem, em cada modalidade e nível: fonte única (temporada, palmarés, seleção). */
export const jogosDaTemporada = (d: Dominio, nivel: number) => (d === 'futebol' ? PARTIDAS[nivel] : d === 'basquete' ? [0, 18, 26, 32, 34][nivel] : d === 'tenis' ? [0, 14, 20, 22, 22][nivel] : d === 'volei' ? [0, 14, 20, 24, 26][nivel] : [0, 8, 10, 12, 12][nivel]) ?? 0;
/** O que cada posição produz por jogo, em média (a temporada sorteia em volta disso; o palmarés mede contra isso). */
export const GOL: Record<Posicao, number> = { goleiro: 0, lateral: 0.05, zagueiro: 0.05, volante: 0.06, meia: 0.18, ponta: 0.3, atacante: 0.46 };
export const ASSIST: Record<Posicao, number> = { goleiro: 0.005, lateral: 0.14, zagueiro: 0.03, volante: 0.1, meia: 0.27, ponta: 0.24, atacante: 0.14 };
export const DEFESA: Record<Posicao, number> = { goleiro: 0.3, lateral: 1.2, zagueiro: 2.2, volante: 2, meia: 0.5, ponta: 0.2, atacante: 0.1 };

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
  // No basquete, a estatura é parte do jogo (o garrafão): ajuda o pivô, cobra mais técnica do armador baixo.
  const corpo = e.modalidade === 'basquete' ? vantagemDeEstatura(v) * 2.4 : 0;
  let nota = 6 + (h - barraDaDivisao(e.modalidade, e.nivel)) / 4 + (v.corpo.forma - 70) / 22 + corpo - passou * (futebol && pos === 'goleiro' ? 0.18 : 0.3) * desgaste - (sacrificio ? 0.9 : 0) + r.normal() * 0.6;
  nota = Math.round(clamp(nota, 2.5, 9.6) * 10) / 10;
  // Nos outros esportes, a temporada é um calendário de competições; o que conta são os pódios.
  const max = jogosDaTemporada(e.modalidade, e.nivel);
  const disp = (12 - fora) / 12;
  const partidas = Math.max(0, Math.round(max * disp * (e.espaco === 'titular' ? 0.92 : 0.45) * (0.9 + r.next() * 0.15)));
  const titular = Math.min(partidas, Math.round(partidas * (e.espaco === 'titular' ? 0.88 : 0.3)));
  const peso = (titular + (partidas - titular) * 0.35) * Math.max(0.25, nota / 6.5);
  const gols = Math.round(peso * (futebol ? GOL[pos] : clamp((nota - 5) / 8, 0.02, 0.5)) * (0.75 + r.next() * 0.5));
  const assistencias = futebol ? Math.round(peso * ASSIST[pos] * (0.75 + r.next() * 0.5)) : 0;
  const defesa = futebol && (pos === 'goleiro' || pos === 'zagueiro' || pos === 'lateral' || pos === 'volante') ? Math.round(peso * DEFESA[pos] * (0.8 + r.next() * 0.4)) : undefined;
  // Onde o time terminou: a força do clube na divisão, a sua temporada, e o resto do elenco.
  const forcaClube = (tetoDoClube(e.clube) - e.nivel) * 3;
  // Nas modalidades individuais com equipe (natação, atletismo, luta), a colocação é a do atleta na prova que importa — não a do time.
  const individual = individualComEquipe(e.modalidade);
  const colocacao = individual
    ? Math.round(clamp(9 - (nota - 5) * 2.2 + r.normal() * 1.2, 1, 12))
    : Math.round(clamp(11 - forcaClube - (nota - 6) * (e.espaco === 'titular' ? 1.6 : 0.6) + r.normal() * 4, 1, 20));
  const t: Temporada = { ano: anoDe(v.t - 6), clube: e.clube, nivel: e.nivel, posicao: e.modalidade === 'futebol' ? pos : undefined, partidas, titular: individual ? partidas : titular, gols, assistencias, defesa, nota, colocacao, mesesFora: fora, ...(e.emprestimo ? { emprestado: e.emprestimo.clube } : {}) };
  if (e.modalidade === 'basquete') {
    // Por jogo, com o perfil da função: o pivô pega rebote, o armador distribui, o ala pontua.
    const fn = funcaoBasquete(v);
    t.funcao = fn;
    const minutos = e.espaco === 'titular' ? 1 : 0.45;
    const q = clamp((nota - 3.5) / 5, 0.1, 1.4) * minutos;
    t.pontos = Math.round((fn === 'ala' ? 15 : fn === 'pivo' ? 12 : 11) * q * (0.85 + r.next() * 0.3) * 10) / 10;
    t.rebotes = Math.round((fn === 'pivo' ? 9 : fn === 'ala' ? 5 : 3) * q * (0.85 + r.next() * 0.3) * 10) / 10;
    t.assistencias = Math.round((fn === 'armador' ? 6.5 : fn === 'ala' ? 2.5 : 1.5) * q * (0.85 + r.next() * 0.3) * 10) / 10;
    t.gols = 0;
  }
  if (e.modalidade === 'tenis') jogarCircuito(v, r, e, t, nota);
  // As outras modalidades medem o que é delas (FIX final da generalização): a função no vôlei, a prova e a marca na
  // natação e no atletismo, o cartel na luta.
  if (e.modalidade === 'volei') jogarTemporadaVolei(v, r, e, t, nota);
  if (e.modalidade === 'natacao' || e.modalidade === 'atletismo') jogarProvas(v, r, e, t, nota, h);
  if (e.modalidade === 'lutas') jogarLutas(v, r, t, nota);
  (e.temporadas ??= []).push(t);
  // A carreira inteira cabe aqui (o histórico por clube e o palmarés leem daqui).
  if (e.temporadas.length > 30) e.temporadas.splice(0, e.temporadas.length - 30);
  // O nome no mercado: o que a temporada construiu (ou gastou). Divisão maior conta mais.
  const participacao = max ? titular / max : 0;
  const alvoRep = clamp((nota - 4.3) * 14 + (e.nivel - 1) * 6 + participacao * 10);
  e.reputacao = Math.round(clamp((e.reputacao ?? 30) * 0.55 + alvoRep * 0.45));
  if (e.modalidade === 'tenis') t.ranking = rankingPorPontos(t.pontosRanking ?? 0);
  return t;
}

/* ------------------------------------------------------------ Tênis: o ano, torneio a torneio */

/** As fases de uma chave, pelo número de rodadas vencidas (chave de 4 rodadas no nacional; de 5 nos internacionais). */
export function faseDoTenis(vencidas: number, rodadas: number): string {
  const falta = rodadas - vencidas;
  return falta <= 0 ? 'título' : falta === 1 ? 'final' : falta === 2 ? 'semifinal' : falta === 3 ? 'quartas de final' : vencidas === 0 ? 'primeira rodada' : 'segunda rodada';
}
const CIDADES_TORNEIO = ['Florianópolis', 'Campinas', 'Porto Alegre', 'Belo Horizonte', 'Recife', 'Curitiba', 'Brasília', 'Salvador', 'Goiânia', 'Fortaleza', 'Ribeirão Preto', 'Santos'];
const TORNEIOS_PRINCIPAL = ['um torneio 250 do circuito principal', 'um torneio 500 do circuito principal', 'um masters do circuito principal', 'um dos quatro grandes torneios do ano'];

/** O porte de um torneio do circuito principal (250, 500, masters, um dos quatro grandes): quanto vale e como se chama. */
function porteNoPrincipal(r: Rng): number { const x = r.next(); return x < 0.55 ? 0 : x < 0.85 ? 1 : x < 0.97 ? 2 : 3; }

/** O nome de um torneio, no universo do jogo (nenhum torneio real é afirmado). */
function nomeDoTorneio(nivel: number, r: Rng, porte = 0): string {
  if (nivel >= 4) return TORNEIOS_PRINCIPAL[porte];
  const cidade = r.pick(CIDADES_TORNEIO);
  return nivel === 3 ? `o challenger de ${cidade}` : nivel === 2 ? `o torneio internacional de ${cidade}` : `o torneio nacional de ${cidade}`;
}

/**
 * O ano do tenista, torneio a torneio: cada chave é jogada rodada a rodada
 * (a chance de cada jogo nasce da nota do ano, e a rodada seguinte é mais
 * difícil). Daí saem as vitórias e derrotas, as finais, os títulos, a melhor
 * fase, os torneios que marcaram — e os pontos do ranking (a rodada
 * alcançada × o peso do torneio), de onde sai a posição no mundo.
 */
function jogarCircuito(_v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada, nota: number): void {
  const aproveitamento = clamp(0.32 + (nota - 5.5) * 0.12, 0.08, 0.86);
  const rodadas = e.nivel === 1 ? 4 : 5;
  let vit = 0, der = 0, tit = 0, fin = 0, melhor = 0, pontos = 0;
  const marcantes: { nome: string; fase: string; v: number }[] = [];
  for (let k = 0; k < t.partidas; k++) {
    const porte = e.nivel >= 4 ? porteNoPrincipal(r) : 0;
    let rd = 0;
    while (rd < rodadas) {
      // Cada rodada é um adversário melhor: chegar à final já é raro; o título, mais.
      const p = clamp(aproveitamento + 0.05 - rd * 0.08 + r.normal() * 0.05, 0.03, 0.95);
      if (r.chance(p)) { vit++; rd++; } else { der++; break; }
    }
    if (rd === rodadas) tit++;
    if (rd >= rodadas - 1) fin++;
    melhor = Math.max(melhor, rd);
    pontos += pontosDaRodada(rd, rodadas, e.nivel >= 4 ? PONTOS_PRINCIPAL[porte] : PONTOS_CAMPEAO[e.nivel]);
    if (rd >= rodadas - 2 && (rd >= rodadas - 1 || e.nivel >= 3)) marcantes.push({ nome: nomeDoTorneio(e.nivel, r, porte), fase: faseDoTenis(rd, rodadas), v: rd });
  }
  t.vitorias = vit; t.derrotas = der; t.titulos = tit; t.finais = fin;
  t.pontosRanking = pontos;
  t.melhorFase = t.partidas ? faseDoTenis(melhor, rodadas) : undefined;
  t.torneios = marcantes.sort((a, b) => b.v - a.v).slice(0, 4).map(({ nome, fase }) => ({ nome, fase }));
  t.gols = 0; t.assistencias = 0; t.titular = t.partidas;
  t.colocacao = tit > 0 ? 1 : 10;
}

/** A temporada em uma linha (tela, resumo do ano, Linha da Vida). */
export function linhaDaTemporada(_v: Vida, t: Temporada, modalidade?: Dominio): string {
  const d = modalidade ?? _v.caminhos.esporte?.modalidade;
  if (t.pontos !== undefined) return `${cap(DIVISAO_BASQUETE[t.nivel])} · ${t.colocacao}º lugar · ${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'} · ${String(t.pontos).replace('.', ',')} pontos, ${String(t.rebotes ?? 0).replace('.', ',')} rebotes e ${String(t.assistencias).replace('.', ',')} assistências por jogo${t.mesesFora >= 2 ? ` · ${t.mesesFora} meses fora por lesão` : ''}`;
  if (t.vitorias !== undefined) return `${cap(CIRCUITO_TENIS[t.nivel])} · ${t.partidas} torneios · ${t.vitorias} vitórias e ${t.derrotas ?? 0} derrotas${t.titulos ? ` · ${t.titulos} ${t.titulos === 1 ? 'título' : 'títulos'}` : ''}${(t.finais ?? 0) > (t.titulos ?? 0) ? ` · ${(t.finais ?? 0) - (t.titulos ?? 0)} ${(t.finais ?? 0) - (t.titulos ?? 0) === 1 ? 'final perdida' : 'finais perdidas'}` : ''}${t.ranking ? ` · ranking ${t.ranking}º` : ''}${t.premio !== undefined ? ` · prêmios de ${dinheiro(t.premio)}, custos de ${dinheiro(t.custos ?? 0)}` : ''}${t.mesesFora >= 2 ? ` · ${t.mesesFora} meses fora por lesão` : ''}`;
  const fora = t.mesesFora >= 2 ? ` · ${t.mesesFora} meses fora por lesão` : '';
  if (!t.posicao && d === 'volei') return `${cap(DIVISAO_VOLEI[t.nivel])} · ${t.colocacao}º lugar · ${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'}, ${t.titular} como titular${t.volei && t.funcao ? ` · ${NOME_FUNCAO_VOLEI[t.funcao as FuncaoVolei] ?? t.funcao}: ${numeroDaFuncao(t)}` : ''}${fora}`;
  const nivelInd = cap(['', 'competições regionais', 'circuito nacional de acesso', 'circuito nacional', 'elite nacional'][t.nivel]);
  if (!t.posicao && t.prova) {
    const x = t.prova;
    const resultados = [x.finais ? `${x.finais} ${x.finais === 1 ? 'final' : 'finais'}` : '', x.podios ? `${x.podios} ${x.podios === 1 ? 'pódio' : 'pódios'}` : '', x.vitorias ? `${x.vitorias} ${x.vitorias === 1 ? 'vitória' : 'vitórias'}` : ''].filter(Boolean);
    return `${nivelInd} · ${x.nome}: ${formatarMarca(x.unidade, x.marca)}${x.recorde ? ' (recorde pessoal)' : ''} · ${t.partidas} ${t.partidas === 1 ? 'competição' : 'competições'}${resultados.length ? `: ${resultados.join(', ')}` : ', sem final'}${fora}`;
  }
  if (!t.posicao && t.luta) {
    const x = t.luta;
    return `${nivelInd} · ${x.categoria} · ${t.partidas} ${t.partidas === 1 ? 'evento' : 'eventos'} · ${x.lutas} ${x.lutas === 1 ? 'luta' : 'lutas'}: ${x.vitorias} ${x.vitorias === 1 ? 'vitória' : 'vitórias'}${x.antesDoTempo ? ` (${x.antesDoTempo} antes do tempo)` : ''}, ${x.derrotas} ${x.derrotas === 1 ? 'derrota' : 'derrotas'}${x.titulos ? ` · ${x.titulos} ${x.titulos === 1 ? 'título' : 'títulos'}` : ''}${x.podios > x.titulos ? ` · ${x.podios} ${x.podios === 1 ? 'pódio' : 'pódios'}` : ''}${fora}`;
  }
  if (!t.posicao) return `${nivelInd} · ${t.partidas} ${t.partidas === 1 ? 'competição' : 'competições'} · ${podiosDe(t)} ${podiosDe(t) === 1 ? 'pódio' : 'pódios'}${t.colocacao <= 8 ? ` · melhor colocação: ${t.colocacao}º` : ''}${fora}`;
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
/** A reputação no mercado, no idioma da modalidade (o vôlei tem equipe; o atletismo e a luta, circuito — não "elenco"). */
export const palavraDaReputacao = (x: number, modalidade: Dominio = 'futebol') => {
  const coletivo = modalidade === 'futebol' || modalidade === 'volei' || modalidade === 'basquete';
  const quem = modalidade === 'futebol' ? 'jogador de confiança do elenco' : coletivo ? 'atleta de confiança da equipe' : 'atleta respeitado no circuito';
  const mais = modalidade === 'futebol' ? 'mais um no elenco' : coletivo ? 'mais uma peça da equipe' : 'mais um nas competições';
  return x >= 75 ? (coletivo ? 'um dos nomes do campeonato' : 'um dos nomes da modalidade no país') : x >= 58 ? 'nome respeitado no mercado' : x >= 40 ? quem : x >= 24 ? mais : 'pouco lembrado pelo mercado';
};

/* ------------------------------------------------------------ O ano */

export function processarEsporte(v: Vida, r: Rng): void {
  const i = idade(v);
  const e = v.caminhos.esporte;
  const mod = modalidadePrincipal(v);

  // Campeonatos da infância e da adolescência: destaque é marca.
  if (mod && i >= 8 && i <= 18 && !e && etapaNaBase(v) === 'fora') {
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
    const janela = mod.d === 'futebol' ? i >= 11 && i <= 17 : mod.d === 'tenis' ? i >= 10 && i <= 16 : i >= 12 && i <= 18;
    if (janela && h >= 42 && tentativas < 3 && (ultimaPeneira === undefined || v.t - ultimaPeneira >= 24)) {
      const serio = mod.nivel >= 2 ? 1 : 0.35;
      // Quem foi destaque (ou capitão) do time da escola é visto por quem indica (`arcos`): a história da atividade pesa na descoberta.
      const visto = mod.d === 'futebol' && (temFato(v, 'destaque_escolar_futebol') || (v.educacao.vivencias ?? []).some(x => x.tipo === 'time' && (x.etapa === 'destaque' || x.etapa === 'capitao'))) ? 1.4 : 1;
      const chance = clamp((h - 36) / 32, 0, 0.6) * serio * visto * (0.6 + estruturaEsportiva(v.moradia.municipioId) * 0.15);
      if (r.chance(chance)) {
        const lugar = ondeTreina(v, mod.d);
        const clube = nomeDeClube(lugar, `${v.id}:${i}`, mod.d);
        const longe = lugar !== v.moradia.municipioId;
        const especifico = mod.d === 'tenis'
          ? `Depois de um torneio da região, o treinador de ${clube}${longe ? `, em ${municipio(lugar).nome}` : ''} chamou para uma semana de testes: quem fica entra no alto rendimento e no circuito juvenil — que custa viagem, e a família paga parte.`
          : mod.d === 'basquete'
            ? `O técnico viu você ${i <= 13 ? 'no torneio da escola' : 'num jogo do estadual'} e chamou para a seletiva da equipe de base ${doClube(clube)}${longe ? `, em ${municipio(lugar).nome}` : ''}. Medem a altura na entrada (${estaturaEmPalavras(estatura(v))}, a sua) — e depois é quadra.`
            : undefined;
        novaOportunidade(v, {
          tipo: mod.d === 'futebol' ? 'peneira' : 'seletiva', dominio: mod.d, municipioId: lugar, meses: 12, chave: `peneira_${mod.d}`,
          titulo: mod.d === 'futebol' ? `Peneira ${noClube(clube)}` : mod.d === 'tenis' ? `Testes ${noClube(clube)}` : `Seletiva ${noClube(clube)}`,
          texto: especifico ?? `${v.rotinas.some(x => x.id === 'time_escola') && !v.rotinas.some(x => x.id === 'futebol' && (x.nivel ?? 1) >= 2) ? 'O professor de educação física, nos jogos escolares,' : mod.nivel >= 2 ? 'O treinador' : 'Um conhecido que entende de esporte'} viu você ${mod.d === 'futebol' ? 'jogar' : 'competir'} e indicou para ${mod.d === 'futebol' ? 'a peneira' : 'a seletiva'} ${doClube(clube)}${longe ? `, em ${municipio(lugar).nome}` : ''}. ${mod.d === 'futebol' ? 'Centenas de garotos' : 'Dezenas de atletas'}, poucas vagas.`
        });
      }
    }
  }

  // O campeonato amador (17–23): a porta tardia. Quem treina a sério e joga competição de adulto pode ser visto —
  // não por ter começado tarde, mas pelo que joga hoje. A régua é a do time de cima de um clube pequeno, não a da base.
  if (mod && MODALIDADES_AMADORAS.includes(mod.d) && i >= 17 && i <= 24 && mod.nivel >= 2 && etapaNaBase(v) === 'fora' && (!e || e.fase === 'encerrada') && !temFato(v, 'atleta_profissional')) {
    const h = habilidade(v, mod.d);
    const testes = v.fatos[`testes_amador_${mod.d}`] ?? 0;
    const ultima = v.caminhos.ultimas[`amador_${mod.d}`];
    // Só quem já joga acima do que o estadual pede chama atenção (a régua de titular de um clube pequeno, não a de uma base).
    if (h >= barraDeTitular(mod.d, 1) - 1 && testes < 2 && (ultima === undefined || v.t - ultima >= 24) && !v.caminhos.oportunidades.some(o => o.atividade === 'amador')) {
      // Poucos são vistos: o auxiliar não vai a todo jogo, e o time de cima de um clube pequeno quase sempre já está fechado.
      const chance = clamp((h - barraDeTitular(mod.d, 1) + 2) / 36, 0, 0.25) * (mod.nivel >= 3 ? 1 : 0.7) * (0.7 + estruturaEsportiva(v.moradia.municipioId) * 0.15);
      if (r.chance(chance)) {
        const lugar = ondeTreina(v, mod.d);
        const clube = clubeAmador(v, mod.d, lugar);
        v.fatos[`testes_amador_${mod.d}`] = testes + 1;
        const porta = portaAmadora(mod.d);
        const quem = porta.quem;
        const individual = individualComEquipe(mod.d);
        novaOportunidade(v, {
          tipo: mod.d === 'futebol' ? 'peneira' : 'seletiva', dominio: mod.d, municipioId: lugar, meses: 12, chave: `amador_${mod.d}`, atividade: 'amador',
          titulo: `Teste ${noClube(clube)}`,
          texto: `${quem} ${doClube(clube)}${lugar !== v.moradia.municipioId ? `, de ${municipio(lugar).nome},` : ''} ${individual ? `${mod.d === 'lutas' ? 'viu você lutar' : 'viu a sua marca'} e chamou para treinar com a equipe adulta. Não é a categoria de base: é a equipe principal, a ajuda de custo pequena de uma equipe pequena` : 'viu você e chamou para uma semana de treino com o time de cima. Não é a base: é o elenco adulto, o salário pequeno de um clube pequeno'} — e quase ninguém chega por aqui.`
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

/**
 * As modalidades em que a competição de adultos é porta (a várzea, a liga amadora, a prova aberta, o torneio
 * aberto). FIX final da generalização: o atletismo (quem corre e arremessa em prova aberta é visto pela marca) e a
 * luta (o torneio aberto) entraram. A natação não (o auge é cedo: quem não nadou base não chega ao adulto), e o
 * tênis também não (não há "time de cima": o caminho é o ranking, desde o juvenil).
 */
export const MODALIDADES_AMADORAS: Dominio[] = ['futebol', 'basquete', 'volei', 'atletismo', 'lutas'];

/** O clube pequeno que olha o campeonato amador: no futebol, um clube regional do estado; nos outros, a equipe da cidade. */
function clubeAmador(v: Vida, d: Dominio, lugar: string): string {
  if (d !== 'futebol') return equipeDaModalidade(d, lugar);
  const uf = municipio(lugar).uf;
  const lista = CLUBES.filter(c => c.porte === 'regional' && municipio(c.cidade).uf === uf);
  const todos = lista.length ? lista : CLUBES.filter(c => c.porte === 'regional');
  return todos[Math.floor(hash(`${v.id}:amador:${v.t}`) * todos.length) % todos.length].nome;
}

/**
 * Passou no teste do time de cima (a rota amadora): a carreira começa sem
 * base — o clube pequeno oferece o contrato (a decisão `esp_contrato`).
 */
export function entrarPeloAmador(v: Vida, d: Dominio, municipioId: string, clube: string): void {
  arquivarCarreiraEsportiva(v);
  const cidade = d === 'futebol' ? CLUBES.find(c => c.nome === clube)?.cidade ?? municipioId : municipioId;
  v.caminhos.esporte = { modalidade: d, fase: 'base', clube, nivel: 1, tInicio: v.t, tFase: v.t, lesoes: 0, municipioId: cidade, origem: 'amador' };
  v.fatos['contrato_nivel'] = 1;
  const texto = `Passou no teste ${doClube(clube)}: ${daPorta(d)} para ${portaAmadora(d).elenco}, aos ${idade(v)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, 'oportunidade', texto, 3, { dominio: d });
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

/**
 * Uma carreira esportiva nova não apaga a anterior (generalização de
 * carreiras): a que acabou, se teve temporadas ou seleção, vai para o arquivo
 * da pessoa (`caminhos.carreirasEsportivas`) — a tela e o legado leem as duas.
 */
export function arquivarCarreiraEsportiva(v: Vida): void {
  const antiga = v.caminhos.esporte;
  if (!antiga || antiga.fase !== 'encerrada' || (!(antiga.temporadas?.length) && !antiga.selecao)) return;
  const lista = (v.caminhos.carreirasEsportivas ??= []);
  if (!lista.includes(antiga)) lista.push(antiga);
  if (lista.length > 4) lista.splice(0, lista.length - 4);
}

/** Todas as carreiras esportivas da vida (as arquivadas e a de agora), em ordem. */
export const carreirasEsportivas = (v: Vida): CarreiraEsportiva[] => [...(v.caminhos.carreirasEsportivas ?? []), ...(v.caminhos.esporte ? [v.caminhos.esporte] : [])];

export function entrarNaBase(v: Vida, d: Dominio, municipioId: string, clube: string): void {
  arquivarCarreiraEsportiva(v);
  v.caminhos.esporte = { modalidade: d, fase: 'base', clube, nivel: 1, tInicio: v.t, tFase: v.t, lesoes: 0, municipioId };
  const rot = v.rotinas.find(x => x.id === d);
  if (rot) rot.nivel = 3; else v.rotinas.push({ id: d, tInicio: v.t, nivel: 3 });
  const longe = municipioId !== v.moradia.municipioId;
  const texto = `Entrou para ${aEquipe(d, clube)}${longe ? `, em ${municipio(municipioId).nome}: alojamento durante a semana, casa nos domingos` : ''}.`;
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
  // Tênis: o circuito juvenil é viagem, inscrição, hotel. A casa com folga paga; sem ela, sai da conta — ou se joga menos torneios (e a técnica anda menos).
  if (e.modalidade === 'tenis') {
    const custo = custoJuvenilTenis(Math.min(4, 1 + Math.floor(anos)));
    const folga = recursosDaFamilia(v).folga;
    if (folga >= 3) escrever(v, { texto: `Mais um ano de circuito juvenil: a família pagou as viagens (uns ${dinheiro(custo)}).`, relevancia: 'cotidiano', tema: 'lazer' });
    else if (v.financas.conta >= custo) { v.financas.conta -= custo; lancar(v, 'Viagens do circuito juvenil de tênis', 'despesa', -custo); escrever(v, { texto: `As viagens do circuito juvenil (${dinheiro(custo)}) saíram da sua conta.`, relevancia: 'cotidiano', tema: 'dinheiro' }); }
    else {
      const f = v.caminhos.frentes.tenis;
      if (f) f.habilidade = clamp(f.habilidade - 1.5);
      if (!temFato(v, 'tenis_sem_viagem')) { marcarFato(v, 'tenis_sem_viagem'); escrever(v, { texto: 'Sem dinheiro para viajar, jogou só os torneios da região. Os outros da academia foram; a diferença apareceu na quadra.', relevancia: 'biografia', tema: 'lazer', tom: 'ruim' }); }
    }
  }
  // Lesão: vira uma condição de verdade (Saúde, treino, decisão de como cuidar).
  if (!lesaoAtiva(v) && r.chance(0.06 * fatorDeRiscoFisico(v))) {
    e.lesoes += 1;
    lesionar(v, r, r.chance(0.2) ? 2 : 1, 'pratica');
  }
  // Contrato profissional: só para quem segue evoluindo.
  const { idade: idadeContrato, tecnica: limiar } = contratoDaBase(e.modalidade);
  if (i >= idadeContrato[0] && i <= idadeContrato[1] && h >= limiar && r.chance(clamp((h - limiar + 2) / 16, 0.08, 0.6))) {
    // O tenista sem ranking não entra direto nos torneios grandes: começa no nacional ou na entrada internacional.
    const nivel = e.modalidade === 'tenis' ? circuitoDeEstreia(h) : nivelPelaHabilidade(h);
    novaOportunidade(v, {
      tipo: 'convite', ocupacaoId: ocupacaoDaModalidade(e.modalidade), dominio: e.modalidade, meses: 12, chave: 'contrato_esporte',
      titulo: e.modalidade === 'tenis' ? 'Virar profissional' : 'Contrato profissional',
      texto: e.modalidade === 'tenis' ? 'Os resultados do circuito juvenil chamaram atenção: dá para virar profissional. Sem clube e sem salário — o que entra é a premiação, e treinador e viagens passam a ser seus.' : e.modalidade === 'basquete' ? `${cap(oClube(e.clube))} ofereceu contrato para o time adulto: uma temporada, salário de atleta, lugar no elenco${nivel >= 3 ? ' do NBB' : ''}.` : e.modalidade === 'futebol' ? `${cap(oClube(e.clube))} ofereceu o primeiro contrato profissional${nivel > tetoDoClube(e.clube) ? ' — e há sondagem de um clube maior' : ''}. Salário de verdade, prazo de dois anos.` : `A equipe ofereceu contrato de atleta profissional, com salário e calendário de competições.`,
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
  const oc = ocupacao(ocupacaoDaModalidade(e.modalidade));
  // A volta de quem já era profissional (sem clube, ou depois da suspensão): é com o clube DA proposta, não o da base — e não é "o primeiro contrato".
  if (e.fase === 'profissional') {
    const p = propostaNaMesa(v);
    const emp = contratar(v, r, oc, 'oportunidade');
    emp.empregador = e.modalidade === 'tenis' ? 'por conta própria (o circuito)' : oClube(p?.clube ?? e.clube);
    if (p) {
      transferirPara(v, e, p);
      // O clube é de outra cidade: a vida vai junto (quem mora na casa também — a mesma regra de toda mudança).
      if (p.municipioId !== v.moradia.municipioId) { emp.municipioId = p.municipioId; mudarAgora(v, p.municipioId, `para jogar ${noClube(p.clube)}`); }
    }
    else { e.nivel = Math.max(1, Math.min(4, nivel)) as 1 | 2 | 3 | 4; e.espaco = 'reserva'; assinarContrato(v, e, 12); }
    const texto = e.modalidade === 'futebol' ? `Voltou a jogar: assinou com ${oClube(e.clube)}, aos ${idade(v)}.` : `Voltou a competir, aos ${idade(v)}.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
    return;
  }
  e.fase = 'profissional';
  e.tFase = v.t;
  // O primeiro contrato é com o clube da base, na divisão que ele alcança na simulação.
  e.nivel = Math.max(1, Math.min(4, nivel, e.modalidade === 'futebol' ? tetoDoClube(e.clube) : 4)) as 1 | 2 | 3 | 4;
  // Um clube grande não joga as divisões de acesso: quem ainda não tem nível para o time de cima começa num clube
  // do tamanho do próprio jogo (o mesmo estado, de preferência) — e a biografia diz isso.
  const daBase = e.clube;
  if (e.modalidade === 'futebol' && e.nivel < pisoDoClube(e.clube)) {
    const lista = clubesDoNivel(e.nivel, e.clube);
    const uf = municipio(v.moradia.municipioId).uf;
    const perto = lista.filter(c => municipio(c.cidade).uf === uf);
    const alvo = (perto.length ? perto : lista)[Math.floor(hash(`${v.id}:primeiro`) * (perto.length || lista.length)) % (perto.length || lista.length)];
    if (alvo) { e.clube = alvo.nome; e.municipioId = alvo.cidade; }
  }
  if (e.modalidade === 'futebol') e.posicao ??= posicaoSugerida(v);
  e.reputacao ??= Math.round(clamp(12 + (habilidade(v, e.modalidade) - 70) * 1.5 + e.nivel * 4, 5, 45));
  // O treino de base vira treino de clube: é trabalho agora, não atividade de tempo livre (e não conta duas vezes na semana nem no corpo).
  v.rotinas = v.rotinas.filter(x => x.id !== e.modalidade);
  const emp = contratar(v, r, oc, 'oportunidade');
  emp.empregador = e.modalidade === 'tenis' ? 'por conta própria (o circuito)' : oClube(e.clube);
  // O clube do primeiro contrato é de outra cidade: a vida vai para lá (a mesma regra de toda mudança).
  if ((e.clube !== daBase || e.origem === 'amador') && e.municipioId !== v.moradia.municipioId) { emp.municipioId = e.municipioId; mudarAgora(v, e.municipioId, `para jogar ${noClube(e.clube)}`); }
  // O primeiro contrato é curto; o espaço no time depende do que se joga.
  e.espaco = e.modalidade === 'tenis' ? 'titular' : habilidade(v, e.modalidade) >= barraDeTitular(e.modalidade, e.nivel) ? 'titular' : 'reserva';
  assinarContrato(v, e, 24);
  // O tenista começa sem prêmio no bolso: a renda do ano é a estimativa do circuito em que entra (a temporada acerta a conta).
  if (e.modalidade === 'tenis') emp.salario = Math.round(premiacaoTenis(e, { nota: 6, partidas: [0, 14, 20, 22, 22][e.nivel] }) / 12 / 10) * 10;
  const outroClube = e.origem === 'amador' ? ` — vindo ${daPorta(e.modalidade)}, sem passar por base` : e.clube !== daBase ? ` (${oClube(daBase)} não tinha lugar no time de cima)` : '';
  const texto = e.modalidade === 'tenis' ? `Virou tenista profissional aos ${idade(v)}, no ${CIRCUITO_TENIS[e.nivel]}: sem clube, sem salário, a raquete e o ranking.` : e.modalidade === 'basquete' ? `Assinou o primeiro contrato de ${NOME_FUNCAO[funcaoBasquete(v)]} ${peloClube(e.clube)}, aos ${idade(v)}${e.origem === 'amador' ? ', vindo da liga amadora' : ''}.` : e.modalidade === 'futebol' ? `Assinou o primeiro contrato profissional de jogador, ${peloClube(e.clube)}, aos ${idade(v)}${outroClube}.` : `Virou atleta profissional de ${NOME_MOD[e.modalidade]}, ${peloClube(e.clube)}, aos ${idade(v)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, 'profissional', texto, 3, { dominio: e.modalidade, ocupacaoId: oc.id });
  registrarConquista(v, { tipo: 'marco', modalidade: e.modalidade, ano: anoDe(v.t), competicao: divisaoDe(e.modalidade, e.nivel), clube: e.modalidade === 'tenis' ? undefined : e.clube, texto: `Primeiro contrato profissional, aos ${idade(v)}` });
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
      e.proposta = undefined;
      const p = criarProposta(v, e, 1, 'sem_clube');
      novaOportunidade(v, { tipo: 'convite', ocupacaoId: ocupacaoDaModalidade(e.modalidade), dominio: e.modalidade, meses: 12, chave: 'volta_suspensao', titulo: 'Voltar a jogar', texto: `Acabou a suspensão. ${p && e.modalidade === 'futebol' ? `${cap(oClube(p.clube))}, de ${municipio(p.municipioId).nome},` : 'Um clube pequeno'} topa dar uma chance — salário baixo, olhar desconfiado.`, bonus: 1 });
      escrever(v, { texto: 'A suspensão acabou. O nome ficou marcado, mas um clube pequeno ligou.', relevancia: 'biografia', tema: 'trabalho' });
    } else encerrarCarreira(v, e, 'suspensao');
    return;
  }
  if (!emp || !OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) {
    // Sem clube, esperando proposta (escolheu insistir): o mercado responde — ou não.
    if (v.fatos['esp_sem_clube'] !== undefined && !emp) {
      const desde = v.fatos['esp_sem_clube'];
      const oferta = nivelQueOMercadoOferece(v, e);
      if (oferta >= 1 && v.t - desde <= 24) {
        delete v.fatos['esp_sem_clube'];
        e.proposta = undefined;
        const nivel = Math.min(4, oferta) as 1 | 2 | 3 | 4;
        const p = criarProposta(v, e, nivel, 'sem_clube');
        const quem = p && e.modalidade === 'futebol' ? `${oClube(p.clube)}, de ${municipio(p.municipioId).nome},` : oferta < e.nivel ? 'um clube de divisão menor' : 'um clube';
        novaOportunidade(v, { tipo: 'convite', ocupacaoId: ocupacaoDaModalidade(e.modalidade), dominio: e.modalidade, meses: 12, chave: 'volta_clube', titulo: 'Um clube ligou', texto: `Depois de meses treinando por conta, ${quem} fez proposta${p ? ` (${divisaoDe(e.modalidade, p.nivel)})` : ''}. Salário ${oferta < e.nivel ? 'menor' : 'parecido'}, contrato curto.`, bonus: nivel });
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
  const lesao = (0.07 + Math.max(0, i - 26) * 0.012) * (forcar ? 1.6 : preservar ? 0.6 : 1) * (e.doping ? 1.3 : 1) * (e.modalidade === 'futebol' ? RISCO_POSICAO[pos] : RISCO_MODALIDADE[e.modalidade] ?? 1) * fatorDeRiscoFisico(v) * (atual?.lesao.cuidado === 'sacrificio' ? 1.4 : 1);
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
  if (e.modalidade === 'tenis') { anoDeCircuito(v, r, e, t); processarSelecao(v, r, e, t); return; }
  const nomeClube = e.modalidade === 'futebol' ? cap(e.clube) : 'A equipe';
  // A temporada no palmarés: título (e o papel nele), acesso ou rebaixamento, prêmios pela posição, marcos — e a seleção, que observa.
  registrarTemporada(v, r, e, t);
  processarSelecao(v, r, e, t);
  // O empréstimo: no fim do prazo, a volta ao clube detentor — ou o clube de agora quer ficar com você (a resposta é sua).
  if (e.emprestimo) {
    const naMesa = propostaNaMesa(v);
    if (v.t >= e.emprestimo.ate) {
      if (naMesa?.origem === 'compra') { voltarDoEmprestimo(v, e); return; }
      if (t.nota >= 6.8 && nivelQueOMercadoOferece(v, e) >= e.nivel && r.chance(0.4) && criarProposta(v, e, e.nivel, 'compra')) { v.fatos['esp_proposta_hoje'] = v.t; return; }
      voltarDoEmprestimo(v, e);
    }
    return;
  }
  // O mercado reage à temporada: um clube maior pergunta (a resposta é sua: `esp_proposta`).
  const oferta = nivelQueOMercadoOferece(v, e);
  // A proposta nasce aqui, concreta (clube, cidade, salário), e fica na mesa até a resposta (`criarProposta`).
  if (oferta > e.nivel && e.nivel < 4 && t.nota >= 6.6 && r.chance(0.45) && criarProposta(v, e, (e.nivel + 1) as 1 | 2 | 3 | 4, 'mercado')) v.fatos['esp_proposta_hoje'] = v.t;
  // Reserva de novo, temporada fraca: o clube quer liberar você para um menor (a ideia é do clube; ir ou ficar brigando é você quem diz).
  const ultimas = (e.temporadas ?? []).slice(-2);
  if (e.espaco === 'reserva' && ultimas.length === 2 && ultimas.every(x => x.nota < 5.6 && x.titular < 8) && e.nivel > 1 && oferta < e.nivel && r.chance(0.5)
    && criarProposta(v, e, (e.nivel - 1) as 1 | 2 | 3 | 4, 'liberacao')) v.fatos['esp_proposta_hoje'] = v.t;
  // O jovem que quase não joga: o clube quer emprestá-lo para ganhar minutos (o contrato continua aqui). Futebol: o mercado de empréstimo é dele.
  if (e.modalidade === 'futebol' && i <= 23 && e.espaco === 'reserva' && e.nivel >= 2 && t.titular < jogosDaTemporada(e.modalidade, e.nivel) * 0.3
    && (e.contratoAte ?? 0) - v.t >= 12 && r.chance(0.4) && criarProposta(v, e, (e.nivel - 1) as 1 | 2 | 3 | 4, 'emprestimo')) v.fatos['esp_proposta_hoje'] = v.t;
  // Titular ou banco na próxima: a temporada, a técnica, a conversa com o treinador, a idade para a posição.
  const conversa = v.fatos['esp_treinador_ok'] !== undefined && v.t - v.fatos['esp_treinador_ok'] <= 12 ? 3 : 0;
  const antes = e.espaco;
  const passou = Math.max(0, i - auge);
  e.espaco = h + (t.nota - 6) * 2.5 + conversa - passou * 1.2 >= barraDeTitular(e.modalidade, e.nivel) && !(lesaoAtiva(v)?.lesao.gravidade === 3) ? 'titular' : 'reserva';
  if (antes === 'titular' && e.espaco === 'reserva') { escrever(v, { texto: individualComEquipe(e.modalidade) ? 'Perdeu a vaga nas provas principais da equipe: a próxima temporada começa fora delas.' : `${nomeClube === 'A equipe' ? 'Perdeu a vaga entre os titulares' : 'Perdeu a posição'}: a próxima temporada começa no banco.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' }); abalar(v, 'perder a posição no time', -4, 3); }
  else if (antes === 'reserva' && e.espaco === 'titular') {
    escrever(v, { texto: `${individualComEquipe(e.modalidade) ? 'Ganhou a vaga nas provas principais da equipe' : 'Ganhou a posição: a próxima temporada começa como titular'}${e.clausulaTitular ? ' — e o salário sobe, como o contrato dizia' : ''}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    // A cláusula da proposta aceita: o que foi dito antes de assinar é cumprido aqui.
    if (e.clausulaTitular && emp && OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) { emp.salario = Math.max(emp.salario, e.clausulaTitular); e.clausulaTitular = undefined; }
  }
  // O contrato vence: renovar é conversa (`esp_renovacao`) — e o mercado é quem diz se ainda há lugar.
  e.contratoAte ??= v.t + 24;
  // Venceu há um ano e a conversa não aconteceu (outra decisão ocupou o ano): o contrato não vale para sempre.
  // Quem decide é o clube — prorroga por um ano, se ainda quer; se não, a pessoa fica sem clube e o mercado responde.
  if (v.t >= e.contratoAte + 12) {
    if (clubeQuerRenovar(v, e)) {
      assinarContrato(v, e, 12, 1, true);
      escrever(v, { texto: `O contrato venceu sem conversa, e ${oClube(e.clube)} prorrogou por mais um ano.`, relevancia: 'cotidiano', tema: 'trabalho' });
    } else {
      v.fatos['esp_sem_clube'] = v.t;
      e.espaco = undefined;
      e.contratoAte = undefined;
      encerrarEmprego(v, 'fim do contrato');
      escrever(v, { texto: `O contrato com ${oClube(e.clube)} acabou e não foi renovado. ${cap(semVinculo(e.modalidade))}, esperando proposta.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      return;
    }
  }
  if (v.t >= e.contratoAte) {
    v.fatos['esp_renovacao'] = v.t;
    // Quem só tem sondagem de divisão menor recebe a proposta concreta junto (o nome do clube, a cidade, o salário).
    const o = nivelQueOMercadoOferece(v, e);
    if (o >= 1 && o < e.nivel) { e.proposta = undefined; criarProposta(v, e, o as 1 | 2 | 3 | 4, 'menor'); }
  }
  // (FIX pós-REWORK 2: não há mais aposentadoria por idade fixa. O corpo declina pela posição, a temporada
  // mostra, o mercado lê: banco, divisão menor, salário menor — e, um dia, nenhum clube. Parar é escolha.)
}

/**
 * O ano do tenista: a premiação que a temporada rendeu (bruto), o que o
 * circuito custou (treinador, viagens, hotel, inscrições) e o líquido — que
 * pode ser negativo por anos. O ranking decide o circuito do ano que vem (é o
 * sistema do tênis, não uma escolha); quando a conta aperta de verdade, a
 * vida pergunta o que fazer (`esp_tenis_conta`).
 */
function anoDeCircuito(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada): void {
  const emp = v.trabalho.atual!;
  const premio = premiacaoTenis(e, t, r);
  const custos = custoDoCircuito(e.nivel, t.partidas);
  t.premio = premio; t.custos = custos;
  // O prêmio do ano vira a renda do mês (a média); os custos do circuito, uma despesa do mês — os dois no orçamento
  // (`carreira.custosDoTrabalho`), à vista na tela de Dinheiro. (A1, playtest: antes, os custos saíam da conta aqui,
  // fora do orçamento: a tela dizia "sobram R$ 14 mil por mês" e o fechamento tirava das aplicações sem dizer por quê.)
  emp.salario = Math.round(premio / 12 / 10) * 10;
  const liquido = premio - custos;
  const texto = `O ano no ${CIRCUITO_TENIS[e.nivel]}: ${t.vitorias} vitórias${t.titulos ? `, ${t.titulos} ${t.titulos === 1 ? 'título' : 'títulos'}` : ''}, ranking ${t.ranking}º. Prêmios de ${dinheiro(premio)}; treinador e viagens custaram ${dinheiro(custos)} — ${liquido >= 0 ? `sobraram ${dinheiro(liquido)}` : `faltaram ${dinheiro(-liquido)}`}.`;
  escrever(v, { texto, relevancia: t.titulos ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: liquido >= 0 ? 'bom' : t.titulos ? undefined : 'ruim' });
  registrarCircuito(v, e, t);
  // O ranking decide onde se joga: subir (a porta do circuito maior) ou descer (os pontos do ano não sustentaram).
  const proximo = circuitoPeloRanking(e.nivel, t.ranking ?? 2200);
  if (proximo > e.nivel) {
    e.nivel = proximo;
    escrever(v, { texto: `O ranking subiu o bastante: o próximo ano é no ${CIRCUITO_TENIS[e.nivel]}. Prêmios maiores — e viagens mais caras.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  } else if (proximo < e.nivel) {
    e.nivel = proximo;
    escrever(v, { texto: `O ranking caiu: o próximo ano é de volta ao ${CIRCUITO_TENIS[e.nivel]}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  }
  // Dois anos no vermelho e sem reserva para o próximo: a pergunta de continuar (ninguém decide por você).
  const ultimas = (e.temporadas ?? []).slice(-2);
  if (ultimas.length === 2 && ultimas.every(x => (x.premio ?? 0) < (x.custos ?? 0)) && v.financas.conta < custoDoCircuito(e.nivel, 14)) v.fatos['tenis_aperto'] = v.t;
}

/**
 * O ano do tenista no palmarés: cada título com o nome do torneio, cada final
 * perdida, e os marcos do ranking (o primeiro título, a estreia no circuito
 * principal, a entrada entre os cem e entre os dez). O histórico ano a ano
 * fica nas temporadas; aqui, o que vira memória.
 */
function registrarCircuito(v: Vida, e: CarreiraEsportiva, t: Temporada): void {
  const g = ge(v);
  const campeao = flex(g, 'Campeão', 'Campeã', 'Campeão');
  const comp = CIRCUITO_TENIS[e.nivel];
  const antes = (v.caminhos.palmares ?? []).filter(x => x.modalidade === 'tenis');
  const titulos = (t.torneios ?? []).filter(x => x.fase === 'título');
  for (const x of titulos) {
    const primeiro = !antes.some(c => c.tipo === 'titulo') && x === titulos[0];
    registrarConquista(v, { tipo: 'titulo', modalidade: 'tenis', ano: t.ano, competicao: comp, papel: 'protagonista', texto: `${campeao} ${x.nome.replace(/^(o|um|uma) /, m => (m === 'o ' ? 'do ' : m === 'um ' ? 'de um ' : 'de uma '))}` });
    if (primeiro || e.nivel >= 3) {
      const texto = primeiro ? `O primeiro título como profissional: ${x.nome.replace(/^o /, '')} (${t.ano}).` : `${campeao} ${x.nome.replace(/^(o|um|uma) /, m => (m === 'o ' ? 'do ' : m === 'um ' ? 'de um ' : 'de uma '))} (${t.ano}).`;
      escrever(v, { texto, relevancia: e.nivel >= 4 || primeiro ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
      marcar(v, 'conquista', texto, e.nivel >= 3 || primeiro ? 3 : 2, { dominio: 'tenis' });
    }
  }
  // Os títulos que os torneios marcantes não nomearam (o nacional, a chave pequena) ainda contam.
  const resto = (t.titulos ?? 0) - titulos.length;
  if (resto > 0) registrarConquista(v, { tipo: 'titulo', modalidade: 'tenis', ano: t.ano, competicao: comp, papel: 'protagonista', texto: `${resto} ${resto === 1 ? 'torneio vencido' : 'torneios vencidos'} no ${comp}` });
  for (const x of (t.torneios ?? []).filter(y => y.fase === 'final')) registrarConquista(v, { tipo: 'final', modalidade: 'tenis', ano: t.ano, competicao: comp, texto: `Final ${x.nome.replace(/^(o|um|uma) /, m => (m === 'o ' ? 'do ' : m === 'um ' ? 'de um ' : 'de uma '))}` });
  // Os marcos do ranking (uma vez cada).
  const marco = (texto: string, bio: boolean) => {
    if (antes.some(c => c.tipo === 'marco' && c.texto === texto)) return;
    registrarConquista(v, { tipo: 'marco', modalidade: 'tenis', ano: t.ano, competicao: comp, texto });
    if (bio) escrever(v, { texto: `${texto} (${t.ano}).`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  };
  if (e.nivel === 4) marco('Estreia no circuito principal', true);
  if ((t.ranking ?? 9999) <= 100) marco('Entrou entre os 100 melhores do ranking mundial', true);
  if ((t.ranking ?? 9999) <= 10) marco('Entrou entre os 10 melhores do ranking mundial', true);
}

/** O exame pegou: suspensão, contrato rescindido, o nome nos jornais. */
function flagrado(v: Vida, e: CarreiraEsportiva): void {
  e.doping = undefined;
  e.suspensoAte = v.t + 24;
  e.espaco = undefined;
  if (v.trabalho.atual && OCUPACOES_DE_ATLETA.includes(v.trabalho.atual.ocupacaoId)) encerrarEmprego(v, 'suspensão por doping');
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
  if (eraPro && v.trabalho.atual && OCUPACOES_DE_ATLETA.includes(v.trabalho.atual.ocupacaoId)) encerrarEmprego(v, 'fim da carreira esportiva');
  const g = ge(v);
  const texto = !eraPro
    ? motivo === 'dispensa' ? e.modalidade === 'tenis' ? `A academia cortou a bolsa aos ${i}: sem ela, o circuito juvenil ficou caro demais. O sonho de viver do tênis ficou para trás.` : `${flex(g, 'Dispensado', 'Dispensada')} ${e.modalidade === 'futebol' ? 'da base' : 'da equipe'} ${doClube(e.clube)}, aos ${i}. O sonho de viver do ${NOME_MOD[e.modalidade]} ficou para trás.` : `Deixou ${aEquipe(e.modalidade, e.clube)}, aos ${i}.`
    : motivo === 'lesao' ? `Encerrou a carreira aos ${i}, depois de lesões demais.` : motivo === 'sem_contrato' ? `Aos ${i}, ${perfilDe(e.modalidade).estrutura === 'clube' ? 'nenhum clube renovou' : perfilDe(e.modalidade).estrutura === 'equipe' ? 'nenhuma equipe renovou' : 'sem resultado nem patrocínio para seguir no circuito'}: a carreira de ${flex(g, 'atleta', 'atleta')} acabou sem despedida.` : (e.modalidade === 'tenis' ? `Guardou a raquete de competição aos ${i}.` : `Pendurou as chuteiras aos ${i}.`.replace('as chuteiras', e.modalidade === 'futebol' ? 'as chuteiras' : 'a carreira'));
  escrever(v, { texto, relevancia: 'marco', tema: eraPro ? 'trabalho' : 'lazer', tom: 'ruim' });
  marcar(v, eraPro ? 'fim_carreira' : 'fracasso', texto, 3, { dominio: e.modalidade });
  marcarFato(v, eraPro ? 'fim_carreira_esportiva' : 'dispensado_base');
  // Quem se preparou ainda jogando tem para onde ir: a comissão técnica, a escolinha.
  // Quem teve nome no esporte também é lembrado (sem curso, a porta é menor e mais rara).
  const nome = (e.reputacao ?? 0) >= 50 && e.nivel >= 3 && i >= 28;
  if (eraPro && (temFato(v, 'pos_treinador') || (nome && hash(`${v.id}:comissao`) < 0.35))) {
    const oc = e.modalidade === 'tenis' ? 'professor_tenis' : i >= 28 ? 'auxiliar_tecnico' : 'treinador_escolinha';
    novaOportunidade(v, { tipo: 'convite', ocupacaoId: oc, dominio: e.modalidade, meses: 24, chave: 'pos_treinador', titulo: e.modalidade === 'tenis' ? 'Da quadra para a aula' : e.modalidade === 'futebol' ? 'Do campo para o banco' : perfilDe(e.modalidade).estrutura === 'clube' ? 'Da quadra para o banco' : 'Do outro lado do treino', texto: oc === 'professor_tenis' ? 'Um clube da cidade quer alguém com passado de circuito para as turmas e os juvenis: aula por hora, alunos seus.' : oc === 'auxiliar_tecnico' ? (temFato(v, 'pos_treinador') ? 'O treinador que você conheceu no clube montou uma comissão técnica e lembrou de quem tirou os cursos ainda jogando.' : 'Um treinador que trabalhou com você montou uma comissão técnica: quer alguém que o vestiário respeite. Os cursos, você tira no caminho.') : 'Uma escolinha do bairro precisa de alguém que saiba ensinar e que já tenha jogado de verdade.' });
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
