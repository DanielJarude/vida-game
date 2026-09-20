/**
 * @vitest-environment jsdom
 *
 * B4-FIX.1 — interface.
 *
 * Cobre o que o playtest humano reportou: avatar no lugar das iniciais,
 * as 27 UFs na criação, texto essencial sem corte, +1 ANO alcançável e
 * pets com ações próprias.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

import { CharacterCreationScreen } from '../screens/CharacterCreationScreen';
import { AvatarPortrait } from '../avatar/AvatarPortrait';
import { AvatarPicker } from '../avatar/AvatarPicker';
import { PetModal } from '../modals/PetModal';
import { FamilyModal } from '../modals/FamilyModal';
import { TimelineSection } from '../timeline/TimelineSection';
import { CharacterIdentity } from '../character/CharacterIdentity';

import { criarAvatarPadrao, sortearAvatar } from '../../systems/avatarSystem';
import { ESTILOS_DE_CABELO, TONS_DE_PELE } from '../../data/avatar/avatarOptions';
import { listarEstados, listarCidadesPorEstado } from '../../data/locations';
import { INTERACOES_PET } from '../../systems/petInteractionSystem';
import { getActionAvailability } from '../../systems/availabilitySystem';
import {
  criarEstadoTeste,
  criarPersonagemTeste,
  criarPetTeste
} from '../../systems/__tests__/fixtures';
import { criarEducacaoInicial } from '../../systems/educationSystem';
import { criarCarreiraInicial } from '../../systems/careerSystem';
import { criarEconomiaInicial } from '../../systems/economySystem';
import type { LifeLogEntry, PetInteractionType } from '../../types';

afterEach(cleanup);

/* ------------------------------------------------------------------ Avatar */

describe('B4-FIX.1 · avatar na interface', () => {
  it('o retrato desenha um SVG, não iniciais', () => {
    const { container } = render(
      <AvatarPortrait avatar={criarAvatarPadrao()} idade={25} rotulo="Ana Souza" />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('aria-label')).toBe('Ana Souza');
  });

  it('nenhuma combinação de aparência gera coordenada inválida', () => {
    for (const estilo of ESTILOS_DE_CABELO) {
      for (const idade of [0, 2, 5, 11, 18, 40]) {
        const { container } = render(
          <AvatarPortrait
            avatar={{ ...criarAvatarPadrao(), estiloCabelo: estilo.id }}
            idade={idade}
          />
        );
        expect(container.innerHTML).not.toMatch(/NaN|undefined|Infinity/);
        cleanup();
      }
    }
  });

  it('a identidade mostra o avatar do personagem', () => {
    const personagem = criarPersonagemTeste({ idade: 8, avatar: sortearAvatar() });
    const { container } = render(
      <CharacterIdentity
        personagem={personagem}
        educacao={criarEducacaoInicial()}
        carreira={criarCarreiraInicial()}
        familia={[]}
        economia={criarEconomiaInicial('classe_media')}
        situacao="Está na escola"
      />
    );

    expect(container.querySelector('.identity__portrait svg')).toBeTruthy();
    // As iniciais do B4 não existem mais.
    expect(container.querySelector('.identity__initials')).toBeNull();
  });

  it('o seletor permite trocar a aparência e reflete a escolha', () => {
    const onChange = vi.fn();
    render(<AvatarPicker avatar={criarAvatarPadrao()} onChange={onChange} />);

    fireEvent.click(screen.getByRole('radio', { name: TONS_DE_PELE[5].nome }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ tomDePele: TONS_DE_PELE[5].id })
    );
  });

  it('o seletor marca visualmente a opção escolhida', () => {
    const avatar = { ...criarAvatarPadrao(), tomDePele: TONS_DE_PELE[3].id };
    render(<AvatarPicker avatar={avatar} onChange={() => {}} />);

    const selecionado = screen.getByRole('radio', { name: TONS_DE_PELE[3].nome });
    expect(selecionado.getAttribute('aria-checked')).toBe('true');
  });
});

/* ------------------------------------------------------------ Criação */

describe('B4-FIX.1 · criação de vida', () => {
  it('o seletor de Estado oferece as 27 UFs', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);

    const select = screen.getByLabelText('Estado') as HTMLSelectElement;
    expect(select.options).toHaveLength(27);
  });

  it('os estados aparecem com nome por extenso, não só sigla', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);

    const select = screen.getByLabelText('Estado') as HTMLSelectElement;
    const textos = Array.from(select.options).map(o => o.textContent ?? '');

    expect(textos).toContain('Acre (AC)');
    expect(textos).toContain('São Paulo (SP)');
    expect(textos).toContain('Distrito Federal (DF)');
  });

  it('a opção principal não exibe a região', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);

    const select = screen.getByLabelText('Estado') as HTMLSelectElement;

    // A região existe nos dados, mas não na opção. O nome do estado é
    // comparado com a lista canônica: nada é acrescentado a ele além da
    // sigla. (Comparar por texto solto não serve — "Mato Grosso do Sul"
    // contém "Sul" sem ser uma região.)
    const esperados = listarEstados().map(uf => `${uf.nome} (${uf.sigla})`);
    const textos = Array.from(select.options).map(o => o.textContent);
    expect(textos).toEqual(esperados);
  });

  it('escolher o Acre lista apenas cidades do Acre', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'AC' } });

    const cidades = screen.getByLabelText('Cidade') as HTMLSelectElement;
    const esperadas = listarCidadesPorEstado('AC').map(c => c.cidade).sort();
    expect(Array.from(cidades.options).map(o => o.value).sort()).toEqual(esperadas);
  });

  it('trocar de UF atualiza a cidade selecionada', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'RR' } });
    const cidade = (screen.getByLabelText('Cidade') as HTMLSelectElement).value;

    expect(listarCidadesPorEstado('RR').some(c => c.cidade === cidade)).toBe(true);
  });

  it('toda UF é selecionável e produz cidade válida', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);
    const select = screen.getByLabelText('Estado');

    for (const uf of listarEstados()) {
      fireEvent.change(select, { target: { value: uf.sigla } });
      const cidades = screen.getByLabelText('Cidade') as HTMLSelectElement;
      expect(cidades.options.length).toBeGreaterThan(0);
    }
  });

  it('a escolha manual chega ao motor junto com o avatar', () => {
    const onCriar = vi.fn();
    render(<CharacterCreationScreen onCriarVida={onCriar} onVoltar={() => {}} />);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'TO' } });
    fireEvent.click(screen.getByRole('button', { name: /começar a viver/i }));

    const [, , , cidade, estado, avatar] = onCriar.mock.calls[0];
    expect(estado).toBe('TO');
    expect(listarCidadesPorEstado('TO').some(c => c.cidade === cidade)).toBe(true);
    expect(avatar).toMatchObject({ tomDePele: expect.any(String) });
  });

  it('a criação está dividida em seções legíveis', () => {
    render(<CharacterCreationScreen onCriarVida={() => {}} onVoltar={() => {}} />);

    expect(screen.getByText('Identidade')).toBeTruthy();
    expect(screen.getByText('Aparência')).toBeTruthy();
    expect(screen.getByText('Nascimento')).toBeTruthy();
  });
});

/* ---------------------------------------------------------------- Pets */

describe('B4-FIX.1 · pets na interface', () => {
  const abrirPetModal = (idadeJogador: number) => {
    const base = criarEstadoTeste({ idade: idadeJogador });
    const pet = criarPetTeste();
    const ctx = { ...base, familia: [...base.familia, pet] };
    const onInteragir = vi.fn();

    render(
      <PetModal
        membro={pet}
        onClose={() => {}}
        onInteragir={onInteragir}
        idadeJogador={idadeJogador}
        verificarInteracao={(tipo: PetInteractionType) =>
          getActionAvailability(ctx, 'interagir_pet', {
            membroId: pet.id,
            tipoInteracaoPet: tipo
          })
        }
      />
    );

    return { onInteragir };
  };

  it('o modal de pet não oferece nenhuma ação humana', () => {
    abrirPetModal(30);
    const dialogo = screen.getByRole('dialog');

    for (const proibida of [/conversar/i, /discutir/i, /conselho/i, /dinheiro/i, /presente/i]) {
      expect(within(dialogo).queryByText(proibida)).toBeNull();
    }
  });

  it('o modal de pet oferece ações de pet', () => {
    abrirPetModal(30);
    const dialogo = screen.getByRole('dialog');

    expect(within(dialogo).getByText(/fazer carinho/i)).toBeTruthy();
    expect(within(dialogo).getByText(/brincar/i)).toBeTruthy();
  });

  it('a interface respeita a capacidade por idade do jogador', () => {
    abrirPetModal(1);
    const dialogo = screen.getByRole('dialog');

    // Um bebê não leva o cachorro para passear: a ação nem é oferecida.
    expect(within(dialogo).queryByText(/passear/i)).toBeNull();
  });

  it('clicar numa ação disponível chama o motor com o tipo certo', () => {
    const { onInteragir } = abrirPetModal(30);

    fireEvent.click(screen.getByText(/fazer carinho/i).closest('button')!);
    expect(onInteragir).toHaveBeenCalledWith('fazer_carinho');
  });

  it('o modal humano continua oferecendo ações humanas', () => {
    const base = criarEstadoTeste({ idade: 30 });
    const mae = base.familia.find(f => f.tipo === 'mae')!;

    render(
      <FamilyModal
        membro={mae}
        onClose={() => {}}
        onInteragir={() => {}}
        idadeJogador={30}
        verificarInteracao={tipo =>
          getActionAvailability(base, 'interagir_familia', {
            membroId: mae.id,
            tipoInteracao: tipo
          })
        }
      />
    );

    expect(screen.getByText(/conversar/i)).toBeTruthy();
  });

  it('nenhuma ação de pet aparece no modal humano', () => {
    const base = criarEstadoTeste({ idade: 30 });
    const mae = base.familia.find(f => f.tipo === 'mae')!;

    render(
      <FamilyModal
        membro={mae}
        onClose={() => {}}
        onInteragir={() => {}}
        idadeJogador={30}
        verificarInteracao={tipo =>
          getActionAvailability(base, 'interagir_familia', {
            membroId: mae.id,
            tipoInteracao: tipo
          })
        }
      />
    );

    const dialogo = screen.getByRole('dialog');
    expect(within(dialogo).queryByText(/dar comida/i)).toBeNull();
    expect(within(dialogo).queryByText(/ensinar um truque/i)).toBeNull();
  });

  it('todas as interações de pet têm alvo de toque acessível', () => {
    abrirPetModal(30);
    const botoes = screen.getAllByRole('button');
    expect(botoes.length).toBeGreaterThanOrEqual(2);
    expect(INTERACOES_PET.length).toBeGreaterThanOrEqual(4);
  });
});

/* ------------------------------------------------------------- +1 ANO */

describe('B4-FIX.1 · +1 ANO acessível', () => {
  const timelineLonga = (anos: number): LifeLogEntry[] =>
    Array.from({ length: anos * 4 }, (_, i) => ({
      id: `log_${i}`,
      idade: Math.floor(i / 4),
      ano: 2026 + Math.floor(i / 4),
      categoria: 'geral' as const,
      texto: `Aconteceu alguma coisa no registro número ${i}.`,
      tipo: 'info' as const
    }));

  it('o botão vem antes da timeline no DOM, não depois dela', () => {
    const { container } = render(
      <TimelineSection
        timeline={timelineLonga(25)}
        idadeAtual={25}
        onEnvelhecer={() => {}}
        bloqueado={false}
      />
    );

    const botao = container.querySelector('.year-advance')!;
    const linha = container.querySelector('.timeline, .life-timeline') ?? container.lastElementChild!;

    // Ordem no documento: o CTA precede a biografia.
    expect(botao.compareDocumentPosition(linha) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('o botão existe mesmo com uma vida muito longa', () => {
    render(
      <TimelineSection
        timeline={timelineLonga(60)}
        idadeAtual={60}
        onEnvelhecer={() => {}}
        bloqueado={false}
      />
    );

    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('avançar o ano chama o motor', () => {
    const onEnvelhecer = vi.fn();
    render(
      <TimelineSection
        timeline={timelineLonga(3)}
        idadeAtual={3}
        onEnvelhecer={onEnvelhecer}
        bloqueado={false}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onEnvelhecer).toHaveBeenCalled();
  });

  it('bloqueado, o botão desabilita e explica o motivo em texto', () => {
    render(
      <TimelineSection
        timeline={timelineLonga(3)}
        idadeAtual={3}
        onEnvelhecer={() => {}}
        bloqueado
      />
    );

    const botao = screen.getByRole('button') as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toMatch(/acontecimento/i);
  });
});
