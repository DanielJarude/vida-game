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

import { ocupacaoAindaNaoExiste } from '../eras/base/profissoes';
import { converterEntrePaises, paisCorrente } from '../mundo/moeda';
import { PAIS_PADRAO } from '../mundo/registro';
import { rendaRelativa, salarioMinimoDoPais } from '../mundo/economia';
import { paisDaVida } from '../mundo/vida';
import { lancar } from './extrato';
import type { Rng } from '../rng';
import { clamp, hashMisturado, rngDe } from '../rng';
import type { AnoDeFormacao, CarreiraEsportiva, Dominio, Posicao, PropostaDeClube, Temporada, Vida } from '../tipos';
import { escrever as escreverNaVida, idade, lembrarCom, marcarFato, pais, temFato, type NovaEntrada } from '../nucleo';
/** VIDA 28: tudo o que a carreira esportiva escreve é do mesmo fio da História (`Entrada.fio`): lido na ordem em que aconteceu. */
const escrever = (v: Vida, e: NovaEntrada) => escreverNaVida(v, { fio: 'esporte', ...e });
import { arquetipo, efeitosDoPerfil, guardarPerfil, lerPerfil, nomeDoArquetipo, type LeituraDoPerfil } from './arquetipos';
import { concorrenciaNaPosicao, concorrenteNaPosicao, garantirElenco, janelaDoElenco } from './elenco28';
import { ecoNasRelacoes, mexer28 } from './relacoes28';
import { cidadesDoPais, municipio, municipioDoCodigo, MUNICIPIOS, paisDaCidade } from '../dados/lugares';
import { estruturaEsportiva } from '../dados/mercado';
import { comissaoDe, ocupacao } from '../dados/ocupacoes';
import { habilidade, praticar } from './frentes';
import { marcar } from './marcas';
import { contratar, encerrarEmprego } from './trabalho';
import { capitalDoEstado } from './escola';
import { flex, ge, listaNatural } from '../texto';
import { novaOportunidade } from './oportunidades';
import { aoClube, clubeDoNivel, clubePorNome, clubesDoPais, clubesDaCidade, divisaoDoNivel, doClube, equipeDaCidade, noClube, oClube, peloClube } from '../dados/clubes';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
import { abalar } from './abalo';
import { lesaoAtiva, lesionar, mesesForaNoAno } from './lesoes';
import { fatorDeRiscoFisico } from './sobrecarga';
import { anoDe } from '../tempo';
import { dinheiro } from '../texto';
import { CIRCUITO_TENIS, custoDoCircuito, custoJuvenilTenis, DIVISAO_BASQUETE, estatura, estaturaEmPalavras, funcaoBasquete, NOME_FUNCAO, circuitoDeEstreia, circuitoPeloRanking, PONTOS_CAMPEAO, PONTOS_PRINCIPAL, pontosDaRodada, premiacaoTenis, rankingPorPontos, vantagemDeEstatura, vivePremiacao } from './modalidades';
import { recursosDaFamilia } from './origem';
import { mudarAgora } from './processos';
import { registrarTemporada, registrarConquista } from './palmares';
import { clubesNaDivisao, colocacaoNaTabela, divisaoDoClube } from './ligas';
import { copaContinental, copaNacional, copasDeQuadra, idDaLiga, nomeDaCompeticao } from './competicoes';
import { desvio, efeitoNaNota, envelhecerAtributos, fotografarAtributos, nivelNaPosicao, perfilDeAtributos, type AtributoId } from './atributosEsportivos';
import { ESTILOS26 } from '../v26/esporte/estilos26';
import { avaliacaoDaComissao, lerJovem, prontoParaContrato, type LeituraDoJovem } from './jovemAtleta';
import { avancarLicenca } from './oficioDoTecnico';
import { processarSelecao } from './selecao';
import { premiosDoMundo } from './premiosDoFutebol';
import { nomePor } from './notoriedade';
import { daPorta, individualComEquipe, perfilDe, portaAmadora, semVinculo } from './perfisEsportivos';
import { categoriaDeLuta, formatarMarca, funcaoVolei, jogarLutas, jogarProvas, jogarTemporadaVolei, NOME_FUNCAO_VOLEI, numeroDaFuncao, podiosDe, provaDe, type FuncaoVolei } from './provas';
import { BASE_FUTSAL, CONTRATO_FUTSAL, divisaoFutsal, funcaoFutsalPorSorteio, JOGOS_FUTSAL, PRODUCAO_FUTSAL, type FuncaoFutsal } from '../dados14/esportes/futsal';

export const MODALIDADES: Dominio[] = ['futebol', 'volei', 'natacao', 'atletismo', 'lutas', 'basquete', 'tenis', 'futsal'];

/**
 * VIDA 14 · ganchos de modalidade: o que uma modalidade nova põe na temporada (o futsal: a posição, os gols, o
 * goleiro-linha, as copas). Registrados por `v14/esportes` (o motor antigo não importa o novo).
 */
export interface GanchoDeModalidade { temporada?: (v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada, nota: number, ajuste: number, disp: number) => void }
export const GANCHOS_DE_MODALIDADE: Partial<Record<Dominio, GanchoDeModalidade>> = {};
/** A posição no futsal: a escolhida (ou dada pelo técnico) — senão, a que a quadra dá ao corpo. */
export const funcaoFutsalDe = (v: Vida, e?: CarreiraEsportiva): FuncaoFutsal => e?.futsal?.funcao ?? funcaoFutsalPorSorteio(hashMisturado(`${v.id}:futsal_funcao`));

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
  // VIDA 28: o convite guardado na aprovação é o do clube do teste (a identidade não se perde no caminho).
  const c = v.caminhos.conviteBase;
  if (c && c.t === v.fatos['convite_base']) return { dominio: c.dominio, municipioId: c.municipioId, clube: c.clube };
  const dominio = MODALIDADES[v.fatos['peneira_mod'] ?? 0] ?? 'futebol';
  const municipioId = municipioDoCodigo(v.fatos['peneira_lugar'] ?? -1) ?? v.moradia.municipioId;
  return { dominio, municipioId, clube: nomeDeClube(municipioId, `${v.id}:${v.fatos['convite_base']}`, dominio) };
}

/** A categoria de quem está na base (sub-15, sub-17...): a mesma na tela e no texto. */
export function categoriaDaBase(v: Vida, e: CarreiraEsportiva): string {
  const i = idade(v);
  // VIDA 14: o futsal de base também é por categoria (sub-15, sub-17, sub-20).
  // VIDA 26: quem foi promovido antes da idade joga na categoria de cima (o sub-15 de 14 anos que sobe ao sub-17).
  const j = e.adiantado26 !== undefined && (e.modalidade === 'futebol' || e.modalidade === 'futsal') ? i + 2 : i;
  return e.modalidade === 'tenis' ? 'circuito juvenil' : e.modalidade !== 'futebol' && e.modalidade !== 'futsal' ? 'equipe de base' : j <= 15 ? 'sub-15' : j <= 17 ? 'sub-17' : 'sub-20';
}

/** O contrato profissional: a idade em que chega e a técnica que o clube pede (a mesma conta do ano na base). */
export const contratoDaBase = (d: Dominio) => (d === 'futsal' ? CONTRATO_FUTSAL : { idade: (d === 'futebol' ? [17, 20] : [17, 22]) as [number, number], tecnica: d === 'futebol' ? 79 : 82 });

/** O nome da divisão (ou do circuito) em cada modalidade: fonte única para tela e texto. */
export function divisaoDe(d: Dominio, nivel: number, pais = paisCorrente()): string {
  if (d === 'futebol') return divisaoDoNivel(nivel, pais) ?? '';
  if (d === 'futsal') return divisaoFutsal(nivel, pais);
  // Basquete e vôlei: as ligas brasileiras (NBB, Superliga) só no Brasil; fora, a liga do país dita pelo que ela é —
  // sem inventar nome (o perfil dos países só traz as divisões do futebol).
  if (d === 'basquete') return (pais === PAIS_PADRAO ? DIVISAO_BASQUETE : DIVISAO_GENERICA_QUADRA('basquete'))[nivel] ?? '';
  if (d === 'tenis') return CIRCUITO_TENIS[nivel] ?? '';
  if (d === 'volei') return (pais === PAIS_PADRAO ? DIVISAO_VOLEI : DIVISAO_GENERICA_QUADRA('vôlei'))[nivel] ?? '';
  return ['', 'competições regionais', 'circuito nacional de acesso', 'circuito nacional', 'elite nacional'][nivel] ?? '';
}

/** Fora do Brasil: as divisões de quadra pelo que são. */
const DIVISAO_GENERICA_QUADRA = (m: string) => ['', `campeonato regional de ${m}`, `segunda divisão nacional de ${m}`, `liga nacional de ${m}`, `liga nacional de ${m} — entre os times de ponta`];

/** Vôlei: o estadual, a divisão de acesso nacional e a liga nacional (a elite). */
export const DIVISAO_VOLEI = ['', 'campeonato estadual', 'Superliga B', 'Superliga', 'Superliga — entre os times de ponta'];

/** Quem vive do esporte como atleta (o emprego que a carreira esportiva ocupa). */
export const OCUPACOES_DE_ATLETA = ['jogador_futebol', 'atleta', 'jogador_basquete', 'tenista'];
/** A ocupação de quem se profissionaliza em cada modalidade. */
export const ocupacaoDaModalidade = (d: Dominio) => (d === 'futebol' ? 'jogador_futebol' : d === 'basquete' ? 'jogador_basquete' : d === 'tenis' ? 'tenista' : 'atleta');

/** VIDA 26.2: o nome da modalidade NESTA vida (a luta, pelo estilo escolhido: "Muay Thai", "jiu-jitsu"). */
export const nomeDaModalidade = (v: Vida, d: Dominio) => (d === 'lutas' && v.lutas26?.estilo ? ESTILOS26[v.lutas26.estilo].nome : NOME_MOD[d] ?? d);
const NOME_MOD: Partial<Record<Dominio, string>> = { futebol: 'futebol', volei: 'vôlei', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta', basquete: 'basquete', tenis: 'tênis', futsal: 'futsal' };
const EQUIPE: Partial<Record<Dominio, string>> = { futebol: 'a base', volei: 'a equipe de base', natacao: 'a equipe de natação', atletismo: 'a equipe de atletismo', lutas: 'a equipe de competição', basquete: 'a equipe de base', tenis: 'a academia de tênis', futsal: 'a base de futsal' };

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
export const augeDe = (v: Vida, e: CarreiraEsportiva) => (e.modalidade === 'futebol' ? AUGE_POSICAO[posicaoDe(v, e)] : e.modalidade === 'futsal' ? PRODUCAO_FUTSAL[funcaoFutsalDe(v, e)].auge : AUGE_MODALIDADE[e.modalidade] ?? 29);

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
export function salarioDoContrato(v: Vida, e: CarreiraEsportiva, nivel: number = e.nivel, espaco: CarreiraEsportiva['espaco'] = e.espaco, clube: string = e.clube, pais: string = paisDaCidade(clube === e.clube ? e.municipioId : v.moradia.municipioId)): number {
  const i = idade(v);
  const futebol = e.modalidade === 'futebol';
  // Tênis não tem salário de clube: vive de premiação (`modalidades.premiacaoTenis`).
  if (vivePremiacao(e.modalidade)) return 0;
  const base = (futebol ? BASE_FUTEBOL : e.modalidade === 'basquete' ? BASE_BASQUETE : e.modalidade === 'futsal' ? BASE_FUTSAL : BASE_OUTROS)[nivel] ?? 0;
  const rep = e.reputacao ?? 30;
  const papel = espaco === 'titular' ? 1 : 0.55;
  const nome = 0.45 + (rep / 100) ** 2 * 2.2;
  const tamanho = futebol ? clubePorNome(clube, pais)?.porte ?? 'regional' : 'tradicional';
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
  // O país do clube: as ligas pagam diferente (em poder de compra de lá) — `MERCADOS`. No Brasil, 1.
  const paisDoClube = futebol ? pais : paisDaVida(v);
  const liga = futebol ? (MERCADOS[paisDoClube]?.paga ?? Math.min(2, Math.max(0.4, rendaRelativa(paisDoClube)))) : 1;
  let bruto = base * papel * nome * porte * temporada * fase * estrela * liga;
  // Fora da elite, um nome conhecido vale por si (o veterano que o clube menor contrata pelo nome).
  if (nivel <= 3 && noto >= 45) bruto += (noto - 40) ** 2 * 60 * fase * mercadoDoNome;
  return Math.max(salarioMinimoDoPais(paisDoClube), Math.round(bruto / 100) * 100);
}

/** VIDA 28: monta o elenco do clube de agora (no primeiro contrato e na chegada a um clube novo). */
export function montarElenco(v: Vida, e: CarreiraEsportiva): void {
  if (e.fase !== 'profissional') return;
  const papel = e.modalidade === 'futebol' ? posicaoDe(v, e) : e.modalidade === 'basquete' ? funcaoBasquete(v) : e.modalidade === 'volei' ? funcaoVolei(v) : funcaoFutsalDe(v, e);
  garantirElenco(v, e, { regua: barraDeTitular(e.modalidade, e.nivel), papel, salarioBase: salarioBaseDoElenco(v, e) });
}

/** VIDA 28: o salário de referência do elenco do clube (o titular médio da divisão, pelo porte do clube e pelo país). */
export function salarioBaseDoElenco(_v: Vida, e: CarreiraEsportiva): number {
  const futebol = e.modalidade === 'futebol';
  const base = (futebol ? BASE_FUTEBOL : e.modalidade === 'basquete' ? BASE_BASQUETE : e.modalidade === 'futsal' ? BASE_FUTSAL : BASE_OUTROS)[e.nivel] ?? 0;
  const pais = paisDaCidade(e.municipioId);
  const porte = futebol ? PORTE_CLUBE[clubePorNome(e.clube, pais)?.porte ?? 'regional'] ?? 0.8 : 1;
  const liga = futebol ? (MERCADOS[pais]?.paga ?? Math.min(2, Math.max(0.4, rendaRelativa(pais)))) : 1;
  return Math.max(salarioMinimoDoPais(pais), Math.round(base * porte * liga * 0.9 / 100) * 100);
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

/**
 * OS MERCADOS DO FUTEBOL (calibração do jogo, não estatística): quanto pesa
 * cada liga na hora de buscar alguém de fora e quanto ela paga, em poder de
 * compra, em relação a uma divisão equivalente no Brasil. As cinco grandes
 * ligas europeias pagam várias vezes mais; a argentina, menos. Um país fora
 * da lista paga pela renda dele e quase não compra de fora.
 */
const MERCADOS: Record<string, { peso: number; paga: number }> = {
  GB: { peso: 6, paga: 4.5 }, ES: { peso: 5, paga: 3.5 }, IT: { peso: 4, paga: 3 }, DE: { peso: 4, paga: 3 }, FR: { peso: 3, paga: 2.5 },
  PT: { peso: 3, paga: 1.3 }, BR: { peso: 2, paga: 1 }, MX: { peso: 1.5, paga: 1.4 }, US: { peso: 1.5, paga: 1.8 }, AR: { peso: 1, paga: 0.7 },
  JP: { peso: 0.8, paga: 1.3 }, CN: { peso: 0.5, paga: 1.8 }, KR: { peso: 0.3, paga: 1 }, MA: { peso: 0.2, paga: 0.6 }, AU: { peso: 0.3, paga: 1 }
};

/** Um clube de outro país quer você? (Só na elite, com nome no mercado; a liga de fora escolhe pelo peso dela.) */
function clubeDeFora(v: Vida, e: CarreiraEsportiva, origem: PropostaDeClube['origem']): { nome: string; cidade: string } | undefined {
  if (e.modalidade !== 'futebol' || origem !== 'exterior' || idade(v) < 18) return undefined;
  const rep = e.reputacao ?? 30;
  const aqui = paisDaCidade(e.municipioId);
  // VIDA 25 · BAL: as cinco grandes ligas europeias olham quem tem nome firmado (reputação 62+); abaixo disso, quem compra
  // são os mercados alternativos (Portugal, México, EUA, Japão, China...) — uma carreira lá fora sem ser a Europa de cima.
  const BIG5 = ['GB', 'ES', 'IT', 'DE', 'FR'];
  const mercados = Object.entries(MERCADOS).filter(([p]) => p !== aqui && clubesDoPais(p).length > 0 && (MERCADOS[p].paga >= (MERCADOS[aqui]?.paga ?? 1) * 0.9 || rep >= 75) && (rep >= 68 || !BIG5.includes(p)));
  if (!mercados.length) return undefined;
  const total = mercados.reduce((s, [, m]) => s + m.peso, 0);
  let alvo = hash(`${v.id}:${v.t}:liga`) * total;
  const pais = (mercados.find(([, m]) => (alvo -= m.peso) < 0) ?? mercados[0])[0];
  // O grande de fora quer quem está entre os melhores (78+); o resto, os tradicionais e os regionais da liga.
  const lista = clubesDoPais(pais).filter(c => (rep >= 82 ? c.porte === 'grande' : BIG5.includes(pais) ? c.porte !== 'grande' : c.porte !== 'regional'));
  const c = (lista.length ? lista : clubesDoPais(pais))[Math.floor(hash(`${v.id}:${v.t}:clube_fora`) * 1000) % (lista.length || clubesDoPais(pais).length)];
  return c ? { nome: c.nome, cidade: c.cidade } : undefined;
}

/** VIDA 25 · BAL: provou para um clube grande? Nome firmado (65+) e as duas últimas temporadas boas (nota 6,8+), ou uma excepcional (7,8+). */
export function provouParaGrande(e: CarreiraEsportiva): boolean {
  const ts = (e.temporadas ?? []).slice(-2);
  const ult = ts[ts.length - 1];
  return (e.reputacao ?? 0) >= 70 && !!ult && (ult.nota >= 7.8 || (ts.length === 2 && ts.every(t => t.nota >= 6.8)));
}

/** VIDA 25 · BAL: regularidade — as duas últimas temporadas acima de `nota` (o mercado de cima não compra um ano só). */
export const temporadasBoas = (e: CarreiraEsportiva, nota: number) => { const ts = (e.temporadas ?? []).slice(-2); return ts.length === 2 && ts.every(t => t.nota >= nota); };

export function criarProposta(v: Vida, e: CarreiraEsportiva, nivelPedido: 1 | 2 | 3 | 4, origem: PropostaDeClube['origem']): PropostaDeClube | undefined {
  let nivel = nivelPedido;
  if (propostaNaMesa(v)) return undefined;
  const futebol = e.modalidade === 'futebol';
  // O clube que quer você: no futebol, um clube real do porte da divisão (a liberação, de preferência no mesmo estado);
  // nos outros esportes, a estrutura é a mesma equipe, num nível acima ou abaixo.
  let clube = e.clube;
  let municipioId = v.trabalho.atual?.municipioId ?? v.moradia.municipioId;
  // A compra ao fim de um empréstimo é do clube onde se está (a mesma cidade, o mesmo clube).
  if (origem === 'exterior' && !clubeDeFora(v, e, origem)) return undefined;
  if (origem === 'compra') { clube = e.clube; municipioId = e.municipioId; }
  else if (futebol && clubeDeFora(v, e, origem)) {
    // Uma liga de fora: o clube e a cidade dele (aceitar é migrar — `migracao`, pela porta do esporte).
    const f = clubeDeFora(v, e, origem)!;
    clube = f.nome; municipioId = f.cidade;
    // REWORK 9: a divisão da proposta é a que o clube joga de fato (a tabela do país dele).
    nivel = divisaoDoClube(v, clube, paisDaCidade(municipioId));
  }
  else if (futebol) {
    const pais = paisDaCidade(e.municipioId);
    let doNivel = clubesNaDivisao(v, nivel, e.emprestimo?.clube ?? e.clube, pais).filter(c => c.nome !== e.clube);
    // VIDA 25 · BAL: o clube GRANDE da elite contrata quem já provou: nome firmado e duas temporadas boas seguidas. Sem
    // isso, quem chama da elite são os clubes tradicionais e os regionais (a vaga existe, o tamanho do clube é outro).
    if (nivel === 4 && (origem === 'mercado' || origem === 'maior') && !provouParaGrande(e)) { const sem = doNivel.filter(c => clubePorNome(c.nome, pais)?.porte !== 'grande'); if (sem.length) doNivel = sem; }
    const uf = municipio(v.moradia.municipioId).uf;
    const pertos = origem === 'liberacao' || origem === 'emprestimo' ? doNivel.filter(c => municipio(c.cidade).uf === uf) : [];
    const lista = pertos.length ? pertos : doNivel;
    clube = lista[Math.floor(hash(`${v.id}:${v.t}:${origem}:proposta`) * lista.length) % lista.length].nome;
    municipioId = clubePorNome(clube, pais)?.cidade ?? v.moradia.municipioId;
    nivel = divisaoDoClube(v, clube, pais);
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
    salario: origem === 'emprestimo' ? atual : salarioDoContrato(v, e, nivel, espaco, clube, paisDaCidade(municipioId)), salarioTitular: origem === 'emprestimo' ? atual : salarioDoContrato(v, e, nivel, 'titular', clube, paisDaCidade(municipioId)),
    t: v.t, validaAte: v.t + 11, origem
  };
  // REWORK 5: a transferência tem DOIS dinheiros — o que um clube paga ao outro (a taxa) e o que você ganha (luvas).
  const comContrato = e.contratoAte !== undefined && e.contratoAte > v.t;
  if (['mercado', 'maior', 'menor', 'exterior', 'compra'].includes(origem) && comContrato && (futebol || perfilDe(e.modalidade).estrutura === 'clube')) {
    p.taxa = taxaDeTransferencia(v, e, p);
    p.luvas = Math.round(p.taxa * 0.06 / 100) * 100;
  } else if (origem === 'sem_clube' || origem === 'mercado') p.luvas = Math.round(p.salarioTitular * 1.5 / 100) * 100;
  e.proposta = p;
  return p;
}

/**
 * A TAXA de uma transferência (o que o clube comprador paga ao clube vendedor): o salário que o mercado oferece × o
 * tempo de contrato que falta (contrato longo custa mais para tirar) × a idade (o jovem vale o futuro; o veterano, o
 * presente) × o nome. Calibração do jogo, em poder de compra local — não uma tabela real.
 */
export function taxaDeTransferencia(v: Vida, e: CarreiraEsportiva, p: Pick<PropostaDeClube, 'salarioTitular' | 'nivel'>): number {
  const i = idade(v);
  const restante = Math.max(0, ((e.contratoAte ?? v.t) - v.t) / 12);
  const jovem = i <= 21 ? 2 : i <= 25 ? 1.6 : i <= 29 ? 1.1 : i <= 32 ? 0.6 : 0.3;
  const nome = 0.6 + clamp(e.reputacao ?? 30, 0, 100) / 80;
  return Math.round(p.salarioTitular * 12 * (0.6 + Math.min(3, restante) * 0.6) * jovem * nome / 1000) * 1000;
}

/**
 * Executa EXATAMENTE a proposta aceita: clube, divisão, prazo, salário,
 * empregador. A mudança de cidade (se houver) é de quem chama — para a
 * cidade da proposta (`p.municipioId`).
 */
export function transferirPara(v: Vida, e: CarreiraEsportiva, p: PropostaDeClube, luvasDepois = false): void {
  if (p.origem === 'emprestimo') { emprestar(v, e, p); return; }
  e.ultimoClube = undefined;
  if (e.capitao && e.capitao.clube !== p.clube) e.capitao = undefined;
  const de = e.clube;
  e.clube = p.clube;
  // REWORK 9: se o clube subiu ou caiu desde a proposta, a divisão é a de agora (a tabela do país).
  e.nivel = e.modalidade === 'futebol' ? divisaoDoClube(v, p.clube, paisDaCidade(p.municipioId)) : p.nivel;
  e.espaco = p.espaco;
  e.contratoAte = v.t + p.meses;
  e.proposta = undefined;
  e.emprestimo = undefined;
  e.clausulaTitular = p.espaco === 'reserva' && p.salarioTitular > p.salario ? p.salarioTitular : undefined;
  // As luvas são suas; a taxa é do clube que vendeu (fica na história da carreira, não na sua conta).
  // REWORK 11 · ESP-11.5: as luvas estão na moeda do clube que contrata. Quem muda de país recebe DEPOIS da mudança
  // (`creditarLuvas`, chamado por quem muda a vida de lugar): antes, entravam na conta e a migração as convertia de
  // novo (−24% do Brasil à Espanha, +41% da Itália ao Brasil).
  if (p.luvas && !luvasDepois) creditarLuvas(v, p);
  // A taxa guarda o país do comprador: a moeda em que foi paga (a ficha mostra nela, não na de hoje).
  if (p.taxa && de !== p.clube) (e.transferencias ??= []).push({ t: v.t, de, para: p.clube, taxa: p.taxa, pais: paisDaCidade(p.municipioId) });
  if (e.transferencias && e.transferencias.length > 12) e.transferencias.splice(0, e.transferencias.length - 12);
  if (e.modalidade === 'futebol' || perfilDe(e.modalidade).estrutura === 'clube') e.municipioId = p.municipioId;
  const emp = v.trabalho.atual;
  if (emp && OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) {
    emp.empregador = vivePremiacao(e.modalidade) ? emp.empregador : oClube(p.clube);
    emp.salario = p.espaco === 'titular' ? p.salarioTitular : p.salario;
  }
  // VIDA 28: o elenco do clube novo já existe ao chegar (quem disputa a vaga, quem joga junto) — a janela anda no fim do ano.
  if (de !== p.clube) montarElenco(v, e);
  // VIDA 28: a mudança de clube na memória de quem é próximo.
  if (de !== p.clube) ecoNasRelacoes(v, 'transferencia', `Acompanhou a sua ida ${doClube(de)} para ${oClube(p.clube)}, em ${anoDe(v.t)}.`, 1);
}

/**
 * As luvas da assinatura, na conta: no valor da moeda do clube (se a vida já está no país do clube, o número é o da
 * proposta; se não está — a família ficou, a mudança não aconteceu —, convertido pelo câmbio), com linha no extrato.
 */
export function creditarLuvas(v: Vida, p: PropostaDeClube): void {
  if (!p.luvas) return;
  const x = Math.round(converterEntrePaises(p.luvas, paisDaCidade(p.municipioId), paisDaVida(v)));
  v.financas.conta += x;
  lancar(v, `Luvas da assinatura com ${oClube(p.clube)}`, 'renda', x);
}

/** A equipe de uma modalidade coletiva numa cidade (nome descritivo, do universo do jogo — não uma marca). */
export const equipeDaModalidade = (d: Dominio, municipioId: string) => `equipe de ${NOME_MOD[d] ?? d} de ${municipio(municipioId).nome}`;

/** A cidade de outra equipe que quer o atleta: a elite nas cidades grandes; o acesso e o estadual, na região. */
function cidadeDeEquipe(v: Vida, e: CarreiraEsportiva, nivel: number, origem: PropostaDeClube['origem']): string | undefined {
  const aqui = municipio(e.municipioId ?? v.moradia.municipioId);
  const grandes = ['metropole', 'capital', 'polo'];
  const lista = cidadesDoPais(aqui.pais).filter(m => m.id !== aqui.id && (nivel >= 3 ? grandes.includes(m.perfil) : m.perfil !== 'pequena') && (nivel >= 3 || m.regiao === aqui.regiao));
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
  e.nivel = e.modalidade === 'futebol' ? divisaoDoClube(v, p.clube, paisDaCidade(p.municipioId)) : p.nivel;
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
  // O clube detentor pode ter subido ou caído enquanto você estava fora: a divisão é a da tabela.
  e.nivel = e.modalidade === 'futebol' ? divisaoDoClube(v, x.clube, paisDaCidade(x.municipioId)) : x.nivel;
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
export const jogosDaTemporada = (d: Dominio, nivel: number) => (d === 'futebol' ? PARTIDAS[nivel] : d === 'futsal' ? JOGOS_FUTSAL[nivel] : d === 'basquete' ? [0, 18, 26, 32, 34][nivel] : d === 'tenis' ? [0, 14, 20, 22, 22][nivel] : d === 'volei' ? [0, 14, 20, 24, 26][nivel] : [0, 8, 10, 12, 12][nivel]) ?? 0;
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
  // REWORK 11 · ESP-11.2: o perfil da técnica na posição (futebol) ou na função (basquete) — entra na nota e na produção.
  // (Substitui o bônus fixo do treino do ano do REWORK 10.6: o treino da função sobe os atributos dela, e é isso que a
  // temporada lê.)
  const funcaoB = e.modalidade === 'basquete' ? funcaoBasquete(v) : undefined;
  const perfil = perfilDeAtributos(v, e, h, futebol ? pos : undefined, funcaoB);
  const dv = (id: AtributoId) => desvio(perfil, id, h);
  // VIDA 28: o perfil que as temporadas anteriores formaram (o Marrento oscila, o Cerebral não; o Matador finaliza mais).
  const ef = efeitosDoPerfil(e.perfil28);
  let nota = 6 + (h - barraDaDivisao(e.modalidade, e.nivel)) / 4 + (v.corpo.forma - 70) / 22 + corpo + efeitoNaNota(perfil, h) - passou * (futebol && pos === 'goleiro' ? 0.18 : 0.3) * desgaste - (sacrificio ? 0.9 : 0) + r.normal() * 0.6 * ef.variancia;
  nota = Math.round(clamp(nota, 2.5, 9.6) * 10) / 10;
  // Nos outros esportes, a temporada é um calendário de competições; o que conta são os pódios.
  const max = jogosDaTemporada(e.modalidade, e.nivel);
  const disp = (12 - fora) / 12;
  // A resistência do meio-campo segura o ano inteiro em campo (e quem cansa sai antes).
  const folego = futebol ? 1 + clamp(dv('resistencia'), -10, 10) * 0.004 : 1;
  const partidas = Math.max(0, Math.min(max, Math.round(max * disp * (e.espaco === 'titular' ? 0.92 : 0.45) * (0.9 + r.next() * 0.15) * folego)));
  const titular = Math.min(partidas, Math.round(partidas * (e.espaco === 'titular' ? 0.88 : 0.3)));
  const peso = (titular + (partidas - titular) * 0.35) * Math.max(0.25, nota / 6.5);
  const fGol = (futebol ? clamp(1 + dv('finalizacao') * 0.025 + dv('movimentacao') * 0.01 + dv('velocidade') * 0.008 + dv('aereo') * 0.03 + dv('bola_parada') * 0.006, 0.5, 1.7) : 1) * ef.gols;
  const fAst = (futebol ? clamp(1 + dv('passe') * 0.015 + dv('visao') * 0.015 + dv('velocidade') * 0.005 + dv('pes') * 0.02 + dv('criacao') * 0.012, 0.5, 1.7) : 1) * ef.assistencias;
  const fDef = clamp(1 + dv('marcacao') * 0.012 + dv('antecipacao') * 0.01 + dv('duelos') * 0.006, 0.5, 1.6) * ef.defesa;
  const gols = Math.round(peso * (futebol ? GOL[pos] : clamp((nota - 5) / 8, 0.02, 0.5)) * (0.75 + r.next() * 0.5) * fGol);
  const assistencias = futebol ? Math.round(peso * ASSIST[pos] * (0.75 + r.next() * 0.5) * fAst) : 0;
  const desarmes = futebol && (pos === 'zagueiro' || pos === 'lateral' || pos === 'volante') ? Math.round(peso * DEFESA[pos] * (0.8 + r.next() * 0.4) * fDef) : undefined;
  // Nas modalidades individuais com equipe (natação, atletismo, luta), a colocação é a do atleta na prova que importa — não a do time.
  const individual = individualComEquipe(e.modalidade);
  // REWORK 11 · ESP-11.1: onde o time terminou sai da MESMA tabela do país (`ligas.colocacaoNaTabela`: a força do clube
  // pela régua do mundo + a contribuição de quem joga). Antes, `11 − (porte − divisão)·3 − nota + ruído`: um grande na
  // elite terminava em 11º na média (13% de rebaixamento), e o mesmo clube, no mundo, brigava pelo título.
  // Basquete e vôlei não têm catálogo de equipes: a equipe joga com a força média da divisão (antes, a de um clube de
  // acesso — 66% de rebaixamento na elite).
  const ajuste = contribuicaoNaTemporada(nota, titular, partidas, max);
  const pais = paisDaCidade(e.municipioId);
  const ano = anoDe(v.t - 6);
  const colocacao = individual
    ? Math.round(clamp(9 - (nota - 5) * 2.2 + r.normal() * 1.2, 1, 12))
    : futebol
      ? colocacaoNaTabela(v, pais, ano, e.clube, e.nivel, ajuste, r.normal())
      : Math.round(clamp(11 - ajuste * 4 + r.normal() * 4, 1, 20));
  const t: Temporada = { ano, clube: e.clube, nivel: e.nivel, posicao: e.modalidade === 'futebol' ? pos : undefined, partidas, titular: individual ? partidas : titular, gols, assistencias, defesa: desarmes, nota, colocacao, mesesFora: fora, pais, ...(futebol ? { competicaoId: idDaLiga(pais, e.nivel) } : {}), ...(e.emprestimo ? { emprestado: e.emprestimo.clube } : {}) };
  // REWORK 11 · ESP-11.3: as copas do ano (a nacional; a continental, para quem se classificou na temporada anterior),
  // jogadas fase a fase com a mesma força do clube na liga e a mesma contribuição de quem joga.
  if (futebol) {
    // VIDA 28: o mata-mata é jogo grande — o Decisivo pesa nele.
    const ajusteCopa = ajuste + ef.decisivo * 0.3;
    const copas = [copaNacional(v, pais, ano, e.clube, e.nivel, ajusteCopa), copaContinental(v, pais, ano, e.clube, ajusteCopa)].filter(c => !!c);
    if (copas.length) t.copas = copas.map(c => ({ id: c!.id, fase: c!.fase, jogos: Math.round(c!.jogos * (e.espaco === 'titular' ? disp : 0.3 * disp)), ...(c!.final ? { final: `contra ${c!.final.adversario.startsWith('um') ? c!.final.adversario : oClube(c!.final.adversario)}, ${c!.final.placar}` } : {}), ...(c!.fase === 'vice' && c!.final && !c!.final.adversario.startsWith('um') ? { campeao: c!.final.adversario } : {}) }));
  }
  // REWORK 11.5 · ESP-02: as copas de quadra (basquete e vôlei), com o formato delas: só a elite, pela colocação do ano
  // anterior nela.
  if (e.modalidade === 'basquete' || e.modalidade === 'volei') {
    const anterior = [...(e.temporadas ?? [])].reverse().find(x => x.ano === ano - 1 && x.nivel === 4);
    const copas = copasDeQuadra(v, e.modalidade, pais, ano, e.clube, e.nivel, anterior?.colocacao, ajuste);
    if (copas.length) t.copas = copas.map(c => ({ id: c.id, fase: c.fase, jogos: Math.round(c.jogos * (e.espaco === 'titular' ? disp : 0.3 * disp)), ...(c.final ? { final: `contra ${c.final.adversario}, ${c.final.placar}` } : {}) }));
  }
  // O goleiro: os jogos sem sofrer gol saem dos gols que o time sofre (a colocação diz o time; o reflexo, o
  // posicionamento e as saídas do goleiro, o quanto passa com ele em campo) — jogo a jogo.
  if (futebol && pos === 'goleiro') {
    const jogos = titular + Math.round((partidas - titular) * 0.25);
    const lambda = golsContraPorJogo(colocacao, e.nivel) * Math.exp(-(dv('reflexos') * 0.012 + dv('posicionamento') * 0.01 + dv('saidas') * 0.006 + (nota - 6) * 0.04));
    let zeros = 0, sofridos = 0;
    for (let k = 0; k < jogos; k++) { const g = poisson(lambda, r.next()); sofridos += g; if (g === 0) zeros++; }
    t.semSofrerGol = zeros; t.golsSofridos = sofridos;
  }
  if (e.modalidade === 'basquete') {
    // Por jogo, com o perfil da função: o pivô pega rebote, o armador distribui, o ala pontua (e os atributos dizem quanto).
    const fn = funcaoB!;
    t.funcao = fn;
    const minutos = e.espaco === 'titular' ? 1 : 0.45;
    const q = clamp((nota - 3.5) / 5, 0.1, 1.4) * minutos;
    const f = (id: AtributoId) => clamp(1 + dv(id) * 0.02, 0.6, 1.5);
    t.pontos = Math.round((fn === 'ala' ? 15 : fn === 'pivo' ? 12 : 11) * q * (0.85 + r.next() * 0.3) * f('arremesso') * clamp(1 + dv('tres_pontos') * 0.008, 0.8, 1.2) * ef.gols * 10) / 10;
    t.rebotes = Math.round((fn === 'pivo' ? 9 : fn === 'ala' ? 5 : 3) * q * (0.85 + r.next() * 0.3) * f('rebote') * ef.defesa * 10) / 10;
    t.assistencias = Math.round((fn === 'armador' ? 6.5 : fn === 'ala' ? 2.5 : 1.5) * q * (0.85 + r.next() * 0.3) * f('passe') * clamp(1 + dv('criacao') * 0.01, 0.8, 1.2) * ef.assistencias * 10) / 10;
    t.gols = 0;
  }
  if (e.modalidade === 'tenis') jogarCircuito(v, r, e, t, nota);
  // As outras modalidades medem o que é delas (FIX final da generalização): a função no vôlei, a prova e a marca na
  // natação e no atletismo, o cartel na luta.
  if (e.modalidade === 'volei') jogarTemporadaVolei(v, r, e, t, nota);
  if (e.modalidade === 'natacao' || e.modalidade === 'atletismo') jogarProvas(v, r, e, t, nota, h);
  if (e.modalidade === 'lutas') jogarLutas(v, r, t, nota);
  GANCHOS_DE_MODALIDADE[e.modalidade]?.temporada?.(v, r, e, t, nota, ajuste, disp);
  if (futebol) t.minutos = Math.round(titular * (78 + r.next() * 10) + (partidas - titular) * (18 + r.next() * 10));
  // REWORK 11 · ESP-11.6: os lances que os momentos do ano somaram entram AQUI (antes do palmarés, dos prêmios, da
  // biografia e dos totais) — e a final nacional vencida numa prova individual faz da temporada um título.
  aplicarLances(e, t, individual);
  (e.temporadas ??= []).push(t);
  // REWORK 5: os totais da carreira não se perdem quando a lista de temporadas corta as mais antigas.
  const tot = (e.totais ??= { temporadas: 0, partidas: 0, gols: 0, assistencias: 0, minutos: 0 });
  tot.temporadas++; tot.partidas += t.partidas; tot.gols += t.gols; tot.assistencias += Math.round(t.assistencias); tot.minutos += t.minutos ?? 0;
  // A carreira inteira cabe aqui (o histórico por clube e o palmarés leem daqui).
  if (e.temporadas.length > 30) e.temporadas.splice(0, e.temporadas.length - 30);
  // O nome no mercado: o que a temporada construiu (ou gastou). Divisão maior conta mais.
  const participacao = max ? titular / max : 0;
  // VIDA 28: a imprensa e a torcida também leem o perfil (o Marrento e o Talento precoce rendem manchete).
  const alvoRep = clamp((nota - 4.3) * 14 + (e.nivel - 1) * 6 + participacao * 10 + ef.imprensa * 2);
  e.reputacao = Math.round(clamp((e.reputacao ?? 30) * 0.55 + alvoRep * 0.45));
  if (e.modalidade === 'tenis') t.ranking = rankingPorPontos(t.pontosRanking ?? 0);
  // O perfil envelhece com o ano (o que não se treina esfria; depois do auge, o corpo dá lugar à leitura).
  // VIDA 25: toda modalidade tem perfil agora (vôlei, futsal, tênis, natação, atletismo, luta) — todas envelhecem e são
  // fotografadas no fim do ano (a ficha compara e desenha a evolução com estes números).
  if (perfil.length) {
    envelhecerAtributos(e, i, augeDe(v, e));
    fotografarAtributos(e, ano, perfilDeAtributos(v, e, habilidade(v, e.modalidade), futebol ? pos : undefined, funcaoB), habilidade(v, e.modalidade));
  }
  // VIDA 28: o perfil emergente, relido com a temporada que acabou (vale para a próxima).
  atualizarPerfil28(v, e, perfil, h, ano);
  return t;
}

/**
 * VIDA 28 · a leitura do arquétipo do atleta no fim da temporada (`arquetipos.lerPerfil`): os desvios dos atributos da
 * posição, a personalidade, a idade, o clube, a braçadeira, as últimas três temporadas. A troca do principal é dita na
 * História (a imprensa e o vestiário passam a vê-lo assim) e lembrada pela gente próxima.
 */
export function atualizarPerfil28(v: Vida, e: CarreiraEsportiva, perfil: { id: AtributoId; valor: number; peso: number }[], h: number, ano: number): void {
  if (e.fase !== 'profissional') return;
  const n = perfil.length ? nivelNaPosicao(perfil) : h;
  const desvio = Object.fromEntries(perfil.map(x => [x.id, x.valor - n]));
  const ultimas = (e.temporadas ?? []).slice(-3);
  const jogos = ultimas.reduce((s, x) => s + x.partidas, 0) || 1;
  const seguidas = [...(e.temporadas ?? [])].reverse().findIndex(x => x.clube !== e.clube);
  const leitura: LeituraDoPerfil = {
    modalidade: e.modalidade, papel: e.modalidade === 'futebol' ? posicaoDe(v, e) : e.modalidade === 'basquete' ? funcaoBasquete(v) : e.modalidade === 'volei' ? funcaoVolei(v) : e.modalidade === 'futsal' ? funcaoFutsalDe(v, e) : undefined,
    desvio, acimaDaDivisao: h - barraDaDivisao(e.modalidade, e.nivel), tracos: v.personalidade.tracos as unknown as Record<string, number>, idade: idade(v),
    anosNoClube: seguidas === -1 ? (e.temporadas ?? []).length : seguidas, capitao: !!e.capitao && e.capitao.clube === e.clube, reserva: e.espaco === 'reserva',
    nota: ultimas.length ? ultimas.reduce((s, x) => s + x.nota, 0) / ultimas.length : undefined,
    golsPorJogo: ultimas.reduce((s, x) => s + x.gols, 0) / jogos, assistPorJogo: ultimas.reduce((s, x) => s + x.assistencias, 0) / jogos,
    titulos: (v.caminhos.palmares ?? []).filter(c => c.tipo === 'titulo' && c.modalidade === e.modalidade && c.ano >= ano - 2).length
  };
  const { perfil: novo, mudou, anterior } = guardarPerfil(e.perfil28, lerPerfil(leitura), ano, v.t);
  e.perfil28 = novo;
  if (mudou && novo.principal) {
    const nome = nomeDoArquetipo(novo.principal, ge(v));
    const onde = perfilDe(e.modalidade).estrutura === 'circuito' ? 'no circuito' : `${noClube(e.clube)}`;
    escrever(v, { texto: anterior ? `${onde.charAt(0).toUpperCase() + onde.slice(1)}, a imprensa e o vestiário já não falam de você como ${nomeDoArquetipo(anterior, ge(v)).toLowerCase()}: agora é ${artigo(nome)} ${nome.toLowerCase()} — ${arquetipo(novo.principal)!.sobre.charAt(0).toLowerCase() + arquetipo(novo.principal)!.sobre.slice(1)}` : `${onde.charAt(0).toUpperCase() + onde.slice(1)}, a imprensa passou a falar de você como ${artigo(nome)} ${nome.toLowerCase()}: ${arquetipo(novo.principal)!.sobre.charAt(0).toLowerCase() + arquetipo(novo.principal)!.sobre.slice(1)}`, relevancia: 'biografia', tema: 'trabalho', tom: 'neutro', chave: `perfil28:${novo.principal}:${ano}` });
  }
}
const artigo = (nome: string) => (/^(Muralha|Garçonete|Matadora|Marrenta|Capitã|Pontuadora|Reboteira|Armadora|Defensora|Ponteira|Central|Levantadora|Oposta|Líbero defensiva|Agressiva|Sacadora|Estrategista|Jogadora|Sexta|Classificadora|Gestora|Pilota)/.test(nome) ? 'a' : 'o');

/**
 * REWORK 11 · ESP-11.1 — a contribuição de quem joga para o time, em pontos de força da tabela (a mesma escala de
 * `ligas.forcaNaLiga`): a temporada (a nota contra a divisão) × o quanto jogou (os jogos começando jogando; quem entra no
 * fim conta um terço; meses fora por lesão já tiraram jogos). Um titular de nota 8 o ano todo vale ~+0,6 (≈ 2 posições);
 * o reserva que quase não joga, quase nada — nos dois sentidos.
 */
export function contribuicaoNaTemporada(nota: number, titular: number, partidas: number, max: number): number {
  if (!max) return 0;
  const participacao = clamp((titular + (partidas - titular) * 0.35) / max, 0, 1);
  return Math.round(clamp((nota - 6) * participacao * 0.32, -1.2, 1.2) * 100) / 100;
}

/** Os gols que o time sofre por jogo, pela colocação (o campeão sofre pouco; o lanterna, muito) — o placar do time. */
export const golsContraPorJogo = (colocacao: number, nivel: number) => (nivel === 1 ? 0.95 + (Math.min(12, colocacao) - 1) * 0.07 : 0.72 + (Math.min(20, colocacao) - 1) * 0.048);

/** Um sorteio de Poisson por inversão (um número do gerador por jogo: menos gols esperados nunca dão mais gols). */
function poisson(lambda: number, u: number): number {
  let k = 0, p = Math.exp(-lambda), s = p;
  while (u > s && k < 12) { k++; p *= lambda / k; s += p; }
  return k;
}

/** Os jogos sem sofrer gol de uma temporada (o campo novo; nos saves antigos, o `defesa` do goleiro). */
export const semSofrerGolDe = (t: Temporada): number | undefined => t.semSofrerGol ?? (t.posicao === 'goleiro' ? t.defesa : undefined);
/** Os desarmes de uma temporada (nunca os jogos sem sofrer gol do goleiro). */
export const desarmesDe = (t: Temporada): number | undefined => (t.posicao === 'goleiro' ? undefined : t.defesa);

/** REWORK 11 · ESP-11.6: os lances guardados pelos momentos do ano entram na temporada que está fechando. */
function aplicarLances(e: CarreiraEsportiva, t: Temporada, individual: boolean): void {
  const l = e.lances;
  if (!l) return;
  e.lances = undefined;
  t.gols += l.gols ?? 0;
  t.assistencias += l.assistencias ?? 0;
  if (l.semSofrerGol && t.semSofrerGol !== undefined) t.semSofrerGol = Math.min(t.titular, t.semSofrerGol + l.semSofrerGol);
  // A final nacional das provas individuais (VIDA 12.9: só depois da classificação, `esportes129`): o lugar que a final
  // deu é a colocação do atleta na prova que importa — o ouro é título; prata e bronze, pódio; fora do pódio, nunca
  // título (antes, "pódio" mantinha o 1º do sorteio do ano, e "último lugar" não mudava nada). Saves antigos: ouro/pódio.
  const lugar = l.finalNacional ?? (l.ouro ? 1 : l.podios ? Math.max(2, Math.min(t.colocacao, 3)) : undefined);
  if (individual && lugar !== undefined) {
    const podio = lugar <= 3 ? 1 : 0, ouro = lugar === 1 ? 1 : 0;
    if (t.prova) { t.prova.podios += podio; t.prova.finais = Math.max(1, t.prova.finais); t.prova.vitorias += ouro; }
    else if (t.luta) { t.luta.podios += podio; t.luta.titulos += ouro; }
    t.partidas = Math.max(1, t.partidas); t.titular = Math.max(1, t.titular);
    t.colocacao = lugar <= 3 ? lugar : Math.max(t.colocacao, lugar);
  }
}

/* ------------------------------------------------------------ Tênis: o ano, torneio a torneio */

/** As fases de uma chave, pelo número de rodadas vencidas (chave de 4 rodadas no nacional; de 5 nos internacionais). */
export function faseDoTenis(vencidas: number, rodadas: number): string {
  const falta = rodadas - vencidas;
  return falta <= 0 ? 'título' : falta === 1 ? 'final' : falta === 2 ? 'semifinal' : falta === 3 ? 'quartas de final' : vencidas === 0 ? 'primeira rodada' : 'segunda rodada';
}

const TORNEIOS_PRINCIPAL = ['um torneio 250 do circuito principal', 'um torneio 500 do circuito principal', 'um masters do circuito principal', 'um dos quatro grandes torneios do ano'];

/** O porte de um torneio do circuito principal (250, 500, masters, um dos quatro grandes): quanto vale e como se chama. */
function porteNoPrincipal(r: Rng): number { const x = r.next(); return x < 0.55 ? 0 : x < 0.85 ? 1 : x < 0.97 ? 2 : 3; }

/** O nome de um torneio, no universo do jogo (nenhum torneio real é afirmado). */
function nomeDoTorneio(nivel: number, r: Rng, porte = 0): string {
  if (nivel >= 4) return TORNEIOS_PRINCIPAL[porte];
  // O torneio do circuito nacional é numa cidade do país onde a pessoa mora (nunca Florianópolis para quem vive em Tóquio).
  const cidade = r.pick(cidadesDoPais(paisCorrente()).map(m => m.nome));
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
  // VIDA 12.9: a fase que um momento do ano jogou (a semifinal vencida no tie-break) é do ano — se o sorteio dos outros
  // torneios não chegou lá, um torneio chega (um nome estável, sem gastar o gerador).
  const garantida = e.lances?.faseTenis;
  if (garantida !== undefined && t.partidas > 0 && rodadas - garantida > melhor) {
    const rd = Math.max(0, rodadas - garantida);
    melhor = rd;
    if (rd >= rodadas - 1) fin++;
    pontos += pontosDaRodada(rd, rodadas, e.nivel >= 4 ? PONTOS_PRINCIPAL[0] : PONTOS_CAMPEAO[e.nivel]);
    if (rd >= rodadas - 2) marcantes.push({ nome: nomeDoTorneio(e.nivel, rngDe(_v.id, 'torneio_do_momento129', t.ano), 0), fase: faseDoTenis(rd, rodadas), v: rd });
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
  // REWORK 11 · ESP-11.5: a liga é a do país do clube NAQUELA temporada (antes, a do país de hoje: "2051 Cruzeiro: Primera División").
  const pais = paisDaTemporada(_v, t, d);
  if (t.pontos !== undefined) return `${cap(divisaoDe('basquete', t.nivel, pais))} · ${t.colocacao}º lugar · ${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'} · ${String(t.pontos).replace('.', ',')} pontos, ${String(t.rebotes ?? 0).replace('.', ',')} rebotes e ${String(t.assistencias).replace('.', ',')} assistências por jogo${t.mesesFora >= 2 ? ` · ${t.mesesFora} meses fora por lesão` : ''}`;
  if (t.vitorias !== undefined) return `${cap(CIRCUITO_TENIS[t.nivel])} · ${t.partidas} torneios · ${t.vitorias} vitórias e ${t.derrotas ?? 0} derrotas${t.titulos ? ` · ${t.titulos} ${t.titulos === 1 ? 'título' : 'títulos'}` : ''}${(t.finais ?? 0) > (t.titulos ?? 0) ? ` · ${(t.finais ?? 0) - (t.titulos ?? 0)} ${(t.finais ?? 0) - (t.titulos ?? 0) === 1 ? 'final perdida' : 'finais perdidas'}` : ''}${t.ranking ? ` · ranking ${t.ranking}º` : ''}${t.premio !== undefined ? ` · prêmios de ${dinheiro(t.premio)}, custos de ${dinheiro(t.custos ?? 0)}` : ''}${t.mesesFora >= 2 ? ` · ${t.mesesFora} meses fora por lesão` : ''}`;
  const fora = t.mesesFora >= 2 ? ` · ${t.mesesFora} meses fora por lesão` : '';
  if (!t.posicao && d === 'volei') return `${cap(divisaoDe('volei', t.nivel, pais))} · ${t.colocacao}º lugar · ${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'}, ${t.titular} como titular${t.volei && t.funcao ? ` · ${NOME_FUNCAO_VOLEI[t.funcao as FuncaoVolei] ?? t.funcao}: ${numeroDaFuncao(t)}` : ''}${fora}`;
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
  const div = divisaoDoNivel(t.nivel, pais);
  const partes = [`${t.partidas} ${t.partidas === 1 ? 'jogo' : 'jogos'}`, `${t.titular} como titular`, ...(t.minutos ? [`${t.minutos.toLocaleString('pt-BR')} minutos`] : [])];
  if (t.posicao === 'goleiro') { partes.push(`${semSofrerGolDe(t) ?? 0} sem sofrer gol`); if (t.golsSofridos !== undefined) partes.push(`${t.golsSofridos} ${t.golsSofridos === 1 ? 'gol sofrido' : 'gols sofridos'}`); }
  else {
    if (t.gols || t.posicao === 'atacante' || t.posicao === 'ponta' || t.posicao === 'meia') partes.push(`${t.gols} ${t.gols === 1 ? 'gol' : 'gols'}`);
    if (t.assistencias || t.posicao === 'meia' || t.posicao === 'ponta') partes.push(`${t.assistencias} ${t.assistencias === 1 ? 'assistência' : 'assistências'}`);
    if (desarmesDe(t) !== undefined) partes.push(`${desarmesDe(t)} desarmes`);
  }
  if (t.mesesFora >= 2) partes.push(`${t.mesesFora} meses fora por lesão`);
  // REWORK 11 · ESP-11.3: as copas do ano, até onde se foi.
  for (const c of t.copas ?? []) partes.push(`${nomeDaCompeticao(c.id)}: ${c.fase}`);
  return `${cap(div)} · ${t.colocacao}º lugar · ${partes.join(' · ')}`;
}

/**
 * O país de uma temporada: o que ela guardou (REWORK 11); nos saves de antes, o do clube no catálogo — e, se o nome
 * existe em mais de um país ou não é do catálogo, o do clube de agora.
 */
export function paisDaTemporada(v: Vida, t: Temporada, d?: Dominio): string {
  if (t.pais) return t.pais;
  const e = carreirasEsportivas(v).find(x => x.temporadas?.includes(t)) ?? v.caminhos.esporte;
  const aqui = e ? paisDaCidade(e.municipioId) : paisCorrente();
  if ((d ?? e?.modalidade) !== 'futebol') return aqui;
  const c = clubePorNome(t.clube, aqui);
  return c ? paisDaCidade(c.cidade) : aqui;
}

/** A temporada em uma palavra (o que o clube e o mercado leram). */
export const palavraDaNota = (n: number) => (n >= 8.2 ? 'temporada de destaque' : n >= 7 ? 'boa temporada' : n >= 5.8 ? 'temporada regular' : n >= 4.6 ? 'temporada fraca' : 'temporada ruim');

/** O nome no mercado, em palavras. */
/** A reputação no mercado, no idioma da modalidade (o vôlei tem equipe; o atletismo e a luta, circuito — não "elenco"). */
export const palavraDaReputacao = (x: number, modalidade: Dominio = 'futebol') => {
  const coletivo = modalidade === 'futebol' || modalidade === 'volei' || modalidade === 'basquete' || modalidade === 'futsal';
  const quem = modalidade === 'futebol' ? 'jogador de confiança do elenco' : coletivo ? 'atleta de confiança da equipe' : 'atleta respeitado no circuito';
  const mais = modalidade === 'futebol' ? 'mais um no elenco' : coletivo ? 'mais uma peça da equipe' : 'mais um nas competições';
  return x >= 75 ? (coletivo ? 'um dos nomes do campeonato' : 'um dos nomes da modalidade no país') : x >= 58 ? 'nome respeitado no mercado' : x >= 40 ? quem : x >= 24 ? mais : 'pouco lembrado pelo mercado';
};

/* ------------------------------------------------------------ O ano */

/** `presenca`: quanto de cada atividade aconteceu na agenda do ano (`agenda.agendaDaSemana(v).presenca`). */
export function processarEsporte(v: Vida, r: Rng, presenca: Record<string, number> = {}): void {
  avancarLicenca(v);
  const i = idade(v);
  const e = v.caminhos.esporte;
  const mod = modalidadePrincipal(v);

  // Campeonatos da infância e da adolescência: destaque é marca.
  if (mod && i >= 8 && i <= 18 && !e && etapaNaBase(v) === 'fora') {
    const h = habilidade(v, mod.d);
    if (mod.nivel >= 2 && h >= 50 && !temFato(v, `destaque_${mod.d}`) && r.chance(0.5)) {
      marcarFato(v, `destaque_${mod.d}`);
      const texto = mod.d === 'futebol' || mod.d === 'futsal' ? `Foi ${flex(ge(v), 'o artilheiro', 'a artilheira')} do campeonato ${mod.d === 'futsal' ? 'de futsal ' : ''}${i <= 12 ? 'da escolinha' : 'entre escolas da cidade'}.` : `Ganhou a primeira medalha de ${NOME_MOD[mod.d]} num torneio regional.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
      marcar(v, 'destaque', texto, 2, { dominio: mod.d });
    }
    // A peneira aparece para quem se destaca — raramente para quem só brinca.
    const ultimaPeneira = v.caminhos.ultimas[`peneira_${mod.d}`];
    const tentativas = v.fatos[`peneiras_${mod.d}`] ?? 0;
    const janela = mod.d === 'futebol' || mod.d === 'futsal' ? i >= 11 && i <= 17 : mod.d === 'tenis' ? i >= 10 && i <= 16 : i >= 12 && i <= 18;
    if (janela && h >= 42 && tentativas < 3 && (ultimaPeneira === undefined || v.t - ultimaPeneira >= 24)) {
      const serio = mod.nivel >= 2 ? 1 : 0.35;
      // Quem foi destaque (ou capitão) do time da escola é visto por quem indica (`arcos`): a história da atividade pesa na descoberta.
      const visto = mod.d === 'futebol' && (temFato(v, 'destaque_escolar_futebol') || (v.educacao.vivencias ?? []).some(x => x.tipo === 'time' && (x.etapa === 'destaque' || x.etapa === 'capitao'))) ? 1.4 : 1;
      const chance = clamp((h - 36) / 32, 0, 0.6) * serio * visto * (0.6 + estruturaEsportiva(v.moradia.municipioId) * 0.15);
      if (r.chance(chance)) {
        const porta = portaDaPeneira(v, ondeTreina(v, mod.d), `${v.id}:${i}`, mod.d);
        const lugar = porta?.lugar ?? ondeTreina(v, mod.d);
        const clube = porta?.clube ?? '';
        const longe = lugar !== v.moradia.municipioId;
        const especifico = mod.d === 'tenis'
          ? `Depois de um torneio da região, o treinador de ${clube}${longe ? `, em ${municipio(lugar).nome}` : ''} chamou para uma semana de testes: quem fica entra no alto rendimento e no circuito juvenil — que custa viagem, e a família paga parte.`
          : mod.d === 'basquete'
            ? `O técnico viu você ${i <= 13 ? 'no torneio da escola' : 'num jogo do estadual'} e chamou para a seletiva da equipe de base ${doClube(clube)}${longe ? `, em ${municipio(lugar).nome}` : ''}. Medem a altura na entrada (${estaturaEmPalavras(estatura(v))}, a sua) — e depois é quadra.`
            : undefined;
        if (porta) novaOportunidade(v, {
          tipo: mod.d === 'futebol' ? 'peneira' : 'seletiva', dominio: mod.d, municipioId: lugar, meses: 12, chave: `peneira_${mod.d}`, clube,
          titulo: mod.d === 'futebol' ? `Peneira ${noClube(clube)}` : mod.d === 'tenis' ? `Testes ${noClube(clube)}` : `Seletiva ${noClube(clube)}`,
          texto: especifico ?? `${v.rotinas.some(x => x.id === 'time_escola') && !v.rotinas.some(x => x.id === 'futebol' && (x.nivel ?? 1) >= 2) ? 'O professor de educação física, nos jogos escolares,' : mod.nivel >= 2 ? 'O treinador' : 'Um conhecido que entende de esporte'} viu você ${mod.d === 'futebol' ? 'jogar' : 'competir'} e indicou para ${mod.d === 'futebol' ? 'a peneira' : 'a seletiva'} ${doClube(clube)}${longe ? `, em ${municipio(lugar).nome}` : ''}. ${mod.d === 'futebol' ? 'Centenas de garotos' : 'Dezenas de atletas'}, poucas vagas.`
        });
      }
    }
  }

  // O campeonato amador: a porta tardia. Quem treina a sério e joga competição de adulto pode ser visto —
  // não por ter começado tarde, mas pelo que joga hoje. A régua é a do time de cima de um clube pequeno, não a da base.
  // REWORK 9.7 · FUT-02: a porta fechava aos 24 e nunca reabria para quem já tinha sido profissional (dispensado aos
  // 22, sem clube aos 25: nenhuma porta). Agora vai até os 30 (`IDADE_AMADOR`), cada vez mais estreita com a idade, e
  // o ex-profissional sem clube volta a ser visto pelo que joga. A técnica continua sendo a régua.
  if (mod && MODALIDADES_AMADORAS.includes(mod.d) && i >= 17 && i <= IDADE_AMADOR[1] && mod.nivel >= 2 && etapaNaBase(v) === 'fora' && (!e || e.fase === 'encerrada')) {
    const h = habilidade(v, mod.d);
    const testes = v.fatos[`testes_amador_${mod.d}`] ?? 0;
    const ultima = v.caminhos.ultimas[`amador_${mod.d}`];
    // Só quem já joga acima do que o estadual pede chama atenção (a régua de titular de um clube pequeno, não a de uma base).
    // Depois dos 24, ser visto sem pedir pede jogar claramente acima do estadual (não só no limite dele).
    if (h >= barraDeTitular(mod.d, 1) - 1 + (i > 24 ? 4 : 0) && testes < 2 && (ultima === undefined || v.t - ultima >= 24) && !v.caminhos.oportunidades.some(o => o.atividade === 'amador')) {
      // Poucos são vistos: o auxiliar não vai a todo jogo, e o time de cima de um clube pequeno quase sempre já está fechado.
      // Depois dos 24, cada ano a menos de carreira pela frente pesa no olhar de quem contrata.
      const chance = clamp((h - barraDeTitular(mod.d, 1) + 2) / 36, 0, 0.25) * (mod.nivel >= 3 ? 1 : 0.7) * (0.7 + estruturaEsportiva(v.moradia.municipioId) * 0.15) * fatorDaIdadeAmadora(i);
      if (r.chance(chance)) {
        const lugar = ondeTreina(v, mod.d);
        const clube = clubeAmador(v, mod.d, lugar);
        v.fatos[`testes_amador_${mod.d}`] = testes + 1;
        const porta = portaAmadora(mod.d);
        const quem = porta.quem;
        const individual = individualComEquipe(mod.d);
        novaOportunidade(v, {
          tipo: mod.d === 'futebol' ? 'peneira' : 'seletiva', dominio: mod.d, municipioId: lugar, meses: 12, chave: `amador_${mod.d}`, atividade: 'amador', clube,
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
  if (e.fase === 'base') anoNaBase(v, r, e, presenca[e.modalidade] ?? 1);
  else if (e.fase === 'profissional') anoProfissional(v, r, e);
}

/**
 * As modalidades em que a competição de adultos é porta (a várzea, a liga amadora, a prova aberta, o torneio
 * aberto). FIX final da generalização: o atletismo (quem corre e arremessa em prova aberta é visto pela marca) e a
 * luta (o torneio aberto) entraram. A natação não (o auge é cedo: quem não nadou base não chega ao adulto), e o
 * tênis também não (não há "time de cima": o caminho é o ranking, desde o juvenil).
 */
export const MODALIDADES_AMADORAS: Dominio[] = ['futebol', 'basquete', 'volei', 'atletismo', 'lutas', 'futsal'];
/** REWORK 9.7 · FUT-02: a idade da porta amadora (o teste no time de cima de um clube pequeno). */
export const IDADE_AMADOR: [number, number] = [17, 30];
/**
 * O quanto a idade estreita a porta amadora (ser visto sem pedir): inteira até os 24; depois, pouco mais da metade e
 * menos a cada ano (aos 30, 10%). Antes, fechava de uma vez aos 24.
 */
export const fatorDaIdadeAmadora = (i: number) => (i <= 24 ? 1 : Math.max(0.1, 0.6 - (i - 25) * 0.1));

/** O clube pequeno que olha o campeonato amador: no futebol, um clube regional do estado; nos outros, a equipe da cidade. */
export function clubeAmador(v: Vida, d: Dominio, lugar: string): string {
  if (d !== 'futebol') return equipeDaModalidade(d, lugar);
  const uf = municipio(lugar).uf;
  const lista = clubesDoPais().filter(c => c.porte === 'regional' && municipio(c.cidade).uf === uf);
  const regionais = lista.length ? lista : clubesDoPais().filter(c => c.porte === 'regional');
  // VIDA 28: o time de cima de um clube que acabou de dispensar a pessoa da base não é quem a "descobre" no amador.
  const fora = new Set(clubesQueDispensaram(v, d).map(x => x.clube));
  const todos = regionais.filter(c => !fora.has(c.nome)).length ? regionais.filter(c => !fora.has(c.nome)) : regionais;
  // REWORK 9.7: com a mistura final (sem ela, o mesmo clube voltava no ano seguinte quase metade das vezes).
  return todos[Math.floor(hashMisturado(`${v.id}:amador:${v.t}`) * todos.length) % todos.length].nome;
}

/**
 * Passou no teste do time de cima (a rota amadora): a carreira começa sem
 * base — o clube pequeno oferece o contrato (a decisão `esp_contrato`).
 */
export function entrarPeloAmador(v: Vida, d: Dominio, municipioId: string, clube: string): void {
  arquivarCarreiraEsportiva(v);
  const cidade = d === 'futebol' ? clubePorNome(clube)?.cidade ?? municipioId : municipioId;
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
  // VIDA 28: a base também é carreira (os anos de formação, a dispensa): quem tenta outro clube não apaga a primeira.
  if (!antiga || antiga.fase !== 'encerrada' || (!(antiga.temporadas?.length) && !antiga.selecao && !(antiga.formacao?.length))) return;
  const lista = (v.caminhos.carreirasEsportivas ??= []);
  if (!lista.includes(antiga)) lista.push(antiga);
  if (lista.length > 4) lista.splice(0, lista.length - 4);
}

/** Todas as carreiras esportivas da vida (as arquivadas e a de agora), em ordem. */
export const carreirasEsportivas = (v: Vida): CarreiraEsportiva[] => [...(v.caminhos.carreirasEsportivas ?? []), ...(v.caminhos.esporte ? [v.caminhos.esporte] : [])];

/**
 * VIDA 28 · os clubes que dispensaram esta pessoa nos últimos anos (na modalidade): a carreira arquivada e a de agora,
 * se acabou em dispensa. O teste seguinte procura OUTRO clube; e, se for o mesmo, a História diz que é uma volta.
 */
export function clubesQueDispensaram(v: Vida, d: Dominio, anos = 4): { clube: string; idade: number; t: number }[] {
  return carreirasEsportivas(v).filter(c => c.modalidade === d && c.motivoFim === 'dispensa' && c.tFim !== undefined && v.t - c.tFim <= anos * 12)
    .map(c => ({ clube: c.clube, idade: Math.floor((c.tFim! - v.eu.tNasc) / 12), t: c.tFim! }));
}

/** O clube de uma peneira: o da cidade (`nomeDeClube`), evitando o que acabou de dispensar — quando a cidade tem outro. */
export function clubeDaPeneira(v: Vida, lugar: string, semente: string, d: Dominio): string {
  const fora = new Set(clubesQueDispensaram(v, d).map(x => x.clube));
  let nome = nomeDeClube(lugar, semente, d);
  for (let k = 1; k <= 6 && fora.has(nome); k++) nome = nomeDeClube(lugar, `${semente}:outro${k}`, d);
  return nome;
}

/**
 * VIDA 28 · onde fica a próxima peneira de quem foi dispensado há pouco: na cidade de sempre, num clube que não seja o
 * que dispensou; se a cidade só tem aquele clube (Marília só tem o Marília), na capital do estado. Sem outro clube no
 * caminho, nenhuma peneira neste ano (`undefined`): o clube que acabou de mandar embora não chama de volta no mesmo ano.
 */
export function portaDaPeneira(v: Vida, lugar: string, semente: string, d: Dominio): { lugar: string; clube: string } | undefined {
  const recentes = new Set(clubesQueDispensaram(v, d, 2).map(x => x.clube));
  const aqui = clubeDaPeneira(v, lugar, semente, d);
  if (!recentes.has(aqui)) return { lugar, clube: aqui };
  const capital = capitalDoEstado(lugar);
  if (capital !== lugar) { const la = clubeDaPeneira(v, capital, semente, d); if (!recentes.has(la)) return { lugar: capital, clube: la }; }
  return undefined;
}

export function entrarNaBase(v: Vida, d: Dominio, municipioId: string, clube: string): void {
  // VIDA 28: voltar ao clube que dispensou é uma volta — a História diz (a dispensa não some, e não é "entrou" de novo).
  const dispensas = clubesQueDispensaram(v, d, 8);
  const voltou = dispensas.find(x => x.clube === clube);
  const antes = dispensas[dispensas.length - 1];
  arquivarCarreiraEsportiva(v);
  v.caminhos.esporte = { modalidade: d, fase: 'base', clube, nivel: 1, tInicio: v.t, tFase: v.t, lesoes: 0, municipioId };
  const rot = v.rotinas.find(x => x.id === d);
  if (rot) rot.nivel = 3; else v.rotinas.push({ id: d, tInicio: v.t, nivel: 3 });
  const longe = municipioId !== v.moradia.municipioId;
  const texto = voltou ? `Voltou para ${aEquipe(d, clube)}, que tinha dispensado você aos ${voltou.idade}: passou de novo pelo teste, e desta vez ficou.` : antes ? `Depois da dispensa ${doClube(antes.clube)}, aos ${antes.idade}, uma nova chance: entrou para ${aEquipe(d, clube)}${longe ? `, em ${municipio(municipioId).nome}` : ''}.` : `Entrou para ${aEquipe(d, clube)}${longe ? `, em ${municipio(municipioId).nome}: alojamento durante a semana, casa nos domingos` : ''}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'lazer', tom: 'bom', escolha: true });
  marcar(v, 'ingresso', texto, 3, { dominio: d });
  for (const p of pais(v)) lembrarCom(v, p.id, `${d === 'futebol' ? 'A base' : 'A equipe'} ${doClube(clube)}.`, 'escola', 2);
}

/** VIDA 25 · o nome da competição da categoria (o estadual da categoria no Brasil; o regional fora; o circuito juvenil). */
function competicaoDaBase(e: CarreiraEsportiva, categoria: string): string {
  const br = paisDaCidade(e.municipioId) === 'BR';
  if (e.modalidade === 'tenis') return 'circuito juvenil de tênis';
  if (e.modalidade === 'futebol' || e.modalidade === 'futsal') return `${br ? 'campeonato estadual' : 'campeonato regional'} ${categoria}${e.modalidade === 'futsal' ? ' de futsal' : ''}`;
  return `${br ? 'campeonato estadual' : 'campeonato regional'} de base de ${NOME_MOD[e.modalidade] ?? e.modalidade}`;
}

/**
 * VIDA 25 · O ANO NA FORMAÇÃO, registrado: a categoria, a competição, os jogos (titular ou não), o que se produziu, a
 * nota, a técnica no fim do ano, onde a equipe (ou o atleta) terminou, o título e a avaliação da comissão. É a mesma
 * conta da técnica contra a régua do contrato que decide contrato e dispensa — a tela da formação mostra estes números.
 * Sorteio derivado (`rngDe`): o ano da base não muda a sequência do resto da vida.
 */
function registrarAnoDeFormacao(v: Vida, e: CarreiraEsportiva, h: number, presenca: number): { a: AnoDeFormacao; leitura: LeituraDoJovem; podeContrato: boolean; subiu: NovaEntrada[] } {
  const i = idade(v);
  const ano = anoDe(v.t - 6);
  const rr = rngDe(v.id, 'formacao25', e.modalidade, ano);
  const categoria = categoriaDaBase(v, e);
  const { tecnica: limiar } = contratoDaBase(e.modalidade);
  // A régua da base é a do contrato, mais baixa nos mais novos (o sub-15 não é cobrado como o sub-20).
  // VIDA 26: quem joga acima da idade é medido contra a categoria em que joga (dois anos a mais).
  const iCat = e.adiantado26 !== undefined && (e.modalidade === 'futebol' || e.modalidade === 'futsal') ? i + 2 : i;
  const regua = limiar - Math.max(0, 18 - iCat) * 2.2;
  const nota = Math.round(clamp(6 + (h - regua) / 4 + (v.corpo.forma - 65) / 25 + rr.normal() * 0.6, 2.5, 9.6) * 10) / 10;
  const individual = individualComEquipe(e.modalidade) || e.modalidade === 'tenis';
  const max = e.modalidade === 'futebol' ? (i <= 15 ? 18 : i <= 17 ? 22 : 26) : e.modalidade === 'futsal' ? 20 : e.modalidade === 'tenis' ? 10 : individual ? 8 : 16;
  const fora = mesesForaNoAno(v);
  const disp = clamp((12 - fora) / 12 * presenca, 0, 1);
  const espacoBom = h >= regua - 3;
  const jogos = Math.max(0, Math.round(max * disp * (espacoBom ? 0.9 : 0.55) * (0.9 + rr.next() * 0.15)));
  const titular = individual ? jogos : Math.min(jogos, Math.round(jogos * clamp(0.25 + (h - regua + 6) / 14, 0.1, 0.95)));
  const peso = (titular + (jogos - titular) * 0.35) * Math.max(0.25, nota / 6.5);
  const a: AnoDeFormacao = { ano, idade: i, categoria, clube: e.clube, competicao: competicaoDaBase(e, categoria), jogos, titular, nota, tecnica: Math.round(h * 10) / 10, colocacao: 0, participantes: 0, avaliacao: '' };
  if (e.modalidade === 'futebol') {
    const pos = e.posicao ?? posicaoSugerida(v);
    a.papel = nomePosicao(v, pos);
    a.gols = Math.round(peso * GOL[pos] * (0.75 + rr.next() * 0.5));
    a.assistencias = Math.round(peso * ASSIST[pos] * (0.75 + rr.next() * 0.5));
  } else if (e.modalidade === 'futsal') {
    a.gols = Math.round(peso * 0.4 * (0.75 + rr.next() * 0.5));
    a.assistencias = Math.round(peso * 0.25 * (0.75 + rr.next() * 0.5));
  } else if (e.modalidade === 'basquete') {
    a.papel = NOME_FUNCAO[funcaoBasquete(v)];
    a.pontos = Math.round(clamp((nota - 3) / 5, 0.1, 1.4) * 11 * (0.85 + rr.next() * 0.3) * 10) / 10;
  } else if (e.modalidade === 'volei') a.papel = NOME_FUNCAO_VOLEI[funcaoVolei(v)];
  else if (e.modalidade === 'lutas') a.papel = `categoria ${categoriaDeLuta(v)}`;
  else if (e.modalidade === 'natacao' || e.modalidade === 'atletismo') a.papel = provaDe(v, e.modalidade)?.nome;
  if (individual) {
    a.participantes = e.modalidade === 'tenis' ? 32 : 12;
    a.colocacao = Math.round(clamp(9 - (nota - 5) * 2.2 + rr.normal() * 1.3, 1, a.participantes));
    if (e.modalidade !== 'tenis') a.podios = jogos ? Math.max(0, Math.round(jogos * clamp((nota - 5.5) / 5, 0, 0.8))) : 0;
  } else {
    a.participantes = e.modalidade === 'futebol' ? 16 : 10;
    // A força da equipe de base: a do clube (o grande forma mais) e a contribuição de quem joga.
    const porte = e.modalidade === 'futebol' ? divisaoDoClube(v, e.clube, paisDaCidade(e.municipioId)) : 2;
    const contrib = (nota - 6) * (titular / Math.max(1, max));
    a.colocacao = Math.round(clamp(a.participantes / 2 + 0.5 - (porte - 2) * 2.2 - contrib * 2.5 + rr.normal() * 2.6, 1, a.participantes));
  }
  a.titulo = a.colocacao === 1 && jogos > 0;
  // VIDA 26 · a comissão separa capacidade atual, potencial e prontidão (`jovemAtleta`) — e as etapas: jogar acima da
  // idade, treinar com o elenco profissional, o contrato. Nada disso sai do sorteio principal (`rr`).
  const pos26 = e.modalidade === 'futebol' ? (e.posicao ?? posicaoSugerida(v)) : undefined;
  const perfil = perfilDeAtributos(v, e, h, pos26, e.modalidade === 'basquete' ? funcaoBasquete(v) : undefined);
  const lista = (e.formacao ??= []);
  const anterior = lista[lista.length - 1];
  lista.push(a);
  const leitura = lerJovem(v, e, h, perfil, limiar);
  const { idade: idadeContrato } = contratoDaBase(e.modalidade);
  const porCategoria = e.modalidade === 'futebol' || e.modalidade === 'futsal';
  // VIDA 28: as etapas da formação (a categoria de cima, o treino com o elenco profissional) só são contadas depois que o
  // ano se decide (`anoNaBase`): quem é dispensado no fim da temporada não "sobe" na mesma frase — e o clube que acabou
  // de promover alguém não o dispensa sem motivo (a dispensa ouve a comissão: `riscoDeDispensa`).
  const subiu: NovaEntrada[] = [];
  // A promoção antecipada (rara): destaque claro na categoria, técnica para a régua de quem tem dois anos a mais e o
  // corpo não muito atrás. Fica para os anos seguintes (a categoria de cima); o físico é cobrado lá.
  if (porCategoria && e.adiantado26 === undefined && i <= 16 && nota >= 7.8 && h >= limiar - Math.max(0, 16 - i) * 2.2 && leitura.partes.fisico >= 40 && rr.chance(0.55)) {
    e.adiantado26 = v.t;
    a.acima = categoriaDaBase(v, e);
    subiu.push({ texto: `Aos ${i}, subiu para o ${a.acima} ${doClube(e.clube)}: a comissão quis ver o que fazia contra quem tem dois anos a mais.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
  }
  // A integração gradual: treinar com o elenco profissional (16+), antes de qualquer contrato.
  const comElenco = perfilDe(e.modalidade).estrutura === 'clube';
  if (comElenco && e.integracao26 === undefined && i >= 16 && h >= limiar - 3 && leitura.prontidao >= 62 && rr.chance(0.6)) {
    e.integracao26 = v.t;
    a.acima ??= 'profissional';
    subiu.push({ texto: `Começou a treinar com o elenco profissional ${doClube(e.clube)}, ainda sem contrato: alguns treinos por semana, o resto na categoria.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
  }
  const podeContrato = prontoParaContrato(i, idadeContrato, h, limiar, leitura);
  a.capacidade = leitura.capacidade;
  a.prontidao = leitura.prontidao;
  a.potencial = leitura.potencial;
  a.avaliacao = avaliacaoDaComissao(a, leitura, h, limiar, podeContrato, anterior, individual);
  if (lista.length > 15) lista.splice(0, lista.length - 15);
  // A promoção de categoria (o sub-15 que vira sub-17) é um acontecimento da formação — dito uma vez. É a categoria em
  // que a temporada foi jogada (a idade a pôs lá no começo do ano): vem antes do título e de qualquer desfecho do ano.
  if (anterior && anterior.categoria !== categoria && anterior.clube === e.clube && (e.modalidade === 'futebol' || e.modalidade === 'futsal')) {
    escrever(v, { texto: `Subiu para o ${categoria} ${doClube(e.clube)}${a.titular >= a.jogos * 0.6 ? ', direto para o time titular da categoria' : ''}.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom', chave: `categoria:${e.clube}:${categoria}` });
  }
  if (a.titulo) {
    const texto = individual ? `Venceu ${e.modalidade === 'tenis' ? 'o ranking do circuito juvenil' : `o ${a.competicao}`} em ${ano}` : `Campeão do ${a.competicao}, ${peloClube(e.clube)}`;
    escrever(v, { texto: `${texto}${individual ? '' : `: ${a.titular >= a.jogos * 0.6 ? 'titular no time campeão' : 'no elenco campeão'}`}.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
    registrarConquista(v, { tipo: 'titulo', modalidade: e.modalidade, ano, competicao: a.competicao, clube: individual ? undefined : e.clube, papel: individual || a.titular >= a.jogos * 0.6 ? 'protagonista' : 'elenco', texto: `${texto} (formação)` });
  }
  // A fotografia do perfil também no fim de cada ano de base: a ficha mostra a evolução desde a formação.
  fotografarAtributos(e, ano, perfil, h);
  return { a, leitura, podeContrato, subiu };
}

/**
 * VIDA 28 · o risco de dispensa no fim do ano de base. Antes era só a técnica (e as lesões, as faltas, a idade): o
 * titular com nota 8 que acabara de subir de categoria era dispensado na mesma temporada, um ano em cada dez — e a
 * História dizia as duas coisas. Agora a comissão pesa o que viu no ano: a nota, a titularidade, o potencial que ela
 * mesma leu. Quem foi promovido neste ano (a categoria de cima, o elenco profissional) não sai no mesmo ano.
 */
export function riscoDeDispensa(base: number, a: Pick<AnoDeFormacao, 'nota' | 'jogos' | 'titular'>, potencial: number, promovidoNoAno: boolean): number {
  if (promovidoNoAno) return 0;
  const nota = a.nota >= 7.5 ? 0.25 : a.nota >= 6.8 ? 0.55 : a.nota >= 6 ? 0.85 : 1.15;
  const titular = a.jogos > 0 && a.titular >= a.jogos * 0.6 ? 0.7 : 1;
  const aposta = potencial >= 75 ? 0.7 : 1;
  return clamp(base * nota * titular * aposta, 0, 0.95);
}

function anoNaBase(v: Vida, r: Rng, e: CarreiraEsportiva, presenca = 1): void {
  const i = idade(v);
  const h = habilidade(v, e.modalidade);
  const anos = (v.t - e.tFase) / 12;
  // VIDA 25: o ano da formação fica registrado (jogos, titularidade, números, nota, colocação, título, avaliação).
  const { a, leitura, podeContrato, subiu } = registrarAnoDeFormacao(v, e, h, presenca);
  // VIDA 28: a bolsa do ano de base (a partir dos 14; o valor do clube), paga mês a mês — somada aqui, no fim do ano.
  const bolsa = bolsaDaBase(v, e);
  if (bolsa > 0) {
    v.financas.conta += bolsa * 12;
    lancar(v, `Bolsa da base (${e.clube})`, 'renda', bolsa * 12);
    a.bolsa = bolsa;
    if (!temFato(v, `bolsa_base_${e.clube}`)) { marcarFato(v, `bolsa_base_${e.clube}`); escrever(v, { texto: `${cap(oClube(e.clube))} passou a pagar uma bolsa de ${dinheiro(bolsa)} por mês: não é salário de jogador, é ajuda para quem ainda está em formação.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom' }); }
  }
  // VIDA 28: as etapas do ano (a categoria de cima, o elenco profissional) entram na História quando o ano não termina em dispensa.
  const contarEtapas = () => { for (const x of subiu) escrever(v, x); };
  // REWORK 10 · ROT-05: quem concilia a base com a faculdade ou o trabalho e perde treinos (a agenda diz quantos) é visto
  // faltando — o treino que não aconteceu não treinou (`rotinas`), e a comissão repara: a dispensa fica mais provável.
  const faltas = Math.max(0, 1 - presenca);
  if (faltas >= 0.1) escrever(v, { texto: `Perdeu ${faltas >= 0.5 ? 'metade ou mais' : 'parte'} dos treinos ${doClube(e.clube)} no ano: a semana não deixou. A comissão técnica reparou.`, relevancia: 'cotidiano', tema: 'lazer', tom: 'ruim' });
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
  // REWORK 10 · FUT-03: no futebol, quem chega ao fim da base QUASE lá (até 5 pontos abaixo da régua) também pode ter
  // contrato — curto, de divisão de baixo (o clube do tamanho do jogo dele, `profissionalizar`). Antes, abaixo da régua,
  // a porta era nenhuma: o bom jogador de 76 aos 20 só tinha a dispensa. A chance é pequena e cresce com a técnica.
  const quaseLa = e.modalidade === 'futebol' && i >= idadeContrato[1] - 1 && i <= idadeContrato[1] && h < limiar && h >= limiar - 5;
  // VIDA 26: a técnica sozinha não basta — a prontidão (físico, experiência, cabeça) e a idade (Lei 14.597/2023, art. 99:
  // contrato a partir dos 16; aos 16, só o excepcional) decidem se a proposta pode vir. Quem já treina com o elenco
  // profissional está mais perto dela.
  const integrado = e.integracao26 !== undefined ? 1.35 : 1;
  const prontidaoPesa = clamp(0.6 + (leitura.prontidao - 55) / 60, 0.5, 1.3);
  // ERAS v4: antes do profissionalismo no país (o futebol brasileiro até 1933, o inglês desde sempre, o japonês até a
  // J.League de 1993...), não há contrato: o esporte é amador, joga-se pelo clube e vive-se de outro trabalho.
  const amadorAte = ocupacaoAindaNaoExiste(v, ocupacaoDaModalidade(e.modalidade));
  if (amadorAte !== undefined && podeContrato && !temFato(v, 'v4_amador')) {
    marcarFato(v, 'v4_amador');
    escrever(v, { texto: `Era bom o bastante para o time de cima — mas, em ${anoDe(v.t)}, ${NOME_MOD[e.modalidade] ?? 'o esporte'} ainda era amador no país (o profissionalismo só viria por volta de ${amadorAte}). Jogava-se pela camisa, e vivia-se de outro trabalho.`, relevancia: 'biografia', tema: 'trabalho', tom: 'neutro', fato: { tipo: 'era', dados: { categoria: 'esporte', evento: `amador:${e.modalidade}` } } });
  }
  if (amadorAte === undefined && (podeContrato ? r.chance(clamp((h - limiar + 2) / 16 * integrado * prontidaoPesa, 0.08, 0.7)) : quaseLa && r.chance(clamp((h - limiar + 6) / 30, 0.03, 0.2)))) {
    // O tenista sem ranking não entra direto nos torneios grandes: começa no nacional ou na entrada internacional.
    const nivel = e.modalidade === 'tenis' ? circuitoDeEstreia(h) : nivelPelaHabilidade(h);
    novaOportunidade(v, {
      tipo: 'convite', ocupacaoId: ocupacaoDaModalidade(e.modalidade), dominio: e.modalidade, meses: 12, chave: 'contrato_esporte',
      titulo: e.modalidade === 'tenis' ? 'Virar profissional' : 'Contrato profissional',
      texto: e.modalidade === 'tenis' ? 'Os resultados do circuito juvenil chamaram atenção: dá para virar profissional. Sem clube e sem salário — o que entra é a premiação, e treinador e viagens passam a ser seus.' : e.modalidade === 'basquete' ? `${cap(oClube(e.clube))} ofereceu contrato para o time adulto: uma temporada, salário de atleta, lugar no elenco${nivel >= 3 ? ' do NBB' : ''}.` : e.modalidade === 'futebol' ? `${cap(oClube(e.clube))} ofereceu o primeiro contrato profissional${nivel > divisaoDoClube(v, e.clube, paisDaCidade(e.municipioId)) ? ' — e há sondagem de um clube maior' : ''}. Salário de verdade, prazo de dois anos.` : `A equipe ofereceu contrato de atleta profissional, com salário e calendário de competições.`,
      bonus: nivel
    });
    contarEtapas();
    return;
  }
  // Dispensa: o destino da maioria.
  // REWORK 10 · FUT-03: a dispensa olha mais para o nível — o fraco sai mais cedo, o bom fica mais (antes, quem tinha 75
  // saía um ano em cada três, e quase nenhum bom jogador chegava à idade do contrato).
  const base = clamp(0.38 - (h - 72) / 28 + e.lesoes * 0.05 + (i > idadeContrato[1] ? 0.5 : 0) + faltas * 0.35, 0.1, 0.95);
  // Passou da idade do contrato sem contrato: a base acaba, por melhor que tenha sido o ano (não há categoria acima do sub-20).
  const promovido = subiu.length > 0 && i <= idadeContrato[1];
  const risco = i > idadeContrato[1] ? base : riscoDeDispensa(base, a, (leitura.potencial[0] + leitura.potencial[1]) / 2, promovido);
  if (anos >= 1 && r.chance(risco)) {
    // A etapa que o ano prometeu e a dispensa não convivem: a ficha da formação guarda o desfecho.
    if (e.adiantado26 === v.t) { e.adiantado26 = undefined; a.acima = undefined; }
    if (e.integracao26 === v.t) { e.integracao26 = undefined; a.acima = undefined; }
    a.desfecho = 'dispensa';
    encerrarCarreira(v, e, 'dispensa');
    return;
  }
  contarEtapas();
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
      transferirPara(v, e, p, true);
      // O clube é de outra cidade: a vida vai junto (quem mora na casa também — a mesma regra de toda mudança).
      if (p.municipioId !== v.moradia.municipioId) { emp.municipioId = p.municipioId; mudarAgora(v, p.municipioId, `para jogar ${noClube(p.clube)}`); }
      creditarLuvas(v, p);
    }
    else { e.nivel = e.modalidade === 'futebol' ? divisaoDoClube(v, e.clube, paisDaCidade(e.municipioId)) : Math.max(1, Math.min(4, nivel)) as 1 | 2 | 3 | 4; e.espaco = 'reserva'; assinarContrato(v, e, 12); }
    const texto = e.modalidade === 'futebol' ? `Voltou a jogar: assinou com ${oClube(e.clube)}, aos ${idade(v)}.` : `Voltou a competir, aos ${idade(v)}.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
    return;
  }
  e.fase = 'profissional';
  e.tFase = v.t;
  // O primeiro contrato é com o clube da base, na divisão em que ELE joga (REWORK 9: a tabela do país). Nos
  // outros esportes, a divisão que a técnica alcança.
  e.nivel = Math.max(1, Math.min(4, nivel)) as 1 | 2 | 3 | 4;
  // Quem está dois degraus abaixo da divisão do clube não tem lugar no time de cima: começa num clube do tamanho do
  // próprio jogo (o mesmo estado, de preferência) — e a biografia diz isso. Um degrau abaixo, sobe para o elenco e briga.
  const daBase = e.clube;
  if (e.modalidade === 'futebol') {
    const pais = paisDaCidade(e.municipioId);
    const div = divisaoDoClube(v, e.clube, pais);
    if (e.nivel < div - 1) {
      const lista = clubesNaDivisao(v, e.nivel, e.clube, pais);
      const uf = municipio(v.moradia.municipioId).uf;
      const perto = lista.filter(c => municipio(c.cidade).uf === uf);
      const alvo = (perto.length ? perto : lista)[Math.floor(hash(`${v.id}:primeiro`) * (perto.length || lista.length)) % (perto.length || lista.length)];
      if (alvo) { e.clube = alvo.nome; e.municipioId = alvo.cidade; }
    }
    e.nivel = divisaoDoClube(v, e.clube, paisDaCidade(e.municipioId));
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
  const texto = e.modalidade === 'tenis' ? `Virou tenista profissional aos ${idade(v)}, no ${CIRCUITO_TENIS[e.nivel]}: sem clube, sem salário, a raquete e o ranking.` : e.modalidade === 'basquete' ? `Assinou o primeiro contrato de ${NOME_FUNCAO[funcaoBasquete(v)]} ${peloClube(e.clube)}, aos ${idade(v)}${e.origem === 'amador' ? ', vindo da liga amadora' : ''}.` : e.modalidade === 'futebol' ? `Assinou o primeiro contrato profissional de jogador, ${peloClube(e.clube)}, aos ${idade(v)}${outroClube}.` : `Virou atleta profissional de ${nomeDaModalidade(v, e.modalidade)}, ${peloClube(e.clube)}, aos ${idade(v)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, 'profissional', texto, 3, { dominio: e.modalidade, ocupacaoId: oc.id });
  ecoNasRelacoes(v, 'contrato', `Comemorou com você o primeiro contrato profissional, ${e.modalidade === 'tenis' ? 'no circuito' : peloClube(e.clube)}, aos ${idade(v)}.`, 3);
  registrarConquista(v, { tipo: 'marco', modalidade: e.modalidade, ano: anoDe(v.t), competicao: divisaoDe(e.modalidade, e.nivel, paisDaCidade(e.municipioId)), clube: e.modalidade === 'tenis' ? undefined : e.clube, texto: `Primeiro contrato profissional, aos ${idade(v)}` });
  marcarFato(v, 'atleta_profissional');
  montarElenco(v, e);
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
        novaOportunidade(v, { tipo: 'convite', ocupacaoId: ocupacaoDaModalidade(e.modalidade), dominio: e.modalidade, meses: 12, chave: 'volta_clube', titulo: 'Um clube ligou', texto: `Depois de meses treinando por conta, ${quem} fez proposta${p ? ` (${divisaoDe(e.modalidade, p.nivel, paisDaCidade(p.municipioId))})` : ''}. Salário ${oferta < e.nivel ? 'menor' : 'parecido'}, contrato curto.`, bonus: nivel });
        return;
      }
      if (v.t - desde >= 12) { delete v.fatos['esp_sem_clube']; encerrarCarreira(v, e, 'sem_contrato'); }
      return;
    }
    // REWORK 11 · sem clube (A1 item 4): outro trabalho no lugar do contrato é o fim da carreira — com biografia, marca e
    // o fato de "sem clube" resolvido (antes: a fase mudava à mão, sem texto).
    delete v.fatos['esp_sem_clube'];
    encerrarCarreira(v, e, 'escolha');
    return;
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
  const lesao = (0.07 + Math.max(0, i - 26) * 0.012) * (forcar ? 1.6 : preservar ? 0.6 : 1) * (e.doping ? 1.3 : 1) * (e.modalidade === 'futebol' ? RISCO_POSICAO[pos] : e.modalidade === 'futsal' ? PRODUCAO_FUTSAL[funcaoFutsalDe(v, e)].risco : RISCO_MODALIDADE[e.modalidade] ?? 1) * fatorDeRiscoFisico(v) * (atual?.lesao.cuidado === 'sacrificio' ? 1.4 : 1) * (v.fatos['oficio:fisico'] !== undefined && v.t - v.fatos['oficio:fisico'] < 12 ? 1.15 : 1);
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
  pagarBonusDaTemporada(v, e, t);
  // VIDA 28: o título na memória de quem é próximo (as conversas lembram; quem gosta admira; o rival reconhece).
  { const tit = bonusDaTemporada(e, t, 1).motivos; if (tit.length) ecoNasRelacoes(v, 'titulo', `Comemoraram juntos ${listaNatural(tit)}, ${peloClube(e.clube)}, em ${t.ano}.`, 2); }
  // VIDA 28: a janela do ano no clube (o elenco com nome; o mercado anda sozinho, pelas regras da modalidade).
  const papel28 = e.modalidade === 'futebol' ? posicaoDe(v, e) : e.modalidade === 'basquete' ? funcaoBasquete(v) : e.modalidade === 'volei' ? funcaoVolei(v) : funcaoFutsalDe(v, e);
  janelaDoElenco(v, e, { regua: barraDeTitular(e.modalidade, e.nivel), papel: papel28, salarioBase: salarioBaseDoElenco(v, e) });
  capitaniaDoClube(v, e, t);
  processarSelecao(v, r, e, t);
  // HOTFIX 11.5.1: os prêmios individuais do mundo (Bola de Ouro, The Best, Chuteira de Ouro, Golden Boy), depois da
  // seleção — o título dela no ano conta.
  if (e.modalidade === 'futebol') premiosDoMundo(v, e, t);
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
  // MUNDO: quem brilha na elite chama a atenção de fora — uma liga de outro país (a Europa, a volta para casa). A decisão
  // sai de um hash do ano (sem gastar o gerador: quem não está na elite vive igual), pela reputação e pela temporada.
  // VIDA 25 · BAL: a liga de fora pede regularidade (duas temporadas boas) e idade de quem ainda tem anos pela frente; a
  // chance é menor (antes, 35% ao ano com uma temporada de 6,3). Da segunda divisão nacional, só os mercados
  // alternativos olham — e só quem se destaca.
  const foraOk = e.modalidade === 'futebol' && !propostaNaMesa(v) && i <= 31 && (e.nivel === 4 ? temporadasBoas(e, 6.6) : e.nivel === 3 && t.nota >= 7.6 && (e.reputacao ?? 0) >= 45);
  if (foraOk && hash(`${v.id}:${v.t}:exterior`) < Math.min(0.16, Math.max(0, ((e.reputacao ?? 30) - 48) / 110))
    && criarProposta(v, e, 4, 'exterior')) { v.fatos['esp_proposta_hoje'] = v.t; return; }
  // O mercado reage à temporada: um clube maior pergunta (a resposta é sua: `esp_proposta`).
  const oferta = nivelQueOMercadoOferece(v, e);
  // A proposta nasce aqui, concreta (clube, cidade, salário), e fica na mesa até a resposta (`criarProposta`).
  // VIDA 25 · BAL (futebol): subir para a elite pede regularidade (duas temporadas de 6,8 ou uma de 7,8), não um ano
  // bom; a idade pesa (o clube de cima aposta menos em quem passou dos 30); e a vaga é de uma posição — nem todo clube que
  // olha precisa da sua (o sorteio derivado da posição e do ano).
  const subirOk = e.modalidade !== 'futebol' || e.nivel + 1 < 4 || t.nota >= 7.8 || temporadasBoas(e, 6.8);
  const vagaNaPosicao = e.modalidade !== 'futebol' || hash(`${v.id}:${v.t}:vaga:${posicaoDe(v, e)}`) < 0.7;
  if (oferta > e.nivel && e.nivel < 4 && t.nota >= 6.6 && subirOk && vagaNaPosicao && r.chance(e.modalidade === 'futebol' && e.nivel + 1 === 4 ? (i >= 30 ? 0.15 : 0.3) : i >= 30 ? 0.25 : 0.45) && criarProposta(v, e, (e.nivel + 1) as 1 | 2 | 3 | 4, 'mercado')) v.fatos['esp_proposta_hoje'] = v.t;
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
  // VIDA 28: o perfil pesa na régua do treinador (o Capitão e o Incansável ganham a confiança; o Marrento a gasta).
  const confianca = efeitosDoPerfil(e.perfil28).titularidade + concorrenciaNaPosicao(v, e, papel28, h);
  e.espaco = h + (t.nota - 6) * 2.5 + conversa + confianca - passou * 1.2 >= barraDeTitular(e.modalidade, e.nivel) && !(lesaoAtiva(v)?.lesao.gravidade === 3) ? 'titular' : 'reserva';
  // VIDA 28: a vaga é disputada com alguém (o concorrente direto é uma pessoa): a troca de lugar acende a rivalidade.
  { const c = concorrenteNaPosicao(v, e, papel28); const vc = c?.pessoaId ? v.vinculos[c.pessoaId] : undefined; if (vc) { mexer28(vc, 'rivalidade', antes !== e.espaco ? 10 : 2); if (e.espaco === 'titular' && t.nota >= 7) mexer28(vc, 'respeito', 3); } }
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
      ficarSemClube(v, e);
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
  const texto = `O ano ${e.nivel === 1 ? 'nos' : 'no'} ${CIRCUITO_TENIS[e.nivel]}: ${t.vitorias} vitórias${t.titulos ? `, ${t.titulos} ${t.titulos === 1 ? 'título' : 'títulos'}` : ''}, ranking ${t.ranking}º. Prêmios de ${dinheiro(premio)}; treinador e viagens custaram ${dinheiro(custos)} — ${liquido >= 0 ? `sobraram ${dinheiro(liquido)}` : `faltaram ${dinheiro(-liquido)}`}.`;
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

/**
 * REWORK 11 · sem clube — o contrato acabou e ninguém renovou: o emprego acaba, a carreira não. A marca explícita
 * (`ultimoClube`) diz que não há clube agora (nenhuma tela mostra o antigo como atual); o mercado parte de lá.
 */
export function ficarSemClube(v: Vida, e: CarreiraEsportiva): void {
  v.fatos['esp_sem_clube'] = v.t;
  e.ultimoClube = { clube: e.clube, municipioId: e.municipioId, nivel: e.nivel, ate: v.t };
  e.espaco = undefined;
  e.contratoAte = undefined;
  e.capitao = undefined;
  if (v.trabalho.atual && OCUPACOES_DE_ATLETA.includes(v.trabalho.atual.ocupacaoId)) encerrarEmprego(v, 'fim do contrato');
}

/** O último clube de quem está sem clube agora (a marca explícita; nos saves de antes, o clube guardado). */
export function ultimoClubeDe(e: CarreiraEsportiva): { clube: string; municipioId: string; nivel: number; ate: number } | undefined {
  if (e.ultimoClube) return e.ultimoClube;
  return e.fase === 'profissional' && e.contratoAte === undefined && e.espaco === undefined && e.modalidade !== 'tenis' ? { clube: e.clube, municipioId: e.municipioId, nivel: e.nivel, ate: e.tFase } : undefined;
}

/** O clube de AGORA (nada, para quem está sem clube ou suspenso): o que as telas mostram como atual. */
export function clubeAtual(v: Vida, e: CarreiraEsportiva): string | undefined {
  if (e.fase !== 'profissional' || e.ultimoClube || (e.suspensoAte !== undefined && v.t < e.suspensoAte)) return undefined;
  if (!v.trabalho.atual || !OCUPACOES_DE_ATLETA.includes(v.trabalho.atual.ocupacaoId)) return undefined;
  return e.clube;
}

/**
 * Procurar clube sem clube (a ação do atleta): o empresário liga. Se o mercado ainda quer (pela última temporada e
 * pelo nome), vem uma proposta concreta — de divisão igual ou menor — e a decisão da porta (`volta_clube`); se não,
 * nada, e a frase diz por quê.
 */
export function procurarClube(v: Vida, r: Rng): { texto: string; proposta?: PropostaDeClube } {
  const e = v.caminhos.esporte!;
  const oferta = nivelQueOMercadoOferece(v, e);
  const chance = clamp((valorDeMercado(v, e) - 15) / 55, 0.1, 0.85);
  if (oferta < 1 || !r.chance(chance)) return { texto: oferta < 1 ? 'O empresário ligou para meia dúzia de clubes. Ninguém quis: a última temporada e a idade pesaram.' : 'Duas sondagens, nenhuma proposta. O empresário pediu mais um tempo.' };
  e.proposta = undefined;
  const nivel = Math.max(1, Math.min(4, oferta, e.nivel)) as 1 | 2 | 3 | 4;
  const p = criarProposta(v, e, nivel, 'sem_clube');
  if (!p) return { texto: 'Uma sondagem, sem número. Ficou para depois.' };
  delete v.fatos['esp_sem_clube'];
  novaOportunidade(v, { tipo: 'convite', ocupacaoId: ocupacaoDaModalidade(e.modalidade), dominio: e.modalidade, meses: 12, chave: 'volta_clube', titulo: 'Um clube ligou', texto: `${e.modalidade === 'futebol' ? `${cap(oClube(p.clube))}, de ${municipio(p.municipioId).nome},` : 'Uma equipe'} fez proposta (${divisaoDe(e.modalidade, p.nivel, paisDaCidade(p.municipioId))}). Contrato curto, salário de quem volta.`, bonus: nivel });
  return { texto: `O telefone tocou: ${e.modalidade === 'futebol' ? oClube(p.clube) : 'uma equipe'} quer você. A proposta está nas suas portas.`, proposta: p };
}

/**
 * REWORK 11 · ESP-11.6 — capitão do clube: quem é titular há anos no mesmo clube, com nome e idade de liderar, um dia
 * recebe a braçadeira (o sorteio é da vida, não do gerador principal). Sai ao trocar de clube ou ficar sem clube.
 */
function capitaniaDoClube(v: Vida, e: CarreiraEsportiva, t: Temporada): void {
  if (e.capitao && e.capitao.clube === e.clube) { t.capitao = true; return; }
  if (!perfilDe(e.modalidade).coletivo || e.espaco !== 'titular' || idade(v) < 25 || (e.reputacao ?? 0) < 55) return;
  const seguidas = [...(e.temporadas ?? [])].reverse().findIndex(x => x.clube !== e.clube);
  if ((seguidas === -1 ? (e.temporadas ?? []).length : seguidas) < 3) return;
  if (rngDe(v.id, 'capitao', e.clube, t.ano).next() >= 0.3) return;
  e.capitao = { clube: e.clube, desde: v.t };
  t.capitao = true;
  const texto = `${flex(ge(v), 'Capitão', 'Capitã', 'Capitão')} ${doClube(e.clube)}: a braçadeira veio depois de ${seguidas === -1 ? (e.temporadas ?? []).length : seguidas} temporadas no clube.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  registrarConquista(v, { tipo: 'marco', modalidade: e.modalidade, ano: t.ano, competicao: 'capitania', clube: e.clube, texto: `${flex(ge(v), 'Capitão', 'Capitã', 'Capitão')} ${doClube(e.clube)}` });
  e.reputacao = clamp((e.reputacao ?? 30) + 1);
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
    // VIDA 28: a dispensa é o fato; desistir (ou não) é decisão depois dela (`esp_dispensa`) — a frase não decide pela pessoa.
    ? motivo === 'dispensa' ? e.modalidade === 'tenis' ? `A academia cortou a bolsa aos ${i}: sem ela, o circuito juvenil ficou caro demais.` : `${flex(g, 'Dispensado', 'Dispensada')} ${e.modalidade === 'futebol' ? 'da base' : 'da equipe'} ${doClube(e.clube)}, aos ${i}.` : `Deixou ${aEquipe(e.modalidade, e.clube)}, aos ${i}.`
    : motivo === 'lesao' ? `Encerrou a carreira aos ${i}, depois de lesões demais.` : motivo === 'sem_contrato' ? `Aos ${i}, ${perfilDe(e.modalidade).estrutura === 'clube' ? 'nenhum clube renovou' : perfilDe(e.modalidade).estrutura === 'equipe' ? 'nenhuma equipe renovou' : 'sem resultado nem patrocínio para seguir no circuito'}: a carreira de ${flex(g, 'atleta', 'atleta')} acabou sem despedida.` : (e.modalidade === 'tenis' ? `Guardou a raquete de competição aos ${i}.` : `Pendurou as chuteiras aos ${i}.`.replace('as chuteiras', e.modalidade === 'futebol' ? 'as chuteiras' : 'a carreira'));
  escrever(v, { texto, relevancia: 'marco', tema: eraPro ? 'trabalho' : 'lazer', tom: 'ruim' });
  marcar(v, eraPro ? 'fim_carreira' : 'fracasso', texto, 3, { dominio: e.modalidade });
  // VIDA 28: quem é próximo viveu isso junto (a dispensa traz quem é afável para perto; o fim da carreira fica na história).
  if (motivo === 'dispensa' || eraPro) ecoNasRelacoes(v, eraPro ? 'aposentadoria' : 'dispensa', eraPro ? `Esteve junto no fim da sua carreira ${e.modalidade === 'futebol' ? 'de jogador' : 'no esporte'}, aos ${i}.` : `Esteve do seu lado quando ${oClube(e.clube)} dispensou você, aos ${i}.`, 2);
  marcarFato(v, eraPro ? 'fim_carreira_esportiva' : 'dispensado_base');
  // Quem se preparou ainda jogando tem para onde ir: a comissão técnica, a escolinha.
  // Quem teve nome no esporte também é lembrado (sem curso, a porta é menor e mais rara).
  const nome = (e.reputacao ?? 0) >= 50 && e.nivel >= 3 && i >= 28;
  if (eraPro && (temFato(v, 'pos_treinador') || (nome && hash(`${v.id}:comissao`) < 0.35))) {
    // A porta é DA MODALIDADE: a comissão técnica do próprio esporte; a escolinha (futebol) e as turmas (lutas), para quem é novo demais.
    // REWORK 11.5 · ESP-04: quem foi goleiro é chamado para treinar goleiros (a comissão tem o seu lugar).
    const goleiro = e.modalidade === 'futebol' && e.posicao === 'goleiro' && i >= ocupacao('treinador_goleiros').idadeMin;
    const aux = goleiro ? 'treinador_goleiros' : comissaoDe(e.modalidade).auxiliar;
    const oc = e.modalidade === 'tenis' ? 'professor_tenis' : aux && i >= ocupacao(aux).idadeMin ? aux : e.modalidade === 'futebol' || e.modalidade === 'futsal' ? 'treinador_escolinha' : e.modalidade === 'lutas' ? 'instrutor_lutas' : undefined;
    if (oc) novaOportunidade(v, { tipo: 'convite', ocupacaoId: oc, dominio: e.modalidade, meses: 24, chave: 'pos_treinador', titulo: e.modalidade === 'tenis' ? 'Da quadra para a aula' : e.modalidade === 'futebol' ? 'Do campo para o banco' : perfilDe(e.modalidade).estrutura === 'clube' ? 'Da quadra para o banco' : 'Do outro lado do treino', texto: oc === 'treinador_goleiros' ? 'Um clube montando a comissão técnica quer alguém que entenda de goleiro por dentro: o treino próprio, a leitura do jogo pela área, quem joga no domingo.' : oc === 'professor_tenis' ? 'Um clube da cidade quer alguém com passado de circuito para as turmas e os juvenis: aula por hora, alunos seus.' : oc === aux ? (temFato(v, 'pos_treinador') ? 'O treinador que você conheceu no clube montou uma comissão técnica e lembrou de quem tirou os cursos ainda jogando.' : 'Um treinador que trabalhou com você montou uma comissão técnica: quer alguém que o vestiário respeite. Os cursos, você tira no caminho.') : oc === 'instrutor_lutas' ? 'Uma academia do bairro quer abrir turmas com alguém que já lutou de verdade.' : 'Uma escolinha do bairro precisa de alguém que saiba ensinar e que já tenha jogado de verdade.' });
  }
  abalar(v, eraPro ? 'o fim da carreira no esporte' : `a dispensa ${e.modalidade === 'futebol' ? 'da base' : 'da equipe'}`, -(eraPro ? 8 : 10), 6);
}

/**
 * VIDA 28 · O BÔNUS POR CONQUISTA (o "bicho" do título): o contrato do atleta de clube paga, além do salário, um prêmio
 * pelo título da liga, da copa nacional e da continental — proporcional ao salário e a quanto jogou (o titular leva
 * inteiro; quem quase não entrou, uma parte). Nas modalidades individuais com equipe, o título da prova. O tênis vive
 * de premiação (já paga no circuito). ABSTRAÇÃO: os múltiplos (1×, 1×, 2× o salário do mês) são calibração de jogo —
 * cada contrato real tem os seus.
 */
export function bonusDaTemporada(e: CarreiraEsportiva, t: Temporada, salario: number): { valor: number; motivos: string[] } {
  if (vivePremiacao(e.modalidade) || salario <= 0) return { valor: 0, motivos: [] };
  const motivos: string[] = [];
  let mult = 0;
  const individual = individualComEquipe(e.modalidade);
  if (individual) {
    const titulos = (t.luta?.titulos ?? 0) + (t.prova?.vitorias ? 1 : 0);
    if (titulos) { mult += 0.5 * titulos; motivos.push(titulos === 1 ? 'o título do ano' : `${titulos} títulos`); }
  } else {
    if (t.colocacao === 1) { mult += 1; motivos.push('o título da liga'); }
    for (const c of t.copas ?? []) if (c.fase === 'campeão') { const cont = /continental|libertadores|champions|sul-americana/i.test(c.id); mult += cont ? 2 : 1; motivos.push(cont ? 'o título continental' : 'o título da copa'); }
  }
  if (!mult) return { valor: 0, motivos };
  const participacao = individual ? 1 : clamp((t.titular + (t.partidas - t.titular) * 0.4) / Math.max(1, jogosDaTemporada(e.modalidade, e.nivel) * 0.8), 0.25, 1);
  return { valor: Math.round(salario * mult * participacao / 100) * 100, motivos };
}

function pagarBonusDaTemporada(v: Vida, e: CarreiraEsportiva, t: Temporada): void {
  const emp = v.trabalho.atual;
  if (!emp || !OCUPACOES_DE_ATLETA.includes(emp.ocupacaoId)) return;
  const b = bonusDaTemporada(e, t, emp.salario);
  if (!b.valor) return;
  t.bonus = b.valor;
  v.financas.conta += b.valor;
  lancar(v, `Bônus por conquista (${e.clube})`, 'renda', b.valor);
  escrever(v, { texto: `O bônus pelo ${listaNatural(b.motivos).replace(/^o /, '')} caiu na conta: ${dinheiro(b.valor)}, como o contrato com ${oClube(e.clube)} previa.`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'bom' });
}

/**
 * VIDA 28 · A BOLSA DA BASE. O atleta de base não tem salário de profissional; a partir dos 14, o clube pode pagar uma
 * bolsa (no Brasil, a "bolsa de aprendizagem" do contrato de formação — Lei 9.615/1998, art. 29, §4º: sem vínculo de
 * emprego, valor combinado com o clube). ABSTRAÇÃO: o valor é uma fração do salário mínimo do país pelo porte do clube
 * (o grande paga mais; o pequeno, uma ajuda de custo); antes do profissionalismo do esporte no país, nada.
 */
export function bolsaDaBase(v: Vida, e: CarreiraEsportiva): number {
  const i = idade(v);
  if (e.fase !== 'base' || i < 14 || e.modalidade === 'tenis' || e.origem === 'amador') return 0;
  if (ocupacaoAindaNaoExiste(v, ocupacaoDaModalidade(e.modalidade)) !== undefined) return 0;
  const pais = paisDaCidade(e.municipioId);
  const porte = e.modalidade === 'futebol' ? clubePorNome(e.clube, pais)?.porte ?? 'regional' : 'regional';
  const f = (porte === 'grande' ? 0.6 : porte === 'tradicional' ? 0.35 : 0.15) * (i >= 16 ? 1 : 0.5);
  return Math.round(salarioMinimoDoPais(pais) * f / 10) * 10;
}

/** Continua praticando o esporte como profissional (o treino do clube). */
export function treinoProfissional(v: Vida, r: Rng): void {
  const e = v.caminhos.esporte;
  if (e?.fase !== 'profissional' || (e.suspensoAte !== undefined && v.t < e.suspensoAte)) return;
  // O treino é do clube (a rotina de tempo livre da mesma modalidade não existe para quem é profissional).
  praticar(v, r, e.modalidade, e.foco === 'forcar' ? 1.8 : e.foco === 'preservar' ? 1.3 : 1.6, 1.45);
}

export { NOME_MOD, MUNICIPIOS };
