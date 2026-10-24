/**
 * REWORK 11 · Fase H — relacionamentos: conhecer gente com parceria, a busca romântica só com acordo (ou como traição
 * dita), a idade (18+) no caso e na intimidade, a proteção e a chance de gravidez, o ex que recusa e bloqueia, o
 * poliamor com o consentimento de todos, o noivado que morre com a relação, o casamento sem "parcelado" para quem é
 * rico (e com o prazo certo para quem parcela) e a lua de mel pela viagem de sempre.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { parceiro, transacao } from '../nucleo';
import { vincular } from '../pessoas';
import { criarRng, rngDe } from '../rng';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { ctxPessoa, interacoesPara } from '../sistemas/interacoes';
import { ficarNoivos, iniciarCaso, mudarEstagio, terminar } from '../sistemas/romance';
import { chanceDoEncontro, conceberPorEncontro, gestacaoEmCurso, podemConceber } from '../sistemas/familia';
import { aberturaDoEx } from '../sistemas/afetosAdultos';
import { casar, custoDoCasamento, faltaDaFesta, PRAZO_DA_FESTA } from '../sistemas/casamento';
import { disponibilidadeExperiencia } from '../sistemas/experiencias';
import { SISTEMICOS } from '../conteudo/sistemicos';
import type { Ctx } from '../conteudo/base';

const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const BASE = adulto(30, { semente: 1101, genero: 'masculino' });

/** Um casal adulto (ele 30, ela 29), com uma colega de trabalho solteira. */
function casal(f: (x: Vida, par: string, colega: string) => void = () => {}, estagio: 'namoro' | 'morando_junto' | 'casamento' = 'namoro'): { v: Vida; par: string; colega: string } {
  let par = '', colega = '';
  const v = em(BASE, x => {
    x.eu.atracao = 'mulheres';
    x.financas.conta = 8000;
    const c = comParceiro(x, { genero: 'feminino', estagio, idade: 29 });
    c.p.atracao = 'homens';
    const o = pessoaNova(x, 28, 'feminino', { atracao: 'homens' });
    vincular(x, o, { origem: 'trabalho', proximidade: 50, estagio: 'colega', convivio: ['trabalho'] });
    par = c.p.id; colega = o.id;
    f(x, par, colega);
  });
  return { v, par, colega };
}

describe('REL-11.1 · conhecer gente com parceria', () => {
  it('fazer amizades está aberto para quem namora — e a pessoa nova não é romance nem traição', () => {
    const { v, par } = casal();
    const d = disponibilidade(v, { tipo: 'fazer_amizade', contexto: 'noite' });
    expect(d.grau).toBe('permitido');
    let novas = 0;
    for (let k = 0; k < 6; k++) {
      const w0: Vida = { ...v, rng: (k + 1) * 104729 };
      const antes = new Set(Object.keys(w0.pessoas));
      const w = executar(w0, { tipo: 'fazer_amizade', contexto: 'noite' }).vida;
      const nova = Object.keys(w.pessoas).find(id => !antes.has(id));
      expect(w.vinculos[par].tensao).toBe(w0.vinculos[par].tensao);
      expect(w.biografia.some(e => e.evento?.tipo === 'traicao')).toBe(false);
      if (nova) { novas++; expect(w.vinculos[nova].romance).toBeUndefined(); expect(w.vinculos[nova].estagio).toBe('conhecido'); }
    }
    expect(novas).toBeGreaterThan(0);
  });

  it('a busca romântica com parceria exclusiva é dita como traição; com acordo aberto ou poliamor, é permitida', () => {
    const exclusivo = casal().v;
    const d = disponibilidade(exclusivo, { tipo: 'conhecer_alguem', contexto: 'app' });
    expect(d.grau).toBe('irregular');
    expect(d.motivo).toMatch(/traição/);
    for (const acordo of ['aberto', 'poliamor'] as const) {
      const v = casal((x, p) => { x.vinculos[p].romance!.acordo = acordo; }).v;
      expect(disponibilidade(v, { tipo: 'conhecer_alguem', contexto: 'app' }).grau).toBe('permitido');
    }
    // Solteiro: como sempre.
    const solteiro = em(BASE, x => { x.eu.atracao = 'mulheres'; });
    expect(disponibilidade(solteiro, { tipo: 'conhecer_alguem', contexto: 'app' }).grau).toBe('permitido');
  });

  it('buscar por fora num relacionamento exclusivo pode ser percebido (ciúme com causa)', () => {
    let percebeu = 0;
    for (let k = 0; k < 40; k++) {
      const c = casal();
      const par = c.par;
      const v: Vida = { ...c.v, rng: (k + 1) * 7919 };
      const w = executar(v, { tipo: 'conhecer_alguem', contexto: 'app' }).vida;
      if (w.vinculos[par].tensao > v.vinculos[par].tensao) { percebeu++; expect(w.vinculos[par].conflito?.assunto).toMatch(/aplicativo/); }
    }
    expect(percebeu).toBeGreaterThan(0);
    expect(percebeu).toBeLessThan(40);
  });
});

describe('Idade · caso e intimidade só entre adultos', () => {
  const adolescente = (() => {
    let par = '', colega = '';
    const base = adulto(17, { semente: 1103, genero: 'masculino' });
    const v = em(base, x => {
      x.eu.atracao = 'mulheres';
      const c = comParceiro(x, { genero: 'feminino', estagio: 'namoro', idade: 17 });
      c.p.atracao = 'homens';
      const o = pessoaNova(x, 17, 'feminino', { atracao: 'homens' });
      vincular(x, o, { origem: 'escola', proximidade: 60, estagio: 'colega', convivio: ['escola'] });
      par = c.p.id; colega = o.id;
    });
    return { v, par, colega };
  })();

  it('aos 17, com namoro: nada de intimidade, nada de convite escondido nem "arriscar algo"', () => {
    const { v, par, colega } = adolescente;
    const ids = interacoesPara(v, par).map(x => x.id);
    expect(ids).not.toContain('intimidade');
    expect(ids).not.toContain('intimidade_sem_protecao');
    expect(interacoesPara(v, colega).map(x => x.id)).not.toContain('convidar');
    const conteudo = SISTEMICOS.find(x => x.id === 'rom_alguem_especial')!;
    const trair = (conteudo as unknown as { opcoes: { id: string; disponivel?: (c: Ctx) => unknown }[] }).opcoes.find(o => o.id === 'trair')!;
    const c = { v, r: criarRng(1), idade: 17, p: { pessoa: v.pessoas[colega] }, g: (a: string) => a, vezes: 0 } as Ctx;
    expect(trair.disponivel!(c)).toBe(false);
    expect(conceberPorEncontro(transacao(v, () => {}).vida, criarRng(2), v.pessoas[par], false)).toBe(false);
  });

  it('aos 18+, a intimidade existe para o namoro que não mora junto (e a proteção é escolha)', () => {
    const { v, par } = casal((x, p) => { x.vinculos[p].convivio = []; });
    const ids = interacoesPara(v, par).map(x => x.id);
    expect(ids).toContain('intimidade');
    expect(ids).toContain('intimidade_sem_protecao');
    expect(podemConceber(v, v.pessoas[par])).toBe(true);
  });
});

describe('REL-11.2 · proteção e gravidez', () => {
  it('o preservativo reduz a chance — e nunca há gravidez automática', () => {
    expect(chanceDoEncontro(0.85, true)).toBeLessThan(chanceDoEncontro(0.85, false) / 5);
    const { v, par } = casal((x, p) => { x.vinculos[p].convivio = []; });
    let sem = 0, com = 0;
    const N = 3000;
    for (let k = 0; k < N; k++) {
      const a = transacao(v, () => {}).vida; if (conceberPorEncontro(a, rngDe('t', k, 'sem'), a.pessoas[par], false)) sem++;
      const b = transacao(v, () => {}).vida; if (conceberPorEncontro(b, rngDe('t', k, 'com'), b.pessoas[par], true)) com++;
    }
    expect(sem).toBeGreaterThan(com * 3);
    expect(sem).toBeLessThan(N * 0.15);
    expect(sem).toBeGreaterThan(0);
  });

  it('a noite sem proteção, pela interação, às vezes engravida e às vezes não', () => {
    let gest = 0;
    for (let k = 0; k < 60; k++) {
      const { v, par } = casal((x, p) => { x.vinculos[p].convivio = []; x.vinculos[p].romance!.envolvimento = 95; x.t += k; });
      const w = executar(v, { tipo: 'pessoa', pessoaId: par, interacao: 'intimidade_sem_protecao' }).vida;
      if (gestacaoEmCurso(w)) { gest++; expect(gestacaoEmCurso(w)!.planejada).toBe(false); }
    }
    expect(gest).toBeLessThan(60);
  });

  it('a outra pessoa pode dizer "hoje não" (o consentimento é dela)', () => {
    let recusou = 0;
    for (let k = 0; k < 30; k++) {
      const { v, par } = casal((x, p) => { x.vinculos[p].romance!.envolvimento = 30; x.vinculos[p].tensao = 55; x.t += k; });
      const out = executar(v, { tipo: 'pessoa', pessoaId: par, interacao: 'intimidade' });
      if (/hoje não/.test(out.resultado ?? '')) recusou++;
    }
    expect(recusou).toBeGreaterThan(10);
  });

  it('um caso escondido entre adultos também pode engravidar (o mesmo modelo)', () => {
    const { v, colega } = casal();
    let n = 0;
    for (let k = 0; k < 2000 && n === 0; k++) {
      const w = em(v, x => iniciarCaso(x, x.pessoas[colega], x.vinculos[colega]));
      if (conceberPorEncontro(w, rngDe('caso', k), w.pessoas[colega], false)) { n++; expect(gestacaoEmCurso(w)!.gestanteId).toBe(colega); }
    }
    expect(n).toBe(1);
  });
});

describe('REL-11.3 · ex-parceiros', () => {
  const comEx = (motivo?: 'traicao') => {
    let id = '';
    const v = em(BASE, x => {
      x.eu.atracao = 'mulheres';
      const c = comParceiro(x, { genero: 'feminino', estagio: 'namoro', idade: 29 });
      c.p.atracao = 'homens';
      id = c.p.id;
      terminar(x, c.p, c.vin, motivo ? 'ela' : 'jogador', motivo);
      x.t += 24; c.vin.tensao = 25; c.vin.proximidade = 60; c.vin.confianca = 50;
    });
    return { v, id };
  };

  it('o término grava quem terminou e se houve traição — e o ex traído fica bem menos aberto', () => {
    const a = comEx(), b = comEx('traicao');
    expect(a.v.vinculos[a.id].romance?.porque).toEqual({ quem: 'jogador' });
    expect(b.v.vinculos[b.id].romance?.porque).toEqual({ quem: 'ela', motivo: 'traicao' });
    const ca = ctxPessoa(a.v, a.id)!, cb = ctxPessoa(b.v, b.id)!;
    cb.vin.confianca = ca.vin.confianca; cb.vin.proximidade = ca.vin.proximidade; cb.vin.tensao = ca.vin.tensao;
    expect(aberturaDoEx(ca) - aberturaDoEx(cb)).toBeGreaterThanOrEqual(20);
  });

  it('as novas ações com o ex existem — e o ex pode recusar, ignorar e bloquear', () => {
    const { v, id } = comEx();
    const ids = interacoesPara(v, id).map(x => x.id);
    for (const x of ['ex_mensagem', 'ex_elogiar', 'ex_reaproximar', 'ex_encontro_casual', 'ex_provocar', 'ex_insultar']) expect(ids).toContain(x);
    let bloqueou: Vida | undefined;
    for (let k = 0; k < 20 && !bloqueou; k++) {
      const w = executar(em(v, x => { x.t += k; }), { tipo: 'pessoa', pessoaId: id, interacao: 'ex_insultar' }).vida;
      if (w.fatos[`ex_bloqueou_${id}`] !== undefined) bloqueou = w;
    }
    expect(bloqueou).toBeTruthy();
    const depois = interacoesPara(bloqueou!, id).map(x => x.id);
    expect(depois).not.toContain('ex_mensagem');
    expect(depois).not.toContain('ex_reaproximar');
  });

  it('pedir para tentar de novo, recusado, tem espera (não dá para insistir no ano seguinte)', () => {
    const { v, id } = comEx('traicao');
    let w: Vida | undefined;
    for (let k = 0; k < 20; k++) {
      const x = executar(em(v, y => { y.t += k; }), { tipo: 'pessoa', pessoaId: id, interacao: 'ex_reaproximar' }).vida;
      if (x.fatos[`ex_reaprox_nao_${id}`] !== undefined) { w = x; break; }
    }
    expect(w).toBeTruthy();
    const ano = em(w!, x => { x.t += 12; x.anoAtual.acoes = []; });
    expect(disponibilidade(ano, { tipo: 'pessoa', pessoaId: id, interacao: 'ex_reaproximar' }).grau).toBe('incompativel');
  });
});

describe('REL-11.4 · relação aberta e poliamor', () => {
  it('no acordo aberto, a outra pessoa é paralela (consentida), não secreta — e a parceria principal não muda', () => {
    const { v, par, colega } = casal((x, p) => { x.vinculos[p].romance!.acordo = 'aberto'; });
    const w = em(v, x => iniciarCaso(x, x.pessoas[colega], x.vinculos[colega]));
    expect(w.vinculos[colega].romance?.paralelo).toBe(true);
    expect(w.vinculos[colega].romance?.secreto).toBeUndefined();
    expect(parceiro(w)!.p.id).toBe(par);
    expect(parceiro(w)!.vin.romance?.segredo).toBeUndefined();
  });

  it('um segundo namoro exige o poliamor E o acordo da parceria agora E o sim da outra pessoa', () => {
    const montar = (acordo: 'aberto' | 'poliamor', tensao = 0) => {
      const { v, par, colega } = casal((x, p) => { x.vinculos[p].romance!.acordo = acordo; x.vinculos[p].tensao = tensao; });
      const w = em(v, x => { iniciarCaso(x, x.pessoas[colega], x.vinculos[colega]); x.vinculos[colega].romance!.envolvimento = 90; x.t += 6; });
      return { w, par, colega };
    };
    const aberto = montar('aberto');
    expect(disponibilidade(aberto.w, { tipo: 'pessoa', pessoaId: aberto.colega, interacao: 'namorar_paralelo' }).grau).toBe('incompativel');
    const brigados = montar('poliamor', 70);
    const d = disponibilidade(brigados.w, { tipo: 'pessoa', pessoaId: brigados.colega, interacao: 'namorar_paralelo' });
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/não está de acordo/);
    let aceitou: Vida | undefined, par = '';
    for (let k = 0; k < 20 && !aceitou; k++) {
      const m = montar('poliamor');
      const w2 = em(m.w, x => { x.t += k; });
      expect(disponibilidade(w2, { tipo: 'pessoa', pessoaId: m.colega, interacao: 'namorar_paralelo' }).grau).toBe('improvavel');
      const r = executar(w2, { tipo: 'pessoa', pessoaId: m.colega, interacao: 'namorar_paralelo' }).vida;
      if (r.vinculos[m.colega].romance?.estagio === 'namoro') { aceitou = r; par = m.par; expect(r.vinculos[m.colega].romance?.paralelo).toBe(true); }
    }
    expect(aceitou).toBeTruthy();
    // A parceria principal (casa, dinheiro, filhos) continua a mesma.
    expect(parceiro(aceitou!)!.p.id).toBe(par);
  });

  it('voltar a ser exclusivo encerra os vínculos paralelos', () => {
    const { v, par, colega } = casal((x, p) => { x.vinculos[p].romance!.acordo = 'poliamor'; });
    const w = em(v, x => iniciarCaso(x, x.pessoas[colega], x.vinculos[colega]));
    const r = executar(w, { tipo: 'pessoa', pessoaId: par, interacao: 'voltar_exclusivo' }).vida;
    expect(r.vinculos[colega].romance?.estagio).toBe('ex');
    expect(r.vinculos[par].romance?.acordo).toBeUndefined();
  });

  it('save antigo: o "secreto" dentro de um acordo aberto vira paralelo', () => {
    const { v, colega } = casal((x, p) => { x.vinculos[p].romance!.acordo = 'aberto'; });
    const velho = em(v, x => { x.vinculos[colega].romance = { estagio: 'saindo', tEstagio: x.t, envolvimento: 60, secreto: true }; });
    const lido = interpretar(JSON.stringify(velho));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') { expect(lido.vida.vinculos[colega].romance?.paralelo).toBe(true); expect(lido.vida.vinculos[colega].romance?.secreto).toBeUndefined(); }
  });
});

describe('REL-16 · noivado, casamento e lua de mel', () => {
  it('o noivado é apagado ao terminar (e quem volta pode pedir de novo) e ao casar', () => {
    const { v, par } = casal((x, p) => { x.vinculos[p].romance!.tInicio = x.t - 60; }, 'morando_junto');
    let w = em(v, x => ficarNoivos(x, x.vinculos[par]));
    expect(w.fatos[`noivado_${par}`]).toBeDefined();
    expect(w.vinculos[par].romance?.noivado).toBeDefined();
    const fim = em(w, x => terminar(x, x.pessoas[par], x.vinculos[par], 'jogador'));
    expect(fim.fatos[`noivado_${par}`]).toBeUndefined();
    expect(fim.vinculos[par].romance?.noivado).toBeUndefined();
    const volta = em(fim, x => { mudarEstagio(x, x.vinculos[par], 'namoro'); x.vinculos[par].romance!.tInicio = x.t - 60; x.t += 24; x.anoAtual.acoes = []; });
    const d = disponibilidade(volta, { tipo: 'pessoa', pessoaId: par, interacao: 'pedir_casamento' });
    expect(d.motivo ?? '').not.toMatch(/já estão noivos/);
    expect(interacoesPara(volta, par).map(x => x.id)).not.toContain('marcar_casamento');
    w = em(w, x => { casar(x, x.pessoas[par], 2500); });
    expect(w.fatos[`noivado_${par}`]).toBeUndefined();
    expect(w.vinculos[par].romance?.estagio).toBe('casamento');
  });

  it('save antigo com o fato do noivado sobrevivendo ao casamento: a leitura apaga', () => {
    const { v, par } = casal(() => {}, 'casamento');
    const velho = em(v, x => { x.fatos[`noivado_${par}`] = x.t - 30; });
    const lido = interpretar(JSON.stringify(velho));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') expect(lido.vida.fatos[`noivado_${par}`]).toBeUndefined();
  });

  const noivos = (conta: number, renda = 0) => {
    const { v, par } = casal((x, p) => { x.financas.conta = conta; x.financas.investimentos = []; x.pessoas[p].renda = renda; ficarNoivos(x, x.vinculos[p]); x.fatos[`noivado_${p}`] = x.t - 13; x.vinculos[p].romance!.noivado!.t = x.t - 13; }, 'morando_junto');
    return { v, par };
  };
  const opcoesDoCasamento = (v: Vida, par: string) => executar(v, { tipo: 'pessoa', pessoaId: par, interacao: 'marcar_casamento' }).vida;

  it('quem tem milhões não recebe "parcelado"; pode a festa de luxo, sem dívida', () => {
    const { v, par } = noivos(23_000_000, 5000);
    const w = opcoesDoCasamento(v, par);
    expect(w.momento?.situacaoId).toBe('rom_casamento');
    const festao = w.momento!.opcoes.find(o => o.id === 'festao')!;
    expect(festao.texto).not.toMatch(/parcel/i);
    const luxo = w.momento!.opcoes.find(o => o.id === 'luxo')!;
    expect(luxo.bloqueio).toBeUndefined();
    const r = executar(w, { tipo: 'decidir', opcaoId: 'festao' });
    expect(r.vida.financas.dividas.filter(d => d.id.startsWith('festa'))).toHaveLength(0);
    expect(r.resultado ?? '').not.toMatch(/parcela|carnê/);
  });

  it('quem parcela: o texto diz 24 vezes e a dívida criada tem prazo de 24 meses', () => {
    const { v, par } = noivos(0, 15000);
    const w = opcoesDoCasamento(v, par);
    expect(faltaDaFesta(w, w.pessoas[par], 75000)).toBeGreaterThan(0);
    const festao = w.momento!.opcoes.find(o => o.id === 'festao')!;
    expect(festao.bloqueio).toBeUndefined();
    expect(festao.texto).toMatch(new RegExp(`${PRAZO_DA_FESTA} vezes`));
    const r = executar(w, { tipo: 'decidir', opcaoId: 'festao' });
    const div = r.vida.financas.dividas.find(d => d.id.startsWith('festa'))!;
    expect(div.prazo).toBe(PRAZO_DA_FESTA);
    expect(r.resultado ?? '').toMatch(/24 parcelas/);
  });

  it('o planejamento: o preço sai do plano, a outra pessoa pode discordar, e casar cria a dívida dita', () => {
    const { v, par } = noivos(0, 12000);
    const plano = { local: 'salao' as const, cerimonia: 'civil' as const, convidados: 120, estilo: 'classico' as const, luaDeMel: true };
    expect(custoDoCasamento(v, plano)).toBeLessThan(custoDoCasamento(v, { ...plano, estilo: 'luxo' }));
    expect(disponibilidade(v, { tipo: 'casamento', pessoaId: par, op: 'celebrar' }).grau).toBe('requisito');
    const w = executar(v, { tipo: 'casamento', pessoaId: par, op: 'planejar', plano }).vida;
    expect(w.vinculos[par].romance?.noivado?.plano?.convidados).toBe(120);
    const d = disponibilidade(w, { tipo: 'casamento', pessoaId: par, op: 'celebrar' });
    expect(d.grau).toBe('permitido');
    expect(d.motivo).toMatch(/24 parcelas/);
    const r = executar(w, { tipo: 'casamento', pessoaId: par, op: 'celebrar' });
    expect(r.vida.vinculos[par].romance?.estagio).toBe('casamento');
    expect(r.vida.fatos[`noivado_${par}`]).toBeUndefined();
    const div = r.vida.financas.dividas.find(x => x.id.startsWith('festa'))!;
    expect(div.prazo).toBe(PRAZO_DA_FESTA);
    expect(r.resultado).toMatch(/24 parcelas/);
    // Plano impossível: o cartório não comporta 400 convidados.
    expect(disponibilidade(v, { tipo: 'casamento', pessoaId: par, op: 'planejar', plano: { ...plano, local: 'cartorio', convidados: 400 } }).grau).toBe('incompativel');
  });

  it('a lua de mel usa a viagem de sempre e ignora o intervalo uma vez', () => {
    const { v, par } = noivos(60000, 6000);
    let w = em(v, x => { casar(x, x.pessoas[par], 2500); x.fatos['exp_viagem_pais'] = x.t; });
    expect(disponibilidadeExperiencia(w, 'viagem_pais').grau).toBe('incompativel');
    const d = disponibilidadeExperiencia(w, 'viagem_pais', undefined, true);
    expect(['permitido', 'improvavel']).toContain(d.grau);
    const r = executar(w, { tipo: 'experiencia', id: 'viagem_pais', luaDeMel: true });
    expect(r.vida.biografia.some(e => /^Lua de mel em /.test(e.texto) && e.pessoas?.includes(par))).toBe(true);
    expect(r.vida.fatos[`lua_de_mel_${par}`]).toBe(r.vida.t);
    w = r.vida;
    expect(disponibilidadeExperiencia(w, 'viagem_pais', undefined, true).grau).toBe('incompativel');
  });
});
