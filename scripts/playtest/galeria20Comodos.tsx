/**
 * VIDA 20 — auditoria visual de TODOS os tipos de cômodo (banheiro, lavabo, quartos, sala, cozinha, lazer, externos),
 * pequenos e grandes, cheios. OUT=<html>. Bundle como CJS (--loader:.css=empty).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';
import { disporComodo } from '../../src/ui/ilustracao/disposicao';
import { CENAS as CENAS129 } from './galeria129Comodos';

export const CENAS20: [string, number, string[]][] = [
  ['banheiro', 4, []],
  ['banheiro', 5, ['gabinete', 'espelho_led', 'toalheiro', 'toalhas']],
  ['banheiro', 8, ['banheira', 'gabinete', 'espelho_led', 'toalheiro']],
  ['banheiro', 12, ['banheira_pedra', 'ducha', 'bancada_marmore', 'espelho_led', 'toalheiro', 'toalhas', 'plantas']],
  ['banheiro', 18, ['banheira_pedra', 'ducha', 'bancada_marmore', 'espelho_led', 'sauna', 'toalheiro']],
  ['lavabo', 2.5, []],
  ['lavabo', 3, ['gabinete', 'espelho_led', 'quadros']],
  ['quarto', 12, ['cama_box', 'criado_mudo', 'guarda_roupa']],
  ['quarto', 16, ['cama_king', 'criado_mudo', 'guarda_roupa', 'comoda', 'tv', '_abajur']],
  ['quarto', 20, ['colchao_hotel', 'criado_mudo', 'closet', 'penteadeira', 'espelho_chao', 'ar_condicionado']],
  ['quarto_extra', 9, ['cama_solteiro', 'criado_mudo', 'escrivaninha', 'cadeira_ergonomica', 'guarda_roupa']],
  ['quarto_extra', 9, ['sofa_cama', 'mesa_lateral', 'estante_escritorio']],
  ['sala', 20, ['sofa_retratil', 'mesa_centro', 'tv', 'home_theater', 'poltrona', 'mesa_lateral', 'tapete', 'quadros', 'plantas']],
  ['sala', 30, ['sofa_couro', 'mesa_centro_marmore', 'tv_oled', 'estante_sala', 'piano', 'mesa_jantar', 'tapete_persa']],
  ['cozinha', 10, ['geladeira', 'microondas', 'cafeteira', 'maquina_lavar', 'mesa_jantar']],
  ['cozinha', 14, ['geladeira_inox', 'fogao_profissional', 'lava_loucas', 'adega', 'freezer', 'microondas']],
  ['escritorio', 12, ['mesa_executiva', 'cadeira_ergonomica', 'monitores', 'impressora', 'estante_escritorio', 'poltrona']],
  ['estudio', 10, ['home_studio', 'teclado', 'guitarra', 'violao', 'bateria', 'saxofone']],
  ['atelie', 12, ['cavalete', 'torno_ceramica', 'material_arte', 'mesa_jogos']],
  ['cinema', 18, ['poltronas_cinema', 'projetor', 'home_theater', 'tv_oled']],
  ['adega', 8, ['adega_parede', 'adega', 'mesa_jogos']],
  ['academia', 20, ['esteira', 'estacao_musculacao', 'remo_seco', 'bicicleta_ergometrica', 'saco_pancada', 'kit_academia']],
  ['jogos', 25, ['pingue_pongue', 'pebolim', 'fliperama', 'mesa_jogos']],
  ['garagem', 30, ['bancada_ferramentas', 'armario_garagem', 'organizadores', 'carregador_ev', 'lavadora_pressao', 'ferramentas']],
  ['varanda', 10, ['poltrona', 'mesa_lateral', 'plantas', 'vasos_grandes']],
  ['lazer', 25, ['churrasqueira', 'mesa_externa', 'forno_pizza', 'sofa_externo']],
  ['piscina', 40, ['espreguicadeira', 'guarda_sol', 'mesa_externa', 'boias', 'cascata', 'kit_piscina']],
  ['jardim', 40, ['fonte', 'escultura_jardim', 'luz_jardim', 'playground', 'pergolado']]
];

const TODAS = process.env.SO20 ? CENAS20 : [...CENAS20, ...CENAS129];
if (process.env.OUT) {
  const html: string[] = [];
  for (const [i, [tipo, area, ids]] of TODAS.entries()) {
    const objetos = ids.map((c, k) => ({ id: `o${k}`, coisaId: c }));
    const d = disporComodo(tipo, area, objetos);
    html.push(`<div class=s id=c${i}>${renderToStaticMarkup(<CenaDoComodo tipo={tipo} area={area} objetos={objetos} largura={760} rotulo={tipo} />)}<span><b>#${i} ${tipo} ${area} m²</b> · fora: ${d.fora.map(f => objetos.find(o => o.id === f)?.coisaId).join(',')}<br>${d.postos.map(p => `${p.coisaId}[${p.montagem[0]} x${p.x0.toFixed(2)}-${p.x1.toFixed(2)} z${p.z0.toFixed(2)}-${p.z1.toFixed(2)} h${p.h}]`).join(' ')}</span></div>`);
  }
  writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:1600px}.s{width:780px;background:#fbf8f2;border:1px solid #ddd}.s span{display:block;padding:4px}</style>${html.join('')}`);
}
