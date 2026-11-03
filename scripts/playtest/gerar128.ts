/**
 * VIDA 12.8 — saves do QA visual (`vida128.mjs`):
 *   mansao   São Paulo, 46: mansão (suítes, lavabo), sala mobiliada com marca de luxo, quarto com cama e cabeceiras,
 *            piscina com deck, cinema, academia, adega, lado de fora reformado, coleção (relógio, arte exposta, vinhos)
 *            e uma cacatua com gaiola
 *   apto     Recife, 30: apartamento de dois quartos (suíte + social), poucas coisas baratas, uma barraca e chuteiras
 *   npx esbuild scripts/playtest/gerar128.ts --bundle --platform=node --format=esm --outfile=<scratch>/g.mjs && SP=<pasta> node <scratch>/g.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { idade } from '../../src/motor/nucleo';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { receberCoisa } from '../../src/motor/sistemas/coisas';
import { comodosDaCasa } from '../../src/motor/sistemas/lar';
import type { Colecionavel, Imovel, Vida } from '../../src/motor/tipos';

await carregarMundo();
const SP = process.env.SP ?? `${process.env.HOME}/vida-trabalho/qa128`;
mkdirSync(`${SP}/saves`, { recursive: true });
const salvar = (nome: string, v: Vida) => { v.momento = null; delete v.fila; v.caminhos.pendente = undefined; writeFileSync(`${SP}/saves/vida-r128-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), comodosDaCasa(v).map(c => c.id).join(',')); };
const tenta = (v: Vida, a: Acao): Vida => (podeTentar(disponibilidade(v, a)) ? executar(v, a).vida : (console.log('  não deu:', JSON.stringify(a).slice(0, 100), disponibilidade(v, a).motivo), v));
const P = (op: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op });
function dona(semente: number, cidade: string, modeloId: string, idadeI: number, conta: number): Vida {
  const v = adulto(idadeI, { semente, municipioId: cidade });
  v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false; v.financas.coisas = [];
  for (const vin of Object.values(v.vinculos)) if (vin.parentesco !== 'filho') vin.convivio = vin.convivio.filter(c => c !== 'casa');
  const casa: Imovel = { id: 'icasa', tipo: 'imovel', modeloId, nome: modeloId, valor: 4_000_000, tCompra: v.t - 60, municipioId: cidade, estado: 85 };
  v.financas.bens = [casa];
  v.moradia = { tipo: 'propria', municipioId: cidade, imovelId: 'icasa', modeloId, aluguel: 0, padrao: modeloId === 'mansao' ? 5 : 3, tInicio: v.t - 60 };
  return v;
}
const com = (v: Vida, id: string, marca?: string, comodo?: string) => { const t = receberCoisa(v, id, 5000); if (marca) t.marca = marca; if (comodo) t.comodo = comodo; };

{
  let v = dona(41, 'sao-paulo-sp', 'mansao', 46, 30_000_000);
  for (const t of ['cinema', 'academia', 'adega']) v = tenta(v, P({ o: 'construir', tipo: t as never }));
  const cs = comodosDaCasa(v);
  const de = (tipo: string) => cs.find(c => c.tipo === tipo)!.id;
  for (const [id, m] of [['sofa_designer', 'minotti'], ['mesa_centro_marmore', 'fendi_casa'], ['tapete_persa', undefined], ['tv_oled', 'sony'], ['poltrona_designer', 'natuzzi'], ['mesa_lateral', 'minotti'], ['quadros', undefined], ['plantas', undefined], ['aparador', 'fendi_casa'], ['objetos_decor', undefined], ['vitrine_colecao', 'atelier_ardent']] as const) com(v, id, m, 'sala');
  for (const id of ['cama_king', 'criado_mudo', 'closet', 'penteadeira', 'tapete', 'ar_condicionado', 'espelho_chao']) com(v, id, id === 'cama_king' ? 'natuzzi' : undefined, 'quarto');
  for (const id of ['banheira_pedra', 'bancada_marmore', 'espelho_led', 'toalheiro']) com(v, id, undefined, 'banheiro_suite');
  for (const id of ['geladeira_inox', 'fogao_profissional', 'ilha_cozinha', 'cafeteira', 'microondas']) com(v, id, id === 'fogao_profissional' ? 'gaggenau' : 'miele', 'cozinha');
  for (const id of ['espreguicadeira_teca', 'ombrelone', 'sofa_externo', 'mesa_externa', 'boias', 'luz_piscina', 'cascata', 'aquecedor_piscina']) com(v, id, undefined, 'piscina');
  for (const id of ['poltronas_cinema', 'projetor', 'home_theater']) com(v, id, undefined, de('cinema'));
  for (const id of ['estacao_musculacao', 'esteira', 'kit_academia']) com(v, id, undefined, de('academia'));
  com(v, 'adega_parede', undefined, de('adega'));
  for (const id of ['pergolado', 'fonte', 'vasos_grandes', 'luz_jardim']) com(v, id, undefined, 'jardim');
  v = tenta(v, P({ o: 'reforma_externa', mudancas: { fachada: 'pedra_ferro', paisagismo: 'assinado', caminho: 'pedra_natural', luz_externa: 'projeto', portao: 'pivotante' } }));
  const peca = (id: string, pecaId: string, nome: string, categoria: Colecionavel['categoria'], raridade: Colecionavel['raridade'], valor: number, exposta = false, comodo?: string): Colecionavel => ({ id, pecaId, nome, categoria, raridade, procedencia: 'loja', certificado: true, estado: 95, valor, precoPago: valor, tCompra: v.t - 24, exposta, comodo });
  v.financas.colecao = [
    peca('c1', 'rel_rolex_daytona', 'Rolex Daytona', 'relogio', 'rara', 230000, true, 'sala'),
    peca('c2', 'arte_tela_consagrada', 'tela de um artista consagrado', 'arte', 'rara', 300000, true, 'sala'),
    peca('c3', 'vin_bordeaux', 'caixa de Bordeaux de château classificado', 'vinho', 'incomum', 17000),
    peca('c4', 'arte_fotografia', 'fotografia de autor, tiragem de 10', 'arte', 'comum', 9000, true, 'quarto')
  ];
  salvar('mansao', v);
}
{
  let v = dona(12, 'recife-pe', 'apto_2q', 30, 40_000);
  for (const [id, m] of [['sofa', 'etna'], ['tv', 'lg'], ['mesa_jantar', 'tokstok']] as const) com(v, id, m, 'sala');
  for (const id of ['colchao', 'guarda_roupa', 'camping', 'chuteira_bola', 'notebook', 'violao']) com(v, id, undefined, 'quarto');
  salvar('apto', v);
}
