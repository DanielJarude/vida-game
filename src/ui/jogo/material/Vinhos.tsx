/**
 * 12.8.1 — A IMPORTADORA DE VINHOS POR DENTRO: a mesma organização das outras lojas (a loja de roupas): as seções em
 * botões (tintos, brancos, rosés, espumantes, fortificados e de sobremesa), a busca, o preço e a ordem, e cada garrafa
 * num cartão com o desenho dela. O que se vê em cada peça (quem fez, a safra, a uva, a raridade, a revenda) e a compra
 * são os da coleção (`colecao_comprar`), como antes.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { colecao, temAdega, type OfertaDeColecao } from '../../../motor/sistemas/colecao';
import { NOME_RARIDADE, pecaDeColecao, type EstiloDeVinho } from '../../../motor/dados/colecionaveis';
import { FAIXAS_DE_PRECO, normalizarBusca, type OrdemDeCompras } from '../../../motor/sistemas/lojas';
import { BotaoAcao, Escolha } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import '../../catalogo.css';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ESTILOS: { id: EstiloDeVinho; nome: string; um: string }[] = [
  { id: 'tinto', nome: 'Tintos', um: 'Tinto' }, { id: 'branco', nome: 'Brancos', um: 'Branco' }, { id: 'rose', nome: 'Rosés', um: 'Rosé' },
  { id: 'espumante', nome: 'Espumantes', um: 'Espumante' }, { id: 'fortificado', nome: 'Fortificados e de sobremesa', um: 'Fortificado ou de sobremesa' }
];
export const estiloDoVinho = (o: Pick<OfertaDeColecao, 'pecaId'>): EstiloDeVinho => pecaDeColecao(o.pecaId)?.estilo ?? 'tinto';

export function ImportadoraDeVinhos({ vida, agir, ofertas }: { vida: Vida; agir: (a: Acao) => boolean; ofertas: OfertaDeColecao[] }) {
  const [estilo, setEstilo] = useState<EstiloDeVinho | ''>('');
  const [texto, setTexto] = useState('');
  const [preco, setPreco] = useState('');
  const [ordem, setOrdem] = useState<OrdemDeCompras>('relevancia');
  const estilos = ESTILOS.filter(e => ofertas.some(o => estiloDoVinho(o) === e.id));
  const faixa = FAIXAS_DE_PRECO.find(f => f.id === preco);
  const q = normalizarBusca(texto);
  const busca = (o: OfertaDeColecao) => normalizarBusca([o.nome, o.fabricante, o.periodo, o.material, pecaDeColecao(o.pecaId)?.descricao].filter(Boolean).join(' '));
  const visiveis = ofertas
    .filter(o => (!estilo || estiloDoVinho(o) === estilo) && (faixa?.min === undefined || o.preco >= faixa.min) && (faixa?.max === undefined || o.preco <= faixa.max) && (!q || q.split(/\s+/).every(t => busca(o).includes(t))))
    .sort((a, b) => (ordem === 'menor' ? a.preco - b.preco : ordem === 'maior' ? b.preco - a.preco : 0));
  const naAdega = new Map<string, number>();
  for (const c of colecao(vida)) if (c.categoria === 'vinho') naAdega.set(c.pecaId, (naAdega.get(c.pecaId) ?? 0) + 1);
  return (
    <div className="loja-vida loja-vinhos" data-loja="vinhos">
      {!temAdega(vida) && <p className="nota">Sem adega em casa, o vinho de guarda envelhece mal: perde valor todo ano. A adega climatizada se compra na loja da casa.</p>}
      <label className="busca-compras__campo loja-vida__busca">
        <span className="busca-compras__rotulo">Buscar nesta loja</span>
        <input type="search" value={texto} onChange={ev => setTexto(ev.target.value)} placeholder="Vinho, uva ou região" autoComplete="off" />
      </label>
      {estilos.length > 1 && <Escolha rotulo="Estilo do vinho" valor={estilo} aoMudar={setEstilo} opcoes={[{ id: '' as const, rotulo: 'Tudo' }, ...estilos.map(e => ({ id: e.id, rotulo: e.nome }))]} />}
      <div className="busca-compras__filtros">
        <label className="campo campo--compacto"><span className="campo__rotulo">Preço</span>
          <select value={preco} onChange={ev => setPreco(ev.target.value)}>{FAIXAS_DE_PRECO.map(f => <option key={f.id} value={f.id}>{f.rotulo}</option>)}</select>
        </label>
        <label className="campo campo--compacto"><span className="campo__rotulo">Ordenar</span>
          <select value={ordem} onChange={ev => setOrdem(ev.target.value as OrdemDeCompras)}><option value="relevancia">Como na loja</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option></select>
        </label>
      </div>
      <p className="nota">{visiveis.length} {visiveis.length === 1 ? 'vinho' : 'vinhos'}{texto || preco || estilo ? ' com esses filtros' : ''}.</p>
      <ul className="catalogo-loja">
        {visiveis.map(o => {
          const e = estiloDoVinho(o);
          const p = pecaDeColecao(o.pecaId);
          const tem = naAdega.get(o.pecaId) ?? 0;
          return (
            <li key={o.id} className={`catalogo-loja__cartao${o.faixa >= 2 ? ' catalogo-loja__cartao--luxo' : ''}`} data-produto={o.pecaId} data-estilo={e}>
              <span className="catalogo-loja__imagem"><GarrafaDeVinho estilo={e} caixa={/^caixa/.test(o.nome)} rotulo={o.nome} /></span>
              <span className="catalogo-loja__selos">
                <span className={`catalogo-loja__selo catalogo-loja__selo--nivel-${Math.min(6, o.faixa + 2)}`}>{cap(NOME_RARIDADE[o.raridade])}</span>
                {o.canal === 'privada' && <span className="catalogo-loja__selo catalogo-loja__selo--edicao">Sob consulta</span>}
              </span>
              <strong className="catalogo-loja__nome">{cap(o.nome)}</strong>
              <span className="catalogo-loja__categoria nota">{ESTILOS.find(x => x.id === e)!.um} · {o.material}</span>
              <span className="catalogo-loja__descricao">{p?.descricao}</span>
              <span className="catalogo-loja__marca-perfil nota">{cap([o.fabricante, o.periodo].filter(Boolean).join(' · '))}. Revenda {o.liquidez === 'alta' ? 'rápida' : o.liquidez === 'media' ? 'em semanas' : 'lenta'}; depois de comprado, deve valer uns {dinheiroCurto(o.valorEstimado)} — não é promessa.</span>
              <span className="catalogo-loja__preco">{dinheiroCurto(o.preco)}</span>
              <span className="catalogo-loja__acoes">
                {tem > 0 && <span className="nota">Na sua adega: {tem}.</span>}
                <BotaoAcao vida={vida} acao={{ tipo: 'colecao_comprar', ofertaId: o.id }} agir={agir} variante="secundario">Comprar</BotaoAcao>
              </span>
            </li>
          );
        })}
      </ul>
      {!visiveis.length && <p className="nota">Nenhum vinho com esses filtros.</p>}
    </div>
  );
}

/** A garrafa de cada estilo (o vidro, o líquido, o rótulo, a cápsula); a caixa de madeira na frente quando é caixa. */
const GARRAFA: Record<EstiloDeVinho, { vidro: string; capsula: string; rotulo: string; corpo: string; liquido?: string }> = {
  tinto: { vidro: '#2a3a28', capsula: '#7a1f2a', rotulo: '#efe6d2', corpo: 'M24 34c0-8 4-10 4-16V6h4v12c0 6 4 8 4 16v74q0 4-4 4h-4q-4 0-4-4z' },
  branco: { vidro: '#c9d39a', capsula: '#c9a23a', rotulo: '#f6f2e6', corpo: 'M23 44c0-12 5-18 5-26V6h4v12c0 8 5 14 5 26v64q0 4-4 4h-6q-4 0-4-4z', liquido: '#e9dc8e' },
  rose: { vidro: '#f3e3e1', capsula: '#d97a8a', rotulo: '#ffffff', corpo: 'M23 40c0-10 5-14 5-22V6h4v12c0 8 5 12 5 22v68q0 4-4 4h-6q-4 0-4-4z', liquido: '#f0a7ae' },
  espumante: { vidro: '#1f3324', capsula: '#d8b65a', rotulo: '#f2ead8', corpo: 'M21 48c0-14 6-20 6-30V4h6v14c0 10 6 16 6 30v60q0 4-4 4h-10q-4 0-4-4z' },
  fortificado: { vidro: '#3a2416', capsula: '#5b1420', rotulo: '#e8dcc0', corpo: 'M22 40c0-8 5-12 5-20V8h6v12c0 8 5 12 5 20v68q0 4-4 4h-8q-4 0-4-4z' }
};
export function GarrafaDeVinho({ estilo, caixa, rotulo }: { estilo: EstiloDeVinho; caixa?: boolean; rotulo: string }) {
  const g = GARRAFA[estilo];
  const garrafa = (dx: number) => (
    <g transform={`translate(${dx} 0)`}>
      <path d={g.corpo} fill={g.vidro} stroke="#1b1a18" strokeWidth={0.8} strokeOpacity={0.5} />
      {g.liquido && <path d="M25 70h10v38q0 2-2 2h-6q-2 0-2-2z" fill={g.liquido} opacity={0.75} />}
      <path d="M27.4 5h5.2v14h-5.2z" fill={g.capsula} />
      {estilo === 'espumante' && <path d="M26 4h8v24c-2 2-6 2-8 0z" fill={g.capsula} />}
      {estilo === 'fortificado' && <path d="M26 8q4-4 8 0v6q-4 3-8 0z" fill={g.capsula} />}
      <rect x={24.5} y={68} width={11} height={22} rx={1} fill={g.rotulo} />
      <path d="M26.5 74h7M26.5 78h7M27.5 84h5" stroke={g.capsula} strokeWidth={1} />
      <path d="M27 40v22" stroke="#ffffff" strokeWidth={1.4} opacity={0.25} strokeLinecap="round" />
    </g>
  );
  return (
    <svg className="garrafa-vinho" viewBox="0 0 90 120" width={84} height={112} role="img" aria-label={rotulo} data-estilo={estilo}>
      <ellipse cx={45} cy={114} rx={caixa ? 38 : 13} ry={3} fill="#000000" opacity={0.15} />
      {caixa ? <>{garrafa(-3)}{garrafa(15)}{garrafa(33)}<rect x={10} y={84} width={70} height={28} rx={1.5} fill="#b98a5a" stroke="#7a5534" strokeWidth={0.8} /><path d="M10 93h70M10 102h70M33 84v28M57 84v28" stroke="#8f6640" strokeWidth={0.7} /></> : garrafa(15)}
    </svg>
  );
}
