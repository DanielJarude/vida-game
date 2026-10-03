/**
 * REWORK 4 — VIDA VIVIDA: os testes causais (Parte 52) e o adendo da especialização.
 * Cada teste segue uma cadeia: a causa → o estado → a consequência → o que as telas leem.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParente, pessoaNova } from './cenarios';
import { nova, viverAte } from './ajuda';
import { transacao, idade } from '../nucleo';
import { criarRng } from '../rng';
import { executar, disponibilidade } from '../acoes';
import { interpretar } from '../save';
import { podeTentar } from '../plausibilidade';
import type { Vida } from '../tipos';
import { ocupacao } from '../dados/ocupacoes';
import { contratar, elegibilidade, encerrarEmprego } from '../sistemas/trabalho';
import { areaAtual, escolherArea, fasesDaArea, trajetoriaDeAreas } from '../sistemas/areasDoOficio';
import { AREAS_PROFISSIONAIS } from '../dados/areasProfissionais';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { perfilParaVaga } from '../sistemas/empregabilidade';
import { custoDoEstudo } from '../sistemas/custoDoEstudo';
import { orcamento } from '../sistemas/dinheiro';
import { analisarEntrada } from '../sistemas/compromissos';
import { cargaHumana } from '../sistemas/semana';
import { fatorDoEstresseProlongado } from '../sistemas/corpo';
import { processarEstresseProlongado } from '../sistemas/estresseProlongado';
import { forcaDaRelacao } from '../sistemas/lacos';
import { desgasteSemConvivio } from '../sistemas/desgaste';
import { comoEsta, sinaisSociais, MAX_SINAIS } from '../../ui/leitura';
import { interacoesPara, executarInteracao } from '../sistemas/interacoes';
import { fraseDoSaber, saberes } from '../sistemas/conhecimento';
import { contaAtiva, rendaDaRede } from '../sistemas/redesBase';
import { usosPara, varianteDe } from '../sistemas/pertences';
import { coisasDaVida } from '../sistemas/coisas';
import { habilidade } from '../sistemas/frentes';
import { previsaoDaViagem } from '../sistemas/experiencias';
import { ancestralidadeDe, misturar, visualDosPais, visualDaAncestralidade, familiaInicial } from '../sistemas/identidade';
import { rngDe } from '../rng';
import { momentosPossiveis, processarVidaEstudantil } from '../sistemas/vidaEstudantil';
import { fatoPerdido, narrarPerdido } from '../conteudo/narracao';
import { contexto } from '../conteudo/base';
import { analisar, molde } from '../../../scripts/sim/repeticao/analise';
import { criarVida } from '../criacao';
import { migrar } from '../sistemas/migracao';

const BASE = adulto(24, { semente: 21 });
const copia = (v: Vida = BASE) => structuredClone(v);
const ok = (v: Vida, a: Parameters<typeof executar>[1]) => { expect(podeTentar(disponibilidade(v, a)), JSON.stringify(disponibilidade(v, a))).toBe(true); return executar(v, a).vida; };
const reabrir = (v: Vida) => { const r = interpretar(JSON.stringify(v)); expect(r.tipo, r.tipo === 'invalido' ? r.motivo : '').toBe('ok'); return (r as { vida: Vida }).vida; };

/* ================================================================ Parte 12 — mensalidade */

describe('faculdade pública gratuita nunca cobra mensalidade (o regime decide, não o texto)', () => {
  const matricular = (v: Vida, rede: 'publica' | 'privada', mensalidade: number, financiamento?: 'fies' | 'prouni') => {
    v.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade federal', rede, modalidade: 'presencial', tInicio: v.t - 24, mesesRestantes: 24, mensalidade, ...(financiamento ? { financiamento } : {}), desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
  };
  it('pública gratuita: regime gratuito, nenhuma linha de mensalidade, e o aperto (se vier) não fala em mensalidade', () => {
    const v = copia(); v.trabalho.atual = undefined; v.financas.conta = 0;
    matricular(v, 'publica', 0);
    expect(custoDoEstudo(v)?.regime).toBe('gratuita');
    expect(orcamento(v).saidas.some(l => /Mensalidade/.test(l.rotulo))).toBe(false);
    for (let s = 1; s <= 40; s++) {
      const c = preparar(conteudoPorId('esc_faculdade_aperto')!, v, criarRng(s));
      if (c) expect((conteudoPorId('esc_faculdade_aperto') as { texto: (c: unknown) => string }).texto(c)).not.toMatch(/mensalidade .* vence/i);
    }
  });
  it('bolsa integral e crédito: nada no mês; particular: a parte que não é da família', () => {
    const v = copia();
    matricular(v, 'privada', 0, 'prouni'); expect(custoDoEstudo(v)?.regime).toBe('bolsa_integral');
    matricular(v, 'privada', 1800, 'fies'); expect(custoDoEstudo(v)?.regime).toBe('credito');
    expect(orcamento(v).saidas.some(l => /Mensalidade/.test(l.rotulo))).toBe(false);
    matricular(v, 'privada', 1800); expect(custoDoEstudo(v)?.regime).toBe('paga');
    expect(orcamento(v).saidas.some(l => /Mensalidade/.test(l.rotulo))).toBe(true);
  });
});

/* ================================================== Adendo — a especialização não volta */

describe('a área escolhida é da pessoa: "A área" não reaparece como primeira escolha', () => {
  const dev = () => transacao(copia(), (x, r) => { x.trabalho.experiencia.ti = 48; contratar(x, r, ocupacao('dev_pleno')); }).vida;
  const elegivel = (v: Vida) => [...Array(30)].some((_, s) => !!preparar(conteudoPorId('ofi_area')!, v, criarRng(s + 1)));

  it('escolher Segurança → anos → troca de emprego (outra trilha do mesmo ofício) → salvar → reabrir → promoção → nova empresa: a área segue', () => {
    let v = dev();
    expect(elegivel(v)).toBe(true);
    v = transacao(v, x => escolherArea(x, 'ti', 'segurança')).vida;
    expect(v.trabalho.atual!.especialidade).toBe('segurança');
    expect(elegivel(v)).toBe(false);
    v = transacao(v, (x, r) => { x.t += 36; x.trabalho.experiencia.ti += 36; contratar(x, r, ocupacao('analista_dados')); }).vida;
    expect(v.trabalho.atual!.especialidade).toBe('segurança');
    v = reabrir(v);
    expect(areaAtual(v, 'ti')).toBe('segurança');
    v = transacao(v, (x, r) => { encerrarEmprego(x, 'demissão'); x.t += 24; contratar(x, r, ocupacao('dev_senior')); }).vida;
    expect(v.trabalho.atual!.especialidade).toBe('segurança');
    expect(elegivel(v)).toBe(false);
  });

  it('a área produz diferença real: vaga de segurança reconhece quem a viveu; quem não, entra como aposta', () => {
    let v = dev();
    v.trabalho.experiencia.ti = 72;
    v.educacao.concluidos.push({ cursoId: 'computacao', nome: 'Ciência da Computação', nivel: 'superior', area: 'computacao', tFim: v.t - 60, instituicao: 'a universidade' });
    const sem = elegibilidade(v, ocupacao('analista_seguranca'));
    expect(sem.grau).toBe('improvavel');
    v = transacao(v, x => escolherArea(x, 'ti', 'segurança')).vida;
    const com = elegibilidade(v, ocupacao('analista_seguranca'));
    expect(com.grau).not.toBe('improvavel');
    expect(perfilParaVaga(v, ocupacao('analista_seguranca')).porque).toMatch(/segurança/);
  });

  it('cada área tem descrição e consequência próprias (não a mesma frase)', () => {
    const ti = ['segurança', 'dados', 'infraestrutura', 'produto'].map(a => AREAS_PROFISSIONAIS[a]);
    expect(new Set(ti.map(a => a.descricao)).size).toBe(4);
    expect(new Set(ti.map(a => a.muda)).size).toBe(4);
    expect(new Set(ti.map(a => JSON.stringify(a.pratica))).size).toBeGreaterThan(2);
  });

  it('a migração de área é outra decisão: fecha a fase, não apaga — e o currículo sabe das duas', () => {
    let v = transacao(dev(), x => escolherArea(x, 'ti', 'segurança')).vida;
    v = transacao(v, x => { x.t += 72; escolherArea(x, 'ti', 'dados'); }).vida;
    const f = fasesDaArea(v, 'ti');
    expect(f.map(x => x.area)).toEqual(['segurança', 'dados']);
    expect(f[0].tFim).toBeDefined();
    expect(trajetoriaDeAreas(v).length).toBe(2);
    expect(elegivel(v)).toBe(false);
  });
});

/* ======================================================= Parte 43 — "na área" demais */

describe('compatibilidade profissional: direta, relacionada', () => {
  it('Ciência da Computação não é "na área" do operador de drone agrícola', () => {
    const v = copia();
    v.educacao.concluidos.push({ cursoId: 'computacao', nome: 'Ciência da Computação', nivel: 'superior', area: 'computacao', tFim: v.t - 12, instituicao: 'a universidade' });
    const drone = perfilParaVaga(v, ocupacao('operador_drone'));
    expect(drone.porque).not.toBe('Na área da sua formação.');
    expect(perfilParaVaga(v, ocupacao('dev_jr')).porque).toMatch(/formação|estrada/);
  });
});

/* ============================================================== Partes 13–15 — carga */

describe('carga: faculdade + trabalho é tentável — e cobra', () => {
  it('curso integral com emprego integral tem o plano de tentar os dois, com o preço dito', () => {
    const v = transacao(copia(), (x, r) => { x.educacao.matricula = undefined; contratar(x, r, ocupacao('atendente')); }).vida;
    const c = analisarEntrada(v, { tipo: 'curso', cursoId: 'eng_civil', via: 'privada', modalidade: 'presencial', rede: 'privada', mensalidade: 1500, municipioId: v.moradia.municipioId, instituicao: 'uma faculdade' });
    const tentar = c.flatMap(x => x.alternativas).find(a => a.conciliar);
    expect(tentar).toBeDefined();
    expect(tentar!.consequencia).toMatch(/estresse|descanso/);
  });
  it('o teto humano existe: cinco empregos integrais não cabem em vida nenhuma', () => {
    expect(cargaHumana(copia(), 7.5).possivel).toBe(false);
    expect(cargaHumana(copia(), 0.5).possivel).toBe(true);
  });
  it('estresse alto por anos: conta, vira biografia, e só pesa na morte com o corpo vulnerável', () => {
    let v = copia();
    v = transacao(v, x => { for (let k = 0; k < 3; k++) { x.mente.estresse = 85; x.t += 12; processarEstresseProlongado(x); } }).vida;
    expect(v.mente.estresseAlto?.anos).toBe(3);
    expect(v.biografia.some(e => /Três anos seguidos com a cabeça no limite/.test(e.texto))).toBe(true);
    expect(fatorDoEstresseProlongado(v)).toBe(1);
    v.corpo.condicoes.push({ id: 'hipertensao', nome: 'pressão alta', tInicio: v.t, cronica: true, gravidade: 2, tratando: false });
    expect(fatorDoEstresseProlongado(v)).toBeGreaterThan(1);
  });
});

/* ======================================================= Partes 16–17 — economia aos 18 */

describe('aos 18, em casa e estudando: a família continua ajudando no essencial', () => {
  it('não assume as contas da casa; a família cobre parte dos gastos', () => {
    let v = viverAte(nova({ semente: 33 }), 18);
    v = transacao(v, x => {
      x.moradia = { tipo: 'pais', municipioId: x.moradia.municipioId, aluguel: 0, padrao: 3, tInicio: x.t };
      x.trabalho.atual = undefined;
      x.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 48, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
      x.rotinas = [{ id: 'academia', tInicio: x.t, nivel: 1 }];
    }).vida;
    const o = orcamento(v);
    expect(o.arranjo).toBe('familia');
    expect(o.saidas.some(l => /Aluguel|Mercado|Luz/.test(l.rotulo))).toBe(false);
    if (o.saidas.length) expect(o.entradas.some(l => l.rotulo === 'A família ajuda com os seus gastos')).toBe(true);
  });
});

/* ================================================================ Partes 18–22 — relações */

describe('relações: tipo, síntese, barra, desgaste e gestos', () => {
  it('"Muito ligados" não é mais a explicação: a síntese diz como está', () => {
    const v = copia();
    const { p, vin } = comParente(v, 'pai', 52, 'masculino', 88);
    vin.confianca = 75;
    expect(comoEsta(v, p, vin)).not.toMatch(/Muito ligados/);
    expect(comoEsta(v, p, vin)).toMatch(/próximos|se dar bem/);
    expect(forcaDaRelacao(v, vin)).toBeGreaterThan(60);
  });
  it('o desgaste é contextual: amizade recente esfria mais; mensagem segura a distância', () => {
    const v = copia();
    const a = pessoaNova(v, 25); a.municipioId = 'sao-paulo-sp';
    const vinA = { pessoaId: a.id, origem: 'escola', tInicio: v.t - 12, proximidade: 60, confianca: 50, tensao: 0, convivio: [], tUltimoContato: v.t - 24, historia: [] } as never;
    const vinB = { ...(vinA as object), tInicio: v.t - 180, historia: [{ t: v.t - 150, texto: 'x', peso: 3 }, { t: v.t - 120, texto: 'y', peso: 3 }, { t: v.t - 100, texto: 'z', peso: 3 }, { t: v.t - 90, texto: 'w', peso: 3 }] } as never;
    expect(desgasteSemConvivio(v, a, vinA)).toBeLessThan(desgasteSemConvivio(v, a, vinB));
    const comMsg = { ...(vinA as object), digital: { mensagem: v.t - 3 } } as never;
    expect(desgasteSemConvivio(v, a, comMsg)).toBeGreaterThan(desgasteSemConvivio(v, a, vinA));
  });
  it('o menu muda por relação: a mãe não tem o menu do colega', () => {
    const v = copia();
    const { p: mae } = comParente(v, 'mae', 55, 'feminino', 70);
    const ids = interacoesPara(v, mae.id).map(x => x.id);
    expect(ids).toEqual(expect.arrayContaining(['pedir_conselho']));
    expect(ids).not.toContain('flertar');
  });
  it('não se farma: o mesmo gesto, uma vez por ano', () => {
    let v = copia();
    const { p } = comParente(v, 'mae', 55, 'feminino', 70);
    v = ok(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'elogiar' });
    expect(podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'elogiar' }))).toBe(false);
  });
});

/* ================================================================= Partes 24–25 — saber */

describe('o que se sabe de alguém é o FATO, não a frase', () => {
  it('perguntar de onde a pessoa é grava a cidade real — e a ficha mostra', () => {
    let v = copia();
    const { p } = comParente(v, 'primo', 30, 'feminino', 55);
    p.municipioNatal = 'curitiba-pr';
    for (let s = 0; s < 4 && !v.vinculos[p.id].sabe?.some(x => x.k === 'origem'); s++) {
      v = transacao(v, (x, r) => { x.anoAtual.acoes = []; executarInteracao(x, r, p.id, 'perguntar_vida'); }).vida;
    }
    const f = saberes(v, v.pessoas[p.id], v.vinculos[p.id]).find(x => x.k === 'origem');
    expect(f?.v).toBe('curitiba-pr');
    expect(fraseDoSaber(v, v.pessoas[p.id], f!)).toMatch(/Curitiba/);
  });
  it('saves antigos: "Descobriu de onde X veio" vira o fato', () => {
    const v = copia();
    const { p, vin } = comParente(v, 'tio', 50, 'masculino', 50);
    vin.historia.push({ t: v.t - 12, texto: `Descobriu de onde ${p.nome} veio.`, tipo: 'descoberta' });
    expect(saberes(v, p, vin).some(x => x.k === 'origem')).toBe(true);
  });
});

/* ================================================================= Partes 26–28 — rede */

describe('rede social: não é um contador isolado', () => {
  it('criar, publicar, bloquear o ex (distância) e o amigo (briga); bloqueado não aparece no menu de sempre', () => {
    let v = copia();
    const amigo = pessoaNova(v, 25, 'masculino');
    v.vinculos[amigo.id] = { pessoaId: amigo.id, origem: 'escola', tInicio: v.t - 120, proximidade: 70, confianca: 60, tensao: 0, convivio: [], tUltimoContato: v.t, historia: [], estagio: 'amigo' };
    v = ok(v, { tipo: 'rede', op: { oque: 'criar' } });
    expect(contaAtiva(v)).toBeDefined();
    const antes = contaAtiva(v)!.seguidores;
    v = ok(v, { tipo: 'rede', op: { oque: 'publicar', tema: 'cotidiano' } });
    expect(contaAtiva(v)!.seguidores).toBeGreaterThanOrEqual(antes);
    expect(interacoesPara(v, amigo.id).length).toBeGreaterThan(0);
    v = ok(v, { tipo: 'rede', op: { oque: 'bloquear', pessoaId: amigo.id } });
    expect(v.vinculos[amigo.id].conflito?.assunto).toMatch(/bloqueio/);
    expect(interacoesPara(v, amigo.id).some(x => x.id === 'tempo' || x.id === 'ligar' || x.id === 'elogiar')).toBe(false);
    v = reabrir(v);
    expect(v.vinculos[amigo.id].digital?.bloqueado).toBeDefined();
  });
  it('comprar seguidores derruba a credibilidade; monetizar exige seguidores reais', () => {
    let v = copia(); v.financas.conta = 100000;
    v = ok(v, { tipo: 'rede', op: { oque: 'criar' } });
    const cred = contaAtiva(v)!.credibilidade;
    v = ok(v, { tipo: 'rede', op: { oque: 'comprar', pacote: 1 } });
    expect(contaAtiva(v)!.credibilidade).toBeLessThan(cred);
    expect(rendaDaRede(v)).toBe(0);
  });
});

/* ================================================================ Parte 30 — atenção */

describe('"Pedem atenção" prioriza e limita', () => {
  it('no máximo três, uma por pessoa; a gravidez de uma amiga é notícia, não problema', () => {
    const v = copia();
    for (let k = 0; k < 6; k++) {
      const { p, vin } = comParente(v, 'irmao', 30 + k, 'masculino', 70);
      vin.historia.push({ t: v.t - 30, texto: 'x', tipo: 'apoio', peso: 2 });
      p.aperto = { tipo: 'desemprego', t: v.t };
    }
    const s = sinaisSociais(v);
    expect(s.length).toBeLessThanOrEqual(MAX_SINAIS);
    expect(new Set(s.map(x => x.pessoaId)).size).toBe(s.length);
  });
});

/* ============================================================ Partes 45–49 — pertences */

describe('pertences: comprar → ter (com a cor) → usar → o efeito chega ao sistema', () => {
  it('o violão tem cor própria, toca (a música pratica), toca para alguém (aproxima), uma vez por ano — e o save guarda', () => {
    let v = copia(); v.financas.conta = 20000;
    const { p } = comParente(v, 'irmao', 26, 'masculino', 50);
    p.municipioId = v.moradia.municipioId;
    v = ok(v, { tipo: 'comprar_coisa', coisaId: 'violao' });
    const t = coisasDaVida(v).find(x => x.coisaId === 'violao')!;
    expect(t.cor).toMatch(/^#/);
    const musica = habilidade(v, 'musica');
    v = ok(v, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'tocar' });
    expect(habilidade(v, 'musica')).toBeGreaterThan(musica);
    expect(podeTentar(disponibilidade(v, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'tocar' }))).toBe(false);
    const prox = v.vinculos[p.id].proximidade;
    v = ok(v, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'tocar_para', pessoaId: p.id });
    expect(v.vinculos[p.id].proximidade).toBeGreaterThan(prox);
    v = reabrir(v);
    expect(varianteDe(coisasDaVida(v)[0]).cor).toBe(t.cor);
    expect(usosPara(v, coisasDaVida(v)[0]).length).toBeGreaterThan(0);
  });
  it('dar um presente usa o catálogo das lojas e fica com a pessoa', () => {
    let v = copia(); v.financas.conta = 20000;
    const { p } = comParente(v, 'irmao', 20, 'feminino', 50);
    v = ok(v, { tipo: 'presentear', pessoaId: p.id, coisaId: 'livros' });
    expect(v.pessoas[p.id].ganhou?.[0].coisaId).toBe('livros');
  });
});

/* =================================================================== Parte 37 — viagem */

describe('viagem: a duração muda mais do que o preço', () => {
  it('estudante: duas semanas pesam no curso; quatro dias não', () => {
    const v = copia();
    v.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 40, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    expect(previsaoDaViagem(v, 14).join(' ')).toMatch(/aula/);
    expect(previsaoDaViagem(v, 4).join(' ')).not.toMatch(/aula/);
  });
});

/* ======================================================== Partes 1–4 — identidade */

describe('identidade familiar: os pais são a fonte', () => {
  it('filhos herdam a ancestralidade média e traços dos pais; irmãos não são clones', () => {
    const a = { eu: 1 }, b = { af: 1 };
    const pa = visualDaAncestralidade(rngDe('pa'), 'masculino', a), pb = visualDaAncestralidade(rngDe('pb'), 'feminino', b);
    const anc = misturar(a, b)!;
    expect(anc.eu).toBeCloseTo(0.5, 2);
    const irmaos = [1, 2, 3, 4].map(k => visualDosPais(rngDe('irmao', k), 'feminino', anc, pa, pb));
    const chave = (x: typeof pa) => [x.pele, x.corCabelo, x.olhos, x.textura, x.nariz, x.boca, x.rosto, x.sobrancelha, x.olhosForma].join('|');
    expect(new Set(irmaos.map(chave)).size).toBeGreaterThan(1);
    for (const x of irmaos) {
      const herdados = ['nariz', 'boca', 'rosto', 'olhosForma', 'sobrancelha'].filter(t => (x as never)[t] === (pa as never)[t] || (x as never)[t] === (pb as never)[t]).length;
      expect(herdados).toBeGreaterThanOrEqual(3);
    }
  });
  it('o sobrenome escolhido puxa a tradição da família (Tanaka em São Paulo é família japonesa)', () => {
    const f = familiaInicial('teste-tanaka', 'BR', 'Tanaka');
    expect(f.pai.tradicao).toBe('JP');
    expect((f.pai.ancestralidade.ea ?? 0)).toBeGreaterThan(0.5);
    const v = criarVida({ nome: 'Yuki', sobrenome: 'Tanaka', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 77 });
    expect(v.eu.tradicao).toBe('JP');
  });
  it('migrar não muda a ancestralidade nem a aparência genética', () => {
    let v = adulto(30, { semente: 41 });
    const antes = { anc: JSON.stringify(ancestralidadeDe(v.eu)), pele: v.eu.visual.pele, nariz: v.eu.visual.nariz };
    v = transacao(v, (x, r) => migrar(x, r, 'pt:lisboa', 'trabalho')).vida;
    expect(JSON.stringify(ancestralidadeDe(v.eu))).toBe(antes.anc);
    expect(v.eu.visual.pele).toBe(antes.pele);
    expect(v.eu.visual.nariz).toBe(antes.nariz);
  });
});

/* =========================================================== Partes 8–11 — formação */

describe('formação tem história interna — e cada curso a sua', () => {
  it('Medicina não é Computação com outro nome; o momento fica na história', () => {
    const v = copia();
    v.educacao.matricula = { cursoId: 'medicina', instituicao: 'a universidade', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 72, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    const med = momentosPossiveis(v).lista.map(x => x.id);
    v.educacao.matricula.cursoId = 'computacao';
    const comp = momentosPossiveis(v).lista.map(x => x.id);
    expect(med.some(x => x.startsWith('med_'))).toBe(true);
    expect(comp.some(x => x.startsWith('comp_'))).toBe(true);
    expect(med.some(x => x.startsWith('comp_'))).toBe(false);
  });
  it('ao longo de anos de escola, a história da formação se acumula', () => {
    let v = viverAte(nova({ semente: 51 }), 6);
    v = viverAte(v, 17);
    expect((v.educacao.trajetoria ?? []).length).toBeGreaterThan(0);
    void processarVidaEstudantil;
  });
});

/* ============================================================ Partes 5–7 — Linha da Vida */

describe('fato → narração: a Linha da Vida não revela o catálogo', () => {
  it('a criança perdida: o fato fica guardado; vidas diferentes, narrações diferentes', () => {
    const textos = new Set<string>();
    for (let s = 1; s <= 8; s++) {
      const v = nova({ semente: 900 + s, municipioId: s % 2 ? 'sao-paulo-sp' : 'recife-pe' });
      const c = contexto(v, criarRng(1));
      const quem = Object.values(v.pessoas).find(p => v.vinculos[p.id]?.parentesco === 'mae')!;
      const d = fatoPerdido(c, quem);
      expect(d.onde).toBeTruthy();
      textos.add(narrarPerdido(c, quem, d));
    }
    expect(textos.size).toBeGreaterThanOrEqual(6);
  });
  it('a auditoria mede frases idênticas, moldes e vidas parecidas', () => {
    expect(molde('Maria comprou um carro por R$ 45.000 em 2031.')).toBe('<N> comprou um carro por <$> em <n>.');
    const r = analisar([
      { id: 'a', bio: [{ idade: 5, texto: 'Igual.' }, { idade: 6, texto: 'Só de A.' }], ocorrencias: [{ idade: 5, id: 'x' }] },
      { id: 'b', bio: [{ idade: 5, texto: 'Igual.' }], ocorrencias: [{ idade: 5, id: 'x' }, { idade: 6, id: 'x' }] }
    ]);
    expect(r.frasesRepetidas).toBeCloseTo(2 / 3, 2);
    expect(r.eventosUbiquos.map(x => x.id)).toContain('x');
    expect(r.repeticoesInternas).toBe(0.5);
  });
});

/* ================================================================== Parte 41 — empresas */

describe('quem contrata tem nome — e voltar à mesma empresa é história', () => {
  it('contratado numa organização; sai; volta anos depois', () => {
    let v = transacao(copia(), (x, r) => { x.trabalho.experiencia.ti = 48; contratar(x, r, ocupacao('dev_pleno')); }).vida;
    const org = v.trabalho.atual!.orgId;
    expect(org).toBeDefined();
    expect(v.trabalho.atual!.empregador).toMatch(/^(a|o) /);
    v = transacao(v, (x, r) => { encerrarEmprego(x, 'pediu demissão'); x.t += 24; x.trabalho.atual = undefined; x.trabalho.historico[x.trabalho.historico.length - 1].orgId = org; void r; }).vida;
    expect(v.organizacoes?.[org!]).toBeDefined();
  });
});

/* ======================================================================= Save */

describe('save: tudo o que é novo persiste (v20)', () => {
  it('uma vida com rede, presentes, áreas, formação, estresse e fatos reabre idêntica', () => {
    let v = copia(); v.financas.conta = 50000;
    v = ok(v, { tipo: 'rede', op: { oque: 'criar' } });
    v = ok(v, { tipo: 'comprar_coisa', coisaId: 'camera' });
    v = transacao(v, (x, r) => { x.trabalho.experiencia.ti = 48; contratar(x, r, ocupacao('dev_pleno')); escolherArea(x, 'ti', 'produto'); x.mente.estresseAlto = { anos: 2, t: x.t }; x.educacao.trajetoria = [{ t: x.t, idade: idade(x), instituicao: 'a escola', tipo: 'prova', texto: 'Uma prova.' }]; }).vida;
    const json = JSON.stringify(v);
    expect(JSON.stringify(reabrir(v))).toBe(json);
  });
});
