/**
 * REWORK 9.6 — A pessoa e seus registros (o motor).
 *
 * Fase B: o nascimento (o sorteio do mundo, os atributos ao acaso e escolhidos — gravados exatamente, sem mudar a
 * família sorteada). Fase C: os cinco atributos no motor — produzem diferença, nunca destino: inteligência ajuda a
 * aprender sem substituir o estudo; físico ajuda o esporte sem substituir a técnica; a saúde responde a doença, lesão,
 * atendimento e briga; a felicidade não é o dinheiro; a beleza não garante química; o envelhecimento depende da vida.
 */
import { describe, expect, it } from 'vitest';
import { sortearNascimento } from '../criacao';
import { criarRng } from '../rng';
import { avancarAno } from '../ano';
import { transacao, idade } from '../nucleo';
import { interpretar } from '../save';
import { nova, responderTudo, viverAte } from './ajuda';
import { ATRIBUTOS, predisposicao, valorDoAtributo, pesoDaAparenciaPara, type Atributo } from '../sistemas/predisposicao';
import { alvoCondicionamento, pisoDaPessoa } from '../sistemas/pessoa';
import { alvoHumor, fatoresHumor, fatoresSaude } from '../sistemas/estado';
import { calcularDesempenho } from '../sistemas/escola';
import { habilidade, praticar } from '../sistemas/frentes';
import { cuidarDaLesao, lesaoAtiva, lesionar, machucarNaBriga, processarLesoes } from '../sistemas/lesoes';
import { elegibilidade } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { riscoNoAno, modeloCondicao } from '../sistemas/corpo';
import type { Vida } from '../tipos';

const ESCOLHIDOS = (x: Partial<Record<Atributo, number>> = {}): Record<Atributo, number> => ({ saude: 86, fisico: 50, felicidade: 72, beleza: 55, inteligencia: 55, ...x });
const media = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const desvio = (xs: number[]) => { const m = media(xs); return Math.sqrt(media(xs.map(x => (x - m) ** 2))); };
const ano = (v: Vida) => { const n = responderTudo(avancarAno(v).vida); n.momento = null; return n; };

describe('Fase B · nascimento e atributos iniciais', () => {
  it('os atributos escolhidos são gravados EXATAMENTE — e a família, a cidade e a classe são as do mesmo nascimento ao acaso', () => {
    const acaso = nova({ semente: 901 });
    const esc = nova({ semente: 901, atributos: ESCOLHIDOS({ saude: 64, fisico: 88, felicidade: 30, beleza: 91, inteligencia: 22 }) });
    expect(ATRIBUTOS.map(a => valorDoAtributo(esc, a))).toEqual([64, 88, 30, 91, 22]);
    expect(esc.origem).toEqual(acaso.origem);
    expect(Object.values(esc.pessoas).map(p => p.nome)).toEqual(Object.values(acaso.pessoas).map(p => p.nome));
    expect(esc.eu.visual).toEqual(acaso.eu.visual);
    // e a predisposição que cada valor implica
    expect(predisposicao(esc, 'fisica')).toBeGreaterThan(0.9);
    expect(predisposicao(esc, 'cognitiva')).toBeLessThan(-0.9);
    expect(predisposicao(esc, 'animo')).toBeLessThan(-0.9);
    expect(esc.corpo.aparenciaBase).toBe(91);
  });

  it('ao acaso, cada pessoa nasce diferente (nenhum atributo preso no meio) — e extremos existem, raros', () => {
    const vs = Array.from({ length: 160 }, (_, k) => nova({ semente: 5000 + k * 7 }));
    for (const a of ATRIBUTOS) {
      const xs = vs.map(v => valorDoAtributo(v, a));
      expect(Math.max(...xs) - Math.min(...xs), a).toBeGreaterThan(18);
      for (const x of xs) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(100); }
    }
    expect(desvio(vs.map(v => v.corpo.forma))).toBeGreaterThan(8);
    expect(desvio(vs.map(v => v.mente.felicidade))).toBeGreaterThan(3);
  });

  it('o sorteio do mundo é meio a meio entre mulher e homem (e não volta sempre ao mesmo lugar)', () => {
    const r = criarRng(77);
    const ns = Array.from({ length: 1200 }, () => sortearNascimento(r));
    const f = ns.filter(n => n.genero === 'feminino').length / ns.length;
    expect(f).toBeGreaterThan(0.45);
    expect(f).toBeLessThan(0.55);
    const salvador = ns.filter(n => n.municipioId === 'salvador-ba').length;
    expect(salvador / ns.length).toBeLessThan(0.05);
  });

  it('salvar e abrir não sorteia de novo nada: a vida nascida com atributos escolhidos é a mesma', () => {
    const v = nova({ semente: 902, atributos: ESCOLHIDOS({ inteligencia: 90 }) });
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    expect((lido as { vida: Vida }).vida).toEqual(v);
  });

  it('migração: um save anterior (sem constituição nem temperamento) abre com os dois neutros — e não muda ao reabrir', () => {
    const v = viverAte(nova({ semente: 903 }), 12);
    const antigo = structuredClone(v);
    delete antigo.predisposicoes.saude; delete antigo.predisposicoes.animo;
    const a = interpretar(JSON.stringify(antigo));
    expect(a.tipo).toBe('ok');
    const va = (a as { vida: Vida }).vida;
    expect(predisposicao(va, 'saude')).toBe(0);
    expect(predisposicao(va, 'animo')).toBe(0);
    // os valores e a história não foram tocados
    for (const at of ATRIBUTOS) expect(valorDoAtributo(va, at)).toBe(valorDoAtributo(v, at));
    expect(va.biografia).toEqual(v.biografia);
    const b = interpretar(JSON.stringify(va));
    expect((b as { vida: Vida }).vida).toEqual(va);
  });
});

describe('Fase C · os atributos no motor: diferença, não destino', () => {
  it('inteligência ajuda a aprender, mas não substitui o estudo: a dedicada de inteligência baixa vai bem; a de inteligência alta que empurra, menos do que poderia', () => {
    const notas = (cog: number, postura: 'dedicada' | 'relaxada') => Array.from({ length: 24 }, (_, k) => {
      const v = transacao(viverAte(nova({ semente: 700 + k }), 11), x => { x.mente.cognicao = cog; x.educacao.postura = postura; }).vida;
      return calcularDesempenho(v, criarRng(k + 1), 0);
    });
    const baixaDedicada = media(notas(32, 'dedicada')), altaEmpurrando = media(notas(82, 'relaxada'));
    const altaDedicada = media(notas(82, 'dedicada')), baixaEmpurrando = media(notas(32, 'relaxada'));
    expect(altaDedicada).toBeGreaterThan(baixaDedicada); // a inteligência pesa…
    expect(baixaDedicada).toBeGreaterThan(baixaEmpurrando); // …e a dedicação também
    expect(altaDedicada).toBeGreaterThan(altaEmpurrando);
    // nenhum teto rígido: a de inteligência baixa e dedicada chega perto (ou passa) de quem tem facilidade e empurra
    expect(baixaDedicada).toBeGreaterThan(altaEmpurrando - 10);
    expect(baixaDedicada).toBeGreaterThan(45);
  });

  it('a escola exercita a inteligência devagar (sem ler nem estudar à parte), com teto — e a dedicação conta um pouco', () => {
    const cresce = (postura: 'dedicada' | 'relaxada') => { let v = transacao(viverAte(nova({ semente: 711 }), 7), x => { x.educacao.postura = postura; x.rotinas = []; }).vida; const c0 = v.mente.cognicao; for (let k = 0; k < 6; k++) { v = ano(v); v.educacao.postura = postura; v.rotinas = []; } return v.mente.cognicao - c0; };
    const d = cresce('dedicada'), r = cresce('relaxada');
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(8);
    expect(d).toBeGreaterThanOrEqual(r);
  });

  it('físico ajuda o esporte, mas não substitui a técnica: o franzino que treina joga melhor do que o forte que não treina', () => {
    const forte = transacao(viverAte(nova({ semente: 720, atributos: ESCOLHIDOS({ fisico: 85 }) }), 10), x => { x.rotinas = []; }).vida;
    const franzino = transacao(viverAte(nova({ semente: 720, atributos: ESCOLHIDOS({ fisico: 20 }) }), 10), x => { x.rotinas = [{ id: 'futebol', tInicio: x.t, nivel: 2 }]; }).vida;
    // o forte, sem treinar, tem mais corpo…
    expect(forte.corpo.forma).toBeGreaterThan(franzino.corpo.forma);
    // …mas a técnica é de quem treina: quatro anos de prática para o franzino, quase nada para o forte
    let a = forte, b = franzino;
    for (let k = 0; k < 4; k++) { const r = criarRng(30 + k); praticar(b, r, 'futebol', 1); praticar(a, r, 'futebol', 0.05); }
    expect(habilidade(b, 'futebol')).toBeGreaterThan(habilidade(a, 'futebol'));
    // e o mesmo treino rende mais no corpo que responde (a predisposição muda o quanto, não o quê)
    const t1 = transacao(forte, x => { x.rotinas = [{ id: 'futebol', tInicio: x.t, nivel: 2 }]; }).vida;
    expect(alvoCondicionamento(t1)).toBeGreaterThan(alvoCondicionamento(b));
    a = t1; void a;
  });

  it('a constituição: duas vidas iguais, uma forte e uma frágil — a saúde de referência e o risco de doença diferem; a idade pesa em ambas', () => {
    const forte = transacao(viverAte(nova({ semente: 730, atributos: ESCOLHIDOS({ saude: 98 }) }), 40), x => { x.corpo.saude = 75; x.corpo.condicoes = []; }).vida;
    const fragil = transacao(viverAte(nova({ semente: 730, atributos: ESCOLHIDOS({ saude: 62 }) }), 40), x => { x.corpo.saude = 75; x.corpo.condicoes = []; }).vida;
    const soma = (v: Vida) => fatoresSaude(v).reduce((s, f) => s + f.efeito, 0);
    expect(soma(forte)).toBeGreaterThan(soma(fragil));
    expect(fatoresSaude(forte).some(f => f.id === 'constituicao' && f.efeito > 0)).toBe(true);
    expect(fatoresSaude(fragil).some(f => f.id === 'constituicao' && f.efeito < 0)).toBe(true);
    const hip = modeloCondicao('hipertensao')!;
    expect(riscoNoAno(forte, hip)).toBeLessThan(riscoNoAno(fragil, hip));
  });

  it('saudável que adoece: a condição pesa na saúde enquanto dura; tratada, pesa menos — sem apagar a constituição', () => {
    const v = transacao(viverAte(nova({ semente: 731 }), 35), x => { x.corpo.condicoes = []; x.corpo.saude = 85; }).vida;
    const sem = fatoresSaude(v).reduce((s, f) => s + f.efeito, 0);
    const doente = transacao(v, x => { x.corpo.condicoes.push({ id: 'diabetes', nome: 'diabetes', tInicio: x.t, cronica: true, gravidade: 2, tratando: false }); }).vida;
    const tratada = transacao(doente, x => { x.corpo.condicoes[0].tratando = true; }).vida;
    const s = (w: Vida) => fatoresSaude(w).reduce((a, f) => a + f.efeito, 0);
    expect(s(doente)).toBeLessThan(sem);
    expect(s(tratada)).toBeGreaterThan(s(doente));
  });

  it('lesionado que procura atendimento × que não procura: a recuperação, a saúde e o risco de piorar diferem', () => {
    const base = viverAte(nova({ semente: 732 }), 22);
    const comCuidado = transacao(base, (x, r) => { lesionar(x, r, 2, 'pratica'); cuidarDaLesao(x, 'fisio', true); }).vida;
    const semCuidado = transacao(base, (x, r) => { lesionar(x, r, 2, 'pratica'); cuidarDaLesao(x, 'sacrificio', false); }).vida;
    const peso = (w: Vida) => fatoresSaude(w).find(f => f.id === 'condicao:lesao')!.efeito;
    expect(peso(semCuidado)).toBeLessThan(peso(comCuidado));
    // com fisioterapia, volta antes; no sacrifício, às vezes piora
    expect(lesaoAtiva(comCuidado)!.lesao.tFim).toBeLessThanOrEqual(lesaoAtiva(semCuidado)!.lesao.tFim);
    let pioras = 0;
    for (let k = 0; k < 40; k++) { const w = structuredClone(semCuidado); w.t += 12; processarLesoes(w, criarRng(100 + k)); if ((lesaoAtiva(w)?.lesao.recaidas ?? 0) > 0) pioras++; }
    expect(pioras).toBeGreaterThan(0);
    // a lesão não apaga a técnica: a habilidade continua a mesma
    expect(habilidade(semCuidado, 'futebol')).toBe(habilidade(base, 'futebol'));
  });

  it('briga: nem toda briga machuca, nenhuma machuca igual — e o machucado abre o cuidado (atendimento, repouso, ou nada)', () => {
    const base = viverAte(nova({ semente: 733 }), 16);
    const resultados = Array.from({ length: 60 }, (_, k) => { const w = structuredClone(base); w.corpo.condicoes = []; const antes = w.corpo.saude; const c = machucarNaBriga(w, criarRng(200 + k), 2); return { lesao: c?.lesao?.gravidade ?? 0, perda: antes - w.corpo.saude, decidir: w.fatos['lesao_decidir'] !== undefined, origem: c?.lesao?.origem }; });
    const machucou = resultados.filter(x => x.lesao > 0);
    expect(machucou.length).toBeGreaterThan(5);
    expect(machucou.length).toBeLessThan(55);
    expect(new Set(resultados.map(x => x.perda)).size).toBeGreaterThan(2);
    for (const m of machucou) { expect(m.decidir).toBe(true); expect(m.origem).toBe('briga'); }
    // a intensidade importa: um empurra-empurra machuca bem menos do que violência séria
    const taxa = (i: 1 | 3) => Array.from({ length: 60 }, (_, k) => { const w = structuredClone(base); w.corpo.condicoes = []; return machucarNaBriga(w, criarRng(400 + k), i) ? 1 : 0; }).reduce((s: number, x) => s + x, 0);
    expect(taxa(1)).toBeLessThan(taxa(3));
  });

  it('felicidade baixa apesar do dinheiro: o temperamento, a solidão e o luto pesam mais do que a folga', () => {
    const v = transacao(viverAte(nova({ semente: 734, atributos: ESCOLHIDOS({ felicidade: 40 }) }), 35), x => { x.financas.estilo = 'folgado'; x.financas.conta = 900000; }).vida;
    const f = fatoresHumor(v);
    expect(f.some(x => x.id === 'temperamento' && x.efeito < 0)).toBe(true);
    const folga = f.find(x => x.id === 'folga')?.efeito ?? 0;
    expect(folga).toBeLessThan(5);
    const animado = transacao(viverAte(nova({ semente: 734, atributos: ESCOLHIDOS({ felicidade: 90 }) }), 35), x => { x.financas.estilo = 'folgado'; x.financas.conta = 900000; }).vida;
    expect(alvoHumor(animado)).toBeGreaterThan(alvoHumor(v));
  });

  it('beleza não garante química: o peso da aparência é de quem olha (de quase nada a um pouco mais)', () => {
    const pesos = Array.from({ length: 200 }, (_, k) => pesoDaAparenciaPara(`npc-${k}`));
    expect(Math.min(...pesos)).toBeLessThan(0.4);
    expect(Math.max(...pesos)).toBeGreaterThan(1.3);
    // o efeito máximo da beleza 95 contra 50, para quem mais liga, é menor que o da compatibilidade (26 pontos)
    expect(((95 - 50) / 6) * Math.max(...pesos)).toBeLessThan(26);
  });

  it('o trabalho usa cada atributo onde ele é pedido: raciocínio na tecnologia, corpo na obra — não uma fórmula única', () => {
    const v = transacao(viverAte(nova({ semente: 735 }), 30), x => { x.educacao.escolaridade = 'medio'; x.trabalho.atual = undefined; }).vida;
    const chance = (w: Vida, id: string) => elegibilidade(w, ocupacao(id)).chance ?? 0;
    const esperta = transacao(v, x => { x.mente.cognicao = 85; }).vida;
    const forte = transacao(v, x => { x.corpo.forma = 85; }).vida;
    const ganhoEsperta = (id: string) => chance(esperta, id) - chance(v, id);
    const ganhoForte = (id: string) => chance(forte, id) - chance(v, id);
    expect(ganhoEsperta('aux_adm')).toBeGreaterThan(ganhoEsperta('ajudante_obras'));
    expect(ganhoForte('ajudante_obras')).toBeGreaterThan(ganhoForte('aux_adm'));
  });

  it('envelhecer depende da vida: aos 70, quem se mexe e tem constituição forte está melhor — e ninguém cai igual', () => {
    const ativo = transacao(viverAte(nova({ semente: 736, atributos: ESCOLHIDOS({ saude: 96, fisico: 70 }) }), 69), x => { x.rotinas = [{ id: 'corrida', tInicio: x.t - 60 }]; x.corpo.habitos.fuma = false; }).vida;
    const parado = transacao(viverAte(nova({ semente: 736, atributos: ESCOLHIDOS({ saude: 64, fisico: 30 }) }), 69), x => { x.rotinas = []; }).vida;
    if (ativo.morte || parado.morte) return; // (uma das duas pode não chegar aos 69: é a vida)
    expect(alvoCondicionamento(ativo)).toBeGreaterThan(alvoCondicionamento(parado));
    expect(pisoDaPessoa(ativo)).toBeGreaterThan(pisoDaPessoa(parado));
    expect(idade(ativo)).toBe(69);
  });
});
