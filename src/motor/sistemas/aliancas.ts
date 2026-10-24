/**
 * REWORK 11.5 · POL-05 — ALIANÇAS E PROMESSAS COM MEMÓRIA.
 *
 * Antes, a vida política tinha "o aliado" (uma pessoa, sem história) e o desgaste de "promessas" como número. Agora:
 *
 *   ALIANÇA     uma pessoa de um grupo (a bancada do comércio, as lideranças dos bairros...), com confiança e FAVORES
 *               (quem deve a quem). Formar dá base agora e traz um compromisso; romper custa — e o rompido lembra
 *   PROMESSA    de campanha (ao eleitor: cobrada no fim do mandato pelas entregas) ou a um aliado (cobrada no prazo).
 *               Cumprida, sobe a confiança e a base; quebrada, desgasta, e o aliado pode romper
 *   O PEDIDO    a cada tanto, um aliado pede apoio a uma pauta dele (a decisão `pol_alianca_pedido`)
 *   A ELEIÇÃO   as alianças de confiança, as promessas cumpridas e quebradas e o rompimento recente viram fatores da
 *               apuração (`fatorDasAliancas`, lido por `politica.fatoresDaEleicao`) — com a explicação de sempre
 *
 * Os mandatos (`mandato`) continuam usando "o aliado": a liderança de uma aliança rompida não conta mais como tal.
 * Sorteios derivados (`rngDe`).
 */
import { clamp, rngDe } from '../rng';
import type { AliancaPolitica, PromessaPolitica, Vida, VidaPolitica } from '../tipos';
import { escrever, lembrarCom, novoId } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { desgastar } from './desgastePolitico';
import { anoDe } from '../tempo';

export const GRUPOS = ['a bancada do comércio', 'as lideranças dos bairros', 'o grupo do sindicato', 'a ala jovem do partido', 'os vereadores do interior', 'o movimento pela saúde', 'as associações de produtores', 'o grupo dos servidores'];

export const aliancasAtivas = (p: VidaPolitica | undefined) => (p?.aliancas ?? []).filter(a => a.rompida === undefined);
export const promessasEmAberto = (p: VidaPolitica | undefined) => (p?.promessas ?? []).filter(x => x.cumprida === undefined && x.quebrada === undefined);

/** A pessoa de uma aliança (rompida = não conta como "o aliado" nos mandatos). */
export const liderancaRompida = (v: Vida, pessoaId: string) => (v.caminhos.politica?.aliancas ?? []).some(a => a.pessoaId === pessoaId && a.rompida !== undefined);

export type OqueAlianca = 'formar' | 'cumprir' | 'romper' | 'pedir_apoio' | 'prometer';

export function disponibilidadeAlianca(v: Vida, oque: OqueAlianca, id?: string): Veredito {
  const p = v.caminhos.politica;
  if (!p || p.fase === 'encerrada') return bloqueio('impossivel', 'Fora da vida política.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Na prisão, não.');
  switch (oque) {
    case 'formar':
      if (p.fase === 'envolvido') return bloqueio('requisito', 'Aliança se faz de dentro de um partido: falta a filiação.');
      if (aliancasAtivas(p).length >= 3) return bloqueio('incompativel', 'Três alianças já pedem mais do que se consegue cumprir.');
      if (v.fatos['pol_alianca_formada'] === v.t) return bloqueio('incompativel', 'Você já fechou uma aliança neste ano.');
      return PERMITIDO;
    case 'cumprir': {
      const x = promessasEmAberto(p).find(y => y.id === id && y.origem === 'alianca');
      return x ? PERMITIDO : bloqueio('impossivel', 'Não há esse compromisso em aberto.');
    }
    case 'romper': return aliancasAtivas(p).some(a => a.id === id) ? PERMITIDO : bloqueio('impossivel', 'Não há essa aliança.');
    case 'pedir_apoio': {
      const a = aliancasAtivas(p).find(y => y.id === id);
      if (!a) return bloqueio('impossivel', 'Não há essa aliança.');
      if (!p.campanha) return bloqueio('incompativel', 'Apoio de aliado se pede na campanha.');
      if (v.fatos[`pol_pediu_${a.id}`] !== undefined && v.fatos[`pol_pediu_${a.id}`] >= p.campanha.tEleicao - 24) return bloqueio('incompativel', 'Você já pediu o apoio desse aliado nesta campanha.');
      return PERMITIDO;
    }
    case 'prometer':
      if (!p.campanha) return bloqueio('incompativel', 'Promessa ao eleitor se faz na campanha.');
      if (promessasEmAberto(p).some(x => x.origem === 'campanha' && x.t >= p.campanha!.tEleicao - 24)) return bloqueio('incompativel', 'A sua promessa desta campanha já foi feita.');
      return PERMITIDO;
  }
}

function prometer(v: Vida, x: Omit<PromessaPolitica, 'id' | 't'>): PromessaPolitica {
  const p = v.caminhos.politica!;
  const pr: PromessaPolitica = { id: novoId(v, 'pr'), t: v.t, ...x };
  (p.promessas ??= []).push(pr);
  if (p.promessas.length > 24) p.promessas.splice(0, p.promessas.length - 24);
  return pr;
}

export function executarAlianca(v: Vida, oque: OqueAlianca, id?: string): string {
  const p = v.caminhos.politica!;
  const r = rngDe(v.id, 'alianca', v.t, oque, id ?? '');
  switch (oque) {
    case 'formar': {
      v.fatos['pol_alianca_formada'] = v.t;
      const usados = new Set((p.aliancas ?? []).map(a => a.grupo));
      const grupo = r.pick(GRUPOS.filter(g => !usados.has(g))) ?? GRUPOS[0];
      const pessoa = criarPessoa(v, r, { idade: r.int(38, 70), municipioId: v.moradia.municipioId });
      pessoa.ocupacao = 'liderança política';
      pessoa.renda = 9000;
      vincular(v, pessoa, { origem: 'apresentado', proximidade: 22, estagio: 'conhecido' });
      const a: AliancaPolitica = { id: novoId(v, 'al'), pessoaId: pessoa.id, grupo, confianca: 45, desde: v.t, favores: 0 };
      (p.aliancas ??= []).push(a);
      p.apoio = clamp(p.apoio + 4);
      prometer(v, { texto: `apoiar a pauta de ${grupo} (${pessoa.nome})`, origem: 'alianca', aliancaId: a.id, prazo: v.t + 24 });
      escrever(v, { texto: `Fechou uma aliança com ${pessoa.nome}, de ${grupo}. Em troca, prometeu apoiar a pauta deles.`, relevancia: 'biografia', tema: 'trabalho', escolha: true, pessoas: [pessoa.id] });
      return `${pessoa.nome} trouxe o apoio de ${grupo}. O compromisso ficou dito: dois anos para mostrar que você cumpre.`;
    }
    case 'cumprir': {
      const x = promessasEmAberto(p).find(y => y.id === id)!;
      const a = (p.aliancas ?? []).find(y => y.id === x.aliancaId);
      x.cumprida = v.t;
      desgastar(p, 2, 'promessas');
      if (a) { a.confianca = clamp(a.confianca + 15); a.favores++; lembrarCom(v, a.pessoaId, 'Você cumpriu o que prometeu ao grupo.', 'apoio', 2); }
      escrever(v, { texto: `Cumpriu o compromisso: ${x.texto}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return `Você cumpriu. Custou um pouco na rua (nem todo mundo gosta da pauta deles) — e agora ${a ? v.pessoas[a.pessoaId]?.nome ?? 'o aliado' : 'o aliado'} lhe deve uma.`;
    }
    case 'romper': {
      const a = aliancasAtivas(p).find(y => y.id === id)!;
      a.rompida = v.t; a.porQuem = 'voce'; a.confianca = 0;
      for (const x of promessasEmAberto(p).filter(y => y.aliancaId === a.id)) x.quebrada = v.t;
      p.apoio = clamp(p.apoio - 3);
      v.fatos['pol_rompeu'] = v.t;
      lembrarCom(v, a.pessoaId, 'Você rompeu a aliança.', 'conflito', 3);
      escrever(v, { texto: `Rompeu a aliança com ${v.pessoas[a.pessoaId]?.nome ?? 'o aliado'} (${a.grupo}).`, relevancia: 'biografia', tema: 'trabalho', escolha: true, tom: 'ruim' });
      return `A aliança acabou. ${a.grupo.charAt(0).toUpperCase() + a.grupo.slice(1)} vai lembrar disso na próxima eleição.`;
    }
    case 'pedir_apoio': {
      const a = aliancasAtivas(p).find(y => y.id === id)!;
      v.fatos[`pol_pediu_${a.id}`] = v.t;
      const deve = a.favores > 0;
      const atende = deve || r.chance(clamp(a.confianca / 120, 0.1, 0.7));
      if (atende) {
        if (p.campanha) p.campanha.nota += deve ? 4 : 2;
        a.favores--;
        return `${v.pessoas[a.pessoaId]?.nome ?? 'O aliado'} pôs ${a.grupo} na sua campanha${deve ? ': era a vez dele de pagar o favor' : ''}.`;
      }
      a.confianca = clamp(a.confianca - 10);
      return `${v.pessoas[a.pessoaId]?.nome ?? 'O aliado'} desconversou: "agora não dá". Quem não deve favor não corre risco por ninguém.`;
    }
    case 'prometer': {
      const pr = prometer(v, { texto: 'entregar o que a campanha prometeu', origem: 'campanha', prazo: (p.campanha?.tEleicao ?? v.t) + 60 });
      if (p.campanha) p.campanha.nota += 2;
      return `A promessa foi feita em praça pública (e gravada). Se ganhar, ela é cobrada no fim do mandato — prazo até ${anoDe(pr.prazo)}.`;
    }
  }
}

/** O ano das alianças e das promessas: os prazos que vencem, a confiança que anda, o aliado que pede ou rompe. */
export function processarAliancas(v: Vida): void {
  const p = v.caminhos.politica;
  if (!p || (!p.aliancas?.length && !p.promessas?.length)) return;
  delete p.pedido;
  const r = rngDe(v.id, 'aliancas', v.t);
  // Os prazos.
  for (const x of promessasEmAberto(p)) {
    if (x.origem === 'campanha') {
      // A de campanha só vale para quem ganhou: abre o mandato com as entregas de então, e é cobrada no fim dele.
      const m = p.mandato;
      if (m && x.feitoAntes === undefined && m.tInicio >= x.t) x.feitoAntes = m.feito;
      if (!m && x.feitoAntes === undefined && v.t > x.prazo - 48) { p.promessas = (p.promessas ?? []).filter(y => y !== x); continue; }
      const fim = m ? m.tFim : x.prazo;
      if (v.t < fim - 6) continue;
      const entregou = (m?.feito ?? 0) - (x.feitoAntes ?? 0) >= 3;
      if (entregou) { x.cumprida = v.t; p.apoio = clamp(p.apoio + 3); escrever(v, { texto: 'A promessa de campanha foi cumprida, e o eleitor reparou.', relevancia: 'biografia', tema: 'trabalho', tom: 'bom' }); }
      else { x.quebrada = v.t; desgastar(p, 4, 'promessas'); p.apoio = clamp(p.apoio - 3); escrever(v, { texto: 'A promessa de campanha não foi cumprida — e vai ser lembrada na próxima eleição.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' }); }
      continue;
    }
    if (v.t < x.prazo) continue;
    x.quebrada = v.t;
    const a = (p.aliancas ?? []).find(y => y.id === x.aliancaId);
    desgastar(p, 2, 'promessas');
    if (a && a.rompida === undefined) { a.confianca = clamp(a.confianca - 30); lembrarCom(v, a.pessoaId, 'O compromisso com o grupo não foi cumprido.', 'conflito', 2); }
    escrever(v, { texto: `O prazo passou e o compromisso não foi cumprido: ${x.texto}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
  }
  // As alianças: a confiança anda; quem não confia mais rompe; quem confia pede.
  for (const a of aliancasAtivas(p)) {
    if (!v.pessoas[a.pessoaId]?.vivo) { a.rompida = v.t; a.porQuem = 'aliado'; continue; }
    a.confianca = clamp(a.confianca + (a.favores >= 0 ? 1 : -3));
    if (a.confianca < 20) {
      a.rompida = v.t; a.porQuem = 'aliado';
      p.apoio = clamp(p.apoio - 2);
      escrever(v, { texto: `${v.pessoas[a.pessoaId].nome} rompeu a aliança: ${a.grupo} não confia mais em você.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', pessoas: [a.pessoaId] });
      continue;
    }
    if (!p.pedido && !promessasEmAberto(p).some(x => x.aliancaId === a.id) && v.t - a.desde >= 12 && r.chance(0.35)) { p.pedido = { aliancaId: a.id, t: v.t }; v.fatos['pol_alianca_pedido'] = v.t; }
  }
}

/** Para a decisão: o aliado e o grupo do pedido de hoje. */
export function pedidoDeHoje(v: Vida): { a: AliancaPolitica; nome: string } | undefined {
  const p = v.caminhos.politica;
  if (!p?.pedido || p.pedido.t !== v.t) return undefined;
  const a = aliancasAtivas(p).find(x => x.id === p.pedido!.aliancaId);
  return a && v.pessoas[a.pessoaId] ? { a, nome: v.pessoas[a.pessoaId].nome } : undefined;
}

/** A resposta ao pedido: atender (a confiança, o favor; o desgaste na rua), adiar com prazo, ou recusar. */
export function responderPedido(v: Vida, como: 'atender' | 'adiar' | 'recusar'): string {
  const p = v.caminhos.politica!;
  const x = pedidoDeHoje(v);
  if (!x) return '';
  const { a, nome } = x;
  delete p.pedido;
  if (como === 'atender') { a.confianca = clamp(a.confianca + 12); a.favores++; desgastar(p, 2, 'promessas'); return `Você pôs o seu nome na pauta de ${a.grupo}. ${nome} vai lembrar — e parte da rua também.`; }
  if (como === 'adiar') { prometer(v, { texto: `apoiar o pedido de ${a.grupo} (${nome})`, origem: 'alianca', aliancaId: a.id, prazo: v.t + 12 }); return `"No ano que vem." ${nome} aceitou — e anotou.`; }
  a.confianca = clamp(a.confianca - 20); a.favores--;
  return `Você disse que não. ${nome} não discutiu; só ficou mais frio.`;
}

/**
 * Os fatores da eleição que vêm das alianças e das promessas (lidos por `politica.fatoresDaEleicao`): as alianças de
 * confiança ajudam; as promessas quebradas nos últimos oito anos pesam; as cumpridas ajudam um pouco; ter rompido uma
 * aliança há pouco pesa.
 */
export function fatorDasAliancas(p: VidaPolitica, tEleicao: number): { aliancas: number; promessas: number; rompimento: number } {
  const fortes = aliancasAtivas(p).filter(a => a.confianca >= 50);
  const aliancas = Math.min(6, fortes.length * 2 + (fortes.some(a => a.favores > 0) ? 1 : 0));
  const recentes = (p.promessas ?? []).filter(x => tEleicao - (x.cumprida ?? x.quebrada ?? -1e9) <= 96);
  const promessas = clamp(recentes.filter(x => x.cumprida !== undefined).length * 1.5 - recentes.filter(x => x.quebrada !== undefined).length * 3, -9, 4);
  const rompeu = (p.aliancas ?? []).some(a => a.porQuem === 'voce' && a.rompida !== undefined && tEleicao - a.rompida <= 48);
  return { aliancas, promessas, rompimento: rompeu ? -3 : 0 };
}

/** Para a tela (o painel político): as alianças, as promessas e o que cada uma pede agora. */
export function leituraDasAliancas(v: Vida): { aliancas: { id: string; nome: string; grupo: string; confianca: number; favores: number; rompida?: number; porQuem?: string; desde: number }[]; promessas: { id: string; texto: string; origem: string; prazo: number; estado: 'aberta' | 'cumprida' | 'quebrada' }[] } {
  const p = v.caminhos.politica;
  return {
    aliancas: (p?.aliancas ?? []).map(a => ({ id: a.id, nome: v.pessoas[a.pessoaId]?.nome ?? '—', grupo: a.grupo, confianca: a.confianca, favores: a.favores, ...(a.rompida !== undefined ? { rompida: anoDe(a.rompida), porQuem: a.porQuem } : {}), desde: anoDe(a.desde) })),
    promessas: [...(p?.promessas ?? [])].reverse().map(x => ({ id: x.id, texto: x.texto, origem: x.origem, prazo: anoDe(x.prazo), estado: x.cumprida !== undefined ? 'cumprida' : x.quebrada !== undefined ? 'quebrada' : 'aberta' }))
  };
}
