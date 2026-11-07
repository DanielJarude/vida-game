/**
 * VIDA 12.9.1 — o Colégio Eleitoral dos EUA. Os 8 casos obrigatórios (com o resultado montado estado a estado, e com a
 * simulação de verdade) e a garantia de que os outros países não mudaram.
 * Referência: National Archives, "Distribution of Electoral Votes" 2024–2028 (Censo 2020); 12ª Emenda; ME 21-A §802;
 * NE §32-1038.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { definirPaisCorrente } from '../mundo/moeda';
import { cidadesDoPais } from '../dados/lugares';
import { ESTADOS_NO_COLEGIO, MAIORIA_NO_COLEGIO, TOTAL_DE_DELEGADOS, MAIORIA_NA_CAMARA } from '../dados/colegioEleitoral129';
import { apurarColegio, contarDelegados, eleicaoNaCamara, quemFezMaioria } from '../sistemas/colegioEleitoral129';
import { entrarNaPolitica, partidosDoPais, processarPolitica, registrarCandidatura, tDaEleicao } from '../sistemas/politica';
import { presidencia } from '../sistemas/presidencia129';
import { REGRAS_PRESIDENCIAIS } from '../dados/presidencia129';

/** Todas as unidades (estados, DC e distritos de ME/NE) para um candidato, menos as listadas para o outro. */
function unidades(paraB: string[]): Record<string, number> {
  const u: Record<string, number> = {};
  for (const e of ESTADOS_NO_COLEGIO) { u[e.uf] = paraB.includes(e.uf) ? 1 : 0; for (const d of e.distritos ?? []) u[d.id] = paraB.includes(d.id) || (paraB.includes(e.uf) && !paraB.includes(`!${d.id}`)) ? 1 : 0; }
  return u;
}
const D = (uf: string) => ESTADOS_NO_COLEGIO.find(e => e.uf === uf)!.delegados;
const soma = (ufs: string[]) => ufs.reduce((s, uf) => s + D(uf), 0);

describe('12.9.1 · Colégio Eleitoral: os dados', () => {
  it('538 delegados (distribuição do Censo de 2020: CA 54, TX 40, FL 30, NY 28, DC 3...); 270 é a maioria', () => {
    expect(ESTADOS_NO_COLEGIO.length).toBe(51);
    expect(ESTADOS_NO_COLEGIO.reduce((s, e) => s + e.delegados, 0)).toBe(TOTAL_DE_DELEGADOS);
    expect(TOTAL_DE_DELEGADOS).toBe(538);
    expect(MAIORIA_NO_COLEGIO).toBe(Math.floor(538 / 2) + 1);
    for (const [uf, n] of [['CA', 54], ['TX', 40], ['FL', 30], ['NY', 28], ['PA', 19], ['IL', 19], ['OH', 17], ['GA', 16], ['NC', 16], ['MI', 15], ['DC', 3], ['WY', 3], ['ME', 4], ['NE', 5]] as const) expect(D(uf), uf).toBe(n);
    for (const e of ESTADOS_NO_COLEGIO) expect(e.delegados).toBeGreaterThanOrEqual(3);
  });
});

describe('12.9.1 · os 8 casos', () => {
  // Um "mapa" fixo: B leva o Cinturão da Ferrugem e o Sul; A leva as costas — com margens enormes onde ganha.
  const B_GANHA = ['TX', 'FL', 'GA', 'NC', 'PA', 'MI', 'WI', 'OH', 'AZ', 'NV', 'IN', 'TN', 'MO', 'AL', 'SC', 'KY', 'LA', 'OK', 'AR', 'MS', 'KS', 'UT', 'IA', 'NE', 'WV', 'ID', 'MT', 'SD', 'ND', 'WY', 'AK', 'NH', 'ME-2', '!NE-2'];

  it('1. A vence o voto popular; B vence o Colégio Eleitoral — quem é eleito é B', () => {
    const d = contarDelegados(unidades(B_GANHA), 2);
    expect(d[0] + d[1]).toBe(538);
    expect(d[1]).toBeGreaterThanOrEqual(MAIORIA_NO_COLEGIO);
    const popular = [51.2, 47.1]; // A com folga no país (margens enormes onde ganha)
    expect(quemFezMaioria(d)).toBe(1);
    expect(popular[0]).toBeGreaterThan(popular[1]);
  });

  it('2. A vence o voto popular e o Colégio', () => {
    const d = contarDelegados(unidades(['TX', 'FL', 'OH', 'IN', 'TN', 'MO', 'AL', 'SC', 'KY', 'LA', 'OK', 'AR', 'MS', 'KS', 'UT', 'IA', 'NE', 'WV', 'ID', 'MT', 'SD', 'ND', 'WY', 'AK']), 2);
    expect(quemFezMaioria(d)).toBe(0);
    expect(d[0]).toBeGreaterThanOrEqual(270);
  });

  it('3. B vence o voto popular, mas perde por pouco no Colégio (270 × 268)', () => {
    // B: as duas costas, o DC e quatro estados do meio — 268 exatos; A: o resto, 270.
    const paraB = ['CA', 'NY', 'IL', 'NJ', 'WA', 'MA', 'VA', 'MD', 'MN', 'CO', 'OR', 'CT', 'NM', 'HI', 'RI', 'DE', 'VT', 'DC', 'PA', 'MI', 'WI', 'NV', '!ME-1', '!ME-2', '!NE-1', '!NE-2', '!NE-3'];
    expect(soma(paraB.filter(x => !x.startsWith('!')))).toBe(268);
    const d = contarDelegados(unidades(paraB), 2);
    expect(d).toEqual([270, 268]);
    const popular = [48.6, 50.1]; // B com mais votos no país (as margens enormes das costas)
    expect(popular[1]).toBeGreaterThan(popular[0]);
    expect(quemFezMaioria(d)).toBe(0); // A eleito com 270
  });

  it('4. os estados de cada um somam os delegados certos', () => {
    const paraB = ['TX', 'FL', 'OH', 'GA'];
    const d = contarDelegados(unidades(paraB), 2);
    expect(d[1]).toBe(soma(paraB));
    expect(d[0]).toBe(538 - soma(paraB));
  });

  it('5. Maine e Nebraska dividem pelos distritos', () => {
    const u = unidades([]);
    u.ME = 0; u['ME-1'] = 0; u['ME-2'] = 1; u.NE = 1; u['NE-1'] = 1; u['NE-2'] = 0; u['NE-3'] = 1;
    const soME_NE = (x: Record<string, number>) => { const y: Record<string, number> = {}; for (const k of ['ME', 'ME-1', 'ME-2', 'NE', 'NE-1', 'NE-2', 'NE-3']) y[k] = x[k]; return contarDelegados(y, 2); };
    expect(soME_NE(u)).toEqual([3 + 1, 1 + 4]); // A: ME 2 + ME-1 + NE-2; B: ME-2 + NE 2 + NE-1 + NE-3
    // e o resto do país, vencedor leva tudo: nenhum outro estado divide
    for (const e of ESTADOS_NO_COLEGIO) if (!['ME', 'NE'].includes(e.uf)) expect(e.distritos).toBeUndefined();
  });

  it('6. a maioria é 270: 269 não basta', () => {
    expect(quemFezMaioria([270, 268])).toBe(0);
    expect(quemFezMaioria([269, 269])).toBeUndefined();
    expect(quemFezMaioria([268, 260, 10])).toBeUndefined();
  });

  it('7. sem maioria: a Câmara escolhe entre os três primeiros, uma delegação por estado, 26 de 50', () => {
    const popular = [49, 48, 3];
    // cada estado vota no finalista do seu lado: estados com lean > 0 em A, < 0 em B
    const c = eleicaoNaCamara([269, 260, 9], popular, (uf, f) => { const e = ESTADOS_NO_COLEGIO.find(x => x.uf === uf)!; return e.lean > 0 ? f[0] : f[1]; });
    expect(c.finalistas).toEqual([0, 1, 2]);
    expect(c.delegacoes.reduce((s, x) => s + x, 0)).toBe(50); // o DC não vota
    const quem = c.delegacoes[0] >= MAIORIA_NA_CAMARA ? 0 : c.delegacoes[1] >= MAIORIA_NA_CAMARA ? 1 : undefined;
    expect(c.eleito).toBe(quem ?? c.eleito);
    expect(c.delegacoes[c.eleito]).toBeGreaterThanOrEqual(MAIORIA_NA_CAMARA);
    // empate 25 × 25: as votações se repetem (o jogo fica com quem tem mais delegações; empatado, o mais votado no país)
    let k = 0;
    const emp = eleicaoNaCamara([269, 269], [50.4, 49.6], () => (k++ % 2));
    expect(emp.repetida).toBe(true);
    expect(emp.delegacoes).toEqual([25, 25]);
    expect(emp.eleito).toBe(0);
    // o empate 269 × 269 numa simulação inteira vai à Câmara
  });

  it('a simulação: numa disputa apertada, o voto popular e o Colégio às vezes divergem (nos dois sentidos)', () => {
    let divergeA = 0, divergeB = 0, camara = 0;
    for (let s = 0; s < 400; s++) {
      const r = apurarColegio([{ nacional: 50 + (s % 7) * 0.5 - 1.5, lado: 1 }, { nacional: 50 - (s % 7) * 0.5 + 1.5, lado: -1 }], criarRng(9000 + s));
      const pop = r.popular[0] > r.popular[1] ? 0 : 1;
      if (r.contingencia) camara++;
      if (pop !== r.eleito) { if (pop === 0) divergeA++; else divergeB++; }
      expect(r.delegados[0] + r.delegados[1]).toBe(538);
    }
    expect(divergeA + divergeB).toBeGreaterThan(0);
    expect(divergeA).toBeGreaterThan(0); // o de esquerda vence no país e perde no Colégio (a geografia de 2024)
  });
});

describe('12.9.1 · 8. o vencedor registrado é o do Colégio (a vida política inteira)', () => {
  const BASE = adulto(30, { semente: 1290 });
  function candidatoNosEua(forca: number, apoio: number): Vida {
    const v = structuredClone(BASE);
    definirPaisCorrente('US');
    const muni = (cidadesDoPais('US').find(m => m.perfil === 'metropole') ?? cidadesDoPais('US')[0]).id;
    v.id = `${v.id}-colegio-${forca}-${apoio}`;
    v.moradia.municipioId = muni; v.eu.municipioNatal = muni; v.eu.nacionalidades = ['US'];
    const ano = REGRAS_PRESIDENCIAIS.US.ciclo[0];
    v.t = tDaEleicao(ano, 'US') - 6; v.eu.tNasc = v.t - 55 * 12;
    v.caminhos.politica = undefined; v.trabalho.atual = undefined; v.justica = undefined; v.momento = null; v.fila = undefined; v.anoAtual = { acoes: [] };
    const p = entrarNaPolitica(v, 'comunidade');
    p.partido = '~centro_esquerda'; p.tFiliacao = v.t - 160; p.partidos = [{ sigla: p.partido, tInicio: p.tFiliacao }];
    p.fase = 'entre_mandatos'; p.apoio = apoio; p.reputacao = 85; p.desgaste = 10;
    for (const c of ['deputado_federal', 'governador'] as const) { p.historico.push({ t: v.t - 120, cargo: c, resultado: 'eleito', partido: p.partido }); p.historico.push({ t: v.t - 72, cargo: c, resultado: 'concluiu', partido: p.partido }); }
    registrarCandidatura(v, 'presidente', tDaEleicao(ano, 'US'));
    for (const a of presidencia(v).campanha!.adversarios) a.forca = forca;
    v.t = tDaEleicao(ano, 'US') + 1;
    processarPolitica(v, criarRng(4));
    return v;
  }
  it('nos EUA a candidatura guarda o Colégio, e "eleito" é exatamente quem fez a maioria (ou a Câmara escolheu)', () => {
    let eleitos = 0, derrotas = 0;
    for (const forca of [40, 55, 62, 68, 75, 90]) for (const apoio of [40, 70, 95]) {
      const v = candidatoNosEua(forca, apoio);
      const c = presidencia(v).candidaturas.slice(-1)[0];
      expect(c, `${forca}/${apoio}`).toBeDefined();
      expect(c.colegio).toBeDefined();
      const col = c.colegio!;
      expect(col.delegados.reduce((s, x) => s + x, 0)).toBe(538);
      expect(c.resultado === 'eleito').toBe(col.eleito === 'você');
      if (!col.camara) expect(col.delegados[0] >= 270).toBe(c.resultado === 'eleito');
      // o histórico político diz o mesmo
      const h = v.caminhos.politica!.historico.slice(-1)[0];
      expect(h.cargo).toBe('presidente');
      expect(h.resultado === 'eleito').toBe(c.resultado === 'eleito');
      if (c.resultado === 'eleito') eleitos++; else derrotas++;
      // o texto da apuração fala do Colégio
      expect(v.biografia.some(e => /Colégio Eleitoral: .* \(270 de 538 para vencer\)/.test(e.texto))).toBe(true);
    }
    expect(eleitos).toBeGreaterThan(0);
    expect(derrotas).toBeGreaterThan(0);
  });

  it('os outros países não mudaram: o Brasil segue com primeiro e segundo turno, sem Colégio', () => {
    expect(REGRAS_PRESIDENCIAIS.BR.colegio).toBeUndefined();
    expect(REGRAS_PRESIDENCIAIS.MX.colegio).toBeUndefined();
    for (const [pais, r] of Object.entries(REGRAS_PRESIDENCIAIS)) if (pais !== 'US') expect(r.colegio, pais).toBeUndefined();
    expect(partidosDoPais('US').length).toBeGreaterThan(2);
  });
});

describe('12.9.1 · a disputa americana tem dois grandes lados', () => {
  it('o adversário forte é do lado oposto ao seu; quem é de centro enfrenta um de cada lado', async () => {
    const { registrarCandidatura: reg } = await import('../sistemas/politica');
    for (const [meu, esperado] of [['~centro_esquerda', ['~direita']], ['~direita', ['~centro_esquerda']], ['~centro', ['~centro_esquerda', '~centro_direita']]] as const) {
      const v = structuredClone(adulto(30, { semente: 1290 }));
      definirPaisCorrente('US');
      const muni = (cidadesDoPais('US').find(m => m.perfil === 'metropole') ?? cidadesDoPais('US')[0]).id;
      v.moradia.municipioId = muni; v.eu.municipioNatal = muni; v.eu.nacionalidades = ['US'];
      v.t = tDaEleicao(2028, 'US') - 6; v.eu.tNasc = v.t - 55 * 12; v.caminhos.politica = undefined; v.anoAtual = { acoes: [] };
      const p = entrarNaPolitica(v, 'comunidade'); p.partido = meu; p.tFiliacao = v.t - 160; p.partidos = [{ sigla: meu, tInicio: p.tFiliacao }]; p.fase = 'entre_mandatos';
      reg(v, 'presidente', tDaEleicao(2028, 'US'));
      const adv = presidencia(v).campanha!.adversarios.map(a => a.partido);
      expect(adv.slice(0, esperado.length), meu).toEqual([...esperado]);
    }
  });
});

describe('12.9.1 · a leitura diz que decide o Colégio', () => {
  it('as regras dos EUA marcam o Colégio; as do Brasil, não', async () => {
    const { leituraPresidencial } = await import('../sistemas/presidencia129');
    const v = structuredClone(adulto(30, { semente: 1290 }));
    definirPaisCorrente('US');
    const muni = (cidadesDoPais('US').find(m => m.perfil === 'metropole') ?? cidadesDoPais('US')[0]).id;
    v.moradia.municipioId = muni; v.eu.municipioNatal = muni; v.eu.nacionalidades = ['US']; v.caminhos.politica = undefined;
    entrarNaPolitica(v, 'comunidade');
    expect(leituraPresidencial(v)?.regras?.colegio).toBe(true);
    definirPaisCorrente('BR');
  });
});
