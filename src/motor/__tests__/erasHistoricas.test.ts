/**
 * ERAS HISTÓRICAS (protótipo) — cronologia, moedas, tecnologia, portões, acontecimentos, save e a vida contemporânea.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { nova, viver } from './ajuda';
import { avancarAno } from '../ano';
import { carregarMundo } from '../mundo/carregar';
import { entrarNaVida } from '../mundo/vida';
import { formatarDinheiro } from '../mundo/moeda';
import { salarioMinimoDoPais } from '../mundo/economia';
import { interpretar } from '../save';
import { anoDe, tDe } from '../tempo';
import { fatorNominal, ipcaDoAno, nivelDePrecos, padraoEm, salarioMinimoNominal, definirMesHistorico } from '../eras/base/moedas';
import { meioDeComunicacao, normalizarEra, tecnologia } from '../eras/base/contexto';
import { textoDaEpoca } from '../eras/base/anacronismos';
import { fatorDePrecoDaEpoca, motivoSemCoisa } from '../eras/base/coisas';
import { processarEra, inflacaoEfetiva, LIMITE_COLLOR } from '../eras/ano';
import { ACONTECIMENTOS_BR, ESPORTE_MUNDIAL_BR } from '../eras/dados/acontecimentosBR';
import { coisa } from '../dados/coisas';
import { disponibilidadeComprarCoisa } from '../sistemas/coisas';
import { disponibilidadeNamoro15 } from '../v15/celular/celular15';
import { disponibilidadeRede } from '../sistemas/redes';
import { ofertasDeVeiculos } from '../sistemas/mercado';
import { elegibilidade } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import type { Vida } from '../tipos';

beforeAll(async () => { await carregarMundo(); });

const historica = (ano: number, o: Parameters<typeof nova>[0] = {}) => nova({ semente: 4242, municipioId: 'sao-paulo-sp', ano, era: true, ...o });
/** A mesma vida, levada a um mês (sem viver os anos: para os portões que só olham o calendário). */
const em = (v: Vida, ano: number, mes = 5): Vida => { const x = structuredClone(v); x.t = tDe(ano, mes); entrarNaVida(x); return x; };
const adulta = (v: Vida, ano: number, idade = 30): Vida => { const x = structuredClone(v); x.t = tDe(ano, 5); x.eu.tNasc = x.t - idade * 12; x.moradia = { ...x.moradia, tipo: 'aluguel' }; entrarNaVida(x); return x; };

describe('cronologia', () => {
  it('a vida histórica guarda a época e o ano de nascimento; a contemporânea não ganha época', () => {
    const v = historica(1984);
    expect(v.era).toMatchObject({ pais: 'BR', ano: 1984, decada: 1980 });
    expect(anoDe(v.eu.tNasc)).toBe(1984);
    const c = nova({ semente: 4242, municipioId: 'sao-paulo-sp' });
    expect(c.era).toBeUndefined();
    expect(anoDe(c.eu.tNasc)).toBe(2026);
  });
  it('fora do Brasil ou fora do intervalo, não há época (a primeira versão é brasileira, de 1980 a 2025)', () => {
    expect(nova({ semente: 1, municipioId: 'sao-paulo-sp', ano: 1979, era: true }).era).toBeUndefined();
    expect(nova({ semente: 1, municipioId: 'sao-paulo-sp', ano: 2026, era: true }).era).toBeUndefined();
  });
  it('o calendário segue depois da década escolhida e os acontecimentos caem no mês em que aconteceram, uma vez só', () => {
    const v = viver(historica(1984), 12);
    expect(anoDe(v.t)).toBe(1996);
    const era = v.biografia.filter(e => e.fato?.tipo === 'era');
    const id = (e: (typeof era)[number]) => String((e.fato!.dados as Record<string, string>).evento);
    for (const e of era) {
      const a = [...ACONTECIMENTOS_BR, ...ESPORTE_MUNDIAL_BR].find(x => x.id === id(e));
      if (a) expect(e.t).toBe(tDe(a.data[0], a.data[1] - 1));
    }
    const ids = era.map(id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('real');
    expect(ids).toContain('tetra');
    // Nada de depois do ano vivido
    expect(era.every(e => e.t <= v.t)).toBe(true);
    expect(ids).not.toContain('penta');
  });
});

describe('moeda e poder de compra', () => {
  it('os padrões monetários na data certa', () => {
    expect(padraoEm(tDe(1985, 5)).simbolo).toBe('Cr$');
    expect(padraoEm(tDe(1986, 2)).simbolo).toBe('Cz$');
    expect(padraoEm(tDe(1989, 1)).simbolo).toBe('NCz$');
    expect(padraoEm(tDe(1990, 3)).simbolo).toBe('Cr$');
    expect(padraoEm(tDe(1993, 7)).simbolo).toBe('CR$');
    expect(padraoEm(tDe(1994, 6)).simbolo).toBe('R$');
  });
  it('a troca só corta os zeros: no mês da troca, o mesmo dinheiro vale exatamente 1/1000 (e 1/2750 no real)', () => {
    for (const [ano, mes, k] of [[1986, 2, 1000], [1989, 1, 1000], [1993, 7, 1000], [1994, 6, 2750]] as const) {
      const t = tDe(ano, mes);
      const antes = nivelDePrecos(t) * padraoEm(t - 1).porReal;
      expect(antes / fatorNominal(t)).toBeCloseTo(k, 6);
    }
    expect(padraoEm(tDe(1990, 2)).porReal).toBe(padraoEm(tDe(1990, 3)).porReal); // NCz$ 1 = Cr$ 1
  });
  it('IPCA e salário mínimo das séries oficiais', () => {
    expect(ipcaDoAno(1989)! * 100).toBeCloseTo(1972.91, 1);
    expect(ipcaDoAno(1995)! * 100).toBeCloseTo(22.41, 1);
    expect(ipcaDoAno(2025)! * 100).toBeCloseTo(4.26, 1);
    expect(salarioMinimoNominal(tDe(1995, 4))).toBe(100);
    expect(salarioMinimoNominal(tDe(2025, 0))).toBe(1518);
    // Cr$ 97.176 em maio de 1984 (o mínimo unificado)
    expect(Math.round(salarioMinimoNominal(tDe(1984, 4))! * padraoEm(tDe(1984, 4)).porReal)).toBe(97176);
  });
  it('a tela da vida histórica fala na moeda do mês; a contemporânea, em reais', () => {
    const v = em(historica(1984), 1987);
    expect(formatarDinheiro(1000)).toMatch(/^Cz\$ /);
    entrarNaVida(nova({ semente: 1, municipioId: 'sao-paulo-sp' }));
    expect(formatarDinheiro(1000)).toBe('R$ 1.000');
    expect(v.era).toBeDefined();
  });
  it('o salário mínimo do motor é o da época (em poder de compra de hoje) só na vida histórica', () => {
    definirMesHistorico(tDe(1995, 6));
    const de1995 = salarioMinimoDoPais('BR');
    definirMesHistorico(null);
    expect(de1995).toBeLessThan(salarioMinimoDoPais('BR'));
    expect(de1995).toBeGreaterThan(400);
  });
  it('a troca de moeda não cria nem destrói dinheiro', () => {
    const v = adulta(historica(1990), 1994, 30);
    v.t = tDe(1994, 9);
    v.financas.conta = 50_000;
    const ec = { fase: 'normal', inflacao: 0.04, juroReal: 0.04, bolsa: 0, imoveis: 0, deltaJuro: 0, virou: false } as const;
    processarEra(v, { ...ec });
    expect(v.financas.conta).toBe(50_000);
    expect(v.biografia.some(e => (e.fato?.dados as Record<string, string> | undefined)?.evento === 'real')).toBe(true);
  });
  it('Plano Collor: retém o que passa do limite e devolve tudo, em parcelas', () => {
    const v = adulta(historica(1980), 1990, 35);
    v.t = tDe(1990, 5);
    v.financas.conta = 200_000;
    processarEra(v, { fase: 'crise', inflacao: 0.4, juroReal: 0.04, bolsa: 0, imoveis: 0, deltaJuro: 0, virou: false });
    const limite = LIMITE_COLLOR();
    expect(v.financas.conta).toBeCloseTo(limite, 0);
    const retido = v.era!.retido!.valor;
    expect(retido + v.financas.conta).toBeCloseTo(200_000, 0);
    let devolvido = 0;
    for (const t of [tDe(1991, 5), tDe(1992, 5), tDe(1993, 5)]) {
      const antes = v.financas.conta;
      v.t = t;
      processarEra(v, { fase: 'normal', inflacao: 0.4, juroReal: 0.04, bolsa: 0, imoveis: 0, deltaJuro: 0, virou: false });
      devolvido += v.financas.conta - antes;
    }
    expect(devolvido).toBeCloseTo(retido, -1);
    expect(v.era!.retido).toBeUndefined();
  });
  it('a hiperinflação pesa, mas com limite (aproximação documentada)', () => {
    expect(inflacaoEfetiva(0.05)).toBe(0.05);
    expect(inflacaoEfetiva(19.7)).toBeLessThanOrEqual(0.4);
    expect(inflacaoEfetiva(1)).toBeGreaterThan(0.25);
  });
});

describe('tecnologia e comunicação', () => {
  it('nada antes de existir no Brasil; a vida contemporânea tem tudo', () => {
    const v = historica(1984);
    expect(tecnologia(em(v, 1988), 'celular')).toBe('indisponivel');
    expect(tecnologia(em(v, 1994), 'internet')).toBe('indisponivel');
    expect(tecnologia(em(v, 2007), 'smartphone')).toBe('indisponivel');
    expect(tecnologia(em(v, 2019), 'pix')).toBe('indisponivel');
    expect(tecnologia(nova({ semente: 1, municipioId: 'sao-paulo-sp' }), 'smartphone')).toBe('comum');
  });
  it('a chegada é gradual: primeiro para quem tem renda alta', () => {
    const rica = adulta(historica(1984, { classe: 'alta' }), 2009, 25);
    rica.trabalho.atual = { ...(rica.trabalho.atual ?? {}), salario: 40_000 } as never;
    const pobre = adulta(historica(1984, { classe: 'vulneravel' }), 2009, 25);
    expect(tecnologia(rica, 'smartphone')).toBe('rara');
    expect(tecnologia(pobre, 'smartphone')).toBe('indisponivel');
  });
  it('o torpedo exige o celular; o aplicativo de mensagens, o smartphone', () => {
    const v = adulta(historica(1984, { classe: 'vulneravel' }), 2003, 19);
    if (tecnologia(v, 'celular') === 'indisponivel') expect(tecnologia(v, 'sms')).toBe('indisponivel');
    expect(tecnologia(adulta(historica(1984), 2008, 24), 'mensageiro_app')).toBe('indisponivel');
  });
  it('o aparelho muda com a época: telefone de casa, celular de teclas, smartphone', () => {
    const v = historica(1984, { classe: 'media' });
    expect(meioDeComunicacao(adulta(v, 1990, 20))).toBe('fixo');
    expect(meioDeComunicacao(adulta(v, 2006, 22))).toBe('celular');
    expect(meioDeComunicacao(adulta(v, 2018, 34))).toBe('smartphone');
    expect(meioDeComunicacao(nova({ semente: 1, municipioId: 'sao-paulo-sp' }))).toBe('smartphone');
  });
  it('sem aplicativo de namoro nem rede social antes de existirem', () => {
    const v = adulta(historica(1984), 2000, 25);
    v.eu.atracao = ['feminino', 'masculino'] as never;
    expect(disponibilidadeNamoro15(v).grau).toBe('impossivel');
    expect(disponibilidadeRede(v, { oque: 'criar', plataforma: 'instagram' } as never).grau).toBe('impossivel');
    expect(disponibilidadeRede(adulta(historica(1984), 1992, 25), { oque: 'criar', plataforma: 'youtube' } as never).grau).toBe('impossivel');
  });
});

describe('lojas, veículos, profissões e o texto da época', () => {
  it('a coisa tem o nome da época, não se vende antes de existir e custa mais enquanto é novidade', () => {
    const v = adulta(historica(1980, { classe: 'alta' }), 1990, 30);
    expect(coisa('videogame')!.nome).toBe('videogame de cartucho');
    expect(motivoSemCoisa(v, 'celular_bom')).toMatch(/não existe/);
    expect(disponibilidadeComprarCoisa(v, 'tablet').grau).toBe('impossivel');
    expect(fatorDePrecoDaEpoca(v, 'computador')).toBeGreaterThan(1);
    entrarNaVida(nova({ semente: 1, municipioId: 'sao-paulo-sp' }));
    expect(coisa('videogame')!.nome).toBe('videogame');
  });
  it('a concessionária de 1990 vende os carros da época; a de hoje, os de sempre', () => {
    const v = adulta(historica(1984), 1990, 30);
    const ids = ofertasDeVeiculos(v, 'concessionaria').map(o => o.versaoId!);
    expect(ids.some(id => id.startsWith('ep_'))).toBe(true);
    expect(ids).not.toContain('fiat_mobi');
    const hoje = ofertasDeVeiculos(adulta(nova({ semente: 2, municipioId: 'sao-paulo-sp' }), 2026, 30), 'concessionaria').map(o => o.versaoId!);
    expect(hoje.some(id => id.startsWith('ep_'))).toBe(false);
  });
  it('profissão que ainda não existe não é oferecida', () => {
    const v = adulta(historica(1984), 2010, 26);
    expect(elegibilidade(v, ocupacao('motorista_app')).grau).toBe('impossivel');
  });
  it('o texto troca o que ainda não existe; na vida contemporânea, nada muda', () => {
    const v = adulta(historica(1984), 1999, 15);
    expect(textoDaEpoca(v, 'Mandou um Pix para o primo e estudou para o Enem.')).toBe('Mandou um depósito para o primo e estudou para o vestibular.');
    const c = nova({ semente: 1, municipioId: 'sao-paulo-sp' });
    expect(textoDaEpoca(c, 'Mandou um Pix.')).toBe('Mandou um Pix.');
  });
});

describe('save', () => {
  it('salvar e reabrir preserva a época; saves sem época continuam sem', () => {
    let v = historica(1995);
    v = avancarAno(v).vida;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') expect(r.vida.era).toEqual(v.era);
    const c = nova({ semente: 3, municipioId: 'sao-paulo-sp' });
    const rc = interpretar(JSON.stringify(c));
    if (rc.tipo === 'ok') expect(rc.vida.era).toBeUndefined();
  });
  it('a normalização é idempotente e descarta época malformada', () => {
    const v = historica(2001);
    const a = structuredClone(v); normalizarEra(a);
    const b = structuredClone(a); normalizarEra(b);
    expect(b).toEqual(a);
    const ruim = structuredClone(v) as Vida; (ruim as unknown as { era: unknown }).era = { pais: 'XX', ano: 'x' };
    normalizarEra(ruim);
    expect(ruim.era).toBeUndefined();
  });
});
