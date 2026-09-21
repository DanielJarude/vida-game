/**
 * @vitest-environment jsdom
 *
 * B4 — testes de interface do rework visual.
 *
 * Cobrem os invariantes que o redesign não pode quebrar:
 * navegação contextual por idade, fluxo do evento, privacidade da
 * personalidade, ausência de dados do mockup e comportamento acessível.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

import { GameShell } from '../shell/GameShell';
import { PrimaryNavigation } from '../shell/PrimaryNavigation';
import { EventExperience } from '../events/EventExperience';
import { AnnualSummary } from '../feedback/AnnualSummary';
import { CharacterIdentity } from '../character/CharacterIdentity';
import { PersonalitySummary } from '../stats/PersonalitySummary';
import { RelationshipSummary } from '../relationships/RelationshipSummary';
import { FinanceSummary } from '../finance/FinanceSummary';
import { TimelineSection } from '../timeline/TimelineSection';
import { YearAdvance } from '../shell/YearAdvance';

import { criarEstadoTeste, criarFamiliaTeste } from '../../systems/__tests__/fixtures';
import { getAbasDisponiveis, descreverSituacaoAtual } from '../../systems/availabilitySystem';
import { criarPersonalidadeInicial, registrarEscolha } from '../../systems/personalitySystem';
import { construirResumoAnual, descreverEfeitosPublicos } from '../../presentation/outcomePresentation';
import type { GameEvent, LifeLogEntry } from '../../types';

afterEach(cleanup);

/* ------------------------------------------------------------------ helpers */

function montarShell(idade: number, extra: Parameters<typeof criarEstadoTeste>[0] = {}) {
  const estado = criarEstadoTeste({ idade, ...extra });
  const ctx = { ...estado };
  const abas = getAbasDisponiveis(ctx);

  render(
    <GameShell
      personagem={estado.personagem}
      educacao={estado.educacao}
      carreira={estado.carreira}
      economia={estado.economia}
      familia={estado.familia}
      personalidade={criarPersonalidadeInicial()}
      situacao={descreverSituacaoAtual(ctx)}
      abas={abas}
      abaAtiva="timeline"
      onSelecionarAba={() => {}}
      somLigado
      onToggleSom={() => {}}
      onGoHome={() => {}}
      onOpenStats={() => {}}
      feedback={null}
    >
      <TimelineSection
        timeline={[]}
        idadeAtual={idade}
        onEnvelhecer={() => {}}
        bloqueado={false}
      />
    </GameShell>
  );

  return { estado, abas };
}

const EVENTO_TESTE: GameEvent = {
  id: 'evt_teste_b4',
  titulo: 'Uma decisão na escola',
  descricao: 'Um colega te procura antes da prova com uma proposta.',
  idadeMinima: 0,
  idadeMaxima: 99,
  categoria: 'escola',
  peso: 1,
  opcoes: [
    {
      id: 'op_estudar',
      texto: 'Estudar junto com o colega',
      descricaoResultado: 'Vocês revisaram a matéria e você se sentiu mais seguro.',
      consequencias: {
        stats: { inteligencia: 3, felicidade: 2 },
        // Impacto comportamental interno — NUNCA deve aparecer na tela.
        impactosComportamentais: { disciplina: 2, empatia: 1 },
        hiddenStats: { disciplina: 2 }
      }
    },
    {
      id: 'op_bloqueada',
      texto: 'Pagar por um gabarito',
      consequencias: { dinheiro: -500 },
      requisito: { dinheiroMinimo: 999999 }
    }
  ]
};

/* ============================================================== 1, 2, 3
   Navegação contextual por idade                                          */

describe('B4 · navegação contextual por idade', () => {
  it('bebê (0 anos) não vê nenhum sistema adulto na navegação', () => {
    montarShell(0);

    const nav = screen.getByRole('navigation', { name: /seções do jogo/i });

    expect(within(nav).queryByText('Finanças')).toBeNull();
    expect(within(nav).queryByText('Estudos & Carreira')).toBeNull();
    // A Linha da Vida é sempre o centro da experiência.
    expect(within(nav).getByText('Linha da Vida')).toBeTruthy();
  });

  it('criança de 5 anos ainda não vê Finanças nem Estudos & Carreira', () => {
    montarShell(5);
    const nav = screen.getByRole('navigation', { name: /seções do jogo/i });
    expect(within(nav).queryByText('Finanças')).toBeNull();
    expect(within(nav).queryByText('Estudos & Carreira')).toBeNull();
  });

  it('aos 6 anos a escola aparece, mas Finanças continua oculta', () => {
    montarShell(6);
    const nav = screen.getByRole('navigation', { name: /seções do jogo/i });
    expect(within(nav).getByText('Estudos & Carreira')).toBeTruthy();
    expect(within(nav).queryByText('Finanças')).toBeNull();
  });

  it('adulto (25 anos) vê os sistemas permitidos pela política central', () => {
    montarShell(25);
    const nav = screen.getByRole('navigation', { name: /seções do jogo/i });

    expect(within(nav).getByText('Linha da Vida')).toBeTruthy();
    expect(within(nav).getByText('Relacionamentos')).toBeTruthy();
    expect(within(nav).getByText('Estudos & Carreira')).toBeTruthy();
    expect(within(nav).getByText('Finanças')).toBeTruthy();
    expect(within(nav).getByText('Atividades')).toBeTruthy();
  });

  it('a navegação renderiza exatamente as abas que a política autoriza', () => {
    // A UI não pode ter uma lista paralela de permissões.
    const estado = criarEstadoTeste({ idade: 0 });
    const abas = getAbasDisponiveis(estado);

    render(
      <PrimaryNavigation abas={abas} abaAtiva="timeline" onSelecionar={() => {}} />
    );

    const botoes = screen.getAllByRole('button');
    expect(botoes).toHaveLength(abas.length);
  });

  it('painel financeiro não domina a visão geral de um bebê', () => {
    montarShell(0);
    // O bloco lateral de Finanças não existe nesta fase.
    expect(screen.queryByRole('heading', { name: /^finanças$/i })).toBeNull();
  });
});

/* ============================================================== 4
   +1 ANO                                                                  */

describe('B4 · +1 ANO', () => {
  it('continua funcionando e dispara a passagem de ano', () => {
    const avancar = vi.fn();
    render(
      <YearAdvance onAvancar={avancar} bloqueado={false} rotulo="+ 1 ano" />
    );

    fireEvent.click(screen.getByRole('button', { name: /\+ 1 ano/i }));
    expect(avancar).toHaveBeenCalledTimes(1);
  });

  it('fica bloqueado com motivo em texto quando há evento em aberto', () => {
    const avancar = vi.fn();
    render(
      <YearAdvance onAvancar={avancar} bloqueado rotulo="+ 1 ano" />
    );

    const botao = screen.getByRole('button', { name: /\+ 1 ano/i });
    expect((botao as HTMLButtonElement).disabled).toBe(true);

    // O motivo não depende de cor nem de hover.
    expect(screen.getByText(/responda ao acontecimento/i)).toBeTruthy();

    fireEvent.click(botao);
    expect(avancar).not.toHaveBeenCalled();
  });

  it('está presente na seção Linha da Vida em todas as idades testadas', () => {
    for (const idade of [0, 5, 10, 15, 17, 18, 25, 65]) {
      cleanup();
      render(
        <TimelineSection
          timeline={[]}
          idadeAtual={idade}
          onEnvelhecer={() => {}}
          bloqueado={false}
        />
      );
      expect(screen.getByRole('button', { name: /\+ 1 ano/i })).toBeTruthy();
    }
  });
});

/* ============================================================== 5, 6, 13
   Evento: situação → escolha → resultado                                  */

describe('B4 · evento preserva situação → escolha → resultado → continuar', () => {
  function montarEvento(onEscolher = vi.fn(() => true), onContinuar = vi.fn()) {
    const estado = criarEstadoTeste({ idade: 12 });
    render(
      <EventExperience
        evento={EVENTO_TESTE}
        personagem={estado.personagem}
        economia={estado.economia}
        personalidade={criarPersonalidadeInicial()}
        onEscolherOpcao={onEscolher}
        onContinuar={onContinuar}
      />
    );
    return { onEscolher, onContinuar };
  }

  it('mostra a situação e as escolhas antes de decidir', () => {
    montarEvento();

    expect(screen.getByText('Uma decisão na escola')).toBeTruthy();
    expect(screen.getByText(/um colega te procura/i)).toBeTruthy();
    expect(screen.getByText('Estudar junto com o colega')).toBeTruthy();

    // Ainda não há resultado.
    expect(screen.queryByText('Resultado')).toBeNull();
  });

  it('exibe o resultado no MESMO contexto, sem abrir segundo modal', () => {
    montarEvento();

    fireEvent.click(screen.getByText('Estudar junto com o colega'));

    // Continua existindo exatamente um diálogo.
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByText('Resultado')).toBeTruthy();
    expect(screen.getByText(/vocês revisaram a matéria/i)).toBeTruthy();
  });

  it('mantém a escolha feita visível junto ao resultado', () => {
    montarEvento();
    fireEvent.click(screen.getByText('Estudar junto com o colega'));
    expect(screen.getByText('Estudar junto com o colega')).toBeTruthy();
  });

  it('só chama continuar depois que o jogador lê o resultado', () => {
    const { onContinuar } = montarEvento();

    expect(screen.queryByRole('button', { name: /continuar/i })).toBeNull();

    fireEvent.click(screen.getByText('Estudar junto com o colega'));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));

    expect(onContinuar).toHaveBeenCalledTimes(1);
  });

  it('não mostra resultado quando o motor recusa a escolha', () => {
    // Motor recusa => `false`.
    montarEvento(vi.fn(() => false));

    fireEvent.click(screen.getByText('Estudar junto com o colega'));

    expect(screen.queryByText('Resultado')).toBeNull();
    // As opções continuam disponíveis para nova tentativa.
    expect(screen.getByText('Estudar junto com o colega')).toBeTruthy();
  });

  it('opção sem requisito atendido aparece desabilitada e com motivo textual', () => {
    montarEvento();

    const bloqueada = screen
      .getByText('Pagar por um gabarito')
      .closest('button') as HTMLButtonElement;

    expect(bloqueada.disabled).toBe(true);
    // Motivo visível em texto, dentro da própria opção (funciona no toque
    // e em leitor de tela, sem depender de hover ou de `title`).
    expect(bloqueada.textContent).toMatch(/você precisa de/i);
  });

  it('o resultado não duplica a Linha da Vida', () => {
    montarEvento();
    fireEvent.click(screen.getByText('Estudar junto com o colega'));

    // O evento não renderiza timeline; o registro é responsabilidade do motor.
    expect(screen.queryByRole('region', { name: /linha da vida/i })).toBeNull();
    expect(screen.queryByLabelText(/linha da vida/i)).toBeNull();
  });
});

/* ============================================================== 6
   ActionOutcome / efeitos públicos                                        */

describe('B4 · efeitos públicos do resultado', () => {
  it('exibe efeitos mecânicos em linguagem humana', () => {
    const estado = criarEstadoTeste({ idade: 12 });
    render(
      <EventExperience
        evento={EVENTO_TESTE}
        personagem={estado.personagem}
        economia={estado.economia}
        personalidade={criarPersonalidadeInicial()}
        onEscolherOpcao={() => true}
        onContinuar={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Estudar junto com o colega'));

    expect(screen.getByText('Inteligência aumentou')).toBeTruthy();
    expect(screen.getByText('Felicidade aumentou')).toBeTruthy();
  });

  it('descreve dinheiro com o valor real do motor', () => {
    const efeitos = descreverEfeitosPublicos({ dinheiro: 500 });
    expect(efeitos.some(e => e.texto.includes('500'))).toBe(true);
  });
});

/* ============================================================== 7
   Personalidade interna nunca numérica                                    */

describe('B4 · personalidade permanece qualitativa', () => {
  it('não exibe números nem barras para traços', () => {
    let personalidade = criarPersonalidadeInicial();
    // Acumula evidência suficiente para revelar um traço percebido.
    for (let i = 0; i < 8; i++) {
      personalidade = registrarEscolha(personalidade, {
        eventoId: `evt_${i}`,
        opcaoId: 'op',
        idade: 10 + i,
        ano: 2030 + i,
        tagsComportamentais: { generosidade: 4 }
      }).personalidade;
    }

    const { container } = render(
      <PersonalitySummary personalidade={personalidade} genero="feminino" />
    );

    const texto = container.textContent || '';
    // Nenhum dígito: sem intensidade, sem percentual, sem progresso.
    expect(/\d/.test(texto)).toBe(false);
    expect(container.querySelector('[role="meter"]')).toBeNull();
    expect(container.querySelector('progress')).toBeNull();
  });

  it('mostra "em formação" enquanto não houver evidência', () => {
    render(
      <PersonalitySummary
        personalidade={criarPersonalidadeInicial()}
        genero="masculino"
      />
    );
    expect(screen.getByText(/personalidade ainda em formação/i)).toBeTruthy();
  });

  it('o resultado de um evento não vaza impactos comportamentais', () => {
    // A opção declara disciplina/empatia internos; nada disso é público.
    const efeitos = descreverEfeitosPublicos(EVENTO_TESTE.opcoes[0].consequencias);
    const texto = efeitos.map(e => e.texto.toLowerCase()).join(' ');

    expect(texto).not.toContain('disciplina');
    expect(texto).not.toContain('empatia');
    expect(texto).not.toContain('ambição');
    expect(texto).not.toContain('estresse');
  });
});

/* ============================================================== 8, 9
   Economia e personagem não usam dados do mockup                          */

describe('B4 · nenhum dado do mockup de referência aparece na UI', () => {
  it('finanças refletem o estado real, sem o saldo negativo do mockup', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const { container } = render(<FinanceSummary economia={estado.economia} />);

    const texto = container.textContent || '';
    // Valores do mockup que jamais podem estar hardcoded.
    expect(texto).not.toContain('13.130');
    expect(texto).not.toContain('13130');
  });

  it('a identidade não hardcodeia o personagem da referência', () => {
    const estado = criarEstadoTeste({ idade: 18 });
    const { container } = render(
      <CharacterIdentity
        personagem={estado.personagem}
        educacao={estado.educacao}
        carreira={estado.carreira}
        familia={estado.familia}
        economia={estado.economia}
        situacao="Vive com os pais"
      />
    );

    const texto = container.textContent || '';
    expect(texto).not.toContain('Danilo');
    expect(texto).not.toContain('Nascimento');
    // Mostra a pessoa real do estado.
    expect(texto).toContain('Ana');
    expect(texto).toContain('Marília');
  });

  it('relacionamentos não hardcodeiam nomes do mockup', () => {
    const { container } = render(
      <RelationshipSummary familia={criarFamiliaTeste()} />
    );
    const texto = container.textContent || '';

    expect(texto).not.toContain('Clara');
    expect(texto).not.toContain('Fernando');
    expect(texto).toContain('Maria');
  });

  it('relacionamentos usam proximidade qualitativa, não percentual', () => {
    const { container } = render(
      <RelationshipSummary familia={criarFamiliaTeste()} />
    );
    const texto = container.textContent || '';

    expect(texto).toMatch(/muito próxima|próxima|estável|distante|conflituosa/i);
    expect(texto).not.toContain('%');
  });
});

/* ============================================================== 10
   Mobile não perde ações essenciais                                       */

describe('B4 · ações essenciais no mobile', () => {
  it('+1 ANO e identidade continuam presentes na composição mobile', () => {
    // O layout mobile é CSS; a estrutura não remove nada do DOM.
    montarShell(25);

    expect(screen.getByRole('button', { name: /\+ 1 ano/i })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: /seções do jogo/i })).toBeTruthy();
  });

  it('a idade continua legível no cabeçalho em qualquer fase', () => {
    for (const idade of [0, 10, 18, 65]) {
      cleanup();
      montarShell(idade);
      const esperado = idade === 1 ? '1 ano' : `${idade} anos`;
      expect(screen.getAllByText(esperado).length).toBeGreaterThan(0);
    }
  });
});

/* ============================================================== 11
   Reduced motion preserva informação                                      */

describe('B4 · reduced motion preserva a informação', () => {
  it('o resultado é informativo sem depender de animação', () => {
    const estado = criarEstadoTeste({ idade: 12 });
    render(
      <EventExperience
        evento={EVENTO_TESTE}
        personagem={estado.personagem}
        economia={estado.economia}
        personalidade={criarPersonalidadeInicial()}
        onEscolherOpcao={() => true}
        onContinuar={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Estudar junto com o colega'));

    // Conteúdo textual presente no DOM independentemente de animação.
    const resultado = screen.getByRole('status');
    expect(resultado.textContent).toContain('Resultado');
    expect(resultado.textContent).toContain('Inteligência aumentou');
  });
});

/* ============================================================== 12
   Modais acessíveis                                                        */

describe('B4 · comportamento acessível dos modais', () => {
  it('o evento é um diálogo modal rotulado pelo próprio título', () => {
    const estado = criarEstadoTeste({ idade: 12 });
    render(
      <EventExperience
        evento={EVENTO_TESTE}
        personagem={estado.personagem}
        economia={estado.economia}
        personalidade={criarPersonalidadeInicial()}
        onEscolherOpcao={() => true}
        onContinuar={() => {}}
      />
    );

    const dialogo = screen.getByRole('dialog');
    expect(dialogo.getAttribute('aria-modal')).toBe('true');

    const rotuloId = dialogo.getAttribute('aria-labelledby');
    expect(rotuloId).toBeTruthy();
    expect(document.getElementById(rotuloId!)?.textContent).toBe(
      'Uma decisão na escola'
    );
  });

  it('move o foco para dentro do diálogo ao abrir', () => {
    const estado = criarEstadoTeste({ idade: 12 });
    render(
      <EventExperience
        evento={EVENTO_TESTE}
        personagem={estado.personagem}
        economia={estado.economia}
        personalidade={criarPersonalidadeInicial()}
        onEscolherOpcao={() => true}
        onContinuar={() => {}}
      />
    );

    const dialogo = screen.getByRole('dialog');
    expect(dialogo.contains(document.activeElement)).toBe(true);
  });

  it('o resumo anual fecha com Escape', () => {
    const fechar = vi.fn();
    render(
      <AnnualSummary
        resumo={construirResumoAnual(11, 2037, [])}
        onFechar={fechar}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(fechar).toHaveBeenCalled();
  });

  it('o evento em aberto NÃO fecha com Escape (decisão obrigatória)', () => {
    const continuar = vi.fn();
    const estado = criarEstadoTeste({ idade: 12 });
    render(
      <EventExperience
        evento={EVENTO_TESTE}
        personagem={estado.personagem}
        economia={estado.economia}
        personalidade={criarPersonalidadeInicial()}
        onEscolherOpcao={() => true}
        onContinuar={continuar}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(continuar).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

/* ============================================================== 15
   Resumo anual                                                             */

describe('B4 · resumo anual', () => {
  const logs: LifeLogEntry[] = [
    {
      id: 'l1',
      idade: 19,
      ano: 2045,
      categoria: 'carreira',
      texto: 'Você começou a trabalhar como atendente.',
      tipo: 'positivo'
    },
    {
      id: 'l2',
      idade: 19,
      ano: 2045,
      categoria: 'cotidiano',
      texto: 'Um dia comum.',
      tipo: 'info'
    }
  ];

  it('destaca acontecimentos relevantes e ignora ruído do cotidiano', () => {
    render(
      <AnnualSummary resumo={construirResumoAnual(19, 2045, logs)} onFechar={() => {}} />
    );

    expect(screen.getByText(/começou a trabalhar/i)).toBeTruthy();
    expect(screen.queryByText('Um dia comum.')).toBeNull();
  });

  it('assume o silêncio quando o ano não teve acontecimentos relevantes', () => {
    render(
      <AnnualSummary resumo={construirResumoAnual(4, 2030, [])} onFechar={() => {}} />
    );

    expect(screen.getByText(/sem grandes acontecimentos/i)).toBeTruthy();
  });

  it('anuncia a idade alcançada', () => {
    render(
      <AnnualSummary resumo={construirResumoAnual(19, 2045, logs)} onFechar={() => {}} />
    );
    expect(screen.getByText(/você agora tem 19 anos/i)).toBeTruthy();
  });
});
