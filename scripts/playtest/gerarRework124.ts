/**
 * Saves das cenas do QA visual do REWORK 12.4 (`rework124.mjs`), montados e depois vividos pelo motor:
 *   rica      São Paulo, 45: mansão com piscina construída, sala de cinema, acabamentos, muitos objetos (inventário
 *             grande, alguns no depósito e no cofre, um emprestado), carro personalizado, coleção com peça de família
 *   inquilina Recife, 29: kitnet alugada, poucos objetos, o pandeiro, o guarda-roupa de baile e streetwear
 *   musico    Recife, 35: casa de três quartos, um quarto virou estúdio, instrumentos, discos, gostos que mudaram
 *   npx esbuild scripts/playtest/gerarRework124.ts --bundle --platform=node --format=esm --outfile=<scratch>/g.mjs && SP=<pasta> node <scratch>/g.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto, comParceiro } from '../../src/motor/__tests__/cenarios';
import { idade } from '../../src/motor/nucleo';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { avancarAno } from '../../src/motor/ano';
import { receberCoisa } from '../../src/motor/sistemas/coisas';
import type { Imovel, Veiculo, Vida } from '../../src/motor/tipos';

await carregarMundo();
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa124`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r124-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : (console.log('  não deu:', JSON.stringify(a).slice(0, 90), disponibilidade(v, a).motivo), v));
const P = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });
const viverUm = (v: Vida) => { v = avancarAno(v).vida; for (let i = 0; i < 10 && v.momento; i++) v = executar(v, { tipo: 'decidir', opcaoId: (v.momento.opcoes.find(o => !o.bloqueio) ?? v.momento.opcoes[0]).id }).vida; return v; };

function dona(semente: number, cidade: string, modeloId: string, idadeI: number, conta: number): Vida {
  const v = adulto(idadeI, { semente, municipioId: cidade });
  v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false;
  for (const vin of Object.values(v.vinculos)) if (vin.parentesco !== 'filho') vin.convivio = vin.convivio.filter(c => c !== 'casa');
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId, nome: modeloId === 'mansao' ? 'mansão' : 'casa de três quartos', valor: modeloId === 'mansao' ? 4_000_000 : 600_000, tCompra: v.t - 60, municipioId: cidade, estado: 85 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: cidade, imovelId: 'icasa', modeloId, aluguel: 0, padrao: modeloId === 'mansao' ? 5 : 4, tInicio: v.t - 60 };
  return v;
}

// --- rica
{
  let v = dona(41, 'sao-paulo-sp', 'mansao', 45, 9_000_000);
  v.trabalho.licencas.push('cnh');
  v.financas.bens.push({ id: 'isitio', tipo: 'imovel', modeloId: 'sitio', nome: 'sítio', valor: 400000, tCompra: v.t - 24, municipioId: 'sao-paulo-sp', estado: 80 } as Imovel);
  v.financas.bens.push({ id: 'vlux', tipo: 'veiculo', modeloId: 'carro_luxo', nome: 'carro de luxo', valor: 420000, tCompra: v.t - 12, estado: 92, cor: '#24262a', corNome: 'preto' } as Veiculo);
  for (const id of ['colchao', 'roupa_de_cama', 'sofa', 'mesa_jantar', 'tv', 'projetor', 'mesa_sinuca', 'piano', 'som_hifi', 'discos', 'poltrona', 'livros', 'estacao_musculacao', 'esteira', 'notebook', 'computador', 'camera', 'videogame', 'cozinha_equipada', 'maquina_lavar', 'violao']) v = tenta(v, { tipo: 'comprar_coisa', coisaId: id });
  v = tenta(v, P({ o: 'construir', tipo: 'cinema' }));
  v = tenta(v, P({ o: 'acabamento', comodo: 'sala', aspecto: 'piso', opcao: 'marmore' }));
  v = tenta(v, P({ o: 'acabamento', comodo: 'sala', aspecto: 'parede', opcao: 'verde_oliva' }));
  v = tenta(v, P({ o: 'acabamento', comodo: 'sala', aspecto: 'luz', opcao: 'planejada' }));
  v = tenta(v, P({ o: 'converter', comodo: 'quarto2', tipo: 'biblioteca' }));
  v = tenta(v, P({ o: 'converter', comodo: 'quarto3', tipo: 'academia' }));
  v = tenta(v, P({ o: 'veiculo_peca', bem: 'vlux', peca: 'pintura', opcao: 'azul_petroleo' }));
  v = tenta(v, P({ o: 'veiculo_peca', bem: 'vlux', peca: 'pneus', opcao: 'bons' }));
  v = tenta(v, P({ o: 'apelidar', ref: { tipo: 'veiculo', id: 'vlux' }, nome: 'Netuno' }));
  const piano = v.financas.coisas!.find(x => x.coisaId === 'piano')!;
  piano.memoria = { origem: 'heranca', de: 'Dona Celina', motivo: 'o piano da avó', afeto: 70 };
  const esteira = v.financas.coisas!.find(x => x.coisaId === 'esteira')!;
  v = tenta(v, P({ o: 'mover', ref: { tipo: 'coisa', id: esteira.id }, para: 'im:isitio' }));
  v = tenta(v, { tipo: 'comprar_item', itemId: 'relogio_luxo' });
  v = tenta(v, { tipo: 'usar_item', itemId: 'relogio_luxo', usar: false });
  const rel = v.eu.estilo!.itens.find(x => x.itemId === 'relogio_luxo')!;
  v = tenta(v, P({ o: 'mover', ref: { tipo: 'estilo', id: rel.id }, para: 'cofre:sao-paulo-sp' }));
  v.financas.colecao = [{ id: 'cr', pecaId: 'x', nome: 'Relógio do avô', categoria: 'relogio', raridade: 'rara', procedencia: 'herdada', certificado: true, estado: 80, valor: 60000, precoPago: 0, tCompra: v.t - 240, deFamilia: true, historia: [{ t: v.t - 240, texto: 'Herdado do avô.' }] }];
  v = tenta(v, P({ o: 'obra', linguagem: 'fotografia' }));
  for (let k = 0; k < 2; k++) v = viverUm(v);
  salvar('rica', v);
}
// --- inquilina
{
  let v = adulto(29, { semente: 77, municipioId: 'recife-pe' });
  v.financas.conta = 15000; v.financas.dividas = [];
  v.moradia = { tipo: 'aluguel', municipioId: 'recife-pe', modeloId: 'kitnet', aluguel: 900, padrao: 2, tInicio: v.t - 12 };
  for (const vin of Object.values(v.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  for (const id of ['colchao', 'pandeiro', 'celular_bom']) v = tenta(v, { tipo: 'comprar_coisa', coisaId: id });
  for (const id of ['conjunto_baile', 'oculos_juliet', 'chinelo_slide', 'moletom_oversized', 'calca_cargo', 'tenis_cano_alto', 'camisa_social', 'calca_alfaiataria']) v = tenta(v, { tipo: 'comprar_item', itemId: id });
  v = tenta(v, P({ o: 'acabamento', comodo: 'quarto', aspecto: 'parede', opcao: 'terracota' }));
  const meus = v.eu.estilo!.itens;
  v = tenta(v, P({ o: 'look', ocasiao: 'trabalho', itens: meus.filter(x => ['camisa_social', 'calca_alfaiataria'].includes(x.itemId)).map(x => x.id) }));
  v = tenta(v, P({ o: 'cultural', oque: 'baile' }));
  v = viverUm(v);
  salvar('inquilina', v);
}
// --- músico
{
  let v = dona(55, 'recife-pe', 'casa_3q', 35, 120_000);
  const { vin } = comParceiro(v, { estagio: 'morando_junto' });
  vin.convivio = ['casa'];
  v = tenta(v, P({ o: 'converter', comodo: 'quarto2', tipo: 'estudio' }));
  for (const id of ['violao', 'cavaquinho', 'sanfona', 'home_studio', 'som_hifi', 'discos', 'discos']) v = tenta(v, { tipo: 'comprar_coisa', coisaId: id });
  receberCoisa(v, 'pandeiro', 350).memoria = { origem: 'presente', de: 'Seu Didi', afeto: 40 };
  for (let k = 0; k < 4; k++) { v = tenta(v, P({ o: 'cultural', oque: 'ouvir' })); v = tenta(v, P({ o: 'cultural', oque: ['roda_samba', 'forro', 'show', 'sarau'][k] })); v = viverUm(v); }
  salvar('musico', v);
}
