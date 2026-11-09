/**
 * VIDA 14 — O PAINEL DE PIERCINGS (Você · Aparência · Piercings): a experiência inteira num lugar só, como o estúdio de
 * tatuagem. Escolhe a parte do corpo e o FURO (cada um diz se está ocupado, livre ou ainda não feito); vê as joias que
 * cabem nele, com o preço (e o do furo, quando ainda não existe); experimenta na lupa; compra ali mesmo (a ação
 * `piercing14`: a compra de sempre, com o furo junto); usa, troca e tira as suas sem sair da aba (`usar_item`, com o id
 * da peça). A loja da cidade continua vendendo e traz para cá.
 */
import { useEffect, useRef, useState } from 'react';
import type { ItemDeEstilo, Vida, Visual } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { anoDe } from '../../../motor/tempo';
import { dinheiro } from '../../../motor/texto';
import { itemEstilo, type ItemEstilo } from '../../../motor/dados/estilo';
import { COR_DO_METAL, IDADE_MINIMA_PIERCING } from '../../../motor/dados/piercings129';
import { NOME_DO_FURO, ZONAS_DE_PIERCING, zonaDoFuro, type ZonaDePiercing } from '../../../motor/dados/piercings13';
import { itensDaPessoa } from '../../../motor/sistemas/estilo';
import { tipoDeCorpo } from '../../../motor/sistemas/silhueta';
import { tatuagensNaFigura } from '../../../motor/sistemas/tatuagens';
import { CICATRIZACAO, estadoDoFuro, furoDaJoia, joiasDoFuro, precoNoPainel, type EstadoDoFuro } from '../../../motor/v14/aparencia/piercings14';
import { Figura, focoDaPeca } from '../../avatar/Figura';
import { cabeloCobreOrelha, focoDoRosto, temBigode } from '../../avatar/identidade13';
import { OrelhaDePerto } from '../../avatar/piercings';
import { corDaPele, corDoCabelo } from '../../avatar/Retrato';
import { BotaoAcao, Escolha } from '../../comum';
import { atenderPedido, pedidoDosPiercings } from './irAosPiercings';
import './aparencia14.css';

type Perto = 'perto' | 'longe';
const ROTULO_ESTADO: Record<EstadoDoFuro, string> = { ocupado: 'Ocupado', livre: 'Livre', sem_furo: 'Sem furo' };

/** A amostra da joia: o metal (e a pedra) num botãozinho; os brincos, dourados. */
function Amostra({ itemId }: { itemId: string }) {
  const p = itemEstilo(itemId)?.piercing;
  const [c, s] = p ? COR_DO_METAL[p.metal] ?? COR_DO_METAL.aco : ['#d8b45a', '#8d6f2a'];
  const aro = p?.forma === 'argola' || p?.forma === 'clicker' || p?.forma === 'ferradura';
  return (
    <svg className="a14-pc__amostra" viewBox="0 0 12 12" width={18} height={18} aria-hidden="true">
      {aro ? <circle cx={6} cy={6} r={4} fill="none" stroke={c} strokeWidth={1.6} /> : <circle cx={6} cy={6} r={3.6} fill={c} stroke={s} strokeWidth={0.6} />}
      {p?.pedra && <circle cx={6} cy={aro ? 10 : 6} r={1.8} fill={p.pedra} stroke={s} strokeWidth={0.4} />}
    </svg>
  );
}

/** O visual da prévia: a joia experimentada no furo dela (a que estava ali sai só da prévia); o cabelo preso, se pedido. */
export function previaDoPainel(base: Visual, prova: string | undefined, prender: boolean, semChapeu: boolean): Visual {
  const v: Visual = { ...base, piercings: [...(base.piercings ?? [])] };
  if (prova) {
    const it = itemEstilo(prova);
    if (it?.piercing) v.piercings = [...v.piercings!.filter(id => itemEstilo(id)?.lugar !== it.lugar), prova].sort();
    else if (it?.lugar === 'orelha') { v.brincos = true; v.modeloBrincos = prova; }
  }
  if (prender && cabeloCobreOrelha(v.cabelo)) v.cabelo = 'coque';
  if (semChapeu) { delete v.chapeu; delete v.modeloChapeu; }
  return v;
}

/** "Helix — argola de prata" → "Argola de prata". */
function nomeCurto(nome: string): string {
  const k = nome.indexOf(' — ');
  if (k < 0) return nome;
  const r = nome.slice(k + 3);
  return r.charAt(0).toUpperCase() + r.slice(1);
}

export function PainelDePiercings({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const raiz = useRef<HTMLElement>(null);
  const meus = itensDaPessoa(vida).filter(x => !!furoDaJoia(x.itemId));
  const deZona = (z: ZonaDePiercing) => ZONAS_DE_PIERCING.find(x => x.id === z)!.furos;
  const ocupados = (z: ZonaDePiercing) => deZona(z).filter(l => estadoDoFuro(vida, l).estado === 'ocupado').length;
  // O pedido da loja (o furo da joia que se olhava) abre a zona e o furo certos.
  const [pedido] = useState(() => pedidoDosPiercings());
  const furoPedido = pedido && pedido !== '-' && zonaDoFuro(pedido) ? pedido : undefined;
  const inicial = furoPedido ? zonaDoFuro(furoPedido)! : ZONAS_DE_PIERCING.find(z => meus.some(x => zonaDoFuro(furoDaJoia(x.itemId)!) === z.id))?.id ?? 'orelha';
  const [zona, setZona] = useState<ZonaDePiercing>(inicial);
  const [furo, setFuro] = useState<string>(furoPedido ?? deZona(inicial).find(l => estadoDoFuro(vida, l).estado !== 'sem_furo') ?? deZona(inicial)[0]);
  const [prova, setProva] = useState<string | undefined>();
  const [prender, setPrender] = useState(false);
  const [perto, setPerto] = useState<Perto>('perto');
  useEffect(() => {
    if (!pedido) return;
    atenderPedido();
    const t = setTimeout(() => raiz.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }), 60);
    return () => clearTimeout(t);
  }, [pedido]);
  if (i < IDADE_MINIMA_PIERCING && !meus.some(x => !!itemEstilo(x.itemId)?.piercing)) return null;

  const vis = vida.eu.visual;
  const corpo = tipoDeCorpo(vida);
  const umbigo = zona === 'umbigo';
  const previa = previaDoPainel(vis, prova, prender, perto === 'perto' && !umbigo);
  const foco = umbigo
    ? focoDaPeca(vida.eu.genero, corpo, i, perto === 'perto' ? 'umbigo' : 'tronco')
    : focoDoRosto(perto === 'perto' ? zona : 'rosto', i);
  const pecas = itensDaPessoa(vida).filter(x => x.usando);
  const cobre = zona === 'orelha' && cabeloCobreOrelha(vis.cabelo);
  const bigode = zona === 'boca' && temBigode(vis, vida.eu.genero, i);
  const provando = prova ? itemEstilo(prova) : undefined;
  const trocarZona = (z: ZonaDePiercing) => { setZona(z); setProva(undefined); setFuro(deZona(z).find(l => estadoDoFuro(vida, l).estado !== 'sem_furo') ?? deZona(z)[0]); };
  const trocarFuro = (l: string) => { setFuro(l); setProva(undefined); };

  const est = estadoDoFuro(vida, furo);
  const nomeFuro = NOME_DO_FURO[furo] ?? furo;
  const minhasDoFuro = meus.filter(x => furoDaJoia(x.itemId) === furo);
  const tenho = new Set(minhasDoFuro.map(x => x.itemId));
  const catalogo = joiasDoFuro(furo).filter(it => !tenho.has(it.id)).sort((a, b) => a.preco - b.preco);
  const emUso = est.emUso ? minhasDoFuro.find(x => x.id === est.emUso) : undefined;
  const menor = i < IDADE_MINIMA_PIERCING && furo !== 'orelha';

  return (
    <section className="a14-pc" id="a14-piercings" ref={raiz} aria-labelledby="a14-pc-titulo">
      <h3 id="a14-pc-titulo" className="subtitulo">Piercings</h3>
      <p className="nota">Escolha a parte do corpo e o furo: as joias que cabem nele, com o preço. Experimente na lupa, compre, use, troque ou tire — tudo aqui.</p>
      <Escolha rotulo="Parte do corpo" valor={zona} aoMudar={trocarZona} opcoes={ZONAS_DE_PIERCING.map(z => ({ id: z.id, rotulo: ocupados(z.id) ? `${z.nome} · ${ocupados(z.id)}` : z.nome }))} />
      <div className="a14-pc__corpo">
        <figure className="a14-pc__lupa" data-zona={zona} data-perto={perto}>
          {zona === 'orelha' && perto === 'perto' ? (
            <OrelhaDePerto ids={previa.piercings} brinco={previa.brincos || previa.joia === 'brincos' ? previa.modeloBrincos ?? 'brincos' : false} pele={corDaPele(vis.pele)[0]} sombra={corDaPele(vis.pele)[1]}
              cabelo={cobre && !prender ? corDoCabelo(vis.corCabelo) : undefined} largura={220} rotulo={provando ? `Experimentando: ${provando.nome}` : 'A orelha de perto'} />
          ) : <Figura visual={previa} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={corpo} pecas={umbigo ? [] : pecas} semCima={umbigo} tatuagens={umbigo ? tatuagensNaFigura(vida) : []}
            largura={220} foco={foco} rotulo={provando ? `Experimentando: ${provando.nome}` : `Piercings: ${zona}`} />}
          <figcaption className="nota">{provando ? <>Experimentando <strong>{nomeCurto(provando.nome).toLowerCase()}</strong></> : 'Como está hoje'}</figcaption>
          <div className="a14-pc__controles">
            <Escolha rotulo="Aproximar" valor={perto} aoMudar={setPerto} opcoes={[{ id: 'perto', rotulo: 'De perto' }, { id: 'longe', rotulo: umbigo ? 'O tronco' : 'O rosto' }]} />
            {cobre && <label className="marcar"><input type="checkbox" checked={prender} onChange={e => setPrender(e.target.checked)} /> Prender o cabelo (só na prévia)</label>}
          </div>
        </figure>
        <div className="a14-pc__painel">
          <div className="a14-pc__furos" role="radiogroup" aria-label="Furos">
            {deZona(zona).map(l => {
              const e = estadoDoFuro(vida, l).estado;
              return (
                <button key={l} type="button" role="radio" aria-checked={furo === l} data-furo={l} data-estado={e} className={`a14-pc__furo a14-pc__furo--${e}${furo === l ? ' a14-pc__furo--ativo' : ''}`} onClick={() => trocarFuro(l)}>
                  <span className="a14-pc__furo-nome">{NOME_DO_FURO[l] ?? l}</span>
                  <span className={`a14-pc__selo a14-pc__selo--${e}`}>{ROTULO_ESTADO[e]}</span>
                </button>
              );
            })}
          </div>
          {cobre && !prender && <p className="nota">O cabelo cobre a orelha: os furos da cartilagem quase não aparecem. Prenda o cabelo na prévia para ver.</p>}
          {bigode && <p className="nota">Com o bigode, o medusa fica escondido debaixo dele.</p>}
          {umbigo && <p className="nota">A blusa cobre o umbigo: a prévia mostra sem a parte de cima.</p>}

          <div className="a14-pc__detalhe" data-furo-aberto={furo}>
            <p className="a14-pc__estado" role="status">
              <strong>{nomeFuro}</strong>{' · '}
              {est.estado === 'ocupado' && <>em uso: {nomeCurto(itemEstilo(emUso!.itemId)!.nome).toLowerCase()}{est.desde !== undefined ? ` · furado em ${anoDe(est.desde)}` : ''}</>}
              {est.estado === 'livre' && <>furo feito{est.desde !== undefined ? ` em ${anoDe(est.desde)}` : ''}, sem joia agora</>}
              {est.estado === 'sem_furo' && <>ainda sem furo: a primeira joia vem com o furo, feito no estúdio. Cicatriza em {CICATRIZACAO[furo] ?? 'alguns meses'}.</>}
            </p>
            {menor && est.estado === 'sem_furo' && <p className="nota">O estúdio só fura a partir dos {IDADE_MINIMA_PIERCING}.</p>}

            {minhasDoFuro.length > 0 && (
              <>
                <h4 className="a14-pc__titulo">As suas</h4>
                <ul className="a14-pc__lista">
                  {minhasDoFuro.map(x => <MinhaJoia key={x.id} vida={vida} agir={agir} x={x} prova={prova} provar={setProva} />)}
                </ul>
              </>
            )}
            <h4 className="a14-pc__titulo">{minhasDoFuro.length ? 'Outras joias para este furo' : 'Joias para este furo'}</h4>
            {catalogo.length === 0 && <p className="nota">Você já tem todas as joias deste furo.</p>}
            <ul className="a14-pc__lista">
              {catalogo.map(it => <JoiaDaLoja key={it.id} vida={vida} agir={agir} it={it} prova={prova} provar={setProva} />)}
            </ul>
            <p className="nota">Comprar já põe a joia no furo; a que estava ali fica guardada. A joia que sai continua sua, e o furo também.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MinhaJoia({ vida, agir, x, prova, provar }: { vida: Vida; agir: (a: Acao) => boolean; x: ItemDeEstilo; prova?: string; provar: (id: string | undefined) => void }) {
  const it = itemEstilo(x.itemId)!;
  const naProva = prova === x.itemId;
  return (
    <li className={`a14-pc__joia${x.usando ? ' a14-pc__joia--uso' : ''}${naProva ? ' a14-pc__joia--prova' : ''}`} data-joia={x.itemId} data-minha="1">
      <button type="button" className="a14-pc__provar" aria-pressed={naProva} onClick={() => provar(naProva ? undefined : x.itemId)} title={it.descricao}>
        <Amostra itemId={x.itemId} /><span className="a14-pc__nome">{nomeCurto(it.nome)}</span>
      </button>
      <span className="a14-pc__info nota">{x.usando ? 'Em uso' : x.local ? 'Guardada no cofre' : 'Guardada'}</span>
      <span className="a14-pc__acoes">
        {x.usando
          ? <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: x.itemId, id: x.id, usar: false }} agir={agir} variante="discreto" aoAgir={() => provar(undefined)}>Tirar</BotaoAcao>
          : <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: x.itemId, id: x.id, usar: true }} agir={agir} variante="principal" aoAgir={() => provar(undefined)}>Usar</BotaoAcao>}
      </span>
    </li>
  );
}

function JoiaDaLoja({ vida, agir, it, prova, provar }: { vida: Vida; agir: (a: Acao) => boolean; it: ItemEstilo; prova?: string; provar: (id: string | undefined) => void }) {
  const naProva = prova === it.id;
  const p = precoNoPainel(vida, it.id);
  return (
    <li className={`a14-pc__joia${naProva ? ' a14-pc__joia--prova' : ''}${it.luxo ? ' a14-pc__joia--luxo' : ''}`} data-joia={it.id}>
      <button type="button" className="a14-pc__provar" aria-pressed={naProva} onClick={() => provar(naProva ? undefined : it.id)} title={it.descricao}>
        <Amostra itemId={it.id} /><span className="a14-pc__nome">{nomeCurto(it.nome)}</span>
      </button>
      <span className="a14-pc__info"><strong>{dinheiro(p.joia)}</strong>{p.furo > 0 && <span className="nota"> + furo {dinheiro(p.furo)}</span>}</span>
      <span className="a14-pc__acoes">
        <BotaoAcao vida={vida} acao={{ tipo: 'piercing14', oque: { op: 'comprar', itemId: it.id } }} agir={agir} variante={naProva ? 'principal' : 'secundario'} aoAgir={() => provar(undefined)}>{p.furo > 0 ? 'Furar e comprar' : 'Comprar'}</BotaoAcao>
      </span>
      {naProva && <span className="a14-pc__descricao nota">{it.descricao}</span>}
    </li>
  );
}
