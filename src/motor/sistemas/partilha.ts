/**
 * Casal e patrimônio: o que é de cada um e o que é de vocês.
 *
 * Simplificação documentada (não é direito de família): a união que durou —
 * casamento, ou morar junto por dois anos ou mais — segue a lógica da
 * comunhão parcial: o que o casal CONSTRUIU junto (o quanto o patrimônio
 * líquido cresceu desde que passaram a morar juntos) se divide ao meio na
 * separação. O que cada um tinha antes, e o que herdou, continua de cada um.
 *
 * A separação também muda a casa: o aluguel que cabia em duas rendas pode
 * não caber numa só; a casa comprada junto às vezes precisa ser vendida.
 */

import type { Heranca, Imovel, Pessoa, Vida } from '../tipos';
import { escrever, filhos, idadePessoa, lembrarCom } from '../nucleo';
import { dinheiro as fmt } from '../texto';
import { balanco, pagar, disponivel, rendaPropriaMensal } from './dinheiro';
import { voltarParaCasaDosPais } from './moradia';
import { valorDeVendaImovel } from './imoveis';
import { dividaDoBem } from './obrigacoes';
import { modeloMoradia } from '../dados/bens';
import { aluguelDe } from './mercado';

/** Marca o começo da vida material em comum (a primeira vez que passam a morar juntos). */
export function comecarVidaEmComum(v: Vida, p: Pessoa): void {
  const chave = `uniao_${p.id}`;
  if (v.fatos[chave] !== undefined) return;
  v.fatos[chave] = v.t;
  v.fatos[`patrimonio_uniao_${p.id}`] = Math.max(0, balanco(v).liquido - (v.fatos['herdado_total'] ?? 0));
}

/** Quanto o casal construiu junto até agora (a metade disso é da outra pessoa, numa separação). */
export function construidoJunto(v: Vida, p: Pessoa): number {
  const inicio = v.fatos[`patrimonio_uniao_${p.id}`];
  if (inicio === undefined) return 0;
  const herdadoDepois = (v.fatos['herdado_total'] ?? 0) - (v.fatos[`herdado_ate_uniao_${p.id}`] ?? 0);
  return Math.max(0, balanco(v).liquido - inicio - Math.max(0, herdadoDepois));
}

export const uniaoConta = (v: Vida, p: Pessoa, estagio: string) =>
  estagio === 'casamento' || (v.fatos[`uniao_${p.id}`] !== undefined && v.t - v.fatos[`uniao_${p.id}`] >= 24);

/**
 * Separação de quem morava junto: partilha, casa, filhos. Chamada com o
 * vínculo já como `ex`.
 */
export function separarVidaMaterial(v: Vida, p: Pessoa, estagio: string): void {
  const f = v.financas;
  const partes: string[] = [];
  if (uniaoConta(v, p, estagio)) {
    const metade = Math.round(construidoJunto(v, p) / 2);
    if (metade > 1000) {
      let falta = metade;
      const casa = f.bens.find((b): b is Imovel => b.tipo === 'imovel' && b.id === v.moradia.imovelId);
      // Primeiro o dinheiro; se não der, a casa de vocês vai à venda.
      const livre = disponivel(v);
      if (livre >= falta) { pagar(v, falta); falta = 0; }
      else if (casa && (casa.dono === 'casal' || casa.tCompra >= (v.fatos[`uniao_${p.id}`] ?? Infinity))) {
        const divida = dividaDoBem(v, casa.id);
        const liquido = valorDeVendaImovel(casa) - (divida?.saldo ?? 0);
        f.bens = f.bens.filter(b => b.id !== casa.id);
        if (divida) f.dividas = f.dividas.filter(d => d.id !== divida.id);
        f.conta += liquido;
        partes.push('a casa foi vendida');
        pagar(v, falta);
        falta = 0;
        v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_1q', aluguel: aluguelDe(v, modeloMoradia('apto_1q'), v.moradia.municipioId), padrao: 3, tInicio: v.t, aceitaPet: true };
      } else {
        pagar(v, Math.min(falta, livre));
        const resto = falta - Math.min(falta, livre);
        if (resto > 0) f.dividas.push({ id: `d${v.seq++}`, tipo: 'acordo', saldo: resto, jurosMes: 0.005, parcela: Math.max(300, Math.round(resto / 60)), descricao: `Parte de ${p.nome} na partilha`, tInicio: v.t, prazo: 60 });
        falta = 0;
      }
      partes.unshift(`${fmt(metade)} ficaram com ${p.nome}, a metade do que construíram`);
      lembrarCom(v, p.id, `Dividiram o que construíram juntos: ${fmt(metade)} para cada lado.`, 'conflito', 2);
    }
  }
  // A casa que cabia em duas rendas pode não caber numa só.
  const m = v.moradia;
  const renda = rendaPropriaMensal(v);
  if ((m.tipo === 'aluguel') && m.aluguel > Math.max(1, renda) * 0.45) {
    const comFilhos = filhos(v).some(fl => idadePessoa(v, fl) < 18 && v.vinculos[fl.id]?.convivio.includes('casa'));
    const idadeEu = Math.floor((v.t - v.eu.tNasc) / 12);
    if (idadeEu < 35 && !comFilhos && voltarParaCasaDosPais(v)) partes.push('você voltou para a casa da família');
    else {
      const menor = modeloMoradia(comFilhos ? 'apto_2q' : renda < 2500 ? 'kitnet' : 'apto_1q');
      v.moradia = { tipo: 'aluguel', municipioId: m.municipioId, modeloId: menor.id, aluguel: aluguelDe(v, menor, m.municipioId), padrao: menor.padrao, tInicio: v.t, aceitaPet: true };
      partes.push(`o aluguel não cabia numa renda só: mudou para ${menor.nome.startsWith('casa') ? 'uma' : 'um'} ${menor.nome}`);
    }
  }
  if (partes.length) escrever(v, { texto: `A separação dividiu também a vida material: ${partes.join('; ')}.`, relevancia: 'biografia', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
}

/**
 * O que fica quando a pessoa morre (simplificado, sem direito sucessório
 * completo): as dívidas são pagas com o que havia — nunca passam para os
 * herdeiros. Do que sobra, o cônjuge (ou quem morava junto há anos) fica com
 * a sua metade do que construíram juntos; o restante se divide igualmente
 * entre o cônjuge e os filhos vivos (netos no lugar de um filho que já se
 * foi). Sem cônjuge nem descendentes, vai para os pais ou irmãos.
 */
export function calcularHeranca(v: Vida): Heranca {
  const b = balanco(v);
  const liquido = Math.max(0, b.liquido);
  const bens = v.financas.bens.map(x => x.nome + (x.tipo === 'imovel' && x.municipioId !== v.moradia.municipioId ? ` em ${x.municipioId.split('-')[0].replace(/(^|\s)\S/g, s => s.toUpperCase())}` : ''));
  const partes: Heranca['partes'] = [];
  const par = Object.values(v.vinculos).find(x => x.romance && (x.romance.estagio === 'casamento' || (x.romance.estagio === 'morando_junto' && uniaoConta(v, v.pessoas[x.pessoaId], 'morando_junto'))) && v.pessoas[x.pessoaId]?.vivo);
  const conjuge = par ? v.pessoas[par.pessoaId] : undefined;
  let resto = liquido;
  if (conjuge) {
    const meacao = Math.min(resto, Math.round(construidoJunto(v, conjuge) / 2));
    if (meacao > 0) partes.push({ pessoaId: conjuge.id, valor: meacao, papel: 'conjuge', meacao: true });
    resto -= meacao;
  }
  const herdeiros: { id: string; papel: Heranca['partes'][number]['papel'] }[] = [];
  const seus = Object.values(v.vinculos).filter(x => x.parentesco === 'filho').map(x => v.pessoas[x.pessoaId]).filter(Boolean);
  for (const fl of seus) {
    if (fl.vivo) herdeiros.push({ id: fl.id, papel: 'filho' });
    else {
      const netos = Object.values(v.pessoas).filter(n => n.vivo && n.genitores?.includes(fl.id));
      for (const n of netos) herdeiros.push({ id: n.id, papel: 'neto' });
    }
  }
  if (conjuge && herdeiros.length) herdeiros.push({ id: conjuge.id, papel: 'conjuge' });
  if (!herdeiros.length) {
    if (conjuge) herdeiros.push({ id: conjuge.id, papel: 'conjuge' });
    else for (const x of Object.values(v.vinculos)) {
      const p = v.pessoas[x.pessoaId];
      if (p?.vivo && !p.especie && (x.parentesco === 'mae' || x.parentesco === 'pai' || x.parentesco === 'irmao')) herdeiros.push({ id: p.id, papel: 'outro' });
    }
  }
  if (herdeiros.length && resto > 0) {
    const cada = Math.round(resto / herdeiros.length);
    for (const h of herdeiros) {
      const ja = partes.find(x => x.pessoaId === h.id);
      if (ja) ja.valor += cada;
      else partes.push({ pessoaId: h.id, valor: cada, papel: h.papel });
    }
  }
  return { liquido, partes, bens, dividas: b.obrigacoes };
}
