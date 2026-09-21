/**
 * F3 passo 1 — auditoria semântica permanente do catálogo.
 *
 * A classificação dos 134 eventos foi feita lendo os textos, um a um. Estes
 * testes existem para que ela não se degrade: qualquer evento novo precisa
 * declarar o que é, e nenhuma classificação pode contradizer a mecânica que
 * o motor aplica a ela.
 *
 * A regra que mais importa aqui é a da Revisão 1: escolher não é a mesma
 * coisa que revelar caráter. Uma `escolha_biografica` permite ao jogador
 * definir um detalhe da própria história e, mesmo assim, NÃO pode mover a
 * personalidade — senão o traço emergente deixa de significar "é assim que
 * essa pessoa age" e passa a significar "é isso que essa pessoa respondeu".
 */

import { describe, it, expect } from 'vitest';
import { MASTER_EVENTS_LIST } from '../allEvents';
import {
  taxonomiaMovePersonalidade,
  taxonomiaPermiteEscolha,
  type TaxonomiaConteudo
} from '../../../types';
import { classificacaoDoEvento, naturezaImplicada } from '../../../systems/events/taxonomia';
import { naturezaDoEvento, IDADE_SEM_DECISAO_CONSCIENTE } from '../../../systems/events/nature';

describe('F3 — taxonomia do catálogo', () => {
  it('todo evento do catálogo declara sua classificação explicitamente', () => {
    const semClassificacao = MASTER_EVENTS_LIST.filter(e => !e.taxonomia);
    expect(semClassificacao.map(e => e.id)).toEqual([]);
  });

  it('a classificação nunca contradiz a natureza declarada', () => {
    // Conteúdo conduzido pelo calendário (marcos) não passa pelo sorteio, e
    // ali `natureza` descreve só o pool de fallback — ver a nota longa em
    // `ehConduzidoPeloCalendario`.
    const contraditorios = MASTER_EVENTS_LIST.filter(e => {
      const implicada = naturezaImplicada(classificacaoDoEvento(e));
      return implicada !== undefined && implicada !== naturezaDoEvento(e);
    });
    expect(contraditorios.map(e => `${e.id}: ${e.taxonomia} × ${e.natureza}`)).toEqual([]);
  });

  it('marco continua respeitando a autonomia por idade: o bebê nunca delibera', () => {
    // `bb_primeira_palavra` permite escolha e tem janela 1-2. Isso NÃO fura a
    // regra, porque quem escolhe é o jogador e não o bebê — mas a regra em si
    // tem de continuar valendo para tudo que passa pelo sorteio.
    const deliberamNoBerco = MASTER_EVENTS_LIST.filter(
      e =>
        e.idadeMaxima <= IDADE_SEM_DECISAO_CONSCIENTE &&
        naturezaDoEvento(e) === 'decisao'
    );
    expect(deliberamNoBerco.map(e => e.id)).toEqual([]);
  });

  it('nenhum evento de faixa sem autonomia (0-2) permite escolha comportamental', () => {
    // Um bebê reage; não delibera. Vale para a classificação, não só para a
    // natureza — é a mesma regra de `nature.exigeAcontecimentoPorIdade`,
    // aplicada ao grão mais fino.
    const violacoes = MASTER_EVENTS_LIST.filter(
      e =>
        e.idadeMaxima <= IDADE_SEM_DECISAO_CONSCIENTE &&
        classificacaoDoEvento(e) === 'decisao_comportamental'
    );
    expect(violacoes.map(e => e.id)).toEqual([]);
  });
});

describe('F3 — escolha biográfica não é evidência de caráter (Revisão 1)', () => {
  it('nenhuma escolha biográfica move a personalidade', () => {
    const biograficas = MASTER_EVENTS_LIST.filter(
      e => classificacaoDoEvento(e) === 'escolha_biografica'
    );
    // A classificação precisa existir de fato, senão o teste passa por vazio.
    expect(biograficas.length).toBeGreaterThan(0);

    const comImpacto = biograficas.filter(e =>
      e.opcoes.some(o => o.consequencias.impactosComportamentais)
    );
    expect(comImpacto.map(e => e.id)).toEqual([]);
  });

  it('nenhum marco testemunhado move a personalidade', () => {
    const testemunhados = MASTER_EVENTS_LIST.filter(
      e => classificacaoDoEvento(e) === 'marco_testemunhado'
    );
    expect(testemunhados.length).toBeGreaterThan(0);

    const comImpacto = testemunhados.filter(e =>
      e.opcoes.some(o => o.consequencias.impactosComportamentais)
    );
    expect(comImpacto.map(e => e.id)).toEqual([]);
  });

  it('nenhum acontecimento puro move a personalidade', () => {
    const puros = MASTER_EVENTS_LIST.filter(
      e => classificacaoDoEvento(e) === 'acontecimento_puro'
    );
    const comImpacto = puros.filter(e =>
      e.opcoes.some(o => o.consequencias.impactosComportamentais)
    );
    expect(comImpacto.map(e => e.id)).toEqual([]);
  });

  it('só `decisao_comportamental` tem licença para mover personalidade', () => {
    const todas: TaxonomiaConteudo[] = [
      'acontecimento_puro',
      'decisao_comportamental',
      'escolha_biografica',
      'marco_testemunhado'
    ];
    const permitidas = todas.filter(taxonomiaMovePersonalidade);
    expect(permitidas).toEqual(['decisao_comportamental']);
  });

  it('escolha biográfica PERMITE escolha, mesmo sem mover personalidade', () => {
    // As duas propriedades são independentes de propósito: é exatamente isso
    // que a Revisão 1 pede. Participar da biografia sem ser julgado por isso.
    expect(taxonomiaPermiteEscolha('escolha_biografica')).toBe(true);
    expect(taxonomiaMovePersonalidade('escolha_biografica')).toBe(false);
  });

  it('marco testemunhado NÃO permite escolha', () => {
    expect(taxonomiaPermiteEscolha('marco_testemunhado')).toBe(false);
    expect(taxonomiaMovePersonalidade('marco_testemunhado')).toBe(false);
  });
});

describe('F3 — os dois canários estão classificados como o projeto exige', () => {
  it('bb_primeira_palavra é MARCO com ESCOLHA BIOGRÁFICA', () => {
    const evento = MASTER_EVENTS_LIST.find(e => e.id === 'bb_primeira_palavra');
    expect(evento).toBeDefined();
    expect(classificacaoDoEvento(evento!)).toBe('escolha_biografica');
    // qual palavra foi é do jogador; não diz nada sobre o caráter dele
    expect(evento!.opcoes.some(o => o.consequencias.impactosComportamentais)).toBe(false);
  });

  it('inf_primeiros_passos é MARCO TESTEMUNHADO, sem escolha', () => {
    const evento = MASTER_EVENTS_LIST.find(e => e.id === 'inf_primeiros_passos');
    expect(evento).toBeDefined();
    expect(classificacaoDoEvento(evento!)).toBe('marco_testemunhado');
    expect(taxonomiaPermiteEscolha(classificacaoDoEvento(evento!))).toBe(false);
  });
});

describe('F3 passo 8 — um acontecimento não finge que houve escolha', () => {
  /**
   * O defeito que estes dois testes travam foi o mais frequente da
   * auditoria: 43 dos 73 acontecimentos tinham as opções redigidas como
   * BOTÕES ("Ficar no celular enquanto eles conversam"), herança da época em
   * que todo evento era decisão. O motor sorteava um desses rótulos e
   * gravava na biografia uma atitude que o jogador nunca teve — no caso de
   * `fam_visita_avo`, desinteresse pela família, 62 vezes.
   */
  const acontecimentos = MASTER_EVENTS_LIST.filter(
    e => naturezaDoEvento(e) === 'acontecimento'
  );

  it('acontecimento não tem rótulo de botão — exceto o marco com escolha biográfica', () => {
    const comBotao = acontecimentos.filter(e =>
      e.opcoes.some(o => (o.texto ?? '').trim() !== '')
    );
    // `bb_primeira_palavra` é a única exceção legítima e ela é estrutural,
    // não um descuido: é um marco COM escolha (§14), em que o jogador
    // realmente escolhe entre duas primeiras palavras. Ele declara
    // `natureza: 'acontecimento'` apenas porque essa natureza descreve o
    // pool de fallback do sorteio, não a forma de apresentação — quem o
    // apresenta é o Calendário da Vida.
    expect(comBotao.map(e => e.id)).toEqual(['bb_primeira_palavra']);
  });

  it('nenhum desfecho de acontecimento diz que o jogador deliberou', () => {
    // "Você preferiu…", "Você decidiu…", "Você resolveu…" afirmam uma
    // intenção que não existiu: quem escolheu foi o dado.
    const VERBOS = /\b(você|voce)\s+(preferiu|decidiu|resolveu|optou|escolheu)\b/i;
    const violacoes: string[] = [];
    for (const evento of acontecimentos) {
      // O marco com escolha está fora: ali o jogador decidiu de verdade.
      if (evento.id === 'bb_primeira_palavra') continue;
      for (const opcao of evento.opcoes) {
        if (VERBOS.test(opcao.descricaoResultado ?? '')) {
          violacoes.push(`${evento.id}/${opcao.id}`);
        }
      }
    }
    expect(violacoes).toEqual([]);
  });
});
