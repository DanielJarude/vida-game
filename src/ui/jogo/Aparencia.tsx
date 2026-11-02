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
const EstudioDeTatuagem = sobDemanda(() => import('./Tatuagens').then(m => m.EstudioDeTatuagem));
import { useState } from 'react';
import type { Vida, Visual } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { AUTONOMIA, faseDeAutonomia } from '../../motor/sistemas/autonomia';
import { itensDaPessoa, podeTerBarba, precisaDeOculos, texturaNatural, type MudancaVisual } from '../../motor/sistemas/estilo';
import { BARBAS, BARBAS_COM_BIGODE, CORES_NATURAIS, CORES_TINTA, CORTES, NOME_COR, TIPOS_DE_CABELO, itemEstilo } from '../../motor/dados/estilo';
import { texturaDe } from '../avatar/cabelos';
import { FiguraSobDemanda as Figura } from '../avatar/figuraSobDemanda';
import { NOME_DO_CORPO, tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { lugaresDoItem } from '../../motor/dados/estilo';
import { BotaoAcao } from '../comum';
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
  { id: 'anel', nome: 'Anel', lugares: ['anel'] }, { id: 'joia', nome: 'No pescoço', lugares: ['joia'] }, { id: 'orelha', nome: 'Nas orelhas', lugares: ['orelha'] }
];

function OQueVeste({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const itens = itensDaPessoa(vida);
  if (!itens.length) return null;
  const daParte = (l: string[]) => itens.filter(x => { const it = itemEstilo(x.itemId); return !!it && lugaresDoItem(it).some(y => l.includes(y)) && (it.lugar === 'casaco') === l.includes('casaco'); });
  const partes = PARTES.map(p => ({ ...p, itens: daParte(p.lugares) })).filter(p => p.itens.length);
  return (
    <div className="aparencia__itens">
      <h3 className="subtitulo">O que você está usando</h3>
      <ul className="vestir">
        {partes.map(p => {
          const atual = p.itens.find(x => x.usando);
          return (
            <li key={p.id} className="vestir__parte" data-parte={p.id}>
              <span className="vestir__nome">{p.nome}</span>
              <span className="vestir__atual">{atual ? itemEstilo(atual.itemId)!.nome : <span className="nota">nada</span>}</span>
              <span className="vestir__trocar">
                {p.itens.filter(x => !x.usando).map(x => <BotaoAcao key={x.id} vida={vida} acao={{ tipo: 'usar_item', itemId: x.itemId, id: x.id, usar: true }} agir={agir} variante="discreto">{itemEstilo(x.itemId)!.nome}</BotaoAcao>)}
                {atual && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: atual.itemId, id: atual.id, usar: false }} agir={agir} variante="discreto">Tirar</BotaoAcao>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="nota">A peça que sai fica guardada: é sua, dá para voltar a usar quando quiser.</p>
    </div>
  );
}
