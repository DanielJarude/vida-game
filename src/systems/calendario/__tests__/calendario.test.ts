/**
 * F3 — o Calendário da Vida.
 *
 * O que este arquivo protege é a diferença entre "este marco tem peso alto
 * no sorteio" e "este marco vai acontecer". A medição que motivou a fase:
 * *A Primeira Palavra* saía em 17% das vidas e *Primeiros Passos* em 13%,
 * não porque aquelas vidas não tivessem os marcos, mas porque o dado caía
 * em outro evento.
 *
 * Nenhum teste aqui usa RNG. Se um dia for preciso mockar aleatoriedade para
 * testar o calendário, é sinal de que o dado voltou a entrar onde não devia.
 */

import { describe, it, expect } from 'vitest';
import {
  agendar,
  compromissosExpirados,
  compromissosPendentesDoTipo,
  compromissosVencidos,
  fecharMarcosDoPassado,
  instanteDoMarco,
  marcarCompromissoCumprido,
  marcarMarcoCumprido,
  marcoFoiCumprido,
  marcosDevidos,
  marcosPerdidos,
  panoramaDeMarcos
} from '../calendario';
import {
  dentroDaJanela,
  deveOcorrerAgora,
  entrouNaJanela,
  estadoDaJanela,
  idadePreferencial,
  janelaPerdida,
  janelaVencendo
} from '../janelas';
import { criarCalendarioInicial, type MarcoDeVida } from '../tipos';
import { instanteDe } from '../../tempo/instante';
import { MARCOS_DE_VIDA } from '../../../data/calendario/marcosDeVida';

const SEMPRE = () => true;
const NUNCA = () => false;

const MARCO_GARANTIDO: MarcoDeVida = {
  id: 'teste_garantido',
  conteudoId: 'conteudo_a',
  janela: { idadeMinima: 1, idadeMaxima: 3, idadeTipica: 2 },
  modo: 'garantido',
  temEscolha: false
};

const MARCO_CONDICIONAL: MarcoDeVida = {
  id: 'teste_condicional',
  conteudoId: 'conteudo_b',
  janela: { idadeMinima: 10, idadeMaxima: 12 },
  modo: 'condicional',
  condicao: { emEscola: true },
  temEscolha: true
};

describe('janelas — aritmética de idade, sem aleatoriedade', () => {
  const janela = { idadeMinima: 6, idadeMaxima: 8, idadeTipica: 6 };

  it('dentro, antes e depois da janela', () => {
    expect(dentroDaJanela(janela, 5)).toBe(false);
    expect(dentroDaJanela(janela, 6)).toBe(true);
    expect(dentroDaJanela(janela, 8)).toBe(true);
    expect(dentroDaJanela(janela, 9)).toBe(false);
  });

  it('"entrou" significa que a janela já começou — inclusive depois de passar', () => {
    // Não é "é o primeiro ano": é "não está mais no futuro". É assim que
    // `estadoDaJanela` distingue 'futura' de todo o resto.
    expect(entrouNaJanela(janela, 5)).toBe(false);
    expect(entrouNaJanela(janela, 6)).toBe(true);
    expect(entrouNaJanela(janela, 7)).toBe(true);
    expect(entrouNaJanela(janela, 20)).toBe(true);
  });

  it('a janela vence no último ano — é a última chance', () => {
    expect(janelaVencendo(janela, 7)).toBe(false);
    expect(janelaVencendo(janela, 8)).toBe(true);
  });

  it('janela perdida só depois do último ano', () => {
    expect(janelaPerdida(janela, 8)).toBe(false);
    expect(janelaPerdida(janela, 9)).toBe(true);
  });

  it('idade preferencial usa a típica; sem ela, o começo da janela', () => {
    expect(idadePreferencial(janela)).toBe(6);
    expect(idadePreferencial({ idadeMinima: 3, idadeMaxima: 5 })).toBe(3);
  });

  it('estadoDaJanela nomeia as cinco situações', () => {
    expect(estadoDaJanela(janela, 4, false)).toBe('futura');
    expect(estadoDaJanela(janela, 7, false)).toBe('aberta');
    expect(estadoDaJanela(janela, 8, false)).toBe('vencendo');
    expect(estadoDaJanela(janela, 9, false)).toBe('perdida');
    expect(estadoDaJanela(janela, 7, true)).toBe('cumprida');
  });

  it('deve ocorrer a partir do ano típico, e nunca fora da janela', () => {
    // A partir do típico, não apenas NELE: se a idade preferencial passou
    // sem o marco ocorrer (a condição ainda não valia, ou outro marco tomou
    // o ano), ele sai na primeira oportunidade seguinte em vez de esperar a
    // última chamada. Atrasar de propósito só aumentaria a chance de perder.
    expect(deveOcorrerAgora(janela, 5)).toBe(false); // antes da janela
    expect(deveOcorrerAgora(janela, 6)).toBe(true); // ano típico
    expect(deveOcorrerAgora(janela, 7)).toBe(true); // recuperação
    expect(deveOcorrerAgora(janela, 8)).toBe(true); // última chance
    expect(deveOcorrerAgora(janela, 9)).toBe(false); // janela perdida
  });

  it('antes da idade típica o marco espera, mesmo já dentro da janela', () => {
    // É o que impede *Primeiros Passos* (típica 1) e *A Primeira Palavra*
    // (típica 2) de saírem juntos no mesmo ano.
    const tardia = { idadeMinima: 1, idadeMaxima: 2, idadeTipica: 2 };
    expect(deveOcorrerAgora(tardia, 1)).toBe(false);
    expect(deveOcorrerAgora(tardia, 2)).toBe(true);
  });
});

describe('marcos — ocorrência é pergunta diferente de repetição', () => {
  it('um marco garantido vence dentro da janela e some depois de cumprido', () => {
    const vazio = criarCalendarioInicial();
    expect(marcosDevidos(vazio, [MARCO_GARANTIDO], 2, SEMPRE)).toHaveLength(1);

    const depois = marcarMarcoCumprido(vazio, MARCO_GARANTIDO.id, instanteDe(2));
    expect(marcosDevidos(depois, [MARCO_GARANTIDO], 3, SEMPRE)).toEqual([]);
    expect(marcoFoiCumprido(depois, MARCO_GARANTIDO.id)).toBe(true);
    expect(instanteDoMarco(depois, MARCO_GARANTIDO.id)).toBe(instanteDe(2));
  });

  it('marcar duas vezes não reescreve o instante original (idempotência)', () => {
    const uma = marcarMarcoCumprido(criarCalendarioInicial(), 'm', instanteDe(2));
    const duas = marcarMarcoCumprido(uma, 'm', instanteDe(40));
    expect(instanteDoMarco(duas, 'm')).toBe(instanteDe(2));
    expect(duas).toBe(uma);
  });

  it('a condição é injetada: sem ela satisfeita, o marco não é devido', () => {
    const vazio = criarCalendarioInicial();
    expect(marcosDevidos(vazio, [MARCO_CONDICIONAL], 12, NUNCA)).toEqual([]);
    expect(marcosDevidos(vazio, [MARCO_CONDICIONAL], 12, SEMPRE)).toHaveLength(1);
  });

  it('GUARDA — um marco garantido nunca aparece como perdido enquanto a janela existe', () => {
    // A promessa da fase em uma linha: se é garantido, a vida não deixa passar.
    for (let idade = 0; idade <= MARCO_GARANTIDO.janela.idadeMaxima; idade++) {
      expect(
        marcosPerdidos(criarCalendarioInicial(), [MARCO_GARANTIDO], idade),
        `idade ${idade}`
      ).toEqual([]);
    }
  });

  it('panorama classifica cada marco sem alterar nada', () => {
    const estado = marcarMarcoCumprido(criarCalendarioInicial(), MARCO_GARANTIDO.id, instanteDe(2));
    const panorama = panoramaDeMarcos(estado, [MARCO_GARANTIDO, MARCO_CONDICIONAL], 11);
    expect(panorama.find(p => p.marco.id === MARCO_GARANTIDO.id)?.estado).toBe('cumprida');
    expect(panorama.find(p => p.marco.id === MARCO_CONDICIONAL.id)?.estado).toBe('aberta');
  });
});

describe('compromissos agendados', () => {
  const compromisso = {
    id: 'c1',
    tipo: 'resultado_vestibular',
    agendadoEm: instanteDe(17),
    venceEm: instanteDe(18)
  };

  it('vence a partir do instante marcado e nunca é engolido por atraso', () => {
    const estado = agendar(criarCalendarioInicial(), compromisso);
    expect(compromissosVencidos(estado, instanteDe(17))).toEqual([]);
    expect(compromissosVencidos(estado, instanteDe(18))).toHaveLength(1);
    // Passou do prazo e ninguém resolveu: continua vencido, não desaparece.
    expect(compromissosVencidos(estado, instanteDe(25))).toHaveLength(1);
  });

  it('expiração respeita `expiraEm`', () => {
    const estado = agendar(criarCalendarioInicial(), {
      ...compromisso,
      expiraEm: instanteDe(19)
    });
    expect(compromissosExpirados(estado, instanteDe(19))).toEqual([]);
    expect(compromissosExpirados(estado, instanteDe(20))).toHaveLength(1);
    // Expirado deixa de vencer.
    expect(compromissosVencidos(estado, instanteDe(20))).toEqual([]);
  });

  it('cumprir remove da lista de pendentes do tipo', () => {
    const estado = agendar(criarCalendarioInicial(), compromisso);
    expect(compromissosPendentesDoTipo(estado, 'resultado_vestibular')).toHaveLength(1);
    const depois = marcarCompromissoCumprido(estado, 'c1', instanteDe(18));
    expect(compromissosPendentesDoTipo(depois, 'resultado_vestibular')).toEqual([]);
    expect(compromissosVencidos(depois, instanteDe(30))).toEqual([]);
  });
});

describe('compatibilidade de save — uma vida antiga não deve marcos', () => {
  it('adulto de save legado não fica devendo os primeiros passos', () => {
    // O caso destrutivo que a migração evita: sem ela, uma pessoa de 30 anos
    // apareceria com todos os marcos da infância pendentes.
    const migrado = fecharMarcosDoPassado(
      criarCalendarioInicial(),
      MARCOS_DE_VIDA,
      30,
      instanteDe(30),
      () => false
    );
    expect(marcosDevidos(migrado, MARCOS_DE_VIDA, 30, SEMPRE)).toEqual([]);
    expect(marcosDevidos(migrado, MARCOS_DE_VIDA, 31, SEMPRE)).toEqual([]);
  });

  it('marco que a vida JÁ viveu é fechado pelo histórico, não reaberto', () => {
    const jaViveu = (id: string) => id === 'inf_primeiros_passos';
    const migrado = fecharMarcosDoPassado(
      criarCalendarioInicial(),
      MARCOS_DE_VIDA,
      2,
      instanteDe(2),
      jaViveu
    );
    expect(marcoFoiCumprido(migrado, 'marco_primeiros_passos')).toBe(true);
    // O que ainda não aconteceu e ainda cabe na janela continua devido.
    expect(marcoFoiCumprido(migrado, 'marco_primeira_palavra')).toBe(false);
  });

  it('criança de save legado ainda recebe os marcos que cabem no futuro', () => {
    const migrado = fecharMarcosDoPassado(
      criarCalendarioInicial(),
      MARCOS_DE_VIDA,
      5,
      instanteDe(5),
      () => false
    );
    const futuros = marcosDevidos(migrado, MARCOS_DE_VIDA, 6, SEMPRE).map(m => m.id);
    expect(futuros).toContain('marco_primeiro_dia_escola');
  });
});

describe('catálogo de marcos — consistência declarativa', () => {
  it('todo marco aponta para conteúdo que existe e tem janela coerente', async () => {
    const { MASTER_EVENTS_LIST } = await import('../../../data/events/allEvents');
    for (const marco of MARCOS_DE_VIDA) {
      const conteudo = MASTER_EVENTS_LIST.find(e => e.id === marco.conteudoId);
      expect(conteudo, `marco ${marco.id} aponta para conteúdo inexistente`).toBeDefined();
      expect(marco.janela.idadeMinima).toBeLessThanOrEqual(marco.janela.idadeMaxima);
      if (marco.janela.idadeTipica !== undefined) {
        expect(marco.janela.idadeTipica).toBeGreaterThanOrEqual(marco.janela.idadeMinima);
        expect(marco.janela.idadeTipica).toBeLessThanOrEqual(marco.janela.idadeMaxima);
      }
    }
  });

  it('a janela do marco cabe na janela do conteúdo (o evento pode mesmo ocorrer ali)', async () => {
    const { MASTER_EVENTS_LIST } = await import('../../../data/events/allEvents');
    for (const marco of MARCOS_DE_VIDA) {
      const conteudo = MASTER_EVENTS_LIST.find(e => e.id === marco.conteudoId)!;
      expect(marco.janela.idadeMinima, marco.id).toBeGreaterThanOrEqual(conteudo.idadeMinima);
      expect(marco.janela.idadeMaxima, marco.id).toBeLessThanOrEqual(conteudo.idadeMaxima);
    }
  });

  it('nenhum id de marco ou de conteúdo se repete', () => {
    const ids = MARCOS_DE_VIDA.map(m => m.id);
    const conteudos = MARCOS_DE_VIDA.map(m => m.conteudoId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(conteudos).size).toBe(conteudos.length);
  });

  it('marco com escolha nunca move personalidade (Revisão 1, verificada no catálogo)', async () => {
    const { MASTER_EVENTS_LIST } = await import('../../../data/events/allEvents');
    for (const marco of MARCOS_DE_VIDA.filter(m => m.temEscolha)) {
      const conteudo = MASTER_EVENTS_LIST.find(e => e.id === marco.conteudoId)!;
      for (const opcao of conteudo.opcoes) {
        expect(
          opcao.consequencias.impactosComportamentais,
          `${marco.id}/${opcao.id} tenta caracterizar uma escolha biográfica`
        ).toBeUndefined();
      }
    }
  });
});
