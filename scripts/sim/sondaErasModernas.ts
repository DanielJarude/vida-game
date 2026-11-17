// ERAS MODERNAS — sonda de catálogo e preços ano a ano (1990–2032) para uma vida histórica de 30 anos em São Paulo:
// ofertas de veículos, vagas, preços de referência e o salário de uma ocupação — procura saltos e vazios na virada da série.
import { criarVida } from '../../src/motor/criacao';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { ofertasDeVeiculos } from '../../src/motor/sistemas/mercado';
import { vagasDisponiveis } from '../../src/motor/sistemas/trabalho';
import { precoDoItem } from '../../src/motor/sistemas/estilo';
import { precoDaCoisa } from '../../src/motor/sistemas/coisas';
import { salarioLocal } from '../../src/motor/sistemas/renda';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { formatarDinheiro } from '../../src/motor/mundo/moeda';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();
const base = criarVida({ nome: 'Ana', sobrenome: 'Sonda', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 4242, ano: 1990, era: true } as never);
for (let ano = 1990; ano <= 2032; ano++) {
  const v: Vida = structuredClone(base);
  v.t = ano * 12 + 5; v.eu.tNasc = v.t - 30 * 12; v.moradia.tipo = 'aluguel' as never;
  entrarNaVida(v);
  const conc = ofertasDeVeiculos(v, 'concessionaria' as never), us = ofertasDeVeiculos(v, 'usados' as never);
  let vagas = -1; try { vagas = vagasDisponiveis(v).length; } catch (e) { vagas = -2; }
  const sal = (id: string) => { try { return Math.round(salarioLocal(v, ocupacao(id)!)); } catch { return NaN; } };
  console.log(`${ano} carros novos ${conc.length} usados ${us.length} vagas ${vagas} jeans ${Math.round(precoDoItem(v, 'jeans'))} geladeira ${Math.round(precoDaCoisa(v, 'geladeira'))} sal.prof ${sal('professor')} sal.medico ${sal('medico')} sal.caixa ${sal('caixa')} · ${formatarDinheiro(1000)}`);
}
