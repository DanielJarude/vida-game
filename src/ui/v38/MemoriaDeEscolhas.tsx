/**
 * VIDA 38 · bloco 3 — memória de escolhas: as decisões que a própria pessoa tomou (entradas da biografia marcadas como
 * escolha), em ordem de tempo, com o ano de cada uma. Recolhida por padrão; não repete a Linha da Vida, só as escolhas.
 */
import type { Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';

export function escolhasDaVida(vida: Vida): { ano: number; texto: string }[] {
  return vida.biografia
    .filter(e => e.escolha)
    .map(e => ({ ano: anoDe(e.t), texto: e.texto }))
    .sort((a, b) => a.ano - b.ano);
}

export function MemoriaDeEscolhas({ vida }: { vida: Vida }) {
  const escolhas = escolhasDaVida(vida);
  if (!escolhas.length) return null;
  return (
    <details className="detalhes memoria-escolhas">
      <summary>Suas escolhas ({escolhas.length})</summary>
      <ol className="memoria-escolhas__lista">
        {escolhas.map((e, k) => <li key={k}><span className="nota">{e.ano}</span> {e.texto}</li>)}
      </ol>
    </details>
  );
}
