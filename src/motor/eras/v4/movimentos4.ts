/**
 * ERAS v4 · OS MOVIMENTOS — a sociedade muda também pela ação coletiva, não só pelos governantes.
 *
 * Numa vida histórica, os movimentos da época e do lugar (o sufragista, o dos direitos civis, o operário, o movimento
 * negro, o da anistia...) estão na rua. A pessoa pode APOIAR (ir às reuniões e às marchas), ORGANIZAR (puxar a reunião,
 * escrever, falar — mais pressão, mais exposição), FINANCIAR (com dinheiro, sem o rosto) ou SAIR. Cada gesto soma PRESSÃO
 * ao movimento (`v.era.historia.pressao`); a pressão ajuda as reformas a passar (`politica4`) e, perto da hora e muito
 * alta, pode antecipá-las sozinha (`sociedadeAno`). O tamanho do efeito é proporcional: uma pessoa comum adianta pouco.
 *
 * O RISCO é o da época (`MovimentoDaEpoca.risco`): 0 nenhum; 1 hostilidade (o patrão que demite, o olhar da vizinhança);
 * 2 detenção e ficha na polícia política (que fecha o concurso público enquanto o regime durar); 3 um regime que prende,
 * tortura e faz desaparecer — o jogo representa a prisão longa e o que ela custa, sem transformar a violência em
 * mecânica de pontos. Nada aqui é recompensa: é a escolha que as pessoas fizeram, com o preço que tinha.
 */
import type { Rng } from '../../rng';
import { clamp } from '../../rng';
import type { Vida } from '../../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { lancar } from '../../sistemas/extrato';
import { encerrarEmprego } from '../../sistemas/trabalho';
import { habilidade } from '../../sistemas/frentes';
import { salarioMinimoReal, paisHistoricoCorrente, mesHistoricoCorrente } from '../base/moedas';
import { garantirHistoria, movimentosAtivos, riscoDoMovimento, movimentoPorId, reformaPorId, type MovimentoDaEpoca } from '../base/sociedade4';

export type OqueEras4 = 'participar' | 'organizar' | 'financiar' | 'sair';

const PALAVRA_RISCO = ['sem risco além da discussão em casa', 'o patrão e a vizinhança podem não gostar', 'há prisões, e o nome vai para a ficha da polícia política', 'o regime prende, tortura e faz desaparecer'] as const;
export const palavraDoRisco = (n: 0 | 1 | 2 | 3) => PALAVRA_RISCO[n];

/** Os movimentos em que esta vida pode entrar agora (o país, o lugar, o ano). */
export function movimentosDaVida(v: Vida): { m: MovimentoDaEpoca; risco: 0 | 1 | 2 | 3; papel?: 'apoio' | 'militante' | 'organizacao'; pressao: number; reformas: string[] }[] {
  if (!v.era || mesHistoricoCorrente() === null || anoDe(v.t) > 2025) return [];
  const pais = paisHistoricoCorrente();
  const ano = anoDe(v.t);
  const h = v.era.historia;
  return movimentosAtivos(pais, ano).map(m => ({
    m, risco: riscoDoMovimento(m, ano), papel: h?.movimentos[m.id]?.papel, pressao: Math.round(h?.pressao[m.id] ?? 0),
    reformas: m.reformas.map(id => reformaPorId(pais, id)?.nome).filter((x): x is string => !!x)
  }));
}

const feitoNoAno = (v: Vida, id: string) => v.anoAtual.acoes.includes(`mov4:${id}`);

export function disponibilidadeEras4(v: Vida, oque: OqueEras4, id: string): Veredito {
  const m = movimentosDaVida(v).find(x => x.m.id === id);
  if (!m) return bloqueio('impossivel', 'Esse movimento não está na rua aqui, agora.');
  const i = idade(v);
  if (oque === 'sair') return m.papel ? PERMITIDO : bloqueio('impossivel', 'Você não faz parte dele.');
  if (feitoNoAno(v, id)) return bloqueio('incompativel', 'Neste ano, você já fez a sua parte por ele.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  if (oque === 'participar') return i >= 14 ? PERMITIDO : bloqueio('impossivel', 'Ainda é cedo: a reunião é dos mais velhos.');
  if (oque === 'organizar') {
    if (i < 18) return bloqueio('requisito', 'Organizar é para quem já é adulto.');
    if (!m.papel) return bloqueio('requisito', 'Primeiro, participar: ninguém organiza um movimento de que nunca fez parte.');
    return PERMITIDO;
  }
  // financiar
  const valor = doacao(v);
  if (i < 18) return bloqueio('requisito', 'Dinheiro para a causa, só com o seu.');
  if (v.financas.conta < valor) return bloqueio('requisito', 'Falta dinheiro na conta para uma doação que faça diferença.');
  return PERMITIDO;
}

/** A doação: um salário mínimo da época, ou 3% do que está na conta (o que for maior). */
const doacao = (v: Vida) => Math.round(Math.max(salarioMinimoReal(v.t) ?? 1500, v.financas.conta * 0.03));

/** O preço de estar na rua naquela época: a detenção, a ficha, a demissão. Devolve a frase (ou ''). */
function riscoDaParticipacao(v: Vida, r: Rng, m: MovimentoDaEpoca, nivel: 0 | 1 | 2 | 3, intensidade: number): string {
  if (nivel === 0) return '';
  const e = v.trabalho.atual;
  const h = garantirHistoria(v);
  if (nivel === 1) {
    if (!r.chance(0.15 * intensidade)) return '';
    v.mente.estresse = clamp((v.mente.estresse ?? 0) + 5);
    if (e && e.contrato !== 'servidor' && r.chance(0.3)) { encerrarEmprego(v, 'demitido pela militância'); return ' O patrão soube — e você perdeu o emprego.'; }
    return ' No trabalho e na rua, começaram os olhares e os recados.';
  }
  if (nivel === 2) {
    if (!r.chance(0.2 * intensidade)) return '';
    const meses = r.int(1, 3);
    h.detencoes = [...(h.detencoes ?? []), { t: v.t, movimento: m.id, meses }];
    v.fatos['fichado_politico'] = v.t;
    v.mente.estresse = clamp((v.mente.estresse ?? 0) + 15);
    if (e && (e.contrato === 'servidor' || r.chance(0.4))) encerrarEmprego(v, 'preso por motivo político');
    return ` A polícia levou você com outros ${r.int(8, 40)}: ${meses} ${meses === 1 ? 'mês' : 'meses'} detid${v.eu.genero === 'feminino' ? 'a' : 'o'}, e o nome ficou na ficha da polícia política.${e && !v.trabalho.atual ? ' O emprego não esperou.' : ''}`;
  }
  if (!r.chance(0.15 * intensidade)) return '';
  const meses = r.int(6, 24);
  h.detencoes = [...(h.detencoes ?? []), { t: v.t, movimento: m.id, meses }];
  v.fatos['fichado_politico'] = v.t;
  v.mente.estresse = clamp((v.mente.estresse ?? 0) + 30);
  v.corpo.saude = Math.max(5, v.corpo.saude - 10);
  if (e) encerrarEmprego(v, 'preso por motivo político');
  return ` Você foi preso${v.eu.genero === 'feminino' ? 'a' : ''} sem processo e passou ${meses} meses nas mãos do regime. Saiu marcad${v.eu.genero === 'feminino' ? 'a' : 'o'} — no corpo, na ficha e na memória; muitos dos que estavam com você não saíram.`;
}

export function executarEras4(v: Vida, r: Rng, oque: OqueEras4, id: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const pais = paisHistoricoCorrente();
  const m = movimentoPorId(pais, id);
  if (!m) return { texto: 'Não se aplica.', tom: 'neutro' };
  const h = garantirHistoria(v);
  const ano = anoDe(v.t);
  const nivel = riscoDoMovimento(m, ano);
  v.anoAtual.acoes.push(`mov4:${id}`);
  const lid = habilidade(v, 'lideranca');
  const nome = v.notoriedade?.valor ?? 0;
  const atual = h.movimentos[id];
  const somar = (x: number) => { h.pressao[id] = clamp((h.pressao[id] ?? 0) + x, 0, 100); };
  if (oque === 'sair') {
    delete h.movimentos[id];
    escrever(v, { texto: `Deixou ${m.nome.replace(/^O /, 'o ').replace(/^A /, 'a ')}: a vida pediu outra coisa.`, relevancia: 'cotidiano', tema: 'escolha', escolha: true, fato: { tipo: 'era', dados: { categoria: 'sociedade', evento: `mov_sair:${id}` } } });
    return { texto: 'Você se afastou do movimento.', tom: 'neutro' };
  }
  if (oque === 'financiar') {
    const valor = doacao(v);
    v.financas.conta -= valor;
    lancar(v, `Doação: ${m.nome.toLowerCase()}`, 'acontecimento', -valor);
    somar(3 + 6 * Math.log10(1 + valor / (salarioMinimoReal(v.t) ?? 1500)));
    if (!atual) h.movimentos[id] = { desde: v.t, papel: 'apoio', anos: 0, ultimo: v.t }; else atual.ultimo = v.t;
    const risco = nivel >= 2 ? riscoDaParticipacao(v, r, m, nivel, 0.25) : '';
    const texto = `Deu dinheiro para ${m.nome.toLowerCase().replace(/^o /, 'o ').replace(/^a /, 'a ')}: o aluguel da sede, os panfletos, a defesa de quem foi preso.${risco}`;
    escrever(v, { texto, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true, tom: risco ? 'ruim' : 'neutro', fato: { tipo: 'era', dados: { categoria: 'sociedade', evento: `mov_financiar:${id}` } } });
    return { texto, tom: risco ? 'ruim' : 'bom' };
  }
  const organizar = oque === 'organizar';
  somar(organizar ? 12 + lid / 8 + Math.min(8, nome / 12) : 5 + lid / 20 + Math.min(6, nome / 15));
  if (!atual) h.movimentos[id] = { desde: v.t, papel: organizar ? 'organizacao' : 'militante', anos: 0, ultimo: v.t };
  else { atual.ultimo = v.t; if (organizar) atual.papel = 'organizacao'; else if (atual.papel === 'apoio') atual.papel = 'militante'; }
  v.mente.estresse = clamp((v.mente.estresse ?? 0) + (organizar ? 6 : 3));
  const risco = riscoDaParticipacao(v, r, m, nivel, organizar ? 1.6 : 1);
  const primeiro = !atual;
  const fala = organizar
    ? `Puxou as reuniões, escreveu os panfletos e falou na frente de todos: ${m.causa}.`
    : primeiro ? `Entrou para ${m.nome.toLowerCase()}: as reuniões, as marchas, a causa — ${m.causa}.` : `Mais um ano na luta: ${m.causa}.`;
  escrever(v, { texto: `${fala}${risco}`, relevancia: primeiro || organizar || risco ? 'biografia' : 'cotidiano', tema: 'escolha', escolha: true, tom: risco ? 'ruim' : 'neutro', fato: { tipo: 'era', dados: { categoria: 'sociedade', evento: `mov_${oque}:${id}` } } });
  return { texto: `${fala}${risco}`, tom: risco ? 'ruim' : 'bom' };
}
