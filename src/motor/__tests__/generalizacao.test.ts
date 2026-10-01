/**
 * Generalização de carreiras, realizações, histórico, momentos e legado.
 * Testes CAUSAIS: ação → estado → acontecimento → consequência → histórico
 * → save/reload → leitura (a mesma que a tela usa).
 *
 *   A futebol (empréstimo, rota amadora)   F medicina
 *   B basquete (função, equipe, cidade)    G política (nome ≠ resultado, mandato)
 *   C tênis (torneios, finais, ranking)    H militar (postos, guarnições, momentos)
 *   D atuação (filmografia, prêmios)       I emprego comum (cargos dentro da empresa)
 *   E academia (a obra item a item)        J trocar de carreira não apaga
 *   K save antigo (proposta não persistida), L universidade vivida, M campo
 */

import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { executar } from '../acoes';
import { exportarVida, importarVida } from '../save';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Temporada, Vida } from '../tipos';
import { garantirFrente } from '../sistemas/frentes';
import { contratar, encerrarEmprego, registrarPosto } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { carreirasEsportivas, criarProposta, encerrarCarreira, entrarNaBase, fecharTemporada, processarEsporte, profissionalizar, propostaNaMesa, voltarDoEmprestimo } from '../sistemas/esporte';
import { avaliarTemporada, leituraDoPalmares, registrarTemporada } from '../sistemas/palmares';
import { historicoDaCarreira, resumoDaCarreira } from '../sistemas/perfisEsportivos';
import { olharDaSelecao } from '../sistemas/selecao';
import { trajetoriasDaVida, legadoEmFrases } from '../sistemas/legado';
import { concluirProducao, iniciarProducao, novaProposta } from '../sistemas/audiovisual';
import { executarAcademia, processarAcademia, vidaAcademica } from '../sistemas/academia';
import { entrarNaPolitica, mandatosDaVida, registrarNoMandato, renunciar } from '../sistemas/politica';
import { transferir } from '../sistemas/militar';
import { distribuicao, intencoesDe, modeloDaSituacao, resolverSituacao, trajetoriaDeSituacao } from '../sistemas/situacoes';
import { anoDaAtividade, pesoNaPesquisa } from '../sistemas/formacao';
import { iniciarRural, processarRural } from '../sistemas/rural';
import { portasDaPolitica } from '../sistemas/politica';
import { retrospectiva } from '../sistemas/retrospectiva';

const recarregar = (v: Vida): Vida => { const l = importarVida(exportarVida(v)); if (l.tipo !== 'ok') throw new Error(`save: ${l.tipo}`); return l.vida; };
const abrir = (v: Vida, id: string): Vida => transacao(v, (x, r) => { const d = conteudoPorId(id); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;
const decidir = (v: Vida, opcaoId: string): Vida => executar(v, { tipo: 'decidir', opcaoId }).vida;

let base: Vida | undefined;
/** Um adulto de 20 anos (a mesma vida para todos os cenários: rápido e comparável). */
const vinte = (): Vida => structuredClone((base ??= adulto(20, { semente: 31, genero: 'masculino', municipioId: 'campina-grande-pb' })));

/** Um atleta profissional da modalidade, já com contrato. */
function atleta(d: 'futebol' | 'basquete' | 'tenis' | 'natacao', o: { habilidade?: number; nivel?: number; clube?: string } = {}): Vida {
  return transacao(vinte(), x => {
    garantirFrente(x, d);
    Object.assign(x.caminhos.frentes[d]!, { habilidade: o.habilidade ?? 84, interesse: 90, meses: 140, auge: o.habilidade ?? 84 });
    x.trabalho.atual = undefined; x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined;
    x.financas.conta += 300000;
    entrarNaBase(x, d, x.moradia.municipioId, o.clube ?? (d === 'futebol' ? 'Treze' : d === 'tenis' ? 'academia de tênis de Campina Grande' : 'equipe da prefeitura de Campina Grande'));
    profissionalizar(x, criarRng(1), o.nivel ?? 2);
    x.momento = null; x.caminhos.pendente = undefined;
  }).vida;
}

const temporada = (o: Partial<Temporada> & { clube: string }): Temporada => ({ ano: 2047, nivel: 3, partidas: 30, titular: 26, gols: 0, assistencias: 0, nota: 7, colocacao: 6, mesesFora: 0, ...o });

/* ============================================================ A. Futebol */

describe('A · futebol: o empréstimo de verdade', () => {
  it('o clube detentor mantém o contrato; o jogador vai, joga, volta — e o histórico conta as duas coisas', () => {
    let v = atleta('futebol', { habilidade: 84, nivel: 3, clube: 'Sport' });
    v = transacao(v, x => { const e = x.caminhos.esporte!; e.clube = 'Sport'; e.municipioId = 'recife-pe'; e.nivel = 3; e.espaco = 'reserva'; e.contratoAte = x.t + 30; x.trabalho.atual!.empregador = 'o Sport'; x.trabalho.atual!.salario = 9000; }).vida;
    const contratoAntes = v.caminhos.esporte!.contratoAte;
    v = transacao(v, x => { criarProposta(x, x.caminhos.esporte!, 2, 'emprestimo'); x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    const p = propostaNaMesa(v)!;
    expect(p.origem).toBe('emprestimo');
    expect(p.salario).toBe(9000);
    v = abrir(v, 'esp_proposta');
    expect(v.momento?.titulo).toBe('Um empréstimo');
    expect(v.momento?.texto).toContain(p.clube);
    v = recarregar(v);
    v = decidir(v, 'aceitar');
    const e = v.caminhos.esporte!;
    expect(e.clube).toBe(p.clube);
    expect(e.emprestimo?.clube).toBe('Sport');
    expect(e.contratoAte).toBe(contratoAntes);
    expect(v.trabalho.atual!.salario).toBe(9000);
    expect(v.trabalho.atual!.empregador).toContain('emprestado');
    expect(v.biografia.some(b => /^Emprestado a/.test(b.texto))).toBe(true);
    // A temporada de empréstimo é do clube onde se joga, e lembra de quem é o contrato.
    v = recarregar(v);
    v = transacao(v, (x, r) => { const t = fecharTemporada(x, r, x.caminhos.esporte!); expect(t.clube).toBe(p.clube); expect(t.emprestado).toBe('Sport'); }).vida;
    v = transacao(v, x => { voltarDoEmprestimo(x, x.caminhos.esporte!); }).vida;
    expect(v.caminhos.esporte!.clube).toBe('Sport');
    expect(v.caminhos.esporte!.emprestimo).toBeUndefined();
    expect(v.moradia.municipioId).toBe('recife-pe');
    const tabela = historicoDaCarreira(v.caminhos.esporte!);
    expect(tabela.linhas.some(l => /emprestado pelo Sport/.test(l[0]))).toBe(true);
    expect(v.biografia.some(b => /^Voltou ao Sport depois do empréstimo/.test(b.texto))).toBe(true);
    expect(recarregar(v).caminhos.esporte!.clube).toBe('Sport');
  });

  it('no fim do empréstimo, ficar de vez é uma proposta (compra) — aceitar encerra o vínculo com o detentor', () => {
    let v = atleta('futebol', { habilidade: 84, nivel: 3 });
    v = transacao(v, x => { const e = x.caminhos.esporte!; e.contratoAte = x.t + 30; criarProposta(x, e, 2, 'emprestimo'); }).vida;
    v = transacao(v, x => { const e = x.caminhos.esporte!; const pr = propostaNaMesa(x)!; e.proposta = pr; }).vida;
    v = transacao(v, x => { x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    v = abrir(v, 'esp_proposta'); v = decidir(v, 'aceitar');
    const emprestadoPara = v.caminhos.esporte!.clube;
    v = transacao(v, x => { criarProposta(x, x.caminhos.esporte!, 2, 'compra'); x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    v = abrir(v, 'esp_proposta');
    expect(v.momento?.titulo).toBe('Ficar de vez?');
    v = decidir(v, 'aceitar');
    expect(v.caminhos.esporte!.clube).toBe(emprestadoPara);
    expect(v.caminhos.esporte!.emprestimo).toBeUndefined();
    expect(v.biografia.some(b => /^Ficou de vez/.test(b.texto))).toBe(true);
  });
});

describe('A · futebol: a rota tardia emerge do sistema (sem bônus por começar tarde)', () => {
  it('quem joga o campeonato amador com técnica de estadual pode ser visto — e entra pelo teste do time de cima', () => {
    let achou = false;
    for (let s = 1; s <= 30 && !achou; s++) {
      let v = transacao(vinte(), x => {
        x.caminhos.esporte = undefined; x.trabalho.atual = undefined;
        garantirFrente(x, 'futebol');
        Object.assign(x.caminhos.frentes.futebol!, { habilidade: 82, interesse: 90, meses: 60, auge: 82 });
        x.rotinas = x.rotinas.filter(r => r.id !== 'futebol'); x.rotinas.push({ id: 'futebol', tInicio: x.t - 36, nivel: 3 });
      }).vida;
      for (let k = 0; k < 4 && !v.caminhos.oportunidades.some(o => o.atividade === 'amador'); k++) v = transacao(v, (x) => { x.t += 12; processarEsporte(x, criarRng(s * 100 + k)); }).vida;
      const o = v.caminhos.oportunidades.find(x => x.atividade === 'amador');
      if (!o) continue;
      expect(o.titulo).toMatch(/^Teste n[oa] /);
      const hAntes = v.caminhos.frentes.futebol!.habilidade;
      v = executar(v, { tipo: 'oportunidade', id: o.id, aceitar: true }).vida;
      for (let k = 0; k < 6 && v.momento; k++) v = decidir(v, v.momento.opcoes.find(x => !x.bloqueio && ['p0', 'p2', 'assinar'].includes(x.id))?.id ?? v.momento.opcoes.find(x => !x.bloqueio)!.id);
      if (v.caminhos.esporte?.fase !== 'profissional') continue;
      achou = true;
      const e = v.caminhos.esporte;
      expect(e.origem).toBe('amador');
      expect(e.nivel).toBe(1);
      // A técnica é a mesma: a rota não deu nada de graça.
      expect(v.caminhos.frentes.futebol!.habilidade).toBeCloseTo(hAntes, 0);
      expect(v.biografia.some(b => /campeonato amador/.test(b.texto))).toBe(true);
      expect(recarregar(v).caminhos.esporte!.origem).toBe('amador');
    }
    expect(achou).toBe(true);
  }, 120000);

  it('técnica de pelada não é vista: abaixo da régua do estadual, o teste não aparece', () => {
    let v = transacao(vinte(), x => {
      x.caminhos.esporte = undefined;
      garantirFrente(x, 'futebol');
      Object.assign(x.caminhos.frentes.futebol!, { habilidade: 62, interesse: 90, meses: 60, auge: 62 });
      x.rotinas = x.rotinas.filter(r => r.id !== 'futebol'); x.rotinas.push({ id: 'futebol', tInicio: x.t - 36, nivel: 3 });
    }).vida;
    for (let k = 0; k < 4; k++) v = transacao(v, x => { x.t += 12; processarEsporte(x, criarRng(500 + k)); }).vida;
    expect(v.caminhos.oportunidades.some(o => o.atividade === 'amador')).toBe(false);
  });
});

/* ============================================================ B. Basquete */

describe('B · basquete: a função importa, a equipe tem cidade, o país observa', () => {
  it('o pivô é medido pelo rebote; o armador, pela assistência', () => {
    const v = atleta('basquete');
    const e = v.caminhos.esporte!;
    const pivoReb = temporada({ clube: e.clube, funcao: 'pivo', pontos: 12, rebotes: 11, assistencias: 1 });
    const pivoSem = temporada({ clube: e.clube, funcao: 'pivo', pontos: 12, rebotes: 4, assistencias: 1 });
    const armAst = temporada({ clube: e.clube, funcao: 'armador', pontos: 11, rebotes: 3, assistencias: 8 });
    const armSem = temporada({ clube: e.clube, funcao: 'armador', pontos: 11, rebotes: 3, assistencias: 2 });
    expect(avaliarTemporada(e, pivoReb).indice).toBeGreaterThan(avaliarTemporada(e, pivoSem).indice);
    expect(avaliarTemporada(e, armAst).indice).toBeGreaterThan(avaliarTemporada(e, armSem).indice);
    // A mesma linha de números não vale o mesmo para funções diferentes.
    expect(avaliarTemporada(e, { ...pivoReb, funcao: 'armador' }).indice).not.toBe(avaliarTemporada(e, pivoReb).indice);
  });

  it('a proposta é de outra equipe, de outra cidade: aceitar muda a cidade e o histórico por equipe', () => {
    let v = atleta('basquete', { habilidade: 86 });
    v = transacao(v, x => { criarProposta(x, x.caminhos.esporte!, 3, 'mercado'); x.fatos['esp_proposta_hoje'] = x.t; }).vida;
    const p = propostaNaMesa(v)!;
    expect(p.clube).toMatch(/^equipe de basquete de /);
    expect(p.municipioId).not.toBe(v.moradia.municipioId);
    v = abrir(v, 'esp_proposta'); v = decidir(v, 'aceitar');
    expect(v.caminhos.esporte!.clube).toBe(p.clube);
    expect(v.moradia.municipioId).toBe(p.municipioId);
    expect(v.biografia.some(b => b.texto.includes(p.clube))).toBe(true);
    v = transacao(v, (x, r) => { const t = fecharTemporada(x, r, x.caminhos.esporte!); registrarTemporada(x, r, x.caminhos.esporte!, t); }).vida;
    const h = historicoDaCarreira(v.caminhos.esporte!);
    expect(h.colunas).toContain('Rebotes/j');
    expect(resumoDaCarreira(v.caminhos.esporte!)).toMatch(/pontos por jogo/);
  });

  it('o cestinha é um fato do placar; e a seleção de basquete olha o mérito, nunca a fama', () => {
    let premiou = false;
    for (let s = 1; s <= 30 && !premiou; s++) {
      const v = transacao(atleta('basquete'), (x, r) => {
        const e = x.caminhos.esporte!; e.nivel = 3;
        const t = temporada({ clube: e.clube, nivel: 3, funcao: 'ala', pontos: 24, rebotes: 5, assistencias: 3, nota: 8.3, colocacao: 3 });
        (e.temporadas ??= []).push(t);
        registrarTemporada(x, criarRng(s), e, t); void r;
      }).vida;
      premiou = leituraDoPalmares(v).premios.some(p => /Cestinha/.test(p));
    }
    expect(premiou).toBe(true);
    const v = atleta('basquete', { habilidade: 92, nivel: 4 });
    const t = temporada({ clube: v.caminhos.esporte!.clube, nivel: 4, funcao: 'pivo', pontos: 16, rebotes: 11, assistencias: 2, nota: 8.2, colocacao: 2 });
    v.caminhos.esporte!.temporadas = [t]; v.caminhos.esporte!.reputacao = 80;
    const famoso = structuredClone(v); famoso.notoriedade = { valor: 95, pico: 95, fonte: 'esporte', t: v.t };
    expect(olharDaSelecao(v, v.caminhos.esporte!)).toBeGreaterThan(60);
    expect(olharDaSelecao(famoso, famoso.caminhos.esporte!)).toBe(olharDaSelecao(v, v.caminhos.esporte!));
  });
});

/* ============================================================ C. Tênis */

describe('C · tênis: um ano é torneio a torneio — não um time com outro nome', () => {
  it('vitórias, derrotas, finais, títulos e o nome dos torneios saem das chaves jogadas', () => {
    let v = atleta('tenis', { habilidade: 90, nivel: 3 });
    let titulo = false;
    for (let s = 1; s <= 12; s++) {
      v = transacao(v, (x) => {
        const t = fecharTemporada(x, criarRng(s), x.caminhos.esporte!);
        expect(t.derrotas).toBe(t.partidas - (t.titulos ?? 0));
        expect(t.titulos ?? 0).toBeLessThanOrEqual(t.finais ?? 0);
        expect(t.melhorFase).toBeTruthy();
        if ((t.titulos ?? 0) > 0) titulo = true;
      }).vida;
    }
    expect(titulo).toBe(true);
    const h = historicoDaCarreira(v.caminhos.esporte!);
    expect(h.agrupado).toBe('ano');
    expect(h.colunas).toEqual(expect.arrayContaining(['V–D', 'Finais', 'Títulos', 'Ranking', 'Prêmios']));
    expect(h.colunas).not.toContain('Clube');
    expect(resumoDaCarreira(v.caminhos.esporte!)).toMatch(/anos de circuito.*vitórias/);
  });

  it('o ano no circuito vira palmarés com nome de torneio; a equipe do país olha o ranking', () => {
    let v = atleta('tenis', { habilidade: 92, nivel: 3 });
    for (let k = 0; k < 6; k++) v = transacao(v, (x, r) => { x.t += 12; processarEsporte(x, r); }).vida;
    const pal = (v.caminhos.palmares ?? []).filter(c => c.modalidade === 'tenis');
    expect(pal.some(c => c.tipo === 'titulo' && /^Campe(ão|ã) d/.test(c.texto)) || pal.some(c => c.tipo === 'final')).toBe(true);
    const e = v.caminhos.esporte!;
    const bom = { ...e, temporadas: [temporada({ clube: e.clube, ranking: 30, nota: 7 })] };
    const fraco = { ...e, temporadas: [temporada({ clube: e.clube, ranking: 900, nota: 7 })] };
    expect(olharDaSelecao(v, bom)).toBeGreaterThan(olharDaSelecao(v, fraco));
    expect(recarregar(v).caminhos.palmares).toEqual(v.caminhos.palmares);
  });
});

/* ============================================================ D. Atuação */

describe('D · atuação: a filmografia existe, o primeiro protagonista é memória, o prêmio é raro', () => {
  it('produção concluída → currículo com papel e repercussão → marco do primeiro protagonista → legado', () => {
    let premio = false;
    let v = transacao(vinte(), x => { garantirFrente(x, 'teatro'); Object.assign(x.caminhos.frentes.teatro!, { habilidade: 90, meses: 120, interesse: 90, auge: 90 }); x.rotinas.push({ id: 'teatro', tInicio: x.t - 60, nivel: 2 }); }).vida;
    for (let s = 1; s <= 25; s++) {
      v = transacao(v, x => { x.t += 6; const c = novaProposta(x, { tipo: s % 2 ? 'serie' : 'filme', porte: 3, papel: 'protagonista', casa: 'uma plataforma de streaming', titulo: `Obra ${s}` }); iniciarProducao(x, c); concluirProducao(x, c, criarRng(s)); }).vida;
      if (v.caminhos.curriculo!.some(x => x.premio)) premio = true;
    }
    expect(v.biografia.some(b => /^O primeiro papel de protagonista/.test(b.texto))).toBe(true);
    expect(v.biografia.filter(b => /^O primeiro papel de protagonista/.test(b.texto)).length).toBe(1);
    expect(premio).toBe(true);
    v = recarregar(v);
    const t = trajetoriasDaVida(v).find(x => x.area === 'atuacao')!;
    expect(t.resumo).toMatch(/trabalhos/);
    expect(t.realizacoes.some(r => /Primeiro papel de protagonista/.test(r))).toBe(true);
    expect(t.detalhe[0].linhas.length).toBeGreaterThanOrEqual(25);
  });
});

/* ============================================================ E. Academia */

describe('E · academia: o que se publicou tem nome, e fica depois do cargo', () => {
  it('projeto → artigos (com título e revista) → orientação → reload → legado; sair da universidade não apaga', () => {
    let v = transacao(vinte(), (x, r) => { x.mente.cognicao = 85; contratar(x, r, ocupacao('professor_univ'), 'concurso'); }).vida;
    for (let k = 0; k < 4; k++) {
      v = transacao(v, (x, r) => { if (!vidaAcademica(x).projeto) executarAcademia(x, r, 'projeto'); x.t += 12; processarAcademia(x); }).vida;
    }
    const a = v.caminhos.academia!;
    expect((a.producao ?? []).some(x => x.tipo === 'projeto')).toBe(true);
    expect((a.producao ?? []).filter(x => x.tipo === 'artigo').length).toBe(a.publicacoes);
    v = recarregar(v);
    v = transacao(v, x => { encerrarEmprego(x, 'pediu demissão'); }).vida;
    const t = trajetoriasDaVida(v).find(x => x.area === 'academia')!;
    expect(t.ativa).toBe(false);
    expect(t.resumo).toMatch(/artigo/);
    expect(t.detalhe.some(d => d.titulo === 'Artigos' && d.linhas.length === a.publicacoes)).toBe(true);
  });
});

/* ============================================================ F. Medicina */

describe('F · medicina: uma trajetória humana — formação, residência, onde trabalhou — sem placar de pacientes', () => {
  it('o histórico conta a formação e os cargos; nenhum número de pacientes ou de "vidas salvas"', () => {
    const v = transacao(vinte(), (x, r) => {
      x.educacao.concluidos.push({ cursoId: 'medicina', nome: 'Medicina', nivel: 'superior', area: 'medicina', tFim: x.t - 60, instituicao: 'a universidade federal' });
      x.educacao.concluidos.push({ cursoId: 'residencia', nome: 'Residência em Cirurgia Geral', nivel: 'residencia', area: 'medicina', tFim: x.t - 24, instituicao: 'o hospital universitário', especialidade: 'cirurgia' });
      const e = contratar(x, r, ocupacao('medico'), 'concurso'); e.tInicio = x.t - 60;
      encerrarEmprego(x, 'trocou de emprego');
      contratar(x, r, ocupacao('medico_hospital'), 'convite');
    }).vida;
    const t = trajetoriasDaVida(v).find(x => x.area === 'medicina')!;
    expect(t.titulo).toMatch(/^Medicina — /);
    expect(t.realizacoes.some(r => /Residência em/.test(r))).toBe(true);
    expect(t.detalhe.find(d => d.titulo === 'Onde trabalhou')!.linhas.length).toBe(2);
    const tudo = JSON.stringify(t);
    expect(tudo).not.toMatch(/pacientes atendid|vidas salvas|\d+ pacientes/i);
  });
});

/* ============================================================ G. Política */

describe('G · política: o nome famoso abre a porta e amplia o risco — não ganha sozinho; o mandato deixa história', () => {
  it('ex-atleta famoso: a trajetória esportiva continua, a política começa do começo, o mandato guarda o que aconteceu', () => {
    let v = atleta('futebol', { habilidade: 86, nivel: 3 });
    v = transacao(v, (x, r) => {
      const e = x.caminhos.esporte!;
      for (let k = 0; k < 3; k++) { const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); }
      encerrarCarreira(x, e, 'escolha');
      x.notoriedade = { valor: 70, pico: 80, fonte: 'esporte', t: x.t, origens: { esporte: 80 } };
      entrarNaPolitica(x, 'notoriedade');
      const p = x.caminhos.politica!;
      p.historico.push({ t: x.t, cargo: 'vereador', resultado: 'eleito' });
      p.mandato = { cargo: 'vereador', tInicio: x.t + 1, tFim: x.t + 49, aprovacao: 58, feito: 0 };
      x.trabalho.atual = { ocupacaoId: 'vereador', empregador: 'a Câmara Municipal', contrato: 'eletivo', salario: 9000, tInicio: x.t + 1, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral' };
      x.t += 24;
      registrarNoMandato(x, '2050 · saiu do papel: a reforma das quadras dos bairros');
    }).vida;
    expect(trajetoriaDeSituacao(v)).toBe('politica');
    // A fama amplia a entrevista ao vivo (mais gente vendo): o risco cresce — o sucesso não.
    const m = modeloDaSituacao('pol_entrevista')!;
    const anonimo = structuredClone(v); anonimo.notoriedade = { valor: 0, pico: 0, fonte: 'politica', t: v.t };
    const arriscarFamoso = intencoesDe(m, v, {}).find(i => i.id === 'arriscar')!;
    const arriscarAnonimo = intencoesDe(m, anonimo, {}).find(i => i.id === 'arriscar')!;
    const df = distribuicao(v, arriscarFamoso, {}), da = distribuicao(anonimo, arriscarAnonimo, {});
    expect(df.sucesso).toBeCloseTo(da.sucesso, 5);
    expect(df.otimo + df.pessimo).toBeGreaterThan(da.otimo + da.pessimo);
    v = transacao(v, x => { renunciar(x, 'para cuidar da família'); }).vida;
    v = recarregar(v);
    const mandatos = mandatosDaVida(v);
    expect(mandatos.length).toBe(1);
    expect(mandatos[0].como).toBe('renunciou');
    expect(mandatos[0].marcos.some(x => /reforma das quadras/.test(x))).toBe(true);
    const tr = trajetoriasDaVida(v);
    expect(tr.some(x => x.area === 'esporte' && x.titulo === 'Futebol profissional')).toBe(true);
    const pol = tr.find(x => x.area === 'politica')!;
    expect(pol.resumo).toMatch(/nome conhecido do esporte/);
  });

  it('um momento do mandato muda o mandato: o projeto negociado vira entrega registrada', () => {
    let feito = false;
    for (let s = 1; s <= 40 && !feito; s++) {
      const v = transacao(vinte(), x => {
        entrarNaPolitica(x, 'comunidade');
        const p = x.caminhos.politica!; p.prioridade = 'saude'; p.apoio = 60; p.reputacao = 60;
        p.mandato = { cargo: 'vereador', tInicio: x.t - 12, tFim: x.t + 36, aprovacao: 55, feito: 0 };
        x.trabalho.atual = { ocupacaoId: 'vereador', empregador: 'a Câmara Municipal', contrato: 'eletivo', salario: 9000, tInicio: x.t - 12, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral' };
        x.caminhos.situacao = { id: 'pol_projeto', t: x.t, dados: {} };
        const r = resolverSituacao(x, criarRng(s), 'negociar');
        if (r?.desfecho === 'otimo') { feito = true; expect(p.mandato.feito).toBe(2); expect((p.mandato.marcos ?? []).some(m => /negociando com a oposição/.test(m))).toBe(true); }
      }).vida;
      void v;
    }
    expect(feito).toBe(true);
  });
});

/* ============================================================ H. Militar */

describe('H · militar: postos, guarnições e momentos de farda (não de combate)', () => {
  it('ingresso → guarnição → transferência → os dois lugares no histórico; o momento é de apoio, não de guerra', () => {
    let v = transacao(vinte(), (x, r) => { contratar(x, r, ocupacao('sargento'), 'concurso'); x.trabalho.atual!.formacaoAte = undefined; }).vida;
    const m0 = v.caminhos.militar!;
    expect(m0.guarnicoes?.length).toBe(1);
    const destino = ['manaus-am', 'porto-alegre-rs', 'recife-pe'].find(d => d !== m0.guarnicao)!;
    v = transacao(v, x => { transferir(x, destino, false, false); }).vida;
    v = recarregar(v);
    expect(v.caminhos.militar!.guarnicoes!.map(g => g.municipioId)).toContain(destino);
    expect(trajetoriaDeSituacao(v)).toBe('militar');
    const ids = ['mil_apoio', 'mil_subordinado', 'mil_curso'].map(id => modeloDaSituacao(id)!);
    const texto = ids.map(m => (typeof m.titulo === 'string' ? m.titulo : '') + m.texto(v, { ocorrencia: 'uma enchente' })).join(' ');
    expect(texto).not.toMatch(/combate|inimigo|tiro|disparo|matar/i);
    const t = trajetoriasDaVida(v).find(x => x.area === 'militar')!;
    expect(t.detalhe.find(d => d.titulo === 'Guarnições')!.linhas.length).toBe(2);
    let elogio = false;
    for (let s = 1; s <= 40 && !elogio; s++) {
      transacao(v, x => { x.caminhos.situacao = { id: 'mil_apoio', t: x.t, dados: { ocorrencia: 'uma enchente' } }; const r = resolverSituacao(x, criarRng(s), 'adaptar'); if (r?.desfecho === 'otimo') { elogio = (x.fatos['mil_elogios'] ?? 0) > 0; } });
    }
    expect(elogio).toBe(true);
  });
});

/* ============================================================ I. Emprego comum */

describe('I · emprego comum: 35 anos numa carreira comum também são biografia', () => {
  it('a promoção dentro da empresa guarda o cargo de antes; a demissão e o emprego seguinte entram no histórico', () => {
    let v = transacao(vinte(), (x, r) => { const e = contratar(x, r, ocupacao('assistente_adm'), 'vaga'); e.tInicio = x.t - 72; e.empregador = 'a Construtora Litoral'; }).vida;
    v = transacao(v, x => { const e = x.trabalho.atual!; registrarPosto(x, e); e.ocupacaoId = 'analista_adm'; e.tPosto = x.t; }).vida;
    v = transacao(v, (x, r) => { x.t += 36; encerrarEmprego(x, 'demissão no corte de pessoal'); const e = contratar(x, r, ocupacao('analista_adm'), 'vaga'); e.empregador = 'uma distribuidora'; }).vida;
    v = recarregar(v);
    const t = trajetoriasDaVida(v).find(x => x.area === 'emprego' && /Escritório/i.test(x.titulo))!;
    expect(t).toBeTruthy();
    expect(t.resumo).toMatch(/de assistente administrativ[oa] a analista administrativ[oa]/);
    const linhas = t.detalhe[0].linhas.join(' | ');
    expect(linhas).toMatch(/assistente administrativ[oa] → analista administrativ[oa], a Construtora Litoral/);
    expect(linhas).toMatch(/demissão no corte de pessoal/);
    expect(t.realizacoes.some(r => /Saiu da Construtora Litoral: demissão/.test(r))).toBe(true);
  });
});

/* ============================================================ J. Trocar de carreira não apaga */

describe('J · uma pessoa, várias trajetórias: a carreira passada continua sendo dela', () => {
  it('atleta (com seleção) → nova modalidade → negócio → política: tudo consultável depois, e a retrospectiva conta', () => {
    let v = atleta('futebol', { habilidade: 90, nivel: 4, clube: 'São Paulo' });
    v = transacao(v, (x, r) => {
      const e = x.caminhos.esporte!;
      for (let k = 0; k < 4; k++) { x.t += 12; const t = fecharTemporada(x, r, e); t.colocacao = k === 1 ? 1 : 5; registrarTemporada(x, r, e, t); }
      e.selecao = { radar: x.t - 24, convocacoes: 3, jogos: 9, gols: 1, torneios: [{ ano: 2046, nome: 'o torneio mundial de seleções', campanha: 'caiu nas quartas', jogos: 4 }] };
      encerrarCarreira(x, e, 'escolha');
      // Uma carreira nova em outra modalidade (a seletiva de vôlei de praia, a do basquete): a antiga vai para o arquivo.
      entrarNaBase(x, 'basquete', x.moradia.municipioId, 'equipe da prefeitura de Campina Grande');
    }).vida;
    expect(carreirasEsportivas(v).length).toBe(2);
    expect(v.caminhos.esporte!.modalidade).toBe('basquete');
    expect(leituraDoPalmares(v).selecao).toMatch(/3 convocações/);
    v = recarregar(v);
    const tr = trajetoriasDaVida(v);
    const fut = tr.find(x => x.area === 'esporte' && x.titulo === 'Futebol profissional')!;
    expect(fut).toBeTruthy();
    expect(fut.realizacoes.some(r => /Campe(ão|ã) da Série A/.test(r))).toBe(true);
    expect(fut.reconhecimento.some(r => /3 convocações/.test(r))).toBe(true);
    expect(legadoEmFrases(v).some(f => /Futebol profissional/.test(f.texto))).toBe(true);
    expect(retrospectiva(v).some(f => /Futebol profissional/.test(f))).toBe(true);
  });
});

/* ============================================================ K. Save antigo */

describe('K · save antigo salvo no meio de uma proposta (anterior ao sistema): compatibilidade segura', () => {
  it('sem proposta persistida: carrega, a decisão não se executa, nenhum clube é inventado, novas propostas funcionam', () => {
    let v = atleta('futebol', { habilidade: 84 });
    const clube = v.caminhos.esporte!.clube;
    // Um save v18 de antes do pacote: a decisão `esp_proposta` aberta, o fato do dia, e nenhuma `proposta` no estado.
    const j = JSON.parse(exportarVida(v));
    const vida = j.vida ?? j;
    vida.fatos['esp_proposta_hoje'] = vida.t;
    vida.momento = { id: 'esp_proposta', tipo: 'decisao', titulo: 'Uma proposta', texto: 'O Remo quer você.', opcoes: [{ id: 'aceitar', texto: 'Aceitar' }, { id: 'recusar', texto: 'Recusar' }], t: vida.t };
    delete vida.caminhos.esporte.proposta;
    delete vida.caminhos.carreirasEsportivas; delete vida.caminhos.palcos;
    const l = importarVida(JSON.stringify(j));
    expect(l.tipo).toBe('ok');
    if (l.tipo !== 'ok') return;
    v = l.vida;
    v = executar(v, { tipo: 'decidir', opcaoId: 'aceitar' }).vida;
    expect(v.caminhos.esporte!.clube).toBe(clube);
    expect(v.biografia.some(b => /Transferiu-se|Mudou de clube/.test(b.texto))).toBe(false);
    v = transacao(v, x => { criarProposta(x, x.caminhos.esporte!, 3, 'mercado'); }).vida;
    expect(propostaNaMesa(v)?.clube).toBeTruthy();
  });
});

/* ============================================================ L. Universidade vivida */

describe('L · a universidade como experiência: história interna e consequência depois', () => {
  it('a iniciação tem etapas e o resultado pesa na pesquisa; a coordenação do centro acadêmico abre a porta estudantil', () => {
    let v = transacao(vinte(), x => {
      x.educacao.matricula = { cursoId: 'administracao', inicio: x.t - 12, previsto: x.t + 36, desempenho: 75, municipioId: x.moradia.municipioId, rede: 'publica', modalidade: 'presencial', instituicao: 'a universidade federal', mensalidade: 0, area: 'administracao' } as never;
      x.mente.cognicao = 85;
      garantirFrente(x, 'lideranca').habilidade = 60;
      x.rotinas.push({ id: 'iniciacao', tInicio: x.t, nivel: 3 }, { id: 'centro_academico', tInicio: x.t, nivel: 2 });
    }).vida;
    const etapas = new Set<string>();
    for (let k = 0; k < 6; k++) v = transacao(v, x => { x.t += 12; anoDaAtividade(x, 'iniciacao', 3); anoDaAtividade(x, 'centro_academico', 2); for (const y of x.educacao.vivencias ?? []) if (y.etapa) etapas.add(`${y.tipo}:${y.etapa}`); }).vida;
    expect([...etapas].filter(e => e.startsWith('iniciacao:')).length).toBeGreaterThanOrEqual(3);
    const ic = v.educacao.vivencias!.find(x => x.tipo === 'iniciacao')!;
    expect(ic.marcos?.length).toBeGreaterThan(0);
    if (ic.feito) expect(pesoNaPesquisa(v)).toBeGreaterThan(0.12);
    const ca = v.educacao.vivencias!.find(x => x.tipo === 'centro_academico')!;
    if (ca.feito) expect(portasDaPolitica(v).some(p => p.origem === 'estudantil') || v.fatos['gremio_eleito'] !== undefined).toBe(true);
    expect(recarregar(v).educacao.vivencias).toEqual(v.educacao.vivencias);
  });
});

/* ============================================================ M. Campo */

describe('M · o campo: as safras viram história, e a estiagem pede decisão', () => {
  it('safra a safra → histórico → a decisão da estiagem só aparece depois do ano ruim', () => {
    let v = transacao(vinte(), (x, r) => { contratar(x, r, ocupacao('produtor_rural'), 'convite'); x.trabalho.atual!.clientela = 50; iniciarRural(x, 'familia'); }).vida;
    for (let k = 0; k < 8; k++) v = transacao(v, (x, r) => { x.t += 12; processarRural(x, r); }).vida;
    v = recarregar(v);
    expect(v.caminhos.rural!.safras!.length).toBe(8);
    const t = trajetoriasDaVida(v).find(x => x.area === 'rural')!;
    expect(t.resumo).toMatch(/8 safras/);
    const est = modeloDaSituacao('rur_estiagem')!;
    v.caminhos.rural!.ultimaSafra = 'boa';
    expect(est.cabe(v)).toBe(false);
    v.caminhos.rural!.ultimaSafra = 'ruim';
    expect(est.cabe(v)).toBe(true);
  });
});
