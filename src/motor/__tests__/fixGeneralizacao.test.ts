/**
 * FIX final da generalização: testes CAUSAIS das correções da auditoria.
 *
 *   T tênis: profissional ≠ elite (o ranking nasce dos resultados; o circuito, do ranking)
 *   N representação nacional: mérito entre os do país, nunca a fama nem a nota relativa
 *   P política: o histórico registra o que aconteceu (candidatura perdida é derrota; reeleição; sem sobreposição)
 *   F farda: ingresso, formação, guarnições, especialidade, baixa — sem medalha inventada
 *   V vôlei, N natação, A atletismo, L luta: números próprios, histórico próprio
 *   S save/reload e troca de carreira preservam os números novos
 *   X textos de mercado no idioma da modalidade
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { podeTentar } from '../plausibilidade';
import { criarVida } from '../criacao';
import { estaturaAdulta } from '../sistemas/modalidades';
import { exportarVida, importarVida } from '../save';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Dominio, Vida } from '../tipos';
import { garantirFrente } from '../sistemas/frentes';
import { contratar, processarTrabalho } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { carreirasEsportivas, encerrarCarreira, entrarNaBase, fecharTemporada, linhaDaTemporada, profissionalizar } from '../sistemas/esporte';
import { registrarTemporada } from '../sistemas/palmares';
import { historicoDaCarreira, mercadoEsportivo, resumoDaCarreira } from '../sistemas/perfisEsportivos';
import { circuitoDeEstreia, circuitoPeloRanking, rankingPorPontos } from '../sistemas/modalidades';
import { concorrenciaNoTenis, olharDaSelecao } from '../sistemas/selecao';
import { trajetoriasDaVida } from '../sistemas/legado';
import { entrarNaPolitica, mandatosDaVida, processarPolitica } from '../sistemas/politica';
import { escolherEspecialidade, processarMilitar, transferir } from '../sistemas/militar';
import { formatarMarca, funcaoVolei, PROVAS, provaDe } from '../sistemas/provas';

const recarregar = (v: Vida): Vida => { const l = importarVida(exportarVida(v)); if (l.tipo !== 'ok') throw new Error(`save: ${l.tipo}`); return l.vida; };
const abrir = (v: Vida, id: string): Vida => transacao(v, (x, r) => { const d = conteudoPorId(id); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;

let base: Vida | undefined;
const vinte = (): Vida => structuredClone((base ??= adulto(20, { semente: 31, genero: 'masculino', municipioId: 'campina-grande-pb' })));

/** Um atleta profissional da modalidade, com a técnica e o nível pedidos, e N temporadas jogadas. */
function atleta(d: Dominio, o: { habilidade?: number; nivel?: number; temporadas?: number } = {}): Vida {
  return transacao(vinte(), x => {
    garantirFrente(x, d);
    Object.assign(x.caminhos.frentes[d]!, { habilidade: o.habilidade ?? 86, interesse: 90, meses: 140, auge: o.habilidade ?? 86 });
    x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
    x.financas.conta += 400000;
    entrarNaBase(x, d, x.moradia.municipioId, d === 'tenis' ? 'academia de tênis de Campina Grande' : 'equipe da prefeitura de Campina Grande');
    profissionalizar(x, criarRng(1), o.nivel ?? 3);
    const e = x.caminhos.esporte!;
    for (let k = 0; k < (o.temporadas ?? 0); k++) { x.t += 12; const r = criarRng(70 + k); const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); }
    x.momento = null; x.caminhos.pendente = undefined;
  }).vida;
}

/* ============================================================ T. Tênis */

describe('T · tênis: ser profissional não é ser elite', () => {
  it('o ranking nasce dos pontos do ano: mais pontos, melhor posição; o mundo tem poucos no topo', () => {
    const rk = [5, 25, 60, 150, 400, 650, 1300, 3000].map(rankingPorPontos);
    for (let k = 1; k < rk.length; k++) expect(rk[k]).toBeLessThan(rk[k - 1]);
    expect(rankingPorPontos(650)).toBe(100);
    expect(rankingPorPontos(0)).toBeGreaterThan(2000);
  });

  it('no circuito principal, a técnica separa o profissional da elite: 86 não se segura entre os cem; 99 briga pelo topo', () => {
    const media = (h: number) => {
      const v = transacao(atleta('tenis', { habilidade: h, nivel: 4 }), x => { x.corpo.forma = 80; }).vida;
      const rks: number[] = [];
      transacao(v, x => { const e = x.caminhos.esporte!; for (let k = 0; k < 6; k++) { e.nivel = 4; rks.push(fecharTemporada(x, criarRng(300 + k), e).ranking!); } });
      return rks.sort((a, b) => a - b)[3];
    };
    const comum = media(86), elite = media(99);
    expect(comum).toBeGreaterThan(100);
    expect(elite).toBeLessThan(40);
  });

  it('o circuito do ano seguinte é o que o ranking abre — e quem estreia sem ranking começa embaixo', () => {
    expect(circuitoPeloRanking(3, 90)).toBe(4);
    expect(circuitoPeloRanking(4, 150)).toBe(4);
    expect(circuitoPeloRanking(4, 400)).toBe(3);
    expect(circuitoPeloRanking(2, 1000)).toBe(2);
    expect(circuitoPeloRanking(2, 1500)).toBe(1);
    expect(circuitoDeEstreia(95)).toBe(2);
    expect(circuitoDeEstreia(84)).toBe(1);
  });

  it('a temporada guarda os pontos e o ranking sai deles (a mesma conta que a tela lê)', () => {
    let v = atleta('tenis', { habilidade: 90, nivel: 3, temporadas: 2 });
    const t = v.caminhos.esporte!.temporadas!.slice(-1)[0];
    expect(t.pontosRanking).toBeGreaterThan(0);
    expect(t.ranking).toBe(rankingPorPontos(t.pontosRanking!));
    v = recarregar(v);
    expect(v.caminhos.esporte!.temporadas!.slice(-1)[0].pontosRanking).toBe(t.pontosRanking);
  });
});

/* ============================================================ N. Representação nacional */

describe('N · a equipe do país é dos melhores do país', () => {
  const comRanking = (rk: number, nota = 6.5, fama = 0) => transacao(atleta('tenis', { habilidade: 90, nivel: 4, temporadas: 1 }), x => {
    const t = x.caminhos.esporte!.temporadas!.slice(-1)[0]; t.ranking = rk; t.nota = nota;
    x.notoriedade = { valor: fama, pico: fama, origens: { esporte: fama } } as Vida['notoriedade'];
  }).vida;
  it('o mérito decide: o top 50 é convocado; o 600º, não — a régua é a dos outros tenistas do país naquele ano', () => {
    const ano = comRanking(50).caminhos.esporte!.temporadas!.slice(-1)[0].ano;
    const { quarto, segundo } = concorrenciaNoTenis(ano, false);
    expect(segundo).toBeLessThan(quarto);
    expect(olharDaSelecao(comRanking(50), comRanking(50).caminhos.esporte!)).toBeGreaterThanOrEqual(67);
    expect(olharDaSelecao(comRanking(600), comRanking(600).caminhos.esporte!)).toBeLessThan(60);
  });
  it('a fama não entra, e a nota do ano (relativa ao circuito) também não: o mesmo ranking, o mesmo olhar', () => {
    const a = comRanking(180, 6, 0), b = comRanking(180, 9.2, 95);
    expect(olharDaSelecao(a, a.caminhos.esporte!)).toBe(olharDaSelecao(b, b.caminhos.esporte!));
  });
});

/* ============================================================ P. Política */

describe('P · a trajetória política registra o que aconteceu', () => {
  it('trabalho de base, filiação e candidatura perdida: registradas como são — derrota é derrota, fama não é realização', () => {
    let v = transacao(vinte(), x => {
      entrarNaPolitica(x, 'comunidade', 1);
      const p = x.caminhos.politica!;
      p.partido = 'PSB'; p.tFiliacao = x.t; p.partidos = [{ sigla: 'PSB', tInicio: x.t }]; p.fase = 'filiado';
      p.historico.push({ t: x.t + 10, cargo: 'vereador', resultado: 'derrotado', partido: 'PSB' });
      x.notoriedade = { valor: 80, pico: 80, origens: { esporte: 80 } } as Vida['notoriedade'];
    }).vida;
    for (let k = 0; k < 3; k++) { v = executar(v, { tipo: 'politica', oque: 'comunidade' } as never).vida; v = transacao(v, x => { x.anoAtual.acoes = []; }).vida; }
    v = recarregar(v);
    const tr = trajetoriasDaVida(v).find(t => t.area === 'politica')!;
    expect(tr.realizacoes.some(x => /Candidatura a vereador em \d{4}: não se elegeu/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /Filiação ao PSB/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /3 anos de trabalho de base/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /eleit|famos|conhecid/i.test(x))).toBe(false);
    expect(tr.resumo).toMatch(/Nenhum mandato, 1 derrota/);
  });

  it('a reeleição é registrada como reeleição; e assumir outro cargo fecha o mandato anterior (sem dois mandatos ao mesmo tempo)', () => {
    let v = transacao(vinte(), (x, r) => {
      entrarNaPolitica(x, 'comunidade', 1);
      const p = x.caminhos.politica!;
      p.partido = 'PSB'; p.tFiliacao = x.t;
      // Como o motor faz: a eleição em outubro, a posse em janeiro (a reeleição fecha o mandato anterior na posse).
      const t0 = Math.floor(x.t / 12) * 12 + 9;
      p.historico.push({ t: t0, cargo: 'vereador', resultado: 'eleito' }, { t: t0 + 48, cargo: 'vereador', resultado: 'eleito' }, { t: t0 + 51, cargo: 'vereador', resultado: 'concluiu' });
      p.mandato = { cargo: 'vereador', tInicio: t0 + 51, tFim: t0 + 99, aprovacao: 55, feito: 0 };
      p.fase = 'mandato';
      // Eleito deputado no meio do segundo mandato — e o emprego registrado agora não é o do mandato.
      p.historico.push({ t: t0 + 72, cargo: 'deputado_estadual', resultado: 'eleito' });
      x.trabalho.atual = undefined;
      contratar(x, r, ocupacao('assistente_adm'), 'vaga');
      x.t = t0 + 75;
      p.posse = { cargo: 'deputado_estadual', t: x.t };
      processarPolitica(x, r);
    }).vida;
    v = recarregar(v);
    const ms = mandatosDaVida(v);
    const vigentes = ms.filter(m => m.como !== 'à espera da posse');
    for (const m of vigentes) for (const o of vigentes) if (m !== o) expect(o.de < (m.ate ?? 9999) && m.de < (o.ate ?? 9999)).toBe(false);
    expect(v.caminhos.politica!.historico.some(h => h.cargo === 'vereador' && h.resultado === 'concluiu' && h.t >= v.t - 1)).toBe(true);
    const tr = trajetoriasDaVida(v).find(t => t.area === 'politica')!;
    expect(tr.realizacoes.some(x => /^Reeleito vereador/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /^Deputado estadual/.test(x))).toBe(true);
  });
});

/* ============================================================ F. Farda */

describe('F · a trajetória militar registra os marcos reais', () => {
  it('carreira: ingresso, formação concluída, especialidade pelo nome, guarnições — e o reload não perde nada', () => {
    let v = transacao(vinte(), (x, r) => {
      x.trabalho.atual = undefined; x.educacao.matricula = undefined;
      contratar(x, r, ocupacao('aluno_sargento'), 'concurso');
      // O curso de formação termina pelo motor (o posto anterior fica registrado; a nomeação, a guarnição).
      x.t = x.trabalho.atual!.formacaoAte!;
      processarTrabalho(x, r);
      expect(x.trabalho.atual!.ocupacaoId).toBe('sargento');
      escolherEspecialidade(x, 'comunicacoes');
      x.t += 36;
      transferir(x, 'porto-alegre-rs', true, false);
    }).vida;
    v = recarregar(v);
    const tr = trajetoriasDaVida(v).find(t => t.area === 'militar')!;
    expect(tr.realizacoes.some(x => /^Ingresso: alun/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /^Concluiu a formação: sargento/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /^Especialidade: comunicações e sistemas/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /^Serviu em \d guarnições/.test(x))).toBe(true);
    expect(tr.resumo).not.toMatch(/comunicacoes/);
    // Sem combate e sem medalha inventada.
    expect(tr.realizacoes.join(' ')).not.toMatch(/medalha|combate|condecora/i);
  });

  it('serviço inicial: poucos marcos e honestos — o ingresso e a baixa com o certificado de reservista', () => {
    let v = transacao(adulto(19, { semente: 5, genero: 'masculino' }), (x, r) => {
      x.trabalho.atual = undefined; x.educacao.matricula = undefined;
      contratar(x, r, ocupacao('soldado_ep'), 'oportunidade');
      x.caminhos.militar!.tIngresso = x.t - 8 * 12;
      processarMilitar(x, criarRng(3), x.trabalho.atual!, ocupacao(x.trabalho.atual!.ocupacaoId));
    }).vida;
    v = recarregar(v);
    const tr = trajetoriasDaVida(v).find(t => t.area === 'militar')!;
    expect(tr.realizacoes.some(x => /^Ingresso: soldado/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /^Deu baixa do Exército em \d{4}, com o certificado de reservista/.test(x))).toBe(true);
    expect(tr.realizacoes.some(x => /^Engajou: 8 anos/.test(x))).toBe(true);
    expect(tr.realizacoes.length).toBeLessThanOrEqual(4);
  });
});

/* ============================================================ V, N, A, L. As modalidades */

describe('V · vôlei: a função decide o que a temporada mede', () => {
  it('sets e números da função; o histórico por equipe fala de sets, pontos e defesas — nunca de gols', () => {
    let v = atleta('volei', { temporadas: 3 });
    const e = v.caminhos.esporte!;
    const t = e.temporadas!.slice(-1)[0];
    expect(t.volei).toBeDefined();
    expect(t.funcao).toBe(funcaoVolei(v));
    expect(t.volei!.sets).toBeGreaterThan(t.partidas);
    if (t.funcao === 'libero') { expect(t.volei!.pontos).toBe(0); expect(t.volei!.defesas).toBeGreaterThan(0); expect(t.volei!.recepcao).toBeDefined(); }
    else expect(t.volei!.pontos + t.volei!.levantamentos).toBeGreaterThan(0);
    const h = historicoDaCarreira(e);
    expect(h.colunas).toEqual(expect.arrayContaining(['Função', 'Sets', 'Pontos/set', 'Defesas/set']));
    expect([...h.colunas, resumoDaCarreira(e), linhaDaTemporada(v, t, 'volei')].join(' ')).not.toMatch(/gols?\b|rebote/i);
    expect(resumoDaCarreira(e)).toMatch(/sets como/);
    v = recarregar(v);
    expect(v.caminhos.esporte!.temporadas!.slice(-1)[0].volei).toEqual(t.volei);
  });

  it('a função sai do corpo: do líbero (o mais baixo) ao central (o mais alto), com poucos líberos', () => {
    const vs = Array.from({ length: 160 }, (_, s) => criarVida({ nome: 'V', sobrenome: 'S', genero: 'masculino', municipioId: 'recife-pe', semente: 4000 + s }));
    const media = (f: string) => { const xs = vs.filter(x => funcaoVolei(x) === f).map(estaturaAdulta); return xs.reduce((a, b) => a + b, 0) / (xs.length || 1); };
    expect(media('central')).toBeGreaterThan(media('ponteiro'));
    expect(media('ponteiro')).toBeGreaterThan(media('levantador'));
    expect(media('levantador')).toBeGreaterThan(media('libero'));
    const liberos = vs.filter(x => funcaoVolei(x) === 'libero').length / vs.length;
    expect(liberos).toBeGreaterThan(0.05);
    expect(liberos).toBeLessThan(0.3);
  });
});

describe('N · natação: a prova, a marca, o recorde pessoal', () => {
  it('a temporada tem prova e marca; o recorde pessoal só quando melhora; finais e pódios dentro das competições', () => {
    let v = atleta('natacao', { temporadas: 4 });
    const e = v.caminhos.esporte!;
    const ts = e.temporadas!;
    const p = provaDe(v, 'natacao')!;
    expect(PROVAS.natacao!.map(x => x.nome)).toContain(p.nome);
    for (const t of ts) {
      expect(t.prova!.nome).toBe(p.nome);
      expect(t.prova!.podios).toBeLessThanOrEqual(t.prova!.finais);
      expect(t.prova!.finais).toBeLessThanOrEqual(t.partidas);
      expect(t.prova!.vitorias).toBeLessThanOrEqual(t.prova!.podios);
    }
    // Recorde pessoal = melhor que todas as anteriores (o tempo menor).
    ts.forEach((t, k) => { if (k > 0 && t.prova!.recorde) expect(t.prova!.marca).toBeLessThan(Math.min(...ts.slice(0, k).map(x => x.prova!.marca))); });
    const h = historicoDaCarreira(e);
    expect(h.colunas).toEqual(expect.arrayContaining(['Prova', 'Marca do ano', 'Finais', 'Pódios']));
    expect(resumoDaCarreira(e)).toMatch(/nadando .*recorde pessoal de/);
    expect([...h.colunas, resumoDaCarreira(e)].join(' ')).not.toMatch(/\bjogos?\b|\bgols?\b|clube/i);
    v = recarregar(v);
    expect(v.caminhos.esporte!.temporadas!.slice(-1)[0].prova).toEqual(ts.slice(-1)[0].prova);
  });
});

describe('A · atletismo: a marca na unidade da prova', () => {
  it('mais técnica, marca melhor (tempo menor; distância maior); a marca se escreve como na modalidade', () => {
    const fraco = atleta('atletismo', { habilidade: 78, temporadas: 1 });
    const forte = transacao(fraco, x => { Object.assign(x.caminhos.frentes.atletismo!, { habilidade: 96, auge: 96 }); x.t += 12; const e = x.caminhos.esporte!; e.temporadas = []; fecharTemporada(x, criarRng(70), e); }).vida;
    const a = fraco.caminhos.esporte!.temporadas!.slice(-1)[0].prova!, b = forte.caminhos.esporte!.temporadas!.slice(-1)[0].prova!;
    expect(a.nome).toBe(b.nome);
    if (a.unidade === 's') expect(b.marca).toBeLessThan(a.marca); else expect(b.marca).toBeGreaterThan(a.marca);
    expect(formatarMarca('s', 10.21)).toBe('10s21');
    expect(formatarMarca('s', 107.2)).toBe('1min47s20');
    expect(formatarMarca('s', 7695)).toBe('2h08min15');
    expect(formatarMarca('m', 8.124)).toBe('8,12 m');
    expect(historicoDaCarreira(fraco.caminhos.esporte!).linhas[0].join(' ')).toMatch(/\d(s|min|h)\d|\d,\d\d m/);
  });
});

describe('L · luta: o cartel, evento a evento', () => {
  it('lutas = vitórias + derrotas; cada evento não vencido acaba numa derrota; títulos ≤ pódios ≤ eventos; sem empate', () => {
    let v = atleta('lutas', { temporadas: 3 });
    const e = v.caminhos.esporte!;
    for (const t of e.temporadas!) {
      const l = t.luta!;
      expect(l.lutas).toBe(l.vitorias + l.derrotas);
      expect(l.derrotas).toBe(t.partidas - l.titulos);
      expect(l.titulos).toBeLessThanOrEqual(l.podios);
      expect(l.podios).toBeLessThanOrEqual(t.partidas);
      expect(l.antesDoTempo).toBeLessThanOrEqual(l.vitorias);
      expect(l.categoria).toMatch(/kg$/);
      expect(Object.keys(l)).not.toContain('empates');
    }
    expect(historicoDaCarreira(e).colunas).toEqual(expect.arrayContaining(['Categoria', 'V–D', 'Antes do tempo', 'Títulos']));
    expect(resumoDaCarreira(e)).toMatch(/cartel de \d+ vitórias/);
    v = recarregar(v);
    expect(v.caminhos.esporte!.temporadas![0].luta).toEqual(e.temporadas![0].luta);
  });
});

/* ============================================================ S. Save e troca de carreira */

describe('S · os números novos atravessam o save e a troca de carreira', () => {
  it('nadador que vira jogador de vôlei: a natação arquivada guarda a prova e a marca; o legado conta as duas', () => {
    let v = atleta('natacao', { temporadas: 3 });
    const marca = v.caminhos.esporte!.temporadas!.slice(-1)[0].prova!.marca;
    v = transacao(v, x => {
      encerrarCarreira(x, x.caminhos.esporte!, 'escolha');
      garantirFrente(x, 'volei'); Object.assign(x.caminhos.frentes.volei!, { habilidade: 84, interesse: 90, meses: 100, auge: 84 });
      x.trabalho.atual = undefined;
      entrarNaBase(x, 'volei', x.moradia.municipioId, 'equipe da prefeitura de Campina Grande');
      profissionalizar(x, criarRng(2), 2);
      const e = x.caminhos.esporte!; x.t += 12; const t = fecharTemporada(x, criarRng(5), e); registrarTemporada(x, criarRng(5), e, t);
    }).vida;
    v = recarregar(v);
    const nat = carreirasEsportivas(v).find(c => c.modalidade === 'natacao')!;
    expect(nat.temporadas!.slice(-1)[0].prova!.marca).toBe(marca);
    expect(v.caminhos.esporte!.temporadas!.slice(-1)[0].volei).toBeDefined();
    const areas = trajetoriasDaVida(v).filter(t => t.area === 'esporte').map(t => t.resumo).join(' | ');
    expect(areas).toMatch(/recorde pessoal/);
    expect(areas).toMatch(/sets como/);
  });

  it('um save com números corrompidos numa temporada é recusado (não entra lixo no histórico)', () => {
    const v = atleta('natacao', { temporadas: 1 });
    const txt = exportarVida(v).replace(/"marca":[0-9.]+/, '"marca":"rápido"');
    expect(importarVida(txt).tipo).not.toBe('ok');
  });
});

/* ============================================================ X. Textos de mercado */

describe('X · as decisões de mercado falam a língua da modalidade', () => {
  const textos = (v: Vida, id: string) => { const w = abrir(v, id); return [w.momento!.titulo, w.momento!.texto, ...w.momento!.opcoes.flatMap(o => [o.texto, o.bloqueio ?? '', o.detalhe ?? ''])].join(' '); };
  it('basquete e vôlei: equipe e ginásio — nenhum clube, estádio, gramado ou escalação', () => {
    for (const d of ['basquete', 'volei'] as const) {
      const v = transacao(atleta(d, { temporadas: 1 }), x => { x.caminhos.esporte!.espaco = 'reserva'; }).vida;
      const t = ['esp_renovacao', 'esp_mercado', 'esp_treinador', 'esp_doping'].map(id => textos(v, id)).join(' ').split(v.caminhos.esporte!.clube).join('');
      expect(t).not.toMatch(/\bclubes?\b|estádio|gramado|escalação|futebol/i);
      expect(mercadoEsportivo(d).nenhum).toBe('Nenhuma equipe');
    }
  });
  it('natação, atletismo e luta: provas principais, não banco nem jogo', () => {
    for (const d of ['natacao', 'atletismo', 'lutas'] as const) {
      const v = transacao(atleta(d, { temporadas: 1 }), x => { x.caminhos.esporte!.espaco = 'reserva'; }).vida;
      const t = ['esp_mercado', 'esp_treinador', 'esp_doping'].map(id => textos(v, id)).join(' ').split(v.caminhos.esporte!.clube).join('');
      expect(t).not.toMatch(/\bclubes?\b|estádio|escalação|\bno banco\b|\bjogar\b|futebol/i);
    }
  });
  it('tênis: sem treinador de banco nem "pedir para ser negociado" (o ranking decide o circuito)', () => {
    const v = atleta('tenis', { temporadas: 1 });
    expect(podeTentar(disponibilidade(v, { tipo: 'profissao', oque: 'treinador' } as never))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'profissao', oque: 'mercado' } as never))).toBe(false);
  });
});
