/** VIDA 35.2 · a gaming house: as salas de treino com mesa, PC e cadeira de verdade; a decoração de cada cômodo; a
 *  fachada (por fora) e a normalização das escolhas novas. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { disporComodo } from '../ilustracao/disposicao';
import { MEDIDAS } from '../ilustracao/medidas';
import { DECORACAO_POR_TIPO35, normalizarInstalacoes34 } from '../../motor/v33/dono/instalacoes34';
import { FachadaDaOrg35 } from '../v35/casa/FachadaDaOrg35';
import { MODELOS_PC35, normalizarSetup35, RGB35 } from '../../motor/v31/esports/org35';
import { Estacao35 } from '../v35/org/Org35';

const estacoes = (n: number) => {
  const objs: { id: string; coisaId: string }[] = [];
  for (let k = 0; k < n; k++) objs.push({ id: `m${k}`, coisaId: 'home_studio' }, { id: `p${k}`, coisaId: 'computador' }, { id: `c${k}`, coisaId: 'cadeira_ergonomica' });
  return objs;
};

describe('a sala de treino da gaming house', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    it(`${n} estação(ões): tudo cabe, cada PC está em cima de uma mesa e cada titular tem a sua cadeira`, () => {
      const d = disporComodo('jogos', 22 + n * 6, estacoes(n), 'fita_led', 2026);
      expect(d.fora).toEqual([]);
      const pcs = d.postos.filter(p => p.coisaId === 'computador');
      expect(pcs.length).toBe(n);
      for (const pc of pcs) {
        const mesa = d.postos.find(p => p.id === pc.sobre);
        expect(mesa?.coisaId).toBe('home_studio');
      }
      expect(d.postos.filter(p => p.coisaId === 'cadeira_ergonomica').length).toBe(n);
    });
  }
  it('todo item de decoração de cada cômodo tem medida e desenho próprios (nada cai na caixa genérica)', () => {
    for (const [tipo, ids] of Object.entries(DECORACAO_POR_TIPO35)) {
      for (const id of ids) expect(MEDIDAS[id], `${tipo} → ${id}`).toBeDefined();
    }
  });
  it('a decoração muda de um cômodo para outro (não é a mesma lista para todos)', () => {
    expect(DECORACAO_POR_TIPO35.jogos).not.toEqual(DECORACAO_POR_TIPO35.cozinha);
    expect(DECORACAO_POR_TIPO35.quarto).not.toEqual(DECORACAO_POR_TIPO35.sala);
    expect(DECORACAO_POR_TIPO35.cozinha).toContain('cafeteira');
    expect(DECORACAO_POR_TIPO35.jogos).not.toContain('cafeteira');
  });
});

describe('a fachada e as escolhas da casa por fora', () => {
  it('normaliza cobertura, porta, jardim e varanda e descarta o que não existe', () => {
    const r = normalizarInstalacoes34({ telhado: 'telha', porta: 'metal', jardim: 'deck', varanda: true, fachada: 'vidro', neon: true, luz: '#7fd4ff', porta2: 'x', jardimX: 1, telhadoDeMentira: 'nope' });
    expect(r).toMatchObject({ telhado: 'telha', porta: 'metal', jardim: 'deck', varanda: true, fachada: 'vidro', neon: true, luz: '#7fd4ff' });
    expect(Object.keys(r!)).not.toContain('porta2');
    const ruim = normalizarInstalacoes34({ telhado: 'helicoptero', porta: 42, jardim: 'lava', varanda: 'sim' });
    expect(ruim?.telhado).toBeUndefined();
    expect(ruim?.porta).toBeUndefined();
    expect(ruim?.jardim).toBeUndefined();
    expect(ruim?.varanda).toBeUndefined();
  });
  for (const estilo of ['loft', 'casa', 'escritorio'] as const) {
    it(`desenha a fachada de ${estilo} com o neon, as plantas e a varanda escolhidos`, () => {
      const html = renderToStaticMarkup(
        <FachadaDaOrg35 estilo={estilo} nome="Liquid Vida" fachada="tijolo" telhado="verde" porta="metal" jardim="grama" varanda plantas neon luz="#b98bff" corTime="#1a7a4c" piscina={estilo === 'casa'} />
      );
      expect(html).toContain('data-estilo="' + estilo + '"');
      expect(html).toContain('data-peca="neon"');
      expect(html).toContain('data-peca="varanda"');
      expect(html).toContain('data-peca="plantas"');
      expect(html).toContain('data-porta="metal"');
      expect(html).toContain('LIQUID VIDA');
      expect(html).toContain('data-telhado="verde"');
    });
  }
  it('sem neon, sem plantas e sem varanda, a fachada não desenha esses detalhes', () => {
    const html = renderToStaticMarkup(
      <FachadaDaOrg35 estilo="loft" nome="x" fachada="concreto" telhado="laje" porta="vidro" jardim="nenhum" varanda={false} plantas={false} neon={false} luz="#ffd9a0" corTime="#000000" piscina={false} />
    );
    expect(html).not.toContain('data-peca="neon"');
    expect(html).not.toContain('data-peca="varanda"');
    expect(html).not.toContain('data-peca="plantas"');
    expect(html).not.toContain('data-peca="jardim"');
  });
});

describe('os PCs da organização e as cores', () => {
  it('cada degrau de PC tem modelos de marcas reais, e o modelo guardado é só o que existe no catálogo', () => {
    for (const d of [0, 1, 2, 3] as const) expect(MODELOS_PC35.some(m => m.degrau === d)).toBe(true);
    const marcas = new Set(MODELOS_PC35.map(m => m.marca));
    expect(marcas.has('Alienware') && marcas.has('Razer') && marcas.has('ASUS ROG')).toBe(true);
    const s = normalizarSetup35({ pc: 3, monitor: 1, perifericos: 1, cadeira: 1, modeloPc: 'alienware_aurora' });
    expect(s?.modeloPc).toBe('alienware_aurora');
    expect(normalizarSetup35({ pc: 3, monitor: 1, perifericos: 1, cadeira: 1, modeloPc: 'inventado' })?.modeloPc).toBeUndefined();
  });
  it('as cores de RGB têm nome e são cores de verdade (sem cores repetidas)', () => {
    expect(RGB35.every(c => /^#[0-9a-f]{6}$/i.test(c.hex) && c.nome.length > 2)).toBe(true);
    expect(new Set(RGB35.map(c => c.hex)).size).toBe(RGB35.length);
  });
  it('a estação mostra a marca do PC e a carcaça de fábrica (branca ou preta)', () => {
    const branca = renderToStaticMarkup(<Estacao35 s={{ pc: 2, monitor: 2, perifericos: 2, cadeira: 2, modeloPc: 'msi_mag', rgb: '#3b82f6' }} cor="#7c3aed" />);
    expect(branca).toContain('MSI');
    expect(branca).toContain('#e5e7eb');
    const preta = renderToStaticMarkup(<Estacao35 s={{ pc: 3, monitor: 3, perifericos: 3, cadeira: 3, modeloPc: 'razer_tomahawk' }} cor="#7c3aed" />);
    expect(preta).toContain('Razer');
    expect(preta).toContain('#111827');
  });
});
