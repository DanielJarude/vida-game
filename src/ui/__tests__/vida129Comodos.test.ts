/**
 * VIDA 12.9 — composição dos cômodos: o móvel de encostar vai de lado, nada grande tapa a âncora, nada some da cena
 * à toa, e a sobreposição só acontece com móvel pequeno e baixo.
 */
import { describe, expect, it } from 'vitest';
import { disporComodo, type Posto } from '../ilustracao/disposicao';
import { medidaDe } from '../ilustracao/medidas';
import { CENAS } from '../../../scripts/playtest/galeria129Comodos';

const dispor = (tipo: string, area: number, ids: string[]) => disporComodo(tipo, area, ids.map((c, k) => ({ id: `o${k}`, coisaId: c })));
const de = (ps: Posto[], c: string) => ps.find(p => p.coisaId === c);
const pequeno = (p: Posto) => (p.x1 - p.x0) * (p.z1 - p.z0) < 0.36 && p.h < 0.9;

describe('12.9 · cômodos: orientação e oclusão', () => {
  it('quarto: a penteadeira vai de lado, junto da parede lateral, e as mesas de cabeceira continuam à vista', () => {
    for (const area of [12, 14, 25, 40]) {
      const d = dispor('quarto', area, ['cama_king', 'criado_mudo', 'penteadeira', 'tv', 'closet']);
      const pt = de(d.postos, 'penteadeira')!;
      expect(pt.giro).toBeTruthy();
      expect(pt.giro === 'esq' ? pt.x0 : d.g.Wm - pt.x1).toBeLessThan(0.1);
      expect(d.postos.filter(p => p.coisaId === 'criado_mudo').length).toBe(2);
    }
  });
  it('quarto pequeno com cama king: o closet fica encostado numa parede (não solto, não de fora)', () => {
    const d = dispor('quarto', 9, ['cama_king', 'criado_mudo', 'tv', 'closet']);
    const c = de(d.postos, 'closet')!;
    expect(c).toBeTruthy();
    expect(c.giro || c.z0 < 0.1).toBeTruthy();
  });
  it('cozinha: os armários planejados não ficam na frente da ilha, e a ilha aparece', () => {
    for (const area of [8, 10, 20, 35]) {
      const d = dispor('cozinha', area, ['armarios_planejados', 'ilha_cozinha', 'microondas']);
      const ilha = de(d.postos, 'ilha_cozinha')!, arm = de(d.postos, 'armarios_planejados')!;
      expect(ilha).toBeTruthy();
      expect(arm).toBeTruthy();
      // o armário ou está no fundo, atrás da ilha, ou de lado numa parede lateral
      expect(arm.giro || arm.z1 <= ilha.z0 + 0.05).toBeTruthy();
    }
  });
  it('sala: vitrine encostada de lado; a mesa de jogos não fica diante do sofá', () => {
    for (const area of [14, 20, 40]) {
      const d = dispor('sala', area, ['sofa', 'mesa_centro', 'tv', 'mesa_jogos', 'vitrine_colecao']);
      const v = de(d.postos, 'vitrine_colecao')!, mj = de(d.postos, 'mesa_jogos')!, s = de(d.postos, 'sofa')!;
      expect(v.giro || v.z0 < 0.1).toBeTruthy();
      const naFrente = mj.z0 >= s.z1 && Math.min(mj.x1, s.x1) - Math.max(mj.x0, s.x0) > 0.5 * (mj.x1 - mj.x0);
      expect(naFrente).toBe(false);
    }
  });
  it('nas cenas de teste: sem sobreposição no chão entre móveis grandes; poucos de fora; dimensões de catálogo', () => {
    let fora = 0;
    for (const [tipo, area, ids] of CENAS) {
      const d = dispor(tipo, area, ids);
      fora += d.fora.length;
      const chao = d.postos.filter(p => p.montagem === 'chao');
      for (const a of chao) for (const b of chao) {
        if (a === b || pequeno(a) || pequeno(b)) continue;
        const sx = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), sz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
        expect(sx > 0.01 && sz > 0.01, `${tipo} ${area}: ${a.coisaId} × ${b.coisaId}`).toBe(false);
      }
      // girado: largura e profundidade de catálogo trocadas, nunca encolhidas além da parede
      for (const p of chao.filter(x => x.giro)) {
        const m = medidaDe(p.coisaId);
        expect(p.z1 - p.z0).toBeCloseTo(Math.min(m.w, d.g.Dr - 0.06), 5);
        expect(p.x1 - p.x0).toBeCloseTo(Math.min(m.d, d.g.Wm * 0.45), 5);
      }
    }
    // antes da 12.9: 11 objetos de fora nessas 20 cenas
    expect(fora).toBeLessThanOrEqual(4);
  });
});
