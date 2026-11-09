/**
 * VIDA 14 — Você · Aparência · "Sobrancelhas e rosto": os riscos na sobrancelha (quantos, de que lado, onde, de que
 * jeito), o desenho da sobrancelha, a pinta e os cílios. A prévia é imediata (o rosto inteiro e a lupa da sobrancelha);
 * nada muda até "Fazer" (a ação `rosto14`). Desfazer é escolher "sem" / "natural" e fazer de novo.
 */
import { useState } from 'react';
import type { Vida, Visual } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { AUTONOMIA, faseDeAutonomia } from '../../../motor/sistemas/autonomia';
import {
  CILIOS_14, DESENHOS_DE_SOBRANCELHA, ESTILOS_DE_RISCO, LADOS_DO_RISCO, PINTAS_14, POSICOES_DO_RISCO, type RiscosNaSobrancelha
} from '../../../motor/dados14/aparencia/rosto14';
import type { MudancaRosto14 } from '../../../motor/v14/aparencia/rosto14';
import { Retrato } from '../../avatar/Retrato';
import { Figura } from '../../avatar/Figura';
import { focoDoRosto } from '../../avatar/identidade13';
import { tipoDeCorpo } from '../../../motor/sistemas/silhueta';
import { BotaoAcao, Escolha } from '../../comum';
import './aparencia14.css';

const RISCO_PADRAO: RiscosNaSobrancelha = { quantidade: 1, lado: 'esquerdo', posicao: 'externo', estilo: 'reto' };

/** O visual com a mudança por confirmar (só na prévia). */
export function visualComRosto(base: Visual, m: MudancaRosto14): Visual {
  const v: Visual = { ...base };
  for (const [k, x] of Object.entries(m) as [keyof MudancaRosto14, unknown][]) {
    if (x === null || x === undefined || x === 'nenhum' || (k === 'sobrancelhaDesenho' && x === 'natural')) delete v[k];
    else (v as unknown as Record<string, unknown>)[k] = x;
  }
  return v;
}

export function RostoDetalhes({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const vis = vida.eu.visual;
  const [m, setM] = useState<MudancaRosto14>({});
  if (i < 3 || faseDeAutonomia(i) === 'familia_decide') return null;
  const decide = i >= AUTONOMIA.aparencia.idade;
  const previa = visualComRosto(vis, m);
  const mudou = Object.keys(m).length > 0;
  // Muda um campo da prévia; voltar ao que já é tira o campo da mudança.
  const set = <K extends keyof MudancaRosto14>(k: K, x: MudancaRosto14[K]) => setM(o => {
    const n = { ...o, [k]: x };
    const atual = vis[k] ?? null, novo = x === 'nenhum' || x === 'natural' || x === undefined ? null : x;
    if (JSON.stringify(atual) === JSON.stringify(novo)) delete n[k];
    return n;
  });
  const riscos = 'sobrancelhaRiscos' in m ? m.sobrancelhaRiscos ?? undefined : vis.sobrancelhaRiscos;
  const mudarRisco = (p: Partial<RiscosNaSobrancelha>) => set('sobrancelhaRiscos', { ...(riscos ?? RISCO_PADRAO), ...p });
  const desenho = previa.sobrancelhaDesenho ?? 'natural';
  const estilo = ESTILOS_DE_RISCO.find(e => e.id === riscos?.estilo);
  const sem = (lista: { id: string; nome: string }[], rotulo: string) => [{ id: 'nenhum', nome: rotulo }, ...lista];
  return (
    <section className="a14-rosto" aria-labelledby="a14-rosto-titulo">
      <h3 id="a14-rosto-titulo" className="subtitulo">Sobrancelhas e rosto</h3>
      <p className="nota">Riscos na sobrancelha, o desenho dela, a pinta, os cílios. A prévia muda na hora; nada muda até confirmar.</p>
      <div className="a14-rosto__corpo">
        <div className="a14-rosto__previa">
          <Retrato visual={previa} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} tamanho={132} rotulo={mudou ? 'O rosto como ficaria' : 'O seu rosto hoje'} />
          <Figura visual={(() => { const v = { ...previa }; delete v.chapeu; delete v.modeloChapeu; return v; })()} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={tipoDeCorpo(vida)}
            pecas={[]} largura={132} foco={focoDoRosto('sobrancelha', i)} rotulo="A sobrancelha de perto" />
          <span className="nota">{mudou ? 'Como ficaria' : 'Hoje'} · o rosto e a sobrancelha de perto</span>
        </div>
        <div className="a14-rosto__escolhas">
          {!decide && <p className="nota">{i < AUTONOMIA.aparencia.idade ? 'Riscar ou mexer na sobrancelha ainda passa pela família.' : ''}</p>}
          <label className="campo">
            <span className="campo__rotulo">Desenho da sobrancelha</span>
            <select value={desenho} disabled={!decide} onChange={e => set('sobrancelhaDesenho', e.target.value)}>
              {DESENHOS_DE_SOBRANCELHA.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
            <span className="campo__nota">{DESENHOS_DE_SOBRANCELHA.find(d => d.id === desenho)?.nota}</span>
          </label>
          <fieldset className="a14-rosto__riscos" disabled={!decide}>
            <legend className="campo__rotulo">Riscos na sobrancelha</legend>
            <label className="marcar"><input type="checkbox" checked={!!riscos} onChange={e => set('sobrancelhaRiscos', e.target.checked ? (vis.sobrancelhaRiscos ?? RISCO_PADRAO) : null)} /> Com riscos</label>
            {riscos && (
              <>
                <Escolha rotulo="Quantos riscos" valor={String(riscos.quantidade)} aoMudar={q => mudarRisco({ quantidade: Number(q) })} opcoes={['1', '2', '3'].map(q => ({ id: q, rotulo: q === '1' ? '1 risco' : `${q} riscos` }))} />
                <Escolha rotulo="Lado" valor={riscos.lado} aoMudar={l => mudarRisco({ lado: l })} opcoes={LADOS_DO_RISCO.map(l => ({ id: l.id, rotulo: l.id === 'ambos' ? 'As duas' : l.id === 'esquerdo' ? 'Esquerda' : 'Direita' }))} />
                <Escolha rotulo="Onde" valor={riscos.posicao} aoMudar={p => mudarRisco({ posicao: p })} opcoes={POSICOES_DO_RISCO.map(p => ({ id: p.id, rotulo: p.nome }))} />
                <label className="campo">
                  <span className="campo__rotulo">Estilo do risco</span>
                  <select value={riscos.estilo} onChange={e => mudarRisco({ estilo: e.target.value as RiscosNaSobrancelha['estilo'] })}>
                    {ESTILOS_DE_RISCO.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
                  </select>
                  <span className="campo__nota">{estilo?.nota} Os lados são os seus: a sua esquerda aparece à direita no retrato.</span>
                </label>
              </>
            )}
          </fieldset>
          <label className="campo">
            <span className="campo__rotulo">Pinta</span>
            <select value={previa.pinta ?? 'nenhum'} disabled={!decide} onChange={e => set('pinta', e.target.value)}>
              {sem(PINTAS_14, 'Sem pinta').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <label className="campo">
            <span className="campo__rotulo">Cílios</span>
            <select value={previa.cilios ?? 'nenhum'} disabled={!decide} onChange={e => set('cilios', e.target.value)}>
              {sem(CILIOS_14, 'Naturais').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          {mudou && (
            <div className="grupo-acoes grupo-acoes--linha">
              <BotaoAcao vida={vida} acao={{ tipo: 'rosto14', mudanca: m }} agir={agir} variante="principal" aoAgir={() => setM({})}>Fazer</BotaoAcao>
              <button type="button" className="botao botao--discreto" onClick={() => setM({})}>Deixar como está</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
