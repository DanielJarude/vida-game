/**
 * VIDA 19 · VIDA CONECTADA — o feed, o perfil e as interações (dentro do app Rede do celular).
 *
 *   Feed       as publicações das pessoas da sua vida (lidas da trajetória delas: `motor/v19/conectada/feed19`), no
 *              formato e na rede de cada uma, com o alcance, os comentários de quem tem laço com elas e o que você fez.
 *   Em alta    o que circula — sempre com a origem (o famoso que você conhece, você mesmo, o campeonato).
 *   Perfil     o que a pessoa mostra (e só o que você pode ver): marcos públicos, conexões, publicações; mensagem e ficha.
 *
 * Toda interação passa pelas ações do jogo (`conectada19`): nada muda só na tela. A mensagem a partir de uma publicação
 * abre a conversa em Mensagens (o mesmo histórico).
 */
import { useState, type ReactNode } from 'react';
import type { Pessoa, Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { disponibilidade } from '../../../motor/acoes';
import { podeTentar } from '../../../motor/plausibilidade';
import { idadePessoa } from '../../../motor/nucleo';
import { MESES, anoDe, mesDe } from '../../../motor/tempo';
import { emAlta19, feed19, perfil19, type Post19 } from '../../../motor/v19/conectada/feed19';
import { ROTULO_TOM19, tonsPara19 } from '../../../motor/v19/conectada/conectada19';
import { Retrato } from '../../avatar/Retrato';
import { rotuloDe } from '../../apresentar';
import './conectada19.css';

interface Props {
  vida: Vida;
  agir: (a: Acao) => boolean | void;
  abrirPessoa: (id: string) => void;
  abrirConversa: (id: string) => void;
}

const NOME_REDE: Record<string, string> = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', x: 'X', youtube: 'YouTube', twitch: 'Twitch', onlyfans: 'OnlyFans' };
const FORMATO: Record<Post19['formato'], string> = { texto: 'texto', foto: 'foto', album: 'álbum', video: 'vídeo curto', story: 'story' };

function quando19(v: Vida, t: number): string {
  const d = v.t - t;
  if (d <= 0) return 'este mês';
  if (d < 12) return `há ${d} ${d === 1 ? 'mês' : 'meses'}`;
  return `${MESES[mesDe(t)].slice(0, 3)} de ${anoDe(t)}`;
}

const numero = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} mi` : n >= 1e4 ? `${Math.round(n / 1e3)} mil` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace('.', ',')} mil` : String(n));

function Rosto({ vida, p, tamanho }: { vida: Vida; p?: Pessoa; tamanho: number }) {
  if (!p) return <span className="feed19__sem-rosto" style={{ width: tamanho, height: tamanho }} aria-hidden />;
  return <Retrato visual={p.visual} genero={p.genero} idade={idadePessoa(vida, p)} semente={p.id} tamanho={tamanho} rotulo={p.nome} especie={p.especie} falecido={!p.vivo} />;
}

/** A mídia da publicação: o retrato de quem postou num cenário do acontecimento (ilustrado, como o resto do VIDA). */
function Midia({ vida, post }: { vida: Vida; post: Post19 }) {
  if (post.formato === 'texto') return null;
  const p = vida.pessoas[post.pid];
  const par = p?.parceiroId ? vida.pessoas[p.parceiroId] : undefined;
  const junto = post.tipo === 'amor' && par && !/Separou|Terminou/.test(post.origem);
  return (
    <div className={`midia19 midia19--${post.formato} midia19--${post.tipo}`} aria-label={`${FORMATO[post.formato]} de ${p?.nome ?? ''}`} role="img">
      <div className="midia19__cena">
        <Rosto vida={vida} p={p} tamanho={post.formato === 'story' ? 92 : 104} />
        {junto && <Rosto vida={vida} p={par} tamanho={post.formato === 'story' ? 80 : 92} />}
      </div>
      {post.formato === 'video' && <span className="midia19__play" aria-hidden><svg viewBox="0 0 24 24" width="28" height="28"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.55)" /><path d="M9.5 7.5v9l7-4.5z" fill="#fff" /></svg></span>}
      {post.formato === 'video' && <span className="midia19__duracao">0:{String(12 + (post.curtidas % 47)).padStart(2, '0')}</span>}
      {post.formato === 'album' && <span className="midia19__selo">1/{3 + (post.curtidas % 6)}</span>}
      {post.formato === 'story' && <span className="midia19__selo">story · 24 h</span>}
    </div>
  );
}

function Coracao({ cheio }: { cheio?: boolean }) {
  return <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.4 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" fill={cheio ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" /></svg>;
}

function Cartao({ vida, post, agir, abrirPerfil, abrirConversa }: { vida: Vida; post: Post19; agir: Props['agir']; abrirPerfil: (id: string) => void; abrirConversa: (id: string) => void }) {
  const [tons, setTons] = useState(false);
  const p = vida.pessoas[post.pid];
  const vin = vida.vinculos[post.pid];
  const r = post.reacao;
  const pode = (a: Acao) => podeTentar(disponibilidade(vida, a));
  const curtir = { tipo: 'conectada19', oque: { op: 'curtir', chave: post.chave } } as const;
  const compartilhar = { tipo: 'conectada19', oque: { op: 'compartilhar', chave: post.chave } } as const;
  const mensagem = { tipo: 'conectada19', oque: { op: 'mensagem', chave: post.chave } } as const;
  return (
    <li className={`post19 post19--${post.tipo}`}>
      <button type="button" className="post19__quem" onClick={() => abrirPerfil(post.pid)}>
        <Rosto vida={vida} p={p} tamanho={38} />
        <span>
          <strong>{p?.nome}{post.famoso && <span className="post19__verificado" title="Pessoa pública" aria-label="pessoa pública"> ✓</span>}</strong>
          <span>{vin ? rotuloDe(vida, p, vin) : ''} · {quando19(vida, post.t)} · {NOME_REDE[post.plataforma]}{post.publico === 'amigos' ? ' · só amigos' : ''}</span>
        </span>
      </button>
      <Midia vida={vida} post={post} />
      <p className="post19__titulo">{post.titulo}</p>
      <p className="post19__legenda">{post.legenda}</p>
      <p className="post19__origem">{post.origem}</p>
      <p className="post19__numeros"><span>{post.dificil ? 'abraços' : 'curtidas'} {numero(post.curtidas + (r?.curtiu ? 1 : 0))}</span><span>comentários {numero(post.comentarios + (r?.comentou ? 1 : 0))}</span>{post.compartilhamentos > 0 && <span>compartilhamentos {numero(post.compartilhamentos + (r?.compartilhou ? 1 : 0))}</span>}</p>
      {(post.destaque.length > 0 || r?.comentou) && (
        <ul className="post19__comentarios">
          {post.destaque.map(c => <li key={c.pid}><button type="button" onClick={() => abrirPerfil(c.pid)}>{vida.pessoas[c.pid]?.nome}</button> {c.texto}</li>)}
          {r?.comentou && <li className="post19__meu"><strong>Você</strong> {ROTULO_TOM19[r.comentou].toLowerCase()}</li>}
        </ul>
      )}
      <div className="post19__acoes">
        <button type="button" className={r?.curtiu ? 'feito' : ''} aria-pressed={!!r?.curtiu} disabled={!pode(curtir)} onClick={() => agir(curtir)}><Coracao cheio={r?.curtiu} /> {post.dificil ? (r?.curtiu ? 'Abraço enviado' : 'Abraço') : r?.curtiu ? 'Curtiu' : 'Curtir'}</button>
        <button type="button" aria-expanded={tons} disabled={!!r?.comentou} onClick={() => setTons(x => !x)}>{r?.comentou ? 'Comentou' : 'Comentar'}</button>
        {!post.dificil || post.tipo === 'perda' ? <button type="button" disabled={!pode(compartilhar)} onClick={() => agir(compartilhar)}>{r?.compartilhou ? 'Compartilhou' : 'Compartilhar'}</button> : null}
        <button type="button" disabled={!pode(mensagem)} title={disponibilidade(vida, mensagem).motivo} onClick={() => { if (agir(mensagem) !== false) abrirConversa(post.pid); }}>{r?.dm ? 'Conversaram' : 'Mensagem'}</button>
      </div>
      {tons && !r?.comentou && (
        <div className="post19__tons" role="group" aria-label="Como comentar">
          {tonsPara19(vida, post).map(t => {
            const a = { tipo: 'conectada19', oque: { op: 'comentar', chave: post.chave, tom: t } } as const;
            return <button key={t} type="button" className={`tom19 tom19--${t}`} disabled={!pode(a)} onClick={() => { agir(a); setTons(false); }}>{ROTULO_TOM19[t]}</button>;
          })}
        </div>
      )}
    </li>
  );
}

function Perfil({ vida, pid, agir, abrirPessoa, abrirConversa, abrirPerfil, voltar }: Props & { pid: string; abrirPerfil: (id: string) => void; voltar: () => void }) {
  const pf = perfil19(vida, pid);
  const p = vida.pessoas[pid];
  const vin = vida.vinculos[pid];
  if (!pf || !p) return <div className="perfil19"><button type="button" className="perfil19__voltar" onClick={voltar}>‹ Voltar</button><p className="cel__vazio">Esse perfil não está disponível.</p></div>;
  const segue = (vida.conectada19?.seguindo ?? []).includes(pid);
  const seguir: Acao = { tipo: 'conectada19', oque: segue ? { op: 'deixar_de_seguir', pid } : { op: 'seguir', pid } };
  return (
    <div className="perfil19">
      <button type="button" className="perfil19__voltar" onClick={voltar}>‹ Voltar ao feed</button>
      <header className="perfil19__topo">
        <Rosto vida={vida} p={p} tamanho={72} />
        <div>
          <h3>{p.nome} {p.sobrenome}{p.celebridade15 && <span className="post19__verificado" aria-label="pessoa pública"> ✓</span>}</h3>
          <p>{pf.idade} anos · {pf.cidade}{pf.ocupacao ? ` · ${pf.ocupacao}` : ''}</p>
          <p>{vin ? rotuloDe(vida, p, vin) : ''} · {numero(pf.seguidores)} seguidores · perfil {pf.publico === 'publico' ? 'público' : 'só para amigos'}</p>
        </div>
      </header>
      <div className="perfil19__botoes">
        <button type="button" onClick={() => abrirConversa(pid)}>Mensagem</button>
        <button type="button" disabled={!podeTentar(disponibilidade(vida, seguir))} onClick={() => agir(seguir)}>{segue ? 'Deixar de seguir' : 'Seguir de perto'}</button>
        <button type="button" onClick={() => abrirPessoa(pid)}>Ficha completa</button>
      </div>
      {pf.marcos.length > 0 && (<section><h4>O que {p.genero === 'feminino' ? 'ela' : p.genero === 'masculino' ? 'ele' : 'elu'} mostra</h4><ul className="perfil19__marcos">{pf.marcos.map((m, k) => <li key={k}>{m}</li>)}</ul></section>)}
      {pf.conexoes.length > 0 && (
        <section>
          <h4>Conexões</h4>
          <ul className="perfil19__conexoes">
            {pf.conexoes.map(c => (
              <li key={c.pid}>
                {vida.vinculos[c.pid] ? <button type="button" onClick={() => abrirPerfil(c.pid)}><Rosto vida={vida} p={vida.pessoas[c.pid]} tamanho={30} /><span><strong>{c.nome}</strong><span>{c.rotulo}</span></span></button>
                  : <span className="perfil19__fora"><Rosto vida={vida} p={vida.pessoas[c.pid]} tamanho={30} /><span><strong>{c.nome}</strong><span>{c.rotulo}</span></span></span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h4>Publicações</h4>
        {pf.posts.length ? <ol className="feed19__lista">{pf.posts.map(x => <Cartao key={x.chave} vida={vida} post={x} agir={agir} abrirPerfil={abrirPerfil} abrirConversa={abrirConversa} />)}</ol>
          : <p className="cel__vazio">{pf.publico === 'amigos' && !pf.marcos.length ? 'Perfil fechado: só amigos veem as publicações.' : 'Nada publicado nos últimos anos.'}</p>}
      </section>
    </div>
  );
}

export function Feed19({ vida, agir, abrirPessoa, abrirConversa, contas }: Props & { contas: ReactNode }) {
  const [aba, setAba] = useState<'feed' | 'alta' | 'contas'>('feed');
  const [perfil, setPerfil] = useState<string | null>(null);
  const abrirPerfil = (id: string) => { if (vida.vinculos[id]) setPerfil(id); };
  if (perfil) return <Perfil vida={vida} pid={perfil} agir={agir} abrirPessoa={abrirPessoa} abrirConversa={abrirConversa} abrirPerfil={abrirPerfil} voltar={() => setPerfil(null)} />;
  const posts = aba === 'feed' ? feed19(vida) : [];
  const alta = aba === 'alta' ? emAlta19(vida) : [];
  return (
    <div className="rede15 feed19">
      <div className="namoro__abas" role="tablist">
        <button type="button" role="tab" aria-selected={aba === 'feed'} className={aba === 'feed' ? 'ativa' : ''} onClick={() => setAba('feed')}>Feed</button>
        <button type="button" role="tab" aria-selected={aba === 'alta'} className={aba === 'alta' ? 'ativa' : ''} onClick={() => setAba('alta')}>Em alta</button>
        <button type="button" role="tab" aria-selected={aba === 'contas'} className={aba === 'contas' ? 'ativa' : ''} onClick={() => setAba('contas')}>Minhas contas</button>
      </div>
      {aba === 'feed' && (posts.length ? <ol className="feed19__lista">{posts.map(x => <Cartao key={x.chave} vida={vida} post={x} agir={agir} abrirPerfil={abrirPerfil} abrirConversa={abrirConversa} />)}</ol>
        : <p className="cel__vazio">Ninguém da sua vida publicou nada nos últimos dois anos.</p>)}
      {aba === 'alta' && (alta.length ? (
        <ol className="feed19__alta">
          {alta.map((x, k) => (
            <li key={x.id}>
              <span className="feed19__pos">{k + 1}</span>
              <span><strong>{x.texto}</strong><span>{x.origem}</span></span>
              {x.pid && vida.vinculos[x.pid] && <button type="button" onClick={() => abrirPerfil(x.pid!)}>Ver perfil</button>}
            </li>
          ))}
        </ol>
      ) : <p className="cel__vazio">Nada da sua rede está circulando agora.</p>)}
      {aba === 'contas' && contas}
    </div>
  );
}
