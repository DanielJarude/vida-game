/**
 * FIX #4 (pós-playtest humano): o que entra na vida continua existindo para
 * as outras pessoas e para os outros sistemas — a morte chega a quem amava,
 * o negócio sustenta quem é dono, o carro muda o deslocamento, o dinheiro
 * aplicado existe quando se precisa dele, a eleição se explica, a meia-idade
 * nasce do que foi vivido.
 */

import { describe, expect, it } from 'vitest';
import { avancarAno } from '../ano';
import { idadePessoa, transacao } from '../nucleo';
import { registrarMortes } from '../sistemas/luto';
import { lacoCom, quemPerde } from '../sistemas/rede';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { criarRng } from '../rng';
import { comoEsta, sinaisSociais } from '../../ui/leitura';
import { interacoesPara, rotuloInteracao } from '../sistemas/interacoes';
import { responderTudo } from './ajuda';
import { adulto, comFilho, comNeto, comParceiro, comParente, pessoaNova } from './cenarios';
import { vincular } from '../pessoas';

/* ============================================================ 1. A rede */

describe('rede: uma morte chega a quem amava', () => {
  /** O caso do playtest: casal, a filha adulta morre de AVC; ela deixa marido e filhos; os avós estão vivos. */
  function familia() {
    const v = adulto(58, { semente: 23, genero: 'masculino' });
    const esposa = comParceiro(v, { idade: 56, estagio: 'casamento', anos: 32, genero: 'feminino' }).p;
    const filha = comFilho(v, 30, { casa: false, outroId: esposa.id, genero: 'feminino' }).p;
    const filho = comFilho(v, 27, { casa: false, outroId: esposa.id }).p;
    const genro = pessoaNova(v, 32, 'masculino');
    vincular(v, genro, { parentesco: 'genro', origem: 'familia', proximidade: 40 });
    genro.parceiroId = filha.id; filha.parceiroId = genro.id;
    const neta = comNeto(v, filha, 6, genro.id).p;
    const avo = Object.values(v.vinculos).find(x => (x.parentesco === 'mae' || x.parentesco === 'pai') && v.pessoas[x.pessoaId]?.vivo);
    const mae = avo ? v.pessoas[avo.pessoaId] : comParente(v, 'mae', 80, 'feminino').p;
    return { v, esposa, filha, filho, genro, neta, mae };
  }

  function matar(v: ReturnType<typeof familia>['v'], id: string) {
    return transacao(v, (x, r) => registrarMortes(x, r, [{ p: x.pessoas[id], vin: x.vinculos[id], causa: 'AVC' }], () => {})).vida;
  }

  it('a árvore sabe o que cada um é para quem morreu', () => {
    const { v, esposa, filha, filho, genro, neta, mae } = familia();
    expect(lacoCom(v, esposa.id, filha.id)).toBe('filho');
    expect(lacoCom(v, filho.id, filha.id)).toBe('irmao');
    expect(lacoCom(v, genro.id, filha.id)).toBe('conjuge');
    expect(lacoCom(v, neta.id, filha.id)).toBe('genitor');
    expect(lacoCom(v, mae.id, filha.id)).toBe('neto');
  });

  it('a morte da filha deixa a mãe, o irmão, o marido e a neta de luto — e a mãe sente mais que o irmão', () => {
    const f = familia();
    const vida = matar(f.v, f.filha.id);
    const esposa = vida.pessoas[f.esposa.id];
    expect(esposa.aperto?.tipo).toBe('luto');
    expect(esposa.aperto?.pessoaId).toBe(f.filha.id);
    expect(vida.pessoas[f.genro.id].aperto?.tipo).toBe('luto');
    expect(vida.pessoas[f.neta.id].aperto?.tipo).toBe('luto');
    expect(vida.pessoas[f.filho.id].aperto?.tipo).toBe('luto');
    // Intensidade vem do laço: mãe > irmão > avó.
    const pesos = Object.fromEntries(quemPerde(f.v, f.v.pessoas[f.filha.id]).map(a => [a.p.id, a.peso]));
    expect(pesos[f.esposa.id]).toBeGreaterThan(pesos[f.filho.id]);
    expect(pesos[f.filho.id]).toBeGreaterThan(pesos[f.mae.id] ?? 0);
    expect(esposa.aperto!.peso!).toBeGreaterThan(vida.pessoas[f.filho.id].aperto!.peso!);
  });

  it('é perceptível: a linha da morte diz quem mais perdeu, a ficha diz de quem é o luto, e o casal passa a dividir o marco', () => {
    const f = familia();
    const vida = matar(f.v, f.filha.id);
    const linha = vida.biografia.find(e => e.evento?.pessoaId === f.filha.id && e.tema === 'perda')!;
    expect(linha.texto).toContain(`Você e ${f.esposa.nome} perderam a filha`);
    expect(linha.texto).toContain(f.genro.nome);
    expect(comoEsta(vida, vida.pessoas[f.esposa.id], vida.vinculos[f.esposa.id])).toContain(`de luto por ${f.filha.nome}, a filha de vocês`);
    expect(comoEsta(vida, vida.pessoas[f.genro.id], vida.vinculos[f.genro.id])).toMatch(/de luto pela esposa/);
    expect(sinaisSociais(vida).some(s => s.pessoaId === f.esposa.id)).toBe(true);
    expect(vida.vinculos[f.esposa.id].historia.some(h => h.texto.includes(`Perderam ${f.filha.nome}, a filha de vocês`))).toBe(true);
    // Quem tem vida própria contada guarda a perda.
    expect(vida.pessoas[f.neta.id].vida!.trajetoria.some(t => t.tipo === 'perda')).toBe(true);
    // Estar junto no luto fala de quem se foi, e diz que é um luto dos dois.
    const apoio = interacoesPara(vida, f.esposa.id).find(i => i.id === 'apoiar');
    expect(apoio && rotuloInteracao(vida, f.esposa.id, apoio.id)).toMatch(new RegExp(`luto por ${f.filha.nome}`));
  });

  it('a despedida lembra da mãe e oferece cuidar de quem sofre mais', () => {
    const f = familia();
    const vida = matar(f.v, f.filha.id);
    const d = conteudoPorId('luto_despedida')!;
    const ctx = preparar(d, vida, criarRng(3))!;
    expect(ctx).not.toBeNull();
    expect(d.tipo === 'decisao' && d.texto(ctx)).toContain(f.esposa.nome);
    const apoiar = d.tipo === 'decisao' ? d.opcoes.find(o => o.id === 'apoiar')! : undefined;
    expect(typeof apoiar!.texto === 'function' ? apoiar!.texto(ctx) : '').toContain(f.esposa.nome);
  });

  it('no ano seguinte, o luto do casal vira uma escolha do jogador (com consequência dita antes)', () => {
    const f = familia();
    let vida = matar(f.v, f.filha.id);
    vida.fatos = Object.fromEntries(Object.entries(vida.fatos).filter(([k]) => !k.startsWith('despedida:') && !k.startsWith('netos_orfaos:')));
    vida.t += 12;
    const d = conteudoPorId('rede_luto_casal')!;
    const ctx = preparar(d, vida, criarRng(5));
    expect(ctx).not.toBeNull();
    if (d.tipo === 'decisao') for (const o of d.opcoes) expect(o.consequencia?.(ctx!)).toBeTruthy();
  });

  it('a neta que ficou sem mãe abre a pergunta de quem cuida dela', () => {
    const f = familia();
    const vida = matar(f.v, f.filha.id);
    expect(vida.fatos[`netos_orfaos:${f.filha.id}`]).toBeDefined();
    const d = conteudoPorId('rede_netos_orfaos')!;
    const ctx = preparar(d, vida, criarRng(5));
    expect(ctx).not.toBeNull();
    expect(d.tipo === 'decisao' && d.texto(ctx!)).toContain(f.genro.nome);
  });

  it('a morte de um primo distante não deixa a casa de luto (a intensidade depende do vínculo)', () => {
    const f = familia();
    const primo = comParente(f.v, 'primo', 55, 'masculino', 20).p;
    const vida = matar(f.v, primo.id);
    expect(vida.pessoas[f.esposa.id].aperto?.tipo).not.toBe('luto');
    expect(quemPerde(f.v, f.v.pessoas[primo.id]).length).toBe(0);
  });

  it('a morte da esposa: filhos perdem a mãe, a neta perde a avó; o luto mais leve não apaga o mais pesado', () => {
    const f = familia();
    let vida = matar(f.v, f.filha.id);
    vida = transacao(vida, (x, r) => registrarMortes(x, r, [{ p: x.pessoas[f.esposa.id], vin: x.vinculos[f.esposa.id], causa: 'infarto' }], () => {})).vida;
    // A neta perdeu a mãe (86) e depois a avó (≈44): segue de luto pela mãe.
    expect(vida.pessoas[f.neta.id].aperto?.pessoaId).toBe(f.filha.id);
    expect(vida.pessoas[f.filho.id].aperto?.pessoaId).toBe(f.esposa.id);
    expect(idadePessoa(vida, vida.pessoas[f.filho.id])).toBeGreaterThan(18);
  });

  it('uma vida inteira não deixa luto órfão (sempre aponta para alguém que morreu)', () => {
    let v = adulto(40, { semente: 31 });
    for (let k = 0; k < 35 && !v.morte; k++) { v = avancarAno(v).vida; v = responderTudo(v); }
    for (const p of Object.values(v.pessoas)) if (p.aperto?.tipo === 'luto' && p.aperto.pessoaId) expect(v.pessoas[p.aperto.pessoaId]?.vivo).toBe(false);
  }, 60000);
});
