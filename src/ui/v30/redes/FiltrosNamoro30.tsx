/** VIDA 30 · os filtros do aplicativo de namoro — a idade, a distância, o que a pessoa busca, um interesse em comum e "só famosos". */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import { disponibilidade, type Acao } from '../../../motor/acoes';
import { podeTentar } from '../../../motor/plausibilidade';
import { INTERESSES } from '../../../motor/v15/celular/celular15';
import type { FiltrosNamoro30 as Filtros } from '../../../motor/dados15/celular/tipos';

export default function FiltrosNamoro30({ vida, agir, padrao }: { vida: Vida; agir: (a: Acao) => boolean; padrao: Filtros }) {
  const atual = vida.celular15?.deck?.filtros30 ?? padrao;
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState<Filtros>(atual);
  const acao = { tipo: 'celular15', oque: { op: 'namoro_filtros', filtros: f } } as Acao;
  const ativos = vida.celular15?.deck?.filtros30;
  return (
    <div className="namoro30__filtros">
      <button type="button" className="cel__link" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>Filtros{ativos ? ` · ${ativos.idadeMin}–${ativos.idadeMax} anos · até ${ativos.km} km${ativos.famosos ? ' · só famosos' : ''}` : ''}</button>
      {aberto && (
        <form className="namoro30__form" onSubmit={e => { e.preventDefault(); if (agir(acao)) setAberto(false); }}>
          <label>Idade <input type="number" min={18} max={90} value={f.idadeMin} onChange={e => setF({ ...f, idadeMin: Number(e.target.value) })} aria-label="Idade mínima" /> a <input type="number" min={18} max={90} value={f.idadeMax} onChange={e => setF({ ...f, idadeMax: Number(e.target.value) })} aria-label="Idade máxima" /></label>
          <label>Distância <select value={f.km} onChange={e => setF({ ...f, km: Number(e.target.value) })}>{[5, 10, 18, 30, 50, 80].map(k => <option key={k} value={k}>até {k} km</option>)}</select></label>
          <label>Busca <select value={f.busca} onChange={e => setF({ ...f, busca: e.target.value as Filtros['busca'] })}><option value="qualquer">qualquer</option><option value="relacionamento">relacionamento sério</option><option value="casual">algo casual</option></select></label>
          <label>Interesse <select value={f.interesse ?? ''} onChange={e => setF({ ...f, interesse: e.target.value || undefined })}><option value="">qualquer</option>{INTERESSES.map(x => <option key={x} value={x}>{x}</option>)}</select></label>
          <label className="namoro30__check"><input type="checkbox" checked={!!f.famosos} onChange={e => setF({ ...f, famosos: e.target.checked })} /> Só famosos (perfis verificados)</label>
          <button type="submit" className="botao botao--principal" disabled={!podeTentar(disponibilidade(vida, acao))} title={disponibilidade(vida, acao).motivo}>Aplicar</button>
        </form>
      )}
    </div>
  );
}

