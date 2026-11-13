/**
 * VIDA 18 · Vida · Campo — as propriedades rurais por dentro: a terra (área útil, reserva legal, solo, água), a lavoura
 * em talhões com o calendário, o rebanho com o manejo, as estruturas e as máquinas, o uso e a gestão, o ano que passou
 * (receita e custo, linha a linha) e a previsão de um ano normal. Também as ofertas da região (comprar, financiar,
 * arrendar), a terra da família e as festas do campo. Carregada sob demanda (pacote próprio).
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao, Secao, Subnav } from '../../comum';
import { idade } from '../../../motor/nucleo';
import { anoDe } from '../../../motor/tempo';
import { dinheiroCurto } from '../../leituraMaterial';
import { CULTURAS18, ESTRUTURAS18, MAQUINAS18, REBANHOS18, TIPOS18, type CulturaId, type EspecieRural } from '../../../motor/dados18/rural/catalogo18';
import {
  areaLivre, custoLocal, fmtHa, haIrrigaveis, qtdEstrutura, resumoDaPropriedade, tetoDaEstrutura, todasAsPropriedades, climaDoAno, type PropriedadeRural18
} from '../../../motor/v18/rural/fazenda18';
import {
  condicaoDeCredito, culturasPossiveis, custoDaImplantacao, custoDoSolo, especiesPossiveis, estruturasPossiveis, festasDoAno, maquinasPossiveis, mesNome,
  ofertasRurais, precoDaEstrutura, precoDaMaquina, precoDoLote, custoDaGenetica, custoDaTemporada, type OfertaRural18
} from '../../../motor/v18/rural/acoes18';
import { Paisagem18 } from './Paisagem18';
import './campo18.css';

type Agir = (a: Acao) => boolean;
const r18 = (oque: Extract<Acao, { tipo: 'rural18' }>['oque']): Acao => ({ tipo: 'rural18', oque });
const pct = (x: number) => `${Math.round(x * 100)}%`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Campo18({ vida, agir }: { vida: Vida; agir: Agir }) {
  const i = idade(vida);
  const lista = todasAsPropriedades(vida);
  const [sel, setSel] = useState<string | undefined>(lista[0]?.p.id);
  const atual = lista.find(x => x.p.id === sel) ?? lista[0];
  const familia = useMemo(() => Object.values(vida.pessoas).filter(p => p.vivo && p.posses?.bens.some(b => b.tipo === 'imovel' && b.rural)), [vida]);
  const totalHa = lista.reduce((s, x) => s + x.p.ha, 0);
  const ultimo = lista.reduce((s, x) => s + (x.p.historico[x.p.historico.length - 1]?.resultado ?? 0), 0);
  return (
    <div className="campo18">
      <header className="campo18__cabeca">
        <div>
          <p className="campo18__kicker">O campo</p>
          <h2 className="campo18__titulo">{lista.length ? `${lista.length} ${lista.length === 1 ? 'propriedade' : 'propriedades'} · ${fmtHa(totalHa)}` : 'Nenhuma terra sua, por enquanto'}</h2>
        </div>
        {lista.length > 0 && <dl className="campo18__numeros">
          <div><dt>O último ano</dt><dd className={ultimo < 0 ? 'campo18__ruim' : 'campo18__bom'}>{ultimo === 0 ? '—' : `${ultimo > 0 ? '+' : '−'}${dinheiroCurto(Math.abs(ultimo))}`}</dd></div>
          <div><dt>O clima da região</dt><dd>{cap(climaDoAno(vida, lista[0].p.municipioId, anoDe(vida.t) - 1).tipo === 'bom' ? 'ano bom' : climaDoAno(vida, lista[0].p.municipioId, anoDe(vida.t) - 1).tipo)}</dd></div>
        </dl>}
      </header>

      {lista.length > 1 && (
        <ul className="campo18__lista" aria-label="Suas propriedades">
          {lista.map(x => (
            <li key={x.p.id}>
              <button type="button" className={`campo18__ficha${x.p.id === atual?.p.id ? ' campo18__ficha--ativa' : ''}`} aria-pressed={x.p.id === atual?.p.id} onClick={() => setSel(x.p.id)}>
                <Paisagem18 p={x.p} pequena />
                <span className="campo18__ficha-nome">{x.p.nome}</span>
                <span className="campo18__ficha-sub">{TIPOS18[x.p.tipo].nome} · {fmtHa(x.p.ha)}{x.imovel ? '' : ' · arrendada'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {atual ? <Propriedade vida={vida} agir={agir} p={atual.p} propria={!!atual.imovel} />
        : (
          <div className="campo18__vazio">
            <Paisagem18 vazia />
            <p>{i < 18 ? 'Terra se compra e se arrenda depois dos 18. Até lá, o campo é o da família e o das festas.' : 'Um sítio para morar e plantar, uma fazenda de gado ou de café, um haras, uma floresta plantada, tanques de peixe — as ofertas da região estão logo abaixo. Dá também para arrendar a terra de alguém e produzir nela.'}</p>
          </div>
        )}

      {familia.length > 0 && (
        <Secao titulo="A terra da família">
          <ul className="campo18__familia">
            {familia.flatMap(p => p.posses!.bens.filter(b => b.tipo === 'imovel' && b.rural).map(b => (
              <li key={b.id}><Paisagem18 p={(b as { rural: PropriedadeRural18 }).rural} pequena /><div><strong>{b.nome}</strong><span>{TIPOS18[(b as { rural: PropriedadeRural18 }).rural.tipo].nome} · {fmtHa((b as { rural: PropriedadeRural18 }).rural.ha)} · de {p.nome}</span><span className="nota">Passa adiante na herança, como os outros bens da família.</span></div></li>
            )))}
          </ul>
        </Secao>
      )}

      {i >= 18 && <Ofertas vida={vida} agir={agir} />}
      <Festas vida={vida} agir={agir} />
    </div>
  );
}

/* ================================================================== Uma propriedade */

type Parte = 'terra' | 'lavoura' | 'rebanho' | 'estrutura' | 'gestao' | 'contas';
const PARTES: { id: Parte; rotulo: string; oque: string }[] = [
  { id: 'terra', rotulo: 'A terra', oque: 'Área, uso, solo, água, valor' },
  { id: 'lavoura', rotulo: 'Lavoura', oque: 'Talhões, calendário, plantar' },
  { id: 'rebanho', rotulo: 'Rebanho', oque: 'Animais, manejo, comprar e vender' },
  { id: 'estrutura', rotulo: 'Estrutura', oque: 'Obras e máquinas' },
  { id: 'gestao', rotulo: 'Gestão', oque: 'Uso, manejo, cooperativa, arrendar, expandir' },
  { id: 'contas', rotulo: 'Contas', oque: 'O ano que passou e a previsão' }
];

function Propriedade({ vida, agir, p, propria }: { vida: Vida; agir: Agir; p: PropriedadeRural18; propria: boolean }) {
  const [parte, setParte] = useState<Parte>('terra');
  const r = resumoDaPropriedade(vida, p);
  return (
    <article className="campo18__prop" aria-label={p.nome}>
      <div className="campo18__palco">
        <Paisagem18 p={p} />
        <div className="campo18__placa">
          <p className="campo18__placa-tipo">{TIPOS18[p.tipo].nome}{propria ? '' : ' · arrendada'}</p>
          <h3>{p.nome}</h3>
          <p>{fmtHa(p.ha)} · {r.regiao === 'outro' ? 'zona rural' : `${r.regiao}`} · {p.uso === 'producao' ? (r.tocadaPorVoce ? 'você toca' : p.ha < 40 ? 'com caseiro' : 'com gerente') : p.uso === 'residencia' ? 'casa e lazer' : p.uso === 'investimento' ? 'parada (investimento)' : 'arrendada a terceiros'}</p>
          <p className="campo18__placa-valor">{propria ? <>Vale <strong>{dinheiroCurto(r.valor)}</strong></> : <>Arrendamento: <strong>{dinheiroCurto(p.arrendamento?.valorAno ?? 0)}</strong>/ano até {p.arrendamento?.ate}</>}</p>
        </div>
      </div>
      <Subnav rotulo="Partes da propriedade" prefixo="campo18" itens={PARTES} atual={parte} aoMudar={setParte} classe="subnav--campo18" />
      <div role="tabpanel" id="campo18-painel" aria-labelledby={`campo18-aba-${parte}`} className="campo18__painel">
        {parte === 'terra' && <Terra p={p} r={r} propria={propria} />}
        {parte === 'lavoura' && <Lavoura vida={vida} agir={agir} p={p} />}
        {parte === 'rebanho' && <Rebanho vida={vida} agir={agir} p={p} />}
        {parte === 'estrutura' && <Estrutura vida={vida} agir={agir} p={p} />}
        {parte === 'gestao' && <Gestao vida={vida} agir={agir} p={p} propria={propria} />}
        {parte === 'contas' && <Contas p={p} r={r} />}
      </div>
    </article>
  );
}

type Resumo = ReturnType<typeof resumoDaPropriedade>;

function Medidor({ rotulo, valor, dica }: { rotulo: string; valor: number; dica: string }) {
  return (
    <div className="campo18__medidor">
      <span className="campo18__medidor-rotulo">{rotulo}</span>
      <span className="campo18__medidor-barra" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(valor)} aria-label={rotulo}><span style={{ width: `${Math.max(3, Math.min(100, valor))}%` }} /></span>
      <span className="campo18__medidor-dica">{dica}</span>
    </div>
  );
}

function Terra({ p, r, propria }: { p: PropriedadeRural18; r: Resumo; propria: boolean }) {
  const total = p.ha;
  const partes = [
    { k: 'lavoura', rotulo: 'Lavoura', ha: r.plantada },
    { k: 'pasto', rotulo: 'Pasto e área livre', ha: r.pasto },
    { k: 'agua', rotulo: 'Tanques', ha: qtdEstrutura(p, 'tanques') },
    { k: 'reserva', rotulo: 'Reserva legal e beira de rio', ha: Math.max(0, total - r.util) }
  ].filter(x => x.ha > 0.05);
  return (
    <div className="campo18__terra">
      <div className="campo18__mapa" role="img" aria-label={`Uso da terra: ${partes.map(x => `${x.rotulo} ${fmtHa(x.ha)}`).join(', ')}`}>
        {partes.map(x => <span key={x.k} className={`campo18__faixa campo18__faixa--${x.k}`} style={{ flexGrow: x.ha }} title={`${x.rotulo}: ${fmtHa(x.ha)}`} />)}
      </div>
      <ul className="campo18__legenda">
        {partes.map(x => <li key={x.k}><span className={`campo18__cor campo18__faixa--${x.k}`} />{x.rotulo}: <strong>{fmtHa(x.ha)}</strong></li>)}
      </ul>
      <p className="nota">A reserva legal ({pct(r.reserva)} da área aqui, pelo Código Florestal) não se planta nem vira pasto.</p>
      <div className="campo18__medidores">
        <Medidor rotulo="Solo" valor={p.solo} dica={p.solo >= 70 ? 'fértil' : p.solo >= 50 ? 'médio' : 'cansado — pede correção'} />
        <Medidor rotulo="Água" valor={p.agua} dica={p.agua >= 65 ? 'farta' : p.agua >= 40 ? 'regular' : 'escassa'} />
        <Medidor rotulo="Tecnologia" valor={r.tecnologia / 3 * 100} dica={`${r.tecnologia.toLocaleString('pt-BR')} de 3`} />
      </div>
      <dl className="campo18__dados">
        <div><dt>Relevo</dt><dd>{p.relevo}</dd></div>
        <div><dt>Pasto comporta</dt><dd>{r.capacidadeUA} UA ({r.ua} ocupadas)</dd></div>
        <div><dt>Irrigação dá conta de</dt><dd>{fmtHa(r.irrigaveis)}</dd></div>
        {propria && <div><dt>Terra nua</dt><dd>{dinheiroCurto(r.terra)} ({dinheiroCurto(p.valorHa)}/ha)</dd></div>}
        {propria && <div><dt>Estruturas e máquinas</dt><dd>{dinheiroCurto(r.estruturas + r.maquinas)}</dd></div>}
        {r.rebanho > 0 && <div><dt>Rebanho</dt><dd>{dinheiroCurto(r.rebanho)}</dd></div>}
        <div><dt>Manejo</dt><dd>{p.manejo === 'organico' ? `orgânico${p.transicao !== undefined ? ` (transição desde ${p.transicao})` : ''}` : 'convencional'}</dd></div>
        <div><dt>Foco</dt><dd>{p.foco === 'volume' ? 'volume' : p.foco === 'qualidade' ? 'qualidade' : 'equilíbrio'}</dd></div>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ Lavoura */

function Calendario({ c }: { c: CulturaId }) {
  const k = CULTURAS18[c];
  const dentro = (m: number, [a, b]: [number, number]) => (a <= b ? m >= a && m <= b : m >= a || m <= b);
  return (
    <span className="campo18__cal" role="img" aria-label={`Plantio de ${mesNome(k.plantio[0])} a ${mesNome(k.plantio[1])}; colheita de ${mesNome(k.colheita[0])} a ${mesNome(k.colheita[1])}`}>
      {Array.from({ length: 12 }, (_, m) => <span key={m} className={`campo18__mes${dentro(m + 1, k.plantio) ? ' campo18__mes--planta' : ''}${dentro(m + 1, k.colheita) ? ' campo18__mes--colhe' : ''}`}>{'JFMAMJJASOND'[m]}</span>)}
    </span>
  );
}

function Lavoura({ vida, agir, p }: { vida: Vida; agir: Agir; p: PropriedadeRural18 }) {
  const opcoes = culturasPossiveis(p);
  const [cultura, setCultura] = useState<CulturaId>(opcoes[0]?.c ?? 'milho');
  const livre = areaLivre(p);
  const k = CULTURAS18[cultura];
  const tamanhos = [...new Set([0.25, 0.5, 1].map(f => Math.round(Math.min(livre * f, k.maxHa ?? livre) * 10) / 10).filter(x => x >= 0.1))];
  const irrigavel = haIrrigaveis(p) - p.talhoes.filter(t => t.irrigado).reduce((s, t) => s + t.ha, 0);
  const ano = anoDe(vida.t);
  return (
    <div className="campo18__lavoura">
      {p.talhoes.length ? (
        <ul className="campo18__talhoes">
          {p.talhoes.map(t => {
            const kk = CULTURAS18[t.cultura];
            const idadeT = ano - t.ano;
            const fase = kk.ciclo === 'anual' ? 'safra do ano' : kk.ciclo === 'florestal' ? `${idadeT} de ${kk.vidaUtil} anos até o corte` : idadeT < (kk.formacao ?? 0) ? `em formação (${idadeT + 1}º de ${kk.formacao} anos)` : `produzindo (${idadeT} anos)`;
            return (
              <li key={t.id} className={`campo18__talhao campo18__talhao--${t.cultura}`}>
                <span className="campo18__talhao-cor" aria-hidden />
                <div className="campo18__talhao-txt">
                  <strong>{cap(kk.nome)} · {fmtHa(t.ha)}{t.irrigado ? ' · irrigado' : ''}{t.safrinha ? ' + milho safrinha' : ''}</strong>
                  <span>{fase}{(t.repete ?? 0) >= 3 ? ' · monocultura há anos: o chão cansa' : ''}</span>
                  <Calendario c={t.cultura} />
                </div>
                <div className="campo18__talhao-acoes">
                  {t.cultura === 'soja' && <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'safrinha', id: p.id, talhao: t.id })}>{t.safrinha ? 'Sem safrinha' : 'Milho safrinha'}</BotaoAcao>}
                  <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'arrancar', id: p.id, talhao: t.id })}>Liberar a área</BotaoAcao>
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p className="vazio">Nada plantado. Há {fmtHa(livre)} livres.</p>}
      {p.uso === 'producao' && opcoes.length > 0 && (
        <div className="campo18__plantar">
          <h4>Plantar</h4>
          <label className="campo18__campo">Cultura
            <select value={cultura} onChange={e => setCultura(e.target.value as CulturaId)}>
              {opcoes.map(o => <option key={o.c} value={o.c}>{cap(CULTURAS18[o.c].nome)}{o.aptidao >= 1.05 ? ' — a região favorece' : o.aptidao < 0.8 ? ' — a região não ajuda' : ''}</option>)}
            </select>
          </label>
          <p className="nota">{cap(k.nome)}: {k.ciclo === 'anual' ? 'lavoura anual' : k.ciclo === 'florestal' ? `floresta: corte em ${k.vidaUtil} anos` : `perene: primeira colheita em ${k.formacao} ${k.formacao === 1 ? 'ano' : 'anos'}, vida útil de ${k.vidaUtil}`}. Rende uns {Math.round(k.produtividade).toLocaleString('pt-BR')} × {k.unidade} por hectare num ano normal; custa uns {dinheiroCurto(k.custoHa * custoLocal(p.municipioId))}/ha{k.implantacaoHa ? `, mais ${dinheiroCurto(k.implantacaoHa * custoLocal(p.municipioId))}/ha para implantar` : ''}. Praga típica: {k.praga}. <Calendario c={cultura} /></p>
          <div className="campo18__botoes">
            {tamanhos.map(ha => (
              <BotaoAcao key={ha} vida={vida} agir={agir} acao={r18({ op: 'plantar', id: p.id, cultura, ha })}>{fmtHa(ha)}{custoDaImplantacao(p, cultura, ha) ? ` · ${dinheiroCurto(custoDaImplantacao(p, cultura, ha))}` : ''}</BotaoAcao>
            ))}
            {irrigavel >= 0.5 && <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'plantar', id: p.id, cultura, ha: Math.round(Math.min(irrigavel, livre, k.maxHa ?? livre) * 10) / 10, irrigado: true })}>{fmtHa(Math.min(irrigavel, livre, k.maxHa ?? livre))} irrigados</BotaoAcao>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Rebanho */

function Rebanho({ vida, agir, p }: { vida: Vida; agir: Agir; p: PropriedadeRural18 }) {
  const possiveis = especiesPossiveis(p);
  const [especie, setEspecie] = useState<EspecieRural>(possiveis.find(e => !p.rebanhos.some(r => r.especie === e)) ?? possiveis[0] ?? 'corte');
  return (
    <div className="campo18__rebanhos">
      {p.rebanhos.length ? p.rebanhos.map(rb => {
        const d = REBANHOS18[rb.especie];
        const teto = tetoDaEstrutura(p, rb.especie);
        return (
          <section key={rb.especie} className={`campo18__rebanho campo18__rebanho--${rb.especie}`}>
            <header><strong>{cap(d.nome)}</strong><span>{rb.cabecas.toLocaleString('pt-BR')} {d.unidade}{Number.isFinite(teto) && rb.cabecas > teto ? ` · acima do que a estrutura comporta (${Math.round(teto).toLocaleString('pt-BR')})` : ''}</span></header>
            <div className="campo18__medidores">
              <Medidor rotulo="Genética" valor={rb.genetica} dica={rb.genetica >= 70 ? 'de ponta' : rb.genetica >= 50 ? 'boa' : 'comum'} />
              <Medidor rotulo="Sanidade" valor={rb.sanidade} dica={rb.sanidade >= 70 ? 'em dia' : rb.sanidade >= 45 ? 'atenção' : `risco de ${d.doenca}`} />
            </div>
            {rb.especie !== 'tilapia' && rb.especie !== 'tambaqui' && (
              <div className="campo18__escolhas" role="group" aria-label={`Manejo de ${d.nome}`}>
                <span>Alimentação</span>
                {(['pasto', 'suplementado', 'confinado'] as const).map(a => <button key={a} type="button" className={`campo18__chip${rb.alimentacao === a ? ' campo18__chip--ativo' : ''}`} aria-pressed={rb.alimentacao === a} onClick={() => agir(r18({ op: 'manejo', id: p.id, especie: rb.especie, alimentacao: a }))}>{a === 'pasto' ? 'a pasto' : a === 'suplementado' ? 'com suplemento' : 'confinado'}</button>)}
                <span>Rumo</span>
                {(['manter', 'crescer', 'reduzir'] as const).map(a => <button key={a} type="button" className={`campo18__chip${rb.estrategia === a ? ' campo18__chip--ativo' : ''}`} aria-pressed={rb.estrategia === a} onClick={() => agir(r18({ op: 'manejo', id: p.id, especie: rb.especie, estrategia: a }))}>{a}</button>)}
                <span>Sanidade</span>
                {(['basico', 'completo'] as const).map(a => <button key={a} type="button" className={`campo18__chip${rb.sanitario === a ? ' campo18__chip--ativo' : ''}`} aria-pressed={rb.sanitario === a} onClick={() => agir(r18({ op: 'manejo', id: p.id, especie: rb.especie, sanitario: a }))}>{a === 'basico' ? 'básica' : 'completa (vacina, veterinário)'}</button>)}
              </div>
            )}
            <div className="campo18__botoes">
              <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'animais', id: p.id, especie: rb.especie, lotes: 1 })}>Comprar {d.lote.toLocaleString('pt-BR')} · {dinheiroCurto(precoDoLote(p, rb.especie))}</BotaoAcao>
              {rb.especie !== 'tilapia' && rb.especie !== 'tambaqui' && <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'genetica', id: p.id, especie: rb.especie })}>Melhoramento genético · {dinheiroCurto(custoDaGenetica(p, rb.especie))}</BotaoAcao>}
              <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'vender_animais', id: p.id, especie: rb.especie, fracao: 0.25 })}>Vender um quarto</BotaoAcao>
              <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'vender_animais', id: p.id, especie: rb.especie, fracao: 1 })}>Vender todos</BotaoAcao>
            </div>
            {rb.especie === 'cavalos' && (p.cavalos?.length ?? 0) > 0 && (
              <ul className="campo18__cavalos" aria-label="Cavalos de corrida">
                {p.cavalos!.map(c => <li key={c.id}><strong>{c.nome}</strong> <span>{anoDe(vida.t) - c.nasc} anos · velocidade {c.velocidade} · fundo {c.fundo} · {c.corridas} corridas, {c.vitorias} vitórias{c.aposentado ? ' · aposentado' : ''}</span></li>)}
                <li className="nota">Correm no turfe: Vida · Apostas · Turfe → inscrever um cavalo da casa.</li>
              </ul>
            )}
          </section>
        );
      }) : <p className="vazio">Nenhum animal de produção aqui.</p>}
      {p.uso === 'producao' && possiveis.length > 0 && (
        <div className="campo18__plantar">
          <h4>Começar uma criação</h4>
          <label className="campo18__campo">Animal
            <select value={especie} onChange={e => setEspecie(e.target.value as EspecieRural)}>
              {possiveis.map(e => <option key={e} value={e}>{cap(REBANHOS18[e].nome)}</option>)}
            </select>
          </label>
          <p className="nota">{cap(REBANHOS18[especie].nome)}: um lote de {REBANHOS18[especie].lote.toLocaleString('pt-BR')} {REBANHOS18[especie].unidade} custa {dinheiroCurto(precoDoLote(p, especie))}. {REBANHOS18[especie].estrutura ? `Sem ${ESTRUTURAS18[REBANHOS18[especie].estrutura!].nome}, o teto é de ${REBANHOS18[especie].semEstrutura.toLocaleString('pt-BR')}.` : ''} Produz: {REBANHOS18[especie].produto}.</p>
          <div className="campo18__botoes">
            {[1, 3].map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={r18({ op: 'animais', id: p.id, especie, lotes: n })}>{n === 1 ? 'Um lote' : 'Três lotes'} · {dinheiroCurto(precoDoLote(p, especie) * n)}</BotaoAcao>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Estrutura e máquinas */

function Estrutura({ vida, agir, p }: { vida: Vida; agir: Agir; p: PropriedadeRural18 }) {
  const est = estruturasPossiveis(p);
  const maq = maquinasPossiveis(p);
  return (
    <div className="campo18__estrutura">
      <h4>Obras</h4>
      <ul className="campo18__itens">
        {est.map(id => {
          const e = ESTRUTURAS18[id];
          const tem = qtdEstrutura(p, id);
          return (
            <li key={id} className={`campo18__item${tem ? ' campo18__item--tem' : ''}`}>
              <div><strong>{cap(e.nome)}{tem ? ` · ${tem > 1 ? `${tem} unidades` : 'feito'}` : ''}</strong><span>{e.oque}</span></div>
              <BotaoAcao vida={vida} agir={agir} ocultarImpossivel acao={r18({ op: 'construir', id: p.id, estrutura: id })}>{tem ? 'Mais uma' : 'Construir'} · {dinheiroCurto(precoDaEstrutura(p, id))}</BotaoAcao>
            </li>
          );
        })}
      </ul>
      <h4>Máquinas</h4>
      {maq.length ? (
        <ul className="campo18__itens">
          {maq.map(id => {
            const m = MAQUINAS18[id];
            const n = p.maquinas.filter(x => x.id === id).length;
            return (
              <li key={id} className={`campo18__item${n ? ' campo18__item--tem' : ''}`}>
                <div><strong>{cap(m.nome)}{n ? ` · ${n}` : ''}</strong><span>{m.oque}</span></div>
                <div className="campo18__botoes">
                  <BotaoAcao vida={vida} agir={agir} ocultarImpossivel acao={r18({ op: 'maquina', id: p.id, maquina: id })}>Comprar · {dinheiroCurto(precoDaMaquina(p, id))}</BotaoAcao>
                  {n > 0 && <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'vender_maquina', id: p.id, maquina: id })}>Vender</BotaoAcao>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p className="nota">Numa área deste tamanho, o trabalho de máquina é contratado por empreitada.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Gestão */

function Gestao({ vida, agir, p, propria }: { vida: Vida; agir: Agir; p: PropriedadeRural18; propria: boolean }) {
  const passo = Math.max(1, Math.round(p.ha * 0.2));
  return (
    <div className="campo18__gestao">
      <div className="campo18__escolhas" role="group" aria-label="Uso da propriedade">
        <span>Uso</span>
        {(['producao', 'residencia', 'investimento'] as const).map(u => <BotaoAcao key={u} vida={vida} agir={agir} ocultarImpossivel acao={r18({ op: 'uso', id: p.id, uso: u })} variante={p.uso === u ? 'principal' : 'secundario'}>{u === 'producao' ? 'Produzir' : u === 'residencia' ? 'Casa e lazer' : 'Guardar como investimento'}</BotaoAcao>)}
      </div>
      <div className="campo18__escolhas" role="group" aria-label="Foco da produção">
        <span>Foco</span>
        {(['volume', 'equilibrio', 'qualidade'] as const).map(f => <button key={f} type="button" className={`campo18__chip${p.foco === f ? ' campo18__chip--ativo' : ''}`} aria-pressed={p.foco === f} onClick={() => agir(r18({ op: 'foco', id: p.id, foco: f }))}>{f === 'volume' ? 'volume' : f === 'qualidade' ? 'qualidade' : 'equilíbrio'}</button>)}
      </div>
      <ul className="campo18__itens">
        <li className="campo18__item"><div><strong>{p.manejo === 'organico' ? 'Manejo orgânico' : 'Converter para o orgânico'}</strong><span>Três anos de transição (rende menos), depois a certificação: o produto vale mais.</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'organico', id: p.id })}>{p.manejo === 'organico' ? 'Voltar ao convencional' : 'Começar a transição'}</BotaoAcao></li>
        <li className="campo18__item"><div><strong>Corrigir o solo</strong><span>Calcário, gesso e adubação verde: o solo sobe ({p.solo} hoje).</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'solo', id: p.id })}>Corrigir · {dinheiroCurto(custoDoSolo(p))}</BotaoAcao></li>
        <li className="campo18__item"><div><strong>Cooperativa</strong><span>Compra junto, vende junto, assistência técnica; tem cota e mensalidade.</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'cooperativa', id: p.id })}>{p.cooperativa ? 'Sair' : 'Associar-se'}</BotaoAcao></li>
        <li className="campo18__item"><div><strong>Seguro rural</strong><span>Paga parte da perda num ano muito ruim.</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'seguro', id: p.id })}>{p.seguro ? 'Cancelar' : 'Contratar'}</BotaoAcao></li>
        {vida.trabalho.atual?.ocupacaoId !== 'produtor_rural' && <li className="campo18__item"><div><strong>Viver da terra</strong><span>Largar o emprego e tocar a propriedade você mesmo (sem caseiro nem gerente).</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'tocar', id: p.id })}>Tocar a terra</BotaoAcao></li>}
        {qtdEstrutura(p, 'sede') > 0 && <li className="campo18__item"><div><strong>Uma temporada no campo</strong><span>Férias na propriedade: descanso, a família junto.</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'temporada', id: p.id })}>Passar a temporada · {dinheiroCurto(custoDaTemporada(vida, p))}</BotaoAcao></li>}
        {propria && <li className="campo18__item"><div><strong>Expandir</strong><span>Comprar {fmtHa(passo)} do vizinho, ao preço da terra daqui.</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'expandir', id: p.id, ha: passo })}>Comprar · {dinheiroCurto(Math.round(p.valorHa * 1.05 * passo))}</BotaoAcao></li>}
        {propria && <li className="campo18__item"><div><strong>Reduzir</strong><span>Vender {fmtHa(passo)} (precisa estar livre).</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'reduzir', id: p.id, ha: passo })}>Vender · {dinheiroCurto(Math.round(p.valorHa * 0.95 * passo))}</BotaoAcao></li>}
        {propria && p.uso !== 'arrendada' && <li className="campo18__item"><div><strong>Arrendar a terceiros</strong><span>Cinco anos de renda fixa; o rebanho é vendido antes.</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'arrendar_para', id: p.id })}>Arrendar</BotaoAcao></li>}
        {p.uso === 'arrendada' && <li className="campo18__item"><div><strong>Retomar a terra</strong><span>Rescindir o contrato (multa de meio ano).</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'retomar', id: p.id })}>Retomar</BotaoAcao></li>}
        {!propria && <li className="campo18__item"><div><strong>Devolver a terra</strong><span>Antes do fim do contrato: multa de meio ano; o rebanho e as máquinas são vendidos.</span></div><BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'devolver', id: p.id })}>Devolver</BotaoAcao></li>}
      </ul>
      {propria && <p className="nota">Vender a propriedade inteira (com o que tem dentro) é em Patrimônio, como qualquer imóvel.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Contas */

function Contas({ p, r }: { p: PropriedadeRural18; r: Resumo }) {
  const u = r.ultimo;
  const prev = r.previsao;
  const Tabela = ({ linhas }: { linhas: { oque: string; receita: number; custo: number; nota?: string }[] }) => (
    <table className="campo18__tabela">
      <thead><tr><th scope="col">Linha</th><th scope="col">Entrou</th><th scope="col">Saiu</th></tr></thead>
      <tbody>{linhas.map((l, k) => <tr key={k}><th scope="row">{l.oque}{l.nota ? <span className="campo18__nota">{l.nota}</span> : null}</th><td>{l.receita ? dinheiroCurto(l.receita) : '—'}</td><td>{l.custo ? dinheiroCurto(l.custo) : '—'}</td></tr>)}</tbody>
    </table>
  );
  return (
    <div className="campo18__contas">
      {u ? (
        <section>
          <h4>{u.ano}: {u.resultado >= 0 ? 'fechou com' : 'fechou devendo'} <span className={u.resultado < 0 ? 'campo18__ruim' : 'campo18__bom'}>{dinheiroCurto(Math.abs(u.resultado))}</span></h4>
          <p className="nota">Clima do ano: {u.clima === 'bom' ? 'bom' : u.clima}.</p>
          <Tabela linhas={u.linhas} />
        </section>
      ) : <p className="vazio">O primeiro ano fecha na virada.</p>}
      <section>
        <h4>Num ano normal, hoje: {prev.receita - prev.custo >= 0 ? '+' : '−'}{dinheiroCurto(Math.abs(prev.receita - prev.custo))}</h4>
        <p className="nota">Previsão sem praga e com chuva regular, ao preço médio. O ano de verdade vem com o clima e o mercado.</p>
        <Tabela linhas={prev.linhas} />
      </section>
      {p.historico.length > 1 && (
        <section>
          <h4>Os anos</h4>
          <ol className="campo18__anos">{[...p.historico].reverse().map(h => <li key={h.ano}><span>{h.ano}</span><span className={`campo18__barra${h.resultado < 0 ? ' campo18__barra--ruim' : ''}`} style={{ width: `${Math.min(100, Math.abs(h.resultado) / Math.max(1, ...p.historico.map(x => Math.abs(x.resultado))) * 100)}%` }} /><span>{h.resultado >= 0 ? '+' : '−'}{dinheiroCurto(Math.abs(h.resultado))}</span></li>)}</ol>
        </section>
      )}
    </div>
  );
}

/* ================================================================== As ofertas */

function Ofertas({ vida, agir }: { vida: Vida; agir: Agir }) {
  const os = useMemo(() => ofertasRurais(vida), [vida]);
  const cred = condicaoDeCredito(vida);
  return (
    <Secao titulo="À venda e para arrendar na região" recolhivel aberta={!todasAsPropriedades(vida).length}>
      <p className="nota">Na zona rural de onde você mora. O {cred.nome} financia 80% ({(cred.jurosMes * 100).toLocaleString('pt-BR')}% ao mês, {cred.prazo / 12} anos){cred.rural ? ' — juro de quem produz' : '; quem já produz tem o crédito rural, mais barato'}.</p>
      <ul className="campo18__ofertas">
        {os.map(o => <Oferta key={o.id} vida={vida} agir={agir} o={o} />)}
      </ul>
    </Secao>
  );
}

function Oferta({ vida, agir, o }: { vida: Vida; agir: Agir; o: OfertaRural18 }) {
  const T = TIPOS18[o.p.tipo];
  return (
    <li className="campo18__oferta">
      <Paisagem18 p={o.p} pequena />
      <div className="campo18__oferta-txt">
        <p className="campo18__placa-tipo">{T.nome}</p>
        <strong>{o.p.nome} · {fmtHa(o.p.ha)}</strong>
        <span>{T.oque}</span>
        <span>Solo {o.p.solo >= 70 ? 'fértil' : o.p.solo >= 50 ? 'médio' : 'fraco'} · água {o.p.agua >= 65 ? 'farta' : o.p.agua >= 40 ? 'regular' : 'escassa'} · relevo {o.p.relevo}{o.porteiraFechada ? ' · porteira fechada (com a produção)' : ' · terra sem produção'}</span>
        {o.porteiraFechada && (o.p.talhoes.length > 0 || o.p.rebanhos.length > 0) && <span className="nota">Vem com: {[...o.p.talhoes.map(t => `${CULTURAS18[t.cultura].nome} (${fmtHa(t.ha)})`), ...o.p.rebanhos.map(r => `${r.cabecas.toLocaleString('pt-BR')} ${REBANHOS18[r.especie].unidade} de ${REBANHOS18[r.especie].nome}`)].join(', ')}.</span>}
        <span className="campo18__preco"><strong>{dinheiroCurto(o.preco)}</strong> · arrendar: {dinheiroCurto(o.arrendamentoAno)}/ano</span>
      </div>
      <div className="campo18__botoes">
        <BotaoAcao vida={vida} agir={agir} variante="principal" acao={r18({ op: 'comprar', oferta: o.id })}>Comprar à vista</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'comprar', oferta: o.id, financiar: true })}>Financiar</BotaoAcao>
        <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'arrendar', oferta: o.id })}>Arrendar</BotaoAcao>
      </div>
    </li>
  );
}

/* ================================================================== As festas */

function Festas({ vida, agir }: { vida: Vida; agir: Agir }) {
  const fs = festasDoAno(vida);
  if (!fs.length || idade(vida) < 6) return null;
  const foi = vida.rural18?.festas?.ano === anoDe(vida.t) ? vida.rural18.festas.ids : [];
  return (
    <Secao titulo="Festas e eventos do campo" recolhivel aberta={false}>
      <ul className="campo18__festas">
        {[...fs].sort((a, b) => a.mes - b.mes).map(f => (
          <li key={f.id} className={`campo18__festa${foi.includes(f.id) ? ' campo18__festa--foi' : ''}`}>
            <span className="campo18__festa-mes">{mesNome(f.mes).slice(0, 3)}</span>
            <div><strong>{cap(f.nome)}</strong><span>{f.oque}</span></div>
            <BotaoAcao vida={vida} agir={agir} acao={r18({ op: 'festa', festa: f.id })}>{foi.includes(f.id) ? 'Já foi' : 'Ir'}</BotaoAcao>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

export default Campo18;
