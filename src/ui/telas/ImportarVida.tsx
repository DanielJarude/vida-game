/** Importar uma vida de um arquivo (na tela inicial e no menu do jogo). Leve: não puxa o motor — usa o controle. */
import { useId, useState } from 'react';
import type { ControleVida } from '../useVida';

export function ImportarVida({ c, aoTerminar }: { c: ControleVida; aoTerminar?: () => void }) {
  const [erro, setErro] = useState<string | null>(null);
  const [previa, setPrevia] = useState<{ texto: string; resumo: string } | null>(null);
  const idArquivo = useId();
  const ler = (arquivo: File | undefined) => {
    setErro(null); setPrevia(null);
    if (!arquivo) return;
    if (arquivo.size > 12 * 1024 * 1024) { setErro('O arquivo é grande demais para ser uma vida do VIDA.'); return; }
    arquivo.text().then(texto => {
      const r = c.previaImportacao(texto);
      if (r.tipo === 'erro') setErro(r.motivo); else setPrevia({ texto, resumo: r.resumo });
    }).catch(() => setErro('Não foi possível ler esse arquivo.'));
  };
  return (
    <div className="importar">
      <label className="botao botao--secundario importar__botao" htmlFor={idArquivo}>Importar uma vida (arquivo)</label>
      <input id={idArquivo} className="sr-only" type="file" accept=".json,application/json" onChange={e => ler(e.target.files?.[0])} />
      {erro && <p className="nota nota--ruim" role="alert"><span aria-hidden>! </span>{erro}</p>}
      {previa && (
        <div className="importar__previa" role="group" aria-label="Confirmar importação">
          <p>{previa.resumo}</p>
          {c.salva && <p className="nota nota--atencao"><span aria-hidden>! </span>Isso substitui a vida salva agora ({c.salva.nome}, {c.salva.idade} anos). Exporte antes, se quiser guardá-la.</p>}
          <div className="grupo-acoes grupo-acoes--linha">
            <button type="button" className="botao botao--principal" onClick={() => { if (c.importar(previa.texto)) { setPrevia(null); aoTerminar?.(); } }}>Importar e continuar essa vida</button>
            <button type="button" className="botao botao--discreto" onClick={() => setPrevia(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
