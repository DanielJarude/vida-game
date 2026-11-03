/**
 * VIDA 12.8 — os cômodos dispostos (a mesma lista de objetos em cômodos pequenos e grandes), a cena a 640 e a 132 px.
 * Bundle como CJS; OUT=<arquivo.html>. CENA=<n> mostra uma só.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDoComodo } from '../../src/ui/ilustracao/comodos';

const CENAS: [string, number, string[]][] = [
  ['sala', 20, ['sofa_couro', 'mesa_centro_marmore', 'tv_oled', 'tapete_persa', 'poltrona_designer', 'mesa_lateral', 'quadros', 'plantas', 'objetos_decor', 'aparador']],
  ['sala', 90, ['sofa_designer', 'mesa_centro', 'estante_sala', 'tapete', 'home_theater', 'tv', 'lareira', 'poltrona', 'videogame', 'mesa_jantar', 'vitrine_colecao', '_obra', 'som_hifi', 'discos']],
  ['cozinha', 10, ['geladeira', 'fogao', 'microondas', 'cafeteira', 'louca_talheres', 'maquina_lavar']],
  ['cozinha', 22, ['geladeira_inox', 'fogao_profissional', 'ilha_cozinha', 'adega', 'cafeteira', 'armarios_planejados', 'microondas']],
  ['quarto', 12, ['cama_box', 'criado_mudo', 'guarda_roupa', 'ar_condicionado', 'notebook', 'celular_bom', 'chuteira_bola', 'camping', 'violao']],
  ['quarto', 28, ['cama_king', 'criado_mudo', 'closet', 'penteadeira', 'espelho_chao', 'tapete', 'tv_oled', 'quadros', 'ar_condicionado', 'expositor_relogios']],
  ['banheiro', 4.5, ['gabinete', 'espelho_led', 'toalheiro', 'toalhas']],
  ['banheiro', 12, ['banheira_pedra', 'bancada_marmore', 'ducha', 'espelho_led', 'toalheiro', 'sauna']],
  ['lavabo', 2.5, ['quadros']],
  ['piscina', 60, ['espreguicadeira_teca', 'ombrelone', 'sofa_externo', 'mesa_externa', 'cascata', 'boias', 'luz_piscina', 'aquecedor_piscina', 'kit_piscina', 'vasos_grandes']],
  ['jardim', 70, ['pergolado', 'fonte', 'escultura_jardim', 'vasos_grandes', 'luz_jardim', 'plantas', 'camping', 'cama_elastica']],
  ['garagem', 24, ['bancada_ferramentas', 'armario_garagem', 'carregador_ev', 'lavadora_pressao', 'ferramentas', 'organizadores']],
  ['jogos', 18, ['bilhar_profissional', 'fliperama', 'pebolim', 'mesa_jogos']],
  ['cinema', 18, ['poltronas_cinema', 'projetor', 'home_theater', 'tapete']],
  ['academia', 14, ['estacao_musculacao', 'esteira', 'bicicleta_ergometrica', 'kit_academia', 'saco_pancada']],
  ['escritorio', 9, ['mesa_executiva', 'cadeira_ergonomica', 'monitores', 'impressora', 'estante_escritorio', 'quadros']],
  ['estudio', 10, ['piano', 'bateria', 'guitarra', 'home_studio', 'violao', 'saxofone']],
  ['quadra', 260, ['raquete', 'chuteira_bola']],
  ['varanda', 10, ['sofa_externo', 'plantas', 'mesa_lateral']],
  ['adega', 8, ['adega_parede', 'adega', 'mesa_jogos']]
];
const so = process.env.CENA ? process.env.CENA.split(',').map(Number) : null;
const html = CENAS.map(([tipo, area, os], k) => so && !so.includes(k) ? '' : `<div class=s>${renderToStaticMarkup(<CenaDoComodo tipo={tipo} area={area} objetos={os.map((c, i) => ({ coisaId: c, id: `${k}-${i}` }))} largura={640} rotulo={tipo} />)}${renderToStaticMarkup(<CenaDoComodo tipo={tipo} area={area} objetos={os.map((c, i) => ({ coisaId: c, id: `${k}-${i}` }))} largura={132} rotulo={tipo} />)}<span>${k} · ${tipo} ${area} m²: ${os.join(', ')}</span></div>`).join('');
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;display:flex;flex-wrap:wrap;gap:6px;margin:8px;width:1600px}.s{width:790px;background:#fbf8f2;border:1px solid #ddd;display:flex;flex-wrap:wrap;align-items:flex-end;gap:6px}.s span{width:100%}</style>${html}`);
