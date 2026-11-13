/** VIDA 18 · loterias da Caixa, bolões, apostas esportivas, turfe, bingo, a lei por modalidade e o grande prêmio. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { interpretar } from '../save';
import { rngDe } from '../rng';
import type { Vida } from '../tipos';
import { LOTERIAS18, PREMIO_BRUTO } from '../dados18/apostas/loterias18';
import { apurarConcurso, chanceDaFaixa, comb, conferir, precoDaAposta, precoDaLoteca, proximoConcurso, rateio, sorteioDoConcurso, acumulado, nacional } from '../v18/apostas/loterias18';
import { gradeDePlacares, odd, probabilidades, resultadoDoJogo, rodada, MARGEM_ESPORTIVA } from '../v18/apostas/esportivas18';
import { chancesDoPareo, chegada, pareo, oddTurfe } from '../v18/apostas/turfe18';
import { jogarBingo } from '../v18/apostas/bingo18';
import { grandePremio, rodadaAberta, leiDa } from '../v18/apostas/apostas18';
import { estadoApostas18 } from '../v18/apostas/estado18';

const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; return x; };
const comDinheiro = (idade = 30, semente = 1, conta = 100_000) => { const v = structuredClone(adulto(idade, { semente })); v.financas.conta = conta; return v; };

describe('VIDA 18 · as regras de cada loteria', () => {
  it('cada modalidade com a sua mecânica (não são todas seis de sessenta)', () => {
    expect([LOTERIAS18.mega.universo, LOTERIAS18.mega.sorteia]).toEqual([60, 6]);
    expect([LOTERIAS18.lotofacil.universo, LOTERIAS18.lotofacil.sorteia, LOTERIAS18.lotofacil.min]).toEqual([25, 15, 15]);
    expect([LOTERIAS18.quina.universo, LOTERIAS18.quina.sorteia]).toEqual([80, 5]);
    expect([LOTERIAS18.lotomania.universo, LOTERIAS18.lotomania.sorteia, LOTERIAS18.lotomania.min, LOTERIAS18.lotomania.max]).toEqual([100, 20, 50, 50]);
    expect(LOTERIAS18.lotomania.faixas.some(f => f.acertos === 0)).toBe(true);
    expect(LOTERIAS18.duplasena.duasVezes).toBe(true);
    expect(LOTERIAS18.lotofacil.faixas.filter(f => f.fixo).map(f => f.acertos).sort()).toEqual([11, 12, 13]);
  });

  it('as chances oficiais: sena 1 em 50.063.860, quina da Mega 1 em 154.518, 15 da Lotofácil 1 em 3.268.760, 20 da Lotomania 1 em 11.372.635', () => {
    expect(Math.round(1 / chanceDaFaixa(60, 6, 6, 6))).toBe(50_063_860);
    expect(Math.round(1 / chanceDaFaixa(60, 6, 6, 5))).toBe(154_518);
    expect(Math.round(1 / chanceDaFaixa(25, 15, 15, 15))).toBe(3_268_760);
    expect(Math.abs(1 / chanceDaFaixa(100, 20, 50, 20) - 11_372_635)).toBeLessThan(1);
    expect(Math.abs(1 / chanceDaFaixa(100, 20, 50, 0) - 11_372_635)).toBeLessThan(1);
  });

  it('aposta com mais dezenas = todas as combinações (preço e prêmio)', () => {
    expect(precoDaAposta('mega', 7)).toBe(LOTERIAS18.mega.preco * 7);
    expect(precoDaAposta('mega', 8)).toBe(LOTERIAS18.mega.preco * comb(8, 6));
    expect(precoDaLoteca(Array.from({ length: 14 }, (_, k) => (k === 0 ? ['1', 'X'] : ['1']) as ('1' | 'X' | '2')[]))).toBe(4);
    // 7 dezenas com os 6 sorteados: 1 sena e 6 quinas (como no volante de verdade).
    const s = { a: [1, 2, 3, 4, 5, 6] };
    const c = conferir({ loteria: 'mega', jogos: [[1, 2, 3, 4, 5, 6, 30]] }, s);
    expect(c['6']).toBe(1); expect(c['5']).toBe(6);
    // Loteca: um duplo errado no jogo 1 e o resto certo = 1 combinação com 14 e 1 com 13.
    const res = Array(14).fill('1') as ('1' | 'X' | '2')[];
    const lc = conferir({ loteria: 'loteca', jogos: [[]], palpites: res.map((x, k) => (k === 0 ? ['1', 'X'] : [x])) as ('1' | 'X' | '2')[][] }, { a: [], resultados: res });
    expect(lc['14']).toBe(1); expect(lc['13']).toBe(1);
  });

  it('o sorteio do concurso é estável (recarregar não muda) e respeita o universo', () => {
    const v = comDinheiro();
    for (const l of ['mega', 'lotofacil', 'quina', 'lotomania', 'duplasena'] as const) {
      const n = proximoConcurso(v, l);
      const a = sorteioDoConcurso(v, l, n), b = sorteioDoConcurso(structuredClone(v), l, n);
      expect(a).toEqual(b);
      expect(new Set(a.a).size).toBe(LOTERIAS18[l].sorteia);
      expect(Math.min(...a.a)).toBeGreaterThanOrEqual(LOTERIAS18[l].doZero ? 0 : 1);
      expect(Math.max(...a.a)).toBeLessThanOrEqual(LOTERIAS18[l].doZero ? 99 : LOTERIAS18[l].universo);
      if (l === 'duplasena') expect(a.b!.length).toBe(6);
    }
  });

  it('rateio: a faixa divide o prêmio entre os ganhadores do país e os da vida; sem ganhador, acumula', () => {
    const v = comDinheiro();
    const n = proximoConcurso(v, 'mega');
    const nac = nacional(v, 'mega', n);
    const sem = rateio(v, 'mega', n, {});
    const com = rateio(v, 'mega', n, { '4': 1 });
    if (nac.ganhadores['4'] > 0) expect(com['4']).toBeCloseTo(sem['4'] * nac.ganhadores['4'] / (nac.ganhadores['4'] + 1), 1);
    expect(com['4']).toBeLessThanOrEqual(nac.arrecadacao * PREMIO_BRUTO * 0.15);
    // O acúmulo é uma função do concurso: quando ninguém acerta, o seguinte leva mais.
    let viuAcumular = false;
    for (let k = n; k < n + 40 && !viuAcumular; k++) if ((nacional(v, 'mega', k).ganhadores['6'] ?? 0) === 0 && acumulado(v, 'mega', k + 1) > acumulado(v, 'mega', k)) viuAcumular = true;
    expect(viuAcumular).toBe(true);
  });

  it('comprar, ver o sorteio, conferir: o custo sai uma vez, o prêmio entra uma vez, o histórico registra', () => {
    let v = comDinheiro(30, 3);
    const c0 = v.financas.conta;
    const n = proximoConcurso(v, 'lotofacil');
    const jogo = sorteioDoConcurso(v, 'lotofacil', n).a; // os 15 sorteados: prêmio máximo garantido pela regra
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'lotofacil', jogos: [jogo] } }).vida;
    expect(v.financas.conta).toBeCloseTo(c0 - LOTERIAS18.lotofacil.preco, 2);
    const pago = v.financas.conta;
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'sorteio', loteria: 'lotofacil' } }).vida;
    const b = v.apostas18!.bilhetes[0];
    expect(b.resultado!.faixas.some(f => f.nome === '15 acertos')).toBe(true);
    expect(v.financas.conta).toBeCloseTo(pago + b.resultado!.premio, 1);
    // Rever o mesmo concurso não paga de novo.
    const lido = interpretar(JSON.stringify(v));
    if (lido.tipo !== 'ok') throw new Error('save');
    const de = apurarConcurso(lido.vida, 'lotofacil', n);
    expect(de.premio).toBe(0);
    expect(proximoConcurso(v, 'lotofacil')).toBe(n + 1);
    expect(v.apostas18!.historico[0].recebido).toBe(b.resultado!.premio);
  });

  it('bilhete sem acerto não ganha nada; quem não olhou o sorteio tem o bilhete conferido no fim do ano', () => {
    let v = comDinheiro(30, 4);
    const n = proximoConcurso(v, 'mega');
    const s = sorteioDoConcurso(v, 'mega', n).a;
    const fora = Array.from({ length: 60 }, (_, k) => k + 1).filter(x => !s.includes(x)).slice(0, 6);
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'mega', jogos: [fora] } }).vida;
    v = ano(v);
    const b = v.apostas18!.bilhetes[0];
    expect(b.resultado?.premio).toBe(0);
  });

  it('bolão: a parte é a das cotas; o bolão entre conhecidos guarda quem entrou', () => {
    let v = comDinheiro(30, 5);
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'bolao', loteria: 'mega', cotas: 2 } }).vida;
    const b = v.apostas18!.bilhetes[0];
    expect(b.bolao).toEqual({ minhas: 2, cotas: 25, organizador: 'loterica' });
    expect(b.jogos.length).toBe(10);
    const amigos = Object.keys(v.pessoas).filter(id => v.pessoas[id].vivo && !v.pessoas[id].especie).slice(0, 3);
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'bolao_conhecidos', loteria: 'quina', pessoas: amigos, jogos: 8 } }).vida;
    const b2 = v.apostas18!.bilhetes[1];
    expect(b2.bolao!.cotas).toBe(amigos.length + 1);
    expect(b2.bolao!.pessoas).toEqual(amigos);
  });
});

describe('VIDA 18 · apostas esportivas', () => {
  it('as odds saem das probabilidades exatas do modelo de gols da tabela, com a margem da casa', () => {
    const v = comDinheiro();
    const rd = rodada(v, rodadaAberta(v));
    expect(rd.jogos.length).toBe(14);
    for (const j of rd.jogos) {
      const p = probabilidades(j);
      expect(p['1'] + p.X + p['2']).toBeCloseTo(1, 6);
      const soma = 1 / odd(p['1']) + 1 / odd(p.X) + 1 / odd(p['2']);
      expect(soma).toBeGreaterThan(1);
      expect(soma).toBeLessThan(1 + MARGEM_ESPORTIVA + 0.03);
      expect(gradeDePlacares(j).flat().reduce((s, x) => s + x, 0)).toBeGreaterThan(0.99);
    }
  });

  it('os placares do mundo seguem as probabilidades (frequência ≈ chance em muitas rodadas)', () => {
    const v = comDinheiro();
    let casa = 0, esperado = 0;
    for (let n = 1000; n < 1300; n++) for (let k = 0; k < 14; k++) { const r = resultadoDoJogo(v, n, k, 'BR'); if (r.res === '1') casa++; esperado += probabilidades(rodada(v, n, 'BR').jogos[k])['1']; }
    expect(Math.abs(casa - esperado) / esperado).toBeLessThan(0.06);
  });

  it('apostar no jogo e jogar a rodada liquida pelo placar do mundo; ganho = valor × odd', () => {
    let v = comDinheiro(30, 6);
    const n = rodadaAberta(v);
    const r = resultadoDoJogo(v, n, 0, 'BR');
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'jogo', jogoK: 0, mercado: '1x2', palpite: r.res, valor: 100 } }).vida;
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'jogo', jogoK: 0, mercado: 'placar', palpite: '9-9', valor: 50 } }).vida;
    const c0 = v.financas.conta;
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'rodada' } }).vida;
    const [a, b] = v.apostas18!.esportivas;
    expect(a.liquidada!.ganhou).toBe(true);
    expect(a.liquidada!.recebido).toBeCloseTo(100 * a.odd, 1);
    expect(b.liquidada!.ganhou).toBe(false);
    expect(v.financas.conta).toBeCloseTo(c0 + a.liquidada!.recebido, 1);
    expect(rodadaAberta(v)).toBe(n + 1);
  });

  it('a aposta de temporada liquida pelo campeão que a liga do mundo produziu', () => {
    let v = comDinheiro(30, 7, 1_000_000);
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'abrir_mercado' } }).vida;
    const liga = v.caminhos.ligas!.BR!;
    const elite = Object.keys(liga.div).filter(c => liga.div[c] === 4);
    for (const c of elite) v = executar(v, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'temporada', mercado: 'campeao', clube: c, valor: 10 } }).vida;
    v = ano(v);
    const ap = v.apostas18!.esportivas.filter(a => a.mercado === 'campeao');
    const liquidadas = ap.filter(a => a.liquidada);
    expect(liquidadas.length).toBe(ap.length);
    const campeao = v.caminhos.ligas!.BR!.historico!.find(h => h.ano === Number(ap[0].evento.split(':')[1]))?.liga;
    // Ganhou exatamente quem foi campeão (se o campeão era do catálogo).
    expect(liquidadas.filter(a => a.liquidada!.ganhou).map(a => a.palpite)).toEqual(elite.includes(campeao ?? '') ? [campeao] : []);
  });

  it('atleta de futebol não aposta em futebol', () => {
    const v = comDinheiro();
    v.caminhos.esporte = { ...(v.caminhos.esporte ?? {}), modalidade: 'futebol', fase: 'profissional' } as never;
    expect(podeTentar(disponibilidade(v, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'jogo', jogoK: 0, mercado: '1x2', palpite: '1', valor: 10 } }))).toBe(false);
  });
});

describe('VIDA 18 · turfe e bingo', () => {
  it('o páreo é estável; a chegada sai do desempenho + acaso; o favorito vence mais', () => {
    const v = comDinheiro();
    const p = pareo(v, 'gavea', 9001);
    expect(pareo(v, 'gavea', 9001)).toEqual(p);
    expect(chegada(v, p)).toEqual(chegada(structuredClone(v), p));
    const ch = chancesDoPareo(p);
    expect(Object.values(ch.vencer).reduce((s, x) => s + x, 0)).toBeCloseTo(1, 2);
    const fav = Object.entries(ch.vencer).sort((a, b) => b[1] - a[1])[0];
    let vitorias = 0;
    for (let n = 0; n < 600; n++) { const pp = { ...p, numero: 50000 + n }; if (chegada(v, pp)[0] === fav[0]) vitorias++; }
    expect(Math.abs(vitorias / 600 - fav[1])).toBeLessThan(0.07);
    expect(oddTurfe(0.5)).toBeCloseTo(1.4, 1);
  });

  it('apostar e correr: o vencedor paga pela odd; o placê paga entre os dois primeiros', () => {
    let v = comDinheiro(30, 8);
    const hip = 'gavea';
    const n = (Math.floor(v.t / 12) * 0) + 0;
    void n;
    const p = (() => { const x = executar(v, { tipo: 'aposta18', oque: { jogo: 'turfe', oque: 'correr', hipodromo: hip } }); return x; })();
    expect(p.vida.apostas18!.corridas[0].ordem.length).toBeGreaterThan(6);
    const p2 = pareo(p.vida, hip, p.vida.apostas18!.pareo![hip]);
    const ordem = chegada(p.vida, p2);
    v = executar(p.vida, { tipo: 'aposta18', oque: { jogo: 'turfe', oque: 'apostar', hipodromo: hip, tipo: 'place', cavalos: [ordem[1]], valor: 100 } }).vida;
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'turfe', oque: 'apostar', hipodromo: hip, tipo: 'vencedor', cavalos: [ordem[2]], valor: 100 } }).vida;
    v = executar(v, { tipo: 'aposta18', oque: { jogo: 'turfe', oque: 'correr', hipodromo: hip } }).vida;
    const c = v.apostas18!.corridas.find(x => x.numero === p2.numero)!;
    expect(c.ordem).toEqual(ordem);
    expect(c.apostas[0].recebido).toBeCloseTo(100 * c.apostas[0].odd, 1);
    expect(c.apostas[1].recebido).toBe(0);
  });

  it('bingo: ganha quem completa primeiro (as bolas decidem); empate divide', () => {
    const v = comDinheiro();
    for (let n = 1; n <= 40; n++) {
      const r = jogarBingo(v, n, 2, 25);
      expect(r.cheia.total).toBeGreaterThan(0);
      expect(r.linha.bola).toBeLessThanOrEqual(r.cheia.bola);
      expect(r.recebido).toBeLessThanOrEqual(r.premioLinha + r.premioCheia + 0.01);
    }
    expect(jogarBingo(v, 7, 2, 25)).toEqual(jogarBingo(v, 7, 2, 25));
  });
});

describe('VIDA 18 · a lei, os limites e o grande prêmio', () => {
  it('no Brasil, cassino e caça-níquel são proibidos; loterias, turfe e esportivas, permitidos; bingo só o beneficente', () => {
    const v = comDinheiro();
    expect(podeTentar(disponibilidade(v, { tipo: 'aposta', op: { jogo: 'niquel', valor: 10 } }))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'aposta', op: { jogo: 'roleta', apostas: [{ tipo: 'vermelho', valor: 10 }] } }))).toBe(false);
    expect(leiDa(v, 'loterias').permitido && leiDa(v, 'turfe').permitido && leiDa(v, 'esportivas').permitido).toBe(true);
    expect(leiDa(v, 'bingo').texto).toMatch(/beneficente/);
    const menor = structuredClone(adulto(16));
    expect(podeTentar(disponibilidade(menor, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'mega', surpresinhas: 1 } }))).toBe(false);
  });

  it('o limite do ano e a autoexclusão valem para as apostas novas', () => {
    let v = comDinheiro(30, 9);
    v = executar(v, { tipo: 'aposta', op: { jogo: 'controle', oque: 'autoexcluir' } }).vida;
    expect(podeTentar(disponibilidade(v, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'mega', surpresinhas: 1 } }))).toBe(false);
    expect(podeTentar(disponibilidade(v, { tipo: 'aposta18', oque: { jogo: 'turfe', oque: 'apostar', hipodromo: 'gavea', tipo: 'vencedor', cavalos: ['x'], valor: 10 } }))).toBe(false);
  });

  it('as perdas das apostas novas contam nos anos pesados (a mesma contabilidade de sempre)', () => {
    let v = comDinheiro(30, 10, 2_000_000);
    for (let k = 0; k < 40; k++) v = executar(v, { tipo: 'aposta18', oque: { jogo: 'esportiva', oque: 'jogo', jogoK: k % 14, mercado: 'placar', palpite: '9-9', valor: 5000 } }).vida;
    expect(v.apostas!.ano.apostado).toBeGreaterThanOrEqual(200000);
  });

  it('o grande prêmio entra uma vez na conta (não no patrimônio em dobro) e abre a decisão do que fazer', () => {
    const v = comDinheiro(30, 11);
    const conta = v.financas.conta;
    grandePremio(v, 5_000_000, 'Mega-Sena');
    expect(v.financas.conta).toBe(conta);
    expect(v.fatos['premio18']).toBe(v.t);
    expect(estadoApostas18(v).premio!.valor).toBe(5_000_000);
    expect(grandePremio.length).toBeGreaterThan(0);
    void rngDe;
  });
});
