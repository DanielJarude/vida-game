/**
 * VIDA 31 · A PÁGINA INICIAL DE UMA ÁREA — o molde da Minha Trajetória (Caminhos), agora para Vida, Pessoas e Eu:
 *
 *   o alto      quem/onde, numa frase (e, quando a área tem, a cena viva: a rua, a constelação, o retrato)
 *   Agora       o que está acontecendo, em cartões (cada um leva à seção dele)
 *   Próximos    o que dá para fazer a seguir (o que o motor já sugere primeiro)
 *   Pede você   o que tem prazo ou pede atenção (quando há)
 *   Explorar    todas as seções da área, com busca — nenhuma some
 *
 * Só leitura do estado e navegação: nenhum cartão inventa número; cada ação abre o lugar onde ela sempre esteve.
 */
import { useState, type ReactNode } from 'react';

export interface CartaoAgora31 { id: string; rotulo: string; titulo: string; detalhe?: string; icone?: string; ir?: () => void; tom?: 'bom' | 'ruim' | 'alerta' }
export interface Passo31 { id: string; rotulo: string; nota?: string; ir: () => void; destaque?: boolean }
export interface Destino31 { id: string; rotulo: string; oque: string; estado?: string; icone?: string; ir: () => void }
/** As abas da área, escondidas no início (a navegação por teclado e os atalhos antigos continuam chegando às seções). */
export interface AbaOculta31 { id: string; rotulo: string; ir: () => void }

export function Icone31({ d, classe = 'traj31__icone' }: { d: string; classe?: string }) {
  return <svg className={classe} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export function Inicio31({ area, classe, kicker, titulo, lede, cena, agora, passos, pede, tituloPede = 'Pede você', destinos, tituloExplorar, buscaDica, abas, rotuloAbas, depois }: {
  area: string; classe: string; kicker: string; titulo: string; lede?: string; cena?: ReactNode;
  agora: CartaoAgora31[]; passos: Passo31[]; pede?: Passo31[]; tituloPede?: string;
  destinos: Destino31[]; tituloExplorar: string; buscaDica: string;
  abas?: AbaOculta31[]; rotuloAbas?: string;
  /** Algo da área que fica no fim da página inicial (a constelação, o calendário). */
  depois?: ReactNode;
}) {
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const achados = destinos.filter(d => !termo || `${d.rotulo} ${d.oque} ${d.estado ?? ''}`.toLowerCase().includes(termo));
  const idb = classe;
  return (
    <div className={`traj31 inicio31 ${classe}`}>
      {abas && (
        <nav className="inicio31__abas-ocultas" aria-label={rotuloAbas}>
          <ul role="tablist">{abas.map(a => <li key={a.id} role="presentation"><button type="button" role="tab" aria-selected={false} onClick={a.ir}>{a.rotulo}</button></li>)}</ul>
        </nav>
      )}
      <header className="folio traj31__cabeca">
        <p className="folio__kicker"><span className="folio__area">{area}</span> · {kicker}</p>
        <h1 className="folio__titulo">{titulo}</h1>
        {lede && <p className="folio__lede">{lede}</p>}
      </header>
      {cena && <div className="inicio31__cena">{cena}</div>}

      {agora.length > 0 && (
        <section className="traj31__bloco" aria-labelledby={`${idb}-agora`}>
          <h2 id={`${idb}-agora`} className="traj31__titulo">Agora</h2>
          <ul className="inicio31__agora">
            {agora.map(c => (
              <li key={c.id}>
                {c.ir
                  ? <button type="button" className={`inicio31__cartao${c.tom ? ` inicio31__cartao--${c.tom}` : ''}`} data-cartao={c.id} onClick={c.ir}><CorpoDoCartao c={c} /></button>
                  : <div className={`inicio31__cartao${c.tom ? ` inicio31__cartao--${c.tom}` : ''}`} data-cartao={c.id}><CorpoDoCartao c={c} /></div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pede && pede.length > 0 && (
        <section className="traj31__bloco" aria-labelledby={`${idb}-pede`}>
          <h2 id={`${idb}-pede`} className="traj31__titulo">{tituloPede} <span className="traj31__conta">{pede.length}</span></h2>
          <ul className="traj31__portas">
            {pede.map(x => <li key={x.id}><button type="button" className="traj31__porta" onClick={x.ir}><strong>{x.rotulo}</strong>{x.nota && <span>{x.nota}</span>}</button></li>)}
          </ul>
        </section>
      )}

      {passos.length > 0 && (
        <section className="traj31__bloco" aria-labelledby={`${idb}-passos`}>
          <h2 id={`${idb}-passos`} className="traj31__titulo">Próximos passos</h2>
          <ul className="traj31__passos">
            {passos.map(x => (
              <li key={x.id}>
                <button type="button" className={`traj31__passo${x.destaque ? ' traj31__passo--destaque' : ''}`} data-passo={x.id} onClick={x.ir}>
                  <span className="traj31__passo-rotulo">{x.rotulo}</span>{x.nota && <span className="traj31__passo-nota">{x.nota}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="traj31__bloco traj31__explorar" aria-labelledby={`${idb}-explorar`}>
        <h2 id={`${idb}-explorar`} className="traj31__titulo">{tituloExplorar}</h2>
        {destinos.length > 5 && <label className="traj31__busca"><span className="sr-only">Procurar</span><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder={buscaDica} /></label>}
        <ul className="entradas-caminhos traj31__lista inicio31__lista">
          {achados.map(d => (
            <li key={d.id} className={`entrada-caminho inicio31__destino inicio31__destino--${d.id}`}>
              <button type="button" className="entrada-caminho__botao" data-destino={d.id} onClick={d.ir}>
                {d.icone && <Icone31 d={d.icone} />}
                <span className="entrada-caminho__nome">{d.rotulo}</span>
                {d.estado && <span className="entrada-caminho__estado">{d.estado}</span>}
                <span className="entrada-caminho__oque">{d.oque}</span>
              </button>
            </li>
          ))}
          {!achados.length && <li className="nota">Nada com “{busca}” aqui. A busca do Menu (Onde fica cada coisa) procura em todo o jogo.</li>}
        </ul>
      </section>
      {depois}
    </div>
  );
}

function CorpoDoCartao({ c }: { c: CartaoAgora31 }) {
  return (
    <>
      {c.icone && <Icone31 d={c.icone} />}
      <span className="inicio31__cartao-rotulo">{c.rotulo}</span>
      <strong className="inicio31__cartao-titulo">{c.titulo}</strong>
      {c.detalhe && <span className="inicio31__cartao-detalhe">{c.detalhe}</span>}
    </>
  );
}

/** A volta para a página inicial da área (no alto de cada seção). */
export function Voltar31({ rotulo, ir }: { rotulo: string; ir: () => void }) {
  return <button type="button" className="traj31__voltar" onClick={ir}>← {rotulo}</button>;
}
