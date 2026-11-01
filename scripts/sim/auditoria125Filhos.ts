/** VIDA 12.5 · auditoria de sistemas — filhos em casa (papel filhoEmCasa) numa vida "familiar". */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { idade, idadePessoa } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarRng } from '../../src/motor/rng';
import * as P from '../../src/motor/conteudo/papeis';
import type { Vida } from '../../src/motor/tipos';
import { agente } from './agentes';
await carregarMundo();
const s = Number(process.env.SEM ?? 126000);
const ag = agente('familiar'); const r = criarRng(s);
let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'F', genero: 'feminino', municipioId: 'recife-pe', semente: s, classe: 'trabalhadora' });
const dec = () => { for (let j = 0; j < 12 && v.momento && !v.morte; j++) v = executar(v, { tipo: 'decidir', opcaoId: ag.decidir(v, v.momento!, r) }).vida; };
while (!v.morte && idade(v) < 70) {
  for (const a of ag.agir(v, r)) { if (!podeTentar(disponibilidade(v, a))) continue; v = executar(v, a).vida; dec(); }
  if (process.env.FORCAR) { v = structuredClone(v); for (const x of Object.values(v.vinculos)) if (x.romance && ['casamento','morando_junto'].includes(x.romance.estagio) && !x.romance.fim && Object.values(v.pessoas).filter(p => p.genitores?.includes('eu')).length < 3) x.romance.planoFilhos = 'tentando'; }
  v = avancarAno(v).vida; dec();
  const fs = Object.values(v.vinculos).filter(x => x.parentesco === 'filho').map(x => `${v.pessoas[x.pessoaId].nome}:${idadePessoa(v, v.pessoas[x.pessoaId])}a[${x.convivio.join(',')}]${v.pessoas[x.pessoaId].vivo ? '' : '†'}`);
  if (fs.length) console.log(`${idade(v)}a moradia=${v.moradia.tipo} filhos ${fs.join(' ')} | filhoEmCasa(8,16)=${P.filhoEmCasa(8, 16)(v).length} (13,17)=${P.filhoEmCasa(13, 17)(v).length} | parceiro=${P.parceiro(v).length} tensao=${P.parceiro(v).map(p => v.vinculos[p.id].tensao).join(',')} estresse=${v.mente.estresse}`);
}
const meus = Object.values(v.pessoas).filter(p => p.genitores?.includes('eu'));
console.log(`FIM ${idade(v)}a: pessoas com genitor 'eu' = ${meus.length}; vínculos filho = ${Object.values(v.vinculos).filter(x => x.parentesco === 'filho').length}; romances=${Object.values(v.vinculos).filter(x => x.romance).map(x => x.romance!.estagio).join(',')}`);
