/**
 * VIDA 32 · O DIA A DIA DO TÉCNICO — os verbos da prancheta, além da estratégia.
 *
 * Antes, quem estava no banco escolhia o desenho do time (`tatica`), respondia propostas e os momentos do ano. Agora o
 * técnico também treina, mexe no elenco, fala com a imprensa, pede à diretoria e cuida da própria carreira — cada coisa
 * com um limite (uma vez por temporada, quase sempre), um motivo dito quando não dá, e um efeito REAL no modelo da
 * temporada (`tecnico.jogarTemporada`):
 *
 *   p.ajuste      força do time na próxima temporada (consumida nela)           o treino, o reforço, os garotos
 *   v32.decisivo  força a mais nos jogos que decidem (mata-mata, a final)       o estudo do adversário, a bola parada
 *   v32.comissao  um efeito pequeno a cada temporada da passagem                 o preparador, o analista, o auxiliar
 *   v32.garotos   o ganho dos garotos promovidos quando amadurecem              uma temporada depois
 *   p.vestiario   pesa em todos os jogos                                         o capitão, a conversa, a coletiva
 *   p.pressao     a diretoria (o cargo cai perto do alto)                        a coletiva, o pedido que deu errado
 *   c.reputacao   o nome no mercado (não ganha jogo)                             os garotos, a arbitragem, sair
 *
 * Os efeitos são modestos (décimos de ponto de força, onde a diferença entre um grande e um pequeno é de vários): nada
 * aqui garante título. O acaso destas ações é o da própria ação (`rngDe(v.id, 'tec32', oque, v.t)`), nunca o do ano.
 * O salário da comissão não é modelado: montá-la é PEDIR à diretoria (gasta crédito — a pressão sobe um pouco).
 */

import { clamp, rngDe } from '../rng';
import type { DiaADiaDoTecnico32, PassagemDeTecnico, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { dinheiro } from '../texto';
import { clubePorNome, doClube, oClube } from '../dados/clubes';
import { habilidade } from './frentes';
import { pagar } from './dinheiro';
import { deixarOClube, noComando, passagemAtual } from './tecnico';
import { disponibilidadeBanco, executarBanco } from './oficioDoTecnico';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export type OqueTecnico32 =
  | 'treino_fisico' | 'treino_tatico' | 'treino_bola_parada' | 'treino_descanso' | 'estudar_adversario'
  | 'promover_base' | 'capitao' | 'conversa_elenco'
  | 'coletiva_defender' | 'coletiva_cobrar' | 'coletiva_arbitragem'
  | 'pedir_reforco' | 'comissao_auxiliar' | 'comissao_preparador' | 'comissao_analista'
  | 'licenca' | 'entregar_cargo';

export type GrupoTecnico32 = 'treino' | 'elenco' | 'imprensa' | 'diretoria' | 'carreira';

export interface InfoTecnico32 {
  oque: OqueTecnico32;
  grupo: GrupoTecnico32;
  rotulo: string;
  /** O que faz (dito antes, no cartão). */
  efeito: string;
  /** O limite, em palavras. */
  limite: string;
}

/** O limite compartilhado: as ações com a mesma chave contam como uma por temporada. */
const CHAVE: Partial<Record<OqueTecnico32, string>> = {
  treino_fisico: 'treino', treino_tatico: 'treino', treino_bola_parada: 'treino', treino_descanso: 'treino',
  estudar_adversario: 'estudo', promover_base: 'base', conversa_elenco: 'conversa',
  coletiva_defender: 'coletiva', coletiva_cobrar: 'coletiva', coletiva_arbitragem: 'coletiva',
  pedir_reforco: 'diretoria', comissao_auxiliar: 'diretoria', comissao_preparador: 'diretoria', comissao_analista: 'diretoria'
};

export const GRUPOS_TECNICO32: { id: GrupoTecnico32; nome: string }[] = [
  { id: 'treino', nome: 'Treino' }, { id: 'elenco', nome: 'Elenco' }, { id: 'imprensa', nome: 'Imprensa' },
  { id: 'diretoria', nome: 'Diretoria' }, { id: 'carreira', nome: 'Carreira' }
];

const UMA = 'Um foco de treino por temporada';
export const ACOES_TECNICO32: InfoTecnico32[] = [
  { oque: 'treino_fisico', grupo: 'treino', rotulo: 'Pré-temporada física', efeito: 'O time chega inteiro e mais forte — mas carga alta machuca: um titular pode parar no departamento médico.', limite: UMA },
  { oque: 'treino_tatico', grupo: 'treino', rotulo: 'Pré-temporada tática', efeito: 'Repetição do modelo de jogo: um pouco mais de força e de leitura nos jogos grandes. Sem risco.', limite: UMA },
  { oque: 'treino_bola_parada', grupo: 'treino', rotulo: 'Foco na bola parada', efeito: 'Escanteio e falta ensaiados: quase nada no campeonato, bastante nos mata-matas e na final.', limite: UMA },
  { oque: 'treino_descanso', grupo: 'treino', rotulo: 'Treinos leves e descanso', efeito: 'O grupo descansa e agradece (vestiário), o time perde um pouco de ritmo; com a diretoria cobrando, pega mal.', limite: UMA },
  { oque: 'estudar_adversario', grupo: 'treino', rotulo: 'Estudar os adversários dos jogos decisivos', efeito: 'Horas de vídeo com a comissão: força a mais no mata-mata das copas e na final. Cansa.', limite: 'Uma vez por temporada' },
  { oque: 'promover_base', grupo: 'elenco', rotulo: 'Promover garotos da base', efeito: 'O vestiário e a torcida gostam; quase nada agora, mais força quando eles amadurecem (na temporada seguinte).', limite: 'Uma vez por temporada, até três por passagem' },
  { oque: 'capitao', grupo: 'elenco', rotulo: 'Escolher o capitão', efeito: 'A braçadeira certa une o grupo; a errada cria oposição dentro do vestiário.', limite: 'Uma vez a cada duas temporadas' },
  { oque: 'conversa_elenco', grupo: 'elenco', rotulo: 'Conversar um a um com o elenco', efeito: 'Explicar a cada jogador o papel dele: o vestiário melhora um pouco, sem risco.', limite: 'Uma vez por temporada' },
  { oque: 'coletiva_defender', grupo: 'imprensa', rotulo: 'Coletiva: defender o time', efeito: 'O elenco se sente protegido (vestiário); a diretoria acha que você passa a mão na cabeça.', limite: 'Uma coletiva marcante por temporada' },
  { oque: 'coletiva_cobrar', grupo: 'imprensa', rotulo: 'Coletiva: cobrar o elenco', efeito: 'Tira a pressão de cima de você e põe nos jogadores — o vestiário pode não perdoar.', limite: 'Uma coletiva marcante por temporada' },
  { oque: 'coletiva_arbitragem', grupo: 'imprensa', rotulo: 'Coletiva: reclamar da arbitragem', efeito: 'A torcida aplaude e a cobrança alivia; o nome no mercado sofre, e pode vir multa.', limite: 'Uma coletiva marcante por temporada' },
  { oque: 'pedir_reforco', grupo: 'diretoria', rotulo: 'Pedir reforço à diretoria', efeito: 'Se vier, o elenco da próxima temporada é mais forte (e a cobrança sobe). Se não vier, sobe a tensão.', limite: 'Um pedido à diretoria por temporada' },
  { oque: 'comissao_auxiliar', grupo: 'diretoria', rotulo: 'Pedir um auxiliar de confiança', efeito: 'Alguém que fala a língua do elenco: o vestiário melhora a cada temporada da passagem.', limite: 'Um pedido à diretoria por temporada; uma vez por passagem' },
  { oque: 'comissao_preparador', grupo: 'diretoria', rotulo: 'Pedir um preparador físico', efeito: 'Menos lesões: um pouco mais de força a cada temporada, e a pré-temporada física machuca menos.', limite: 'Um pedido à diretoria por temporada; uma vez por passagem' },
  { oque: 'comissao_analista', grupo: 'diretoria', rotulo: 'Pedir um analista de desempenho', efeito: 'Dados de cada adversário: força a mais nos jogos decisivos, a cada temporada da passagem.', limite: 'Um pedido à diretoria por temporada; uma vez por passagem' },
  { oque: 'licenca', grupo: 'carreira', rotulo: 'Fazer o próximo curso de licença', efeito: 'Cada nível concluído pesa no trabalho do banco e no nome; custa dinheiro e meses de módulos.', limite: 'Um curso de cada vez' },
  { oque: 'entregar_cargo', grupo: 'carreira', rotulo: 'Entregar o cargo', efeito: 'Sair por conta própria: o emprego acaba, o telefone fica. Com o cargo balançando, sai com a palavra; sem, o mercado estranha.', limite: 'Fecha a passagem' }
];
export const infoTecnico32 = (o: OqueTecnico32) => ACOES_TECNICO32.find(x => x.oque === o)!;

const estado = (p: PassagemDeTecnico): DiaADiaDoTecnico32 => (p.v32 ??= {});
const feitoNaTemporada = (v: Vida, p: PassagemDeTecnico, chave: string) => p.v32?.feitos?.[chave] === v.t;
const marcarFeito = (v: Vida, p: PassagemDeTecnico, chave: string) => { const x = estado(p); (x.feitos ??= {})[chave] = v.t; };
/** O mesmo "já feito no ano" dos verbos do ofício (`oficioDoTecnico`), para não pedir duas vezes a mesma coisa. */
const bancoFeito = (v: Vida, o: 'elenco' | 'diretoria') => v.fatos[`banco:${o}:${Math.floor(v.t / 12)}`] !== undefined;
const somarAjuste = (p: PassagemDeTecnico, x: number) => { p.ajuste = Math.round(clamp((p.ajuste ?? 0) + x, -4, 4) * 100) / 100; };
const somarDecisivo = (p: PassagemDeTecnico, x: number) => { const e = estado(p); e.decisivo = Math.round(clamp((e.decisivo ?? 0) + x, 0, 1.4) * 100) / 100; };
const COMISSAO = { comissao_auxiliar: 'auxiliar', comissao_preparador: 'preparador', comissao_analista: 'analista' } as const;
const porte = (p: PassagemDeTecnico) => clubePorNome(p.clube)?.porte;
const temporadaDiz: Record<string, string> = { treino: 'O foco da pré-temporada já foi escolhido nesta temporada.', estudo: 'Os decisivos desta temporada já foram estudados.', base: 'Já subiram garotos nesta temporada: o elenco precisa de tempo para absorvê-los.', conversa: 'Você já conversou com cada jogador nesta temporada.', coletiva: 'Já houve uma coletiva marcante nesta temporada: outra viraria novela.', diretoria: 'Você já fez um pedido à diretoria nesta temporada: o próximo, só na outra.' };

/** A chance de a diretoria dizer sim: o nome, a pressão (com o cargo balançando, ninguém investe) e o tamanho do clube. */
export function chanceDaDiretoria32(v: Vida, p: PassagemDeTecnico, base: number): number {
  const rep = v.caminhos.tecnico?.reputacao ?? 30;
  const pt = porte(p) === 'grande' ? 0.12 : porte(p) === 'tradicional' ? 0.05 : 0;
  return Math.round(clamp(base + (rep - 40) / 120 + (55 - p.pressao) / 150 + pt + (p.nivel >= 4 ? 0.05 : 0), 0.1, 0.8) * 100) / 100;
}

export function disponibilidadeTecnico32(v: Vida, o: OqueTecnico32): Veredito {
  if (o === 'licenca') return disponibilidadeBanco(v, 'licenca');
  const p = passagemAtual(v);
  if (!p || !noComando(v)) return bloqueio('impossivel', 'Isso é de quem está no comando de um time.');
  if (o === 'entregar_cargo') return PERMITIDO;
  const chave = CHAVE[o] ?? o;
  if (feitoNaTemporada(v, p, chave)) return bloqueio('incompativel', temporadaDiz[chave] ?? 'Isso já foi feito nesta temporada.');
  const x = p.v32;
  switch (o) {
    case 'promover_base':
      if (p.selecao) return bloqueio('impossivel', 'Seleção não tem categoria de base para promover: convoca.');
      if ((x?.garotos?.quantos ?? 0) >= 3) return bloqueio('incompativel', 'Três levas de garotos nesta passagem: a base precisa de tempo para formar outros.');
      return PERMITIDO;
    case 'capitao':
      if (x?.tCapitao !== undefined && v.t - x.tCapitao < 24) return bloqueio('incompativel', 'A braçadeira trocou há pouco: trocar de novo tão cedo racha o grupo.');
      return PERMITIDO;
    case 'conversa_elenco':
      if (bancoFeito(v, 'elenco')) return bloqueio('incompativel', 'Você já sentou com os líderes do elenco neste ano (no ofício): outra rodada de conversa cansa o grupo.');
      return PERMITIDO;
    case 'pedir_reforco':
      if (p.selecao) return bloqueio('impossivel', 'Seleção não contrata reforço: convoca quem está jogando.');
      if (bancoFeito(v, 'diretoria')) return bloqueio('incompativel', 'Você já sentou com a diretoria neste ano: o pedido de reforço fica para a próxima temporada.');
      return { grau: 'permitido', motivo: `Chance de a diretoria atender: ${Math.round(chanceDaDiretoria32(v, p, 0.3) * 100)}%.`, chance: chanceDaDiretoria32(v, p, 0.3) };
    case 'comissao_auxiliar': case 'comissao_preparador': case 'comissao_analista': {
      const quem = COMISSAO[o];
      if (x?.comissao?.includes(quem)) return bloqueio('incompativel', `O ${quem === 'auxiliar' ? 'auxiliar' : quem === 'preparador' ? 'preparador físico' : 'analista'} já trabalha com você nesta passagem.`);
      if (quem === 'analista' && p.nivel < 2 && !p.selecao) return bloqueio('requisito', 'Clube que só joga o estadual não tem orçamento para analista de desempenho.');
      if (bancoFeito(v, 'diretoria')) return bloqueio('incompativel', 'Você já sentou com a diretoria neste ano: o pedido fica para a próxima temporada.');
      return { grau: 'permitido', motivo: `Chance de a diretoria aceitar: ${Math.round(chanceDaDiretoria32(v, p, 0.4) * 100)}%.`, chance: chanceDaDiretoria32(v, p, 0.4) };
    }
    default: return PERMITIDO;
  }
}

/** Faz a ação (a disponibilidade já foi conferida em `acoes.executar`). Devolve o texto do resultado. */
export function executarTecnico32(v: Vida, o: OqueTecnico32): string {
  const r = rngDe(v.id, 'tec32', o, v.t);
  if (o === 'licenca') return executarBanco(v, r, 'licenca');
  const p = passagemAtual(v)!;
  const c = v.caminhos.tecnico!;
  const time = oClube(p.clube);
  const lider = (habilidade(v, 'lideranca') - 30) / 120 + v.personalidade.tracos.sociabilidade / 400;
  const x = estado(p);
  const nota = (texto: string) => escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  if (o !== 'entregar_cargo') marcarFeito(v, p, CHAVE[o] ?? o);
  switch (o) {
    case 'treino_fisico': {
      x.treino = 'fisico';
      v.mente.estresse = clamp(v.mente.estresse + 2);
      // A carga alta machuca: um em quatro (um em oito com preparador físico).
      const lesao = r.chance(x.comissao?.includes('preparador') ? 0.12 : 0.25);
      if (lesao) { somarAjuste(p, -0.3); p.vestiario = clamp(p.vestiario - 2); nota(`Pré-temporada física pesada ${doClube(p.clube)} — e um titular estourou a coxa no segundo dia.`); return 'A carga foi alta demais: um titular vai perder o começo da temporada. O resto do grupo chegou forte, mas o saldo é negativo.'; }
      somarAjuste(p, 0.6);
      nota(`Pré-temporada física pesada ${doClube(p.clube)}: o time chegou voando.`);
      return 'Três semanas de carga, ninguém machucado: o time começa a temporada inteiro e mais forte.';
    }
    case 'treino_tatico':
      x.treino = 'tatico';
      somarAjuste(p, 0.3); somarDecisivo(p, 0.3);
      nota(`Pré-temporada tática ${doClube(p.clube)}: o modelo de jogo, repetido até virar hábito.`);
      return 'O time sabe o que fazer com e sem a bola: um pouco mais forte no ano, mais seguro nos jogos grandes.';
    case 'treino_bola_parada':
      x.treino = 'bola_parada';
      somarAjuste(p, 0.1); somarDecisivo(p, 0.6);
      nota(`Semanas de bola parada ensaiada ${noClube32(p)}.`);
      return 'Seis jogadas de escanteio e três de falta, ensaiadas até a exaustão: é nos mata-matas que elas aparecem.';
    case 'treino_descanso': {
      x.treino = 'descanso';
      p.vestiario = clamp(p.vestiario + 4);
      somarAjuste(p, -0.2);
      v.mente.estresse = clamp(v.mente.estresse - 4);
      const cobra = p.pressao >= 60;
      if (cobra) p.pressao = clamp(p.pressao + 3);
      nota(`Pré-temporada leve ${doClube(p.clube)}: descanso para o elenco${cobra ? ' — e cara feia da diretoria' : ''}.`);
      return cobra ? 'O grupo agradeceu; a diretoria, não: com o time mal, treino leve pareceu desleixo.' : 'O grupo descansou e voltou de bom humor. Falta um pouco de ritmo — vem com os jogos.';
    }
    case 'estudar_adversario':
      somarDecisivo(p, 0.8);
      v.mente.estresse = clamp(v.mente.estresse + 3);
      nota('Noites de vídeo com a comissão: cada adversário dos jogos decisivos, dissecado.');
      return 'Um caderno por adversário: como sai jogando, onde erra, quem cansa. Nos mata-matas e na final, o time vai saber o que vem.';
    case 'promover_base': {
      const n = (x.garotos?.quantos ?? 0) + 1;
      // Os garotos rendem pouco já (+0,2) e mais quando amadurecem: +0,3 por leva (até +0,9), a partir da temporada seguinte à próxima.
      x.garotos = { quantos: n, ganho: Math.round(Math.min(0.9, (x.garotos?.ganho ?? 0) + 0.3) * 100) / 100, aPartirDe: Math.max(x.garotos?.aPartirDe ?? 0, p.temporadas.length + 1) };
      somarAjuste(p, 0.2);
      p.vestiario = clamp(p.vestiario + 3);
      c.reputacao = clamp(c.reputacao + 1);
      escrever(v, { texto: `Subiu garotos da base para o time principal ${doClube(p.clube)}.`, relevancia: n === 1 ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, tom: 'bom' });
      return 'Três garotos no treino dos profissionais. Ainda verdes — mas a torcida já canta o nome de um deles, e na temporada que vem eles vão estar prontos.';
    }
    case 'capitao': {
      x.tCapitao = v.t;
      const deu = r.chance(clamp(0.55 + lider, 0.25, 0.9));
      p.vestiario = clamp(p.vestiario + (deu ? 6 : -3));
      nota(deu ? `Escolheu o novo capitão ${doClube(p.clube)} — e o grupo seguiu a braçadeira.` : `A escolha do capitão ${doClube(p.clube)} dividiu o vestiário.`);
      return deu ? 'A braçadeira foi para quem o grupo já seguia: o vestiário ficou mais unido.' : 'O escolhido não era unanimidade: o antigo capitão virou oposição.';
    }
    case 'conversa_elenco':
      p.vestiario = clamp(p.vestiario + 4);
      v.mente.estresse = clamp(v.mente.estresse + 2);
      nota('Conversou um a um com os jogadores do elenco.');
      return 'Vinte e tantas conversas de dez minutos: cada um sabe o que você espera dele. O grupo ficou mais tranquilo.';
    case 'coletiva_defender':
      p.vestiario = clamp(p.vestiario + 5);
      p.pressao = clamp(p.pressao + 2);
      nota(`Na coletiva, defendeu o elenco ${doClube(p.clube)}: "a culpa é minha".`);
      return 'O elenco viu a coletiva no ônibus e aplaudiu. No conselho, houve quem achasse que você protege demais.';
    case 'coletiva_cobrar': {
      const deu = r.chance(clamp(0.5 + lider, 0.2, 0.85));
      p.pressao = clamp(p.pressao - (deu ? 6 : 3));
      p.vestiario = clamp(p.vestiario - (deu ? 2 : 8));
      nota(`Na coletiva, cobrou publicamente o elenco ${doClube(p.clube)}.`);
      return deu ? 'O recado chegou sem ferir: a torcida gostou, e os jogadores entenderam.' : 'A cobrança caiu mal: os líderes do elenco não gostaram de ouvir pela imprensa.';
    }
    case 'coletiva_arbitragem': {
      p.pressao = clamp(p.pressao - 4);
      p.vestiario = clamp(p.vestiario + 2);
      c.reputacao = clamp(c.reputacao - 2);
      const multa = r.chance(0.35) ? Math.max(500, Math.round(p.salario * 0.15 / 100) * 100) : 0;
      if (multa) pagar(v, multa);
      nota(`Reclamou da arbitragem na coletiva${multa ? ` — e levou multa de ${dinheiro(multa)}` : ''}.`);
      return multa ? `A torcida foi junto, a cobrança aliviou — e o tribunal multou você em ${dinheiro(multa)}.` : 'A torcida foi junto e a cobrança aliviou. No mercado, ficou a fama de quem procura desculpa.';
    }
    case 'pedir_reforco': {
      const deu = r.chance(chanceDaDiretoria32(v, p, 0.3));
      if (deu) { somarAjuste(p, porte(p) === 'grande' ? 1.2 : 1); p.pressao = clamp(p.pressao + 3); }
      else { p.pressao = clamp(p.pressao + 5); p.vestiario = clamp(p.vestiario - 2); }
      escrever(v, { texto: deu ? `A diretoria ${doClube(p.clube)} atendeu: chegaram os reforços que você pediu.` : `Pediu reforços à diretoria ${doClube(p.clube)} — e ouviu um não.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true, tom: deu ? 'bom' : 'ruim' });
      return deu ? 'Dois reforços com o seu aval: a próxima temporada começa com um elenco melhor — e com a cobrança à altura dele.' : `"Não tem dinheiro." O presidente saiu da sala, e o clima ${doClube(p.clube).replace(/^d[oa] /, 'no ')} ficou mais tenso.`;
    }
    case 'comissao_auxiliar': case 'comissao_preparador': case 'comissao_analista': {
      const quem = COMISSAO[o];
      const nome = quem === 'auxiliar' ? 'um auxiliar de confiança' : quem === 'preparador' ? 'um preparador físico' : 'um analista de desempenho';
      const deu = r.chance(chanceDaDiretoria32(v, p, 0.4));
      if (deu) { (x.comissao ??= []).push(quem); p.pressao = clamp(p.pressao + 2); }
      else p.pressao = clamp(p.pressao + 3);
      nota(deu ? `Montou a comissão ${doClube(p.clube)}: chegou ${nome}.` : `A diretoria ${doClube(p.clube)} negou ${nome}.`);
      return deu ? `A diretoria aceitou: ${nome} começa na segunda. O efeito aparece em cada temporada desta passagem.` : `A diretoria negou ${nome}: "a folha está no limite". E anotou o pedido.`;
    }
    case 'entregar_cargo': {
      // Com o cargo por um fio, entregar antes da demissão poupa o nome; sem pressão, sair no meio do contrato pesa no mercado.
      const balanca = p.pressao >= 70;
      const contratoLongo = p.contratoAte - v.t > 12;
      c.reputacao = clamp(c.reputacao + (balanca ? 0 : contratoLongo ? -3 : -1));
      v.mente.estresse = clamp(v.mente.estresse - 6);
      deixarOClube(v, 'saiu');
      return balanca ? `Você entregou o cargo antes que ${time} o tirasse: saiu com a palavra. O telefone pode tocar.` : `Você deixou ${time}${contratoLongo ? ' com contrato em vigor: o mercado vai perguntar o porquê' : ''}. Agora, sem clube — as propostas chegam pelo nome.`;
    }
  }
  return '';
}

const noClube32 = (p: PassagemDeTecnico) => doClube(p.clube).replace(/^do /, 'no ').replace(/^da /, 'na ');

/** A tela: o que está valendo para a próxima temporada (o foco, o estudo, os garotos, a comissão), em palavras. */
export function leituraDoTecnico32(v: Vida): string[] {
  const p = passagemAtual(v);
  const x = p?.v32;
  if (!p || !x) return [];
  const out: string[] = [];
  const FOCO = { fisico: 'pré-temporada física', tatico: 'pré-temporada tática', bola_parada: 'bola parada', descanso: 'treinos leves' };
  if (x.treino) out.push(`Foco da pré-temporada: ${FOCO[x.treino]}`);
  if (x.decisivo) out.push('Os jogos decisivos já foram estudados');
  if (x.garotos) out.push(`${x.garotos.quantos} ${x.garotos.quantos === 1 ? 'leva' : 'levas'} de garotos da base promovidas`);
  if (x.comissao?.length) out.push(`Na comissão: ${x.comissao.map(k => (k === 'auxiliar' ? 'auxiliar' : k === 'preparador' ? 'preparador físico' : 'analista')).join(', ')}`);
  return out;
}
