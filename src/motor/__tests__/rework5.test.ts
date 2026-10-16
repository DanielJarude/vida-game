/**
 * REWORK 5 — MUNDO VIVO, PROFUNDIDADE SISTÊMICA. Testes causais: cada um segue a cadeia ação → mundo → consequência →
 * o que persiste (salvar e reabrir) → o que a tela lê. Os bugs do playtest viraram invariantes.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, pessoaNova } from './cenarios';
import { nova, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { disponibilidade, executar, type Acao } from '../acoes';
import { interpretar } from '../save';
import { podeTentar } from '../plausibilidade';
import { idade, somarExperiencia, transacao } from '../nucleo';
import { vincular } from '../pessoas';
import { anosDePratica, garantirFrente, habilidade, leituraDaFrente } from '../sistemas/frentes';
import { ALCANCE_MAXIMO, contaDoPost } from '../sistemas/redes';
import { seguidoresEmPalavras } from '../sistemas/redesBase';
import { PLATAFORMAS } from '../dados/redes';
import { coerenciaTemporal, verificarCoerencia } from '../sistemas/coerencia';
import { bloqueioDaLiberdade, leituraDaPena, processarPrisao } from '../sistemas/prisao';
import { noticiasDoAno, processarMundoVivo } from '../sistemas/mundoVivo';
import { criarProposta, transferirPara } from '../sistemas/esporte';
import { candidatosDoAno, trajetoriaDeSituacao } from '../sistemas/situacoes';
import { formatarDinheiroCurto } from '../mundo/moeda';
import type { Vida } from '../tipos';

const reabrir = (v: Vida) => { const r = interpretar(JSON.stringify(v)); expect(r.tipo, r.tipo === 'invalido' ? r.motivo : '').toBe('ok'); return (r as { vida: Vida }).vida; };
const pode = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const P = (oque: string) => ({ tipo: 'prisao', oque }) as Acao;

/* ===================================================================== 1. Bugs do playtest */

describe('1.1 "Um ano de fundamentos" não envelhece ninguém', () => {
  it('a inscrição não mexe na idade nem no tempo; o treino acontece quando o ano passa (pelo mecanismo central)', () => {
    let v = adulto(14, { semente: 41 });
    garantirFrente(v, 'futebol');
    v.caminhos.frentes.futebol!.habilidade = 50; v.caminhos.frentes.futebol!.meses = 60; v.caminhos.frentes.futebol!.tInicio = v.t - 72;
    v.caminhos.esporte = undefined;
    const t0 = v.t, i0 = idade(v), h0 = habilidade(v, 'futebol'), m0 = v.caminhos.frentes.futebol!.meses;
    const a = { tipo: 'perseguir', oque: 'treino_fundamentos', valor: 'futebol' } as unknown as Acao;
    expect(pode(v, a)).toBe(true);
    v = executar(v, a).vida;
    expect(v.t).toBe(t0);
    expect(idade(v)).toBe(i0);
    expect(habilidade(v, 'futebol')).toBe(h0);
    expect(v.caminhos.frentes.futebol!.meses).toBe(m0);
    // O programa está em andamento (não dá para "comprar" dois anos num clique).
    expect(pode(v, a)).toBe(false);
    v = reabrir(v);
    v = avancarAno(v).vida;
    expect(idade(v)).toBe(i0 + 1);
    expect(habilidade(v, 'futebol')).toBeGreaterThan(h0);
    expect(v.fatos['fundamentos_futebol_ate']).toBeUndefined();
  });
});

describe('1.2 tempo de prática e de estrada coerentes com a idade', () => {
  it('17 anos com prática intensa: "há N anos" nunca passa do calendário (antes: 25 anos de futebol aos 17)', () => {
    const v = adulto(17, { semente: 42 });
    garantirFrente(v, 'futebol');
    const f = v.caminhos.frentes.futebol!;
    f.meses = 300; f.tInicio = v.t - 9 * 12; f.habilidade = 60; f.tUltimo = v.t;
    expect(anosDePratica(v, f)).toBe(9);
    expect(leituraDaFrente(v, 'futebol')).not.toMatch(/Há (1\d|2\d) anos/);
    expect(coerenciaTemporal(v)).toEqual([]);
  });

  it('nenhuma trilha ganha mais que 12 meses de experiência num ano, venha de onde vier', () => {
    const v = adulto(30, { semente: 43 });
    v.trabalho.experiencia = {};
    expect(somarExperiencia(v, 'comercio', 12)).toBe(12);
    expect(somarExperiencia(v, 'comercio', 6)).toBe(0);
    expect(somarExperiencia(v, 'informal', 6)).toBe(6);
    v.t += 12;
    expect(somarExperiencia(v, 'comercio', 8)).toBe(8);
    expect(v.trabalho.experiencia.comercio).toBe(20);
  });

  it('vidas inteiras: nenhuma invariante de tempo quebra a cada ano', () => {
    for (const s of [3, 7]) {
      let v = nova({ semente: 5100 + s });
      for (let k = 0; k < 40 && !v.morte; k++) {
        const antes = v.biografia.length;
        v = avancarAno(v).vida;
        while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida;
        expect(verificarCoerencia(v, antes)).toEqual([]);
      }
    }
  });
});

describe('1.3 redes sociais com números plausíveis (antes: 3,7 bilhões de visualizações num post)', () => {
  const tk = PLATAFORMAS.tiktok;
  const max = { q: 9, notoriedade: 100, criador: 1.3, saturacao: 1, credibilidade: 100, promover: true, sorte: [1, 0, 1, 1] as [number, number, number, number] };
  it('o post comum não passa de ~2,5× o público; o viral é público novo, com teto; o ganho tem teto e retorno decrescente', () => {
    const comum = contaDoPost(tk, 100_000, 0, { ...max, sorte: [1, 0.99, 1, 1] });
    expect(comum.viral).toBe(false);
    expect(comum.alcance).toBeLessThanOrEqual(tk.piso * 6 + 100_000 * 2.5);
    expect(comum.novos).toBeLessThanOrEqual(100_000 * 0.04);
    const viral = contaDoPost(tk, 100_000, 0, max);
    expect(viral.viral).toBe(true);
    expect(viral.novos).toBeLessThanOrEqual(100_000 * 0.5);
    const gigante = contaDoPost(tk, 80_000_000, 0, max);
    expect(gigante.alcance).toBeLessThanOrEqual(ALCANCE_MAXIMO);
    expect(gigante.novos).toBeLessThan(80_000_000 * 0.05);
  });
  it('as plataformas continuam diferentes: o mesmo post no TikTok alcança mais que no Facebook', () => {
    const f = { q: 1.4, notoriedade: 0, criador: 1, saturacao: 1, credibilidade: 60, promover: false, sorte: [0.5, 0.99, 0.5, 0.5] as [number, number, number, number] };
    expect(contaDoPost(PLATAFORMAS.tiktok, 5000, 0, f).alcance).toBeGreaterThan(contaDoPost(PLATAFORMAS.facebook, 5000, 0, f).alcance);
  });
  it('as palavras dos números: bilhão existe; "1000 mil" não', () => {
    expect(seguidoresEmPalavras(3_736_000_000)).toBe('3,7 bilhões');
    expect(seguidoresEmPalavras(999_700)).toBe('1 milhão');
    expect(seguidoresEmPalavras(1_200)).toBe('1,2 mil');
  });
  it('comprar seguidores: um pacote por ano e por conta', () => {
    let v = adulto(20, { semente: 44 });
    v.financas.conta = 100000;
    v = executar(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } } as Acao).vida;
    const compra = { tipo: 'rede', op: { oque: 'comprar', plataforma: 'instagram', pacote: 0 } } as Acao;
    expect(pode(v, compra)).toBe(true);
    v = executar(v, compra).vida;
    expect(pode(v, compra)).toBe(false);
  });
});

describe('1.4 valores que cabem', () => {
  it('acima do bilhão, "tri"; o valor curto nunca vira "1.000,0 bi"', () => {
    expect(formatarDinheiroCurto(2.5e12, 'BR')).toMatch(/2,5 tri$/);
    expect(formatarDinheiroCurto(3.2e9, 'BR')).toMatch(/3,2 bi$/);
  });
});

/* ===================================================================== 2. O mundo vivo */

describe('2. o mundo acontece sem o clique', () => {
  it('amigos têm filhos, se casam, abrem negócios — com estado que fica, notícia no ano e save/reload', () => {
    let achou = false;
    for (let k = 0; k < 40 && !achou; k++) {
      const v = adulto(32, { semente: 45 });
      v.id = `${v.id}-mv${k}`;
      const p = pessoaNova(v, 31, 'feminino', { parceiroId: 'fora' });
      vincular(v, p, { origem: 'escola', proximidade: 75, estagio: 'amigo_proximo' });
      const antes = v.biografia.length;
      for (let ano = 0; ano < 6 && !achou; ano++) {
        v.t += 12;
        processarMundoVivo(v);
        if ((p.nFilhos ?? 0) > 0 || p.ocupacao?.startsWith('don')) achou = true;
      }
      if (achou) {
        const ns = noticiasDoAno(v, antes);
        expect(ns.some(n => n.pessoas.includes(p.id))).toBe(true);
        const r = reabrir(v);
        expect(r.pessoas[p.id].nFilhos ?? 0).toBe(p.nFilhos ?? 0);
        expect(r.pessoas[p.id].ocupacao).toBe(p.ocupacao);
      }
    }
    expect(achou).toBe(true);
  });

  it('a chefia é trocada sozinha: chega uma pessoa nova e o clima recomeça (o clima decide promoção e demissão)', () => {
    let trocou = false;
    for (let k = 0; k < 80 && !trocou; k++) {
      const v = adulto(35, { semente: 46 });
      v.id = `${v.id}-ch${k}`;
      v.trabalho.atual = { ocupacaoId: 'vendedor', empregador: 'uma loja', contrato: 'clt', salario: 2600, tInicio: v.t - 48, desempenho: 70, municipioId: v.moradia.municipioId, carga: 'integral', clima: 85 };
      v.t += 12;
      processarMundoVivo(v);
      const chave = `trabalho:uma loja:${v.trabalho.atual.tInicio}`;
      const nova = Object.values(v.vinculos).find(x => x.ambiente === chave && ['gestor', 'gestora'].includes(v.pessoas[x.pessoaId].ocupacao ?? ''));
      if (nova) { trocou = true; expect(v.trabalho.atual.clima).toBeLessThan(85); expect(v.biografia.some(e => e.fato?.tipo === 'mundo' && e.pessoas?.includes(nova.pessoaId))).toBe(true); }
    }
    expect(trocou).toBe(true);
  });

  it('frequência: anos tranquilos existem; o mundo não vira novela (no máximo 3 acontecimentos autônomos por ano)', () => {
    const v = adulto(30, { semente: 47 });
    for (let k = 0; k < 6; k++) { const p = pessoaNova(v, 30 + k, k % 2 ? 'masculino' : 'feminino', { parceiroId: 'fora' }); vincular(v, p, { origem: 'trabalho', proximidade: 70, estagio: 'amigo_proximo' }); }
    let silencio = 0;
    for (let ano = 0; ano < 20; ano++) {
      const antes = v.biografia.length;
      v.t += 12;
      processarMundoVivo(v);
      const n = v.biografia.slice(antes).filter(e => e.fato?.tipo === 'mundo').length;
      expect(n).toBeLessThanOrEqual(3);
      if (n === 0) silencio++;
    }
    expect(silencio).toBeGreaterThan(0);
  });
});

/* ===================================================================== 3. A prisão como camada */

function presa(semente = 48): Vida {
  const v = adulto(28, { semente });
  v.justica = { antecedentes: [{ t: v.t, categoria: 'mercado', desfecho: 'prisao', anos: 5 }], prisao: { tInicio: v.t, tFim: v.t + 24, regime: 'fechado', penaMeses: 60, disciplina: 70 } };
  v.trabalho.atual = undefined;
  return v;
}

describe('3. a prisão muda a vida — e tem a sua própria vida', () => {
  it('a porta central: quem está preso não compra carro, não muda de cidade, não vai ao cinema com ninguém', () => {
    const v = presa();
    for (const tipo of ['comprar_veiculo', 'mudar_cidade', 'experiencia', 'matricular', 'sair_de_casa', 'adotar_pet']) expect(bloqueioDaLiberdade(v, tipo), tipo).toBeDefined();
    const { p } = comParceiro(v);
    expect(pode(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'cinema' } as Acao)).toBe(false);
    // O que cabe numa visita, cabe.
    expect(bloqueioDaLiberdade(v, 'pessoa')).toBeUndefined();
  });

  it('a rotina de dentro: estudar e trabalhar remem; a pena lida mostra regime, tempo, remição e saída', () => {
    let v = presa();
    v = executar(v, P('estudar')).vida;
    v = executar(v, P('trabalhar')).vida;
    const fim0 = v.justica!.prisao!.tFim;
    v = avancarAno(v).vida;
    while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes[0].id }).vida;
    if (v.justica?.prisao) {
      const l = leituraDaPena(v)!;
      expect(l.remidos).toBeGreaterThanOrEqual(6);
      expect(v.justica.prisao.tFim).toBeLessThan(fim0);
      expect(l.cumpridos).toBe(12);
      expect(l.pena).toBe(60);
    }
    expect(reabrir(v).justica?.prisao?.remidos).toBe(v.justica?.prisao?.remidos);
  });

  it('o pavilhão pressiona: uma situação com respostas que deixam marca na disciplina (e não instrução de nada)', () => {
    let v = presa(49);
    let viu = false;
    for (let k = 0; k < 15 && !viu; k++) {
      v = transacao(v, x => { x.t += 12; x.justica!.prisao!.tFim = x.t + 36; processarPrisao(x); }).vida;
      const l = leituraDaPena(v)!;
      if (l.situacao) {
        viu = true;
        const d0 = v.justica!.prisao!.disciplina!;
        const resp = l.situacao.respostas.find(x => x.oque === 'motim_participar' || x.oque === 'briga_enfrentar' || x.oque === 'faccao_aceitar') ?? l.situacao.respostas[0];
        v = executar(v, P(resp.oque)).vida;
        expect(v.justica!.prisao!.pendente).toBeUndefined();
        if (resp.oque !== 'faccao_recusar' && resp.oque !== 'motim_ficar' && resp.oque !== 'briga_evitar') expect(v.justica!.prisao!.disciplina!).toBeLessThan(d0 + 1);
      }
    }
    expect(viu).toBe(true);
  });

  it('a fuga é escolha de alto risco: falhar aumenta a pena e fecha o regime; conseguir vira a vida de foragido (sem carteira)', () => {
    let falhou = false, fugiu = false;
    for (let k = 0; k < 60 && !(falhou && fugiu); k++) {
      let v = presa(50); v.id = `${v.id}-f${k}`;
      v.justica!.prisao!.regime = 'semiaberto';
      const fim0 = v.justica!.prisao!.tFim;
      v = executar(v, P('fugir')).vida;
      if (v.justica?.foragido) {
        fugiu = true;
        expect(bloqueioDaLiberdade(v, 'candidatar')).toBeDefined();
        expect(bloqueioDaLiberdade(v, 'migrar')).toBeDefined();
        const r = reabrir(v);
        expect(r.justica?.foragido?.restante).toBe(v.justica.foragido.restante);
        v = executar(v, P('entregar_se')).vida;
        expect(v.justica?.prisao?.regime).toBe('fechado');
      } else {
        falhou = true;
        expect(v.justica!.prisao!.tFim).toBeGreaterThan(fim0);
        expect(v.justica!.prisao!.regime).toBe('fechado');
      }
    }
    expect(falhou && fugiu).toBe(true);
  });
});

/* ===================================================================== 4. Carreiras */

describe('4. carreiras com o seu próprio ofício', () => {
  const comEmprego = (ocupacaoId: string, contrato: 'clt' | 'autonomo' | 'servidor' = 'clt') => {
    const v = adulto(34, { semente: 51 });
    v.trabalho.atual = { ocupacaoId, empregador: 'um lugar', contrato, salario: 5000, tInicio: v.t - 60, desempenho: 66, municipioId: v.moradia.municipioId, carga: 'integral' };
    v.educacao.matricula = undefined;
    return v;
  };
  it('a advogada vive a audiência; o professor, a turma; a enfermeira, o turno — e o emprego genérico continua lá', () => {
    for (const [oc, cena] of [['advogado_jr', 'dir_audiencia'], ['professor_fund', 'doc_turma'], ['enfermeiro', 'sau_plantao']] as const) {
      const v = comEmprego(oc);
      const tr = trajetoriaDeSituacao(v);
      expect(tr).toBe('emprego');
      const ids = candidatosDoAno(v, tr!).map(x => x.m.id);
      expect(ids, oc).toContain(cena);
      expect(ids).toContain('emp_erro');
    }
  });

  it('futebol: a transferência tem dois dinheiros — a taxa é entre os clubes; as luvas são suas', () => {
    let v = adulto(23, { semente: 52 });
    v = transacao(v, x => {
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Clube A', nivel: 3, tInicio: x.t - 60, tFase: x.t - 36, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 60, contratoAte: x.t + 30, espaco: 'titular' };
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Clube A', contrato: 'clt', salario: 20000, tInicio: x.t - 36, desempenho: 70, municipioId: x.moradia.municipioId, carga: 'integral' };
    }).vida;
    let conta = 0;
    v = transacao(v, x => {
      const p = criarProposta(x, x.caminhos.esporte!, 4, 'maior')!;
      expect(p.taxa).toBeGreaterThan(0);
      expect(p.luvas).toBeGreaterThan(0);
      expect(p.luvas!).toBeLessThan(p.taxa!);
      conta = x.financas.conta;
      transferirPara(x, x.caminhos.esporte!, p);
      expect(x.financas.conta).toBe(conta + p.luvas!);
      expect(x.caminhos.esporte!.transferencias?.[0]).toMatchObject({ de: 'Clube A', taxa: p.taxa });
    }).vida;
    expect(reabrir(v).caminhos.esporte?.transferencias?.length).toBe(1);
  });
});

describe('5. a vida inteira roda com tudo ligado (um nascimento até os 30)', () => {
  it('sem quebrar, e com o mundo produzindo notícias', () => {
    let v = viverAte(nova({ semente: 5301 }), 30);
    expect(v.morte).toBeFalsy();
    let noticias = 0;
    for (let k = 0; k < 6; k++) { const a = v.biografia.length; v = avancarAno(v).vida; while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes[0].id }).vida; noticias += noticiasDoAno(v, a).length; }
    expect(noticias).toBeGreaterThan(0);
    reabrir(v);
  });
});
