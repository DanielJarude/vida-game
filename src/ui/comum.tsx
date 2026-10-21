/** Peças comuns da interface. */

import { useEffect, useId, useRef, useState, type KeyboardEvent as TeclaReact, type ReactNode } from 'react';
import type { Vida } from '../motor/tipos';
import { disponibilidade, type Acao } from '../motor/acoes';
import { podeTentar } from '../motor/plausibilidade';
import { dinheiroCurto, palavraChance } from './apresentar';
import { formatarDinheiroCheio, formatarDinheiroCurto } from '../motor/mundo/moeda';

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
  /** REWORK 9: o aviso "pode, mas custa" já foi dito uma vez para o grupo (não repetir embaixo de cada botão). */
  semAviso?: boolean;
}

/** Botão ligado ao motor: pergunta a disponibilidade e explica o bloqueio. */
export function BotaoAcao({ vida, acao, agir, children, variante = 'secundario', mostrarChance, aoAgir, ocultarImpossivel, ocultarBloqueado, semAviso }: BotaoAcaoProps) {
  const d = disponibilidade(vida, acao);
  const pode = podeTentar(d);
  if (ocultarImpossivel && d.grau === 'impossivel') return null;
  if (ocultarBloqueado && !pode) return null;
  // REWORK 4: o 'pode, mas custa' (a semana que passa do que cabe) também é dito antes.
  const aviso = d.grau === 'irregular' || d.grau === 'improvavel' || d.grau === 'permitido' ? d.motivo : undefined;
  const chance = mostrarChance && pode && d.chance !== undefined ? palavraChance(d.chance) : undefined;
  // Falta só na conta, e as aplicações cobrem: a saída aparece — com o que sai, dito antes. Nada é vendido sem este clique.
  const comResgate: Acao | undefined = !pode && d.resgate ? { tipo: 'resgatar_e', acao } : undefined;
  const podeResgatar = comResgate ? podeTentar(disponibilidade(vida, comResgate)) : false;
  return (
    <div className={`acao acao--${variante}${pode ? '' : ' acao--bloqueada'}`}>
      <button type="button" className={`botao botao--${variante}`} disabled={!pode} onClick={() => { if (agir(acao)) aoAgir?.(); }}>
        <span>{children}</span>
        {chance && <span className="botao__chance">{chance}</span>}
      </button>
      {!pode && d.motivo && <p className="acao__motivo">{d.motivo}</p>}
      {comResgate && podeResgatar && <button type="button" className="botao botao--discreto acao__resgate" onClick={() => { if (agir(comResgate)) aoAgir?.(); }}>Tirar {dinheiroCurto(d.resgate!.valor)} das aplicações e pagar</button>}
      {pode && aviso && !semAviso && <p className="acao__aviso">{aviso}</p>}
    </div>
  );
}

/**
 * REWORK 6.5 — teclado nas abas (o padrão de `tablist`): setas esquerda/direita, Home e End passam de aba e levam o
 * foco junto. Vai no `onKeyDown` do contêiner `role="tablist"` (delegação: as abas não precisam saber umas das outras).
 */
export function navegarAbas(e: TeclaReact<HTMLElement>) {
  const abas = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])')];
  const k = abas.indexOf(document.activeElement as HTMLElement);
  if (k < 0) return;
  const destino = e.key === 'ArrowRight' ? (k + 1) % abas.length : e.key === 'ArrowLeft' ? (k - 1 + abas.length) % abas.length : e.key === 'Home' ? 0 : e.key === 'End' ? abas.length - 1 : -1;
  if (destino < 0) return;
  e.preventDefault();
  abas[destino].focus();
  abas[destino].click();
}

export function Secao({ titulo, children, recolhivel, aberta: abertaInicial = true, extra, id }: { titulo: string; children: ReactNode; recolhivel?: boolean; aberta?: boolean; extra?: ReactNode; id?: string }) {
  const [aberta, setAberta] = useState(abertaInicial);
  const idConteudo = useId();
  return (
    <section className={`secao${recolhivel ? ` secao--recolhivel${aberta ? '' : ' secao--fechada'}` : ''}`} id={id}>
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
export function Folio({ kicker, titulo, lede, children, compacto }: { kicker: ReactNode; titulo: ReactNode; lede?: ReactNode; children?: ReactNode; compacto?: boolean }) {
  // `compacto` (REWORK 9): o cabeçalho de um lado dentro de uma página (Caminhos) — h2, sem o peso de abertura.
  const T = compacto ? 'h2' : 'h1';
  return (
    <header className={compacto ? 'folio folio--compacto' : 'folio'}>
      <p className="folio__kicker">{kicker}</p>
      <T className="folio__titulo">{titulo}</T>
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

export interface AcaoViva { id: string; rotulo: string; porque?: string; aviso?: string; acao?: Acao; ir?: string; saida?: boolean; bloqueado?: string }

/** Ações contextuais: poucas, com o porquê, cada uma uma linha — não uma parede de botões. */
export function AcoesVivas({ acoes, agir, ir, rotulo }: { acoes: AcaoViva[]; agir: (a: Acao) => boolean; ir?: (destino: string) => void; rotulo: string }) {
  if (!acoes.length) return null;
  return (
    <ul className="acoes-vivas" aria-label={rotulo}>
      {acoes.map(x => (
        <li key={x.id}>
          <button type="button" className={`acao-viva${x.saida ? ' acao-viva--saida' : ''}${x.ir ? ' acao-viva--lugar' : ''}${x.bloqueado ? ' acao-viva--bloqueada' : ''}`} disabled={!!x.bloqueado} onClick={() => { if (x.acao) agir(x.acao); else if (x.ir) ir?.(x.ir); }}>
            <span className="acao-viva__rotulo">{x.rotulo}</span>
            {x.bloqueado ? <span className="acao-viva__porque acao-viva__motivo">{x.bloqueado}</span> : x.porque && <span className="acao-viva__porque">{x.porque}</span>}
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

/**
 * Dar nome ao que é seu (a banda, o negócio, a obra): o nome sugerido fica,
 * a não ser que a pessoa troque. Um campo curto, no lugar — sem abrir tela.
 */
export function Renomear({ vida, agir, alvo, atual, k, rotulo = 'Renomear' }: { vida: Vida; agir: (a: Acao) => boolean; alvo: 'grupo' | 'negocio' | 'obra'; atual: string; k?: number; rotulo?: string }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(atual);
  if (!aberto) return <button type="button" className="link renomear__abrir" onClick={() => { setNome(atual); setAberto(true); }}>{rotulo}</button>;
  return (
    <form className="renomear" onSubmit={e => { e.preventDefault(); if (agir({ tipo: 'renomear', alvo, nome, k } as Acao)) setAberto(false); }}>
      <label className="campo"><span className="campo__rotulo">Novo nome</span><input type="text" value={nome} maxLength={40} onChange={e => setNome(e.target.value)} autoFocus /></label>
      <button type="submit" className="botao botao--secundario" disabled={!podeTentar(disponibilidade(vida, { tipo: 'renomear', alvo, nome, k } as Acao))}>Salvar o nome</button>
      <button type="button" className="botao botao--discreto" onClick={() => setAberto(false)}>Manter "{atual}"</button>
    </form>
  );
}

/**
 * REWORK 7 — OS DEGRAUS de uma habilidade: os seis estágios que o motor já usa para falar dela (`dados/frentes`), em
 * altura crescente — o de hoje aceso, os que ficaram para trás cheios, o auge (quando já se esteve mais alto) marcado
 * com um contorno. Não é uma barra de progresso: cada degrau é uma frase real ("toca bem", "se apresenta"), e a
 * palavra vem sempre escrita ao lado.
 */
export function Degraus({ estagio, auge, rotulo, palavra, compacto, total = 6 }: { estagio: number; auge?: number; rotulo: string; palavra: string; compacto?: boolean; total?: number }) {
  const topo = Math.max(estagio, auge ?? 0);
  return (
    <span className={`degraus${compacto ? ' degraus--compacto' : ''}`} role="img" aria-label={`${rotulo}: ${palavra}${auge !== undefined && auge > estagio ? ' (já esteve melhor)' : ''}`}>
      <span className="degraus__escada" aria-hidden style={{ gridTemplateColumns: `repeat(${total}, var(--degrau-largura, 7px))` }}>
        {Array.from({ length: total }, (_, k) => <span key={k} className={`degraus__degrau${k <= estagio ? ' degraus__degrau--feito' : ''}${k === estagio ? ' degraus__degrau--agora' : ''}${k > estagio && k <= topo ? ' degraus__degrau--auge' : ''}`} style={{ height: `${30 + k * (70 / Math.max(1, total - 1))}%` }} />)}
      </span>
      {!compacto && <span className="degraus__palavra">{palavra}</span>}
    </span>
  );
}

/** Um passo de uma trajetória: quando, o quê, quanto pesou. */
export interface Passo { chave: string; quando: ReactNode; texto: ReactNode; peso?: 1 | 2 | 3; tipo?: string; agora?: boolean }

/**
 * REWORK 7 — O PERCURSO: a mesma forma para qualquer trajetória contada (a atividade, a carreira, a relação, a
 * formação): um fio vertical, o ano na margem, o que pesou mais com mais tinta. É a camada 3 (o histórico), sempre
 * com poucos passos visíveis e o resto a um toque.
 */
export function Percurso({ passos, rotulo, mostrar = 5, vazio }: { passos: Passo[]; rotulo: string; mostrar?: number; vazio?: ReactNode }) {
  const [todos, setTodos] = useState(false);
  if (!passos.length) return vazio ? <p className="vazio">{vazio}</p> : null;
  const visiveis = todos ? passos : passos.slice(0, mostrar);
  return (
    <div className="percurso">
      <ol className="percurso__lista" aria-label={rotulo}>
        {visiveis.map(p => (
          <li key={p.chave} className={`percurso__passo percurso__passo--p${p.peso ?? 1}${p.tipo ? ` percurso__passo--${p.tipo}` : ''}${p.agora ? ' percurso__passo--agora' : ''}`}>
            <span className="percurso__quando">{p.quando}</span>
            <span className="percurso__texto">{p.texto}</span>
          </li>
        ))}
      </ol>
      {passos.length > mostrar && <button type="button" className="botao botao--discreto percurso__mais" aria-expanded={todos} onClick={() => setTodos(x => !x)}>{todos ? 'Mostrar menos' : `Toda a história (${passos.length})`}</button>}
    </div>
  );
}

/**
 * REWORK 5 — um valor em dinheiro que CABE (o playtest viu valores passando da tela do celular). Até 13 caracteres, o
 * valor inteiro; acima, a forma curta ("R$ 12,4 mi") — e um toque mostra o valor completo (consultável, nunca escondido).
 */
export function Valor({ valor, className }: { valor: number; className?: string }) {
  const [cheio, setCheio] = useState(false);
  const inteiro = formatarDinheiroCheio(valor);
  if (inteiro.length <= 13) return <strong className={className}>{inteiro}</strong>;
  const curto = formatarDinheiroCurto(valor, undefined, 'auto');
  return (
    <button type="button" className={`valor-toque${className ? ` ${className}` : ''}`} onClick={() => setCheio(x => !x)} aria-label={`${inteiro} (toque para ${cheio ? 'abreviar' : 'ver o valor completo'})`} title={inteiro}>
      {cheio ? inteiro : curto}
    </button>
  );
}

/* ------------------------------------------------------------ REWORK 10 · Fase B: a organização de cada área */

export interface ItemDeSubnav<T extends string> { id: T; rotulo: string; oque?: string; conta?: number }

/**
 * As partes de uma área (o mesmo padrão de abas de Pessoas, Minha Semana e Vida: `role=tablist`, setas do teclado). A
 * parte aberta é guardada por quem chama (o Jogo), para voltar à área ser voltar para onde se estava.
 */
export function Subnav<T extends string>({ rotulo, itens, atual, aoMudar, prefixo, classe }: { rotulo: string; itens: ItemDeSubnav<T>[]; atual: T; aoMudar: (id: T) => void; prefixo: string; classe?: string }) {
  return (
    <nav className={`subnav${classe ? ` ${classe}` : ''}`} aria-label={rotulo}>
      <ul role="tablist" className="subnav__lista" onKeyDown={navegarAbas}>
        {itens.map(x => (
          <li key={x.id} role="presentation">
            <button type="button" role="tab" id={`${prefixo}-aba-${x.id}`} aria-selected={atual === x.id} aria-controls={atual === x.id ? `${prefixo}-painel` : undefined} tabIndex={atual === x.id ? 0 : -1}
              className={`subnav__item${atual === x.id ? ' subnav__item--ativo' : ''}`} onClick={() => aoMudar(x.id)} title={x.oque}>
              {x.rotulo}{x.conta !== undefined && x.conta > 0 ? <span className="subnav__conta">{x.conta}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface FatoDaArea { rotulo: string; valor: ReactNode; tom?: 'bom' | 'ruim' }

/**
 * A CABEÇA DE UMA ÁREA (REWORK 10 · UX-13): toda área responde, no alto e na mesma ordem, às cinco perguntas — onde estou
 * (a área e a parte), qual é a minha situação (o título e dois a quatro fatos), o que aconteceu há pouco (o mais recente
 * da Linha da Vida naquele assunto) e qual é o próximo passo (um só, levando ao lugar dele). O que dá para fazer vem
 * logo abaixo, agrupado. Nada de painel: é a folha de rosto da área.
 */
export function CabecaDaArea({ area, kicker, titulo, fatos, recente, proximo, retrato }: {
  area: string; kicker?: ReactNode; titulo: ReactNode; fatos?: FatoDaArea[];
  recente?: { quando: string; texto: string }; proximo?: { texto: string; rotulo?: string; ir?: () => void }; retrato?: ReactNode;
}) {
  return (
    <header className={`cabeca-area${retrato ? ' cabeca-area--com-retrato' : ''}`}>
      {retrato && <div className="cabeca-area__retrato">{retrato}</div>}
      <div className="cabeca-area__texto">
        <p className="folio__kicker"><span className="folio__area">{area}</span>{kicker ? <> · {kicker}</> : null}</p>
        <h1 className="cabeca-area__titulo">{titulo}</h1>
        {fatos && fatos.length > 0 && (
          <dl className="cabeca-area__fatos">
            {fatos.map(f => <div key={f.rotulo} className={f.tom ? `cabeca-area__fato--${f.tom}` : undefined}><dt>{f.rotulo}</dt><dd>{f.valor}</dd></div>)}
          </dl>
        )}
      </div>
      {(recente || proximo) && (
        <div className="cabeca-area__rodape">
          {recente && <p className="cabeca-area__recente"><span className="cabeca-area__rotulo">Há pouco</span><span className="cabeca-area__quando">{recente.quando}</span> {recente.texto}</p>}
          {proximo && (
            <p className="cabeca-area__proximo">
              <span className="cabeca-area__rotulo">Próximo passo</span>
              <span>{proximo.texto}</span>
              {proximo.ir && <button type="button" className="link cabeca-area__ir" onClick={proximo.ir}>{proximo.rotulo ?? 'Ir'} →</button>}
            </p>
          )}
        </div>
      )}
    </header>
  );
}

/** A tela é estreita (o painel "Agora" do lado não aparece)? Sem `matchMedia` (os testes), é larga: nada se duplica. */
export function useEstreito(limite = 1180): boolean {
  const consulta = `(max-width: ${limite}px)`;
  const [estreito, setEstreito] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(consulta).matches);
  useEffect(() => {
    const m = typeof window !== 'undefined' ? window.matchMedia?.(consulta) : undefined;
    if (!m) return undefined;
    const mudou = () => setEstreito(m.matches);
    m.addEventListener?.('change', mudou);
    return () => m.removeEventListener?.('change', mudou);
  }, [consulta]);
  return estreito;
}
