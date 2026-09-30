/**
 * FIX pós-REWORK 2 — integração sistêmica, relações, carreiras vivas, agência.
 *
 * Não se testa função isolada: AÇÃO EM A → EFEITO EM B → ANOS PASSAM →
 * CONSEQUÊNCIA EM C → estado/tela coerentes → save/reload preserva.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { adulto, comFilho, comParceiro, comParente, pessoaNova } from './cenarios';
import { nova, responder, viver } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { clamp, criarRng, type Rng } from '../rng';
import type { Vida } from '../tipos';
import { idade, transacao, vinculosVivos } from '../nucleo';
import { vincular } from '../pessoas';
import { podeTentar } from '../plausibilidade';
import { interpretar, migrarV16, migrarV17, VERSAO_SAVE } from '../save';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { garantirFrente, habilidade, leituraDaFrente } from '../sistemas/frentes';
import {
  assinarContrato, entrarNaBase, fecharTemporada, linhaDaTemporada, nivelQueOMercadoOferece, processarEsporte, profissionalizar, salarioDoContrato
} from '../sistemas/esporte';
import { cuidarDaLesao, fatorDeTreino, lesaoAtiva, lesionar, mesesForaNoAno, processarLesoes } from '../sistemas/lesoes';
import { estimuloFisico, fatoresCondicionamento } from '../sistemas/pessoa';
import { fatoresCabeca, fatoresSaude } from '../sistemas/estado';
import { leituraDaSobrecarga, pesoNoDesempenho, processarSobrecarga } from '../sistemas/sobrecarga';
import { interacoesPara } from '../sistemas/interacoes';
import { processarSocial } from '../sistemas/social';
import { entrarNaPolitica, portasDaPolitica, processarPolitica } from '../sistemas/politica';
import { processarIniciativas } from '../sistemas/iniciativas';
import { terminar } from '../sistemas/romance';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { lancarObra } from '../sistemas/arte';
import { alvoDaNotoriedade, processarNotoriedade, rendaDeImagem } from '../sistemas/notoriedade';
import { acoesDoTrabalho, leituraDoTrabalho, modoDoTrabalho } from '../sistemas/profissao';
import { abrirNegocio, fecharNegocio, negocioAberto } from '../sistemas/negocio';
import { remuneracaoDe } from '../sistemas/renda';
import { saldoMensal } from '../sistemas/dinheiro';
import { fechamentoDoAno } from '../sistemas/fechamento';
import { gestacaoEmCurso, processarConcepcao, processarGestacoes } from '../sistemas/familia';
import { capituloDaVida, faseDeIdade } from '../sistemas/vinculos';
import { faseDaVida } from '../../ui/apresentar';
import { sinaisSociais } from '../../ui/leitura';
import { semana } from '../sistemas/semana';

const clone = <T,>(x: T): T => structuredClone(x);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const ids = (v: Vida, id: string) => interacoesPara(v, id).map(i => i.id);
/** Um gerador que sempre sorteia o mesmo valor (para caminhos determinísticos no teste). */
const fixo = (x: number): Rng => ({ ...criarRng(1), next: () => x, chance: (p: number) => x < p, int: (a: number) => a, normal: () => 0, pick: <T,>(l: readonly T[]) => l[0], weighted: <T,>(l: readonly T[]) => l[0] } as unknown as Rng);

function trabalhador(i = 30, semente = 7): Vida {
  const v = adulto(i, { semente });
  v.trabalho.atual = undefined; v.educacao.matricula = undefined; v.educacao.basica = undefined;
  v.caminhos.esporte = undefined; v.caminhos.politica = undefined; v.caminhos.negocio = undefined; v.caminhos.arte = undefined;
  v.rotinas = []; v.processos = []; v.corpo.condicoes = []; v.anoAtual = { acoes: [] };
  for (const vin of Object.values(v.vinculos)) vin.chamado = undefined;
  return v;
}

function atleta(semente = 7, h = 82, nivel = 3): Vida {
  const v = trabalhador(21, semente);
  return transacao(v, x => {
    garantirFrente(x, 'futebol');
    const f = x.caminhos.frentes.futebol!; f.habilidade = h; f.interesse = 90; f.meses = 140; f.auge = h;
    x.rotinas.push({ id: 'futebol', tInicio: x.t - 60, nivel: 3 });
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Clube Atlético Mineiro');
    profissionalizar(x, criarRng(semente), nivel);
  }).vida;
}

const anoDe = (v: Vida, r: Rng, f: (x: Vida, r: Rng) => void) => transacao(v, x => { x.t += 12; f(x, r); }).vida;

/* ================================================================ Saúde */

describe('saúde vivida: a lesão esportiva conversa com tudo', () => {
  it('a lesão vira condição, abre a decisão, e pesa em saúde, condicionamento, treino, temporada e humor', () => {
    let v = atleta();
    const humorAntes = v.mente.abalos.length;
    v = transacao(v, (x, r) => { lesionar(x, r, 3, 'profissional'); }).vida;
    const c = lesaoAtiva(v)!;
    expect(c).toBeTruthy();
    expect(c.lesao.cuidado).toBeUndefined();
    // Percepção: Linha da Vida e Saúde (Você) dizem a mesma lesão; a tela não descobre por acaso.
    expect(v.biografia.slice(-3).some(e => e.texto.includes(c.lesao.parte))).toBe(true);
    expect(fatoresSaude(v).some(f => f.id === 'condicao:lesao' && f.efeito < 0 && f.texto.includes(c.lesao.parte))).toBe(true);
    expect(fatoresCondicionamento(v).some(f => f.id === 'condicao:lesao' && f.efeito < 0)).toBe(true);
    expect(v.mente.abalos.length).toBeGreaterThan(humorAntes);
    // A decisão: o motor não decide como a pessoa reage.
    v = transacao(v, (x, r) => { const d = conteudoPorId('sau_lesao')!; if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
    expect(v.momento?.situacaoId).toBe('sau_lesao');
    expect(v.momento!.opcoes.map(o => o.id)).toEqual(expect.arrayContaining(['repouso', 'fisio', 'cirurgia', 'sacrificio']));
    // Disponibilidade: fora de campo, o treino rende menos e a temporada tem meses fora.
    const operado = executar(clone(v), { tipo: 'decidir', opcaoId: 'cirurgia' }).vida;
    expect(lesaoAtiva(operado)!.lesao.cuidado).toBe('cirurgia');
    const noAno = transacao(operado, x => { x.t += 12; }).vida;
    expect(mesesForaNoAno(noAno)).toBeGreaterThanOrEqual(6);
    expect(fatorDeTreino(noAno)).toBeLessThan(0.7);
    const t = fecharTemporada(noAno, criarRng(3), noAno.caminhos.esporte!);
    expect(t.mesesFora).toBeGreaterThanOrEqual(6);
    expect(t.partidas).toBeLessThan(20);
    // Save/reload mantém a lesão com o cuidado escolhido.
    const lido = interpretar(JSON.stringify(operado));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') expect(lesaoAtiva(lido.vida)!.lesao).toEqual(lesaoAtiva(operado)!.lesao);
  });

  it('o cuidado muda a evolução: tratar recupera; jogar no sacrifício pesa mais e pode piorar', () => {
    let pioras = 0; let saudeTratado = 0; let saudeSacrificio = 0; let voltouTratado = 0;
    for (let s = 1; s <= 16; s++) {
      const base = transacao(atleta(s), (x, r) => { lesionar(x, r, 2, 'profissional'); }).vida;
      let a = transacao(clone(base), x => cuidarDaLesao(x, 'fisio', false)).vida;
      let b = transacao(clone(base), x => cuidarDaLesao(x, 'sacrificio', false)).vida;
      expect(fatoresSaude(b).find(f => f.id === 'condicao:lesao')!.efeito).toBeLessThan(fatoresSaude(a).find(f => f.id === 'condicao:lesao')!.efeito);
      const r1 = criarRng(s * 11); const r2 = criarRng(s * 11);
      a = anoDe(a, r1, (x, r) => processarLesoes(x, r));
      b = anoDe(b, r2, (x, r) => processarLesoes(x, r));
      if (!lesaoAtiva(a)) voltouTratado++;
      if ((lesaoAtiva(b)?.lesao.recaidas ?? 0) > 0) pioras++;
      saudeTratado += -(fatoresSaude(a).find(f => f.id === 'condicao:lesao')?.efeito ?? 0);
      saudeSacrificio += -(fatoresSaude(b).find(f => f.id === 'condicao:lesao')?.efeito ?? 0);
    }
    expect(voltouTratado).toBe(16);
    expect(pioras).toBeGreaterThan(0);
    expect(saudeSacrificio).toBeGreaterThan(saudeTratado);
  });
});

/* ================================================================ Sobrecarga */

describe('sobrecarga: a semana concreta cobra — e o descanso devolve', () => {
  const carregado = () => {
    const v = trabalhador(26, 5);
    contratar(v, criarRng(1), ocupacao('assistente_adm'));
    v.educacao.matricula = { cursoId: 'medicina', instituicao: 'UF', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 60, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    v.trabalho.horasExtras = true;
    return v;
  };
  it('trabalho + faculdade integral + horas extras: a mesma leitura na tela e no motor; anos seguidos cobram saúde e desempenho', () => {
    let v = carregado();
    const l = leituraDaSobrecarga(v);
    expect(l.nivel).toBeGreaterThanOrEqual(2);
    expect(fatoresCabeca(v).some(f => f.id === 'semana_fixa' && f.efeito > 0)).toBe(true);
    for (let k = 0; k < 3; k++) v = transacao(v, x => { x.t += 12; x.trabalho.horasExtras = true; processarSobrecarga(x); }).vida;
    expect(v.mente.sobrecarga?.anos).toBeGreaterThanOrEqual(3);
    expect(fatoresSaude(v).some(f => f.id === 'sobrecarga' && f.efeito < 0)).toBe(true);
    expect(pesoNoDesempenho(v)).toBeLessThan(0);
    expect(leituraDaSobrecarga(v).texto).toMatch(/Há \d+ anos assim/);
    // A vida pergunta (a escolha é de quem vive): a decisão existe e oferece aliviar.
    expect(v.fatos['sob_decidir']).toBeDefined();
    // Sem moeda universal de energia: nada disso vira "pontos de ação".
    expect(Object.keys(v.mente)).not.toContain('energia');
    // Aliviar (trancar o curso, sem horas extras): a sobrecarga desce, ano a ano.
    v = transacao(v, x => { x.educacao.matricula!.trancado = true; x.trabalho.horasExtras = false; }).vida;
    const antes = v.mente.sobrecarga!.anos;
    v = transacao(v, x => { x.t += 12; processarSobrecarga(x); }).vida;
    expect(v.mente.sobrecarga?.anos ?? 0).toBeLessThan(antes);
  });
  it('as horas extras do ano pesam na cabeça do mesmo ano (não somem antes do equilíbrio)', () => {
    const v = carregado();
    const com = avancarAno(clone(v)).vida;
    const sem = avancarAno(transacao(clone(v), x => { x.trabalho.horasExtras = false; }).vida).vida;
    expect(com.mente.estresse).toBeGreaterThan(sem.mente.estresse);
    expect(com.trabalho.horasExtras).toBe(false); // no ano seguinte, é outra escolha
  });
});

/* ================================================================ Relações */

describe('relações: conhecer não é virar amigo', () => {
  function comColega(semente = 3, comp = 'alta') {
    const v = trabalhador(30, semente);
    contratar(v, criarRng(1), ocupacao('assistente_adm'));
    const p = pessoaNova(v, 31, 'masculino');
    p.temperamento = comp === 'alta' ? { extroversao: 0.5, afabilidade: 0.8, responsabilidade: 0.3, abertura: 0.4, estabilidade: 0.5 } : { extroversao: -0.9, afabilidade: -0.9, responsabilidade: -0.8, abertura: -0.8, estabilidade: -0.9 };
    const vin = vincular(v, p, { origem: 'trabalho', proximidade: 40, convivio: ['trabalho'], estagio: 'colega' });
    vin.ambiente = `trabalho:${v.trabalho.atual!.empregador}:${v.trabalho.atual!.tInicio}`;
    vin.tInicio = v.t - 24;
    return { v, p };
  }
  it('colega adulto, convivendo todo dia, não vira amigo sozinho (sem gesto de ninguém)', () => {
    // Sem gesto, poucos viram amigos. (FIX 3.1: 90 colegas e "poucos" = até 30%. Medido: 31 de 150, 21%; em
    // lotes de 30 o número oscila de 2 a 8 — o limite antigo, 6 de 30, estava na média, não na margem.)
    let viraram = 0;
    for (let s = 1; s <= 90; s++) {
      let { v, p } = comColega(s, 'media');
      p.temperamento = { extroversao: 0, afabilidade: 0.2, responsabilidade: 0, abertura: 0, estabilidade: 0 };
      for (let k = 0; k < 5; k++) v = anoDe(v, criarRng(s * 7 + k), (x, r) => processarSocial(x, r));
      if (v.vinculos[p.id].estagio === 'amigo') viraram++;
    }
    expect(viraram).toBeLessThanOrEqual(27);
  }, 90000);
  it('o gesto correspondido abre a amizade — e a outra pessoa pode não corresponder', () => {
    const { v, p } = comColega(4);
    expect(ids(v, p.id)).toContain('aproximar');
    expect(ids(v, p.id)).not.toContain('tempo'); // colega não "passa a tarde junto" como amigo
    const sim = executar(clone(v), { tipo: 'pessoa', pessoaId: p.id, interacao: 'aproximar' });
    const recusas: string[] = [];
    for (let s = 1; s <= 30; s++) {
      const x = transacao(clone(v), () => {}).vida;
      const frio = x.pessoas[p.id]; frio.temperamento = { extroversao: -0.9, afabilidade: -0.9, responsabilidade: -0.8, abertura: -0.8, estabilidade: -0.9 };
      x.vinculos[p.id].proximidade = 15; x.rng = s * 977;
      const r = executar(x, { tipo: 'pessoa', pessoaId: p.id, interacao: 'aproximar' });
      if (r.vida.vinculos[p.id].aproximacao === undefined) recusas.push(r.resultado ?? '');
    }
    expect(recusas.length).toBeGreaterThan(0);
    let w = sim.vida;
    if (w.vinculos[p.id].aproximacao !== undefined) {
      w.vinculos[p.id].proximidade = 50;
      w = anoDe(w, criarRng(9), (x, r) => processarSocial(x, r));
      expect(w.vinculos[p.id].estagio).toBe('amigo');
    }
  });
  it('o colega pode dar o primeiro passo (um chamado): aceitar é o gesto; ignorar deixa passar', () => {
    let achou = false;
    for (let s = 1; s <= 30 && !achou; s++) {
      let { v, p } = comColega(s);
      for (const x of Object.values(v.vinculos)) if (x.pessoaId !== p.id && !x.parentesco) x.convivio = [];
      v = transacao(v, x => { x.t += 12; x.rng = s * 131; }).vida;
      v = transacao(v, (x, r) => { processarIniciativas(x, r); }).vida;
      const ch = v.vinculos[p.id].chamado;
      if (ch?.tipo === 'aproximacao') {
        achou = true;
        const aceitou = executar(clone(v), { tipo: 'pessoa', pessoaId: p.id, interacao: 'chamado_sim' }).vida;
        expect(aceitou.vinculos[p.id].aproximacao).toBe(aceitou.t);
        const ignorou = transacao(clone(v), (x, r) => { x.t += 12; processarIniciativas(x, r); }).vida;
        expect(ignorou.vinculos[p.id].aproximacao).toBeUndefined();
      }
    }
    expect(achou).toBe(true);
  });
  it('ex não é amigo: as ações reconhecem o término, os filhos, e a amizade só vem se os dois quiserem', () => {
    let v = trabalhador(38, 6);
    const { p, vin } = comParceiro(v, { estagio: 'casamento', anos: 8 });
    comFilho(v, 7, { outroId: p.id });
    v = transacao(v, x => { terminar(x, x.pessoas[p.id], x.vinculos[p.id], 'jogador'); }).vida;
    void vin;
    const oque = ids(v, p.id);
    expect(v.vinculos[p.id].estagio).toBe('afastado');
    for (const deAmigo of ['tempo', 'visitar', 'ligar', 'conversar', 'desabafar']) expect(oque).not.toContain(deAmigo);
    expect(oque).toContain('ex_filhos');
    expect(oque).toContain('ex_conversar');
    // Um ano depois, com o atrito baixo: propor amizade é possível — e pode ser recusado.
    v = transacao(v, x => { x.t += 18; x.vinculos[p.id].tensao = 10; x.vinculos[p.id].proximidade = 45; }).vida;
    expect(ids(v, p.id)).toContain('ex_amizade');
    const resultados = new Set<string>();
    for (let s = 1; s <= 20; s++) { const x = clone(v); x.rng = s * 61; const r = executar(x, { tipo: 'pessoa', pessoaId: p.id, interacao: 'ex_amizade' }); resultados.add(r.vida.vinculos[p.id].estagio ?? ''); }
    expect(resultados.has('amigo')).toBe(true);
    expect(resultados.has('afastado')).toBe(true);
    const amigos = (() => { for (let s = 1; s <= 20; s++) { const x = clone(v); x.rng = s * 61; const r = executar(x, { tipo: 'pessoa', pessoaId: p.id, interacao: 'ex_amizade' }).vida; if (r.vinculos[p.id].estagio === 'amigo') return r; } return v; })();
    expect(ids(amigos, p.id)).toContain('aprofundar'); // de ex a amigo: aí sim, ações de amizade
  });
  it('distância não apaga a relação: o casal em cidades diferentes conversa, decide — e a outra pessoa pode dizer não', () => {
    const v = trabalhador(30, 8);
    const { p } = comParceiro(v, { estagio: 'namoro', anos: 3 });
    v.vinculos[p.id].convivio = [];
    v.financas.conta = 40000;
    p.municipioId = 'sao-paulo-sp';
    const oque = ids(v, p.id);
    expect(oque).toEqual(expect.arrayContaining(['distancia', 'visitar_par', 'ligar_par']));
    expect(tenta(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'morar_junto' })).toBe(false);
    const aberto = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'distancia' }).vida;
    expect(aberto.momento?.situacaoId).toBe('rom_distancia');
    expect(aberto.momento!.opcoes.map(o => o.id)).toEqual(expect.arrayContaining(['mudar', 'chamar', 'seguir', 'terminar']));
    const respostas = new Set<string>();
    for (let s = 1; s <= 20; s++) { const x = clone(aberto); x.rng = s * 17; x.vinculos[p.id].romance!.envolvimento = 60; const r = executar(x, { tipo: 'decidir', opcaoId: 'chamar' }).vida; respostas.add(r.pessoas[p.id].municipioId); }
    expect(respostas.size).toBe(2); // às vezes vem, às vezes não
    const mudou = executar(clone(aberto), { tipo: 'decidir', opcaoId: 'mudar' }).vida;
    expect(mudou.moradia.municipioId).toBe('sao-paulo-sp');
    expect(mudou.vinculos[p.id].romance?.estagio).toBe('namoro');
  });
  it('amizade enfraquece sem contato — e tomar distância é uma escolha que o mundo respeita', () => {
    let v = trabalhador(35, 9);
    const p = pessoaNova(v, 35, 'feminino');
    vincular(v, p, { origem: 'escola', proximidade: 70, estagio: 'amigo' });
    v.vinculos[p.id].tUltimoContato = v.t - 48;
    p.municipioId = 'manaus-am';
    const antes = v.vinculos[p.id].proximidade;
    v = anoDe(v, criarRng(2), (x, r) => processarSocial(x, r));
    expect(v.vinculos[p.id].proximidade).toBeLessThan(antes);
    v = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'afastar' }).vida;
    expect(v.vinculos[p.id].distancia).toBe(v.t);
    expect(v.vinculos[p.id].estagio).toBe('afastado');
    expect(sinaisSociais(v).some(x => x.pessoaId === p.id && /sem se falarem/.test(x.texto))).toBe(false);
  });
});

/* ================================================================ Pede atenção */

describe('"Pede atenção" não é inbox global', () => {
  it('luto antigo sai; o pai que nunca esteve por perto não é tratado como amigo esquecido; o urgente é global', () => {
    const v = trabalhador(40, 12);
    const { p: pai, vin } = comParente(v, 'pai', 68, 'masculino', 30);
    vin.presenca = 5; vin.tUltimoContato = v.t - 60; vin.historia.push({ t: v.t - 400, texto: 'Foi embora quando você era pequena.', tipo: 'distancia' });
    const amiga = pessoaNova(v, 40, 'feminino');
    const va = vincular(v, amiga, { origem: 'escola', proximidade: 80, estagio: 'amigo_proximo' });
    va.tUltimoContato = v.t - 60; va.historia.push({ t: v.t - 100, texto: 'Viraram amigos na escola.', tipo: 'amizade' });
    const morta = pessoaNova(v, 70, 'feminino');
    vincular(v, morta, { parentesco: 'avo', origem: 'familia', proximidade: 80 });
    morta.vivo = false; morta.tMorte = v.t - 72;
    v.luto.push({ pessoaId: morta.id, t: v.t - 72, peso: 60 });
    const s = sinaisSociais(v);
    expect(s.some(x => x.pessoaId === morta.id)).toBe(false);
    expect(s.some(x => x.pessoaId === pai.id && /sem se falarem/.test(x.texto))).toBe(false);
    expect(s.find(x => x.pessoaId === amiga.id)?.escopo).toBe('pessoas');
    const irmao = comParente(v, 'irmao', 38, 'masculino', 70);
    irmao.vin.chamado = { tipo: 'pedido_ajuda', t: v.t, texto: 'Pediu ajuda.', assunto: 'dinheiro' };
    expect(sinaisSociais(v).find(x => x.pessoaId === irmao.p.id)?.escopo).toBe('global');
  });
});

/* ================================================================ Política */

describe('política não é destino padrão', () => {
  it('sem contexto, não há porta — e o convite espontâneo é raro; recusar duas vezes encerra os convites', () => {
    const v = trabalhador(40, 13);
    v.rotinas = [{ id: 'igreja', tInicio: v.t - 120, nivel: 1 }];
    expect(portasDaPolitica(v)).toEqual([]);
    let convites = 0;
    for (let s = 1; s <= 30; s++) {
      let x = trabalhador(30, s); x.rotinas = [];
      for (let k = 0; k < 30; k++) x = anoDe(x, criarRng(s * 100 + k), (y, r) => processarPolitica(y, r));
      if (x.fatos['pol_porta'] !== undefined) convites++;
    }
    expect(convites).toBeLessThanOrEqual(3);
    // O convite inesperado existe (raro): com o acaso a favor, ele vem.
    const y = anoDe(trabalhador(30, 14), fixo(0.0001), (z, r) => { z.rotinas = []; processarPolitica(z, r); });
    expect(y.fatos['pol_porta']).toBe(y.t);
    // Quem já recusou duas vezes não é mais procurado.
    const z = trabalhador(30, 15); z.rotinas = [{ id: 'voluntariado', tInicio: z.t - 60, nivel: 2 }]; z.fatos['pol_recusas'] = 2;
    expect(anoDe(z, fixo(0.0001), (w, r) => processarPolitica(w, r)).fatos['pol_porta']).toBeUndefined();
  });
  it('quem constrói contexto (voluntariado) tem porta; quem persegue a política encontra o caminho', () => {
    const v = trabalhador(35, 16);
    v.rotinas = [{ id: 'voluntariado', tInicio: v.t - 60, nivel: 2 }];
    expect(portasDaPolitica(v).map(x => x.origem)).toContain('comunidade');
    let w = executar(trabalhador(30, 17), { tipo: 'politica', oque: 'aproximar' } as unknown as Acao).vida;
    expect(w.momento?.situacaoId).toBe('pol_aproximar');
    w = executar(w, { tipo: 'decidir', opcaoId: 'partido' }).vida;
    expect(w.caminhos.politica?.fase).toBeDefined();
  });
  it('mandato é vida profissional contextual: ações, crises e o fechamento do ano', () => {
    const src = readFileSync(join(__dirname, '../conteudo/politica.ts'), 'utf8');
    expect(src).toMatch(/id: 'pol_crise'/);
    let v = trabalhador(40, 18);
    v = transacao(v, x => {
      entrarNaPolitica(x, 'comunidade', 1);
      const p = x.caminhos.politica!; p.fase = 'mandato'; p.partido = p.partido ?? 'PT'; p.mandato = { cargo: 'vereador', tInicio: x.t - 12, tFim: x.t + 36, aprovacao: 55, feito: 0 };
      x.trabalho.atual = { ocupacaoId: 'vereador', empregador: 'a Câmara', contrato: 'eletivo', salario: 6000, tInicio: x.t - 12, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral' };
    }).vida;
    const a = acoesDoTrabalho(v, disponibilidade);
    expect([...a.agora, ...a.mais].map(x => x.id)).toEqual(expect.arrayContaining(['pol_bandeira', 'pol_comunidade']));
    expect(fechamentoDoAno(v).some(f => /Vereador|vereador/.test(f.titulo))).toBe(true);
  });
});

/* ================================================================ Futebol */

describe('futebol profissional: uma carreira jogável', () => {
  it('técnica ≠ condicionamento: academia não ensina futebol; o treino do clube conta para o corpo, uma vez só', () => {
    const v = trabalhador(20, 21);
    garantirFrente(v, 'futebol');
    v.rotinas = [{ id: 'academia', tInicio: v.t, nivel: 1 }];
    let x = v;
    for (let k = 0; k < 5; k++) x = viver(x, 1);
    expect(habilidade(x, 'futebol')).toBeLessThan(15);
    const a = atleta(21);
    // O treino de base sai do tempo livre ao virar profissional (e não pode voltar como "atividade").
    expect(a.rotinas.some(r => r.id === 'futebol')).toBe(false);
    expect(tenta(a, { tipo: 'rotina', id: 'futebol', ativa: true, nivel: 3 })).toBe(false);
    const est = estimuloFisico(a);
    expect(est.fontes.filter(f => f.id === 'profissional' || f.id === 'futebol').length).toBe(1);
    expect(semana(a).rotinas.some(r => r.id === 'futebol')).toBe(false);
    // Treinando todo dia no clube, o condicionamento não despenca sem causa.
    let b = a;
    const forma0 = b.corpo.forma;
    for (let k = 0; k < 3; k++) { b = avancarAno(b).vida; while (b.momento) b = responder(b, 'fisio'); }
    if (b.caminhos.esporte?.fase === 'profissional' && !lesaoAtiva(b)) expect(b.corpo.forma).toBeGreaterThanOrEqual(Math.min(forma0, 70));
  });
  it('a posição persiste e decide o que a temporada mede; as métricas mexem no mercado', () => {
    let v = atleta(22);
    v.caminhos.esporte!.posicao = 'goleiro';
    const g = fecharTemporada(clone(v), criarRng(4), clone(v).caminhos.esporte!);
    expect(g.gols).toBe(0);
    expect(g.defesa).toBeDefined();
    expect(linhaDaTemporada(v, g)).toMatch(/sem sofrer gol/);
    let golsA = 0; let golsZ = 0;
    for (let s = 1; s <= 12; s++) {
      const a = clone(v); a.caminhos.esporte!.posicao = 'atacante'; a.caminhos.esporte!.espaco = 'titular';
      const z = clone(v); z.caminhos.esporte!.posicao = 'zagueiro'; z.caminhos.esporte!.espaco = 'titular';
      golsA += fecharTemporada(a, criarRng(s), a.caminhos.esporte!).gols;
      golsZ += fecharTemporada(z, criarRng(s), z.caminhos.esporte!).gols;
    }
    expect(golsA).toBeGreaterThan(golsZ * 3);
    // Save/reload preserva posição e temporadas.
    v = transacao(v, (x, r) => { x.t += 12; processarEsporte(x, r); }).vida;
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo).toBe('ok');
    if (lido.tipo === 'ok') { expect(lido.vida.caminhos.esporte!.posicao).toBe('goleiro'); expect(lido.vida.caminhos.esporte!.temporadas).toEqual(v.caminhos.esporte!.temporadas); }
    // Uma temporada boa sobe o nome; uma ruim derruba.
    const boa = clone(v); boa.caminhos.frentes.futebol!.habilidade = 95; boa.corpo.forma = 90;
    const ruim = clone(v); ruim.caminhos.frentes.futebol!.habilidade = 55; ruim.corpo.forma = 40;
    fecharTemporada(boa, criarRng(1), boa.caminhos.esporte!); fecharTemporada(ruim, criarRng(1), ruim.caminhos.esporte!);
    expect(boa.caminhos.esporte!.reputacao!).toBeGreaterThan(ruim.caminhos.esporte!.reputacao!);
    expect(nivelQueOMercadoOferece(boa, boa.caminhos.esporte!)).toBeGreaterThan(nivelQueOMercadoOferece(ruim, ruim.caminhos.esporte!));
  });
  it('salário: uma fonte — contrato, Trabalho e Dinheiro dizem o mesmo; elite titular ganha muitas vezes o reserva do acesso', () => {
    const v = atleta(23);
    const e = v.caminhos.esporte!;
    expect(v.trabalho.atual!.salario).toBe(salarioDoContrato(v, e));
    const rem = remuneracaoDe(v.trabalho.atual!);
    expect(leituraDoTrabalho(v).renda).toContain(rem.liquido.toLocaleString('pt-BR'));
    expect(saldoMensal(v).linhas.some(l => l.valor === rem.mediaMensal && /líquid/.test(l.rotulo))).toBe(true);
    const elite = clone(v); elite.caminhos.esporte!.reputacao = 70;
    const acesso = clone(v); acesso.caminhos.esporte!.reputacao = 30;
    expect(salarioDoContrato(elite, elite.caminhos.esporte!, 4, 'titular')).toBeGreaterThan(salarioDoContrato(acesso, acesso.caminhos.esporte!, 2, 'reserva') * 10);
    // Renovar recalcula pela mesma fonte.
    const r = transacao(clone(v), x => { x.caminhos.esporte!.reputacao = 80; assinarContrato(x, x.caminhos.esporte!, 36); }).vida;
    expect(r.trabalho.atual!.salario).toBe(salarioDoContrato(r, r.caminhos.esporte!));
  });
  it('sem aposentadoria por idade fixa: o corpo declina, o mercado lê — e a carreira pode acabar por falta de clube', () => {
    const src = readFileSync(join(__dirname, '../sistemas/esporte.ts'), 'utf8');
    expect(src).not.toMatch(/encerrarCarreira\(v, e, 'idade'\)/);
    let aos36 = 0; let semContrato = 0; const notasJovem: number[] = []; const notasVelho: number[] = [];
    for (let s = 1; s <= 12; s++) {
      let v = atleta(s, 86, 3);
      v.caminhos.esporte!.foco = 'preservar';
      while (!v.morte && v.caminhos.esporte?.fase === 'profissional' && idade(v) < 44) {
        v = avancarAno(v).vida;
        while (v.momento) v = responder(v, v.momento.situacaoId === 'esp_renovacao' ? (v.momento.opcoes.find(o => o.id === 'renovar' && !o.bloqueio) ? 'renovar' : v.momento.opcoes.find(o => o.id === 'descer' && !o.bloqueio) ? 'descer' : 'mercado') : v.momento.situacaoId === 'sau_lesao' ? 'fisio' : 'recusar');
        const t = v.caminhos.esporte?.temporadas?.slice(-1)[0];
        if (t && idade(v) <= 27) notasJovem.push(t.nota);
        if (t && idade(v) >= 34) notasVelho.push(t.nota);
        if (idade(v) === 36 && v.caminhos.esporte?.fase === 'profissional') aos36++;
      }
      if (v.caminhos.esporte?.motivoFim === 'sem_contrato') semContrato++;
    }
    expect(aos36).toBeGreaterThan(0);          // há quem siga depois dos 35
    expect(semContrato).toBeGreaterThan(0);    // e há quem pare porque o mercado parou de chamar
    // O declínio é gradual e vem do corpo para a posição: a média das temporadas depois dos 34 é menor que a dos 20 e poucos.
    const m = (x: number[]) => x.reduce((a, b) => a + b, 0) / Math.max(1, x.length);
    expect(notasVelho.length).toBeGreaterThan(0);
    expect(m(notasJovem)).toBeGreaterThan(m(notasVelho));
  });
  it('contrato vencido não vale para sempre: se a conversa não acontece (outra decisão ocupou os anos), o clube decide', () => {
    let v = atleta(26, 60, 1);
    const e = v.caminhos.esporte!;
    e.contratoAte = v.t - 24; e.reputacao = 1;
    v = transacao(v, x => { x.eu.tNasc -= 12 * 18; }).vida;
    v = transacao(v, (x, r) => { x.t += 12; processarEsporte(x, r); }).vida;
    expect(v.trabalho.atual?.ocupacaoId).not.toBe('jogador_futebol');
    expect(v.fatos['esp_sem_clube']).toBe(v.t);
    // Um ano sem proposta: a carreira acaba pelo mercado, não por um aniversário.
    v = transacao(v, (x, r) => { x.t += 12; processarEsporte(x, r); }).vida;
    expect(v.caminhos.esporte!.fase).toBe('encerrada');
    expect(v.caminhos.esporte!.motivoFim).toBe('sem_contrato');
  });
  it('um evento genérico de emprego não vaza para o jogador: a recessão fala do clube', () => {
    const v = atleta(24);
    const d = conteudoPorId('mun_recessao')!;
    const ctx = { ...contexto(v, criarRng(1)), vezes: 0 };
    const n = d.tipo === 'acontecimento' ? d.narrar(ctx) : null;
    expect(n?.texto).toMatch(/clube|patrocínio/);
    expect(n?.texto).not.toMatch(/reuniões/);
  });
  it('destaque local ≠ nível de base: a leitura do tempo livre diz as duas réguas', () => {
    const v = trabalhador(15, 25);
    garantirFrente(v, 'futebol');
    const f = v.caminhos.frentes.futebol!; f.habilidade = 58; f.meses = 60; f.tUltimo = v.t;
    v.rotinas = [{ id: 'futebol', tInicio: v.t - 60, nivel: 2 }];
    expect(leituraDaFrente(v, 'futebol')).toMatch(/entre quem joga no seu nível.*base/);
  });
});

/* ================================================================ Artes */

describe('arte como carreira viva', () => {
  it('prática e habilidade mudam a recepção; a obra tem consumidores (público, renda, notoriedade)', () => {
    let boas = 0; let fracas = 0;
    for (let s = 1; s <= 20; s++) {
      const a = trabalhador(28, s); garantirFrente(a, 'musica'); a.caminhos.frentes.musica!.habilidade = 88;
      const b = trabalhador(28, s); garantirFrente(b, 'musica'); b.caminhos.frentes.musica!.habilidade = 35;
      boas += lancarObra(a, criarRng(s)).recepcao; fracas += lancarObra(b, criarRng(s)).recepcao;
    }
    expect(boas).toBeGreaterThan(fracas + 10);
    const v = trabalhador(30, 26); garantirFrente(v, 'musica'); v.caminhos.frentes.musica!.habilidade = 92;
    v.caminhos.arte = { linguagem: 'musica', nome: 'Maré Baixa', tipo: 'banda', tInicio: v.t - 60, publico: 70, membros: [], ativo: true };
    for (let s = 0; s < 3; s++) lancarObra(v, criarRng(40 + s));
    expect(v.caminhos.obras!.length).toBe(3);
    expect(alvoDaNotoriedade(v).fonte).toBe('arte');
    for (let k = 0; k < 4; k++) processarNotoriedade(v);
    expect(v.notoriedade!.valor).toBeGreaterThan(35);
    expect(rendaDeImagem(v)).toBeGreaterThan(0);
    expect(fechamentoDoAno(v).some(f => /obra/i.test(f.titulo))).toBe(true);
  });
});

/* ================================================================ Negócio */

describe('autônomo ≠ dono de negócio', () => {
  it('a dentista por conta é autônoma; montar o consultório é outra trajetória, com caixa, faturamento e risco', () => {
    let v = trabalhador(32, 27);
    v.educacao.concluidos.push({ cursoId: 'odontologia', nome: 'Odontologia', nivel: 'superior', area: 'odontologia', tFim: v.t - 60, instituicao: 'x' });
    v.educacao.escolaridade = 'superior'; v.trabalho.licencas.push('cro'); v.trabalho.experiencia['odontologia'] = 72;
    contratar(v, criarRng(1), ocupacao('dentista'));
    v.trabalho.atual!.clientela = 80;
    v.financas.conta = 90000;
    expect(modoDoTrabalho(v)).toBe('autonomo');
    const a = [...acoesDoTrabalho(v, disponibilidade).agora, ...acoesDoTrabalho(v, disponibilidade).mais].find(x => x.id === 'negocio')!;
    expect(a.rotulo).toMatch(/consultório/);
    expect(a.rotulo).not.toBe('Abrir o próprio negócio');
    expect(leituraDoTrabalho(v).vinculo).toMatch(/por conta própria/);
    v = transacao(v, (x, r) => { abrirNegocio(x, r, 'consultorio_odonto'); }).vida;
    const n = negocioAberto(v)!;
    // Dona agora: o vínculo diz isso (e não "por conta própria"), a tela é a do negócio.
    if (modoDoTrabalho(v) === 'negocio' && v.trabalho.atual) expect(leituraDoTrabalho(v).vinculo).toBe('dono do próprio negócio');
    expect(n.tipo).toBe('consultorio_odonto');
    v = avancarAno(v).vida; while (v.momento) v = responder(v);
    expect(negocioAberto(v)?.faturamentoAno).toBeDefined();
    expect(fechamentoDoAno(v).some(f => /consultório/.test(f.titulo))).toBe(true);
    v = transacao(v, x => fecharNegocio(x, 'teste')).vida;
    expect(negocioAberto(v)).toBeUndefined();
  });
});

/* ================================================================ Profissão comum */

describe('profissão comum com vida própria', () => {
  const advogada = (s = 28) => {
    const v = trabalhador(30, s);
    v.educacao.concluidos.push({ cursoId: 'direito', nome: 'Direito', nivel: 'superior', area: 'direito', tFim: v.t - 60, instituicao: 'x' });
    v.educacao.escolaridade = 'superior'; v.trabalho.licencas.push('oab'); v.trabalho.experiencia['direito'] = 60;
    contratar(v, criarRng(1), ocupacao('advogado_jr'));
    v.trabalho.atual!.tInicio = v.t - 60;
    return v;
  };
  const abrir = (v: Vida, id: string) => transacao(v, (x, r) => { const d = conteudoPorId(id)!; if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
  it('área → desafio → feitos → desempenho; a área vai junto para o próximo emprego; sair para a conta própria', () => {
    let v = abrir(advogada(), 'ofi_area');
    expect(v.momento?.opcoes.map(o => o.id)).toContain('a0');
    v = executar(v, { tipo: 'decidir', opcaoId: 'a1' }).vida;
    expect(v.trabalho.atual!.especialidade).toBe('direito trabalhista');
    let deu = 0;
    for (let s = 1; s <= 10; s++) {
      let x = abrir(clone(v), 'ofi_desafio'); x.rng = s * 313;
      expect(x.momento?.texto.length).toBeGreaterThan(10);
      x = executar(x, { tipo: 'decidir', opcaoId: 'encarar' }).vida;
      if ((x.trabalho.atual!.feitos ?? 0) > 0) { deu++; expect(x.trabalho.atual!.desempenho).toBeGreaterThan(v.trabalho.atual!.desempenho); }
    }
    expect(deu).toBeGreaterThan(0);
    v.trabalho.atual!.feitos = 2;
    v = abrir(v, 'ofi_conta_propria');
    expect(v.momento?.situacaoId).toBe('ofi_conta_propria');
    v = executar(v, { tipo: 'decidir', opcaoId: 'sair' }).vida;
    expect(v.trabalho.atual!.ocupacaoId).toBe('advogado');
    expect(v.trabalho.atual!.contrato).toBe('autonomo');
    expect(v.trabalho.atual!.especialidade).toBe('direito trabalhista');
    expect(modoDoTrabalho(v)).toBe('autonomo');
  });
});

/* ================================================================ Família */

describe('gravidez conhecida persiste até o nascimento', () => {
  it('descoberta num ano, bebê no seguinte: a gravidez existe no mundo (e em "Pede atenção") antes do bebê', () => {
    for (let s = 1; s <= 10; s++) {
      let v = trabalhador(30, 30 + s);
      const { p } = comParceiro(v, { estagio: 'casamento', anos: 4, genero: v.corpo.podeGestar ? 'masculino' : 'feminino' });
      v.vinculos[p.id].romance!.planoFilhos = 'tentando';
      v = transacao(v, (x, r) => { x.rng = s * 7; processarConcepcao(x, fixo(0.01)); processarGestacoes(x, r); void r; }).vida;
      const g = gestacaoEmCurso(v);
      expect(g).toBeTruthy();
      expect(g!.descoberta).toBe(true);
      expect(g!.tParto).toBeGreaterThan(v.t);
      expect(sinaisSociais(v).some(x => x.escopo === 'global' && /bebê/.test(x.texto))).toBe(true);
      v = transacao(v, (x, r) => { x.t += 12; const bebe = processarGestacoes(x, r); if (bebe) { expect(bebe.genitores).toContain(p.id); expect(x.vinculos[bebe.id].parentesco).toBe('filho'); } }).vida;
    }
  });
});

/* ================================================================ Fases, save, determinismo */

describe('fonte única das fases da vida, migração v16 → v17, determinismo', () => {
  it('aos 28, nenhuma tela chama de juventude; motor e tela usam a mesma tabela', () => {
    expect(faseDaVida(28)).toBe('Vida adulta');
    expect(faseDeIdade(28)).toBe('adulto');
    for (let i = 0; i <= 90; i++) expect(faseDaVida(i)).toBe(capituloDaVida(i));
    expect(faseDaVida(22)).toBe('Juventude');
    expect(faseDeIdade(22)).toBe('jovem');
  });
  it('saves v16 reais migram: o profissional perde a rotina de base duplicada, ganha posição e reputação derivadas (sem acaso); idempotente', () => {
    for (const nome of ['save-v16-jogador-profissional.json', 'save-v16-adulta-amigos.json', 'save-v16-adulto-familia.json']) {
      const bruto = readFileSync(join(__dirname, 'fixtures', nome), 'utf8');
      const a = interpretar(bruto); const b = interpretar(bruto);
      expect(a.tipo).toBe('ok');
      if (a.tipo !== 'ok' || b.tipo !== 'ok') continue;
      expect(a.vida.versao).toBe(VERSAO_SAVE);
      expect(VERSAO_SAVE).toBe(18); // REWORK 3: v18 (origem, vivências, estilo).
      expect(a.vida).toEqual(b.vida);
      expect(migrarV17(migrarV16(clone(a.vida)))).toEqual(a.vida); // REWORK 3: a cadeia vai até a v18.
      const e = a.vida.caminhos.esporte;
      if (e?.fase === 'profissional') {
        expect(a.vida.rotinas.some(r => r.id === 'futebol')).toBe(false);
        expect(e.posicao).toBeDefined();
        expect(e.reputacao).toBeGreaterThan(0);
        expect(JSON.parse(bruto).trabalho.atual.salario).toBe(a.vida.trabalho.atual!.salario); // o contrato assinado continua valendo
      }
      // A vida segue: três anos, salva e reabre igual.
      let v = a.vida;
      for (let k = 0; k < 3 && !v.morte; k++) { v = avancarAno(v).vida; while (v.momento) v = responder(v); }
      const de = interpretar(JSON.stringify(v));
      expect(de.tipo).toBe('ok');
      if (de.tipo === 'ok') expect(de.vida).toEqual(v);
    }
  });
  it('mesma semente + mesmos comandos = mesma vida (com os sistemas novos em jogo)', () => {
    const jogar = () => {
      let v = nova({ semente: 77 });
      for (let k = 0; k < 40 && !v.morte; k++) {
        if (idade(v) === 8) v = executar(v, { tipo: 'rotina', id: 'futebol', ativa: true, nivel: 3 }).vida;
        if (idade(v) === 20) v = executar(v, { tipo: 'rotina', id: 'voluntariado', ativa: true, nivel: 1 }).vida;
        for (const { p, vin } of vinculosVivos(v)) if (vin.chamado) v = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'chamado_sim' }).vida;
        v = avancarAno(v).vida;
        while (v.momento) v = responder(v);
      }
      return v;
    };
    expect(jogar()).toEqual(jogar());
    void clamp;
  });
});
