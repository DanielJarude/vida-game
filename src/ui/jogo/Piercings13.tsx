/**
 * VIDA 13 — OS PIERCINGS EM VOCÊ · APARÊNCIA (junto das tatuagens). A loja vende; aqui se vê, experimenta, usa, troca e
 * tira o que já é seu. A lupa aproxima cada zona do corpo (a orelha, o nariz, a sobrancelha, a boca, o umbigo) na mesma
 * figura de sempre (`Figura` com `foco`, a ideia da lupa do estúdio de tatuagem): o que se vê é o desenho de verdade,
 * só mais perto. Cada furo é um lugar (um de cada vez); a zona junta os furos que a anatomia deixa ter juntos.
 * Experimentar é só a prévia: nada muda até "Usar esta" (a ação `usar_item` de sempre, com o id da peça).
 */
import { useState } from 'react';
import type { Vida, Visual } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { itemEstilo } from '../../motor/dados/estilo';
import { COR_DO_METAL, IDADE_MINIMA_PIERCING, NOME_DA_REGIAO } from '../../motor/dados/piercings129';
import { NOME_DO_FURO, ZONAS_DE_PIERCING, zonaDoFuro, type ZonaDePiercing } from '../../motor/dados/piercings13';
import { itensDaPessoa } from '../../motor/sistemas/estilo';
import { tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import { Figura, focoDaPeca } from '../avatar/Figura';
import { cabeloCobreOrelha, focoDoRosto, temBigode } from '../avatar/identidade13';
import { OrelhaDePerto } from '../avatar/piercings';
import { corDaPele, corDoCabelo } from '../avatar/Retrato';
import { BotaoAcao, Escolha } from '../comum';
import type { ItemDeEstilo } from '../../motor/tipos';
import type { Aba } from '../navegacao';

type Perto = 'perto' | 'longe';

/** O que é joia de furo (os piercings e, no lóbulo, os brincos). */
const deFuro = (x: ItemDeEstilo) => { const it = itemEstilo(x.itemId); return !!it && (!!it.piercing || it.lugar === 'orelha'); };

/** A amostra da joia: o metal (e a pedra) num botãozinho. */
function Amostra({ itemId }: { itemId: string }) {
  const it = itemEstilo(itemId);
  const p = it?.piercing;
  const [c, s] = p ? COR_DO_METAL[p.metal] ?? COR_DO_METAL.aco : ['#d8b45a', '#8d6f2a'];
  return (
    <svg className="piercings13__amostra" viewBox="0 0 12 12" width={16} height={16} aria-hidden="true">
      {p?.forma === 'argola' || p?.forma === 'clicker' || p?.forma === 'ferradura' ? <circle cx={6} cy={6} r={4} fill="none" stroke={c} strokeWidth={1.6} /> : <circle cx={6} cy={6} r={3.6} fill={c} stroke={s} strokeWidth={0.6} />}
      {p?.pedra && <circle cx={6} cy={p.forma === 'argola' || p.forma === 'clicker' ? 10 : 6} r={1.8} fill={p.pedra} stroke={s} strokeWidth={0.4} />}
    </svg>
  );
}

/** O visual da prévia: a joia experimentada no furo dela (a que estava ali sai só da prévia); o cabelo preso, se pedido. */
export function visualDaPrevia(base: Visual, prova: string | undefined, prender: boolean): Visual {
  const v: Visual = { ...base, piercings: [...(base.piercings ?? [])] };
  if (prova) {
    const it = itemEstilo(prova);
    if (it?.piercing) v.piercings = [...v.piercings!.filter(id => itemEstilo(id)?.lugar !== it.lugar), prova].sort();
    else if (it?.lugar === 'orelha') { v.brincos = true; v.modeloBrincos = prova; }
  }
  if (prender && cabeloCobreOrelha(v.cabelo)) v.cabelo = 'coque';
  // Na lupa da orelha, o chapéu sai (cobriria o alto da orelha) — só na prévia.
  return v;
}

export function PiercingsDaAparencia({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }) {
  const i = idade(vida);
  const meus = itensDaPessoa(vida).filter(x => !x.local && deFuro(x));
  const temPiercing = meus.some(x => !!itemEstilo(x.itemId)?.piercing);
  const conta = (z: ZonaDePiercing) => meus.filter(x => zonaDoFuro(itemEstilo(x.itemId)!.lugar!) === z).length;
  const inicial = ZONAS_DE_PIERCING.find(z => conta(z.id) > 0)?.id ?? 'orelha';
  const [zona, setZona] = useState<ZonaDePiercing>(inicial);
  const [prova, setProva] = useState<string | undefined>();
  const [prender, setPrender] = useState(false);
  const [perto, setPerto] = useState<Perto>('perto');
  if (i < IDADE_MINIMA_PIERCING && !temPiercing) return null;
  const vis = vida.eu.visual;
  const corpo = tipoDeCorpo(vida);
  const def = ZONAS_DE_PIERCING.find(z => z.id === zona)!;
  const previa = visualDaPrevia(vis, prova, prender);
  // Na lupa, o chapéu sai da cabeça (cobriria a orelha e a sobrancelha) — só na prévia; a figura de corpo inteiro mostra tudo.
  const semChapeu: Visual = perto === 'perto' && zona !== 'umbigo' ? (() => { const v = { ...previa }; delete v.chapeu; delete v.modeloChapeu; return v; })() : previa;
  const umbigo = zona === 'umbigo';
  const foco = umbigo
    ? (perto === 'perto' ? focoDaPeca(vida.eu.genero, corpo, i, 'umbigo') : focoDaPeca(vida.eu.genero, corpo, i, 'tronco'))
    : focoDoRosto(perto === 'perto' ? zona : 'rosto', i);
  const pecas = itensDaPessoa(vida).filter(x => x.usando);
  const cobre = zona === 'orelha' && cabeloCobreOrelha(vis.cabelo);
  const bigode = zona === 'boca' && temBigode(vis, vida.eu.genero, i);
  const provando = prova ? itemEstilo(prova) : undefined;
  const furos = def.furos.map(l => ({ lugar: l, joias: meus.filter(x => itemEstilo(x.itemId)!.lugar === l) }));
  const comJoia = furos.filter(f => f.joias.length > 0);
  const livres = furos.filter(f => f.joias.length === 0 && f.lugar !== 'orelha');
  const trocarZona = (z: ZonaDePiercing) => { setZona(z); setProva(undefined); };
  return (
    <section className="piercings13" aria-labelledby="piercings13-titulo">
      <h3 id="piercings13-titulo" className="subtitulo">Piercings</h3>
      <p className="nota">Os seus furos e as suas joias: experimente na prévia, use, troque ou tire. Joia nova é na loja.</p>
      <Escolha rotulo="Parte do corpo" valor={zona} aoMudar={trocarZona} opcoes={ZONAS_DE_PIERCING.map(z => ({ id: z.id, rotulo: conta(z.id) ? `${z.nome} · ${conta(z.id)}` : z.nome }))} />
      <div className="piercings13__corpo">
        <figure className="piercings13__lupa" data-zona={zona} data-perto={perto}>
          {zona === 'orelha' && perto === 'perto' ? (
            <OrelhaDePerto ids={previa.piercings} brinco={previa.brincos || previa.joia === 'brincos' ? previa.modeloBrincos ?? 'brincos' : false} pele={corDaPele(vis.pele)[0]} sombra={corDaPele(vis.pele)[1]}
              cabelo={cobre && !prender ? corDoCabelo(vis.corCabelo) : undefined} largura={220} rotulo={provando ? `Experimentando: ${provando.nome}` : 'A orelha de perto'} />
          ) : <Figura visual={semChapeu} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={corpo} pecas={umbigo ? [] : pecas} semCima={umbigo} tatuagens={umbigo ? tatuagensNaFigura(vida) : []}
            largura={220} foco={foco} rotulo={provando ? `Experimentando: ${provando.nome}` : `Piercings: ${def.nome.toLowerCase()}`} />}
          <figcaption className="nota">{provando ? <>Experimentando <strong>{provando.nome.toLowerCase()}</strong></> : 'Como está hoje'} · {perto === 'perto' ? 'de perto' : umbigo ? 'o tronco' : 'o rosto'}</figcaption>
          <div className="piercings13__controles">
            <Escolha rotulo="Aproximar" valor={perto} aoMudar={setPerto} opcoes={[{ id: 'perto', rotulo: 'De perto' }, { id: 'longe', rotulo: umbigo ? 'O tronco' : 'O rosto' }]} />
            {cobre && <label className="marcar"><input type="checkbox" checked={prender} onChange={e => setPrender(e.target.checked)} /> Prender o cabelo (só na prévia)</label>}
          </div>
        </figure>
        <div className="piercings13__furos">
          {cobre && !prender && <p className="nota">O cabelo cobre a orelha: os furos da cartilagem quase não aparecem. Prenda o cabelo na prévia para ver.</p>}
          {bigode && <p className="nota">Com o bigode, o medusa fica escondido debaixo dele.</p>}
          {umbigo && <p className="nota">A blusa cobre o umbigo: a prévia mostra sem a parte de cima.</p>}
          {comJoia.length === 0 && <p className="nota">Nenhuma joia sua {umbigo ? 'para o umbigo' : `para ${def.nome.toLowerCase() === 'boca' ? 'a boca' : def.nome.toLowerCase() === 'sobrancelha' ? 'a sobrancelha' : def.nome.toLowerCase() === 'orelha' ? 'a orelha' : 'o nariz'}`} ainda.</p>}
          <ul className="piercings13__lista">
            {comJoia.map(f => {
              const atual = f.joias.find(x => x.usando);
              const daProva = f.joias.find(x => x.itemId === prova);
              return (
                <li key={f.lugar} className="piercings13__furo" data-furo={f.lugar}>
                  <span className="piercings13__nome"><strong>{NOME_DO_FURO[f.lugar] ?? f.lugar}</strong> <span className="nota">{atual ? `em uso: ${nomeCurto(itemEstilo(atual.itemId)!.nome).toLowerCase()}` : 'sem joia agora'}</span></span>
                  <span className="piercings13__joias" role="group" aria-label={`Joias ${NOME_DA_REGIAO[f.lugar as keyof typeof NOME_DA_REGIAO] ?? 'no lóbulo'}`}>
                    {f.joias.map(x => (
                      <button key={x.id} type="button" className={`piercings13__joia${x.itemId === prova ? ' piercings13__joia--prova' : ''}${x.usando ? ' piercings13__joia--uso' : ''}`} aria-pressed={x.itemId === prova}
                        onClick={() => setProva(x.itemId === prova ? undefined : x.itemId)} title={itemEstilo(x.itemId)!.descricao}>
                        <Amostra itemId={x.itemId} /><span>{nomeCurto(itemEstilo(x.itemId)!.nome)}</span>{x.usando && <span className="sr-only"> (em uso)</span>}
                      </button>
                    ))}
                  </span>
                  <span className="piercings13__acoes">
                    {daProva && !daProva.usando && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: daProva.itemId, id: daProva.id, usar: true }} agir={agir} variante="principal" aoAgir={() => setProva(undefined)}>{atual ? 'Trocar por esta' : 'Usar esta'}</BotaoAcao>}
                    {atual && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: atual.itemId, id: atual.id, usar: false }} agir={agir} variante="discreto" aoAgir={() => setProva(undefined)}>Tirar</BotaoAcao>}
                    {daProva && <button type="button" className="botao botao--discreto" onClick={() => setProva(undefined)}>Voltar</button>}
                  </span>
                </li>
              );
            })}
          </ul>
          {livres.length > 0 && i >= IDADE_MINIMA_PIERCING && (
            <p className="nota">Furos que você ainda não tem aqui: {livres.map(f => (NOME_DO_FURO[f.lugar] ?? f.lugar).toLowerCase()).join(', ')}. <button type="button" className="link" onClick={() => irPara('compras')}>Joias na loja →</button></p>
          )}
          <p className="nota">A joia que sai fica guardada: o furo continua seu.</p>
        </div>
      </div>
    </section>
  );
}

/** O nome da joia sem a parte do furo ("Helix — argola de prata" → "Argola de prata"). */
function nomeCurto(nome: string): string {
  const k = nome.indexOf(' — ');
  if (k < 0) return nome;
  const r = nome.slice(k + 3);
  return r.charAt(0).toUpperCase() + r.slice(1);
}
