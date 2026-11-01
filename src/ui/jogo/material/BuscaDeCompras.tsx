/**
 * HOTFIX 11.5.1 — A BUSCA DE COMPRAS: procurar um produto (ou uma marca, ou uma loja) em TODAS as lojas da vida de uma
 * vez, filtrar por categoria, marca e faixa de preço, ordenar por relevância ou preço — e comparar as ofertas (cada
 * loja, cada marca, o preço de cada uma) antes de comprar, ali mesmo. A busca e os filtros moram na memória da aba
 * (`memoriaDeCompras`): comprar não leva ao topo, sair e voltar não apaga nada. Os resultados vêm do motor
 * (`lojas.indiceDeCompras`, `lojas.buscarNasLojas`) e não dependem do saldo: a lista não se reordena ao comprar.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { coisa } from '../../../motor/dados/coisas';
import { estabelecimento, marca as marcaPorId, NOME_CATEGORIA, NOME_FAIXA, type CategoriaDeProduto } from '../../../motor/dados/lojas';
import { buscarLojas, buscarNasLojas, FAIXAS_DE_PRECO, indiceDeCompras, SEGMENTOS, type OrdemDeCompras, type ProdutoNasLojas, type SegmentoDeCompras } from '../../../motor/sistemas/lojas';
import { temCoisa } from '../../../motor/sistemas/coisas';
import { temItem } from '../../../motor/sistemas/estilo';
import { variantesDaCoisa } from '../../../motor/dados/pertences';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { DesenhoObjeto } from './Objetos';
import type { QualLugar } from './Lugares';
import type { EstadoDeCompras } from '../memoriaDeCompras';

const POR_PAGINA = 15;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Props { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void; estado: EstadoDeCompras; mudar: (x: Partial<EstadoDeCompras>) => void }

export function BuscaDeCompras({ vida, agir, abrir, estado, mudar }: Props) {
  // O índice depende da cidade (o mercado, o tamanho dela), não do dinheiro: comprar não o refaz.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const indice = useMemo(() => indiceDeCompras(vida), [vida.moradia.municipioId, vida.id]);
  const [quantos, setQuantos] = useState(POR_PAGINA);
  const seg = SEGMENTOS.find(s => s.id === estado.segmento && s.categorias.length);
  const faixa = FAIXAS_DE_PRECO.find(f => f.id === estado.faixa);
  const ativo = !!(estado.texto.trim() || estado.categoria || estado.marca || estado.faixa);
  const filtro = { texto: estado.texto, categoria: estado.categoria as CategoriaDeProduto | '', marca: estado.marca || undefined, precoMin: faixa?.min, precoMax: faixa?.max, ordem: estado.ordem, segmento: (seg?.id ?? '') as SegmentoDeCompras | '' };
  const resultados = useMemo(() => (ativo ? buscarNasLojas(indice, filtro) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [indice, ativo, estado.texto, estado.categoria, estado.marca, estado.faixa, estado.ordem, seg?.id]);
  const lojas = estado.texto.trim() ? buscarLojas(vida, estado.texto) : [];
  const categorias = (seg ? seg.categorias : SEGMENTOS.flatMap(s => s.categorias)).filter(c => indice.some(x => x.categoria === c));
  const marcas = useMemo(() => [...new Set(indice.filter(x => !estado.categoria || x.categoria === estado.categoria).filter(x => !seg || seg.categorias.includes(x.categoria)).flatMap(x => x.marcas))].map(id => marcaPorId(id)!).filter(Boolean).sort((a, b) => a.nome.localeCompare(b.nome)), [indice, estado.categoria, seg]);
  const muda = (x: Partial<EstadoDeCompras>) => { setQuantos(POR_PAGINA); mudar(x); };
  const nLojas = new Set(resultados.flatMap(r => r.lojas)).size;
  return (
    <section className="busca-compras" role="search" aria-label="Buscar nas lojas">
      <label className="busca-compras__campo">
        <span className="busca-compras__rotulo">{seg ? `Buscar em ${seg.nome.toLowerCase()}` : 'Buscar nas lojas'}</span>
        <input type="search" value={estado.texto} onChange={e => muda({ texto: e.target.value })} placeholder="Produto, marca ou loja: tênis, Samsung, ótica…" autoComplete="off" />
      </label>
      <div className="busca-compras__filtros">
        <label className="campo campo--compacto"><span className="campo__rotulo">Categoria</span>
          <select value={estado.categoria} onChange={e => muda({ categoria: e.target.value, marca: '' })}>
            <option value="">Todas</option>
            {(seg ? [seg] : SEGMENTOS.filter(s => s.categorias.length)).map(s => (
              <optgroup key={s.id} label={s.nome}>{s.categorias.filter(c => categorias.includes(c)).map(c => <option key={c} value={c}>{NOME_CATEGORIA[c]}</option>)}</optgroup>
            ))}
          </select>
        </label>
        <label className="campo campo--compacto"><span className="campo__rotulo">Marca</span>
          <select value={estado.marca} onChange={e => muda({ marca: e.target.value })}>
            <option value="">Todas</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </label>
        <label className="campo campo--compacto"><span className="campo__rotulo">Preço</span>
          <select value={estado.faixa} onChange={e => muda({ faixa: e.target.value })}>
            {FAIXAS_DE_PRECO.map(f => <option key={f.id} value={f.id}>{f.rotulo}</option>)}
          </select>
        </label>
        <label className="campo campo--compacto"><span className="campo__rotulo">Ordenar</span>
          <select value={estado.ordem} onChange={e => muda({ ordem: e.target.value as OrdemDeCompras })}>
            <option value="relevancia">Relevância</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </label>
        {ativo && <button type="button" className="botao botao--discreto busca-compras__limpar" onClick={() => muda({ texto: '', categoria: '', marca: '', faixa: '' })}>Limpar busca</button>}
      </div>
      {ativo && (
        <div className="busca-compras__resultados" aria-live="polite">
          {lojas.length > 0 && (
            <p className="busca-compras__lojas"><span className="nota">Lojas:</span> {lojas.map(e => <button key={e.id} type="button" className="busca-compras__loja" onClick={() => abrir(`loja:${e.id}` as QualLugar)}>{e.nome}</button>)}</p>
          )}
          <p className="nota busca-compras__conta">{resultados.length ? `${resultados.length} ${resultados.length === 1 ? 'produto' : 'produtos'} em ${nLojas} ${nLojas === 1 ? 'loja' : 'lojas'}` : 'Nada encontrado com esses filtros nas lojas daqui (nem pela internet).'}</p>
          <ul className="busca-compras__lista">
            {resultados.slice(0, quantos).map(r => <Resultado key={`${r.produto.tipo}:${r.produto.id}`} vida={vida} agir={agir} abrir={abrir} r={r} marcaFiltro={estado.marca} faixa={faixa} />)}
          </ul>
          {resultados.length > quantos && <button type="button" className="botao botao--discreto" onClick={() => setQuantos(q => q + POR_PAGINA)}>Ver mais ({resultados.length - quantos})</button>}
        </div>
      )}
    </section>
  );
}

/** Um produto encontrado: o melhor preço, onde, e — aberto — todas as ofertas para comparar e comprar. */
function Resultado({ vida, agir, abrir, r, marcaFiltro, faixa }: { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void; r: ProdutoNasLojas & { melhor: ProdutoNasLojas['ofertas'][number] }; marcaFiltro: string; faixa?: { min?: number; max?: number } }) {
  const ofertas = r.ofertas.filter(o => (!marcaFiltro || o.marca === marcaFiltro) && (faixa?.min === undefined || o.preco >= faixa.min) && (faixa?.max === undefined || o.preco <= faixa.max));
  const [escolha, setEscolha] = useState(`${r.melhor.loja}|${r.melhor.marca ?? ''}`);
  const o = ofertas.find(x => `${x.loja}|${x.marca ?? ''}` === escolha) ?? r.melhor;
  const p = r.produto;
  const c = p.tipo === 'coisa' ? coisa(p.id) : undefined;
  const tem = p.tipo === 'item' ? temItem(vida, p.id) : temCoisa(vida, p.id) && p.id !== 'discos';
  const e = estabelecimento(o.loja)!;
  const nomeMarca = (id?: string) => (id ? marcaPorId(id)?.nome ?? id : 'sem marca');
  const acao: Acao = p.tipo === 'item' ? { tipo: 'comprar_item', itemId: p.id, loja: o.loja, ...(o.marca ? { marca: o.marca } : {}) } : { tipo: 'comprar_coisa', coisaId: p.id, loja: o.loja, ...(o.marca ? { marca: o.marca } : {}) };
  const lojasDistintas = new Set(ofertas.map(x => x.loja)).size;
  return (
    <li className="busca-compras__item" data-produto={p.id}>
      <span className="busca-compras__desenho" aria-hidden>
        {c ? <DesenhoObjeto coisaId={c.id} cor={variantesDaCoisa(c.id)[0].cor} tamanho={52} rotulo={c.nome} /> : <span className={`busca-compras__selo busca-compras__selo--${r.categoria}`}>{NOME_CATEGORIA[r.categoria].slice(0, 1)}</span>}
      </span>
      <span className="busca-compras__texto">
        <strong>{cap(r.nome)}{r.luxo ? <span className="etiqueta-luxo">luxo</span> : null}</strong>
        <span className="nota">{NOME_CATEGORIA[r.categoria]} · {lojasDistintas} {lojasDistintas === 1 ? 'loja' : 'lojas'} · {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}{ofertas.length > 1 ? ` · de ${dinheiroCurto(ofertas[0].preco)} a ${dinheiroCurto(ofertas[ofertas.length - 1].preco)}` : ''}</span>
        {!tem && ofertas.length > 1 && (
          <label className="campo campo--compacto"><span className="campo__rotulo">Comparar ofertas</span>
            <select value={`${o.loja}|${o.marca ?? ''}`} onChange={ev => setEscolha(ev.target.value)}>
              {ofertas.map(x => <option key={`${x.loja}|${x.marca ?? ''}`} value={`${x.loja}|${x.marca ?? ''}`}>{dinheiroCurto(x.preco)} — {nomeMarca(x.marca)} ({x.marca ? NOME_FAIXA[marcaPorId(x.marca)!.faixa] : 'popular'}), {estabelecimento(x.loja)?.nome}{estabelecimento(x.loja)?.tipo === 'online' ? ' · internet' : ''}{x.importado ? ' · importado' : ''}</option>)}
            </select>
          </label>
        )}
        <span className="nota busca-compras__onde">{nomeMarca(o.marca)} · <button type="button" className="link" onClick={() => abrir(`loja:${o.loja}` as QualLugar)}>{e.nome}</button>{e.tipo === 'online' ? ` · pela internet, ${e.prazo ?? 'chega em dias'}` : ' · na cidade'}{o.importado ? ' · importado' : ''}</span>
      </span>
      <span className="oferta__preco">{dinheiroCurto(o.preco)}</span>
      {tem ? <span className="nota busca-compras__seu">É seu.</span> : <BotaoAcao vida={vida} acao={acao} agir={agir} variante="secundario" ocultarImpossivel={idade(vida) < 12}>Comprar</BotaoAcao>}
    </li>
  );
}
