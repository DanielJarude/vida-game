/**
 * A pendência do REWORK 4 (`caminhos` "9 e 10"): quantos profissionais de futebol chegam pela BASE e quantos pela porta
 * AMADORA. Mesmo roteiro do teste (`vidaDeAtleta`: joga a sério desde cedo, aceita toda peneira, base e contrato), em N
 * vidas. Mede — não recalibra (a calibragem é da simulação de 1.000 vidas).
 *
 *   npx esbuild scripts/sim/futebolPortas.ts --bundle --platform=node --outfile=<scratch>/fp.cjs && VIDAS=120 node <scratch>/fp.cjs
 */
import { nova, responder } from '../../src/motor/__tests__/ajuda';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import type { Vida } from '../../src/motor/tipos';

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const praticar = (v: Vida): Acao[] => {
  if (idade(v) < 6) return [];
  const atual = v.rotinas.find(r => r.id === 'futebol');
  if (!atual) return tenta(v, { tipo: 'rotina', id: 'futebol', ativa: true, nivel: 1 }) ? [{ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 1 }] : [];
  if ((atual.nivel ?? 1) < 2 && tenta(v, { tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 })) return [{ tipo: 'rotina', id: 'futebol', ativa: true, nivel: 2 }];
  return [];
};
function vidaDeAtleta(semente: number): Vida {
  let v = nova({ semente, genero: semente % 2 ? 'masculino' : 'feminino' });
  for (let k = 0; k < 40 && !v.morte; k++) {
    for (const a of praticar(v)) v = executar(v, a).vida;
    for (const o of v.caminhos.oportunidades) {
      if (['peneira', 'convite'].includes(o.tipo) && tenta(v, { tipo: 'oportunidade', id: o.id, aceitar: true })) {
        v = executar(v, { tipo: 'oportunidade', id: o.id, aceitar: true }).vida;
        while (v.momento) v = responder(v, ['arriscar', 'ir', 'assinar'].find(x => v.momento!.opcoes.some(op => op.id === x && !op.bloqueio)));
      }
    }
    v = avancarAno(v).vida;
    while (v.momento) v = responder(v, ['ir', 'assinar', 'tentar'].find(x => v.momento!.opcoes.some(op => op.id === x && !op.bloqueio)));
  }
  return v;
}
async function principal() {
  await carregarMundo();
  const N = Number(process.env.VIDAS ?? 40);
  let tentaram = 0, profissionais = 0, pelaBase = 0;
  for (let s = 1; s <= N; s++) {
    const x = vidaDeAtleta(s * 7);
    if (x.morte && idade(x) < 18) continue;
    if (Object.keys(x.fatos).some(k => k.startsWith('peneiras_'))) tentaram++;
    if (x.fatos['atleta_profissional']) { profissionais++; if (![...(x.caminhos.carreirasEsportivas ?? []), x.caminhos.esporte].some(c => c?.origem === 'amador')) pelaBase++; }
  }
  console.log(`${N} vidas: tentaram ${tentaram}, profissionais ${profissionais} — pela base ${pelaBase} × pela porta amadora ${profissionais - pelaBase}`);
}
void principal();
