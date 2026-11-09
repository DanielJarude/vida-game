/**
 * VIDA 14 · gastronomia e eventos: restaurantes especiais, cozinhas de outros países, degustações, aulas, festivais,
 * galas, leilões, desfiles, premiações e eventos beneficentes — por grupo, em três níveis (do simples ao exclusivo),
 * com o preço da cidade e o que pede convite. Lido de `v14/conquistas/programas`.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { ROTULO_GRUPO14 } from '../../../motor/dados14/conquistas/catalogo';
import { programasNaTela14, temParaIrJunto14 } from '../../../motor/v14/conquistas/programas';
import './conquistas14.css';

const NIVEL: Record<string, string> = { simples: 'Simples', medio: 'Especial', exclusivo: 'Exclusivo' };

export function Programas14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [grupo, setGrupo] = useState<string | null>(null);
  const [aDois, setADois] = useState(false);
  const progs = programasNaTela14(vida);
  if (!progs.length) return null;
  const grupos = [...new Set(progs.map(p => p.grupo))];
  const junto = temParaIrJunto14(vida);
  return (
    <div className="v14v">
      <p className="v14v__titulo">Restaurantes, festas e eventos</p>
      <div className="v14v__tipos" role="tablist" aria-label="Tipos de programa">
        {grupos.map(g => <button key={g} type="button" role="tab" aria-selected={grupo === g} className={`v14v__tipo${grupo === g ? ' v14v__tipo--ativo' : ''}`} onClick={() => setGrupo(x => (x === g ? null : g))}>{ROTULO_GRUPO14[g]}</button>)}
      </div>
      {grupo && junto && <label className="v14v__com"><input type="checkbox" checked={aDois} onChange={e => setADois(e.target.checked)} /> Ir com {junto.nome}</label>}
      {grupo && (
        <div className="c14p__grupo">
          {progs.filter(p => p.grupo === grupo).map(p => (
            <div key={p.id} className="c14p__prog">
              <p className="c14__nome"><span>{p.nome}</span><small>{p.vezes ? `já foi ${p.vezes === 1 ? 'uma vez' : `${p.vezes} vezes`}` : 'nunca foi'}</small></p>
              <div className="grupo-acoes">
                {p.versoes.map(x => (
                  <BotaoAcao key={x.nivel} vida={vida} acao={{ tipo: 'conquistas14', oque: { op: 'programa', id: p.id, nivel: x.nivel, ...(junto && aDois ? { comPar: true } : {}) } } as unknown as Acao} agir={agir} variante="discreto">
                    {`${NIVEL[x.nivel]}: ${x.nome} · ${dinheiroCurto(x.custo)}${x.convite ? ' · com convite' : ''}`}
                  </BotaoAcao>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Programas14;
