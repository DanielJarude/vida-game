/**
 * REWORK 11 · Fase G — rotina, jornada e bem-estar (e as pendências do 10.6 absorvidas pelo integrador).
 *
 * Cada bloco reproduz um caso do playtest (o ID no título) com a pré-condição dita no cenário.
 */

import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro } from './cenarios';
import { nova, viverAte } from './ajuda';
import { disponibilidade, executar } from '../acoes';
import { transacao } from '../nucleo';
import type { Vida } from '../tipos';
import { criarRng } from '../rng';
import { contratar } from '../sistemas/trabalho';
import { ocupacao, OCUPACOES } from '../dados/ocupacoes';
import { agendaDaSemana, blocosDoTrabalho, blocosFixos, sobrepoe } from '../sistemas/agenda';
import { adotarPet } from '../sistemas/pets';
import { fatoresCabeca, fatoresHumor, realizacaoRecente } from '../sistemas/estado';
import { fatorDaMudanca } from '../sistemas/migracao';
import { dependeDosResponsaveis } from '../sistemas/pedidosDaCrianca';

const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const horasDe = (v: Vida) => blocosDoTrabalho(v).reduce((s, b) => s + (b.dias.length * (b.fim - b.inicio)) / 60 / (b.alternado ? 2 : 1), 0);
const comEmprego = (id: string, semente = 31) => em(adulto(34, { semente }), x => { contratar(x, criarRng(1), ocupacao(id)); });

describe('ROT-11.1 · a jornada de cada ofício é plausível', () => {
  it('o auxiliar técnico não trabalha de segunda a sexta das 6h às 22h: treino, análise e o jogo, ~40 h', () => {
    const v = comEmprego('auxiliar_tecnico');
    const h = horasDe(v);
    expect(h).toBeGreaterThanOrEqual(30);
    expect(h).toBeLessThanOrEqual(50);
    expect(blocosDoTrabalho(v).some(b => b.dias.includes(6))).toBe(true);
    expect(blocosDoTrabalho(v).every(b => b.inicio >= 8 * 60 && b.fim <= 19 * 60)).toBe(true);
  });

  it('o músico trabalha de tarde e à noite, com shows no fim de semana — não em horário de escritório nem 80 h', () => {
    const v = comEmprego('musico_profissional');
    const bl = blocosDoTrabalho(v);
    expect(bl.some(b => b.id === 'trabalho_show' && b.dias.includes(5) && b.inicio >= 19 * 60)).toBe(true);
    expect(horasDe(v)).toBeLessThanOrEqual(50);
  });

  it('nenhuma ocupação integral passa de 66 h nem fica abaixo de 15 h por semana na agenda', () => {
    const fora: string[] = [];
    const base = adulto(34, { semente: 31 });
    for (const oc of OCUPACOES) {
      if (oc.carga !== 'integral' || oc.contrato === 'eletivo' || oc.idadeMin > 34) continue;
      const v = em(base, x => { x.trabalho.atual = undefined; contratar(x, criarRng(1), oc); });
      if (!v.trabalho.atual) continue;
      const h = horasDe(v);
      if (h > 66 || h < 15) fora.push(`${oc.id}: ${h.toFixed(1)} h`);
    }
    expect(fora).toEqual([]);
  });
});

describe('ROT-11.2 · o cuidado com o bicho e com a casa não cria conflito artificial', () => {
  it('a calopsita de quem trabalha à noite procura outro horário (não às 21h por cima do show; o gato não pede bloco)', () => {
    let v = comEmprego('musico_profissional');
    v = em(v, x => { adotarPet(x, criarRng(1), { especie: 'calopsita', nome: 'Sunny', genero: 'feminino', idade: 2, porte: 'pequeno', jeito: 'calma', historia: '' }, 'abrigo'); });
    const pets = blocosFixos(v).find(b => b.id === 'pets');
    expect(pets).toBeDefined();
    const trabalho = blocosFixos(v).filter(b => b.origem === 'trabalho');
    expect(trabalho.some(b => sobrepoe(b, pets!))).toBe(false);
    expect(agendaDaSemana(v).conflitos.some(c => c.perde === 'pets')).toBe(false);
  });

  it('o cachorro de quem trabalha em plantão: o passeio cabe antes ou depois, sem conflito', () => {
    let v = comEmprego('enfermeiro');
    v = em(v, x => { adotarPet(x, criarRng(1), { especie: 'cachorro', nome: 'Bolt', genero: 'masculino', idade: 3, porte: 'medio', jeito: 'agitado', historia: '' }, 'abrigo'); });
    expect(agendaDaSemana(v).conflitos.some(c => c.perde === 'pets')).toBe(false);
  });

  it('os filhos pequenos nos dias de show ficam com quem mora junto — dito no bloco, sem conflito', () => {
    let v = comEmprego('musico_profissional');
    v = em(v, x => { const { p } = comParceiro(x, { estagio: 'casamento' }); comFilho(x, 2, { outroId: p.id }); });
    const filhos = blocosFixos(v).filter(b => b.origem === 'filhos');
    expect(filhos.length).toBeGreaterThan(0);
    const noite = filhos.find(b => b.id === 'filhos_pequenos')!;
    expect(noite.dias.includes(4) || noite.dias.includes(5)).toBe(false);
    expect(noite.detalhe).toMatch(/cobre/);
    expect(agendaDaSemana(v).conflitos.some(c => c.perde.startsWith('filhos'))).toBe(false);
  });
});

describe('ROT-11.2 · sozinho com os filhos', () => {
  it('quem sai da loja às 19h e mora só com a criança cuida dela depois do trabalho — sem a meia hora de conflito inventada', () => {
    let v = comEmprego('gerente_loja');
    v = em(v, x => { comFilho(x, 4); });
    const noite = blocosFixos(v).find(b => b.id === 'filhos_pequenos')!;
    const fimDoTrabalho = Math.max(...blocosFixos(v).filter(b => b.origem === 'trabalho' || b.origem === 'trajeto').filter(b => b.dias.includes(0) && b.fim <= 21 * 60).map(b => b.fim));
    expect(noite.inicio).toBeGreaterThanOrEqual(fimDoTrabalho);
    expect(noite.fim - noite.inicio).toBeGreaterThanOrEqual(60);
    expect(agendaDaSemana(v).conflitos.some(c => c.perde.startsWith('filhos'))).toBe(false);
  });

  it('o show que entra pela noite continua sendo um choque de verdade para quem está sozinho com a criança', () => {
    let v = comEmprego('musico_profissional');
    v = em(v, x => { comFilho(x, 3); });
    expect(blocosFixos(v).find(b => b.id === 'filhos_pequenos')!.inicio).toBe(18 * 60 + 30);
  });
});

describe('ROT-11.3 · estresse, realização e felicidade com causas reais', () => {
  it('mudanças de país em sequência e por transferência pesam menos que a primeira, sozinha', () => {
    const v = adulto(30, { semente: 31 });
    expect(fatorDaMudanca(v, 'pessoal')).toBe(1);
    expect(fatorDaMudanca(v, 'esporte')).toBeCloseTo(0.6);
    const depois = em(v, x => { x.mundo = { migracoes: [{ t: x.t - 10, de: 'recife-pe', para: 'recife-pe', motivo: 'trabalho', via: 'trabalho', cambio: { antes: 0, depois: 0 } }], adaptacao: 50, idiomas: [] }; });
    expect(fatorDaMudanca(depois, 'pessoal')).toBe(0.5);
  });

  it('o título dos últimos dois anos entra na felicidade com nome; depois de dois anos, sai', () => {
    const v = em(adulto(28, { semente: 31 }), x => {
      x.caminhos.palmares = [{ tipo: 'titulo', modalidade: 'futebol', ano: 2050, t: x.t - 3, competicao: 'Série A', clube: 'Clube', papel: 'protagonista', texto: 'Campeão' }];
    });
    const f = fatoresHumor(v).find(x => x.id === 'realizacao');
    expect(f?.efeito).toBeGreaterThan(2);
    expect(f?.texto).toMatch(/Série A/);
    const tarde = em(v, x => { x.t += 30; });
    expect(realizacaoRecente(tarde)).toBeUndefined();
  });

  it('"quase nada sobra para você" exige falta real de horas livres na agenda (o jogador com 70 h livres não recebe)', () => {
    const v = em(adulto(24, { semente: 31 }), x => {
      contratar(x, criarRng(1), ocupacao('jogador_futebol'));
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Clube', nivel: 3, tInicio: x.t - 60, tFase: x.t - 24, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 40, posicao: 'goleiro', espaco: 'titular' };
    });
    const livres = agendaDaSemana(v).livre.reduce((s, m) => s + m, 0) / 60;
    expect(livres).toBeGreaterThan(25);
    expect(fatoresCabeca(v).some(f => f.id === 'semana_apertada' && /quase nada/.test(f.texto))).toBe(false);
  });
});

describe('Pendências do 10.6 absorvidas', () => {
  it('A3 · cancelar o plano onde só há seguro privado para o tratamento (registrado); onde há rede pública, segue por ela', () => {
    const tratar = (x: Vida) => {
      x.financas.planoDeSaude = true;
      x.corpo.condicoes = [{ id: 'hipertensao', nome: 'hipertensão', tInicio: x.t - 60, cronica: true, gravidade: 2, tratando: true, diagnosticada: true, tDiagnostico: x.t - 60, tTratamento: x.t - 36 }];
    };
    const br = em(adulto(45, { semente: 51 }), tratar);
    const r1 = executar(br, { tipo: 'plano_saude', ativo: false });
    expect(r1.vida.corpo.condicoes[0].tratando).toBe(true);
    expect(r1.aviso?.texto ?? r1.resultado).toMatch(/segue/);
    const us = em(adulto(45, { semente: 51 }), x => { x.moradia.municipioId = 'us:chicago'; tratar(x); });
    const r2 = executar(us, { tipo: 'plano_saude', ativo: false });
    expect(r2.vida.corpo.condicoes[0].tratando).toBe(false);
    expect(r2.vida.corpo.condicoes[0].abandono?.meses).toBe(36);
  });

  it('A3 · largar a terapia sem plano para o tratamento da depressão (registrado como abandono)', () => {
    const v = em(adulto(35, { semente: 51 }), x => {
      x.financas.planoDeSaude = false;
      x.rotinas.push({ id: 'terapia', tInicio: x.t - 24 } as never);
      x.corpo.condicoes = [{ id: 'depressao', nome: 'depressão', tInicio: x.t - 30, cronica: true, gravidade: 2, tratando: true, diagnosticada: true, tDiagnostico: x.t - 30, tTratamento: x.t - 24 }];
    });
    const r = executar(v, { tipo: 'rotina', id: 'terapia', ativa: false });
    expect(r.vida.rotinas.some(x => x.id === 'terapia')).toBe(false);
    expect(r.vida.corpo.condicoes[0].tratando).toBe(false);
    expect(r.vida.corpo.condicoes[0].abandono).toBeDefined();
  });

  it('INF-04 · a criança pede a bicicleta aos adultos pela loja de veículos (nunca carro); o pedido sai uma vez por ano', () => {
    let s = 3;
    let v = viverAte(nova({ semente: s }), 9);
    while (v.morte || !dependeDosResponsaveis(v)) v = viverAte(nova({ semente: ++s }), 9);
    v = em(v, x => { x.momento = null; x.financas.bens = x.financas.bens.filter(b => b.tipo !== 'veiculo'); });
    expect(disponibilidade(v, { tipo: 'pedir_veiculo', modeloId: 'carro_compacto' }).grau).toBe('impossivel');
    expect(disponibilidade(v, { tipo: 'pedir_veiculo', modeloId: 'bike' }).grau).toBe('permitido');
    const r = executar(v, { tipo: 'pedir_veiculo', modeloId: 'bike' });
    expect(disponibilidade(r.vida, { tipo: 'pedir_veiculo', modeloId: 'bike' }).grau).not.toBe('permitido');
    const temBike = r.vida.financas.bens.some(b => b.tipo === 'veiculo' && b.modeloId === 'bike');
    // A resposta é do adulto: sim (a bicicleta é dela) ou não (fica dito na história) — nunca o dinheiro dela.
    expect(r.vida.financas.conta).toBe(v.financas.conta);
    if (!temBike) expect(r.vida.biografia.some(b => /Pediu a .* uma bicicleta/.test(b.texto))).toBe(true);
  });
});
