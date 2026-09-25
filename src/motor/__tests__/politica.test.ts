/**
 * Vida política: portas pela biografia, filiação, campanha como processo,
 * derrota que vira história, vitória, mandato, reeleição, outro cargo,
 * saída voluntária, volta à profissão, família e estado pessoal, carreira
 * tardia, impossibilidades institucionais, save e determinismo.
 */

import { describe, expect, it } from 'vitest';
import { nova, responder, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { transacao, vinculosVivos, idade } from '../nucleo';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import type { CargoEletivo, Vida } from '../tipos';
import { ocupacao } from '../dados/ocupacoes';
import { contratar, elegibilidade } from '../sistemas/trabalho';
import {
  cargosDaEleicao, eleicaoNaJanela, entrarNaPolitica, leituraPolitica, podeConcorrer, portasDaPolitica, processarPolitica, proximaEleicao, tipoDeEleicao
} from '../sistemas/politica';
import { acoesDoTrabalho, modoDoTrabalho } from '../sistemas/profissao';
import { fatoresCabeca } from '../sistemas/estado';
import { semana } from '../sistemas/semana';
import { interpretar } from '../save';
import { conteudoPorId, abrirDecisao } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { POLITICA } from '../conteudo/politica';
import { criarPessoa, vincular } from '../pessoas';

function adulto(i = 34, semente = 7, municipioId = 'recife-pe'): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, municipioId }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, municipioId }), i);
  v.momento = null;
  v.trabalho.atual = undefined; v.trabalho.aposentadoria = undefined; v.trabalho.pausa = undefined;
  v.educacao.matricula = undefined; v.educacao.basica = undefined;
  v.caminhos.envolvimento = undefined; v.caminhos.militar = undefined; v.caminhos.negocio = undefined; v.caminhos.esporte = undefined; v.caminhos.politica = undefined;
  v.caminhos.processo = undefined; v.caminhos.oportunidades = [];
  v.justica = undefined;
  v.corpo.saude = 85; v.corpo.condicoes = [];
  v.mente.estresse = 30;
  v.financas.conta = 50000; v.financas.dividas = []; v.financas.negativado = false;
  v.anoAtual = { acoes: [] };
  delete v.fatos['chegou_cidade'];
  return v;
}

const A = (oque: string, valor?: string) => ({ tipo: 'politica', oque, valor } as unknown as Acao);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

/** Filiado há anos, com base; sem campanha. */
function politico(v: Vida, apoio = 40, reputacao = 30): Vida {
  return transacao(v, x => { const p = entrarNaPolitica(x, 'comunidade'); p.partido = 'Partido Ipê'; p.tFiliacao = x.t - 36; p.fase = 'filiado'; p.apoio = apoio; p.reputacao = reputacao; }).vida;
}

/** Vive, sem se candidatar sozinho, até a janela de uma eleição do tipo pedido. */
function ateAJanela(v: Vida, tipo: 'municipal' | 'geral'): Vida {
  for (let k = 0; k < 8 && eleicaoNaJanela(v)?.tipo !== tipo; k++) {
    v = avancarAno(v).vida;
    while (v.momento) v = responder(v, v.momento.situacaoId === 'pol_eleicao' ? (v.caminhos.politica?.mandato ? 'voltar' : 'nao') : 'ficar');
  }
  return v;
}

/** A campanha inteira: cargo → dinheiro → rua → tom. */
function candidatar(v: Vida, cargo: CargoEletivo, rua = 'rua_redes', fin = 'fin_pequenas'): Vida {
  v = executar(v, A('candidatura')).vida;
  expect(v.momento?.situacaoId).toBe('pol_eleicao');
  v = executar(v, { tipo: 'decidir', opcaoId: `cargo_${cargo}` }).vida;
  expect(v.caminhos.politica?.campanha?.cargo).toBe(cargo);
  v = executar(v, { tipo: 'decidir', opcaoId: fin }).vida;
  v = executar(v, { tipo: 'decidir', opcaoId: rua }).vida;
  v = executar(v, { tipo: 'decidir', opcaoId: 'tom_propostas' }).vida;
  expect(v.momento).toBeNull();
  return v;
}

/** Vive até sair o resultado (e a posse, se houver). */
function apurar(v: Vida, forcar?: 'ganha' | 'perde'): Vida {
  if (forcar) v = transacao(v, x => { const p = x.caminhos.politica!; if (forcar === 'ganha') { p.apoio = 100; p.reputacao = 100; p.desgaste = 0; p.campanha!.nota = 120; } else { p.apoio = 0; p.reputacao = 0; p.desgaste = 100; p.campanha!.nota = -60; } }).vida;
  for (let k = 0; k < 3 && (v.caminhos.politica?.campanha || v.caminhos.politica?.posse); k++) {
    v = avancarAno(v).vida;
    while (v.momento) v = responder(v, v.momento.situacaoId === 'pol_eleicao' ? 'nao' : 'ficar');
  }
  return v;
}

describe('calendário e leitura', () => {
  it('eleições municipais em 2028, 2032…; gerais em 2030, 2034…', () => {
    expect(tipoDeEleicao(2028)).toBe('municipal');
    expect(tipoDeEleicao(2030)).toBe('geral');
    expect(tipoDeEleicao(2029)).toBeUndefined();
    expect(tipoDeEleicao(2032)).toBe('municipal');
    expect(proximaEleicao(2029 * 12).ano).toBe(2030);
  });
});

describe('1. entrada pela vida comunitária', () => {
  it('quem faz voluntariado tem uma porta; o convite é uma decisão com recusa; aceitar começa a trajetória', () => {
    let v = adulto(38);
    v.rotinas.push({ id: 'voluntariado', tInicio: v.t - 60, nivel: 2 });
    expect(portasDaPolitica(v).map(x => x.origem)).toContain('comunidade');
    v = transacao(v, x => { x.fatos['pol_porta'] = x.t; x.fatos['pol_origem'] = 0; const d = conteudoPorId('pol_convite')!; if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, criarRng(1))); }).vida;
    expect(v.momento?.opcoes.map(o => o.id)).toEqual(expect.arrayContaining(['entrar', 'nao']));
    v = executar(v, { tipo: 'decidir', opcaoId: 'entrar' }).vida;
    expect(v.caminhos.politica?.fase).toBe('envolvido');
    expect(v.caminhos.politica?.origem).toBe('comunidade');
    expect(vinculosVivos(v).some(x => x.p.ocupacao === 'liderança política')).toBe(true);
    expect(v.biografia.some(e => /vida política/.test(e.texto))).toBe(true);
  });
  it('a porta vem da vida, com o tempo: entre vidas com voluntariado, a maioria recebe o convite em 15 anos', () => {
    let convidados = 0;
    for (let s = 1; s <= 12; s++) {
      let v = adulto(30, s);
      v.rotinas.push({ id: 'voluntariado', tInicio: v.t - 36, nivel: 2 });
      for (let k = 0; k < 15 && v.fatos['pol_porta'] === undefined; k++) v = transacao(v, (x, r) => { x.t += 12; processarPolitica(x, r); }).vida;
      if (v.fatos['pol_porta'] !== undefined) convidados++;
    }
    expect(convidados).toBeGreaterThanOrEqual(6);
  });
});

describe('2 e 3. candidatura: derrota (não é fim de jogo) e vitória', () => {
  it('derrota: vira história, a profissão continua, a trajetória segue entre mandatos', () => {
    let v = politico(adulto(34), 10, 8);
    v = transacao(v, x => { contratar(x, criarRng(1), ocupacao('vendedor')); }).vida;
    v = ateAJanela(v, 'municipal');
    v = candidatar(v, 'vereador');
    v = apurar(v, 'perde');
    const p = v.caminhos.politica!;
    expect(p.historico[p.historico.length - 1]?.resultado).toBe('derrotado');
    expect(p.fase).toBe('entre_mandatos');
    expect(v.morte).toBeUndefined();
    expect(v.trabalho.atual?.ocupacaoId).toBe('vendedor');
    expect(v.caminhos.marcas.some(m => m.tipo === 'derrota')).toBe(true);
    expect(leituraPolitica(v)!.titulo).toMatch(/derrota/);
    // A derrota deixa nome (a apuração foi forçada a partir de zero): da próxima vez, conta um pouco a favor.
    expect(p.reputacao).toBeGreaterThan(0);
  });
  it('vitória: posse em janeiro, mandato como vínculo próprio (não é emprego nem concurso)', () => {
    let v = politico(adulto(34));
    v = ateAJanela(v, 'municipal');
    v = candidatar(v, 'vereador');
    v = apurar(v, 'ganha');
    const p = v.caminhos.politica!;
    expect(p.fase).toBe('mandato');
    expect(p.mandato?.cargo).toBe('vereador');
    expect(v.trabalho.atual?.contrato).toBe('eletivo');
    expect(v.trabalho.atual?.ocupacaoId).toBe('vereador');
    expect(modoDoTrabalho(v)).toBe('politica');
    expect(v.trabalho.atual!.empregador).toMatch(/Câmara Municipal/);
    expect((p.mandato!.tFim - p.mandato!.tInicio) / 12).toBe(4);
    expect(v.caminhos.marcas.some(m => m.tipo === 'eleicao')).toBe(true);
  });
});

function vereadorEmMandato(semente = 7, cargo: CargoEletivo = 'vereador', i = 34): Vida {
  let v = politico(adulto(i, semente), 60, 55);
  v = ateAJanela(v, 'municipal');
  v = candidatar(v, cargo);
  return apurar(v, 'ganha');
}

describe('4. mandato', () => {
  it('o mandato tem prazo, subsídio, aprovação, crises e prioridade — e pesa na cabeça', () => {
    let v = vereadorEmMandato();
    expect(v.trabalho.atual!.salario).toBeGreaterThan(3000);
    expect(fatoresCabeca(v).some(f => f.id === 'politica')).toBe(true);
    const ids = [...acoesDoTrabalho(v, disponibilidade).agora, ...acoesDoTrabalho(v, disponibilidade).mais].map(x => x.id);
    expect(ids).toContain('pol_prioridade');
    expect(ids).toContain('pol_comunidade');
    expect(ids).not.toContain('aumento');
    expect(tenta(v, { tipo: 'pedir_demissao' })).toBe(false);
    expect(tenta(v, { tipo: 'aposentar' })).toBe(false);
    const antes = v.caminhos.politica!.mandato!.aprovacao;
    v = executar(v, A('prioridade', 'saude')).vida;
    expect(v.caminhos.politica!.mandato!.aprovacao).toBeGreaterThanOrEqual(antes);
    expect(v.caminhos.politica!.prioridade).toBe('saude');
    // Crises: acontecem; o jogador responde.
    let houve = false;
    for (let k = 0; k < 3 && !houve; k++) {
      v = avancarAno(v).vida;
      while (v.momento) { if (v.momento.situacaoId === 'pol_crise') houve = true; v = responder(v, v.momento.situacaoId === 'pol_eleicao' ? 'voltar' : undefined); }
    }
    if (!houve) v = transacao(v, x => { x.caminhos.politica!.mandato!.crise = { t: x.t, tipo: 'aliado' }; }).vida;
    if (v.caminhos.politica?.mandato?.crise) { expect(tenta(v, A('crise'))).toBe(true); }
  });
});

describe('5. reeleição', () => {
  it('prefeito: uma reeleição seguida; o terceiro mandato seguido é impossível', () => {
    let v = vereadorEmMandato(7, 'prefeito');
    expect(v.caminhos.politica?.mandato?.cargo).toBe('prefeito');
    v = ateAJanela(v, 'municipal');
    const op = cargosDaEleicao(v).find(x => x.cargo === 'prefeito')!;
    expect(podeTentar(op.veredito)).toBe(true);
    v = candidatar(v, 'prefeito');
    v = apurar(v, 'ganha');
    expect(v.caminhos.politica!.consecutivos).toBe(2);
    v = ateAJanela(v, 'municipal');
    const e = eleicaoNaJanela(v)!;
    const d = podeConcorrer(v, 'prefeito', e.t);
    expect(d.grau).toBe('ilegal');
    expect(d.motivo).toMatch(/só uma reeleição/);
  });
});

describe('6. outro cargo', () => {
  it('vereador disputa deputado estadual sem renunciar; prefeito que quer outro cargo precisa renunciar', () => {
    let v = vereadorEmMandato(7, 'vereador', 36);
    v = ateAJanela(v, 'geral');
    const e = eleicaoNaJanela(v)!;
    expect(podeConcorrer(v, 'deputado_estadual', e.t).grau).toBe('permitido');
    expect(podeConcorrer(v, 'vereador', e.t).grau).toBe('impossivel'); // não é eleição municipal
    v = candidatar(v, 'deputado_estadual');
    v = apurar(v, 'ganha');
    expect(v.caminhos.politica!.mandato!.cargo).toBe('deputado_estadual');
    expect(v.caminhos.politica!.historico.some(h => h.cargo === 'vereador' && h.resultado === 'concluiu')).toBe(true);
    let w = vereadorEmMandato(9, 'prefeito', 36);
    w = ateAJanela(w, 'geral');
    expect(podeConcorrer(w, 'deputado_federal', eleicaoNaJanela(w)!.t).grau).toBe('irregular');
  });
});

describe('7 e 8. sair e voltar', () => {
  it('abandonar a política: a trajetória encerra, a reputação fica, e dá para voltar um dia', () => {
    let v = politico(adulto(40));
    v = executar(v, A('deixar')).vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'sair' }).vida;
    expect(v.caminhos.politica!.fase).toBe('encerrada');
    expect(v.caminhos.marcas.some(m => m.tipo === 'fim_politica')).toBe(true);
    expect(tenta(v, A('aproximar'))).toBe(true);
  });
  it('servidor eleito volta ao mesmo cargo depois do mandato (o posto estava guardado)', () => {
    let v = politico(adulto(34), 60, 55);
    v = transacao(v, x => { contratar(x, criarRng(1), ocupacao('tecnico_publico'), 'concurso'); }).vida;
    v = ateAJanela(v, 'municipal');
    v = candidatar(v, 'vereador');
    v = apurar(v, 'ganha');
    expect(v.caminhos.politica!.anterior?.garantido).toBe(true);
    // Renuncia (ou termina): de volta ao cargo público.
    v = executar(v, A('deixar')).vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'renunciar' }).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('tecnico_publico');
    expect(v.biografia.some(e => /posto estava guardado/.test(e.texto))).toBe(true);
  });
  it('autônomo volta ao ofício com menos freguesia', () => {
    let v = politico(adulto(34), 60, 55);
    v.trabalho.experiencia['eletrica'] = 80;
    v = transacao(v, x => { const e = contratar(x, criarRng(1), ocupacao('eletricista')); e.clientela = 60; }).vida;
    v = ateAJanela(v, 'municipal');
    v = candidatar(v, 'vereador');
    v = apurar(v, 'ganha');
    v = executar(v, A('deixar')).vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'renunciar' }).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('eletricista');
    expect(v.trabalho.atual!.clientela!).toBeLessThan(60);
  });
});

describe('9. família e estado pessoal', () => {
  it('campanha porta a porta: semana cheia, cabeça, tensão com a parceria; Brasília afasta as crianças', () => {
    let v = politico(adulto(34));
    const par = criarPessoa(v, criarRng(2), { idade: 34, municipioId: v.moradia.municipioId });
    const vin = vincular(v, par, { origem: 'romance', proximidade: 70, convivio: ['casa'] });
    vin.romance = { estagio: 'casamento', tEstagio: v.t - 60, envolvimento: 70 };
    const filho = criarPessoa(v, criarRng(3), { idade: 6, municipioId: v.moradia.municipioId });
    vincular(v, filho, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
    v = ateAJanela(v, 'municipal');
    const tensao = v.vinculos[par.id].tensao;
    v = candidatar(v, 'vereador', 'rua_porta');
    expect(v.vinculos[par.id].tensao).toBeGreaterThan(tensao);
    expect(semana(v).fixos.some(f => f.id === 'politica')).toBe(true);
    expect(fatoresCabeca(v).some(f => f.id === 'politica' && /campanha/.test(f.texto))).toBe(true);
  });
});

describe('10. carreira política tardia', () => {
  it('aos 61, dá para procurar a política, filiar-se e ser eleito', () => {
    let v = adulto(61, 11);
    v = executar(v, A('aproximar')).vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'bairro' }).vida;
    expect(v.caminhos.politica?.fase).toBe('envolvido');
    v = executar(v, A('filiar')).vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'p0' }).vida;
    expect(v.caminhos.politica?.partido).toBeTruthy();
    v = transacao(v, x => { x.caminhos.politica!.tFiliacao = x.t - 12; x.caminhos.politica!.apoio = 60; }).vida;
    v = ateAJanela(v, 'municipal');
    v = candidatar(v, 'vereador');
    v = apurar(v, 'ganha');
    expect(v.caminhos.politica?.mandato?.cargo).toBe('vereador');
    expect(idade(v)).toBeGreaterThanOrEqual(62);
  });
});

describe('11. o que a instituição não permite, o jogo não permite', () => {
  const alvo = (v: Vida, tipo: 'municipal' | 'geral') => { const e = proximaEleicao(v.t, tipo); return e.t; };
  it('idade mínima por cargo, filiação e domicílio de seis meses, preso, Ficha Limpa, conscrito, cargo fora da eleição', () => {
    const v = politico(adulto(34));
    const tm = alvo(v, 'municipal');
    const tg = alvo(v, 'geral');
    expect(podeConcorrer(v, 'vereador', tg).grau).toBe('impossivel');
    expect(podeConcorrer(v, 'senador', tm).grau).toBe('impossivel');
    const jovem = politico(adulto(18, 3));
    expect(podeConcorrer(jovem, 'prefeito', alvo(jovem, 'municipal')).grau).toBe(idade(jovem) + Math.ceil((alvo(jovem, 'municipal') - jovem.t) / 12) >= 21 ? 'permitido' : 'ilegal');
    const trinta = politico(adulto(30, 4));
    expect(podeConcorrer(trinta, 'senador', alvo(trinta, 'geral')).grau).toBe('ilegal');
    const semPartido = transacao(adulto(34), x => { entrarNaPolitica(x, 'comunidade'); }).vida;
    expect(podeConcorrer(semPartido, 'vereador', tm).grau).toBe('requisito');
    const recente = transacao(politico(adulto(34)), x => { x.caminhos.politica!.tFiliacao = tm - 3; }).vida;
    expect(podeConcorrer(recente, 'vereador', tm).motivo).toMatch(/seis meses/);
    const mudou = transacao(politico(adulto(34)), x => { x.fatos['chegou_cidade'] = tm - 2; }).vida;
    expect(podeConcorrer(mudou, 'vereador', tm).motivo).toMatch(/domicílio/);
    const preso = transacao(politico(adulto(34)), x => { x.justica = { antecedentes: [], prisao: { tInicio: x.t, tFim: x.t + 60, regime: 'fechado' } }; }).vida;
    expect(podeConcorrer(preso, 'vereador', tm).grau).toBe('ilegal');
    const ficha = transacao(politico(adulto(34)), x => { x.justica = { antecedentes: [{ t: x.t - 24, categoria: 'fraude', desfecho: 'alternativa', anos: 2 }] }; }).vida;
    expect(podeConcorrer(ficha, 'vereador', tm).motivo).toMatch(/Ficha Limpa/);
  });
  it('mandato não é vaga; militar da ativa não se filia; conscrito não se candidata', () => {
    const v = adulto(30);
    expect(elegibilidade(v, ocupacao('prefeito')).grau).toBe('impossivel');
    const soldado = transacao(adulto(19, 5), x => { contratar(x, criarRng(1), ocupacao('soldado_ep'), 'oportunidade'); entrarNaPolitica(x, 'comunidade'); }).vida;
    expect(tenta(soldado, A('filiar'))).toBe(false);
    const recruta = transacao(soldado, x => { x.caminhos.politica!.partido = 'Partido Ipê'; x.caminhos.politica!.tFiliacao = x.t - 24; }).vida;
    expect(podeConcorrer(recruta, 'vereador', proximaEleicao(recruta.t, 'municipal').t).grau).toBe('ilegal');
  });
  it('as decisões políticas não têm lado: partidos fictícios, nenhuma sigla ou nome real', () => {
    const texto = JSON.stringify(POLITICA.map(c => c.id)) + JSON.stringify(POLITICA.flatMap(c => (c.tipo === 'decisao' ? c.opcoes.map(o => (typeof o.texto === 'string' ? o.texto : '')) : [])));
    expect(texto).not.toMatch(/\b(PT|PL|MDB|PSDB|PSOL|PSD|PDT|União Brasil|Republicanos|esquerda|direita|conservador|progressista|comunista|liberal)\b/);
  });
});

describe('12. save e determinismo', () => {
  it('uma vida com mandato salva, valida e reabre igual', () => {
    const v = vereadorEmMandato();
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') { expect(r.vida.caminhos.politica?.mandato?.cargo).toBe('vereador'); expect(r.migrado).toBe(false); }
    const quebrado = structuredClone(v);
    (quebrado.caminhos.politica as { apoio: unknown }).apoio = 'muito';
    expect(interpretar(JSON.stringify(quebrado)).tipo).toBe('invalido');
  });
  it('mesma semente e mesmos comandos: a mesma vida política', () => {
    const a = vereadorEmMandato(13);
    const b = vereadorEmMandato(13);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
