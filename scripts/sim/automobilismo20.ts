/**
 * VIDA 20 · sim: carreiras de automobilismo do kart em diante (N vidas por classe), com um piloto que aceita propostas,
 * busca patrocínio e treina. Mede quantos chegam a cada categoria, à F1, títulos, por que param; determinismo (DET=1).
 *   npx esbuild scripts/sim/automobilismo20.ts --bundle --platform=node --outfile=<scratch>/a20.cjs && node <scratch>/a20.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { idade } from '../../src/motor/nucleo';
import type { Classe, Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 40);
const classes: Classe[] = ['trabalhadora', 'media', 'alta'];
const conta: Record<string, number> = {};
const soma = (k: string, n = 1) => { conta[k] = (conta[k] ?? 0) + n; };
const tenta = (v: Vida, oque: unknown) => { const a = { tipo: 'auto20', oque } as never; if (!podeTentar(disponibilidade(v, a))) return v; return executar(v, a).vida; };
let ms = 0, anos = 0;
function viver(s: number, classe: Classe): Vida {
  let v = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: 'sao-paulo-sp', semente: 20000 + s * 13, classe });
  while (idade(v) < 8) { v = avancarAno(v).vida; v.momento = null; v.fila = undefined; }
  v = tenta(v, { op: 'comecar' });
  while (!v.morte && idade(v) < 42) {
    v = tenta(v, { op: 'patrocinio' });
    v = tenta(v, { op: 'treinar', foco: ['simulador', 'fisico', 'circuitos', 'mental'][idade(v) % 4] });
    v = tenta(v, { op: 'aceitar' });
    const t0 = performance.now();
    v = avancarAno(v).vida; v.momento = null; v.fila = undefined;
    ms += performance.now() - t0; anos++;
    if (v.automobilismo20?.fase === 'encerrada') break;
  }
  return v;
}
const det: string[] = [];
for (const classe of classes) for (let s = 0; s < N; s++) {
  const v = viver(s, classe);
  const a = v.automobilismo20!;
  const cats = new Set(a.temporadas.map(t => t.categoria));
  for (const c of cats) soma(`${classe}:${c}`);
  soma(`${classe}:n`);
  if (cats.has('f1')) { soma(`${classe}:F1`); soma('f1_vitorias', a.temporadas.filter(t => t.categoria === 'f1').reduce((x, t) => x + t.vitorias, 0)); if (a.temporadas.some(t => t.categoria === 'f1' && t.titulo)) soma('campeao_mundial'); soma('f1_temporadas', a.temporadas.filter(t => t.categoria === 'f1').length); }
  soma(`fim:${a.motivoFim ?? 'ativo'}`);
  soma(`${classe}:nivelMax`, Math.max(0, ...a.temporadas.map(() => 0)));
  if (a.academia) soma('academia');
  if (a.temporadas.some(t => t.categoria === 'f1')) soma('f1_noto', Math.round(v.notoriedade?.valor ?? 0));
  if (process.env.VER && cats.has('f1')) console.log(classe, s, 'talento', a.talento, JSON.stringify(a.atributos), a.temporadas.filter(t => ['f2', 'f1'].includes(t.categoria)).map(t => `${t.ano}:${t.categoria}:${t.equipe}:${t.posicao}º/${t.vitorias}v`).join(' '));
  if (process.env.DET && s < 3) det.push(JSON.stringify(a));
}
console.log(`ms/ano ${(ms / anos).toFixed(1)}`);
for (const c of classes) console.log(c, ['n', 'kart', 'entrada', 'f4', 'regional', 'f3', 'f2', 'F1'].map(k => `${k}=${conta[`${c}:${k}`] ?? 0}`).join(' '));
console.log(Object.entries(conta).filter(([k]) => !k.includes(':') || k.startsWith('fim')).map(([k, x]) => `${k}=${x}`).join(' '));
if (process.env.DET) {
  const de = det.slice(); det.length = 0;
  for (const classe of classes.slice(0, 1)) for (let s = 0; s < 3; s++) det.push(JSON.stringify(viver(s, classe).automobilismo20));
  console.log('determinismo', de.slice(0, 3).every((x, k) => x === det[k]) ? 'OK' : 'DIFERENTE');
}
