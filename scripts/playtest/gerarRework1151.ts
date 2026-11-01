/**
 * Saves da auditoria visual do HOTFIX 11.5.1 (`rework1151.mjs`), montados e vividos pelo motor:
 *   moda     São Paulo, 28, pele clara: tatuagens (fechamento, antebraço, costas, pescoço), óculos Juliet, camisa de
 *            time, bermuda e chinelo — e dinheiro para as compras
 *   escura   Salvador, 33, pele p6: tatuagens coloridas, chapéu de couro, regata
 *   jogador  Rio, 19 → 27: atacante profissional na elite, oito temporadas vividas (a tabela, os campeões, os prêmios)
 *   npx esbuild scripts/playtest/gerarRework1151.ts --bundle --platform=node --format=esm --outfile=<s>/g.mjs && SP=<pasta> node <s>/g.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { avancarAno } from '../../src/motor/ano';
import { criarRng } from '../../src/motor/rng';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa1151`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r1151-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : (console.log('  não deu:', JSON.stringify(a).slice(0, 90), disponibilidade(v, a).motivo), v));
const viverUm = (v: Vida) => { v = avancarAno(v).vida; for (let i = 0; i < 10 && v.momento; i++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida; v.momento = null; return v; };
const vestir = (v: Vida, ids: string[]) => { for (const id of ids) { v = tenta(v, { tipo: 'comprar_item', itemId: id }); const x = v.eu.estilo?.itens.find(y => y.itemId === id); if (x && !x.usando) v = tenta(v, { tipo: 'usar_item', itemId: id, usar: true }); } return v; };

// moda: pele clara, tatuagens e o visual de baile
let moda = transacao(adulto(28, { semente: 115101, genero: 'masculino', municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 400_000; x.eu.visual.pele = 'p1'; x.eu.visual.corCabelo = 'loiro'; x.momento = null; }).vida;
moda = vestir(moda, ['camisa_time', 'bermuda_tactel', 'chinelo_slide', 'oculos_juliet']);
for (const [desenho, local, lado] of [['fechamento', 'braco', 'd'], ['rosa_tradicional', 'antebraco', 'e'], ['nome_cursivo', 'antebraco', 'e'], ['ramo_fino', 'pescoco', 'e'], ['dragao_costas', 'costas', undefined], ['tribal_faixa', 'panturrilha', 'd']] as const)
  moda = tenta(moda, { tipo: 'tatuar', desenho, local, ...(lado ? { lado } : {}) });
salvar('moda', moda);

// escura: pele p6, tatuagens coloridas, chapéu de couro
let escura = transacao(adulto(33, { semente: 115102, genero: 'feminino', municipioId: 'salvador-ba' }), x => { x.financas.conta = 120_000; x.eu.visual.pele = 'p6'; x.momento = null; }).vida;
escura = vestir(escura, ['regata', 'jeans', 'tenis_lona', 'chapeu_couro', 'pulseira_contas']);
for (const [desenho, local, lado] of [['peonia', 'braco', 'd'], ['girassol', 'antebraco', 'e'], ['carpa', 'costas', undefined], ['lua_estrelas', 'mao', 'e']] as const)
  escura = tenta(escura, { tipo: 'tatuar', desenho, local, ...(lado ? { lado } : {}) });
salvar('escura', escura);

// jogador: atacante na elite, oito temporadas
let jog = transacao(adulto(19, { semente: 115103, genero: 'masculino', municipioId: 'rio-de-janeiro-rj' }), x => {
  garantirFrente(x, 'futebol');
  Object.assign(x.caminhos.frentes.futebol!, { habilidade: 96, interesse: 95, meses: 140, auge: 98 });
  x.corpo.forma = 90;
  x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
  entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Flamengo');
  profissionalizar(x, criarRng(3), 4);
  x.momento = null; x.caminhos.pendente = undefined;
}).vida;
for (let a = 0; a < 8; a++) jog = viverUm(jog);
console.log('  temporadas', jog.caminhos.esporte?.temporadas?.length, 'prêmios do mundo', jog.caminhos.futebolMundo?.premios.length, 'tabela', !!jog.caminhos.ligas?.BR?.ultima?.tabelas?.[4]);
salvar('jogador', jog);
