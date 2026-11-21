/**
 * VIDA 32 · o dia a dia do técnico na prancheta: as ações (`motor/sistemas/acoesDoTecnico32`) em grade, por grupo
 * (Treino, Elenco, Imprensa, Diretoria, Carreira). Cada cartão diz o que faz e o limite; o botão diz o motivo quando
 * não dá (o `BotaoAcao` de sempre) e a chance, quando depende da diretoria.
 */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { ACOES_TECNICO32, GRUPOS_TECNICO32, leituraDoTecnico32 } from '../../../motor/sistemas/acoesDoTecnico32';
import './tecnico32.css';

export function AcoesDoTecnico32({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const vale = leituraDoTecnico32(vida);
  return (
    <section className="tec32" aria-label="O dia a dia do técnico">
      <h3 className="tec32__titulo">O dia a dia do técnico</h3>
      {vale.length > 0 && <ul className="tec32__vale" aria-label="Valendo para a próxima temporada">{vale.map(x => <li key={x}>{x}</li>)}</ul>}
      {GRUPOS_TECNICO32.map(g => (
        <div key={g.id} className="tec32__grupo" role="group" aria-label={g.nome}>
          <h4 className="tec32__grupo-nome">{g.nome}</h4>
          <div className="tec32__grade">
            {ACOES_TECNICO32.filter(a => a.grupo === g.id).map(a => (
              <article key={a.oque} className="tec32__cartao" aria-label={a.rotulo}>
                <BotaoAcao vida={vida} acao={{ tipo: 'tecnico32', oque: a.oque }} agir={agir} mostrarChance semAviso variante={a.oque === 'entregar_cargo' ? 'perigo' : 'secundario'}>{a.rotulo}</BotaoAcao>
                <p className="tec32__efeito">{a.efeito}</p>
                <p className="tec32__limite">{a.limite}</p>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
