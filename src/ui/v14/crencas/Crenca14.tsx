/**
 * VIDA 14 · a crença em Você: o que você acredita (ou não), de onde veio, a prática, as datas do ano e as mudanças —
 * com respeito, sem dizer nada sobre o caráter de ninguém. Mudar e praticar são escolhas do jogador.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { CRENCAS14, ORDEM_CRENCAS14, crencaDe, datasDaCrenca14, praticaDe, religiosa } from '../../../motor/v14/crencas/crencas';
import '../politica/politica14.css';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const PRATICA = { nenhuma: 'Não pratica', ocasional: 'Nas datas que importam', regular: 'Toda semana' } as const;

export function Crenca14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [mudar, setMudar] = useState(false);
  const e = crencaDe(vida);
  const info = CRENCAS14[e.atual];
  const pr = praticaDe(vida);
  const datas = datasDaCrenca14(vida);
  const A = (op: unknown) => ({ tipo: 'crenca14', op } as unknown as Acao);
  return (
    <section className="p14" aria-label="Crença">
      <div className="p14__bloco">
        <p className="p14__kicker">Crença e espiritualidade</p>
        <dl className="dados">
          <div className="dado"><dt>Hoje</dt><dd>{info.nome}</dd></div>
          {e.familia !== e.atual && <div className="dado"><dt>Na família</dt><dd>{CRENCAS14[e.familia].nome}</dd></div>}
          {religiosa(e.atual) && <div className="dado"><dt>Prática</dt><dd>{PRATICA[pr]}{pr === 'regular' && info.pratica ? ` — ${info.pratica}` : ''}</dd></div>}
          {datas.length > 0 && <div className="dado"><dt>As datas do ano</dt><dd>{datas.map(d => `${d.texto} (${d.dia ? `${d.dia}/` : ''}${MESES[d.mes]})`).join(' · ')}</dd></div>}
        </dl>
        {religiosa(e.atual) && (
          <div className="grupo-acoes">
            {(['nenhuma', 'ocasional', 'regular'] as const).filter(n => n !== pr).map(n => <BotaoAcao key={n} vida={vida} acao={A({ oque: 'pratica', nivel: n })} agir={agir} variante="discreto" ocultarImpossivel>{n === 'regular' ? `Frequentar ${info.lugar ?? 'a comunidade'} toda semana` : n === 'ocasional' ? 'Só nas datas que importam' : 'Deixar a prática de lado'}</BotaoAcao>)}
          </div>
        )}
        <button type="button" className="botao botao--discreto" aria-expanded={mudar} onClick={() => setMudar(x => !x)}>{mudar ? 'Fechar' : 'Mudar o que acredita'}</button>
        {mudar && (
          <div className="grupo-acoes">
            {ORDEM_CRENCAS14.filter(c => c !== e.atual).map(c => <BotaoAcao key={c} vida={vida} acao={A({ oque: 'mudar', para: c })} agir={agir} variante="discreto" ocultarImpossivel aoAgir={() => setMudar(false)}>{CRENCAS14[c].nome}</BotaoAcao>)}
          </div>
        )}
        {e.historia.length > 0 && <ul className="historico-politico">{e.historia.slice(-5).map((h, k) => <li key={k}><strong>{Math.floor(h.t / 12)}</strong> · de {CRENCAS14[h.de].nome.toLowerCase()} para {CRENCAS14[h.para].nome.toLowerCase()}</li>)}</ul>}
      </div>
    </section>
  );
}

export default Crenca14;
