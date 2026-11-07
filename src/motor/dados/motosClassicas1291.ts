/**
 * VIDA 12.9.1 — MOTOS CLÁSSICAS: a classe que faltava (a 12.9 deixou registrado: "sem motos clássicas").
 *
 *   CLASSE    `moto_classica`: categoria moto, segmento `classico` — o mesmo tratamento do carro clássico: só existe
 *             usada, vende-se na garagem de colecionador das cidades grandes, não deprecia pela idade (anda com o índice
 *             de clássicos e com o estado), pode ser restaurada, o colecionador pode bater à porta.
 *   VERSÕES   modelos históricos reais: ingleses, italianos, alemães, japoneses, americanos; café racers, scramblers,
 *             custom de fábrica, esportivas que marcaram época e as de tiragem curta. Marca, modelo e ano reais; o motor
 *             no acabamento (o que é de conhecimento geral: cilindrada e arquitetura). Nada de ficha inventada.
 *   PRODUÇÃO  só onde o número é conhecido (a 750 SS de 1974, a Black Shadow, a SS100, a R 60/2, a R 90 S, a XR1000, a
 *             CB750). Sem número, a classe decide (o clássico de série é "incomum") — nunca "toda moto velha é rara".
 *   MARCO     `historica`: a moto que mudou a história (a primeira superesportiva japonesa, a moto mais rápida do mundo de
 *             1948). Sobe UM grau, e só quando a produção é conhecida (a CB750, com centenas de milhares, sai de comum para
 *             incomum; a Black Shadow, com cerca de 1.700, de rara para muito rara).
 *   PREÇO     referência em reais de 2026 de um exemplar em bom estado (o mercado de clássicos lá fora, com a importação):
 *             plausível, não é cotação. O jogo ainda aplica o índice de clássicos, o país e o estado.
 *
 * Puro (só tipos): vai no pacote `motor-casa`. Entra por `bens.ts` (uma classe e as versões, no fim das listas).
 */
import type { FormaVeiculo, ModeloVeiculo, VersaoVeiculo } from './bens';
import type { OpcaoDePeca, PecaDeVeiculo } from './personalizacaoVeiculo';
import type { VisualDaRoda } from './veiculos129';

type V = VersaoVeiculo;
const BR: V['mercados'] = ['BR'];

/** A classe: anda pouco, pede oficina que conheça carburador e platinado; vale pelo estado e pela história. */
export const CLASSE_MOTO_CLASSICA: ModeloVeiculo = {
  id: 'moto_classica', nome: 'moto clássica', categoria: 'moto', segmento: 'classico', preco: 120000, usoMensal: 320, taxaAnual: 0.02, idadeMin: 18, cnh: true,
  lugares: 2, conforto: 2, fragilidade: 1.45, usado: true, fatorConserto: 1.8, pesoUsado: 0.05,
  descricao: 'De outra época: carburador, corrente, freio a tambor, pé no pedal de partida. Pede garagem e mecânico que conheça; vale pelo estado e pela história.'
};

const c = (x: Omit<V, 'classe' | 'artigo' | 'forma' | 'faixa'> & { faixa?: V['faixa'] }): V => ({ classe: 'moto_classica', artigo: 'a', forma: 'cruiser', faixa: x.preco >= 300000 ? 'alta' : x.preco >= 90000 ? 'intermediaria' : 'economica', ...x });

export const VERSOES_MOTOS_CLASSICAS: readonly V[] = [
  // ---- Inglesas: os bicilíndricos paralelos e o monocilíndrico do café racer.
  c({ id: 'triumph_t120_1969', marca: 'Triumph', modelo: 'Bonneville T120', acabamento: '650 cc, dois cilindros em paralelo', dica: 'moto clássica de 1969', preco: 130000, pesoUsado: 1.2, ano: 1969, usoMensal: 300, descricao: 'A inglesa que definiu a moto de dois cilindros dos anos 1960: tanque de duas cores, dois escapamentos longos.' }),
  c({ id: 'bsa_gold_star_1960', marca: 'BSA', modelo: 'Gold Star DBD34 Clubman', acabamento: '500 cc, um cilindro', dica: 'café racer de 1960', preco: 280000, pesoUsado: 0.5, ano: 1960, usoMensal: 300, lugares: 1, descricao: 'O monocilíndrico do café racer original: guidão baixo, banco de um lugar, o silenciador que chia.' }),
  c({ id: 'norton_commando_1970', marca: 'Norton', modelo: 'Commando 750 Fastback', acabamento: '750 cc, dois cilindros em paralelo', dica: 'moto clássica de 1970', preco: 140000, pesoUsado: 0.8, ano: 1970, usoMensal: 320, descricao: 'O motor preso em coxins de borracha para não tremer; a rabeta "fastback" colada no banco.' }),
  c({ id: 'vincent_black_shadow_1950', marca: 'Vincent', modelo: 'Black Shadow Série C', acabamento: '998 cc, V2 a 50 graus', dica: 'moto clássica de 1950', preco: 1100000, pesoUsado: 0.06, ano: 1950, producao: 1700, historica: true, usoMensal: 400, descricao: 'Motor preto, garfo de paralelogramo, velocímetro até 150 milhas: a moto de série mais rápida do mundo no seu tempo.' }),
  c({ id: 'brough_ss100_1930', marca: 'Brough Superior', modelo: 'SS100', acabamento: '998 cc, V2', dica: 'moto clássica de 1930', preco: 4200000, pesoUsado: 0.01, ano: 1930, producao: 383, historica: true, usoMensal: 450, lugares: 1, descricao: 'O "Rolls-Royce das motos": feita à mão, cada uma testada acima de 100 milhas por hora antes da entrega.' }),
  // ---- Italianas e alemãs.
  c({ id: 'ducati_750ss_1974', marca: 'Ducati', modelo: '750 Super Sport', acabamento: '748 cc, V2 em L, comando desmodrômico', dica: 'esportiva clássica de 1974', preco: 1800000, pesoUsado: 0.03, ano: 1974, producao: 401, usoMensal: 420, lugares: 1, descricao: 'Nascida da vitória em Imola em 1972: meia carenagem, quadro verde-claro, um lugar só.' }),
  c({ id: 'guzzi_v7_sport_1972', marca: 'Moto Guzzi', modelo: 'V7 Sport', acabamento: '748 cc, V2 transversal', dica: 'café racer de 1972', preco: 230000, pesoUsado: 0.4, ano: 1972, usoMensal: 340, descricao: 'O V2 atravessado com os cilindros saindo dos lados, o quadro baixo de Lino Tonti, guidão baixo.' }),
  c({ id: 'ducati_scrambler_450_1971', marca: 'Ducati', modelo: 'Scrambler 450', acabamento: '436 cc, um cilindro', dica: 'scrambler de 1971', preco: 110000, pesoUsado: 0.6, ano: 1971, usoMensal: 260, descricao: 'Feita para o mercado americano: guidão largo, tanque pequeno, terra e asfalto.' }),
  c({ id: 'bmw_r60_2_1965', marca: 'BMW', modelo: 'R 60/2', acabamento: '594 cc, boxer de dois cilindros', dica: 'moto clássica de 1965', preco: 160000, pesoUsado: 0.6, ano: 1965, producao: 17306, usoMensal: 280, descricao: 'Os cilindros para os lados, o eixo cardã no lugar da corrente, o garfo Earles: preta, com filete branco.' }),
  c({ id: 'bmw_r90s_1974', marca: 'BMW', modelo: 'R 90 S', acabamento: '898 cc, boxer de dois cilindros', dica: 'esportiva clássica de 1974', preco: 190000, pesoUsado: 0.5, ano: 1974, producao: 17465, usoMensal: 320, descricao: 'A BMW esportiva: carenagem de guidão, pintura degradê, dois discos na frente.' }),
  // ---- Japonesas: o quatro cilindros que mudou tudo, os dois tempos, a scrambler.
  c({ id: 'honda_cb750_1970', marca: 'Honda', modelo: 'CB750 Four', acabamento: '736 cc, quatro cilindros em linha', dica: 'moto clássica de 1970', preco: 120000, pesoUsado: 2, ano: 1970, producao: 400000, historica: true, usoMensal: 300, descricao: 'Quatro cilindros, quatro escapamentos, freio a disco na frente: a moto que abriu a era das superesportivas.' }),
  c({ id: 'kawasaki_z1_1973', marca: 'Kawasaki', modelo: 'Z1 900', acabamento: '903 cc, quatro cilindros em linha, duplo comando', dica: 'moto clássica de 1973', preco: 280000, pesoUsado: 0.8, ano: 1973, usoMensal: 340, descricao: 'A resposta à CB750: mais motor, a rabeta em "rabo de pato", o tanque em gota com faixas.' }),
  c({ id: 'kawasaki_h2_1972', marca: 'Kawasaki', modelo: 'H2 750 Mach IV', acabamento: '748 cc, três cilindros, dois tempos', dica: 'moto clássica de 1972', preco: 170000, pesoUsado: 0.5, ano: 1972, usoMensal: 380, descricao: 'Três cilindros de dois tempos e três escapamentos: forte demais para o quadro, e ficou famosa por isso.' }),
  c({ id: 'suzuki_gt750_1974', marca: 'Suzuki', modelo: 'GT750', acabamento: '738 cc, três cilindros, dois tempos, refrigerado a água', dica: 'moto clássica de 1974', preco: 95000, pesoUsado: 0.8, ano: 1974, usoMensal: 340, descricao: 'O radiador na frente do motor de dois tempos e os quatro escapamentos (três cilindros saindo em quatro).' }),
  c({ id: 'yamaha_xs650_1972', marca: 'Yamaha', modelo: 'XS650', acabamento: '653 cc, dois cilindros em paralelo', dica: 'moto clássica de 1972', preco: 60000, pesoUsado: 1.5, ano: 1972, usoMensal: 260, descricao: 'O bicilíndrico japonês no molde inglês: simples, durável, base de muita customização.' }),
  c({ id: 'yamaha_rd350_1974', marca: 'Yamaha', modelo: 'RD350', acabamento: '347 cc, dois cilindros, dois tempos', dica: 'esportiva clássica de 1974', preco: 65000, pesoUsado: 1.2, ano: 1974, usoMensal: 240, descricao: 'Pequena, leve, dois tempos: as panelas de expansão debaixo do motor e o ronco agudo.' }),
  c({ id: 'honda_cb400f_1975', marca: 'Honda', modelo: 'CB400 Four', acabamento: '408 cc, quatro cilindros em linha', dica: 'moto clássica de 1975', preco: 75000, pesoUsado: 1, ano: 1975, usoMensal: 250, descricao: 'Os quatro coletores que se juntam num escapamento só, curvos na frente do motor: um café racer de fábrica.' }),
  c({ id: 'honda_cl350_1970', marca: 'Honda', modelo: 'CL350', acabamento: '325 cc, dois cilindros em paralelo', dica: 'scrambler de 1970', preco: 55000, pesoUsado: 1.2, ano: 1970, usoMensal: 220, descricao: 'A scrambler: os dois escapamentos altos com protetor de calor, guidão alto, para-lamas curtos.' }),
  c({ id: 'honda_rc30_1988', marca: 'Honda', modelo: 'VFR750R (RC30)', acabamento: '748 cc, V4', dica: 'esportiva clássica de 1988', preco: 450000, pesoUsado: 0.1, ano: 1988, usoMensal: 420, lugares: 1, descricao: 'Feita para homologar a moto de corrida do Mundial de Superbike: carenagem inteira, dois faróis, balança de um braço só.' }),
  // ---- Brasileiras de fábrica.
  c({ id: 'honda_cg125_1976', marca: 'Honda', modelo: 'CG 125', acabamento: '124 cc, um cilindro', dica: 'moto clássica de 1976', preco: 25000, pesoUsado: 3, ano: 1976, usoMensal: 150, mercados: BR, descricao: 'A primeira do ano em que a Honda passou a fabricar no Brasil: a moto de trabalho de uma geração.' }),
  c({ id: 'yamaha_rd350lc_1990', marca: 'Yamaha', modelo: 'RD 350 LC', acabamento: '347 cc, dois cilindros, dois tempos, refrigerado a água', dica: 'esportiva clássica de 1990', preco: 45000, pesoUsado: 1.5, ano: 1990, usoMensal: 260, mercados: BR, descricao: 'A dois tempos refrigerada a água, feita em Manaus: rodas de liga, painel carenado, o arranque que assustava.' }),
  // ---- Americanas: o V2 de Milwaukee e o de Springfield.
  c({ id: 'harley_knucklehead_1937', marca: 'Harley-Davidson', modelo: 'EL Knucklehead', acabamento: '1.000 cc, V2 de válvulas no cabeçote', dica: 'moto clássica de 1937', preco: 750000, pesoUsado: 0.1, ano: 1937, usoMensal: 380, lugares: 1, descricao: 'As tampas de válvula em forma de nó dos dedos, o garfo de molas, o painel em cima do tanque.' }),
  c({ id: 'harley_panhead_1955', marca: 'Harley-Davidson', modelo: 'FL Hydra-Glide Panhead', acabamento: '1.200 cc, V2', dica: 'moto clássica de 1955', preco: 300000, pesoUsado: 0.4, ano: 1955, usoMensal: 400, descricao: 'As tampas de cabeçote em forma de panela, garfo hidráulico, para-lamas fundos, banco de dois.' }),
  c({ id: 'harley_super_glide_1971', marca: 'Harley-Davidson', modelo: 'FX Super Glide', acabamento: '1.200 cc, V2', dica: 'custom de 1971', preco: 200000, pesoUsado: 0.4, ano: 1971, usoMensal: 380, descricao: 'A primeira custom de fábrica: a frente leve de uma Sportster no quadro grande, a rabeta "boattail".' }),
  c({ id: 'harley_xr750_1972', marca: 'Harley-Davidson', modelo: 'XR750', acabamento: '750 cc, V2', dica: 'moto de pista de terra de 1972', preco: 450000, pesoUsado: 0.08, ano: 1972, usoMensal: 400, lugares: 1, descricao: 'Nasceu para a pista oval de terra: os dois escapamentos altos do mesmo lado, sem freio na frente, a placa de número.' }),
  c({ id: 'harley_xr1000_1983', marca: 'Harley-Davidson', modelo: 'XR1000', acabamento: '998 cc, V2', dica: 'esportiva clássica de 1983', preco: 220000, pesoUsado: 0.15, ano: 1983, producao: 1777, usoMensal: 380, descricao: 'A XR750 de rua: os cabeçotes de corrida e os dois escapamentos altos do lado esquerdo.' }),
  c({ id: 'indian_chief_1947', marca: 'Indian', modelo: 'Chief', acabamento: '1.200 cc, V2', dica: 'moto clássica de 1947', preco: 400000, pesoUsado: 0.25, ano: 1947, usoMensal: 400, descricao: 'Os para-lamas de saia que quase escondem as rodas, a cabeça de índio no para-lama da frente.' }),
  c({ id: 'indian_scout_101_1929', marca: 'Indian', modelo: 'Scout 101', acabamento: '750 cc, V2', dica: 'moto clássica de 1929', preco: 450000, pesoUsado: 0.15, ano: 1929, usoMensal: 340, lugares: 1, descricao: 'Baixa, equilibrada, quadro rígido: a moto dos globos da morte por décadas.' })
];

const IDS = new Set(VERSOES_MOTOS_CLASSICAS.map(x => x.id));
/** É uma das motos clássicas da 12.9.1. */
export const ehMotoClassica1291 = (id: string | undefined) => !!id && IDS.has(id);

/**
 * A história de um exemplar no anúncio (o que pesa é o estado e a originalidade). As da moto: o clube de motos antigas,
 * o "matching numbers" (motor e quadro com números de fábrica que batem), a que veio desmontada em caixas.
 */
export const HISTORICOS_MOTO_CLASSICA: readonly [string, number][] = [
  ['restaurada, peças originais', 92], ['original, motor e quadro com os números de fábrica', 84], ['de clube de motos antigas, com documentação', 86],
  ['um dono só por quarenta anos', 80], ['precisa de restauração', 45], ['veio desmontada, em caixas', 32], ['motor refeito, pintura cansada', 58]
];

/** VIDA 12.9.1: detalhes de moto clássica que aparecem no desenho (filete no tanque, banco de couro, aro dourado raiado). */
export type OpcaoMoto1291 = OpcaoDePeca & { formas?: readonly FormaVeiculo[]; filete?: string; banco?: string; roda?: VisualDaRoda };
const CLASSICA: readonly FormaVeiculo[] = ['cruiser'];
export const FILETE_1291: PecaDeVeiculo = {
  id: 'filete', nome: 'Filete no tanque', tipo: 'estetica', opcoes: [
    { id: 'original', nome: 'sem filete', frac: 0, piso: 0 },
    { id: 'dourado', nome: 'filete dourado, pintado à mão', frac: 0.012, piso: 900, valor: 1, formas: CLASSICA, filete: '#d4af37' },
    { id: 'branco', nome: 'filete branco duplo', frac: 0.01, piso: 800, valor: 1, formas: CLASSICA, filete: '#f1eee7' },
    { id: 'vermelho', nome: 'filete vermelho', frac: 0.01, piso: 800, valor: 0.99, formas: CLASSICA, filete: '#c8372d' }
  ] as OpcaoMoto1291[]
};
/** Bancos de couro (somam-se ao banco de viagem que já existia). */
export const BANCOS_1291: OpcaoMoto1291[] = [
  { id: 'couro_caramelo', nome: 'couro caramelo, costurado à mão', frac: 0.03, piso: 1400, valor: 1, banco: '#9a6233' },
  { id: 'couro_marrom', nome: 'couro marrom envelhecido', frac: 0.025, piso: 1200, valor: 1, banco: '#5b3a26' }
];
/** Rodas raiadas de aro dourado (somam-se às de moto da 12.9). */
export const RODAS_MOTO_1291: OpcaoMoto1291[] = [
  { id: 'raiadas_douradas', nome: 'raiadas, aro dourado', frac: 0.055, piso: 2000, valor: 0.99, roda: { estilo: 'raios', cor: '#c9a23a' } }
];
