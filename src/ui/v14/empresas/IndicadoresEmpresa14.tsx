/**
 * VIDA 14 — os números de uma empresa, organizados: primeiro o que é seu (a parte, quanto vale, quanto pôs, a
 * valorização, quanto um comprador paga hoje); depois o ano (faturamento, despesas, lucro, margem, crescimento); o balanço
 * (caixa, instalações, dívida, patrimônio líquido); a operação; e o porquê do valor. Sem gráfico de faturamento.
 * As contas vêm do motor (`motor/v14/empresas/empresas14`).
 */
import type { Empresa, Vida } from '../../../motor/tipos';
import { indicadoresDaEmpresa14, type Numero14 } from '../../../motor/v14/empresas/empresas14';
import { dinheiroCurto } from '../../leituraMaterial';
import './empresas14.css';

const sinal = (x: number) => `${x < 0 ? '− ' : ''}${dinheiroCurto(Math.abs(x))}`;
const pct = (x: number, comSinal = false) => `${comSinal && x > 0 ? '+' : x < 0 ? '−' : ''}${(Math.abs(x) * 100).toFixed(Math.abs(x) < 0.1 ? 1 : 0).replace('.', ',')}%`;

function valorDe(n: Numero14): string {
  if (n.tipo === 'dinheiro') return sinal(n.valor);
  if (n.tipo === 'pct') return pct(n.valor, /Crescimento/.test(n.rotulo));
  if (n.tipo === 'nota') return `${Math.round(n.valor)}/100`;
  return n.texto ?? String(n.valor);
}

function Grupo({ titulo, itens }: { titulo: string; itens: Numero14[] }) {
  if (!itens.length) return null;
  return (
    <div className="e14-grupo">
      <p className="e14-grupo__titulo">{titulo}</p>
      <dl className="e14-lista">
        {itens.map(n => (
          <div key={n.rotulo} className={`e14-linha${n.tom ? ` e14-linha--${n.tom}` : ''}`}>
            <dt>{n.rotulo}{n.dica ? <small>{n.dica}</small> : null}</dt>
            <dd>{valorDe(n)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function IndicadoresEmpresa14({ vida, e, titulo = true }: { vida: Vida; e: Empresa; titulo?: boolean }) {
  const x = indicadoresDaEmpresa14(vida, e);
  const s = x.sociedade;
  const tomV = s.valorizacao === undefined ? '' : s.valorizacao >= 0 ? ' e14-destaque__var--bom' : ' e14-destaque__var--ruim';
  return (
    <div className="e14">
      {titulo && x.ano ? <p className="e14-ano">Números de {x.ano}</p> : null}
      <div className="e14-destaque">
        <div className="e14-destaque__principal">
          <span className="e14-destaque__rotulo">{s.parte >= 1 ? 'A empresa é sua e vale' : `A sua parte (${Math.round(s.parte * 1000) / 10}%) vale`}</span>
          <strong className="e14-destaque__valor">{dinheiroCurto(s.valorDaParte)}</strong>
          {s.valorizacao !== undefined && <span className={`e14-destaque__var${tomV}`}>{pct(s.valorizacao, true)} sobre o que você pôs</span>}
        </div>
        <dl className="e14-destaque__lado">
          <div><dt>Você pôs</dt><dd>{dinheiroCurto(s.investido)}</dd></div>
          {s.parte < 1 && <div><dt>A empresa inteira</dt><dd>{dinheiroCurto(s.valorDaEmpresa)}</dd></div>}
          <div><dt>Se vender hoje</dt><dd>{dinheiroCurto(s.seVenderHoje)}</dd></div>
          {s.socio && <div><dt>Sócios</dt><dd className="e14-texto">{s.socio}</dd></div>}
        </dl>
      </div>
      <div className="e14-grupos">
        <Grupo titulo="O ano" itens={x.resultado} />
        <Grupo titulo="Balanço" itens={x.balanco} />
        <Grupo titulo="Operação" itens={x.operacao} />
      </div>
      <details className="detalhes e14-porque"><summary>Como o valor é calculado</summary><p className="nota">{x.porqueDoValor}</p></details>
    </div>
  );
}
