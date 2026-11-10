/**
 * VIDA 12.5 — Polimento e Imersão: as correções do motor (CAR-11.9, auditoria transversal) e a retrospectiva da vida.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import { garantirFrente } from '../sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../sistemas/esporte';
import { montarFila, orcamentoDeDecisoes } from '../conteudo/motor';
import { criarVida } from '../criacao';
import { tirarBem } from '../nucleo';
import { coisasDaVida, comprarCoisa, disponibilidadeVenderCoisa } from '../sistemas/coisas';
import { incorporarAoServico } from '../sistemas/militar';
import { podeComecarCnh } from '../sistemas/autoescola';
import { escrever } from '../nucleo';
import { comFilho, comParceiro } from './cenarios';
import { memoriasDaVida, lerEntrada } from '../sistemas/albumDaVida';
import { exportarVida, importarVida } from '../save';
import { MODELOS } from '../sistemas/situacoes';
import { MODELOS_125 } from '../sistemas/situacoes125';

const jogador = () => transacao(adulto(23, { semente: 1250 }), x => {
  const r = criarRng(1250);
  garantirFrente(x, 'futebol');
  Object.assign(x.caminhos.frentes.futebol!, { habilidade: 86, interesse: 90, meses: 160, auge: 86 });
  x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = []; x.educacao.matricula = undefined;
  entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
  profissionalizar(x, r, 3);
  x.momento = null;
}).vida;

describe('VIDA 12.5 · CAR-11.9: a cena da temporada não se perde atrás do contrato', () => {
  it('com a renovação aberta, a cena do atleta (de uma frente só) fica no mesmo ano', () => {
    const v = transacao(jogador(), x => {
      x.momento = { situacaoId: 'esp_renovacao' } as never;
      x.fila = [{ id: 'car_situacao', t: x.t, papeis: {}, prioridade: 2, adiada: true }];
      montarFila(x);
    }).vida;
    expect(orcamentoDeDecisoes(v)).toBe(1);
    expect(v.fila?.find(x => x.id === 'car_situacao')?.t).toBe(v.t);
  });

  it('uma decisão comum aberta continua ocupando o espaço (a fila não cresce para todo mundo)', () => {
    const v = transacao(jogador(), x => {
      x.momento = { situacaoId: 'car_situacao' } as never;
      x.fila = [{ id: 'esp_mercado', t: x.t, papeis: {}, prioridade: 0, adiada: true }];
      montarFila(x);
    }).vida;
    expect(v.fila?.some(x => x.id === 'esp_mercado' && x.t === v.t)).toBeFalsy();
  });
});

describe('VIDA 12.5 · bugs confirmados na auditoria transversal', () => {
  it('B1: ninguém da família de partida nasce de avó ou avô com menos de 15 anos', () => {
    let pares = 0;
    for (let k = 0; k < 150; k++) {
      const v = criarVida({ nome: 'V', sobrenome: 'S', genero: k % 2 ? 'masculino' : 'feminino', municipioId: 'recife-pe', semente: 127000 + k });
      for (const p of Object.values(v.pessoas)) for (const g of p.genitores ?? []) {
        const gen = v.pessoas[g];
        if (!gen) continue;
        pares++;
        expect((p.tNasc - gen.tNasc) / 12, `${gen.nome} → ${p.nome} (semente ${127000 + k})`).toBeGreaterThanOrEqual(15);
      }
    }
    expect(pares).toBeGreaterThan(150);
  });

  it('B2: o que está emprestado não se vende', () => {
    const v = transacao(adulto(25, { semente: 125901 }), x => { x.financas.conta = 5000; comprarCoisa(x, 'violao'); coisasDaVida(x)[0].emprestadaA = 'alguem'; }).vida;
    expect(disponibilidadeVenderCoisa(v, coisasDaVida(v)[0].id)).not.toMatchObject({ grau: 'permitido' });
  });

  it('B4: tirar o veículo do dia a dia limpa o veículo principal', () => {
    const f = { bens: [{ id: 'v1' }, { id: 'v2' }], veiculoPrincipal: 'v1' } as never as Parameters<typeof tirarBem>[0];
    tirarBem(f, 'v1');
    expect(f.bens.map(b => b.id)).toEqual(['v2']);
    expect(f.veiculoPrincipal).toBeUndefined();
  });

  it('B6: a convocação ao serviço militar entra na Linha da Vida', () => {
    const v = transacao(adulto(18, { semente: 127007 }), (x, r) => { x.trabalho.atual = undefined; incorporarAoServico(x, r); }).vida;
    expect(v.biografia.some(e => /Incorporou ao serviço militar/.test(e.texto) && e.relevancia === 'marco')).toBe(true);
  });

  it('M2: depois de desistir da carteira, um ano de espera', () => {
    const v = transacao(adulto(20, { semente: 1 }), x => { x.fatos['cnh_desistiu'] = x.t - 3; }).vida;
    expect(podeComecarCnh(v)).not.toMatchObject({ grau: 'permitido' });
    expect(podeComecarCnh(transacao(v, x => { x.t += 12; }).vida)).toMatchObject({ grau: 'permitido' });
  });
});

describe('VIDA 12.5 · a Retrospectiva da Vida (só o que o save registra)', () => {
  const vivida = () => transacao(adulto(40, { semente: 125125 }), x => {
    const { p: par } = comParceiro(x, { estagio: 'casamento' });
    escrever(x, { texto: `Casou-se com ${par.nome}: uma cerimônia pequena.`, relevancia: 'marco', tema: 'amor', pessoas: [par.id], evento: { tipo: 'casamento', pessoaId: par.id } });
    const { p: filho } = comFilho(x, 0, { outroId: par.id });
    escrever(x, { texto: `${filho.nome} nasceu.`, relevancia: 'marco', tema: 'filhos', pessoas: [filho.id], evento: { tipo: 'filho_nasceu', pessoaId: filho.id } });
    escrever(x, { texto: 'Viajou para Lisboa (uma semana), sozinha.', relevancia: 'biografia', tema: 'lazer', fato: { tipo: 'm_viagem', dados: { destino: 'Lisboa' } } });
    for (let k = 0; k < 4; k++) escrever(x, { texto: 'A fila do banco de novo.', relevancia: 'biografia', tema: 'dinheiro' });
    x.caminhos.palmares = [{ tipo: 'titulo', modalidade: 'futebol', ano: Math.floor(x.t / 12), t: x.t, competicao: 'Série A', clube: 'Sport', texto: 'Campeã da Série A pelo Sport.' }];
  }).vida;

  it('monta a linha do tempo em ordem, com idade e ano, e cada memória tem uma fonte real', () => {
    const v = vivida();
    const ms = memoriasDaVida(v);
    expect(ms[0].tipo).toBe('nascimento');
    expect(ms[0].idade).toBe(0);
    for (let k = 1; k < ms.length; k++) expect(ms[k].t).toBeGreaterThanOrEqual(ms[k - 1].t);
    for (const m of ms) {
      expect(m.ano).toBe(Math.floor(m.t / 12));
      if (m.entradaId) expect(v.biografia.find(e => e.id === m.entradaId)?.texto).toBe(m.texto);
    }
    // VIDA 15: a vida-base nova pode já ter casado antes (outra pessoa, outro ano) — o que importa é o casamento desta cena
    // virar UMA memória (a estrutura e a biografia não se duplicam).
    const casamento = ms.filter(m => m.tipo === 'casamento' && m.t === v.t);
    expect(casamento).toHaveLength(1);
    expect(casamento[0].destaque).toBe(2);
    expect(ms.find(m => m.tipo === 'viagem')?.titulo).toBe('Viagem: Lisboa');
    expect(ms.find(m => m.tipo === 'titulo')?.categoria).toBe('esportes');
    expect(ms.some(m => /fila do banco/.test(m.texto))).toBe(false);
  });

  it('o filho que a estrutura e a biografia contam vira uma memória só (com a frase da biografia)', () => {
    const v = vivida();
    const filhos = memoriasDaVida(v).filter(m => m.tipo === 'filho');
    // Cada filho uma vez (a vida simulada já pode ter outros), sempre com a frase da biografia quando ela existe.
    expect(new Set(filhos.map(f => f.pessoaId)).size).toBe(filhos.length);
    expect(filhos.length).toBe(Object.values(v.vinculos).filter(x => x.parentesco === 'filho').length);
    for (const f of filhos) expect(f.texto).toMatch(/nasceu/);
  });

  it('continua igual depois de exportar e importar o save', () => {
    const v = vivida();
    const r = importarVida(exportarVida(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    expect(memoriasDaVida(r.vida).map(m => [m.tipo, m.t, m.titulo])).toEqual(memoriasDaVida(v).map(m => [m.tipo, m.t, m.titulo]));
  });

  it('save antigo (biografia sem fato nem evento): as frases ainda são reconhecidas, nada é inventado', () => {
    const v = transacao(vivida(), x => { x.biografia = x.biografia.map(({ fato: _f, evento: _e, ...e }) => e); x.caminhos.palmares = undefined; }).vida;
    const ms = memoriasDaVida(v);
    expect(ms.some(m => m.tipo === 'casamento')).toBe(true);
    expect(ms.some(m => m.tipo === 'viagem')).toBe(true);
    expect(ms.some(m => m.tipo === 'titulo')).toBe(false);
    const fontes = new Set(v.biografia.map(e => e.id));
    for (const m of ms) if (m.entradaId) expect(fontes.has(m.entradaId)).toBe(true);
  });

  it('o noticiário do mundo e as linhas técnicas não entram', () => {
    const v = vivida();
    expect(lerEntrada(v, { id: 'x', t: v.t, idade: 40, texto: 'A inflação passou de 10%.', relevancia: 'marco', tema: 'dinheiro', fato: { tipo: 'mundo', dados: {} } })).toBeUndefined();
  });
});

describe('VIDA 12.5 · CAR-11.9: as cenas das carreiras secas', () => {
  it('estão no catálogo, com ids únicos, ao menos duas respostas e os quatro desfechos escritos', () => {
    const ids = MODELOS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MODELOS_125) {
      expect(ids).toContain(m.id);
      const its = typeof m.intencoes === 'function' ? [] : m.intencoes;
      expect(its.length).toBeGreaterThanOrEqual(2);
      for (const it of its) for (const d of ['otimo', 'bom', 'ruim', 'pessimo'] as const) expect(it.desfechos[d].texto.length).toBeGreaterThan(5);
    }
    const por = (t: string) => MODELOS_125.filter(m => m.id.startsWith(t)).length;
    expect(por('ten125')).toBeGreaterThanOrEqual(6);
    expect(por('vol125') + por('atl125')).toBeGreaterThanOrEqual(8);
    expect(por('med125')).toBeGreaterThanOrEqual(6);
    expect(por('pol125') + por('adm125') + por('obr125')).toBeGreaterThanOrEqual(12);
  });
});
