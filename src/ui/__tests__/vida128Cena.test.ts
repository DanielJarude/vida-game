/**
 * VIDA 12.8 — a disposição dos cômodos: nada sobreposto, cada coisa montada como é, na escala de verdade.
 */
import { describe, expect, it } from 'vitest';
import { disporComodo, escalaEm, geometria, type Posto } from '../ilustracao/disposicao';
import { MEDIDAS } from '../ilustracao/medidas';
import { caixaDaAmostra } from '../ilustracao/caixa';
import { amostraDoObjeto } from '../ilustracao/objetos';
import { COISAS } from '../../motor/dados/coisas';

const dispor = (tipo: string, area: number, ids: string[]) => disporComodo(tipo, area, ids.map((c, i) => ({ coisaId: c, id: `${c}#${i}` })));
const noChao = (ps: Posto[]) => ps.filter(p => p.montagem === 'chao');
const cruza = (a: Posto, b: Posto) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;

const CENAS: [string, number, string[]][] = [
  ['sala', 20, ['sofa_couro', 'mesa_centro_marmore', 'tv_oled', 'tapete_persa', 'poltrona_designer', 'mesa_lateral', 'quadros', 'plantas', 'objetos_decor', 'aparador']],
  ['quarto', 12, ['cama_box', 'criado_mudo', 'guarda_roupa', 'ar_condicionado', 'notebook', 'celular_bom', 'chuteira_bola', 'camping', 'violao']],
  ['quarto', 28, ['cama_king', 'criado_mudo', 'closet', 'penteadeira', 'espelho_chao', 'tapete', 'tv_oled', 'quadros', 'ar_condicionado']],
  ['cozinha', 10, ['geladeira', 'fogao', 'microondas', 'cafeteira', 'louca_talheres', 'maquina_lavar']],
  ['banheiro', 4.5, ['gabinete', 'espelho_led', 'toalheiro', 'toalhas']],
  ['piscina', 60, ['espreguicadeira_teca', 'ombrelone', 'sofa_externo', 'mesa_externa', 'cascata', 'boias', 'luz_piscina', 'aquecedor_piscina', 'kit_piscina']],
  ['academia', 14, ['estacao_musculacao', 'esteira', 'bicicleta_ergometrica', 'kit_academia', 'saco_pancada']],
  ['escritorio', 9, ['mesa_executiva', 'cadeira_ergonomica', 'monitores', 'impressora', 'estante_escritorio', 'quadros']]
];

describe('a disposição dos cômodos', () => {
  it('nada se sobrepõe no chão; tudo dentro do cômodo; nada fica de fora nos cômodos comuns', () => {
    for (const [tipo, area, ids] of CENAS) {
      const d = dispor(tipo, area, ids);
      expect(d.fora, `${tipo} ${area}`).toEqual([]);
      const chao = noChao(d.postos);
      for (const p of d.postos) {
        expect(p.x0, `${tipo}:${p.coisaId}`).toBeGreaterThanOrEqual(-0.01);
        expect(p.x1, `${tipo}:${p.coisaId}`).toBeLessThanOrEqual(d.g.Wm + 0.01);
        expect(p.z1, `${tipo}:${p.coisaId}`).toBeLessThanOrEqual(d.g.Dv + 0.01);
      }
      for (let i = 0; i < chao.length; i++) for (let j = i + 1; j < chao.length; j++) {
        // a cadeira encaixada na mesa é a única sobreposição permitida
        if ([chao[i].coisaId, chao[j].coisaId].includes('cadeira_ergonomica')) continue;
        expect(cruza(chao[i], chao[j]), `${tipo}: ${chao[i].coisaId} × ${chao[j].coisaId}`).toBe(false);
      }
      if (d.piscina) for (const p of chao) expect(cruza(p, { ...p, ...d.piscina }), `${p.coisaId} dentro da piscina`).toBe(false);
    }
  });
  it('o ar-condicionado, os quadros e o espelho vão na parede (o ar bem alto); o tapete no piso; a boia na água; o celular num tampo', () => {
    const q = dispor('quarto', 12, ['cama_box', 'ar_condicionado', 'quadros', 'celular_bom', 'tapete']).postos;
    const ar = q.find(p => p.coisaId === 'ar_condicionado')!;
    expect(ar.montagem).toBe('parede'); expect(ar.base).toBeGreaterThanOrEqual(1.9);
    expect(q.find(p => p.coisaId === 'quadros')!.montagem).toBe('parede');
    expect(q.find(p => p.coisaId === 'tapete')!.montagem).toBe('tapete');
    const cel = q.find(p => p.coisaId === 'celular_bom')!;
    expect(cel.montagem).toBe('superficie'); expect(cel.base).toBeGreaterThan(0.4);
    const pis = dispor('piscina', 60, ['boias', 'espreguicadeira', 'guarda_sol']);
    const boia = pis.postos.find(p => p.coisaId === 'boias')!;
    expect(boia.montagem).toBe('agua');
    expect(boia.x0).toBeGreaterThanOrEqual(pis.piscina!.x0); expect(boia.z1).toBeLessThanOrEqual(pis.piscina!.z1);
    // a espreguiçadeira fica no deck (atrás da água, de frente para ela)
    expect(pis.postos.find(p => p.coisaId === 'espreguicadeira')!.z1).toBeLessThanOrEqual(pis.piscina!.z0);
  });
  it('as mesas de cabeceira ficam uma de cada lado da cama; a mesa de centro, na frente do sofá; o tapete, sob o sofá', () => {
    const q = dispor('quarto', 16, ['cama_box', 'criado_mudo']).postos;
    const cama = q.find(p => p.coisaId === 'cama_box')!;
    const cab = q.filter(p => p.coisaId === 'criado_mudo');
    expect(cab).toHaveLength(2);
    expect(cab.some(p => p.x1 <= cama.x0) && cab.some(p => p.x0 >= cama.x1)).toBe(true);
    const s = dispor('sala', 20, ['sofa', 'mesa_centro', 'tapete']).postos;
    const sofa = s.find(p => p.coisaId === 'sofa')!, mesa = s.find(p => p.coisaId === 'mesa_centro')!, tap = s.find(p => p.coisaId === 'tapete')!;
    expect(mesa.z0).toBeGreaterThan(sofa.z1);
    expect(Math.abs((mesa.x0 + mesa.x1) / 2 - (sofa.x0 + sofa.x1) / 2)).toBeLessThan(0.3);
    expect(tap.x0).toBeLessThanOrEqual(sofa.x0 + 0.1); expect(tap.x1).toBeGreaterThanOrEqual(sofa.x1 - 0.1);
  });
  it('a escala é a de verdade: a barraca armada é bem maior que as chuteiras; dentro de casa, a barraca vai guardada', () => {
    expect(MEDIDAS.camping.w / MEDIDAS.chuteira_bola.w).toBeGreaterThan(5);
    const j = dispor('jardim', 70, ['camping', 'chuteira_bola']).postos;
    const b = j.find(p => p.coisaId === 'camping')!, c = j.find(p => p.coisaId === 'chuteira_bola')!;
    expect((b.x1 - b.x0) / (c.x1 - c.x0)).toBeGreaterThan(5);
    const q = dispor('quarto', 12, ['camping']).postos.find(p => p.coisaId === 'camping')!;
    expect(q.x1 - q.x0).toBeLessThan(1);
  });
  it('a geometria segue a área: o lavabo é estreito, a sala da mansão é larga; a perspectiva aumenta para a frente', () => {
    const lav = geometria('lavabo', 2.5), sala = geometria('sala', 60);
    expect(lav.Wm).toBeLessThan(2.2); expect(sala.Wm).toBeGreaterThan(8);
    expect(lav.fx1 - lav.fx0).toBeLessThan(sala.fx1 - sala.fx0);
    expect(escalaEm(sala, sala.Dv)).toBeGreaterThan(escalaEm(sala, 0));
  });
  it('todo objeto da casa tem medida (ou cai na caixa padrão) e um desenho com caixa de verdade', () => {
    const daCasa = COISAS.filter(c => c.daCasa);
    const semMedida = daCasa.filter(c => !MEDIDAS[c.id]).map(c => c.id);
    expect(semMedida).toEqual([]);
    for (const c of COISAS) {
      const k = caixaDaAmostra(amostraDoObjeto(c.id, '#888888'));
      expect(k.x1 - k.x0, c.id).toBeGreaterThan(4);
      expect(k.y1 - k.y0, c.id).toBeGreaterThan(2);
    }
  });
});
