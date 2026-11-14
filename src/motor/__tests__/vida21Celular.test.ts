/**
 * VIDA 21 · o celular: a sua fala é a da situação e da pessoa (não só do tom), as notícias dizem o que aconteceu, quem
 * desabafa do chefe tem chefe, a lembrança vem na voz de quem manda; e o "Pede atenção" não é uma segunda caixa de
 * mensagens nem repete o que já passou. Mais uma simulação de vidas inteiras com as invariantes.
 */
import { describe, expect, it } from 'vitest';
import { adulto } from './cenarios';
import { criarRng } from '../rng';
import { criarVida } from '../criacao';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { transacao, vinculosVivos } from '../nucleo';
import { papelDe } from '../sistemas/vinculos';
import { opcoesDaMsg15, pendentes15 } from '../v15/celular/celular15';
import { falaDaResposta21, falaDaSituacao21, lembrancaNatural, trabalhaHoje } from '../v21/celular/conversas21';
import { noticia21, noticiaDeApoio } from '../dados21/celular/falas21';
import { sinaisSociais } from '../../ui/leitura';
import type { Msg15 } from '../dados15/celular/tipos';
import type { Pessoa, Vida } from '../tipos';

const flexF = (_m: string, f: string) => f;
const msg = (x: Partial<Msg15>): Msg15 => ({ id: 'm1', t: 0, tipo: 'convite', texto: '', ...x } as Msg15);
const comPapel = (v: Vida, papel: string) => vinculosVivos(v).find(x => !x.p.especie && papelDe(x.p, x.vin) === papel);

describe('VIDA 21 · a sua fala no balão', () => {
  const v = adulto(30, { semente: 2111 });
  it('dizer que não curte o programa do irmão não vira recusa romântica', () => {
    const irmao = comPapel(v, 'irmao') ?? vinculosVivos(v).find(x => !x.p.especie)!;
    for (let k = 0; k < 30; k++) {
      const f = falaDaResposta21(v, criarRng(k), msg({ tipo: 'convite', de: irmao.p.id }), 'desinteresse')!;
      expect(f).not.toMatch(/como amig|procurando nada|não sinto o mesmo/);
    }
  });
  it('o "Só se tiver pudim" do botão é o que vai no balão (antes, uma frase qualquer do tom)', () => {
    const p = vinculosVivos(v).find(x => !x.p.especie)!;
    expect(falaDaResposta21(v, criarRng(1), msg({ tipo: 'familia17', sit17: 'familia_reuniao', de: p.p.id }), 'engracada')).toBe('Só se tiver pudim.');
  });
  it('com a mãe ou o pai, você chama de mãe/pai; criança responde como criança', () => {
    const pais = comPapel(v, 'genitor');
    if (pais) {
      const f = falaDaResposta21(v, criarRng(3), msg({ tipo: 'saudade', de: pais.p.id }), 'carinhosa')!;
      expect(f).toMatch(pais.p.genero === 'feminino' ? /mãe/ : /pai/);
    }
    const crianca = adulto(10, { semente: 2112 });
    const amigo = vinculosVivos(crianca).find(x => !x.p.especie)!;
    const f = falaDaResposta21(crianca, criarRng(2), msg({ tipo: 'convite', de: amigo.p.id }), 'aceitar')!;
    expect(f).toMatch(/pedir pra minha mãe/);
  });
  it('deixar no visto não põe palavras na sua boca', () => {
    const p = vinculosVivos(v).find(x => !x.p.especie)!;
    expect(falaDaResposta21(v, criarRng(1), msg({ tipo: 'conflito', sit17: 'conflito_magoa', de: p.p.id }), 'evasiva')).toBe('');
  });
  it('o aniversário mandado por uma criança não tem fala de mãe', () => {
    const p = vinculosVivos(v).find(x => !x.p.especie)!.p;
    const w = transacao(v, x => { x.pessoas[p.id].tNasc = x.t - 9 * 12; }).vida;
    for (let k = 0; k < 10; k++) expect(falaDaSituacao21(w, criarRng(k), 'aniversario', w.pessoas[p.id])).not.toMatch(/meu bem|meu amor|filh/);
  });
});

describe('VIDA 21 · as notícias dizem o que aconteceu', () => {
  it('cortar gastos é aperto (pede apoio), não "casa nova"', () => {
    const n = noticia21('casa', 'Cortou gastos: as contas apertaram.', flexF)!;
    expect(n.fala).not.toMatch(/Casa nova|Vem conhecer/);
    expect(noticiaDeApoio(`${n.chave}:1`)).toBe(true);
    expect(noticia21('casa', 'Trocou de casa por uma menor.', flexF)!.fala).toMatch(/menor/);
  });
  it('pressão alta não é "recebi alta"; depressão não é "nada de pânico"; grávida não é "nasceu"', () => {
    expect(noticia21('saude', 'Recebeu o diagnóstico: pressão alta. Começou o tratamento.', flexF)!.fala).not.toMatch(/alta!/);
    expect(noticia21('saude', 'Recebeu o diagnóstico: depressão. Começou o tratamento.', flexF)!.fala).toMatch(/tratamento pra cabeça/);
    expect(noticia21('filho', 'Está grávida. O bebê deve nascer em julho de 2050.', flexF)!.fala).toMatch(/Vou ser mãe/);
    expect(noticia21('filho', 'Nasceu Agatha.', flexF)!.fala).toMatch(/Agatha nasceu/);
    expect(noticia21('trabalho', 'Pegou um trabalho extra para pagar as contas.', flexF)!.chave).toBe('aperto');
  });
});

describe('VIDA 21 · coerência de quem fala', () => {
  it('aposentada de 86 anos não desabafa sobre o chefe', () => {
    const p = { ocupacao: 'aposentada', renda: 1800 } as Pessoa;
    expect(trabalhaHoje(p, 86)).toBe(false);
    expect(trabalhaHoje({ ocupacao: 'desempregado', renda: 0 } as Pessoa, 40)).toBe(false);
    expect(trabalhaHoje({ ocupacao: 'enfermeira', renda: 4200 } as Pessoa, 40)).toBe(true);
  });
  it('a lembrança vem na voz de quem manda (ou não vem)', () => {
    expect(lembrancaNatural('Ligou para comemorar uma conquista.')).toBe('você ligou para comemorar uma conquista');
    expect(lembrancaNatural('Saíram juntos depois de um convite pelo celular.')).toBe('a gente saiu junto depois de um convite pelo celular');
    expect(lembrancaNatural('Conheceram-se por Ana.')).toBeUndefined();
    expect(lembrancaNatural('O reencontro, anos depois.')).toBeUndefined();
  });
});

describe('VIDA 21 · Pede atenção não é a caixa de mensagens', () => {
  const base = adulto(35, { semente: 2113 });
  const amigo = vinculosVivos(base).find(x => !x.p.especie && ['amigo', 'amigo_proximo'].includes(papelDe(x.p, x.vin))) ?? vinculosVivos(base).find(x => !x.p.especie)!;
  it('o convite é só mensagem; a queixa de distância some quando vocês já se falaram', () => {
    const conv = transacao(base, x => { x.vinculos[amigo.p.id].chamado = { tipo: 'convite', t: x.t, texto: 'chamou para um show' }; }).vida;
    expect(sinaisSociais(conv, 6).some(s => s.pessoaId === amigo.p.id && /quer passar um tempo/.test(s.texto))).toBe(false);
    const queixa = (contato: number) => transacao(base, x => { x.vinculos[amigo.p.id].chamado = { tipo: 'reclamacao', t: x.t - 2, texto: 'sumiu, hein?' }; x.vinculos[amigo.p.id].tUltimoContato = contato; x.vinculos[amigo.p.id].proximidade = 70; }).vida;
    expect(sinaisSociais(queixa(base.t - 30), 6).some(s => s.pessoaId === amigo.p.id && /sente a sua falta/.test(s.texto))).toBe(true);
    expect(sinaisSociais(queixa(base.t), 6).some(s => s.pessoaId === amigo.p.id && /sente a sua falta/.test(s.texto))).toBe(false);
  });
  it('o apoio diz o motivo; o "perdeu o emprego" de um ano atrás vira "continua sem emprego"', () => {
    const ap = transacao(base, x => { x.vinculos[amigo.p.id].chamado = { tipo: 'apoio', t: x.t, texto: '...', assunto: 'doenca' }; }).vida;
    expect(sinaisSociais(ap, 6).find(s => s.pessoaId === amigo.p.id)?.texto).toMatch(/consultas/);
    const velho = transacao(base, x => { const p = x.pessoas[amigo.p.id]; p.aperto = { tipo: 'desemprego', t: x.t - 12 }; x.vinculos[amigo.p.id].proximidade = 80; x.vinculos[amigo.p.id].tUltimoContato = x.t; }).vida;
    const s = sinaisSociais(velho, 6).find(x => x.pessoaId === amigo.p.id && /emprego/.test(x.texto));
    if (s) expect(s.texto).toMatch(/continua sem emprego/);
  });
});

describe('VIDA 21 · vidas inteiras, respondidas ao acaso: as invariantes do celular', () => {
  it('sem recusa romântica fora do romance, sem festa para aperto, sem saudade de quem se falou agora', () => {
    let violacoes: string[] = [];
    let respondidas = 0;
    for (let s = 1; s <= 3; s++) {
      let v = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: 'recife-pe', semente: s * 97 + 1 });
      const r = criarRng(s);
      for (let a = 0; a < 50 && !v.morte; a++) {
        v = avancarAno(v).vida;
        for (let k = 0; k < 6 && v.momento; k++) { const ops = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: r.pick(ops).id }).vida; }
        for (const x of sinaisSociais(v, 6)) {
          const vin = x.pessoaId ? v.vinculos[x.pessoaId] : undefined;
          if (/sente a sua falta/.test(x.texto) && vin && v.t - vin.tUltimoContato < 12) violacoes.push(`falta recente: ${x.texto}`);
          if (/chamou você para sair/.test(x.texto)) violacoes.push(`convite no Pede atenção: ${x.texto}`);
        }
        for (const m of pendentes15(v)) {
          if (m.tipo === 'noticia' && /Casa nova/.test(m.texto) && /cort|menor|apert/i.test(m.cartao ?? '')) violacoes.push(`notícia: ${m.texto} / ${m.cartao}`);
          if (m.tipo === 'noticia' && /Nasceu!/.test(m.texto) && /grávid/i.test(m.cartao ?? '')) violacoes.push(`notícia: ${m.texto} / ${m.cartao}`);
          const ops = opcoesDaMsg15(v, m).filter(o => !o.veredito || o.veredito.grau === undefined || (o.veredito as { grau?: string }).grau !== 'impossivel');
          if (!ops.length) continue;
          const o = r.pick(ops);
          v = executar(v, { tipo: 'celular15', oque: { op: 'responder', id: m.id, escolha: o.op } }).vida;
          const mm = v.celular15?.msgs.find(x => x.id === m.id);
          if (!mm?.resposta) continue;
          respondidas++;
          if (m.tipo !== 'paquera' && /como amig|procurando nada agora/.test(mm.resposta.fala ?? '')) violacoes.push(`recusa romântica em ${m.tipo}/${m.sit17}: ${mm.resposta.fala}`);
        }
      }
    }
    expect(respondidas).toBeGreaterThan(40);
    expect(violacoes).toEqual([]);
  }, 300_000);
});
