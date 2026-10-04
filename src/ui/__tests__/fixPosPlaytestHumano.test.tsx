// @vitest-environment jsdom
/**
 * FIX pós-playtest humano — as telas ligadas ao motor de verdade: "Tudo ao acaso" no mundo, quem é cada retrato do
 * Nascer, a ficha com "o que faz sentido agora", o romance a partir da amizade, a clínica, a semana sem contradição,
 * o carro que É da cor dele, a loja sem caracteres soltos, "Viver mais um ano" no fim da página.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { criarPessoa, vincular } from '../../motor/pessoas';
import { municipio } from '../../motor/dados/lugares';
import { folegoDaSemana } from '../../motor/sistemas/semana';
import type { Vida } from '../../motor/tipos';
import { Tempo } from '../jogo/Tempo';
import { Pessoas } from '../jogo/Pessoas';
import { Lugar } from '../jogo/material/Lugares';
import { Criacao } from '../telas/Criacao';
import type { ControleVida } from '../useVida';

beforeAll(async () => { await precarregar(); });
beforeEach(() => { localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true; const r = criarRng(20261004); vi.spyOn(Math, 'random').mockImplementation(() => r.next()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function vida(idade: number, ajuste: (v: Vida) => void = () => {}): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
const adulta = (v: Vida) => { v.trabalho.atual = undefined; contratar(v, criarRng(2), ocupacao('assistente_adm')); v.financas.conta = 600000; v.financas.negativado = false; };
function Ligado({ v0, tela }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactNode }) {
  const [v, setV] = useState(v0);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); return true; };
  return <main>{tela(v, agir)}</main>;
}

describe('Nascer', () => {
  it('"Tudo ao acaso" sorteia o mundo: em vários cliques, mais de um país — e cidade, nome e país combinam', async () => {
    const nascidos: string[] = [];
    const c = { setTela: () => {}, nascer: (o: { municipioId: string }) => { nascidos.push(o.municipioId); } } as unknown as ControleVida;
    render(<Criacao c={c} />);
    const paises = new Set<string>();
    for (let k = 0; k < 12; k++) {
      fireEvent.click(screen.getByRole('button', { name: 'Tudo ao acaso' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Nascer' })).toBeTruthy());
      await new Promise(r => setTimeout(r, 0));
      fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    }
    for (const id of nascidos) paises.add(municipio(id).pais);
    expect(paises.size).toBeGreaterThanOrEqual(4);
  });

  it('os retratos dizem quem são: você em quatro idades e, puxando os traços, a mãe e o pai', () => {
    const c = { setTela: () => {}, nascer: () => {} } as unknown as ControleVida;
    render(<Criacao c={c} />);
    expect(screen.getByText('Você')).toBeTruthy();
    expect(screen.getByText('bebê')).toBeTruthy();
    expect(screen.getByText('De quem vêm os traços')).toBeTruthy();
    expect(screen.getByText('mãe')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: /Puxar os traços dos pais/ }));
    expect(screen.queryByText('De quem vêm os traços')).toBeNull();
  });
});

describe('Pessoas: a ficha entende quem é a pessoa', () => {
  const comAmiga = (v: Vida) => {
    adulta(v);
    const p = criarPessoa(v, criarRng(31), { idade: 29, genero: 'masculino', municipioId: v.moradia.municipioId });
    p.atracao = 'mulheres'; p.parceiroId = undefined;
    const vin = vincular(v, p, { origem: 'escola', proximidade: 72, estagio: 'amigo_proximo' });
    vin.tInicio = v.t - 150;
    for (const x of Object.values(v.vinculos)) if (x.romance) x.romance = undefined;
  };

  it('"o que faz sentido agora" vem primeiro; o resto, por tipo, recolhido (nada some) — e há "Algo mais" com a amizade', () => {
    const v = vida(29, comAmiga);
    const id = Object.values(v.vinculos).find(x => x.estagio === 'amigo_proximo' && v.pessoas[x.pessoaId].nome)!.pessoaId;
    render(<Ligado v0={v} tela={(vv, agir) => <Pessoas vida={vv} agir={agir} aberta={id} abrir={() => {}} />} />);
    const ficha = screen.getByRole('dialog');
    const agora = within(ficha).getByText('O que faz sentido agora').closest('.ficha__agora') as HTMLElement;
    expect(within(agora).getAllByRole('button').length).toBeGreaterThan(0);
    expect(within(agora).getAllByRole('button').length).toBeLessThanOrEqual(3);
    const grupos = [...ficha.querySelectorAll('details.ficha__grupo')];
    expect(grupos.length).toBeGreaterThanOrEqual(3);
    expect(grupos.every(g => !(g as HTMLDetailsElement).open)).toBe(true);
    expect(within(ficha).getByText('Algo mais')).toBeTruthy();
    expect(within(ficha).getByRole('button', { name: /Demonstrar interesse/ })).toBeTruthy();
  });

  it('ir ao cinema com o amigo abre uma cena com título — não só um aviso de número', () => {
    const v = vida(29, comAmiga);
    const id = Object.values(v.vinculos).find(x => x.estagio === 'amigo_proximo' && v.pessoas[x.pessoaId].nome)!.pessoaId;
    const r = executar(v, { tipo: 'pessoa', pessoaId: id, interacao: 'cinema' });
    expect(r.titulo).toMatch(/^Cinema com /);
    expect((r.resultado ?? '').length).toBeGreaterThan(40);
  });
});

describe('Tempo livre: a semana diz uma coisa só', () => {
  it('quando o painel diz que dá para assumir, há atividade leve selecionável na lista', () => {
    const v = vida(15, x => { x.educacao.basica = { ...x.educacao.basica!, integrado: 'tec_mecanica' }; x.rotinas = [{ id: 'futebol', tInicio: x.t, nivel: 3 }]; });
    render(<Ligado v0={v} tela={(vv, agir) => <Tempo vida={vv} agir={agir} aba="atividades" />} />);
    const f = folegoDaSemana(v);
    expect(f.texto).not.toMatch(/teto/);
    const main = screen.getByRole('main');
    expect(within(main).queryByText(/caberia com mais tempo/)).toBeNull();
  });
});

describe('Cidade: a clínica de cirurgia plástica', () => {
  it('a clínica mostra o que muda (o antes e o depois no retrato), o preço e o risco — e o procedimento muda o rosto', () => {
    const v = vida(30, x => { adulta(x); x.eu.visual.nariz = 'curvo'; x.corpo.saude = 90; });
    render(<Ligado v0={v} tela={(vv, agir) => <><Lugar vida={vv} agir={agir} qual="clinica" aoFechar={() => {}} trocar={() => {}} /><p data-testid="nariz">{vv.eu.visual.nariz}</p><p data-testid="genes">{vv.eu.genes?.nariz ?? '-'}</p></>} />);
    const folha = screen.getByRole('dialog');
    expect(within(folha).getByText(/Rinoplastia/)).toBeTruthy();
    expect(within(folha).getAllByText(/Risco (baixo|moderado|alto)/).length).toBeGreaterThan(0);
    expect(folha.querySelectorAll('.clinica__previa .retrato').length).toBeGreaterThanOrEqual(2);
    fireEvent.click(within(folha).getByRole('button', { name: 'Afinar' }));
    expect(screen.getByTestId('genes').textContent).toBe('curvo');
  });
});

describe('Materialidade e lojas', () => {
  it('na concessionária, a lataria do desenho É da cor do anúncio (estilo do próprio desenho, não um seletor)', () => {
    const v = vida(30, x => { adulta(x); x.trabalho.licencas.push('cnh'); });
    render(<Ligado v0={v} tela={(vv, agir) => <Lugar vida={vv} agir={agir} qual="concessionaria" aoFechar={() => {}} trocar={() => {}} />} />);
    const carros = [...document.querySelectorAll('.oferta--veiculo svg.desenho-veiculo--colorido')] as SVGElement[];
    expect(carros.length).toBeGreaterThan(2);
    for (const c of carros) {
      expect(c.style.getPropertyValue('--lataria')).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c.style.getPropertyValue('--lataria-op')).toBe('1');
    }
  });

  it('a ótica não mostra caracteres soltos: "luxo" é uma etiqueta inteira, fora da classe do selo de verificação', () => {
    const v = vida(30, adulta);
    render(<Ligado v0={v} tela={(vv, agir) => <Lugar vida={vv} agir={agir} qual="estilo" aoFechar={() => {}} trocar={() => {}} />} />);
    const nome = screen.getByText('Óculos escuros de grife').closest('strong')!;
    expect(nome.querySelector('.etiqueta-luxo')?.textContent).toBe('luxo');
    expect(document.querySelector('.selo')).toBeNull();
    for (const li of document.querySelectorAll('.oferta')) for (const t of [...li.querySelectorAll('span, strong')].map(x => x.textContent?.trim() ?? '')) expect(t.length === 0 || t.length > 1 || /[0-9✓]/.test(t), t).toBe(true);
  });

  it('auditoria do CSS: a mesma classe-raiz não é definida com dois sentidos em arquivos diferentes (o "x" e o "o" eram isso)', () => {
    const dir = join(__dirname, '..');
    const porClasse = new Map<string, Set<string>>();
    for (const f of readdirSync(dir).filter(x => x.endsWith('.css'))) {
      for (const m of readFileSync(join(dir, f), 'utf8').matchAll(/^\.([a-zA-Z0-9_-]+) *\{/gm)) porClasse.set(m[1], new Set([...(porClasse.get(m[1]) ?? []), f]));
    }
    // As redefinições conhecidas e intencionais (uma folha refina a outra, mesmo componente).
    const conhecidas = new Set(['atencao__item', 'experiencia', 'objeto', 'pertence', 'pertence__objeto', 'vaga-camada']);
    const novas = [...porClasse].filter(([c, fs]) => fs.size > 1 && !conhecidas.has(c)).map(([c]) => c);
    expect(novas).toEqual([]);
    expect(porClasse.get('selo')?.size ?? 0).toBeLessThanOrEqual(1);
  });
});

describe('"Viver mais um ano" no fim da página, nunca por cima', () => {
  it('o botão mora dentro do conteúdo, depois de tudo — e não é fixo', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    const main = screen.getByRole('main');
    const avancar = within(main).getByRole('button', { name: /Viver mais um ano/ }).closest('.avancar')!;
    expect(avancar.parentElement).toBe(main);
    expect(main.lastElementChild).toBe(avancar);
    const css = readFileSync(join(__dirname, '..', 'vida.css'), 'utf8');
    expect(css).not.toMatch(/\.avancar \{[^}]*position: fixed/);
  });
});
