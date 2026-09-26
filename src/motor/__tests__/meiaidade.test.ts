/**
 * FIX #7 (playtest): entre os 40 e os 70 a vida ficava monótona. A correção
 * não é sortear mais coisas: é ler o passado que já existe. Cada conteúdo de
 * `conteudo/biografia` só abre quando o estado o sustenta, usa os nomes e a
 * história reais, diz antes o que cada opção muda e aplica o que disse.
 */

import { describe, expect, it } from 'vitest';
import { abrirDecisao, aplicarAcontecimento, conteudoPorId, preparar, resolverDecisao } from '../conteudo/motor';
import type { Acontecimento, Decisao } from '../conteudo/base';
import { criarRng } from '../rng';
import { transacao } from '../nucleo';
import { vincular } from '../pessoas';
import { adulto, comFilho, comNeto, comParceiro, comParente, pessoaNova, semPais } from './cenarios';
import { medir } from './meiaidade_medida';
import { BIOGRAFIA } from '../conteudo/biografia';
import { NEGOCIOS } from '../dados/negocios';
import { abrirNegocio } from '../sistemas/negocio';
import { processarFamiliaDeOrigem } from '../sistemas/familia';
import type { Imovel, Vida } from '../tipos';

/* ------------------------------------------------------------ Utilitários */

const BASE: Record<string, Vida> = {};
/** Uma vida adulta limpa (sem pais nem irmãos), com dinheiro, na idade pedida. */
function base(i: number, genero: 'feminino' | 'masculino' = 'feminino'): Vida {
  const k = `${i}:${genero}`;
  if (!BASE[k]) {
    const v = adulto(i, { semente: 31, genero });
    semPais(v);
    for (const vin of Object.values(v.vinculos)) if (vin.parentesco === 'irmao' || vin.parentesco === 'meio_irmao' || vin.parentesco === 'filho' || vin.parentesco === 'neto') { const p = v.pessoas[vin.pessoaId]; if (p) p.vivo = false; }
    v.trabalho.atual = undefined;
    v.caminhos.negocio = undefined;
    v.educacao.matricula = undefined;
    v.financas.conta = 150000;
    v.financas.dividas = [];
    // O que a vida-base já viveu não conta: cada teste monta o seu passado.
    v.ocorrencias = [];
    for (const f of Object.keys(v.fatos)) if (/^(bio_|bodas_|plano_|quis_mudar_area|virou_avo|simulou_)/.test(f)) delete v.fatos[f];
    BASE[k] = v;
  }
  return structuredClone(BASE[k]);
}

const prep = (id: string, v: Vida, k = 3) => preparar(conteudoPorId(id)!, v, criarRng(k));

/** Abre a decisão e devolve os textos (título, texto e opções visíveis). */
function abrir(id: string, v: Vida, k = 3) {
  const d = conteudoPorId(id) as Decisao;
  const ctx = preparar(d, v, criarRng(k));
  expect(ctx).not.toBeNull();
  const m = abrirDecisao(v, d, ctx!);
  return m;
}

function resolver(id: string, v: Vida, opcao: string, k = 3): string {
  const m = v.momento?.situacaoId === id ? v.momento : abrir(id, v, k);
  const op = m.opcoes.find(o => o.id === opcao);
  expect(op, `opção ${opcao} visível`).toBeTruthy();
  expect(op!.bloqueio, `opção ${opcao} livre`).toBeUndefined();
  const r = resolverDecisao(v, criarRng(k + 1), opcao);
  expect('texto' in r).toBe(true);
  return 'texto' in r ? r.texto : '';
}

const conta = (v: Vida) => v.financas.conta;

/* ================================================================ Estrutura */

describe('biografia: o catálogo da meia-idade', () => {
  it('toda opção de toda decisão diz antes o que muda', () => {
    for (const c of BIOGRAFIA) {
      if (c.tipo !== 'decisao') continue;
      for (const o of c.opcoes) expect(o.consequencia, `${c.id}:${o.id}`).toBeTypeOf('function');
    }
  });
  it('está no catálogo e cobre a meia-idade e a velhice', () => {
    for (const c of BIOGRAFIA) expect(conteudoPorId(c.id)).toBe(c);
    expect(BIOGRAFIA.length).toBeGreaterThanOrEqual(14);
    expect(BIOGRAFIA.every(c => c.idade[1] >= 55)).toBe(true);
  });
});

/* ======================================================= Os filhos adultos */

describe('o filho casou', () => {
  function cena() {
    const v = base(58, 'masculino');
    const esposa = comParceiro(v, { idade: 56, anos: 30, genero: 'feminino' }).p;
    const filha = comFilho(v, 28, { casa: false, outroId: esposa.id, genero: 'feminino' }).p;
    const genro = pessoaNova(v, 30, 'masculino', { ocupacao: 'enfermeiro' });
    vincular(v, genro, { parentesco: 'genro', origem: 'familia', proximidade: 35 });
    genro.parceiroId = filha.id; filha.parceiroId = genro.id;
    v.fatos[`namoro_${filha.id}`] = v.t - 48;
    v.fatos[`casou_${filha.id}`] = v.t;
    v.fatos[`uniao_cartorio_${filha.id}`] = 1;
    return { v, filha, genro };
  }
  it('abre com os nomes e a história do casal; sem casamento, não abre', () => {
    const { v, filha, genro } = cena();
    const m = abrir('bio_casamento_filho', v);
    expect(m.texto).toContain(filha.nome);
    expect(m.texto).toContain(genro.nome);
    expect(m.texto).toContain('enfermeiro');
    for (const o of m.opcoes) expect(o.detalhe).toBeTruthy();
    const x = cena();
    delete x.v.fatos[`casou_${x.filha.id}`];
    expect(prep('bio_casamento_filho', x.v)).toBeNull();
  });
  it('ajudar a pagar a festa custa e aproxima genro e filha (e não abre de novo)', () => {
    const { v, filha, genro } = cena();
    const antes = { c: conta(v), g: v.vinculos[genro.id].proximidade, f: v.vinculos[filha.id].proximidade };
    resolver('bio_casamento_filho', v, 'ajudar');
    expect(conta(v)).toBeLessThan(antes.c);
    expect(v.vinculos[genro.id].proximidade).toBeGreaterThan(antes.g);
    expect(v.vinculos[filha.id].proximidade).toBeGreaterThanOrEqual(antes.f);
    expect(v.vinculos[genro.id].historia.some(h => h.tipo === 'apoio')).toBe(true);
    expect(prep('bio_casamento_filho', v)).toBeNull();
  });
});

describe('o filho se separou', () => {
  function cena() {
    const v = base(62);
    const filho = comFilho(v, 36, { casa: false }).p;
    const ex = pessoaNova(v, 35, 'feminino');
    const vinEx = vincular(v, ex, { origem: 'familia', proximidade: 40 });
    vinEx.estagio = 'afastado';
    v.fatos[`ex_genro_${ex.id}`] = v.t;
    filho.aperto = { tipo: 'separacao', t: v.t };
    v.fatos[`namoro_${filho.id}`] = v.t - 10 * 12;
    const neta = comNeto(v, filho, 6, ex.id).p;
    return { v, filho, ex, neta };
  }
  it('abre com o ex e os netos; sem separação, não abre', () => {
    const { v, filho, ex, neta } = cena();
    const m = abrir('bio_separacao_filho', v);
    expect(m.texto).toContain(filho.nome);
    expect(m.texto).toContain(ex.nome);
    expect(m.texto).toContain(neta.nome);
    expect(m.opcoes.map(o => o.id)).toContain('ex');
    const x = cena();
    x.filho.aperto = undefined;
    expect(prep('bio_separacao_filho', x.v)).toBeNull();
  });
  it('acolher traz o filho para casa, uma vez só por separação', () => {
    const { v, filho } = cena();
    resolver('bio_separacao_filho', v, 'acolher');
    expect(v.vinculos[filho.id].convivio).toContain('casa');
    expect(prep('bio_separacao_filho', v)).toBeNull();
  });
});

describe('a casa esvaziou', () => {
  function cena(comCasa = false) {
    const v = base(54);
    const par = comParceiro(v, { idade: 55, anos: 28 }).p;
    const a = comFilho(v, 25, { casa: false, outroId: par.id }).p;
    const b = comFilho(v, 22, { casa: false, outroId: par.id, genero: 'feminino' }).p;
    v.fatos[`saiu_de_casa_${a.id}`] = v.t - 36;
    v.fatos[`saiu_de_casa_${b.id}`] = v.t;
    if (comCasa) {
      const casa: Imovel = { id: 'casa1', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa de três quartos', valor: 900000, tCompra: v.t - 20 * 12, municipioId: v.moradia.municipioId, estado: 70, dono: 'casal' };
      v.financas.bens.push(casa);
      v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'casa1', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: casa.tCompra };
    }
    return { v, par, a, b };
  }
  it('abre com a parceria e o último filho que saiu; com filho em casa, não abre', () => {
    const { v, par, b } = cena();
    const m = abrir('bio_ninho_vazio', v);
    expect(m.texto).toContain(par.nome);
    expect(m.texto).toContain(b.nome);
    const x = cena();
    comFilho(x.v, 15, { casa: true, outroId: x.par.id });
    expect(prep('bio_ninho_vazio', x.v)).toBeNull();
  });
  it('lê o estado do casal: com tensão, a terapia aparece; sem, não', () => {
    const calmo = cena();
    calmo.v.vinculos[calmo.par.id].tensao = 0;
    calmo.v.vinculos[calmo.par.id].romance!.envolvimento = 80;
    expect(abrir('bio_ninho_vazio', calmo.v).opcoes.map(o => o.id)).not.toContain('terapia');
    const tenso = cena();
    tenso.v.vinculos[tenso.par.id].tensao = 50;
    const m = abrir('bio_ninho_vazio', tenso.v);
    expect(m.opcoes.map(o => o.id)).toContain('terapia');
    expect(m.texto).toMatch(/curtas/);
  });
  it('a viagem aproxima; trocar a casa grande por uma menor sobra dinheiro', () => {
    const { v, par } = cena(true);
    const env = v.vinculos[par.id].romance!.envolvimento;
    v.vinculos[par.id].romance!.envolvimento = 50;
    resolver('bio_ninho_vazio', v, 'viagem');
    expect(v.vinculos[par.id].romance!.envolvimento).toBeGreaterThan(50);
    void env;
    const y = cena(true);
    const antes = conta(y.v);
    const m = abrir('bio_ninho_vazio', y.v);
    expect(m.opcoes.find(o => o.id === 'menor')?.detalhe).toMatch(/sobram/);
    resolver('bio_ninho_vazio', y.v, 'menor');
    expect(y.v.moradia.modeloId).toBe('apto_2q');
    expect(conta(y.v)).toBeGreaterThan(antes);
    expect(y.v.financas.bens.some(b => b.id === 'casa1')).toBe(false);
  });
});

describe('o filho adulto olha para trás', () => {
  it('as palavras saem do que foi registrado: brigas da adolescência viram cobrança', () => {
    const v = base(60);
    const f = comFilho(v, 30, { casa: false }).p;
    const vin = v.vinculos[f.id];
    vin.presenca = 45; vin.habitos = { atrito_adolescencia: 4 };
    const m = abrir('bio_filho_lembra', v);
    expect(m.texto).toContain(f.nome);
    expect(m.texto).toMatch(/brigou muito/);
    expect(m.opcoes.map(o => o.id)).toContain('desculpas');
    expect(m.opcoes.map(o => o.id)).not.toContain('agradecer');
    vin.tensao = 40;
    resolver('bio_filho_lembra', v, 'desculpas');
    expect(v.vinculos[f.id].tensao).toBeLessThan(40);
    expect(prep('bio_filho_lembra', v)).toBeNull();
  });
  it('presença e a faculdade paga viram gratidão, com a lembrança real', () => {
    const v = base(60);
    const f = comFilho(v, 30, { casa: false, genero: 'feminino' }).p;
    const vin = v.vinculos[f.id];
    vin.presenca = 70; vin.habitos = {};
    vin.historia.push({ t: v.t - 120, texto: 'Você pagou a faculdade de Direito.', tipo: 'apoio', peso: 2 });
    const m = abrir('bio_filho_lembra', v);
    expect(m.texto).toMatch(/pagou a faculdade de Direito/);
    expect(m.opcoes.map(o => o.id)).toContain('agradecer');
  });
  it('sem ocasião (nem trinta anos, nem filho recém-nascido), não abre', () => {
    const v = base(62);
    const f = comFilho(v, 33, { casa: false }).p;
    v.vinculos[f.id].presenca = 40;
    expect(prep('bio_filho_lembra', v)).toBeNull();
  });
});

describe('o primeiro neto e os netos crescidos', () => {
  function cena() {
    const v = base(56, 'masculino');
    const filha = comFilho(v, 30, { casa: false, genero: 'feminino' }).p;
    const neto = comNeto(v, filha, 0).p;
    v.fatos['virou_avo'] = v.t;
    return { v, filha, neto };
  }
  it('abre com o neto e a filha; sem virar avô, não abre', () => {
    const { v, filha, neto } = cena();
    const m = abrir('bio_primeiro_neto', v);
    expect(m.titulo).toBe(neto.nome);
    expect(m.texto).toContain(filha.nome);
    expect(m.texto).toMatch(/avô/);
    const x = cena();
    delete x.v.fatos['virou_avo'];
    expect(prep('bio_primeiro_neto', x.v)).toBeNull();
  });
  it('ajudar com dinheiro sai da conta e aproxima quem é pai do neto', () => {
    const { v, filha } = cena();
    const antes = { c: conta(v), p: v.vinculos[filha.id].proximidade };
    resolver('bio_primeiro_neto', v, 'dinheiro');
    expect(conta(v)).toBeLessThan(antes.c);
    expect(v.vinculos[filha.id].proximidade).toBeGreaterThan(antes.p);
  });
  it('o neto de quinze anos abre uma vez; aos catorze, não', () => {
    const v = base(66);
    const filho = comFilho(v, 40, { casa: false }).p;
    const n = comNeto(v, filho, 15).p;
    const m = abrir('bio_neto_adolescente', v);
    expect(m.texto).toContain(n.nome);
    expect(m.texto).toContain(filho.nome);
    resolver('bio_neto_adolescente', v, 'deixar');
    expect(prep('bio_neto_adolescente', v)).toBeNull();
    const w = base(66);
    comNeto(w, comFilho(w, 40, { casa: false }).p, 14);
    expect(prep('bio_neto_adolescente', w)).toBeNull();
  });
});

/* =========================================================== O casal */

describe('bodas: pelo tempo do casal, com a história real', () => {
  it('25 anos abre (com filhos e crises); 24, não; depois de festejar, não repete', () => {
    const v = base(52);
    const par = comParceiro(v, { idade: 53, anos: 25 }).p;
    const f = comFilho(v, 20, { casa: false, outroId: par.id }).p;
    v.vinculos[par.id].historia.push({ t: v.t - 60, texto: 'Um tempo difícil: o dinheiro curto.', tipo: 'conflito', peso: 1 });
    const m = abrir('bio_bodas', v);
    expect(m.titulo).toBe('Bodas de prata');
    expect(m.texto).toContain(par.nome);
    expect(m.texto).toContain(f.nome);
    expect(m.texto).toMatch(/uma crise/);
    const env = (v.vinculos[par.id].romance!.envolvimento = 50);
    resolver('bio_bodas', v, 'votos');
    expect(v.vinculos[par.id].romance!.envolvimento).toBeGreaterThan(env);
    expect(prep('bio_bodas', v)).toBeNull();
    const w = base(52);
    comParceiro(w, { idade: 53, anos: 24 });
    expect(prep('bio_bodas', w)).toBeNull();
  });
});

/* ========================================================= Pais e irmãos */

describe('os pais envelhecem', () => {
  function cena() {
    const v = base(52);
    const mae = comParente(v, 'mae', 80, 'feminino').p;
    mae.saude = 38;
    const irmao = comParente(v, 'irmao', 50, 'masculino', 60).p;
    return { v, mae, irmao };
  }
  it('abre com a mãe e os irmãos pelo nome; com saúde boa, não abre', () => {
    const { v, mae, irmao } = cena();
    const m = abrir('bio_pais_envelhecem', v);
    expect(m.texto).toContain(mae.nome);
    expect(m.texto).toContain(irmao.nome);
    expect(m.opcoes.find(o => o.id === 'dividir')!.texto).toContain(irmao.nome);
    const x = cena();
    x.mae.saude = 80;
    expect(prep('bio_pais_envelhecem', x.v)).toBeNull();
  });
  it('dividir com um irmão próximo aproxima; a saúde de quem é cuidado melhora', () => {
    const { v, mae, irmao } = cena();
    const antes = v.vinculos[irmao.id].proximidade;
    resolver('bio_pais_envelhecem', v, 'dividir');
    expect(v.vinculos[irmao.id].proximidade).toBeGreaterThan(antes);
    expect(mae.saude).toBeGreaterThan(38);
    expect(v.pessoas[mae.id].saude).toBeGreaterThan(38);
  });
  it('a aposentadoria dos pais aparece em qualquer idade do jogador', () => {
    const v = base(50);
    const mae = comParente(v, 'mae', 64, 'feminino', 70).p;
    mae.ocupacao = 'professora'; mae.renda = 4000;
    let w = v;
    const n0 = v.biografia.length;
    for (let k = 0; k < 10 && !w.biografia.slice(n0).some(e => /se aposentou/.test(e.texto)); k++) w = transacao(w, (x, r) => processarFamiliaDeOrigem(x, r)).vida;
    const linha = w.biografia.slice(n0).find(e => /se aposentou/.test(e.texto));
    expect(linha?.texto, JSON.stringify(w.biografia.slice(-3).map(e => e.texto))).toMatch(/Sua mãe se aposentou/);
    expect(linha!.idade).toBeGreaterThanOrEqual(40);
  });
});

describe('os irmãos depois dos pais', () => {
  function cena() {
    const v = base(58);
    // Os pais da vida sorteada também já se foram (o cenário é "depois dos pais").
    for (const w of Object.values(v.vinculos)) if (w.parentesco === 'mae' || w.parentesco === 'pai') { const q = v.pessoas[w.pessoaId]; if (q) { q.vivo = false; q.tMorte = Math.min(q.tMorte ?? v.t, v.t - 36); } }
    v.ocorrencias = v.ocorrencias.filter(o => o.id !== 'bio_irmaos_depois');
    const pai = comParente(v, 'pai', 85, 'masculino').p;
    pai.vivo = false; pai.tMorte = v.t - 24;
    const irma = comParente(v, 'irmao', 55, 'feminino', 40).p;
    v.vinculos[irma.id].tensao = 45;
    return { v, pai, irma };
  }
  it('abre com o irmão e quem se foi; com um dos pais vivo, não abre', () => {
    const { v, pai, irma } = cena();
    const m = abrir('bio_irmaos_depois', v);
    expect(m.texto).toContain(pai.nome);
    expect(m.texto).toContain(irma.nome);
    const x = cena();
    comParente(x.v, 'mae', 80, 'feminino');
    expect(prep('bio_irmaos_depois', x.v)).toBeNull();
  });
  it('ir até o irmão diminui a tensão', () => {
    const { v, irma } = cena();
    resolver('bio_irmaos_depois', v, 'visitar');
    expect(v.vinculos[irma.id].tensao).toBeLessThan(45);
  });
  it('a separação de um irmão vira algo a fazer', () => {
    const v = base(45);
    const irmao = comParente(v, 'irmao', 43, 'masculino', 55).p;
    irmao.aperto = { tipo: 'separacao', t: v.t };
    const m = abrir('bio_irmao_separou', v);
    expect(m.texto).toContain(irmao.nome);
    const antes = v.vinculos[irmao.id].proximidade;
    resolver('bio_irmao_separou', v, 'receber');
    expect(v.vinculos[irmao.id].proximidade).toBeGreaterThan(antes);
    const w = base(45);
    comParente(w, 'irmao', 43, 'masculino', 55);
    expect(prep('bio_irmao_separou', w)).toBeNull();
  });
});

/* ============================================================ Amizades */

describe('amizade de décadas', () => {
  function cena(anos: number) {
    const v = base(42);
    const a = pessoaNova(v, 42, 'feminino');
    const vin = vincular(v, a, { origem: 'escola', proximidade: 70, estagio: 'amigo_proximo' });
    vin.tInicio = v.t - anos * 12;
    vin.ambiente = 'escola:estadual-1:medio';
    vin.historia.push({ t: v.t - 20 * 12, texto: 'Foi madrinha do seu casamento.', tipo: 'ritual', peso: 3 });
    return { v, a };
  }
  it('25 anos abre com a origem real e o marco mais forte; 20, não', () => {
    const { v, a } = cena(25);
    const m = abrir('bio_amizade_decadas', v);
    expect(m.texto).toContain(a.nome);
    expect(m.texto).toContain('no ensino médio');
    expect(m.texto).toMatch(/madrinha/);
    expect(prep('bio_amizade_decadas', cena(20).v)).toBeNull();
  });
  it('o reencontro aproxima e não repete', () => {
    const { v, a } = cena(25);
    const antes = v.vinculos[a.id].proximidade;
    resolver('bio_amizade_decadas', v, 'reencontro');
    expect(v.vinculos[a.id].proximidade).toBeGreaterThan(antes);
    expect(prep('bio_amizade_decadas', v)).toBeNull();
  });
  it('o amigo que se mudou há cinco anos', () => {
    const v = base(50);
    const a = pessoaNova(v, 50, 'masculino');
    const vin = vincular(v, a, { origem: 'trabalho', proximidade: 35, estagio: 'amigo' });
    vin.tInicio = v.t - 20 * 12;
    a.municipioId = 'natal-rn';
    vin.historia.push({ t: v.t - 62, texto: 'Mudou-se para Natal.', tipo: 'distancia', peso: 1 });
    const m = abrir('bio_amigo_longe', v);
    expect(m.texto).toContain(a.nome);
    expect(m.texto).toContain('Natal');
    resolver('bio_amigo_longe', v, 'visitar');
    expect(v.vinculos[a.id].proximidade).toBeGreaterThan(35);
    a.municipioId = v.moradia.municipioId;
    expect(prep('bio_amigo_longe', v)).toBeNull();
  });
});

/* ======================================================= Planos e sonhos */

describe('o plano que ficou no papel e o sonho para trás', () => {
  function cena() {
    const v = base(45);
    v.educacao.concluidos = [];
    v.fatos['plano_faculdade'] = v.t - 27 * 12;
    delete v.fatos['plano_estudar'];
    const f = comFilho(v, 16, { casa: true, genero: 'feminino' }).p;
    return { v, f };
  }
  it('abre com a idade do plano e o nome do filho; se estudou depois, não abre', () => {
    const { v, f } = cena();
    const m = abrir('bio_plano_no_papel', v);
    expect(m.texto).toMatch(/Aos 18, você decidiu fazer faculdade/);
    expect(m.texto).toContain(f.nome);
    const x = cena();
    x.v.educacao.concluidos.push({ cursoId: 'administracao', nome: 'Administração', nivel: 'superior', area: 'negocios', tFim: x.v.t - 12, instituicao: 'x' });
    expect(prep('bio_plano_no_papel', x.v)).toBeNull();
  });
  it('passar o plano adiante é conversa que pesa na escolha do filho', () => {
    const { v, f } = cena();
    resolver('bio_plano_no_papel', v, 'passar');
    expect(v.fatos[`fil_conversou_${f.id}`]).toBe(v.t);
    expect(v.fatos['plano_faculdade']).toBeUndefined();
  });
  it('o sonho que ficou para trás abre aos 48 pelo que foi marcado; aos 44, não', () => {
    const v = base(48);
    v.caminhos.marcas.push({ t: v.t - 30 * 12, tipo: 'abandono', texto: 'Largou a banda de rock.', peso: 2, dominio: 'musica' });
    const m = abrir('bio_sonho_para_tras', v);
    expect(m.texto).toContain('Largou a banda de rock');
    expect(m.texto).toContain('aos 18');
    expect(prep('bio_sonho_para_tras', base(44))).toBeNull();
  });
});

/* ======================================================= Trabalho e casa */

describe('carreira, aposentadoria, negócio', () => {
  function comEmprego(v: Vida, meses: number) {
    v.trabalho.atual = { ocupacaoId: 'atendente', empregador: 'uma loja do centro', contrato: 'clt', salario: 2600, tInicio: v.t - meses, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral' };
    v.trabalho.experiencia = { comercio: meses };
  }
  it('vinte anos na trilha abre uma vez; dezenove, não', () => {
    const v = base(45);
    comEmprego(v, 245);
    const m = abrir('bio_marco_carreira', v);
    expect(m.titulo).toMatch(/20 anos de comércio/);
    expect(m.texto).toContain('uma loja do centro');
    resolver('bio_marco_carreira', v, 'formar');
    expect((v.trabalho.atual!.clima ?? 50)).toBeGreaterThan(50);
    expect(prep('bio_marco_carreira', v)).toBeNull();
    const w = base(45);
    comEmprego(w, 230);
    expect(prep('bio_marco_carreira', w)).toBeNull();
  });
  it('a aposentadoria no horizonte: as contas reais do INSS', () => {
    const v = base(58);
    comEmprego(v, 200);
    v.trabalho.contribuicao = 30 * 12;
    const m = abrir('bio_aposentadoria_perto', v);
    expect(m.texto).toMatch(/Faltam 4 anos/);
    expect(resolver('bio_aposentadoria_perto', v, 'simular')).toMatch(/R\$/);
    const w = base(50);
    comEmprego(w, 200);
    expect(prep('bio_aposentadoria_perto', w)).toBeNull();
  });
  it('sucessão: o negócio de dez anos passa para o filho', () => {
    let v = base(60);
    const f = comFilho(v, 32, { casa: false, genero: 'feminino' }).p;
    v = transacao(v, (x, r) => {
      const t = NEGOCIOS.find(k => k.id === 'salao')!;
      for (const tr of t.trilhas) x.trabalho.experiencia[tr] = 200;
      const n = abrirNegocio(x, r, 'salao', { modo: 'guardado', dedicacao: 'integral' });
      n.estado = 'firme'; n.tInicio = x.t - 12 * 12;
    }).vida;
    const nome = v.caminhos.negocio!.nome;
    const m = abrir('bio_sucessao_negocio', v);
    expect(m.texto).toContain(nome);
    expect(m.texto).toContain(f.nome);
    resolver('bio_sucessao_negocio', v, 'passar');
    expect(v.caminhos.negocio!.estado).toBe('fechado');
    expect(v.pessoas[f.id].ocupacao).toContain(nome);
    expect(v.pessoas[f.id].renda).toBeGreaterThan(0);
    expect(prep('bio_sucessao_negocio', v)).toBeNull();
  });
});

describe('retomar uma atividade; a casa da família; o curso largado', () => {
  it('a música parada há dez anos volta para a semana', () => {
    const v = base(62);
    v.caminhos.frentes.musica = { interesse: 30, meses: 120, habilidade: 40, tInicio: v.t - 40 * 12, tUltimo: v.t - 10 * 12, retomadas: 0, auge: 58 };
    v.rotinas = [];
    v.trabalho.aposentadoria = { t: v.t - 24, beneficio: 2000 };
    const m = abrir('bio_retomar', v);
    expect(m.texto).toMatch(/10 anos/);
    resolver('bio_retomar', v, 'retomar');
    expect(v.rotinas.some(r => r.id === 'musica')).toBe(true);
    const w = base(62);
    w.caminhos.frentes = {};
    expect(prep('bio_retomar', w)).toBeNull();
  });
  it('a casa herdada, fechada: alugar dá renda', () => {
    const v = base(55);
    v.financas.bens.push({ id: 'h1', tipo: 'imovel', modeloId: 'casa_2q', nome: 'casa da família', valor: 250000, tCompra: v.t - 24, municipioId: v.moradia.municipioId, estado: 45, herdado: true, dono: 'eu', historia: [{ t: v.t - 24, texto: 'Herdada de Joana.' }] });
    const m = abrir('bio_casa_da_familia', v);
    expect(m.texto).toContain('Herdada de Joana');
    resolver('bio_casa_da_familia', v, 'alugar');
    expect((v.financas.bens.find(b => b.id === 'h1') as Imovel).alugadoPor).toBeGreaterThan(0);
    expect(prep('bio_casa_da_familia', v)).toBeNull();
  });
  it('o filho largou a faculdade que você pagava', () => {
    const v = base(50);
    const f = comFilho(v, 21, { casa: true }).p;
    f.vida!.trajetoria.push({ t: v.t, texto: `${f.nome} largou Direito no 2º ano.`, tipo: 'estudo' });
    v.fatos[`largou_paga_${f.id}`] = v.t;
    v.fatos[`largou_mensalidade_${f.id}`] = 900;
    const m = abrir('bio_filho_largou', v);
    expect(m.texto).toContain('largou Direito');
    expect(m.texto).toContain('R$ 900');
    resolver('bio_filho_largou', v, 'cobrar');
    expect(v.vinculos[f.id].tensao).toBeGreaterThan(0);
    expect(prep('bio_filho_largou', v)).toBeNull();
  });
});

describe('acontecimentos: o que o tempo marca nos outros', () => {
  it('o filho aos quarenta: a vida dele pelo que foi registrado', () => {
    const v = base(66);
    const f = comFilho(v, 40, { casa: false, genero: 'feminino' }).p;
    f.ocupacao = 'contadora'; f.formacao = 'Ciências Contábeis';
    const n = comNeto(v, f, 8).p;
    const a = conteudoPorId('bio_filho_quarenta') as Acontecimento;
    const ctx = preparar(a, v, criarRng(1))!;
    expect(ctx).not.toBeNull();
    aplicarAcontecimento(v, a, ctx);
    const linha = v.biografia[v.biografia.length - 1];
    expect(linha.texto).toContain(f.nome);
    expect(linha.texto).toContain('contadora');
    expect(linha.texto).toContain(n.nome);
    expect(linha.relevancia).toBe('biografia');
    expect(preparar(a, v, criarRng(1))).toBeNull();
  });
  it('o neto de dezoito anos e os vinte anos na mesma casa', () => {
    const v = base(70);
    const f = comFilho(v, 44, { casa: false }).p;
    const n = comNeto(v, f, 18).p;
    n.estudo = { curso: 'Engenharia Civil', paga: 'publica', tFim: v.t + 48, nivel: 'superior' };
    const a = conteudoPorId('bio_neto_maior') as Acontecimento;
    aplicarAcontecimento(v, a, preparar(a, v, criarRng(1))!);
    expect(v.biografia[v.biografia.length - 1].texto).toMatch(new RegExp(`${n.nome} fez dezoito anos e entrou em Engenharia Civil`));
    const w = base(55);
    const k = comFilho(w, 26, { casa: false }).p;
    w.fatos[`saiu_de_casa_${k.id}`] = w.t - 24;
    w.financas.bens.push({ id: 'c20', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa de três quartos', valor: 500000, tCompra: w.t - 20 * 12, municipioId: w.moradia.municipioId, estado: 70, dono: 'eu' });
    w.moradia = { tipo: 'propria', municipioId: w.moradia.municipioId, imovelId: 'c20', modeloId: 'casa_3q', aluguel: 0, padrao: 4, tInicio: w.t - 20 * 12 };
    const c = conteudoPorId('bio_casa_vinte_anos') as Acontecimento;
    aplicarAcontecimento(w, c, preparar(c, w, criarRng(1))!);
    expect(w.biografia[w.biografia.length - 1].texto).toContain(k.nome);
  });
});

/* ============================================================ Estatística */

describe('a meia-idade fica mais biográfica', () => {
  /**
   * 30 vidas com família (parceria e dois filhos pequenos aos 28), vividas até
   * os 70 respondendo sempre a primeira opção livre. Antes do FIX #7, nas
   * mesmas sementes: 80,9% dos anos 40–69 com linha de biografia, 1,58
   * linhas/ano, 0,61 de família/ano (medido com este mesmo código).
   */
  it('mais anos com biografia, mais linhas de família por ano', () => {
    const m = medir(Array.from({ length: 30 }, (_, k) => 7000 + k * 13));
    expect(m.anosComBio / m.anos).toBeGreaterThan(0.84);
    expect(m.familiaPorAno).toBeGreaterThan(0.72);
    expect(m.bioPorAno).toBeGreaterThan(1.7);
  }, 240000);
});
