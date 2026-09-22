/**
 * F4 — GUARDA PERMANENTE DE CATÁLOGO.
 *
 * O objetivo é que ninguém precise LEMBRAR de escrever um `if` quando
 * adicionar um evento que diga "seu cachorro...". A dependência de contexto
 * tem de ser declarativa, e este teste é o que cobra a declaração.
 *
 * COMO ELE EVITA SER UM DETECTOR DE TEXTO MAL-HUMORADO:
 *
 * A varredura léxica sozinha não decide nada — a auditoria pós-playtest
 * provou isso ao classificar "garagem" (do prédio) como carro e "o cachorro
 * da casa" (0-2 anos) como pet do personagem. Então o teste opera com DUAS
 * listas explícitas:
 *
 *   · EXIGEM_CONTEXTO — eventos cujo texto pressupõe posse, já auditados um a
 *     um. Cada um DEVE declarar o predicado correspondente.
 *   · DISPENSADOS — eventos que a varredura acusa mas a leitura inocentou,
 *     cada um com a razão registrada aqui. Um evento nesta lista não pode
 *     estar também na primeira.
 *
 * Um evento NOVO que caia na varredura e não esteja em nenhuma das duas faz
 * o teste falhar, com a mensagem dizendo o que fazer. É esse o mecanismo que
 * substitui "alguém lembrar".
 */

import { describe, it, expect } from 'vitest';
import { MASTER_EVENTS_LIST } from '../allEvents';
import type { GameEvent } from '../../../types';

const eventos = MASTER_EVENTS_LIST as GameEvent[];

/** Eventos auditados que DEVEM declarar um predicado de contexto. */
const EXIGEM_CONTEXTO: Record<string, keyof NonNullable<GameEvent['condicoes']>> = {
  fam_pet_veterinario: 'temPet',
  adm_assembleia_condominio: 'temImovel',
  fam_padrinho_casamento: 'temAmigos',
  esc_olimpiada_matematica: 'emEscola',
  ext_festa_junina: 'emEscola',
  car_exame_ordem_conselho: 'empregado'
};

/**
 * Eventos que a varredura acusa e a LEITURA inocentou. A razão fica aqui
 * porque ela é a parte que um regex nunca vai conseguir guardar.
 */
const DISPENSADOS: Record<string, string> = {
  bb_cachorro_familia:
    'O cachorro é da casa, anterior ao nascimento do bebê — não é pet adquirido. ' +
    'Exigir temPet tornava o evento inalcançável: pet só se obtém a partir dos 4 anos.',
  inf_gatinho_rua:
    'É o evento que ENCONTRA um gatinho e pode adotá-lo. Exigir pet seria exigir ' +
    'o resultado como pré-condição da causa.',
  ext_resgate_cachorro:
    'É a segunda das duas únicas fontes de pet do jogo — exigir pet aqui impediria ' +
    'para sempre que alguém viesse a ter um.',
  adm_mudanca_caminhao_emprestado:
    'Mudança de casa não pressupõe imóvel PRÓPRIO — quem aluga também muda.',
  com_biblioteca_bairro:
    'A "garagem" do texto é a do vizinho que abriu a biblioteca — falso positivo ' +
    'clássico da varredura por palavra, não indício de veículo do personagem.',
  fin_oportunidade_terreno:
    'Comprar um terreno não pressupõe já ter imóvel; já exige dinheiroMinimo.',
  adm_casamento_de_amigo:
    'Convite de casamento de alguém próximo; o texto não afirma parceria do personagem.',
  adm_reencontro_de_turma:
    'Reencontro de colégio 20 anos depois: pressupõe ter estudado (todos estudam), ' +
    'não matrícula ativa nem amizade viva no presente.',
  sen_viagem_excursao:
    'Excursão de terceira idade: "seus amigos" é ambiental e coletivo, não um NPC ' +
    'nomeado que precise existir no estado.',
  jov_carnaval_rua:
    'Carnaval de rua: "seus amigos" é ambiental, como "a multidão"; não há vínculo ' +
    'específico que o estado precise conter.',
  inf_bullying_defesa:
    'Faixa etária já cai dentro do período em que a escola é automática; o colega ' +
    'é personagem da cena, não um vínculo persistido no estado.',
  ado_cola_prova:
    'Mesmo caso do bullying: faixa escolar automática, e o colega que oferece a cola ' +
    'existe dentro da cena, não no estado da família.',
  esc_achado_perdido_dinheiro:
    'Cena escolar dentro da faixa em que a matrícula é automática; medido 0 ' +
    'violações em 105 vidas.',
  esp_selecao_natacao:
    'Seleção esportiva escolar dentro da faixa em que a matrícula é automática; ' +
    'medido 0 violações em 105 vidas.',
  hob_colecao_figurinhas:
    'Troca de figurinhas com colegas: a escola é cenário da cena, não uma posse ' +
    'que o texto afirme; medido 0 violações em 105 vidas.',
  ext_vender_brigadeiro:
    'Venda para colegas E vizinhos: funciona com ou sem matrícula ativa, e nenhuma ' +
    'posse é afirmada pelo texto.',
  ado_trote_festa:
    'Formatura do EM: acontece no ano em que emCurso já virou false (0/105 matriculados aos 17). ' +
    'O pressuposto real é escolaridade alcançada, e não existe predicado de nível. Adiado.',
  ado_preparacao_enem:
    'Mesmo caso do trote: ano de conclusão do EM, quando a matrícula já encerrou. Adiado.',
  sen_neto_vestibular:
    'O vestibular é do NETO, não do personagem — exigir emFaculdade aqui olharia ' +
    'para a pessoa errada da cena.',
  adu_crise_meia_idade: 'Menção genérica a cidade, sem pressupor posse ou local específico.',
  adu_oportunidade_negocio:
    'Cita cidade de forma ambiental ao propor um negócio; não pressupõe imóvel, ' +
    'veículo nem sociedade já existente.',
  jov_proposta_outra_cidade: 'A proposta é justamente para MUDAR de cidade; nada a exigir.',
  crc_primeiro_dia_creche:
    'É um MARCO que INAUGURA a vida escolar — exigir emEscola inverteria causa e efeito.',
  inf_primeiro_dia_escola: 'Mesmo caso: marco de entrada no fundamental.'
};

/**
 * Termos que sugerem posse de algo concreto. Usados só para ENCONTRAR
 * candidatos — a decisão sobre cada um está nas duas listas acima.
 */
const SUGEREM_POSSE: { nome: string; re: RegExp }[] = [
  { nome: 'pet', re: /\b(seu pet|seu cachorro|sua cadela|seu gato|sua gata|o cachorro da (casa|família)|bichinho de estimação|à clínica veterinária)\b/i },
  { nome: 'imóvel', re: /\b(seu apartamento|sua casa própria|seu imóvel|assembleia do prédio|síndico)\b/i },
  { nome: 'veículo', re: /\b(seu carro|sua moto|seu veículo)\b/i },
  { nome: 'amigo', re: /\b(seu melhor amigo|sua melhor amiga|seu amigo de infância)\b/i }
];

describe('F4 · catálogo — pressuposto de contexto é declarativo', () => {
  it('todo evento auditado como dependente de contexto DECLARA seu predicado', () => {
    for (const [id, predicado] of Object.entries(EXIGEM_CONTEXTO)) {
      const evento = eventos.find((e) => e.id === id);
      expect(evento, `evento ${id} sumiu do catálogo`).toBeDefined();
      const cond = (evento!.condicoes ?? {}) as Record<string, unknown>;
      expect(
        cond[predicado],
        `${id} precisa declarar condicoes.${predicado} — é o que impede o texto de ` +
          'afirmar algo que a vida do personagem não tem'
      ).toBe(true);
    }
  });

  it('nenhum evento está simultaneamente exigindo e dispensado', () => {
    const conflito = Object.keys(EXIGEM_CONTEXTO).filter((id) => id in DISPENSADOS);
    expect(conflito, 'um evento não pode exigir e ser dispensado ao mesmo tempo').toEqual([]);
  });

  it('todo evento cujo texto sugere posse está classificado (exige OU dispensado)', () => {
    const naoClassificados: string[] = [];

    for (const e of eventos) {
      const texto = [
        e.titulo,
        e.descricao,
        ...e.opcoes.flatMap((o) => [o.texto ?? '', o.descricaoResultado ?? ''])
      ].join(' \n ');

      const sugere = SUGEREM_POSSE.some((s) => s.re.test(texto));
      if (!sugere) continue;
      if (e.id in EXIGEM_CONTEXTO || e.id in DISPENSADOS) continue;
      naoClassificados.push(e.id);
    }

    expect(
      naoClassificados,
      'Estes eventos têm texto que pressupõe posse e não foram classificados.\n' +
        'Leia cada um e: (a) adicione a condição de contexto e registre em ' +
        'EXIGEM_CONTEXTO, ou (b) registre em DISPENSADOS com a razão.\n' +
        'Não remova este teste: ele é o que evita um novo "pet sem pet".'
    ).toEqual([]);
  });

  it('as razões de dispensa são substantivas (não um "ok" vazio)', () => {
    for (const [id, razao] of Object.entries(DISPENSADOS)) {
      expect(razao.length, `a dispensa de ${id} precisa de razão real`).toBeGreaterThan(30);
    }
  });

  it('os predicados declarados existem no vocabulário de elegibilidade', () => {
    // Protege contra erro de digitação: `condicoes.temPett` não filtraria
    // nada e o evento voltaria a aparecer sem pet, silenciosamente.
    const VOCABULARIO = new Set([
      'genero', 'faseVida', 'empregado', 'emEscola', 'emFaculdade', 'temParceiro',
      'temFilhos', 'dinheiroMinimo', 'dinheiroMaximo', 'flagsNecessarias',
      'flagsProibidas', 'saudeMinima', 'saudeMaxima', 'personalidade',
      'temPet', 'temConjuge', 'temIrmaos', 'temAmigos', 'temImovel', 'temVeiculo', 'temDivida'
    ]);

    for (const e of eventos) {
      for (const chave of Object.keys(e.condicoes ?? {})) {
        expect(VOCABULARIO.has(chave), `${e.id} declara condição desconhecida: ${chave}`).toBe(true);
      }
    }
  });
});
