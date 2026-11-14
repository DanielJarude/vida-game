/**
 * VIDA 20 · O clube esportivo: comprar (todos os clubes em que se pode jogar, de cada país carregado) e administrar —
 * elenco, mercado, base, estádio, CT, caixa, dívidas, objetivo, conflito de interesses (em Patrimônio · Empresas).
 */
import { useEffect, useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { clubesAVenda, custoDaObra, dividendosPossiveis, mediaDoElenco, mercadoDoAno, valorDoJogador, type OqueClube20 } from '../../../motor/v20/clubes/clubes20';
import { carregarMundo } from '../../../motor/mundo/carregar';
import { nomeDoPais } from '../../../motor/mundo/registro';
import { anoDe } from '../../../motor/tempo';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import './clube20.css';

const C = (oque: OqueClube20): Acao => ({ tipo: 'clube20', oque } as Acao);
const DIV = ['', 'estadual/regional', 'acesso', '2ª divisão', 'elite'];

export function Clube20({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  return vida.clube20 ? <MeuClube vida={vida} agir={agir} /> : <ComprarClube vida={vida} agir={agir} />;
}
export default Clube20;

function ComprarClube({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [aberto, setAberto] = useState(false);
  const [pais, setPais] = useState('BR');
  const [busca, setBusca] = useState('');
  const [mundo, setMundo] = useState(false);
  useEffect(() => { if (aberto && !mundo) void carregarMundo().then(() => setMundo(true)); }, [aberto, mundo]);
  const todos = useMemo(() => (aberto ? clubesAVenda(vida) : []), [aberto, vida, mundo]);
  const paises = useMemo(() => [...new Set(todos.map(c => c.pais))], [todos]);
  const lista = todos.filter(c => c.pais === pais && (!busca || c.nome.toLowerCase().includes(busca.toLowerCase()))).sort((a, b) => b.divisao - a.divisao || b.valor - a.valor);
  return (
    <section className="clube20" aria-labelledby="clube20-titulo">
      <h3 id="clube20-titulo" className="subtitulo">Clube de futebol</h3>
      <p className="nota">Todo clube em que dá para jogar está à venda. O preço é o valor do clube menos as dívidas — que vêm junto. A compra pede dinheiro na conta (ou 40% de entrada e o resto financiado pelo banco).</p>
      <button type="button" className="botao botao--secundario" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Fechar' : 'Ver clubes à venda'}</button>
      {aberto && (
        <div className="clube20__venda">
          <div className="clube20__filtros">
            <label>País <select value={pais} onChange={e => setPais(e.target.value)}>{paises.map(p => <option key={p} value={p}>{nomeDoPais(p)}</option>)}</select></label>
            <label>Buscar <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="nome do clube" /></label>
          </div>
          <p className="nota">{todos.length} clubes em {paises.length} países · {lista.length} aqui.</p>
          <ul className="clube20__lista">
            {lista.map(c => (
              <li key={`${c.pais}:${c.nome}`} className="clube20__item">
                <div><strong>{c.nome}</strong> <span className="clube20__meta">{DIV[c.divisao]} · {c.porte} · receita ~{dinheiroCurto(c.receita)}/ano · dívida {dinheiroCurto(c.divida)}</span></div>
                <div className="clube20__botoes">
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'comprar', nome: c.nome, pais: c.pais })}>Comprar · {dinheiroCurto(c.preco)}</BotaoAcao>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'comprar', nome: c.nome, pais: c.pais, financiar: true })}>Financiado · entrada {dinheiroCurto(Math.round(c.preco * 0.4))}</BotaoAcao>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function MeuClube({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const c = vida.clube20!;
  const ano = anoDe(vida.t);
  const [aba, setAba] = useState<'elenco' | 'mercado' | 'base' | 'clube'>('elenco');
  const mercado = aba === 'mercado' ? mercadoDoAno(vida) : [];
  const h = c.historico[c.historico.length - 1];
  const folha = c.elenco.reduce((s, j) => s + j.salario, 0);
  const idadeJ = (tNasc: number) => ano - anoDe(tNasc);
  return (
    <section className="clube20" aria-labelledby="clube20-titulo">
      <h3 id="clube20-titulo" className="subtitulo">{c.nome} · você é dono desde {anoDe(c.desde)}</h3>
      {c.conflito && <p className="clube20__alerta" role="alert">{c.conflito} A federação exige a venda: só vender o clube está liberado.</p>}
      <dl className="clube20__ficha">
        <div><dt>Elenco</dt><dd>média {Math.round(mediaDoElenco(c))} · {c.elenco.length} jogadores</dd></div>
        <div><dt>Caixa</dt><dd>{dinheiroCurto(c.caixa)}</dd></div>
        <div><dt>Dívida</dt><dd>{dinheiroCurto(c.divida)}</dd></div>
        <div><dt>Folha</dt><dd>{dinheiroCurto(folha)}/ano</dd></div>
        <div><dt>Valor do clube</dt><dd>{dinheiroCurto(c.valor)}</dd></div>
        <div><dt>Torcida · nome</dt><dd>{c.torcida} · {c.reputacao}</dd></div>
        <div><dt>Estádio · CT · base</dt><dd>{c.estadio} · {c.ct} · {c.base} (de 5)</dd></div>
        {h && <div><dt>Última temporada</dt><dd>{h.ano}: {DIV[h.divisao]}{h.posicao ? `, ${h.posicao}º` : ''}{h.titulo ? ' · campeão' : h.acesso ? ' · subiu' : h.queda ? ' · caiu' : ''}</dd></div>}
      </dl>
      <div className="clube20__abas" role="tablist">
        {(['elenco', 'mercado', 'base', 'clube'] as const).map(x => <button key={x} type="button" role="tab" aria-selected={aba === x} className={`clube20__aba${aba === x ? ' clube20__aba--ativa' : ''}`} onClick={() => setAba(x)}>{{ elenco: 'Elenco', mercado: 'Mercado', base: 'Base', clube: 'Clube e finanças' }[x]}</button>)}
      </div>
      {aba === 'elenco' && (
        <ul className="clube20__lista">
          {[...c.elenco].sort((a, b) => 'GOLDEFMEIATA'.indexOf(a.pos) - 'GOLDEFMEIATA'.indexOf(b.pos) || b.forca - a.forca).map(j => (
            <li key={j.id} className="clube20__item">
              <div><strong>{j.pos}</strong> {j.nome} <span className="clube20__meta">{idadeJ(j.tNasc)} anos · força {j.forca} (até {j.potencial}) · {dinheiroCurto(j.salario)}/ano até {j.contratoAte}{j.daBase ? ' · da base' : ''}</span></div>
              <div className="clube20__botoes">
                <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'renovar', id: j.id })} ocultarBloqueado>Renovar</BotaoAcao>
                <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'vender', id: j.id })}>Vender · ~{dinheiroCurto(valorDoJogador(j, ano))}</BotaoAcao>
                <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'dispensar', id: j.id })}>Dispensar</BotaoAcao>
              </div>
            </li>
          ))}
        </ul>
      )}
      {aba === 'mercado' && (
        <>
          <p className="nota">Jogadores de outros clubes do país, à venda neste ano. Quem aceita vir depende da divisão e do nome do clube. O dinheiro sai do caixa do clube.</p>
          <ul className="clube20__lista">
            {mercado.map(j => (
              <li key={j.id} className="clube20__item">
                <div><strong>{j.pos}</strong> {j.nome} <span className="clube20__meta">{idadeJ(j.tNasc)} anos · força {j.forca} (até {j.potencial}) · do {j.clube} · salário {dinheiroCurto(j.salario)}/ano</span></div>
                <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'contratar', id: j.id })}>Contratar · {dinheiroCurto(j.preco)}</BotaoAcao>
              </li>
            ))}
          </ul>
        </>
      )}
      {aba === 'base' && (
        <>
          <div className="clube20__botoes" role="group" aria-label="Investimento na base">
            {([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={C({ op: 'base', nivel: n })} variante={c.investimentoBase === n ? 'principal' : 'secundario'}>{['Mínimo', 'Normal', 'Forte'][n]}</BotaoAcao>)}
          </div>
          <ul className="clube20__lista">
            {c.juniores.map(j => (
              <li key={j.id} className="clube20__item">
                <div><strong>{j.pos}</strong> {j.nome} <span className="clube20__meta">{idadeJ(j.tNasc)} anos · força {j.forca} · potencial {j.potencial}</span></div>
                <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'promover', id: j.id })}>Subir ao profissional</BotaoAcao>
              </li>
            ))}
          </ul>
        </>
      )}
      {aba === 'clube' && (
        <div className="clube20__clube">
          <div className="clube20__botoes">
            {(['estadio', 'ct', 'base'] as const).map(q => <BotaoAcao key={q} vida={vida} agir={agir} acao={C({ op: 'obra', qual: q })}>{{ estadio: 'Ampliar o estádio', ct: 'Melhorar o CT', base: 'Estrutura da base' }[q]} · {dinheiroCurto(custoDaObra(c, q))}</BotaoAcao>)}
          </div>
          {c.obra && <p className="nota">Obra em andamento: {c.obra.qual === 'estadio' ? 'estádio' : c.obra.qual === 'ct' ? 'centro de treinamento' : 'base'}, pronta no fim de {c.obra.ate}.</p>}
          <div className="clube20__botoes" role="group" aria-label="Objetivo da temporada">
            {(['titulo', 'acesso', 'meio', 'permanencia'] as const).map(o => <BotaoAcao key={o} vida={vida} agir={agir} acao={C({ op: 'objetivo', qual: o })} variante={c.objetivo === o ? 'principal' : 'secundario'}>{{ titulo: 'Brigar pelo título', acesso: 'Subir', meio: 'Meio de tabela', permanencia: 'Não cair' }[o]}</BotaoAcao>)}
          </div>
          <div className="clube20__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'aportar', valor: Math.max(100000, Math.round(folha / 4 / 100000) * 100000) })}>Aportar {dinheiroCurto(Math.max(100000, Math.round(folha / 4 / 100000) * 100000))}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'dividendos' })}>Distribuir dividendos{dividendosPossiveis(c) > 0 ? ` · ${dinheiroCurto(dividendosPossiveis(c))}` : ''}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'vender_clube' })}>Vender o clube · ~{dinheiroCurto(Math.max(0, c.valor - c.divida))}</BotaoAcao>
          </div>
          {c.historico.length > 0 && (
            <details className="clube20__historico">
              <summary>Temporadas como dono</summary>
              <table><thead><tr><th>Ano</th><th>Divisão</th><th>Pos.</th><th>Receita</th><th>Despesa</th></tr></thead>
                <tbody>{[...c.historico].reverse().map(x => <tr key={x.ano}><td>{x.ano}</td><td>{DIV[x.divisao]}</td><td>{x.posicao ?? '—'}{x.titulo ? ' 🏆' : x.acesso ? ' ↑' : x.queda ? ' ↓' : ''}</td><td>{dinheiroCurto(x.receita)}</td><td>{dinheiroCurto(x.despesa)}</td></tr>)}</tbody>
              </table>
            </details>
          )}
          {c.vendas.length > 0 && <p className="nota">Vendas: {c.vendas.slice(0, 5).map(x => `${x.nome} → ${x.para} (${dinheiroCurto(x.valor)}, ${x.ano})`).join('; ')}.</p>}
        </div>
      )}
      <p className="nota">A temporada é a mesma da liga do país (a tabela, o acesso, a queda); a força do clube vem do elenco que você monta.</p>
    </section>
  );
}
