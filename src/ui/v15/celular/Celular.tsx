/**
 * VIDA 15 · O CELULAR — um aparelho de verdade na mão: a tela inicial (a hora, o mês, as notificações, os aplicativos com
 * os contadores), e cada aplicativo como porta para o que JÁ existe na vida — nada aqui é um sistema paralelo:
 *   Mensagens   as mensagens do ano (`celular15`) e os chamados das pessoas (`iniciativas`), em conversas por pessoa
 *   Namoro      os perfis do ano (curtir/passar, o match é da outra pessoa); as conversas seguem as interações de sempre
 *   Rede        o que as pessoas da sua vida postaram (a trajetória delas) e as suas contas (`Redes`)
 *   Notícias    o jornal do ano (`noticias15`)
 *   Agenda      os programas aceitos, os aniversários de quem importa; a semana mora em Minha Semana
 *   Mapas       onde você está e onde está a sua gente; a cidade e as viagens
 *   Banco       o saldo, o aplicado, as dívidas, o extrato do ano
 *   E-mail      as portas abertas (oportunidades) e as propostas
 *   Fama        o nome público num relance (o painel completo continua em Você · Fama)
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Pessoa, Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { disponibilidade } from '../../../motor/acoes';
import { podeTentar } from '../../../motor/plausibilidade';
import { idade, idadePessoa, vinculosVivos } from '../../../motor/nucleo';
import { anoDe, MESES, mesDe } from '../../../motor/tempo';
import { municipio, nomeLugar } from '../../../motor/dados/lugares';
import { rotulosDoChamado } from '../../../motor/sistemas/iniciativas';
import { extratoAberto } from '../../../motor/sistemas/extrato';
import { leituraDaFama13 } from '../../../motor/sistemas/reconhecimento13';
import { feed15, matches15, naoLidas15, nivelDaFama15, opcoesDaMsg15, rotuloArea, rotuloDoLugar15, tituloDoPost17, disponibilidadeNamoro15 } from '../../../motor/v15/celular/celular15';
import { jornal15, ROTULO_EDITORIA15, type Editoria15 } from '../../../motor/v15/celular/noticias15';
import type { Msg15, PerfilApp15 } from '../../../motor/dados15/celular/tipos';
import { contatosAutorizados17, ligacoesRestantes17, limiteDeLigacoes17, MOTIVO_PRESO17 } from '../../../motor/v17/prisao/telefone17';
import { contatos16, historico16, horaDaMsg16, ROTULO_INTENCAO16, type IntencaoMsg16 } from '../../../motor/v16/celular/mensagens16';
import { Retrato } from '../../avatar/Retrato';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { rotuloDe } from '../../apresentar';
import type { Aba, Lugar } from '../../navegacao';
import './celular15.css';
import { MapaDaCidade } from '../../v17/mapa/MapaDaCidade';
import { temAcesso } from '../../../motor/eras/base/contexto';
import { GUARDAR_O_APARELHO, meioDaVida, NOME_DO_APARELHO } from '../../eras/epoca';
import { CelularDeTeclas, TelefoneDeDisco } from '../../eras/Aparelhos';

const RedesSociais = lazy(() => import('../../jogo/Redes').then(m => ({ default: m.RedesSociais })));

export type App15 = 'inicio' | 'mensagens' | 'namoro' | 'rede' | 'noticias' | 'agenda' | 'mapas' | 'banco' | 'email' | 'fama';

interface Props {
  vida: Vida;
  agir: (a: Acao) => boolean;
  aoFechar: () => void;
  irPara: (a: Aba) => void;
  irLugar: (l: Lugar) => void;
  abrirPessoa: (id: string) => void;
  abrirConvite?: (id: string) => void;
  appInicial?: App15;
}

const ICONES: Record<Exclude<App15, 'inicio'>, string> = {
  mensagens: 'M4 5h16v11H8l-4 4z',
  namoro: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  rede: 'M4 4h16v16H4zM8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0M17 7h.01',
  noticias: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12h7M7 15h4',
  agenda: 'M4 6h16v14H4zM4 10h16M9 3v5M15 3v5',
  mapas: 'M9 4 4 6v14l5-2 6 2 5-2V4l-5 2zM9 4v14M15 6v14',
  banco: 'M3 10 12 4l9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18',
  email: 'M4 6h16v12H4zM4 7l8 6 8-6',
  fama: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z'
};
const NOMES: Record<Exclude<App15, 'inicio'>, string> = { mensagens: 'Mensagens', namoro: 'Namoro', rede: 'Rede', noticias: 'Notícias', agenda: 'Agenda', mapas: 'Mapas', banco: 'Banco', email: 'E-mail', fama: 'Fama' };

function Icone({ d, className }: { d: string; className?: string }) {
  return <svg className={className ?? 'cel__icone'} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

const quando = (v: Vida, t: number) => (anoDe(t) === anoDe(v.t) ? MESES[mesDe(t)].slice(0, 3) : `${MESES[mesDe(t)].slice(0, 3)} ${anoDe(t)}`);
/** VIDA 16: o dia e a hora da mensagem (saem do id: são sempre os mesmos). */
const diaDe = (id: string) => 1 + (parseInt(horaDaMsg16(id + 'd').replace(':', ''), 10) % 28);
const dataHora = (v: Vida, m: Msg15) => `${diaDe(m.id)} ${MESES[mesDe(m.t)].slice(0, 3)}${anoDe(m.t) === anoDe(v.t) ? '' : ` ${anoDe(m.t)}`} · ${horaDaMsg16(m.id)}`;

function Foto({ vida, p, tamanho = 40 }: { vida: Vida; p?: Pessoa; tamanho?: number }) {
  if (!p) return <span className="cel__foto-vazia" style={{ width: tamanho, height: tamanho }} aria-hidden>★</span>;
  return <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={tamanho} rotulo={p.nome} especie={p.especie} falecido={!p.vivo} />;
}

/* ------------------------------------------------------------------ Mensagens: as conversas */

interface Fio { chave: string; pid?: string; nome: string; p?: Pessoa; itens: Item[]; t: number; naoLida: boolean; aberta: boolean }
type Item = { tipo: 'msg'; m: Msg15; arquivada?: boolean } | { tipo: 'chamado'; texto: string; t: number; sim: string; nao: string };

function fiosDe(v: Vida): Fio[] {
  const fios = new Map<string, Fio>();
  const fio = (chave: string, nome: string, p?: Pessoa) => {
    let f = fios.get(chave);
    if (!f) { f = { chave, pid: p?.id, nome, p, itens: [], t: -Infinity, naoLida: false, aberta: false }; fios.set(chave, f); }
    return f;
  };
  // VIDA 16: o histórico inteiro (o do ano e o arquivo), não só as mensagens de agora.
  for (const { m, arquivada } of historico16(v)) {
    const p = m.de ? v.pessoas[m.de] : undefined;
    if (m.de && !p) continue;
    const f = fio(m.de ?? `r:${m.remetente}`, p?.nome ?? m.remetente ?? 'Desconhecido', p);
    f.itens.push({ tipo: 'msg', m, arquivada });
    f.t = Math.max(f.t, m.resposta?.t ?? m.t);
    if (arquivada) continue;
    if (!m.lida && !m.resposta) f.naoLida = true;
    if (!m.resposta && opcoesDaMsg15(v, m).length) f.aberta = true;
  }
  for (const { p, vin } of vinculosVivos(v)) {
    if (!vin.chamado) continue;
    const f = fio(p.id, p.nome, p);
    const r = rotulosDoChamado(p, vin.chamado);
    f.itens.push({ tipo: 'chamado', texto: vin.chamado.texto, t: vin.chamado.t, sim: r.sim, nao: r.nao });
    f.t = Math.max(f.t, vin.chamado.t);
    f.naoLida = true;
    f.aberta = true;
  }
  for (const f of fios.values()) f.itens.sort((a, b) => (a.tipo === 'msg' ? a.m.t : a.t) - (b.tipo === 'msg' ? b.m.t : b.t));
  return [...fios.values()].sort((a, b) => Number(b.aberta) - Number(a.aberta) || b.t - a.t);
}

const semAspas = (t: string) => t.replace(/^"|"$/g, '');
const previa = (f: Fio) => {
  const u = f.itens[f.itens.length - 1];
  if (u.tipo !== 'msg') return u.texto;
  const m = u.m;
  if (m.tipo === 'escrita') return m.resposta?.op === 'respondeu' ? semAspas(m.resposta.texto) : `Você: ${m.texto}`;
  if (m.tipo === 'chamado') return m.resposta ? `Você: ${m.resposta.op === 'sim' ? 'respondeu' : 'disse que não'}` : semAspas(m.texto);
  return m.resposta ? `Você: ${m.resposta.op === 'recusar' || m.resposta.op === 'ignorar' ? '—' : 'respondeu'}` : u.arquivada ? `${semAspas(m.texto)} (sem resposta)` : semAspas(m.texto);
};

function Mensagens({ vida, agir, abrirPessoa, inicial }: { vida: Vida; agir: Props['agir']; abrirPessoa: (id: string) => void; inicial?: string | null }) {
  const [aberto, setAberto] = useState<string | null>(inicial ?? null);
  const fios = fiosDe(vida);
  const lidas = useRef(false);
  useEffect(() => {
    if (lidas.current) return;
    lidas.current = true;
    if ((vida.celular15?.msgs ?? []).some(m => !m.lida && !m.resposta)) agir({ tipo: 'celular15', oque: { op: 'ler' } });
  }, [agir, vida.celular15]);
  const [nova, setNova] = useState(false);
  const [filtro, setFiltro] = useState<'todas' | 'nao_lidas' | 'esperando'>('todas');
  const f = aberto ? fios.find(x => x.chave === aberto) : undefined;
  if (nova) return <NovaMensagem vida={vida} agir={agir} voltar={() => setNova(false)} abrirConversa={pid => { setNova(false); setAberto(pid); }} />;
  if (f) return <Conversa vida={vida} agir={agir} fio={f} voltar={() => setAberto(null)} abrirPessoa={abrirPessoa} />;
  const escrever = <button type="button" className="botao botao--principal cel__escrever" onClick={() => setNova(true)}>Nova mensagem</button>;
  if (!fios.length) return <>{escrever}<p className="cel__vazio">Nenhuma mensagem por enquanto. A vida também tem dias quietos.</p></>;
  const naoLidas = fios.filter(x => x.naoLida).length;
  const esperando = fios.filter(x => x.aberta).length;
  const visiveis = fios.filter(x => filtro === 'todas' || (filtro === 'nao_lidas' ? x.naoLida : x.aberta));
  return (
    <>
    <div className="cel__msg-topo">
      {escrever}
      <div className="cel__filtros" role="group" aria-label="Mostrar conversas">
        <button type="button" className="chip" aria-pressed={filtro === 'todas'} onClick={() => setFiltro('todas')}>Todas</button>
        <button type="button" className="chip" aria-pressed={filtro === 'nao_lidas'} onClick={() => setFiltro('nao_lidas')}>Não lidas{naoLidas ? <span className="chip__conta">{naoLidas}</span> : null}</button>
        <button type="button" className="chip" aria-pressed={filtro === 'esperando'} onClick={() => setFiltro('esperando')}>Esperando você{esperando ? <span className="chip__conta">{esperando}</span> : null}</button>
      </div>
    </div>
    {!visiveis.length && <p className="cel__vazio">Nada aqui.</p>}
    <ul className="cel__lista" aria-label="Conversas">
      {visiveis.map(x => (
        <li key={x.chave}>
          <button type="button" className={`cel__fio${x.naoLida ? ' cel__fio--nova' : ''}`} onClick={() => setAberto(x.chave)}>
            <Foto vida={vida} p={x.p} tamanho={44} />
            <span className="cel__fio-texto">
              <strong>{x.nome}{x.p?.celebridade15 ? <span className="cel__selo" title="Pessoa famosa"> ★</span> : null}</strong>
              <span>{previa(x)}</span>
            </span>
            <span className="cel__fio-lado">
              <span className="cel__quando">{quando(vida, x.t)}</span>
              {x.aberta && <span className="cel__ponto" aria-label="Esperando resposta" />}
            </span>
          </button>
        </li>
      ))}
    </ul>
    </>
  );
}

/** VIDA 16: escrever para alguém — a pessoa, a intenção; a resposta é dela (uma mensagem por pessoa por ano). */
function NovaMensagem({ vida, agir, voltar, abrirConversa }: { vida: Vida; agir: Props['agir']; voltar: () => void; abrirConversa: (pid: string) => void }) {
  const [busca, setBusca] = useState('');
  const [quem, setQuem] = useState<string | null>(null);
  const lista = contatos16(vida);
  const achados = lista.filter(x => !busca || x.p.nome.toLowerCase().includes(busca.toLowerCase())).slice(0, 40);
  const c = quem ? lista.find(x => x.p.id === quem) : undefined;
  return (
    <div className="cel__nova">
      <div className="cel__conversa-topo">
        <button type="button" className="cel__voltar" onClick={c ? () => setQuem(null) : voltar} aria-label="Voltar">‹</button>
        <span className="cel__conversa-quem"><strong>{c ? `Para ${c.p.nome}` : 'Nova mensagem'}</strong><span>{c ? rotuloDe(vida, c.p, c.vin) : 'Escolha para quem'}</span></span>
      </div>
      {!c ? (
        <>
          <label className="cel__busca"><span className="sr-only">Buscar contato</span><input type="search" placeholder="Buscar nos contatos" value={busca} onChange={e => setBusca(e.target.value)} /></label>
          <ul className="cel__lista" aria-label="Contatos">
            {achados.map(x => (
              <li key={x.p.id}>
                <button type="button" className="cel__fio" onClick={() => setQuem(x.p.id)} disabled={x.escreveu}>
                  <Foto vida={vida} p={x.p} tamanho={38} />
                  <span className="cel__fio-texto"><strong>{x.p.nome}</strong><span>{x.escreveu ? 'Você já escreveu este ano' : rotuloDe(vida, x.p, x.vin)}</span></span>
                </button>
              </li>
            ))}
          </ul>
          {!achados.length && <p className="cel__vazio">Ninguém com esse nome.</p>}
        </>
      ) : (
        <div className="cel__intencoes" role="group" aria-label="O que escrever">
          {c.intencoes.map((i: IntencaoMsg16) => (
            <BotaoAcao key={i} vida={vida} acao={{ tipo: 'celular15', oque: { op: 'escrever', pid: c.p.id, intencao: i } }} agir={a => { const ok = agir(a); if (ok) abrirConversa(c.p.id); return ok; }} variante={i === 'saber' ? 'principal' : 'discreto'}>{ROTULO_INTENCAO16[i]}</BotaoAcao>
          ))}
        </div>
      )}
    </div>
  );
}

function Conversa({ vida, agir, fio, voltar, abrirPessoa }: { vida: Vida; agir: Props['agir']; fio: Fio; voltar: () => void; abrirPessoa: (id: string) => void }) {
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => { fim.current?.scrollIntoView?.({ block: 'end' }); }, [fio.itens.length]);
  const vin = fio.pid ? vida.vinculos[fio.pid] : undefined;
  return (
    <div className="cel__conversa">
      <div className="cel__conversa-topo">
        <button type="button" className="cel__voltar" onClick={voltar} aria-label="Voltar às conversas">‹</button>
        <Foto vida={vida} p={fio.p} tamanho={34} />
        <span className="cel__conversa-quem"><strong>{fio.nome}</strong>{fio.p && vin ? <span>{rotuloDe(vida, fio.p, vin)}{fio.p.celebridade15 ? ` · ${rotuloArea(fio.p)}` : ''}</span> : null}</span>
        {fio.pid && <button type="button" className="cel__link" onClick={() => abrirPessoa(fio.pid!)}>Perfil</button>}
      </div>
      <div className="cel__baloes">
        {fio.itens.map((it, k) => it.tipo === 'chamado' ? (
          <div key={`c${k}`} className="cel__grupo">
            <p className="cel__balao cel__balao--dela">{it.texto}</p>
            <div className="cel__respostas" role="group" aria-label="Responder">
              <BotaoAcao vida={vida} acao={{ tipo: 'pessoa', pessoaId: fio.pid!, interacao: 'chamado_sim' }} agir={agir} variante="principal">{it.sim}</BotaoAcao>
              <BotaoAcao vida={vida} acao={{ tipo: 'pessoa', pessoaId: fio.pid!, interacao: 'chamado_nao' }} agir={agir} variante="discreto">{it.nao}</BotaoAcao>
            </div>
          </div>
        ) : it.m.tipo === 'escrita' ? (
          <div key={it.m.id} className="cel__grupo">
            <span className="cel__data">{dataHora(vida, it.m)}</span>
            <p className="cel__balao cel__balao--minha">{it.m.texto}</p>
            {it.m.resposta?.op === 'respondeu' ? <p className="cel__balao cel__balao--dela">{semAspas(it.m.resposta.texto)}</p> : <p className="cel__narra">{it.m.resposta?.texto}</p>}
          </div>
        ) : it.m.tipo === 'chamado' ? (
          <div key={it.m.id} className="cel__grupo">
            <span className="cel__data">{dataHora(vida, it.m)}</span>
            <p className="cel__balao cel__balao--dela">{semAspas(it.m.texto)}</p>
            {it.m.resposta ? <p className="cel__narra">{it.m.resposta.texto}</p> : <p className="cel__narra">Ficou sem resposta.</p>}
          </div>
        ) : (
          <div key={it.m.id} className="cel__grupo">
            <span className="cel__data">{it.m.tipo === 'encontro' || (it.m.tipo === 'fa' && it.m.onde) ? `Por acaso, ${rotuloDoLugar15(it.m.onde ?? 'rua')} · ${quando(vida, it.m.t)}` : dataHora(vida, it.m)}</span>
            <p className={`cel__balao ${it.m.tipo === 'encontro' || (it.m.tipo === 'fa' && it.m.onde) ? 'cel__balao--cena' : 'cel__balao--dela'}`}>{it.m.texto.replace(/^"|"$/g, '')}</p>
            {it.m.cartao && <p className="cel__cartao"><span>Compartilhou</span>{it.m.cartao}</p>}
            {it.m.custo ? <p className="cel__custo">Custa uns {dinheiroCurto(it.m.custo)}</p> : null}
            {it.m.resposta ? (
              <>
                <p className="cel__balao cel__balao--minha">{opcaoRotulo(vida, it.m)}</p>
                <p className="cel__narra">{it.m.resposta.texto}</p>
              </>
            ) : it.arquivada ? <p className="cel__narra">Ficou sem resposta.</p> : (
              <div className="cel__respostas" role="group" aria-label="Responder">
                {opcoesDaMsg15(vida, it.m).map(o => (
                  <button key={o.op} type="button" className={`botao botao--${o.op === 'aceitar' || o.op === 'ir' || o.op === 'ligar' || o.op === 'marcar' || o.op === 'conversar' || o.op === 'atender' || o.op === 'confirmar' ? 'principal' : 'discreto'}`}
                    disabled={!podeTentar(o.veredito)} title={o.veredito.motivo}
                    onClick={() => agir({ tipo: 'celular15', oque: { op: 'responder', id: it.m.id, escolha: o.op } })}>
                    {o.rotulo}{o.veredito.grau === 'irregular' ? ' ⚠' : ''}
                  </button>
                ))}
                {opcoesDaMsg15(vida, it.m).some(o => o.veredito.motivo && o.veredito.grau !== 'permitido') && <p className="cel__aviso">{opcoesDaMsg15(vida, it.m).find(o => o.veredito.motivo && o.veredito.grau !== 'permitido')!.veredito.motivo}</p>}
              </div>
            )}
          </div>
        ))}
        <div ref={fim} />
      </div>
    </div>
  );
}

/** O que você respondeu, em palavras (o rótulo do botão que foi apertado). */
function opcaoRotulo(v: Vida, m: Msg15): string {
  const r = m.resposta!;
  const mapa: Record<string, string> = { aceitar: 'Topo!', recusar: 'Obrigado, mas não vai dar.', outro_dia: 'Outro dia?', ligar: '📞 Ligando…', marcar: 'Vamos marcar!', curto: 'Tudo bem por aqui! E você?', adiar: 'Deixa pra depois?', conversar: 'Que bom te ver!', ignorar: '(sem resposta)', cordial: 'Tô bem, sim. Espero que você também.', atender: 'Claro!', ir: 'Estarei lá.', confirmar: 'Sim, estamos juntos.', negar: 'Somos só amigos.', sem_comentar: 'Sem comentários.', cumprimentar: 'Oi! Quanto tempo!', desviar: '(fingiu que não viu)' };
  return mapa[r.op] ?? (v ? 'Respondido.' : '');
}

/* ------------------------------------------------------------------ Namoro */

const BUSCA: Record<PerfilApp15['busca'], string> = { relacionamento: 'Procura um relacionamento', casual: 'Algo sem compromisso', incerto: 'Ainda não sabe o que procura' };

function Namoro({ vida, agir, abrirPessoa }: { vida: Vida; agir: Props['agir']; abrirPessoa: (id: string) => void }) {
  const [aba, setAba] = useState<'descobrir' | 'conversas'>('descobrir');
  const [match, setMatch] = useState<string | null>(null);
  const d = disponibilidadeNamoro15(vida);
  const deck = vida.celular15?.deck;
  const doAno = deck?.ano === anoDe(vida.t);
  const pedido = useRef(false);
  useEffect(() => {
    if (pedido.current || doAno || !podeTentar(d)) return;
    pedido.current = true;
    agir({ tipo: 'celular15', oque: { op: 'namoro_abrir' } });
  }, [agir, d, doAno]);
  if (d.grau === 'impossivel' || d.grau === 'requisito' || d.grau === 'incompativel') {
    return (
      <div className="namoro namoro--fechado">
        <span className="namoro__logo">faísca</span>
        <p>{d.motivo}</p>
        {!vida.eu.atracao && idade(vida) >= 18 && (
          <div className="cel__respostas">
            {(['mulheres', 'homens', 'ambos'] as const).map(a => <button key={a} type="button" className="botao botao--discreto" onClick={() => agir({ tipo: 'atracao', valor: a })}>{a === 'ambos' ? 'Qualquer gênero' : a.charAt(0).toUpperCase() + a.slice(1)}</button>)}
          </div>
        )}
      </div>
    );
  }
  const conversas = matches15(vida);
  const atual = doAno ? deck!.perfis.find(x => !x.decisao) : undefined;
  const novoMatch = match ? vida.pessoas[match] : undefined;
  return (
    <div className="namoro">
      <div className="namoro__topo">
        <span className="namoro__logo">faísca</span>
        <div className="namoro__abas" role="tablist">
          <button type="button" role="tab" aria-selected={aba === 'descobrir'} className={aba === 'descobrir' ? 'ativa' : ''} onClick={() => setAba('descobrir')}>Descobrir</button>
          <button type="button" role="tab" aria-selected={aba === 'conversas'} className={aba === 'conversas' ? 'ativa' : ''} onClick={() => setAba('conversas')}>Matches{conversas.length ? ` (${conversas.length})` : ''}</button>
        </div>
      </div>
      {d.grau === 'irregular' && <p className="cel__aviso">⚠ {d.motivo}</p>}
      {aba === 'descobrir' && (atual ? (
        <article className="perfil-app" aria-label={`Perfil de ${atual.pessoa.nome}`}>
          <div className="perfil-app__foto">
            <Retrato visual={atual.pessoa.visual} genero={atual.pessoa.genero} idade={idadePessoa(vida, atual.pessoa)} semente={atual.pessoa.id} tamanho={230} rotulo={atual.pessoa.nome} especie={atual.pessoa.especie} />
            <div className="perfil-app__nome"><strong>{atual.pessoa.nome}, {idadePessoa(vida, atual.pessoa)}</strong><span>{atual.pessoa.ocupacao ? `${atual.pessoa.ocupacao} · ` : ''}a {atual.km} km</span></div>
          </div>
          <div className="perfil-app__corpo">
            <p className="perfil-app__busca">{BUSCA[atual.busca]}</p>
            <p className="perfil-app__bio">{atual.bio}</p>
            <ul className="perfil-app__tags">{atual.interesses.map(t => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="perfil-app__botoes">
            <button type="button" className="perfil-app__nao" aria-label={`Passar ${atual.pessoa.nome}`} onClick={() => agir({ tipo: 'celular15', oque: { op: 'passar', pid: atual.pessoa.id } })}>✕</button>
            <button type="button" className="perfil-app__sim" aria-label={`Curtir ${atual.pessoa.nome}`} disabled={!podeTentar(disponibilidade(vida, { tipo: 'celular15', oque: { op: 'curtir', pid: atual.pessoa.id } }))}
              title={disponibilidade(vida, { tipo: 'celular15', oque: { op: 'curtir', pid: atual.pessoa.id } }).motivo}
              onClick={() => { if (agir({ tipo: 'celular15', oque: { op: 'curtir', pid: atual.pessoa.id } })) setMatch(atual.pessoa.id); }}>♥</button>
          </div>
          <p className="perfil-app__resta">{deck!.perfis.filter(x => !x.decisao).length - 1} perfis depois deste · a curtida só vira match se for recíproca</p>
        </article>
      ) : doAno ? (
        <div className="namoro__fim">
          <p>Você viu todo mundo por perto, por enquanto.</p>
          <BotaoAcao vida={vida} acao={{ tipo: 'celular15', oque: { op: 'namoro_mais' } }} agir={agir} variante="secundario">Ampliar a distância</BotaoAcao>
          <p className="cel__nota">Gente nova aparece no ano que vem.</p>
        </div>
      ) : <p className="cel__vazio">Carregando perfis…</p>)}
      {aba === 'conversas' && (conversas.length ? (
        <ul className="cel__lista">
          {conversas.map(x => (
            <li key={x.p.id} className="match">
              <Foto vida={vida} p={x.p} tamanho={48} />
              <span className="match__texto"><strong>{x.p.nome}, {idadePessoa(vida, x.p)}</strong><span>{x.etapa === 'match' ? 'Deu match: puxe conversa' : x.etapa === 'conversa' ? 'Conversando — dá para marcar um encontro' : 'Depois do primeiro encontro'}</span></span>
              <span className="match__acoes">
                {x.etapa === 'match' && <BotaoAcao vida={vida} acao={{ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'app_conversar' }} agir={agir} variante="principal">Conversar</BotaoAcao>}
                {x.etapa === 'conversa' && <BotaoAcao vida={vida} acao={{ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'app_encontro' }} agir={agir} variante="principal">Marcar encontro</BotaoAcao>}
                <button type="button" className="cel__link" onClick={() => abrirPessoa(x.p.id)}>Perfil</button>
                <button type="button" className="cel__link cel__link--fraco" onClick={() => agir({ tipo: 'celular15', oque: { op: 'desfazer', pid: x.p.id } })}>Desfazer</button>
              </span>
            </li>
          ))}
        </ul>
      ) : <p className="cel__vazio">Nenhum match em andamento. Curta alguém em Descobrir.</p>)}
      {novoMatch && vida.vinculos[novoMatch.id] && (
        <div className="namoro__match" role="dialog" aria-label="É um match">
          <p className="namoro__match-titulo">É um match!</p>
          <div className="namoro__match-fotos">
            <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} tamanho={96} rotulo={vida.eu.nome} />
            <Retrato visual={novoMatch.visual} genero={novoMatch.genero} idade={idadePessoa(vida, novoMatch)} semente={novoMatch.id} tamanho={96} rotulo={novoMatch.nome} especie={novoMatch.especie} />
          </div>
          <p>Você e {novoMatch.nome} curtiram um ao outro.</p>
          <button type="button" className="botao botao--principal" onClick={() => { setMatch(null); setAba('conversas'); }}>Ir para a conversa</button>
          <button type="button" className="cel__link" onClick={() => setMatch(null)}>Continuar vendo perfis</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Rede */

/** O que não se "curte": deixa-se um abraço. */
const DIFICIL = new Set(['perda', 'saude', 'desemprego']);

function Rede({ vida, agir, abrirPessoa }: { vida: Vida; agir: Props['agir']; abrirPessoa: (id: string) => void }) {
  const [aba, setAba] = useState<'amigos' | 'contas'>('amigos');
  const posts = feed15(vida);
  return (
    <div className="rede15">
      <div className="namoro__abas" role="tablist">
        <button type="button" role="tab" aria-selected={aba === 'amigos'} className={aba === 'amigos' ? 'ativa' : ''} onClick={() => setAba('amigos')}>Amigos</button>
        <button type="button" role="tab" aria-selected={aba === 'contas'} className={aba === 'contas' ? 'ativa' : ''} onClick={() => setAba('contas')}>Minhas contas</button>
      </div>
      {aba === 'amigos' && (posts.length ? (
        <ol className="rede15__feed">
          {posts.map(x => {
            const p = vida.pessoas[x.pid];
            const vin = vida.vinculos[x.pid];
            return (
              <li key={x.chave} className={`post15 post15--${x.tipo}`}>
                <button type="button" className="post15__quem" onClick={() => abrirPessoa(x.pid)}>
                  <Foto vida={vida} p={p} tamanho={36} />
                  <span><strong>{p.nome}</strong><span>{vin ? rotuloDe(vida, p, vin) : ''} · {quando(vida, x.t)}</span></span>
                </button>
                <p className="post15__titulo">{tituloDoPost17(x.tipo, x.texto)}</p>
                <p className="post15__texto">{x.texto}</p>
                <button type="button" className={`post15__curtir${x.curtiu ? ' post15__curtir--sim' : ''}`} aria-pressed={x.curtiu} disabled={x.curtiu}
                  onClick={() => agir({ tipo: 'celular15', oque: { op: 'curtir_post', chave: x.chave, pid: x.pid } })}>{DIFICIL.has(x.tipo) ? (x.curtiu ? '🤍 Abraço enviado' : '🤍 Deixar um abraço') : x.curtiu ? '♥ Curtiu' : '♡ Curtir'}</button>
              </li>
            );
          })}
        </ol>
      ) : <p className="cel__vazio">Ninguém da sua vida postou nada de novo nos últimos dois anos.</p>)}
      {aba === 'contas' && <Suspense fallback={<p className="cel__vazio">Abrindo…</p>}><div className="rede15__contas"><RedesSociais vida={vida} agir={agir} abrirPessoa={abrirPessoa} embutido /></div></Suspense>}
    </div>
  );
}

/* ------------------------------------------------------------------ Notícias */

function Noticias({ vida }: { vida: Vida }) {
  const j = useMemo(() => jornal15(vida), [vida]);
  const [ed, setEd] = useState<Editoria15 | 'todas'>('todas');
  const eds = [...new Set(j.materias.map(m => m.editoria))];
  const lista = ed === 'todas' ? j.materias : j.materias.filter(m => m.editoria === ed);
  return (
    <div className="jornal15">
      <header className="jornal15__cabeca">
        <p className="jornal15__nome">{j.nome}</p>
        <p className="jornal15__data">Edição de {MESES[mesDe(vida.t)]} de {j.edicao} · {nomeLugar(vida.moradia.municipioId)}</p>
      </header>
      <div className="jornal15__editorias" role="tablist" aria-label="Editorias">
        <button type="button" role="tab" aria-selected={ed === 'todas'} className={ed === 'todas' ? 'ativa' : ''} onClick={() => setEd('todas')}>Destaques</button>
        {eds.map(e => <button key={e} type="button" role="tab" aria-selected={ed === e} className={ed === e ? 'ativa' : ''} onClick={() => setEd(e)}>{ROTULO_EDITORIA15[e]}</button>)}
      </div>
      {lista.length ? (
        <ol className="jornal15__materias">
          {lista.map((m, k) => (
            <li key={m.id} className={`materia15${k === 0 && ed === 'todas' ? ' materia15--manchete' : ''}${m.tom ? ` materia15--${m.tom}` : ''}`}>
              <span className="materia15__editoria">{ROTULO_EDITORIA15[m.editoria]}{m.ano !== j.edicao ? ` · ${m.ano}` : ''}</span>
              <h3 className="materia15__titulo">{m.titulo}</h3>
              {m.linha && <p className="materia15__linha">{m.linha}</p>}
            </li>
          ))}
        </ol>
      ) : <p className="cel__vazio">Um ano calmo: nada fora do comum nas páginas.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Agenda, Mapas, Banco, E-mail, Fama */

function Agenda({ vida, sair }: { vida: Vida; sair: (a: Aba) => void }) {
  const ano = anoDe(vida.t);
  const feitos = (vida.celular15?.msgs ?? []).filter(m => m.resposta && anoDe(m.t) === ano && ['aceitar', 'ir', 'marcar'].includes(m.resposta.op));
  const mes = mesDe(vida.t);
  const anivs = vinculosVivos(vida).filter(({ p, vin }) => !p.especie && (vin.parentesco || vin.estagio === 'amigo_proximo' || vin.romance && ['namoro', 'morando_junto', 'casamento', 'saindo'].includes(vin.romance.estagio)))
    .map(({ p }) => ({ p, m: mesDe(p.tNasc), faz: idadePessoa(vida, p) + 1 }))
    .sort((a, b) => ((a.m - mes + 12) % 12) - ((b.m - mes + 12) % 12)).slice(0, 10);
  return (
    <div className="cel__secoes">
      <section>
        <h3 className="cel__h">Combinados deste ano</h3>
        {feitos.length ? <ul className="cel__linhas">{feitos.map(m => <li key={m.id}><span>{m.assunto ? m.texto.replace(/^"|"$/g, '').slice(0, 70) : 'Programa'}</span><span className="cel__quando">{m.de ? vida.pessoas[m.de]?.nome : m.remetente}</span></li>)}</ul> : <p className="cel__nota">Nada combinado ainda. Os convites chegam em Mensagens.</p>}
      </section>
      <section>
        <h3 className="cel__h">Aniversários</h3>
        {anivs.length ? <ul className="cel__linhas">{anivs.map(x => <li key={x.p.id}><span>{x.p.nome} faz {x.faz}</span><span className="cel__quando">{MESES[x.m]}</span></li>)}</ul> : <p className="cel__nota">Ninguém próximo o bastante para estar aqui.</p>}
      </section>
      <button type="button" className="botao botao--secundario cel__largo" onClick={() => sair('semana')}>Abrir a agenda da semana</button>
    </div>
  );
}

function Mapas({ vida, sair }: { vida: Vida; sair: (a: Aba) => void }) {
  const m = municipio(vida.moradia.municipioId);
  const por = new Map<string, Pessoa[]>();
  for (const { p, vin } of vinculosVivos(vida)) {
    if (p.especie || vin.proximidade < 35 || !p.municipioId) continue;
    por.set(p.municipioId, [...(por.get(p.municipioId) ?? []), p]);
  }
  const lista = [...por.entries()].sort((a, b) => Number(b[0] === m.id) - Number(a[0] === m.id) || b[1].length - a[1].length).slice(0, 8);
  return (
    <div className="cel__secoes">
      {/* VIDA 17: o mapa ilustrado da cidade onde você mora (no lugar do desenho genérico). */}
      <MapaDaCidade vida={vida} />
      <section>
        <h3 className="cel__h">Onde está a sua gente</h3>
        <ul className="cel__linhas">{lista.map(([id, ps]) => (
          <li key={id}><span>{nomeLugar(id)}{id === m.id ? ' (aqui)' : ''}</span><span className="cel__rostos">{ps.slice(0, 4).map(p => <Foto key={p.id} vida={vida} p={p} tamanho={24} />)}{ps.length > 4 ? <span className="cel__quando">+{ps.length - 4}</span> : null}</span></li>
        ))}</ul>
      </section>
      <div className="cel__dois">
        <button type="button" className="botao botao--secundario" onClick={() => sair('cidade')}>A cidade</button>
        <button type="button" className="botao botao--secundario" onClick={() => sair('viagens')}>Viagens</button>
      </div>
    </div>
  );
}

function Banco({ vida, sair }: { vida: Vida; sair: (a: Aba) => void }) {
  const aplicado = vida.financas.investimentos.reduce((s, a) => s + a.valor, 0);
  const dividas = vida.financas.dividas.reduce((s, d) => s + d.saldo, 0);
  const e = extratoAberto(vida);
  const linhas = e.linhas.filter(l => Math.round(l.conta) !== 0).slice(-10).reverse();
  const passado = (vida.financas.extrato?.linhas ?? []).filter(l => Math.round(l.conta) !== 0).sort((a, b) => Math.abs(b.conta) - Math.abs(a.conta)).slice(0, 8);
  return (
    <div className="cel__secoes banco15">
      <div className="banco15__cartao">
        <span>Saldo em conta</span>
        <strong>{dinheiroCurto(vida.financas.conta)}</strong>
        <span className="banco15__titular">{vida.eu.nome.toUpperCase()}</span>
      </div>
      <dl className="banco15__resumo">
        <div><dt>Aplicado</dt><dd>{dinheiroCurto(aplicado)}</dd></div>
        <div><dt>Dívidas</dt><dd className={dividas > 0 ? 'ruim' : ''}>{dinheiroCurto(dividas)}</dd></div>
      </dl>
      <section>
        <h3 className="cel__h">Movimentos do ano</h3>
        {linhas.length ? <ul className="cel__linhas">{linhas.map((l, k) => <li key={k}><span>{l.rotulo}</span><span className={l.conta < 0 ? 'ruim' : 'bom'}>{l.conta < 0 ? '−' : '+'}{dinheiroCurto(Math.abs(l.conta))}</span></li>)}</ul> : <p className="cel__nota">Nenhum movimento ainda neste ano.</p>}
      </section>
      {passado.length > 0 && (
        <section>
          <h3 className="cel__h">O ano passado, no extrato</h3>
          <ul className="cel__linhas">{passado.map((l, k) => <li key={k}><span>{l.rotulo}</span><span className={l.conta < 0 ? 'ruim' : 'bom'}>{l.conta < 0 ? '−' : '+'}{dinheiroCurto(Math.abs(l.conta))}</span></li>)}</ul>
        </section>
      )}
      <button type="button" className="botao botao--secundario cel__largo" onClick={() => sair('dinheiro')}>Abrir Dinheiro</button>
    </div>
  );
}

function Email({ vida, abrir, irMensagens }: { vida: Vida; abrir?: (id: string) => void; irMensagens: () => void }) {
  const ops = vida.caminhos.oportunidades.filter(o => o.tFim >= vida.t).sort((a, b) => b.tInicio - a.tInicio);
  const propostas = (vida.celular15?.msgs ?? []).filter(m => m.tipo === 'proposta' || m.tipo === 'evento');
  if (!ops.length && !propostas.length) return <p className="cel__vazio">Caixa de entrada vazia. Só promoção e boleto — já apagados.</p>;
  return (
    <ul className="cel__lista email15">
      {ops.map(o => (
        <li key={o.id}><button type="button" className="email15__item" onClick={() => abrir?.(o.id)}>
          <strong>{o.titulo}</strong><span>{o.texto}</span><span className="cel__quando">até {MESES[mesDe(o.tFim)].slice(0, 3)} {anoDe(o.tFim)}</span>
        </button></li>
      ))}
      {propostas.map(m => (
        <li key={m.id}><button type="button" className="email15__item" onClick={irMensagens}>
          <strong>{m.tipo === 'evento' ? `Convite: ${m.remetente}` : `Proposta de ${m.de ? vida.pessoas[m.de]?.nome : m.remetente}`}</strong><span>{m.texto.replace(/^"|"$/g, '')}</span><span className="cel__quando">{m.resposta ? 'respondido' : 'responder em Mensagens'}</span>
        </button></li>
      ))}
    </ul>
  );
}

function Fama({ vida, irFama }: { vida: Vida; irFama: () => void }) {
  const l = leituraDaFama13(vida);
  const famosos = vinculosVivos(vida).filter(x => x.p.celebridade15);
  const seguidores = Object.values(vida.redes?.contas ?? {}).reduce((s, c) => s + (c.apagada ? 0 : c.seguidores), 0);
  const imprensa = jornal15(vida).materias.filter(m => m.editoria === 'voce').slice(0, 4);
  return (
    <div className="cel__secoes fama15">
      <div className="fama15__capa"><span>Seu nome</span><strong>{l.palavra}</strong><span>{l.valor} de 100 · {l.tendencia === 'subindo' ? '↑ subindo' : l.tendencia === 'caindo' ? '↓ caindo' : 'estável'}</span></div>
      <dl className="banco15__resumo">
        <div><dt>Seguidores</dt><dd>{seguidores.toLocaleString('pt-BR')}</dd></div>
        <div><dt>Imagem</dt><dd>{l.imagem?.palavra ?? '—'}</dd></div>
      </dl>
      <section><h3 className="cel__h">Na imprensa</h3>{imprensa.length ? <ul className="cel__linhas">{imprensa.map(m => <li key={m.id}><span>{m.titulo}</span></li>)}</ul> : <p className="cel__nota">Nada sobre você nas páginas este ano.</p>}</section>
      <section><h3 className="cel__h">Contatos famosos</h3>{famosos.length ? <ul className="cel__linhas">{famosos.map(x => <li key={x.p.id}><span className="cel__rostos"><Foto vida={vida} p={x.p} tamanho={24} /> {x.p.nome} {x.p.sobrenome}</span><span className="cel__quando">{rotuloArea(x.p)}</span></li>)}</ul> : <p className="cel__nota">Ninguém famoso na sua agenda ainda. Os eventos ajudam.</p>}</section>
      <button type="button" className="botao botao--secundario cel__largo" onClick={irFama}>Painel completo da fama</button>
    </div>
  );
}

/* ------------------------------------------------------------------ VIDA 17 · Preso: o telefone da unidade */

function TelefoneDaUnidade({ vida, agir }: { vida: Vida; agir: Props['agir'] }) {
  const contatos = contatosAutorizados17(vida);
  const resta = ligacoesRestantes17(vida);
  const regime = vida.justica?.prisao?.regime === 'semiaberto' ? 'semiaberto' : 'fechado';
  return (
    <div className="cel__unidade" role="region" aria-label="Telefone da unidade">
      <div className="cel__retido">
        <svg className="cel__retido-cadeado" viewBox="0 0 24 24" width="30" height="30" aria-hidden><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke="currentColor" strokeWidth="2.2" /></svg>
        <strong>Celular retido</strong>
        <p>{MOTIVO_PRESO17}</p>
        <p className="cel__nota">Mensagens, Rede, Namoro, Mapas, Banco e os outros aplicativos voltam quando a pena acabar.</p>
      </div>
      <section className="cel__unidade-lista">
        <h3 className="cel__h">Telefone da unidade · regime {regime}</h3>
        <p className="cel__nota">{resta ? `${resta} de ${limiteDeLigacoes17(vida)} ligações restantes neste ano.` : 'As ligações deste ano já foram usadas.'}</p>
        {contatos.length ? (
          <ul className="cel__linhas">
            {contatos.map(x => (
              <li key={x.p.id} className="cel__unidade-contato">
                <span className="cel__rostos"><Foto vida={vida} p={x.p} tamanho={28} /> {x.p.nome}</span>
                <BotaoAcao vida={vida} acao={{ tipo: 'celular15', oque: { op: 'ligacao_unidade', pid: x.p.id } }} agir={agir} variante="secundario">Ligar</BotaoAcao>
              </li>
            ))}
          </ul>
        ) : <p className="cel__vazio">Nenhum contato autorizado: a lista aceita só a família próxima e a parceria.</p>}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ O aparelho */

function Relogio() {
  const [h, setH] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setH(new Date()), 30000); return () => clearInterval(id); }, []);
  return <span>{String(h.getHours()).padStart(2, '0')}:{String(h.getMinutes()).padStart(2, '0')}</span>;
}

export default function Celular({ vida, agir, aoFechar, irPara, irLugar, abrirPessoa, abrirConvite, appInicial }: Props) {
  const [app, setApp] = useState<App15>(appInicial ?? 'inicio');
  const [fioInicial, setFioInicial] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.veu')) aoFechar(); };
    document.addEventListener('keydown', tecla);
    document.body.classList.add('com-celular');
    return () => { document.removeEventListener('keydown', tecla); document.body.classList.remove('com-celular'); anterior?.focus?.({ preventScroll: true }); };
  }, [aoFechar]);
  const sair = (a: Aba) => { aoFechar(); irPara(a); };
  const pessoa = (id: string) => { aoFechar(); abrirPessoa(id); };
  const fama = leituraDaFama13(vida);
  const temFama = fama.valor >= 10 || nivelDaFama15(vida) >= 1;
  const adulto = idade(vida) >= 18;
  const n = naoLidas15(vida);
  const matchesAbertos = matches15(vida).filter(x => x.etapa === 'match').length;
  const opsNovas = vida.caminhos.oportunidades.filter(o => o.tFim >= vida.t && o.tInicio >= vida.t - 12).length;
  // ERAS HISTÓRICAS: o aparelho da época (o telefone de casa, o celular de teclas, o smartphone) e só os "aplicativos" que
  // existem para a pessoa no ano. Vida contemporânea: o smartphone de sempre, com tudo.
  const meio = vida.era ? meioDaVida(vida) : 'smartphone';
  const tem = (id: string) => !vida.era || temAcesso(vida, id);
  const smart = meio === 'smartphone';
  const nomes: Record<Exclude<App15, 'inicio'>, string> = !vida.era ? NOMES : {
    ...NOMES,
    mensagens: meio === 'fixo' ? (tem('telefone_fixo') ? 'Recados' : 'Cartas') : meio === 'celular' ? (tem('sms') ? 'Torpedos' : 'Ligações') : NOMES.mensagens,
    noticias: smart ? NOMES.noticias : 'Jornal',
    agenda: meio === 'fixo' ? 'Caderneta' : NOMES.agenda
  };
  const apps: { id: Exclude<App15, 'inicio'>; conta?: number }[] = [
    { id: 'mensagens', conta: n }, ...(adulto && smart && tem('app_namoro') ? [{ id: 'namoro' as const, conta: matchesAbertos }] : []), ...(tem('redes_modernas') ? [{ id: 'rede' as const }] : []), { id: 'noticias' },
    { id: 'agenda' }, ...(smart ? [{ id: 'mapas' as const }] : []), ...(smart && tem('banco_app') ? [{ id: 'banco' as const }] : []), ...(tem('email') ? [{ id: 'email' as const, conta: opsNovas }] : []), ...(temFama && smart ? [{ id: 'fama' as const }] : [])
  ];
  // Um app que não existe na época (aberto por um atalho de outra tela) cai na tela inicial.
  const atual: App15 = app === 'inicio' || apps.some(a => a.id === app) ? app : 'inicio';
  const notificacoes = useMemo(() => fiosDe(vida).filter(f => f.aberta).slice(0, 3), [vida]);
  const abrirApp = (a: App15, fio?: string) => { setFioInicial(fio ?? null); setApp(a); };
  let conteudo: ReactNode = null;
  if (atual === 'mensagens') conteudo = <Mensagens vida={vida} agir={agir} abrirPessoa={pessoa} inicial={fioInicial} />;
  else if (atual === 'namoro') conteudo = <Namoro vida={vida} agir={agir} abrirPessoa={pessoa} />;
  else if (atual === 'rede') conteudo = <Rede vida={vida} agir={agir} abrirPessoa={pessoa} />;
  else if (atual === 'noticias') conteudo = <Noticias vida={vida} />;
  else if (atual === 'agenda') conteudo = <Agenda vida={vida} sair={sair} />;
  else if (atual === 'mapas') conteudo = <Mapas vida={vida} sair={sair} />;
  else if (atual === 'banco') conteudo = <Banco vida={vida} sair={sair} />;
  else if (atual === 'email') conteudo = <Email vida={vida} abrir={id => { aoFechar(); abrirConvite?.(id); }} irMensagens={() => abrirApp('mensagens')} />;
  else if (atual === 'fama') conteudo = <Fama vida={vida} irFama={() => { aoFechar(); irLugar({ area: 'voce', voce: 'fama' }); }} />;
  return (
    <div className="cel" onClick={e => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className="cel__aparelho" role="dialog" aria-modal="true" aria-label={NOME_DO_APARELHO[meio]} tabIndex={-1} ref={ref} data-app={atual} data-meio={meio}>
        {meio === 'fixo' ? <div className="cel__status" aria-hidden><span>Telefone de casa · {anoDe(vida.t)}</span></div> : (
        <div className="cel__status" aria-hidden>
          <Relogio />
          <span className="cel__status-dir"><span className="cel__sinal" /><span className="cel__bateria" /></span>
        </div>)}
        {vida.justica?.prisao ? <TelefoneDaUnidade vida={vida} agir={agir} /> : atual === 'inicio' ? (
          <div className="cel__inicio">
            <div className="cel__data-grande"><strong>{MESES[mesDe(vida.t)]}</strong><span>{anoDe(vida.t)} · {municipio(vida.moradia.municipioId).nome}</span></div>
            {vida.era && !smart && (
              <div className="cel__epoca">
                {meio === 'fixo' ? <TelefoneDeDisco tamanho={44} /> : <CelularDeTeclas tamanho={44} />}
                <p>{meio === 'fixo'
                  ? (tem('telefone_fixo') ? 'O telefone da sala. Quem liga deixa recado; quem mora longe escreve carta, e a resposta leva dias.' : 'Sem telefone em casa: recado pelo vizinho, ligação do orelhão e carta pelo correio.')
                  : `Celular de teclas: ligação cara${tem('sms') ? ', torpedo curto' : ''}.${tem('internet') ? ' A internet é no computador.' : ' Internet, ainda não.'}`}</p>
              </div>
            )}
            {notificacoes.length > 0 && (
              <ul className="cel__notificacoes" aria-label="Notificações">
                {notificacoes.map(f => (
                  <li key={f.chave}><button type="button" className="cel__notificacao" onClick={() => abrirApp('mensagens', f.chave)}>
                    <Foto vida={vida} p={f.p} tamanho={30} />
                    <span><strong>{f.nome}</strong><span>{previa(f)}</span></span>
                  </button></li>
                ))}
              </ul>
            )}
            <ul className="cel__apps" aria-label="Aplicativos">
              {apps.map(a => (
                <li key={a.id}>
                  <button type="button" className={`cel__app-icone cel__app-icone--${a.id}`} onClick={() => abrirApp(a.id)} aria-label={`${nomes[a.id]}${a.conta ? `, ${a.conta} novidades` : ''}`}>
                    <span className="cel__tile"><Icone d={ICONES[a.id]} />{a.conta ? <span className="cel__badge">{a.conta > 9 ? '9+' : a.conta}</span> : null}</span>
                    <span className="cel__app-nome">{nomes[a.id]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="cel__app">
            <div className="cel__app-topo">
              <button type="button" className="cel__voltar" onClick={() => setApp('inicio')} aria-label="Voltar à tela inicial">‹</button>
              <span className="cel__app-titulo"><Icone d={ICONES[atual]} className="cel__icone cel__icone--mini" />{nomes[atual]}</span>
            </div>
            <div className="cel__app-corpo">{conteudo}</div>
          </div>
        )}
        <div className="cel__home"><button type="button" aria-label="Tela inicial" onClick={() => setApp('inicio')} /></div>
      </div>
      <button type="button" className="cel__fechar" onClick={aoFechar}>{GUARDAR_O_APARELHO[meio]}</button>
    </div>
  );
}
