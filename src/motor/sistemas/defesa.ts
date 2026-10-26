/**
 * REWORK 12.25 — A JUSTIÇA COMO ETAPAS, COM ESCOLHAS. O processo já tinha provas, defesa, acordo, fiança, assumir,
 * cooperar, recurso e reabilitação (`tribunal`). Faltava enxergar onde se está e decidir dentro de cada etapa:
 *
 *   ETAPAS       suspeita → investigação → processo → julgamento → sentença → recurso → cumprimento (a tela lê daqui).
 *                Ser investigado não é ser processado; ser processado não é ser condenado; condenado não é preso
 *   ANTES        um advogado já na investigação: ela arquiva mais vezes e, se virar processo, a defesa já está lá
 *   ESTRATÉGIA   negar (o padrão), contestar as provas (o que existe contra você pesa menos — às vezes), mostrar o que
 *                atenua (o trabalho, a família, o tempo: a pena, se vier, menor) — ou deixar com o advogado decidir
 *   AUDIÊNCIA    no ano do julgamento: comparecer, preparar-se com a defesa (um pouco mais de chance), ou faltar — e
 *                faltar abre um MANDADO: a pessoa passa a ser procurada, o processo para até ela aparecer
 *   RECURSO      de qualquer condenação (a prisão, a pena alternativa, a multa), no ano dela
 *   PROCURADO    o mandado (a audiência a que faltou, a pena alternativa abandonada) ou a fuga: a vida de foragido,
 *                jogável — mudar de endereço, aceitar o abrigo de quem tem presença no bairro (com o preço), apresentar-se
 *                com um advogado. Mudar de cidade não apaga mandado; atravessar fronteira, não dá
 *
 * Dinheiro não garante absolvição: a chance tem teto (`tribunal.chanceDeAbsolvicao`). Nada aqui descreve como se escapa de
 * coisa alguma: são escolhas e consequências, em palavras.
 */
import { clamp, rngDe } from '../rng';
import type { Vida } from '../tipos';
import { escrever, idade, pais, parceiro } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';
import { disponivel, vereditoDePagar } from './dinheiro';
import { garantirJustica, prender, registrarProcurado } from './justica';
import { honorarios, perfilDaVida, recorrer } from './tribunal';
import { influenciaAqui, regiaoDaPessoa, nomeDaRegiao } from './faccoes';
import { lembrarOrg } from './submundo';
import { marcar } from './marcas';
import { abalar } from './abalo';
import { proporEncomenda } from './encomendas';
import { pagarJustica, pagarPorFora } from './porFora';

const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 100) * 100;
const g = (v: Vida) => flex(ge(v), 'o', 'a', 'e');

/* ================================================================ as etapas */

export type EtapaDaJustica = 'suspeita' | 'investigacao' | 'processo' | 'julgamento' | 'sentenca' | 'recurso' | 'cumprimento';
export const NOME_DA_ETAPA: Record<EtapaDaJustica, string> = { suspeita: 'Suspeita', investigacao: 'Investigação', processo: 'Processo', julgamento: 'Julgamento', sentenca: 'Sentença', recurso: 'Recurso', cumprimento: 'Cumprimento' };
const ORDEM: EtapaDaJustica[] = ['suspeita', 'investigacao', 'processo', 'julgamento', 'sentenca', 'recurso', 'cumprimento'];

/** Onde a pessoa está na Justiça (ou nada): a etapa de agora e uma frase do que ela significa. */
export function etapaAtual(v: Vida): { etapa: EtapaDaJustica; frase: string } | undefined {
  const j = v.justica;
  const e = v.caminhos.envolvimento;
  if (j?.prisao || j?.alternativa) return { etapa: 'cumprimento', frase: j.prisao ? 'A pena está sendo cumprida.' : 'A pena alternativa ocupa algumas horas da semana; a vida segue em liberdade.' };
  if (j?.recurso) return { etapa: 'recurso', frase: `O recurso foi protocolado; a resposta deve sair em ${anoDe(j.recurso.tFim)}.` };
  if (j?.processo) {
    const p = j.processo;
    if (j.foragido) return { etapa: 'julgamento', frase: 'O processo parou: há um mandado, e ele só anda quando você aparecer.' };
    return p.tJulgamento - v.t <= 12 ? { etapa: 'julgamento', frase: `O julgamento é neste ano (${anoDe(p.tJulgamento)}): a audiência está marcada.` } : { etapa: 'processo', frase: `A acusação foi aceita. O julgamento deve sair em ${anoDe(p.tJulgamento)}.` };
  }
  const ult = j?.antecedentes[j.antecedentes.length - 1];
  if (ult && v.t - ult.t < 12 && ult.desfecho !== 'socioeducativa') return { etapa: 'sentenca', frase: ult.desfecho === 'absolvicao' ? 'A sentença saiu: absolvição.' : ult.desfecho === 'acordo' ? 'O processo terminou num acordo, sem condenação.' : 'A sentença saiu: condenação. Ainda dá para recorrer neste ano.' };
  if (e?.investigado !== undefined) return { etapa: 'investigacao', frase: 'Há uma investigação. Ainda não é processo — pode virar, ou ser arquivada.' };
  if (e && e.parou === undefined && e.exposicao >= 40) return { etapa: 'suspeita', frase: 'Gente demais sabe: ainda não há investigação, mas a suspeita existe.' };
  return undefined;
}

/** A linha do tempo da Justiça para a tela: cada etapa, e se já passou, é a de agora ou ainda não chegou. */
export function linhaDaJustica(v: Vida): { etapa: EtapaDaJustica; nome: string; estado: 'passou' | 'agora' | 'depois' }[] | undefined {
  const a = etapaAtual(v);
  if (!a) return undefined;
  const k = ORDEM.indexOf(a.etapa);
  return ORDEM.filter(x => x !== 'recurso' || a.etapa === 'recurso').map(x => ({ etapa: x, nome: NOME_DA_ETAPA[x], estado: ORDEM.indexOf(x) < k ? 'passou' : x === a.etapa ? 'agora' : 'depois' }));
}

/* ================================================================ as ações */

export type OqueDefesa = 'advogado_cedo' | 'estrategia_contestar' | 'estrategia_atenuantes' | 'estrategia_delegar' | 'audiencia_comparecer' | 'audiencia_preparar' | 'audiencia_faltar'
  | 'recorrer' | 'abandonar_pena' | 'mudar_endereco' | 'abrigo' | 'apresentar_se';

const doProcesso = (v: Vida, t?: number) => !!v.justica?.processo && t !== undefined && t >= v.justica.processo.tInicio;
const custoDaPreparacao = (v: Vida) => preco(v, 2500);
export const custoDaMudanca = (v: Vida) => preco(v, 4000);

/** A condenação deste ano (de que ainda dá para recorrer). */
function condenacaoRecente(v: Vida) {
  const j = v.justica;
  const ult = j?.antecedentes[j.antecedentes.length - 1];
  return ult && v.t - ult.t < 12 && (ult.desfecho === 'prisao' || ult.desfecho === 'alternativa') && ult.reabilitado === undefined ? ult : undefined;
}

export function disponibilidadeDefesa(v: Vida, oque: OqueDefesa): Veredito {
  const j = v.justica;
  const p = j?.processo;
  const e = v.caminhos.envolvimento;
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  switch (oque) {
    case 'advogado_cedo':
      if (e?.investigado === undefined || p) return bloqueio('impossivel', 'Só faz sentido com uma investigação aberta (e antes do processo).');
      if (v.fatos['advogado_preventivo'] !== undefined && v.t - v.fatos['advogado_preventivo'] < 36) return bloqueio('incompativel', 'Você já tem um advogado acompanhando.');
      return vereditoDePagar(v, Math.round(honorarios(v) * 0.6 / 100) * 100, 'Um advogado desde já cobra uns');
    case 'estrategia_contestar': case 'estrategia_atenuantes': case 'estrategia_delegar':
      if (!p || j?.foragido) return bloqueio('impossivel', 'Não há processo andando.');
      if (doProcesso(v, j?.defesa?.tEstrategia)) return bloqueio('incompativel', 'A estratégia já foi escolhida neste processo.');
      if (oque === 'estrategia_delegar' && p.defesa !== 'particular') return bloqueio('requisito', 'Deixar a estratégia com o advogado pede um advogado particular (a defensoria segue o padrão).');
      return PERMITIDO;
    case 'audiencia_comparecer': case 'audiencia_preparar': case 'audiencia_faltar':
      if (!p || j?.foragido || j?.prisao) return bloqueio('impossivel', j?.prisao ? 'Preso, a audiência vem até você.' : 'Não há audiência marcada.');
      if (p.tJulgamento - v.t > 12) return bloqueio('incompativel', `A audiência é em ${anoDe(p.tJulgamento)}.`);
      if (doProcesso(v, j?.defesa?.audiencia?.t)) return bloqueio('incompativel', 'Isso já foi decidido.');
      if (oque === 'audiencia_preparar') return p.defesa === 'particular' ? PERMITIDO : vereditoDePagar(v, custoDaPreparacao(v), 'Preparar a defesa com calma custa uns');
      if (oque === 'audiencia_faltar') return { grau: 'irregular', motivo: 'Faltar abre um mandado: você passa a ser procurad' + g(v) + ', e o processo para até você aparecer.' };
      return PERMITIDO;
    case 'recorrer': {
      if (j?.recurso) return bloqueio('incompativel', 'Já há um recurso correndo.');
      const c = condenacaoRecente(v);
      if (!c) return bloqueio('impossivel', 'Não há condenação recente de que recorrer.');
      if (v.fatos['recorreu_de'] === c.t) return bloqueio('incompativel', 'Você já recorreu dessa condenação.');
      return PERMITIDO;
    }
    case 'abandonar_pena': return j?.alternativa ? { grau: 'irregular', motivo: 'Deixar de cumprir a pena alternativa vira mandado — e, quando a Justiça encontra, a pena alternativa vira prisão.' } : bloqueio('impossivel', 'Não há pena alternativa em curso.');
    case 'mudar_endereco':
      if (!j?.foragido) return bloqueio('impossivel', 'Só para quem está sendo procurado.');
      if (j.foragido.mudouEndereco !== undefined && v.t - j.foragido.mudouEndereco < 12) return bloqueio('incompativel', 'Você já mudou de endereço neste ano.');
      return vereditoDePagar(v, custoDaMudanca(v), 'Mudar de endereço às pressas custa uns');
    case 'abrigo': {
      if (!j?.foragido) return bloqueio('impossivel', 'Só para quem está sendo procurado.');
      if (j.foragido.abrigo !== undefined && v.t - j.foragido.abrigo < 24) return bloqueio('incompativel', 'Você já está abrigad' + g(v) + '.');
      const quem = abrigoPossivel(v);
      return quem ? { grau: 'irregular', motivo: `${cap(quem.org.nome)} tem presença em ${nomeDaRegiao(v.moradia.municipioId, regiaoDaPessoa(v))}: o abrigo existe — e cobra depois.` } : bloqueio('requisito', 'Ninguém com presença por aqui deve isso a você (nenhuma organização aliada ou de que você seja de dentro).');
    }
    case 'apresentar_se':
      if (!j?.foragido) return bloqueio('impossivel', 'Não há de que se apresentar.');
      return j.foragido.motivo === 'fuga' || !j.foragido.motivo ? bloqueio('incompativel', 'Quem fugiu da pena se entrega na unidade (em Submundo · Justiça: "Entregar-se").') : PERMITIDO;
  }
}

/** Quem pode abrigar: uma organização aliada (ou de que se é de dentro) com presença na região onde a pessoa mora. */
export function abrigoPossivel(v: Vida) {
  return influenciaAqui(v).find(x => x.influencia >= 30 && x.rel && (x.rel.relacao === 'membro' || x.rel.relacao === 'aliada') && x.rel.saiu === undefined && x.rel.expulso === undefined && x.rel.lealdade >= 35);
}

export function executarDefesa(v: Vida, oque: OqueDefesa): { texto: string; tom?: 'bom' | 'ruim' } {
  const j = garantirJustica(v);
  const p = j.processo;
  const r = rngDe(v.id, 'defesa', oque, v.t);
  const d = (j.defesa ??= {});
  switch (oque) {
    case 'advogado_cedo':
      pagarJustica(v, Math.round(honorarios(v) * 0.6 / 100) * 100);
      v.fatos['advogado_preventivo'] = v.t;
      return { texto: 'Um advogado passou a acompanhar a investigação desde já: o que você diz, quando diz, a quem. Se virar processo, a defesa já está pronta.' };
    case 'estrategia_contestar': case 'estrategia_atenuantes': case 'estrategia_delegar': {
      let est: 'contestar' | 'atenuantes' = oque === 'estrategia_atenuantes' ? 'atenuantes' : 'contestar';
      if (oque === 'estrategia_delegar') est = (p!.provas ?? 50) >= 65 ? 'atenuantes' : 'contestar';
      d.estrategia = oque === 'estrategia_delegar' ? 'delegar' : est;
      d.tEstrategia = v.t;
      if (est === 'contestar') {
        const funciona = r.chance(p!.defesa === 'particular' ? 0.7 : 0.45);
        const corte = funciona ? r.int(p!.defesa === 'particular' ? 8 : 4, p!.defesa === 'particular' ? 16 : 9) : 0;
        p!.provas = clamp((p!.provas ?? 50) - corte, 5, 95);
        d.contestou = true;
        return { texto: `${oque === 'estrategia_delegar' ? 'O advogado decidiu contestar as provas. ' : ''}${funciona ? `A defesa derrubou parte do que havia contra você (as provas pesam menos agora).` : 'A defesa contestou as provas; o juiz não se convenceu desta vez.'}`, tom: funciona ? 'bom' : undefined };
      }
      return { texto: `${oque === 'estrategia_delegar' ? 'Com as provas fortes, o advogado foi por outro lado: ' : ''}A defesa vai mostrar quem você é além do processo — o trabalho, a família, o tempo. A absolvição fica um pouco mais longe; a pena, se vier, menor.` };
    }
    case 'audiencia_comparecer':
      d.audiencia = { t: v.t, foi: 'compareceu' };
      return { texto: 'Você vai à audiência, de roupa passada e a voz firme. O resto é com o juiz.' };
    case 'audiencia_preparar':
      if (p!.defesa !== 'particular') pagarJustica(v, custoDaPreparacao(v));
      d.audiencia = { t: v.t, foi: 'preparou' };
      return { texto: 'Você passou semanas com a defesa: o que perguntar, o que responder, o que não dizer. Na audiência, nada pega você de surpresa.', tom: 'bom' };
    case 'audiencia_faltar':
      d.audiencia = { t: v.t, foi: 'faltou' };
      j.foragido = { t: v.t, restante: 0, motivo: 'mandado' };
      marcar(v, 'fracasso', 'Um mandado de prisão: não foi à audiência.', 3);
      escrever(v, { texto: `Não foi à audiência. O juiz expediu um mandado: passou a ser procurad${g(v)}.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
      for (const x of pais(v)) { const vin = v.vinculos[x.id]; if (vin) vin.tensao = clamp(vin.tensao + 10); }
      return { texto: 'Você não foi. Agora há um mandado com o seu nome: o processo para, e a Justiça passa a procurar você.', tom: 'ruim' };
    case 'recorrer': {
      const c = condenacaoRecente(v)!;
      v.fatos['recorreu_de'] = c.t;
      return { texto: recorrer(v) };
    }
    case 'abandonar_pena':
      j.foragido = { t: v.t, restante: Math.max(6, (j.alternativa!.tFim - v.t)) + 12, motivo: 'descumprimento' };
      j.alternativa = undefined;
      escrever(v, { texto: `Deixou de cumprir a pena alternativa. Virou mandado: passou a ser procurad${g(v)}.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: 'Você parou de ir. Na segunda semana, a falta virou papel; no segundo mês, mandado.', tom: 'ruim' };
    case 'mudar_endereco':
      pagarPorFora(v, 'custos', custoDaMudanca(v));
      j.foragido!.mudouEndereco = v.t;
      if (v.mundoCriminal) delete v.mundoCriminal.regiao;
      abalar(v, 'a mudança às pressas', -3, 6);
      return { texto: 'Outra casa, outro bairro, as coisas em sacolas. Por um tempo, é mais difícil achar você — e mais difícil ter vizinhos.' };
    case 'abrigo': {
      const quem = abrigoPossivel(v)!;
      j.foragido!.abrigo = v.t;
      lembrarOrg(quem.rel!, v.t, 'favor', -6);
      // O preço do abrigo: um trabalho para eles, mais cedo ou mais tarde (chega em Encomendas, se ainda estiver no caminho).
      if (v.caminhos.envolvimento && v.caminhos.envolvimento.parou === undefined) proporEncomenda(v, r, quem.org.ramo, { orgId: quem.org.id }, 2);
      v.fatos['abrigo_de'] = v.t;
      return { texto: `${cap(quem.org.nome)} arrumou onde você ficar, entre gente que não pergunta. Ficar mais difícil de achar tem preço: agora você deve a eles.` };
    }
    case 'apresentar_se': {
      const f = j.foragido!;
      j.foragido = undefined;
      const comAdvogado = disponivel(v) >= honorarios(v) * 0.5;
      if (comAdvogado) pagarJustica(v, Math.round(honorarios(v) * 0.5 / 100) * 100);
      if (f.motivo === 'descumprimento') {
        const meses = Math.max(6, f.restante);
        prender(v, v.t + Math.round(meses * 0.6), 'semiaberto', 'pena');
        j.prisao!.penaMeses = meses;
        escrever(v, { texto: 'Apresentou-se ao fórum. A pena alternativa abandonada virou prisão, no semiaberto.', relevancia: 'marco', tema: 'trabalho', tom: 'ruim', escolha: true });
        return { texto: 'Você se apresentou. A pena alternativa que ficou para trás virou semiaberto — menos do que seria se a Justiça tivesse chegado primeiro.', tom: 'ruim' };
      }
      if (j.processo) j.processo.tJulgamento = v.t + 6;
      if (!comAdvogado && r.chance(0.3)) prender(v, v.t + 6, 'fechado', 'preventiva');
      escrever(v, { texto: `Apresentou-se${comAdvogado ? ' com um advogado' : ''} e o mandado caiu. O processo voltou a andar.`, relevancia: 'marco', tema: 'trabalho', escolha: true });
      return { texto: `Você se apresentou${comAdvogado ? ', com um advogado do lado' : ''}. O mandado caiu; o processo voltou a andar${j.prisao ? ' — e o juiz mandou esperar preso' : ', e você espera o julgamento em liberdade'}.` };
    }
  }
}

/* ================================================================ o ano de quem é procurado */

/**
 * A chance de ser encontrado no ano (lida por `prisao` no ano de quem foge ou é procurado): o tipo de mandado, o emprego
 * com carteira (o cadastro), o endereço novo, o abrigo, o nome conhecido.
 */
export function chanceDeCaptura(v: Vida): number {
  const f = v.justica?.foragido;
  if (!f) return 0;
  const base = f.motivo === 'mandado' ? 0.22 : f.motivo === 'descumprimento' ? 0.2 : 0.3;
  const formal = v.trabalho.atual && ['clt', 'servidor', 'militar'].includes(v.trabalho.atual.contrato) ? 0.12 : 0;
  const abrigo = f.abrigo !== undefined && v.t - f.abrigo < 24 ? -0.12 : 0;
  const mudou = f.mudouEndereco !== undefined && v.t - f.mudouEndereco <= 12 ? -0.07 : 0;
  const famoso = (v.notoriedade?.valor ?? 0) >= 40 ? 0.1 : 0;
  return clamp(base + formal + abrigo + mudou + famoso, 0.06, 0.6);
}

/** Uma linha para a tela de quem é procurado: o que o mandado pesa e o que dá para fazer. */
export function leituraDoProcurado(v: Vida): { titulo: string; linhas: string[]; risco: number } | undefined {
  const f = v.justica?.foragido;
  if (!f) return undefined;
  const anos = Math.max(0, Math.round((v.t - f.t) / 12));
  const titulo = f.motivo === 'mandado' ? 'Há um mandado com o seu nome' : f.motivo === 'descumprimento' ? 'A pena alternativa virou mandado' : 'Foragid' + g(v);
  return {
    titulo, risco: chanceDeCaptura(v),
    linhas: [
      `${anos ? `Há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : 'Desde este ano'}${f.motivo === 'fuga' ? ', com o resto da pena esperando' : f.motivo === 'mandado' ? ', com o processo parado' : ''}.`,
      'Trabalho com carteira, banco, cartório, fronteira e concurso pedem documento — e documento chama atenção.',
      'Mudar de cidade não apaga o mandado; ele vale no país inteiro.',
      ...(f.abrigo !== undefined && v.t - f.abrigo < 24 ? ['Você está abrigad' + g(v) + ' por gente que cobra depois.'] : []),
      ...(f.mudouEndereco !== undefined && v.t - f.mudouEndereco <= 12 ? ['Mudou de endereço há pouco: por enquanto, é mais difícil achar você.'] : [])
    ]
  };
}

/** O ano de quem é procurado (antes da captura, que `prisao` sorteia): o emprego formal que acaba, a família que sente. */
export function processarProcurado(v: Vida): void {
  const f = v.justica?.foragido;
  if (!f) return;
  const r = rngDe(v.id, 'procurado', v.t);
  // O processo de quem tem mandado não anda (o julgamento espera a pessoa aparecer).
  const p = v.justica!.processo;
  if (p && p.tJulgamento <= v.t + 12) p.tJulgamento = v.t + 13;
  const e = v.trabalho.atual;
  if (e && ['clt', 'servidor', 'militar'].includes(e.contrato) && r.chance(0.35)) {
    v.trabalho.atual = undefined;
    v.trabalho.desempregadoDesde = v.t;
    escrever(v, { texto: `O emprego acabou: pediram documentos atualizados, e quem é procurad${g(v)} não pode entregar.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
  const par = parceiro(v);
  if (par) par.vin.tensao = clamp(par.vin.tensao + 5);
  for (const x of pais(v)) { const vin = v.vinculos[x.id]; if (vin) vin.tensao = clamp(vin.tensao + 2); }
  v.mente.estresse = clamp(v.mente.estresse + 4);
  void idade;
}

/**
 * A captura de quem tem mandado (o processo volta, preso até o julgamento) — chamada por `prisao` quando o sorteio do ano
 * encontra a pessoa e o motivo não é a fuga de uma pena.
 */
export function capturarComMandado(v: Vida): void {
  const j = v.justica!;
  const f = j.foragido!;
  j.foragido = undefined;
  if (f.motivo === 'descumprimento') {
    const meses = Math.max(12, f.restante);
    prender(v, v.t + Math.round(meses * 0.6), 'fechado', 'pena');
    j.prisao!.penaMeses = meses;
    escrever(v, { texto: `Foi encontrad${g(v)}: a pena alternativa abandonada virou prisão, em regime fechado.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    return;
  }
  if (j.processo) j.processo.tJulgamento = v.t + 6;
  prender(v, v.t + 6, 'fechado', 'preventiva');
  escrever(v, { texto: `Foi encontrad${g(v)} pelo mandado. Espera o julgamento pres${g(v)}.`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
}

/** O perfil do país (para a tela: o acordo, a fiança, a colaboração existem aqui?). */
export const regrasDoPais = (v: Vida) => { const p = perfilDaVida(v); return { acordo: p.acordo !== 'nao', fianca: !!p.fianca, colaboracao: !!p.colaboracao, defensoria: p.defensoria, reabilitacao: p.reabilitacaoAnos }; };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

registrarProcurado({
  ano: processarProcurado,
  chance: chanceDeCaptura,
  capturar: v => { const m = v.justica?.foragido?.motivo; if (m === 'mandado' || m === 'descumprimento') { capturarComMandado(v); return true; } return false; }
});
