/**
 * VIDA 12.9 — saves do QA visual (`vida129.mjs`). Os de 12.8 (mansão, apto) são regerados aqui também (a composição
 * nova dos cômodos), mais:
 *   jovem     São Paulo, 24: piercings (nariz, helix, sobrancelha), looks com nome, violão com aula, fotografia,
 *             amigos e família por perto (encontros, calendário), retrospectiva com memórias
 *   SP=<pasta> node <bundle>.mjs (npx esbuild ... --format=esm)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { idade } from '../../src/motor/nucleo';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { receberCoisa } from '../../src/motor/sistemas/coisas';
import type { Imovel, Vida } from '../../src/motor/tipos';

await carregarMundo();
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa129`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r129-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v)); };
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : (console.log('  não deu:', JSON.stringify(a).slice(0, 120), disponibilidade(v, a).motivo), v));
const P = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });

{
  let v = adulto(24, { semente: 1290, municipioId: 'sao-paulo-sp', genero: 'feminino' });
  v.financas.conta = 60_000; v.financas.dividas = []; v.financas.negativado = false;
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa', valor: 600_000, tCompra: v.t - 24, municipioId: 'sao-paulo-sp', estado: 85 } as Imovel;
  v.financas.bens = [...v.financas.bens.filter(b => b.tipo !== 'imovel'), casa];
  v.moradia = { tipo: 'propria', municipioId: 'sao-paulo-sp', imovelId: 'icasa', modeloId: 'casa_3q', aluguel: 0, padrao: 3, tInicio: v.t - 24 };
  for (const vin of Object.values(v.vinculos)) { const p = v.pessoas[vin.pessoaId]; if (p?.vivo && !p.especie) p.municipioId = 'sao-paulo-sp'; if (!vin.parentesco && vin.proximidade < 40) vin.proximidade = 45; }
  for (const id of ['camiseta_lisa', 'jeans', 'tenis_casual']) v = tenta(v, { tipo: 'comprar_item', itemId: id });
  v = tenta(v, P({ o: 'look_salvar', nome: 'Casual' }));
  for (const id of ['camisa_social', 'calca_alfaiataria', 'sapato_social']) v = tenta(v, { tipo: 'comprar_item', itemId: id });
  v = tenta(v, P({ o: 'look_salvar', nome: 'Trabalho' }));
  for (const id of ['pc_nariz_ponto_zirconia', 'pc_helix_trio', 'pc_sobrancelha_barra', 'brincos']) v = tenta(v, { tipo: 'comprar_item', itemId: id });
  receberCoisa(v, 'violao', 900); receberCoisa(v, 'camera', 3000); receberCoisa(v, 'churrasqueira', 1800);
  v.rotinas = v.rotinas.filter(r => r.id !== 'musica' && r.id !== 'fotografia');
  v.rotinas.push({ id: 'musica', tInicio: v.t - 60, nivel: 2 } as never, { id: 'fotografia', tInicio: v.t - 36, nivel: 1 } as never);
  v.caminhos.hobbies129 = { instrumento: 'violao', instrumentos: { violao: 42, piano: 8 }, marcos: [{ id: 'musica:violao:1', t: v.t - 40, texto: 'Tocou uma música inteira de ponta a ponta no violão, sem parar.' }, { id: 'musica:violao:2', t: v.t - 14, texto: 'Já toca de ouvido no violão: a música toca no rádio, você acompanha.' }] };
  salvar('jovem', v);
}
