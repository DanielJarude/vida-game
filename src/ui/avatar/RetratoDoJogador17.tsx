/** VIDA 17: o retrato do jogador com as tatuagens do rosto (o mesmo `Retrato`, com a camada da pele do rosto). */
import type { ComponentProps, ReactElement } from 'react';
import type { Vida } from '../../motor/tipos';
import { tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import { Retrato } from './Retrato';
import { TatuagensDoRosto } from './tatuagensNaPele';
import { ehDoRosto } from './rosto17';

export function RetratoDoJogador17({ vida, ...props }: { vida: Vida } & Omit<ComponentProps<typeof Retrato>, 'camadaDoRosto'>) {
  const rosto = (vida.eu.tatuagens ?? []).length ? tatuagensNaFigura(vida).filter(t => ehDoRosto(t.regiao)) : [];
  return <Retrato {...props} camadaDoRosto={rosto.length ? (g, pele, ro, uid) => <TatuagensDoRosto lista={rosto} g={g} pele={pele} rosto={ro} uid={uid} /> as ReactElement : undefined} />;
}
