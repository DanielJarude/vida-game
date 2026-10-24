// @vitest-environment jsdom
/**
 * REWORK 7.5 — interfaces do cotidiano (tela), com o motor de verdade por trás:
 *   2. As quatro paletas (+ Automático): a troca, a cor da barra, o script sem flash, as prévias, um sistema só.
 *   1. A Linha da Vida em fios: a mesma história junta, as independentes separadas, a natureza dita em palavra.
 *   5.1 A agenda: as linhas e os quadrinhos são os da `semana` do motor; a dedicação muda pelo motor; a ficha abre.
 *   5.2 O celular: os apps, a tela inicial com o que o motor registrou, publicar de dentro do app.
 *   4. Quem se foi: "Em memória", os gestos, a despedida ligada à morte na Linha da Vida.
 *   Integração: os fluxos A–D até salvar, reabrir e continuar.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState, type ReactNode } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { executar, type Acao } from '../../motor/acoes';
import { interpretar } from '../../motor/save';
import { agendaDaSemana } from '../../motor/sistemas/agenda';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { transacao } from '../../motor/nucleo';
import { registrarMortes } from '../../motor/sistemas/luto';
import { lembrarCom } from '../../motor/nucleo';
import { vincular } from '../../motor/pessoas';
import { adulto, comParente, pessoaNova } from '../../motor/__tests__/cenarios';
import type { Entrada, Vida } from '../../motor/tipos';
import { APARENCIAS, COR_DA_MOLDURA, escolherAparencia, LUZ_DA_PALETA, resolverPaleta, type Paleta } from '../tema';
import { SeletorTema } from '../SeletorTema';
import { fiosDoAno, naturezaDe } from '../apresentar';
import { LinhaDaVida } from '../jogo/LinhaDaVida';
import { Tempo } from '../jogo/Tempo';
import { Pessoas } from '../jogo/Pessoas';

const UI = join(__dirname, '..');
const TOKENS = readFileSync(join(UI, 'tokens.css'), 'utf8');
const COTIDIANO = readFileSync(join(UI, 'cotidiano.css'), 'utf8');
const INDEX = readFileSync(join(UI, '..', '..', 'index.html'), 'utf8');

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true;
  for (const a of ['data-tema', 'data-paleta', 'data-aparencia']) document.documentElement.removeAttribute(a);
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  const r = criarRng(20261017); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const nada = () => {};
function vida(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 7): Vida {
  let v = criarVida({ nome: 'Lia', sobrenome: 'Prado', genero: 'feminino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  ajuste(v);
  return v;
}
const anos = (v: Vida, n: number) => { for (let k = 0; k < n; k++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; v.caminhos.processo = undefined; } return v; };
const reabrir = (v: Vida): Vida => { const r = interpretar(JSON.stringify(v)); if (r.tipo !== 'ok') throw new Error('save inválido'); return r.vida; };
const fazer = (v: Vida, a: Acao) => { const r = executar(v, a); return r.vida; };

function Ligado({ v0, tela, aoMudar }: { v0: Vida; tela: (v: Vida, agir: (a: Acao) => boolean) => ReactNode; aoMudar?: (v: Vida) => void }) {
  const [v, setV] = useState(v0);
  const agir = (a: Acao) => { const r = executar(v, a); setV(r.vida); aoMudar?.(r.vida); return true; };
  return <main>{tela(v, agir)}</main>;
}

/* =============================================================== 2. PALETAS */

const PALETAS: Paleta[] = ['claro', 'horizonte', 'escuro', 'atlantico'];
const blocoDe = (p: Paleta) => {
  const sel = p === 'claro' ? ":root,\n[data-amostra='claro']" : p === 'escuro' ? ":root[data-tema='escuro']" : `:root[data-paleta='${p}']`;
  const i = TOKENS.indexOf(sel);
  return TOKENS.slice(i, TOKENS.indexOf('}', i));
};
const nomes = (css: string) => [...css.matchAll(/(--[\w-]+):/g)].map(m => m[1]);

describe('quatro paletas — duas claras, duas escuras — e o Automático', () => {
  it('a escolha troca na hora a luz, a paleta e a barra do navegador, e guarda fora do save', () => {
    for (const p of PALETAS) {
      escolherAparencia(p);
      const raiz = document.documentElement;
      expect(raiz.dataset.paleta).toBe(p);
      expect(raiz.dataset.tema).toBe(LUZ_DA_PALETA[p]);
      expect(document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content).toBe(COR_DA_MOLDURA[p]);
      expect(localStorage.getItem('VIDA_APARENCIA')).toBe(p);
    }
    expect(PALETAS.filter(p => LUZ_DA_PALETA[p] === 'claro')).toHaveLength(2);
    expect(PALETAS.filter(p => LUZ_DA_PALETA[p] === 'escuro')).toHaveLength(2);
    expect(resolverPaleta('auto', true)).toBe('escuro');
    expect(resolverPaleta('auto', false)).toBe('claro');
  });

  it('cada paleta redefine SÓ a camada --p-* e TODA ela; a moldura do bloco é a cor da barra', () => {
    const base = new Set(nomes(blocoDe('claro')).filter(n => n.startsWith('--p-')));
    expect(base.size).toBeGreaterThan(25);
    for (const p of PALETAS) {
      const b = blocoDe(p);
      expect(nomes(b).filter(n => !n.startsWith('--p-')), p).toEqual([]);
      expect([...base].filter(n => !nomes(b).includes(n)), p).toEqual([]);
      expect(b, p).toContain(`--p-moldura: ${COR_DA_MOLDURA[p]};`);
    }
  });

  it('o script de index.html (sem flash, sem rede) dá a mesma paleta que ui/tema.ts em todas as combinações', () => {
    const script = INDEX.match(/<script>([\s\S]*?)<\/script>/)![1];
    for (const g of [null, 'claro', 'horizonte', 'escuro', 'atlantico', 'auto', 'xyz']) for (const escuro of [false, true]) {
      localStorage.clear();
      if (g) localStorage.setItem('VIDA_APARENCIA', g);
      window.matchMedia = ((q: string) => ({ matches: q.includes('dark') && escuro, addEventListener() {}, removeEventListener() {} })) as never;
      document.documentElement.removeAttribute('data-paleta');
      new Function(script)();
      const esperado = resolverPaleta(g && PALETAS.includes(g as Paleta) ? (g as Paleta) : 'auto', escuro);
      expect(document.documentElement.dataset.paleta, `${g} / ${escuro}`).toBe(esperado);
      expect(document.documentElement.dataset.tema).toBe(LUZ_DA_PALETA[esperado]);
    }
  });

  it('o seletor mostra a prévia de cada paleta (com a paleta DELA) e o nome; um grupo de rádio de cinco', () => {
    render(<SeletorTema />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(APARENCIAS.length);
    for (const p of PALETAS) expect(document.querySelector(`[data-amostra="${p}"]`)).toBeTruthy();
    for (const p of PALETAS) expect(TOKENS).toMatch(new RegExp(`\\[data-amostra='${p}'\\]`));
    fireEvent.click(screen.getByRole('radio', { name: /Atlântico Noturno/ }));
    expect(document.documentElement.dataset.paleta).toBe('atlantico');
    expect(screen.getByRole('radio', { name: /Atlântico Noturno/ }).getAttribute('aria-checked')).toBe('true');
  });

  it('as folhas novas não perguntam pelo tema nem escrevem cor à mão', () => {
    expect(COTIDIANO).not.toMatch(/data-tema|data-paleta|prefers-color-scheme/);
    expect(COTIDIANO.match(/#[0-9a-fA-F]{3,6}\b/g) ?? []).toEqual([]);
  });
});

/* =========================================================== 1. LINHA DA VIDA */

const e = (id: string, t: number, x: Partial<Entrada> = {}): Entrada => ({ id, t, idade: 8, texto: `texto ${id}`, relevancia: 'biografia', tema: 'familia', ...x });

describe('a Linha da Vida em fios', () => {
  it('a amizade do futebol e o vaso quebrado são histórias diferentes; a mesma pessoa e a consequência ficam juntas', () => {
    const fios = fiosDoAno([
      e('vaso', 3, { escolha: true, pessoas: ['pai'] }),
      e('amizade', 4, { tema: 'amizade', pessoas: ['dudu'] }),
      e('bronca', 6, { pessoas: ['pai'] }),
      e('time', 7, { tema: 'amizade', pessoas: ['dudu'], relevancia: 'marco' }),
      e('crise', 1, { tema: 'dinheiro' }),
      e('crise-casa', 2, { tema: 'dinheiro', segue: 'crise' }),
      e('miudo1', 5, { relevancia: 'cotidiano', tema: 'escola' }),
      e('miudo2', 8, { relevancia: 'cotidiano', tema: 'lazer' })
    ]);
    const grupo = (id: string) => fios.find(f => f.entradas.some(x => x.id === id))!;
    expect(grupo('vaso')).toBe(grupo('bronca'));
    expect(grupo('amizade')).toBe(grupo('time'));
    expect(grupo('vaso')).not.toBe(grupo('amizade'));
    expect(grupo('crise')).toBe(grupo('crise-casa'));
    expect(grupo('crise').entradas.map(x => x.id)).toEqual(['crise', 'crise-casa']);
    // O marco abre o ano; o cotidiano solto vira uma linha de miudezas, no fim.
    expect(fios[0]).toBe(grupo('time'));
    expect(fios[fios.length - 1].miudo).toBe(true);
    expect(fios[fios.length - 1].entradas.map(x => x.id)).toEqual(['miudo1', 'miudo2']);
  });

  it('a natureza vem do motor: escolha, consequência, mudança de rumo, marco, gente, cotidiano', () => {
    expect(naturezaDe(e('a', 1, { escolha: true }))).toBe('escolha');
    expect(naturezaDe(e('a', 1, { segue: 'x' }))).toBe('consequencia');
    expect(naturezaDe(e('a', 1, { relevancia: 'marco', tema: 'trabalho' }))).toBe('virada');
    expect(naturezaDe(e('a', 1, { relevancia: 'marco', tema: 'amor', evento: { tipo: 'casamento' } }))).toBe('virada');
    expect(naturezaDe(e('a', 1, { relevancia: 'marco', tema: 'amor' }))).toBe('marco');
    expect(naturezaDe(e('a', 1, { tema: 'amizade', pessoas: ['x'] }))).toBe('gente');
    expect(naturezaDe(e('a', 1, { relevancia: 'cotidiano' }))).toBe('cotidiano');
  });

  it('na tela: o fio junta, a escolha diz "sua escolha", a consequência de outro ano diz de onde veio', () => {
    const v = vida(10);
    const base = v.biografia.length;
    v.biografia.push(
      { id: 'zz1', t: v.t - 30, idade: 7, texto: 'Mentiu sobre a nota da prova.', relevancia: 'biografia', tema: 'escola', escolha: true },
      { id: 'zz2', t: v.t - 2, idade: 9, texto: 'A mentira da prova apareceu na reunião de pais.', relevancia: 'biografia', tema: 'escola', segue: 'zz1' }
    );
    render(<LinhaDaVida vida={v} marca={base} />);
    const item = screen.getByText('A mentira da prova apareceu na reunião de pais.').closest('.entrada')!;
    expect(item.classList.contains('entrada--natureza-consequencia')).toBe(true);
    expect(item.textContent).toMatch(/por causa de: “Mentiu sobre a nota da prova” \(aos 7\)/);
    expect(screen.getByText('Mentiu sobre a nota da prova.').closest('.entrada')!.textContent).toMatch(/sua escolha/);
    expect(document.querySelectorAll('.fio').length).toBeGreaterThan(3);
  });
});

/* ================================================================= 5.1 AGENDA */

describe('a agenda da semana', () => {
  const comAtividades = () => {
    let v = adulto(28, { semente: 12 });
    for (const id of ['corrida', 'teatro', 'desenho']) v = fazer(v, { tipo: 'rotina', id, ativa: true, nivel: 1 });
    return v;
  };

  // REWORK 9: a agenda deixou de ser frequência sem dia nem hora — é a semana em horários (`sistemas/agenda`).
  it('REWORK 9 — os blocos são os da agenda do motor: cada compromisso nos seus dias e horas', () => {
    const v = comAtividades();
    render(<main><Tempo vida={v} agir={() => true} aba="semana" /></main>);
    const agenda = screen.getByRole('region', { name: 'A agenda da semana' });
    const a = agendaDaSemana(v);
    expect(agenda.querySelectorAll('.bloco-agenda').length).toBe(a.blocos.reduce((t, b) => t + b.dias.length, 0));
    for (const id of ['corrida', 'teatro', 'desenho']) expect(a.blocos.some(b => b.ref === id)).toBe(true);
    expect(agenda.textContent).toMatch(/Seg|Ter|Qua/);
    // REWORK 9.5: ao lado da agenda, as três leituras da rotina (a lista de antes repetia a agenda e saiu).
    expect(screen.getByRole('region', { name: 'Como está a rotina' })).toBeTruthy();
  });

  it('"Mais a sério" no compromisso aberto muda o nível pelo motor; "Abrir a ficha da prática" abre a ficha', () => {
    let atual = comAtividades();
    render(<Ligado v0={atual} aoMudar={v => { atual = v; }} tela={(v, agir) => <Tempo vida={v} agir={agir} aba="semana" />} />);
    const agenda = () => screen.getByRole('region', { name: 'A agenda da semana' });
    fireEvent.click(within(agenda()).getAllByRole('button', { name: /^Teatro/ })[0]);
    const mais = within(agenda()).getAllByRole('button', { name: /^Mais a sério:/ }).find(b => !(b as HTMLButtonElement).disabled)!;
    fireEvent.click(mais);
    expect(atual.rotinas.find(r => r.id === 'teatro')?.nivel).toBe(2);
    // O compromisso continua aberto depois da mudança (a escolha não fecha a ficha dele).
    fireEvent.click(within(agenda()).getByRole('button', { name: 'Abrir a ficha da prática' }));
    expect(screen.getByRole('dialog', { name: /Teatro/ })).toBeTruthy();
  });

  it('um compromisso que chega depois em cima de uma atividade marcada vira conflito, com as saídas de verdade', () => {
    let v = transacao(comAtividades(), x => { x.trabalho.atual = undefined; }).vida;
    v = fazer(v, { tipo: 'agenda', op: { oque: 'mover', id: 'corrida', dias: [1], inicio: 10 * 60 } });
    expect(v.agenda?.lugares?.corrida).toEqual({ dias: [1], inicio: 600 });
    v = transacao(v, (x, r) => { x.trabalho.atual = undefined; contratar(x, r, ocupacao('assistente_adm')); }).vida;
    const a = agendaDaSemana(v);
    expect(a.conflitos.some(c => c.perde === 'corrida')).toBe(true);
    expect(a.presenca.corrida).toBeLessThan(1);
    let atual = v;
    render(<Ligado v0={atual} aoMudar={x => { atual = x; }} tela={(x, agir) => <Tempo vida={x} agir={agir} aba="semana" />} />);
    const agenda = screen.getByRole('region', { name: 'A agenda da semana' });
    expect(agenda.textContent).toMatch(/Conflito de horário/);
    expect(within(agenda).getByRole('button', { name: /^Largar correr/i })).toBeTruthy();
    fireEvent.click(within(agenda).getByRole('button', { name: /^Remarcar correr/i }));
    expect(atual.agenda?.lugares?.corrida).toBeUndefined();
    expect(agendaDaSemana(atual).presenca.corrida).toBe(1);
  });
});

/* ================================================================ 5.2 CELULAR */

describe('o celular', () => {
  it('abre no Instagram para criar; publicar de dentro do app; a tela inicial mostra o que o motor registrou', () => {
    let atual = vida(16);
    render(<Ligado v0={atual} aoMudar={v => { atual = v; }} tela={(v, agir) => <Tempo vida={v} agir={agir} aba="redes" />} />);
    const celular = screen.getByRole('region', { name: 'Seu celular' });
    expect(within(celular).getAllByRole('tab')).toHaveLength(7);
    expect(within(celular).getByRole('tab', { name: /OnlyFans/ }).textContent).toMatch(/a partir dos 18/);
    fireEvent.click(within(celular).getByRole('button', { name: 'Criar uma conta no Instagram' }));
    fireEvent.click(within(screen.getByRole('region', { name: 'Seu celular' })).getAllByRole('button').find(b => b.closest('.plataforma-painel__temas') && !(b as HTMLButtonElement).disabled)!);
    // REWORK 11 · SOC-11: publicar é em passos (o tipo → configurar → confirmar); a ação no fim é a mesma.
    fireEvent.click(within(screen.getByRole('region', { name: 'Seu celular' })).getByRole('button', { name: 'Continuar' }));
    fireEvent.click(within(screen.getByRole('region', { name: 'Seu celular' })).getByRole('button', { name: 'Publicar' }));
    const post = atual.redes!.contas.instagram.publicacoes[0];
    expect(post).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Voltar para a tela inicial/ }));
    const inicio = screen.getByRole('region', { name: 'Seu celular' });
    expect(inicio.textContent).toContain(post.texto);
    expect(inicio.textContent).toMatch(/viram/);
  });

  it('cada app no formato da sua rede: o YouTube conta vídeos no canal; o X, posts', () => {
    let v = vida(18);
    v = fazer(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'youtube' } });
    v = fazer(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'x' } });
    render(<main><Tempo vida={v} agir={() => true} aba="redes" /></main>);
    const celular = screen.getByRole('region', { name: 'Seu celular' });
    fireEvent.click(within(celular).getByRole('tab', { name: /YouTube/ }));
    expect(screen.getByRole('region', { name: 'Seu celular' }).textContent).toMatch(/vídeos? no canal/);
    fireEvent.click(within(screen.getByRole('region', { name: 'Seu celular' })).getByRole('tab', { name: /X \(Twitter\)/ }));
    expect(screen.getByRole('region', { name: 'Seu celular' }).textContent).toMatch(/\d+ posts?/);
  });
});

/* ========================================================= 4. QUEM SE FOI */

function ComFicha({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [aberta, setAberta] = useState<string | null>(null);
  return <Pessoas vida={vida} agir={agir} aberta={aberta} abrir={setAberta} />;
}

function comAvoMorto(): { v: Vida; avoId: string } {
  const v = adulto(30, { semente: 80 });
  const { p } = comParente(v, 'avo', 78, 'masculino', 75);
  lembrarCom(v, p.id, 'Ensinou você a pescar no açude.', 'amizade', 2, v.t - 120);
  registrarMortes(v, criarRng(3), [{ p, vin: v.vinculos[p.id], causa: 'coração' }], () => {});
  return { v, avoId: p.id };
}

describe('Em memória', () => {
  it('quem morreu há pouco fica à vista; a ficha fala no passado e oferece os gestos', () => {
    const { v, avoId } = comAvoMorto();
    render(<Ligado v0={v} tela={(x, agir) => <ComFicha vida={x} agir={agir} />} />);
    const secao = screen.getByText('Em memória').closest('section')!;
    fireEvent.click(within(secao).getByRole('button', { name: new RegExp(v.pessoas[avoId].nome) }));
    const ficha = screen.getByRole('dialog', { name: v.pessoas[avoId].nome });
    const lembrar = within(ficha).getByRole('region', { name: `Lembrar de ${v.pessoas[avoId].nome}` });
    expect(within(lembrar).getByRole('button', { name: /^Ir ao (velório|funeral) de/ })).toBeTruthy();
    expect(within(lembrar).getByRole('button', { name: /^Recordar um momento com/ })).toBeTruthy();
    expect(ficha.textContent).not.toMatch(/Está aposentad|Não tem filhos/);
  });

  it('ir à despedida entra na Linha da Vida no mesmo fio da morte', () => {
    const { v, avoId } = comAvoMorto();
    const marca = v.biografia.length;
    const w = fazer(v, { tipo: 'memoria', pessoaId: avoId, gesto: 'despedida' });
    render(<LinhaDaVida vida={w} marca={marca - 1} />);
    const despedida = w.biografia[w.biografia.length - 1];
    const fio = screen.getByText(despedida.texto).closest('.fio')!;
    const morte = w.biografia.find(x => x.id === despedida.segue)!;
    expect(morte).toBeTruthy();
    // No mesmo ano, o fio junta as duas; se a morte ficou no ano anterior (o mês dela), a despedida diz de onde veio.
    if (morte.idade === despedida.idade) { expect(fio.classList.contains('fio--junto')).toBe(true); expect(fio.textContent).toContain(morte.texto.slice(0, 30)); }
    else expect(fio.textContent).toMatch(/por causa de: “/);
  });
});

/* ===================================================== INTEGRAÇÃO (A–D) */

describe('integração: os fluxos até salvar, reabrir e continuar', () => {
  it('A — caminhar e conversar com uma amiga: a relação muda, a cena fica marcada, nada se perde ao reabrir', () => {
    let v = adulto(24, { semente: 21 });
    const p = pessoaNova(v, 24, 'feminino');
    const vin = vincular(v, p, { origem: 'trabalho', proximidade: 60, convivio: [] });
    vin.estagio = 'amigo_proximo'; vin.tInicio = v.t - 60; p.municipioId = v.moradia.municipioId;
    lembrarCom(v, p.id, 'Atravessaram juntas a cidade a pé depois do último ônibus.', 'amizade', 2, v.t - 36);
    const antes = v.vinculos[p.id].proximidade;
    for (let k = 0; k < 3; k++) {
      v = fazer(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'caminhar_junto' });
      v = fazer(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'conversar' });
      v = anos(v, 1);
    }
    expect(v.vinculos[p.id].cenas!.length).toBeGreaterThan(0);
    expect(v.vinculos[p.id].proximidade).not.toBe(antes);
    const w = reabrir(v);
    expect(w.vinculos[p.id]).toEqual(v.vinculos[p.id]);
    expect(anos(w, 1).biografia.length).toBeGreaterThanOrEqual(w.biografia.length);
  });

  it('B — o avô morre: a homenagem, a família, o luto que anda com os anos e não pesa para sempre', () => {
    const { v, avoId } = comAvoMorto();
    let w = fazer(v, { tipo: 'memoria', pessoaId: avoId, gesto: 'despedida' });
    w = reabrir(w);
    expect(w.biografia.some(e => e.segue && e.texto.includes(w.pessoas[avoId].nome))).toBe(true);
    const l0 = w.luto.find(l => l.pessoaId === avoId)!;
    expect(l0.inicial).toBeGreaterThan(0);
    w = anos(w, 6);
    expect(w.luto.some(l => l.pessoaId === avoId)).toBe(false);
    // A memória fica: a história com ele e a Linha da Vida.
    expect(w.vinculos[avoId].historia.some(h => /^Morreu, aos/.test(h.texto))).toBe(true);
  });

  it('C — tocar violão: a agenda mostra a prática, a ficha mostra o violão comprado', () => {
    let v = adulto(20, { semente: 33 });
    v = fazer(v, { tipo: 'rotina', id: 'musica', ativa: true, nivel: 1 });
    v.financas.conta += 5000;
    v = fazer(v, { tipo: 'comprar_coisa', coisaId: 'violao' });
    v = reabrir(anos(v, 1));
    render(<main><Tempo vida={v} agir={() => true} aba="semana" /></main>);
    const agenda = screen.getByRole('region', { name: 'A agenda da semana' });
    fireEvent.click(within(agenda).getAllByRole('button', { name: /^Tocar um instrumento/ })[0]);
    fireEvent.click(within(agenda).getByRole('button', { name: 'Abrir a ficha da prática' }));
    const ficha = screen.getByRole('dialog', { name: 'Tocar um instrumento' });
    expect(within(ficha).getByRole('region', { name: 'Com o que você pratica' }).textContent).toMatch(/Violão/i);
  });

  it('D — publicar um vídeo: o motor calcula o alcance, o celular mostra, o save guarda', () => {
    let v = vida(18);
    v = fazer(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'tiktok' } });
    v = fazer(v, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'tiktok', tema: 'humor' } });
    const post = v.redes!.contas.tiktok.publicacoes[0];
    expect(post.alcance).toBeGreaterThan(0);
    v = reabrir(v);
    render(<main><Tempo vida={v} agir={() => true} aba="redes" /></main>);
    fireEvent.click(screen.getByRole('button', { name: /Voltar para a tela inicial/ }));
    expect(screen.getByRole('region', { name: 'Seu celular' }).textContent).toContain(post.texto);
    void nada;
  });
});
