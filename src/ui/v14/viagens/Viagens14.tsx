/**
 * VIDA 14 · as viagens além do turismo (dentro de "Viagens e experiências"): por tipo, o destino, a época, a duração e o
 * preço; com quem ir; e os países já conhecidos. Tudo lido do motor (`v14/viagens`) — a tela não faz conta.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { catalogoViagens14, custoDaViagem14, destinos14, nomeDoPais14, paisesVisitados } from '../../../motor/v14/viagens/viagens14';
import { companhiasDeViagem } from '../../../motor/sistemas/experiencias';
import './viagens14.css';

export function Viagens14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [tipo, setTipo] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [com, setCom] = useState('so');
  if (vida.t - vida.eu.tNasc < 18 * 12) return null;
  const cat = catalogoViagens14(vida);
  const paises = paisesVisitados(vida);
  const companhias = companhiasDeViagem(vida);
  const g = cat.find(x => x.tipo === tipo);
  return (
    <div className="v14v">
      <p className="v14v__titulo">Mais viagens</p>
      <p className="nota">{paises.length === 1 ? 'Por enquanto, só o próprio país.' : `${paises.length} países conhecidos: ${paises.map(nomeDoPais14).join(', ')}.`}</p>
      <div className="v14v__tipos" role="tablist" aria-label="Tipos de viagem">
        {cat.map(x => <button key={x.tipo} type="button" role="tab" aria-selected={tipo === x.tipo} className={`v14v__tipo${tipo === x.tipo ? ' v14v__tipo--ativo' : ''}`} onClick={() => { setTipo(t => (t === x.tipo ? null : x.tipo)); setAberto(null); }}>{x.nome}</button>)}
      </div>
      {g && (
        <ul className="v14v__lista">
          {g.destinos.map(d => {
            const dest = destinos14(vida).find(x => x.id === d.id)!;
            return (
              <li key={d.id} className="v14v__destino">
                <button type="button" className="v14v__cabeca" aria-expanded={aberto === d.id} onClick={() => setAberto(a => (a === d.id ? null : d.id))}>
                  <span className="v14v__nome">{d.nome}{d.conhecido && <small> · já conhece</small>}</span>
                  <span className="v14v__onde">{d.onde}{d.epoca ? ` · ${d.epoca}` : ''}</span>
                  <span className="v14v__preco">a partir de {dinheiroCurto(d.aPartirDe)}</span>
                </button>
                {aberto === d.id && (
                  <div className="v14v__corpo">
                    <p className="nota">{d.descricao}</p>
                    {g.tipo !== 'negocios' && companhias.length > 1 && (
                      <div className="v14v__com" role="radiogroup" aria-label="Com quem">
                        {companhias.map(c => <label key={c.id}><input type="radio" name={`com-${d.id}`} checked={com === c.id} onChange={() => setCom(c.id)} /> {c.rotulo}</label>)}
                      </div>
                    )}
                    <div className="grupo-acoes">
                      {d.dias.map(n => (
                        <BotaoAcao key={n} vida={vida} acao={{ tipo: 'viagem14', destino: d.id, dias: n, com: g.tipo === 'negocios' ? 'so' : com }} agir={agir} variante="discreto">
                          {`${n} dias · ${dinheiroCurto(custoDaViagem14(vida, dest, n, g.tipo === 'negocios' ? 'so' : com))}`}
                        </BotaoAcao>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Viagens14;
