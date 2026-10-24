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
import { useMemo, type ReactNode } from 'react';
import type { Vida } from '../../motor/tipos';
import { disponibilidade, type Acao } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import { idade, idadePessoa } from '../../motor/nucleo';
import { AUTONOMIA } from '../../motor/sistemas/autonomia';
import { coisasDaVida, coisasDaLoja, precoDaCoisa, temLojaNaCidade } from '../../motor/sistemas/coisas';
import { coisa, COISAS, NOME_LOJA, type LojaDeCoisas } from '../../motor/dados/coisas';
import { animaisDoAbrigo, lojaNaCidade, ofertasDeImoveis, ofertasDeVeiculos, type LojaDeVeiculo } from '../../motor/sistemas/mercado';
import { disponivel, seguranca } from '../../motor/sistemas/dinheiro';
import { formaDaVersao, modeloVeiculo, versaoVeiculo } from '../../motor/dados/bens';
import { habilitacaoDaVida, leituraDaAutoescola } from '../../motor/sistemas/autoescola';
import { leituraDaOrigem, responsaveis } from '../../motor/sistemas/origem';
import { modeloRotina } from '../../motor/sistemas/rotinas';
import { varianteDe } from '../../motor/sistemas/pertences';
import { BotaoAcao, Secao } from '../comum';
import { dinheiroCurto, formaDoModelo, leituraDaSeguranca } from '../leituraMaterial';
import { DesenhoVeiculo, MiniaturaDaCasa } from './material/Desenhos';
import { Fachada } from '../ilustracao/Fachada';
import { PORTA_DA_FACHADA, type LugarDaCidade } from '../ilustracao/lugares';
import { corDoVeiculo } from '../../motor/dados/pertences';
import { DesenhoObjeto } from './material/Objetos';
import { Retrato } from '../avatar/Retrato';
import { LOJAS_DE_COISAS, type QualLugar } from './material/Lugares';
import { LOJAS_DE_COLECAO, type LojaDeColecao } from '../../motor/dados/colecionaveis';
import { lojaDeColecaoNaCidade, ofertasDeColecao } from '../../motor/sistemas/colecao';

interface Props { vida: Vida; agir: (a: Acao) => boolean; abrir: (l: QualLugar) => void }

interface Vitrine {
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

  const daLoja = (l: LojaDeCoisas): Vitrine => {
    const itens = coisasDaLoja(l);
    const tem = meus.filter(t => coisa(t.coisaId)?.loja === l);
    const util = itens.filter(c => Object.keys(c.ajuda ?? {}).some(r => praticas.has(r)) && !tem.some(t => t.coisaId === c.id));
    const mostrar = [...util, ...itens.filter(c => !util.includes(c))].slice(0, 3);
    const rende = util[0] ? `${cap(util[0].nome)} rende em "${modeloRotina(Object.keys(util[0].ajuda!).find(r => praticas.has(r))!)?.nome.toLowerCase()}"` : undefined;
    return {
      id: l, nome: NOME_LOJA[l], oque: O_QUE[l], idadeMin: 10, porque: 'Com essa idade, quem compra são os adultos da casa.',
      vitrine: mostrar.map(c => <DesenhoObjeto key={c.id} coisaId={c.id} tamanho={52} rotulo={c.nome} />),
      preco: `a partir de ${dinheiroCurto(Math.min(...itens.map(c => precoDaCoisa(v, c.id))))}`,
      seu: tem.length ? `Seu: ${tem.slice(0, 2).map(t => coisa(t.coisaId)!.nome).join(', ')}${tem.length > 2 ? ` e mais ${tem.length - 2}` : ''}` : undefined,
      rende, online: !temLojaNaCidade(v, l)
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
    { grupo: 'As coisas do dia a dia', id: 'objetos', lugares: LOJAS_DE_COISAS.map(daLoja) },
    { grupo: 'O que se usa no corpo', id: 'aparencia', lugares: [
      { id: 'estilo', nome: 'Ótica, roupas e acessórios', oque: 'Óculos, chapéus, roupas, um relógio — o que aparece no retrato', idadeMin: AUTONOMIA.compra_pessoal.idade, porque: AUTONOMIA.compra_pessoal.antes, vitrine: null },
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
      { id: 'pets', nome: 'Loja e criadouro de animais', oque: 'Aves, roedores, peixes; silvestres só com documento', idadeMin: 18, porque: 'Comprar um animal é coisa de adulto.', vitrine: null }
    ] }
  ];
}

const O_QUE: Record<LojaDeCoisas, string> = {
  eletronicos: 'Celular, notebook, câmera, videogame', casa: 'Máquina de lavar, ar-condicionado, cama, cozinha', instrumentos: 'Violão, teclado, guitarra, bateria, violino',
  esportes: 'Chuteira, raquete, kit de academia, esteira', livraria: 'Livros, apostilas, material de arte, jogos'
};

/** A vitrine tem objetos de verdade na frente (senão, a fachada mostra o interior da loja). */
const temObjetos = (v: ReactNode) => (Array.isArray(v) ? v.some(Boolean) : Boolean(v));

/** REWORK 12: as lojas novas usam a fachada de um lugar parecido (a relojoaria e a joalheria, a da ótica; a galeria, a da livraria). */
const FACHADA_DE: Partial<Record<QualLugar, LugarDaCidade>> = { comprar: 'alugar', colecionador: 'concessionaria', relojoaria: 'estilo', joalheria: 'estilo', galeria: 'livraria', antiquario: 'casa', memorabilia: 'esportes', leilao: 'banco' };
const fachadaDoLugar = (id: QualLugar): LugarDaCidade => FACHADA_DE[id] ?? (id as LugarDaCidade);

function CartaoVitrine({ x, i, abrir }: { x: Vitrine; i: number; abrir: (l: QualLugar) => void }) {
  const cedo = i < x.idadeMin;
  return (
    <li className={`vitrine${cedo ? ' vitrine--cedo' : ''}`}>
      <button type="button" className="vitrine__abrir" onClick={() => abrir(x.id)} disabled={cedo} aria-describedby={cedo ? `cedo-${x.id}` : undefined}>
        {/* REWORK 9: na loja de porta lateral, os objetos ficam na frente do vidro (no máximo dois), nunca na porta. */}
        <span className="vitrine__objetos" aria-hidden data-porta={PORTA_DA_FACHADA[fachadaDoLugar(x.id)] ?? undefined}>
          <Fachada lugar={fachadaDoLugar(x.id)} largura={360} altura={112} vazia={!temObjetos(x.vitrine)} className="vitrine__fachada" />
          {PORTA_DA_FACHADA[fachadaDoLugar(x.id)] && temObjetos(x.vitrine)
            ? <span className="vitrine__produtos">{Array.isArray(x.vitrine) ? x.vitrine.slice(0, 2) : x.vitrine}</span>
            : x.vitrine}
        </span>
        <span className="vitrine__texto">
          <span className="vitrine__nome">{x.nome}</span>
          <span className="vitrine__oque" id={cedo ? `cedo-${x.id}` : undefined}>{cedo ? x.porque : x.oque}</span>
          {!cedo && (x.preco || x.online) && <span className="vitrine__preco">{x.preco}{x.online ? `${x.preco ? ' · ' : ''}pela internet` : ''}</span>}
          {!cedo && x.seu && <span className="vitrine__seu">{x.seu}</span>}
          {!cedo && x.rende && <span className="vitrine__rende">{x.rende}</span>}
        </span>
      </button>
    </li>
  );
}

export function Compras({ vida, agir, abrir }: Props) {
  const i = idade(vida);
  const grupos = useMemo(() => vitrines(vida), [vida]);
  if (i < 10) return <ComprasDaCrianca vida={vida} grupos={grupos} agir={agir} />;
  const seg = seguranca(vida);
  const hab = habilitacaoDaVida(vida);
  return (
    <div className="compras">
      <header className="folio folio--compras">
        <p className="folio__kicker"><span className="folio__area">Vida · Compras</span>{i >= 8 ? <> · {i < 12 ? 'no cofrinho' : 'na conta'}: <strong>{dinheiroCurto(Math.max(0, vida.financas.conta))}</strong>{i >= 18 ? ` · ${leituraDaSeguranca(vida).palavra.toLowerCase()}` : ''}</> : null}</p>
        <h1 className="folio__titulo">{i < 12 ? 'Quase tudo ainda vem dos adultos da casa' : i < 18 ? 'O que dá para comprar com o seu dinheiro' : seg.nivel === 'no_vermelho' || seg.nivel === 'apertado' ? 'O dinheiro está curto: olhe antes de comprar' : 'O que esta cidade tem para a sua vida'}</h1>
      </header>
      {grupos.map(g => {
        const abertos = g.lugares.filter(x => i >= x.idadeMin);
        const cedo = g.lugares.filter(x => i < x.idadeMin);
        if (!abertos.length && !cedo.length) return null;
        return (
          <section key={g.id} className={`vitrines vitrines--${g.id}`} aria-labelledby={`vitrines-${g.id}`}>
            <h2 id={`vitrines-${g.id}`} className="vitrines__titulo">{g.grupo}</h2>
            {abertos.length > 0 && <ul className="vitrines__lista">{abertos.map(x => <CartaoVitrine key={x.id} x={x} i={i} abrir={abrir} />)}</ul>}
            {cedo.length > 0 && (
              <p className="vitrines__depois">{abertos.length ? 'Mais tarde: ' : ''}{cedo.map((x, k) => <span key={x.id}>{k ? ' · ' : ''}{x.nome.toLowerCase()} <span className="nota">(aos {x.idadeMin})</span></span>)}</p>
            )}
            {g.id === 'veiculos' && i >= hab.comeca - 1 && <BotaoAcao vida={vida} acao={{ tipo: 'cnh' }} agir={agir} variante="discreto" ocultarImpossivel>{`Tirar ${hab.a} (${hab.escola})`}</BotaoAcao>}
            {g.id === 'veiculos' && i >= hab.comeca - 2 && !vida.trabalho.licencas.includes('cnh') && <p className="nota">{hab.frase}</p>}
            {g.id === 'veiculos' && leituraDaAutoescola(vida) && (
              <div className="autoescola">
                <p className="nota">{leituraDaAutoescola(vida)}</p>
                <div className="grupo-acoes grupo-acoes--linha">
                  <BotaoAcao vida={vida} acao={{ tipo: 'cnh_prova' }} agir={agir} variante="secundario" ocultarBloqueado ocultarImpossivel>Fazer a prova teórica</BotaoAcao>
                  <BotaoAcao vida={vida} acao={{ tipo: 'cnh_preparar', como: 'teoria' }} agir={agir} variante="discreto" ocultarImpossivel>Estudar o manual e fazer simulados</BotaoAcao>
                  <BotaoAcao vida={vida} acao={{ tipo: 'cnh_preparar', como: 'pratica' }} agir={agir} variante="discreto" ocultarImpossivel>Fazer aulas extras de direção</BotaoAcao>
                </div>
              </div>
            )}
          </section>
        );
      })}
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
