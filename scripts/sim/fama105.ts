/**
 * REWORK 10.5 · FAM-02 — o crescimento de seguidores de quem já é famoso. O playtest viu uma conta ir de ~1,4 milhão a
 * 2,1 milhões num ano sem publicação nenhuma (+465 mil "pela notoriedade"). Aqui, dez anos de três celebridades com a
 * mesma notoriedade alta e parada (90, pela atuação) e a mesma conta de 1,4 milhão no Instagram:
 *
 *   ativa       três publicações por ano
 *   inativa     nenhuma publicação
 *   exposta     uma publicação por ano e, a cada três anos, um acontecimento público (um prêmio) com o nome subindo
 *
 * Mede o ganho e a perda por ano e o público no fim. Usa só o que existe antes e depois do pacote (rode também no
 * commit-base para a comparação):
 *
 *   npx esbuild scripts/sim/fama105.ts --bundle --platform=node --outfile=<scratch>/f.cjs && node <scratch>/f.cjs
 */
import { adulto } from '../../src/motor/__tests__/cenarios';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { transacao } from '../../src/motor/nucleo';
import { processarRedes, conteudosPossiveis } from '../../src/motor/sistemas/redes';
import { contaAtiva } from '../../src/motor/sistemas/redesBase';
import type { Vida } from '../../src/motor/tipos';

const rede = (oque: string, extra: Record<string, unknown> = {}) => ({ tipo: 'rede', op: { oque, ...extra } }) as Parameters<typeof executar>[1];

function celebridade(perfil: 'ativa' | 'inativa' | 'exposta', k: number) {
  let v: Vida = adulto(35, { semente: 900 + k });
  v = transacao(v, x => { x.id = `${x.id}-fama${perfil}${k}`; x.financas.conta = 1e8; x.notoriedade = { valor: 90, pico: 90, t: x.t, fonte: 'arte' }; }).vida;
  v = executar(v, rede('criar', { plataforma: 'instagram' })).vida;
  v = transacao(v, x => { const c = contaAtiva(x, 'instagram')!; c.seguidores = 1_400_000; c.balanco = undefined; c.anos = []; }).vida;
  const anos: { ganho: number; perda: number; fim: number }[] = [];
  for (let ano = 0; ano < 10; ano++) {
    const posts = perfil === 'ativa' ? 3 : perfil === 'exposta' ? 1 : 0;
    for (let i = 0; i < posts; i++) {
      const temas = conteudosPossiveis(v, 'instagram');
      const a = rede('publicar', { plataforma: 'instagram', tema: temas[i % temas.length].tema });
      if (podeTentar(disponibilidade(v, a))) v = executar(v, a).vida;
    }
    const evento = perfil === 'exposta' && ano % 3 === 2;
    v = transacao(v, x => {
      x.t += 12;
      if (evento) {
        x.biografia.push({ id: `p${ano}`, t: x.t - 1, texto: 'Ganhou o prêmio de melhor atriz.', relevancia: 'marco', tema: 'trabalho' } as never);
        x.notoriedade = { ...x.notoriedade!, valor: Math.min(100, x.notoriedade!.valor + 4) };
      }
      processarRedes(x);
    }).vida;
    const b = contaAtiva(v, 'instagram')!.anos!.slice(-1)[0];
    anos.push({ ganho: b.organico + b.publicacoes + b.exposicao, perda: b.perdas, fim: b.fim! });
  }
  return anos;
}

const fmt = (n: number) => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(2)} mi` : `${Math.round(n / 1000)} mil`);
for (const perfil of ['ativa', 'inativa', 'exposta'] as const) {
  const vidas = [0, 1, 2, 3, 4].map(k => celebridade(perfil, k));
  const media = (f: (a: { ganho: number; perda: number; fim: number }) => number, ano: number) => vidas.reduce((s, x) => s + f(x[ano]), 0) / vidas.length;
  const linhas = Array.from({ length: 10 }, (_, a) => `${a + 1}: +${fmt(media(x => x.ganho, a))} −${fmt(media(x => x.perda, a))} → ${fmt(media(x => x.fim, a))}`);
  const maiorGanho = Math.max(...vidas.flatMap(x => x.map(y => y.ganho)));
  console.log(`\n${perfil.toUpperCase()} (média de 5 vidas; maior ganho num ano: ${fmt(maiorGanho)})`);
  console.log(linhas.join('\n'));
}
