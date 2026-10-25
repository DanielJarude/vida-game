/**
 * Saves das cenas do QA visual do REWORK 12.2 (`rework122.mjs`):
 *   empresario  São Paulo, 50 anos: restaurante (próprio, com chef e avaliações), hotel e zoológico (delegados), museu
 *               (com exposição) — anos vividos pelo motor depois, para haver números, avaliações e alertas.
 *   bilionaria  São Paulo, 55 anos, patrimônio de bilhão: vê a venda privada e o leilão especial; uma peça única.
 *   objetos     Recife, 32 anos: o relógio e a corrente da "Relógios e joias de usar" (PAT-12.2-01), nada de coleção.
 *   exotica     São Paulo, 34 anos, casa com quintal: viveiro e uma arara (ou o furão), com cuidador.
 *   porfora     São Paulo, 38 anos, no Submundo (contrabando) com um negócio por fora e uma empresa de fachada.
 *   npx esbuild scripts/playtest/gerarRework122.ts --bundle --platform=node --format=esm --outfile=<scratch>/g.mjs && SP=<pasta> node <scratch>/g.mjs
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
import { ofertasDeColecao } from '../../src/motor/sistemas/colecao';
import { empresasAtivas } from '../../src/motor/sistemas/empresas';
import { ofertasExoticas } from '../../src/motor/sistemas/exoticos';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { criarContato } from '../../src/motor/sistemas/submundo';
import { negocios, processarClandestinos } from '../../src/motor/sistemas/clandestinos';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa122`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r122-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const tenta = (v: Vida, a: Acao): Vida => { if (!podeTentar(disponibilidade(v, a))) { console.log('  não deu:', a.tipo, JSON.stringify(a).slice(0, 80), disponibilidade(v, a).motivo); return v; } const r = executar(v, a).vida; r.momento = null; return r; };
const responder = (v: Vida) => { for (let k = 0; k < 10 && v.momento; k++) { const op = v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]; v = executar(v, { tipo: 'decidir', opcaoId: op.id }).vida; } return v; };
const ano = (v: Vida) => { v = responder(avancarAno(v).vida); v.momento = null; delete v.fila; v.anoAtual.acoes = []; return v; };
const preparar = (v: Vida, conta: number, cidade = 'sao-paulo-sp') => {
  for (const vin of Object.values(v.vinculos)) { vin.convivio = vin.convivio.filter(c => c !== 'casa'); if (vin.romance) vin.romance = undefined; }
  v.trabalho.atual = undefined;
  contratar(v, criarRng(4), ocupacao('engenheiro_infra'));
  v.trabalho.licencas.push('cnh');
  v.financas = { ...v.financas, conta, dividas: [], negativado: false };
  v.moradia = { tipo: 'aluguel', municipioId: cidade, modeloId: 'casa_3q', aluguel: 6000, padrao: 4, tInicio: v.t, aceitaPet: true, bairro: 'no Morumbi' };
  v.caminhos.processo = undefined; v.momento = null; delete v.fila;
  return v;
};

// O empresário com quatro negócios diferentes, depois de uns anos.
{
  let v = preparar(adulto(46, { semente: 61 }), 120_000_000);
  v = tenta(v, { tipo: 'empresa_abrir', empresa: 'restaurante', comSocio: false });
  const r = empresasAtivas(v)[0].id;
  v = tenta(v, { tipo: 'empresa', empresaId: r, decisao: 'assumir' });
  v = tenta(v, { tipo: 'setor', empresaId: r, decisao: 'chef' });
  v = tenta(v, { tipo: 'setor', empresaId: r, decisao: 'fornecedor', alvo: 'local' });
  v = ano(v);
  v = tenta(v, { tipo: 'empresa_abrir', empresa: 'hotel', comSocio: false });
  v = ano(v);
  v = tenta(v, { tipo: 'empresa_abrir', empresa: 'zoologico', comSocio: false });
  v = ano(v);
  v = tenta(v, { tipo: 'empresa_abrir', empresa: 'museu', comSocio: false });
  for (let k = 0; k < 3; k++) v = ano(v);
  const m = empresasAtivas(v).find(e => e.tipo === 'museu');
  if (m) { const ex = m.setor?.museu?.obras[0]?.tema; if (ex) v = tenta(v, { tipo: 'setor', empresaId: m.id, decisao: 'exposicao', alvo: ex }); }
  salvar('empresario', v);
}
// A bilionária: venda privada, leilão especial, uma peça única.
{
  let v = preparar(adulto(55, { semente: 73 }), 3_000_000_000);
  for (let k = 0; k < 8; k++) {
    const e = ofertasDeColecao(v, 'leilao').find(o => o.canal === 'especial');
    if (e) { v = tenta(v, { tipo: 'colecao_comprar', ofertaId: e.id }); break; }
    v = transacao(v, x => { x.t += 12; }).vida;
  }
  const p = ofertasDeColecao(v, 'relojoaria').find(o => o.canal === 'privada');
  if (p) v = tenta(v, { tipo: 'colecao_comprar', ofertaId: p.id });
  salvar('bilionaria', v);
}
// Objetos: o que se compra para usar.
{
  let v = preparar(adulto(32, { semente: 5 }), 60_000, 'recife-pe');
  v.moradia.modeloId = 'apto_2q';
  v = tenta(v, { tipo: 'comprar_item', itemId: 'relogio_luxo' });
  v = tenta(v, { tipo: 'comprar_item', itemId: 'corrente_prata' });
  salvar('objetos', v);
}
// A exótica: instalação, bicho, cuidador.
{
  let v = preparar(adulto(34, { semente: 9 }), 400_000);
  let o = ofertasExoticas(v).find(x => x.especie === 'arara' || x.especie === 'furao');
  for (let k = 0; !o && k < 8; k++) { v = transacao(v, x => { x.t += 12; }).vida; o = ofertasExoticas(v).find(x => x.especie === 'arara' || x.especie === 'furao'); }
  if (o) { v = tenta(v, { tipo: 'instalacao_comprar', instalacao: o.instalacao }); v = tenta(v, { tipo: 'exotico_comprar', ofertaId: o.id }); }
  salvar('exotica', v);
}
// No Submundo: negócio por fora e empresa de fachada.
{
  let v = preparar(adulto(38, { semente: 23 }), 3_000_000);
  v = transacao(v, (x, r) => { delete x.fatos['proposta_ilicita']; entrar(x, 'mercado', undefined, r); for (const s of Object.values(x.caminhos.envolvimento!.especializacoes ?? {})) if (s) s.experiencia = 45; criarContato(x, 'contrabando', 'fornecedor'); criarContato(x, 'contrabando', 'parceiro'); }).vida;
  v = tenta(v, { tipo: 'empresa_abrir', empresa: 'loja', comSocio: false });
  v = tenta(v, { tipo: 'clandestino', oque: 'abrir', alvo: 'mercadorias' });
  const n = negocios(v)[0];
  const loja = empresasAtivas(v)[0];
  if (n && loja) v = tenta(v, { tipo: 'clandestino', oque: 'fachada', negocioId: n.id, alvo: loja.id });
  // Um ano do negócio sem passar pelas perguntas do ano (o gerador não deve decidir por ela largar o caminho).
  v = transacao(v, (x, r) => { x.t += 12; processarClandestinos(x, r); }).vida;
  salvar('porfora', v);
}
