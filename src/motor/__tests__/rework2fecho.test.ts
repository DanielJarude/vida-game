/**
 * REWORK 2 — fechamento: as seis pendências encontradas durante o desenvolvimento.
 *
 *   1. cursinho e estudo para concurso são de Estudos (fonte única);
 *   2. sem limite global de interações — e sem farm;
 *   3. "Pede atenção" não confunde parentesco com vínculo;
 *   4. a procura de trabalho não converge para uma ocupação;
 *   5. adolescente sem dinheiro em casa tem caminho de cuidado em saúde mental;
 *   (6. o bundle é verificado no build — ver o relatório.)
 */

import { describe, expect, it } from 'vitest';
import { nova, responderTudo, viver } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, opcoesDeCurso, type Acao } from '../acoes';
import { criarRng } from '../rng';
import { idade } from '../nucleo';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { criarPessoa, vincular } from '../pessoas';
import { DE_ESTUDOS, custoDaRotina } from '../sistemas/rotinas';
import { atividadesParaVoce, vagasParaVoce } from '../sistemas/relevancia';
import { emConstrucao } from '../sistemas/caminhosDeVida';
import { encaminhado } from '../sistemas/saude';
import { vinculoReal } from '../sistemas/vinculos';
import { sinaisSociais } from '../../ui/leitura';
import { curso } from '../dados/cursos';
import { areaQueMaisPesa, estimativaParaCurso, notasEsperadas } from '../sistemas/vestibular';
import { NOME_MATERIA } from '../sistemas/escola';

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const disp = (v: Vida, a: Acao) => disponibilidade(v, a);

function pessoa(i: number, semente = 300, genero: 'feminino' | 'masculino' = 'feminino'): Vida {
  let s = semente;
  let v = viver(nova({ semente: s, genero }), i);
  while (v.morte) v = viver(nova({ semente: ++s, genero }), i);
  v.momento = null; v.caminhos.pendente = undefined; v.anoAtual = { acoes: [] };
  for (const vin of Object.values(v.vinculos)) { vin.chamado = undefined; if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined; }
  return v;
}
function amiga(v: Vida, nome: string, s: number, prox = 60) {
  const p = criarPessoa(v, criarRng(s), { idade: idade(v), genero: 'feminino', municipioId: v.moradia.municipioId });
  p.nome = nome;
  const vin = vincular(v, p, { origem: 'escola', proximidade: prox, estagio: 'amigo', convivio: ['rotina'] });
  vin.confianca = 60; vin.tInicio = v.t - 60;
  return { p, vin };
}

describe('1. cursinho e concurso são de Estudos, com fonte única', () => {
  it('nenhum dos dois é sugerido como tempo livre; a ação é a mesma rotina, e Estudos/Trabalho leem o mesmo preparo', () => {
    expect(DE_ESTUDOS.has('cursinho')).toBe(true);
    expect(DE_ESTUDOS.has('estudar_concurso')).toBe(true);
    let v = pessoa(22, 301);
    v.trabalho.atual = undefined; v.educacao.matricula = undefined; v.rotinas = [];
    const { para, resto } = atividadesParaVoce(v);
    expect([...para.map(x => x.item.id), ...resto.map(m => m.id)]).not.toContain('estudar_concurso');
    v = executar(v, { tipo: 'rotina', id: 'estudar_concurso', ativa: true, nivel: 2 }).vida;
    const antes = v.caminhos.concurso.meses;
    v = responderTudo(avancarAno(v).vida);
    expect(v.caminhos.concurso.meses).toBeGreaterThan(antes);
    // Trabalho → "O que você está construindo" manda para Estudos (não para Tempo livre).
    const c = emConstrucao(v, disp).find(x => x.id === 'concurso')!;
    expect(c.proximo?.ir).not.toBe('tempo');
  });
});

describe('2 e 3. sem limite global de interações — e sem farm', () => {
  it('dá para estar com oito pessoas diferentes no mesmo ano (não há "momentos" contados)', () => {
    const v = pessoa(30, 310);
    const ids = ['Ana', 'Bia', 'Cris', 'Duda', 'Eva', 'Fê', 'Gabi', 'Helô'].map((n, k) => amiga(v, n, 400 + k).p.id);
    let x = v;
    for (const id of ids) {
      const a: Acao = { tipo: 'pessoa', pessoaId: id, interacao: 'tempo' };
      expect(tenta(x, a)).toBe(true);
      x = executar(x, a).vida;
    }
    expect(ids.every(id => x.vinculos[id].proximidade > v.vinculos[id].proximidade)).toBe(true);
  });

  it('a mesma coisa com a mesma pessoa, uma vez por ano; e cada coisa a mais com ela aproxima menos', () => {
    const v = pessoa(30, 311);
    const { p } = amiga(v, 'Ana', 500, 40);
    p.aperto = { tipo: 'fase', t: v.t };
    let x = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'tempo' }).vida;
    const primeira = x.vinculos[p.id].proximidade - v.vinculos[p.id].proximidade;
    expect(tenta(x, { tipo: 'pessoa', pessoaId: p.id, interacao: 'tempo' })).toBe(false);
    const ganhos: number[] = [];
    for (const i of ['conversar', 'apoiar', 'ligar', 'visitar']) {
      const a: Acao = { tipo: 'pessoa', pessoaId: p.id, interacao: i };
      if (!tenta(x, a)) continue;
      const era = x.vinculos[p.id].proximidade;
      x = executar(x, a).vida;
      ganhos.push(x.vinculos[p.id].proximidade - era);
    }
    expect(ganhos.length).toBeGreaterThanOrEqual(2);
    // Tudo o que dá para fazer com ela num ano rende, somado, pouco mais que a primeira vez (não se farma afeto).
    expect(ganhos.reduce((s, g) => s + g, 0)).toBeLessThan(primeira * 1.2 + 1);
  });

  it('o alívio de desabafar tem retorno decrescente no ano: dez desabafos não valem dez', () => {
    let v = pessoa(35, 312);
    v.mente.estresse = 70; v.mente.felicidade = 40;
    // Estado limpo: o que a vida sorteada já carregava de abalos do ano não entra na conta do retorno decrescente.
    v.mente.abalos = v.mente.abalos.filter(a => v.t - a.t > 12);
    v.luto = []; // um luto recente da vida sorteada manteria a necessidade de desabafar aberta (e o teste mediria o luto, não o retorno decrescente)
    const ids = Array.from({ length: 10 }, (_, k) => { const x = amiga(v, `Amiga${k}`, 600 + k, 70); x.vin.estagio = 'amigo_proximo'; x.vin.confianca = 75; return x.p.id; });
    const inicio = v.mente.estresse;
    let primeiro = 0;
    for (const [k, id] of ids.entries()) {
      const a: Acao = { tipo: 'pessoa', pessoaId: id, interacao: 'desabafar' };
      if (!tenta(v, a)) continue;
      const era = v.mente.estresse;
      v = executar(v, a).vida;
      if (k === 0) primeiro = era - v.mente.estresse;
    }
    const total = inicio - v.mente.estresse;
    expect(primeiro).toBeGreaterThan(0);
    expect(total).toBeLessThan(primeiro * 4);
  });

  it('uma iniciativa romântica de cada vez: quem já está vendo no que dá com alguém não começa outra no mesmo ano', () => {
    let achou = false;
    for (let s = 700; s < 740 && !achou; s++) {
      let v = pessoa(24, 313, 'masculino');
      v.eu.atracao = 'mulheres';
      // Cada tentativa, um dia diferente (o sorteio de "como a conversa caiu" varia; antes, era o mesmo nas 40).
      v.rng = s * 7919;
      const a = criarPessoa(v, criarRng(s), { idade: 24, genero: 'feminino', municipioId: v.moradia.municipioId }); a.atracao = 'homens'; a.parceiroId = undefined;
      const b = criarPessoa(v, criarRng(s + 1000), { idade: 24, genero: 'feminino', municipioId: v.moradia.municipioId }); b.atracao = 'homens'; b.parceiroId = undefined;
      vincular(v, a, { origem: 'trabalho', proximidade: 30, convivio: ['trabalho'] });
      vincular(v, b, { origem: 'trabalho', proximidade: 30, convivio: ['trabalho'] });
      v = executar(v, { tipo: 'pessoa', pessoaId: a.id, interacao: 'flertar' }).vida;
      if (!['interesse', 'saindo'].includes(v.vinculos[a.id].romance?.estagio ?? '')) continue;
      achou = true;
      expect(disponibilidade(v, { tipo: 'pessoa', pessoaId: b.id, interacao: 'flertar' }).motivo).toMatch(/vendo no que dá/);
    }
    expect(achou).toBe(true);
  });

  it('determinismo com muitas interações num ano', () => {
    const acoes = (v: Vida): Acao[] => (idade(v) === 25 ? Object.keys(v.vinculos).slice(0, 12).flatMap(id => [{ tipo: 'pessoa', pessoaId: id, interacao: 'tempo' } as Acao, { tipo: 'pessoa', pessoaId: id, interacao: 'conversar' } as Acao]) : []);
    expect(viver(nova({ semente: 314 }), 28, acoes)).toEqual(viver(nova({ semente: 314 }), 28, acoes));
    const v = viver(nova({ semente: 314 }), 28, acoes);
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
  });
});

describe('4. "Pede atenção": parentesco não é vínculo', () => {
  it('um pai que nunca esteve presente não pede atenção; a amiga próxima que sumiu, sim', () => {
    const v = pessoa(30, 320);
    const pai = criarPessoa(v, criarRng(1), { idade: 58, genero: 'masculino', municipioId: v.moradia.municipioId }); pai.nome = 'Álvaro';
    const vp = vincular(v, pai, { parentesco: 'pai', origem: 'familia', proximidade: 38, convivio: [] });
    vp.tInicio = v.t - 360; vp.tUltimoContato = v.t - 360; vp.historia = [];
    const primo = criarPessoa(v, criarRng(2), { idade: 33, genero: 'masculino', municipioId: 'manaus-am' }); primo.nome = 'Otávio';
    const vpr = vincular(v, primo, { parentesco: 'primo', origem: 'familia', proximidade: 30, convivio: [] }); vpr.tInicio = v.t - 360; vpr.tUltimoContato = v.t - 360;
    primo.aperto = { tipo: 'desemprego', t: v.t };
    const amigaP = criarPessoa(v, criarRng(3), { idade: 30, genero: 'feminino', municipioId: 'manaus-am' }); amigaP.nome = 'Íris';
    const va = vincular(v, amigaP, { origem: 'escola', proximidade: 70, estagio: 'amigo_proximo', convivio: [] });
    va.tInicio = v.t - 180; va.tUltimoContato = v.t - 48; va.historia = [{ t: v.t - 120, texto: 'Viraram amigos de verdade.', tipo: 'amizade', peso: 3 }];
    expect(vinculoReal(v, pai, vp)).toBe(false);
    expect(vinculoReal(v, primo, vpr)).toBe(false);
    expect(vinculoReal(v, amigaP, va)).toBe(true);
    const sinais = sinaisSociais(v).map(x => x.pessoaId);
    expect(sinais).not.toContain(pai.id);
    expect(sinais).not.toContain(primo.id);
    expect(sinais).toContain(amigaP.id);
    // E se o pai procurar você, aí sim ele pede atenção.
    vp.chamado = { tipo: 'reclamacao', t: v.t, texto: 'Álvaro mandou mensagem.' };
    expect(sinaisSociais(v).map(x => x.pessoaId)).toContain(pai.id);
  });
});

describe('5. a procura de trabalho não converge para uma ocupação', () => {
  it('sem trajetória, as vagas sugeridas são de famílias de carreira diferentes', () => {
    const v = pessoa(18, 330);
    v.trabalho.atual = undefined; v.trabalho.historico = []; v.trabalho.experiencia = {};
    const { para } = vagasParaVoce(v);
    const trilhas = new Set(para.map(x => x.item.oc.trilha));
    expect(trilhas.size).toBe(para.length);
  });

  it('quem segue as sugestões da tela chega aos 38 em ocupações variadas (nenhuma concentra um terço)', () => {
    const conta: Record<string, number> = {};
    let n = 0;
    for (let s = 1; s <= 24; s++) {
      const r = criarRng(s * 97);
      let v = nova({ semente: 900 + s * 7, genero: s % 2 ? 'feminino' : 'masculino', municipioId: ['recife-pe', 'sao-paulo-sp', 'belo-horizonte-mg', 'curitiba-pr'][s % 4] });
      const estuda = r.chance(0.5);
      while (!v.morte && idade(v) < 38) {
        const acs: Acao[] = [];
        if (estuda && idade(v) >= 17 && idade(v) <= 21 && !v.educacao.matricula) { acs.push({ tipo: 'enem' }); const ops = opcoesDeCurso(v).map((o, i) => ({ o, i })).filter(x => podeTentar(x.o.veredito) && (x.o.mensalidade < 900 || x.o.rede === 'publica')); if (ops.length) acs.push({ tipo: 'matricular', indice: r.pick(ops).i }); }
        if (idade(v) >= 18 && !v.trabalho.atual && !v.educacao.matricula) { const { para } = vagasParaVoce(v); if (para.length) acs.push({ tipo: 'candidatar', ocupacaoId: r.pick(para).item.oc.id }); }
        for (const a of acs) if (tenta(v, a)) v = responderTudo(executar(v, a).vida);
        v = responderTudo(avancarAno(v).vida);
      }
      if (v.morte || !v.trabalho.atual) continue;
      n++; conta[v.trabalho.atual.ocupacaoId] = (conta[v.trabalho.atual.ocupacaoId] ?? 0) + 1;
    }
    const maior = Math.max(...Object.values(conta));
    expect(n).toBeGreaterThan(10);
    expect(maior / n).toBeLessThan(1 / 3);
    expect(Object.keys(conta).length).toBeGreaterThanOrEqual(7);
  }, 60000);
});

describe('6. adolescente sem dinheiro em casa: caminho de cuidado em saúde mental', () => {
  function adolescente(i: number, s: number): Vida {
    const v = pessoa(i, s);
    v.origem.classe = 'vulneravel'; v.financas.conta = 0; v.financas.planoDeSaude = false;
    for (const p of Object.values(v.pessoas)) p.renda = 0;
    v.corpo.condicoes = [{ id: 'depressao', nome: 'depressão', tInicio: v.t - 12, cronica: true, gravidade: 2, tratando: false, diagnosticada: false }];
    v.mente.felicidade = 30; v.mente.estresse = 60;
    return v;
  }

  it('pedir ajuda não exige dinheiro: o posto dá nome, encaminha pelo SUS, e o acompanhamento é de graça', () => {
    let feito = false;
    for (let s = 340; s < 360 && !feito; s++) {
      let v = adolescente(15, s);
      expect(tenta(v, { tipo: 'cuidar', cuidado: 'consulta' })).toBe(true);
      const r = executar(v, { tipo: 'cuidar', cuidado: 'consulta' });
      v = r.vida;
      if (v.corpo.condicoes[0].diagnosticada !== true) continue;
      feito = true;
      expect(r.resultado).toMatch(/SUS/);
      expect(encaminhado(v)).toBe(true);
      expect(custoDaRotina(v, 'terapia', 1)).toBe(0);
      const terapia: Acao = { tipo: 'rotina', id: 'terapia', ativa: true, nivel: 1 };
      expect(tenta(v, terapia)).toBe(true);
      v = executar(v, terapia).vida;
      v = responderTudo(avancarAno(v).vida);
      expect(v.corpo.condicoes.find(c => c.id === 'depressao')?.tratando ?? true).toBe(true);
      expect(v.financas.conta).toBeGreaterThanOrEqual(0);
    }
    expect(feito).toBe(true);
  });

  it('aos 13 também dá para pedir ajuda (só com um sinal de saúde mental); humor baixo sozinho não vira diagnóstico', () => {
    const v = adolescente(13, 361);
    expect(tenta(v, { tipo: 'cuidar', cuidado: 'consulta' })).toBe(true);
    const sem = adolescente(13, 362);
    sem.corpo.condicoes = [];
    expect(tenta(sem, { tipo: 'cuidar', cuidado: 'consulta' })).toBe(false);
    // Humor baixo sem condição: a consulta de adulto não inventa diagnóstico.
    const adulta = pessoa(30, 363);
    adulta.corpo.condicoes = []; adulta.mente.felicidade = 25;
    const x = executar(adulta, { tipo: 'cuidar', cuidado: 'consulta' }).vida;
    expect(x.corpo.condicoes.some(c => c.id === 'depressao' || c.id === 'ansiedade')).toBe(false);
  });
});

describe('7. vestibular: a estimativa e a devolutiva falam da mesma área pela mesma conta', () => {
  it('objetivo → preparação → estimativa → prova → devolutiva: previsão e prova usam a mesma conta; quando divergem, a diferença é dita como o dia', () => {
    let v = pessoa(16, 370);
    v.educacao.basica = { etapa: 'medio', serie: 2, rede: 'publica', desempenho: 62, reprovacoes: 0 };
    v = executar(v, { tipo: 'objetivo_estudo', cursoId: 'medicina' }).vida;
    v = executar(v, { tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }).vida;
    v = responderTudo(avancarAno(v).vida);
    v.anoAtual = { acoes: [] };
    const med = curso('medicina');
    const est = estimativaParaCurso(v, med);
    expect(est.fraca).toBe(areaQueMaisPesa(notasEsperadas(v), med, est.corte));
    let iguais = 0, diferentes = 0;
    for (let s = 1; s <= 40; s++) {
      const x = structuredClone(v);
      x.rng = (s * 2654435761) >>> 0;
      const depois = executar(x, { tipo: 'enem' }).vida;
      const dev = depois.caminhos.devolutivas.slice(-1)[0];
      expect(dev.tipo).toBe('vestibular');
      // A previsão da devolutiva É a estimativa que a tela mostrava na véspera.
      expect(dev.fracaPrevista).toBe(est.fraca);
      if (dev.passou) continue;
      const nomeReal = NOME_MATERIA[dev.fraca!], nomePrev = NOME_MATERIA[dev.fracaPrevista!];
      if (dev.fraca === dev.fracaPrevista) {
        iguais++;
        expect(dev.texto).toMatch(/como a preparação indicava/);
      } else {
        diferentes++;
        expect(dev.texto).toContain(`nesta prova: ${nomeReal}`);
        expect(dev.texto).toContain(`continua sendo ${nomePrev}`);
        // E a tela, depois da prova, não contradiz em silêncio: menciona a área da prova e o motivo.
        const depoisEst = estimativaParaCurso(depois, med);
        expect(depoisEst.frase).toContain(nomeReal);
        expect(depoisEst.frase).toMatch(/foi o dia/);
      }
    }
    expect(iguais).toBeGreaterThan(0);
    expect(diferentes).toBeGreaterThan(0);
  });

  it('a área que mais pesa considera o peso do curso: ciências pesa três vezes em Medicina', () => {
    const med = curso('medicina');
    // Ciências 20 pontos abaixo de matemática ainda pesa mais, porque vale o triplo.
    expect(areaQueMaisPesa({ exatas: 600, linguagens: 640, ciencias: 620, humanas: 650 }, med, 745)).toBe('ciencias');
    expect(areaQueMaisPesa({ exatas: 450, linguagens: 700, ciencias: 700, humanas: 700 }, med, 745)).toBe('exatas');
  });
});
