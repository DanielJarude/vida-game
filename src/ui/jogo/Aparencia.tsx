/**
 * Você · Aparência e estilo: como você escolhe se apresentar. Mudar o corte,
 * a cor, a barba é de graça; óculos, chapéus e roupas são coisas que você
 * tem (compradas em Vida · Compras) e usa ou guarda. A prévia mostra o
 * rosto antes de mudar. Nada disso é moral, e nada disso dá fama.
 */

import { sobDemanda } from '../util/sobDemanda';
/** REWORK 12.4: o guarda-roupa por estilo e ocasião (pacote sob demanda). */
const GuardaRoupa = sobDemanda(() => import('./Personalizar').then(m => m.GuardaRoupa));
/** HOTFIX 11.5.1: o estúdio de tatuagem (pacote sob demanda). */
/** 12.7: a miniatura de cada peça (a figura recortada) vem sob demanda, como a figura inteira. */
const Miniatura = sobDemanda(() => import('../avatar/MiniaturaDaPeca').then(m => m.MiniaturaDaPeca));
const EstudioDeTatuagem = sobDemanda(() => import('./Tatuagens').then(m => m.EstudioDeTatuagem));
import { useState } from 'react';
import type { Vida, Visual } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { AUTONOMIA, faseDeAutonomia } from '../../motor/sistemas/autonomia';
import { itensDaPessoa, sementeDaPeca, podeTerBarba, precisaDeOculos, texturaNatural, type MudancaVisual } from '../../motor/sistemas/estilo';
import { BARBAS, BARBAS_COM_BIGODE, CORES_NATURAIS, CORES_TINTA, CORTES, NOME_COR, TIPOS_DE_CABELO, itemEstilo } from '../../motor/dados/estilo';
import { texturaDe } from '../avatar/cabelos';
import { FiguraSobDemanda as Figura } from '../avatar/figuraSobDemanda';
import { NOME_DO_CORPO, tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { lugaresDoItem } from '../../motor/dados/estilo';
import { BotaoAcao } from '../comum';
import { nomeDaMarca } from '../../motor/sistemas/lojas';
import { composicoesNaFigura, tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import type { Aba } from '../navegacao';

interface Props { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void }

export function AparenciaEEstilo({ vida, agir, irPara }: Props) {
  const i = idade(vida);
  const vis = vida.eu.visual;
  const [m, setM] = useState<MudancaVisual>({});
  if (i < 3) return null;
  const fase = faseDeAutonomia(i);
  const previa: Visual = { ...vis, ...m, ...(m.barba === 'nenhuma' ? { barba: undefined } : {}) };
  const mudou = Object.keys(m).length > 0;
  const natural = vida.eu.estilo?.corNatural ?? vis.corCabelo;
  const cores = [...new Set([natural, ...(i >= AUTONOMIA.aparencia.idade ? [...CORES_NATURAIS, ...CORES_TINTA] : [])])];
  const cortes = CORTES.filter(c => i >= AUTONOMIA.aparencia.idade || !['raspado', 'black', 'trancas', 'locs'].includes(c.id));
  // HOTFIX dos cabelos — o TIPO de cabelo (liso, ondulado, encaracolado, cacheado, crespo). O natural vem dos genes; os
  // outros são química (alisar, fazer cachos), liberados na idade de decidir o visual. Voltar ao natural, sempre.
  const tipoAtual = texturaDe(vis.cabelo, vis.textura);
  const tipoNatural = texturaNatural(vida) ?? tipoAtual;
  const tipos = TIPOS_DE_CABELO.filter(t => i >= AUTONOMIA.aparencia.idade || t.id === tipoAtual || t.id === tipoNatural);
  const tipoEscolhido = TIPOS_DE_CABELO.find(t => t.id === (m.textura ?? tipoAtual));
  const itens = itensDaPessoa(vida);
  const barba = podeTerBarba(vida);
  const barbaAtual = vis.barba ?? 'nenhuma';
  const set = (k: keyof MudancaVisual, x: string | boolean | undefined, atual: unknown) => setM(o => { const n = { ...o } as Record<string, unknown>; if (x === atual) delete n[k]; else n[k] = x; return n as MudancaVisual; });
  return (
    <section className="aparencia" aria-labelledby="aparencia-titulo">
      <h2 id="aparencia-titulo" className="voce-subtitulo">Aparência e estilo</h2>
      {fase === 'familia_decide' ? <p className="nota">{AUTONOMIA.aparencia_basica.antes}</p> : (
        <div className="aparencia__corpo">
          <div className="aparencia__previa">
            {/* 12.4.1: o corpo inteiro (o tipo de corpo vem do condicionamento, dos hábitos e do que se pratica). */}
            <Figura visual={previa} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={tipoDeCorpo(vida)} pecas={itens.filter(x => x.usando)} tatuagens={tatuagensNaFigura(vida)} composicoes={composicoesNaFigura(vida)} largura={150} rotulo={mudou ? 'Como ficaria' : 'Como você está'} />
            <span className="nota">{mudou ? 'Como ficaria' : 'Hoje'} · corpo {NOME_DO_CORPO[tipoDeCorpo(vida)]}</span>
          </div>
          <div className="aparencia__escolhas">
            <label className="campo">
              <span className="campo__rotulo">Corte</span>
              <select value={m.cabelo ?? vis.cabelo} onChange={e => set('cabelo', e.target.value, vis.cabelo)}>
                {cortes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <div className="campo">
              <label className="campo__rotulo" htmlFor="tipo-cabelo">Tipo de cabelo</label>
              <select id="tipo-cabelo" value={m.textura ?? tipoAtual} onChange={e => set('textura', e.target.value, tipoAtual)} aria-describedby="tipo-cabelo-nota">
                {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}{t.id === tipoNatural ? ' (natural)' : ''}</option>)}
              </select>
              <span className="campo__nota" id="tipo-cabelo-nota">{tipoEscolhido?.nota}{m.textura && m.textura !== tipoNatural ? ' — química no salão; o natural volta quando quiser' : ''}</span>
            </div>
            <label className="campo">
              <span className="campo__rotulo">Cor do cabelo</span>
              <select value={m.corCabelo ?? vis.corCabelo} onChange={e => set('corCabelo', e.target.value, vis.corCabelo)}>
                {[...new Set([vis.corCabelo, ...cores])].map(c => <option key={c} value={c}>{NOME_COR[c] ?? c}{c === natural ? ' (natural)' : ''}</option>)}
              </select>
            </label>
            {barba && (
              <label className="campo">
                <span className="campo__rotulo">Barba</span>
                <select value={m.barba ?? barbaAtual} onChange={e => set('barba', e.target.value, barbaAtual)}>
                  {BARBAS.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                </select>
              </label>
            )}
            {barba && BARBAS_COM_BIGODE.includes(m.barba ?? barbaAtual) && (
              <label className="marcar"><input type="checkbox" checked={(m.bigode ?? vis.bigode) !== false} onChange={e => set('bigode', e.target.checked ? undefined : false, vis.bigode === false ? false : undefined)} /> Com bigode</label>
            )}
            {!barba && i < AUTONOMIA.barba.idade && vida.eu.genero !== 'feminino' && <p className="nota">{AUTONOMIA.barba.antes}</p>}
            {i < AUTONOMIA.aparencia.idade && <p className="nota">Raspar, pintar e mudar de vez ainda passa pela família.</p>}
            {mudou && (
              <div className="grupo-acoes grupo-acoes--linha">
                <BotaoAcao vida={vida} acao={{ tipo: 'aparencia', mudanca: m }} agir={agir} variante="principal" aoAgir={() => setM({})}>{i < 13 ? 'Pedir esse corte' : 'Mudar o visual'}</BotaoAcao>
                <button type="button" className="botao botao--discreto" onClick={() => setM({})}>Deixar como está</button>
              </div>
            )}
          </div>
        </div>
      )}
      {i >= 3 && <OQueVeste vida={vida} agir={agir} />}
      <GuardaRoupa vida={vida} agir={agir} />
      {(i >= 16 || (vida.eu.tatuagens?.length ?? 0) > 0) && <EstudioDeTatuagem vida={vida} agir={agir} />}
      {i >= AUTONOMIA.compra_pessoal.idade && (
        <p className="nota">{precisaDeOculos(vida) && !itens.some(x => x.itemId === 'oculos_grau') ? 'A vista anda pedindo óculos de grau. ' : ''}Óculos, chapéus, roupas: <button type="button" className="link" onClick={() => irPara('compras')}>Vida · Compras →</button></p>
      )}
    </section>
  );
}

/**
 * 12.4.1 — o que se veste, parte por parte: a cabeça, o rosto, a parte de cima, a de baixo (ou a peça inteira), o que vai
 * por cima, os pés, o pulso, a pulseira, a mão, o pescoço e as orelhas. Cada parte mostra o que está em uso e deixa trocar
 * por outra peça sua (ou tirar) — a peça que sai continua sua, guardada. É o mesmo inventário de sempre (`usar_item`).
 */
const PARTES: { id: string; nome: string; lugares: string[] }[] = [
  { id: 'cabeca', nome: 'Na cabeça', lugares: ['cabeca'] }, { id: 'rosto', nome: 'No rosto', lugares: ['rosto'] },
  { id: 'tronco', nome: 'Parte de cima', lugares: ['tronco'] }, { id: 'pernas', nome: 'Parte de baixo', lugares: ['pernas'] },
  { id: 'casaco', nome: 'Por cima', lugares: ['casaco'] }, { id: 'pes', nome: 'Nos pés', lugares: ['pes'] },
  { id: 'pulso', nome: 'Relógio', lugares: ['pulso'] }, { id: 'pulseira', nome: 'Pulseira', lugares: ['pulseira'] },
  { id: 'anel', nome: 'Anel', lugares: ['anel'] }, { id: 'joia', nome: 'No pescoço', lugares: ['joia'] }, { id: 'orelha', nome: 'Nas orelhas', lugares: ['orelha'] },
  // VIDA 12.9: os piercings — um cartão por furo (trocar a joia, tirar).
  { id: 'helix', nome: 'Piercing no helix', lugares: ['helix'] }, { id: 'tragus', nome: 'Piercing no tragus', lugares: ['tragus'] },
  { id: 'nariz', nome: 'Piercing no nariz', lugares: ['nariz'] }, { id: 'septo', nome: 'Piercing no septo', lugares: ['septo'] },
  { id: 'sobrancelha', nome: 'Piercing na sobrancelha', lugares: ['sobrancelha'] }, { id: 'labio', nome: 'Piercing no lábio', lugares: ['labio'] },
  { id: 'umbigo', nome: 'Piercing no umbigo', lugares: ['umbigo'] }
];

export function OQueVeste({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const itens = itensDaPessoa(vida);
  if (!itens.length) return null;
  const daParte = (l: string[]) => itens.filter(x => { const it = itemEstilo(x.itemId); return !!it && lugaresDoItem(it).some(y => l.includes(y)) && (it.lugar === 'casaco') === l.includes('casaco'); });
  const partes = PARTES.map(p => ({ ...p, itens: daParte(p.lugares) })).filter(p => p.itens.length);
  return (
    <div className="aparencia__itens">
      <h3 className="subtitulo">O que você está usando</h3>
      {/* 12.7: um cartão por parte do corpo — a peça (o desenho dela), a marca, trocar por outra sua ou tirar. */}
      <ul className="vestir vestir--cartoes">
        {partes.map(p => <ParteDoCorpo key={p.id} vida={vida} agir={agir} parte={p} />)}
      </ul>
      <p className="nota">A peça que sai fica guardada: é sua, dá para voltar a usar quando quiser.</p>
      {idade(vida) >= 10 && <LooksSalvos vida={vida} agir={agir} />}
    </div>
  );
}

function ParteDoCorpo({ vida, agir, parte }: { vida: Vida; agir: (a: Acao) => boolean; parte: { id: string; nome: string; itens: ReturnType<typeof itensDaPessoa> } }) {
  const atual = parte.itens.find(x => x.usando);
  const outras = parte.itens.filter(x => !x.usando);
  const [escolhida, setEscolhida] = useState(outras[0]?.id ?? '');
  const alvo = outras.find(x => x.id === escolhida) ?? outras[0];
  const it = atual ? itemEstilo(atual.itemId)! : undefined;
  const inteira = !!it && it.lugar === 'corpo' && parte.id === 'pernas';
  return (
    <li className="vestir__parte vestir__cartao" data-parte={parte.id}>
      <span className="vestir__miniatura" aria-hidden={!atual}>{atual ? <Miniatura vida={vida} itemId={atual.itemId} id={sementeDaPeca(atual)} largura={64} /> : <span className="vestir__vazio">—</span>}</span>
      <span className="vestir__info">
        <span className="vestir__nome">{parte.nome}</span>
        <span className="vestir__atual">{it ? it.nome : <span className="nota">nada</span>}{inteira ? <span className="nota"> (a peça inteira)</span> : null}</span>
        {atual?.marca && <span className="nota vestir__marca">{nomeDaMarca(atual.marca) ?? atual.marca}</span>}
      </span>
      <span className="vestir__trocar">
        {outras.length > 1 && (
          <label className="campo campo--compacto"><span className="campo__rotulo">Trocar por</span>
            <select value={alvo?.id ?? ''} onChange={e => setEscolhida(e.target.value)}>{outras.map(x => <option key={x.id} value={x.id}>{itemEstilo(x.itemId)!.nome}{x.marca ? ` (${nomeDaMarca(x.marca) ?? x.marca})` : ''}</option>)}</select>
          </label>
        )}
        {alvo && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: alvo.itemId, id: alvo.id, usar: true }} agir={agir} variante="discreto">{outras.length > 1 ? 'Vestir' : `Vestir ${itemEstilo(alvo.itemId)!.nome.toLowerCase()}`}</BotaoAcao>}
        {atual && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: atual.itemId, id: atual.id, usar: false }} agir={agir} variante="discreto">Tirar</BotaoAcao>}
      </span>
    </li>
  );
}

/**
 * VIDA 12.9 — OS LOOKS COM NOME: o que se está usando agora, guardado com um nome (casual, trabalho, festa...), para
 * vestir de novo com um toque. Guarda as peças de verdade (os ids do guarda-roupa): vestir um look veste aquelas peças,
 * não outras parecidas. Não precisa ter todas as partes — o que o look não tem continua como está.
 */
const SUGESTOES_DE_LOOK = ['Casual', 'Trabalho', 'Formal', 'Esportivo', 'Elegante', 'Alternativo', 'Festa'];
function LooksSalvos({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const salvos = vida.eu.estilo?.looksSalvos ?? [];
  const meus = new Map((vida.eu.estilo?.itens ?? []).map(x => [x.id, x]));
  const livre = SUGESTOES_DE_LOOK.find(n => !salvos.some(l => l.nome.toLowerCase() === n.toLowerCase())) ?? '';
  const [nome, setNome] = useState(livre);
  const [renomeando, setRenomeando] = useState<{ id: string; nome: string } | null>(null);
  const op = (o: Extract<Acao, { tipo: 'personalizar' }>['op']): Acao => ({ tipo: 'personalizar', op: o });
  const i = idade(vida);
  return (
    <section className="looks" aria-labelledby="looks-titulo">
      <h3 id="looks-titulo" className="subtitulo">Meus looks</h3>
      <div className="looks__novo">
        <label className="campo campo--compacto"><span className="campo__rotulo">Guardar o que estou usando como</span>
          <input type="text" value={nome} maxLength={32} onChange={e => setNome(e.target.value)} list="looks-sugestoes" placeholder="Ex.: Casual" /></label>
        <datalist id="looks-sugestoes">{SUGESTOES_DE_LOOK.map(n => <option key={n} value={n} />)}</datalist>
        <BotaoAcao vida={vida} agir={a => { const ok = agir(a); if (ok) setNome(''); return ok; }} acao={op({ o: 'look_salvar', nome })} variante="secundario">Guardar look</BotaoAcao>
      </div>
      {salvos.length === 0 ? <p className="nota">Monte a roupa acima e guarde com um nome: depois é só vestir de novo.</p> : (
        <ul className="looks__lista">
          {salvos.map(l => {
            const pecas = l.itens.map(id => meus.get(id)).filter((x): x is NonNullable<typeof x> => !!x);
            const emUso = pecas.length > 0 && pecas.every(x => x.usando);
            return (
              <li key={l.id} className="looks__look" data-look={l.id}>
                <span className="looks__figura" aria-hidden>
                  <Figura visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={tipoDeCorpo(vida)} pecas={pecas} largura={56} semFundo rotulo={l.nome} />
                </span>
                <span className="looks__texto">
                  {renomeando?.id === l.id ? (
                    <span className="looks__renomear">
                      <input type="text" aria-label="Novo nome" value={renomeando.nome} maxLength={32} onChange={e => setRenomeando({ id: l.id, nome: e.target.value })} />
                      <BotaoAcao vida={vida} agir={a => { const ok = agir(a); if (ok) setRenomeando(null); return ok; }} acao={op({ o: 'look_renomear', id: l.id, nome: renomeando.nome })} variante="discreto">Salvar nome</BotaoAcao>
                    </span>
                  ) : <strong>{l.nome}</strong>}
                  <span className="nota">{pecas.length ? pecas.map(x => itemEstilo(x.itemId)?.nome ?? x.itemId).join(' · ') : 'As peças deste look não são mais suas.'}{emUso ? ' · em uso' : ''}</span>
                  <span className="looks__acoes">
                    <BotaoAcao vida={vida} agir={agir} acao={op({ o: 'look_vestir', id: l.id })} variante="secundario" ocultarImpossivel>Vestir</BotaoAcao>
                    <BotaoAcao vida={vida} agir={agir} acao={op({ o: 'look_salvar', id: l.id, nome: l.nome })} variante="discreto">Trocar pelo que estou usando</BotaoAcao>
                    {renomeando?.id !== l.id && <button type="button" className="botao botao--discreto" onClick={() => setRenomeando({ id: l.id, nome: l.nome })}>Renomear</button>}
                    <BotaoAcao vida={vida} agir={agir} acao={op({ o: 'look_excluir', id: l.id })} variante="discreto">Apagar</BotaoAcao>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
