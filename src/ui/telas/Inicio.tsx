import type { ControleVida } from '../useVida';
import { lerEstatisticas } from '../../motor/save';
import { ImportarVida } from './Jogo';

export function Inicio({ c }: { c: ControleVida }) {
  const est = lerEstatisticas();
  return (
    <div className="inicio">
      <div className="inicio__miolo">
        <h1 className="inicio__marca">VIDA</h1>
        <p className="inicio__frase">Você não escolhe tudo o que acontece na sua vida.<br />Escolhe o que fazer com a vida que aconteceu com você.</p>
        <div className="inicio__acoes">
          {c.salva && <button type="button" className="botao botao--principal" onClick={c.continuar}>Continuar a vida de {c.salva.nome}, {c.salva.idade} {c.salva.idade === 1 ? 'ano' : 'anos'}</button>}
          <button type="button" className={`botao ${c.salva ? 'botao--secundario' : 'botao--principal'}`} onClick={() => c.setTela('criacao')}>Nascer de novo</button>
          {est.vidasJogadas > 0 && <button type="button" className="botao botao--discreto" onClick={() => c.setTela('vidas')}>Vidas passadas ({est.vidasJogadas})</button>}
          <ImportarVida c={c} />
        </div>
        {c.avisoSave && <p className="nota inicio__aviso" role="status">{c.avisoSave} <button type="button" className="botao botao--discreto" onClick={() => c.setAvisoSave(null)}>Entendi</button></p>}
      </div>
      <p className="inicio__rodape">Um simulador de vida brasileiro. Tudo fica salvo neste navegador — e dá para levar uma vida para outro aparelho, exportando e importando o arquivo.</p>
    </div>
  );
}
