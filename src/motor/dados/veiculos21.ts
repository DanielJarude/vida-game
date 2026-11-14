/**
 * VIDA 21 — O CATÁLOGO QUE FALTAVA NA GARAGEM: utilitários, jipes e off-road, picapes grandes e esportivas, hipercarros e
 * carros de competição. As classes entram no fim de `VEICULOS` e as versões no fim de `VERSOES_VEICULO` (os saves e os
 * sorteios de antes não mudam: as classes novas existem só como zero-quilômetro — `usado: false` — e não entram no
 * sorteio dos usados das lojas, que continua o mesmo).
 *
 * PREÇOS (reais de 2026, cidade de custo 1,0). Conferidos em fontes públicas quando há preço oficial no Brasil (a RAM 1500
 * de R$ 449.990 a R$ 599.990; o Defender 110 de R$ 799.490 a R$ 969.990 — tabelas da Webmotors e reportagens de 2026);
 * os outros são referências de mercado arredondadas. Os HIPERCARROS não têm venda oficial no Brasil: o preço é o de
 * importação independente (o preço internacional de lançamento × câmbio × impostos), uma ESTIMATIVA de jogo. Os carros de
 * COMPETIÇÃO: o 911 GT3 R (992) saiu por € 511 mil sem impostos para equipes clientes; os outros são categorias sem modelo
 * de rua (monoposto de F1 de temporada passada, protótipo de Stock Car, carro de rali, kart), descritos sem marca e com
 * preço de referência — nada de ficha técnica inventada.
 *
 * COMPETIÇÃO não é carro de rua (`pista`): não leva ninguém ao trabalho, não vira o carro do dia a dia, não roda sem
 * equipe; o custo do mês é o box, o mecânico e o caminhão; o uso é o dia de pista (`veiculos`: `pista`).
 */
import type { ModeloVeiculo, VersaoVeiculo } from './bens';

type V = VersaoVeiculo;
const AS: V['mercados'] = ['america_sul'];
const NORTE_E_SUL: V['mercados'] = ['america_norte', 'america_sul'];

export const CLASSES_21: readonly ModeloVeiculo[] = [
  { id: 'utilitario', nome: 'utilitário', categoria: 'carro', preco: 120000, usoMensal: 600, taxaAnual: 0.06, idadeMin: 18, cnh: true, lugares: 2, conforto: 2, fragilidade: 0.9, descricao: 'Caçamba, baú ou carga: ferramenta de trabalho. Conforto não é o assunto.', usado: false, fatorConserto: 1, pesoUsado: 0 },
  { id: 'offroad', nome: 'jipe', categoria: 'carro', preco: 300000, usoMensal: 900, taxaAnual: 0.07, idadeMin: 18, cnh: true, lugares: 5, conforto: 3, fragilidade: 1, descricao: 'Tração nas quatro, altura do chão, reduzida: trilha, lama e serra. No asfalto, bebe e sacode.', usado: false, fatorConserto: 1.3, pesoUsado: 0 },
  { id: 'picape_grande', nome: 'picape grande', categoria: 'carro', preco: 450000, usoMensal: 1300, taxaAnual: 0.07, idadeMin: 18, cnh: true, lugares: 5, conforto: 4, fragilidade: 1, descricao: 'Tamanho de caminhão pequeno, motor grande, reboca o que precisar. Vaga de garagem comum não serve.', usado: false, fatorConserto: 1.4, pesoUsado: 0 },
  { id: 'hipercarro', nome: 'hipercarro', categoria: 'carro', segmento: 'exotico', preco: 20000000, usoMensal: 15000, taxaAnual: 0.04, idadeMin: 18, cnh: true, lugares: 2, conforto: 5, fragilidade: 1.4, descricao: 'Tiragem de poucas centenas, lista de espera e fábrica que escolhe a quem vende. Seguro, revisão na fábrica e transporte em caminhão fechado.', usado: false, fatorConserto: 4, pesoUsado: 0, raro: true, patrimonioMin: 60000000 },
  { id: 'competicao', nome: 'carro de competição', categoria: 'carro', segmento: 'competicao', pista: true, preco: 3000000, usoMensal: 28000, taxaAnual: 0.02, idadeMin: 18, cnh: false, lugares: 1, conforto: 1, fragilidade: 1.6, descricao: 'Não é carro de rua: não tem placa, vai e volta de caminhão, só anda em autódromo e com equipe. O mês custa o box, o mecânico e a logística.', usado: false, fatorConserto: 3, pesoUsado: 0, raro: true, patrimonioMin: 10000000 }
];

export const VERSOES_21: readonly V[] = [
  // Utilitários (comerciais leves e vans).
  { id: 'fiat_strada', classe: 'utilitario', marca: 'Fiat', modelo: 'Strada', acabamento: 'Freedom cabine dupla', dica: 'picape compacta', faixa: 'economica', preco: 115000, artigo: 'a', pesoUsado: 0, lugares: 5, forma: 'picape', mercados: AS },
  { id: 'vw_saveiro', classe: 'utilitario', marca: 'Volkswagen', modelo: 'Saveiro', acabamento: 'Robust cabine simples', dica: 'picape compacta', faixa: 'economica', preco: 98000, artigo: 'a', pesoUsado: 0, forma: 'picape', mercados: AS },
  { id: 'fiat_toro', classe: 'utilitario', marca: 'Fiat', modelo: 'Toro', acabamento: 'Volcano diesel 4x4', dica: 'picape intermediária', faixa: 'intermediaria', preco: 210000, artigo: 'a', pesoUsado: 0, lugares: 5, forma: 'picape', mercados: AS },
  { id: 'fiat_fiorino', classe: 'utilitario', marca: 'Fiat', modelo: 'Fiorino', acabamento: 'furgão', dica: 'furgão de entrega', faixa: 'economica', preco: 105000, artigo: 'o', pesoUsado: 0, forma: 'hatch', mercados: AS },
  { id: 'renault_master', classe: 'utilitario', marca: 'Renault', modelo: 'Master', acabamento: 'furgão L3H2', dica: 'van de carga', faixa: 'intermediaria', preco: 290000, artigo: 'a', pesoUsado: 0, usoMensal: 900, forma: 'suv_grande' },
  { id: 'mb_sprinter', classe: 'utilitario', marca: 'Mercedes-Benz', modelo: 'Sprinter', acabamento: 'van de passageiros', dica: 'van', faixa: 'alta', preco: 380000, artigo: 'a', pesoUsado: 0, usoMensal: 1000, lugares: 15, forma: 'suv_grande' },
  // Jipes e off-road.
  { id: 'suzuki_jimny', classe: 'offroad', marca: 'Suzuki', modelo: 'Jimny Sierra', acabamento: '4You', dica: 'jipinho 4x4', faixa: 'economica', preco: 165000, artigo: 'o', pesoUsado: 0, lugares: 4, forma: 'suv' },
  { id: 'ford_bronco_sport', classe: 'offroad', marca: 'Ford', modelo: 'Bronco Sport', acabamento: 'Wildtrak', dica: 'SUV aventureiro', faixa: 'intermediaria', preco: 275000, artigo: 'o', pesoUsado: 0, forma: 'suv_medio' },
  { id: 'jeep_wrangler', classe: 'offroad', marca: 'Jeep', modelo: 'Wrangler', acabamento: 'Rubicon', dica: 'jipe 4x4', faixa: 'intermediaria', preco: 480000, artigo: 'o', pesoUsado: 0, forma: 'suv' },
  { id: 'lr_defender', classe: 'offroad', marca: 'Land Rover', modelo: 'Defender 110', acabamento: 'X D350', dica: 'off-road de luxo', faixa: 'alta', preco: 880000, artigo: 'o', pesoUsado: 0, usoMensal: 1400, forma: 'suv_grande' },
  { id: 'toyota_lc', classe: 'offroad', marca: 'Toyota', modelo: 'Land Cruiser', acabamento: '300 VX', dica: 'off-road grande', faixa: 'alta', preco: 900000, artigo: 'o', pesoUsado: 0, lugares: 7, usoMensal: 1500, forma: 'suv_grande', mercados: ['america_sul', 'asia', 'africa', 'oceania'] },
  { id: 'amg_g63', classe: 'offroad', marca: 'Mercedes-AMG', modelo: 'G 63', acabamento: 'V8 biturbo', dica: 'jipe de altíssimo luxo', faixa: 'alta', preco: 2200000, artigo: 'o', pesoUsado: 0, usoMensal: 3000, forma: 'suv_grande', descricao: 'O jipe de trilha que virou símbolo de luxo: caixa quadrada, V8 e oficina da marca.' },
  // Picapes grandes e esportivas.
  { id: 'ram_1500_bighorn', classe: 'picape_grande', marca: 'RAM', modelo: '1500', acabamento: 'Big Horn', dica: 'picape full-size', faixa: 'intermediaria', preco: 449990, artigo: 'a', pesoUsado: 0, forma: 'picape', mercados: NORTE_E_SUL },
  { id: 'ram_1500_laramie', classe: 'picape_grande', marca: 'RAM', modelo: '1500', acabamento: 'Laramie', dica: 'picape full-size de luxo', faixa: 'alta', preco: 584990, artigo: 'a', pesoUsado: 0, forma: 'picape', mercados: NORTE_E_SUL },
  { id: 'ram_2500', classe: 'picape_grande', marca: 'RAM', modelo: '2500', acabamento: 'Laramie diesel', dica: 'picape pesada', faixa: 'alta', preco: 560000, artigo: 'a', pesoUsado: 0, usoMensal: 1600, forma: 'picape', mercados: NORTE_E_SUL },
  { id: 'silverado', classe: 'picape_grande', marca: 'Chevrolet', modelo: 'Silverado', acabamento: 'High Country', dica: 'picape full-size de luxo', faixa: 'alta', preco: 560000, artigo: 'a', pesoUsado: 0, forma: 'picape', mercados: NORTE_E_SUL },
  { id: 'ranger_raptor', classe: 'picape_grande', marca: 'Ford', modelo: 'Ranger', acabamento: 'Raptor V6', dica: 'picape esportiva', faixa: 'alta', preco: 470000, artigo: 'a', pesoUsado: 0, forma: 'picape' },
  { id: 'hilux_grs', classe: 'picape_grande', marca: 'Toyota', modelo: 'Hilux', acabamento: 'GR-Sport', dica: 'picape esportiva', faixa: 'intermediaria', preco: 400000, artigo: 'a', pesoUsado: 0, forma: 'picape', mercados: ['america_sul', 'asia', 'africa', 'oceania'] },
  { id: 'f150_raptor', classe: 'picape_grande', marca: 'Ford', modelo: 'F-150', acabamento: 'Raptor', dica: 'picape esportiva full-size', faixa: 'alta', preco: 750000, artigo: 'a', pesoUsado: 0, usoMensal: 1700, forma: 'picape', mercados: NORTE_E_SUL },
  // Hipercarros (importação independente: estimativa).
  { id: 'rimac_nevera', classe: 'hipercarro', marca: 'Rimac', modelo: 'Nevera', acabamento: 'elétrico de quatro motores', dica: 'hipercarro elétrico', faixa: 'alta', preco: 22000000, artigo: 'o', pesoUsado: 0, forma: 'esportivo', limitada: 150 },
  { id: 'pagani_utopia', classe: 'hipercarro', marca: 'Pagani', modelo: 'Utopia', acabamento: 'V12, câmbio manual', dica: 'hipercarro artesanal', faixa: 'alta', preco: 25000000, artigo: 'o', pesoUsado: 0, forma: 'esportivo', limitada: 99 },
  { id: 'koenigsegg_jesko', classe: 'hipercarro', marca: 'Koenigsegg', modelo: 'Jesko', acabamento: 'Attack', dica: 'hipercarro sueco', faixa: 'alta', preco: 32000000, artigo: 'o', pesoUsado: 0, forma: 'esportivo', limitada: 125 },
  { id: 'am_valkyrie', classe: 'hipercarro', marca: 'Aston Martin', modelo: 'Valkyrie', acabamento: 'V12 híbrido', dica: 'hipercarro de pista para a rua', faixa: 'alta', preco: 34000000, artigo: 'o', pesoUsado: 0, forma: 'esportivo', limitada: 150 },
  { id: 'bugatti_chiron_ss', classe: 'hipercarro', marca: 'Bugatti', modelo: 'Chiron Super Sport', acabamento: 'W16', dica: 'hipercarro', faixa: 'alta', preco: 38000000, artigo: 'o', pesoUsado: 0, forma: 'esportivo', limitada: 60 },
  // Competição (não roda na rua).
  { id: 'kart_comp', classe: 'competicao', marca: 'Kart', modelo: 'de competição', acabamento: 'categoria sênior, motor 125 cc', dica: 'kart de corrida', faixa: 'economica', preco: 45000, artigo: 'o', pesoUsado: 0, usoMensal: 2500, forma: 'esportivo', descricao: 'Chassi, motor e pneus de slick: vai de carretinha para o kartódromo. A porta de entrada de todo piloto.' },
  { id: 'rali_r5', classe: 'competicao', marca: 'Carro de rali', modelo: 'da categoria Rally2', acabamento: 'tração integral', dica: 'carro de rali', faixa: 'intermediaria', preco: 2400000, artigo: 'o', pesoUsado: 0, usoMensal: 22000, forma: 'hatch' },
  { id: 'stock_car', classe: 'competicao', marca: 'Protótipo', modelo: 'de Stock Car', acabamento: 'temporada passada', dica: 'carro de turismo de corrida', faixa: 'intermediaria', preco: 1800000, artigo: 'o', pesoUsado: 0, usoMensal: 26000, forma: 'seda', mercados: ['BR'] },
  { id: 'porsche_gt3r', classe: 'competicao', marca: 'Porsche', modelo: '911 GT3 R', acabamento: '992, para equipes clientes', dica: 'carro de corrida GT3', faixa: 'alta', preco: 3600000, artigo: 'o', pesoUsado: 0, usoMensal: 32000, forma: 'esportivo' },
  { id: 'f1_monoposto', classe: 'competicao', marca: 'Monoposto', modelo: 'de Fórmula 1', acabamento: 'de temporada passada, ex-equipe de meio de grid', dica: 'carro de Fórmula 1', faixa: 'alta', preco: 14000000, artigo: 'o', pesoUsado: 0, usoMensal: 180000, forma: 'esportivo', descricao: 'Vendido sem os segredos da equipe: roda só com uma equipe especializada contratada, em autódromo homologado, com motor de exibição e manutenção de fábrica a cada saída.' }
];
