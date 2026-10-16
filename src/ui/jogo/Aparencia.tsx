/**
 * Você · Aparência e estilo: como você escolhe se apresentar. Mudar o corte,
 * a cor, a barba é de graça; óculos, chapéus e roupas são coisas que você
 * tem (compradas em Vida · Compras) e usa ou guarda. A prévia mostra o
 * rosto antes de mudar. Nada disso é moral, e nada disso dá fama.
 */

import { useState } from 'react';
import type { Vida, Visual } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { AUTONOMIA, faseDeAutonomia } from '../../motor/sistemas/autonomia';
import { itensDaPessoa, podeTerBarba, precisaDeOculos, texturaNatural, type MudancaVisual } from '../../motor/sistemas/estilo';
import { BARBAS, CORES_NATURAIS, CORES_TINTA, CORTES, NOME_COR, TIPOS_DE_CABELO, itemEstilo } from '../../motor/dados/estilo';
import { texturaDe } from '../avatar/cabelos';
import { Retrato } from '../avatar/Retrato';
import { BotaoAcao } from '../comum';
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
            <Retrato visual={previa} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? "eu"} tamanho={96} rotulo={mudou ? 'Como ficaria' : 'Como você está'} />
            <span className="nota">{mudou ? 'Como ficaria' : 'Hoje'}</span>
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
            {barba && ['curta', 'cheia', 'por_fazer'].includes(m.barba ?? barbaAtual) && (
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
      {itens.length > 0 && (
        <div className="aparencia__itens">
          <h3 className="subtitulo">O que é seu</h3>
          <ul className="itens-estilo">
            {itens.map(x => {
              const it = itemEstilo(x.itemId);
              if (!it) return null;
              // Tudo que é seu se usa ou se guarda (o relógio também: não aparece no retrato, mas está no pulso).
              const usavel = !!it.visual || !!it.lugar;
              return (
                <li key={x.id} className={`item-estilo${x.usando ? ' item-estilo--usando' : ''}`}>
                  <span><strong>{it.nome}</strong>{usavel ? <span className="nota"> · {x.usando ? (it.lugar === 'pulso' ? 'no pulso' : 'em uso') : 'guardado'}</span> : null}</span>
                  {usavel && <BotaoAcao vida={vida} acao={{ tipo: 'usar_item', itemId: x.itemId, usar: !x.usando }} agir={agir} variante="discreto">{x.usando ? 'Tirar' : 'Usar'}</BotaoAcao>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {i >= AUTONOMIA.compra_pessoal.idade && (
        <p className="nota">{precisaDeOculos(vida) && !itens.some(x => x.itemId === 'oculos_grau') ? 'A vista anda pedindo óculos de grau. ' : ''}Óculos, chapéus, roupas: <button type="button" className="link" onClick={() => irPara('compras')}>Vida · Compras →</button></p>
      )}
    </section>
  );
}
