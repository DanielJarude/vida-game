/**
 * REWORK 7.5 — interfaces do cotidiano, memória social e coerência da morte (motor).
 *
 *   1. Consequência conhecida (`Entrada.segue`): a despedida segue a morte; a crise em casa segue a da cidade.
 *   3. Interações com contexto: agradecer só pelo que aconteceu; conversar/tempo/carinho em situações elegíveis, sem
 *      repetir a mesma cena em seguida; a lembrança é um marco real; o conselho recebido vira algo a agradecer;
 *      coerência em idades, países e relações diferentes.
 *   4. Morte: a idade com que morreu é UMA (história, biografia, ficha); quem morreu não "está aposentado"; o avô tem
 *      filhos (a árvore liga os pais do jogador aos avós); o luto anda no ritmo do tamanho da perda; a repetência não
 *      pesa no ano seguinte; os gestos de memória respeitam tempo, idade e distância e não dão felicidade de prêmio.
 *   S. Saves: os campos novos validam; um save de antes corrige a idade escrita errada ao abrir.
 */
import { describe, expect, it } from 'vitest';
import { adulto, comParceiro, comParente, pessoaNova } from './cenarios';
import { nova, responderTudo, viverAte } from './ajuda';
import { avancarAno } from '../ano';
import { executar } from '../acoes';
import { escrever, idadeAoMorrer, idadePessoa, lembrarCom, transacao } from '../nucleo';
import { abrirDecisao, aplicarAcontecimento, conteudoPorId } from '../conteudo/motor';
import { contexto } from '../conteudo/base';
import { vincular } from '../pessoas';
import { interpretar, normalizarRework75 } from '../save';
import { registrarMortes, processarLuto, faseDoLuto } from '../sistemas/luto';
import { abalar } from '../sistemas/abalo';
import { leituraDoEstado } from '../sistemas/estado';
import { fraseDoSaber, saberes, filhosDe } from '../sistemas/conhecimento';
import { interacoesPara, rotuloInteracao, ctxPessoa } from '../sistemas/interacoes';
import { aAgradecer, ajudasRecebidas } from '../sistemas/conversas';
import { disponibilidadeGesto, gestosDeMemoria } from '../sistemas/memoria';
import { criarRng } from '../rng';
import { capitalDoPais } from '../dados/lugares';
import type { Pessoa, Vida } from '../tipos';

const umAno = (v: Vida) => responderTudo(avancarAno(v).vida);
const amigaDe = (v: Vida, anos = 6): Pessoa => {
  const p = pessoaNova(v, 30, 'feminino');
  const vin = vincular(v, p, { origem: 'trabalho', proximidade: 72, convivio: [] });
  vin.estagio = 'amigo_proximo';
  vin.tInicio = v.t - anos * 12;
  p.municipioId = v.moradia.municipioId;
  return p;
};
const fazer = (v: Vida, pessoaId: string, interacao: string) => executar(v, { tipo: 'pessoa', pessoaId, interacao });

/* ------------------------------------------------------------ 3. Agradecer */

describe('agradecer: só pelo que aconteceu', () => {
  it('sem ajuda registrada e sem anos de relação, não há o que agradecer', () => {
    const v = adulto(25, { semente: 31 });
    const p = pessoaNova(v, 25, 'feminino');
    const vin = vincular(v, p, { origem: 'trabalho', proximidade: 40, convivio: [] });
    vin.estagio = 'amigo';
    p.municipioId = v.moradia.municipioId;
    expect(ajudasRecebidas(v, p)).toEqual([]);
    expect(interacoesPara(v, p.id).some(x => x.id === 'agradecer')).toBe(false);
  });

  it('o conselho que ela deu vira o agradecimento — com o assunto de verdade — e não se agradece duas vezes', () => {
    let v = adulto(25, { semente: 31 });
    const p = amigaDe(v, 1);
    v.vinculos[p.id].proximidade = 50;
    expect(interacoesPara(v, p.id).some(x => x.id === 'agradecer')).toBe(false);
    v = fazer(v, p.id, 'pedir_conselho').vida;
    const marco = v.vinculos[p.id].historia.find(h => /^Pediu conselho sobre /.test(h.texto))!;
    expect(marco.de).toBe('ela');
    const rotulo = rotuloInteracao(v, p.id, 'agradecer');
    expect(rotulo).toMatch(/^Agradecer a .+ pelo conselho sobre /);
    expect(rotulo).toContain(marco.texto.replace(/^Pediu conselho sobre /, '').replace(/\.$/, ''));
    v = umAno(v);
    const r = fazer(v, p.id, 'agradecer');
    expect(r.aviso?.texto ?? r.resultado ?? '').not.toMatch(/undefined|\$\{/);
    v = r.vida;
    expect(aAgradecer(v, v.pessoas[p.id])).toEqual([]);
    expect(rotuloInteracao(v, p.id, 'agradecer') || '').not.toMatch(/conselho/);
  });

  it('o pai ou a mãe que criou você: "por ter criado você" (a origem diz quem criou); o elogio não inventa ajuda', () => {
    const v = viverAte(nova({ semente: 77 }), 20);
    const mae = Object.values(v.vinculos).find(x => x.parentesco === 'mae')!;
    const criou = ['pais_juntos', 'mae_solo'].includes(v.origem.arranjo);
    expect(ajudasRecebidas(v, v.pessoas[mae.pessoaId]).some(a => a.chave === 'criou')).toBe(criou);
    const c = ctxPessoa(v, mae.pessoaId)!;
    expect(c).toBeTruthy();
    expect(rotuloInteracao(v, mae.pessoaId, 'elogiar') ?? '').not.toMatch(/nunca agradeceu/);
  });
});

/* -------------------------------------------- 3. Contexto, memória e repetição */

describe('conversar, passar um tempo, carinho: situações, não rodízio de frases', () => {
  it('oito anos de conversa com a mesma amiga: nenhuma cena se repete em seguida, várias estruturas, texto limpo', () => {
    let v = adulto(30, { semente: 41 });
    const p = amigaDe(v);
    lembrarCom(v, p.id, 'Viajaram juntas para a praia, sem dinheiro e sem plano.', 'amizade', 2, v.t - 60);
    const cenas: string[] = [];
    const textos: string[] = [];
    for (let k = 0; k < 8; k++) {
      const r = fazer(v, p.id, 'conversar');
      v = r.vida;
      textos.push(r.aviso?.texto ?? r.resultado ?? '');
      cenas.push((v.vinculos[p.id].cenas ?? []).filter(x => x.startsWith('conv:')).slice(-1)[0]?.split('@')[0] ?? '');
      v = umAno(v);
    }
    for (let k = 1; k < cenas.length; k++) expect(cenas[k], `ano ${k}: ${cenas.join(' / ')}`).not.toBe(cenas[k - 1]);
    expect(new Set(cenas).size).toBeGreaterThanOrEqual(4);
    for (const t of textos) { expect(t.length).toBeGreaterThan(20); expect(t).not.toMatch(/undefined|\$\{|NaN/); }
    for (let k = 1; k < textos.length; k++) expect(textos[k]).not.toBe(textos[k - 1]);
  });

  it('a lembrança é um marco REAL de vocês (o ano e o que aconteceu), e o conselho recebido fica como ajuda dela', () => {
    let v = adulto(30, { semente: 41 });
    const p = amigaDe(v);
    lembrarCom(v, p.id, 'Viajaram juntas para a praia, sem dinheiro e sem plano.', 'amizade', 2, v.t - 60);
    let achouLembranca = false;
    for (let k = 0; k < 10 && !achouLembranca; k++) {
      const r = fazer(v, p.id, 'conversar');
      v = r.vida;
      const ultima = (v.vinculos[p.id].cenas ?? []).slice(-1)[0] ?? '';
      if (ultima.startsWith('conv:lembranca')) { achouLembranca = true; expect(r.aviso?.texto ?? r.resultado).toMatch(/viajaram juntas para a praia/); }
      v = umAno(v);
    }
    expect(achouLembranca).toBe(true);
    // O conselho: alguém bem mais velho, você com a cabeça cheia.
    const w = adulto(25, { semente: 42 });
    const mais = pessoaNova(w, 55, 'feminino');
    const vin = vincular(w, mais, { origem: 'trabalho', proximidade: 60, convivio: [] });
    vin.estagio = 'amigo';
    mais.municipioId = w.moradia.municipioId;
    let x = w;
    let teveConselho = false;
    for (let k = 0; k < 10 && !teveConselho; k++) {
      x = transacao(x, y => { y.mente.estresse = 70; }).vida;
      x = fazer(x, mais.id, 'conversar').vida;
      teveConselho = x.vinculos[mais.id].historia.some(h => h.de === 'ela' && /conselho/.test(h.texto));
      x = umAno(x);
    }
    expect(teveConselho).toBe(true);
    expect(ajudasRecebidas(x, x.pessoas[mais.id]).length).toBeGreaterThan(0);
  });

  it('passar o tempo não vira marco toda vez (cinco anos de tardes: no máximo dois marcos novos)', () => {
    let v = adulto(30, { semente: 43 });
    const p = amigaDe(v);
    // REWORK 9.7: a pré-condição dita — a vida da amiga não tem marcos próprios no período (já casada, com saúde): o que
    // se mede são as tardes. Antes, dependia de a semente não sortear o casamento ou uma internação dela.
    const par = pessoaNova(v, 31, 'masculino'); p.parceiroId = par.id; par.parceiroId = p.id; p.saude = 95;
    const antes = v.vinculos[p.id].historia.length;
    for (let k = 0; k < 5; k++) { v = transacao(fazer(v, p.id, 'tempo').vida, x => { x.pessoas[p.id].saude = 95; }).vida; v = umAno(v); }
    expect(v.vinculos[p.id].historia.length - antes).toBeLessThanOrEqual(2);
  });

  it('o carinho depende do momento do casal: morno quando a relação esfria, presença na semana puxada', () => {
    const v = adulto(35, { semente: 44 });
    const { p, vin } = comParceiro(v);
    vin.romance!.envolvimento = 25;
    vin.tensao = 45;
    // Numa relação fria, o gesto nunca é descrito como o carinho de quem está bem (nem volta retribuído).
    let w = v;
    const cenas: string[] = [];
    for (let k = 0; k < 5; k++) {
      w = transacao(w, x => { x.vinculos[p.id].romance!.envolvimento = 25; x.vinculos[p.id].tensao = 45; }).vida;
      w = fazer(w, p.id, 'carinho').vida;
      cenas.push((w.vinculos[p.id].cenas ?? []).slice(-1)[0]);
      w = transacao(w, x => { x.t += 12; x.anoAtual.acoes = []; }).vida;
    }
    expect(cenas.every(c => /^carinho:(morno|lembrou|semana_puxada)/.test(c)), cenas.join(' ')).toBe(true);
    expect(cenas.some(c => c.startsWith('carinho:morno'))).toBe(true);
  });

  it('coerente em idades, países e relações: criança e irmão, adolescente e amigo, idosa e filho, no Japão e em Portugal', () => {
    const jp = capitalDoPais('JP')!.id;
    const pt = capitalDoPais('PT')!.id;
    for (const [i, municipioId] of [[9, 'recife-pe'], [16, jp], [45, pt], [72, 'recife-pe']] as [number, string][]) {
      let v = adulto(i, { semente: 50 + i, municipioId });
      const ids = Object.values(v.vinculos).filter(x => v.pessoas[x.pessoaId]?.vivo && !v.pessoas[x.pessoaId].especie).map(x => x.pessoaId).slice(0, 6);
      for (const id of ids) for (const acao of ['conversar', 'tempo', 'carinho', 'agradecer']) {
        if (!interacoesPara(v, id).some(x => x.id === acao)) continue;
        const r = fazer(v, id, acao);
        const t = r.aviso?.texto ?? r.resultado ?? '';
        expect(t, `${i} anos, ${acao}`).not.toMatch(/undefined|\$\{|NaN|null/);
        v = r.vida;
      }
    }
  });
});

/* ---------------------------------------------------------------- 4. Morte */

/** Mata alguém já ligado à vida, pelo caminho do motor (registrarMortes). */
function matar(v: Vida, p: Pessoa) {
  registrarMortes(v, criarRng(3), [{ p, vin: v.vinculos[p.id], causa: 'coração' }], () => {});
}

describe('morte: um dado só, no tempo certo', () => {
  it('a idade com que morreu é a mesma na história de vocês, na biografia e na idade da pessoa (que para de contar)', () => {
    for (let k = 0; k < 12; k++) {
      const v = adulto(30, { semente: 60 + k });
      const { p } = comParente(v, 'avo', 74, 'masculino', 70);
      p.tNasc -= k; // o mês do aniversário varia: é aí que "75 aqui, 76 ali" aparecia
      matar(v, p);
      const ao = idadeAoMorrer(p)!;
      expect(idadePessoa(v, p)).toBe(ao);
      expect(v.vinculos[p.id].historia.find(h => /^Morreu, aos/.test(h.texto))!.texto).toBe(`Morreu, aos ${ao} anos.`);
      const e = v.biografia.find(x => x.evento?.pessoaId === p.id && x.evento.tipo === 'morte');
      if (e && /aos \d+ anos/.test(e.texto)) expect(e.texto).toContain(`aos ${ao} anos`);
      // Anos depois, a idade de quem morreu não cresce.
      const depois = transacao(v, x => { x.t += 36; }).vida;
      expect(idadePessoa(depois, depois.pessoas[p.id])).toBe(ao);
    }
  });

  it('de quem morreu, a ficha fala no passado: "estava aposentado quando morreu", "teve N filhos"', () => {
    const v = viverAte(nova({ semente: 91 }), 12);
    const avo = Object.values(v.vinculos).find(x => x.parentesco === 'avo' && v.pessoas[x.pessoaId].vivo)!;
    const p = v.pessoas[avo.pessoaId];
    p.ocupacao = p.genero === 'feminino' ? 'aposentada' : 'aposentado';
    matar(v, p);
    const frases = saberes(v, p, v.vinculos[p.id]).map(s => fraseDoSaber(v, p, s));
    expect(frases.join(' ')).not.toMatch(/Está aposentad|Trabalha como|Não tem filhos|vive com/);
    expect(frases.join(' ')).toMatch(/Estava aposentad. quando morreu/);
    expect(frases.join(' ')).toMatch(/Teve (um|dois|três|quatro|cinco|seis|\d+) filhos?/);
  });

  it('a árvore liga os pais do jogador aos avós (e os avós entre si): o avô tem filho, a morte dele chega ao filho', () => {
    let achou = 0;
    for (let s = 1; s <= 20; s++) {
      const v = nova({ semente: s });
      const avos = Object.values(v.vinculos).filter(x => x.parentesco === 'avo').map(x => v.pessoas[x.pessoaId]);
      for (const a of avos) {
        expect(filhosDe(v, a).todos, `semente ${s}`).toBeGreaterThanOrEqual(1);
        const filho = Object.values(v.pessoas).find(x => x.genitores?.includes(a.id));
        if (filho) achou++;
      }
    }
    expect(achou).toBeGreaterThan(10);
  });

  it('um save de antes (idade escrita até o fim do ano) abre com a idade certa; nada mais é reescrito', () => {
    const v = adulto(30, { semente: 62 });
    const { p } = comParente(v, 'avo', 74, 'masculino', 70);
    matar(v, p);
    const ao = idadeAoMorrer(p)!;
    const h = v.vinculos[p.id].historia.find(x => /^Morreu, aos/.test(x.texto))!;
    h.texto = `Morreu, aos ${ao + 1} anos.`;
    const outra = v.biografia[v.biografia.length - 1];
    const antes = outra.texto;
    normalizarRework75(v);
    expect(h.texto).toBe(`Morreu, aos ${ao} anos.`);
    if (!(outra.evento?.pessoaId === p.id)) expect(outra.texto).toBe(antes);
  });
});

describe('luto: intensidade e duração proporcionais; a memória fica, o peso passa', () => {
  const lutoDe = (inicial: number, suporte = 0) => {
    const v = adulto(40, { semente: 70 });
    v.luto = [{ pessoaId: 'x', t: v.t, peso: inicial, inicial }];
    for (let k = 0; k < suporte; k++) { const a = amigaDe(v); v.vinculos[a.id].proximidade = 85; v.vinculos[a.id].convivio = ['trabalho']; }
    let anos = 0;
    while (v.luto.length && anos < 30) { v.t += 12; processarLuto(v); anos++; }
    return anos;
  };
  it('a perda de alguém importante mas não central (o avô) se acalma em poucos anos; a central leva muito mais', () => {
    const avo = lutoDe(44);
    const conjuge = lutoDe(84);
    expect(avo).toBeLessThanOrEqual(5);
    expect(conjuge).toBeGreaterThan(avo + 2);
    expect(lutoDe(20)).toBeLessThanOrEqual(3);
  });
  it('não há prazo único: gente por perto encurta', () => {
    expect(lutoDe(84, 4)).toBeLessThan(lutoDe(84, 0));
  });
  it('o estresse do luto é só do luto ATIVO; quando se acalma, fica como saudade no humor, dito como tal', () => {
    const v = adulto(40, { semente: 71 });
    const p = amigaDe(v);
    v.luto = [{ pessoaId: p.id, t: v.t - 36, peso: 20, inicial: 60 }];
    expect(faseDoLuto(v.luto[0])).toBe('recuperando');
    expect(leituraDoEstado(v, 'cabeca', 9).pesando.some(f => f.id === 'luto')).toBe(false);
    const h = leituraDoEstado(v, 'humor', 9).pesando.find(f => f.id === 'luto');
    expect(h?.texto).toMatch(/saudade de .+ que vai se acalmando/);
  });
  it('a repetência pesa no ano em que acontece — no ano seguinte, fica só na biografia', () => {
    const v = adulto(15, { semente: 72 });
    abalar(v, 'a repetência', -6, 3);
    expect(leituraDoEstado(v, 'humor', 9).pesando.some(f => f.texto === 'a repetência')).toBe(true);
    v.t += 12;
    expect(leituraDoEstado(v, 'humor', 9).pesando.some(f => f.texto === 'a repetência')).toBe(false);
  });
  it('outra perda grande reaviva o luto que ainda dói (sem passar do que ele já foi)', () => {
    const v = adulto(40, { semente: 73 });
    const a = amigaDe(v);
    v.luto = [{ pessoaId: a.id, t: v.t - 24, peso: 20, inicial: 60 }];
    const { p } = comParente(v, 'irmao', 42, 'masculino', 80);
    matar(v, p);
    const l = v.luto.find(x => x.pessoaId === a.id)!;
    expect(l.peso).toBeGreaterThan(20);
    expect(l.peso).toBeLessThanOrEqual(60);
    expect(l.reativado).toBe(v.t);
  });
});

describe('homenagens: gestos possíveis, no tempo e no lugar, sem prêmio de felicidade', () => {
  function comAvoMorto(idade = 30, longe = false) {
    const v = adulto(idade, { semente: 80 });
    const { p } = comParente(v, 'avo', 78, 'masculino', 75);
    lembrarCom(v, p.id, 'Ensinou você a pescar no açude.', 'amizade', 2, v.t - 120);
    if (longe) p.municipioId = capitalDoPais('PT')!.id;
    matar(v, p);
    return { v, p };
  }
  it('no ano da morte: ir à despedida; depois, não. Recordar usa um marco real; visitar de outro país, não', () => {
    const { v, p } = comAvoMorto();
    const ids = gestosDeMemoria(v, p.id).map(g => g.gesto);
    expect(ids).toContain('despedida');
    expect(ids).toContain('recordar');
    const r = executar(v, { tipo: 'memoria', pessoaId: p.id, gesto: 'recordar' });
    expect(r.resultado).toMatch(/Ensinou você a pescar no açude/);
    const depois = transacao(v, x => { x.t += 24; }).vida;
    expect(gestosDeMemoria(depois, p.id).map(g => g.gesto)).not.toContain('despedida');
    const { v: w, p: q } = comAvoMorto(30, true);
    expect(disponibilidadeGesto(w, q.id, 'visitar').grau).toBe('requisito');
  });
  it('a despedida entra na Linha da Vida ligada à morte, aproxima quem perdeu junto — e não muda a felicidade', () => {
    const { v, p } = comAvoMorto();
    const morte = v.biografia.find(e => e.evento?.pessoaId === p.id)!;
    const feliz = v.mente.felicidade;
    const r = executar(v, { tipo: 'memoria', pessoaId: p.id, gesto: 'despedida' });
    expect(r.vida.mente.felicidade).toBe(feliz);
    const e = r.vida.biografia[r.vida.biografia.length - 1];
    expect(e.segue).toBe(morte.id);
    expect(e.escolha).toBe(true);
    expect(gestosDeMemoria(r.vida, p.id).map(g => g.gesto)).not.toContain('despedida');
  });
  it('criança não vai sozinha à despedida de quem não é da família', () => {
    const v = adulto(9, { semente: 81 });
    const p = amigaDe(v);
    matar(v, p);
    expect(disponibilidadeGesto(v, p.id, 'despedida').grau).toBe('requisito');
  });
});

/* -------------------------------------------------------- 1. Consequência */

describe('a consequência conhecida (segue)', () => {
  it('a despedida decidida segue a morte: a entrada da escolha aponta para a da morte (e nada aponta para o vazio)', () => {
    const v = adulto(40, { semente: 90 });
    const { p } = comParceiro(v, { estagio: 'casamento', anos: 15 });
    matar(v, p);
    const morte = v.biografia.find(e => e.evento?.pessoaId === p.id)!;
    const d = conteudoPorId('luto_despedida')!;
    expect(d.tipo).toBe('decisao');
    const w = transacao(v, x => { if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, criarRng(1), { falecido: x.pessoas[p.id] })); }).vida;
    expect(w.momento?.segue).toBe(morte.id);
    const r = executar(w, { tipo: 'decidir', opcaoId: 'lembranca' });
    const e = r.vida.biografia.find(x => x.escolha && x.segue === morte.id);
    expect(e).toBeTruthy();
    for (const x of r.vida.biografia) if (x.segue) expect(r.vida.biografia.some(y => y.id === x.segue)).toBe(true);
  });
  it('a crise que chega em casa segue a notícia da crise na cidade, do mesmo ano', () => {
    const v = adulto(10, { semente: 91 });
    const w = transacao(v, x => {
      const cidade = escrever(x, { texto: 'A economia entrou em crise.', tema: 'dinheiro', relevancia: 'biografia', fato: { tipo: 'mundo', dados: { categoria: 'cidade', economia: 'crise' } } });
      const c = conteudoPorId('mun_recessao')!;
      if (c.tipo === 'acontecimento') aplicarAcontecimento(x, c, contexto(x, criarRng(2), {}));
      expect(x.biografia[x.biografia.length - 1].segue).toBe(cidade.id);
    });
    expect(w.vida.biografia.length).toBeGreaterThan(v.biografia.length);
  });
});

/* -------------------------------------------------------------- S. Saves */

describe('saves: os campos novos (opcionais na v20)', () => {
  it('ida e volta preserva segue, o luto com inicial e o marco com quem ajudou; valor estranho é recusado', () => {
    let v = adulto(30, { semente: 95 });
    const p = amigaDe(v);
    v = fazer(v, p.id, 'pedir_conselho').vida;
    v = transacao(v, x => { x.luto.push({ pessoaId: p.id, t: x.t, peso: 30, inicial: 40 }); }).vida;
    const r = interpretar(JSON.stringify(v));
    expect(r.tipo).toBe('ok');
    if (r.tipo === 'ok') {
      expect(r.vida.vinculos[p.id].historia.some(h => h.de === 'ela')).toBe(true);
      expect(r.vida.luto.some(l => l.inicial === 40)).toBe(true);
    }
    const ruim = JSON.parse(JSON.stringify(v));
    ruim.vinculos[p.id].historia[0].de = 'ninguem';
    expect(interpretar(JSON.stringify(ruim)).tipo).toBe('invalido');
  });
});

describe('a safra da região muda de um ano para o outro (o clima não é uma fila de anos iguais)', () => {
  it('em cem anos, cada estado tem safras ruins na proporção esperada e nunca uma sequência longa de anos iguais', async () => {
    const { safraDaRegiao } = await import('../sistemas/rural');
    for (const cidade of ['sinop-mt', 'curitiba-pr', 'recife-pe', 'porto-alegre-rs']) {
      let ruins = 0, maior = 0, run = 0, antes = '';
      for (let a = 2000; a < 2100; a++) { const s = safraDaRegiao(cidade, a); if (s === 'ruim') ruins++; run = s === antes ? run + 1 : 1; maior = Math.max(maior, run); antes = s; }
      expect(ruins, cidade).toBeGreaterThan(10);
      expect(ruins, cidade).toBeLessThan(36);
      expect(maior, cidade).toBeLessThanOrEqual(8);
    }
  });
});
