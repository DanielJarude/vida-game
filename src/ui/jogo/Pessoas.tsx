/**
 * Pessoas: rostos antes de nomes, do centro para fora.
 *
 * No topo, o que pede atenção agora (um bebê a caminho, alguém de luto, uma
 * briga) — não uma lista de tarefas, um aviso de quem precisa de você.
 * Depois, quem divide a vida com você, com rosto grande e uma frase sobre
 * como está a relação. Depois a família, os amigos, a gente do dia a dia.
 * Parentes distantes ficam dobrados; quem passou e quem se foi, recolhidos.
 *
 * A ficha conta quem a pessoa é pelo que aconteceu: como se conheceram, o
 * que viveram, as coisas que são "de vocês", o que você descobriu sobre ela,
 * o que está acontecendo com ela agora — e o que faz sentido fazer JUNTO,
 * do mais relevante para o menos.
 */

import { textoLocal } from '../../motor/mundo/locais';
import { useState } from 'react';
import { custoDaConsulta, custoDoTratamento, estadoDoPet, infoPet } from '../../motor/sistemas/pets';
import { EXOTICOS, temInstalacao, zoologicosParaOPet } from '../../motor/sistemas/exoticos';
import { animal } from '../../motor/dados/animais';
import { dinheiroCurto } from '../leituraMaterial';
import type { Atracao, Marco, Pessoa, Vida, Vinculo } from '../../motor/tipos';
import { disponibilidade, type Acao } from '../../motor/acoes';
import { idade, idadePessoa, jeitoDe, parceiro } from '../../motor/nucleo';
import { nomeLugar } from '../../motor/dados/lugares';
import { flex } from '../../motor/texto';
import { anoDe, MESES, mesDe } from '../../motor/tempo';
import { gestacaoEmCurso } from '../../motor/sistemas/familia';
import { interacoesPara, prioridadesDaFicha, rotuloInteracao } from '../../motor/sistemas/interacoes';
import { grupoDaInteracao, ORDEM_DOS_GRUPOS, ROTULO_DO_GRUPO } from '../../motor/sistemas/juntos';
import { coisasDaVida } from '../../motor/sistemas/coisas';
import { usosDaCoisa } from '../../motor/dados/pertences';
import { disponibilidadeUsarCoisa } from '../../motor/sistemas/pertences';
import { podeTentar } from '../../motor/plausibilidade';
import { ehDescendente, faseDeIdade, papelDe } from '../../motor/sistemas/vinculos';
import { rotuloDe } from '../apresentar';
import { circulos, comoEsta, etiqueta, ondeEsta, quemE, sinaisSociais, situacaoAfetiva, vidaPropria, type Par, type TipoDeSinal } from '../leitura';
import { BotaoAcao, CabecaDaArea, Escolha, Folha, navegarAbas, Percurso, Secao, Subnav, Vazio } from '../comum';
import { recenteDe, TEMAS_PESSOAS } from '../area';
import { tardesDoAno, tardesUsadas } from '../../motor/sistemas/convivio';
import { Retrato, type Expressao } from '../avatar/Retrato';
import { buscasPossiveisNoAno, contextosDeBusca, ROTULO_BUSCA } from '../../motor/sistemas/busca';
import { leituraDaOrigem } from '../../motor/sistemas/origem';
import { trajetoriaDaRelacao } from '../../motor/sistemas/relacoes';
import { estadoDaRelacao, forcaDaRelacao } from '../../motor/sistemas/lacos';
import { estadosContextuais, fraseDaMagoa, type EstadoContextual } from '../../motor/sistemas/magoas';
import { dimensoesEmPalavras } from '../../motor/sistemas/afetos';
import { fraseDoSaber, pendentes, saberes } from '../../motor/sistemas/conhecimento';
import { presentesDados, presentesPara } from '../../motor/sistemas/presentes';
import { contasAtivas } from '../../motor/sistemas/redesBase';
import { DesenhoObjeto } from './material/Objetos';
import { dinheiroCurto as precoCurto } from '../leituraMaterial';
import { descricaoOrigem } from '../../motor/sistemas/social';
import { saudeConhecida } from '../../motor/sistemas/corpo';
import { gestosDeMemoria, memoriasRecentes } from '../../motor/sistemas/memoria';
import { faseDoLuto } from '../../motor/sistemas/luto';
import { LuaDeMel, PlanejarCasamento } from './Casamento';
import { acordoConsentido } from '../../motor/sistemas/romance';
import { contextosDeAmizade, ROTULO_AMIZADE } from '../../motor/sistemas/busca';

interface Props { vida: Vida; agir: (a: Acao) => boolean; aberta: string | null; abrir: (id: string | null) => void; parte?: PartePessoas; irParte?: (p: PartePessoas) => void }

const ROTULO_SINAL: Record<TipoDeSinal, string> = { urgente: 'Precisa de você', importante: 'Importante', noticia: 'Notícia', oportunidade: 'Para retomar' };

export type PartePessoas = 'circulo' | 'deles' | 'nossa';
const PARTES_PESSOAS: { id: PartePessoas; rotulo: string; oque: string }[] = [
  { id: 'circulo', rotulo: 'Meu círculo', oque: 'Quem está na sua vida agora: a casa, a família, os amigos, quem pede atenção' },
  { id: 'deles', rotulo: 'A vida deles', oque: 'O que aconteceu com cada um: emprego, estudo, amor, filhos, perdas' },
  { id: 'nossa', rotulo: 'Nossa história', oque: 'O que vocês viveram juntos — só o que aconteceu de fato' }
];

/**
 * REWORK 10 · UX-14 — o ÁLBUM DE RELAÇÕES. Antes, cartões grandes empilhados (três telas para a casa no celular) e
 * nenhum jeito de achar "quem está brigado comigo" ou "quem se afastou". Agora: os mesmos grupos (cada pessoa num só),
 * em figurinhas pequenas lado a lado, e um filtro que atravessa os grupos — família, amor, amigos, em conflito, afastados.
 */
type FiltroDoAlbum = 'todos' | 'familia' | 'amor' | 'amigos' | 'conflitos' | 'afastados';
const ROTULO_FILTRO: Record<FiltroDoAlbum, string> = { todos: 'Todos', familia: 'Família', amor: 'Amor', amigos: 'Amigos', conflitos: 'Em conflito', afastados: 'Afastados' };
function noFiltro(vida: Vida, { p, vin }: Par, f: FiltroDoAlbum, passado: Set<string>): boolean {
  if (f === 'todos') return true;
  if (!p.vivo || p.especie) return false;
  const e = estadoDaRelacao(vida, vin);
  if (f === 'familia') return !!vin.parentesco;
  if (f === 'amor') return !!vin.romance && vin.romance.estagio !== 'ex';
  if (f === 'amigos') return !vin.parentesco && !vin.romance && (vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo');
  if (f === 'conflitos') return e === 'conflito' || e === 'tensao' || e === 'rompido' || vin.tensao >= 55 || !!vin.conflito;
  return e === 'afastado' || e === 'esfriando' || vin.estagio === 'afastado' || vin.estagio === 'ex_amigo' || vin.romance?.estagio === 'ex' || passado.has(p.id);
}

export function Pessoas({ vida, agir, aberta, abrir, parte: parteDeFora, irParte }: Props) {
  // REWORK 9: três partes — Meu círculo (quem está aqui), A vida deles (o que aconteceu com cada um), Nossa história
  // (o que vocês viveram juntos). REWORK 10: a parte aberta é guardada pelo Jogo (voltar a Pessoas volta a ela).
  const [parteLocal, setParteLocal] = useState<PartePessoas>('circulo');
  const parte = parteDeFora ?? parteLocal;
  const irA = (x: PartePessoas) => { setParteLocal(x); irParte?.(x); };
  const [filtro, setFiltro] = useState<FiltroDoAlbum>('todos');
  const c = circulos(vida);
  // REWORK 7.5: quem morreu há pouco (ou ainda é luto) fica à vista — "Quem se foi" é recolhido e fica para o resto.
  const memorias = memoriasRecentes(vida).map(p => ({ p, vin: vida.vinculos[p.id] }));
  const mortos = c.mortos.filter(x => !memorias.some(m => m.p.id === x.p.id));
  const pessoa = aberta ? vida.pessoas[aberta] : null;
  const i = idade(vida);
  const moraComPais = vida.moradia.tipo === 'pais' || vida.moradia.tipo === 'parente';
  const total = c.nucleo.length + c.familia.length + c.amigos.length + c.contexto.length;
  const vazio = !total;
  const sinais = sinaisSociais(vida).filter(x => x.pessoaId && vida.pessoas[x.pessoaId]);
  const passado = new Set(c.passado.map(x => x.p.id));
  const todos = [...c.nucleo, ...c.familia, ...c.familiaExtensa, ...c.amigos, ...c.contexto, ...c.passado].filter((x, k, a) => a.findIndex(y => y.p.id === x.p.id) === k);
  const contagem = (f: FiltroDoAlbum) => todos.filter(x => noFiltro(vida, x, f, passado)).length;
  const filtros = (Object.keys(ROTULO_FILTRO) as FiltroDoAlbum[]).filter(f => f === 'todos' || contagem(f) > 0);
  const filtroAtual = filtros.includes(filtro) ? filtro : 'todos';
  const par = parceiro(vida);
  const afeto = situacaoAfetiva(vida);
  const conflitos = contagem('conflitos');
  // Quando alguém pede atenção, a caixa logo abaixo já é o próximo passo (não se repete no alto).
  const primeiro = sinais[0];
  return (
    <div className="pessoas">
      <CabecaDaArea area="Pessoas" kicker={`${total} na sua vida`} titulo={tituloDePessoas(vida, c.nucleo)}
        fatos={[
          ...(i >= 14 ? [{ rotulo: 'No amor', valor: afeto || (par ? par.p.nome : 'sem ninguém agora') }] : []),
          { rotulo: 'Em casa', valor: c.nucleo.filter(x => x.vin.convivio.includes('casa')).map(x => x.p.nome).filter(Boolean).slice(0, 3).join(', ') || (moraComPais ? 'com a família' : 'ninguém') },
          ...(conflitos ? [{ rotulo: 'Em conflito', valor: `${conflitos} ${conflitos === 1 ? 'pessoa' : 'pessoas'}`, tom: 'ruim' as const }] : []),
          // REWORK 10 · BAL-03: o tempo do ano para as pessoas (programas gastam tardes; conversas, quase nada).
          ...(i >= 10 ? [(() => { const sobra = Math.max(0, Math.round(tardesDoAno(vida) - tardesUsadas(vida))); return { rotulo: 'Tempo para as pessoas', valor: sobra >= 1 ? `${sobra} ${sobra === 1 ? 'tarde livre' : 'tardes livres'} no ano` : 'o ano já foi gasto', tom: sobra < 3 ? 'ruim' as const : undefined }; })()] : [])
        ]}
        recente={recenteDe(vida, TEMAS_PESSOAS)}
        proximo={primeiro ? undefined : i >= 15 && !par && !vida.justica?.prisao ? { texto: 'Ninguém pedindo nada. Dá para procurar alguém, se quiser.', rotulo: 'Conhecer alguém', ir: () => document.getElementById('conhecer-alguem')?.scrollIntoView?.({ block: 'start' }) } : undefined} />
      <Subnav rotulo="Partes de Pessoas" prefixo="pessoas" itens={PARTES_PESSOAS} atual={parte} aoMudar={irA} />
      {parte === 'deles' && <AVidaDeles vida={vida} abrir={abrir} />}
      {parte === 'nossa' && <NossaHistoria vida={vida} abrir={abrir} />}
      <div className={`pessoas__circulo${parte === 'circulo' ? '' : ' pessoas__circulo--oculto'}`}>
      {sinais.length > 0 && (
        <section className="atencao" aria-label="Pedem atenção">
          <h2 className="atencao__titulo">Pedem atenção</h2>
          <ul className="atencao__lista">
            {sinais.map((x, k) => {
              const p = vida.pessoas[x.pessoaId!];
              return (
                <li key={k}>
                  <button type="button" className={`atencao__item atencao__item--${x.tipo}`} onClick={() => abrir(p.id)}>
                    <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={40} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} expressao={expressaoNpc(vida, p)} falecido={!p.vivo} />
                    <span className="atencao__texto"><span className="atencao__tipo">{ROTULO_SINAL[x.tipo]}</span>{x.texto}</span>
                    <span className="atencao__ir" aria-hidden="true">{p.vivo ? 'abrir →' : 'ver →'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {filtros.length > 2 && (
        <div className="album__filtros" role="group" aria-label="Mostrar no álbum">
          {filtros.map(f => <button key={f} type="button" className="chip" aria-pressed={filtroAtual === f} onClick={() => setFiltro(f)}>{ROTULO_FILTRO[f]}{f !== 'todos' && <span className="chip__conta">{contagem(f)}</span>}</button>)}
        </div>
      )}

      {filtroAtual !== 'todos' && (
        <section className="album album--filtro" aria-label={`Álbum: ${ROTULO_FILTRO[filtroAtual]}`}>
          <Figurinhas vida={vida} itens={todos.filter(x => noFiltro(vida, x, filtroAtual, passado))} abrir={abrir} />
        </section>
      )}

      {filtroAtual === 'todos' && <>
      {c.nucleo.length > 0 && (
        <Secao titulo={tituloNucleo(vida, c.nucleo, moraComPais)}>
          <ul className={`nucleo nucleo--${Math.min(c.nucleo.length, 4)}`}>
            {c.nucleo.map(x => <li key={x.p.id}><CartaoNucleo vida={vida} x={x} abrir={abrir} /></li>)}
          </ul>
        </Secao>
      )}

      {memorias.length > 0 && (
        <Secao titulo="Em memória">
          <p className="nota">Quem se foi há pouco. Um toque abre o que dá para fazer pela memória de cada um.</p>
          <Lista vida={vida} itens={memorias} abrir={abrir} />
        </Secao>
      )}
      {(c.familia.length > 0 || c.familiaExtensa.length > 0) && (
        <Secao titulo="Família" recolhivel aberta>
          <p className="nota origem-linha">{leituraDaOrigem(vida)}{vida.origem.bairro ? ` Você cresceu ${vida.origem.bairro}.` : ''}</p>
          <Figurinhas vida={vida} itens={c.familia} abrir={abrir} />
          {c.familiaExtensa.length > 0 && <Dobra rotulo={`Outros parentes (${c.familiaExtensa.length})`}><Figurinhas vida={vida} itens={c.familiaExtensa} abrir={abrir} /></Dobra>}
        </Secao>
      )}
      {c.amigos.length > 0 && <Secao titulo="Amigos" recolhivel aberta><Figurinhas vida={vida} itens={c.amigos} abrir={abrir} limite={8} rotuloTodos="Todos os amigos" /></Secao>}
      {c.contexto.length > 0 && <Secao titulo={i < 18 ? 'Da escola e do bairro' : 'Do dia a dia'} recolhivel aberta={c.contexto.length <= 6}><Figurinhas vida={vida} itens={c.contexto} abrir={abrir} limite={8} rotuloTodos="Todos" /></Secao>}
      {c.passado.length > 0 && <Secao titulo="Gente que passou" recolhivel aberta={false}><Lista vida={vida} itens={c.passado} abrir={abrir} /></Secao>}
      {mortos.length > 0 && <Secao titulo="Quem se foi" recolhivel aberta={false}><Lista vida={vida} itens={mortos} abrir={abrir} /></Secao>}
      </>}
      {vazio && <Vazio>Ninguém por perto ainda.</Vazio>}

      <p className="dica pessoas__tempo">
        Quem convive com você continua perto sem esforço; quem está longe, esfria. Com a mesma pessoa, no mesmo ano, cada coisa a mais aproxima menos.
      </p>

      <div id="conhecer-alguem"><ConhecerAlguem vida={vida} agir={agir} /></div>
      <Voce vida={vida} agir={agir} />
      </div>
      {pessoa && <FichaPessoa key={pessoa.id} vida={vida} p={pessoa} vin={vida.vinculos[pessoa.id]} agir={agir} aoFechar={() => abrir(null)} />}
    </div>
  );
}

/** A marca de quem está em conflito ou se afastou (no álbum, sem precisar abrir). */
function marcaDoLaco(vida: Vida, p: Pessoa, vin: Vinculo): string | undefined {
  if (!p.vivo || p.especie) return undefined;
  const e = estadoDaRelacao(vida, vin);
  if (e === 'conflito' || e === 'rompido' || vin.conflito) return 'em conflito';
  if (e === 'tensao' || vin.tensao >= 55) return 'tensão';
  if (e === 'afastado' || e === 'esfriando') return 'esfriando';
  return undefined;
}

/** As figurinhas do álbum: rosto, nome, o papel e a idade, a força do laço e a marca do momento. */
function Figurinhas({ vida, itens, abrir, limite, rotuloTodos }: { vida: Vida; itens: Par[]; abrir: (id: string) => void; limite?: number; rotuloTodos?: string }) {
  const [todos, setTodos] = useState(false);
  const mostrados = todos || !limite ? itens : itens.slice(0, limite);
  return (
    <>
      <ul className="figurinhas">
        {mostrados.map(({ p, vin }) => {
          const marca = marcaDoLaco(vida, p, vin);
          return (
            <li key={p.id}>
              <button type="button" className={`figurinha rosto${marca ? ` figurinha--${marca === 'esfriando' ? 'fria' : 'tensa'}` : ''}${p.vivo ? '' : ' figurinha--falecida'}`} onClick={() => abrir(p.id)}>
                <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={56} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} expressao={expressaoNpc(vida, p)} falecido={!p.vivo} />
                <span className="figurinha__nome">{p.nome || 'Bebê'}</span>
                <span className="figurinha__papel">{rotuloDe(vida, p, vin)}{p.vivo && !p.especie ? ` · ${idadePessoa(vida, p)}` : ''}</span>
                {p.vivo && !p.especie && <BarraRelacao vida={vida} vin={vin} />}
                {marca ? <span className="figurinha__marca">{marca}</span> : <span className="figurinha__prox">{etiqueta(vida, p, vin)}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {limite && itens.length > limite && <button type="button" className="dobra__botao" aria-expanded={todos} onClick={() => setTodos(t => !t)}>{todos ? 'Recolher' : `${rotuloTodos ?? 'Todos'} (${itens.length})`}</button>}
    </>
  );
}

/**
 * A leitura rápida da relação (REWORK 4): uma barra discreta da FORÇA do laço (afeto, confiança, atrito —
 * `forcaDaRelacao`). Não substitui o tipo, o estado nem a síntese; o número fica para o leitor de tela.
 */
export function BarraRelacao({ vida, vin, grande }: { vida: Vida; vin: Vinculo; grande?: boolean }) {
  const f = forcaDaRelacao(vida, vin);
  const estado = estadoDaRelacao(vida, vin);
  const tom = estado === 'rompido' || estado === 'conflito' ? 'tensa' : estado === 'tensao' || estado === 'esfriando' ? 'fria' : f >= 70 ? 'forte' : f >= 40 ? 'media' : 'fraca';
  return (
    <span className={`barra-relacao barra-relacao--${tom}${grande ? ' barra-relacao--grande' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={f} aria-label={`Força da relação: ${f >= 70 ? 'forte' : f >= 40 ? 'média' : 'fraca'}`}>
      <span className="barra-relacao__cheio" style={{ width: `${Math.max(4, f)}%` }} />
    </span>
  );
}

/** O rosto de alguém reflete o momento dela quando algo pesa (luto, doença, separação). */
function expressaoNpc(vida: Vida, p: Pessoa): Expressao {
  if (!p.vivo) return 'neutro';
  if (p.aperto && vida.t - p.aperto.t <= 24) return p.aperto.tipo === 'doenca' ? 'doente' : p.aperto.tipo === 'fase' || p.aperto.tipo === 'desemprego' || p.aperto.tipo === 'dinheiro' ? 'cansado' : 'abatido';
  if (p.saude < 35 && idadePessoa(vida, p) >= 60) return 'doente';
  if (p.condicoes?.some(c => c.diagnosticada && c.gravidade >= 3)) return 'doente';
  return 'neutro';
}

/** O título diz a verdade: "Com você" só quando alguém divide a vida (casa ou parceria). */
function tituloNucleo(vida: Vida, nucleo: Par[], moraComPais: boolean): string {
  const par = parceiro(vida);
  if (moraComPais && !par) return 'Em casa';
  if (par || nucleo.some(x => x.vin.convivio.includes('casa'))) return 'Com você';
  return nucleo.every(x => papelDe(x.p, x.vin) === 'filho') ? (nucleo.length === 1 ? flex(nucleo[0].p.genero, 'Seu filho', 'Sua filha', 'Sue filhe') : 'Seus filhos') : 'Os seus';
}

/** Parceria e filhos: o rosto grande, o papel, uma frase sobre como está. */
function CartaoNucleo({ vida, x, abrir }: { vida: Vida; x: Par; abrir: (id: string) => void }) {
  const { p, vin } = x;
  const ip = idadePessoa(vida, p);
  const gest = gestacaoEmCurso(vida);
  const esperando = gest?.descoberta && (gest.gestanteId === p.id || (gest.gestanteId === 'eu' && gest.outroId === p.id));
  const leitura = comoEsta(vida, p, vin);
  return (
    <button type="button" className={`cartao-pessoa${vin.tensao >= 55 ? ' cartao-pessoa--tenso' : ''}`} onClick={() => abrir(p.id)}>
      <Retrato visual={p.visual} genero={p.genero} idade={ip} semente={p.pet?.semente ?? p.id} tamanho={84} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} expressao={expressaoNpc(vida, p)} />
      <span className="cartao-pessoa__nome">{p.nome || 'Bebê'}</span>
      <span className="cartao-pessoa__papel">{rotuloDe(vida, p, vin)}{p.especie ? '' : ` · ${ip} ${ip === 1 ? 'ano' : 'anos'}`}</span>
      {!p.especie && <BarraRelacao vida={vida} vin={vin} />}
      {leitura && <span className="cartao-pessoa__leitura">{leitura}</span>}
      {esperando && gest && <span className="cartao-pessoa__nota">Um bebê a caminho — {MESES[mesDe(gest.tParto)]} de {anoDe(gest.tParto)}.</span>}
    </button>
  );
}

function Lista({ vida, itens, abrir }: { vida: Vida; itens: Par[]; abrir: (id: string) => void }) {
  return (
    <ul className="lista-pessoas">
      {itens.map(({ p, vin }) => (
        <li key={p.id}>
          <button type="button" className={`pessoa${p.vivo ? '' : ' pessoa--falecida'}`} onClick={() => abrir(p.id)}>
            <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.pet?.semente ?? p.id} tamanho={44} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} falecido={!p.vivo} expressao={expressaoNpc(vida, p)} />
            <span className="pessoa__nome">{p.nome || 'Bebê'}</span>
            <span className="pessoa__rotulo">{rotuloDe(vida, p, vin)}{p.vivo ? ` · ${idadePessoa(vida, p)}` : ''}</span>
            <span className={`pessoa__prox${vin.tensao >= 55 && p.vivo ? ' pessoa__prox--tensa' : ''}`}>{p.vivo && !p.especie && <BarraRelacao vida={vida} vin={vin} />}{etiqueta(vida, p, vin)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Dobra({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="dobra">
      <button type="button" className="dobra__botao" aria-expanded={aberta} onClick={() => setAberta(a => !a)}>{aberta ? 'Recolher' : rotulo}</button>
      {aberta && children}
    </div>
  );
}

/**
 * Conhecer alguém: a busca ativa (uma vez por ano), pelos contextos que
 * existem nesta vida. A resposta é da outra pessoa — e não achar ninguém é
 * resultado também.
 */
function ConhecerAlguem({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  if (i < 10 || vida.justica?.prisao) return null;
  const par = parceiro(vida);
  // REWORK 11 · REL-11.1: fazer amizades é para todo mundo, com ou sem parceria (não é traição). A busca romântica com
  // parceria: dentro do combinado (acordo aberto/poliamor) — ou, num relacionamento exclusivo, recolhida e dita como o que é.
  const amizade = <FazerAmizades vida={vida} agir={agir} />;
  if (i < 15 || (par && i < 18)) return amizade;
  const combinado = !!par && acordoConsentido(par.vin.romance);
  const ctxs = contextosDeBusca(vida);
  const opcoesAtracao: { id: Atracao; rotulo: string }[] = [{ id: 'mulheres', rotulo: 'Mulheres' }, { id: 'homens', rotulo: 'Homens' }, { id: 'ambos', rotulo: 'Qualquer gênero' }];
  const feitas = vida.anoAtual.acoes.filter(a => a.startsWith('buscar:')).length;
  const limite = buscasPossiveisNoAno(vida);
  const romantico = (
    <>
      <p className="nota">{par ? (combinado ? `Dentro do combinado com ${par.p.nome}: procurar alguém não é segredo.` : `Você está com ${par.p.nome}, num relacionamento exclusivo: procurar alguém seria traição — e ${flex(par.p.genero, 'ele', 'ela', 'elu')} pode perceber.`) : 'Procurar alguém é uma escolha sua; o interesse é da outra pessoa.'} Às vezes aparece alguém, às vezes não. Cada lugar uma vez no ano — e quantas vezes cabe, a sua semana diz (este ano, até {limite}).</p>
      {!vida.eu.atracao && (
        <div className="campo">
          <span className="campo__rotulo">Antes: por quem você se interessa</span>
          <Escolha rotulo="Por quem você se interessa" opcoes={opcoesAtracao} valor={undefined as unknown as Atracao} aoMudar={valor => agir({ tipo: 'atracao', valor })} />
        </div>
      )}
      {vida.eu.atracao && feitas < limite && (
        <div className="grupo-acoes">
          {ctxs.map(x => <BotaoAcao key={x} vida={vida} acao={{ tipo: 'conhecer_alguem', contexto: x }} agir={agir} variante="discreto">{ROTULO_BUSCA[x]}</BotaoAcao>)}
        </div>
      )}
      {feitas >= limite && <p className="nota">Este ano já foram {feitas} tentativas: a semana não tem mais noites livres para isso.</p>}
    </>
  );
  return (
    <>
      {amizade}
      <Secao titulo={par && !combinado ? 'Procurar alguém por fora' : 'Conhecer alguém'} recolhivel aberta={i >= 18 && !par}>
        {romantico}
      </Secao>
    </>
  );
}

/** REWORK 11 · REL-11.1: fazer amizades (não romance), em qualquer estado civil: a pessoa que aparece fica como conhecida. */
function FazerAmizades({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const ctxs = contextosDeAmizade(vida);
  if (!ctxs.length) return null;
  return (
    <Secao titulo="Fazer amizades" recolhivel aberta={false}>
      <p className="nota">Gente nova para conversar, sem segundas intenções — com ou sem alguém na sua vida. Se vira amizade, o tempo e o que fizerem juntos dizem.</p>
      <div className="grupo-acoes">
        {ctxs.map(x => <BotaoAcao key={x} vida={vida} acao={{ tipo: 'fazer_amizade', contexto: x }} agir={agir} variante="discreto">{ROTULO_AMIZADE[x]}</BotaoAcao>)}
      </div>
    </Secao>
  );
}

/** O que é só seu: por quem você se interessa. Adoção sem parceria também é individual. */
function Voce({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const opcoesAtracao: { id: Atracao | 'aberto'; rotulo: string }[] = [
    { id: 'aberto', rotulo: 'Ainda não sei' }, { id: 'mulheres', rotulo: 'Mulheres' }, { id: 'homens', rotulo: 'Homens' }, { id: 'ambos', rotulo: 'Qualquer gênero' }
  ];
  if (i < 13) return null;
  return (
    <Secao titulo="Você" recolhivel aberta={false}>
      <div className="campo">
        <span className="campo__rotulo">Por quem você se interessa</span>
        <Escolha rotulo="Por quem você se interessa" opcoes={opcoesAtracao} valor={vida.eu.atracao ?? 'aberto'}
          aoMudar={valor => agir({ tipo: 'atracao', valor: valor === 'aberto' ? undefined : valor })} />
      </div>
      {i >= 18 && !parceiro(vida) && <BotaoAcao vida={vida} acao={{ tipo: 'adotar' }} agir={agir} variante="discreto" ocultarImpossivel>Entrar sozinh{flex(vida.eu.tratamento ?? vida.eu.genero, 'o', 'a', 'e')} com um pedido de adoção</BotaoAcao>}
    </Secao>
  );
}

/** O que está acontecendo com a pessoa agora, em uma linha. */
function agoraDela(vida: Vida, p: Pessoa, vin: Vinculo): string {
  if (!p.vivo || p.especie) return '';
  const ip = idadePessoa(vida, p);
  const fase = faseDeIdade(ip);
  const partes: string[] = [];
  if (p.ocupacao && p.ocupacao !== 'estudante') partes.push(p.ocupacao);
  else if (p.ocupacao === 'estudante' || (ip >= 6 && ip < 18)) partes.push(fase === 'crianca' || fase === 'pre' ? 'na escola' : ip < 18 ? 'no colégio' : 'estudando');
  if (p.estudo && vida.t < p.estudo.tFim) partes.push(`cursando ${p.estudo.curso}`);
  const rom = vin.romance;
  if (rom?.pediuTempo !== undefined && rom.estagio === 'interesse') partes.push(`pediu um tempo para pensar desde ${anoDe(rom.pediuTempo)}`);
  return partes.join(' · ');
}

/**
 * REWORK 7.5 — a ficha de quem morreu: onde está a perda agora (a falta, a saudade que se acalma, a memória que fica)
 * e os gestos possíveis pela memória (`sistemas/memoria`): só os que fazem sentido para esta relação, com o motivo
 * quando não dá. Nenhum promete alívio: o que o gesto faz se vê na família e, com o tempo, no luto.
 */
function EmMemoria({ vida, p, agir }: { vida: Vida; p: Pessoa; agir: (a: Acao) => boolean }) {
  const gestos = gestosDeMemoria(vida, p.id);
  const l = vida.luto.find(x => x.pessoaId === p.id);
  const ponto = l ? (faseDoLuto(l) === 'ativo' ? 'A falta ainda pesa no dia a dia.' : 'A saudade continua, mas vai se acalmando.') : vida.t - (p.tMorte ?? vida.t) < 12 ? '' : 'A perda ficou na memória — já não pesa como pesou.';
  if (!gestos.length && !ponto) return null;
  return (
    <section className="ficha__memoria-de" aria-label={`Lembrar de ${p.nome}`}>
      <h3 className="ficha__subtitulo">Lembrar de {p.nome}</h3>
      {ponto && <p className="ficha__porque">{ponto}</p>}
      {gestos.length > 0 && (
        <div className="grupo-acoes">
          {gestos.map(g => <BotaoAcao key={g.gesto} vida={vida} acao={{ tipo: 'memoria', pessoaId: p.id, gesto: g.gesto }} agir={agir} variante={g.gesto === 'despedida' ? 'principal' : 'secundario'}>{g.rotulo}</BotaoAcao>)}
        </div>
      )}
    </section>
  );
}

const DESCOBERTA = (m: Marco) => m.tipo === 'descoberta';
/** As frases de `fraseDoSaber` no presente (as que a ficha de quem morreu diz no passado). */
const PRESENTE_DO_SABER = /^(Tem \S+ filhos?|Não tem filhos|Trabalha como|Está aposentad|Estuda\.|Tem uma lista enorme|Gosta das coisas|Conhece meio mundo|É de pouca gente|Carrega mais preocupação|Tem curso superior)/;
const RITUAL = (m: Marco) => m.tipo === 'ritual';

/** O laço em palavras (REWORK 7): afeto, confiança e atrito — os números do vínculo, lidos, nunca mostrados. */
/**
 * REWORK 10.6 · A1 (P1 do 10.5) — a confiança lida com a HISTÓRIA, não só com o número. Quem se acabou de conhecer tem
 * pouca confiança porque ela ainda não foi construída — antes, todo conhecido novo (que nasce com uns 25–30) aparecia
 * como "abalada", como se algo a tivesse quebrado. Agora: rompida (houve ruptura), ressentida (a mágoa ainda pesa),
 * abalada (você quebrou: mágoa causada por você, traição, briga), com motivo para desconfiar (foi a pessoa quem quebrou),
 * esfriada (a distância de anos) — e, sem nada disso, "ainda se formando" (laço novo) ou "pouca" (laço antigo e raso).
 */
export function confiancaEmPalavras(vin: Vinculo, agora: number): { palavra: string; tom: 'bom' | 'neutro' | 'ruim' } {
  const c = vin.confianca;
  if (c >= 75) return { palavra: 'total', tom: 'bom' };
  if (c >= 55) return { palavra: 'firme', tom: 'bom' };
  const recente = (t: number) => agora - t <= 120;
  if (vin.ruptura && !vin.reconciliacao) return { palavra: 'rompida', tom: 'ruim' };
  if (vin.magoa && vin.magoa.ressentimento >= 50) return { palavra: 'ressentida', tom: 'ruim' };
  const traicao = vin.historia.filter(h => h.tipo === 'traicao' && recente(h.t));
  const brigas = vin.historia.some(h => h.tipo === 'conflito' && recente(h.t)) || !!vin.conflito;
  const causouOutro = vin.magoa?.quem === 'outro' || vin.conflito?.quem === 'outro' || traicao.some(h => h.de === 'ela');
  if (c < 35 && (vin.magoa || brigas || traicao.length)) return causouOutro ? { palavra: 'com motivo para desconfiar', tom: 'ruim' } : { palavra: 'abalada', tom: 'ruim' };
  if (c >= 35) return { palavra: vin.magoa || traicao.length ? 'com reservas, depois do que houve' : 'com reservas', tom: 'neutro' };
  if (vin.historia.some(h => h.tipo === 'distancia')) return { palavra: 'esfriada pela distância', tom: 'neutro' };
  return { palavra: agora - vin.tInicio <= 36 ? 'ainda se formando' : 'pouca', tom: 'neutro' };
}

function lacoEmPalavras(vin: Vinculo, agora: number): { id: string; rotulo: string; palavra: string; tom: 'bom' | 'neutro' | 'ruim' }[] {
  const p = vin.proximidade, t = vin.tensao;
  return [
    { id: 'afeto', rotulo: 'Afeto', palavra: p >= 75 ? 'muito próximos' : p >= 55 ? 'próximos' : p >= 35 ? 'cordiais' : p >= 15 ? 'distantes' : 'quase estranhos', tom: p >= 55 ? 'bom' : p >= 35 ? 'neutro' : 'ruim' },
    { id: 'confianca', rotulo: 'Confiança', ...confiancaEmPalavras(vin, agora) },
    { id: 'atrito', rotulo: 'Atrito', palavra: t >= 55 ? 'muito' : t >= 30 ? 'algum' : t >= 12 ? 'pouco' : 'nenhum', tom: t >= 55 ? 'ruim' : t >= 30 ? 'neutro' : 'bom' },
    // REWORK 10.5 · REL-09: a intimidade (o quanto se contam) e o compromisso (o quanto a vida está amarrada), quando existem.
    ...dimensoesEmPalavras(vin)
  ];
}

const o_a = (p: Pessoa) => (p.genero === 'feminino' ? 'a' : p.genero === 'masculino' ? 'o' : 'e');
const rotuloEstadoContextual = (x: EstadoContextual, p: Pessoa) => ({ brigados: 'brigados', magoada: `magoad${o_a(p)} com você`, deve_desculpas: 'deve um pedido de desculpas', confianca_abalada: 'confiança abalada', medo: 'você tem medo', afastados: 'afastados', rompidos: 'rompidos', bloqueado: 'contato bloqueado', reconciliando: 'tentando se reconciliar' } as const)[x];

const ROTULO_ESTADO: Partial<Record<ReturnType<typeof estadoDaRelacao>, string>> = { aproximando: 'se aproximando', esfriando: 'esfriando', tensao: 'com tensão', conflito: 'em conflito', afastado: 'afastados', rompido: 'rompidos', reconciliacao: 'se reconciliando' };

/**
 * A FICHA DE UMA PESSOA (REWORK 7): o retrato de uma relação, não um menu. De um lado, quem ela é, como vocês estão
 * (o laço em palavras, o estado, o que aconteceu por último) e a história; do outro, CONVIVER — o que faz sentido
 * agora, primeiro, e o resto por tipo de convivência, uma aba de cada vez (todas continuam lá: nenhuma ação some).
 */
function FichaPessoa({ vida, p, vin, agir, aoFechar }: { vida: Vida; p: Pessoa; vin: Vinculo; agir: (a: Acao) => boolean; aoFechar: () => void }) {
  const ip = idadePessoa(vida, p);
  const papel = papelDe(p, vin);
  const acoes = p.vivo ? interacoesPara(vida, p.id) : [];
  // O que é seu e dá para usar com ESTA pessoa (tocar para ela, jogar, cozinhar, ver um filme): o objeto entra na relação.
  const usosComEla = p.vivo && !p.especie ? coisasDaVida(vida).flatMap(t => usosDaCoisa(t.coisaId).filter(u => u.com && podeTentar(disponibilidadeUsarCoisa(vida, t.id, u.id, p.id))).map(uso => ({ t, uso }))).slice(0, 4) : [];
  const quem = quemE(vida, p, vin);
  const onde = ondeEsta(vida, p, vin);
  const como = comoEsta(vida, p, vin);
  const agora = agoraDela(vida, p, vin);
  const saude = saudeConhecida(p);
  const trajetoria = !p.especie ? trajetoriaDaRelacao(vida, vin) : undefined;
  const historia = [...vin.historia].sort((a, b) => a.t - b.t);
  const costumes = historia.filter(RITUAL);
  // REWORK 4: o que você SABE é o fato guardado (`conhecimento`), não a frase "descobriu de onde veio". As descobertas
  // antigas de jeito (curiosidade, preocupações) continuam pelo que dizem.
  const fatos = !p.especie ? saberes(vida, p, vin) : [];
  // REWORK 7.5: de quem morreu, a descoberta antiga escrita no presente ("Tem dois filhos", "Está aposentado") não volta
  // como se fosse de hoje — o fato já está em `fatos`, dito no passado.
  const sabe = historia.filter(h => DESCOBERTA(h) && !/^Descobriu de onde |^Entendeu o trabalho de /.test(h.texto) && !fatos.some(f => fraseDoSaber(vida, p, f) === h.texto)
    && (p.vivo || !PRESENTE_DO_SABER.test(h.texto)));
  const falta = !p.especie && p.vivo ? pendentes(vida, p, vin).length : 0;
  const ganhou = presentesDados(p);
  const narrada = historia.filter(h => !RITUAL(h) && !DESCOBERTA(h));
  const ultima = [...narrada].reverse().find(h => vida.t - h.t <= 24);
  const vidaDele = ehDescendente(papel) && p.vivo ? vidaPropria(p) : [];
  const gest = gestacaoEmCurso(vida);
  const esperando = gest?.descoberta && (gest.gestanteId === p.id || (gest.gestanteId === 'eu' && gest.outroId === p.id));
  const dele = flex(p.genero, 'dele', 'dela', 'delu');
  const estado = p.vivo && !p.especie ? estadoDaRelacao(vida, vin) : undefined;

  const chamado = acoes.filter(x => x.id === 'chamado_sim' || x.id === 'chamado_nao');
  const pri = p.vivo ? prioridadesDaFicha(vida, p.id) : { ids: [] as string[], porque: undefined as string | undefined };
  const agoraIds = new Set(pri.ids);
  // REWORK 10 · UX-14: as ações por categoria (as situações de uma relação), só as que existem para esta pessoa agora.
  // REWORK 10.5 · UX-14/UX-15: o contador é o que DÁ para fazer agora (antes, contava também o que a tela escondia — o
  // convite impossível de Romance, a adoção — e a categoria abria vazia). O impossível não entra; o que já foi feito
  // neste ano vira uma linha ("Já neste ano"), não um botão cinza a mais em cada interação; o que existe mas não dá
  // agora aparece com o motivo, e a categoria só com isso diz que não há o que fazer agora.
  const veredito = (id: string) => disponibilidade(vida, { tipo: 'pessoa', pessoaId: p.id, interacao: id });
  const feitaNoAno = (id: string) => vida.anoAtual.acoes.includes(`pessoa:${id}:${p.id}`);
  const grupos = ORDEM_DOS_GRUPOS.map(id => {
    const todas = acoes.filter(x => x.id !== 'chamado_sim' && x.id !== 'chamado_nao' && grupoDaInteracao(x.id) === id && !agoraIds.has(x.id) && veredito(x.id).grau !== 'impossivel');
    const feitas = todas.filter(x => feitaNoAno(x.id));
    const lista = todas.filter(x => !feitaNoAno(x.id));
    const podem = lista.filter(x => podeTentar(veredito(x.id))).length;
    const extra = id === 'conviver' ? usosComEla : [];
    const adocao = id === 'decisoes' && papel === 'parceiro' && idade(vida) >= 18 && disponibilidade(vida, { tipo: 'adotar' }).grau !== 'impossivel';
    const n = podem + extra.length + (adocao && podeTentar(disponibilidade(vida, { tipo: 'adotar' })) ? 1 : 0);
    return { id, rotulo: ROTULO_DO_GRUPO[id], lista, feitas, extra, adocao, n, existe: lista.length + feitas.length + extra.length + (adocao ? 1 : 0) };
  }).filter(g => g.existe > 0);
  const [parte, setParte] = useState<'agora' | 'voces' | 'quem'>('agora');
  const botao = (x: { id: string; variante?: 'principal' | 'secundario' | 'discreto' | 'perigo'; chance?: boolean }, destaque = false) => (
    <BotaoAcao key={x.id} vida={vida} acao={{ tipo: 'pessoa', pessoaId: p.id, interacao: x.id }} agir={agir} variante={destaque ? 'principal' : x.variante === 'principal' ? 'secundario' : x.variante} mostrarChance={x.chance}>
      {rotuloInteracao(vida, p.id, x.id)}
    </BotaoAcao>
  );
  const passos = narrada.map((h, k) => ({ chave: `${h.t}:${k}`, quando: anoDe(h.t), texto: h.texto, peso: ((h.peso ?? 1) >= 3 ? 3 : (h.peso ?? 1) >= 2 ? 2 : 1) as 1 | 2 | 3 })).reverse();
  // Os momentos importantes (o que pesou: o começo, o casamento, a briga séria, a reconciliação, a separação).
  const importantes = narrada.filter(h => (h.peso ?? 1) >= 3 || h.tipo === 'casamento' || h.tipo === 'conflito').slice(-6).reverse();
  const conflito = p.vivo && !p.especie ? conflitoPendente(vida, vin) : undefined;
  const PARTES_FICHA: { id: 'agora' | 'voces' | 'quem'; rotulo: string }[] = [
    { id: 'agora', rotulo: p.vivo ? 'Agora' : 'Lembrar' }, { id: 'voces', rotulo: p.especie ? 'Histórias' : 'Vocês dois' }, { id: 'quem', rotulo: p.especie ? 'Como está' : `Quem é ${p.nome || 'o bebê'}` }
  ];
  const fora = (x: string) => (parte === x ? '' : ' ficha__parte--fora');

  return (
    <Folha rotulo={p.nome || 'Bebê'} aoFechar={aoFechar} largura="larga">
      <div className={`ficha ficha--relacao${estado ? ` ficha--${estado}` : ''}`}>
        <div className="ficha__topo">
          <Retrato visual={p.visual} genero={p.genero} idade={ip} semente={p.pet?.semente ?? p.id} tamanho={104} especie={p.especie} porte={p.pet?.porte} rotulo={p.nome} falecido={!p.vivo} expressao={expressaoNpc(vida, p)} />
          <div className="ficha__identidade">
            <h2 className="ficha__nome">{p.nome || 'Bebê'} {!p.especie && <span className="ficha__sobrenome">{p.sobrenome}</span>}</h2>
            <p className="ficha__rotulo">{rotuloDe(vida, p, vin)}{estado && ROTULO_ESTADO[estado] ? <span className={`ficha__estado ficha__estado--${estado}`}> · {ROTULO_ESTADO[estado]}</span> : null}</p>
            {p.vivo && !p.especie && <BarraRelacao vida={vida} vin={vin} grande />}
            <p className="ficha__meta">
              {p.vivo ? `${ip} ${ip === 1 ? 'ano' : 'anos'}` : `${anoDe(p.tNasc)} — ${p.tMorte ? anoDe(p.tMorte) : ''}`}
              {agora ? ` · ${agora}` : ''}
              {p.vivo && !p.especie && p.municipioId !== vida.moradia.municipioId ? ` · ${nomeLugar(p.municipioId)}` : ''}
            </p>
            {como && <p className="ficha__prox">{como}</p>}
          </div>
        </div>

        <div role="tablist" aria-label={`A ficha de ${p.nome || 'o bebê'}`} className="ficha__partes" onKeyDown={navegarAbas}>
          {PARTES_FICHA.map(x => (
            <button key={x.id} type="button" role="tab" id={`ficha-parte-${x.id}`} aria-selected={parte === x.id} aria-controls={`ficha-painel-parte-${x.id}`} tabIndex={parte === x.id ? 0 : -1}
              className={`ficha__parte-aba${parte === x.id ? ' ficha__parte-aba--ativa' : ''}`} onClick={() => setParte(x.id)}>{x.rotulo}</button>
          ))}
        </div>

        {/* As três partes ficam na página (a de fora só não aparece): nada some — e o teclado chega a tudo pela aba. */}
        <div role="tabpanel" id="ficha-painel-parte-agora" aria-labelledby="ficha-parte-agora" className={`ficha__parte ficha__parte--agora${fora('agora')}`}>
          {p.vivo && !p.especie && (
            <ul className="laco" aria-label="Como está o laço">
              {lacoEmPalavras(vin, vida.t).map(x => <li key={x.id} className={`laco__item laco__item--${x.tom}`}><span className="laco__rotulo">{x.rotulo}</span><span className="laco__palavra">{x.palavra}</span></li>)}
            </ul>
          )}
          {/* REWORK 10.5 · REL-07: os estados de agora (podem ser vários: brigados e magoados; afastados e com a confiança abalada)
              e o que ficou da briga — o motivo, há quanto tempo, quem tentou reparar e como terminou. */}
          {p.vivo && !p.especie && (() => {
            const estados = estadosContextuais(vida, vin);
            const magoa = fraseDaMagoa(vida, vin, p);
            if (!estados.length && !magoa) return null;
            return (
              <div className="ficha__estados" aria-label="O estado da relação">
                {estados.length > 0 && <ul className="ficha__estados-lista">{estados.map(x => <li key={x} className={`ficha__estado-chip ficha__estado-chip--${x}`}>{rotuloEstadoContextual(x, p)}</li>)}</ul>}
                {magoa && <p className="ficha__magoa">{magoa}</p>}
              </div>
            );
          })()}
          {conflito && (
            <div className={`ficha__conflito ficha__conflito--${conflito.grau}`} role="note" aria-label="Conflito pendente">
              <p className="ficha__conflito-titulo">{conflito.titulo}</p>
              <p className="ficha__conflito-texto">{conflito.texto}</p>
            </div>
          )}
          {ultima && <p className="ficha__ultima"><span className="ficha__ano">{anoDe(ultima.t)}</span> {ultima.texto}</p>}
          {p.vivo && papel === 'parceiro' && <PlanejarCasamento vida={vida} p={p} vin={vin} agir={agir} />}
          {p.vivo && papel === 'parceiro' && vin.romance?.estagio === 'casamento' && <LuaDeMel vida={vida} agir={agir} />}
          {esperando && gest && <p className="ficha__nota">Um bebê a caminho — o parto é previsto para {MESES[mesDe(gest.tParto)]} de {anoDe(gest.tParto)}.</p>}
          {p.vivo && p.especie && <FichaPet vida={vida} agir={agir} p={p} />}
          {!p.vivo && <EmMemoria vida={vida} p={p} agir={agir} />}

          {p.vivo && (acoes.length > 0 || (!p.especie && idade(vida) >= 10)) && (
            <section className="ficha__conviver" aria-label={`Conviver com ${p.nome || 'o bebê'}`}>
              {vin.chamado && (
                <p className="ficha__chamado"><span className="ficha__ano">{anoDe(vin.chamado.t)}</span> {vin.chamado.texto} <span className="ficha__chamado-nota">{vin.chamado.tipo === 'apoio' ? 'Aconteceu — e dá para responder.' : 'Espera uma resposta; o silêncio também responde.'}</span></p>
              )}
              {acoes.length > 0 && (
                <div className="ficha__acoes">
                  {chamado.length > 0 && (
                    <div className="ficha__grupo ficha__grupo--chamado">
                      <h3 className="ficha__subtitulo">Como reagir</h3>
                      <div className="grupo-acoes">{chamado.map(x => botao(x))}</div>
                    </div>
                  )}
                  {pri.ids.length > 0 && (
                    <div className="ficha__agora">
                      <h3 className="ficha__subtitulo">O que faz sentido agora</h3>
                      {pri.porque && <p className="ficha__porque">{pri.porque}</p>}
                      <div className="grupo-acoes">{pri.ids.map(id => acoes.find(x => x.id === id)).filter(Boolean).map((x, k) => botao(x!, k === 0))}</div>
                    </div>
                  )}
                  {grupos.length > 0 && (
                    <div className="ficha__categorias" aria-label="Tudo o que dá para fazer, por situação" role="group">
                      {grupos.map((g, k) => (
                        <details key={g.id} className={`ficha__categoria ficha__grupo ficha__grupo--${g.id}`} open={k === 0 && !pri.ids.length}>
                          <summary className="ficha__categoria-titulo">{g.rotulo}<span className={`ficha__categoria-conta${g.n ? '' : ' ficha__categoria-conta--zero'}`} aria-label={g.n ? `${g.n} ${g.n === 1 ? 'ação possível' : 'ações possíveis'} agora` : 'nada possível agora'}>{g.n || '—'}</span></summary>
                          {g.n === 0 && <p className="ficha__categoria-vazia">{g.feitas.length && !g.lista.length ? 'O que dava para fazer aqui você já fez neste ano.' : 'Nada disso dá para fazer agora — o motivo está em cada uma.'}</p>}
                          {g.feitas.length > 0 && <p className="ficha__categoria-feitas">Já neste ano: {g.feitas.map(x => rotuloInteracao(vida, p.id, x.id)).join(' · ')}.</p>}
                          <div className="grupo-acoes">
                            {g.lista.map(x => botao(x))}
                            {g.extra.map(x => <BotaoAcao key={`${x.t.id}:${x.uso.id}`} vida={vida} acao={{ tipo: 'usar_coisa', coisaTidaId: x.t.id, uso: x.uso.id, pessoaId: p.id }} agir={agir} variante="secundario">{(x.uso.rotuloCom ?? x.uso.rotulo).replace('{nome}', p.nome)}</BotaoAcao>)}
                            {g.adocao && <BotaoAcao vida={vida} acao={{ tipo: 'adotar' }} agir={agir} variante="discreto">Entrar juntos com um pedido de adoção</BotaoAcao>}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!p.especie && <PresenteERede vida={vida} p={p} vin={vin} agir={agir} />}
            </section>
          )}
        </div>

        <div role="tabpanel" id="ficha-painel-parte-voces" aria-labelledby="ficha-parte-voces" className={`ficha__parte ficha__parte--voces${fora('voces')}`}>
          {trajetoria && (vin.fases?.length ?? 0) > 1 && <p className="ficha__origem ficha__trajetoria" aria-label="A trajetória de vocês">{trajetoria}</p>}
          {p.vivo && !p.especie && <CaminhoDaAmizade vida={vida} p={p} vin={vin} />}
          {importantes.length > 0 && (
            <div className="ficha__momentos">
              <h3 className="ficha__subtitulo">Momentos importantes</h3>
              <ul className="ficha__momentos-lista">{importantes.map((h, k) => <li key={k}><span className="ficha__ano">{anoDe(h.t)}</span> {h.texto}</li>)}</ul>
            </div>
          )}
          {costumes.length > 0 && (
            <>
              <h3 className="ficha__subtitulo">Coisas de vocês</h3>
              <ul className="ficha__costumes">{costumes.map((h, k) => <li key={k}>{h.texto}</li>)}</ul>
            </>
          )}
          {narrada.length > 0 ? (
            <div className="ficha__historia">
              <h3>O que viveram juntos</h3>
              <Percurso rotulo={`O que viveram juntos: ${p.nome}`} passos={passos} mostrar={7} />
            </div>
          ) : <p className="nota">Ainda não há uma história de vocês: ela começa com o que fizerem juntos.</p>}
        </div>

        <div role="tabpanel" id="ficha-painel-parte-quem" aria-labelledby="ficha-parte-quem" className={`ficha__parte ficha__parte--quem${fora('quem')}`}>
          {!p.especie && p.vivo && ip >= 4 && <p className="ficha__jeito">{flex(p.genero, 'Ele', 'Ela', 'Elu')} é {jeitoDe(p)}.</p>}
          {(quem || onde) && <p className="ficha__origem">{[quem, onde].filter(Boolean).join(' ')}</p>}
          {saude && <p className="ficha__origem ficha__saude">Saúde: {saude}.</p>}
          {(fatos.length > 0 || sabe.length > 0) && (
            <>
              <h3 className="ficha__subtitulo">O que você sabe {dele}</h3>
              <ul className="ficha__sabe">
                {fatos.map(f => <li key={f.k}>{fraseDoSaber(vida, p, f)}</li>)}
                {sabe.slice(-3).map((h, k) => <li key={`h${k}`}>{h.texto}</li>)}
              </ul>
            </>
          )}
          {falta > 0 && p.vivo && <p className="nota">{fatos.length + sabe.length <= 1 ? 'Vocês ainda se conhecem pouco: o resto, só convivendo.' : 'Ainda há coisas que você não sabe.'}</p>}
          {ganhou.length > 0 && <p className="ficha__jeito">{p.vivo ? 'Tem' : 'Tinha'}, presente seu: {ganhou.join(', ')}.</p>}
          {vidaDele.length > 0 && (
            <div className="ficha__historia">
              <h3>A vida {dele}</h3>
              <ul>{vidaDele.map((t, k) => <li key={k}>{t}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </Folha>
  );
}

/**
 * O conflito que está em aberto com a pessoa (REWORK 10 · UX-14): o que o motor guarda (`Vinculo.conflito` e
 * `ruptura`, a tensão), dito como pendência — com o tamanho e desde quando. Sem conflito, nada.
 */
function conflitoPendente(vida: Vida, vin: Vinculo): { titulo: string; texto: string; grau: 'leve' | 'serio' | 'ruptura' } | undefined {
  if (vin.ruptura && vida.t - vin.ruptura.t <= 60) return { titulo: 'Romperam', texto: `${vin.ruptura.porque ? `${cap(vin.ruptura.porque)}. ` : ''}Desde ${anoDe(vin.ruptura.t)}, cada um para o seu lado — reconstruir pede tempo e um primeiro passo.`, grau: 'ruptura' };
  const c = vin.conflito;
  if (c && vida.t - c.t <= 36) {
    const tamanho = c.gravidade >= 3 ? 'Um conflito sério' : c.gravidade === 2 ? 'Uma briga de verdade' : 'Um desentendimento';
    return { titulo: 'Conflito pendente', texto: `${tamanho}${c.assunto ? ` sobre ${c.assunto}` : ''}, desde ${anoDe(c.t)}. ${c.quem === 'eu' ? 'Você começou.' : 'Começou do outro lado.'} Enquanto não se resolve, pesa na relação.`, grau: c.gravidade >= 3 ? 'serio' : 'leve' };
  }
  if (vin.tensao >= 55) return { titulo: 'Clima pesado', texto: 'Não houve uma briga só: o atrito foi se acumulando. Do jeito que está, qualquer conversa pode virar discussão.', grau: 'leve' };
  return undefined;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** O que só um bicho tem na ficha: como está de saúde, de quem cuida, o veterinário. */
function FichaPet({ vida, agir, p }: { vida: Vida; agir: (a: Acao) => boolean; p: Vida['pessoas'][string] }) {
  const info = infoPet(vida, p);
  const d = info.doenca;
  const emCasa = vida.vinculos[p.id]?.convivio.includes('casa');
  const chegou = anoDe(info.tChegada);
  const origem = { abrigo: 'Veio do abrigo', doacao: 'Veio de alguém que não podia ficar', ninhada: 'Veio de uma ninhada', rua: 'Apareceu na porta', criador: info.documentado ? 'Veio de um criadouro autorizado, com nota e marcação' : 'Veio de um criador', familia: 'Já era da família', loja: 'Veio de uma loja de animais', ilegal: 'Veio de uma feira, sem nota nem anilha' }[info.origem];
  return (
    <div className="ficha-pet">
      <p className="ficha-pet__estado">{estadoDoPet(vida, p).charAt(0).toUpperCase() + estadoDoPet(vida, p).slice(1)}.</p>
      <p className="nota">{origem}{info.origem === 'familia' ? '' : `, em ${chegou}`}. {info.jeito.charAt(0).toUpperCase() + info.jeito.slice(1)}.{info.tutor === 'familia' ? ' Quem cuida é a família.' : ''}</p>
      {info.fugiu !== undefined && <p className="nota">Fugiu em {anoDe(info.fugiu)} e não foi encontrad{animal(p.especie).generoFixo === 'f' ? 'a' : 'o'}.</p>}
      {info.instituicao && <p className="nota">Vive agora com {info.instituicao}.</p>}
      {EXOTICOS[p.especie!] && info.tutor === 'eu' && info.fugiu === undefined && (
        <p className="nota">{EXOTICOS[p.especie!]!.ambiente}; {EXOTICOS[p.especie!]!.alimentacao}; {EXOTICOS[p.especie!]!.social}.{temInstalacao(vida, EXOTICOS[p.especie!]!.instalacao) ? '' : ' Sem a instalação certa em casa: adoece e foge com mais facilidade.'}{info.cuidador ? ' Tem alguém pago cuidando no dia a dia.' : ''}</p>
      )}
      {info.origem === 'ilegal' && <p className="nota nota--ruim"><span aria-hidden>! </span>Sem documento, é crime manter um silvestre ({textoLocal(vida, 'leiDeFauna')}): a fiscalização pode levar e multar. Entregar por conta própria não tem multa.</p>}
      <div className="grupo-acoes grupo-acoes--linha">
        {info.origem === 'ilegal' && <BotaoAcao vida={vida} acao={{ tipo: 'entregar_pet', petId: p.id }} agir={agir} variante="secundario">Entregar ao órgão ambiental</BotaoAcao>}
        {d && <BotaoAcao vida={vida} acao={{ tipo: 'veterinario', petId: p.id, opcao: 'tratar' }} agir={agir}>{`Tratar (${dinheiroCurto(custoDoTratamento(vida, p, true))})`}</BotaoAcao>}
        {d && <BotaoAcao vida={vida} acao={{ tipo: 'veterinario', petId: p.id, opcao: 'basico' }} agir={agir} variante="discreto" ocultarBloqueado>{`O tratamento possível (${dinheiroCurto(custoDoTratamento(vida, p, false))})`}</BotaoAcao>}
        {d && <BotaoAcao vida={vida} acao={{ tipo: 'veterinario', petId: p.id, opcao: 'paliativo' }} agir={agir} variante="discreto" ocultarBloqueado>Cuidar para que não sofra</BotaoAcao>}
        {!d && <BotaoAcao vida={vida} acao={{ tipo: 'veterinario', petId: p.id, opcao: 'consulta' }} agir={agir} variante="discreto" ocultarBloqueado>{`Levar ao veterinário (${dinheiroCurto(custoDaConsulta(vida))})`}</BotaoAcao>}
        {!emCasa && <BotaoAcao vida={vida} acao={{ tipo: 'levar_pet', petId: p.id }} agir={agir} variante="discreto" ocultarBloqueado>Trazer para a sua casa</BotaoAcao>}
        {/* REWORK 12.2: quem viaja ou trabalha muito paga alguém para cuidar; quem tem um zoológico pode entregar o bicho à instituição. */}
        {emCasa && info.tutor === 'eu' && <BotaoAcao vida={vida} acao={{ tipo: 'pet_cuidador', petId: p.id, ligar: !info.cuidador }} agir={agir} variante="discreto" ocultarBloqueado>{info.cuidador ? 'Dispensar o cuidador' : 'Pagar alguém para cuidar no dia a dia'}</BotaoAcao>}
        {emCasa && zoologicosParaOPet(vida, p).map(({ e }) => <BotaoAcao key={e.id} vida={vida} acao={{ tipo: 'pet_ao_zoo', petId: p.id, empresaId: e.id }} agir={agir} variante="discreto">{`Entregar ao ${e.nome}`}</BotaoAcao>)}
      </div>
    </div>
  );
}

/** O título de Pessoas: quem divide a vida com você, em palavras. */
function tituloDePessoas(v: Vida, nucleo: { p: Pessoa }[]): string {
  const par = parceiro(v);
  if (par) return nucleo.length > 1 ? `A vida com ${par.p.nome} e mais ${nucleo.length - 1}` : `A vida com ${par.p.nome}`;
  if (nucleo.length) return `Perto: ${nucleo.slice(0, 2).map(x => x.p.nome).join(' e ')}${nucleo.length > 2 ? ` e mais ${nucleo.length - 2}` : ''}`;
  return 'Gente da sua vida';
}

/**
 * "GOSTEI DESSA PESSOA. COMO TENTO ME APROXIMAR?" — o caminho, dito na ficha
 * de quem ainda não é amigo (Relações 2.0). Não é uma barra: conviver abre a
 * chance; um gesto correspondido (seu ou da pessoa) é o que faz uma amizade
 * acontecer — e afinidade, tempo e o jeito de cada um decidem o resto.
 */
function CaminhoDaAmizade({ vida, p, vin }: { vida: Vida; p: Pessoa; vin: Vinculo }) {
  if (vin.parentesco || vin.romance || idade(vida) < 12 || idadePessoa(vida, p) < 12) return null;
  const papel = papelDe(p, vin);
  if (papel !== 'colega' && papel !== 'conhecido') return null;
  const convivem = vin.convivio.length > 0;
  const gesto = vin.aproximacao !== undefined && vida.t - vin.aproximacao <= 24;
  const texto = !convivem
    ? 'Hoje vocês não convivem: sem um lugar em comum (a escola, o trabalho, uma atividade), uma amizade quase não tem por onde começar.'
    : gesto
      ? 'Já houve um gesto correspondido entre vocês. Agora é tempo: convivendo, a amizade pode acontecer — se a afinidade ajudar.'
      : `Vocês convivem${descricaoOrigem(vida, vin) === 'por aí' ? '' : ` ${descricaoOrigem(vida, vin)}`}. Conviver abre a chance; uma amizade começa quando alguém dá um passo (chamar para algo) e o outro vem.`;
  return <p className="ficha__origem ficha__caminho" aria-label="Como uma amizade nasce">{texto}</p>;
}

/**
 * REWORK 4: o presente (do catálogo das lojas, com o gosto da pessoa à vista) e o contato digital (seguir, deixar de
 * seguir, bloquear) — na ficha de quem recebe, não num catálogo à parte.
 */
const TIPO_DO_PRESENTE: Record<string, string> = { eletronicos: 'eletrônico', casa: 'para a casa', instrumentos: 'instrumento', esportes: 'esporte', livraria: 'livros e papelaria' };

function PresenteERede({ vida, p, vin, agir }: { vida: Vida; p: Pessoa; vin: Vinculo; agir: (a: Acao) => boolean }) {
  const [presentes, setPresentes] = useState(false);
  const conta = contasAtivas(vida).length > 0;
  const ip = idadePessoa(vida, p);
  const bloqueado = vin.digital?.bloqueado !== undefined;
  const lista = presentes ? presentesPara(vida, p.id).slice(0, 8) : [];
  const GOSTO = { certeiro: 'a cara dela', bom: 'deve gostar', neutro: '' } as const;
  return (
    <div className="ficha__extras">
      {bloqueado && <p className="ficha__nota-rede">Você bloqueou {p.nome} na rede. Enquanto isso, quase nada entre vocês acontece.</p>}
      {idade(vida) >= 10 && !bloqueado && (
        <div className="ficha__presente">
          <button type="button" className="botao botao--discreto" aria-expanded={presentes} onClick={() => setPresentes(x => !x)}>{presentes ? 'Fechar os presentes' : `Dar um presente a ${p.nome}`}</button>
          {presentes && (
            <ul className="presentes">
              {lista.map(x => (
                // REWORK 8 (correção): o nome, o tipo, a descrição, o preço e o gosto numa coluna que nunca encolhe a zero; o
                // botão na sua; o motivo de não dar (o dinheiro, o ano) numa linha própria, embaixo — antes ele morava na
                // coluna do botão, a coluna crescia até caber a frase e espremia o nome letra por letra.
                <li key={x.coisa.id} className={`presente${podeTentar(x.veredito) ? '' : ' presente--bloqueado'}`}>
                  <DesenhoObjeto coisaId={x.coisa.id} tamanho={40} rotulo={x.coisa.nome} />
                  <span className="presente__texto">
                    <strong className="presente__nome">{x.coisa.nome.charAt(0).toUpperCase() + x.coisa.nome.slice(1)}</strong>
                    <span className="presente__tipo">{TIPO_DO_PRESENTE[x.coisa.loja]} · {precoCurto(x.preco)}{GOSTO[x.gosto] ? ` · ${GOSTO[x.gosto].replace('dela', p.genero === 'feminino' ? 'dela' : p.genero === 'masculino' ? 'dele' : 'delu')}` : ''}</span>
                    <span className="presente__descricao">{x.coisa.descricao}</span>
                  </span>
                  <BotaoAcao vida={vida} acao={{ tipo: 'presentear', pessoaId: p.id, coisaId: x.coisa.id }} agir={agir} variante={x.gosto === 'certeiro' ? 'principal' : 'secundario'}>Dar</BotaoAcao>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {conta && ip >= 13 && (
        <div className="grupo-acoes grupo-acoes--linha ficha__rede">
          {!bloqueado && !vin.digital?.segue && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'seguir', pessoaId: p.id } }} agir={agir} variante="discreto">Seguir nas redes</BotaoAcao>}
          {!bloqueado && vin.digital?.segue && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'deixar', pessoaId: p.id } }} agir={agir} variante="discreto">Deixar de seguir</BotaoAcao>}
          {!bloqueado && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'bloquear', pessoaId: p.id } }} agir={agir} variante="perigo">Bloquear</BotaoAcao>}
          {bloqueado && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'desbloquear', pessoaId: p.id } }} agir={agir} variante="secundario">Desbloquear</BotaoAcao>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------- REWORK 9: a vida deles, a nossa história */

const NAO_ANDAM = new Set(['tecnico']);

/**
 * A VIDA DELES: o que aconteceu com quem está na sua vida, do mais recente ao mais antigo — as trajetórias que o motor
 * registra para cada pessoa (o emprego, a formatura, o namoro, o filho, a perda do trabalho). Família continua família
 * mesmo sem contato. Nada inventado: sem registro, a pessoa não aparece aqui.
 */
function AVidaDeles({ vida, abrir }: { vida: Vida; abrir: (id: string | null) => void }) {
  const itens = Object.values(vida.vinculos).flatMap(vin => {
    const p = vida.pessoas[vin.pessoaId];
    if (!p || p.especie || !p.vida?.trajetoria?.length) return [];
    return p.vida.trajetoria.filter(t => !NAO_ANDAM.has(t.tipo)).map(t => ({ p, vin, t }));
  }).sort((a, b) => b.t.t - a.t.t).slice(0, 30);
  if (!itens.length) return <section className="vida-deles" aria-label="A vida deles"><p className="nota">Ainda não há o que contar sobre a vida de quem está perto: o que acontecer com cada um aparece aqui.</p></section>;
  return (
    <section className="vida-deles" aria-label="A vida deles">
      <ol className="vida-deles__lista">
        {itens.map((x, k) => (
          <li key={`${x.p.id}${x.t.t}${k}`} className={`vida-deles__item vida-deles__item--${x.t.tipo}`}>
            <span className="vida-deles__ano">{anoDe(x.t.t)}</span>
            <button type="button" className="vida-deles__quem" onClick={() => abrir(x.p.id)} aria-label={`Abrir ${x.p.nome}`}>
              <Retrato visual={x.p.visual} genero={x.p.genero} idade={idadePessoa(vida, x.p)} semente={x.p.pet?.semente ?? x.p.id} tamanho={32} especie={x.p.especie} porte={x.p.pet?.porte} rotulo={x.p.nome} falecido={!x.p.vivo} />
            </button>
            <span className="vida-deles__texto"><span className="vida-deles__papel">{rotuloDe(vida, x.p, x.vin)}</span> {x.t.texto}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const TIPO_MEMORIA: Record<string, string> = {
  inicio: 'Como começou', amizade: 'Amizade', romance: 'Amor', casamento: 'Casamento', filho: 'Filhos', casa: 'Casa', escola: 'Escola', trabalho: 'Trabalho',
  conflito: 'Conflito', reconciliacao: 'Reconciliação', apoio: 'Apoio', ritual: 'Rituais', distancia: 'Distância', traicao: 'Traição', perda: 'Perda', antigo: 'Antes', descoberta: 'Descobertas'
};

/**
 * NOSSA HISTÓRIA: o que vocês viveram juntos — as memórias que as relações guardam (só o que aconteceu: o apoio dado ou
 * recebido, a briga, a reconciliação, o que fizeram juntos), da mais recente para a mais antiga, com quem foi.
 */
function NossaHistoria({ vida, abrir }: { vida: Vida; abrir: (id: string | null) => void }) {
  const [so, setSo] = useState<string | null>(null);
  const todas = Object.values(vida.vinculos).flatMap(vin => {
    const p = vida.pessoas[vin.pessoaId];
    if (!p || p.especie) return [];
    return vin.historia.map(m => ({ p, vin, m }));
  }).sort((a, b) => b.m.t - a.m.t);
  const tipos = [...new Set(todas.map(x => x.m.tipo).filter((t): t is NonNullable<typeof t> => !!t))];
  const lista = todas.filter(x => !so || x.m.tipo === so).slice(0, 40);
  if (!todas.length) return <section className="nossa-historia" aria-label="Nossa história"><p className="nota">Ainda não há memórias guardadas com ninguém: o que vocês viverem juntos aparece aqui.</p></section>;
  return (
    <section className="nossa-historia" aria-label="Nossa história">
      {tipos.length > 1 && (
        <div className="grupo-acoes grupo-acoes--linha nossa-historia__filtros" role="group" aria-label="Que memórias">
          <button type="button" className={`botao botao--discreto${so === null ? ' botao--ativo' : ''}`} aria-pressed={so === null} onClick={() => setSo(null)}>Todas</button>
          {tipos.map(t => <button key={t} type="button" className={`botao botao--discreto${so === t ? ' botao--ativo' : ''}`} aria-pressed={so === t} onClick={() => setSo(t)}>{TIPO_MEMORIA[t] ?? t}</button>)}
        </div>
      )}
      <ol className="nossa-historia__lista">
        {lista.map((x, k) => (
          <li key={`${x.p.id}${x.m.t}${k}`} className={`nossa-historia__item nossa-historia__item--peso${x.m.peso ?? 1}`}>
            <span className="vida-deles__ano">{anoDe(x.m.t)}</span>
            <button type="button" className="vida-deles__quem" onClick={() => abrir(x.p.id)} aria-label={`Abrir ${x.p.nome}`}>
              <Retrato visual={x.p.visual} genero={x.p.genero} idade={idadePessoa(vida, x.p)} semente={x.p.pet?.semente ?? x.p.id} tamanho={32} especie={x.p.especie} porte={x.p.pet?.porte} rotulo={x.p.nome} falecido={!x.p.vivo} />
            </button>
            <span className="vida-deles__texto"><span className="vida-deles__papel">{x.p.nome}{x.m.tipo ? ` · ${(TIPO_MEMORIA[x.m.tipo] ?? x.m.tipo).toLowerCase()}` : ''}</span> {x.m.texto}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
