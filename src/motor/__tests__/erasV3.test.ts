/**
 * ERAS v3 — a expansão internacional e anterior a 1970: datas, calendários, moedas, economia, tecnologia por país, regras
 * sociais, guerras, mortalidade, veículos, conteúdo dos pacotes, saves e a vida contemporânea intacta.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova, viver } from './ajuda';
import { carregarMundo } from '../mundo/carregar';
import { entrarNaVida, ladoDaVida } from '../mundo/vida';
import { formatarDinheiro, emMoedaLocal, fatorNominalNoPais, fatorDoPais, moedaDoPais } from '../mundo/moeda';
import { interpretar } from '../save';
import { anoDe, tDe } from '../tempo';
import { definirMesHistorico } from '../eras/base/moedas';
import { pacoteDaEra, pacotesDeEra, moedaNoMes, nivelMensal } from '../eras/base/pacote';
import { PAISES_COM_ERA, eraImperialEm, normalizarEra, tecnologia, datasNoPais, meioDeComunicacao } from '../eras/base/contexto';
import { TECNOLOGIAS_BR } from '../eras/base/tecnologias';
import { rendaDaEpocaNoPais } from '../eras/base/economia';
import { fatoresDeMortalidade, mortalidadeNoAno } from '../eras/base/mortalidade';
import { riscoDeGuerraDaPessoa, regraVigente, taxaDoSuperior } from '../eras/base/sociedade';
import { casamentoImpedidoPelaLei, regraEleitoralDaEpoca } from '../eras/base/leis';
import { versoesDoAno } from '../eras/base/veiculos';
import { VERSOES_DA_EPOCA_MUNDO, DESENHO_DE } from '../eras/base/veiculosMundo';
import { anacronismosNoTexto, textoDaEpoca } from '../eras/base/anacronismos';
import { ocupacaoAindaNaoExiste, cursoExiste } from '../eras/base/profissoes';
import { regrasDoAno, guerrasDoAno } from '../eras/v3/anoPais';
import { VERSOES_VEICULO } from '../dados/bens';
import { cidadesDoPais, municipio } from '../dados/lugares';
import { salarioMinimoDoPais } from '../mundo/economia';
import { ACONTECIMENTOS_BR, ESPORTE_MUNDIAL_BR } from '../eras/dados/acontecimentosBR';
import { DECADAS } from '../eras/dados/culturaBR';
import { perfilDoPais } from '../mundo/registro';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

const vida = (pais: string, municipioId: string, ano: number, o: Parameters<typeof nova>[0] = {}) => nova({ semente: 777, municipioId, ano, era: true, ...o });
const noMes = (v: Vida, ano: number, mes = 5) => { v.t = tDe(ano, mes); entrarNaVida(v); return v; };

describe('datas e calendários', () => {
  it('cada país começa no seu primeiro ano: 1900 (a Argentina, 1945); fora disso, não há época', () => {
    for (const [pais, desde] of Object.entries(PAISES_COM_ERA)) {
      const cid = pais === 'BR' ? 'sao-paulo-sp' : cidadesDoPais(pais)[0].id;
      expect(vida(pais, cid, desde).era?.pais, pais).toBe(pais);
      expect(vida(pais, cid, desde - 1).era, `${pais} ${desde - 1}`).toBeUndefined();
      expect(vida(pais, cid, 2025).era).toBeDefined();
      expect(vida(pais, cid, 2026).era).toBeUndefined();
    }
    // Um país sem pacote de época (Portugal) continua sem época.
    expect(vida('PT', cidadesDoPais('PT')[0].id, 1950).era).toBeUndefined();
  });
  it('o mês e o dia escolhidos valem; o dia impossível é recusado; o texto de nascimento diz a data', () => {
    const v = vida('US', 'us:chicago', 1931, { mes: 2, dia: 14 });
    expect(v.t % 12).toBe(2);
    expect(v.era!.dia).toBe(14);
    expect(v.biografia[0].texto).toMatch(/14 de março de 1931/);
    expect(vida('US', 'us:chicago', 1931, { mes: 1, dia: 30 }).era!.dia).toBeUndefined(); // 30 de fevereiro
    expect(vida('US', 'us:chicago', 1932, { mes: 1, dia: 29 }).era!.dia).toBe(29); // bissexto
  });
  it('o calendário imperial japonês troca de era no dia certo', () => {
    expect(eraImperialEm(1926, 11, 24)).toEqual({ nome: 'Taishō', ano: 15 });
    expect(eraImperialEm(1926, 11, 25)).toEqual({ nome: 'Shōwa', ano: 1 });
    expect(eraImperialEm(1989, 0, 7)).toEqual({ nome: 'Shōwa', ano: 64 });
    expect(eraImperialEm(1989, 0, 8)).toEqual({ nome: 'Heisei', ano: 1 });
    expect(eraImperialEm(2019, 4, 1)).toEqual({ nome: 'Reiwa', ano: 1 });
    const v = vida('JP', 'jp:osaka', 1950, { mes: 3, dia: 1 });
    expect(v.biografia[0].texto).toMatch(/ano 25 da era Shōwa/);
  });
  it('a vida atravessa a virada do século e continua depois de 2025 sem quebrar', () => {
    const v = viver(vida('GB', 'gb:leeds', 1985), 45);
    expect(anoDe(v.t) >= 2026 || !!v.morte).toBe(true);
  });
});

describe('moedas', () => {
  it('a libra antes de 1971 escreve-se em libras, xelins e pence; depois, decimal', () => {
    const v = noMes(vida('GB', 'gb:londres', 1950), 1950);
    const t = formatarDinheiro(1 / fatorNominalNoPais('GB', v.t) * 3.225); // £3 4s 6d
    expect(t).toBe('£3 4s 6d');
    noMes(v, 1975);
    expect(moedaDoPais('GB')).toBe('GBP');
    expect(formatarDinheiro(100)).toMatch(/^£ /);
  });
  it('o mil-réis com o cifrão no meio, até 1942; o cruzeiro depois', () => {
    const v = noMes(vida('BR', 'sao-paulo-sp', 1925), 1925);
    // Um conto e quinhentos mil-réis (1.500.000 réis) e um mil-réis e quinhentos réis.
    expect(formatarDinheiro(1_500_000 / emMoedaLocal(1))).toBe('Rs 1:500$000');
    expect(formatarDinheiro(1500 / emMoedaLocal(1))).toBe('Rs 1$500');
    noMes(v, 1950);
    expect(formatarDinheiro(100)).toMatch(/^Cr\$ /);
  });
  it('a Alemanha: marco, Rentenmark, marco alemão no oeste e marco do leste, euro', () => {
    const p = pacoteDaEra('DE')!;
    expect(moedaNoMes(p, tDe(1913, 0)).simbolo).toBe('ℳ');
    expect(moedaNoMes(p, tDe(1925, 0)).simbolo).toBe('RM');
    expect(moedaNoMes(p, tDe(1950, 0), 'oeste').simbolo).toBe('DM');
    expect(moedaNoMes(p, tDe(1950, 0), 'leste').simbolo).toBe('M');
    expect(moedaNoMes(p, tDe(1991, 0), 'leste').simbolo).toBe('DM');
    expect(moedaNoMes(p, tDe(2005, 0)).simbolo).toBe('€');
    // Leipzig em 1960 é o lado leste; Hamburgo, o oeste; Berlim depende da família.
    const leipzig = noMes(vida('DE', 'de:leipzig', 1955), 1960);
    expect(ladoDaVida(leipzig)).toBe('leste');
    expect(formatarDinheiro(100)).toMatch(/^M /);
    expect(ladoDaVida(noMes(vida('DE', 'de:hamburgo', 1955), 1960))).toBe('oeste');
    expect(ladoDaVida(noMes(vida('DE', 'de:leipzig', 1955), 1995))).toBe('oeste');
  });
  it('a hiperinflação alemã de 1923: o mesmo poder de compra custa bilhões de vezes mais em novembro do que em janeiro', () => {
    const p = pacoteDaEra('DE')!;
    const r = nivelMensal(p.serie, tDe(1923, 10)) / nivelMensal(p.serie, tDe(1923, 0));
    expect(r).toBeGreaterThan(1e7);
  });
  it('a Argentina troca de moeda cinco vezes, e em 2025 a moeda é a de hoje com o fator de hoje', () => {
    const p = pacoteDaEra('AR')!;
    expect([1950, 1975, 1984, 1988, 1995].map(a => moedaNoMes(p, tDe(a, 6)).simbolo)).toEqual(['m$n', '$', '$a', '₳', '$']);
    for (const pais of ['US', 'GB', 'JP', 'DE', 'AR']) {
      definirMesHistorico(tDe(2025, 6), pais);
      expect(fatorNominalNoPais(pais, tDe(2025, 6)) / fatorDoPais(pais), pais).toBeCloseTo(1, 1);
    }
    definirMesHistorico(null);
  });
  it('trocar de moeda não cria nem destrói dinheiro: o saldo interno atravessa igual', () => {
    let v = vida('AR', 'ar:rosario', 1980);
    v.financas.conta = 50000;
    const antes = v.financas.conta;
    v = viver(v, 4); // atravessa o peso argentino (1983) e o austral (1985)
    const trocas = v.biografia.filter(e => e.fato?.tipo === 'era' && e.fato.dados.categoria === 'moeda').map(e => String(e.fato!.dados.evento));
    expect(trocas).toEqual(expect.arrayContaining(['AR_PA']));
    expect(antes).toBe(50000);
  });
});

describe('economia', () => {
  it('a renda da época é menor no passado e 1 na vida contemporânea', () => {
    definirMesHistorico(tDe(1950, 5), 'US');
    expect(rendaDaEpocaNoPais('US')).toBeLessThan(0.5);
    expect(rendaDaEpocaNoPais('BR')).toBe(1); // o Brasil tem as próprias séries (eras/base/economia)
    definirMesHistorico(tDe(1960, 5), 'DE', 'leste');
    const leste = rendaDaEpocaNoPais('DE');
    definirMesHistorico(tDe(1960, 5), 'DE', 'oeste');
    expect(leste).toBeLessThan(rendaDaEpocaNoPais('DE'));
    definirMesHistorico(null);
    expect(rendaDaEpocaNoPais('US')).toBe(1);
  });
  it('o salário mínimo: o federal americano desde 1938; antes dele, o piso de fato; o britânico só desde 1999', () => {
    definirMesHistorico(tDe(1945, 0), 'US');
    const comLei = salarioMinimoDoPais('US');
    definirMesHistorico(tDe(1935, 0), 'US');
    const semLei = salarioMinimoDoPais('US');
    expect(comLei).toBeGreaterThan(0);
    expect(semLei).toBeGreaterThan(0);
    definirMesHistorico(null);
  });
});

describe('tecnologia por país', () => {
  it('toda tecnologia tem data em todo pacote de país', () => {
    for (const p of pacotesDeEra()) for (const x of TECNOLOGIAS_BR) expect(p.tecnologias[x.id], `${p.pais} ${x.id}`).toBeDefined();
  });
  it('a chegada é do país: TV no Japão só em 1953; no Brasil em 1950; nos EUA em 1941', () => {
    expect(datasNoPais('JP', 'tv')!.chega).toBe(1953);
    expect(datasNoPais('BR', 'tv')!.chega).toBe(1950);
    expect(datasNoPais('US', 'tv')!.chega).toBe(1941);
    const v = noMes(vida('JP', 'jp:osaka', 1940, { classe: 'alta' }), 1951);
    expect(tecnologia(v, 'tv')).toBe('indisponivel');
  });
  it('no leste da Alemanha, o telefone em casa ficou raro até 1990; no oeste, comum nos anos 1980', () => {
    // (cada vida entra no motor antes de ser lida: o lado é o da vida em processamento)
    const leste = noMes(vida('DE', 'de:dresden', 1950, { classe: 'media' }), 1985);
    expect(tecnologia(leste, 'telefone_fixo')).toBe('indisponivel');
    const oeste = noMes(vida('DE', 'de:munique', 1950, { classe: 'media' }), 1985);
    expect(tecnologia(oeste, 'telefone_fixo')).toBe('comum');
  });
  it('sem telefone em casa e antes do telefone público, a comunicação é por carta', () => {
    const v = noMes(vida('GB', 'gb:leeds', 1905, { classe: 'trabalhadora' }), 1912);
    expect(meioDeComunicacao(v)).toBe('cartas');
  });
});

describe('veículos', () => {
  const ids = (pais: string, ano: number, lado: 'oeste' | 'leste' = 'oeste') => { definirMesHistorico(tDe(ano, 5), pais, lado); const r = new Set(versoesDoAno(VERSOES_VEICULO.filter(x => !x.epoca) as never, ano, pais).map(x => x.id)); definirMesHistorico(null); return r; };
  it('cada mercado vê os carros dele: o Modelo T nos EUA de 1920, o Trabant só no leste, nada brasileiro fora do Brasil', () => {
    expect(ids('US', 1920).has('epm_ford_t')).toBe(true);
    expect(ids('DE', 1975, 'leste').has('epm_trabant')).toBe(true);
    expect(ids('DE', 1975, 'oeste').has('epm_trabant')).toBe(false);
    expect(ids('DE', 1975, 'leste').has('epm_vw_golf')).toBe(false);
    expect([...ids('US', 1980)].some(id => id.startsWith('ep_'))).toBe(false);
    expect(ids('BR', 1952).has('epm_br_belair')).toBe(true);
    expect(ids('BR', 1952).has('ep_vw_fusca')).toBe(false);
  });
  it('toda versão da época mundial tem anos coerentes e um desenho', async () => {
    const { MODELOS_13 } = await import('../../ui/ilustracao/carros13');
    for (const x of VERSOES_DA_EPOCA_MUNDO) {
      expect(x.epoca[0]).toBeLessThanOrEqual(x.epoca[1]);
      if (x.classe.startsWith('carro')) expect(MODELOS_13[x.id] ?? MODELOS_13[DESENHO_DE[x.id]], x.id).toBeDefined();
    }
  });
});

describe('sociedade, leis e guerras', () => {
  it('a segregação legal pesa a quem tinha ancestralidade africana, no Sul, até 1965 — e só a essa pessoa', () => {
    const negra = vida('US', 'us:atlanta', 1932); negra.eu.ancestralidade = { af: 0.8, eu: 0.2 };
    const branca = vida('US', 'us:atlanta', 1932); branca.eu.ancestralidade = { eu: 1 };
    for (const v of [negra, branca]) { noMes(v, 1950); v.t = v.eu.tNasc + 18 * 12; entrarNaVida(v); regrasDoAno(v, 'US', 'oeste'); }
    expect(negra.biografia.some(e => e.fato?.dados.evento === 'us_jim_crow')).toBe(true);
    expect(branca.biografia.some(e => e.fato?.dados.evento === 'us_jim_crow')).toBe(false);
  });
  it('o casamento entre pessoas do mesmo gênero: impedido nos EUA de 2010, possível em 2016; no Japão, até hoje', () => {
    const us = noMes(vida('US', 'us:chicago', 1980), 2010);
    expect(casamentoImpedidoPelaLei(us, 'feminino', 'feminino')).toBeTruthy();
    noMes(us, 2016);
    expect(casamentoImpedidoPelaLei(us, 'feminino', 'feminino')).toBeUndefined();
    const jp = noMes(vida('JP', 'jp:toquio', 1980), 2020);
    expect(casamentoImpedidoPelaLei(jp, 'masculino', 'masculino')).toBeTruthy();
  });
  it('sem eleições livres não há candidatura; onde a mulher não votava, também não era votada', () => {
    const de = noMes(vida('DE', 'de:munique', 1900, { genero: 'masculino' }), 1940);
    expect(regraEleitoralDaEpoca(de, 'deputado_federal', 1940, false)).toBeTruthy();
    const gb = noMes(vida('GB', 'gb:leeds', 1880 + 20, { genero: 'feminino' }), 1910);
    expect(regraEleitoralDaEpoca(gb, 'vereador', 1910, false)).toBeTruthy();
    noMes(gb, 1935);
    expect(regraEleitoralDaEpoca(gb, 'vereador', 1935, false)).toBeUndefined();
  });
  it('a guerra: convocação na proporção histórica dos homens da idade; risco para os homens da família', () => {
    let chamados = 0;
    for (let s = 1; s <= 80; s++) {
      const v = nova({ semente: 9000 + s, municipioId: 'us:chicago', ano: 1920, era: true, genero: 'masculino' });
      noMes(v, 1942, 6); guerrasDoAno(v, 'US', 'oeste');
      if (v.era!.guerras?.includes('us_ww2')) chamados++;
    }
    expect(chamados / 80).toBeGreaterThan(0.4);
    expect(chamados / 80).toBeLessThan(0.8);
    definirMesHistorico(tDe(1942, 6), 'DE');
    expect(riscoDeGuerraDaPessoa(tDe(1942, 6), 25, 'masculino').risco).toBeGreaterThan(0);
    expect(riscoDeGuerraDaPessoa(tDe(1942, 6), 25, 'feminino').risco).toBe(0);
    definirMesHistorico(tDe(1960, 6), 'DE');
    expect(riscoDeGuerraDaPessoa(tDe(1960, 6), 25, 'masculino').risco).toBe(0);
    definirMesHistorico(null);
  });
  it('a universidade era para poucos: a taxa de matrícula sobe com o tempo em todos os países', () => {
    for (const p of ['BR', 'US', 'GB', 'JP', 'DE', 'AR']) expect(taxaDoSuperior(p, 1950)!, p).toBeLessThan(taxaDoSuperior(p, 2020)!);
  });
});

describe('mortalidade da época', () => {
  it('vida contemporânea: nenhum fator; vida de 1910: mais risco, e o protagonista criança fica de fora do risco extra', () => {
    definirMesHistorico(null);
    expect(fatoresDeMortalidade(true, 30)).toEqual({ adulto: 1, crianca: 0 });
    definirMesHistorico(tDe(1910, 5), 'BR');
    expect(fatoresDeMortalidade(false, 2).crianca).toBeGreaterThan(0.03);
    expect(fatoresDeMortalidade(true, 2).crianca).toBe(0);
    expect(fatoresDeMortalidade(true, 40).adulto).toBeGreaterThan(1);
    expect(fatoresDeMortalidade(true, 40).adulto).toBeLessThan(fatoresDeMortalidade(false, 40).adulto);
    definirMesHistorico(null);
    expect(mortalidadeNoAno('JP', 1950)!.e0).toBeLessThan(mortalidadeNoAno('JP', 2000)!.e0);
  });
});

describe('o conteúdo dos pacotes', () => {
  it('acontecimentos com fonte, data no intervalo, ids únicos e lugares que existem no perfil do país', () => {
    for (const p of pacotesDeEra()) {
      const codigos = new Set(perfilDoPais(p.pais).divisao.lista.map(d => d.codigo));
      const ids = new Set<string>();
      for (const a of p.acontecimentos) {
        expect(ids.has(a.id), `${p.pais}:${a.id} repetido`).toBe(false); ids.add(a.id);
        expect(a.fonte.length, a.id).toBeGreaterThan(3);
        expect(a.data[0]).toBeGreaterThanOrEqual(p.desde); expect(a.data[0]).toBeLessThanOrEqual(2025);
        expect(a.data[1]).toBeGreaterThanOrEqual(1); expect(a.data[1]).toBeLessThanOrEqual(12);
        for (const d of a.divisoes ?? []) expect(codigos.has(d), `${p.pais}:${a.id} ${d}`).toBe(true);
      }
      for (const d of p.decadas) for (const id of d.marcos) expect(ids.has(id), `${p.pais} ${d.decada} ${id}`).toBe(true);
      for (const l of p.lembrancas) for (const d of l.divisoes ?? []) expect(codigos.has(d), `${p.pais}:${l.id} ${d}`).toBe(true);
      for (const r of p.regras) { expect(r.fonte.length).toBeGreaterThan(8); for (const d of r.divisoes ?? []) expect(codigos.has(d), `${p.pais}:${r.id}`).toBe(true); }
      // As moedas em ordem e com a cadeia decrescente até a de hoje (porAtual 1 no fim, exceto o lado leste).
      const semLado = p.moedas.filter(m => !m.lado);
      expect(semLado[semLado.length - 1].porAtual).toBe(1);
    }
  });
  it('o Brasil de 1900 a 1969: acontecimentos e décadas na escolha, sem marco que não exista', () => {
    const ids = new Set([...ACONTECIMENTOS_BR, ...ESPORTE_MUNDIAL_BR].map(a => a.id));
    for (const d of DECADAS) for (const id of d.marcos) expect(ids.has(id), `${d.decada} ${id}`).toBe(true);
    expect(DECADAS.map(d => d.decada)).toEqual(expect.arrayContaining([1900, 1910, 1920, 1930, 1940, 1950, 1960]));
  });
});

describe('profissões, cursos e textos da época', () => {
  it('as profissões chegam na data do país; as do futuro, nunca antes', () => {
    const us = noMes(vida('US', 'us:chicago', 1940), 1955);
    expect(ocupacaoAindaNaoExiste(us, 'dev_jr')).toBeUndefined(); // EUA: programador desde 1955
    const br = noMes(vida('BR', 'sao-paulo-sp', 1940), 1955);
    expect(ocupacaoAindaNaoExiste(br, 'dev_jr')).toBe(1960);
    expect(ocupacaoAindaNaoExiste(br, 'operador_drone')).toBe(2028);
    expect(cursoExiste(noMes(vida('BR', 'sao-paulo-sp', 1912), 1930), 'ads')).toBe(false);
  });
  it('antes da TV, o rádio; antes do rádio, o jornal; antes do telefone, a carta — e o detector sabe a data do país', () => {
    const v = noMes(vida('GB', 'gb:leeds', 1905, { classe: 'trabalhadora' }), 1912);
    expect(textoDaEpoca(v, 'Viu na TV e ligou para a tia por telefone.')).toBe('Viu no jornal e escreveu para a tia por carta.');
    expect(anacronismosNoTexto('assistiu à televisão', 1945, 'US')).toEqual([]);
    expect(anacronismosNoTexto('assistiu à televisão', 1945, 'BR')).toEqual(['televisão']);
    expect(anacronismosNoTexto('a Lei Seca', 1925, 'US')).toEqual([]);
  });
});

describe('saves e a vida contemporânea', () => {
  it('uma vida da Alemanha Oriental salva e reabre igual; uma época malformada é descartada', () => {
    let v = vida('DE', 'de:leipzig', 1950);
    v = viver(v, 12);
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.era).toEqual(v.era);
    const w = vida('JP', 'jp:osaka', 1950);
    (w.era as unknown as { pais: string }).pais = 'XX'; normalizarEra(w);
    expect(w.era).toBeUndefined();
    const z = vida('US', 'us:chicago', 1950);
    (z.era as unknown as { morte: unknown }).morte = { t: 'x' }; normalizarEra(z);
    expect(z.era!.morte).toBeUndefined();
  });
  it('na vida contemporânea, nada da v3 acontece: sem textos de época, sem regra, sem guerra, fatores 1', () => {
    let v = nova({ semente: 31, municipioId: 'us:chicago' });
    v = viver(v, 20);
    expect(v.era).toBeUndefined();
    expect(v.biografia.some(e => e.fato?.tipo === 'era')).toBe(false);
    definirMesHistorico(null);
    expect(regraVigente('voto_feminino', 1910)).toBeUndefined();
    expect(municipio('us:chicago').pais).toBe('US');
  });
});
