/** VIDA 29 · o alerta de ciúme no namoro só com motivo registrado (antes: a tensão herdada disparava logo no começo). */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro } from './cenarios';
import { motivoDeCiume } from '../sistemas/relacoes28';

describe('VIDA 29 · motivo de ciúme', () => {
  const montar = () => {
    const v = structuredClone(adulto(28, { semente: 4 }));
    const { p, vin } = comParceiro(v, { estagio: 'namoro', anos: 0 });
    vin.fases = [{ fase: 'namoro', t: v.t }];
    vin.romance!.tInicio = v.t; vin.romance!.tEstagio = v.t;
    return { v, p, vin };
  };
  it('namoro novo, sem nada: nenhum motivo — nem com tensão alta herdada, nem com parceria ciumenta', () => {
    const { v, p, vin } = montar();
    vin.tensao = 60;
    expect(motivoDeCiume(v, p, vin, () => true)).toBeUndefined();
  });
  it('o caso escondido é motivo desde já; o perfil público no app de namoro também', () => {
    const { v, p, vin } = montar();
    vin.romance!.segredo = true as never;
    expect(motivoDeCiume(v, p, vin, () => false)).toBe('segredo');
    const b = montar();
    b.v.fatos['app16_publico'] = b.v.t;
    expect(motivoDeCiume(b.v, b.p, b.vin, () => false)).toBe('aplicativo');
  });
  it('o jeito ciumento pesa depois de seis meses; a tensão alta, depois de um ano', () => {
    const { v, p, vin } = montar();
    v.t += 7;
    expect(motivoDeCiume(v, p, vin, () => true)).toBe('jeito');
    expect(motivoDeCiume(v, p, vin, () => false)).toBeUndefined();
    v.t += 6; vin.tensao = 40;
    expect(motivoDeCiume(v, p, vin, () => false)).toBe('tensao');
  });
});
