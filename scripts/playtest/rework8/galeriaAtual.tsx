/**
 * REWORK 8 (Fase A) — a galeria do que EXISTE hoje, para o diagnóstico: cada desenho do jogo, nos tamanhos em que
 * aparece (miniatura, vitrine, destaque), sobre papel claro e escuro, com o que cada um compartilha:
 *   - veículos: cada FORMA, e quantos modelos do catálogo a usam (um Mustang e um 911 são o mesmo 'esportivo');
 *   - objetos: cada coisa do catálogo, e o desenho que ela usa (quatro eletrodomésticos são o mesmo 'eletro');
 *   - animais: as 15 espécies (o retrato do jogo), cães de cada família e gatos de cada tipo;
 *   - casas: as formas de moradia; lugares: os ícones de traço das vitrines de Compras.
 *   npx esbuild scripts/playtest/rework8/galeriaAtual.tsx --bundle --platform=node --jsx=automatic --outfile=<s>/g.cjs && OUT=<s>/atual.html node <s>/g.cjs
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DesenhoVeiculo, MiniaturaDaCasa, Icone } from '../../../src/ui/jogo/material/Desenhos';
import { DesenhoObjeto } from '../../../src/ui/jogo/material/Objetos';
import { Retrato } from '../../../src/ui/avatar/Retrato';
import { NOME_FORMA, VERSOES_VEICULO, formaDaVersao, type FormaVeiculo } from '../../../src/motor/dados/bens';
import { COISAS } from '../../../src/motor/dados/coisas';
import { ANIMAIS } from '../../../src/motor/dados/animais';
import type { FormaDaCasa } from '../../../src/ui/leituraMaterial';

const raiz = join(process.cwd(), 'src', 'ui'); // rodar da raiz do repositório
const css = ['tokens.css', 'vida.css', 'vivida.css', 'agir.css', 'material.css', 'experiencia.css', 'cotidiano.css', 'sistema.css'].map(f => readFileSync(join(raiz, f), 'utf8')).join('\n');
const r = (x: JSX.Element) => renderToStaticMarkup(x);

// A forma de cada objeto (a tabela de `Objetos.tsx`, lida do código-fonte para não duplicá-la à mão).
const fonteObjetos = readFileSync(join(raiz, 'jogo', 'material', 'Objetos.tsx'), 'utf8');
const formaDoObjeto = (id: string) => new RegExp(`\\b${id}: '([a-z]+)'`).exec(fonteObjetos)?.[1] ?? 'jogos (padrão)';

const modelosPorForma = new Map<FormaVeiculo, string[]>();
for (const x of VERSOES_VEICULO) { const f = formaDaVersao(x); modelosPorForma.set(f, [...(modelosPorForma.get(f) ?? []), `${x.marca} ${x.modelo}`]); }
const cores = ['#b8352b', '#2c4f8a', '#e8e4dc', '#1a1a1a', '#c9a227'];

const blocoVeiculos = (Object.keys(NOME_FORMA) as FormaVeiculo[]).map(f => {
  const ms = modelosPorForma.get(f) ?? [];
  return `<div class="item"><div class="linha">${cores.map((c, k) => r(<DesenhoVeiculo forma={f} cor={c} largura={72} semente={`m${k}`} />)).join('')}${r(<DesenhoVeiculo forma={f} cor={cores[1]} largura={180} semente="d" />)}</div>
    <p><b>${NOME_FORMA[f]}</b> · ${ms.length} modelo(s): ${ms.slice(0, 9).join(', ')}${ms.length > 9 ? '…' : ''}</p></div>`;
}).join('');

const porForma = new Map<string, string[]>();
for (const c of COISAS) porForma.set(formaDoObjeto(c.id), [...(porForma.get(formaDoObjeto(c.id)) ?? []), c.nome]);
const blocoObjetos = COISAS.map(c => `<div class="obj">${r(<DesenhoObjeto coisaId={c.id} tamanho={28} />)}${r(<DesenhoObjeto coisaId={c.id} tamanho={64} />)}<p><b>${c.nome}</b><br>desenho: ${formaDoObjeto(c.id)}${(porForma.get(formaDoObjeto(c.id))?.length ?? 0) > 1 ? ` <span class="alerta">(= ${porForma.get(formaDoObjeto(c.id))!.length} coisas)</span>` : ''}</p></div>`).join('');

const blocoAnimais = ANIMAIS.map(a => `<div class="obj">${[0, 1, 2].map(k => r(<Retrato visual={undefined} genero="feminino" idade={4} semente={`${a.id}${k}`} tamanho={64} especie={a.id as never} porte={(['pequeno', 'medio', 'grande'] as const)[k]} rotulo={a.id} />)).join('')}${r(<Retrato visual={undefined} genero="feminino" idade={4} semente={`${a.id}x`} tamanho={28} especie={a.id as never} rotulo={a.id} />)}<p><b>${a.nome[0]}</b></p></div>`).join('');
const blocoCaes = Array.from({ length: 12 }, (_, k) => r(<Retrato visual={undefined} genero="masculino" idade={5} semente={`cao${k * 7}`} tamanho={72} especie={'cachorro' as never} porte={(['pequeno', 'medio', 'grande'] as const)[k % 3]} rotulo="cão" />)).join('');
const blocoGatos = Array.from({ length: 12 }, (_, k) => r(<Retrato visual={undefined} genero="feminino" idade={5} semente={`gato${k * 5}`} tamanho={72} especie={'gato' as never} rotulo="gato" />)).join('');

const FORMAS_CASA: FormaDaCasa[] = ['republica', 'kitnet', 'apto_1q', 'apto_2q', 'apto_3q', 'alto_padrao', 'casa_simples', 'casa_2q', 'casa_3q', 'casa_grande', 'sitio'];
const blocoCasas = FORMAS_CASA.map(f => `<div class="obj">${r(<MiniaturaDaCasa forma={f} largura={104} />)}<p><b>${f}</b></p></div>`).join('');
const LUGARES = ['imobiliaria', 'usados', 'eletronicos', 'eletrodomesticos', 'instrumentos', 'esportes', 'livraria', 'loja', 'clinica', 'banco', 'abrigo', 'loja_pets', 'oficina', 'nautica', 'aeroclube'];
const blocoLugares = LUGARES.map(n => `<div class="obj">${r(<Icone nome={n} tamanho={44} />)}${r(<Icone nome={n} tamanho={22} />)}<p><b>${n}</b></p></div>`).join('');

const pagina = (tema: string) => `<!doctype html><html data-tema="${tema === 'claro' || tema === 'horizonte' ? 'claro' : 'escuro'}" data-paleta="${tema}"><head><meta charset="utf-8"><style>${css}
body{background:var(--fundo);color:var(--tinta);font:13px var(--font-sans);margin:0;padding:16px;width:1400px}
h2{font:500 20px var(--font-serif);margin:24px 0 8px}.linha{display:flex;gap:10px;align-items:flex-end}.item{padding:6px 0;border-bottom:1px solid var(--fio)}
.item p,.obj p{margin:4px 0;color:var(--tinta-2)}.grade{display:flex;flex-wrap:wrap;gap:10px}.obj{width:200px;padding:6px;background:var(--superficie);border-radius:8px}
.alerta{color:var(--ruim);font-weight:700}</style></head><body>
<h1 style="font:500 26px var(--font-serif)">O que existe hoje — ${tema}</h1>
<h2>Veículos (cada forma em cinco cores; a 72 e a 180 px)</h2>${blocoVeiculos}
<h2>Objetos (28 e 64 px)</h2><div class="grade">${blocoObjetos}</div>
<h2>Animais: as espécies (porte pequeno, médio, grande; 28 px)</h2><div class="grade">${blocoAnimais}</div>
<h2>Cães (12 sementes)</h2><div class="linha">${blocoCaes}</div><h2>Gatos (12 sementes)</h2><div class="linha">${blocoGatos}</div>
<h2>Casas</h2><div class="grade">${blocoCasas}</div>
<h2>Lugares (as vitrines de Compras que usam ícone)</h2><div class="grade">${blocoLugares}</div></body></html>`;

for (const tema of ['claro', 'escuro']) writeFileSync(process.env.OUT!.replace('.html', `-${tema}.html`), pagina(tema));
