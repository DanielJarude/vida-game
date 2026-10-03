/**
 * Carreira de técnico 2.0 — o banco com gramática própria (`sistemas/tecnico`).
 *
 * Atravessa: o comando num clube real → temporadas jogadas (J = V + E + D
 * por temporada, passagem e carreira) → títulos, acessos e rebaixamentos que
 * saem da tabela → a demissão fecha a passagem e o clube novo abre outra →
 * a proposta mostrada é a executada → a final decidida no momento entra na
 * temporada → a carreira de jogador continua consultável → save/reload →
 * o legado lista as duas trajetórias.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { CLUBES, oClube } from '../dados/clubes';
import { garantirFrente } from '../sistemas/frentes';
import { carreirasEsportivas, encerrarCarreira, entrarNaBase, fecharTemporada, profissionalizar } from '../sistemas/esporte';
import { registrarTemporada } from '../sistemas/palmares';
import { aceitarPropostaDeTecnico, criarPropostaDeTecnico, decidirFinal, demitirDoComando, ligaAteACrise, linhaDoTecnico, passagemAtual, processarTecnico, propostaDeCrise, resumoDaPassagem, resumoDoTecnico } from '../sistemas/tecnico';
import { exportarVida, importarVida } from '../save';
import { resolverSituacao, situacaoAberta, trajetoriaDeSituacao } from '../sistemas/situacoes';
import { trajetoriasDaVida } from '../sistemas/legado';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { executar } from '../acoes';

const recarregar = (v: Vida): Vida => { const l = importarVida(exportarVida(v)); if (l.tipo !== 'ok') throw new Error(`save: ${l.tipo}`); return l.vida; };

let base: Vida | undefined;
const quarenta = (): Vida => structuredClone((base ??= adulto(38, { semente: 77, genero: 'masculino', municipioId: 'recife-pe' })));

/** Um técnico recém-promovido (o comando acabou de chegar): o jogo escolhe o clube real. */
function tecnico(o: { exAtleta?: boolean } = {}): Vida {
  return transacao(quarenta(), (x, r) => {
    x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
    garantirFrente(x, 'futebol');
    if (o.exAtleta) {
      Object.assign(x.caminhos.frentes.futebol!, { habilidade: 86, interesse: 90, meses: 200, auge: 88 });
      entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
      profissionalizar(x, r, 3);
      const e = x.caminhos.esporte!;
      for (let k = 0; k < 6; k++) { const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); }
      encerrarCarreira(x, e, 'idade');
    }
    x.trabalho.experiencia['treino'] = 48;
    contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade');
    processarTecnico(x, r);
    x.momento = null;
  }).vida;
}

/** Anos no banco, pelo próprio motor (proposta de clube: aceita). */
function anos(v: Vida, n: number, semente = 1): Vida {
  for (let k = 0; k < n; k++) {
    v = transacao(v, x => {
      const r = criarRng(semente * 1000 + k);
      x.t += 12;
      processarTecnico(x, r);
      const c = x.caminhos.tecnico!;
      if (c.proposta) aceitarPropostaDeTecnico(x, r, c.proposta.id);
      // Sem clube e sem proposta por muito tempo: um clube pequeno chama (o teste quer passagens, não o desemprego).
      if (!passagemAtual(x) && c.tFim === undefined && !c.proposta && k % 2 === 1) { criarPropostaDeTecnico(x, r, c, 1, 'sem_clube'); aceitarPropostaDeTecnico(x, r, c.proposta!.id); }
      if (passagemAtual(x)?.decisao) decidirFinal(x, r, 'neutro');
    }).vida;
  }
  return v;
}

describe('o comando num clube real, com temporadas jogadas', () => {
  it('quem assume o comando dirige um clube do catálogo, e o emprego diz o nome do clube', () => {
    const v = tecnico();
    const p = passagemAtual(v)!;
    expect(CLUBES.some(c => c.nome === p.clube)).toBe(true);
    expect(v.trabalho.atual!.empregador).toBe(oClube(p.clube));
    expect(v.trabalho.atual!.salario).toBe(p.salario);
    // A primeira temporada já foi jogada no ano em que o comando chegou.
    expect(p.temporadas.length).toBe(1);
  });

  it('J = V + E + D por temporada, por passagem e na carreira; títulos, acessos e rebaixamentos saem da tabela', () => {
    let v = anos(tecnico({ exAtleta: true }), 18, 3);
    const c = v.caminhos.tecnico!;
    let total = 0;
    for (const p of c.passagens) {
      const r = resumoDaPassagem(p);
      expect(r.jogos).toBe(r.v + r.e + r.d);
      total += r.jogos;
      for (const t of p.temporadas) {
        expect(t.jogos).toBe(t.v + t.e + t.d);
        expect(t.jogos).toBeGreaterThan(0);
        // O título da liga é o 1º lugar; o estadual, a final ganha.
        for (const x of t.titulos ?? []) {
          if (/estadual/.test(x)) expect(t.estadual).toBe('campeão');
          else if (/Série|divisões/.test(x)) expect(t.colocacao).toBe(1);
        }
        if (t.estadual === 'campeão') expect((t.titulos ?? []).some(x => /estadual/.test(x))).toBe(true);
        expect(t.acesso && t.rebaixamento).toBeFalsy();
      }
      // O acesso muda a divisão da temporada seguinte na mesma passagem; o rebaixamento, também.
      for (let k = 1; k < p.temporadas.length; k++) {
        const a = p.temporadas[k - 1], b = p.temporadas[k];
        if (a.acesso) expect(b.nivel).toBe(a.nivel + 1);
        if (a.rebaixamento) expect(b.nivel).toBe(a.nivel - 1);
        if (!a.acesso && !a.rebaixamento) expect(b.nivel).toBe(a.nivel);
      }
    }
    const res = resumoDoTecnico(c);
    expect(res.jogos).toBe(total);
    expect(res.jogos).toBe(res.v + res.e + res.d);
    expect(linhaDoTecnico(c)).toMatch(/clubes? · \d+ jogos · \d+ vitórias · \d+ empates · \d+ derrotas · \d+ títulos?/);
    v = recarregar(v);
    expect(resumoDoTecnico(v.caminhos.tecnico!)).toEqual(res);
  });
});

describe('demissão, clube novo, proposta executada como mostrada', () => {
  it('a demissão fecha a passagem e o emprego; o clube seguinte é outra passagem', () => {
    let v = tecnico();
    const primeiro = passagemAtual(v)!.clube;
    // A diretoria no limite: nos pontos de checagem, o cargo cai.
    for (let k = 0; k < 6 && passagemAtual(v); k++) v = transacao(v, x => { passagemAtual(x)!.pressao = 100; x.t += 12; processarTecnico(x, criarRng(70 + k)); }).vida;
    const c = v.caminhos.tecnico!;
    const demitida = c.passagens.find(p => p.saida === 'demissao');
    expect(demitida).toBeTruthy();
    expect(demitida!.ate).toBeDefined();
    expect(v.trabalho.historico.some(h => h.ocupacaoId === 'tecnico_futebol' && /demitido/.test(h.motivo))).toBe(true);
    expect(v.biografia.some(e => /Demitid[oa] d[oa] /.test(e.texto))).toBe(true);
    // A proposta: criada uma vez, mostrada, e é ESTA que se executa.
    v = transacao(v, (x, r) => { if (!passagemAtual(x)) criarPropostaDeTecnico(x, r, x.caminhos.tecnico!, 2, 'sem_clube', primeiro); }).vida;
    const prop = v.caminhos.tecnico!.proposta!;
    v = transacao(v, x => { const d = conteudoPorId('tec_proposta'); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, criarRng(5))); }).vida;
    expect(v.momento?.texto).toContain(prop.clube);
    v = executar(v, { tipo: 'decidir', opcaoId: 'aceitar' }).vida;
    const nova = passagemAtual(v)!;
    expect(nova.clube).toBe(prop.clube);
    expect(nova.salario).toBe(prop.salario);
    expect(nova.municipioId).toBe(prop.municipioId);
    expect(nova.temporadas.length).toBe(0);
    expect(v.trabalho.atual?.ocupacaoId).toBe('tecnico_futebol');
    expect(v.trabalho.atual?.empregador).toBe(oClube(prop.clube));
    expect(v.caminhos.tecnico!.passagens.length).toBeGreaterThanOrEqual(2);
  });

  it('a final decidida no momento entra na temporada: dois jogos a mais e o título (ou o vice)', () => {
    const v = transacao(tecnico(), x => {
      const p = passagemAtual(x)!;
      const t = p.temporadas[0];
      const antes = t.jogos;
      p.decisao = { competicao: 'campeonato estadual', adversario: 'Náutico', forca: 0, ano: t.ano, t: x.t };
      t.estadual = 'vice';
      expect(decidirFinal(x, criarRng(1), 'otimo')).toBe(true);
      expect(t.jogos).toBe(antes + 2);
      expect(t.v + t.e + t.d).toBe(t.jogos);
      expect(t.estadual).toBe('campeão');
      expect(t.titulos?.some(y => /estadual/.test(y))).toBe(true);
      expect(p.decisao).toBeUndefined();
    }).vida;
    expect(v.biografia.some(e => /estadual com/.test(e.texto))).toBe(true);
  });
});

describe('jogador e técnico: duas trajetórias, a mesma biografia', () => {
  it('o histórico de jogador continua; o legado lista as duas, cada uma com o próprio resumo; reload preserva', () => {
    let v = anos(tecnico({ exAtleta: true }), 6, 9);
    const jogador = carreirasEsportivas(v).find(c => c.modalidade === 'futebol')!;
    expect(jogador.temporadas!.length).toBe(6);
    expect(jogador.fase).toBe('encerrada');
    v = recarregar(v);
    const ts = trajetoriasDaVida(v);
    const esp = ts.find(t => t.area === 'esporte');
    const tec = ts.find(t => t.area === 'tecnico');
    expect(esp?.titulo).toBe('Futebol profissional');
    expect(esp?.resumo).toMatch(/temporadas/);
    expect(tec?.titulo).toBe('Técnico de futebol');
    expect(tec?.resumo).toMatch(/jogos · \d+ vitórias/);
    expect(tec?.detalhe[0].titulo).toBe('Passagens');
    expect(tec?.detalhe[0].linhas.length).toBe(v.caminhos.tecnico!.passagens.length);
    // O passado de jogador dá o primeiro empurrão no nome — não ganha jogo: a reputação não entra na força.
    expect(v.caminhos.tecnico!.origem).toBe('ex_atleta');
  });

  it('save v19: a carreira de técnico (passagens, proposta) volta igual; forma inválida é recusada', () => {
    let v = anos(tecnico(), 4, 4);
    v = transacao(v, (x, r) => { criarPropostaDeTecnico(x, r, x.caminhos.tecnico!, 3, 'mercado', passagemAtual(x)?.clube); }).vida;
    const w = recarregar(v);
    expect(w.caminhos.tecnico).toEqual(v.caminhos.tecnico);
    const ruim = JSON.parse(exportarVida(v));
    ruim.vida.caminhos.tecnico.passagens[0].temporadas[0].jogos = 'muitos';
    expect(importarVida(JSON.stringify(ruim)).tipo).not.toBe('ok');
  });
});

describe('momentos do banco (não são os do jogador): mudam o que a temporada joga', () => {
  it('o desenho do time muda o jeito de jogar; entregar o cargo fecha a passagem e o emprego; a final do momento vira título ou vice', () => {
    let v = tecnico();
    expect(trajetoriaDeSituacao(v)).toBe('tecnico');
    v = transacao(v, x => { x.caminhos.situacao = { id: 'tec_tatica', t: x.t, dados: {} }; resolverSituacao(x, criarRng(2), 'ofensivo'); }).vida;
    expect(v.caminhos.tecnico!.estilo).toBe('ofensivo');
    // A final pendente: o momento a decide (dois jogos a mais na temporada).
    v = transacao(v, x => {
      const p = passagemAtual(x)!; const t = p.temporadas[p.temporadas.length - 1];
      p.decisao = { competicao: 'campeonato estadual', adversario: 'Náutico', forca: 1, ano: t.ano, t: x.t };
      x.caminhos.situacao = { id: 'tec_final', t: x.t, dados: { final: 1, adversario: 'Náutico', forca: 1 } };
      expect(situacaoAberta(x)?.m.id).toBe('tec_final');
      const antes = t.jogos;
      const res = resolverSituacao(x, criarRng(4), 'estudar')!;
      expect(t.jogos).toBe(antes + 2);
      expect(t.estadual).toBe(res.desfecho === 'otimo' || res.desfecho === 'bom' ? 'campeão' : 'vice');
      expect(p.decisao).toBeUndefined();
    }).vida;
    v = transacao(v, x => { passagemAtual(x)!.pressao = 90; x.caminhos.situacao = { id: 'tec_risco', t: x.t, dados: {} }; resolverSituacao(x, criarRng(3), 'entregar'); }).vida;
    const ultima = v.caminhos.tecnico!.passagens.slice(-1)[0];
    expect(ultima.saida).toBe('saiu');
    expect(passagemAtual(v)).toBeUndefined();
    expect(v.trabalho.atual?.ocupacaoId).not.toBe('tecnico_futebol');
  });
});

describe('C3 · a seleção como passagem do técnico', () => {
  it('o convite é uma proposta como as outras; o ano tem amistosos e o torneio do calendário; J = V + E + D', () => {
    let v = tecnico();
    v = transacao(v, (x, r) => { x.caminhos.tecnico!.reputacao = 90; criarPropostaDeTecnico(x, r, x.caminhos.tecnico!, 4, 'selecao'); aceitarPropostaDeTecnico(x, r, x.caminhos.tecnico!.proposta!.id); }).vida;
    const sel = passagemAtual(v)!;
    expect(sel.selecao).toBe(true);
    expect(v.trabalho.atual?.empregador).toBe('a seleção brasileira');
    expect(v.caminhos.tecnico!.passagens.slice(-2)[0].saida).toBe('selecao');
    for (let k = 0; k < 4 && passagemAtual(v)?.selecao; k++) v = transacao(v, x => { x.t += 12; processarTecnico(x, criarRng(300 + k)); }).vida;
    const p = v.caminhos.tecnico!.passagens.find(x => x.selecao)!;
    expect(p.temporadas.length).toBeGreaterThan(0);
    for (const t of p.temporadas) { expect(t.jogos).toBe(t.v + t.e + t.d); expect(t.jogos).toBeGreaterThanOrEqual(10); }
    // O calendário de seleções do jogo: em quatro anos, ao menos um torneio (mundial ou continental).
    expect(p.temporadas.some(t => !!t.torneio)).toBe(true);
    expect(trajetoriasDaVida(v).find(t => t.area === 'tecnico')!.realizacoes.some(x => /seleção brasileira/.test(x))).toBe(true);
  });
});

/**
 * Contratação no meio da temporada: o clube em crise (a liga jogada SEM você
 * até ali, bem abaixo do que o elenco prometia) demite o técnico e chama quem
 * está sem clube. A proposta mostra a tabela do dia; aceitar executa ESTA
 * proposta; a temporada parcial continua DAQUELA tabela, e os números são só
 * os dos jogos dirigidos (J = V + E + D; o estadual já passou — não há título
 * estadual nesse ano).
 */
describe('contratação no meio da temporada', () => {
  /** Um técnico demitido, sem clube, com a proposta de um clube em crise na mesa. */
  function emCrise(semente = 1): Vida {
    return transacao(tecnico(), x => {
      demitirDoComando(x);
      const c = x.caminhos.tecnico!;
      for (let s = semente; s < semente + 400 && !c.proposta; s++) propostaDeCrise(x, criarRng(s), c);
      x.momento = null;
    }).vida;
  }

  it('a crise sai da tabela: a liga jogada sem você até o meio, abaixo do que o elenco prometia', () => {
    let crises = 0;
    for (let s = 1; s <= 300; s++) {
      const t = ligaAteACrise(criarRng(s), 'Náutico', 3);
      if (!t) continue;
      crises++;
      expect(t.rodada).toBeGreaterThan(0);
      expect(t.rodada).toBeLessThan(t.rodadas);
      // Cada jogo distribui 2 (empate) ou 3 pontos: dez jogos por rodada.
      const soma = t.pontos.reduce((a, b) => a + b, 0);
      expect(soma).toBeGreaterThanOrEqual(20 * t.rodada);
      expect(soma).toBeLessThanOrEqual(30 * t.rodada);
      // A posição é a da tabela: quem tem mais pontos fica na frente.
      expect(t.posicao).toBeGreaterThanOrEqual(1 + t.pontos.filter((x, i) => i !== 0 && x > t.pontos[0]).length);
      expect(t.posicao).toBeLessThanOrEqual(1 + t.pontos.filter((x, i) => i !== 0 && x >= t.pontos[0]).length);
      expect(t.posicao >= 17 || t.posicao >= Math.max(t.esperada + 5, 13)).toBe(true);
    }
    // A crise é um acontecimento, não a regra.
    expect(crises).toBeGreaterThan(5);
    expect(crises).toBeLessThan(250);
  });

  it('a proposta mostrada (a tabela do dia) é a executada; a temporada parcial conta só os jogos dirigidos; save/reload no meio', () => {
    let v = emCrise(3);
    const prop = v.caminhos.tecnico!.proposta!;
    const m = prop.meioDeTemporada!;
    expect(prop.origem).toBe('crise');
    expect(m).toBeDefined();
    v = transacao(v, x => { const d = conteudoPorId('tec_proposta'); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, criarRng(5))); }).vida;
    expect(v.momento?.titulo).toBe('Um clube em crise');
    expect(v.momento?.texto).toContain(prop.clube);
    expect(v.momento?.texto).toContain(`${m.posicao}º lugar`);
    expect(v.momento?.texto).toContain(`${m.rodada} rodadas`);
    expect(v.momento?.texto).toContain(`${m.rodadas - m.rodada} rodadas que faltam`);
    v = executar(v, { tipo: 'decidir', opcaoId: 'aceitar' }).vida;
    const p = passagemAtual(v)!;
    expect(p.clube).toBe(prop.clube);
    expect(p.salario).toBe(prop.salario);
    expect(p.nivel).toBe(prop.nivel);
    expect(p.meioDeTemporada).toEqual({ rodada: m.rodada, rodadas: m.rodadas, posicao: m.posicao });
    expect(p.retomada).toEqual(m);
    expect(p.temporadas.length).toBe(0);
    expect(v.biografia.some(e => e.texto.startsWith('No meio da temporada:') && e.texto.includes(`${m.posicao}º lugar`))).toBe(true);
    // Save/reload com a temporada pela metade: a tabela do dia volta igual, e a temporada jogada depois é a mesma.
    const w = recarregar(v);
    expect(w.caminhos.tecnico).toEqual(v.caminhos.tecnico);
    const jogar = (x0: Vida) => transacao(x0, x => { x.t += 12; processarTecnico(x, criarRng(31)); if (passagemAtual(x)?.decisao) decidirFinal(x, criarRng(32), 'neutro'); }).vida;
    const a = jogar(v), b = jogar(w);
    const pa = a.caminhos.tecnico!.passagens.find(q => !!q.meioDeTemporada)!;
    expect(b.caminhos.tecnico!.passagens.find(q => !!q.meioDeTemporada)!.temporadas).toEqual(pa.temporadas);
    const t = pa.temporadas[0];
    expect(t.desdeRodada).toBe(m.rodada);
    expect(t.estadual).toBeUndefined();
    expect(t.jogos).toBe(t.v + t.e + t.d);
    if (!t.parcial) expect(t.jogos).toBe(m.rodadas - m.rodada); else expect(t.jogos).toBeLessThan(m.rodadas - m.rodada);
    expect((t.titulos ?? []).some(x => /estadual/.test(x))).toBe(false);
    // A tabela do dia só serve à primeira temporada.
    expect(pa.retomada).toBeUndefined();
    expect(resumoDaPassagem(pa).jogos).toBe(t.jogos);
  });

  it('muitas crises: J = V + E + D, só os jogos que faltavam, nada de estadual no ano da chegada; o ano seguinte é inteiro', () => {
    let chegadas = 0;
    for (let s = 1; s <= 16; s++) {
      let v = emCrise(s * 50);
      const prop = v.caminhos.tecnico!.proposta;
      if (!prop) continue;
      chegadas++;
      v = transacao(v, x => {
        aceitarPropostaDeTecnico(x, criarRng(s), prop.id);
        for (let k = 0; k < 2 && passagemAtual(x); k++) { x.t += 12; processarTecnico(x, criarRng(s * 10 + k)); if (passagemAtual(x)?.decisao) decidirFinal(x, criarRng(s), 'neutro'); }
      }).vida;
      const p = v.caminhos.tecnico!.passagens.find(q => q.clube === prop.clube && q.meioDeTemporada)!;
      const [t1, t2] = p.temporadas;
      expect(t1.jogos).toBe(t1.v + t1.e + t1.d);
      expect(t1.jogos).toBeLessThanOrEqual(prop.meioDeTemporada!.rodadas - prop.meioDeTemporada!.rodada);
      if (!t1.parcial) expect(t1.jogos).toBe(prop.meioDeTemporada!.rodadas - prop.meioDeTemporada!.rodada);
      expect(t1.estadual).toBeUndefined();
      if (t2) { expect(t2.desdeRodada).toBeUndefined(); expect(t2.estadual).toBeDefined(); expect(t2.jogos).toBe(t2.v + t2.e + t2.d); }
      const r = resumoDoTecnico(v.caminhos.tecnico!);
      expect(r.jogos).toBe(r.v + r.e + r.d);
    }
    expect(chegadas).toBeGreaterThan(8);
  });

  it('save: a tabela do dia com forma inválida é recusada', () => {
    const v = transacao(emCrise(3), (x, r) => { aceitarPropostaDeTecnico(x, r, x.caminhos.tecnico!.proposta!.id); }).vida;
    const ruim = JSON.parse(exportarVida(v));
    const ps = ruim.vida.caminhos.tecnico.passagens;
    ps[ps.length - 1].retomada.pontos = [1, 2, 3];
    expect(importarVida(JSON.stringify(ruim)).tipo).not.toBe('ok');
  });
});
