/**
 * VIDA 20 · O clube esportivo: comprar (todos os clubes em que se pode jogar, de cada país carregado) e administrar —
 * elenco, mercado, base, estádio, CT, caixa, dívidas, objetivo, conflito de interesses (em Patrimônio · Empresas).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { clubesAVenda, custoDaObra, dividendosPossiveis, mediaDoElenco, mercadoDoAno, valorDoJogador, type OqueClube20 } from '../../../motor/v20/clubes/clubes20';
import { carregarMundo } from '../../../motor/mundo/carregar';
import { nomeDoPais } from '../../../motor/mundo/registro';
import { anoDe } from '../../../motor/tempo';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import './clube20.css';
import { municipio } from '../../../motor/dados/lugares';
import { desenhoDoClube30, Escudo30 } from '../../v30/escudos/Escudo30';

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
                <div className="clube30__venda-nome"><Escudo30 nome={c.nome} tamanho={28} /><strong>{c.nome}</strong> <span className="clube20__meta">{DIV[c.divisao]} · {c.porte} · receita ~{dinheiroCurto(c.receita)}/ano · dívida {dinheiroCurto(c.divida)}</span></div>
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

/* ------------------------------------------------------------------ VIDA 30 · o clube como painel (não só texto) */

/** As cores do clube (as do escudo: `v30/escudos`), para o campo e as barras. */
function coresDoClube(nome: string): [string, string] { const d = desenhoDoClube30(nome); return [d[2], d[3]]; }
const Escudo = Escudo30;

function Medidor({ rotulo, valor, max = 100, texto, tom }: { rotulo: string; valor: number; max?: number; texto?: string; tom?: 'bom' | 'ruim' | 'atencao' }) {
  const pct = Math.max(2, Math.min(100, (valor / max) * 100));
  return (
    <div className="clube30__medidor">
      <span className="clube30__medidor-rot">{rotulo}</span>
      <span className="clube30__barra" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(valor)} aria-label={rotulo}><span className={tom ? `clube30__barra--${tom}` : undefined} style={{ width: `${pct}%` }} /></span>
      <strong>{texto ?? Math.round(valor)}</strong>
    </div>
  );
}

function Pips({ rotulo, n }: { rotulo: string; n: number }) {
  return (
    <div className="clube30__pips" aria-label={`${rotulo}: ${n} de 5`}>
      <span>{rotulo}</span>
      <span aria-hidden="true">{[1, 2, 3, 4, 5].map(k => <i key={k} className={k <= n ? 'clube30__pip clube30__pip--on' : 'clube30__pip'} />)}</span>
    </div>
  );
}

const SETOR: Record<string, { nome: string; y: number }> = { GOL: { nome: 'Goleiro', y: 88 }, DEF: { nome: 'Defesa', y: 68 }, MEI: { nome: 'Meio', y: 45 }, ATA: { nome: 'Ataque', y: 20 } };
const QUANTOS: Record<string, number> = { GOL: 1, DEF: 4, MEI: 4, ATA: 2 };

/** O time provável (os melhores de cada setor) desenhado no campo — as cores do clube, a força de cada um. */
function Campo({ c }: { c: NonNullable<Vida['clube20']> }) {
  const [a, b] = coresDoClube(c.nome);
  const titulares = (['GOL', 'DEF', 'MEI', 'ATA'] as const).flatMap(pos => [...c.elenco].filter(j => j.pos === pos).sort((x, y) => y.forca - x.forca).slice(0, QUANTOS[pos]).map((j, k, arr) => ({ j, x: ((k + 1) / (arr.length + 1)) * 100, y: SETOR[pos].y })));
  return (
    <figure className="clube30__campo">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="O time titular provável no campo">
        <rect x="0" y="0" width="100" height="100" fill="#2f7d46" />
        {[0, 1, 2, 3, 4].map(k => <rect key={k} x="0" y={k * 20} width="100" height="10" fill="#36894f" />)}
        <rect x="3" y="3" width="94" height="94" fill="none" stroke="#e8f5ea" strokeWidth="0.6" />
        <line x1="3" y1="50" x2="97" y2="50" stroke="#e8f5ea" strokeWidth="0.6" />
        <circle cx="50" cy="50" r="9" fill="none" stroke="#e8f5ea" strokeWidth="0.6" />
        <rect x="30" y="82" width="40" height="15" fill="none" stroke="#e8f5ea" strokeWidth="0.6" />
        <rect x="30" y="3" width="40" height="15" fill="none" stroke="#e8f5ea" strokeWidth="0.6" />
      </svg>
      {titulares.map(({ j, x, y }) => (
        <div key={j.id} className="clube30__jog" style={{ left: `${x}%`, top: `${y}%` }}>
          <span className="clube30__camisa" style={{ background: j.pos === 'GOL' ? b : a, color: j.pos === 'GOL' ? a : b, borderColor: b }}>{j.forca}</span>
          <span className="clube30__nome">{j.nome.split(' ').slice(-1)[0]}</span>
        </div>
      ))}
      <figcaption className="nota">O time provável: os melhores de cada setor (4-4-2). O número é a força.</figcaption>
    </figure>
  );
}

/** As temporadas como dono: a posição ano a ano (desenhada) e receita × despesa em barras. */
function Temporadas({ c }: { c: NonNullable<Vida['clube20']> }) {
  const hs = c.historico.slice(-10);
  if (!hs.length) return <p className="nota">A primeira temporada como dono aparece aqui quando fechar.</p>;
  const max = Math.max(...hs.flatMap(h => [h.receita, h.despesa]), 1);
  return (
    <div className="clube30__temporadas">
      <ul className="clube30__anos" aria-label="Temporadas como dono">
        {hs.map(h => (
          <li key={h.ano}>
            <span className="clube30__ano">{h.ano}</span>
            <span className="clube30__res">{DIV[h.divisao]}{h.posicao ? ` · ${h.posicao}º` : ''}{h.titulo ? ' · campeão' : h.acesso ? ' · subiu' : h.queda ? ' · caiu' : ''}</span>
            <span className="clube30__fin" aria-label={`Receita ${dinheiroCurto(h.receita)}, despesa ${dinheiroCurto(h.despesa)}`}>
              <i className="clube30__rec" style={{ width: `${(h.receita / max) * 100}%` }} />
              <i className="clube30__desp" style={{ width: `${(h.despesa / max) * 100}%` }} />
            </span>
            <span className={h.receita >= h.despesa ? 'clube30__saldo clube30__saldo--bom' : 'clube30__saldo clube30__saldo--ruim'}>{h.receita >= h.despesa ? '+' : '−'}{dinheiroCurto(Math.abs(h.receita - h.despesa))}</span>
          </li>
        ))}
      </ul>
      <p className="nota clube30__legenda"><i className="clube30__rec" /> receita <i className="clube30__desp" /> despesa</p>
    </div>
  );
}

function CartaoJogador({ j, ano, titularDaPos, children }: { j: { nome: string; pos: string; forca: number; potencial: number; tNasc: number; salario: number; contratoAte?: number; daBase?: boolean }; ano: number; titularDaPos?: number; children?: ReactNode }) {
  const i = ano - anoDe(j.tNasc);
  const delta = titularDaPos !== undefined ? j.forca - titularDaPos : undefined;
  return (
    <li className="clube30__cartao">
      <div className="clube30__cartao-topo">
        <span className="clube30__pos">{j.pos}</span>
        <strong>{j.nome}</strong>
        <span className="clube30__meta">{i} anos{j.daBase ? ' · da base' : ''}</span>
      </div>
      <div className="clube30__forca" aria-label={`Força ${j.forca}, potencial ${j.potencial}`}>
        <span className="clube30__forca-barra"><i style={{ width: `${j.forca}%` }} />{j.potencial > j.forca && <i className="clube30__pot" style={{ left: `${j.forca}%`, width: `${j.potencial - j.forca}%` }} />}</span>
        <span>{j.forca}{j.potencial > j.forca ? <small> → {j.potencial}</small> : null}</span>
        {delta !== undefined && <span className={delta > 0 ? 'clube30__delta clube30__delta--bom' : 'clube30__delta'}>{delta > 0 ? `+${delta}` : delta} vs. titular</span>}
      </div>
      <span className="clube30__meta">{dinheiroCurto(j.salario)}/ano{j.contratoAte ? ` · contrato até ${j.contratoAte}` : ''}</span>
      {children && <div className="clube20__botoes">{children}</div>}
    </li>
  );
}

function MeuClube({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const c = vida.clube20!;
  const ano = anoDe(vida.t);
  const [aba, setAba] = useState<'painel' | 'elenco' | 'mercado' | 'base' | 'clube'>('painel');
  const mercado = aba === 'mercado' ? mercadoDoAno(vida) : [];
  const h = c.historico[c.historico.length - 1];
  const folha = c.elenco.reduce((s, j) => s + j.salario, 0);
  const receita = h?.receita ?? 0;
  const pesoFolha = receita > 0 ? folha / receita : 0;
  const media = Math.round(mediaDoElenco(c));
  const melhorDa = (pos: string) => Math.max(0, ...c.elenco.filter(j => j.pos === pos).map(j => j.forca));
  const contratosAcabando = c.elenco.filter(j => j.contratoAte <= ano).length;
  const OBJ = { titulo: 'Brigar pelo título', acesso: 'Subir', meio: 'Meio de tabela', permanencia: 'Não cair' } as const;
  return (
    <section className="clube20 clube30" aria-labelledby="clube20-titulo">
      <header className="clube30__capa">
        <Escudo nome={c.nome} />
        <div>
          <h3 id="clube20-titulo" className="subtitulo">{c.nome}</h3>
          <p className="clube30__sub">{h ? DIV[h.divisao] : 'temporada em curso'} · {c.cidade ? `${municipio(c.cidade).nome} · ` : ''}você é dono desde {anoDe(c.desde)}</p>
          {c.objetivo && <span className="clube30__chip">Objetivo: {OBJ[c.objetivo]}</span>}
        </div>
      </header>
      {c.conflito && <p className="clube20__alerta" role="alert">{c.conflito} A federação exige a venda: só vender o clube está liberado.</p>}
      <div className="clube30__numeros">
        <div className="clube30__num"><span>Caixa</span><strong className={c.caixa < 0 ? 'clube30__ruim' : undefined}>{dinheiroCurto(c.caixa)}</strong></div>
        <div className="clube30__num"><span>Dívida</span><strong className={c.divida > receita ? 'clube30__ruim' : undefined}>{dinheiroCurto(c.divida)}</strong></div>
        <div className="clube30__num"><span>Valor do clube</span><strong>{dinheiroCurto(c.valor)}</strong></div>
        <div className="clube30__num"><span>Elenco</span><strong>{media}</strong><small>média · {c.elenco.length} jogadores</small></div>
      </div>
      <div className="clube20__abas" role="tablist">
        {(['painel', 'elenco', 'mercado', 'base', 'clube'] as const).map(x => <button key={x} type="button" role="tab" aria-selected={aba === x} className={`clube20__aba${aba === x ? ' clube20__aba--ativa' : ''}`} onClick={() => setAba(x)}>{{ painel: 'Painel', elenco: 'Elenco', mercado: 'Mercado', base: 'Base', clube: 'Estrutura e finanças' }[x]}</button>)}
      </div>
      {aba === 'painel' && (
        <div className="clube30__painel">
          <Campo c={c} />
          <div className="clube30__lado">
            <Medidor rotulo="Torcida" valor={c.torcida} />
            <Medidor rotulo="Nome do clube" valor={c.reputacao} />
            <Medidor rotulo="Folha / receita" valor={Math.min(100, pesoFolha * 100)} texto={receita ? `${Math.round(pesoFolha * 100)}%` : '—'} tom={pesoFolha > 0.8 ? 'ruim' : pesoFolha > 0.6 ? 'atencao' : 'bom'} />
            <Pips rotulo="Estádio" n={c.estadio} />
            <Pips rotulo="CT" n={c.ct} />
            <Pips rotulo="Base" n={c.base} />
            {(contratosAcabando > 0 || pesoFolha > 0.8 || c.caixa < 0) && (
              <ul className="clube30__alertas" aria-label="O que pede atenção">
                {contratosAcabando > 0 && <li>{contratosAcabando} contrato{contratosAcabando > 1 ? 's' : ''} terminando neste ano — renove ou deixe sair (Elenco).</li>}
                {pesoFolha > 0.8 && <li>A folha consome {Math.round(pesoFolha * 100)}% da receita: vender ou dispensar alivia; o caixa paga a diferença.</li>}
                {c.caixa < 0 && <li>Caixa negativo: um aporte ou uma venda evita juros.</li>}
              </ul>
            )}
          </div>
          <section className="clube30__bloco"><h4>Temporadas</h4><Temporadas c={c} /></section>
        </div>
      )}
      {aba === 'elenco' && (
        <ul className="clube30__cartoes">
          {[...c.elenco].sort((a, b) => 'GOLDEFMEIATA'.indexOf(a.pos) - 'GOLDEFMEIATA'.indexOf(b.pos) || b.forca - a.forca).map(j => (
            <CartaoJogador key={j.id} j={j} ano={ano}>
              <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'renovar', id: j.id })} ocultarBloqueado>Renovar</BotaoAcao>
              <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'vender', id: j.id })}>Vender · ~{dinheiroCurto(valorDoJogador(j, ano))}</BotaoAcao>
              <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'dispensar', id: j.id })}>Dispensar</BotaoAcao>
            </CartaoJogador>
          ))}
        </ul>
      )}
      {aba === 'mercado' && (
        <>
          <p className="nota">Jogadores de outros clubes do país, à venda neste ano. A comparação é com o melhor do seu elenco na mesma posição. O dinheiro sai do caixa do clube.</p>
          <ul className="clube30__cartoes">
            {mercado.map(j => (
              <CartaoJogador key={j.id} j={{ ...j, nome: `${j.nome} · ${j.clube}` }} ano={ano} titularDaPos={melhorDa(j.pos)}>
                <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'contratar', id: j.id })}>Contratar · {dinheiroCurto(j.preco)}</BotaoAcao>
              </CartaoJogador>
            ))}
          </ul>
        </>
      )}
      {aba === 'base' && (
        <>
          <div className="clube20__botoes" role="group" aria-label="Investimento na base">
            {([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={C({ op: 'base', nivel: n })} variante={c.investimentoBase === n ? 'principal' : 'secundario'}>{['Mínimo', 'Normal', 'Forte'][n]}</BotaoAcao>)}
          </div>
          <ul className="clube30__cartoes">
            {c.juniores.map(j => (
              <CartaoJogador key={j.id} j={j} ano={ano} titularDaPos={melhorDa(j.pos)}>
                <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'promover', id: j.id })}>Subir ao profissional</BotaoAcao>
              </CartaoJogador>
            ))}
          </ul>
        </>
      )}
      {aba === 'clube' && (
        <div className="clube20__clube">
          <div className="clube30__obras">
            {(['estadio', 'ct', 'base'] as const).map(q => (
              <div key={q} className="clube30__obra">
                <Pips rotulo={{ estadio: 'Estádio', ct: 'Centro de treinamento', base: 'Estrutura da base' }[q]} n={c[q]} />
                {c.obra?.qual === q ? <span className="nota">Em obra · pronta no fim de {c.obra.ate}</span> : <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'obra', qual: q })}>{c[q] >= 5 ? 'No máximo' : `Melhorar · ${dinheiroCurto(custoDaObra(c, q))}`}</BotaoAcao>}
              </div>
            ))}
          </div>
          <div className="clube20__botoes" role="group" aria-label="Objetivo da temporada">
            {(['titulo', 'acesso', 'meio', 'permanencia'] as const).map(o => <BotaoAcao key={o} vida={vida} agir={agir} acao={C({ op: 'objetivo', qual: o })} variante={c.objetivo === o ? 'principal' : 'secundario'}>{OBJ[o]}</BotaoAcao>)}
          </div>
          <div className="clube20__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'aportar', valor: Math.max(100000, Math.round(folha / 4 / 100000) * 100000) })}>Aportar {dinheiroCurto(Math.max(100000, Math.round(folha / 4 / 100000) * 100000))}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'dividendos' })}>Distribuir dividendos{dividendosPossiveis(c) > 0 ? ` · ${dinheiroCurto(dividendosPossiveis(c))}` : ''}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'vender_clube' })}>Vender o clube · ~{dinheiroCurto(Math.max(0, c.valor - c.divida))}</BotaoAcao>
          </div>
          <Temporadas c={c} />
          {c.vendas.length > 0 && <p className="nota">Vendas: {c.vendas.slice(0, 5).map(x => `${x.nome} → ${x.para} (${dinheiroCurto(x.valor)}, ${x.ano})`).join('; ')}.</p>}
        </div>
      )}
      <p className="nota">A temporada é a mesma da liga do país (a tabela, o acesso, a queda); a força do clube vem do elenco que você monta.</p>
    </section>
  );
}
