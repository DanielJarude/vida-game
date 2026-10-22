/**
 * REWORK 10.6 · UX-24 — a janela "VIDA — Novidades da atualização" (as notas em `novidades.ts`). Abre sozinha uma vez
 * por versão (nunca por cima de uma decisão: o App espera a vida ficar livre) e, pelo Menu, mostra o histórico.
 * Usa a folha comum: prende o foco, fecha com Esc, devolve o foco a quem abriu; o movimento segue a preferência do sistema.
 */
import { Folha } from './comum';
import { NOTAS, type NotaDeVersao } from './novidades';

function Partes({ n }: { n: NotaDeVersao }) {
  const partes: [string, string[]][] = [['Novidades', n.novidades], ['Melhorias', n.melhorias], ['Correções', n.correcoes]];
  return (
    <>
      {partes.filter(([, l]) => l.length).map(([t, l]) => (
        <section key={t} className="novidades__parte" aria-label={t}>
          <h3 className="novidades__subtitulo">{t}</h3>
          <ul className="novidades__lista">{l.map((x, k) => <li key={k}>{x}</li>)}</ul>
        </section>
      ))}
    </>
  );
}

export function JanelaDeNovidades({ aoFechar, historico }: { aoFechar: () => void; historico?: boolean }) {
  const [atual, ...antes] = NOTAS;
  return (
    <Folha titulo={<span className="novidades__titulo">VIDA — Novidades da atualização</span>} rotulo="Novidades da atualização" aoFechar={aoFechar} papel>
      <div className="novidades" data-versao={atual.versao}>
        <p className="novidades__versao">Versão {atual.versao} · {atual.titulo}</p>
        <Partes n={atual} />
        {historico && antes.length > 0 && (
          <details className="novidades__antes">
            <summary>Versões anteriores</summary>
            {antes.map(n => <div key={n.versao}><p className="novidades__versao">Versão {n.versao} · {n.titulo}</p><Partes n={n} /></div>)}
          </details>
        )}
        <div className="grupo-acoes"><button type="button" className="botao botao--principal" onClick={aoFechar}>{historico ? 'Fechar' : 'Continuar jogando'}</button></div>
      </div>
    </Folha>
  );
}
