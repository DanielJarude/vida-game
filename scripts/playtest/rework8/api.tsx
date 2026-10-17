/**
 * REWORK 8 (Fase A) — as três direções como uma função (para o Playwright desenhar nas telas reais do jogo): o
 * desenho de uma amostra, numa direção, na cor de verdade do objeto (a do anúncio), num tamanho.
 *   npx esbuild scripts/playtest/rework8/api.tsx --bundle --platform=node --jsx=automatic --outfile=<s>/api.cjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { Desenho, PERFIS, bicicletaUrbana, cachorro, carro, casa, concessionaria, gato, motocicleta, violao, type Direcao } from './propostas';

export function desenhar(dir: Direcao, qual: string, cor: string, largura: number): string {
  const a = PERFIS[qual] ? carro(PERFIS[qual], cor)
    : qual === 'moto' ? motocicleta(cor) : qual === 'bicicleta' ? bicicletaUrbana(cor)
      : qual === 'cachorro' ? cachorro(cor) : qual === 'gato' ? gato(cor)
        : qual === 'violao' ? violao() : qual === 'casa' ? casa() : concessionaria(cor);
  return renderToStaticMarkup(<Desenho a={a} dir={dir} largura={largura} rotulo={qual} />);
}
