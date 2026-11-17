/**
 * ERAS HISTÓRICAS · OS VEÍCULOS DA ÉPOCA (Brasil) — versões a mais do MESMO catálogo (`dados/bens.VERSOES_VEICULO`).
 *
 * Cada versão da época tem `epoca: [primeiro, último ano de fabricação no Brasil]` e só aparece em vida histórica, no
 * ano coberto (nunca nas contemporâneas, nem no sorteio de saves antigos). Para as classes que esta lista cobre (compacto,
 * sedã, utilitário, motos pequenas e médias), uma vida histórica até 2025 vê só o que se fabricava/vendia no ano; as
 * versões atuais do catálogo entram com o ano de lançamento (`ATUAIS_DESDE`). As outras classes (luxo, barcos, aviões,
 * bicicletas comuns) seguem o catálogo de sempre — limitação documentada.
 *
 * Os anos são os de produção no Brasil (históricos das montadoras; Anfavea). PREÇO: em reais de hoje, pela faixa do
 * modelo equivalente atual (APROXIMAÇÃO: não é a tabela de preço da época; o carro popular dos anos 1990 custava, em
 * poder de compra de hoje, o mesmo que o compacto de entrada atual).
 */

import type { VersaoVeiculo } from '../../dados/bens';

type V = VersaoVeiculo & { epoca: [number, number] };
const BR = ['BR'] as const;

export const VERSOES_DA_EPOCA: readonly V[] = [
  // ---------------------------------------------------------------- compactos
  { id: 'ep_vw_fusca', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Fusca', acabamento: '1300', dica: 'compacto', faixa: 'economica', preco: 62000, artigo: 'o', pesoUsado: 3, forma: 'compacto', mercados: BR, epoca: [1959, 1986] },
  { id: 'ep_fiat_147', classe: 'carro_compacto', marca: 'Fiat', modelo: '147', acabamento: 'L 1.050', dica: 'compacto', faixa: 'economica', preco: 64000, artigo: 'o', pesoUsado: 2, forma: 'hatch', mercados: BR, epoca: [1976, 1986] },
  { id: 'ep_gm_chevette', classe: 'carro_compacto', marca: 'Chevrolet', modelo: 'Chevette', acabamento: '1.6', dica: 'compacto', faixa: 'economica', preco: 68000, artigo: 'o', pesoUsado: 2.5, forma: 'compacto', mercados: BR, epoca: [1973, 1993] },
  { id: 'ep_vw_gol_quadrado', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Gol', acabamento: '1.6', dica: 'hatch compacto', faixa: 'economica', preco: 70000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: BR, epoca: [1980, 1994] },
  { id: 'ep_fiat_uno', classe: 'carro_compacto', marca: 'Fiat', modelo: 'Uno', acabamento: 'S 1.3', dica: 'hatch compacto', faixa: 'economica', preco: 68000, artigo: 'o', pesoUsado: 2.5, forma: 'hatch', mercados: BR, epoca: [1984, 1990] },
  { id: 'ep_fiat_mille', classe: 'carro_compacto', marca: 'Fiat', modelo: 'Uno Mille', acabamento: '1.0', dica: 'carro popular', faixa: 'economica', preco: 60000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: BR, epoca: [1990, 2013] },
  { id: 'ep_ford_escort', classe: 'carro_compacto', marca: 'Ford', modelo: 'Escort', acabamento: '1.6', dica: 'hatch médio', faixa: 'intermediaria', preco: 84000, artigo: 'o', pesoUsado: 2, forma: 'hatch', mercados: BR, epoca: [1983, 2003] },
  { id: 'ep_vw_fusca_itamar', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Fusca', acabamento: '1600 (volta de 1993)', dica: 'compacto', faixa: 'economica', preco: 60000, artigo: 'o', pesoUsado: 1, forma: 'compacto', mercados: BR, epoca: [1993, 1996] },
  { id: 'ep_gm_corsa', classe: 'carro_compacto', marca: 'Chevrolet', modelo: 'Corsa', acabamento: 'Wind 1.0', dica: 'carro popular', faixa: 'economica', preco: 64000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: BR, epoca: [1994, 2002] },
  { id: 'ep_vw_gol_bola', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Gol', acabamento: '1.0', dica: 'carro popular', faixa: 'economica', preco: 66000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: BR, epoca: [1994, 2008] },
  { id: 'ep_fiat_palio', classe: 'carro_compacto', marca: 'Fiat', modelo: 'Palio', acabamento: 'EDX 1.0', dica: 'hatch compacto', faixa: 'economica', preco: 66000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: BR, epoca: [1996, 2017] },
  { id: 'ep_ford_ka', classe: 'carro_compacto', marca: 'Ford', modelo: 'Ka', acabamento: '1.0', dica: 'compacto', faixa: 'economica', preco: 64000, artigo: 'o', pesoUsado: 2, forma: 'compacto', mercados: BR, epoca: [1997, 2021] },
  { id: 'ep_gm_celta', classe: 'carro_compacto', marca: 'Chevrolet', modelo: 'Celta', acabamento: '1.0', dica: 'carro popular', faixa: 'economica', preco: 62000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: BR, epoca: [2000, 2015] },
  { id: 'ep_vw_fox', classe: 'carro_compacto', marca: 'Volkswagen', modelo: 'Fox', acabamento: '1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 72000, artigo: 'o', pesoUsado: 2, forma: 'hatch', mercados: BR, epoca: [2003, 2021] },
  { id: 'ep_gm_onix', classe: 'carro_compacto', marca: 'Chevrolet', modelo: 'Onix', acabamento: '1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 82000, artigo: 'o', pesoUsado: 3, forma: 'hatch', mercados: BR, epoca: [2012, 2025] },
  { id: 'ep_hyundai_hb20', classe: 'carro_compacto', marca: 'Hyundai', modelo: 'HB20', acabamento: '1.0', dica: 'hatch compacto', faixa: 'intermediaria', preco: 82000, artigo: 'o', pesoUsado: 2.5, forma: 'hatch', mercados: BR, epoca: [2012, 2025] },
  // ---------------------------------------------------------------- sedãs
  { id: 'ep_gm_opala', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Opala', acabamento: 'Comodoro 4.1', dica: 'sedã grande', faixa: 'alta', preco: 150000, artigo: 'o', pesoUsado: 2, forma: 'seda', usoMensal: 900, mercados: BR, epoca: [1968, 1992] },
  { id: 'ep_vw_passat', classe: 'carro_sedan', marca: 'Volkswagen', modelo: 'Passat', acabamento: 'LS 1.6', dica: 'sedã médio', faixa: 'intermediaria', preco: 110000, artigo: 'o', pesoUsado: 1.5, forma: 'seda', mercados: BR, epoca: [1974, 1988] },
  { id: 'ep_ford_del_rey', classe: 'carro_sedan', marca: 'Ford', modelo: 'Del Rey', acabamento: 'Ghia 1.6', dica: 'sedã médio', faixa: 'intermediaria', preco: 115000, artigo: 'o', pesoUsado: 1.5, forma: 'seda', mercados: BR, epoca: [1981, 1991] },
  { id: 'ep_gm_monza', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Monza', acabamento: 'SL/E 2.0', dica: 'sedã médio', faixa: 'intermediaria', preco: 120000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: BR, epoca: [1982, 1996] },
  { id: 'ep_vw_santana', classe: 'carro_sedan', marca: 'Volkswagen', modelo: 'Santana', acabamento: 'CL 2.0', dica: 'sedã médio', faixa: 'intermediaria', preco: 120000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: BR, epoca: [1984, 2006] },
  { id: 'ep_fiat_tempra', classe: 'carro_sedan', marca: 'Fiat', modelo: 'Tempra', acabamento: '2.0', dica: 'sedã médio', faixa: 'intermediaria', preco: 125000, artigo: 'o', pesoUsado: 1, forma: 'seda', mercados: BR, epoca: [1991, 1999] },
  { id: 'ep_gm_vectra', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Vectra', acabamento: 'GLS 2.0', dica: 'sedã médio', faixa: 'intermediaria', preco: 135000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: BR, epoca: [1993, 2011] },
  { id: 'ep_fiat_siena', classe: 'carro_sedan', marca: 'Fiat', modelo: 'Siena', acabamento: '1.0', dica: 'sedã compacto', faixa: 'economica', preco: 78000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: BR, epoca: [1997, 2016] },
  { id: 'ep_honda_civic', classe: 'carro_sedan', marca: 'Honda', modelo: 'Civic', acabamento: 'LX 1.6', dica: 'sedã médio', faixa: 'alta', preco: 150000, artigo: 'o', pesoUsado: 2, forma: 'seda', mercados: BR, epoca: [1997, 2021] },
  { id: 'ep_toyota_corolla', classe: 'carro_sedan', marca: 'Toyota', modelo: 'Corolla', acabamento: 'XEi 1.8', dica: 'sedã médio', faixa: 'alta', preco: 155000, artigo: 'o', pesoUsado: 2.5, forma: 'seda', mercados: BR, epoca: [1998, 2025] },
  // ---------------------------------------------------------------- utilitários e picapes
  { id: 'ep_toyota_bandeirante', classe: 'carro_suv', marca: 'Toyota', modelo: 'Bandeirante', acabamento: 'jipe diesel', dica: 'utilitário 4x4', faixa: 'intermediaria', preco: 140000, artigo: 'o', pesoUsado: 1.5, forma: 'suv', usoMensal: 650, mercados: BR, epoca: [1958, 2001] },
  { id: 'ep_vw_saveiro', classe: 'carro_suv', marca: 'Volkswagen', modelo: 'Saveiro', acabamento: '1.6', dica: 'picape pequena', faixa: 'economica', preco: 88000, artigo: 'a', pesoUsado: 2, forma: 'picape', lugares: 2, mercados: BR, epoca: [1982, 2025] },
  { id: 'ep_ford_f1000', classe: 'carro_suv', marca: 'Ford', modelo: 'F-1000', acabamento: 'diesel', dica: 'picape grande', faixa: 'alta', preco: 180000, artigo: 'a', pesoUsado: 1.5, forma: 'picape', usoMensal: 800, lugares: 3, mercados: BR, epoca: [1979, 1998] },
  { id: 'ep_gm_s10', classe: 'carro_suv', marca: 'Chevrolet', modelo: 'S10', acabamento: 'cabine dupla', dica: 'picape média', faixa: 'alta', preco: 190000, artigo: 'a', pesoUsado: 2, forma: 'picape', usoMensal: 750, mercados: BR, epoca: [1995, 2025] },
  { id: 'ep_ford_ecosport', classe: 'carro_suv', marca: 'Ford', modelo: 'EcoSport', acabamento: '1.6', dica: 'SUV compacto', faixa: 'intermediaria', preco: 110000, artigo: 'o', pesoUsado: 2, forma: 'suv', mercados: BR, epoca: [2003, 2021] },
  { id: 'ep_renault_duster', classe: 'carro_suv', marca: 'Renault', modelo: 'Duster', acabamento: '1.6', dica: 'SUV compacto', faixa: 'intermediaria', preco: 115000, artigo: 'o', pesoUsado: 1.5, forma: 'suv', mercados: BR, epoca: [2011, 2025] },
  { id: 'ep_jeep_renegade', classe: 'carro_suv', marca: 'Jeep', modelo: 'Renegade', acabamento: '1.8', dica: 'SUV compacto', faixa: 'alta', preco: 135000, artigo: 'o', pesoUsado: 1.5, forma: 'suv', mercados: BR, epoca: [2015, 2025] },
  // ---------------------------------------------------------------- motos
  { id: 'ep_honda_cg125', classe: 'moto_pequena', marca: 'Honda', modelo: 'CG 125', dica: 'moto 125 cc', faixa: 'economica', preco: 13500, artigo: 'a', pesoUsado: 3, usoMensal: 170, forma: 'street', mercados: BR, epoca: [1976, 2008] },
  { id: 'ep_yamaha_ybr125', classe: 'moto_pequena', marca: 'Yamaha', modelo: 'YBR 125', dica: 'moto 125 cc', faixa: 'economica', preco: 13900, artigo: 'a', pesoUsado: 2, usoMensal: 170, forma: 'street', mercados: BR, epoca: [2000, 2016] },
  { id: 'ep_honda_cg150', classe: 'moto_pequena', marca: 'Honda', modelo: 'CG 150 Titan', dica: 'moto 150 cc', faixa: 'intermediaria', preco: 15900, artigo: 'a', pesoUsado: 3, usoMensal: 180, forma: 'street', mercados: BR, epoca: [2004, 2015] },
  { id: 'ep_honda_cb400', classe: 'moto_media', marca: 'Honda', modelo: 'CB 400', dica: 'moto 400 cc', faixa: 'alta', preco: 32000, artigo: 'a', pesoUsado: 1, usoMensal: 300, forma: 'street', mercados: BR, epoca: [1980, 1983] },
  { id: 'ep_honda_cb450', classe: 'moto_media', marca: 'Honda', modelo: 'CB 450', dica: 'moto 450 cc', faixa: 'alta', preco: 33000, artigo: 'a', pesoUsado: 1, usoMensal: 300, forma: 'street', mercados: BR, epoca: [1984, 1994] },
  { id: 'ep_honda_sahara', classe: 'moto_media', marca: 'Honda', modelo: 'NX 350 Sahara', dica: 'moto 350 cc trail', faixa: 'alta', preco: 30000, artigo: 'a', pesoUsado: 1, usoMensal: 280, forma: 'trail', mercados: BR, epoca: [1991, 1999] },
  { id: 'ep_honda_falcon', classe: 'moto_media', marca: 'Honda', modelo: 'NX4 Falcon', dica: 'moto 400 cc trail', faixa: 'alta', preco: 31000, artigo: 'a', pesoUsado: 1, usoMensal: 290, forma: 'trail', mercados: BR, epoca: [2000, 2008] },
  { id: 'ep_honda_twister', classe: 'moto_media', marca: 'Honda', modelo: 'CBX 250 Twister', dica: 'moto 250 cc', faixa: 'intermediaria', preco: 24000, artigo: 'a', pesoUsado: 2, usoMensal: 260, forma: 'street', mercados: BR, epoca: [2001, 2008] },
  // ---------------------------------------------------------------- ERAS v2: importados (depois da abertura de 1990), SUVs e picapes grandes, motos grandes, bicicletas
  { id: 'ep_mb_c280_w202', classe: 'carro_luxo', marca: 'Mercedes-Benz', modelo: 'C 280', acabamento: 'W202', dica: 'sedã de luxo importado', faixa: 'alta', preco: 290000, artigo: 'o', pesoUsado: 1, forma: 'seda', mercados: BR, epoca: [1993, 2000] },
  { id: 'ep_bmw_325i_e36', classe: 'carro_luxo', marca: 'BMW', modelo: '325i', acabamento: 'E36', dica: 'sedã esportivo importado', faixa: 'alta', preco: 260000, artigo: 'o', pesoUsado: 1, forma: 'seda', mercados: BR, epoca: [1992, 1998] },
  { id: 'ep_bmw_320i_e46', classe: 'carro_luxo', marca: 'BMW', modelo: '320i', acabamento: 'E46', dica: 'sedã esportivo importado', faixa: 'alta', preco: 250000, artigo: 'o', pesoUsado: 1, forma: 'seda', mercados: BR, epoca: [1999, 2005] },
  { id: 'ep_mb_c200_w204', classe: 'carro_luxo', marca: 'Mercedes-Benz', modelo: 'C 200', acabamento: 'W204', dica: 'sedã de luxo importado', faixa: 'alta', preco: 260000, artigo: 'o', pesoUsado: 1.5, forma: 'seda', mercados: BR, epoca: [2007, 2014] },
  { id: 'ep_porsche_911_993', classe: 'superesportivo', marca: 'Porsche', modelo: '911 Carrera', acabamento: '993', dica: 'esportivo importado', faixa: 'alta', preco: 850000, artigo: 'o', pesoUsado: 0.5, forma: 'esportivo', mercados: BR, epoca: [1994, 1998] },
  { id: 'ep_ferrari_f355', classe: 'superesportivo', marca: 'Ferrari', modelo: 'F355', acabamento: 'Berlinetta', dica: 'esportivo de motor central', faixa: 'alta', preco: 1500000, artigo: 'a', pesoUsado: 0.3, forma: 'esportivo', mercados: BR, epoca: [1995, 1999] },
  { id: 'ep_mitsubishi_pajero', classe: 'carro_suv_grande', marca: 'Mitsubishi', modelo: 'Pajero', acabamento: 'GLS 2.8 diesel', dica: 'utilitário 4x4 grande', faixa: 'alta', preco: 330000, artigo: 'o', pesoUsado: 1.5, forma: 'suv', usoMensal: 900, mercados: BR, epoca: [1992, 2006] },
  { id: 'ep_gm_blazer', classe: 'carro_suv_grande', marca: 'Chevrolet', modelo: 'Blazer', acabamento: 'DLX 4.3 V6', dica: 'utilitário grande', faixa: 'alta', preco: 240000, artigo: 'a', pesoUsado: 1.5, forma: 'suv', usoMensal: 950, mercados: BR, epoca: [1995, 2011] },
  { id: 'ep_toyota_hilux_90', classe: 'carro_suv_grande', marca: 'Toyota', modelo: 'Hilux', acabamento: 'SR5 cabine dupla', dica: 'picape média 4x4', faixa: 'alta', preco: 260000, artigo: 'a', pesoUsado: 1.5, forma: 'picape', usoMensal: 800, mercados: BR, epoca: [1992, 2004] },
  { id: 'ep_ford_ranger_98', classe: 'carro_suv_grande', marca: 'Ford', modelo: 'Ranger', acabamento: 'XLT cabine dupla', dica: 'picape média', faixa: 'alta', preco: 230000, artigo: 'a', pesoUsado: 1.5, forma: 'picape', usoMensal: 800, mercados: BR, epoca: [1998, 2011] },
  { id: 'ep_honda_cbx750', classe: 'moto_grande', marca: 'Honda', modelo: 'CBX 750F', acabamento: '"Sete Galo"', dica: 'moto 750 cc nacional', faixa: 'alta', preco: 90000, artigo: 'a', pesoUsado: 1, usoMensal: 400, forma: 'street', mercados: BR, epoca: [1986, 1994] },
  { id: 'ep_harley_fatboy_90', classe: 'moto_grande', marca: 'Harley-Davidson', modelo: 'Fat Boy', acabamento: 'Evolution', dica: 'custom importada', faixa: 'alta', preco: 140000, artigo: 'a', pesoUsado: 0.5, usoMensal: 450, forma: 'cruiser', mercados: BR, epoca: [1993, 2006] },
  { id: 'ep_caloi_10', classe: 'bike', marca: 'Caloi', modelo: '10', acabamento: 'dez marchas', dica: 'bicicleta de estrada', faixa: 'economica', preco: 2200, artigo: 'a', pesoUsado: 2, forma: 'estrada', mercados: BR, epoca: [1972, 1992] },
  { id: 'ep_monark_barra_circular', classe: 'bike', marca: 'Monark', modelo: 'Barra Circular', dica: 'bicicleta de passeio', faixa: 'economica', preco: 1400, artigo: 'a', pesoUsado: 3, forma: 'urbana', mercados: BR, epoca: [1970, 2004] },
  { id: 'ep_honda_cb300r', classe: 'moto_media', marca: 'Honda', modelo: 'CB 300R', dica: 'moto 300 cc', faixa: 'intermediaria', preco: 25000, artigo: 'a', pesoUsado: 2, usoMensal: 260, forma: 'street', mercados: BR, epoca: [2009, 2015] }
];

/** As versões atuais do catálogo nas classes cobertas: o ano em que chegaram (vida histórica antes disso: fora). */
export const ATUAIS_DESDE: Readonly<Record<string, number>> = {
  // ERAS MODERNAS (auditoria): modelos de hoje vendidos no Brasil antes de 2026 que não têm versão da época acima — sem a
  // data, sumiam do mercado das vidas de 2010–2025 e apareciam todos de uma vez em 2026. Ano de chegada ao Brasil (APROXIMAÇÃO
  // pela geração quando ela mudou o carro). Os que têm versão da época (Onix, HB20, Corolla, Renegade) seguem por ela até 2025.
  vw_polo: 2017, chevrolet_onix_plus: 2019, honda_city: 2021, vw_virtus: 2018, honda_civic: 2023, vw_nivus: 2020, hyundai_creta: 2017,
  chevrolet_tracker: 2020, toyota_corolla_cross: 2021, jeep_compass: 2016, hyundai_tucson: 2022, toyota_yaris: 2018, kia_picanto: 2017,
  nissan_versa: 2020, honda_pcx: 2013, honda_cb500f: 2013, kawasaki_ninja400: 2018, yamaha_nmax: 2016, honda_xre190: 2016, yamaha_lander: 2006,
  royal_enfield_interceptor: 2019, royal_enfield_himalayan: 2024, vespa_primavera: 2019, haojue_dk150: 2018, vw_golf_gti: 2013, honda_civic_type_r: 2023,
  fiat_mobi: 2016, renault_kwid: 2017, fiat_argo: 2017, citroen_c3: 2012, honda_biz: 1998, honda_pop: 2015, honda_cg160: 2015,
  yamaha_factor: 2016, honda_bros: 2015, yamaha_fazer: 2018, honda_cb300f: 2023, royal_enfield_hunter: 2023, honda_sahara: 2024, yamaha_mt03: 2016,
  // ERAS v2: a geração ATUAL de cada modelo das outras classes (lançamento da geração; chegada ao Brasil quando conhecida).
  // APROXIMAÇÃO: o ano da geração vendida hoje — antes dele, o modelo existia em outra forma (as versões da época acima).
  bmw_320i: 2019, mercedes_c300: 2022, volvo_xc60: 2017, porsche_macan: 2014, ford_mustang: 2018, porsche_911: 2019, jeep_commander: 2021,
  chevrolet_s10: 2012, toyota_hilux: 2016, toyota_sw4: 2016, caloi_andes: 2015, caloi_vulcan: 2015, oggi_hacker: 2012, sense_fun: 2016, caloi_strada: 2015,
  seadoo_spark: 2014, yamaha_vx: 2015, focker_242: 2010, schaefer_303: 2010, inpaer_excel: 2005, paradise_p1: 2001, piper_seneca: 1997,
  azimut_60: 2016, schaefer_v66: 2018, robinson_r44: 1993, bell_505: 2017, embraer_phenom100: 2017, cessna_citation_m2: 2013, trek_marlin: 2015,
  giant_escape: 2015, rockrider_st100: 2018, triumph_bonneville: 2016, bmw_r1300gs: 2024, harley_street_glide: 2014, ducati_panigale: 2018,
  ford_f150: 2023, chevrolet_tahoe: 2021, ford_ranger: 2024, toyota_land_cruiser: 2022, porsche_911_turbo: 2020, ferrari_roma: 2020,
  mclaren_artura: 2022, lamborghini_huracan: 2019, mclaren_765lt: 2020, bentley_continental: 2018, maybach_s680: 2021, rolls_ghost: 2020,
  rolls_cullinan: 2018, kawasaki_z900: 2017, yamaha_mt09: 2015, triumph_street_triple: 2017, honda_africa_twin: 2020, ducati_multistrada: 2021,
  harley_fat_boy: 2018, indian_scout: 2015, bmw_s1000rr: 2019, honda_fireblade: 2020, ducati_superleggera: 2020, toyota_supra: 2019,
  chevrolet_corvette: 2020, porsche_718_cayman: 2016, bmw_m4: 2021, porsche_taycan: 2020, porsche_cayenne: 2018, bmw_x5: 2019, mercedes_s500: 2021,
  range_rover: 2022, mercedes_g63: 2018, cadillac_escalade: 2021, ferrari_296: 2022, ferrari_purosangue: 2023, lamborghini_urus: 2024,
  lamborghini_revuelto: 2024, aston_db12: 2023, mercedes_amg_gt: 2024, porsche_911_dakar: 2023, porsche_911_st: 2024, lamborghini_sterrato: 2023,
  ferrari_sf90_xx: 2024, bentley_bentayga: 2016, rolls_spectre: 2024, rolls_phantom: 2018, bentley_bacalar: 2021, fiat_strada: 2020,
  vw_saveiro: 2010, fiat_toro: 2016, fiat_fiorino: 2014, renault_master: 2013, mb_sprinter: 2019, suzuki_jimny: 2019, ford_bronco_sport: 2021,
  jeep_wrangler: 2018, lr_defender: 2020, ram_1500_bighorn: 2020, ram_1500_laramie: 2020, ram_2500: 2018, silverado: 2023, ranger_raptor: 2024,
  hilux_grs: 2023, f150_raptor: 2024, rimac_nevera: 2022, pagani_utopia: 2023, koenigsegg_jesko: 2022, am_valkyrie: 2022, bugatti_chiron_ss: 2021,
  rali_r5: 2015, stock_car: 2020, porsche_gt3r: 2019, f1_monoposto: 2022,
  vela_2: 2018, caloi_evibe: 2016, sense_impulse: 2019, rad_city: 2018, gazelle_ultimate: 2018
};

const COBERTAS = new Set(['carro_compacto', 'carro_sedan', 'carro_suv', 'moto_pequena', 'moto_media']);
/** A importação de veículos novos ficou proibida de 1976 até a abertura de 1990 (Collor): os importados de luxo não existem antes. */
const IMPORTADOS = new Set(['carro_luxo', 'carro_suv_grande', 'superesportivo', 'hiperluxo', 'moto_grande']);
export const IMPORTACAO_LIBERADA = 1990;

/**
 * O catálogo de uma vida histórica no ano: nas classes cobertas, o que se vendia; nas outras, o de sempre; os clássicos,
 * só os que já tinham pelo menos 20 anos. Depois de 2025: o catálogo atual.
 */
export function versoesDoAno(atuais: VersaoVeiculo[], ano: number): VersaoVeiculo[] {
  if (ano > 2025) return atuais;
  const daEpoca = VERSOES_DA_EPOCA.filter(x => x.epoca[0] <= ano && ano <= x.epoca[1]);
  const out = atuais.filter(x => {
    if (x.ano !== undefined) return x.ano <= ano - 20;
    if (IMPORTADOS.has(x.classe) && ano < IMPORTACAO_LIBERADA) return false;
    const d = ATUAIS_DESDE[x.id];
    if (!COBERTAS.has(x.classe)) return d === undefined || ano >= d;
    return d !== undefined && ano >= d;
  });
  return [...out, ...daEpoca];
}
