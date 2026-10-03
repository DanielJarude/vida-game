/**
 * ATT MUNDO — os testes sistêmicos (Parte 36). Cada país é dado estrutural
 * da vida: nascer, ter nacionalidade e morar são coisas diferentes; mudar de
 * país tem porta, custo, câmbio e consequências; o dinheiro não duplica.
 */

import { describe, expect, it } from 'vitest';
import { criarVida } from '../criacao';
import { executar } from '../acoes';
import { idade, transacao } from '../nucleo';
import { interpretar } from '../save';
import type { Vida } from '../tipos';
import { viverAte } from './ajuda';
import { comFilho } from './cenarios';
import { cidadesDoPais, economiaLocal, paisDaCidade } from '../dados/lugares';
import { dinheiro } from '../texto';
import { entrarNaVida, educacaoDaVida, nacionalidadesDaVida, nacionalidadesDoBebe, paisDaVida, paisNatal, perfilDaVida } from '../mundo/vida';
import { converterEntrePaises, formatarDinheiro } from '../mundo/moeda';
import { avaliarMigracao, migrar } from '../sistemas/migracao';
import { patrimonio } from '../sistemas/dinheiro';
import { regrasDoPais } from '../dados/sucessao';
import { podeFazerEnem } from '../sistemas/escola';
import { cargoNoPais, cargosDoPais, nomeCargo, partidosDoPais } from '../sistemas/politica';
import { nacionalidadeEsportiva } from '../sistemas/selecao';
import { remuneracaoDe } from '../sistemas/renda';
import { clubePorNome, clubesDoPais } from '../dados/clubes';
import { criarProposta } from '../sistemas/esporte';
import { paisesVivenciaveis } from '../mundo/registro';
import { continuarComo, partilhar } from '../sistemas/sucessao';

const maior = (p: string) => (cidadesDoPais(p).find(m => m.perfil === 'metropole') ?? cidadesDoPais(p)[0]).id;
const nascer = (municipioId: string, semente = 42) => criarVida({ nome: 'Teste', sobrenome: 'Teste', genero: 'feminino', municipioId, semente });

/** Uma adulta de 30 anos morando por conta própria, com um dinheiro guardado. */
function adultaEm(municipioId: string, semente = 7): Vida {
  let v = viverAte(nascer(municipioId, semente), 30);
  v = transacao(v, x => {
    x.momento = null;
    if (x.moradia.tipo === 'pais' || x.moradia.tipo === 'parente') {
      x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1500, padrao: 3, tInicio: x.t };
      for (const vin of Object.values(x.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
    }
    x.financas.conta = 60000;
  }).vida;
  return v;
}

describe('o catálogo e os perfis', () => {
  it('28 países podem ser vividos, em todas as regiões habitadas, cada um com cidades, nomes, escola, trabalho, política e herança próprios', () => {
    const vivos = paisesVivenciaveis();
    expect(vivos.length).toBe(28);
    expect(new Set(vivos.map(p => p.regiao))).toEqual(new Set(['america_sul', 'america_norte', 'america_central_caribe', 'europa', 'africa', 'asia', 'oceania']));
    for (const p of vivos) {
      expect(cidadesDoPais(p.id).length, p.id).toBeGreaterThanOrEqual(8);
      expect(regrasDoPais(p.id).pais, p.id).toBe(p.id);
      expect(clubesDoPais(p.id).length, p.id).toBeGreaterThan(0);
    }
  });
});

describe('nascer em países diferentes produz vidas diferentes', () => {
  it('1. Brasil: moeda, contexto e regras brasileiras', () => {
    const v = nascer('recife-pe');
    entrarNaVida(v);
    expect(paisNatal(v)).toBe('BR');
    expect(nacionalidadesDaVida(v)).toEqual(['BR']);
    expect(dinheiro(1234)).toBe('R$ 1.234');
    expect(educacaoDaVida(v).nome).toBe('ENEM');
  });

  it('2. Argentina: contexto argentino, sem regras brasileiras', () => {
    const v = nascer(maior('AR'));
    entrarNaVida(v);
    expect(paisNatal(v)).toBe('AR');
    expect(nacionalidadesDaVida(v)).toEqual(['AR']);
    expect(dinheiro(1000)).toMatch(/^ARS /);
    expect(educacaoDaVida(v).ingresso).toBe('acesso_aberto');
    expect(v.biografia[0].texto).toContain('Argentina');
    // A família nasce do lugar: nomes do perfil argentino, não do brasileiro.
    const nomesBR = new Set(['Silva', 'Santos', 'Oliveira', 'Souza']);
    const sobrenomes = Object.values(v.pessoas).filter(p => !p.especie).map(p => p.sobrenome.split(' ')[0]);
    expect(sobrenomes.filter(s => nomesBR.has(s)).length).toBeLessThan(sobrenomes.length);
    // Universidade pública de acesso aberto: não há prova para entrar.
    const adulta = viverAte(v, 18);
    expect(podeFazerEnem(adulta).grau).toBe('impossivel');
    expect(regrasDoPais('AR').pais).toBe('AR');
  });

  for (const [rotulo, pais] of [['3. Europa (Alemanha)', 'DE'], ['4. Ásia (Japão)', 'JP'], ['5. África (Nigéria)', 'NG'], ['6. Oceania (Austrália)', 'AU']] as const) {
    it(`${rotulo}: educação, economia e localização do país`, () => {
      let v = nascer(maior(pais), 11);
      entrarNaVida(v);
      expect(paisDaVida(v)).toBe(pais);
      expect(dinheiro(1000)).not.toMatch(/^R\$/);
      expect(educacaoDaVida(v).nome).toBe(perfilDaVida(v).educacao.exame.nome);
      v = viverAte(v, 24);
      expect(v.biografia.map(e => e.texto).filter(t => /ENEM|ProUni|FIES|SISU/.test(t))).toEqual([]);
      // A política não é a brasileira com outro nome: os degraus, os mandatos, as idades ou as casas mudam.
      const assinatura = (p: string) => JSON.stringify(cargosDoPais(p).map(c => [c, cargoNoPais(c, p).anos, cargoNoPais(c, p).idade, nomeCargo(v, c)]));
      expect(assinatura(pais)).not.toBe(assinatura('BR'));
    });
  }

  it('a mesma pessoa, a mesma ocupação: salários, impostos e o mês ficam diferentes de país para país', () => {
    const emprego = (municipioId: string) => remuneracaoDe({ ocupacaoId: 'enfermeiro', empregador: 'x', contrato: 'clt', salario: 6000, tInicio: 0, desempenho: 60, municipioId, carga: 'integral' });
    const br = emprego('sao-paulo-sp'), us = emprego(maior('US')), pt = emprego(maior('PT'));
    expect(new Set([br.liquido, us.liquido, pt.liquido]).size).toBe(3);
    expect(br.tem13).toBe(true);
    expect(us.tem13).toBe(false); // sem 13º nos EUA
    expect(pt.mediaMensal).toBeGreaterThan(pt.liquido); // 14 salários em Portugal
  });
});

describe('migrar', () => {
  it('7. Brasil → Argentina: a residência muda, a nacionalidade não; a porta é a do MERCOSUL', () => {
    const v = adultaEm('belo-horizonte-mg');
    const destino = maior('AR');
    const av = avaliarMigracao(v, destino, 'pessoal');
    expect(av.via).toBe('livre');
    const r = executar(v, { tipo: 'migrar', municipioId: destino, motivo: 'pessoal' });
    const n = r.vida;
    expect(paisDaVida(n)).toBe('AR');
    expect(nacionalidadesDaVida(n)).toEqual(['BR']);
    expect(paisNatal(n)).toBe('BR');
    expect(n.mundo!.migracoes).toHaveLength(1);
    expect(n.biografia.some(e => /Buenos Aires|Argentina/.test(e.texto) && /mudou-se/i.test(e.texto))).toBe(true);
    // Viagem não é migração; migração não é viagem: mudar de cidade para outro país não é permitido pela mudança de cidade.
    expect(executar(v, { tipo: 'mudar_cidade', municipioId: destino }).vida).toBe(v);
  });

  it('8. Argentina → Brasil: o dinheiro atravessa pelo câmbio (o valor de mercado se conserva, menos o custo e a remessa)', () => {
    const v = adultaEm(maior('AR'), 13);
    entrarNaVida(v);
    const antes = patrimonio(v);
    const sem = transacao(v, x => { x.financas.bens = x.financas.bens.filter(b => b.tipo !== 'veiculo'); }).vida;
    const antesSem = patrimonio(sem);
    const depois = transacao(sem, (x, r) => migrar(x, r, 'sao-paulo-sp', 'pessoal')).vida;
    void antesSem;
    expect(paisDaVida(depois)).toBe('BR');
    const k = converterEntrePaises(1, 'AR', 'BR');
    const custo = avaliarMigracao(sem, 'sao-paulo-sp', 'pessoal').custo;
    const esperado = (antesSem - custo) * k;
    expect(Math.abs(patrimonio(depois) - esperado)).toBeLessThan(Math.abs(esperado) * 0.02 + 50);
    expect(antes).toBeGreaterThan(0);
  });

  it('sem porta não há teleporte: sem trabalho, estudo, família nem meios, o Japão não abre', () => {
    const v = transacao(adultaEm('recife-pe', 17), x => { x.financas.conta = 500; x.trabalho.atual = undefined; }).vida;
    const av = avaliarMigracao(v, maior('JP'), 'oportunidade');
    expect(av.via).toBeUndefined();
    expect(executar(v, { tipo: 'migrar', municipioId: maior('JP'), motivo: 'oportunidade' }).vida).toBe(v);
  });

  it('o save com outra moeda, outra cidade e a história migratória reabre igual', () => {
    const v = executar(adultaEm('curitiba-pr', 19), { tipo: 'migrar', municipioId: maior('PT'), motivo: 'pessoal' }).vida;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    expect(JSON.stringify((r as { vida: Vida }).vida)).toBe(JSON.stringify(v));
  });

  it('10. o filho que nasce depois da migração: a origem é a do lugar e a dos pais', () => {
    // Nascido em Buenos Aires, de pais brasileiros: argentino pelo solo, brasileiro pelo sangue.
    expect(nacionalidadesDoBebe(maior('AR'), [['BR'], ['BR']], 3)).toEqual(['AR', 'BR']);
    // No Japão, só o sangue: brasileiro.
    expect(nacionalidadesDoBebe(maior('JP'), [['BR'], ['BR']], 10)).toEqual(['BR']);
    // Na Alemanha, o solo vale se um dos pais mora lá há cinco anos.
    expect(nacionalidadesDoBebe(maior('DE'), [['BR']], 2)).toEqual(['BR']);
    expect(nacionalidadesDoBebe(maior('DE'), [['BR']], 6)).toEqual(['DE', 'BR']);
    // Brasileiro nascido no Brasil: nada a gravar (o óbvio não vai ao save).
    expect(nacionalidadesDoBebe('recife-pe', [['BR']], 30)).toBeUndefined();
  });
});

describe('esporte no mundo', () => {
  it('9. o jogador que muda de país: clube e liga do país novo, a seleção continua a da nacionalidade', () => {
    const v = adultaEm(maior('AR'), 29);
    const n = transacao(v, (x, r) => {
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: clubesDoPais('AR')[0].nome, nivel: 4, tInicio: x.t - 60, tFase: x.t - 60, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 70, espaco: 'titular' };
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o clube', contrato: 'clt', salario: 40000, tInicio: x.t - 60, desempenho: 70, municipioId: x.moradia.municipioId, carga: 'integral' };
      const clube = clubesDoPais('ES').find(c => c.porte === 'grande')!;
      x.caminhos.esporte.clube = clube.nome;
      x.caminhos.esporte.municipioId = clube.cidade;
      x.trabalho.atual.municipioId = clube.cidade;
      migrar(x, r, clube.cidade, 'esporte');
    }).vida;
    expect(paisDaVida(n)).toBe('ES');
    expect(paisDaCidade(n.caminhos.esporte!.municipioId)).toBe('ES');
    expect(nacionalidadeEsportiva(n).pais).toBe('AR');
    expect(nacionalidadeEsportiva(n).selecao).toBe('a seleção argentina');
    expect(n.mundo!.migracoes[0].via).toBe('trabalho');
  });
});

describe('famílias que atravessam países', () => {
  it('11/12. pai brasileiro → filha que migrou → neto nascido no exterior: a sucessão segue com o país de cada um, e a herança não duplica', () => {
    // Pai em Uberaba, filha adulta morando em Buenos Aires (argentina por naturalização não; brasileira que mora lá).
    let v = adultaEm('uberaba-mg', 31);
    v = transacao(v, x => {
      const { p: filha } = comFilho(x, 32, { genero: 'feminino' });
      filha.municipioId = maior('AR');
      filha.municipioNatal = 'uberaba-mg';
      filha.posses = { dinheiro: 10000, bens: [], historia: [] };
      x.financas.conta = 200000;
    }).vida;
    const filha = Object.values(v.pessoas).find(p => p.genitores?.includes('eu'))!;
    // O pai morre.
    v = transacao(v, x => { x.morte = { t: x.t, causa: 'infarto' }; }).vida;
    const partilha = partilhar(v);
    const quinhao = partilha.quinhoes.find(q => q.pessoaId === filha.id)!;
    const r = continuarComo(v, filha.id);
    expect(r.erro).toBeUndefined();
    const n = r.vida;
    // Ela é a protagonista agora: mora na Argentina, nasceu no Brasil, é brasileira.
    expect(paisDaVida(n)).toBe('AR');
    expect(paisNatal(n)).toBe('BR');
    expect(nacionalidadesDaVida(n)).toEqual(['BR']);
    // A herança atravessou pelo câmbio: em pesos de poder de compra de lá, o mesmo valor de mercado.
    const k = converterEntrePaises(1, 'BR', 'AR');
    expect(n.financas.conta).toBeCloseTo(10000 + quinhao.dinheiro * k, 0);
    // A linhagem guarda o pai como brasileiro de Uberaba.
    expect(n.linhagem!.geracoes[0].municipioNatal).toBe('uberaba-mg');
    expect(n.biografia.some(e => /Uberaba/.test(e.texto))).toBe(true);
    entrarNaVida(n);
    expect(formatarDinheiro(1000)).toMatch(/^ARS/);
    expect(idade(n)).toBeGreaterThanOrEqual(32);
  });
});

describe('39. trocar a bandeira: a mesma pessoa, só o país muda', () => {
  /** O que um país faz com uma vida, em categorias comparáveis. */
  function retrato(pais: string) {
    const cid = maior(pais);
    const v = nascer(cid, 77);
    entrarNaVida(v);
    const perfil = perfilDaVida(v);
    const job = remuneracaoDe({ ocupacaoId: 'enfermeiro', empregador: 'x', contrato: 'clt', salario: 6000, tInicio: 0, desempenho: 60, municipioId: cid, carga: 'integral' });
    return {
      nomes: Object.values(v.pessoas).filter(p => !p.especie).map(p => p.sobrenome).sort().join(','),
      moeda: dinheiro(1000).split(' ')[0],
      salarioLiquido: job.liquido,
      mesesPagos: job.mediaMensal / job.liquido,
      custo: Math.round(economiaLocal(cid).aluguel),
      escola: `${perfil.educacao.ingresso}:${perfil.educacao.exame.nome}:${perfil.educacao.publicaCobra}`,
      politica: JSON.stringify(cargosDoPais(pais).map(c => [c, cargoNoPais(c, pais).anos])),
      saude: `${perfil.saude.sistema}:${perfil.saude.custoPlano}`,
      farda: `${perfil.militar.servico}:${perfil.militar.forcas.exercito}`,
      heranca: `${regrasDoPais(pais).legitima}:${regrasDoPais(pais).meacao}:${regrasDoPais(pais).custoTransmissao}`,
      esporte: clubesDoPais(pais).slice(0, 3).map(c => c.nome).join(','),
      migracao: perfil.migracao.blocos.join(','),
      cidadania: nacionalidadesDoBebe(cid, [['BR']], 2)?.join(',') ?? '-',
      lingua: perfil.idiomas[0],
      biografia: v.biografia[0].texto.replace(/^Nasceu em \w+ de \d+, /, '')
    };
  }

  it('Brasil × Argentina × Alemanha × Japão × Nigéria × Estados Unidos: quase tudo muda — não só o texto e a moeda', () => {
    const br = retrato('BR');
    for (const p of ['AR', 'DE', 'JP', 'NG', 'US']) {
      const x = retrato(p);
      const mudou = (Object.keys(br) as (keyof typeof br)[]).filter(k => x[k] !== br[k]);
      // As 15 categorias: a expansão falhou se só mudassem o texto e a moeda.
      expect(mudou.length, `${p}: ${mudou.join(', ')}`).toBeGreaterThanOrEqual(12);
      expect(mudou).toEqual(expect.arrayContaining(['moeda', 'salarioLiquido', 'escola', 'politica', 'heranca', 'esporte', 'nomes']));
    }
  });
});

describe('transferências entre países (auditoria de unicidade)', () => {
  it('quem brilha na elite recebe proposta de uma liga de fora, com clube, cidade, liga e salário de lá', () => {
    const v = adultaEm(maior('AR'), 41);
    const n = transacao(v, x => {
      const clube = clubesDoPais('AR').find(c => c.porte === 'grande')!;
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: clube.nome, nivel: 4, tInicio: x.t - 60, tFase: x.t - 60, lesoes: 0, municipioId: clube.cidade, reputacao: 78, espaco: 'titular' };
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: clube.nome, contrato: 'clt', salario: 30000, tInicio: x.t - 60, desempenho: 70, municipioId: clube.cidade, carga: 'integral' };
    }).vida;
    let achou = 0;
    for (let k = 0; k < 12; k++) {
      const p = transacao(n, x => { x.t += k * 12; return criarProposta(x, x.caminhos.esporte!, 4, 'exterior'); }).valor;
      if (!p) continue;
      achou++;
      expect(paisDaCidade(p.municipioId)).not.toBe('AR');
      expect(clubesDoPais(paisDaCidade(p.municipioId)).some(c => c.nome === p.clube && c.cidade === p.municipioId)).toBe(true);
      expect(p.salario).toBeGreaterThan(0);
    }
    expect(achou).toBeGreaterThan(0);
  });

  it('nomes de clube repetidos em países diferentes não se confundem (o Liverpool inglês e o uruguaio, os Nacional)', () => {
    const repetidos = new Map<string, Set<string>>();
    for (const p of paisesVivenciaveis()) for (const c of clubesDoPais(p.id)) repetidos.set(c.nome, new Set([...(repetidos.get(c.nome) ?? []), p.id]));
    for (const [nome, paises] of repetidos) for (const p of paises) expect(paisDaCidade(clubePorNome(nome, p)!.cidade), `${nome} em ${p}`).toBe(p);
  });

  it('filiar-se a um partido fora do Brasil não trava: há três partidos (do espectro, sem nome real) para conversar', () => {
    for (const p of ['ES', 'JP', 'AR']) {
      expect(new Set(partidosDoPais(p)).size).toBeGreaterThanOrEqual(3);
      expect(partidosDoPais(p).every(x => x.startsWith('~'))).toBe(true);
    }
  });
});
