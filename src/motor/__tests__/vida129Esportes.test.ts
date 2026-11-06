/**
 * VIDA 12.9 · Esportes — consistência dos resultados.
 *
 * O bug real: competição mundial de tênis por equipes; Portugal eliminado na fase de grupos; depois, o jogador escolheu
 * jogar "a final" com dor, e o jogo registrou "Jogou a final com dor e foi campeão." (o acontecimento `esp10_dor` não
 * consultava competição nenhuma e sorteava título). As regras:
 *   1. equipe eliminada não disputa fases posteriores; 2. a fase alcançada determina as partidas possíveis;
 *   3. a escolha narrativa só muda a chance do resultado simulado; 4. vitória, derrota, classificação e eliminação
 *   respeitadas; 5. títulos, conquistas, resumo do ano e palmarés batem; 6. o texto diz o desfecho registrado.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { CarreiraEsportiva, Dominio, Vida } from '../tipos';
import { ACONTECIMENTOS_10 } from '../conteudo/acontecimentos10';
import { abrirDecisao, preparar } from '../conteudo/motor';
import type { Decisao } from '../conteudo/base';
import { fecharTemporada } from '../sistemas/esporte';
import { registrarTemporada } from '../sistemas/palmares';
import { processarSelecao } from '../sistemas/selecao';
import { conquistasDoAno } from '../sistemas/fechamento';
import { verificarCoerencia } from '../sistemas/coerencia';
import { candidatosDoAno, modeloDaSituacao, resolverSituacao, situacaoAberta, textoDaSituacao } from '../sistemas/situacoes';
import { anoDaTemporadaEmCurso, classificadoParaFinalNacional, contradicoesEsportivas, faseTenisPlausivel, marcaDeTituloSemRegistro } from '../sistemas/esportes129';
import { anoDe } from '../tempo';

const OCUPACAO: Record<string, string> = { futebol: 'jogador_futebol', basquete: 'jogador_basquete', tenis: 'tenista' };

/** Um atleta profissional pronto (a vida-base é feita uma vez; cada caso é uma cópia com outro id e outra semente). */
const BASE = adulto(26, { semente: 21, genero: 'masculino', municipioId: 'sao-paulo-sp' });
function atleta(mod: Dominio, id: string, o: { habilidade?: number; nivel?: 1 | 2 | 3 | 4 } = {}): Vida {
  const v = transacao(BASE, x => {
    x.id = id;
    x.corpo.forma = 80;
    x.caminhos.frentes[mod] = { habilidade: o.habilidade ?? 90, interesse: 70, meses: 200, auge: 92, tInicio: x.t - 200 } as never;
    const nivel = o.nivel ?? 4;
    const e: CarreiraEsportiva = { modalidade: mod, fase: 'profissional', clube: mod === 'tenis' ? 'circuito' : `equipe de ${mod} de São Paulo`, nivel, tInicio: x.t - 72, tFase: x.t - 60, lesoes: 0, municipioId: 'sao-paulo-sp', reputacao: 60, espaco: 'titular', contratoAte: x.t + 36, temporadas: [] } as CarreiraEsportiva;
    x.caminhos.esporte = e;
    x.trabalho.atual = { ocupacaoId: OCUPACAO[mod] ?? 'atleta', empregador: 'a equipe', contrato: 'clt', salario: 20000, tInicio: x.t - 60, desempenho: 70, municipioId: 'sao-paulo-sp', carga: 'integral' };
  }).vida;
  // A semente do gerador é por caso (a transação regrava `rng` ao fim: por isso, depois dela).
  v.rng = 1 + [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return v;
}

const TITULO = /campe(ã|a)o|campeões|título|taça/i;
const titulosNoPalmares = (v: Vida) => (v.caminhos.palmares ?? []).filter(c => c.tipo === 'titulo' || (c.tipo === 'selecao' && /^(Campe|Medalha de ouro)/.test(c.texto)));

/** Abre o acontecimento e responde. */
function viverAcontecimento(v: Vida, id: string, opcao: string): { antes: Vida; depois: Vida } | undefined {
  const c = ACONTECIMENTOS_10.find(x => x.id === id) as Decisao;
  const w = transacao(v, (x, r) => { const ctx = preparar(c, x, r); if (ctx) abrirDecisao(x, c, ctx); }).vida;
  if (w.momento?.situacaoId !== id) return undefined;
  return { antes: w, depois: executar(w, { tipo: 'decidir', opcaoId: opcao }).vida };
}

/** Abre a situação de carreira (como `processarSituacoes` abriria) e resolve a intenção. */
function viverSituacao(v: Vida, id: string, intencao: string, dados: Record<string, string | number> = {}) {
  return transacao(v, (x, r) => {
    const m = modeloDaSituacao(id)!;
    x.caminhos.situacao = { id, t: x.t, dados: { ...(m.contexto?.(x, r) ?? {}), ...dados } };
    const a = situacaoAberta(x);
    if (!a) return undefined;
    const cena = textoDaSituacao(x, a.m, a.d);
    return { cena, dados: a.d, ...resolverSituacao(x, r, intencao)! };
  });
}

describe('VIDA 12.9 · o caso do tênis por equipes', () => {
  it('Portugal caiu na fase de grupos: nenhuma "final" para jogar com dor, nenhum título, nenhum texto de campeão', () => {
    let abertos = 0, jogados = 0;
    for (let k = 0; k < 40; k++) {
      const v = transacao(atleta('tenis', `t129:pt:${k}`), x => {
        const ano = anoDe(x.t - 6);
        x.caminhos.esporte!.selecao = { radar: x.t - 24, convocacoes: 2, jogos: 4, gols: 0, torneios: [{ ano, nome: 'a competição mundial por equipes', campanha: 'caiu na fase de grupos', jogos: 2 }], pais: 'PT', tUltima: x.t };
        x.caminhos.palmares = [{ tipo: 'selecao', modalidade: 'tenis', ano, t: x.t, competicao: 'a competição mundial por equipes', papel: 'protagonista', texto: 'A competição mundial por equipes: a equipe caiu na fase de grupos' }];
      }).vida;
      const r = viverAcontecimento(v, 'esp10_dor', 'jogar');
      if (!r) continue;
      abertos++;
      const m = r.antes.momento!;
      // A cena não fala de final (a equipe já tinha caído) — fala de uma competição grande, com as palavras do tênis.
      expect(`${m.titulo} ${m.texto}`).not.toMatch(/final|decis/i);
      const d = r.depois;
      const novas = d.biografia.slice(r.antes.biografia.length);
      for (const b of novas) expect(b.texto, b.texto).not.toMatch(TITULO);
      expect(novas.map(b => b.texto).join(' ')).not.toMatch(/de campo|segundo tempo/);
      expect(d.caminhos.marcas.filter(x => x.tipo === 'conquista').length).toBe(v.caminhos.marcas.filter(x => x.tipo === 'conquista').length);
      expect(titulosNoPalmares(d)).toEqual([]);
      for (const c of conquistasDoAno(d)) expect(c).not.toMatch(TITULO);
      expect(contradicoesEsportivas(d)).toEqual([]);
      if (!d.corpo.condicoes.some(c => c.lesao && c.lesao.tFim > d.t)) jogados++;
    }
    expect(abertos).toBeGreaterThanOrEqual(30);
    expect(jogados).toBeGreaterThan(5);
  });

  it('as palavras são do esporte: quadra no vôlei, tatame na luta, campo no futebol; poupar não inventa derrota', () => {
    const c = ACONTECIMENTOS_10.find(x => x.id === 'esp10_dor') as Decisao;
    const textos = (mod: Dominio, opcao = 'jogar') => {
      const out: string[] = [];
      for (let k = 0; k < 12; k++) {
        const r = transacao(atleta(mod, `t129:pal:${mod}:${k}`), (x, rr) => {
          const ctx = preparar(c, x, rr);
          if (!ctx) return '';
          const res = c.opcoes.find(o => o.id === opcao)!.resolver(ctx);
          return `${typeof c.titulo === 'string' ? c.titulo : c.titulo(ctx)} | ${res.texto} | ${res.memoria ?? ''}`;
        }).valor;
        out.push(r);
      }
      return out.join(' | ');
    };
    expect(textos('volei')).toMatch(/quadra/);
    expect(textos('volei')).not.toMatch(/de campo|segundo tempo/);
    expect(textos('lutas')).toMatch(/tatame|luta/);
    expect(textos('futebol')).toMatch(/campo|jogo/);
    expect(textos('natacao', 'poupar')).not.toMatch(/perdeu/);
    expect(textos('natacao', 'poupar')).toMatch(/competição ficou sem você/);
  });

  it('save antigo: a conquista inventada ("Campeão com o joelho doendo.") é detectada e some do resumo do ano', () => {
    const v = transacao(atleta('tenis', 't129:antigo'), x => {
      x.caminhos.marcas.push({ t: x.t, tipo: 'conquista', texto: 'Campeão com o joelho doendo.', peso: 2, dominio: 'tenis' });
    }).vida;
    const m = v.caminhos.marcas[v.caminhos.marcas.length - 1];
    expect(marcaDeTituloSemRegistro(v, m)).toBe(true);
    expect(conquistasDoAno(v)).not.toContain('Campeão com o joelho doendo.');
    expect(contradicoesEsportivas(v).join(' ')).toMatch(/joelho doendo/);
    expect(verificarCoerencia(v).join(' ')).toMatch(/joelho doendo/);
    // Com o título de verdade no palmarés naquele ano, a marca fica.
    const comTitulo = transacao(v, x => { x.caminhos.palmares = [{ tipo: 'titulo', modalidade: 'tenis', ano: anoDe(x.t), t: x.t, competicao: 'circuito', texto: 'Campeão do torneio' }]; }).vida;
    expect(marcaDeTituloSemRegistro(comTitulo, m)).toBe(false);
  });
});

describe('VIDA 12.9 · seleções e competições por equipes: a campanha registrada manda', () => {
  it('grupos, semifinal, final perdida, título: o texto, o palmarés e as conquistas dizem a mesma fase', () => {
    const fases = new Map<string, number>();
    for (const mod of ['tenis', 'futebol', 'basquete', 'volei'] as Dominio[]) {
      for (let k = 0; k < 30; k++) {
        const v = transacao(atleta(mod, `t129:sel:${mod}:${k}`, { habilidade: 97 }), x => { x.t += 12 * (k % 4); x.caminhos.esporte!.reputacao = 95; x.caminhos.esporte!.selecao = { radar: x.t - 60, convocacoes: 5, jogos: 20, gols: 0, torneios: [], pais: k % 2 ? 'PT' : 'BR', tUltima: x.t - 12 }; }).vida;
        // O ano de um torneio de seleções em cada modalidade (o tênis tem todo ano; as quadras, nos anos pares).
        const w = transacao(v, (x, r) => {
          const e = x.caminhos.esporte!;
          const t = fecharTemporada(x, r, e);
          const bio = x.biografia.length;
          processarSelecao(x, r, e, t);
          return { bio };
        });
        const d = w.vida;
        const tor = d.caminhos.esporte!.selecao!.torneios.slice(-1)[0];
        if (!tor) continue;
        fases.set(tor.campanha, (fases.get(tor.campanha) ?? 0) + 1);
        const campea = tor.campanha === 'foi campeã';
        const pal = (d.caminhos.palmares ?? []).filter(c => c.tipo === 'selecao' && c.ano === tor.ano && c.competicao === tor.nome);
        expect(pal.length).toBe(1);
        expect(/^Campe/.test(pal[0].texto)).toBe(campea);
        if (!campea) expect(pal[0].texto).toContain(tor.campanha);
        const novas = d.biografia.slice(w.valor.bio).map(b => b.texto).join(' ');
        expect(TITULO.test(novas)).toBe(campea);
        expect(contradicoesEsportivas(d)).toEqual([]);
      }
    }
    // As fases todas apareceram (inclusive a eliminação nos grupos, a semifinal e a final perdidas).
    for (const f of ['caiu na fase de grupos', 'caiu na semifinal', 'perdeu a final', 'foi campeã']) expect([...fases.keys()], f).toContain(f);
  });
});

describe('VIDA 12.9 · a final nacional das provas individuais', () => {
  it('só se classifica quem tem força para os oito da final (e nunca no nível regional); uma final por temporada', () => {
    const conta = (h: number, nivel: 1 | 2 | 3 | 4) => { let n = 0; for (let k = 0; k < 60; k++) if (classificadoParaFinalNacional(atleta('atletismo', `t129:cl:${h}:${nivel}:${k}`, { habilidade: h, nivel }))) n++; return n; };
    expect(conta(95, 1)).toBe(0);
    const forte = conta(92, 3), fraco = conta(70, 4);
    expect(forte).toBeGreaterThan(45);
    expect(fraco).toBeLessThan(10);
    const ja = transacao(atleta('atletismo', 't129:cl:ja', { habilidade: 95, nivel: 3 }), x => { x.caminhos.esporte!.lances = { finalNacional: 2 }; }).vida;
    expect(classificadoParaFinalNacional(ja)).toBe(false);
  });

  it('a final jogada decide a temporada: ouro é título no palmarés; prata/bronze, pódio sem título; fora do pódio, nunca título', () => {
    const vistos = new Set<string>();
    for (const mod of ['atletismo', 'natacao', 'lutas'] as Dominio[]) {
      for (let k = 0; k < 40; k++) {
        const v = atleta(mod, `t129:fin:${mod}:${k}`, { habilidade: 93, nivel: 3 });
        if (!classificadoParaFinalNacional(v)) continue;
        const intencao = ['forte', 'guardar', 'plano'][k % 3];
        const s = viverSituacao(v, 'atl_final', intencao);
        if (!s.valor) continue;
        const lugar = s.vida.caminhos.esporte!.lances?.finalNacional;
        expect(lugar, `${mod} ${s.valor.desfecho}`).toBeDefined();
        const temp = transacao(s.vida, (x, r) => { const e = x.caminhos.esporte!; const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); return t; });
        const t = temp.valor, d = temp.vida;
        vistos.add(lugar === 1 ? 'ouro' : lugar! <= 3 ? 'podio' : 'fora');
        const texto = `${s.valor.texto} ${s.valor.memoria ?? ''}`;
        if (lugar === 1) {
          expect(t.colocacao).toBe(1);
          expect(titulosNoPalmares(d).some(c => c.ano === t.ano)).toBe(true);
          expect(texto).toMatch(/ouro|venceu|Ouro/i);
        } else {
          expect(t.colocacao).not.toBe(1);
          expect(titulosNoPalmares(d).some(c => c.ano === t.ano)).toBe(false);
          expect(texto).not.toMatch(/\bouro\b|venceu/i);
          if (lugar! > 3) { expect(t.colocacao).toBeGreaterThan(3); expect(texto).toMatch(/fora do pódio|último|desclassificad/i); }
          else expect(texto).toMatch(/prata|bronze/);
        }
        expect(d.caminhos.esporte!.lances).toBeUndefined();
        expect(contradicoesEsportivas(d)).toEqual([]);
      }
    }
    expect([...vistos].sort()).toEqual(['fora', 'ouro', 'podio']);
  });

  it('a largada do atletismo também: só classificado, e o lugar entra na temporada', () => {
    let n = 0;
    for (let k = 0; k < 30; k++) {
      const v = atleta('atletismo', `t129:larg:${k}`, { habilidade: 93, nivel: 3 });
      if (!classificadoParaFinalNacional(v)) { expect(candidatosDoAno(v, 'atleta').some(c => c.m.id === 'atl125_largada' || c.m.id === 'atl_final')).toBe(false); continue; }
      const s = viverSituacao(v, 'atl125_largada', k % 2 ? 'arriscar' : 'segurar');
      if (!s.valor) continue;
      n++;
      const lugar = s.vida.caminhos.esporte!.lances?.finalNacional;
      expect(lugar).toBeDefined();
      expect(s.valor.desfecho === 'otimo').toBe(lugar === 1);
    }
    expect(n).toBeGreaterThan(10);
  });
});

describe('VIDA 12.9 · tênis individual: a fase da cena cabe no ano e entra nele', () => {
  it('quem não passou da primeira rodada não está na véspera de uma semifinal', () => {
    const v = transacao(atleta('tenis', 't129:fase', { nivel: 2 }), x => { x.caminhos.esporte!.temporadas = [{ ano: anoDe(x.t - 6), clube: 'circuito', nivel: 2, partidas: 14, titular: 14, gols: 0, assistencias: 0, nota: 5, colocacao: 10, mesesFora: 0, melhorFase: 'primeira rodada' }]; }).vida;
    expect(faseTenisPlausivel(v, 'semifinal')).toBe('segunda rodada');
    const s = viverSituacao(v, 'ten_dor', 'jogar');
    expect(s.valor!.cena).not.toMatch(/semifinal/);
    const quem = transacao(v, x => { x.caminhos.esporte!.temporadas![0].melhorFase = 'quartas de final'; }).vida;
    expect(faseTenisPlausivel(quem, 'semifinal')).toBe('semifinal');
  });

  it('o tie-break vencido na semifinal leva o ano à final (as finais e a melhor fase do ano o registram); perdido, não', () => {
    let venceu = 0, perdeu = 0;
    for (let k = 0; k < 40; k++) {
      const v = transacao(atleta('tenis', `t129:tb:${k}`, { nivel: 3, habilidade: 88 }), x => { x.caminhos.esporte!.temporadas = [{ ano: anoDe(x.t - 6), clube: 'circuito', nivel: 3, partidas: 14, titular: 14, gols: 0, assistencias: 0, nota: 6, colocacao: 10, mesesFora: 0, melhorFase: 'final' }]; }).vida;
      const s = viverSituacao(v, 'ten_tiebreak', 'forte', { fase: 'semifinal', faseTenis: 'semifinal', vence: 'otimo,bom' });
      const ok = s.valor!.desfecho === 'otimo' || s.valor!.desfecho === 'bom';
      expect(s.vida.caminhos.esporte!.lances?.faseTenis).toBe(ok ? 1 : 2);
      if (s.valor!.memoria) expect(s.valor!.memoria).toMatch(/na semifinal/);
      const t = transacao(s.vida, (x, r) => fecharTemporada(x, r, x.caminhos.esporte!)).valor;
      if (ok) { venceu++; expect(t.finais).toBeGreaterThanOrEqual(1); expect(['final', 'título']).toContain(t.melhorFase); }
      else { perdeu++; expect(['semifinal', 'final', 'título']).toContain(t.melhorFase); }
    }
    expect(venceu).toBeGreaterThan(3);
    expect(perdeu).toBeGreaterThan(3);
  });
});

describe('VIDA 12.9 · as outras cenas não reivindicam final nem título', () => {
  it('basquete (último ataque), vôlei (tie-break), revezamento e reta final: nada de final/título/medalha sem registro', () => {
    for (let k = 0; k < 20; k++) {
      const b = transacao(atleta('basquete', `t129:bas:${k}`), x => { x.caminhos.esporte!.temporadas = [{ ano: anoDe(x.t - 6), clube: 'x', nivel: 4, partidas: 30, titular: 28, gols: 0, assistencias: 0, nota: 7, colocacao: 1, mesesFora: 0 }]; }).vida;
      const s = viverSituacao(b, 'bas_ultimo_ataque', 'tres');
      if (s.valor) { expect(s.valor.cena).not.toMatch(/final/); expect(s.valor.memoria ?? '').not.toMatch(/final|título/); }
      const vo = viverSituacao(atleta('volei', `t129:vol:${k}`), 'vol125_tiebreak', 'pedir');
      if (vo.valor) expect(`${vo.valor.cena} ${vo.valor.texto} ${vo.valor.memoria ?? ''}`).not.toMatch(/final|título|decisão do campeonato/);
    }
    // O revezamento da seleção só para quem foi convocado; sem medalha nem recorde que o motor não registra.
    const sem = atleta('atletismo', 't129:rev', { nivel: 3 });
    expect(modeloDaSituacao('atl125_revezamento')!.cabe(sem)).toBe(false);
    const com = transacao(sem, x => { x.caminhos.esporte!.selecao = { radar: x.t - 24, convocacoes: 1, jogos: 1, gols: 0, torneios: [], tUltima: x.t }; }).vida;
    expect(modeloDaSituacao('atl125_revezamento')!.cabe(com)).toBe(true);
    for (let k = 0; k < 10; k++) {
      const s = viverSituacao(transacao(com, x => { x.rng = 100 + k; }).vida, 'atl125_revezamento', k % 2 ? 'treinar' : 'confiar');
      expect(`${s.valor!.texto} ${s.valor!.memoria ?? ''}`).not.toMatch(/medalha|recorde do país|final/i);
    }
  });
});

describe('VIDA 12.9 · regressão por simulação: memórias e conquistas batem com o palmarés', () => {
  it('vidas de atleta (futebol, tênis, vôlei, basquete, atletismo, natação, luta) por 10 temporadas: 0 contradições', () => {
    const erros: string[] = [];
    let anos = 0, titulos = 0;
    const mods: Dominio[] = ['futebol', 'tenis', 'volei', 'basquete', 'atletismo', 'natacao', 'lutas'];
    for (let k = 0; k < 14; k++) {
      const mod = mods[k % mods.length];
      let v = atleta(mod, `t129:sim:${mod}:${k}`, { habilidade: 84 + (k % 3) * 5, nivel: (2 + (k % 3)) as 2 | 3 | 4 });
      const r = criarRng(1000 + k);
      for (let a = 0; a < 10 && !v.morte; a++) {
        v = avancarAno(v).vida;
        for (let q = 0; q < 12 && v.momento && !v.morte; q++) {
          const livres = v.momento.opcoes.filter(o => !o.bloqueio);
          v = executar(v, { tipo: 'decidir', opcaoId: r.pick(livres.length ? livres : v.momento.opcoes).id }).vida;
        }
        anos++;
        erros.push(...contradicoesEsportivas(v).map(x => `${mod} #${k}: ${x}`));
      }
      titulos += titulosNoPalmares(v).length;
    }
    expect([...new Set(erros)]).toEqual([]);
    expect(anos).toBeGreaterThan(100);
    expect(titulos).toBeGreaterThan(0);
  });
});

void anoDaTemporadaEmCurso;
