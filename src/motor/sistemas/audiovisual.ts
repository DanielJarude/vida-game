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

import { pessoaCitavel } from './citacoes';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { AgenteArtistico, ContratoAV, ItemCurriculo, Vida } from '../tipos';
import { escrever, idade, lembrarCom, novoId } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { CASAS, crescerPublico, linguagemEmCena, papelPelaTrajetoria, pesoDoCurriculo, prestigioArtistico, registrarNoCurriculo, trabalhaComArte } from './cena';
import { nivelDeOferta } from '../dados/lugares';
import { dinheiro as fmt } from '../texto';
import { anoDe } from '../tempo';
import { criarPessoa, vincular } from '../pessoas';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { encerrarEmprego, registrarPosto } from './trabalho';
import { pausarAtual, podePausar, TRILHAS_ARTISTICAS } from './paralelas';
import { nomePor, somarAoNome } from './notoriedade';
import { continuacaoPossivel, fichaDaProducao, PESO_DO_PREMIO, premioDoTrabalho, textoDoPremio, tituloNovo } from './producoes';

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
  // REWORK 11.5 · ART-01: a estrela existe (nenhum ator ativo chegava a R$ 1 mi num ano): quem tem nome e pega o papel
  // principal de uma produção grande recebe como estrela — raro, porque juntar as duas coisas é raro.
  const estrela = o.porte >= 3 && PAPEL(o.papel) >= 2 && noto >= 48 ? 1 + (noto - 48) / 30 : 1;
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
export function novaProposta(v: Vida, o: { tipo: ItemCurriculo['tipo']; porte: 0 | 1 | 2 | 3; papel: string; casa: string; titulo: string; pessoaId?: string; convite?: boolean; continuacaoDe?: string }): ContratoAV {
  const c = cacheAudiovisual(v, o);
  const id = novoId(v, 'av');
  // REWORK 10.5 · CAR-06: a ficha da produção (gênero, sinopse, a personagem) — fictícia, estável pelo id.
  const ficha = fichaDaProducao(v, o.tipo, o.titulo, id);
  const x: ContratoAV = { id, tipo: o.tipo, titulo: o.titulo, casa: o.casa, papel: o.papel, porte: o.porte, meses: DURACAO[o.tipo] ?? 1, integral: integralDe(o.tipo, o.porte), bruto: c.bruto, comissao: c.comissao, despesas: c.despesas, status: 'proposta', tProposta: v.t, pessoaId: o.pessoaId,
    ...(ficha.genero ? { genero: ficha.genero } : {}), ...(ficha.sinopse ? { sinopse: ficha.sinopse } : {}), ...(ficha.personagem ? { personagem: ficha.personagem } : {}), ...(o.convite ? { convite: true } : {}), ...(o.continuacaoDe ? { continuacaoDe: o.continuacaoDe } : {}) };
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
/** REWORK 10.5 · CAR-06: o que o trabalho pode fazer pela carreira (dito antes de aceitar, sem garantir nada). */
export function impactoDoContrato(c: ContratoAV): string {
  const imp = /protagonista/.test(c.papel) ? 3 : /destaque|participação/.test(c.papel) ? 2 : /coadjuvante/.test(c.papel) ? 1 : 0;
  const x = imp + c.porte;
  return x >= 5 ? 'pode mudar a carreira — se a obra repercutir' : x >= 3 ? 'um trabalho que aparece: nome e currículo' : x >= 2 ? 'mais uma linha forte no currículo' : 'experiência e contatos; pouca visibilidade';
}
export const NOME_DO_TIPO: Partial<Record<ItemCurriculo['tipo'], string>> = { teatro: 'peça de teatro', curta: 'curta-metragem', serie: 'série', novela: 'novela', filme: 'longa-metragem', publicidade: 'comercial' };

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
  // REWORK 11 · ATR-06: duas recepções. A da CRÍTICA (`repercussao`: o ofício, o papel, a produção — é o que os prêmios e o
  // prestígio leem) e a do PÚBLICO (`publico`: o tamanho da produção, o nome de quem está nela, o gênero e o acaso do
  // lançamento — é o que mexe no nome, no público e no que as produções pagam depois). Uma peça elogiada pode ficar
  // vazia; uma novela popular pode apanhar da crítica. Sorteio próprio para o público (a sequência do ano não muda).
  const repercussao: ItemCurriculo['repercussao'] = q >= 0.72 ? 3 : q >= 0.58 ? 2 : q >= 0.42 ? 1 : 0;
  const publico = recepcaoDoPublico(v, c);
  const protagonista = /protagonista/.test(c.papel);
  const primeiroProtagonista = protagonista && !(v.caminhos.curriculo ?? []).some(x => /protagonista/.test(x.papel) && ['serie', 'novela', 'filme', 'curta', 'teatro'].includes(x.tipo));
  // A indicação (fictícia, do universo desta vida): só para o trabalho que repercutiu, e mais para quem carregou a produção.
  // REWORK 10.5 · CAR-09: com o nome da premiação, a categoria (a da obra e do papel), a edição e a obra.
  const premio = premioDoTrabalho(v, c, repercussao, h, r);
  registrarNoCurriculo(v, { tipo: c.tipo, titulo: c.titulo, papel: c.papel, onde: c.casa, repercussao, publico, cache: c.bruto, pessoaId: c.pessoaId, producaoId: c.id, porte: c.porte, ...(c.genero ? { genero: c.genero } : {}), ...(c.personagem ? { personagem: c.personagem } : {}), ...(c.continuacaoDe ? { continuacaoDe: c.continuacaoDe } : {}), ...(premio ? { premio } : {}) });
  if (primeiroProtagonista && Math.max(repercussao, publico) >= 1) {
    const texto = `O primeiro papel de protagonista: "${c.titulo}" (${NOME_TIPO_AV[c.tipo] ?? c.tipo}).`;
    escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, 3, { dominio: 'teatro' });
  }
  if (premio) {
    const texto = premio.venceu ? `Ganhou: ${textoDoPremio(premio)}.` : `Indicação: ${textoDoPremio(premio)}.`;
    escrever(v, { texto, relevancia: premio.venceu ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'conquista', texto, premio.venceu ? 3 : 2, { dominio: 'teatro' });
    // REWORK 10.5 · FAM-03: o prêmio põe o nome na frente do público na medida do alcance dele (o da cidade não é o
    // internacional) — e vale também para quem ainda não tinha nome (antes, só somava a quem já tinha notoriedade).
    if (premio.venceu) somarAoNome(v, 'arte', PESO_DO_PREMIO[premio.alcance ?? 'local']);
  }
  // O público mexe no público (e no nome); a crítica, no prestígio (o currículo e os prêmios).
  crescerPublico(v, [1, 3, 7, 12][publico] * (1 + c.porte * 0.5));
  if (pessoaCitavel(v, c.pessoaId)) lembrarCom(v, c.pessoaId!, `"${c.titulo}", juntos.`, 'trabalho', 1);
  const texto = `Terminou ${descricaoDoContrato(c)}: ${textoDaRecepcao(repercussao, publico)}. ${contaDoContrato(c)}.`;
  const melhor = Math.max(repercussao, publico);
  escrever(v, { texto, relevancia: melhor >= 2 || c.porte >= 2 ? 'marco' : 'biografia', tema: 'trabalho', tom: melhor >= 1 ? 'bom' : undefined });
  if (melhor >= 2) { marcar(v, 'conquista', texto, melhor >= 3 ? 3 : 2, { dominio: 'teatro' }); }
  // O trabalho que o PÚBLICO viu abre o degrau dos testes seguintes (as produções chamam quem dá audiência).
  if (publico >= 2) v.fatos['av_repercutiu'] = v.t;
  if (repercussao >= 2 && publico <= 1) v.fatos['av_cult'] = v.t;
}

/** REWORK 11 · ATR-06: a recepção do público (0..3), do tamanho da produção, do nome e do acaso — independente da crítica. */
export function recepcaoDoPublico(v: Vida, c: Pick<ContratoAV, 'id' | 'tipo' | 'porte' | 'papel'>): 0 | 1 | 2 | 3 {
  const r = rngDe(v.id, 'av_publico', c.id);
  const alcance = ({ novela: 0.16, serie: 0.1, filme: 0.06, publicidade: 0.04, teatro: -0.02, curta: -0.06 } as Partial<Record<string, number>>)[c.tipo] ?? 0;
  const q = 0.22 + c.porte * 0.09 + alcance + nomePor(v, 'arte') / 400 + (/protagonista/.test(c.papel) ? 0.05 : 0) + r.normal() * 0.17;
  return q >= 0.66 ? 3 : q >= 0.5 ? 2 : q >= 0.32 ? 1 : 0;
}

/** As duas recepções em palavras: o que a crítica disse e o que o público fez (as duas podem discordar). */
export function textoDaRecepcao(critica: number, publico: number): string {
  if (critica >= 2 && publico <= 1) return `a crítica ${critica >= 3 ? 'saudou como um dos trabalhos do ano' : 'elogiou'} — e o público não veio: virou um trabalho de culto, de pouca bilheteria`;
  if (publico >= 2 && critica <= 1) return `o público ${publico >= 3 ? 'lotou e não parou de comentar' : 'gostou e foi ver'} — a crítica ${critica === 0 ? 'torceu o nariz' : 'achou correto, sem mais'}`;
  if (critica >= 3 && publico >= 3) return 'foi assunto por semanas: crítica e público juntos, e o seu nome apareceu nas críticas';
  if (critica >= 2 && publico >= 2) return 'repercutiu na crítica e no público; outras produções perguntaram por você';
  if (critica === 1 && publico === 1) return 'teve público e críticas honestas; mais uma linha forte no currículo';
  if (critica === 0 && publico === 0) return 'passou sem muito barulho, de crítica e de público — mas está no currículo';
  return publico >= 1 ? 'teve algum público; a crítica quase não falou' : 'a crítica registrou; o público passou longe';
}

const NOME_TIPO_AV: Partial<Record<ItemCurriculo['tipo'], string>> = { serie: 'série', novela: 'novela', filme: 'filme', curta: 'curta', teatro: 'teatro', publicidade: 'publicidade' };
/** O ano do audiovisual: produções que acabam, propostas que vencem. */
export function processarAudiovisual(v: Vida, r: Rng): void {
  const a = v.caminhos.audiovisual;
  if (!a) { conviteDireto(v); return; }
  for (const c of a.contratos) {
    if (c.status === 'em_producao' && c.tFim !== undefined && v.t >= c.tFim) concluirProducao(v, c, r);
    else if (c.status === 'proposta' && v.t - c.tProposta >= 12) {
      c.status = 'expirou';
      escrever(v, { texto: `A proposta para ${descricaoDoContrato(c)} venceu sem resposta: a produção seguiu com outra pessoa.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' });
    }
  }
  // Uma produção integral pesa na semana e na cabeça enquanto dura.
  if (emProducao(v).some(c => c.integral)) v.mente.estresse = clamp(v.mente.estresse + 4);
  degrauPorPrestigio(v);
  conviteDireto(v);
}

/**
 * REWORK 11 · ATR-07 — o degrau ator → ator conhecido vem do PRESTÍGIO da carreira (o currículo, os prêmios, os anos, o
 * nome), não da freguesia (antes: clientela ≥ 75 por cinco anos; 0 de 30 atores ativos chegavam lá). O degrau não é
 * salário: muda o porte dos testes e dos convites diretos e o modo como as produções tratam a pessoa. Sorteio próprio.
 */
export function degrauPorPrestigio(v: Vida): boolean {
  const e = v.trabalho.atual;
  if (!e || e.ocupacaoId !== 'ator' || v.justica?.prisao) return false;
  if (v.t - e.tInicio < 36) return false;
  const pres = prestigioArtistico(v);
  // O meio reconhece quem tem um trabalho que a crítica ou o público destacou (não só quem acumulou linhas no currículo).
  // REWORK 11.5 · ART-01: o degrau ficou mais raro (25 de 30 atores ativos chegavam a "conhecido" em 20 anos): pede um
  // trabalho que o público ou a crítica destacaram de verdade, mais prestígio, e a chance anual é menor.
  const destaque = (v.caminhos.curriculo ?? []).some(x => x.premio || Math.max(x.repercussao, x.publico ?? 0) >= 4);
  if (pres < 0.7 || !destaque || nomePor(v, 'arte') < 34 || habilidade(v, 'teatro') < 76) return false;
  if (!rngDe(v.id, 'av_degrau', v.t).chance(clamp(0.02 + (pres - 0.7) * 0.35, 0, 0.1))) return false;
  const oc = ocupacaoOuNula('ator_reconhecido');
  if (!oc) return false;
  registrarPosto(v, e);
  e.ocupacaoId = oc.id;
  e.tPosto = v.t;
  const texto = `Passou a ser ${v.eu.genero === 'feminino' ? 'uma atriz conhecida' : 'um ator conhecido'} no meio: as produções chamam pelo nome, e os testes são para papéis maiores.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom' });
  marcar(v, 'promocao', texto, 3, { trilha: 'cena', ocupacaoId: oc.id });
  return true;
}

/**
 * REWORK 10.5 · CAR-14 / FAM-04 — o CONVITE DIRETO: quem tem prestígio e nome é chamado sem teste (antes, toda proposta
 * nascia de um teste do próprio jogador — a atriz premiada fazia fila com quem começava). O porte, o papel e a
 * continuação (a temporada nova da série que repercutiu, a sequência) seguem a trajetória; nada garante sucesso nem
 * cachê maior. Sorteio próprio: a sequência do ano não muda.
 */
function conviteDireto(v: Vida): void {
  const e = v.trabalho.atual;
  if (!e || ocupacaoOuNula(e.ocupacaoId)?.trilha !== 'cena' || v.justica?.prisao) return;
  if (propostasAbertas(v).length || emProducao(v).some(c => c.integral)) return;
  const r = rngDe(v.id, 'convite_av', v.t);
  const pres = prestigioArtistico(v);
  const noto = nomePor(v, 'arte');
  if (!r.chance(clamp(-0.05 + pres * 0.6 + noto / 200, 0, 0.6))) return;
  const cont = continuacaoPossivel(v, ['serie', 'filme', 'teatro'], r);
  if (cont) {
    const p = novaProposta(v, { tipo: cont.de.tipo, porte: (cont.de.porte ?? 2), papel: cont.de.papel, casa: cont.de.onde ?? r.pick(CASAS[cont.de.tipo]), titulo: cont.titulo, convite: true, continuacaoDe: cont.de.producaoId ?? cont.de.titulo });
    escrever(v, { texto: `Chamaram de volta: ${descricaoDoContrato(p)} — a continuação de "${cont.de.titulo}" (${anoDe(cont.de.t)}), com o mesmo papel. ${contaDoContrato(p)}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    return;
  }
  const porte = Math.min(porteMaximoDoTeste(v), pres >= 0.6 ? 3 : pres >= 0.35 ? 2 : 1) as 0 | 1 | 2 | 3;
  const tipos: ItemCurriculo['tipo'][][] = [['teatro', 'curta'], ['teatro', 'curta', 'serie'], ['serie', 'filme', 'teatro'], ['novela', 'filme', 'serie']];
  const tipo = r.pick(tipos[porte]);
  const papel = papelPelaTrajetoria(v, r, habilidade(v, 'teatro'), [52, 60, 68, 74][porte]);
  const p = novaProposta(v, { tipo, porte, papel, casa: r.pick(CASAS[tipo]), titulo: tituloNovo(v, tipo, 'convite'), convite: true });
  escrever(v, { texto: `Um convite direto, sem teste: ${descricaoDoContrato(p)}. ${contaDoContrato(p)}.`, relevancia: porte >= 2 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'bom' });
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
