/**
 * REWORK 9.7 — Auditoria geral: reproduções e invariantes.
 *
 * Fase A — os bugs relatados:
 *   EDU-04  a "nota" que crescia com os anos: o boletim escrevia o domínio (o que se sabe, 0..100, que cresce com a vida)
 *           na coluna da nota. Agora a nota de cada matéria existe no motor, é do ano e fica na escala do país.
 *   SAU-01  Saúde nunca chegava a 100: nascimento limitado a 99 e as referências da juventude (90/84) seguravam o melhor
 *           caso em 96–99.
 *   FUT-02  o futebol depois dos 20: pedir teste só até os 17; a porta amadora fechava aos 24 e nunca reabria para o
 *           ex-profissional; o adulto aprendia a 35% aos 30.
 *   FUT-01  o campeão da Série B que ficava na Série B: corrigido no REWORK 9; aqui, o invariante de oito temporadas com
 *           save/load e o nome da competição pelo país do clube.
 *   SOC-01  o salto de seguidores sem causa: o impulso da exposição era um número absoluto, sem relação com a conta.
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { nova, viver, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar } from '../acoes';
import { idade, transacao } from '../nucleo';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { fatoresSaude } from '../sistemas/estado';
import { notaDoDesempenho, notaNaEscala, notasDoAno, escalaDeNotas } from '../sistemas/escola';
import { mediaEscolar } from '../sistemas/frentes';
import { exposicaoDoAno, marcosDoPeriodo, processarRedes, publicoDoNome } from '../sistemas/redes';
import { contaAtiva, fecharBalanco } from '../sistemas/redesBase';
import { IDADE_AMADOR, fatorDaIdadeAmadora } from '../sistemas/esporte';
import { competicaoDe } from '../sistemas/palmares';
import { perfilDoPais } from '../mundo/registro';

const resolver = (v: Vida): Vida => {
  for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
    const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0];
    v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
  }
  return transacao(v, x => { x.momento = null; }).vida;
};

/* ================================================================ EDU-04 */

describe('EDU-04 · a nota e o conhecimento são variáveis diferentes', () => {
  it('a nota do desempenho fica na escala 0..10 em todo o domínio do desempenho (5..100) e nunca passa dela', () => {
    for (let d = -20; d <= 140; d += 1) {
      const n = notaDoDesempenho(d);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(10);
    }
    expect(notaDoDesempenho(40)).toBe(5);
    expect(notaDoDesempenho(50)).toBe(6);
  });

  it('vidas inteiras na escola: toda nota de matéria em 0..10; o domínio cresce, a nota não cresce sozinha; sobe e cai', () => {
    let subiu = 0, caiu = 0, registros = 0;
    const porIdade: Record<number, number[]> = {};
    for (let s = 0; s < 6; s++) {
      let v = nova({ semente: 9700 + s * 31, genero: s % 2 ? 'masculino' : 'feminino' });
      let anterior: number | undefined;
      while (!v.morte && idade(v) < 18) {
        v = resolver(avancarAno(v).vida);
        const b = v.educacao.basica;
        if (!b?.notas) continue;
        const ns = Object.values(b.notas) as number[];
        for (const n of ns) { registros++; expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThanOrEqual(10); }
        const media = ns.reduce((a, x) => a + x, 0) / ns.length;
        (porIdade[idade(v)] ??= []).push(media);
        // o boletim do motor lê o desempenho do ano, não o domínio (que aos 15 já passa de 30)
        if (idade(v) >= 14) expect(mediaEscolar(v)).toBeGreaterThan(10);
        if (anterior !== undefined) { if (media > anterior + 0.2) subiu++; if (media < anterior - 0.2) caiu++; }
        anterior = media;
      }
    }
    expect(registros).toBeGreaterThan(100);
    expect(subiu).toBeGreaterThan(3);
    expect(caiu).toBeGreaterThan(3);
    // a média das notas aos 16–17 não é a média aos 7–8 multiplicada (no máximo uns pontos acima, por dedicação/estímulo)
    const m = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
    const cedo = m([...(porIdade[7] ?? []), ...(porIdade[8] ?? [])]);
    const tarde = m([...(porIdade[16] ?? []), ...(porIdade[17] ?? [])]);
    expect(Math.abs(tarde - cedo)).toBeLessThan(2);
  });

  it('a matéria forte tira mais que a fraca no mesmo ano, sem passar de ±2 pontos da média', () => {
    const v = transacao(viverAte(nova({ semente: 77 }), 13), x => {
      x.caminhos.frentes.exatas!.habilidade = 50; x.caminhos.frentes.linguagens!.habilidade = 20;
    }).vida;
    const n = notasDoAno(v, 60);
    expect(n.exatas!).toBeGreaterThan(n.linguagens!);
    expect(n.exatas! - notaDoDesempenho(60)).toBeLessThanOrEqual(2.6);
    expect(notaDoDesempenho(60) - n.linguagens!).toBeLessThanOrEqual(2.6);
  });

  it('a escala é do país: 0–10 no Brasil, 0–20 em Portugal, percentual nos EUA — e a conversão nunca passa do máximo', () => {
    const br = nova({ semente: 5 });
    expect(escalaDeNotas(br)).toEqual({ max: 10, aprovacao: 5, casas: 1 });
    for (const [pais, max] of [['PT', 20], ['FR', 20], ['US', 100], ['CA', 100], ['JP', 10]] as const) expect(perfilDoPais(pais).educacao.notas?.max ?? 10).toBe(max);
    expect(notaNaEscala(br, 12)).toBe(10);
  });

  it('save antigo sem notas continua carregando; as notas aparecem no próximo ano letivo', () => {
    let v = viverAte(nova({ semente: 21 }), 9);
    v = transacao(v, x => { if (x.educacao.basica) x.educacao.basica.notas = undefined; }).vida;
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo).toBe('ok');
    if (l.tipo !== 'ok') return;
    const w = resolver(avancarAno(l.vida).vida);
    if (w.educacao.basica) expect(Object.keys(w.educacao.basica.notas ?? {}).length).toBeGreaterThan(0);
  });
});

/* ================================================================ SAU-01 */

describe('SAU-01 · Saúde 100 quando a condição justifica — e nunca acima', () => {
  it('a juventude saudável, ativa e de constituição forte tende a 100; a comum fica abaixo', () => {
    const forte = transacao(adulto(20, { semente: 3 }), x => {
      x.corpo.saude = 100; x.corpo.forma = 95; x.corpo.condicoes = []; x.mente.estresse = 20; x.mente.felicidade = 80;
      x.corpo.habitos.fuma = false; x.corpo.habitos.bebe = 'nao' as never;
      (x.predisposicoes ??= {} as never).saude = 1;
    }).vida;
    const deriva = fatoresSaude(forte).reduce((s, f) => s + f.efeito, 0);
    // em 100 a deriva fica perto do zero (antes: −2,0 por ano, sempre para baixo)
    expect(deriva).toBeGreaterThan(-0.8);
    const comum = transacao(forte, x => { x.corpo.forma = 45; (x.predisposicoes as never as { saude: number }).saude = 0; }).vida;
    expect(fatoresSaude(comum).reduce((s, f) => s + f.efeito, 0)).toBeLessThan(-1);
  });

  it('nascer com 100 é possível (raro) e a saúde nunca passa de 100 numa vida inteira', () => {
    let v = transacao(nova({ semente: 8, atributos: { saude: 100, fisico: 90, felicidade: 80, beleza: 50, inteligencia: 50 } }), x => { x.momento = null; }).vida;
    expect(v.corpo.saude).toBe(100);
    for (let k = 0; k < 40 && !v.morte; k++) {
      v = resolver(avancarAno(v).vida);
      expect(v.corpo.saude).toBeLessThanOrEqual(100);
      expect(v.corpo.saude).toBeGreaterThanOrEqual(0);
    }
  });

  it('doença ativa e lesão continuam pesando: a condição puxa a deriva para baixo', () => {
    const sao = transacao(adulto(30, { semente: 4 }), x => { x.corpo.saude = 90; x.corpo.condicoes = []; }).vida;
    const doente = transacao(sao, x => { x.corpo.condicoes = [{ id: 'diabetes', nome: 'diabetes', tInicio: x.t, cronica: true, gravidade: 2, tratando: false }]; }).vida;
    const d0 = fatoresSaude(sao).reduce((s, f) => s + f.efeito, 0);
    const d1 = fatoresSaude(doente).reduce((s, f) => s + f.efeito, 0);
    expect(d1).toBeLessThan(d0);
  });
});

/* ================================================================ FUT-02 */

function jogadorAdulto(i: number, tecnica: number, extra?: (x: Vida) => void, semente = 31): Vida {
  return transacao(adulto(i, { semente, genero: 'masculino' }), x => {
    x.trabalho.atual = undefined;
    x.rotinas = x.rotinas.filter(r => r.id !== 'futebol');
    x.rotinas.push({ id: 'futebol', tInicio: x.t - 60, nivel: 2 });
    x.caminhos.frentes.futebol = { interesse: 90, meses: 180, habilidade: tecnica, tInicio: x.t - 180, tUltimo: x.t, retomadas: 0, auge: tecnica };
    x.corpo.forma = 75;
    extra?.(x);
  }).vida;
}
const pedir = { tipo: 'perseguir', oque: 'pedir_teste', valor: 'futebol' } as const;

describe('FUT-02 · o futebol depois dos 20', () => {
  it('aos 22 e aos 27, quem joga no nível do estadual pode pedir o teste num time adulto (antes: bloqueado pela idade)', () => {
    for (const i of [22, 27]) {
      const v = jogadorAdulto(i, 78);
      const d = disponibilidade(v, pedir);
      expect(podeTentar(d), `${i}: ${d.motivo}`).toBe(true);
    }
  });

  it('a régua é a técnica, não a idade: técnica baixa é barrada pelo nível (e o motivo diz isso)', () => {
    const d = disponibilidade(jogadorAdulto(23, 40), pedir);
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/técnica|nível/i);
    expect(d.motivo).not.toMatch(/janela das bases/);
  });

  it('depois de 30 o teste não existe; o futebol segue no amador', () => {
    const d = disponibilidade(jogadorAdulto(IDADE_AMADOR[1] + 1, 82), pedir);
    expect(podeTentar(d)).toBe(false);
    expect(d.motivo).toMatch(/amador/);
  });

  it('o pedido abre o teste no time de cima de um clube pequeno, e passar leva ao contrato', () => {
    let passou = 0, testes = 0;
    for (let s = 0; s < 12; s++) {
      let v = jogadorAdulto(23, 76, undefined, 300 + s * 7);
      v = executar(v, pedir).vida;
      testes++;
      for (let k = 0; k < 6 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida;
      if (v.caminhos.esporte?.origem === 'amador') passou++;
    }
    expect(passou).toBeGreaterThan(0);
    expect(passou).toBeLessThan(testes);
  });

  it('a porta amadora estreita com a idade, sem fechar de uma vez', () => {
    expect(fatorDaIdadeAmadora(22)).toBe(1);
    expect(fatorDaIdadeAmadora(27)).toBeLessThan(1);
    expect(fatorDaIdadeAmadora(30)).toBeGreaterThan(0);
  });

  it('o ex-profissional sem clube volta a poder ser visto (antes, `atleta_profissional` fechava a porta para sempre)', () => {
    const v = jogadorAdulto(25, 80, x => {
      x.fatos['atleta_profissional'] = x.t - 24;
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'encerrada', clube: 'Remo', nivel: 2, tInicio: x.t - 72, tFase: x.t - 12, tFim: x.t - 12, motivoFim: 'sem_contrato', lesoes: 0, municipioId: 'belem-pa' } as never;
    });
    expect(podeTentar(disponibilidade(v, pedir))).toBe(true);
  });

  it('o profissional aos 19 continua até os 30 (a carreira não termina por idade aos 20)', () => {
    let v = transacao(adulto(19, { municipioId: 'belem-pa', semente: 12, genero: 'masculino' }), x => {
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Remo', nivel: 3, tInicio: x.t - 24, tFase: x.t - 6, lesoes: 0, municipioId: 'belem-pa', reputacao: 55, espaco: 'titular', contratoAte: x.t + 48, posicao: 'meia', temporadas: [] };
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Remo', contrato: 'clt', salario: 15000, tInicio: x.t - 6, desempenho: 70, municipioId: 'belem-pa', carga: 'integral' };
      x.caminhos.frentes.futebol = { interesse: 90, meses: 200, habilidade: 84, tInicio: x.t - 200, tUltimo: x.t, retomadas: 0, auge: 84 };
      x.rotinas = x.rotinas.filter(r => r.id !== 'futebol');
    }).vida;
    let temporadas = 0;
    while (!v.morte && idade(v) < 30) { v = resolver(avancarAno(v).vida); if (v.caminhos.esporte?.fase === 'profissional') temporadas++; }
    expect(temporadas).toBeGreaterThanOrEqual(8);
  }, 400000);
});

/* ================================================================ FUT-01 */

describe('FUT-01 · acesso e rebaixamento, oito temporadas com save/load', () => {
  it('cada temporada seguinte é na divisão da anterior ±1 conforme o acesso/rebaixamento registrado; top 4 da Série B sobe', () => {
    let problemas = 0, pares = 0;
    for (let s = 1; s <= 3; s++) {
      let v: Vida = transacao(adulto(22, { municipioId: 'belem-pa', semente: s }), x => {
        x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Remo', nivel: 3, tInicio: x.t - 60, tFase: x.t - 48, lesoes: 0, municipioId: 'belem-pa', reputacao: 50, espaco: 'titular', contratoAte: x.t + 120, posicao: 'meia', temporadas: [] };
        x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Remo', contrato: 'clt', salario: 20000, tInicio: x.t - 48, desempenho: 70, municipioId: 'belem-pa', carga: 'integral' };
        x.caminhos.frentes.futebol = { interesse: 90, meses: 200, habilidade: 92, tInicio: x.t - 200, tUltimo: x.t, retomadas: 0, auge: 92 };
      }).vida;
      for (let k = 0; k < 8 && !v.morte; k++) {
        v = avancarAno(v).vida;
        for (let j = 0; j < 12 && v.momento && !v.morte; j++) {
          const ops = v.momento.opcoes.filter(o => !o.bloqueio);
          const op = ops.find(o => /fic|recus|não|nao|perman/i.test(o.texto ?? o.id)) ?? ops[ops.length - 1] ?? v.momento.opcoes[0];
          v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida;
        }
        const l = interpretar(JSON.stringify(transacao(v, x => { x.momento = null; }).vida));
        expect(l.tipo).toBe('ok');
        if (l.tipo === 'ok') v = l.vida;
      }
      const ts = v.caminhos.esporte?.temporadas ?? [];
      const pal = v.caminhos.palmares ?? [];
      for (let i = 1; i < ts.length; i++) {
        const a = ts[i - 1], b = ts[i];
        if (a.clube !== b.clube || a.emprestado) continue;
        pares++;
        const sub = pal.some(c => c.tipo === 'acesso' && c.ano === a.ano), cai = pal.some(c => c.tipo === 'rebaixamento' && c.ano === a.ano);
        if (b.nivel !== a.nivel + (sub ? 1 : cai ? -1 : 0)) problemas++;
        if (a.colocacao <= 4 && a.nivel >= 2 && a.nivel < 4 && !sub) problemas++;
      }
    }
    expect(pares).toBeGreaterThan(5);
    expect(problemas).toBe(0);
  }, 400000);

  it('o nome da competição é o do país do clube', () => {
    expect(competicaoDe('futebol', 3, 'BR')).toMatch(/Série B/);
    expect(competicaoDe('futebol', 3, 'PT')).not.toMatch(/Série B/);
  });
});

/* ================================================================ SOC-01 */

describe('SOC-01 · seguidores que chegam por uma causa identificável', () => {
  it('sem acontecimento público, o impulso do nome cabe no tamanho da conta (o salto 40 mil → 300 mil não acontece mais)', () => {
    const sem = exposicaoDoAno('instagram', 40000, 64, 83, 0, 0.5, false);
    // o que sobra é a aproximação lenta do público possível (2% do que falta) e um impulso de no máximo 30% da conta
    const falta = publicoDoNome('instagram', 83) - 40000;
    expect(sem).toBeLessThanOrEqual(Math.round(falta * 0.02 + 40000 * 0.3) + 1);
    const com = exposicaoDoAno('instagram', 40000, 64, 83, 0, 0.5, true);
    // com o acontecimento, o salto legítimo continua possível
    expect(com).toBeGreaterThan(sem * 2);
    expect(com).toBeGreaterThan(150000);
  });

  it('a explicação do balanço mostra acontecimentos públicos (trabalho, lazer), não qualquer marco da vida', () => {
    const v = transacao(adulto(30, { semente: 5 }), x => {
      x.biografia.push({ id: 'a', t: x.t - 2, texto: 'Procurou ajuda para parar de apostar.', relevancia: 'marco', tema: 'saude' } as never);
      x.biografia.push({ id: 'b', t: x.t - 1, texto: 'Foi convocado para a seleção.', relevancia: 'marco', tema: 'trabalho' } as never);
    }).vida;
    const m = marcosDoPeriodo(v, v.t - 12, v.t);
    expect(m).toContain('Foi convocado para a seleção.');
    expect(m.join(' ')).not.toMatch(/apostar/);
  });

  it('um salto de público grande vira uma linha da vida com a causa', () => {
    let v = transacao(adulto(26, { semente: 6 }), x => { x.financas.conta = 1e7; x.notoriedade = { valor: 85, pico: 85, t: x.t, fonte: 'esporte', origens: { esporte: 85 } }; }).vida;
    v = executar(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Parameters<typeof executar>[1]).vida;
    const n = transacao(v, x => {
      x.biografia.push({ id: 'c', t: x.t - 3, texto: 'Campeão da Copa do Brasil.', relevancia: 'marco', tema: 'trabalho' } as never);
      const c = contaAtiva(x, 'instagram')!;
      fecharBalanco(c, x.t, 55);
      c.seguidores = 40000;
      c.balanco = { desde: x.t, inicio: 40000, organico: 0, publicacoes: 0, exposicao: 0, comprados: 0, perdas: 0, famaInicio: 55 };
      processarRedes(x);
    }).vida;
    expect(n.biografia.some(e => /Copa do Brasil.*Desde então/.test(e.texto))).toBe(true);
  });
});

void viver;

/* ================================================================ P0 · agenda */

import { agendaDaSemana } from '../sistemas/agenda';

describe('P0 · a agenda do estágio de meio período com curso técnico (estouro de pilha)', () => {
  it('estágio parcial + curso técnico presencial, sem turno guardado: a semana se monta e o ano passa', () => {
    for (const oc of ['estagio_adm', 'estagio_ti']) {
      const v = transacao(adulto(19, { semente: 44 }), x => {
        x.educacao.basica = undefined; x.educacao.escolaridade = 'medio';
        x.trabalho.atual = { ocupacaoId: oc, empregador: 'uma empresa', contrato: 'estagio', salario: 1200, tInicio: x.t - 2, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'parcial' } as never;
        x.educacao.matricula = { cursoId: 'tec_informatica', instituicao: 'a escola técnica', rede: 'publica', modalidade: 'presencial', tInicio: x.t - 2, mesesRestantes: 18, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
        x.agenda = undefined; x.momento = null;
      }).vida;
      const a = agendaDaSemana(v);
      const trabalho = a.blocos.find(b => b.id === 'trabalho'), curso = a.blocos.find(b => b.id === 'curso');
      expect(trabalho && curso).toBeTruthy();
      // os dois turnos não se atravessam
      expect(trabalho!.turno).not.toBe(curso!.turno);
      expect(() => avancarAno(v)).not.toThrow();
    }
  });
});
