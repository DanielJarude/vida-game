/**
 * Tempo livre: a semana — e o que fazer com ela.
 *
 * FIX pós-REWORK 4: a área acumulava tudo numa página só. Agora há abas que
 * respondem, de primeira, ao que a pessoa quer:
 *
 *   A semana        o ESTRESSE (um medidor só: quanto, para onde vai, o que
 *                   pesa, o que ajuda, se ainda cabe algo, o que acontece se
 *                   continuar assim) e tudo o que você já faz
 *   Corpo e mente   esporte, academia, corrida, terapia, descanso
 *   Hobbies         arte, música, leitura, estudo, ofícios, dinheiro por fora
 *   Sair e ver gente  comunidade, noite, família — e com quem fazer algo
 *   Redes sociais   as sete plataformas (`Redes`)
 *   Viagens         viagens e experiências
 *
 * A "carga" (quanto da semana já está tomado) continua no motor — é ela que
 * diz se ainda cabe algo —, mas a pessoa lê o estresse. Os números são os do
 * motor (`leituraDoEstresse`, `semana`): a MESMA conta que decide.
 */

import { useState } from 'react';
import type { Dominio, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { DE_FORMACAO } from '../../motor/sistemas/formacao';
import { redeDeSaude } from '../../motor/sistemas/saude';
import { custoDaRotina, descricaoDaRotina, terapiaPublica, DE_ESTUDOS, ROTINAS, atividadeExiste, modeloRotina, nivelDa, nivelModelo, type CategoriaAtividade, type ModeloRotina } from '../../motor/sistemas/rotinas';
import { estimuloCognitivo, estimuloFisico, palavraAprendizado, palavraCondicionamento } from '../../motor/sistemas/pessoa';
import { dose, encaixe, folegoDaSemana, semana, type FaixaDaSemana as Faixa, type Semana } from '../../motor/sistemas/semana';
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
import type { Aba } from '../navegacao';
import { MODS as MODS_ESPORTE } from '../../motor/sistemas/oportunidades';
import { custoDaExperiencia, escolhasDaExperiencia, experienciasPossiveis, nomeDaExperiencia, type TipoExperiencia } from '../../motor/sistemas/experiencias';
import { estadoDoArco } from '../../motor/sistemas/arcos';
import { VIVENCIA_DA_ROTINA } from '../../motor/sistemas/formacao';
import { EscolherViagem } from './Viagem';
import { RedesSociais } from './Redes';
import { leituraDaSobrecarga } from '../../motor/sistemas/sobrecarga';
import { SECOES_TEMPO, type SecaoTempo } from '../navegacao';
import { leituraDoEstresse } from '../../motor/sistemas/leituraDoEstresse';
import { BEM_ESTAR } from '../../motor/sistemas/estado';
import { idadePessoa, vinculosVivos } from '../../motor/nucleo';
import { Retrato } from '../avatar/Retrato';
import { rotuloDe } from '../apresentar';

const DE_TEMPO = new Set<string>(SECOES_TEMPO.map(x => x.id));

/** A história da atividade (a etapa e o papel), quando ela tem uma (`arcos`). */
const estadoDaAtividade = (vida: Vida, id: string) => { const viv = (vida.educacao.vivencias ?? []).find(x => x.tipo === VIVENCIA_DA_ROTINA[id] && x.tFim === undefined); const e = estadoDoArco(id, viv); return e ? `Agora: ${e}.` : undefined; };

const GRUPOS: { id: CategoriaAtividade; rotulo: string }[] = [
  { id: 'esporte', rotulo: 'Esporte' }, { id: 'arte', rotulo: 'Arte' }, { id: 'estudo', rotulo: 'Estudo' },
  { id: 'oficio', rotulo: 'Ofício' }, { id: 'social', rotulo: 'Gente e comunidade' }, { id: 'corpo', rotulo: 'Corpo' },
  { id: 'renda', rotulo: 'Dinheiro por fora' }, { id: 'cuidado', rotulo: 'Cuidado' }, { id: 'lazer', rotulo: 'Lazer' }
];

/** Para onde leva cada causa do estresse (a causa mora em outra área). */
const ORIGEM_CAUSA: Record<string, SecaoOuArea> = {
  trabalho: 'trabalho', horas_extras: 'trabalho', ritmo: 'trabalho', clima: 'trabalho', area: 'trabalho', negocio: 'trabalho', politica: 'trabalho', procura: 'trabalho',
  dividas: 'dinheiro', aperto: 'dinheiro', aperto_casa: 'dinheiro', reserva: 'dinheiro', casa_pequena: 'casa', carro_parado: 'pertences',
  bebe: 'pessoas', cuidar: 'pessoas', atrito: 'pessoas', segredo: 'pessoas', luto: 'pessoas', cuidando: 'trabalho',
  semana: 'semana', semana_fixa: 'semana', semana_apertada: 'semana'
};
type SecaoOuArea = Aba;

/**
 * O ESTRESSE, numa leitura só (FIX pós-REWORK 4): quanto (o número e a palavra), para onde vai, o que pesa, o que
 * ajuda, se ainda dá para assumir algo, o que acontece se continuar assim — e o que dá para fazer agora.
 */
function Estresse({ vida, agir, irPara }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void }) {
  const l = leituraDoEstresse(vida);
  const sob = leituraDaSobrecarga(vida);
  const fol = folegoDaSemana(vida);
  const i = idade(vida);
  const classe = l.nivel.replace(' ', '-');
  const ir = (id: string) => { const d = ORIGEM_CAUSA[id]; return d && d !== 'semana' && irPara ? d : undefined; };
  const temTerapia = vida.rotinas.some(r => r.id === 'terapia');
  return (
    <section className={`estresse estresse--${classe}`} aria-labelledby="titulo-estresse">
      <div className="estresse__topo">
        <h2 id="titulo-estresse" className="estresse__rotulo">Estresse</h2>
        <p className="estresse__leitura"><strong className="estresse__valor">{l.valor}%</strong> <span className="estresse__palavra">{l.nivel}</span>{l.tendencia !== 'estável' && <span className={`estresse__tendencia estresse__tendencia--${l.tendencia}`}>{l.tendencia === 'subindo' ? '↑ subindo' : '↓ baixando'}</span>}</p>
      </div>
      <div className="estresse__barra" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={l.valor} aria-label={`Estresse: ${l.valor}%, ${l.nivel}`}>
        <span className="estresse__cheio" style={{ width: `${Math.max(3, l.valor)}%` }} />
        <span className="estresse__marca" style={{ left: '35%' }} aria-hidden /><span className="estresse__marca" style={{ left: '55%' }} aria-hidden /><span className="estresse__marca" style={{ left: '75%' }} aria-hidden />
      </div>
      <p className="estresse__frase">{l.frase}</p>
      <div className="estresse__colunas">
        <div className="estresse__coluna estresse__coluna--pesa">
          <h3>O que está pesando</h3>
          {l.pesando.length ? (
            <ul>{l.pesando.map(c => { const d = ir(c.id); return <li key={c.id}><span className="estresse__causa">{c.texto}</span> <span className={`estresse__peso estresse__peso--${c.peso}`}>{c.peso}</span>{d && <button type="button" className="link estresse__ir" onClick={() => irPara!(d)}>ver →</button>}</li>; })}</ul>
          ) : <p className="nota">Nada pesando de verdade agora.</p>}
        </div>
        <div className="estresse__coluna estresse__coluna--ajuda">
          <h3>O que está ajudando</h3>
          {l.ajudando.length ? (
            <ul>{l.ajudando.map(c => <li key={c.id}><span className="estresse__causa">{c.texto}</span> <span className={`estresse__peso estresse__peso--alivio`}>{c.peso === 'forte' ? 'alivia muito' : 'alivia'}</span></li>)}</ul>
          ) : <p className="nota">Nada ajudando de propósito: uma atividade que alivia (corrida, terapia, leitura) faria diferença.</p>}
        </div>
      </div>
      {/* A "carga" (o quanto a semana já está tomada) é do motor: aqui ela é uma palavra e o porquê, não uma segunda barra. */}
      {/* FIX pós-playtest humano: a palavra e a frase vêm da MESMA conta que a lista de atividades (`folegoDaSemana`). */}
      <p className={`estresse__folego semana-carga semana-carga--${fol.faixa}`}><strong>Dá para assumir mais?</strong> <span className="semana-carga__palavra">{fol.palavra.charAt(0).toUpperCase() + fol.palavra.slice(1)}.</span> {l.folego}{fol.faixa !== 'folgada' && fol.faixa !== 'ocupada' && sob.causas.length ? ` O que mais ocupa: ${listaNatural(sob.causas.slice(0, 3))}.` : ''}{sob.anos >= 1 ? ` ${sob.texto.match(/(Há \d+ anos assim.*|Foi assim o ano passado inteiro\.)$/)?.[0] ?? ''}` : ''}</p>
      {l.riscos.length > 0 && <p className="estresse__riscos"><strong>Se continuar assim:</strong> {listaNatural(l.riscos)}.</p>}
      {i >= 14 && (l.nivel !== 'baixo' || l.tendencia === 'subindo') && (
        <div className="estresse__aliviar">
          <p className="estresse__sub">Para aliviar</p>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'descansar' }} agir={agir} variante="secundario" ocultarImpossivel>Tirar uns dias de descanso</BotaoAcao>
            {!temTerapia && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: 'terapia', ativa: true, nivel: 1 }} agir={agir} variante="secundario" ocultarImpossivel>Começar terapia</BotaoAcao>}
            {irPara && <button type="button" className="botao botao--discreto" onClick={() => irPara('corpo')}>Uma atividade que alivia</button>}
            {irPara && vida.trabalho.atual && <button type="button" className="botao botao--discreto" onClick={() => irPara('trabalho')}>Um ritmo mais leve no trabalho</button>}
            {irPara && i >= 16 && <button type="button" className="botao botao--discreto" onClick={() => irPara('viagens')}>Uma viagem</button>}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * O título da área: a MESMA leitura da semana que o painel do estresse usa (`sobrecarga`) — o título não pode dizer
 * "passou do que cabe" enquanto o painel diz "ainda cabe".
 */
function tituloDaSemana(v: Vida, s: Semana): string {
  const f = folegoDaSemana(v).faixa;
  if (f === 'alem') return 'A semana passou do teto: os compromissos já não cabem nos dias.';
  if (f === 'sobrecarregada') return leituraDaSobrecarga(v).nivel >= 3 ? 'No limite: a semana está cobrando o corpo e a cabeça.' : 'A semana passou do que cabe — o descanso sumiu e o cansaço aparece.';
  if (f === 'cheia') return 'A semana está cheia: o que entra agora sai do descanso.';
  if (f === 'ocupada') return s.livre >= 0.5 ? 'A semana está ocupada: sobra espaço para uma coisa leve.' : 'A semana está ocupada, sem apertar.';
  return s.livre >= 1.5 ? 'Sobra bastante tempo para escolher o que fazer.' : 'Sobra tempo para mais uma ou duas coisas.';
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

/** O que passa do confortável, dito como gente: o descanso que foi embora — ou o que já não cabe nos dias. */
const ALEM: Record<Faixa, string> = { folgada: '', ocupada: '', cheia: 'tirado do descanso', sobrecarregada: 'além do que cabe', alem: 'além do possível' };

function FaixaDaSemana({ vida, s }: { vida: Vida; s: Semana }) {
  const lista = pedacos(s);
  const total = lista.reduce((t, p) => t + p.peso, 0) || 1;
  const enc = encaixe(vida, 0);
  // A semana tem um tamanho (s.base): o que passa dele tem nome humano (descanso tirado / além do que cabe).
  const dentro = Math.min(total, s.base);
  const passa = dentro < total - 0.01 && ALEM[enc.faixa];
  const descricao = lista.map(p => `${p.rotulo}: ${p.tipo === 'livre' ? 'livre' : dose(p.peso)}`).join('; ');
  const fixos = s.fixos.filter(f => f.peso >= 0.25).map(f => { const x = f.rotulo.replace(/ \(.*\)$/, ''); return x.charAt(0).toLowerCase() + x.slice(1); });
  const i = idade(vida);
  // Não há agenda hora a hora no motor: a faixa é a proporção da semana, não um relógio.
  const fora = i < 18 && vida.educacao.basica ? 'fora as aulas e o sono' : 'fora o sono e o básico de todo dia';
  return (
    <figure className="semana" aria-label={`A semana: ${descricao}.`}>
      <p className="semana__fixos">{fixos.length ? `Antes de qualquer escolha, a semana já tem ${listaNatural(fixos)} (${fora}).` : `A semana é sua para escolher (${fora}).`}</p>
      <div className="semana__faixa" role="img" aria-label={`A semana: ${descricao}.${passa ? ` Parte disso é ${passa}.` : ''}`}>
        {lista.map(p => (
          <span key={p.id} className={`semana__pedaco semana__pedaco--${p.tipo}`} style={{ flexGrow: p.peso, flexBasis: 0 }} title={p.rotulo}>
            {p.peso / total >= 0.12 && <span className="semana__rotulo">{p.curto}</span>}
          </span>
        ))}
        {passa && <span className={`semana__alem-faixa semana__alem-faixa--${enc.faixa}`} style={{ left: `${(dentro / total) * 100}%` }} aria-hidden><span>{passa}</span></span>}
      </div>
      {passa && <p className={`semana__alem semana__alem--${enc.faixa}`}>{enc.faixa === 'cheia' ? 'Depois da linha: o que você faz com o tempo que seria de descanso. Dá para levar assim — o corpo sente.' : enc.faixa === 'sobrecarregada' ? 'Depois da linha: o que passa do que cabe numa semana. Dá para levar por um tempo; o estresse, o sono e o desempenho cobram.' : 'Depois da linha: o que já não cabe nos dias. Algo vai ter de sair.'}</p>}
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
  curso: { area: 'formacao', rotulo: 'Formação' }, integrado: { area: 'formacao', rotulo: 'Formação' },
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
  const passa = encaixe(vida, 0).folga < -0.01;
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
      {!d.veiculoId && d.modo !== 'a_pe' && irPara && <div className="trajeto__loja"><p className="nota">Um carro, uma moto ou uma bicicleta mudam isso.</p><button type="button" className="botao botao--discreto" onClick={() => irPara('compras')}>Ver as lojas, em Vida · Compras</button></div>}
    </section>
  );
}

/**
 * O que o dinheiro compra além de objetos: aparece conforme o que a vida tem
 * (não o catálogo inteiro). Cada categoria é uma PORTA: abrir mostra as
 * escolhas concretas desta vida (o destino e a duração, o curso, o projeto,
 * a pessoa e o presente), cada uma com o seu preço. A viagem vai em passos
 * (país → cidade → duração → resumo; região → destino → duração → resumo),
 * em EscolherViagem: nunca todas as combinações de uma vez.
 */
function Experiencias({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [aberta, setAberta] = useState<TipoExperiencia | null>(null);
  const lista = experienciasPossiveis(vida);
  if (!lista.length) return null;
  return (
    <section className="experiencias" aria-labelledby="titulo-experiencias">
      <h2 id="titulo-experiencias" className="secao-fio">Viagens e experiências</h2>
      <ul className="experiencias__lista">
        {lista.map(id => {
          const escolhas = escolhasDaExperiencia(vida, id);
          const porta = escolhas.length > 0;
          const viagem = id === 'viagem_pais' || id === 'viagem_exterior';
          // A restrição da porta inteira (foi há pouco, nem a mais barata cabe) é dita uma vez, aqui — não em cada escolha lá dentro.
          const d = disponibilidade(vida, { tipo: 'experiencia', id });
          const fechada = porta && !podeTentar(d) && !d.resgate;
          const grupos = [...new Set(escolhas.map(e => e.grupo ?? ''))];
          return (
            <li key={id} className={`experiencia experiencia--${GRAMATICA[id]}`}>
              {/* REWORK 4: cada tipo com a sua cara — o postal da viagem, o que o curso vira, o preço do sabático, quem recebe. */}
              <span className="experiencia__emblema" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d={EMBLEMA[GRAMATICA[id]]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
              {/* FIX pós-REWORK 4: menos texto — o nome, o que esta experiência muda (uma linha) e o preço como etiqueta. */}
              <span className="experiencia__texto"><strong>{nomeDaExperiencia(id)} <span className="experiencia__preco">{porta ? `a partir de ${dinheiroCurto(custoDaExperiencia(vida, id))}` : dinheiroCurto(custoDaExperiencia(vida, id))}</span></strong>
                <span className="experiencia__traco">{tracoDaExperiencia(vida, id)}</span>
                {fechada && d.motivo && <span className="acao__motivo">{d.motivo}</span>}</span>
              {porta && !fechada
                ? <button type="button" className="botao botao--discreto" aria-expanded={aberta === id} onClick={() => setAberta(a => (a === id ? null : id))}>{aberta === id ? 'Fechar' : id === 'bancar_projeto' ? 'Ver projetos' : id === 'presente_familia' ? 'Escolher' : id === 'curso_caro' ? 'Ver cursos' : 'Ver destinos'}</button>
                : !porta && <BotaoAcao vida={vida} acao={{ tipo: 'experiencia', id }} agir={agir} variante="discreto" ocultarImpossivel>Tirar</BotaoAcao>}
              {porta && !fechada && aberta === id && viagem && (
                <div className="experiencia__escolhas">
                  <EscolherViagem vida={vida} id={id} agir={agir} aoConcluir={() => setAberta(null)} />
                </div>
              )}
              {porta && !fechada && aberta === id && !viagem && (
                <div className="experiencia__escolhas">
                  {grupos.map(g => (
                    <div key={g} className="experiencia__grupo">
                      {g && grupos.length > 1 && <p className="experiencia__grupo-nome">{g.charAt(0).toUpperCase() + g.slice(1)}</p>}
                      <div className="grupo-acoes">
                        {escolhas.filter(e => (e.grupo ?? '') === g).map(e => (
                          <BotaoAcao key={e.id} vida={vida} acao={{ tipo: 'experiencia', id, escolha: e.id }} agir={agir} variante="discreto" ocultarImpossivel>
                            {`${g && grupos.length > 1 ? e.rotulo.replace(/^.*?(—|:) /, '') : e.rotulo} · ${dinheiroCurto(e.custo)}`}
                          </BotaoAcao>
                        ))}
                      </div>
                      {escolhas.filter(e => (e.grupo ?? '') === g && e.descricao).slice(0, 1).map(e => <p key={e.id} className="nota">{e.descricao}</p>)}
                    </div>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const GRAMATICA: Record<TipoExperiencia, string> = { viagem_pais: 'viagem', viagem_exterior: 'viagem', curso_caro: 'curso', sabatico: 'sabatico', bancar_projeto: 'projeto', presente_familia: 'presente' };
const EMBLEMA: Record<string, string> = {
  viagem: 'M2 16l20-8-6 12-4-5-5 3 1-5zM12 15l4-7',
  curso: 'M4 19V6l8-3 8 3v13l-8-3zM12 3v13',
  sabatico: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l4 2M4 4l3 3',
  projeto: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  presente: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0'
};
/** A linha que diz o que este TIPO de experiência é (não o preço de novo). */
function tracoDaExperiencia(v: Vida, id: TipoExperiencia): string {
  switch (id) {
    case 'viagem_pais': case 'viagem_exterior': return 'O destino, quantos dias e com quem: muda o descanso, o que acontece pelo caminho e quem volta mais perto.';
    case 'curso_caro': return 'Vira prática de verdade: a competência sobe e a atividade pode entrar na semana.';
    case 'sabatico': { const e = v.trabalho.atual; return `Três meses sem trabalho · descanso grande · ${e && e.clientela !== undefined ? 'parte da freguesia vai embora' : 'na volta, um tempo de readaptação'}.`; }
    case 'bancar_projeto': return 'O sonho de alguém (ou uma causa): o dinheiro vira história — com o seu nome no começo.';
    case 'presente_familia': return 'Os presentes grandes (a reforma, a entrada da casa, o estudo). Um violão ou um livro, você dá pela ficha da pessoa, em Pessoas.';
  }
}

/** As abas de atividades: que categorias (e que atividades avulsas) cada uma mostra. */
const DA_ABA: Record<'corpo' | 'atividades' | 'gente', { categorias: CategoriaAtividade[]; tambem?: string[]; fora?: string[] }> = {
  corpo: { categorias: ['esporte', 'corpo'], tambem: ['terapia'] },
  atividades: { categorias: ['arte', 'estudo', 'oficio', 'lazer', 'renda'], fora: ['sair_noite'] },
  gente: { categorias: ['social'], tambem: ['tempo_familia', 'sair_noite'] }
};
const naAba = (aba: keyof typeof DA_ABA, m: ModeloRotina) => {
  const x = DA_ABA[aba];
  if (x.fora?.includes(m.id)) return false;
  if (x.tambem?.includes(m.id)) return true;
  if (Object.values(DA_ABA).some(o => o !== x && o.tambem?.includes(m.id))) return false;
  return x.categorias.includes(m.categoria);
};

interface PropsTempo { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; aba?: SecaoTempo; irAba?: (a: SecaoTempo) => void; abrirPessoa?: (id: string) => void }

export function Tempo({ vida, agir, irPara, aba: abaDeFora, irAba, abrirPessoa }: PropsTempo) {
  const [abaLocal, setAbaLocal] = useState<SecaoTempo>('semana');
  const aba = abaDeFora ?? abaLocal;
  const trocar = (a: SecaoTempo) => { setAbaLocal(a); irAba?.(a); };
  const i = idade(vida);
  if (i < 3) return <div className="tempo"><Folio kicker={<><span className="folio__area">Tempo livre</span></>} titulo="O tempo é de quem cuida de você." /></div>;
  const s = semana(vida);
  const custo = economiaLocal(vida.moradia.municipioId).custo;
  const ativas = vida.rotinas.map(r => ({ r, m: modeloRotina(r.id) })).filter((x): x is { r: Vida['rotinas'][number]; m: ModeloRotina } => !!x.m);
  const frentes = frentesDaVida(vida);
  const pesaNaCabeca = fatoresCabeca(vida).some(f => (f.id === 'semana' || f.id === 'semana_fixa') && f.efeito > 0);
  const abas = SECOES_TEMPO.filter(x => (x.id !== 'redes' || i >= 10) && (x.id !== 'viagens' || i >= 12));
  const ir = (a: Aba) => (irPara ? irPara(a) : DE_TEMPO.has(a) ? trocar(a as SecaoTempo) : undefined);
  return (
    <div className={`tempo tempo--${aba}`}>
      <Folio kicker={<><span className="folio__area">Tempo livre</span> · {SECOES_TEMPO.find(x => x.id === aba)!.rotulo.toLowerCase()}</>} titulo={tituloDaSemana(vida, s)} lede={pesaNaCabeca ? 'Isso tem pesado na cabeça.' : undefined} />
      <nav className="subnav" aria-label="Seções de Tempo livre">
        <ul role="tablist" className="subnav__lista">
          {abas.map(x => (
            <li key={x.id} role="presentation">
              <button type="button" role="tab" id={`subnav-tempo-${x.id}`} aria-selected={aba === x.id} aria-controls={`tempo-${x.id}`} className={`subnav__item${aba === x.id ? ' subnav__item--ativo' : ''}`} onClick={() => trocar(x.id)} title={x.oque}>{x.rotulo}</button>
            </li>
          ))}
        </ul>
      </nav>
      <div role="tabpanel" id={`tempo-${aba}`} aria-labelledby={`subnav-tempo-${aba}`}>
        {aba === 'semana' && (
          <>
            <PortasAbertas vida={vida} agir={agir} filtro={o => areaDaPorta(o) === 'tempo'} titulo="Portas que a vida abriu" />
            <section className="tempo-semana" aria-labelledby="titulo-semana">
              <h2 id="titulo-semana" className="secao-fio">Sua semana</h2>
              {i >= 10 ? <Estresse vida={vida} agir={agir} irPara={ir} /> : <p className="nota">{i < 7 ? 'A semana é de brincar — e da escola.' : 'Além da escola, a semana é sua.'}</p>}
              <details className="semana-detalhe"><summary>Como a semana se divide (o que já vem ocupado)</summary><FaixaDaSemana vida={vida} s={s} /><ParaOndeVai vida={vida} s={s} irPara={irPara} /></details>
            </section>
            <AtividadesAtivas vida={vida} agir={agir} irPara={irPara} ativas={ativas} custo={custo} titulo="O que você já faz" vazio="Nada fixo na semana por enquanto. As abas acima mostram o que dá para começar." />
            <ComoVoceVai vida={vida} agir={agir} irPara={irPara} />
          </>
        )}
        {(aba === 'corpo' || aba === 'atividades' || aba === 'gente') && (
          <>
            {aba === 'gente' && <ComQuem vida={vida} abrirPessoa={abrirPessoa} />}
            {aba === 'corpo' && i >= 14 && <CuidarDeSi vida={vida} agir={agir} />}
            <AtividadesAtivas vida={vida} agir={agir} irPara={irPara} ativas={ativas.filter(x => naAba(aba, x.m))} custo={custo} titulo="O que você já faz aqui" vazio={aba === 'corpo' ? 'Nada de corpo na semana por enquanto.' : aba === 'gente' ? 'Nenhuma atividade com gente na semana por enquanto.' : 'Nenhum hobby na semana por enquanto.'} />
            <Comecar vida={vida} agir={agir} custo={custo} filtro={m => naAba(aba, m)} />
            {aba === 'atividades' && frentes.length > 0 && (
              <Secao titulo="O que você sabe fazer" recolhivel aberta={false}>
                <ul className="frentes">
                  {frentes.map(f => <li key={f.d}><strong>{f.nome.charAt(0).toUpperCase() + f.nome.slice(1)}</strong><span>{f.texto}</span></li>)}
                </ul>
              </Secao>
            )}
          </>
        )}
        {aba === 'redes' && <RedesSociais vida={vida} agir={agir} abrirPessoa={abrirPessoa} />}
        {aba === 'viagens' && <Experiencias vida={vida} agir={agir} />}
      </div>
    </div>
  );
}

/** O que você faz (a rotina), com o que cada coisa rende e os controles (mais a sério, mais leve, parar). */
function AtividadesAtivas({ vida, agir, irPara, ativas, custo, titulo, vazio }: { vida: Vida; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; ativas: { r: Vida['rotinas'][number]; m: ModeloRotina }[]; custo: number; titulo: string; vazio: string }) {
  const i = idade(vida);
  const peneira = ultimaDevolutiva(vida, 'peneira', 36);
  return (
    <Secao titulo={titulo}>
      {ativas.length === 0 && <Vazio>{vazio}</Vazio>}
      <ul className="lista-rotinas">
        {ativas.map(({ r, m }) => {
          const n = nivelDa(r);
          const nm = nivelModelo(m, n);
          const dominio = m.pratica ? (Object.keys(m.pratica)[0] as Dominio) : undefined;
          // O que a atividade faz de verdade: a técnica da frente que pratica, ou o atributo que desenvolve (a mesma leitura de Você).
          const leitura = dominio && vida.caminhos.frentes[dominio] && (m.pratica?.[dominio] ?? 0) >= 1 ? leituraDaFrente(vida, dominio) : efeitoNoCorpo(vida, r.id);
          const deEstudos = DE_ESTUDOS.has(r.id) || DE_FORMACAO.has(r.id);
          const anos = Math.floor((vida.t - r.tInicio) / 12);
          const renda = m.renda?.(vida, n);
          const retorno = peneira && peneira.dominio === dominio ? peneira : undefined;
          const alivio = alivioDa(r.id, n);
          return (
            <li key={r.id} className="rotina rotina--ativa">
              <div className="rotina__texto">
                <strong>{m.nome}</strong>
                <span>{m.niveis.length > 1 ? `${nm.rotulo} · ` : ''}{dose(nm.tempo)}{anos >= 1 ? ` · há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : ''}{custoDaRotina(vida, r.id, n) ? ` · ${dinheiroCurto(custoDaRotina(vida, r.id, n) * custo)}/mês` : r.id === 'terapia' && nm.custo ? ' · pelo SUS, de graça' : ''}{renda ? ` · rende uns ${dinheiroCurto(renda)}/mês` : ''}</span>
                {alivio && <span className={`rotina__estresse rotina__estresse--${alivio.tipo}`}>{alivio.texto}</span>}
                {leitura && <span className="rotina__leitura">{leitura}</span>}
                {estadoDaAtividade(vida, r.id) && <span className="rotina__leitura">{estadoDaAtividade(vida, r.id)}</span>}
                {retorno && <span className="rotina__retorno">Na última {dominio === 'futebol' ? 'peneira' : 'seletiva'}: {retorno.texto}</span>}
              </div>
              <div className="rotina__acoes">
                {deEstudos && irPara && <button type="button" className="link rotina__ir" onClick={() => irPara('formacao')}>ver em Formação →</button>}
                {dominio && MODS_ESPORTE.includes(dominio) && (retorno?.falta === 'tecnica' || (i >= 8 && i <= 18 && (m.pratica?.[dominio] ?? 0) >= 1)) && <BotaoAcao vida={vida} acao={{ tipo: 'perseguir', oque: 'treino_fundamentos', valor: dominio } as unknown as Acao} agir={agir} variante={retorno?.falta === 'tecnica' ? 'secundario' : 'discreto'} ocultarImpossivel>Um ano de fundamentos, com treinador</BotaoAcao>}
                {!deEstudos && n < m.niveis.length && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: true, nivel: (n + 1) as 2 | 3 }} agir={agir} variante="discreto" ocultarBloqueado>{`Mais a sério: ${nivelModelo(m, n + 1).rotulo.toLowerCase()}`}</BotaoAcao>}
                {!deEstudos && n > 1 && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: true, nivel: (n - 1) as 1 | 2 }} agir={agir} variante="discreto">Mais leve</BotaoAcao>}
                {!deEstudos && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: false }} agir={agir} variante="discreto">Parar</BotaoAcao>}
              </div>
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}

/** O que a atividade faz com o estresse (a mesma tabela do motor: `estado.BEM_ESTAR`). */
function alivioDa(id: string, nivel: number): { tipo: 'alivia' | 'pesa'; texto: string } | undefined {
  const b = BEM_ESTAR[id];
  const x = !b ? 0 : typeof b.cabeca === 'function' ? b.cabeca(nivel) : b.cabeca ?? 0;
  if (x <= -10) return { tipo: 'alivia', texto: 'alivia muito o estresse' };
  if (x < 0) return { tipo: 'alivia', texto: 'alivia o estresse' };
  if (x >= 8) return { tipo: 'pesa', texto: 'pesa no estresse' };
  return undefined;
}

/** Corpo e mente: cuidar de si (os cuidados que existem no motor: descanso, médico, largar um hábito). */
function CuidarDeSi({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  return (
    <Secao titulo="Cuidar de si">
      <div className="grupo-acoes grupo-acoes--linha">
        <BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'descansar' }} agir={agir} variante="secundario" ocultarImpossivel>Tirar uns dias de descanso</BotaoAcao>
        <BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'consulta' }} agir={agir} variante="discreto" ocultarImpossivel>Ir ao médico</BotaoAcao>
        <BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'parar_fumar' }} agir={agir} variante="discreto" ocultarImpossivel>Tentar parar de fumar</BotaoAcao>
        <BotaoAcao vida={vida} acao={{ tipo: 'cuidar', cuidado: 'beber_menos' }} agir={agir} variante="discreto" ocultarImpossivel>Tentar beber menos</BotaoAcao>
      </div>
    </Secao>
  );
}

/**
 * Sair e ver gente: com QUEM fazer algo (as pessoas de perto, com o que dá para fazer com cada uma, na ficha). O que
 * se faz junto mora na ficha da pessoa ("Fazer juntos"); aqui é o atalho para quem quer sair e não sabe com quem.
 */
function ComQuem({ vida, abrirPessoa }: { vida: Vida; abrirPessoa?: (id: string) => void }) {
  const gente = vinculosVivos(vida)
    .filter(x => !x.p.especie && x.p.nome && (x.vin.romance?.estagio !== 'ex') && (x.vin.convivio.includes('casa') || x.p.municipioId === vida.moradia.municipioId) && (x.vin.parentesco || x.vin.romance || x.vin.proximidade >= 40))
    .sort((a, b) => (b.vin.romance ? 30 : 0) + b.vin.proximidade - ((a.vin.romance ? 30 : 0) + a.vin.proximidade))
    .slice(0, 8);
  if (!gente.length || !abrirPessoa) return null;
  return (
    <Secao titulo="Com quem">
      <p className="nota">Sair, ir ao cinema, cozinhar, jogar, viajar junto: o que dá para fazer com cada pessoa está na ficha dela.</p>
      <ul className="com-quem">
        {gente.map(({ p, vin }) => (
          <li key={p.id}>
            <button type="button" className="com-quem__pessoa" onClick={() => abrirPessoa(p.id)}>
              <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={44} rotulo={p.nome} especie={p.especie} />
              <span className="com-quem__nome">{p.nome}</span>
              <span className="com-quem__papel">{rotuloDe(vida, p, vin)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Secao>
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
        <span>{motivo ? '' : `${descricaoDaRotina(vida, m)} `}{dose(n1.tempo)}{custoDaRotina(vida, m.id, 1) ? ` · ${dinheiroCurto(custoDaRotina(vida, m.id, 1) * custo)}/mês` : m.id === 'terapia' && terapiaPublica(vida) ? ` · ${redeDeSaude(vida).pelo} (com encaminhamento), de graça` : ' · de graça'}{renda ? ` · rende uns ${dinheiroCurto(renda)}/mês` : ''}</span>
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
function Comecar({ vida, agir, custo, filtro = () => true }: { vida: Vida; agir: (a: Acao) => boolean; custo: number; filtro?: (m: ModeloRotina) => boolean }) {
  const todas = atividadesParaVoce(vida);
  const para = todas.para.filter(x => filtro(x.item));
  const resto = todas.resto.filter(filtro);
  // Numa aba com pouca coisa, o catálogo já vem aberto (não há o que esconder).
  const [explorar, setExplorar] = useState(resto.length <= 8);
  const [verSemTempo, setVerSemTempo] = useState(false);
  const [verFora, setVerFora] = useState(false);
  // O cursinho mora em Estudos (é preparação, não tempo livre): aqui só aparece na semana.
  const outras = ROTINAS.filter(m => !DE_ESTUDOS.has(m.id) && !DE_FORMACAO.has(m.id) && !vida.rotinas.some(x => x.id === m.id) && atividadeExiste(vida, m) && filtro(m));
  const itens = outras.map(m => ({ m, d: disponibilidade(vida, { tipo: 'rotina', id: m.id, ativa: true, nivel: 1 }) }));
  const semTempo = itens.filter(x => !podeTentar(x.d) && x.d.grau === 'incompativel' && /semana/.test(x.d.motivo ?? ''));
  const fora = itens.filter(x => !podeTentar(x.d) && !semTempo.includes(x));
  // A mesma conta do painel "Dá para assumir mais?" (`folegoDaSemana`): a nota nunca diz o contrário da lista.
  const fol = folegoDaSemana(vida);
  const cheia = { cabe: fol.leve.faixa === 'folgada' || fol.leve.faixa === 'ocupada' };
  return (
    <Secao titulo="Para começar">
      {!cheia.cabe && <p className="nota">{fol.texto}</p>}
      {para.length > 0 && <ul className="lista-rotinas lista-rotinas--sugestoes">{para.map(x => linhaAtividade(vida, x.item, custo, agir, x.motivo))}</ul>}
      {para.length === 0 && cheia.cabe && <Vazio>Nada novo por aqui agora.</Vazio>}
      {resto.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={explorar} onClick={() => setExplorar(x => !x)}>{explorar ? 'Recolher' : `Explorar outras atividades (${resto.length})`}</button>
          {explorar && GRUPOS.filter(g => resto.some(m => m.categoria === g.id)).map((g, _k, grupos) => {
            const lista = resto.filter(m => m.categoria === g.id);
            return (
              <div key={g.id} className="grupo-atividades">
                {grupos.length > 1 && <h3 className="grupo-atividades__titulo">{g.rotulo}</h3>}
                <ul className="lista-rotinas">{lista.map(m => linhaAtividade(vida, m, custo, agir))}</ul>
              </div>
            );
          })}
        </div>
      )}
      {semTempo.length > 0 && (
        <div className="explorar">
          <button type="button" className="botao botao--discreto" aria-expanded={verSemTempo} onClick={() => setVerSemTempo(x => !x)}>{verSemTempo ? 'Esconder' : 'Ver'} o que não cabe nos dias agora ({semTempo.length})</button>
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

/**
 * O que uma atividade que não é técnica faz pela pessoa: academia e corrida
 * mexem no condicionamento; leitura e xadrez, no aprendizado. É a leitura de
 * Você (a mesma fonte), e diz também o que ela NÃO faz.
 */
function efeitoNoCorpo(vida: Vida, id: string): string {
  if (estimuloFisico(vida).fontes.some(f => f.id === id) && ['academia', 'corrida', 'bico'].includes(id)) {
    return `Condicionamento: ${palavraCondicionamento(vida.corpo.forma)}.${id === 'academia' ? ' Treina o corpo — não ensina um esporte.' : ''}`;
  }
  if (estimuloCognitivo(vida).fontes.some(f => f.id === id) && ['leitura', 'xadrez'].includes(id)) {
    return `Aprendizado: ${palavraAprendizado(vida.mente.cognicao)}. Sobe devagar, com os anos.`;
  }
  return '';
}
