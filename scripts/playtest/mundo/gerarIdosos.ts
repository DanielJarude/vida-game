/**
 * Saves de teste: pessoas idosas, com filhos e patrimônio, em países estrangeiros —
 * para importar pela interface e viver até a morte (tela do fim, legado e sucessão).
 *   npx esbuild scripts/playtest/mundo/gerarIdosos.ts --bundle --platform=node --outfile=<scratch>/gi.cjs && SP=<scratch> node <scratch>/gi.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../../src/motor/dados/lugares';
import { exportarVida } from '../../../src/motor/save';
import { adulto, comFilho, comParceiro } from '../../../src/motor/__tests__/cenarios';

const SP = process.env.SP ?? '/tmp';
await carregarMundo();
for (const [pais, sem] of [['DE', 5], ['JP', 7], ['US', 9], ['AR', 3], ['PT', 4]] as const) {
  const cidades = cidadesDoPais(pais);
  const c = cidades.find(x => x.perfil === 'metropole') ?? cidades[0];
  const v = adulto(86, { semente: sem, genero: 'masculino', municipioId: c.id });
  for (const vin of Object.values(v.vinculos)) if (vin.parentesco === 'mae' || vin.parentesco === 'pai') v.pessoas[vin.pessoaId].vivo = false;
  const { p: esp } = comParceiro(v, { idade: 83, estagio: 'casamento', anos: 55, genero: 'feminino' });
  comFilho(v, 55, { outroId: esp.id, casa: false, genero: 'feminino' });
  comFilho(v, 50, { outroId: esp.id, casa: false, genero: 'masculino' });
  v.fatos[`uniao_${esp.id}`] = v.t - 660; v.fatos[`patrimonio_uniao_${esp.id}`] = 0;
  v.financas.conta = 150000;
  v.financas.bens = [{ id: 'icasa', tipo: 'imovel', modeloId: 'apto_3q', nome: 'apartamento de três quartos', valor: 520000, tCompra: v.t - 400, municipioId: v.moradia.municipioId, estado: 70, dono: 'casal' } as never];
  v.moradia = { tipo: 'propria', municipioId: v.moradia.municipioId, imovelId: 'icasa', modeloId: 'apto_3q', aluguel: 0, padrao: 4, tInicio: v.t - 400 } as never;
  v.corpo.saude = 8;
  writeFileSync(`${SP}/idoso-${pais}.json`, exportarVida(v));
  console.log(pais, c.id, v.eu.nome, v.eu.sobrenome);
}
