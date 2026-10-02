/**
 * A iconografia das conquistas e do legado.
 *
 * Pequenos glifos vetoriais, monocromáticos (`currentColor`), do tamanho da
 * letra, que acompanham o texto — nunca o substituem, nunca viram selo
 * colorido, nunca emoji. A pergunta de cada um: o que essa linha É, antes
 * de ler? Um título de clube é taça; o pódio de uma prova individual é
 * pódio; a medalha é do país; a final perdida é a chave do torneio (não a
 * taça); o acesso sobe, o rebaixamento desce; o tenista tem ranking, o
 * lutador tem cinturão, o nadador e o velocista têm marca (cronômetro).
 *
 * O registro é por FAMÍLIA de trajetória: hoje o esporte; a arte, a
 * academia, a política e as outras entram como novas regras em `REGRAS`,
 * reaproveitando glifos (marco, prêmio) ou desenhando os seus.
 */
import type { ReactElement } from 'react';
import type { ConquistaEsportiva, Dominio } from '../motor/tipos';

export type Glifo =
  | 'taca' | 'premio' | 'medalha' | 'podio' | 'recorde' | 'bandeira' | 'bracadeira'
  | 'acesso' | 'queda' | 'final' | 'marco' | 'ranking' | 'cinturao';

/** O que o glifo diz, para leitor de tela e teste (o texto da linha continua sendo a informação). */
export const NOME_GLIFO: Record<Glifo, string> = {
  taca: 'título', premio: 'prêmio individual', medalha: 'medalha', podio: 'pódio', recorde: 'marca/recorde',
  bandeira: 'representação nacional', bracadeira: 'capitania', acesso: 'acesso', queda: 'rebaixamento',
  final: 'final', marco: 'marco', ranking: 'ranking', cinturao: 'título na luta'
};

/** Uma conquista qualquer, de qualquer família (o esporte usa `ConquistaEsportiva`). */
export interface ConquistaParaIcone { tipo: string; modalidade?: Dominio | string; texto?: string; papel?: string }
export type FamiliaDeConquista = 'esporte' | 'arte' | 'academia' | 'politica' | 'outra';

const INDIVIDUAL_DE_PROVA = new Set(['natacao', 'atletismo']);

/** Esporte: a regra respeita a trajetória (não é tudo taça; não é tudo futebol). */
function glifoDoEsporte(c: ConquistaParaIcone): Glifo {
  const t = (c.texto ?? '').toLowerCase();
  const m = c.modalidade;
  switch (c.tipo) {
    case 'titulo': return m === 'lutas' ? 'cinturao' : INDIVIDUAL_DE_PROVA.has(String(m)) ? 'podio' : 'taca';
    case 'acesso': return 'acesso';
    case 'rebaixamento': return 'queda';
    case 'final': return 'final';
    case 'premio': return /recorde/.test(t) ? 'recorde' : 'premio';
    case 'selecao':
      if (/^medalha/.test(t)) return 'medalha';
      if (/^campe/.test(t)) return INDIVIDUAL_DE_PROVA.has(String(m)) ? 'medalha' : 'taca';
      if (/capit/.test(t)) return 'bracadeira';
      return 'bandeira';
    case 'marco':
      if (/capit|braçadeira/.test(t)) return 'bracadeira';
      if (/ranking/.test(t)) return 'ranking';
      if (/recorde|melhor marca/.test(t)) return 'recorde';
      return 'marco';
    default: return 'marco';
  }
}

const REGRAS: Partial<Record<FamiliaDeConquista, (c: ConquistaParaIcone) => Glifo>> = {
  esporte: glifoDoEsporte
};

/** O glifo de uma conquista (ou nada, se a família ainda não tem iconografia). */
export function iconeDaConquista(c: ConquistaParaIcone, familia: FamiliaDeConquista = 'esporte'): Glifo | undefined {
  return REGRAS[familia]?.(c);
}

/** A conquista por trás de uma linha já escrita ("2041 · Campeão…" ou "Campeão… (2041)"). */
export function conquistaDaLinha(palmares: readonly ConquistaEsportiva[], linha: string): ConquistaEsportiva | undefined {
  return palmares.find(c => linha.startsWith(`${c.ano} · ${c.texto}`) || linha === `${c.texto} (${c.ano})`);
}

/* ------------------------------------------------------------- Desenhos */

const T = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const CHEIO = { fill: 'currentColor', fillOpacity: 0.28 };

/** viewBox 16×16; traço do tamanho da letra. */
const DESENHO: Record<Glifo, () => ReactElement> = {
  // Taça de clube: copa com alças, haste e base.
  taca: () => <><path d="M5 2.5h6v3.4a3 3 0 0 1-6 0Z" {...T} {...CHEIO} /><path d="M5 3.6H3.4c0 1.8.7 2.8 1.9 3M11 3.6h1.6c0 1.8-.7 2.8-1.9 3M8 8.9v2.3M5.4 13.5h5.2M6.4 11.2h3.2l.4 2.3H6Z" {...T} /></>,
  // Prêmio individual: estrela entre dois ramos.
  premio: () => <><path d="M8 1.8l1.2 2.5 2.7.3-2 1.8.6 2.6L8 7.7 5.5 9l.6-2.6-2-1.8 2.7-.3Z" {...T} {...CHEIO} strokeWidth={1.1} /><path d="M2.6 7.2c.2 3.4 2.2 5.8 5 6.6M13.4 7.2c-.2 3.4-2.2 5.8-5 6.6" {...T} strokeWidth={1.1} /><path d="M2.9 9.6l1.4-.7M4.6 12.2l.9-1.2M13.1 9.6l-1.4-.7M11.4 12.2l-.9-1.2" {...T} strokeWidth={1} /></>,
  // Medalha: fita em V e o disco.
  medalha: () => <><path d="M5.2 1.8 7.4 6.6M10.8 1.8 8.6 6.6" {...T} /><circle cx={8} cy={10.2} r={3.6} {...T} {...CHEIO} /><circle cx={8} cy={10.2} r={1.5} {...T} strokeWidth={1} /></>,
  // Pódio: três degraus, o do meio mais alto (a prova vencida).
  podio: () => <><path d="M5.6 14V6.4h4.8V14Z" {...T} {...CHEIO} /><path d="M1.6 14V9.4h4M14.4 14v-3h-4M1.2 14h13.6M8 4.6V2.6" {...T} /></>,
  // Marca/recorde: o cronômetro.
  recorde: () => <><circle cx={8} cy={9.2} r={4.9} {...T} /><path d="M8 9.2 10.2 7M8 2.4v1.9M6.4 2.4h3.2M12.4 4.4l.9-.9" {...T} /><circle cx={8} cy={9.2} r={0.9} fill="currentColor" /></>,
  // Representação nacional: a bandeira no mastro.
  bandeira: () => <><path d="M3.4 14.2V1.8" {...T} /><path d="M3.4 2.4h8.8l-1.9 2.9 1.9 2.9H3.4" {...T} {...CHEIO} /></>,
  // Capitania: a braçadeira com o C.
  bracadeira: () => <><rect x={2.4} y={4.6} width={11.2} height={6.8} rx={1.6} {...T} {...CHEIO} /><path d="M9.6 6.7a1.9 1.9 0 1 0 0 2.6" {...T} strokeWidth={1.2} /></>,
  // Acesso: sobe.
  acesso: () => <path d="M3.6 8.6 8 4.2l4.4 4.4M3.6 12.8 8 8.4l4.4 4.4" {...T} />,
  // Rebaixamento: desce (mais apagado).
  queda: () => <path d="M3.6 3.4 8 7.8l4.4-4.4M3.6 7.6 8 12l4.4-4.4" {...T} opacity={0.75} />,
  // Final: a chave do torneio que chega ao último jogo — e a taça só em contorno.
  final: () => <><path d="M1.6 3.6h3.6v8.8H1.6M5.2 8h3.4" {...T} /><path d="M9.6 5.4h4.2v2.2a2.1 2.1 0 0 1-4.2 0ZM11.7 9.7v1.6M10.4 12.4h2.6" {...T} strokeWidth={1.1} /></>,
  // Marco: o losango sobre a linha do tempo.
  marco: () => <><path d="M1.4 8h3M11.6 8h3" {...T} /><path d="M8 4.4 11.6 8 8 11.6 4.4 8Z" {...T} {...CHEIO} /></>,
  // Ranking: barras subindo, a última marcada.
  ranking: () => <><path d="M2.6 13.6v-2.4M6 13.6V9M9.4 13.6V6.4" {...T} /><path d="M12.8 13.6V3.4" {...T} strokeWidth={2.2} /><path d="M1.6 13.6h12.8" {...T} strokeWidth={0.9} /></>,
  // Título na luta: o cinturão, com a placa no meio.
  cinturao: () => <><path d="M1.4 6.4c2 .8 3.4 .8 4.4 .6M14.6 6.4c-2 .8-3.4 .8-4.4 .6M1.4 9.6c2 .8 3.4 .8 4.4.6M14.6 9.6c-2 .8-3.4.8-4.4.6" {...T} /><rect x={5.4} y={4.4} width={5.2} height={7.2} rx={2} {...T} {...CHEIO} /><circle cx={8} cy={8} r={1.1} fill="currentColor" /></>
};

/** O glifo, do tamanho da letra; decorativo (o texto ao lado é a informação). */
export function GlifoConquista({ glifo, className }: { glifo: Glifo; className?: string }) {
  const D = DESENHO[glifo];
  return (
    <svg className={`glifo-conquista glifo-conquista--${glifo}${className ? ` ${className}` : ''}`} viewBox="0 0 16 16" width="1em" height="1em" aria-hidden focusable="false" data-glifo={glifo}>
      <D />
    </svg>
  );
}

/** O glifo da conquista por trás de uma linha do palmarés (nada, se a linha não tem conquista conhecida). */
export function GlifoDaLinha({ palmares, linha, familia = 'esporte', padrao }: { palmares: readonly ConquistaEsportiva[]; linha: string; familia?: FamiliaDeConquista; padrao?: Glifo }) {
  const c = conquistaDaLinha(palmares, linha);
  const g = c ? iconeDaConquista(c, familia) : padrao;
  return g ? <GlifoConquista glifo={g} /> : null;
}

export const GLIFOS = Object.keys(DESENHO) as Glifo[];

/** Uma célula do histórico esportivo: o "(RP)" (recorde pessoal) vira a marca do cronômetro, com o nome por extenso para quem lê. */
export function celulaDoHistorico(x: string) {
  if (!x.endsWith(' (RP)')) return x;
  return <>{x.slice(0, -5)} <span className="glifo-conquista__rotulo" title="recorde pessoal"><GlifoConquista glifo="recorde" /><span className="sr-only">recorde pessoal</span></span></>;
}
