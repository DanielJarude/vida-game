/**
 * VIDA 12.7 — vidas inteiras em várias condições econômicas (pobre, média, rica, milionária, bilionária), países e
 * estratégias: travamentos, a invariante do guarda-roupa (uma peça por lugar), os acontecimentos de falta de dinheiro
 * por faixa econômica real e textos repetidos em sequência na biografia.
 *   npx esbuild scripts/sim/vida127.ts --bundle --platform=node --outfile=<scratch>/v127.cjs && N=6 node <scratch>/v127.cjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { cidadesDoPais } from '../../src/motor/dados/lugares';
import { criarRng } from '../../src/motor/rng';
import { condicaoEconomica } from '../../src/motor/sistemas/dinheiro';
import { itemEstilo, lugaresDoItem } from '../../src/motor/dados/estilo';
import type { Classe, Vida } from '../../src/motor/tipos';
import { agente } from './agentes';

const N = Number(process.env.N ?? 6);
const ATE = Number(process.env.ATE ?? 75);
const FORTUNA: Record<string, number> = { pobre: 0, media: 0, rica: 600_000, milionaria: 8_000_000, bilionaria: 2_000_000_000 };
const CLASSE: Record<string, Classe> = { pobre: 'vulneravel', media: 'media', rica: 'alta', milionaria: 'alta', bilionaria: 'alta' };
const PERFIS = ['social', 'estudioso', 'ambicioso', 'familiar', 'impulsivo'];
const PAISES = ['BR', 'BR', 'PT', 'US', 'AR', 'DE'];
const APERTO = new Set(['esc_faculdade_aperto', 'fac10_aperto', 'des10_aplicativo', 'mat_bico_aposentado', 'esc_largar']);
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
let anos = 0, travou = 0, vidas = 0, violGuarda = 0, repetidas = 0;
const travamentos: string[] = [];
const aperto: Record<string, Record<string, number>> = {};
const textoAperto: string[] = [];

function umPorLugar(v: Vida) { const s = new Set<string>(); for (const x of v.eu.estilo?.itens ?? []) if (x.usando) for (const l of lugaresDoItem(itemEstilo(x.itemId)!)) { if (s.has(l)) return false; s.add(l); } return true; }

async function main() {
  await carregarMundo();
  for (const nivel of Object.keys(FORTUNA).filter(x => !process.env.FAIXAS || process.env.FAIXAS.split(',').includes(x))) for (const perfil of PERFIS) for (let k = 0; k < N; k++) {
    const pais = PAISES[k % PAISES.length];
    const cids = pais === 'BR' ? ['recife-pe', 'sao-paulo-sp', 'porto-alegre-rs', 'manaus-am'] : cidadesDoPais(pais).slice(0, 4).map(c => c.id);
    const semente = 127000 + Object.keys(FORTUNA).indexOf(nivel) * 10000 + PERFIS.indexOf(perfil) * 100 + k;
    const tag = `${nivel}/${perfil}#${k} ${pais}`;
    const ag = agente(perfil), r = criarRng(semente);
    let v: Vida;
    try { v = criarVida({ nome: 'Sim', sobrenome: 'Doze', genero: k % 2 ? 'masculino' : 'feminino', municipioId: cids[k % cids.length], semente, classe: CLASSE[nivel] }); } catch (e) { travou++; travamentos.push(`${tag} criação ${(e as Error).message}`); continue; }
    vidas++;
    let deu = false;
    const resolver = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) {
      const id = v.momento.situacaoId;
      const falta = /dinheiro do mês|O mês acabou antes|não fecha o mês|falta dinheiro|não cobre/i.test(v.momento.texto);
      if (APERTO.has(id) && falta) { const f = condicaoEconomica(v).faixa; (aperto[id] ??= {})[f] = ((aperto[id] ??= {})[f] ?? 0) + 1; if (['rica', 'milionaria', 'bilionaria'].includes(f) && textoAperto.length < 10) textoAperto.push(`${tag} ${idade(v)}a ${id} ${f} iliquida=${condicaoEconomica(v).iliquida}`); }
      v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida;
    } };
    try {
      while (!v.morte && idade(v) < ATE) {
        if (!deu && idade(v) >= 18 && FORTUNA[nivel]) { v.financas.conta += FORTUNA[nivel]; deu = true; }
        for (const a of ag.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; resolver(); }
        v = avancarAno(v).vida; anos++;
        resolver();
        if (!umPorLugar(v)) violGuarda++;
      }
      const tx = v.biografia.map(e => e.texto);
      for (let i = 1; i < tx.length; i++) if (tx[i] === tx[i - 1] && tx[i].length > 30) repetidas++;
    } catch (e) { travou++; travamentos.push(`${tag} ${idade(v!)}a: ${(e as Error).stack?.split('\n').slice(0, 3).join(' | ')}`); }
  }
  console.log(`# VIDA 12.7 — ${vidas} vidas (${Object.keys(FORTUNA).length} faixas × ${PERFIS.length} estratégias × ${N}), ${anos} anos vividos`);
  console.log(`Travamentos: ${travou}`); for (const t of travamentos.slice(0, 8)) console.log('  -', t);
  console.log(`Guarda-roupa com duas peças no mesmo lugar (anos): ${violGuarda}`);
  console.log(`Entradas repetidas em sequência na biografia: ${repetidas}`);
  console.log('Cenas de FALTA DE DINHEIRO por faixa econômica real (no momento da cena):'); console.log(JSON.stringify(aperto, null, 1));
  for (const t of textoAperto) console.log('  rico com aperto:', t);
}
main();
