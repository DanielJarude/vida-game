/**
 * VIDA 34 · A NAVEGAÇÃO DENTRO DE UM TIME. As seções de um clube, de um time de quadra ou de uma organização de e-sports
 * em grupos com nome (Visão geral · Time · Competição · Gestão), numa barra de abas de verdade — sublinhada, rolável no
 * celular — e não mais uma fileira de pílulas iguais às dos filtros. A sub-navegação (as abas de uma line) tem um estilo
 * próprio, mais leve, para não se confundir com a de cima.
 */
import type { ReactNode } from 'react';
import './nav34.css';

export interface ItemNav34<T extends string> {
  id: T;
  rotulo: string;
  /** O grupo da seção (o nome aparece em cima do grupo). */
  grupo?: string;
  /** Um número a destacar (assuntos na mesa, contratos acabando...). */
  conta?: number;
  /** Um selo antes do rótulo (a sigla do jogo de uma line). */
  selo?: string;
}

export function NavTime34<T extends string>({ itens, atual, mudar, rotulo, sub }: { itens: ItemNav34<T>[]; atual: T; mudar: (id: T) => void; rotulo: string; sub?: boolean }) {
  const grupos: { nome?: string; itens: ItemNav34<T>[] }[] = [];
  for (const it of itens) {
    const g = grupos[grupos.length - 1];
    if (g && g.nome === it.grupo) g.itens.push(it); else grupos.push({ nome: it.grupo, itens: [it] });
  }
  return (
    <nav className={`nav34${sub ? ' nav34--sub' : ''}`} aria-label={rotulo}>
      <div className="nav34__trilho" role="tablist" aria-label={rotulo}>
        {grupos.map((g, k) => (
          <div key={k} className="nav34__grupo">
            {g.nome && <span className="nav34__grupo-nome" aria-hidden="true">{g.nome}</span>}
            <div className="nav34__abas">
              {g.itens.map(it => (
                <button key={it.id} type="button" role="tab" aria-selected={atual === it.id} className="nav34__aba" onClick={() => mudar(it.id)}>
                  {it.selo && <span className="nav34__selo" aria-hidden="true">{it.selo}</span>}
                  {it.rotulo}
                  {it.conta ? <span className="nav34__conta" aria-hidden="true">{it.conta}</span> : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

/** A trilha de volta: "← Esporte › Nome do time", com os outros times do dono para trocar sem voltar. */
export function Trilha34({ voltar, onde, outros }: { voltar: () => void; onde: ReactNode; outros?: ReactNode }) {
  return (
    <div className="trilha34">
      <button type="button" className="trilha34__voltar" onClick={voltar}><span aria-hidden="true">←</span> Todos os times</button>
      <span className="trilha34__onde" aria-hidden="true">›</span>
      <span className="trilha34__atual">{onde}</span>
      {outros && <span className="trilha34__outros">{outros}</span>}
    </div>
  );
}
