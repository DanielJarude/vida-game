/** VIDA 12.5 · auditoria de sistemas — repro: genitor jovem demais na árvore gerada. */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { idade } from '../../src/motor/nucleo';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import type { Vida, Classe } from '../../src/motor/tipos';
await carregarMundo();
const SEM = Number(process.env.SEM ?? 127000), MUN = process.env.MUN ?? 'recife-pe', CL = (process.env.CL ?? 'media_baixa') as Classe;
const ATE = Number(process.env.ATE ?? 0);
let v: Vida = criarVida({ nome: 'Sim', sobrenome: 'Ulação', genero: 'feminino', municipioId: MUN, semente: SEM, classe: CL });
const rel = (id: string) => v.vinculos[id]?.parentesco ?? '-';
function checar(onde: string) {
  for (const p of Object.values(v.pessoas)) for (const g of p.genitores ?? []) {
    const tg = g === 'eu' ? v.eu.tNasc : v.pessoas[g]?.tNasc; if (tg === undefined) continue;
    const dif = (p.tNasc - tg) / 12;
    if (dif < 14) console.log(`${onde}: ${g === 'eu' ? 'EU' : v.pessoas[g].nome}(${g}, ${rel(g)}) tinha ${dif.toFixed(1)}a quando ${p.nome}(${p.id}, ${rel(p.id)}) nasceu; tNasc filho=${p.tNasc} genitor=${tg}; eu.tNasc=${v.eu.tNasc}`);
  }
}
checar('criação');
while (idade(v) < ATE) { v = avancarAno(v).vida; for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: v.momento!.opcoes.find(o => !o.bloqueio)!.id }).vida; }
if (ATE) checar(`aos ${idade(v)}`);
if (process.env.VARRER) {
  const CLS: Classe[] = ['vulneravel', 'trabalhadora', 'media_baixa', 'media', 'alta'];
  let vidas = 0, com = 0, piores: string[] = [], n14 = 0;
  for (let s = 1; s <= Number(process.env.VARRER); s++) {
    const w = criarVida({ nome: 'Sim', sobrenome: 'X', genero: s % 2 ? 'masculino' : 'feminino', municipioId: 'recife-pe', semente: 900000 + s, classe: CLS[s % 5] });
    vidas++; let teve = false;
    for (const p of Object.values(w.pessoas)) for (const g of p.genitores ?? []) {
      const tg = g === 'eu' ? w.eu.tNasc : w.pessoas[g]?.tNasc; if (tg === undefined) continue;
      const dif = (p.tNasc - tg) / 12;
      if (dif < 15) { teve = true; n14++; if (piores.length < 5) piores.push(`s=${900000 + s} ${w.pessoas[g]?.nome}(${w.vinculos[g]?.parentesco}) ${dif.toFixed(1)}a → ${p.nome}(${w.vinculos[p.id]?.parentesco})`); }
    }
    if (teve) com++;
  }
  console.log(`VARRER: ${com}/${vidas} vidas recém-criadas têm genitor com <15 anos no nascimento (${n14} pares)`); piores.forEach(x => console.log('  ' + x));
}
