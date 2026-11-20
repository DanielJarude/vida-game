// VIDA 29 — saves de QA da Aparência: adulta de cabelo comprido com acessórios de todas as partes comprados pelas
// ações do jogo (óculos, chapéu, 3 brincos, colar, relógio, pulseira, anel, bolsa). OUT=<pasta>.
import { nova, viver } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { ITENS_ESTILO } from '../../src/motor/dados/estilo';
import type { Vida } from '../../src/motor/tipos';
import { mkdirSync, writeFileSync } from 'node:fs';
await carregarMundo();
const OUT = process.env.OUT ?? `${process.env.HOME}/vida-trabalho/v29/saves`; mkdirSync(OUT, { recursive: true });
let v: Vida = viver(nova({ semente: 2901, genero: 'feminino', municipioId: 'sao-paulo-sp' } as never), 26);
v.financas.conta = 5e6; v.momento = null; v.eu.visual.cabelo = 'longo_liso';
const it = ITENS_ESTILO as unknown as { id: string; lugar?: string; categoria: string; piercing?: unknown }[];
const pega = (f: (x: typeof it[number]) => boolean, n = 1) => it.filter(f).slice(0, n).map(x => x.id);
const orelha = it.filter(x => x.lugar === 'orelha');
const ids = [...pega(x => x.categoria === 'oculos'), ...pega(x => x.categoria === 'chapeu'), orelha[1].id, orelha[12].id, orelha[40].id,
  ...pega(x => x.lugar === 'joia'), ...pega(x => x.lugar === 'pulso'), ...pega(x => x.lugar === 'pulseira'), ...pega(x => x.lugar === 'anel'), ...pega(x => x.lugar === 'bolsa')];
const log: string[] = [];
for (const id of ids) { const d = disponibilidade(v, { tipo: 'comprar_item', itemId: id } as never); if (d.grau !== 'permitido') { log.push(`não comprou ${id}: ${(d as { motivo?: string }).motivo}`); continue; } v = executar(v, { tipo: 'comprar_item', itemId: id } as never).vida; v.anoAtual = { acoes: [] }; v.momento = null; }
log.push('tem: ' + (v.eu.estilo?.itens ?? []).map(x => `${x.itemId}${x.usando ? '*' : ''}`).join(' '));
log.push('visual: brincos=' + v.eu.visual.brincos + ' modelo=' + v.eu.visual.modeloBrincos + ' joia=' + v.eu.visual.modeloJoia + ' oculos=' + v.eu.visual.oculos + ' chapeu=' + v.eu.visual.chapeu);
writeFileSync(`${OUT}/vida-v29-aparencia.json`, JSON.stringify(v));
console.log(log.join('\n'));
