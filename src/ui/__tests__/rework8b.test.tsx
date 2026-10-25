// @vitest-environment jsdom
/**
 * REWORK 8 (Fase B) — a linguagem nova das ilustrações (A — catálogo editorial, com o volume sutil e a sombra de contato
 * de B): cada modelo de carro, cada coisa, cada lugar e cada casa com a sua forma; a cor é do objeto (não da paleta);
 * o objeto escuro segura a silhueta; o nível de detalhe acompanha o tamanho; o mesmo dado dá sempre o mesmo desenho; e
 * a reação a um presente sai do contexto, sem inventar lembranças.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { precarregar } from '../App';
import { DesenhoVeiculo, CenaDaCasa } from '../jogo/material/Desenhos';
import { DesenhoObjeto } from '../jogo/material/Objetos';
import { Fachada } from '../ilustracao/Fachada';
import { LUGARES_DA_CIDADE } from '../ilustracao/lugares';
import { OBJETOS } from '../ilustracao/objetos';
import { Compras } from '../jogo/Compras';
import { Retrato } from '../avatar/Retrato';
import { VERSOES_VEICULO, formaDaVersao } from '../../motor/dados/bens';
import { COISAS } from '../../motor/dados/coisas';
import { variantesDaCoisa } from '../../motor/dados/pertences';
import { reacaoAoPresente, type Gosto } from '../../motor/sistemas/presentes';
import { coisa } from '../../motor/dados/coisas';
import { vincular } from '../../motor/pessoas';
import { adulto, pessoaNova } from '../../motor/__tests__/cenarios';
import { leituraDoLar } from '../leituraMaterial';

beforeAll(async () => { await precarregar(); });
afterEach(cleanup);

/** A assinatura do desenho: cada elemento com a sua geometria e a sua tinta, na ordem. */
function traco(el: ReactElement): string {
  const { container } = render(el);
  const d = [...container.querySelectorAll('path, circle, ellipse, rect, text')].map(x => `${x.tagName}:${x.getAttribute('d') ?? ''}${x.getAttribute('cx') ?? ''},${x.getAttribute('cy') ?? ''},${x.getAttribute('r') ?? x.getAttribute('rx') ?? ''},${x.getAttribute('fill') ?? ''}`).join('|');
  cleanup();
  return d;
}
const FORMAS_DE_CARRO = new Set(['compacto', 'hatch', 'seda', 'suv', 'suv_medio', 'suv_grande', 'picape', 'esportivo']);

describe('veículos: cada modelo do catálogo é reconhecível', () => {
  it('os 28 carros do catálogo saem com 28 desenhos diferentes (mesma cor, mesmo tamanho)', () => {
    const carros = VERSOES_VEICULO.filter(x => FORMAS_DE_CARRO.has(formaDaVersao(x)));
    expect(carros.length).toBeGreaterThanOrEqual(28);
    const tracos = carros.map(x => traco(<DesenhoVeiculo forma={formaDaVersao(x)} versaoId={x.id} cor="#a9adb2" largura={160} />));
    expect(new Set(tracos).size).toBe(carros.length);
  });

  it('todo veículo do catálogo tem desenho com o modelo marcado; motos e bicicletas não repetem dentro da forma', () => {
    const porForma = new Map<string, Set<string>>();
    for (const x of VERSOES_VEICULO) {
      const f = formaDaVersao(x);
      const { container } = render(<DesenhoVeiculo forma={f} versaoId={x.id} cor="#2c4f8a" largura={120} />);
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('data-modelo')).toBe(x.id);
      expect(svg.querySelectorAll('[data-peca]').length).toBeGreaterThanOrEqual(5);
      const html = svg.innerHTML.replace(/il[\w-]+/g, 'id');
      cleanup();
      if (!FORMAS_DE_CARRO.has(f)) { const s = porForma.get(f) ?? new Set(); s.add(html); porForma.set(f, s); }
    }
    for (const f of ['street', 'trail', 'scooter', 'urbana', 'mtb']) {
      const n = VERSOES_VEICULO.filter(x => formaDaVersao(x) === f).length;
      if (n > 1) expect(porForma.get(f)!.size, f).toBe(n);
    }
  });

  it('a cor do anúncio pinta a lataria; o desgaste aparece com forma (riscos, ferrugem)', () => {
    const { container } = render(<DesenhoVeiculo forma="hatch" versaoId="vw_polo" cor="#b8352b" estado={30} largura={200} />);
    expect(container.querySelector('[data-peca="lataria"] path')?.getAttribute('fill')).toMatch(/^#/);
    expect(container.querySelector('svg')!.getAttribute('data-desgaste')).toBe('cansado');
    expect(container.querySelector('[data-peca="ferrugem"]')).toBeTruthy();
  });
});

describe('as coisas da vida: uma forma própria para cada coisa, na cor do objeto', () => {
  it('cada coisa do catálogo tem um desenho só dela (nenhuma cai na caixa genérica)', () => {
    for (const c of COISAS) expect(OBJETOS[c.id], c.id).toBeTypeOf('function');
    const tracos = COISAS.map(c => traco(<DesenhoObjeto coisaId={c.id} cor="#6f7a3c" tamanho={96} />));
    expect(new Set(tracos).size).toBe(COISAS.length);
  });

  it('a cor da variante está no desenho (não a da paleta), e sem cor vem a primeira variante', () => {
    for (const c of COISAS) {
      const vs = variantesDaCoisa(c.id);
      const cor = vs[vs.length - 1].cor;
      const { container } = render(<DesenhoObjeto coisaId={c.id} cor={cor} tamanho={96} />);
      const fills = [...container.querySelectorAll('path')].map(p => p.getAttribute('fill'));
      const temCor = fills.some(f => f && f !== 'none' && !f.startsWith('url'));
      expect(temCor, c.id).toBe(true);
      expect(container.innerHTML).not.toMatch(/var\(--/);
      cleanup();
    }
    const { container } = render(<DesenhoObjeto coisaId="sofa" tamanho={96} />);
    expect(container.innerHTML).toContain(variantesDaCoisa('sofa')[0].cor);
  });

  it('o objeto quase preto ganha um fio claro; o quase branco, um fio firme', () => {
    const fio = (cor: string) => { const { container } = render(<DesenhoObjeto coisaId="maquina_lavar" cor={cor} tamanho={96} />); const s = container.querySelector('[data-peca="corpo"] path')!.getAttribute('stroke'); cleanup(); return s; };
    expect(fio('#1a1a1c')).toBe('#857e75');
    expect(fio('#f4f2ee')).not.toBe('#857e75');
  });

  it('o nível de detalhe acompanha o tamanho: a miniatura tira o miúdo, o destaque mostra tudo', () => {
    const conta = (t: number) => { const { container } = render(<DesenhoObjeto coisaId="violao" cor="#b9773f" tamanho={t} />); const svg = container.querySelector('svg')!; const r = [svg.getAttribute('data-nivel'), svg.querySelectorAll('path').length] as const; cleanup(); return r; };
    const [n1, p1] = conta(32), [n2, p2] = conta(76), [n3, p3] = conta(200);
    expect([n1, n2, n3]).toEqual(['1', '2', '3']);
    expect(p1).toBeLessThan(p2);
    expect(p2).toBeLessThan(p3);
  });

  it('determinístico: o mesmo objeto, na mesma cor, sai idêntico', () => {
    expect(traco(<DesenhoObjeto coisaId="guitarra" cor="#a8281f" tamanho={90} />)).toBe(traco(<DesenhoObjeto coisaId="guitarra" cor="#a8281f" tamanho={90} />));
    expect(traco(<DesenhoVeiculo forma="suv" versaoId="jeep_renegade" cor="#3f6b4a" largura={90} />)).toBe(traco(<DesenhoVeiculo forma="suv" versaoId="jeep_renegade" cor="#3f6b4a" largura={90} />));
  });
});

describe('os lugares como fachadas', () => {
  // REWORK 12.2: + as casas de luxo e coleção (relojoaria, joalheria, galeria, antiquário, memorabilia, leilão), os
  // exóticos e os quatro mercados de procedência incerta — cada um com o seu desenho (nenhuma fachada emprestada).
  it('28 lugares, 28 fachadas diferentes, cada uma com a placa', () => {
    expect(LUGARES_DA_CIDADE.length).toBe(28);
    const tracos = LUGARES_DA_CIDADE.map(l => traco(<Fachada lugar={l} vazia largura={300} altura={110} />));
    expect(new Set(tracos).size).toBe(28);
  });

  it('com objetos na frente, o interior some; sem objetos, a vitrine mostra o de dentro', () => {
    const { container: a } = render(<Fachada lugar="banco" vazia />);
    const { container: b } = render(<Fachada lugar="clinica" vazia />);
    const { container: c } = render(<Fachada lugar="clinica" />);
    expect(a.querySelector('[data-peca="coluna"]')).toBeTruthy();
    expect(b.querySelectorAll('.fachada__interior').length).toBeGreaterThan(0);
    expect(c.querySelectorAll('.fachada__interior').length).toBe(0);
  });

  it('em Compras, cada vitrine tem a fachada do seu lugar — sem ícone de traço', () => {
    const v = adulto(30, { semente: 17 });
    v.financas.conta = 400000;
    render(<Compras vida={v} agir={() => true} abrir={() => {}} />);
    const fachadas = [...document.querySelectorAll('.vitrine__fachada')];
    expect(fachadas.length).toBeGreaterThanOrEqual(10);
    const lugares = fachadas.map(f => f.getAttribute('data-lugar'));
    for (const l of ['alugar', 'concessionaria', 'usados', 'banco', 'clinica', 'estilo', 'eletronicos', 'livraria']) expect(lugares).toContain(l);
    expect(document.querySelector('.vitrine .icone-bem')).toBeNull();
  });
});

describe('casas e bichos', () => {
  it('o carro na porta é o do modelo da garagem (a mesma ilustração, na escala da cena)', () => {
    const v = adulto(30, { semente: 17 });
    const l = { ...leituraDoLar(v), veiculo: 'carro' as const, formaVeiculo: 'suv' as const, versaoVeiculo: 'jeep_renegade', corVeiculo: '#3f6b4a' };
    const { container } = render(<CenaDaCasa l={l} />);
    const g = container.querySelector('.cena__veiculo')!;
    expect(g.getAttribute('data-forma')).toBe('suv');
    expect(g.querySelector('[data-peca="lataria"]')).toBeTruthy();
    expect(g.getAttribute('transform')).toMatch(/scale\(0\.\d+\)/);
  });

  it('o cão pequeno e o gato preenchem o retrato (o porte ainda se lê: o grande é maior que o pequeno)', () => {
    const escala = (el: ReactElement) => { const { container } = render(el); const t = [...container.querySelectorAll('g[transform]')].map(g => g.getAttribute('transform')!).find(x => /scale/.test(x))!; cleanup(); return Number(t.match(/scale\(([\d.]+)\)/)![1]); };
    const peq = escala(<Retrato visual={undefined} genero="masculino" idade={3} semente="cao-31" tamanho={96} especie="cachorro" porte="pequeno" />);
    const gde = escala(<Retrato visual={undefined} genero="masculino" idade={3} semente="cao-31" tamanho={96} especie="cachorro" porte="grande" />);
    expect(peq).toBeLessThan(gde);
    expect(peq).toBeGreaterThan(0.9);
    for (const s of ['gato-1', 'gato-6', 'gato-11', 'gato-16']) expect(escala(<Retrato visual={undefined} genero="feminino" idade={3} semente={s} tamanho={96} especie="gato" />)).toBeGreaterThan(0.95);
  });
});

describe('a reação a um presente sai do contexto', () => {
  const pessoa = (idadeP: number, extra: { extroversao?: number; abertura?: number; afabilidade?: number } = {}, parentesco?: string) => {
    const v = adulto(36, { semente: 23 });
    const p = pessoaNova(v, idadeP, 'feminino');
    Object.assign(p.temperamento, extra);
    const vin = vincular(v, p, { origem: 'trabalho', proximidade: 60, convivio: [] });
    if (parentesco) (vin as { parentesco?: string }).parentesco = parentesco;
    return { v, p, vin };
  };
  const reacao = (x: ReturnType<typeof pessoa>, coisaId: string, gosto: Gosto = 'bom', gesto = 1, tensa = false) => reacaoAoPresente(x.v, x.p, x.vin, coisa(coisaId)!, 'azul', gosto, gesto, tensa);

  it('o tipo da coisa muda o que se faz com ela; a idade muda o jeito de receber', () => {
    const adulta = pessoa(34, { extroversao: 0, afabilidade: 0 });
    expect(reacao(adulta, 'violao')).not.toBe(reacao(adulta, 'notebook'));
    expect(reacao(adulta, 'jogos_tabuleiro')).toMatch(/jog|regras/);
    const idosa = pessoa(72, { extroversao: 0, afabilidade: 0 });
    expect(reacao(idosa, 'tablet')).toMatch(/configurar|como liga/);
    const crianca = pessoa(8);
    expect(reacao(crianca, 'videogame')).toMatch(/rasgou|grito|abraçou/);
  });

  it('o presente simples e certeiro é lido como certeiro; o neutro é honesto; a tensão aparece', () => {
    const x = pessoa(30);
    expect(reacao(x, 'livros', 'certeiro', 0)).toMatch(/Não era caro|presente simples/);
    expect(reacao(x, 'livros', 'neutro', 1)).toMatch(/gesto|estilo|esperava/);
    expect(reacao(x, 'livros', 'bom', 1, true)).toMatch(/sem jeito|obrigad|não esperava/);
  });

  it('nunca inventa uma lembrança em comum, e não repete a mesma frase para presentes diferentes', () => {
    const textos = new Set<string>();
    for (const [i, e] of [[8, 0.5], [16, -0.4], [16, 0.6], [34, 0.5], [34, -0.5], [72, 0]] as const) {
      const x = pessoa(i, { extroversao: e });
      for (const c of ['violao', 'notebook', 'livros', 'chuteira_bola', 'material_arte', 'jogos_tabuleiro']) {
        const t = reacao(x, c, (['certeiro', 'bom', 'neutro'] as const)[(i + c.length) % 3], (i + c.length) % 4);
        expect(t).not.toMatch(/lembr|aquela vez|daquela|como quando|de novo como/i);
        textos.add(t);
      }
    }
    expect(textos.size).toBeGreaterThanOrEqual(34);
  });
});
