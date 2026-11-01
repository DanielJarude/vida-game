// AUDITORIA 12.5 · CAR-11.8 — os colegas de trabalho de uma médica: têm ocupacaoId? que proximidade?
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { vinculosVivos } from '../../src/motor/nucleo';
import { adulto } from '../../src/motor/__tests__/cenarios';
await carregarMundo();
for (const [ocId, lic] of [['medico', 'crm'], ['eng_jr', 'crea'], ['dev_jr', '']]) {
  let v = adulto(30, { semente: 4242 });
  v.trabalho.atual = undefined; if (lic) v.trabalho.licencas.push(lic);
  contratar(v, criarRng(1), ocupacao(ocId));
  for (let a = 0; a < 6 && !v.morte; a++) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)?.id ?? v.momento!.opcoes[0].id }).vida; }
  const col = vinculosVivos(v).filter(x => x.vin.origem === 'trabalho');
  console.log(`\n${ocId}: atual=${v.trabalho.atual?.ocupacaoId}; ${col.length} vínculos de trabalho; com ocupacaoId ${col.filter(x => x.p.ocupacaoId).length}; prox>=40 ${col.filter(x => x.vin.proximidade >= 40).length}`);
  for (const x of col.slice(0, 8)) console.log(`  ${x.p.nome}: ocupacao="${x.p.ocupacao}" ocupacaoId=${x.p.ocupacaoId} prox=${x.vin.proximidade} renda=${x.p.renda}`);
}
