/**
 * ERAS HISTÓRICAS · "Quando e onde você nasce" — a primeira escolha da tela Nascer.
 *
 * ERAS v3: primeiro o lugar (hoje, o mundo todo; ou um dos países com época), depois a década (de 1900 a 2020; a
 * Argentina desde 1945), o ano, o mês e o dia. A prévia diz em poucas linhas o país e o tempo — o contexto, a
 * sociedade, a tecnologia, a cultura, o dinheiro — e o que a infância vai atravessar. Sem enciclopédia: o resto se vive.
 */
import { DECADAS } from '../../motor/eras/dados/culturaBR';
import { ACONTECIMENTOS_BR, type AcontecimentoBR } from '../../motor/eras/dados/acontecimentosBR';
import { pacoteDaEra, type DecadaDaEpoca } from '../../motor/eras/base/pacote';
import { PAISES_COM_ERA, eraImperialEm } from '../../motor/eras/base/contexto';
import { MESES } from '../../motor/tempo';
import { ObjetosDaEpoca } from './Aparelhos';
import './eras.css';

/** 'hoje' ou o país e a década escolhidos. */
export type Epoca = 'hoje' | { pais: string; decada: number };

const ANO_HOJE = 2026;
/** Os países, na ordem da escolha (o Brasil primeiro). */
export const PAISES_DA_ESCOLHA: readonly { id: string; nome: string }[] = [
  { id: 'BR', nome: 'Brasil' }, { id: 'US', nome: 'Estados Unidos' }, { id: 'GB', nome: 'Reino Unido' },
  { id: 'DE', nome: 'Alemanha' }, { id: 'JP', nome: 'Japão' }, { id: 'AR', nome: 'Argentina' }
];

const diasNoMes = (ano: number, mes: number) => new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();

/** As décadas do país (com o primeiro e o último ano possíveis de cada uma). */
export function decadasDoPais(pais: string): { decada: number; anos: [number, number] }[] {
  const desde = PAISES_COM_ERA[pais] ?? 1970;
  const out: { decada: number; anos: [number, number] }[] = [];
  for (let d = Math.floor(desde / 10) * 10; d <= 2020; d += 10) out.push({ decada: d, anos: [Math.max(desde, d), Math.min(2025, d + 9)] });
  return out;
}

export function anosDaDecada(pais: string, d: number): number[] {
  const x = decadasDoPais(pais).find(y => y.decada === d);
  if (!x) return [];
  const out: number[] = [];
  for (let a = x.anos[0]; a <= x.anos[1]; a++) out.push(a);
  return out;
}

/** A década do país em texto (o Brasil pelos dados da v1/v2/v3; os outros pelos pacotes). */
export function decadaDoPais(pais: string, decada: number): DecadaDaEpoca | undefined {
  if (pais === 'BR') {
    const d = DECADAS.find(x => x.decada === decada);
    return d ? { decada: d.decada, rotulo: d.rotulo, contexto: d.contexto, sociedade: d.sociedade ?? '', tecnologia: d.tecnologia, cultura: d.cultura, dinheiro: d.moedas, marcos: d.marcos } : undefined;
  }
  return pacoteDaEra(pais)?.decadas.find(x => x.decada === decada);
}

interface Marco { id: string; ano: number; titulo: string }

/**
 * O que a infância de quem nasce em `ano` atravessa: os marcos da década que vêm depois do nascimento e, quando eles já
 * passaram (quem nasce no fim da década), os acontecimentos nacionais dos anos seguintes — nunca um fato de antes de nascer.
 */
export function marcosDaInfancia(marcos: readonly string[], ano: number, pais = 'BR'): Marco[] {
  const lista: { id: string; data: readonly (number | undefined)[]; titulo: string; peso?: string; nacional: boolean }[] = pais === 'BR'
    ? (ACONTECIMENTOS_BR as readonly AcontecimentoBR[]).map(a => ({ id: a.id, data: a.data, titulo: a.titulo, peso: a.peso, nacional: !a.ufs }))
    : (pacoteDaEra(pais)?.acontecimentos ?? []).map(a => ({ id: a.id, data: a.data, titulo: a.titulo, peso: a.peso, nacional: !a.divisoes && !a.lado }));
  const daDecada = marcos.map(id => lista.find(a => a.id === id)).filter((a): a is (typeof lista)[number] => !!a && a.data[0]! >= ano);
  const escolhidos = daDecada.length >= 3 ? daDecada.slice(0, 4)
    : [...daDecada, ...lista.filter(a => a.nacional && a.peso === 'biografia' && a.data[0]! >= ano && a.data[0]! <= ano + 14 && !daDecada.includes(a))]
      .sort((a, b) => a.data[0]! - b.data[0]! || a.data[1]! - b.data[1]!).slice(0, 4);
  return escolhidos.map(a => ({ id: a.id, ano: a.data[0]!, titulo: a.titulo }));
}

/** A década visual (o tom e os objetos da prévia). */
const decadaVisual = (d: number) => Math.max(1900, Math.min(2020, d));

export function EscolhaDaEpoca({ epoca, ano, mes, dia, aoMudar, aoMudarData }: {
  epoca: Epoca; ano: number; mes?: number; dia?: number;
  aoMudar: (e: Epoca, ano: number) => void;
  aoMudarData?: (mes: number | undefined, dia: number | undefined) => void;
}) {
  const pais = epoca === 'hoje' ? undefined : epoca.pais;
  const decadas = pais ? decadasDoPais(pais) : [];
  const d = epoca === 'hoje' ? undefined : decadaDoPais(epoca.pais, epoca.decada);
  const escolherPais = (p: string) => {
    if (pais === p) return;
    const dec = epoca !== 'hoje' && decadasDoPais(p).some(x => x.decada === epoca.decada) ? epoca.decada : 1950;
    const anos = anosDaDecada(p, dec);
    aoMudar({ pais: p, decada: dec }, anos.includes(ano) ? ano : anos[Math.min(4, anos.length - 1)]);
  };
  const nomePais = PAISES_DA_ESCOLHA.find(x => x.id === pais)?.nome;
  const imperial = pais === 'JP' ? eraImperialEm(ano, mes ?? 5, dia ?? 15) : undefined;
  const dias = mes !== undefined ? diasNoMes(ano, mes) : 31;
  return (
    <fieldset className="campo epoca" data-era={epoca === 'hoje' ? 'hoje' : decadaVisual(epoca.decada)}>
      <legend className="campo__rotulo">Quando e onde você nasce</legend>
      <div className="epoca__portas epoca__portas--paises" role="radiogroup" aria-label="Lugar do nascimento">
        <button type="button" role="radio" aria-checked={epoca === 'hoje'} className="epoca__porta" data-era="hoje" onClick={() => aoMudar('hoje', ANO_HOJE)}>
          <strong>Hoje</strong><span>{ANO_HOJE} · o mundo todo</span>
        </button>
        {PAISES_DA_ESCOLHA.map(p => (
          <button key={p.id} type="button" role="radio" aria-checked={pais === p.id} className="epoca__porta" data-pais={p.id} onClick={() => escolherPais(p.id)}>
            <strong>{p.nome}</strong><span>desde {PAISES_COM_ERA[p.id]}</span>
          </button>
        ))}
      </div>
      {epoca === 'hoje' || !pais ? (
        <p className="nota">O VIDA de sempre: a vida começa agora, em qualquer país do mundo, com o celular, as redes e os preços de hoje.</p>
      ) : (
        <div className="epoca__previa">
          <div className="epoca__decadas" role="radiogroup" aria-label="Década do nascimento">
            {decadas.map(x => (
              <button key={x.decada} type="button" role="radio" aria-checked={epoca.decada === x.decada} className="chip epoca__decada" data-era={decadaVisual(x.decada)}
                onClick={() => { const anos = anosDaDecada(pais, x.decada); aoMudar({ pais, decada: x.decada }, epoca.decada === x.decada ? ano : anos[Math.min(4, anos.length - 1)]); }}>
                {x.decada}
              </button>
            ))}
          </div>
          <div className="epoca__anos" role="radiogroup" aria-label="Ano de nascimento">
            {anosDaDecada(pais, epoca.decada).map(a => (
              <button key={a} type="button" role="radio" aria-checked={a === ano} className="chip epoca__ano" onClick={() => aoMudar(epoca, a)}>{a}</button>
            ))}
          </div>
          {aoMudarData && (
            <div className="epoca__data">
              <label className="epoca__campo">
                <span>Mês</span>
                <select value={mes ?? ''} onChange={e => { const m = e.target.value === '' ? undefined : Number(e.target.value); aoMudarData(m, m === undefined || dia === undefined ? undefined : Math.min(dia, diasNoMes(ano, m))); }}>
                  <option value="">ao acaso</option>
                  {MESES.map((nome, i) => <option key={nome} value={i}>{nome}</option>)}
                </select>
              </label>
              <label className="epoca__campo">
                <span>Dia</span>
                <select value={dia ?? ''} disabled={mes === undefined} onChange={e => aoMudarData(mes, e.target.value === '' ? undefined : Number(e.target.value))}>
                  <option value="">—</option>
                  {Array.from({ length: dias }, (_, i) => i + 1).map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
              <p className="epoca__data-texto">
                {mes !== undefined ? `${dia ? `${dia} de ` : ''}${MESES[mes]} de ${ano}` : `Em ${ano}, num mês ao acaso`}
                {imperial ? ` · ano ${imperial.ano} da era ${imperial.nome}` : ''}
              </p>
            </div>
          )}
          {d && (
            <div className="epoca__jornal">
              <div className="epoca__objetos" aria-hidden><ObjetosDaEpoca decada={decadaVisual(epoca.decada) as 1980} tamanho={58} /></div>
              <div className="epoca__texto">
                <p className="epoca__manchete">{nomePais} · {d.contexto}</p>
                <dl className="epoca__fichas">
                  {d.sociedade && <div><dt>Sociedade</dt><dd>{d.sociedade}</dd></div>}
                  <div><dt>Tecnologia</dt><dd>{d.tecnologia}</dd></div>
                  <div><dt>Cultura</dt><dd>{d.cultura}</dd></div>
                  <div><dt>Dinheiro</dt><dd>{d.dinheiro}</dd></div>
                </dl>
              </div>
            </div>
          )}
          <p className="epoca__rotulo">O que a sua infância atravessa</p>
          <ul className="epoca__marcos">
            {marcosDaInfancia(d?.marcos ?? [], ano, pais).map(a => (
              <li key={a.id}><span className="epoca__marco-ano">{a.ano}</span>{a.titulo}</li>
            ))}
            <li><span className="epoca__marco-ano">→</span>E depois, as décadas seguintes, até hoje e além: a vida não fica presa ao ano em que começou.</li>
          </ul>
          <p className="nota">Os preços aparecem na moeda de cada momento; a tecnologia, as lojas, as profissões, as leis e os acontecimentos acompanham o calendário e o país — e a cidade (capital ou interior, de um lado ou de outro de uma fronteira) muda o que chega até você.</p>
        </div>
      )}
    </fieldset>
  );
}
