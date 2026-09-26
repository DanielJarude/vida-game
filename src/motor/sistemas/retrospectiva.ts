/**
 * A retrospectiva: o que DEFINIU esta vida, em poucas frases.
 *
 * Não é a ficha (cidade, escolaridade, número de filhos) — essa continua
 * existindo. É o que só esta vida teve: com quem viveu e por quanto tempo,
 * quem enterrou, o que construiu (o negócio, a casa, os mandatos), onde
 * caiu (a prisão, a falência, as derrotas), e quem estava perto no fim.
 * Cada frase sai do estado, nunca de um adjetivo sobre como a pessoa foi.
 */

import type { Vida } from '../tipos';
import { vinculosVivos } from '../nucleo';
import { anoDe } from '../tempo';
import { flex, listaNatural } from '../texto';
import { nomeLugar } from '../dados/lugares';
import { nomeCargo } from './politica';
import { papelDe } from './vinculos';
import { nomeOcupacaoId } from './trabalho';

interface Frase { peso: number; texto: string }

const anos = (n: number) => `${n} ${n === 1 ? 'ano' : 'anos'}`;

export function retrospectiva(v: Vida): string[] {
  const g = v.eu.tratamento ?? v.eu.genero;
  const fim = v.morte?.t ?? v.t;
  const out: Frase[] = [];

  // O amor mais longo (e como terminou).
  const romances = Object.values(v.vinculos)
    .filter(x => x.romance && x.romance.estagio !== 'interesse' && x.romance.estagio !== 'saindo' && !x.romance.secreto && v.pessoas[x.pessoaId])
    .map(x => {
      const p = v.pessoas[x.pessoaId];
      const ini = x.romance!.tInicio ?? x.tInicio;
      const fimR = x.romance!.estagio === 'ex' ? x.romance!.tEstagio : x.romance!.fim === 'morte' ? p.tMorte ?? fim : fim;
      return { x, p, dur: Math.max(0, Math.round((fimR - ini) / 12)), ini, fimR };
    })
    .filter(r => r.dur >= 3)
    .sort((a, b) => b.dur - a.dur);
  const maior = romances[0];
  if (maior) {
    const casou = maior.x.historia.some(h => h.tipo === 'casamento');
    const como = maior.x.romance!.fim === 'divorcio' ? `, até o divórcio em ${anoDe(maior.fimR)}` : maior.x.romance!.fim === 'termino' ? `, até a separação em ${anoDe(maior.fimR)}` : maior.x.romance!.fim === 'morte' ? `, até a morte ${flex(maior.p.genero, 'dele', 'dela', 'delu')}, em ${anoDe(maior.fimR)}` : ' — juntos até o fim';
    out.push({ peso: 90 + maior.dur, texto: `${anos(maior.dur)} com ${maior.p.nome}${casou ? `, ${flex(g, 'casado', 'casada', 'casade')}` : ''}${como}.` });
    if (romances.length > 1 && romances[1].dur >= 5) out.push({ peso: 40, texto: `Antes ou depois, ${romances.length === 2 ? `outra história longa: ${romances[1].p.nome}, por ${anos(romances[1].dur)}` : `outras ${romances.length - 1} histórias de anos`}.` });
  }

  // Filhos que morreram antes: define uma vida.
  const filhosMortos = Object.values(v.vinculos).filter(x => x.parentesco === 'filho' && v.pessoas[x.pessoaId] && !v.pessoas[x.pessoaId].vivo && (v.pessoas[x.pessoaId].tMorte ?? 0) <= fim).map(x => v.pessoas[x.pessoaId]);
  if (filhosMortos.length) out.push({ peso: 120, texto: filhosMortos.length === 1 ? `Enterrou ${flex(filhosMortos[0].genero, 'um filho', 'uma filha', 'um filho')}, ${filhosMortos[0].nome}, em ${anoDe(filhosMortos[0].tMorte!)}.` : `Enterrou ${filhosMortos.length} filhos: ${listaNatural(filhosMortos.map(f => f.nome))}.` });

  // A família que ficou: filhos e netos vivos.
  const vivos = vinculosVivos(v);
  const filhos = vivos.filter(x => x.vin.parentesco === 'filho' && !x.p.especie);
  const netos = vivos.filter(x => x.vin.parentesco === 'neto' || x.vin.parentesco === 'bisneto');
  if (filhos.length >= 3 || netos.length >= 2) out.push({ peso: 70, texto: `Deixou ${filhos.length === 1 ? 'um filho' : `${filhos.length} filhos`}${netos.length ? ` e ${netos.length === 1 ? 'um neto' : `${netos.length} netos`}` : ''}${filhos.some(f => v.fatos[`guarda_neto_${f.p.id}`] !== undefined) ? ' — e criou netos como filhos' : ''}.` });
  const criouNetos = Object.keys(v.fatos).filter(k => k.startsWith('guarda_neto_')).length;
  if (criouNetos) out.push({ peso: 95, texto: `Criou ${criouNetos === 1 ? 'um neto' : `${criouNetos} netos`} em casa, depois de uma perda.` });

  // O que construiu: o negócio.
  const negocio = v.caminhos.negocio;
  const abertura = v.caminhos.marcas.find(m => m.tipo === 'negocio_aberto');
  if (negocio && abertura) {
    const durou = Math.round(((negocio.tFim ?? fim) - negocio.tInicio) / 12);
    if (durou >= 3) out.push({ peso: 60 + durou, texto: negocio.estado === 'fechado' ? `Teve ${negocio.nome} por ${anos(durou)}.` : `Tocou ${negocio.nome} por ${anos(durou)}${(negocio.unidades ?? 1) > 1 ? `, com ${negocio.unidades} frentes` : ''}.` });
  }

  // A vida pública.
  const pol = v.caminhos.politica;
  if (pol?.historico.length) {
    const eleito = pol.historico.filter(h => h.resultado === 'eleito');
    const derrotas = pol.historico.filter(h => h.resultado === 'derrotado').length;
    const cassado = pol.historico.some(h => h.resultado === 'cassado');
    if (eleito.length) {
      const cargos = [...new Set(eleito.map(h => nomeCargo(v, h.cargo)))];
      out.push({ peso: 85 + eleito.length * 5, texto: `${flex(g, 'Eleito', 'Eleita', 'Eleite')} ${eleito.length === 1 ? 'uma vez' : `${eleito.length} vezes`} (${listaNatural(cargos)}${eleito.length ? `, a primeira em ${anoDe(eleito[0].t)}` : ''})${derrotas ? `; perdeu ${derrotas === 1 ? 'uma eleição' : `${derrotas} eleições`}` : ''}${cassado ? '; um mandato terminou antes da hora' : ''}.` });
    } else if (derrotas) out.push({ peso: 55, texto: `Disputou ${derrotas === 1 ? 'uma eleição' : `${derrotas} eleições`} e não se elegeu.` });
    if ((pol.partidos ?? []).filter(x => x.tFim !== undefined).length) out.push({ peso: 20, texto: `Passou por ${(pol.partidos ?? []).length} partidos.` });
  }

  // O trabalho de uma vida (quando não foi o negócio).
  const hist = [...v.trabalho.historico, ...(v.trabalho.atual ? [{ ...v.trabalho.atual, tFim: fim, motivo: '' }] : [])];
  const porOcup = new Map<string, number>();
  for (const h of hist) porOcup.set(h.ocupacaoId, (porOcup.get(h.ocupacaoId) ?? 0) + (h.tFim - h.tInicio));
  const [oc, meses] = [...porOcup.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (oc && meses >= 120 && (!negocio || negocio.ocupacaoId !== oc)) {
    out.push({ peso: 50 + meses / 24, texto: `${anos(Math.round(meses / 12))} de trabalho como ${nomeOcupacaoId(v, oc)}.` });
  }

  // A casa própria e as mudanças.
  const casa = v.biografia.find(e => e.tema === 'casa' && /Comprou (a|o|uma|um) /.test(e.texto) && !/carro|moto|bicicleta/.test(e.texto));
  if (casa) out.push({ peso: 45, texto: `Comprou a casa própria em ${anoDe(casa.t)}.` });
  const mudancas = v.biografia.filter(e => e.tema === 'lugar' && /^Mudou-se/.test(e.texto)).length;
  if (mudancas >= 2) out.push({ peso: 30, texto: `Mudou de cidade ${mudancas} vezes; o fim foi em ${nomeLugar(v.moradia.municipioId)}.` });

  // As quedas.
  const j = v.justica;
  if (j?.antecedentes.some(a => a.desfecho === 'prisao')) {
    const a = j.antecedentes.filter(x => x.desfecho === 'prisao').reduce((s, x) => s + (x.anos ?? 1), 0);
    out.push({ peso: 100, texto: `Cumpriu ${anos(a)} de prisão.` });
  }
  if (v.fatos['viuvez'] !== undefined && !(maior?.x.romance?.fim === 'morte')) out.push({ peso: 60, texto: `Ficou ${flex(g, 'viúvo', 'viúva', 'viúve')} em ${anoDe(v.fatos['viuvez'])}.` });

  // Quem estava perto no fim.
  const casaNoFim = vivos.filter(x => x.vin.convivio.includes('casa') && !x.p.especie).map(x => x.p.nome);
  const pertos = vivos.filter(x => !x.p.especie && ['parceiro', 'filho', 'amigo_proximo', 'irmao'].includes(papelDe(x.p, x.vin)) && x.vin.proximidade >= 60).sort((a, b) => b.vin.proximidade - a.vin.proximidade).map(x => x.p.nome);
  const fimFrase = casaNoFim.length ? `No fim, em casa: ${listaNatural(casaNoFim.slice(0, 3))}.` : pertos.length ? `No fim, os mais próximos eram ${listaNatural(pertos.slice(0, 3))}.` : 'No fim, havia pouca gente por perto.';

  return [...out.sort((a, b) => b.peso - a.peso).slice(0, 6).map(f => f.texto), fimFrase];
}
