/** VIDA 13 — desenhos novos de tatuagem na pele (corpo inteiro, frente e costas, e a lupa por região). OUT=<a.html>. */
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync } from 'fs';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { adulto } from '../../src/motor/__tests__/cenarios';
import { transacao } from '../../src/motor/nucleo';
import { executar, type Acao } from '../../src/motor/acoes';
import { tatuagensNaFigura } from '../../src/motor/sistemas/tatuagens';
import { tipoDeCorpo } from '../../src/motor/sistemas/silhueta';
import { Figura, focoDaRegiao } from '../../src/ui/avatar/Figura';
(async () => {
await carregarMundo();
let v = transacao(adulto(30, { semente: 1300, municipioId: 'sao-paulo-sp' }), x => { x.financas.conta = 9_000_000; x.momento = null; }).vida;
const pedidos: Acao[] = [
  { tipo: 'tatuar', desenho: 'vegvisir', regiao: 'pulso', lado: 'e', tamanho: 1 },
  { tipo: 'tatuar', desenho: 'capivara', regiao: 'panturrilha', lado: 'd', tamanho: 3, cor: 'colorida' },
  { tipo: 'tatuar', desenho: 'verme_da_areia', regiao: 'costas_alta', tamanho: 3, cor: 'colorida' },
  { tipo: 'tatuar', desenho: 'lamina_oculta', regiao: 'antebraco', lado: 'e', tamanho: 2, cor: 'colorida' },
  { tipo: 'tatuar', desenho: 'portal_torii', regiao: 'biceps', lado: 'd', tamanho: 3, cor: 'colorida' },
  { tipo: 'tatuar', desenho: 'sol_negro', regiao: 'peitoral', lado: 'e', tamanho: 3 },
  { tipo: 'tatuar', desenho: 'bloco_de_grama', regiao: 'mao', lado: 'd', tamanho: 1, cor: 'colorida' },
  { tipo: 'tatuar', desenho: 'faixa_de_triangulos', regiao: 'antebraco', lado: 'd', tamanho: 2 },
  { tipo: 'tatuar', desenho: 'fenix_pequena', regiao: 'coxa', lado: 'e', tamanho: 3, cor: 'colorida' },
  { tipo: 'tatuar', desenho: 'kraken', regiao: 'costas_media', tamanho: 3 },
];
for (const a of pedidos) v = executar(v, a).vida;
const ts = tatuagensNaFigura(v);
const fig = (extra: Record<string, unknown>, w: number) => renderToStaticMarkup(<Figura visual={v.eu.visual} genero={v.eu.genero} idade={30} semente="eu" corpo={tipoDeCorpo(v)} pecas={[]} tatuagens={ts as never} largura={w} {...extra} />);
const lupas = (['pulso:e', 'antebraco:e', 'biceps:d', 'mao:d', 'panturrilha:d', 'costas_alta:', 'peitoral:e', 'coxa:e'] as const).map(x => { const [r, l] = x.split(':'); const vista = r.startsWith('costas') || r === 'panturrilha' ? 'costas' : 'frente'; return fig({ foco: focoDaRegiao(v.eu.genero, tipoDeCorpo(v), 30, r as never, (l || undefined) as never, vista, 1.8), vista }, 220); });
writeFileSync(process.env.OUT!, `<!doctype html><meta charset=utf-8><body style="margin:8px;background:#f4efe6;display:flex;flex-wrap:wrap;gap:8px;width:1500px">${fig({}, 260)}${fig({ vista: 'costas' }, 260)}${lupas.join('')}<p>${ts.length} tatuagens</p></body>`);
})();
