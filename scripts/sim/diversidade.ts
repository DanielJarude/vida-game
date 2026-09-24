/**
 * Diversidade FUNCIONAL: tirando o nome e o salário, duas ocupações ainda
 * parecem diferentes?
 *
 *   npx esbuild scripts/sim/diversidade.ts --bundle --platform=node --outfile=/tmp/div.cjs && node /tmp/div.cjs
 *
 * A assinatura de uma ocupação é o que muda a VIDA de quem a exerce: família
 * de carreira (entrada, progressão, renda, desgaste, sentido, saídas), como
 * se entra de fato (currículo, concurso, oportunidade, negócio, por conta),
 * vínculo, jornada, o tipo de requisito, risco, época, lugar, prazo.
 * Ocupações com a mesma assinatura são agrupadas: dentro de uma família
 * isso é esperado (são degraus da mesma vida); entre famílias diferentes,
 * seria um sinal de reskin.
 */
import { OCUPACOES, type Ocupacao } from '../../src/motor/dados/ocupacoes';
import { familiaDaTrilha, FAMILIAS } from '../../src/motor/dados/carreiras';
import { porContaPropria } from '../../src/motor/sistemas/trabalho';

const entrada = (o: Ocupacao) => o.concurso ? (o.formacaoInicial ? 'concurso+formação' : o.duracao ? 'seleção com prazo' : 'concurso') : o.entrada === 'negocio' ? 'negócio' : o.entrada === 'oportunidade' ? 'oportunidade' : porContaPropria(o) ? 'por conta' : o.contrato === 'estagio' || o.contrato === 'aprendiz' ? 'estudo' : 'entrevista';
const requisito = (o: Ocupacao) => [o.licenca && o.licenca !== 'cnh' ? 'registro' : '', o.nivelCurso ?? '', o.habilidade ? (o.habilidade.ouFormacao ? 'ofício-ou-diploma' : 'ofício') : '', o.escolaridade ?? '', o.experiencia ? (o.experiencia >= 60 ? 'muita estrada' : 'estrada') : '', o.forma ? 'teste físico' : '', o.idoneidade ? 'ficha limpa' : '', o.veiculo ? 'veículo' : ''].filter(Boolean).join('+') || 'nenhum';
const assinatura = (o: Ocupacao) => {
  const f = familiaDaTrilha(o.trilha);
  return [f.progressao, f.renda, entrada(o), o.contrato, o.promocao ?? 'merito', o.jornada ?? 'normal', o.carga, requisito(o), o.risco ? 'risco' : '', o.declinio ? 'encolhe' : o.surge ? 'surge' : '', o.lugar ?? '', o.duracao ? 'prazo' : ''].join('|');
};

const grupos = new Map<string, Ocupacao[]>();
for (const o of OCUPACOES) grupos.set(assinatura(o), [...(grupos.get(assinatura(o)) ?? []), o]);
const repetidos = [...grupos.values()].filter(g => g.length > 1).sort((a, b) => b.length - a.length);
const entreFamilias = repetidos.filter(g => new Set(g.map(o => familiaDaTrilha(o.trilha).id)).size > 1);
console.log(`# Diversidade funcional — ${OCUPACOES.length} ocupações, ${FAMILIAS.length} famílias de carreira`);
console.log(`- assinaturas distintas: ${grupos.size} (${Math.round(100 * grupos.size / OCUPACOES.length)}% das ocupações têm um jeito de viver só delas)`);
console.log(`- grupos com a mesma assinatura: ${repetidos.length}, dos quais ${entreFamilias.length} atravessam famílias`);
for (const g of repetidos) console.log(`  · ${g.map(o => o.id).join(', ')} — ${assinatura(g[0]).split('|').filter(Boolean).join(' · ')}${new Set(g.map(o => familiaDaTrilha(o.trilha).id)).size > 1 ? '  ← ENTRE FAMÍLIAS' : ''}`);
console.log('');
console.log('## Famílias: o que as distingue');
for (const f of FAMILIAS) {
  const ocs = OCUPACOES.filter(o => f.trilhas.includes(o.trilha));
  const entradas = [...new Set(ocs.map(entrada))];
  const contratos = [...new Set(ocs.map(o => o.contrato))];
  console.log(`- ${f.id} (${ocs.length} ocupações): progressão ${f.progressao} · renda ${f.renda} · entra por ${entradas.join('/')} · vínculos ${contratos.join('/')} · desgaste ${Object.entries(f.desgaste).map(([k, x]) => `${k} ${x}`).join(', ') || '—'} · sentido ${(f.sentido ?? []).join('/') || '—'} · ${f.automacao ? `automação ${f.automacao.desde}–${f.automacao.ate}` : f.expansao ? `expansão desde ${f.expansao.desde}` : 'estável na época'}`);
}
