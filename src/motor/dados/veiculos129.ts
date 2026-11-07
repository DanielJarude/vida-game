/**
 * VIDA 12.9 — VEÍCULOS E GARAGEM: o catálogo que faltava e o que se faz num carro que aparece no desenho.
 *
 *   VERSÕES   motos (scooters, trail, naked, esportivas, custom), esportivos, luxo, superesportivos, altíssimo luxo,
 *             edições limitadas e clássicos. Marca, modelo e ano reais; preço de referência em reais de 2026 (o de
 *             catálogo no Brasil, com a importação; o clássico, um exemplar em bom estado hoje). Nada de ficha técnica
 *             inventada: só o que é de conhecimento geral (o motor no acabamento, a tiragem declarada pela fábrica).
 *   RARIDADE  vem do produto, nunca do preço: a tiragem numerada (`limitada`), quantos se fizeram (`producao`, só quando
 *             o número é conhecido) e a classe. Um Rolls-Royce de série é caro, não é raro.
 *   PEÇAS     acabamento da pintura (metálico, perolizado, acetinado, fosco), rodas (vários desenhos e cores), teto em
 *             outra cor, faixas e aerofólio — cada uma com o que muda no desenho (`visualDasMods`).
 *
 * Puro (só tipos): vai no pacote `motor-casa`, embaixo dos catálogos que o importam. As versões novas entram no fim de
 * `VERSOES_VEICULO` (uma linha em `bens.ts`); a migração de saves antigos sem versão continua sorteando só entre as de
 * antes (`ehVersao129`), para o carro de um save velho não mudar de modelo.
 */
import type { CategoriaVeiculo, FormaVeiculo, VersaoVeiculo } from './bens';
import type { GrauDeRaridade } from './colecao128';
import type { OpcaoDePeca, PecaDeVeiculo } from './personalizacaoVeiculo';
import { RODAS_MOTO_1291 } from './motosClassicas1291';

type V = VersaoVeiculo;
const AS: V['mercados'] = ['america_sul'];
const BR: V['mercados'] = ['BR'];
const NORTE: V['mercados'] = ['america_norte'];
const FORA_DAS_AMERICAS: V['mercados'] = ['europa', 'asia', 'africa', 'oceania', 'america_norte'];

export const VERSOES_VEICULO_129: readonly V[] = [
  // ---- Motos: o dia a dia, a estrada de terra, as naked, as esportivas, as custom.
  { id: 'yamaha_nmax', classe: 'moto_pequena', marca: 'Yamaha', modelo: 'NMax 160', dica: 'scooter 160 cc', faixa: 'intermediaria', preco: 22990, artigo: 'a', pesoUsado: 1.2, forma: 'scooter', mercados: ['america_sul', 'asia'] },
  { id: 'vespa_primavera', classe: 'moto_pequena', marca: 'Vespa', modelo: 'Primavera 150', dica: 'scooter 150 cc italiana', faixa: 'alta', preco: 33990, artigo: 'a', pesoUsado: 0.3, forma: 'scooter' },
  { id: 'honda_xre190', classe: 'moto_pequena', marca: 'Honda', modelo: 'XRE 190', dica: 'moto 190 cc trail', faixa: 'intermediaria', preco: 23990, artigo: 'a', pesoUsado: 1.2, forma: 'trail', mercados: AS },
  { id: 'yamaha_lander', classe: 'moto_media', marca: 'Yamaha', modelo: 'XTZ 250 Lander', dica: 'moto 250 cc trail', faixa: 'intermediaria', preco: 28990, artigo: 'a', pesoUsado: 1, forma: 'trail', mercados: AS },
  { id: 'royal_enfield_interceptor', classe: 'moto_media', marca: 'Royal Enfield', modelo: 'Interceptor 650', dica: 'moto 650 cc clássica', faixa: 'alta', preco: 34990, artigo: 'a', pesoUsado: 0.4, usoMensal: 300, forma: 'cruiser' },
  { id: 'royal_enfield_himalayan', classe: 'moto_media', marca: 'Royal Enfield', modelo: 'Himalayan 450', dica: 'moto 450 cc de aventura', faixa: 'alta', preco: 32990, artigo: 'a', pesoUsado: 0.4, usoMensal: 290, forma: 'trail' },
  { id: 'kawasaki_z900', classe: 'moto_grande', marca: 'Kawasaki', modelo: 'Z900', dica: 'moto 900 cc naked', faixa: 'economica', preco: 62990, artigo: 'a', pesoUsado: 0.6, usoMensal: 450, forma: 'street' },
  { id: 'yamaha_mt09', classe: 'moto_grande', marca: 'Yamaha', modelo: 'MT-09', dica: 'moto 890 cc naked', faixa: 'economica', preco: 66990, artigo: 'a', pesoUsado: 0.6, usoMensal: 450, forma: 'street' },
  { id: 'triumph_street_triple', classe: 'moto_grande', marca: 'Triumph', modelo: 'Street Triple 765 RS', dica: 'moto 765 cc naked', faixa: 'intermediaria', preco: 82990, artigo: 'a', pesoUsado: 0.4, usoMensal: 480, forma: 'street' },
  { id: 'honda_africa_twin', classe: 'moto_grande', marca: 'Honda', modelo: 'CRF 1100L Africa Twin', dica: 'moto 1100 cc de aventura', faixa: 'intermediaria', preco: 99990, artigo: 'a', pesoUsado: 0.5, forma: 'trail' },
  { id: 'ducati_multistrada', classe: 'moto_grande', marca: 'Ducati', modelo: 'Multistrada V4 S', dica: 'moto 1160 cc de aventura', faixa: 'alta', preco: 165000, artigo: 'a', pesoUsado: 0.3, usoMensal: 650, forma: 'trail' },
  { id: 'harley_fat_boy', classe: 'moto_grande', marca: 'Harley-Davidson', modelo: 'Fat Boy 114', dica: 'moto 1870 cc custom', faixa: 'alta', preco: 135000, artigo: 'a', pesoUsado: 0.4, usoMensal: 560, forma: 'cruiser' },
  { id: 'indian_scout', classe: 'moto_grande', marca: 'Indian', modelo: 'Scout', dica: 'moto 1250 cc custom', faixa: 'intermediaria', preco: 89990, artigo: 'a', pesoUsado: 0.3, forma: 'cruiser' },
  { id: 'bmw_s1000rr', classe: 'moto_grande', marca: 'BMW', modelo: 'S 1000 RR', dica: 'moto esportiva 1000 cc', faixa: 'alta', preco: 135000, artigo: 'a', pesoUsado: 0.3, usoMensal: 650, forma: 'esportiva' },
  { id: 'honda_fireblade', classe: 'moto_grande', marca: 'Honda', modelo: 'CBR 1000RR-R Fireblade SP', dica: 'moto esportiva 1000 cc', faixa: 'alta', preco: 155000, artigo: 'a', pesoUsado: 0.3, usoMensal: 650, forma: 'esportiva' },
  { id: 'ducati_superleggera', classe: 'moto_grande', marca: 'Ducati', modelo: 'Panigale V4 Superleggera', acabamento: 'edição numerada', dica: 'moto esportiva de edição limitada', faixa: 'alta', preco: 1200000, artigo: 'a', pesoUsado: 0.02, usoMensal: 900, forma: 'esportiva', limitada: 500 },
  // ---- Esportivos de rua (a oficina de um carro comum; o preço, o de um importado).
  { id: 'mazda_mx5', classe: 'carro_sedan', marca: 'Mazda', modelo: 'MX-5', acabamento: '2.0, conversível', dica: 'esportivo conversível', faixa: 'alta', preco: 235000, artigo: 'o', pesoUsado: 0.4, lugares: 2, usoMensal: 700, forma: 'esportivo', mercados: FORA_DAS_AMERICAS },
  { id: 'toyota_gr86', classe: 'carro_sedan', marca: 'Toyota', modelo: 'GR86', dica: 'esportivo', faixa: 'alta', preco: 245000, artigo: 'o', pesoUsado: 0.4, lugares: 4, usoMensal: 720, forma: 'esportivo', mercados: FORA_DAS_AMERICAS },
  { id: 'vw_golf_gti', classe: 'carro_sedan', marca: 'Volkswagen', modelo: 'Golf GTI', acabamento: '2.0 turbo', dica: 'hatch esportivo', faixa: 'alta', preco: 429990, artigo: 'o', pesoUsado: 0.5, usoMensal: 900, forma: 'hatch' },
  { id: 'honda_civic_type_r', classe: 'carro_sedan', marca: 'Honda', modelo: 'Civic Type R', acabamento: '2.0 turbo', dica: 'hatch esportivo', faixa: 'alta', preco: 429900, artigo: 'o', pesoUsado: 0.3, usoMensal: 950, forma: 'hatch' },
  { id: 'toyota_supra', classe: 'carro_luxo', marca: 'Toyota', modelo: 'GR Supra', acabamento: '3.0 turbo', dica: 'esportivo', faixa: 'alta', preco: 480000, artigo: 'o', pesoUsado: 0.3, lugares: 2, usoMensal: 1500, forma: 'esportivo' },
  { id: 'chevrolet_corvette', classe: 'carro_luxo', marca: 'Chevrolet', modelo: 'Corvette Stingray', acabamento: '6.2 V8, motor central', dica: 'esportivo de motor central', faixa: 'alta', preco: 540000, artigo: 'o', pesoUsado: 0.6, lugares: 2, usoMensal: 1800, forma: 'esportivo', mercados: NORTE },
  { id: 'porsche_718_cayman', classe: 'carro_luxo', marca: 'Porsche', modelo: '718 Cayman', dica: 'esportivo de motor central', faixa: 'alta', preco: 620000, artigo: 'o', pesoUsado: 0.2, lugares: 2, usoMensal: 1900, forma: 'esportivo' },
  { id: 'bmw_m4', classe: 'carro_luxo', marca: 'BMW', modelo: 'M4 Competition', dica: 'cupê esportivo', faixa: 'alta', preco: 980000, artigo: 'o', pesoUsado: 0.2, lugares: 4, usoMensal: 2200, forma: 'esportivo' },
  { id: 'porsche_taycan', classe: 'carro_luxo', marca: 'Porsche', modelo: 'Taycan', acabamento: '4S', dica: 'sedã esportivo elétrico', faixa: 'alta', preco: 890000, artigo: 'o', pesoUsado: 0.2, usoMensal: 900, forma: 'seda' },
  // ---- Luxo: os SUVs e o sedã grande.
  { id: 'porsche_cayenne', classe: 'carro_luxo', marca: 'Porsche', modelo: 'Cayenne', dica: 'SUV de luxo', faixa: 'alta', preco: 780000, artigo: 'o', pesoUsado: 0.3, usoMensal: 1900, forma: 'suv_medio' },
  { id: 'bmw_x5', classe: 'carro_luxo', marca: 'BMW', modelo: 'X5', acabamento: 'xDrive50e híbrido', dica: 'SUV de luxo híbrido', faixa: 'alta', preco: 720000, artigo: 'o', pesoUsado: 0.4, usoMensal: 1300, forma: 'suv_medio' },
  { id: 'mercedes_s500', classe: 'carro_luxo', marca: 'Mercedes-Benz', modelo: 'S 500', dica: 'sedã de luxo', faixa: 'alta', preco: 1200000, artigo: 'o', pesoUsado: 0.2, usoMensal: 2000, forma: 'seda' },
  { id: 'range_rover', classe: 'carro_luxo', marca: 'Land Rover', modelo: 'Range Rover', acabamento: 'Autobiography', dica: 'SUV de luxo', faixa: 'alta', preco: 1650000, artigo: 'o', pesoUsado: 0.2, usoMensal: 2300, forma: 'suv_grande' },
  { id: 'mercedes_g63', classe: 'carro_luxo', marca: 'Mercedes-AMG', modelo: 'G 63', dica: 'SUV de luxo', faixa: 'alta', preco: 2200000, artigo: 'o', pesoUsado: 0.15, usoMensal: 2800, forma: 'suv_grande' },
  { id: 'cadillac_escalade', classe: 'carro_luxo', marca: 'Cadillac', modelo: 'Escalade', dica: 'SUV de luxo de sete lugares', faixa: 'alta', preco: 690000, artigo: 'o', pesoUsado: 0.8, lugares: 7, usoMensal: 1700, forma: 'suv_grande', mercados: NORTE },
  // ---- Superesportivos de série (caros; não raros: a fábrica faz quantos vender).
  { id: 'ferrari_296', classe: 'superesportivo', marca: 'Ferrari', modelo: '296 GTB', dica: 'superesportivo híbrido V6', faixa: 'alta', preco: 4200000, artigo: 'a', pesoUsado: 0.6, forma: 'esportivo' },
  { id: 'ferrari_purosangue', classe: 'superesportivo', marca: 'Ferrari', modelo: 'Purosangue', dica: 'superesportivo de quatro portas', faixa: 'alta', preco: 7800000, artigo: 'a', pesoUsado: 0.3, lugares: 4, usoMensal: 6000, forma: 'suv' },
  { id: 'lamborghini_urus', classe: 'superesportivo', marca: 'Lamborghini', modelo: 'Urus SE', dica: 'SUV superesportivo', faixa: 'alta', preco: 4000000, artigo: 'o', pesoUsado: 0.8, lugares: 5, forma: 'suv' },
  { id: 'lamborghini_revuelto', classe: 'superesportivo', marca: 'Lamborghini', modelo: 'Revuelto', dica: 'superesportivo V12 híbrido', faixa: 'alta', preco: 9500000, artigo: 'o', pesoUsado: 0.3, usoMensal: 7000, forma: 'esportivo' },
  { id: 'aston_db12', classe: 'superesportivo', marca: 'Aston Martin', modelo: 'DB12', dica: 'superesportivo GT', faixa: 'alta', preco: 3800000, artigo: 'o', pesoUsado: 0.5, lugares: 4, forma: 'esportivo' },
  { id: 'mercedes_amg_gt', classe: 'superesportivo', marca: 'Mercedes-AMG', modelo: 'GT 63', dica: 'superesportivo GT', faixa: 'alta', preco: 1900000, artigo: 'o', pesoUsado: 0.8, lugares: 4, usoMensal: 4000, forma: 'esportivo' },
  // ---- Edições limitadas (a tiragem é a que a fábrica anunciou).
  { id: 'porsche_911_dakar', classe: 'superesportivo', marca: 'Porsche', modelo: '911 Dakar', acabamento: 'edição limitada', dica: 'superesportivo de edição limitada', faixa: 'alta', preco: 3600000, artigo: 'o', pesoUsado: 0.2, lugares: 4, forma: 'esportivo', limitada: 2500 },
  { id: 'porsche_911_st', classe: 'superesportivo', marca: 'Porsche', modelo: '911 S/T', acabamento: 'edição limitada', dica: 'superesportivo de edição limitada', faixa: 'alta', preco: 4900000, artigo: 'o', pesoUsado: 0.15, lugares: 2, forma: 'esportivo', limitada: 1963 },
  { id: 'lamborghini_sterrato', classe: 'superesportivo', marca: 'Lamborghini', modelo: 'Huracán Sterrato', acabamento: 'edição limitada', dica: 'superesportivo de edição limitada', faixa: 'alta', preco: 4900000, artigo: 'o', pesoUsado: 0.15, forma: 'esportivo', limitada: 1499 },
  { id: 'ferrari_sf90_xx', classe: 'superesportivo', marca: 'Ferrari', modelo: 'SF90 XX Stradale', acabamento: 'edição limitada', dica: 'superesportivo de edição limitada', faixa: 'alta', preco: 13000000, artigo: 'a', pesoUsado: 0.05, usoMensal: 8000, forma: 'esportivo', limitada: 799 },
  // ---- Altíssimo luxo.
  { id: 'bentley_bentayga', classe: 'hiperluxo', marca: 'Bentley', modelo: 'Bentayga', dica: 'SUV de altíssimo luxo', faixa: 'alta', preco: 4500000, artigo: 'o', pesoUsado: 0.8, forma: 'suv_grande' },
  { id: 'rolls_spectre', classe: 'hiperluxo', marca: 'Rolls-Royce', modelo: 'Spectre', dica: 'cupê elétrico de altíssimo luxo', faixa: 'alta', preco: 10500000, artigo: 'o', pesoUsado: 0.3, lugares: 4, usoMensal: 4000, forma: 'esportivo' },
  { id: 'rolls_phantom', classe: 'hiperluxo', marca: 'Rolls-Royce', modelo: 'Phantom', dica: 'sedã de altíssimo luxo', faixa: 'alta', preco: 12000000, artigo: 'o', pesoUsado: 0.3, usoMensal: 6500, forma: 'seda' },
  { id: 'bentley_bacalar', classe: 'hiperluxo', marca: 'Bentley', modelo: 'Mulliner Bacalar', acabamento: 'edição limitada', dica: 'barchetta de edição limitada', faixa: 'alta', preco: 25000000, artigo: 'o', pesoUsado: 0.02, lugares: 2, usoMensal: 8000, forma: 'esportivo', limitada: 12 },
  // ---- Clássicos do Brasil (só usados; o preço de um exemplar em bom estado, hoje).
  { id: 'vw_sp2_1973', classe: 'classico', marca: 'Volkswagen', modelo: 'SP2', dica: 'clássico de 1973', faixa: 'intermediaria', preco: 180000, artigo: 'o', pesoUsado: 1.2, ano: 1973, producao: 10200, forma: 'esportivo', lugares: 2, usoMensal: 450, mercados: BR },
  { id: 'willys_interlagos_1964', classe: 'classico', marca: 'Willys', modelo: 'Interlagos', dica: 'clássico de 1964', faixa: 'alta', preco: 400000, artigo: 'o', pesoUsado: 0.3, ano: 1964, producao: 822, forma: 'esportivo', lugares: 2, usoMensal: 500, mercados: BR },
  { id: 'puma_gte_1976', classe: 'classico', marca: 'Puma', modelo: 'GTE', dica: 'clássico de 1976', faixa: 'intermediaria', preco: 150000, artigo: 'o', pesoUsado: 1, ano: 1976, forma: 'esportivo', lugares: 2, usoMensal: 420, mercados: BR },
  { id: 'ford_maverick_gt_1974', classe: 'classico', marca: 'Ford', modelo: 'Maverick GT V8', dica: 'clássico de 1974', faixa: 'intermediaria', preco: 220000, artigo: 'o', pesoUsado: 1.2, ano: 1974, forma: 'esportivo', usoMensal: 800, mercados: BR },
  { id: 'dodge_charger_rt_1971', classe: 'classico', marca: 'Dodge', modelo: 'Charger R/T', dica: 'clássico de 1971', faixa: 'alta', preco: 350000, artigo: 'o', pesoUsado: 0.8, ano: 1971, forma: 'esportivo', usoMensal: 900, mercados: BR },
  { id: 'vw_brasilia_1978', classe: 'classico', marca: 'Volkswagen', modelo: 'Brasília', dica: 'clássico de 1978', faixa: 'economica', preco: 40000, artigo: 'a', pesoUsado: 2.5, ano: 1978, forma: 'compacto', usoMensal: 350, mercados: BR },
  { id: 'ford_landau_1980', classe: 'classico', marca: 'Ford', modelo: 'Landau', dica: 'clássico de 1980', faixa: 'intermediaria', preco: 120000, artigo: 'o', pesoUsado: 1, ano: 1980, forma: 'seda', lugares: 5, usoMensal: 800, mercados: BR },
  { id: 'toyota_bandeirante_1985', classe: 'classico', marca: 'Toyota', modelo: 'Bandeirante', dica: 'clássico de 1985', faixa: 'intermediaria', preco: 150000, artigo: 'o', pesoUsado: 1.5, ano: 1985, forma: 'suv', usoMensal: 650, mercados: AS },
  // ---- Clássicos do mundo.
  { id: 'mini_cooper_s_1965', classe: 'classico', marca: 'Austin', modelo: 'Mini Cooper S', dica: 'clássico de 1965', faixa: 'intermediaria', preco: 280000, artigo: 'o', pesoUsado: 1, ano: 1965, forma: 'compacto', usoMensal: 400 },
  { id: 'fiat_500_1968', classe: 'classico', marca: 'Fiat', modelo: '500 L', dica: 'clássico de 1968', faixa: 'economica', preco: 110000, artigo: 'o', pesoUsado: 1.5, ano: 1968, forma: 'compacto', usoMensal: 300, mercados: FORA_DAS_AMERICAS },
  { id: 'citroen_2cv_1970', classe: 'classico', marca: 'Citroën', modelo: '2CV', dica: 'clássico de 1970', faixa: 'economica', preco: 90000, artigo: 'o', pesoUsado: 1.5, ano: 1970, forma: 'compacto', usoMensal: 300, mercados: ['europa', 'africa', 'asia', 'oceania'] },
  { id: 'chevrolet_bel_air_1957', classe: 'classico', marca: 'Chevrolet', modelo: 'Bel Air', dica: 'clássico de 1957', faixa: 'alta', preco: 450000, artigo: 'o', pesoUsado: 1, ano: 1957, forma: 'seda', lugares: 6, usoMensal: 900, mercados: ['america_norte', 'america_central_caribe'] },
  { id: 'cadillac_eldorado_1959', classe: 'classico', marca: 'Cadillac', modelo: 'Eldorado Biarritz', dica: 'clássico de 1959', faixa: 'alta', preco: 900000, artigo: 'o', pesoUsado: 0.3, ano: 1959, forma: 'seda', lugares: 6, usoMensal: 1100, mercados: NORTE },
  { id: 'datsun_240z_1971', classe: 'classico', marca: 'Datsun', modelo: '240Z', dica: 'clássico de 1971', faixa: 'alta', preco: 300000, artigo: 'o', pesoUsado: 0.8, ano: 1971, forma: 'esportivo', lugares: 2, usoMensal: 600 },
  { id: 'bmw_m3_e30_1988', classe: 'classico', marca: 'BMW', modelo: 'M3 (E30)', dica: 'clássico de 1988', faixa: 'alta', preco: 650000, artigo: 'o', pesoUsado: 0.5, ano: 1988, producao: 17970, forma: 'seda', usoMensal: 900 },
  { id: 'lancia_delta_integrale_1992', classe: 'classico', marca: 'Lancia', modelo: 'Delta HF Integrale Evoluzione', dica: 'clássico de 1992', faixa: 'alta', preco: 550000, artigo: 'o', pesoUsado: 0.4, ano: 1992, forma: 'hatch', usoMensal: 900, mercados: FORA_DAS_AMERICAS },
  { id: 'corvette_1963', classe: 'classico', marca: 'Chevrolet', modelo: 'Corvette Sting Ray Split-Window', dica: 'clássico de 1963', faixa: 'alta', preco: 1100000, artigo: 'o', pesoUsado: 0.3, ano: 1963, producao: 10594, forma: 'esportivo', lugares: 2, usoMensal: 1100 },
  { id: 'shelby_gt500_1967', classe: 'classico', marca: 'Shelby', modelo: 'GT500', dica: 'clássico de 1967', faixa: 'alta', preco: 1800000, artigo: 'o', pesoUsado: 0.2, ano: 1967, producao: 2048, forma: 'esportivo', usoMensal: 1300 },
  { id: 'ferrari_testarossa_1986', classe: 'classico', marca: 'Ferrari', modelo: 'Testarossa', dica: 'clássico de 1986', faixa: 'alta', preco: 1500000, artigo: 'a', pesoUsado: 0.3, ano: 1986, producao: 7177, forma: 'esportivo', lugares: 2, usoMensal: 1600 },
  { id: 'porsche_911_rs_1973', classe: 'classico', marca: 'Porsche', modelo: '911 Carrera RS 2.7', dica: 'clássico de 1973', faixa: 'alta', preco: 4500000, artigo: 'o', pesoUsado: 0.1, ano: 1973, producao: 1580, forma: 'esportivo', usoMensal: 1400 },
  { id: 'lamborghini_countach_1985', classe: 'classico', marca: 'Lamborghini', modelo: 'Countach LP5000 QV', dica: 'clássico de 1985', faixa: 'alta', preco: 4000000, artigo: 'o', pesoUsado: 0.08, ano: 1985, producao: 610, forma: 'esportivo', lugares: 2, usoMensal: 1800 },
  { id: 'toyota_2000gt_1967', classe: 'classico', marca: 'Toyota', modelo: '2000GT', dica: 'clássico de 1967', faixa: 'alta', preco: 6000000, artigo: 'o', pesoUsado: 0.03, ano: 1967, producao: 351, forma: 'esportivo', lugares: 2, usoMensal: 1500 },
  { id: 'mercedes_300sl_1955', classe: 'classico', marca: 'Mercedes-Benz', modelo: '300 SL Asa de Gaivota', dica: 'clássico de 1955', faixa: 'alta', preco: 9000000, artigo: 'o', pesoUsado: 0.03, ano: 1955, producao: 1400, forma: 'esportivo', lugares: 2, usoMensal: 1600 }
];

/** As versões que já existiam e cujo número de fabricação é conhecido (a tiragem do modelo, não do ano). */
export const PRODUCAO_DE_ANTES: Readonly<Record<string, number>> = {
  vw_fusca_1972: 3_300_000, vw_beetle_1967: 21_500_000, ford_mustang_1967: 71_042, mercedes_280sl: 23_885, ferrari_308: 3_219
};

const IDS_129 = new Set(VERSOES_VEICULO_129.map(x => x.id));
/** É uma versão da 12.9 (a migração de saves antigos sem versão sorteia só entre as de antes). */
export const ehVersao129 = (id: string) => IDS_129.has(id);

/* ============================================================== raridade e nome do veículo de coleção */

/** Quantos se fizeram (o dado da versão, ou o conhecido de antes). */
export const producaoDaVersao = (x: Pick<V, 'id' | 'producao'> | undefined): number | undefined => x?.producao ?? (x ? PRODUCAO_DE_ANTES[x.id] : undefined);

/**
 * O grau de raridade de um veículo, dos dados do produto: a tiragem numerada (edição limitada; uma só = peça única), o
 * número fabricado (até mil: muito rara; até 15 mil: rara; até 100 mil: incomum; mais: comum — um Fusca é um clássico, não
 * uma raridade) e, sem número, a classe (o clássico sobrevivente é incomum; o exótico de série é incomum — caro, não raro).
 */
export function grauDoVeiculo(x: Pick<V, 'id' | 'limitada' | 'producao' | 'historica'> | undefined, segmento?: 'exotico' | 'classico'): GrauDeRaridade {
  if (x?.limitada) return x.limitada <= 1 ? 'unica' : 'limitada';
  const p = producaoDaVersao(x);
  // VIDA 12.9.1: o marco da história (`historica`) sobe um grau — só com a produção conhecida, e nunca além de muito rara.
  if (p !== undefined) return GRAUS_POR_PRODUCAO[Math.min(3, (p <= 1000 ? 3 : p <= 15000 ? 2 : p <= 100000 ? 1 : 0) + (x?.historica ? 1 : 0))];
  return segmento ? 'incomum' : 'comum';
}
const GRAUS_POR_PRODUCAO: readonly GrauDeRaridade[] = ['comum', 'incomum', 'rara', 'muito_rara'];

/** O que sustenta o grau, em palavras ("edição limitada de 799 unidades", "cerca de 351 fabricados"). */
export function fundamentoDaRaridade(x: Pick<V, 'id' | 'limitada' | 'producao' | 'ano' | 'historica'> | undefined, segmento?: 'exotico' | 'classico'): string {
  if (x?.limitada) return x.limitada <= 1 ? 'exemplar único' : `edição limitada de ${x.limitada.toLocaleString('pt-BR')} unidades`;
  const p = producaoDaVersao(x);
  // VIDA 12.9.1: o milhar com ponto ("10.594"); antes a vírgula do "3,3 milhões" trocava também o ponto do milhar ("10,594").
  if (p !== undefined) return `${x?.historica ? 'marco da história; ' : ''}${p >= 100000 ? 'mais de' : 'cerca de'} ${p >= 1_000_000 ? `${(Math.round(p / 100_000) / 10).toLocaleString('pt-BR')} milhões` : p.toLocaleString('pt-BR')} fabricados`;
  return segmento === 'classico' ? 'clássico de série' : segmento === 'exotico' ? 'produção em série' : 'carro de série';
}

/** O nome de um veículo na coleção: marca, modelo e ano ("Jaguar E-Type Série 1, 1963"), nunca a classe. */
export function nomeDoVeiculoDeColecao(x: Pick<V, 'marca' | 'modelo'> | undefined, anoFabricacao: number | undefined, nomeSalvo: string | undefined, nomeDaClasse: string): string {
  const base = x ? `${x.marca} ${x.modelo}` : nomeSalvo || nomeDaClasse;
  return anoFabricacao ? `${base}, ${anoFabricacao}` : base;
}

/* ============================================================== personalização que aparece no desenho */

export type AcabamentoPintura = 'metalico' | 'perolizado' | 'acetinado' | 'fosco';
export type EstiloDeRoda = 'liga' | 'raios' | 'calota' | 'cravos';
export interface VisualDaRoda { estilo: EstiloDeRoda; raios?: number; cor: string; /** O aro maior (pneu mais fino). */ aroMaior?: boolean }
export interface VisualVeiculo {
  acabamento?: AcabamentoPintura;
  roda?: VisualDaRoda;
  tetoCor?: string;
  faixa?: 'lateral' | 'dupla';
  aerofolio?: boolean;
  pelicula?: boolean;
  /** VIDA 12.9.1 (moto): o filete pintado no tanque e a cor do banco de couro. */
  filete?: string;
  banco?: string;
  /** VIDA 13: o que as peças funcionais mudam à vista — a suspensão (rebaixada desce, reforçada sobe), o escape
   *  preparado (a ponteira maior), o baú e os alforjes da moto. */
  suspensao?: 'baixa' | 'alta';
  escape?: boolean;
  bagageiro?: 'bau' | 'alforjes';
}

/** Opções com o que mostram (a peça guarda só o id; o desenho lê daqui). */
type Opcao129 = OpcaoDePeca & { formas?: readonly FormaVeiculo[]; roda?: VisualDaRoda; acabamento?: AcabamentoPintura; tetoCor?: string; faixa?: VisualVeiculo['faixa'] };
const ORIG = (nome: string): Opcao129 => ({ id: 'original', nome, frac: 0, piso: 0 });
const OFF_ROAD: readonly FormaVeiculo[] = ['suv', 'suv_medio', 'suv_grande', 'picape'];
const ASA: readonly FormaVeiculo[] = ['compacto', 'hatch', 'seda', 'esportivo'];

/** Cores novas de pintura (somam-se às de antes; os ids antigos continuam valendo). */
export const PINTURAS_129: Opcao129[] = [
  { id: 'branco', nome: 'branco', frac: 0.05, piso: 3500, valor: 0.99, cor: '#ecebe6' },
  { id: 'prata', nome: 'prata', frac: 0.05, piso: 3500, valor: 0.99, cor: '#b9bcc0' },
  { id: 'grafite', nome: 'grafite', frac: 0.05, piso: 3500, valor: 0.99, cor: '#4b4e53' },
  { id: 'preto', nome: 'preto', frac: 0.05, piso: 3500, valor: 0.99, cor: '#1f1f22' },
  { id: 'azul_royal', nome: 'azul-royal', frac: 0.05, piso: 3500, valor: 0.97, cor: '#2747a8' },
  { id: 'vinho', nome: 'vinho', frac: 0.05, piso: 3500, valor: 0.97, cor: '#6e1f2e' },
  { id: 'laranja', nome: 'laranja', frac: 0.05, piso: 3500, valor: 0.95, cor: '#e0712a' },
  { id: 'verde_lima', nome: 'verde-lima', frac: 0.05, piso: 3500, valor: 0.94, cor: '#8fbf3a' },
  { id: 'areia', nome: 'bege-areia', frac: 0.05, piso: 3500, valor: 0.97, cor: '#c9b48f' }
];

/** O acabamento (por cima de qualquer cor). */
export const ACABAMENTO_129: PecaDeVeiculo = {
  id: 'acabamento', nome: 'Acabamento da pintura', tipo: 'estetica', opcoes: [
    ORIG('o acabamento de fábrica'),
    { id: 'metalico', nome: 'metálico (verniz com brilho de flocos)', frac: 0.04, piso: 3000, valor: 0.99, acabamento: 'metalico' } as Opcao129,
    { id: 'perolizado', nome: 'perolizado (muda de tom com a luz)', frac: 0.07, piso: 6000, valor: 0.97, acabamento: 'perolizado' } as Opcao129,
    { id: 'acetinado', nome: 'acetinado (meio brilho)', frac: 0.05, piso: 4500, valor: 0.96, acabamento: 'acetinado' } as Opcao129,
    { id: 'fosco', nome: 'fosco (sem brilho; lava-se com cuidado)', frac: 0.06, piso: 5000, valor: 0.95, acabamento: 'fosco' } as Opcao129
  ]
};

/** Rodas de carro novas (as de antes, "liga leve" e "esportivas", também ganham desenho). */
export const RODAS_CARRO_129: Opcao129[] = [
  { id: 'cinco_raios', nome: 'cinco raios, prata', frac: 0.03, piso: 3000, valor: 1, roda: { estilo: 'liga', raios: 5, cor: '#d4d2cc' } },
  { id: 'multirraios', nome: 'multirraios, grafite', frac: 0.045, piso: 4500, valor: 0.99, roda: { estilo: 'liga', raios: 10, cor: '#55585d', aroMaior: true } },
  { id: 'pretas', nome: 'esportivas pretas, aro grande', frac: 0.05, piso: 5000, valor: 0.98, uso: 1.02, roda: { estilo: 'liga', raios: 6, cor: '#26272a', aroMaior: true } },
  { id: 'douradas', nome: 'forjadas douradas', frac: 0.07, piso: 8000, valor: 0.96, uso: 1.02, roda: { estilo: 'liga', raios: 7, cor: '#c9a23a', aroMaior: true } },
  { id: 'raiadas', nome: 'raiadas cromadas (de arame)', frac: 0.05, piso: 6000, valor: 0.99, roda: { estilo: 'raios', cor: '#e2e0db' } },
  { id: 'aerodinamicas', nome: 'aerodinâmicas, tampa lisa', frac: 0.03, piso: 3000, valor: 0.99, roda: { estilo: 'calota', cor: '#e9e8e4' } },
  { id: 'off_road', nome: 'off-road, pneu de cravo', frac: 0.04, piso: 4500, valor: 0.99, uso: 1.04, formas: OFF_ROAD, roda: { estilo: 'cravos', raios: 6, cor: '#2f3033' } }
];
/** O desenho das rodas que já existiam (sem mudar o efeito delas). */
const RODAS_DE_ANTES: Record<string, VisualDaRoda> = {
  liga: { estilo: 'liga', raios: 6, cor: '#d4d2cc', aroMaior: true },
  esportivas: { estilo: 'liga', raios: 5, cor: '#7b7e83', aroMaior: true }
};

/** Rodas de moto. */
export const RODAS_MOTO_129: PecaDeVeiculo = {
  id: 'rodas', nome: 'Rodas', tipo: 'estetica', opcoes: [
    ORIG('as rodas de série'),
    { id: 'raiadas', nome: 'raiadas, aro cromado', frac: 0.05, piso: 1800, valor: 0.99, roda: { estilo: 'raios', cor: '#e2e0db' } } as Opcao129,
    { id: 'liga_preta', nome: 'liga leve preta', frac: 0.04, piso: 1500, valor: 1, roda: { estilo: 'liga', raios: 6, cor: '#26272a' } } as Opcao129,
    { id: 'liga_dourada', nome: 'liga leve dourada', frac: 0.05, piso: 1900, valor: 0.98, roda: { estilo: 'liga', raios: 5, cor: '#c9a23a' } } as Opcao129,
    ...RODAS_MOTO_1291
  ]
};

/** O que só o carro tem: o teto de outra cor, as faixas, o aerofólio. */
export const DETALHES_CARRO_129: PecaDeVeiculo[] = [
  { id: 'teto', nome: 'Teto', tipo: 'estetica', opcoes: [ORIG('na cor do carro'), { id: 'preto', nome: 'teto preto', frac: 0.02, piso: 2200, valor: 0.99, tetoCor: '#1f1f22' } as Opcao129, { id: 'branco', nome: 'teto branco', frac: 0.02, piso: 2200, valor: 0.98, tetoCor: '#ecebe6' } as Opcao129] },
  { id: 'faixas', nome: 'Faixas', tipo: 'estetica', opcoes: [ORIG('sem faixas'), { id: 'lateral', nome: 'faixa lateral', frac: 0.01, piso: 900, valor: 0.98, faixa: 'lateral' } as Opcao129, { id: 'dupla', nome: 'faixas duplas de corrida', frac: 0.015, piso: 1400, valor: 0.97, faixa: 'dupla' } as Opcao129] },
  { id: 'aerofolio', nome: 'Aerofólio', tipo: 'estetica', opcoes: [ORIG('sem aerofólio'), { id: 'aerofolio', nome: 'aerofólio traseiro', frac: 0.02, piso: 2500, valor: 0.96, formas: ASA } as Opcao129] }
];

/** A opção serve nesta forma de veículo (a roda de cravo é de SUV e picape; o aerofólio, de carro baixo)? */
export const opcaoServe = (o: OpcaoDePeca | undefined, forma: FormaVeiculo): boolean => !(o as Opcao129 | undefined)?.formas || (o as Opcao129).formas!.includes(forma);
/** A peça tem alguma opção (além do original) que sirva nesta forma? */
export const pecaServe = (p: PecaDeVeiculo, forma: FormaVeiculo): boolean => p.opcoes.some(o => o.id !== 'original' && opcaoServe(o, forma));

/** Pintura que já declara o acabamento (o preto fosco de antes). */
const ACABAMENTO_DA_COR: Record<string, AcabamentoPintura> = { preto_fosco: 'fosco' };

/** Lê as peças feitas num veículo e diz o que o desenho mostra. Sem `mods` (ou só o original): nada muda. */
export function visualDasMods(cat: CategoriaVeiculo, mods: Readonly<Record<string, string>> | undefined, pecas: readonly PecaDeVeiculo[]): VisualVeiculo | undefined {
  if (!mods || (cat !== 'carro' && cat !== 'moto')) return undefined;
  const op = (peca: string) => { const id = mods[peca]; return id ? pecas.find(p => p.id === peca)?.opcoes.find(o => o.id === id) as Opcao129 | undefined : undefined; };
  const out: VisualVeiculo = {};
  const ac = op('acabamento')?.acabamento ?? ACABAMENTO_DA_COR[mods.pintura ?? ''];
  if (ac) out.acabamento = ac;
  const r = op('rodas');
  const roda = r?.roda ?? (r ? RODAS_DE_ANTES[r.id] : undefined);
  if (roda) out.roda = roda;
  if (cat === 'carro') {
    const t = op('teto')?.tetoCor; if (t) out.tetoCor = t;
    const f = op('faixas')?.faixa; if (f) out.faixa = f;
    if (mods.aerofolio === 'aerofolio') out.aerofolio = true;
    if (mods.acessorios === 'pelicula') out.pelicula = true;
    if (mods.suspensao === 'rebaixada' || mods.suspensao === 'reforcada') out.suspensao = mods.suspensao === 'rebaixada' ? 'baixa' : 'alta';
    if (mods.motor === 'remap') out.escape = true;
  } else {
    const fi = (op('filete') as { filete?: string } | undefined)?.filete; if (fi) out.filete = fi;
    const bc = (op('banco') as { banco?: string } | undefined)?.banco; if (bc) out.banco = bc;
    if (mods.escape === 'esportivo') out.escape = true;
    if (mods.bagageiro === 'bau' || mods.bagageiro === 'alforjes') out.bagageiro = mods.bagageiro;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Uma chave curta e estável do visual (para o cache dos desenhos). */
export const chaveDoVisual = (x: VisualVeiculo | undefined) => (x ? `${x.acabamento ?? ''}.${x.roda ? `${x.roda.estilo}${x.roda.raios ?? ''}${x.roda.cor}${x.roda.aroMaior ? 'M' : ''}` : ''}.${x.tetoCor ?? ''}.${x.faixa ?? ''}.${x.aerofolio ? 'a' : ''}.${x.pelicula ? 'p' : ''}${x.filete ?? ''}${x.banco ?? ''}.${x.suspensao ?? ''}${x.escape ? 'e' : ''}${x.bagageiro ?? ''}` : '');
