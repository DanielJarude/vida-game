/** VIDA 21 · saves para a inspeção visual (OUT=<pasta>): crime com bens, médica de cidade pequena, bolsas, F1 na garagem. */
import { writeFileSync } from 'fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { idade, transacao } from '../../src/motor/nucleo';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { garantirCidade } from '../../src/motor/sistemas/faccoes';
import { repartir21 } from '../../src/motor/v21/crime/espolio21';
import { ofertasDeVeiculos } from '../../src/motor/sistemas/mercado';
import type { Emprego, Vida } from '../../src/motor/tipos';
import { carregarMundo } from '../../src/motor/mundo/carregar';
await carregarMundo();
const OUT = process.env.OUT!;
const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; x.fila = undefined; return x; };
const ate = (v: Vida, i: number) => { while (idade(v) < i) v = ano(v); return v; };
const faz = (v: Vida, a: unknown) => (podeTentar(disponibilidade(v, a as Acao)) ? executar(v, a as Acao).vida : v);
const salvar = (n: string, v: Vida) => writeFileSync(`${OUT}/vida-v21-${n}.json`, JSON.stringify(v));
const base = (semente: number, cidade = 'sao-paulo-sp', genero: 'feminino' | 'masculino' = 'feminino') => ate(criarVida({ nome: 'Lia', sobrenome: 'Prado', genero, municipioId: cidade, semente }), 30);

// Crime: no ramo de furtos, com bens variados guardados.
let c = base(2161, 'recife-pe', 'masculino');
c = transacao(c, (x, r) => { x.financas.conta = 30000; entrar(x, 'patrimonial', undefined, r); garantirCidade(x); x.caminhos.envolvimento!.especializacoes!.furtos!.experiencia = 60; for (let k = 0; k < 4; k++) { x.t += 1; repartir21(x, 9000, k % 2 ? 3 : 1, k % 2 ? 'um serviço grande' : 'um serviço pequeno', 2); } x.espolio21!.reputacao = 30; }).vida;
salvar('crime', c);
// Médica de vinte anos numa cidade pequena.
let m = base(2162, 'tarauaca-ac');
m = ate(m, 50);
m = transacao(m, x => { x.trabalho.atual = { ...(x.trabalho.atual ?? {}), ocupacaoId: 'medico', empregador: 'o hospital da cidade', contrato: 'clt', carga: 'integral', municipioId: x.moradia.municipioId, tInicio: x.t - 240, desempenho: 78, salario: 18000 } as Emprego; x.moradia.tInicio = x.t - 240; }).vida;
m = ano(m);
salvar('medica', m);
// Bolsas e peças novas.
let b = base(2163);
b = transacao(b, x => { x.financas.conta = 400000; }).vida;
for (const id of ['mochila_couro', 'bolsa_grife', 'clutch_pedraria', 'trench_coat', 'calca_wide_leg', 'camisa_oxford', 'bota_chelsea', 'relogio_titanio']) b = faz(b, { tipo: 'comprar_item', itemId: id });
salvar('bolsas', b);
// F1 e hipercarro na garagem.
let f = base(2164, 'sao-paulo-sp', 'masculino');
f = transacao(f, x => { x.financas.conta = 150_000_000; if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh'); }).vida;
for (const id of ['f1_monoposto', 'bugatti_chiron_ss']) { const o = ofertasDeVeiculos(f, 'colecionador').find(y => y.versaoId === id && !y.usado); if (o) f = faz(f, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false }); }
salvar('garagem', f);
console.log('ok');
