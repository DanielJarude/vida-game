/**
 * VIDA 32 · A organização de e-sports — e VIDA 33 · uma organização, vários jogos. Comprar uma que existe (cada uma na
 * região real dela) ou fundar a sua (o nome, o escudo, o jogo, a região do circuito, como entrar — do zero, comprando a
 * vaga na segunda divisão ou na liga principal — e o investimento). Como dono: o painel com a mesa, uma aba por line
 * (o time, o elenco, o mercado, o comando, as temporadas), os negócios (patrocínios, camisa e loja, identidade) e a
 * organização (conteúdo, entrar num jogo novo, aporte, venda). Montado em Vida · Patrimônio · Empresas · Esporte.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import {
  bonusDoTecnico31, contextoOrg33, custoDeFundar31, custoDoBootcamp31, forcaDoTime31, jogosDisponiveis31, maxElenco31, mediaDosTitulares31, mercadoOrg31,
  NOME_DIVISAO31, NOME_ENTRADA33, nomeDaFuncao31, nomeDaLiga31, orgsAVenda31, perfilDoJogadorOrg31, perfisDoElenco31, previaDaEntrada33, quimica31,
  QUEM_DA_MESA31, tecnicosOrg31, titulares31, titularesDoJogo31, valorDaLinha33, valorDoJogador31,
  type Entrada33, type JogadorDoMercado31, type JogadorOrg31, type LinhaOrg33, type OqueOrg31, type OrgEsports31, type PerfilOrg31
} from '../../../motor/v31/esports/org31';
import { ligaFechada33, multDaRegiao33, nomeDaRegiao33, regiaoBrasil33, regioesDoJogo33, regrasDaDivisao33, vagasDaRegiao33 } from '../../../motor/v31/esports/circuitos33';
import { JOGOS25, NOME_ATRIBUTO25, type JogoId } from '../../../motor/v25/esports/jogos25';
import type { Identidade33 } from '../../../motor/v33/dono/identidade33';
import { arquetipo, nomeDoArquetipo } from '../../../motor/sistemas/arquetipos';
import { anoDe } from '../../../motor/tempo';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { Escudo30, registrarIdentidades33 } from '../../v30/escudos/Escudo30';
import { EditorIdentidade33, identidadeInicial33 } from '../../v33/dono/EditorIdentidade33';
import { camisaDaIdentidade33, DesenhoCamisa33 } from '../../v33/dono/Camisa33';
import { Investimento33, PainelDono33 } from '../../v33/dono/PainelDono33';
import './org31.css';
import { coresDaOrg34 } from './coresOrgs34';
import { NavTime34, type ItemNav34 } from '../../v34/esporte/NavTime34';
import { Instalacoes34 } from '../../v34/instalacoes/Instalacoes34';
import { Academy35, Comodos35, ComprarLinha35, Equipamento35, Eventos35, Reformular35 } from '../../v35/org/Org35';

type Agir = (a: Acao) => boolean;
const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const nomeDoJogo = (j: JogoId, ano: number) => JOGOS25[j].nome(ano);
const SIGLA_JOGO: Record<JogoId, string> = { cs: 'CS', r6: 'R6', fortnite: 'FN', valorant: 'VAL', lol: 'LoL', rocket: 'RL' };

export default function OrgEsports31({ vida, agir }: { vida: Vida; agir: Agir }) {
  registrarIdentidades33(vida);
  return vida.orgEsports31 ? <MinhaOrg vida={vida} agir={agir} /> : <SemOrg vida={vida} agir={agir} />;
}

/* ------------------------------------------------------------------ o distintivo (as orgs do catálogo: um hexágono com as iniciais) */

const cores = coresDaOrg34;
/** Fundo claro (amarelo, verde-limão, branco) pede letra escura. */
function claro(cor: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(cor); if (!m) return false;
  const n = parseInt(m[1], 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
const iniciais = (nome: string) => nome.replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
export function Distintivo31({ nome, tamanho = 56, identidade }: { nome: string; tamanho?: number; identidade?: Identidade33 }) {
  if (identidade) return <Escudo30 nome={nome} identidade={identidade} tamanho={tamanho} />;
  const [a, b] = cores(nome);
  return (
    <svg className="org31__distintivo" width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-label={`Distintivo da ${nome}`}>
      <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill={a} stroke={b} strokeWidth="6" />
      <polygon points="50,18 80,35 80,65 50,82 20,65 20,35" fill="none" stroke={b} strokeWidth="2" opacity="0.6" />
      <text x="50" y="60" textAnchor="middle" fontSize={iniciais(nome).length > 1 ? 30 : 38} fontWeight="800" fill={claro(a) ? '#111111' : '#ffffff'} fontFamily="system-ui, sans-serif">{iniciais(nome)}</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ escolher jogo, região e como entrar (fundar ou line nova) */

function EscolhaDeEntrada({ vida, jogos, jogo, setJogo, regiao, setRegiao, modo, setModo, investimento, setInvestimento, extra = 0 }: {
  vida: Vida; jogos: JogoId[]; jogo: JogoId; setJogo: (j: JogoId) => void; regiao: string; setRegiao: (r: string) => void;
  modo: Entrada33; setModo: (m: Entrada33) => void; investimento: number; setInvestimento: (n: number) => void; extra?: number
}) {
  const ano = anoDe(vida.t);
  const regioes = regioesDoJogo33(jogo, ano);
  const p = previaDaEntrada33(jogo, regiao, modo, investimento, ano);
  const vagas = vagasDaRegiao33(jogo, regiao, ano);
  const regras = regrasDaDivisao33(jogo, regiao, p.divisao, ano);
  return (
    <>
      <div className="org31__form">
        <label>Jogo <select value={jogo} onChange={e => { const j = e.target.value as JogoId; setJogo(j); const rs = regioesDoJogo33(j, ano); if (!rs.some(r => r.id === regiao)) setRegiao(rs.find(r => r.id === regiaoBrasil33(j))?.id ?? rs[0]?.id ?? ''); }}>{jogos.map(j => <option key={j} value={j}>{nomeDoJogo(j, ano)}</option>)}</select></label>
        <label>Região do circuito <select value={regiao} onChange={e => setRegiao(e.target.value)}>{regioes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></label>
      </div>
      <ul className="org31__modos" role="radiogroup" aria-label="Como entrar">
        {(['base', 'acesso', 'elite'] as const).map(m => {
          const q = previaDaEntrada33(jogo, regiao, m, 0, ano);
          return (
            <li key={m}>
              <button type="button" role="radio" aria-checked={modo === m} className={`org31__modo${modo === m ? ' org31__modo--ativo' : ''}`} onClick={() => setModo(m)}>
                <strong>{NOME_ENTRADA33[m]}</strong>
                <span>{q.liga}</span>
                <span className="org31__meta">{m === 'base' ? 'estrutura e jogadores livres' : m === 'elite' && q.fechada ? 'liga fechada: a franquia de quem sai' : 'a vaga de uma equipe que sai'} · {dinheiroCurto(q.vaga)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Investimento33 valor={investimento} mudar={setInvestimento} conta={vida.financas.conta} base={p.vaga + extra}>
        <p className="nota">Três quartos em contratações e comissão, um quarto no caixa. A line nasce com força {Math.round(p.forca)} (o campo da {p.liga} é {Math.round(p.campo)}){p.tecnico ? `, técnico ${'★'.repeat(p.tecnico)}` : ', sem técnico'}{p.reserva ? ' e um reserva' : ''}. Folha estimada: {dinheiroCurto(p.folha)} por ano.</p>
      </Investimento33>
      <p className="nota">
        {nomeDaRegiao33(jogo, regiao)} · {p.liga}: {p.divisao === 4 ? (regras.caem ? `os ${regras.caem} últimos caem` : 'liga fechada, sem queda') : regras.acesso ? `liga de cima fechada; o campeão disputa a ${regras.acesso}` : regras.sobem ? `${regras.sobem === 1 ? 'o campeão sobe' : `os ${regras.sobem} primeiros sobem`}` : 'sem acesso direto'}.
        {vagas.length ? ` Da liga principal da região saem vagas para: ${vagas.map(x => `${x.nome}${x.vezes > 1 ? ` (${x.vezes}×)` : ''} — ${x.vagas ? `top ${x.vagas}` : ''}${x.div3 ? `${x.vagas ? '; ' : ''}o campeão da segunda divisão disputa vaga` : ''}`).join(' · ')}.` : ' Nesta época o jogo ainda não tem torneio internacional oficial.'}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ sem organização: fundar ou comprar */

const FAIXAS_PRECO = [{ id: 0, nome: 'Qualquer preço' }, { id: 1e6, nome: 'Até R$ 1 mi' }, { id: 5e6, nome: 'Até R$ 5 mi' }, { id: 20e6, nome: 'Até R$ 20 mi' }, { id: 60e6, nome: 'Até R$ 60 mi' }];

function SemOrg({ vida, agir }: { vida: Vida; agir: Agir }) {
  const ano = anoDe(vida.t);
  const jogos = jogosDisponiveis31(ano);
  const [aberto, setAberto] = useState(false);
  const [jogo, setJogo] = useState<JogoId | ''>('');
  const [regiao, setRegiao] = useState('');
  const [preco, setPreco] = useState(0);
  const [busca, setBusca] = useState('');
  const [mostrar, setMostrar] = useState(24);
  const todas = useMemo(() => (aberto ? orgsAVenda31(vida) : []), [aberto, vida]);
  const regioes = useMemo(() => [...new Map(todas.filter(o => !jogo || o.jogo === jogo).map(o => [nomeDaRegiao33(o.jogo, o.regiao), o.regiao])).entries()], [todas, jogo]);
  const lista = todas
    .filter(o => (!jogo || o.jogo === jogo) && (!regiao || nomeDaRegiao33(o.jogo, o.regiao) === regiao) && (!preco || o.preco <= preco) && (!busca || o.nome.toLowerCase().includes(busca.toLowerCase())))
    .sort((a, b) => b.divisao - a.divisao || b.valor - a.valor);
  if (!jogos.length) return <section className="org31"><h3 className="subtitulo">Organização de e-sports</h3><p className="nota">Ainda não há jogos com cenário competitivo nesta época.</p></section>;
  return (
    <section className="org31" aria-labelledby="org31-titulo">
      <h3 id="org31-titulo" className="subtitulo">Organização de e-sports</h3>
      <p className="nota">Funde a sua — escolha o escudo, o jogo, a região do circuito e como entrar — ou compre uma organização que já disputa as ligas. Depois, a mesma organização pode entrar em outros jogos, cada line na liga da sua região.</p>
      <Fundar vida={vida} agir={agir} jogos={jogos} />
      <button type="button" className="botao botao--secundario" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Fechar a lista' : 'Ver organizações à venda'}</button>
      {aberto && (
        <>
          <div className="org31__filtros">
            <label>Jogo <select value={jogo} onChange={e => { setJogo(e.target.value as JogoId | ''); setRegiao(''); setMostrar(24); }}><option value="">Todos</option>{jogos.map(j => <option key={j} value={j}>{nomeDoJogo(j, ano)}</option>)}</select></label>
            <label>Região <select value={regiao} onChange={e => { setRegiao(e.target.value); setMostrar(24); }}><option value="">Todas</option>{regioes.map(([n]) => <option key={n} value={n}>{n}</option>)}</select></label>
            <label>Preço <select value={preco} onChange={e => setPreco(Number(e.target.value))}>{FAIXAS_PRECO.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
            <label>Buscar <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="nome da organização" /></label>
          </div>
          <p className="nota">{lista.length} organizações com esses filtros (de {todas.length}).</p>
          <ul className="org31__grade">
            {lista.slice(0, mostrar).map(o => (
              <li key={`${o.jogo}:${o.regiao}:${o.nome}`} className="org31__venda">
                <div className="org31__venda-topo">
                  <Distintivo31 nome={o.nome} tamanho={44} />
                  <div className="org31__quem"><strong>{o.nome}</strong><span className="org31__meta">{nomeDoJogo(o.jogo, ano)} · {nomeDaRegiao33(o.jogo, o.regiao)}</span></div>
                  <span className="org31__selo">{SIGLA_JOGO[o.jogo]}</span>
                </div>
                <span className="org31__chip">{nomeDaLiga31(o, ano)}{o.real ? '' : ' · fictícia'}</span>
                <dl className="org31__mini">
                  <div><dt>Força</dt><dd>{o.forca}</dd></div>
                  <div><dt>Fãs</dt><dd>{o.fas}</dd></div>
                  <div><dt>Receita</dt><dd>{dinheiroCurto(o.receita)}</dd></div>
                  <div><dt>Dívida</dt><dd>{dinheiroCurto(o.divida)}</dd></div>
                </dl>
                <div className="org31__botoes">
                  <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'comprar', nome: o.nome, jogo: o.jogo, regiao: o.regiao })} variante="principal">Comprar · {dinheiroCurto(o.preco)}</BotaoAcao>
                  <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'comprar', nome: o.nome, jogo: o.jogo, regiao: o.regiao, financiar: true })}>Financiar · entrada {dinheiroCurto(Math.round(o.preco * 0.4))}</BotaoAcao>
                </div>
              </li>
            ))}
          </ul>
          {lista.length > mostrar && <button type="button" className="botao botao--discreto" onClick={() => setMostrar(m => m + 24)}>Mostrar mais ({lista.length - mostrar})</button>}
          <p className="nota">Os nomes reais vêm do catálogo do cenário, cada organização na região em que joga, e só aparecem nos anos em que ela existia no jogo. Jogadores, resultados e números são de jogo.</p>
        </>
      )}
    </section>
  );
}

function Fundar({ vida, agir, jogos }: { vida: Vida; agir: Agir; jogos: JogoId[] }) {
  const ano = anoDe(vida.t);
  const [nome, setNome] = useState('');
  const [jogo, setJogo] = useState<JogoId>(jogos.includes('valorant') ? 'valorant' : jogos[jogos.length - 1]);
  const [regiao, setRegiao] = useState(() => regioesDoJogo33(jogo, ano).find(r => r.id === regiaoBrasil33(jogo))?.id ?? regioesDoJogo33(jogo, ano)[0]?.id ?? 'br');
  const [modo, setModo] = useState<Entrada33>('base');
  const [investimento, setInvestimento] = useState(0);
  const [ident, setIdent] = useState<Identidade33 | null>(null);
  const nomeVisto = nome.trim() || 'Sua organização';
  const identidade = ident ?? identidadeInicial33(nomeVisto, true);
  const registro = custoDeFundar31(multDaRegiao33(jogo, regiao));
  const p = previaDaEntrada33(jogo, regiao, modo, investimento, ano);
  return (
    <section className="org31__bloco org31__fundar" aria-labelledby="org31-fundar">
      <h4 id="org31-fundar">Fundar uma organização</h4>
      <div className="org31__form">
        <label>Nome <input type="text" value={nome} maxLength={32} onChange={e => setNome(e.target.value)} placeholder="ex.: Carcará Esports" /></label>
        <Escudo30 nome={nomeVisto} identidade={identidade} tamanho={44} />
        <DesenhoCamisa33 camisa={camisaDaIdentidade33(identidade, true)} nome={nomeVisto} identidade={identidade} tamanho={56} />
      </div>
      <details className="org31__detalhe">
        <summary>Escudo, cores e identidade</summary>
        <EditorIdentidade33 nome={nomeVisto} ident={identidade} mudar={setIdent} tipo="esports" />
      </details>
      <EscolhaDeEntrada vida={vida} jogos={jogos} jogo={jogo} setJogo={setJogo} regiao={regiao} setRegiao={setRegiao} modo={modo} setModo={setModo} investimento={investimento} setInvestimento={setInvestimento} extra={registro} />
      <p className="nota">Registro da organização: {dinheiroCurto(registro)}. Total: {dinheiroCurto(registro + p.total)}.</p>
      <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'fundar', nome, jogo, regiao, modo, investimento, identidade })} variante="principal">Fundar{nome.trim() ? ` a ${nome.trim()}` : ''} · {dinheiroCurto(registro + p.total)}</BotaoAcao>
    </section>
  );
}

/* ------------------------------------------------------------------ dono */

function Medidor({ rotulo, valor, texto, tom }: { rotulo: string; valor: number; texto?: string; tom?: 'bom' | 'ruim' | 'atencao' }) {
  return (
    <div className="org31__medidor">
      <span>{rotulo}</span>
      <span className="org31__barra" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valor)} aria-label={rotulo}><i className={tom ? `org31__barra--${tom}` : undefined} style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} /></span>
      <strong>{texto ?? Math.round(valor)}</strong>
    </div>
  );
}
function Num({ rotulo, valor, extra, ruim }: { rotulo: string; valor: string; extra?: string; ruim?: boolean }) {
  return <div className="org31__num"><span>{rotulo}</span><strong className={ruim ? 'org31__ruim' : undefined}>{valor}</strong>{extra && <small>{extra}</small>}</div>;
}

type Aba = 'painel' | `linha:${JogoId}` | 'casa' | 'negocios' | 'organizacao';

function MinhaOrg({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const [aba, setAba] = useState<Aba>('painel');
  const titulos = o.linhas.reduce((s, l) => s + l.trofeus.length, 0);
  const abaValida: Aba = aba.startsWith('linha:') && !o.linhas.some(l => `linha:${l.jogo}` === aba) ? 'painel' : aba;
  // VIDA 34: as seções em grupos (visão geral · as lines · o negócio), cada line com a liga em que joga.
  const ABAS: ItemNav34<Aba>[] = [
    { id: 'painel', rotulo: o.mesa.length ? `Painel · ${o.mesa.length} na mesa` : 'Painel', grupo: 'Visão geral' },
    ...o.linhas.map(l => ({ id: `linha:${l.jogo}` as Aba, rotulo: `${SIGLA_JOGO[l.jogo]} · ${l.divisao === 2 ? NOME_DIVISAO31[2] : nomeDaLiga31(l, ano)}`, grupo: o.linhas.length > 1 ? 'As lines' : 'A line' })),
    { id: 'casa', rotulo: 'Gaming house', grupo: 'Negócio' }, { id: 'negocios', rotulo: 'Patrocínios, camisa e loja', grupo: 'Negócio' }, { id: 'organizacao', rotulo: 'Organização', grupo: 'Negócio' }
  ];
  const linha = abaValida.startsWith('linha:') ? o.linhas.find(l => `linha:${l.jogo}` === abaValida) : undefined;
  return (
    <section className="org31" aria-labelledby="org31-titulo">
      <header className="org31__capa">
        <Distintivo31 nome={o.nome} tamanho={64} identidade={o.identidade33} />
        <div>
          <h3 id="org31-titulo" className="subtitulo">{o.nome}</h3>
          <p className="org31__sub">{o.linhas.map(l => nomeDoJogo(l.jogo, ano)).join(' · ')} · {o.fundada ? 'fundada' : 'comprada'} por você em {anoDe(o.desde)}{o.identidade33?.apelido ? ` · "${o.identidade33.apelido}"` : ''}</p>
          <span className="org31__chip">{o.linhas.length} line{o.linhas.length > 1 ? 's' : ''}</span>{titulos > 0 && <span className="org31__chip org31__chip--ouro">{titulos} título{titulos > 1 ? 's' : ''}</span>}
        </div>
      </header>
      {abaValida === 'painel' ? (
        <div className="org31__numeros">
          <Num rotulo="Caixa" valor={dinheiroCurto(o.caixa)} />
          <Num rotulo="Dívida" valor={dinheiroCurto(o.divida)} ruim={o.divida > o.caixa && o.divida > 0} />
          <Num rotulo="Valor" valor={dinheiroCurto(o.valor)} />
          <Num rotulo="Fãs" valor={String(o.fas)} />
          <Num rotulo="Nome no cenário" valor={String(o.reputacao)} />
        </div>
      ) : (
        <p className="clube34__faixa"><span>Caixa <b className={o.caixa < 0 ? 'org31__ruim' : undefined}>{dinheiroCurto(o.caixa)}</b></span><span>Fãs <b>{o.fas}</b></span><span>Nome no cenário <b>{o.reputacao}</b></span></p>
      )}
      <NavTime34 rotulo={`A ${o.nome}`} atual={abaValida} mudar={setAba} itens={ABAS} />
      {abaValida === 'painel' && (
        <>
          <Mesa vida={vida} agir={agir} />
          <ul className="org31__linhas">
            {o.linhas.map(L => {
              const h = L.historico[L.historico.length - 1];
              return (
                <li key={L.jogo} className="org31__bloco org31__linha-resumo">
                  <h4><span className="org31__selo">{SIGLA_JOGO[L.jogo]}</span> {nomeDoJogo(L.jogo, ano)}</h4>
                  <p className="org31__meta">{nomeDaLiga31(L, ano)} · {nomeDaRegiao33(L.jogo, L.regiao)} · {NOME_DIVISAO31[L.divisao]}{ligaFechada33(L.jogo, L.regiao, ano) && L.divisao === 4 ? ' (franquia)' : ''}</p>
                  <Medidor rotulo="Força" valor={forcaDoTime31(o, L, ano)} />
                  <p className="nota">{h ? `${h.ano}: ${h.posicao}º de ${h.participantes}${h.titulo ? ' · campeã' : h.subiu ? ' · subiu' : h.caiu ? ' · caiu' : ''}${h.internacionais?.length ? ` · ${h.internacionais.map(i => `${i.colocacao}º no ${i.nome}`).join(', ')}` : h.mundial ? ` · ${h.mundial.colocacao}º no ${h.mundial.nome}` : ''}.` : 'A primeira temporada fecha na virada do ano.'}</p>
                  <button type="button" className="botao botao--secundario" onClick={() => setAba(`linha:${L.jogo}`)}>Abrir a line</button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {linha && <Linha key={linha.jogo} vida={vida} agir={agir} L={linha} />}
      {abaValida === 'casa' && <Instalacoes34 org vida={vida} agir={agir} nome={o.nome} identidade={o.identidade33} inst={o.instalacoes34} acao={sub => A({ op: 'dono', sub })} dados={{ tipo: 'org', nivel: Math.min(5, o.linhas.length + o.conteudo + (o.reputacao >= 60 ? 1 : 0)), pcs: o.linhas.reduce((n, l) => n + l.elenco.length, 0), conteudo: o.conteudo, trofeus: titulos, comodos: o.casa35 ?? [], setups: o.linhas.map(l => l.setup35) }} />}
      {abaValida === 'casa' && <Comodos35 vida={vida} agir={agir} />}
      {abaValida === 'negocios' && <PainelDono33 vida={vida} agir={agir} nome={o.nome} dono={o} ctx={contextoOrg33(vida)} acao={sub => A({ op: 'dono', sub })} anoInicio={anoDe(o.desde)} />}
      {abaValida === 'organizacao' && <Organizacao vida={vida} agir={agir} />}
    </section>
  );
}

/* ------------------------------------------------------------------ uma line */

type SubAba = 'time' | 'elenco' | 'mercado' | 'equipamento' | 'academy' | 'comando' | 'temporadas';

function Linha({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const [aba, setAba] = useState<SubAba>('time');
  const tit = titulares31(L, ano);
  const media = mediaDosTitulares31(L, ano);
  const forca = forcaDoTime31(o, L, ano);
  const quimica = quimica31(L, ano);
  const perfis = useMemo(() => perfisDoElenco31(L, ano), [L, ano]);
  const igl = L.elenco.find(j => j.id === L.igl);
  const vagas = vagasDaRegiao33(L.jogo, L.regiao, ano);
  const regras = regrasDaDivisao33(L.jogo, L.regiao, L.divisao, ano);
  const SUB: Record<SubAba, string> = { time: 'O time', elenco: `Elenco · ${L.elenco.length}/${maxElenco31(L.jogo, ano)}`, mercado: 'Mercado', equipamento: 'Equipamento', academy: L.academy35 ? `Academy · ${L.academy35.elenco.length}` : 'Academy', comando: 'Comando', temporadas: 'Temporadas e títulos' };
  return (
    <div className="org31__linha">
      <h4 className="org34__linha-cabeca"><span className="org31__selo">{SIGLA_JOGO[L.jogo]}</span> A line de {nomeDoJogo(L.jogo, ano)} <span className="org31__meta">{nomeDaLiga31(L, ano)} · {nomeDaRegiao33(L.jogo, L.regiao)}</span></h4>
      <div className="org31__numeros">
        <Num rotulo="Força da line" valor={String(Math.round(forca))} extra={`titulares ${Math.round(media)}`} />
        <Num rotulo="Química" valor={quimica > 0 ? `+${quimica}` : String(quimica)} ruim={quimica < 0} extra={igl ? `IGL: ${igl.nick}` : 'sem IGL escolhido'} />
        <Num rotulo="Técnico" valor={L.tecnico ? L.tecnico.nome.split(' ')[0] : 'Nenhum'} extra={L.tecnico ? `${'★'.repeat(L.tecnico.nivel)} · ${bonusDoTecnico31(L) >= 0 ? '+' : ''}${Math.round(bonusDoTecnico31(L) * 10) / 10}` : 'contrate em Comando'} />
        <Num rotulo="Liga" valor={nomeDaLiga31(L, ano)} extra={nomeDaRegiao33(L.jogo, L.regiao)} />
      </div>
      <NavTime34 sub rotulo={`A line de ${nomeDoJogo(L.jogo, ano)}`} atual={aba} mudar={setAba} itens={(Object.keys(SUB) as SubAba[]).map(x => ({ id: x, rotulo: SUB[x] }))} />
      {aba === 'time' && (
        <div className="org31__painel">
          <section className="org31__bloco" aria-label="O time titular">
            <h4>Os titulares</h4>
            <ul className="org31__line">
              {tit.map(j => <li key={j.id}><span className="org31__funcao">{nomeDaFuncao31(L.jogo, j.funcao)}</span><strong>{j.nick}</strong>{L.igl === j.id && <span className="org31__igl" title="IGL">IGL</span>}<span className="org31__f">{j.forca}</span></li>)}
            </ul>
            <p className="nota">{titularesDoJogo31(L.jogo, ano)} titulares e no máximo 1 reserva; o técnico fica de fora da line. {L.bootcamp === ano ? 'Bootcamp feito nesta temporada: +2 de força. ' : ''}{o.conteudo === 2 ? 'A casa de criadores tira 1 de força. ' : ''}</p>
          </section>
          <section className="org31__bloco" aria-label="O circuito">
            <h4>O circuito</h4>
            <p className="nota">{nomeDaLiga31(L, ano)} ({NOME_DIVISAO31[L.divisao].toLowerCase()} · {nomeDaRegiao33(L.jogo, L.regiao)}): {L.divisao === 4 ? (regras.caem ? `os ${regras.caem} últimos caem.` : 'liga fechada, sem queda.') : regras.acesso ? `a liga de cima é fechada; o campeão disputa a ${regras.acesso}.` : regras.sobem ? `${regras.sobem === 1 ? 'o campeão sobe' : `os ${regras.sobem} primeiros sobem`}${regras.caem ? `, os ${regras.caem} últimos caem` : ''}.` : 'sem acesso direto.'}</p>
            {vagas.length > 0 ? <ul className="org31__vagas">{vagas.map(x => <li key={x.nome}><strong>{x.nome}</strong>{x.vezes > 1 ? ` (${x.vezes} por ano)` : ''}: {x.vagas ? `top ${x.vagas} da liga principal` : ''}{x.div3 ? `${x.vagas ? '; ' : ''}o campeão da segunda divisão disputa vaga` : ''}</li>)}</ul> : <p className="nota">Nesta época o jogo não tem torneio internacional oficial.</p>}
            {L.divisao < 4 && <p className="nota">Os internacionais são para quem joga a liga principal{vagas.some(x => x.div3) ? ' (ou vence a segunda divisão e passa na classificatória)' : ''}.</p>}
          </section>
        </div>
      )}
      {aba === 'elenco' && <Elenco vida={vida} agir={agir} L={L} perfis={perfis} />}
      {aba === 'mercado' && <Mercado vida={vida} agir={agir} L={L} />}
      {aba === 'equipamento' && <Equipamento35 vida={vida} agir={agir} L={L} nomeOrg={o.nome} />}
      {aba === 'academy' && <Academy35 vida={vida} agir={agir} L={L} />}
      {aba === 'comando' && <Comando vida={vida} agir={agir} L={L} />}
      {aba === 'temporadas' && <Temporadas L={L} />}
    </div>
  );
}

function Cartao({ L, j, ano, perfil, titular, preco, origem, delta, alerta, children }: { L: LinhaOrg33; j: JogadorOrg31; ano: number; perfil?: PerfilOrg31; titular?: boolean; preco?: number; origem?: string; delta?: number; alerta?: string; children?: ReactNode }) {
  const principal = perfil?.perfil.principal;
  const genero = j.feminino ? 'feminino' : 'masculino';
  return (
    <li className={`org31__cartao${L.igl === j.id ? ' org31__cartao--igl' : ''}`}>
      <div className="org31__cartao-topo">
        <span className="org31__papel" title={nomeDaFuncao31(L.jogo, j.funcao)}>{nomeDaFuncao31(L.jogo, j.funcao).replace(/\s*\(.*\)/, '').slice(0, 10)}</span>
        <div className="org31__quem">
          <strong>{j.nick}{L.igl === j.id && <span className="org31__igl" title="IGL: faz as calls">IGL</span>}</strong>
          <span className="org31__meta">{j.nome} · {ano - anoDe(j.tNasc)} anos{titular !== undefined ? (titular ? ' · titular' : ' · reserva') : ''}{j.daAcademia ? ' · da academia' : ''}{origem ? ` · na ${origem}` : ''}</span>
        </div>
        <span className="org31__forca" aria-label={`Força ${j.forca}`}>{j.forca}</span>
      </div>
      <div className="org31__tipos">
        {principal ? <span className="org31__tipo" title={arquetipo(principal)?.sobre}>{nomeDoArquetipo(principal, genero)}</span> : <span className="org31__tipo org31__tipo--comum">Sem perfil marcante</span>}
        {perfil?.perfil.secundarios.map(x => <span key={x} className="org31__tipo org31__tipo--sec" title={arquetipo(x)?.sobre}>{nomeDoArquetipo(x, genero)}</span>)}
      </div>
      {perfil && <ul className="org31__atributos">{perfil.atributos.slice(0, 3).map(a => <li key={a.id}><span>{NOME_ATRIBUTO25[a.id]}</span><i style={{ width: `${a.valor}%` }} /><b>{a.valor}</b></li>)}</ul>}
      <div className="org31__pot">
        <span className="org31__pot-barra"><i style={{ width: `${j.forca}%` }} />{j.potencial > j.forca && <i className="org31__pot-mais" style={{ left: `${j.forca}%`, width: `${j.potencial - j.forca}%` }} />}</span>
        <small>{j.potencial > j.forca ? `potencial ${j.potencial}` : 'no auge'}</small>
        {delta !== undefined && <span className={delta > 0 ? 'org31__delta org31__delta--bom' : 'org31__delta'}>{delta > 0 ? `+${delta}` : delta} vs. titular da função</span>}
      </div>
      <span className="org31__meta">{dinheiroCurto(j.salario)}/ano · contrato até {j.contratoAte}{preco ? ` · multa ${dinheiroCurto(preco)}` : ''}</span>
      {alerta && <span className="org31__alerta">{alerta}</span>}
      {children && <div className="org31__botoes org31__botoes--mini">{children}</div>}
    </li>
  );
}

function Elenco({ vida, agir, L, perfis }: { vida: Vida; agir: Agir; L: LinhaOrg33; perfis: Map<string, PerfilOrg31> }) {
  const ano = anoDe(vida.t);
  const tit = new Set(titulares31(L, ano).map(j => j.id));
  const lista = [...L.elenco].sort((a, b) => Number(tit.has(b.id)) - Number(tit.has(a.id)) || b.forca - a.forca);
  const auge = JOGOS25[L.jogo].auge;
  const mult = multDaRegiao33(L.jogo, L.regiao);
  const j_ = L.jogo;
  return (
    <>
      <p className="nota">{titularesDoJogo31(L.jogo, ano)} titulares (o melhor de cada função entra primeiro) e no máximo 1 reserva — como nas lines de verdade. O tipo de jogador é o mesmo arquétipo do jogador de e-sports da vida; o vestiário que eles fazem é a química.</p>
      <ul className="org31__cartoes">
        {lista.map(j => (
          <Cartao key={j.id} L={L} j={j} ano={ano} perfil={perfis.get(j.id)} titular={tit.has(j.id)} alerta={j.contratoAte <= ano ? 'Contrato termina neste ano' : undefined}>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'renovar', id: j.id, jogo: j_ })} ocultarBloqueado>Renovar</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'igl', id: j.id, jogo: j_ })} ocultarBloqueado>Tornar IGL</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'vender_jogador', id: j.id, jogo: j_ })} ocultarBloqueado>Vender · ~{dinheiroCurto(valorDoJogador31(j, ano, mult, auge))}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'emprestar', id: j.id, jogo: j_ })} ocultarBloqueado>Emprestar</BotaoAcao>
            {L.academy35 && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'descer', id: j.id, jogo: j_ })} ocultarBloqueado>Descer à academy</BotaoAcao>}
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'dispensar', id: j.id, jogo: j_ })}>Dispensar</BotaoAcao>
          </Cartao>
        ))}
      </ul>
      {(L.emprestados35?.length ?? 0) > 0 && <p className="nota">Emprestados até o fim da temporada: {L.emprestados35!.map(e => `${e.jogador.nick} (na ${e.para})`).join('; ')}.</p>}
      <section className="org31__bloco" aria-labelledby="org31-academia">
        <h4 id="org31-academia">Peneira de talentos</h4>
        <div className="org31__botoes" role="group" aria-label="Nível da peneira">
          {([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={A({ op: 'academia', nivel: n, jogo: j_ })} variante={L.academiaNivel === n ? 'principal' : 'secundario'}>{['Sem peneira', 'Peneira básica', 'Peneira forte'][n]}</BotaoAcao>)}
        </div>
        {L.academiaNivel === 0 ? <p className="nota">Sem peneira, nenhum jovem é revelado. A peneira custa por ano e revela jogadores com potencial na virada — que podem subir para a line ou ir para a line academy (aba Academy).</p>
          : L.academia.length ? <ul className="org31__cartoes">{L.academia.map(j => <Cartao key={j.id} L={L} j={j} ano={ano} perfil={perfilDoJogadorOrg31(j, L.jogo, ano, { mediaDoTime: mediaDosTitulares31(L, ano) })}><BotaoAcao vida={vida} agir={agir} acao={A({ op: 'promover', id: j.id, jogo: j_ })}>Subir para a line</BotaoAcao>{L.academy35 && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'promover', id: j.id, jogo: j_, academy: true })} ocultarBloqueado>Para a academy</BotaoAcao>}</Cartao>)}</ul>
            : <p className="nota">Os primeiros jovens chegam na virada do ano.</p>}
      </section>
    </>
  );
}

const FAIXA: Record<JogadorDoMercado31['faixa'], string> = { reforco: 'Reforços', nivel: 'Do nível', aposta: 'Apostas', estrela: 'Estrela' };
function Mercado({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const ano = anoDe(vida.t);
  const [faixa, setFaixa] = useState<'' | JogadorDoMercado31['faixa']>('');
  const [funcao, setFuncao] = useState('');
  const [ordem, setOrdem] = useState<'forca' | 'preco' | 'potencial' | 'idade'>('forca');
  const mercado = mercadoOrg31(vida, L.jogo);
  const media = mediaDosTitulares31(L, ano);
  const tit = titulares31(L, ano);
  const titularDa = (f: string) => tit.find(j => j.funcao === f)?.forca ?? Math.min(...tit.map(j => j.forca));
  const lista = mercado.filter(j => (!faixa || j.faixa === faixa) && (!funcao || j.funcao === funcao))
    .sort((a, b) => (ordem === 'forca' ? b.forca - a.forca : ordem === 'preco' ? a.preco - b.preco : ordem === 'potencial' ? b.potencial - a.potencial : b.tNasc - a.tNasc));
  const cheia = L.elenco.length >= maxElenco31(L.jogo, ano);
  return (
    <>
      <p className="nota">Jogadores do cenário de {nomeDaRegiao33(L.jogo, L.regiao)} com a multa rescisória (sai do caixa da organização). {cheia ? 'A line está completa (titulares + 1 reserva): para contratar, dispense alguém antes.' : 'Os reforços estão acima do seu time; quanto maior o nome da organização e a divisão, mais alto o nível de quem aceita vir.'} O mercado muda a cada ano.</p>
      <div className="org31__filtros">
        <div className="escolha" role="group" aria-label="Faixa">
          <button type="button" className="chip" aria-pressed={!faixa} onClick={() => setFaixa('')}>Todos</button>
          {(Object.keys(FAIXA) as JogadorDoMercado31['faixa'][]).map(f => <button key={f} type="button" className="chip" aria-pressed={faixa === f} onClick={() => setFaixa(f)}>{FAIXA[f]}</button>)}
        </div>
        <label>Função <select value={funcao} onChange={e => setFuncao(e.target.value)}><option value="">Todas</option>{JOGOS25[L.jogo].funcoes.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
        <label>Ordenar <select value={ordem} onChange={e => setOrdem(e.target.value as typeof ordem)}><option value="forca">Força</option><option value="preco">Mais baratos</option><option value="potencial">Potencial</option><option value="idade">Mais novos</option></select></label>
      </div>
      <ul className="org31__cartoes">
        {lista.map(j => (
          <Cartao key={j.id} L={L} j={j} ano={ano} perfil={perfilDoJogadorOrg31(j, L.jogo, ano, { mediaDoTime: media })} preco={j.preco} origem={j.de} delta={j.forca - titularDa(j.funcao)}>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'contratar', id: j.id, jogo: L.jogo })}>Contratar · {dinheiroCurto(j.preco)}</BotaoAcao>
          </Cartao>
        ))}
        {!lista.length && <li className="nota">Ninguém no mercado com esse filtro.</li>}
      </ul>
    </>
  );
}

function Temporadas({ L }: { L: LinhaOrg33 }) {
  const hs = L.historico.slice(-12).reverse();
  const max = Math.max(1, ...hs.flatMap(h => [h.receita, h.despesa]));
  return (
    <div className="org31__temporadas">
      <section className="org31__bloco" aria-labelledby="org31-trofeus">
        <h4 id="org31-trofeus">Galeria de troféus</h4>
        {L.trofeus.length ? (
          <ul className="org31__trofeus">
            {[...L.trofeus].reverse().map((t, k) => <li key={k} className={t.tipo === 'mundial' ? 'org31__trofeu org31__trofeu--mundial' : 'org31__trofeu'}><span className="org31__taca" aria-hidden="true">★</span><strong>{t.nome}</strong><span className="org31__meta">{t.ano}</span></li>)}
          </ul>
        ) : <p className="nota">Nenhum título ainda. A liga se vence em primeiro; os internacionais são para quem termina nas vagas da liga principal.</p>}
      </section>
      <section className="org31__bloco" aria-labelledby="org31-temps">
        <h4 id="org31-temps">Temporadas (a line)</h4>
        {!hs.length && <p className="nota">A primeira temporada aparece aqui quando fechar.</p>}
        <ul className="org31__anos">
          {hs.map(h => (
            <li key={h.ano}>
              <span className="org31__ano">{h.ano}</span>
              <span className="org31__res">{h.posicao}º/{h.participantes} · {h.liga}{h.titulo ? ' · campeã' : h.subiu ? ' · subiu' : h.caiu ? ' · caiu' : ''}{h.acesso ? ` · ${h.acesso.nome}: ${h.acesso.venceu ? 'venceu' : 'perdeu'}` : ''}{h.internacionais?.length ? ` · ${h.internacionais.map(i => `${i.colocacao}º ${i.nome}`).join(', ')}` : h.mundial ? ` · ${h.mundial.colocacao}º no mundial` : ''}</span>
              <span className="org31__fin" aria-label={`Receita ${dinheiroCurto(h.receita)}, despesa ${dinheiroCurto(h.despesa)}`}><i className="org31__rec" style={{ width: `${(h.receita / max) * 100}%` }} /><i className="org31__desp" style={{ width: `${(h.despesa / max) * 100}%` }} /></span>
              <span className={h.receita >= h.despesa ? 'org31__saldo' : 'org31__saldo org31__ruim'}>{h.receita >= h.despesa ? '+' : '−'}{dinheiroCurto(Math.abs(h.receita - h.despesa))}</span>
            </li>
          ))}
        </ul>
        <p className="nota">Receita e despesa da line (prêmios, salários, operação). Patrocínios, loja, conteúdo e juros fecham na organização.</p>
        {L.vendas.length > 0 && <p className="nota">Vendas: {L.vendas.slice(0, 5).map(x => `${x.nome} → ${x.para} (${dinheiroCurto(x.valor)}, ${x.ano})`).join('; ')}.</p>}
      </section>
    </div>
  );
}

function Comando({ vida, agir, L }: { vida: Vida; agir: Agir; L: LinhaOrg33 }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const igl = L.elenco.find(j => j.id === L.igl);
  return (
    <div className="org31__comando">
      <section className="org31__bloco" aria-labelledby="org31-tecnico">
        <h4 id="org31-tecnico">O técnico (coach)</h4>
        <p className="nota">{L.tecnico ? `${L.tecnico.nome} comanda a line desde ${L.tecnico.desde}: soma ${Math.round(bonusDoTecnico31(L) * 10) / 10} na força e custa ${dinheiroCurto(L.tecnico.salario)} por ano.` : 'Sem técnico, os jogadores se organizam sozinhos (nada a mais na força, e os jovens evoluem menos).'}</p>
        <ul className="org31__ofertas">
          {tecnicosOrg31(vida, L.jogo).map((t, k) => (
            <li key={k} className="org31__oferta">
              <strong>{t.nome}</strong>
              <span className="org31__estrelas" aria-label={`Nível ${t.nivel} de 5`}>{'★'.repeat(t.nivel)}<i>{'★'.repeat(5 - t.nivel)}</i></span>
              <span className="org31__meta">{dinheiroCurto(t.salario)}/ano · {(t.nivel - 2) * 1.2 >= 0 ? '+' : ''}{Math.round((t.nivel - 2) * 12) / 10} na força</span>
              <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'tecnico', i: k, jogo: L.jogo })}>Contratar</BotaoAcao>
            </li>
          ))}
        </ul>
        {L.tecnico && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'demitir_tecnico', jogo: L.jogo })} variante="discreto">Demitir {L.tecnico.nome.split(' ')[0]} · multa {dinheiroCurto(Math.round(L.tecnico.salario * 0.5))}</BotaoAcao>}
      </section>
      <section className="org31__bloco" aria-labelledby="org31-igl">
        <h4 id="org31-igl">IGL e química</h4>
        <p className="nota">Química {quimica31(L, ano) > 0 ? '+' : ''}{quimica31(L, ano)} na força. {igl ? `${igl.nick} é o IGL: faz as calls dentro da partida.` : 'Sem IGL escolhido, o time joga sem voz (−0,6).'} O IGL se escolhe no Elenco — de preferência entre os titulares.</p>
      </section>
      <section className="org31__bloco" aria-labelledby="org31-boot">
        <h4 id="org31-boot">Bootcamp</h4>
        <p className="nota">Uma semana de treinos contra equipes de fora: +2 de força nesta temporada, o clima melhora e os jovens evoluem mais. Custa {dinheiroCurto(custoDoBootcamp31(L))}.</p>
        <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'bootcamp', jogo: L.jogo })}>{L.bootcamp === ano ? 'Bootcamp feito' : 'Levar a line ao bootcamp'}</BotaoAcao>
      </section>
      <Reformular35 vida={vida} agir={agir} L={L} />
      <section className="org31__bloco" aria-labelledby="org31-sair">
        <h4 id="org31-sair">Sair deste jogo</h4>
        <p className="nota">Vender a vaga e os contratos da line: o dinheiro vai para o caixa da organização.</p>
        <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'sair', jogo: L.jogo })} variante="perigo">Vender a line · ~{dinheiroCurto(valorDaLinha33(o, L, ano))}</BotaoAcao>
      </section>
    </div>
  );
}

function Organizacao({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const folha = o.linhas.reduce((s, l) => s + l.elenco.reduce((x, j) => x + j.salario, 0), 0);
  const aporte = Math.max(50000, Math.round(folha / 2 / 10000) * 10000);
  const livres = jogosDisponiveis31(ano).filter(j => !o.linhas.some(l => l.jogo === j));
  const [jogo, setJogo] = useState<JogoId>(livres[0] ?? 'cs');
  const [regiao, setRegiao] = useState(() => regioesDoJogo33(jogo, ano).find(r => r.id === regiaoBrasil33(jogo))?.id ?? regioesDoJogo33(jogo, ano)[0]?.id ?? 'br');
  const [modo, setModo] = useState<Entrada33>('base');
  const [investimento, setInvestimento] = useState(0);
  const p = livres.length ? previaDaEntrada33(jogo, regiao, modo, investimento, ano) : undefined;
  return (
    <div className="org31__comando">
      <section className="org31__bloco" aria-labelledby="org31-novo">
        <h4 id="org31-novo">Entrar em outro jogo</h4>
        {livres.length && p ? (
          <>
            <p className="nota">Uma organização pode ter uma line em cada jogo, cada uma na liga da sua região (a sua de LoL pode jogar o CBLOL e a de CS, o circuito europeu).</p>
            <EscolhaDeEntrada vida={vida} jogos={livres} jogo={jogo} setJogo={setJogo} regiao={regiao} setRegiao={setRegiao} modo={modo} setModo={setModo} investimento={investimento} setInvestimento={setInvestimento} />
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'entrar', jogo, regiao, modo, investimento })} variante="principal">Montar a line · {dinheiroCurto(p.total)}</BotaoAcao>
          </>
        ) : <p className="nota">A organização já tem line em todos os jogos com cenário nesta época.</p>}
      </section>
      <ComprarLinha35 vida={vida} agir={agir} />
      <Eventos35 vida={vida} agir={agir} />
      <section className="org31__bloco" aria-labelledby="org31-conteudo">
        <h4 id="org31-conteudo">Conteúdo e streaming</h4>
        <div className="org31__botoes" role="group" aria-label="Conteúdo">
          {([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={A({ op: 'conteudo', nivel: n })} variante={o.conteudo === n ? 'principal' : 'secundario'}>{['Só treino', 'Lives semanais', 'Casa de criadores'][n]}</BotaoAcao>)}
        </div>
        <p className="nota">Mais conteúdo traz receita e fãs; a casa de criadores tira horas de treino (−1 de força em todas as lines e evolução mais lenta).</p>
      </section>
      <section className="org31__bloco" aria-labelledby="org31-dono">
        <h4 id="org31-dono">Dinheiro do dono</h4>
        <div className="org31__botoes">
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'aportar', valor: aporte })}>Aportar {dinheiroCurto(aporte)}</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'vender_org' })} variante="perigo">Vender a organização · ~{dinheiroCurto(Math.max(0, o.valor + o.caixa - o.divida))}</BotaoAcao>
        </div>
        <p className="nota">O aporte paga primeiro as dívidas da organização. Na venda, você recebe o valor (todas as lines, a marca e os títulos) e o caixa, menos as dívidas.</p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ a mesa do dono */

function Mesa({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const hist = o.mesaHist.slice(0, 4);
  if (!o.mesa.length && !hist.length) return null;
  return (
    <section className="org31__mesa" aria-labelledby="org31-mesa">
      <h4 id="org31-mesa">Na mesa do dono{o.mesa.length ? <span className="org31__conta">{o.mesa.length}</span> : null}</h4>
      {!o.mesa.length && <p className="nota">Nenhum assunto esperando. Os da próxima temporada chegam na virada do ano.</p>}
      <ul className="org31__assuntos">
        {o.mesa.map(s => (
          <li key={s.id} className={`org31__assunto org31__assunto--${(QUEM_DA_MESA31[s.tipo] ?? 'Comunidade').normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase()}`}>
            <span className="org31__assunto-quem">{QUEM_DA_MESA31[s.tipo] ?? 'Comunidade'}{s.jogo ? ` · ${nomeDoJogo(s.jogo, ano)}` : ''}</span>
            <strong>{s.titulo}</strong>
            <p className="org31__assunto-texto">{s.texto}</p>
            <div className="org31__opcoes">
              {s.opcoes.map(op => (
                <div key={op.id} className="org31__opcao">
                  <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'responder', id: s.id, opcao: op.id })}>{op.texto}</BotaoAcao>
                  {op.dica && <span className="org31__dica">{op.dica}</span>}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {hist.length > 0 && (
        <details className="org31__hist">
          <summary>O que já se decidiu</summary>
          <ul>{hist.map((x, k) => <li key={k}><span className="org31__ano">{x.ano}</span> <strong>{x.titulo}</strong>{x.opcao ? ` — ${x.opcao}` : x.ignorado ? ' — sem resposta' : ''}: {x.texto}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
