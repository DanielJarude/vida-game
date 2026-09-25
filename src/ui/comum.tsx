/** Peças comuns da interface. */

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Vida } from '../motor/tipos';
import { disponibilidade, type Acao } from '../motor/acoes';
import { podeTentar } from '../motor/plausibilidade';
import { palavraChance } from './apresentar';

interface BotaoAcaoProps {
  vida: Vida;
  acao: Acao;
  agir: (a: Acao) => boolean;
  children: ReactNode;
  variante?: 'principal' | 'secundario' | 'discreto' | 'perigo';
  /** Mostrar a chance em palavras quando o motor informar. */
  mostrarChance?: boolean;
  aoAgir?: () => void;
  /** Esconde o botão quando a ação é impossível (em vez de mostrar bloqueado). */
  ocultarImpossivel?: boolean;
  /** Esconde sempre que não der para fazer (opções secundárias que só poluiriam). */
  ocultarBloqueado?: boolean;
}

/** Botão ligado ao motor: pergunta a disponibilidade e explica o bloqueio. */
export function BotaoAcao({ vida, acao, agir, children, variante = 'secundario', mostrarChance, aoAgir, ocultarImpossivel, ocultarBloqueado }: BotaoAcaoProps) {
  const d = disponibilidade(vida, acao);
  const pode = podeTentar(d);
  if (ocultarImpossivel && d.grau === 'impossivel') return null;
  if (ocultarBloqueado && !pode) return null;
  const aviso = d.grau === 'irregular' || d.grau === 'improvavel' ? d.motivo : undefined;
  const chance = mostrarChance && pode && d.chance !== undefined ? palavraChance(d.chance) : undefined;
  return (
    <div className={`acao acao--${variante}${pode ? '' : ' acao--bloqueada'}`}>
      <button type="button" className={`botao botao--${variante}`} disabled={!pode} onClick={() => { if (agir(acao)) aoAgir?.(); }}>
        <span>{children}</span>
        {chance && <span className="botao__chance">{chance}</span>}
      </button>
      {!pode && d.motivo && <p className="acao__motivo">{d.motivo}</p>}
      {pode && aviso && <p className="acao__aviso">{aviso}</p>}
    </div>
  );
}

export function Secao({ titulo, children, recolhivel, aberta: abertaInicial = true, extra, id }: { titulo: string; children: ReactNode; recolhivel?: boolean; aberta?: boolean; extra?: ReactNode; id?: string }) {
  const [aberta, setAberta] = useState(abertaInicial);
  const idConteudo = useId();
  return (
    <section className="secao" id={id}>
      <header className="secao__cabeca">
        {recolhivel ? (
          <button type="button" className="secao__titulo secao__titulo--botao" aria-expanded={aberta} aria-controls={idConteudo} onClick={() => setAberta(a => !a)}>
            {titulo}<svg className={`secao__seta${aberta ? ' secao__seta--aberta' : ''}`} viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        ) : <h2 className="secao__titulo">{titulo}</h2>}
        {extra}
      </header>
      {(!recolhivel || aberta) && <div id={idConteudo} className="secao__corpo">{children}</div>}
    </section>
  );
}

/** Folha modal: prende o foco, fecha com Esc (quando permitido). */
export function Folha({ titulo, rotulo, children, aoFechar, fechavel = true, largura = 'media', papel }: { titulo?: ReactNode; rotulo: string; children: ReactNode; aoFechar?: () => void; fechavel?: boolean; largura?: 'media' | 'larga'; papel?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const primeiro = ref.current?.querySelector<HTMLElement>('button:not([disabled]), [href], input, select');
    primeiro?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fechavel) aoFechar?.();
      if (e.key === 'Tab' && ref.current) {
        const foco = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea')];
        if (foco.length === 0) return;
        const [a, z] = [foco[0], foco[foco.length - 1]];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', tecla);
    document.body.classList.add('com-folha');
    return () => {
      document.removeEventListener('keydown', tecla);
      document.body.classList.remove('com-folha');
      anterior?.focus?.();
    };
  }, [aoFechar, fechavel]);
  return (
    <div className="veu" onClick={e => { if (e.target === e.currentTarget && fechavel) aoFechar?.(); }}>
      <div className={`folha folha--${largura}${papel ? ' folha--papel' : ''}`} role="dialog" aria-modal="true" aria-label={rotulo} ref={ref}>
        {(titulo || fechavel) && (
          <div className="folha__topo">
            {titulo && <div className="folha__titulo">{titulo}</div>}
            {fechavel && aoFechar && <button type="button" className="folha__fechar" onClick={aoFechar} aria-label="Fechar">×</button>}
          </div>
        )}
        <div className="folha__corpo">{children}</div>
      </div>
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="vazio">{children}</p>;
}

export function Linha({ rotulo, valor, tom }: { rotulo: ReactNode; valor: ReactNode; tom?: 'bom' | 'ruim' }) {
  return (
    <div className={`linha${tom ? ` linha--${tom}` : ''}`}>
      <span className="linha__rotulo">{rotulo}</span>
      <span className="linha__valor">{valor}</span>
    </div>
  );
}

export function Escolha<T extends string>({ opcoes, valor, aoMudar, rotulo }: { opcoes: { id: T; rotulo: string }[]; valor: T; aoMudar: (v: T) => void; rotulo: string }) {
  return (
    <div className="escolha" role="radiogroup" aria-label={rotulo}>
      {opcoes.map(o => (
        <button key={o.id} type="button" role="radio" aria-checked={valor === o.id} className={`escolha__item${valor === o.id ? ' escolha__item--ativo' : ''}`} onClick={() => aoMudar(o.id)}>
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}

/**
 * O alto de cada página: uma linha pequena no tom da área (onde se está),
 * um título grande e contextual (o que é a vida agora) e, às vezes, uma
 * frase. Composição editorial, não cabeçalho de painel.
 */
export function Folio({ kicker, titulo, lede, children }: { kicker: ReactNode; titulo: ReactNode; lede?: ReactNode; children?: ReactNode }) {
  return (
    <header className="folio">
      <p className="folio__kicker">{kicker}</p>
      <h1 className="folio__titulo">{titulo}</h1>
      {lede && <p className="folio__lede">{lede}</p>}
      {children}
    </header>
  );
}

/**
 * Um medidor que não depende de cor: marcas cheias e vazias, a palavra ao
 * lado, e (opcionalmente) um limite desenhado — até onde dá para ir hoje.
 */
export function Medidor({ valor, rotulo, palavra, limite, marcas = 10 }: { valor: number; rotulo: string; palavra: string; limite?: number; marcas?: number }) {
  const cheias = Math.round(Math.max(0, Math.min(100, valor)) / 100 * marcas);
  const teto = limite !== undefined && limite < 100 ? Math.round(limite / 100 * marcas) : undefined;
  return (
    <div className="medidor-vivo" role="img" aria-label={`${rotulo}: ${palavra}${teto !== undefined ? ` (há um limite antes do máximo)` : ''}`}>
      <span className="medidor-vivo__rotulo">{rotulo}</span>
      <span className="medidor-vivo__marcas" aria-hidden>
        {Array.from({ length: marcas }, (_, k) => <span key={k} className={`medidor-vivo__marca${k < cheias ? ' medidor-vivo__marca--cheia' : ''}${teto !== undefined && k >= teto ? ' medidor-vivo__marca--alem' : ''}`} />)}
      </span>
      <span className="medidor-vivo__palavra">{palavra}</span>
    </div>
  );
}

export interface AcaoViva { id: string; rotulo: string; porque?: string; aviso?: string; acao?: Acao; ir?: string; saida?: boolean }

/** Ações contextuais: poucas, com o porquê, cada uma uma linha — não uma parede de botões. */
export function AcoesVivas({ acoes, agir, ir, rotulo }: { acoes: AcaoViva[]; agir: (a: Acao) => boolean; ir?: (destino: string) => void; rotulo: string }) {
  if (!acoes.length) return null;
  return (
    <ul className="acoes-vivas" aria-label={rotulo}>
      {acoes.map(x => (
        <li key={x.id}>
          <button type="button" className={`acao-viva${x.saida ? ' acao-viva--saida' : ''}${x.ir ? ' acao-viva--lugar' : ''}`} onClick={() => { if (x.acao) agir(x.acao); else if (x.ir) ir?.(x.ir); }}>
            <span className="acao-viva__rotulo">{x.rotulo}</span>
            {x.porque && <span className="acao-viva__porque">{x.porque}</span>}
            {x.aviso && <span className="acao-viva__aviso">{x.aviso}</span>}
            <span className="acao-viva__seta" aria-hidden>{x.ir ? '↗' : '→'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Um dado em palavras, numa faixa editorial (sem caixa). */
export function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return <div className="dado"><dt>{rotulo}</dt><dd>{children}</dd></div>;
}
