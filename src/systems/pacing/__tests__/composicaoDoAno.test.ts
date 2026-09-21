/**
 * F3-FIX · COMPOSIÇÃO DO ANO — marco não significa saturação.
 *
 * A regressão que originou este arquivo foi encontrada pela auditoria de
 * alcançabilidade, não por um bug report: SETE acontecimentos da faixa 0-2
 * nunca apareciam em 105 vidas, e dobrar a amostra para 210 não revelava
 * nenhum deles. A causa não era sorteio azarado, era estrutura — a faixa 0-2
 * tem dois anos jogáveis (idade 0 não existe no motor) e ambos estavam 100%
 * ocupados por marcos garantidos. O ano do marco simplesmente retornava cedo,
 * e o sorteio nunca rodava ali.
 *
 * O erro conceitual por trás disso é tratar como equivalentes duas coisas
 * diferentes:
 *
 *   DENSIDADE BIOGRÁFICA — o quanto o ano pesa na história da pessoa.
 *   INTERRUPÇÃO/ATENÇÃO  — o quanto o ano exige do jogador, em cliques.
 *
 * *Primeiros Passos* é densidade máxima com interrupção ZERO: acontece, é
 * narrado, e ninguém precisa clicar em nada. Tratá-lo como "ano cheio" fazia
 * um marco apagar o mundo ao redor dele — e no ano em que alguém dá os
 * primeiros passos, a família também recebe visita.
 *
 * A correção NÃO é uma exceção para bebês. O mesmo problema reapareceria em
 * formatura, casamento, nascimento, mudança e aposentadoria. Quem responde é
 * a taxonomia, via `taxonomiaPermiteComposicao`, e o teste (I) prova isso com
 * um marco adulto sintético que não existe no jogo.
 */

import { describe, expect, it, vi } from 'vitest';
import { executarPassagemDeAno } from '../../agingSystem';
import { definirPulsoDoAno, historicoDeRitmo, SATURACAO_ESTRUTURAL } from '../lifeRhythm';
import { criarPersonalidadeInicial } from '../../personalitySystem';
import { criarEstadoTeste } from '../../__tests__/fixtures';
import { criarCalendarioInicial } from '../../calendario/tipos';
import { definirFonteAleatoria, resetarFonteAleatoria } from '../../../utils/random';
import { MASTER_EVENTS_LIST } from '../../../data/events/allEvents';
import { classificacaoDoEvento } from '../../events/taxonomia';
import { construirResumoAnual } from '../../../presentation/outcomePresentation';
import { salvarJogo, carregarJogo } from '../../saveSystem';
import {
  taxonomiaConsomeCotaDeDecisao,
  taxonomiaInterrompe,
  taxonomiaPermiteComposicao,
  type EventOccurrence,
  type GameState,
  type LifeLogEntry,
  type TaxonomiaConteudo
} from '../../../types';

// ---------------------------------------------------------------------------
// Instrumentos
// ---------------------------------------------------------------------------

function lcg(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

interface AnoObservado {
  idade: number;
  marcoId: string | null;
  modais: number;
  ocorrencias: EventOccurrence[];
  logs: LifeLogEntry[];
  motivoRitmo: string;
}

/** Percorre uma vida pelo motor real SEM responder aos modais. */
function viver(semente: number, ateIdade: number): AnoObservado[] {
  definirFonteAleatoria(lcg(semente));
  const estado = criarEstadoTeste({ idade: 0 });
  let p = estado.personagem;
  let f = estado.familia;
  let ed = estado.educacao;
  let c = estado.carreira;
  let eco = estado.economia;
  const personalidade = criarPersonalidadeInicial();
  let disparados: string[] = [];
  let ocorrencias: EventOccurrence[] = [];
  let calendario = criarCalendarioInicial();
  const anos: AnoObservado[] = [];

  while (p.idade < ateIdade) {
    const r = executarPassagemDeAno(p, f, ed, c, eco, disparados, personalidade, ocorrencias, calendario);
    calendario = r.calendario;
    p = r.personagemAtualizado;
    f = r.familiaAtualizada;
    ed = r.educacaoAtualizada;
    c = r.carreiraAtualizada;
    eco = r.economiaAtualizada;
    anos.push({
      idade: p.idade,
      marcoId: r.marcoDoAno?.id ?? null,
      modais: r.eventoDisparado ? 1 : 0,
      ocorrencias: r.ocorrenciasDoAno,
      logs: r.novosLogs,
      motivoRitmo: r.ritmo.motivo
    });
    for (const oc of r.ocorrenciasDoAno) {
      disparados = [...disparados, oc.eventId];
      ocorrencias = [...ocorrencias, oc];
    }
    if (r.morreu) break;
  }
  resetarFonteAleatoria();
  return anos;
}

const SEMENTES = [3, 17, 101, 2024, 55501, 7, 4242, 99991];

/** Todos os anos de todas as sementes, achatados. */
const TODOS = SEMENTES.flatMap(s => viver(s, 80));

const taxonomiaDe = (id: string): TaxonomiaConteudo => {
  const evento = MASTER_EVENTS_LIST.find(e => e.id === id);
  return evento ? classificacaoDoEvento(evento) : 'acontecimento_puro';
};

// ---------------------------------------------------------------------------
// (A) e (C) — marco não tranca o ano
// ---------------------------------------------------------------------------

describe('F3-FIX · marco garantido não satura o ano por definição', () => {
  it('(A) marco SEM escolha não impede automaticamente um acontecimento compatível', () => {
    const anosDeMarcoTestemunhado = TODOS.filter(
      a => a.marcoId !== null && a.ocorrencias.some(o => taxonomiaDe(o.eventId) === 'marco_testemunhado')
    );
    expect(anosDeMarcoTestemunhado.length).toBeGreaterThan(0);

    const comCompanhia = anosDeMarcoTestemunhado.filter(a => a.ocorrencias.length > 1);
    expect(
      comCompanhia.length,
      'nenhum marco testemunhado jamais aceitou companhia — a porta continua trancada'
    ).toBeGreaterThan(0);
  });

  it('(C) marco com escolha biográfica não bloqueia todo acontecimento compatível', () => {
    const anosDeEscolhaBiografica = TODOS.filter(
      a => a.marcoId !== null && a.ocorrencias.some(o => taxonomiaDe(o.eventId) === 'escolha_biografica')
    );
    expect(anosDeEscolhaBiografica.length).toBeGreaterThan(0);

    const comCompanhia = anosDeEscolhaBiografica.filter(a => a.ocorrencias.length > 1);
    expect(comCompanhia.length).toBeGreaterThan(0);
  });

  it('a composição é permitida por TAXONOMIA, e acontecimento/decisão não compõem', () => {
    // O predicado é a regra inteira: quem não é marco fecha o ano sozinho,
    // senão o ano viraria uma lista de coisas.
    expect(taxonomiaPermiteComposicao('marco_testemunhado')).toBe(true);
    expect(taxonomiaPermiteComposicao('escolha_biografica')).toBe(true);
    expect(taxonomiaPermiteComposicao('acontecimento_puro')).toBe(false);
    expect(taxonomiaPermiteComposicao('decisao_comportamental')).toBe(false);

    // E na prática: nenhum ano sem marco jamais registrou dois conteúdos.
    const semMarcoMasComDois = TODOS.filter(a => a.marcoId === null && a.ocorrencias.length > 1);
    expect(semMarcoMasComDois).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// (B) e (D) — o orçamento de decisão continua intacto
// ---------------------------------------------------------------------------

describe('F3-FIX · o orçamento de decisão contextual não foi afrouxado', () => {
  it('(B) marco com escolha biográfica não consome cota de decisão contextual', () => {
    expect(taxonomiaConsomeCotaDeDecisao('escolha_biografica')).toBe(false);
    const lido = historicoDeRitmo([
      { idade: 2, natureza: 'decisao', taxonomia: 'escolha_biografica' }
    ]);
    expect(lido[0].consomeCota).toBe(false);
  });

  it('(D) decisão contextual continua respeitando teto e fadiga', () => {
    // Teto: a faixa 3-5 admite UMA decisão contextual em janela de 5 anos.
    const comUmaDecisao = historicoDeRitmo([
      { idade: 3, natureza: 'decisao', taxonomia: 'decisao_comportamental' }
    ]);
    const rng = lcg(31337);
    let decisoes = 0;
    for (let i = 0; i < 300; i++) {
      const d = definirPulsoDoAno(
        { idade: 4, historico: comUmaDecisao, densidadeEstrutural: 0 },
        rng
      );
      if (d.pulso === 'decisao') decisoes++;
    }
    expect(decisoes, 'o teto de decisões da faixa 3-5 deixou de valer').toBe(0);

    // Fadiga: decidir no ano anterior reduz a chance no ano seguinte.
    const contar = (historico: ReturnType<typeof historicoDeRitmo>) => {
      const r = lcg(5150);
      let n = 0;
      for (let i = 0; i < 600; i++) {
        if (definirPulsoDoAno({ idade: 30, historico, densidadeEstrutural: 0 }, r).pulso === 'decisao') n++;
      }
      return n;
    };
    const semNada = contar([]);
    const decidiuOntem = contar(
      historicoDeRitmo([{ idade: 29, natureza: 'decisao', taxonomia: 'decisao_comportamental' }])
    );
    expect(decidiuOntem).toBeLessThan(semNada);
  });

  it('o ano do marco nunca abre mais de UM modal — densidade não é clique', () => {
    for (const ano of TODOS) {
      expect(
        ano.modais,
        `idade ${ano.idade}: ${ano.modais} modais no mesmo ano`
      ).toBeLessThanOrEqual(1);
    }
    // E um ano com dois conteúdos continua tendo no máximo uma interrupção.
    for (const ano of TODOS.filter(a => a.ocorrencias.length > 1)) {
      const interrupcoes = ano.ocorrencias.filter(o => taxonomiaInterrompe(taxonomiaDe(o.eventId))).length;
      expect(interrupcoes, `idade ${ano.idade}`).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// (E) e (F) — o que nunca satura
// ---------------------------------------------------------------------------

describe('F3-FIX · textura e pequena memória não saturam', () => {
  const contarPulsos = (densidade: number) => {
    const rng = lcg(909);
    let silencios = 0;
    for (let i = 0; i < 400; i++) {
      if (definirPulsoDoAno({ idade: 30, historico: [], densidadeEstrutural: densidade }, rng).pulso === 'silencio') {
        silencios++;
      }
    }
    return silencios;
  };

  it('(E) textura não conta para a saturação do ano', () => {
    // A saturação lê densidade estrutural, e textura nunca entra nela.
    const semTextura = contarPulsos(0);
    expect(semTextura).toBeLessThan(400);
    // Já a densidade real satura por regra dura.
    expect(contarPulsos(SATURACAO_ESTRUTURAL)).toBe(400);

    // Nenhum log de textura aparece como densidade em ano nenhum: se textura
    // contasse, anos de pura rotina fechariam sozinhos.
    const anosSoTextura = TODOS.filter(
      a => a.logs.length > 0 && a.logs.every(l => l.relevancia === 'textura')
    );
    for (const ano of anosSoTextura) {
      expect(/ano saturado/.test(ano.motivoRitmo), `idade ${ano.idade}`).toBe(false);
    }
  });

  it('(F) pequena memória não satura nem vira ocorrência', () => {
    // Pequena memória só existe em ano que terminaria vazio, é textura, e
    // nunca entra no histórico de ocorrências (não tem evento por trás).
    const anosComMemoria = TODOS.filter(
      a => a.logs.some(l => l.relevancia === 'textura') && a.ocorrencias.length === 0
    );
    expect(anosComMemoria.length).toBeGreaterThan(0);
    for (const ano of anosComMemoria) {
      expect(ano.modais).toBe(0);
      expect(ano.ocorrencias).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// (G) — ordem na Linha da Vida
// ---------------------------------------------------------------------------

describe('F3-FIX · dois conteúdos coexistentes na Linha da Vida', () => {
  it('(G) o marco aparece ANTES do acontecimento que o acompanha', () => {
    const anosCompostos = TODOS.filter(a => a.ocorrencias.length > 1);
    expect(anosCompostos.length).toBeGreaterThan(0);

    for (const ano of anosCompostos) {
      // A primeira ocorrência do ano é sempre o marco: ele é o conteúdo
      // principal, e é o que a Linha da Vida deve apresentar primeiro.
      const [primeira, ...resto] = ano.ocorrencias;
      expect(taxonomiaPermiteComposicao(taxonomiaDe(primeira.eventId)), `idade ${ano.idade}`).toBe(true);
      for (const seguinte of resto) {
        expect(taxonomiaDe(seguinte.eventId), `idade ${ano.idade}`).toBe('acontecimento_puro');
      }

      // E o log de relevância 'marco' precede os demais no texto do ano.
      const iMarco = ano.logs.findIndex(l => l.relevancia === 'marco');
      const iNormal = ano.logs.findIndex(l => l.relevancia === 'normal');
      if (iMarco >= 0 && iNormal >= 0) {
        expect(iMarco, `idade ${ano.idade}: marco depois do acompanhante`).toBeLessThan(iNormal);
      }
    }
  });

  it('o resumo anual mostra os dois sem duplicar', () => {
    const ano = TODOS.find(a => a.ocorrencias.length > 1)!;
    const resumo = construirResumoAnual(ano.idade, 2000 + ano.idade, ano.logs);
    expect(resumo.silencioso).toBe(false);
    const textos = resumo.itens.map(e => e.texto);
    expect(new Set(textos).size, 'o resumo anual repetiu uma entrada').toBe(textos.length);
  });
});

// ---------------------------------------------------------------------------
// (H) — save/reload
// ---------------------------------------------------------------------------

describe('F3-FIX · persistência de um ano com dois conteúdos', () => {
  it('(H) save/reload preserva ambas as ocorrências, sem duplicar', () => {
    const anoComposto = TODOS.find(a => a.ocorrencias.length > 1)!;
    expect(anoComposto.ocorrencias.length).toBe(2);

    const base = criarEstadoTeste({ idade: anoComposto.idade });
    const estado: GameState = {
      personagem: base.personagem,
      familia: base.familia,
      educacao: base.educacao,
      carreira: base.carreira,
      economia: base.economia,
      timeline: anoComposto.logs,
      personalidade: criarPersonalidadeInicial(),
      historicoEventosDisparados: anoComposto.ocorrencias.map(o => o.eventId),
      historicoOcorrenciasEventos: anoComposto.ocorrencias,
      eventoAtivo: null,
      acoesRealizadasAno: [],
      versao: 5,
      emJogo: true,
      morto: false
    } as GameState;

    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear()
    });

    salvarJogo(estado);
    const lido = carregarJogo();
    vi.unstubAllGlobals();

    expect(lido).not.toBeNull();
    const recarregadas = lido!.historicoOcorrenciasEventos ?? [];
    expect(recarregadas).toHaveLength(2);
    expect(recarregadas.map(o => o.eventId)).toEqual(
      anoComposto.ocorrencias.map(o => o.eventId)
    );
    // As duas continuam distinguíveis depois do reload.
    expect(recarregadas[0].taxonomia).toBe(taxonomiaDe(anoComposto.ocorrencias[0].eventId));
    expect(recarregadas[1].taxonomia).toBe('acontecimento_puro');
    // E o histórico de ids não ganhou repetição no caminho.
    expect(lido!.historicoEventosDisparados).toEqual(anoComposto.ocorrencias.map(o => o.eventId));
  });
});

// ---------------------------------------------------------------------------
// (I) e (J) — a regra é geral, e não conhece ids
// ---------------------------------------------------------------------------

describe('F3-FIX · a regra vale fora da faixa 0-2', () => {
  it('(I) um marco adulto sintético compõe exatamente como os de bebê', () => {
    // Nenhum marco adulto existe ainda no catálogo — formatura, casamento e
    // aposentadoria virão em fases futuras. Este teste prova, sem esperar por
    // elas, que a regra não tem nada de infantil: ela responde à taxonomia,
    // e a taxonomia não sabe a idade de ninguém.
    const marcoAdultoSintetico: TaxonomiaConteudo = 'marco_testemunhado';
    const escolhaAdultaSintetica: TaxonomiaConteudo = 'escolha_biografica';

    for (const taxonomia of [marcoAdultoSintetico, escolhaAdultaSintetica]) {
      expect(taxonomiaPermiteComposicao(taxonomia)).toBe(true);
      expect(taxonomiaConsomeCotaDeDecisao(taxonomia)).toBe(false);
    }

    // E o ritmo de uma faixa adulta se comporta igual: um marco no histórico
    // não derruba a capacidade de decisão do ano seguinte.
    const contarDecisoes = (historico: ReturnType<typeof historicoDeRitmo>) => {
      const r = lcg(2718);
      let n = 0;
      for (let i = 0; i < 500; i++) {
        if (definirPulsoDoAno({ idade: 45, historico, densidadeEstrutural: 0 }, r).pulso === 'decisao') n++;
      }
      return n;
    };
    const comAcontecimento = contarDecisoes(
      historicoDeRitmo([{ idade: 44, natureza: 'acontecimento', taxonomia: 'acontecimento_puro' }])
    );
    const comMarcoAdulto = contarDecisoes(
      historicoDeRitmo([{ idade: 44, natureza: 'acontecimento', taxonomia: marcoAdultoSintetico }])
    );
    const comEscolhaAdulta = contarDecisoes(
      historicoDeRitmo([{ idade: 44, natureza: 'decisao', taxonomia: escolhaAdultaSintetica }])
    );
    expect(comAcontecimento).toBeGreaterThan(0);
    expect(comMarcoAdulto).toBe(comAcontecimento);
    expect(comEscolhaAdulta).toBe(comAcontecimento);
  });

  it('(J) nenhuma regra desta correção depende dos ids dos marcos de bebê', () => {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');

    const IDS_PROIBIDOS = ['bb_primeira_palavra', 'inf_primeiros_passos'];
    const raizes = ['src/systems', 'src/hooks', 'src/presentation', 'src/components'];
    const culpados: string[] = [];

    const varrer = (dir: string) => {
      for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const completo = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
          if (entrada.name === '__tests__') continue;
          varrer(completo);
          continue;
        }
        if (!/\.tsx?$/.test(entrada.name)) continue;
        const codigo = fs
          .readFileSync(completo, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '');
        if (IDS_PROIBIDOS.some(id => codigo.includes(id))) culpados.push(completo);
      }
    };
    for (const raiz of raizes) varrer(raiz);

    expect(culpados, `id de conteúdo usado como regra em: ${culpados.join(', ')}`).toEqual([]);

    // E nenhuma regra pergunta a idade para decidir composição: a única
    // pergunta é a taxonomia.
    const fonte = fs.readFileSync('src/systems/agingSystem.ts', 'utf8');
    const trecho = fonte.slice(
      fonte.indexOf('const acontecimentoDeCompanhia'),
      fonte.indexOf('const instanteAgora')
    );
    const codigoDoTrecho = trecho
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(/idade\s*[<>=]/.test(codigoDoTrecho), 'a composição passou a olhar idade').toBe(false);
  });
});
