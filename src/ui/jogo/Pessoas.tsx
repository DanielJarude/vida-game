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

import { useState } from 'react';
import type { Atracao, Marco, Pessoa, Vida, Vinculo } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { LIMITE_INTERACOES } from '../../motor/acoes';
import { idade, idadePessoa, jeitoDe, parceiro } from '../../motor/nucleo';
import { nomeLugar } from '../../motor/dados/lugares';
import { flex } from '../../motor/texto';
import { anoDe, MESES, mesDe } from '../../motor/tempo';
import { gestacaoEmCurso } from '../../motor/sistemas/familia';
import { interacoesPara, rotuloInteracao } from '../../motor/sistemas/interacoes';
import { ehDescendente, faseDeIdade, papelDe } from '../../motor/sistemas/vinculos';
import { rotuloDe } from '../apresentar';
import { circulos, comoEsta, etiqueta, ondeEsta, quemE, sinaisSociais, vidaPropria, type Par } from '../leitura';
import { BotaoAcao, Escolha, Folha, Secao, Vazio } from '../comum';
import { Retrato, type Expressao } from '../avatar/Retrato';

interface Props { vida: Vida; agir: (a: Acao) => boolean; aberta: string | null; abrir: (id: string | null) => void }

export function Pessoas({ vida, agir, aberta, abrir }: Props) {
  const c = circulos(vida);
  const usadas = vida.anoAtual.acoes.filter(a => a.startsWith('pessoa:')).length;
  const restam = Math.max(0, LIMITE_INTERACOES - usadas);
  const pessoa = aberta ? vida.pessoas[aberta] : null;
  const i = idade(vida);
  const moraComPais = vida.moradia.tipo === 'pais' || vida.moradia.tipo === 'parente';
  const vazio = !c.nucleo.length && !c.familia.length && !c.amigos.length && !c.contexto.length;
  const sinais = sinaisSociais(vida).filter(x => x.pessoaId && vida.pessoas[x.pessoaId]);
  return (
    <div className="pessoas">
      {sinais.length > 0 && (
        <section className="atencao" aria-label="Pedem atenção">
          <h2 className="atencao__titulo">Pedem atenção</h2>
          <ul className="atencao__lista">
            {sinais.map((x, k) => {
              const p = vida.pessoas[x.pessoaId!];
              return (
                <li key={k}>
                  <button type="button" className="atencao__item" onClick={() => abrir(p.id)}>
                    <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={40} rotulo={p.nome} expressao={expressaoNpc(vida, p)} falecido={!p.vivo} />
                    <span>{x.texto}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {c.nucleo.length > 0 && (
        <Secao titulo={tituloNucleo(vida, c.nucleo, moraComPais)}>
          <ul className={`nucleo nucleo--${Math.min(c.nucleo.length, 4)}`}>
            {c.nucleo.map(x => <li key={x.p.id}><CartaoNucleo vida={vida} x={x} abrir={abrir} /></li>)}
          </ul>
        </Secao>
      )}

      {(c.familia.length > 0 || c.familiaExtensa.length > 0) && (
        <Secao titulo="Família" recolhivel aberta>
          <Lista vida={vida} itens={c.familia} abrir={abrir} />
          {c.familiaExtensa.length > 0 && <Dobra rotulo={`Outros parentes (${c.familiaExtensa.length})`}><Lista vida={vida} itens={c.familiaExtensa} abrir={abrir} /></Dobra>}
        </Secao>
      )}
      {c.amigos.length > 0 && <Secao titulo="Amigos" recolhivel aberta><Rostos vida={vida} itens={c.amigos} abrir={abrir} /></Secao>}
      {c.contexto.length > 0 && <Secao titulo={i < 18 ? 'Da escola e do bairro' : 'Do dia a dia'} recolhivel aberta={c.contexto.length <= 5}><Lista vida={vida} itens={c.contexto} abrir={abrir} /></Secao>}
      {c.passado.length > 0 && <Secao titulo="Gente que passou" recolhivel aberta={false}><Lista vida={vida} itens={c.passado} abrir={abrir} /></Secao>}
      {c.mortos.length > 0 && <Secao titulo="Quem se foi" recolhivel aberta={false}><Lista vida={vida} itens={c.mortos} abrir={abrir} /></Secao>}
      {vazio && <Vazio>Ninguém por perto ainda.</Vazio>}

      <p className="dica pessoas__tempo">
        {restam === 0 ? 'O tempo deste ano para as pessoas acabou.' : `Neste ano ainda há tempo para ${restam} ${restam === 1 ? 'momento' : 'momentos'} com as pessoas.`}
        {' '}Quem convive com você continua perto sem esforço; quem está longe, esfria.
      </p>

      <Voce vida={vida} agir={agir} />
      {pessoa && <FichaPessoa vida={vida} p={pessoa} vin={vida.vinculos[pessoa.id]} agir={agir} aoFechar={() => abrir(null)} />}
    </div>
  );
}

/** O rosto de alguém reflete o momento dela quando algo pesa (luto, doença, separação). */
function expressaoNpc(vida: Vida, p: Pessoa): Expressao {
  if (!p.vivo) return 'neutro';
  if (p.aperto && vida.t - p.aperto.t <= 24) return p.aperto.tipo === 'doenca' ? 'doente' : p.aperto.tipo === 'fase' || p.aperto.tipo === 'desemprego' || p.aperto.tipo === 'dinheiro' ? 'cansado' : 'abatido';
  if (p.saude < 35 && idadePessoa(vida, p) >= 60) return 'doente';
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
      <Retrato visual={p.visual} genero={p.genero} idade={ip} semente={p.id} tamanho={84} especie={p.especie} rotulo={p.nome} expressao={expressaoNpc(vida, p)} />
      <span className="cartao-pessoa__nome">{p.nome || 'Bebê'}</span>
      <span className="cartao-pessoa__papel">{rotuloDe(vida, p, vin)}{p.especie ? '' : ` · ${ip} ${ip === 1 ? 'ano' : 'anos'}`}</span>
      {leitura && <span className="cartao-pessoa__leitura">{leitura}</span>}
      {esperando && gest && <span className="cartao-pessoa__nota">Um bebê a caminho — {MESES[mesDe(gest.tParto)]} de {anoDe(gest.tParto)}.</span>}
    </button>
  );
}

/** Amigos: rostos lado a lado (nome, onde vocês se conhecem, como estão). */
function Rostos({ vida, itens, abrir }: { vida: Vida; itens: Par[]; abrir: (id: string) => void }) {
  const [todos, setTodos] = useState(false);
  const mostrados = todos ? itens : itens.slice(0, 8);
  return (
    <>
      <ul className="rostos">
        {mostrados.map(({ p, vin }) => (
          <li key={p.id}>
            <button type="button" className={`rosto${vin.tensao >= 55 ? ' rosto--tenso' : ''}`} onClick={() => abrir(p.id)}>
              <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={64} rotulo={p.nome} expressao={expressaoNpc(vida, p)} />
              <span className="rosto__nome">{p.nome}</span>
              <span className="rosto__rotulo">{rotuloDe(vida, p, vin)}</span>
              <span className="rosto__prox">{etiqueta(vida, p, vin)}</span>
            </button>
          </li>
        ))}
      </ul>
      {itens.length > 8 && <button type="button" className="dobra__botao" aria-expanded={todos} onClick={() => setTodos(t => !t)}>{todos ? 'Recolher' : `Todos os amigos (${itens.length})`}</button>}
    </>
  );
}

function Lista({ vida, itens, abrir }: { vida: Vida; itens: Par[]; abrir: (id: string) => void }) {
  return (
    <ul className="lista-pessoas">
      {itens.map(({ p, vin }) => (
        <li key={p.id}>
          <button type="button" className={`pessoa${p.vivo ? '' : ' pessoa--falecida'}`} onClick={() => abrir(p.id)}>
            <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={44} especie={p.especie} rotulo={p.nome} falecido={!p.vivo} expressao={expressaoNpc(vida, p)} />
            <span className="pessoa__nome">{p.nome || 'Bebê'}</span>
            <span className="pessoa__rotulo">{rotuloDe(vida, p, vin)}{p.vivo ? ` · ${idadePessoa(vida, p)}` : ''}</span>
            <span className={`pessoa__prox${vin.tensao >= 55 && p.vivo ? ' pessoa__prox--tensa' : ''}`}>{etiqueta(vida, p, vin)}</span>
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

const MAX_ACOES = 4;

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

const DESCOBERTA = (m: Marco) => m.tipo === 'descoberta';
const RITUAL = (m: Marco) => m.tipo === 'ritual';

function FichaPessoa({ vida, p, vin, agir, aoFechar }: { vida: Vida; p: Pessoa; vin: Vinculo; agir: (a: Acao) => boolean; aoFechar: () => void }) {
  const [todas, setTodas] = useState(false);
  const [historiaToda, setHistoriaToda] = useState(false);
  const ip = idadePessoa(vida, p);
  const papel = papelDe(p, vin);
  const acoes = p.vivo ? interacoesPara(vida, p.id) : [];
  const principais = todas ? acoes : acoes.slice(0, MAX_ACOES);
  const quem = quemE(vida, p, vin);
  const onde = ondeEsta(vida, p, vin);
  const como = comoEsta(vida, p, vin);
  const agora = agoraDela(vida, p, vin);
  const historia = [...vin.historia].sort((a, b) => a.t - b.t);
  const costumes = historia.filter(RITUAL);
  const sabe = historia.filter(DESCOBERTA);
  const narrada = historia.filter(h => !RITUAL(h) && !DESCOBERTA(h));
  const importantes = narrada.filter(h => (h.peso ?? 1) >= 2);
  const mostrada = historiaToda || narrada.length <= 7 ? narrada : importantes.length >= 4 ? importantes.slice(-7) : narrada.slice(-7);
  const ultima = [...narrada].reverse().find(h => vida.t - h.t <= 24);
  const vidaDele = ehDescendente(papel) && p.vivo ? vidaPropria(p) : [];
  const gest = gestacaoEmCurso(vida);
  const esperando = gest?.descoberta && (gest.gestanteId === p.id || (gest.gestanteId === 'eu' && gest.outroId === p.id));
  const dele = flex(p.genero, 'dele', 'dela', 'delu');
  return (
    <Folha rotulo={p.nome || 'Bebê'} aoFechar={aoFechar}>
      <div className="ficha">
        <div className="ficha__topo">
          <Retrato visual={p.visual} genero={p.genero} idade={ip} semente={p.id} tamanho={104} especie={p.especie} rotulo={p.nome} falecido={!p.vivo} expressao={expressaoNpc(vida, p)} />
          <div>
            <h2 className="ficha__nome">{p.nome || 'Bebê'} {!p.especie && <span className="ficha__sobrenome">{p.sobrenome}</span>}</h2>
            <p className="ficha__rotulo">{rotuloDe(vida, p, vin)}</p>
            <p className="ficha__meta">
              {p.vivo ? `${ip} ${ip === 1 ? 'ano' : 'anos'}` : `${anoDe(p.tNasc)} — ${p.tMorte ? anoDe(p.tMorte) : ''}`}
              {agora ? ` · ${agora}` : ''}
              {p.vivo && !p.especie && p.municipioId !== vida.moradia.municipioId ? ` · ${nomeLugar(p.municipioId)}` : ''}
            </p>
          </div>
        </div>
        {como && <p className="ficha__prox">{como}</p>}
        {(quem || onde) && <p className="ficha__origem">{[quem, onde].filter(Boolean).join(' ')}</p>}
        {esperando && gest && <p className="ficha__nota">Um bebê a caminho — o parto é previsto para {MESES[mesDe(gest.tParto)]} de {anoDe(gest.tParto)}.</p>}
        {ultima && <p className="ficha__ultima"><span className="ficha__ano">{anoDe(ultima.t)}</span> {ultima.texto}</p>}

        {p.vivo && acoes.length > 0 && (
          <div className="ficha__acoes">
            <h3 className="ficha__subtitulo">O que fazer junto</h3>
            <div className="grupo-acoes">
              {principais.map(x => (
                <BotaoAcao key={x.id} vida={vida} acao={{ tipo: 'pessoa', pessoaId: p.id, interacao: x.id }} agir={agir} variante={x.variante} mostrarChance={x.chance}
                  ocultarImpossivel={x.id === 'convidar'}>
                  {rotuloInteracao(vida, p.id, x.id)}
                </BotaoAcao>
              ))}
              {acoes.length > MAX_ACOES && <button type="button" className="botao botao--discreto" aria-expanded={todas} onClick={() => setTodas(t => !t)}>{todas ? 'Menos' : `Mais (${acoes.length - MAX_ACOES})`}</button>}
              {papel === 'parceiro' && idade(vida) >= 18 && <BotaoAcao vida={vida} acao={{ tipo: 'adotar' }} agir={agir} variante="discreto" ocultarImpossivel>Entrar juntos com um pedido de adoção</BotaoAcao>}
            </div>
          </div>
        )}

        {(costumes.length > 0 || sabe.length > 0 || (!p.especie && p.vivo && ip >= 4)) && (
          <div className="ficha__retrato-dela">
            {!p.especie && p.vivo && ip >= 4 && <p className="ficha__jeito">{flex(p.genero, 'Ele', 'Ela', 'Elu')} é {jeitoDe(p)}.</p>}
            {sabe.length > 0 && (
              <>
                <h3 className="ficha__subtitulo">O que você sabe {dele}</h3>
                <ul className="ficha__sabe">{sabe.slice(-4).map((h, k) => <li key={k}>{h.texto}</li>)}</ul>
              </>
            )}
            {costumes.length > 0 && (
              <>
                <h3 className="ficha__subtitulo">Coisas de vocês</h3>
                <ul className="ficha__costumes">{costumes.map((h, k) => <li key={k}>{h.texto}</li>)}</ul>
              </>
            )}
          </div>
        )}

        {vidaDele.length > 0 && (
          <div className="ficha__historia">
            <h3>A vida {dele}</h3>
            <ul>{vidaDele.map((t, k) => <li key={k}>{t}</li>)}</ul>
          </div>
        )}

        {narrada.length > 0 && (
          <div className="ficha__historia">
            <h3>O que viveram juntos</h3>
            <ul>{mostrada.map((h, k) => <li key={k} className={(h.peso ?? 1) >= 3 ? 'ficha__marco' : ''}><span className="ficha__ano">{anoDe(h.t)}</span> {h.texto}</li>)}</ul>
            {mostrada.length < narrada.length && <button type="button" className="botao botao--discreto" onClick={() => setHistoriaToda(true)}>Toda a história ({narrada.length})</button>}
          </div>
        )}
      </div>
    </Folha>
  );
}
