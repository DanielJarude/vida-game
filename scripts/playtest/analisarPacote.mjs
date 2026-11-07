import { build } from 'vite';
const alvo = process.env.ALVO ?? 'motor';
await build({ configFile: 'vite.config.ts', logLevel: 'error', build: { outDir: process.env.HOME + '/vida-trabalho/a13/dist-analise', emptyOutDir: true }, plugins: [{
  name: 'analise', generateBundle(_o, bundle) {
    const chunkDe = new Map();
    for (const c of Object.values(bundle)) if (c.type === 'chunk') for (const id of Object.keys(c.modules)) chunkDe.set(id, c.name);
    const linhas = [];
    for (const c of Object.values(bundle)) {
      if (c.type !== 'chunk' || c.name !== alvo) continue;
      for (const [id, m] of Object.entries(c.modules)) {
        const info = this.getModuleInfo(id);
        const imp = [...(info?.importers ?? []), ...(info?.dynamicImporters ?? [])];
        const deDentro = imp.filter(i => chunkDe.get(i) === alvo);
        const deps = (info?.importedIds ?? []).map(d => chunkDe.get(d)).filter(Boolean);
        linhas.push([m.renderedLength, id.replace(/.*src\//, ''), deDentro.length, [...new Set(imp.map(i => chunkDe.get(i)))].join(','), [...new Set(deps)].join(',')]);
      }
    }
    linhas.sort((a, b) => b[0] - a[0]);
    for (const l of linhas.slice(0, 60)) console.log(l.join(' | '));
  } }] });
