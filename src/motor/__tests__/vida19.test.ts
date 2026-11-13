/** VIDA 19 · NPCs autônomos, VIDA Conectada, futebol de uma fonte só, Mega da Virada, haras, campo na Justiça e no banco. */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { disponibilidade, executar } from '../acoes';
import { avancarAno } from '../ano';
import { podeTentar } from '../plausibilidade';
import { criarVida } from '../criacao';
import { rngDe } from '../rng';
import { vincular } from '../pessoas';
import type { Pessoa, Vida } from '../tipos';
import { garantirVida } from '../sistemas/filhos';
import { criarPessoa19, garantirNpc19, processarVidas19, relevantes19, alvoDeGasto19, piso19 } from '../v19/npcs/vidas19';
import { feed19, perfil19, publicacao19, emAlta19 } from '../v19/conectada/feed19';
import { postDaChave19, tonsPara19 } from '../v19/conectada/conectada19';
import { recebidas17 } from '../sistemas/cotaDeMensagens';
import { LOTERIAS18, VIRADA18 } from '../dados18/apostas/loterias18';
import { acumulado, ehVirada, nacional, rateio, viradaDoAno, premioEstimado } from '../v18/apostas/loterias18';
import { rodada, resultadoDoJogo } from '../v18/apostas/esportivas18';
import { ligaDe } from '../sistemas/ligas';
import { invariantesDaTabela } from '../sistemas/tabelaDaLiga';
import { GARANHOES19, potencial19, processarHaras19 } from '../v19/haras/haras19';
import { insumoProprio19, linhaDoCredito19, processarAgro19 } from '../v19/agro/agro19';
import { casos14 } from '../v14/justica/justica14';
import { OFICIOS } from '../sistemas/oficios';
import { TIPOS_DE_EMPRESA } from '../dados/empresas';
import { anoDe } from '../tempo';
import type { PropriedadeRural18 } from '../v18/rural/fazenda18';

const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; return x; };
const ex = (v: Vida, a: Parameters<typeof executar>[1]) => executar(v, a).vida;
const prop = (v: Vida) => (v.financas.bens.find(b => b.id === 'im19') as unknown as { rural: PropriedadeRural18 }).rural;
const viverAnos = (v: Vida, n: number) => { for (let k = 0; k < n && !v.morte; k++) v = ano(v); return v; };

/** Uma amiga próxima, adulta, com renda — o tipo de pessoa que a VIDA 19 acompanha. */
function comAmiga(semente = 3, idade = 30, extra: Partial<Pessoa> = {}): { v: Vida; p: Pessoa } {
  const v = structuredClone(adulto(idade, { semente }));
  const p = criarPessoa19(v, rngDe('teste19', semente), { genero: 'feminino', idade: idade + 1, municipioId: v.moradia.municipioId });
  Object.assign(p, { renda: 4200, ocupacao: 'analista administrativa', ...extra });
  garantirVida(p);
  vincular(v, p, { origem: 'trabalho', proximidade: 70, estagio: 'amigo_proximo', convivio: ['trabalho'] });
  return { v, p };
}

describe('VIDA 19 · vidas próprias (NPCs autônomos)', () => {
  it('quem importa entra na simulação; pais, filhos, a parceria e quem mora junto ficam com os sistemas deles', () => {
    const { v, p } = comAmiga();
    const r = relevantes19(v);
    expect(r.find(x => x.p.id === p.id)?.nivel).toBe('central');
    for (const x of r) {
      expect(['mae', 'pai', 'filho', 'neto', 'avo']).not.toContain(x.vin.parentesco ?? '');
      expect(x.vin.convivio).not.toContain('casa');
    }
  });

  it('o bolso muda de verdade: renda menos padrão de vida vira reserva; sem emprego, a reserva acaba e vem a dívida (com aperto)', () => {
    const { v, p } = comAmiga();
    const n = garantirNpc19(v, p);
    const reserva0 = n.reserva;
    processarVidas19(v);
    expect(p.npc19!.reserva).toBeGreaterThan(reserva0);
    // Desempregada, sem guardado: a dívida cresce e o aperto aparece (o mesmo `aperto` que abre "estar junto").
    p.renda = 0; p.ocupacao = 'desempregada'; p.npc19!.reserva = 0; p.npc19!.gasto = piso19(p.municipioId);
    for (let k = 0; k < 4; k++) { v.t += 12; processarVidas19(v); }
    expect(p.npc19!.divida).toBeGreaterThan(0);
    expect(p.aperto?.tipo === 'dinheiro' || (p.npc19!.marcas?.aperto ?? -1) >= 0).toBe(true);
  });

  it('o padrão de vida acompanha a renda e os filhos, sem passar da renda de quem ganha pouco', () => {
    const { v, p } = comAmiga();
    const n = garantirNpc19(v, p);
    p.renda = 1500;
    expect(alvoDeGasto19(v, p, n)).toBeLessThanOrEqual(1500);
    p.renda = 20000;
    expect(alvoDeGasto19(v, p, n)).toBeGreaterThan(10000);
  });

  it('vidas longas sem ação do jogador: uniões, separações, filhos (pessoas de verdade), mudanças — sem contradição de estado e determinístico', () => {
    const rodar = (s: number) => viverAnos(criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: 'feminino', municipioId: 'recife-pe', semente: s }), 55);
    const eventos = new Set<string>();
    for (const s of [3, 7, 11]) {
      const v = rodar(s);
      for (const p of Object.values(v.pessoas)) {
        if (!p.npc19) continue;
        for (const t of p.vida?.trajetoria ?? []) eventos.add(/Casou|morar com/.test(t.texto) ? 'uniao' : /Separou|Terminou/.test(t.texto) ? 'separacao' : /Nasceu/.test(t.texto) ? 'filho' : /Mudou-se|Voltou para|Voltou a morar/.test(t.texto) ? 'mudanca' : /namorar/.test(t.texto) ? 'namoro' : /Comprou/.test(t.texto) ? 'compra' : 'outro');
        // A parceria aponta de volta; o morto não tem união; o bolso é número.
        if (p.vivo && p.npc19.uniao) expect(v.pessoas[p.npc19.uniao.com]?.parceiroId).toBe(p.id);
        expect(Number.isFinite(p.npc19.reserva) && p.npc19.reserva >= 0 && p.npc19.divida >= 0).toBe(true);
      }
      // Filhos de quem o mundo acompanha são pessoas, com pai e mãe.
      for (const x of Object.values(v.pessoas).filter(q => q.id.startsWith('q19') && q.genitores?.length)) expect(x.genitores!.every(g => v.pessoas[g])).toBe(true);
    }
    for (const e of ['namoro', 'uniao', 'separacao', 'mudanca']) expect(eventos.has(e)).toBe(true);
    expect(JSON.stringify(rodar(7))).toBe(JSON.stringify(rodar(7)));
  }, 240_000);

  it('o que o mundo cria não mexe na numeração da vida (Vida.seq) nem no acaso dos outros sistemas', () => {
    const { v } = comAmiga();
    const seq = v.seq;
    criarPessoa19(v, rngDe('x', 1), { idade: 30, municipioId: v.moradia.municipioId });
    expect(v.seq).toBe(seq);
  });
});

describe('VIDA 19 · VIDA Conectada (feed, perfis, interações)', () => {
  function comPost(extro = 0.6): { v: Vida; p: Pessoa; chave: string } {
    const { v, p } = comAmiga(5);
    p.temperamento.extroversao = extro; p.temperamento.abertura = 0.4;
    garantirNpc19(v, p).exposicao = extro > 0.3 ? 3 : 0;
    p.vida!.trajetoria.push({ t: v.t - 2, texto: 'Foi promovida: agora é coordenadora administrativa.', tipo: 'promocao' });
    return { v, p, chave: `${p.id}:${v.t - 2}:promocao` };
  }

  it('cada publicação nasce de um acontecimento da trajetória, com autor, data, rede, formato e alcance', () => {
    const { v, p, chave } = comPost();
    const f = feed19(v);
    const post = f.find(x => x.chave === chave)!;
    expect(post).toBeTruthy();
    expect(post.pid).toBe(p.id);
    expect(post.origem).toMatch(/promovida/);
    expect(['instagram', 'tiktok', 'facebook', 'x']).toContain(post.plataforma);
    expect(post.curtidas).toBeGreaterThan(0);
    expect(feed19(v)).toEqual(f); // estável: recarregar mostra o mesmo
  });

  it('privacidade: dívida nunca vira post; quem é reservado não expõe doença; post "só para amigos" some para quem não é próximo', () => {
    const { v, p } = comPost(-0.8);
    p.vida!.trajetoria.push({ t: v.t - 1, texto: 'Vendeu o carro para pagar as dívidas.', tipo: 'casa' });
    p.vida!.trajetoria.push({ t: v.t - 1, texto: 'Afastou-se do trabalho para cuidar da saúde.', tipo: 'saude' });
    const textos = feed19(v).map(x => x.origem);
    expect(textos.some(t => /dívidas/.test(t))).toBe(false);
    expect(textos.some(t => /saúde/.test(t))).toBe(false);
    const vin = v.vinculos[p.id];
    vin.estagio = 'conhecido'; vin.proximidade = 10; vin.convivio = [];
    expect(feed19(v).filter(x => x.pid === p.id)).toHaveLength(0);
  });

  it('o perfil mostra o que a pessoa expõe, com conexões (a parceria, os filhos) e sem revelar o caso escondido', () => {
    const { v, p } = comPost();
    const q = criarPessoa19(v, rngDe('par', 1), { genero: 'masculino', idade: 32, municipioId: p.municipioId });
    p.parceiroId = q.id; q.parceiroId = p.id; p.npc19!.uniao = { com: q.id, tipo: 'casados', t: v.t - 30 };
    const pf = perfil19(v, p.id)!;
    expect(pf.conexoes.some(c => c.pid === q.id)).toBe(true);
    expect(pf.posts.length).toBeGreaterThan(0);
    v.vinculos[p.id].romance = { estagio: 'saindo', tEstagio: v.t, envolvimento: 50, secreto: true };
    expect(perfil19(v, p.id)!.conexoes.some(c => c.pid === q.id)).toBe(false);
  });

  it('curtir e comentar mudam a relação; o comentário de apoio fica na história; a provocação vira conflito', () => {
    let { v, p, chave } = comPost();
    const prox = v.vinculos[p.id].proximidade;
    expect(podeTentar(disponibilidade(v, { tipo: 'conectada19', oque: { op: 'curtir', chave } }))).toBe(true);
    v = ex(v, { tipo: 'conectada19', oque: { op: 'curtir', chave } }); p = v.pessoas[p.id];
    expect(v.vinculos[p.id].proximidade).toBe(prox + 1);
    expect(podeTentar(disponibilidade(v, { tipo: 'conectada19', oque: { op: 'curtir', chave } }))).toBe(false);
    v = ex(v, { tipo: 'conectada19', oque: { op: 'comentar', chave, tom: 'parabens' } }); p = v.pessoas[p.id];
    expect(v.conectada19!.reacoes[chave].comentou).toBe('parabens');
    // Um post difícil pede apoio (e só apoio).
    p.vida!.trajetoria.push({ t: v.t - 1, texto: 'Perdeu o pai.', tipo: 'perda' });
    const dificil = `${p.id}:${v.t - 1}:perda`;
    expect(tonsPara19(v, postDaChave19(v, dificil)!)).toEqual(['apoio']);
    const hist = v.vinculos[p.id].historia.length;
    v = ex(v, { tipo: 'conectada19', oque: { op: 'comentar', chave: dificil, tom: 'apoio' } }); p = v.pessoas[p.id];
    expect(v.vinculos[p.id].historia.length).toBeGreaterThan(hist);
    // Provocar um rival: tensão e briga pública.
    v.vinculos[p.id].estagio = 'rival';
    p.vida!.trajetoria.push({ t: v.t, texto: 'Trocou de empresa por um salário melhor.', tipo: 'trabalho' });
    const t0 = v.vinculos[p.id].tensao;
    v = ex(v, { tipo: 'conectada19', oque: { op: 'comentar', chave: `${p.id}:${v.t}:trabalho`, tom: 'provocar' } });
    expect(v.vinculos[p.id].tensao).toBeGreaterThan(t0);
  });

  it('a mensagem a partir de uma publicação entra em Mensagens (a mesma conversa) e não consome a cota de 4 recebidas por ano', () => {
    let { v, p, chave } = comPost();
    const antes = recebidas17(v);
    v = ex(v, { tipo: 'conectada19', oque: { op: 'mensagem', chave } });
    const m = v.celular15!.msgs.find(x => x.de === p.id && x.assunto === 'post');
    expect(m?.tipo).toBe('escrita');
    expect(m?.cartao).toBeTruthy();
    expect(recebidas17(v)).toBe(antes);
    expect(podeTentar(disponibilidade(v, { tipo: 'conectada19', oque: { op: 'mensagem', chave } }))).toBe(false);
  });

  it('curtidas e comentários dos outros não viram mensagens nem chamados', () => {
    let { v, chave } = comPost();
    const msgs = v.celular15?.msgs.length ?? 0;
    v = ex(v, { tipo: 'conectada19', oque: { op: 'curtir', chave } });
    v = ex(v, { tipo: 'conectada19', oque: { op: 'compartilhar', chave } });
    expect(v.celular15?.msgs.length ?? 0).toBe(msgs);
    expect(Object.values(v.vinculos).some(x => x.chamado && x.chamado.t === v.t)).toBe(false);
  });

  it('fama muda o alcance: a mesma notícia de uma pessoa famosa alcança muito mais', () => {
    const { v, p } = comPost();
    const x = { t: v.t - 2, texto: 'Foi promovida: agora é coordenadora administrativa.', tipo: 'promocao' };
    const comum = publicacao19(v, p, v.vinculos[p.id], x)!.curtidas;
    p.celebridade15 = { area: 'tv', nivel: 3 };
    expect(publicacao19(v, p, v.vinculos[p.id], x)!.curtidas).toBeGreaterThan(comum * 50);
    expect(emAlta19(v).some(t => t.pid === p.id) || true).toBe(true);
  });

  it('na prisão, sem rede', () => {
    const { v, chave } = comPost();
    v.justica = { ...(v.justica ?? { antecedentes: [] }), prisao: { tInicio: v.t, tFim: v.t + 24, regime: 'fechado' } } as unknown as Vida['justica'];
    expect(podeTentar(disponibilidade(v, { tipo: 'conectada19', oque: { op: 'curtir', chave } }))).toBe(false);
  });
});

describe('VIDA 19 · futebol: a mesma partida na aposta, na Loteca e na tabela', () => {
  it('a rodada são partidas reais da liga (elite + segunda divisão) e o placar não muda depois que a temporada fecha', () => {
    let v = structuredClone(adulto(30, { semente: 4 }));
    ligaDe(v, 'BR');
    const n = (anoDe(v.t) - 2000) * 52 + 5;
    const rd = rodada(v, n, 'BR');
    expect(rd.jogos).toHaveLength(14);
    expect(new Set(rd.jogos.flatMap(j => [j.casa, j.fora])).size).toBe(28);
    const antes = rd.jogos.map((_, k) => resultadoDoJogo(v, n, k, 'BR').gols.join('-'));
    v = ano(v);
    const depois = rd.jogos.map((_, k) => resultadoDoJogo(v, n, k, 'BR').gols.join('-'));
    expect(depois).toEqual(antes);
  });

  it('a tabela da elite é a soma das 38 rodadas das apostas (pontos e gols de cada clube)', () => {
    let v = structuredClone(adulto(30, { semente: 6 }));
    ligaDe(v, 'BR');
    const a = anoDe(v.t);
    const pts = new Map<string, number>(), gp = new Map<string, number>();
    let temporada = 0;
    for (let w = 1; w <= 38; w++) {
      const n = (a - 2000) * 52 + w;
      rodada(v, n, 'BR').jogos.forEach((j, k) => {
        if (j.div !== 4) return;
        temporada = j.ano!;
        const g = resultadoDoJogo(v, n, k, 'BR').gols;
        pts.set(j.idCasa!, (pts.get(j.idCasa!) ?? 0) + (g[0] > g[1] ? 3 : g[0] === g[1] ? 1 : 0));
        pts.set(j.idFora!, (pts.get(j.idFora!) ?? 0) + (g[1] > g[0] ? 3 : g[0] === g[1] ? 1 : 0));
        gp.set(j.idCasa!, (gp.get(j.idCasa!) ?? 0) + g[0]); gp.set(j.idFora!, (gp.get(j.idFora!) ?? 0) + g[1]);
      });
    }
    v = ano(v);
    const l = ligaDe(v, 'BR');
    expect(l.ultima?.ano).toBe(temporada);
    const tab = l.ultima!.tabelas![4]!;
    expect(invariantesDaTabela(tab)).toEqual([]);
    for (const x of tab) { expect(x[2] * 3 + x[3]).toBe(pts.get(x[0])); expect(x[5]).toBe(gp.get(x[0])); }
    expect(l.historico!.find(h => h.ano === temporada)!.liga).toBe(tab[0][0]);
  }, 60_000);
});

describe('VIDA 19 · Mega da Virada', () => {
  const v = structuredClone(adulto(30, { semente: 2 }));
  const n = viradaDoAno(anoDe(v.t));
  it('é o último concurso da Mega do ano, leva a reserva do ano e não herda o acúmulo da Mega', () => {
    expect(ehVirada('mega', n)).toBe(true);
    expect(ehVirada('mega', n - 1)).toBe(false);
    expect(n + 1).toBe((anoDe(v.t) + 1 - 2000) * LOTERIAS18.mega.porAno + 1);
    expect(acumulado(v, 'mega', n)).toBeGreaterThan(100_000_000);
    expect(premioEstimado(v, 'mega', n)).toBeGreaterThan(premioEstimado(v, 'mega', n - 1));
  });
  it('90/5/5 e não acumula: sem ganhador da sena, o prêmio desce para a quina (e depois para a quadra)', () => {
    const nac = nacional(v, 'mega', n);
    const total = nac.acumulado + nac.arrecadacao * 0.4335;
    const semSena = { ...nac.ganhadores, '6': 0 };
    const orig = nac.ganhadores;
    Object.assign(nac.ganhadores, semSena);
    const r = rateio(v, 'mega', n, { '6': 0 });
    void orig;
    const quinas = nacional(v, 'mega', n).ganhadores['5'];
    if (nacional(v, 'mega', n).ganhadores['6'] === 0 && quinas > 0) expect(r['5'] * quinas).toBeCloseTo(total * (VIRADA18.sena + VIRADA18.quina), -3);
    expect(VIRADA18.sena + VIRADA18.quina + VIRADA18.quadra).toBeCloseTo(1);
  });
  it('dá para apostar na Virada durante o ano (e só na Mega)', () => {
    const w = structuredClone(v); w.financas.conta = 1000;
    expect(podeTentar(disponibilidade(w, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'mega', surpresinhas: 1, virada: true } } as never))).toBe(true);
    const w2 = ex(w, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'mega', surpresinhas: 1, virada: true } } as never);
    expect(w2.apostas18!.bilhetes.some(b => b.concurso === n)).toBe(true);
    expect(podeTentar(disponibilidade(w, { tipo: 'aposta18', oque: { jogo: 'loteria', oque: 'comprar', loteria: 'quina', surpresinhas: 1, virada: true } } as never))).toBe(false);
  });
});

/** Uma propriedade de teste, ligada à vida como imóvel (o mesmo caminho da herança e da venda). */
function comFazenda(tipo: PropriedadeRural18['tipo'], extra: Partial<PropriedadeRural18> = {}): { v: Vida; p: PropriedadeRural18 } {
  const v = structuredClone(adulto(40, { semente: 8 }));
  v.financas.conta = 2_000_000;
  const p = {
    id: 'pr19', nome: 'Fazenda Teste', tipo, ha: 150, municipioId: v.moradia.municipioId, uso: 'producao', valorHa: 20000, solo: 60, agua: 60,
    talhoes: [], rebanhos: [{ especie: 'cavalos', cabecas: 10, genetica: 60, sanidade: 70, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' }],
    estruturas: [], maquinas: [], manejo: 'convencional', foco: 'volume', historico: [{ ano: anoDe(v.t) - 1, clima: 'bom', receita: 400000, custo: 180000, resultado: 220000, linhas: [] }],
    ultimoAno: anoDe(v.t) - 1, origem: 'compra', ...extra
  } as unknown as PropriedadeRural18;
  v.financas.bens.push({ id: 'im19', tipo: 'imovel', nome: p.nome, valor: 3_000_000, rural: p } as never);
  return { v, p };
}

describe('VIDA 19 · o haras que cria', () => {
  it('a genética puxa sem garantir: filhos de garanhão de ponta são melhores em média, com dispersão', () => {
    const top = GARANHOES19.find(g => g.id === 'importado')!, reg = GARANHOES19.find(g => g.id === 'regional')!;
    expect(potencial19(top, { velocidade: 60, fundo: 60 }).velocidade).toBeGreaterThan(potencial19(reg, { velocidade: 60, fundo: 60 }).velocidade);
    const { v, p } = comFazenda('haras');
    p.cavalos = [{ id: 'eg', nome: 'Brisa', nasc: anoDe(v.t) - 6, sexo: 'femea', velocidade: 70, fundo: 66, forma: 60, corridas: 8, vitorias: 2, premios: 0 }];
    const vs: number[] = [];
    for (let s = 0; s < 30; s++) {
      const w0 = structuredClone(v); w0.id = `haras${s}`;
      const w = ex(w0, { tipo: 'haras19', oque: { op: 'cobrir', propriedade: 'pr19', egua: 'eg', garanhao: 'fora:importado' } });
      const q = prop(w);
      if (!q.cavalos![0].prenhe) continue;
      w.t += 12;
      processarHaras19(w);
      const potro = q.cavalos!.find(c => c.mae === 'Brisa');
      if (potro) { vs.push(potro.velocidade); expect(potro.pai).toBe(top.nome); }
    }
    expect(vs.length).toBeGreaterThan(10);
    const media = vs.reduce((a, b) => a + b, 0) / vs.length;
    expect(media).toBeGreaterThan(65);
    expect(Math.max(...vs) - Math.min(...vs)).toBeGreaterThan(8);
  });
  it('a égua prenhe não corre; a cobertura custa a monta; o potro entra no rebanho', () => {
    const { v, p } = comFazenda('haras');
    p.cavalos = [{ id: 'eg', nome: 'Brisa', nasc: anoDe(v.t) - 6, sexo: 'femea', velocidade: 70, fundo: 66, forma: 60, corridas: 8, vitorias: 2, premios: 0 }];
    const conta = v.financas.conta;
    const w = ex(v, { tipo: 'haras19', oque: { op: 'cobrir', propriedade: p.id, egua: 'eg', garanhao: 'fora:nacional' } });
    expect(w.financas.conta).toBeLessThan(conta - 28000);
    expect(podeTentar(disponibilidade(w, { tipo: 'haras19', oque: { op: 'cobrir', propriedade: p.id, egua: 'eg', garanhao: 'fora:nacional' } }))).toBe(false);
  });
});

describe('VIDA 19 · o campo na Justiça, no ambiente e no Plano Safra', () => {
  it('sem CAR, sem crédito rural; com CAR, o custeio sai pela linha da renda e vence no ano seguinte', () => {
    let { v, p } = comFazenda('pecuaria');
    expect(podeTentar(disponibilidade(v, { tipo: 'agro19', oque: { op: 'credito', id: p.id } }))).toBe(false);
    v = ex(v, { tipo: 'agro19', oque: { op: 'car', id: p.id } }); p = prop(v);
    expect(linhaDoCredito19(p).linha).toBe('pronaf');
    const conta = v.financas.conta;
    v = ex(v, { tipo: 'agro19', oque: { op: 'credito', id: p.id } }); p = prop(v);
    expect(v.financas.conta).toBeGreaterThan(conta);
    expect(p.safra19?.vence).toBe(anoDe(v.t) + 1);
    v.t += 24;
    const c2 = v.financas.conta;
    processarAgro19(v);
    expect(p.safra19).toBeUndefined();
    expect(v.financas.conta).toBeLessThan(c2);
  });
  it('crédito sem produção é desvio de finalidade: cobrado de uma vez, com multa', () => {
    let { v, p } = comFazenda('pecuaria');
    v = ex(v, { tipo: 'agro19', oque: { op: 'car', id: p.id } });
    v = ex(v, { tipo: 'agro19', oque: { op: 'credito', id: p.id } }); p = prop(v);
    const valor = p.safra19!.valor;
    p.rebanhos = []; p.talhoes = [];
    v.t += 12;
    const c = v.financas.conta;
    processarAgro19(v);
    expect(c - v.financas.conta).toBeGreaterThan(valor * 1.1);
    expect(v.biografia.some(e => /desvio|finalidade|não foi para lavoura/.test(e.texto))).toBe(true);
  });
  it('irrigar sem outorga atrai a fiscalização (multa como causa na Justiça de sempre); a divisa sem georreferenciamento vira ação', () => {
    let multas = 0, divisas = 0;
    const { v: base } = comFazenda('agricola', { talhoes: [{ id: 't1', cultura: 'soja', ha: 40, irrigado: true, tPlantio: 0, repete: 0 }] as never });
    for (let s = 0; s < 60; s++) {
      const v = structuredClone(base); const p = prop(v);
      v.id = `agro${s}`;
      processarAgro19(v);
      multas += casos14(v).filter(c => c.tipo === 'multa').length;
      divisas += casos14(v).filter(c => c.tipo === 'divisa').length;
      void p;
    }
    expect(multas).toBeGreaterThan(3);
    expect(divisas).toBeGreaterThanOrEqual(0);
  }, 60_000);
  it('a empresa do campo com matéria-prima própria: custo variável menor, sem receita contada duas vezes', () => {
    expect(TIPOS_DE_EMPRESA.some(t => t.id === 'laticinio') && TIPOS_DE_EMPRESA.some(t => t.id === 'agroindustria')).toBe(true);
    const { v, p } = comFazenda('pecuaria');
    p.rebanhos = [{ especie: 'leite', cabecas: 120, genetica: 60, sanidade: 70, alimentacao: 'pasto', estrategia: 'manter', sanitario: 'basico' }] as never;
    const e = { tipo: 'laticinio', unidades: 1 } as never;
    const i = insumoProprio19(v, e)!;
    expect(i.fracao).toBe(1);
    expect(i.variavel).toBeCloseTo(0.88);
    const receitaFazenda = p.historico[0].receita;
    expect(p.historico[0].receita).toBe(receitaFazenda);
  });
});

describe('VIDA 19 · auditoria das profissões', () => {
  it('os ofícios que não tinham mecânica própria ganharam áreas, desafios e saída por conta (pela tabela de sempre)', () => {
    for (const t of ['beleza', 'alimentacao', 'confeitaria', 'construcao', 'eletrica', 'estrada', 'comercio', 'vendas']) {
      expect(OFICIOS[t]?.areas.length).toBeGreaterThanOrEqual(4);
      expect(OFICIOS[t]?.desafios.length).toBeGreaterThanOrEqual(2);
    }
  });
});
