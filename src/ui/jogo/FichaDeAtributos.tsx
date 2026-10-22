/**
 * REWORK 9.6 · ATR-01 — a FICHA DE ATRIBUTOS de Você: Saúde, Físico, Felicidade, Beleza e Inteligência numa ficha
 * compacta (uma linha cada: o nome, o valor de 0 a 100, a régua, a palavra, a mudança recente). Um toque abre o
 * atributo: o que representa, o valor, o que mudou, as causas REAIS (as listas que o motor soma no ano), o que pode
 * mexer nele, o que ele muda na vida e o histórico. Nada aqui é calculado de novo: tudo vem do motor.
 */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { ATRIBUTOS, predisposicao, valorDoAtributo, type Atributo } from '../../motor/sistemas/predisposicao';
import { leituraDoEstado } from '../../motor/sistemas/estado';
import { aparenciaBase, causasDoCondicionamento, fatoresAparencia, fatoresAprendizado, pisoDeForma } from '../../motor/sistemas/pessoa';
import { anoDe } from '../../motor/tempo';
import { BotaoAcao } from '../comum';
import { CONSEQUENCIAS, NOME_ATRIBUTO, O_QUE_E, O_QUE_MOVE, palavraDoAtributo } from '../atributos';
import { lerDimensao, trajetoria } from '../estadoPessoal';
import type { Aba } from '../navegacao';
import { Trajetoria } from './Voce';

const CAMPO: Record<Atributo, 'saude' | 'humor' | 'forma' | 'cognicao' | 'aparencia'> = { saude: 'saude', felicidade: 'humor', fisico: 'forma', inteligencia: 'cognicao', beleza: 'aparencia' };

/** A mudança MEDIDA nos últimos dois anos (os registros de aniversário), e desde quando. */
export function variacaoDoAtributo(v: Vida, a: Atributo): { dif: number; desde: number } | undefined {
  const campo = CAMPO[a];
  const h = (v.mente.historico ?? []).filter(x => typeof x[campo] === 'number' && x.t < v.t);
  const antes = h.filter(x => x.t <= v.t - 24).pop() ?? h[0];
  if (!antes) return undefined;
  return { dif: Math.round(valorDoAtributo(v, a) - (antes[campo] as number)), desde: antes.t };
}

/** As causas de agora, do motor: o que puxa para cima e o que puxa para baixo (os mesmos fatores do ano). */
export function causasDoAtributo(v: Vida, a: Atributo): { aFavor: string[]; contra: string[] } {
  if (a === 'saude' || a === 'felicidade') {
    const l = leituraDoEstado(v, a === 'saude' ? 'saude' : 'humor', 4);
    return { aFavor: l.ajudando.map(f => f.texto), contra: l.pesando.map(f => f.texto) };
  }
  if (a === 'fisico') { const c = causasDoCondicionamento(v); return { aFavor: c.aFavor.slice(0, 4), contra: c.contra.slice(0, 4) }; }
  const fs = a === 'beleza' ? fatoresAparencia(v) : fatoresAprendizado(v);
  return { aFavor: fs.filter(f => f.efeito > 0).sort((x, y) => y.efeito - x.efeito).map(f => f.texto), contra: fs.filter(f => f.efeito < 0).sort((x, y) => x.efeito - y.efeito).map(f => f.texto) };
}

/** A predisposição de cada atributo, em palavras (nunca o número interno). */
/**
 * REWORK 10.5 · BAL-03 — a média de quem tem a mesma idade (a marca na régua). A régua é de 0 a 100 para todas as
 * idades: um físico 37 aos 15 sem treino é o comum da idade, não "começar mal"; a marca diz isso (medida em
 * `scripts/sim/atributos105.ts`, uma população ao acaso, sem treino nem cuidado especial).
 */
export function mediaDaIdade(v: Vida, a: Atributo): number {
  const i = idade(v);
  if (a === 'saude') return i < 18 ? 89 : i < 40 ? 82 : i < 60 ? 74 : i < 75 ? 64 : 55;
  if (a === 'fisico') return Math.round(pisoDeForma(i) + (i >= 15 && i < 50 ? 6 : 0));
  if (a === 'felicidade') return i < 6 ? 69 : i < 18 ? 65 : 58;
  if (a === 'beleza') return i < 14 ? 56 : i < 45 ? 55 : 50;
  return i < 8 ? 56 : i < 18 ? 58 : 60;
}

export function predisposicaoEmPalavras(v: Vida, a: Atributo): string {
  const faixa = (x: number, forte: string, fraca: string, comum: string) => (x >= 0.3 ? forte : x <= -0.3 ? fraca : comum);
  if (a === 'saude') return faixa(predisposicao(v, 'saude'), 'uma constituição forte', 'uma constituição frágil', 'uma constituição comum');
  if (a === 'fisico') return faixa(predisposicao(v, 'fisica'), 'um corpo que responde rápido ao treino', 'um corpo que custa a responder ao treino', 'um corpo que responde como o da maioria');
  if (a === 'felicidade') return faixa(predisposicao(v, 'animo'), 'um temperamento que tende ao lado bom', 'um temperamento que tende ao lado pesado', 'um temperamento equilibrado');
  if (a === 'inteligencia') return faixa(predisposicao(v, 'cognitiva'), 'facilidade de aprender acima da média', 'aprender pede mais tempo que o comum', 'facilidade de aprender na média');
  return `traços de nascença: ${aparenciaBase(v) >= 66 ? 'que chamam atenção' : aparenciaBase(v) <= 40 ? 'discretos' : 'comuns'}`;
}

const IR: Partial<Record<Atributo, { rotulo: string; aba: Aba }>> = {
  fisico: { rotulo: 'Treinar, correr, um esporte — em Minha Semana', aba: 'corpo' },
  inteligencia: { rotulo: 'Ler, estudar, xadrez — em Minha Semana', aba: 'atividades' }
};

export function FichaDeAtributos({ vida, agir, irPara, abrirPessoa }: { vida: Vida; agir: (a: Acao) => boolean; irPara: (a: Aba) => void; abrirPessoa?: (id: string) => void }) {
  const i = idade(vida);
  return (
    <section id="voce-atributos" className="ficha-atributos" aria-labelledby="titulo-atributos">
      <header className="ficha-atributos__cabeca">
        <h2 id="titulo-atributos" className="ficha-atributos__titulo">Atributos</h2>
        <p className="ficha-atributos__nota">De 0 a 100. {i < 6 ? 'Na primeira infância, são predisposição e ponto de partida: o corpo e a cabeça de um bebê mudam depressa.' : 'O que a vida tem feito com cada um — toque para ver por quê.'}</p>
      </header>
      <ul className="ficha-atributos__lista">
        {ATRIBUTOS.map(a => <LinhaDoAtributo key={a} vida={vida} a={a} agir={agir} irPara={irPara} abrirPessoa={abrirPessoa} />)}
      </ul>
    </section>
  );
}

function LinhaDoAtributo({ vida, a, agir, irPara, abrirPessoa }: { vida: Vida; a: Atributo; agir: (a: Acao) => boolean; irPara: (a: Aba) => void; abrirPessoa?: (id: string) => void }) {
  const valor = Math.round(valorDoAtributo(vida, a));
  const palavra = palavraDoAtributo(vida, a);
  const varia = variacaoDoAtributo(vida, a);
  const limiar = a === 'inteligencia' ? 2 : 4;
  const tendencia = varia && varia.dif >= limiar ? 'sobe' : varia && varia.dif <= -limiar ? 'desce' : 'estavel';
  const causas = causasDoAtributo(vida, a);
  const cuidados = a === 'saude' || a === 'felicidade' ? lerDimensao(vida, a === 'saude' ? 'saude' : 'humor').cuidados : [];
  // Abre sozinho quando pede atenção (baixo, ou caindo na saúde e na felicidade): o resto fica no resumo.
  const atencao = (a === 'saude' || a === 'felicidade') && (valor < 40 || tendencia === 'desce');
  return (
    <li className={`atributo atributo--${a} atributo--${tendencia}`} data-atributo={a}>
      <details className="atributo__dobra" open={atencao}>
        <summary className="atributo__resumo">
          <span className="atributo__nome">{NOME_ATRIBUTO[a]}</span>
          <span className="atributo__valor" aria-label={`${NOME_ATRIBUTO[a]}: ${valor} de 100`}>{valor}</span>
          <span className="atributo__regua" aria-hidden><span style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} /><i className="atributo__media" style={{ left: `${mediaDaIdade(vida, a)}%` }} /></span>
          <span className="atributo__palavra">{palavra}</span>
          {varia && tendencia !== 'estavel' && <span className={`atributo__variacao atributo__variacao--${tendencia}`}>{varia.dif > 0 ? `+${varia.dif}` : `−${-varia.dif}`} desde {anoDe(varia.desde)}</span>}
        </summary>
        <div className="atributo__detalhe">
          <p className="atributo__oque">{O_QUE_E[a]}</p>
          <dl className="atributo__dados">
            <div><dt>Agora</dt><dd>{valor} — {palavra}</dd></div>
            <div><dt>Mudança recente</dt><dd>{varia ? (varia.dif === 0 ? `igual desde ${anoDe(varia.desde)}` : `${varia.dif > 0 ? `+${varia.dif}` : `−${-varia.dif}`} desde ${anoDe(varia.desde)}`) : 'ainda sem registro anterior'}</dd></div>
            <div><dt>De nascença</dt><dd>{predisposicaoEmPalavras(vida, a)}</dd></div>
            <div><dt>Na sua idade</dt><dd>a média é uns {mediaDaIdade(vida, a)} (a marca na régua){valor >= mediaDaIdade(vida, a) + 8 ? ' — você está acima' : valor <= mediaDaIdade(vida, a) - 8 ? ' — você está abaixo' : ' — você está na média'}</dd></div>
          </dl>
          {(causas.aFavor.length > 0 || causas.contra.length > 0) ? (
            <div className="atributo__causas">
              {causas.contra.length > 0 && <div><h3>Tem pesado</h3><ul>{causas.contra.map(t => <li key={t}>{t}</li>)}</ul></div>}
              {causas.aFavor.length > 0 && <div><h3>Tem ajudado</h3><ul>{causas.aFavor.map(t => <li key={t}>{t}</li>)}</ul></div>}
            </div>
          ) : <p className="atributo__texto">Nada puxando muito agora, para um lado ou para o outro.</p>}
          <p className="atributo__texto"><strong>O que mexe nele:</strong> {O_QUE_MOVE[a]}</p>
          <div className="atributo__consequencias"><h3>O que ele muda na vida</h3><ul>{CONSEQUENCIAS[a].map(t => <li key={t}>{t}</li>)}</ul></div>
          <Trajetoria pontos={trajetoria(vida, CAMPO[a])} nome={NOME_ATRIBUTO[a]} />
          {(cuidados.length > 0 || IR[a]) && (
            <div className="atributo__cuidar">
              {cuidados.map(s => s.acao
                ? <BotaoAcao key={s.id} vida={vida} acao={s.acao} agir={agir} variante="secundario" ocultarImpossivel>{s.texto}</BotaoAcao>
                : <button key={s.id} type="button" className="botao botao--discreto" onClick={() => (s.pessoaId ? abrirPessoa?.(s.pessoaId) : s.aba ? irPara(s.aba) : undefined)}>{s.texto} →</button>)}
              {IR[a] && <button type="button" className="link" onClick={() => irPara(IR[a]!.aba)}>{IR[a]!.rotulo} →</button>}
            </div>
          )}
          {a === 'beleza' && !IR[a] && cuidados.length === 0 && <a className="link" href="#voce-aparencia">Aparência e estilo, logo abaixo →</a>}
        </div>
      </details>
    </li>
  );
}
