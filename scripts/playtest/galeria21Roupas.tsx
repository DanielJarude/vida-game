/** VIDA 21 — as peças novas (roupas e acessórios) em looks, em corpos diferentes. CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { Figura } from '../../src/ui/avatar/Figura';

const P = (ids: string[]) => ids.map((itemId, k) => ({ itemId, id: `e${k}${itemId}` }));
const LOOKS: [string, string[]][] = [
  ['treino', ['camiseta_dry_fit', 'short_corrida', 'tenis_corrida', 'mochila_esportiva', 'relogio_esportivo_cronografo']],
  ['academia', ['regata_academia', 'calca_moletom', 'tenis_basquete', 'gargantilha_couro']],
  ['escritório', ['camisa_oxford', 'calca_wide_leg', 'bota_chelsea', 'trench_coat', 'bolsa_couro_media', 'relogio_titanio']],
  ['praia', ['camisa_havaiana', 'short_alfaiataria', 'chinelo_slide']],
  ['noite', ['body_canelado', 'jeans_skinny', 'salto_grife', 'clutch_pedraria']],
  ['gala', ['vestido_gala_grife', 'salto_grife', 'relogio_ouro_rose', 'bolsa_edicao_limitada']],
  ['smoking', ['smoking', 'sapato_social', 'relogio_ouro_rose']],
  ['terno grife', ['terno_grife', 'mocassim', 'mochila_couro']],
  ['vestidos', ['vestido_tubinho', 'sapatilha', 'cardigan']],
  ['estampado', ['vestido_midi_estampado', 'sandalia', 'bolsa_tote']],
  ['urbano', ['moletom_grife', 'jeans_reto_premium', 'tenis_grife', 'puffer', 'pochete_grife']],
  ['bomber', ['camiseta_basica_gola_v', 'minissaia_jeans', 'tenis_lona', 'jaqueta_bomber']],
  ['plissada', ['blusa_ombro_a_ombro', 'saia_plissada_longa', 'sandalia', 'casaco_vison_sintetico']],
  ['luxo', ['camisa_seda_grife', 'calca_alfaiataria_grife', 'mocassim']],
  ['piloto', ['macacao_piloto', 'tenis_casual', 'jaqueta_corrida']],
  ['hospital', ['uniforme_hospitalar', 'tenis_casual', 'jaleco']],
  ['jardineira', ['macacao_jeans', 'camiseta_basica_gola_v', 'tenis_lona']],
  ['judô', ['kimono_judo']],
  ['torcida', ['agasalho_selecao', 'chuteira']],
  ['polo', ['polo_pique_premium', 'bermuda_sarja', 'mocassim']]
];
const CORPOS: [string, any, any, number, string][] = [['M magro 22', 'masculino', 'magro', 22, 'p2'], ['F mediana 40', 'feminino', 'mediano', 40, 'p5'], ['M acima 55', 'masculino', 'acima_do_peso', 55, 'p4'], ['F atlética 30', 'feminino', 'atletico', 30, 'p6']];
const L: string[] = [];
for (const [look, ids] of LOOKS) {
  L.push(`<div class=f><b>${look}: ${ids.join(', ')}</b>${CORPOS.map(([n, g, c, i, pele]) => `<div class=p>${renderToStaticMarkup(<Figura visual={{ pele, cabelo: g === 'feminino' ? 'longo_ondulado' : 'curto', corCabelo: 'castanho', olhos: 'castanho' } as any} genero={g} idade={i} corpo={c} pecas={P(ids)} largura={110} semFundo />)}<span>${n}</span></div>`).join('')}</div>`);
}
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:10px sans-serif;background:#f4efe6;margin:6px;width:1000px}.f{display:inline-flex;flex-wrap:wrap;gap:4px;align-items:flex-end;margin:0 6px 6px 0;border-bottom:1px solid #ccc;width:480px}.f b{width:100%}.p{display:flex;flex-direction:column;align-items:center}</style>${L.join('')}`);
