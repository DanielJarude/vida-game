/**
 * Saves das cenas novas do REWORK 10 (`rework10.mjs`), vividos pelo motor:
 *   seguro       38 anos, demitida há pouco, com o seguro-desemprego em parcelas (ECO-03): a linha em Trabalho
 *   evento       36 anos, casada, com uma situação nova aberta de quatro respostas (EVT-01/02): o dinheiro da casa
 *   apostadora   31 anos, com dinheiro na conta e um ano de apostas no extrato (JOG-01): as mesas e o balanço
 *   npx esbuild scripts/playtest/gerarRework10.ts --bundle --platform=node --outfile=<scratch>/g10.cjs && OUT=<pasta> node <scratch>/g10.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, comParceiro } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { ACONTECIMENTOS_10 } from '../../src/motor/conteudo/acontecimentos10';
import { abrirDecisao, preparar } from '../../src/motor/conteudo/motor';
import type { Decisao } from '../../src/motor/conteudo/base';
import { executarAposta } from '../../src/motor/sistemas/apostas';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { writeFileSync(`${OUT}/vida-r10-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), v.moradia.municipioId, v.momento?.situacaoId ?? '', JSON.stringify(v).length); };

async function principal() {
  await carregarMundo();
  salvar('seguro', transacao(adulto(38, { semente: 1001 }), (x, r) => {
    contratar(x, r, ocupacao('vendedor'));
    x.trabalho.historico.push({ ...x.trabalho.atual!, tFim: x.t - 2, motivo: 'demissão' });
    x.trabalho.atual = undefined;
    x.trabalho.desempregadoDesde = x.t - 2;
    x.trabalho.seguroDesemprego = { parcela: 2310, restantes: 3, total: 5, tProxima: x.t + 1 };
  }).vida);

  const casal = transacao(adulto(36, { semente: 1002 }), (x, r) => { contratar(x, r, ocupacao('analista_adm')); comParceiro(x, { estagio: 'casamento', anos: 6 }); x.financas.conta = 18000; }).vida;
  const c = ACONTECIMENTOS_10.find(x => x.id === 'cas10_dinheiro') as Decisao;
  // (a vida já pode ter tido essa conversa com uma parceria anterior: o intervalo de repetição a esconderia)
  salvar('evento', transacao(casal, (x, r) => { x.ocorrencias = x.ocorrencias.filter(o => o.id !== c.id); const ctx = preparar(c, x, r); if (ctx) abrirDecisao(x, c, ctx); }).vida);

  salvar('apostadora', transacao(adulto(31, { semente: 1003 }), (x, r) => {
    contratar(x, r, ocupacao('vendedor'));
    x.financas.conta = 9000;
    for (let k = 0; k < 8; k++) executarAposta(x, r, { jogo: 'niquel', valor: 50 });
    executarAposta(x, r, { jogo: 'loteria', numeros: [4, 9, 17, 23, 31, 38] });
  }).vida);
}
void principal();
