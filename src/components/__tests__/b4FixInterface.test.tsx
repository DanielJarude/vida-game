/**
 * @vitest-environment jsdom
 *
 * B4-FIX — interface.
 *
 * Cobre o que o playtest humano reportou: local de nascimento respeitado,
 * interações coerentes com a idade, dinheiro localizável e legibilidade.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import { CharacterCreationScreen } from '../screens/CharacterCreationScreen';
import { FamilyModal } from '../modals/FamilyModal';
import { CharacterIdentity } from '../character/CharacterIdentity';

import {
  CIDADES_BRASILEIRAS,
  listarEstadosDisponiveis,
  listarCidadesPorEstado,
  encontrarCidade
} from '../../data/brazilianData';
import { getActionAvailability } from '../../systems/availabilitySystem';
import { criarEstadoTeste } from '../../systems/__tests__/fixtures';
import { rotularInteracao } from '../../presentation/interactionPresentation';
import { deveMostrarSaldoNaIdentidade } from '../../presentation/lifeStagePresentation';
import type { FamilyInteractionType } from '../../types';

afterEach(cleanup);

/* ============================================================== 10, 11, 12, 13
   Local de nascimento                                                     */

describe('B4-FIX · local de nascimento', () => {
  it('a lista de estados é derivada dos dados, não hardcodeada', () => {
    const estados = listarEstadosDisponiveis();
    const siglasReais = new Set(CIDADES_BRASILEIRAS.map(c => c.estado));

    expect(estados.length).toBe(siglasReais.size);
    for (const uf of estados) {
      expect(siglasReais.has(uf.sigla)).toBe(true);
      expect(uf.quantidadeCidades).toBeGreaterThan(0);
    }
  });

  it('cada estado só lista cidades que realmente pertencem a ele', () => {
    for (const uf of listarEstadosDisponiveis()) {
      for (const cidade of listarCidadesPorEstado(uf.sigla)) {
        expect(cidade.estado).toBe(uf.sigla);
      }
    }
  });

  it('escolha manual de Estado persiste até o motor', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'PE' } });
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    expect(onCriar).toHaveBeenCalledTimes(1);
    expect(onCriar.mock.calls[0][4]).toBe('PE');
  });

  it('escolha manual de Cidade persiste até o motor', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'SP' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Santos' } });
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    const [, , , cidade, estado] = onCriar.mock.calls[0];
    expect(cidade).toBe('Santos');
    expect(estado).toBe('SP');
  });

  it('trocar de estado corrige a cidade para uma válida daquele estado', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'SP' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Santos' } });
    // Troca para um estado que não tem Santos.
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'BA' } });
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    const [, , , cidade, estado] = onCriar.mock.calls[0];
    expect(estado).toBe('BA');
    // A cidade enviada existe de fato na Bahia.
    expect(encontrarCidade(cidade, 'BA')).toBeTruthy();
  });

  it('a seleção manual NÃO é sobrescrita por randomização', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'AM' } });
    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: 'Manaus' } });

    // Várias submissões seguidas devem dar sempre o mesmo lugar.
    for (let i = 0; i < 8; i++) {
      fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));
    }

    expect(onCriar).toHaveBeenCalledTimes(8);
    for (const chamada of onCriar.mock.calls) {
      expect(chamada[3]).toBe('Manaus');
      expect(chamada[4]).toBe('AM');
    }
  });

  it('o nome digitado também é respeitado', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Tereza' } });
    fireEvent.change(screen.getByLabelText('Sobrenome'), { target: { value: 'Batista' } });
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    expect(onCriar.mock.calls[0][0]).toBe('Tereza');
    expect(onCriar.mock.calls[0][1]).toBe('Batista');
  });

  it('"Sortear tudo" é explícito e produz um par estado/cidade coerente', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /sortear tudo/i }));
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    const [, , , cidade, estado] = onCriar.mock.calls[0];
    expect(encontrarCidade(cidade, estado)).toBeTruthy();
  });
});

/* ============================================================== 1–8 (UI)
   Modal de relacionamento por idade                                       */

function montarModal(idade: number) {
  const estado = criarEstadoTeste({ idade });
  const membro = estado.familia[0]; // pai
  const onInteragir = vi.fn();

  render(
    <FamilyModal
      membro={membro}
      onClose={() => {}}
      onInteragir={onInteragir}
      idadeJogador={idade}
      verificarInteracao={(tipo: FamilyInteractionType) =>
        getActionAvailability(estado, 'interagir_familia', {
          membroId: membro.id,
          tipoInteracao: tipo
        })
      }
    />
  );

  return { onInteragir, membro };
}

/** Rótulos das ações visíveis, com o estado de habilitação. */
function acoesVisiveis() {
  return screen
    .getAllByRole('button')
    .filter(b => b.querySelector('.event-choice__title'))
    .map(b => ({
      titulo: b.querySelector('.event-choice__title')!.textContent!,
      desabilitado: (b as HTMLButtonElement).disabled,
      motivo: b.querySelector('.event-choice__reason')?.textContent?.trim()
    }));
}

describe('B4-FIX · modal de relacionamento respeita a idade', () => {
  it('bebê de 0 ano NÃO recebe conversa, discussão nem presente ativos', () => {
    montarModal(0);
    const acoes = acoesVisiveis();

    // Nada de "Dar um presente" na lista.
    expect(acoes.some(a => /presente/i.test(a.titulo))).toBe(false);

    // Colo disponível.
    const colo = acoes.find(a => /colo/i.test(a.titulo));
    expect(colo).toBeTruthy();
    expect(colo!.desabilitado).toBe(false);

    // Conversa e conflito presentes mas bloqueados, com motivo em texto.
    for (const titulo of ['Falar', 'Conversar', 'Discutir', 'birra']) {
      const acao = acoes.find(a => new RegExp(titulo, 'i').test(a.titulo));
      if (acao) {
        expect(acao.desabilitado).toBe(true);
        expect(acao.motivo && acao.motivo.length > 0).toBe(true);
      }
    }
  });

  it('bebê não dispara interação ao clicar em ação bloqueada', () => {
    const { onInteragir } = montarModal(0);

    const bloqueadas = screen
      .getAllByRole('button')
      .filter(b => (b as HTMLButtonElement).disabled);

    for (const b of bloqueadas) fireEvent.click(b);
    expect(onInteragir).not.toHaveBeenCalled();
  });

  it('o motivo do bloqueio é contextual, não genérico', () => {
    montarModal(0);
    const acoes = acoesVisiveis();
    const comMotivo = acoes.filter(a => a.motivo);

    expect(comMotivo.length).toBeGreaterThan(0);
    for (const a of comMotivo) {
      // Nada de "indisponível" seco: o texto explica a fase da vida.
      expect(a.motivo!.length).toBeGreaterThan(20);
    }
  });

  it('aos 2 anos a fala aparece com linguagem infantil, não adulta', () => {
    montarModal(2);
    const acoes = acoesVisiveis();

    expect(acoes.some(a => /falar do seu jeito/i.test(a.titulo))).toBe(true);
    expect(acoes.some(a => a.titulo === 'Conversar')).toBe(false);
  });

  it('aos 4 anos o conflito aparece como birra', () => {
    montarModal(4);
    const acoes = acoesVisiveis();

    expect(acoes.some(a => /birra/i.test(a.titulo))).toBe(true);
    expect(acoes.some(a => a.titulo === 'Discutir')).toBe(false);
  });

  it('adulto vê os rótulos adultos e o presente disponível', () => {
    montarModal(25);
    const acoes = acoesVisiveis();

    expect(acoes.some(a => a.titulo === 'Conversar')).toBe(true);
    expect(acoes.some(a => a.titulo === 'Discutir')).toBe(true);

    const presente = acoes.find(a => /dar um presente/i.test(a.titulo));
    expect(presente).toBeTruthy();
    expect(presente!.desabilitado).toBe(false);
  });

  it('a pessoa vem antes das ações na hierarquia visual', () => {
    const { membro } = montarModal(25);

    const titulo = screen.getByRole('heading', { level: 2 });
    expect(titulo.textContent).toContain(membro.nome);
    expect(titulo.classList.contains('person-head__name')).toBe(true);

    // Relação em destaque logo abaixo do nome.
    expect(document.querySelector('.person-head__relation')).toBeTruthy();
  });

  it('as ações são linhas, não cartões independentes', () => {
    montarModal(25);
    // `unit-card` é o card de verdade; o modal não deve usá-lo para ações.
    expect(document.querySelectorAll('.unit-card')).toHaveLength(0);
    expect(document.querySelectorAll('.event-choice').length).toBeGreaterThan(3);
  });

  it('o submenu de presente só aparece depois de escolher a ação', () => {
    montarModal(25);
    expect(screen.queryByText('R$ 1.200')).toBeNull();

    fireEvent.click(screen.getByText('Dar um presente'));
    expect(screen.getByText('R$ 1.200')).toBeTruthy();
    expect(screen.getByText('Voltar')).toBeTruthy();
  });

  it('nenhum percentual de relacionamento aparece', () => {
    const { container } = render(<div />);
    cleanup();
    montarModal(25);
    expect(document.body.textContent).not.toContain('%');
    expect(container).toBeTruthy();
  });
});

/* ------------------------------------------------ rótulos por fase (unidade) */

describe('B4-FIX · rótulos mudam com a idade', () => {
  it('a mesma intenção tem palavras diferentes por fase', () => {
    const bebe = rotularInteracao('passar_tempo', 0);
    const adulto = rotularInteracao('passar_tempo', 30);

    expect(bebe.titulo).not.toBe(adulto.titulo);
    expect(bebe.titulo).toMatch(/colo/i);
    expect(adulto.titulo).toMatch(/passar tempo/i);
  });

  it('a descrição infantil não usa vocabulário adulto', () => {
    const crianca = rotularInteracao('conversar', 3);
    expect(crianca.descricao).not.toMatch(/bater um papo sobre o dia/i);
  });
});

/* ============================================================== 14, 15
   Dinheiro                                                                */

describe('B4-FIX · dinheiro visível sem virar dashboard', () => {
  function montarIdentidade(idade: number, dinheiro = 2450) {
    const estado = criarEstadoTeste({ idade, economia: { dinheiro } });
    return render(
      <CharacterIdentity
        personagem={estado.personagem}
        educacao={estado.educacao}
        carreira={estado.carreira}
        familia={estado.familia}
        economia={estado.economia}
        situacao="Vive com a família"
      />
    );
  }

  it('o saldo aparece quando é financeiramente relevante', () => {
    montarIdentidade(18);
    expect(screen.getByText('Saldo')).toBeTruthy();
    expect(screen.getByText(/2\.450/)).toBeTruthy();
  });

  it('adolescente com acesso a bico também vê o saldo', () => {
    montarIdentidade(16);
    expect(screen.getByText('Saldo')).toBeTruthy();
  });

  it('o saldo NÃO domina a interface de um bebê', () => {
    const { container } = montarIdentidade(0);
    expect(screen.queryByText('Saldo')).toBeNull();
    expect(container.textContent).not.toMatch(/R\$/);
  });

  it('criança pequena também não recebe destaque financeiro', () => {
    montarIdentidade(5);
    expect(screen.queryByText('Saldo')).toBeNull();
  });

  it('menor com patrimônio real vê o saldo (posse ≠ poder agir)', () => {
    expect(deveMostrarSaldoNaIdentidade(10, true)).toBe(true);
    expect(deveMostrarSaldoNaIdentidade(10, false)).toBe(false);
  });

  it('o saldo é uma linha na identidade, não um card de finanças', () => {
    const { container } = montarIdentidade(25);
    expect(container.querySelector('.identity__balance')).toBeTruthy();
    expect(container.querySelectorAll('.unit-card')).toHaveLength(0);
  });

  it('saldo negativo é sinalizado sem depender só de cor', () => {
    const { container } = montarIdentidade(30, -820);
    const valor = container.querySelector('.identity__balance-value');
    // O sinal negativo está no próprio número.
    expect(valor!.textContent).toMatch(/-/);
    expect(valor!.classList.contains('identity__balance-value--negativo')).toBe(true);
  });
});

/* ============================================================== 16
   Privacidade de atributos                                                */

describe('B4-FIX · atributos internos continuam privados', () => {
  it('a identidade não expõe nenhum atributo interno', () => {
    const estado = criarEstadoTeste({ idade: 30 });
    const { container } = render(
      <CharacterIdentity
        personagem={estado.personagem}
        educacao={estado.educacao}
        carreira={estado.carreira}
        familia={estado.familia}
        economia={estado.economia}
        situacao="Trabalhando"
      />
    );

    const texto = (container.textContent || '').toLowerCase();
    for (const interno of [
      'disciplina',
      'sociabilidade',
      'empatia',
      'ambição',
      'estresse',
      'reputação',
      'condicionamento'
    ]) {
      expect(texto).not.toContain(interno);
    }
  });

  it('não existe ação para revelar atributos internos', () => {
    montarModal(25);
    const textos = screen.getAllByRole('button').map(b => b.textContent || '');
    for (const t of textos) {
      expect(t.toLowerCase()).not.toMatch(/atributos internos|ver internos/);
    }
  });
});

/* ============================================================== 17
   Não voltou a ser "tudo é card"                                          */

describe('B4-FIX · a identidade visual do B4 foi preservada', () => {
  it('a criação de personagem não usa cards para agrupar campos', () => {
    const { container } = render(
      <CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />
    );

    expect(container.querySelectorAll('.card')).toHaveLength(0);
    expect(container.querySelectorAll('.unit-card')).toHaveLength(0);
    expect(container.querySelector('.creation-form')).toBeTruthy();
  });

  it('o modal de relacionamento não virou uma grade de cartões', () => {
    montarModal(25);
    expect(document.querySelectorAll('.card')).toHaveLength(0);
    expect(document.querySelector('.modal-surface')).toBeTruthy();
  });

  it('a identidade continua editorial, sem caixas', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const { container } = render(
      <CharacterIdentity
        personagem={estado.personagem}
        educacao={estado.educacao}
        carreira={estado.carreira}
        familia={estado.familia}
        economia={estado.economia}
        situacao="Trabalhando"
      />
    );

    expect(container.querySelectorAll('.card')).toHaveLength(0);
    expect(container.querySelector('.identity__name')).toBeTruthy();
  });
});

/* ============================================================== 18
   Navegação contextual segue viva                                         */

describe('B4-FIX · navegação contextual continua funcionando', () => {
  it('a política central segue sendo a fonte das permissões', () => {
    const bebe = criarEstadoTeste({ idade: 0 });
    const adulto = criarEstadoTeste({ idade: 25 });

    const presenteBebe = getActionAvailability(bebe, 'interagir_familia', {
      membroId: bebe.familia[0].id,
      tipoInteracao: 'dar_presente'
    });
    const presenteAdulto = getActionAvailability(adulto, 'interagir_familia', {
      membroId: adulto.familia[0].id,
      tipoInteracao: 'dar_presente'
    });

    expect(presenteBebe.kind).toBe('oculto');
    expect(presenteAdulto.kind).toBe('disponivel');
  });

  it('o modal não tem lista própria de idades', () => {
    // Com verificador sempre disponível, o modal exibe tudo que a fase
    // oferece — prova de que ele não filtra por conta própria.
    const estado = criarEstadoTeste({ idade: 0 });
    render(
      <FamilyModal
        membro={estado.familia[0]}
        onClose={() => {}}
        onInteragir={() => {}}
        idadeJogador={0}
        verificarInteracao={() => ({ kind: 'disponivel' })}
      />
    );

    const habilitadas = screen
      .getAllByRole('button')
      .filter(b => b.querySelector('.event-choice__title'))
      .filter(b => !(b as HTMLButtonElement).disabled);

    // Nenhuma foi bloqueada pelo componente.
    expect(habilitadas.length).toBeGreaterThan(0);
  });
});
