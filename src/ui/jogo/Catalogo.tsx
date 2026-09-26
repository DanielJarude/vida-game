/**
 * Catálogo: explorar muitas possibilidades sem virar planilha.
 *
 * VIDA tem mais de duzentas ocupações e dezenas de cursos — isso é bom. O
 * que cansa é a parede vertical de texto. Aqui a variedade é descoberta:
 *   - "para você" primeiro, com o motivo;
 *   - busca por palavra;
 *   - filtros curtos (o que está ao alcance, o tipo);
 *   - famílias recolhidas, com a contagem (e quantas estão ao alcance);
 *   - cada item é uma linha; o detalhe (requisitos, duração, perspectiva, o
 *     porquê de estar fora de alcance) abre no lugar.
 * O que está fora de alcance aparece quando se pede — com o motivo, não
 * escondido para parecer simples.
 */

import { useId, useMemo, useState, type ReactNode } from 'react';

export interface ItemCatalogo {
  id: string;
  titulo: string;
  /** A família ou área (o agrupamento). */
  grupo: string;
  /** Uma linha curta: duração, faixa de salário, jornada. */
  meta: string;
  /** Por que está entre as sugestões. */
  motivo?: string;
  possivel: boolean;
  /** Por que não dá agora (quando não dá). */
  bloqueio?: string;
  /** Tipo (para os filtros de tipo). */
  tipo?: string;
  /** Texto extra que a busca procura (sinônimos, área). */
  busca?: string;
  destaque?: boolean;
  /** O que aparece ao abrir: requisitos, perspectiva, as vias. */
  detalhe?: ReactNode;
  /** A ação (um botão), quando dá para tentar. */
  acao?: ReactNode;
}

const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Catalogo({ itens, rotulo, tipos, vazio, porGrupo = 4, dicaBusca }: {
  itens: ItemCatalogo[];
  rotulo: string;
  tipos?: { id: string; rotulo: string }[];
  vazio?: ReactNode;
  porGrupo?: number;
  dicaBusca?: string;
}) {
  const [busca, setBusca] = useState('');
  const [todos, setTodos] = useState(false);
  const [tipo, setTipo] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<Set<string>>(new Set());
  const [inteiros, setInteiros] = useState<Set<string>>(new Set());
  const idBusca = useId();
  const termo = normal(busca.trim());

  const filtrados = useMemo(() => itens.filter(x => (todos || x.possivel) && (!tipo || x.tipo === tipo) && (!termo || normal(`${x.titulo} ${x.grupo} ${x.busca ?? ''} ${x.meta}`).includes(termo))), [itens, todos, tipo, termo]);
  const destaques = filtrados.filter(x => x.destaque).slice(0, 5);
  const resto = filtrados.filter(x => !destaques.includes(x));
  const porNome = useMemo(() => {
    const m = new Map<string, ItemCatalogo[]>();
    for (const x of resto) { const l = m.get(x.grupo) ?? []; l.push(x); m.set(x.grupo, l); }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [resto]);
  const alcance = itens.filter(x => x.possivel).length;
  const alternar = (set: Set<string>, id: string, f: (s: Set<string>) => void) => { const n = new Set(set); if (n.has(id)) n.delete(id); else n.add(id); f(n); };

  const linha = (x: ItemCatalogo) => {
    const aberta = aberto === x.id;
    return (
      <li key={x.id} className={`cat-item${x.possivel ? '' : ' cat-item--fora'}`}>
        <div className="cat-item__linha">
          <button type="button" className="cat-item__cabeca" aria-expanded={aberta} onClick={() => setAberto(aberta ? null : x.id)}>
            <span className="cat-item__titulo">{x.titulo}</span>
            {x.motivo && <span className="cat-item__motivo">{x.motivo}</span>}
            <span className="cat-item__meta">{x.meta}{!x.possivel ? ' · fora de alcance agora' : ''}</span>
          </button>
          {x.possivel && x.acao && !aberta && <div className="cat-item__acao">{x.acao}</div>}
        </div>
        {aberta && (
          <div className="cat-item__detalhe">
            {!x.possivel && x.bloqueio && <p className="cat-item__bloqueio"><span aria-hidden>✕ </span>{x.bloqueio}</p>}
            {x.detalhe}
            {x.possivel && x.acao && <div className="cat-item__acao cat-item__acao--detalhe">{x.acao}</div>}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="catalogo" aria-label={rotulo}>
      <div className="catalogo__ferramentas">
        <label className="catalogo__busca" htmlFor={idBusca}>
          <span className="sr-only">Procurar em {rotulo.toLowerCase()}</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
          <input id={idBusca} type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder={dicaBusca ?? 'Procurar'} autoComplete="off" />
        </label>
        <div className="catalogo__filtros" role="group" aria-label="Filtros">
          <button type="button" className={`filtro${todos ? '' : ' filtro--ativo'}`} aria-pressed={!todos} onClick={() => setTodos(t => !t)}>{todos ? 'Só o que está ao alcance' : `Ao alcance (${alcance})`}</button>
          {tipos?.filter(t => itens.some(x => x.tipo === t.id)).map(t => (
            <button key={t.id} type="button" className={`filtro${tipo === t.id ? ' filtro--ativo' : ''}`} aria-pressed={tipo === t.id} onClick={() => setTipo(tipo === t.id ? null : t.id)}>{t.rotulo}</button>
          ))}
        </div>
        <p className="catalogo__conta" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? 'caminho' : 'caminhos'}{todos ? `, ${filtrados.filter(x => x.possivel).length} ao seu alcance` : ''}{termo ? ` para "${busca.trim()}"` : ''}.</p>
      </div>
      {filtrados.length === 0 && <p className="vazio">{vazio ?? 'Nada com esse filtro.'} {!todos && itens.length > alcance ? <button type="button" className="link" onClick={() => setTodos(true)}>Ver também o que está fora de alcance</button> : null}</p>}
      {destaques.length > 0 && (
        <div className="cat-grupo cat-grupo--destaque">
          <h4 className="cat-grupo__titulo">Para você, agora</h4>
          <ul className="cat-lista">{destaques.map(linha)}</ul>
        </div>
      )}
      {porNome.map(([g, lista]) => {
        const abertoG = !!termo || grupos.has(g) || porNome.length <= 2;
        const mostrar = inteiros.has(g) || termo ? lista : lista.slice(0, porGrupo);
        const ao = lista.filter(x => x.possivel).length;
        return (
          <div key={g} className="cat-grupo">
            <button type="button" className="cat-grupo__botao" aria-expanded={abertoG} onClick={() => alternar(grupos, g, setGrupos)}>
              <span className="cat-grupo__nome">{g.charAt(0).toUpperCase() + g.slice(1)}</span>
              <span className="cat-grupo__conta">{lista.length}{todos && ao < lista.length ? ` · ${ao} ao alcance` : ''}</span>
              <svg className={`secao__seta${abertoG ? ' secao__seta--aberta' : ''}`} viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            {abertoG && (
              <>
                <ul className="cat-lista">{mostrar.map(linha)}</ul>
                {!termo && lista.length > porGrupo && <button type="button" className="botao botao--discreto" onClick={() => alternar(inteiros, g, setInteiros)}>{inteiros.has(g) ? 'Mostrar menos' : `Ver as ${lista.length} de ${g}`}</button>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
