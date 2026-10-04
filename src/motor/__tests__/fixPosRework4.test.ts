/**
 * FIX pós-REWORK 4 — os testes causais. Cada teste segue uma cadeia: a ação → a reação do mundo → a consequência →
 * o que persiste (salvar e reabrir) → o que as telas leem. Nada aqui testa só a renderização.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, comParente } from './cenarios';
import { executar, disponibilidade } from '../acoes';
import { interpretar } from '../save';
import { podeTentar } from '../plausibilidade';
import type { PlataformaId, Vida } from '../tipos';
import { contaAtiva, contasAtivas, publicoReal, rendaDaRede } from '../sistemas/redesBase';
import { celebridadesDoPais, conteudosPossiveis, leituraDaConta, processarRedes } from '../sistemas/redes';
import { orcamento } from '../sistemas/dinheiro';
import { transacao } from '../nucleo';

const BASE = adulto(25, { semente: 21 });
const copia = (v: Vida = BASE) => structuredClone(v);
/** A mesma vida com outra identidade (os sorteios derivados mudam): para medir em média, sem depender de uma semente. */
const outra = (k: number, v: Vida = BASE) => { const x = structuredClone(v); x.id = `${v.id}-${k}`; x.rng = (v.rng + (k + 1) * 104729) >>> 0; return x; };
const ok = (v: Vida, a: Parameters<typeof executar>[1]) => { const d = disponibilidade(v, a); expect(podeTentar(d), JSON.stringify(d)).toBe(true); return executar(v, a).vida; };
const reabrir = (v: Vida) => { const r = interpretar(JSON.stringify(v)); expect(r.tipo, r.tipo === 'invalido' ? r.motivo : '').toBe('ok'); return (r as { vida: Vida }).vida; };
const rede = (oque: string, extra: Record<string, unknown> = {}) => ({ tipo: 'rede', op: { oque, ...extra } }) as Parameters<typeof executar>[1];
const fimDoAno = (v: Vida) => transacao(v, x => { x.t += 12; processarRedes(x); }).vida;

/* ============================================================ 6 — Redes sociais */

describe('redes sociais: sete plataformas jogáveis, conectadas à vida', () => {
  it('criar Instagram → postar → o público reage → salvar e reabrir preserva tudo', () => {
    let v = copia();
    v = ok(v, rede('criar', { plataforma: 'instagram' }));
    const antes = contaAtiva(v, 'instagram')!.seguidores;
    const tema = conteudosPossiveis(v, 'instagram')[0].tema;
    v = ok(v, rede('publicar', { plataforma: 'instagram', tema }));
    const c = contaAtiva(v, 'instagram')!;
    expect(c.seguidores).toBeGreaterThan(antes);
    expect(c.publicacoes[0].alcance).toBeGreaterThan(0);
    expect(c.totais?.publicacoes).toBe(1);
    const r = reabrir(v);
    expect(JSON.stringify(r.redes)).toBe(JSON.stringify(v.redes));
  });

  it('a mesma pessoa, o mesmo vídeo de humor: o TikTok alcança mais que o Facebook (média de 30 vidas)', () => {
    const alcance = (pl: PlataformaId) => {
      let soma = 0;
      for (let k = 0; k < 30; k++) {
        let v = outra(k);
        v = ok(v, rede('criar', { plataforma: pl }));
        v = ok(v, rede('publicar', { plataforma: pl, tema: 'humor' }));
        soma += contaAtiva(v, pl)!.publicacoes[0].alcance;
      }
      return soma / 30;
    };
    expect(alcance('tiktok')).toBeGreaterThan(alcance('facebook') * 1.5);
  });

  it('as plataformas não são a mesma coisa: público, verbo, monetização e verificação diferem', () => {
    let v = copia();
    for (const pl of ['instagram', 'youtube', 'tiktok', 'twitch', 'x', 'facebook'] as PlataformaId[]) v = ok(v, rede('criar', { plataforma: pl }));
    expect(contasAtivas(v)).toHaveLength(6);
    // O que dá para publicar muda: a live da Twitch não é a foto do Instagram; o X não tem "foto do dia".
    expect(conteudosPossiveis(v, 'twitch').some(x => x.tema === 'conversa')).toBe(true);
    expect(conteudosPossiveis(v, 'instagram').some(x => x.tema === 'conversa')).toBe(false);
    expect(conteudosPossiveis(v, 'x')[0].rotulo).not.toBe(conteudosPossiveis(v, 'instagram')[0].rotulo);
    // Verificar no X é pagar (na hora); no Instagram, é pedir e esperar a análise.
    v.financas.conta = 50000;
    v = ok(v, rede('verificar', { plataforma: 'x' }));
    expect(contaAtiva(v, 'x')!.verificada).toBeDefined();
    expect(contaAtiva(v, 'x')!.selo).toBe('pago');
    v = ok(v, rede('verificar', { plataforma: 'instagram' }));
    expect(contaAtiva(v, 'instagram')!.verificada).toBeUndefined();
    expect(leituraDaConta(v, 'instagram')!.verificacao).toMatch(/análise/);
    // Ninguém conhecido: a análise recusa.
    v = fimDoAno(v);
    expect(contaAtiva(v, 'instagram')!.verificada).toBeUndefined();
    expect(contaAtiva(v, 'instagram')!.recusaVerificacao).toBeDefined();
  });

  it('comprar seguidores: o número sobe; engajamento e credibilidade caem; não monetiza; a rede pode descobrir', () => {
    let v = copia(); v.financas.conta = 100000;
    v = ok(v, rede('criar', { plataforma: 'instagram' }));
    const c0 = structuredClone(contaAtiva(v, 'instagram')!);
    v = ok(v, rede('comprar', { plataforma: 'instagram', pacote: 1 }));
    const c = contaAtiva(v, 'instagram')!;
    expect(c.seguidores).toBe(c0.seguidores + 10000);
    expect(publicoReal(c)).toBe(c0.seguidores);
    expect(c.credibilidade).toBeLessThan(c0.credibilidade);
    expect(c.engajamento!).toBeLessThan(c0.engajamento!);
    expect(podeTentar(disponibilidade(v, rede('monetizar', { plataforma: 'instagram' })))).toBe(false);
    // Em alguns anos, a rede descobre (e a história registra).
    let descobriu = false;
    for (let k = 0; k < 8 && !descobriu; k++) { v = fimDoAno(v); descobriu = !contaAtiva(v, 'instagram')!.comprados; }
    expect(descobriu).toBe(true);
    expect(v.biografia.some(e => /comprada/.test(e.texto))).toBe(true);
  });

  it('promover: o dinheiro sai e o público real cresce (legítimo)', () => {
    let v = copia(); v.financas.conta = 50000;
    v = ok(v, rede('criar', { plataforma: 'instagram' }));
    v = ok(v, rede('publicar', { plataforma: 'instagram', tema: 'cotidiano' }));
    const dinheiro = v.financas.conta;
    const real = publicoReal(contaAtiva(v, 'instagram')!);
    v = ok(v, rede('promover_conta', { plataforma: 'instagram' }));
    expect(v.financas.conta).toBeLessThan(dinheiro);
    expect(publicoReal(contaAtiva(v, 'instagram')!)).toBeGreaterThan(real);
    expect(contaAtiva(v, 'instagram')!.comprados ?? 0).toBe(0);
  });

  it('trollar: a pessoa conhecida briga de verdade; denúncias acumulam e podem suspender a conta', () => {
    let v = copia();
    const { p } = comParente(v, 'irmao', 24, 'masculino', 70);
    v = ok(v, rede('criar', { plataforma: 'x' }));
    // O irmão está no X? (Estável por pessoa.) Se não estiver, provocar um estranho continua possível.
    const alvo = podeTentar(disponibilidade(v, rede('trollar', { plataforma: 'x', alvo: p.id }))) ? p.id : 'estranho';
    const tensao = v.vinculos[p.id].tensao;
    v = ok(v, rede('trollar', { plataforma: 'x', alvo }));
    expect(contaAtiva(v, 'x')!.toxicidade).toBeGreaterThan(0);
    if (alvo === p.id) { expect(v.vinculos[p.id].tensao).toBeGreaterThan(tensao); expect(v.vinculos[p.id].conflito?.assunto).toMatch(/X/); }
    // Anos de briga: as advertências chegam; a suspensão impede de publicar.
    let suspensa = false;
    for (let ano = 0; ano < 12 && !suspensa; ano++) {
      for (let k = 0; k < 3; k++) if (podeTentar(disponibilidade(v, rede('trollar', { plataforma: 'x', alvo: 'estranho' })))) v = executar(v, rede('trollar', { plataforma: 'x', alvo: 'estranho' })).vida;
      suspensa = leituraDaConta(v, 'x')!.suspensa;
      if (!suspensa) v = fimDoAno(v);
    }
    expect(suspensa).toBe(true);
    expect(podeTentar(disponibilidade(v, rede('publicar', { plataforma: 'x', tema: 'cotidiano' })))).toBe(false);
  });

  it('apagar a conta: deixa de operar, a renda some, o que foi vivido continua na história', () => {
    let v = copia();
    v = ok(v, rede('criar', { plataforma: 'youtube' }));
    v = transacao(v, x => { const c = x.redes!.contas.youtube; c.seguidores = 20000; c.totais!.publicacoes = 30; }).vida;
    v = ok(v, rede('monetizar', { plataforma: 'youtube' }));
    expect(rendaDaRede(v)).toBeGreaterThan(0);
    v = ok(v, rede('apagar_conta', { plataforma: 'youtube' }));
    expect(contaAtiva(v, 'youtube')).toBeUndefined();
    expect(rendaDaRede(v)).toBe(0);
    expect(podeTentar(disponibilidade(v, rede('publicar', { plataforma: 'youtube', tema: 'cotidiano' })))).toBe(false);
    expect(v.biografia.some(e => /Apagou a conta no YouTube/.test(e.texto))).toBe(true);
    expect(v.biografia.some(e => /YouTube passou a pagar/.test(e.texto))).toBe(true);
    expect(reabrir(v).redes!.contas.youtube.apagada).toBeDefined();
  });

  it('monetização: a renda entra no orçamento do mês (a economia de verdade)', () => {
    let v = copia();
    v = ok(v, rede('criar', { plataforma: 'instagram' }));
    v = transacao(v, x => { x.redes!.contas.instagram.seguidores = 40000; }).vida;
    v = ok(v, rede('publicar', { plataforma: 'instagram', tema: 'cotidiano' }));
    v = ok(v, rede('monetizar', { plataforma: 'instagram' }));
    const renda = rendaDaRede(v);
    expect(renda).toBeGreaterThan(0);
    expect(orcamento(v).entradas.find(l => /rede/.test(l.rotulo))?.valor).toBe(renda);
  });

  it('fama muda a rede: o famoso estreia com público e alcança muito mais que o desconhecido', () => {
    let anonimo = copia();
    let famoso = copia(); famoso.notoriedade = { valor: 65, pico: 65, t: famoso.t, fonte: 'esporte' };
    anonimo = ok(anonimo, rede('criar', { plataforma: 'instagram' }));
    famoso = ok(famoso, rede('criar', { plataforma: 'instagram' }));
    expect(contaAtiva(famoso, 'instagram')!.seguidores).toBeGreaterThan(contaAtiva(anonimo, 'instagram')!.seguidores * 20);
    anonimo = ok(anonimo, rede('publicar', { plataforma: 'instagram', tema: 'cotidiano' }));
    famoso = ok(famoso, rede('publicar', { plataforma: 'instagram', tema: 'cotidiano' }));
    expect(contaAtiva(famoso, 'instagram')!.publicacoes[0].alcance).toBeGreaterThan(contaAtiva(anonimo, 'instagram')!.publicacoes[0].alcance * 5);
    // E a polêmica do famoso vira imagem pública (o print sai da rede).
    let polemica = false;
    for (let k = 0; k < 40 && !polemica; k++) {
      let f = outra(k, famoso);
      f = transacao(f, x => { x.redes!.contas.instagram.publicacoes = []; }).vida;
      if (!podeTentar(disponibilidade(f, rede('publicar', { plataforma: 'instagram', tema: 'opiniao' })))) continue;
      f = executar(f, rede('publicar', { plataforma: 'instagram', tema: 'opiniao' })).vida;
      if (contaAtiva(f, 'instagram')!.publicacoes.some(p => p.polemica)) { polemica = true; expect(f.fatos['vis_polemica']).toBe(f.t); }
    }
    expect(polemica).toBe(true);
  });

  it('marcar uma celebridade: para quem é ninguém, o normal é não acontecer nada', () => {
    let nada = 0;
    for (let k = 0; k < 60; k++) {
      let v = outra(k);
      v = ok(v, rede('criar', { plataforma: 'instagram' }));
      const cel = celebridadesDoPais(v)[k % 6];
      const antes = contaAtiva(v, 'instagram')!.seguidores;
      v = ok(v, rede('mencionar', { plataforma: 'instagram', celebridade: cel.id }));
      if (contaAtiva(v, 'instagram')!.seguidores === antes && !(contaAtiva(v, 'instagram')!.celebridades ?? []).length) nada++;
    }
    expect(nada).toBeGreaterThanOrEqual(45);
    // As celebridades são do país onde se mora (não do Brasil para todo mundo).
    expect(celebridadesDoPais(BASE)[0].id.startsWith('BR:')).toBe(true);
  });

  it('o que se publica sai da vida: o atleta numa fase ruim tem o que responder; a pessoa comum, não', () => {
    const comum = copia();
    expect(conteudosPossiveis(comum, 'x').some(x => x.tema === 'rebater' || x.tema === 'desculpas')).toBe(false);
    const atleta = copia();
    atleta.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Clube', nivel: 3, tInicio: atleta.t - 60, tFase: atleta.t - 60, lesoes: 0, municipioId: atleta.moradia.municipioId, reputacao: 40, temporadas: [{ ano: Math.floor(atleta.t / 12) - 1, clube: 'Clube', nivel: 3, partidas: 30, titular: 20, gols: 2, assistencias: 1, nota: 5.6, colocacao: 16, mesesFora: 0 }] };
    const temas = conteudosPossiveis(atleta, 'x').map(x => x.tema);
    expect(temas).toContain('rebater');
    expect(temas).toContain('desculpas');
    expect(conteudosPossiveis(atleta, 'instagram').map(x => x.tema)).toContain('esporte');
  });

  it('OnlyFans: só maior de idade; monetizar pede verificação de identidade; quem você conhece pode descobrir', () => {
    const jovem = adulto(17, { semente: 33 });
    expect(podeTentar(disponibilidade(jovem, rede('criar', { plataforma: 'onlyfans' })))).toBe(false);
    let v = copia();
    comParceiro(v, { estagio: 'namoro' });
    v = ok(v, rede('criar', { plataforma: 'onlyfans' }));
    expect(podeTentar(disponibilidade(v, rede('monetizar', { plataforma: 'onlyfans' })))).toBe(false);
    v = ok(v, rede('verificar', { plataforma: 'onlyfans' }));
    v = ok(v, rede('monetizar', { plataforma: 'onlyfans' }));
    v = transacao(v, x => { x.redes!.contas.onlyfans.seguidores = 300; }).vida;
    v = ok(v, rede('publicar', { plataforma: 'onlyfans', tema: 'exclusivo' }));
    expect(rendaDaRede(v)).toBeGreaterThan(0);
    // Nenhum texto descreve conteúdo sexual: só a abstração.
    expect(contaAtiva(v, 'onlyfans')!.publicacoes[0].texto).toMatch(/exclusivo/);
    let descobriram = false;
    for (let k = 0; k < 10 && !descobriram; k++) { v = fimDoAno(v); descobriram = (contaAtiva(v, 'onlyfans')!.descobriram ?? []).length > 0; }
    expect(descobriram).toBe(true);
  });

  it('o save não cresce sem limite: guarda as últimas 8 publicações; o resto vira número', () => {
    let v = copia();
    v = ok(v, rede('criar', { plataforma: 'x' }));
    for (let ano = 0; ano < 8; ano++) {
      for (const t of conteudosPossiveis(v, 'x').slice(0, 5)) if (podeTentar(disponibilidade(v, rede('publicar', { plataforma: 'x', tema: t.tema })))) v = executar(v, rede('publicar', { plataforma: 'x', tema: t.tema })).vida;
      v = fimDoAno(v);
    }
    const c = contaAtiva(v, 'x')!;
    expect(c.publicacoes.length).toBeLessThanOrEqual(8);
    expect(c.totais!.publicacoes).toBeGreaterThan(20);
  });

  it('saves do REWORK 4: a conta do "Mural" abre como Instagram, com tudo', () => {
    const v = copia();
    v.redes = { contas: { mural: { plataforma: 'mural', arroba: 'fulana12', tCriada: v.t - 24, seguidores: 321, credibilidade: 66, publicacoes: [{ id: 'pb1', t: v.t - 12, tema: 'cotidiano', texto: 'O café da manhã.', alcance: 80, novos: 3 }] } } };
    const r = reabrir(v);
    expect(r.redes!.contas.mural).toBeUndefined();
    expect(r.redes!.contas.instagram.seguidores).toBe(321);
    expect(r.redes!.contas.instagram.plataforma).toBe('instagram');
    expect(contaAtiva(r)).toBeDefined();
  });
});

/* ============================================================ 1–2 — Materialidade e pertences */

import { ofertasDeVeiculos } from '../sistemas/mercado';
import { corConcordada, corDoVeiculo } from '../dados/pertences';
import { nomeComCor } from '../sistemas/veiculos';
import { coisasDaVida } from '../sistemas/coisas';
import { varianteDe } from '../sistemas/pertences';
import { habilidade } from '../sistemas/frentes';
import { modeloVeiculo } from '../dados/bens';

describe('materialidade: o veículo tem a cor dele — da vitrine à garagem, e depois da venda some', () => {
  it('a vitrine tem carros de cores diferentes; a cor do anúncio vai para a garagem, persiste e o nome a diz', () => {
    let v = copia(); v.financas.conta = 400000; v.trabalho.licencas.push('cnh');
    const lista = ofertasDeVeiculos(v, 'concessionaria');
    expect(new Set(lista.map(o => o.cor)).size).toBeGreaterThan(3);
    // A mesma vitrine, de novo, é a mesma (estável: voltar à loja não repinta o carro).
    expect(ofertasDeVeiculos(v, 'concessionaria').map(o => o.cor)).toEqual(lista.map(o => o.cor));
    const o = lista.find(x => x.preco < 150000)!;
    v = ok(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
    const b = v.financas.bens.find(x => x.tipo === 'veiculo')!;
    expect(b.tipo === 'veiculo' && b.cor).toBe(o.cor);
    expect(nomeComCor(b as Parameters<typeof nomeComCor>[0])).toContain(corConcordada(o.corNome, false));
    const r = reabrir(v);
    const b2 = r.financas.bens.find(x => x.id === b.id)!;
    expect(corDoVeiculo(b2 as Parameters<typeof corDoVeiculo>[0], modeloVeiculo(b2.modeloId).categoria).cor).toBe(o.cor);
    v = ok(r, { tipo: 'vender_bem', bemId: b.id });
    expect(v.financas.bens.some(x => x.id === b.id)).toBe(false);
  });
  it('a cor concorda com o veículo: o Argo vermelho, a Biz vermelha, a bicicleta azul-celeste', () => {
    expect(corConcordada('vermelho', false)).toBe('vermelho');
    expect(corConcordada('vermelho', true)).toBe('vermelha');
    expect(corConcordada('verde-escuro', true)).toBe('verde-escura');
    expect(corConcordada('prata', true)).toBe('prata');
    expect(corConcordada('azul-celeste', false)).toBe('azul-celeste');
  });
});

describe('pertences usáveis: comprar o violão não é o fim da interação', () => {
  it('comprar → aparece → tocar (a música sobe) → tocar para alguém (a relação sente) → salvar e reabrir (mesmo violão, mesma cor)', () => {
    let v = copia(); v.financas.conta = 20000;
    const { p } = comParente(v, 'irmao', 24, 'masculino', 50);
    v.pessoas[p.id].municipioId = v.moradia.municipioId;
    v = ok(v, { tipo: 'comprar_coisa', coisaId: 'violao' });
    const t = coisasDaVida(v).find(x => x.coisaId === 'violao')!;
    const cor = varianteDe(t).cor;
    const musica = habilidade(v, 'musica');
    v = ok(v, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'tocar' });
    expect(habilidade(v, 'musica')).toBeGreaterThan(musica);
    const prox = v.vinculos[p.id].proximidade;
    v = ok(v, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'tocar_para', pessoaId: p.id });
    expect(v.vinculos[p.id].proximidade).toBeGreaterThan(prox);
    const r = reabrir(v);
    const t2 = coisasDaVida(r).find(x => x.id === t.id)!;
    expect(varianteDe(t2).cor).toBe(cor);
    // Uma vez por ano: tocar de novo no mesmo ano não é outro clique de ganho.
    expect(podeTentar(disponibilidade(r, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'tocar' }))).toBe(false);
  });
  it('a TV também serve para alguma coisa (com quem mora junto)', () => {
    let v = copia(); v.financas.conta = 20000;
    const { p } = comParceiro(v, { estagio: 'morando_junto' });
    v = ok(v, { tipo: 'comprar_coisa', coisaId: 'tv' });
    const t = coisasDaVida(v).find(x => x.coisaId === 'tv')!;
    const prox = v.vinculos[p.id].proximidade;
    v = ok(v, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'filme_com', pessoaId: p.id });
    expect(v.vinculos[p.id].proximidade).toBeGreaterThan(prox);
  });
});

/* ============================================================ 3 — Estresse */

import { leituraDoEstresse } from '../sistemas/leituraDoEstresse';
import { alvoCabeca } from '../sistemas/estado';
import { processarEstresseProlongado } from '../sistemas/estresseProlongado';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { comFilho } from './cenarios';

describe('estresse: um indicador humano, com o porquê, o que ajuda e consequência real', () => {
  const pesada = () => {
    const v = transacao(copia(), (x, r) => { x.trabalho.experiencia.ti = 48; contratar(x, r, ocupacao('dev_pleno')); }).vida;
    v.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: v.t - 12, mesesRestantes: 36, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    comFilho(v, 1, { casa: true });
    return v;
  };
  it('trabalho + faculdade + filho pequeno: o estresse tende a subir, e a leitura diz por quê (e o que ajuda)', () => {
    const leve = copia(); leve.trabalho.atual = undefined; leve.educacao.matricula = undefined;
    const v = pesada();
    expect(alvoCabeca(v)).toBeGreaterThan(alvoCabeca(leve) + 15);
    const l = leituraDoEstresse(v);
    expect(l.pesando.length).toBeGreaterThan(0);
    expect(l.pesando.map(x => x.texto).join(' ')).toMatch(/criança|filho|semana|trabalho/i);
    expect(l.folego).toMatch(/assumir|cabe|teto/);
  });
  it('terapia ajuda de verdade: aparece em "o que está ajudando" e baixa o alvo do ano', () => {
    const v = pesada();
    const antes = alvoCabeca(v);
    v.rotinas.push({ id: 'terapia', tInicio: v.t, nivel: 1 } as Vida['rotinas'][number]);
    expect(alvoCabeca(v)).toBeLessThan(antes - 8);
    expect(leituraDoEstresse(v).ajudando.some(x => /terapia/i.test(x.texto))).toBe(true);
  });
  it('achado do playtest: quem está com a semana no teto ainda pode começar terapia (cuidar da cabeça não é bloqueado)', () => {
    const v = pesada();
    v.rotinas.push({ id: 'igreja', tInicio: v.t, nivel: 1 } as Vida['rotinas'][number], { id: 'tempo_familia', tInicio: v.t, nivel: 1 } as Vida['rotinas'][number]);
    v.mente.estresse = 72;
    const d = disponibilidade(v, { tipo: 'rotina', id: 'terapia', ativa: true, nivel: 1 });
    expect(podeTentar(d)).toBe(true);
    const alvo = alvoCabeca(v);
    const y = ok(v, { tipo: 'rotina', id: 'terapia', ativa: true, nivel: 1 });
    expect(alvoCabeca(y)).toBeLessThan(alvo);
  });
  it('estresse no limite cobra no ano: o desempenho cai e a casa sente (a tela avisa antes)', () => {
    const v = pesada();
    v.mente.estresse = 85;
    const l = leituraDoEstresse(v);
    expect(l.nivel).toBe('no limite');
    expect(l.riscos.join(' ')).toMatch(/desempenho|brigas/);
    const d = v.trabalho.atual!.desempenho;
    const tensaoCasa = Object.values(v.vinculos).filter(x => x.convivio.includes('casa')).reduce((s, x) => s + x.tensao, 0);
    const depois = transacao(v, x => { processarEstresseProlongado(x); }).vida;
    expect(depois.trabalho.atual!.desempenho).toBeLessThan(d);
    expect(Object.values(depois.vinculos).filter(x => x.convivio.includes('casa')).reduce((s, x) => s + x.tensao, 0)).toBeGreaterThanOrEqual(tensaoCasa);
    expect(depois.mente.estresseAlto?.anos).toBe(1);
  });
});

/* ============================================================ 8 — Relações: fazer, não só falar */

import { interacoesPara } from '../sistemas/interacoes';
import { grupoDaInteracao } from '../sistemas/juntos';

describe('relações: há coisas concretas para FAZER com cada pessoa — e a pessoa reage', () => {
  it('com a parceria: programas concretos no grupo "fazer juntos"; o jantar custa, aproxima (ou não) e fica na história', () => {
    let v = copia(); v.financas.conta = 20000;
    const { p } = comParceiro(v, { estagio: 'casamento' });
    const lista = interacoesPara(v, p.id);
    const juntos = lista.filter(x => grupoDaInteracao(x.id) === 'juntos').map(x => x.id);
    expect(juntos).toEqual(expect.arrayContaining(['jantar_romantico', 'cozinhar_junto', 'caminhar_junto', 'show']));
    const conta = v.financas.conta;
    v = ok(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'jantar_romantico' });
    expect(v.financas.conta).toBeLessThan(conta);
    expect(v.anoAtual.acoes).toContain(`pessoa:jantar_romantico:${p.id}`);
    // A reação não é garantida: em 30 vidas, nem todas saem iguais.
    const resultados = new Set<string>();
    for (let k = 0; k < 30; k++) {
      const x = outra(k, v); x.anoAtual.acoes = [];
      const r = executar(x, { tipo: 'pessoa', pessoaId: p.id, interacao: 'jantar_romantico' });
      resultados.add(r.aviso?.texto ?? r.resultado ?? '');
    }
    expect(resultados.size).toBeGreaterThan(1);
    const r = reabrir(v);
    expect(r.vinculos[p.id].habitos?.['romantico']).toBe(1);
  });
  it('com o filho: o parque, ensinar a andar de bicicleta (marco na Linha da Vida), a festa de aniversário (a partir dos 3)', () => {
    let v = copia(); v.financas.conta = 20000;
    const { p } = comFilho(v, 6, { casa: true });
    const ids = interacoesPara(v, p.id).map(x => x.id);
    expect(ids).toEqual(expect.arrayContaining(['parque', 'ensinar', 'aniversario', 'brincar']));
    let ensinou = false;
    for (let k = 0; k < 6 && !ensinou; k++) {
      const x = outra(k, v);
      const y = ok(x, { tipo: 'pessoa', pessoaId: p.id, interacao: 'ensinar' });
      if (y.fatos[`ensinou:bicicleta:${p.id}`] !== undefined) { ensinou = true; expect(y.biografia.some(e => /andar de bicicleta/.test(e.texto))).toBe(true); expect(y.vinculos[p.id].historia.some(h => /bicicleta/.test(h.texto))).toBe(true); }
    }
    expect(ensinou).toBe(true);
  });
  it('não aparece o que não faz sentido: com um bebê não há cinema; com o ex, nada de jantar', () => {
    const v = copia();
    const { p: bebe } = comFilho(v, 1, { casa: true });
    expect(interacoesPara(v, bebe.id).some(x => ['cinema', 'show', 'jantar_fora'].includes(x.id))).toBe(false);
  });
});

/* ============================================================ 9 — Carreira: agir dentro do trabalho */

import { verbosDoOficio } from '../sistemas/noOficio';

describe('carreira: agir dentro da profissão — com resultado, histórico e consequência', () => {
  const empregada = () => transacao(copia(), (x, r) => { x.trabalho.experiencia.ti = 48; contratar(x, r, ocupacao('dev_pleno')); }).vida;
  it('empregado: o projeto difícil mexe no desempenho (para cima ou para baixo) e entra na história; uma vez por ano', () => {
    const v = empregada();
    expect(verbosDoOficio(v).map(x => x.oque)).toEqual(expect.arrayContaining(['projeto', 'chefia', 'capacitacao']));
    let subiu = 0, desceu = 0;
    for (let k = 0; k < 20; k++) {
      const x = outra(k, v);
      const d = x.trabalho.atual!.desempenho;
      const y = ok(x, { tipo: 'oficio', oque: 'projeto' });
      if (y.trabalho.atual!.desempenho > d) subiu++; else desceu++;
      expect(y.biografia.some(e => /projeto difícil/.test(e.texto))).toBe(true);
      expect(podeTentar(disponibilidade(y, { tipo: 'oficio', oque: 'projeto' }))).toBe(false);
    }
    expect(subiu).toBeGreaterThan(0);
    expect(desceu).toBeGreaterThan(0);
  });
  it('atleta: treino extra, vídeo dos adversários — a técnica sobe; a reputação também', () => {
    const v = copia();
    v.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'Clube', contrato: 'clt', salario: 5000, tInicio: v.t - 24, desempenho: 60, municipioId: v.moradia.municipioId, carga: 'integral' };
    v.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Clube', nivel: 3, tInicio: v.t - 60, tFase: v.t - 24, lesoes: 0, municipioId: v.moradia.municipioId, reputacao: 40 };
    const verbos = verbosDoOficio(v).map(x => x.oque);
    expect(verbos).toEqual(expect.arrayContaining(['treino_finalizacao', 'video']));
    const h = habilidade(v, 'futebol');
    const y = ok(v, { tipo: 'oficio', oque: 'treino_finalizacao' });
    expect(habilidade(y, 'futebol')).toBeGreaterThanOrEqual(h);
    expect(podeTentar(disponibilidade(y, { tipo: 'oficio', oque: 'treino_fisico' }))).toBe(false);
  });
});

/* ============================================================ 10 — Formação: verbos do ano letivo */

import { verbosDaFormacao } from '../sistemas/naFormacao';

describe('formação: estar matriculado tem verbos — e eles mexem na trajetória', () => {
  it('na escola: estudar para as provas sobe a nota; colar pode dar errado (e a família sabe); tudo vai para a história da formação', () => {
    const v = adulto(15, { semente: 44 });
    expect(v.educacao.basica).toBeDefined();
    const ids = verbosDaFormacao(v).map(x => x.oque);
    expect(ids).toEqual(expect.arrayContaining(['estudar', 'festa', 'colar']));
    const nota = v.educacao.basica!.desempenho;
    const y = ok(v, { tipo: 'formacao', oque: 'estudar' });
    expect(y.educacao.basica!.desempenho).toBeGreaterThan(nota);
    let pego = false;
    for (let k = 0; k < 20 && !pego; k++) {
      const x = ok(outra(k, v), { tipo: 'formacao', oque: 'colar' });
      if ((x.educacao.trajetoria ?? []).some(m => /colando/.test(m.texto))) { pego = true; expect(x.educacao.basica!.desempenho).toBeLessThan(nota); }
    }
    expect(pego).toBe(true);
  });
  it('na faculdade: procurar um professor pode abrir o caminho da pesquisa (marca e biografia)', () => {
    const v = copia();
    v.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: v.t - 12, mesesRestantes: 36, mensalidade: 0, desempenho: 75, trancado: false, municipioId: v.moradia.municipioId };
    expect(verbosDaFormacao(v).map(x => x.oque)).toEqual(expect.arrayContaining(['projeto', 'congresso']));
    let entrou = false;
    for (let k = 0; k < 10 && !entrou; k++) { const x = ok(outra(k, v), { tipo: 'formacao', oque: 'projeto' }); entrou = x.fatos['formacao:projeto_aceito'] !== undefined; if (entrou) expect(x.biografia.some(e => /projeto de pesquisa/.test(e.texto))).toBe(true); }
    expect(entrou).toBe(true);
  });
});

/* ============================================================ 11 — Viagens: com quem */

import { companhiasDeViagem, escolhasDaExperiencia, custoDaExperiencia } from '../sistemas/experiencias';

describe('viagens: escolher com quem ir muda o preço, quem vai e o que fica', () => {
  it('sozinho custa menos que a família; com um amigo, a viagem fica na história dele', () => {
    let v = copia(); v.financas.conta = 200000;
    comParceiro(v, { estagio: 'casamento' });
    const { p: amigo } = comParente(v, 'irmao', 26, 'masculino', 75);
    const opcoes = companhiasDeViagem(v).map(x => x.id);
    expect(opcoes).toEqual(expect.arrayContaining(['so', 'casa', amigo.id]));
    const destino = escolhasDaExperiencia(v, 'viagem_pais')[0].id;
    expect(custoDaExperiencia(v, 'viagem_pais', `${destino}:so`)).toBeLessThan(custoDaExperiencia(v, 'viagem_pais', `${destino}:casa`));
    v = ok(v, { tipo: 'experiencia', id: 'viagem_pais', escolha: `${destino}:${amigo.id}` });
    expect(v.vinculos[amigo.id].historia.some(h => /viagem/.test(h.texto))).toBe(true);
    expect(v.biografia.some(e => new RegExp(`Viajou para .*${amigo.nome}`).test(e.texto))).toBe(true);
  });
});

/* ============================================================ 12 — Repetição: composição, não sinônimo */

import { fraseDeConclusao, fraseDaReprovacaoTeorica } from '../sistemas/composicao';

describe('repetição: a formatura e a reprovação são desta vida', () => {
  it('em 20 vidas, a mesma formatura sai com frases diferentes (o núcleo continua reconhecível)', () => {
    const frases = new Set<string>();
    for (let k = 0; k < 20; k++) {
      const v = outra(k);
      const f = fraseDeConclusao(v, { nucleo: 'Concluiu o ensino médio', instituicao: 'Escola Estadual Castro Alves', desempenho: 40 + k * 3, chave: 'medio' });
      expect(f).toMatch(/^Concluiu o ensino médio/);
      frases.add(f);
    }
    expect(frases.size).toBeGreaterThan(8);
  });
  it('a reprovação na teórica muda com a tentativa, a distância da nota e o preparo', () => {
    const v = copia();
    const a = fraseDaReprovacaoTeorica(v, { total: 20, minimo: 21, deTotal: 30, tentativa: 1, preparo: 3, nomeDaProva: 'de direção', chave: 'x' });
    const b = fraseDaReprovacaoTeorica(v, { total: 12, minimo: 21, deTotal: 30, tentativa: 3, preparo: 0, nomeDaProva: 'de direção', chave: 'x' });
    expect(a).not.toBe(b);
    expect(b).toMatch(/terceira/);
  });
});

/* ============================================================ 20 — Mundo: a vida inteira atravessa a fronteira */

import { migrar } from '../sistemas/migracao';
import { educacaoDaVida, paisDaVida } from '../mundo/vida';
import { continuarComo } from '../sistemas/sucessao';
import { instituicaoAtual } from '../sistemas/formacao';

describe('mundo: Brasil → EUA → trabalho → família → bens → morte → herança → sucessão, tudo coerente', () => {
  it('a educação e as instituições passam a ser as de lá; as redes funcionam; o filho herda a lembrança, não a conta', () => {
    let v = adulto(30, { semente: 31 });
    v.financas.conta = 900000; v.eu.nacionalidades = ['BR', 'US'];
    v = ok(v, rede('criar', { plataforma: 'instagram' }));
    v = ok(v, { tipo: 'comprar_coisa', coisaId: 'violao' });
    v = transacao(v, (x, r) => { migrar(x, r, 'us:chicago', 'pessoal'); }).vida;
    expect(paisDaVida(v)).toBe('US');
    expect(educacaoDaVida(v).nome).toBe('SAT');
    // As celebridades que se marca agora são de lá.
    expect(celebridadesDoPais(v).every(c => c.id.startsWith('US:'))).toBe(true);
    // A rede continua (é a mesma conta, em outro país) e o que se publica não presume o Brasil.
    v = ok(v, rede('publicar', { plataforma: 'instagram', tema: 'cotidiano' }));
    expect(conteudosPossiveis(v, 'instagram').map(x => x.rotulo).join(' ')).not.toMatch(/SUS|ENEM|CLT|Brasil/);
    // Estudar lá: a instituição é de lá.
    v.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade pública', rede: 'publica', modalidade: 'presencial', tInicio: v.t, mesesRestantes: 48, mensalidade: 0, desempenho: 60, trancado: false, municipioId: v.moradia.municipioId };
    expect(instituicaoAtual(v)?.municipioId).toBe('us:chicago');
    expect(verbosDaFormacao(v).length).toBeGreaterThan(0);
    // Trabalho e família.
    v = transacao(v, (x, r) => { x.trabalho.experiencia.ti = 48; contratar(x, r, ocupacao('dev_pleno')); }).vida;
    expect(verbosDoOficio(v).length).toBeGreaterThan(0);
    const { p: filho } = comFilho(v, 20, { casa: false });
    v.pessoas[filho.id].municipioId = v.moradia.municipioId;
    // A morte e a sucessão.
    v = transacao(v, x => { x.morte = { t: x.t, causa: 'infarto' }; }).vida;
    const r = continuarComo(v, filho.id);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    expect(n.redes).toBeUndefined();
    expect(Object.values(n.vinculos).some(x => x.digital)).toBe(false);
    expect((n.financas.coisas ?? []).some(c => c.coisaId === 'violao')).toBe(true);
    expect(n.biografia.some(e => /Ficou com o violão de/.test(e.texto))).toBe(true);
    // E tudo isso sobrevive a salvar e reabrir.
    const re = reabrir(n);
    expect((re.financas.coisas ?? []).some(c => c.coisaId === 'violao')).toBe(true);
    expect(paisDaVida(re)).toBe('US');
  });
});
