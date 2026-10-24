/**
 * REWORK 11 · Fase B (CAR-11.1) — A SITUAÇÃO PROFISSIONAL, LIDA DE UM LUGAR SÓ.
 *
 * Não existe um objeto "estado profissional": há o emprego (`trabalho.atual`), a carreira de atleta
 * (`caminhos.esporte`), a de técnico (`caminhos.tecnico`), o negócio, a política, a farda, a arte, o que corre em
 * paralelo e o que ficou pausado. Cada tela perguntava só "tem `trabalho.atual`?" — e o atleta sem clube virava
 * "Sem trabalho", o técnico demitido virava "procurando", a carreira sumia da divisão Trabalho.
 *
 * `situacaoProfissional(v)` é uma LEITURA (pura, sem estado novo, sem RNG): separa a vocação/carreira, a profissão de
 * agora, o vínculo (contrato, por conta, mandato... ou nenhum), onde (empregador, clube, organização), o cargo, a
 * situação (ativo, sem clube, sem contrato, desempregado, aposentado, encerrada...), o que corre em paralelo e a
 * experiência. Funciona com o estado de hoje e com o que a Fase C (o motor do esporte) acrescentar: o atleta sem clube
 * é `esporte.fase === 'profissional'` sem emprego de atleta — com ou sem um campo novo de "último clube".
 *
 * Também mora aqui o mecanismo genérico de VOCABULÁRIO CORPORATIVO (`temChefia`, `temEmpresa`, `temOrgao`): quem não
 * tem chefia (autônomo, bolsista, sócio, árbitro) não "almoça com a chefia"; quem não tem empresa não faz "o curso da
 * empresa". As carreiras com modo próprio (técnico: Fase C; artista: Fase D) podem usar as mesmas funções.
 *
 * Camada: só importa sistemas de base (trabalho, esporte, negócio, ritmo) — nada de `profissao` ou `tecnico` (que
 * moram em pacotes acima): oportunidades e compromissos, que estão embaixo, também a leem.
 */

import type { CarreiraEsportiva, Contrato, Emprego, PassagemDeTecnico, Vida } from '../tipos';
import { ocupacaoOuNula, type Ocupacao } from '../dados/ocupacoes';
import { familiaDaTrilha } from '../dados/carreiras';
import { eDasForcas, nomeOcupacao } from './trabalho';
import { OCUPACOES_DE_ATLETA, ocupacaoDaModalidade } from './esporte';
import { semVinculo } from './perfisEsportivos';
import { negocioAberto } from './negocio';
import { comChefia } from './ritmo';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';

/** A vocação/carreira (o "mundo" da trajetória), não o emprego de agora. */
export type CarreiraProfissional = 'esporte' | 'tecnico' | 'arte' | 'politica' | 'militar' | 'academia' | 'negocio' | 'crime' | 'emprego' | 'nenhuma';

/** Em que pé a carreira está. `sem_clube`/`sem_contrato`: a carreira continua, sem vínculo agora. */
export type SituacaoDaCarreira = 'ativo' | 'sem_clube' | 'sem_contrato' | 'pausada' | 'desempregado' | 'aposentado' | 'encerrada' | 'preso' | 'cuidando' | 'nenhuma';

/** O vínculo de agora — ou nenhum (a carreira especial sem contrato continua sem vínculo). */
export type VinculoProfissional = Contrato | 'contrato_esportivo' | 'comando' | 'dono' | 'nenhum';

export interface AtividadeParalela {
  tipo: 'paralela' | 'negocio' | 'pausada' | 'politica' | 'arte' | 'carreira_parada' | 'por_fora';
  rotulo: string;
}

export interface SituacaoProfissional {
  carreira: CarreiraProfissional;
  situacao: SituacaoDaCarreira;
  /** Em uma linha, como a tela diz: "Jogador de futebol sem clube", "Auxiliar administrativo", "Técnico sem clube". */
  rotulo: string;
  /** Um detalhe curto (onde, desde quando, o último clube). */
  detalhe?: string;
  /** A ocupação (a de agora; sem vínculo, a da carreira). */
  ocupacaoId?: string;
  profissao?: string;
  vinculo: VinculoProfissional;
  /** Onde se trabalha agora (empregador, clube, órgão, o próprio negócio). Sem vínculo, vazio. */
  onde?: { nome: string; municipioId?: string; nivel?: number };
  /** Onde foi o último vínculo da carreira (o último clube de quem está sem clube). */
  ultimoOnde?: { nome: string; ate?: number };
  /** O contrato que existe (prazo e salário) — inexistente, nada: nenhum salário contratual é dito sem contrato. */
  contrato?: { ate?: number; salario?: number };
  /** O cargo/função dentro do vínculo (a posição do atleta, a área do ofício). */
  cargo?: string;
  /** Desde quando está nesta situação. */
  desde?: number;
  /** Carreira de mercado próprio (esporte, técnico, arte, política, farda): não é um "emprego comum". */
  especial: boolean;
  /** Carreira especial ATIVA sem vínculo agora (atleta sem clube, técnico sem clube, artista entre trabalhos). */
  semVinculo: boolean;
  /** O que corre ao lado do principal. */
  paralelas: AtividadeParalela[];
  /** Meses por trilha (as quatro maiores, com pelo menos um ano). */
  experiencia: { trilha: string; meses: number }[];
}

/* ------------------------------------------------------------- Peças */

const ehAtleta = (e?: Emprego) => !!e && OCUPACOES_DE_ATLETA.includes(e.ocupacaoId);
const OCUPACAO_TECNICO = 'tecnico_futebol';
const ACADEMICAS = new Set(['professor_univ', 'pesquisador', 'pesquisador_instituto', 'professor_faculdade', 'coordenador_curso']);

/** A passagem aberta do técnico (a mesma regra de `tecnico.passagemAtual`, sem importar o pacote de cima). */
function passagemAberta(v: Vida): PassagemDeTecnico | undefined {
  const c = v.caminhos.tecnico;
  const p = c?.passagens[c.passagens.length - 1];
  return p && p.ate === undefined ? p : undefined;
}

/** O atleta profissional sem clube agora: a carreira segue (`fase === 'profissional'`) sem emprego de atleta. */
export function atletaSemClube(v: Vida): CarreiraEsportiva | undefined {
  const es = v.caminhos.esporte;
  return es?.fase === 'profissional' && !ehAtleta(v.trabalho.atual) ? es : undefined;
}

/** O técnico entre um clube e outro: a carreira de técnico não acabou e não há passagem aberta. */
export function tecnicoSemClube(v: Vida): boolean {
  const c = v.caminhos.tecnico;
  return !!c && c.tFim === undefined && c.passagens.length > 0 && !passagemAberta(v);
}

/** A carreira artística entre trabalhos: sem trabalho principal, com a trajetória artística pausada (não encerrada). */
function artePausada(v: Vida): Emprego | undefined {
  return (v.trabalho.pausadas ?? []).map(p => p.emprego).find(e => familiaDaTrilha(ocupacaoOuNula(e.ocupacaoId)?.trilha ?? '').progressao === 'arte');
}

/** O último clube de quem está sem clube (o campo novo da Fase C, se existir; senão, o clube que ficou guardado). */
function ultimoClube(es: CarreiraEsportiva): string | undefined {
  const x = es as CarreiraEsportiva & { ultimoClube?: string | { clube?: string; nome?: string } };
  const u = typeof x.ultimoClube === 'string' ? x.ultimoClube : x.ultimoClube?.clube ?? x.ultimoClube?.nome;
  return u || es.clube || undefined;
}

function carreiraDoEmprego(e: Emprego, oc: Ocupacao | undefined, v: Vida): CarreiraProfissional {
  if (!oc) return 'emprego';
  if (e.contrato === 'eletivo') return 'politica';
  if (ehAtleta(e)) return 'esporte';
  if (oc.trilha === 'treino' && oc.entrada === 'oportunidade') return 'tecnico';
  if (eDasForcas(oc)) return 'militar';
  if (familiaDaTrilha(oc.trilha).progressao === 'arte' && (oc.entrada === 'oportunidade' || e.clientela !== undefined || oc.trilha === 'cena')) return 'arte';
  if (ACADEMICAS.has(oc.id)) return 'academia';
  const n = negocioAberto(v);
  if (n && (n.dedicacao ?? 'integral') === 'integral' && n.ocupacaoId === e.ocupacaoId) return 'negocio';
  return 'emprego';
}

const ESPECIAIS = new Set<CarreiraProfissional>(['esporte', 'tecnico', 'arte', 'politica', 'militar']);

const nomeDe = (v: Vida, id: string) => { const oc = ocupacaoOuNula(id); return oc ? nomeOcupacao(v, oc) : id; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------- A leitura */

export function situacaoProfissional(v: Vida): SituacaoProfissional {
  const e = v.trabalho.atual;
  const es = v.caminhos.esporte;
  const g = ge(v);
  const paralelas: AtividadeParalela[] = [];
  const experiencia = Object.entries(v.trabalho.experiencia ?? {}).filter(([, m]) => m >= 12).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([trilha, meses]) => ({ trilha, meses }));

  // O que corre ao lado (vale para todos os casos abaixo).
  if (v.trabalho.paralela) paralelas.push({ tipo: 'paralela', rotulo: `${cap(nomeDe(v, v.trabalho.paralela.ocupacaoId))}, em paralelo` });
  const n = negocioAberto(v);
  const donoIntegral = !!n && !!e && (n.dedicacao ?? 'integral') === 'integral' && n.ocupacaoId === e.ocupacaoId;
  if (n && !donoIntegral && e) paralelas.push({ tipo: 'negocio', rotulo: `${n.nome}, nas horas vagas` });
  for (const p of v.trabalho.pausadas ?? []) paralelas.push({ tipo: 'pausada', rotulo: `${cap(nomeDe(v, p.emprego.ocupacaoId))}, em pausa desde ${anoDe(p.t)}` });
  const pol = v.caminhos.politica;
  if (pol && e?.contrato !== 'eletivo' && ['filiado', 'candidato', 'eleito', 'entre_mandatos'].includes(pol.fase) && e) paralelas.push({ tipo: 'politica', rotulo: pol.fase === 'candidato' ? 'Candidatura em curso' : pol.fase === 'eleito' ? 'Eleito, à espera da posse' : 'Filiação partidária' });
  if (v.caminhos.arte?.ativo && !(e && familiaDaTrilha(ocupacaoOuNula(e.ocupacaoId)?.trilha ?? '').progressao === 'arte')) paralelas.push({ tipo: 'arte', rotulo: v.caminhos.arte.nome });
  if (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined) paralelas.push({ tipo: 'por_fora', rotulo: 'Por fora (a vida à margem)' });

  const base = { paralelas, experiencia };

  if (v.justica?.prisao) return { ...base, carreira: e ? carreiraDoEmprego(e, ocupacaoOuNula(e.ocupacaoId), v) : 'nenhuma', situacao: 'preso', rotulo: 'Cumprindo pena', vinculo: 'nenhum', especial: false, semVinculo: false, desde: v.justica.prisao.tInicio };

  /* ---------------- Há um vínculo principal */
  if (e) {
    const oc = ocupacaoOuNula(e.ocupacaoId);
    const carreira = carreiraDoEmprego(e, oc, v);
    const nome = oc ? nomeOcupacao(v, oc) : 'Trabalhando';
    // A carreira especial parada ao lado do emprego (o atleta sem clube que aceitou outro trabalho; o técnico sem clube).
    if (carreira !== 'esporte' && atletaSemClube(v)) paralelas.push({ tipo: 'carreira_parada', rotulo: `Carreira de ${flex(g, 'jogador', 'jogadora')} ${semVinculo(es!.modalidade)}` });
    if (carreira !== 'tecnico' && tecnicoSemClube(v)) paralelas.push({ tipo: 'carreira_parada', rotulo: `Carreira de ${flex(g, 'técnico', 'técnica')} ${semVinculo('futebol')}` });
    if (carreira === 'esporte' && es) {
      return { ...base, carreira, situacao: 'ativo', rotulo: cap(nome), detalhe: [es.modalidade === 'tenis' ? 'no circuito' : es.clube, `desde ${anoDe(e.tInicio)}`].filter(Boolean).join(' · '), ocupacaoId: e.ocupacaoId, profissao: nome, vinculo: es.modalidade === 'tenis' ? 'autonomo' : 'contrato_esportivo', onde: es.modalidade === 'tenis' ? undefined : { nome: es.clube, municipioId: es.municipioId, nivel: es.nivel }, contrato: es.modalidade === 'tenis' ? undefined : { ate: es.contratoAte, salario: e.salario }, cargo: es.posicao, desde: es.tFase, especial: true, semVinculo: false };
    }
    if (e.ocupacaoId === OCUPACAO_TECNICO && passagemAberta(v)) {
      const p = passagemAberta(v)!;
      return { ...base, carreira: 'tecnico', situacao: 'ativo', rotulo: cap(nome), detalhe: `${p.clube} · desde ${anoDe(p.desde)}`, ocupacaoId: e.ocupacaoId, profissao: nome, vinculo: 'comando', onde: { nome: p.clube, municipioId: p.municipioId, nivel: p.nivel }, contrato: { ate: p.contratoAte, salario: p.salario }, desde: p.desde, especial: true, semVinculo: false };
    }
    const vinculo: VinculoProfissional = donoIntegral ? 'dono' : e.contrato;
    return { ...base, carreira, situacao: 'ativo', rotulo: cap(nome), detalhe: [e.empregador, `desde ${anoDe(e.tInicio)}`].filter(Boolean).join(' · '), ocupacaoId: e.ocupacaoId, profissao: nome, vinculo, onde: { nome: e.empregador, municipioId: e.municipioId }, contrato: e.clientela !== undefined || donoIntegral || e.contrato === 'informal' ? undefined : { salario: e.salario }, cargo: e.especialidade, desde: e.tPosto ?? e.tInicio, especial: ESPECIAIS.has(carreira), semVinculo: false };
  }

  /* ---------------- Sem vínculo: a carreira especial continua */
  const semClube = atletaSemClube(v);
  if (semClube) {
    const ocId = ocupacaoDaModalidade(semClube.modalidade);
    const nome = nomeDe(v, ocId);
    const ultimo = ultimoClube(semClube);
    const suspenso = semClube.suspensoAte !== undefined && v.t < semClube.suspensoAte;
    const desde = v.fatos['esp_sem_clube'] ?? v.trabalho.desempregadoDesde;
    const sem = semVinculo(semClube.modalidade);
    return {
      ...base, carreira: 'esporte', situacao: semClube.modalidade === 'tenis' ? 'sem_contrato' : 'sem_clube',
      rotulo: suspenso ? `${cap(nome)} suspens${flex(g, 'o', 'a')}` : `${cap(nome)} ${sem}`,
      detalhe: [suspenso ? `suspensão até ${anoDe(semClube.suspensoAte!)}` : desde !== undefined ? `${sem} desde ${anoDe(desde)}` : '', ultimo && semClube.modalidade !== 'tenis' ? `último clube: ${ultimo}` : ''].filter(Boolean).join(' · ') || undefined,
      ocupacaoId: ocId, profissao: nome, vinculo: 'nenhum', ultimoOnde: ultimo && semClube.modalidade !== 'tenis' ? { nome: ultimo } : undefined, cargo: semClube.posicao, desde, especial: true, semVinculo: true
    };
  }
  const tec = v.caminhos.tecnico;
  if (tecnicoSemClube(v) && tec) {
    const ult = tec.passagens[tec.passagens.length - 1];
    const nome = flex(g, 'técnico', 'técnica');
    return { ...base, carreira: 'tecnico', situacao: 'sem_clube', rotulo: `${cap(nome)} sem clube`, detalhe: [tec.semClubeDesde !== undefined ? `sem clube desde ${anoDe(tec.semClubeDesde)}` : '', ult ? `último clube: ${ult.clube}` : ''].filter(Boolean).join(' · ') || undefined, ocupacaoId: OCUPACAO_TECNICO, profissao: nome, vinculo: 'nenhum', ultimoOnde: ult ? { nome: ult.clube, ate: ult.ate } : undefined, desde: tec.semClubeDesde, especial: true, semVinculo: true };
  }
  const pausadaArte = artePausada(v);
  if (pausadaArte && !v.trabalho.aposentadoria) {
    const nome = nomeDe(v, pausadaArte.ocupacaoId);
    const pz = (v.trabalho.pausadas ?? []).find(p => p.emprego === pausadaArte);
    return { ...base, carreira: 'arte', situacao: 'pausada', rotulo: `${cap(nome)}, entre trabalhos`, detalhe: pz ? `carreira em pausa desde ${anoDe(pz.t)}` : undefined, ocupacaoId: pausadaArte.ocupacaoId, profissao: nome, vinculo: 'nenhum', desde: pz?.t, especial: true, semVinculo: true, paralelas: paralelas.filter(x => !(x.tipo === 'pausada' && x.rotulo.startsWith(cap(nome)))) };
  }
  if (pol && (pol.fase === 'candidato' || pol.fase === 'eleito')) return { ...base, carreira: 'politica', situacao: 'ativo', rotulo: pol.fase === 'candidato' ? 'Em campanha' : flex(g, 'Eleito, à espera da posse', 'Eleita, à espera da posse'), vinculo: 'nenhum', especial: true, semVinculo: false };
  if (n) return { ...base, carreira: 'negocio', situacao: 'ativo', rotulo: n.nome, detalhe: 'o próprio negócio, nas horas vagas', vinculo: 'dono', onde: { nome: n.nome }, especial: false, semVinculo: false, paralelas: paralelas.filter(x => x.tipo !== 'negocio') };
  if (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined && !v.trabalho.aposentadoria) {
    return { ...base, carreira: 'crime', situacao: 'ativo', rotulo: 'Por fora', detalhe: 'a vida à margem', vinculo: 'nenhum', especial: false, semVinculo: false, paralelas: paralelas.filter(x => x.tipo !== 'por_fora') };
  }

  /* ---------------- Sem vínculo e sem carreira em curso */
  const t = v.trabalho;
  if (t.aposentadoria) return { ...base, carreira: 'nenhuma', situacao: 'aposentado', rotulo: flex(g, 'Aposentado', 'Aposentada', 'Aposentade'), detalhe: `desde ${anoDe(t.aposentadoria.t)}`, vinculo: 'nenhum', desde: t.aposentadoria.t, especial: false, semVinculo: false };
  if (t.pausa) return { ...base, carreira: 'nenhuma', situacao: 'cuidando', rotulo: 'Uma pausa no trabalho, para cuidar', vinculo: 'nenhum', desde: t.pausa.tInicio, especial: false, semVinculo: false };
  // A última carreira especial que acabou (o ex-atleta, o ex-técnico) é dita como encerrada — não como "nunca trabalhou".
  if (es?.fase === 'encerrada' && es.tFim !== undefined && (!t.historico.length || t.historico[t.historico.length - 1].tFim <= es.tFim)) {
    const nome = nomeDe(v, ocupacaoDaModalidade(es.modalidade));
    return { ...base, carreira: 'esporte', situacao: 'encerrada', rotulo: `Ex-${nome}`, detalhe: `carreira encerrada em ${anoDe(es.tFim)}`, vinculo: 'nenhum', ultimoOnde: es.clube ? { nome: es.clube, ate: es.tFim } : undefined, desde: es.tFim, especial: false, semVinculo: false };
  }
  if (t.historico.length || t.desempregadoDesde !== undefined) return { ...base, carreira: 'nenhuma', situacao: 'desempregado', rotulo: 'Sem trabalho agora', detalhe: t.desempregadoDesde !== undefined ? `desde ${anoDe(t.desempregadoDesde)}` : undefined, vinculo: 'nenhum', desde: t.desempregadoDesde, especial: false, semVinculo: false };
  return { ...base, carreira: 'nenhuma', situacao: 'nenhuma', rotulo: 'Ainda sem trabalho', vinculo: 'nenhum', especial: false, semVinculo: false };
}

/** A carreira especial está viva agora (com ou sem contrato)? — o atleta, o técnico, o artista, a farda, o mandato. */
export const carreiraEspecialAtiva = (s: SituacaoProfissional) => s.especial && (s.situacao === 'ativo' || s.semVinculo);

/* =========================================================== Vocabulário corporativo */

/**
 * Há CHEFIA (alguém acima, no dia a dia, que lembra de você quando a vaga abre): vínculo de emprego (carteira,
 * servidor, farda, aprendiz, estágio, temporário), fora da formação e do esporte de atleta. O autônomo, o bolsista,
 * o sócio, o árbitro, o professor particular e o escritor não têm (antes, o modo do trabalho decidia: o sócio de
 * advocacia e o professor de música por conta recebiam "Almoçar com a chefia"). Uso: `noOficio` (os verbos de
 * chefia); as Fases C e D podem somar as regras dos seus modos (técnico, artista) aqui.
 */
export function temChefia(e?: Emprego): boolean {
  // A casa de família (a babá, a trabalhadora doméstica) tem patrão, não chefia com equipe e "vaga de cima".
  return comChefia(e) && ocupacaoOuNula(e!.ocupacaoId)?.trilha !== 'domestico';
}

/**
 * Há uma EMPRESA por trás (quem paga "o curso da empresa", quem tem "concorrente"): chefia com contrato privado
 * (carteira, temporário, aprendiz, estágio). Não é empresa: o serviço público e a farda (`temOrgao`), o clube do
 * técnico e do preparador, a companhia ou a produção do artista contratado por trabalho (entrada por oportunidade nos
 * setores do esporte e da criação).
 */
export function temEmpresa(e?: Emprego): boolean {
  if (!e || !temChefia(e) || e.contrato === 'servidor' || e.contrato === 'militar') return false;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc) return false;
  if (oc.entrada === 'oportunidade' && (oc.setor === 'esporte' || oc.setor === 'criativo')) return false;
  return true;
}

/** O vínculo é com o Estado (o órgão, a força): há chefia e capacitação, mas não "a empresa". */
export function temOrgao(e?: Emprego): boolean {
  return !!e && temChefia(e) && (e.contrato === 'servidor' || e.contrato === 'militar');
}
