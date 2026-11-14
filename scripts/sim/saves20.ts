// VIDA 20 — saves antigos (de saves19, mesma checagem): abrir, avançar ANOS anos, salvar, reabrir — nada perdido; reabertura idempotente. ARQS=<lista>
// sociais, mensagens, fazendas, apostas; a reabertura é idempotente. ARQS=<lista de .json separada por vírgula>
import { readFileSync } from 'node:fs';
import { interpretar } from '../../src/motor/save';
import { avancarAno } from '../../src/motor/ano';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import type { Vida } from '../../src/motor/tipos';
await carregarMundo();
const ANOS = Number(process.env.ANOS ?? 3);
let falhas = 0;
const conta = (v: Vida) => ({
  vinculos: Object.keys(v.vinculos).length, bens: v.financas.bens.length, empresas: (v.financas.empresas ?? []).length,
  contas: Object.keys(v.redes?.contas ?? {}).length, arquivo: (v.celular15?.arquivo16?.length ?? 0) + (v.celular15?.msgs.length ?? 0),
  rurais: v.financas.bens.filter(b => b.tipo === 'imovel' && (b as { rural?: unknown }).rural).length, bilhetes: v.apostas18?.bilhetes.length ?? 0,
  biografia: v.biografia.length
});
for (const arq of (process.env.ARQS ?? '').split(',').filter(Boolean)) {
  const bruto = readFileSync(arq, 'utf8');
  const l = interpretar(bruto);
  if (l.tipo !== 'ok') { console.log('FALHA abrir', arq, l.tipo); falhas++; continue; }
  let x = l.vida;
  const antes = conta(x);
  const idem = JSON.stringify((interpretar(JSON.stringify(x)) as { vida: Vida }).vida) === JSON.stringify(x);
  try {
    for (let a = 0; a < ANOS && !x.morte; a++) { x.momento = null; (x as { fila?: unknown }).fila = undefined; x = avancarAno(x).vida; }
  } catch (e) { console.log('FALHA ano', arq.split('/').pop(), String((e as Error).stack).slice(0, 400)); falhas++; continue; }
  const salvo = JSON.stringify(x);
  const l2 = interpretar(salvo);
  if (l2.tipo !== 'ok') { console.log('FALHA reabrir', arq); falhas++; continue; }
  const depois = conta(l2.vida);
  const reaberto = JSON.stringify(l2.vida.financas.bens.map(y => y.id)) === JSON.stringify(x.financas.bens.map(y => y.id)) && Object.keys(l2.vida.pessoas).length === Object.keys(x.pessoas).length;
  // Nada some sem motivo: as contas sociais, os bens rurais e o histórico de mensagens não diminuem; a biografia só cresce.
  const perdeu = (['contas', 'rurais', 'biografia'] as const).filter(k => depois[k] < antes[k]);
  const npc = Object.values(l2.vida.pessoas).filter(p => p.npc19).length;
  const ok = idem && reaberto && !perdeu.length && Number.isFinite(l2.vida.financas.conta);
  if (!ok) falhas++;
  console.log(ok ? 'OK   ' : 'FALHA', arq.split('/').pop(), `idem=${idem} reaberto=${reaberto} perdeu=[${perdeu}] ${JSON.stringify(antes)} → ${JSON.stringify(depois)} npc19=${npc} kb ${Math.round(bruto.length / 1024)}→${Math.round(salvo.length / 1024)}`);
}
console.log('falhas', falhas);
