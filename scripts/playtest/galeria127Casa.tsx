/** VIDA 12.7 — as coisas novas da casa (93), cada uma a 48 px e a 160 px, e os cômodos montados com elas. Bundle como CJS; OUT=<arquivo.html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Ilustracao, valida } from '../../src/ui/ilustracao/nucleo';
import { amostraDoObjeto } from '../../src/ui/ilustracao/objetos';
import { OBJETOS_DA_CASA } from '../../src/ui/ilustracao/objetosDaCasa';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';
import { variantesDaCoisa } from '../../src/motor/dados/pertences';

const ids = Object.keys(OBJETOS_DA_CASA);
const so = process.env.SO ? process.env.SO.split(',') : null;
const cor = (id: string) => valida(variantesDaCoisa(id)[0]?.cor, '#a49a8c');
const cartao = (id: string) => `<div class=c>${renderToStaticMarkup(<Ilustracao a={amostraDoObjeto(id, cor(id))} largura={160} rotulo={id} />)}${renderToStaticMarkup(<Ilustracao a={amostraDoObjeto(id, cor(id))} largura={48} rotulo={id} />)}<span>${id}</span></div>`;
const variantes = (id: string) => `<div class=v>${variantesDaCoisa(id).map(v => renderToStaticMarkup(<Ilustracao a={amostraDoObjeto(id, v.cor)} largura={72} rotulo={v.nome} />)).join('')}<span>${id}</span></div>`;
const CENAS: [string, string[]][] = [
  ['sala', ['sofa_couro', 'mesa_centro_marmore', 'tv_oled', 'tapete_persa', 'poltrona_designer', 'mesa_lateral', 'lareira']],
  ['sala', ['sofa_retratil', 'mesa_centro', 'estante_sala', 'tapete', 'home_theater', 'objetos_decor', 'aparador']],
  ['cozinha', ['geladeira_inox', 'fogao_profissional', 'ilha_cozinha', 'adega', 'cafeteira']],
  ['cozinha', ['geladeira', 'fogao', 'microondas', 'freezer', 'louca_talheres', 'armarios_planejados', 'cooktop_forno']],
  ['quarto', ['cama_king', 'closet', 'criado_mudo', 'penteadeira', 'espelho_chao']],
  ['quarto', ['cama_box', 'guarda_roupa', 'comoda', 'colchao_hotel', 'beliche', 'cama_solteiro', 'sofa_cama']],
  ['banheiro', ['banheira_pedra', 'bancada_marmore', 'toalheiro', 'ducha', 'espelho_led']],
  ['banheiro', ['banheira', 'gabinete', 'toalhas', 'sauna']],
  ['piscina', ['espreguicadeira_teca', 'ombrelone', 'sofa_externo', 'cascata', 'boias', 'luz_piscina']],
  ['piscina', ['espreguicadeira', 'guarda_sol', 'mesa_externa', 'capa_piscina', 'kit_piscina', 'aquecedor_piscina']],
  ['jardim', ['pergolado', 'fonte', 'escultura_jardim', 'vasos_grandes', 'luz_jardim', 'plantas']],
  ['jardim', ['gazebo', 'churrasqueira', 'forno_pizza', 'espaco_gourmet', 'playground', 'cama_elastica']],
  ['garagem', ['bancada_ferramentas', 'armario_garagem', 'carregador_ev', 'lavadora_pressao', 'ferramentas', 'organizadores']],
  ['lazer', ['bilhar_profissional', 'fliperama', 'pebolim', 'mesa_jogos', 'pingue_pongue']],
  ['lazer', ['poltronas_cinema', 'bicicleta_ergometrica', 'remo_seco', 'saco_pancada']],
  ['escritorio', ['mesa_executiva', 'cadeira_ergonomica', 'monitores', 'impressora', 'estante_escritorio']]
];
const cenas = CENAS.map(([tipo, os], k) => `<div class=s>${renderToStaticMarkup(<CenaDoComodo tipo={tipo} objetos={os.map((c, i) => ({ coisaId: c, id: `${k}-${i}` }))} largura={640} rotulo={tipo} />)}<span>${tipo}: ${os.join(', ')}</span></div>`);
const parte = process.env.PARTE ?? 'tudo';
const corpo = parte === 'cenas' ? cenas.join('') : parte === 'variantes' ? ids.filter(i => variantesDaCoisa(i).length).map(variantes).join('') : (so ?? ids).map(cartao).join('');
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:${parte === 'cenas' ? 1320 : 1240}px}.c{width:228px;display:flex;align-items:flex-end;gap:6px;background:#fbf8f2;padding:4px;border:1px solid #ddd;flex-wrap:wrap}.c span,.v span,.s span{width:100%}.v{display:flex;flex-wrap:wrap;width:300px;background:#fbf8f2;border:1px solid #ddd}.s{width:650px;background:#fbf8f2;border:1px solid #ddd}</style>${corpo}`);
