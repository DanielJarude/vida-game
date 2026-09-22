/**
 * Empacota `dist/` em `vida-itch.zip`, pronto para upload no itch.io.
 *
 * REGRA QUE O ITCH.IO IMPÕE: o `index.html` precisa estar na RAIZ do ZIP.
 * Se o pacote contiver `dist/index.html`, o itch não encontra o ponto de
 * entrada e a página fica em branco. Por isso os caminhos aqui são gravados
 * relativos a `dist/`, sem prefixo de pasta.
 *
 * Implementado em Node puro (zlib, que já vem com o Node) em vez de chamar o
 * binário `zip`: não adiciona dependência nenhuma ao projeto e funciona igual
 * no Windows, onde `zip` normalmente não existe.
 *
 * Uso:  npm run package:itch    (roda o build antes)
 *       node scripts/itch/empacotar.mjs   (empacota o dist já existente)
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
  rmSync
} from 'node:fs';
import { resolve, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, crc32 } from 'node:zlib';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = join(raiz, 'dist');
const destino = join(raiz, 'vida-itch.zip');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('ERRO: dist/index.html não existe. Rode `npm run build` antes.');
  process.exit(1);
}

/** Lista todos os arquivos de `dir`, recursivamente, em caminhos relativos. */
function listar(dir, base = dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory()
      ? listar(caminho, base)
      : [relative(base, caminho)];
  });
}

// Sempre com '/' — a especificação do ZIP exige barra normal, inclusive
// quando o pacote é gerado no Windows.
const arquivos = listar(dist).sort();
const paraZip = (p) => p.split(sep).join('/');

const locais = [];
const central = [];
let offset = 0;

// Data fixa (2026-01-01). Carimbar a hora da execução faria o mesmo conteúdo
// gerar ZIPs com bytes diferentes a cada build — pacote reproduzível é mais
// fácil de conferir.
const HORA_DOS = 0;
const DATA_DOS = ((2026 - 1980) << 9) | (1 << 5) | 1;

for (const arquivo of arquivos) {
  const nome = Buffer.from(paraZip(arquivo), 'utf-8');
  const conteudo = readFileSync(join(dist, arquivo));
  const comprimido = deflateRawSync(conteudo, { level: 9 });
  const crc = crc32(conteudo);

  const cabecalho = Buffer.alloc(30);
  cabecalho.writeUInt32LE(0x04034b50, 0); // assinatura local
  cabecalho.writeUInt16LE(20, 4); // versão necessária
  cabecalho.writeUInt16LE(0x0800, 6); // flag de nome em UTF-8
  cabecalho.writeUInt16LE(8, 8); // método: deflate
  cabecalho.writeUInt16LE(HORA_DOS, 10);
  cabecalho.writeUInt16LE(DATA_DOS, 12);
  cabecalho.writeUInt32LE(crc, 14);
  cabecalho.writeUInt32LE(comprimido.length, 18);
  cabecalho.writeUInt32LE(conteudo.length, 22);
  cabecalho.writeUInt16LE(nome.length, 26);
  cabecalho.writeUInt16LE(0, 28);

  locais.push(cabecalho, nome, comprimido);

  const dirEntry = Buffer.alloc(46);
  dirEntry.writeUInt32LE(0x02014b50, 0); // assinatura central
  dirEntry.writeUInt16LE(20, 4);
  dirEntry.writeUInt16LE(20, 6);
  dirEntry.writeUInt16LE(0x0800, 8);
  dirEntry.writeUInt16LE(8, 10);
  dirEntry.writeUInt16LE(HORA_DOS, 12);
  dirEntry.writeUInt16LE(DATA_DOS, 14);
  dirEntry.writeUInt32LE(crc, 16);
  dirEntry.writeUInt32LE(comprimido.length, 20);
  dirEntry.writeUInt32LE(conteudo.length, 24);
  dirEntry.writeUInt16LE(nome.length, 28);
  dirEntry.writeUInt32LE(0o644 << 16, 38); // permissões
  dirEntry.writeUInt32LE(offset, 42);

  central.push(dirEntry, nome);
  offset += cabecalho.length + nome.length + comprimido.length;
}

const corpo = Buffer.concat(locais);
const indice = Buffer.concat(central);

const fim = Buffer.alloc(22);
fim.writeUInt32LE(0x06054b50, 0);
fim.writeUInt16LE(arquivos.length, 8);
fim.writeUInt16LE(arquivos.length, 10);
fim.writeUInt32LE(indice.length, 12);
fim.writeUInt32LE(corpo.length, 16);

if (existsSync(destino)) rmSync(destino);
writeFileSync(destino, Buffer.concat([corpo, indice, fim]));

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`\nvida-itch.zip gerado em: ${destino}`);
console.log(`${arquivos.length} arquivos · ${kb(statSync(destino).size)} comprimido\n`);
for (const a of arquivos) {
  console.log(`  ${paraZip(a)}  (${kb(statSync(join(dist, a)).size)})`);
}
console.log('\nO index.html está na RAIZ do ZIP, como o itch.io exige.');
