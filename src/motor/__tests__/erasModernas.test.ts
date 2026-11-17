/**
 * ERAS MODERNAS (auditoria das décadas 1990–2020 e da virada para depois de 2025): o mercado de veículos sem buraco na
 * virada, a tecnologia de hoje para todos depois da série, as brincadeiras do aparelho antes do smartphone, os marcos da
 * infância na escolha da época e o nome da rede no ano.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { versoesDoAno } from '../eras/base/veiculos';
import { tecnologia } from '../eras/base/contexto';
import { textoDaEpoca } from '../eras/base/anacronismos';
import { VERSOES_VEICULO } from '../dados/bens';
import { marcosDaInfancia } from '../../ui/eras/EscolhaDaEpoca';
import { nomeDaRedeNaEpoca } from '../../ui/eras/epoca';
import { DECADAS } from '../eras/dados/culturaBR';

beforeAll(async () => { await carregarMundo(); });

const historica = (ano: number) => nova({ semente: 4242, municipioId: 'sao-paulo-sp', ano, era: true });

describe('ERAS MODERNAS', () => {
  it('o mercado de veículos de 2016–2025 tem os modelos atuais que já se vendiam, e não dá salto em 2026', () => {
    const ids = (ano: number) => new Set(versoesDoAno(VERSOES_VEICULO as never, ano).map(x => x.id));
    const em2022 = ids(2022);
    for (const id of ['vw_polo', 'jeep_compass', 'hyundai_creta', 'chevrolet_tracker', 'toyota_corolla_cross', 'honda_pcx', 'yamaha_nmax']) expect(em2022.has(id), id).toBe(true);
    expect(ids(2015).has('toyota_corolla_cross')).toBe(false);
    const n2025 = ids(2025).size, n2026 = ids(2026).size;
    expect(Math.abs(n2026 - n2025) / n2026).toBeLessThan(0.25);
  });

  it('depois de 2025, a vida histórica tem a tecnologia de hoje como a contemporânea (sem renda mínima para sempre)', () => {
    const v = historica(2005);
    v.origem.classe = 'vulneravel'; v.moradia.tipo = 'pais';
    v.t = 2023 * 12 + 3;
    expect(tecnologia(v, 'tablet')).not.toBe('comum');
    v.t = 2030 * 12 + 3;
    for (const id of ['tablet', 'videogame_atual', 'ia_conversa', 'smartphone']) expect(tecnologia(v, id), id).toBe('comum');
    expect(tecnologia(v, 'orelhao')).toBe('indisponivel');
  });

  it('antes do smartphone, o recado de amigo não fala de vídeo, meme ou foto de perfil', () => {
    const v = historica(1992);
    v.t = 2007 * 12 + 7; v.moradia.tipo = 'pais';
    const t = textoDaEpoca(v, '"OLHA ESSE VÍDEO E ME DIZ QUE NÃO É VOCÊ 😂😂😂" "Mandei esse meme pra você e pra mais ninguém."');
    expect(t).not.toMatch(/VÍDEO|meme|😂/);
    const w = historica(2005); w.t = 2024 * 12;
    expect(textoDaEpoca(w, '"OLHA ESSE VÍDEO E ME DIZ QUE NÃO É VOCÊ"')).toContain('VÍDEO');
  });

  it('os marcos da infância nunca são de antes do nascimento, e quem nasce no fim da década vê os anos seguintes', () => {
    for (const d of DECADAS) for (let ano = d.anos[0]; ano <= d.anos[1]; ano++) {
      const m = marcosDaInfancia(d.marcos, ano);
      for (const a of m) expect(a.data[0], `${ano}: ${a.id}`).toBeGreaterThanOrEqual(ano);
      expect(m.length).toBeLessThanOrEqual(4);
    }
    expect(marcosDaInfancia(DECADAS.find(d => d.decada === 2000)!.marcos, 2009).length).toBeGreaterThan(0);
  });

  it('o X se chama Twitter numa vida histórica antes de julho de 2023; depois, e na vida contemporânea, X', () => {
    const v = historica(2005);
    v.t = 2021 * 12; expect(nomeDaRedeNaEpoca(v, 'x', 'X')).toBe('Twitter');
    v.t = 2024 * 12; expect(nomeDaRedeNaEpoca(v, 'x', 'X')).toBe('X');
    expect(nomeDaRedeNaEpoca(v, 'instagram', 'Instagram')).toBe('Instagram');
    const hoje = nova({ semente: 1 });
    expect(nomeDaRedeNaEpoca(hoje, 'x', 'X')).toBe('X');
  });
});
