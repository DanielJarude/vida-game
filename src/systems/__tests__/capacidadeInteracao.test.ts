/**
 * B4-FIX — capacidade de interação por idade.
 *
 * O playtest humano encontrou um bebê de 0 ano com as opções "Conversar",
 * "Passar tempo junto", "Dar um presente" e "Discutir". Estes testes
 * garantem que a regra existe no MOTOR, não apenas no JSX: esconder o
 * botão e chamar a ação direto precisam dar o mesmo resultado.
 */

import { describe, it, expect } from 'vitest';

import {
  deveOferecerInteracao,
  obterFaseInteracao,
  narrarInteracaoPorFase,
  IDADE_PRIMEIRAS_FALAS,
  IDADE_MINIMA_CONFLITO,
  IDADE_MINIMA_DAR_PRESENTE
} from '../interactionCapabilitySystem';
import { getActionAvailability } from '../availabilitySystem';
import { interagirComFamiliar } from '../familySystem';
import { criarEstadoTeste, criarFamiliaTeste } from './fixtures';
import type { FamilyInteractionType } from '../../types';

/* ------------------------------------------------------------------ helpers */

function disponibilidade(idade: number, tipo: FamilyInteractionType) {
  const estado = criarEstadoTeste({ idade });
  const membro = estado.familia[0]; // pai
  return getActionAvailability(estado, 'interagir_familia', {
    membroId: membro.id,
    tipoInteracao: tipo
  });
}

function executarNoMotor(idade: number, tipo: FamilyInteractionType) {
  const estado = criarEstadoTeste({ idade });
  const membro = estado.familia[0];
  return interagirComFamiliar(membro, estado.personagem, tipo);
}

/* ============================================================== 1, 2, 3
   Recém-nascido                                                           */

describe('B4-FIX · recém-nascido (0 anos)', () => {
  it('não pode conversar', () => {
    const disp = disponibilidade(0, 'conversar');
    expect(disp.kind).toBe('bloqueado');
    if (disp.kind === 'bloqueado') {
      expect(disp.motivo).toMatch(/bebê de colo|ainda não fala/i);
    }
  });

  it('não pode discutir', () => {
    const disp = disponibilidade(0, 'discutir');
    expect(disp.kind).toBe('bloqueado');
    if (disp.kind === 'bloqueado') {
      expect(disp.motivo).toMatch(/não discute/i);
    }
  });

  it('não pode dar presente (nem aparece como opção)', () => {
    const disp = disponibilidade(0, 'dar_presente');
    expect(disp.kind).toBe('oculto');
  });

  it('PODE receber colo — o vínculo existe desde o primeiro dia', () => {
    const disp = disponibilidade(0, 'passar_tempo');
    expect(disp.kind).toBe('disponivel');
  });

  it('a narrativa do colo é de bebê, não de adulto', () => {
    const res = executarNoMotor(0, 'passar_tempo');
    expect(res.sucesso).toBe(true);
    expect(res.mensagem).toMatch(/colo/i);
    expect(res.mensagem).not.toMatch(/tarde inteira|conversa/i);
  });
});

/* ============================================================== 4
   O bloqueio vale no motor, não só na UI                                  */

describe('B4-FIX · ação bloqueada também falha no motor', () => {
  const casos: Array<[FamilyInteractionType, number]> = [
    ['conversar', 0],
    ['discutir', 0],
    ['dar_presente', 0],
    ['conversar', 1],
    ['discutir', 2],
    ['dar_presente', 8]
  ];

  it.each(casos)(
    'chamar %s direto aos %i anos é recusado sem efeito',
    (tipo, idade) => {
      const estado = criarEstadoTeste({ idade });
      const membro = estado.familia[0];
      const relAntes = membro.relacionamento;
      const felAntes = estado.personagem.stats.felicidade;

      const res = interagirComFamiliar(membro, estado.personagem, tipo);

      expect(res.sucesso).toBe(false);
      // Nenhum efeito parcial: nada de relacionamento, humor ou dinheiro.
      expect(res.membroAtualizado.relacionamento).toBe(relAntes);
      expect(res.personagemAtualizado.stats.felicidade).toBe(felAntes);
      expect(res.custoDinheiro).toBe(0);
      expect(res.dinheiroGanho).toBe(0);
      expect(res.mensagem.length).toBeGreaterThan(0);
    }
  );
});

/* ============================================================== 5
   1 ano                                                                   */

describe('B4-FIX · 1 ano', () => {
  it('continua sem conversa adulta', () => {
    const disp = disponibilidade(1, 'conversar');
    expect(disp.kind).toBe('bloqueado');
    if (disp.kind === 'bloqueado') {
      expect(disp.motivo).toMatch(/gestos e sons/i);
    }
  });

  it('continua sem discussão', () => {
    expect(disponibilidade(1, 'discutir').kind).toBe('bloqueado');
  });

  it('brincar junto está disponível', () => {
    expect(disponibilidade(1, 'passar_tempo').kind).toBe('disponivel');
  });

  it('a narrativa é de quem engatinha', () => {
    const res = executarNoMotor(1, 'passar_tempo');
    expect(res.mensagem).toMatch(/engatinh/i);
  });
});

/* ============================================================== 6
   2 anos — primeiras falas                                                */

describe('B4-FIX · 2 anos libera comunicação apropriada', () => {
  it('a fala básica é liberada no marco definido pelo sistema', () => {
    expect(IDADE_PRIMEIRAS_FALAS).toBe(2);
    expect(disponibilidade(IDADE_PRIMEIRAS_FALAS, 'conversar').kind).toBe(
      'disponivel'
    );
  });

  it('mas a discussão argumentativa ainda não', () => {
    expect(disponibilidade(2, 'discutir').kind).toBe('bloqueado');
    expect(IDADE_MINIMA_CONFLITO).toBe(3);
  });

  it('a fala aos 2 anos é descrita como primeira fala, não papo adulto', () => {
    const res = executarNoMotor(2, 'conversar');
    expect(res.sucesso).toBe(true);
    expect(res.mensagem).toMatch(/palavras que sabia|nem tudo fez sentido/i);
  });

  it('presente continua indisponível', () => {
    expect(disponibilidade(2, 'dar_presente').kind).toBe('oculto');
  });
});

/* ============================================================== 7
   3 a 5 anos                                                              */

describe('B4-FIX · 3 a 5 anos recebem interações infantis coerentes', () => {
  it.each([3, 4, 5])('aos %i anos conversa e brinca', idade => {
    expect(disponibilidade(idade, 'conversar').kind).toBe('disponivel');
    expect(disponibilidade(idade, 'passar_tempo').kind).toBe('disponivel');
  });

  it('conflito infantil passa a existir aos 3', () => {
    expect(disponibilidade(3, 'discutir').kind).toBe('disponivel');
  });

  it('o conflito aos 4 anos é birra, não discussão adulta', () => {
    const res = executarNoMotor(4, 'discutir');
    expect(res.mensagem).toMatch(/birra/i);
    expect(res.mensagem).not.toMatch(/discussão áspera/i);
  });

  it('a conversa aos 5 anos é infantil', () => {
    const res = executarNoMotor(5, 'conversar');
    expect(res.mensagem).toMatch(/sem pular nenhum detalhe|seu dia/i);
  });

  it('ainda não dá presentes comprados', () => {
    expect(disponibilidade(5, 'dar_presente').kind).toBe('oculto');
  });
});

/* ============================================================== 8
   Adulto mantém tudo                                                      */

describe('B4-FIX · adulto mantém interações adultas', () => {
  it.each(['conversar', 'passar_tempo', 'discutir', 'dar_presente', 'pedir_conselho'] as FamilyInteractionType[])(
    '%s está disponível aos 25',
    tipo => {
      expect(disponibilidade(25, tipo).kind).toBe('disponivel');
    }
  );

  it('a narrativa adulta é preservada', () => {
    const res = executarNoMotor(25, 'conversar');
    expect(res.mensagem).toMatch(/ótima conversa/i);
  });

  it('a discussão adulta é preservada', () => {
    const res = executarNoMotor(30, 'discutir');
    expect(res.mensagem).toMatch(/discussão áspera/i);
  });
});

/* ============================================================== 9
   Presente respeita idade, contexto e saldo                               */

describe('B4-FIX · presente respeita idade, contexto e saldo', () => {
  it('não existe antes da idade mínima', () => {
    expect(IDADE_MINIMA_DAR_PRESENTE).toBe(12);
    expect(disponibilidade(IDADE_MINIMA_DAR_PRESENTE - 1, 'dar_presente').kind)
      .not.toBe('disponivel');
  });

  it('passa a ser oferecido a partir da idade mínima', () => {
    expect(disponibilidade(IDADE_MINIMA_DAR_PRESENTE, 'dar_presente').kind).toBe(
      'disponivel'
    );
  });

  it('o motor cobra o preço real do presente escolhido', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const membro = estado.familia[0];

    const barato = interagirComFamiliar(membro, estado.personagem, 'dar_presente', 'barato');
    const luxo = interagirComFamiliar(membro, estado.personagem, 'dar_presente', 'luxo');

    expect(barato.custoDinheiro).toBe(50);
    expect(luxo.custoDinheiro).toBe(1200);
  });

  it('não cria dinheiro mágico: o custo é sempre positivo', () => {
    const estado = criarEstadoTeste({ idade: 25 });
    const res = interagirComFamiliar(
      estado.familia[0],
      estado.personagem,
      'dar_presente',
      'medio'
    );
    expect(res.custoDinheiro).toBeGreaterThan(0);
    expect(res.dinheiroGanho).toBe(0);
  });
});

/* ------------------------------------------------------- fases e utilidades */

describe('B4-FIX · fases de interação', () => {
  it('mapeia as faixas de capacidade', () => {
    expect(obterFaseInteracao(0)).toBe('recem_nascido');
    expect(obterFaseInteracao(1)).toBe('primeiros_passos');
    expect(obterFaseInteracao(2)).toBe('primeiras_palavras');
    expect(obterFaseInteracao(4)).toBe('infancia');
    expect(obterFaseInteracao(8)).toBe('escolar');
    expect(obterFaseInteracao(20)).toBe('autonomo');
  });

  it('não oferece presente muito antes de ele ser possível', () => {
    expect(deveOferecerInteracao('dar_presente', 0)).toBe(false);
    expect(deveOferecerInteracao('dar_presente', 5)).toBe(false);
    expect(deveOferecerInteracao('dar_presente', 12)).toBe(true);
  });

  it('toda narrativa por fase é não vazia para interações suportadas', () => {
    for (const idade of [0, 1, 2, 4, 8, 25]) {
      for (const tipo of ['conversar', 'passar_tempo', 'discutir'] as const) {
        expect(narrarInteracaoPorFase(tipo, 'Maria', idade).length).toBeGreaterThan(0);
      }
    }
  });

  it('nenhuma narrativa infantil usa pontos internos de personalidade', () => {
    for (const idade of [0, 1, 2, 4]) {
      for (const tipo of ['conversar', 'passar_tempo', 'discutir'] as const) {
        const texto = narrarInteracaoPorFase(tipo, 'Maria', idade).toLowerCase();
        expect(texto).not.toMatch(/empatia|disciplina|reputação|estresse|\+\d/);
      }
    }
  });

  it('a família de teste continua coerente (guarda de fixture)', () => {
    expect(criarFamiliaTeste()).toHaveLength(2);
  });
});
