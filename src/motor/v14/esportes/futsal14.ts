/**
 * VIDA 14 · FUTSAL — o que é só do futsal, por cima do motor das carreiras (`sistemas/esporte` já conhece a modalidade:
 * a base, as divisões, os contratos, as lesões, a seleção): a ATIVIDADE recreativa (a quadra com os amigos, a escolinha,
 * o treino de base), a POSIÇÃO (goleiro, fixo, alas, pivô) com a produção de cada uma na temporada, o GOLEIRO-LINHA (a
 * tática dos minutos finais: mais gols do time, mais gols sofridos) e a escolha da posição pelo jogador.
 */
import type { Rng } from '../../rng';
import { clamp } from '../../rng';
import type { CarreiraEsportiva, Temporada, Vida } from '../../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { GANCHOS_DE_MODALIDADE, funcaoFutsalDe } from '../../sistemas/esporte';
import { registrarRotinas } from '../../sistemas/rotinas';
import { pertoDaAgua } from '../../dados/lugares';
import { FUNCOES_FUTSAL, NOME_FUNCAO_FUTSAL, PRODUCAO_FUTSAL, SOBRE_FUNCAO_FUTSAL, type FuncaoFutsal } from '../../dados14/esportes/futsal';

export { FUNCOES_FUTSAL, NOME_FUNCAO_FUTSAL, SOBRE_FUNCAO_FUTSAL };

/** A temporada de futsal: gols e assistências pela posição, o goleiro (jogos sem sofrer gol), o goleiro-linha. */
function temporadaFutsal(v: Vida, r: Rng, e: CarreiraEsportiva, t: Temporada, nota: number): void {
  const fn = funcaoFutsalDe(v, e);
  const p = PRODUCAO_FUTSAL[fn];
  t.funcao = fn;
  const jogos = t.titular + (t.partidas - t.titular) * 0.4;
  const q = clamp((nota - 3.5) / 4.5, 0.15, 1.5);
  const linha = !!e.futsal?.goleiroLinha && fn !== 'goleiro';
  t.gols = Math.round(jogos * p.gol * q * (0.8 + r.next() * 0.4) * (linha ? 1.12 : 1));
  t.assistencias = Math.round(jogos * p.assist * q * (0.8 + r.next() * 0.4));
  if (linha) t.goleiroLinha = Math.round(t.partidas * (0.15 + r.next() * 0.15));
  if (fn === 'goleiro') {
    const lambda = Math.max(0.6, 3.2 - (nota - 6) * 0.45 + (t.colocacao - 8) * 0.06);
    let zeros = 0, sofridos = 0;
    for (let k = 0; k < t.titular; k++) { let g = 0, x = Math.exp(-lambda), s = x; const u = r.next(); while (u > s && g < 12) { g++; x *= lambda / g; s += x; } sofridos += g; if (g === 0) zeros++; }
    t.semSofrerGol = zeros; t.golsSofridos = sofridos;
  }
}
GANCHOS_DE_MODALIDADE.futsal = { temporada: temporadaFutsal };

/** A atividade da semana (a prática que faz o futsal crescer, de onde sai a seletiva). */
registrarRotinas([{
  id: 'futsal', nome: 'Futsal', descricao: 'Quadra da escola, do clube ou da prefeitura: jogo rápido, bola no pé o tempo todo.', categoria: 'esporte', idadeMin: 6,
  niveis: [
    { rotulo: 'Racha na quadra, por diversão', tempo: 0.5, custo: 0, qualidade: 0.85 },
    { rotulo: 'Escolinha ou time de futsal', tempo: 1, custo: 50, qualidade: 1.15 },
    { rotulo: 'Treino de base, todo dia', tempo: 2, custo: 0, qualidade: 1.45, requer: (v: Vida) => (v.caminhos.esporte?.modalidade === 'futsal' && (v.caminhos.esporte.fase === 'base' || v.caminhos.esporte.fase === 'profissional') ? true : 'Só para quem está numa equipe de competição.') }
  ],
  pratica: { futsal: 1 }, social: { onde: 'no futsal', fluxo: 1.1, amplitude: 4 }
}]);

/**
 * A auditoria dos esportes (VIDA 14): handebol, ciclismo, skate, surfe e tênis de mesa entram como PRÁTICA recreativa
 * (o corpo, a cabeça, a turma) — sem carreira profissional inventada para cada um. Boxe e artes marciais já são `lutas`;
 * atletismo, natação, tênis, vôlei e basquete já têm carreira; automobilismo e ginástica de alto nível dependem de
 * estrutura que o jogo não simula — ficam de fora em vez de virar botão sem consequência.
 */
registrarRotinas([
  { id: 'handebol', nome: 'Handebol', descricao: 'Quadra da escola ou do clube: jogo de contato, arremesso e muito pique.', categoria: 'esporte', idadeMin: 9,
    niveis: [{ rotulo: 'Jogar com a turma', tempo: 0.5, custo: 0, qualidade: 0.85 }, { rotulo: 'Time do clube ou da escola', tempo: 1, custo: 40, qualidade: 1.1 }], social: { onde: 'no handebol', fluxo: 1, amplitude: 3 } },
  { id: 'ciclismo', nome: 'Pedalar', descricao: 'Ciclovia, estrada no fim de semana, o grupo de pedal da cidade.', categoria: 'esporte', idadeMin: 10,
    niveis: [{ rotulo: 'Pedal de lazer', tempo: 0.5, custo: 0, qualidade: 0.85 }, { rotulo: 'Grupo de pedal e provas amadoras', tempo: 1, custo: 90, qualidade: 1.1 }], pratica: { atletismo: 0.15 }, social: { onde: 'no pedal', fluxo: 0.8, amplitude: 3 } },
  { id: 'skate', nome: 'Skate', descricao: 'A praça, a pista, o corrimão que não devia.', categoria: 'esporte', idadeMin: 8, idadeMax: 60,
    niveis: [{ rotulo: 'Andar com a galera', tempo: 0.5, custo: 0, qualidade: 0.85 }, { rotulo: 'Treinar manobras na pista', tempo: 1, custo: 20, qualidade: 1.1 }], comportamento: { coragem: 1 }, social: { onde: 'na pista de skate', fluxo: 1, amplitude: 3 } },
  { id: 'surfe', nome: 'Surfe', descricao: 'A praia cedo, a prancha, esperar a série.', categoria: 'esporte', idadeMin: 8, oferta: (v: Vida) => pertoDaAgua(v.moradia.municipioId),
    niveis: [{ rotulo: 'Pegar onda quando dá', tempo: 0.5, custo: 0, qualidade: 0.85 }, { rotulo: 'Escola de surfe e campeonatos locais', tempo: 1, custo: 120, qualidade: 1.1 }], pratica: { natacao: 0.15 }, comportamento: { coragem: 1 }, social: { onde: 'no surfe', fluxo: 0.8, amplitude: 3 } },
  { id: 'tenis_mesa', nome: 'Tênis de mesa', descricao: 'A mesa do clube, da escola ou da garagem: reflexo puro.', categoria: 'esporte', idadeMin: 7,
    niveis: [{ rotulo: 'Jogar por diversão', tempo: 0.3, custo: 0, qualidade: 0.85 }, { rotulo: 'Treino no clube e torneios', tempo: 0.8, custo: 50, qualidade: 1.1 }], social: { onde: 'no tênis de mesa', fluxo: 0.8, amplitude: 2 } }
]);

/* ================================================================ A escolha (a posição e a tática) */

export type OqueFutsal14 = { funcao: FuncaoFutsal } | { goleiroLinha: boolean };

export function disponibilidadeFutsal14(v: Vida, a: OqueFutsal14): Veredito {
  const e = v.caminhos.esporte;
  if (!e || e.modalidade !== 'futsal' || (e.fase !== 'base' && e.fase !== 'profissional')) return bloqueio('impossivel', 'Isso é de quem joga futsal numa equipe.');
  if ('funcao' in a) {
    if (!FUNCOES_FUTSAL.includes(a.funcao)) return bloqueio('impossivel', 'Essa posição não existe no futsal.');
    if (funcaoFutsalDe(v, e) === a.funcao) return bloqueio('incompativel', 'Já é a sua posição.');
    if (v.anoAtual.acoes.includes('futsal14:funcao')) return bloqueio('incompativel', 'Trocar de posição duas vezes no ano não convence o técnico.');
    return a.funcao === 'goleiro' || funcaoFutsalDe(v, e) === 'goleiro' ? { grau: 'improvavel', motivo: 'Entre o gol e a linha, é quase outro esporte: o primeiro ano é de reaprender.' } : PERMITIDO;
  }
  if (funcaoFutsalDe(v, e) === 'goleiro') return bloqueio('impossivel', 'O goleiro-linha é um jogador de linha no lugar do goleiro.');
  return !!e.futsal?.goleiroLinha === a.goleiroLinha ? bloqueio('incompativel', 'Já é assim.') : PERMITIDO;
}

export function executarFutsal14(v: Vida, a: OqueFutsal14): string {
  const e = v.caminhos.esporte!;
  const f = (e.futsal ??= {});
  const g = v.eu.genero === 'feminino' ? 1 : 0;
  if ('funcao' in a) {
    v.anoAtual.acoes.push('futsal14:funcao');
    const vinhaDoGol = funcaoFutsalDe(v, e) === 'goleiro' || a.funcao === 'goleiro';
    f.funcao = a.funcao;
    if (a.funcao === 'goleiro') f.goleiroLinha = false;
    if (vinhaDoGol) e.reputacao = clamp((e.reputacao ?? 30) - 6);
    return `Agora você joga de ${NOME_FUNCAO_FUTSAL[a.funcao][g]}. ${SOBRE_FUNCAO_FUTSAL[a.funcao]}`;
  }
  f.goleiroLinha = a.goleiroLinha;
  return a.goleiroLinha ? 'O técnico topou: nos minutos finais, você vira o goleiro-linha — o quinto na linha, o gol vazio às costas.' : 'Nada de goleiro-linha: o time fecha o jogo com o goleiro de verdade.';
}
