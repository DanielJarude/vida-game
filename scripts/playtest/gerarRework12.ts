/**
 * Saves das cenas do QA visual do REWORK 12 (`rework12.mjs`):
 *   rica       São Paulo, 52 anos: imóveis (a casa, um alugado com imobiliária, um sem), uma garagem com superesportivo,
 *              clássico e carro do dia a dia, coleção (relógio, tela, memorabilia), um restaurante com gestor, um museu
 *              (com uma peça cedida) e uma parte de hotel — e anos vividos pelo motor depois.
 *   media      Recife, 36 anos: apartamento financiado, carro financiado, pouca reserva (o "rico em patrimônio, curto de caixa").
 *   guardado   mudou-se de São Paulo para Lisboa com o carro: o carro ficou guardado lá.
 *
 *   npx esbuild scripts/playtest/gerarRework12.ts --bundle --platform=node --format=esm --outfile=<scratch>/g12.mjs && SP=<pasta> node <scratch>/g12.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { avancarAno } from '../../src/motor/ano';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { ofertasDeImoveis, ofertasDeVeiculos } from '../../src/motor/sistemas/mercado';
import { ofertasDeColecao } from '../../src/motor/sistemas/colecao';
import { empresasAtivas, ofertasDeParticipacao } from '../../src/motor/sistemas/empresas';
import { migrar } from '../../src/motor/sistemas/migracao';
import type { Vida } from '../../src/motor/tipos';

const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa12`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r12-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const tenta = (v: Vida, a: Acao): Vida => { if (!podeTentar(disponibilidade(v, a))) { console.log('  não deu:', a.tipo, disponibilidade(v, a).motivo); return v; } const r = executar(v, a).vida; r.momento = null; return r; };
const responder = (v: Vida) => { for (let k = 0; k < 10 && v.momento; k++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; } return v; };
const preparar = (v: Vida, salario: number, conta: number) => {
  for (const vin of Object.values(v.vinculos)) { vin.convivio = vin.convivio.filter(c => c !== 'casa'); if (vin.romance) vin.romance = undefined; }
  v.trabalho.atual = undefined;
  contratar(v, criarRng(4), ocupacao('engenheiro_infra'));
  v.trabalho.atual!.salario = salario;
  v.trabalho.licencas.push('cnh');
  v.financas = { ...v.financas, conta, dividas: [], negativado: false };
  v.caminhos.processo = undefined; v.momento = null;
  return v;
};

await carregarMundo();

// A rica.
let r = preparar(adulto(48, { semente: 77, genero: 'feminino', municipioId: 'sao-paulo-sp' }), 60000, 45_000_000);
r.moradia = { tipo: 'aluguel', municipioId: 'sao-paulo-sp', modeloId: 'apto_2q', aluguel: 2600, padrao: 3, tInicio: r.t, aceitaPet: true, bairro: 'no centro' };
const venda = ofertasDeImoveis(r, 'venda');
const cob = venda.find(o => o.modeloId === 'cobertura') ?? venda.find(o => o.modeloId === 'alto_padrao')!;
r = tenta(r, { tipo: 'comprar_imovel', ofertaId: cob.id, financiar: false, morar: true });
for (const o of venda.filter(x => x.modeloId === 'apto_1q').slice(0, 2)) r = tenta(r, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: false });
const segundo = r.financas.bens.filter(b => b.tipo === 'imovel')[2];
if (segundo) r = tenta(r, { tipo: 'imovel', bemId: segundo.id, oque: 'administrar' });
const col = ofertasDeVeiculos(r, 'colecionador');
for (const o of [col.find(x => x.modeloId === 'superesportivo' && !x.usado), col.find(x => x.modeloId === 'classico')].filter(Boolean)) r = tenta(r, { tipo: 'comprar_veiculo', ofertaId: o!.id, financiar: false });
r = tenta(r, { tipo: 'comprar_veiculo', ofertaId: ofertasDeVeiculos(r, 'concessionaria').find(x => x.modeloId === 'carro_suv')!.id, financiar: false });
for (const l of ['relojoaria', 'galeria', 'memorabilia'] as const) { const o = ofertasDeColecao(r, l).sort((a, b) => b.preco - a.preco)[0]; if (o) r = tenta(r, { tipo: 'colecao_comprar', ofertaId: o.id }); }
r = tenta(r, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
r = responder(avancarAno(r).vida);
r = tenta(r, { tipo: 'empresa_abrir', empresa: 'museu', comSocio: false });
const p = ofertasDeParticipacao(r)[0];
if (p) r = tenta(r, { tipo: 'participacao', ofertaId: p.id });
for (let k = 0; k < 3; k++) r = responder(avancarAno(r).vida);
const museu = empresasAtivas(r).find(e => e.tipo === 'museu');
const peca = r.financas.colecao?.[0];
if (museu && peca) r = tenta(r, { tipo: 'colecao_ceder', pecaId: peca.id, empresaId: museu.id });
salvar('rica', r);

// A média: tudo financiado, pouca reserva.
let m = preparar(adulto(34, { semente: 19, genero: 'masculino', municipioId: 'recife-pe' }), 9500, 160000);
m.moradia = { tipo: 'aluguel', municipioId: 'recife-pe', modeloId: 'apto_1q', aluguel: 1300, padrao: 3, tInicio: m.t, aceitaPet: true, bairro: 'no centro' };
for (const o of ofertasDeImoveis(m, 'venda').sort((a, b) => a.preco - b.preco)) { const w = tenta(m, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 }); if (w !== m) { m = w; break; } }
const carro = ofertasDeVeiculos(m, 'usados').sort((a, b) => a.preco - b.preco)[0];
if (carro) m = tenta(m, { tipo: 'comprar_veiculo', ofertaId: carro.id, financiar: false });
for (let k = 0; k < 2; k++) m = responder(avancarAno(m).vida);
m.financas.conta = Math.min(m.financas.conta, 2500);
m.financas.investimentos = [];
salvar('media', m);

// O guardado: São Paulo → Lisboa, o carro ficou.
let g = preparar(adulto(40, { semente: 33, genero: 'feminino', municipioId: 'sao-paulo-sp' }), 22000, 900000);
g = tenta(g, { tipo: 'comprar_veiculo', ofertaId: ofertasDeVeiculos(g, 'concessionaria').find(x => x.modeloId === 'carro_sedan')!.id, financiar: false });
g = transacao(g, (x, rr) => { migrar(x, rr, 'pt:lisboa', 'trabalho'); }).vida;
g = responder(avancarAno(g).vida);
salvar('guardado', g);
