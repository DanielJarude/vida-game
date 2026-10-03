/**
 * A comissão técnica é DA MODALIDADE (P0 do playtest): o auxiliar de basquete
 * ou de vôlei não pode virar `tecnico_futebol` (o comando de clube de futebol)
 * pela escada genérica de promoção.
 *
 * Causa: `auxiliar_tecnico` era um cargo sem esporte; o convite do fim de
 * carreira levava a modalidade (`Oportunidade.dominio`), o emprego a perdia,
 * e `degrausAcima` (mesma trilha `treino`, nível + 1) levava ao único nível 5
 * da trilha: o técnico de futebol. Agora a modalidade é da OCUPAÇÃO e a
 * escada a preserva.
 *
 * Atravessa: o fim da carreira de atleta → o convite da comissão do próprio
 * esporte → o emprego → 20+ anos de vida (promoção, demissão, troca de
 * emprego) → nenhuma troca de modalidade, nunca a carreira de técnico de
 * futebol fora do futebol.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { transacao } from '../nucleo';
import { criarRng } from '../rng';
import type { Dominio, Vida } from '../tipos';
import { OCUPACOES, comissaoDe, ocupacao } from '../dados/ocupacoes';
import { contratar, degrausAcima, processarTrabalho, saltosDeModalidade } from '../sistemas/trabalho';
import { garantirFrente } from '../sistemas/frentes';
import { encerrarCarreira, entrarNaBase, profissionalizar } from '../sistemas/esporte';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { marcarFato } from '../nucleo';
import { exportarVida, importarVida } from '../save';

const ESPORTES: Dominio[] = ['futebol', 'basquete', 'volei', 'natacao', 'atletismo', 'lutas'];

let base: Vida | undefined;
const trinta = (): Vida => structuredClone((base ??= adulto(30, { semente: 41, genero: 'masculino', municipioId: 'sao-paulo-sp' })));

/** Um ex-atleta profissional de `m` que se preparou para o banco: a carreira acaba e o convite chega. */
function exAtleta(m: Dominio, s: number): Vida {
  return transacao(trinta(), x => {
    const r = criarRng(s);
    x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = [];
    garantirFrente(x, m);
    Object.assign(x.caminhos.frentes[m]!, { habilidade: 80, interesse: 90, meses: 200, auge: 82 });
    entrarNaBase(x, m, x.moradia.municipioId, 'Clube da Cidade');
    profissionalizar(x, r, 3);
    marcarFato(x, 'pos_treinador');
    encerrarCarreira(x, x.caminhos.esporte!, 'idade');
    x.momento = null;
  }).vida;
}

const modalidades = (v: Vida) => new Set([...v.trabalho.historico, ...(v.trabalho.atual ? [v.trabalho.atual] : [])]
  .flatMap(e => [...(e.postos ?? []).map(p => p.ocupacaoId), e.ocupacaoId]).map(id => ocupacao(id).modalidade).filter(Boolean));

describe('a escada da comissão técnica não troca de esporte', () => {
  it('o catálogo: todo degrau acima preserva a modalidade; cada esporte de equipe tem auxiliar → técnico próprio', () => {
    for (const oc of OCUPACOES) for (const x of degrausAcima(oc)) expect(x.modalidade, `${oc.id} → ${x.id}`).toBe(oc.modalidade);
    for (const m of ESPORTES) {
      const c = comissaoDe(m);
      expect(c.auxiliar, m).toBeDefined();
      expect(degrausAcima(ocupacao(c.auxiliar!)).map(x => x.id), m).toEqual([c.tecnico]);
    }
    expect(comissaoDe('futebol')).toEqual({ auxiliar: 'auxiliar_tecnico', tecnico: 'tecnico_futebol' });
    // Tênis não tem comissão (é aula e circuito).
    expect(comissaoDe('tenis').auxiliar).toBeUndefined();
  });

  it('o convite do fim de carreira é para a comissão DO PRÓPRIO esporte', () => {
    for (const m of ESPORTES) {
      const v = exAtleta(m, 7);
      const op = v.caminhos.oportunidades.find(o => o.ocupacaoId && ocupacao(o.ocupacaoId).trilha === 'treino');
      expect(op, m).toBeDefined();
      expect(op!.ocupacaoId, m).toBe(comissaoDe(m).auxiliar);
      expect(ocupacao(op!.ocupacaoId!).modalidade).toBe(m);
    }
  });

  it('causal, rápido: 30 auxiliares por esporte, 25 anos de escada — nenhum troca de esporte, e os de fora do futebol chegam ao comando do próprio', () => {
    for (const m of ESPORTES) {
      let promovidos = 0;
      for (let s = 1; s <= 30; s++) {
        const v = transacao(exAtleta(m, s), x => {
          const r = criarRng(s * 97);
          contratar(x, r, ocupacao(comissaoDe(m).auxiliar!), 'oportunidade');
          x.trabalho.experiencia['treino'] = 48;
          for (let k = 0; k < 25; k++) {
            x.t += 12;
            if (x.trabalho.atual) x.trabalho.atual.desempenho = Math.max(x.trabalho.atual.desempenho, 80);
            processarTrabalho(x, criarRng(s * 1000 + k));
            if (!x.trabalho.atual) contratar(x, r, ocupacao(comissaoDe(m).auxiliar!), 'oportunidade');
          }
        }).vida;
        expect(saltosDeModalidade(v), `${m} #${s}`).toEqual([]);
        expect([...modalidades(v)], `${m} #${s}`).toEqual([m]);
        if (m !== 'futebol') {
          expect(v.trabalho.atual?.ocupacaoId).not.toBe('tecnico_futebol');
          expect(v.trabalho.historico.some(h => h.ocupacaoId === 'tecnico_futebol')).toBe(false);
        }
        if ([...(v.trabalho.atual ? [v.trabalho.atual] : []), ...v.trabalho.historico].some(e => e.ocupacaoId === comissaoDe(m).tecnico)) promovidos++;
      }
      // A escada existe e funciona (não é bloqueio disfarçado): boa parte chega a técnico DO PRÓPRIO esporte.
      expect(promovidos, m).toBeGreaterThan(5);
    }
  });

  it('causal, vida inteira: auxiliares de basquete, vôlei e natação vivendo 22 anos pelo motor — nunca no banco de um clube de futebol', () => {
    for (const m of ['basquete', 'volei', 'natacao'] as Dominio[]) {
      for (let s = 1; s <= 2; s++) {
        let v = transacao(exAtleta(m, 100 + s), x => { contratar(x, criarRng(s), ocupacao(comissaoDe(m).auxiliar!), 'oportunidade'); x.trabalho.experiencia['treino'] = 48; }).vida;
        for (let k = 0; k < 22 && !v.morte; k++) {
          v = avancarAno(v).vida;
          for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida;
          expect(saltosDeModalidade(v), `${m} #${s} ano ${k}`).toEqual([]);
          expect(v.trabalho.atual?.ocupacaoId, `${m} #${s} ano ${k}`).not.toBe('tecnico_futebol');
          expect(v.caminhos.tecnico, `${m} #${s} ano ${k}`).toBeUndefined();
        }
      }
    }
  }, 240000);

  it('save antigo: o auxiliar "genérico" que veio do vôlei volta para a comissão do vôlei (e nunca sobe ao futebol)', () => {
    let v = transacao(exAtleta('volei', 3), x => {
      const r = criarRng(3);
      // Como o motor antigo deixava: o cargo sem esporte (`auxiliar_tecnico`, que hoje é o do futebol).
      contratar(x, r, ocupacao('auxiliar_tecnico'), 'oportunidade');
    }).vida;
    const l = importarVida(exportarVida(v));
    if (l.tipo !== 'ok') throw new Error(l.tipo);
    v = transacao(l.vida, x => { x.t += 12; processarTrabalho(x, criarRng(9)); }).vida;
    expect(v.trabalho.atual!.ocupacaoId).toBe('auxiliar_tecnico_volei');
    expect(saltosDeModalidade(v)).toEqual([]);
  });
});
