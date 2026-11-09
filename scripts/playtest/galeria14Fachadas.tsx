/** VIDA 14 (fachadas) — todas as formas de moradia × variações do lado de fora. Bundle como CJS; OUT=<arquivo.html> [GRUPO=formas|fora|mini]. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { CenaDaCasa, ladoDeForaDe, MiniaturaDaCasa } from '../../src/ui/jogo/material/Desenhos';
import { leituraDoLar, type FormaDaCasa, type LeituraLar } from '../../src/ui/leituraMaterial';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { transacao } from '../../src/motor/nucleo';

const base = adulto(35, { semente: 125, municipioId: 'sao-paulo-sp' });
const lar = (id: string, tipo = 'propria', extra: Record<string, unknown> = {}): LeituraLar => leituraDoLar(transacao(base, x => { Object.assign(x.moradia, { modeloId: id, tipo, aluguel: 0, ...extra }); }).vida);
const L: string[] = [];
const grupo = process.env.GRUPO ?? 'formas';
const carta = (html: string, nome: string) => `<div class=c>${html}<span>${nome}</span></div>`;
const MODELOS = ['republica', 'kitnet', 'casa_simples', 'apto_1q', 'apto_2q', 'casa_2q', 'apto_3q', 'casa_3q', 'casa_grande', 'sitio', 'alto_padrao', 'cobertura', 'mansao'];
const comTudo = (l: LeituraLar, k: number): LeituraLar => ({ ...l, janelasAcesas: 2, veiculo: k % 3 === 2 ? 'moto' : 'carro', bichos: k % 2 ? [{ id: 'b' + k, nome: 'Pipoca', especie: 'cachorro' }] : [] } as LeituraLar);
if (grupo === 'formas') {
  MODELOS.forEach((id, k) => { L.push(carta(renderToStaticMarkup(<CenaDaCasa l={comTudo(lar(id), k)} />), id)); });
  L.push(carta(renderToStaticMarkup(<CenaDaCasa l={lar('', 'pais', { modeloId: undefined })} />), 'familia (pais)'));
  L.push(carta(renderToStaticMarkup(<CenaDaCasa l={lar('', 'parente', { modeloId: undefined })} />), 'parente'));
  L.push(carta(renderToStaticMarkup(<CenaDaCasa l={lar('', 'cedida', { modeloId: undefined, padrao: 1 })} />), 'favor (cedida)'));
  L.push(carta(renderToStaticMarkup(<CenaDaCasa l={lar('', 'cedida', { modeloId: undefined, funcional: true })} />), 'funcional'));
} else if (grupo === 'fora') {
  const combos: [string, Record<string, string>][] = [
    ['original', {}],
    ['terracota+gramado+cimento', { fachada: 'pintura_terracota', paisagismo: 'gramado', caminho: 'cimento', portao: 'basculante' }],
    ['tijolinho+canteiros+blocos+arandelas', { fachada: 'tijolinho', paisagismo: 'canteiros', caminho: 'intertravado', luz_externa: 'arandelas', portao: 'automatico' }],
    ['ripado+tropical+deck+balizadores', { fachada: 'madeira', paisagismo: 'tropical', caminho: 'deck', luz_externa: 'balizadores', portao: 'madeira' }],
    ['pedra+pomar+pedra_portuguesa+espetos', { fachada: 'pedra', paisagismo: 'pomar', caminho: 'pedra_portuguesa', luz_externa: 'espetos', portao: 'simples' }],
    ['porcelanato+zen+placas', { fachada: 'porcelanato', paisagismo: 'zen', caminho: 'pedra_natural', portao: 'automatico' }],
    ['grafite+textura? assinada+assinado+projeto+corten', { fachada: 'assinada', paisagismo: 'assinado', caminho: 'travertino', luz_externa: 'projeto', portao: 'pivotante' }],
    ['marmore+botanico+travertino', { fachada: 'marmore', paisagismo: 'botanico', caminho: 'travertino', luz_externa: 'projeto', portao: 'pivotante' }],
    ['pedra_ferro', { fachada: 'pedra_ferro', paisagismo: 'gramado', caminho: 'cimento' }],
    ['verde+textura', { fachada: 'textura', paisagismo: 'canteiros' }]
  ];
  const formas = (process.env.FORMAS ?? 'casa_simples,casa_2q,casa_3q,casa_grande,mansao,sitio').split(',');
  for (const f of formas) combos.forEach(([nome, ext], k) => L.push(carta(renderToStaticMarkup(<CenaDaCasa l={comTudo(lar(f), k)} externo={ladoDeForaDe(ext as never)} />), `${f} · ${nome}`)));
} else if (grupo === 'estado') {
  for (const f of ['casa_2q', 'casa_grande', 'apto_2q', 'mansao']) for (const nivel of ['gasta', 'ruim', 'problema']) {
    const l = lar(f); L.push(carta(renderToStaticMarkup(<CenaDaCasa l={{ ...l, condicao: { ...l.condicao, nivel } } as LeituraLar} />), `${f} · ${nivel}`));
  }
  const l = lar('casa_simples'); L.push(carta(renderToStaticMarkup(<CenaDaCasa l={{ ...l, condicao: { ...l.condicao, nivel: 'boa', reformaRecente: true } } as LeituraLar} />), 'casa_simples · pintura nova'));
} else {
  for (const f of [...MODELOS, 'familia', 'parente', 'favor', 'funcional'] as FormaDaCasa[]) L.push(carta(renderToStaticMarkup(<MiniaturaDaCasa forma={f} largura={128} />), f));
  for (const f of MODELOS as FormaDaCasa[]) L.push(carta(renderToStaticMarkup(<MiniaturaDaCasa forma={f} largura={84} fachada={{ cor: '#c0714f', nome: 'terracota' }} />), f + ' 84'));
}
const larg = Number(process.env.LARG ?? 340);
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><style>
:root{--bg:#f4efe6;--card:#fbf8f2;--tx:#3a342e}@media (prefers-color-scheme:dark){:root{--bg:#171513;--card:#211e1b;--tx:#d8d1c4}}
body{font:11px sans-serif;background:var(--bg);color:var(--tx);display:flex;flex-wrap:wrap;gap:6px;margin:8px}.c{width:${larg}px;max-width:calc(100vw - 24px);display:flex;flex-direction:column;align-items:center;background:var(--card);padding:4px;border:1px solid #8884}.c svg{width:100%;height:auto}.cena--miniatura{width:auto!important}</style>${L.join('')}`);
