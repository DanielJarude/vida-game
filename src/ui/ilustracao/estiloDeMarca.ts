/**
 * VIDA 12.8 — A MARCA NO DESENHO. O mesmo sofá de marcas diferentes não é o mesmo desenho com outro nome: o estilo da
 * marca (`motor/dados/perfisDeMarca`) muda o que se vê — o metal (o plástico cinza do básico, a madeira clara do
 * nórdico, o preto fino do contemporâneo, o bronze do clássico, o inox do técnico, o latão do icônico), o volume (o
 * básico é chapado, sem a luz de cima) e o arremate (o filete de metal no topo das peças de luxo). A forma do produto
 * continua a do produto: a marca muda o acabamento, não o objeto.
 */
import { caixaDaAmostra } from './caixa';
import { lembrar, type Amostra, type Peca } from './nucleo';
import type { EstiloDeMarca } from '../../motor/dados/perfisDeMarca';

const METAL: Record<EstiloDeMarca, string | undefined> = {
  basico: '#9b9a97', funcional: undefined, nordico: '#c89a62', contemporaneo: '#2b2826', classico: '#8a6a3a', artesanal: '#7a5236', tecnico: '#c3c6c9', iconico: '#c9a23a'
};
const FILETE: Partial<Record<EstiloDeMarca, string>> = { iconico: '#c9a23a', classico: '#a8864a' };

function trocar(pecas: Peca[], e: EstiloDeMarca): Peca[] {
  return pecas.map((p): Peca => {
    if (p.tipo === 'grupo') return { ...p, pecas: trocar(p.pecas, e) };
    if (p.tipo === 'metal' && METAL[e]) return { ...p, cor: METAL[e] };
    if (p.tipo === 'massa' && e === 'basico') return { ...p, semVolume: true };
    return p;
  });
}

const CACHE = lembrar<Amostra>(400);
/** O desenho com o acabamento da marca (sem marca, ou funcional sem filete: o desenho de sempre). */
export function comEstiloDaMarca(a: Amostra, estilo: EstiloDeMarca | undefined, chave: string): Amostra {
  if (!estilo || estilo === 'funcional') return a;
  return CACHE(`${chave}|${estilo}`, () => {
    const pecas = trocar(a.pecas, estilo);
    const f = FILETE[estilo];
    if (f) {
      const c = caixaDaAmostra(a);
      const w = c.x1 - c.x0;
      pecas.push({ tipo: 'linha', d: `M${(c.x0 + w * 0.12).toFixed(1)} ${(c.y0 + 1.2).toFixed(1)}H${(c.x1 - w * 0.12).toFixed(1)}`, larg: 1.1, cor: f, marca: 'filete-da-marca' });
    }
    return { ...a, pecas };
  });
}
