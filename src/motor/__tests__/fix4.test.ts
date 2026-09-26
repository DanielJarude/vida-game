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
