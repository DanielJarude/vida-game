/**
 * Audiovisual: do teste ao trabalho feito — com contrato, agente e cachê que
 * nasce do que a oportunidade É (FIX 3.1).
 *
 *   teste de elenco (`cena`) → PROPOSTA (produção, papel, duração, bruto,
 *   comissão, despesas, líquido) → aceitar / negociar / recusar → PRODUÇÃO
 *   (os meses do contrato; a integral não cabe com outro trabalho de dia
 *   inteiro — a vida pergunta) → trabalho feito: o líquido entra, a obra vai
 *   para o CURRÍCULO, a repercussão mexe no público e no que vem depois.
 *
 * O AGENTE não é bônus mágico: a rede dele decide a que testes se chega (sem
 * agente, novela e filme grande não chamam) e quanto se negocia; a comissão
 * sai de todo cachê; dá para trocar ou dispensar.
 *
 * CACHÊ — fonte única (`cacheAudiovisual`): tipo da produção × porte × papel ×
 * o nome (currículo e notoriedade) × a casa (orçamento da emissora, da
 * plataforma, da produtora) × o orçamento desta produção × a negociação. O
 * extraordinário (protagonista de novela grande com nome) existe, e é raro
 * porque cada fator alto é raro.
 *
 * Títulos são fictícios; as casas, genéricas. Nada aqui afirma que uma obra
 * existe fora desta vida.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { AgenteArtistico, ContratoAV, ItemCurriculo, Vida } from '../tipos';
import { escrever, idade, lembrarCom, novoId } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { crescerPublico, linguagemEmCena, pesoDoCurriculo, registrarNoCurriculo, trabalhaComArte } from './cena';
import { nivelDeOferta } from '../dados/lugares';
import { dinheiro as fmt } from '../texto';
import { anoDe } from '../tempo';
import { criarPessoa, vincular } from '../pessoas';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { encerrarEmprego } from './trabalho';
import { pausarAtual, podePausar, TRILHAS_ARTISTICAS } from './paralelas';
import { nomePor } from './notoriedade';

/* ------------------------------------------------------------ Estado */

export const audiovisual = (v: Vida) => (v.caminhos.audiovisual ??= { contratos: [] });
export const agenteDe = (v: Vida): AgenteArtistico | undefined => v.caminhos.audiovisual?.agente;
export const propostasAbertas = (v: Vida) => (v.caminhos.audiovisual?.contratos ?? []).filter(c => c.status === 'proposta');
export const emProducao = (v: Vida) => (v.caminhos.audiovisual?.contratos ?? []).filter(c => c.status === 'em_producao');
const LIMITE_CONTRATOS = 30;

/* ------------------------------------------------------------ Cachê */

/** O bruto de referência de cada tipo de produção (a produção inteira, papel coadjuvante, porte médio). */
// (Calibrado na simulação do FIX 3.1: iniciante ganha pouco; quem tem nome, bem mais — e o topo é raro, não a mediana.)
const BASE_TIPO: Partial<Record<ItemCurriculo['tipo'], number>> = { publicidade: 2500, curta: 1200, teatro: 3000, filme: 9000, serie: 11000, novela: 30000 };
const PORTE = [0.55, 1, 1.7, 2.8];
/** O orçamento da casa (a TV aberta paga mais que a produtora independente). */
const CASA: Record<string, number> = {
  'uma emissora de TV aberta': 1.3, 'uma plataforma de streaming': 1.2, 'um canal por assinatura': 0.9, 'uma produtora de cinema': 1,
  'uma produtora independente': 0.65, 'um teatro do centro': 0.9, 'uma sala independente': 0.7, 'o teatro municipal': 1.1, 'uma agência de publicidade': 1
};
const PAPEL = (papel: string) => (/protagonista|destaque/.test(papel) ? 2.4 : /coadjuvante/.test(papel) ? 1 : /apoio|elenco/.test(papel) ? 0.6 : /figura/.test(papel) ? 0.35 : 1);
/** Meses de produção e se ela pede dedicação integral. */
export const DURACAO: Partial<Record<ItemCurriculo['tipo'], number>> = { publicidade: 0, curta: 1, teatro: 3, filme: 3, serie: 5, novela: 8 };
const integralDe = (tipo: ItemCurriculo['tipo'], porte: number) => tipo === 'novela' || ((tipo === 'serie' || tipo === 'filme') && porte >= 2);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export interface CacheAV { bruto: number; comissao: number; despesas: number; liquido: number; fatores: { nome: number; casa: number; orcamento: number; negociacao: number } }

/**
 * O cachê de um trabalho (FONTE ÚNICA): do que a oportunidade é e de quem a
 * pessoa é agora. Bruto → comissão do agente → despesas (deslocamento,
 * figurino próprio, preparação) → líquido.
 */
export function cacheAudiovisual(v: Vida, o: { tipo: ItemCurriculo['tipo']; porte: number; papel: string; casa: string; titulo: string; negociado?: boolean }): CacheAV {
  const noto = nomePor(v, 'arte');
  // O nome: o currículo pesa pouco (todo ator que trabalha tem um); a notoriedade pesa mais — e só no alto.
  const nome = 1 + pesoDoCurriculo(v) * 0.3 + (noto / 100) ** 2 * 1.4;
  const casa = CASA[o.casa] ?? 1;
  // O orçamento desta produção (uma novela das nove não é uma das seis): da própria produção, estável.
  const orcamento = 0.8 + hash(`${o.titulo}:${o.casa}:${o.tipo}`) * 0.45;
  const ag = agenteDe(v);
  const negociacao = (1 + (ag ? ag.rede * 0.06 : 0)) * (o.negociado ? 1.1 : 1);
  // O extraordinário: protagonista de produção grande, com nome de verdade.
  const estrela = o.porte >= 3 && PAPEL(o.papel) >= 2 && noto >= 60 ? 1 + (noto - 60) / 80 : 1;
  const mercado = nivelDeOferta(v.moradia.municipioId) >= 3 ? 1.05 : 0.95;
  const bruto = Math.round((BASE_TIPO[o.tipo] ?? 3000) * PORTE[o.porte] * PAPEL(o.papel) * nome * casa * orcamento * negociacao * estrela * mercado / 100) * 100;
  // Arredondado a dez reais (a cem, o agente de um trabalho pequeno não levava nada).
  const comissao = ag ? Math.round(bruto * ag.comissao / 10) * 10 : 0;
  const longe = integralDe(o.tipo, o.porte) && nivelDeOferta(v.moradia.municipioId) < 3;
  const despesas = Math.round((bruto * 0.05 + (longe ? 900 * (DURACAO[o.tipo] ?? 1) : 0)) / 10) * 10;
  return { bruto, comissao, despesas, liquido: bruto - comissao - despesas, fatores: { nome, casa, orcamento, negociacao } };
}

/* ------------------------------------------------------------ Propostas */

/** O teste deu certo: a produção manda a proposta (não é pagamento na hora — é contrato a aceitar). */
export function novaProposta(v: Vida, o: { tipo: ItemCurriculo['tipo']; porte: 0 | 1 | 2 | 3; papel: string; casa: string; titulo: string; pessoaId?: string }): ContratoAV {
  const c = cacheAudiovisual(v, o);
  const x: ContratoAV = { id: novoId(v, 'av'), tipo: o.tipo, titulo: o.titulo, casa: o.casa, papel: o.papel, porte: o.porte, meses: DURACAO[o.tipo] ?? 1, integral: integralDe(o.tipo, o.porte), bruto: c.bruto, comissao: c.comissao, despesas: c.despesas, status: 'proposta', tProposta: v.t, pessoaId: o.pessoaId };
  const lista = audiovisual(v).contratos;
  lista.push(x);
  if (lista.length > LIMITE_CONTRATOS) lista.splice(0, lista.length - LIMITE_CONTRATOS);
  return x;
}

export const liquidoDe = (c: Pick<ContratoAV, 'bruto' | 'comissao' | 'despesas'>) => c.bruto - c.comissao - c.despesas;
const NOME_TIPO: Partial<Record<ItemCurriculo['tipo'], string>> = { teatro: 'a montagem', curta: 'o curta', serie: 'a série', novela: 'a novela', filme: 'o filme', publicidade: 'o comercial' };
/** "no curta", "na novela" (a preposição contraída com o artigo). */
export const emTipo = (tipo: ItemCurriculo['tipo']) => (NOME_TIPO[tipo] ?? `o ${tipo}`).replace(/^o /, 'no ').replace(/^a /, 'na ');
export const descricaoDoContrato = (c: ContratoAV) => `${c.papel} ${emTipo(c.tipo)} "${c.titulo}", de ${c.casa}`;
export const contaDoContrato = (c: ContratoAV) => `${fmt(c.bruto)} bruto${c.comissao ? ` − ${fmt(c.comissao)} do agente` : ''}${c.despesas ? ` − ${fmt(c.despesas)} de despesas` : ''} = ${fmt(liquidoDe(c))} líquido`;

/** O trabalho principal que uma produção integral atropelaria (de dia inteiro, fora da arte). */
export function conflitoDoContrato(v: Vida, c: ContratoAV): string | undefined {
  const e = v.trabalho.atual;
  if (!c.integral || !e || e.carga !== 'integral') return undefined;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc || TRILHAS_ARTISTICAS.has(oc.trilha)) return undefined;
  return oc.nome[v.eu.genero === 'feminino' ? 1 : 0];
}

export type OqueAV = 'aceitar_contrato' | 'negociar_contrato' | 'recusar_contrato' | 'romper_contrato' | 'buscar_agente' | 'deixar_agente';

export function disponibilidadeAV(v: Vida, oque: OqueAV, id?: string): Veredito {
  const c = id ? (v.caminhos.audiovisual?.contratos ?? []).find(x => x.id === id) : undefined;
  switch (oque) {
    case 'aceitar_contrato': case 'recusar_contrato': case 'negociar_contrato':
      if (!c || c.status !== 'proposta') return bloqueio('incompativel', 'Essa proposta já não está na mesa.');
      if (oque === 'negociar_contrato' && c.negociado) return bloqueio('incompativel', 'Já houve contraproposta: agora é sim ou não.');
      if (oque === 'aceitar_contrato' && emProducao(v).some(x => x.integral) && c.integral) return bloqueio('incompativel', 'Você já está numa produção de dedicação integral até ela acabar.');
      return PERMITIDO;
    case 'romper_contrato':
      return c && c.status === 'em_producao' ? PERMITIDO : bloqueio('incompativel', 'Não há produção em andamento.');
    case 'buscar_agente': {
      if (idade(v) < 16) return bloqueio('requisito', 'Agências representam a partir dos 16 (antes, com os responsáveis, raramente).');
      if (agenteDe(v)) return bloqueio('incompativel', 'Você já tem agente (dá para dispensar e procurar outro).');
      const d = linguagemEmCena(v);
      if (d !== 'teatro' && d !== 'danca') return bloqueio('requisito', 'Agências de atores representam quem atua a sério (teatro, testes, trabalhos).');
      if (pesoDoCurriculo(v) < 0.12 && (v.notoriedade?.valor ?? 0) < 15) return bloqueio('requisito', 'As agências pedem currículo: alguns trabalhos feitos (apresentações, testes, publicidade) vêm antes.');
      const t = v.fatos['av_agente_busca'];
      if (t !== undefined && v.t - t < 12) return bloqueio('incompativel', `A última busca foi em ${anoDe(t)}: as agências reavaliam uma vez por ano.`);
      return PERMITIDO;
    }
    case 'deixar_agente': return agenteDe(v) ? PERMITIDO : bloqueio('incompativel', 'Você não tem agente.');
  }
}

export function executarAV(v: Vida, r: Rng, oque: OqueAV, id?: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro'; decisao?: string } {
  const lista = audiovisual(v).contratos;
  const c = id ? lista.find(x => x.id === id) : undefined;
  switch (oque) {
    case 'aceitar_contrato': {
      // Uma produção integral com um trabalho de dia inteiro: a vida pergunta (pausar, deixar, recusar) — nunca atropela.
      if (conflitoDoContrato(v, c!)) { v.fatos['av_conflito'] = lista.indexOf(c!); return { texto: '', tom: 'neutro', decisao: 'av_conflito' }; }
      return { texto: iniciarProducao(v, c!), tom: 'bom' };
    }
    case 'negociar_contrato': {
      const ag = agenteDe(v);
      // Pedir mais é arriscado: quem tem nome (ou agente de rede) consegue; quem não tem pode perder o papel.
      const chance = clamp(0.35 + pesoDoCurriculo(v) * 0.3 + (ag ? ag.rede * 0.12 : 0) + ((v.notoriedade?.valor ?? 0) / 200), 0.2, 0.9);
      c!.negociado = true;
      if (r.chance(chance)) {
        const novo = cacheAudiovisual(v, { ...c!, negociado: true });
        c!.bruto = novo.bruto; c!.comissao = novo.comissao; c!.despesas = novo.despesas;
        return { texto: `${ag ? `${ag.nome} voltou com` : 'A produção topou'} uma contraproposta: ${contaDoContrato(c!)}.`, tom: 'bom' };
      }
      c!.status = 'recusado';
      escrever(v, { texto: `Pediu mais pelo papel em "${c!.titulo}". A produção não subiu — e chamou a segunda opção do teste.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: 'A produção não subiu a oferta e chamou outra pessoa.', tom: 'ruim' };
    }
    case 'recusar_contrato':
      c!.status = 'recusado';
      escrever(v, { texto: `Recusou ${descricaoDoContrato(c!)}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: 'Você disse não. O papel foi para outra pessoa.', tom: 'neutro' };
    case 'romper_contrato': {
      // Romper custa: multa, a produção não esquece, e o trabalho não entra no currículo.
      const multa = Math.round(c!.bruto * 0.2 / 100) * 100;
      v.financas.conta -= multa;
      c!.status = 'rompido';
      if (v.caminhos.arte) v.caminhos.arte.publico = Math.max(0, v.caminhos.arte.publico - 3);
      escrever(v, { texto: `Rompeu o contrato de ${descricaoDoContrato(c!)} no meio da produção: ${fmt(multa)} de multa, e um nome a menos na lista de quem chama.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: `Contrato rompido: ${fmt(multa)} de multa.`, tom: 'ruim' };
    }
    case 'buscar_agente': return buscarAgente(v, r);
    case 'deixar_agente': {
      const ag = agenteDe(v)!;
      audiovisual(v).agente = undefined;
      escrever(v, { texto: `Deixou de ser representad${v.eu.genero === 'feminino' ? 'a' : 'o'} por ${ag.nome}. Os próximos testes, por conta própria.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return { texto: 'Sem agente: sem comissão, e sem quem abra as portas maiores.', tom: 'neutro' };
    }
  }
}

/** Aceito: a produção começa (e acaba nos meses do contrato). */
export function iniciarProducao(v: Vida, c: ContratoAV): string {
  c.status = 'em_producao';
  c.tInicio = v.t;
  c.tFim = v.t + Math.max(1, c.meses);
  if (c.meses === 0) { concluirProducao(v, c, undefined); return `Gravou ${descricaoDoContrato(c)}: ${contaDoContrato(c)}.`; }
  const texto = `Assinou para ${descricaoDoContrato(c)}: ${c.meses} ${c.meses === 1 ? 'mês' : 'meses'} de produção${c.integral ? ', dedicação integral' : ''}. ${contaDoContrato(c)}, ao fim.`;
  escrever(v, { texto, relevancia: c.porte >= 2 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'bom', escolha: true });
  return texto;
}

/** O trabalho feito: o líquido entra, a obra vai para o currículo, a repercussão mexe no que vem depois. */
export function concluirProducao(v: Vida, c: ContratoAV, r: Rng | undefined): void {
  // Um trabalho termina uma vez só (o cachê e o currículo não se repetem).
  if (c.status === 'concluido') return;
  c.status = 'concluido';
  v.financas.conta += liquidoDe(c);
  const h = habilidade(v, linguagemEmCena(v) ?? 'teatro');
  const sorte = r ? r.normal() * 0.12 : 0;
  const q = h / 100 * 0.5 + c.porte * 0.08 + (/protagonista|destaque/.test(c.papel) ? 0.08 : 0) + sorte;
  const repercussao: ItemCurriculo['repercussao'] = q >= 0.72 ? 3 : q >= 0.58 ? 2 : q >= 0.42 ? 1 : 0;
  const protagonista = /protagonista/.test(c.papel);
  const primeiroProtagonista = protagonista && !(v.caminhos.curriculo ?? []).some(x => /protagonista/.test(x.papel) && ['serie', 'novela', 'filme', 'curta', 'teatro'].includes(x.tipo));
  // A indicação (fictícia, do universo desta vida): só para o trabalho que repercutiu, e mais para quem carregou a produção.
  const premio = indicacaoDoTrabalho(v, c, repercussao, r);
  const item = registrarNoCurriculo(v, { tipo: c.tipo, titulo: c.titulo, papel: c.papel, onde: c.casa, repercussao, cache: c.bruto, pessoaId: c.pessoaId, ...(premio ? { premio } : {}) });
  void item;
  if (primeiroProtagonista && repercussao >= 1) {
    const texto = `O primeiro papel de protagonista: "${c.titulo}" (${NOME_TIPO_AV[c.tipo] ?? c.tipo}).`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 3, { dominio: 'teatro' });
  }
  if (premio) {
    const texto = premio.venceu ? `Ganhou ${premio.nome} por "${c.titulo}".` : `Indicação ${premio.nome.replace(/^o /, 'ao ')} por "${c.titulo}".`;
    escrever(v, { texto, relevancia: premio.venceu ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, premio.venceu ? 3 : 2, { dominio: 'teatro' });
    if (premio.venceu && v.notoriedade) { v.notoriedade.valor = clamp(v.notoriedade.valor + 4); v.notoriedade.pico = Math.max(v.notoriedade.pico, v.notoriedade.valor); }
  }
  crescerPublico(v, [1, 3, 7, 12][repercussao] * (1 + c.porte * 0.5));
  if (c.pessoaId && v.pessoas[c.pessoaId]?.vivo) lembrarCom(v, c.pessoaId, `"${c.titulo}", juntos.`, 'trabalho', 1);
  const efeito = repercussao >= 3 ? 'foi assunto por semanas; o seu nome apareceu nas críticas' : repercussao === 2 ? 'repercutiu; outras produções perguntaram por você' : repercussao === 1 ? 'teve público; mais uma linha forte no currículo' : 'passou sem muito barulho — mas está no currículo';
  const texto = `Terminou ${descricaoDoContrato(c)}: ${efeito}. ${contaDoContrato(c)}.`;
  escrever(v, { texto, relevancia: repercussao >= 2 || c.porte >= 2 ? 'marco' : 'biografia', tema: 'trabalho', tom: repercussao >= 1 ? 'bom' : undefined });
  if (repercussao >= 2) { marcar(v, 'conquista', texto, repercussao >= 3 ? 3 : 2, { dominio: 'teatro' }); v.fatos['av_repercutiu'] = v.t; }
}

const NOME_TIPO_AV: Partial<Record<ItemCurriculo['tipo'], string>> = { serie: 'série', novela: 'novela', filme: 'filme', curta: 'curta', teatro: 'teatro', publicidade: 'publicidade' };
const PREMIO_AV: Partial<Record<ItemCurriculo['tipo'], string>> = { filme: 'o prêmio de interpretação de um festival de cinema', curta: 'o prêmio de interpretação de um festival de curtas', serie: 'o prêmio da crítica de televisão', novela: 'o prêmio da crítica de televisão', teatro: 'o prêmio de teatro da cidade' };

/** A indicação (e, mais raro, o prêmio) que um trabalho pode render: nasce da repercussão, do papel e do porte — e do ano. */
function indicacaoDoTrabalho(v: Vida, c: ContratoAV, repercussao: number, r: Rng | undefined): { nome: string; venceu: boolean } | undefined {
  const nome = PREMIO_AV[c.tipo];
  if (!nome || repercussao < 2 || !r) return undefined;
  const papel = /protagonista/.test(c.papel) ? 1 : /destaque|coadjuv/.test(c.papel) ? 0.6 : 0.25;
  if (!r.chance(clamp((repercussao - 1) * 0.22 * papel + c.porte * 0.03, 0, 0.6))) return undefined;
  const venceu = r.chance(clamp(0.18 + (habilidade(v, linguagemEmCena(v) ?? 'teatro') - 70) / 100 + (repercussao === 3 ? 0.12 : 0), 0.05, 0.5));
  return { nome, venceu };
}

/** O ano do audiovisual: produções que acabam, propostas que vencem. */
export function processarAudiovisual(v: Vida, r: Rng): void {
  const a = v.caminhos.audiovisual;
  if (!a) return;
  for (const c of a.contratos) {
    if (c.status === 'em_producao' && c.tFim !== undefined && v.t >= c.tFim) concluirProducao(v, c, r);
    else if (c.status === 'proposta' && v.t - c.tProposta >= 12) {
      c.status = 'expirou';
      escrever(v, { texto: `A proposta para ${descricaoDoContrato(c)} venceu sem resposta: a produção seguiu com outra pessoa.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    }
  }
  // Uma produção integral pesa na semana e na cabeça enquanto dura.
  if (emProducao(v).some(c => c.integral)) v.mente.estresse = clamp(v.mente.estresse + 4);
}

/** O conflito resolvido pela pessoa: pausar o trabalho, deixá-lo, ou recusar a produção. */
export function resolverConflitoAV(v: Vida, escolha: 'pausar' | 'deixar' | 'recusar'): string {
  const c = audiovisual(v).contratos[v.fatos['av_conflito'] ?? -1];
  delete v.fatos['av_conflito'];
  if (!c || c.status !== 'proposta') return 'A proposta já não estava na mesa.';
  if (escolha === 'recusar') { c.status = 'recusado'; escrever(v, { texto: `Recusou ${descricaoDoContrato(c)} para não largar o trabalho.`, relevancia: 'biografia', tema: 'trabalho', escolha: true }); return 'Você ficou no trabalho. O papel foi para outra pessoa.'; }
  if (escolha === 'pausar') pausarAtual(v, `para fazer ${NOME_TIPO[c.tipo] ?? c.tipo} "${c.titulo}"`);
  else encerrarEmprego(v, `deixou o trabalho para fazer "${c.titulo}"`);
  return iniciarProducao(v, c);
}
export { podePausar };

/* ------------------------------------------------------------ Agente */

/** A rede que a pessoa consegue (o currículo e o nome decidem quem aceita representar). */
export function redeAlcancavel(v: Vida): 1 | 2 | 3 {
  const x = pesoDoCurriculo(v) + nomePor(v, 'arte') / 100;
  return x >= 0.9 ? 3 : x >= 0.45 ? 2 : 1;
}
const COMISSAO = [0, 0.1, 0.15, 0.2];

function buscarAgente(v: Vida, r: Rng): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  v.fatos['av_agente_busca'] = v.t;
  const rede = redeAlcancavel(v);
  const chance = clamp(0.35 + pesoDoCurriculo(v) * 0.6, 0.3, 0.9);
  if (!r.chance(chance)) {
    escrever(v, { texto: 'Mandou material para três agências de atores. Duas não responderam; a terceira pediu para voltar com mais trabalhos no currículo.', relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim', escolha: true });
    return { texto: 'Nenhuma agência aceitou agora: pediram mais trabalhos no currículo.', tom: 'ruim' };
  }
  const p = criarPessoa(v, r, { genero: r.chance(0.55) ? 'feminino' : 'masculino', idade: Math.max(28, idade(v) + r.int(2, 20)), municipioId: v.moradia.municipioId });
  p.ocupacao = p.genero === 'feminino' ? 'agente de atores' : 'agente de atores';
  vincular(v, p, { origem: 'trabalho', estagio: 'colega', proximidade: 30, convivio: [] });
  const nomeAgencia = ['uma agência pequena, de três pessoas', 'uma agência média, com elenco de TV', 'uma das agências grandes do país'][rede - 1];
  const ag: AgenteArtistico = { nome: p.nome, pessoaId: p.id, rede, comissao: COMISSAO[rede], tInicio: v.t };
  audiovisual(v).agente = ag;
  const texto = `${p.nome}, de ${nomeAgencia}, passou a representar você: ${Math.round(ag.comissao * 100)}% de comissão sobre os cachês; ${rede >= 2 ? 'testes de TV e de cinema passam a chegar' : 'mais testes por ano, e alguém para negociar'}.`;
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true, pessoas: [p.id] });
  return { texto, tom: 'bom' };
}

/**
 * O que o agente muda nos testes: sem agente, as produções grandes (novela,
 * filme de estúdio) não chegam — o porte máximo é 2; com rede grande, chegam.
 * E o agente marca mais testes (um a cada seis meses).
 */
export function porteMaximoDoTeste(v: Vida): 0 | 1 | 2 | 3 {
  const ag = agenteDe(v);
  return !ag ? 2 : ag.rede >= 2 ? 3 : 2;
}
export const intervaloDeTestes = (v: Vida) => (agenteDe(v) ? 6 : 12);
export { trabalhaComArte };
