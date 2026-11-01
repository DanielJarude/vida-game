/**
 * 12.4.1 — A LOJA POR DENTRO: uma linha por produto, com a marca escolhida no próprio produto (o preço muda com ela) e o
 * desenho do que é — o objeto, ou a peça vestida em você (a mesma figura de Você · Aparência). Comprar muda só aquela
 * linha ("É seu"): a lista não se reordena, os filtros e a página continuam onde estavam (as escolhas de cada linha
 * moram na linha, chaveada pelo produto).
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { coisa } from '../../../motor/dados/coisas';
import { itemEstilo } from '../../../motor/dados/estilo';
import { estabelecimento, marca as marcaPorId, NOME_CATEGORIA, NOME_FAIXA, type CategoriaDeProduto, type Faixa } from '../../../motor/dados/lojas';
import { categoriaDoProduto, ofertasDaLoja, type Oferta } from '../../../motor/sistemas/lojas';
import { temCoisa } from '../../../motor/sistemas/coisas';
import { temItem } from '../../../motor/sistemas/estilo';
import { tipoDeCorpo } from '../../../motor/sistemas/silhueta';
import { variantesDaCoisa } from '../../../motor/dados/pertences';
import { municipio } from '../../../motor/dados/lugares';
import { BotaoAcao, Escolha } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { DesenhoObjeto } from './Objetos';
import { Figura } from '../../avatar/Figura';

const POR_PAGINA = 18;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Linha { chave: string; produto: Oferta['produto']; ofertas: Oferta[]; categoria: CategoriaDeProduto }

export function LojaDaVida({ vida, agir, lojaId }: { vida: Vida; agir: (a: Acao) => boolean; lojaId: string }) {
  const e = estabelecimento(lojaId)!;
  const [cat, setCat] = useState<CategoriaDeProduto | ''>('');
  const [faixa, setFaixa] = useState<string>('');
  const [quantos, setQuantos] = useState(POR_PAGINA);
  // As ofertas dependem da cidade e do mercado (não do saldo): calculadas uma vez por cidade — a compra não as recria.
  const linhas = useMemo<Linha[]>(() => {
    const por = new Map<string, Linha>();
    for (const o of ofertasDaLoja(vida, lojaId)) {
      const chave = `${o.produto.tipo}:${o.produto.id}`;
      const l = por.get(chave) ?? { chave, produto: o.produto, ofertas: [], categoria: categoriaDoProduto(o.produto)! };
      l.ofertas.push(o);
      por.set(chave, l);
    }
    for (const l of por.values()) l.ofertas.sort((a, b) => a.preco - b.preco);
    return [...por.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lojaId, vida.moradia.municipioId]);
  const cats = [...new Set(linhas.map(l => l.categoria))];
  const faixas = [...new Set(linhas.flatMap(l => l.ofertas.map(o => (o.marca ? marcaPorId(o.marca)!.faixa : 1))))].sort() as Faixa[];
  const visiveis = linhas.filter(l => (!cat || l.categoria === cat) && (!faixa || l.ofertas.some(o => String(o.marca ? marcaPorId(o.marca)!.faixa : 1) === faixa)));
  const i = idade(vida);
  return (
    <div className="loja-estilo loja-vida" data-loja={lojaId}>
      <p className="nota">
        {e.tipo === 'online' ? `Pela internet: ${e.prazo ?? 'chega em dias'}, com frete. Marca que não tem loja em ${municipio(vida.moradia.municipioId).nome} vem importada (mais cara).`
          : e.tipo === 'departamento' ? 'Uma loja grande, com várias seções e as marcas de preço médio que o país tem.'
            : 'O que se compra aqui fica com você: dá para usar, guardar e (o objeto) vender usado.'}
        {' '}O preço muda com a marca: escolha a marca no próprio produto.
      </p>
      {cats.length > 1 && <Escolha rotulo="Seção" valor={cat} aoMudar={x => { setCat(x); setQuantos(POR_PAGINA); }} opcoes={[{ id: '' as const, rotulo: 'Tudo' }, ...cats.map(c => ({ id: c, rotulo: NOME_CATEGORIA[c] }))]} />}
      {faixas.length > 1 && <Escolha rotulo="Faixa de preço" valor={faixa} aoMudar={x => { setFaixa(x); setQuantos(POR_PAGINA); }} opcoes={[{ id: '', rotulo: 'Todas' }, ...faixas.map(f => ({ id: String(f), rotulo: cap(NOME_FAIXA[f]) }))]} />}
      <ul className="ofertas">
        {visiveis.slice(0, quantos).map(l => <ProdutoNaLoja key={l.chave} vida={vida} agir={agir} linha={l} lojaId={lojaId} faixa={faixa} crianca={i < 12} />)}
      </ul>
      {visiveis.length > quantos && <button type="button" className="botao botao--discreto" onClick={() => setQuantos(q => q + POR_PAGINA)}>Ver mais ({visiveis.length - quantos})</button>}
      {!visiveis.length && <p className="nota">Nada nesta seção.</p>}
    </div>
  );
}

function ProdutoNaLoja({ vida, agir, linha, lojaId, faixa, crianca }: { vida: Vida; agir: (a: Acao) => boolean; linha: Linha; lojaId: string; faixa: string; crianca: boolean }) {
  const opcoes = faixa ? linha.ofertas.filter(o => String(o.marca ? marcaPorId(o.marca)!.faixa : 1) === faixa) : linha.ofertas;
  const [escolhida, setEscolhida] = useState(opcoes[0]?.marca ?? '');
  const o = opcoes.find(x => (x.marca ?? '') === escolhida) ?? opcoes[0];
  if (!o) return null;
  const p = linha.produto;
  const it = p.tipo === 'item' ? itemEstilo(p.id) : undefined;
  const c = p.tipo === 'coisa' ? coisa(p.id) : undefined;
  const nome = cap(it?.nome ?? c?.nome ?? p.id);
  const descricao = it?.descricao ?? c?.descricao ?? '';
  const tem = p.tipo === 'item' ? temItem(vida, p.id) : temCoisa(vida, p.id) && p.id !== 'discos';
  const meu = p.tipo === 'item' ? vida.eu.estilo?.itens.find(y => y.itemId === p.id) : undefined;
  const meuCoisa = p.tipo === 'coisa' ? vida.financas.coisas?.find(y => y.coisaId === p.id) : undefined;
  const marcaDoMeu = meu?.marca ?? meuCoisa?.marca;
  const acao: Acao = p.tipo === 'item' ? { tipo: 'comprar_item', itemId: p.id, loja: lojaId, ...(o.marca ? { marca: o.marca } : {}) } : { tipo: 'comprar_coisa', coisaId: p.id, loja: lojaId, ...(o.marca ? { marca: o.marca } : {}) };
  const vestivel = !!it && (it.categoria === 'roupa' || it.categoria === 'acessorio');
  return (
    <li className="oferta oferta--estilo oferta--objeto loja-vida__produto" data-produto={p.id}>
      <span className="oferta__objeto">
        {c && <DesenhoObjeto coisaId={c.id} cor={variantesDaCoisa(c.id)[0].cor} tamanho={64} rotulo={c.nome} />}
        {vestivel && <Figura visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} corpo={tipoDeCorpo(vida)} pecas={[{ itemId: p.id, id: `${p.id}-vitrine` }]} largura={56} semFundo rotulo={`${nome} em você`} />}
      </span>
      <span className="oferta__texto">
        <strong>{nome}{it?.luxo ? <span className="etiqueta-luxo">luxo</span> : null}</strong>
        <span>{descricao}</span>
        {linha.ofertas.length > 1 && !tem && (
          <label className="campo campo--compacto"><span className="campo__rotulo">Marca</span>
            <select value={o.marca ?? ''} onChange={ev => setEscolhida(ev.target.value)}>
              {opcoes.map(x => <option key={x.marca ?? '-'} value={x.marca ?? ''}>{x.marca ? marcaPorId(x.marca)!.nome : 'Sem marca'} — {dinheiroCurto(x.preco)} ({x.marca ? NOME_FAIXA[marcaPorId(x.marca)!.faixa] : 'popular'}{x.importado ? ', importado' : ''})</option>)}
            </select>
          </label>
        )}
        {linha.ofertas.length === 1 && o.marca && <span className="nota">{marcaPorId(o.marca)!.nome}{o.importado ? ' · importado' : ''}</span>}
      </span>
      <span className="oferta__preco">{dinheiroCurto(o.preco)}</span>
      {tem ? (
        <span className="loja-estilo__seu">
          <span className="nota">É seu{marcaDoMeu ? ` (${marcaPorId(marcaDoMeu)?.nome ?? marcaDoMeu})` : ''}{meu ? (meu.usando ? ' · em uso' : ' · guardado') : ''}.</span>
          {meu && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: p.id, usar: !meu.usando }} agir={agir} variante="discreto">{meu.usando ? 'Guardar' : 'Usar'}</BotaoAcao>}
        </span>
      ) : <BotaoAcao vida={vida} acao={acao} agir={agir} variante="secundario" ocultarImpossivel={crianca}>Comprar</BotaoAcao>}
    </li>
  );
}
