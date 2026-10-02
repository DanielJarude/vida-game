/**
 * FIX 3.1 (pendências pós-REWORK 3): testes CAUSAIS das especializações
 * médicas, do basquete e do tênis, do audiovisual (contratos e agente), dos
 * cachês, da casa própria e da ajuda da família. A ação mexe na variável que
 * a avaliação lê; o estado persiste; nada sobrescreve carreira sem escolha.
 */

import { describe, expect, it } from 'vitest';
import { adulto, comParente } from './cenarios';
import { pais, transacao, vinculosVivos } from '../nucleo';
import { podeTentar } from '../plausibilidade';
import { propor } from '../sistemas/compromissos';
import { contratar, elegibilidade } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { curso } from '../dados/cursos';
import { novaMatricula, opcoesDeCurso, tentarIngresso } from '../sistemas/escola';
import { avaliacaoDaResidencia, conviteDaEspecialidade, especialidadeMedica, prepararResidencia } from '../sistemas/medicina';
import { modeloEspecialidade, type EspecialidadeMedica } from '../dados/especialidades';
import { objetivoPorId } from '../sistemas/objetivos';
import { exportarVida, importarVida } from '../save';
import { avancarAno } from '../ano';
import { nova, viverAte } from './ajuda';
import { garantirFrente, habilidade } from '../sistemas/frentes';
import { aspectos } from '../sistemas/peneira';
import { divisaoDe, entrarNaBase, linhaDaTemporada, processarEsporte, profissionalizar, salarioDoContrato } from '../sistemas/esporte';
import { estaturaAdulta, funcaoBasquete, vantagemDeEstatura } from '../sistemas/modalidades';
import { modeloRotina } from '../sistemas/rotinas';
import { disponibilidade, executar, type Acao } from '../acoes';
import { imoveisParaVoce } from '../sistemas/relevancia';
import { ajudaDaFamilia } from '../sistemas/dinheiro';
import { SALARIO_MINIMO } from '../sistemas/renda';
import { agenteDe, cacheAudiovisual, iniciarProducao, intervaloDeTestes, novaProposta, porteMaximoDoTeste, processarAudiovisual, propostasAbertas, resolverConflitoAV } from '../sistemas/audiovisual';
import type { ContratoAV, Pessoa, Vida } from '../tipos';
import { custosDoTrabalho } from '../sistemas/carreira';

/* ------------------------------------------------------------ Cenários */

function medica(semente = 3, municipioId = 'recife-pe', i = 26): Vida {
  const v = adulto(i, { semente, municipioId });
  v.educacao.matricula = undefined; v.educacao.basica = undefined;
  v.educacao.concluidos.push({ cursoId: 'medicina', nome: curso('medicina').nome, nivel: 'superior', area: 'medicina', tFim: v.t - 12, instituicao: 'uma universidade federal', desempenho: 72 });
  v.educacao.escolaridade = 'superior';
  if (!v.trabalho.licencas.includes('crm')) v.trabalho.licencas.push('crm');
  v.trabalho.atual = undefined;
  v.financas.conta = 40000;
  return v;
}

/** Uma médica que já terminou a residência numa especialidade. */
function especialista(esp: EspecialidadeMedica, semente = 3): Vida {
  const v = medica(semente, 'recife-pe', 30);
  v.educacao.concluidos.push({ cursoId: 'residencia', nome: modeloEspecialidade(esp).residencia, nivel: 'residencia', area: 'medicina', tFim: v.t, instituicao: 'o hospital universitário', desempenho: 70, especialidade: esp });
  v.educacao.escolaridade = 'pos';
  v.trabalho.experiencia['medicina'] = 36;
  return v;
}

/* ============================================================ 1. Medicina */

describe('1. Medicina: a especialidade é da pessoa e muda a vida profissional', () => {
  it('sem residência, as vagas de título ficam fechadas; o catálogo oferece uma residência por especialidade, com duração própria', () => {
    const v = medica();
    expect(podeTentar(elegibilidade(v, ocupacao('medico')))).toBe(true);
    expect(podeTentar(elegibilidade(v, ocupacao('cirurgiao')))).toBe(false);
    expect(podeTentar(elegibilidade(v, ocupacao('medico_hospital')))).toBe(false);
    const res = opcoesDeCurso(v).filter(o => o.especialidade);
    expect(new Set(res.map(o => o.especialidade)).size).toBe(5);
    expect(res.find(o => o.especialidade === 'cirurgia')!.curso.meses).toBe(36);
    expect(res.find(o => o.especialidade === 'familia')!.curso.meses).toBe(24);
    // Concorrência real: a mesma pessoa tem menos chance na cirurgia que na medicina de família.
    const ch = (e: EspecialidadeMedica) => res.find(o => o.especialidade === e)!.veredito.chance ?? 0;
    expect(ch('cirurgia')).toBeLessThan(ch('familia'));
  });

  it('matricular → residência com a especialidade → concluir: o título persiste e fica na formação', () => {
    let v = medica(5);
    const o = opcoesDeCurso(v).find(x => x.especialidade === 'pediatria')!;
    v = transacao(v, (x, r) => { propor(x, r, novaMatricula(x, o)); x.momento = null; }).vida;
    expect(v.educacao.matricula?.especialidade).toBe('pediatria');
    expect(v.educacao.matricula?.mesesRestantes).toBe(36);
    for (let k = 0; k < 4 && !v.educacao.concluidos.some(c => c.nivel === 'residencia'); k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
    const r = v.educacao.concluidos.find(c => c.nivel === 'residencia');
    expect(r?.especialidade).toBe('pediatria');
    expect(r?.nome).toBe('Residência em Pediatria');
    expect(especialidadeMedica(v)).toBe('pediatria');
    expect(v.biografia.some(b => /residência médica em pediatria/.test(b.texto))).toBe(true);
  });

  it('a especialidade abre as vagas próprias e fecha as de outra área (a cirurgiã entra na equipe cirúrgica; a pediatra não)', () => {
    const cir = especialista('cirurgia');
    const ped = especialista('pediatria');
    const fam = especialista('familia');
    expect(elegibilidade(cir, ocupacao('cirurgiao')).motivo).toBeUndefined();
    expect(podeTentar(elegibilidade(cir, ocupacao('cirurgiao')))).toBe(true);
    expect(podeTentar(elegibilidade(ped, ocupacao('cirurgiao')))).toBe(false);
    expect(elegibilidade(ped, ocupacao('cirurgiao')).motivo).toMatch(/Cirurgia Geral/);
    expect(podeTentar(elegibilidade(fam, ocupacao('medico_familia')))).toBe(true);
    expect(podeTentar(elegibilidade(cir, ocupacao('medico_familia')))).toBe(false);
  });

  it('a faixa de renda e a área acompanham o título: no mesmo cargo, a cirurgiã ganha mais que a pediatra', () => {
    const emprego = (esp: EspecialidadeMedica) => transacao(especialista(esp, 7), (x, r) => { contratar(x, r, ocupacao('medico_hospital'), 'curriculo'); }).vida.trabalho.atual!;
    const cir = emprego('cirurgia'); const ped = emprego('pediatria');
    expect(cir.especialidade).toBe('cirurgia geral');
    expect(ped.especialidade).toBe('pediatria');
    expect(cir.faixa).toBeCloseTo(1.35);
    expect(ped.faixa).toBeCloseTo(0.9);
    expect(cir.salario).toBeGreaterThan(ped.salario * 1.3);
  });

  it('a especialidade atrai o convite da área (a saúde da família chama a médica de família)', () => {
    expect(conviteDaEspecialidade(especialista('familia'))?.oc.id).toBe('medico_familia');
    expect(conviteDaEspecialidade(especialista('cirurgia'))?.oc.id).toBe('cirurgiao');
    expect(conviteDaEspecialidade(medica())).toBeUndefined();
  });

  it('a prova de residência reprovada diz a causa real; estudar para a prova muda a MESMA conta', () => {
    let v = medica(9);
    const o = opcoesDeCurso(v).find(x => x.especialidade === 'cirurgia')!;
    const esp = modeloEspecialidade('cirurgia');
    const antes = avaliacaoDaResidencia(v, esp, 72);
    expect(antes.obstaculo).toBe('preparo');
    v = transacao(v, (x, r) => { tentarIngresso(x, r, { ...o, veredito: { grau: 'permitido', chance: 0 } }); }).vida;
    const obj = objetivoPorId(v, 'selecao:residencia');
    expect(obj?.tentativas).toBe(1);
    expect(obj?.caminho).toBeTruthy();
    expect(v.biografia[v.biografia.length - 1].texto).toMatch(/um ano de questões/);
    v = transacao(v, (x, r) => { prepararResidencia(x, r); }).vida;
    v.t += 12;
    v = transacao(v, (x, r) => { prepararResidencia(x, r); }).vida;
    const depois = avaliacaoDaResidencia(v, esp, 72);
    expect(depois.chance).toBeGreaterThan(antes.chance + 0.1);
    expect(depois.obstaculo).not.toBe('preparo');
  });

  it('save/reload preserva a especialidade (residência e matrícula) e a faixa do emprego', () => {
    let v = transacao(especialista('psiquiatria', 4), (x, r) => { contratar(x, r, ocupacao('medico_especialista'), 'curriculo'); }).vida;
    const o = opcoesDeCurso(v).find(x => x.especialidade === 'familia')!;
    v = transacao(v, (x, r) => { x.trabalho.atual = undefined; propor(x, r, novaMatricula(x, o)); x.momento = null; }).vida;
    const volta = importarVida(exportarVida(v));
    expect(volta.tipo).toBe('ok');
    const w = (volta as { vida: Vida }).vida;
    expect(w.educacao.concluidos.find(c => c.nivel === 'residencia')?.especialidade).toBe('psiquiatria');
    expect(w.educacao.matricula?.especialidade).toBe('familia');
    expect(especialidadeMedica(w)).toBe('psiquiatria');
  });
});

/* ======================================================= 2–4. Basquete e tênis */

function jovem(idadeAlvo: number, semente: number, genero: 'masculino' | 'feminino' = 'masculino'): Vida {
  const v = viverAte(nova({ semente, genero }), idadeAlvo);
  v.momento = null; v.caminhos.pendente = undefined; v.caminhos.esporte = undefined;
  return v;
}

function praticante(v: Vida, d: 'basquete' | 'tenis', h: number, nivel: 1 | 2 | 3 = 2): Vida {
  garantirFrente(v, d); const f = v.caminhos.frentes[d]!; f.habilidade = h; f.interesse = 85; f.meses = 60;
  v.rotinas = v.rotinas.filter(r => r.id !== d); v.rotinas.push({ id: d, tInicio: v.t - 36, nivel });
  return v;
}

/** Até achar duas pessoas de estaturas bem diferentes (a estatura sai da semente). */
function alturas(): [Vida, Vida] {
  const vs = [...Array(24)].map((_, k) => jovem(15, 300 + k));
  vs.sort((a, b) => estaturaAdulta(a) - estaturaAdulta(b));
  return [vs[0], vs[vs.length - 1]];
}

describe('2. Basquete: o corpo e a quadra (não é o futebol com outro nome)', () => {
  it('a estatura é da pessoa (estável) e decide a função em quadra; na seletiva, entra no físico', () => {
    const [baixo, alto] = alturas();
    expect(estaturaAdulta(alto)).toBeGreaterThan(estaturaAdulta(baixo) + 10);
    expect(estaturaAdulta(alto)).toBe(estaturaAdulta(JSON.parse(JSON.stringify(alto))));
    praticante(baixo, 'basquete', 66); praticante(alto, 'basquete', 66);
    baixo.corpo.forma = alto.corpo.forma = 60;
    const fb = aspectos(baixo, 'basquete'); const fa = aspectos(alto, 'basquete');
    expect(fa.tecnica).toBeCloseTo(fb.tecnica);
    // O físico do basquete = o do corpo + a estatura; no futebol, só o do corpo.
    const corpo = aspectos(alto, 'futebol').fisico - aspectos(baixo, 'futebol').fisico;
    expect(fa.fisico - fb.fisico).toBeCloseTo(corpo + vantagemDeEstatura(alto) - vantagemDeEstatura(baixo), 5);
    expect(vantagemDeEstatura(alto) - vantagemDeEstatura(baixo)).toBeGreaterThan(0.2);
    expect(funcaoBasquete(alto)).not.toBe(funcaoBasquete(baixo));
  });

  it('a carreira profissional tem liga, função e estatística próprias (pontos, rebotes, assistências por jogo) e salário de basquete', () => {
    let v = praticante(jovem(19, 41), 'basquete', 84, 3);
    v = transacao(v, (x, r) => { entrarNaBase(x, 'basquete', x.moradia.municipioId, 'Clube Teste'); profissionalizar(x, r, 3); }).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('jogador_basquete');
    expect(v.caminhos.esporte?.contratoAte).toBeDefined();
    expect(divisaoDe('basquete', v.caminhos.esporte!.nivel)).toMatch(/NBB|Liga Ouro|estadual/);
    v = transacao(v, (x, r) => { x.t += 12; processarEsporte(x, r); }).vida;
    const t = v.caminhos.esporte!.temporadas!.slice(-1)[0]!;
    expect(t.pontos).toBeGreaterThan(0);
    expect(t.rebotes).toBeDefined();
    expect(linhaDaTemporada(v, t)).toMatch(/pontos, .* rebotes e .* assistências por jogo/);
    // A escada é do basquete (Liga Ouro < NBB), e o teto fica muito abaixo da Série A do futebol.
    const es = v.caminhos.esporte!;
    expect(salarioDoContrato(v, { ...es, nivel: 3 })).toBeGreaterThan(salarioDoContrato(v, { ...es, nivel: 2 }));
    expect(salarioDoContrato(v, { ...es, nivel: 4 })).toBeLessThan(salarioDoContrato(v, { ...es, modalidade: 'futebol', posicao: 'meia', nivel: 4 }));
  });
});

describe('3. Tênis: individual, caro, de prêmio — sem clube nem salário', () => {
  it('a competição com treinador custa: sem a casa poder pagar, o nível de competição não abre (e não há projeto social que cubra)', () => {
    const v = praticante(jovem(13, 51), 'tenis', 50, 1);
    const compet = modeloRotina('tenis')!.niveis[1].requer!;
    const comRenda = (renda: number) => { const x = JSON.parse(JSON.stringify(v)) as Vida; for (const p of pais(x)) p.renda = renda; return x; };
    expect(compet(comRenda(40000))).toBe(true);
    expect(compet(comRenda(600))).toMatch(/não tem como pagar/);
    // A mesma casa apertada consegue o vôlei (projeto social, equipe barata): a barreira do tênis é o dinheiro, não a técnica.
    expect(modeloRotina('tenis')!.niveis[0].custo).toBeGreaterThan(modeloRotina('volei')!.niveis[1].custo * 3);
  });

  it('profissional: bruto (premiação) − custos do circuito = líquido; os custos são despesa do mês; o prêmio vira a renda', () => {
    let v = praticante(jovem(19, 53, 'feminino'), 'tenis', 82, 3);
    v.financas.conta = 150000;
    v = transacao(v, (x, r) => { entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis de Recife'); profissionalizar(x, r, 2); }).vida;
    expect(v.trabalho.atual?.ocupacaoId).toBe('tenista');
    expect(v.caminhos.esporte?.contratoAte).toBeUndefined();
    const conta = v.financas.conta;
    v = transacao(v, (x, r) => { x.t += 12; processarEsporte(x, r); }).vida;
    const t = v.caminhos.esporte!.temporadas!.slice(-1)[0]!;
    expect(t.premio).toBeGreaterThanOrEqual(0);
    expect(t.custos).toBeGreaterThan(0);
    expect(t.ranking).toBeGreaterThan(0);
    expect(t.vitorias).toBeGreaterThanOrEqual(0);
    // (A1, pós-playtest: os custos não saem mais da conta aqui, fora do orçamento — são a linha do circuito no mês a mês,
    // que o fechamento do ano cobra junto com o resto: `carreira.custosDoTrabalho`, `contabilidade.test`.)
    expect(v.financas.conta).toBe(conta);
    expect(custosDoTrabalho(v).find(l => /Circuito/.test(l.rotulo))?.valor).toBe(Math.round(t.custos! / 12));
    expect(v.trabalho.atual!.salario).toBe(Math.round(t.premio! / 12 / 10) * 10);
    expect(linhaDaTemporada(v, t)).toMatch(/torneios · .* vitórias/);
    expect(v.biografia.some(b => /Prêmios de .* custaram/.test(b.texto))).toBe(true);
  });

  it('dois anos no vermelho sem reserva: a vida pergunta (seguir, jogar só no Brasil, parar) — ninguém decide sozinho', () => {
    let v = praticante(jovem(20, 55), 'tenis', 70, 3);
    v = transacao(v, (x, r) => { entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis de Recife'); profissionalizar(x, r, 3); }).vida;
    v.financas.conta = 0;
    const es = v.caminhos.esporte!; es.reputacao = 5;
    for (let k = 0; k < 2; k++) v = transacao(v, (x, r) => { x.t += 12; x.caminhos.esporte!.reputacao = 5; processarEsporte(x, r); }).vida;
    expect(v.fatos['tenis_aperto']).toBe(v.t);
    expect(v.caminhos.esporte?.fase).toBe('profissional');
  });
});

describe('4. A técnica que a avaliação lê é a que a ação treina (basquete e tênis)', () => {
  it('treino de fundamentos em basquete e em tênis mexe na técnica DA modalidade (a mesma que a seletiva lê)', () => {
    for (const d of ['basquete', 'tenis'] as const) {
      let v = praticante(jovem(14, d === 'tenis' ? 61 : 62), d, 56);
      v.financas.conta = 30000;
      const antes = aspectos(v, d).tecnica;
      const outra = d === 'tenis' ? 'basquete' : 'tenis';
      const antesOutra = habilidade(v, outra);
      v = executar(v, { tipo: 'perseguir', oque: 'treino_fundamentos', valor: d } as unknown as Acao).vida;
      expect(aspectos(v, d).tecnica).toBeGreaterThan(antes);
      expect(habilidade(v, outra)).toBe(antesOutra);
    }
  });

  it('save/reload preserva a carreira de basquete e a de tênis (temporadas com os números próprios)', () => {
    let v = praticante(jovem(19, 57), 'tenis', 82, 3);
    v.financas.conta = 150000;
    v = transacao(v, (x, r) => { entrarNaBase(x, 'tenis', x.moradia.municipioId, 'academia de tênis de Recife'); profissionalizar(x, r, 2); x.t += 12; processarEsporte(x, r); }).vida;
    const volta = importarVida(exportarVida(v));
    expect(volta.tipo).toBe('ok');
    const w = (volta as { vida: Vida }).vida;
    expect(w.caminhos.esporte?.modalidade).toBe('tenis');
    expect(w.caminhos.esporte?.temporadas?.slice(-1)[0]?.premio).toBe(v.caminhos.esporte?.temporadas?.slice(-1)[0]?.premio);
  });
});

/* ======================================================= 5–10. Audiovisual e cachês */

function atriz(semente = 71, h = 72, cv = 8): Vida {
  const v = adulto(27, { semente });
  garantirFrente(v, 'teatro'); const f = v.caminhos.frentes.teatro!; f.habilidade = h; f.interesse = 90; f.meses = 120;
  v.rotinas = v.rotinas.filter(r => r.id !== 'teatro'); v.rotinas.push({ id: 'teatro', tInicio: v.t - 60, nivel: 2 });
  for (let k = 0; k < cv; k++) v.caminhos.curriculo = [...(v.caminhos.curriculo ?? []), { t: v.t - 12 - k, tipo: 'teatro', titulo: `Peça ${k}`, papel: 'elenco', repercussao: 1 }];
  v.financas.conta = 20000;
  return v;
}

describe('5–8. Audiovisual: teste → proposta → contrato → produção → currículo', () => {
  it('5. passar no teste gera PROPOSTA (não pagamento na hora); aceitar → produção → no fim, o líquido entra e a obra vai para o currículo', () => {
    let v = atriz();
    let prop: ContratoAV | undefined;
    for (let k = 0; k < 30 && !prop; k++) {
      v.fatos['cena_audicao'] = v.t - 24;
      const conta = v.financas.conta;
      v = executar(v, { tipo: 'perseguir', oque: 'audicao' } as unknown as Acao).vida;
      prop = propostasAbertas(v)[0];
      if (prop) expect(v.financas.conta).toBe(conta);
    }
    expect(prop).toBeDefined();
    const antesCv = v.caminhos.curriculo!.length;
    v.trabalho.atual = undefined;
    v = executar(v, { tipo: 'perseguir', oque: 'aceitar_contrato', valor: prop!.id } as unknown as Acao).vida;
    const c = v.caminhos.audiovisual!.contratos.find(x => x.id === prop!.id)!;
    expect(c.status).toBe(prop!.meses === 0 ? 'concluido' : 'em_producao');
    const conta = v.financas.conta;
    v = transacao(v, (x, r) => { x.t = (c.tFim ?? x.t) + 1; processarAudiovisual(x, r); }).vida;
    const fim = v.caminhos.audiovisual!.contratos.find(x => x.id === prop!.id)!;
    expect(fim.status).toBe('concluido');
    expect(v.financas.conta - conta).toBe(prop!.meses === 0 ? 0 : fim.bruto - fim.comissao - fim.despesas);
    expect(v.caminhos.curriculo!.length).toBe(antesCv + 1);
    expect(v.caminhos.curriculo!.slice(-1)[0].titulo).toBe(prop!.titulo);
  });

  it('6. contrato integral com trabalho de dia inteiro: aceitar abre a pergunta — a carreira de agora não some sem escolha', () => {
    let v = atriz(73);
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('professor_univ'), 'curriculo'); x.momento = null; }).vida;
    const c = transacao(v, x => { novaProposta(x, { tipo: 'novela', porte: 2, papel: 'coadjuvante', casa: 'uma emissora de TV aberta', titulo: 'Sol de Inverno' }); }).vida;
    const id = c.caminhos.audiovisual!.contratos[0].id;
    const w = executar(c, { tipo: 'perseguir', oque: 'aceitar_contrato', valor: id } as unknown as Acao).vida;
    expect(w.trabalho.atual?.ocupacaoId).toBe('professor_univ');
    expect(w.caminhos.audiovisual!.contratos[0].status).toBe('proposta');
    expect(w.momento?.situacaoId).toBe('av_conflito');
    // Escolher "pausar" (licença): o cargo fica guardado, a produção começa.
    const y = transacao(w, x => { x.momento = null; resolverConflitoAV(x, 'pausar'); }).vida;
    expect(y.trabalho.pausadas?.some(p => p.emprego.ocupacaoId === 'professor_univ')).toBe(true);
    expect(y.caminhos.audiovisual!.contratos[0].status).toBe('em_producao');
  });

  it('7. o agente tem efeito (testes maiores, mais testes, negociação) e custo real (comissão sai do líquido)', () => {
    const sem = atriz(75, 80, 30);
    const com = transacao(atriz(75, 80, 30), x => { x.caminhos.audiovisual = { contratos: [], agente: { nome: 'Rita', rede: 3, comissao: 0.2, tInicio: x.t } }; }).vida;
    expect(porteMaximoDoTeste(sem)).toBe(2);
    expect(porteMaximoDoTeste(com)).toBe(3);
    expect(intervaloDeTestes(com)).toBeLessThan(intervaloDeTestes(sem));
    const o = { tipo: 'serie' as const, porte: 2, papel: 'coadjuvante', casa: 'uma plataforma de streaming', titulo: 'Rota 116' };
    const a = cacheAudiovisual(sem, o); const b = cacheAudiovisual(com, o);
    expect(b.bruto).toBeGreaterThan(a.bruto);
    expect(a.comissao).toBe(0);
    // (Generalização de carreiras: a comissão é arredondada a dez reais — a cem, o trabalho pequeno saía sem comissão.)
    expect(b.comissao).toBe(Math.round(b.bruto * 0.2 / 10) * 10);
    expect(b.liquido).toBe(b.bruto - b.comissao - b.despesas);
    // Dispensar tira a comissão.
    const sozinha = executar(com, { tipo: 'perseguir', oque: 'deixar_agente' } as unknown as Acao).vida;
    expect(agenteDe(sozinha)).toBeUndefined();
    expect(cacheAudiovisual(sozinha, o).comissao).toBe(0);
  });

  it('8. romper custa multa e não entra no currículo; proposta sem resposta vence (nunca fica pendurada)', () => {
    let v = transacao(atriz(77), x => { const c = novaProposta(x, { tipo: 'filme', porte: 1, papel: 'coadjuvante', casa: 'uma produtora de cinema', titulo: 'Terra Vermelha' }); novaProposta(x, { tipo: 'curta', porte: 0, papel: 'elenco de apoio', casa: 'uma produtora independente', titulo: 'Pelas Margens' }); iniciarProducao(x, c); }).vida;
    const cv = v.caminhos.curriculo!.length; const conta = v.financas.conta;
    const filme = v.caminhos.audiovisual!.contratos[0];
    v = executar(v, { tipo: 'perseguir', oque: 'romper_contrato', valor: filme.id } as unknown as Acao).vida;
    expect(v.caminhos.audiovisual!.contratos[0].status).toBe('rompido');
    expect(conta - v.financas.conta).toBe(Math.round(filme.bruto * 0.2 / 100) * 100);
    expect(v.caminhos.curriculo!.length).toBe(cv);
    v = transacao(v, (x, r) => { x.t += 13; processarAudiovisual(x, r); }).vida;
    expect(v.caminhos.audiovisual!.contratos[1].status).toBe('expirou');
  });
});

describe('9–10. Cachês: causais, sem valor fixo repetido, bruto → comissão/despesas → líquido', () => {
  it('9. a mesma pessoa em oportunidades de escalas diferentes: cachês coerentemente diferentes', () => {
    const v = atriz(79, 78, 20);
    const c = (tipo: 'curta' | 'serie' | 'novela', porte: number, papel = 'coadjuvante', casa = 'uma plataforma de streaming') => cacheAudiovisual(v, { tipo, porte, papel, casa, titulo: 'Horizonte Partido' }).bruto;
    expect(c('curta', 0, 'elenco de apoio', 'uma produtora independente')).toBeLessThan(c('serie', 1));
    expect(c('serie', 1)).toBeLessThan(c('serie', 2));
    expect(c('serie', 2)).toBeLessThan(c('novela', 3, 'coadjuvante', 'uma emissora de TV aberta'));
    expect(c('serie', 2, 'elenco de apoio')).toBeLessThan(c('serie', 2, 'coadjuvante'));
    expect(c('serie', 2, 'coadjuvante')).toBeLessThan(c('serie', 2, 'protagonista'));
  });

  it('9b. pessoas e estágios diferentes: a distribuição não colapsa num valor repetido (o R$ 49.400 do FIX anterior)', () => {
    const valores = new Set<number>();
    const titulos = ['Horizonte Partido', 'Rota 116', 'A Cidade Acorda', 'Fronteira Sul', 'Laços de Maré'];
    const estagios: [number, number][] = [[1, 0], [3, 0], [5, 10], [8, 20], [12, 35], [20, 50]];
    for (let k = 0; k < estagios.length; k++) {
      const v = atriz(80 + k, 66 + k * 3, estagios[k][0]);
      if (estagios[k][1]) v.notoriedade = { valor: estagios[k][1], fonte: 'arte', t: v.t } as Vida['notoriedade'];
      for (const t of titulos) valores.add(cacheAudiovisual(v, { tipo: 'serie', porte: 2, papel: 'coadjuvante', casa: 'uma plataforma de streaming', titulo: t }).bruto);
    }
    expect(valores.size).toBeGreaterThanOrEqual(25);
    // E o extraordinário continua raro: um coadjuvante sem nome nunca passa do teto de uma série grande.
    expect(Math.max(...valores)).toBeLessThan(150000);
  });

  it('10. comissão e despesas afetam o líquido (e o trabalho pequeno paga o líquido)', () => {
    let v = transacao(atriz(87), x => { x.caminhos.audiovisual = { contratos: [], agente: { nome: 'Rita', rede: 1, comissao: 0.1, tInicio: x.t } }; }).vida;
    const conta = v.financas.conta;
    v = executar(v, { tipo: 'perseguir', oque: 'trabalho_pequeno' } as unknown as Acao).vida;
    const item = v.caminhos.curriculo!.slice(-1)[0];
    const recebido = v.financas.conta - conta;
    expect(item.cache).toBeGreaterThan(recebido);
    expect(recebido).toBeGreaterThan(0);
  });

  it('13. save/reload preserva agente, contratos e o status de cada um', () => {
    const v = transacao(atriz(89), x => { x.caminhos.audiovisual = { contratos: [], agente: { nome: 'Rita', rede: 2, comissao: 0.15, tInicio: x.t } }; const c = novaProposta(x, { tipo: 'serie', porte: 2, papel: 'coadjuvante', casa: 'uma plataforma de streaming', titulo: 'Rota 116' }); iniciarProducao(x, c); }).vida;
    const volta = importarVida(exportarVida(v));
    expect(volta.tipo).toBe('ok');
    const w = (volta as { vida: Vida }).vida;
    expect(w.caminhos.audiovisual?.agente?.nome).toBe('Rita');
    expect(w.caminhos.audiovisual?.contratos[0].status).toBe('em_producao');
    expect(w.caminhos.audiovisual?.contratos[0].bruto).toBe(v.caminhos.audiovisual!.contratos[0].bruto);
  });
});

/* ======================================================= 11–12. Casa própria e ajuda da família */

describe('11. Casa própria: quem pode comprar encontra uma opção que cabe (e o dinheiro aplicado conta)', () => {
  it('renda e entrada guardada nas aplicações: há oferta real da cidade que cabe — pagando com o resgate, como na tela', () => {
    let v = adulto(33, { semente: 91 });
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('medico'), 'curriculo'); x.trabalho.licencas.push('crm'); x.financas.conta = 160000; x.financas.dividas = []; x.financas.negativado = false; }).vida;
    v = executar(v, { tipo: 'investir', destino: 'reserva', valor: 150000 } as Acao).vida;
    const { para, resto } = imoveisParaVoce(v, 'venda');
    const cands = [...para.map(x => x.item), ...resto].sort((a, b) => a.preco - b.preco);
    expect(cands.length).toBeGreaterThan(0);
    const compra = (id: string): Acao => ({ tipo: 'comprar_imovel', ofertaId: id, financiar: true, morar: true });
    // Direto não passa (a conta corrente não tem a entrada)...
    const d = disponibilidade(v, compra(cands[0].id));
    expect(podeTentar(d)).toBe(false);
    expect(d.resgate).toBeDefined();
    // ...mas com o resgate das aplicações, cabe — e a compra acontece.
    const alvo = cands.find(o => podeTentar(disponibilidade(v, { tipo: 'resgatar_e', acao: compra(o.id) } as Acao)));
    expect(alvo).toBeDefined();
    v = executar(v, { tipo: 'resgatar_e', acao: compra(alvo!.id) } as Acao).vida;
    expect(v.financas.bens.some(b => b.tipo === 'imovel')).toBe(true);
  });
});

describe('12. Ajuda da família: capacidade, necessidade e contexto — não renda automática', () => {
  function comIrmao(renda: number, semente: number): { v: Vida; p: Pessoa } {
    const v = adulto(32, { semente });
    for (const x of vinculosVivos(v)) if (['mae', 'pai', 'avo', 'irmao', 'filho'].includes(x.vin.parentesco ?? '')) x.p.vivo = false;
    const { p, vin } = comParente(v, 'irmao', 36, 'masculino', 80);
    p.renda = renda; vin.confianca = 70; vin.tensao = 0;
    return { v, p };
  }
  const ajudas = (renda: number, recentes: number) => {
    let n = 0;
    for (let s = 1; s <= 40; s++) {
      const { v, p } = comIrmao(renda, 200 + s);
      for (let k = 0; k < recentes; k++) (v.origem.apoios ??= []).push({ t: v.t - 12 * (k + 1), valor: 2000, motivo: 'emergencia', sentido: 'recebeu' });
      const falta = transacao(v, (x, r) => ajudaDaFamilia(x, r, 3000)).valor;
      if (falta < 3000) n++;
      void p;
    }
    return n;
  };
  it('o irmão que ganha um salário mínimo e pouco não tem folga para cobrir o buraco; o que ganha bem, sim', () => {
    expect(ajudas(1.4 * SALARIO_MINIMO, 0)).toBe(0);
    expect(ajudas(9000, 0)).toBeGreaterThan(15);
  });
  it('socorros recentes pesam: a família que já cobriu duas vezes em poucos anos ajuda bem menos', () => {
    expect(ajudas(9000, 2)).toBeLessThan(ajudas(9000, 0) * 0.7);
  });
});
