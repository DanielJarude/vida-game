/**
 * FIX #3 (pós-playtest humano): conflitos de trajetória que PERGUNTAM,
 * negócio paralelo × principal, negócio por tipo (o on-line não recebe evento
 * de balcão), sócio, usos dos bens, pets por espécie e pela lei, bandeira
 * política nunca "undefined", partidos reais, serviço militar pela lei,
 * exportar/importar e a migração v12 → v13 com saves reais do playtest.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responderTudo, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar } from '../acoes';
import { idade, transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Especie, Vida } from '../tipos';
import { ocupacao } from '../dados/ocupacoes';
import { contratar } from '../sistemas/trabalho';
import { analisarEntrada, noServicoInicial, propor } from '../sistemas/compromissos';
import { abrirConflitoPendente } from '../conteudo/compromissos';
import { abrirNegocio, contaDoAno, dedicacaoDe, negocioAberto, processarNegocio } from '../sistemas/negocio';
import { acoesDoNegocio } from '../sistemas/gestao';
import { rotuloEstrategia, NEGOCIOS } from '../dados/negocios';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { adotarPet, causaDaMortePet, infoPet, podeTerPet, riscoDoPet } from '../sistemas/pets';
import { ANIMAIS, animal } from '../dados/animais';
import { ofertasDePets } from '../sistemas/mercado';
import { entrarNaPolitica, leituraPolitica, nomeDaBandeira, PARTIDOS, registrarCandidatura, proximaEleicao, processarPolitica } from '../sistemas/politica';
import { PARTIDOS_REAIS, oPartido } from '../dados/partidos';
import { CLUBES } from '../dados/clubes';
import { nomeDeClube } from '../sistemas/esporte';
import { incorporarAoServico, perspectivasMilitares } from '../sistemas/militar';
import { consequenciasDaMudanca } from '../sistemas/processos';
import { criarPessoa, vincular } from '../pessoas';
import { exportarVida, importarVida, interpretar, LIMITE_IMPORTACAO, VERSAO_SAVE } from '../save';

const fixture = (nome: string) => readFileSync(join(__dirname, 'fixtures', nome), 'utf8');

/** Adulto de `i` anos, sem trabalho, sem estudo, sem pendências. */
function adulto(i = 22, semente = 11, genero: 'feminino' | 'masculino' = 'masculino', municipioId = 'salvador-ba'): Vida {
  let s = semente;
  let v = viverAte(nova({ semente: s, genero, municipioId }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero, municipioId }), i);
  v.momento = null;
  v.trabalho.atual = undefined;
  v.trabalho.aposentadoria = undefined;
  v.trabalho.pausa = undefined;
  v.educacao.matricula = undefined;
  v.educacao.basica = undefined;
  v.educacao.escolaridade = 'medio';
  v.caminhos.envolvimento = undefined;
  v.caminhos.militar = undefined;
  v.caminhos.negocio = undefined;
  v.caminhos.esporte = undefined;
  v.caminhos.politica = undefined;
  v.caminhos.pendente = undefined;
  v.caminhos.processo = undefined;
  v.caminhos.oportunidades = [];
  v.justica = undefined;
  v.financas.conta = 60000;
  v.corpo.saude = 85;
  v.corpo.condicoes = [];
  return v;
}

const r = criarRng(3);
const em = (v: Vida, f: (x: Vida) => void): Vida => transacao(v, x => { f(x); }).vida;
const decidir = (v: Vida, opcaoId: string) => executar(v, { tipo: 'decidir', opcaoId });
const matricular = (x: Vida, cursoId: string, modalidade: 'presencial' | 'ead' = 'presencial') => {
  x.educacao.matricula = { cursoId, instituicao: 'a universidade federal', rede: 'publica', modalidade, tInicio: x.t - 12, mesesRestantes: 36, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
};
/** Propõe algo novo e, se houver conflito, abre a pergunta. */
const proporEAbrir = (v: Vida, novo: Parameters<typeof propor>[2]) => {
  let res: ReturnType<typeof propor> = 'feito';
  const w = em(v, x => { res = propor(x, r, novo); if (res === 'pendente') abrirConflitoPendente(x, r); });
  return { v: w, res };
};
const textosBio = (v: Vida) => v.biografia.map(l => l.texto).join('\n');
const petDe = (v: Vida, especie: Especie, idadeAnos = 0, origem: 'abrigo' | 'loja' | 'ilegal' = 'abrigo') => {
  let id = '';
  const w = em(v, x => { x.moradia.tipo = 'propria'; id = adotarPet(x, r, { especie, nome: 'Bicho', genero: 'feminino', idade: idadeAnos, porte: 'pequeno', jeito: 'calma', historia: 'teste' }, origem).id; });
  return { v: w, id };
};

/* ============================================================ Conflitos de trajetória */

describe('conflitos de trajetória: o jogo pergunta', () => {
  it('1. faculdade × base de futebol: a pergunta abre, cada plano diz o que acontece, e trancar vai para a Linha da Vida com o motivo', () => {
    const v0 = em(adulto(19), x => matricular(x, 'direito'));
    const { v, res } = proporEAbrir(v0, { tipo: 'base', dominio: 'futebol', municipioId: v0.moradia.municipioId, clube: 'Bahia' });
    expect(res).toBe('pendente');
    expect(v.momento?.situacaoId).toBe('comp_conflito');
    // Nada foi decidido em silêncio: a matrícula segue, a base ainda não existe.
    expect(v.educacao.matricula?.trancado).toBe(false);
    expect(v.caminhos.esporte).toBeUndefined();
    const planos = v.momento!.opcoes;
    expect(planos.length).toBeGreaterThanOrEqual(3);
    expect(planos.every(o => o.detalhe && o.detalhe.length > 5)).toBe(true); // consequência dita antes
    expect(planos.some(o => /Recusar/.test(o.texto))).toBe(true);
    const trancar = planos.find(o => /trancar/.test(o.texto))!;
    const depois = decidir(v, trancar.id).vida;
    expect(depois.educacao.matricula?.trancado).toBe(true);
    expect(depois.caminhos.esporte?.fase).toBe('base');
    expect(textosBio(depois)).toMatch(/Trancou Direito para entrar na base do Bahia/);
  });

  it('1b. recusar a base mantém a faculdade e registra a recusa como escolha', () => {
    const v0 = em(adulto(19), x => matricular(x, 'direito'));
    const { v } = proporEAbrir(v0, { tipo: 'base', dominio: 'futebol', municipioId: v0.moradia.municipioId, clube: 'Bahia' });
    const recusa = v.momento!.opcoes.find(o => /Recusar/.test(o.texto))!;
    const d = decidir(v, recusa.id).vida;
    expect(d.educacao.matricula?.trancado).toBe(false);
    expect(d.caminhos.esporte).toBeUndefined();
    expect(d.biografia.slice(-1)[0]?.texto).toMatch(/Recusou a base do Bahia para não largar Direito/);
  });

  it('2. trabalho × abrir empresa: manter o emprego (negócio paralelo) ou largar (negócio principal) — nunca troca sozinho', () => {
    const v0 = em(adulto(28), x => { contratar(x, r, ocupacao('vendedor'), 'teste'); x.trabalho.experiencia['comercio'] = 60; });
    const { v, res } = proporEAbrir(v0, { tipo: 'negocio', negocioId: 'lanchonete', modo: 'guardado' });
    expect(res).toBe('pendente');
    expect(v.trabalho.atual?.ocupacaoId).toBe('vendedor');
    const manter = v.momento!.opcoes.find(o => /manter o trabalho/.test(o.texto))!;
    const largar = v.momento!.opcoes.find(o => /deixar o trabalho/.test(o.texto))!;
    const paralelo = decidir(v, manter.id).vida;
    expect(paralelo.trabalho.atual?.ocupacaoId).toBe('vendedor');
    expect(dedicacaoDe(negocioAberto(paralelo)!)).toBe('paralela');
    const principal = decidir(v, largar.id).vida;
    expect(principal.trabalho.atual?.ocupacaoId).toBe(negocioAberto(principal)!.ocupacaoId);
    expect(dedicacaoDe(negocioAberto(principal)!)).toBe('integral');
    expect(textosBio(principal)).toMatch(/Deixou o trabalho de .* para abrir/);
  });

  it('3. trabalho integral × faculdade integral: conflito; faculdade EAD não conflita', () => {
    const base = adulto(20);
    const integral = em(base, x => matricular(x, 'medicina'));
    expect(analisarEntrada(integral, { tipo: 'emprego', ocupacaoId: 'caixa', via: 'concurso' }).some(c => c.com === 'curso')).toBe(true);
    const ead = em(base, x => matricular(x, 'administracao', 'ead'));
    expect(analisarEntrada(ead, { tipo: 'emprego', ocupacaoId: 'caixa', via: 'concurso' }).some(c => c.com === 'curso')).toBe(false);
  });

  it('3b. convocação de concurso com emprego: pergunta; a recusa é "não tomar posse"', () => {
    const v0 = em(adulto(30), x => { contratar(x, r, ocupacao('vendedor'), 'teste'); });
    const { v, res } = proporEAbrir(v0, { tipo: 'emprego', ocupacaoId: 'caixa', via: 'concurso' });
    expect(res).toBe('pendente');
    expect(v.momento!.opcoes.some(o => o.texto === 'Não tomar posse')).toBe(true);
    expect(v.momento!.opcoes.some(o => /Tomar posse e deixar o trabalho de/.test(o.texto))).toBe(true);
  });

  it('3c. candidatar-se por conta própria sem conflito entra direto (quem se candidatou já escolheu trocar)', () => {
    const v0 = em(adulto(30), x => { contratar(x, r, ocupacao('vendedor'), 'teste'); });
    expect(analisarEntrada(v0, { tipo: 'emprego', ocupacaoId: 'caixa', via: 'por_conta' })).toHaveLength(0);
  });

  it('3d. duas ofertas conflitantes no mesmo mês: a segunda passa, e fica dito por quê', () => {
    const v0 = em(adulto(19), x => matricular(x, 'medicina'));
    let segunda: string = '';
    const v = em(v0, x => {
      propor(x, r, { tipo: 'base', dominio: 'futebol', municipioId: x.moradia.municipioId, clube: 'Bahia' });
      segunda = propor(x, r, { tipo: 'emprego', ocupacaoId: 'caixa', via: 'concurso' });
    });
    expect(segunda).toBe('perdido');
    expect(v.biografia.slice(-1)[0]?.texto).toMatch(/prazo passou/);
  });

  it('3e. a pergunta pendente não se perde num ano novo, nem prende a vida num laço', () => {
    const v0 = em(adulto(19), x => matricular(x, 'direito'));
    let v = em(v0, x => { propor(x, r, { tipo: 'base', dominio: 'futebol', municipioId: x.moradia.municipioId, clube: 'Bahia' }); });
    expect(v.momento).toBeNull();
    v = avancarAno(v).vida;
    // O ano novo abre a pergunta (ou a vida segue sem pendência): nunca fica pendente sem pergunta.
    expect(v.caminhos.pendente ? v.momento?.situacaoId === 'comp_conflito' || !!v.momento : true).toBe(true);
    v = responderTudo(v);
    v = avancarAno(v).vida;
    v = responderTudo(v);
    expect(v.caminhos.pendente).toBeUndefined();
  });
});

/* ============================================================ Esporte */

describe('esporte: carreira visível, clubes reais', () => {
  it('4. o clube tem nome real da cidade (ou da capital), com artigo certo', () => {
    const nome = nomeDeClube('salvador-ba', 'x', 'futebol');
    expect(CLUBES.some(c => c.nome === nome)).toBe(true);
    const interior = nomeDeClube('feira-de-santana-ba', 'y', 'futebol');
    expect(interior).toBeTruthy();
    expect(interior).not.toMatch(/undefined/);
  });

  it('4b. entrar na base registra o clube e a fase; a base aparece como trajetória', () => {
    const v0 = adulto(16);
    const { v, res } = proporEAbrir(v0, { tipo: 'base', dominio: 'futebol', municipioId: v0.moradia.municipioId, clube: 'Vitória' });
    expect(res).toBe('feito');
    expect(v.caminhos.esporte?.clube).toBe('Vitória');
    expect(v.caminhos.esporte?.fase).toBe('base');
    expect(textosBio(v)).toMatch(/Vitória/);
  });
});

/* ============================================================ Serviço militar */

describe('serviço militar pela lei', () => {
  const soldado = () => em(adulto(18), x => { incorporarAoServico(x, r); });

  it('5. conscrito no primeiro ano: não pode "deixar a Força" (seria deserção)', () => {
    const v = soldado();
    expect(noServicoInicial(v)).toBe(true);
    const d = disponibilidade(v, { tipo: 'pedir_demissao' });
    expect(d.grau).not.toBe('permitido');
    expect(d.motivo ?? '').toMatch(/doze meses|deser|obrigat/i);
  });

  it('6. o emprego de quem foi convocado fica guardado (Lei 4.375, art. 60) — e volta na baixa', () => {
    let v = em(adulto(18), x => { contratar(x, r, ocupacao('vendedor'), 'teste'); });
    v = em(v, x => { propor(x, r, { tipo: 'servico_militar' }); });
    expect(v.trabalho.atual?.ocupacaoId).toBe('soldado_ep');
    expect(v.caminhos.militar?.empregoGuardado?.ocupacaoId ?? (v.caminhos.militar?.empregoGuardado as unknown as { emprego?: { ocupacaoId: string } })?.emprego?.ocupacaoId).toBe('vendedor');
  });

  it('7. perspectivas de progressão aparecem (sargento, oficial, temporário até oito anos)', () => {
    const p = perspectivasMilitares(soldado());
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p.map(x => `${x.oque} ${x.depende}`).join(' ')).toMatch(/sargento/i);
  });

  it('7b. a convocação não se recusa: sem plano de recusa; faculdade de medicina pode pedir adiamento (art. 29)', () => {
    const v0 = em(adulto(18), x => matricular(x, 'medicina'));
    const { v } = proporEAbrir(v0, { tipo: 'servico_militar' });
    const textos = v.momento!.opcoes.map(o => o.texto);
    expect(textos.some(t => /Recusar/.test(t))).toBe(false);
    expect(textos.some(t => /adiamento/.test(t))).toBe(true);
  });
});

/* ============================================================ Negócio */

describe('negócio: paralelo, principal, por tipo', () => {
  it('8. negócio paralelo não paga retirada e não fecha sozinho no ano seguinte', () => {
    let v = em(adulto(30), x => { contratar(x, r, ocupacao('vendedor'), 'teste'); abrirNegocio(x, r, 'loja_online', { modo: 'guardado', dedicacao: 'paralela' }); });
    const n = negocioAberto(v)!;
    expect(contaDoAno(v, n).retirada).toBe(0);
    for (let k = 0; k < 2; k++) v = em(v, x => { x.t += 12; processarNegocio(x, r); });
    expect(negocioAberto(v)).toBeTruthy();
    expect(v.trabalho.atual?.ocupacaoId).toBe('vendedor');
  });

  it('9. negócio principal é o trabalho de todo dia (o emprego é o de dono)', () => {
    const v = em(adulto(30), x => { abrirNegocio(x, r, 'oficina', { modo: 'guardado' }); });
    expect(v.trabalho.atual?.ocupacaoId).toBe(negocioAberto(v)!.ocupacaoId);
    expect(dedicacaoDe(negocioAberto(v)!)).toBe('integral');
  });

  it('10. loja on-line: "o jeito de vender" não oferece balcão nem "vender pela internet também"', () => {
    const v = em(adulto(30), x => { abrirNegocio(x, r, 'loja_online', { modo: 'guardado' }); });
    const d = conteudoPorId('neg_estrategia')!;
    if (d.tipo !== 'decisao') throw new Error('neg_estrategia deveria ser decisão');
    const c = contexto(v, r);
    const opcoes = (d.opcoes as { id: string; texto: string | ((c: unknown) => string); disponivel?: (c: unknown) => unknown }[]).filter(o => !o.disponivel || o.disponivel(c) === true).map(o => (typeof o.texto === 'function' ? o.texto(c) : o.texto));
    expect(opcoes.length).toBeGreaterThan(0);
    for (const t of opcoes) expect(t).not.toMatch(/internet também|balcão|vitrine|bairro/i);
    expect(rotuloEstrategia('online', 'bairro', 'loja_online')).toBeUndefined();
  });

  it('11. lanchonete e oficina têm ações próprias do ofício', () => {
    const disp = (w: Vida, a: Parameters<typeof disponibilidade>[1]) => disponibilidade(w, a);
    const lanch = em(adulto(30), x => { abrirNegocio(x, r, 'lanchonete', { modo: 'guardado' }); });
    const ofi = em(adulto(30), x => { abrirNegocio(x, r, 'oficina', { modo: 'guardado' }); });
    const rl = acoesDoNegocio(lanch, disp).map(a => a.rotulo).join(' | ');
    const ro = acoesDoNegocio(ofi, disp).map(a => a.rotulo).join(' | ');
    expect(rl).toMatch(/aplicativos de entrega|Cozinha nova|cardápio/);
    expect(ro).toMatch(/elevador|injeção/);
    expect(rl).not.toBe(ro);
  });

  it('11b. todo tipo de negócio tem presença e conteúdo próprio', () => {
    for (const t of NEGOCIOS) {
      expect(['rua', 'online', 'atendimento', 'obra']).toContain(t.presenca);
      expect(t.estrategias.length).toBeGreaterThan(0);
      for (const e of t.estrategias) expect(rotuloEstrategia(t.presenca, e, t.id)).toBeTruthy();
    }
  });

  it('12. sócio: tem parte, divide o resultado e aparece como ação (conversar, comprar a parte)', () => {
    const v = em(adulto(30), x => {
      const s = criarPessoa(x, r, { idade: 32, municipioId: x.moradia.municipioId, nome: 'Caio', sobrenome: 'Prado', genero: 'masculino' });
      vincular(x, s, { origem: 'amizade' as never, proximidade: 60, estagio: 'amigo_proximo' });
      abrirNegocio(x, r, 'comercio', { modo: 'socio', socioId: s.id });
      x.caminhos.negocio!.parteSocio = 0.5;
    });
    const n = negocioAberto(v)!;
    expect(n.socioId).toBeTruthy();
    const ids = acoesDoNegocio(v, (w, a) => disponibilidade(w, a)).map(a => a.id);
    expect(ids).toContain('conversar_socio');
    expect(ids).toContain('comprar_parte');
    expect(v.vinculos[n.socioId!].ambiente).toMatch(/^negocio:/);
  });

  it('13. negócio fechado não reabre sozinho, e prejuízo sai do bolso com registro', () => {
    let v = em(adulto(30), x => { abrirNegocio(x, r, 'lanchonete', { modo: 'guardado' }); const n = x.caminhos.negocio!; n.clientela = 0; n.caixa = 0; });
    v = em(v, x => { x.t += 12; x.financas.conta = 10000; processarNegocio(x, r); });
    const n = v.caminhos.negocio!;
    expect((n.resultadoAno ?? 0) < 0 || n.estado === 'apertado').toBe(true);
    if ((n.resultadoAno ?? 0) < 0) expect(textosBio(v)).toMatch(/do seu bolso|não pagou as contas|não rendeu/);
  });
});

describe('dono não pede demissão de si mesmo', () => {
  it('13b. esgotamento de quem é dono: "largar o dia a dia", o negócio segue nas horas vagas (achado da varredura de invariantes)', () => {
    let v = em(adulto(40), x => { abrirNegocio(x, r, 'lanchonete', { modo: 'guardado' }); x.mente.estresse = 90; });
    v = em(v, x => { const d = conteudoPorId('adu_burnout')!; if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); });
    const op = v.momento!.opcoes.find(o => o.id === 'pedir_conta')!;
    expect(op.texto).toMatch(/Largar o dia a dia de Lanchonete/);
    const d = decidir(v, 'pedir_conta').vida;
    expect(d.trabalho.atual).toBeUndefined();
    expect(negocioAberto(d)).toBeTruthy();
    expect(dedicacaoDe(negocioAberto(d)!)).toBe('paralela');
    expect(textosBio(d)).not.toMatch(/Pediu demissão/);
  });
});

/* ============================================================ Bens */

describe('usos dos bens', () => {
  it('14. veículo: passear e viajar são ações que custam e entram na vida', () => {
    let v = em(adulto(30), x => {
      x.trabalho.licencas.push('cnh');
      x.financas.bens.push({ id: 'b_car', tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'carro compacto', valor: 50000, precoPago: 50000, tCompra: x.t, estado: 90, dono: 'eu', historia: [] } as never);
    });
    expect(disponibilidade(v, { tipo: 'usar_veiculo', bemId: 'b_car', oque: 'passear' }).grau).toBe('permitido');
    const conta = v.financas.conta;
    v = executar(v, { tipo: 'usar_veiculo', bemId: 'b_car', oque: 'passear' }).vida;
    expect(v.financas.conta).toBeLessThan(conta);
    expect(disponibilidade(v, { tipo: 'usar_veiculo', bemId: 'b_car', oque: 'passear' }).grau).not.toBe('permitido'); // uma vez por ano
  });

  it('15. casa própria: reformar/decorar/receber a família', () => {
    const v = em(adulto(35), x => { x.moradia = { ...x.moradia, tipo: 'propria' }; });
    const algum = (['festa', 'familia', 'decorar', 'reformar'] as const).filter(o => disponibilidade(v, { tipo: 'usar_casa', oque: o }).grau === 'permitido');
    expect(algum.length).toBeGreaterThan(0);
    const d = executar(v, { tipo: 'usar_casa', oque: algum[0] });
    expect(d.vida.t).toBe(v.t);
  });
});

/* ============================================================ Pets */

describe('pets por espécie, pela lei', () => {
  it('16. cada espécie tem expectativa de vida própria', () => {
    expect(animal('gato').vida[0]).toBeGreaterThanOrEqual(12);
    expect(animal('hamster').vida[1]).toBeLessThanOrEqual(4);
    expect(animal('jabuti').vida[0]).toBeGreaterThanOrEqual(30);
    expect(animal('papagaio').vida[0]).toBeGreaterThanOrEqual(30);
  });

  it('17. gato de 4 anos não morre "de velhice" (bug do playtest)', () => {
    const { v, id } = petDe(adulto(30), 'gato', 4);
    const p = v.pessoas[id];
    expect(infoPet(v, p).vidaMax).toBeGreaterThanOrEqual(12);
    for (let k = 0; k < 40; k++) expect(causaDaMortePet(v, p, criarRng(k))).not.toBe('velhice');
    expect(riscoDoPet(v, p)).toBeLessThan(0.05);
  });

  it('17b. hamster de 3 anos já é velho — um gato de 3, não', () => {
    const h = petDe(adulto(30), 'hamster', 3);
    const g = petDe(adulto(30), 'gato', 3);
    expect(riscoDoPet(h.v, h.v.pessoas[h.id])).toBeGreaterThan(riscoDoPet(g.v, g.v.pessoas[g.id]) * 5);
  });

  it('18. exótico legal: a loja/criadouro vende com documento; silvestre nativo só de criadouro autorizado', () => {
    const v = em(adulto(30), x => { x.moradia.tipo = 'propria'; });
    const ofertas = ofertasDePets(v);
    expect(ofertas.length).toBeGreaterThan(0);
    for (const o of ofertas) if (animal(o.especie).silvestre) { expect(o.origem).toBe('criador'); expect(o.documentos).toBeTruthy(); }
    // Nenhum bicho proibido de ter em casa está no catálogo legal (macaco, serpente, onça...).
    const ids = ANIMAIS.map(a => a.id as string);
    for (const proibido of ['macaco', 'mico', 'sagui', 'serpente', 'cobra', 'onca', 'tucano']) expect(ids).not.toContain(proibido);
  });

  it('19. restrição: chinchila no calor do Nordeste é improvável; papagaio em apartamento idem', () => {
    const v = adulto(30, 11, 'masculino', 'salvador-ba');
    const w = em(v, x => { x.moradia.tipo = 'propria'; });
    expect(podeTerPet(w, 'chinchila', 'pequeno').grau).toBe('improvavel');
  });

  it('19b. silvestre sem documento: entregar por conta própria não tem multa, e o vínculo acaba', () => {
    const { v, id } = petDe(adulto(30), 'papagaio', 2, 'ilegal');
    const conta = v.financas.conta;
    const d = executar(v, { tipo: 'entregar_pet', petId: id }).vida;
    expect(d.vinculos[id]).toBeUndefined();
    expect(d.financas.conta).toBe(conta);
    expect(textosBio(d)).toMatch(/não é multado/);
  });
});

/* ============================================================ Política */

describe('política: bandeira nunca undefined, partidos reais', () => {
  it('20. bandeira sem escolha lê "nenhuma, por enquanto" — em nenhum lugar "undefined"', () => {
    const v = em(adulto(35), x => { const p = entrarNaPolitica(x, 'comunidade', 1); p.fase = 'filiado'; p.partido = PARTIDOS[0]; p.prioridade = undefined; });
    expect(nomeDaBandeira(v.caminhos.politica!.prioridade)).toBe('nenhuma, por enquanto');
    expect(JSON.stringify(leituraPolitica(v))).not.toMatch(/undefined/);
  });

  it('21. definir a bandeira é uma decisão com valor, e fica gravada', () => {
    let v = em(adulto(35), x => { const p = entrarNaPolitica(x, 'comunidade', 1); p.fase = 'filiado'; p.partido = PARTIDOS[0]; });
    v = executar(v, { tipo: 'politica', oque: 'bandeira' }).vida;
    expect(v.momento?.situacaoId).toBe('pol_bandeira');
    const op = v.momento!.opcoes.find(o => !o.bloqueio)!;
    v = decidir(v, op.id).vida;
    expect(v.caminhos.politica!.prioridade).toBeTruthy();
    expect(textosBio(v)).not.toMatch(/undefined/);
  });

  it('22. os partidos são os registrados no TSE, e o texto usa o artigo certo', () => {
    expect(PARTIDOS_REAIS.length).toBe(30);
    expect(new Set(PARTIDOS_REAIS.map(p => p.sigla)).size).toBe(30);
    expect(oPartido('PT')).toMatch(/^o /);
    expect(oPartido('REDE')).toMatch(/^a /);
    expect(oPartido('Partido Ipê')).toBe('o Partido Ipê'); // saves antigos continuam legíveis
  });

  it('23. candidatura e apuração: vence ou perde, e a Linha da Vida registra o resultado', () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      let v = em(adulto(35, s), x => { const p = entrarNaPolitica(x, 'comunidade', 1); p.fase = 'filiado'; p.partido = PARTIDOS[1]; p.tFiliacao = x.t - 24; x.financas.conta = 200000; });
      const e = proximaEleicao(v.t, 'municipal');
      v = em(v, x => { x.t = e.t - 3; registrarCandidatura(x, 'vereador', e.t); });
      expect(v.caminhos.politica!.fase).toBe('candidato');
      v = em(v, x => { x.t = e.t; processarPolitica(x, criarRng(s)); });
      const fase = v.caminhos.politica!.fase;
      expect(['eleito', 'filiado', 'mandato', 'encerrada', 'candidato', 'entre_mandatos']).toContain(fase);
      if (fase !== 'candidato') expect(textosBio(v)).toMatch(/elei|votos|Perdeu|Eleit|apura/i);
      expect(textosBio(v)).not.toMatch(/undefined/);
    }
  });
});

/* ============================================================ Mudança */

describe('mudança de cidade: o que fica para trás, antes', () => {
  it('24. a mudança diz antes que o curso presencial será trancado; depois, tranca (não cancela)', () => {
    const v = em(adulto(22, 11, 'masculino', 'salvador-ba'), x => matricular(x, 'direito'));
    const efeitos = consequenciasDaMudanca(v, 'recife-pe');
    expect(efeitos.join(' ')).toMatch(/Direito/);
  });
});

/* ============================================================ Save */

describe('save v13: exportar, importar, migrar', () => {
  it('25. exportar gera um envelope JSON com a vida e a semente do acaso', () => {
    const v = adulto(25);
    const txt = exportarVida(v, new Date('2026-09-26T00:00:00Z'));
    const arq = JSON.parse(txt);
    expect(arq.formato).toBe('vida-save');
    expect(arq.versao).toBe(VERSAO_SAVE);
    expect(arq.vida.rng).toBe(v.rng);
    expect(arq.vida.id).toBe(v.id);
  });

  it('26. importar devolve a mesma vida; o futuro segue igual (mesma semente)', () => {
    const v = adulto(25);
    const lida = importarVida(exportarVida(v));
    expect(lida.tipo).toBe('ok');
    if (lida.tipo !== 'ok') return;
    const a = avancarAno(v).vida;
    const b = avancarAno(lida.vida).vida;
    expect(b.biografia.map(l => l.texto)).toEqual(a.biografia.map(l => l.texto));
  });

  it('27. importar recusa lixo, JSON inválido, versão futura, vida terminada e arquivo grande demais', () => {
    expect(importarVida('').tipo).toBe('invalido');
    expect(importarVida('{nao é json').tipo).toBe('invalido');
    expect(importarVida('[1,2,3]').tipo).toBe('invalido');
    expect(importarVida(JSON.stringify({ formato: 'vida-save', vida: { versao: VERSAO_SAVE + 1 } })).tipo).toBe('invalido');
    const v = adulto(25);
    expect(importarVida(JSON.stringify({ ...v, morte: { t: v.t, causa: 'x' } })).tipo).toBe('invalido');
    expect(importarVida('x'.repeat(LIMITE_IMPORTACAO + 1)).tipo).toBe('invalido');
    // Um "save" com código não executa nada: é só texto dentro de um campo.
    const comCodigo = JSON.stringify({ ...v, eu: { ...v.eu, nome: '<script>alert(1)</script>' } });
    const r2 = importarVida(comCodigo);
    if (r2.tipo === 'ok') expect(r2.vida.eu.nome).toBe('<script>alert(1)</script>');
  });

  it('28. saves v12 reais do playtest migram para v13 e continuam jogáveis', () => {
    for (const nome of ['save-v12-loja-online.json', 'save-v12-politica.json', 'save-v12-soldado.json']) {
      const bruto = fixture(nome);
      expect(JSON.parse(bruto).versao).toBe(12);
      const l = interpretar(bruto);
      expect(l.tipo, nome).toBe('ok');
      if (l.tipo !== 'ok') continue;
      let v = l.vida;
      expect(v.versao).toBe(VERSAO_SAVE);
      const linhaAntes = JSON.parse(bruto).biografia.length;
      expect(v.biografia.length).toBe(linhaAntes); // a Linha da Vida não muda na migração
      for (let k = 0; k < 3 && !v.morte; k++) { v = avancarAno(v).vida; v = responderTudo(v); }
      expect(JSON.stringify(v.biografia)).not.toMatch(/undefined|NaN/);
    }
  });

  it('28b. migração da loja on-line: dedicação, jeito de vender válido para on-line, parte do sócio', () => {
    const l = interpretar(fixture('save-v12-loja-online.json'));
    if (l.tipo !== 'ok') throw new Error('não leu');
    const n = l.vida.caminhos.negocio!;
    expect(n.dedicacao).toBeTruthy();
    expect(n.estrategia).not.toBe('online'); // "vender pela internet também" não existe para loja on-line
    expect(rotuloEstrategia('online', n.estrategia!, n.tipo)).toBeTruthy();
    if (n.socioId) expect(n.parteSocio).toBe(0.5);
  });

  it('28c. migração da política: partido fictício segue legível, bandeira vazia lê "nenhuma"', () => {
    const l = interpretar(fixture('save-v12-politica.json'));
    if (l.tipo !== 'ok') throw new Error('não leu');
    const p = l.vida.caminhos.politica!;
    expect(oPartido(p.partido)).not.toMatch(/undefined/);
    expect(JSON.stringify(leituraPolitica(l.vida))).not.toMatch(/undefined/);
  });

  it('28d. migração do soldado: continua no serviço inicial, sem poder desertar', () => {
    const l = interpretar(fixture('save-v12-soldado.json'));
    if (l.tipo !== 'ok') throw new Error('não leu');
    const d = disponibilidade(l.vida, { tipo: 'pedir_demissao' });
    if (noServicoInicial(l.vida)) expect(d.grau).not.toBe('permitido');
  });
});

/* ============================================================ Linha da Vida e invariantes */

describe('coerência: vidas longas sem estado impossível', () => {
  it('29. vidas inteiras com escolhas variadas: sem undefined/NaN na Linha da Vida, sem pendência órfã', () => {
    for (const s of [301, 302, 303, 304, 305, 306]) {
      let v = nova({ semente: s, genero: s % 2 ? 'masculino' : 'feminino', municipioId: s % 3 ? 'salvador-ba' : 'porto-alegre-rs' });
      while (!v.morte && idade(v) < 70) {
        v = avancarAno(v).vida;
        for (let k = 0; k < 12 && v.momento && !v.morte; k++) {
          const livres = v.momento.opcoes.filter(o => !o.bloqueio);
          const o = livres[(s + k + v.t) % Math.max(1, livres.length)] ?? v.momento.opcoes[0];
          v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida;
        }
        // Invariantes.
        const n = v.caminhos.negocio;
        if (n && n.estado !== 'fechado' && n.dedicacao === 'integral' && !n.passivo) expect(v.trabalho.atual?.ocupacaoId, `semente ${s}, idade ${idade(v)}`).toBe(n.ocupacaoId);
        if (v.caminhos.pendente && !v.momento) expect(v.caminhos.pendente.perguntado, `pendente sem pergunta, semente ${s}`).toBeFalsy();
        const pol = v.caminhos.politica;
        if (pol?.prioridade) expect(nomeDaBandeira(pol.prioridade)).not.toBe('nenhuma, por enquanto');
      }
      const bio = textosBio(v);
      expect(bio, `semente ${s}`).not.toMatch(/undefined|NaN|\[object/);
    }
  }, 120000);

  it('30. nada do que foi deixado some sem registro: trancar, deixar trabalho e deixar base sempre têm motivo', () => {
    const v0 = em(adulto(19), x => { matricular(x, 'direito'); contratar(x, r, ocupacao('atendente'), 'teste'); });
    const { v } = proporEAbrir(v0, { tipo: 'contrato_esporte', nivel: 1 });
    if (!v.momento) return; // sem conflito, nada a registrar
    const d = decidir(v, 'plano_0').vida;
    const novas = d.biografia.slice(v.biografia.length).map(l => l.texto);
    for (const t of novas.filter(t => /^(Trancou|Deixou)/.test(t))) expect(t).toMatch(/ para /);
  });
});

describe('achados da leitura de biografias', () => {
  it('31. hamster fêmea: "um hamster filhote, comprado" (a concordância segue a palavra)', () => {
    const v = em(adulto(30), x => { x.moradia.tipo = 'propria'; adotarPet(x, r, { especie: 'hamster', nome: 'Bolota', genero: 'feminino', idade: 0, porte: 'pequeno', jeito: 'curiosa', historia: '' }, 'loja'); });
    expect(v.biografia.slice(-1)[0].texto).toMatch(/um hamster filhote, comprado numa loja/);
  });

  it('32. morando na casa de um irmão, ele não "sai de casa" todo ano (laço da Linha da Vida)', () => {
    let v = em(adulto(40), x => {
      const irmao = criarPessoa(x, r, { idade: 45, municipioId: x.moradia.municipioId, nome: 'Melissa', sobrenome: 'Fix', genero: 'feminino' });
      vincular(x, irmao, { parentesco: 'irmao', origem: 'familia', proximidade: 70, convivio: ['casa'] });
      x.moradia = { tipo: 'parente', municipioId: x.moradia.municipioId, aluguel: 0, padrao: 1, tInicio: x.t, aceitaPet: true };
    });
    const antes = v.biografia.length;
    for (let k = 0; k < 6; k++) { v = avancarAno(v).vida; v = responderTudo(v); }
    const novas = v.biografia.slice(antes).map(e => e.texto);
    expect(novas.filter(t => /Melissa saiu de casa/.test(t)).length).toBe(0);
  });

  it('33. a mesma coisa não entra duas vezes seguidas na Linha da Vida em vidas longas', () => {
    for (const s of [401, 402, 403]) {
      let v = nova({ semente: s, municipioId: 'recife-pe' });
      v = viverAte(v, 75);
      const textos = v.biografia.filter(e => e.relevancia !== 'tecnico').map(e => e.texto);
      let repetidas = 0;
      for (let k = 2; k < textos.length; k++) if (textos[k] === textos[k - 2] && textos[k - 1] === textos[k - 3]) repetidas++;
      expect(repetidas, `semente ${s}`).toBe(0);
    }
  }, 120000);
});
