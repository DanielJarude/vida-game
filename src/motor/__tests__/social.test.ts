/**
 * ATT 1 — Vida social. Testes de classe de problema, não de caso:
 * nenhum teste depende de um nome, uma idade exata ou uma semente mágica.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nova, responder, viver, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar } from '../acoes';
import { idade, moraCom, parceiro, transacao, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { criarRng } from '../rng';
import { podeTentar } from '../plausibilidade';
import { iniciarCaso, podeTerRomance, regraDeIdade } from '../sistemas/romance';
import { interacoesPara } from '../sistemas/interacoes';
import { estadoCivil, importancia, papelDe } from '../sistemas/vinculos';
import { nivelDaPerda, registrarMortes } from '../sistemas/luto';
import { garantirVida, processarDescendentes, processarPartosDaFamilia } from '../sistemas/filhos';
import { processarConcepcao } from '../sistemas/familia';
import { recalcularConvivio } from '../sistemas/social';
import { abrirDecisao, conteudoPorId, preparar } from '../conteudo/motor';
import { interpretar, ler, salvar, type Armazenamento, VERSAO_SAVE } from '../save';
import type { Genero, Pessoa, Vida, Vinculo } from '../tipos';

/* ---------------------------------------------------------------- Cenários */

/** Uma vida adulta, sem romance nenhum (o cenário acrescenta o que precisar). */
function adulto(i: number, o: { semente?: number; genero?: Genero } = {}): Vida {
  // Um adulto VIVO na idade pedida: se a vida da semente terminou antes, tenta a próxima.
  let s = o.semente ?? 11;
  let v = viverAte(nova({ semente: s, genero: o.genero ?? 'feminino' }), i);
  while (v.morte) v = viverAte(nova({ semente: ++s, genero: o.genero ?? 'feminino' }), i);
  v.momento = null;
  for (const vin of Object.values(v.vinculos)) if (vin.romance) vin.romance = undefined;
  // Sai da casa dos pais, para os cenários adultos serem de quem já tem casa.
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') {
    v.moradia = { tipo: 'aluguel', municipioId: v.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: v.t };
    for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  }
  return v;
}

function pessoaNova(v: Vida, idadeP: number, genero: Genero = 'masculino', extra: Partial<Pessoa> = {}): Pessoa {
  const p = criarPessoa(v, criarRng(v.seq + 7), { idade: idadeP, genero, municipioId: v.moradia.municipioId });
  Object.assign(p, extra);
  return p;
}

function comParceiro(v: Vida, o: { idade?: number; estagio?: 'namoro' | 'morando_junto' | 'casamento'; anos?: number; genero?: Genero } = {}): { p: Pessoa; vin: Vinculo } {
  const p = pessoaNova(v, o.idade ?? idade(v), o.genero ?? 'masculino', { atracao: 'mulheres', querFilhos: 'sim' });
  const vin = vincular(v, p, { origem: 'romance', proximidade: 80, convivio: o.estagio && o.estagio !== 'namoro' ? ['casa'] : [] });
  const anos = o.anos ?? 5;
  vin.tInicio = v.t - anos * 12;
  vin.romance = { estagio: o.estagio ?? 'casamento', tEstagio: v.t - anos * 12, tInicio: v.t - anos * 12, envolvimento: 80, planoFilhos: 'evitando' };
  if ((o.estagio ?? 'casamento') === 'casamento') vin.historia.push({ t: v.t - (anos - 1) * 12, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 });
  return { p, vin };
}

function comFilho(v: Vida, i: number, o: { casa?: boolean; outroId?: string; genero?: Genero } = {}): { p: Pessoa; vin: Vinculo } {
  const p = pessoaNova(v, i, o.genero ?? 'masculino', { sobrenome: v.eu.sobrenome, genitores: ['eu', ...(o.outroId ? [o.outroId] : [])] });
  const vin = vincular(v, p, { parentesco: 'filho', origem: 'familia', proximidade: 70, convivio: o.casa ?? i < 18 ? ['casa'] : [] });
  vin.tInicio = p.tNasc;
  if (i >= 4 && i < 18) p.ocupacao = 'estudante';
  garantirVida(p);
  return { p, vin };
}

const ids = (v: Vida, id: string) => interacoesPara(v, id).map(x => x.id);

/* ------------------------------------------------------------ 1–2 Idade */

describe('romance e idade', () => {
  it('17 e 18 anos: namoro adolescente não é bloqueado por "adulto e menor"', () => {
    expect(podeTentar(regraDeIdade(17, 18))).toBe(true);
    expect(podeTentar(regraDeIdade(16, 19))).toBe(true);
    expect(podeTentar(regraDeIdade(15, 17))).toBe(true);
    const v = viverAte(nova({ semente: 5 }), 17);
    v.momento = null;
    v.eu.atracao = 'homens';
    const p = pessoaNova(v, 18, 'masculino', { atracao: 'mulheres' });
    const vin = vincular(v, p, { origem: 'escola', proximidade: 50, convivio: ['escola'] });
    expect(podeTerRomance(v, p, vin)).toBe(true);
    expect(podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'convidar' }))).toBe(true);
  });

  it('diferenças inadequadas continuam protegidas', () => {
    for (const [a, b] of [[13, 14], [15, 18], [16, 21], [17, 22], [16, 25], [17, 40], [14, 18]]) expect(podeTentar(regraDeIdade(a, b))).toBe(false);
    for (const [a, b] of [[18, 45], [60, 72], [30, 30]]) expect(podeTentar(regraDeIdade(a, b))).toBe(true);
    const v = viverAte(nova({ semente: 6 }), 16);
    v.momento = null;
    v.eu.atracao = 'homens';
    const p = pessoaNova(v, 27, 'masculino', { atracao: 'mulheres' });
    vincular(v, p, { origem: 'rotina', proximidade: 60, convivio: ['rotina'] });
    expect(podeTentar(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'convidar' }))).toBe(false);
  });

  it('namoro adolescente não vira casa, casamento nem gravidez com adulto', () => {
    const v = viverAte(nova({ semente: 5 }), 17);
    v.momento = null;
    const p = pessoaNova(v, 18, 'masculino', { atracao: 'mulheres' });
    const vin = vincular(v, p, { origem: 'escola', proximidade: 70, convivio: ['escola'] });
    vin.romance = { estagio: 'namoro', tEstagio: v.t - 14, tInicio: v.t - 20, envolvimento: 90, planoFilhos: 'tentando' };
    expect(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'morar_junto' }).grau).toBe('ilegal');
    expect(ids(v, p.id)).not.toContain('planejar_filhos');
    expect(ids(v, p.id)).not.toContain('intimidade');
    for (let k = 0; k < 30; k++) {
      const { vida } = transacao(v, (x, r) => processarConcepcao(x, r));
      expect(vida.processos.some(pr => pr.tipo === 'gestacao')).toBe(false);
      v.rng = vida.rng;
    }
  });
});

/* ------------------------------------------------------- 3–4, 15 Ações */

describe('ações nascem da relação e da idade', () => {
  it('bebê não recebe ações de adulto', () => {
    const v = adulto(30);
    const { p } = comFilho(v, 1);
    const acoes = ids(v, p.id);
    expect(acoes.length).toBeGreaterThan(0);
    for (const a of acoes) expect(['cuidar', 'brincar']).toContain(a);
    for (const proibida of ['dinheiro', 'conversar', 'tempo', 'aconselhar', 'convidar']) expect(acoes).not.toContain(proibida);
  });

  it('filho pequeno recebe ações de pai e mãe (brincar, ler)', () => {
    const v = adulto(32);
    const { p } = comFilho(v, 4);
    const acoes = ids(v, p.id);
    expect(acoes).toContain('brincar');
    expect(acoes).toContain('ler');
    expect(acoes).not.toContain('dinheiro');
    expect(acoes).not.toContain('limite');
  });

  it('filho em idade escolar, adolescente e adulto: ações diferentes', () => {
    const v = adulto(45);
    const escola = comFilho(v, 9).p;
    const adolescente = comFilho(v, 15).p;
    v.vinculos[adolescente.id].tensao = 50;
    const adultoF = comFilho(v, 28, { casa: false }).p;
    adultoF.aperto = { tipo: 'desemprego', t: v.t };
    adultoF.renda = 0;
    expect(ids(v, escola.id)).toEqual(expect.arrayContaining(['estudos', 'brincar']));
    expect(ids(v, adolescente.id)).toEqual(expect.arrayContaining(['conversar', 'limite']));
    expect(ids(v, adolescente.id)).not.toContain('brincar');
    const a = ids(v, adultoF.id);
    expect(a).toEqual(expect.arrayContaining(['apoiar', 'dinheiro', 'aconselhar']));
    expect(a).not.toContain('ler');
    expect(a).not.toContain('brincar');
  });

  it('parceria tem ações de casal; colega e criança do jogador não', () => {
    const v = adulto(35);
    const par = comParceiro(v).p;
    const pa = ids(v, par.id);
    expect(pa).toEqual(expect.arrayContaining(['sair_juntos', 'carinho', 'planejar_filhos', 'terminar']));
    expect(pa).not.toContain('tempo');
    const colega = pessoaNova(v, 40);
    const vc = vincular(v, colega, { origem: 'trabalho', proximidade: 30, convivio: ['trabalho'], estagio: 'colega' });
    void vc;
    const c = ids(v, colega.id);
    expect(c).not.toContain('brincar');
    expect(c).not.toContain('ler');
    expect(c).not.toContain('dinheiro');
    const crianca = viverAte(nova({ semente: 8 }), 8);
    crianca.momento = null;
    const mae = vinculosVivos(crianca).find(x => x.vin.parentesco === 'mae')!;
    const m = ids(crianca, mae.p.id);
    expect(m).not.toContain('dinheiro');
    expect(m).not.toContain('convidar');
    expect(m).not.toContain('cuidar');
  });

  it('planejar filhos pertence à parceria, não ao jogador sozinho', () => {
    const v = adulto(30);
    const par = comParceiro(v);
    const amigo = pessoaNova(v, 30);
    vincular(v, amigo, { origem: 'trabalho', proximidade: 70, estagio: 'amigo' });
    expect(ids(v, par.p.id)).toContain('planejar_filhos');
    expect(ids(v, amigo.id)).not.toContain('planejar_filhos');
    const depois = executar(v, { tipo: 'pessoa', pessoaId: par.p.id, interacao: 'planejar_filhos' }).vida;
    expect(depois.vinculos[par.p.id].romance!.planoFilhos).toBe('tentando');
  });

  it('pessoa morta não recebe ações', () => {
    const v = adulto(40);
    const amigo = pessoaNova(v, 40);
    vincular(v, amigo, { origem: 'trabalho', proximidade: 70, estagio: 'amigo' });
    amigo.vivo = false;
    expect(interacoesPara(v, amigo.id)).toEqual([]);
    expect(disponibilidade(v, { tipo: 'pessoa', pessoaId: amigo.id, interacao: 'tempo' }).grau).toBe('impossivel');
    expect(executar(v, { tipo: 'pessoa', pessoaId: amigo.id, interacao: 'tempo' }).vida).toBe(v);
  });

  it('quem mudou de cidade não é convivência diária: vira visita e mensagem', () => {
    const v = adulto(30);
    const amigo = pessoaNova(v, 30);
    const vin = vincular(v, amigo, { origem: 'trabalho', proximidade: 70, estagio: 'amigo', convivio: ['trabalho'] });
    vin.ambiente = Object.values(v.vinculos).find(x => x.ambiente?.startsWith('trabalho'))?.ambiente ?? 'trabalho:x:0';
    amigo.municipioId = v.moradia.municipioId === 'sao-paulo-sp' ? 'recife-pe' : 'sao-paulo-sp';
    recalcularConvivio(v);
    expect(v.vinculos[amigo.id].convivio).toEqual([]);
    const a = ids(v, amigo.id);
    expect(a).not.toContain('tempo');
    expect(a).toEqual(expect.arrayContaining(['visitar', 'ligar']));
    // O cônjuge em outra cidade também deixa de "morar junto".
    const par = comParceiro(v, { estagio: 'casamento' }).p;
    par.municipioId = amigo.municipioId;
    recalcularConvivio(v);
    expect(v.vinculos[par.id].convivio).not.toContain('casa');
  });
});

/* --------------------------------------------------------- 5–8 Filhos */

describe('filhos têm vida própria (sem rodar o motor do jogador)', () => {
  it('filho adulto evolui: trabalho, trajetória, notícias', () => {
    let evoluiu = 0, comunicou = 0;
    for (let s = 1; s <= 8; s++) {
      let v = adulto(45, { semente: s * 3 });
      const f = comFilho(v, 18, { casa: false }).p;
      f.ocupacao = undefined;
      f.vida!.escolaridade = 'medio';
      const antes = v.biografia.length;
      v = viver(v, 12);
      const depois = v.pessoas[f.id];
      if (!depois.vivo) continue;
      if ((depois.vida?.trajetoria.length ?? 0) >= 2 && depois.ocupacao) evoluiu++;
      if (v.biografia.slice(antes).some(e => e.pessoas?.includes(f.id) && e.relevancia !== 'tecnico')) comunicou++;
    }
    expect(evoluiu).toBeGreaterThanOrEqual(6);
    expect(comunicou).toBeGreaterThanOrEqual(6);
  }, 60000);

  it('carreira não fica congelada sem razão', () => {
    let observados = 0;
    for (let s = 1; s <= 10; s++) {
      let v = adulto(55, { semente: s * 5 });
      const f = comFilho(v, 26, { casa: false }).p;
      f.formacao = 'Ciência da Computação';
      f.vida!.escolaridade = 'superior';
      f.vida!.experiencia = 12;
      f.ocupacaoId = 'dev_jr';
      f.ocupacao = 'desenvolvedor júnior';
      f.renda = 4000;
      f.vida!.tCargo = v.t;
      v = viver(v, 9);
      const d = v.pessoas[f.id];
      if (!d.vivo || v.morte) continue; // a vida do jogador acabou antes: não há o que observar
      observados++;
      const mudou = d.ocupacaoId !== 'dev_jr';
      const explicado = d.vida!.trajetoria.some(t => ['trabalho', 'promocao', 'desemprego', 'estudo'].includes(t.tipo) && t.t > v.t - 9 * 12);
      expect(mudou || explicado).toBe(true);
    }
    expect(observados).toBeGreaterThanOrEqual(6);
  }, 60000);

  it('filha grávida: anúncio antes, parto depois, neto na árvore, virar avó é marco', () => {
    const v = adulto(55);
    const filha = comFilho(v, 30, { casa: false, genero: 'feminino' }).p;
    const genro = pessoaNova(v, 31, 'masculino');
    filha.parceiroId = genro.id;
    genro.parceiroId = filha.id;
    v.fatos[`casou_${filha.id}`] = v.t - 24;
    vincular(v, genro, { parentesco: 'genro', origem: 'familia', proximidade: 40 });
    filha.gestacao = { tParto: v.t + 7, outroId: genro.id, anunciada: true };
    const { vida: agora } = transacao(v, (x, r) => processarPartosDaFamilia(x, r));
    expect(Object.values(agora.vinculos).some(x => x.parentesco === 'neto')).toBe(false); // ainda não nasceu
    let depois = v;
    for (let k = 0; k < 6; k++) {
      const x = structuredClone(v);
      x.rng = 1000 + k;
      x.t += 12;
      const { vida } = transacao(x, (y, r) => processarPartosDaFamilia(y, r));
      if (Object.values(vida.vinculos).some(n => n.parentesco === 'neto')) { depois = vida; break; }
    }
    const neto = Object.values(depois.vinculos).find(x => x.parentesco === 'neto');
    expect(neto).toBeTruthy();
    const pn = depois.pessoas[neto!.pessoaId];
    expect(pn.genitores).toContain(filha.id);
    expect(pn.tNasc).toBe(v.t + 7);
    expect(depois.fatos['virou_avo']).toBeDefined();
    const e = depois.biografia.find(b => b.evento?.tipo === 'virou_avo');
    expect(e?.relevancia).toBe('marco');
    expect(depois.vinculos[filha.id].historia.some(h => /avó/.test(h.texto))).toBe(true);
  });

  it('um filho que cresce com o jogador acumula marcos — não só "nasceu"', () => {
    let v = adulto(26, { semente: 21 });
    const par = comParceiro(v, { estagio: 'casamento', anos: 3 });
    const f = comFilho(v, 0, { outroId: par.p.id }).p;
    f.nome = 'Criança';
    v.vinculos[f.id].historia.push({ t: f.tNasc, texto: 'Nasceu.', tipo: 'inicio', peso: 3 });
    v = viver(v, 30, vv => {
      const a = interacoesPara(vv, f.id).find(x => !['terminar', 'limite'].includes(x.id));
      return vv.pessoas[f.id]?.vivo && a ? [{ tipo: 'pessoa', pessoaId: f.id, interacao: a.id }] : [];
    });
    const h = v.vinculos[f.id].historia;
    expect(h.length).toBeGreaterThanOrEqual(6);
    expect(new Set(h.map(x => x.tipo)).size).toBeGreaterThanOrEqual(3);
  }, 60000);
});

/* ------------------------------------------------------ 11–13 Perdas */

describe('morte e luto', () => {
  function casal30(): { v: Vida; par: Pessoa; primo: Pessoa } {
    const v = adulto(62, { semente: 17 });
    const par = comParceiro(v, { estagio: 'casamento', anos: 34, idade: 63 }).p;
    comFilho(v, 30, { casa: false, outroId: par.id });
    const primo = pessoaNova(v, 60);
    vincular(v, primo, { parentesco: 'primo', origem: 'familia', proximidade: 25 });
    return { v, par, primo };
  }

  it('a morte do cônjuge pesa mais que a de um primo distante', () => {
    const { v, par, primo } = casal30();
    const pc = importancia(v, par, v.vinculos[par.id]);
    const pp = importancia(v, primo, v.vinculos[primo.id]);
    expect(pc).toBeGreaterThan(pp + 30);
    expect(nivelDaPerda(pc)).toBe('interrompe');
    expect(['discreto', 'registro']).toContain(nivelDaPerda(pp));
  });

  it('a morte do cônjuge muda o estado civil, a casa e abre a despedida', () => {
    const { v, par } = casal30();
    const { vida } = transacao(v, (x, r) => registrarMortes(x, r, [{ p: x.pessoas[par.id], vin: x.vinculos[par.id], causa: 'AVC' }], () => {}));
    expect(estadoCivil(vida)).toBe('viuvo');
    expect(vida.vinculos[par.id].romance!.fim).toBe('morte');
    expect(vida.vinculos[par.id].romance!.estagio).not.toBe('ex');
    expect(moraCom(vida).map(p => p.id)).not.toContain(par.id);
    expect(parceiro(vida)).toBeUndefined();
    const linha = vida.biografia.find(e => e.evento?.tipo === 'viuvez');
    expect(linha?.relevancia).toBe('marco');
    expect(linha?.texto).toMatch(/anos juntos/);
    expect(vida.fatos[`despedida:${par.id}`]).toBeDefined();
    const d = conteudoPorId('luto_despedida')!;
    expect(preparar(d, vida, criarRng(1))).not.toBeNull();
    // Os filhos em comum ficam de luto (e "estar junto" aparece para eles).
    const filho = Object.values(vida.pessoas).find(p => p.genitores?.includes(par.id))!;
    expect(filho.aperto?.tipo).toBe('luto');
    expect(interacoesPara(vida, filho.id).map(x => x.id)).toContain('apoiar');
  });

  it('perdas repercutem no humor, e o luto vai passando', () => {
    const { v, par } = casal30();
    const { vida: comPerda } = transacao(v, (x, r) => registrarMortes(x, r, [{ p: x.pessoas[par.id], vin: x.vinculos[par.id], causa: 'AVC' }], () => {}));
    comPerda.fatos = Object.fromEntries(Object.entries(comPerda.fatos).filter(([k]) => !k.startsWith('despedida:')));
    let a = comPerda, b = structuredClone(v);
    const pesos: number[] = [];
    for (let k = 0; k < 4; k++) {
      a = avancarAno(a).vida; if (a.momento) a = responder(a);
      b = avancarAno(b).vida; if (b.momento) b = responder(b);
      pesos.push(a.luto.find(l => l.pessoaId === par.id)?.peso ?? 0);
    }
    expect(comPerda.mente.felicidade).toBeLessThan(v.mente.felicidade);
    expect(pesos[0]).toBeGreaterThan(pesos[3]);
  });

  it('várias perdas pequenas no mesmo ano viram uma linha só', () => {
    const v = adulto(70, { semente: 19 });
    const parentes = [0, 1, 2].map(k => { const p = pessoaNova(v, 75 + k); vincular(v, p, { parentesco: k ? 'primo' : 'tio', origem: 'familia', proximidade: 45 }); return p; });
    const antes = v.biografia.length;
    const { vida } = transacao(v, (x, r) => registrarMortes(x, r, parentes.map(p => ({ p: x.pessoas[p.id], vin: x.vinculos[p.id], causa: 'infarto' })), () => {}));
    const visiveis = vida.biografia.slice(antes).filter(e => e.relevancia === 'marco' || e.relevancia === 'biografia' || e.relevancia === 'cotidiano');
    expect(visiveis.length).toBeLessThanOrEqual(1);
  });
});

/* --------------------------------------------------------- 14 Causa */

describe('relações não mudam sem causa', () => {
  it('amigo que convive e família na mesma cidade não oscilam muito num ano sem nada', () => {
    for (let s = 1; s <= 6; s++) {
      const v = adulto(35, { semente: s * 7 });
      const amigo = pessoaNova(v, 35);
      const vin = vincular(v, amigo, { origem: 'trabalho', proximidade: 60, estagio: 'amigo' });
      vin.tUltimoContato = v.t;
      const antesAmigo = vin.proximidade;
      const mae = vinculosVivos(v).find(x => x.vin.parentesco === 'mae');
      const antesMae = mae?.vin.proximidade;
      const depois = avancarAno(v).vida;
      if (depois.pessoas[amigo.id].vivo) expect(Math.abs(depois.vinculos[amigo.id].proximidade - antesAmigo)).toBeLessThanOrEqual(15);
      if (mae && depois.pessoas[mae.p.id].vivo && antesMae !== undefined) expect(Math.abs(depois.vinculos[mae.p.id].proximidade - antesMae)).toBeLessThanOrEqual(10);
    }
  });

  it('toda crise da parceria que não veio do jogador tem causa registrada', () => {
    let crises = 0;
    for (let s = 1; s <= 6; s++) {
      let v = adulto(30, { semente: s * 13 });
      const par = comParceiro(v, { estagio: 'casamento' }).p;
      for (let k = 0; k < 20 && !v.morte && v.pessoas[par.id].vivo && parceiro(v)?.p.id === par.id; k++) {
        const antes = v.vinculos[par.id].tensao;
        const hist = v.vinculos[par.id].historia.length;
        const bio = v.biografia.length;
        v = avancarAno(v).vida;
        const depois = v.vinculos[par.id].tensao;
        if (depois - antes >= 15) {
          crises++;
          const narrada = v.biografia.slice(bio).some(e => e.pessoas?.includes(par.id)) || v.vinculos[par.id].historia.length > hist;
          expect(narrada).toBe(true);
        }
        if (v.momento) v = responder(v);
      }
    }
    expect(crises).toBeGreaterThan(0);
  }, 60000);
});

/* ------------------------------------------------------- 17 Personalidade */

describe('personalidade', () => {
  it('nada automático (mortes, nascimentos, vida dos filhos, crises) move personalidade', () => {
    let v = adulto(30, { semente: 29 });
    const par = comParceiro(v, { estagio: 'casamento' }).p;
    comFilho(v, 2, { outroId: par.id });
    comFilho(v, 20, { casa: false, outroId: par.id });
    for (let k = 0; k < 40 && !v.morte; k++) {
      const antes = v.personalidade.evidencias.length;
      v = avancarAno(v).vida;
      expect(v.personalidade.evidencias.length).toBe(antes);
      if (v.momento) v = responder(v);
    }
  }, 60000);
});

/* ------------------------------------------------------------ Casos */

describe('infidelidade', () => {
  it('um caso é escondido: a parceria oficial continua a mesma, com um segredo', () => {
    const v = adulto(35, { semente: 31 });
    const par = comParceiro(v).p;
    const outro = pessoaNova(v, 36, 'masculino', { atracao: 'mulheres' });
    const vin = vincular(v, outro, { origem: 'trabalho', proximidade: 55, estagio: 'amigo', convivio: ['trabalho'] });
    iniciarCaso(v, outro, vin);
    expect(parceiro(v)?.p.id).toBe(par.id);
    expect(v.vinculos[par.id].romance!.segredo?.pessoaId).toBe(outro.id);
    expect(papelDe(outro, v.vinculos[outro.id])).toBe('caso');
    expect(ids(v, par.id)).toContain('contar_verdade');
    expect(ids(v, outro.id)).toContain('encerrar_caso');
    expect(v.biografia.some(e => e.evento?.tipo === 'traicao')).toBe(true);
  });

  it('descoberta: a reação do jogador é escolha dele; ficar com o caso encerra a parceria', () => {
    const v = adulto(35, { semente: 33 });
    const par = comParceiro(v).p;
    const outro = pessoaNova(v, 36, 'masculino', { atracao: 'mulheres' });
    const vin = vincular(v, outro, { origem: 'trabalho', proximidade: 55, estagio: 'amigo' });
    iniciarCaso(v, outro, vin);
    v.fatos[`caso_descoberto:${outro.id}`] = v.t;
    const d = conteudoPorId('rom_descoberta')!;
    const ctx = preparar(d, v, criarRng(2));
    expect(ctx).not.toBeNull();
    const { vida } = transacao(v, (x, r) => { if (d.tipo === 'decisao') abrirDecisao(x, d, preparar(d, x, r)!); });
    expect(vida.momento!.opcoes.map(o => o.id)).toEqual(expect.arrayContaining(['perdao', 'negar', 'assumir']));
    const fim = executar(vida, { tipo: 'decidir', opcaoId: 'assumir' }).vida;
    expect(fim.vinculos[par.id].romance!.estagio).toBe('ex');
    expect(fim.vinculos[outro.id].romance!.secreto).toBeFalsy();
    expect(parceiro(fim)?.p.id).toBe(outro.id);
  });
});

/* ---------------------------------------------------------------- Save */

function memoria(): Armazenamento & { dados: Record<string, string> } {
  const dados: Record<string, string> = {};
  return { dados, getItem: k => dados[k] ?? null, setItem: (k, x) => { dados[k] = x; }, removeItem: k => { delete dados[k]; } };
}

describe('save v7', () => {
  it('ida e volta preserva as relações (história, confiança, casos, árvore, luto)', () => {
    let v = adulto(40, { semente: 37 });
    const par = comParceiro(v).p;
    comFilho(v, 8, { outroId: par.id });
    v = viver(v, 5);
    const s = memoria();
    salvar(v, s);
    const r = ler(s);
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida).toEqual(v);
  });

  it('save v6 real (motor anterior) migra sem relações corrompidas', () => {
    for (const nome of ['save-v6-familia.json', 'save-v6-viuvo.json']) {
      const bruto = readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
      const r = interpretar(bruto);
      expect(r.tipo).toBe('ok');
      if (r.tipo !== 'ok') continue;
      const v = r.vida;
      expect(r.migrado).toBe(true);
      expect(v.versao).toBe(VERSAO_SAVE);
      expect(Array.isArray(v.luto)).toBe(true);
      for (const vin of Object.values(v.vinculos)) {
        expect(Number.isFinite(vin.confianca)).toBe(true);
        for (const h of vin.historia) expect(h.tipo).toBeDefined();
      }
      for (const f of Object.values(v.vinculos).filter(x => x.parentesco === 'filho')) expect(v.pessoas[f.pessoaId].genitores).toContain('eu');
      for (const n of Object.values(v.vinculos).filter(x => x.parentesco === 'neto')) {
        const g = v.pessoas[n.pessoaId].genitores ?? [];
        expect(g.length).toBeGreaterThan(0);
        expect(v.vinculos[g[0]]?.parentesco).toBe('filho');
      }
      if (nome.includes('viuvo')) {
        expect(estadoCivil(v)).toBe('viuvo');
        expect(Object.values(v.vinculos).some(x => x.romance?.fim === 'morte')).toBe(true);
      }
      // E a vida continua.
      let seguinte = v;
      for (let k = 0; k < 5 && !seguinte.morte; k++) { seguinte = avancarAno(seguinte).vida; if (seguinte.momento) seguinte = responder(seguinte); }
      expect(seguinte.t).toBeGreaterThan(v.t);
    }
  });

  it('save v7 com árvore quebrada é rejeitado', () => {
    const v = adulto(30);
    const f = comFilho(v, 2).p;
    const bruto = JSON.parse(JSON.stringify(v));
    bruto.pessoas[f.id].genitores = ['eu', 'fantasma'];
    expect(interpretar(JSON.stringify(bruto)).tipo).toBe('invalido');
    const b2 = JSON.parse(JSON.stringify(v));
    b2.vinculos[f.id].confianca = 'muita';
    expect(interpretar(JSON.stringify(b2)).tipo).toBe('invalido');
  });
});

/* ------------------------------------------------------ Descendentes */

describe('gerações', () => {
  it('processar descendentes não cria gente sem árvore nem neto mais velho que o pai', () => {
    let v = adulto(50, { semente: 41 });
    const par = comParceiro(v, { estagio: 'casamento', anos: 25 }).p;
    comFilho(v, 24, { casa: false, outroId: par.id });
    comFilho(v, 21, { casa: false, outroId: par.id, genero: 'feminino' });
    v = viver(v, 25);
    for (const vin of Object.values(v.vinculos)) {
      if (vin.parentesco !== 'neto' && vin.parentesco !== 'bisneto') continue;
      const n = v.pessoas[vin.pessoaId];
      expect(n.genitores?.length).toBeGreaterThan(0);
      const pai = v.pessoas[n.genitores![0]];
      expect(n.tNasc - pai.tNasc).toBeGreaterThanOrEqual(16 * 12);
    }
    void processarDescendentes;
  }, 60000);
});
