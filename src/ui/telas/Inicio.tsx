import { BaixarApp } from './BaixarApp';
import type { ControleVida } from '../useVida';
import { ImportarVida } from './ImportarVida';
import { SeletorTema } from '../SeletorTema';

/** A primeira tela abre sem o motor (que chega num pacote à parte): até ele chegar, os botões esperam. */
export function Inicio({ c }: { c: ControleVida }) {
  const est = c.estatisticas ?? { vidasJogadas: 0 };
  // VIDA 31: a abertura do app — à esquerda (em cima, no celular) a marca e a frase; à direita, o que fazer: continuar a
  // vida salva (num cartão), nascer de novo, as vidas passadas, importar; embaixo, a aparência e o app para Android.
  return (
    <div className="inicio inicio31">
      <section className="inicio31__marca-bloco" aria-label="VIDA">
        <span className="inicio31__bolhas" aria-hidden><i /><i /><i /><i /><i /></span>
        <h1 className="inicio__marca">VIDA</h1>
        <p className="inicio__frase">Você não escolhe tudo o que acontece na sua vida.<br />Escolhe o que fazer com a vida que aconteceu com você.</p>
        <ul className="inicio31__selos" aria-label="O que tem no jogo">
          <li>Do nascimento à velhice</li><li>Carreiras, amores, família</li><li>Brasil e o mundo, de 1900 a hoje</li>
        </ul>
      </section>
      <section className="inicio31__painel">
        <div className="inicio__miolo">
          {!c.pronto && <p className="nota" role="status">Carregando…</p>}
          {c.pronto && <div className="inicio__acoes">
            {c.salva && (
              <div className="inicio31__salva">
                <span className="inicio31__salva-rotulo">{c.salva.morta ? 'O legado' : 'A sua vida'}</span>
                <strong className="inicio31__salva-nome">{c.salva.nome}{c.salva.morta ? '' : `, ${c.salva.idade} ${c.salva.idade === 1 ? 'ano' : 'anos'}`}</strong>
                <button type="button" className="botao botao--principal" onClick={c.continuar}>{c.salva.morta ? `Voltar ao legado de ${c.salva.nome}` : `Continuar a vida de ${c.salva.nome}, ${c.salva.idade} ${c.salva.idade === 1 ? 'ano' : 'anos'}`}</button>
              </div>
            )}
            <button type="button" className={`botao ${c.salva ? 'botao--secundario' : 'botao--principal'}`} onClick={() => c.setTela('criacao')}>Nascer de novo</button>
            {est.vidasJogadas > 0 && <button type="button" className="botao botao--discreto" onClick={() => c.setTela('vidas')}>Vidas passadas ({est.vidasJogadas})</button>}
            <ImportarVida c={c} />
          </div>}
          {c.avisoSave && <p className="nota inicio__aviso" role="status">{c.avisoSave} <button type="button" className="botao botao--discreto" onClick={() => c.setAvisoSave(null)}>Entendi</button></p>}
        </div>
        <SeletorTema compacto />
        <BaixarApp />
        <p className="inicio__rodape">Um simulador de vida nascido no Brasil — e agora com o mundo inteiro por onde viver. Tudo fica salvo neste aparelho, e funciona sem internet depois da primeira visita — e dá para levar uma vida para outro aparelho, exportando e importando o arquivo.</p>
      </section>
    </div>
  );
}
