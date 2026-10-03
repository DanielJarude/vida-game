/**
 * TESTE TRANSVERSAL DO MUNDO (fechamento do ATT Mundo, Parte 30) — uma vida
 * inteira atravessando um país, como teste de integração (não um roteiro de
 * resultado: o que se confere é a coerência de cada camada).
 *
 *   nasce no Brasil → estuda → muda com a família para os EUA → a escola
 *   passa a ser a americana (o histórico brasileiro fica) → as instituições
 *   brasileiras deixam de aparecer como locais → carteira pela regra do
 *   estado → amizade e conflito fora da família → filho nascido nos EUA →
 *   patrimônio → morte → herança → continuar como o filho → nacionalidade,
 *   origem e residência de cada um → salvar e reabrir com o estado idêntico.
 *
 * O offline (desligar a rede, salvar, fechar, abrir) é a outra metade, com
 * o build real: `scripts/pwa/offline.mjs`.
 */

import { describe, expect, it } from 'vitest';
import { criarVida } from '../criacao';
import { disponibilidade, executar } from '../acoes';
import { idade, transacao } from '../nucleo';
import { interpretar } from '../save';
import { viverAte } from './ajuda';
import { comFilho, pessoaNova } from './cenarios';
import { entrarNaVida, educacaoDaVida, nacionalidadesDaVida, nacionalidadesDoBebe, paisDaVida, paisNatal } from '../mundo/vida';
import { migrarComAFamilia } from '../sistemas/migracao';
import { habilitacaoDaVida } from '../sistemas/autoescola';
import { vincular } from '../pessoas';
import { discutir, estadoDaRelacao } from '../sistemas/lacos';
import { continuarComo, partilhar } from '../sistemas/sucessao';
import { converterEntrePaises, formatarDinheiro } from '../mundo/moeda';
import { rotuloDe } from '../../ui/apresentar';

/** O que denuncia o Brasil como lugar atual (o passado brasileiro pode aparecer — é história). */
const BRASIL_COMO_LUGAR = /\bSESC\b|\bSUS\b|\bUBS\b|\bENEM\b|\bSISU\b|ProUni|\bFIES\b|\bCNH\b|Detran|\bINSS\b|\bFGTS\b|jovem aprendiz|instituto federal|\bEJA\b|supletivo|escola estadual|IPVA|cartório/;

describe('transversal: Brasil → EUA → a geração seguinte', () => {
  it('a vida inteira atravessa o país sem misturar instituições, e salvar/reabrir devolve o mesmo mundo', () => {
    // 1. Nasce no Recife e começa a escola no Brasil.
    let v = criarVida({ nome: 'Ana', sobrenome: 'Lima', genero: 'feminino', municipioId: 'recife-pe', semente: 2024 });
    v = viverAte(v, 8);
    expect(paisNatal(v)).toBe('BR');
    expect(v.educacao.basica).toBeDefined();
    expect(['pais', 'parente']).toContain(v.moradia.tipo);

    // 2. A família muda para Chicago: a escola passa a ser a americana; o histórico brasileiro fica.
    v = transacao(v, x => { migrarComAFamilia(x, 'us:chicago', 'A mãe'); }).vida;
    entrarNaVida(v);
    const tMudanca = v.t;
    expect(paisDaVida(v)).toBe('US');
    expect(nacionalidadesDaVida(v)).toEqual(['BR']);
    expect(v.educacao.historicoEscolar?.[0].pais).toBe('BR');
    expect(educacaoDaVida(v).acao).toBe('Fazer o SAT deste ano');

    // 3. Cresce em Illinois: a carteira é a do estado (aprendiz aos 15, sozinha aos 16).
    v = viverAte(v, 15);
    entrarNaVida(v);
    if (paisDaVida(v) === 'US') {
      const h = habilitacaoDaVida(v);
      expect(h.comeca).toBe(15);
      expect(h.sozinho).toBe(16);
      expect(disponibilidade(v, { tipo: 'cnh' }).grau).not.toBe('ilegal');
    }
    v = viverAte(v, 24);
    entrarNaVida(v);

    // 4. Nada do que a vida escreveu depois da mudança fala do Brasil como o lugar.
    const depois = v.biografia.filter(b => b.t > tMudanca && paisDaVida(v) === 'US').map(b => b.texto);
    expect(depois.filter(t => BRASIL_COMO_LUGAR.test(t))).toEqual([]);

    // 5. Uma amizade fora da família — e um conflito com consequência.
    v = transacao(v, (x, r) => {
      const amiga = pessoaNova(x, 24, 'feminino', { nome: 'Marina' });
      const vin = vincular(x, amiga, { origem: 'trabalho', proximidade: 72, convivio: ['trabalho'] });
      vin.estagio = 'amigo'; vin.confianca = 65; vin.tInicio = x.t - 48;
      vin.historia.push({ t: x.t - 36, texto: 'Viraram amigas no trabalho.', tipo: 'amizade', peso: 2 });
      discutir(x, r, amiga, vin, 2, 'um dinheiro emprestado que não voltou');
    }).vida;
    const amigaId = Object.values(v.pessoas).find(p => p.nome === 'Marina')!.id;
    expect(['amigo', 'ex_amigo']).toContain(v.vinculos[amigaId].estagio);
    expect(rotuloDe(v, v.pessoas[amigaId], v.vinculos[amigaId])).toMatch(/amiga/);

    // 6. Um filho nascido nos EUA: americano pelo solo, brasileiro pelo sangue.
    v = transacao(v, x => {
      const { p } = comFilho(x, 2, { genero: 'masculino' });
      p.municipioNatal = 'us:chicago';
      p.nacionalidades = nacionalidadesDoBebe('us:chicago', [nacionalidadesDaVida(x)], 10);
      x.financas.conta = 400000;
    }).vida;
    const filho = Object.values(v.pessoas).find(p => p.genitores?.includes('eu'))!;
    expect(filho.nacionalidades).toEqual(expect.arrayContaining(['US', 'BR']));

    // 7. Morre; a herança é pela lei de onde morava; o filho continua.
    v = viverAte(v, 52);
    entrarNaVida(v);
    const aindaNosEua = paisDaVida(v) === 'US';
    v = transacao(v, x => { x.morte = { t: x.t, causa: 'infarto' }; }).vida;
    const partilha = partilhar(v);
    expect(partilha.quinhoes.some(q => q.pessoaId === filho.id)).toBe(true);
    const cont = continuarComo(v, filho.id);
    expect(cont.erro).toBeUndefined();
    const n = cont.vida;
    entrarNaVida(n);
    expect(paisNatal(n)).toBe('US');
    expect(nacionalidadesDaVida(n)).toEqual(expect.arrayContaining(['US', 'BR']));
    if (aindaNosEua) {
      expect(paisDaVida(n)).toBe('US');
      expect(formatarDinheiro(1000)).toMatch(/US\$|USD/);
    }
    // A linhagem lembra a mãe, brasileira do Recife.
    expect(n.linhagem!.geracoes[0].municipioNatal).toBe('recife-pe');
    expect(converterEntrePaises(1, 'US', 'US')).toBe(1);

    // 8. Salvar e reabrir: o mesmo mundo, a mesma família, as mesmas relações.
    const json = JSON.stringify(n);
    const lido = interpretar(json);
    expect(lido.tipo).toBe('ok');
    if (lido.tipo !== 'ok') return;
    expect(JSON.stringify(lido.vida)).toBe(json);
    expect(estadoDaRelacao(lido.vida, Object.values(lido.vida.vinculos)[0])).toBeTruthy();
    expect(idade(lido.vida)).toBe(idade(n));
    void executar;
  });
});
