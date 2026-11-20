/**
 * VIDA 24 — Você · Aparência · CORPO e PELOS.
 *
 * CORPO: a figura de hoje e, ao lado, a PROJEÇÃO (como o corpo estaria em cinco anos mantendo a rotina e o plano — é
 * uma conta do motor, não uma mudança); a CONDIÇÃO atual (gordura, músculo, definição, condicionamento, altura) com o
 * que está mudando o corpo e a evolução ano a ano; o OBJETIVO e a ALIMENTAÇÃO (o que se escolhe — confirmar não muda o
 * corpo: direciona os próximos anos); e a constituição DE NASCENÇA (só consulta: não se edita depois de nascer).
 *
 * PELOS: o nível natural (de nascença; aparece na puberdade) e os cuidados — aparar, raspar, cera, laser — por região.
 */
import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { AUTONOMIA } from '../../motor/sistemas/autonomia';
import { composicaoDe, corpoDaFigura, entrada24, NOME_DO_CORPO, precoDoCuidado24, tipoDeCorpo } from '../../motor/sistemas/silhueta';
import { estaturaAdulta, estaturaEmPalavras } from '../../motor/sistemas/modalidades';
import { EIXOS_DO_CORPO, lerCorpo23, PELOS23 } from '../../motor/v23/corpo/corpo23';
import {
  ALIMENTACOES24, definicao24, fatores24, fatorDosPelos24, GRUPOS24, leituraDaDefinicao, leituraDaGordura, leituraDoMusculo, METODOS24, OBJETIVOS24, OBJETIVOS_LISTA,
  PAPEL24, pelosDaIdade24, PREDISPOSICOES24, projetar24, REGIOES24, REGIOES_DE_PELO24, tipoDaComposicao,
  type Alimentacao24, type MetodoDePelo24, type Objetivo24, type Plano24, type Regiao24, type RegiaoDePelo24
} from '../../motor/v24/corpo/corpo24';
import { dinheiro } from '../../motor/texto';
import { Figura } from '../avatar/Figura';
import { LARGURA_DE_REFERENCIA } from '../avatar/referencia';
import { BotaoAcao, Escolha } from '../comum';
import { tatuagensNaFigura } from '../../motor/sistemas/tatuagens';
import { predisposicaoEmPalavras } from '../jogo/FichaDeAtributos';
import { capacidadesDe } from '../../motor/sistemas/capacidadesFisicas';
import { leituraCapacidade26, NOME_CAPACIDADE26, RELACOES26, type Capacidade26 } from '../../motor/v26/corpo/capacidades26';
import './corpo24.css';

const ANOS_DE_PROJECAO = 5;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function useRoupa(vida: Vida, pele: 'vestido' | 'pele') {
  const masc = vida.eu.genero === 'masculino';
  const roupaDePele = masc ? [] : [{ itemId: 'top_esportivo', id: 'c24-top' }, { itemId: 'short_jeans', id: 'c24-short' }];
  return { masc, pecas: pele === 'pele' ? roupaDePele : (vida.eu.estilo?.itens ?? []).filter(x => x.usando) };
}

/* ------------------------------------------------------------------ CORPO */

export function CorpoPainel({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: 'semana') => void }) {
  const i = idade(vida);
  const plano = vida.corpo.plano24 ?? {};
  const [parte, setParte] = useState<'agora' | 'evolucao' | 'objetivo' | 'nascenca'>('agora');
  const [obj, setObj] = useState<Objetivo24 | ''>(plano.objetivo ?? '');
  const [reg, setReg] = useState<Regiao24>(plano.regiao ?? 'bracos');
  const [ali, setAli] = useState<Alimentacao24>(plano.alimentacao ?? 'habitual');
  const [vista, setVista] = useState<'frente' | 'costas'>('frente');
  const [pele, setPele] = useState<'vestido' | 'pele'>('vestido');
  const { masc, pecas } = useRoupa(vida, pele);
  const decide = i >= AUTONOMIA.aparencia.idade;

  const comp = composicaoDe(vida);
  const rascunho: Plano24 = { ...(obj ? { objetivo: obj } : {}), ...(obj === 'regiao' ? { regiao: reg } : {}), ...(ali !== 'habitual' ? { alimentacao: ali } : {}) };
  const mudou = (plano.objetivo ?? '') !== obj || (obj === 'regiao' && plano.regiao !== reg) || (plano.alimentacao ?? 'habitual') !== ali;
  const ent = { ...entrada24(vida), plano: rascunho };
  const futuro = projetar24(comp, ent, ANOS_DE_PROJECAO);
  const fatores = fatores24(ent);
  const fig = corpoDaFigura(vida);
  const figFuturo = { ...fig, tipo: tipoDaComposicao(futuro), comp: { g: futuro.g, m: futuro.m, ...(futuro.r ? { r: futuro.r } : {}) } };
  const tatuagens = tatuagensNaFigura(vida);
  const desenho = (corpo: typeof fig, idadeFig: number, rotulo: string) => (
    <Figura visual={vida.eu.visual} genero={vida.eu.genero} idade={idadeFig} semente={vida.eu.semente ?? 'eu'} corpo={corpo} pecas={pecas} tatuagens={tatuagens}
      largura={LARGURA_DE_REFERENCIA} semFundo vista={vista} semCima={pele === 'pele' && masc} descalco={pele === 'pele'} rotulo={rotulo} />
  );
  const temForca = ent.forca >= 0.3, temCardio = ent.cardio >= 0.3, treina = ent.forca + ent.cardio >= 0.3;
  const atende = (o: Objetivo24 | ''): boolean | undefined => {
    if (!o) return undefined;
    if (o === 'massa' || o === 'forca' || o === 'regiao') return temForca;
    if (o === 'condicionamento' || o === 'resistencia') return temCardio;
    if (o === 'definicao') return treina;
    if (o === 'perder_gordura') return treina || ali === 'deficit';
    return ali === 'superavit';
  };
  const ok = atende(obj);
  const cm = estaturaAdulta(vida);
  const c = lerCorpo23(vida.eu.visual.corpo23);
  const modo = vida.corpo.nasc24;

  return (
    <section className="c24" aria-labelledby="c24-titulo" data-c24="corpo">
      <h3 id="c24-titulo" className="subtitulo">Corpo</h3>
      {/* VIDA 25: três camadas, sem misturar — a CONDIÇÃO de agora (o que muda com a vida), a EVOLUÇÃO (como mudou e por
          quê) e a CONSTITUIÇÃO (o que veio de nascença: tendências, não destino). O objetivo é a escolha que direciona. */}
      <p className="nota">Três coisas diferentes: a <b>condição atual</b> (gordura, músculo, condicionamento — muda com treino, comida, sono e idade, um pouco por ano), a <b>evolução</b> (como o corpo mudou e o que o está mudando) e a <b>constituição</b> (o que veio de nascença: tendências que a vida puxa para um lado ou outro, sem apagar).</p>
      <div className="c24__corpo">
        <div className="c24__previa">
          <div className="c24__quadros">
            <figure className="c24__fig" data-c24-fig="hoje">{desenho(fig, i, 'Como você está')}<figcaption>Hoje · {NOME_DO_CORPO[tipoDeCorpo(vida)]}</figcaption></figure>
            <figure className="c24__fig c24__fig--projecao" data-c24-fig="projecao">{desenho(figFuturo, i + ANOS_DE_PROJECAO, `Projeção em ${ANOS_DE_PROJECAO} anos`)}
              <figcaption>{mudou ? 'Com o objetivo' : 'Mantendo a rotina'} · em {ANOS_DE_PROJECAO} anos <span className="c24__selo">projeção</span></figcaption></figure>
          </div>
          <Escolha rotulo="Ângulo do corpo" valor={vista} aoMudar={setVista} opcoes={[{ id: 'frente', rotulo: 'De frente' }, { id: 'costas', rotulo: 'De costas' }]} />
          <Escolha rotulo="Com ou sem roupa" valor={pele} aoMudar={setPele} opcoes={[{ id: 'vestido', rotulo: 'Com a roupa' }, { id: 'pele', rotulo: 'Só a pele' }]} />
          <span className="nota">A projeção é uma conta, não uma mudança: o corpo só muda com os anos — e só se a rotina continuar.</span>
        </div>

        <div className="c24__escolhas">
          <Escolha rotulo="Parte do corpo" valor={parte} aoMudar={setParte} opcoes={[{ id: 'agora', rotulo: 'Condição atual' }, { id: 'evolucao', rotulo: 'Evolução' }, { id: 'objetivo', rotulo: `Objetivo${plano.objetivo ? ' ✓' : ''}` }, { id: 'nascenca', rotulo: 'Constituição' }]} />

          {parte === 'agora' && (
            <div className="c24__bloco" data-c24-parte="agora">
              <dl className="c24__medidas">
                <div><dt>Gordura</dt><dd>{cap(leituraDaGordura(comp.g))}</dd><Barra x={comp.g} min={-1.8} max={3} /><small className="c24__explica">A reserva de energia do corpo. Sobe com comida a mais e pouco movimento; desce com déficit e treino.</small></div>
                <div><dt>Músculo</dt><dd>{cap(leituraDoMusculo(comp.m))}</dd><Barra x={comp.m} min={-0.8} max={2.6} /><small className="c24__explica">Cresce com treino de força e proteína; sem estímulo, e com a idade, vai embora devagar.</small></div>
                <div><dt>Definição</dt><dd>{cap(leituraDaDefinicao(definicao24(comp)))}</dd><Barra x={definicao24(comp)} min={0} max={2} /><small className="c24__explica">O quanto o músculo aparece: não é uma medida à parte, sai da gordura e do músculo juntos.</small></div>
                <div><dt>Condicionamento</dt><dd>{vida.corpo.forma} de 100</dd><Barra x={vida.corpo.forma} min={0} max={100} /><small className="c24__explica">O fôlego e o preparo — é o mesmo número do atributo Físico, em Eu. Responde rápido ao treino e cai rápido sem ele.</small></div>
                {i < 17 && <div><dt>Altura</dt><dd>{estaturaEmPalavras(Math.round(cm * (i >= 17 ? 1 : 0.68 + Math.max(0, i - 6) / 11 * 0.32)))} hoje</dd><small className="c24__explica">Ainda crescendo; a altura adulta é da constituição (deve chegar a {estaturaEmPalavras(cm)}).</small></div>}
                {comp.r && Object.keys(comp.r).length > 0 && <div><dt>Regiões treinadas</dt><dd>{Object.entries(comp.r).map(([k, x]) => `${REGIOES24[k as Regiao24]} (${x! >= 0.8 ? 'bem' : 'um pouco'} mais)`).join(', ')}</dd></div>}
              </dl>
              <p className="nota">Tudo nesta parte pode mudar. O que está puxando agora, e como o corpo vem mudando, está em Evolução.</p>
              {/* VIDA 26: as capacidades físicas de hoje — a constituição herdada + esta condição + a idade (a conta que o esporte lê). */}
              <div className="c26cap" aria-label="Capacidades físicas">
                <p className="c26cap__titulo">Capacidades físicas <small>o corpo herdado + o que a vida fez dele, nesta idade</small></p>
                <ul>{(Object.entries(capacidadesDe(vida)) as [Capacidade26, number][]).map(([k, x]) => (
                  <li key={k} data-capacidade={k}><details><summary><span>{NOME_CAPACIDADE26[k]}</span><Barra x={x} min={0} max={100} /><b>{leituraCapacidade26(x)}</b></summary><small className="c24__explica">{RELACOES26[k]}</small></details></li>
                ))}</ul>
                <p className="nota">É o que os atributos físicos do esporte leem. {i < 18 ? 'Ainda crescendo: força e fôlego de adulto chegam com a idade, por mais que se treine.' : ''}</p>
              </div>
            </div>
          )}

          {parte === 'evolucao' && (
            <div className="c24__bloco" data-c24-parte="evolucao">
              <Comparacao vida={vida} />
              <h4 className="c24__titulo">O que está mudando o seu corpo</h4>
              {fatores.length ? (
                <ul className="c24__fatores">
                  {fatores.map(f => <li key={f.texto} data-gordura={Math.sign(Math.round(f.g * 10))} data-musculo={Math.sign(Math.round(f.m * 10))}>
                    <span>{cap(f.texto)}</span>
                    <span className="c24__efeitos">{Math.abs(f.g) >= 0.04 && <span className={f.g > 0 ? 'c24__sobe' : 'c24__desce'}>gordura {f.g > 0 ? '↑' : '↓'}</span>}{Math.abs(f.m) >= 0.04 && <span className={f.m > 0 ? 'c24__sobe' : 'c24__desce'}>músculo {f.m > 0 ? '↑' : '↓'}</span>}</span>
                  </li>)}
                </ul>
              ) : <p className="nota">Nada puxando para lado nenhum: o corpo fica como está.</p>}
              <Evolucao vida={vida} />
              {irPara && <button type="button" className="link" onClick={() => irPara('semana')}>A rotina da semana (academia, esporte, corrida) →</button>}
            </div>
          )}

          {parte === 'objetivo' && (
            <fieldset className="c24__bloco" disabled={!decide} data-c24-parte="objetivo">
              <legend className="campo__rotulo">Objetivo físico</legend>
              {!decide && <p className="nota">Com essa idade, quem decide a comida e os cuidados é a família — o objetivo é a partir dos {AUTONOMIA.aparencia.idade}.</p>}
              <div className="c24__chips" role="radiogroup" aria-label="Objetivo físico">
                {[['', 'Nenhum'] as const, ...OBJETIVOS_LISTA.map(o => [o, OBJETIVOS24[o].nome] as const)].map(([id, nome]) => (
                  <button key={id || 'nenhum'} type="button" role="radio" aria-checked={obj === id} className={`filtro${obj === id ? ' filtro--ativo' : ''}`} onClick={() => setObj(id)}>{nome}</button>
                ))}
              </div>
              {obj === 'regiao' && (
                <label className="campo campo--compacto"><span className="campo__rotulo">Região</span>
                  <select value={reg} onChange={e => setReg(e.target.value as Regiao24)}>{(Object.keys(REGIOES24) as Regiao24[]).map(r => <option key={r} value={r}>{cap(REGIOES24[r])}</option>)}</select></label>
              )}
              {obj && <p className="nota" data-c24-atende={ok ? 'sim' : 'nao'}>{OBJETIVOS24[obj].nota} <strong>{ok ? 'A sua rotina já tem o que ele pede.' : `Pede ${OBJETIVOS24[obj].pede} — sem isso, o objetivo não sai do papel.`}</strong></p>}
              <span className="campo__rotulo">Alimentação</span>
              <div className="c24__chips" role="radiogroup" aria-label="Alimentação">
                {(Object.keys(ALIMENTACOES24) as Alimentacao24[]).map(a => (
                  <button key={a} type="button" role="radio" aria-checked={ali === a} className={`filtro${ali === a ? ' filtro--ativo' : ''}`} onClick={() => setAli(a)}>{ALIMENTACOES24[a].nome}</button>
                ))}
              </div>
              <span className="campo__nota">{ALIMENTACOES24[ali].nota}</span>
              <p className="nota">Em {ANOS_DE_PROJECAO} anos, assim: gordura {leituraDaGordura(futuro.g)}, músculo {leituraDoMusculo(futuro.m)} ({NOME_DO_CORPO[tipoDaComposicao(futuro)]}). Confirmar não muda o corpo agora.</p>
              {mudou && decide && (
                <div className="grupo-acoes grupo-acoes--linha">
                  <BotaoAcao vida={vida} acao={{ tipo: 'corpo24', op: { o: 'plano', objetivo: obj || null, ...(obj === 'regiao' ? { regiao: reg } : {}), alimentacao: ali } }} agir={agir} variante="principal">Seguir esse plano</BotaoAcao>
                  <button type="button" className="botao botao--discreto" onClick={() => { setObj(plano.objetivo ?? ''); setReg(plano.regiao ?? 'bracos'); setAli(plano.alimentacao ?? 'habitual'); }}>Deixar como está</button>
                </div>
              )}
            </fieldset>
          )}

          {parte === 'nascenca' && (
            <div className="c24__bloco" data-c24-parte="nascenca">
              <p className="nota">{modo === 'escolher' ? 'Escolhidas antes de nascer.' : modo === 'acaso' ? 'Sorteadas ao nascer.' : modo === 'heranca' ? 'Herdadas dos pais, com variação.' : 'As proporções de nascença.'} São tendências: a estrutura aparece com o crescimento e não muda depois de adulto; o resto é a vida que decide.</p>
              <dl className="c24__medidas">
                <div><dt>Altura adulta</dt><dd>{estaturaEmPalavras(cm)}{i < 17 ? ' (prevista)' : ''}</dd><small className="c24__explica">Da herança e da tendência de nascença; não muda depois do crescimento.</small></div>
                <div><dt>Resposta ao treino</dt><dd>{cap(predisposicaoEmPalavras(vida, 'fisico'))}</dd><small className="c24__explica">A predisposição física: quanto o condicionamento sobe com o mesmo treino. Não é o condicionamento de hoje.</small></div>
              </dl>
              {GRUPOS24.map(gr => (
                <div key={gr.id} className="c24__grupo" role="group" aria-label={gr.nome}>
                  <span className="c24__grupo-nome">{gr.nome}</span>
                  <span className="campo__nota">{gr.nota}</span>
                  <ul className="c24__nascenca">
                    {EIXOS_DO_CORPO.filter(e => PAPEL24[e] === gr.id).map(e => <li key={e} data-eixo={e}><span>{PREDISPOSICOES24[e].nome}</span><strong>{PREDISPOSICOES24[e].niveis[c[e] + 2]}</strong></li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Barra({ x, min, max }: { x: number; min: number; max: number }) {
  const p = Math.max(0, Math.min(100, ((x - min) / (max - min)) * 100));
  return <span className="c24__barra" aria-hidden><span style={{ width: `${p.toFixed(0)}%` }} /></span>;
}

/** VIDA 25: como o corpo mudou — o primeiro registro guardado contra hoje, em palavras (do histórico do motor). */
function Comparacao({ vida }: { vida: Vida }) {
  const h = vida.corpo.composicao24?.h ?? [];
  if (h.length < 2) return <p className="nota">O corpo ainda não tem anos registrados para comparar: a evolução aparece aqui a cada aniversário.</p>;
  const [t0, g0, m0] = h[0];
  const [, g1, m1] = h[h.length - 1];
  const anos = Math.max(1, Math.round((vida.t - t0) / 12));
  const dg = g1 - g0, dm = m1 - m0;
  const frase = (d: number, sobe: string, desce: string) => (Math.abs(d) < 0.15 ? 'ficou parecida' : d > 0 ? sobe : desce);
  return <p className="c24__comparacao">Em {anos} {anos === 1 ? 'ano' : 'anos'}: a gordura {frase(dg, 'aumentou', 'diminuiu')} ({leituraDaGordura(g0)} → {leituraDaGordura(g1)}); o músculo {frase(dm, 'aumentou', 'diminuiu').replace('parecida', 'parecido')} ({leituraDoMusculo(m0)} → {leituraDoMusculo(m1)}).</p>;
}

/** A evolução: gordura e músculo por idade, os últimos anos (do histórico que o motor guarda). */
function Evolucao({ vida }: { vida: Vida }) {
  const h = vida.corpo.composicao24?.h ?? [];
  if (h.length < 2) return <p className="nota">A evolução aparece aqui ano a ano.</p>;
  const i = idade(vida);
  const W = 240, H = 70, x = (k: number) => 8 + (k / (h.length - 1)) * (W - 16);
  const yg = (g: number) => H - 8 - ((g + 1.8) / 4.8) * (H - 16), ym = (m: number) => H - 8 - ((m + 0.8) / 3.4) * (H - 16);
  const linha = (f: (p: [number, number, number]) => number) => h.map((p, k) => `${k ? 'L' : 'M'} ${x(k).toFixed(1)} ${f(p).toFixed(1)}`).join(' ');
  return (
    <figure className="c24__evolucao">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolução da gordura e do músculo nos últimos anos">
        <path d={linha(p => yg(p[1]))} className="c24__linha-g" fill="none" />
        <path d={linha(p => ym(p[2]))} className="c24__linha-m" fill="none" />
      </svg>
      <figcaption><span className="c24__leg-g">gordura</span> · <span className="c24__leg-m">músculo</span> · dos {Math.max(0, i - Math.round((vida.t - h[0][0]) / 12))} aos {i} anos</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ PELOS */

export function PelosPainel({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const vis = vida.eu.visual;
  const atual = vis.pelos24;
  const [metodo, setMetodo] = useState<MetodoDePelo24 | 'natural'>(atual?.metodo ?? 'natural');
  const [regs, setRegs] = useState<RegiaoDePelo24[]>(atual?.regioes ?? ['pernas']);
  const { masc, pecas } = useRoupa(vida, 'pele');
  const nivel = vis.pelos23 ?? 0;
  const k = pelosDaIdade24(i);
  const decide = i >= AUTONOMIA.aparencia.idade;
  const previa = metodo === 'natural' ? { ...vis, pelos24: undefined } : { ...vis, pelos24: { metodo, regioes: regs, desde: vida.t } };
  const mudou = metodo === 'natural' ? !!atual : !atual || atual.metodo !== metodo || [...atual.regioes].sort().join() !== [...regs].sort().join();
  const corpo = corpoDaFigura(vida);
  const fig = (v: typeof vis, rotulo: string) => <Figura visual={v} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} corpo={corpo} pecas={pecas} largura={LARGURA_DE_REFERENCIA} semFundo semCima={masc} descalco rotulo={rotulo} />;
  const preco = metodo !== 'natural' && METODOS24[metodo].custo ? precoDoCuidado24(vida, metodo, regs.length) : 0;
  return (
    <section className="c24" aria-labelledby="c24-pelos-titulo" data-c24="pelos">
      <h3 id="c24-pelos-titulo" className="subtitulo">Pelos</h3>
      <div className="c24__corpo">
        <div className="c24__previa">
          <div className="c24__quadros">
            {mudou && <figure className="c24__fig">{fig(vis, 'Como está')}<figcaption>Como está</figcaption></figure>}
            <figure className="c24__fig" data-c24-fig="pelos">{fig(previa, mudou ? 'Como ficaria' : 'Como você está')}<figcaption>{mudou ? 'Como ficaria' : 'Como está'}</figcaption></figure>
          </div>
        </div>
        <div className="c24__escolhas">
          <dl className="c24__medidas">
            <div><dt>Pelos naturais</dt><dd>{cap(PELOS23[nivel])} <span className="nota">(de nascença)</span></dd></div>
            <div><dt>Nesta idade</dt><dd>{k <= 0 ? 'ainda não apareceram (aparecem na puberdade)' : k < 1 ? 'aparecendo — ficam completos por volta dos 19' : 'completos'}</dd></div>
            {vis.laser24?.length ? <div><dt>Laser feito</dt><dd>{vis.laser24.map(r => REGIOES_DE_PELO24[r].toLowerCase()).join(', ')}</dd></div> : null}
          </dl>
          <fieldset className="c24__bloco" disabled={!decide}>
            <legend className="campo__rotulo">Cuidados</legend>
            {!decide && <p className="nota">A partir dos {AUTONOMIA.aparencia.idade}.</p>}
            <div className="c24__chips" role="radiogroup" aria-label="Cuidado com os pelos">
              {(['natural', ...Object.keys(METODOS24)] as (MetodoDePelo24 | 'natural')[]).map(m => (
                <button key={m} type="button" role="radio" aria-checked={metodo === m} className={`filtro${metodo === m ? ' filtro--ativo' : ''}`} onClick={() => setMetodo(m)} disabled={m !== 'natural' && i < METODOS24[m].idade}>{m === 'natural' ? 'Natural' : METODOS24[m].nome}</button>
              ))}
            </div>
            <span className="campo__nota">{metodo === 'natural' ? 'Os pelos como nascem.' : METODOS24[metodo].nota}{preco ? ` ${metodo === 'laser' ? 'As sessões' : 'Por ano'}: ${dinheiro(preco)}.` : ''}</span>
            {metodo !== 'natural' && (
              <div className="c24__chips" role="group" aria-label="Onde">
                {(Object.keys(REGIOES_DE_PELO24) as RegiaoDePelo24[]).map(r => (
                  <label key={r} className="marcar"><input type="checkbox" checked={regs.includes(r)} onChange={e => setRegs(x => (e.target.checked ? [...x, r] : x.filter(y => y !== r)))} /> {REGIOES_DE_PELO24[r]}{fatorDosPelos24(undefined, vis.laser24, r, vida.t) < 1 ? ' (laser feito)' : ''}</label>
                ))}
              </div>
            )}
            {mudou && decide && (
              <div className="grupo-acoes grupo-acoes--linha">
                <BotaoAcao vida={vida} acao={{ tipo: 'corpo24', op: metodo === 'natural' ? { o: 'pelos', metodo: null } : { o: 'pelos', metodo, regioes: regs } }} agir={agir} variante="principal">{metodo === 'natural' ? 'Deixar crescer' : 'Fazer assim'}</BotaoAcao>
                <button type="button" className="botao botao--discreto" onClick={() => { setMetodo(atual?.metodo ?? 'natural'); setRegs(atual?.regioes ?? ['pernas']); }}>Deixar como está</button>
              </div>
            )}
          </fieldset>
        </div>
      </div>
    </section>
  );
}
