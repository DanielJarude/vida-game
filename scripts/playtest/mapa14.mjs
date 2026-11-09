import { build } from 'vite';
import fs from 'fs';
await build({ configFile: 'vite.config.ts', logLevel: 'error', build: { outDir: process.env.HOME + '/vida-trabalho/a14/dist-mapa', emptyOutDir: true }, plugins: [{
  name: 'mapa', generateBundle(_o, bundle) {
    const linhas = [];
    for (const c of Object.values(bundle)) if (c.type === 'chunk') for (const [id, m] of Object.entries(c.modules)) if (id.includes('/src/')) linhas.push(`${c.name}\t${m.renderedLength}\t${id.replace(/.*\/src\//, 'src/')}`);
    linhas.sort();
    fs.writeFileSync(process.env.HOME + '/vida-trabalho/a14/MAPA-DE-PACOTES.tsv', 'pacote\tbytes\tmodulo\n' + linhas.join('\n') + '\n');
  } }] });
