// VIDA 28 — vidas de atleta até os 32: coerência da História, identidade do clube (teste → convite → vínculo), perfis,
// bônus, bolsa da base, elenco e mercado.
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { entrarNaVida } from '../../src/motor/mundo/vida';
import { estrategia } from './estrategias';
import { writeFileSync } from 'node:fs';

await carregarMundo();
const N = Number(process.env.VIDAS ?? 40), ATE = Number(process.env.ATE ?? 32);
const CIDADES = ['marilia-sp', 'sao-paulo-sp', 'rio-de-janeiro-rj', 'belo-horizonte-mg', 'porto-alegre-rs', 'recife-pe'];
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const out: string[] = [];
const c = { vidas: 0, dispensaDepoisVinculo: 0, dispensaPromoMesmoAno: 0, conviteOutroClube: 0, voltaSemExplicar: 0, pros: 0, perfis: {} as Record<string, number>, bonus: 0, bolsa: 0, movimentos: {} as Record<string, number>, dupla: 0, crash: 0 };
for (let s = 1; s <= N; s++) {
  try {
    const r = criarRng(s * 7919);
    let v = criarVida({ nome: 'Teo', sobrenome: 'Teste', genero: s % 3 ? 'masculino' : 'feminino', semente: 28000 + s * 13, municipioId: CIDADES[s % CIDADES.length], ano: 2026 } as never);
    entrarNaVida(v);
    const e = estrategia('esportista');
    const responder = () => { for (let k = 0; k < 12 && v.momento && !v.morte; k++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento!, r) }).vida; };
    let conviteClube: string | undefined;
    while (!v.morte && idade(v) < ATE) {
      for (const a of e.agir(v, r)) { if (!tenta(v, a)) continue; v = executar(v, a).vida; responder(); }
      if (v.caminhos.conviteBase) conviteClube = v.caminhos.conviteBase.clube;
      const antes = v.caminhos.esporte?.fase;
      v = avancarAno(v).vida; responder(); entrarNaVida(v);
      if (conviteClube && antes !== 'base' && v.caminhos.esporte?.fase === 'base' && v.caminhos.esporte.clube !== conviteClube) { c.conviteOutroClube++; out.push(`#${s} convite ${conviteClube} → vínculo ${v.caminhos.esporte.clube}`); }
      if (v.caminhos.esporte?.fase === 'base') conviteClube = undefined;
    }
    c.vidas++;
    const bio = v.biografia.filter(b => b.relevancia !== 'tecnico');
    // dispensa e promoção (sub-x, elenco profissional) no MESMO ano pelo MESMO clube
    for (const d of bio.filter(b => /^Dispensad[oa] d[ae] (base|equipe) d[oa] (.*), aos/.test(b.texto))) {
      const clube = /d[oa] (.*), aos/.exec(d.texto)![1];
      if (bio.some(b => b.idade === d.idade && b !== d && /subiu para o sub-|treinar com o elenco profissional/i.test(b.texto) && b.texto.includes(clube))) { c.dispensaPromoMesmoAno++; out.push(`#${s} MESMO ANO ${d.idade}: ${d.texto}`); }
      const depois = bio.filter(b => b.t > d.t && b.texto.includes(clube) && /Entrou para|Subiu para|subiu para o|elenco profissional/.test(b.texto));
      if (depois.length && !depois.some(b => /Voltou para|nova chance|Depois da dispensa/.test(b.texto))) { c.voltaSemExplicar++; out.push(`#${s} VOLTA SEM EXPLICAR: ${d.texto} → ${depois[0].texto}`); }
    }
    const conc = new Map<number, number>();
    for (const b of bio) if (/^Concluiu o ensino médio|^Terminou o médio integrado/.test(b.texto)) conc.set(b.idade, (conc.get(b.idade) ?? 0) + 1);
    for (const [, n] of conc) if (n > 1) c.dupla++;
    const es = v.caminhos.esporte;
    const todas = [...(v.caminhos.carreirasEsportivas ?? []), ...(es ? [es] : [])];
    if (todas.some(x => x.temporadas?.length)) c.pros++;
    for (const x of todas) {
      if (x.perfil28?.principal) c.perfis[x.perfil28.principal] = (c.perfis[x.perfil28.principal] ?? 0) + 1;
      for (const m of x.elenco28?.movimentos ?? []) c.movimentos[m.tipo] = (c.movimentos[m.tipo] ?? 0) + 1;
      c.bonus += (x.temporadas ?? []).filter(t => t.bonus).length;
      c.bolsa += (x.formacao ?? []).filter(a => a.bolsa).length;
    }
    if (s <= 3 && es?.elenco28) out.push(`#${s} elenco ${es.elenco28.clube}: ${es.elenco28.movimentos.slice(-4).map(m => m.texto).join(' | ')}`);
  } catch (err) { c.crash++; out.push(`#${s} CRASH ${(err as Error).stack?.split('\n').slice(0, 3).join(' ')}`); }
}
out.unshift(JSON.stringify(c));
writeFileSync(process.env.OUT ?? 'carreira.txt', out.join('\n'));
console.log(out.slice(0, 40).join('\n'));
