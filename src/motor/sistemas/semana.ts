/**
 * A semana: FONTE ÚNICA do tempo livre.
 *
 * A interface desenha a semana com estes números e o motor decide se uma
 * atividade cabe com estes mesmos números — não existe um cálculo para a
 * tela e outro para a regra.
 *
 * Unidade: um "pedaço" da semana. 0,5 é uma vez por semana; 1, algumas vezes;
 * 2, quase todo dia. Uma criança tem uns 2 pedaços além da escola; um
 * adolescente, 3; um adulto, 3,5. Trabalho, faculdade, filhos pequenos e
 * quem precisa de cuidado em casa ocupam parte disso antes de qualquer
 * escolha. O trajeto de todo dia também — e o que se tem (carro, moto,
 * bicicleta) muda quanto (`sistemas/transporte`).
 */

import type { Vida } from '../tipos';
import { filhos, idade, idadePessoa, moraCom, vinculosVivos } from '../nucleo';
import { deslocamento } from './transporte';
import { curso } from '../dados/cursos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { listaNatural } from '../texto';
import { animal } from '../dados/animais';
import { atividadeExiste, modeloRotina, nivelDa, nivelModelo, ROTINAS } from './rotinas';
import { pesoDoRitmoNaSemana, ritmoDe } from './ritmo';
import { semanaDaPolitica } from './politica';

export interface Compromisso {
  id: string;
  rotulo: string;
  /** REWORK 9.5 · ROT-01: a EXIGÊNCIA (o que a coisa cobra da semana: duração × intensidade). É ela que enche a semana. */
  peso: number;
  /** O TEMPO (a frequência, em pedaços: 0,5 uma vez por semana · 1 algumas vezes · 2 quase todo dia) — as palavras de `dose`. */
  tempo: number;
  /** Quanto da exigência pesa na cabeça (0..1): o treino cansa o corpo mais do que a cabeça; a apostila, o contrário. */
  mental: number;
  tipo: 'trabalho' | 'estudo' | 'filhos' | 'cuidado' | 'deslocamento' | 'rotina';
}

export interface Semana {
  /** Tempo que existiria sem nenhum compromisso fixo. */
  base: number;
  /** O que ocupa a semana antes de qualquer escolha (trabalho, faculdade, filhos...). */
  fixos: Compromisso[];
  /** Tempo devolvido (condução própria). */
  ganhos: Compromisso[];
  /** O que sobra para escolher: base − fixos + ganhos (nunca menos de 0,5). */
  capacidade: number;
  /** As atividades escolhidas. */
  rotinas: Compromisso[];
  /** A exigência das atividades (não a quantidade delas). */
  ocupado: number;
  livre: number;
}

/**
 * REWORK 9.5 · ROT-01/ROT-02 — A EXIGÊNCIA DE UMA ATIVIDADE (não a quantidade de atividades).
 *
 * O playtest: escola, futebol duas vezes, leitura e xadrez — e "não cabe mais nada", com a agenda cheia de horas
 * livres. A conta somava FREQUÊNCIAS (um livro por mês pesava como meio treino de futebol). Agora cada atividade cobra
 * pelo que exige: a duração e a frequência (`tempo`) vezes a intensidade da categoria (o esporte e o bico cansam; a
 * leitura e o tabuleiro, pouco), e o nível a sério cobra um pouco mais por vez. A parte MENTAL é o que pesa na cabeça
 * (o estresse); o resto é cansaço do corpo — que pede descanso, mas não enche a cabeça.
 */
const INTENSIDADE: Record<string, { carga: number; mental: number }> = {
  esporte: { carga: 0.95, mental: 0.3 }, corpo: { carga: 0.8, mental: 0.2 }, arte: { carga: 0.7, mental: 0.5 }, estudo: { carga: 0.8, mental: 0.9 },
  oficio: { carga: 0.75, mental: 0.5 }, social: { carga: 0.6, mental: 0.5 }, lazer: { carga: 0.4, mental: 0.2 }, cuidado: { carga: 0.45, mental: 0.4 }, renda: { carga: 1.1, mental: 0.8 }
};
const INTENSIDADE_DE: Record<string, { carga: number; mental: number }> = {
  leitura: { carga: 0.45, mental: 0.5 }, xadrez: { carga: 0.6, mental: 0.8 }, videogame: { carga: 0.35, mental: 0.3 }, terapia: { carga: 0.3, mental: 0 },
  tempo_familia: { carga: 0.4, mental: 0.2 }, igreja: { carga: 0.4, mental: 0.1 }, cursinho: { carga: 1.15, mental: 1 }, estudar_concurso: { carga: 1.05, mental: 1 },
  reforco: { carga: 0.7, mental: 0.8 }, desenho: { carga: 0.55, mental: 0.3 }, escrever: { carga: 0.6, mental: 0.6 }, corrida: { carga: 0.7, mental: 0.1 }
};
/** O que se faz em casa (sem ida e volta, sem hora marcada de outra pessoa). */
const EM_CASA = new Set(['leitura', 'videogame', 'escrever', 'desenho', 'terapia', 'criar_conteudo', 'tempo_familia', 'cozinhar', 'programacao', 'ajudar_familia']);
/** A logística de sair de casa para cada vez (ir, voltar, trocar de roupa, depender de horário alheio). */
const LOGISTICA = 0.1;
/**
 * REWORK 9.7 · ROT-04: a aula de esporte da criança (até 11 anos, sem ser a sério) dura uma hora, não uma hora e meia —
 * e a agenda e a exigência leem a mesma duração (antes, a agenda punha 90 minutos e a exigência ignorava a duração).
 */
export const aulaCurtaDaCrianca = (id: string, nivel: number, idadeDe?: number) => idadeDe !== undefined && idadeDe < 12 && nivel <= 2 && modeloRotina(id)?.categoria === 'esporte';
export function cargaDaAtividade(id: string, nivel: number, idadeDe?: number): { carga: number; mental: number; tempo: number } {
  const mo = modeloRotina(id);
  if (!mo) return { carga: 0, mental: 0, tempo: 0 };
  const tempo = nivelModelo(mo, nivel).tempo;
  const k = INTENSIDADE_DE[id] ?? INTENSIDADE[mo.categoria] ?? { carga: 0.8, mental: 0.5 };
  // O nível a sério (a base, a equipe de competição, o ensaio de verdade) cobra mais por vez, além de ser mais vezes.
  const serio = nivel >= 3 ? 1.1 : 1;
  const fora = EM_CASA.has(id) ? 0 : LOGISTICA;
  const duracao = aulaCurtaDaCrianca(id, nivel, idadeDe) ? 2 / 3 : 1;
  return { carga: Math.round(tempo * (k.carga * serio * duracao + fora) * 100) / 100, mental: k.mental, tempo };
}

/** REWORK 9.5 · ROT-03 — o estudo em casa que a postura escolhida pede (dedicação = horas de verdade na semana). */
export const ESTUDO_EM_CASA = { tempo: 0.75, carga: 0.6 };
/** Quem está estudando (a escola básica ou um curso) — a postura só vale para quem estuda. */
export const estudaAgora = (v: Vida) => (!!v.educacao.basica && !v.educacao.evadiu) || (!!v.educacao.matricula && !v.educacao.matricula.trancado);

export function baseDaSemana(i: number): number {
  if (i < 5) return 1;
  if (i < 12) return 2;
  if (i < 18) return 3;
  if (i < 80) return 3.5;
  return 2.5;
}

export function semana(v: Vida): Semana {
  const i = idade(v);
  const base = baseDaSemana(i);
  const fixos: Bruto[] = [];
  const ganhos: Bruto[] = [];

  const e = v.trabalho.atual;
  const j = v.justica;
  if (j?.prisao) {
    // A unidade toma a semana quase inteira; sobra ler, escrever, rezar, estudar lá dentro.
    fixos.push({ id: 'prisao', rotulo: j.prisao.regime === 'fechado' ? 'A rotina da unidade prisional' : 'O semiaberto (trabalho de dia, a unidade à noite)', peso: Math.max(0, base - (j.prisao.regime === 'fechado' ? 1 : 1.25)), tipo: 'cuidado' });
  }
  if (j?.alternativa) fixos.push({ id: 'pena', rotulo: 'Prestação de serviços à comunidade', peso: 0.5, tipo: 'cuidado' });
  const pa = v.trabalho.pausa;
  if (pa) {
    const quem = pa.pessoaId ? v.pessoas[pa.pessoaId] : undefined;
    fixos.push({ id: 'cuidado_pausa', rotulo: pa.motivo === 'casa' ? 'A casa e a família' : `Cuidar de ${quem?.nome ?? 'quem depende de você'}`, peso: pa.intensidade === 'total' ? 1.5 : 0.75, tipo: 'cuidado' });
  }
  if (e) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    const nome = oc ? (v.eu.genero === 'feminino' ? oc.nome[1] : oc.nome[0]) : 'trabalho';
    let peso = e.carga === 'integral' ? 1.5 : 0.75;
    if (e.reduzida) peso = 0.9;
    if (oc?.jornada === 'longa') peso += 0.5;
    if (oc?.jornada === 'fora') peso += 0.75;
    // Plantão: menos dias, mas noites e fins de semana (um pouco mais que o expediente).
    if (oc?.jornada === 'plantao') peso += 0.25;
    peso = Math.max(0.5, peso + pesoDoRitmoNaSemana(e));
    if (e.formacaoAte) peso = 2;
    const ritmo = ritmoDe(e) === 'puxado' ? ', ritmo puxado' : ritmoDe(e) === 'leve' ? ', ritmo leve' : '';
    fixos.push({ id: 'trabalho', rotulo: e.formacaoAte ? `Curso de formação (${nome})` : `Trabalho (${nome}${oc?.jornada === 'fora' ? ', dias fora de casa' : oc?.jornada === 'longa' ? ', jornada longa' : oc?.jornada === 'plantao' ? ', em plantões' : e.reduzida ? ', jornada reduzida' : e.carga === 'parcial' ? ', meio período' : ''}${ritmo})`, peso, tipo: 'trabalho' });
    if (v.trabalho.horasExtras) fixos.push({ id: 'horas_extras', rotulo: 'Horas extras', peso: 0.5, tipo: 'trabalho' });
  }
  // A trajetória em paralelo também é semana (menos que a principal: são alguns trabalhos, não o expediente).
  const par = v.trabalho.paralela;
  if (par) {
    const oc = ocupacaoOuNula(par.ocupacaoId);
    const nome = oc ? (v.eu.genero === 'feminino' ? oc.nome[1] : oc.nome[0]) : 'trabalho';
    fixos.push({ id: 'paralela', rotulo: `${nome.charAt(0).toUpperCase() + nome.slice(1)} (em paralelo)`, peso: 0.6, tipo: 'trabalho' });
  }
  // O negócio tocado nas horas vagas também é semana (menos, se há equipe ou sócio no dia a dia).
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado' && (n.dedicacao ?? 'integral') === 'paralela') {
    const ajuda = (n.equipe?.length ?? 0) > 0 || !!n.socioId;
    fixos.push({ id: 'negocio', rotulo: n.passivo ? `${n.nome} (de longe)` : `${n.nome} (nas horas vagas)`, peso: n.passivo ? 0.25 : ajuda ? 0.5 : 0.75, tipo: 'trabalho' });
  }
  const pol = semanaDaPolitica(v);
  if (pol) fixos.push({ id: 'politica', rotulo: pol.rotulo, peso: pol.peso, tipo: 'trabalho' });
  const b = v.educacao.basica;
  if (b?.integrado) fixos.push({ id: 'integrado', rotulo: 'Médio integrado ao técnico (dia inteiro)', peso: 0.75, tipo: 'estudo' });
  const m = v.educacao.matricula;
  if (m && !m.trancado) {
    const c = curso(m.cursoId);
    const peso = m.modalidade === 'ead' ? 0.5 : c.carga === 'integral' ? 1.5 : 0.75;
    fixos.push({ id: 'curso', rotulo: `${c.nivel === 'superior' ? 'Faculdade' : 'Curso'} (${c.nome}${m.modalidade === 'ead' ? ', a distância' : c.carga === 'integral' ? ', período integral' : ''})`, peso, tipo: 'estudo' });
  }
  const casa = filhos(v).filter(f => v.vinculos[f.id]?.convivio.includes('casa'));
  const pequenos = casa.filter(f => idadePessoa(v, f) < 6).length;
  const escolares = casa.filter(f => idadePessoa(v, f) >= 6 && idadePessoa(v, f) < 12).length;
  if (pequenos) fixos.push({ id: 'filhos_pequenos', rotulo: pequenos === 1 ? 'Um filho pequeno em casa' : `${pequenos} filhos pequenos em casa`, peso: Math.min(1.5, pequenos * 0.75), tipo: 'filhos' });
  if (escolares) fixos.push({ id: 'filhos_escola', rotulo: escolares === 1 ? 'Um filho em idade escolar' : `${escolares} filhos em idade escolar`, peso: Math.min(0.5, escolares * 0.25), tipo: 'filhos' });
  if (i >= 18) {
    const cuidar = moraCom(v).filter(p => {
      const par = v.vinculos[p.id]?.parentesco;
      return (par === 'mae' || par === 'pai' || par === 'avo' || par === 'sogro') && idadePessoa(v, p) >= 75 && p.saude < 45;
    });
    if (cuidar.length && !(pa && cuidar.some(p => p.id === pa.pessoaId))) fixos.push({ id: 'cuidar', rotulo: `Cuidar de ${listaNatural(cuidar.map(p => p.nome))}`, peso: 0.5 * cuidar.length, tipo: 'cuidado' });
  }
  // Bicho pede tempo: o passeio do cachorro todo dia, a conversa com o papagaio, a gaiola, o aquário (quem cuida é a casa inteira, mas o tempo sai de alguém).
  if (i >= 18) {
    const bichos = vinculosVivos(v).filter(x => x.p.especie && x.vin.convivio.includes('casa') && x.p.pet?.tutor === 'eu' && animal(x.p.especie).semana > 0).map(x => x.p);
    if (bichos.length) {
      const peso = Math.min(0.75, bichos.reduce((s, p) => s + animal(p.especie).semana, 0)) * (moraCom(v).some(p => idadePessoa(v, p) >= 12) ? 0.5 : 1);
      const caes = bichos.filter(p => p.especie === 'cachorro');
      const rotulo = caes.length === bichos.length ? (caes.length === 1 ? `Passear com ${caes[0].nome}` : `Passear com ${listaNatural(caes.map(p => p.nome))}`) : `Cuidar de ${listaNatural(bichos.map(p => p.nome))}`;
      if (peso >= 0.05) fixos.push({ id: 'pets', rotulo, peso: Math.round(peso * 100) / 100, tipo: 'cuidado' });
    }
  }
  // O trajeto de todo dia, do jeito que a pessoa vai (carro, moto, bicicleta, ônibus, a pé): a mesma conta da tela e do orçamento.
  const d = deslocamento(v);
  if (d && d.peso >= 0.02) fixos.push({ id: 'deslocamento', rotulo: d.rotulo, peso: d.peso, tipo: 'deslocamento' });

  // REWORK 9.5 · ROT-03: a dedicação à escola é tempo de verdade — o estudo em casa entra na semana (e na agenda, onde
  // precisa achar horário); estudar só o mínimo devolve tempo. "No ritmo" é o dever de casa de sempre (já está na base).
  if (estudaAgora(v) && !j?.prisao) {
    if (v.educacao.postura === 'dedicada') fixos.push({ id: 'estudo_casa', rotulo: 'Estudar em casa (com dedicação)', peso: ESTUDO_EM_CASA.carga, tipo: 'estudo' });
    else if (v.educacao.postura === 'relaxada') ganhos.push({ id: 'estudo_minimo', rotulo: 'Estudar só o mínimo', peso: 0.25, tipo: 'estudo' });
  }

  const comp = (x: Bruto): Compromisso => ({ ...x, tempo: x.id === 'estudo_casa' ? ESTUDO_EM_CASA.tempo : x.peso, mental: MENTAL_DO_TIPO[x.tipo] });
  const capacidade = Math.max(0.5, base - fixos.reduce((s, x) => s + x.peso, 0) + ganhos.reduce((s, x) => s + x.peso, 0));
  const rotinas: Compromisso[] = v.rotinas.map(r => {
    const mo = modeloRotina(r.id);
    const n = mo ? nivelModelo(mo, nivelDa(r)) : undefined;
    const c = cargaDaAtividade(r.id, nivelDa(r), i);
    return { id: r.id, rotulo: mo ? (mo.niveis.length > 1 ? `${mo.nome} — ${n!.rotulo.toLowerCase()}` : mo.nome) : r.id, peso: c.carga, tempo: c.tempo, mental: c.mental, tipo: 'rotina' as const };
  });
  const ocupado = rotinas.reduce((s, x) => s + x.peso, 0);
  return { base, fixos: fixos.map(comp), ganhos: ganhos.map(comp), capacidade, rotinas, ocupado, livre: capacidade - ocupado };
}

type Bruto = Omit<Compromisso, 'tempo' | 'mental'>;
/** Quanto de cada compromisso fixo pesa na cabeça (o resto é cansaço do corpo e tempo que não volta). */
const MENTAL_DO_TIPO: Record<Compromisso['tipo'], number> = { trabalho: 0.75, estudo: 0.85, filhos: 0.6, cuidado: 0.7, deslocamento: 0.4, rotina: 0.5 };

/**
 * REWORK 9.5 · ROT-03 — o cansaço de uma rotina que passa do que se aguenta (a exigência da semana): estuda-se pior.
 * Proporcional, e só quando passa — uma semana movimentada que cabe não cobra nada. O ano passa para a escola e o curso.
 */
export function cansacoNosEstudos(v: Vida): number {
  const f = encaixe(v, 0).faixa;
  return f === 'alem' ? -5 : f === 'sobrecarregada' ? -3 : 0;
}

/** Palavras para um pedaço de semana. */
export function dose(peso: number): string {
  if (peso <= 0.5) return 'uma vez por semana';
  if (peso <= 1) return 'algumas vezes por semana';
  if (peso <= 1.6) return 'quase dia sim, dia não';
  return 'quase todo dia';
}

/**
 * Cabe mais `extra` na semana? Se não, explica: o que já ocupa, quanto a
 * atividade pede e o que teria de sair ou diminuir.
 */
export function cabeNaSemana(v: Vida, extra: number, ignorar?: string): { cabe: true } | { cabe: false; motivo: string } {
  const s = semana(v);
  if (extra <= 0 || s.ocupado + extra <= s.capacidade + 0.01) return { cabe: true };
  const pesados = s.fixos.filter(f => f.peso >= 0.5).map(f => f.rotulo.replace(/ \(.*\)$/, '').toLowerCase());
  const outras = s.rotinas.filter(r => r.id !== ignorar).map(r => r.rotulo.replace(/ — .*/, '').toLowerCase());
  const ocupam = listaNatural([...pesados, ...outras]);
  const falta = s.ocupado + extra - s.capacidade;
  const soltar = s.rotinas.filter(r => r.id !== ignorar && r.peso >= falta - 0.01).sort((a, b) => a.peso - b.peso)[0];
  const pede = `Isso pede ${dose(extra)}`;
  if (!ocupam) return { cabe: false, motivo: `Não cabe na semana. ${pede}, e o tempo livre é pouco.` };
  const saida = soltar ? ` Para caber, seria preciso largar ou diminuir ${soltar.rotulo.replace(/ — .*/, '').toLowerCase()}.` : s.rotinas.length ? ' Seria preciso largar mais de uma coisa.' : s.fixos.length ? ' Sobra pouco além disso.' : '';
  return { cabe: false, motivo: `Sua semana já está cheia: ${ocupam}. ${pede}.${saida}` };
}

/**
 * REWORK 4: o teto HUMANO da semana (não o confortável). "Cabe" (`cabeNaSemana`) diz o que entra sem apertar; isto
 * diz o que uma pessoa consegue TENTAR: faculdade + emprego, trabalho + curso + filhos, dá — e cobra (estresse,
 * sobrecarga, notas, saúde: `estado`, `sobrecarga`, `estresseProlongado`). Cinco empregos integrais, duas faculdades
 * integrais e um contrato de atleta ao mesmo tempo, não: passam deste teto.
 */
export const TETO_HUMANO = 1.55;
/** O teto pela idade: criança não "se sobrecarrega" por escolha (os pais não levam a três coisas por dia) — a semana
 *  dela pode encher, não estourar. Do pré-adolescente em diante, o teto humano. */
// REWORK 9.7 · ROT-04: o teto da criança era base + 0,75 — exatamente onde a semana "cheia" acaba: a faixa
// "sobrecarregada" não existia para ela, e a 3ª atividade de uma criança de 9 anos sem compromisso nenhum era recusada
// (~6 h de esporte por semana). Agora há meio pedaço de "sobrecarregada", com o custo de sempre (o treino rende menos,
// a nota cai, a cabeça pesa): quatro aulas de uma hora cabem com o preço dito; a quinta, não.
const tetoDa = (i: number, base: number) => (i < 12 ? base + 1.25 : base * TETO_HUMANO);
export function cargaHumana(v: Vida, extra: number): { possivel: boolean; aperta: boolean } {
  const e = encaixe(v, extra);
  return { possivel: e.possivel, aperta: e.faixa !== 'folgada' && e.faixa !== 'ocupada' };
}

/**
 * FIX pós-playtest humano — A SEMANA EM FAIXAS, FONTE ÚNICA de tudo o que diz "cabe": o painel "Dá para assumir
 * mais?", a lista de atividades (`podeComecarRotina`), o título de Tempo livre, a faixa desenhada e os testes.
 *
 * O playtest viu "Cabe." no painel e, na mesma tela, as atividades em "caberia com mais tempo": eram três contas
 * (pontos de sobrecarga, teto humano com 0,5 fixo e uma trava de idade só na lista). Agora há UMA conta, e ela separa
 * três coisas que a tela misturava:
 *
 *   TEMPO (esta conta) ≠ SOBRECARGA (o que a semana cobra por ano: `estado`, `sobrecarga`) ≠ ESTRESSE (a cabeça hoje).
 *
 *   folgada        — sobra tempo de verdade (≥ 1 pedaço livre): entra sem pensar.
 *   ocupada        — entra; sobra menos tempo livre.
 *   cheia          — entra, tirando do descanso e do lazer (até ¾ de pedaço além do confortável).
 *   sobrecarregada — ainda dá para assumir, com custo claro: estresse, sono, notas, trabalho — o mundo cobra depois.
 *   alem           — não há horas: passa do teto humano (ou, criança, do que a semana dela comporta). Só aqui bloqueia.
 *
 * Não é uma barra de energia: ninguém "gasta" nada para agir. É o tamanho da semana.
 */
export type FaixaDaSemana = 'folgada' | 'ocupada' | 'cheia' | 'sobrecarregada' | 'alem';
export const PALAVRA_DA_FAIXA: Record<FaixaDaSemana, string> = { folgada: 'folgada', ocupada: 'ocupada', cheia: 'cheia', sobrecarregada: 'sobrecarregada', alem: 'no teto' };
export const ORDEM_DA_FAIXA: FaixaDaSemana[] = ['folgada', 'ocupada', 'cheia', 'sobrecarregada', 'alem'];
/** Quanto do descanso a semana "cheia" ainda come sem passar a sobrecarregar. */
export const MARGEM_DO_DESCANSO = 0.75;

export interface Encaixe {
  /** A faixa da semana DEPOIS de somar `extra`. */
  faixa: FaixaDaSemana;
  /** Dá para assumir (tudo menos "além")? */
  possivel: boolean;
  /** Folga depois de somar (negativa: o que passa do confortável, em pedaços). */
  folga: number;
  /** Total que a semana carrega (fixos + escolhas + extra) e o teto humano dela. */
  total: number;
  teto: number;
  /** O preço, em palavras (cheia / sobrecarregada), ou o porquê do "não" (além). */
  motivo?: string;
}

export function encaixe(v: Vida, extra: number, ignorar?: string): Encaixe {
  const s = semana(v);
  const i = idade(v);
  const somaFixos = s.fixos.reduce((a, x) => a + x.peso, 0) - s.ganhos.reduce((a, x) => a + x.peso, 0);
  // `ignorar`: a atividade que está mudando de nível (o peso dela já entra no `extra`, pela diferença).
  const ocupado = s.ocupado;
  // A folga usa a capacidade CRUA (sem o piso de meio pedaço): quando os fixos já passam da semana, isso aparece.
  const folga = s.base - somaFixos - ocupado - Math.max(0, extra);
  const total = somaFixos + ocupado + Math.max(0, extra);
  const teto = tetoDa(i, s.base);
  const faixa: FaixaDaSemana = folga >= 1 - 0.01 ? 'folgada' : folga >= -0.01 ? 'ocupada' : folga >= -MARGEM_DO_DESCANSO - 0.01 ? 'cheia' : total <= teto + 0.01 ? 'sobrecarregada' : 'alem';
  const e: Encaixe = { faixa, possivel: faixa !== 'alem', folga, total, teto };
  if (faixa === 'folgada' || faixa === 'ocupada') return e;
  // O porquê, sempre com nome: o que já ocupa os dias (os fixos que pesam e as escolhas) — o jogador entende a conta.
  const pesados = s.fixos.filter(f => f.peso >= 0.5).map(f => f.rotulo.replace(/ \(.*\)$/, '').toLowerCase());
  const outras = s.rotinas.filter(r => r.id !== ignorar).map(r => r.rotulo.replace(/ — .*/, '').toLowerCase());
  const ocupam = listaNatural([...pesados, ...outras]);
  const ja = ocupam ? `Sua semana já está cheia: ${ocupam}. ` : '';
  if (faixa === 'cheia') e.motivo = `${ocupam ? `A rotina já é movimentada (${ocupam}): c` : 'C'}abe, tirando um pouco do descanso e do lazer.`;
  else if (faixa === 'sobrecarregada') e.motivo = `${ja}Dá para assumir — mas passa do que se aguenta descansando: o cansaço e a cabeça cobram (estresse, sono, notas, trabalho).`;
  else {
    const falta = total - teto;
    const soltar = s.rotinas.filter(r => r.id !== ignorar && r.peso >= falta - 0.01).sort((a, b) => a.peso - b.peso)[0];
    // REWORK 9.5 · ROT-01: o "não" daqui é de DESCANSO (o que um corpo aguenta numa semana), não de horário — o horário é
    // da agenda (`agenda.horarioDaAtividade`), que diz quando não há hora livre.
    const porque = i < 12 ? `Descanso insuficiente: com ${i} anos, ${ocupam || 'a escola'} já ${ocupam.includes(' e ') ? 'pedem' : 'pede'} o que a semana de uma criança aguenta — sobrariam horários, não fôlego.` : `Descanso insuficiente: ${ocupam ? `${ocupam} já tomam` : 'os compromissos já tomam'} o que uma pessoa aguenta numa semana.`;
    const saida = soltar ? ` Para caber, seria preciso largar ou diminuir ${soltar.rotulo.replace(/ — .*/, '').toLowerCase()}.` : s.rotinas.length ? ' Seria preciso largar mais de uma coisa.' : '';
    e.motivo = `${porque}${saida}`;
  }
  return e;
}

/** A faixa da semana como está. */
export const faixaDaSemana = (v: Vida): FaixaDaSemana => encaixe(v, 0).faixa;

/** O pedaço mais leve que uma atividade nova pede (uma vez por semana). */
export const PEDACO_LEVE = 0.5;

/**
 * REWORK 9.5 · ROT-02: a exigência da atividade leve mais leve que existe para esta pessoa (uma vez por semana, a de
 * menor intensidade) — é ela que diz se "ainda cabe uma coisa leve". Antes, meio pedaço fixo (o tempo, não a exigência).
 */
export function cargaLeve(v: Vida): number {
  let menor = Infinity;
  for (const m of ROTINAS) {
    if (m.id === 'terapia' || m.niveis[0].tempo > PEDACO_LEVE || v.rotinas.some(r => r.id === m.id) || !atividadeExiste(v, m)) continue;
    menor = Math.min(menor, cargaDaAtividade(m.id, 1).carga);
  }
  return Number.isFinite(menor) ? menor : PEDACO_LEVE;
}

/**
 * "Dá para assumir mais?" — a resposta do painel, da MESMA conta que a lista de atividades usa. Se diz que dá, ao
 * menos uma atividade leve é selecionável pelo descanso; se diz que não dá, nenhuma é. (O HORÁRIO é outra leitura: a
 * agenda diz quando não há hora livre — `agenda.horarioDaAtividade`.)
 */
export function folegoDaSemana(v: Vida): { faixa: FaixaDaSemana; palavra: string; texto: string; leve: Encaixe } {
  const agora = encaixe(v, 0);
  const leve = encaixe(v, cargaLeve(v));
  const terapia = idade(v) >= 14 ? ' (Cuidar da cabeça — a terapia, uma hora por semana — ainda cabe.)' : '';
  const texto = !leve.possivel ? (agora.faixa === 'alem' ? `A rotina passou do que se aguenta: falta descanso. Algo vai ter de sair ou diminuir.${terapia}` : `A rotina chegou no limite do descanso: outra coisa só entra se algo sair ou diminuir.${terapia}`)
    : leve.faixa === 'folgada' ? 'A rotina é leve: dá para assumir uma ou duas coisas sem apertar.'
      : leve.faixa === 'ocupada' ? 'Cabe mais uma coisa leve sem apertar.'
        : leve.faixa === 'cheia' ? 'Dá para assumir mais — tirando do descanso e do lazer.'
          : 'Dá para assumir mais, mas a rotina já passa do que se aguenta descansando: cada coisa nova cobra cansaço, sono e desempenho.';
  return { faixa: agora.faixa, palavra: PALAVRA_DA_FAIXA[agora.faixa], texto, leve };
}
