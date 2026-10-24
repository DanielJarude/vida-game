/**
 * Saves das cenas do QA visual do REWORK 11.5 (`rework115.mjs`). Os saves do REWORK 11 (`gerarRework11.ts`: ator,
 * técnico, músico, político, noiva) entram como SAVES ANTIGOS — abertos pelo jogo novo (os normalizadores do 11.5) —;
 * estes são os novos:
 *   goleiro    goleiro do Cruzeiro com três temporadas jogadas pelo motor e a galeria (títulos de competições diferentes)
 *   submundo   contrabando + crime organizado, contatos com ficha, organizações, anos vividos pelo motor
 *   politico   o político do REWORK 11 com uma aliança fechada (a promessa em aberto)
 *   fila       um ano com duas decisões: a primeira aberta, a outra esperando
 *   tecnico    o técnico do REWORK 11 com a estratégia escolhida (5-3-2) e o goleiro-treinador do clube
 *
 *   npx esbuild scripts/playtest/gerarRework115.ts --bundle --platform=node --outfile=<scratch>/g115.cjs && SP=<pasta> node <scratch>/g115.cjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { executar } from '../../src/motor/acoes';
import { avancarAno } from '../../src/motor/ano';
import { fecharTemporada } from '../../src/motor/sistemas/esporte';
import { registrarConquista, registrarTemporada } from '../../src/motor/sistemas/palmares';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { criarContato } from '../../src/motor/sistemas/submundo';
import { CATALOGO } from '../../src/motor/conteudo/catalogo';
import { abrirDecisao, conteudoPorId, familiaDe, preparar } from '../../src/motor/conteudo/motor';
import { interpretar } from '../../src/motor/save';
import type { CarreiraEsportiva, Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa115`;
const salvar = (nome: string, v: Vida, manterMomento = false) => { if (!manterMomento) { v.momento = null; delete v.fila; } v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r115-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const em = (v: Vida, f: (x: Vida, r: ReturnType<typeof criarRng>) => void) => transacao(v, (x, r) => { f(x, r); }).vida;
const antigo = (nome: string): Vida => { const l = interpretar(readFileSync(`${SP}/saves/vida-r11-${nome}.json`, 'utf8')); if (l.tipo !== 'ok') throw new Error(`save antigo ${nome}: ${l.tipo}`); return l.vida; };
const responder = (v: Vida, r: ReturnType<typeof criarRng>) => { for (let k = 0; k < 10 && v.momento; k++) { const op = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: op[r.int(0, op.length - 1)].id }).vida; } return v; };

async function principal() {
  await carregarMundo();
  // O goleiro: três temporadas pelo motor; a galeria com o que ele ganhou e com títulos de outras competições.
  let g = em(adulto(27, { semente: 21, genero: 'masculino', municipioId: 'belo-horizonte-mg' }), x => {
    x.momento = null; delete x.fila;
    x.caminhos.frentes.futebol = { habilidade: 90, interesse: 80, meses: 200, auge: 90, tInicio: x.t - 200 } as never;
    x.corpo.forma = 80;
    x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Cruzeiro', nivel: 4, tInicio: x.t - 72, tFase: x.t - 60, lesoes: 0, municipioId: 'belo-horizonte-mg', reputacao: 70, espaco: 'titular', contratoAte: x.t + 36, posicao: 'goleiro', temporadas: [] } as CarreiraEsportiva;
    x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Cruzeiro', contrato: 'clt', salario: 60000, tInicio: x.t - 60, desempenho: 75, municipioId: 'belo-horizonte-mg', carga: 'integral' };
  });
  for (let k = 0; k < 3; k++) g = em(g, (x, r) => { const e = x.caminhos.esporte!; const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); x.t += 12; });
  g = em(g, x => {
    const a = Math.floor(x.t / 12);
    registrarConquista(x, { tipo: 'titulo', modalidade: 'futebol', ano: a - 3, competicao: 'Copa do Brasil', competicaoId: 'copa:BR', clube: 'Cruzeiro', papel: 'protagonista', texto: 'Campeão da Copa do Brasil com o Cruzeiro' });
    registrarConquista(x, { tipo: 'titulo', modalidade: 'futebol', ano: a - 2, competicao: 'Copa Libertadores', competicaoId: 'cont:CONMEBOL', clube: 'Cruzeiro', papel: 'protagonista', texto: 'Campeão da Copa Libertadores com o Cruzeiro' });
    registrarConquista(x, { tipo: 'titulo', modalidade: 'futebol', ano: a - 2, competicao: 'Copa América', competicaoId: 'sel:CONMEBOL', clube: 'Brasil', papel: 'elenco', texto: 'Campeão da Copa América com a seleção' });
    registrarConquista(x, { tipo: 'premio', modalidade: 'futebol', ano: a - 1, competicao: 'Série A', clube: 'Cruzeiro', texto: 'Seleção da Série A, como goleiro' });
    registrarConquista(x, { tipo: 'final', modalidade: 'futebol', ano: a - 1, competicao: 'Copa do Brasil', competicaoId: 'copa:BR', clube: 'Cruzeiro', texto: 'Final da Copa do Brasil com o Cruzeiro' });
  });
  salvar('goleiro', g);

  // O Submundo: contrabando e crime organizado, contatos com ficha, anos vividos pelo motor.
  let s = em(adulto(30, { semente: 909, genero: 'feminino', municipioId: 'recife-pe' }), (x, r) => { x.momento = null; delete x.fila; entrar(x, 'mercado', undefined, r); x.financas.conta = 120000; x.caminhos.envolvimento!.reputacao = 35; criarContato(x, 'contrabando', 'fornecedor'); criarContato(x, 'contrabando', 'comprador', 1); });
  s = executar(s, { tipo: 'submundo', oque: 'entrar_ramo', ramo: 'organizado' }).vida;
  const rs = criarRng(5);
  for (let k = 0; k < 4 && !s.justica?.prisao; k++) { s = responder(avancarAno(s).vida, rs); if (k === 1) s = executar(s, { tipo: 'submundo', oque: 'comprar_lote', ramo: 'contrabando' }).vida; }
  salvar('submundo', s);

  // O político do REWORK 11 com uma aliança (e a promessa em aberto).
  salvar('politico', executar(antigo('politico'), { tipo: 'alianca', oque: 'formar' }).vida);

  // O técnico do REWORK 11 com a estratégia escolhida.
  salvar('tecnico', executar(antigo('tecnico'), { tipo: 'tatica', estilo: 'defensivo' }).vida);

  // Um ano com duas decisões: a primeira aberta, a outra esperando.
  const f = em(adulto(34, { semente: 15 }), (x, r) => {
    x.momento = null; delete x.fila;
    const ids = CATALOGO.filter(c => c.tipo === 'decisao' && !c.papeis && !c.manual && preparar(c, x, r)).map(c => c.id);
    const a = ids[0], b = ids.find(id => familiaDe(id) !== familiaDe(a))!;
    const d = conteudoPorId(a)!;
    if (d.tipo === 'decisao') abrirDecisao(x, d, preparar(d, x, r)!);
    x.fila = [{ id: b, t: x.t, papeis: {}, prioridade: 1 }];
  });
  salvar('fila', f, true);
}
principal();
