// VIDA 30 · §6 — o ano a ano de UMA propriedade (as linhas do resultado): para achar o que pesa. PERFIL=sitio|agricola|chacara|pecuaria HA= S=
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { novaPropriedade, povoar, viverAnoDaPropriedade } from '../../src/motor/v18/rural/fazenda18';
import type { Imovel } from '../../src/motor/tipos';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
await carregarMundo();
const tipo = (process.env.PERFIL ?? 'sitio') as never;
const ha = Number(process.env.HA ?? 25);
const s = Number(process.env.S ?? 1);
const v = viverAte(nova({ semente: 3000 + s, genero: 'feminino', municipioId: 'uberlandia-mg' } as never), 32);
v.momento = null;
if (!process.env.TERCEIRO) contratar(v, criarRng(s), ocupacao('produtor_rural')); else v.trabalho.atual = undefined;
const r = criarRng(7000 + s);
const p = novaPropriedade(v, r, tipo, ha, 'uberlandia-mg', 'compra' as never);
povoar(p, r, Math.floor(v.t / 12) + 1, 0.6);
if (process.env.SOLO) p.solo = Number(process.env.SOLO);
const im = { id: 'imx', tipo: 'imovel', modeloId: 'sitio', nome: p.nome, valor: 0, tCompra: v.t, municipioId: 'uberlandia-mg', estado: 70, bairro: 'rural', historia: [], dono: 'eu', rural: p } as unknown as Imovel;
v.financas.bens.push(im);
console.log(p.nome, p.ha, 'talhões', p.talhoes.map(t => `${t.cultura}:${t.ha}ha(${t.ano})`).join(','), 'reb', p.rebanhos.map(x => `${x.especie}:${x.cabecas}`).join(','), 'estr', p.estruturas.map(e => e.id).join(','));
for (let a = 0; a < Number(process.env.ANOS ?? 10); a++) {
  const reg = viverAnoDaPropriedade(v, p, im, p.ultimoAno + 1)!;
  console.log(`${reg.ano} ${reg.clima.padEnd(9)} res ${reg.resultado.toLocaleString('pt-BR').padStart(10)} solo ${Math.round(p.solo)} | ` + reg.linhas.map(l => `${l.oque.slice(0, 26)} ${l.receita ? '+' + l.receita.toLocaleString('pt-BR') : ''}${l.custo ? '-' + l.custo.toLocaleString('pt-BR') : ''}${l.nota ? ` (${l.nota})` : ''}`).join(' · '));
}
