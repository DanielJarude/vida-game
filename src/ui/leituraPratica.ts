/**
 * REWORK 7 — A PRÁTICA: como a interface LÊ uma atividade que a pessoa mantém na semana. Não é uma segunda
 * simulação: tudo aqui é derivado do estado que o motor já guarda e já usa para decidir o ano —
 *
 *   a rotina          desde quando está na semana, a dedicação (o nível), o custo, quanto da semana toma
 *   as frentes        o que ela pratica: o estágio da habilidade (as seis palavras de `dados/frentes`), o auge, os
 *                     anos de prática de verdade (`anosDePratica`), as retomadas
 *   o bem-estar       o que faz com a cabeça e o humor (`estado.BEM_ESTAR`, a mesma tabela do equilíbrio anual)
 *   o corpo e a mente o que conta como treino e como estímulo (`pessoa.estimuloFisico/Cognitivo`)
 *   as pessoas        quem você conheceu ali (o vínculo guarda o ambiente: `rotina:<id>:<cidade>`)
 *   as coisas         o que é seu e rende nessa prática (`coisas.ajuda`) — e o que existe na loja para isso
 *   a história        as marcas do caminho dessa frente, os marcos da vivência (o time, a olimpíada), os anos de palco
 *   as portas         as oportunidades abertas para essa frente
 *
 * A tela de Tempo livre, a ficha da atividade e os testes leem esta mesma função: o que aparece num lugar não pode
 * contradizer o outro.
 */

import type { Dominio, Frente, Oportunidade, Pessoa, Rotina, Vida, Vinculo, CoisaTida } from '../motor/tipos';
import { modeloRotina, nivelDa, nivelModelo, custoDaRotina, type ModeloRotina } from '../motor/sistemas/rotinas';
import { estagioDe, modeloFrente, MATERIAS } from '../motor/dados/frentes';
import { anosDePratica, leituraDaFrente } from '../motor/sistemas/frentes';
import { BEM_ESTAR } from '../motor/sistemas/estado';
import { estimuloCognitivo, estimuloFisico, nivelPessoal, palavraAprendizado, palavraCondicionamento } from '../motor/sistemas/pessoa';
import { trajetoria } from './estadoPessoal';
import { coisasDaVida, coisasDaLoja } from '../motor/sistemas/coisas';
import { coisa, type Coisa, type LojaDeCoisas } from '../motor/dados/coisas';
import { VIVENCIA_DA_ROTINA } from '../motor/sistemas/formacao';
import { estadoDoArco } from '../motor/sistemas/arcos';
import { oportunidadesAbertas } from '../motor/sistemas/mercados';
import { economiaLocal } from '../motor/dados/lugares';
import { dose } from '../motor/sistemas/semana';
import { idade } from '../motor/nucleo';
import { idadeEm as idadeNoInstante, tDe } from '../motor/tempo';

export interface HabilidadeDaPratica {
  d: Dominio;
  nome: string;
  /** O estágio de hoje (0..5) e a palavra dele — as mesmas da frase do motor. */
  estagio: number;
  palavra: string;
  /** O maior estágio já alcançado (o auge da frente). */
  auge: number;
  palavraAuge: string;
  /** Anos de prática de verdade (o calendário, limitado pela intensidade). */
  anos: number;
  retomadas: number;
  /** A frase da frente (`leituraDaFrente`): a facilidade, a raça, o tempo parado. */
  frase: string;
  /** O peso desta frente na atividade (1 = é a técnica da atividade; menos = efeito ao lado). */
  peso: number;
}

export interface PassoDaPratica { t: number; texto: string; peso: 1 | 2 | 3; tipo: 'comeco' | 'marco' | 'vivencia' | 'palco' | 'tentativa' }

export interface LeituraPratica {
  id: string;
  nome: string;
  categoria: ModeloRotina['categoria'];
  nivel: 1 | 2 | 3;
  niveis: { n: 1 | 2 | 3; rotulo: string; dose: string; custo: number }[];
  rotuloNivel: string;
  dose: string;
  /** Na semana desde (o mês do motor) e a idade de então. */
  desde: number;
  idadeDesde: number;
  /** Anos seguidos na semana (desde a última vez que começou). */
  anosNaSemana: number;
  /** Custo mensal, já na moeda e no custo de vida de onde se mora (0 = de graça). */
  custoMes: number;
  renda: number;
  /** A técnica da atividade (quando ela ensina uma) e as habilidades que ela exercita ao lado. */
  principal?: HabilidadeDaPratica;
  relacionadas: HabilidadeDaPratica[];
  /**
   * Quando a atividade não ensina uma técnica (a academia, a corrida, a leitura), o que ela desenvolve é uma dimensão
   * da pessoa — o condicionamento ou o aprendizado —, com o nível (1..5), a palavra e a linha dos últimos anos: as
   * MESMAS de Você.
   */
  pessoal?: { d: 'condicionamento' | 'aprendizado'; nome: string; nivel: number; palavra: string; pontos: number[] };
  /** O que muda na vida (frases curtas, cada uma de uma conta do motor). */
  efeitos: { id: string; texto: string; tom: 'bom' | 'pesa' | 'neutro' }[];
  /** A história interna (o time, a olimpíada, o projeto), quando a atividade tem uma. */
  arco?: string;
  pessoas: { p: Pessoa; vin: Vinculo }[];
  coisas: { t: CoisaTida; c: Coisa }[];
  /** Uma coisa que ajudaria e ainda não é sua (a loja onde se compra). */
  ajudaria?: { c: Coisa; loja: LojaDeCoisas };
  historia: PassoDaPratica[];
  portas: Oportunidade[];
  /** Atividade que mora em Formação (o curso, o estudo para concurso, a atividade da escola). */
  daFormacao: boolean;
}

const dominios = (m: ModeloRotina): [Dominio, number][] => (Object.entries(m.pratica ?? {}) as [Dominio, number][]).sort((a, b) => b[1] - a[1]);

function habilidadeDe(v: Vida, d: Dominio, f: Frente, peso: number): HabilidadeDaPratica {
  const m = modeloFrente(d);
  const e = estagioDe(f.habilidade);
  const a = estagioDe(f.auge);
  return { d, nome: m.nome, estagio: e, palavra: m.estagios[e], auge: a, palavraAuge: m.estagios[a], anos: anosDePratica(v, f), retomadas: f.retomadas, frase: leituraDaFrente(v, d), peso };
}

/** O que a atividade faz com a cabeça e o humor — a mesma tabela do equilíbrio do ano. */
export function bemEstarDa(id: string, nivel: number): { cabeca: number; humor: number } {
  const b = BEM_ESTAR[id];
  if (!b) return { cabeca: 0, humor: 0 };
  return { cabeca: typeof b.cabeca === 'function' ? b.cabeca(nivel) : b.cabeca ?? 0, humor: b.humor ?? 0 };
}

export function leituraDaPratica(v: Vida, r: Rotina, daFormacao = false): LeituraPratica | undefined {
  const m = modeloRotina(r.id);
  if (!m) return undefined;
  const n = nivelDa(r);
  const nm = nivelModelo(m, n);
  const custoLocal = economiaLocal(v.moradia.municipioId).custo;
  const ds = dominios(m);
  const habs = ds.filter(([d]) => v.caminhos.frentes[d]).map(([d, p]) => habilidadeDe(v, d, v.caminhos.frentes[d]!, p));
  // A técnica da atividade: a frente principal, quando é ela que a atividade ensina (a leitura exercita o português,
  // mas não é "aula de português"; a escola já dá as matérias).
  const principal = habs.find(h => h.peso >= 0.75 && !MATERIAS.includes(h.d));
  const relacionadas = habs.filter(h => h !== principal);

  const fisico = estimuloFisico(v).fontes.some(f => f.id === r.id);
  const cognitivo = estimuloCognitivo(v).fontes.some(f => f.id === r.id);
  const efeitos: LeituraPratica['efeitos'] = [];
  const be = bemEstarDa(r.id, n);
  if (be.cabeca <= -10) efeitos.push({ id: 'cabeca', texto: 'alivia muito o estresse', tom: 'bom' });
  else if (be.cabeca < 0) efeitos.push({ id: 'cabeca', texto: 'alivia o estresse', tom: 'bom' });
  else if (be.cabeca >= 8) efeitos.push({ id: 'cabeca', texto: 'pesa no estresse', tom: 'pesa' });
  if (be.humor > 0) efeitos.push({ id: 'humor', texto: be.humor >= 5 ? 'faz bem ao humor' : 'dá ânimo', tom: 'bom' });
  if (fisico) efeitos.push({ id: 'corpo', texto: `conta como treino para o corpo (condicionamento: ${palavraCondicionamento(v.corpo.forma)})`, tom: 'bom' });
  if (cognitivo) efeitos.push({ id: 'mente', texto: `exercita a cabeça (aprendizado: ${palavraAprendizado(v.mente.cognicao)})`, tom: 'bom' });
  const pessoal: LeituraPratica['pessoal'] = principal ? undefined
    : fisico ? { d: 'condicionamento', nome: 'Condicionamento', nivel: nivelPessoal(v, 'condicionamento'), palavra: palavraCondicionamento(v.corpo.forma), pontos: trajetoria(v, 'forma') }
      : cognitivo ? { d: 'aprendizado', nome: 'Aprendizado', nivel: nivelPessoal(v, 'aprendizado'), palavra: palavraAprendizado(v.mente.cognicao), pontos: trajetoria(v, 'cognicao') } : undefined;
  const renda = m.renda?.(v, n) ?? 0;
  if (renda > 0) efeitos.push({ id: 'renda', texto: 'rende um dinheiro por mês', tom: 'bom' });
  efeitos.push({ id: 'semana', texto: `ocupa a semana ${dose(nm.tempo)}`, tom: 'neutro' });

  const chave = `rotina:${r.id}:`;
  const pessoas = Object.values(v.vinculos)
    .filter(vin => vin.ambiente?.startsWith(chave) && v.pessoas[vin.pessoaId]?.vivo && !vin.parentesco)
    .map(vin => ({ p: v.pessoas[vin.pessoaId], vin }))
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)
    .slice(0, 6);

  const coisas = coisasDaVida(v).map(t => ({ t, c: coisa(t.coisaId) })).filter((x): x is { t: CoisaTida; c: Coisa } => !!x.c && (x.c.ajuda?.[r.id] ?? 0) > 0);
  let ajudaria: LeituraPratica['ajudaria'];
  if (!coisas.length && idade(v) >= 10) {
    for (const loja of ['instrumentos', 'esportes', 'eletronicos', 'livraria', 'casa'] as LojaDeCoisas[]) {
      const c = coisasDaLoja(loja).filter(x => (x.ajuda?.[r.id] ?? 0) > 0).sort((a, b) => a.preco - b.preco)[0];
      if (c) { ajudaria = { c, loja }; break; }
    }
  }

  const doms = new Set(ds.map(([d]) => d));
  const historia: PassoDaPratica[] = [];
  historia.push({ t: r.tInicio, texto: r.tInicio <= v.eu.tNasc ? 'Desde que se entende por gente.' : `Entrou na semana, aos ${idadeEm(v, r.tInicio)}.`, peso: 1, tipo: 'comeco' });
  for (const k of v.caminhos.marcas) {
    if (!k.dominio || !doms.has(k.dominio)) continue;
    // O começo desta vez já está dito acima; os de antes (a primeira vez, a pausa) contam a história longa.
    if (k.tipo === 'comecou' && Math.abs(k.t - r.tInicio) < 12) continue;
    historia.push({ t: k.t, texto: k.texto, peso: k.peso, tipo: 'marco' });
  }
  const tipoViv = VIVENCIA_DA_ROTINA[r.id];
  const viv = tipoViv ? (v.educacao.vivencias ?? []).find(x => x.tipo === tipoViv && x.tFim === undefined) : undefined;
  for (const x of viv?.marcos ?? []) if (!historia.some(h => h.texto === x.texto)) historia.push({ t: x.t, texto: x.texto, peso: 2, tipo: 'vivencia' });
  for (const p of v.caminhos.palcos ?? []) {
    if (!doms.has(p.linguagem) || p.apresentacoes <= 0) continue;
    const t = tDe(p.ano, 11);
    historia.push({ t, texto: `${p.ano}: ${p.apresentacoes} ${p.linguagem === 'musica' ? (p.apresentacoes === 1 ? 'show pago' : 'shows pagos') : (p.apresentacoes === 1 ? 'apresentação paga' : 'apresentações pagas')}.`, peso: 1, tipo: 'palco' });
  }
  for (const d of v.caminhos.devolutivas) {
    if (!d.dominio || !doms.has(d.dominio)) continue;
    historia.push({ t: d.t, texto: `${d.titulo}: ${d.passou ? 'passou' : d.perto ? 'ficou perto' : 'não passou'}.`, peso: d.passou ? 2 : 1, tipo: 'tentativa' });
  }
  historia.sort((a, b) => b.t - a.t);

  const portas = oportunidadesAbertas(v).filter(o => (o.dominio && doms.has(o.dominio)) || o.atividade === r.id);

  return {
    id: r.id, nome: m.nome, categoria: m.categoria, nivel: n,
    niveis: m.niveis.map((x, k) => ({ n: (k + 1) as 1 | 2 | 3, rotulo: x.rotulo, dose: dose(x.tempo), custo: custoDaRotina(v, r.id, k + 1) * custoLocal })),
    rotuloNivel: nm.rotulo, dose: dose(nm.tempo), desde: r.tInicio, idadeDesde: idadeEm(v, r.tInicio),
    anosNaSemana: Math.floor((v.t - r.tInicio) / 12), custoMes: custoDaRotina(v, r.id, n) * custoLocal, renda,
    principal, relacionadas, pessoal, efeitos, arco: estadoDoArco(r.id, viv), pessoas, coisas, ajudaria, historia: historia.slice(0, 10), portas, daFormacao
  };
}

const idadeEm = (v: Vida, t: number) => Math.max(0, idadeNoInstante(v.eu.tNasc, t));

/** As práticas da semana, na ordem em que importam: a técnica mais desenvolvida e o tempo de casa primeiro. */
export function praticasDaVida(v: Vida, filtro: (m: ModeloRotina) => boolean = () => true, daFormacao: (id: string) => boolean = () => false): LeituraPratica[] {
  return v.rotinas
    .filter(r => { const m = modeloRotina(r.id); return !!m && filtro(m); })
    .map(r => leituraDaPratica(v, r, daFormacao(r.id)))
    .filter((x): x is LeituraPratica => !!x);
}
