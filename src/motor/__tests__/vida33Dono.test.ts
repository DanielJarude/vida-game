/**
 * VIDA 33 — ser dono de verdade: os circuitos reais de cada jogo (regiões, ligas por época, ligas fechadas, vagas
 * internacionais), a organização com várias lines, o investimento inicial na fundação (e-sports, futebol, quadra), a
 * line de 5 + 1 reserva, os patrocínios por cota (busca, proposta, negociação, metas, departamento), a camisa e a loja, a
 * identidade (escudo, cores) e os saves antigos (a org de um jogo só e o patrocínio único viram o modelo novo).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { anoDe } from '../tempo';
import type { Vida } from '../tipos';
import {
  internacionais33, ligaDoCircuito33, ligaFechada33, regiaoVigente33, regioesDoJogo33, regrasDaDivisao33, torneioDeAcesso33
} from '../v31/esports/circuitos33';
import { linhaDe31, maxElenco31, mediaDosTitulares31, previaDaEntrada33, processarOrg31, type OqueOrg31 } from '../v31/esports/org31';
import { previaDaFundacao33, processarClube20 } from '../v20/clubes/clubes20';
import { processarEquipes32 } from '../v32/equipes/equipe32';
import { normalizarIdentidade33 } from '../v33/dono/identidade33';

const tenta = (v: Vida, a: Acao) => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : v);
const O = (oque: OqueOrg31): Acao => ({ tipo: 'org31', oque } as Acao);
const C = (oque: unknown) => ({ tipo: 'clube20', oque } as Acao);
const E = (oque: unknown) => ({ tipo: 'equipe32', oque } as Acao);
const rico = (s = 33) => { const v = adulto(35, { semente: s, municipioId: 'campinas-sp' }); v.financas.conta = 2e9; return v; };
const IDENT = { forma: 'hexagono', padrao: 'faixa', cor1: '#5b2a86', cor2: '#ffd200', cor3: '#ffffff', simbolo: 'raio', sigla: 'CRC', apelido: 'a Fúria do Sertão', casa: 'Casa Carcará' } as const;

describe('os circuitos reais', () => {
  it('as ligas têm o nome da época: CBLOL → LTA Sul (2025) → CBLOL (2026); NA LCS → LCS; EU LCS → LEC', () => {
    expect(ligaDoCircuito33('lol', 'br', 4, 2024)).toBe('CBLOL');
    expect(ligaDoCircuito33('lol', 'br', 4, 2025)).toBe('LTA Sul');
    expect(ligaDoCircuito33('lol', 'br', 4, 2026)).toBe('CBLOL');
    expect(ligaDoCircuito33('lol', 'br', 3, 2020)).toBe('Circuito Desafiante');
    expect(ligaDoCircuito33('lol', 'na', 4, 2015)).toBe('NA LCS');
    expect(ligaDoCircuito33('lol', 'eu', 4, 2018)).toBe('EU LCS');
    expect(ligaDoCircuito33('lol', 'eu', 4, 2020)).toBe('LEC');
    expect(ligaDoCircuito33('lol', 'kr', 4, 2020)).toBe('LCK');
  });

  it('VALORANT: Brasil, América do Norte e América Latina disputam a mesma VCT Americas desde 2023; Challengers por baixo', () => {
    for (const r of ['br', 'na', 'latam']) expect(ligaDoCircuito33('valorant', r, 4, 2024)).toBe('VCT Americas');
    expect(ligaDoCircuito33('valorant', 'br', 3, 2024)).toBe('Challengers Brazil');
    expect(ligaDoCircuito33('valorant', 'eu', 4, 2024)).toBe('VCT EMEA');
    expect(ligaFechada33('valorant', 'br', 2024)).toBe(true);
    expect(ligaFechada33('valorant', 'br', 2022)).toBe(false);
    expect(torneioDeAcesso33('valorant', 'br', 2024)).toBe('Ascension Americas');
    expect(torneioDeAcesso33('valorant', 'br', 2026)).toBeUndefined();
    // 2026: sem Ascension, o campeão do Challengers disputa a vaga no Champions.
    expect(internacionais33('valorant', 2026).find(e => e.id === 'champions')?.div3?.br).toBe(1);
  });

  it('Rainbow Six: Brasileirão (2021–2023) e South America League (2024–); a liga da América Latina passa para a do Brasil', () => {
    expect(ligaDoCircuito33('r6', 'br', 4, 2022)).toBe('Brasileirão de Rainbow Six');
    expect(ligaDoCircuito33('r6', 'br', 4, 2025)).toBe('South America League');
    expect(regiaoVigente33('r6', 'latam', 2025)).toBe('br');
    expect(regiaoVigente33('lol', 'latam', 2025)).toBe('br');
    expect(regioesDoJogo33('rocket', 2018).some(r => r.id === 'sa')).toBe(false);
    expect(regioesDoJogo33('rocket', 2022).some(r => r.id === 'sa')).toBe(true);
  });

  it('as vagas internacionais vêm da liga principal da região (CBLOL com 2 vagas no Mundial de 2026; RLCS: 2 sul-americanas por Major)', () => {
    expect(internacionais33('lol', 2026).find(e => e.id === 'worlds')?.vagas.br).toBe(2);
    expect(internacionais33('lol', 2024).find(e => e.id === 'worlds')?.vagas.br).toBe(1);
    expect(internacionais33('rocket', 2026).find(e => e.id === 'major')?.vagas.sa).toBe(2);
    expect(internacionais33('cs', 2020).some(e => e.id === 'major')).toBe(false);
    // Liga fechada: sem queda na principal, sem acesso direto na segunda.
    expect(regrasDaDivisao33('lol', 'br', 4, 2023).caem).toBe(0);
    expect(regrasDaDivisao33('lol', 'br', 3, 2023).sobem).toBe(0);
    expect(regrasDaDivisao33('lol', 'br', 4, 2019).caem).toBe(2);
  });
});

describe('a organização com várias lines', () => {
  it('fundar com identidade e comprando a vaga na liga principal; depois entrar em outro jogo em outra região', () => {
    let v = rico();
    const ano = anoDe(v.t);
    v = tenta(v, O({ op: 'fundar', nome: 'Carcará Esports', jogo: 'lol', regiao: 'br', modo: 'elite', investimento: 5e6, identidade: IDENT as never }));
    const o = v.orgEsports31!;
    expect(o.identidade33?.sigla).toBe('CRC');
    expect(o.identidade33?.forma).toBe('hexagono');
    expect(linhaDe31(o, 'lol')!.divisao).toBe(4);
    expect(linhaDe31(o, 'lol')!.tecnico).toBeDefined();
    expect(linhaDe31(o, 'lol')!.elenco.length).toBeLessThanOrEqual(maxElenco31('lol', ano));
    // A mesma org num segundo jogo, em outra região.
    v = tenta(v, O({ op: 'entrar', jogo: 'cs', regiao: 'eu', modo: 'base' }));
    expect(v.orgEsports31!.linhas.map(l => `${l.jogo}:${l.regiao}`)).toEqual(['lol:br', 'cs:eu']);
    expect(disponibilidade(v, O({ op: 'entrar', jogo: 'cs', regiao: 'sa', modo: 'base' })).motivo).toMatch(/já tem uma line/);
    // Uma temporada: as duas lines jogam (cada uma na sua liga) e a org fecha o caixa uma vez.
    v.t += 12; processarOrg31(v);
    for (const l of v.orgEsports31!.linhas) expect(l.historico.length).toBe(1);
    expect(linhaDe31(v.orgEsports31!, 'cs')!.historico[0].liga).toMatch(/aberta|LAN/);
    // Sair de um jogo vende a line para o caixa; a última não sai (vende-se a org).
    const caixa = v.orgEsports31!.caixa;
    v = tenta(v, O({ op: 'sair', jogo: 'cs' }));
    expect(v.orgEsports31!.linhas.length).toBe(1);
    expect(v.orgEsports31!.caixa).toBeGreaterThan(caixa);
    expect(disponibilidade(v, O({ op: 'sair', jogo: 'lol' })).motivo).toMatch(/única line/);
  });

  it('o investimento inicial faz a line nascer mais forte (e com técnico e reserva)', () => {
    const ano = 2024;
    const pobre = previaDaEntrada33('valorant', 'br', 'acesso', 0, ano);
    const forte = previaDaEntrada33('valorant', 'br', 'acesso', 8e6, ano);
    expect(forte.forca).toBeGreaterThan(pobre.forca + 5);
    expect(forte.tecnico).toBeGreaterThan(0);
    expect(forte.reserva).toBe(true);
    expect(pobre.reserva).toBe(false);
    expect(forte.liga).toBe('Challengers Brazil');
    let v = tenta(rico(), O({ op: 'fundar', nome: 'Siriema GG', jogo: 'cs', regiao: 'sa', investimento: 3e6 }));
    const fraca = tenta(rico(), O({ op: 'fundar', nome: 'Siriema GG', jogo: 'cs', regiao: 'sa' }));
    expect(mediaDosTitulares31(v.orgEsports31!.linhas[0], anoDe(v.t))).toBeGreaterThan(mediaDosTitulares31(fraca.orgEsports31!.linhas[0], anoDe(fraca.t)));
    v = tenta(v, O({ op: 'vender_org' }));
    expect(v.orgEsports31).toBeUndefined();
  });

  it('uma line forte na liga principal vai aos internacionais em algumas temporadas', () => {
    let v = tenta(rico(7), O({ op: 'fundar', nome: 'Boitatá Team', jogo: 'lol', regiao: 'kr', modo: 'elite', investimento: 4e8 }));
    v.orgEsports31!.caixa = 5e8;
    let foi = 0;
    for (let k = 0; k < 6; k++) {
      v.t += 12; processarOrg31(v);
      const h = linhaDe31(v.orgEsports31!, 'lol')!.historico[linhaDe31(v.orgEsports31!, 'lol')!.historico.length - 1];
      if (h.internacionais?.length) foi++;
      for (const s of [...v.orgEsports31!.mesa]) v = tenta(v, O({ op: 'responder', id: s.id, opcao: s.opcoes[0].id }));
    }
    expect(foi).toBeGreaterThan(0);
  });
});

describe('patrocínios, loja e identidade (o mesmo para todo dono)', () => {
  it('buscar → propostas → negociar/assinar; o limite de buscas; a temporada paga; romper cobra multa', () => {
    let v = tenta(rico(), C({ op: 'fundar', nome: 'Ipê Futebol Clube', municipioId: 'campinas-sp', investimento: 5e6, identidade: { ...IDENT, forma: 'classico' } }));
    const c0 = v.clube20!;
    expect(c0.identidade33?.cor1).toBe('#5b2a86');
    v.clube20!.caixa = 5e7;
    const busca = (cota: string) => C({ op: 'dono', sub: { op: 'comercial', sub: { acao: 'buscar', cota } } });
    v = tenta(v, busca('master'));
    let of = v.clube20!.comercial33!.ofertas.filter(o => o.cota === 'master');
    expect(of.length).toBeGreaterThan(0);
    v = tenta(v, C({ op: 'dono', sub: { op: 'comercial', sub: { acao: 'aceitar', id: of[0].id } } }));
    const k = v.clube20!.comercial33!.contratos.find(x => x.cota === 'master')!;
    expect(k.marca).toBe(of[0].marca);
    expect(disponibilidade(v, busca('master')).motivo).toMatch(/já tem contrato/);
    v = tenta(v, busca('secundario'));
    expect(disponibilidade(v, busca('material')).motivo).toMatch(/buscas/);
    // O naming rights pede estádio próprio (nível 3).
    expect(disponibilidade(v, busca('naming')).motivo).toMatch(/casa própria|buscas/);
    // Loja: a camisa do ano e um produto novo.
    v = tenta(v, C({ op: 'dono', sub: { op: 'loja', sub: { acao: 'camisa', camisa: { modelo: 'v', padrao: 'listras', cor1: '#5b2a86', cor2: '#ffd200', cor3: '#ffffff', mangas: 'cor2' } } } }));
    v = tenta(v, C({ op: 'dono', sub: { op: 'loja', sub: { acao: 'produto', produto: 'cachecol', ligar: true } } }));
    expect(v.clube20!.loja33?.camisa?.padrao).toBe('listras');
    expect(v.clube20!.loja33?.produtos).toContain('cachecol');
    // A temporada fecha: o patrocínio e a loja entram.
    v.t += 12; processarClube20(v);
    expect(v.clube20!.loja33!.hist.length).toBe(1);
    expect(v.clube20!.historico[v.clube20!.historico.length - 1].receita).toBeGreaterThan(0);
    // Romper: a multa sai do caixa.
    const caixa = v.clube20!.caixa;
    const ativo = v.clube20!.comercial33!.contratos.find(x => x.cota === 'master' && x.ate >= anoDe(v.t));
    if (ativo) {
      v = tenta(v, C({ op: 'dono', sub: { op: 'comercial', sub: { acao: 'romper', cota: 'master' } } }));
      expect(v.clube20!.caixa).toBeLessThan(caixa);
    }
    expect(interpretar(JSON.stringify(v)).tipo).toBe('ok');
  });

  it('fundar o clube com dinheiro: nasce no estadual, mas com elenco e estrutura melhores (e a folha junto)', () => {
    const minimo = previaDaFundacao33('BR', 0, 'equilibrado');
    const forte = previaDaFundacao33('BR', 60e6, 'elenco');
    const obras = previaDaFundacao33('BR', 60e6, 'estrutura');
    expect(forte.media).toBeGreaterThan(minimo.media + 10);
    expect(forte.folha).toBeGreaterThan(minimo.folha);
    expect(obras.ct + obras.base + obras.estadio).toBeGreaterThan(3);
    const v = tenta(rico(), C({ op: 'fundar', nome: 'Real Barão', municipioId: 'campinas-sp', investimento: 60e6, foco: 'elenco' }));
    expect(v.clube20!.fundado32).toBeDefined();
    expect(v.clube20!.elenco.reduce((s, j) => s + j.forca, 0) / v.clube20!.elenco.length).toBeGreaterThan(minimo.media + 5);
  });

  it('time de quadra: investimento, identidade e o painel do dono; o rebranding depois do primeiro ano custa', () => {
    let v = tenta(rico(), E({ op: 'fundar', modalidade: 'volei', nome: 'Aurora Vôlei', municipioId: 'campinas-sp', investimento: 5e6, foco: 'elenco', identidade: IDENT }));
    const e = v.equipes32![0];
    expect(e.elenco).toBeGreaterThan(55);
    expect(e.identidade33?.apelido).toBe('a Fúria do Sertão');
    e.caixa = 1e7;
    v = tenta(v, E({ op: 'dono', id: e.id, sub: { op: 'comercial', sub: { acao: 'departamento', nivel: 2 } } }));
    expect(v.equipes32![0].comercial33!.departamento).toBe(2);
    v.t += 12; processarEquipes32(v);
    // Ano seguinte: mudar o escudo é rebranding (custa e a torcida estranha).
    const antes = v.equipes32![0].caixa;
    v = tenta(v, E({ op: 'dono', id: e.id, sub: { op: 'identidade', identidade: { ...IDENT, cor1: '#00813d' } } }));
    expect(v.equipes32![0].identidade33?.cor1).toBe('#00813d');
    expect(v.equipes32![0].caixa).toBeLessThan(antes);
  });

  it('a identidade é validada: cor inválida e forma estranha voltam ao padrão', () => {
    const i = normalizarIdentidade33({ forma: 'triangulo', cor1: 'vermelho', cor2: '#FFFFFF', simbolo: 'x', sigla: 'abcdef' })!;
    expect(i.forma).toBe('classico');
    expect(i.cor1).toBe('#0b3d91');
    expect(i.cor2).toBe('#ffffff');
    expect(i.simbolo).toBe('sigla');
    expect(i.sigla).toBe('ABCD');
  });
});

describe('saves antigos', () => {
  it('a org da VIDA 32 (um jogo, região BR/INT, patrocínio único) vira uma line com região real e a cota master', () => {
    const v = rico();
    const ano = anoDe(v.t);
    (v as unknown as Record<string, unknown>).orgEsports31 = {
      nome: 'Velha GG', jogo: 'cs', regiao: 'BR', desde: v.t - 24, divisao: 3, preco: 1e6, caixa: 2e5, divida: 0, valor: 3e6, fas: 20, reputacao: 20,
      elenco: Array.from({ length: 7 }, (_, k) => ({ id: `e${k}`, nick: `n${k}`, nome: `J ${k}`, tNasc: (ano - 22) * 12, funcao: ['entry', 'awper', 'suporte', 'lurker', 'igl'][k % 5], forca: 60, potencial: 65, salario: 50000, contratoAte: ano + 1 })),
      academia: [], academiaNivel: 0, conteudo: 0, historico: [{ ano: ano - 1, divisao: 3, liga: 'x', posicao: 3, participantes: 16, premio: 0, receita: 1e6, despesa: 9e5, caixa: 1e5, forca: 60 }],
      trofeus: [], seq: 10, comprados: [], vendas: [], mesa: [], mesaHist: [], patrocinio: { nome: 'Uma marca de energético', valor: 3e5, ate: ano + 1, rep: 0 }
    };
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const o = r.vida.orgEsports31!;
    expect(o.linhas).toHaveLength(1);
    expect(o.linhas[0]).toMatchObject({ jogo: 'cs', regiao: 'sa', divisao: 3 });
    expect(o.linhas[0].historico).toHaveLength(1);
    expect(o.comercial33!.contratos.find(c => c.cota === 'master')?.valor).toBe(3e5);
    expect((o as unknown as Record<string, unknown>).elenco).toBeUndefined();
  });
});
