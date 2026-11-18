/**
 * VIDA 21 · O QUE VEIO DOS SERVIÇOS — os bens que vieram do crime, cada um com o que dá para fazer com ele: guardar,
 * usar (ou vestir: vai para a Aparência), vender (a quem compra, por quanto, com que risco — e quem ainda não negocia
 * com você) ou se livrar. Embaixo, o que já se vendeu, perdeu ou largou. O motor é `motor/v21/crime/espolio21`.
 */
import { useState } from 'react';
import { COMPRADORES21, LOCAIS21, type Comprador21 } from '../../../motor/dados21/crime/espolio21';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { anoDe } from '../../../motor/tempo';
import { bensIlicitos21, montarLote21, nomeNoMercado21, ofertas21, rotuloDaSaida21, saidas21, type EscolhaDoLote21 } from '../../../motor/v21/crime/espolio21';
import { NOME_DA_CATEGORIA21, type BemIlicito21 } from '../../../motor/dados21/crime/espolio21';
import './crime21.css';

const CALOR = (c: number) => (c >= 60 ? 'quente (procurado)' : c >= 30 ? 'morno' : 'frio');
const ESTADO: Record<BemIlicito21['estado'], string> = { escondido: 'guardado escondido', em_uso: 'em uso', no_guarda_roupa: 'no guarda-roupa' };
const DESFECHO = { vendido: 'vendido', apreendido: 'apreendido', recuperado: 'achado pela polícia', descartado: 'largado' } as const;

export function BensDoCrime({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const bens = bensIlicitos21(vida);
  const es = vida.espolio21;
  // VIDA 27 · §12: a seleção para vender vários de uma vez (só os ids que ainda existem contam).
  const [selecao, setSelecao] = useState<string[]>([]);
  const sel = selecao.filter(id => bens.some(b => b.id === id));
  const alternar = (id: string) => setSelecao(xs => (xs.includes(id) ? xs.filter(x => x !== id) : [...xs, id]));
  if (!bens.length && !es?.historico.length) return null;
  return (
    <section className="svivo-bloco esp21" aria-labelledby="titulo-esp21">
      <h3 id="titulo-esp21" className="svivo-bloco__titulo">O que veio dos serviços</h3>
      <p className="svivo-nota">
        Dinheiro em espécie já entrou no saldo. Os bens ficam com você até decidir. Nome no mercado paralelo: <strong>{Math.round(nomeNoMercado21(vida).valor)}</strong> (por {nomeNoMercado21(vida).porque})
        {' '}— o posto numa organização e o nome no crime da cidade contam; venda limpa faz subir e abre compradores que pagam melhor; venda que dá errado faz cair.
      </p>
      {bens.length > 1 && <VenderVarios vida={vida} agir={agir} selecao={sel} setSelecao={setSelecao} />}
      {bens.length > 0
        ? <ul className="esp21__lista">{bens.map(b => <Bem key={b.id} vida={vida} agir={agir} b={b} marcado={sel.includes(b.id)} alternar={bens.length > 1 ? () => alternar(b.id) : undefined} />)}</ul>
        : <p className="svivo-nota">Nada guardado agora.</p>}
      {!!es?.historico.length && (
        <details className="esp21__historico">
          <summary>O que já saiu ({es.historico.length})</summary>
          <ol className="sub-diario">
            {es.historico.slice(-10).reverse().map((h, k) => (
              <li key={k} className={h.desfecho === 'vendido' ? 'sub-diario--bom' : h.desfecho === 'descartado' ? '' : 'sub-diario--ruim'}>
                <span className="margem__ano">{anoDe(h.t)}</span> {h.nome}: {DESFECHO[h.desfecho]}{h.valor ? ` por ${dinheiroCurto(h.valor)}` : ''}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}

/** VIDA 27 · §12: vender vários — selecionar por tipo ou tudo, escolher o comprador, revisar e confirmar. */
function VenderVarios({ vida, agir, selecao, setSelecao }: { vida: Vida; agir: (a: Acao) => boolean; selecao: string[]; setSelecao: (f: (xs: string[]) => string[]) => void }) {
  const bens = bensIlicitos21(vida);
  const [escolha, setEscolha] = useState<EscolhaDoLote21>('melhor');
  const [revisando, setRevisando] = useState(false);
  const grupos = [...bens.reduce((m, b) => m.set(b.modelo, [...(m.get(b.modelo) ?? []), b]), new Map<string, BemIlicito21[]>()).values()].filter(g => g.length > 1);
  const vendaveis = montarLote21(vida, bens.map(b => b.id), 'melhor').itens.map(x => x.bemId);
  const lote = montarLote21(vida, selecao, escolha);
  const compradores = [...new Set(bens.flatMap(b => ofertas21(vida, b).map(o => o.comprador)))] as Comprador21[];
  const add = (ids: string[]) => setSelecao(xs => [...new Set([...xs, ...ids])]);
  return (
    <section className="esp21__lote" aria-labelledby="titulo-esp21-lote">
      <h4 id="titulo-esp21-lote" className="esp21__lote-titulo">Vender vários de uma vez</h4>
      <p className="svivo-nota">Marque os bens na lista (ou use os atalhos). Cada venda tem o risco dela; se uma der errado, a venda para e o resto fica com você.</p>
      <div className="grupo-acoes esp21__atalhos">
        <button type="button" className="botao botao--discreto" onClick={() => add(vendaveis)} disabled={!vendaveis.length}>Tudo o que tem comprador ({vendaveis.length})</button>
        {grupos.map(g => <button key={g[0].modelo} type="button" className="botao botao--discreto" onClick={() => add(g.map(b => b.id))}>Todos: {g[0].nome.toLowerCase()} ({g.length})</button>)}
        {selecao.length > 0 && <button type="button" className="botao botao--discreto" onClick={() => { setSelecao(() => []); setRevisando(false); }}>Limpar a seleção</button>}
      </div>
      <label className="esp21__escolha">
        <span>Para quem</span>
        <select value={escolha} onChange={e => { setEscolha(e.target.value as EscolhaDoLote21); setRevisando(false); }}>
          <option value="melhor">Quem paga mais por cada item</option>
          {compradores.map(c => <option key={c} value={c}>{COMPRADORES21[c].nome}</option>)}
        </select>
      </label>
      <p className="esp21__resumo" role="status" aria-live="polite">
        {selecao.length === 0 ? 'Nada selecionado.' : <>{selecao.length} selecionado{selecao.length === 1 ? '' : 's'} · vendem-se <strong>{lote.itens.length}</strong> por <strong>{dinheiroCurto(lote.total)}</strong>{lote.itens.length ? <> · chance de alguma dar errado: <strong>{Math.round(lote.riscoDeAlgo * 100)}%</strong></> : null}</>}
      </p>
      {lote.porComprador.length > 0 && (
        <ul className="esp21__grupos">{lote.porComprador.map(g => <li key={g.comprador}><strong>{g.nome}</strong>: {g.n} {g.n === 1 ? 'item' : 'itens'}, {dinheiroCurto(g.total)} (risco por venda até {Math.round(g.riscoMax * 100)}%)</li>)}</ul>
      )}
      {lote.fora.length > 0 && <p className="svivo-nota">Fora do lote: {lote.fora.map(f => `${f.nome.toLowerCase()} — ${f.motivo}`).join('; ')}</p>}
      {lote.itens.length > 0 && !revisando && <button type="button" className="botao botao--secundario" onClick={() => setRevisando(true)}>Revisar a venda</button>}
      {lote.itens.length > 0 && revisando && (
        <div className="esp21__revisao">
          <table className="esp21__tabela">
            <caption className="sr-only">O que será vendido, a quem e por quanto</caption>
            <thead><tr><th scope="col">Bem</th><th scope="col">Comprador</th><th scope="col">Preço</th><th scope="col">Risco</th></tr></thead>
            <tbody>{lote.itens.map(x => <tr key={x.bemId}><th scope="row">{x.nome}</th><td>{x.nomeComprador}</td><td>{dinheiroCurto(x.preco)}</td><td>{Math.round(x.risco * 100)}%</td></tr>)}</tbody>
            <tfoot><tr><th scope="row" colSpan={2}>Total</th><td>{dinheiroCurto(lote.total)}</td><td /></tr></tfoot>
          </table>
          <div className="grupo-acoes">
            <BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'espolio21_lote', bemIds: lote.itens.map(x => x.bemId), comprador: escolha }} aoAgir={() => { setSelecao(() => []); setRevisando(false); }}>{`Confirmar: vender ${lote.itens.length} por ${dinheiroCurto(lote.total)}`}</BotaoAcao>
            <button type="button" className="botao botao--discreto" onClick={() => setRevisando(false)}>Voltar</button>
          </div>
        </div>
      )}
    </section>
  );
}

function Bem({ vida, agir, b, marcado, alternar }: { vida: Vida; agir: (a: Acao) => boolean; b: BemIlicito21; marcado?: boolean; alternar?: () => void }) {
  const [vendendo, setVendendo] = useState(false);
  const ofertas = ofertas21(vida, b);
  const saidas = saidas21(b).filter(s => s !== 'vender');
  return (
    <li className={`esp21__bem${marcado ? ' esp21__bem--marcado' : ''}`} data-bem={b.modelo}>
      <p className="esp21__cabeca">
        {alternar && <label className="esp21__marca"><input type="checkbox" checked={!!marcado} onChange={alternar} /><span className="sr-only">Selecionar {b.nome.toLowerCase()} para vender</span></label>}
        <span className="esp21__nome">{b.nome}</span>
        <span className="esp21__selo">{NOME_DA_CATEGORIA21[b.categoria]}</span>
      </p>
      <dl className="esp21__dados">
        <div><dt>Vale no mercado</dt><dd>{dinheiroCurto(b.valor)}{b.conservacao ? ` (usado, ${b.conservacao >= 0.85 ? 'bom estado' : b.conservacao >= 0.7 ? 'com marcas de uso' : 'gasto'})` : ''}</dd></div>
        <div><dt>Situação</dt><dd>{ESTADO[b.estado]}</dd></div>
        <div><dt>Procura</dt><dd>{CALOR(b.calor)}{b.rastreavel ? ' · rastreável' : ''}</dd></div>
        <div><dt>Veio de</dt><dd>{b.local ? LOCAIS21[b.local].nome : b.origem}, {anoDe(b.t)}</dd></div>
      </dl>
      <div className="grupo-acoes">
        {saidas.map(s => <BotaoAcao key={s} vida={vida} acao={{ tipo: 'espolio21', oque: s, bemId: b.id }} agir={agir} variante="discreto" ocultarImpossivel>{rotuloDaSaida21(b, s)}</BotaoAcao>)}
        <button type="button" className="botao botao--secundario" aria-expanded={vendendo} onClick={() => setVendendo(x => !x)}>{vendendo ? 'Fechar as ofertas' : 'Ver quem compra'}</button>
      </div>
      {vendendo && (
        <ul className="esp21__ofertas" aria-label={`Quem compra ${b.nome.toLowerCase()}`}>
          {ofertas.map(o => (
            <li key={o.comprador} className={`esp21__oferta${o.liberado ? '' : ' esp21__oferta--fechada'}`}>
              <span className="esp21__comprador"><strong>{o.nome}</strong> — {o.descricao}</span>
              <span className="esp21__numeros">{o.liberado ? <>paga <strong>{dinheiroCurto(o.preco)}</strong> · risco de dar errado: <strong>{Math.round(o.risco * 100)}%</strong></> : o.motivo}</span>
              {o.liberado && <BotaoAcao vida={vida} acao={{ tipo: 'espolio21', oque: 'vender', bemId: b.id, comprador: o.comprador }} agir={agir} variante="secundario" semAviso>{`Vender para ${o.nome.toLowerCase()}`}</BotaoAcao>}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
