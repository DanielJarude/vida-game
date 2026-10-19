// @vitest-environment jsdom
/**
 * REWORK 9.6 — A pessoa e seus registros (a interface).
 *
 * Fase A: a vaga é um anúncio legível (uma coluna, os requisitos um a um, o estado da candidatura que nunca se confunde
 * com contratação) e Caminhos tem uma página inicial e quatro divisões que não se misturam.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { transacao } from '../../motor/nucleo';
import { curso } from '../../motor/dados/cursos';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { contratar, requisitosDaVaga } from '../../motor/sistemas/trabalho';
import { adulto } from '../../motor/__tests__/cenarios';
import type { Vida } from '../../motor/tipos';
import { FichaDaVaga, estadoDaVaga } from '../jogo/Trabalho';
import { PaginaCaminhos, ordemDasDivisoes, proximoNosCaminhos } from '../jogo/CaminhosDaVida';
import type { DivisaoCaminhos, ParteCaminhos } from '../navegacao';
import { Criacao } from '../telas/Criacao';
import type { ControleVida } from '../useVida';
import { Voce } from '../jogo/Voce';
import { ATRIBUTOS, valorDoAtributo } from '../../motor/sistemas/predisposicao';
import { NOME_ATRIBUTO } from '../atributos';
import type { OpcoesCriacao } from '../../motor/criacao';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true;
  const r = criarRng(20261018); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const nada = () => {};
/** 17 anos, técnico em informática concluído, procurando o primeiro emprego (o save do playtest de Caminhos). */
const tecnico = (i = 17) => transacao(adulto(i, { semente: 29 }), x => {
  const tc = curso('tec_informatica');
  x.trabalho.atual = undefined; x.educacao.basica = undefined; x.educacao.matricula = undefined; x.educacao.evadiu = false;
  x.educacao.escolaridade = 'tecnico';
  x.educacao.concluidos.push({ cursoId: tc.id, nome: tc.nome, nivel: tc.nivel, area: tc.area, tFim: x.t - 6, instituicao: 'a escola técnica' });
  x.momento = null;
}).vida;
const pagina = (v: Vida, divisao: DivisaoCaminhos, parte: ParteCaminhos = 'agora') => render(<main><PaginaCaminhos vida={v} agir={() => true} irPara={nada} divisao={divisao} parte={parte} irParte={nada} /></main>);

describe('Fase A · UX-08 — a vaga é um anúncio legível', () => {
  it('a causa do texto sobreposto não volta: nenhuma grade de duas colunas na vaga (caminhos.css)', () => {
    const css = readFileSync(join(__dirname, '..', 'caminhos.css'), 'utf8');
    expect(css).not.toMatch(/^\.vaga-camada\s*\{/m);
    const vivida = readFileSync(join(__dirname, '..', 'vivida.css'), 'utf8');
    // o resumo pode encolher (minmax(0, 1fr)); o detalhe é um bloco abaixo dele, nunca uma coluna ao lado
    expect(vivida).toMatch(/\.vaga-resumo \{[^}]*grid-template-columns: minmax\(0, 1fr\) auto/);
    expect(vivida).toMatch(/\.vaga-camada__detalhe \{ display: block;/);
  });

  it('os requisitos vêm um por linha, com o que a vida tem diante de cada um (as contas da elegibilidade)', () => {
    const v = tecnico();
    // técnico de informática: formação na área, que a vida tem
    const suporte = requisitosDaVaga(v, ocupacao('suporte_ti'));
    expect(suporte.some(r => /Técnico ou superior/.test(r.texto) && r.ok)).toBe(true);
    // a idade mínima (18) é dita — e, aos 17, ainda não cumprida
    expect(suporte.find(r => /18 anos/.test(r.texto))?.ok).toBe(false);
    // enfermagem: formação que a vida não tem
    const enf = requisitosDaVaga(v, ocupacao('tec_enfermagem'));
    expect(enf.some(r => !r.ok)).toBe(true);
  });

  it('o anúncio tem o cargo, a remuneração, os requisitos, os próximos passos e o estado — numa coluna, cada coisa no seu bloco', () => {
    const v = tecnico(19);
    const oc = ocupacao('suporte_ti');
    render(<main><FichaDaVaga vida={v} oc={oc} agir={() => true} id="a1" /></main>);
    const ad = screen.getByRole('article', { name: /técnic/i });
    for (const rotulo of ['Remuneração', 'Contrato', 'Jornada']) expect(within(ad).getByText(rotulo)).toBeTruthy();
    expect(within(ad).getByRole('region', { name: 'Requisitos' })).toBeTruthy();
    expect(within(ad).getByRole('region', { name: 'Próximos passos' }).textContent).toMatch(/entrevista/);
    expect(ad.querySelector('.anuncio__estado')!.textContent).toMatch(/Pode se candidatar|Não atende|conflito/);
  });

  it('candidatar-se não é ser contratado: enviada → seleção em andamento → recusado (com o motivo) → contratado', () => {
    const oc = ocupacao('suporte_ti');
    expect(estadoDaVaga(tecnico(17), oc).estado).toBe('nao_atende');
    const v = tecnico(19);
    expect(['pode', 'conflito']).toContain(estadoDaVaga(v, oc).estado);
    const enviada = transacao(v, x => { x.anoAtual.acoes.push(`candidatura:${oc.id}`); }).vida;
    expect(estadoDaVaga(enviada, oc).estado).toBe('enviada');
    const andamento = transacao(enviada, x => { x.momento = { id: 'm', situacaoId: 'trab_entrevista', t: x.t, titulo: 'Entrevista', texto: '', tema: 'trabalho', papeis: {}, opcoes: [] }; }).vida;
    expect(estadoDaVaga(andamento, oc).estado).toBe('andamento');
    const recusado = transacao(enviada, x => { x.caminhos.devolutivas.push({ t: x.t, tipo: 'entrevista', titulo: 'Entrevista', texto: 'Não passou: faltou experiência.', passou: false, ocupacaoId: oc.id }); }).vida;
    const r = estadoDaVaga(recusado, oc);
    expect(r.estado).toBe('recusado');
    expect(r.texto).toMatch(/faltou experiência/);
    const contratada = transacao(enviada, (x, rng) => { contratar(x, rng, oc); }).vida;
    expect(estadoDaVaga(contratada, oc).estado).toBe('contratado');
  });

  it('cargo longo, aviso longo: o anúncio aberto continua abaixo do resumo (nunca ao lado)', () => {
    pagina(tecnico(), 'trabalho', 'oportunidades');
    const resumo = document.querySelector<HTMLButtonElement>('.vaga-resumo')!;
    fireEvent.click(resumo);
    const li = resumo.closest('li')!;
    expect(li.children[0]).toBe(resumo);
    expect(li.children[1].classList.contains('vaga-camada__detalhe')).toBe(true);
    expect(li.querySelector('.anuncio')).toBeTruthy();
  });
});

describe('Fase A · UX-09/10 — Caminhos: uma página inicial e quatro divisões', () => {
  it('a página inicial mostra a situação, o próximo passo e as quatro entradas — sem listar vagas nem editais', () => {
    pagina(tecnico(), 'inicio');
    expect(document.querySelectorAll('.entrada-caminho')).toHaveLength(4);
    expect(screen.getByRole('region', { name: 'O próximo passo' }).textContent).toMatch(/Procurar trabalho/);
    expect(document.querySelector('.vaga-resumo')).toBeNull();
    expect(document.querySelector('.boletim')).toBeNull();
  });

  it('a ordem das entradas segue a fase da vida, e nenhuma some', () => {
    const t = tecnico();
    expect(ordemDasDivisoes(t)[0]).toBe('trabalho');
    expect([...ordemDasDivisoes(t)].sort()).toEqual(['estudos', 'outros', 'publica', 'trabalho']);
    const crianca = transacao(adulto(9, { semente: 4 }), x => { x.momento = null; }).vida;
    expect(ordemDasDivisoes(crianca)[0]).toBe('estudos');
    expect(proximoNosCaminhos(crianca)?.divisao).toBe('estudos');
  });

  it('Estudos e Trabalho não se misturam: o boletim não aparece no Trabalho; as vagas não aparecem nos Estudos', () => {
    const t = tecnico();
    pagina(t, 'estudos', 'oportunidades');
    expect(document.querySelector('.vaga-resumo')).toBeNull();
    cleanup();
    pagina(t, 'trabalho', 'oportunidades');
    expect(document.querySelector('.vaga-resumo')).toBeTruthy();
    expect(document.querySelector('.boletim')).toBeNull();
    // e a ligação: a formação concluída aponta para as vagas, sem repeti-las
    cleanup();
    pagina(t, 'estudos', 'agora');
    expect(screen.getByRole('button', { name: /Ver as vagas/ })).toBeTruthy();
  });
});

describe('Fase B · NASC-01/02/03 — a tela Nascer', () => {
  const controle = (nascer: (o: OpcoesCriacao) => void = () => {}) => ({ setTela: () => {}, nascer }) as unknown as ControleVida;

  it('abre com uma combinação sorteada (não mais "Mulher · Salvador" fixos): em várias aberturas, gêneros e lugares variam', () => {
    const vistos = new Set<string>();
    for (let k = 0; k < 10; k++) {
      const r = criarRng(9000 + k); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
      render(<Criacao c={controle()} />);
      const genero = screen.getByRole('radiogroup', { name: 'Gênero' }).querySelector('[aria-checked="true"]')!.textContent;
      const nome = (screen.getByRole('textbox', { name: 'Nome' }) as HTMLInputElement).value;
      vistos.add(`${genero}|${nome}`);
      cleanup(); vi.restoreAllMocks();
    }
    expect(vistos.size).toBeGreaterThan(6);
    expect([...vistos].some(x => x.startsWith('Homem'))).toBe(true);
    expect([...vistos].some(x => x.startsWith('Mulher'))).toBe(true);
  });

  it('atributos iniciais: ao acaso mostra os valores que a vida terá; "Escolher" deixa ajustar — e Nascer leva exatamente esses valores', () => {
    let recebidas: OpcoesCriacao | undefined;
    render(<Criacao c={controle(o => { recebidas = o; })} />);
    const grupo = screen.getByRole('group', { name: 'Atributos iniciais' });
    for (const a of ATRIBUTOS) expect(within(grupo).getByText(NOME_ATRIBUTO[a])).toBeTruthy();
    expect((within(grupo).getByLabelText('Inteligência', { selector: 'input' }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(within(grupo).getByRole('radio', { name: 'Escolher' }));
    const intel = within(grupo).getByLabelText('Inteligência', { selector: 'input' }) as HTMLInputElement;
    expect(intel.disabled).toBe(false);
    fireEvent.change(intel, { target: { value: '23' } });
    fireEvent.click(screen.getByRole('button', { name: 'Nascer' }));
    expect(recebidas?.atributos?.inteligencia).toBe(23);
  });

  it('"Tudo ao acaso" sorteia tudo — os atributos escolhidos voltam ao acaso (nada fica escondido com o valor de antes)', async () => {
    render(<Criacao c={controle()} />);
    const grupo = screen.getByRole('group', { name: 'Atributos iniciais' });
    fireEvent.click(within(grupo).getByRole('radio', { name: 'Escolher' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tudo ao acaso' }));
    await screen.findByRole('radio', { name: 'Ao acaso', checked: true });
    expect((within(grupo).getByLabelText('Físico', { selector: 'input' }) as HTMLInputElement).disabled).toBe(true);
  });
});

describe('Fase C · Você: a ficha dos cinco atributos', () => {
  it('cinco linhas com o valor do motor (0..100); cada uma abre o que é, as causas, o que muda na vida e o histórico', () => {
    const v = adulto(30, { semente: 41 });
    render(<main><Voce vida={v} agir={() => true} irPara={nada} abrirPessoa={nada} /></main>);
    const ficha = screen.getByRole('region', { name: 'Atributos' });
    const linhas = ficha.querySelectorAll('[data-atributo]');
    expect(linhas).toHaveLength(5);
    for (const a of ATRIBUTOS) {
      const l = ficha.querySelector(`[data-atributo="${a}"]`)!;
      expect(l.querySelector('.atributo__valor')!.textContent).toBe(String(Math.round(valorDoAtributo(v, a))));
      expect(l.querySelector('.atributo__consequencias')).toBeTruthy();
      expect(l.querySelector('.atributo__oque')).toBeTruthy();
    }
    // a cabeça (o estresse) continua um sistema à parte — não um sexto atributo
    expect(document.querySelector('.estado-bloco--cabeca')).toBeTruthy();
    expect(document.querySelector('.estado-bloco--humor')).toBeNull();
    // e não há mais os três medidores antigos nem "Bem-estar"
    expect(screen.queryByText('Bem-estar')).toBeNull();
  });
});
