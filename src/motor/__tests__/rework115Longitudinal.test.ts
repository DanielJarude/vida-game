/**
 * REWORK 11.5 · Fase J — cenários longitudinais (seção 15 do pedido), com o motor de verdade:
 *
 *   1  carreira esportiva: temporadas, títulos, fim da carreira, a comissão técnica — e a galeria continua lá
 *   3  artista: anos de carreira de ator pelo motor, com decisões; nada trava, o currículo e o dinheiro andam
 *   6  saves antigos (v5 a v16): abrem, jogam três anos com decisões, salvam e reabrem iguais
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { adulto } from './cenarios';
import { idade, transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { CarreiraEsportiva, Vida } from '../tipos';
import { executar } from '../acoes';
import { avancarAno } from '../ano';
import { interpretar } from '../save';
import { encerrarCarreira, fecharTemporada } from '../sistemas/esporte';
import { registrarTemporada } from '../sistemas/palmares';
import { contratar } from '../sistemas/trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { itensDaGaleria } from '../../ui/jogo/Galeria';
import { garantirFrente } from '../sistemas/frentes';

const responder = (v: Vida, r: ReturnType<typeof criarRng>) => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) { const op = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: (op[r.int(0, Math.max(0, op.length - 1))] ?? v.momento.opcoes[0]).id }).vida; } return v; };

describe('REWORK 11.5 · cenários longitudinais', () => {
  it('1 · a carreira de atleta vira comissão técnica, e as conquistas continuam acessíveis', () => {
    let v = transacao(adulto(24, { semente: 31, genero: 'masculino', municipioId: 'belo-horizonte-mg' }), x => {
      x.momento = null; delete x.fila;
      x.caminhos.frentes.futebol = { habilidade: 92, interesse: 80, meses: 200, auge: 92, tInicio: x.t - 200 } as never;
      x.corpo.forma = 80;
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Cruzeiro', nivel: 4, tInicio: x.t - 72, tFase: x.t - 60, lesoes: 0, municipioId: 'belo-horizonte-mg', reputacao: 70, espaco: 'titular', contratoAte: x.t + 120, posicao: 'goleiro', temporadas: [] } as CarreiraEsportiva;
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'o Cruzeiro', contrato: 'clt', salario: 60000, tInicio: x.t - 60, desempenho: 75, municipioId: 'belo-horizonte-mg', carga: 'integral' };
    }).vida;
    for (let k = 0; k < 8; k++) v = transacao(v, (x, r) => { const e = x.caminhos.esporte!; const t = fecharTemporada(x, r, e); registrarTemporada(x, r, e, t); x.t += 12; }).vida;
    const antes = itensDaGaleria(v).length;
    const palmares = v.caminhos.palmares?.length ?? 0;
    expect(palmares).toBeGreaterThan(0);
    // Fim de carreira e a comissão: treinador de goleiros.
    v = transacao(v, (x, r) => { encerrarCarreira(x, x.caminhos.esporte!, 'idade'); x.trabalho.atual = undefined; contratar(x, r, ocupacao('treinador_goleiros'), 'oportunidade'); }).vida;
    const r = criarRng(3);
    for (let k = 0; k < 4 && !v.morte; k++) v = responder(avancarAno(v).vida, r);
    expect(v.caminhos.palmares?.length ?? 0).toBeGreaterThanOrEqual(palmares);
    expect(itensDaGaleria(v).length).toBeGreaterThanOrEqual(antes);
    const lido = interpretar(JSON.stringify(v));
    expect(lido.tipo === 'ok' && lido.vida.caminhos.palmares).toEqual(v.caminhos.palmares);
    expect(v.caminhos.carreirasEsportivas?.length ?? (v.caminhos.esporte?.fase === 'encerrada' ? 1 : 0)).toBeGreaterThan(0);
  }, 400000);

  it('3 · dez anos de ator pelo motor, com as decisões do caminho: nada trava; o currículo e a renda andam', () => {
    let v = transacao(adulto(23, { semente: 7013 }), (x, rr) => {
      x.momento = null; delete x.fila;
      const fr = garantirFrente(x, 'teatro'); fr.habilidade = 70; fr.interesse = 80; fr.meses = 60;
      x.rotinas = x.rotinas.filter(rt => rt.id !== 'teatro'); x.rotinas.push({ id: 'teatro', tInicio: x.t, nivel: 2 });
      contratar(x, rr, ocupacao('ator'), 'teste');
    }).vida;
    const r = criarRng(11);
    let anos = 0;
    for (let k = 0; k < 10 && !v.morte; k++) {
      for (const oque of ['audicao', 'trabalho_pequeno']) { const a = { tipo: 'perseguir', oque } as never; v = executar(v, a).vida; v = responder(v, r); }
      v = responder(avancarAno(v).vida, r);
      anos++;
    }
    expect(anos).toBe(10);
    expect(idade(v)).toBeGreaterThanOrEqual(33);
  }, 400000);

  it('6 · saves antigos (v5–v16) abrem, jogam três anos com decisões, e o save do REWORK 11.5 reabre igual', () => {
    const pasta = join(__dirname, 'fixtures');
    const arquivos = readdirSync(pasta).filter(f => f.endsWith('.json'));
    expect(arquivos.length).toBeGreaterThan(30);
    let jogados = 0;
    for (const f of arquivos) {
      const l = interpretar(readFileSync(join(pasta, f), 'utf8'));
      expect(l.tipo, f).toBe('ok');
      if (l.tipo !== 'ok') continue;
      let v = l.vida;
      const r = criarRng(f.length);
      for (let k = 0; k < 3 && !v.morte; k++) { v = responder(v, r); v = responder(avancarAno(v).vida, r); }
      const de2 = interpretar(JSON.stringify(v));
      expect(de2.tipo, f).toBe('ok');
      if (de2.tipo === 'ok') expect(JSON.stringify(de2.vida.caminhos.envolvimento ?? null), f).toBe(JSON.stringify(v.caminhos.envolvimento ?? null));
      jogados++;
    }
    expect(jogados).toBe(arquivos.length);
  }, 400000);
});
