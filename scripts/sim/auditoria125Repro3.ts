/** VIDA 12.5 · auditoria de sistemas — repro: o carro vendido como está (mat_carro_parou) deixa `veiculoPrincipal` órfão; venda com financiamento maior que o valor. */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { conteudoPorId, abrirDecisao } from '../../src/motor/conteudo/motor';
import { contexto } from '../../src/motor/conteudo/base';
import { criarRng } from '../../src/motor/rng';
import type { Vida, Veiculo } from '../../src/motor/tipos';
await carregarMundo();
let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Carro', genero: 'masculino', municipioId: 'sao-paulo-sp', semente: 125903, classe: 'media' });
while (idade(v) < 24) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)!.id }).vida; }
v = structuredClone(v); v.financas.conta += 200000; v.momento = null; delete v.fila; if (!v.trabalho.licencas.includes('cnh')) v.trabalho.licencas.push('cnh');
for (const modeloId of ['carro_compacto', 'moto_pequena']) { const a = { tipo: 'comprar_veiculo' as const, modeloId, financiar: false }; console.log('comprar', modeloId, disponibilidade(v, a).grau); v = executar(v, a).vida; }
const [c1, c2] = v.financas.bens.filter(b => b.tipo === 'veiculo') as Veiculo[];
v = executar(v, { tipo: 'veiculo', bemId: c1.id, oque: 'principal' }).vida;
console.log('principal =', v.financas.veiculoPrincipal, '(carro', c1.id, ')');
v = structuredClone(v);
const b = v.financas.bens.find(x => x.id === c1.id) as Veiculo;
b.problema = { texto: 'o motor fundiu', custo: 9000, gravidade: 3, desde: v.t } as never;
const d = conteudoPorId('mat_carro_parou')!;
abrirDecisao(v, d as never, contexto(v, criarRng(1)));
console.log('momento:', v.momento?.situacaoId, v.momento?.opcoes.map(o => o.id).join(','));
v = executar(v, { tipo: 'decidir', opcaoId: 'vender' }).vida;
console.log('depois de vender: bens', v.financas.bens.map(x => x.id).join(','), '| veiculoPrincipal =', v.financas.veiculoPrincipal, '| existe?', v.financas.bens.some(x => x.id === v.financas.veiculoPrincipal));
