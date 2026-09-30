/**
 * FIX pós-REWORK 3 (playtest): testes CAUSAIS. Não basta o botão existir —
 * a oportunidade não decide pelo jogador, a escolha resolve, o feedback e o
 * motor concordam, a ação mexe na variável que a avaliação lê, o estado
 * persiste.
 */

import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { transacao, idadePessoa } from '../nucleo';
import { criarRng } from '../rng';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { propor, resolverPendente, analisarEntrada } from '../sistemas/compromissos';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { novaOportunidade, aceitarOportunidade } from '../sistemas/oportunidades';
import { processarNotoriedade } from '../sistemas/notoriedade';
import { registrarNoCurriculo } from '../sistemas/cena';
import { carreiraDeAdulto } from '../sistemas/filhos';
import { rendaDosOutros } from '../sistemas/domicilio';
import { garantirFrente, habilidade } from '../sistemas/frentes';
import { aspectos } from '../sistemas/peneira';
import { registrarDevolutiva } from '../sistemas/devolutivas';
import { emConstrucao } from '../sistemas/caminhosDeVida';
import { estimativaParaCurso } from '../sistemas/vestibular';
import { curso } from '../dados/cursos';
import { avaliacaoDaPos, opcoesDeCurso, tentarIngresso, notaEsperadaArea } from '../sistemas/escola';
import { objetivoPorId } from '../sistemas/objetivos';
import { elegibilidade } from '../sistemas/trabalho';
import { vagasEmCamadas } from '../sistemas/relevancia';
import { mudarAgora } from '../sistemas/processos';
import { instituicaoAtual } from '../sistemas/formacao';
import { acoesDasTrajetorias, acoesDoTrabalho } from '../sistemas/profissao';
import { catalogoDeVeiculos, CATEGORIAS_DA_LOJA } from '../sistemas/mercado';
import { formaDaVersao, modeloVeiculo, VERSOES_VEICULO } from '../dados/bens';
import { comprarItem, usarItem } from '../sistemas/estilo';
import { exportarVida, importarVida } from '../save';
import { interacoesPara, executarInteracao } from '../sistemas/interacoes';
import { vincular } from '../pessoas';
import { cnhEmProva, perguntaAtual, PERGUNTAS_CNH } from '../sistemas/autoescola';
import { avancarAno } from '../ano';
import { entrar, moita } from '../sistemas/ilicito';
import type { Vida } from '../tipos';

const ids = (l: { id: string }[]) => l.map(x => x.id);
const todasAsAcoes = (v: Vida) => { const a = acoesDoTrabalho(v, disponibilidade); return [...a.agora, ...a.mais, ...a.saidas]; };

function comEmprego(v: Vida, ocupacaoId: string, extra: Partial<NonNullable<Vida['trabalho']['atual']>> = {}): Vida {
  return transacao(v, (x, r) => { const e = contratar(x, r, ocupacao(ocupacaoId), 'curriculo'); Object.assign(e, extra); x.caminhos.pendente = undefined; x.momento = null; }).vida;
}

function formar(v: Vida, cursoId: string, nivel: 'superior' | 'mestrado' | 'doutorado', area: string, desempenho = 60): void {
  v.educacao.concluidos.push({ cursoId, nome: curso(cursoId).nome, nivel, area, tFim: v.t - 24, instituicao: 'uma universidade', desempenho });
  if (nivel === 'superior' && !['pos', 'mestrado', 'doutorado'].includes(v.educacao.escolaridade)) v.educacao.escolaridade = 'superior';
  if (nivel !== 'superior') v.educacao.escolaridade = nivel;
}

/* ================================================================= P0 */

describe('P0 · grandes decisões não são automáticas', () => {
  it('1. professor efetivo recebe convite para atuar: nada muda sem a escolha — e dá para conciliar', () => {
    let v = adulto(38, { semente: 21 });
    formar(v, 'letras', 'superior', 'letras'); formar(v, 'mestrado', 'mestrado', 'letras'); formar(v, 'doutorado', 'doutorado', 'letras');
    v = comEmprego(v, 'professor_univ');
    garantirFrente(v, 'teatro'); v.caminhos.frentes.teatro!.habilidade = 72;
    const r1 = transacao(v, (x, r) => { expect(propor(x, r, { tipo: 'emprego', ocupacaoId: 'ator', via: 'convite', extra: 'arte' })).toBe('pendente'); }).vida;
    expect(r1.trabalho.atual!.ocupacaoId).toBe('professor_univ');
    const planos = r1.caminhos.pendente!.planos;
    const conciliar = planos.findIndex(p => p.larga.includes('novo_paralela'));
    expect(conciliar).toBeGreaterThanOrEqual(0);
    expect(planos.some(p => p.recusa)).toBe(true);
    const depois = transacao(r1, (x, r) => { resolverPendente(x, r, conciliar); }).vida;
    expect(depois.trabalho.atual!.ocupacaoId).toBe('professor_univ');
    expect(depois.trabalho.paralela?.ocupacaoId).toBe('ator');
  });

  it('2. atriz conhecida aceita a bolsa de pesquisa: pausar é escolha; currículo e nome ficam', () => {
    let v = adulto(34, { semente: 22 });
    formar(v, 'artes_cenicas', 'superior', 'artes_cenicas'); formar(v, 'doutorado', 'doutorado', 'artes_cenicas');
    v = comEmprego(v, 'ator', { clientela: 62 });
    v.notoriedade = { valor: 48, pico: 50, fonte: 'arte', t: v.t } as Vida['notoriedade'];
    registrarNoCurriculo(v, { tipo: 'serie', titulo: 'Pelas Margens', papel: 'coadjuvante', repercussao: 2 });
    const aberto = transacao(v, (x, r) => { expect(propor(x, r, { tipo: 'emprego', ocupacaoId: 'pesquisador', via: 'bolsa' })).toBe('pendente'); }).vida;
    expect(aberto.trabalho.atual!.ocupacaoId).toBe('ator');
    const k = aberto.caminhos.pendente!.planos.findIndex(p => p.larga.includes('emprego_pausa'));
    expect(k).toBeGreaterThanOrEqual(0);
    const pausou = transacao(aberto, (x, r) => { resolverPendente(x, r, k); processarNotoriedade(x); }).vida;
    expect(pausou.trabalho.atual!.ocupacaoId).toBe('pesquisador');
    expect(pausou.trabalho.pausadas?.[0].emprego.ocupacaoId).toBe('ator');
    expect(pausou.caminhos.curriculo?.some(c => c.titulo === 'Pelas Margens')).toBe(true);
    // O nome pertence à pessoa: um ano depois, esfria devagar (não zera).
    expect(pausou.notoriedade!.valor).toBeGreaterThan(48 * 0.7);
  });

  it('3. doutorado presencial em outra cidade: a cidade não muda sem decisão', () => {
    const v = adulto(30, { semente: 23, municipioId: 'recife-pe' });
    formar(v, 'letras', 'superior', 'letras'); formar(v, 'mestrado', 'mestrado', 'letras');
    const novo = { tipo: 'curso' as const, cursoId: 'doutorado', via: 'selecao_publica', modalidade: 'presencial' as const, rede: 'publica' as const, mensalidade: 0, municipioId: 'sao-paulo-sp', instituicao: 'a universidade federal em São Paulo' };
    expect(analisarEntrada(v, novo).some(c => c.com === 'cidade')).toBe(true);
    const aberto = transacao(v, (x, r) => { expect(propor(x, r, novo)).toBe('pendente'); }).vida;
    expect(aberto.moradia.municipioId).toBe('recife-pe');
    const recusa = transacao(aberto, (x, r) => { resolverPendente(x, r, x.caminhos.pendente!.planos.findIndex(p => p.recusa)); }).vida;
    expect(recusa.moradia.municipioId).toBe('recife-pe');
    const aceita = transacao(aberto, (x, r) => { resolverPendente(x, r, 0); }).vida;
    expect(aceita.moradia.municipioId).toBe('sao-paulo-sp');
  });

  it('4. o festival convida, aceitar resolve — nunca "Nada aconteceu"', () => {
    const v = adulto(26, { semente: 24 });
    garantirFrente(v, 'teatro'); v.caminhos.frentes.teatro!.habilidade = 60;
    const o = novaOportunidade(v, { tipo: 'edital_cultura', titulo: 'O festival da capital', texto: 'Depois de "A Casa Vazia", o festival da capital convidou para uma apresentação.', meses: 12, chave: 'festival', dominio: 'teatro' })!;
    const antes = v.biografia.length;
    let res = { texto: '' };
    const depois = transacao(v, (x, r) => { res = aceitarOportunidade(x, r, o.id); }).vida;
    expect(res.texto).toBeTruthy();
    expect(res.texto).not.toMatch(/Nada aconteceu/);
    expect(depois.caminhos.curriculo?.some(c => c.tipo === 'festival' && c.titulo === 'A Casa Vazia')).toBe(true);
    expect(depois.biografia.length).toBeGreaterThan(antes);
  });

  it('19. nova oportunidade (indicação) não sobrescreve a carreira sem consentimento', () => {
    let v = adulto(33, { semente: 25 });
    v = comEmprego(v, 'vendedor');
    const aberto = transacao(v, (x, r) => { expect(propor(x, r, { tipo: 'emprego', ocupacaoId: 'motorista_app', via: 'indicacao' })).not.toBe('feito'); }).vida;
    expect(aberto.trabalho.atual!.ocupacaoId).toBe('vendedor');
  });
});

describe('P0 · NPC não está empregado e desempregado ao mesmo tempo', () => {
  it('5. a parceria perde o emprego: cabeçalho, renda e orçamento concordam', () => {
    const v = adulto(32, { semente: 26 });
    const { p } = comParceiro(v, { estagio: 'casamento' });
    p.ocupacaoId = 'advogado_jr'; p.ocupacao = 'advogada júnior'; p.renda = 6200; p.formacao = 'Direito';
    const rendaAntes = rendaDosOutros(v);
    let perdeu = false;
    for (let s = 1; s <= 400 && !perdeu; s++) {
      const vin = v.vinculos[p.id];
      perdeu = carreiraDeAdulto(v, criarRng(s), p, vin, { bio: 0 }, true) === 'perdeu';
      if (!perdeu && p.renda > 0) { p.renda = 6200; } // mantém o cenário até a demissão acontecer
    }
    expect(perdeu).toBe(true);
    expect(p.renda).toBe(0);
    expect(p.ocupacao).toMatch(/desempregad/);
    expect(rendaDosOutros(v)).toBeLessThan(rendaAntes);
    expect(v.biografia.some(b => /perdeu o emprego/.test(b.texto))).toBe(true);
  });

  it('18. a carreira da parceria anda (ou estagna com motivo) — não fica congelada', () => {
    const v = adulto(30, { semente: 27 });
    const { p } = comParceiro(v, { estagio: 'casamento' });
    p.ocupacaoId = 'advogado_jr'; p.ocupacao = 'advogada júnior'; p.renda = 6200; p.formacao = 'Direito';
    p.vida = { aptidao: 0.4, escolaridade: 'superior', experiencia: 48, trajetoria: [], tCargo: v.t - 36 };
    const cargos = new Set<string>([p.ocupacao]);
    const rendaInicial = p.renda;
    for (let k = 0; k < 12; k++) {
      v.t += 12;
      carreiraDeAdulto(v, criarRng(100 + k), p, v.vinculos[p.id], { bio: 0 }, true);
      cargos.add(p.ocupacao ?? '');
    }
    expect(cargos.size).toBeGreaterThan(1);
    // O cargo e a renda andam juntos (fonte única): quem subiu ganha diferente de quando era júnior.
    if (p.renda > 0) expect(p.renda).not.toBe(rendaInicial);
  });
});

describe('P0 · troca de instituição', () => {
  it('10. escola A → B: a atividade institucional de A acaba na hora (mesmo que B tenha uma igual)', () => {
    let v = adulto(15, { semente: 28, municipioId: 'recife-pe' });
    const inst = instituicaoAtual(v);
    v.rotinas.push({ id: 'time_escola', tInicio: v.t - 12, nivel: 2, instituicao: inst?.chave ?? 'escola:velha' });
    v = transacao(v, x => { mudarAgora(x, 'sao-paulo-sp', 'teste'); }).vida;
    expect(v.rotinas.some(r => r.id === 'time_escola')).toBe(false);
  });
});

/* ================================================================= P1 */

describe('P1 · progressão acionável (a ação mexe na variável que a avaliação lê)', () => {
  it('6. a peneira falha por técnica → o treino de fundamentos melhora a técnica → a próxima avaliação reconhece', () => {
    let v = adulto(15, { semente: 29 });
    garantirFrente(v, 'futebol'); const f = v.caminhos.frentes.futebol!; f.habilidade = 56; f.interesse = 80; f.meses = 60;
    v.rotinas = v.rotinas.filter(r => r.id !== 'futebol'); v.rotinas.push({ id: 'futebol', tInicio: v.t - 36, nivel: 2 });
    v.caminhos.esporte = undefined;
    registrarDevolutiva(v, { tipo: 'peneira', titulo: 'A peneira do clube', texto: 'A técnica ainda é de escolinha.', passou: false, falta: 'tecnica', dominio: 'futebol', nivel: 1 });
    v.financas.conta = 20000;
    const passo = emConstrucao(v, disponibilidade).find(x => x.id === 'esporte')?.proximo;
    expect((passo?.acao as { oque?: string } | undefined)?.oque).toBe('treino_fundamentos');
    const antes = aspectos(v, 'futebol').tecnica;
    v.financas.conta = 20000;
    v = executar(v, { tipo: 'perseguir', oque: 'treino_fundamentos', valor: 'futebol' } as unknown as Acao).vida;
    expect(aspectos(v, 'futebol').tecnica).toBeGreaterThan(antes);
  });

  it('7. "o que ajuda: mais português" → estudo dirigido em português → a estimativa (a mesma conta da prova) sobe', () => {
    let v = adulto(17, { semente: 30 });
    for (const a of ['exatas', 'ciencias', 'humanas'] as const) { garantirFrente(v, a); v.caminhos.frentes[a]!.habilidade = 70; }
    garantirFrente(v, 'linguagens'); v.caminhos.frentes.linguagens!.habilidade = 35;
    v.educacao.objetivo = { cursoId: 'direito', t: v.t };
    const e1 = estimativaParaCurso(v, curso('direito'));
    expect(e1.fraca).toBe('linguagens');
    const n1 = notaEsperadaArea(v, 'linguagens');
    v = executar(v, { tipo: 'perseguir', oque: 'estudo_dirigido', valor: 'linguagens' } as unknown as Acao).vida;
    expect(habilidade(v, 'linguagens')).toBeGreaterThan(35);
    expect(notaEsperadaArea(v, 'linguagens')).toBeGreaterThan(n1);
    expect(estimativaParaCurso(v, curso('direito')).nota).toBeGreaterThan(e1.nota);
  });

  it('8. mestrado rejeitado: motivo real, tentativa guardada, caminho que mexe na chance', () => {
    let v = adulto(26, { semente: 31 });
    formar(v, 'direito', 'superior', 'direito', 62);
    const ops = opcoesDeCurso(v);
    const o = ops.find(x => x.curso.id === 'mestrado' && x.via === 'selecao_publica')!;
    expect(o).toBeTruthy();
    let texto = '';
    for (let s = 1; s <= 60; s++) { const res = transacao(v, x => { const t = tentarIngresso(x, criarRng(s), o); texto = t.texto; if (t.entrou) throw new Error('entrou'); }); if (!res.vida.caminhos.objetivos?.length) continue; v = res.vida; break; }
    const obj = objetivoPorId(v, 'selecao:mestrado');
    expect(obj?.tentativas).toBe(1);
    expect(obj?.obstaculo).toBeTruthy();
    expect(texto).toMatch(/:/); // o motivo vem junto ("Não passou na seleção...: a banca achou o projeto...")
    const dev = v.caminhos.devolutivas.find(d => d.tipo === 'selecao')!;
    expect(dev.falta).toBe(avaliacaoDaPos(v, curso('mestrado')).obstaculo);
    const chance = avaliacaoDaPos(v, curso('mestrado')).chance;
    v = executar(v, { tipo: 'perseguir', oque: 'preparar_pos' } as unknown as Acao).vida;
    expect(avaliacaoDaPos(v, curso('mestrado')).chance).toBeGreaterThan(chance);
  });

  it('11. com mestrado e doutorado, a carreira pública não sugere "mais uma titulação"', () => {
    let v = adulto(40, { semente: 32 });
    formar(v, 'letras', 'superior', 'letras'); formar(v, 'mestrado', 'mestrado', 'letras'); formar(v, 'doutorado', 'doutorado', 'letras');
    v = comEmprego(v, 'professor_univ');
    expect(ids(todasAsAcoes(v))).not.toContain('titulacao');
  });

  it('12. professor + ator: as ações de cada trajetória ficam no seu lugar', () => {
    let v = adulto(40, { semente: 33 });
    formar(v, 'letras', 'superior', 'letras'); formar(v, 'doutorado', 'doutorado', 'letras');
    v = comEmprego(v, 'professor_univ');
    garantirFrente(v, 'teatro'); v.caminhos.frentes.teatro!.habilidade = 70;
    v = transacao(v, (x, r) => { propor(x, r, { tipo: 'emprego', ocupacaoId: 'ator', via: 'convite', extra: 'arte' }); resolverPendente(x, r, x.caminhos.pendente!.planos.findIndex(p => p.larga.includes('novo_paralela'))); }).vida;
    const doTrabalho = ids(todasAsAcoes(v));
    expect(doTrabalho).not.toContain('estrada');
    expect(doTrabalho).not.toContain('lancar');
    expect(doTrabalho).toContain('ac_projeto');
    const paralela = acoesDasTrajetorias(v, disponibilidade).find(g => g.id === 'paralela')!;
    expect(ids(paralela.acoes)).toEqual(expect.arrayContaining(['apresentar']));
    expect(ids(paralela.acoes)).not.toContain('ac_projeto');
  });

  it('9. Direito concluído: estágio (que pede matrícula) fica inelegível; o jurídico vem antes do varejo antigo', () => {
    let v = adulto(27, { semente: 34 });
    formar(v, 'direito', 'superior', 'direito');
    v.educacao.matricula = undefined;
    v.trabalho.licencas.push('oab');
    v.trabalho.historico.push({ ocupacaoId: 'vendedor', empregador: 'uma loja', contrato: 'clt', salario: 2500, tInicio: v.t - 120, tFim: v.t - 72, desempenho: 65, municipioId: v.moradia.municipioId, motivo: 'pediu demissão' } as never);
    v.trabalho.experiencia['comercio'] = 48;
    expect(podeTentar(elegibilidade(v, ocupacao('estagio_direito')))).toBe(false);
    const c = vagasEmCamadas(v);
    const todos = [...c.trajetoria, ...c.relacionadas, ...c.outras].map(x => x.item.oc.id);
    expect(todos).not.toContain('estagio_direito');
    expect(c.trajetoria[0].item.oc.trilha).toBe('direito');
  });

  it('20. deficiência controlável apontada pela UI → a ação existe e muda a variável consultada (o projeto da pós)', () => {
    let v = adulto(25, { semente: 35 });
    formar(v, 'letras', 'superior', 'letras', 60);
    const a = avaliacaoDaPos(v, curso('mestrado'));
    expect(a.obstaculo).toBe('projeto');
    expect(a.leitura).toMatch(/preparar o projeto/);
    expect(podeTentar(disponibilidade(v, { tipo: 'perseguir', oque: 'preparar_pos' } as unknown as Acao))).toBe(true);
    v = executar(v, { tipo: 'perseguir', oque: 'preparar_pos' } as unknown as Acao).vida;
    expect(avaliacaoDaPos(v, curso('mestrado')).fatores.projeto).toBeGreaterThan(a.fatores.projeto);
  });
});

describe('P1 · Pessoas', () => {
  it('16. adolescente pode demonstrar interesse por alguém da mesma idade — e a reciprocidade não é garantida', () => {
    const resultados = new Set<string>();
    for (let s = 1; s <= 14; s++) {
      const v = adulto(14, { semente: 40 + s });
      for (const vin of Object.values(v.vinculos)) if (vin.romance) vin.romance = undefined;
      const p = pessoaNova(v, 14, v.eu.genero === 'feminino' ? 'masculino' : 'feminino', { atracao: v.eu.genero === 'feminino' ? 'mulheres' : 'homens' });
      vincular(v, p, { origem: 'escola', proximidade: 22, convivio: ['escola'], estagio: 'colega' });
      expect(interacoesPara(v, p.id).map(x => x.id)).toContain('flertar');
      const depois = transacao(v, (x, r) => { executarInteracao(x, r, p.id, 'flertar'); }).vida;
      resultados.add(depois.vinculos[p.id].romance ? 'interesse' : 'nao');
    }
    expect(resultados.size).toBe(2);
  });

  it('17. professora, amiga da escola e amiga do futebol: menus diferentes', () => {
    const v = adulto(15, { semente: 50 });
    const inst = instituicaoAtual(v);
    const prof = pessoaNova(v, 45, 'feminino');
    vincular(v, prof, { origem: 'escola', proximidade: 30, convivio: ['escola'], estagio: 'conhecido' }).formacao = { papel: 'professor', instituicao: inst?.chave ?? 'escola:x' };
    const colega = pessoaNova(v, 15, 'feminino');
    vincular(v, colega, { origem: 'escola', proximidade: 45, convivio: ['escola'], estagio: 'amigo' });
    v.rotinas.push({ id: 'futebol', tInicio: v.t - 24, nivel: 2 });
    const bola = pessoaNova(v, 15, 'feminino');
    const vb = vincular(v, bola, { origem: 'rotina', proximidade: 45, convivio: ['rotina'], estagio: 'amigo' });
    vb.ambiente = `rotina:futebol:${v.moradia.municipioId}`;
    const a = interacoesPara(v, prof.id).map(x => x.id);
    const b = interacoesPara(v, colega.id).map(x => x.id);
    const c = interacoesPara(v, bola.id).map(x => x.id);
    expect(a).toContain('duvidas');
    expect(a).not.toContain('aproximar');
    expect(c).toContain('treinar_junto');
    expect(b).not.toContain('treinar_junto');
    expect(b).not.toContain('duvidas');
    expect(a.join()).not.toBe(b.join());
    expect(b.join()).not.toBe(c.join());
  });
});

/* ============================================================ P1/P2 · Material */

describe('P1/P2 · veículos, lojas, estilo', () => {
  it('14. a loja de motos e bicicletas não tem carro (nem no catálogo completo dela)', () => {
    const v = adulto(25, { semente: 60 });
    const cat = catalogoDeVeiculos(v, 'motos');
    expect(cat.length).toBeGreaterThan(0);
    expect(cat.every(o => CATEGORIAS_DA_LOJA.motos.includes(modeloVeiculo(o.modeloId).categoria))).toBe(true);
    expect(cat.some(o => modeloVeiculo(o.modeloId).categoria === 'carro')).toBe(false);
  });

  it('18. veículos de categorias distintas têm formas distintas (o hatch não é a picape, a scooter não é a trilha)', () => {
    const formas = new Set(VERSOES_VEICULO.map(x => formaDaVersao(x)));
    for (const f of ['hatch', 'seda', 'suv', 'picape', 'esportivo', 'scooter', 'street', 'trail', 'urbana', 'mtb', 'jetski', 'lancha', 'veleiro', 'monomotor']) expect(formas.has(f as never)).toBe(true);
    expect(formaDaVersao(VERSOES_VEICULO.find(x => x.id === 'toyota_hilux'))).toBe('picape');
    expect(formaDaVersao(VERSOES_VEICULO.find(x => x.id === 'fiat_mobi'))).toBe('hatch');
  });

  it('15. relógio e joia: comprar, usar, guardar — e o save guarda o que está em uso', () => {
    const v = adulto(30, { semente: 61 });
    v.financas.conta = 50000;
    comprarItem(v, 'relogio'); comprarItem(v, 'corrente_prata');
    expect(v.eu.visual.joia).toBe('corrente');
    usarItem(v, 'relogio', false);
    expect(v.eu.estilo!.itens.find(x => x.itemId === 'relogio')!.usando).toBe(false);
    comprarItem(v, 'smartwatch');
    usarItem(v, 'relogio', true);
    // Um relógio de cada vez no pulso.
    expect(v.eu.estilo!.itens.find(x => x.itemId === 'smartwatch')!.usando).toBe(false);
    const volta = importarVida(exportarVida(v));
    expect(volta.tipo).toBe('ok');
    const w = (volta as { vida: Vida }).vida;
    expect(w.eu.estilo!.itens.find(x => x.itemId === 'relogio')!.usando).toBe(true);
    expect(w.eu.visual.joia).toBe('corrente');
  });

  it('autoescola: a prova teórica é respondida pelo jogador — acertar ajuda; a preparação conta', () => {
    let v = adulto(19, { semente: 62 });
    v.financas.conta = 20000;
    v = executar(v, { tipo: 'cnh' }).vida;
    v = executar(v, { tipo: 'cnh_preparar', como: 'teoria' }).vida;
    for (let k = 0; k < 2 && !cnhEmProva(v); k++) { v = avancarAno(v).vida; if (v.momento && v.momento.situacaoId !== 'cnh_prova') v.momento = null; }
    expect(cnhEmProva(v)).toBeTruthy();
    // Responde certo as três perguntas.
    for (let k = 0; k < 3 && cnhEmProva(v); k++) {
      if (!v.momento) v = executar(v, { tipo: 'cnh_prova' }).vida;
      const q = perguntaAtual(cnhEmProva(v)!)!;
      expect(PERGUNTAS_CNH.some(x => x.id === q.id)).toBe(true);
      v = executar(v, { tipo: 'decidir', opcaoId: `r${q.certa}` }).vida;
    }
    expect(cnhEmProva(v)).toBeUndefined();
    const p = v.processos.find(x => x.tipo === 'cnh');
    // Ou tirou a carteira, ou passou na teórica e falta a prática — nunca reprovou na teórica acertando tudo com a apostila estudada.
    expect(v.trabalho.licencas.includes('cnh') || (p && p.tipo === 'cnh' && p.teoricaOk)).toBeTruthy();
  });
});

/* ================================================================ Crime */

describe('crime: não é prisão programada', () => {
  it('a descoberta abre uma investigação (não um processo direto); ficar na moita e parar mudam o curso', () => {
    const desfechos = { processo: 0, arquivada: 0, aberta: 0 };
    for (let s = 1; s <= 30; s++) {
      let v = adulto(25, { semente: 70 + s });
      v = transacao(v, (x, r) => { entrar(x, 'patrimonial', undefined, r); x.caminhos.envolvimento!.exposicao = 70; }).vida;
      for (let k = 0; k < 6 && !v.caminhos.envolvimento?.investigado && !v.justica?.processo; k++) { v = avancarAno(v).vida; v.momento = null; }
      if (!v.caminhos.envolvimento?.investigado) continue;
      expect(v.justica?.processo).toBeFalsy();
      v = transacao(v, x => { moita(x, true); }).vida;
      for (let k = 0; k < 4 && v.caminhos.envolvimento?.investigado !== undefined; k++) { v = avancarAno(v).vida; v.momento = null; }
      if (v.justica?.processo || v.justica?.prisao || (v.justica?.antecedentes.length ?? 0) > 0) desfechos.processo++;
      else if (v.caminhos.envolvimento?.investigado === undefined) desfechos.arquivada++;
      else desfechos.aberta++;
    }
    expect(desfechos.processo + desfechos.arquivada + desfechos.aberta).toBeGreaterThan(5);
    expect(desfechos.arquivada).toBeGreaterThan(0);
  }, 120000);
});

/* ================================================================= Save */

describe('save v18: os estados novos voltam iguais', () => {
  it('trajetórias paralela e pausada, objetivos, currículo, vida acadêmica, processo da autoescola', () => {
    let v = adulto(36, { semente: 80 });
    formar(v, 'letras', 'superior', 'letras'); formar(v, 'doutorado', 'doutorado', 'letras');
    v = comEmprego(v, 'professor_univ');
    v.trabalho.paralela = { ...v.trabalho.atual!, ocupacaoId: 'ator', carga: 'parcial', salario: 900, clientela: 20 };
    v.trabalho.pausadas = [{ emprego: { ...v.trabalho.atual!, ocupacaoId: 'vendedor' }, t: v.t - 12, motivo: 'para a bolsa' }];
    registrarNoCurriculo(v, { tipo: 'teatro', titulo: 'Vento Norte', papel: 'elenco', repercussao: 1 });
    v.caminhos.objetivos = [{ id: 'selecao:mestrado', titulo: 'Entrar no mestrado', tentativas: 2, tPrimeira: v.t - 24, tUltima: v.t - 12, resultado: 'nao_passou', obstaculo: 'projeto cru' }];
    v.caminhos.academia = { projetos: 1, orientacoes: 0, orientandos: [], publicacoes: 2, colaboracoes: 0, financiamentos: 0, ultimas: {} };
    const volta = importarVida(exportarVida(v));
    expect(volta.tipo).toBe('ok');
    const w = (volta as { vida: Vida }).vida;
    expect(w.trabalho.paralela?.ocupacaoId).toBe('ator');
    expect(w.trabalho.pausadas?.[0].emprego.ocupacaoId).toBe('vendedor');
    expect(w.caminhos.curriculo?.[0].titulo).toBe('Vento Norte');
    expect(w.caminhos.objetivos?.[0].tentativas).toBe(2);
    expect(w.caminhos.academia?.publicacoes).toBe(2);
    void idadePessoa;
  });
});
