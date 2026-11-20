// VIDA 29 — save de QA do campo: adulto com uma fazenda de gado em produção (pasto lotado, solo cansado, sem seguro) e
// um sítio com horta (equipe curta), comprados pelas ações do jogo. OUT=<pasta>.
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar } from '../../src/motor/acoes';
import { ofertasRurais } from '../../src/motor/v18/rural/acoes18';
import { todasAsPropriedades } from '../../src/motor/v18/rural/fazenda18';
import type { Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v29/saves`; mkdirSync(OUT, { recursive: true });
let v: Vida = viver(nova({ semente: 2902, genero: 'masculino', municipioId: 'uberlandia-mg' } as never), 38);
v.financas.conta = 40e6; v.financas.negativado = false; v.momento = null;
const r = (oque: Record<string, unknown>) => { const x = executar(v, { tipo: 'rural18', oque } as never); v = x.vida; v.momento = null; };
for (const tipo of ['pecuaria', 'sitio']) { const o = ofertasRurais(v).find(x => x.p.tipo === tipo); if (o) r({ op: 'comprar', oferta: o.id }); }
const ps = todasAsPropriedades(v).map(x => x.p);
for (const p of ps) if (p.uso !== 'producao') r({ op: 'uso', id: p.id, uso: 'producao' });
const faz = todasAsPropriedades(v).find(x => x.p.tipo === 'pecuaria')?.p;
if (faz) { if (!faz.rebanhos.some(x => x.especie === 'corte')) r({ op: 'animais', id: faz.id, especie: 'corte', lotes: 3 }); const f2 = todasAsPropriedades(v).find(x => x.p.id === faz.id)!.p; const rb = f2.rebanhos.find(x => x.especie === 'corte'); if (rb) rb.cabecas = Math.round(rb.cabecas * 3); f2.solo = 46; f2.seguro = false; }
const sit = todasAsPropriedades(v).find(x => x.p.tipo === 'sitio')?.p;
if (sit) { r({ op: 'plantar', id: sit.id, cultura: 'horta', ha: Math.min(4, Math.floor(sit.ha * 0.4)) }); r({ op: 'admin29', id: sit.id, admin: 'gerente' }); r({ op: 'equipe29', id: sit.id, n: 1 }); }
writeFileSync(`${OUT}/vida-v29-rural.json`, JSON.stringify(v));
console.log(todasAsPropriedades(v).map(x => `${x.p.nome} ${x.p.tipo} ${x.p.ha}ha uso=${x.p.uso} reb=${x.p.rebanhos.map(b => b.especie + ':' + b.cabecas).join(',')} tal=${x.p.talhoes.map(t => t.cultura).join(',')}`).join('\n'));
