/**
 * REWORK 10 · JOG-01 / §18 — os jogos medidos em amostras grandes (o motor, sem a tela): o retorno do blackjack com a
 * estratégia básica, da roleta, do caça-níquel e da loteria, e a conferência de que nenhum jogo cria dinheiro (o saldo
 * da conta = o que entrou − o que saiu, rodada a rodada).
 *   npx esbuild scripts/sim/jogos10.ts --bundle --platform=node --outfile=<scratch>/j10.cjs && node <scratch>/j10.cjs
 */
import { nova } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { transacao } from '../../src/motor/nucleo';
import { apostarBlackjack, dobrar, estrategiaBasica, jogarLoteria, jogarNiquel, jogarRoleta, parar, pedirCarta, rtpLoteria, rtpNiquel } from '../../src/motor/sistemas/apostas';
import type { Vida } from '../../src/motor/tipos';

async function main() {
  await carregarMundo();
  const base = (): Vida => transacao(nova({ semente: 1 }), x => { x.t += 30 * 12; x.financas.conta = 1e12; }).vida;
  const conferir = (v: Vida, inicio: number) => Math.abs(v.financas.conta - inicio - (v.apostas!.total.recebido - v.apostas!.total.apostado)) < 1e-3;
  const out: string[] = [];
  { const v = base(), r = criarRng(1), i0 = v.financas.conta; let ap = 0, rec = 0; const n = 200000;
    for (let k = 0; k < n; k++) { let x = apostarBlackjack(v, r, 100); while (!x && v.apostas?.mao) { const m = v.apostas.mao; const d = estrategiaBasica(m.voce, m.banca[0]); x = d === 'dobrar' && m.voce.length === 2 ? dobrar(v) : d === 'pedir' ? pedirCarta(v) : parar(v); } x = x ?? v.apostas!.ultimas[0]; ap += x.apostado; rec += x.recebido; }
    out.push(`| Blackjack (estratégia básica, sem divisão) | ${n.toLocaleString('pt-BR')} mãos | ${(rec / ap * 100).toFixed(2)}% | vantagem da casa ${((1 - rec / ap) * 100).toFixed(2)}% | ${conferir(v, i0) ? 'ok' : 'ERRO'} |`); }
  { const v = base(), r = criarRng(2), i0 = v.financas.conta; let ap = 0, rec = 0; const n = 370000;
    for (let k = 0; k < n; k++) { const x = jogarRoleta(v, r, [{ tipo: k % 2 ? 'vermelho' : 'numero', valor: 10, numero: 7 }]); ap += x.apostado; rec += x.recebido; }
    out.push(`| Roleta europeia (metade vermelho, metade nº 7) | ${n.toLocaleString('pt-BR')} giros | ${(rec / ap * 100).toFixed(2)}% | teórico 97,30% | ${conferir(v, i0) ? 'ok' : 'ERRO'} |`); }
  { const v = base(), r = criarRng(3), i0 = v.financas.conta; let ap = 0, rec = 0, acertos = 0; const n = 1000000;
    for (let k = 0; k < n; k++) { const x = jogarNiquel(v, r, 10); ap += x.apostado; rec += x.recebido; if (x.recebido) acertos++; }
    out.push(`| Caça-níquel da Raposa | ${n.toLocaleString('pt-BR')} giros | ${(rec / ap * 100).toFixed(2)}% | teórico ${(rtpNiquel() * 100).toFixed(2)}%; paga em ${(acertos / n * 100).toFixed(1)}% (teórico 16,1%) | ${conferir(v, i0) ? 'ok' : 'ERRO'} |`); }
  { const v = base(), r = criarRng(4), i0 = v.financas.conta; let ap = 0, rec = 0; const n = 300000; const tres = [0, 0, 0, 0, 0, 0, 0];
    for (let k = 0; k < n; k++) { const x = jogarLoteria(v, r, [4, 9, 16, 23, 30, 37]); ap += x.apostado; rec += x.recebido; tres[x.acertos!]++; }
    out.push(`| Loteria Seis de Quarenta | ${n.toLocaleString('pt-BR')} bilhetes | ${(rec / ap * 100).toFixed(2)}% | teórico ${(rtpLoteria() * 100).toFixed(2)}% (a variância é do prêmio máximo); 3 acertos em ${(tres[3] / n * 100).toFixed(2)}% (teórico 3,12%) | ${conferir(v, i0) ? 'ok' : 'ERRO'} |`); }
  console.log('| Jogo | Amostra | Retorno medido | Referência | Saldo = entradas − saídas |\n|---|---|---|---|---|\n' + out.join('\n'));
}
main();
