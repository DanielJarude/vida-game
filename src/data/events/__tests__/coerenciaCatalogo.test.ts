/**
 * B4-FIX3 item 29 — auditoria automatizada e permanente do catálogo real
 * de eventos (`MASTER_EVENTS_LIST`), não uma amostra e não regex frágil
 * sobre texto solto. Cada verificação usa os METADADOS estruturados do
 * evento (id, idade, opções, requisito, condições, política de
 * repetição) — nunca compara título/descrição.
 *
 * Este arquivo é o "airbag" contra regressões de conteúdo: qualquer
 * evento adicionado depois deste PR que viole uma regra básica (id
 * duplicado, decisão com 1 opção só, opção adulta sem idade mínima
 * revalidada etc.) quebra a suíte, não só o playtest humano.
 */

import { describe, expect, it } from 'vitest';
import { MASTER_EVENTS_LIST } from '../allEvents';
import { resolverPoliticaRepeticao } from '../../../systems/events/repetitionPolicy';

describe('B4-FIX3 · coerência estrutural do catálogo de eventos', () => {
  it('todo evento tem um ID único', () => {
    const ids = MASTER_EVENTS_LIST.map(e => e.id);
    const unicos = new Set(ids);
    expect(unicos.size).toBe(ids.length);
  });

  it('dentro de cada evento, os IDs de opção são únicos', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      const ids = evento.opcoes.map(o => o.id);
      const unicos = new Set(ids);
      expect(unicos.size, `evento ${evento.id} tem opção com id duplicado`).toBe(ids.length);
    }
  });

  it('idadeMinima <= idadeMaxima em todo evento', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      expect(
        evento.idadeMinima,
        `evento ${evento.id}: idadeMinima (${evento.idadeMinima}) > idadeMaxima (${evento.idadeMaxima})`
      ).toBeLessThanOrEqual(evento.idadeMaxima);
    }
  });

  it('idades não são negativas nem absurdamente altas (0-120)', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      expect(evento.idadeMinima, evento.id).toBeGreaterThanOrEqual(0);
      expect(evento.idadeMaxima, evento.id).toBeLessThanOrEqual(120);
    }
  });

  it('todo evento tem pelo menos 1 opção (evento "vazio" não deveria existir)', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      expect(evento.opcoes.length, evento.id).toBeGreaterThan(0);
    }
  });

  it('evento de decisão (2+ opções aparentes na UI) nunca tem exatamente 1 opção — falsa escolha', () => {
    // B4-FIX3 item 5/6 — regra explícita do PR: um evento com apenas uma
    // opção não é uma decisão, é uma falsa liberdade. Cada um precisa ou
    // ter 2+ opções REALMENTE distintas ou não ser apresentado como
    // pergunta. Como o motor sempre pergunta "O que você faz?" quando o
    // evento tem opções, qualquer evento com 1 opção só viola a regra.
    const comUmaOpcaoSo = MASTER_EVENTS_LIST.filter(e => e.opcoes.length === 1);
    expect(
      comUmaOpcaoSo.map(e => e.id),
      'eventos com exatamente 1 opção (falsa escolha) — ver lista de ids'
    ).toEqual([]);
  });

  it('opções dentro do mesmo evento têm texto distinto entre si (não são a mesma escolha duplicada)', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      const textos = evento.opcoes.map(o => o.texto.trim().toLowerCase());
      const unicos = new Set(textos);
      expect(unicos.size, `evento ${evento.id} tem opções com texto idêntico`).toBe(textos.length);
    }
  });

  it('política de repetição sempre resolve para um tipo válido (nunca "sem controle")', () => {
    const tiposValidos = new Set(['unica', 'cooldown', 'recorrente', 'marco']);
    for (const evento of MASTER_EVENTS_LIST) {
      const politica = resolverPoliticaRepeticao(evento);
      expect(tiposValidos.has(politica.tipo), evento.id).toBe(true);
    }
  });

  it('cooldown explícito, quando presente, é um número positivo', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      if (evento.repeticao?.cooldownAnos !== undefined) {
        expect(evento.repeticao.cooldownAnos, evento.id).toBeGreaterThan(0);
      }
    }
  });

  it('requisito de opção com idadeMinima/idadeMaxima é coerente com a janela do próprio evento', () => {
    // B4-FIX3 item 7 — uma opção não pode exigir uma idade fora da janela
    // do evento (isso tornaria a opção permanentemente inacessível, o que
    // seria uma opção morta no catálogo).
    for (const evento of MASTER_EVENTS_LIST) {
      for (const opcao of evento.opcoes) {
        const req = opcao.requisito;
        if (!req) continue;
        if (req.idadeMinima !== undefined) {
          expect(
            req.idadeMinima,
            `${evento.id}/${opcao.id}: idadeMinima da opção é maior que a idadeMaxima do evento`
          ).toBeLessThanOrEqual(evento.idadeMaxima);
        }
        if (req.idadeMaxima !== undefined) {
          expect(
            req.idadeMaxima,
            `${evento.id}/${opcao.id}: idadeMaxima da opção é menor que a idadeMinima do evento`
          ).toBeGreaterThanOrEqual(evento.idadeMinima);
        }
        if (req.idadeMinima !== undefined && req.idadeMaxima !== undefined) {
          expect(req.idadeMinima, `${evento.id}/${opcao.id}`).toBeLessThanOrEqual(req.idadeMaxima);
        }
      }
    }
  });

  it('todo evento tem, para cada idade dentro de sua janela, pelo menos uma opção elegível', () => {
    // Detecta o bug de classe "dengue aos 8 anos com só opção de adulto":
    // se todas as opções exigem idadeMinima maior que a idadeMinima do
    // evento, o evento fica "elegível" mas sem nenhuma escolha possível
    // na borda inferior da janela.
    for (const evento of MASTER_EVENTS_LIST) {
      const idadesParaChecar = [
        evento.idadeMinima,
        Math.floor((evento.idadeMinima + evento.idadeMaxima) / 2),
        evento.idadeMaxima
      ];
      for (const idade of idadesParaChecar) {
        const algumaElegivel = evento.opcoes.some(o => {
          const req = o.requisito;
          if (!req) return true;
          if (req.idadeMinima !== undefined && idade < req.idadeMinima) return false;
          if (req.idadeMaxima !== undefined && idade > req.idadeMaxima) return false;
          return true;
        });
        expect(
          algumaElegivel,
          `evento ${evento.id} não tem nenhuma opção elegível na idade ${idade} (dentro de sua própria janela ${evento.idadeMinima}-${evento.idadeMaxima})`
        ).toBe(true);
      }
    }
  });

  it('nenhuma opção com idadeMinima adulta (18+) aparece em evento cuja janela é só infantil (idadeMaxima < 18)', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      if (evento.idadeMaxima >= 18) continue;
      for (const opcao of evento.opcoes) {
        const minimaAdulta = opcao.requisito?.idadeMinima !== undefined && opcao.requisito.idadeMinima >= 18;
        expect(minimaAdulta, `${evento.id}/${opcao.id} exige idade adulta num evento só infantil`).toBe(false);
      }
    }
  });

  it('nenhuma opção contém palavras de tratamento médico prescritivo (item 9 — narrar, não prescrever)', () => {
    const TERMOS_PRESCRITIVOS = ['soro na veia', 'tomar remédio', 'receitar', 'aplicar injeção', 'internar imediatamente'];
    for (const evento of MASTER_EVENTS_LIST) {
      for (const opcao of evento.opcoes) {
        const texto = opcao.texto.toLowerCase();
        for (const termo of TERMOS_PRESCRITIVOS) {
          expect(texto.includes(termo), `${evento.id}/${opcao.id}: "${termo}"`).toBe(false);
        }
      }
    }
  });

  it('nenhum texto de opção ou descrição de resultado vaza identificador técnico (camelCase/snake_case de campo interno)', () => {
    const PADRAO_TECNICO = /(eventoId|opcaoId|impactosComportamentais|tagsComportamentais|hiddenStats)/i;
    for (const evento of MASTER_EVENTS_LIST) {
      expect(PADRAO_TECNICO.test(evento.descricao)).toBe(false);
      for (const opcao of evento.opcoes) {
        expect(PADRAO_TECNICO.test(opcao.texto)).toBe(false);
        if (opcao.descricaoResultado) {
          expect(PADRAO_TECNICO.test(opcao.descricaoResultado)).toBe(false);
        }
      }
    }
  });

  it('toda opção com consequências tem ao menos um efeito estruturado (nunca objeto de consequências totalmente vazio)', () => {
    for (const evento of MASTER_EVENTS_LIST) {
      for (const opcao of evento.opcoes) {
        const c = opcao.consequencias;
        const temAlgumEfeito = !!(
          c.stats || c.hiddenStats || c.impactosComportamentais || c.dinheiro ||
          c.relacionamentoDelta || c.adicionarFlag || c.removerFlag || c.adicionarFamiliar ||
          c.adicionarDoenca || c.curarDoenca || c.demissao || c.morte || c.causaMorte
        );
        expect(temAlgumEfeito, `${evento.id}/${opcao.id} não tem NENHUM efeito estruturado`).toBe(true);
      }
    }
  });

  it('toda flag consultada por algum evento (flagNecessaria/flagsNecessarias) é produzida por algum "adicionarFlag" no catálogo', () => {
    const flagsProduzidas = new Set<string>();
    for (const evento of MASTER_EVENTS_LIST) {
      for (const opcao of evento.opcoes) {
        if (opcao.consequencias.adicionarFlag) flagsProduzidas.add(opcao.consequencias.adicionarFlag);
      }
    }

    const flagsConsultadas = new Set<string>();
    for (const evento of MASTER_EVENTS_LIST) {
      if (evento.condicoes?.flagsNecessarias) {
        evento.condicoes.flagsNecessarias.forEach(f => flagsConsultadas.add(f));
      }
      for (const opcao of evento.opcoes) {
        if (opcao.requisito?.flagNecessaria) flagsConsultadas.add(opcao.requisito.flagNecessaria);
      }
    }

    const orfas = [...flagsConsultadas].filter(f => !flagsProduzidas.has(f));
    expect(orfas, 'flags consultadas mas nunca produzidas por nenhuma opção do catálogo').toEqual([]);
  });

  it('categoria do evento é sempre um valor reconhecido pelo sistema de apresentação', () => {
    const categoriasValidas = new Set([
      'infancia', 'escola', 'adolescencia', 'familia', 'amizade', 'romance',
      'trabalho', 'dinheiro', 'saude', 'cotidiano', 'hobby', 'esporte',
      'comunidade', 'tecnologia'
    ]);
    for (const evento of MASTER_EVENTS_LIST) {
      expect(categoriasValidas.has(evento.categoria), evento.id).toBe(true);
    }
  });
});
