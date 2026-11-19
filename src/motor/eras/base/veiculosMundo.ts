/**
 * ERAS v3 · OS VEÍCULOS DA ÉPOCA NO MUNDO (e no Brasil antes de 1959) — versões a mais do mesmo catálogo, como as da v1/v2.
 *
 * Cada versão tem `epoca: [primeiro, último ano]` de venda no país e `mercados` (o código do país; 'DE_LESTE' é a
 * Alemanha Oriental). Os anos são os de produção/venda (históricos dos fabricantes e dos museus do automóvel: The Henry Ford,
 * British Motor Museum, Mercedes-Benz Classic, August Horch Museum Zwickau, Toyota Automobile Museum, Museo del Automóvil
 * de Buenos Aires, Anfavea) — os meses ficam de fora.
 *
 * PREÇO (APROXIMAÇÃO de jogo, documentada): em reais de hoje, escolhido para que a relação entre o preço do carro e a
 * renda média da época fique na ordem de grandeza histórica (o Modelo T de 1925 custava uns três meses de salário médio
 * americano; o Trabant, alguns anos de salário no leste). Não é a tabela de preço do ano.
 */
import type { VersaoVeiculo } from '../../dados/bens';

type V = VersaoVeiculo & { epoca: [number, number] };
type Mercado = 'BR' | 'US' | 'GB' | 'DE' | 'DE_LESTE' | 'JP' | 'AR';
const m = (...x: Mercado[]): VersaoVeiculo['mercados'] => x;

export const VERSOES_DA_EPOCA_MUNDO: readonly V[] = [
  // ---------------------------------------------------------------- Estados Unidos
  { id: 'epm_olds_curved', classe: 'carro_compacto', marca: 'Oldsmobile', modelo: 'Curved Dash', dica: 'carro a motor de dois lugares', faixa: 'alta', preco: 15000, artigo: 'o', pesoUsado: 1, forma: 'compacto', lugares: 2, mercados: m('US'), epoca: [1901, 1907] },
  { id: 'epm_ford_t', classe: 'carro_compacto', marca: 'Ford', modelo: 'Modelo T', dica: 'o carro de todo mundo', faixa: 'economica', preco: 6000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('US', 'GB'), epoca: [1908, 1927] },
  { id: 'epm_ford_a', classe: 'carro_compacto', marca: 'Ford', modelo: 'Modelo A', dica: 'compacto', faixa: 'economica', preco: 8000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('US'), epoca: [1928, 1931] },
  { id: 'epm_ford_v8', classe: 'carro_sedan', marca: 'Ford', modelo: 'V8', acabamento: 'Tudor', dica: 'sedã', faixa: 'intermediaria', preco: 12000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('US'), epoca: [1932, 1940] },
  { id: 'epm_chevrolet_master', classe: 'carro_compacto', marca: 'Chevrolet', modelo: 'Master', dica: 'compacto', faixa: 'economica', preco: 11000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('US'), epoca: [1933, 1942] },
  { id: 'epm_ford_superdeluxe', classe: 'carro_sedan', marca: 'Ford', modelo: 'Super De Luxe', dica: 'sedã', faixa: 'intermediaria', preco: 18000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('US'), epoca: [1946, 1948] },
  { id: 'epm_chevrolet_belair', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Bel Air', dica: 'sedã grande', faixa: 'intermediaria', preco: 25000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('US'), epoca: [1950, 1957] },
  { id: 'epm_ford_fairlane', classe: 'carro_sedan', marca: 'Ford', modelo: 'Fairlane', dica: 'sedã grande', faixa: 'intermediaria', preco: 27000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('US'), epoca: [1955, 1961] },
  { id: 'epm_vw_beetle', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Fusca', acabamento: '1200', dica: 'compacto importado', faixa: 'economica', preco: 18000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('US', 'GB', 'DE', 'JP'), epoca: [1950, 1978] },
  { id: 'epm_ford_falcon_us', classe: 'carro_compacto', marca: 'Ford', modelo: 'Falcon', dica: 'compacto americano', faixa: 'economica', preco: 26000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('US'), epoca: [1960, 1970] },
  { id: 'epm_ford_pinto', classe: 'carro_compacto', marca: 'Ford', modelo: 'Pinto', dica: 'compacto', faixa: 'economica', preco: 30000, artigo: 'o', pesoUsado: 2, forma: 'compacto', mercados: m('US'), epoca: [1971, 1980] },
  { id: 'epm_honda_civic_us', classe: 'carro_compacto', marca: 'Honda', modelo: 'Civic', dica: 'compacto japonês', faixa: 'economica', preco: 40000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: m('US', 'GB', 'JP'), epoca: [1973, 2025] },
  { id: 'epm_toyota_corolla_mundo', classe: 'carro_sedan', marca: 'Toyota', modelo: 'Corolla', dica: 'sedã compacto', faixa: 'intermediaria', preco: 45000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('US', 'JP', 'GB', 'DE'), epoca: [1968, 2025] },
  { id: 'epm_ford_taurus', classe: 'carro_sedan', marca: 'Ford', modelo: 'Taurus', dica: 'sedã médio', faixa: 'intermediaria', preco: 65000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('US'), epoca: [1986, 2006] },
  { id: 'epm_toyota_camry', classe: 'carro_sedan', marca: 'Toyota', modelo: 'Camry', dica: 'sedã médio', faixa: 'intermediaria', preco: 80000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('US', 'JP'), epoca: [1983, 2025] },
  { id: 'epm_ford_focus', classe: 'carro_compacto', marca: 'Ford', modelo: 'Focus', dica: 'hatch médio', faixa: 'intermediaria', preco: 60000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: m('US', 'GB', 'DE', 'AR'), epoca: [1998, 2018] },
  { id: 'epm_jeep_cj', classe: 'carro_suv', marca: 'Jeep', modelo: 'CJ', dica: 'jipe', faixa: 'intermediaria', preco: 30000, artigo: 'o', pesoUsado: 2, forma: 'suv', mercados: m('US'), epoca: [1945, 1986] },
  { id: 'epm_ford_fserie', classe: 'carro_suv', marca: 'Ford', modelo: 'F-100', dica: 'picape', faixa: 'intermediaria', preco: 35000, artigo: 'a', pesoUsado: 3, forma: 'picape', lugares: 3, mercados: m('US'), epoca: [1948, 2025] },
  { id: 'epm_harley_wl', classe: 'moto_media', marca: 'Harley-Davidson', modelo: 'WL', dica: 'moto de 750 cc', faixa: 'intermediaria', preco: 14000, artigo: 'a', pesoUsado: 1, forma: 'cruiser', mercados: m('US'), epoca: [1937, 1952] },
  { id: 'epm_honda_supercub', classe: 'moto_pequena', marca: 'Honda', modelo: 'Super Cub', dica: 'moto de 50 cc', faixa: 'economica', preco: 5000, artigo: 'a', pesoUsado: 3, forma: 'cub', mercados: m('JP', 'US', 'GB', 'AR'), epoca: [1958, 2025] },
  // ---------------------------------------------------------------- Reino Unido
  { id: 'epm_austin_seven', classe: 'carro_compacto', marca: 'Austin', modelo: 'Seven', dica: 'o carrinho popular', faixa: 'economica', preco: 9000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('GB'), epoca: [1922, 1939] },
  { id: 'epm_ford_anglia', classe: 'carro_compacto', marca: 'Ford', modelo: 'Anglia', dica: 'compacto', faixa: 'economica', preco: 14000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('GB'), epoca: [1939, 1967] },
  { id: 'epm_morris_minor', classe: 'carro_compacto', marca: 'Morris', modelo: 'Minor', dica: 'compacto', faixa: 'economica', preco: 16000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('GB'), epoca: [1948, 1971] },
  { id: 'epm_mini', classe: 'carro_compacto', marca: 'Austin', modelo: 'Mini', dica: 'o pequeno de quatro lugares', faixa: 'economica', preco: 18000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('GB'), epoca: [1959, 2000] },
  { id: 'epm_ford_cortina', classe: 'carro_sedan', marca: 'Ford', modelo: 'Cortina', dica: 'sedã médio', faixa: 'intermediaria', preco: 28000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('GB'), epoca: [1962, 1982] },
  { id: 'epm_ford_escort_gb', classe: 'carro_compacto', marca: 'Ford', modelo: 'Escort', dica: 'compacto', faixa: 'economica', preco: 32000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: m('GB', 'DE'), epoca: [1968, 2000] },
  { id: 'epm_land_rover', classe: 'carro_suv', marca: 'Land Rover', modelo: 'Series', dica: 'utilitário 4x4', faixa: 'intermediaria', preco: 32000, artigo: 'o', pesoUsado: 2, forma: 'suv', mercados: m('GB'), epoca: [1948, 1985] },
  { id: 'epm_bsa_bantam', classe: 'moto_pequena', marca: 'BSA', modelo: 'Bantam', dica: 'moto de 125 cc', faixa: 'economica', preco: 5000, artigo: 'a', pesoUsado: 3, forma: 'street', mercados: m('GB'), epoca: [1948, 1971] },
  { id: 'epm_vespa', classe: 'moto_pequena', marca: 'Vespa', modelo: '125', dica: 'lambreta', faixa: 'economica', preco: 6000, artigo: 'a', pesoUsado: 3, forma: 'scooter', mercados: m('GB', 'DE', 'AR'), epoca: [1950, 2025] },
  // ---------------------------------------------------------------- Alemanha (e o leste)
  { id: 'epm_opel_laubfrosch', classe: 'carro_compacto', marca: 'Opel', modelo: '4 PS', dica: 'o "perereca", primeiro carro de linha de montagem do país', faixa: 'economica', preco: 12000, artigo: 'o', pesoUsado: 2, forma: 'compacto', mercados: m('DE'), epoca: [1924, 1931] },
  { id: 'epm_opel_kadett36', classe: 'carro_compacto', marca: 'Opel', modelo: 'Kadett', dica: 'compacto', faixa: 'economica', preco: 10000, artigo: 'o', pesoUsado: 2, forma: 'compacto', mercados: m('DE'), epoca: [1936, 1940] },
  { id: 'epm_mercedes_170v', classe: 'carro_sedan', marca: 'Mercedes-Benz', modelo: '170 V', dica: 'sedã', faixa: 'alta', preco: 25000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('DE'), epoca: [1936, 1955] },
  { id: 'epm_opel_rekord', classe: 'carro_sedan', marca: 'Opel', modelo: 'Rekord', dica: 'sedã médio', faixa: 'intermediaria', preco: 32000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('DE'), epoca: [1953, 1986] },
  { id: 'epm_vw_golf', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Golf', dica: 'hatch compacto', faixa: 'intermediaria', preco: 45000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: m('DE', 'GB'), epoca: [1974, 2025] },
  { id: 'epm_mercedes_w123', classe: 'carro_sedan', marca: 'Mercedes-Benz', modelo: '200 (W123)', dica: 'sedã grande', faixa: 'alta', preco: 90000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('DE'), epoca: [1976, 1986] },
  { id: 'epm_trabant', classe: 'carro_compacto', marca: 'Trabant', modelo: '601', dica: 'compacto de carroceria de plástico (fila de espera de anos)', faixa: 'economica', preco: 22000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('DE_LESTE'), epoca: [1964, 1990] },
  { id: 'epm_wartburg', classe: 'carro_sedan', marca: 'Wartburg', modelo: '353', dica: 'sedã', faixa: 'intermediaria', preco: 32000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('DE_LESTE'), epoca: [1966, 1990] },
  { id: 'epm_nsu_quickly', classe: 'moto_pequena', marca: 'NSU', modelo: 'Quickly', dica: 'ciclomotor de 50 cc', faixa: 'economica', preco: 3500, artigo: 'a', pesoUsado: 3, forma: 'cub', mercados: m('DE'), epoca: [1953, 1966] },
  { id: 'epm_simson_schwalbe', classe: 'moto_pequena', marca: 'Simson', modelo: 'Schwalbe', dica: 'lambreta de 50 cc', faixa: 'economica', preco: 4500, artigo: 'a', pesoUsado: 3, forma: 'scooter', mercados: m('DE_LESTE'), epoca: [1964, 1990] },
  // ---------------------------------------------------------------- Japão
  { id: 'epm_toyota_crown', classe: 'carro_sedan', marca: 'Toyota', modelo: 'Crown', dica: 'sedã (o carro dos táxis e das empresas)', faixa: 'alta', preco: 45000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('JP'), epoca: [1955, 2025] },
  { id: 'epm_subaru_360', classe: 'carro_compacto', marca: 'Subaru', modelo: '360', dica: 'minicarro (kei)', faixa: 'economica', preco: 15000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('JP'), epoca: [1958, 1971] },
  { id: 'epm_datsun_bluebird', classe: 'carro_sedan', marca: 'Datsun', modelo: 'Bluebird', dica: 'sedã médio', faixa: 'intermediaria', preco: 30000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('JP'), epoca: [1959, 2001] },
  { id: 'epm_honda_n360', classe: 'carro_compacto', marca: 'Honda', modelo: 'N360', dica: 'minicarro (kei)', faixa: 'economica', preco: 16000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('JP'), epoca: [1967, 1972] },
  { id: 'epm_toyota_hilux', classe: 'carro_suv', marca: 'Toyota', modelo: 'Hilux', dica: 'picape', faixa: 'intermediaria', preco: 60000, artigo: 'a', pesoUsado: 3, forma: 'picape', mercados: m('JP', 'AR', 'GB'), epoca: [1968, 2025] },
  // ---------------------------------------------------------------- Argentina
  { id: 'epm_ika_jeep', classe: 'carro_suv', marca: 'IKA', modelo: 'Jeep', dica: 'jipe nacional', faixa: 'intermediaria', preco: 30000, artigo: 'o', pesoUsado: 2, forma: 'suv', mercados: m('AR'), epoca: [1956, 1977] },
  { id: 'epm_fiat_600', classe: 'carro_compacto', marca: 'Fiat', modelo: '600', dica: 'o "fitito", compacto popular', faixa: 'economica', preco: 18000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('AR'), epoca: [1960, 1982] },
  { id: 'epm_ford_falcon_ar', classe: 'carro_sedan', marca: 'Ford', modelo: 'Falcon', dica: 'sedã nacional', faixa: 'intermediaria', preco: 35000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('AR'), epoca: [1962, 1991] },
  { id: 'epm_renault_4', classe: 'carro_compacto', marca: 'Renault', modelo: '4', dica: 'compacto', faixa: 'economica', preco: 20000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: m('AR'), epoca: [1963, 1987] },
  { id: 'epm_renault_12', classe: 'carro_sedan', marca: 'Renault', modelo: '12', dica: 'sedã médio', faixa: 'intermediaria', preco: 32000, artigo: 'o', pesoUsado: 3, forma: 'seda', mercados: m('AR'), epoca: [1971, 1994] },
  { id: 'epm_peugeot_504', classe: 'carro_sedan', marca: 'Peugeot', modelo: '504', dica: 'sedã médio', faixa: 'intermediaria', preco: 40000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('AR'), epoca: [1969, 1999] },
  { id: 'epm_ford_f100_ar', classe: 'carro_suv', marca: 'Ford', modelo: 'F-100', dica: 'picape', faixa: 'intermediaria', preco: 45000, artigo: 'a', pesoUsado: 2, forma: 'picape', lugares: 3, mercados: m('AR'), epoca: [1959, 1998] },
  { id: 'epm_fiat_147_ar', classe: 'carro_compacto', marca: 'Fiat', modelo: '147', dica: 'compacto', faixa: 'economica', preco: 30000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: m('AR'), epoca: [1982, 1996] },
  { id: 'epm_vw_gol_ar', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Gol', dica: 'hatch compacto', faixa: 'economica', preco: 45000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: m('AR'), epoca: [1990, 2023] },
  { id: 'epm_siambretta', classe: 'moto_pequena', marca: 'Siambretta', modelo: '150', dica: 'lambreta nacional', faixa: 'economica', preco: 6000, artigo: 'a', pesoUsado: 3, forma: 'scooter', mercados: m('AR'), epoca: [1954, 1966] },
  // ---------------------------------------------------------------- Brasil antes da indústria nacional (montados aqui ou importados)
  { id: 'epm_br_ford_t', classe: 'carro_compacto', marca: 'Ford', modelo: 'Modelo T', acabamento: 'montado em São Paulo', dica: 'compacto', faixa: 'intermediaria', preco: 9000, artigo: 'o', pesoUsado: 2, forma: 'compacto', mercados: m('BR'), epoca: [1919, 1927] },
  { id: 'epm_br_ford_a', classe: 'carro_compacto', marca: 'Ford', modelo: 'Modelo A', dica: 'compacto', faixa: 'intermediaria', preco: 11000, artigo: 'o', pesoUsado: 2, forma: 'compacto', mercados: m('BR'), epoca: [1928, 1931] },
  { id: 'epm_br_chevrolet', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Master', acabamento: 'montado no Brasil', dica: 'sedã', faixa: 'alta', preco: 16000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('BR'), epoca: [1933, 1942] },
  { id: 'epm_br_belair', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Bel Air', acabamento: 'importado', dica: 'sedã grande importado', faixa: 'alta', preco: 60000, artigo: 'o', pesoUsado: 1, forma: 'seda', mercados: m('BR'), epoca: [1950, 1957] },
  { id: 'epm_br_romi_isetta', classe: 'carro_compacto', marca: 'Romi', modelo: 'Isetta', dica: 'minicarro de porta frontal', faixa: 'economica', preco: 22000, artigo: 'o', pesoUsado: 1, forma: 'compacto', lugares: 2, mercados: m('BR'), epoca: [1956, 1961] },
  { id: 'epm_br_dkw', classe: 'carro_sedan', marca: 'DKW-Vemag', modelo: 'Belcar', dica: 'sedã nacional', faixa: 'intermediaria', preco: 50000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('BR'), epoca: [1956, 1967] },
  { id: 'epm_br_simca', classe: 'carro_sedan', marca: 'Simca', modelo: 'Chambord', dica: 'sedã grande', faixa: 'alta', preco: 75000, artigo: 'o', pesoUsado: 1, forma: 'seda', mercados: m('BR'), epoca: [1959, 1967] },
  { id: 'epm_br_aero_willys', classe: 'carro_sedan', marca: 'Willys', modelo: 'Aero-Willys', dica: 'sedã grande', faixa: 'alta', preco: 70000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: m('BR'), epoca: [1960, 1971] },
  { id: 'epm_br_jeep', classe: 'carro_suv', marca: 'Willys', modelo: 'Jeep', dica: 'jipe', faixa: 'intermediaria', preco: 45000, artigo: 'o', pesoUsado: 2, forma: 'suv', mercados: m('BR'), epoca: [1957, 1983] },
  { id: 'epm_br_rural', classe: 'carro_suv', marca: 'Willys', modelo: 'Rural', dica: 'utilitário', faixa: 'intermediaria', preco: 50000, artigo: 'a', pesoUsado: 2, forma: 'suv', mercados: m('BR'), epoca: [1956, 1977] }
];

/** O desenho que cada versão reaproveita (o mesmo modelo já desenhado), quando não tem o seu. */
export const DESENHO_DE: Readonly<Record<string, string>> = {
  epm_vw_beetle: 'ep_vw_fusca', epm_honda_civic_us: 'ep_honda_civic', epm_toyota_corolla_mundo: 'ep_toyota_corolla', epm_ford_fserie: 'ford_f150',
  epm_toyota_hilux: 'toyota_hilux', epm_ford_escort_gb: 'ep_ford_escort', epm_ford_f100_ar: 'ep_ford_f1000', epm_fiat_147_ar: 'ep_fiat_147', epm_vw_gol_ar: 'ep_vw_gol_bola',
  epm_br_ford_t: 'epm_ford_t', epm_br_ford_a: 'epm_ford_a', epm_br_chevrolet: 'epm_chevrolet_master', epm_br_belair: 'epm_chevrolet_belair', epm_br_jeep: 'epm_jeep_cj',
  epm_ika_jeep: 'epm_jeep_cj', epm_ford_falcon_ar: 'epm_ford_falcon_us', epm_toyota_camry: 'ep_toyota_corolla', epm_ford_focus: 'ep_ford_escort'
};
