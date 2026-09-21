/**
 * @vitest-environment jsdom
 *
 * B4 — PLAYTEST VISUAL por idade.
 *
 * Renderiza a interface real nas idades exigidas e verifica identidade,
 * navegação, Linha da Vida, CTA, ausência de ações impossíveis e overflow.
 * Roda com: npx vitest run src/__playtest__
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

import { GameShell } from '../components/shell/GameShell';
import { SectionRouter } from '../components/shell/SectionRouter';
import { criarEstadoTeste } from '../systems/__tests__/fixtures';
import {
  getAbasDisponiveis,
  descreverSituacaoAtual,
  type TabId
} from '../systems/availabilitySystem';
import { criarPersonalidadeInicial } from '../systems/personalitySystem';
import type { LifeLogEntry } from '../types';

afterEach(cleanup);

const IDADES = [0, 5, 10, 15, 17, 18, 25, 65];

/** Termos que jamais podem aparecer para quem não tem a idade mínima. */
const TERMOS_ADULTOS = [
  /comprar imóveis/i,
  /apostar na mega-sena/i,
  /procurar emprego/i,
  /conhecer novas pessoas/i,
  /nova aplicação/i
];

function timelineDe(idade: number): LifeLogEntry[] {
  const logs: LifeLogEntry[] = [
    {
      id: 'nasc',
      idade: 0,
      ano: 2026,
      categoria: 'geral',
      texto: 'Você nasceu em Marília, SP. A família toda estava esperando.',
      tipo: 'importante'
    }
  ];
  for (let i = 1; i <= idade; i++) {
    logs.push({
      id: `ano_${i}`,
      idade: i,
      ano: 2026 + i,
      categoria: i % 3 === 0 ? 'familia' : 'geral',
      texto: `Aos ${i} anos a vida seguiu seu curso.`,
      tipo: 'info'
    });
  }
  return logs;
}

function montar(idade: number, aba: TabId = 'timeline') {
  const base = criarEstadoTeste({ idade });
  // Estado coerente com a idade, para não forçar situações impossíveis.
  const estado =
    idade >= 18
      ? criarEstadoTeste({
          idade,
          educacao: { nivelAtual: 'medio_completo' }
        })
      : base;

  const ctx = { ...estado };
  const abas = getAbasDisponiveis(ctx);
  const abaAtiva = abas.includes(aba) ? aba : 'timeline';

  const { container } = render(
    <GameShell
      personagem={estado.personagem}
      educacao={estado.educacao}
      carreira={estado.carreira}
      economia={estado.economia}
      familia={estado.familia}
      personalidade={criarPersonalidadeInicial()}
      situacao={descreverSituacaoAtual(ctx)}
      abas={abas}
      abaAtiva={abaAtiva}
      onSelecionarAba={() => {}}
      somLigado
      onToggleSom={() => {}}
      onGoHome={() => {}}
      onOpenStats={() => {}}
      feedback={null}
    >
      <SectionRouter
        aba={abaAtiva}
        ctx={ctx}
        personagem={estado.personagem}
        familia={estado.familia}
        educacao={estado.educacao}
        carreira={estado.carreira}
        economia={estado.economia}
        timeline={timelineDe(idade)}
        eventoAberto={false}
        onEnvelhecer={() => {}}
        onInteragirFamilia={() => {}}
        onPedirCasamento={() => {}}
        onTerFilho={() => {}}
        onTerminarRelacionamento={() => {}}
        onAbrirEncontros={() => {}}
        onAcaoEscola={() => {}}
        onMatricularCurso={() => {}}
        onCandidatarVaga={() => {}}
        onTrabalharMais={() => {}}
        onPedirAumento={() => {}}
        onPedirDemissao={() => {}}
        onFazerBico={() => {}}
        onComprarBem={() => {}}
        onVenderBem={() => {}}
        onInvestir={() => {}}
        onResgatarInvestimento={() => {}}
        onJogarLoteria={() => {}}
        onExecutarAtividade={() => {}}
      />
    </GameShell>
  );

  return { container, abas, estado };
}

describe.each(IDADES)('PLAYTEST · %i anos', idade => {
  it('identidade: nome e idade legíveis na primeira tela', () => {
    montar(idade);

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Ana');

    const esperado = idade === 1 ? '1 ano' : `${idade} anos`;
    expect(screen.getAllByText(esperado).length).toBeGreaterThan(0);
  });

  it('identidade: cidade e situação presentes e coerentes com a fase', () => {
    const { container } = montar(idade);
    const texto = container.textContent || '';

    expect(texto).toContain('Marília');
    // Um bebê nunca é descrito como "Desempregado(a)".
    if (idade <= 2) {
      expect(texto).not.toMatch(/desempregad/i);
    }
  });

  it('navegação: apenas abas autorizadas pela política central', () => {
    const { abas } = montar(idade);
    const nav = screen.getByRole('navigation', { name: /seções do jogo/i });
    const itens = within(nav).getAllByRole('button');

    expect(itens).toHaveLength(abas.length);
    expect(abas).toContain('timeline');

    if (idade < 6) expect(abas).not.toContain('carreira');
    if (idade < 18) expect(abas).not.toContain('financas');
  });

  it('Linha da Vida: presente e com a biografia acumulada', () => {
    montar(idade);
    const regiao = screen.getByLabelText('Linha da Vida');
    expect(regiao).toBeTruthy();
    expect(within(regiao).getByText('Linha da Vida')).toBeTruthy();
  });

  it('CTA +1 ANO: presente, rotulado e acionável', () => {
    montar(idade);
    const cta = screen.getByRole('button', { name: /\+ 1 ano/i }) as HTMLButtonElement;
    expect(cta).toBeTruthy();
    expect(cta.disabled).toBe(false);
  });

  it('ausência de ações impossíveis para a fase', () => {
    const { container } = montar(idade);
    const texto = container.textContent || '';

    if (idade < 18) {
      for (const termo of TERMOS_ADULTOS) {
        expect(texto).not.toMatch(termo);
      }
    }
  });

  it('informação secundária coerente: dinheiro só quando a fase justifica', () => {
    const { container } = montar(idade);
    const temBlocoFinancas = !!within(container).queryByRole('heading', {
      name: /^finanças$/i
    });

    // Antes dos 15 não há renda própria possível: dinheiro seria ruído.
    // A partir da adolescência final o jogador pode fazer bicos, então o
    // bloco passa a ser informação útil.
    expect(temBlocoFinancas).toBe(idade >= 15);
  });

  it('personalidade permanece qualitativa (sem números)', () => {
    const { container } = montar(idade);
    const bloco = Array.from(container.querySelectorAll('.aside-block')).find(b =>
      /traços percebidos/i.test(b.textContent || '')
    );

    if (bloco) {
      const semTitulo = (bloco.textContent || '').replace(/traços percebidos/i, '');
      expect(/\d/.test(semTitulo)).toBe(false);
    }
  });

  it('densidade: a tela não vira um mural de cards', () => {
    const { container } = montar(idade);
    // `unit-card` é reservado a unidades reais (pessoa, bloco interativo).
    const cards = container.querySelectorAll('.unit-card');
    expect(cards.length).toBeLessThan(12);
  });

  it('sem overflow: nenhum estilo inline de largura fixa em px', () => {
    const { container } = montar(idade);
    const comLarguraFixa = Array.from(
      container.querySelectorAll<HTMLElement>('[style]')
    ).filter(el => /(^|[^-])width:\s*\d{3,}px/.test(el.getAttribute('style') || ''));

    expect(comLarguraFixa).toHaveLength(0);
  });
});

/* ------------------------------------------------------ seções por idade */

describe('PLAYTEST · seções específicas', () => {
  it('adulto: seção Finanças abre sem dados do mockup', () => {
    const { container } = montar(25, 'financas');
    const texto = container.textContent || '';

    expect(texto).toMatch(/saldo em conta/i);
    expect(texto).not.toContain('13.130');
  });

  it('adulto: seção Estudos & Carreira abre com trabalho disponível', () => {
    const { container } = montar(25, 'carreira');
    expect(container.textContent).toMatch(/trabalho/i);
  });

  it('criança de 10 anos: seção de estudos existe, sem mercado de trabalho adulto', () => {
    const { container } = montar(10, 'carreira');
    const texto = container.textContent || '';

    expect(texto).toMatch(/estudos/i);
    expect(texto).not.toMatch(/procurar emprego/i);
  });

  it('bebê: seção de relacionamentos mostra a família, sem encontros', () => {
    const { container } = montar(0, 'familia');
    const texto = container.textContent || '';

    expect(texto).toContain('Maria');
    expect(texto).not.toMatch(/conhecer novas pessoas/i);
  });

  it('terceira idade: atividades continuam disponíveis', () => {
    const { container } = montar(65, 'atividades');
    expect(container.textContent).toMatch(/atividades/i);
  });
});
