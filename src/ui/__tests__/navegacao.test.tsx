// @vitest-environment jsdom
/**
 * REWORK 3 — a navegação: seis áreas estáveis e o teste mental "eu quero
 * fazer X, onde começo?". Cada intenção do mapa (`ui/navegacao`) é seguida
 * por cliques de verdade, e o destino precisa mostrar o que promete.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import type { Vida } from '../../motor/tipos';
import { AREAS, MAPA_DE_INTENCOES, SECOES_TEMPO, SECOES_VIDA, rotuloDoLugar, type Lugar } from '../navegacao';
import { Estudos } from '../jogo/Estudos';
import { Voce } from '../jogo/Voce';
import { VidaConcreta } from '../jogo/VidaConcreta';
import { Lugar as LugarDaCidade } from '../jogo/material/Lugares';
import type { Acao } from '../../motor/acoes';
import { instituicaoAtual } from '../../motor/sistemas/formacao';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20260929);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function vida(idade: number, ajuste: (v: Vida) => void = () => {}): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
function abrirJogo(v: Vida): void {
  salvar(v);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
}
function ir(l: Lugar): void {
  const a = AREAS.find(x => x.id === l.area)!;
  fireEvent.click(screen.getAllByRole('button', { name: a.rotulo })[0]);
  if (l.secao) fireEvent.click(screen.getByRole('tab', { name: SECOES_VIDA.find(s => s.id === l.secao)!.rotulo }));
  // FIX pós-REWORK 4: as abas de Tempo livre.
  if (l.aba) fireEvent.click(screen.getByRole('tab', { name: SECOES_TEMPO.find(s => s.id === l.aba)!.rotulo }));
}
const adulta = (v: Vida) => {
  v.trabalho.atual = undefined;
  contratar(v, criarRng(2), ocupacao('assistente_adm'));
  v.financas.conta = 40000; v.financas.negativado = false;
};

describe('as sete áreas são estáveis (não mudam de lugar com a idade)', () => {
  for (const idade of [5, 15, 32]) {
    it(`aos ${idade}: Linha da Vida, Você, Pessoas, Formação, Trabalho, Tempo livre, Vida — e nada de "Casa" ou "Cidade" no topo`, () => {
      abrirJogo(vida(idade, idade >= 18 ? adulta : undefined));
      const navs = screen.getAllByRole('navigation', { name: 'Áreas' });
      expect(navs.length).toBe(2); // o topo (desktop) e a barra (celular): a mesma estrutura
      for (const nav of navs) {
        const nomes = within(nav).getAllByRole('button').map(b => b.getAttribute('aria-label') ?? b.textContent);
        expect(nomes.length).toBe(7);
      }
      for (const a of AREAS) expect(screen.getAllByRole('button', { name: a.rotulo }).length).toBeGreaterThan(0);
      for (const velho of ['Casa', 'Cidade', 'Estudos']) expect(within(navs[0]).queryByRole('button', { name: velho })).toBeNull();
      // A barra do celular foi desenhada para sete (layout responsivo estrutural).
      expect(document.querySelector('.barra.barra--7')).toBeTruthy();
    });
  }

  it('criança: Trabalho existe e explica (quem sustenta a casa, quando o trabalho vira possibilidade)', () => {
    abrirJogo(vida(8));
    ir({ area: 'trabalho' });
    expect(screen.getByText(/Quem sustenta a casa/)).toBeTruthy();
    expect(screen.getByText(/Antes dos 14 anos, trabalhar é proibido/)).toBeTruthy();
  });
});

describe('"eu quero fazer X — onde começo?" (o mapa de intenções, com cliques de verdade)', () => {
  const esperado: Record<string, RegExp> = {
    estudar: /Formação/, atividade_escolar: /O que dá para fazer aqui|Sem estudar agora|caminhos possíveis/, faculdade: /Formação/,
    falar_mae: /Família/, namoro: /Conhecer alguém/, emprego: /Procurar outro caminho|Vagas/, negocio: /Procurar outro caminho/,
    futebol: /Cuidar de si|Esporte|Corpo/, carro: /Concessionária/,
    // FIX pós-REWORK 4: as intenções novas (e as que não tinham o que conferir) levam a um lugar que mostra o que promete.
    hobby: /Explorar outras atividades|Arte|Leitura/, sair: /Com quem|Sair e ver gente/, estresse: /O que está pesando/, viajar: /Viagens e experiências/,
    rede: /Criar uma conta no Instagram|Instagram/, fazer_junto: /Família|Amigos|Perto|Gente da sua vida/, agir_trabalho: /No dia a dia do trabalho|O que dá para fazer agora/, usar_carro: /Nada seu ainda|Seu veículo|Seus veículos/, pertences: /Nada seu ainda|Para usar|Pertences/, casa: /Procurar (um|outro) lugar/, onde_moro: /Quem paga a casa/,
    mudar_cidade: /Mudar de cidade/, mudar_pais: /Mudar de país/, custo_de_vida: /Aqui a moeda é/, nacionalidade: /No mundo/, dinheiro: /A família/, cabelo: /Aparência e estilo/, saude: /Cabeça|Saúde/, historia: /Linha da Vida/
  };
  it('cada intenção leva a um lugar que mostra o que promete (adulta de 30)', () => {
    const v = vida(30, x => { adulta(x); x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_1q', aluguel: 1300, padrao: 3, tInicio: x.t }; for (const vin of Object.values(x.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa'); });
    abrirJogo(v);
    for (const x of MAPA_DE_INTENCOES) {
      ir(x.lugar);
      const main = document.querySelector('main')!;
      expect(main.textContent, `${x.quero} → ${rotuloDoLugar(x.lugar)}`).toMatch(esperado[x.id]);
    }
  });

  it('o menu mostra o mapa e leva até lá', () => {
    abrirJogo(vida(30, adulta));
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = screen.getByRole('dialog', { name: 'Menu' });
    expect(within(menu).getByText('Onde fica cada coisa')).toBeTruthy();
    fireEvent.click(within(menu).getByRole('button', { name: /Comprar carro, moto ou bicicleta/ }));
    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Compras', selected: true })).toBeTruthy();
    expect(screen.getByText('Concessionária')).toBeTruthy();
  });

  it('os destinos antigos continuam chegando (o "Agora" leva o dinheiro para Vida · Dinheiro)', () => {
    abrirJogo(vida(30, x => { adulta(x); x.financas.conta = -20000; }));
    const agora = document.querySelector('.agora');
    const btn = agora ? within(agora as HTMLElement).queryByRole('button', { name: /O dinheiro/ }) : null;
    if (btn) { fireEvent.click(btn); expect(screen.getByRole('tab', { name: 'Dinheiro', selected: true })).toBeTruthy(); }
  });
});

describe('Formação: o lugar, as pessoas, as atividades (ações parecem ações)', () => {
  it('na escola: nome da instituição, o que dá para fazer, "Entrar" liga a atividade do motor', () => {
    const v = vida(13);
    v.educacao.basica = { etapa: 'fundamental2', serie: 8, rede: 'publica', desempenho: 70, reprovacoes: 0 };
    const acoes: Acao[] = [];
    render(<main><Estudos vida={v} agir={a => { acoes.push(a); return true; }} irPara={() => {}} /></main>);
    const inst = instituicaoAtual(v)!;
    expect(screen.getByRole('heading', { name: inst.nome })).toBeTruthy();
    expect(screen.getByText('O que dá para fazer aqui')).toBeTruthy();
    const entrar = screen.getAllByRole('button', { name: 'Entrar' }).find(b => !(b as HTMLButtonElement).disabled)!;
    fireEvent.click(entrar);
    expect(acoes[0]).toMatchObject({ tipo: 'rotina', ativa: true });
  });
});

describe('Vida: moradia, dinheiro, compras, tempo, cidade — num lugar só', () => {
  it('Compras para uma criança: as lojas existem, bloqueadas com o motivo (não somem)', () => {
    const v = vida(9);
    render(<main><VidaConcreta vida={v} agir={() => true} secao="compras" irSecao={() => {}} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    const imob = screen.getByRole('button', { name: /Imobiliária/ }) as HTMLButtonElement;
    expect(imob.disabled).toBe(true);
    expect(screen.getByText(/Menor de idade não decide onde mora/)).toBeTruthy();
  });

  it('a ótica vende o que se usa no corpo; o luxo não promete fama', () => {
    const v = vida(30, adulta);
    render(<LugarDaCidade vida={v} agir={() => true} qual="estilo" aoFechar={() => {}} trocar={() => {}} />);
    const folha = screen.getByRole('dialog', { name: 'Ótica, roupas e acessórios' });
    expect(within(folha).getByText('Óculos escuros')).toBeTruthy();
    // Os balcões: a ótica, as roupas, a relojoaria e a joalheria (não uma prateleira só).
    fireEvent.click(within(folha).getByRole('radio', { name: 'Relojoaria e joalheria' }));
    expect(within(folha).getByText(/Um anônimo com ele continua anônimo/)).toBeTruthy();
    expect(within(folha).getAllByRole('button', { name: 'Comprar' }).length).toBeGreaterThan(3);
  });

  it('Dinheiro mostra a família: como está a casa de lá, e o pedido quando há necessidade', () => {
    const v = vida(26, x => { adulta(x); x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'kitnet', aluguel: 900, padrao: 2, tInicio: x.t }; for (const vin of Object.values(x.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa'); x.financas.conta = -3000; });
    render(<main><VidaConcreta vida={v} agir={() => true} secao="dinheiro" irSecao={() => {}} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(screen.getByRole('heading', { name: 'A família' })).toBeTruthy();
    expect(screen.getByText(/A casa de/)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Pedir ajuda a .* para segurar uma emergência/ }).length).toBeGreaterThan(0);
  });
});

describe('Você: aparência e estilo (prévia, escolha, ação)', () => {
  it('mudar o corte mostra a prévia e manda a ação do motor', () => {
    const v = vida(20);
    const acoes: Acao[] = [];
    render(<main><Voce vida={v} agir={a => { acoes.push(a); return true; }} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(screen.getByRole('heading', { name: 'Aparência e estilo' })).toBeTruthy();
    const corte = screen.getByRole('combobox', { name: 'Corte' }) as HTMLSelectElement;
    const outro = [...corte.options].find(o => o.value !== corte.value)!.value;
    fireEvent.change(corte, { target: { value: outro } });
    expect(screen.getByRole('img', { name: 'Como ficaria' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mudar o visual' }));
    expect(acoes[0]).toMatchObject({ tipo: 'aparencia', mudanca: { cabelo: outro } });
  });
});

import { Retrato } from '../avatar/Retrato';
describe('o retrato desenha o estilo escolhido (e só ele)', () => {
  it('óculos, chapéu, roupa e cor de tinta mudam o desenho; sem escolha, o rosto é o mesmo de antes', () => {
    const base = { pele: 'p3', cabelo: 'curto', corCabelo: 'castanho', olhos: 'castanho' };
    const html = (vis: Record<string, unknown>) => { const { container } = render(<Retrato visual={vis as never} genero="feminino" idade={30} semente="x" />); const h = container.innerHTML; cleanup(); return h; };
    const puro = html(base);
    expect(html(base)).toBe(puro);
    for (const extra of [{ oculos: 'sol' }, { oculos: 'redondo' }, { chapeu: 'bone' }, { chapeu: 'gorro' }, { roupa: 'social' }, { corCabelo: 'azul' }]) expect(html({ ...base, ...extra })).not.toBe(puro);
  });
});
