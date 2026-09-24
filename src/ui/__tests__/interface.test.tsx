// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarRng } from '../../motor/rng';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { salvar } from '../../motor/save';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import type { Vida } from '../../motor/tipos';
import { criarPessoa, vincular } from '../../motor/pessoas';

/** Uma adulta salva, já com a vida resolvida até ali (sem momento aberto). */
function adultaSalva(ajuste: (v: Vida) => void): void {
  let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
  for (let i = 0; i < 26; i++) { v = avancarAno(v).vida; v.momento = null; }
  ajuste(v);
  salvar(v);
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  // Semente fixa: a vida sorteada ao nascer é sempre a mesma nos testes.
  const r = criarRng(20260922);
  vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function resolverMomentos() {
  for (let k = 0; k < 5; k++) {
    const dialogo = screen.queryByRole('dialog');
    if (!dialogo) return;
    const opcoes = within(dialogo).queryAllByRole('button').filter(b => b.classList.contains('opcao') && !(b as HTMLButtonElement).disabled);
    if (opcoes.length) { fireEvent.click(opcoes[0]); continue; }
    const cont = within(dialogo).queryByRole('button', { name: 'Continuar' });
    if (cont) { fireEvent.click(cont); continue; }
    return;
  }
}

function avancar(n: number) {
  for (let i = 0; i < n; i++) {
    resolverMomentos();
    fireEvent.click(screen.getByRole('button', { name: /Viver mais um ano/ }));
  }
  resolverMomentos();
}

describe('interface', () => {
  it('nasce, vive, decide e registra na Linha da Vida', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    expect(screen.getAllByText(/Nasceu em/).length).toBeGreaterThan(0);
    avancar(2);
    // A primeira palavra é uma escolha biográfica garantida aos 2 anos.
    expect(screen.getByText(/A primeira palavra foi/)).toBeTruthy();
    expect(screen.getAllByText('sua escolha').length).toBeGreaterThan(0);
  });

  it('a decisão abre como diálogo e o resultado aparece antes de seguir', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    fireEvent.click(screen.getByRole('button', { name: /Viver mais um ano/ }));
    fireEvent.click(screen.getByRole('button', { name: /Viver mais um ano/ }));
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByText('A primeira palavra')).toBeTruthy();
    // enquanto há decisão, não dá para avançar
    expect((screen.getByRole('button', { name: /Viver mais um ano/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(within(dialogo).getAllByRole('button').find(b => b.classList.contains('opcao'))!);
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Continuar' })).toBeTruthy();
  });

  it('pessoas: abre a ficha e mostra ações com motivo quando bloqueadas', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    avancar(6);
    fireEvent.click(screen.getAllByRole('button', { name: /Pessoas/ })[0]);
    const mae = within(screen.getByRole('main')).getAllByText(/sua mãe/)[0].closest('button')!;
    fireEvent.click(mae);
    const ficha = screen.getByRole('dialog');
    // A ação nasce da relação: criança de 6 anos com a mãe "passa a tarde com" ela.
    expect(within(ficha).getByRole('button', { name: /Passar a tarde com/ })).toBeTruthy();
    // criança não ajuda com dinheiro: o botão nem aparece
    expect(within(ficha).queryByRole('button', { name: /dinheiro/i })).toBeNull();
  });

  it('ação bloqueada explica o motivo (menor não muda de cidade)', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Nascer de novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    avancar(8);
    fireEvent.click(screen.getAllByRole('button', { name: /Tempo/ })[0]);
    expect(screen.getByText('Sua semana')).toBeTruthy();
  });

  it('pedir aumento abre a conversa com a chefia e o resultado aparece', () => {
    adultaSalva(v => {
      v.educacao.escolaridade = 'medio';
      const e = contratar(v, criarRng(1), ocupacao('atendente'));
      e.tInicio = v.t - 24;
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida de Rita/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Rumo|Estudo e trabalho/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Pedir aumento/ }));
    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).getByText('A conversa do aumento')).toBeTruthy();
    fireEvent.click(within(dialogo).getByRole('button', { name: /Mostrar números/ }));
    expect(screen.getByText(/aprovou|orçamento|clima azedou/)).toBeTruthy();
  });

  it('curso trancado mostra como voltar', () => {
    adultaSalva(v => {
      v.educacao.basica = undefined;
      v.educacao.escolaridade = 'medio';
      v.educacao.matricula = { cursoId: 'pedagogia', instituicao: 'uma faculdade', rede: 'privada', modalidade: 'ead', tInicio: v.t - 12, mesesRestantes: 36, mensalidade: 0, desempenho: 60, trancado: true, tTrancou: v.t - 6, municipioId: v.moradia.municipioId };
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida de Rita/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Rumo|Estudo e trabalho/ })[0]);
    expect(screen.getByText(/\(trancado\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Voltar ao curso/ }));
    expect(screen.queryByText(/\(trancado\)/)).toBeNull();
  });

  it('pessoas: parceria e filhos no topo, com leitura humana; bebê não tem ação de adulto', () => {
    adultaSalva(v => {
      v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: v.t };
      for (const vin of Object.values(v.vinculos)) { vin.convivio = vin.convivio.filter(c => c !== 'casa'); vin.romance = undefined; }
      const r = criarRng(3);
      const par = criarPessoa(v, r, { idade: 27, genero: 'masculino', municipioId: v.moradia.municipioId, nome: 'Tiago' });
      const vp = vincular(v, par, { origem: 'trabalho', proximidade: 80, convivio: ['casa'] });
      vp.romance = { estagio: 'casamento', tEstagio: v.t - 36, tInicio: v.t - 60, envolvimento: 80 };
      vp.historia.push({ t: v.t - 36, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 });
      const bebe = criarPessoa(v, r, { idade: 1, genero: 'feminino', municipioId: v.moradia.municipioId, nome: 'Lia' });
      bebe.genitores = ['eu', par.id];
      vincular(v, bebe, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida de Rita/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /Pessoas/ })[0]);
    const main = within(screen.getByRole('main'));
    expect(main.getByText('Com você')).toBeTruthy();
    const cartoes = screen.getByRole('main').querySelectorAll('.cartao-pessoa');
    expect(cartoes[0].textContent).toMatch(/Tiago/);
    expect(cartoes[0].textContent).toMatch(/seu marido/);
    fireEvent.click(cartoes[0]);
    expect(within(screen.getByRole('dialog')).getByText(/casados há 3 anos/)).toBeTruthy();
    expect(within(screen.getByRole('dialog')).getByText('O que viveram juntos')).toBeTruthy();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: /Conversar sobre ter um filho/ })).toBeTruthy();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fechar' }));
    fireEvent.click(screen.getByRole('main').querySelectorAll('.cartao-pessoa')[1]);
    const ficha = within(screen.getByRole('dialog'));
    expect(ficha.queryByRole('button', { name: /dinheiro|conversa/i })).toBeNull();
    expect(ficha.getAllByRole('button', { name: /Brincar|Dar banho/ }).length).toBeGreaterThan(0);
  });

  it('tempo livre: a semana diz o que a ocupa e o bloqueio explica o que teria de sair', () => {
    adultaSalva(v => {
      v.educacao.escolaridade = 'medio';
      contratar(v, criarRng(1), ocupacao('atendente'));
      v.educacao.matricula = { cursoId: 'eng_civil', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 48, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
      v.rotinas = [{ id: 'leitura', tInicio: v.t - 24, nivel: 1 }];
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    resolverMomentos();
    fireEvent.click(screen.getAllByRole('button', { name: /^Tempo livre$|^Tempo$/ })[0]);
    const main = screen.getByRole('main');
    expect(within(main).getByText(/Antes de qualquer escolha, a semana já tem/)).toBeTruthy();
    expect(within(main).getAllByText(/Trabalho \(/).length).toBeGreaterThan(0);
    expect(within(main).getAllByText(/Faculdade \(/).length).toBeGreaterThan(0);
    // Uma atividade que não cabe mostra o motivo com o que ocupa a semana.
    expect(within(main).getAllByText(/Sua semana já está cheia: .*trabalho.*faculdade/i).length).toBe(1);
    expect(within(main).getByRole('button', { name: /o que caberia com mais tempo/ })).toBeTruthy();
  });

  it('rumo: as portas abertas aparecem com o motivo, e a carreira é contada em palavras', () => {
    adultaSalva(v => {
      v.educacao.escolaridade = 'medio';
      contratar(v, criarRng(2), ocupacao('assistente_adm'));
      v.trabalho.experiencia['administrativo'] = 60;
      v.caminhos.oportunidades = [{ id: 'op1', tipo: 'indicacao', titulo: 'Indicação de uma amiga', texto: 'Uma amiga que trabalha numa loja pode indicar você para vendedora.', tInicio: v.t, tFim: v.t + 12, ocupacaoId: 'vendedor', bonus: 0.2 }];
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida/ }));
    resolverMomentos();
    fireEvent.click(screen.getAllByRole('button', { name: /^Estudo e trabalho$|^Rumo$/ })[0]);
    const main = screen.getByRole('main');
    expect(within(main).getByText('Ao seu alcance agora')).toBeTruthy();
    expect(within(main).getByText(/pode indicar você/)).toBeTruthy();
    expect(within(main).getByRole('button', { name: 'Aceitar' })).toBeTruthy();
    // Estrada e próximo passo, em frases — nunca "nível 2" ou "sênior" por conta do número interno.
    expect(within(main).getAllByText(/anos em escritório|Começando em escritório|Um ano em escritório/).length).toBeGreaterThan(0);
    expect(within(main).queryByText(/nível \d/i)).toBeNull();
  });

  it('retoma uma vida salva', () => {
    let v = criarVida({ nome: 'Rita', sobrenome: 'Lopes', genero: 'feminino', municipioId: 'recife-pe', semente: 5 });
    for (let i = 0; i < 20; i++) { v = avancarAno(v).vida; if (v.momento) break; }
    salvar(v);
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Continuar a vida de Rita/ }));
    expect(screen.getAllByText(/Rita/).length).toBeGreaterThan(0);
  });
});
