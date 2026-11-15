/** VIDA 22 · saves para a inspeção visual (OUT=<pasta>): casa própria com obras e quintal; propriedades rurais compradas; nome famoso; guarda-roupa. */
import { writeFileSync } from 'fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { idade, transacao } from '../../src/motor/nucleo';
import { ofertasRurais } from '../../src/motor/v18/rural/acoes18';
import type { Imovel, Vida } from '../../src/motor/tipos';
import { carregarMundo } from '../../src/motor/mundo/carregar';
await carregarMundo();
const OUT = process.env.OUT!;
const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; x.fila = undefined; return x; };
const ate = (v: Vida, i: number) => { while (idade(v) < i) v = ano(v); return v; };
const faz = (v: Vida, a: unknown) => (podeTentar(disponibilidade(v, a as Acao)) ? executar(v, a as Acao).vida : v);
const salvar = (n: string, v: Vida) => writeFileSync(`${OUT}/vida-v22-${n}.json`, JSON.stringify(v));
const base = (semente: number, cidade = 'sao-paulo-sp', genero: 'feminino' | 'masculino' = 'feminino') => ate(criarVida({ nome: 'Lia', sobrenome: 'Prado', genero, municipioId: cidade, semente }), 32);

// Casa própria (casa de três quartos num bairro tradicional) com piscina construída, área de lazer, varanda e coisas no quintal.
let c = base(2201);
c = transacao(c, x => {
  x.financas.conta = 1_500_000;
  const im = { id: 'im22', tipo: 'imovel', modeloId: 'casa_3q', nome: 'casa de três quartos', valor: 980000, tCompra: x.t - 60, municipioId: x.moradia.municipioId, estado: 82, precoPago: 720000, bairro: 'num bairro tradicional',
    lar: { extras: [{ id: 'piscina', tipo: 'piscina', de: 'obra', t: x.t - 30 }, { id: 'lazer', tipo: 'lazer', de: 'obra', t: x.t - 20 }, { id: 'varanda', tipo: 'varanda', de: 'obra', t: x.t - 10 }], acabamentos: {}, externo: { paisagismo: 'canteiros', portao: 'automatico' } } } as unknown as Imovel;
  x.financas.bens.push(im);
  Object.assign(x.moradia, { tipo: 'propria', modeloId: 'casa_3q', imovelId: 'im22', aluguel: 0, bairro: 'num bairro tradicional', padrao: 3 });
  (x.financas.coisas ??= []).push({ id: 'q1', coisaId: 'gazebo', t: x.t, preco: 9000, estado: 100 }, { id: 'q2', coisaId: 'cama_elastica', t: x.t, preco: 1500, estado: 100 }, { id: 'q3', coisaId: 'espreguicadeira', t: x.t, preco: 1200, estado: 100 });
}).vida;
salvar('casa', c);

// Propriedades rurais: compra a fazenda de gado, a agrícola e o sítio (as ofertas da região, porteira fechada quando vem).
let r = base(2202, 'campinas-sp', 'masculino');
r = transacao(r, x => { x.financas.conta = 90_000_000; }).vida;
for (const tipo of ['pecuaria', 'agricola', 'sitio', 'cafeeira', 'haras']) { const o = ofertasRurais(r).find(y => y.p.tipo === tipo); if (o) r = faz(r, { tipo: 'rural18', oque: { op: 'comprar', oferta: o.id } }); }
salvar('rural', r);

// Nome famoso (atleta) para a agenda pública.
let f = base(2203, 'rio-de-janeiro-rj', 'masculino');
f = transacao(f, x => { x.notoriedade = { valor: 66, pico: 66, t: x.t, fonte: 'esporte', origens: { esporte: 66 } } as never; x.financas.conta = 200000; }).vida;
salvar('fama', f);

// Guarda-roupa com básicas novas e marcas de segmentos diferentes.
let g = base(2204);
g = transacao(g, x => { x.financas.conta = 500000; }).vida;
for (const id of ['camiseta_oversized', 'camiseta_pima', 'camiseta_henley', 'jeans_reto_premium', 'tenis_casual', 'jaqueta_bomber']) g = faz(g, { tipo: 'comprar_item', itemId: id });
salvar('roupas', g);
console.log('ok', r.financas.bens.filter(b => (b as Imovel).rural).length, 'propriedades rurais');
