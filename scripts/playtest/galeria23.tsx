/**
 * VIDA 23 — galeria de inspeção visual: as formas de corpo (frente, costas, vestido e só a pele), corpos sorteados como
 * os do mundo, a comparação antes/depois (o corpo de antes = a constituição ausente), as marcas naturais em peles claras
 * e escuras, os brincos (cada forma, de perto, e os metais lado a lado), os colares, pulseiras, anéis e piercings novos.
 *
 *   npx esbuild scripts/playtest/galeria23.tsx --bundle --platform=node --outfile=<scratch>/g23.cjs --jsx=automatic --loader:.tsx=tsx
 *   OUT=<scratch>/g23.html node <scratch>/g23.cjs   (depois, Playwright tira a foto: scripts/playtest/foto23.mjs)
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura, focoDaPeca } from '../../src/ui/avatar/Figura';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { focoDaJoiaNoRosto } from '../../src/ui/avatar/identidade13';
import { FORMAS23, gravarCorpo23, MARCAS23, sortearCorpo23, sortearMarcas23, sortearPelos23, TIPOS_DE_MARCA, type MarcaNatural } from '../../src/motor/v23/corpo/corpo23';
import { JOIAS20 } from '../../src/motor/dados20/joias20';
import { PIERCINGS } from '../../src/motor/dados/piercings129';
import type { Genero, Visual } from '../../src/motor/tipos';

const base = (x: Partial<Visual> = {}): Visual => ({ pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho', ...x } as Visual);
const L = 132;
const html: string[] = [];
const fig = (v: Visual, g: Genero, extra: Record<string, unknown> = {}, rot = '') => `<div class=c>${renderToStaticMarkup(<Figura visual={v} genero={g} idade={(extra.idade as number) ?? 30} semente={rot} corpo={(extra.corpo as never) ?? 'mediano'} pecas={(extra.pecas as never) ?? []} largura={(extra.largura as number) ?? L} semFundo={!!extra.semFundo} semCima={!!extra.semCima} descalco={!!extra.semCima} vista={(extra.vista as never) ?? 'frente'} foco={extra.foco as never} />)}<p>${rot}</p></div>`;
const secao = (t: string) => html.push(`<h2>${t}</h2><div class=l>`);
const fim = () => html.push('</div>');

// 1. As formas de partida, nos três gêneros, vestidas e só a pele.
for (const g of ['feminino', 'masculino'] as Genero[]) {
  secao(`Formas de partida — ${g} (vestido)`);
  for (const f of FORMAS23) html.push(fig(base({ corpo23: gravarCorpo23(f.c) ?? '222222222222', cabelo: g === 'feminino' ? 'longo_liso' : 'curto' }), g, { pecas: [{ itemId: 'camiseta', id: 'camiseta-a' }, { itemId: 'jeans', id: 'jeans-a' }] }, f.nome));
  fim();
  secao(`Formas de partida — ${g} (só a pele, de frente e de costas)`);
  for (const f of FORMAS23) html.push(fig(base({ corpo23: gravarCorpo23(f.c) ?? '222222222222', pele: 'p5', cabelo: g === 'feminino' ? 'coque' : 'raspado' }), g, { semCima: true }, f.nome));
  for (const f of FORMAS23.slice(0, 4)) html.push(fig(base({ corpo23: gravarCorpo23(f.c) ?? '222222222222', pele: 'p2' }), g, { semCima: true, vista: 'costas' }, `${f.nome} (costas)`));
  fim();
}
// 2. A condição por cima da constituição (a mesma constituição, cinco condições) e a estatura.
secao('Constituição "ampulheta" × as cinco condições; e a estatura (−2, 0, +2)');
for (const t of ['magro', 'mediano', 'atletico', 'musculoso', 'acima_do_peso']) html.push(fig(base({ corpo23: gravarCorpo23(FORMAS23.find(f => f.id === 'ampulheta')!.c) }), 'feminino', { corpo: t, semCima: true }, t));
for (const z of [-2, 0, 2]) html.push(fig(base({ corpo23: '222222222222' }), 'masculino', { corpo: { tipo: 'mediano', estatura: z } }, `estatura ${z}`));
fim();
// 3. O corpo de antes (sem constituição) e o mesmo com a base gravada: idênticos.
secao('Compatibilidade: sem corpo23 × corpo23 na base (devem ser iguais)');
for (const g of ['feminino', 'masculino', 'nao_binario'] as Genero[]) for (const t of ['mediano', 'acima_do_peso']) { html.push(fig(base(), g, { corpo: t }, `${g} ${t} antes`)); html.push(fig(base({ corpo23: '222222222222' }), g, { corpo: t }, `${g} ${t} base`)); }
fim();
// 4. Gente do mundo: 24 sorteios (constituição, marcas, pelos), vestidos e só a pele.
secao('Pessoas sorteadas (como os NPCs): vestidas');
const peles = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const gente = Array.from({ length: 24 }, (_, k) => {
  const g: Genero = k % 3 === 0 ? 'masculino' : k % 3 === 1 ? 'feminino' : 'nao_binario';
  const pele = peles[k % 6];
  const chave = `npc${k}`;
  return { g, v: base({ pele, corpo23: sortearCorpo23(chave), marcas23: sortearMarcas23(chave, pele), pelos23: sortearPelos23(chave, g), cabelo: g === 'feminino' ? 'longo_ondulado' : 'curto' }), chave };
});
for (const p of gente) html.push(fig(p.v, p.g, { pecas: [{ itemId: 'camiseta', id: `cam-${p.chave}` }, { itemId: 'bermuda', id: `be-${p.chave}` }] }, `${p.chave} ${p.v.corpo23 ?? 'base'} · ${(p.v.marcas23 ?? []).map(m => m.t).join(',') || 'sem marcas'}`));
fim();
secao('Pessoas sorteadas: só a pele');
for (const p of gente.slice(0, 12)) html.push(fig(p.v, p.g, { semCima: true }, p.chave));
fim();
// 5. As marcas: cada tipo e cada jeito, na pele clara e na escura, de perto.
secao('Marcas naturais — de perto (pele p2 e p5)');
const exemplos: [string, MarcaNatural][] = [];
for (const t of TIPOS_DE_MARCA) {
  const d = MARCAS23[t];
  const formas = d.formas?.map(f => f.id) ?? [undefined];
  for (const f of formas) {
    const r = t === 'covinhas' ? 'bochecha' : t === 'estrias' ? 'coxa' : t === 'sardas' ? 'ombro' : 'biceps';
    exemplos.push([`${t}${f ? ` ${f}` : ''}`, { t, r, l: t === 'covinhas' ? undefined : 'e', x: 0, y: 0, s: 2, f, i: 2, n: d.quantidade ? 18 : undefined, a: d.gira ? 30 : undefined, k: 123 } as MarcaNatural]);
  }
}
for (const pele of ['p2', 'p5']) for (const [nome, m] of exemplos) {
  const rosto = m.r === 'bochecha';
  html.push(fig(base({ pele, marcas23: [m], corpo23: '222222222222' }), 'feminino', { semCima: true, largura: 120, foco: rosto ? focoDaJoiaNoRosto('rosto', 30) : focoDaPeca('feminino', 'mediano', 30, m.r === 'coxa' ? 'pernas' : 'tronco') }, `${nome} · ${pele}`));
}
fim();
secao('Marcas no rosto (retrato 132 px): pinta, sardas, cicatriz, marca, covinhas');
const doRosto: MarcaNatural[][] = [
  [{ t: 'pinta', r: 'bochecha', l: 'e', x: 0.3, y: -0.2, s: 2, f: 'relevo', i: 3 }],
  [{ t: 'sardas', r: 'nariz', x: 0, y: 0, s: 1, n: 22, i: 2, k: 5 }, { t: 'sardas', r: 'bochecha', l: 'd', x: 0, y: 0, s: 1, n: 14, i: 2, k: 9 }],
  [{ t: 'cicatriz', r: 'sobrancelha_t' as never, l: 'd', x: 0, y: 0, s: 1, f: 'reta', a: 70, i: 3 }],
  [{ t: 'cicatriz', r: 'bochecha', l: 'e', x: 0, y: 0.2, s: 2, f: 'curva', a: 20, i: 2 }],
  [{ t: 'marca_nascenca', r: 'testa', x: -0.3, y: 0, s: 2, f: 'vinho', a: 10, k: 4 }],
  [{ t: 'covinhas', r: 'bochecha', x: 0, y: 0, s: 1 }],
  [{ t: 'covinhas', r: 'queixo', x: 0, y: 0, s: 1 }],
  [{ t: 'cicatriz', r: 'bochecha', l: 'd', x: 0, y: 0, s: 2, f: 'acne', i: 2, k: 77 }]
];
for (const pele of ['p1', 'p4', 'p6']) for (const ms of doRosto) html.push(`<div class=c>${renderToStaticMarkup(<Retrato visual={base({ pele, marcas23: ms })} genero="feminino" idade={28} semente="r" tamanho={132} />)}<p>${ms.map(m => `${m.t} ${m.f ?? ''}`).join(' + ')} · ${pele}</p></div>`);
fim();
// 6. Brincos: cada forma, de perto (um metal), e os metais lado a lado.
secao('Brincos — cada forma, de perto (orelha), pele p3');
const vistas = new Set<string>();
for (const j of JOIAS20.filter(x => x.lugar === 'orelha')) {
  if (vistas.has(j.forma)) continue; vistas.add(j.forma);
  html.push(fig(base({ cabelo: 'raspado', brincos: true, modeloBrincos: j.id }), 'feminino', { foco: focoDaJoiaNoRosto('orelha', 30), largura: 120 }, j.nome));
}
fim();
secao('O mesmo brinco em metais diferentes (argola grande fina, bolinha, argola grossa)');
for (const forma of ['argola_fina', 'bolinha', 'argola_grossa', 'argola_m']) for (const j of JOIAS20.filter(x => x.forma === forma)) html.push(fig(base({ cabelo: 'raspado', brincos: true, modeloBrincos: j.id, pele: 'p4' }), 'masculino', { foco: focoDaJoiaNoRosto('orelha', 30), largura: 110 }, j.nome));
fim();
secao('Brincos no rosto inteiro (retrato 132 px) — legibilidade no tamanho de uso');
for (const id of ['j20_candelabro_ouro_branco_diamante', 'j20_argola_fina_ouro_amarelo', 'j20_pendente_longo_ouro_amarelo_esmeralda', 'j20_assimetrico_prata_onix', 'j20_climber_ouro_amarelo_zirconia', 'j20_huggie_ouro_branco_diamante', 'j20_argola_grossa_prata', 'j20_corrente_fio_ouro_rose']) html.push(`<div class=c>${renderToStaticMarkup(<Retrato visual={base({ cabelo: 'coque', brincos: true, modeloBrincos: id, pele: 'p5' })} genero="feminino" idade={30} semente="b" tamanho={132} />)}<p>${id}</p></div>`);
fim();
// 7. Colares, pulseiras e anéis novos, no corpo e de perto.
secao('Pescoço, pulso e mão — formas novas, de perto');
for (const j of JOIAS20.filter(x => ['cubana', 'perolas', 'camadas', 'colar_longo', 'cordao', 'veneziana', 'grumet'].includes(x.forma) && (x.metal === 'ouro_amarelo' || x.metal === 'prata'))) html.push(fig(base({ pele: 'p3' }), 'masculino', { pecas: [{ itemId: 'regata', id: 'r' }, { itemId: j.id, id: j.id }], foco: focoDaPeca('masculino', 'mediano', 30, 'joia'), largura: 120 }, j.nome));
for (const j of JOIAS20.filter(x => (x.lugar === 'pulseira' || x.lugar === 'anel') && (x.metal === 'ouro_amarelo' || x.metal === 'prata' || x.metal === 'aco'))) html.push(fig(base({ pele: 'p2' }), 'feminino', { pecas: [{ itemId: j.id, id: j.id }], foco: focoDaPeca('feminino', 'mediano', 30, j.lugar === 'anel' ? 'anel' : 'pulseira'), largura: 100 }, j.nome));
fim();
secao('Piercings novos e o acabamento (aço × titânio × prata × ouro branco)');
for (const ids of [['pc_sobrancelha_rose'], ['pc_sobrancelha_argola_azul'], ['pc_medusa_espeto'], ['pc_medusa_diamante'], ['pc_labio_clicker'], ['pc_nariz_ponto_aco'], ['pc_nariz_ponto_zirconia'], ['pc_helix_argola', 'pc_tragus_ponto', 'pc_lobulo2_ponto_aco']]) {
  const p = PIERCINGS.find(x => x.id === ids[0])!;
  const zona = p.lugar === 'sobrancelha' ? 'sobrancelha' : p.lugar.startsWith('labio') || p.lugar === 'medusa' ? 'boca' : p.lugar.startsWith('nariz') ? 'nariz' : 'orelha';
  html.push(fig(base({ cabelo: 'raspado', piercings: ids }), 'feminino', { foco: focoDaJoiaNoRosto(zona, 30), largura: 110 }, ids.join(' + ')));
}
fim();

writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#efe9df;margin:8px;width:1500px}h2{font-size:14px;margin:14px 0 4px}.l{display:flex;flex-wrap:wrap;gap:6px}.c{background:#fbf8f2;border:1px solid #d8d0c4;padding:3px;display:grid;justify-items:center}.c p{margin:2px 0 0;max-width:132px;text-align:center}</style>${html.join('')}`);
