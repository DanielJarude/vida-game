/**
 * REWORK 7 — COMPRAS: o mundo material da vida, não uma loja virtual.
 *
 * Antes: um título enorme, categorias pequenas, um ícone por loja e uma frase de descrição — cartões iguais para
 * coisas que não se parecem. Agora cada lugar mostra a sua VITRINE DE VERDADE, deste ano e desta cidade: os carros e
 * as motos que estão à venda (o desenho, a cor do anúncio), as casas para alugar, os instrumentos, os bichos do abrigo.
 * E diz o que importa para esta vida: o que você já tem dali, o que rende numa atividade que você pratica, a partir de
 * quanto — e, para quem ainda não decide, quando aquilo vai ser possível.
 *
 * A ordem segue a vida, não o catálogo: morar, ir e vir, as coisas do dia a dia, o que se usa no corpo, os serviços
 * (banco, oficina, a carteira de motorista), os bichos.
 *
 * Criança não recebe uma loja de portas fechadas: vê a casa de onde as coisas vêm (quem paga, como está o dinheiro
 * de casa), o que já é dela e, recolhido, quando cada lugar se abre. Nada aqui calcula preço ou regra: os números são
 * os das ofertas do motor (`mercado`, `coisas`), os bloqueios os de `autonomia`.
 */

import { PedidoDeCompra } from './Alcance';
import { useEffect, useMemo, type ReactNode } from 'react';
import type { Vida } from '../../motor/tipos';
import { disponibilidade, type Acao } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import { idade, idadePessoa } from '../../motor/nucleo';
import { AUTONOMIA } from '../../motor/sistemas/autonomia';
import { coisasDaVida, precoDaCoisa } from '../../motor/sistemas/coisas';
import { coisa, COISAS } from '../../motor/dados/coisas';
import { itemEstilo } from '../../motor/dados/estilo';
import { animaisDoAbrigo, lojaNaCidade, ofertasDeImoveis, ofertasDeVeiculos, type LojaDeVeiculo } from '../../motor/sistemas/mercado';
import { disponivel, seguranca } from '../../motor/sistemas/dinheiro';
import { formaDaVersao, modeloVeiculo, versaoVeiculo } from '../../motor/dados/bens';
import { leituraDaOrigem, responsaveis } from '../../motor/sistemas/origem';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { varianteDe } from '../../motor/sistemas/pertences';
import { BotaoAcao, Secao } from '../comum';
import { dinheiroCurto, formaDoModelo, leituraDaSeguranca } from '../leituraMaterial';
import { DesenhoVeiculo, MiniaturaDaCasa } from './material/Desenhos';
import { type LugarDaCidade } from '../ilustracao/lugares';
import { corDoVeiculo } from '../../motor/dados/pertences';
import { DesenhoObjeto } from './material/Objetos';
import { Retrato } from '../avatar/Retrato';
import { type QualLugar } from './material/Lugares';
import { categoriaDaCoisa, categoriaDoItem, lojasDaVida, ofertasDaLoja, SEGMENTOS, segmentosDaLoja, type SegmentoDeCompras } from '../../motor/sistemas/lojas';
import { rolagemDeCompras, useEstadoDeCompras } from './memoriaDeCompras';
import { sobDemanda } from '../util/sobDemanda';
/** HOTFIX 11.5.1: a busca nas lojas (pacote sob demanda: o do jogo não cresce). */
const BuscaDeCompras = sobDemanda(() => import('./material/BuscaDeCompras').then(m => m.BuscaDeCompras));
/** HOTFIX 11.5.1: o começo da aba e o segmento por dentro (pacote sob demanda). */
const InicioDeCompras = sobDemanda(() => import('./material/SegmentosDeCompras').then(m => m.InicioDeCompras));
const SegmentoDeCompras = sobDemanda(() => import('./material/SegmentosDeCompras').then(m => m.SegmentoDeCompras));
/** Busca os pacotes de Compras antes de precisar (a tela inicial do jogo dispara; os testes esperam). */
export const precarregarCompras = () => Promise.all([BuscaDeCompras.precarregar(), InicioDeCompras.precarregar(), SegmentoDeCompras.precarregar()]);
import { estabelecimento, type CategoriaDeProduto, type Estabelecimento } from '../../motor/dados/lojas';
import { LOJAS_DE_COLECAO, type LojaDeColecao } from '../../motor/dados/colecionaveis';
import { lojaDeColecaoNaCidade, ofertasDeColecao } from '../../motor/sistemas/colecao';
import { lojaDeExoticosNaCidade } from '../../motor/sistemas/exoticos';
import { MERCADOS_PARALELOS, mercadosLegais } from '../../motor/sistemas/paralelos';

interface Props { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void }

export interface Vitrine {
  id: QualLugar;
  nome: string;
  /** O que se resolve ali, em poucas palavras. */
  oque: string;
  /** A idade em que o lugar se abre para você (e o porquê, antes). */
  idadeMin: number;
  porque?: string;
  /** O que aparece na vitrine (os objetos de verdade deste ano). */
  vitrine: ReactNode;
  /** "a partir de R$ X" (ou o aluguel do mês). */
  preco?: string;
  /** O que esta vida já tem dali / o que rende numa atividade que você pratica. */
  seu?: string;
  rende?: string;
  /** Pela internet: na cidade não há loja disso. */
  online?: boolean;
  /** HOTFIX 11.5.1: os segmentos da aba em que o lugar aparece, o tipo de loja e o que ela vende. */
  segmentos?: SegmentoDeCompras[];
  tipoLoja?: Estabelecimento['tipo'];
  categorias?: CategoriaDeProduto[];
  precoMin?: number;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const temRaro = (v: Vida, cat: 'embarcacao' | 'aeronave') => v.financas.bens.some(b => b.tipo === 'veiculo' && modeloVeiculo(b.modeloId).categoria === cat);

/** Os veículos à venda numa loja, este ano: três formas diferentes, com a cor do anúncio. */
function vitrineDeVeiculos(v: Vida, loja: LojaDeVeiculo): { desenho: ReactNode; preco?: number } {
  const ofertas = ofertasDeVeiculos(v, loja);
  const formas = new Set<string>();
  const escolhidas = [...ofertas].sort((a, b) => a.preco - b.preco).filter(o => { const f = formaDaVersao(versaoVeiculo(o.versaoId), o.modeloId); if (formas.has(f)) return false; formas.add(f); return true; }).slice(0, 3);
  return {
    preco: ofertas.length ? Math.min(...ofertas.map(o => o.preco)) : undefined,
    desenho: escolhidas.map(o => <DesenhoVeiculo key={o.id} forma={formaDaVersao(versaoVeiculo(o.versaoId), o.modeloId)} versaoId={o.versaoId} cor={o.cor} semente={o.id} estado={o.estado} largura={78} />)
  };
}

function vitrines(v: Vida): { grupo: string; id: string; lugares: Vitrine[] }[] {
  const i = idade(v);
  const meus = coisasDaVida(v);
  const praticas = new Set(v.rotinas.map(r => r.id));
  const temVeiculo = v.financas.bens.some(b => b.tipo === 'veiculo');
  const din = disponivel(v);

  const lojas = lojasDaVida(v);
  const VESTIR: CategoriaDeProduto[] = ['vestuario', 'calcados', 'acessorios', 'otica', 'relogios', 'joias'];
  const daEstabelecimento = (e: Estabelecimento): Vitrine => {
    const ofertas = ofertasDaLoja(v, e.id);
    const objetos = [...new Set(ofertas.filter(o => o.produto.tipo === 'coisa').map(o => o.produto.id))];
    const util = objetos.filter(id => Object.keys(coisa(id)?.ajuda ?? {}).some(r => praticas.has(r)) && !meus.some(t => t.coisaId === id));
    const mostrar = [...util, ...objetos.filter(id => !util.includes(id))].slice(0, 3);
    // O que já é seu do que esta loja vende (o teclado na de instrumentos, o tênis na sapataria).
    const seus = [
      ...meus.filter(t => { const c = coisa(t.coisaId); return !!c && e.categorias.includes(categoriaDaCoisa(c)); }).map(t => coisa(t.coisaId)!.nome),
      ...(v.eu.estilo?.itens ?? []).filter(x => { const it = itemEstilo(x.itemId); return !!it && e.categorias.includes(categoriaDoItem(it)); }).map(x => itemEstilo(x.itemId)!.nome.toLowerCase())
    ];
    const soVestir = e.categorias.every(c => VESTIR.includes(c));
    return {
      id: `loja:${e.id}` as QualLugar, nome: e.nome, oque: e.frase, idadeMin: soVestir ? AUTONOMIA.compra_pessoal.idade : 10,
      porque: soVestir ? AUTONOMIA.compra_pessoal.antes : 'Com essa idade, quem compra são os adultos da casa.',
      vitrine: mostrar.map(id => <DesenhoObjeto key={id} coisaId={id} tamanho={52} rotulo={coisa(id)!.nome} />),
      preco: ofertas.length ? `a partir de ${dinheiroCurto(Math.min(...ofertas.map(o => o.preco)))}` : undefined,
      seu: seus.length ? `Seu: ${seus.slice(0, 2).join(', ')}${seus.length > 2 ? ` e mais ${seus.length - 2}` : ''}` : undefined,
      rende: util[0] ? `${cap(coisa(util[0])!.nome)} rende em "${modeloRotina(Object.keys(coisa(util[0])!.ajuda!).find(r => praticas.has(r))!)?.nome.toLowerCase()}"` : undefined,
      online: e.tipo === 'online',
      segmentos: segmentosDaLoja(e), tipoLoja: e.tipo, categorias: e.categorias, precoMin: ofertas.length ? Math.min(...ofertas.map(o => o.preco)) : undefined
    };
  };
  const casas = i >= 16 ? ofertasDeImoveis(v, 'aluguel').slice(0, 3) : [];
  const conc = vitrineDeVeiculos(v, 'concessionaria');
  const usad = vitrineDeVeiculos(v, 'usados');
  const motos = vitrineDeVeiculos(v, 'motos');
  const bichos = i >= 14 ? animaisDoAbrigo(v).slice(0, 2) : [];
  const nautica = lojaNaCidade(v.moradia.municipioId, 'nautica') && (din >= 60000 || temRaro(v, 'embarcacao'));
  const aero = lojaNaCidade(v.moradia.municipioId, 'aeroclube') && (din >= 350000 || temRaro(v, 'aeronave'));
  const veiculosSeus = v.financas.bens.filter(b => b.tipo === 'veiculo');
  const colecionador = i >= 18 && lojaNaCidade(v.moradia.municipioId, 'colecionador') && (din >= 300000 || veiculosSeus.some(b => b.tipo === 'veiculo' && !!modeloVeiculo(b.modeloId).segmento));

  return [
    { grupo: 'Onde morar', id: 'moradia', lugares: [{
      id: 'alugar', nome: 'Imobiliária', oque: 'Alugar ou comprar onde morar', idadeMin: 18, porque: AUTONOMIA.moradia.antes,
      vitrine: casas.map(o => <MiniaturaDaCasa key={o.id} forma={formaDoModelo(o.modeloId)} largura={84} />),
      preco: casas.length ? `aluguel a partir de ${dinheiroCurto(Math.min(...casas.map(o => o.aluguel)))}/mês` : undefined
    }] },
    { grupo: 'Ir e vir', id: 'veiculos', lugares: [
      { id: 'concessionaria', nome: 'Concessionária', oque: 'Carros zero, de todas as marcas da cidade', idadeMin: 18, porque: 'Carro é a partir dos 18, com carteira.', vitrine: conc.desenho, preco: conc.preco ? `a partir de ${dinheiroCurto(conc.preco)}` : undefined, seu: veiculosSeus.length ? `Na garagem: ${veiculosSeus.length === 1 ? veiculosSeus[0].nome : `${veiculosSeus.length} veículos`}` : undefined },
      { id: 'usados', nome: 'Carros usados', oque: 'Anúncios deste ano, cada um com a sua história', idadeMin: 18, porque: 'Carro é a partir dos 18, com carteira.', vitrine: usad.desenho, preco: usad.preco ? `a partir de ${dinheiroCurto(usad.preco)}` : undefined },
      { id: 'motos', nome: 'Motos e bicicletas', oque: 'Novas e usadas; bicicleta é de qualquer idade', idadeMin: 8, porque: 'Com essa idade, a bicicleta vem da família.', vitrine: motos.desenho, preco: motos.preco ? `a partir de ${dinheiroCurto(motos.preco)}` : undefined },
      ...(nautica ? [{ id: 'nautica' as QualLugar, nome: 'Loja náutica', oque: 'Moto aquática, lancha, veleiro', idadeMin: 18, porque: 'A partir dos 18.', vitrine: vitrineDeVeiculos(v, 'nautica').desenho }] : []),
      ...(aero ? [{ id: 'aeroclube' as QualLugar, nome: 'Aeroclube e hangar', oque: 'Do ultraleve ao jato; a formação de piloto', idadeMin: 18, porque: 'A partir dos 18.', vitrine: vitrineDeVeiculos(v, 'aeroclube').desenho }] : []),
      // REWORK 12: a garagem de colecionador (superesportivos, altíssimo luxo, clássicos), nas cidades grandes, para quem pode olhar.
      ...(colecionador ? [{ id: 'colecionador' as QualLugar, nome: 'Garagem de colecionador', oque: 'Superesportivos, altíssimo luxo e clássicos com história', idadeMin: 18, porque: 'A partir dos 18.', vitrine: vitrineDeVeiculos(v, 'colecionador').desenho, preco: `a partir de ${dinheiroCurto(vitrineDeVeiculos(v, 'colecionador').preco ?? 0)}` }] : []),
      ...(temVeiculo ? [{ id: 'oficina' as QualLugar, nome: 'Oficina', oque: 'Revisão e conserto do que é seu', idadeMin: 0, vitrine: veiculosSeus.slice(0, 1).map(b => b.tipo === 'veiculo' ? <DesenhoVeiculo key={b.id} forma={formaDaVersao(versaoVeiculo(b.versaoId), b.modeloId)} versaoId={b.versaoId} cor={corDoVeiculo(b, modeloVeiculo(b.modeloId).categoria).cor} estado={b.estado} largura={88} /> : null), seu: veiculosSeus.some(b => b.tipo === 'veiculo' && b.problema) ? 'Há um conserto esperando' : undefined }] : [])
    ] },
    // 12.4.1: as lojas da vida — especializadas, grandes lojas de departamento do país e o comércio online internacional
    // (`dados/lojas`). Antes: um balcão só de "ótica, roupas e acessórios" e cinco lojas de objetos sem marca.
    { grupo: 'Lojas especializadas', id: 'especializadas', lugares: lojas.filter(e => e.tipo === 'especializada').map(daEstabelecimento) },
    ...(lojas.some(e => e.tipo === 'departamento') ? [{ grupo: 'Grandes lojas e lojas de departamento', id: 'departamento', lugares: lojas.filter(e => e.tipo === 'departamento').map(daEstabelecimento) }] : []),
    { grupo: 'Pela internet', id: 'online', lugares: lojas.filter(e => e.tipo === 'online').map(daEstabelecimento) },
    { grupo: 'Estética', id: 'aparencia', lugares: [
      { id: 'clinica', nome: 'Clínica de cirurgia plástica', oque: 'Nariz, orelhas, pálpebras, lifting, cabelo, lábios', idadeMin: 16, porque: 'Cirurgia estética, só depois dos 16 (a maior parte, dos 18).', vitrine: null }
    ] },
    // REWORK 12: luxo e coleção — relógios, joias, arte, antiguidades, memorabilia, o leilão. Só o que existe na cidade.
    ...(i >= 18 ? [{ grupo: 'Luxo e coleção', id: 'colecao', lugares: (Object.keys(LOJAS_DE_COLECAO) as LojaDeColecao[]).filter(l => lojaDeColecaoNaCidade(v.moradia.municipioId, l)).map(l => {
      const ofertas = ofertasDeColecao(v, l);
      const minhas = (v.financas.colecao ?? []).filter(c => ofertas.some(o => o.categoria === c.categoria)).length;
      return { id: l as QualLugar, nome: LOJAS_DE_COLECAO[l].nome, oque: LOJAS_DE_COLECAO[l].frase.split('.')[0], idadeMin: 18, porque: 'A partir dos 18.', vitrine: null, preco: ofertas.length ? `a partir de ${dinheiroCurto(Math.min(...ofertas.map(o => o.preco)))}` : undefined, seu: minhas ? `Na sua coleção: ${minhas} ${minhas === 1 ? 'peça' : 'peças'} deste tipo` : undefined };
    }) }] : []),
    { grupo: 'Serviços', id: 'servicos', lugares: [
      { id: 'banco', nome: 'Banco', oque: 'Guardar, investir, pedir empréstimo', idadeMin: 18, porque: 'Conta e investimento no seu nome, a partir dos 18.', vitrine: null, seu: v.financas.investimentos.length ? `${v.financas.investimentos.length} ${v.financas.investimentos.length === 1 ? 'aplicação' : 'aplicações'}` : undefined }
    ] },
    { grupo: 'Os bichos', id: 'animais', lugares: [
      { id: 'abrigo', nome: 'Abrigo de animais', oque: 'Adotar um cão, um gato — às vezes, outro bicho', idadeMin: 18, porque: 'Adotar é coisa de adulto.', vitrine: bichos.length ? bichos.map(a => <Retrato key={a.id} visual={undefined} genero={a.genero} idade={a.idade} semente={a.id} tamanho={52} especie={a.especie} porte={a.porte} rotulo={a.nome} />) : null, preco: 'adoção, sem custo' },
      { id: 'pets', nome: 'Loja e criadouro de animais', oque: 'Aves, roedores, peixes; silvestres só com documento', idadeMin: 18, porque: 'Comprar um animal é coisa de adulto.', vitrine: null },
      // REWORK 12.2: os exóticos (cidade grande), conforme a lei do lugar — com a instalação e o cuidado que cada um pede.
      ...(lojaDeExoticosNaCidade(v.moradia.municipioId) ? [{ id: 'exoticos' as QualLugar, nome: 'Animais exóticos', oque: 'Répteis, aves, pequenos mamíferos e peixes que a lei daqui permite', idadeMin: 18, porque: 'Comprar um animal é coisa de adulto.', vitrine: null }] : [])
    ] },
    // REWORK 12.2: o que se compra de segunda mão, sem saber direito de onde veio (o mercado por fora, só para quem tem gente no caminho).
    ...(mercadosLegais(v).length ? [{ grupo: 'Segunda mão e antiguidades (legais)', id: 'paralelos', lugares: mercadosLegais(v).map(m => ({ id: m as QualLugar, nome: MERCADOS_PARALELOS[m].nome, oque: MERCADOS_PARALELOS[m].frase.split('.')[0], idadeMin: 18, porque: 'A partir dos 18.', vitrine: null })) }] : [])
  ];
}



/** REWORK 12.2: cada casa de luxo e coleção tem a sua fachada (a relojoaria não é mais a ótica; a galeria não é a livraria). */
const FACHADA_DE: Partial<Record<QualLugar, LugarDaCidade>> = { comprar: 'alugar', colecionador: 'concessionaria' };
/** 12.4.1: a fachada de cada loja da vida (a de roupas e a sapataria usam a vitrine de moda; a de móveis, a da casa…). */
const FACHADA_DA_LOJA: Record<string, LugarDaCidade> = {
  roupas: 'estilo', sapataria: 'estilo', otica: 'estilo', acessorios: 'estilo', grifes: 'joalheria', relojoaria: 'relojoaria', joalheria: 'joalheria',
  eletronicos: 'eletronicos', eletrodomesticos: 'casa', moveis: 'casa', instrumentos: 'instrumentos', esportes: 'esportes', livraria: 'livraria'
};
export const fachadaDoLugar = (id: QualLugar): LugarDaCidade => {
  if (id.startsWith('loja:')) {
    const e = estabelecimento(id.slice(5));
    if (!e) return 'casa';
    if (FACHADA_DA_LOJA[e.id]) return FACHADA_DA_LOJA[e.id];
    return e.categorias.includes('vestuario') ? 'estilo' : e.categorias.includes('eletronicos') ? 'eletronicos' : 'casa';
  }
  return FACHADA_DE[id] ?? (id as LugarDaCidade);
};

/** HOTFIX 11.5.1: o segmento de cada lugar que não é loja (as lojas dizem o delas pelo que vendem). */
const SEGMENTO_DO_GRUPO: Record<string, SegmentoDeCompras> = { moradia: 'moradia', veiculos: 'veiculos', aparencia: 'servicos', colecao: 'luxo', servicos: 'servicos', animais: 'servicos', paralelos: 'luxo' };

export interface LugarNoSegmento { x: Vitrine; grupo: string; grupoId: string; segmentos: SegmentoDeCompras[] }

/**
 * HOTFIX 11.5.1 — COMPRAS REORGANIZADA. Antes, uma lista só de ~25 vitrines grandes (onde morar, ir e vir, as lojas
 * especializadas, as de departamento, as da internet, a estética, o luxo, os serviços, os bichos), sem busca. Agora a
 * aba tem uma hierarquia: a BUSCA (produto, marca ou loja, em todas as lojas, com filtros de categoria, marca e preço,
 * e a ordem) no alto; os SEGMENTOS (moda, tecnologia, casa, cultura e lazer, veículos, luxo, onde morar, serviços)
 * como primeira escolha; dentro do segmento, as lojas pelo tipo (especializadas, grandes lojas, internet) — uma loja
 * de departamento aparece em cada segmento que atende — e, na moda, o filtro pela categoria (roupas, calçados,
 * óculos...). O segmento, a busca, os filtros e a posição da página ficam na memória da aba: comprar, abrir uma loja,
 * sair e voltar não levam ao começo. Nenhuma loja nem produto saiu: só mudou o caminho até eles.
 */
export function Compras({ vida, agir, abrir }: Props) {
  const i = idade(vida);
  const grupos = useMemo(() => vitrines(vida), [vida]);
  const [estado, mudar] = useEstadoDeCompras(vida.id);
  const seg = estado.segmento;
  // O pedido de fora (o mapa "Comprar carro") vale uma vez.
  useEffect(() => { if (estado.deFora) mudar({ deFora: false }); }, [estado.deFora, mudar]);
  // A posição da página em cada segmento: guardada enquanto se rola, devolvida ao voltar.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const y = rolagemDeCompras[seg];
    if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    const guardar = () => { rolagemDeCompras[seg] = window.scrollY; };
    window.addEventListener('scroll', guardar, { passive: true });
    return () => { window.removeEventListener('scroll', guardar); };
  }, [seg]);
  if (i < 10) return <ComprasDaCrianca vida={vida} grupos={grupos} agir={agir} />;
  const sg = seguranca(vida);
  const lugares: LugarNoSegmento[] = grupos.flatMap(g => g.lugares.map(x => ({ x, grupo: g.grupo, grupoId: g.id, segmentos: x.segmentos ?? [SEGMENTO_DO_GRUPO[g.id] ?? 'servicos'] })));
  const doSegmento = (s: SegmentoDeCompras) => lugares.filter(l => l.segmentos.includes(s));
  const segmentos = SEGMENTOS.filter(s => doSegmento(s.id).length);
  const atual = segmentos.find(s => s.id === seg);
  const buscando = !!(estado.texto.trim() || estado.categoria || estado.marca || estado.faixa);
  return (
    <div className="compras">
      <header className="folio folio--compras">
        <p className="folio__kicker"><span className="folio__area">Vida · Compras</span>{i >= 8 ? <> · {i < 12 ? 'no cofrinho' : 'na conta'}: <strong>{dinheiroCurto(Math.max(0, vida.financas.conta))}</strong>{i >= 18 ? ` · ${leituraDaSeguranca(vida).palavra.toLowerCase()}` : ''}</> : null}</p>
        <h1 className="folio__titulo">{i < 12 ? 'Quase tudo ainda vem dos adultos da casa' : i < 18 ? 'O que dá para comprar com o seu dinheiro' : sg.nivel === 'no_vermelho' || sg.nivel === 'apertado' ? 'O dinheiro está curto: olhe antes de comprar' : 'O que esta cidade tem para a sua vida'}</h1>
      </header>
      {i >= AUTONOMIA.compra_pessoal.idade && <BuscaDeCompras vida={vida} agir={agir} abrir={abrir} estado={estado} mudar={mudar} />}
      <nav className="compras__segmentos" aria-label="Seções de compras">
        <button type="button" className={`compras__segmento${!atual ? ' compras__segmento--ativo' : ''}`} aria-current={!atual ? 'page' : undefined} onClick={() => mudar({ segmento: 'inicio', categoriaDasLojas: '' })}>Início</button>
        {segmentos.map(s => <button key={s.id} type="button" className={`compras__segmento${atual?.id === s.id ? ' compras__segmento--ativo' : ''}`} aria-current={atual?.id === s.id ? 'page' : undefined} onClick={() => mudar({ segmento: s.id, categoriaDasLojas: '' })}>{s.nome}</button>)}
      </nav>
      {!buscando && (atual
        ? <SegmentoDeCompras vida={vida} agir={agir} abrir={abrir} segmento={atual} lugares={doSegmento(atual.id)} categoria={estado.categoriaDasLojas} mudarCategoria={c => mudar({ categoriaDasLojas: c })} />
        : <InicioDeCompras vida={vida} segmentos={segmentos.map(s => ({ s, lugares: doSegmento(s.id) }))} escolher={id => mudar({ segmento: id, categoriaDasLojas: '' })} />)}
    </div>
  );
}

/**
 * Antes dos 10: a casa de onde as coisas vêm — quem paga, como anda o dinheiro de casa, o que já é seu — e, recolhido,
 * quando cada lugar se abre. Nenhuma vitrine de portas fechadas.
 */
function ComprasDaCrianca({ vida, grupos, agir }: { vida: Vida; grupos: ReturnType<typeof vitrines>; agir: (a: Acao) => boolean }) {
  const quem = responsaveis(vida).filter(x => x.p.vivo);
  const meus = coisasDaVida(vida);
  const lugares = grupos.flatMap(g => g.lugares).filter(x => x.idadeMin > 0).sort((a, b) => a.idadeMin - b.idadeMin);
  const porIdade = [...new Set(lugares.map(x => x.idadeMin))];
  return (
    <div className="compras compras--crianca">
      <header className="folio folio--compras">
        <p className="folio__kicker"><span className="folio__area">Vida · Compras</span></p>
        <h1 className="folio__titulo">As compras são dos adultos da casa</h1>
        <p className="folio__lede">{leituraDaOrigem(vida)}</p>
      </header>
      {quem.length > 0 && (
        <section className="vitrines" aria-labelledby="quem-compra">
          <h2 id="quem-compra" className="vitrines__titulo">Quem compra as coisas</h2>
          <ul className="quem-compra">
            {quem.map(({ p }) => (
              <li key={p.id}><Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={44} rotulo={p.nome} especie={p.especie} /><span><strong>{p.nome}</strong><span className="nota">{p.ocupacao ?? (p.renda > 0 ? 'trabalha' : 'sem trabalho agora')}</span></span></li>
            ))}
          </ul>
        </section>
      )}
      <section className="vitrines" aria-labelledby="o-que-e-seu">
        <h2 id="o-que-e-seu" className="vitrines__titulo">O que já é seu</h2>
        {meus.length ? (
          <ul className="vitrines__seus">{meus.map(t => { const c = coisa(t.coisaId); const x = varianteDe(t); return c ? <li key={t.id}><DesenhoObjeto coisaId={t.coisaId} cor={x.cor} tamanho={56} rotulo={c.nome} /><span>{cap(c.nome)}</span></li> : null; })}</ul>
        ) : <p className="vazio">Por enquanto, o que é seu cabe numa gaveta: os brinquedos, o material da escola.</p>}
      </section>
      {/* REWORK 10.5 · ECO-04: dos 8 anos, o que é da idade dá para comprar com o dinheiro guardado (com a família junto):
          só aparece o que dá de fato — nenhuma vitrine de portas fechadas. */}
      {idade(vida) >= 8 && (() => {
        const daIdade = COISAS.filter(c => (c.idadeMin ?? 12) <= idade(vida) && podeTentar(disponibilidade(vida, { tipo: 'comprar_coisa', coisaId: c.id })));
        return (
          <section className="vitrines" aria-labelledby="com-o-seu-dinheiro">
            <h2 id="com-o-seu-dinheiro" className="vitrines__titulo">Com o seu dinheiro</h2>
            <p className="nota">No cofrinho: {dinheiroCurto(Math.max(0, vida.financas.conta))}. {daIdade.length ? 'Dá para comprar, com a família junto:' : 'Ainda não dá para nada da sua idade — guardando, chega lá (a mesada, um presente, uma tarefa paga).'}</p>
            {daIdade.length > 0 && <div className="grupo-acoes">{daIdade.slice(0, 4).map(c => <BotaoAcao key={c.id} vida={vida} acao={{ tipo: 'comprar_coisa', coisaId: c.id }} agir={agir} variante="discreto" ocultarBloqueado>{`${cap(c.nome)} (${dinheiroCurto(precoDaCoisa(vida, c.id))})`}</BotaoAcao>)}</div>}
          </section>
        );
      })()}
      {/* REWORK 10.6 · INF-02: o que é da idade e o cofrinho não paga vira pedido aos adultos — com o produto escolhido. */}
      {quem.length > 0 && idade(vida) >= 4 && (() => {
        const pedir = COISAS.filter(c => !c.daCasa && (c.idadeMin ?? 12) <= idade(vida) + 4 && !temCoisaDe(meus, c.id) && !podeTentar(disponibilidade(vida, { tipo: 'comprar_coisa', coisaId: c.id })) && disponibilidade(vida, { tipo: 'pedir_compra', coisaId: c.id }).grau !== 'impossivel').slice(0, 6);
        if (!pedir.length) return null;
        return (
          <section className="vitrines" aria-labelledby="pedir-aos-adultos">
            <h2 id="pedir-aos-adultos" className="vitrines__titulo">Pedir aos adultos</h2>
            <ul className="pedidos-crianca">
              {pedir.map(c => (
                <li key={c.id} className="pedidos-crianca__item">
                  <DesenhoObjeto coisaId={c.id} tamanho={48} rotulo={c.nome} />
                  <span className="pedidos-crianca__texto"><strong>{cap(c.nome)}</strong><PedidoDeCompra vida={vida} coisaId={c.id} agir={agir} /></span>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}
      <Secao titulo="Quando cada lugar se abre" recolhivel aberta={false}>
        <ul className="vitrines__idades">
          {porIdade.map(a => (
            <li key={a}>
              <span className="vitrines__idade">aos {a}</span>
              <ul>{lugares.filter(x => x.idadeMin === a).map(x => <li key={x.id}><strong>{x.nome}</strong>{x.porque ? <span className="nota"> — {x.porque}</span> : null}</li>)}</ul>
            </li>
          ))}
        </ul>
      </Secao>
    </div>
  );
}

const temCoisaDe = (meus: { coisaId: string }[], id: string) => meus.some(t => t.coisaId === id);
