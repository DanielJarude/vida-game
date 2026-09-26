/**
 * FIX #4 (pós-playtest humano): o que entra na vida continua existindo para
 * as outras pessoas e para os outros sistemas — a morte chega a quem amava,
 * o negócio sustenta quem é dono, o carro muda o deslocamento, o dinheiro
 * aplicado existe quando se precisa dele, a eleição se explica, a meia-idade
 * nasce do que foi vivido.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exportarVida, importarVida, interpretar, VERSAO_SAVE } from '../save';
import { nomeDoVeiculo } from '../sistemas/veiculos';
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
import { NEGOCIOS } from '../dados/negocios';
import { abrirNegocio, contaDoAno, passarParaHorasVagas, processarNegocio } from '../sistemas/negocio';
import { orcamento, processarDinheiro } from '../sistemas/dinheiro';
import { liquido } from '../sistemas/renda';
import { acoesDoTrabalho, leituraDoTrabalho, modoDoTrabalho } from '../sistemas/profissao';
import { disponibilidade } from '../acoes';
import { fatoresHumor } from '../sistemas/estado';
import { deslocamento } from '../sistemas/transporte';
import { semana } from '../sistemas/semana';
import { executar } from '../acoes';
import type { Veiculo } from '../tipos';
import type { Acao } from '../acoes';
import { aplicar, totalAplicado } from '../sistemas/investimentos';
import { capacidade, vereditoDePagar } from '../sistemas/dinheiro';
import { podeTentar } from '../plausibilidade';
import { abrirDecisao } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import type { CargoEletivo } from '../tipos';
import { chanceDeVitoria, entrarNaPolitica, fatoresDaEleicao, leituraPolitica, perderMandatoPorPrisao, perspectiva, podeConcorrer, processarPolitica, proximaEleicao, regraDaTroca, registrarCandidatura, tDaPosse, trocarDePartido } from '../sistemas/politica';
import { iniciarCaso, reacaoATraicao } from '../sistemas/romance';
import { processarExposicao, tornarPublico } from '../sistemas/exposicao';
import { abrirProcesso } from '../sistemas/justica';
import { analisarEntrada, propor, resolverPendente } from '../sistemas/compromissos';
import { opcoesDeCurso } from '../sistemas/escola';

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

/* ======================================================= 2. O negócio */

describe('negócio próprio é trabalho de verdade', () => {
  function dono(tipo = 'salao', clientela = 60, dedicacao: 'integral' | 'paralela' = 'integral') {
    const v = adulto(35, { semente: 9, municipioId: 'salvador-ba' });
    v.financas.conta = 400000;
    return transacao(v, (x, r) => {
      const t = NEGOCIOS.find(k => k.id === tipo)!;
      for (const tr of t.trilhas) x.trabalho.experiencia[tr] = 200;
      const n = abrirNegocio(x, r, tipo, { modo: 'guardado', dedicacao });
      n.clientela = clientela;
      if (x.trabalho.atual) x.trabalho.atual.clientela = clientela;
    }).vida;
  }

  it('a conta fecha: faturamento − custos = lucro; lucro − sócio − retirada = o que ficou no caixa', () => {
    for (const t of NEGOCIOS) {
      const v = dono(t.id, 55);
      const k = contaDoAno(v, v.caminhos.negocio!);
      expect(k.faturamento).toBeGreaterThan(k.lucro);
      expect(Math.abs(k.lucro - k.socio - k.retirada - k.resultado)).toBeLessThanOrEqual(200);
    }
  });

  it('um negócio que vai bem paga o dono; um vazio dá prejuízo (todos os tipos)', () => {
    for (const t of NEGOCIOS) {
      const bem = dono(t.id, 65);
      const vazio = dono(t.id, 3);
      expect(contaDoAno(bem, bem.caminhos.negocio!).retirada).toBeGreaterThan(20000);
      expect(contaDoAno(vazio, vazio.caminhos.negocio!).lucro).toBeLessThan(0);
      expect(contaDoAno(vazio, vazio.caminhos.negocio!).retirada).toBe(0);
    }
  });

  it('a retirada do ano vira renda pessoal: é ela que entra na conta como "Retirada do negócio"', () => {
    let v = dono('salao', 60);
    v = transacao(v, (x, r) => { x.t += 12; processarNegocio(x, r); }).vida;
    const n = v.caminhos.negocio!;
    expect(n.retiradaAno).toBeGreaterThan(0);
    expect(v.trabalho.atual!.salario * 12).toBe(n.retiradaAno);
    const linha = orcamento(v).entradas.find(l => l.rotulo === 'Retirada do negócio')!;
    expect(linha.valor).toBeGreaterThan(0);
    expect(linha.valor).toBe(Math.round(liquido(v.trabalho.atual!.salario, 'autonomo')));
  });

  it('prejuízo que sai do bolso aparece na conta do ano (toda vez, não só a cada três anos)', () => {
    let v = dono('lanchonete', 2);
    for (let k = 0; k < 2; k++) {
      v = transacao(v, (x, r) => { x.t += 12; x.financas.conta = 400000; x.caminhos.negocio!.clientela = 2; if (x.trabalho.atual) x.trabalho.atual.clientela = 2; processarNegocio(x, r); processarDinheiro(x, r); }).vida;
      expect(v.caminhos.negocio!.devolvidoAno).toBeGreaterThan(0);
      expect(v.financas.razao.some(l => /Prejuízo de .* coberto do seu bolso/.test(l.rotulo))).toBe(true);
    }
  });

  it('dono dedicado não é tratado como desempregado: nada de "ver vagas" em destaque', () => {
    const v = dono('salao', 60);
    expect(modoDoTrabalho(v)).toBe('negocio');
    const a = acoesDoTrabalho(v, disponibilidade);
    expect([...a.agora, ...a.mais].some(x => x.id === 'vagas')).toBe(false);
  });

  it('quem passou o negócio para as horas vagas e ficou sem outro trabalho é dono, não desempregado', () => {
    let v = dono('salao', 60);
    v = transacao(v, x => { passarParaHorasVagas(x, x.caminhos.negocio!); }).vida;
    expect(v.trabalho.atual).toBeUndefined();
    expect(v.trabalho.desempregadoDesde).toBeUndefined();
    expect(modoDoTrabalho(v)).toBe('negocio');
    const l = leituraDoTrabalho(v);
    expect(l.titulo).toBe(v.caminhos.negocio!.nome);
    const a = acoesDoTrabalho(v, disponibilidade);
    expect(a.agora.some(x => x.id === 'dedicacao')).toBe(true);
    expect(a.agora.some(x => x.id === 'vagas')).toBe(false);
    expect([...a.agora, ...a.mais].find(x => x.id === 'outras')?.peso).toBeLessThanOrEqual(1);
    expect(fatoresHumor(v).some(f => f.id === 'sem_trabalho')).toBe(false);
  });

  it('o negócio paralelo segue sem retirada fixa (a distinção do FIX #3)', () => {
    const v = dono('loja_online', 50, 'paralela');
    expect(contaDoAno(v, v.caminhos.negocio!).retirada).toBe(0);
  });
});

/* ===================================================== 3. Deslocamento */

describe('o que se possui muda o trajeto de todo dia', () => {
  function trabalhadora(municipioId = 'campina-grande-pb') {
    const v = adulto(30, { semente: 41, municipioId });
    v.trabalho.atual = { ocupacaoId: 'vendedor', empregador: 'uma loja', contrato: 'clt', salario: 2600, tInicio: v.t - 24, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral' };
    v.financas.bens = [];
    v.deslocamento = undefined;
    return v;
  }
  const carro = (v: ReturnType<typeof trabalhadora>, extra: Partial<Veiculo> = {}) => v.financas.bens.push({ id: `v${v.seq++}`, tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'Chevrolet Onix', valor: 70000, tCompra: v.t, estado: 80, anoFabricacao: Math.floor(v.t / 12) - 2, ...extra } as Veiculo);

  it('sem veículo: transporte público, com passagem no orçamento e o trajeto na semana', () => {
    const v = trabalhadora();
    const d = deslocamento(v)!;
    expect(d.modo).toBe('publico');
    expect(semana(v).fixos.find(f => f.id === 'deslocamento')?.rotulo).toMatch(/ônibus/);
    expect(orcamento(v).saidas.some(l => /Passagem/.test(l.rotulo))).toBe(true);
  });

  it('com carro e carteira: vai de carro, menos tempo na semana, sem passagem (e o combustível entra)', () => {
    const v = trabalhadora();
    const antes = deslocamento(v)!;
    carro(v);
    v.trabalho.licencas.push('cnh');
    const d = deslocamento(v)!;
    expect(d.modo).toBe('carro');
    expect(d.minutos).toBeLessThan(antes.minutos);
    expect(semana(v).fixos.find(f => f.id === 'deslocamento')!.rotulo).toMatch(/de carro \(Chevrolet Onix\)/);
    expect(semana(v).capacidade).toBeGreaterThan(semana(trabalhadora()).capacidade);
    expect(orcamento(v).saidas.some(l => /Passagem/.test(l.rotulo))).toBe(false);
    expect(orcamento(v).saidas.some(l => /combustível/.test(l.rotulo))).toBe(true);
  });

  it('carro sem carteira, parado ou quebrado não leva ninguém — e a tela diz por quê', () => {
    const semCnh = trabalhadora(); carro(semCnh);
    expect(deslocamento(semCnh)!.modo).toBe('publico');
    expect(deslocamento(semCnh)!.motivo).toMatch(/carteira/);
    const parado = trabalhadora(); carro(parado, { parado: true }); parado.trabalho.licencas.push('cnh');
    expect(deslocamento(parado)!.modo).toBe('publico');
    expect(deslocamento(parado)!.motivo).toMatch(/parado/);
  });

  it('bicicleta e moto mudam a vida; na metrópole, a bicicleta não faz o trajeto', () => {
    const v = trabalhadora();
    v.financas.bens.push({ id: 'b1', tipo: 'veiculo', modeloId: 'bike', nome: 'Caloi 10', valor: 1200, tCompra: v.t, estado: 90 } as Veiculo);
    expect(deslocamento(v)!.modo).toBe('bicicleta');
    expect(orcamento(v).saidas.some(l => /Passagem/.test(l.rotulo))).toBe(false);
    const sp = trabalhadora('sao-paulo-sp');
    sp.financas.bens.push({ id: 'b1', tipo: 'veiculo', modeloId: 'bike', nome: 'Caloi 10', valor: 1200, tCompra: sp.t, estado: 90 } as Veiculo);
    expect(deslocamento(sp)!.modo).toBe('publico');
    const m = trabalhadora(); m.trabalho.licencas.push('cnh');
    m.financas.bens.push({ id: 'm1', tipo: 'veiculo', modeloId: 'moto_pequena', nome: 'Honda CG 160', valor: 17000, tCompra: m.t, estado: 90 } as Veiculo);
    expect(deslocamento(m)!.modo).toBe('moto');
  });

  it('o jogador pode preferir outro jeito (o ônibus, para poupar o carro); a escolha diz a diferença', () => {
    let v = trabalhadora(); carro(v); v.trabalho.licencas.push('cnh');
    const r = executar(v, { tipo: 'deslocamento', modo: 'publico' });
    v = r.vida;
    expect(deslocamento(v)!.modo).toBe('publico');
    expect(r.aviso?.texto).toMatch(/minutos a mais/);
    // O carro que ficou para o fim de semana gasta menos combustível.
    const comb = (x: typeof v) => -(orcamento(x).saidas.find(l => /combustível/.test(l.rotulo))?.valor ?? 0);
    const noCarro = transacao(v, x => { x.deslocamento = undefined; }).vida;
    expect(comb(v)).toBeLessThan(comb(noCarro));
    v = executar(v, { tipo: 'deslocamento', modo: 'auto' }).vida;
    expect(deslocamento(v)!.modo).toBe('carro');
  });

  it('quem trabalha em casa não tem trajeto; sem trabalho nem estudo presencial, também não', () => {
    const v = trabalhadora();
    v.trabalho.atual = undefined;
    expect(deslocamento(v)).toBeUndefined();
    expect(semana(v).fixos.some(f => f.id === 'deslocamento')).toBe(false);
    expect(orcamento(v).saidas.some(l => /Passagem/.test(l.rotulo))).toBe(false);
  });
});

/* ================================================= 6. Liquidez */

describe('patrimônio aplicado existe quando se precisa dele', () => {
  function rico() {
    const v = adulto(45, { semente: 57 });
    v.financas.conta = 2000;
    v.financas.investimentos = [];
    transacao(v, () => {}); // nada
    v.financas.conta = 1_002_000;
    const x = transacao(v, xv => { aplicar(xv, 'pos_fixado', 1_000_000); }).vida;
    return x;
  }

  it('R$ 1 milhão aplicado e R$ 2 mil na conta: não é "sem dinheiro" — é dinheiro que não está na conta', () => {
    const v = rico();
    expect(v.financas.conta).toBe(2000);
    const k = capacidade(v, 30000);
    expect(k.situacao).toBe('resgatando');
    const d = vereditoDePagar(v, 30000, 'A mudança custa');
    expect(d.grau).toBe('requisito');
    expect(d.resgate?.valor).toBe(28000);
    expect(d.motivo).toMatch(/na conta há/);
    expect(d.motivo).toMatch(/aplicações/);
    expect(d.motivo).not.toMatch(/não tem|sem dinheiro/i);
  });

  it('sem patrimônio suficiente, a frase é outra: soma conta e aplicações', () => {
    const v = rico();
    const d = vereditoDePagar(v, 5_000_000);
    expect(d.resgate).toBeUndefined();
    expect(d.motivo).toMatch(/somando conta e aplicações/);
  });

  it('nada é vendido sem consentimento: a ação bloqueia, e "tirar das aplicações e pagar" faz as duas coisas', () => {
    let v = rico();
    const cnh: Acao = { tipo: 'cnh' };
    v.trabalho.licencas = [];
    v.financas.conta = 100;
    expect(podeTentar(disponibilidade(v, cnh))).toBe(false);
    expect(disponibilidade(v, cnh).resgate).toBeDefined();
    const antes = totalAplicado(v);
    const falhou = executar(v, cnh);
    expect(totalAplicado(falhou.vida)).toBe(antes);
    const r = executar(v, { tipo: 'resgatar_e', acao: cnh });
    v = r.vida;
    expect(v.processos.some(p => p.tipo === 'cnh')).toBe(true);
    expect(totalAplicado(v)).toBeLessThan(antes);
    expect(v.biografia.some(e => /Tirou .* das aplicações/.test(e.texto))).toBe(true);
  });

  it('numa decisão, a opção que custa mostra o resgate; escolher com resgate tira e segue', () => {
    let v = rico();
    v.financas.conta = 100;
    const par = comParceiro(v, { estagio: 'casamento', anos: 10 }).p;
    par.aperto = undefined;
    v.vinculos[par.id].tensao = 50;
    const d = conteudoPorId('rom_crise')!;
    if (d.tipo !== 'decisao') throw new Error('rom_crise deveria ser decisão');
    v = transacao(v, (x, r) => { abrirDecisao(x, d, contexto(x, r, { pessoa: x.pessoas[par.id] })); }).vida;
    const op = v.momento!.opcoes.find(o => o.id === 'terapia');
    expect(op?.bloqueio).toBeTruthy();
    expect(op?.resgate).toBeGreaterThan(0);
    const antes = totalAplicado(v);
    v = executar(v, { tipo: 'decidir', opcaoId: 'terapia', resgatar: true }).vida;
    expect(v.momento?.situacaoId).not.toBe('rom_crise');
    expect(totalAplicado(v)).toBeLessThan(antes);
  });

  it('o rendimento existe e é dito: um milhão aplicado rende e aparece na conta do ano', () => {
    let v = rico();
    v = avancarAno(v).vida;
    const linha = v.financas.razao.find(l => l.rotulo === 'Valorização das aplicações');
    expect(linha).toBeDefined();
    expect(Math.abs(linha!.valor)).toBeGreaterThan(1000);
  });

  it('o ano que fecha no vermelho e é coberto pelas aplicações fica escrito (não é venda silenciosa)', () => {
    let v = rico();
    v = transacao(v, (x, r) => { x.financas.conta = -20000; x.t += 12; processarDinheiro(x, r); }).vida;
    expect(v.financas.razao.some(l => l.rotulo === 'Tirado das aplicações para cobrir o ano')).toBe(true);
    expect(v.biografia.some(e => /saíram .* das aplicações para cobrir/.test(e.texto))).toBe(true);
  });

  it('negócio não fecha "por dívida" com um milhão aplicado', () => {
    let v = adulto(40, { semente: 9, municipioId: 'salvador-ba' });
    v.financas.conta = 1_300_000;
    v = transacao(v, (x, r) => { abrirNegocio(x, r, 'lanchonete', { modo: 'guardado' }); aplicar(x, 'pos_fixado', Math.max(0, x.financas.conta - 1000)); }).vida;
    v = transacao(v, (x, r) => { x.financas.conta = -30000; x.caminhos.negocio!.clientela = 2; if (x.trabalho.atual) x.trabalho.atual.clientela = 2; x.t += 12; processarNegocio(x, r); }).vida;
    expect(v.caminhos.negocio!.estado).not.toBe('fechado');
  });
});

/* ======================================================= 4–5. Política */

const ultimo = <T,>(l: T[]): T => l[l.length - 1];

describe('política: eleição explicável, troca de partido, vida privada × pública', () => {
  function politico(municipioId = 'recife-pe', apoio = 70) {
    const v = adulto(40, { semente: 5, municipioId });
    return transacao(v, x => {
      const p = entrarNaPolitica(x, 'comunidade');
      p.partido = 'PSD'; p.tFiliacao = x.t - 36; p.apoio = apoio; p.reputacao = 45; p.desgaste = 10; p.fase = 'filiado';
      x.fatos['pol_partido_porte'] = 2;
    }).vida;
  }
  function comMandato(v: ReturnType<typeof politico>, cargo: CargoEletivo, anosAteOFim: number) {
    return transacao(v, x => {
      const p = x.caminhos.politica!;
      p.fase = 'mandato';
      p.mandato = { cargo, tInicio: x.t - 12, tFim: x.t + anosAteOFim * 12, aprovacao: 55, feito: 0 };
      p.consecutivos = 1;
      x.trabalho.atual = { ocupacaoId: cargo, empregador: 'a Câmara', contrato: 'eletivo', salario: 12000, tInicio: x.t - 12, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral' };
    }).vida;
  }

  it('a chance é a soma dos fatores guardados — e a explicação cita os que mais pesaram', () => {
    let v = politico('sao-paulo-sp', 45);
    const e = proximaEleicao(v.t, 'municipal');
    v = transacao(v, x => { registrarCandidatura(x, 'vereador', e.t); x.caminhos.politica!.campanha!.nota = 6; }).vida;
    const conta = fatoresDaEleicao(v, 'vereador', e.t);
    const x = conta.fatores.reduce((s, k) => s + k.valor, 0);
    expect(conta.chance).toBeCloseTo(1 / (1 + Math.exp(-x / 7)), 6);
    expect(chanceDeVitoria(v, 'vereador', e.t)).toBeCloseTo(conta.chance, 6);
    v = transacao(v, (y, r) => { y.t = e.t; processarPolitica(y, r); }).vida;
    const h = ultimo(v.caminhos.politica!.historico)!;
    expect(h.fatores?.length).toBeGreaterThan(3);
    expect(h.chance).toBeDefined();
    const linha = ultimo(v.biografia.filter(b => /se elegeu|Eleit/.test(b.texto)));
    // O maior peso contra numa metrópole é a disputa: a explicação diz isso.
    const pior = [...h.fatores!].sort((a, b) => a.valor - b.valor)[0];
    expect(pior.id).toBe('disputa');
    expect(linha.texto).toMatch(/Contra: .*(candidatos por vaga|disputa)/);
    expect(linha.texto).toMatch(/A favor: /);
    // O partido pequeno aqui pesou contra, e isso é dito.
    expect(h.fatores!.find(k => k.id === 'partido')!.valor).toBeLessThan(0);
  });

  it('antes de concorrer, a opção diz como estaria hoje (com os mesmos fatores)', () => {
    const v = politico('campina-grande-pb', 70);
    const e = proximaEleicao(v.t, 'municipal');
    const txt = perspectiva(v, 'vereador', e.t);
    expect(txt).toMatch(/^Hoje, (favorito|com boa chance|disputado|azarão|quase sem chance)/);
    expect(txt).toMatch(/A favor: /);
  });

  it('trocar de partido sem mandato: livre, com custo na base e histórico', () => {
    let v = politico();
    const apoio = v.caminhos.politica!.apoio;
    expect(disponibilidade(v, { tipo: 'politica', oque: 'trocar_partido' } as Acao).grau).toBe('permitido');
    v = transacao(v, (x, r) => { trocarDePartido(x, r, 'MDB', 0); }).vida;
    const p = v.caminhos.politica!;
    expect(p.partido).toBe('MDB');
    expect(p.tFiliacao).toBe(v.t);
    expect(p.apoio).toBeLessThan(apoio);
    expect(p.partidos?.find(x => x.sigla === 'PSD')?.tFim).toBe(v.t);
    expect(ultimo(v.biografia)!.texto).toMatch(/Deixou o PSD e filiou-se ao MDB/);
    expect(leituraPolitica(v)!.partidos).toMatch(/PSD/);
    // A filiação nova conta do zero para os seis meses.
    const e = proximaEleicao(v.t);
    if (e.t - v.t < 6) expect(podeTentar(podeConcorrer(v, e.tipo === 'municipal' ? 'vereador' : 'deputado_estadual', e.t))).toBe(false);
  });

  it('prefeito troca e fica com o mandato (majoritário); vereador fora da janela arrisca a cadeira; na janela, não', () => {
    const prefeito = comMandato(politico(), 'prefeito', 3);
    expect(regraDaTroca(prefeito).como).toBe('majoritario');
    for (let s = 1; s <= 8; s++) {
      const depois = transacao(prefeito, x => { trocarDePartido(x, criarRng(s), 'MDB', 1); }).vida;
      expect(depois.caminhos.politica!.mandato).toBeDefined();
    }
    const vereador = comMandato(politico(), 'vereador', 3);
    expect(regraDaTroca(vereador).como).toBe('fora_da_janela');
    expect(disponibilidade(vereador, { tipo: 'politica', oque: 'trocar_partido' } as Acao).grau).toBe('irregular');
    let perdeu = 0;
    for (let s = 1; s <= 20; s++) { const d = transacao(vereador, x => { trocarDePartido(x, criarRng(s), 'MDB', 1); }).vida; if (!d.caminhos.politica!.mandato) { perdeu++; expect(d.biografia.some(b => /janela partidária/.test(b.texto))).toBe(true); } }
    expect(perdeu).toBeGreaterThan(5);
    // Na janela (último ano do mandato, com eleição chegando), a troca é segura.
    const e = proximaEleicao(vereador.t, 'municipal');
    const naJanela = transacao(vereador, x => { x.t = e.t - 7; x.caminhos.politica!.mandato!.tFim = tDaPosse(e.ano); }).vida;
    expect(regraDaTroca(naJanela).como).toBe('janela');
    for (let s = 1; s <= 8; s++) expect(transacao(naJanela, x => { trocarDePartido(x, criarRng(s), 'MDB', 1); }).vida.caminhos.politica!.mandato).toBeDefined();
  });

  it('uma traição secreta não mexe em voto; só depois de pública vira fator da eleição', () => {
    let v = comMandato(politico('recife-pe', 70), 'vereador', 1);
    const par = comParceiro(v, { estagio: 'casamento', anos: 12, genero: 'feminino' }).p;
    const amante = pessoaNova(v, 35, 'feminino');
    vincular(v, amante, { origem: 'trabalho', proximidade: 50, estagio: 'amigo' });
    v = transacao(v, x => { iniciarCaso(x, x.pessoas[amante.id], x.vinculos[amante.id]); }).vida;
    const e = proximaEleicao(v.t, 'municipal');
    const antes = fatoresDaEleicao(v, 'vereador', e.t).fatores;
    expect(antes.some(k => k.id === 'escandalo')).toBe(false);
    expect(v.segredos?.some(s => s.tipo === 'caso' && !s.publico)).toBe(true);
    // A parceria descobre: é assunto da casa, ainda não da cidade.
    v = transacao(v, (x, r) => { reacaoATraicao(x, r, x.pessoas[par.id], x.vinculos[par.id], false); }).vida;
    expect(v.segredos!.find(s => s.tipo === 'caso')!.quemSabe).toContain(par.id);
    expect(fatoresDaEleicao(v, 'vereador', e.t).fatores.some(k => k.id === 'escandalo')).toBe(false);
    // Vazou: agora pesa, e a vida pública pergunta o que fazer.
    v = transacao(v, x => { tornarPublico(x, x.segredos!.find(s => s.tipo === 'caso')!); }).vida;
    const depois = fatoresDaEleicao(v, 'vereador', e.t).fatores;
    expect(depois.find(k => k.id === 'escandalo')!.valor).toBeLessThan(0);
    expect(conteudoPorId('pol_escandalo')).toBeDefined();
    expect(preparar(conteudoPorId('pol_escandalo')!, v, criarRng(1))).not.toBeNull();
    // Pedir desculpas pesa menos que negar.
    const desc = transacao(v, x => { x.caminhos.politica!.escandalo!.resposta = 'desculpas'; }).vida;
    const neg = transacao(v, x => { x.caminhos.politica!.escandalo!.resposta = 'negou'; }).vida;
    const peso = (y: typeof v) => fatoresDaEleicao(y, 'vereador', e.t).fatores.find(k => k.id === 'escandalo')!.valor;
    expect(peso(desc)).toBeGreaterThan(peso(neg));
  });

  it('um caso que ninguém fora da casa sabe, numa vida sem nome público, não vira notícia', () => {
    let v = adulto(40, { semente: 8 });
    const amante = pessoaNova(v, 35, 'masculino');
    vincular(v, amante, { origem: 'trabalho', proximidade: 50, estagio: 'amigo' });
    comParceiro(v, { estagio: 'casamento', anos: 10 });
    v = transacao(v, x => { iniciarCaso(x, x.pessoas[amante.id], x.vinculos[amante.id]); }).vida;
    for (let s = 1; s <= 30; s++) v = transacao(v, x => { processarExposicao(x, criarRng(s)); }).vida;
    expect(v.segredos?.find(s => s.tipo === 'caso')?.publico ?? 0).toBeLessThanOrEqual(0);
  });

  it('preso não segue com o mandato (antes, o cargo continuava "vivo" na cela)', () => {
    let v = comMandato(politico(), 'vereador', 2);
    v = transacao(v, (x, r) => { abrirProcesso(x, r, 'fraude'); if (!x.justica?.prisao) perderMandatoPorPrisao(x, 'pena'); }).vida;
    if (v.justica?.prisao) expect(v.caminhos.politica!.mandato).toBeUndefined();
    const preso = transacao(comMandato(politico(), 'vereador', 2), x => { perderMandatoPorPrisao(x, 'pena'); }).vida;
    expect(preso.caminhos.politica!.mandato).toBeUndefined();
    expect(ultimo(preso.caminhos.politica!.historico)!.resultado).toBe('cassado');
  });
});

/* =================================================== 10. Curso integral */

describe('curso integral × trabalho integral passa por propor()', () => {
  function trabalhando(carga: 'integral' | 'parcial' = 'integral') {
    const v = adulto(24, { semente: 12, municipioId: 'recife-pe' });
    v.educacao.escolaridade = 'medio';
    v.educacao.matricula = undefined;
    v.trabalho.atual = { ocupacaoId: 'vendedor', empregador: 'uma loja', contrato: 'clt', salario: 2600, tInicio: v.t - 24, desempenho: 60, municipioId: v.moradia.municipioId, carga };
    return v;
  }
  const integral = (v: ReturnType<typeof trabalhando>, cursoId = 'eng_civil') => ({ tipo: 'curso' as const, cursoId, via: 'privada', modalidade: 'presencial' as const, rede: 'privada' as const, mensalidade: 1500, municipioId: v.moradia.municipioId, instituicao: 'uma faculdade particular em Recife' });

  it('pergunta ANTES: matricular-se e deixar o trabalho, ou não fazer a matrícula — cada plano diz a consequência', () => {
    const v = trabalhando();
    const { vida } = transacao(v, (x, r) => { expect(propor(x, r, integral(x))).toBe('pendente'); });
    const p = vida.caminhos.pendente!;
    expect(vida.educacao.matricula).toBeUndefined();
    expect(p.planos.map(x => x.texto)).toEqual(expect.arrayContaining([expect.stringMatching(/^Matricular-se e deixar o trabalho de/), 'Não fazer a matrícula']));
    for (const pl of p.planos) expect(pl.consequencias.length).toBeGreaterThan(0);
    expect(p.planos.some(pl => pl.conciliar)).toBe(false);
  });

  it('escolher estudar deixa o emprego com o motivo; recusar mantém o emprego e registra', () => {
    const v = trabalhando();
    const aberto = transacao(v, (x, r) => { propor(x, r, integral(x)); }).vida;
    const aceita = transacao(aberto, (x, r) => { resolverPendente(x, r, 0); }).vida;
    expect(aceita.educacao.matricula?.cursoId).toBe('eng_civil');
    expect(aceita.trabalho.atual).toBeUndefined();
    expect(aceita.biografia.some(e => /Deixou o trabalho de .* para cursar/.test(e.texto))).toBe(true);
    const recusa = transacao(aberto, (x, r) => { resolverPendente(x, r, x.caminhos.pendente!.planos.findIndex(q => q.recusa)); }).vida;
    expect(recusa.educacao.matricula).toBeUndefined();
    expect(recusa.trabalho.atual).toBeDefined();
    expect(recusa.biografia.some(e => /não fez a matrícula/.test(e.texto))).toBe(true);
  });

  it('curso noturno, EAD ou trabalho de meio período: sem conflito (ou com o plano de conciliar, só onde é plausível)', () => {
    const v = trabalhando();
    expect(analisarEntrada(v, { ...integral(v, 'administracao') }).length).toBe(0);
    expect(analisarEntrada(v, { ...integral(v), modalidade: 'ead' }).length).toBe(0);
    const meio = trabalhando('parcial');
    const c = analisarEntrada(meio, integral(meio));
    expect(c.length).toBe(1);
    expect(c[0].alternativas.some(a => a.conciliar)).toBe(true);
  });

  it('pela ação de matrícula: aprovado, a pergunta abre na hora (não é a semana que acusa depois)', () => {
    let v = trabalhando();
    v.educacao.enem = [{ t: v.t, nota: 820 }];
    v.financas.conta = 50000;
    const ops = opcoesDeCurso(v);
    const k = ops.findIndex(o => o.curso.carga === 'integral' && o.modalidade === 'presencial' && o.municipioId === v.moradia.municipioId && podeTentar(o.veredito) && (o.veredito.chance ?? 1) > 0.5);
    expect(k).toBeGreaterThanOrEqual(0);
    for (let s = 0; s < 6 && !v.caminhos.pendente && !v.educacao.matricula; s++) v = executar(transacao(v, x => { x.rng = 1000 + s; delete x.fatos[`tentou_${ops[k].curso.id}_${Math.floor(x.t / 12)}`]; }).vida, { tipo: 'matricular', indice: k }).vida;
    expect(v.educacao.matricula).toBeUndefined();
    expect(v.momento?.situacaoId).toBe('comp_conflito');
    expect(v.trabalho.atual).toBeDefined();
  });

  it('voltar a um curso integral trancado, com emprego integral, também pergunta', () => {
    let v = trabalhando();
    v.educacao.matricula = { cursoId: 'eng_civil', instituicao: 'uma faculdade', rede: 'privada', modalidade: 'presencial', tInicio: v.t - 24, mesesRestantes: 30, mensalidade: 1500, desempenho: 60, trancado: true, tTrancou: v.t - 12, municipioId: v.moradia.municipioId };
    v = executar(v, { tipo: 'destrancar' }).vida;
    expect(v.educacao.matricula!.trancado).toBe(true);
    expect(v.momento?.situacaoId).toBe('comp_conflito');
  });
});

/* ======================================================= 17. Save v14 */

describe('save v13 → v14 com saves reais da base do Playtest #4', () => {
  const ler = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
  for (const nome of ['save-v13-salao-carro.json', 'save-v13-politica.json', 'save-v13-investidor.json', 'save-v12-loja-online.json', 'save-v12-politica.json', 'save-v12-soldado.json']) {
    it(`${nome}: migra, valida, segue vivendo, exporta e importa`, () => {
      const res = interpretar(ler(nome));
      expect(res.tipo).toBe('ok');
      if (res.tipo !== 'ok') return;
      expect(res.migrado).toBe(true);
      let v = res.vida;
      expect(v.versao).toBe(VERSAO_SAVE);
      expect(VERSAO_SAVE).toBe(14);
      for (const b of v.financas.bens) if (b.tipo === 'veiculo') { expect(b.versaoId).toBeTruthy(); expect(nomeDoVeiculo(b)).not.toMatch(/^carro compacto$/); }
      if (v.caminhos.politica?.partido) expect(v.caminhos.politica.partidos?.[0].sigla).toBe(v.caminhos.politica.partido);
      for (let k = 0; k < 3 && !v.morte; k++) { v = avancarAno(v).vida; v = responderTudo(v); }
      expect(JSON.stringify(v)).not.toMatch(/undefined|NaN/);
      const volta = importarVida(exportarVida(v));
      expect(volta.tipo).toBe('ok');
    }, 30000);
  }

  it('o salão do playtest, migrado, paga o dono e o carro faz o trajeto', () => {
    const res = interpretar(ler('save-v13-salao-carro.json'));
    if (res.tipo !== 'ok') throw new Error('não migrou');
    let v = res.vida;
    expect(modoDoTrabalho(v)).toBe('negocio');
    expect(deslocamento(v)!.modo).toBe('carro');
    v = avancarAno(v).vida; v = responderTudo(v);
    if (v.caminhos.negocio?.estado !== 'fechado' && v.trabalho.atual) expect(v.caminhos.negocio!.retiradaAno).toBeGreaterThan(0);
  }, 30000);

  it('o investidor migrado não recebe "sem dinheiro": recebe a opção de tirar das aplicações', () => {
    const res = interpretar(ler('save-v13-investidor.json'));
    if (res.tipo !== 'ok') throw new Error('não migrou');
    const v = res.vida;
    v.financas.conta = 500;
    const d = vereditoDePagar(v, 20000, 'Custa');
    expect(d.resgate).toBeDefined();
  });
});
