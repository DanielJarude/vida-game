/**
 * VIDA 21 · as formas de ser reconhecido, lado a lado: fama, prestígio no ofício, reconhecimento onde você vive,
 * influência nas redes e imagem — cada uma com a sua leitura (`motor/v21/fama/fama21`).
 */
import type { Vida } from '../../../motor/tipos';
import { formasDeReconhecimento21 } from '../../../motor/v21/fama/fama21';
import './carreiras21.css';

export function FormasDeReconhecimento({ vida }: { vida: Vida }) {
  const fs = formasDeReconhecimento21(vida);
  if (!fs.some(f => f.id !== 'imagem' && f.valor >= 10)) return null;
  return (
    <section className="numeros-oficio-bloco" aria-labelledby="titulo-reconhecimento21">
      <h3 id="titulo-reconhecimento21" className="subtitulo">Como você é reconhecido</h3>
      <p className="nota">Não é uma coisa só: dá para ser muito respeitado no ofício e anônimo na rua — ou o contrário.</p>
      <dl className="numeros-oficio">
        {fs.map(f => (
          <div key={f.id} data-forma={f.id}>
            <dt>{f.rotulo}</dt>
            <dd><meter min={0} max={100} value={f.valor} aria-label={`${f.rotulo}: ${f.valor} de 100`} /> <span className="nota">{f.frase}</span></dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
