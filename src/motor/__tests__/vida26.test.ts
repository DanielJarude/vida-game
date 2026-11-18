/**
 * VIDA 26 · corpo → capacidades → atributos; a formação (capacidade, potencial, prontidão, etapas, contrato); o
 * pós-carreira de toda modalidade e dos e-sports; o guia de carreiras; hobby × outros caminhos; saves antigos.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova, viver } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { executar, disponibilidade, type Acao } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { exportarVida, importarVida } from '../save';
import { criarRng } from '../rng';
import type { AnoDeFormacao, CarreiraEsportiva, Vida } from '../tipos';
import { capacidades26, REFERENCIA26, type EntradaCapacidades26 } from '../v26/corpo/capacidades26';
import { ATRIBUTOS_BASQUETE, ATRIBUTOS_DA_POSICAO, atributosDaCarreira, deficienciasGraves, efeitoNaNota, GRUPO_DO_ATRIBUTO, normalizarAtributos26, perfilDeAtributos } from '../sistemas/atributosEsportivos';
import { avaliacaoDaComissao, IDADE_LEGAL_CONTRATO, lerJovem, prontoParaContrato, type LeituraDoJovem } from '../sistemas/jovemAtleta';
import { contratoDaBase, entrarNaBase, MODALIDADES } from '../sistemas/esporte';
import { garantirFrente } from '../sistemas/frentes';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { degrausAcima } from '../sistemas/trabalho';
import { chanceDaPorta26, executarPos26, POS_CARREIRA26, portasDoPosCarreira26, trajetoriasEncerradas26 } from '../v26/carreira/posCarreira26';
import { trajetorias26 } from '../v26/carreira/trajetorias26';
import { naturezaDaAtividade26, portaDoHobby26, processarHobbies26 } from '../v26/hobby/hobbyCaminho26';
import { garantirAtributos26, nivelDeJogo25 } from '../v25/esports/esports25';
import { JOGOS25, LISTA_JOGOS25 } from '../v25/esports/jogos25';

beforeAll(async () => { await carregarMundo(); });

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
function aos(idade: number, o: Record<string, unknown> = {}): Vida { const v = nova({ semente: 260 + idade, genero: 'masculino', ...o } as never); v.t = v.eu.tNasc + idade * 12; return v; }
const neutro = { estatura: 0, estrutura: 0, ombros: 0, peito: 0, quadril: 0, pernas: 0, musculo: 0 };
const ent = (o: Partial<EntradaCapacidades26> = {}): EntradaCapacidades26 => ({ idade: 25, c: neutro, g: 0, m: 0.5, forma: 65, saude: 85, zAgora: 0, zAdulta: 0, ...o });

describe('VIDA 26 · constituição, condição e capacidades', () => {
  it('cada relação tem a direção da física, sem extremos', () => {
    const b = capacidades26(ent());
    expect(capacidades26(ent({ c: { ...neutro, pernas: 2 } })).velocidade).toBeGreaterThan(b.velocidade);
    expect(capacidades26(ent({ m: 2 })).forca).toBeGreaterThan(b.forca + 10);
    const gordo = capacidades26(ent({ g: 2.5 }));
    expect(gordo.velocidade).toBeLessThan(b.velocidade);
    expect(gordo.impulsao).toBeLessThan(b.impulsao);
    const alto = capacidades26(ent({ zAgora: 2, zAdulta: 2 }));
    expect(alto.alcance).toBeGreaterThan(b.alcance + 15);
    expect(alto.agilidade).toBeLessThan(b.agilidade);
    expect(capacidades26(ent({ forma: 90 })).resistencia).toBeGreaterThan(b.resistencia + 10);
    // Nenhuma característica zera uma capacidade (não há bloqueio): o extremo de cada eixo continua dentro de 1..99.
    for (const x of [ent({ g: 3, m: -0.8, forma: 5 }), ent({ c: { estatura: 2, estrutura: 2, ombros: 2, peito: 2, quadril: 2, pernas: 2, musculo: 2 }, m: 2.6, forma: 100, zAgora: 2.5, zAdulta: 2.5 })])
      for (const v of Object.values(capacidades26(x))) { expect(v).toBeGreaterThanOrEqual(1); expect(v).toBeLessThanOrEqual(99); }
  });
  it('a criança e o adolescente não têm força nem fôlego de adulto, por mais que treinem; a agilidade amadurece antes', () => {
    const adulto = capacidades26(ent({ forma: 90, m: 1.5 }));
    const crianca = capacidades26(ent({ idade: 12, forma: 90, m: 1.5 }));
    expect(crianca.forca).toBeLessThan(adulto.forca * 0.8);
    expect(crianca.resistencia).toBeLessThan(adulto.resistencia);
    expect(crianca.agilidade / adulto.agilidade).toBeGreaterThan(crianca.forca / adulto.forca);
    // E o corpo cobra depois dos 30: primeiro a explosão.
    expect(capacidades26(ent({ idade: 38, forma: 90, m: 1.5 })).potencia).toBeLessThan(adulto.potencia);
  });
  it('a régua do esporte é o profissional médio (o atleta médio fica na técnica)', () => {
    expect(REFERENCIA26.resistencia).toBeGreaterThan(80);
    expect(REFERENCIA26.alcance).toBe(50);
  });
});

describe('VIDA 26 · atributos esportivos', () => {
  it('futebol: as quatro naturezas, conjuntos diferentes por posição, pesos que somam 1', () => {
    for (const [pos, l] of Object.entries(ATRIBUTOS_DA_POSICAO)) {
      expect(l.reduce((s, [, p]) => s + p, 0), pos).toBeCloseTo(1, 5);
      expect(new Set(l.map(([id]) => GRUPO_DO_ATRIBUTO[id])).size, pos).toBeGreaterThanOrEqual(3);
      expect(l.length).toBeGreaterThanOrEqual(10);
    }
    const todos = new Set(Object.values(ATRIBUTOS_DA_POSICAO).flatMap(l => l.map(([id]) => GRUPO_DO_ATRIBUTO[id])));
    expect([...todos].sort()).toEqual(['fisico', 'mental', 'tatico', 'tecnico']);
    for (const l of Object.values(ATRIBUTOS_BASQUETE)) expect(l.reduce((s, [, p]) => s + p, 0)).toBeCloseTo(1, 5);
  });
  it('toda modalidade tem conjunto próprio (não o do futebol) com pesos que somam 1', () => {
    const v = aos(24);
    const conjuntos = new Set<string>();
    for (const d of MODALIDADES) {
      const l = atributosDaCarreira({ modalidade: d } as CarreiraEsportiva, d === 'futebol' ? 'meia' : undefined, undefined, v);
      expect(l.length, d).toBeGreaterThanOrEqual(7);
      expect(l.reduce((s, [, p]) => s + p, 0), d).toBeCloseTo(1, 5);
      conjuntos.add(l.map(([id]) => id).sort().join());
    }
    expect(conjuntos.size).toBe(MODALIDADES.length);
  });
  it('o físico do jovem de 12 anos fica abaixo do mesmo atleta adulto com a mesma técnica (o técnico, não)', () => {
    const e = { modalidade: 'futebol', tInicio: 0 } as unknown as CarreiraEsportiva;
    const jovem = aos(12);
    // Um corpo de atleta (condicionamento e músculo de quem treina), o mesmo aos 12 e aos 25: muda só a idade.
    jovem.corpo.forma = 85; jovem.corpo.composicao24 = { g: -0.5, m: 1.5, t: jovem.t };
    const adulto = structuredClone(jovem);
    adulto.t = adulto.eu.tNasc + 25 * 12; e.tInicio = adulto.t - 24;
    const pj = perfilDeAtributos(jovem, { ...e, tInicio: jovem.t - 24 }, 80, 'zagueiro'), pa = perfilDeAtributos(adulto, e, 80, 'zagueiro');
    const v = (p: typeof pj, id: string) => p.find(x => x.id === id)!.valor;
    expect(v(pj, 'forca')).toBeLessThan(v(pa, 'forca') - 3);
    expect(v(pj, 'desarme')).toBe(v(pa, 'desarme'));
  });
  it('os mentais leem a personalidade (a disciplina, a impulsividade)', () => {
    const e = { modalidade: 'futebol', tInicio: 0 } as unknown as CarreiraEsportiva;
    const a = aos(25), b = structuredClone(a);
    a.personalidade.tracos.disciplina = 80; a.personalidade.tracos.impulsividade = -50;
    b.personalidade.tracos.disciplina = -60; b.personalidade.tracos.impulsividade = 70;
    const c = (v: Vida) => perfilDeAtributos(v, { ...e, tInicio: v.t - 60 }, 80, 'goleiro').find(x => x.id === 'concentracao')!.valor;
    expect(c(a)).toBeGreaterThan(c(b) + 6);
  });
  it('uma limitação séria num atributo que pesa cobra além da média (a nota alta não a esconde)', () => {
    const v = aos(25);
    const e = { modalidade: 'futebol', tInicio: v.t - 60 } as unknown as CarreiraEsportiva;
    const base = perfilDeAtributos(v, e, 80, 'goleiro');
    const ruim = base.map(x => (x.id === 'reflexos' ? { ...x, valor: x.valor - 16 } : x));
    const espalhado = base.map(x => ({ ...x, valor: x.valor - 16 * 0.2 }));
    expect(deficienciasGraves(ruim).map(x => x.id)).toContain('reflexos');
    // A mesma perda média, concentrada no que a posição exige, pesa mais do que espalhada.
    expect(efeitoNaNota(ruim, 80)).toBeLessThan(efeitoNaNota(espalhado, 80) - 0.2);
  });
});

describe('VIDA 26 · formação: capacidade, potencial, prontidão', () => {
  const l = (o: Partial<LeituraDoJovem> = {}): LeituraDoJovem => ({ capacidade: 80, potencial: [80, 90], prontidao: 60, partes: { tecnica: 80, fisico: 60, experiencia: 50, maturidade: 60 }, ...o });
  const futebol = contratoDaBase('futebol');
  it('contrato: nunca antes dos 16 (Lei 14.597/2023); aos 16 só o excepcional; depois, técnica e prontidão', () => {
    expect(IDADE_LEGAL_CONTRATO).toBe(16);
    for (const i of [12, 13, 14, 15]) expect(prontoParaContrato(i, futebol.idade, 99, futebol.tecnica, l({ prontidao: 99 }))).toBe(false);
    expect(prontoParaContrato(16, futebol.idade, futebol.tecnica + 1, futebol.tecnica, l({ prontidao: 70 }))).toBe(false);
    expect(prontoParaContrato(16, futebol.idade, futebol.tecnica + 5, futebol.tecnica, l({ prontidao: 85 }))).toBe(true);
    expect(prontoParaContrato(17, futebol.idade, futebol.tecnica + 1, futebol.tecnica, l({ prontidao: 60 }))).toBe(true);
    expect(prontoParaContrato(17, futebol.idade, futebol.tecnica + 1, futebol.tecnica, l({ prontidao: 40 }))).toBe(false);
  });
  it('a avaliação do menino de 12 com técnica alta não promete contrato; a do pronto, sim — sem contradição', () => {
    const a: AnoDeFormacao = { ano: 2030, idade: 12, categoria: 'sub-15', clube: 'Sport', competicao: 'x', jogos: 18, titular: 16, nota: 8.4, tecnica: 84, colocacao: 1, participantes: 16, avaliacao: '' };
    const t = avaliacaoDaComissao(a, l({ partes: { tecnica: 70, fisico: 30, experiencia: 20, maturidade: 40 } }), 84, futebol.tecnica, false);
    expect(t).toMatch(/destaques da categoria/);
    expect(t).not.toMatch(/condições de oferecer|já tem o nível/);
    expect(t).toMatch(/a partir dos 16/);
    expect(t).toMatch(/físico/);
    const pronto = avaliacaoDaComissao({ ...a, idade: 18, categoria: 'sub-20' }, l(), 84, futebol.tecnica, true);
    expect(pronto).toMatch(/condições de oferecer um contrato/);
    expect(pronto).not.toMatch(/ainda precisa/);
  });
  it('a leitura real separa as três coisas; o potencial é faixa (larga cedo) e nunca abaixo da técnica de hoje', () => {
    const v = aos(13);
    garantirFrente(v, 'futebol').habilidade = 78;
    entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Sport');
    const e = v.caminhos.esporte!;
    const perfil = perfilDeAtributos(v, e, 78, 'meia');
    const x = lerJovem(v, e, 78, perfil, 79);
    expect(x.potencial[0]).toBeGreaterThanOrEqual(78);
    expect(x.potencial[1] - x.potencial[0]).toBeGreaterThanOrEqual(5);
    expect(x.partes.fisico).toBeLessThan(55);
    expect(x.prontidao).toBeLessThan(60);
    const adulto = structuredClone(v); adulto.t = adulto.eu.tNasc + 19 * 12;
    expect(lerJovem(adulto, e, 78, perfilDeAtributos(adulto, e, 78, 'meia'), 79).partes.fisico).toBeGreaterThan(x.partes.fisico);
  });
  it('vidas na base: anos registrados com leitura; nenhum contrato antes dos 16; avaliação nunca promete contrato a menor de 16', () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      let v = aos(12, { semente: 2600 + s });
      garantirFrente(v, 'futebol').habilidade = 72 + s * 2.5;
      entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Sport');
      v = viver(v, 6, x => x.caminhos.oportunidades.filter(o => o.tipo === 'convite').map(o => ({ tipo: 'oportunidade', id: o.id, aceitar: true } as Acao)));
      const e = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].find(c => c?.modalidade === 'futebol');
      for (const a of e?.formacao ?? []) {
        expect(a.prontidao).toBeTypeOf('number');
        if (a.idade < 16) expect(a.avaliacao).not.toMatch(/condições de oferecer um contrato|já tem o nível/);
      }
      const marco = v.biografia.find(b => /primeiro contrato profissional/.test(b.texto));
      if (marco) expect(marco.idade).toBeGreaterThanOrEqual(16);
    }
  });
});

describe('VIDA 26 · depois de competir', () => {
  it('toda modalidade, os e-sports e o automobilismo têm portas — profissões que existem no catálogo', () => {
    for (const o of [...MODALIDADES, 'esports', 'automobilismo'] as const) {
      const l = POS_CARREIRA26[o];
      expect(l?.length, o).toBeGreaterThanOrEqual(3);
      for (const id of l!) expect(ocupacaoOuNula(id), `${o}: ${id}`).toBeTruthy();
    }
    // Cada carreira nova tem para onde crescer (a escada da trilha).
    expect(degrausAcima(ocupacaoOuNula('comentarista_esportivo')!).map(x => x.id)).toContain('comentarista_tv');
    expect(degrausAcima(ocupacaoOuNula('analista_esports')!).map(x => x.id)).toContain('tecnico_esports');
    expect(degrausAcima(ocupacaoOuNula('tecnico_esports')!).map(x => x.id)).toContain('gestor_esports');
    expect(degrausAcima(ocupacaoOuNula('auxiliar_tecnico_futsal')!).map(x => x.id)).toContain('tecnico_futsal');
    expect(degrausAcima(ocupacaoOuNula('analista_desempenho')!).map(x => x.id)).toContain('coordenador_analise');
  });
  it('a trajetória decide: o ex-profissional de elite tem a mídia; o dispensado da base, a escolinha (não a TV)', () => {
    const v = aos(34);
    const pro: CarreiraEsportiva = { modalidade: 'futebol', fase: 'encerrada', clube: 'Sport', nivel: 4, tInicio: v.t - 16 * 12, tFase: v.t - 14 * 12, tFim: v.t - 6, lesoes: 0, municipioId: 'recife-pe', reputacao: 62, posicao: 'goleiro',
      temporadas: Array.from({ length: 12 }, (_, k) => ({ ano: 2014 + k, clube: 'Sport', nivel: 4, partidas: 30, titular: 28, gols: 0, assistencias: 0, nota: 7, colocacao: k === 3 ? 1 : 6, mesesFora: 0 })) as never };
    v.caminhos.esporte = pro;
    const t = trajetoriasEncerradas26(v)[0];
    expect(t.profissional).toBe(true);
    expect(chanceDaPorta26(v, t, 'comentarista_esportivo').chance).toBeGreaterThan(0.2);
    expect(chanceDaPorta26(v, t, 'treinador_goleiros').chance).toBeGreaterThan(0);
    const w = aos(19);
    w.caminhos.esporte = { modalidade: 'futebol', fase: 'encerrada', clube: 'Sport', nivel: 1, tInicio: w.t - 5 * 12, tFase: w.t - 5 * 12, tFim: w.t - 3, lesoes: 0, municipioId: 'recife-pe', motivoFim: 'dispensa' };
    const tw = trajetoriasEncerradas26(w)[0];
    expect(chanceDaPorta26(w, tw, 'comentarista_esportivo')).toMatchObject({ chance: 0 });
    expect(chanceDaPorta26(w, tw, 'comentarista_esportivo').motivo).toBeTruthy();
    // Sem títulos não é sem portas: a escolinha fica (idade permitindo).
    const x = aos(23); x.caminhos.esporte = { ...w.caminhos.esporte!, tFim: x.t - 3, tInicio: x.t - 8 * 12 };
    garantirFrente(x, 'futebol').habilidade = 66; // a escolinha pede saber jogar (o mesmo que a vaga cobra)
    expect(chanceDaPorta26(x, trajetoriasEncerradas26(x)[0], 'treinador_escolinha').chance).toBeGreaterThan(0.3);
  });
  it('procurar uma porta contrata de verdade (salário, empregador, marco) — e só uma tentativa por ano', () => {
    const v = aos(34);
    v.caminhos.esporte = { modalidade: 'volei', fase: 'encerrada', clube: 'equipe de vôlei de Recife', nivel: 4, tInicio: v.t - 14 * 12, tFase: v.t - 12 * 12, tFim: v.t - 6, lesoes: 0, municipioId: 'recife-pe', reputacao: 50,
      temporadas: Array.from({ length: 10 }, (_, k) => ({ ano: 2016 + k, clube: 'x', nivel: 4, partidas: 20, titular: 18, gols: 0, assistencias: 0, nota: 7, colocacao: 3, mesesFora: 0 })) as never };
    v.trabalho.atual = undefined;
    const portas = portasDoPosCarreira26(v)[0].portas;
    expect(portas.map(p => p.id)).toContain('auxiliar_tecnico_volei');
    let contratado = false;
    for (let s = 0; s < 30 && !contratado; s++) {
      const w = structuredClone(v);
      const r = executarPos26(w, criarRng(s), 'analista_desempenho');
      if (r.tom === 'bom') { contratado = true; expect(w.trabalho.atual?.ocupacaoId).toBe('analista_desempenho'); expect(w.trabalho.atual!.salario).toBeGreaterThan(0); }
      else expect(executarPos26(w, criarRng(s + 1), 'analista_desempenho').texto).toMatch(/já procurou/);
    }
    expect(contratado).toBe(true);
    expect(tenta(v, { tipo: 'pos26', ocupacaoId: 'treinador_tenistas' } as Acao)).toBe(false);
  });
});

describe('VIDA 26 · guia de carreiras', () => {
  it('cobre todas as modalidades, todos os jogos e o automobilismo; etapas e depois de cada um', () => {
    const v = aos(15);
    const t = trajetorias26(v);
    expect(t.filter(x => x.grupo === 'esporte').map(x => x.id).sort()).toEqual([...MODALIDADES].sort());
    expect(t.filter(x => x.grupo === 'esports')).toHaveLength(LISTA_JOGOS25.length);
    expect(t.some(x => x.grupo === 'pistas')).toBe(true);
    // VIDA 26.1: as profissões (as famílias de carreira) entram também, com os degraus que cada uma tem (3 a 5).
    for (const x of t) { expect(x.etapas.length, x.id).toBeGreaterThanOrEqual(x.grupo === 'profissao' ? 3 : 5); expect(x.depois.length, x.id).toBeGreaterThanOrEqual(x.grupo === 'profissao' ? 1 : 3); expect(x.fatores.length).toBeGreaterThan(0); }
    expect(t.filter(x => x.grupo === 'profissao').length).toBeGreaterThanOrEqual(15);
  });
  it('marca onde a vida está: a formação de quem está na base', () => {
    const v = aos(14);
    garantirFrente(v, 'futebol').habilidade = 70;
    entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Sport');
    const f = trajetorias26(v).find(x => x.id === 'futebol')!;
    expect(f.meu).toBe(true);
    expect(f.etapas.find(e => e.aqui)?.nome).toBe('A formação');
  });
});

describe('VIDA 26 · hobby, outros caminhos e profissão', () => {
  it('a natureza de cada atividade', () => {
    expect(naturezaDaAtividade26('bico', 'renda')).toBe('renda');
    expect(naturezaDaAtividade26('esports', 'lazer')).toBe('caminho');
    expect(naturezaDaAtividade26('musica', 'arte')).toBe('hobby');
    expect(naturezaDaAtividade26('videogame', 'lazer')).toBe('hobby');
    expect(naturezaDaAtividade26('monitoria', 'estudo')).toBe('formacao');
  });
  it('o hobby mostra para onde pode levar, com o passo real da idade (e sem obrigar)', () => {
    const crianca = aos(8); crianca.rotinas.push({ id: 'futebol', tInicio: crianca.t - 24, nivel: 1 });
    expect(portaDoHobby26(crianca, 'futebol')!.passo).toMatch(/abre por volta dos 11/);
    const adulto = aos(35); adulto.rotinas.push({ id: 'futebol', tInicio: adulto.t - 24, nivel: 1 });
    expect(portaDoHobby26(adulto, 'futebol')!.passo).toMatch(/hobby/);
    const gamer = aos(16); gamer.rotinas.push({ id: 'videogame', tInicio: gamer.t - 36, nivel: 1 });
    expect(portaDoHobby26(gamer, 'videogame')!.sequencia).toEqual(['Videogame por diversão', 'Competitivo amador', 'E-sports profissional', 'Depois de competir']);
  });
  it('quem joga há anos pode ser chamado por um time amador — e começa nos e-sports pelo competitivo amador', () => {
    let achou: Vida | undefined;
    for (let s = 0; s < 40 && !achou; s++) {
      const v = aos(14, { semente: 3000 + s }); v.rotinas.push({ id: 'videogame', tInicio: v.t - 48, nivel: 1 });
      for (let k = 0; k < 6 && v.fatos['esports_convite26'] === undefined; k++) { v.t += 12; processarHobbies26(v); }
      if (v.fatos['esports_convite26'] !== undefined) achou = v;
    }
    expect(achou).toBeTruthy();
    const w = executar(achou!, { tipo: 'esports25', oque: { op: 'comecar', jogo: 'cs' } } as never).vida;
    expect(w.esports25?.nivel).toBe(2);
  });
});

describe('VIDA 26 · saves antigos', () => {
  it('o "jogo de fundo" do tênis passa ao forehand e ao backhand; e-sports antigos ganham os atributos novos na média', () => {
    const e = { modalidade: 'tenis', atributos: { fundo: 4, saque: 2 } } as unknown as CarreiraEsportiva;
    normalizarAtributos26(e);
    expect(e.atributos).toEqual({ forehand: 4, backhand: 4, saque: 2 });
    const x = { jogo: 'cs', inicio: 100, funcao: 'awper', atributos: { mira: 60, reflexos: 60, posicionamento: 60, utilitarios: 60, comunicacao: 60, consistencia: 60, mental: 60 } } as never;
    garantirAtributos26(x);
    for (const [id] of JOGOS25.cs.atributos) expect((x as { atributos: Record<string, number> }).atributos[id]).toBeTypeOf('number');
    // Todos os antigos estavam em 60: o nível de jogo continua perto de 60 (os novos entram na média, ± o traço).
    expect(Math.abs(nivelDeJogo25(x) - 60)).toBeLessThan(3);
  });
  it('um save salvo e reaberto mantém a carreira, a formação e os atributos', () => {
    let v = aos(13, { semente: 2690 });
    garantirFrente(v, 'futebol').habilidade = 80;
    entrarNaBase(v, 'futebol', v.moradia.municipioId, 'Sport');
    v = viver(v, 2);
    const r = importarVida(exportarVida(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo !== 'ok') return;
    const a = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].find(c => c?.modalidade === 'futebol');
    const b = [r.vida.caminhos.esporte, ...(r.vida.caminhos.carreirasEsportivas ?? [])].find(c => c?.modalidade === 'futebol');
    expect(b?.formacao).toEqual(a?.formacao);
    expect(b?.adiantado26).toEqual(a?.adiantado26);
  });
});
