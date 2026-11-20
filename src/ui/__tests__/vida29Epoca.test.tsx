// @vitest-environment jsdom
/** VIDA 29 · a casa da época: a cozinha e o banheiro de antes, o lampião, o piso de origem e os acabamentos que existem no ano. */
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CenaDoComodo } from '../ilustracao/comodos';
import { ACABAMENTOS, acabamentoDeOrigem, acabamentoNoAno } from '../../motor/dados/lar';
import { adulto } from '../../motor/__tests__/cenarios';
import { disponibilidade } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import { comodosDaCasa } from '../../motor/sistemas/lar';

const cena = (tipo: string, ano?: number, luz?: string) => renderToStaticMarkup(<CenaDoComodo tipo={tipo} objetos={[]} ano={ano} luz={luz} rotulo={tipo} />);

describe('VIDA 29 · interiores por época', () => {
  it('a cozinha de 1925 tem fogão a lenha e a pia antiga; a de 2020, o fogão a gás e a bancada', () => {
    const velha = cena('cozinha', 1925), nova = cena('cozinha', 2020);
    expect(velha).toContain('data-coisa="_fogao_lenha"');
    expect(velha).toContain('data-coisa="_bancada_antiga"');
    expect(nova).toContain('data-coisa="_fogao"');
    expect(nova).not.toContain('_fogao_lenha');
    // Sem o ano (as telas antigas), a de hoje.
    expect(cena('cozinha')).toContain('data-coisa="_fogao"');
  });

  it('o banheiro antes de 1950 tem banheira de pés; depois, o box', () => {
    expect(cena('banheiro', 1935)).toContain('data-coisa="_tina"');
    expect(cena('banheiro', 1990)).toContain('data-coisa="_box"');
  });

  it('o lampião desenha a luz da época; o piso e a luz de origem seguem o ano', () => {
    expect(cena('sala', 1920, 'lampiao')).toContain('data-peca="lampiao"');
    expect(acabamentoDeOrigem('luz', 2, 1915)).toBe('lampiao');
    expect(acabamentoDeOrigem('piso', 2, 1915)).toBe('vermelhao');
    expect(acabamentoDeOrigem('piso', 3, 1955)).toBe('madeira');
    expect(acabamentoDeOrigem('piso', 3, 2020)).toBe('porcelanato');
  });

  it('o catálogo de acabamentos respeita a época (sem LED em 1950, sem lampião em 2020)', () => {
    const op = (a: 'luz' | 'piso', id: string) => ACABAMENTOS[a].opcoes.find(x => x.id === id)!;
    expect(acabamentoNoAno(op('luz', 'plafon'), 1950)).toBe(false);
    expect(acabamentoNoAno(op('luz', 'plafon'), 2015)).toBe(true);
    expect(acabamentoNoAno(op('luz', 'lampiao'), 2020)).toBe(false);
    expect(acabamentoNoAno(op('piso', 'porcelanato'), 1960)).toBe(false);
    // E o motor recusa a reforma anacrônica (não só a tela).
    const v = structuredClone(adulto(40, { semente: 5 }));
    const cm = comodosDaCasa(v)[0];
    if (cm) {
      // (A vida de teste é de hoje: o lampião já não se instala.)
      const hoje = podeTentar(disponibilidade(v, { tipo: 'personalizar', op: { o: 'acabamento', comodo: cm.id, aspecto: 'luz', opcao: 'lampiao' } } as never));
      expect(hoje).toBe(false);
    }
  });
});
