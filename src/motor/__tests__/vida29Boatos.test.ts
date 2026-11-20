/** VIDA 29 · as notícias da vida circulam: por proximidade, relevância, época e jeito; a versão aumentada; quem não devia saber. */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, comParente } from './cenarios';
import { escrever } from '../nucleo';
import { oQueSabeDeVoce29, processarBoatos29, tipoDaNoticia29, velocidadeDaEpoca29, esclarecer29 } from '../sistemas/boatos29';
import type { Vida } from '../tipos';

function base(): { v: Vida; mae: string; tia: string; par: string } {
  const v = structuredClone(adulto(35, { semente: 29 }));
  for (const id of Object.keys(v.vinculos)) delete v.vinculos[id];
  const par = comParceiro(v, { estagio: 'casamento', anos: 5 }).p.id;
  const mae = comParente(v, 'mae', 62, 'feminino', 80).p.id;
  const tia = comParente(v, 'tio', 58, 'feminino', 50).p.id;
  return { v, mae, tia, par };
}

describe('VIDA 29 · boatos', () => {
  it('classifica o que é notícia (e o que não é)', () => {
    expect(tipoDaNoticia29({ texto: 'Foi demitido da empresa depois de oito anos.', tema: 'trabalho', relevancia: 'biografia' })).toBe('demissao');
    expect(tipoDaNoticia29({ texto: 'Foi preso em flagrante.', tema: 'escolha', relevancia: 'marco' })).toBe('prisao');
    expect(tipoDaNoticia29({ texto: 'Almoçou com a família.', tema: 'familia', relevancia: 'cotidiano' })).toBeUndefined();
    expect(velocidadeDaEpoca29(1930)).toBeLessThan(velocidadeDaEpoca29(2015));
  });

  it('a notícia grande anda da parceria para a família; cada um sabe por quem soube', () => {
    const { v, mae, tia, par } = base();
    v.fatos['boatos29_lido'] = v.t - 1;
    escrever(v, { texto: 'Foi demitido da empresa depois de oito anos.', relevancia: 'biografia', tema: 'trabalho', pessoas: [par] });
    for (let k = 0; k < 4; k++) { processarBoatos29(v); v.t += 12; }
    expect(oQueSabeDeVoce29(v, par)[0].via).toBe('por você');
    const daMae = oQueSabeDeVoce29(v, mae);
    const daTia = oQueSabeDeVoce29(v, tia);
    expect(daMae.length + daTia.length).toBeGreaterThan(0);
    for (const x of [...daMae, ...daTia]) expect(x.texto).toMatch(/demitido/);
  });

  it('quem não devia saber (a traição, para a parceria) e soube por outros reage como enganado', () => {
    const { v, mae, par } = base();
    v.fatos['boatos29_lido'] = v.t - 1;
    v.vinculos[mae].convivio = ['casa'];
    const antes = v.vinculos[par].confianca;
    escrever(v, { texto: 'A traição veio à tona.', relevancia: 'marco', tema: 'amor', pessoas: [mae], evento: { tipo: 'traicao_descoberta' } as never });
    let soube = false;
    for (let k = 0; k < 6 && !soube; k++) { processarBoatos29(v); soube = oQueSabeDeVoce29(v, par).length > 0; v.t += 12; }
    expect(soube).toBe(true);
    expect(v.vinculos[par].confianca).toBeLessThan(antes);
    expect(v.vinculos[par].historia.some(h => h.tipo === 'traicao' && /não por você/.test(h.texto))).toBe(true);
  });

  it('esclarecer desfaz a versão aumentada', () => {
    const { v, mae } = base();
    v.boatos29 = [{ id: 'x', t: v.t, tipo: 'divida', texto: 'ficou com o nome sujo', peso: 2, sabem: { [mae]: { t: v.t, via: 'tia', torto: true } } }];
    expect(oQueSabeDeVoce29(v, mae)[0].torto).toBe(true);
    expect(esclarecer29(v, mae)).toBe(true);
    expect(oQueSabeDeVoce29(v, mae)[0].torto).toBe(false);
  });
});
