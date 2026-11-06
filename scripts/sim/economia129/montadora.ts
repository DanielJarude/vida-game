import { carregarMundo, adulto, pessoa, anos, fundarEmpresa } from './base';
import { SETORES_GRANDES } from '../../r129/src/motor/dados/empresas129';
await carregarMundo();
const base = adulto(40, { municipioId: 'sao-paulo-sp', semente: 41 });
const setores = process.argv[2] ? [process.argv[2]] : SETORES_GRANDES.map(s => s.id);
for (const st of setores) {
  const s = SETORES_GRANDES.find(x => x.id === st)!;
  for (const item of process.argv[3] ? [process.argv[3]] : [s.itens[0].id]) {
    let v = pessoa(base, 60e9);
    fundarEmpresa(v, st as never, item, false);
    const linha: string[] = [];
    for (let a = 1; a <= 15; a++) {
      v = anos(v, 1);
      const e = (v.financas.empresas ?? [])[0];
      if (!e) { linha.push(`a${a}: sumiu`); break; }
      const c = e.corp!;
      linha.push(`a${a}:${e.estado.slice(0,4)} rec=${(e.ultimo?.receita ?? 0)/1e6|0}M luc=${(e.ultimo?.resultado ?? 0)/1e6|0}M cx=${e.caixa/1e6|0}M div=${c.divida/1e6|0}M val=${(e.avaliacao??0)/1e6|0}M cap=${c.capacidade} proj=${c.projetos.map(p=>p.item+':'+p.estado.slice(0,3)+Math.round(p.feitos)+'/'+p.meses).join(',')}`);
      if (e.estado === 'encerrada') break;
    }
    console.log(`== ${st}/${item}\n  ` + linha.join('\n  '));
  }
}
