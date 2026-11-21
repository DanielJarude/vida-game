/**
 * VIDA 32 · Patrimônio · Empresas · Esporte — tudo o que é time seu num lugar: o clube de futebol (comprado ou
 * fundado), os times de quadra (basquete, vôlei, futsal) e a organização de e-sports; e a fundação de um time novo.
 */
import { useMemo, useState, type ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { anoDe } from '../../../motor/tempo';
import { cidadesNoMapa, nomeLugar, paisDaCidade } from '../../../motor/dados/lugares';
import { previaDaFundacao33 } from '../../../motor/v20/clubes/clubes20';
import {
  contextoEquipe33, custoDoGinasio32, custoDoReforco32, MODALIDADES32, nomeDaDivisao32, nomeDaModalidade32, previaDaEquipe33, tecnicosDaEquipe32,
  type Equipe32, type Modalidade32
} from '../../../motor/v32/equipes/equipe32';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { Escudo30, registrarIdentidades33 } from '../../v30/escudos/Escudo30';
import type { Identidade33 } from '../../../motor/v33/dono/identidade33';
import { EditorIdentidade33, identidadeInicial33 } from '../../v33/dono/EditorIdentidade33';
import { camisaDaIdentidade33, DesenhoCamisa33 } from '../../v33/dono/Camisa33';
import { Investimento33, PainelDono33, type Foco33 } from '../../v33/dono/PainelDono33';
import './esporte32.css';
import { NavTime34 } from '../../v34/esporte/NavTime34';
import { Instalacoes34 } from '../../v34/instalacoes/Instalacoes34';

type Agir = (a: Acao) => boolean;
const E = (oque: unknown): Acao => ({ tipo: 'equipe32', oque } as Acao);

/** O bloco de um tipo de time (o título, uma linha do que é, o conteúdo). */
export function BlocoEsporte32({ titulo, icone, nota, children }: { titulo: string; icone: string; nota?: string; children: ReactNode }) {
  return (
    <section className="esp32__bloco" aria-label={titulo}>
      <header className="esp32__cabeca"><span className="esp32__icone" aria-hidden="true">{icone}</span><h3>{titulo}</h3></header>
      {nota && <p className="nota">{nota}</p>}
      {children}
    </section>
  );
}

/** O ícone de cada modalidade (desenho, não emoji: nem toda tela tem a fonte). */
function Bola({ m }: { m: Modalidade32 | 'futebol' }) {
  const traco = m === 'basquete' ? <><path d="M2 12h20M12 2v20" /><path d="M5 5c4 4 4 10 0 14M19 5c-4 4-4 10 0 14" /></> : m === 'volei' ? <><path d="M12 2c0 6 4 9 9 11M3 8c5 1 9 5 9 14M5 19c3-4 8-6 15-5" /></> : <><path d="M12 7l4 3-1.5 4.5h-5L8 10z" /><path d="M12 2v5M16 10l5-1M14.5 14.5l3 4M9.5 14.5l-3 4M8 10l-5-1" /></>;
  return <svg className="esp32__bola" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10" />{traco}</svg>;
}

/** Fundar um time: a modalidade, o nome, a cidade, a identidade (escudo, cores, camisa) e o investimento inicial. */
export function FundarTime32({ vida, agir }: { vida: Vida; agir: Agir }) {
  const [mod, setMod] = useState<Modalidade32 | 'futebol'>(vida.clube20 ? 'basquete' : 'futebol');
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState(vida.moradia.municipioId);
  const [busca, setBusca] = useState('');
  const [ident, setIdent] = useState<Identidade33 | null>(null);
  const [investimento, setInvestimento] = useState(0);
  const [foco, setFoco] = useState<Foco33>('equilibrado');
  const pais = paisDaCidade(vida.moradia.municipioId);
  const sugestoes = useMemo(() => {
    if (busca.trim().length < 2) return [];
    const q = busca.toLowerCase();
    return cidadesNoMapa(pais).filter(m => m.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [busca, pais]);
  if (idade(vida) < 18) return null;
  const nomeVisto = nome.trim() || 'Time novo';
  const identidade = ident ?? identidadeInicial33(nomeVisto, false);
  const paisTime = paisDaCidade(cidade);
  const pf = mod === 'futebol' ? previaDaFundacao33(paisTime, investimento, foco) : undefined;
  const pq = mod !== 'futebol' ? previaDaEquipe33(paisTime, investimento, foco) : undefined;
  const custo = pf?.custo ?? pq!.custo;
  const base = custo - investimento;
  const acao = mod === 'futebol' ? ({ tipo: 'clube20', oque: { op: 'fundar', nome, municipioId: cidade, investimento, foco, identidade } } as Acao) : E({ op: 'fundar', modalidade: mod, nome, municipioId: cidade, investimento, foco, identidade });
  const opcoes: (Modalidade32 | 'futebol')[] = ['futebol', ...MODALIDADES32.map(m => m.id)];
  const cidades = [...new Set([vida.moradia.municipioId, vida.eu.municipioNatal, cidade])].filter(id => { try { return paisDaCidade(id) === pais; } catch { return false; } });
  return (
    <BlocoEsporte32 titulo="Fundar um time" icone="+" nota="Do zero: registro na federação, uniforme, um campo ou uma quadra alugada e um elenco de começo. O time sempre nasce na última divisão — dinheiro não pula divisão —, mas quem investe forte nasce com elenco para subir rápido. (Uma organização de e-sports se funda no bloco E-sports.)">
      <div className="esp32__fichas" role="group" aria-label="Modalidade">
        {opcoes.map(m => <button key={m} type="button" className="vitrine32__ficha" aria-pressed={mod === m} onClick={() => setMod(m)}><Bola m={m} /> {m === 'futebol' ? 'Futebol' : nomeDaModalidade32(m)}</button>)}
      </div>
      <div className="esp32__form">
        <label className="vitrine32__campo vitrine32__campo--busca">Nome do time <input value={nome} maxLength={32} onChange={e => setNome(e.target.value)} placeholder={mod === 'futebol' ? 'ex.: Esporte Clube Aurora' : 'ex.: Aurora Basquete'} /></label>
        <label className="vitrine32__campo">Cidade <select value={cidade} onChange={e => setCidade(e.target.value)}>{cidades.map(id => <option key={id} value={id}>{nomeLugar(id)}</option>)}</select></label>
        <label className="vitrine32__campo">Outra cidade <input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="procurar" /></label>
      </div>
      {sugestoes.length > 0 && (
        <div className="esp32__fichas" role="group" aria-label="Cidades encontradas">
          {sugestoes.map(m => <button key={m.id} type="button" className="vitrine32__ficha vitrine32__ficha--leve" onClick={() => { setCidade(m.id); setBusca(''); }}>{nomeLugar(m.id)}</button>)}
        </div>
      )}
      <details className="esp32__detalhe">
        <summary>Escudo, cores e identidade</summary>
        <EditorIdentidade33 nome={nomeVisto} ident={identidade} mudar={setIdent} tipo={mod === 'futebol' ? 'futebol' : 'quadra'} />
      </details>
      <Investimento33 valor={investimento} mudar={setInvestimento} conta={vida.financas.conta} base={base} foco={foco} mudarFoco={setFoco}>
        {pf && <p className="nota">Elenco de {pf.divisaoAlvo} (média {Math.round(pf.media)}), estádio {'★'.repeat(pf.estadio)}, CT {'★'.repeat(pf.ct)}, base {'★'.repeat(pf.base)}, {dinheiroCurto(pf.caixa)} no caixa. Folha estimada: {dinheiroCurto(pf.folha)} por ano — elenco forte custa todo ano.</p>}
        {pq && <p className="nota">Elenco com força {Math.round(pq.elenco)} (o nível da liga nacional é 70), ginásio {'★'.repeat(pq.ginasio)}, {dinheiroCurto(pq.caixa)} no caixa.</p>}
      </Investimento33>
      <div className="esp32__fundar">
        <div className="esp32__previa">
          <Escudo30 nome={nomeVisto} identidade={identidade} tamanho={56} />
          <DesenhoCamisa33 camisa={camisaDaIdentidade33(identidade, false)} nome={nomeVisto} identidade={identidade} tamanho={64} />
          <div><strong>{nome.trim() || 'Seu time'}</strong><span>{mod === 'futebol' ? 'Futebol' : nomeDaModalidade32(mod)} · {nomeLugar(cidade)}{identidade.apelido ? ` · "${identidade.apelido}"` : ''}</span><span>Total: {dinheiroCurto(custo)}</span></div>
        </div>
        <BotaoAcao vida={vida} agir={agir} acao={acao}>Fundar · {dinheiroCurto(custo)}</BotaoAcao>
      </div>
    </BlocoEsporte32>
  );
}

/** O cartão de um time de quadra: a divisão, a força, o caixa, a última temporada e as ações. */
export function CartaoEquipe32({ vida, agir, e }: { vida: Vida; agir: Agir; e: Equipe32 }) {
  const [aba, setAba] = useState<'acoes' | 'ginasio' | 'negocios' | 'historia'>('acoes');
  const ult = e.historico[e.historico.length - 1];
  const titulos = e.historico.filter(h => h.titulo);
  const tecnicos = tecnicosDaEquipe32(vida, e);
  const ano = anoDe(vida.t);
  return (
    <article className="esp32__equipe">
      <header className="esp32__equipe-topo">
        <Escudo30 nome={e.nome} tamanho={48} />
        <div className="vitrine32__quem"><strong>{e.nome}</strong><span>{nomeDaModalidade32(e.modalidade)} · {e.cidade} · desde {anoDe(e.desde)}</span></div>
        <span className={`vitrine32__div vitrine32__div--${e.nivel + 1}`}>{nomeDaDivisao32(e, e.nivel)}</span>
      </header>
      <dl className="vitrine32__numeros">
        <div><dt>Elenco</dt><dd>{Math.round(e.elenco)}</dd></div>
        <div><dt>Ginásio</dt><dd>{'★'.repeat(e.ginasio)}{e.obra ? ' (obra)' : ''}</dd></div>
        <div><dt>Caixa</dt><dd>{dinheiroCurto(e.caixa)}</dd></div>
        <div><dt>Torcida</dt><dd>{e.torcida}</dd></div>
        {e.divida > 0 && <div><dt>Dívida</dt><dd>{dinheiroCurto(e.divida)}</dd></div>}
        <div><dt>Títulos</dt><dd>{titulos.length}</dd></div>
      </dl>
      <p className="nota">{ult ? `Última temporada (${ult.ano}): ${ult.posicao}º no ${nomeDaDivisao32(e, ult.nivel)}${ult.titulo ? ' — campeão' : ult.acesso ? ' — subiu' : ult.queda ? ' — caiu' : ''}.` : 'A primeira temporada fecha na virada do ano.'} {e.tecnico ? `Técnico: ${e.tecnico.nome} (${'★'.repeat(e.tecnico.nivel)}).` : 'Sem técnico contratado.'}</p>
      <NavTime34 rotulo={`O ${e.nome}`} atual={aba} mudar={setAba} itens={[
        { id: 'acoes', rotulo: 'Comando', grupo: 'Time' },
        { id: 'ginasio', rotulo: 'Ginásio', grupo: 'Time' },
        { id: 'negocios', rotulo: 'Patrocínios, camisa e loja', grupo: 'Negócio' },
        { id: 'historia', rotulo: `Temporadas · ${e.historico.length}`, grupo: 'Histórico' }
      ]} />
      {aba === 'acoes' ? (
        <div className="esp32__acoes">
          <div className="esp32__grupo"><h4>Elenco</h4><div className="clube20__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={E({ op: 'reforco', id: e.id, pesado: false })}>Reforço pontual · {dinheiroCurto(custoDoReforco32(e, false))}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={E({ op: 'reforco', id: e.id, pesado: true })}>Contratações de peso · {dinheiroCurto(custoDoReforco32(e, true))}</BotaoAcao>
          </div></div>
          <div className="esp32__grupo"><h4>Técnico</h4><ul className="cmd31__ofertas">
            {tecnicos.map((t, i) => <li key={i} className="cmd31__oferta"><strong>{t.nome}</strong><span className="cmd31__estrelas">{'★'.repeat(t.nivel)}<i>{'★'.repeat(5 - t.nivel)}</i></span><span className="nota">{dinheiroCurto(t.salario)}/ano</span><BotaoAcao vida={vida} agir={agir} acao={E({ op: 'tecnico', id: e.id, i })} variante="secundario">Contratar</BotaoAcao></li>)}
          </ul></div>
          <div className="esp32__grupo"><h4>Ginásio e dinheiro</h4><div className="clube20__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={E({ op: 'ginasio', id: e.id })}>Ampliar o ginásio · {dinheiroCurto(custoDoGinasio32(e))}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={E({ op: 'aportar', id: e.id, valor: Math.max(1e5, custoDoReforco32(e, false)) })}>Aportar {dinheiroCurto(Math.max(1e5, custoDoReforco32(e, false)))}</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={E({ op: 'vender', id: e.id })} variante="discreto">Vender o time · {dinheiroCurto(Math.max(0, e.valor + e.caixa - e.divida))}</BotaoAcao>
          </div></div>
        </div>
      ) : aba === 'ginasio' ? (
        <Instalacoes34 vida={vida} agir={agir} nome={e.nome} identidade={e.identidade33} inst={e.instalacoes34} acao={sub => E({ op: 'dono', id: e.id, sub })} dados={{ tipo: 'quadra', ginasio: e.ginasio, modalidade: e.modalidade, obra: !!e.obra }} />
      ) : aba === 'negocios' ? (
        <PainelDono33 vida={vida} agir={agir} nome={e.nome} dono={e} ctx={contextoEquipe33(e, ano)} acao={sub => E({ op: 'dono', id: e.id, sub })} anoInicio={anoDe(e.desde)} />
      ) : e.historico.length === 0 ? <p className="vazio">Nenhuma temporada jogada ainda.</p> : (
        <ol className="esp32__temporadas">
          {[...e.historico].reverse().map(h => (
            <li key={h.ano} className={h.titulo ? 'esp32__temp esp32__temp--titulo' : h.acesso ? 'esp32__temp esp32__temp--acesso' : h.queda ? 'esp32__temp esp32__temp--queda' : 'esp32__temp'}>
              <b>{h.ano}</b><span>{nomeDaDivisao32(e, h.nivel)}</span><span>{h.posicao}º{h.titulo ? ' · campeão' : h.acesso ? ' · subiu ▲' : h.queda ? ' · caiu ▼' : ''}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

/** Os times de quadra do dono. */
export function EquipesDeQuadra32({ vida, agir }: { vida: Vida; agir: Agir }) {
  const lista = vida.equipes32 ?? [];
  if (!lista.length) return null;
  registrarIdentidades33(vida);
  return (
    <BlocoEsporte32 titulo={lista.length === 1 ? 'Seu time de quadra' : 'Seus times de quadra'} icone="◎">
      {lista.map(e => <CartaoEquipe32 key={e.id} vida={vida} agir={agir} e={e} />)}
    </BlocoEsporte32>
  );
}
