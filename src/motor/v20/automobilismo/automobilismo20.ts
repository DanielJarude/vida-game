/**
 * VIDA 20 — AUTOMOBILISMO: do kart à Fórmula 1.
 *
 * O caminho (estrutura real, pesquisada; a trajetória não é a mesma para todos):
 *   kart → monopostos de entrada (opcional) → Fórmula 4 → Fórmula Regional (opcional) → Fórmula 3 → Fórmula 2 → Fórmula 1
 *
 * FATOS (FIA, regulamento da Superlicença): para correr na F1 é preciso ter 18 anos no primeiro GP e somar 40 pontos de
 * Superlicença nos três últimos anos (o ano corrente e os dois anteriores). Pontos por posição final no campeonato:
 * F2 40-40-40-30-20-10-8-6-4-3; F3 30-25-20-15-12-9-7-5-3-2; Fórmula Regional (europeia) 25-20-15-10-8-6-4-3-2-1;
 * F4 certificada 12-10-7-5-3-2-1. Na F4 certificada, só pontua quem tem 15 anos. A F1 tem 11 equipes e 22 carros (2026).
 *
 * ABSTRAÇÕES DE JOGO (não são fatos): as equipes e os pilotos adversários são fictícios (nenhum nome real, nenhuma
 * conduta atribuída a equipe ou piloto real); o número de corridas por temporada é aproximado (kart 8, entrada 10,
 * F4 e Regional 20, F3 20, F2 28, F1 24); a pontuação de cada corrida segue a tabela 25-18-15-12-10-8-6-4-2-1 em todas as
 * categorias; o orçamento de uma temporada é uma estimativa de mercado em reais de 2026 (kart estadual ~R$ 45 mil;
 * entrada ~R$ 380 mil; F4 ~R$ 1,6 mi; Regional ~R$ 3,2 mi; F3 ~R$ 6 mi; F2 ~R$ 13 mi); o salário de F1 vai de ~R$ 5 mi
 * (estreante em equipe pequena) a dezenas de milhões (o piloto de nome numa equipe de ponta).
 *
 * O resultado nunca é um sorteio de um número só: cada corrida soma o piloto (pilotagem, consistência, adaptação ao
 * circuito, preparo físico, experiência, cabeça sob pressão), o carro (a equipe — pesa pouco nas categorias de chassi
 * único e muito na F1) e o acaso da corrida (largada, estratégia, abandono, acidente). O campeonato é a soma das
 * corridas contra um grid inteiro de pilotos simulados com a mesma conta.
 *
 * Integração: dinheiro (o orçamento sai da família, do patrocínio, da academia de pilotos ou do próprio bolso — sem
 * orçamento, sem temporada), contrato e salário na F1 (`trabalho.atual`, ocupação `piloto_corrida`), fama (motivo do
 * nome registrado em `notoriedade`, que já paga imagem e patrocínio), saúde (acidentes, preparo físico), relações (a
 * temporada longe de casa pesa na parceria), estudos (o calendário tira o adolescente da escola), biografia e marcos.
 */
import { clamp, rngDe, type Rng } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade, parceiro } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { pagar } from '../../sistemas/dinheiro';
import { lancar } from '../../sistemas/extrato';
import { registrarMotivoDoNome } from '../../sistemas/notoriedade';
import { contratar, encerrarEmprego } from '../../sistemas/trabalho';
import { ocupacao } from '../../dados/ocupacoes';
import type { Auto20, Categoria20, Proposta20, Temporada20 } from '../../dados20/tipos20';

export type { Auto20, Categoria20 };

export const CATEGORIAS20: Record<Categoria20, {
  nome: string; ordem: number; idadeMin: number; corridas: number; grid: number; custo: number;
  /** O peso do carro no resultado (chassi único: pouco; F1: muito). */
  carro: number; sl: number[]; nivel: number;
}> = {
  kart: { nome: 'Kart', ordem: 0, idadeMin: 7, corridas: 8, grid: 30, custo: 45000, carro: 0.3, sl: [], nivel: 30 },
  entrada: { nome: 'Monopostos de entrada', ordem: 1, idadeMin: 14, corridas: 10, grid: 20, custo: 380000, carro: 0.25, sl: [], nivel: 40 },
  f4: { nome: 'Fórmula 4', ordem: 2, idadeMin: 15, corridas: 20, grid: 26, custo: 1600000, carro: 0.2, sl: [12, 10, 7, 5, 3, 2, 1], nivel: 47 },
  regional: { nome: 'Fórmula Regional', ordem: 3, idadeMin: 15, corridas: 20, grid: 26, custo: 3200000, carro: 0.25, sl: [25, 20, 15, 10, 8, 6, 4, 3, 2, 1], nivel: 54 },
  f3: { nome: 'Fórmula 3', ordem: 4, idadeMin: 16, corridas: 20, grid: 30, custo: 6000000, carro: 0.25, sl: [30, 25, 20, 15, 12, 9, 7, 5, 3, 2], nivel: 61 },
  f2: { nome: 'Fórmula 2', ordem: 5, idadeMin: 17, corridas: 28, grid: 22, custo: 13000000, carro: 0.3, sl: [40, 40, 40, 30, 20, 10, 8, 6, 4, 3], nivel: 68 },
  f1: { nome: 'Fórmula 1', ordem: 6, idadeMin: 18, corridas: 24, grid: 22, custo: 0, carro: 0.6, sl: [], nivel: 76 }
};
const ORDEM: Categoria20[] = ['kart', 'entrada', 'f4', 'regional', 'f3', 'f2', 'f1'];
const PONTOS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SUPERLICENCA = 40;

/* ------------------------------------------------------------------ nomes fictícios */
const PRENOMES = ['Lucas', 'Mateo', 'Oliver', 'Noah', 'Luca', 'Theo', 'Kai', 'Jonas', 'Arvid', 'Rafael', 'Hugo', 'Leon', 'Tomás', 'Elias', 'Yuki', 'Ren', 'Felipe', 'Jack', 'Max', 'Nikolai', 'Sami', 'Diego', 'Owen', 'Callum', 'Marco', 'Ivan', 'Aiden', 'Liam', 'Enzo', 'Bruno', 'Sofia', 'Emma', 'Laura', 'Mia', 'Clara', 'Ana'];
const SOBRENOMES = ['Varga', 'Holm', 'Brandt', 'Okafor', 'Lindqvist', 'Moreau', 'Castellanos', 'Takeda', 'Ferreira', 'Kowalski', 'Albers', 'Rinaldi', 'Novak', 'Haddad', 'Sorensen', 'Duarte', 'Mendel', 'Quist', 'Barros', 'Leclair', 'Ibáñez', 'Rauch', 'Petrov', 'Sato', 'Ward', 'Fontaine', 'Ilic', 'Nakamura', 'Ostrowski', 'Valente'];
const nomePiloto = (r: Rng) => `${r.pick(PRENOMES)} ${r.pick(SOBRENOMES)}`;
const EQUIPES: Record<Categoria20, string[]> = {
  kart: ['Kart Clube da cidade', 'Equipe Ponto Zero', 'Speedkart', 'Racing Kids', 'Trevo Kart', 'Pista Livre'],
  entrada: ['Escola Vértice', 'Monoposto Brasil', 'Alfa Júnior', 'Linha Reta Racing'],
  f4: ['Cardinal Motorsport', 'Vortex F4', 'Polaris Junior', 'Nordkap Racing', 'Atlas Formula', 'Delta Speed', 'Iris Motorsport', 'Kestrel'],
  regional: ['Cardinal Motorsport', 'Nordkap Racing', 'Halcyon', 'Basalt Racing', 'Polaris Junior', 'Tessera'],
  f3: ['Halcyon GP', 'Basalt Racing', 'Corvid Motorsport', 'Tessera', 'Altamira', 'Nordkap Racing', 'Sable', 'Vireo', 'Lumen GP', 'Arc Racing'],
  f2: ['Altamira', 'Corvid Motorsport', 'Halcyon GP', 'Sable', 'Lumen GP', 'Vireo', 'Arc Racing', 'Oberon', 'Kairos', 'Meridian', 'Tessera'],
  f1: ['Scuderia Meridiana', 'Aurora Racing', 'Kestrel Grand Prix', 'Vanguard F1', 'Orion Motorsport', 'Atlas Grand Prix', 'Halcyon F1', 'Cobalt Racing', 'Solenne', 'Ironbridge', 'Nimbus F1']
};
/** A força de cada equipe da F1 (0..100) no ano: muda devagar, pelo ano (ciclos de regulamento), nunca pelo nome. */
export function forcaDaEquipe(v: Vida, cat: Categoria20, equipe: string, ano: number): number {
  const lista = EQUIPES[cat];
  const k = Math.max(0, lista.indexOf(equipe));
  const ciclo = Math.floor(ano / 4);
  const base = 92 - (k / Math.max(1, lista.length - 1)) * 34;
  const r = rngDe(v.id, 'auto20_eq', cat, equipe, ciclo);
  return clamp(Math.round(base + r.normal() * (cat === 'f1' ? 7 : 4)), 40, 99);
}

/* ------------------------------------------------------------------ leitura */
export const nomeCategoria20 = (c: Categoria20) => CATEGORIAS20[c].nome;
export function nivelDoPiloto(a: Auto20): number {
  const x = a.atributos;
  return x.pilotagem * 0.38 + x.consistencia * 0.16 + x.adaptacao * 0.1 + x.fisico * 0.1 + x.experiencia * 0.08 + x.pressao * 0.18;
}
/** Até onde cada atributo chega: o talento é o teto (o treino aproxima do teto; não passa dele). */
export function tetoDoAtributo(a: Auto20, k: keyof Auto20['atributos']): number {
  const t = a.talento;
  return k === 'pilotagem' ? t + 12 : k === 'consistencia' ? 50 + t * 0.4 : k === 'adaptacao' ? 45 + t * 0.4 : k === 'pressao' ? 45 + t * 0.45 : 100;
}
function limitar(a: Auto20): void { for (const k of Object.keys(a.atributos) as (keyof Auto20['atributos'])[]) a.atributos[k] = Math.round(clamp(a.atributos[k], 0, tetoDoAtributo(a, k)) * 10) / 10; }
/** Os pontos de Superlicença válidos agora (o ano que fechou e os dois anteriores). */
export function pontosDeSuperlicenca(a: Auto20, ano: number): number {
  return (a.temporadas ?? []).filter(t => t.ano >= ano - 2 && t.ano <= ano).reduce((s, t) => s + (t.sl ?? 0), 0);
}

/* ------------------------------------------------------------------ o que a pessoa faz */
export type OqueAuto20 =
  | { op: 'comecar' }
  | { op: 'treinar'; foco: 'simulador' | 'fisico' | 'circuitos' | 'mental' }
  | { op: 'patrocinio' }
  | { op: 'aceitar' }
  | { op: 'recusar' }
  | { op: 'parar' };

const CUSTO_TREINO = { simulador: 18000, fisico: 9000, circuitos: 12000, mental: 6000 } as const;

export function podeComecar20(v: Vida): Veredito {
  const i = idade(v);
  if (v.automobilismo20 && v.automobilismo20.fase !== 'encerrada') return bloqueio('incompativel', 'A carreira nas pistas já está em andamento.');
  if (v.automobilismo20?.fase === 'encerrada') return bloqueio('incompativel', 'A carreira nas pistas já terminou.');
  if (i < CATEGORIAS20.kart.idadeMin) return bloqueio('requisito', `O kart de competição começa por volta dos ${CATEGORIAS20.kart.idadeMin} anos.`);
  if (i > 17) return bloqueio('requisito', 'Quem chega à F1 começa no kart ainda criança ou adolescente; depois dos 17, só o kart amador.');
  if (v.caminhos.esporte?.fase === 'profissional') return bloqueio('incompativel', 'Uma carreira de atleta profissional já ocupa o ano inteiro.');
  if (v.morte) return bloqueio('impossivel', '');
  return PERMITIDO;
}

export function disponibilidadeAuto20(v: Vida, o: OqueAuto20): Veredito {
  if (o.op === 'comecar') return podeComecar20(v);
  const a = v.automobilismo20;
  if (!a || a.fase === 'encerrada') return bloqueio('impossivel', 'Não há carreira nas pistas agora.');
  const feito = (k: string) => v.anoAtual.acoes.includes(`auto20:${k}`);
  switch (o.op) {
    case 'treinar': {
      if (feito('treinar')) return bloqueio('incompativel', 'O ano de treino extra já foi feito.');
      const custo = CUSTO_TREINO[o.foco];
      if (idade(v) >= 18 && v.financas.conta < custo) return bloqueio('requisito', `Custa ${fmt(custo)}.`);
      return PERMITIDO;
    }
    case 'patrocinio': return feito('patrocinio') ? bloqueio('incompativel', 'Já bateu nas portas neste ano.') : PERMITIDO;
    case 'aceitar': case 'recusar': return a.proposta && v.t <= a.proposta.validaAte ? PERMITIDO : bloqueio('impossivel', 'Não há proposta na mesa.');
    case 'parar': return PERMITIDO;
  }
}

export function executarAuto20(v: Vida, o: OqueAuto20): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  const r = rngDe(v.id, 'auto20_acao', o.op, v.t);
  if (o.op === 'comecar') return comecar(v, r);
  const a = v.automobilismo20!;
  v.anoAtual.acoes.push(`auto20:${o.op}`);
  switch (o.op) {
    case 'treinar': {
      const custo = CUSTO_TREINO[o.foco];
      pagarTemporada(v, custo, 'Automobilismo: treino');
      const x = a.atributos;
      if (o.foco === 'simulador') { x.pilotagem = clamp(x.pilotagem + 2); x.adaptacao = clamp(x.adaptacao + 3); }
      if (o.foco === 'fisico') { x.fisico = clamp(x.fisico + 5); v.corpo.forma = clamp(v.corpo.forma + 3); }
      if (o.foco === 'circuitos') { x.adaptacao = clamp(x.adaptacao + 3); x.consistencia = clamp(x.consistencia + 2); }
      if (o.foco === 'mental') { x.pressao = clamp(x.pressao + 4); v.mente.estresse = clamp(v.mente.estresse - 3); }
      limitar(a);
      return { texto: { simulador: 'Horas no simulador: as voltas de referência de cada pista, o carro de cor.', fisico: 'Preparação física de piloto: pescoço, resistência, o calor do cockpit.', circuitos: 'Estudou os circuitos do calendário: os pontos de frenagem, as zebras, onde se ultrapassa.', mental: 'Trabalho com psicólogo do esporte: a largada, a pressão, o erro que não pode virar dois.' }[o.foco], tom: 'bom' };
    }
    case 'patrocinio': {
      const ult = a.temporadas?.[a.temporadas.length - 1];
      const nome = v.notoriedade?.valor ?? 0;
      const chance = clamp(0.15 + (ult ? (12 - Math.min(12, ult.posicao)) * 0.04 : 0) + nome / 120 + (ult?.titulo ? 0.25 : 0), 0.05, 0.9);
      if (!r.chance(chance)) return { texto: 'Bateu em muitas portas com o currículo de resultados. Por enquanto, ninguém fechou.', tom: 'ruim' };
      const valor = Math.round(CATEGORIAS20[a.fase as Categoria20].custo * clamp(0.15 + r.next() * 0.35 + nome / 200 + (ult?.titulo ? 0.3 : ult && ult.posicao <= 3 ? 0.15 : 0), 0.1, 0.9) / 1000) * 1000 || 20000;
      a.patrocinio = { nome: r.pick(['uma rede de autopeças', 'uma marca de energético', 'uma construtora da cidade', 'um banco digital', 'uma marca de lubrificantes', 'uma empresa de tecnologia']), valor, ate: anoDe(v.t) + 1 };
      escrever(v, { texto: `Fechou patrocínio com ${a.patrocinio.nome}: ${fmt(valor)} por temporada, por duas temporadas.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
      return { texto: `Patrocínio fechado: ${fmt(valor)} por temporada.`, tom: 'bom' };
    }
    case 'aceitar': {
      const p = a.proposta!;
      a.proposta = undefined;
      mudarDeEquipe(v, a, p);
      return { texto: p.categoria === a.fase && p.categoria === 'f1' ? `Assinou com a ${p.equipe}.` : `Acertou com a ${p.equipe} para a ${nomeCategoria20(p.categoria)}.`, tom: 'bom' };
    }
    case 'recusar': { const p = a.proposta!; a.proposta = undefined; return { texto: `Recusou a proposta da ${p.equipe}.`, tom: 'neutro' }; }
    case 'parar': { encerrar(v, a, 'escolha'); return { texto: 'Pendurou o capacete.', tom: 'neutro' }; }
  }
}

function comecar(v: Vida, r: Rng): { texto: string; tom: 'bom' } {
  // O talento de nascença (estável pela semente) e o que a vida já deu (reflexo, cabeça, corpo).
  const dom = rngDe(v.id, 'auto20_talento');
  const talento = clamp(40 + dom.normal() * 14 + Math.max(0, v.personalidade.tracos.coragem) / 8 + (v.mente.cognicao - 50) * 0.1);
  v.automobilismo20 = {
    fase: 'kart', inicio: v.t, desde: v.t, equipe: r.pick(EQUIPES.kart), talento: Math.round(talento),
    atributos: { pilotagem: Math.round(talento * 0.7), consistencia: 30, adaptacao: 30, fisico: clamp(Math.round(v.corpo.forma * 0.6)), experiencia: 5, pressao: clamp(Math.round(40 + v.personalidade.tracos.coragem / 5)) },
    temporadas: [], vitorias: 0, podios: 0, titulos: 0, largadas: 0
  };
  v.anoAtual.acoes.push('auto20:comecar');
  escrever(v, { texto: 'Sentou num kart de competição pela primeira vez. O capacete grande demais, o barulho no peito — e a vontade de voltar no sábado seguinte.', relevancia: 'marco', tema: 'lazer', tom: 'bom', escolha: true });
  return { texto: 'Começou no kart.', tom: 'bom' };
}

/* ------------------------------------------------------------------ o dinheiro */
const CAPACIDADE_DA_FAMILIA: Record<string, number> = { vulneravel: 4000, trabalhadora: 30000, media_baixa: 70000, media: 160000, alta: 2500000 };

/** Paga do bolso (adulto) ou da casa (menor). Devolve quanto foi pago. */
function pagarTemporada(v: Vida, valor: number, linha: string, daFamilia = false): number {
  if (valor <= 0) return 0;
  if (idade(v) < 18 || daFamilia) {
    const reserva = Math.max(0, v.origem.reserva ?? 0);
    const daReserva = Math.min(reserva, valor);
    if (daReserva > 0) v.origem.reserva = reserva - daReserva;
    return valor;
  }
  pagar(v, valor);
  lancar(v, linha, 'despesa', -valor);
  return valor;
}

/** Quanto falta para a temporada (o orçamento menos patrocínio, academia e o que a família consegue). */
export function orcamentoDaTemporada(v: Vida, a: Auto20, cat: Categoria20 = a.fase as Categoria20): { custo: number; patrocinio: number; academia: number; familia: number; falta: number } {
  // Os dois primeiros anos de kart são de escolinha e kart alugado (a temporada estadual com kart próprio vem depois).
  const custo = cat === 'kart' && (a.temporadas ?? []).length < 2 ? 15000 : CATEGORIAS20[cat]?.custo ?? 0;
  const ano = anoDe(v.t);
  const patrocinio = a.patrocinio && a.patrocinio.ate >= ano ? Math.min(custo, a.patrocinio.valor) : 0;
  const academia = a.academia ? Math.round((custo - patrocinio) * 0.85) : 0;
  const resto = Math.max(0, custo - patrocinio - academia);
  // A família banca enquanto dá (a de origem, também depois dos 18 — até os 26, quando o piloto já tem de se pagar).
  const familia = idade(v) <= 26 ? Math.min(resto, CAPACIDADE_DA_FAMILIA[v.origem.classe] ?? 30000) : 0;
  const bolso = idade(v) >= 18 ? Math.min(resto, Math.max(0, v.financas.conta)) : 0;
  return { custo, patrocinio, academia, familia, falta: Math.max(0, resto - familia - bolso) };
}

/* ------------------------------------------------------------------ a temporada */

interface Grid { nome: string; nivel: number; carro: number; voce?: boolean; companheiro?: boolean; rival?: boolean }

function montarGrid(v: Vida, a: Auto20, ano: number, r: Rng): Grid[] {
  const c = CATEGORIAS20[a.fase as Categoria20];
  const equipes = EQUIPES[a.fase as Categoria20];
  const g: Grid[] = [];
  const minhaForca = forcaDaEquipe(v, a.fase as Categoria20, a.equipe, ano);
  g.push({ nome: 'você', nivel: nivelDoPiloto(a), carro: minhaForca, voce: true });
  a.companheiro ??= nomePiloto(r);
  g.push({ nome: a.companheiro, nivel: c.nivel + r.normal() * 7, carro: minhaForca, companheiro: true });
  if (a.rival) g.push({ nome: a.rival, nivel: c.nivel + 6 + r.normal() * 3, carro: forcaDaEquipe(v, a.fase as Categoria20, equipes[0], ano), rival: true });
  // O grid da F1 é uma elite apertada (pouca diferença entre os pilotos); as equipes boas contratam os melhores.
  const sd = a.fase === 'f1' ? 4.5 : 8;
  while (g.length < c.grid) {
    const eq = equipes[Math.floor(g.length / 2) % equipes.length];
    const carro = forcaDaEquipe(v, a.fase as Categoria20, eq, ano);
    g.push({ nome: nomePiloto(r), nivel: c.nivel + r.normal() * sd + (a.fase === 'f1' ? (carro - 70) * 0.15 : 0), carro });
  }
  return g;
}

/** A temporada do ano, corrida a corrida. */
function correrTemporada(v: Vida, a: Auto20, ano: number): Temporada20 {
  const cat = a.fase as Categoria20;
  const c = CATEGORIAS20[cat];
  const r = rngDe(v.id, 'auto20_temp', ano);
  const grid = montarGrid(v, a, ano, r);
  const pts = new Map<string, number>(grid.map(x => [x.nome, 0]));
  const t: Temporada20 = { ano, categoria: cat, equipe: a.equipe, corridas: 0, vitorias: 0, podios: 0, poles: 0, pontos: 0, posicao: 0, abandonos: 0, acidentes: 0, melhor: 99 };
  const x = a.atributos;
  const lesaoAte = a.lesaoAte ?? 0;
  // O carro pesa pela categoria; o piloto, pelo resto. O acaso de cada corrida é largo nas de base e menor na F1.
  const desempenho = (g: Grid, rr: Rng) => g.nivel * (1 - c.carro) + g.carro * c.carro + rr.normal() * (cat === 'kart' ? 9 : 7);
  for (let k = 0; k < c.corridas; k++) {
    const mes = Math.floor((k / c.corridas) * 9) + 3;
    const tCorrida = (ano * 12) + mes;
    const fora = tCorrida < lesaoAte * 1;
    const notas = grid.map(g => {
      if (g.voce && fora) return { g, n: -Infinity };
      // a pressão pesa mais nas últimas corridas e em quem briga por título; a consistência segura o erro
      let n = desempenho(g, r);
      if (g.voce) {
        n += (x.pressao - 50) * (k >= c.corridas - 4 ? 0.12 : 0.04);
        const erro = 0.05 * (1 - x.consistencia / 120);
        if (r.chance(erro)) { n = -Infinity; t.abandonos += 1; if (r.chance(0.35)) { t.acidentes += 1; acidente(v, a, r, tCorrida); } }
      } else if (r.chance(0.05)) n = -Infinity;
      return { g, n };
    }).sort((p, q) => q.n - p.n);
    notas.forEach(({ g, n }, i) => { if (n !== -Infinity && i < PONTOS.length) pts.set(g.nome, (pts.get(g.nome) ?? 0) + PONTOS[i]); });
    const eu = notas.findIndex(z => z.g.voce);
    if (notas[eu].n === -Infinity && fora) continue;
    t.corridas += 1;
    if (notas[eu].n !== -Infinity) {
      t.melhor = Math.min(t.melhor ?? 99, eu + 1);
      if (eu === 0) t.vitorias += 1;
      if (eu < 3) t.podios += 1;
      if (eu === 0 && r.chance(0.55)) t.poles += 1;
    }
  }
  const tabela = [...pts.entries()].sort((p, q) => q[1] - p[1]);
  t.pontos = pts.get('você') ?? 0;
  t.posicao = tabela.findIndex(([n]) => n === 'você') + 1;
  t.titulo = t.posicao === 1;
  t.companheiroPos = tabela.findIndex(([n]) => n === a.companheiro) + 1;
  if (a.rival) t.rivalPos = tabela.findIndex(([n]) => n === a.rival) + 1;
  t.campeao = tabela[0][0] === 'você' ? undefined : tabela[0][0];
  t.sl = c.sl[t.posicao - 1] ?? 0;
  // Na F4 certificada, quem tem menos de 15 não pontua para a Superlicença.
  if (cat === 'f4' && idade(v) < 15) t.sl = 0;
  if (t.melhor === 99) delete t.melhor;
  return t;
}

function acidente(v: Vida, a: Auto20, r: Rng, tCorrida: number): void {
  const grave = r.chance(0.12);
  v.corpo.saude = clamp(v.corpo.saude - (grave ? 18 : 4));
  v.mente.estresse = clamp(v.mente.estresse + (grave ? 8 : 2));
  if (grave) {
    a.lesaoAte = Math.max(a.lesaoAte ?? 0, tCorrida + 2 + Math.floor(r.next() * 3));
    a.acidentesGraves = (a.acidentesGraves ?? 0) + 1;
    escrever(v, { t: Math.max(v.t - 11, Math.min(v.t, tCorrida)), texto: 'Um acidente forte: o carro destruído contra a barreira, o hospital, as corridas seguintes vistas da televisão. O medo voltou junto para o cockpit.', relevancia: 'biografia', tema: 'saude', tom: 'ruim' });
  }
}

/** O ano da carreira: a temporada (se houver orçamento), o que ela ensina, o que muda depois dela. */
export function processarAutomobilismo20(v: Vida): void {
  const a = v.automobilismo20;
  if (!a || a.fase === 'encerrada' || v.morte) return;
  const ano = anoDe(v.t);
  const r = rngDe(v.id, 'auto20_ano', ano);
  const cat = a.fase as Categoria20;
  // O orçamento: na F1 a equipe paga; antes dela, alguém precisa pagar a temporada.
  if (cat !== 'f1') {
    let o = orcamentoDaTemporada(v, a);
    // Sem dinheiro para a categoria nova, volta-se a uma mais barata que já se correu (o caminho de muita gente).
    if (o.falta > 0) {
      const ja = ORDEM.filter(c => c !== 'f1' && CATEGORIAS20[c].ordem < CATEGORIAS20[cat].ordem && (a.temporadas ?? []).some(t => t.categoria === c) && !(c === 'kart' && idade(v) >= 17));
      const volta = ja.reverse().find(c => orcamentoDaTemporada(v, a, c).falta === 0);
      if (volta) {
        escrever(v, { texto: `O orçamento da ${nomeCategoria20(cat)} não fechou: voltou para a ${nomeCategoria20(volta)}, mais barata, para não ficar parado.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
        a.fase = volta; a.equipe = EQUIPES[volta][Math.floor(r.next() * EQUIPES[volta].length)]; a.companheiro = undefined;
        o = orcamentoDaTemporada(v, a);
      }
    }
    if (o.falta > 0) {
      a.semOrcamento = (a.semOrcamento ?? 0) + 1;
      escrever(v, { texto: `Faltaram ${fmt(o.falta)} para fechar o orçamento da temporada de ${nomeCategoria20(cat)}: o ano ficou sem corridas${a.semOrcamento >= 2 ? '' : ', à espera de patrocínio'}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
      if (a.semOrcamento >= 2) encerrar(v, a, 'orcamento');
      return;
    }
    a.semOrcamento = 0;
    const doBolso = o.custo - o.patrocinio - o.academia - o.familia;
    if (o.familia > 0) pagarTemporada(v, o.familia, 'Automobilismo: temporada', true);
    if (doBolso > 0) pagarTemporada(v, doBolso, `Automobilismo: temporada de ${nomeCategoria20(a.fase as Categoria20)}`);
    if (o.familia > 0) a.familiaInvestiu = (a.familiaInvestiu ?? 0) + o.familia;
  }
  const t = correrTemporada(v, a, ano);
  const catT = t.categoria;
  (a.temporadas ??= []).push(t);
  if (a.temporadas.length > 30) a.temporadas.splice(0, a.temporadas.length - 30);
  a.vitorias += t.vitorias; a.podios += t.podios; a.largadas += t.corridas; if (t.titulo) a.titulos += 1;
  // A evolução: a experiência das corridas, o talento puxando a pilotagem, o corpo e a idade.
  const x = a.atributos;
  const i = idade(v);
  x.experiencia = clamp(x.experiencia + Math.min(10, t.corridas * 0.4));
  const teto = a.talento + 12;
  if (i <= 30) x.pilotagem = clamp(x.pilotagem + Math.max(0, (teto - x.pilotagem) * 0.12) + r.normal());
  x.consistencia = clamp(x.consistencia + Math.max(0, (tetoDoAtributo(a, 'consistencia') - x.consistencia) * 0.12) - (t.abandonos > 3 ? 2 : 0));
  x.adaptacao = clamp(x.adaptacao + 2);
  x.fisico = clamp(Math.round(x.fisico * 0.7 + v.corpo.forma * 0.3) - (i >= 36 ? (i - 35) : 0));
  if (t.titulo || t.posicao <= 3) x.pressao = clamp(x.pressao + 3);
  if (i >= 34) { x.pilotagem = clamp(x.pilotagem - (i - 33) * 0.8); x.consistencia = clamp(x.consistencia - 0.5); }
  limitar(a);
  // O rival: o piloto que terminou perto, a mesma geração.
  if (!a.rival && t.posicao <= 6) a.rival = nomePiloto(r);
  // A vida em volta: o calendário longe de casa, o colégio, a cabeça.
  const viagens = CATEGORIAS20[catT].ordem >= 3;
  if (viagens) { const par = parceiro(v); if (par) par.vin.tensao = clamp(par.vin.tensao + (catT === 'f1' ? 5 : 3)); }
  if (i < 18) { const b = v.educacao.basica; if (b) b.desempenho = clamp(b.desempenho - (viagens ? 6 : 2)); }
  v.mente.estresse = clamp(v.mente.estresse + (catT === 'f1' ? 4 : 2) - (t.titulo ? 4 : 0));
  if (t.titulo) v.mente.felicidade = clamp(v.mente.felicidade + 6);
  // A F1 paga (o salário é o do contrato, no emprego).
  contarTemporada(v, a, t);
  depoisDaTemporada(v, a, t, r);
}

function contarTemporada(v: Vida, a: Auto20, t: Temporada20): void {
  const nome = nomeCategoria20(t.categoria);
  const pos = t.posicao;
  const sl = pontosDeSuperlicenca(a, t.ano);
  const texto = t.titulo
    ? `Campeão da ${nome} de ${t.ano}, pela ${t.equipe}: ${t.vitorias} vitória${t.vitorias === 1 ? '' : 's'} e ${t.podios} pódios em ${t.corridas} corridas.`
    : `Temporada de ${t.ano} na ${nome}, pela ${t.equipe}: ${pos}º no campeonato, ${t.pontos} pontos${t.vitorias ? `, ${t.vitorias} vitória${t.vitorias === 1 ? '' : 's'}` : ''}${t.podios ? `, ${t.podios} pódio${t.podios === 1 ? '' : 's'}` : ''}.${t.companheiroPos ? ` O companheiro de equipe, ${a.companheiro}, terminou em ${t.companheiroPos}º.` : ''}`;
  escrever(v, { texto: texto.replace(/^Campeão/, v.eu.genero === 'feminino' ? 'Campeã' : 'Campeão') + (t.sl && t.categoria !== 'f1' ? ` (${t.sl} pontos de Superlicença; ${sl} nos últimos três anos.)` : ''), relevancia: t.titulo || t.categoria === 'f1' ? 'marco' : 'biografia', tema: 'trabalho', tom: t.titulo || pos <= 3 ? 'bom' : pos > 15 ? 'ruim' : undefined });
  if (t.categoria === 'f1' && t.vitorias > 0 && a.vitorias === t.vitorias) escrever(v, { texto: `A primeira vitória na Fórmula 1. O hino no pódio, o champanhe, o telefone que não parou.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
}

/** As propostas, a academia, a renovação, a queda, o fim. */
function depoisDaTemporada(v: Vida, a: Auto20, t: Temporada20, r: Rng): void {
  const cat = a.fase as Categoria20;
  const i = idade(v);
  const ordem = CATEGORIAS20[cat].ordem;
  const bom = t.posicao <= 3, medio = t.posicao <= 8;
  const ano = t.ano;
  // A academia de pilotos de uma equipe de F1 olha os melhores jovens (paga boa parte do orçamento; corta quem cai).
  if (!a.academia && ((ordem >= 2 && ordem <= 4 && bom && i <= 19) || (ordem <= 1 && i >= 11 && (t.titulo ? r.chance(0.45) : t.posicao <= 3 && r.chance(0.15))))) {
    a.academia = EQUIPES.f1[Math.floor(r.next() * 5)];
    escrever(v, { texto: `Entrou para a academia de pilotos da ${a.academia}: o programa de jovens paga boa parte das temporadas — e cobra resultado.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  } else if (a.academia && ordem < 6 && t.posicao > 10 && r.chance(0.6)) {
    escrever(v, { texto: `A ${a.academia} não renovou o lugar na academia de pilotos.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
    a.academia = undefined;
  }
  const valida = v.t + 11;
  const proxima = (c: Categoria20) => ORDEM.indexOf(c);
  const propor = (c: Categoria20, forte: boolean) => {
    const lista = EQUIPES[c];
    const eq = forte ? lista[Math.floor(r.next() * Math.min(3, lista.length))] : lista[Math.floor(lista.length / 2 + r.next() * (lista.length / 2))];
    const p: Proposta20 = { categoria: c, equipe: eq, validaAte: valida, forca: forcaDaEquipe(v, c, eq, ano + 1) };
    if (c === 'f1') p.salario = salarioF1(v, a, p.forca, t);
    a.proposta = p;
  };
  if (cat === 'f1') { renovacaoF1(v, a, t, r); return; }
  // Subir: pelos resultados e pela idade mínima da categoria seguinte.
  let alvo: Categoria20 | undefined;
  if (cat === 'kart' && i >= 14 && (bom || (medio && r.chance(0.5)))) alvo = i >= 15 && bom ? 'f4' : 'entrada';
  else if (cat === 'entrada' && medio && i >= 15) alvo = 'f4';
  else if (cat === 'f4' && bom) alvo = t.titulo ? 'f3' : 'regional';
  else if (cat === 'f4' && medio && r.chance(0.4)) alvo = 'regional';
  else if (cat === 'regional' && (bom || (medio && r.chance(0.35)))) alvo = 'f3';
  else if (cat === 'f3' && (bom || (t.posicao <= 6 && r.chance(0.5)))) alvo = 'f2';
  else if (cat === 'f2' && i >= 18 && pontosDeSuperlicenca(a, ano) >= SUPERLICENCA) {
    // As vagas da F1 são poucas (22 carros, duas a quatro abrem por ano): o campeão quase sempre tem uma; o resto, às vezes.
    const chance = t.titulo ? 0.85 : t.posicao <= 3 ? 0.5 : t.posicao <= 5 ? 0.2 : 0.04;
    if (r.chance(chance + (a.academia ? 0.15 : 0))) alvo = 'f1';
  }
  if (alvo && CATEGORIAS20[alvo].idadeMin <= i + 1) { propor(alvo, bom); escreverProposta(v, a); return; }
  // Ficar: renovar com a mesma equipe ou ir para uma melhor na mesma categoria.
  const anosNaCategoria = (a.temporadas ?? []).filter(x => x.categoria === cat).length;
  if (cat === 'f2' && anosNaCategoria >= 4 && !alvo) { encerrar(v, a, 'sem_vaga'); return; }
  if (medio && proxima(cat) >= 0 && r.chance(0.35)) { propor(cat, true); escreverProposta(v, a); }
  // Quem passa anos sem resultado na base desiste (ou a família para de pagar).
  const ruins = (a.temporadas ?? []).slice(-3).filter(x => x.posicao > 12).length;
  if (ruins >= 3 && i >= 17) encerrar(v, a, 'resultados');
}

function escreverProposta(v: Vida, a: Auto20): void {
  const p = a.proposta!;
  escrever(v, { texto: `Proposta da ${p.equipe} para correr a ${nomeCategoria20(p.categoria)} em ${anoDe(v.t) + 1}${p.salario ? `, salário de ${fmt(p.salario)} por ano` : ''}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
}

export function salarioF1(v: Vida, a: Auto20, forca: number, t?: Temporada20): number {
  const nome = v.notoriedade?.valor ?? 0;
  const base = 5000000 + Math.max(0, forca - 60) * 400000 + a.titulos * 1500000 + (t?.categoria === 'f1' ? (Math.max(0, 11 - t.posicao)) * 1800000 : 0) + nome * 150000;
  return Math.round(base / 100000) * 100000;
}

function renovacaoF1(v: Vida, a: Auto20, t: Temporada20, r: Rng): void {
  const contra = t.companheiroPos ? t.posicao - t.companheiroPos : 0;
  const fimDoContrato = (a.contratoAte ?? t.ano) <= t.ano;
  const forca = forcaDaEquipe(v, 'f1', a.equipe, t.ano);
  // A equipe espera o que o carro dá: o piloto que fica atrás do companheiro e longe dos pontos perde a vaga.
  const esperado = Math.round(22 - (forca - 55) / 2.2);
  const mal = t.posicao > esperado + 4 || contra > 6;
  if (fimDoContrato) {
    if (mal && r.chance(0.7)) {
      escrever(v, { texto: `A ${a.equipe} não renovou: ${t.posicao}º no campeonato${contra > 0 ? `, atrás de ${a.companheiro}` : ''}.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
      // Outra equipe, pior, às vezes abre a porta; senão, fora do grid.
      if (r.chance(0.35)) { const eq = EQUIPES.f1[7 + Math.floor(r.next() * 4)]; a.proposta = { categoria: 'f1', equipe: eq, forca: forcaDaEquipe(v, 'f1', eq, t.ano + 1), validaAte: v.t + 11 }; a.proposta.salario = salarioF1(v, a, a.proposta.forca, t); escreverProposta(v, a); }
      else encerrar(v, a, 'sem_vaga');
      return;
    }
    a.contratoAte = t.ano + (t.posicao <= 5 ? 3 : 2);
    a.salario = salarioF1(v, a, forca, t);
    atualizarEmprego(v, a);
    escrever(v, { texto: `Renovou com a ${a.equipe} até ${a.contratoAte}: ${fmt(a.salario)} por ano.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  }
  // Os bons resultados atraem as equipes de ponta.
  if (t.posicao <= 6 && forca < 85 && r.chance(0.35)) {
    const eq = EQUIPES.f1[Math.floor(r.next() * 3)];
    if (eq !== a.equipe) { a.proposta = { categoria: 'f1', equipe: eq, forca: forcaDaEquipe(v, 'f1', eq, t.ano + 1), validaAte: v.t + 11 }; a.proposta.salario = salarioF1(v, a, a.proposta.forca, t); escreverProposta(v, a); }
  }
  if (idade(v) >= 38 && r.chance(0.4)) encerrar(v, a, 'idade');
}

function mudarDeEquipe(v: Vida, a: Auto20, p: Proposta20): void {
  const subiu = p.categoria !== a.fase;
  a.fase = p.categoria;
  a.equipe = p.equipe;
  a.desde = v.t;
  a.companheiro = undefined;
  if (p.categoria === 'f1') {
    a.salario = p.salario;
    a.contratoAte = anoDe(v.t) + 2;
    atualizarEmprego(v, a);
  }
  escrever(v, { texto: subiu ? (p.categoria === 'f1' ? `A Fórmula 1. Contrato assinado com a ${p.equipe}: o sonho do kart virou um carro no grid.` : `Subiu para a ${nomeCategoria20(p.categoria)}, pela ${p.equipe}.`) : `Trocou de equipe: a partir da próxima temporada, ${p.equipe}.`, relevancia: p.categoria === 'f1' ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
}

function atualizarEmprego(v: Vida, a: Auto20): void {
  const oc = ocupacao('piloto_corrida');
  const r = rngDe(v.id, 'auto20_emprego', v.t);
  if (!v.trabalho.atual || v.trabalho.atual.ocupacaoId !== 'piloto_corrida') contratar(v, r, oc, 'oportunidade');
  const e = v.trabalho.atual!;
  e.empregador = a.equipe;
  e.salario = Math.round((a.salario ?? 5000000) / 12 / 100) * 100;
}

function encerrar(v: Vida, a: Auto20, motivo: NonNullable<Auto20['motivoFim']>): void {
  a.fase = 'encerrada';
  a.motivoFim = motivo;
  a.fim = v.t;
  a.proposta = undefined;
  if (v.trabalho.atual?.ocupacaoId === 'piloto_corrida') encerrarEmprego(v, 'fim da carreira de piloto');
  const ult = a.temporadas?.[a.temporadas.length - 1];
  const chegou = (a.temporadas ?? []).some(x => x.categoria === 'f1');
  const texto = motivo === 'escolha' ? `Pendurou o capacete aos ${idade(v)}.` : motivo === 'orcamento' ? `Sem orçamento para seguir, a carreira nas pistas parou aos ${idade(v)}.` : motivo === 'sem_vaga' ? `Sem vaga no grid${chegou ? ' da Fórmula 1' : ''}, a carreira de piloto terminou aos ${idade(v)}.` : motivo === 'resultados' ? `Depois de temporadas sem resultado, desistiu da carreira de piloto aos ${idade(v)}.` : `Aposentou-se das pistas aos ${idade(v)}.`;
  escrever(v, { texto: `${texto}${chegou ? ` Na Fórmula 1: ${a.largadas} largadas no total da carreira, ${a.vitorias} vitórias, ${a.titulos} títulos.` : ult ? ` A última categoria foi a ${nomeCategoria20(ult.categoria)}.` : ''}`, relevancia: 'marco', tema: 'trabalho' });
}

/* ------------------------------------------------------------------ fama: o motivo do nome */
registrarMotivoDoNome(v => {
  const a = v.automobilismo20;
  if (!a || !a.temporadas?.length) return undefined;
  const ult = a.temporadas[a.temporadas.length - 1];
  const f1 = a.temporadas.filter(t => t.categoria === 'f1');
  if (a.fase === 'encerrada') {
    const legado = Math.min(70, f1.length * 2 + a.vitorias * (f1.length ? 1.2 : 0) + f1.filter(t => t.titulo).length * 18);
    return legado > 2 ? { valor: legado, fonte: 'esporte' } : undefined;
  }
  const peso = { kart: 2, entrada: 4, f4: 8, regional: 12, f3: 18, f2: 26, f1: 52 }[a.fase as Categoria20] ?? 0;
  const resultado = Math.max(0, 12 - ult.posicao) * (a.fase === 'f1' ? 2.2 : 0.8) + (ult.titulo ? (a.fase === 'f1' ? 25 : 6) : 0);
  return { valor: Math.min(98, peso + resultado + f1.filter(t => t.titulo).length * 8), fonte: 'esporte' };
});

/* ------------------------------------------------------------------ leitura para a tela */
export function leituraAuto20(v: Vida) {
  const a = v.automobilismo20;
  if (!a) return undefined;
  const ano = anoDe(v.t);
  const cat = a.fase === 'encerrada' ? undefined : (a.fase as Categoria20);
  return {
    a, cat, nome: cat ? nomeCategoria20(cat) : 'Carreira encerrada', nivel: Math.round(nivelDoPiloto(a)),
    forcaEquipe: cat ? forcaDaEquipe(v, cat, a.equipe, ano) : undefined,
    sl: pontosDeSuperlicenca(a, ano - 1), slNecessario: SUPERLICENCA,
    orcamento: cat && cat !== 'f1' ? orcamentoDaTemporada(v, a) : undefined,
    proposta: a.proposta && v.t <= a.proposta.validaAte ? a.proposta : undefined,
    caminho: ORDEM.map(c => ({ c, nome: nomeCategoria20(c), idade: CATEGORIAS20[c].idadeMin, feita: (a.temporadas ?? []).some(t => t.categoria === c), atual: c === a.fase }))
  };
}

/** Saves: o estado é opcional; o que vier quebrado sai. */
export function normalizarVida20Auto(v: Vida): void {
  const a = v.automobilismo20;
  if (!a) return;
  if (typeof a !== 'object' || !a.atributos || !ORDEM.concat(['encerrada' as Categoria20]).includes(a.fase as Categoria20)) { delete v.automobilismo20; return; }
  a.temporadas ??= [];
}

