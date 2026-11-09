/** VIDA 14 · as cidades novas (Igarassu entre elas): no mapa, sem duplicar, com o custo e as vocações que dão contexto e nunca fecham porta. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { cidadesDoPais, cidadesNoMapa, economiaLocal, municipio, nivelDeOferta, codigoDoMunicipio, municipioDoCodigo } from '../dados/lugares';
import { MUNICIPIOS_14, VOCACOES_14, idDoMunicipio14, vocacaoDaVaga14 } from '../dados14/cidades/municipios14';
import { OCUPACOES, ocupacao } from '../dados/ocupacoes';
import { disponibilidade } from '../acoes';
import { interpretar } from '../save';

describe('VIDA 14 · cidades', () => {
  it('Igarassu (PE) está no mapa, na Região Metropolitana do Recife', () => {
    const m = municipio('igarassu-pe');
    expect(m).toMatchObject({ nome: 'Igarassu', uf: 'PE', perfil: 'metropolitana', metropole: 'recife-pe' });
    expect(cidadesNoMapa('BR').some(x => x.id === 'igarassu-pe')).toBe(true);
    expect(municipioDoCodigo(codigoDoMunicipio('igarassu-pe'))).toBe('igarassu-pe');
  });
  it('sem duplicar: nenhum id repetido no mapa, e os sorteios de sempre não mudaram', () => {
    const ids = cidadesNoMapa('BR').map(x => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of MUNICIPIOS_14) expect(ids.filter(x => x === idDoMunicipio14(c)).length, c.nome).toBe(1);
    expect(cidadesDoPais('BR').some(x => x.id === 'igarassu-pe')).toBe(false);
  });
  it('as ocupações das vocações existem; o custo e o salário saem do ajuste da cidade', () => {
    for (const v of Object.values(VOCACOES_14)) for (const id of v.ocupacoes) expect(OCUPACOES.some(o => o.id === id), id).toBe(true);
    const ig = economiaLocal('igarassu-pe');
    expect(ig.custo).toBeGreaterThan(0);
    expect(ig.aluguel).toBeGreaterThan(0);
  });
  it('a vocação ajuda e a cidade pequena não fecha porta (a vaga rara é difícil, não proibida)', () => {
    const v = structuredClone(adulto(25, { municipioId: 'igarassu-pe' }));
    v.moradia.municipioId = 'igarassu-pe';
    const pesca = MUNICIPIOS_14.find(c => c.vocacoes.includes('industria'))!;
    expect(vocacaoDaVaga14(idDoMunicipio14(pesca), VOCACOES_14.industria.ocupacoes[0])).toBe('industria');
    const pequena = MUNICIPIOS_14.find(c => c.perfil === 'pequena')!;
    v.moradia.municipioId = idDoMunicipio14(pequena);
    const rara = OCUPACOES.find(o => o.oferta > nivelDeOferta(v.moradia.municipioId) && !o.experiencia && !o.area && !o.concurso && !o.licenca && !o.veiculo && !o.forma);
    if (rara) {
      const d = disponibilidade(v, { tipo: 'candidatar', ocupacaoId: rara.id } as never);
      expect(['requisito', 'impossivel', 'ilegal']).not.toContain(d.grau);
    }
    void ocupacao;
  });
  it('um save numa cidade nova volta inteiro', () => {
    const v = structuredClone(adulto(20, { municipioId: 'igarassu-pe' }));
    const l = interpretar(JSON.stringify(v));
    expect(l.tipo === 'ok' && l.vida.moradia.municipioId).toBe('igarassu-pe');
  });
});
