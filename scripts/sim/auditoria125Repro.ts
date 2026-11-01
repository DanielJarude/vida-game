/**
 * VIDA 12.5 · auditoria de sistemas — reproduções pontuais dos achados (uma semente, passos fixos).
 *   npx esbuild scripts/sim/auditoria125Repro.ts --bundle --platform=node --format=esm --outfile=<scratch>/r.mjs && node <scratch>/r.mjs
 */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { receberCoisa } from '../../src/motor/sistemas/coisas';
import type { Vida } from '../../src/motor/tipos';

await carregarMundo();

// R1 — vender uma coisa emprestada a outra pessoa
{
  let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Repro', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 125901, classe: 'media' });
  while (idade(v) < 22) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)!.id }).vida; }
  v = structuredClone(v); v.financas.conta += 20000;
  const t = receberCoisa(v, 'violao', 900);
  const amigo = Object.values(v.vinculos).find(x => { const p = v.pessoas[x.pessoaId]; return p?.vivo && !p.especie && (p.municipioId === v.moradia.municipioId || x.convivio.includes('casa')); });
  console.log('R1 amigo:', amigo && v.pessoas[amigo.pessoaId].nome);
  const emp = { tipo: 'personalizar' as const, op: { o: 'emprestar', coisa: t.id, pessoaId: amigo!.pessoaId } as never };
  console.log('R1 emprestar:', disponibilidade(v, emp).grau);
  v = executar(v, emp).vida;
  const t2 = v.financas.coisas!.find(x => x.id === t.id)!;
  console.log('R1 emprestadaA =', t2.emprestadaA);
  const c0 = v.financas.conta;
  const d = disponibilidade(v, { tipo: 'vender_coisa', coisaTidaId: t.id });
  console.log('R1 vender_coisa emprestada:', d.grau, d.motivo ?? '');
  v = executar(v, { tipo: 'vender_coisa', coisaTidaId: t.id }).vida;
  console.log('R1 depois: coisa existe?', v.financas.coisas!.some(x => x.id === t.id), 'conta +', v.financas.conta - c0);
}

// R2 — doar a uma pessoa uma coisa que está emprestada a outra
{
  let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Repro', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 125901, classe: 'media' });
  while (idade(v) < 22) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)!.id }).vida; }
  v = structuredClone(v);
  const t = receberCoisa(v, 'violao', 900);
  const perto = Object.values(v.vinculos).filter(x => { const p = v.pessoas[x.pessoaId]; return p?.vivo && !p.especie && (p.municipioId === v.moradia.municipioId || x.convivio.includes('casa')); });
  const [a, b] = perto;
  v = executar(v, { tipo: 'personalizar', op: { o: 'emprestar', coisa: t.id, pessoaId: a.pessoaId } as never }).vida;
  const doar = { tipo: 'personalizar' as const, op: { o: 'doar', ref: { tipo: 'coisa', id: t.id }, pessoaId: b.pessoaId } as never };
  const d = disponibilidade(v, doar);
  console.log(`R2 emprestada a ${v.pessoas[a.pessoaId].nome}; doar a ${v.pessoas[b.pessoaId].nome}:`, d.grau, d.motivo ?? '');
  const r = executar(v, doar);
  console.log('R2 resultado:', JSON.stringify(r.resultado ?? '').slice(0, 160));
}
