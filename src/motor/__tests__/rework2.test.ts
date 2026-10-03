/**
 * REWORK 2 — Pessoa, corpo, mente e relações.
 *
 * Testes CAUSAIS: cada um segue uma cadeia inteira (causa → estado →
 * consumidor → feedback → consequência → persistência), comparando vidas
 * gêmeas (a mesma semente, a mesma vida até o ponto em que uma escolha
 * separa as duas). Unidades no fim.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responderTudo, viver } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { criarRng } from '../rng';
import { idade, transacao, vinculosVivos } from '../nucleo';
import { podeTentar } from '../plausibilidade';
import { interpretar, migrarV15, migrarV16, migrarV17, migrarV18, migrarV19, VERSAO_SAVE } from '../save';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { criarPessoa, vincular } from '../pessoas';
import { ocupacao } from '../dados/ocupacoes';
import { curso } from '../dados/cursos';
import {
  alvoCondicionamento, derivarPredisposicoes, desenvolverPessoa, estimuloFisico, fatoresCondicionamento, predisposicao,
  tetoDeAprendizado
} from '../sistemas/pessoa';
import { fatoresHumor, fatoresSaude, alvoHumor } from '../sistemas/estado';
import { lerPreparo } from '../sistemas/concurso';
import { aspectos, avaliarPeneira } from '../sistemas/peneira';
import { habilidade, praticar } from '../sistemas/frentes';
import { notaEsperadaArea, notasEnem } from '../sistemas/escola';
import { estimativaParaCurso, bonusDoPreparo, fazCursinho } from '../sistemas/vestibular';
import { pesoDaSaudeNoTrabalho, sinaisDoCorpo } from '../sistemas/saude';
import { interacoesPara } from '../sistemas/interacoes';
import { processarIniciativas } from '../sistemas/iniciativas';
import { emConstrucao } from '../sistemas/caminhosDeVida';
import { contratar } from '../sistemas/trabalho';

const clone = (v: Vida): Vida => structuredClone(v);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const disp = (v: Vida, a: Acao) => disponibilidade(v, a);

/** Uma vida viva na idade pedida, sem o que confunde a comparação (rotinas, carreira especial, decisões abertas). */
function pessoa(i: number, semente = 21, genero: 'feminino' | 'masculino' = 'feminino', municipioId = 'recife-pe'): Vida {
  let s = semente;
  let v = viver(nova({ semente: s, genero, municipioId }), i);
  while (v.morte) v = viver(nova({ semente: ++s, genero, municipioId }), i);
  v.momento = null; v.caminhos.pendente = undefined; v.caminhos.processo = undefined; v.caminhos.oportunidades = [];
  v.caminhos.esporte = undefined; v.caminhos.politica = undefined; v.caminhos.negocio = undefined; v.caminhos.envolvimento = undefined;
  v.rotinas = [];
  v.corpo.condicoes = []; v.corpo.habitos.fuma = false; v.corpo.habitos.bebe = 'nao';
  v.anoAtual = { acoes: [] };
  for (const vin of Object.values(v.vinculos)) vin.chamado = undefined;
  return v;
}

/** Avança um ano respondendo o que vier (a primeira opção livre). */
const ano = (v: Vida, acoes: Acao[] = []): Vida => {
  for (const a of acoes) if (tenta(v, a)) v = responderTudo(executar(v, a).vida);
  return responderTudo(avancarAno(v).vida);
};

function amigoProximo(v: Vida, nome = 'Bia', idadeP = idade(v)): { p: Pessoa; vin: Vinculo } {
  const p = criarPessoa(v, criarRng(99), { idade: idadeP, municipioId: v.moradia.municipioId, genero: 'feminino' });
  p.nome = nome;
  const vin = vincular(v, p, { origem: 'escola', proximidade: 78, estagio: 'amigo_proximo', convivio: [] });
  vin.confianca = 70; vin.tInicio = v.t - 120; vin.tUltimoContato = v.t - 6;
  return { p, vin };
}

/* ================================================================ Parte A */

describe('1. academia → condicionamento → consumidor → persistência', () => {
  it('a academia do ano vale no MESMO ano: condicionamento sobe, sedentarismo acaba, saúde e teste físico leem o novo valor', () => {
    const v0 = pessoa(24);
    v0.corpo.forma = 34; v0.corpo.habitos.sedentario = true;
    let a = executar(clone(v0), { tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }).vida;
    let b = clone(v0);
    // O fator de saúde "se mexer" já muda no desenvolvimento do ano, antes do corpo (a ordem anual).
    const antes = fatoresSaude(a).find(f => f.id === 'forma')!.efeito;
    const x = transacao(a, (y, r) => desenvolverPessoa(y, r)).vida;
    expect(fatoresSaude(x).find(f => f.id === 'forma')!.efeito).toBeGreaterThan(antes);
    expect(x.corpo.habitos.sedentario).toBe(false);
    a = ano(a); b = ano(b);
    expect(a.corpo.forma).toBeGreaterThanOrEqual(b.corpo.forma + 8);
    expect(a.corpo.habitos.sedentario).toBe(false);
    expect(b.corpo.habitos.sedentario).toBe(true);
    for (let k = 0; k < 3; k++) { a = ano(a); b = ano(b); }
    // Consumidores: o teste físico do concurso, a peneira, a saúde.
    const prf = ocupacao('policial_rodoviario');
    expect(lerPreparo(a, prf).fatores.join(' ')).toMatch(/preparo físico está acima/);
    expect(lerPreparo(b, prf).fatores.join(' ')).toMatch(/teste físico ainda não passaria/);
    expect(aspectos(a, 'futebol').fisico).toBeGreaterThan(aspectos(b, 'futebol').fisico);
    expect(fatoresSaude(a).find(f => f.id === 'forma')!.efeito).toBeGreaterThan(fatoresSaude(b).find(f => f.id === 'forma')!.efeito);
    // Retornos decrescentes: academia sozinha não faz ninguém atleta.
    expect(a.corpo.forma).toBeLessThan(82);
    // Persistência.
    const r = interpretar(JSON.stringify(a));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') { expect(r.vida.corpo.forma).toBe(a.corpo.forma); expect(r.vida.rotinas.some(x => x.id === 'academia')).toBe(true); }
  });

  it('parar a academia: o condicionamento volta ao do dia a dia', () => {
    let v = pessoa(26, 33);
    for (let k = 0; k < 4; k++) v = ano(v, [{ tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }]);
    const pico = v.corpo.forma;
    v = executar(v, { tipo: 'rotina', id: 'academia', ativa: false }).vida;
    for (let k = 0; k < 4; k++) v = ano(v);
    expect(v.corpo.forma).toBeLessThan(pico - 15);
  });
});

describe('2. academia por anos NÃO ensina futebol', () => {
  it('dez anos de academia: condicionamento alto, técnica de futebol nenhuma — e nenhum clube testa', () => {
    let v = pessoa(15, 44, 'masculino');
    delete v.caminhos.frentes.futebol;
    for (let k = 0; k < 10; k++) v = ano(v, [{ tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }]);
    expect(v.corpo.forma).toBeGreaterThan(62);
    expect(habilidade(v, 'futebol')).toBeLessThan(10);
    expect(aspectos(v, 'futebol').tecnica).toBeLessThan(-2.5);
    expect(tenta(v, { tipo: 'perseguir', oque: 'pedir_teste', valor: 'futebol' } as unknown as Acao)).toBe(false);
    // A academia não pratica frente nenhuma: nem técnica de esporte, nem de arte.
    expect(estimuloFisico(v).fontes.map(f => f.id)).toContain('academia');
  });
});

describe('3. prática esportiva → técnica → peneira → devolutiva → consequência', () => {
  it('técnica alta com físico mediano supera, em média, técnica baixa com físico alto', () => {
    const v = pessoa(15, 51, 'masculino');
    const tec = clone(v); tec.caminhos.frentes.futebol = { interesse: 70, meses: 96, habilidade: 73, tInicio: v.t - 96, tUltimo: v.t, retomadas: 0, auge: 73 }; tec.corpo.forma = 56;
    const fis = clone(v); fis.caminhos.frentes.futebol = { interesse: 70, meses: 96, habilidade: 56, tInicio: v.t - 96, tUltimo: v.t, retomadas: 0, auge: 56 }; fis.corpo.forma = 88;
    let pa = 0, pb = 0, sa = 0, sb = 0;
    for (let s = 1; s <= 60; s++) {
      const ra = avaliarPeneira(tec, criarRng(s), 'futebol', v.moradia.municipioId, { comeco: 'simples', final: 'coletivo' }, 0);
      const rb = avaliarPeneira(fis, criarRng(s), 'futebol', v.moradia.municipioId, { comeco: 'simples', final: 'coletivo' }, 0);
      pa += ra.passou ? 1 : 0; pb += rb.passou ? 1 : 0; sa += ra.pontos; sb += rb.pontos;
    }
    expect(sa).toBeGreaterThan(sb);
    expect(pa).toBeGreaterThan(pb);
  });

  it('anos de treino deliberado constroem técnica; pedir o teste leva à peneira, e a peneira deixa devolutiva com o nível — e consequência', () => {
    let v = pessoa(8, 60, 'masculino');
    for (let k = 0; k < 6; k++) v = ano(v, [{ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 }]);
    const h = habilidade(v, 'futebol');
    expect(h).toBeGreaterThan(50);
    // Quem só brinca de bola, na mesma vida, fica bem atrás.
    let lazer = pessoa(8, 60, 'masculino');
    for (let k = 0; k < 6; k++) lazer = ano(lazer, [{ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 1 }]);
    expect(h).toBeGreaterThan(habilidade(lazer, 'futebol') + 6);
    // Pedir um teste (a ação do jogador) abre a peneira em etapas.
    v.caminhos.esporte = undefined; v.caminhos.oportunidades = []; delete v.fatos['peneira_pedida_futebol']; delete v.caminhos.ultimas['peneira_futebol'];
    const pedir = { tipo: 'perseguir', oque: 'pedir_teste', valor: 'futebol' } as unknown as Acao;
    expect(tenta(v, pedir)).toBe(true);
    let x = executar(v, pedir).vida;
    expect(x.momento?.situacaoId).toBe('esp_peneira');
    for (let k = 0; x.momento && k < 3; k++) x = executar(x, { tipo: 'decidir', opcaoId: x.momento!.opcoes[0].id }).vida;
    const dev = x.caminhos.devolutivas.slice(-1)[0];
    expect(dev.tipo).toBe('peneira');
    expect(dev.nivel).toBeDefined();
    expect(dev.texto).toMatch(/treinador/i);
    // Consequência: ou a base (a porta aberta), ou a marca do fracasso e o que falta.
    if (dev.passou) expect(x.fatos['convite_base']).toBe(x.t);
    else { expect(dev.falta).toBeTruthy(); expect(x.caminhos.marcas.some(m => m.tipo === 'fracasso')).toBe(true); }
  });

  it('a predisposição física entra no físico da peneira como modificador — nunca como técnica', () => {
    const v = pessoa(15, 52, 'masculino');
    v.caminhos.frentes.futebol = { interesse: 70, meses: 60, habilidade: 60, tInicio: v.t - 60, tUltimo: v.t, retomadas: 0, auge: 60 };
    const alto = clone(v); alto.predisposicoes = { ...v.predisposicoes, fisica: 0.9 };
    const baixo = clone(v); baixo.predisposicoes = { ...v.predisposicoes, fisica: -0.9 };
    expect(aspectos(alto, 'futebol').tecnica).toBe(aspectos(baixo, 'futebol').tecnica);
    expect(aspectos(alto, 'futebol').fisico).toBeGreaterThan(aspectos(baixo, 'futebol').fisico);
  });
});

describe('4 e 5. saúde ignorada × saúde tratada', () => {
  function comSinal(semente: number): Vida {
    const v = pessoa(42, semente);
    v.financas.planoDeSaude = false; v.financas.conta = 30000;
    v.corpo.condicoes.push({ id: 'diabetes', nome: 'diabetes', tInicio: v.t - 24, cronica: true, gravidade: 2, tratando: false, diagnosticada: false });
    contratar(v, criarRng(1), ocupacao('assistente_adm'));
    // Premissa: nenhum tratamento já na fila (a vida de algumas sementes chega aqui com um).
    v.processos = v.processos.filter(p => p.tipo !== 'tratamento');
    return v;
  }

  it('4. o sinal sem nome já pesa: o corpo, o trabalho e a tela o percebem — e um dia o corpo obriga', () => {
    const v = comSinal(70);
    expect(sinaisDoCorpo(v).map(s => s.id)).toEqual(['diabetes']);
    expect(fatoresSaude(v).some(f => f.id === 'condicao:diabetes' && f.efeito < 0 && /sem diagnóstico/.test(f.texto))).toBe(true);
    expect(pesoDaSaudeNoTrabalho(v)).toBeGreaterThan(2);
    // A decisão de tratamento não aparece para o que ainda não tem nome.
    expect(v.momento).toBeNull();
    // Ignorado, o corpo obriga — cedo ou tarde (uns 14% ao ano depois de três anos de sinal): em cinco vidas,
    // a maioria chega ao susto em vinte anos (uma ou outra passa sem, como na vida).
    let x = v;
    let sustos = 0;
    for (const s of [70, 71, 72, 73, 74]) {
      let y = s === 70 ? v : comSinal(s);
      for (let k = 0; k < 20 && !y.morte; k++) { y = ano(y); if (y.fatos['susto_diabetes'] !== undefined) break; }
      if (y.fatos['susto_diabetes'] !== undefined) { sustos++; if (x === v) x = y; }
    }
    expect(sustos).toBeGreaterThanOrEqual(3);
    const c = x.corpo.condicoes.find(c => c.id === 'diabetes')!;
    expect(c.diagnosticada).toBe(true);
    expect(c.tarde).toBe(true);
    expect(x.biografia.some(e => /pronto-socorro/.test(e.texto) && e.relevancia === 'marco')).toBe(true);
  });

  it('5. quem vai ao médico descobre cedo, trata — e a trajetória é outra (saúde, trabalho, o susto que não vem)', () => {
    let saudeCuida = 0, saudeIgnora = 0, sustosCuida = 0, sustosIgnora = 0;
    for (const s of [71, 72, 73, 74, 75, 76]) {
      let a = comSinal(s);
      let b = clone(a);
      a = executar(a, { tipo: 'cuidar', cuidado: 'consulta' }).vida;
      const c = a.corpo.condicoes.find(x => x.id === 'diabetes')!;
      if (c.diagnosticada) {
        expect(a.momento?.situacaoId).toBe('sau_tratamento');
        a = executar(a, { tipo: 'decidir', opcaoId: 'particular' }).vida;
        expect(a.corpo.condicoes.find(x => x.id === 'diabetes')!.tratando).toBe(true);
        expect(pesoDaSaudeNoTrabalho(a)).toBeLessThan(pesoDaSaudeNoTrabalho(b));
      }
      for (let k = 0; k < 8; k++) { if (!a.morte) a = ano(a); if (!b.morte) b = ano(b); }
      saudeCuida += a.corpo.saude; saudeIgnora += b.corpo.saude;
      sustosCuida += a.fatos['susto_diabetes'] !== undefined ? 1 : 0; sustosIgnora += b.fatos['susto_diabetes'] !== undefined ? 1 : 0;
    }
    expect(saudeCuida).toBeGreaterThan(saudeIgnora);
    expect(sustosCuida).toBeLessThan(sustosIgnora);
  });
});

describe('6. leitura consistente → aprendizado gradual → consumidor acadêmico', () => {
  it('dez anos lendo: o aprendizado sobe devagar, com teto, e a nota esperada do ENEM (a mesma conta da prova) sobe junto', () => {
    const v0 = pessoa(8, 80);
    let a = clone(v0);
    let b = clone(v0);
    const inicio = a.mente.cognicao;
    let maiorSalto = 0;
    for (let k = 0; k < 10; k++) {
      const antes = a.mente.cognicao;
      a = ano(a, [{ tipo: 'rotina', id: 'leitura', ativa: true, nivel: 1 }]);
      b = ano(b);
      maiorSalto = Math.max(maiorSalto, a.mente.cognicao - antes);
    }
    expect(a.mente.cognicao).toBeGreaterThan(b.mente.cognicao + 3);
    // Gradual: em média pouco mais de um ponto por ano (um ano pode ter também um acontecimento, como o bilhete de um professor).
    expect((a.mente.cognicao - inicio) / 10).toBeLessThan(1.6);
    expect(maiorSalto).toBeLessThan(4);
    expect(a.mente.cognicao).toBeLessThanOrEqual(Math.max(inicio, tetoDeAprendizado(a)) + 0.5);
    expect(notaEsperadaArea(a, 'linguagens')).toBeGreaterThan(notaEsperadaArea(b, 'linguagens'));
  });

  it('o aprendizado não ensina esporte: a mesma prática de futebol rende o mesmo com cabeça boa ou não', () => {
    const v = pessoa(10, 81, 'masculino');
    const alto = clone(v); alto.mente.cognicao = 90;
    const baixo = clone(v); baixo.mente.cognicao = 30;
    const ha = transacao(alto, (x, r) => { for (let k = 0; k < 3; k++) praticar(x, r, 'futebol', 1, 1.1); }).vida;
    const hb = transacao(baixo, (x, r) => { for (let k = 0; k < 3; k++) praticar(x, r, 'futebol', 1, 1.1); }).vida;
    expect(habilidade(ha, 'futebol')).toBeCloseTo(habilidade(hb, 'futebol'), 5);
  });
});


describe('7. Medicina como objetivo → preparação → ENEM → devolutiva coerente', () => {
  it('a situação diz a distância; o cursinho a encurta; a prova é a mesma conta com o acaso do dia; a devolutiva diz o que pesou e o que mudou', () => {
    let v = pessoa(16, 90);
    v.educacao.basica = { etapa: 'medio', serie: 2, rede: 'publica', desempenho: 60, reprovacoes: 0 };
    v = executar(v, { tipo: 'objetivo_estudo', cursoId: 'medicina' }).vida;
    expect(v.educacao.objetivo?.cursoId).toBe('medicina');
    const med = curso('medicina');
    const e1 = estimativaParaCurso(v, med);
    expect(e1.corte).toBeGreaterThan(700);
    expect(e1.frase).toMatch(/Medicina/);
    // Trabalho → "O que você está construindo" lê a MESMA estimativa.
    const constr = emConstrucao(v, disp).find(c => c.id === 'vestibular')!;
    expect(constr.onde).toBe(e1.frase);
    // Um ano de cursinho dirigido.
    v = ano(v, [{ tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }]);
    expect(fazCursinho(v)).toBe(true);
    expect(bonusDoPreparo(v)).toBeGreaterThan(20);
    // (REWORK 3: com a mesma nota da escola — o ano letivo desta semente variou —, o cursinho encurta a distância.)
    v.educacao.basica!.desempenho = 60;
    const e2 = estimativaParaCurso(v, med);
    expect(e2.nota).toBeGreaterThan(e1.nota);
    // A prova: esperada + o dia. Em média, a prova É a estimativa.
    let soma = 0;
    for (let s = 1; s <= 300; s++) { const n = notasEnem(v, criarRng(s)); soma += (n.exatas + n.linguagens + n.ciencias * 3 + n.humanas) / 6; }
    // (Tolerância 10: perto do piso de 320 da prova, o corte do mínimo puxa a média um pouco para cima.)
    expect(Math.abs(soma / 300 - e2.nota)).toBeLessThan(10);
    v = executar(v, { tipo: 'enem' }).vida;
    const dev = v.caminhos.devolutivas.slice(-1)[0];
    expect(dev.tipo).toBe('vestibular');
    expect(dev.titulo).toMatch(/Medicina/);
    expect(dev.texto).toMatch(/corte ~\d+/);
    const ponderada = Number(dev.texto.match(/ponderada foi (\d+)/)![1]);
    expect(Math.abs(ponderada - e2.nota)).toBeLessThan(110);
    // Mais um ano: a próxima devolutiva compara com esta.
    v = ano(v, []);
    v.anoAtual = { acoes: [] };
    v = executar(v, { tipo: 'enem' }).vida;
    expect(v.caminhos.devolutivas.slice(-1)[0].texto).toMatch(/Desde o ENEM de \d{4}/);
  });
});

/* ================================================================ Parte B */

describe('8 e 9. acontecimento com alguém → reação (ou não) → relação → memória', () => {
  function comAmigaNoAperto(semente = 100) {
    const v = pessoa(30, semente);
    const { p, vin } = amigoProximo(v);
    p.aperto = { tipo: 'desemprego', t: v.t };
    p.renda = 0;
    return { v, id: p.id, vin };
  }

  it('8. a amiga perde o emprego e pede ajuda: ajudar muda a relação e fica na história (e no save)', () => {
    const { v, id } = comAmigaNoAperto();
    v.vinculos[id].chamado = { tipo: 'pedido_ajuda', t: v.t, texto: 'Bia perdeu o emprego e pediu ajuda.', assunto: 'emprego' };
    const antes = { ...v.vinculos[id] };
    const lista = interacoesPara(v, id).map(x => x.id);
    expect(lista.slice(0, 2)).toEqual(['chamado_sim', 'chamado_nao']);
    const x = executar(v, { tipo: 'pessoa', pessoaId: id, interacao: 'chamado_sim' }).vida;
    const vin = x.vinculos[id];
    expect(vin.chamado).toBeUndefined();
    expect(vin.confianca).toBeGreaterThan(antes.confianca);
    expect(vin.proximidade).toBeGreaterThan(antes.proximidade);
    expect(vin.historia.some(h => h.tipo === 'apoio' && /Pediu ajuda/.test(h.texto))).toBe(true);
    // Reagir não gastou o tempo do ano com as pessoas.
    expect(tenta(x, { tipo: 'pessoa', pessoaId: id, interacao: 'tempo' }) || tenta(x, { tipo: 'pessoa', pessoaId: id, interacao: 'ligar' })).toBe(true);
    const r = interpretar(JSON.stringify(x));
    if (r.tipo !== 'ok') throw new Error(r.tipo === 'invalido' ? r.motivo : 'vazio');
    expect(r.vida.vinculos[id].historia).toEqual(vin.historia);
  });

  it('9. o mesmo aperto, sem reação: um ano depois a relação lembra que você não apareceu (diferente de ter apoiado)', () => {
    const { v, id } = comAmigaNoAperto(101);
    let apoiou = executar(clone(v), { tipo: 'pessoa', pessoaId: id, interacao: 'apoiar' }).vida;
    let sumiu = clone(v);
    for (let k = 0; k < 2; k++) { apoiou = ano(apoiou); sumiu = ano(sumiu); }
    const a = apoiou.vinculos[id], s = sumiu.vinculos[id];
    expect(a.historia.some(h => h.tipo === 'apoio')).toBe(true);
    expect(s.historia.some(h => /não apareceu|a resposta não veio/.test(h.texto))).toBe(true);
    expect(a.confianca).toBeGreaterThan(s.confianca);
    expect(a.proximidade).toBeGreaterThan(s.proximidade);
  });

  it('9b. um pedido de ajuda ignorado vira resposta no ano seguinte', () => {
    const { v, id } = comAmigaNoAperto(102);
    v.vinculos[id].chamado = { tipo: 'pedido_ajuda', t: v.t, texto: 'Bia pediu ajuda.', assunto: 'emprego' };
    const confia = v.vinculos[id].confianca;
    const x = ano(v);
    expect(x.vinculos[id].chamado?.tipo === 'pedido_ajuda' && x.vinculos[id].chamado!.t === v.t).toBe(false);
    expect(x.vinculos[id].historia.some(h => /a resposta não veio/.test(h.texto))).toBe(true);
    expect(x.vinculos[id].confianca).toBeLessThan(confia);
  });
});

describe('10. busca ativa de relacionamento → encontro → resultado → persistência', () => {
  it('procurar é escolha; aparecer alguém, haver interesse ou não, é da vida — e quem aparece fica', () => {
    let achou = 0, ninguem = 0, semFaisca = 0;
    let exemplo: Vida | undefined;
    let id = '';
    for (let s = 110; s < 130; s++) {
      const v = pessoa(27, s);
      for (const vin of Object.values(v.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
      v.eu.atracao = 'homens';
      const r = executar(v, { tipo: 'conhecer_alguem', contexto: 'app' });
      const x = r.vida;
      expect(tenta(x, { tipo: 'conhecer_alguem', contexto: 'app' })).toBe(false); // uma vez por ano
      if (!r.pessoaId) { ninguem++; continue; }
      const vin = x.vinculos[r.pessoaId];
      if (vin?.romance?.estagio === 'interesse') { achou++; if (!exemplo) { exemplo = x; id = r.pessoaId; } } else semFaisca++;
    }
    expect(achou).toBeGreaterThan(0);
    expect(ninguem + semFaisca).toBeGreaterThan(0);
    // Com o match, o próximo passo é o do aplicativo: conversar (depois, o encontro) — a resposta é da outra pessoa.
    // (Pacote pós-playtest: o app tem fluxo próprio; o "chamar para sair" genérico não atravessa o match.)
    expect(tenta(exemplo!, { tipo: 'pessoa', pessoaId: id, interacao: 'app_conversar' })).toBe(true);
    const r = interpretar(JSON.stringify(exemplo!));
    if (r.tipo !== 'ok') throw new Error(r.tipo === 'invalido' ? r.motivo : 'vazio');
    expect(r.vida.vinculos[id].romance?.estagio).toBe('interesse');
    expect(r.vida.pessoas[id].nome).toBe(exemplo!.pessoas[id].nome);
  });

  it('não se procura estando num relacionamento, nem sem dizer por quem se interessa', () => {
    const v = pessoa(27, 131);
    for (const vin of Object.values(v.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
    v.eu.atracao = undefined;
    expect(disponibilidade(v, { tipo: 'conhecer_alguem', contexto: 'app' }).motivo).toMatch(/por quem você se interessa/);
    v.eu.atracao = 'mulheres';
    const p = criarPessoa(v, criarRng(4), { idade: 27, genero: 'feminino', municipioId: v.moradia.municipioId });
    const vin = vincular(v, p, { origem: 'romance', proximidade: 70, convivio: ['casa'] });
    vin.romance = { estagio: 'namoro', tEstagio: v.t - 12, envolvimento: 70 };
    expect(tenta(v, { tipo: 'conhecer_alguem', contexto: 'app' })).toBe(false);
  });
});

describe('11. a outra pessoa age por iniciativa própria → o jogador percebe → pode reagir', () => {
  function casal(semente: number) {
    const v = pessoa(35, semente);
    for (const vin of Object.values(v.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
    const p = criarPessoa(v, criarRng(5), { idade: 35, genero: 'masculino', municipioId: v.moradia.municipioId });
    const vin = vincular(v, p, { origem: 'romance', proximidade: 60, convivio: ['casa'] });
    vin.romance = { estagio: 'casamento', tEstagio: v.t - 60, tInicio: v.t - 96, envolvimento: 38 };
    vin.tensao = 50;
    return { v, id: p.id };
  }

  it('a parceria insatisfeita pede para conversar; a conversa muda a relação; o silêncio também', () => {
    let achou: { v: Vida; id: string } | undefined;
    for (let s = 140; s < 170 && !achou; s++) {
      const c = casal(s);
      const x = transacao(c.v, (y, r) => processarIniciativas(y, r)).vida;
      if (x.vinculos[c.id].chamado?.tipo === 'conversa_casal') achou = { v: x, id: c.id };
    }
    expect(achou).toBeTruthy();
    const { v, id } = achou!;
    const conversa = executar(clone(v), { tipo: 'pessoa', pessoaId: id, interacao: 'chamado_sim' }).vida;
    expect(conversa.vinculos[id].romance!.envolvimento).toBeGreaterThan(v.vinculos[id].romance!.envolvimento);
    expect(conversa.vinculos[id].tensao).toBeLessThan(v.vinculos[id].tensao);
    // Sem reação, o ano seguinte responde por você.
    const x = transacao(clone(v), (y, r) => { y.t += 12; processarIniciativas(y, r); }).vida;
    expect(x.vinculos[id].historia.some(h => /a conversa não aconteceu/.test(h.texto))).toBe(true);
  });

  it('quem está perto aparece quando você atravessa um momento difícil (sem ser chamado) — e amortece, sem apagar', () => {
    let visto = false;
    for (let s = 170; s < 200 && !visto; s++) {
      const v = pessoa(40, s);
      const { p } = amigoProximo(v, 'Lia');
      v.luto.push({ pessoaId: p.id, t: v.t, peso: 60 });
      const humorAntes = v.mente.felicidade;
      const x = transacao(v, (y, r) => processarIniciativas(y, r)).vida;
      const quem = vinculosVivos(x).find(q => q.vin.chamado?.tipo === 'apoio');
      if (!quem) continue;
      visto = true;
      expect(x.mente.felicidade - humorAntes).toBeGreaterThan(0);
      expect(x.mente.felicidade - humorAntes).toBeLessThanOrEqual(4);
      expect(quem.vin.historia.some(h => /Apareceu quando você precisava/.test(h.texto))).toBe(true);
      expect(x.biografia.some(e => e.pessoas?.includes(quem.p.id) && e.relevancia === 'biografia')).toBe(true);
    }
    expect(visto).toBe(true);
  });
});

describe('12. relações pesam no bem-estar, moderadamente', () => {
  it('rede de apoio ajuda e isolamento pesa — nenhum dos dois decide sozinho o bem-estar', () => {
    const v = pessoa(35, 210);
    const isolada = clone(v);
    for (const vin of Object.values(isolada.vinculos)) { vin.convivio = []; vin.tUltimoContato = isolada.t - 60; if (vin.romance) vin.romance = undefined; }
    isolada.moradia = { ...isolada.moradia, tipo: 'aluguel' };
    const cercada = clone(isolada);
    for (const n of ['Ana', 'Duda', 'Téo']) { const { vin } = amigoProximo(cercada, n); vin.convivio = ['rotina']; vin.tUltimoContato = cercada.t; }
    const rede = fatoresHumor(cercada).find(f => f.id === 'rede');
    const solidao = fatoresHumor(isolada).find(f => f.id === 'solidao');
    expect(rede!.efeito).toBeGreaterThan(0);
    expect(rede!.efeito).toBeLessThanOrEqual(12);
    expect(solidao!.efeito).toBeLessThan(0);
    const dif = alvoHumor(cercada) - alvoHumor(isolada);
    expect(dif).toBeGreaterThan(8);
    expect(dif).toBeLessThan(25);
  });
});

describe('13. save/reload e migração v15 → v16', () => {
  it('estados pessoais e sociais novos sobrevivem ao save', () => {
    const v = pessoa(30, 220);
    v.educacao.objetivo = { cursoId: 'direito', t: v.t };
    v.educacao.preparo = { meses: 18, tUltimo: v.t };
    v.corpo.condicoes.push({ id: 'hipertensao', nome: 'pressão alta', tInicio: v.t - 40, cronica: true, gravidade: 1, tratando: true, diagnosticada: true, tDiagnostico: v.t - 2, tarde: true });
    const { vin } = amigoProximo(v);
    vin.chamado = { tipo: 'convite', t: v.t, texto: 'Bia chamou você para um show.', assunto: 'um show' };
    const r = interpretar(JSON.stringify(v));
    if (r.tipo !== 'ok') throw new Error(r.tipo === 'invalido' ? r.motivo : 'vazio');
    expect(r.vida).toEqual(v);
  });

  it('v15 → v16: predisposições da semente (sem acaso), aparência de nascença, cursinho vira preparação; idempotente e determinística', () => {
    const v = pessoa(17, 230);
    const v15 = JSON.parse(JSON.stringify(v));
    v15.versao = 15; delete v15.predisposicoes; delete v15.corpo.aparenciaBase; delete v15.educacao.preparo; v15.educacao.cursinho = true;
    const a = interpretar(JSON.stringify(v15));
    const b = interpretar(JSON.stringify(v15));
    if (a.tipo !== 'ok' || b.tipo !== 'ok') throw new Error('não migrou');
    expect(a.migrado).toBe(true);
    expect(a.vida.versao).toBe(VERSAO_SAVE);
    expect(a.vida).toEqual(b.vida);
    expect(a.vida.predisposicoes).toEqual(derivarPredisposicoes(v.id));
    expect(a.vida.corpo.aparenciaBase).toBe(v.corpo.aparencia);
    expect(a.vida.educacao.preparo?.meses).toBe(12);
    // Idempotente: aplicar de novo as migrações (v15→v16→v17→v18) não muda nada.
    expect(migrarV19(migrarV18(migrarV17(migrarV16(migrarV15(structuredClone(a.vida))))))).toEqual(a.vida);
    // E a vida continua.
    let x = a.vida;
    for (let k = 0; k < 3 && !x.morte; k++) x = ano(x);
    expect(JSON.stringify(x)).not.toMatch(/NaN/);
  });

  it('mesma semente + mesmas ações = mesma vida (com as ações novas)', () => {
    const acoes = (v: Vida): Acao[] => idade(v) === 16 ? [{ tipo: 'objetivo_estudo', cursoId: 'medicina' }, { tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }] : idade(v) === 20 ? [{ tipo: 'rotina', id: 'academia', ativa: true, nivel: 1 }] : idade(v) === 24 ? [{ tipo: 'conhecer_alguem', contexto: 'app' }] : [];
    const a = viver(nova({ semente: 240 }), 30, acoes);
    const b = viver(nova({ semente: 240 }), 30, acoes);
    expect(a).toEqual(b);
  });
});

/* ================================================================ Unidades */

describe('fundação pessoal', () => {
  it('predisposições: estáveis, da semente, −1..1, e não gastam o gerador da criação', () => {
    const v = nova({ semente: 250 });
    expect(v.predisposicoes).toEqual(derivarPredisposicoes(v.id));
    for (const k of ['cognitiva', 'fisica', 'artistica'] as const) { expect(predisposicao(v, k)).toBeGreaterThanOrEqual(-1); expect(predisposicao(v, k)).toBeLessThanOrEqual(1); expect(Object.is(predisposicao(v, k), -0)).toBe(false); }
    expect(nova({ semente: 250 })).toEqual(v);
  });

  it('condicionamento tem causas com nome (e o treino é o fator que mais pesa)', () => {
    const v = pessoa(25, 260);
    v.rotinas = [{ id: 'academia', tInicio: v.t - 24 }];
    const f = fatoresCondicionamento(v);
    expect(f[0].id).toBe('treino');
    expect(alvoCondicionamento(v)).toBeGreaterThan(60);
    v.rotinas = [];
    expect(alvoCondicionamento(v)).toBeLessThan(40);
  });

  it('cursinho: a rotina é a fonte única — começou agora, ainda não rende; um ano depois, rende', () => {
    let v = pessoa(17, 270);
    v.educacao.basica = { etapa: 'medio', serie: 3, rede: 'publica', desempenho: 60, reprovacoes: 0 };
    v = executar(v, { tipo: 'rotina', id: 'cursinho', ativa: true, nivel: 1 }).vida;
    expect(fazCursinho(v)).toBe(true);
    expect(bonusDoPreparo(v)).toBe(0);
    v = ano(v);
    expect(bonusDoPreparo(v)).toBeGreaterThan(20);
  });

  it('prática que dura vira marco da biografia uma vez só (a ida de cada semana, não)', () => {
    let v = pessoa(9, 280);
    const t0 = v.t;
    for (let k = 0; k < 6; k++) v = ano(v, [{ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 }]);
    const marcos = v.biografia.filter(e => /virou parte da vida/.test(e.texto));
    expect(marcos.length).toBe(1);
    // Seis anos de treino não viram seis linhas: o marco, e no máximo um ou outro destaque de campeonato.
    // (Só as linhas destes seis anos: a primeira infância da vida sorteada pode ter tido a sua bola.)
    expect(v.biografia.filter(e => e.t > t0 && /bola|futebol|escolinha|artilheir/i.test(e.texto) && e.relevancia !== 'tecnico').length).toBeLessThanOrEqual(3);
  });
});

describe('saves v15 reais (motor da base f7b84a9)', () => {
  const ler = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
  for (const nome of ['save-v15-vestibulanda-cursinho.json', 'save-v15-adulto-condicoes.json', 'save-v15-idosa-leitora.json']) {
    it(`${nome}: migra, valida, deriva o novo, segue vivendo, exporta e importa`, () => {
      const bruto = JSON.parse(ler(nome));
      expect(bruto.versao).toBe(15);
      const r = interpretar(ler(nome));
      if (r.tipo !== 'ok') throw new Error(r.tipo === 'invalido' ? r.motivo : 'vazio');
      expect(r.migrado).toBe(true);
      let v = r.vida;
      expect(v.versao).toBe(VERSAO_SAVE);
      expect(v.predisposicoes).toEqual(derivarPredisposicoes(v.id));
      expect(v.corpo.aparenciaBase).toBe(bruto.corpo.aparencia);
      if (bruto.educacao.cursinho) expect(v.educacao.preparo?.meses).toBe(12);
      // Condições da v15 foram diagnosticadas na hora: continuam com nome (não viram sinal).
      for (const c of v.corpo.condicoes) expect(c.diagnosticada).not.toBe(false);
      expect(interpretar(ler(nome))).toEqual(r);
      for (let k = 0; k < 3 && !v.morte; k++) v = ano(v);
      expect(JSON.stringify(v)).not.toMatch(/NaN/);
      if (!v.morte) {
        const volta = interpretar(JSON.stringify(v));
        expect(volta.tipo).toBe('ok');
      }
    }, 30000);
  }

  it('o cursinho eterno da base (15 anos sem prova) termina no primeiro ano', () => {
    const r = interpretar(ler('save-v15-adulto-condicoes.json'));
    if (r.tipo !== 'ok') throw new Error('não migrou');
    expect(r.vida.rotinas.some(x => x.id === 'cursinho')).toBe(true);
    const v = ano(r.vida);
    expect(v.rotinas.some(x => x.id === 'cursinho')).toBe(false);
  });
});
