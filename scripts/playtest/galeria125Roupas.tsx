/** VIDA 12.5 — a fidelidade das roupas e acessórios na figura inteira: looks completos em corpos e idades diferentes. CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';

const P = (ids: string[]) => ids.map((itemId, k) => ({ itemId, id: `e${k}${itemId}` }));
const LOOKS: [string, string[]][] = [
  ['social', ['camisa_social', 'calca_alfaiataria', 'sapato_social', 'blazer', 'relogio_luxo', 'oculos_grau', 'anel_ouro']],
  ['baile', ['camisa_time', 'bermuda_tactel', 'chinelo_slide', 'oculos_juliet', 'corrente_grossa', 'bone_aba_reta', 'relogio_digital']],
  ['rock', ['camiseta_banda', 'jeans', 'coturno', 'jaqueta_couro', 'pulseira_couro', 'brincos']],
  ['festa', ['vestido_festa', 'sapato_social', 'brincos_ouro', 'joia', 'pulseira_ouro']],
  ['campo', ['camisa_linho', 'bombacha', 'botina', 'chapeu_couro', 'relogio']],
  ['frio', ['moletom_oversized', 'calca_cargo', 'tenis_cano_alto', 'casaco_la', 'gorro', 'smartwatch']],
  ['verão', ['regata', 'short_jeans', 'tenis_lona', 'oculos_sol', 'chapeu_palha', 'pulseira_contas']],
  ['elegante', ['vestido_longo', 'sobretudo_grife', 'oculos_grife', 'brincos_ouro', 'relogio_luxo']]
];
const CORPOS: [string, any, any, number, string][] = [['M magro 22', 'masculino', 'magro', 22, 'p2'], ['F mediana 40', 'feminino', 'mediano', 40, 'p5'], ['M acima 55', 'masculino', 'acima_do_peso', 55, 'p4'], ['F atlética 30', 'feminino', 'atletico', 30, 'p6'], ['F idosa 78', 'feminino', 'mediano', 78, 'p3']];
const L: string[] = [];
for (const [look, ids] of LOOKS) {
  L.push(`<div class=f><b>${look}: ${ids.join(', ')}</b>${CORPOS.map(([n, g, c, i, pele]) => `<div class=p>${renderToStaticMarkup(<Figura visual={{ pele, cabelo: g === 'feminino' ? 'longo_ondulado' : 'curto', corCabelo: 'castanho', olhos: 'castanho' } as any} genero={g} idade={i} corpo={c} pecas={P(ids)} largura={120} semFundo />)}<span>${n}</span></div>`).join('')}</div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;margin:6px}.f{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end;margin-bottom:6px;border-bottom:1px solid #ccc}.f b{width:100%}.p{display:flex;flex-direction:column;align-items:center}</style>${L.join('')}`);
