/**
 * VIDA 14 · dependências, em Você → Saúde: o que é, em que estágio está, o que custa — e os caminhos de saída (limites,
 * pedir ajuda, o grupo gratuito, o tratamento, parar). Sem sermão e sem rótulo para a pessoa.
 */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { leituraDependencias14 } from '../../../motor/v14/crencas/dependencias14';
import '../politica/politica14.css';

const D = (oque: unknown) => ({ tipo: 'dep14', oque } as unknown as Acao);
const MARCO: Record<string, string> = { inicio: 'começou', dependencia: 'virou dependência', ajuda: 'pediu ajuda', tratamento: 'começou um tratamento', recuperacao: 'parou', recaida: 'recaída', superada: 'superou' };

export function Dependencias14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraDependencias14(vida);
  if (!l) return null;
  return (
    <section className="p14" aria-label="Hábitos e dependências">
      <div className="p14__bloco">
        <p className="p14__kicker">Hábitos e dependências</p>
        <ul className="p14__medidas">
          {l.lista.map(d => (
            <li key={d.tipo} className="p14__medida">
              <p className="p14__medida-nome"><span>{d.nome}{d.substancia ? ` (${d.substancia})` : ''}</span><small>{d.estagio}{d.limpo ? ` desde ${d.limpo}` : ` · desde ${d.desde}`}{d.tratamento ? ` · em tratamento (${d.tratamento === 'grupo' ? 'grupo' : d.tratamento})` : ''}{d.recaidas ? ` · ${d.recaidas} recaída${d.recaidas > 1 ? 's' : ''}` : ''}</small></p>
              {d.est !== 'recuperacao' && <div className="c14__barra" role="img" aria-label={`Intensidade: ${d.estagio}`} style={{ height: 6, borderRadius: 999, background: 'var(--rule)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.max(3, d.nivel)}%`, background: d.nivel >= 50 ? 'var(--danger)' : 'var(--text-muted)' }} /></div>}
              <div className="grupo-acoes">
                <BotaoAcao vida={vida} acao={D({ op: 'proteger', tipo: d.tipo })} agir={agir} variante="discreto" ocultarImpossivel>Pôr limites</BotaoAcao>
                <BotaoAcao vida={vida} acao={D({ op: 'ajuda', tipo: d.tipo })} agir={agir} variante="discreto" ocultarImpossivel>Pedir ajuda a alguém próximo</BotaoAcao>
                <BotaoAcao vida={vida} acao={D({ op: 'tratar', tipo: d.tipo, modo: 'grupo' })} agir={agir} variante="discreto" ocultarImpossivel>{`Ir a ${d.grupo} (gratuito)`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={D({ op: 'tratar', tipo: d.tipo, modo: 'ambulatorial' })} agir={agir} variante="discreto" ocultarImpossivel>{`Tratamento ambulatorial · ${dinheiroCurto(d.custos.ambulatorial)}`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={D({ op: 'tratar', tipo: d.tipo, modo: 'internacao' })} agir={agir} variante="discreto" ocultarImpossivel>{`Internação · ${dinheiroCurto(d.custos.internacao)}`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={D({ op: 'parar', tipo: d.tipo })} agir={agir} variante="discreto" ocultarImpossivel mostrarChance>Tentar parar sozinho</BotaoAcao>
              </div>
            </li>
          ))}
        </ul>
        {l.marcos.length > 0 && <ul className="historico-politico">{l.marcos.map((m, k) => <li key={k}><strong>{m.ano}</strong> · {m.tipo}: {MARCO[m.o]}</li>)}</ul>}
      </div>
    </section>
  );
}

export default Dependencias14;
