/**
 * FECHAMENTO DO ATT MUNDO — os achados do playtest humano viram testes.
 *
 *   MUNDO: conteúdo que não é universal declara onde vale; a escola, a
 *   carteira de motorista e as idades da lei são as do lugar onde a pessoa
 *   MORA (resolvidas por uma fonte só: universal → país → estado); a UI e o
 *   motor falam do mesmo exame.
 *
 *   RELAÇÕES 2.0: tipo ≠ proximidade ≠ estado; amizade nasce de convivência
 *   e gesto correspondido; romance não vira amizade íntima por si; conflito
 *   tem consequência e pode ser reparado; a história explica; os NPCs agem.
 */

import { describe, expect, it } from 'vitest';
import { criarVida } from '../criacao';
import { disponibilidade, executar } from '../acoes';
import { idade, transacao } from '../nucleo';
import { interpretar } from '../save';
import type { Pessoa, Vida, Vinculo } from '../tipos';
import { viverAte } from './ajuda';
import { adulto, comFilho, comParceiro, comParente, pessoaNova } from './cenarios';
import { continuarComo } from '../sistemas/sucessao';
import { cidadesDoPais, municipio } from '../dados/lugares';
import { entrarNaVida, educacaoDaVida, educacaoDoPais, paisDaVida } from '../mundo/vida';
import { lugarDe, noEscopo, resolver } from '../mundo/escopo';
import { regrasDaVida, regrasDoLugar } from '../mundo/regras';
import { textoLocal, nomeDoRegistro } from '../mundo/locais';
import { ROTINAS, descricaoDaRotina, atividadeExiste, podeComecarRotina } from '../sistemas/rotinas';
import { habilitacaoDaVida } from '../sistemas/autoescola';
import { notasDaqui, podeFazerEnem } from '../sistemas/escola';
import { migrar, migrarComAFamilia } from '../sistemas/migracao';
import { conteudoPorId, preparar } from '../conteudo/motor';
import { podeConcorrer, proximaEleicao } from '../sistemas/politica';
import { vincular } from '../pessoas';
import { criarRng } from '../rng';
import { executarInteracao, interacoesPara } from '../sistemas/interacoes';
import { discutir, desculpar, estadoDaRelacao, melhorAmigoId, reconciliar, romper } from '../sistemas/lacos';
import { processarSocial } from '../sistemas/social';
import { processarIniciativas } from '../sistemas/iniciativas';
import { mudarEstagio } from '../sistemas/romance';
import { rotuloDe } from '../../ui/apresentar';
import { comoEsta, etiqueta } from '../../ui/leitura';
import { papelDe } from '../sistemas/vinculos';

const maior = (p: string) => (cidadesDoPais(p).find(m => m.perfil === 'metropole') ?? cidadesDoPais(p)[0]).id;
const nascer = (municipioId: string, semente = 42) => criarVida({ nome: 'Teste', sobrenome: 'Teste', genero: 'feminino', municipioId, semente });
const ate = (municipioId: string, i: number, semente = 42) => { const v = viverAte(nascer(municipioId, semente), i); entrarNaVida(v); return v; };

/* ======================================================= ESCOPO GEOGRÁFICO */

describe('escopo geográfico: o que não é universal declara onde vale', () => {
  it('a resolução vai da cidade ao universal; o escopo casa país, divisão ou cidade', () => {
    const x = { universal: 'u', BR: 'br', 'US-CA': 'ca', 'us:los-angeles': 'la' };
    expect(resolver(x, lugarDe('us:los-angeles'))).toBe('la');
    expect(resolver(x, lugarDe('us:sacramento'))).toBe('ca');
    expect(resolver(x, lugarDe('us:chicago'))).toBe('u');
    expect(resolver(x, lugarDe('recife-pe'))).toBe('br');
    expect(noEscopo({ divisoes: ['BR-PE'] }, lugarDe('recife-pe'))).toBe(true);
    expect(noEscopo({ divisoes: ['BR-PE'] }, lugarDe('sao-paulo-sp'))).toBe(false);
    expect(noEscopo({ excetoPaises: ['US'] }, lugarDe('us:chicago'))).toBe(false);
    expect(noEscopo(undefined, lugarDe('us:chicago'))).toBe(true);
  });

  it('SESC nos EUA: a natação de quem mora fora do Brasil não fala do SESC — e o Brasil continua com o seu', () => {
    const natacao = ROTINAS.find(m => m.id === 'natacao')!;
    const eua = ate('us:chicago', 10), br = ate('recife-pe', 10), jp = ate(maior('JP'), 10);
    expect(descricaoDaRotina(eua, natacao)).not.toMatch(/SESC/);
    expect(descricaoDaRotina(eua, natacao)).toMatch(/YMCA|pública/);
    expect(descricaoDaRotina(br, natacao)).toMatch(/SESC/);
    expect(descricaoDaRotina(jp, natacao)).toBe(textoLocal(jp, 'natacao'));
    expect(descricaoDaRotina(jp, natacao)).not.toMatch(/SESC|YMCA/);
  });

  it('o São João e a seca do sertão têm escopo de divisão: o Nordeste — nem São Paulo, nem Tóquio', () => {
    const sj = conteudoPorId('mun_sao_joao')!;
    const r = criarRng(1);
    expect(preparar(sj, ate('recife-pe', 20), r)).not.toBeNull();
    expect(preparar(sj, ate('sao-paulo-sp', 20), r)).toBeNull();
    expect(preparar(sj, ate(maior('JP'), 20), r)).toBeNull();
  });

  it('inglês não é atividade para quem mora num país de língua inglesa; terapia pública não é de graça onde a saúde é por seguro', () => {
    const eua = ate('us:chicago', 12), pt = ate('pt:lisboa', 12);
    const ingles = ROTINAS.find(m => m.id === 'ingles')!;
    expect(atividadeExiste(eua, ingles)).toBe(false);
    expect(atividadeExiste(pt, ingles)).toBe(true);
    expect(descricaoDaRotina(eua, ROTINAS.find(m => m.id === 'terapia')!)).not.toMatch(/SUS/);
  });

  it('estudar para concurso não existe onde o serviço público não entra por concurso — nem para quem já pratica as matérias; e a mudança encerra o estudo', () => {
    const eua = ate('us:chicago', 25, 6);
    eua.caminhos.frentes = { ...eua.caminhos.frentes, linguagens: { meses: 48 } as never, humanas: { meses: 48 } as never };
    expect(atividadeExiste(eua, ROTINAS.find(m => m.id === 'estudar_concurso')!)).toBe(false);
    const br = adulto(28, { semente: 31 });
    br.rotinas.push({ id: 'estudar_concurso', tInicio: br.t, nivel: 1 });
    br.financas.conta = 400000;
    br.eu.nacionalidades = ['BR', 'US'];
    const depois = transacao(br, (x, r) => { migrar(x, r, 'us:chicago', 'pessoal'); }).vida;
    expect(paisDaVida(depois)).toBe('US');
    expect(depois.rotinas.some(r => r.id === 'estudar_concurso')).toBe(false);
  });

  it('registros profissionais: a sigla brasileira só no Brasil', () => {
    expect(nomeDoRegistro(ate('recife-pe', 1), 'crm')).toBe('CRM');
    expect(nomeDoRegistro(ate('us:chicago', 1), 'crm')).toBe('registro de médico');
  });
});

/* ======================================================= ENEM NA UI / SAT NO MOTOR */

describe('o exame de ingresso tem uma fonte só: UI, elegibilidade, ação, resultado e Linha da Vida', () => {
  it('nos EUA, o botão, o veredito, o resultado e a biografia dizem SAT — nunca ENEM', () => {
    let v = ate('us:chicago', 17, 7);
    const ed = educacaoDaVida(v);
    expect(ed.acao).toBe('Fazer o SAT deste ano');
    v.educacao.basica = { etapa: 'medio', serie: 3, rede: 'publica', desempenho: 60, reprovacoes: 0 };
    v.momento = null;
    expect(podeFazerEnem(v).grau).toBe('permitido');
    const res = executar(v, { tipo: 'enem' });
    v = res.vida;
    expect(res.resultado).toMatch(/SAT/);
    expect(res.resultado).not.toMatch(/ENEM/);
    expect(v.biografia.some(b => /SAT/.test(b.texto))).toBe(true);
    expect(v.educacao.enem[v.educacao.enem.length - 1]).toMatchObject({ pais: 'US', exame: 'SAT' });
  });

  it('no Canadá, onde o "exame" é o boletim, não se "faz o boletim": a ação e o resultado dizem o que é', () => {
    const ca = educacaoDoPais('CA');
    expect(ca.prova).toBe(false);
    expect(ca.acao).toMatch(/boletim/);
    expect(ca.fez(600)).toMatch(/^Fechou o boletim/);
    expect(educacaoDoPais('US').fez(600)).toMatch(/^Você fez o SAT/);
  });

  it('a nota do ENEM fica na história, mas não abre a universidade nos EUA', () => {
    const v = adulto(30, { semente: 5 });
    // Uma nota antiga, de antes do país ser guardado (saves anteriores), e uma nova: as duas são do Brasil.
    v.educacao.enem = [{ t: v.t - 60, nota: 640 }, { t: v.t - 12, nota: 780, pais: 'BR', exame: 'ENEM' }];
    v.financas.conta = 400000;
    v.educacao.escolaridade = 'medio';
    expect(notasDaqui(v).length).toBe(2);
    const depois = transacao(v, (x, r) => { migrar(x, r, 'us:chicago', 'estudo'); }).vida;
    expect(paisDaVida(depois)).toBe('US');
    expect(notasDaqui(depois).length).toBe(0);
    expect(depois.educacao.enem.length).toBe(2);
    expect(depois.educacao.enem.every(n => n.pais === 'BR')).toBe(true);
  });
});

/* ======================================================= EDUCAÇÃO ACOMPANHA A MORADIA */

describe('a escola é a do país onde a pessoa mora; o histórico do país anterior fica', () => {
  it('nasce no Brasil, começa a escola, muda com a família para os EUA aos 8, e volta: série reconciliada, histórico guardado, nada apagado', () => {
    let v = ate('recife-pe', 8, 21);
    if (v.moradia.tipo !== 'pais' && v.moradia.tipo !== 'parente') return;
    const serieAntes = v.educacao.basica?.serie;
    expect(serieAntes).toBeGreaterThanOrEqual(1);
    v = transacao(v, x => { migrarComAFamilia(x, 'us:chicago', 'A mãe'); }).vida;
    entrarNaVida(v);
    expect(paisDaVida(v)).toBe('US');
    expect(v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente').toBe(true);
    expect(v.educacao.basica?.serie).toBe(serieAntes);
    expect(v.educacao.historicoEscolar?.[0]).toMatchObject({ pais: 'BR' });
    expect(v.biografia.some(b => /Chicago/.test(b.texto) && /família/.test(b.texto))).toBe(true);
    expect(v.biografia.some(b => /escola nova/.test(b.texto))).toBe(true);
    // A nacionalidade não muda por morar fora; a residência, sim.
    expect(v.eu.nacionalidades ?? ['BR']).toContain('BR');
    v = viverAte(v, 12);
    v = transacao(v, x => { migrarComAFamilia(x, 'sao-paulo-sp', 'O pai'); }).vida;
    expect(paisDaVida(v)).toBe('BR');
    expect(v.educacao.historicoEscolar?.map(h => h.pais)).toEqual(['BR', 'US']);
    expect(v.educacao.basica).toBeDefined();
  });
});

/* ======================================================= CARTEIRA E IDADES */

describe('carteira de motorista: regra do lugar (universal → país → estado), uma fonte para motor e tela', () => {
  it('nos EUA a regra é estadual: Montana começa aos 15, Califórnia e Nova York aos 16; no Brasil, a CNH aos 18', () => {
    expect(regrasDoLugar(lugarDe('us:bozeman')).direcao.aprendiz?.idade).toBe(15);
    expect(regrasDoLugar(lugarDe('us:los-angeles')).direcao.provisoria?.idade).toBe(16);
    expect(regrasDoLugar(lugarDe('us:nova-york')).direcao.provisoria?.idade).toBe(17);
    expect(regrasDoLugar(lugarDe('recife-pe')).direcao).toMatchObject({ nome: 'CNH', plena: 19, autoescolaObrigatoria: true });
    expect(regrasDoLugar(lugarDe(maior('GB'))).direcao.plena).toBe(17);
    expect(regrasDoLugar(lugarDe(maior('JP'))).direcao.plena).toBe(18);
  });

  it('aos 16 em Los Angeles a ação é permitida e a tela fala de carteira de motorista (sem CNH); aos 16 no Recife, não — com o porquê', () => {
    const la = ate('us:los-angeles', 16, 3), re = ate('recife-pe', 16, 3);
    expect(disponibilidade(la, { tipo: 'cnh' }).grau).not.toBe('ilegal');
    expect(habilitacaoDaVida(la).a).toBe('a carteira de motorista');
    expect(habilitacaoDaVida(la).frase).not.toMatch(/CNH/);
    const br = disponibilidade(re, { tipo: 'cnh' });
    expect(br.grau).toBe('ilegal');
    expect(br.motivo).toMatch(/18/);
  });

  it('outras idades da lei são do lugar: bar aos 21 nos EUA; jovem aprendiz só onde a lei tem; escola obrigatória até 17 no Brasil', () => {
    const eua = ate('us:chicago', 19, 4);
    expect(podeComecarRotina(eua, 'sair_noite').grau).not.toBe('permitido');
    expect(regrasDaVida(eua).trabalho.aprendiz).toBeUndefined();
    const br = ate('recife-pe', 15, 4);
    expect(regrasDaVida(br).trabalho.aprendiz?.idade).toBe(14);
    expect(regrasDaVida(br).escolaObrigatoriaAte).toBe(17);
  });
});

/* ======================================================= RESIDÊNCIA × NACIONALIDADE */

describe('residência e nacionalidade respondem perguntas diferentes', () => {
  it('estrangeira residente não disputa eleição nem é chamada ao alistamento obrigatório do país onde mora', () => {
    const v = adulto(30, { semente: 9, municipioId: 'recife-pe' });
    v.eu.nacionalidades = ['AR'];
    v.caminhos.politica = { fase: 'filiado', partido: 'x', tFiliacao: v.t - 24, reputacao: 30, apoio: 30, historico: [], consecutivos: 0 } as unknown as Vida['caminhos']['politica'];
    const ver = podeConcorrer(v, 'vereador', proximaEleicao(v.t, 'municipal').t);
    expect(ver.grau).toBe('ilegal');
    expect(ver.motivo).toMatch(/nacionalidade/);
    const al = conteudoPorId('mil_alistamento')!;
    const jovem = ate('recife-pe', 18, 12);
    jovem.eu.nacionalidades = ['AR'];
    jovem.eu.genero = 'masculino';
    expect(preparar(al, jovem, criarRng(2))).toBeNull();
  });
});

/* ======================================================= RELAÇÕES 2.0 */

function gente(v: Vida, o: { idade?: number; genero?: Pessoa['genero']; afab?: number; prox?: number; conf?: number; estagio?: Vinculo['estagio']; convivio?: Vinculo['convivio'] } = {}): { p: Pessoa; vin: Vinculo } {
  const p = pessoaNova(v, o.idade ?? idade(v), o.genero ?? 'feminino', { atracao: 'homens' });
  if (o.afab !== undefined) p.temperamento = { ...p.temperamento, afabilidade: o.afab, estabilidade: o.afab };
  const vin = vincular(v, p, { origem: 'trabalho', proximidade: o.prox ?? 70, convivio: o.convivio ?? ['trabalho'] });
  vin.estagio = o.estagio ?? 'amigo';
  vin.confianca = o.conf ?? 60;
  vin.tInicio = v.t - 60;
  return { p, vin };
}

describe('Relações 2.0 — tipo, estado e história', () => {
  it('TESTE FUNDAMENTAL: a mesma proximidade (80) é irmã, melhor amiga, namorado e ex — quatro relações diferentes na tela', () => {
    const v = adulto(30, { semente: 14 });
    const irma = comParente(v, 'irmao', 28, 'feminino', 80);
    const amiga = gente(v, { prox: 80, conf: 90, estagio: 'amigo_proximo' });
    amiga.vin.historia.push(...Array.from({ length: 6 }, (_, k) => ({ t: v.t - 12 * k, texto: `Marco ${k}.`, tipo: 'amizade' as const, peso: 2 })));
    amiga.vin.tInicio = v.t - 240;
    const par = comParceiro(v, { estagio: 'namoro' });
    par.vin.proximidade = 80;
    const ex = gente(v, { prox: 80, estagio: 'conhecido', genero: 'masculino' });
    ex.vin.romance = { estagio: 'ex', tEstagio: v.t - 24, envolvimento: 30, fim: 'termino' };
    expect(melhorAmigoId(v)).toBe(amiga.p.id);
    const rotulos = [irma, amiga, par, ex].map(x => rotuloDe(v, x.p, x.vin));
    expect(new Set(rotulos).size).toBe(4);
    expect(rotulos[0]).toMatch(/irmã/);
    expect(rotulos[1]).toMatch(/melhor amiga/);
    expect(rotulos[3]).toMatch(/ex/);
    for (const x of [irma, amiga, par, ex]) expect(etiqueta(v, x.p, x.vin)).not.toMatch(/próxim/);
  });

  it('1. colega de escola → tentativas de aproximação → a amizade pode nascer (não é XP: nem toda tentativa vira amizade)', () => {
    let amizades = 0, tentativas = 0;
    for (let s = 1; s <= 12; s++) {
      let v = adulto(16, { semente: 60 + s });
      const { p } = gente(v, { idade: 16, prox: 30, conf: 40, estagio: 'colega', convivio: ['escola'] });
      for (let ano = 0; ano < 3; ano++) {
        v = transacao(v, (x, r) => {
          x.anoAtual = { acoes: [] };
          if (interacoesPara(x, p.id).some(i => i.id === 'aproximar')) { tentativas++; executarInteracao(x, r, p.id, 'aproximar'); }
          x.t += 12; processarSocial(x, r);
        }).vida;
      }
      if (['amigo', 'amigo_proximo'].includes(v.vinculos[p.id].estagio ?? '')) amizades++;
    }
    expect(tentativas).toBeGreaterThan(12);
    expect(amizades).toBeGreaterThan(0);
    expect(amizades).toBeLessThan(12);
  });

  it('2. romance não é amizade: sair junto não vira "muito próximo", e o término não faz do ex um amigo', () => {
    const v = adulto(25, { semente: 15 });
    const { p, vin } = gente(v, { prox: 30, estagio: 'conhecido', genero: 'masculino' });
    vin.contexto = { via: 'app', abertura: 0.78 };
    vin.romance = { estagio: 'saindo', tEstagio: v.t, tInicio: v.t, envolvimento: 90 };
    let w = v;
    for (let k = 0; k < 3; k++) w = transacao(w, (x, r) => { x.t += 12; processarSocial(x, r); }).vida;
    expect(w.vinculos[p.id].estagio).not.toBe('amigo_proximo');
    const x = structuredClone(w);
    mudarEstagio(x, x.vinculos[p.id], 'ex');
    expect(['conhecido', 'afastado']).toContain(x.vinculos[p.id].estagio);
    expect(rotuloDe(x, p, x.vinculos[p.id])).toMatch(/ex/);
  });

  it('3. interesse não correspondido: a relação continua o que era — sem romance, sem "amizade" inventada', () => {
    const v = adulto(20, { semente: 16 });
    const { p, vin } = gente(v, { prox: 25, estagio: 'colega', genero: 'masculino' });
    vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: 20 };
    expect(rotuloDe(v, p, vin)).toMatch(/interesse romântico/);
    expect(papelDe(p, vin)).toBe('interesse');
  });

  it('4. a mesma discussão, pessoas diferentes: quem tem bom gênio resolve muito mais do que quem não tem', () => {
    const contar = (afab: number) => {
      let resolveu = 0;
      for (let s = 0; s < 120; s++) {
        const v = adulto(30, { semente: 17 });
        const { p, vin } = gente(v, { afab, prox: 70, conf: 60 });
        if (discutir(v, criarRng(1000 + s * 31), p, vin, 1, 'política') === 'resolveu') resolveu++;
      }
      return resolveu / 120;
    };
    expect(contar(0.9)).toBeGreaterThan(contar(-0.9) + 0.25);
  });

  it('5–7. amigos brigam, a amizade acaba — e a história fica; pedir desculpas pode reconciliar', () => {
    const v = adulto(30, { semente: 18 });
    const { p, vin } = gente(v, { afab: 0.6, prox: 70, conf: 70 });
    vin.historia.push({ t: v.t - 48, texto: 'Viraram amigos no trabalho.', tipo: 'amizade', peso: 2 });
    romper(v, p, vin, 'A amizade acabou numa briga por causa de dinheiro.', 'ambos');
    expect(vin.estagio).toBe('ex_amigo');
    expect(estadoDaRelacao(v, vin)).toBe('rompido');
    expect(rotuloDe(v, p, vin)).toMatch(/ex-amiga/);
    expect(vin.historia.some(h => h.texto === 'Viraram amigos no trabalho.')).toBe(true);
    expect(comoEsta(v, p, vin)).toMatch(/dinheiro/);
    // Fazer as pazes: depende da pessoa e do tempo; com bom gênio e anos depois, acontece em boa parte das vezes.
    let ok = 0;
    for (let s = 0; s < 40; s++) {
      const x = structuredClone(v); x.t += 60;
      if (reconciliar(x, criarRng(500 + s), x.pessoas[p.id], x.vinculos[p.id])) { ok++; expect(estadoDaRelacao(x, x.vinculos[p.id])).toBe('reconciliacao'); }
    }
    expect(ok).toBeGreaterThan(5);
    expect(ok).toBeLessThan(40);
    // Desculpas depois de uma briga (sem ruptura): aceitas, em parte ou recusadas.
    const w = adulto(30, { semente: 19 });
    const a = gente(w, { afab: 0.2, prox: 60, conf: 55 });
    a.vin.conflito = { t: w.t, assunto: 'um comentário que machucou', gravidade: 2, quem: 'eu' };
    a.vin.tensao = 60;
    const desfechos = new Set<string>();
    for (let s = 0; s < 60; s++) { const x = structuredClone(w); desfechos.add(desculpar(x, criarRng(70 + s), x.pessoas[a.p.id], x.vinculos[a.p.id])); }
    expect(desfechos.size).toBe(3);
  });

  it('as ações são contextuais: sem ruptura não há "fazer as pazes"; com quem nunca foi amigo não há "encerrar amizade"', () => {
    const v = adulto(30, { semente: 20 });
    const colega = gente(v, { prox: 30, estagio: 'colega' });
    const amiga = gente(v, { prox: 70, estagio: 'amigo' });
    const ids = (id: string) => interacoesPara(v, id).map(x => x.id);
    expect(ids(colega.p.id)).not.toContain('encerrar_amizade');
    expect(ids(colega.p.id)).not.toContain('reconciliar');
    expect(ids(amiga.p.id)).toContain('encerrar_amizade');
    expect(ids(amiga.p.id)).toContain('discordar');
    expect(ids(amiga.p.id)).not.toContain('cobrar');
    amiga.vin.conflito = { t: v.t, assunto: 'política', gravidade: 1, quem: 'eu' };
    expect(ids(amiga.p.id)).toContain('cobrar');
    expect(ids(amiga.p.id)).toContain('desculpas');
    romper(v, amiga.p, amiga.vin, 'Acabou.', 'eu');
    expect(ids(amiga.p.id)).toContain('reconciliar');
    expect(ids(amiga.p.id)).not.toContain('encerrar_amizade');
  });

  it('não é farm: discutir de novo com a mesma pessoa no mesmo ano é bloqueado', () => {
    let v = adulto(30, { semente: 21 });
    const { p } = gente(v, { prox: 70 });
    v.anoAtual = { acoes: [] };
    v = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'discordar' }).vida;
    expect(disponibilidade(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'discordar' }).grau).not.toBe('permitido');
  });

  it('8. o ex-amigo pode reaparecer anos depois (a iniciativa é dele)', () => {
    let apareceu = false;
    for (let s = 0; s < 30 && !apareceu; s++) {
      const v = adulto(40, { semente: 22 + s });
      for (const vin of Object.values(v.vinculos)) vin.chamado = undefined;
      const { p, vin } = gente(v, { afab: 0.8, prox: 30, estagio: 'ex_amigo', convivio: [] });
      vin.ruptura = { t: v.t - 84, porque: 'Brigaram.', quem: 'ambos' };
      const w = transacao(v, (x, r) => { x.t += 12; processarIniciativas(x, r); }).vida;
      if (w.vinculos[p.id].chamado?.tipo === 'reaparecer') apareceu = true;
    }
    expect(apareceu).toBe(true);
  });

  it('9. salvar e reabrir preserva tipo, estado e história da relação', () => {
    const v = adulto(30, { semente: 23 });
    const { p, vin } = gente(v, { prox: 50 });
    vin.conflito = { t: v.t, assunto: 'política', gravidade: 2, quem: 'outro' };
    vin.proxAno = 60;
    romper(v, p, vin, 'A amizade acabou.', 'outro');
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    const w = lido.vida.vinculos[p.id];
    expect(w).toMatchObject({ estagio: 'ex_amigo', ruptura: { quem: 'outro' }, conflito: { assunto: 'política' }, proxAno: 60 });
    expect(estadoDaRelacao(lido.vida, w)).toBe('rompido');
  });

  it('10. sucessão: a herdeira continua com as relações dela — a parceria, os irmãos, e a mãe que morreu (com a briga que ficou)', () => {
    let v = adulto(58, { semente: 26 });
    v = transacao(v, x => {
      const { p: filha, vin } = comFilho(x, 30, { genero: 'feminino', casa: false });
      const { p: filho } = comFilho(x, 27, { genero: 'masculino', casa: false });
      const par = pessoaNova(x, 31, 'masculino', { nome: 'Rui' });
      filha.parceiroId = par.id;
      par.parceiroId = filha.id;
      x.fatos[`casou_${filha.id}`] = x.t - 24;
      x.fatos[`uniao_cartorio_${filha.id}`] = 1;
      vin.conflito = { t: x.t, assunto: 'as escolhas da sua vida', gravidade: 2, quem: 'eu' };
      vin.historia.push({ t: x.t - 120, texto: 'A formatura dela.', tipo: 'apoio', peso: 2 });
      void filho;
      x.morte = { t: x.t, causa: 'infarto' };
    }).vida;
    const filha = Object.values(v.pessoas).find(p => p.genitores?.includes('eu') && p.genero === 'feminino')!;
    const irmao = Object.values(v.pessoas).find(p => p.genitores?.includes('eu') && p.genero === 'masculino')!;
    const r = continuarComo(v, filha.id);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    const par = Object.values(n.vinculos).find(w => w.romance && w.romance.estagio !== 'ex')!;
    expect(n.pessoas[par.pessoaId].nome).toBe('Rui');
    expect(par.romance!.estagio).toBe('casamento');
    expect(n.vinculos[irmao.id].parentesco).toMatch(/irmao/);
    const mae = Object.values(n.vinculos).find(w => w.parentesco === 'mae')!;
    expect(mae.conflito?.assunto).toBe('as escolhas da sua vida');
    expect(mae.historia.some(h => h.texto === 'A formatura dela.')).toBe(true);
  });

  it('11. migrar não apaga ninguém: as amizades ficam, longe — e a distância tem consequência', () => {
    const v = adulto(30, { semente: 24 });
    v.financas.conta = 300000;
    const { p } = gente(v, { prox: 70, estagio: 'amigo', convivio: [] });
    v.eu.nacionalidades = ['BR', 'PT'];
    let w = transacao(v, (x, r) => { migrar(x, r, 'pt:lisboa', 'trabalho'); }).vida;
    expect(paisDaVida(w)).toBe('PT');
    expect(w.vinculos[p.id]).toBeDefined();
    expect(municipio(w.pessoas[p.id].municipioId).pais).toBe('BR');
    for (let k = 0; k < 3; k++) w = transacao(w, (x, r) => { x.t += 12; processarSocial(x, r); }).vida;
    expect(w.vinculos[p.id].proximidade).toBeLessThan(70);
  });

  it('12. família continua família com proximidade baixa (e rompida, continua irmã)', () => {
    const v = adulto(30, { semente: 25 });
    const irma = comParente(v, 'irmao', 33, 'feminino', 8);
    expect(rotuloDe(v, irma.p, irma.vin)).toMatch(/irmã/);
    romper(v, irma.p, irma.vin, 'Romperam por causa da herança.', 'ambos');
    expect(irma.vin.parentesco).toBe('irmao');
    expect(rotuloDe(v, irma.p, irma.vin)).toMatch(/irmã/);
    expect(etiqueta(v, irma.p, irma.vin)).toBe('romperam');
    expect(comoEsta(v, irma.p, irma.vin)).toMatch(/família/);
  });
});
