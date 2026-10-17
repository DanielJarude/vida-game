/**
 * Saves das jornadas do REWORK 7.5 (`rework75.mjs`), cada uma vivida pelo motor (ações de verdade, anos por
 * `avancarAno`), mais as do REWORK 6/7 (`gerarRework6.ts`, `gerarRework7.ts`) na mesma pasta:
 *   luto       a primeira vida (a partir dos 10 anos) em que um avô ou avó morre — parada no ano da morte
 *   luto-depois a mesma vida três anos depois (o luto que se acalma; a memória que fica)
 *   amiga      20 anos, uma amiga de anos: conversar, caminhar, passar o tempo, agradecer (a memória da relação)
 *   violao     16 anos, música há dois anos e um violão comprado e usado
 *   infancia   8 anos (a Linha da Vida de uma infância cheia de acontecimentos)
 *   npx esbuild scripts/playtest/gerarRework75.ts --bundle --platform=node --outfile=<scratch>/g75.cjs && OUT=<pasta> node <scratch>/g75.cjs
 */
import { writeFileSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { executar, type Acao } from '../../src/motor/acoes';
import { viverAte, nova, responderTudo } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import type { Vida } from '../../src/motor/tipos';
import { interacoesPara } from '../../src/motor/sistemas/interacoes';
import { idade } from '../../src/motor/nucleo';

const OUT = process.env.OUT ?? '/tmp';
const salvar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${OUT}/vida-r75-${nome}.json`, JSON.stringify(v)); console.log(nome, v.eu.nome, idade(v), JSON.stringify(v).length); };
const tentar = (v: Vida, a: Acao): Vida => { const r = executar(v, a); if (process.env.DEBUG) console.log(' ', JSON.stringify(a), '→', r.resultado ?? r.aviso?.texto ?? ''); return responderTudo(r.vida); };
const ano = (v: Vida) => responderTudo(avancarAno(v).vida);

async function principal() {
  await carregarMundo();

  // Um avô ou avó que morre quando o jogador já entende (10+): a primeira semente que dá isso.
  for (let semente = 300; semente < 400; semente++) {
    let v = viverAte(nova({ semente }), 10);
    let achou = false;
    for (let k = 0; k < 20 && !achou; k++) {
      const antes = new Set(Object.values(v.pessoas).filter(p => p.vivo).map(p => p.id));
      v = ano(v);
      const morto = Object.values(v.vinculos).find(x => x.parentesco === 'avo' && antes.has(x.pessoaId) && !v.pessoas[x.pessoaId].vivo);
      if (morto) achou = true;
    }
    if (!achou) continue;
    salvar('luto', v);
    let d = v;
    for (let k = 0; k < 3; k++) d = ano(d);
    salvar('luto-depois', d);
    break;
  }

  // Uma amiga de anos: os gestos do dia a dia, ano após ano (o histórico real que conversa, caminhada e agradecimento leem).
  let a = viverAte(nova({ semente: 7741, genero: 'feminino' }), 14);
  for (let k = 0; k < 6; k++) {
    const amiga = Object.values(a.vinculos).filter(x => x.estagio === 'amigo' || x.estagio === 'amigo_proximo').sort((x, y) => y.proximidade - x.proximidade)[0];
    if (amiga) for (const id of ['conversar', 'caminhar_junto', 'tempo', 'desabafar', 'agradecer']) if (interacoesPara(a, amiga.pessoaId).some(x => x.id === id)) a = tentar(a, { tipo: 'pessoa', pessoaId: amiga.pessoaId, interacao: id });
    a = ano(a);
  }
  salvar('amiga', a);

  let m = viverAte(nova({ semente: 5120, genero: 'masculino', municipioId: 'sao-paulo-sp' }), 13);
  m = tentar(m, { tipo: 'rotina', id: 'musica', ativa: true, nivel: 1 });
  m.financas.conta += 2500;
  m = tentar(m, { tipo: 'comprar_coisa', coisaId: 'violao' });
  m = ano(ano(m));
  const violao = m.financas.coisas?.find(c => c.coisaId === 'violao');
  if (violao) m = tentar(m, { tipo: 'usar_coisa', coisaTidaId: violao.id, uso: 'tocar' });
  salvar('violao', ano(m));

  salvar('infancia', viverAte(nova({ semente: 2024 }), 8));
}

principal();
