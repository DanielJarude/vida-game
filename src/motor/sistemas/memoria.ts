/**
 * REWORK 7.5 — a memória de quem se foi: homenagens, lembrança e a família que perdeu junto.
 *
 * Quando alguém importante morre, a vida do jogador abre gestos possíveis — e só os que fazem sentido PARA AQUELA
 * relação, naquele momento: ir à despedida (só no ano da morte; de longe ou de outro país, só quem pode viajar), dizer
 * algumas palavras, conversar com quem também perdeu (alguém real, vivo, que perdeu essa pessoa), guardar uma
 * lembrança, visitar o lugar onde ela descansa (o motor não sabe a religião nem o rito de cada família: o texto diz "o
 * lugar onde descansa", não "o túmulo", e a despedida se chama como se chama no país), recordar um momento que vocês
 * viveram DE VERDADE (um marco da história de vocês, nunca inventado).
 *
 * O que um gesto faz: muda a relação com a família (aproxima quem perdeu junto), entra na história com a pessoa e,
 * quando importa, na Linha da Vida — ligado à morte (`segue`). No luto, ajuda um pouco a atravessar (`luto.ts`
 * `homenagensDoAno`). NÃO dá felicidade de recompensa: ninguém fica feliz por ir a um velório.
 *
 * Estado: só `fatos['hom:<gesto>:<id>'] = t` (o último de cada gesto por pessoa) — compacto, sem histórico infinito.
 */

import type { Rng } from '../rng';
import { rngDe } from '../rng';
import type { Marco, Pessoa, Vida, Vinculo } from '../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { entradaDaMorte, escrever, idade, idadeAoMorrer, idadePessoa, lembrarCom } from '../nucleo';
import { flex } from '../texto';
import { anoDe } from '../tempo';
import { importancia, papelDe } from './vinculos';
import { quemPerde } from './rede';
import { nomeLugar, paisDaCidade } from '../dados/lugares';
import { noPais } from '../mundo/registro';

export type GestoDeMemoria = 'despedida' | 'palavras' | 'familia' | 'lembranca' | 'visitar' | 'recordar';

export const GESTOS_DE_MEMORIA: readonly GestoDeMemoria[] = ['despedida', 'palavras', 'familia', 'recordar', 'visitar', 'lembranca'];

/** Onde a despedida se chama velório (e onde se diz funeral): o nome do rito é do país, não do jogo. */
const VELORIO = new Set(['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL', 'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE', 'ES', 'IT']);
const nomeDaDespedida = (v: Vida) => (VELORIO.has(paisDaCidade(v.moradia.municipioId)) ? 'velório' : 'funeral');

const chave = (g: GestoDeMemoria, id: string) => `hom:${g}:${id}`;
const fezNoAno = (v: Vida, g: GestoDeMemoria, id: string) => { const t = v.fatos[chave(g, id)]; return t !== undefined && v.t - t < 12; };
const fezAlgumaVez = (v: Vida, g: GestoDeMemoria, id: string) => v.fatos[chave(g, id)] !== undefined;
const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');

/** Os marcos REAIS que o jogador viveu com a pessoa (antes de ela morrer), para recordar. */
export function lembrancasCom(vin: Vinculo, p: Pessoa): Marco[] {
  const ate = p.tMorte ?? Infinity;
  return vin.historia.filter(h => h.t < ate && h.tipo !== 'perda' && h.tipo !== 'descoberta' && h.tipo !== 'distancia' && !/^Morreu/.test(h.texto));
}

/** Quem também perdeu essa pessoa, está vivo e o jogador conhece (o primeiro é quem mais perdeu). */
export function quemPerdeuJunto(v: Vida, p: Pessoa): Pessoa[] {
  return quemPerde(v, p).map(a => a.p).filter(x => x.vivo && v.vinculos[x.id] && !v.vinculos[x.id].ruptura);
}

/** A pessoa importou o bastante para estes gestos? (Laço de família, ou o peso do laço como na hora da perda.) */
function importou(v: Vida, p: Pessoa, vin: Vinculo): boolean {
  return !!vin.parentesco || importancia(v, p, vin) >= 22 || lembrancasCom(vin, p).some(h => (h.peso ?? 1) >= 2);
}

/** O que dá para fazer pela memória de alguém agora (com o motivo, quando não dá). Vazio para quem está vivo. */
export function gestosDeMemoria(v: Vida, id: string): { gesto: GestoDeMemoria; rotulo: string; veredito: Veredito }[] {
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  if (!p || p.vivo || !vin || !importou(v, p, vin)) return [];
  return GESTOS_DE_MEMORIA
    .map(g => ({ gesto: g, rotulo: rotuloDoGesto(v, p, g), veredito: disponibilidadeGesto(v, id, g) }))
    .filter(x => x.veredito.grau !== 'impossivel');
}

export function rotuloDoGesto(v: Vida, p: Pessoa, g: GestoDeMemoria): string {
  switch (g) {
    case 'despedida': return `Ir ao ${nomeDaDespedida(v)} de ${p.nome}`;
    case 'palavras': return p.especie ? `Escrever umas linhas sobre ${p.nome}` : `Prestar uma homenagem a ${p.nome}`;
    case 'familia': { const x = quemPerdeuJunto(v, p)[0]; return x ? `Conversar com ${x.nome} sobre ${p.nome}` : `Conversar com a família sobre ${p.nome}`; }
    case 'lembranca': return `Guardar uma lembrança de ${p.nome}`;
    case 'visitar': return `Visitar o lugar onde ${p.nome} descansa`;
    case 'recordar': return `Recordar um momento com ${p.nome}`;
  }
}

export function disponibilidadeGesto(v: Vida, id: string, g: GestoDeMemoria): Veredito {
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  if (!p || p.vivo || !vin) return bloqueio('impossivel', '');
  const i = idade(v);
  if (i < 5) return bloqueio('impossivel', '');
  const meses = v.t - (p.tMorte ?? v.t);
  const lugar = p.municipioId;
  const mesmoPais = paisDaCidade(lugar) === paisDaCidade(v.moradia.municipioId);
  const mesmaCidade = lugar === v.moradia.municipioId;
  const luto = v.luto.find(l => l.pessoaId === id);
  switch (g) {
    case 'despedida': {
      // A despedida acontece uma vez, logo depois da morte; quem já a viveu na decisão de despedida não "vai de novo".
      if (meses >= 12 || fezAlgumaVez(v, g, id) || luto?.como) return bloqueio('impossivel', '');
      if (p.especie) return bloqueio('impossivel', '');
      if (i < 12 && !vin.parentesco) return bloqueio('requisito', 'Criança vai a uma despedida com a família — e esta não é da família.');
      if (!mesmoPais && i < 18) return bloqueio('requisito', `A despedida foi ${noPais(paisDaCidade(lugar))}; de tão longe, sem um adulto que leve, não dá.`);
      return PERMITIDO;
    }
    case 'palavras':
      if (i < 10) return bloqueio('impossivel', '');
      return fezNoAno(v, g, id) ? bloqueio('incompativel', 'Você já fez isso neste ano.') : PERMITIDO;
    case 'familia': {
      if (p.especie) return bloqueio('impossivel', '');
      const x = quemPerdeuJunto(v, p)[0];
      if (!x) return bloqueio('impossivel', '');
      // Falar de quem morreu é coisa dos primeiros anos; depois, vira lembrança de vez em quando.
      if (meses > 72) return bloqueio('impossivel', '');
      return fezNoAno(v, g, id) ? bloqueio('incompativel', 'Vocês já falaram disso neste ano.') : PERMITIDO;
    }
    case 'lembranca':
      if (fezAlgumaVez(v, g, id) || luto?.como === 'lembranca' || meses > 60) return bloqueio('impossivel', '');
      return vin.convivio.length || vin.parentesco || p.especie ? PERMITIDO : bloqueio('impossivel', '');
    case 'visitar':
      if (fezNoAno(v, g, id)) return bloqueio('incompativel', 'Você já foi neste ano.');
      if (!mesmaCidade && (i < 18 || !mesmoPais)) return bloqueio('requisito', `${p.nome} descansa em ${nomeLugar(lugar)}${mesmoPais ? '' : `, ${noPais(paisDaCidade(lugar))}`} — longe daqui.`);
      return PERMITIDO;
    case 'recordar':
      if (!lembrancasCom(vin, p).length) return bloqueio('impossivel', '');
      return fezNoAno(v, g, id) ? bloqueio('incompativel', 'Você já fez isso neste ano.') : PERMITIDO;
  }
}

/** Faz o gesto. Devolve o que a tela diz (nunca "você se sentiu melhor": isso é do luto, com o tempo). */
export function fazerGesto(v: Vida, _r: Rng, id: string, g: GestoDeMemoria): string {
  const p = v.pessoas[id];
  const vin = v.vinculos[id];
  const morte = entradaDaMorte(v, id)?.id;
  // Quantas vezes já se fez este gesto por esta pessoa (os anos de lembrança: `hom:recordar:<id>#n`).
  const vezes = v.fatos[`${chave(g, id)}#n`] ?? 0;
  v.fatos[chave(g, id)] = v.t;
  v.fatos[`${chave(g, id)}#n`] = vezes + 1;
  // A variação vem da própria vida (a pessoa, o ano, quantas vezes): nada do sorteio principal se gasta aqui.
  const r = rngDe(v.id, 'memoria', id, g, v.t);
  const juntos = quemPerdeuJunto(v, p);
  const papel = papelDe(p, vin);
  switch (g) {
    case 'despedida': {
      const nome = nomeDaDespedida(v);
      const longe = p.municipioId !== v.moradia.municipioId;
      const familia = juntos.slice(0, 2);
      for (const x of familia) {
        const vx = v.vinculos[x.id];
        vx.proximidade = Math.min(100, vx.proximidade + 4);
        vx.tUltimoContato = v.t;
        lembrarCom(v, x.id, `Estiveram juntos no ${nome} de ${p.nome}.`, 'perda', 2);
      }
      lembrarCom(v, id, `Você foi ao ${nome}.`, 'perda', 2);
      const ida = longe ? `Você viajou até ${nomeLugar(p.municipioId)}. ` : '';
      const quem = familia.length ? ` ${familia.map(x => x.nome).join(' e ')} ${familia.length > 1 ? 'estavam' : 'estava'} lá; ${familia.length > 1 ? 'ficaram' : 'ficou'} perto de você.` : '';
      escrever(v, { texto: `Foi ao ${nome} de ${p.nome}${longe ? `, em ${nomeLugar(p.municipioId)}` : ''}.`, relevancia: 'biografia', tema: 'perda', pessoas: [id, ...familia.map(x => x.id)], escolha: true, ...(morte ? { segue: morte } : {}) });
      return `${ida}${r.pick(['Pouca gente falou alto.', 'Havia mais gente do que você imaginava.', 'O dia foi longo, e passou depressa.'])}${quem}`;
    }
    case 'palavras': {
      const primeira = vezes === 0;
      lembrarCom(v, id, `Você escreveu sobre ${ele(p)} em ${anoDe(v.t)}.`, 'perda', 1);
      const sobre = lembrancasCom(vin, p).filter(h => (h.peso ?? 1) >= 2);
      const de = sobre.length ? ` Começou por ${anoDe(r.pick(sobre).t)}, por aquilo que só vocês sabiam.` : '';
      if (primeira || (v.t - (p.tMorte ?? v.t)) < 12) escrever(v, { texto: `Escreveu algumas palavras em homenagem a ${p.nome}.`, relevancia: 'cotidiano', tema: 'perda', pessoas: [id], escolha: true, ...(morte ? { segue: morte } : {}) });
      return `Você escreveu sobre ${p.nome}.${de} ${r.pick(['Guardou o texto para você.', 'Mostrou para quem também sentia falta.', 'Leu em voz alta, uma vez só.'])}`;
    }
    case 'familia': {
      const x = juntos[0];
      const vx = v.vinculos[x.id];
      vx.proximidade = Math.min(100, vx.proximidade + 5);
      vx.confianca = Math.min(100, vx.confianca + 3);
      vx.tensao = Math.max(0, vx.tensao - 4);
      vx.tUltimoContato = v.t;
      lembrarCom(v, x.id, `Falaram de ${p.nome}, juntos.`, 'perda', 1);
      const laco = papelDe(x, vx);
      // O que se fala depende do que a árvore sustenta: um filho fala do pai; o viúvo, da vida a dois.
      const deQuem = x.parceiroId === p.id || vx.romance ? `da vida que ${ele(x)} teve com ${p.nome}` : `de como ${p.nome} era`;
      const cena = r.pick([
        `${x.nome} falou ${deQuem}. Você ouviu mais do que falou.`,
        `Vocês riram de uma história antiga de ${p.nome} — e depois ficaram em silêncio.`,
        `${x.nome} contou uma coisa de ${p.nome} que você não sabia.`,
        `Foi uma conversa curta. ${x.nome} só precisava dizer o nome em voz alta.`
      ]);
      return laco === 'filho' && idadePessoa(v, x) < 14 ? `${cena} À noite, ${x.nome} perguntou de novo por ${p.nome}.` : cena;
    }
    case 'lembranca': {
      const coisa = papel === 'pet' ? r.pick(['a coleira', 'a foto do primeiro dia em casa']) : papel === 'avo' ? r.pick(['uma foto antiga no quintal', 'a xícara de sempre', 'o caderno de receitas']) : papel === 'genitor' ? r.pick(['o relógio', 'a caixa de fotografias', 'uma carta escrita à mão']) : r.pick(['uma foto de vocês', 'a última mensagem', 'um livro emprestado que nunca voltou']);
      lembrarCom(v, id, `Você guardou ${coisa}.`, 'perda', 2);
      escrever(v, { texto: `Guardou ${coisa} de ${p.nome}.`, relevancia: 'biografia', tema: 'perda', pessoas: [id], escolha: true, ...(morte ? { segue: morte } : {}) });
      return `Você guardou ${coisa}. Fica numa gaveta que você abre de vez em quando.`;
    }
    case 'visitar': {
      const anos = Math.floor((v.t - (p.tMorte ?? v.t)) / 12);
      lembrarCom(v, id, anos >= 1 ? `Você visitou o lugar onde ${ele(p)} descansa, ${anos === 1 ? 'um ano' : `${anos} anos`} depois.` : `Você visitou o lugar onde ${ele(p)} descansa.`, 'perda', 1);
      if (vezes === 0 || anos >= 10) escrever(v, { texto: anos >= 10 ? `Voltou ao lugar onde ${p.nome} descansa, ${anos} anos depois.` : `Visitou o lugar onde ${p.nome} descansa.`, relevancia: 'cotidiano', tema: 'perda', pessoas: [id], escolha: true, ...(morte ? { segue: morte } : {}) });
      const quem = juntos.find(x => x.municipioId === v.moradia.municipioId && r.chance(0.4));
      if (quem) { const vq = v.vinculos[quem.id]; vq.proximidade = Math.min(100, vq.proximidade + 2); vq.tUltimoContato = v.t; }
      return `${r.pick(['Estava tudo quieto.', 'Alguém tinha deixado flores antes de você.', 'Você ficou um tempo sem dizer nada.', 'Ventava.'])}${quem ? ` ${quem.nome} foi junto.` : ''}${anos >= 1 ? ` Já são ${anos === 1 ? 'um ano' : `${anos} anos`}.` : ''}`;
    }
    case 'recordar': {
      // Um marco de verdade, e não o mesmo da última vez (a ordem gira pelas vezes que já se recordou).
      const marcos = lembrancasCom(vin, p).sort((a, b) => (b.peso ?? 1) - (a.peso ?? 1) || a.t - b.t);
      const m = marcos[vezes % marcos.length];
      lembrarCom(v, id, `Você recordou ${anoDe(m.t)}.`, 'antigo', 1);
      return `${anoDe(m.t)}. ${m.texto.replace(/\.$/, '')}. ${r.pick(['Você lembrou disso de repente, no meio do dia.', 'A lembrança veio inteira, com cheiro e tudo.', 'Faz tempo — e parece que foi ontem.'])}`;
    }
  }
}


/** Quem se foi há pouco e ainda pede um gesto (para a página de Pessoas pôr à vista). */
export function memoriasRecentes(v: Vida): Pessoa[] {
  const ids = new Set(v.luto.map(l => l.pessoaId));
  return Object.values(v.vinculos)
    .map(vin => v.pessoas[vin.pessoaId])
    .filter(p => p && !p.vivo && (ids.has(p.id) || v.t - (p.tMorte ?? -Infinity) < 12) && gestosDeMemoria(v, p.id).some(g => g.veredito.grau === 'permitido'))
    .sort((a, b) => (b.tMorte ?? 0) - (a.tMorte ?? 0));
}

export { idadeAoMorrer };
