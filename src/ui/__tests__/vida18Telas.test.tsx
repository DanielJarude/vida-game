// @vitest-environment jsdom
/** VIDA 18 · na tela: o Campo, as Apostas (loterias, esportes, turfe, cassino proibido no Brasil), o chapéu e a bolsa de costas, as silhuetas, o showroom. */
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useState } from 'react';
import { Campo18 } from '../v18/campo/Campo18';
import { Apostas } from '../jogo/Apostas';
import { Figura } from '../avatar/Figura';
import { Retrato } from '../avatar/Retrato';
import { corDoChapeu, PALETAS_DO_CHAPEU } from '../avatar/costas18';
import { PECAS } from '../avatar/pecas';
import { adulto } from '../../motor/__tests__/cenarios';
import { executar, type Acao } from '../../motor/acoes';
import { ofertasRurais } from '../../motor/v18/rural/acoes18';
import type { Visual, Vida } from '../../motor/tipos';

function usePalco(inicial: Vida) {
  const [v, setV] = useState(inicial);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return r.vida !== v; };
  return { v, agir };
}
const rico = () => { const v = structuredClone(adulto(35, { semente: 7 })); v.financas.conta = 30_000_000; return v; };

describe('VIDA 18 · Campo', () => {
  it('sem terra: as ofertas da região; comprar mostra a propriedade com as partes', async () => {
    const v = rico();
    function Palco() { const { v: x, agir } = usePalco(v); return <Campo18 vida={x} agir={agir} />; }
    render(<Palco />);
    expect(screen.getByText(/Nenhuma terra sua/)).toBeTruthy();
    const sitio = ofertasRurais(v).find(o => o.p.tipo === 'sitio')!;
    const card = screen.getByText(new RegExp(`${sitio.p.nome} ·`)).closest('li')!;
    await act(async () => { fireEvent.click(within(card as HTMLElement).getByRole('button', { name: 'Comprar à vista' })); });
    expect(screen.getByRole('tab', { name: /Lavoura/ })).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: /Contas/ })); });
    expect(screen.getByText(/Num ano normal, hoje/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: /A terra/ })); });
    expect(screen.getByRole('img', { name: /Uso da terra/ })).toBeTruthy();
  });
});

describe('VIDA 18 · Apostas', () => {
  it('no Brasil: as loterias da Caixa abrem; o cassino diz que é proibido; registrar um jogo da Mega e ver o sorteio', async () => {
    const v = structuredClone(adulto(30, { semente: 8 }));
    v.financas.conta = 5000;
    function Palco() { const { v: x, agir } = usePalco(v); return <Apostas vida={x} agir={agir} />; }
    render(<Palco />);
    expect(screen.getByText(/Prêmio estimado/)).toBeTruthy();
    for (const n of ['01', '02', '03', '04', '05', '06']) fireEvent.click(within(screen.getByRole('group', { name: /Dezenas de 01/ })).getByRole('button', { name: n }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Registrar este jogo' })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Ver o sorteio do concurso/ })); });
    expect(document.querySelector('.apostas18__bilhete')?.textContent).toMatch(/Sorteio/);
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Cassino' })); });
    expect(screen.getByText(/cassino e caça-níquel são proibidos/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Turfe' })); });
    expect(screen.getByText(/Jockey Clubs/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('tab', { name: 'Esportes' })); });
    expect(screen.getByText(/Rodada/)).toBeTruthy();
  });
});

describe('VIDA 18 · o personagem de costas e as silhuetas', () => {
  const base: Visual = { pele: 'p4', cabelo: 'curto', corCabelo: 'preto', olhos: 'castanho' } as Visual;
  it('cada chapéu tem a silhueta dele de costas, na mesma cor da frente', () => {
    const vistos = new Set<string>();
    for (const [modelo, tipo] of [['bone_aba_reta', 'bone'], ['bone_trucker', 'bone'], ['fedora', 'chapeu'], ['gorro_pompom', 'gorro'], ['touca_cetim', 'gorro'], ['chapeu_couro', 'chapeu'], ['bucket', 'gorro']] as const) {
      const visual = { ...base, chapeu: tipo, modeloChapeu: modelo } as Visual;
      const costas = renderToStaticMarkup(<Figura visual={visual} genero="masculino" idade={30} corpo="mediano" pecas={[]} vista="costas" semente="s1" />);
      const frente = renderToStaticMarkup(<Retrato visual={visual} genero="masculino" idade={30} semente="s1" />);
      expect(costas).toContain(`data-chapeu-costas="${modelo}"`);
      const cor = PALETAS_DO_CHAPEU[modelo]; expect(cor).toContain(corDoChapeu(tipo, modelo, 0));
      // A cor da paleta que a frente usou é a mesma que aparece de costas (e é uma só).
      const naFrente = cor.filter(c => frente.includes(`fill="${c}"`));
      expect(naFrente.length, modelo).toBe(1);
      expect(costas, `${modelo} ${naFrente[0]}`).toContain(`fill="${naFrente[0]}"`);
      // Nada da meia-lua genérica de antes.
      expect(costas).not.toContain('#3d4650');
      const trecho = costas.slice(costas.indexOf('data-chapeu-costas'), costas.indexOf('data-chapeu-costas') + 600);
      vistos.add(trecho.replace(/#[0-9a-f]{6}/g, ''));
    }
    expect(vistos.size).toBe(7);
  });

  it('a bolsa aparece de costas (a mochila nas costas, a transversal cruzando)', () => {
    for (const b of ['mochila', 'bolsa_transversal', 'pochete', 'bolsa_tote']) {
      const s = renderToStaticMarkup(<Figura visual={base} genero="feminino" idade={28} corpo="mediano" pecas={[{ itemId: b, id: b }]} vista="costas" semente="s2" />);
      expect(s, b).toMatch(/data-acessorio="bolsa"[^>]*data-vista="costas"/);
    }
  });

  it('as peças da mesma categoria não compartilham a silhueta: modelagens próprias', () => {
    const contorno = (item: string) => {
      const s = renderToStaticMarkup(<Figura visual={base} genero="masculino" idade={30} corpo="mediano" pecas={[{ itemId: item, id: item }, { itemId: 'jeans', id: 'j' }]} semente="s3" largura={120} />);
      const g = s.slice(s.indexOf('figura__cima'), s.indexOf('figura__cima') + 3000);
      return g.replace(/fill="[^"]*"|stroke="[^"]*"|url\(#[^)]*\)/g, '');
    };
    const cimas = ['camiseta_lisa', 'camisa_polo', 'sueter_tricot', 'blusa_seda', 'camisa_social', 'camisa_linho', 'moletom_oversized', 'bata_wax'];
    expect(new Set(cimas.map(contorno)).size).toBe(cimas.length);
    const vestido = (item: string) => { const s = renderToStaticMarkup(<Figura visual={base} genero="feminino" idade={30} corpo="mediano" pecas={[{ itemId: item, id: item }]} semente="s4" />); return /data-modelo="([a-z]+)"/.exec(s)?.[1]; };
    const modelos = ['vestido_floral', 'vestido_chita', 'vestido_festa', 'vestido_longo', 'vestido_grife', 'vestido_alta_costura'].map(vestido);
    expect(new Set(modelos).size).toBe(6);
    // Todo item de cima, inteira e casaco do catálogo tem modelagem declarada (ou é uma forma própria: regata, camisa de time, terno, macacão).
    const sem = Object.entries(PECAS).filter(([id, p]) => 'parte' in p && (p.parte === 'cima' || p.parte === 'inteira' || p.parte === 'casaco') && !('modelo' in p) && !['regata', 'top_esportivo', 'camisa_time', 'macacao', 'terno', 'terno_vicunha'].includes(id)).map(([id]) => id);
    expect(sem).toEqual([]);
  });
});
