/**
 * REWORK 12.05 — continuidade familiar de filhos menores e recuperação de saves.
 *
 * A guarda e quem o jogador controla são perguntas diferentes: um filho menor
 * sem adulto da família que possa assumir a guarda continua jogável — a guarda
 * é da Justiça (o acolhimento, `Moradia.acolhimento`), até os 18. O caso real
 * que motivou o hotfix (René morre em Sydney; Frankie, filha adotiva de 15, sem
 * ninguém da família) é reproduzido aqui como fixture — não é o save do jogador.
 */

import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro, comParente, pessoaNova, reneEFrankie, sozinho } from './cenarios';
import { responderTudo } from './ajuda';
import { idade } from '../nucleo';
import { interpretar } from '../save';
import { avancarAno } from '../ano';
import { balanco } from '../sistemas/dinheiro';
import { continuarComo, partilhar, sucessores } from '../sistemas/sucessao';
import { calcularHeranca } from '../sistemas/partilha';
import { vincular } from '../pessoas';
import type { Vida } from '../tipos';

/** O patrimônio que existe no mundo (o protagonista e as posses das pessoas). */
function patrimonioTotal(v: Vida): number {
  const npcs = Object.values(v.pessoas).reduce((s, p) => s + (p.posses ? p.posses.dinheiro + p.posses.bens.reduce((t, b) => t + b.valor, 0) : 0), 0);
  return balanco(v).liquido + npcs + (v.origem.reservaDe ? v.origem.reserva ?? 0 : 0);
}

/** Toda referência a pessoa aponta para alguém que existe (ou para 'eu'). */
function semReferenciasQuebradas(v: Vida): void {
  const existe = (id: string) => id === 'eu' || !!v.pessoas[id];
  for (const id of Object.keys(v.vinculos)) expect(existe(id)).toBe(true);
  for (const p of Object.values(v.pessoas)) {
    for (const g of p.genitores ?? []) expect(existe(g)).toBe(true);
    if (p.parceiroId) expect(existe(p.parceiroId)).toBe(true);
  }
  if (v.origem.responsavelId) expect(existe(v.origem.responsavelId)).toBe(true);
  if (v.moradia.anfitriaoId) expect(existe(v.moradia.anfitriaoId)).toBe(true);
}

const reabrir = (v: Vida): Vida => {
  const r = interpretar(JSON.stringify(v));
  expect(r.tipo).toBe('ok');
  return (r as { vida: Vida }).vida;
};

const anos = (v: Vida, n: number): Vida => {
  for (let k = 0; k < n && !v.morte; k++) v = responderTudo(avancarAno(responderTudo(v)).vida);
  return v;
};

describe('REWORK 12.05 · Frankie, 15, filha adotiva, em Sydney — sem adulto da família', () => {
  it('o save parado na tela de sucessão volta a ser jogável: continua como Frankie, aos 15, com a história preservada', () => {
    const { v, frankie } = reneEFrankie();
    // O save como estava na tela de sucessão (antes do hotfix, a escolha ficava bloqueada).
    const salvo = JSON.stringify(v);
    const morta = reabrir(v);
    expect(JSON.stringify(morta)).toBe(salvo.length ? JSON.stringify(reabrir(morta)) : '');
    const s = sucessores(morta).find(x => x.pessoa.id === frankie)!;
    expect(s).toBeDefined();
    expect(s.idade).toBe(15);
    expect(s.laco).toBe('filha adotiva');
    expect(s.pode).toBe(true);
    expect(s.motivo).toBeUndefined();
    expect(s.guarda).toBeUndefined();
    expect(s.acolhimento).toMatch(/menor de idade.*decidida pela Justiça.*acompanhando a vida dela/);

    const antes = patrimonioTotal(morta);
    const r = continuarComo(morta, frankie);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    expect(n.morte).toBeUndefined();
    expect(n.eu.nome).toBe('Frankie');
    expect(idade(n)).toBe(15);
    expect(n.pessoas[frankie]).toBeUndefined();
    // René é o pai (adotivo) que morreu; a geração dele está na linhagem.
    const rene = Object.values(n.pessoas).find(p => p.nome === 'René' && !p.vivo)!;
    expect(rene).toBeDefined();
    expect(n.vinculos[rene.id].parentesco).toBe('pai');
    expect(n.linhagem!.geracoes[n.linhagem!.geracoes.length - 1].nome).toBe('René');
    expect(n.linhagem!.geracoes[n.linhagem!.geracoes.length - 1].sucessor!.nome).toBe('Frankie');
    expect(n.luto?.[0].pessoaId).toBe(rene.id);
    // A guarda: da Justiça, em Sydney, onde já vivia.
    expect(n.moradia).toMatchObject({ tipo: 'parente', municipioId: 'au:sydney', acolhimento: true });
    expect(n.moradia.anfitriaoId).toBeUndefined();
    expect(n.origem.responsavelId).toBeUndefined();
    expect(n.biografia.some(e => /Justiça da infância\. Ficou em acolhimento, em Sydney.*, acompanhada/.test(e.texto))).toBe(true);
    expect(n.biografia.some(e => /René, morreu aos 52/.test(e.texto))).toBe(true);
    // A herança: o apartamento e o dinheiro (tutelado até os 18), sem nada sumir nem dobrar.
    expect(n.financas.bens.filter(b => b.id === 'icasa').length).toBe(1);
    expect(n.financas.investimentos.find(x => x.tutelaAte)?.tutelaAte).toBe(n.eu.tNasc + 18 * 12);
    // O que sai do patrimônio são só os custos da transmissão (a regra do país).
    expect(patrimonioTotal(n)).toBe(antes - partilhar(morta, morta.morte!.decisoes).custos);
    expect(n.educacao.basica).toBeDefined();
    semReferenciasQuebradas(n);

    // Salvar e reabrir não muda nada — e não há como continuar (nem herdar) de novo.
    const n2 = reabrir(reabrir(n));
    expect(n2).toEqual(n);
    expect(continuarComo(n2, frankie).erro).toBeTruthy();
  });

  it('a vida avança três anos; na maioridade o acolhimento termina e ela vai para o apartamento herdado', () => {
    const { v, frankie } = reneEFrankie();
    let n = continuarComo(reabrir(v), frankie).vida;
    n = anos(n, 2);
    expect(n.morte).toBeUndefined();
    expect(idade(n)).toBe(17);
    expect(n.moradia.acolhimento).toBe(true);
    n = reabrir(n);
    n = anos(n, 2);
    expect(n.morte).toBeUndefined();
    expect(idade(n)).toBe(19);
    expect(n.moradia.acolhimento).toBeUndefined();
    expect(n.moradia.tipo).toBe('propria');
    expect(n.moradia.imovelId).toBe('icasa');
    expect(n.biografia.some(e => /o acolhimento terminou/.test(e.texto))).toBe(true);
    expect(n.financas.bens.filter(b => b.id === 'icasa').length).toBe(1);
    semReferenciasQuebradas(n);
    expect(reabrir(n)).toEqual(n);
  });
});

describe('REWORK 12.05 · regressões da sucessão de menores', () => {
  /** Um pai ou mãe de 45 em Recife, sem família viva, com um filho (ou filha) de `i` anos em casa. */
  function semFamilia(i: number, o: { adotado?: boolean; semente?: number } = {}) {
    const v = adulto(45, { semente: o.semente ?? 23, genero: 'feminino' });
    sozinho(v);
    const { p: f } = comFilho(v, i, { casa: i < 18, genero: 'masculino' });
    if (o.adotado) v.fatos[`adotado_${f.id}`] = v.t - 60;
    return { v, f };
  }
  const morrer = (v: Vida) => { v.morte = { t: v.t, causa: 'acidente', heranca: calcularHeranca(v) }; return v; };

  it('filho biológico de 15 sem adulto disponível: continua em acolhimento', () => {
    const { v, f } = semFamilia(15);
    const s = sucessores(morrer(v))[0];
    expect(s.laco).toBe('filho');
    expect(s.pode).toBe(true);
    const n = continuarComo(v, f.id).vida;
    expect(idade(n)).toBe(15);
    expect(n.moradia.acolhimento).toBe(true);
    expect(n.biografia.some(e => /Vara da Infância e da Juventude/.test(e.texto))).toBe(true);
  });

  it('filho adotivo tem o mesmo tratamento do biológico', () => {
    const { v, f } = semFamilia(15, { adotado: true });
    const s = sucessores(morrer(v))[0];
    expect(s.laco).toBe('filho adotivo');
    expect(s.pode).toBe(true);
    expect(continuarComo(v, f.id).vida.moradia.acolhimento).toBe(true);
  });

  it('criança de 8 com avó elegível: a guarda é da avó (o caminho antigo continua igual)', () => {
    const { v, f } = semFamilia(8);
    const { p: avo } = comParente(v, 'mae', 66, 'feminino', 70);
    const s = sucessores(morrer(v))[0];
    expect(s.guarda).toContain(avo.nome);
    expect(s.acolhimento).toBeUndefined();
    const n = continuarComo(v, f.id).vida;
    expect(n.origem.responsavelId).toBe(avo.id);
    expect(n.moradia).toMatchObject({ tipo: 'parente', anfitriaoId: avo.id });
    expect(n.moradia.acolhimento).toBeUndefined();
  });

  it('responsável inelegível (avó com 90) não recebe a guarda: acolhimento', () => {
    const { v, f } = semFamilia(10);
    comParente(v, 'mae', 90, 'feminino', 70);
    const n = continuarComo(morrer(v), f.id).vida;
    expect(n.moradia.acolhimento).toBe(true);
    expect(n.origem.responsavelId).toBeUndefined();
  });

  it('o outro genitor vivo é quem fica (família com dois responsáveis legais)', () => {
    const v = adulto(45, { semente: 21, genero: 'feminino' });
    const { p: par } = comParceiro(v, { idade: 46, estagio: 'casamento', anos: 15 });
    const { p: f } = comFilho(v, 12, { outroId: par.id, casa: true, genero: 'feminino' });
    v.vinculos[par.id].convivio = ['casa'];
    const n = continuarComo(morrer(v), f.id).vida;
    expect(n.moradia.tipo).toBe('pais');
    expect(n.moradia.acolhimento).toBeUndefined();
  });

  it('o outro genitor que já morreu não fica com a guarda', () => {
    const { v, f } = semFamilia(13);
    const outro = pessoaNova(v, 47, 'masculino');
    outro.vivo = false;
    f.genitores = ['eu', outro.id];
    vincular(v, outro, { origem: 'romance', proximidade: 10 });
    const n = continuarComo(morrer(v), f.id).vida;
    expect(n.moradia.acolhimento).toBe(true);
    semReferenciasQuebradas(n);
  });

  it('adolescente de 17 sem responsável: continua, e aos 18 o acolhimento termina', () => {
    const { v, f } = semFamilia(17);
    let n = continuarComo(morrer(v), f.id).vida;
    expect(n.moradia.acolhimento).toBe(true);
    n = anos(n, 2);
    expect(n.morte).toBeUndefined();
    expect(n.moradia.acolhimento).toBeUndefined();
    expect(['propria', 'aluguel', 'parente', 'republica', 'cedida']).toContain(n.moradia.tipo);
    semReferenciasQuebradas(n);
  });

  it('filho adulto de 20 continua sem guarda nem acolhimento', () => {
    const { v, f } = semFamilia(20);
    const s = sucessores(morrer(v))[0];
    expect(s.pode).toBe(true);
    expect(s.acolhimento).toBeUndefined();
    const n = continuarComo(v, f.id).vida;
    expect(n.moradia.acolhimento).toBeUndefined();
  });

  it('dois filhos, um menor e um adulto: os dois podem continuar; o irmão adulto fica com a guarda do menor', () => {
    const { v, f } = semFamilia(14);
    const { p: velha } = comFilho(v, 26, { casa: false, genero: 'feminino' });
    const lista = sucessores(morrer(v));
    expect(lista.map(x => x.pessoa.id)).toEqual([velha.id, f.id]);
    expect(lista.every(x => x.pode)).toBe(true);
    expect(lista[1].guarda).toContain(velha.nome);
    const n = continuarComo(v, f.id).vida;
    expect(n.origem.responsavelId).toBe(velha.id);
    expect(n.moradia.acolhimento).toBeUndefined();
  });

  it('enteado sem adoção não é sucessor (a regra de antes continua)', () => {
    const { v } = semFamilia(15);
    const enteado = pessoaNova(v, 12, 'masculino');
    vincular(v, enteado, { parentesco: 'enteado', origem: 'familia', proximidade: 70, convivio: ['casa'] });
    expect(sucessores(morrer(v)).some(x => x.pessoa.id === enteado.id)).toBe(false);
  });

  it('save com a morte registrada mas sem a partilha guardada (sucessão não iniciada): também continua', () => {
    const { v, f } = semFamilia(15);
    v.morte = { t: v.t, causa: 'acidente' };
    const morta = reabrir(v);
    const n = continuarComo(morta, f.id).vida;
    expect(n.moradia.acolhimento).toBe(true);
    expect(reabrir(n)).toEqual(n);
  });
});
