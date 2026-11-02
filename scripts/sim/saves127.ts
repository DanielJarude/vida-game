/** VIDA 12.7 — os saves antigos abrem, normalizam uma vez só, mantêm o que tinham (peças, tatuagens, coisas, acabamentos) e vivem mais 3 anos. PASTAS=a,b,c */
import { readFileSync, readdirSync } from 'node:fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { interpretar } from '../../src/motor/save';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { conciliar } from '../../src/motor/sistemas/extrato';
import { itemEstilo, lugaresDoItem } from '../../src/motor/dados/estilo';
import type { Vida } from '../../src/motor/tipos';
await carregarMundo();
const pastas = (process.env.PASTAS ?? '').split(',').filter(Boolean);
let ok = 0, falhas = 0, arquivos = 0, comPecas = 0, consertados = 0;
const umPorLugar = (v: Vida) => { const s = new Set<string>(); for (const x of v.eu.estilo?.itens ?? []) if (x.usando) for (const l of lugaresDoItem(itemEstilo(x.itemId)!)) { if (s.has(l)) return false; s.add(l); } return true; };
for (const p of pastas) for (const f of readdirSync(p).filter(x => x.endsWith('.json'))) {
  arquivos++;
  try {
    const bruto = readFileSync(`${p}/${f}`, 'utf8');
    const antes = JSON.parse(bruto)?.vida ?? JSON.parse(bruto);
    const r = interpretar(bruto);
    if (r.tipo !== 'ok') { console.log('NÃO ABRIU', f, r.tipo); falhas++; continue; }
    const v0 = r.vida;
    const nItens = (antes.eu?.estilo?.itens ?? []).length, nTat = (antes.eu?.tatuagens ?? []).length, nCoisas = (antes.financas?.coisas ?? []).length;
    const mantem = (v0.eu.estilo?.itens ?? []).length === nItens && (v0.eu.tatuagens ?? []).length === nTat && (v0.financas.coisas ?? []).length === nCoisas;
    if (nItens) comPecas++;
    const dup = (antes.eu?.estilo?.itens ?? []).filter((x: { usando: boolean }) => x.usando).length;
    if (dup && !umPorLugar(antes as Vida)) consertados++;
    const uma = JSON.stringify(v0); const r2 = interpretar(uma);
    const idem = r2.tipo === 'ok' && JSON.stringify(r2.vida) === uma;
    let v = v0; let conc = true;
    for (let a = 0; a < 3 && !v.morte; a++) { v = avancarAno(v).vida; for (let k = 0; k < 12 && v.momento; k++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)?.id ?? v.momento.opcoes[0].id }).vida; if (v.financas.extrato && !conciliar(v.financas.extrato).ok) conc = false; }
    const bom = idem && conc && mantem && umPorLugar(v0) && Number.isFinite(v.financas.conta);
    console.log(bom ? 'ok ' : 'ERRO', f, { idem, conc, mantem, umPorLugar: umPorLugar(v0), itens: nItens, tatuagens: nTat, coisas: nCoisas });
    if (bom) ok++; else falhas++;
  } catch (e) { console.log('EXCEÇÃO', f, (e as Error).message); falhas++; }
}
console.log({ arquivos, ok, falhas, comPecas, consertados });
