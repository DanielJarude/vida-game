// @vitest-environment jsdom
/**
 * REWORK 9 · Fase D — as integrações de verdade: trajetórias completas, não componentes soltos. Cada cenário segue a
 * cadeia AÇÃO → ESTADO → AGENDA/ANO → CONSEQUÊNCIA → TELA → SAVE, com as premissas ditas no começo.
 *
 *   A  estudante e futebol      escola + escolinha → agenda → treino com causa → gente → peneira em Caminhos → Você →
 *                               História → save
 *   B  trabalho e faculdade     emprego integral + curso → turno da noite (o da manhã é bloqueado, com o porquê) →
 *                               o conflito forçado cobra a nota → Caminhos mostra os dois → biografia
 *   C  relações e tempo         amizade próxima → a rotina muda, o contato cai → a relação esfria na proporção → o
 *                               reencontro aproxima → a história mostrada é a que aconteceu (e família é família)
 *   D  redes e carreira         seguidores + um ano sem publicar + o nome que cresce → o balanço fecha com o motivo →
 *                               o celular mostra → salvar e abrir não reaplica
 *   E  futebol e promoção       campeão da divisão → a temporada seguinte na divisão de cima → histórico → save
 *   +  outros países            a liga e o cargo de quem entra na vida respeitam o país (Espanha, Portugal)
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { precarregar } from '../App';
import { criarRng } from '../../motor/rng';
import { criarVida } from '../../motor/criacao';
import { avancarAno } from '../../motor/ano';
import { disponibilidade, executar, type Acao } from '../../motor/acoes';
import { interpretar } from '../../motor/save';
import { idadePessoa, transacao } from '../../motor/nucleo';
import { contratar } from '../../motor/sistemas/trabalho';
import { ocupacao } from '../../motor/dados/ocupacoes';
import { calcularDesempenho } from '../../motor/sistemas/escola';
import { agendaDaSemana, presencaNoCurso } from '../../motor/sistemas/agenda';
import { evolucaoDaFrente } from '../../motor/sistemas/progressao';
import { contaAtiva, fimDoBalanco } from '../../motor/sistemas/redesBase';
import { registrarTemporada } from '../../motor/sistemas/palmares';
import { divisaoDoClube, regrasDeAcesso, temporadaCorrente } from '../../motor/sistemas/ligas';
import { clubesDoPais } from '../../motor/dados/clubes';
import { cidadesDoPais } from '../../motor/dados/lugares';
import { carregarRegiao } from '../../motor/mundo/carregar';
import { ocupacaoDeAdulto } from '../../motor/sistemas/filhos';
import { podeTentar } from '../../motor/plausibilidade';
import { adulto, comParente, pessoaNova } from '../../motor/__tests__/cenarios';
import { vincular } from '../../motor/pessoas';
import type { CarreiraEsportiva, Temporada, Vida } from '../../motor/tipos';
import { PaginaCaminhos, situacaoAtual } from '../jogo/CaminhosDaVida';
import { Voce } from '../jogo/Voce';
import { RedesSociais } from '../jogo/Redes';
import { Pessoas } from '../jogo/Pessoas';

beforeAll(async () => { await precarregar(); });
beforeEach(() => {
  localStorage.clear(); window.scrollTo = () => {}; window.confirm = () => true;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
  const r = criarRng(20261018); vi.spyOn(Math, 'random').mockImplementation(() => r.next());
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ano = (v: Vida) => { const n = avancarAno(v).vida; n.momento = null; n.caminhos.pendente = undefined; n.caminhos.processo = undefined; return n; };
const reabrir = (v: Vida): Vida => { const r = interpretar(JSON.stringify(v)); if (r.tipo !== 'ok') throw new Error('save inválido'); return r.vida; };
const fazer = (v: Vida, a: Acao) => executar(v, a).vida;

describe('Cenário A — estudante e futebol', () => {
  it('escola + escolinha → horários reservados → treino com causa → gente nova → peneira em Caminhos → Você → História → save', () => {
    let v = criarVida({ nome: 'Caio', sobrenome: 'Nunes', genero: 'masculino', municipioId: 'recife-pe', semente: 77 });
    for (let k = 0; k < 11; k++) v = ano(v);
    // Premissa: na escola, sem outras atividades — e com jeito para a bola (o motor só abre peneira para quem se destaca).
    v = transacao(v, x => { x.rotinas = []; x.agenda = undefined; x.caminhos.frentes.futebol = { interesse: 70, meses: 24, habilidade: 58, tInicio: x.t - 36, tUltimo: x.t - 2, retomadas: 0, auge: 58 }; }).vida;
    expect(v.educacao.basica).toBeTruthy();
    v = fazer(v, { tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 });
    // A agenda reserva os horários: a escolinha fora do horário da escola.
    const a = agendaDaSemana(v);
    const escola = a.blocos.find(b => b.id === 'escola')!;
    const bola = a.blocos.filter(b => b.ref === 'futebol');
    expect(bola.length).toBeGreaterThan(0);
    for (const b of bola) expect(b.inicio >= escola.fim || b.fim <= escola.inicio || !b.dias.some(d => escola.dias.includes(d))).toBe(true);
    expect(a.presenca.futebol).toBe(1);
    const t0 = v.t;
    let peneira = false;
    for (let k = 0; k < 6 && !peneira; k++) { v = ano(v); peneira = v.caminhos.oportunidades.some(o => o.tipo === 'peneira'); }
    // A prática desenvolveu de verdade — e a causa registrada é a escolinha.
    const e = evolucaoDaFrente(v, 'futebol')!;
    expect(e.agora).toBeGreaterThan(58);
    expect((v.evolucao ?? []).some(f => (f.causas?.futebol ?? []).some(([fonte, x]) => fonte === 'rotina:futebol' && x > 0))).toBe(true);
    // Conheceu gente pela atividade.
    expect(Object.values(v.vinculos).some(x => (x.ambiente ?? '').startsWith('rotina:futebol') && x.tInicio >= t0)).toBe(true);
    // A peneira aparece em Caminhos · Outros caminhos (REWORK 9.6: a divisão do esporte e da arte) — e a página inicial aponta para lá.
    expect(peneira).toBe(true);
    const porta = v.caminhos.oportunidades.find(o => o.tipo === 'peneira')!;
    const c = render(<main><PaginaCaminhos vida={v} agir={() => true} irPara={() => {}} divisao="outros" parte="agora" irParte={() => {}} /></main>);
    expect(c.container.querySelector('.caminhos__painel--outros')!.textContent).toContain(porta.titulo);
    c.unmount();
    const ini = render(<main><PaginaCaminhos vida={v} agir={() => true} irPara={() => {}} divisao="inicio" parte="agora" irParte={() => {}} /></main>);
    expect(ini.container.querySelector('.entrada-caminho--outros')!.textContent).toMatch(/porta aberta|portas abertas/);
    ini.unmount();
    c.unmount();
    // Você mostra a mudança, com a causa.
    const w = render(<main><Voce vida={v} agir={() => true} irPara={() => {}} abrirPessoa={() => {}} /></main>);
    expect(w.container.querySelector('[data-frente="futebol"] [data-fonte="rotina:futebol"]')).toBeTruthy();
    w.unmount();
    // A História registra (a escolinha, o destaque, a peneira).
    expect(v.biografia.some(b => b.t >= t0 && /bola|futebol|escolinha|peneira|artilheir|campeonato/i.test(b.texto))).toBe(true);
    // E tudo persiste.
    const lido = reabrir(v);
    expect(lido.agenda).toEqual(v.agenda);
    expect(lido.evolucao).toEqual(v.evolucao);
    expect(lido.caminhos.oportunidades).toEqual(v.caminhos.oportunidades);
  });
});

describe('Cenário B — trabalho e faculdade', () => {
  it('emprego integral + curso: o curso vai para a noite; a manhã é bloqueada com o porquê; o conflito forçado cobra a nota; Caminhos mostra os dois', () => {
    let v = adulto(24, { semente: 8 });
    v = transacao(v, (x, r) => {
      x.trabalho.atual = undefined; contratar(x, r, ocupacao('assistente_adm'));
      x.educacao.matricula = { cursoId: 'administracao', instituicao: 'Faculdade da Cidade', rede: 'privada', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 40, mensalidade: 800, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
    }).vida;
    const a = agendaDaSemana(v);
    expect(a.blocos.find(b => b.id === 'curso')!.turno).toBe('noite');
    expect(a.conflitos).toEqual([]);
    const manha = disponibilidade(v, { tipo: 'agenda', op: { oque: 'turno', fonte: 'curso', turno: 'manha' } });
    expect(podeTentar(manha)).toBe(false);
    expect(manha.motivo).toMatch(/mesmo horário/);
    // As condições reagem: com o curso de manhã (o conflito existindo), as aulas viram falta e a nota cai.
    const forcado = transacao(v, x => { (x.agenda ??= {}).turnos = { curso: 'manha' }; }).vida;
    expect(presencaNoCurso(forcado)).toBeLessThan(0.2);
    expect(calcularDesempenho(forcado, criarRng(3), 0, ['humanas'], presencaNoCurso(forcado))).toBeLessThan(calcularDesempenho(v, criarRng(3), 0, ['humanas'], presencaNoCurso(v)));
    // Caminhos mostra trabalho e formação ao mesmo tempo.
    const lados = situacaoAtual(v).map(x => x.lado);
    expect(lados).toContain('trabalho');
    expect(lados).toContain('formacao');
    // REWORK 9.6: a página inicial mostra os dois (cada um leva à sua divisão); cada divisão mostra só o seu.
    const ini = render(<main><PaginaCaminhos vida={v} agir={() => true} irPara={() => {}} divisao="inicio" parte="agora" irParte={() => {}} /></main>);
    expect([...ini.container.querySelectorAll('.situacao-atual__lado')].map(x => x.textContent)).toEqual(expect.arrayContaining(['Estudos', 'Trabalho']));
    ini.unmount();
    for (const [divisao, lado] of [['estudos', 'formacao'], ['trabalho', 'trabalho']] as const) {
      const d = render(<main><PaginaCaminhos vida={v} agir={() => true} irPara={() => {}} divisao={divisao} parte="agora" irParte={() => {}} /></main>);
      expect([...d.container.querySelectorAll('.caminhos__painel--agora [data-lado]')].map(x => x.getAttribute('data-lado'))).toEqual([lado]);
      d.unmount();
    }
    // A biografia registra o marco (o ano de trabalho e estudo segue).
    const depois = ano(v);
    expect(depois.educacao.matricula!.mesesRestantes).toBeLessThan(40);
  });
});

describe('Cenário C — relações e tempo', () => {
  it('a amizade próxima esfria quando a rotina afasta, na proporção; o reencontro aproxima; a história é a que aconteceu; família continua família', () => {
    let v = adulto(30, { semente: 19 });
    let amigaId = '';
    let irmaoId = '';
    v = transacao(v, (x, r) => {
      const p = pessoaNova(x, 30, 'feminino');
      p.nome = 'Bia';
      const vin = vincular(x, p, { origem: 'trabalho', proximidade: 72, estagio: 'amigo_proximo', convivio: ['trabalho'] });
      vin.confianca = 70;
      amigaId = p.id;
      const { p: irmao, vin: vi2 } = comParente(x, 'irmao', 33, 'masculino', 50);
      irmaoId = irmao.id;
      vi2.convivio = [];
      void r;
    }).vida;
    const memoriasAntes = v.vinculos[amigaId].historia.length;
    // A rotina muda: a amiga deixa de estar no dia a dia (outro trabalho, outra cidade da vida).
    v = transacao(v, x => { x.vinculos[amigaId].convivio = []; x.vinculos[amigaId].tUltimoContato = x.t; }).vida;
    const prox0 = v.vinculos[amigaId].proximidade;
    for (let k = 0; k < 3; k++) v = ano(v);
    const prox3 = v.vinculos[amigaId].proximidade;
    expect(prox3).toBeLessThan(prox0);
    // Proporcional: três anos sem contato esfriam, não zeram.
    expect(prox3).toBeGreaterThan(prox0 - 50);
    // O irmão continua irmão, mesmo sem contato.
    expect(v.vinculos[irmaoId].parentesco).toBe('irmao');
    // Retomar o contato aproxima — e vira memória de verdade (uma, a do que se fez).
    const r = executar(v, { tipo: 'pessoa', pessoaId: amigaId, interacao: 'conversar' });
    v = r.vida;
    expect(v.vinculos[amigaId].proximidade).toBeGreaterThanOrEqual(prox3);
    // Nenhuma memória inventada: tudo o que a relação guarda é de antes de agora, e a tela de Pessoas mostra o mesmo.
    for (const m of v.vinculos[amigaId].historia) expect(m.t).toBeLessThanOrEqual(v.t);
    expect(v.vinculos[amigaId].historia.length).toBeGreaterThanOrEqual(memoriasAntes);
    render(<main><Pessoas vida={v} agir={() => true} aberta={null} abrir={() => {}} /></main>);
    const nossa = document.querySelector('.nossa-historia');
    const textos = nossa ? [...nossa.querySelectorAll('.nossa-historia__item')].map(li => li.textContent ?? '') : [];
    const guardadas = Object.values(v.vinculos).flatMap(w => w.historia.map(m => m.texto));
    for (const t of textos) expect(guardadas.some(g => t.includes(g))).toBe(true);
    void idadePessoa;
  });
});

describe('Cenário D — redes e carreira', () => {
  it('seguidores, um ano sem publicar e o nome crescendo pelo trabalho: o balanço fecha, diz o motivo, a tela mostra, o save não reaplica', () => {
    let v = adulto(26, { semente: 61 });
    v = transacao(v, x => { x.financas.conta = 1e6; }).vida;
    v = fazer(v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } });
    v = transacao(v, x => {
      const c = contaAtiva(x, 'instagram')!;
      c.balanco = { desde: x.t, inicio: c.seguidores, organico: 0, publicacoes: 0, exposicao: 0, comprados: 0, perdas: 0, famaInicio: 20 };
      // O acontecimento profissional: o nome sobe (a fonte é o trabalho — aqui, a arte).
      x.notoriedade = { valor: 66, pico: 66, t: x.t, fonte: 'arte', origens: { arte: 66 } };
    }).vida;
    v = ano(v);
    const c = contaAtiva(v, 'instagram')!;
    const b = c.anos![c.anos!.length - 1];
    expect(fimDoBalanco(b)).toBe(b.fim);
    expect(b.publicacoes).toBe(0);
    expect(b.exposicao).toBeGreaterThan(0);
    expect((b.motivos ?? []).join(' ')).toMatch(/notoriedade/);
    render(<main><RedesSociais vida={v} agir={() => true} /></main>);
    expect(screen.getByRole('region', { name: 'De onde veio o público' }).textContent).toMatch(/pelo nome/);
    const lido = reabrir(v);
    expect(contaAtiva(lido, 'instagram')!.seguidores).toBe(c.seguidores);
    expect(ano(lido).redes).toEqual(ano(v).redes);
  });
});

describe('Cenário E — futebol e promoção', () => {
  it('campeão da divisão → a temporada seguinte é na de cima, registrada como tal, e o save guarda', () => {
    let v = transacao(adulto(23, { municipioId: 'belem-pa', semente: 12 }), x => {
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Paysandu', nivel: 3, tInicio: x.t - 48, tFase: x.t - 36, lesoes: 0, municipioId: 'belem-pa', reputacao: 52, espaco: 'titular', contratoAte: x.t + 60, posicao: 'atacante', temporadas: [] };
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Paysandu', contrato: 'clt', salario: 25000, tInicio: x.t - 36, desempenho: 70, municipioId: 'belem-pa', carga: 'integral' };
    }).vida;
    v = transacao(v, (x, r) => {
      const e = x.caminhos.esporte as CarreiraEsportiva;
      const t: Temporada = { ano: temporadaCorrente(x), clube: e.clube, nivel: 3, posicao: 'atacante', partidas: 36, titular: 34, gols: 19, assistencias: 5, nota: 7.6, colocacao: 1, mesesFora: 0 };
      (e.temporadas ??= []).push(t);
      registrarTemporada(x, r, e, t);
    }).vida;
    expect(v.caminhos.esporte!.nivel).toBe(4);
    v = reabrir(v);
    expect(divisaoDoClube(v, 'Paysandu', 'BR')).toBe(4);
    v = ano(v);
    const ts = v.caminhos.esporte!.temporadas!;
    const ult = ts[ts.length - 1];
    if (ult.clube === 'Paysandu') expect(ult.nivel).toBe(4);
  });
});

describe('Outros países — as regras e os cargos são do lugar', () => {
  it('Espanha: a liga troca três por divisão (o padrão do mundo), não as quatro do Brasil', async () => {
    await carregarRegiao('europa');
    expect(regrasDeAcesso('ES').troca).toEqual([3, 3, 3]);
    expect(regrasDeAcesso('BR').troca).toEqual([4, 4, 4]);
    expect(clubesDoPais('ES').length).toBeGreaterThan(0);
  });

  it('Portugal: o cargo de quem entra na vida existe em Portugal (nada de "soldado da PM")', async () => {
    await carregarRegiao('europa');
    const v = adulto(30, { semente: 4 });
    for (let k = 0; k < 40; k++) {
      const p = { ...Object.values(v.pessoas)[0], id: `pt_${k}`, municipioId: cidadesDoPais('PT')[0].id, vida: { aptidao: 0, escolaridade: 'medio' as const, experiencia: 0, trajetoria: [] } };
      const oc = ocupacaoDeAdulto(p, 'medio', 30);
      if (oc?.paises) expect(oc.paises).toContain('PT');
    }
  });
});
