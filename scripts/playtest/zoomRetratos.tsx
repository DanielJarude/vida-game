// Retratos grandes (240 px) de alguns cortes, para inspecionar o desenho de perto: OUT=<pasta> node <bundle>
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { Retrato } from '../../src/ui/avatar/Retrato';
import type { Genero, Visual } from '../../src/motor/tipos';
const C: [string, string, Genero, string, number][] = (process.env.CORTES ?? 'curto:liso:m:30,curto_lado:liso:m:30,topete:ondulado:m:30,ondulado:ondulado:m:30,crespo_curto:crespo:m:30,cacheado:cacheado:m:30,black:crespo:f:30,locs:crespo:f:30,trancas:crespo:f:30,longo_liso:liso:f:30,longo_ondulado:ondulado:f:30,cacheado_longo:cacheado:f:30,chanel:liso:f:30,pixie:liso:f:30,rabo:liso:f:30,coque:crespo:f:30')
  .split(',').map(x => { const [c, t, g, i] = x.split(':'); return [c, t, g === 'm' ? 'masculino' : 'feminino', 'preto', Number(i)]; });
let h = '<html><body style="background:#2a2e34;margin:0;padding:8px;font:12px sans-serif;color:#ccc">';
C.forEach(([c, t, g, , i], k) => { const v = { pele: ['p2', 'p4', 'p5', 'p3'][k % 4], cabelo: c, corCabelo: ['castanho_escuro', 'preto', 'castanho', 'loiro'][k % 4], olhos: 'castanho', textura: t } as Visual; h += `<div style="display:inline-block;margin:4px;text-align:center">${renderToStaticMarkup(<Retrato visual={v} genero={g} idade={i} semente={c} tamanho={210} />)}<br>${c} ${t}</div>`; });
writeFileSync(`${process.env.OUT}/zoom.html`, h + '</body></html>');
