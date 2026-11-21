/**
 * VIDA 20 · O clube esportivo: comprar (todos os clubes em que se pode jogar, de cada país carregado) e administrar —
 * elenco, mercado, base, estádio, CT, caixa, dívidas, objetivo, conflito de interesses (em Patrimônio · Empresas).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { bonusDoTecnico, clubesAVenda, custoDaObra, dividendosPossiveis, mediaDoElenco, mercadoDoAno, patrociniosDoAno, tecnicosDisponiveis, valorDoJogador, type OqueClube20 } from '../../../motor/v20/clubes/clubes20';
import { NOME_DO_PAPEL, perfilDoJogador20, perfisDoElenco, quimicaDoElenco, type Perfil31 } from '../../../motor/v20/clubes/perfil31';
import { arquetipo, nomeDoArquetipo } from '../../../motor/sistemas/arquetipos';
import './clube31.css';
import { clubesNaDivisao, forcaNaLiga, formaNaLiga, ligaDe, temporadaCorrente, ultimaTemporadaDoPais } from '../../../motor/sistemas/ligas';
import { divisaoDoNivel, oClube } from '../../../motor/dados/clubes';
import { CampeoesDoPais, TabelaDoCampeonato } from '../../jogo/Campeonato';
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

const ROTULO_ATRIBUTO: Record<string, string> = { reflexos: 'Reflexos', posicionamento: 'Posicionamento', saidas: 'Saídas', marcacao: 'Marcação', duelos: 'Duelos', aereo: 'Jogo aéreo', antecipacao: 'Antecipação', resistencia: 'Resistência', cruzamento: 'Cruzamento', cobertura: 'Cobertura', determinacao: 'Determinação', passe: 'Passe', decisao: 'Decisão', criacao: 'Criação', visao: 'Visão', passe_longo: 'Passe longo', movimentacao: 'Movimentação', finalizacao: 'Finalização', compostura: 'Compostura' };
const SIGLA: Record<string, string> = { goleiro: 'GOL', zagueiro: 'ZAG', lateral: 'LAT', volante: 'VOL', meia: 'MEI', ponta: 'PON', atacante: 'ATA' };

/** VIDA 31 · o cartão do jogador: a posição fina, o arquétipo (o mesmo do atleta da vida), os atributos da posição, a força e o potencial. */
function CartaoJogador({ j, ano, perfil, titularDaPos, capitao, origem, preco, alerta, children }: { j: { nome: string; pos: string; forca: number; potencial: number; tNasc: number; salario: number; contratoAte?: number; daBase?: boolean }; ano: number; perfil?: Perfil31; titularDaPos?: number; capitao?: boolean; origem?: string; preco?: number; alerta?: string; children?: ReactNode }) {
  const i = ano - anoDe(j.tNasc);
  const delta = titularDaPos !== undefined ? j.forca - titularDaPos : undefined;
  const principal = perfil?.perfil.principal;
  return (
    <li className={`clube30__cartao jog31${capitao ? ' jog31--capitao' : ''}`}>
      <div className="jog31__topo">
        <span className="jog31__pos" title={perfil ? NOME_DO_PAPEL[perfil.papel] : j.pos}>{perfil ? SIGLA[perfil.papel] : j.pos}</span>
        <div className="jog31__quem">
          <strong>{j.nome}{capitao && <span className="jog31__bracadeira" title="Capitão">C</span>}</strong>
          <span className="clube30__meta">{perfil ? NOME_DO_PAPEL[perfil.papel] : ''} · {i} anos{j.daBase ? ' · da base' : ''}{origem ? ` · no ${origem}` : ''}</span>
        </div>
        <span className="jog31__forca" aria-label={`Força ${j.forca}`}>{j.forca}</span>
      </div>
      <div className="jog31__tipos">
        {principal ? <span className="jog31__tipo" title={arquetipo(principal)?.sobre}>{nomeDoArquetipo(principal)}</span> : <span className="jog31__tipo jog31__tipo--comum" title="Nenhum traço forte o bastante para virar um tipo">Sem perfil marcante</span>}
        {perfil?.perfil.secundarios.map(x => <span key={x} className="jog31__tipo jog31__tipo--sec" title={arquetipo(x)?.sobre}>{nomeDoArquetipo(x)}</span>)}
      </div>
      {perfil && (
        <ul className="jog31__atributos" aria-label="Os atributos da posição">
          {perfil.atributos.slice(0, 3).map(a => <li key={a.id}><span>{ROTULO_ATRIBUTO[a.id] ?? a.id}</span><i style={{ width: `${a.valor}%` }} /><b>{a.valor}</b></li>)}
        </ul>
      )}
      <div className="clube30__forca" aria-label={`Força ${j.forca}, potencial ${j.potencial}`}>
        <span className="clube30__forca-barra"><i style={{ width: `${j.forca}%` }} />{j.potencial > j.forca && <i className="clube30__pot" style={{ left: `${j.forca}%`, width: `${j.potencial - j.forca}%` }} />}</span>
        <span>{j.potencial > j.forca ? <small>potencial {j.potencial}</small> : <small>no auge</small>}</span>
        {delta !== undefined && <span className={delta > 0 ? 'clube30__delta clube30__delta--bom' : 'clube30__delta'}>{delta > 0 ? `+${delta}` : delta} vs. titular</span>}
      </div>
      <span className="clube30__meta">{dinheiroCurto(j.salario)}/ano{j.contratoAte ? ` · contrato até ${j.contratoAte}` : ''}{preco ? ` · preço ${dinheiroCurto(preco)}` : ''}</span>
      {alerta && <span className="jog31__alerta">{alerta}</span>}
      {children && <div className="clube20__botoes">{children}</div>}
    </li>
  );
}

const SETORES = [{ id: '', nome: 'Todos' }, { id: 'GOL', nome: 'Goleiros' }, { id: 'DEF', nome: 'Defesa' }, { id: 'MEI', nome: 'Meio' }, { id: 'ATA', nome: 'Ataque' }] as const;
type Ordem31 = 'pos' | 'forca' | 'potencial' | 'idade' | 'salario' | 'contrato';
const ORDEM: Record<Ordem31, string> = { pos: 'Posição', forca: 'Força', potencial: 'Potencial', idade: 'Mais novos', salario: 'Salário', contrato: 'Contrato acabando' };

/** Os filtros de uma lista de jogadores: o setor, o arquétipo e a ordem. */
function Filtros31({ setor, setSetor, tipo, setTipo, tipos, ordem, setOrdem, id }: { setor: string; setSetor: (s: string) => void; tipo: string; setTipo: (t: string) => void; tipos: string[]; ordem: Ordem31; setOrdem: (o: Ordem31) => void; id: string }) {
  return (
    <div className="jog31__filtros">
      <div className="escolha" role="group" aria-label="Setor">{SETORES.map(x => <button key={x.id} type="button" className="chip" aria-pressed={setor === x.id} onClick={() => setSetor(x.id)}>{x.nome}</button>)}</div>
      <label htmlFor={`${id}-tipo`}>Arquétipo <select id={`${id}-tipo`} value={tipo} onChange={e => setTipo(e.target.value)}><option value="">Todos</option>{tipos.map(t => <option key={t} value={t}>{nomeDoArquetipo(t)}</option>)}</select></label>
      <label htmlFor={`${id}-ordem`}>Ordenar <select id={`${id}-ordem`} value={ordem} onChange={e => setOrdem(e.target.value as Ordem31)}>{(Object.keys(ORDEM) as Ordem31[]).map(o => <option key={o} value={o}>{ORDEM[o]}</option>)}</select></label>
    </div>
  );
}

function ordenar<T extends { pos: string; forca: number; potencial: number; tNasc: number; salario: number; contratoAte?: number }>(xs: T[], o: Ordem31): T[] {
  const cmp: Record<Ordem31, (a: T, b: T) => number> = {
    pos: (a, b) => 'GOLDEFMEIATA'.indexOf(a.pos) - 'GOLDEFMEIATA'.indexOf(b.pos) || b.forca - a.forca,
    forca: (a, b) => b.forca - a.forca, potencial: (a, b) => b.potencial - a.potencial, idade: (a, b) => b.tNasc - a.tNasc,
    salario: (a, b) => b.salario - a.salario, contrato: (a, b) => (a.contratoAte ?? 9999) - (b.contratoAte ?? 9999)
  };
  return [...xs].sort(cmp[o]);
}

function MeuClube({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const c = vida.clube20!;
  const ano = anoDe(vida.t);
  const [aba, setAba] = useState<'painel' | 'campeonato' | 'elenco' | 'mercado' | 'base' | 'comando' | 'clube'>('painel');
  // VIDA 31: os filtros do elenco e do mercado (o setor, o arquétipo, a ordem).
  const [setorE, setSetorE] = useState(''); const [tipoE, setTipoE] = useState(''); const [ordemE, setOrdemE] = useState<Ordem31>('pos');
  const [setorM, setSetorM] = useState(''); const [tipoM, setTipoM] = useState(''); const [ordemM, setOrdemM] = useState<Ordem31>('forca');
  const mercado = aba === 'mercado' ? mercadoDoAno(vida) : [];
  const h = c.historico[c.historico.length - 1];
  const folha = c.elenco.reduce((s, j) => s + j.salario, 0);
  const receita = h?.receita ?? 0;
  const pesoFolha = receita > 0 ? folha / receita : 0;
  const mediaExata = mediaDoElenco(c);
  const media = Math.round(mediaExata);
  const perfis = useMemo(() => perfisDoElenco(c, ano, mediaExata), [c, ano, mediaExata]);
  const quimica = quimicaDoElenco(c, ano, mediaExata);
  const perfisM = new Map(mercado.map(j => [j.id, perfilDoJogador20(j, ano, { mediaDoTime: mediaExata })]));
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
        <div className="clube30__num"><span>Química</span><strong className={quimica < 0 ? 'clube30__ruim' : undefined}>{quimica > 0 ? `+${quimica}` : quimica}</strong><small>{c.capitao31 && c.elenco.some(j => j.id === c.capitao31) ? `capitão: ${c.elenco.find(j => j.id === c.capitao31)!.nome.split(' ')[0]}` : 'sem capitão escolhido'}</small></div>
        <div className="clube30__num"><span>Técnico</span><strong>{c.tecnico31 ? c.tecnico31.nome.split(' ')[0] : 'Interino'}</strong><small>{c.tecnico31 ? `${'★'.repeat(c.tecnico31.nivel)} · ${(c.humorTecnico31 ?? 60) >= 70 ? 'satisfeito' : (c.humorTecnico31 ?? 60) >= 45 ? 'tranquilo' : 'insatisfeito'} · ${bonusDoTecnico(c) >= 0 ? '+' : ''}${Math.round(bonusDoTecnico(c) * 10) / 10} na média` : 'contrate em Comando'}</small></div>
        <div className="clube30__num"><span>Vestiário</span><strong className={(c.moral31 ?? 0) < 0 ? 'clube30__ruim' : undefined}>{(c.moral31 ?? 0) > 0.5 ? 'Unido' : (c.moral31 ?? 0) < -0.5 ? 'Rachado' : 'Normal'}</strong><small>{(c.moral31 ?? 0) > 0 ? '+' : ''}{c.moral31 ?? 0} na média</small></div>
      </div>
      <div className="clube20__abas" role="tablist">
        {(['painel', 'campeonato', 'elenco', 'mercado', 'base', 'comando', 'clube'] as const).map(x => <button key={x} type="button" role="tab" aria-selected={aba === x} className={`clube20__aba${aba === x ? ' clube20__aba--ativa' : ''}`} onClick={() => setAba(x)}>{{ painel: `Painel${(c.mesa31?.length ?? 0) ? ` · ${c.mesa31!.length} na mesa` : ''}`, campeonato: 'Campeonato', elenco: 'Elenco', mercado: 'Mercado', base: 'Base', comando: 'Comando e negócios', clube: 'Estrutura e finanças' }[x]}</button>)}
      </div>
      {aba === 'painel' && <MesaDoPresidente vida={vida} agir={agir} />}
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
      {aba === 'campeonato' && <CampeonatoDoClube vida={vida} />}
      {aba === 'elenco' && (() => {
        const tipos = [...new Set([...perfis.values()].flatMap(p => [p.perfil.principal, ...p.perfil.secundarios]).filter((x): x is string => !!x))];
        const lista = ordenar(c.elenco.filter(j => (!setorE || j.pos === setorE) && (!tipoE || [perfis.get(j.id)?.perfil.principal, ...(perfis.get(j.id)?.perfil.secundarios ?? [])].includes(tipoE))), ordemE);
        return (
          <>
            <Filtros31 id="elenco31" setor={setorE} setSetor={setSetorE} tipo={tipoE} setTipo={setTipoE} tipos={tipos} ordem={ordemE} setOrdem={setOrdemE} />
            <ul className="clube30__cartoes">
              {lista.map(j => (
                <CartaoJogador key={j.id} j={j} ano={ano} perfil={perfis.get(j.id)} capitao={c.capitao31 === j.id} alerta={j.contratoAte <= ano ? 'Contrato termina neste ano' : undefined}>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'renovar', id: j.id })} ocultarBloqueado>Renovar</BotaoAcao>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'capitao', id: j.id })} ocultarBloqueado>Dar a braçadeira</BotaoAcao>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'emprestar', id: j.id })} ocultarBloqueado>Emprestar</BotaoAcao>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'vender', id: j.id })}>Vender · ~{dinheiroCurto(valorDoJogador(j, ano))}</BotaoAcao>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'dispensar', id: j.id })}>Dispensar</BotaoAcao>
                </CartaoJogador>
              ))}
              {!lista.length && <li className="nota">Ninguém do elenco com esse filtro.</li>}
            </ul>
            {(c.emprestados31?.length ?? 0) > 0 && <p className="nota">Emprestados até o fim da temporada: {c.emprestados31!.map(e => `${e.jogador.nome} (${e.para.startsWith('um ') ? e.para : `no ${e.para}`})`).join('; ')}.</p>}
          </>
        );
      })()}
      {aba === 'mercado' && (() => {
        const tipos = [...new Set([...perfisM.values()].flatMap(p => [p.perfil.principal, ...p.perfil.secundarios]).filter((x): x is string => !!x))];
        const lista = ordenar(mercado.filter(j => (!setorM || j.pos === setorM) && (!tipoM || [perfisM.get(j.id)?.perfil.principal, ...(perfisM.get(j.id)?.perfil.secundarios ?? [])].includes(tipoM))), ordemM);
        return (
          <>
            <p className="nota">Jogadores de outros clubes do país, à venda neste ano — com o tipo de jogador de cada um (os mesmos arquétipos do atleta da vida). A comparação é com o melhor do seu elenco na mesma posição; o dinheiro sai do caixa do clube.</p>
            <Filtros31 id="mercado31" setor={setorM} setSetor={setSetorM} tipo={tipoM} setTipo={setTipoM} tipos={tipos} ordem={ordemM} setOrdem={setOrdemM} />
            <ul className="clube30__cartoes">
              {lista.map(j => (
                <CartaoJogador key={j.id} j={j} ano={ano} perfil={perfisM.get(j.id)} titularDaPos={melhorDa(j.pos)} origem={j.clube} preco={j.preco}>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'contratar', id: j.id })}>Contratar · {dinheiroCurto(j.preco)}</BotaoAcao>
                </CartaoJogador>
              ))}
              {!lista.length && <li className="nota">Ninguém no mercado com esse filtro.</li>}
            </ul>
          </>
        );
      })()}
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
      {aba === 'comando' && (
        <div className="cmd31">
          <section className="cmd31__bloco" aria-labelledby="cmd31-tecnico">
            <h4 id="cmd31-tecnico">O técnico</h4>
            <p className="nota">{c.tecnico31 ? `${c.tecnico31.nome} (${c.tecnico31.estilo}) comanda o time desde ${c.tecnico31.desde}: soma ${Math.round(bonusDoTecnico(c) * 10) / 10} na média do elenco e custa ${dinheiroCurto(c.tecnico31.salario)} por ano.` : 'Sem técnico contratado por você, a comissão interina da casa toca o time (sem somar nada à média).'}</p>
            <ul className="cmd31__ofertas">
              {tecnicosDisponiveis(vida).map((t, k) => (
                <li key={k} className="cmd31__oferta">
                  <strong>{t.nome}</strong>
                  <span className="cmd31__estrelas" aria-label={`Nível ${t.nivel} de 5`}>{'★'.repeat(t.nivel)}<i>{'★'.repeat(5 - t.nivel)}</i></span>
                  <span className="clube30__meta">{t.estilo} · {dinheiroCurto(t.salario)}/ano · {(t.nivel - 2) * 1.1 >= 0 ? '+' : ''}{Math.round((t.nivel - 2) * 11) / 10} na média</span>
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'tecnico', i: k })}>Contratar</BotaoAcao>
                </li>
              ))}
            </ul>
            {c.tecnico31 && <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'demitir_tecnico' })} variante="discreto">Demitir {c.tecnico31.nome.split(' ')[0]} · multa {dinheiroCurto(Math.round(c.tecnico31.salario * 0.5))}</BotaoAcao>}
          </section>
          <section className="cmd31__bloco" aria-labelledby="cmd31-capitao">
            <h4 id="cmd31-capitao">A braçadeira e a química</h4>
            <p className="nota">Química {quimica > 0 ? `+${quimica}` : quimica} na média: é o vestiário que os tipos de jogador fazem — o Capitão e o Garçom aproximam, o Marrento desgasta. {c.capitao31 && c.elenco.some(j => j.id === c.capitao31) ? `O capitão é ${c.elenco.find(j => j.id === c.capitao31)!.nome}.` : 'Sem capitão escolhido, o grupo perde um pouco de rumo.'} A braçadeira se dá no Elenco.</p>
          </section>
          <section className="cmd31__bloco" aria-labelledby="cmd31-patrocinio">
            <h4 id="cmd31-patrocinio">Patrocínio master</h4>
            {c.patrocinio31 && c.patrocinio31.ate >= ano
              ? <p className="nota">{c.patrocinio31.nome}: {dinheiroCurto(c.patrocinio31.valor)} por ano, até {c.patrocinio31.ate}.</p>
              : <ul className="cmd31__ofertas">{patrociniosDoAno(vida).map((p, k) => (
                <li key={k} className="cmd31__oferta"><strong>{p.nome}</strong><span className="clube30__meta">{dinheiroCurto(p.valor)}/ano · {p.anos} {p.anos === 1 ? 'ano' : 'anos'} · {p.sobre}</span><BotaoAcao vida={vida} agir={agir} acao={C({ op: 'patrocinio', i: k })}>Fechar</BotaoAcao></li>
              ))}</ul>}
          </section>
          <section className="cmd31__bloco" aria-labelledby="cmd31-ingresso">
            <h4 id="cmd31-ingresso">Ingressos</h4>
            <div className="clube20__botoes" role="group" aria-label="Preço do ingresso">
              {([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={C({ op: 'ingresso', nivel: n })} variante={(c.ingresso31 ?? 1) === n ? 'principal' : 'secundario'}>{['Popular', 'Normal', 'Caro'][n]}</BotaoAcao>)}
            </div>
            <p className="nota">Popular: bilheteria 7% menor e a torcida cresce. Caro: 8% a mais e a torcida diminui. Vale para a temporada que fecha.</p>
          </section>
        </div>
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

/* ------------------------------------------------------------------ VIDA 31 · a mesa do presidente e o campeonato */

/** Os assuntos da temporada (a torcida, o técnico, os jogadores), com as escolhas — e o que já se decidiu. */
function MesaDoPresidente({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const c = vida.clube20!;
  const abertos = c.mesa31 ?? [];
  const hist = (c.mesaHist31 ?? []).slice(0, 4);
  if (!abertos.length && !hist.length) return null;
  return (
    <section className="mesa31" aria-labelledby="mesa31-titulo">
      <h4 id="mesa31-titulo">Na mesa do presidente{abertos.length ? <span className="traj31__conta">{abertos.length}</span> : null}</h4>
      {abertos.length === 0 && <p className="nota">Nenhum assunto esperando agora. Os da próxima temporada chegam quando ela fechar.</p>}
      <ul className="mesa31__lista">
        {abertos.map(s => (
          <li key={s.id} className={`mesa31__assunto mesa31__assunto--${s.tipo.split('_')[0]}`}>
            <span className="mesa31__quem">{s.tipo.startsWith('torcida') || s.tipo === 'boas_vindas' ? 'Torcida' : s.tipo.startsWith('tecnico') ? 'Técnico' : 'Elenco'}</span>
            <strong className="mesa31__titulo">{s.titulo}</strong>
            <p className="mesa31__texto">{s.texto}</p>
            <div className="mesa31__opcoes">
              {s.opcoes.map(o => (
                <div key={o.id} className="mesa31__opcao">
                  <BotaoAcao vida={vida} agir={agir} acao={C({ op: 'responder', id: s.id, opcao: o.id })} variante="secundario">{o.texto}</BotaoAcao>
                  {o.dica && <span className="mesa31__dica">{o.dica}</span>}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {hist.length > 0 && (
        <details className="mesa31__hist">
          <summary>O que já se decidiu</summary>
          <ul>{hist.map((h, k) => <li key={k}><span className="clube30__ano">{h.ano}</span> <strong>{h.titulo}</strong>{h.opcao ? ` — ${h.opcao}` : h.ignorado ? ' — sem resposta' : ''}: {h.texto}</li>)}</ul>
        </details>
      )}
    </section>
  );
}

/** O campeonato do clube: as forças da divisão nesta temporada (onde o seu time está), a tabela da última e os campeões. */
function CampeonatoDoClube({ vida }: { vida: Vida }) {
  const c = vida.clube20!;
  const div = ligaDe(vida, c.pais).div[c.nome] ?? 1;
  // VIDA 31.2: a temporada que vem (a última fechada + 1) — a mesma régua das carreiras de atleta e de técnico.
  const ano = (ultimaTemporadaDoPais(vida, c.pais)?.ano ?? temporadaCorrente(vida) - 1) + 1;
  const anos = Object.keys(c.forcaPorAno).map(Number).filter(a => a <= ano).sort((a, b) => b - a);
  const minha = anos.length ? c.forcaPorAno[anos[0]] : undefined;
  const rivais = clubesNaDivisao(vida, div, c.nome, c.pais).map(k => ({ nome: k.nome, forca: Math.round((forcaNaLiga(k.nome, c.pais) + formaNaLiga(vida, c.pais, k.nome)) * 100) / 100 }));
  const todos = [...rivais, ...(minha !== undefined ? [{ nome: c.nome, forca: minha }] : [])].sort((a, b) => b.forca - a.forca);
  const n = todos.length;
  // Empate é empate (a força é uma régua; diferença de arredondamento não é posição).
  const pos = minha === undefined ? 0 : 1 + todos.filter(x => x.nome !== c.nome && x.forca > minha + 0.05).length;
  const empatados = minha === undefined ? 0 : todos.filter(x => x.nome !== c.nome && Math.abs(x.forca - minha) <= 0.05).length;
  const mediaRivais = rivais.length ? rivais.reduce((t, x) => t + x.forca, 0) / rivais.length : 0;
  const dif = minha === undefined ? 0 : minha - mediaRivais;
  const expectativa = dif > 0.45 ? 'favorito ao título' : dif > 0.15 ? 'brigar pelas primeiras posições' : dif < -0.35 ? 'fugir da zona de queda' : 'meio de tabela — a temporada decide';
  const max = Math.max(...todos.map(x => x.forca)), min = Math.min(...todos.map(x => x.forca));
  const largura = (f: number) => (max - min < 0.05 ? 70 : 20 + ((f - min) / (max - min)) * 80);
  const h = c.historico[c.historico.length - 1];
  return (
    <div className="camp31">
      <section className="cmd31__bloco" aria-labelledby="camp31-agora">
        <h4 id="camp31-agora">{divisaoDoNivel(div, c.pais) || 'A divisão'} {ano} · as forças da temporada</h4>
        {pos ? <p className="nota">Pelo elenco, o técnico e o vestiário, {oClube(c.nome)} é {empatados ? `uma das forças empatadas na ${pos}ª posição (com mais ${empatados})` : `a ${pos}ª força`} de {n}: a expectativa é <strong>{expectativa}</strong>. A tabela de verdade sai jogo a jogo — a força é a tendência, não o resultado. Reforços acima da média do elenco, o técnico e o vestiário mudam essa régua.</p> : <p className="nota">A força do clube aparece quando a temporada começa.</p>}
        <ol className="camp31__forcas">
          {todos.slice(0, 20).map((x, k) => (
            <li key={x.nome} className={x.nome === c.nome ? 'camp31__seu' : undefined}>
              <span className="camp31__pos">{k + 1}</span><Escudo30 nome={x.nome} tamanho={20} /><span className="camp31__nome">{x.nome}</span>
              <span className="camp31__barra" aria-hidden><i style={{ width: `${largura(x.forca)}%` }} /></span>
            </li>
          ))}
        </ol>
      </section>
      {h && h.divisao >= 2 ? <TabelaDoCampeonato vida={vida} paisId={c.pais} nivel={h.divisao} destaque={c.nome} /> : <p className="nota">A tabela da temporada aparece aqui quando ela fechar.</p>}
      <CampeoesDoPais vida={vida} paisId={c.pais} />
    </div>
  );
}
