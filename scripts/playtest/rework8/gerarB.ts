/**
 * REWORK 8 (Fase B) — o save da auditoria das ilustrações em Pertences e na Casa: a vida rica do REWORK 6 (`vida-r6-rica`)
 * compra, por ações de verdade, um carro zero, um usado, uma moto e uma coisa de cada loja (o violão, a guitarra, o
 * notebook, a câmera, a máquina de lavar, o sofá, a raquete, os livros...) — para que Pertences, a Casa (o carro na
 * porta) e as fichas mostrem os desenhos com dados reais.
 *   npx esbuild scripts/playtest/rework8/gerarB.ts --bundle --platform=node --outfile=<s>/gB.cjs && SP=<pasta> node <s>/gB.cjs
 *   (lê <pasta>/saves/vida-r6-rica.json; grava <pasta>/saves/vida-r8-posses.json)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../../src/motor/mundo/carregar';
import { executar, type Acao } from '../../../src/motor/acoes';
import { interpretar } from '../../../src/motor/save';
import { ofertasDeVeiculos } from '../../../src/motor/sistemas/mercado';
import type { Vida } from '../../../src/motor/tipos';

const SP = process.env.SP ?? '/tmp/vida-r8';

async function principal() {
  await carregarMundo();
  const lido = interpretar(readFileSync(`${SP}/saves/vida-r6-rica.json`, 'utf8'));
  if (lido.tipo !== 'ok') throw new Error('save da vida rica ilegível');
  let v: Vida = lido.vida;
  const tentar = (a: Acao) => { const r = executar(v, a); console.log(JSON.stringify(a).slice(0, 80), '→', (r.resultado ?? r.aviso?.texto ?? '').slice(0, 60)); v = r.vida; v.momento = null; };
  // A carteira entra direto (o dado do motor, `trabalho.licencas`), sem a autoescola: o que se audita aqui é o desenho.
  if (!v.trabalho.licencas.includes('cnh')) v.trabalho.licencas.push('cnh');
  for (const [loja, k] of [['concessionaria', 3], ['usados', 1]] as const) {
    const o = ofertasDeVeiculos(v, loja)[k];
    if (o) tentar({ tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
  }
  const moto = ofertasDeVeiculos(v, 'motos').find(o => !/bike|bicicleta/.test(o.modeloId));
  if (moto) tentar({ tipo: 'comprar_veiculo', ofertaId: moto.id, financiar: false });
  for (const c of ['violao', 'guitarra', 'notebook', 'camera', 'maquina_lavar', 'sofa', 'raquete', 'livros', 'tabuleiro', 'celular_topo', 'caixa_som', 'esteira'])
    tentar({ tipo: 'comprar_coisa', coisaId: c });
  writeFileSync(`${SP}/saves/vida-r8-posses.json`, JSON.stringify(v));
  console.log('veículos', v.financas.bens.filter(b => b.tipo === 'veiculo').length);
}
principal();
