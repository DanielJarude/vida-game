/**
 * VIDA 32 · A organização de e-sports: comprar uma que existe (as do catálogo de cada jogo, nos anos certos, e outras
 * fictícias por região) ou fundar uma do zero — e dirigi-la: painel, elenco (função, arquétipo, atributos), mercado,
 * temporadas e títulos, comando e negócios, e a mesa do dono. Montado em Vida · Patrimônio · Empresas.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import {
  bonusDoTecnico31, custoDeFundar31, custoDoBootcamp31, forcaDoTime31, jogosDisponiveis31, mediaDosTitulares31, mercadoOrg31,
  nomeDaFuncao31, nomeDaLiga31, nomeDoMundial31, NOME_DIVISAO31, NOME_REGIAO31, orgsAVenda31, patrociniosOrg31, perfilDoJogadorOrg31,
  perfisDoElenco31, quimica31, QUEM_DA_MESA31, tecnicosOrg31, titulares31, valorDoJogador31,
  type JogadorDoMercado31, type JogadorOrg31, type OqueOrg31, type OrgEsports31, type PerfilOrg31, type Regiao31
} from '../../../motor/v31/esports/org31';
import { JOGOS25, NOME_ATRIBUTO25, type JogoId } from '../../../motor/v25/esports/jogos25';
import { arquetipo, nomeDoArquetipo } from '../../../motor/sistemas/arquetipos';
import { anoDe } from '../../../motor/tempo';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import './org31.css';

type Agir = (a: Acao) => boolean;
const A = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const nomeDoJogo = (j: JogoId, ano: number) => JOGOS25[j].nome(ano);
const SIGLA_JOGO: Record<JogoId, string> = { cs: 'CS', r6: 'R6', fortnite: 'FN', valorant: 'VAL', lol: 'LoL', rocket: 'RL' };

export default function OrgEsports31({ vida, agir }: { vida: Vida; agir: Agir }) {
  return vida.orgEsports31 ? <MinhaOrg vida={vida} agir={agir} /> : <SemOrg vida={vida} agir={agir} />;
}

/* ------------------------------------------------------------------ o distintivo (sem logotipo: um hexágono com as iniciais) */

function cores(nome: string): [string, string] {
  let h = 0; for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = h % 360, b = (a + 140 + (h >> 9) % 80) % 360;
  return [`hsl(${a} 62% 34%)`, `hsl(${b} 70% 62%)`];
}
const iniciais = (nome: string) => nome.replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';
export function Distintivo31({ nome, tamanho = 56 }: { nome: string; tamanho?: number }) {
  const [a, b] = cores(nome);
  return (
    <svg className="org31__distintivo" width={tamanho} height={tamanho} viewBox="0 0 100 100" role="img" aria-label={`Distintivo da ${nome}`}>
      <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill={a} stroke={b} strokeWidth="6" />
      <polygon points="50,18 80,35 80,65 50,82 20,65 20,35" fill="none" stroke={b} strokeWidth="2" opacity="0.6" />
      <text x="50" y="60" textAnchor="middle" fontSize={iniciais(nome).length > 1 ? 30 : 38} fontWeight="800" fill="white" fontFamily="system-ui, sans-serif">{iniciais(nome)}</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ sem organização: comprar ou fundar */

const FAIXAS_PRECO = [{ id: 0, nome: 'Qualquer preço' }, { id: 1e6, nome: 'Até R$ 1 mi' }, { id: 5e6, nome: 'Até R$ 5 mi' }, { id: 20e6, nome: 'Até R$ 20 mi' }, { id: 60e6, nome: 'Até R$ 60 mi' }];

function SemOrg({ vida, agir }: { vida: Vida; agir: Agir }) {
  const ano = anoDe(vida.t);
  const jogos = jogosDisponiveis31(ano);
  const [aberto, setAberto] = useState(false);
  const [jogo, setJogo] = useState<JogoId | ''>('');
  const [regiao, setRegiao] = useState<Regiao31 | ''>('BR');
  const [preco, setPreco] = useState(0);
  const [busca, setBusca] = useState('');
  const [mostrar, setMostrar] = useState(24);
  const todas = useMemo(() => (aberto ? orgsAVenda31(vida) : []), [aberto, vida]);
  const lista = todas
    .filter(o => (!jogo || o.jogo === jogo) && (!regiao || o.regiao === regiao) && (!preco || o.preco <= preco) && (!busca || o.nome.toLowerCase().includes(busca.toLowerCase())))
    .sort((a, b) => b.divisao - a.divisao || b.valor - a.valor);
  if (!jogos.length) return <section className="org31"><h3 className="subtitulo">Organização de e-sports</h3><p className="nota">Ainda não há jogos com cenário competitivo nesta época.</p></section>;
  return (
    <section className="org31" aria-labelledby="org31-titulo">
      <h3 id="org31-titulo" className="subtitulo">Organização de e-sports</h3>
      <p className="nota">Compre uma organização que já disputa as ligas de um jogo — o preço é o valor dela menos as dívidas, que vêm junto — ou funde a sua e comece pelo cenário aberto. A compra pede dinheiro na conta (ou 40% de entrada e o resto financiado).</p>
      <Fundar vida={vida} agir={agir} jogos={jogos} />
      <button type="button" className="botao botao--secundario" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Fechar a lista' : 'Ver organizações à venda'}</button>
      {aberto && (
        <>
          <div className="org31__filtros">
            <label>Jogo <select value={jogo} onChange={e => { setJogo(e.target.value as JogoId | ''); setMostrar(24); }}><option value="">Todos</option>{jogos.map(j => <option key={j} value={j}>{nomeDoJogo(j, ano)}</option>)}</select></label>
            <div className="escolha" role="group" aria-label="Região">
              {(['', 'BR', 'INT'] as const).map(r => <button key={r} type="button" className="chip" aria-pressed={regiao === r} onClick={() => { setRegiao(r); setMostrar(24); }}>{r ? NOME_REGIAO31[r] : 'Todas'}</button>)}
            </div>
            <label>Preço <select value={preco} onChange={e => setPreco(Number(e.target.value))}>{FAIXAS_PRECO.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
            <label>Buscar <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="nome da organização" /></label>
          </div>
          <p className="nota">{lista.length} organizações com esses filtros (de {todas.length}).</p>
          <ul className="org31__grade">
            {lista.slice(0, mostrar).map(o => (
              <li key={`${o.jogo}:${o.regiao}:${o.nome}`} className="org31__venda">
                <div className="org31__venda-topo">
                  <Distintivo31 nome={o.nome} tamanho={44} />
                  <div className="org31__quem"><strong>{o.nome}</strong><span className="org31__meta">{nomeDoJogo(o.jogo, ano)} · {NOME_REGIAO31[o.regiao]}</span></div>
                  <span className="org31__selo">{SIGLA_JOGO[o.jogo]}</span>
                </div>
                <span className="org31__chip">{NOME_DIVISAO31[o.divisao]}{o.real ? '' : ' · fictícia'}</span>
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
          <p className="nota">Os nomes reais vêm do catálogo do cenário e só aparecem nos anos em que a organização existia no jogo. Jogadores, resultados e números são de jogo.</p>
        </>
      )}
    </section>
  );
}

function Fundar({ vida, agir, jogos }: { vida: Vida; agir: Agir; jogos: JogoId[] }) {
  const ano = anoDe(vida.t);
  const [nome, setNome] = useState('');
  const [jogo, setJogo] = useState<JogoId>(jogos[jogos.length - 1]);
  const [regiao, setRegiao] = useState<Regiao31>('BR');
  return (
    <section className="org31__bloco org31__fundar" aria-labelledby="org31-fundar">
      <h4 id="org31-fundar">Fundar uma organização</h4>
      <div className="org31__form">
        <label>Nome <input type="text" value={nome} maxLength={32} onChange={e => setNome(e.target.value)} placeholder="ex.: Carcará Esports" /></label>
        <label>Jogo <select value={jogo} onChange={e => setJogo(e.target.value as JogoId)}>{jogos.map(j => <option key={j} value={j}>{nomeDoJogo(j, ano)}</option>)}</select></label>
        <div className="escolha" role="group" aria-label="Região">
          {(['BR', 'INT'] as const).map(r => <button key={r} type="button" className="chip" aria-pressed={regiao === r} onClick={() => setRegiao(r)}>{NOME_REGIAO31[r]}</button>)}
        </div>
        {nome.trim().length >= 2 && <Distintivo31 nome={nome.trim()} tamanho={40} />}
      </div>
      <p className="nota">Custa {dinheiroCurto(custoDeFundar31(regiao))}. A organização nova começa no cenário aberto, com um time de jogadores livres, poucos fãs e quase nenhum nome — sobe pelos resultados.</p>
      <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'fundar', nome, jogo, regiao })} variante="principal">Fundar{nome.trim() ? ` a ${nome.trim()}` : ''}</BotaoAcao>
    </section>
  );
}

/* ------------------------------------------------------------------ dono */

type Aba = 'painel' | 'elenco' | 'mercado' | 'temporadas' | 'comando';

function Medidor({ rotulo, valor, texto, tom }: { rotulo: string; valor: number; texto?: string; tom?: 'bom' | 'ruim' | 'atencao' }) {
  return (
    <div className="org31__medidor">
      <span>{rotulo}</span>
      <span className="org31__barra" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valor)} aria-label={rotulo}><i className={tom ? `org31__barra--${tom}` : undefined} style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} /></span>
      <strong>{texto ?? Math.round(valor)}</strong>
    </div>
  );
}

function MinhaOrg({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const [aba, setAba] = useState<Aba>('painel');
  const tit = titulares31(o, ano);
  const media = mediaDosTitulares31(o, ano);
  const forca = forcaDoTime31(o, ano);
  const quimica = quimica31(o, ano);
  const perfis = useMemo(() => perfisDoElenco31(o, ano), [o, ano]);
  const h = o.historico[o.historico.length - 1];
  const folha = o.elenco.reduce((s, j) => s + j.salario, 0);
  const pesoFolha = h?.receita ? folha / h.receita : 0;
  const igl = o.elenco.find(j => j.id === o.igl);
  const ABAS: Record<Aba, string> = { painel: `Painel${o.mesa.length ? ` · ${o.mesa.length} na mesa` : ''}`, elenco: 'Elenco', mercado: 'Mercado', temporadas: 'Temporadas e títulos', comando: 'Comando e negócios' };
  return (
    <section className="org31" aria-labelledby="org31-titulo">
      <header className="org31__capa">
        <Distintivo31 nome={o.nome} tamanho={64} />
        <div>
          <h3 id="org31-titulo" className="subtitulo">{o.nome}</h3>
          <p className="org31__sub">{nomeDoJogo(o.jogo, ano)} · {nomeDaLiga31(o, ano)} · {NOME_REGIAO31[o.regiao]} · {o.fundada ? 'fundada' : 'comprada'} por você em {anoDe(o.desde)}</p>
          <span className="org31__chip">{NOME_DIVISAO31[o.divisao]}</span>{o.trofeus.length > 0 && <span className="org31__chip org31__chip--ouro">{o.trofeus.length} título{o.trofeus.length > 1 ? 's' : ''}</span>}
        </div>
      </header>
      <div className="org31__numeros">
        <Num rotulo="Caixa" valor={dinheiroCurto(o.caixa)} />
        <Num rotulo="Dívida" valor={dinheiroCurto(o.divida)} ruim={o.divida > (h?.receita ?? 0)} />
        <Num rotulo="Valor" valor={dinheiroCurto(o.valor)} />
        <Num rotulo="Força do time" valor={String(Math.round(forca))} extra={`titulares ${Math.round(media)}`} />
        <Num rotulo="Química" valor={quimica > 0 ? `+${quimica}` : String(quimica)} ruim={quimica < 0} extra={igl ? `IGL: ${igl.nick}` : 'sem IGL escolhido'} />
        <Num rotulo="Técnico" valor={o.tecnico ? o.tecnico.nome.split(' ')[0] : 'Nenhum'} extra={o.tecnico ? `${'★'.repeat(o.tecnico.nivel)} · ${bonusDoTecnico31(o) >= 0 ? '+' : ''}${Math.round(bonusDoTecnico31(o) * 10) / 10}` : 'contrate em Comando'} />
      </div>
      <div className="org31__abas" role="tablist">
        {(Object.keys(ABAS) as Aba[]).map(x => <button key={x} type="button" role="tab" aria-selected={aba === x} className={`org31__aba${aba === x ? ' org31__aba--ativa' : ''}`} onClick={() => setAba(x)}>{ABAS[x]}</button>)}
      </div>
      {aba === 'painel' && (
        <>
          <Mesa vida={vida} agir={agir} />
          <div className="org31__painel">
            <section className="org31__bloco" aria-label="O time titular">
              <h4>O time titular</h4>
              <ul className="org31__line">
                {tit.map(j => <li key={j.id}><span className="org31__funcao">{nomeDaFuncao31(o.jogo, j.funcao)}</span><strong>{j.nick}</strong>{o.igl === j.id && <span className="org31__igl" title="IGL">IGL</span>}<span className="org31__f">{j.forca}</span></li>)}
              </ul>
              <p className="nota">{o.bootcamp === ano ? 'Bootcamp feito nesta temporada: +2 de força. ' : ''}{o.conteudo === 2 ? 'A casa de criadores tira 1 de força. ' : ''}A força entra na liga contra o campo de {nomeDaLiga31(o, ano)}.</p>
            </section>
            <section className="org31__bloco" aria-label="A organização">
              <h4>A organização</h4>
              <Medidor rotulo="Fãs" valor={o.fas} />
              <Medidor rotulo="Nome no cenário" valor={o.reputacao} />
              <Medidor rotulo="Folha / receita" valor={pesoFolha * 100} texto={h ? `${Math.round(pesoFolha * 100)}%` : '—'} tom={pesoFolha > 0.8 ? 'ruim' : pesoFolha > 0.6 ? 'atencao' : 'bom'} />
              {h ? <p className="nota">Última temporada ({h.ano}): {h.posicao}º de {h.participantes} em {h.liga}{h.mundial ? `; ${h.mundial.colocacao}º no ${h.mundial.nome}` : ''}. Receita {dinheiroCurto(h.receita)}, despesa {dinheiroCurto(h.despesa)}.</p> : <p className="nota">A primeira temporada como dono fecha na virada do ano.</p>}
              {o.elenco.some(j => j.contratoAte <= ano) && <p className="org31__alerta">{o.elenco.filter(j => j.contratoAte <= ano).length} contrato(s) terminando neste ano — renove no Elenco ou deixe sair.</p>}
            </section>
          </div>
        </>
      )}
      {aba === 'elenco' && <Elenco vida={vida} agir={agir} perfis={perfis} />}
      {aba === 'mercado' && <Mercado vida={vida} agir={agir} />}
      {aba === 'temporadas' && <Temporadas o={o} />}
      {aba === 'comando' && <Comando vida={vida} agir={agir} folha={folha} />}
    </section>
  );
}

function Num({ rotulo, valor, extra, ruim }: { rotulo: string; valor: string; extra?: string; ruim?: boolean }) {
  return <div className="org31__num"><span>{rotulo}</span><strong className={ruim ? 'org31__ruim' : undefined}>{valor}</strong>{extra && <small>{extra}</small>}</div>;
}

/* ------------------------------------------------------------------ o cartão do jogador */

function Cartao({ o, j, ano, perfil, titular, preco, origem, delta, alerta, children }: { o: OrgEsports31; j: JogadorOrg31; ano: number; perfil?: PerfilOrg31; titular?: boolean; preco?: number; origem?: string; delta?: number; alerta?: string; children?: ReactNode }) {
  const principal = perfil?.perfil.principal;
  const genero = j.feminino ? 'feminino' : 'masculino';
  return (
    <li className={`org31__cartao${o.igl === j.id ? ' org31__cartao--igl' : ''}`}>
      <div className="org31__cartao-topo">
        <span className="org31__papel" title={nomeDaFuncao31(o.jogo, j.funcao)}>{nomeDaFuncao31(o.jogo, j.funcao).replace(/\s*\(.*\)/, '').slice(0, 10)}</span>
        <div className="org31__quem">
          <strong>{j.nick}{o.igl === j.id && <span className="org31__igl" title="IGL: faz as calls">IGL</span>}</strong>
          <span className="org31__meta">{j.nome} · {ano - anoDe(j.tNasc)} anos{titular !== undefined ? (titular ? ' · titular' : ' · banco') : ''}{j.daAcademia ? ' · da academia' : ''}{origem ? ` · na ${origem}` : ''}</span>
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

function Elenco({ vida, agir, perfis }: { vida: Vida; agir: Agir; perfis: Map<string, PerfilOrg31> }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const tit = new Set(titulares31(o, ano).map(j => j.id));
  const lista = [...o.elenco].sort((a, b) => Number(tit.has(b.id)) - Number(tit.has(a.id)) || b.forca - a.forca);
  const auge = JOGOS25[o.jogo].auge;
  return (
    <>
      <p className="nota">{JOGOS25[o.jogo].porEquipe(ano)} titulares (o melhor de cada função entra primeiro) e o banco. O tipo de jogador é o mesmo arquétipo do jogador de e-sports da vida; o vestiário que eles fazem é a química do time.</p>
      <ul className="org31__cartoes">
        {lista.map(j => (
          <Cartao key={j.id} o={o} j={j} ano={ano} perfil={perfis.get(j.id)} titular={tit.has(j.id)} alerta={j.contratoAte <= ano ? 'Contrato termina neste ano' : undefined}>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'renovar', id: j.id })} ocultarBloqueado>Renovar</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'igl', id: j.id })} ocultarBloqueado>Tornar IGL</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'dispensar', id: j.id })}>Dispensar · vale ~{dinheiroCurto(valorDoJogador31(j, ano, o.regiao, auge))}</BotaoAcao>
          </Cartao>
        ))}
      </ul>
      <section className="org31__bloco" aria-labelledby="org31-academia">
        <h4 id="org31-academia">Academia</h4>
        <div className="org31__botoes" role="group" aria-label="Nível da academia">
          {([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={A({ op: 'academia', nivel: n })} variante={o.academiaNivel === n ? 'principal' : 'secundario'}>{['Sem academia', 'Básica', 'Forte'][n]}</BotaoAcao>)}
        </div>
        {o.academiaNivel === 0 ? <p className="nota">Sem academia, nenhum jovem é revelado. Uma academia custa por ano e revela jogadores com potencial na virada.</p>
          : o.academia.length ? <ul className="org31__cartoes">{o.academia.map(j => <Cartao key={j.id} o={o} j={j} ano={ano} perfil={perfilDoJogadorOrg31(j, o.jogo, ano, { mediaDoTime: mediaDosTitulares31(o, ano) })}><BotaoAcao vida={vida} agir={agir} acao={A({ op: 'promover', id: j.id })}>Subir ao time principal</BotaoAcao></Cartao>)}</ul>
            : <p className="nota">Os primeiros jovens chegam na virada do ano.</p>}
      </section>
    </>
  );
}

const FAIXA: Record<JogadorDoMercado31['faixa'], string> = { reforco: 'Reforços', nivel: 'Do nível', aposta: 'Apostas', estrela: 'Estrela' };
function Mercado({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const [faixa, setFaixa] = useState<'' | JogadorDoMercado31['faixa']>('');
  const [funcao, setFuncao] = useState('');
  const [ordem, setOrdem] = useState<'forca' | 'preco' | 'potencial' | 'idade'>('forca');
  const mercado = mercadoOrg31(vida);
  const media = mediaDosTitulares31(o, ano);
  const tit = titulares31(o, ano);
  const titularDa = (f: string) => tit.find(j => j.funcao === f)?.forca ?? Math.min(...tit.map(j => j.forca));
  const lista = mercado.filter(j => (!faixa || j.faixa === faixa) && (!funcao || j.funcao === funcao))
    .sort((a, b) => (ordem === 'forca' ? b.forca - a.forca : ordem === 'preco' ? a.preco - b.preco : ordem === 'potencial' ? b.potencial - a.potencial : b.tNasc - a.tNasc));
  return (
    <>
      <p className="nota">Jogadores do cenário com a multa rescisória (sai do caixa da organização). Os reforços estão acima do seu time; quanto maior o nome da organização e a divisão, mais alto o nível de quem aceita vir. O mercado muda a cada ano.</p>
      <div className="org31__filtros">
        <div className="escolha" role="group" aria-label="Faixa">
          <button type="button" className="chip" aria-pressed={!faixa} onClick={() => setFaixa('')}>Todos</button>
          {(Object.keys(FAIXA) as JogadorDoMercado31['faixa'][]).map(f => <button key={f} type="button" className="chip" aria-pressed={faixa === f} onClick={() => setFaixa(f)}>{FAIXA[f]}</button>)}
        </div>
        <label>Função <select value={funcao} onChange={e => setFuncao(e.target.value)}><option value="">Todas</option>{JOGOS25[o.jogo].funcoes.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
        <label>Ordenar <select value={ordem} onChange={e => setOrdem(e.target.value as typeof ordem)}><option value="forca">Força</option><option value="preco">Mais baratos</option><option value="potencial">Potencial</option><option value="idade">Mais novos</option></select></label>
      </div>
      <ul className="org31__cartoes">
        {lista.map(j => (
          <Cartao key={j.id} o={o} j={j} ano={ano} perfil={perfilDoJogadorOrg31(j, o.jogo, ano, { mediaDoTime: media })} preco={j.preco} origem={j.de} delta={j.forca - titularDa(j.funcao)}>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'contratar', id: j.id })}>Contratar · {dinheiroCurto(j.preco)}</BotaoAcao>
          </Cartao>
        ))}
        {!lista.length && <li className="nota">Ninguém no mercado com esse filtro.</li>}
      </ul>
    </>
  );
}

function Temporadas({ o }: { o: OrgEsports31 }) {
  const hs = o.historico.slice(-12).reverse();
  const max = Math.max(1, ...hs.flatMap(h => [h.receita, h.despesa]));
  return (
    <div className="org31__temporadas">
      <section className="org31__bloco" aria-labelledby="org31-trofeus">
        <h4 id="org31-trofeus">Galeria de troféus</h4>
        {o.trofeus.length ? (
          <ul className="org31__trofeus">
            {[...o.trofeus].reverse().map((t, k) => <li key={k} className={t.tipo === 'mundial' ? 'org31__trofeu org31__trofeu--mundial' : 'org31__trofeu'}><span className="org31__taca" aria-hidden="true">★</span><strong>{t.nome}</strong><span className="org31__meta">{t.ano}</span></li>)}
          </ul>
        ) : <p className="nota">Nenhum título ainda. A liga se vence em primeiro; o mundial ({nomeDoMundial31(o.jogo, anoDe(o.desde))}) é para as do topo da liga principal.</p>}
      </section>
      <section className="org31__bloco" aria-labelledby="org31-temps">
        <h4 id="org31-temps">Temporadas</h4>
        {!hs.length && <p className="nota">A primeira temporada aparece aqui quando fechar.</p>}
        <ul className="org31__anos">
          {hs.map(h => (
            <li key={h.ano}>
              <span className="org31__ano">{h.ano}</span>
              <span className="org31__res">{h.posicao}º/{h.participantes} · {h.liga}{h.titulo ? ' · campeã' : h.subiu ? ' · subiu' : h.caiu ? ' · caiu' : ''}{h.mundial ? ` · ${h.mundial.colocacao}º no mundial` : ''}</span>
              <span className="org31__fin" aria-label={`Receita ${dinheiroCurto(h.receita)}, despesa ${dinheiroCurto(h.despesa)}`}><i className="org31__rec" style={{ width: `${(h.receita / max) * 100}%` }} /><i className="org31__desp" style={{ width: `${(h.despesa / max) * 100}%` }} /></span>
              <span className={h.receita >= h.despesa ? 'org31__saldo' : 'org31__saldo org31__ruim'}>{h.receita >= h.despesa ? '+' : '−'}{dinheiroCurto(Math.abs(h.receita - h.despesa))}</span>
            </li>
          ))}
        </ul>
        {o.vendas.length > 0 && <p className="nota">Vendas: {o.vendas.slice(0, 5).map(x => `${x.nome} → ${x.para} (${dinheiroCurto(x.valor)}, ${x.ano})`).join('; ')}.</p>}
      </section>
    </div>
  );
}

function Comando({ vida, agir, folha }: { vida: Vida; agir: Agir; folha: number }) {
  const o = vida.orgEsports31!;
  const ano = anoDe(vida.t);
  const aporte = Math.max(50000, Math.round(folha / 2 / 10000) * 10000);
  const igl = o.elenco.find(j => j.id === o.igl);
  return (
    <div className="org31__comando">
      <section className="org31__bloco" aria-labelledby="org31-tecnico">
        <h4 id="org31-tecnico">O técnico (coach)</h4>
        <p className="nota">{o.tecnico ? `${o.tecnico.nome} comanda o time desde ${o.tecnico.desde}: soma ${Math.round(bonusDoTecnico31(o) * 10) / 10} na força e custa ${dinheiroCurto(o.tecnico.salario)} por ano.` : 'Sem técnico, os jogadores se organizam sozinhos (nada a mais na força, e os jovens evoluem menos).'}</p>
        <ul className="org31__ofertas">
          {tecnicosOrg31(vida).map((t, k) => (
            <li key={k} className="org31__oferta">
              <strong>{t.nome}</strong>
              <span className="org31__estrelas" aria-label={`Nível ${t.nivel} de 5`}>{'★'.repeat(t.nivel)}<i>{'★'.repeat(5 - t.nivel)}</i></span>
              <span className="org31__meta">{dinheiroCurto(t.salario)}/ano · {(t.nivel - 2) * 1.2 >= 0 ? '+' : ''}{Math.round((t.nivel - 2) * 12) / 10} na força</span>
              <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'tecnico', i: k })}>Contratar</BotaoAcao>
            </li>
          ))}
        </ul>
        {o.tecnico && <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'demitir_tecnico' })} variante="discreto">Demitir {o.tecnico.nome.split(' ')[0]} · multa {dinheiroCurto(Math.round(o.tecnico.salario * 0.5))}</BotaoAcao>}
      </section>
      <section className="org31__bloco" aria-labelledby="org31-igl">
        <h4 id="org31-igl">IGL e química</h4>
        <p className="nota">Química {quimica31(o, ano) > 0 ? '+' : ''}{quimica31(o, ano)} na força. {igl ? `${igl.nick} é o IGL: faz as calls dentro da partida.` : 'Sem IGL escolhido, o time joga sem voz (−0,6).'} O IGL se escolhe no Elenco — de preferência entre os titulares.</p>
      </section>
      <section className="org31__bloco" aria-labelledby="org31-patro">
        <h4 id="org31-patro">Patrocínio</h4>
        {o.patrocinio && o.patrocinio.ate >= ano
          ? <p className="nota">{o.patrocinio.nome}: {dinheiroCurto(o.patrocinio.valor)} por ano, até {o.patrocinio.ate}.</p>
          : <ul className="org31__ofertas">{patrociniosOrg31(vida).map((p, k) => <li key={k} className="org31__oferta"><strong>{p.nome}</strong><span className="org31__meta">{dinheiroCurto(p.valor)}/ano · {p.anos} {p.anos === 1 ? 'ano' : 'anos'} · {p.sobre}</span><BotaoAcao vida={vida} agir={agir} acao={A({ op: 'patrocinio', i: k })}>Fechar</BotaoAcao></li>)}</ul>}
      </section>
      <section className="org31__bloco" aria-labelledby="org31-boot">
        <h4 id="org31-boot">Bootcamp</h4>
        <p className="nota">Uma semana de treinos contra equipes de fora: +2 de força nesta temporada, o clima melhora e os jovens evoluem mais. Custa {dinheiroCurto(custoDoBootcamp31(o))}.</p>
        <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'bootcamp' })}>{o.bootcamp === ano ? 'Bootcamp feito' : 'Levar o time ao bootcamp'}</BotaoAcao>
      </section>
      <section className="org31__bloco" aria-labelledby="org31-conteudo">
        <h4 id="org31-conteudo">Conteúdo e streaming</h4>
        <div className="org31__botoes" role="group" aria-label="Conteúdo">
          {([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={A({ op: 'conteudo', nivel: n })} variante={o.conteudo === n ? 'principal' : 'secundario'}>{['Só treino', 'Lives semanais', 'Casa de criadores'][n]}</BotaoAcao>)}
        </div>
        <p className="nota">Mais conteúdo traz receita e fãs; a casa de criadores tira horas de treino (−1 de força e evolução mais lenta).</p>
      </section>
      <section className="org31__bloco" aria-labelledby="org31-dono">
        <h4 id="org31-dono">Dinheiro do dono</h4>
        <div className="org31__botoes">
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'aportar', valor: aporte })}>Aportar {dinheiroCurto(aporte)}</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'vender_org' })} variante="perigo">Vender a organização · ~{dinheiroCurto(Math.max(0, o.valor + o.caixa - o.divida))}</BotaoAcao>
        </div>
        <p className="nota">O aporte paga primeiro as dívidas da organização. Na venda, você recebe o valor e o caixa, menos as dívidas.</p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ a mesa do dono */

function Mesa({ vida, agir }: { vida: Vida; agir: Agir }) {
  const o = vida.orgEsports31!;
  const hist = o.mesaHist.slice(0, 4);
  if (!o.mesa.length && !hist.length) return null;
  return (
    <section className="org31__mesa" aria-labelledby="org31-mesa">
      <h4 id="org31-mesa">Na mesa do dono{o.mesa.length ? <span className="org31__conta">{o.mesa.length}</span> : null}</h4>
      {!o.mesa.length && <p className="nota">Nenhum assunto esperando. Os da próxima temporada chegam na virada do ano.</p>}
      <ul className="org31__assuntos">
        {o.mesa.map(s => (
          <li key={s.id} className={`org31__assunto org31__assunto--${(QUEM_DA_MESA31[s.tipo] ?? 'Comunidade').normalize('NFD').replace(/[^a-zA-Z]/g, '').toLowerCase()}`}>
            <span className="org31__assunto-quem">{QUEM_DA_MESA31[s.tipo] ?? 'Comunidade'}</span>
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
