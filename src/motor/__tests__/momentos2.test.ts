/**
 * Career Moments 2.0 (`sistemas/situacoes`): QUANDO um momento acontece e o
 * que ele MUDA.
 *
 *   - elegibilidade: a trajetória certa (o banco é "técnico", não "emprego";
 *     a política antes do mandato também tem cenas);
 *   - recarga e tema: o mesmo modelo não volta antes de N anos; o irmão de
 *     tema, não antes de dois;
 *   - silêncio: a chance cresce com os anos sem momento; logo depois de um,
 *     cai; a primeira cena de uma carreira nova não espera;
 *   - o momento tirado da frente por outra decisão volta, uma vez;
 *   - nada se repete mecanicamente numa carreira longa;
 *   - consequência: as respostas à greve mudam coisas DIFERENTES no motor
 *     (aprovação, base, desgaste, o que saiu do papel), não só a frase;
 *   - memória: o tema que volta lembra da outra vez (a cena e a distribuição).
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Vida } from '../tipos';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { garantirFrente } from '../sistemas/frentes';
import { entrarNaBase, profissionalizar } from '../sistemas/esporte';
import { entrarNaPolitica } from '../sistemas/politica';
import { processarTecnico } from '../sistemas/tecnico';
import { abrirDecisao, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { executar } from '../acoes';
import {
  candidatosDoAno, chanceDeMomento, distribuicao, intencoesDe, modeloDaSituacao, processarSituacoes, resolverSituacao,
  silencioDe, situacaoAberta, textoDaSituacao, trajetoriaDeSituacao
} from '../sistemas/situacoes';

let base: Vida | undefined;
const trinta = (): Vida => structuredClone((base ??= adulto(30, { semente: 41, genero: 'masculino', municipioId: 'recife-pe' })));

function jogador(): Vida {
  return transacao(trinta(), (x, r) => {
    garantirFrente(x, 'futebol');
    Object.assign(x.caminhos.frentes.futebol!, { habilidade: 86, interesse: 90, meses: 160, auge: 86 });
    x.trabalho.atual = undefined; x.caminhos.esporte = undefined; x.caminhos.oportunidades = []; x.educacao.matricula = undefined;
    entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Sport');
    profissionalizar(x, r, 3);
    x.caminhos.esporte!.espaco = 'titular';
    x.caminhos.esporte!.posicao = 'atacante';
    x.momento = null;
  }).vida;
}

/** Um mandato de prefeito em curso, com a greve na mesa. */
function prefeitoNaGreve(semente = 3): Vida {
  const v = transacao(trinta(), x => {
    entrarNaPolitica(x, 'comunidade', 1);
    const p = x.caminhos.politica!;
    p.fase = 'mandato'; p.partido = p.partido ?? 'PRT'; p.apoio = 45; p.desgaste = 20; p.reputacao = 45;
    p.mandato = { cargo: 'prefeito', tInicio: x.t - 12, tFim: x.t + 36, aprovacao: 50, feito: 0, crise: { t: x.t, tipo: 'greve' } };
    x.trabalho.atual = { ocupacaoId: 'prefeito', empregador: 'a prefeitura', contrato: 'eletivo', salario: 15000, tInicio: x.t - 12, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral' };
    x.momento = null;
  }).vida;
  // A semente vale depois da transação (dentro dela, o estado do gerador é regravado no fim): cada semente, um sorteio.
  v.rng = semente;
  return v;
}
const abrir = (v: Vida, id: string): Vida => transacao(v, (x, r) => { const d = conteudoPorId(id); if (d?.tipo === 'decisao') abrirDecisao(x, d, contexto(x, r)); }).vida;

describe('elegibilidade: cada carreira com a sua trajetória de momentos', () => {
  it('o técnico no comando vive momentos de técnico (não de "emprego"); a política antes do mandato tem cenas', () => {
    const t = transacao(trinta(), (x, r) => { x.trabalho.atual = undefined; x.trabalho.experiencia['treino'] = 48; contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade'); processarTecnico(x, r); }).vida;
    expect(trajetoriaDeSituacao(t)).toBe('tecnico');
    expect(candidatosDoAno(t, 'tecnico').every(c => c.m.trajetoria === 'tecnico')).toBe(true);
    const p = transacao(trinta(), (x, r) => { contratar(x, r, ocupacao('analista_adm'), 'curriculo'); entrarNaPolitica(x, 'comunidade', 1); x.caminhos.politica!.partido = 'PRT'; }).vida;
    expect(trajetoriaDeSituacao(p)).toBe('politica');
    expect(candidatosDoAno(p, 'politica').map(c => c.m.id)).toContain('pol_bairro');
    expect(candidatosDoAno(p, 'politica').map(c => c.m.id)).not.toContain('pol_audiencia');
  });
});

describe('recarga, tema e silêncio', () => {
  it('o mesmo modelo não volta antes da recarga; o irmão de tema, não antes de dois anos', () => {
    let v = jogador();
    expect(candidatosDoAno(v, 'futebol').map(c => c.m.id)).toContain('fut_lance_ataque');
    v = transacao(v, x => { x.caminhos.situacoes = [{ id: 'fut_lance_ataque', t: x.t, trajetoria: 'futebol', intencao: 'Chutar de primeira', desfecho: 'bom', texto: '—' }]; }).vida;
    const ids = (w: Vida) => candidatosDoAno(w, 'futebol').map(c => c.m.id);
    expect(ids(v)).not.toContain('fut_lance_ataque');
    // O pênalti é do mesmo tema (o lance): também espera.
    expect(ids(v)).not.toContain('fut_penalti');
    const daqui = (anos: number) => transacao(v, x => { x.t += anos * 12; }).vida;
    expect(ids(daqui(2))).toContain('fut_penalti');
    expect(ids(daqui(2))).not.toContain('fut_lance_ataque');
    expect(ids(daqui(3))).toContain('fut_lance_ataque');
  });

  it('a chance cresce com o silêncio, cai logo depois de um momento, e a primeira cena não espera', () => {
    const v = jogador();
    const nunca = chanceDeMomento(v, 'futebol');
    expect(nunca).toBeGreaterThan(0.3);
    const com = (anos: number) => transacao(v, x => { x.caminhos.situacoes = [{ id: 'fut_jornalista', t: x.t - anos * 12, trajetoria: 'futebol', intencao: '—', desfecho: 'bom', texto: '—' }]; x.caminhos.esporte!.tFase = x.t - 240; }).vida;
    const c1 = chanceDeMomento(com(1), 'futebol'), c2 = chanceDeMomento(com(2), 'futebol'), c4 = chanceDeMomento(com(4), 'futebol');
    expect(silencioDe(com(4), 'futebol')).toBe(4);
    expect(c1).toBeLessThan(c2);
    expect(c2).toBeLessThan(c4);
    expect(c1).toBeLessThan(nunca);
    expect(c4).toBeGreaterThan(0.85);
  });

  it('o momento que outra decisão tirou da frente volta no ano seguinte — uma vez', () => {
    let v = jogador();
    v = transacao(v, x => { x.caminhos.situacao = { id: 'fut_jornalista', t: x.t - 12, dados: {} }; x.caminhos.esporte!.nivel = 3; }).vida;
    v = transacao(v, x => processarSituacoes(x, criarRng(1))).vida;
    expect(v.caminhos.situacao?.id).toBe('fut_jornalista');
    expect(v.caminhos.situacao?.dados._adiada).toBe(1);
    // Adiada uma vez: no outro ano, não volta de novo (o sorteio é novo).
    v = transacao(v, x => { x.t += 12; x.caminhos.situacoes = [{ id: 'fut_torcida', t: x.t, trajetoria: 'futebol', intencao: '—', desfecho: 'bom', texto: '—' }]; processarSituacoes(x, criarRng(2)); }).vida;
    expect(v.caminhos.situacao?.dados._adiada).toBeUndefined();
  });

  it('carreira de 20 anos: nenhum modelo volta dentro da recarga, e há anos de silêncio', () => {
    let v = jogador();
    let silenciosos = 0;
    for (let k = 0; k < 20; k++) {
      v = transacao(v, x => {
        x.t += 12;
        const r = criarRng(900 + k);
        processarSituacoes(x, r);
        const a = situacaoAberta(x);
        if (a) resolverSituacao(x, r, intencoesDe(a.m, x, a.d)[0].id); else silenciosos++;
      }).vida;
    }
    const xs = v.caminhos.situacoes ?? [];
    expect(xs.length).toBeGreaterThanOrEqual(5);
    expect(silenciosos).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
      if (xs[i].id !== xs[j].id) continue;
      expect(xs[j].t - xs[i].t).toBeGreaterThanOrEqual((modeloDaSituacao(xs[i].id)?.recarga ?? 5) * 12);
    }
  });
});

describe('consequência real: a greve', () => {
  it('assumir a frente, a equipe técnica e culpar a gestão anterior mudam coisas diferentes no motor', () => {
    const efeito = (opcao: string, semente: number) => {
      let v = abrir(prefeitoNaGreve(semente), 'pol_crise');
      expect(v.momento?.titulo).toBe('A greve');
      const p0 = structuredClone(v.caminhos.politica!);
      v = executar(v, { tipo: 'decidir', opcaoId: opcao }).vida;
      const p = v.caminhos.politica!;
      return { aprovacao: p.mandato!.aprovacao - p0.mandato!.aprovacao, apoio: p.apoio - p0.apoio, desgaste: p.desgaste - p0.desgaste, feito: p.mandato!.feito - p0.mandato!.feito, marco: p.mandato!.marcos?.slice(-1)[0] ?? '', momento: v.caminhos.situacoes?.slice(-1)[0] };
    };
    const frente = efeito('frente', 3), tecnica = efeito('tecnica', 3), culpar = efeito('culpar', 3);
    // Não é só a frase final: a base, o desgaste e a aprovação andam diferente por resposta.
    expect(new Set([frente, tecnica, culpar].map(x => `${x.aprovacao}|${x.apoio}|${x.desgaste}`)).size).toBe(3);
    expect(tecnica.apoio).toBeLessThan(0);
    expect(culpar.desgaste).toBeGreaterThanOrEqual(4);
    // O marco do mandato guarda a resposta; a crise entra nos momentos da carreira (a memória que o silêncio lê).
    expect(frente.marco).toMatch(/a greve dos professores \(assumiu a frente\)/);
    expect(culpar.marco).toMatch(/culpou a gestão anterior/);
    expect(frente.momento?.id).toBe('pol_crise_greve');
    expect(frente.momento?.trajetoria).toBe('politica');
    // O desfecho sai do estado: com base larga e liderança, assumir a frente dá certo mais vezes.
    const sucesso = (forte: boolean) => {
      let ok = 0;
      for (let s = 1; s <= 30; s++) {
        let v = transacao(prefeitoNaGreve(s), x => { const p = x.caminhos.politica!; p.apoio = forte ? 85 : 15; p.desgaste = forte ? 5 : 70; garantirFrente(x, 'lideranca'); x.caminhos.frentes.lideranca!.habilidade = forte ? 80 : 10; }).vida;
        v = abrir(v, 'pol_crise');
        v = executar(v, { tipo: 'decidir', opcaoId: 'frente' }).vida;
        if (/saiu maior/.test(v.caminhos.politica!.mandato!.marcos?.slice(-1)[0] ?? '')) ok++;
      }
      return ok;
    };
    expect(sucesso(true)).toBeGreaterThan(sucesso(false));
  });

  it('quando a greve volta, a cena lembra do que se fez da outra vez', () => {
    let v = abrir(prefeitoNaGreve(5), 'pol_crise');
    v = executar(v, { tipo: 'decidir', opcaoId: 'culpar' }).vida;
    v = transacao(v, x => { x.t += 24; x.caminhos.politica!.mandato!.crise = { t: x.t, tipo: 'greve' }; x.momento = null; }).vida;
    v = abrir(v, 'pol_crise');
    expect(v.momento?.texto).toMatch(/De novo\. Em \d{4}, você culpou a gestão anterior/);
  });
});

describe('memória dos modelos: o tema que volta', () => {
  it('o contexto leva a outra vez; a cena e a distribuição a leem', () => {
    let v = jogador();
    v = transacao(v, x => {
      x.caminhos.esporte!.nivel = 3;
      x.caminhos.situacoes = [{ id: 'fut_penalti', t: x.t - 60, trajetoria: 'futebol', intencao: 'Bater forte, no alto', desfecho: 'pessimo', texto: '—' }];
      // Só o pênalti cabe (o teste quer o tema de volta).
      for (let s = 1; s <= 200 && x.caminhos.situacao?.id !== 'fut_penalti'; s++) processarSituacoes(x, criarRng(s));
    }).vida;
    const a = situacaoAberta(v)!;
    expect(a.m.id).toBe('fut_penalti');
    expect(a.d._antesDesfecho).toBe('pessimo');
    expect(textoDaSituacao(v, a.m, a.d)).toMatch(/^Outro pênalti\. O de \d{4} não entrou/);
    const it0 = intencoesDe(a.m, v, a.d)[0];
    const fatores = distribuicao(v, it0, a.d).fatores.map(f => f.id);
    expect(fatores).toContain('da outra vez');
    const sem = distribuicao(v, it0, { ...a.d, _antes: undefined as never, _antesDesfecho: undefined as never });
    expect(distribuicao(v, it0, a.d).sucesso).toBeLessThan(sem.sucesso);
  });
});

describe('auditoria: o texto que promete, o motor cumpre', () => {
  it('"Então fica no banco": o desfecho tira do time de verdade', () => {
    const v = transacao(jogador(), x => {
      x.caminhos.situacao = { id: 'fut_posicao', t: x.t, dados: { nova: 'ponta' } };
      x.personalidade.tracos.sociabilidade = -100;
      for (let s = 1; s < 500; s++) {
        const y = structuredClone(x);
        if (resolverSituacao(y, criarRng(s), 'recusar')?.desfecho === 'pessimo') { resolverSituacao(x, criarRng(s), 'recusar'); break; }
      }
    }).vida;
    expect(v.caminhos.situacoes!.slice(-1)[0].desfecho).toBe('pessimo');
    expect(v.caminhos.esporte!.espaco).toBe('reserva');
  });

  it('o projeto que virou referência é um feito no emprego (pesa no desempenho e na promoção)', () => {
    const v = transacao(trinta(), (x, r) => {
      const e = contratar(x, r, ocupacao('analista_adm'), 'curriculo');
      e.desempenho = 80;
      x.caminhos.situacao = { id: 'emp_projeto', t: x.t, dados: {} };
      for (let s = 1; s < 300; s++) {
        const y = structuredClone(x);
        const res = resolverSituacao(y, criarRng(s), 'pegar');
        if (res?.desfecho === 'otimo') { resolverSituacao(x, criarRng(s), 'pegar'); break; }
      }
    }).vida;
    expect(v.trabalho.atual!.feitos).toBe(1);
  });
});
