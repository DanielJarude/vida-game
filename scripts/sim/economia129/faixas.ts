/** Sim 12.9 · as faixas: seis pessoas (pobre → bilionária) vivendo 25 anos de verdade (avancarAno), respondendo à 1ª opção livre. */
import { carregarMundo } from '../../r129/src/motor/mundo/carregar';
import { adulto } from '../../r129/src/motor/__tests__/cenarios';
import { viver } from '../../r129/src/motor/__tests__/ajuda';
import { executar } from '../../r129/src/motor/acoes';
import { indicadores, escala } from '../../r129/src/motor/sistemas/fortuna129';
import { balanco } from '../../r129/src/motor/sistemas/dinheiro';
import { conciliar } from '../../r129/src/motor/sistemas/extrato';
import type { Vida } from '../../r129/src/motor/tipos';
await carregarMundo();
const M = (x: number) => `${(x / 1e6).toFixed(1)}M`;
const PERSONAS: [string, number][] = [['pobre', 0], ['media', 30_000], ['alta', 600_000], ['milionaria', 5e6], ['multi', 200e6], ['bilionaria', 8e9]];
const resumo: string[] = [];
for (const [nome, conta] of PERSONAS) {
  for (const semente of [41, 77]) {
    let v: Vida = adulto(35, { municipioId: 'sao-paulo-sp', semente });
    v.financas.conta = conta; v.financas.dividas = []; v.financas.negativado = false;
    if (nome === 'bilionaria') {
      // Uma parte em empresa grande: funda uma indústria e compra uma participação.
      v = executar(v, { tipo: 'fundar129', setor: 'industria', item: 'higiene', comSocio: false }).vida;
    }
    const e0 = escala(v);
    const eventos: Record<string, number> = {};
    let ajustes = 0, minLiq = Infinity, maxLiq = -Infinity;
    for (let a = 0; a < 25 && !v.morte; a++) {
      const n = v.ocorrencias.length;
      v = viver(v, 1);
      for (const o of v.ocorrencias.slice(n)) if (o.id.startsWith('eco129_')) eventos[o.id] = (eventos[o.id] ?? 0) + 1;
      const x = indicadores(v);
      if (x.liquido !== x.bruto - x.dividas) throw new Error('indicadores inconsistentes');
      if (v.financas.extrato && !conciliar(v.financas.extrato, 5).ok) ajustes++;
      minLiq = Math.min(minLiq, x.liquido); maxLiq = Math.max(maxLiq, x.liquido);
    }
    const x = indicadores(v);
    resumo.push(`${nome}/${semente}: ${e0} → ${escala(v)} | líquido ${M(balanco(v).liquido)} (min ${M(minLiq)} máx ${M(maxLiq)}) | liquidez ${M(x.liquidez)} | renda ${M(x.rendaAno)}/ano | dívidas ${M(x.dividas)} | extratos com ajuste: ${ajustes} | cenas: ${Object.entries(eventos).map(([k, n]) => `${k.replace('eco129_', '')}×${n}`).join(' ') || '—'} | empresas: ${(v.financas.empresas ?? []).map(e => `${e.nome} ${e.estado} val ${M(e.avaliacao ?? 0)}`).join('; ') || '—'}`);
  }
}
console.log(resumo.join('\n'));
