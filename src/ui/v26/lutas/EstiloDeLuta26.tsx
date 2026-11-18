/**
 * VIDA 26.2 · O ESTILO DE LUTA na tela: o estilo de agora (ou o pedido de escolher), a faixa e o que falta para a próxima
 * (nos estilos que graduam), e a escolha ou a troca — cada estilo com a família, o que é e a técnica em que começaria
 * (o custo de trocar, dito ANTES). Tudo de `v26/lutas/luta26`.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { leituraDaLuta26 } from '../../../motor/v26/lutas/luta26';
import { ESTILOS26 } from '../../../motor/v26/esporte/estilos26';
import './luta26.css';

export function EstiloDeLuta26({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraDaLuta26(vida);
  const [aberto, setAberto] = useState(!l.estilo);
  const [escolha, setEscolha] = useState<string | undefined>();
  const est = l.estilo ? ESTILOS26[l.estilo] : undefined;
  const sel = l.opcoes.find(o => o.id === escolha);
  return (
    <div className="l26" data-estilo-luta={l.estilo ?? 'nenhum'}>
      <p className="l26__agora">
        {est ? <><b>{est.nome}</b> · {l.opcoes.find(o => o.id === l.estilo)!.familia}</> : <b>Sem estilo definido</b>}
        {l.faixa && <span className="l26__faixa" data-faixa={l.faixa.atual}>faixa {l.faixa.atual}</span>}
      </p>
      {l.faixa?.proxima && <p className="l26__nota">Próxima faixa ({l.faixa.proxima.nome}): técnica {l.faixa.proxima.tecnica} (a sua: {Math.round(l.h)}){l.faixa.proxima.anos ? `, ${l.faixa.proxima.anos} anos de prática` : ''}{l.faixa.proxima.idade ? `, ${l.faixa.proxima.idade} anos de idade` : ''}.</p>}
      {!est && <p className="l26__nota">O estilo muda o que pesa na luta (golpes em pé, luta no chão, defesa), as faixas e as competições.</p>}
      <button type="button" className="link" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{est ? (aberto ? 'Fechar' : 'Trocar de estilo') : aberto ? 'Fechar' : 'Escolher o estilo'}</button>
      {aberto && (
        <div className="l26__opcoes" role="radiogroup" aria-label="Estilos de luta">
          {l.opcoes.map(o => {
            const atual = o.id === l.estilo;
            const bloqueado = !atual && o.veredito.grau !== 'permitido';
            return (
              <label key={o.id} className={`l26__opcao${escolha === o.id ? ' l26__opcao--sel' : ''}${atual ? ' l26__opcao--atual' : ''}`} data-opcao={o.id}>
                <input type="radio" name="estilo-luta" value={o.id} checked={escolha === o.id} disabled={atual || bloqueado} onChange={() => setEscolha(o.id)} />
                <span className="l26__opcao-nome">{o.nome} <small>{o.familia}</small></span>
                <span className="l26__opcao-sobre">{o.sobre}</span>
                <span className="l26__opcao-custo">{atual ? 'o seu estilo' : bloqueado ? o.veredito.motivo : l.estilo ? `começaria com técnica ${Math.round(o.tecnica)}${o.guardada !== undefined ? ' (o que já tinha nele)' : ''}` : `técnica ${Math.round(o.tecnica)}`}</span>
              </label>
            );
          })}
          {sel && (
            <div className="l26__confirmar">
              <p className="l26__nota">{l.estilo ? `Trocar para ${sel.nome}: a técnica passa a ${Math.round(sel.tecnica)} — a do ${est!.nome} (${Math.round(l.h)}) fica guardada e volta se você voltar.` : `${sel.nome}: o estilo passa a valer na prática, na base e na carreira.`}</p>
              <button type="button" className="botao botao--secundario" onClick={() => { if (agir({ tipo: 'luta26', estilo: sel.id })) { setAberto(false); setEscolha(undefined); } }}>{l.estilo ? `Trocar para ${sel.nome}` : `Escolher ${sel.nome}`}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
