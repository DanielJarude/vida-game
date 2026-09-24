/**
 * Quando as obrigações atrasam: consequências GRADUAIS, nunca saldo negativo
 * infinito e silencioso.
 *
 *   1–2 meses  — cobrança, estresse; ainda dá para pôr em dia.
 *   3+ meses   — é hora de decidir (renegociar, vender, apertar, pedir ajuda):
 *                a decisão `mat_atraso` abre sozinha.
 *   aluguel 4+ — ação de despejo: volta para a família, ou vai de favor.
 *   carro 5+   — busca e apreensão: o banco leva o veículo.
 *   casa 12+   — o banco retoma o imóvel e leiloa; o que sobrar volta.
 *
 * Financiamento não é "dívida ruim": é uma obrigação presa a um bem. Em dia,
 * é só a parcela da casa.
 */

import type { Divida, Vida } from '../tipos';
import { escrever, idade, lembrarCom, vinculosVivos } from '../nucleo';
import { dinheiro as fmt } from '../texto';
import { abalar } from './abalo';
import { voltarParaCasaDosPais } from './moradia';
import { mesesRestantes, parcelaPrice, rendaPropriaMensal } from './dinheiro';
import { valorDeVenda } from './veiculos';
import { valorDeVendaImovel } from './imoveis';
import { modeloMoradia } from '../dados/bens';
import { aluguelDe, ofertasDeImoveis } from './mercado';

export const dividaDoBem = (v: Vida, bemId: string) => v.financas.dividas.find(d => d.bemId === bemId);

export function processarObrigacoes(v: Vida): void {
  const f = v.financas;
  // Aluguel
  const ha = (desde: number | undefined, meses: number) => desde !== undefined && v.t - desde >= meses;
  if ((v.moradia.tipo === 'aluguel' || v.moradia.tipo === 'republica') && (v.moradia.atraso ?? 0) >= 4 && ha(v.moradia.atrasoDesde, 12)) despejo(v);
  // Morar de favor tem prazo: depois de uns anos, é preciso ir — para a família ou para o aluguel mais barato.
  if (v.moradia.tipo === 'cedida' && v.t - v.moradia.tInicio >= 36) fimDoFavor(v);
  for (const d of [...f.dividas]) {
    const atraso = d.atraso ?? 0;
    if (d.tipo === 'financiamento_veiculo' && atraso >= 5 && ha(d.atrasoDesde, 12)) buscaEApreensao(v, d);
    else if (d.tipo === 'financiamento_imovel' && atraso >= 12 && ha(d.atrasoDesde, 24)) retomada(v, d);
    else if ((d.tipo === 'emprestimo' || d.tipo === 'acordo' || d.tipo === 'fies') && atraso >= 6 && ha(d.atrasoDesde, 12)) emCobranca(v, d);
  }
}

/**
 * Empréstimo que atrasou seis meses vai para a cobrança: nome sujo, parcela
 * suspensa, juros de mora — e, como toda dívida em cobrança, caduca em cinco
 * anos se não for acertada. Nunca cresce sem limite.
 */
function emCobranca(v: Vida, d: Divida): void {
  d.tipo = 'cartao';
  d.parcela = 0;
  d.atraso = 0;
  d.atrasoDesde = undefined;
  d.jurosMes = 0.01;
  d.descricao = `Em cobrança: ${d.descricao.toLowerCase()}`;
  if (!v.financas.negativado) {
    v.financas.negativado = true;
    v.fatos['negativado_desde'] = v.t;
    v.fatos['ja_foi_negativado'] ??= v.t;
    escrever(v, { texto: 'As parcelas do empréstimo pararam de ser pagas e a dívida foi para a cobrança. O nome ficou sujo.', relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
  }
}

function despejo(v: Vida): void {
  const m = v.moradia;
  const devido = Math.round((m.atraso ?? 0) * m.aluguel);
  // A dívida do aluguel não some: vira cobrança.
  if (devido > 0) v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'emprestimo', saldo: devido, jurosMes: 0.01, parcela: Math.max(150, Math.round(devido / 24)), descricao: 'Acordo do aluguel atrasado', tInicio: v.t, prazo: 24 });
  m.atraso = 0;
  m.atrasoDesde = undefined;
  if (voltarParaCasaDosPais(v)) {
    escrever(v, { texto: 'O aluguel atrasado virou ação de despejo. As coisas couberam num carro emprestado.', relevancia: 'biografia', tema: 'casa', tom: 'ruim' });
  } else {
    const amigo = vinculosVivos(v).find(x => !x.vin.parentesco && (x.vin.estagio === 'amigo_proximo' || x.vin.estagio === 'amigo') && x.p.municipioId === m.municipioId);
    v.moradia = { tipo: 'cedida', municipioId: m.municipioId, aluguel: 0, padrao: 1, tInicio: v.t };
    escrever(v, {
      texto: amigo ? `Despejo. ${amigo.p.nome} ofereceu o sofá da sala "por uns dias", que viraram meses.` : 'Despejo. Sem ter para onde ir, foi dormir de favor num quartinho nos fundos da casa de um conhecido.',
      relevancia: 'marco', tema: 'casa', tom: 'ruim', pessoas: amigo ? [amigo.p.id] : []
    });
    if (amigo) lembrarCom(v, amigo.p.id, 'Abriu a casa quando você foi despejado.', 'apoio', 3);
  }
  abalar(v, 'o despejo', -8, 15);
}

function fimDoFavor(v: Vida): void {
  if (voltarParaCasaDosPais(v)) return;
  const barata = ofertasDeImoveis(v, 'aluguel').filter(o => o.modeloId !== 'republica' || idade(v) < 35).sort((a, b) => a.aluguel - b.aluguel)[0];
  const m = modeloMoradia(barata?.modeloId ?? 'casa_simples');
  v.moradia = { tipo: m.id === 'republica' ? 'republica' : 'aluguel', municipioId: v.moradia.municipioId, modeloId: m.id, aluguel: barata?.aluguel ?? aluguelDe(v, m, v.moradia.municipioId), padrao: m.padrao, tInicio: v.t, aceitaPet: barata?.aceitaPet ?? true, bairro: barata?.bairro };
  escrever(v, { texto: `O favor tinha prazo. Depois de três anos de favor, voltou a pagar aluguel: ${m.id === 'republica' ? 'um quarto numa república' : `${m.nome.startsWith('casa') || m.nome.startsWith('kitnet') ? 'uma' : 'um'} ${m.nome}`}${barata?.bairro ? ` ${barata.bairro}` : ''}.`, relevancia: 'cotidiano', tema: 'casa' });
}

function buscaEApreensao(v: Vida, d: Divida): void {
  const f = v.financas;
  const b = f.bens.find(x => x.id === d.bemId);
  f.bens = f.bens.filter(x => x.id !== d.bemId);
  const leilao = b && b.tipo === 'veiculo' ? Math.round(valorDeVenda(b) * 0.7) : 0;
  const resto = Math.max(0, d.saldo - leilao);
  f.dividas = f.dividas.filter(x => x.id !== d.id);
  if (resto > 0) f.dividas.push({ id: `d${v.seq++}`, tipo: 'emprestimo', saldo: resto, jurosMes: 0.015, parcela: Math.max(200, Math.round(resto / 36)), descricao: 'O que sobrou do financiamento do veículo', tInicio: v.t, prazo: 36 });
  escrever(v, { texto: `Com as parcelas atrasadas, o banco foi buscar ${b?.nome ? `o ${b.nome}` : 'o veículo'}.${resto > 0 ? ` O leilão não cobriu tudo: ficaram ${fmt(resto)} de dívida.` : ''}`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
  abalar(v, 'a perda do carro', -6, 10);
}

function retomada(v: Vida, d: Divida): void {
  const f = v.financas;
  const b = f.bens.find(x => x.id === d.bemId);
  const leilao = b && b.tipo === 'imovel' ? Math.round(valorDeVendaImovel(b) * 0.78) : 0;
  const sobra = leilao - d.saldo;
  f.bens = f.bens.filter(x => x.id !== d.bemId);
  f.dividas = f.dividas.filter(x => x.id !== d.id);
  if (sobra > 0) f.conta += sobra;
  else if (sobra < 0) f.dividas.push({ id: `d${v.seq++}`, tipo: 'emprestimo', saldo: -sobra, jurosMes: 0.012, parcela: Math.max(250, Math.round(-sobra / 48)), descricao: 'O que o leilão da casa não cobriu', tInicio: v.t, prazo: 48 });
  const morava = v.moradia.imovelId === d.bemId;
  if (morava) {
    if (!voltarParaCasaDosPais(v)) {
      const m = modeloMoradia('kitnet');
      v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: m.id, aluguel: aluguelDe(v, m, v.moradia.municipioId), padrao: m.padrao, tInicio: v.t, aceitaPet: true };
    }
  }
  escrever(v, { texto: `Um ano sem conseguir pagar as parcelas, e o banco retomou ${morava ? 'a casa' : 'o imóvel'}. Foi a leilão${sobra > 0 ? `; o que sobrou depois de pagar o banco, ${fmt(sobra)}, voltou para você` : ''}.`, relevancia: 'marco', tema: 'casa', tom: 'ruim' });
  abalar(v, 'a perda da casa', -14, 18);
}

/**
 * Renegociar um financiamento: o atraso entra no saldo, o prazo estica e a
 * parcela cai. Custa mais no total — e ajuda a atravessar.
 */
export function podeRenegociarFinanciamento(v: Vida, d: Divida | undefined): { ok: boolean; motivo?: string } {
  if (!d || (d.tipo !== 'financiamento_imovel' && d.tipo !== 'financiamento_veiculo')) return { ok: false, motivo: 'Não é um financiamento.' };
  if (idade(v) >= 75) return { ok: false, motivo: 'Nenhum banco estica o prazo nessa idade.' };
  if (v.fatos[`renegociou_${d.id}`] !== undefined && v.t - v.fatos[`renegociou_${d.id}`] < 60) return { ok: false, motivo: 'Já foi renegociado há pouco tempo.' };
  if (rendaPropriaMensal(v) <= 0) return { ok: false, motivo: 'Sem renda nenhuma, o banco não renegocia.' };
  return { ok: true };
}

export function renegociarFinanciamento(v: Vida, d: Divida): string {
  const antes = d.parcela;
  const restante = mesesRestantes(v, d);
  const novoPrazo = Math.min(d.tipo === 'financiamento_imovel' ? 420 : 72, restante + (d.tipo === 'financiamento_imovel' ? 72 : 24));
  d.saldo = Math.round(d.saldo * 1.02);
  d.parcela = Math.round(parcelaPrice(d.saldo, d.jurosMes, novoPrazo));
  d.prazo = novoPrazo;
  d.tInicio = v.t;
  d.atraso = 0;
  d.atrasoDesde = undefined;
  v.fatos[`renegociou_${d.id}`] = v.t;
  escrever(v, { texto: `Renegociou o ${d.tipo === 'financiamento_imovel' ? 'financiamento da casa' : 'financiamento do veículo'}: parcela de ${fmt(antes)} para ${fmt(d.parcela)}, mais anos pagando.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
  return `Acordo fechado: a parcela caiu para ${fmt(d.parcela)} e o prazo ficou mais longo. No fim, vai custar mais — mas cabe agora.`;
}
