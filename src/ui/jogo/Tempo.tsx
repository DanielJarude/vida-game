/**
 * Tempo livre: a semana, desenhada.
 *
 * A faixa no topo é a semana inteira: primeiro o que já vem ocupado
 * (trabalho, estudo, filhos, cuidado), depois o que você escolheu fazer, e
 * o que sobra. Se passa do que cabe, o pedaço a mais aparece fora da faixa,
 * hachurado e com nome — não só vermelho. Os números são os do motor
 * (`sistemas/semana`): a MESMA conta que decide se uma atividade cabe.
 *
 * Depois: o que você faz (a rotina), algumas sugestões com motivo, e o
 * resto do catálogo recolhido em "explorar", por tipo.
 */

import { useState } from 'react';
import type { Dominio, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { ROTINAS, atividadeExiste, modeloRotina, nivelDa, nivelModelo, type CategoriaAtividade, type ModeloRotina } from '../../motor/sistemas/rotinas';
import { cabeNaSemana, dose, semana, type Semana } from '../../motor/sistemas/semana';
import { frentesDaVida, leituraDaFrente } from '../../motor/sistemas/frentes';
import { atividadesParaVoce } from '../../motor/sistemas/relevancia';
import { fatoresCabeca } from '../../motor/sistemas/estado';
import { ultimaDevolutiva } from '../../motor/sistemas/devolutivas';
import { economiaLocal } from '../../motor/dados/lugares';
import { deslocamento, NOME_MODO, semTrajeto, tempoEmPalavras } from '../../motor/sistemas/transporte';
import { idade } from '../../motor/nucleo';
import { listaNatural } from '../../motor/texto';
import { podeTentar } from '../../motor/plausibilidade';
import { BotaoAcao, Folio, Secao, Vazio } from '../comum';
import { dinheiroCurto } from '../apresentar';
import { areaDaPorta, PortasAbertas } from './Estudos';
import { doClube } from '../../motor/dados/clubes';
import type { Aba } from '../telas/Jogo';

const GRUPOS: { id: CategoriaAtividade; rotulo: string }[] = [
  { id: 'esporte', rotulo: 'Esporte' }, { id: 'arte', rotulo: 'Arte' }, { id: 'estudo', rotulo: 'Estudo' },
  { id: 'oficio', rotulo: 'Ofício' }, { id: 'social', rotulo: 'Gente e comunidade' }, { id: 'corpo', rotulo: 'Corpo' },
  { id: 'renda', rotulo: 'Dinheiro por fora' }, { id: 'cuidado', rotulo: 'Cuidado' }, { id: 'lazer', rotulo: 'Lazer' }
];

function resumoDaSemana(s: Semana): string {
  if (s.ocupado > s.capacidade + 0.01) return 'Você está fazendo mais do que cabe na semana — o cansaço aparece.';
  if (s.livre >= 1.5) return 'Sobra bastante tempo para escolher o que fazer.';
  if (s.livre >= 1) return 'Sobra tempo para mais uma ou duas coisas.';
  if (s.livre >= 0.5) return 'Sobra espaço para uma coisa leve, uma vez por semana.';
  return 'Sua semana está cheia.';
}

type Pedaco = { id: string; rotulo: string; curto: string; peso: number; tipo: 'trabalho' | 'estudo' | 'casa' | 'atividade' | 'livre' | 'excesso' };

const CURTO: Record<string, string> = { negocio: 'Negócio', trabalho: 'Trabalho', horas_extras: 'Horas extras', curso: 'Estudo', integrado: 'Escola técnica', filhos_pequenos: 'Filhos', filhos_escola: 'Filhos', cuidar: 'Cuidar', deslocamento: 'Trajeto' };

/** A semana em pedaços, na ordem: o que já vem ocupado, o que você escolheu, o que sobra, o que passa. */
function pedacos(s: Semana): Pedaco[] {
  const out: Pedaco[] = [];
  for (const f of s.fixos) {
    if (f.peso < 0.2) continue;
    out.push({ id: f.id, rotulo: f.rotulo, curto: CURTO[f.id] ?? f.rotulo.replace(/ \(.*\)$/, ''), peso: f.peso, tipo: f.tipo === 'trabalho' || f.tipo === 'deslocamento' ? 'trabalho' : f.tipo === 'estudo' ? 'estudo' : 'casa' });
  }
  const ganho = s.ganhos.reduce((t, g) => t + g.peso, 0);
  // A condução devolve tempo: o pedaço de trabalho encolhe (e a legenda diz por quê).
  if (ganho > 0) { const t = out.find(p => p.tipo === 'trabalho'); if (t) t.peso = Math.max(0.25, t.peso - ganho); }
  for (const r of s.rotinas) out.push({ id: r.id, rotulo: r.rotulo, curto: r.rotulo.replace(/ — .*/, ''), peso: r.peso, tipo: 'atividade' });
  if (s.livre > 0.01) out.push({ id: 'livre', rotulo: 'Livre', curto: 'Livre', peso: s.livre, tipo: 'livre' });
  return out;
}

function FaixaDaSemana({ s }: { s: Semana }) {
  const lista = pedacos(s);
  const total = lista.reduce((t, p) => t + p.peso, 0) || 1;
  // A semana tem um tamanho (s.base): o que passa dele fica hachurado, com nome.
  const dentro = Math.min(total, s.base);
  const descricao = lista.map(p => `${p.rotulo}: ${p.tipo === 'livre' ? 'livre' : dose(p.peso)}`).join('; ');
  const fixos = s.fixos.filter(f => f.peso >= 0.25).map(f => { const x = f.rotulo.replace(/ \(.*\)$/, ''); return x.charAt(0).toLowerCase() + x.slice(1); });
  return (
    <figure className="semana" aria-label={`A semana: ${descricao}.`}>
      {fixos.length > 0 && <p className="semana__fixos">Antes de qualquer escolha, a semana já tem {listaNatural(fixos)}.</p>}
      <div className="semana__faixa" role="img" aria-label={`A semana: ${descricao}.`}>
        {lista.map(p => (
          <span key={p.id} className={`semana__pedaco semana__pedaco--${p.tipo}`} style={{ flexGrow: p.peso, flexBasis: 0 }} title={p.rotulo}>
            {p.peso / total >= 0.12 && <span className="semana__rotulo">{p.curto}</span>}
          </span>
        ))}
        {dentro < total - 0.01 && <span className="semana__alem-faixa" style={{ left: `${(dentro / total) * 100}%` }} aria-hidden><span>passa da semana</span></span>}
      </div>
      {dentro < total - 0.01 && <p className="semana__alem">O trecho hachurado, depois da linha, é o que passa do que cabe numa semana.</p>}
      <figcaption className="semana__legenda">
        <ul>
          {lista.map(p => (
            <li key={p.id}>
              <span className={`semana__amostra semana__pedaco--${p.tipo}`} aria-hidden />
              <span className="semana__nome">{p.rotulo}</span>
              <span className="semana__dose">{p.tipo === 'livre' ? (p.peso >= 1 ? 'algumas vezes por semana, livre' : 'um pouco, livre') : dose(p.peso)}</span>
            </li>
          ))}
          {s.ganhos.map(g => <li key={g.id} className="semana__ganho"><span className="semana__amostra" aria-hidden /><span className="semana__nome">{g.rotulo}</span><span className="semana__dose">devolve tempo</span></li>)}
        </ul>
      </figcaption>
    </figure>
  );
}

/** Para onde leva cada pedaço fixo da semana (a causa mora em outra área). */
const ORIGEM: Record<string, { area: Aba; rotulo: string }> = {
  trabalho: { area: 'trabalho', rotulo: 'Trabalho' }, horas_extras: { area: 'trabalho', rotulo: 'Trabalho' }, politica: { area: 'trabalho', rotulo: 'Trabalho' }, negocio: { area: 'trabalho', rotulo: 'Trabalho' },
  curso: { area: 'estudos', rotulo: 'Estudos' }, integrado: { area: 'estudos', rotulo: 'Estudos' },
  filhos_pequenos: { area: 'pessoas', rotulo: 'Pessoas' }, filhos_escola: { area: 'pessoas', rotulo: 'Pessoas' }, cuidar: { area: 'pessoas', rotulo: 'Pessoas' }, cuidado_pausa: { area: 'trabalho', rotulo: 'Trabalho' }, pets: { area: 'pessoas', rotulo: 'Pessoas' },
  deslocamento: { area: 'cidade', rotulo: 'Cidade' }
};

/**
 * Para onde vai o seu tempo: cada coisa que ocupa a semana, do maior para o
 * menor, com o tamanho em palavras e o caminho até a causa. Quando passa do
 * que cabe, diz o que está apertando — e o que dá para aliviar.
 */
function ParaOndeVai({ vida, s, irPara }: { vida: Vida; s: Semana; irPara?: (a: Aba) => void }) {
  const itens = [
    ...s.fixos.map(f => ({ id: f.id, rotulo: f.rotulo, peso: f.peso, fixo: true })),
    ...s.rotinas.map(r => ({ id: r.id, rotulo: r.rotulo, peso: r.peso, fixo: false }))
  ].filter(x => x.peso >= 0.05).sort((a, b) => b.peso - a.peso);
  if (!itens.length) return null;
  const passa = s.ocupado > s.capacidade + 0.01 || s.fixos.reduce((t, f) => t + f.peso, 0) > s.base + 0.01;
  const base = vida.caminhos.esporte?.fase === 'base' ? vida.caminhos.esporte : undefined;
  return (
    <section className="para-onde" aria-labelledby="titulo-para-onde">
      <h2 id="titulo-para-onde" className="secao-fio">Para onde vai o seu tempo</h2>
      {passa && <p className="nota nota--atencao"><span aria-hidden>! </span>A semana passa do que cabe. O que mais pesa: {listaNatural(itens.slice(0, 2).map(x => x.rotulo.replace(/ \(.*\)$/, '').replace(/ — .*/, '').toLowerCase()))}. Aliviar algo aqui é o que devolve fôlego.</p>}
      <ul className="para-onde__lista">
        {itens.map(x => {
          const origem = ORIGEM[x.id];
          const treinoBase = base && x.id === base.modalidade;
          return (
            <li key={x.id} className={`para-onde__item${x.fixo ? ' para-onde__item--fixo' : ''}`}>
              <span className="para-onde__barra" aria-hidden><span style={{ width: `${Math.min(100, (x.peso / Math.max(1, s.base)) * 100 * 1.6)}%` }} /></span>
              <span className="para-onde__nome">{treinoBase ? `Treino de base ${doClube(base!.clube)}` : x.rotulo}</span>
              <span className="para-onde__dose">{dose(x.peso)}{x.fixo ? ' · fixo' : ' · escolha sua'}</span>
              {treinoBase && <span className="para-onde__porque">A base toma quase todos os dias: é por isso que outras coisas não cabem.</span>}
              {origem && irPara && <button type="button" className="link para-onde__ir" onClick={() => irPara(origem.area)}>ver em {origem.rotulo} →</button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * O trajeto de todo dia: como você vai, quanto tempo leva, quanto custa — e
 * os outros jeitos que você tem, com a diferença dita antes de trocar.
 */
function ComoVoceVai({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }) {
  if (idade(vida) < 14) return null;
  const d = deslocamento(vida);
  if (!d) return (vida.trabalho.atual || vida.educacao.matricula) ? <section className="trajeto" aria-labelledby="titulo-trajeto"><h2 id="titulo-trajeto" className="secao-fio">O trajeto de todo dia</h2><p className="nota">{semTrajeto(vida)}</p></section> : null;
  const outras = d.opcoes.filter(o => o.modo !== d.modo);
  return (
    <section className="trajeto" aria-labelledby="titulo-trajeto">
      <h2 id="titulo-trajeto" className="secao-fio">O trajeto de todo dia</h2>
      <p className="trajeto__agora"><strong>Para {d.destino}, você vai {NOME_MODO[d.modo]}{d.nomeVeiculo ? ` (${d.nomeVeiculo})` : ''}</strong>: {tempoEmPalavras(d.minutos)}, ida e volta{d.passagem ? `, com ${dinheiroCurto(d.passagem)} de passagem por mês` : d.veiculoId ? '; o combustível e a manutenção estão nas contas da casa' : ', sem gastar nada'}.</p>
      <p className="nota">{d.motivo}</p>
      {outras.length > 0 && (
        <ul className="trajeto__opcoes">
          {outras.map(o => {
            const dif = o.minutos - d.minutos;
            return (
              <li key={o.modo}>
                <BotaoAcao vida={vida} acao={{ tipo: 'deslocamento', modo: o.modo }} agir={agir} variante="discreto" ocultarBloqueado>{`Ir ${NOME_MODO[o.modo]}${o.nomeVeiculo ? ` (${o.nomeVeiculo})` : ''}`}</BotaoAcao>
                <span className="trajeto__dif">{tempoEmPalavras(o.minutos)} — {dif > 0 ? `${dif} min a mais por dia` : `${-dif} min a menos por dia`}{o.passagem ? `, ${dinheiroCurto(o.passagem)}/mês de passagem` : d.passagem ? ', sem passagem' : ''}</span>
              </li>
            );
          })}
        </ul>
      )}
      {d.escolhido && <BotaoAcao vida={vida} acao={{ tipo: 'deslocamento', modo: 'auto' }} agir={agir} variante="discreto">Voltar a ir do jeito mais rápido</BotaoAcao>}
      {!d.veiculoId && d.modo !== 'a_pe' && irPara && <p className="nota">Um veículo muda isso: <button type="button" className="link" onClick={() => irPara('cidade')}>ver as lojas na Cidade →</button></p>}
    </section>
  );
}

export function Tempo({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }) {
  const i = idade(vida);
  if (i < 3) return <div className="tempo"><Folio kicker={<><span className="folio__area">Tempo livre</span></>} titulo="O tempo é de quem cuida de você." /></div>;
  const s = semana(vida);
  const custo = economiaLocal(vida.moradia.municipioId).custo;
  const ativas = vida.rotinas.map(r => ({ r, m: modeloRotina(r.id) })).filter((x): x is { r: Vida['rotinas'][number]; m: ModeloRotina } => !!x.m);
  const frentes = frentesDaVida(vida);
  const pesaNaCabeca = fatoresCabeca(vida).some(f => (f.id === 'semana' || f.id === 'semana_fixa') && f.efeito > 0);
  const peneira = ultimaDevolutiva(vida, 'peneira', 36);
  return (
    <div className="tempo">
      <Folio kicker={<><span className="folio__area">Tempo livre</span> · a semana</>} titulo={resumoDaSemana(s)} lede={pesaNaCabeca ? 'Isso tem pesado na cabeça.' : undefined} />
      <PortasAbertas vida={vida} agir={agir} filtro={o => areaDaPorta(o) === 'tempo'} titulo="Portas que a vida abriu" />
      <section className="tempo-semana" aria-labelledby="titulo-semana">
        <h2 id="titulo-semana" className="secao-fio">Sua semana</h2>
        <FaixaDaSemana s={s} />
        {s.fixos.length === 0 && <p className="nota">{i < 18 ? 'Além da escola, a semana é sua.' : 'Nada fixo ocupa a semana: nem trabalho, nem curso.'}</p>}
      </section>
      <ParaOndeVai vida={vida} s={s} irPara={irPara} />
      <ComoVoceVai vida={vida} agir={agir} irPara={irPara} />

      <Secao titulo="O que você faz">
        {ativas.length === 0 && <Vazio>Nada fixo na semana por enquanto.</Vazio>}
        <ul className="lista-rotinas">
          {ativas.map(({ r, m }) => {
            const n = nivelDa(r);
            const nm = nivelModelo(m, n);
            const dominio = m.pratica ? (Object.keys(m.pratica)[0] as Dominio) : undefined;
            const leitura = dominio && vida.caminhos.frentes[dominio] ? leituraDaFrente(vida, dominio) : '';
            const anos = Math.floor((vida.t - r.tInicio) / 12);
            const renda = m.renda?.(vida, n);
            const retorno = peneira && peneira.dominio === dominio ? peneira : undefined;
            return (
              <li key={r.id} className="rotina rotina--ativa">
                <div className="rotina__texto">
                  <strong>{m.nome}</strong>
                  <span>{m.niveis.length > 1 ? `${nm.rotulo} · ` : ''}{dose(nm.tempo)}{anos >= 1 ? ` · há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : ''}{nm.custo ? ` · ${dinheiroCurto(nm.custo * custo)}/mês` : ''}{renda ? ` · rende uns ${dinheiroCurto(renda)}/mês` : ''}</span>
                  {leitura && <span className="rotina__leitura">{leitura}</span>}
                  {retorno && <span className="rotina__retorno">Na última {dominio === 'futebol' ? 'peneira' : 'seletiva'}: {retorno.texto}</span>}
                </div>
                <div className="rotina__acoes">
                  {n < m.niveis.length && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: true, nivel: (n + 1) as 2 | 3 }} agir={agir} variante="discreto" ocultarBloqueado>{`Mais a sério: ${nivelModelo(m, n + 1).rotulo.toLowerCase()}`}</BotaoAcao>}
                  {n > 1 && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: true, nivel: (n - 1) as 1 | 2 }} agir={agir} variante="discreto">Mais leve</BotaoAcao>}
                  <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: false }} agir={agir} variante="discreto">Parar</BotaoAcao>
                </div>
              </li>
            );
          })}
        </ul>
      </Secao>

      <Comecar vida={vida} agir={agir} custo={custo} />

      {frentes.length > 0 && (
        <Secao titulo="O que você sabe fazer" recolhivel aberta={false}>
          <ul className="frentes">
            {frentes.map(f => <li key={f.d}><strong>{f.nome.charAt(0).toUpperCase() + f.nome.slice(1)}</strong><span>{f.texto}</span></li>)}
          </ul>
        </Secao>
      )}
    </div>
  );
}

function linhaAtividade(vida: Vida, m: ModeloRotina, custo: number, agir: (a: Acao) => boolean, motivo?: string, comBotao = true) {
  const n1 = m.niveis[0];
  const renda = m.renda?.(vida, 1);
  return (
    <li key={m.id} className="rotina">
      <div className="rotina__texto">
        <strong>{m.nome}</strong>
        {motivo && <span className="rotina__motivo">{motivo}</span>}
        <span>{motivo ? '' : `${m.descricao} `}{dose(n1.tempo)}{n1.custo ? ` · ${dinheiroCurto(n1.custo * custo)}/mês` : ' · de graça'}{renda ? ` · rende uns ${dinheiroCurto(renda)}/mês` : ''}</span>
      </div>
      {comBotao && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: m.id, ativa: true, nivel: 1 }} agir={agir}>{m.niveis.length > 1 ? `Começar: ${n1.rotulo.toLowerCase()}` : 'Começar'}</BotaoAcao>}
    </li>
  );
}

/**
 * O que dá para começar: poucas sugestões com motivo; o resto do catálogo
 * em "explorar", por tipo; o que não cabe e o que está fora de alcance,
 * recolhidos, com o motivo uma vez só.
 */
function Comecar({ vida, agir, custo }: { vida: Vida; agir: (a: Acao) => boolean; custo: number }) {
  const [explorar, setExplorar] = useState(false);
  const [verSemTempo, setVerSemTempo] = useState(false);
  const [verFora, setVerFora] = useState(false);
  const { para, resto } = atividadesParaVoce(vida);
  const outras = ROTINAS.filter(m => !vida.rotinas.some(x => x.id === m.id) && atividadeExiste(vida, m));
  const itens = outras.map(m => ({ m, d: disponibilidade(vida, { tipo: 'rotina', id: m.id, ativa: true, nivel: 1 }) }));
  const semTempo = itens.filter(x => !podeTentar(x.d) && x.d.grau === 'incompativel' && /semana/.test(x.d.motivo ?? ''));
  const fora = itens.filter(x => !podeTentar(x.d) && !semTempo.includes(x));
  const cheia = cabeNaSemana(vida, 0.5);
  return (
    <Secao titulo="Para começar">
      {!cheia.cabe && <p className="nota">{cheia.motivo.replace(/Isso pede [^.]*\./, 'Uma atividade nova, mesmo leve, não cabe.')}</p>}
      {para.length > 0 && <ul className="lista-rotinas lista-rotinas--sugestoes">{para.map(x => linhaAtividade(vida, x.item, custo, agir, x.motivo))}</ul>}
      {para.length === 0 && cheia.cabe && <Vazio>Nada novo por aqui agora.</Vazio>}
      {resto.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={explorar} onClick={() => setExplorar(x => !x)}>{explorar ? 'Recolher' : `Explorar outras atividades (${resto.length})`}</button>
          {explorar && GRUPOS.map(g => {
            const lista = resto.filter(m => m.categoria === g.id);
            if (!lista.length) return null;
            return (
              <div key={g.id} className="grupo-atividades">
                <h3 className="grupo-atividades__titulo">{g.rotulo}</h3>
                <ul className="lista-rotinas">{lista.map(m => linhaAtividade(vida, m, custo, agir))}</ul>
              </div>
            );
          })}
        </div>
      )}
      {semTempo.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={verSemTempo} onClick={() => setVerSemTempo(x => !x)}>{verSemTempo ? 'Esconder' : 'Ver'} o que caberia com mais tempo ({semTempo.length})</button>
          {verSemTempo && <ul className="lista-rotinas lista-vagas--bloqueadas">{semTempo.map(x => linhaAtividade(vida, x.m, custo, agir, undefined, false))}</ul>}
        </div>
      )}
      {fora.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={verFora} onClick={() => setVerFora(x => !x)}>{verFora ? 'Esconder' : 'Ver'} o que ainda está fora de alcance ({fora.length})</button>
          {verFora && (
            <ul className="lista-vagas lista-vagas--bloqueadas">
              {fora.map(x => <li key={x.m.id} className="vaga vaga--bloqueada"><div className="vaga__texto"><strong>{x.m.nome}</strong><span>{x.d.motivo}</span></div></li>)}
            </ul>
          )}
        </div>
      )}
    </Secao>
  );
}
