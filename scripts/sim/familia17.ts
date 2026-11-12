/** VIDA 17 · sim: genitores (e família) que começam um namoro novo enquanto ainda têm parceria — a contradição de estado. */
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import type { Vida } from '../../src/motor/tipos';

const N = Number(process.env.N ?? 40);
let casos = 0, novos = 0;
for (let s = 1; s <= N; s++) {
  let v: Vida = criarVida({ nome: 'Ana', sobrenome: 'Silva', genero: s % 2 ? 'feminino' : 'masculino', municipioId: s % 3 ? 'recife-pe' : 'sao-paulo-sp', semente: s * 7 + 3 });
  for (let a = 0; a < 70 && !v.morte; a++) {
    const antes = new Map(Object.values(v.pessoas).map(p => [p.id, { par: p.parceiroId, n: p.vida?.trajetoria?.length ?? 0 }]));
    const x = avancarAno(v).vida; x.momento = null; (x as Vida & { fila?: unknown }).fila = undefined; v = x;
    for (const p of Object.values(v.pessoas)) {
      const tr = p.vida?.trajetoria ?? [];
      const a0 = antes.get(p.id);
      const novo = tr.slice(a0?.n ?? 0).filter(t => t.tipo === 'amor' && /novo relacionamento|Casou|namor/i.test(t.texto));
      if (!novo.length) continue;
      novos++;
      // Quem ainda era parceiro de alguém vivo que aponta de volta?
      const outro = Object.values(v.pessoas).find(o => o.id !== p.id && o.vivo && o.parceiroId === p.id);
      const vin = v.vinculos[p.id];
      const gen = vin?.parentesco === 'mae' || vin?.parentesco === 'pai';
      const coGen = gen ? Object.values(v.vinculos).find(x => x.pessoaId !== p.id && (x.parentesco === 'mae' || x.parentesco === 'pai')) : undefined;
      const coVivo = coGen && v.pessoas[coGen.pessoaId]?.vivo;
      const separaram = v.biografia.some(e => /pais se separaram/.test(e.texto));
      if (gen) console.log('GEN', s, a, vin?.parentesco, 'arranjo=', v.origem.arranjo, 'coVivo=', !!coVivo, 'separaram=', separaram, 'antesPar=', a0?.par, novo.map(t => t.texto).join('/'));
      if (outro || (a0?.par && a0.par !== 'fora' && v.pessoas[a0.par]?.vivo) || (gen && coVivo && !separaram && v.origem.arranjo === 'pais_juntos')) {
        casos++;
        if (casos <= 12) console.log('CONTRADICAO', s, a, vin?.parentesco, p.nome, '| antes par=', a0?.par, '| outro aponta=', outro?.nome, outro && v.vinculos[outro.id]?.parentesco, '|', novo.map(t => t.texto).join(' / '));
      }
    }
  }
}
console.log({ N, novos, casos });
