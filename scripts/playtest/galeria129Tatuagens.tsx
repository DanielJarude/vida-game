/**
 * VIDA 12.9 — a galeria dos desenhos novos de tatuagem: cada um em três tamanhos (ampliado, médio e miniatura do
 * estúdio), na pele clara (colorida/cinza) e na escura (só preto). Filtro opcional: FILTRO=<prefixo de estilo|tema|ref>.
 *   npx esbuild scripts/playtest/galeria129Tatuagens.tsx --bundle --platform=node --format=esm --jsx=automatic --outfile=<s>/g.mjs && OUT=<s>/g.html node <s>/g.mjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { DesenhoDaTatuagem, caixaNativa } from '../../src/ui/avatar/tatuagens';
import { DESENHOS_129 } from '../../src/motor/dados/tatuagens129';
import { tintaNaPele } from '../../src/ui/avatar/tatuagensNaPele';

const F = process.env.FILTRO ?? '';
const ini = Number(process.env.DE ?? 0), fim = Number(process.env.ATE ?? 9999);
const IDS = (process.env.IDS ?? '').split(',').filter(Boolean);
const xs = DESENHOS_129.filter(d => IDS.length ? IDS.includes(d.id) : !F || d.estilo === F || d.tema === F || d.referencia === F || F === 'pop' && d.estilo === 'cultura_pop' || F === 'autoral' && !d.tema && d.estilo !== 'cultura_pop').slice(ini, fim);
const cel = xs.map(d => {
  const [w, h] = caixaNativa(d);
  const svg = (pele: string, px: number, cor: 'preta' | 'cinza' | 'colorida') => {
    const t = tintaNaPele({ cor, intensidade: 1, anos: 0, idade: 30 }, pele);
    return `<svg viewBox="-1 -1 ${w + 2} ${h + 2}" width="${px}" height="${px}" style="background:${pele};border-radius:4px">${renderToStaticMarkup(<DesenhoDaTatuagem id={d.id} tinta={t.tinta} cor={t.cor} />)}</svg>`;
  };
  const mini = `<svg viewBox="-1 -1 ${w + 2} ${h + 2}" width="44" height="44" style="background:#fff;border-radius:4px">${renderToStaticMarkup(<DesenhoDaTatuagem id={d.id} tinta="#1f2328" cor={c => c} traco={1.1} />)}</svg>`;
  return `<div class=c><div style="display:flex;gap:4px;align-items:end">${svg('#f1c8a8', 150, d.colorida ? 'colorida' : d.estilo === 'realista' ? 'cinza' : 'preta')}${svg('#6b4029', 72, 'preta')}${mini}${svg('#d9a582', 24, d.colorida ? 'colorida' : 'preta')}</div><span>${d.nome} · ${d.estilo}${d.referencia ? ' · ' + d.referencia : ''}</span></div>`;
});
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:1600px}.c{display:flex;flex-direction:column;align-items:center;background:#fbf8f2;padding:4px;border-radius:6px;width:380px}</style>${cel.join('')}`);
console.log(xs.length, 'desenhos');
