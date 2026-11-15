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
import { itemEstilo, lugaresDoItem, nivelDoItem, TIPOS_DE_PECA, tipoDePeca } from '../../../motor/dados/estilo';
import { segmentoDoNivel } from '../../../motor/dados/lar';
import { categoriaDaCasa, nomeDaCategoriaDaCasa } from '../../../motor/dados/categoriasDaCasa';
import { TIPOS_DE_MOVEL, nomeDoTipoDeMovel, tipoDeMovel } from '../../../motor/dados14/moveis/catalogo';
import { AMBIENTES22, ambientesDoProduto, nomeDoAmbiente } from '../../../motor/dados22/moveis/ambientes22';
import { Conjuntos14, EncaixeNaLoja14, FuncaoNaLoja17 } from '../../v14/moveis/Moveis14';
import { funcaoDe17 } from '../../../motor/v14/moveis/funcoes17';
import { leituraDaMarca, segmentoDaMarca } from '../../../motor/sistemas/perfilDaMarca';
import { NOME_SEGMENTO_DE_MARCA, NOME_QUALIDADE, type SegmentoDeMarca } from '../../../motor/dados/perfisDeMarca';
import { MiniaturaDaPeca, visualComPecaDoRosto } from '../../avatar/MiniaturaDaPeca';
import { estabelecimento, marca as marcaPorId, NOME_CATEGORIA, type CategoriaDeProduto } from '../../../motor/dados/lojas';
import { categoriaDoProduto, FAIXAS_DE_PRECO, nomeDoProduto, normalizarBusca, ofertasDaLoja, type Oferta, type OrdemDeCompras } from '../../../motor/sistemas/lojas';
import { memoriaDasLojas, type EstadoDaLoja } from '../memoriaDeCompras';
import { temCoisa } from '../../../motor/sistemas/coisas';
import { nivelDaCoisa } from '../../../motor/sistemas/lar';
import type { CoisaTida } from '../../../motor/tipos';
import { sementeDaPeca, temItem } from '../../../motor/sistemas/estilo';
import { construcaoDaPeca, coresDoItem, corPrincipalDa, nomesDasCores, varianteDaCor, varianteDaVitrine } from '../../avatar/pecas';
import { tipoDeCorpo } from '../../../motor/sistemas/silhueta';
import { variantesDaCoisa } from '../../../motor/dados/pertences';
import { municipio } from '../../../motor/dados/lugares';
import { BotaoAcao, Escolha } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { DesenhoObjeto } from './Objetos';
import { Figura } from '../../avatar/Figura';
import { tatuagensNaFigura } from '../../../motor/sistemas/tatuagens';
import '../../catalogo.css';
import { furoDaJoia, furoFeito } from '../../../motor/v14/aparencia/piercings14';
import { irAosPiercings } from '../../v14/aparencia/irAosPiercings';

const POR_PAGINA = 18;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Linha { chave: string; produto: Oferta['produto']; ofertas: Oferta[]; categoria: CategoriaDeProduto }

export function LojaDaVida({ vida, agir, lojaId }: { vida: Vida; agir: (a: Acao) => boolean; lojaId: string }) {
  const e = estabelecimento(lojaId)!;
  // HOTFIX 11.5.1: a busca, os filtros (seção, faixa da marca, marca, preço), a ordem e a página moram na memória da
  // loja — fechar e abrir de novo, ou comprar, deixa tudo onde estava.
  const [m, setM] = useState<EstadoDaLoja>(() => memoriaDasLojas.get(lojaId) ?? { texto: '', cat: '', faixa: '', marca: '', preco: '', ordem: 'relevancia', quantos: POR_PAGINA });
  const mudar = (x: Partial<EstadoDaLoja>) => setM(o => { const n = { ...o, ...x }; memoriaDasLojas.set(lojaId, n); return n; });
  const cat = m.cat as CategoriaDeProduto | '', faixa = m.faixa, quantos = m.quantos, tipo = m.tipo ?? '';
  // 12.9: o provador mostra a MESMA variante (a cor) escolhida no cartão — `${itemId}|${variante}`.
  // VIDA 22: o provador guarda VÁRIAS peças — a combinação (uma por parte do corpo) e as alternativas da mesma parte, para comparar lado a lado.
  const [provador, setProvador] = useState<ItemDoProvador[]>([]);
  const setQuantos = (f: (q: number) => number) => mudar({ quantos: f(m.quantos) });
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
  // 12.8: o posicionamento da marca (econômico, intermediário, premium, luxo, ultraluxo) no lugar das quatro faixas.
  const segDe = (o: Oferta) => (o.marca ? segmentoDaMarca(o.marca) ?? 1 : 1);
  const faixas = [...new Set(linhas.flatMap(l => l.ofertas.map(segDe)))].sort() as SegmentoDeMarca[];
  const marcas = [...new Set(linhas.filter(l => !cat || l.categoria === cat).flatMap(l => l.ofertas.map(o => o.marca)).filter((x): x is string => !!x))].sort((a, b) => marcaPorId(a)!.nome.localeCompare(marcaPorId(b)!.nome));
  const preco = FAIXAS_DE_PRECO.find(f => f.id === m.preco);
  const q = normalizarBusca(m.texto);
  const passa = (o: Oferta) => (!faixa || String(segDe(o)) === faixa) && (!m.marca || o.marca === m.marca) && (preco?.min === undefined || o.preco >= preco.min) && (preco?.max === undefined || o.preco <= preco.max);
  // 12.7: o tipo de peça (só nas lojas que vendem roupa): uma escolha, sem subcategoria.
  const tipoDe = (l: Linha) => (l.produto.tipo === 'item' ? tipoDePeca(itemEstilo(l.produto.id)!) : undefined);
  const tipos = TIPOS_DE_PECA.filter(t => linhas.some(l => tipoDe(l) === t.id));
  // 12.8.1: na loja da casa, a categoria do móvel (sala e estar, quarto, cozinha e jantar… — como o tipo de peça da
  // roupa): só as que têm produto nesta loja, nenhuma vazia, nenhum produto sem.
  // VIDA 14: agrupado pelo TIPO de móvel (todos os sofás juntos, todas as poltronas juntas...), não pelo cômodo.
  const ambienteDe = (l: Linha) => (l.produto.tipo === 'coisa' && (l.categoria === 'moveis' || l.categoria === 'eletrodomesticos') ? tipoDeMovel(l.produto.id, l.categoria === 'eletrodomesticos') as string : undefined);
  // VIDA 22: na loja da casa, o primeiro filtro é o AMBIENTE (sala de estar, quarto, banheiro, área externa…); o tipo de
  // móvel vem depois, só com os tipos que existem no ambiente escolhido. Um produto pode estar em dois ambientes (a
  // mesma linha, a mesma compra).
  const daCasa = (l: Linha) => l.produto.tipo === 'coisa' && (l.categoria === 'moveis' || l.categoria === 'eletrodomesticos');
  const amb22De = (l: Linha) => (daCasa(l) ? ambientesDoProduto(l.produto.id) : []);
  const ambientes22 = AMBIENTES22.filter(a => linhas.some(l => amb22De(l).includes(a.id)));
  const ambiente22 = ambientes22.some(a => a.id === m.ambiente22) ? m.ambiente22! : '';
  const noAmbiente = (l: Linha) => !ambiente22 || amb22De(l).includes(ambiente22 as never);
  const ambientes = TIPOS_DE_MOVEL.filter(a => linhas.some(l => noAmbiente(l) && ambienteDe(l) === a.id));
  const ambiente = ambientes.some(a => a.id === m.ambiente) ? m.ambiente! : '';
  // A roupa se escolhe pelo tipo de peça e a casa pela categoria; a seção fica para o resto (a loja de departamento:
  // eletrônicos, esporte…).
  const secoes = cats.filter(c => !(tipos.length > 1 && ['vestuario', 'calcados', 'acessorios', 'otica', 'relogios', 'joias'].includes(c)) && !((ambientes.length > 1 || ambientes22.length > 1) && (c === 'moveis' || c === 'eletrodomesticos')));
  const nivelDe = (l: Linha) => { const o = l.ofertas.filter(passa)[0] ?? l.ofertas[0]; return l.produto.tipo === 'item' ? nivelDoItem(itemEstilo(l.produto.id)!) : nivelDaCoisa({ coisaId: l.produto.id, marca: o?.marca } as CoisaTida); };
  const visiveis = linhas
    .filter(l => (!tipo || tipoDe(l) === tipo) && noAmbiente(l) && (!ambiente || ambienteDe(l) === ambiente) && (!cat || l.categoria === cat) && l.ofertas.some(passa) && (!q || q.split(/\s+/).every(t => normalizarBusca(nomeDoProduto(l.produto)).includes(t) || l.ofertas.some(o => o.marca && normalizarBusca(marcaPorId(o.marca)!.nome).includes(t)))))
    .sort((a, b) => m.ordem === 'menor' ? Math.min(...a.ofertas.filter(passa).map(o => o.preco)) - Math.min(...b.ofertas.filter(passa).map(o => o.preco)) : m.ordem === 'maior' ? Math.max(...b.ofertas.filter(passa).map(o => o.preco)) - Math.max(...a.ofertas.filter(passa).map(o => o.preco)) : m.ordem === 'qualidade' ? nivelDe(b) - nivelDe(a) : 0);
  const i = idade(vida);
  return (
    <div className="loja-estilo loja-vida" data-loja={lojaId}>
      <p className="nota">
        {e.tipo === 'online' ? `Pela internet: ${e.prazo ?? 'chega em dias'}, com frete. Marca que não tem loja em ${municipio(vida.moradia.municipioId).nome} vem importada (mais cara).`
          : e.tipo === 'departamento' ? 'Uma loja grande, com várias seções e as marcas de preço médio que o país tem.'
            : 'O que se compra aqui fica com você: dá para usar, guardar e (o objeto) vender usado.'}
        {' '}O preço muda com a marca: escolha a marca no próprio produto.
      </p>
      <label className="busca-compras__campo loja-vida__busca">
        <span className="busca-compras__rotulo">Buscar nesta loja</span>
        <input type="search" value={m.texto} onChange={ev => mudar({ texto: ev.target.value, quantos: POR_PAGINA })} placeholder="Produto ou marca" autoComplete="off" />
      </label>
      {tipos.length > 1 && <Escolha rotulo="Tipo de peça" valor={tipo} aoMudar={x => { mudar({ tipo: x, cat: '', marca: '', quantos: POR_PAGINA }); }} opcoes={[{ id: '', rotulo: 'Tudo' }, ...tipos.map(t => ({ id: t.id as string, rotulo: t.nome }))]} />}
      {ambientes22.length > 1 && !tipo && (!cat || cat === 'moveis' || cat === 'eletrodomesticos') && <Escolha rotulo="Ambiente" valor={ambiente22} aoMudar={x => { mudar({ ambiente22: x, ambiente: '', cat: '', marca: '', quantos: POR_PAGINA }); }} opcoes={[{ id: '', rotulo: 'Todos' }, ...ambientes22.map(a => ({ id: a.id as string, rotulo: a.nome }))]} />}
      {ambientes.length > 1 && !tipo && (!cat || cat === 'moveis' || cat === 'eletrodomesticos') && <Escolha rotulo={ambiente22 ? `Em ${nomeDoAmbiente(ambiente22 as never).toLowerCase()}` : 'Tipo de móvel'} valor={ambiente} aoMudar={x => { mudar({ ambiente: x, cat: '', marca: '', quantos: POR_PAGINA }); }} opcoes={[{ id: '', rotulo: 'Tudo' }, ...ambientes.map(a => ({ id: a.id as string, rotulo: a.nome }))]} />}
      {secoes.length > 1 && !tipo && !ambiente && <Escolha rotulo="Seção" valor={cat} aoMudar={x => { mudar({ cat: x, marca: '', quantos: POR_PAGINA }); }} opcoes={[{ id: '' as const, rotulo: 'Tudo' }, ...secoes.map(c => ({ id: c, rotulo: NOME_CATEGORIA[c] }))]} />}
      {faixas.length > 1 && <Escolha rotulo="Segmento da marca" valor={faixa} aoMudar={x => { mudar({ faixa: x, quantos: POR_PAGINA }); }} opcoes={[{ id: '', rotulo: 'Todos' }, ...faixas.map(f => ({ id: String(f), rotulo: cap(NOME_SEGMENTO_DE_MARCA[f]) }))]} />}
      <div className="busca-compras__filtros">
        {marcas.length > 1 && (
          <label className="campo campo--compacto"><span className="campo__rotulo">Marca</span>
            <select value={m.marca} onChange={ev => mudar({ marca: ev.target.value, quantos: POR_PAGINA })}><option value="">Todas</option>{marcas.map(x => <option key={x} value={x}>{marcaPorId(x)!.nome}</option>)}</select>
          </label>
        )}
        <label className="campo campo--compacto"><span className="campo__rotulo">Preço</span>
          <select value={m.preco} onChange={ev => mudar({ preco: ev.target.value, quantos: POR_PAGINA })}>{FAIXAS_DE_PRECO.map(f => <option key={f.id} value={f.id}>{f.rotulo}</option>)}</select>
        </label>
        <label className="campo campo--compacto"><span className="campo__rotulo">Ordenar</span>
          <select value={m.ordem} onChange={ev => mudar({ ordem: ev.target.value as OrdemDeCompras })}><option value="relevancia">Como na loja</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="qualidade">Melhor qualidade</option></select>
        </label>
      </div>
      {ambientes.length > 1 && i >= 18 && !q && <Conjuntos14 vida={vida} agir={agir} />}
      <p className="nota">{visiveis.length} {visiveis.length === 1 ? 'produto' : 'produtos'}{m.texto || m.marca || m.preco || cat || faixa || tipo || ambiente || ambiente22 ? ' com esses filtros' : ''}.</p>
      {provador.length > 0 && <Provador vida={vida} itens={provador} tirar={k => setProvador(l => l.filter((_, j) => j !== k))} aoFechar={() => setProvador([])} />}
      <ul className="catalogo-loja" data-loja={lojaId}>
        {visiveis.slice(0, quantos).map(l => <ProdutoNaLoja key={l.chave} vida={vida} agir={agir} linha={l} lojaId={lojaId} faixa={faixa} marca={m.marca} preco={preco} crianca={i < 12} provando={provador.find(x => x.itemId === l.produto.id)?.variante} provar={(variante: string, marca?: string) => setProvador(lista => { const ja = lista.findIndex(x => x.itemId === l.produto.id); if (ja >= 0 && lista[ja].variante === variante && lista[ja].marca === marca) return lista.filter((_, k) => k !== ja); const sem = ja >= 0 ? lista.filter((_, k) => k !== ja) : lista; return [...sem, { itemId: l.produto.id, variante, marca }].slice(-6); })} />)}
      </ul>
      {visiveis.length > quantos && <button type="button" className="botao botao--discreto" onClick={() => setQuantos(q => q + POR_PAGINA)}>Ver mais ({visiveis.length - quantos})</button>}
      {!visiveis.length && <p className="nota">Nada nesta seção.</p>}
    </div>
  );
}

/**
 * 12.7 — o provador: você, com o que está usando, e a peça escolhida no lugar da que ocupa o mesmo lugar do corpo. Nada é
 * comprado nem trocado: é só ver.
 */
interface ItemDoProvador { itemId: string; variante: string; marca?: string }

/**
 * 12.7 — o provador: você, com o que está usando, e a peça escolhida no lugar da que ocupa o mesmo lugar do corpo. Nada é
 * comprado nem trocado: é só ver.
 *
 * VIDA 22: o provador junta peças — experimentar uma blusa e depois uma calça monta a COMBINAÇÃO (cada uma no seu lugar
 * do corpo); experimentar duas peças do mesmo lugar (duas camisetas) mostra as ALTERNATIVAS lado a lado, cada uma com a
 * construção em palavras (modelagem, tecido, gola, manga, detalhes), para ver a diferença. Ao lado, "como você está".
 * Cada peça é a do cartão: o produto, a cor e a marca escolhidos (o acabamento da marca aparece no desenho).
 */
function Provador({ vida, itens, tirar, aoFechar }: { vida: Vida; itens: ItemDoProvador[]; tirar: (k: number) => void; aoFechar: () => void }) {
  const i = idade(vida);
  const usandoAgora = (vida.eu.estilo?.itens ?? []).filter(x => x.usando);
  const meus = usandoAgora.map(x => ({ itemId: x.itemId, id: x.id, variante: x.variante, marca: x.marca }));
  const lugares = (id: string) => lugaresDoItem(itemEstilo(id)!);
  // As peças do provador por lugar do corpo: a última de cada lugar entra na combinação; as outras do mesmo lugar são alternativas.
  const porLugar = new Map<string, ItemDoProvador[]>();
  for (const x of itens) { const k = lugares(x.itemId).join('+'); porLugar.set(k, [...(porLugar.get(k) ?? []), x]); }
  const combinacao = [...porLugar.values()].map(l => l[l.length - 1]);
  const vestir = (escolhidas: ItemDoProvador[]) => {
    const la = escolhidas.flatMap(x => lugares(x.itemId));
    return [...meus.filter(x => !lugares(x.itemId).some(l => la.includes(l))), ...escolhidas.map(x => ({ itemId: x.itemId, id: x.variante, variante: x.variante, marca: x.marca }))];
  };
  const unico = itens.length === 1 ? itemEstilo(itens[0].itemId) : undefined;
  const rosto = !!unico && (unico.categoria === 'oculos' || unico.categoria === 'chapeu' || unico.lugar === 'orelha' || !!unico.piercing);
  if (rosto) {
    const visual = { ...visualComPecaDoRosto(vida.eu.visual, unico!.id), ...(unico!.categoria !== 'oculos' && vida.eu.visual.oculos ? { oculos: vida.eu.visual.oculos, modeloOculos: vida.eu.visual.modeloOculos } : {}), ...(unico!.categoria !== 'chapeu' && vida.eu.visual.chapeu ? { chapeu: vida.eu.visual.chapeu, modeloChapeu: vida.eu.visual.modeloChapeu } : {}) };
    return (
      <section className="provador" aria-label={`Provador: ${unico!.nome}`}>
        <Figura visual={visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={tipoDeCorpo(vida)} pecas={meus} tatuagens={tatuagensNaFigura(vida)} largura={150} semFundo rotulo={`Você com ${unico!.nome.toLowerCase()}`} />
        <div className="provador__texto"><p className="provador__titulo">No provador: {unico!.nome.toLowerCase()}</p><button type="button" className="botao botao--discreto" onClick={aoFechar}>Sair do provador</button></div>
      </section>
    );
  }
  const umbigo = unico?.piercing?.regiao === 'umbigo';
  const alternativas = [...porLugar.values()].find(l => l.length > 1);
  const fig = (pecas: ReturnType<typeof vestir>, rotulo: string, largura = 150) => <Figura visual={umbigo ? { ...vida.eu.visual, piercings: [...(vida.eu.visual.piercings ?? []), unico!.id] } : vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={tipoDeCorpo(vida)} pecas={umbigo ? [] : pecas} semCima={umbigo} tatuagens={tatuagensNaFigura(vida)} largura={largura} semFundo rotulo={rotulo} />;
  const nomeDe = (x: ItemDoProvador) => `${itemEstilo(x.itemId)!.nome}${x.marca ? ` (${marcaPorId(x.marca)?.nome ?? x.marca})` : ''}`;
  return (
    <section className="provador provador22" aria-label="Provador">
      <div className="provador22__figuras">
        {alternativas
          ? alternativas.slice(-3).map(alt => <figure key={alt.itemId + alt.variante} className="provador22__fig" data-alternativa={alt.itemId}>{fig(vestir([...combinacao.filter(c => !lugares(c.itemId).some(l => lugares(alt.itemId).includes(l))), alt]), `Você com ${itemEstilo(alt.itemId)!.nome.toLowerCase()}`, 130)}<figcaption><strong>{itemEstilo(alt.itemId)!.nome}</strong><span className="nota">{construcaoDaPeca(alt.itemId).join(' · ')}</span></figcaption></figure>)
          : <figure className="provador22__fig" data-combinacao={combinacao.length}>{fig(vestir(combinacao), `Você com ${combinacao.map(x => itemEstilo(x.itemId)!.nome.toLowerCase()).join(', ')}`)}<figcaption>Com {combinacao.length === 1 ? 'a peça' : `as ${combinacao.length} peças`}</figcaption></figure>}
        {/* Ao lado (depois): como você está agora, para comparar. */}
        <figure className="provador22__fig provador22__fig--agora">{fig(meus, 'Você como está agora', 96)}<figcaption>Como você está</figcaption></figure>
      </div>
      <div className="provador__texto">
        <p className="provador__titulo">No provador{alternativas ? ': comparando' : ''}</p>
        <ul className="provador22__lista">
          {itens.map((x, k) => <li key={x.itemId + x.variante}><span><strong>{nomeDe(x)}</strong>{!alternativas && construcaoDaPeca(x.itemId).length > 0 && <span className="nota"> — {construcaoDaPeca(x.itemId).join(' · ')}</span>}</span><button type="button" className="link" onClick={() => tirar(k)}>Tirar</button></li>)}
        </ul>
        <p className="nota">Experimente outra peça para montar a combinação; duas do mesmo lugar (duas camisetas) aparecem lado a lado. Nada foi comprado — e o que você está usando continua seu.</p>
        <button type="button" className="botao botao--discreto" onClick={aoFechar}>Sair do provador</button>
      </div>
    </section>
  );
}

function ProdutoNaLoja({ vida, agir, linha, lojaId, faixa, marca, preco, crianca, provando, provar }: { vida: Vida; agir: (a: Acao) => boolean; linha: Linha; lojaId: string; faixa: string; marca?: string; preco?: { min?: number; max?: number }; crianca: boolean; provando?: string; provar: (variante: string, marca?: string) => void }) {
  const opcoes = linha.ofertas.filter(o => (!faixa || String(o.marca ? segmentoDaMarca(o.marca) ?? 1 : 1) === faixa) && (!marca || o.marca === marca) && (preco?.min === undefined || o.preco >= preco.min) && (preco?.max === undefined || o.preco <= preco.max));
  const [escolhida, setEscolhida] = useState(opcoes[0]?.marca ?? '');
  // 12.9: a cor escolhida (a variante) — a vitrine, o provador e a compra usam a mesma.
  const [corEscolhida, setCorEscolhida] = useState<string | undefined>(undefined);
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
  const cores = it ? coresDoItem(p.id) : [];
  const furo = it?.piercing ? furoDaJoia(p.id) : undefined;
  // O que se vê no cartão: a peça que você tem (a cor dela), ou a variante escolhida para comprar.
  const variante = meu ? sementeDaPeca(meu) : corEscolhida ? varianteDaCor(p.id, corEscolhida) : varianteDaVitrine(p.id);
  const corDoCartao = it ? corPrincipalDa(p.id, variante) : undefined;
  const acao: Acao = p.tipo === 'item' ? { tipo: 'comprar_item', itemId: p.id, loja: lojaId, ...(o.marca ? { marca: o.marca } : {}), variante } : { tipo: 'comprar_coisa', coisaId: p.id, loja: lojaId, ...(o.marca ? { marca: o.marca } : {}) };
  const lm = o.marca ? leituraDaMarca(o.marca) : undefined;
  // VIDA 17: o móvel com função (cama, sofá, geladeira…) mostra a vaga e a troca no lugar do "comprar" simples.
  const comFuncao = !!c?.daCasa && !!funcaoDe17(c.id) && !crianca && !furo;
  // 12.8: o segmento do que se leva — o do produto com a marca por cima (o mesmo cálculo do motor, `lar.nivelDaCoisa`).
  const nivel = it ? nivelDoItem(it) : c ? Math.round(nivelDaCoisa({ coisaId: c.id, marca: o.marca } as CoisaTida)) : 2;
  const segmento = segmentoDoNivel(nivel);
  const colecao = it?.colecao;
  const edicao = it?.edicao ?? c?.edicao;
  const categoria = it ? TIPOS_DE_PECA.find(t => t.id === tipoDePeca(it))!.nome : c && (linha.categoria === 'moveis' || linha.categoria === 'eletrodomesticos') ? `${nomeDoTipoDeMovel(tipoDeMovel(c.id, linha.categoria === 'eletrodomesticos'))} · ${(ambientesDoProduto(c.id).length ? ambientesDoProduto(c.id).map(nomeDoAmbiente).join(', ') : nomeDaCategoriaDaCasa(categoriaDaCasa(c.id, linha.categoria === 'eletrodomesticos'))).toLowerCase()}` : NOME_CATEGORIA[linha.categoria];
  return (
    <li className={`catalogo-loja__cartao${nivel >= 4 ? ' catalogo-loja__cartao--luxo' : ''}${nivel >= 6 ? ' catalogo-loja__cartao--exclusivo' : ''}`} data-produto={p.id} data-nivel={nivel} data-estado={meu?.usando ? 'em-uso' : tem ? 'seu' : 'disponivel'}>
      {/* VIDA 17: o estado do produto, sempre no mesmo canto (em todas as lojas). */}
      {(tem || meu?.usando) && <span className={`loja17-estado loja17-estado--${meu?.usando ? 'uso' : 'seu'}`}>{meu?.usando ? 'Em uso' : 'É seu'}</span>}
      <span className="catalogo-loja__imagem">
        {c && <DesenhoObjeto coisaId={c.id} cor={variantesDaCoisa(c.id)[0].cor} tamanho={96} rotulo={c.nome} marca={o.marca} />}
        {it && <MiniaturaDaPeca vida={vida} itemId={p.id} id={variante} largura={96} rotulo={`${nome}, como fica em você`} marca={meu?.marca ?? o.marca} />}
      </span>
      <span className="catalogo-loja__selos">
        <span className={`catalogo-loja__selo catalogo-loja__selo--nivel-${nivel}`}>{cap(segmento)}</span>
        {colecao && <span className="catalogo-loja__selo">{colecao}</span>}
        {edicao && <span className="catalogo-loja__selo catalogo-loja__selo--edicao" title={edicao}>{nivel >= 6 ? 'Exclusivo' : 'Edição especial'}</span>}
      </span>
      <strong className="catalogo-loja__nome">{nome}</strong>
      <span className="catalogo-loja__categoria nota">{categoria}{o.marca ? ` · ${marcaPorId(o.marca)!.nome}` : ''}{o.importado ? ' · importado' : ''}</span>
      <span className="catalogo-loja__descricao">{descricao}{edicao ? ` (${edicao}.)` : ''}</span>
      {it && construcaoDaPeca(p.id).length > 0 && <span className="catalogo-loja__construcao nota" data-construcao>{construcaoDaPeca(p.id).join(' · ')}</span>}
      {lm && <span className="catalogo-loja__marca-perfil nota" data-segmento-marca={lm.segmento}>{marcaPorId(o.marca!)!.nome}, {lm.segmento}{lm.fama ? ` — conhecida por ${NOME_QUALIDADE[lm.fama]}` : ''}.{lm.frase ? ` ${lm.frase}` : ''}{efeitoDaMarca(lm.notas, c?.id)}</span>}
      {linha.ofertas.length > 1 && !tem && (
        <label className="campo campo--compacto catalogo-loja__marca"><span className="campo__rotulo">Marca</span>
          <select value={o.marca ?? ''} onChange={ev => setEscolhida(ev.target.value)}>
            {opcoes.map(x => <option key={x.marca ?? '-'} value={x.marca ?? ''} title={x.marca ? leituraDaMarca(x.marca)?.segmento : 'econômico'}>{x.marca ? marcaPorId(x.marca)!.nome : 'Sem marca'} · {dinheiroCurto(x.preco)}{x.importado ? ' (importado)' : ''}</option>)}
          </select>
        </label>
      )}
      {cores.length > 1 && !tem && (
        <span className="catalogo-loja__cores" role="radiogroup" aria-label="Cor">
          {cores.map((cor, k) => (
            <button key={cor} type="button" role="radio" aria-checked={cor === corDoCartao} className="catalogo-loja__cor" style={{ background: cor }} title={nomesDasCores(cores)[k]} aria-label={nomesDasCores(cores)[k]}
              onClick={() => { setCorEscolhida(cor); if (provando) provar(varianteDaCor(p.id, cor), o.marca); }} />
          ))}
        </span>
      )}
      {c?.daCasa && !tem && <EncaixeNaLoja14 vida={vida} coisaId={c.id} marca={o.marca} />}
      {/* VIDA 17: a função do móvel (a vaga, o que já é seu, a troca). */}
      {comFuncao && acao.tipo === 'comprar_coisa' && <FuncaoNaLoja17 vida={vida} agir={agir} coisaId={c!.id} acao={acao} />}
      <span className="catalogo-loja__preco">{dinheiroCurto(o.preco)}</span>
      <span className="catalogo-loja__acoes">
        {it && !crianca && <button type="button" className="botao botao--discreto" aria-pressed={provando === variante} onClick={() => provar(variante, o.marca)}>{provando === variante ? 'No provador' : 'Experimentar'}</button>}
        {comFuncao ? null : tem ? (
          <span className="loja-estilo__seu">
            <span className="nota">É seu{marcaDoMeu ? ` (${marcaPorId(marcaDoMeu)?.nome ?? marcaDoMeu})` : ''}{meu ? (meu.usando ? ' · em uso' : ' · guardado') : ''}.</span>
            {meu && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: p.id, id: meu.id, usar: !meu.usando }} agir={agir} variante="discreto">{meu.usando ? 'Guardar' : 'Usar'}</BotaoAcao>}
          </span>
        ) : furo && !furoFeito(vida, furo) ? <button type="button" className="botao botao--secundario" onClick={() => irAosPiercings(furo)}>Furar e comprar no painel</button>
          : <BotaoAcao vida={vida} acao={acao} agir={agir} variante="secundario" ocultarImpossivel={crianca}>Comprar</BotaoAcao>}
        {/* VIDA 14: joia de furo — o painel de piercings (Você · Aparência) mostra o furo, as joias que cabem e o resultado no rosto. */}
        {furo && <button type="button" className="link" onClick={() => irAosPiercings(furo)}>Ver no painel de piercings →</button>}
      </span>
    </li>
  );
}

/** O que a marca muda de fato nesta coisa (só o que o jogo aplica: o desgaste, o usado, o conforto). */
const CONFORTO_CONTA = new Set(['colchao', 'cama_box', 'cama_king', 'colchao_hotel', 'sofa', 'sofa_retratil', 'sofa_couro', 'sofa_designer']);
function efeitoDaMarca(n: Record<string, number>, coisa: string | undefined): string {
  if (!coisa) return '';
  const partes: string[] = [];
  if (n.durabilidade >= 5) partes.push('dura bem mais que a média'); else if (n.durabilidade <= 2) partes.push('gasta mais rápido');
  if (n.revenda >= 4) partes.push('conserva valor no usado'); else if (n.revenda <= 1) partes.push('vale pouco usado');
  if (CONFORTO_CONTA.has(coisa) && n.conforto >= 4) partes.push('mais conforto em casa'); else if (CONFORTO_CONTA.has(coisa) && n.conforto <= 2) partes.push('menos conforto');
  return partes.length ? ` Na prática: ${partes.join(', ')}.` : '';
}
