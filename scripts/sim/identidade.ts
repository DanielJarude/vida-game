/**
 * Identidade familiar em 5 gerações (REWORK 4, Parte 4): "os personagens parecem e são nomeados como membros de uma
 * história familiar, ou como sorteios independentes?"
 *
 *   npx esbuild scripts/sim/identidade.ts --bundle --platform=node --outfile=<scratch>/id.cjs && node <scratch>/id.cjs
 *
 * Monta linhagens com as funções do motor (criarVida → os pais e os avós da 1ª geração; depois, a cada geração, uma
 * parceria — às vezes de outro país, depois de uma migração —, os filhos pelo mesmo caminho do jogo (`visualHerdado`
 * + `familia`), às vezes uma adoção) e mede a concordância de traços entre pai/mãe e filho, irmãos, avô e neto — contra
 * pares de desconhecidos do mesmo lugar. E o sobrenome e a tradição de nomes ao longo das gerações.
 */
import { criarVida } from '../../src/motor/criacao';
import { criarPessoa } from '../../src/motor/pessoas';
import { visualHerdado } from '../../src/motor/pessoas';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { ancestralidadeDe, misturar, tradicaoDoFilho } from '../../src/motor/sistemas/identidade';
import { sobrenomeDeQuemNasce } from '../../src/motor/dados/nomes';
import { paisDaCidade } from '../../src/motor/dados/lugares';
import type { Pessoa, Vida, Visual } from '../../src/motor/tipos';

const PELES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const TRACOS: (keyof Visual)[] = ['corCabelo', 'olhos', 'textura', 'olhosForma', 'nariz', 'boca', 'rosto', 'sobrancelha'];
/** Concordância de traços (0..1): a pele conta se a diferença é de no máximo um tom. */
export function concordancia(a?: Visual, b?: Visual): number {
  if (!a || !b) return 0;
  let n = Math.abs(PELES.indexOf(a.pele) - PELES.indexOf(b.pele)) <= 1 ? 1 : 0;
  for (const t of TRACOS) if (a[t] && a[t] === b[t]) n++;
  return n / (TRACOS.length + 1);
}

type No = { p: Pessoa; geracao: number; pais: No[]; adotado?: boolean };

function filho(v: Vida, s: number, pai: No, mae: No, cidade: string): No {
  const r = criarRng(s);
  const g = r.chance(0.5) ? 'masculino' : 'feminino';
  const anc = misturar(ancestralidadeDe(pai.p), ancestralidadeDe(mae.p));
  const pais = paisDaCidade(cidade);
  const sob = sobrenomeDeQuemNasce(pais, pai.p.sobrenome, mae.p.sobrenome, `${pai.p.id}:${mae.p.id}`) ?? pai.p.sobrenome;
  const p = criarPessoa(v, r, { genero: g, idade: 0, municipioId: cidade, sobrenome: sob, visual: visualHerdado(r, g, pai.p.visual, mae.p.visual, anc), familia: { ancestralidade: anc, tradicao: tradicaoDoFilho(pai.p.tradicao, mae.p.tradicao, pai.geracao >= 3 ? 3 : 1) } });
  return { p, geracao: pai.geracao + 1, pais: [pai, mae] };
}

export function linhagem(semente: number) {
  const v = criarVida({ nome: 'Yuki', sobrenome: 'Tanaka', genero: 'feminino', municipioId: 'sao-paulo-sp', semente });
  const eu: Pessoa = { ...(v.pessoas[Object.keys(v.pessoas)[0]] as Pessoa), id: 'eu', nome: v.eu.nome, sobrenome: v.eu.sobrenome, visual: v.eu.visual, ancestralidade: v.eu.ancestralidade, tradicao: v.eu.tradicao, genero: 'feminino' };
  const maeP = Object.values(v.pessoas).find(p => v.vinculos[p.id]?.parentesco === 'mae')!;
  const paiP = Object.values(v.pessoas).find(p => v.vinculos[p.id]?.parentesco === 'pai');
  const g1: No = { p: eu, geracao: 1, pais: [{ p: maeP, geracao: 0, pais: [] }, ...(paiP ? [{ p: paiP, geracao: 0, pais: [] }] : [])] };
  const linha: No[] = [g1];
  const irmaos: [No, No][] = [];
  const cidades = ['sao-paulo-sp', 'pt:lisboa', 'pt:lisboa', 'gb:londres', 'gb:londres'];
  let atual = g1;
  for (let ger = 2; ger <= 5; ger++) {
    const cidade = cidades[ger - 1];
    // A parceria: do lugar onde a geração mora (depois da migração, do país novo: o casamento internacional).
    const par: No = { p: criarPessoa(v, criarRng(semente * 31 + ger), { genero: atual.p.genero === 'feminino' ? 'masculino' : 'feminino', idade: 28, municipioId: cidade }), geracao: ger - 1, pais: [] };
    const [pai, mae] = atual.p.genero === 'feminino' ? [par, atual] : [atual, par];
    const a = filho(v, semente * 101 + ger, pai, mae, cidade);
    const b = filho(v, semente * 103 + ger, pai, mae, cidade);
    irmaos.push([a, b]);
    // Na 4ª geração, uma adoção: a família, sim; a genética, não.
    if (ger === 4) {
      const adot = criarPessoa(v, criarRng(semente * 7 + 4), { idade: 3, municipioId: cidade, sobrenome: a.p.sobrenome });
      linha.push({ p: adot, geracao: ger, pais: [pai, mae], adotado: true });
    }
    linha.push(a);
    atual = a;
  }
  return { v, linha, irmaos };
}

async function principal() {
  await carregarMundo();
  const N = Number(process.env.FAMILIAS ?? 20);
  const soma = { paiFilho: 0, irmaos: 0, avoNeto: 0, adotado: 0, estranhos: 0 };
  const n = { paiFilho: 0, irmaos: 0, avoNeto: 0, adotado: 0, estranhos: 0 };
  const exemplos: string[] = [];
  for (let s = 1; s <= N; s++) {
    const { v, linha, irmaos } = linhagem(1000 + s);
    for (const x of linha) {
      for (const p of x.pais) { const c = concordancia(x.p.visual, p.p.visual); if (x.adotado) { soma.adotado += c; n.adotado++; } else { soma.paiFilho += c; n.paiFilho++; } }
      if (!x.adotado) for (const p of x.pais) for (const avo of p.pais) { soma.avoNeto += concordancia(x.p.visual, avo.p.visual); n.avoNeto++; }
    }
    for (const [a, b] of irmaos) { soma.irmaos += concordancia(a.p.visual, b.p.visual); n.irmaos++; }
    const estranhos = Object.values(v.pessoas).filter(p => !p.especie && p.visual);
    for (let k = 0; k + 1 < estranhos.length && k < 30; k += 2) { soma.estranhos += concordancia(estranhos[k].visual, estranhos[estranhos.length - 1 - k].visual); n.estranhos++; }
    if (s <= 3) exemplos.push(linha.map(x => `G${x.geracao}${x.adotado ? ' (adotad.)' : ''}: ${x.p.nome} ${x.p.sobrenome} · tradição ${x.p.tradicao ?? '—'} · ${x.p.visual?.pele} ${x.p.visual?.textura} ${x.p.visual?.olhos}`).join('\n'));
  }
  const m = (k: keyof typeof soma) => (n[k] ? (soma[k] / n[k] * 100).toFixed(1) + '%' : '—');
  console.log(`# Identidade familiar — ${N} linhagens de 5 gerações\n\n| Par | Traços em comum |\n| --- | --- |\n| pai/mãe → filho | ${m('paiFilho')} |\n| irmãos | ${m('irmaos')} |\n| avô/avó → neto | ${m('avoNeto')} |\n| pais adotivos → filho adotado | ${m('adotado')} |\n| desconhecidos do mesmo lugar | ${m('estranhos')} |\n\n## Exemplos\n\n${exemplos.map(e => '```\n' + e + '\n```').join('\n\n')}`);
}
if (require.main === module) void principal();
