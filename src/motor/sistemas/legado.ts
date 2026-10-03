/**
 * O que esta pessoa CONSTRUIU — trajetória por trajetória (generalização de
 * carreiras e legado).
 *
 *   TRAJETÓRIA → EXPERIÊNCIAS → DESEMPENHO → REALIZAÇÕES → RECONHECIMENTO →
 *   HISTÓRICO → LEGADO
 *
 * Uma leitura, não estado novo: tudo sai do que as carreiras já guardam (as
 * temporadas e o palmarés; o currículo, as obras e os anos de palco; a obra
 * acadêmica; as residências e os cargos; os mandatos; os postos e as
 * guarnições; as safras; as empresas e os cargos de cada uma). Por isso
 * trocar de carreira não apaga nada: a pessoa de 70 anos que jogou futebol,
 * abriu um negócio e foi prefeita tem as três trajetórias aqui.
 *
 * Separa duas coisas que a vida separa:
 *   HISTÓRICO   o detalhe (todas as temporadas, todas as produções, todos os
 *               artigos) — para quem abre a trajetória
 *   BIOGRAFIA   o que marcou (o título nacional, o primeiro protagonista, o
 *               prêmio, o doutorado) — `realizacoes`, e as frases do legado
 *               (`legadoEmFrases`), que a retrospectiva usa
 *
 * O motor decide o que vira memória pelo PESO de cada realização (um título
 * da elite como protagonista pesa mais que um acesso; o prêmio de pesquisa,
 * mais que um congresso), não pela ordem em que aconteceu.
 */

import type { CarreiraEsportiva, ConquistaEsportiva, Dominio, Emprego, Vida } from '../tipos';
import { ehElite } from '../dados/clubes';
import { anoDe } from '../tempo';
import { aSelecao, nivelDaCompeticao, oClube } from '../dados/clubes';
import { flex, ge, listaNatural } from '../texto';
import { ocupacaoOuNula, ROTULO_TRILHA } from '../dados/ocupacoes';
import { municipio } from '../dados/lugares';
import { ESPECIALIDADES, NOME_FORCA, SIGLA_DA } from '../dados/forcas';
import { carreirasEsportivas, NOME_MOD } from './esporte';
import { historicoDaCarreira, pelaPorta, perfilDe, resumoDaCarreira, type Estrutura, type HistoricoEsportivo } from './perfisEsportivos';
import { leituraDaSelecao } from './palmares';
import { mandatosDaVida, nomeCargo, NOME_PRIORIDADE } from './politica';
import { aoPartido, oPartido, peloPartido } from '../dados/partidos';
import { obraAcademica, OCUPACOES_ACADEMICAS } from './academia';
import { modeloEspecialidade } from '../dados/especialidades';
import { mercadoDe } from './mercados';
import { nomeOcupacao } from './trabalho';
import { comoAcabou, linhaDoTecnico, periodoDaPassagem, resumoDaPassagem, resumoDoTecnico } from './tecnico';

export type AreaTrajetoria = 'esporte' | 'tecnico' | 'atuacao' | 'musica' | 'escrita' | 'artes' | 'academia' | 'medicina' | 'politica' | 'militar' | 'rural' | 'negocio' | 'emprego' | 'formacao';

export interface DetalheTrajetoria { titulo: string; linhas: string[]; tabela?: HistoricoEsportivo }

export interface TrajetoriaDaVida {
  id: string;
  area: AreaTrajetoria;
  titulo: string;
  /** "2038–2056" ou "desde 2040". */
  periodo: string;
  de: number;
  ate?: number;
  ativa: boolean;
  /** A trajetória em uma frase (os totais, no idioma da área). */
  resumo: string;
  /** O que marcou, do mais forte ao mais leve (o que vira biografia). */
  realizacoes: string[];
  /** Prêmios, seleção, indicações: o reconhecimento de fora. */
  reconhecimento: string[];
  /** O histórico detalhado (revelado aos poucos na tela). */
  detalhe: DetalheTrajetoria[];
  /** O quanto esta trajetória definiu a vida (anos × o que ficou): ordena o legado. */
  peso: number;
}

interface Realizacao { texto: string; peso: number }
const top = (xs: Realizacao[], n = 6) => [...xs].sort((a, b) => b.peso - a.peso).slice(0, n).map(x => x.texto);
const periodo = (de: number, ate: number | undefined, ativa: boolean) => (ativa ? `desde ${de}` : ate === undefined || ate === de ? String(de) : `${de}–${ate}`);
const anos = (n: number) => `${n} ${n === 1 ? 'ano' : 'anos'}`;
/** O fim por falta de contrato, no idioma da estrutura (o nadador não tem clube que renove; o tenista não tem contrato). */
const SEM_CONTRATO: Record<Estrutura, string> = { clube: 'acabou sem clube', equipe: 'acabou sem equipe', circuito: 'acabou sem condições de seguir no circuito' };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "na Distribuidora Paulista", "no hospital", "numa escola", "em São Paulo" — o lugar com a contração certa. */
export const naCasa = (lugar: string) => lugar.replace(/^a /, 'na ').replace(/^o /, 'no ').replace(/^as /, 'nas ').replace(/^os /, 'nos ').replace(/^uma /, 'numa ').replace(/^um /, 'num ').replace(/^(?!(na|no|nas|nos|numa|num|por|pela|pelo) )/, 'em ');
const daCasa = (lugar: string) => naCasa(lugar).replace(/^na /, 'da ').replace(/^no /, 'do ').replace(/^nas /, 'das ').replace(/^nos /, 'dos ').replace(/^numa /, 'de uma ').replace(/^num /, 'de um ').replace(/^em /, 'de ');

/* ============================================================ Esporte */



/** O peso biográfico de uma conquista esportiva (o que merece virar memória). */
export function pesoDaConquista(c: ConquistaEsportiva): number {
  const t = c.texto;
  if (c.tipo === 'selecao') return /^Campe/.test(t) ? 10 : /ouro/.test(t) ? 9 : /^Medalha/.test(t) ? 7 : /Capit/.test(t) ? 6 : /Primeira convocação/.test(t) ? 5 : /Estreia/.test(t) ? 3 : 2;
  if (c.tipo === 'titulo') return (ehElite(c.competicao) || /quatro grandes|masters/.test(t) ? 8 : (nivelDaCompeticao(c.competicao) === 3 || /challenger|circuito nacional/.test(c.competicao + t)) ? 5 : 3) - (c.papel === 'elenco' ? 3 : 0);
  if (c.tipo === 'premio') return /^Melhor|^Atleta do ano/.test(t) ? 7 : /^Seleção/.test(t) ? 6 : /^Artilheir|^Cestinha|^Líder/.test(t) ? 6 : 4;
  if (c.tipo === 'marco') return /10 melhores/.test(t) ? 7 : /100 melhores/.test(t) ? 4 : /Estreia/.test(t) ? 3 : /titular/.test(t) ? 2 : 1;
  if (c.tipo === 'acesso') return c.papel === 'protagonista' ? 3 : 2;
  if (c.tipo === 'final') return /quatro grandes|masters/.test(t) ? 5 : 2;
  return 0;
}

function trajetoriaEsportiva(v: Vida, e: CarreiraEsportiva, k: number): TrajetoriaDaVida | undefined {
  const ts = e.temporadas ?? [];
  const mod = NOME_MOD[e.modalidade] ?? e.modalidade;
  const ativa = e.fase !== 'encerrada';
  // Quem não chegou ao profissional também tem trajetória: a base é biografia.
  if (!ts.length) {
    if (e.fase === 'profissional') return undefined;
    const de = anoDe(e.tInicio), ate = e.tFim !== undefined ? anoDe(e.tFim) : undefined;
    return {
      id: `esporte:${k}`, area: 'esporte', titulo: `${cap(mod)} de base`, periodo: periodo(de, ate, ativa), de, ate, ativa,
      resumo: `${anos(Math.max(1, Math.round(((e.tFim ?? v.t) - e.tInicio) / 12)))} ${e.modalidade === 'futebol' ? 'na base' : 'na equipe de base'} ${e.clube.startsWith('equipe') || e.clube.startsWith('academia') ? `(${e.clube})` : `do ${e.clube}`}${e.motivoFim === 'dispensa' ? '; dispensado antes do profissional'.replace('dispensado', flex(ge(v), 'dispensado', 'dispensada', 'dispensade')) : ''}.`,
      realizacoes: [], reconhecimento: [], detalhe: [], peso: 8
    };
  }
  const pal = (v.caminhos.palmares ?? []).filter(c => c.modalidade === e.modalidade && (!ts.length || (c.ano >= ts[0].ano - 1 && c.ano <= ts[ts.length - 1].ano + 1)));
  const realizacoes = pal.filter(c => pesoDaConquista(c) >= 3).map(c => ({ texto: `${c.texto} (${c.ano})`, peso: pesoDaConquista(c) + c.ano / 10000 }));
  const reconhecimento = pal.filter(c => c.tipo === 'premio').map(c => `${c.ano} · ${c.texto}`);
  if (e.selecao && e.selecao.convocacoes > 0) reconhecimento.unshift(leituraDaSelecao(v, e));
  const de = ts[0].ano, ate = ativa ? undefined : ts[ts.length - 1].ano;
  const titulos = pal.filter(c => c.tipo === 'titulo').map(c => `${c.ano} · ${c.texto}${c.papel === 'elenco' ? ' (no elenco)' : ''}`);
  const detalhe: DetalheTrajetoria[] = [
    { titulo: e.modalidade === 'tenis' ? 'Ano a ano' : historicoDaCarreira(e).agrupado === 'clube' ? (e.modalidade === 'futebol' ? 'Por clube' : 'Por equipe') : 'Ano a ano', linhas: [], tabela: historicoDaCarreira(e) },
    ...(titulos.length ? [{ titulo: 'Títulos', linhas: titulos.reverse() }] : []),
    ...(pal.some(c => c.tipo === 'final') ? [{ titulo: 'Finais', linhas: pal.filter(c => c.tipo === 'final').map(c => `${c.ano} · ${c.texto}`).reverse() }] : []),
    ...(reconhecimento.length ? [{ titulo: 'Prêmios e representação do país', linhas: reconhecimento }] : []),
    ...(e.selecao?.torneios.length ? [{ titulo: 'Pelo país', linhas: e.selecao.torneios.map(x => `${x.ano} · ${cap(x.nome.replace(/^(o|a|os) /, ''))}: ${x.campanha}`).reverse() }] : []),
    ...((() => { const m = (v.caminhos.situacoes ?? []).filter(x => x.trajetoria === (e.modalidade === 'futebol' || e.modalidade === 'basquete' || e.modalidade === 'tenis' ? e.modalidade : 'atleta') && (x.desfecho === 'otimo' || x.desfecho === 'pessimo')); return m.length ? [{ titulo: 'Momentos', linhas: m.slice(-6).reverse().map(x => `${anoDe(x.t)} · ${x.texto}`) }] : []; })())
  ];
  const marcantes = realizacoes.reduce((a, r) => a + r.peso, 0);
  return {
    id: `esporte:${k}`, area: 'esporte', titulo: `${cap(mod)} profissional`, periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${resumoDaCarreira(e)}${e.origem === 'amador' ? ` — chegou ${pelaPorta(e.modalidade)}` : ''}${e.motivoFim && !ativa ? `; ${e.motivoFim === 'lesao' ? 'parou pelas lesões' : e.motivoFim === 'sem_contrato' ? SEM_CONTRATO[perfilDe(e.modalidade).estrutura] : e.motivoFim === 'suspensao' ? 'acabou na suspensão' : 'parou por escolha'}` : ''}.`,
    realizacoes: top(realizacoes), reconhecimento, detalhe, peso: ts.length * 6 + marcantes
  };
}

/* ============================================================ Artes */

const TIPO_AV: Record<string, string> = { teatro: 'teatro', festival: 'festival', publicidade: 'publicidade', curta: 'curta', serie: 'série', novela: 'novela', filme: 'filme', show: 'show', espetaculo: 'espetáculo', edital: 'edital' };
const REP = ['passou em branco', 'teve público', 'repercutiu', 'marcou'];

function trajetoriaDeAtuacao(v: Vida): TrajetoriaDaVida | undefined {
  const itens = (v.caminhos.curriculo ?? []).filter(x => ['teatro', 'festival', 'publicidade', 'curta', 'serie', 'novela', 'filme', 'edital'].includes(x.tipo));
  if (!itens.length) return undefined;
  const ord = [...itens].sort((a, b) => a.t - b.t);
  const de = anoDe(ord[0].t);
  const ativa = [v.trabalho.atual, v.trabalho.paralela].some(e => e && ocupacaoOuNula(e.ocupacaoId)?.trilha === 'cena');
  const ate = ativa ? undefined : anoDe(ord[ord.length - 1].t);
  const conta = (tipos: string[]) => itens.filter(x => tipos.includes(x.tipo)).length;
  const tv = conta(['serie', 'novela']), cinema = conta(['filme', 'curta']), palco = conta(['teatro', 'festival']);
  const protag = itens.filter(x => /protagonista/.test(x.papel));
  const r: Realizacao[] = [];
  const primeiroProt = ord.find(x => /protagonista/.test(x.papel) && x.tipo !== 'publicidade');
  if (primeiroProt) r.push({ texto: `Primeiro papel de protagonista: "${primeiroProt.titulo}" (${TIPO_AV[primeiroProt.tipo]}, ${anoDe(primeiroProt.t)})`, peso: 7 });
  for (const x of itens.filter(y => y.premio)) r.push({ texto: x.premio!.venceu ? `Venceu ${x.premio!.nome} por "${x.titulo}" (${anoDe(x.t)})` : `Indicação ${x.premio!.nome.replace(/^o /, 'ao ')} por "${x.titulo}" (${anoDe(x.t)})`, peso: x.premio!.venceu ? 9 : 5 });
  for (const x of itens.filter(y => y.repercussao === 3)) r.push({ texto: `"${x.titulo}" (${TIPO_AV[x.tipo]}, ${anoDe(x.t)}), ${x.papel}: o trabalho marcou`, peso: 6 + (/protagonista/.test(x.papel) ? 1 : 0) });
  const pessoas = [...new Set(itens.map(x => x.pessoaId).filter((id): id is string => !!id && !!v.pessoas[id]))].slice(0, 6).map(id => `${v.pessoas[id].nome}${v.pessoas[id].ocupacao ? ` (${v.pessoas[id].ocupacao})` : ''}`);
  const partes = [tv && `${tv} na TV e no streaming`, cinema && `${cinema} no cinema`, palco && `${palco} no teatro`, conta(['publicidade']) && `${conta(['publicidade'])} em publicidade`].filter(Boolean) as string[];
  return {
    id: 'atuacao', area: 'atuacao', titulo: 'Atuação', periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${itens.length} ${itens.length === 1 ? 'trabalho' : 'trabalhos'}${partes.length ? ` — ${listaNatural(partes)}` : ''}${protag.length ? `; ${protag.length} como protagonista` : ''}.`,
    realizacoes: top(r), reconhecimento: itens.filter(x => x.premio).map(x => `${anoDe(x.t)} · ${x.premio!.venceu ? 'Venceu' : 'Indicação:'} ${x.premio!.nome} ("${x.titulo}")`),
    detalhe: [
      { titulo: 'Trabalhos', linhas: [...ord].reverse().map(x => `${anoDe(x.t)} · "${x.titulo}" — ${TIPO_AV[x.tipo]} — ${x.papel}${x.onde ? ` (${x.onde})` : ''} · ${REP[x.repercussao]}${x.premio ? ` · ${x.premio.venceu ? 'prêmio' : 'indicação'}` : ''}`) },
      ...(pessoas.length ? [{ titulo: 'Gente que ficou desses trabalhos', linhas: pessoas }] : [])
    ],
    peso: itens.length * 2 + r.reduce((a, x) => a + x.peso, 0) + (ate ?? anoDe(v.t)) - de
  };
}

function trajetoriaArtistica(v: Vida, d: Dominio): TrajetoriaDaVida | undefined {
  const obras = (v.caminhos.obras ?? []).filter(o => o.linguagem === d);
  const palcos = (v.caminhos.palcos ?? []).filter(p => p.linguagem === d);
  const shows = (v.caminhos.curriculo ?? []).filter(x => (d === 'musica' && x.tipo === 'show') || (d === 'danca' && x.tipo === 'espetaculo'));
  const projetos = v.caminhos.marcas.filter(m => m.dominio === d && (m.tipo === 'ingresso' || m.tipo === 'abandono'));
  const premiado = d === 'escrita' && v.fatos['premio_literario'] !== undefined;
  if (!obras.length && !palcos.length && !shows.length && !premiado && !projetos.length) return undefined;
  const ts = [...obras.map(o => o.t), ...palcos.map(p => (p.ano - anoDe(0)) * 12), ...shows.map(x => x.t), ...projetos.map(m => m.t)].sort((a, b) => a - b);
  const de = anoDe(ts[0] ?? v.t);
  const ultimo = ts[ts.length - 1] ?? v.t;
  const ativa = (v.caminhos.arte?.ativo && v.caminhos.arte.linguagem === d) || v.t - ultimo <= 24;
  const ate = ativa ? undefined : anoDe(ultimo);
  const r: Realizacao[] = [];
  const nomeObra = d === 'musica' ? 'disco' : d === 'escrita' ? 'livro' : d === 'danca' ? 'espetáculo' : 'trabalho';
  for (const o of obras) {
    if (o.premio) r.push({ texto: o.premio.venceu ? `Venceu ${o.premio.nome} com "${o.titulo}" (${anoDe(o.t)})` : `"${o.titulo}" ${d === 'escrita' ? 'finalista de' : 'indicado a'} ${o.premio.nome.replace(/^o /, '')} (${anoDe(o.t)})`, peso: o.premio.venceu ? 9 : 5 });
    else if (o.recepcao === 3) r.push({ texto: `O ${nomeObra} "${o.titulo}" (${anoDe(o.t)}) marcou`, peso: 6 });
    else if (o.recepcao === 2) r.push({ texto: `O ${nomeObra} "${o.titulo}" (${anoDe(o.t)}) repercutiu`, peso: 3 });
  }
  if (premiado) r.push({ texto: `Um conto premiado num concurso literário (${anoDe(v.fatos['premio_literario']!)})`, peso: 5 });
  const turnes = palcos.filter(p => p.apresentacoes >= 40);
  for (const p of turnes) r.push({ texto: `${p.ano}: ${p.apresentacoes} apresentações — a estrada de uma turnê`, peso: 4 });
  const totalShows = palcos.reduce((a, p) => a + p.apresentacoes, 0);
  const titulo = d === 'musica' ? 'Música' : d === 'escrita' ? 'Escrita' : d === 'danca' ? 'Dança' : d === 'teatro' ? 'Teatro (grupo)' : 'Artes visuais';
  const resumo = [obras.length && `${obras.length} ${obras.length === 1 ? nomeObra : `${nomeObra}s`} ${d === 'escrita' ? 'publicados' : 'lançados'}`.replace('espetáculos lançados', 'espetáculos estreados'), totalShows && `${totalShows} apresentações em ${anos(palcos.length)} de palco`, projetos.some(m => m.tipo === 'ingresso') && `${projetos.filter(m => m.tipo === 'ingresso').length} ${projetos.filter(m => m.tipo === 'ingresso').length === 1 ? 'grupo' : 'grupos'}`].filter(Boolean) as string[];
  return {
    id: `arte:${d}`, area: d === 'musica' ? 'musica' : d === 'escrita' ? 'escrita' : 'artes', titulo, periodo: periodo(de, ate, !!ativa), de, ate, ativa: !!ativa,
    resumo: `${resumo.length ? cap(listaNatural(resumo)) : 'Uma trajetória pequena'}.`,
    realizacoes: top(r), reconhecimento: obras.filter(o => o.premio).map(o => `${anoDe(o.t)} · ${o.premio!.venceu ? 'Venceu' : 'Indicação:'} ${o.premio!.nome} ("${o.titulo}")`),
    detalhe: [
      ...(obras.length ? [{ titulo: d === 'musica' ? 'Discos' : d === 'escrita' ? 'Livros' : 'Obras', linhas: [...obras].reverse().map(o => `${anoDe(o.t)} · "${o.titulo}" · ${REP[o.recepcao]}${o.premio ? ` · ${o.premio.venceu ? 'prêmio' : 'indicação'}` : ''}`) }] : []),
      ...(palcos.length ? [{ titulo: 'Anos de palco', linhas: [...palcos].reverse().slice(0, 15).map(p => `${p.ano} · ${p.apresentacoes} ${p.apresentacoes === 1 ? 'apresentação' : 'apresentações'}`) }] : []),
      ...(projetos.length ? [{ titulo: 'Grupos', linhas: projetos.map(m => `${anoDe(m.t)} · ${m.texto}`) }] : [])
    ],
    peso: obras.length * 4 + palcos.length * 2 + r.reduce((a, x) => a + x.peso, 0)
  };
}

/* ============================================================ Academia */

function trajetoriaAcademica(v: Vida): TrajetoriaDaVida | undefined {
  const empregos = [...v.trabalho.historico, ...(v.trabalho.atual ? [{ ...v.trabalho.atual, tFim: v.t, motivo: '' }] : []), ...(v.trabalho.paralela ? [{ ...v.trabalho.paralela, tFim: v.t, motivo: '' }] : [])].filter(e => OCUPACOES_ACADEMICAS.has(e.ocupacaoId));
  const a = v.caminhos.academia;
  if (!empregos.length && !a) return undefined;
  const o = obraAcademica(v);
  const titulos = v.educacao.concluidos.filter(c => c.nivel === 'mestrado' || c.nivel === 'doutorado').sort((x, y) => x.tFim - y.tFim);
  const de = anoDe(Math.min(...[...empregos.map(e => e.tInicio), ...titulos.map(c => c.tFim)], v.t));
  const ativa = [v.trabalho.atual, v.trabalho.paralela].some(e => e && OCUPACOES_ACADEMICAS.has(e.ocupacaoId));
  const ate = ativa ? undefined : anoDe(Math.max(...empregos.map(e => e.tFim), de * 12));
  const r: Realizacao[] = [];
  for (const c of titulos) r.push({ texto: `${c.nome} (${anoDe(c.tFim)}, ${c.instituicao})`, peso: c.nivel === 'doutorado' ? 6 : 3 });
  for (const p of o.premios) r.push({ texto: `${p.titulo} (${anoDe(p.t)})`, peso: 10 });
  for (const l of o.livros) r.push({ texto: `O livro "${l.titulo}" (${anoDe(l.t)})`, peso: 6 });
  for (const x of o.artigos.filter(y => (y.impacto ?? 0) >= 3)) r.push({ texto: `O artigo "${x.titulo}" (${anoDe(x.t)}), que virou referência na área`, peso: 7 });
  for (const x of o.financiamentos.slice(0, 2)) r.push({ texto: `Financiamento de pesquisa: "${x.titulo}" (${anoDe(x.t)})`, peso: 3 });
  const memo = (v.caminhos.situacoes ?? []).filter(x => x.trajetoria === 'academia' && x.desfecho === 'otimo');
  for (const x of memo) r.push({ texto: `${x.texto} (${anoDe(x.t)})`, peso: 4 });
  const cargo = empregos.sort((x, y) => (ocupacaoOuNula(y.ocupacaoId)?.nivel ?? 0) - (ocupacaoOuNula(x.ocupacaoId)?.nivel ?? 0))[0];
  const partes = a ? [a.publicacoes && `${a.publicacoes} ${a.publicacoes === 1 ? 'artigo' : 'artigos'}`, o.livros.length && `${o.livros.length} ${o.livros.length === 1 ? 'livro' : 'livros'}`, a.orientacoes && `${a.orientacoes} ${a.orientacoes === 1 ? 'orientação concluída' : 'orientações concluídas'}`, a.projetos && `${a.projetos} ${a.projetos === 1 ? 'projeto' : 'projetos'}`, a.financiamentos && `${a.financiamentos} ${a.financiamentos === 1 ? 'financiamento' : 'financiamentos'}`].filter(Boolean) as string[] : [];
  const resumo = partes.length ? `${cap(listaNatural(partes))}${a?.linha ? ` — em ${a.linha}` : ''}` : 'A docência, sem produção registrada';
  const pos = [...v.trabalho.historico, ...(v.trabalho.atual ? [{ ...v.trabalho.atual, tFim: v.t, motivo: 'atual' }] : [])].filter(e => OCUPACOES_ACADEMICAS.has(e.ocupacaoId));
  return {
    id: 'academia', area: 'academia', titulo: 'Pesquisa e docência', periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${resumo}${cargo ? `; ${nomeOcupacao(v, ocupacaoOuNula(cargo.ocupacaoId)!)}` : ''}.`,
    realizacoes: top(r), reconhecimento: o.premios.map(p => `${anoDe(p.t)} · ${p.titulo}`),
    detalhe: [
      ...(titulos.length ? [{ titulo: 'Formação', linhas: titulos.map(c => `${anoDe(c.tFim)} · ${c.nome} — ${c.instituicao}`) }] : []),
      ...(pos.length ? [{ titulo: 'Posições', linhas: pos.map(e => `${anoDe(e.tInicio)}${e.motivo === 'atual' ? '–' : `–${anoDe(e.tFim)}`} · ${nomeOcupacao(v, ocupacaoOuNula(e.ocupacaoId)!)}, ${e.empregador}`) }] : []),
      ...(o.artigos.length ? [{ titulo: 'Artigos', linhas: o.artigos.slice(0, 15).map(x => `${anoDe(x.t)} · "${x.titulo}" — ${x.detalhe ?? ''}`) }] : []),
      ...(o.livros.length ? [{ titulo: 'Livros', linhas: o.livros.map(x => `${anoDe(x.t)} · "${x.titulo}"`) }] : []),
      ...(o.orientacoes.length ? [{ titulo: 'Orientações', linhas: o.orientacoes.map(x => `${anoDe(x.t)} · ${x.titulo}`) }] : []),
      ...(o.congressos.length ? [{ titulo: 'Congressos', linhas: o.congressos.slice(-8).reverse().map(x => `${anoDe(x.t)} · ${x.titulo} — ${x.detalhe ?? ''}`) }] : []),
      ...(o.projetos.length || o.financiamentos.length ? [{ titulo: 'Projetos e financiamento', linhas: [...o.projetos, ...o.financiamentos].sort((x, y) => y.t - x.t).map(x => `${anoDe(x.t)} · ${x.tipo === 'financiamento' ? 'financiado: ' : ''}${x.titulo}`) }] : [])
    ],
    peso: (a?.publicacoes ?? 0) * 2 + (a?.orientacoes ?? 0) * 2 + r.reduce((s, x) => s + x.peso, 0) + empregos.reduce((s, e) => s + (e.tFim - e.tInicio) / 12, 0)
  };
}

/* ============================================================ Medicina */

function trajetoriaMedica(v: Vida): TrajetoriaDaVida | undefined {
  const grad = v.educacao.concluidos.find(c => c.nivel === 'superior' && c.area === 'medicina');
  if (!grad) return undefined;
  const res = v.educacao.concluidos.filter(c => c.nivel === 'residencia').sort((a, b) => a.tFim - b.tFim);
  const empregos = [...v.trabalho.historico, ...(v.trabalho.atual ? [{ ...v.trabalho.atual, tFim: v.t, motivo: 'atual' }] : [])].filter(e => ocupacaoOuNula(e.ocupacaoId)?.trilha === 'medicina');
  const de = anoDe(grad.tFim);
  const ativa = ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '')?.trilha === 'medicina';
  const ate = ativa ? undefined : empregos.length ? anoDe(Math.max(...empregos.map(e => e.tFim))) : de;
  const pratica = Math.round(empregos.reduce((s, e) => s + (e.tFim - e.tInicio), 0) / 12);
  const esp = res.map(c => modeloEspecialidade(c.especialidade ?? 'clinica').area);
  const r: Realizacao[] = [{ texto: `Formou-se em Medicina (${de}, ${grad.instituicao})`, peso: 5 }];
  for (const c of res) r.push({ texto: `Residência em ${modeloEspecialidade(c.especialidade ?? 'clinica').area} (${anoDe(c.tFim)})`, peso: 6 });
  const chefia = empregos.filter(e => (ocupacaoOuNula(e.ocupacaoId)?.nivel ?? 0) >= 5);
  for (const e of chefia) r.push({ texto: `${cap(nomeOcupacao(v, ocupacaoOuNula(e.ocupacaoId)!))}, ${e.empregador} (desde ${anoDe(e.tInicio)})`, peso: 5 });
  for (const x of (v.caminhos.situacoes ?? []).filter(y => y.trajetoria === 'medicina' && y.desfecho === 'otimo')) r.push({ texto: `${x.texto} (${anoDe(x.t)})`, peso: 3 });
  const lugares = [...new Set(empregos.map(e => e.empregador))];
  return {
    id: 'medicina', area: 'medicina', titulo: `Medicina${esp.length ? ` — ${esp[esp.length - 1]}` : ''}`, periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${anos(pratica)} de prática${esp.length ? `, especialista em ${listaNatural(esp)}` : ', sem residência'}${lugares.length ? `; passou por ${lugares.length === 1 ? 'um lugar' : `${lugares.length} lugares`}` : ''}.`,
    realizacoes: top(r), reconhecimento: [],
    detalhe: [
      { titulo: 'Formação', linhas: [`${de} · ${grad.nome} — ${grad.instituicao}`, ...res.map(c => `${anoDe(c.tFim)} · ${c.nome}${c.instituicao ? ` — ${c.instituicao}` : ''}`)] },
      ...(empregos.length ? [{ titulo: 'Onde trabalhou', linhas: [...empregos].reverse().map(e => `${anoDe(e.tInicio)}${e.motivo === 'atual' ? '–' : `–${anoDe(e.tFim)}`} · ${nomeOcupacao(v, ocupacaoOuNula(e.ocupacaoId)!)}, ${e.empregador}${e.especialidade ? ` (${e.especialidade})` : ''}`) }] : []),
      ...((() => { const m = (v.caminhos.situacoes ?? []).filter(x => x.trajetoria === 'medicina'); return m.length ? [{ titulo: 'Momentos', linhas: m.slice(-6).reverse().map(x => `${anoDe(x.t)} · ${x.texto}`) }] : []; })())
    ],
    peso: pratica * 3 + res.length * 6 + r.reduce((s, x) => s + x.peso, 0)
  };
}

/* ============================================================ Política */

const ORIGEM_POLITICA: Record<string, string> = { comunidade: 'pela associação do bairro', estudantil: 'pela política estudantil', sindicato: 'pelo sindicato', causa: 'por uma causa', notoriedade: 'com um nome já conhecido', empresario: 'pelo meio empresarial', servidor: 'pelo serviço público', convite: 'por um convite', decisao: 'por decisão própria' };

function trajetoriaPolitica(v: Vida): TrajetoriaDaVida | undefined {
  const p = v.caminhos.politica;
  if (!p) return undefined;
  const de = anoDe(p.tInicio);
  const ativa = p.fase !== 'encerrada';
  const ate = ativa ? undefined : anoDe(p.tFim ?? v.t);
  const mandatos = mandatosDaVida(v);
  const eleicoes = p.historico.filter(h => h.resultado === 'eleito' || h.resultado === 'derrotado');
  const derrotas = eleicoes.filter(h => h.resultado === 'derrotado').length;
  const r: Realizacao[] = [];
  const g = ge(v);
  // O que aconteceu, e só isso (FIX final da generalização): os mandatos (e a reeleição), as eleições perdidas, a
  // filiação e as trocas de partido, os anos de trabalho de base, as crises atravessadas e o que saiu do papel.
  // A fama não entra (notoriedade não é realização política), e a derrota é registrada como derrota.
  mandatos.forEach((m, k) => {
    const reeleicao = k > 0 && mandatos[k - 1].cargo === m.cargo && mandatos[k - 1].ate === m.de;
    r.push({ texto: `${reeleicao ? `${flex(g, 'Reeleito', 'Reeleita', 'Reeleite')} ${m.cargo}` : cap(m.cargo)} (${m.de}${m.ate ? `–${m.ate}` : '–'}${m.como && m.como !== 'concluído' && m.como !== 'em exercício' ? `, ${m.como}` : ''})`, peso: 7 + (/prefeit|governad|senad/i.test(m.cargo) ? 2 : 0) + (reeleicao ? 1 : 0) });
    for (const x of m.marcos.filter(y => /saiu do papel|aprovou/.test(y)).slice(0, 2)) r.push({ texto: cap(x.replace(/^\d+ · /, '')) + ` (${x.slice(0, 4)})`, peso: 4 });
    // A crise atravessada de pé (o registro do mandato diz como saiu): é história do mandato, não glória.
    for (const x of m.marcos.filter(y => /saiu maior do que entrou/.test(y)).slice(0, 1)) r.push({ texto: `${cap(x.replace(/^\d+ · /, '').replace(/: saiu maior do que entrou$/, ''))}: saiu maior do que entrou (${x.slice(0, 4)})`, peso: 3 });
  });
  for (const h of p.historico.filter(x => x.resultado === 'derrotado')) r.push({ texto: `Candidatura a ${nomeCargo(v, h.cargo)} em ${anoDe(h.t)}: não se elegeu`, peso: 2 });
  const filiacoes = p.partidos?.length ? p.partidos : p.partido && p.tFiliacao !== undefined ? [{ sigla: p.partido, tInicio: p.tFiliacao }] : [];
  filiacoes.forEach((x, k) => r.push({ texto: k === 0 ? (p.indicacaoMilitar && filiacoes.length === 1 ? `${flex(g, 'Indicado', 'Indicada', 'Indicade')} ${peloPartido(x.sigla)}, ainda na ativa (${anoDe(x.tInicio)})` : `Filiação ${aoPartido(x.sigla)} (${anoDe(x.tInicio)})`) : `Trocou ${oPartido(filiacoes[k - 1].sigla)} por ${oPartido(x.sigla)} (${anoDe(x.tInicio)})`, peso: k === 0 ? 1.5 : 1 }));
  const base = v.fatos['pol_base_anos'] ?? 0;
  if (base >= 2) r.push({ texto: `${base} anos de trabalho de base nos bairros`, peso: Math.min(3, 1 + base / 5) });
  if (p.prioridade) r.push({ texto: `A bandeira: ${NOME_PRIORIDADE[p.prioridade].replace(': ', ' — ')}`, peso: 1 });
  r.push({ texto: `Entrou na vida política ${ORIGEM_POLITICA[p.origem] ?? ''} (${de})`, peso: 0.5 });
  const origem = p.origem === 'notoriedade' && v.notoriedade?.origens ? Object.entries(v.notoriedade.origens).filter(([k]) => k !== 'politica').sort((a, b) => b[1] - a[1])[0]?.[0] : undefined;
  const ORIGEM: Record<string, string> = { ...ORIGEM_POLITICA, notoriedade: origem === 'esporte' ? 'com o nome conhecido do esporte' : origem === 'arte' ? 'com o nome conhecido da arte' : 'com um nome já conhecido' };
  return {
    id: 'politica', area: 'politica', titulo: 'Vida pública', periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `Entrou ${ORIGEM[p.origem] ?? ''}. ${mandatos.length ? `${mandatos.length} ${mandatos.length === 1 ? 'mandato' : 'mandatos'} (${listaNatural([...new Set(mandatos.map(m => m.cargo))])})` : 'Nenhum mandato'}${derrotas ? `, ${derrotas} ${derrotas === 1 ? 'derrota' : 'derrotas'}` : ''}${(p.partidos?.length ?? 0) >= 2 ? `; ${p.partidos!.length} partidos` : ''}.`,
    realizacoes: top(r), reconhecimento: [],
    detalhe: [
      ...(eleicoes.length ? [{ titulo: 'Eleições', linhas: [...eleicoes].reverse().map(h => `${anoDe(h.t)} · ${cap(nomeCargo(v, h.cargo))}: ${h.resultado === 'eleito' ? flex(ge(v), 'eleito', 'eleita', 'eleite') : 'não se elegeu'}${h.partido ? ` (${h.partido})` : ''}`) }] : []),
      ...mandatos.map(m => ({ titulo: `${cap(m.cargo)}, ${m.de}${m.ate ? `–${m.ate}` : '–'}`, linhas: [`${m.como ? cap(m.como) : ''}${m.aprovacao !== undefined ? `${m.como ? ' · ' : ''}aprovação ${m.aprovacao >= 60 ? 'alta' : m.aprovacao >= 45 ? 'média' : 'baixa'} no fim` : ''}`.trim(), ...m.marcos].filter(Boolean) })),
      ...(p.partidos?.length ? [{ titulo: 'Partidos', linhas: p.partidos.map(x => `${anoDe(x.tInicio)}${x.tFim !== undefined ? `–${anoDe(x.tFim)}` : '–'} · ${x.sigla}`) }] : [])
    ],
    peso: mandatos.length * 12 + eleicoes.length * 3 + (((p.tFim ?? v.t) - p.tInicio) / 12)
  };
}

/* ============================================================ Farda */

/** Os postos das Forças Armadas (o serviço inicial, as praças e os oficiais). */
const FORCAS = new Set(['soldado_ep', 'cabo_ep', 'aluno_sargento', 'sargento', 'subtenente', 'cadete', 'aluno_oficial_tecnico', 'tenente', 'capitao', 'major', 'tenente_coronel', 'coronel']);

function trajetoriaMilitar(v: Vida): TrajetoriaDaVida | undefined {
  const m = v.caminhos.militar;
  if (!m) return undefined;
  const empregos = [...v.trabalho.historico, ...(v.trabalho.atual ? [{ ...v.trabalho.atual, tFim: v.t, motivo: 'atual' }] : [])].filter(e => FORCAS.has(e.ocupacaoId) || [...(e.postos ?? [])].some(p => FORCAS.has(p.ocupacaoId)));
  const de = anoDe(m.tIngresso);
  const ativa = v.trabalho.atual?.contrato === 'militar';
  const fim = empregos.length ? Math.max(...empregos.map(e => e.tFim)) : v.t;
  const ate = ativa ? undefined : anoDe(fim);
  const postos = empregos.flatMap(e => [...(e.postos ?? []).map(p => ({ oc: p.ocupacaoId, t: p.t })), { oc: e.ocupacaoId, t: e.tPosto ?? e.tInicio }]);
  const vistos = new Set<string>();
  const escada = postos.sort((a, b) => a.t - b.t).filter(p => (vistos.has(p.oc) ? false : (vistos.add(p.oc), true)));
  const final = escada[escada.length - 1];
  const guarn = m.guarnicoes ?? [{ municipioId: m.guarnicao, t: m.tGuarnicao }];
  const r: Realizacao[] = [];
  // Os marcos que o motor de fato simula (FIX final da generalização): o ingresso, a formação concluída, cada
  // posto, os cursos de carreira, a especialidade, as guarnições, o reconhecimento em boletim, o que marcou nas
  // situações, e o fim (a baixa, a saída, a reserva). Sem medalha inventada: uma carreira curta tem poucos marcos.
  const primeiro = escada[0];
  if (primeiro) r.push({ texto: `Ingresso: ${nomeOcupacao(v, ocupacaoOuNula(primeiro.oc)!)} (${anoDe(primeiro.t)})`, peso: 1 });
  escada.slice(1).forEach((p, k) => {
    const posto = nomeOcupacao(v, ocupacaoOuNula(p.oc)!);
    const formacao = (ocupacaoOuNula(escada[k].oc)?.nivel ?? 1) === 0;
    r.push({ texto: formacao ? `Concluiu a formação: ${posto} (${anoDe(p.t)})` : `${cap(posto)} (${anoDe(p.t)})`, peso: 3 + (ocupacaoOuNula(p.oc)?.nivel ?? 0) });
  });
  for (const c of m.cursos) r.push({ texto: c === 'altos_estudos' ? 'Curso de altos estudos militares' : 'Curso de aperfeiçoamento militar', peso: 4 });
  if (m.especialidade) r.push({ texto: `Especialidade: ${ESPECIALIDADES[m.especialidade]?.nome ?? m.especialidade}`, peso: 1.5 });
  if (guarn.length >= 2) r.push({ texto: `Serviu em ${guarn.length} guarnições: ${listaNatural(guarn.map(x => municipio(x.municipioId).nome))}`, peso: 1 + guarn.length * 0.5 });
  if (v.fatos['mil_elogios']) r.push({ texto: `${v.fatos['mil_elogios']} ${v.fatos['mil_elogios'] === 1 ? 'elogio' : 'elogios'} em boletim`, peso: 5 });
  for (const x of (v.caminhos.situacoes ?? []).filter(y => y.trajetoria === 'militar' && y.desfecho === 'otimo')) r.push({ texto: `${x.texto} (${anoDe(x.t)})`, peso: 3 });
  const reserva = v.fatos['mil_reserva'];
  const anosServ = Math.round((fim - m.tIngresso) / 12);
  if (m.quadro === 'temporario' && anosServ >= 2) r.push({ texto: `Engajou: ${anos(anosServ)} de serviço temporário`, peso: 1.5 });
  if (reserva !== undefined) r.push({ texto: `Foi para a reserva em ${anoDe(reserva)}`, peso: 4 });
  else if (!ativa) {
    // O fim é o que aconteceu: a baixa do temporário (com o certificado de reservista), ou a saída de quem era de carreira.
    const ultimo = empregos.reduce<typeof empregos[number] | undefined>((a, e) => (!a || e.tFim > a.tFim ? e : a), undefined);
    if (ultimo) r.push({ texto: m.quadro === 'temporario' || /baixa/.test(ultimo.motivo ?? '') ? `Deu baixa ${SIGLA_DA[m.forca]} em ${anoDe(ultimo.tFim)}, com o certificado de reservista` : `Deixou ${NOME_FORCA[m.forca]} em ${anoDe(ultimo.tFim)}, depois de ${anos(anosServ)}`, peso: 0.8 });
  }
  return {
    id: 'militar', area: 'militar', titulo: cap(NOME_FORCA[m.forca].replace(/^(o|a) /, '')), periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${anos(anosServ)} ${m.quadro === 'temporario' ? 'de serviço temporário' : 'de carreira'}${final ? `, ${ativa ? 'hoje' : 'por último'} ${nomeOcupacao(v, ocupacaoOuNula(final.oc)!)}` : ''}; ${guarn.length} ${guarn.length === 1 ? 'guarnição' : 'guarnições'}${m.especialidade ? `; especialidade: ${ESPECIALIDADES[m.especialidade]?.nome ?? m.especialidade}` : ''}.`,
    realizacoes: top(r), reconhecimento: v.fatos['mil_elogios'] ? [`${v.fatos['mil_elogios']} ${v.fatos['mil_elogios'] === 1 ? 'elogio' : 'elogios'} em boletim`] : [],
    detalhe: [
      ...(escada.length ? [{ titulo: 'Postos', linhas: escada.map(p => `${anoDe(p.t)} · ${nomeOcupacao(v, ocupacaoOuNula(p.oc)!)}`) }] : []),
      { titulo: 'Guarnições', linhas: guarn.map(g => `${anoDe(g.t)} · ${municipio(g.municipioId).nome}`) },
      ...((() => { const s = (v.caminhos.situacoes ?? []).filter(x => x.trajetoria === 'militar'); return s.length ? [{ titulo: 'Momentos', linhas: s.slice(-6).reverse().map(x => `${anoDe(x.t)} · ${x.texto}`) }] : []; })())
    ],
    peso: anosServ * 2 + r.reduce((s, x) => s + x.peso, 0)
  };
}

/* ============================================================ Campo */

function trajetoriaRural(v: Vida): TrajetoriaDaVida | undefined {
  const ru = v.caminhos.rural;
  if (!ru) return undefined;
  const safras = ru.safras ?? [];
  const de = anoDe(ru.tInicio);
  const ativa = v.trabalho.atual?.ocupacaoId === 'produtor_rural';
  const ate = ativa ? undefined : safras.length ? safras[safras.length - 1].ano : de;
  const boas = safras.filter(s => s.resultado === 'boa').length, ruins = safras.filter(s => s.resultado === 'ruim').length;
  const sitio = v.financas.bens.find(b => b.tipo === 'imovel' && b.modeloId === 'sitio');
  const r: Realizacao[] = [];
  if (sitio) r.push({ texto: `Comprou a própria terra em ${anoDe(sitio.tCompra)}`, peso: 7 });
  if (ru.cooperativa) r.push({ texto: 'Entrou para a cooperativa', peso: 3 });
  for (const m of v.caminhos.marcas.filter(x => x.trilha === 'campo')) r.push({ texto: m.texto.replace(/\.$/, ''), peso: m.peso + 1 });
  for (const x of (v.caminhos.situacoes ?? []).filter(y => y.trajetoria === 'rural' && y.desfecho === 'otimo')) r.push({ texto: `${x.texto} (${anoDe(x.t)})`, peso: 4 });
  // Os anos duros também são história: a pior sequência.
  let seq = 0, pior = 0, fimPior = 0;
  for (const s of safras) { seq = s.resultado === 'ruim' ? seq + 1 : 0; if (seq > pior) { pior = seq; fimPior = s.ano; } }
  if (pior >= 2) r.push({ texto: `Atravessou ${pior} safras ruins seguidas (até ${fimPior})`, peso: 4 });
  const CULT: Record<string, string> = { lavoura: 'lavoura', leite: 'leite', horta: 'horta', misto: 'roça e criação' };
  return {
    id: 'rural', area: 'rural', titulo: 'O campo', periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${safras.length ? `${safras.length} ${safras.length === 1 ? 'safra' : 'safras'}: ${boas} boas, ${ruins} ruins` : 'A primeira safra ainda não veio'} — ${CULT[ru.cultura]}, ${ru.terra === 'propria' ? 'na própria terra' : ru.terra === 'familia' ? 'na terra da família' : 'em terra arrendada'}.`,
    realizacoes: top(r), reconhecimento: [],
    detalhe: safras.length ? [{ titulo: 'Safra a safra', linhas: [...safras].reverse().slice(0, 20).map(s => `${s.ano} · ${s.resultado}${s.coop ? ' (com a cooperativa)' : ''}`) }] : [],
    peso: safras.length * 2 + r.reduce((s, x) => s + x.peso, 0)
  };
}

/* ============================================================ Negócio */

function trajetoriaNegocio(v: Vida): TrajetoriaDaVida | undefined {
  const n = v.caminhos.negocio;
  if (!n) return undefined;
  const de = anoDe(n.tInicio);
  const ativa = n.estado !== 'fechado';
  const ate = ativa ? undefined : anoDe(n.tFim ?? v.t);
  const marcas = v.caminhos.marcas.filter(m => m.tipo === 'negocio_aberto' || m.tipo === 'negocio_fechado' || (m.tipo === 'conquista' && m.ocupacaoId === n.ocupacaoId));
  const r: Realizacao[] = marcas.map(m => ({ texto: `${m.texto.replace(/\.$/, '')} (${anoDe(m.t)})`, peso: m.peso + 1 }));
  for (const x of (v.caminhos.situacoes ?? []).filter(y => (y.trajetoria === 'negocio' || y.trajetoria === 'autonomo') && y.desfecho === 'otimo')) r.push({ texto: `${x.texto} (${anoDe(x.t)})`, peso: 3 });
  const durou = Math.max(1, Math.round(((n.tFim ?? v.t) - n.tInicio) / 12));
  return {
    id: 'negocio', area: 'negocio', titulo: n.nome, periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${anos(durou)} de negócio${(n.unidades ?? 1) > 1 ? `, ${n.unidades} frentes` : ''}${n.equipe?.length ? `, ${n.equipe.length} ${n.equipe.length === 1 ? 'pessoa' : 'pessoas'} na equipe` : ''}${!ativa ? '; fechado' : ''}.`,
    realizacoes: top(r), reconhecimento: [], detalhe: [], peso: durou * 4 + r.reduce((s, x) => s + x.peso, 0)
  };
}

/* ============================================================ Trabalho comum */

/** As trilhas que já têm trajetória própria (não se repetem como "emprego"). */
const PROPRIAS = new Set(['medicina', 'academia', 'docencia_superior', 'atleta', 'cena', 'musica', 'orquestra', 'danca', 'campo', 'politica']);

function trajetoriasDeEmprego(v: Vida): TrajetoriaDaVida[] {
  const todos: (Emprego & { tFim: number; motivo: string })[] = [...v.trabalho.historico, ...(v.trabalho.atual ? [{ ...v.trabalho.atual, tFim: v.t, motivo: 'atual' }] : [])];
  const porTrilha = new Map<string, typeof todos>();
  for (const e of todos) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    if (!oc || e.contrato === 'militar' || e.contrato === 'eletivo' || PROPRIAS.has(oc.trilha)) continue;
    const m = mercadoDe(oc);
    if (m === 'esporte' || m === 'arte' || m === 'academia' || m === 'militar' || m === 'politica' || m === 'rural' || m === 'negocio') continue;
    const k = oc.trilha;
    porTrilha.set(k, [...(porTrilha.get(k) ?? []), e]);
  }
  const out: TrajetoriaDaVida[] = [];
  for (const [trilha, es] of porTrilha) {
    const meses = es.reduce((s, e) => s + (e.tFim - e.tInicio), 0);
    if (meses < 24) continue;
    const ord = [...es].sort((a, b) => a.tInicio - b.tInicio);
    const de = anoDe(ord[0].tInicio);
    const ativa = ord.some(e => e.motivo === 'atual');
    const ate = ativa ? undefined : anoDe(Math.max(...ord.map(e => e.tFim)));
    // Os cargos, em ordem (os postos de antes dentro de cada emprego, e o último).
    const cargos = ord.flatMap(e => [...(e.postos ?? []).map(p => p.ocupacaoId), e.ocupacaoId]).filter((x, i, xs) => xs.indexOf(x) === i);
    const nome = (id: string) => nomeOcupacao(v, ocupacaoOuNula(id)!);
    const empresas = [...new Set(ord.map(e => e.empregador))];
    // As promoções saem dos próprios cargos (os postos de cada emprego): não dependem de uma marca ter sido escrita.
    const r: Realizacao[] = [];
    for (const e of ord) {
      const seq = [...(e.postos ?? []), { ocupacaoId: e.ocupacaoId, t: e.tPosto ?? e.tInicio }];
      for (let k = 1; k < seq.length; k++) r.push({ texto: `Passou a ${nome(seq[k].ocupacaoId)} ${naCasa(e.empregador)} (${anoDe(seq[k].t)})`, peso: 3 + (ocupacaoOuNula(seq[k].ocupacaoId)?.nivel ?? 0) });
    }
    // A marca de liderança que é a própria promoção (o mesmo ano de um posto novo) não se conta duas vezes.
    const anosDePosto = new Set(ord.flatMap(e => [...(e.postos ?? []).slice(1).map(p => anoDe(p.t)), anoDe(e.tPosto ?? e.tInicio)]));
    for (const m of v.caminhos.marcas.filter(x => x.tipo === 'lideranca' && x.trilha === trilha && !(anosDePosto.has(anoDe(x.t)) && /^Promovid/.test(x.texto)))) r.push({ texto: `${m.texto.replace(/\.$/, '')} (${anoDe(m.t)})`, peso: m.peso + 2 });
    const janela = (t: number) => ord.some(e => t >= e.tInicio && t <= e.tFim);
    for (const x of (v.caminhos.situacoes ?? []).filter(y => y.trajetoria === 'emprego' && janela(y.t) && y.desfecho === 'otimo')) r.push({ texto: `${x.texto} (${anoDe(x.t)})`, peso: 3 });
    const saidas = ord.filter(e => /demiss|demitid|corte|fechou/i.test(e.motivo));
    for (const e of saidas) r.push({ texto: `Saiu ${daCasa(e.empregador)}: ${e.motivo} (${anoDe(e.tFim)})`, peso: 2 });
    if (v.trabalho.aposentadoria && !ativa && Math.abs(v.trabalho.aposentadoria.t - Math.max(...ord.map(e => e.tFim))) <= 12) r.push({ texto: `Aposentou-se em ${anoDe(v.trabalho.aposentadoria.t)}`, peso: 4 });
    const maisLonga = [...ord].sort((a, b) => (b.tFim - b.tInicio) - (a.tFim - a.tInicio))[0];
    out.push({
      id: `emprego:${trilha}`, area: 'emprego', titulo: cap(ROTULO_TRILHA[trilha] ?? trilha), periodo: periodo(de, ate, ativa), de, ate, ativa,
      resumo: `${anos(Math.round(meses / 12))}, ${empresas.length === 1 ? naCasa(empresas[0]) : `${empresas.length} lugares (o mais longo: ${maisLonga.empregador}, ${anos(Math.max(1, Math.round((maisLonga.tFim - maisLonga.tInicio) / 12)))})`}${cargos.length > 1 ? `; de ${nome(cargos[0])} a ${nome(cargos[cargos.length - 1])}` : `; ${nome(cargos[0])}`}.`,
      realizacoes: top(r), reconhecimento: [],
      detalhe: [{ titulo: 'Onde trabalhou', linhas: [...ord].reverse().map(e => `${anoDe(e.tInicio)}${e.motivo === 'atual' ? '–' : `–${anoDe(e.tFim)}`} · ${[...(e.postos ?? []).map(p => nome(p.ocupacaoId)), nome(e.ocupacaoId)].join(' → ')}, ${e.empregador}${e.motivo && e.motivo !== 'atual' ? ` (${e.motivo})` : ''}`) }],
      peso: meses / 12 * 2 + r.reduce((s, x) => s + x.peso, 0)
    });
  }
  return out;
}

/* ============================================================ O banco (Carreira de técnico 2.0) */

/**
 * A carreira de técnico é uma trajetória própria — não se mistura com a de
 * jogador (que continua listada ao lado, com a tabela dela). O resumo fala a
 * língua do banco: clubes, jogos, V/E/D, títulos; as realizações são os
 * títulos, os acessos, a seleção; o histórico é passagem a passagem.
 */
function trajetoriaDeTecnico(v: Vida): TrajetoriaDaVida | undefined {
  const c = v.caminhos.tecnico;
  if (!c || !c.passagens.length) return undefined;
  const g = ge(v);
  const res = resumoDoTecnico(c);
  const ativa = c.tFim === undefined;
  const de = periodoDaPassagem(c.passagens[0]).de;
  const ultima = c.passagens[c.passagens.length - 1];
  const ate = ativa ? undefined : periodoDaPassagem(ultima).ate ?? de;
  const r: Realizacao[] = [];
  for (const p of c.passagens) for (const t of p.temporadas) {
    for (const x of t.titulos ?? []) { const n = nivelDaCompeticao(x); r.push({ texto: `${x} com ${p.selecao ? aSelecao(p.clube) : oClube(p.clube)} (${t.ano})`, peso: n === 4 || /mundial/.test(x) ? 9 : n === 3 || /continental/.test(x) ? 7 : n === 2 ? 5 : 4 }); }
    if (t.acesso) r.push({ texto: `Acesso com ${oClube(p.clube)} (${t.ano})`, peso: 4 });
  }
  const selecao = c.passagens.find(p => p.selecao);
  if (selecao) r.push({ texto: `${flex(g, 'Técnico', 'Técnica')} da ${aSelecao(selecao.clube).replace(/^a /, '')} (${periodoDaPassagem(selecao).de})`, peso: 8 });
  const primeira = c.passagens[0];
  r.push({ texto: `Primeiro time como ${flex(g, 'técnico', 'técnica')} principal: ${primeira.clube} (${periodoDaPassagem(primeira).de})`, peso: 1 });
  // O que o banco viveu e marcou (os momentos ótimos: o vestiário unido, a final, o cargo salvo).
  for (const x of (v.caminhos.situacoes ?? []).filter(y => y.trajetoria === 'tecnico' && y.desfecho === 'otimo')) r.push({ texto: `${x.texto.replace(/\.$/, '')} (${anoDe(x.t)})`, peso: 3 });
  const demissoes = c.passagens.filter(p => p.saida === 'demissao');
  const reconhecimento = selecao ? [`${flex(g, 'Chamado', 'Chamada')} para dirigir ${aSelecao(selecao.clube)}`] : [];
  return {
    id: 'tecnico', area: 'tecnico', titulo: `${flex(g, 'Técnico', 'Técnica')} de futebol`, periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${linhaDoTecnico(c)}${res.acessos ? `, ${res.acessos} ${res.acessos === 1 ? 'acesso' : 'acessos'}` : ''}${res.rebaixamentos ? `, ${res.rebaixamentos} ${res.rebaixamentos === 1 ? 'rebaixamento' : 'rebaixamentos'}` : ''}${demissoes.length ? `; ${demissoes.length} ${demissoes.length === 1 ? 'demissão' : 'demissões'}` : ''}.`,
    realizacoes: top(r), reconhecimento,
    detalhe: [{ titulo: 'Passagens', linhas: [...c.passagens].reverse().map(p => { const x = resumoDaPassagem(p); const pr = periodoDaPassagem(p); return `${p.clube} · ${pr.de}${p.ate === undefined ? '–' : pr.ate !== pr.de ? `–${pr.ate}` : ''} — ${x.jogos} jogos · ${x.v} V · ${x.e} E · ${x.d} D${x.titulos.length ? ` · ${x.titulos.join(', ')}` : ''} · ${comoAcabou(v, p)}`; }) }],
    peso: res.temporadas * 2 + r.reduce((a, x) => a + x.peso, 0)
  };
}

/* ============================================================ Formação (a universidade vivida) */

function trajetoriaDeFormacao(v: Vida): TrajetoriaDaVida | undefined {
  const sup = v.educacao.concluidos.filter(c => c.nivel === 'superior' || c.nivel === 'tecnico');
  const viv = (v.educacao.vivencias ?? []).filter(x => !['time', 'olimpiada', 'projeto', 'reforco', 'ciencias', 'gremio', 'xadrez', 'grupo_estudos'].includes(x.tipo) && x.anos >= 1);
  const m = v.educacao.matricula;
  if (!sup.length && !viv.length) return undefined;
  const de = anoDe(Math.min(...viv.map(x => x.t), ...sup.map(c => c.tFim - 48), m ? v.t : Infinity));
  const ativa = !!m && !m.trancado;
  const ate = ativa ? undefined : anoDe(Math.max(...sup.map(c => c.tFim), ...viv.map(x => x.tFim ?? x.t)));
  const NOME: Record<string, string> = { iniciacao: 'Iniciação científica', monitoria: 'Monitoria', extensao: 'Extensão', centro_academico: 'Centro acadêmico', atletica: 'Atlética', empresa_junior: 'Empresa júnior', projeto_tecnico: 'Projeto técnico' };
  const r: Realizacao[] = [];
  for (const c of sup) r.push({ texto: `${c.nome} (${anoDe(c.tFim)}, ${c.instituicao})`, peso: 4 });
  for (const x of viv.filter(y => y.feito)) r.push({ texto: `${NOME[x.tipo] ?? x.tipo}: ${x.feito}`, peso: 3 });
  return {
    id: 'formacao', area: 'formacao', titulo: 'A faculdade', periodo: periodo(de, ate, ativa), de, ate, ativa,
    resumo: `${sup.length ? listaNatural(sup.map(c => c.nome)) : m ? 'Em curso' : 'Sem diploma'}${viv.length ? `; ${listaNatural(viv.map(x => (NOME[x.tipo] ?? x.tipo).toLowerCase()))}` : ''}.`,
    realizacoes: top(r), reconhecimento: [],
    detalhe: viv.length ? [{ titulo: 'O que viveu além das aulas', linhas: viv.map(x => `${anoDe(x.t)} · ${NOME[x.tipo] ?? x.tipo}${x.anos >= 2 ? `, ${anos(x.anos)}` : ''}${x.papel ? ` — ${x.papel}` : ''}${x.feito ? ` — ${x.feito}` : ''}${(x.marcos ?? []).length ? ` · ${x.marcos![x.marcos!.length - 1].texto}` : ''}`) }] : [],
    peso: sup.length * 4 + r.reduce((s, x) => s + x.peso, 0) + viv.length
  };
}

/* ============================================================ A vida inteira */

/**
 * Todas as trajetórias da pessoa, em ordem de começo. Uma carreira que
 * acabou continua aqui (inclusive as esportivas arquivadas).
 */
export function trajetoriasDaVida(v: Vida): TrajetoriaDaVida[] {
  const out: (TrajetoriaDaVida | undefined)[] = [
    trajetoriaDeFormacao(v),
    ...carreirasEsportivas(v).map((e, k) => trajetoriaEsportiva(v, e, k)),
    trajetoriaDeTecnico(v),
    trajetoriaDeAtuacao(v),
    ...(['musica', 'danca', 'escrita', 'desenho', 'fotografia'] as Dominio[]).map(d => trajetoriaArtistica(v, d)),
    trajetoriaAcademica(v),
    trajetoriaMedica(v),
    trajetoriaMilitar(v),
    trajetoriaRural(v),
    trajetoriaNegocio(v),
    ...trajetoriasDeEmprego(v),
    trajetoriaPolitica(v)
  ];
  return out.filter((x): x is TrajetoriaDaVida => !!x).sort((a, b) => a.de - b.de || b.peso - a.peso);
}

/**
 * O legado em frases (a biografia, não o histórico): uma frase por
 * trajetória que definiu a vida — o período, o que se fez, e o que mais
 * marcou. Usado pela retrospectiva do fim da vida.
 */
export function legadoEmFrases(v: Vida, n = 4): { texto: string; peso: number; area: AreaTrajetoria }[] {
  return trajetoriasDaVida(v)
    .filter(t => t.area !== 'formacao' && t.peso >= 12)
    .sort((a, b) => b.peso - a.peso)
    .slice(0, n)
    .map(t => {
      const marca = t.realizacoes.slice(0, t.area === 'esporte' || t.area === 'politica' ? 2 : 1);
      const resumo = t.resumo.replace(/\.$/, '');
      return { texto: `${t.titulo} (${t.periodo}): ${resumo.charAt(0).toLowerCase()}${resumo.slice(1)}${marca.length ? `. ${marca.join('; ')}` : ''}.`, peso: 60 + Math.min(60, t.peso), area: t.area };
    });
}
