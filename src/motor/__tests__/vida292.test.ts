/** VIDA 29.2 · o tipo de jogador em todos os esportes; as equipes reais do e-sports, sem repetir e da época. */
import { describe, expect, it } from 'vitest';
import { ARQUETIPOS, firmezaDoTipo, guardarPerfil, lerPerfil, efeitosEmPalavras, type LeituraDoPerfil } from '../sistemas/arquetipos';
import { equipesDoCenario29 } from '../v25/esports/esports25';
import { EQUIPES_REAIS29, equipesReaisDoDegrau29 } from '../v25/esports/equipesReais29';
import { LISTA_JOGOS25, type JogoId } from '../v25/esports/jogos25';

const leitura = (o: Partial<LeituraDoPerfil>): LeituraDoPerfil => ({ modalidade: 'futebol', desvio: {}, acimaDaDivisao: 0, tracos: {}, idade: 25, anosNoClube: 1, capitao: false, reserva: false, ...o });

describe('VIDA 29.2 · tipo de jogador', () => {
  it('natação, atletismo e lutas têm tipos próprios (antes, só os da pessoa)', () => {
    for (const [mod, desvio, tipo] of [
      ['natacao', { largada: 12, velocidade: 10, forca: 6 }, 'velocista_piscina'],
      ['natacao', { resistencia: 12, determinacao: 10 }, 'fundista_piscina'],
      ['atletismo', { aceleracao: 12, explosao: 12, velocidade: 8 }, 'explosivo'],
      ['atletismo', { tecnica_prova: 14, concentracao: 6 }, 'tecnico_prova'],
      ['lutas', { golpes: 12, distancia: 10 }, 'trocador'],
      ['lutas', { solo: 14, forca: 6 }, 'especialista_chao']
    ] as const) expect(lerPerfil(leitura({ modalidade: mod, desvio })).principal).toBe(tipo);
  });

  it('todo tipo de atributo diz o que o puxa; a força e o "quase" ficam guardados', () => {
    for (const a of ARQUETIPOS.filter(x => !['sexto_homem', 'talento_precoce', 'capitao', 'marrento'].includes(x.id))) expect(a.atributos?.length, a.id).toBeGreaterThan(0);
    const forte = guardarPerfil(undefined, lerPerfil(leitura({ papel: 'atacante', desvio: { finalizacao: 14, compostura: 10, movimentacao: 8 }, golsPorJogo: 0.6 })), 2030, 100);
    expect(forte.perfil.principal).toBe('matador');
    expect(firmezaDoTipo(forte.perfil.forca)).not.toBe('em afirmação');
    const quase = guardarPerfil(undefined, lerPerfil(leitura({ papel: 'atacante', desvio: { finalizacao: 3 } })), 2030, 100);
    expect(quase.perfil.principal).toBeUndefined();
    expect(quase.perfil.perto?.id).toBe('matador');
    expect(efeitosEmPalavras({ principal: 'marrento', secundarios: [] }).some(e => !e.bom)).toBe(true);
  });
});

describe('VIDA 29.2 · equipes reais do e-sports', () => {
  it('o cenário de hoje é de equipes reais, sem nome repetido entre as divisões', () => {
    for (const j of LISTA_JOGOS25 as JogoId[]) {
      const todas = [5, 4, 3, 2].flatMap(n => equipesDoCenario29(j, n, 'vida-x', 2026, true));
      expect(new Set(todas).size, j).toBe(todas.length);
      const reais = new Set(Object.values(EQUIPES_REAIS29[j].int).concat(Object.values(EQUIPES_REAIS29[j].br)).flat().map(x => x!.split('|')[0]));
      const daLista = todas.filter(x => reais.has(x) || reais.has(x.replace(/ Academy$/, '')));
      expect(daLista.length / todas.length, j).toBeGreaterThan(0.9);
      // Nenhuma raiz de nome repetida (o "Carcará Gaming" e o "Carcará Esports").
      const raizes = todas.filter(x => !/ Academy$/.test(x)).map(x => x.split(' ')[0]);
      expect(raizes.filter(x => x === 'Carcará').length).toBeLessThan(2);
    }
  });

  it('a época conta: FURIA não existe em 2010; LOUD só depois de 2019; a elite é internacional', () => {
    expect(equipesReaisDoDegrau29('cs', 4, 2010, true)).not.toContain('FURIA');
    expect(equipesReaisDoDegrau29('cs', 4, 2020, true)).toContain('FURIA');
    expect(equipesReaisDoDegrau29('lol', 4, 2015, true)).not.toContain('LOUD');
    expect(equipesReaisDoDegrau29('cs', 5, 2020, true)).toContain('Natus Vincere');
    expect(equipesReaisDoDegrau29('cs', 4, 2020, false)).not.toContain('FURIA');
  });
});
