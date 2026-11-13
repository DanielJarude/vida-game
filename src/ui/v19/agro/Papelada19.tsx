/**
 * VIDA 19 · A papelada e o crédito do campo (dentro de Vida · Campo · Contas): o CAR, a divisa certificada, a outorga
 * da água e o custeio do Plano Safra — com o que cada um abre, o que custa e o estado de agora.
 */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import type { PropriedadeRural18 } from '../../../motor/v18/rural/fazenda18';
import { custoAgro19, linhaDoCredito19, SAFRA19 } from '../../../motor/v19/agro/agro19';
import { paisDaCidade } from '../../../motor/dados/lugares';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';

const LINHA = { pronaf: 'Pronaf', pronamp: 'Pronamp', demais: 'demais produtores' } as const;

export function Papelada19({ vida, agir, p }: { vida: Vida; agir: (a: Acao) => boolean; p: PropriedadeRural18 }) {
  if (paisDaCidade(p.municipioId) !== 'BR') return null;
  const a = (oque: Extract<Acao, { tipo: 'agro19' }>['oque']): Acao => ({ tipo: 'agro19', oque });
  const irrig = p.talhoes.some(t => t.irrigado);
  const l = linhaDoCredito19(p);
  const s = p.safra19;
  return (
    <section className="campo18__papelada" aria-label="Documentos e crédito">
      <h4>Documentos e crédito</h4>
      <ul className="campo18__cavalos">
        <li><strong>CAR</strong> <span>{p.car19 !== undefined ? `inscrito em ${p.car19}` : 'sem cadastro — sem crédito rural e sem subvenção do seguro'}</span></li>
        <li><strong>Divisa</strong> <span>{p.geo19 !== undefined ? `certificada em ${p.geo19}` : 'sem georreferenciamento — a cerca do vizinho pode virar ação'}</span></li>
        {irrig && <li><strong>Água</strong> <span>{p.outorga19 !== undefined ? `outorga desde ${p.outorga19}` : 'irrigação sem outorga — risco de multa ambiental'}</span></li>}
        <li><strong>Custeio</strong> <span>{s ? `${dinheiroCurto(s.valor)} pelo ${LINHA[s.linha]} a ${(s.taxa * 100).toFixed(1).replace('.', ',')}% a.a. · vence em ${s.vence}${s.prorrogado ? ' (prorrogado)' : ''}` : `linha ${LINHA[l.linha]}, ${(l.taxa * 100).toFixed(1).replace('.', ',')}% a.a., até ${dinheiroCurto(l.limite)}`}</span></li>
      </ul>
      <div className="campo18__botoes">
        {p.car19 === undefined && <BotaoAcao vida={vida} agir={agir} acao={a({ op: 'car', id: p.id })}>Inscrever no CAR · {dinheiroCurto(custoAgro19(vida, p, 'car'))}</BotaoAcao>}
        {p.geo19 === undefined && <BotaoAcao vida={vida} agir={agir} acao={a({ op: 'georreferenciar', id: p.id })}>Georreferenciar · {dinheiroCurto(custoAgro19(vida, p, 'georreferenciar'))}</BotaoAcao>}
        {irrig && p.outorga19 === undefined && <BotaoAcao vida={vida} agir={agir} acao={a({ op: 'outorga', id: p.id })}>Pedir outorga · {dinheiroCurto(custoAgro19(vida, p, 'outorga'))}</BotaoAcao>}
        {!s ? <BotaoAcao vida={vida} agir={agir} acao={a({ op: 'credito', id: p.id })}>Tomar custeio do Plano Safra</BotaoAcao> : <BotaoAcao vida={vida} agir={agir} acao={a({ op: 'quitar', id: p.id })}>Quitar o custeio</BotaoAcao>}
      </div>
      <p className="nota">Referências: {SAFRA19.fontes}</p>
    </section>
  );
}
