/**
 * REWORK 8 (Fase B) — a galeria da linguagem nova, com os componentes DO JOGO (não do protótipo): cada modelo de
 * veículo do catálogo (na cor de um anúncio e em prata, a 32, 88 e 220 px), cada objeto, cada lugar, cada casa, os
 * bichos — nas quatro paletas. É a peça da auditoria visual (recortes, contraste, reconhecimento pequeno).
 *   (da raiz) npx esbuild scripts/playtest/rework8/galeriaB.tsx --bundle --platform=node --jsx=automatic --loader:.css=empty --outfile=<s>/gb.cjs
 *   OUT=<s>/b.html SECOES=veiculos,objetos,lugares,casas,bichos node <s>/gb.cjs   → b-<paleta>.html
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReactElement } from 'react';
import { VERSOES_VEICULO, formaDaVersao } from '../../../src/motor/dados/bens';
import { CenaDaCasa, DesenhoVeiculo, MiniaturaDaCasa } from '../../../src/ui/jogo/material/Desenhos';
import type { FormaDaCasa, LeituraLar } from '../../../src/ui/leituraMaterial';
import { DesenhoObjeto } from '../../../src/ui/jogo/material/Objetos';
import { Fachada } from '../../../src/ui/ilustracao/Fachada';
import { LUGARES_DA_CIDADE } from '../../../src/ui/ilustracao/lugares';
import { Retrato } from '../../../src/ui/avatar/Retrato';
import { COISAS } from '../../../src/motor/dados/coisas';
import { variantesDaCoisa } from '../../../src/motor/dados/pertences';

const raiz = join(process.cwd(), 'src', 'ui');
const css = ['tokens.css'].map(f => readFileSync(join(raiz, f), 'utf8')).join('\n');
const r = (x: ReactElement) => renderToStaticMarkup(x);
const CORES = ['#b8352b', '#2c4f8a', '#e8e5de', '#1f1d1b', '#c9a23a', '#3f6b4a', '#7a2433', '#9aa3ab'];
const SECOES = (process.env.SECOES ?? 'veiculos').split(',');

const extras: Record<string, () => string> = {};
function registrar(nome: string, f: () => string) { extras[nome] = f; }

function veiculos() {
  return VERSOES_VEICULO.map((x, k) => {
    const forma = formaDaVersao(x);
    const cor = CORES[k % CORES.length];
    return `<div class="item"><div class="linha">${r(<DesenhoVeiculo forma={forma} versaoId={x.id} cor={cor} largura={32} />)}${r(<DesenhoVeiculo forma={forma} versaoId={x.id} cor={cor} largura={88} />)}${r(<DesenhoVeiculo forma={forma} versaoId={x.id} cor="#a9adb2" largura={88} estado={30} />)}${r(<DesenhoVeiculo forma={forma} versaoId={x.id} cor={cor} largura={220} />)}</div><p><b>${x.marca} ${x.modelo}</b> · ${forma}</p></div>`;
  }).join('');
}

function objetos() {
  return COISAS.map(c => {
    const vs = variantesDaCoisa(c.id);
    return `<div class="item"><div class="linha">${r(<DesenhoObjeto coisaId={c.id} tamanho={32} />)}${r(<DesenhoObjeto coisaId={c.id} tamanho={52} />)}${vs.slice(1, 4).map(v => r(<DesenhoObjeto coisaId={c.id} cor={v.cor} tamanho={76} />)).join('')}${r(<DesenhoObjeto coisaId={c.id} cor={vs[vs.length - 1].cor} tamanho={180} />)}</div><p><b>${c.nome}</b> · ${c.id} · ${vs.map(v => v.nome).join(', ')}</p></div>`;
  }).join('');
}
registrar('objetos', () => `<h2>Objetos — cada coisa (32 · 52 · variantes a 76 · 180)</h2><div class="grade">${objetos()}</div>`);

function lugares() {
  return LUGARES_DA_CIDADE.map(l => `<div class="item"><div class="linha">${r(<Fachada lugar={l} largura={230} altura={104} vazia />)}${r(<Fachada lugar={l} largura={358} altura={104} />)}${r(<Fachada lugar={l} recorte largura={48} />)}${r(<Fachada lugar={l} recorte largura={96} />)}</div><p><b>${l}</b></p></div>`).join('');
}
registrar('lugares', () => `<h2>Lugares — fachadas (230 vazia · 358 com objetos · 48 · 96)</h2><div class="grade">${lugares()}</div>`);

const FORMAS_CASA: FormaDaCasa[] = ['republica', 'kitnet', 'apto_1q', 'apto_2q', 'apto_3q', 'alto_padrao', 'casa_simples', 'casa_2q', 'casa_3q', 'casa_grande', 'sitio', 'familia', 'parente', 'favor', 'funcional'];
const NIVEIS = ['boa', 'gasta', 'ruim', 'problema'];
function casas() {
  return FORMAS_CASA.map((forma, k) => {
    const l = (extra: Partial<LeituraLar>) => ({ forma, padrao: forma === 'casa_simples' ? 1 : 3, condicao: { nivel: 'boa', reformaRecente: false }, bichos: [], janelasAcesas: 2, selos: [], moradores: [], frase: '', onde: '', rural: false, funcional: false, ...extra }) as unknown as LeituraLar;
    const nivel = NIVEIS[k % 4];
    return `<div class="item"><div class="linha">${r(<CenaDaCasa l={l({ janelasAcesas: 3, veiculo: k % 3 === 0 ? 'moto' : k % 3 === 1 ? 'carro' : 'bicicleta', formaVeiculo: (['street', 'suv', 'urbana'] as const)[k % 3], corVeiculo: CORES[k % CORES.length], versaoVeiculo: k % 3 === 1 ? 'jeep_renegade' : undefined, bichos: [{ id: 'c' + k, nome: 'Pipoca', especie: 'cachorro' }, { id: 'g' + k, nome: 'Mingau', especie: 'gato' }] })} />)}${r(<CenaDaCasa l={l({ condicao: { nivel, reformaRecente: k % 5 === 4 } as LeituraLar['condicao'], fachada: k % 2 ? { cor: '#7fa3b8', nome: 'azul' } : undefined, padrao: 1 })} />)}${r(<MiniaturaDaCasa forma={forma} largura={84} />)}${r(<MiniaturaDaCasa forma={forma} largura={44} fachada={{ cor: '#c98a5a', nome: 'terracota' }} />)}</div><p><b>${forma}</b> · estado: ${nivel}</p></div>`;
  }).join('');
}
registrar('casas', () => `<h2>Casas (cena com tudo · cena com estado e fachada · miniatura 84 · 44)</h2><div class="grade">${casas()}</div>`);

function bichos() {
  const caes = Array.from({ length: 24 }, (_, k) => r(<Retrato visual={undefined} genero="masculino" idade={3} semente={`cao-${k * 7 + 3}`} tamanho={k < 12 ? 96 : 52} especie="cachorro" porte={(['pequeno', 'medio', 'grande'] as const)[k % 3]} />)).join('');
  const gatos = Array.from({ length: 16 }, (_, k) => r(<Retrato visual={undefined} genero="feminino" idade={3} semente={`gato-${k * 5 + 1}`} tamanho={k < 10 ? 96 : 52} especie="gato" />)).join('');
  return `<div class="linha" style="flex-wrap:wrap">${caes}</div><div class="linha" style="flex-wrap:wrap;margin-top:8px">${gatos}</div>`;
}
registrar('bichos', () => `<h2>Cães e gatos (96 · 52)</h2>${bichos()}`);

function pagina(paleta: string) {
  const blocos = SECOES.map(s => (s === 'veiculos' ? `<h2>Veículos — cada modelo (32 · 88 · 88 cansado · 220)</h2><div class="grade">${veiculos()}</div>` : extras[s] ? extras[s]() : '')).join('');
  return `<!doctype html><html data-tema="${paleta === 'claro' || paleta === 'horizonte' ? 'claro' : 'escuro'}" data-paleta="${paleta}"><head><meta charset="utf-8"><style>${css}
body{background:var(--fundo);color:var(--tinta);font:12px Inter,system-ui,sans-serif;margin:0;padding:16px;width:1560px}
svg.cena{width:300px;height:auto}h2{font:500 20px Newsreader,Georgia,serif;margin:18px 0 8px}.grade{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
.item{background:var(--superficie);border-radius:8px;padding:6px 8px;box-shadow:0 0 0 1px var(--fio)}.linha{display:flex;align-items:flex-end;gap:10px}.item p{margin:2px 0 0;color:var(--tinta-2)}</style></head><body>${blocos}</body></html>`;
}

export function gerar() { for (const p of (process.env.PALETAS ?? 'claro,horizonte,escuro,atlantico').split(',')) writeFileSync(process.env.OUT!.replace('.html', `-${p}.html`), pagina(p)); }
gerar();
