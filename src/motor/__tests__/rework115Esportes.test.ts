/**
 * REWORK 11.5 · Fase D — esportes.
 *
 *   ESP-01  a forma dos clubes: nasce dos resultados (nunca do nome), dura alguns anos, recomeça ao mudar de divisão
 *   ESP-02  copas de quadra: basquete e vôlei com o formato deles (os oito da elite; o continental dos de cima)
 *   ESP-03  os rivais do técnico são os clubes da divisão; o campeão do ano é o da mesma tabela do país
 *   ESP-04  o treinador de goleiros: a porta para o ex-goleiro, o degrau, a comissão que muda
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { CarreiraEsportiva, Vida } from '../tipos';
import { ligaDe, ultimaTemporadaDoPais } from '../sistemas/ligas';
import { clubesDoPais } from '../dados/clubes';
import { fecharTemporada } from '../sistemas/esporte';
import { registrarTemporada } from '../sistemas/palmares';
import { nomeDaCompeticao } from '../sistemas/competicoes';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { aceitarPropostaDeTecnico, passagemAtual, processarTecnico } from '../sistemas/tecnico';
import { garantirFrente } from '../sistemas/frentes';
import { leituraDoTreinadorDeGoleiros, processarTreinadorDeGoleiros } from '../sistemas/treinadorDeGoleiros';
import { interpretar } from '../save';

const atletaDeQuadra = (mod: 'basquete' | 'volei', id: string): Vida => transacao(adulto(26, { semente: 21, genero: 'masculino', municipioId: 'sao-paulo-sp' }), x => {
  x.id = id;
  x.caminhos.frentes[mod] = { habilidade: 92, interesse: 70, meses: 200, auge: 92, tInicio: x.t - 200 } as never;
  x.corpo.forma = 80;
  const e: CarreiraEsportiva = { modalidade: mod, fase: 'profissional', clube: `equipe de ${mod} de São Paulo`, nivel: 4, tInicio: x.t - 72, tFase: x.t - 60, lesoes: 0, municipioId: 'sao-paulo-sp', reputacao: 60, espaco: 'titular', contratoAte: x.t + 36, temporadas: [] } as CarreiraEsportiva;
  x.caminhos.esporte = e;
  x.trabalho.atual = { ocupacaoId: mod === 'basquete' ? 'jogador_basquete' : 'atleta', empregador: 'a equipe', contrato: 'clt', salario: 20000, tInicio: x.t - 60, desempenho: 70, municipioId: 'sao-paulo-sp', carga: 'integral' };
}).vida;

describe('REWORK 11.5 · esportes', () => {
  it('a forma: sai da colocação (o mesmo para qualquer clube), fica entre −0,8 e 0,8 e muda o ano seguinte', () => {
    let v = adulto(20, { semente: 5 });
    ligaDe(v, 'BR');
    for (let k = 0; k < 6; k++) v = transacao(v, x => { x.t += 12; ligaDe(x, 'BR'); }).vida;
    const liga = v.caminhos.ligas!.BR;
    const forma = Object.values(liga.forma ?? {});
    expect(forma.length).toBeGreaterThan(10);
    for (const f of forma) { expect(f).toBeGreaterThanOrEqual(-0.8); expect(f).toBeLessThanOrEqual(0.8); }
    // O campeão da elite do ano termina com forma positiva; quem caiu, não fica com a forma de antes (recomeça perto de 0).
    const u = liga.ultima!;
    if (u.campeoes[4] && !u.subiram.includes(u.campeoes[4])) expect(liga.forma![u.campeoes[4]] ?? 0).toBeGreaterThan(0);
    for (const c of u.cairam) expect(Math.abs(liga.forma?.[c] ?? 0)).toBeLessThanOrEqual(0.3);
    // Persiste no save.
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && lido.vida.caminhos.ligas!.BR.forma).toEqual(liga.forma);
  });

  it('nenhum clube domina pelo nome: em 40 temporadas do Brasil, o que mais ganhou fica longe da metade dos títulos', () => {
    let v = adulto(20, { semente: 8 });
    ligaDe(v, 'BR');
    const titulos = new Map<string, number>();
    for (let k = 0; k < 40; k++) {
      v = transacao(v, x => { x.t += 12; ligaDe(x, 'BR'); }).vida;
      const c = v.caminhos.ligas!.BR.ultima!.campeoes[4];
      if (c) titulos.set(c, (titulos.get(c) ?? 0) + 1);
    }
    expect(Math.max(...titulos.values())).toBeLessThanOrEqual(12);
    expect(titulos.size).toBeGreaterThanOrEqual(8);
  });

  it('basquete e vôlei disputam copas com o formato delas: só quem esteve entre os oito da elite; o nome do país', () => {
    for (const mod of ['basquete', 'volei'] as const) {
      let comCopa = 0, campeao = 0, semCopaFora = 0;
      for (let k = 0; k < 40; k++) {
        const v = atletaDeQuadra(mod, `quadra:${mod}:${k}`);
        const e = v.caminhos.esporte!;
        // A temporada anterior na elite: entre os oito (metade das vidas) ou fora.
        e.temporadas = [{ ano: Math.floor((v.t - 6) / 12) - 1, clube: e.clube, nivel: 4, partidas: 30, titular: 28, gols: 0, assistencias: 0, nota: 7, colocacao: k % 2 ? 3 : 14, mesesFora: 0 }];
        const t = transacao(v, x => fecharTemporada(x, criarRng(k), x.caminhos.esporte!)).valor;
        const copa = t.copas?.find(c => c.id === `copa:BR:${mod}`);
        if (k % 2) {
          expect(copa).toBeDefined();
          comCopa++;
          if (copa!.fase === 'campeão') campeao++;
          expect(['quartas', 'semifinal', 'vice', 'campeão']).toContain(copa!.fase);
        } else if (!copa) semCopaFora++;
      }
      expect(comCopa).toBe(20);
      expect(semCopaFora).toBe(20);
      expect(campeao).toBeGreaterThan(0);
      expect(campeao).toBeLessThan(20);
    }
    expect(nomeDaCompeticao('copa:BR:volei')).toBe('Copa Brasil de Vôlei');
    expect(nomeDaCompeticao('copa:ES:basquete')).toBe('copa nacional de basquete');
    expect(nomeDaCompeticao('cont:CONMEBOL:volei')).toMatch(/continental de clubes de vôlei/);
  });

  it('o título da copa de quadra entra no palmarés com o id da competição e do troféu', () => {
    let achou = false;
    for (let k = 0; k < 60 && !achou; k++) {
      let v = atletaDeQuadra('volei', `palmares:${k}`);
      v = transacao(v, x => { const e = x.caminhos.esporte!; e.temporadas = [{ ano: Math.floor((x.t - 6) / 12) - 1, clube: e.clube, nivel: 4, partidas: 30, titular: 28, gols: 0, assistencias: 0, nota: 8, colocacao: 1, mesesFora: 0 }]; const r = criarRng(k); const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); }).vida;
      const c = (v.caminhos.palmares ?? []).find(p => p.competicaoId === 'copa:BR:volei' && p.tipo === 'titulo');
      if (c) { achou = true; expect(c.trofeuId).toBeDefined(); expect(c.competicao).toBe('Copa Brasil de Vôlei'); }
    }
    expect(achou).toBe(true);
  });

  it('o técnico enfrenta os clubes que estão na divisão, e o campeão do ano é o da tabela do país', () => {
    const v = transacao(adulto(40, { semente: 77, genero: 'masculino', municipioId: 'recife-pe' }), (x, r) => {
      x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
      garantirFrente(x, 'futebol');
      x.trabalho.experiencia['treino'] = 48;
      contratar(x, r, ocupacao('tecnico_futebol'), 'oportunidade');
      processarTecnico(x, r);
      const pr = x.caminhos.tecnico?.proposta;
      if (!passagemAtual(x) && pr) { aceitarPropostaDeTecnico(x, r, pr.id); }
      // O teste quer a liga (o estadual é a temporada do nível 1): o clube fica numa divisão nacional.
      const p = passagemAtual(x)!;
      if (p.nivel < 2) p.nivel = 2;
      for (let k = 0; k < 3 && passagemAtual(x); k++) { x.t += 12; processarTecnico(x, criarRng(k)); }
    }).vida;
    const temps = (v.caminhos.tecnico?.passagens ?? []).flatMap(p => p.temporadas).filter(t => t.nivel >= 2 && !t.desdeRodada);
    expect(temps.length).toBeGreaterThan(0);
    const nomes = new Set(clubesDoPais('BR').map(c => c.nome));
    for (const t of temps) for (const r of t.rivais ?? []) expect(nomes.has(r)).toBe(true);
    expect(temps.some(t => (t.rivais?.length ?? 0) > 0)).toBe(true);
    const ult = temps[temps.length - 1];
    const u = ultimaTemporadaDoPais(v, 'BR');
    if (ult.campeao && u?.ano === ult.ano) expect(Object.values(u.campeoes)).toContain(ult.campeao);
  });

  it('treinador de goleiros: o ex-goleiro recebe a porta; a trajetória tem degrau, nome e a comissão que muda', () => {
    let v = transacao(adulto(34, { semente: 12, genero: 'masculino', municipioId: 'belo-horizonte-mg' }), (x, r) => {
      x.trabalho.atual = undefined;
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'encerrada', clube: 'Cruzeiro', nivel: 4, tInicio: x.t - 200, tFase: x.t - 180, lesoes: 0, municipioId: 'belo-horizonte-mg', reputacao: 60, posicao: 'goleiro', temporadas: [] } as CarreiraEsportiva;
      contratar(x, r, ocupacao('treinador_goleiros'), 'oportunidade');
      processarTreinadorDeGoleiros(x);
    }).vida;
    expect(v.caminhos.treinadorDeGoleiros?.degrau).toBe(1);
    expect(v.caminhos.treinadorDeGoleiros!.reputacao).toBeGreaterThanOrEqual(35);
    let subiu = false, perdeu = false;
    for (let k = 0; k < 25 && v.trabalho.atual?.ocupacaoId === 'treinador_goleiros'; k++) {
      v = transacao(v, x => { x.t += 12; ligaDe(x, 'BR'); processarTreinadorDeGoleiros(x); }).vida;
      if ((v.caminhos.treinadorDeGoleiros?.degrau ?? 1) >= 2) subiu = true;
    }
    if (v.trabalho.atual?.ocupacaoId !== 'treinador_goleiros') perdeu = true;
    expect(subiu || perdeu).toBe(true);
    const l = leituraDoTreinadorDeGoleiros(v)!;
    expect(l.historico.length).toBeGreaterThan(0);
    expect(l.clube).toBeTruthy();
  });
});
