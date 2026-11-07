/**
 * VIDA 13 — móveis com volume: os blocos ficam dentro do desenho e do cômodo, o móvel girado mostra a ponta (a face
 * que dá para quem olha) e a frente vira para o meio do cômodo sem espelhar, o de frente mostra a lateral do lado do
 * meio e o tampo (abaixo do olho), as fatias seguem a perspectiva, as peças recuadas saem da frente — e a disposição,
 * sem lugar perfeito, fica com o que menos esconde.
 */
import { describe, expect, it } from 'vitest';
import { disporComodo, type Posto } from '../ilustracao/disposicao';
import { medidaDe } from '../ilustracao/medidas';
import { amostraDoObjeto } from '../ilustracao/objetos';
import { caixaDaAmostra } from '../ilustracao/caixa';
import { FIXOS_DA_CENA } from '../ilustracao/fixosDaCena';
import { VOLUMES, blocosDe, camera, fatias, noMundo, partesDoDesenho, passosDoMovel, projetar, referencial, temVolume } from '../ilustracao/volumes13';
import { CENAS13 } from '../../../scripts/playtest/galeria13Moveis';

const dispor = (tipo: string, area: number, ids: string[]) => disporComodo(tipo, area, ids.map((c, k) => ({ id: `o${k}`, coisaId: c })));
const desenhoDe = (id: string) => (id.startsWith('_') ? FIXOS_DA_CENA[id]?.('#c9a07a') : amostraDoObjeto(id, '#c9a07a'));
const faces = (d: ReturnType<typeof dispor>, p: Posto) => passosDoMovel(d.g, p, desenhoDe(p.coisaId)!, '#c9a07a').flatMap(s => (s.tipo === 'face' ? [s.face] : []));

describe('VIDA 13 · móveis com volume', () => {
  it('todo móvel com volume tem blocos dentro do quadro do desenho, com profundidade válida, e as peças existem', () => {
    for (const id of Object.keys(VOLUMES)) {
      const a = desenhoDe(id);
      expect(a, id).toBeTruthy();
      const c = caixaDaAmostra(a!);
      for (const b of blocosDe(id, a!, '#c9a07a')) {
        expect(b.u0 < b.u1 && b.v0 < b.v1, id).toBe(true);
        expect(b.u0 >= c.x0 - 3 && b.u1 <= c.x1 + 3 && b.v0 >= c.y0 - 3 && b.v1 <= c.y1 + 3, `${id} fora do desenho`).toBe(true);
        expect(b.p0 <= b.p1 && b.p0 >= -0.8 && b.p1 <= 1, id).toBe(true);
        if (b.pecas) expect(b.pecas[0] < b.pecas[1] && b.pecas[1] <= a!.pecas.length, `${id} peças`).toBe(true);
      }
    }
  });
  it('todo móvel de encostar que vai de lado (gira) tem volume', () => {
    for (const [tipo, area, ids] of CENAS13) {
      const d = dispor(tipo, area, ids);
      for (const p of d.postos.filter(x => x.giro)) expect(temVolume(p), p.coisaId).toBe(true);
    }
  });
  it('girado: a ponta que dá para quem olha aparece; a frente fica no plano que vira para o meio, e não espelha', () => {
    let girados = 0;
    for (const [tipo, area, ids] of CENAS13) {
      const d = dispor(tipo, area, ids);
      for (const p of d.postos.filter(x => x.giro)) {
        girados++;
        const fs = faces(d, p);
        expect(fs.some(f => f.tipo === 'ponta'), `${tipo} ${area} ${p.coisaId}`).toBe(true);
        const a = desenhoDe(p.coisaId)!, r = referencial(p, a);
        // a frente (profundidade 0) fica na borda do móvel que dá para o meio do cômodo
        const f0 = noMundo(r, r.c.x0, r.c.y1, 0)[0];
        expect(Math.abs(f0 - (p.giro === 'esq' ? p.x1 : p.x0))).toBeLessThan(1e-6);
        // na tela, a esquerda do desenho fica à esquerda (o desenho não sai espelhado)
        const e = projetar(d.g, noMundo(r, r.c.x0, r.c.y1, 0)), dd = projetar(d.g, noMundo(r, r.c.x1, r.c.y1, 0));
        expect(e[0]).toBeLessThan(dd[0]);
        // e o volume inteiro fica dentro do cômodo (entre as paredes, até a profundidade real)
        for (const u of [r.c.x0, r.c.x1]) for (const pf of [0, 1]) {
          const [x, , z] = noMundo(r, u, r.c.y1, pf);
          expect(x >= -1e-6 && x <= d.g.Wm + 1e-6 && z >= -1e-6 && z <= d.g.Dr + 1e-6, p.coisaId).toBe(true);
        }
      }
    }
    expect(girados).toBeGreaterThan(15);
  });
  it('a penteadeira tem tampo, gavetas, laterais, espelho recuado e pernas na frente e atrás', () => {
    const d = dispor('quarto', 12, ['cama_king', 'criado_mudo', 'penteadeira', 'tv', 'closet', 'tapete']);
    const p = d.postos.find(x => x.coisaId === 'penteadeira')!;
    expect(p.giro).toBeTruthy();
    const a = desenhoDe('penteadeira')!;
    const bl = blocosDe('penteadeira', a, '#c9a07a');
    const fs = faces(d, p);
    expect(fs.filter(f => f.tipo === 'topo').length).toBeGreaterThanOrEqual(3); // o tampo, o espelho, a banqueta
    expect(fs.filter(f => f.tipo === 'ponta').length).toBeGreaterThanOrEqual(5); // a lateral do tampo, das gavetas, das pernas
    // o espelho vai para o fundo do móvel, e sai da frente desenhada
    const espelho = bl.find(b => b.pecas?.[0] === 0)!;
    expect(espelho.p0).toBeGreaterThan(0.7);
    const partes = partesDoDesenho(a, bl);
    expect(partes.frente.pecas.some(x => x.marca === 'espelho')).toBe(false);
    expect(partes.porBloco.get(espelho)!.pecas.some(x => x.marca === 'espelho')).toBe(true);
    // pernas da frente e de trás no mesmo x do desenho
    expect(bl.filter(b => b.u0 === 16).map(b => b.p0).sort()).toEqual([0.04, 0.87]);
  });
  it('de frente: a lateral que aparece é a do lado do meio; o tampo aparece abaixo do olho, não acima', () => {
    const d = dispor('cozinha', 20, ['armarios_planejados', 'ilha_cozinha', 'geladeira_inox', 'adega_parede', 'cooktop_forno', 'lava_loucas', 'cafeteira']);
    const ilha = d.postos.find(x => x.coisaId === 'ilha_cozinha')!;
    expect(ilha.giro).toBeFalsy();
    expect(faces(d, ilha).some(f => f.tipo === 'topo')).toBe(true);
    const cam = camera(d.g);
    for (const [tipo, area, ids] of CENAS13) {
      const dd = dispor(tipo, area, ids);
      for (const p of dd.postos.filter(x => temVolume(x) && !x.giro && !dd.g.externo)) {
        const a = desenhoDe(p.coisaId)!, r = referencial(p, a);
        const fs = faces(dd, p);
        for (const b of blocosDe(p.coisaId, a, '#c9a07a')) {
          const topo = noMundo(r, b.u0, b.v0, 0)[1];
          if (topo > cam[1] + 0.05) expect(fs.some(f => f.tipo === 'topo' && blocosDe(p.coisaId, a, '#c9a07a')[f.bloco] === b), `${p.coisaId} topo acima do olho`).toBe(false);
        }
        // lateral: só do lado do meio do cômodo (a face fica mais perto do meio da tela que a frente do próprio bloco)
        const bls = blocosDe(p.coisaId, a, '#c9a07a');
        for (const f of fs.filter(x => x.tipo === 'lado')) {
          const b = bls[f.bloco];
          const cx = f.pts.reduce((t, q) => t + q[0], 0) / 4;
          const [fx] = projetar(dd.g, noMundo(r, (b.u0 + b.u1) / 2, b.v1, b.p0));
          expect(Math.abs(cx - dd.g.W / 2) <= Math.abs(fx - dd.g.W / 2) + 0.5, `${tipo} ${p.coisaId}`).toBe(true);
        }
      }
    }
  });
  it('as fatias do girado acompanham a perspectiva (perto de quem olha, maiores) e cobrem o desenho sem buraco', () => {
    const d = dispor('quarto', 14, ['cama_box', 'criado_mudo', 'penteadeira', 'guarda_roupa', 'comoda', 'espelho_chao', 'tapete']);
    for (const p of d.postos.filter(x => x.giro)) {
      const a = desenhoDe(p.coisaId)!, r = referencial(p, a);
      const fs = fatias(d.g, r, r.c.x0, r.c.x1, r.c.y0, r.c.y1, 0, 2.4);
      expect(fs.length).toBeGreaterThan(1);
      for (let k = 1; k < fs.length; k++) expect(fs[k].u0).toBeCloseTo(fs[k - 1].u1, 6);
      expect(fs[0].u0).toBe(r.c.x0);
      expect(fs[fs.length - 1].u1).toBe(r.c.x1);
      // a escala vertical (d) cresce para o lado de quem olha
      const ds = fs.map(f => f.m[3]);
      const perto = noMundo(r, r.c.x0, 0, 0)[2] > noMundo(r, r.c.x1, 0, 0)[2];
      for (let k = 1; k < ds.length; k++) expect(perto ? ds[k] <= ds[k - 1] + 1e-9 : ds[k] >= ds[k - 1] - 1e-9).toBe(true);
    }
    // de frente: uma fatia só
    const fr = d.postos.find(x => temVolume(x) && !x.giro);
    if (fr) { const a = desenhoDe(fr.coisaId)!, r = referencial(fr, a); expect(fatias(d.g, r, r.c.x0, r.c.x1, r.c.y0, r.c.y1, 0).length).toBe(1); }
  });
  it('a cadeira que vem desenhada na escrivaninha sai quando o cômodo tem a cadeira de verdade', () => {
    const a = desenhoDe('escrivaninha')!, bl = blocosDe('escrivaninha', a, '#c9a07a');
    expect(partesDoDesenho(a, bl, true).frente.pecas.some(x => x.marca === 'cadeira')).toBe(false);
    expect([...partesDoDesenho(a, bl, true).porBloco.keys()].some(b => b.cadeira)).toBe(false);
    expect([...partesDoDesenho(a, bl, false).porBloco.keys()].some(b => b.cadeira)).toBe(true);
  });
  it('oclusão: sem lugar perfeito, o banheiro não esconde o vaso atrás da banheira', () => {
    const d = dispor('banheiro', 10, ['banheira', 'bancada_marmore', 'espelho_led', 'ducha', 'toalhas']);
    const vaso = d.postos.find(x => x.coisaId === '_vaso')!, banheira = d.postos.find(x => x.coisaId === 'banheira')!;
    expect(vaso && banheira).toBeTruthy();
    const naFrente = banheira.z0 >= vaso.z1 - 0.01 && Math.min(banheira.x1, vaso.x1) - Math.max(banheira.x0, vaso.x0) > 0.5 * (vaso.x1 - vaso.x0);
    expect(naFrente).toBe(false);
  });
  it('as cenas de auditoria: tudo dentro do cômodo, sem sobreposição de móveis grandes, poucos de fora', () => {
    let fora = 0;
    for (const [tipo, area, ids] of CENAS13) {
      const d = dispor(tipo, area, ids);
      fora += d.fora.length;
      const chao = d.postos.filter(p => p.montagem === 'chao');
      for (const p of chao) expect(p.x0 >= -1e-6 && p.x1 <= d.g.Wm + 1e-6 && p.z0 >= -1e-6 && p.z1 <= d.g.Dr + 1e-6, `${tipo} ${area} ${p.coisaId}`).toBe(true);
      const pequeno = (p: Posto) => (p.x1 - p.x0) * (p.z1 - p.z0) < 0.36 && p.h < 0.9;
      for (const a of chao) for (const b of chao) {
        if (a === b || pequeno(a) || pequeno(b) || (medidaDe(a.coisaId).vao ?? 0) < 0 || (medidaDe(b.coisaId).vao ?? 0) < 0) continue;
        const sx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), sz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
        expect(sx > 0.01 && sz > 0.01, `${tipo} ${area}: ${a.coisaId} × ${b.coisaId}`).toBe(false);
      }
    }
    expect(fora).toBeLessThanOrEqual(6);
  });
});
