/** VIDA 22 — as moradias no lugar delas (vizinhos, rua) e com o que ganharam do lado de fora. CJS; OUT=<html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDaCasa } from '../../src/ui/jogo/material/Desenhos';
import { leituraDoLar, type LeituraLar } from '../../src/ui/leituraMaterial';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { transacao } from '../../src/motor/nucleo';

const base = adulto(35, { semente: 125, municipioId: 'sao-paulo-sp' });
const lar = (id: string, bairro: string, extra: Partial<LeituraLar> = {}, perfil = 'metropole'): LeituraLar => {
  const l = leituraDoLar(transacao(base, x => { Object.assign(x.moradia, { modeloId: id, tipo: 'propria', aluguel: 0, bairro }); }).vida);
  return { ...l, janelasAcesas: 2, veiculo: 'carro', ...extra, entorno: { ...l.entorno, bairro, perfil }, extras: extra.extras ?? l.extras, coisasFora: extra.coisasFora ?? [] } as LeituraLar;
};
const CASOS: [string, LeituraLar][] = [
  ['casa simples · periferia', lar('casa_simples', 'na periferia', { padrao: 1 })],
  ['casa simples · periferia · garagem construída + churrasqueira', lar('casa_simples', 'na periferia', { padrao: 1, extras: ['garagem'], coisasFora: ['churrasqueira'] })],
  ['casa 2q · bairro novo (garagem da planta)', lar('casa_2q', 'num bairro novo')],
  ['casa 2q · bairro · piscina + área de lazer + varanda', lar('casa_2q', 'num bairro tradicional', { extras: ['garagem', 'piscina', 'lazer', 'varanda'], coisasFora: ['espreguicadeira', 'playground'] })],
  ['casa 3q · cidade pequena', lar('casa_3q', 'perto da praça', {}, 'pequena')],
  ['casa 3q · bairro · varanda + gazebo + cama elástica', lar('casa_3q', 'num bairro novo', { extras: ['garagem', 'jardim', 'varanda'], coisasFora: ['gazebo', 'cama_elastica'] })],
  ['casa grande · bairro nobre (planta: lazer, varanda)', lar('casa_grande', 'num bairro nobre')],
  ['casa grande · condomínio · + piscina + quadra', lar('casa_grande', 'num condomínio fechado', { extras: ['garagem', 'jardim', 'lazer', 'varanda', 'piscina', 'quadra'] })],
  ['mansão · condomínio (planta)', lar('mansao', 'num condomínio fechado')],
  ['sítio · zona rural', lar('sitio', 'na zona rural, perto da cidade', {}, 'pequena')],
  ['apto 2q · centro', lar('apto_2q', 'no centro')],
  ['apto 3q · perto do metrô', lar('apto_3q', 'perto do metrô')],
  ['alto padrão · bairro nobre', lar('alto_padrao', 'num bairro nobre')],
  ['kitnet · centro', lar('kitnet', 'no centro')],
  ['apto 1q · cidade pequena', lar('apto_1q', 'no centro', {}, 'pequena')],
  ['cobertura · bairro nobre', lar('cobertura', 'num bairro nobre')]
];
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><style>body{font:11px sans-serif;background:#f4efe6;margin:6px;width:1300px}.c{display:inline-block;width:620px;margin:4px;vertical-align:top}.c svg{width:620px;height:auto}</style>${CASOS.map(([n, l]) => `<div class=c><b>${n}</b>${renderToStaticMarkup(<CenaDaCasa l={l} />)}</div>`).join('')}`);
