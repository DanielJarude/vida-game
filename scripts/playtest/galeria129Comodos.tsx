/**
 * VIDA 12.9 — composição dos cômodos: cenas sintéticas (quartos, salas, cozinhas, sala de jogos; pequenas e grandes,
 * cheias). OUT=<html>. Bundle como CJS (--loader:.css=empty).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';
import { disporComodo } from '../../src/ui/ilustracao/disposicao';

export const CENAS: [string, number, string[]][] = [
  ['quarto', 9, ['cama_king', 'criado_mudo', 'tv', 'closet']],
  ['quarto', 9, ['cama_box', 'criado_mudo', 'penteadeira', 'guarda_roupa']],
  ['quarto', 12, ['cama_king', 'criado_mudo', 'penteadeira', 'tv', 'closet', 'tapete']],
  ['quarto', 14, ['cama_box', 'criado_mudo', 'penteadeira', 'guarda_roupa', 'comoda', 'espelho_chao', 'tapete']],
  ['quarto', 25, ['cama_king', 'criado_mudo', 'closet', 'penteadeira', 'poltrona', 'tv_oled', 'tapete_persa', 'comoda', 'ar_condicionado']],
  ['quarto', 40, ['cama_king', 'criado_mudo', 'closet', 'penteadeira', 'poltrona_designer', 'tv_oled', 'tapete_persa', 'comoda', 'escrivaninha', 'vitrine_colecao', 'plantas']],
  ['sala', 14, ['sofa', 'mesa_centro', 'tv', 'mesa_jogos', 'vitrine_colecao']],
  ['sala', 20, ['sofa', 'mesa_centro', 'tv', 'estante_sala', 'mesa_jogos', 'vitrine_colecao', 'poltrona', 'tapete']],
  ['sala', 40, ['sofa_designer', 'mesa_centro_marmore', 'tv_oled', 'vitrine_colecao', 'estante_trofeus', 'mesa_jogos', 'aparador', 'lareira', 'poltrona_designer', 'plantas', 'tapete_persa']],
  ['sala', 60, ['sofa_designer', 'mesa_centro_marmore', 'tv_oled', 'vitrine_colecao', 'estante_trofeus', 'mesa_jogos', 'mesa_jantar', 'aparador', 'lareira', 'poltrona_designer', 'plantas', 'vasos_grandes', 'som_hifi', 'discos', 'tapete_persa', 'quadros']],
  ['cozinha', 8, ['armarios_planejados', 'ilha_cozinha', 'geladeira', 'microondas']],
  ['cozinha', 10, ['armarios_planejados', 'ilha_cozinha', 'geladeira', 'fogao', 'microondas', 'cafeteira']],
  ['cozinha', 20, ['armarios_planejados', 'ilha_cozinha', 'geladeira_inox', 'adega_parede', 'cooktop_forno', 'lava_loucas', 'cafeteira']],
  ['cozinha', 35, ['armarios_planejados', 'ilha_cozinha', 'geladeira_inox', 'adega_parede', 'fogao_profissional', 'lava_loucas', 'freezer', 'mesa_jantar', 'cafeteira', 'microondas']],
  ['jogos', 16, ['mesa_sinuca', 'pebolim', 'fliperama', 'mesa_jogos', 'videogame', 'tv']],
  ['jogos', 30, ['bilhar_profissional', 'pebolim', 'fliperama', 'mesa_jogos', 'vitrine_colecao', 'estante_trofeus', 'tv_oled', 'sofa']],
  ['escritorio', 9, ['escrivaninha', 'cadeira_ergonomica', 'computador', 'estante_escritorio', 'livros', 'poltrona']],
  ['biblioteca', 12, ['livros', 'poltrona', 'estante_escritorio', 'mesa_lateral', 'vitrine_colecao', 'tapete']],
  ['academia', 12, ['esteira', 'estacao_musculacao', 'bicicleta_ergometrica', 'saco_pancada', 'kit_academia']],
  ['quarto_extra', 9, ['beliche', 'escrivaninha', 'guarda_roupa', 'cadeira_ergonomica']]
];

if (process.env.OUT) {
  const html: string[] = [];
  for (const [i, [tipo, area, ids]] of CENAS.entries()) {
    const objetos = ids.map((c, k) => ({ id: `o${k}`, coisaId: c }));
    const d = disporComodo(tipo, area, objetos);
    html.push(`<div class=s>${renderToStaticMarkup(<CenaDoComodo tipo={tipo} area={area} objetos={objetos} largura={760} rotulo={tipo} />)}<span><b>#${i} ${tipo} ${area} m²</b> · fora: ${d.fora.map(f => objetos.find(o => o.id === f)?.coisaId).join(',')}<br>${d.postos.map(p => `${p.coisaId}[${p.montagem[0]}${(p as any).giro ? '↻' + (p as any).giro : ''} x${p.x0.toFixed(1)}-${p.x1.toFixed(1)} z${p.z0.toFixed(1)}-${p.z1.toFixed(1)}]`).join(' ')}</span></div>`);
  }
  writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:1600px}.s{width:780px;background:#fbf8f2;border:1px solid #ddd}.s span{display:block;padding:4px}</style>${html.join('')}`);
}
