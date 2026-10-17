/**
 * REWORK 8 (Fase B) — o desenho de um veículo: a FORMA (a família, do catálogo) + o MODELO (`versaoId`, os números
 * próprios dele) + a COR do anúncio ou do bem + o ESTADO (o zero com brilho, o usado com riscos, o cansado com
 * ferrugem). Tudo derivado do que o jogo já guarda: nada vai para o save.
 */
import type { ReactElement } from 'react';
import type { FormaVeiculo } from '../../motor/dados/bens';
import { Ilustracao, lembrar, valida, type Amostra } from './nucleo';
import { carro, perfilDoCarro, FAMILIAS } from './carros';
import { bicicleta, moto } from './duasRodas';
import { aviao, barco } from './aguaEAr';

const MOTOS = new Set(['cub', 'scooter', 'street', 'esportiva', 'cruiser', 'trail']);
const BIKES = new Set(['urbana', 'estrada', 'mtb', 'eletrica']);
const BARCOS = new Set(['jetski', 'lancha', 'veleiro']);
const AVIOES = new Set(['ultraleve', 'monomotor', 'asa_baixa', 'bimotor', 'jato']);

/** A cor de quem não tem cor (um desenho sem anúncio): prata, a cor mais comum de carro. */
const PRATA = '#a9adb2';

const DESENHADOS = lembrar<Amostra>();
/** O desgaste só muda o desenho por faixa (zero com brilho, usado, cansado): a faixa entra na chave, não o número. */
const faixa = (e?: number) => (e === undefined ? '' : e >= 90 ? 'z' : e >= 60 ? 'b' : e >= 40 ? 'u' : 'c');
export function amostraDoVeiculo(forma: FormaVeiculo, cor?: string, versaoId?: string, semente?: string, estado?: number): Amostra {
  return DESENHADOS(`${forma}|${cor}|${versaoId}|${semente}|${faixa(estado)}`, () => desenharVeiculo(forma, cor, versaoId, semente, estado));
}
function desenharVeiculo(forma: FormaVeiculo, cor?: string, versaoId?: string, semente?: string, estado?: number): Amostra {
  const c = valida(cor, PRATA);
  if (forma in FAMILIAS) return carro(perfilDoCarro(forma as keyof typeof FAMILIAS, versaoId, semente ?? versaoId), c, estado);
  if (MOTOS.has(forma)) return moto(forma as Parameters<typeof moto>[0], c, versaoId);
  if (BIKES.has(forma)) return bicicleta(forma as Parameters<typeof bicicleta>[0], c, versaoId);
  if (BARCOS.has(forma)) return barco(forma as Parameters<typeof barco>[0], c, versaoId);
  if (AVIOES.has(forma)) return aviao(forma as Parameters<typeof aviao>[0], c);
  return carro(perfilDoCarro('hatch', undefined, semente), c, estado);
}

export interface PropsVeiculo { forma: FormaVeiculo; rotulo?: string; largura?: number; semente?: string; versaoId?: string; cor?: string; estado?: number; className?: string; style?: Record<string, string | number> }

export function IlustracaoVeiculo({ forma, rotulo, largura = 48, semente, versaoId, cor, estado, className, style }: PropsVeiculo): ReactElement {
  return (
    <Ilustracao a={amostraDoVeiculo(forma, cor, versaoId, semente, estado)} largura={largura} rotulo={rotulo} className={className} style={style}
      dados={{ 'data-forma': forma, ...(versaoId ? { 'data-modelo': versaoId } : {}), ...(estado !== undefined && estado < 60 ? { 'data-desgaste': estado < 40 ? 'cansado' : 'usado' } : {}) }} />
  );
}
