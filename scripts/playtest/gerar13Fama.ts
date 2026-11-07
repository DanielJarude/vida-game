/**
 * VIDA 13 · Fama — saves do QA visual da parte Fama de Você: o jogador muito famoso (do save de 11.5.1, alguns anos
 * vividos com o 13 para a série, os marcos e uma campanha aceita) e uma conhecida local (a parte aparece pequena).
 *   npx esbuild scripts/playtest/gerar13Fama.ts --bundle --platform=node --format=esm --outfile=<x>.mjs && SP=<pasta> node <x>.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { interpretar } from '../../src/motor/save';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { receberDaFama13, registrarMarcos13, valorDaCampanha13 } from '../../src/motor/sistemas/reconhecimento13';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/a13/qafama`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-13-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, Math.round(v.notoriedade?.valor ?? 0), (v.fama13?.marcos ?? []).length); };
{
  const r = interpretar(readFileSync(`${process.env.HOME}/vida-trabalho/qa126/saves/vida-r1151-jogador.json`, 'utf8'));
  if (r.tipo !== 'ok') throw new Error('save');
  let v = r.vida;
  for (let k = 0; k < 4; k++) { v = avancarAno(v).vida; for (let j = 0; j < 8 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida; }
  receberDaFama13(v, valorDaCampanha13(v), 'Campanhas e publicidade');
  v.fatos['vis_polemica'] = v.t - 30;
  registrarMarcos13(v);
  salvar('jogador', v);
}
{
  const v = adulto(31, { semente: 1313, municipioId: 'recife-pe', genero: 'feminino' });
  v.caminhos.arte = { linguagem: 'musica', nome: 'Maré Alta', tipo: 'banda', tInicio: v.t - 80, publico: 34, membros: [], ativo: true };
  v.notoriedade = { valor: 22, pico: 22, t: v.t, fonte: 'arte', origens: { arte: 22 } };
  v.fama13 = { serie: [[Math.floor(v.t / 12) - 4, 4], [Math.floor(v.t / 12) - 3, 9], [Math.floor(v.t / 12) - 2, 14], [Math.floor(v.t / 12) - 1, 19], [Math.floor(v.t / 12), 22]] };
  registrarMarcos13(v);
  salvar('cantora', v);
}
