/**
 * REWORK 5 — a ESCALA das redes. O playtest viu 3,7 bilhões de visualizações e 127 milhões de seguidores num post.
 * Aqui, o criador mais agressivo possível (8 posts/ano, impulsionados, o melhor tema, câmera, fama) por 30 anos em cada
 * plataforma, e o criador comum. Mede o maior post, o maior ganho num post e o público no fim.
 *
 *   npx esbuild scripts/sim/redesEscala.ts --bundle --platform=node --outfile=<scratch>/re.cjs && node <scratch>/re.cjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { transacao } from '../../src/motor/nucleo';
import { processarRedes, conteudosPossiveis } from '../../src/motor/sistemas/redes';
import { contaAtiva, seguidoresEmPalavras } from '../../src/motor/sistemas/redesBase';
import type { PlataformaId, Vida } from '../../src/motor/tipos';

const rede = (oque: string, extra: Record<string, unknown> = {}) => ({ tipo: 'rede', op: { oque, ...extra } }) as Parameters<typeof executar>[1];
const BASE = adulto(18, { semente: 33 });

function vida(pl: PlataformaId, k: number, agressivo: boolean) {
  let v: Vida = structuredClone(BASE); v.id = `${v.id}-re${k}`;
  v = transacao(v, x => { x.financas.conta = 1e9; if (agressivo) { x.personalidade.tracos.sociabilidade = 100; x.notoriedade = { valor: 60, pico: 60, t: x.t, fonte: 'rede' }; } }).vida;
  v = executar(v, rede('criar', { plataforma: pl })).vida;
  let maiorPost = 0, maiorGanho = 0;
  for (let ano = 0; ano < 30; ano++) {
    for (let i = 0; i < (agressivo ? 8 : 3); i++) {
      const temas = conteudosPossiveis(v, pl);
      if (!temas.length) break;
      const a = rede('publicar', { plataforma: pl, tema: temas[i % temas.length].tema, promover: agressivo });
      if (!podeTentar(disponibilidade(v, a))) break;
      const antes = contaAtiva(v, pl)!.seguidores;
      v = executar(v, a).vida;
      const c = contaAtiva(v, pl)!;
      maiorPost = Math.max(maiorPost, c.publicacoes[c.publicacoes.length - 1].alcance);
      maiorGanho = Math.max(maiorGanho, c.seguidores - antes);
    }
    v = transacao(v, x => { x.t += 12; processarRedes(x); }).vida;
  }
  return { fim: contaAtiva(v, pl)?.seguidores ?? 0, maiorPost, maiorGanho };
}

for (const agressivo of [true, false]) {
  console.log(agressivo ? '\n== criador agressivo (fama 60, impulsiona tudo, 8/ano, 30 anos)' : '\n== pessoa comum (3 posts/ano, 30 anos)');
  for (const pl of ['instagram', 'tiktok', 'youtube', 'x', 'facebook', 'twitch'] as PlataformaId[]) {
    const rs = Array.from({ length: 12 }, (_, k) => vida(pl, k, agressivo));
    const fins = rs.map(r => r.fim).sort((a, b) => a - b);
    console.log(`${pl.padEnd(10)} público final: mediana ${seguidoresEmPalavras(fins[6]).padEnd(12)} máx ${seguidoresEmPalavras(fins[11]).padEnd(12)} | maior post ${seguidoresEmPalavras(Math.max(...rs.map(r => r.maiorPost))).padEnd(12)} | maior ganho num post ${seguidoresEmPalavras(Math.max(...rs.map(r => r.maiorGanho)))}`);
  }
}
