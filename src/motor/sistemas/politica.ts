/**
 * Vida política: uma trajetória, não uma vaga.
 *
 *   PORTAS — ninguém nasce candidato. A política chega pela vida: a
 *   associação do bairro, o grêmio, o sindicato, uma causa que a vida
 *   impôs, a notoriedade no trabalho, o negócio conhecido na cidade, anos de
 *   serviço público — ou pela decisão deliberada de procurar esse meio.
 *
 *   FASES — são estados de VIDA diferentes: envolvido (reuniões, causa,
 *   gente pedindo ajuda), filiado, candidato (a campanha é um processo em
 *   etapas, com custo em dinheiro, tempo, cabeça e casa), eleito à espera
 *   da posse, com mandato (subsídio, prazo, crises, aprovação), entre
 *   mandatos (derrotado ou fora do cargo, mas ainda no meio) e encerrada.
 *   Derrota não é fim de jogo: vira história, conhecimento, às vezes volta.
 *
 *   REGRAS — as institucionais, simplificadas mas não inventadas (fontes
 *   públicas; ver o relatório): idade mínima por cargo (CF, art. 14, §3º;
 *   vereador no registro, os demais na posse — Lei 15.230/2025); filiação e
 *   domicílio eleitoral de seis meses (Lei 9.504/97, art. 9º); uma só
 *   reeleição seguida para prefeito e governador (CF, art. 14, §5º); quem
 *   governa e quer outro cargo renuncia seis meses antes (art. 14, §6º);
 *   conscrito não se candidata (art. 14, §2º); militar com menos de dez anos
 *   deixa a ativa, com mais é agregado e, eleito, vai para a inatividade
 *   (art. 14, §8º); servidor se afasta três meses antes; Ficha Limpa (LC
 *   64/90 com a LC 135/2010): condenação deixa inelegível até oito anos
 *   depois de cumprida a pena. Eleições municipais em 2028, 2032…; gerais em
 *   2030, 2034… (a de 2026 já passou quando o jogo começa).
 *
 *   NEUTRALIDADE — partidos fictícios (nomes de árvores), sem programa nem
 *   lado; prioridades são metas de gestão (saúde, escola, transporte...),
 *   nunca ideologia. Nenhuma pessoa, campanha ou slogan real.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Acao } from '../acoes';
import type { CargoEletivo, Emprego, Pessoa, Prioridade, Vida, VidaPolitica } from '../tipos';
import { escrever, filhos, idade, idadePessoa, lembrarCom, parceiro, temFato, vinculosVivos } from '../nucleo';
import { municipio, MUNICIPIOS } from '../dados/lugares';
import { ocupacao } from '../dados/ocupacoes';
import { bloqueio, PERMITIDO, podeTentar, type Veredito } from '../plausibilidade';
import { encerrarEmprego, nomeOcupacao } from './trabalho';
import { disponivel, pagar } from './dinheiro';
import { irParaReserva, sairDasForcas } from './militar';
import { mudarAgora } from './processos';
import { marcar } from './marcas';
import { abalar } from './abalo';
import { habilidade } from './frentes';
import { anoDe, idadeEm } from '../tempo';
import { dinheiro, flex, ge } from '../texto';
import { criarPessoa, vincular } from '../pessoas';
import { aplicarPersonalidade } from '../personalidade';
import type { AcaoProfissional } from './profissao';

/* ================================================================ Catálogo */

/** Partidos fictícios: nomes de árvores, sem programa nem lado. */
export const PARTIDOS = ['Partido Ipê', 'Movimento Aroeira', 'Frente Jequitibá', 'União Carnaúba', 'Partido Buriti', 'Aliança Pau-Brasil'];

export const NOME_PRIORIDADE: Record<Prioridade, string> = {
  saude: 'saúde: posto, fila, remédio', educacao: 'escola e creche', mobilidade: 'transporte e ruas', emprego: 'trabalho e renda',
  seguranca: 'segurança no bairro', ambiente: 'saneamento e meio ambiente', contas: 'as contas em dia', cultura: 'cultura e esporte'
};
export const PRIORIDADES = Object.keys(NOME_PRIORIDADE) as Prioridade[];

/** O que um mandato consegue entregar, em coisa concreta (nunca em ideologia). */
const ENTREGAS: Record<Prioridade, string[]> = {
  saude: ['o posto de saúde do bairro reaberto, com médico', 'a fila de exames mais curta', 'remédio de volta na farmácia do posto', 'uma ambulância nova para a zona rural'],
  educacao: ['uma creche nova no bairro', 'a reforma da escola que chovia dentro', 'o transporte escolar passando de novo', 'vagas de creche para a fila de espera'],
  mobilidade: ['a linha de ônibus que faltava', 'o asfalto da rua de terra', 'a ciclovia até o centro', 'semáforos na avenida das batidas'],
  emprego: ['um curso de qualificação com vaga garantida', 'a feira do bairro regularizada', 'um galpão para pequenas empresas', 'crédito para quem trabalha por conta'],
  seguranca: ['iluminação nas ruas escuras', 'a praça reformada e ocupada', 'o posto policial do bairro', 'câmeras no terminal de ônibus'],
  ambiente: ['a rede de esgoto do bairro', 'a coleta de lixo que não passava', 'a limpeza do córrego', 'árvores na avenida'],
  contas: ['as contas do órgão aprovadas sem ressalva', 'um corte de gastos que ninguém notou', 'a folha paga em dia o ano todo', 'uma dívida antiga renegociada'],
  cultura: ['a quadra do bairro coberta', 'o festival de música da cidade', 'a biblioteca reaberta', 'aulas de esporte para crianças no contraturno']
};

interface ModeloCargo { tipo: 'municipal' | 'geral'; anos: 4 | 8; executivo: boolean; idade: number; escopo: 'municipio' | 'estado' }
export const CARGOS: Record<CargoEletivo, ModeloCargo> = {
  vereador: { tipo: 'municipal', anos: 4, executivo: false, idade: 18, escopo: 'municipio' },
  prefeito: { tipo: 'municipal', anos: 4, executivo: true, idade: 21, escopo: 'municipio' },
  deputado_estadual: { tipo: 'geral', anos: 4, executivo: false, idade: 21, escopo: 'estado' },
  deputado_federal: { tipo: 'geral', anos: 4, executivo: false, idade: 21, escopo: 'estado' },
  senador: { tipo: 'geral', anos: 8, executivo: false, idade: 35, escopo: 'estado' },
  governador: { tipo: 'geral', anos: 4, executivo: true, idade: 30, escopo: 'estado' }
};
export const ORDEM_CARGOS: CargoEletivo[] = ['vereador', 'prefeito', 'deputado_estadual', 'deputado_federal', 'senador', 'governador'];

export const nomeCargo = (v: Vida, c: CargoEletivo) => nomeOcupacao(v, ocupacao(c));

/* =============================================================== Calendário */

export const tipoDeEleicao = (ano: number): 'municipal' | 'geral' | undefined =>
  (ano - 2028) % 4 === 0 && ano >= 2028 ? 'municipal' : (ano - 2030) % 4 === 0 && ano >= 2030 ? 'geral' : undefined;

/** Primeiro domingo de outubro, na unidade do jogo: mês 9 do ano. */
export const tDaEleicao = (ano: number) => ano * 12 + 9;
/** A posse: janeiro do ano seguinte. */
export const tDaPosse = (ano: number) => (ano + 1) * 12;

/** A próxima eleição (de um tipo, ou qualquer uma) a partir de um instante. */
export function proximaEleicao(t: number, tipo?: 'municipal' | 'geral'): { ano: number; tipo: 'municipal' | 'geral'; t: number } {
  let ano = anoDe(t);
  for (;;) {
    const x = tipoDeEleicao(ano);
    if (x && (!tipo || x === tipo) && tDaEleicao(ano) > t) return { ano, tipo: x, t: tDaEleicao(ano) };
    ano++;
  }
}

/** Há eleição nos próximos doze meses? (a janela de registrar candidatura dentro do ano vivido). */
export function eleicaoNaJanela(v: Vida): { ano: number; tipo: 'municipal' | 'geral'; t: number } | undefined {
  const e = proximaEleicao(v.t);
  return e.t <= v.t + 12 ? e : undefined;
}

/* ========================================================= Fase e leitura */

export type FasePolitica = VidaPolitica['fase'] | 'fora';
export const fasePolitica = (v: Vida): FasePolitica => v.caminhos.politica?.fase ?? 'fora';
export const naPolitica = (v: Vida) => { const f = fasePolitica(v); return f !== 'fora' && f !== 'encerrada'; };
export const emMandato = (v: Vida) => fasePolitica(v) === 'mandato' && !!v.caminhos.politica?.mandato;

const palavraApoio = (x: number) => (x < 15 ? 'quase ninguém' : x < 35 ? 'um grupo pequeno' : x < 55 ? 'uma base de bairro' : x < 75 ? 'uma base sólida' : 'muita gente');
const palavraReputacao = (x: number) => (x < 15 ? 'pouco conhecido' : x < 35 ? 'conhecido no bairro' : x < 60 ? 'conhecido na cidade' : x < 80 ? 'nome conhecido no estado' : 'figura pública');
const palavraAprovacao = (x: number) => (x < 25 ? 'reprovado nas ruas' : x < 42 ? 'desgastado' : x < 58 ? 'dividido' : x < 72 ? 'bem avaliado' : 'muito bem avaliado');

export interface LeituraPolitica {
  fase: FasePolitica;
  titulo: string;
  etapa?: string;
  reputacao: string;
  apoio: string;
  aprovacao?: string;
  prioridade?: string;
  partido?: string;
  horizonte?: string;
  historico: string[];
}

export function leituraPolitica(v: Vida): LeituraPolitica | undefined {
  const p = v.caminhos.politica;
  if (!p) return undefined;
  const g = ge(v);
  const hist = p.historico.slice(-4).reverse().map(h => `${anoDe(h.t)}: ${nomeCargo(v, h.cargo)} — ${h.resultado === 'eleito' ? flex(g, 'eleito', 'eleita', 'eleite') : h.resultado === 'derrotado' ? 'não se elegeu' : h.resultado === 'renunciou' ? 'renunciou' : h.resultado === 'cassado' ? 'mandato cassado' : 'mandato cumprido'}`);
  const rep = palavraReputacao(p.reputacao);
  const apoio = palavraApoio(p.apoio);
  const prio = p.prioridade ? NOME_PRIORIDADE[p.prioridade] : undefined;
  const e = eleicaoNaJanela(v);
  const prox = proximaEleicao(v.t);
  if (p.fase === 'mandato' && p.mandato) {
    const m = p.mandato;
    const total = Math.round((m.tFim - m.tInicio) / 12);
    const ano = Math.min(total, Math.floor((v.t - m.tInicio) / 12) + 1);
    return { fase: p.fase, titulo: `${cap(nomeCargo(v, m.cargo))}${p.consecutivos >= 2 && CARGOS[m.cargo].executivo ? ', segundo mandato' : ''}`, etapa: `Ano ${ano} de ${total} do mandato · termina em ${anoDe(m.tFim)}`, reputacao: rep, apoio, aprovacao: palavraAprovacao(m.aprovacao), prioridade: prio, partido: p.partido, horizonte: horizonteDoMandato(v), historico: hist };
  }
  if (p.fase === 'eleito' && p.posse) return { fase: p.fase, titulo: `${cap(flex(g, 'Eleito', 'Eleita', 'Eleite'))} ${nomeCargo(v, p.posse.cargo)}`, etapa: `Posse em ${anoDe(p.posse.t)}`, reputacao: rep, apoio, prioridade: prio, partido: p.partido, historico: hist };
  if (p.fase === 'candidato' && p.campanha) return { fase: p.fase, titulo: `${flex(g, 'Candidato', 'Candidata', 'Candidate')} a ${nomeCargo(v, p.campanha.cargo)}`, etapa: `Eleição em outubro de ${anoDe(p.campanha.tEleicao)}`, reputacao: rep, apoio, prioridade: prio, partido: p.partido, horizonte: 'A campanha está na rua. Agora, é a apuração.', historico: hist };
  if (p.fase === 'encerrada') return { fase: p.fase, titulo: 'Fora da vida pública', etapa: p.tFim ? `Desde ${anoDe(p.tFim)}` : undefined, reputacao: rep, apoio, historico: hist };
  const derrotado = p.historico[p.historico.length - 1]?.resultado === 'derrotado';
  const titulo = p.fase === 'entre_mandatos' ? (derrotado ? 'Depois da derrota' : 'Entre mandatos') : p.fase === 'filiado' ? `${flex(g, 'Filiado', 'Filiada', 'Filiade')} ao ${p.partido}` : 'Envolvido na vida da cidade'.replace('Envolvido', flex(g, 'Envolvido', 'Envolvida', 'Envolvide'));
  const horizonte = !p.partido ? 'Sem partido, não há candidatura: a filiação precisa de seis meses antes da eleição.' : e ? `Eleição ${e.tipo === 'municipal' ? 'municipal' : 'geral'} em outubro de ${e.ano}: é agora ou na próxima.` : `A próxima eleição ${prox.tipo === 'municipal' ? 'municipal' : 'geral'} é em ${prox.ano}.`;
  return { fase: p.fase, titulo, reputacao: rep, apoio, prioridade: prio, partido: p.partido, horizonte, historico: hist };
}

function horizonteDoMandato(v: Vida): string {
  const p = v.caminhos.politica!;
  const m = p.mandato!;
  const c = CARGOS[m.cargo];
  const ultimo = m.tFim - v.t <= 16;
  if (c.executivo && p.consecutivos >= 2) return ultimo ? 'Último ano: reeleição, só depois de um mandato de intervalo. Outro cargo, ou a vida fora.' : 'Segundo mandato: não há terceiro seguido.';
  if (ultimo) return 'O mandato termina: reeleição, outro cargo ou voltar para a vida de antes.';
  return m.aprovacao < 42 ? 'A aprovação caiu: sem recuperar, a reeleição fica difícil.' : 'O mandato segue; a próxima eleição vai medir o que foi feito.';
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ========================================================== Elegibilidade */

/** Fim da pena mais recente (Ficha Limpa conta a inelegibilidade até oito anos depois). */
function inelegivelAte(v: Vida): number | undefined {
  const j = v.justica;
  let fim: number | undefined;
  for (const a of j?.antecedentes ?? []) {
    if (a.desfecho !== 'prisao' && a.desfecho !== 'alternativa') continue;
    const f = a.t + Math.round((a.anos ?? 1) * 12);
    fim = Math.max(fim ?? 0, f + 96);
  }
  const pol = v.caminhos.politica?.inelegivelAte;
  if (pol) fim = Math.max(fim ?? 0, pol);
  return fim;
}

/** Pode registrar candidatura a este cargo na eleição de `tEleicao`? Nada institucionalmente impossível passa. */
export function podeConcorrer(v: Vida, cargo: CargoEletivo, tEleicao: number): Veredito {
  const c = CARGOS[cargo];
  const ano = Math.floor(tEleicao / 12);
  const p = v.caminhos.politica;
  if (tipoDeEleicao(ano) !== c.tipo) return bloqueio('impossivel', c.tipo === 'municipal' ? 'Esse cargo é da eleição municipal.' : 'Esse cargo é da eleição geral.');
  const quando = cargo === 'vereador' ? ano * 12 + 7 : tDaPosse(ano);
  if (idadeEm(v.eu.tNasc, quando) < c.idade) return bloqueio('ilegal', `A Constituição exige ${c.idade} anos para ${nomeCargo(v, cargo)} (${cargo === 'vereador' ? 'no registro' : 'na posse'}).`);
  if (v.justica?.prisao) return bloqueio('ilegal', 'Preso não se candidata.');
  const inel = inelegivelAte(v);
  if (inel && inel > tEleicao) return bloqueio('ilegal', `Inelegível até ${anoDe(inel)} (Lei da Ficha Limpa).`);
  const m = v.caminhos.militar;
  if (m && v.trabalho.atual?.contrato === 'militar' && m.quadro === 'temporario' && v.t - m.tIngresso < 12) return bloqueio('ilegal', 'Durante o serviço militar obrigatório, conscrito não se candidata.');
  if (!p?.partido || p.tFiliacao === undefined) return bloqueio('requisito', 'Sem filiação a um partido, não há candidatura no Brasil.');
  if (tEleicao - p.tFiliacao < 6) return bloqueio('requisito', 'A filiação precisa ter pelo menos seis meses antes da eleição.');
  const chegou = v.fatos['chegou_cidade'];
  if (chegou !== undefined && tEleicao - chegou < 6 && (c.escopo === 'municipio' || v.fatos['chegou_uf'] === chegou)) return bloqueio('requisito', 'O domicílio eleitoral precisa ter pelo menos seis meses na circunscrição.');
  const mand = p.mandato;
  if (mand && p.fase === 'mandato') {
    if (mand.cargo === cargo && c.executivo && p.consecutivos >= 2) return bloqueio('ilegal', 'Para prefeito e governador, só uma reeleição seguida.');
    if (mand.tFim > tDaPosse(ano) && mand.cargo === cargo) return bloqueio('impossivel', 'O mandato atual ainda não termina nessa eleição.');
    if (CARGOS[mand.cargo].executivo && mand.cargo !== cargo) return { grau: 'irregular', motivo: `Para disputar outro cargo, é preciso renunciar ao mandato de ${nomeCargo(v, mand.cargo)} seis meses antes.` };
  }
  if (cargo === 'prefeito' && p.apoio < (v.fatos['pol_partido_porte'] === 2 ? 10 : 18)) return { grau: 'improvavel', chance: 0.1, motivo: 'Para prefeito, sem base nenhuma, o partido nem lança o nome.' };
  if ((cargo === 'governador' || cargo === 'senador') && p.reputacao < 40) return { grau: 'improvavel', chance: 0.05, motivo: 'Para um cargo do estado inteiro, é preciso ser conhecido no estado inteiro.' };
  return PERMITIDO;
}

/** Os cargos da próxima eleição na janela, com o veredito de cada um. */
export function cargosDaEleicao(v: Vida): { cargo: CargoEletivo; veredito: Veredito }[] {
  const e = eleicaoNaJanela(v);
  if (!e) return [];
  return ORDEM_CARGOS.filter(c => CARGOS[c].tipo === e.tipo).map(cargo => ({ cargo, veredito: podeConcorrer(v, cargo, e.t) }));
}

/* ==================================================================== Portas */

export const ORIGENS: VidaPolitica['origem'][] = ['comunidade', 'estudantil', 'sindicato', 'causa', 'notoriedade', 'empresario', 'servidor', 'convite', 'decisao'];

/** De onde a política poderia chegar nesta vida (peso de cada porta). */
export function portasDaPolitica(v: Vida): { origem: VidaPolitica['origem']; peso: number }[] {
  const i = idade(v);
  const out: { origem: VidaPolitica['origem']; peso: number }[] = [];
  const rot = (id: string) => v.rotinas.some(r => r.id === id);
  if (i >= 18 && (rot('voluntariado') || rot('igreja') || habilidade(v, 'comunidade') >= 35)) out.push({ origem: 'comunidade', peso: 3 });
  if (i >= 16 && i <= 26 && (rot('gremio') || temFato(v, 'gremio_eleito')) && habilidade(v, 'lideranca') >= 35) out.push({ origem: 'estudantil', peso: 2 });
  const e = v.trabalho.atual;
  if (e && (e.contrato === 'clt' || e.contrato === 'servidor') && (v.trabalho.experiencia[ocupacao(e.ocupacaoId).trilha] ?? 0) >= 96 && v.personalidade.tracos.sociabilidade > 10) out.push({ origem: 'sindicato', peso: 1.5 });
  if (i >= 20 && v.luto.some(l => l.peso >= 60 && v.t - l.t <= 36)) out.push({ origem: 'causa', peso: 1.5 });
  const fama = (v.caminhos.arte?.ativo && v.caminhos.arte.publico >= 55) || temFato(v, 'atleta_profissional') || (e && (v.trabalho.experiencia[ocupacao(e.ocupacaoId).trilha] ?? 0) >= 180 && ['saude', 'educacao', 'seguranca', 'comunicacao'].includes(ocupacao(e.ocupacaoId).setor));
  if (i >= 25 && fama) out.push({ origem: 'notoriedade', peso: 2 });
  const n = v.caminhos.negocio;
  if (n && n.estado === 'firme' && (n.reputacao ?? 0) >= 60) out.push({ origem: 'empresario', peso: 2 });
  if (e && (e.contrato === 'servidor' || e.contrato === 'militar') && (v.t - e.tInicio) / 12 >= 10) out.push({ origem: 'servidor', peso: 1 });
  return out;
}

/** Reputação e apoio com que cada porta começa. */
const COMECO: Record<VidaPolitica['origem'], { reputacao: number; apoio: number }> = {
  comunidade: { reputacao: 12, apoio: 16 }, estudantil: { reputacao: 8, apoio: 10 }, sindicato: { reputacao: 14, apoio: 18 }, causa: { reputacao: 14, apoio: 10 },
  notoriedade: { reputacao: 38, apoio: 8 }, empresario: { reputacao: 24, apoio: 10 }, servidor: { reputacao: 14, apoio: 12 }, convite: { reputacao: 10, apoio: 8 }, decisao: { reputacao: 5, apoio: 4 }
};

export function entrarNaPolitica(v: Vida, origem: VidaPolitica['origem'], forca = 1): VidaPolitica {
  const c = COMECO[origem];
  const antiga = v.caminhos.politica;
  // Quem já passou pela política volta com o nome que tinha.
  const p: VidaPolitica = {
    fase: antiga?.partido ? 'filiado' : 'envolvido', tInicio: v.t, origem,
    partido: antiga?.partido, tFiliacao: antiga?.tFiliacao,
    reputacao: Math.round(Math.max(antiga?.reputacao ?? 0, c.reputacao * forca)), apoio: Math.round(Math.max((antiga?.apoio ?? 0) * 0.6, c.apoio * forca)),
    desgaste: Math.round((antiga?.desgaste ?? 0) * 0.5), consecutivos: 0, historico: antiga?.historico ?? []
  };
  v.caminhos.politica = p;
  marcar(v, 'politica', antiga ? `Voltou à vida política, aos ${idade(v)}.` : `Entrou na vida política, aos ${idade(v)}.`, 2);
  return p;
}

/* ============================================================== Campanha */

/** Quanto custa uma campanha que se paga do bolso, por cargo (reais de hoje). */
export function custoDeCampanha(v: Vida, cargo: CargoEletivo): number {
  const base = { vereador: 8000, prefeito: 45000, deputado_estadual: 60000, deputado_federal: 110000, senador: 180000, governador: 220000 }[cargo];
  const porte = municipio(v.moradia.municipioId).perfil;
  const f = cargo === 'vereador' || cargo === 'prefeito' ? (porte === 'metropole' ? 2.2 : porte === 'capital' ? 1.6 : porte === 'metropolitana' ? 1.2 : 0.7) : 1;
  return Math.round(base * f / 1000) * 1000;
}

/** Registrar a candidatura: a vida entra em campanha (e o trabalho sente). */
export function registrarCandidatura(v: Vida, cargo: CargoEletivo, tEleicao: number): void {
  const p = v.caminhos.politica!;
  const e = v.trabalho.atual;
  // Quem governa e disputa outro cargo renuncia seis meses antes.
  if (p.fase === 'mandato' && p.mandato && CARGOS[p.mandato.cargo].executivo && p.mandato.cargo !== cargo) renunciar(v, 'para disputar outro cargo');
  // Farda: menos de dez anos, deixa a ativa; mais, fica agregado.
  if (e?.contrato === 'militar' && v.caminhos.militar && (v.t - v.caminhos.militar.tIngresso) / 12 < 10) {
    const ind = sairDasForcas(v);
    if (ind) pagar(v, Math.min(ind, disponivel(v)));
    escrever(v, { texto: 'Para se candidatar, deixou a farda: com menos de dez anos de serviço, a lei manda sair da ativa.', relevancia: 'marco', tema: 'trabalho' });
  } else if (e?.contrato === 'militar') v.fatos['pol_agregado'] = v.t;
  else if (e?.contrato === 'servidor') escrever(v, { texto: 'Afastou-se do cargo público três meses antes da eleição, como a lei pede.', relevancia: 'cotidiano', tema: 'trabalho' });
  else if (e && e.clientela !== undefined && e.contrato !== 'eletivo') e.clientela = clamp(e.clientela - 8);
  p.fase = p.fase === 'mandato' ? 'mandato' : 'candidato';
  p.campanha = { cargo, tEleicao, gasto: 0, nota: 0, etapa: 1 };
  escrever(v, { texto: `Registrou candidatura a ${nomeCargo(v, cargo)} pelo ${p.partido}, para a eleição de ${anoDe(tEleicao)}.`, relevancia: p.historico.length ? 'biografia' : 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'candidatura', `${cap(flex(ge(v), 'candidato', 'candidata', 'candidate'))} a ${nomeCargo(v, cargo)}, aos ${idade(v)}.`, 2);
}

/** A força de uma candidatura (o que a vida construiu + o que a campanha fez). */
export function forcaDaCandidatura(v: Vida, cargo: CargoEletivo): number {
  const p = v.caminhos.politica!;
  const c = p.campanha;
  // A trajetória pesa mais que a campanha: base, nome (no alcance do cargo) e o que o mandato mostrou.
  const nome = CARGOS[cargo].escopo === 'municipio' ? Math.min(p.reputacao, 60) : p.reputacao;
  let f = p.apoio * 0.45 + nome * 0.22 + (c?.nota ?? 0) * 0.5 - p.desgaste * 0.2;
  if (p.mandato?.cargo === cargo) f += (p.mandato.aprovacao - 50) * 0.4 - Math.max(0, p.consecutivos - 1) * 3;
  if (p.historico.some(h => h.resultado === 'derrotado')) f += 3;
  // O tamanho do partido: o grande tem estrutura; o pequeno, pouca.
  f += [3, 1, -2][v.fatos['pol_partido_porte'] ?? 1] ?? 0;
  if (CARGOS[cargo].executivo && p.mandato?.cargo === cargo && v.economia?.fase === 'crise') f -= 8;
  return f;
}

/** O quanto um cargo é disputado, na cidade e no estado de quem concorre. */
export function dificuldade(v: Vida, cargo: CargoEletivo): number {
  const porte = municipio(v.moradia.municipioId).perfil;
  const tam = porte === 'metropole' ? 2 : porte === 'capital' ? 1.4 : porte === 'metropolitana' ? 1 : 0;
  // Muito mais candidatos do que vagas: a maioria perde (vereador em cidade pequena é o degrau mais alcançável).
  return { vereador: 40 + tam * 8, prefeito: 54 + tam * 10, deputado_estadual: 50, deputado_federal: 58, senador: 74, governador: 72 }[cargo];
}

/** Um número do ano e do partido (a força do partido naquela eleição): o mundo, não o jogador. */
function sorteDoPartido(v: Vida, ano: number): number {
  let h = ano * 131;
  for (const ch of (v.caminhos.politica?.partido ?? '') + v.moradia.municipioId) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return (h % 1000) / 1000 * 12 - 6;
}

export function chanceDeVitoria(v: Vida, cargo: CargoEletivo, tEleicao: number): number {
  const x = forcaDaCandidatura(v, cargo) + sorteDoPartido(v, Math.floor(tEleicao / 12)) - dificuldade(v, cargo);
  return 1 / (1 + Math.exp(-x / 5));
}

/** A apuração. */
function apurar(v: Vida, r: Rng): void {
  const p = v.caminhos.politica!;
  const c = p.campanha!;
  const cargo = c.cargo;
  const ganhou = r.chance(chanceDeVitoria(v, cargo, c.tEleicao));
  const nome = nomeCargo(v, cargo);
  const par = parceiro(v);
  p.historico.push({ t: c.tEleicao, cargo, resultado: ganhou ? 'eleito' : 'derrotado' });
  p.campanha = undefined;
  // A campanha deixa gente conhecida — e conhecida de você.
  p.reputacao = clamp(p.reputacao + (ganhou ? 3 : 1));
  if (ganhou) {
    const mesmo = p.mandato?.cargo === cargo;
    p.posse = { cargo, t: tDaPosse(Math.floor(c.tEleicao / 12)) };
    if (!mesmo) p.fase = 'eleito';
    const texto = mesmo ? `${cap(flex(ge(v), 'Reeleito', 'Reeleita', 'Reeleite'))} ${nome}, em ${anoDe(c.tEleicao)}.` : `${cap(flex(ge(v), 'Eleito', 'Eleita', 'Eleite'))} ${nome} em ${anoDe(c.tEleicao)}, pelo ${p.partido}.`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'eleicao', texto, 3);
    abalar(v, 'a vitória na eleição', 12, 2);
    if (par) lembrarCom(v, par.p.id, `A noite da apuração: ${nome}.`, 'apoio', 3);
  } else {
    // Perder a reeleição encerra o mandato; perder disputando outro cargo, não.
    const acaba = !!p.mandato && (p.mandato.cargo === cargo || p.mandato.tFim <= tDaPosse(Math.floor(c.tEleicao / 12)));
    const texto = `Não se elegeu ${nome} em ${anoDe(c.tEleicao)}.${acaba ? ' O mandato acaba no fim do ano.' : p.mandato ? ` Segue no mandato de ${nomeCargo(v, p.mandato.cargo)}.` : ''}`;
    escrever(v, { texto, relevancia: p.historico.filter(h => h.resultado === 'derrotado').length <= 1 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'ruim' });
    marcar(v, 'derrota', texto, 3);
    abalar(v, 'a derrota na eleição', -10, 5);
    if (!p.mandato) { p.fase = 'entre_mandatos'; voltarAoTrabalho(v, 'depois da derrota'); }
    if (par) par.vin.tensao = clamp(par.vin.tensao + 4);
  }
}

/* ================================================================ Mandato */

const ORGAO: Record<CargoEletivo, (v: Vida) => string> = {
  vereador: v => `a Câmara Municipal de ${municipio(v.moradia.municipioId).nome}`,
  prefeito: v => `a Prefeitura de ${municipio(v.moradia.municipioId).nome}`,
  deputado_estadual: v => `a Assembleia Legislativa (${municipio(v.moradia.municipioId).uf})`,
  deputado_federal: () => 'a Câmara dos Deputados, em Brasília',
  senador: () => 'o Senado Federal, em Brasília',
  governador: v => `o Governo do Estado (${municipio(v.moradia.municipioId).uf})`
};

function subsidio(v: Vida, cargo: CargoEletivo): number {
  const porte = municipio(v.moradia.municipioId).perfil;
  const t = porte === 'metropole' ? 3 : porte === 'capital' ? 2 : porte === 'metropolitana' ? 1 : 0;
  if (cargo === 'vereador') return [6000, 11000, 15000, 20000][t];
  if (cargo === 'prefeito') return [16000, 22000, 28000, 35000][t];
  return ocupacao(cargo).salario;
}

function tomarPosse(v: Vida, r: Rng): void {
  const p = v.caminhos.politica!;
  const { cargo, t: tPosse } = p.posse!;
  p.posse = undefined;
  const reeleicao = p.mandato?.cargo === cargo;
  const e = v.trabalho.atual;
  // O trabalho de antes fica guardado (o servidor tem o cargo garantido; o resto, não).
  if (e && e.contrato !== 'eletivo') {
    const n = v.caminhos.negocio;
    const dono = !!n && n.estado !== 'fechado' && n.ocupacaoId === e.ocupacaoId;
    p.anterior = { emprego: { ...e }, garantido: e.contrato === 'servidor', negocio: dono || undefined };
    if (dono) { n!.passivo = true; escrever(v, { texto: `${n!.nome} ficou nas mãos ${(n!.equipe?.length ?? 0) > 0 || n!.socioId ? 'da equipe' : 'de um gerente contratado'}: mandato e balcão não cabem no mesmo dia.`, relevancia: 'biografia', tema: 'trabalho' }); }
    if (e.contrato === 'militar' && v.caminhos.militar) { irParaReserva(v, 'pedido'); p.anterior = undefined; }
    else encerrarEmprego(v, 'posse no mandato');
  } else if (e?.contrato === 'eletivo') {
    // Eleito para outro cargo: o mandato de antes fica para trás.
    if (p.mandato && p.mandato.cargo !== cargo) { p.historico.push({ t: v.t, cargo: p.mandato.cargo, resultado: 'concluiu' }); escrever(v, { texto: `Deixou o mandato de ${nomeCargo(v, p.mandato.cargo)} para assumir o novo cargo.`, relevancia: 'biografia', tema: 'trabalho' }); }
    encerrarEmprego(v, 'fim do mandato');
  }
  const c = CARGOS[cargo];
  // Governar o estado é morar na capital.
  if (cargo === 'governador') { const cap = MUNICIPIOS.find(m => m.uf === municipio(v.moradia.municipioId).uf && m.capital); if (cap && cap.id !== v.moradia.municipioId) mudarAgora(v, cap.id, 'para governar o estado'); }
  const inicio = tPosse;
  const emprego: Emprego = { ocupacaoId: cargo, empregador: ORGAO[cargo](v), contrato: 'eletivo', salario: subsidio(v, cargo), tInicio: inicio, tPosto: inicio, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral', via: 'eleicao' };
  v.trabalho.atual = emprego;
  v.trabalho.desempregadoDesde = undefined;
  const fim = tPosse + c.anos * 12;
  p.consecutivos = reeleicao ? p.consecutivos + 1 : 1;
  p.mandato = { cargo, tInicio: inicio, tFim: fim, aprovacao: reeleicao ? Math.round((p.mandato!.aprovacao + 50) / 2) : 55, feito: 0 };
  p.fase = 'mandato';
  if (!reeleicao) {
    // O gabinete: gente de confiança (nunca parente: nepotismo é proibido — Súmula Vinculante 13 do STF).
    const assessor = criarPessoa(v, r, { idade: r.int(26, 50), municipioId: v.moradia.municipioId });
    assessor.ocupacao = assessor.genero === 'feminino' ? 'chefe de gabinete' : 'chefe de gabinete';
    assessor.renda = Math.round(emprego.salario * 0.45);
    const vin = vincular(v, assessor, { origem: 'trabalho', proximidade: 25, convivio: ['trabalho'], estagio: 'colega' });
    vin.ambiente = `trabalho:${emprego.empregador}:${emprego.tInicio}`;
    escrever(v, { texto: `Tomou posse como ${nomeCargo(v, cargo)}. ${assessor.nome} assumiu a chefia de gabinete.`, relevancia: 'marco', tema: 'trabalho', tom: 'bom', pessoas: [assessor.id] });
    marcar(v, 'politica', `Posse: ${nomeCargo(v, cargo)}.`, 3, { ocupacaoId: cargo });
  } else escrever(v, { texto: `Começou o segundo mandato como ${nomeCargo(v, cargo)}.`, relevancia: 'biografia', tema: 'trabalho' });
}

/** O mandato acaba (sem reeleição): de volta para a vida de antes — ou para outra. */
function concluirMandato(v: Vida): void {
  const p = v.caminhos.politica!;
  const m = p.mandato!;
  p.historico.push({ t: v.t, cargo: m.cargo, resultado: 'concluiu' });
  p.mandato = undefined;
  p.consecutivos = CARGOS[m.cargo].executivo ? 0 : p.consecutivos;
  if (v.trabalho.atual?.contrato === 'eletivo') encerrarEmprego(v, 'fim do mandato');
  const encerra = v.fatos['pol_nao_concorre'] !== undefined;
  p.fase = encerra ? 'encerrada' : 'entre_mandatos';
  if (encerra) { p.tFim = v.t; marcar(v, 'fim_politica', `Encerrou a vida pública depois do mandato de ${nomeCargo(v, m.cargo)}.`, 3); delete v.fatos['pol_nao_concorre']; }
  escrever(v, { texto: `Terminou o mandato de ${nomeCargo(v, m.cargo)}.${encerra ? ' E, com ele, a vida pública.' : ''}`, relevancia: 'marco', tema: 'trabalho' });
  voltarAoTrabalho(v, 'depois do mandato');
}

export function renunciar(v: Vida, motivo: string): void {
  const p = v.caminhos.politica!;
  const m = p.mandato;
  if (!m) return;
  p.historico.push({ t: v.t, cargo: m.cargo, resultado: 'renunciou' });
  p.mandato = undefined;
  p.consecutivos = 0;
  p.desgaste = clamp(p.desgaste + 10);
  if (v.trabalho.atual?.contrato === 'eletivo') encerrarEmprego(v, 'renúncia ao mandato');
  const texto = `Renunciou ao mandato de ${nomeCargo(v, m.cargo)} ${motivo}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'politica', texto, 3);
  p.fase = 'entre_mandatos';
}

/** Voltar ao trabalho de antes: o servidor retoma o cargo; o dono, o negócio; os outros, o que der. */
export function voltarAoTrabalho(v: Vida, quando: string): void {
  const p = v.caminhos.politica!;
  const a = p.anterior;
  p.anterior = undefined;
  if (!a || v.trabalho.atual) return;
  const oc = ocupacao(a.emprego.ocupacaoId);
  const nome = nomeOcupacao(v, oc);
  const n = v.caminhos.negocio;
  if (a.negocio && n && n.estado !== 'fechado' && n.passivo) {
    n.passivo = undefined;
    v.trabalho.atual = { ...a.emprego, clientela: n.clientela, tInicio: n.tInicio, municipioId: v.moradia.municipioId };
    escrever(v, { texto: `Voltou para trás do balcão de ${n.nome}, ${quando}.`, relevancia: 'biografia', tema: 'trabalho' });
    return;
  }
  if (a.garantido) {
    v.trabalho.atual = { ...a.emprego, municipioId: v.moradia.municipioId };
    escrever(v, { texto: `Voltou ao cargo público de ${nome}, ${quando}: o posto estava guardado.`, relevancia: 'biografia', tema: 'trabalho' });
    return;
  }
  if (a.emprego.clientela !== undefined || a.emprego.contrato === 'informal' || a.emprego.contrato === 'autonomo') {
    v.trabalho.atual = { ...a.emprego, clientela: a.emprego.clientela !== undefined ? Math.round(a.emprego.clientela * 0.6) : undefined, tInicio: v.t, tPosto: v.t, municipioId: v.moradia.municipioId };
    escrever(v, { texto: `Voltou a trabalhar como ${nome}, ${quando}. Parte da freguesia tinha ido embora.`, relevancia: 'biografia', tema: 'trabalho' });
    return;
  }
  // Com carteira: a empresa às vezes aceita de volta; o nome ajuda e atrapalha.
  if (hashChance(v, 'volta') < 0.45) {
    v.trabalho.atual = { ...a.emprego, tInicio: v.t, tPosto: v.t, municipioId: v.moradia.municipioId, desempenho: 55 };
    escrever(v, { texto: `A empresa aceitou você de volta como ${nome}, ${quando}.`, relevancia: 'biografia', tema: 'trabalho' });
  } else {
    v.trabalho.desempregadoDesde = v.t;
    escrever(v, { texto: `Procurou o antigo emprego de ${nome}, ${quando}; a vaga já era de outra pessoa.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
}

function hashChance(v: Vida, s: string): number {
  let h = anoDe(v.t) * 7;
  for (const ch of v.id + s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 1000) / 1000;
}

/* ================================================================== O ano */

export function processarPolitica(v: Vida, r: Rng): void {
  const i = idade(v);
  const p = v.caminhos.politica;
  if (!p || p.fase === 'encerrada') {
    // A porta: rara, e vinda da vida.
    const portas = portasDaPolitica(v);
    const ultima = v.caminhos.ultimas['politica'];
    if (portas.length && i >= 16 && i <= 75 && !v.justica?.prisao && (ultima === undefined || v.t - ultima >= 72) && !v.momento) {
      const soma = portas.reduce((s, x) => s + x.peso, 0);
      if (r.chance(Math.min(0.22, 0.02 + soma * 0.035))) {
        const o = r.weighted(portas, x => x.peso)!;
        v.caminhos.ultimas['politica'] = v.t;
        v.fatos['pol_porta'] = v.t;
        v.fatos['pol_origem'] = ORIGENS.indexOf(o.origem);
      }
    }
    if (p?.fase === 'encerrada') p.reputacao = clamp(p.reputacao - 2);
    return;
  }
  // Apuração, posse, fim de mandato — nessa ordem (o aniversário pode atravessar outubro e janeiro).
  if (p.campanha && v.t >= p.campanha.tEleicao) apurar(v, r);
  if (p.posse && v.t >= p.posse.t) tomarPosse(v, r);
  if (p.mandato && !p.posse && v.t >= p.mandato.tFim) concluirMandato(v);
  if ((p.fase as string) === 'encerrada') return;
  processarRiscoPolitico(v, r);
  if ((p.fase as string) === 'encerrada') return;

  const socia = v.personalidade.tracos.sociabilidade / 40 + habilidade(v, 'lideranca') / 40 + habilidade(v, 'comunidade') / 50;
  if (p.fase === 'mandato' && p.mandato) {
    const m = p.mandato;
    const c = CARGOS[m.cargo];
    // A aprovação: o que se fez, a economia, o desgaste de quem governa.
    // Aprovação: o que se fez ajuda, mas a rua esquece depressa e cobra de quem está há muito tempo.
    const delta = (m.feito > 0 ? 1.5 : -2) + (c.executivo && v.economia?.fase === 'crise' ? -6 : 0) + (c.executivo ? -2 : -0.5) - p.desgaste / 30 + r.normal() * 5 + (50 - m.aprovacao) * 0.2;
    m.aprovacao = Math.round(clamp(m.aprovacao + delta));
    m.feito = Math.max(0, m.feito - 1);
    p.apoio = Math.round(clamp(p.apoio + (m.aprovacao * 0.85 - p.apoio) * 0.25));
    p.reputacao = clamp(p.reputacao + (c.escopo === 'estado' ? 1.5 : 0.5));
    p.desgaste = clamp(p.desgaste + (c.executivo ? 3 : 2.5));
    // O mandato cobra do bolso: contribuição ao partido, a base que se mantém, as viagens, os pedidos de ajuda que chegam à porta.
    const subsidio = v.trabalho.atual?.contrato === 'eletivo' ? v.trabalho.atual.salario : ocupacao(m.cargo).salario;
    const custo = Math.round(subsidio * 12 * (0.18 + (c.escopo === 'municipio' ? 0 : 0.1)) / 100) * 100;
    v.financas.conta -= custo;
    if (!temFato(v, 'pol_custo_mandato')) {
      v.fatos['pol_custo_mandato'] = v.t;
      escrever(v, { texto: `O mandato também tem conta: contribuição ao partido, a base, as viagens, gente pedindo ajuda na porta. Foram ${dinheiro(custo)} no ano.`, relevancia: 'cotidiano', tema: 'trabalho' });
    }
    // Crises: acontecem (o jogador responde).
    if (!m.crise && r.chance(c.executivo ? 0.32 : 0.14)) m.crise = { t: v.t, tipo: r.pick(c.executivo ? ['chuva', 'greve', 'verba', 'obra', 'aliado'] : ['aliado', 'votacao', 'pedido']) };
    // Brasília durante a semana: a casa sente.
    if (ocupacao(m.cargo).jornada === 'fora') {
      const par = parceiro(v);
      if (par && par.vin.convivio.includes('casa')) par.vin.tensao = clamp(par.vin.tensao + 3);
      for (const f of filhos(v)) if (v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 14) v.vinculos[f.id].presenca = clamp((v.vinculos[f.id].presenca ?? 50) - 3);
    }
  } else if (p.fase !== 'eleito' && p.fase !== 'candidato') {
    // Fora do cargo: o nome cresce com a presença (ou esfria sem ela).
    const ativo = v.anoAtual.acoes.includes('pol_comunidade') || v.rotinas.some(x => x.id === 'voluntariado');
    p.apoio = Math.round(clamp(p.apoio + (ativo ? 1 + socia * 0.5 : -1.5) + (v.fatos['pol_quer'] !== undefined && v.t - v.fatos['pol_quer'] <= 24 ? 1 : 0)));
    p.reputacao = Math.round(clamp(p.reputacao + (ativo ? 0.5 + socia / 4 : -0.5)));
    p.desgaste = clamp(p.desgaste - 3);
  }
  // A janela de uma eleição: a vida pergunta (conteúdo `pol_eleicao`).
  const e = eleicaoNaJanela(v);
  if (e && !p.campanha && !p.posse && p.partido && (p.fase !== 'mandato' || (p.mandato && (p.mandato.tFim <= tDaPosse(e.ano) || CARGOS[p.mandato.cargo].tipo !== e.tipo)))) {
    const quer = v.fatos['pol_quer'] !== undefined || p.fase === 'mandato' || p.apoio >= 25 || p.historico.length > 0;
    if (quer) v.fatos['pol_eleicao'] = v.t;
  }
  // Conflito de interesses: dono de negócio com mandato (abstrato).
  if (p.fase === 'mandato' && v.caminhos.negocio?.passivo && !temFato(v, `pol_conflito_${p.mandato?.tInicio}`) && r.chance(0.25)) { v.fatos[`pol_conflito_${p.mandato?.tInicio}`] = v.t; v.fatos['pol_conflito'] = v.t; }
}

/** Sair da vida pública (a reputação fica; a vida segue). */
export function encerrarVidaPolitica(v: Vida, motivo: string): void {
  const p = v.caminhos.politica;
  if (!p) return;
  if (p.mandato) renunciar(v, motivo);
  p.fase = 'encerrada';
  p.tFim = v.t;
  p.campanha = undefined;
  delete v.fatos['pol_quer'];
  const texto = `Deixou a vida política, aos ${idade(v)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'fim_politica', texto, 3);
  voltarAoTrabalho(v, 'ao deixar a política');
}

/** O que foi feito "por fora da regra" às vezes chega: investigação, cassação, Ficha Limpa. */
function processarRiscoPolitico(v: Vida, r: Rng): void {
  const p = v.caminhos.politica!;
  const t0 = v.fatos['pol_risco'];
  if (t0 === undefined) return;
  if (v.t - t0 > 60) { delete v.fatos['pol_risco']; return; }
  if (!r.chance(0.22)) return;
  delete v.fatos['pol_risco'];
  p.desgaste = clamp(p.desgaste + 30);
  p.apoio = clamp(p.apoio - 20);
  p.inelegivelAte = v.t + 96;
  const m = p.mandato;
  if (m) {
    p.historico.push({ t: v.t, cargo: m.cargo, resultado: 'cassado' });
    p.mandato = undefined;
    p.consecutivos = 0;
    if (v.trabalho.atual?.contrato === 'eletivo') encerrarEmprego(v, 'mandato cassado');
    p.fase = 'entre_mandatos';
    voltarAoTrabalho(v, 'depois da cassação');
  }
  const texto = m ? `O favor de campanha virou processo: mandato de ${nomeCargo(v, m.cargo)} cassado e oito anos de inelegibilidade.` : 'O favor de campanha virou processo: oito anos de inelegibilidade.';
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'derrota', texto, 3);
  abalar(v, 'a cassação', -14, 14);
  const par = parceiro(v);
  if (par) par.vin.tensao = clamp(par.vin.tensao + 10);
}

/* =========================================================== Na cabeça */

/** A política pesa (e às vezes alimenta): campanha, cargo executivo, rua vaiando, rua aplaudindo. */
export function pesoDaPolitica(v: Vida): { cabeca?: { texto: string; efeito: number }; humor?: { texto: string; efeito: number } } {
  const p = v.caminhos.politica;
  if (!p) return {};
  if (p.fase === 'candidato' || p.campanha) return { cabeca: { texto: 'a campanha', efeito: 10 } };
  if (p.fase === 'mandato' && p.mandato) {
    const m = p.mandato;
    const peso = CARGOS[m.cargo].executivo ? 12 : 6;
    const humor = m.aprovacao >= 65 ? { texto: 'um mandato que a rua aprova', efeito: 4 } : m.aprovacao < 32 ? { texto: 'a rua reclamando do mandato', efeito: -4 } : undefined;
    return { cabeca: { texto: m.crise ? 'uma crise no mandato' : 'o peso do cargo', efeito: peso + (m.crise ? 5 : 0) }, humor };
  }
  if (p.fase === 'entre_mandatos' && p.historico[p.historico.length - 1]?.resultado === 'derrotado' && v.t - p.historico[p.historico.length - 1].t <= 18) return { humor: { texto: 'a derrota ainda recente', efeito: -3 } };
  if (p.fase === 'envolvido' || p.fase === 'filiado') return { humor: { texto: 'fazer alguma coisa pela cidade', efeito: 2 } };
  return {};
}

/** Tempo que a política toma da semana (a campanha é quase um emprego). */
export function semanaDaPolitica(v: Vida): { rotulo: string; peso: number } | undefined {
  const p = v.caminhos.politica;
  if (!p) return undefined;
  if (p.campanha) return { rotulo: 'A campanha', peso: 1.25 };
  if ((p.fase === 'envolvido' || p.fase === 'filiado' || p.fase === 'entre_mandatos') && (v.anoAtual.acoes.includes('pol_comunidade') || v.fatos['pol_quer'] !== undefined)) return { rotulo: 'Reuniões e causas', peso: 0.5 };
  return undefined;
}

/* ================================================================== Ações */

export type OquePolitica = 'aproximar' | 'filiar' | 'comunidade' | 'prioridade' | 'negociar' | 'candidatura' | 'crise' | 'deixar';
export type AcaoPoliticaCmd = { tipo: 'politica'; oque: OquePolitica; valor?: string };

export function disponibilidadePolitica(v: Vida, a: AcaoPoliticaCmd): Veredito {
  const i = idade(v);
  const p = v.caminhos.politica;
  const fase = fasePolitica(v);
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  switch (a.oque) {
    case 'aproximar':
      if (i < 16) return bloqueio('impossivel', 'Ainda é cedo.');
      if (naPolitica(v)) return bloqueio('impossivel', 'Você já está no meio.');
      if (v.anoAtual.acoes.includes('pol_aproximar')) return bloqueio('incompativel', 'Já tentou neste ano.');
      return PERMITIDO;
    case 'filiar':
      if (!p || !naPolitica(v)) return bloqueio('impossivel', 'Primeiro, é preciso estar no meio.');
      if (i < 16) return bloqueio('ilegal', 'Filiação partidária, só a partir dos 16 anos (com título de eleitor).');
      if (p.partido) return bloqueio('impossivel', `Já é filiado ao ${p.partido}.`);
      if (v.trabalho.atual?.contrato === 'militar') return bloqueio('ilegal', 'Militar da ativa não se filia a partido (CF, art. 142, §3º, V).');
      return PERMITIDO;
    case 'comunidade':
      if (!naPolitica(v) || fase === 'eleito') return bloqueio('impossivel', 'Não se aplica.');
      return v.anoAtual.acoes.includes('pol_comunidade') ? bloqueio('incompativel', 'Já rodou os bairros neste ano.') : PERMITIDO;
    case 'prioridade':
      if (!naPolitica(v)) return bloqueio('impossivel', 'Não se aplica.');
      if (a.valor && !PRIORIDADES.includes(a.valor as Prioridade)) return bloqueio('impossivel', 'Prioridade desconhecida.');
      if (emMandato(v) && v.anoAtual.acoes.includes('pol_prioridade')) return bloqueio('incompativel', 'O trabalho do ano já tem prioridade.');
      return PERMITIDO;
    case 'negociar':
      if (!p?.partido || !naPolitica(v)) return bloqueio('requisito', 'Negociar apoio pede partido e alguma base.');
      return v.anoAtual.acoes.includes('pol_negociar') ? bloqueio('incompativel', 'As conversas deste ano já aconteceram.') : PERMITIDO;
    case 'candidatura': {
      if (!p?.partido) return bloqueio('requisito', 'Sem partido, não há candidatura.');
      if (p.campanha || p.posse) return bloqueio('impossivel', 'A candidatura já está registrada.');
      const e = eleicaoNaJanela(v);
      if (e) return cargosDaEleicao(v).some(x => podeTentar(x.veredito)) ? PERMITIDO : bloqueio('requisito', cargosDaEleicao(v)[0]?.veredito.motivo ?? 'Nenhum cargo desta eleição cabe agora.');
      return v.fatos['pol_quer'] !== undefined && v.t - v.fatos['pol_quer'] < 12 ? bloqueio('incompativel', 'A pré-candidatura já está na rua.') : PERMITIDO;
    }
    case 'crise': return p?.mandato?.crise ? PERMITIDO : bloqueio('impossivel', 'Não há crise aberta.');
    case 'deixar': return naPolitica(v) && fase !== 'candidato' ? PERMITIDO : bloqueio('impossivel', fase === 'candidato' ? 'A campanha está na rua: é esperar a apuração.' : 'Não se aplica.');
  }
  return bloqueio('impossivel', 'Não se aplica.');
}

export interface SaidaPolitica { texto?: string; tom?: 'bom' | 'ruim' | 'neutro'; decisao?: string; papeis?: Record<string, string> }

export function executarPolitica(v: Vida, r: Rng, a: AcaoPoliticaCmd): SaidaPolitica {
  const p = v.caminhos.politica;
  switch (a.oque) {
    case 'aproximar': v.anoAtual.acoes.push('pol_aproximar'); return { decisao: 'pol_aproximar' };
    case 'filiar': return { decisao: 'pol_filiacao' };
    case 'comunidade': {
      v.anoAtual.acoes.push('pol_comunidade');
      const soc = v.personalidade.tracos.sociabilidade;
      p!.apoio = clamp(p!.apoio + 2 + Math.max(0, soc) / 40);
      p!.reputacao = clamp(p!.reputacao + 1);
      if (p!.mandato) p!.mandato.aprovacao = clamp(p!.mandato.aprovacao + 2);
      aplicarPersonalidade(v, 'acao:pol_comunidade', { sociabilidade: 1 });
      const par = parceiro(v);
      if (par && par.vin.convivio.includes('casa')) par.vin.tensao = clamp(par.vin.tensao + 1);
      escrever(v, { texto: r.pick(['Passou os sábados do ano rodando bairros: reclamação de buraco, pedido de vaga em creche, café em toda casa.', 'Ouviu gente numa escola de bairro até as dez da noite.', 'Uma feira, uma igreja, um campo de várzea por fim de semana.']), relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: 'Mais gente sabe quem você é — e o que pedem.', tom: 'bom' };
    }
    case 'prioridade': {
      if (a.valor) { p!.prioridade = a.valor as Prioridade; }
      if (p!.mandato) {
        v.anoAtual.acoes.push('pol_prioridade');
        const m = p!.mandato;
        m.feito += 2;
        const deu = r.chance(0.5 + (m.cargo === 'vereador' || m.cargo.startsWith('deputado') || m.cargo === 'senador' ? 0.05 : 0.15));
        m.aprovacao = clamp(m.aprovacao + (deu ? 3 : 0));
        const feito = p!.prioridade ? r.pick(ENTREGAS[p!.prioridade]) : 'uma promessa de campanha';
        const primeira = !temFato(v, `pol_entrega_${m.tInicio}`);
        if (deu) v.fatos[`pol_entrega_${m.tInicio}`] = v.t;
        escrever(v, { texto: deu ? `Saiu do papel: ${feito}. Foi o mandato que empurrou.` : `Um ano inteiro de reunião, ofício e visita a secretaria atrás disto: ${feito}. Ainda não saiu.`, relevancia: deu && primeira ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, tom: deu ? 'bom' : undefined });
        aplicarPersonalidade(v, 'acao:pol_prioridade', { disciplina: 1 });
        return { texto: deu ? 'Algo concreto para mostrar.' : 'O trabalho andou; o resultado, não ainda.', tom: deu ? 'bom' : 'neutro' };
      }
      return { texto: `A sua bandeira: ${NOME_PRIORIDADE[p!.prioridade!]}.` };
    }
    case 'negociar': v.anoAtual.acoes.push('pol_negociar'); return { decisao: 'pol_negociar', papeis: aliado(v) ? { aliado: aliado(v)!.id } : {} };
    case 'candidatura': {
      if (eleicaoNaJanela(v)) { v.fatos['pol_eleicao'] = v.t; return { decisao: 'pol_eleicao' }; }
      v.fatos['pol_quer'] = v.t;
      escrever(v, { texto: 'Avisou no partido que vai querer disputar a próxima eleição.', relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `Pré-candidatura na rua. A eleição de ${proximaEleicao(v.t).ano} é o horizonte.` };
    }
    case 'crise': return { decisao: 'pol_crise' };
    case 'deixar': return { decisao: 'pol_deixar' };
  }
  return {};
}

/** Uma liderança do meio político (gente que já existe na vida, ou alguém novo). */
export function aliado(v: Vida): Pessoa | undefined {
  return vinculosVivos(v).find(x => !x.p.especie && x.p.ocupacao === 'liderança política')?.p;
}

export function criarAliado(v: Vida, r: Rng): Pessoa {
  const a = aliado(v);
  if (a) return a;
  const p = criarPessoa(v, r, { idade: r.int(40, 68), municipioId: v.moradia.municipioId });
  p.ocupacao = 'liderança política';
  p.renda = 9000;
  vincular(v, p, { origem: 'apresentado', proximidade: 18, estagio: 'conhecido' });
  return p;
}

/** As ações políticas que fazem sentido agora (para a tela de Trabalho). */
export function acoesPoliticas(v: Vida, disp: (v: Vida, a: Acao) => Veredito): AcaoProfissional[] {
  const out: AcaoProfissional[] = [];
  const p = v.caminhos.politica;
  const A = (oque: OquePolitica, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);
  const add = (x: AcaoProfissional) => { if (x.acao && !podeTentar(disp(v, x.acao))) return; out.push(x); };
  // Fora da política, a porta mora no Rumo (é mudança de caminho, não ação de trabalho).
  if (!p || p.fase === 'encerrada') return out;
  const m = p.mandato;
  const e = eleicaoNaJanela(v);
  if (m?.crise) add({ id: 'pol_crise', rotulo: 'Responder à crise', porque: 'Todo mundo espera uma palavra sua.', acao: A('crise'), peso: 10 });
  if (m) add({ id: 'pol_prioridade', rotulo: p.prioridade ? `Trabalhar a prioridade: ${NOME_PRIORIDADE[p.prioridade]}` : 'Escolher uma prioridade para o mandato', porque: m.feito === 0 ? 'Sem nada para mostrar, a aprovação cai.' : undefined, acao: A('prioridade'), peso: m.feito === 0 ? 8 : 5 });
  add({ id: 'pol_comunidade', rotulo: 'Conversar com a comunidade', porque: m && m.aprovacao < 45 ? 'A rua anda reclamando.' : p.apoio < 30 ? 'A base ainda é pequena.' : undefined, acao: A('comunidade'), peso: m ? (m.aprovacao < 45 ? 7 : 4) : 6 });
  if (!p.partido) add({ id: 'pol_filiar', rotulo: 'Filiar-se a um partido', porque: 'Sem partido, não há candidatura.', acao: A('filiar'), peso: p.apoio >= 20 ? 7 : 4 });
  if (!m && !p.prioridade) add({ id: 'pol_bandeira', rotulo: 'Escolher uma bandeira', porque: 'Gente conhece melhor quem defende uma coisa só.', acao: A('prioridade'), peso: 3 });
  if (p.partido) add({ id: 'pol_negociar', rotulo: 'Negociar apoio', porque: e ? 'A eleição está perto.' : undefined, acao: A('negociar'), peso: e ? 6 : 2 });
  if (p.partido && !p.campanha && !p.posse) add({ id: 'pol_candidatura', rotulo: e ? (m ? 'Decidir sobre a eleição' : 'Registrar candidatura') : 'Lançar a pré-candidatura', porque: e ? `Eleição em outubro de ${e.ano}.` : undefined, acao: A('candidatura'), peso: e ? 9 : 2 });
  add({ id: 'pol_deixar', rotulo: m ? 'Renunciar ou encerrar a vida pública' : 'Deixar a vida política', acao: A('deixar'), peso: 0, saida: true });
  return out;
}

void flex;
