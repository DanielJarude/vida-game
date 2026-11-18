/**
 * VIDA 21 · O QUE VEIO DOS SERVIÇOS — os bens que vieram do crime, cada um com o que dá para fazer com ele: guardar,
 * usar (ou vestir: vai para a Aparência), vender (a quem compra, por quanto, com que risco — e quem ainda não negocia
 * com você) ou se livrar. Embaixo, o que já se vendeu, perdeu ou largou. O motor é `motor/v21/crime/espolio21`.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { anoDe } from '../../../motor/tempo';
import { bensIlicitos21, nomeNoMercado21, ofertas21, rotuloDaSaida21, saidas21 } from '../../../motor/v21/crime/espolio21';
import { NOME_DA_CATEGORIA21, type BemIlicito21 } from '../../../motor/dados21/crime/espolio21';
import './crime21.css';

const CALOR = (c: number) => (c >= 60 ? 'quente (procurado)' : c >= 30 ? 'morno' : 'frio');
const ESTADO: Record<BemIlicito21['estado'], string> = { escondido: 'guardado escondido', em_uso: 'em uso', no_guarda_roupa: 'no guarda-roupa' };
const DESFECHO = { vendido: 'vendido', apreendido: 'apreendido', recuperado: 'achado pela polícia', descartado: 'largado' } as const;

export function BensDoCrime({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const bens = bensIlicitos21(vida);
  const es = vida.espolio21;
  if (!bens.length && !es?.historico.length) return null;
  return (
    <section className="svivo-bloco esp21" aria-labelledby="titulo-esp21">
      <h3 id="titulo-esp21" className="svivo-bloco__titulo">O que veio dos serviços</h3>
      <p className="svivo-nota">
        Dinheiro em espécie já entrou no saldo. Os bens ficam com você até decidir. Nome no mercado paralelo: <strong>{Math.round(nomeNoMercado21(vida).valor)}</strong> (por {nomeNoMercado21(vida).porque})
        {' '}— o posto numa organização e o nome no crime da cidade contam; venda limpa faz subir e abre compradores que pagam melhor; venda que dá errado faz cair.
      </p>
      {bens.length > 0
        ? <ul className="esp21__lista">{bens.map(b => <Bem key={b.id} vida={vida} agir={agir} b={b} />)}</ul>
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

function Bem({ vida, agir, b }: { vida: Vida; agir: (a: Acao) => boolean; b: BemIlicito21 }) {
  const [vendendo, setVendendo] = useState(false);
  const ofertas = ofertas21(vida, b);
  const saidas = saidas21(b).filter(s => s !== 'vender');
  return (
    <li className="esp21__bem" data-bem={b.modelo}>
      <p className="esp21__cabeca">
        <span className="esp21__nome">{b.nome}</span>
        <span className="esp21__selo">{NOME_DA_CATEGORIA21[b.categoria]}</span>
      </p>
      <dl className="esp21__dados">
        <div><dt>Vale no mercado</dt><dd>{dinheiroCurto(b.valor)}</dd></div>
        <div><dt>Situação</dt><dd>{ESTADO[b.estado]}</dd></div>
        <div><dt>Procura</dt><dd>{CALOR(b.calor)}{b.rastreavel ? ' · rastreável' : ''}</dd></div>
        <div><dt>Veio de</dt><dd>{b.origem}, {anoDe(b.t)}</dd></div>
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
