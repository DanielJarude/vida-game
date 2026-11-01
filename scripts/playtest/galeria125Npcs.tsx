/** VIDA 12.5 — as famílias de partida (e a mesma família 40 anos depois), para conferir a variedade e a semelhança dos NPCs. CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
import { criarVida } from '../../src/motor/criacao';
import { idadePessoa } from '../../src/motor/nucleo';
import type { Vida } from '../../src/motor/tipos';

const linha = (v: Vida, rot: string) => {
  const gente = Object.values(v.vinculos).filter(x => v.pessoas[x.pessoaId] && !v.pessoas[x.pessoaId].especie && x.parentesco).map(x => ({ p: v.pessoas[x.pessoaId], par: x.parentesco! }));
  const eu = `<div class=p>${renderToStaticMarkup(<Retrato visual={v.eu.visual} genero={v.eu.genero} idade={Math.floor((v.t - v.eu.tNasc) / 12)} semente={v.eu.semente ?? 'eu'} tamanho={64} rotulo="eu" />)}<span>eu</span></div>`;
  return `<div class=f><b>${rot}</b>${eu}${gente.map(({ p, par }) => `<div class=p>${renderToStaticMarkup(<Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(v, p)} semente={p.id} tamanho={64} rotulo={p.nome} />)}<span>${par} ${idadePessoa(v, p)}</span></div>`).join('')}</div>`;
};
const L: string[] = [];
const cidades = ['recife-pe', 'sao-paulo-sp', 'salvador-ba', 'porto-alegre-rs', 'manaus-am', 'belo-horizonte-mg'];
for (let k = 0; k < 6; k++) {
  const v = criarVida({ nome: 'V', sobrenome: 'S', genero: k % 2 ? 'masculino' : 'feminino', municipioId: cidades[k], semente: 9100 + k });
  L.push(linha(v, `${cidades[k]} · nascimento`));
  L.push(linha({ ...v, t: v.t + 40 * 12 } as Vida, `${cidades[k]} · +40 anos (sem simular: só a idade)`));
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;margin:6px}.f{display:flex;flex-wrap:wrap;gap:4px;align-items:flex-end;margin-bottom:8px;border-bottom:1px solid #ccc;padding-bottom:4px}.f b{width:100%}.p{display:flex;flex-direction:column;align-items:center;width:70px}</style>${L.join('')}`);
