/**
 * VIDA 36 · AMPLIAÇÃO DO CATÁLOGO DE CARROS E MOTOS. Modelos reais (marca e nome de linha conhecidos), cada um numa classe
 * que já existe em `VEICULOS` e com uma forma de desenho que já existe — nenhum modelo ganha um desenho novo. Os preços
 * seguem a escala do catálogo (zero quilômetro, cidade de custo 1,0). Nada repete um modelo que já estava em `bens.ts`.
 */
import type { VersaoVeiculo } from './bens';

export const VERSOES_36: readonly VersaoVeiculo[] = [
  // Carros populares e compactos (os que já existiam em outros catálogos ficam de fora)
  { id: 'peugeot_208', classe: 'carro_compacto', marca: 'Peugeot', modelo: '208', dica: 'hatch compacto', faixa: 'intermediaria', preco: 120000, artigo: 'o', pesoUsado: 2, forma: 'hatch' },
  { id: 'byd_dolphin', classe: 'carro_compacto', marca: 'BYD', modelo: 'Dolphin', dica: 'hatch elétrico compacto', faixa: 'intermediaria', preco: 135000, artigo: 'o', pesoUsado: 0.5, forma: 'hatch' },
  // Sedãs médios
  { id: 'chevrolet_cruze', classe: 'carro_sedan', marca: 'Chevrolet', modelo: 'Cruze', dica: 'sedã médio', faixa: 'intermediaria', preco: 150000, artigo: 'o', pesoUsado: 1.5, forma: 'seda' },
  { id: 'vw_jetta', classe: 'carro_sedan', marca: 'Volkswagen', modelo: 'Jetta', dica: 'sedã médio', faixa: 'alta', preco: 200000, artigo: 'o', pesoUsado: 1.5, forma: 'seda' },
  { id: 'audi_a3_sedan', classe: 'carro_sedan', marca: 'Audi', modelo: 'A3 Sedan', dica: 'sedã compacto de luxo', faixa: 'alta', preco: 230000, artigo: 'o', pesoUsado: 1, forma: 'seda' },
  { id: 'mercedes_classe_c', classe: 'carro_sedan', marca: 'Mercedes-Benz', modelo: 'Classe C', dica: 'sedã médio de luxo', faixa: 'alta', preco: 310000, artigo: 'a', pesoUsado: 1, forma: 'seda' },
  { id: 'subaru_wrx', classe: 'carro_sedan', marca: 'Subaru', modelo: 'WRX', dica: 'sedã esportivo', faixa: 'alta', preco: 215000, artigo: 'o', pesoUsado: 0.8, forma: 'esportivo' },
  // SUVs
  { id: 'bmw_x3', classe: 'carro_suv', marca: 'BMW', modelo: 'X3', dica: 'SUV médio', faixa: 'alta', preco: 340000, artigo: 'o', pesoUsado: 1.5, forma: 'suv_medio' },
  // Picapes
  // Motos
  { id: 'honda_cb650r', classe: 'moto_media', marca: 'Honda', modelo: 'CB 650R', dica: 'moto 650 cc naked', faixa: 'alta', preco: 62000, artigo: 'a', pesoUsado: 0.8, usoMensal: 340, forma: 'street' },
  { id: 'kawasaki_ninja650', classe: 'moto_media', marca: 'Kawasaki', modelo: 'Ninja 650', dica: 'moto 650 cc esportiva', faixa: 'alta', preco: 58000, artigo: 'a', pesoUsado: 0.7, usoMensal: 340, forma: 'street' },
  { id: 'yamaha_r3', classe: 'moto_media', marca: 'Yamaha', modelo: 'YZF-R3', dica: 'moto 321 cc esportiva', faixa: 'intermediaria', preco: 36000, artigo: 'a', pesoUsado: 0.8, usoMensal: 260, forma: 'street' },
  { id: 'ktm_390_duke', classe: 'moto_media', marca: 'KTM', modelo: '390 Duke', dica: 'moto 390 cc naked', faixa: 'intermediaria', preco: 42000, artigo: 'a', pesoUsado: 0.6, usoMensal: 280, forma: 'street' },
  { id: 'yamaha_tenere700', classe: 'moto_media', marca: 'Yamaha', modelo: 'Ténéré 700', dica: 'moto 689 cc de aventura', faixa: 'alta', preco: 62000, artigo: 'a', pesoUsado: 0.5, usoMensal: 340, forma: 'trail' },
  { id: 'royal_enfield_classic350', classe: 'moto_media', marca: 'Royal Enfield', modelo: 'Classic 350', dica: 'moto 350 cc clássica', faixa: 'intermediaria', preco: 32000, artigo: 'a', pesoUsado: 0.8, usoMensal: 240, forma: 'cruiser' },
  { id: 'dafra_next250', classe: 'moto_pequena', marca: 'Dafra', modelo: 'Next 250', dica: 'moto 250 cc urbana', faixa: 'economica', preco: 19000, artigo: 'a', pesoUsado: 0.8, forma: 'street' },
  { id: 'suzuki_gsxs750', classe: 'moto_grande', marca: 'Suzuki', modelo: 'GSX-S750', dica: 'moto 750 cc naked', faixa: 'alta', preco: 70000, artigo: 'a', pesoUsado: 0.5, forma: 'street' },
  { id: 'harley_sportster_s', classe: 'moto_grande', marca: 'Harley-Davidson', modelo: 'Sportster S', dica: 'moto 1250 cc custom', faixa: 'alta', preco: 120000, artigo: 'a', pesoUsado: 0.4, forma: 'cruiser' },
  { id: 'honda_goldwing', classe: 'moto_grande', marca: 'Honda', modelo: 'Gold Wing', dica: 'moto 1800 cc de turismo', faixa: 'alta', preco: 260000, artigo: 'a', pesoUsado: 0.3, forma: 'street' },
];
