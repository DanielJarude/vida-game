/**
 * VIDA 23/24 — Você · Aparência · PELE E MARCAS: as marcas naturais (pintas, sardas, marca de nascença, mancha, cicatriz,
 * estrias, covinhas — o tipo, o lugar, o lado, o tamanho, a posição, o ângulo, a intensidade, quantas).
 *
 * VIDA 24: as proporções saíram daqui (são de nascença: consulta em Aparência · Corpo · De nascença) e os pelos ganharam
 * o painel próprio (Aparência · Pelos, com os cuidados). A prévia é lado a lado, NA MESMA ESCALA (`avatar/referencia`):
 * como você está e como ficaria; a marca escolhida aparece também de perto. Nada muda até confirmar (a ação `corpo23`).
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { AUTONOMIA, faseDeAutonomia } from '../../motor/sistemas/autonomia';
import { corpoDaFigura } from '../../motor/sistemas/silhueta';
import { REGIOES, type RegiaoDeTatuagem } from '../../motor/dados/tatuagens';
import { descreverMarca, MARCAS23, marcaValida, MAXIMO_DE_MARCAS, regiaoTemLado, TIPOS_DE_MARCA, type MarcaNatural, type TipoDeMarca } from '../../motor/v23/corpo/corpo23';
import { Figura, focoDaRegiao } from '../avatar/Figura';
import { LARGURA_DE_REFERENCIA } from '../avatar/referencia';
import { BotaoAcao, Escolha } from '../comum';
import { tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import './corpo23.css';

const nomeDaRegiao = (r: RegiaoDeTatuagem) => REGIOES[r].nome;
const GRUPO_DA_REGIAO: Record<string, string> = { cabeca: 'Rosto e pescoço', tronco: 'Tronco', bracos: 'Braços e mãos', pernas: 'Pernas e pés' };
const igual = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Uma marca nova do tipo, num lugar que cabe (a mesma região, se servir), com o desenho sorteado. */
function marcaNova(t: TipoDeMarca, base?: MarcaNatural): MarcaNatural {
  const def = MARCAS23[t];
  const r = base && def.regioes.includes(base.r) ? base.r : def.regioes[0];
  const m: MarcaNatural = {
    t, r, x: base?.x ?? 0, y: base?.y ?? 0, s: base?.s ?? 1, k: Math.floor(Math.random() * 99999),
    ...(regiaoTemLado(r) && t !== 'covinhas' ? { l: base?.l ?? 'e' } : {}),
    ...(def.formas ? { f: def.formas[0].id } : {}), ...(def.quantidade ? { n: Math.round((def.quantidade[0] + def.quantidade[1]) / 2) } : {}),
    ...(def.intensidade ? { i: 2 as const } : {}), ...(def.gira ? { a: 0 } : {})
  };
  return marcaValida(m)!;
}

export function PeleEMarcas({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const vis = vida.eu.visual;
  const [marcas, setMarcas] = useState<MarcaNatural[]>(() => vis.marcas23 ?? []);
  const [sel, setSel] = useState<number | null>(null);
  const [vista, setVista] = useState<'frente' | 'costas'>('frente');
  const [pele, setPele] = useState<'vestido' | 'pele'>('vestido');
  const decide = i >= AUTONOMIA.aparencia.idade;

  // A mudança: só as marcas (o resto do corpo não se edita aqui).
  const mudanca = useMemo(() => {
    const m: { marcas23?: MarcaNatural[] | null } = {};
    if (!igual(marcas.length ? marcas : undefined, vis.marcas23)) m.marcas23 = marcas.length ? marcas : null;
    return m;
  }, [marcas, vis.marcas23]);
  const mudou = Object.keys(mudanca).length > 0;
  if (i < 3 || faseDeAutonomia(i) === 'familia_decide') return null;

  const previa = { ...vis, marcas23: marcas.length ? marcas : undefined };
  const corpoAgora = corpoDaFigura(vida);
  const corpoPrevia = corpoAgora;
  const soPele = pele === 'pele';
  // "Só a pele": o tronco à mostra como no estúdio (quem não é homem, de top e short — a pele dos braços, da barriga e das pernas à vista).
  const masc = vida.eu.genero === 'masculino';
  const roupaDePele = masc ? [] : [{ itemId: 'top_esportivo', id: 'c23-top' }, { itemId: 'short_jeans', id: 'c23-short' }];
  const pecas = soPele ? roupaDePele : (vida.eu.estilo?.itens ?? []).filter(x => x.usando);
  const tatuagens = tatuagensNaFigura(vida);
  const fig = (visual: typeof vis, corpo: typeof corpoAgora, rotulo: string) => (
    <Figura visual={visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={corpo} pecas={pecas} tatuagens={tatuagens} largura={LARGURA_DE_REFERENCIA} semFundo vista={vista} semCima={soPele && masc} descalco={soPele} rotulo={rotulo} />
  );
  const marcaSel = sel !== null ? marcas[sel] : undefined;
  const mudarMarca = (k: number, p: Partial<MarcaNatural>) => setMarcas(ms => ms.map((m, j) => (j === k ? marcaValida({ ...m, ...p }) ?? m : m)));

  return (
    <section className="c23" aria-labelledby="c23-titulo">
      <h3 id="c23-titulo" className="subtitulo">Pele e marcas</h3>
      <p className="nota">Pintas, sardas, marcas de nascença, cicatrizes, estrias, covinhas — o que faz a pele ser a sua. A prévia muda na hora; nada muda até confirmar.</p>
      <div className="c23__corpo">
        <div className="c23__previa">
          <div className="c23__quadros">
            {mudou && <figure className="c23__fig" data-c23="agora">{fig(vis, corpoAgora, 'Como você está')}<figcaption>Como está</figcaption></figure>}
            <figure className="c23__fig" data-c23="previa">{fig(previa, corpoPrevia, mudou ? 'Como ficaria' : 'Como você está')}<figcaption>{mudou ? 'Como ficaria' : 'Como você está'}</figcaption></figure>
            {marcaSel && !(marcaSel.t === 'covinhas') && (
              <figure className="c23__fig c23__fig--perto" data-c23="perto">
                <Figura visual={previa} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={corpoPrevia} pecas={roupaDePele} semCima={masc} descalco largura={LARGURA_DE_REFERENCIA}
                  vista={REGIOES[marcaSel.r].frente ? 'frente' : 'costas'} foco={focoDaRegiao(vida.eu.genero, corpoPrevia, i, marcaSel.r, marcaSel.l, REGIOES[marcaSel.r].frente ? 'frente' : 'costas', 1.3)} rotulo={`De perto: ${nomeDaRegiao(marcaSel.r)}`} />
                <figcaption>De perto</figcaption>
              </figure>
            )}
          </div>
          <Escolha rotulo="Ângulo do corpo" valor={vista} aoMudar={setVista} opcoes={[{ id: 'frente', rotulo: 'De frente' }, { id: 'costas', rotulo: 'De costas' }]} />
          <Escolha rotulo="Com ou sem roupa" valor={pele} aoMudar={setPele} opcoes={[{ id: 'vestido', rotulo: 'Com a roupa' }, { id: 'pele', rotulo: 'Só a pele' }]} />
        </div>

        <div className="c23__escolhas">
          {!decide && <p className="nota">Com essa idade, quem decide é a família — mexer nisso é a partir dos {AUTONOMIA.aparencia.idade}.</p>}
          {(
            <fieldset className="c23__grupo" disabled={!decide}>
              <legend className="campo__rotulo">Marcas da pele</legend>
              {marcas.length === 0 && <p className="nota">Nenhuma marca. Muita gente é assim — e muita gente tem uma pinta, sardas, uma cicatriz de criança.</p>}
              <ul className="c23__marcas">
                {marcas.map((m, k) => (
                  <li key={k} className={`c23__marca${sel === k ? ' c23__marca--ativa' : ''}`} data-marca={m.t}>
                    <button type="button" className="link" aria-pressed={sel === k} onClick={() => setSel(sel === k ? null : k)}>{descreverMarca(m, nomeDaRegiao)}</button>
                    <button type="button" className="botao botao--discreto" onClick={() => { setMarcas(ms => ms.filter((_, j) => j !== k)); setSel(null); }}>Tirar</button>
                  </li>
                ))}
              </ul>
              {marcas.length < MAXIMO_DE_MARCAS && (
                <label className="campo campo--compacto">
                  <span className="campo__rotulo">Acrescentar</span>
                  <select value="" onChange={ev => { if (!ev.target.value) return; const nova = marcaNova(ev.target.value as TipoDeMarca); setMarcas(ms => [...ms, nova]); setSel(marcas.length); }}>
                    <option value="">Escolha o tipo…</option>
                    {TIPOS_DE_MARCA.map(t => <option key={t} value={t}>{MARCAS23[t].nome}</option>)}
                  </select>
                </label>
              )}
              {marcaSel && sel !== null && <EditorDaMarca m={marcaSel} mudar={p => mudarMarca(sel, p)} trocarTipo={t => setMarcas(ms => ms.map((x, j) => (j === sel ? marcaNova(t, x) : x)))} />}
            </fieldset>
          )}

          {mudou && decide && (
            <div className="grupo-acoes grupo-acoes--linha">
              <BotaoAcao vida={vida} acao={{ tipo: 'corpo23', mudanca }} agir={agir} variante="principal" aoAgir={() => setSel(null)}>Confirmar</BotaoAcao>
              <button type="button" className="botao botao--discreto" onClick={() => { setMarcas(vis.marcas23 ?? []); setSel(null); }}>Deixar como está</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** O editor de uma marca: o tipo, o lugar (por parte do corpo), o lado, a forma, o tamanho, quantas, a intensidade, o ângulo e a posição. */
function EditorDaMarca({ m, mudar, trocarTipo }: { m: MarcaNatural; mudar: (p: Partial<MarcaNatural>) => void; trocarTipo: (t: TipoDeMarca) => void }) {
  const def = MARCAS23[m.t];
  const porGrupo = new Map<string, RegiaoDeTatuagem[]>();
  for (const r of def.regioes) { const g = GRUPO_DA_REGIAO[REGIOES[r].grupo] ?? 'Outros'; porGrupo.set(g, [...(porGrupo.get(g) ?? []), r]); }
  const faixa = (rotulo: string, valor: number, min: number, max: number, step: number, texto: string, aoMudar: (x: number) => void) => (
    <label className="c23__eixo">
      <span className="c23__eixo-nome">{rotulo}</span>
      <input type="range" min={min} max={max} step={step} value={valor} aria-valuetext={texto} onChange={e => aoMudar(Number(e.target.value))} />
      <span className="c23__eixo-valor">{texto}</span>
    </label>
  );
  return (
    <div className="c23__editor" aria-label="A marca escolhida">
      <p className="nota">{def.nota}</p>
      <label className="campo campo--compacto"><span className="campo__rotulo">Tipo</span>
        <select value={m.t} onChange={e => trocarTipo(e.target.value as TipoDeMarca)}>{TIPOS_DE_MARCA.map(t => <option key={t} value={t}>{MARCAS23[t].nome}</option>)}</select></label>
      <label className="campo campo--compacto"><span className="campo__rotulo">Onde</span>
        <select value={m.r} onChange={e => { const r = e.target.value as RegiaoDeTatuagem; mudar({ r, l: regiaoTemLado(r) && m.t !== 'covinhas' ? m.l ?? 'e' : undefined }); }}>
          {[...porGrupo.entries()].map(([g, rs]) => <optgroup key={g} label={g}>{rs.map(r => <option key={r} value={r}>{REGIOES[r].nome}</option>)}</optgroup>)}
        </select></label>
      {(regiaoTemLado(m.r) || m.t === 'covinhas') && m.r !== 'queixo' && (
        <Escolha rotulo="Lado" valor={m.l ?? 'ambos'} aoMudar={l => mudar({ l: l === 'ambos' ? undefined : l as 'e' | 'd' })}
          opcoes={[...(m.t === 'covinhas' ? [{ id: 'ambos', rotulo: 'Os dois' }] : []), { id: 'e', rotulo: 'Esquerdo' }, { id: 'd', rotulo: 'Direito' }]} />
      )}
      {def.formas && <label className="campo campo--compacto"><span className="campo__rotulo">Jeito</span>
        <select value={m.f} onChange={e => mudar({ f: e.target.value })}>{def.formas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>}
      {!['sardas', 'pintas', 'covinhas'].includes(m.t) && faixa('Tamanho', m.s, 1, 3, 1, ['pequena', 'média', 'grande'][m.s - 1], x => mudar({ s: x as 1 | 2 | 3 }))}
      {def.quantidade && faixa('Quantas', m.n ?? def.quantidade[0], def.quantidade[0], def.quantidade[1], 1, String(m.n ?? def.quantidade[0]), x => mudar({ n: x }))}
      {def.intensidade && faixa('Intensidade', m.i ?? 2, 1, 3, 1, ['suave', 'média', 'forte'][(m.i ?? 2) - 1], x => mudar({ i: x as 1 | 2 | 3 }))}
      {def.gira && faixa('Ângulo', m.a ?? 0, 0, 165, 15, `${m.a ?? 0}°`, x => mudar({ a: x }))}
      {m.t !== 'covinhas' && faixa('Posição (lado a lado)', m.x, -1, 1, 0.1, m.x < -0.2 ? 'mais para um lado' : m.x > 0.2 ? 'mais para o outro' : 'no meio', x => mudar({ x }))}
      {m.t !== 'covinhas' && faixa('Posição (altura)', m.y, -1, 1, 0.1, m.y < -0.2 ? 'mais para cima' : m.y > 0.2 ? 'mais para baixo' : 'no meio', x => mudar({ y: x }))}
      {(m.t === 'pintas' || m.t === 'sardas' || m.t === 'marca_nascenca' || m.t === 'mancha' || m.t === 'estrias' || m.f === 'acne' || m.f === 'queimadura') && (
        <button type="button" className="botao botao--discreto" onClick={() => mudar({ k: Math.floor(Math.random() * 99999) })}>Outro desenho</button>
      )}
    </div>
  );
}
