/**
 * A Linha da Vida: a biografia, não um log.
 *
 * O ano mais recente fica no alto (é o que o jogador acabou de viver); um
 * botão inverte para ler do começo, como um livro. Marcos têm peso visual
 * (e o tema, para quem passa o olho); o cotidiano aparece discreto; o técnico
 * (rotina de dinheiro) nem aparece. Anos sem nada não viram linhas vazias:
 * viram silêncio.
 *
 * REWORK 6: cada ano é um bloco com a idade grande na margem (a régua da vida),
 * o ano que acabou de passar ganha o destaque de "este ano", e uma vida longa
 * abre em partes — os últimos anos primeiro, o resto a um toque — para que
 * 80 anos de biografia não pesem a cada aniversário.
 *
 * REWORK 6.5: cada acontecimento segue a mesma ordem de leitura — a idade/o ano na margem → o tipo (o tema do marco,
 * "sua escolha") numa linha própria → a narrativa. Nada se sobrepõe: a margem é medida em rem e só leva o número (o
 * nascimento é "0 · ao nascer"; a palavra "Nascimento" em 2rem não cabia na margem e se deitava sobre o tema do
 * marco), e o tema não repete o que a margem já diz (o marco do nascimento no ano 0).
 *
 * REWORK 7.5: um ano se lê em FIOS (`apresentar.fiosDoAno`): o que é da mesma história fica junto, com um fio fino na
 * margem (as mesmas pessoas; a consequência e a sua origem); o que é independente ganha distância e um fio de
 * separação. Cada acontecimento diz a sua natureza — sua escolha, por causa de uma escolha, mudança de rumo, marco —
 * e o que aconteceu sozinho não leva rótulo (é a vida acontecendo). O cotidiano solto vira uma linha de miudezas.
 */

import { useMemo, useState } from 'react';
import type { Entrada, Vida } from '../../motor/tipos';
import { idadePessoa } from '../../motor/nucleo';
import { anosDaBiografia, faseDaVida, fiosDoAno, naturezaDe, TEMA_ROTULO } from '../apresentar';
import { Retrato } from '../avatar/Retrato';
import { anoDe } from '../../motor/tempo';
import { leituraDoPalmares } from '../../motor/sistemas/palmares';

/**
 * REWORK 9 — ver a história por um fio: os estudos, o trabalho, as pessoas, os lugares e a saúde (o tema que o motor
 * deu a cada acontecimento — nada reclassificado) e as CONQUISTAS (os marcos que a vida registrou: formatura,
 * aprovação, promoção, título — a semente da sala de troféus, só com o que aconteceu).
 */
export type FioDaHistoria = 'tudo' | 'estudos' | 'trabalho' | 'pessoas' | 'lugares' | 'saude' | 'conquistas';
const TEMAS_DO_FIO: Record<Exclude<FioDaHistoria, 'tudo' | 'conquistas'>, Entrada['tema'][]> = {
  estudos: ['escola', 'estudo'], trabalho: ['trabalho', 'dinheiro'], pessoas: ['amor', 'familia', 'filhos', 'amizade', 'perda', 'morte', 'nascimento'],
  lugares: ['lugar', 'casa', 'lazer'], saude: ['saude']
};
const ROTULO_DO_FIO: Record<FioDaHistoria, string> = { tudo: 'Tudo', estudos: 'Estudos', trabalho: 'Trabalho', pessoas: 'Pessoas', lugares: 'Lugares e lazer', saude: 'Saúde', conquistas: 'Conquistas' };
const MARCAS_DE_CONQUISTA = new Set(['conquista', 'aprovacao', 'formacao', 'promocao', 'profissional', 'estreia', 'eleicao', 'lideranca', 'ingresso', 'primeiro_emprego', 'negocio_aberto']);

/** Quantos anos aparecem de cada vez (o resto abre a pedido). */
export const ANOS_POR_VEZ = 12;

/**
 * REWORK 10 · UX-13: `compacta` — a Linha da Vida no "Agora" da História: só os últimos anos (os que marcaram), sem os
 * controles de leitura, e o caminho para a biografia inteira (a parte "Biografia"). A biografia completa é a mesma peça.
 */
export function LinhaDaVida({ vida, marca, abrirPessoa, compacta }: { vida: Vida; marca: number; abrirPessoa?: (id: string) => void; compacta?: { anos: number; aoVerTudo: () => void } }) {
  const [doComeco, setDoComeco] = useState(false);
  const [discreto, setDiscreto] = useState(true);
  const [limite, setLimite] = useState(compacta?.anos ?? ANOS_POR_VEZ);
  const [fio, setFio] = useState<FioDaHistoria>('tudo');
  const anos = useMemo(() => {
    const todos = anosDaBiografia(vida, discreto);
    if (fio === 'tudo' || fio === 'conquistas') return todos;
    const temas = new Set(TEMAS_DO_FIO[fio]);
    return todos.map(a => ({ ...a, entradas: a.entradas.filter(e => temas.has(e.tema)) })).filter(a => a.entradas.length);
  }, [vida, discreto, fio]);
  const idNovas = useMemo(() => new Set(vida.biografia.slice(marca).map(e => e.id)), [vida, marca]);
  const porId = useMemo(() => new Map(vida.biografia.map(e => [e.id, e])), [vida]);
  const ordem = doComeco ? anos : [...anos].reverse();
  const visiveis = ordem.slice(0, limite);
  const faltam = ordem.length - visiveis.length;
  // REWORK 7: o rosto de quem estava na história vale para as primeiras histórias de gente na ordem de leitura; as de
  // mais longe levam o nome (o mesmo toque). Cada retrato custa ~1,4 ms para desenhar (medido com `desempenho7.mjs`): dezenas a cada abertura somavam ~15 ms.
  const comRosto = useMemo(() => new Set(visiveis.flatMap(a => a.entradas).filter(e => e.relevancia !== 'cotidiano' && DE_GENTE.has(e.tema) && e.pessoas?.length).slice(0, ROSTOS_NA_PAGINA).map(e => e.id)), [visiveis]);

  return (
    <div className={`linha-da-vida${compacta ? ' linha-da-vida--compacta' : ''}`}>
      {!compacta && <>
      <div className="linha-da-vida__controles" role="group" aria-label="Como ler a biografia">
        <button type="button" className="chip" aria-pressed={doComeco} onClick={() => { setDoComeco(d => !d); setLimite(ANOS_POR_VEZ); }}>
          {doComeco ? 'Mais recente primeiro' : 'Ler do começo'}
        </button>
        <button type="button" className="chip" aria-pressed={!discreto} onClick={() => setDiscreto(d => !d)}>
          {discreto ? 'Só o que marcou' : 'Mostrar tudo'}
        </button>
      </div>
      <div className="linha-da-vida__fios" role="group" aria-label="Ver a história por um fio">
        {(Object.keys(ROTULO_DO_FIO) as FioDaHistoria[]).map(f => <button key={f} type="button" className="chip" aria-pressed={fio === f} onClick={() => { setFio(f); setLimite(ANOS_POR_VEZ); }}>{ROTULO_DO_FIO[f]}</button>)}
      </div>
      </>}
      {fio === 'conquistas' && <Conquistas vida={vida} />}
      <ol className={`anos${fio === 'conquistas' ? ' anos--oculto' : ''}`}>
        {visiveis.map((a, k) => {
          const anterior = visiveis[k - 1];
          const salto = anterior ? Math.abs(anterior.idade - a.idade) : 1;
          const fase = faseDaVida(a.idade);
          const novoCapitulo = !anterior || faseDaVida(anterior.idade) !== fase;
          const novo = marca > 0 && a.entradas.some(e => idNovas.has(e.id));
          return (
            <li key={a.idade} className={`ano${novo ? ' ano--novo' : ''}`}>
              {novoCapitulo && <p className="ano__capitulo">{fase}</p>}
              {!novoCapitulo && salto > 2 && <p className="ano__silencio" aria-hidden>· · ·</p>}
              <div className="ano__corpo">
                <h3 className="ano__cabeca">
                  <span className="ano__idade">{a.idade}<span className="ano__unidade"> {a.idade === 0 ? 'ao nascer' : a.idade === 1 ? 'ano' : 'anos'}</span></span>
                  <span className="ano__calendario">{a.ano}</span>
                  {novo && <span className="ano__selo">este ano</span>}
                </h3>
                <ul className="entradas">
                  {fiosDoAno(a.entradas).map((f, _k, todos) => (
                    <li key={f.id} className={`fio${f.entradas.length > 1 ? ' fio--junto' : ''}${f.miudo ? ' fio--miudo' : ''} fio--peso-${f.peso} fio--tema-${f.entradas[0].tema}`}>
                      {f.miudo && todos.length > 1 && <p className="fio__miudo">E também, naquele ano</p>}
                      <ul className="fio__entradas">
                        {f.entradas.map(e => <ItemBiografia key={e.id} e={e} nova={idNovas.has(e.id)} idade={a.idade} vida={vida} abrirPessoa={abrirPessoa} rosto={comRosto.has(e.id)} origem={e.segue ? porId.get(e.segue) : undefined} junto={f.entradas.length > 1} />)}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
      {compacta && faltam > 0 && (
        <button type="button" className="botao botao--secundario linha-da-vida__mais" onClick={compacta.aoVerTudo}>
          Ler a biografia inteira <span className="linha-da-vida__faltam">({ordem.length} {ordem.length === 1 ? 'ano' : 'anos'} com história)</span>
        </button>
      )}
      {!compacta && faltam > 0 && fio !== 'conquistas' && (
        <button type="button" className="botao botao--secundario linha-da-vida__mais" onClick={() => setLimite(l => l + ANOS_POR_VEZ)}>
          {doComeco ? 'Continuar lendo' : 'Ver anos anteriores'} <span className="linha-da-vida__faltam">({faltam} {faltam === 1 ? 'ano' : 'anos'} com história)</span>
        </button>
      )}
    </div>
  );
}

/** O tema que a margem já diz não se repete: o marco do nascimento, no ano 0, já está na idade ("0 · ao nascer"). */
export function temaDoMarco(e: Entrada, idadeDoAno: number): string | null {
  if (e.relevancia !== 'marco') return null;
  if (e.tema === 'nascimento' && idadeDoAno === 0) return null;
  return TEMA_ROTULO[e.tema] ?? null;
}

/** A frase de origem em poucas palavras (para "por causa de: …"). */
function resumo(t: string): string {
  const limpo = t.replace(/\.$/, '');
  return limpo.length <= 56 ? `“${limpo}”` : `“${limpo.slice(0, 54).replace(/\s+\S*$/, '')}…”`;
}

/** Quantas histórias de gente ganham o rosto desenhado por página (as outras, o nome). */
const ROSTOS_NA_PAGINA = 4;

/** Os temas em que a história é de alguém (a relação, a família, a perda): o rosto vem junto. */
const DE_GENTE = new Set<Entrada['tema']>(['amor', 'familia', 'filhos', 'amizade', 'perda', 'morte', 'nascimento']);

/**
 * REWORK 7 — cada tipo de acontecimento tem a sua forma: o MARCO ganha o fio do tema e a tinta cheia; a ESCOLHA, o
 * sinal de "sua escolha"; a história de uma RELAÇÃO, o rosto de quem estava nela (um toque abre a ficha); o
 * COTIDIANO fica miúdo. A ordem de leitura continua: o tipo numa linha própria → a narrativa → os rostos.
 */
function ItemBiografia({ e, nova, idade, vida, abrirPessoa, rosto = true, origem, junto = false }: { e: Entrada; nova: boolean; idade: number; vida?: Vida; abrirPessoa?: (id: string) => void; rosto?: boolean; origem?: Entrada; junto?: boolean }) {
  const tema = temaDoMarco(e, idade);
  const natureza = naturezaDe(e);
  const gente = vida && e.relevancia !== 'cotidiano' && DE_GENTE.has(e.tema) ? (e.pessoas ?? []).map(id => vida.pessoas[id]).filter(p => p && p.nome).slice(0, 3) : [];
  // A origem de outro ano é dita (no mesmo fio, ela está logo acima e o fio já liga as duas).
  const deOutroAno = origem && origem.idade !== e.idade ? origem : undefined;
  const consequencia = natureza === 'consequencia' && (!junto || deOutroAno);
  return (
    <li className={`entrada entrada--${e.relevancia} entrada--tema-${e.tema} entrada--natureza-${natureza}${nova ? ' entrada--nova' : ''}${e.tom ? ` entrada--${e.tom}` : ''}${e.escolha ? ' entrada--escolha' : ''}${gente.length ? ' entrada--gente' : ''}`}>
      {(tema || e.escolha || natureza === 'virada' || consequencia) && (
        <p className="entrada__tipo">
          {tema && <span className="entrada__tema">{tema}</span>}
          {natureza === 'virada' && <span className="entrada__virada">mudança de rumo</span>}
          {e.escolha && <span className="entrada__escolha" title="Uma escolha sua">sua escolha</span>}
          {consequencia && <span className="entrada__consequencia">{deOutroAno ? `por causa de: ${resumo(deOutroAno.texto)} (aos ${deOutroAno.idade})` : 'consequência'}</span>}
        </p>
      )}
      <p className="entrada__texto">{e.texto}</p>
      {gente.length > 0 && vida && (
        <span className="entrada__rostos">
          {gente.map(p => {
            const face = rosto && <Retrato visual={p.visual} genero={p.genero} idade={Math.max(0, Math.min(idadePessoa(vida, p), Math.floor((e.t - p.tNasc) / 12)))} semente={p.pet?.semente ?? p.id} tamanho={28} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} falecido={!p.vivo && (p.tMorte ?? Infinity) <= e.t} />;
            return abrirPessoa && vida.vinculos[p.id]
              ? <button key={p.id} type="button" className={`entrada__rosto${face ? '' : ' entrada__rosto--nome'}`} onClick={() => abrirPessoa(p.id)} aria-label={`Ver ${p.nome}`}>{face}<span>{p.nome}</span></button>
              : <span key={p.id} className={`entrada__rosto${face ? '' : ' entrada__rosto--nome'}`}>{face}<span>{p.nome}</span></span>;
          })}
        </span>
      )}
    </li>
  );
}

/**
 * As conquistas da vida (REWORK 9): os marcos que o motor registrou como conquista — formar-se, ser aprovado, ser
 * promovido, estrear, vencer — e o palmarés do esporte, em ordem. A sala de troféus começa aqui, só com o que houve.
 */
function Conquistas({ vida }: { vida: Vida }) {
  const marcas = vida.caminhos.marcas.filter(m => MARCAS_DE_CONQUISTA.has(m.tipo)).sort((a, b) => b.t - a.t);
  const pal = leituraDoPalmares(vida);
  if (!marcas.length && !pal.titulos.length && !pal.premios.length) return <p className="nota">Ainda não há conquistas registradas. Formar-se, ser aprovado, ser promovido, ganhar um título: tudo isso aparece aqui.</p>;
  return (
    <section className="conquistas" aria-label="Conquistas">
      {(pal.titulos.length > 0 || pal.premios.length > 0) && (
        <div className="conquistas__palmares">
          <h3 className="conquistas__titulo">No esporte</h3>
          <ul className="conquistas__lista">{[...pal.titulos, ...pal.premios].map(x => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
      {marcas.length > 0 && (
        <ol className="conquistas__lista conquistas__lista--vida">
          {marcas.map((m, k) => <li key={`${m.t}${k}`} className={`conquistas__item conquistas__item--peso${m.peso}`}><span className="conquistas__ano">{anoDe(m.t)}</span> {m.texto}</li>)}
        </ol>
      )}
    </section>
  );
}
