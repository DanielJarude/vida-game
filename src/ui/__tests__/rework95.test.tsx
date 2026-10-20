// @vitest-environment jsdom
/**
 * REWORK 9.5 — A vida em objetos (a interface).
 *
 * Fase A: Minha Semana diz a rotina em três leituras (horários, exigência, cabeça) que não se contradizem; a dedicação
 * aos estudos diz antes o que pede (as horas) e o que tende a dar.
 * Fase B: a escola é um boletim (o domínio do motor, a evolução com causa, a frequência real, nenhum valor de enfeite);
 * cada habilidade é uma ficha — e aparece uma vez só.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { avancarAno } from '../../motor/ano';
import { criarVida } from '../../motor/criacao';
import { transacao } from '../../motor/nucleo';
import { avaliarRotina } from '../../motor/sistemas/avaliacaoDaRotina';
import { presencaNaEscola, previsaoDaPostura } from '../../motor/sistemas/agenda';
import { evolucaoDaFrente } from '../../motor/sistemas/progressao';
import { estagioDaFrente } from '../../motor/sistemas/frentes';
import { MATERIAS } from '../../motor/dados/frentes';
import type { Rotina, Vida } from '../../motor/tipos';
import { Tempo } from '../jogo/Tempo';
import { Voce } from '../jogo/Voce';
import { Estudos } from '../jogo/Estudos';
import { DesenvolvimentoReal } from '../jogo/Progresso';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  const r = criarRng(20261018); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const nada = () => {};
const rot = (id: string, nivel: 1 | 2 | 3, t: number): Rotina => ({ id, nivel, tInicio: t });
function vidaAos(idade: number, ajuste: (v: Vida) => void = () => {}, semente = 12): Vida {
  let v = criarVida({ nome: 'Ana', sobrenome: 'Reis', genero: 'feminino', municipioId: 'recife-pe', semente });
  for (let i = 0; i < idade; i++) { v = avancarAno(v).vida; v.momento = null; v.caminhos.pendente = undefined; }
  v.caminhos.processo = undefined;
  return transacao(v, ajuste).vida;
}
/** A criança do playtest: escola, futebol duas vezes, leitura, xadrez — e estresse de 11%. */
const crianca = () => vidaAos(9, x => { x.mente.estresse = 11; x.rotinas = [rot('futebol', 2, x.t - 12), rot('leitura', 1, x.t - 12), rot('xadrez', 2, x.t - 12)]; });

describe('Fase A · Minha Semana: as três leituras da rotina', () => {
  it('a criança do playtest: nenhuma contradição na tela (cabeça tranquila, semana que ainda tem horário)', () => {
    const v = crianca();
    render(<main><Tempo vida={v} agir={() => true} aba="semana" /></main>);
    const notas = screen.getByRole('region', { name: 'Como está a rotina' });
    const av = avaliarRotina(v);
    expect(notas.textContent).toContain(av.resumo);
    expect(notas.textContent).toMatch(/Ainda há horários disponíveis/);
    const tudo = screen.getByRole('main').textContent!;
    expect(tudo).not.toMatch(/não cabe mais nada|Sobra espaço para descansar|mais atividades do que cabe/i);
    // cada nota diz uma coisa: horários, exigência, cabeça — com o número do motor
    expect(within(notas).getByRole('article', { name: 'Horários' }).textContent).toContain(`${av.horarios.livres} h livres`);
    // e a agenda diz o MESMO número (uma conta só para "horas livres" em Minha Semana)
    expect(screen.getByRole('region', { name: 'A agenda da semana' }).textContent).toContain(`uns ${av.horarios.livres} h livres na semana`);
    expect(within(notas).getByRole('article', { name: 'Cabeça' }).textContent).toContain(`${av.cabeca.valor}%`);
  });

  it('a dedicação diz antes o que pede: as horas de estudo em casa e o preço, da mesma conta do motor', () => {
    const v = crianca();
    render(<main><Estudos vida={v} agir={() => true} irPara={nada} parte="agora" /></main>);
    const grupo = screen.getByRole('radiogroup', { name: 'Postura nos estudos' });
    const ded = within(grupo).getByRole('radio', { name: /Com dedicação/ });
    const pv = previsaoDaPostura(v, 'dedicada');
    expect(ded.textContent).toContain(`+${String(pv.horas).replace('.', ',')} h por semana`);
    expect(ded.textContent).toContain(pv.custo);
    expect(within(grupo).getByRole('radio', { name: /Empurrando/ }).textContent).toMatch(/devolve tempo/);
    expect(within(grupo).getByRole('radio', { checked: true }).textContent).toMatch(/No ritmo/);
  });
});

describe('Fase B · o boletim e as fichas', () => {
  it('o boletim mostra o domínio do motor, a evolução com causa e a frequência real — e nenhuma nota por matéria inventada', () => {
    const v = vidaAos(13);
    render(<main><DesenvolvimentoReal vida={v} /></main>);
    const b = screen.getByRole('region', { name: 'Boletim escolar' });
    for (const d of MATERIAS.filter(m => v.caminhos.frentes[m])) {
      const e = evolucaoDaFrente(v, d)!;
      const linha = b.querySelector(`[data-frente="${d}"]`)!;
      expect(Number(linha.querySelector('[data-agora]')!.getAttribute('data-agora'))).toBe(e.agora);
      for (const [fonte, x] of e.causas) if (Math.abs(x) >= 0.1) expect(linha.querySelector(`[data-fonte="${fonte}"]`)).toBeTruthy();
      expect(linha.textContent!.toLowerCase()).toContain(estagioDaFrente(v, d).palavra.toLowerCase());
    }
    expect(Number(b.querySelector('[data-nota="escola"]')!.getAttribute('data-agora'))).toBe(v.educacao.basica!.desempenho);
    expect(Number(b.querySelector('[data-frequencia]')!.getAttribute('data-frequencia'))).toBe(Math.round(presencaNaEscola(v) * 100));
    expect(b.textContent).toContain(`${v.eu.nome} ${v.eu.sobrenome}`);
    // as matérias aparecem uma vez só em Desenvolvimento (antes: "Como você está se saindo" + "As matérias")
    expect(screen.queryByRole('region', { name: 'As matérias' })).toBeNull();
  });

  it('Português de 3,2 para 8,6 aos 8 anos: o boletim não diz mais "tropeça na redação"', () => {
    const v = vidaAos(8, x => { const f = x.caminhos.frentes.linguagens!; f.habilidade = 8.6; f.auge = Math.max(f.auge, 8.6); });
    render(<main><DesenvolvimentoReal vida={v} /></main>);
    const linha = screen.getByRole('region', { name: 'Boletim escolar' }).querySelector('[data-frente="linguagens"]')!;
    expect(linha.textContent).not.toMatch(/tropeça/);
    expect(linha.textContent).toMatch(/esperado/);
  });

  it('em Você, cada habilidade é uma ficha — e cada uma aparece uma vez só', () => {
    const v = vidaAos(12, x => { x.rotinas = [rot('xadrez', 2, x.t - 24), rot('futebol', 2, x.t - 24)]; });
    const w = avancarAno(avancarAno(v).vida).vida;
    w.momento = null;
    render(<main><Voce vida={w} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    const fichas = [...document.querySelectorAll('.ficha-hab')].map(x => x.getAttribute('data-frente'));
    expect(fichas.length).toBeGreaterThan(0);
    expect(new Set(fichas).size).toBe(fichas.length);
    const xadrez = document.querySelector('.ficha-hab[data-frente="xadrez"]');
    if (xadrez) expect(xadrez.textContent).toMatch(/No último ano/);
  });
});

/* =============================================================== Fase C/D — Caminhos, Vida, História */

import { adulto } from '../../motor/__tests__/cenarios';
import { curso } from '../../motor/dados/cursos';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { executar } from '../../motor/acoes';
import { PaginaCaminhos } from '../jogo/CaminhosDaVida';
import { VidaConcreta } from '../jogo/VidaConcreta';
import { RetratoDaVida, mudancasRecentes } from '../jogo/RetratoDaVida';
import type { DivisaoCaminhos, ParteCaminhos } from '../navegacao';

/** 17 anos, técnico concluído, sem escola e sem emprego: procurando o primeiro trabalho. */
const tecnico = () => transacao(adulto(17, { semente: 29 }), x => {
  const tc = curso('tec_informatica');
  x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.evadiu = false;
  x.educacao.escolaridade = 'tecnico';
  x.educacao.concluidos.push({ cursoId: tc.id, nome: tc.nome, nivel: tc.nivel, area: tc.area, tFim: x.t - 6, instituicao: 'a escola técnica' });
  x.momento = null;
}).vida;
const caminhos = (v: Vida, parte: ParteCaminhos, divisao: DivisaoCaminhos = 'trabalho') => render(<main><PaginaCaminhos vida={v} agir={() => true} irPara={nada} divisao={divisao} parte={parte} irParte={nada} /></main>);

// REWORK 9.6 · UX-09/10: o que o REWORK 9.5 agrupava dentro do Trabalho (a vida pública, as outras trajetórias) virou
// divisão de Caminhos. Os mesmos cenários: as vagas primeiro; a política existe — no lugar dela, nunca misturada.
describe('Cenário 6 · Caminhos aos 17, com técnico e procurando emprego', () => {
  it('em Trabalho · Agora, as vagas vêm primeiro; nada de política no meio', () => {
    caminhos(tecnico(), 'agora');
    const acoes = screen.getByRole('list', { name: 'O que dá para fazer agora' });
    expect(within(acoes).getAllByRole('button')[0].textContent).toMatch(/vagas/i);
    expect(within(acoes).queryByText(/partido|bandeira/i)).toBeNull();
    // só a parte aberta é desenhada
    expect(document.querySelectorAll('[role=tabpanel]')).toHaveLength(1);
  });

  it('aos 20, procurando: as ações políticas existem — em Vida pública; o Trabalho só aponta para lá', () => {
    const v = transacao(adulto(20, { semente: 33 }), x => { x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.momento = null; }).vida;
    caminhos(v, 'agora');
    const principais = screen.getByRole('list', { name: 'O que dá para fazer agora' });
    expect(principais.textContent).not.toMatch(/partido|bandeira/i);
    expect(within(principais).getAllByRole('button')[0].textContent).toMatch(/vagas/i);
    expect(screen.getByRole('button', { name: /Ir para Vida pública/ })).toBeTruthy();
    cleanup();
    caminhos(v, 'agora', 'publica');
    expect(screen.getByRole('list', { name: 'O que dá para fazer na vida pública' }).textContent).toMatch(/partido|bandeira|comunidade|concurso/i);
  });

  it('as pastas e as divisões mantêm tudo acessível: profissões e negócio em Trabalho, serviço público em Vida pública, esporte em Outros caminhos', () => {
    caminhos(tecnico(), 'oportunidades');
    // aos 17, a procura de trabalho tem uma pasta só (Profissões): as vagas, sem o seletor; nada de vida pública aqui
    expect(document.querySelectorAll('.vaga-resumo').length).toBeGreaterThan(0);
    expect(screen.queryByRole('radio', { name: 'Vida pública' })).toBeNull();
    cleanup();
    caminhos(tecnico(), 'agora', 'publica');
    expect(screen.getByRole('heading', { name: 'Serviço público' })).toBeTruthy();
    cleanup();
    caminhos(tecnico(), 'agora', 'outros');
    expect(screen.getByRole('heading', { name: 'Esporte' })).toBeTruthy();
    // cada caminho é uma ficha curta: o "como começa" abre quando pedido
    expect(document.querySelector('.caminho .caminho__mais summary')?.textContent).toMatch(/Como essa vida costuma começar/);
  });
});

describe('Cenário 8 · Vida: o que se compra continua conectado', () => {
  it('a coisa comprada aparece em Patrimônio, junto do balanço; Dinheiro aponta para lá', () => {
    let v = transacao(adulto(32, { semente: 5 }), x => { x.financas.conta = 80000; x.momento = null; }).vida;
    v = executar(v, { tipo: 'comprar_coisa', coisaId: 'violao' }).vida;
    expect((v.financas.coisas ?? []).some(c => c.coisaId === 'violao')).toBe(true);
    render(<main><VidaConcreta vida={v} agir={() => true} secao="pertences" irSecao={nada} irPara={nada} abrirPessoa={nada} /></main>);
    expect(screen.getByRole('tab', { name: 'Patrimônio', selected: true })).toBeTruthy();
    expect(document.querySelector('.patrimonio')!.textContent).toMatch(/[Vv]iolão/);
    cleanup();
    render(<main><VidaConcreta vida={v} agir={() => true} secao="dinheiro" irSecao={nada} irPara={nada} abrirPessoa={nada} /></main>);
    expect(screen.getByRole('button', { name: /Patrimônio/ })).toBeTruthy();
  });
});

describe('Cenário 9 · uma mudança real aparece em Você e, quando é biográfica, no alto da História', () => {
  it('começar a trabalhar: a ficha de Você diz o trabalho; a História diz que mudou no último ano', () => {
    // REWORK 9.7: semente 15 — na 14, a nova sequência de sorteios trouxe um corte de pessoal no primeiro ano (a taxa de
    // demissão no primeiro ano é a mesma de antes: 13 × 11 em 200 vidas). A pré-condição agora é dita: continua empregada.
    let v = transacao(adulto(22, { semente: 15 }), x => { x.trabalho.atual = undefined; x.momento = null; }).vida;
    v = avancarAno(v).vida; v.momento = null;
    v = transacao(v, (x, r) => { contratar(x, r, ocupacao('assistente_adm')); }).vida;
    v = avancarAno(v).vida; v.momento = null;
    expect(v.trabalho.atual?.ocupacaoId).toBe('assistente_adm');
    expect(mudancasRecentes(v).some(t => /Começou a trabalhar/.test(t))).toBe(true);
    render(<main><RetratoDaVida vida={v} irPara={nada} abrirPessoa={nada} /></main>);
    const retrato = screen.getByRole('region', { name: 'A vida agora' });
    expect(retrato.textContent).toMatch(/Começou a trabalhar/);
    expect(retrato.textContent).toMatch(/[Aa]ssistente/);
    // sem os quatro medidores
    expect(within(retrato).queryAllByRole('img', { name: /de 5$/ })).toHaveLength(0);
  });
});
