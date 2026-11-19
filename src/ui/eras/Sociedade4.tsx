/**
 * ERAS v4 · A SOCIEDADE DA ÉPOCA (Você → No mundo, nas vidas históricas): de onde você vem e o que isso pesa; o que a lei,
 * as instituições e o costume fazem com a sua vida agora (com a fonte); os movimentos na rua (e o risco de estar neles);
 * os partidos do mês; e o mundo que esta família mudou. Lido de `resumoDaSociedade` — a tela não faz conta.
 */
import type { Acao } from '../../motor/acoes';
import type { Vida } from '../../motor/tipos';
import { resumoDaSociedade, rotuloDaNatureza, rotuloDoDominio } from '../../motor/eras/v4/resumo4';
import './sociedade4.css';

export function Sociedade4({ vida, agir }: { vida: Vida; agir?: (a: Acao) => boolean }) {
  const r = resumoDaSociedade(vida);
  if (!r || r.ano > 2025 && !r.mudancas.length) return null;
  return (
    <section className="soc4 painel-epoca" aria-label="A sociedade da época">
      <div>
        <p className="painel-epoca__titulo">A sociedade em {r.ano}</p>
        <p className="painel-epoca__sub">Você vem de uma {r.origem.rotulo}. {r.origem.frase}</p>
      </div>

      <h3>O que pesa sobre você agora</h3>
      {r.barreiras.length === 0 && <p className="painel-epoca__nota">Neste momento, nenhuma lei ou costume da época fecha uma porta da sua vida — o que não quer dizer que a época seja igual para todos.</p>}
      {r.barreiras.length > 0 && (
        <ul className="soc4__barreiras">
          {r.barreiras.map(b => (
            <li key={b.id} className="soc4__barreira" data-natureza={b.natureza}>
              <p className="soc4__etiquetas"><span className="soc4__etiqueta">{rotuloDoDominio(b.dominio)}</span><span className="soc4__etiqueta soc4__etiqueta--natureza">{b.residual ? 'Costume (a lei já caiu)' : rotuloDaNatureza(b.natureza)}</span>{b.bloqueia && <span className="soc4__etiqueta soc4__etiqueta--porta">Porta fechada</span>}</p>
              <p className="soc4__texto">{b.texto}</p>
              {b.alternativa && <p className="painel-epoca__nota">Saída da época: {b.alternativa}</p>}
              <details className="soc4__fonte"><summary>Fonte{b.ate ? ` · na história, até ${b.ate}` : ''}</summary><p className="painel-epoca__nota">{b.fonte}</p></details>
            </li>
          ))}
        </ul>
      )}

      {r.movimentos.length > 0 && (
        <>
          <h3>Os movimentos na rua</h3>
          <ul className="soc4__movimentos">
            {r.movimentos.map(m => (
              <li key={m.id} className="soc4__movimento" data-risco={m.nivel}>
                <p className="soc4__nome">{m.nome}{m.papel ? <small> · você {m.papel === 'organizacao' ? 'organiza' : m.papel === 'militante' ? 'participa' : 'apoia'}</small> : null}</p>
                <p className="soc4__texto">Pela causa: {m.causa}.{m.reformas.length ? ` Luta por: ${m.reformas.join('; ')}.` : ''}</p>
                <p className="painel-epoca__nota">Risco agora: {m.risco}.{m.pressao > 0 ? ` A pressão que você ajudou a fazer: ${m.pressao} de 100.` : ''}</p>
                {agir && (
                  <div className="soc4__acoes">
                    {m.acoes.map(a => (
                      <button key={a.oque} type="button" className="botao botao--discreto" disabled={!a.pode} title={a.pode ? undefined : a.motivo} onClick={() => agir({ tipo: 'eras4', oque: a.oque, movimento: m.id })}>{a.rotulo}</button>
                    ))}
                  </div>
                )}
                {agir && m.acoes.every(a => !a.pode) && m.acoes[0]?.motivo && <p className="painel-epoca__nota">{m.acoes[0].motivo}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      {r.reformasDoCargo.length > 0 && (
        <p className="painel-epoca__nota"><strong>No seu cargo, você pode propor:</strong> {r.reformasDoCargo.join('; ')} — nas ações do mandato, em Trabalho.</p>
      )}

      {r.partidos.length > 0 && (
        <details className="soc4__partidos">
          <summary>Os partidos de {r.ano} ({r.partidos.length}){r.partidos.some(p => p.unico) ? ' — sem disputa livre' : ''}</summary>
          <ul className="painel-epoca__lista">{r.partidos.map(p => <li key={p.id}><strong>{p.nome}</strong>{p.linha ? ` — ${p.linha}` : ''}{p.unico ? ' (lista única)' : ''}</li>)}</ul>
        </details>
      )}

      {r.mudancas.length > 0 && (
        <>
          <h3>O mundo que esta família mudou</h3>
          <ul className="soc4__mudancas">
            {r.mudancas.map((x, i) => (
              <li key={`${x.nome}-${x.ano}-${i}`} data-derrubada={x.derrubada ? 'sim' : undefined}>
                <strong>{x.ano}</strong> · {x.nome}, {x.onde} — por {x.quem}{x.antes ? `, ${x.antes} ${x.antes === 1 ? 'ano' : 'anos'} antes da história` : ''}.{x.derrubada ? ` Derrubada em ${x.derrubada.ano}${x.derrubada.porQue ? ` por ${x.derrubada.porQue}` : ''}.` : ''}
              </li>
            ))}
          </ul>
          <p className="painel-epoca__nota">Estas mudanças não estão na história real: são desta vida, e passam para quem continuar a família.</p>
        </>
      )}
    </section>
  );
}

export default Sociedade4;
