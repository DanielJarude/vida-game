// @vitest-environment jsdom
/**
 * FIX pós-REWORK 3 (playtest), do lado da tela: o que o motor sabe aparece
 * no lugar certo — o pet nunca ganha rosto de gente, a loja de motos não tem
 * carro, cada veículo tem o seu desenho, as trajetórias ficam separadas, o
 * tempo livre está a um toque.
 */
import { beforeAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App, precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { adotarPet } from '../../motor/sistemas/pets';
import type { Vida } from '../../motor/tipos';
import { Lugar } from '../jogo/material/Lugares';
import { Resultado } from '../jogo/Momento';
import { DesenhoVeiculo } from '../jogo/material/Desenhos';
import { Trabalho } from '../jogo/Trabalho';
import { propor, resolverPendente } from '../../motor/sistemas/compromissos';
import { transacao } from '../../motor/nucleo';
import { garantirFrente } from '../../motor/sistemas/frentes';

beforeAll(async () => { await precarregar(); });

function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}): Vida {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; }
  v.caminhos.pendente = undefined;
  ajuste(v);
  return v;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  const r = criarRng(20260930);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('13. o pet nunca usa o avatar de pessoa', () => {
  it('o resultado de adotar mostra o retrato do bicho (não um rosto humano)', () => {
    const v = vidaAos(25, x => { x.financas.conta = 20000; });
    const pet = transacao(v, (x, r) => { adotarPet(x, r, { especie: 'gato', nome: 'Mia', genero: 'feminino', idade: 1, porte: 'pequeno', jeito: 'desconfiada', historia: 'veio do abrigo' }, 'abrigo'); }).vida;
    const mia = Object.values(pet.pessoas).find(p => p.especie === 'gato')!;
    const { container } = render(<Resultado titulo="Um bicho em casa" texto="Mia chegou." aoFechar={() => {}} vida={pet} pessoaId={mia.id} />);
    expect(container.querySelector('.retrato--pet')).toBeTruthy();
    expect(container.querySelector('.retrato:not(.retrato--pet)')).toBeNull();
  });

  it('auditoria do código: toda chamada de <Retrato> para uma pessoa do jogo passa a espécie', () => {
    const dir = join(__dirname, '..');
    const arquivos: string[] = [];
    const andar = (d: string) => { for (const f of readdirSync(d, { withFileTypes: true })) { if (f.name === '__tests__') continue; const p = join(d, f.name); if (f.isDirectory()) andar(p); else if (p.endsWith('.tsx')) arquivos.push(p); } };
    andar(dir);
    const faltando: string[] = [];
    for (const f of arquivos) {
      const txt = readFileSync(f, 'utf8');
      for (const m of txt.matchAll(/<Retrato [^>]*semente=\{([^}]+)\}[^>]*\/>/g)) if (!m[0].includes('especie=') && m[1] !== '"eu"' && !/^vida\.eu\.semente/.test(m[1])) faltando.push(`${f}: ${m[0].slice(0, 80)}`);
    }
    expect(faltando).toEqual([]);
  });
});

describe('14. a loja de motos e bicicletas', () => {
  it('o catálogo completo da loja não tem carro — nem o filtro "Carros"', () => {
    const v = vidaAos(25, x => { x.financas.conta = 90000; x.trabalho.licencas.push('cnh'); });
    render(<Lugar vida={v} agir={() => true} qual="motos" aoFechar={() => {}} trocar={() => {}} />);
    const folha = screen.getByRole('dialog', { name: 'Motos e bicicletas' });
    fireEvent.click(within(folha).getAllByRole('radio').find(r => /Catálogo completo/.test(r.textContent ?? ''))!);
    expect(within(folha).queryByRole('radio', { name: 'Carros' })).toBeNull();
    expect(within(folha).getByRole('radio', { name: 'Motos' })).toBeTruthy();
    expect(within(folha).getByRole('radio', { name: 'Bicicletas' })).toBeTruthy();
    const desenhos = [...folha.querySelectorAll('.desenho-veiculo')].map(d => d.getAttribute('data-forma'));
    expect(desenhos.length).toBeGreaterThan(0);
    expect(desenhos.some(f => ['hatch', 'seda', 'suv', 'picape', 'esportivo'].includes(f ?? ''))).toBe(false);
  });
});

describe('18. veículos de categorias distintas têm desenhos distintos', () => {
  it('hatch, picape, scooter, trilha, mountain bike, lancha e monomotor: cada um com o seu traço', () => {
    const formas = ['hatch', 'picape', 'scooter', 'trail', 'mtb', 'lancha', 'monomotor'] as const;
    const traços = formas.map(f => { const { container } = render(<DesenhoVeiculo forma={f} />); const d = [...container.querySelectorAll('path, circle')].map(x => x.getAttribute('d') ?? `${x.getAttribute('cx')},${x.getAttribute('r')}`).join('|'); cleanup(); return d; });
    expect(new Set(traços).size).toBe(formas.length);
  });
});

describe('12. professora que atua: a turnê não aparece entre as ações da universidade', () => {
  it('a carreira artística em paralelo tem o seu bloco, com as ações dela', () => {
    const v = vidaAos(38, x => {
      x.educacao.concluidos.push({ cursoId: 'letras', nome: 'Letras', nivel: 'superior', area: 'letras', tFim: x.t - 120, instituicao: 'uma universidade' });
      x.educacao.concluidos.push({ cursoId: 'doutorado', nome: 'Doutorado', nivel: 'doutorado', area: 'letras', tFim: x.t - 36, instituicao: 'uma universidade' });
      x.educacao.escolaridade = 'doutorado';
      x.trabalho.atual = undefined;
      contratar(x, criarRng(3), ocupacao('professor_univ'));
      garantirFrente(x, 'teatro'); x.caminhos.frentes.teatro!.habilidade = 70;
    });
    const w = transacao(v, (x, r) => { propor(x, r, { tipo: 'emprego', ocupacaoId: 'ator', via: 'convite', extra: 'arte' }); resolverPendente(x, r, x.caminhos.pendente!.planos.findIndex(p => p.larga.includes('novo_paralela'))); }).vida;
    render(<Trabalho vida={w} agir={() => true} irPara={() => {}} />);
    const agora = screen.getByRole('region', { name: 'A sua situação agora' });
    expect(within(agora).queryByText(/Cair na estrada/)).toBeNull();
    const bloco = document.querySelector('[data-trajetoria="paralela"]') as HTMLElement;
    expect(bloco).toBeTruthy();
    expect(within(bloco).getByText(/em paralelo/)).toBeTruthy();
    expect(within(bloco).getByRole('button', { name: /Apresentar-se|show/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'A sua trajetória profissional' })).toBeTruthy();
  });
});

describe('38. o tempo livre está a um toque', () => {
  it('é uma área própria, no topo e na barra do celular', () => {
    const v = vidaAos(16);
    salvar(v);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    const navs = screen.getAllByRole('navigation', { name: 'Áreas' });
    for (const nav of navs) expect(within(nav).getByRole('button', { name: /Tempo livre|Tempo/ })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Tempo livre' })[0]);
    expect(screen.getByText('Sua semana')).toBeTruthy();
  });
});
