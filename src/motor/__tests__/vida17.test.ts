/** VIDA 17 · cota global de mensagens, mensagens com situação e continuidade, celular na prisão, estado conjugal e a função dos móveis. */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, comParente, pessoaNova, semPais } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { avancarAno } from '../ano';
import { interpretar } from '../save';
import { vincular } from '../pessoas';
import { anoDe } from '../tempo';
import { MAX_RECEBIDAS17, podeReceber17, receber17, recebidas17 } from '../sistemas/cotaDeMensagens';
import { celularDe, opcoesDaMsg15, processarCelular15, responderMsg15 } from '../v15/celular/celular15';
import { candidatos17, deixarFio17, opcoes17, tomDe } from '../v17/celular/mensagens17';
import { FALAS17 } from '../dados17/celular/catalogo17';
import { contatosAutorizados17 } from '../v17/prisao/telefone17';
import { livreParaRomance, paisAindaJuntos } from '../sistemas/estadoConjugal';
import { DEPOSITO } from '../v14/moveis/moveis14';
import { vagaPara17 } from '../v14/moveis/funcoes17';
import { ofertasDeImoveis } from '../sistemas/mercado';
import { escrever16 } from '../v16/celular/mensagens16';
import { criarRng, rngDe } from '../rng';
import type { Msg15 } from '../dados15/celular/tipos';
import type { Vida } from '../tipos';

const novo = (): Vida => { const v = structuredClone(adulto(30)); v.financas.conta = 3_000_000; for (const k of Object.keys(v.fatos)) if (k.startsWith('cota17')) delete v.fatos[k]; return v; };

describe('VIDA 17 · a cota de mensagens recebidas', () => {
  it('no máximo 4 por ano, somando todas as fontes; o ano novo zera; o que se escreve não conta', () => {
    const v = novo();
    for (let k = 0; k < MAX_RECEBIDAS17; k++) expect(receber17(v, 'alta')).toBeTypeOf('number');
    expect(receber17(v, 'alta')).toBeUndefined();
    expect(recebidas17(v)).toBe(4);
    // escrever (VIDA 16) não consome a cota
    const amigo = pessoaNova(v, 30, 'feminino');
    vincular(v, amigo, { origem: 'escola', proximidade: 70, estagio: 'amigo' });
    v.celular15 = v.celular15 ?? { ano: anoDe(v.t), msgs: [] };
    escrever16(v, rngDe('t17', 1), amigo.id, 'saber');
    expect(recebidas17(v)).toBe(4);
    v.t += 12;
    expect(recebidas17(v)).toBe(0);
    expect(podeReceber17(v, 'baixa')).toBe(true);
  });
  it('baixa prioridade precisa de duas vagas; os meses se espalham pelo ano', () => {
    const v = novo();
    const meses = [receber17(v, 'normal')!, receber17(v, 'normal')!, receber17(v, 'normal')!];
    expect(podeReceber17(v, 'baixa')).toBe(false);
    expect(podeReceber17(v, 'alta')).toBe(true);
    expect(meses[0]).toBeLessThan(3); expect(meses[1]).toBeGreaterThanOrEqual(3); expect(meses[2]).toBeGreaterThanOrEqual(6);
  });
  it('vida inteira: nenhum ano passa de 4 (virada, ondas, acaso, continuação, chamados)', () => {
    let v: Vida = structuredClone(adulto(16, { semente: 77 }));
    const porAno = new Map<number, Set<string>>();
    const marcar = () => {
      for (const m of [...(v.celular15?.msgs ?? []), ...(v.celular15?.arquivo16 ?? [])]) if (m.tipo !== 'escrita' && m.tipo !== 'chamado') { const s = porAno.get(anoDe(m.t)) ?? new Set(); s.add(m.id); porAno.set(anoDe(m.t), s); }
      for (const vin of Object.values(v.vinculos)) if (vin.chamado) { const s = porAno.get(anoDe(vin.chamado.t)) ?? new Set(); s.add(`ch_${vin.pessoaId}_${vin.chamado.t}`); porAno.set(anoDe(vin.chamado.t), s); }
    };
    for (let a = 0; a < 25 && !v.morte; a++) {
      for (let k = 0; k < 8; k++) { const r = executar(v, { tipo: 'celular15', oque: { op: 'ler' } }); v = r.vida; }
      marcar();
      v = avancarAno(v).vida; v.momento = null; (v as Vida & { fila?: unknown }).fila = undefined; marcar();
    }
    for (const [, s] of porAno) expect(s.size).toBeLessThanOrEqual(4);
  }, 120_000);
});

describe('VIDA 17 · mensagens com situação, jeito e continuidade', () => {
  it('o catálogo tem as quatro vozes em todas as situações', () => {
    for (const [id, f] of Object.entries(FALAS17)) for (const tom of ['expansivo', 'contido', 'carinhoso', 'ironico'] as const) expect(f[tom].length, `${id}/${tom}`).toBeGreaterThan(0);
    expect(Object.keys(FALAS17).length).toBeGreaterThanOrEqual(35);
  });
  it('o desabafo vem do aperto real da pessoa; as respostas têm consequências diferentes', () => {
    const v = novo();
    const p = pessoaNova(v, 31, 'feminino');
    p.aperto = { tipo: 'separacao', t: v.t };
    const vin = vincular(v, p, { origem: 'escola', proximidade: 70, estagio: 'amigo_proximo' });
    vin.confianca = 70;
    const c = candidatos17(v, new Set(), 0).find(x => x.tipo === 'desabafo' && x.p?.id === p.id);
    expect(c).toBeDefined();
    const base = c!.montar(criarRng(3));
    expect(base.sit17).toBe('desabafo_separacao');
    const m: Msg15 = { id: 'x1', t: v.t, tipo: 'desabafo', ...base };
    const ops = opcoes17(v, m).map(o => o.op);
    expect(ops).toEqual(expect.arrayContaining(['apoio', 'conselho', 'ajudar', 'engracada', 'evasiva']));
    const efeitos = new Set<string>();
    for (const op of ops) {
      const w = structuredClone(v);
      const mm = { ...m };
      celularDe(w).msgs.push(mm);
      responderMsg15(w, criarRng(5), mm, op);
      const x = w.vinculos[p.id];
      efeitos.add(`${x.proximidade}|${x.confianca}|${x.tensao}|${w.financas.conta}`);
    }
    expect(efeitos.size).toBeGreaterThanOrEqual(4);
  });
  it('o apoio deixa um fio: anos depois, a pessoa volta para agradecer (com prioridade)', () => {
    const v = novo();
    const p = pessoaNova(v, 31, 'masculino');
    vincular(v, p, { origem: 'escola', proximidade: 70, estagio: 'amigo' });
    deixarFio17(v, { pid: p.id, tipo: 'apoio', t: v.t - 10 });
    const c = candidatos17(v, new Set(), 0).find(x => x.tipo === 'retomada');
    expect(c?.prioridade).toBe('alta');
    expect(c!.montar(criarRng(1)).sit17).toBe('retomada_agradecimento');
    expect(v.celular15!.fios17!.length).toBe(0);
  });
  it('"outro dia" vira promessa — e a promessa pode voltar como cobrança', () => {
    const v = novo();
    const p = pessoaNova(v, 30, 'feminino');
    vincular(v, p, { origem: 'escola', proximidade: 70, estagio: 'amigo' });
    const m: Msg15 = { id: 'cv', t: v.t, tipo: 'convite', de: p.id, texto: '"Bora?"', assunto: 'cinema', custo: 60 };
    celularDe(v).msgs.push(m);
    responderMsg15(v, criarRng(2), m, 'outro_dia');
    expect(v.celular15!.fios17!.some(f => f.tipo === 'promessa' && f.pid === p.id)).toBe(true);
    v.t += 6;
    v.vinculos[p.id].tUltimoContato = v.t - 6;
    const c = candidatos17(v, new Set(), 0).find(x => x.tipo === 'cobranca');
    expect(c!.montar(criarRng(1)).texto).toContain('cinema');
  });
  it('o jeito de falar sai do temperamento', () => {
    const v = novo();
    const p = pessoaNova(v, 30);
    p.temperamento = { extroversao: 0.6, afabilidade: 0, responsabilidade: 0, abertura: 0, estabilidade: 0 };
    expect(tomDe(p)).toBe('expansivo');
    p.temperamento = { extroversao: 0, afabilidade: -0.3, responsabilidade: 0, abertura: 0.5, estabilidade: 0 };
    expect(tomDe(p)).toBe('ironico');
  });
  it('as mensagens antigas ganharam respostas novas (mais tons)', () => {
    const v = novo();
    const p = pessoaNova(v, 30, 'feminino');
    vincular(v, p, { origem: 'escola', proximidade: 70, estagio: 'amigo' });
    const m: Msg15 = { id: 'sd', t: v.t, tipo: 'saudade', de: p.id, texto: '"Saudade!"' };
    expect(opcoesDaMsg15(v, m).map(o => o.op)).toEqual(expect.arrayContaining(['ligar', 'marcar', 'curto', 'carinhosa', 'evasiva']));
  });
});

describe('VIDA 17 · o celular na prisão', () => {
  it('preso: nenhum aplicativo; só o telefone da unidade para contatos autorizados; solto, volta', () => {
    let v = novo();
    semPais(v);
    const mae = comParente(v, 'mae', 58, 'feminino', 70).p;
    const amigo = pessoaNova(v, 30);
    vincular(v, amigo, { origem: 'escola', proximidade: 70, estagio: 'amigo' });
    v.justica = { antecedentes: [], prisao: { tInicio: v.t, tFim: v.t + 60, regime: 'fechado' } } as NonNullable<Vida['justica']>;
    for (const op of [{ op: 'ler' }, { op: 'namoro_abrir' }, { op: 'escrever', pid: amigo.id, intencao: 'saber' }] as const) expect(disponibilidade(v, { tipo: 'celular15', oque: op as never }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'rede', op: { o: 'publicar' } } as never).grau).toBe('impossivel');
    expect(contatosAutorizados17(v).map(x => x.p.id)).toContain(mae.id);
    expect(contatosAutorizados17(v).map(x => x.p.id)).not.toContain(amigo.id);
    expect(podeTentar(disponibilidade(v, { tipo: 'celular15', oque: { op: 'ligacao_unidade', pid: mae.id } }))).toBe(true);
    expect(disponibilidade(v, { tipo: 'celular15', oque: { op: 'ligacao_unidade', pid: amigo.id } }).grau).toBe('impossivel');
    v = executar(v, { tipo: 'celular15', oque: { op: 'ligacao_unidade', pid: mae.id } }).vida;
    // as mensagens não chegam ao aparelho retido
    const antes = (v.celular15?.msgs ?? []).length;
    v.t += 12; processarCelular15(v);
    expect((v.celular15?.msgs ?? []).length).toBeLessThanOrEqual(antes);
    // semiaberto também não usa a rede
    v.justica!.prisao!.regime = 'semiaberto';
    expect(disponibilidade(v, { tipo: 'rede', op: { o: 'publicar' } } as never).grau).toBe('impossivel');
    // solto
    v.justica!.prisao = undefined;
    expect(podeTentar(disponibilidade(v, { tipo: 'celular15', oque: { op: 'ler' } }))).toBe(true);
    expect(disponibilidade(v, { tipo: 'celular15', oque: { op: 'ligacao_unidade', pid: mae.id } }).grau).toBe('impossivel');
  });
});

describe('VIDA 17 · estado conjugal da família', () => {
  it('pais juntos (mesmo com o campo perdido) não arranjam namoro; separados, viúvos (depois do luto) e solos podem', () => {
    const v = novo();
    semPais(v);
    v.origem.arranjo = 'pais_juntos';
    const mae = comParente(v, 'mae', 58, 'feminino').p;
    const pai = comParente(v, 'pai', 60, 'masculino').p;
    mae.parceiroId = pai.id; pai.parceiroId = mae.id;
    expect(livreParaRomance(v, mae)).toBe(false);
    mae.parceiroId = undefined; pai.parceiroId = undefined; // o campo se perdeu, mas nada terminou
    expect(paisAindaJuntos(v)).toBe(true);
    expect(livreParaRomance(v, mae)).toBe(false);
    // separação recente: ainda não; um ano depois, sim
    mae.aperto = { tipo: 'separacao', t: v.t };
    expect(livreParaRomance(v, mae)).toBe(false);
    v.t += 13;
    expect(livreParaRomance(v, mae)).toBe(true);
    // viuvez: só depois do luto
    const w = novo();
    semPais(w);
    w.origem.arranjo = 'pais_juntos';
    const m2 = comParente(w, 'mae', 58, 'feminino').p;
    const p2 = comParente(w, 'pai', 60, 'masculino').p;
    p2.vivo = false;
    m2.aperto = { tipo: 'luto', t: w.t, pessoaId: p2.id };
    expect(livreParaRomance(w, m2)).toBe(false);
    w.t += 25;
    expect(livreParaRomance(w, m2)).toBe(true);
  });
  it('a notícia de quem se separou não diz "tô namorando"', () => {
    const v = novo();
    const irma = comParente(v, 'irmao', 33, 'feminino', 70).p;
    irma.vida = { trajetoria: [{ t: v.t, texto: 'Ana e Rui se separaram.', tipo: 'amor' }] } as never;
    const vin = v.vinculos[irma.id]; vin.tUltimoContato = v.t;
    v.celular15 = { ano: anoDe(v.t) - 1, msgs: [] };
    for (let k = 0; k < 30 && !(v.celular15.msgs.some(m => m.tipo === 'noticia')); k++) { v.celular15 = { ano: anoDe(v.t) - 1, msgs: [] }; for (const key of Object.keys(v.fatos)) if (key.startsWith('cota17') || key.startsWith('cel15')) delete v.fatos[key]; v.id = `${v.id}x`; processarCelular15(v); }
    const n = v.celular15.msgs.find(m => m.tipo === 'noticia');
    if (n) expect(n.texto).not.toMatch(/namorando/);
  });
});

describe('VIDA 17 · a função dos móveis', () => {
  function emCasa(modelo: string): Vida {
    let v = novo();
    const o = ofertasDeImoveis(v, 'aluguel').find(x => x.modeloId === modelo && !x.mobilia) ?? ofertasDeImoveis(v, 'aluguel').find(x => x.modeloId === modelo)!;
    v = executar(v, { tipo: v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente' ? 'sair_de_casa' : 'trocar_moradia', ofertaId: o.id } as never).vida;
    v.financas.coisas = (v.financas.coisas ?? []).filter(t => !t.doImovel);
    v.moradia.mobilia14 = undefined;
    return v;
  }
  it('o segundo sofá não vai para cima do primeiro: oferece trocar (o antigo vai para o depósito)', () => {
    let v = emCasa('apto_2q');
    v = executar(v, { tipo: 'comprar_coisa', coisaId: 'sofa' }).vida;
    const d = disponibilidade(v, { tipo: 'comprar_coisa', coisaId: 'sofa_couro' });
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/sofá/);
    const velho = v.financas.coisas!.find(t => t.coisaId === 'sofa')!;
    v = executar(v, { tipo: 'comprar_coisa', coisaId: 'sofa_couro', substituir: velho.id }).vida;
    const sofas = v.financas.coisas!.filter(t => ['sofa', 'sofa_couro'].includes(t.coisaId));
    expect(sofas.find(t => t.coisaId === 'sofa')!.local).toBe(DEPOSITO);
    expect(sofas.find(t => t.coisaId === 'sofa_couro')!.local).toBeUndefined();
  });
  it('camas: uma por quarto, na ordem dos quartos; sem quarto livre, o motivo', () => {
    let v = emCasa('apto_3q');
    const quartos = vagaPara17(v, 'cama_box')!.capacidade;
    expect(quartos).toBeGreaterThanOrEqual(3);
    const usados = new Set<string>();
    for (let k = 0; k < quartos; k++) {
      expect(podeTentar(disponibilidade(v, { tipo: 'comprar_coisa', coisaId: 'cama_solteiro' }))).toBe(true);
      v = executar(v, { tipo: 'comprar_coisa', coisaId: 'cama_solteiro' }).vida;
      const camas = v.financas.coisas!.filter(t => t.coisaId === 'cama_solteiro' && !t.local);
      expect(camas.length).toBe(k + 1);
      for (const t of camas) usados.add(t.comodo!);
    }
    expect(usados.size).toBe(quartos);
    const d = disponibilidade(v, { tipo: 'comprar_coisa', coisaId: 'cama_king' });
    expect(d.grau).toBe('incompativel');
    expect(d.motivo).toMatch(/quartos já têm cama/);
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });
  it('save antigo com dois sofás na sala: a normalização deixa um e guarda o outro', () => {
    let v = emCasa('apto_1q');
    v = executar(v, { tipo: 'comprar_coisa', coisaId: 'sofa' }).vida;
    const extra = structuredClone(v.financas.coisas!.find(t => t.coisaId === 'sofa')!);
    extra.id = 'cs_dup'; extra.coisaId = 'sofa_retratil'; extra.t = v.t - 1; extra.local = undefined;
    v.financas.coisas!.push(extra);
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    const w = (r as { vida: Vida }).vida;
    const naCasa = w.financas.coisas!.filter(t => ['sofa', 'sofa_retratil'].includes(t.coisaId) && !t.local);
    expect(naCasa.length).toBe(1);
  });
  it('o que não tem função (poltrona) segue só a regra do espaço', () => {
    const v = emCasa('apto_2q');
    expect(vagaPara17(v, 'poltrona')).toBeUndefined();
  });
});

void comParceiro;
