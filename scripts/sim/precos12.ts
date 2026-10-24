/**
 * REWORK 12 · Fase C/D — plausibilidade dos preços por mercado: rendimento bruto do aluguel (dois quartos, alto
 * padrão, mansão), o alto padrão no bairro nobre × a mansão afastada, e o preço de um carro na moeda local.
 *   npx esbuild scripts/sim/precos12.ts --bundle --platform=node --format=esm --outfile=<scratch>/p.mjs && node <scratch>/p.mjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { cidadesDoPais, municipio } from '../../src/motor/dados/lugares';
import { modeloMoradia, versaoVeiculo } from '../../src/motor/dados/bens';
import { aluguelDe, precoDeImovel, precoNovoNoPais, versoesNoPais } from '../../src/motor/sistemas/mercado';
import { fatorDoBairro } from '../../src/motor/sistemas/precos';
import { emMoedaLocal, simboloDaMoeda, moedaDoPais } from '../../src/motor/mundo/moeda';

await carregarMundo();
const v = adulto(30);
const PAISES = ['BR', 'US', 'DE', 'CH', 'GB', 'PT', 'AR', 'MX', 'JP', 'IN', 'NG', 'ZA', 'AU'];
const linhas: string[] = [];
const fmt = (x: number, p: string) => `${simboloDaMoeda(moedaDoPais(p))} ${Math.round(emMoedaLocal(x, p)).toLocaleString('pt-BR')}`;
for (const p of PAISES) {
  const cidades = (p === 'BR' ? [municipio('sao-paulo-sp'), municipio('recife-pe'), ...cidadesDoPais('BR').filter(c => c.perfil === 'pequena').slice(0, 1)] : cidadesDoPais(p).slice(0, 2)).filter(Boolean);
  for (const c of cidades) {
    const y = (id: string) => (aluguelDe(v, modeloMoradia(id), c.id) * 12 / precoDeImovel(v, modeloMoradia(id), c.id) * 100).toFixed(1);
    const nobre = precoDeImovel(v, modeloMoradia('alto_padrao'), c.id) * fatorDoBairro(1.5, 'alto_padrao', 'preco');
    const mansaoLonge = precoDeImovel(v, modeloMoradia('mansao'), c.id) * fatorDoBairro(0.62, 'mansao', 'preco');
    const corolla = precoNovoNoPais(versaoVeiculo('toyota_corolla')!, c.id);
    const nVersoes = versoesNoPais(p).length;
    linhas.push(`${p} ${c.nome.padEnd(18)} ${c.perfil.padEnd(13)} rend 2q ${y('apto_2q')}% alto ${y('alto_padrao')}% mansão ${y('mansao')}% | 2q ${fmt(precoDeImovel(v, modeloMoradia('apto_2q'), c.id), p)} aluguel ${fmt(aluguelDe(v, modeloMoradia('apto_2q'), c.id), p)} | alto nobre ${fmt(nobre, p)} > mansão afastada ${fmt(mansaoLonge, p)}: ${nobre > mansaoLonge} | Corolla ${fmt(corolla, p)} | ${nVersoes} versões`);
  }
}
console.log(linhas.join('\n'));
