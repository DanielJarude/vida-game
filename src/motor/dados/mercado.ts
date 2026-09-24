/**
 * Mercado local: o quanto um setor é forte num lugar e numa época.
 *
 * Não é estatística oficial; é um parâmetro de plausibilidade. O agro manda
 * no interior do Centro-Oeste, do Sul e do Norte; a indústria, nas cidades
 * médias do Sul e do Sudeste (e em Manaus, com a Zona Franca); tecnologia,
 * criação e comunicação, nas metrópoles; o serviço público, nas capitais.
 * Uma cidade pequena não oferece o mesmo que uma metrópole — mas oferece
 * outras coisas.
 *
 * Época: o jogo começa em 2026 e as vidas vão até o fim do século. Algumas
 * funções encolhem (caixa de supermercado com o autoatendimento; operação de
 * linha com a automação), outras surgem ou crescem (energia solar, dados).
 * O trabalho remoto, com o tempo, abre um pouco de tecnologia fora das
 * metrópoles.
 */

import type { Setor } from './ocupacoes';
import { municipio } from './lugares';

export function forcaDoSetor(municipioId: string, setor: Setor, ano: number): number {
  const m = municipio(municipioId);
  const p = m.perfil;
  const grande = p === 'metropole' || p === 'metropolitana';
  switch (setor) {
    case 'agro': {
      const interior = p === 'pequena' || p === 'polo';
      const regiao = m.regiao === 'Centro-Oeste' || m.regiao === 'Sul' || m.regiao === 'Norte' ? 1.2 : m.regiao === 'Nordeste' ? 1 : 0.9;
      return (interior ? 1.35 : grande ? 0.45 : 0.8) * regiao;
    }
    case 'industria': {
      const regiao = m.regiao === 'Sul' || m.regiao === 'Sudeste' ? 1.25 : m.id === 'manaus-am' ? 1.3 : 0.75;
      return (p === 'polo' || p === 'metropolitana' ? 1.25 : p === 'metropole' ? 1 : p === 'capital' ? 0.85 : 0.6) * regiao;
    }
    case 'tecnologia': {
      const remoto = ano >= 2040 ? 0.25 : 0;
      return grande ? 1.4 : p === 'capital' ? 1.05 : p === 'polo' ? 0.75 + remoto : 0.4 + remoto;
    }
    case 'criativo': case 'comunicacao':
      return grande ? 1.35 : p === 'capital' ? 1.05 : p === 'polo' ? 0.8 : 0.55;
    case 'publico':
      return m.capital ? 1.3 : p === 'polo' ? 1 : 0.85;
    case 'financas': case 'juridico':
      return grande ? 1.25 : p === 'capital' ? 1.1 : p === 'polo' ? 0.9 : 0.7;
    case 'engenharia': case 'logistica':
      return grande || p === 'polo' ? 1.15 : p === 'capital' ? 1 : 0.7;
    case 'esporte':
      return grande ? 1.3 : p === 'capital' ? 1.1 : p === 'polo' ? 0.9 : 0.6;
    case 'saude': case 'educacao': case 'comercio': case 'alimentacao': case 'beleza': case 'cuidado':
    case 'manutencao': case 'construcao': case 'transporte': case 'seguranca': case 'administrativo':
      return 1;
  }
}

/** A função está encolhendo nesta época? (0..1: quanto sobrou da oferta.) */
export function sobraNaEpoca(declinio: number | undefined, ano: number): number {
  if (!declinio || ano < declinio) return 1;
  return Math.max(0.25, 1 - (ano - declinio) / 30);
}

/** Clubes e estruturas esportivas acessíveis a partir de um lugar (0 nenhum .. 3 muitos). */
export function estruturaEsportiva(municipioId: string): number {
  const p = municipio(municipioId).perfil;
  return p === 'metropole' ? 3 : p === 'metropolitana' || p === 'capital' ? 2 : p === 'polo' ? 1 : 0;
}
