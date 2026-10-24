/**
 * Minha Semana → Celular (FIX pós-REWORK 4; REWORK 9: a aba chama-se Celular).
 *
 * Sete plataformas, cada uma com o seu jeito (`dados/redes`), todas simuladas
 * dentro do jogo (offline). A tela responde a "quero postar no Instagram",
 * "quero crescer no YouTube", "quero ser tóxico no X", "quero apagar a conta":
 * a lista de plataformas no alto (com a conta de cada uma, quando há) e, ao
 * escolher uma, o que dá para fazer NELA — publicar (o que a vida tem para
 * mostrar), marcar uma celebridade, provocar, promover, verificar, monetizar,
 * comprar público, apagar. O preço e o risco de cada coisa são ditos antes.
 */

import { useState } from 'react';
import type { PlataformaId, Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { PLATAFORMAS, ORDEM_PLATAFORMAS } from '../../motor/dados/redes';
import { BANIMENTO_MESES, celebridadesDoPais, conteudosPossiveis, custoDaCampanha, custoDePromover, custoDoPacote, custoDoSelo, LIMITE_DO_ANO, leituraDaConta, leituraDoBalanco, PACOTES, seguidoresConhecidos, usaPlataforma, type Conteudo } from '../../motor/sistemas/redes';
import { contaAtiva, seguidoresEmPalavras } from '../../motor/sistemas/redesBase';
import { BotaoAcao, navegarAbas } from '../comum';
import { disponibilidade } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import { dinheiroCurto } from '../leituraMaterial';
import { Retrato } from '../avatar/Retrato';
import { DESENHOS } from './Emblemas';
import type { ContaSocial, Publicacao, TemaPublicacao } from '../../motor/tipos';

const DESENHO_DO_TEMA: Record<TemaPublicacao, string> = {
  cotidiano: 'semana', viagem: 'camera', trabalho: 'pasta', conquista: 'estrela', arte: 'pincel', pet: 'coracao', familia: 'familia', opiniao: 'conversa',
  humor: 'mascaras', esporte: 'bola', musica: 'nota', jogo: 'controle', tutorial: 'estudo', bastidores: 'video', politica: 'bandeira', exclusivo: 'coracao',
  desculpas: 'conversa', rebater: 'conversa', divulgar: 'microfone', conversa: 'conversa', receita: 'panela', estilo: 'tesoura', estudo: 'livro', comunidade: 'maos'
};
const TemaDesenho = ({ tema, tamanho = 28 }: { tema: TemaPublicacao; tamanho?: number }) => <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d={DESENHOS[DESENHO_DO_TEMA[tema]] ?? DESENHOS.semana} /></svg>;

/** O que cada rede chama de "ver": viram, visualizações, espectadores, assinantes... */
const VER: Record<PlataformaId, string> = { instagram: 'viram', tiktok: 'visualizações', youtube: 'visualizações', twitch: 'assistiram ao vivo', x: 'leram', facebook: 'viram', onlyfans: 'assinantes viram' };

/**
 * REWORK 7 — O QUE VOCÊ PUBLICOU, no formato de cada rede (não a mesma lista com outro nome): a grade quadrada do
 * Instagram, os vídeos em pé do TikTok, a fila de vídeos do YouTube, as lives da Twitch, a linha do tempo de texto do
 * X, o mural com quem reagiu do Facebook, o conteúdo trancado do OnlyFans. As publicações são as do motor (o tema, o
 * texto, o alcance, quem reagiu, a polêmica); só a forma muda.
 */
function Feed({ vida, agir, id, lista }: { vida: Vida; agir: (a: Acao) => boolean; id: PlataformaId; lista: Publicacao[] }) {
  const nomes = (x: Publicacao) => (x.pessoas ?? []).map(p => vida.pessoas[p]?.nome).filter(Boolean).slice(0, 3) as string[];
  const apagar = (x: Publicacao) => x.polemica && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'apagar_publicacao', plataforma: id, id: x.id } }} agir={agir} variante="discreto">Apagar</BotaoAcao>;
  return (
    <ul className={`rede__publicacoes rede__publicacoes--${id}`} aria-label="O que você publicou">
      {lista.map(x => {
        const cls = `publicacao publicacao--${id}${x.polemica ? ' publicacao--polemica' : ''}${x.viral ? ' publicacao--viral' : ''}`;
        const alcance = `${seguidoresEmPalavras(x.alcance)} ${VER[id]}`;
        if (id === 'instagram' || id === 'tiktok' || id === 'onlyfans') return (
          <li key={x.id} className={cls} title={x.texto}>
            <span className="publicacao__quadro">{id === 'onlyfans' ? <TemaDesenho tema="exclusivo" tamanho={30} /> : <TemaDesenho tema={x.tema} tamanho={30} />}{x.viral && <span className="publicacao__selo">viral</span>}</span>
            <span className="publicacao__texto">{x.texto}</span>
            <span className="publicacao__alcance">{id === 'tiktok' ? '▶ ' : ''}{alcance}{x.reacao ? ` · ${x.reacao}` : ''}</span>
            {apagar(x)}
          </li>
        );
        if (id === 'youtube' || id === 'twitch') return (
          <li key={x.id} className={cls}>
            <span className="publicacao__quadro">{id === 'twitch' && <span className="publicacao__selo publicacao__selo--live">live</span>}<TemaDesenho tema={x.tema} tamanho={32} /></span>
            <span className="publicacao__corpo">
              <span className="publicacao__texto">{x.texto}</span>
              <span className="publicacao__alcance">{alcance} · {anoDe(x.t)}{x.reacao ? ` · ${x.reacao}` : ''}</span>
              {apagar(x)}
            </span>
          </li>
        );
        return (
          <li key={x.id} className={cls}>
            <span className="publicacao__ano">{anoDe(x.t)}</span>
            <span className="publicacao__texto">{x.texto}{x.reacao ? <span className="publicacao__reacao"> — {x.reacao}</span> : null}</span>
            <span className="publicacao__alcance">{alcance}{nomes(x).length ? ` · ${id === 'facebook' ? 'curtiram' : 'responderam'}: ${nomes(x).join(', ')}` : ''}</span>
            {apagar(x)}
          </li>
        );
      })}
    </ul>
  );
}

/** A marca de cada plataforma: uma forma simples e genérica (nada de logotipo), na cor que o mundo associa a ela. */
const GLIFO: Record<PlataformaId, string> = {
  instagram: 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM16.8 7.2h.01',
  youtube: 'M4 7.5c0-1.4 1-2.5 2.4-2.6C8.2 4.8 10 4.7 12 4.7s3.8.1 5.6.2c1.4.1 2.4 1.2 2.4 2.6v9c0 1.4-1 2.5-2.4 2.6-1.8.1-3.6.2-5.6.2s-3.8-.1-5.6-.2C5 19 4 17.9 4 16.5zM10 9v6l5-3z',
  tiktok: 'M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.6 2.4 2.2 3.8 5 4',
  twitch: 'M5 4h15v10l-4 4h-4l-3 3v-3H5zM11 8v4M15 8v4',
  x: 'M4 6h16v10H10l-4 3v-3H4zM8 10h8M8 13h5',
  facebook: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19a5 5 0 0 1 10 0M16 11a2.5 2.5 0 1 0 0-5M15 13.6a4.5 4.5 0 0 1 5.5 5.4',
  onlyfans: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13zM12 14.5v2.5'
};

function Glifo({ id, tamanho = 22 }: { id: PlataformaId; tamanho?: number }) {
  return <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d={GLIFO[id]} /></svg>;
}

/**
 * REWORK 7.5 — O CELULAR. As redes deixam de ser uma fileira de botões: são aplicativos num celular (um aparelho do
 * jogo, sem marca, sem logotipo de ninguém — cada app tem uma forma simples na cor que o mundo associa a ele). Abrir
 * um app é abrir a conta naquela rede, no formato dela (a grade, os vídeos, a linha do tempo, a live, o conteúdo
 * trancado), com o que dá para fazer ali. A tela inicial é o que chegou: o alcance da última publicação de cada conta,
 * quem reagiu, a renda, a verificação em análise, a suspensão — tudo do motor, nada inventado.
 *
 * O celular abre no app que você mais usa (como um aparelho de verdade volta ao último app); sem conta nenhuma, no
 * Instagram, para criar. A fileira de apps embaixo é a navegação (um `tablist`, pelo teclado também) e está sempre ali.
 * Tudo é local: nenhuma internet, nenhum serviço de fora.
 */
export function RedesSociais({ vida, agir, abrirPessoa }: { vida: Vida; agir: (a: Acao) => boolean; abrirPessoa?: (id: string) => void }) {
  const i = idade(vida);
  const contas = ORDEM_PLATAFORMAS.filter(p => contaAtiva(vida, p));
  const primeira = [...contas].sort((a, b) => (contaAtiva(vida, b)!.seguidores - contaAtiva(vida, a)!.seguidores))[0] ?? 'instagram';
  const [tela, setTela] = useState<PlataformaId | 'inicio'>(primeira);
  if (i < 10) return <p className="nota">Rede social, por enquanto, é coisa dos mais velhos da casa.</p>;
  const avisos = notificacoes(vida);
  const mover = (e: React.KeyboardEvent, k: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const prox = ORDEM_PLATAFORMAS[(k + d + ORDEM_PLATAFORMAS.length) % ORDEM_PLATAFORMAS.length];
    setTela(prox);
    (e.currentTarget.parentElement?.parentElement?.querySelector(`[data-app="${prox}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div className="redes redes--com-lado">
      <div className={`celular celular--${tela}`} role="region" aria-label="Seu celular">
        <div className="celular__tela">
          <div className="celular__status" aria-hidden>
            <span>{anoDe(vida.t)}</span>
            <span className="celular__camera" />
            <span>{contas.length ? `${contas.length} ${contas.length === 1 ? 'conta' : 'contas'}` : 'sem contas'}</span>
          </div>
          <div className="celular__topo">
            {tela !== 'inicio'
              ? <button type="button" className="celular__voltar" onClick={() => setTela('inicio')} aria-label="Voltar para a tela inicial do celular">‹ Início{avisos.length ? <span className="celular__contador" aria-label={`${avisos.length} notificações`}>{avisos.length}</span> : null}</button>
              : <span className="celular__titulo">Tela inicial</span>}
            {tela !== 'inicio' && <span className="celular__app-nome" style={{ ['--cor-plataforma' as string]: PLATAFORMAS[tela].cor }}><Glifo id={tela} tamanho={18} /> {PLATAFORMAS[tela].nome}</span>}
          </div>
          <div className="celular__conteudo">
            {tela === 'inicio'
              ? <TelaInicial vida={vida} avisos={avisos} abrir={setTela} />
              : <Plataforma key={tela} vida={vida} agir={agir} id={tela} abrirPessoa={abrirPessoa} />}
          </div>
          <ul className="redes__plataformas celular__apps" role="tablist" aria-label="Plataformas">
            {ORDEM_PLATAFORMAS.map((id, k) => {
              const pl = PLATAFORMAS[id];
              const c = contaAtiva(vida, id);
              const fora = i < pl.idadeMin;
              return (
                <li key={id} role="presentation">
                  <button type="button" role="tab" data-app={id} aria-selected={tela === id} tabIndex={tela === id || (tela === 'inicio' && k === 0) ? 0 : -1}
                    className={`plataforma${tela === id ? ' plataforma--aberta' : ''}${c ? ' plataforma--com-conta' : ''}${fora ? ' plataforma--fora' : ''}`} style={{ ['--cor-plataforma' as string]: pl.cor }}
                    onClick={() => setTela(id)} onKeyDown={e => mover(e, k)}>
                    <span className="plataforma__glifo"><Glifo id={id} /></span>
                    <span className="plataforma__nome">{pl.nome}</span>
                    <span className="plataforma__estado">{c ? `${seguidoresEmPalavras(c.seguidores)} ${c.seguidores === 1 ? pl.publico[0] : pl.publico[1]}` : fora ? `a partir dos ${pl.idadeMin}` : 'sem conta'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* REWORK 9 · UX-02: o que não precisa estar DENTRO do aparelho (o público ano a ano, os números da conta) fica ao
          lado no desktop (a largura que sobrava) e embaixo no celular — o aparelho deixa de ser uma tira comprida. */}
      <aside className="redes__lado" aria-label="Os números das redes">
        {tela !== 'inicio' && contaAtiva(vida, tela) ? <NumerosDaConta vida={vida} id={tela} /> : <ResumoDasContas vida={vida} abrir={setTela} />}
        <p className="nota redes__intro">Tudo é simulado dentro do jogo, sem internet. Cada rede funciona de um jeito: o mesmo vídeo explode numa e passa batido na outra — e quem da sua vida está lá reage.</p>
      </aside>
    </div>
  );
}

/** Ao lado do aparelho, com um app aberto: o público ano a ano (o balanço do motor) e o que a conta já viveu. */
function NumerosDaConta({ vida, id }: { vida: Vida; id: PlataformaId }) {
  const c = contaAtiva(vida, id)!;
  const pl = PLATAFORMAS[id];
  const t = c.totais;
  const anos = (c.anos ?? []).slice(-6);
  return (
    <section className="numeros-rede" aria-label={`${pl.nome}: histórico e estatísticas`} style={{ ['--cor-plataforma' as string]: pl.cor }}>
      <h3 className="numeros-rede__titulo"><Glifo id={id} tamanho={18} /> {pl.nome}: histórico e números</h3>
      <BalancoDoPublico vida={vida} conta={c} publico={pl.publico[1]} />
      {/* REWORK 11 · SOC-11.5: o histórico é o fechamento de cada ano (a legenda é visível, não só para o leitor de tela) e
          termina no número de agora — o que entrou no ano em curso aparece como "agora", não como contradição. */}
      {anos.length >= 1 && (
        <div className="numeros-rede__historico">
          <p className="nota numeros-rede__legenda">No fim de cada ano — e o número de agora:</p>
          <ol className="numeros-rede__anos" aria-label={`${pl.publico[1]} no fim de cada ano, e agora`}>
            {anos.map(b => <li key={b.desde}><span className="numeros-rede__ano">{anoDe(b.desde)}</span> <strong>{seguidoresEmPalavras(b.fim ?? 0)}</strong></li>)}
            <li className="numeros-rede__ano--agora"><span className="numeros-rede__ano">agora ({anoDe(vida.t)})</span> <strong>{seguidoresEmPalavras(c.seguidores)}</strong></li>
          </ol>
        </div>
      )}
      {t && (
        <dl className="numeros-rede__totais">
          <div><dt>Publicações</dt><dd>{t.publicacoes}</dd></div>
          <div><dt>Virais</dt><dd>{t.virais}</dd></div>
          <div><dt>Maior público</dt><dd>{seguidoresEmPalavras(t.maior)}</dd></div>
          {t.receita > 0 && <div><dt>Já rendeu</dt><dd>{dinheiroCurto(t.receita)}</dd></div>}
        </dl>
      )}
    </section>
  );
}

/** Na tela inicial: cada conta, o público de agora e o do fim do último ano (um toque abre o app). */
function ResumoDasContas({ vida, abrir }: { vida: Vida; abrir: (id: PlataformaId) => void }) {
  const contas = ORDEM_PLATAFORMAS.filter(p => contaAtiva(vida, p));
  if (!contas.length) return null;
  return (
    <section className="numeros-rede" aria-label="As suas contas">
      <h3 className="numeros-rede__titulo">As suas contas</h3>
      <ul className="numeros-rede__contas">
        {contas.map(id => {
          const c = contaAtiva(vida, id)!;
          const ult = c.anos?.[c.anos.length - 1];
          const d = ult && ult.fim !== undefined ? ult.fim - ult.inicio : undefined;
          const noAno = crescimentoNoAno(vida, c);
          return (
            <li key={id}>
              <button type="button" className="numeros-rede__conta" style={{ ['--cor-plataforma' as string]: PLATAFORMAS[id].cor }} onClick={() => abrir(id)}>
                <Glifo id={id} tamanho={18} /> <span>{PLATAFORMAS[id].nome}</span>
                <strong>{seguidoresEmPalavras(c.seguidores)}</strong> <span className="nota">hoje</span>
                {noAno && <span className={`numeros-rede__delta numeros-rede__delta--${noAno.valor > 0 ? 'ganho' : 'perda'}`}>{noAno.texto}</span>}
                {ult && d !== undefined && d !== 0 && <span className={`numeros-rede__delta numeros-rede__delta--${d > 0 ? 'ganho' : 'perda'}`}>{d > 0 ? '+' : '−'}{seguidoresEmPalavras(Math.abs(d))} em {anoDe(ult.desde)} (ano fechado)</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * REWORK 11 · SOC-11.5: quanto o público mudou no ano EM CURSO (o balanço aberto: desde o fechamento do ano anterior) —
 * "+X desde o fim de 2055". Sem balanço aberto, ou sem mudança, nada.
 */
export function crescimentoNoAno(vida: Vida, c: ContaSocial): { valor: number; texto: string } | undefined {
  const b = leituraDoBalanco(vida, c, 'aberto');
  if (!b) return undefined;
  const valor = c.seguidores - b.inicio;
  if (!valor) return undefined;
  const fechou = c.anos?.length ? anoDe(c.anos[c.anos.length - 1].desde) : undefined;
  return { valor, texto: `${valor > 0 ? '+' : '−'}${seguidoresEmPalavras(Math.abs(valor))} ${fechou !== undefined ? `desde o fim de ${fechou}` : 'desde o começo do registro'}` };
}

/** O que cada rede conta no perfil (o motor guarda o total de publicações, os virais, o maior alcance). */
function perfilDaRede(id: PlataformaId, c: NonNullable<ReturnType<typeof contaAtiva>>): string {
  const n = c.totais?.publicacoes ?? c.publicacoes.length;
  const virais = c.totais?.virais ?? 0;
  const maior = c.totais?.maior ? seguidoresEmPalavras(c.totais.maior) : undefined;
  const pl = (um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
  switch (id) {
    case 'youtube': return [pl('vídeo no canal', 'vídeos no canal'), maior && `o mais visto: ${maior} visualizações`].filter(Boolean).join(' · ');
    case 'tiktok': return [pl('vídeo', 'vídeos'), virais ? `${virais} ${virais === 1 ? 'viralizou' : 'viralizaram'}` : undefined].filter(Boolean).join(' · ');
    case 'twitch': return [pl('live', 'lives'), maior && `o maior público: ${maior}`].filter(Boolean).join(' · ');
    case 'x': return [pl('post', 'posts'), (c.totais?.polemicas ?? 0) ? `${c.totais!.polemicas} ${c.totais!.polemicas === 1 ? 'polêmica' : 'polêmicas'}` : undefined].filter(Boolean).join(' · ');
    case 'facebook': return pl('publicação no mural', 'publicações no mural');
    case 'onlyfans': return [pl('conteúdo exclusivo', 'conteúdos exclusivos'), c.monetizada !== undefined ? 'assinatura ativa' : 'sem assinatura ainda'].join(' · ');
    default: return [pl('publicação', 'publicações'), maior && `a mais vista: ${maior}`].filter(Boolean).join(' · ');
  }
}

interface Notificacao { id: string; app: PlataformaId; texto: string; tom: 'bom' | 'ruim' | 'neutro' }

/** O que chegou no celular: só o que o motor registrou (a última publicação de cada conta, a renda, a verificação, a punição). */
function notificacoes(vida: Vida): Notificacao[] {
  const out: Notificacao[] = [];
  for (const id of ORDEM_PLATAFORMAS) {
    const guardada = vida.redes?.contas[id];
    if (guardada?.banida !== undefined && guardada.apagada !== undefined && vida.t - guardada.banida <= 12) out.push({ id: `${id}:ban`, app: id, texto: `A conta foi banida${guardada.motivoPunicao ? ` (${guardada.motivoPunicao})` : ''}.`, tom: 'ruim' });
    const l = leituraDaConta(vida, id);
    if (!l) continue;
    const c = l.conta;
    const pl = PLATAFORMAS[id];
    const ult = c.publicacoes.filter(x => !x.apagada).slice(-1)[0];
    if (l.suspensa) out.push({ id: `${id}:susp`, app: id, texto: `A conta foi suspensa depois das denúncias${c.motivoPunicao ? ` (${c.motivoPunicao})` : ''}.`, tom: 'ruim' });
    if (ult && vida.t - ult.t <= 12) out.push({ id: `${id}:${ult.id}`, app: id, texto: `${ult.viral ? 'Viralizou: ' : ''}“${ult.texto}” — ${seguidoresEmPalavras(ult.alcance)} ${VER[id]}${ult.novos > 0 ? `, +${seguidoresEmPalavras(ult.novos)} ${ult.novos === 1 ? pl.publico[0] : pl.publico[1]}` : ''}${ult.reacao ? ` · ${ult.reacao}` : ''}.`, tom: ult.polemica ? 'ruim' : ult.viral ? 'bom' : 'neutro' });
    if (l.renda > 0) out.push({ id: `${id}:renda`, app: id, texto: `Rendendo ${dinheiroCurto(l.renda)} por mês.`, tom: 'bom' });
    if (c.pedidoVerificacao !== undefined) out.push({ id: `${id}:verif`, app: id, texto: 'O pedido de verificação está em análise — a resposta sai na virada do ano.', tom: 'neutro' });
  }
  return out;
}

function TelaInicial({ vida, avisos, abrir }: { vida: Vida; avisos: Notificacao[]; abrir: (id: PlataformaId) => void }) {
  // REWORK 11 · SOC-11: publicar começa pela plataforma (fora de um app); dentro de um app, esse passo é pulado.
  const [publicar, setPublicar] = useState(false);
  const ondePublicar = ORDEM_PLATAFORMAS.filter(id => { const l = leituraDaConta(vida, id); return l && !l.suspensa; });
  return (
    <div className="celular__inicio">
      {ondePublicar.length > 0 && (
        <div className="fluxo-post">
          {!publicar
            ? <button type="button" className="botao botao--principal" onClick={() => setPublicar(true)}>Publicar</button>
            : (
              <>
                <h3 className="celular__secao">Publicar onde?</h3>
                <ul className="fluxo-post__opcoes">
                  {ondePublicar.map(id => <li key={id}><button type="button" className="botao botao--secundario fluxo-post__opcao" style={{ ['--cor-plataforma' as string]: PLATAFORMAS[id].cor }} onClick={() => abrir(id)}><span><Glifo id={id} tamanho={16} /> {PLATAFORMAS[id].nome}</span><span className="fluxo-post__dica">{seguidoresEmPalavras(contaAtiva(vida, id)!.seguidores)} {PLATAFORMAS[id].publico[1]}</span></button></li>)}
                </ul>
                <button type="button" className="link" onClick={() => setPublicar(false)}>Cancelar</button>
              </>
            )}
        </div>
      )}
      <h3 className="celular__secao">Notificações</h3>
      {avisos.length === 0
        ? <p className="nota">{ORDEM_PLATAFORMAS.some(p => contaAtiva(vida, p)) ? 'Nada novo neste ano.' : 'Nenhuma conta ainda. Toque num app embaixo para criar.'}</p>
        : (
          <ul className="celular__avisos">
            {avisos.map(a => (
              <li key={a.id}>
                <button type="button" className={`celular__aviso celular__aviso--${a.tom}`} style={{ ['--cor-plataforma' as string]: PLATAFORMAS[a.app].cor }} onClick={() => abrir(a.app)}>
                  <span className="celular__aviso-app"><Glifo id={a.app} tamanho={16} /> {PLATAFORMAS[a.app].nome}</span>
                  <span className="celular__aviso-texto">{a.texto}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/**
 * REWORK 9 · SOC-01 — DE ONDE VEIO O PÚBLICO: o balanço do último ano fechado, parcela por parcela, com as causas que
 * o motor registrou no instante em que cada seguidor chegou ou foi embora. A conta fecha (o teste confere a mesma
 * leitura). Conta sem ano fechado: nada — nenhuma explicação inventada para o que veio antes do registro.
 */
export function BalancoDoPublico({ vida, conta, publico }: { vida: Vida; conta: ContaSocial; publico: string }) {
  const b = leituraDoBalanco(vida, conta);
  if (!b) return null;
  return (
    <section className="balanco-publico" aria-label="De onde veio o público">
      <h4 className="plataforma-painel__sub">O público em {b.ano} (ano fechado)</h4>
      <p className="balanco-publico__de-para"><span>{seguidoresEmPalavras(b.inicio)}</span> <span aria-hidden>→</span><span className="sr-only">para</span> <strong>{seguidoresEmPalavras(b.fim)}</strong> {publico}</p>
      <p className="nota balanco-publico__posts">{b.publicacoes === 0 ? 'Nenhuma publicação no ano.' : `${b.publicacoes} ${b.publicacoes === 1 ? 'publicação' : 'publicações'} no ano.`}</p>
      {b.linhas.length === 0
        ? <p className="nota">Ninguém chegou, ninguém foi embora.</p>
        : (
          <ul className="balanco-publico__linhas">
            {b.linhas.map(l => (
              <li key={l.id} className={`balanco-publico__linha balanco-publico__linha--${l.valor > 0 ? 'ganho' : 'perda'}`} data-parcela={l.id}>
                <span className="balanco-publico__valor">{l.valor > 0 ? '+' : '−'}{seguidoresEmPalavras(Math.abs(l.valor))}</span>
                <span className="balanco-publico__causa">{l.rotulo}{l.motivos.length ? <span className="balanco-publico__motivo"> — {l.motivos.join('; ')}</span> : null}</span>
              </li>
            ))}
          </ul>
        )}
      {b.marcos.length > 0 && <p className="nota balanco-publico__marcos">No período: {b.marcos.join(' · ')}</p>}
    </section>
  );
}

type TelaDoApp = 'perfil' | 'publicar' | 'feed' | 'conta';
const TELAS_DO_APP: { id: TelaDoApp; rotulo: string }[] = [{ id: 'perfil', rotulo: 'Perfil' }, { id: 'publicar', rotulo: 'Publicar' }, { id: 'feed', rotulo: 'Feed' }, { id: 'conta', rotulo: 'Conta' }];

function Plataforma({ vida, agir, id, abrirPessoa }: { vida: Vida; agir: (a: Acao) => boolean; id: PlataformaId; abrirPessoa?: (id: string) => void }) {
  const [promover, setPromover] = useState(false);
  // REWORK 9 · UX-02: dentro do app, quatro telas curtas (como num aparelho de verdade) em vez de uma tira comprida.
  const [telaApp, setTelaApp] = useState<TelaDoApp>('publicar');
  const [mais, setMais] = useState<null | 'celebridade' | 'provocar' | 'conta'>(null);
  const [apagar, setApagar] = useState(false);
  const pl = PLATAFORMAS[id];
  const l = leituraDaConta(vida, id);
  const estilo = { ['--cor-plataforma' as string]: pl.cor };
  if (!l) {
    const guardada = vida.redes?.contas[id];
    const banida = guardada?.banida !== undefined && guardada.apagada !== undefined ? guardada : undefined;
    const conhecidos = Object.values(vida.vinculos).map(x => vida.pessoas[x.pessoaId]).filter(p => p?.vivo && !p.especie && usaPlataforma(vida, p, id)).length;
    return (
      <section className="plataforma-painel" style={estilo} aria-label={pl.nome}>
        <h3 className="plataforma-painel__titulo"><Glifo id={id} tamanho={26} /> {pl.nome}</h3>
        <p className="plataforma-painel__como">{pl.como}</p>
        {id !== 'onlyfans' && conhecidos > 0 && <p className="nota">{conhecidos === 1 ? 'Uma pessoa da sua vida está' : `${conhecidos} pessoas da sua vida estão`} lá.</p>}
        {id === 'onlyfans' && <p className="nota">Só para maiores de idade, com documento. Paga por assinante; quem você conhece pode descobrir — o parceiro, a família, o trabalho.</p>}
        {banida && (
          <div className="plataforma-painel__bloco">
            <p className="nota nota--ruim"><span aria-hidden>! </span>A {pl.nome} baniu a sua conta em {anoDe(banida.banida!)}{banida.motivoPunicao ? `, por ${banida.motivoPunicao}` : ''}, depois de {banida.suspensoes ?? 3} suspensões. Uma conta nova aqui, só a partir de {anoDe(banida.banida! + BANIMENTO_MESES)}.</p>
            <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'recorrer', plataforma: id } }} agir={agir} variante="secundario" mostrarChance ocultarImpossivel>Recorrer do banimento</BotaoAcao>
          </div>
        )}
        <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'criar', plataforma: id } }} agir={agir} variante="principal">Criar uma conta no {pl.nome}</BotaoAcao>
      </section>
    );
  }
  const c = l.conta;
  const conteudos = conteudosPossiveis(vida, id);
  const conhecidos = seguidoresConhecidos(vida, id);
  const ultimas = c.publicacoes.filter(x => !x.apagada).slice(-6).reverse();
  const celebridades = celebridadesDoPais(vida);
  const provocaveis = conhecidos.slice(0, 4);
  // O aviso que vale para todas as publicações (o ano cheio, a semana apertada) é dito UMA vez, acima delas.
  const avisos = conteudos.map(t => disponibilidade(vida, { tipo: 'rede', op: { oque: 'publicar', plataforma: id, tema: t.tema, promover } })).filter(d => podeTentar(d) && d.motivo).map(d => d.motivo!);
  const avisoComum = avisos.length === conteudos.length && avisos.length > 0 && avisos.every(x => x === avisos[0]) ? avisos[0] : undefined;
  const painel = (t: TelaDoApp) => `app-tela app-tela--${t}${telaApp === t ? ' app-tela--aberta' : ''}`;
  return (
    <section className="plataforma-painel" style={estilo} aria-label={pl.nome}>
      <ul className="app-abas" role="tablist" aria-label={`Telas do ${pl.nome}`} onKeyDown={navegarAbas}>
        {TELAS_DO_APP.map(x => (
          <li key={x.id} role="presentation">
            <button type="button" role="tab" aria-selected={telaApp === x.id} tabIndex={telaApp === x.id ? 0 : -1} className={`app-abas__item${telaApp === x.id ? ' app-abas__item--aberta' : ''}`} onClick={() => setTelaApp(x.id)}>
              {x.rotulo}{x.id === 'feed' && ultimas.length ? <span className="app-abas__n"> {ultimas.length}</span> : null}
            </button>
          </li>
        ))}
      </ul>
      <div className={painel('perfil')} role="tabpanel" aria-label="Perfil">
      <header className={`plataforma-painel__cabeca plataforma-painel__cabeca--${id}`}>
        {/* REWORK 7.5: o perfil no formato da rede — o banner do canal, a fileira de números do perfil, o "ao vivo". */}
        <span className="plataforma-painel__avatar"><Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} tamanho={id === 'youtube' || id === 'twitch' ? 48 : 56} rotulo={`@${c.arroba}`} /></span>
        <h3 className="plataforma-painel__titulo"><Glifo id={id} tamanho={26} /> @{c.arroba}{l.verificacao && (l.verificacao.startsWith('verificada') || l.verificacao === 'selo pago' || l.verificacao === 'identidade verificada') ? <span className="selo-verificado" title={l.verificacao} aria-label={l.verificacao}>✓</span> : null}</h3>
        <p className="plataforma-painel__numero"><strong>{seguidoresEmPalavras(c.seguidores)}</strong> {pl.publico[1]} <span className="nota">hoje</span>{c.comprados ? <span className="nota"> ({seguidoresEmPalavras(l.real)} de verdade)</span> : null}{(() => { const x = crescimentoNoAno(vida, c); return x ? <span className="nota plataforma-painel__no-ano"> · {x.texto}</span> : null; })()}</p>
        <p className="plataforma-painel__perfil">{perfilDaRede(id, c)}</p>
      </header>
      <dl className="plataforma-painel__dados">
        <div><dt>Engajamento</dt><dd>{l.engajamento}</dd></div>
        <div><dt>Credibilidade</dt><dd>{l.credibilidade}</dd></div>
        <div><dt>Renda</dt><dd>{l.renda > 0 ? `${dinheiroCurto(l.renda)}/mês` : c.monetizada !== undefined ? 'monetizada (sem renda agora)' : 'não monetizada'}</dd></div>
        {l.verificacao && <div><dt>Selo</dt><dd>{l.verificacao}</dd></div>}
      </dl>
      {l.suspensa && <p className="nota nota--ruim"><span aria-hidden>! </span>A conta está suspensa até {anoDe(c.suspensaAte!)}: a {pl.nome} puniu as denúncias{c.motivoPunicao ? ` (${c.motivoPunicao})` : ''}. Até lá, nada de publicar.{(c.suspensoes ?? 0) >= 2 ? ' Mais uma suspensão e a conta é banida.' : ''}</p>}
      {l.suspensa && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'recorrer', plataforma: id } }} agir={agir} variante="discreto" mostrarChance ocultarImpossivel>Recorrer da suspensão</BotaoAcao>}
      {l.toxica && !l.suspensa && <p className="nota nota--atencao">A conta ficou com fama de briguenta: menos gente quer ser marcada por você, e a próxima denúncia pesa.</p>}
      {(c.advertencias ?? 0) > 0 && !l.suspensa && <p className="nota">Advertências: {c.advertencias} de 3{c.motivoPunicao ? ` — a última por ${c.motivoPunicao}` : ''}.{(c.suspensoes ?? 0) > 0 ? ` A conta já foi suspensa ${c.suspensoes === 1 ? 'uma vez' : `${c.suspensoes} vezes`}; na terceira suspensão, é banida.` : ''}</p>}
      {conhecidos.length > 0 && <p className="nota">Da sua vida, acompanham você aqui: {conhecidos.slice(0, 4).map(p => p.nome).join(', ')}{conhecidos.length > 4 ? ` e mais ${conhecidos.length - 4}` : ''}.</p>}
      </div>

      <div className={painel('publicar')} role="tabpanel" aria-label={pl.verbo}>
      <h4 className="plataforma-painel__sub">{pl.verbo}</h4>
      <p className="nota">{l.noAno >= LIMITE_DO_ANO ? 'O ano já teve publicação demais.' : l.noAno >= 3 ? `Já foram ${l.noAno} neste ano: cada nova alcança um pouco menos.` : 'O que a sua vida tem para mostrar agora:'}</p>
      {avisoComum && <p className="acao__aviso app-tela__aviso">{avisoComum}</p>}
      <FluxoPublicar key={`${id}:${l.noAno}`} vida={vida} agir={agir} id={id} conteudos={conteudos} promover={promover} setPromover={setPromover} />
      </div>

      <div className={painel('feed')} role="tabpanel" aria-label="Feed">
      {ultimas.length > 0 ? <Feed vida={vida} agir={agir} id={id} lista={ultimas} /> : <p className="nota">Nada publicado ainda. A primeira publicação começa em "Publicar".</p>}
      </div>

      <div className={painel('conta')} role="tabpanel" aria-label="Conta">
      <div className="plataforma-painel__mais" role="group" aria-label="Mais coisas para fazer">
        {id !== 'onlyfans' && <button type="button" className="botao botao--discreto" aria-expanded={mais === 'celebridade'} onClick={() => setMais(m => (m === 'celebridade' ? null : 'celebridade'))}>Marcar uma celebridade</button>}
        {id !== 'onlyfans' && <button type="button" className="botao botao--discreto" aria-expanded={mais === 'provocar'} onClick={() => setMais(m => (m === 'provocar' ? null : 'provocar'))}>Provocar, trollar</button>}
        <button type="button" className="botao botao--discreto" aria-expanded={mais === 'conta'} onClick={() => setMais(m => (m === 'conta' ? null : 'conta'))}>A conta: crescer, verificar, monetizar, apagar</button>
      </div>
      {mais === 'celebridade' && (
        <div className="plataforma-painel__bloco">
          <p className="nota">Marcar alguém famoso numa publicação. O normal, para quem não é ninguém, é não acontecer nada — mas às vezes a pessoa curte, responde, compartilha.</p>
          <div className="grupo-acoes grupo-acoes--linha">
            {celebridades.map(x => <BotaoAcao key={x.id} vida={vida} acao={{ tipo: 'rede', op: { oque: 'mencionar', plataforma: id, celebridade: x.id } }} agir={agir} variante="discreto">{`${x.nome} (${x.papel})`}</BotaoAcao>)}
          </div>
        </div>
      )}
      {mais === 'provocar' && (
        <div className="plataforma-painel__bloco">
          <p className="nota">Briga dá audiência — às vezes. Quase sempre deixa conta: denúncia, advertência, gente da sua vida ofendida, o trabalho vendo o print.</p>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'trollar', plataforma: id, alvo: 'estranho' } }} agir={agir} variante="perigo">Provocar um estranho nos comentários</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'trollar', plataforma: id, alvo: 'celebridade' } }} agir={agir} variante="perigo">Atacar uma celebridade</BotaoAcao>
            {provocaveis.map(p => <BotaoAcao key={p.id} vida={vida} acao={{ tipo: 'rede', op: { oque: 'trollar', plataforma: id, alvo: p.id } }} agir={agir} variante="perigo">{`Provocar ${p.nome} em público`}</BotaoAcao>)}
          </div>
        </div>
      )}
      {mais === 'conta' && (
        <div className="plataforma-painel__bloco">
          <div className="grupo-acoes grupo-acoes--linha">
            {id !== 'onlyfans' && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'promover_conta', plataforma: id } }} agir={agir} variante="secundario">{`Fazer uma campanha paga (${dinheiroCurto(custoDaCampanha(vida, c))})`}</BotaoAcao>}
            <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'verificar', plataforma: id } }} agir={agir} variante="secundario" ocultarImpossivel>{pl.verificacao === 'paga' ? `Assinar o selo (${dinheiroCurto(custoDoSelo(vida))} por ano)` : pl.verificacao === 'documento' ? 'Verificar a identidade (documento)' : 'Pedir a verificação'}</BotaoAcao>
            {c.monetizada === undefined && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'monetizar', plataforma: id } }} agir={agir} variante="secundario">{`Monetizar (${pl.monetiza.como})`}</BotaoAcao>}
            {id !== 'onlyfans' && PACOTES.map((pk, k) => <BotaoAcao key={k} vida={vida} acao={{ tipo: 'rede', op: { oque: 'comprar', plataforma: id, pacote: k as 0 | 1 | 2 } }} agir={agir} variante="discreto">{`Comprar ${seguidoresEmPalavras(pk.n)} ${pl.publico[1]} (${dinheiroCurto(custoDoPacote(vida, k as 0 | 1 | 2))})`}</BotaoAcao>)}
          </div>
          {pl.verificacao === 'notoriedade' && <p className="nota">A verificação não é um clique: a {pl.nome} olha se você é de interesse público (o nome, ou um público grande e de verdade). A resposta sai na virada do ano.</p>}
          {id !== 'onlyfans' && <p className="nota">Público comprado infla o número, não as curtidas: o engajamento cai, a credibilidade cai — e a {pl.nome} pode descobrir.</p>}
          {!apagar
            ? <button type="button" className="botao botao--perigo" onClick={() => setApagar(true)}>Apagar a conta…</button>
            : (
              <div className="confirmar">
                <p className="nota nota--atencao">Apagar a conta no {pl.nome}? {seguidoresEmPalavras(c.seguidores)} {pl.publico[1]}{c.monetizada !== undefined ? ' e a renda dela' : ''} somem. O que já foi vivido continua na sua história.</p>
                <div className="grupo-acoes grupo-acoes--linha">
                  <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'apagar_conta', plataforma: id } }} agir={agir} variante="perigo" aoAgir={() => setApagar(false)}>Sim, apagar</BotaoAcao>
                  <button type="button" className="botao botao--discreto" onClick={() => setApagar(false)}>Não</button>
                </div>
              </div>
            )}
        </div>
      )}
      {abrirPessoa && conhecidos.length > 0 && <p className="nota">Seguir, deixar de seguir ou bloquear alguém: na ficha da pessoa, em Pessoas.</p>}
      </div>
    </section>
  );
}

/**
 * REWORK 11 · SOC-11 — PUBLICAR EM PASSOS (a plataforma já está escolhida: estamos dentro do app): o TIPO de conteúdo (o
 * que a vida, a idade, o trabalho e esta rede oferecem — `conteudosPossiveis`), CONFIGURAR (impulsionar, com o preço; o
 * risco dito) e CONFIRMAR. A ação é a de sempre (`rede · publicar`): nenhuma função antiga se perdeu.
 */
function FluxoPublicar({ vida, agir, id, conteudos, promover, setPromover, aoPublicar }: { vida: Vida; agir: (a: Acao) => boolean; id: PlataformaId; conteudos: Conteudo[]; promover: boolean; setPromover: (x: boolean) => void; aoPublicar?: () => void }) {
  const [tema, setTema] = useState<TemaPublicacao | null>(null);
  const [passo, setPasso] = useState<'tipo' | 'configurar' | 'confirmar'>('tipo');
  const pl = PLATAFORMAS[id];
  const escolhido = conteudos.find(t => t.tema === tema);
  const arriscado = (t: TemaPublicacao) => t === 'opiniao' || t === 'rebater' || t === 'politica';
  const PASSOS: { id: typeof passo; rotulo: string }[] = [{ id: 'tipo', rotulo: '1. O quê' }, { id: 'configurar', rotulo: '2. Como' }, { id: 'confirmar', rotulo: '3. Publicar' }];
  return (
    <div className="fluxo-post" aria-label="Publicar, passo a passo">
      <ol className="fluxo-post__passos">{PASSOS.map(x => <li key={x.id} aria-current={passo === x.id ? 'step' : undefined}>{x.rotulo}</li>)}</ol>
      {passo === 'tipo' && (
        <ul className="fluxo-post__opcoes plataforma-painel__temas" aria-label="O tipo de conteúdo">
          {conteudos.map(t => {
            const d = disponibilidade(vida, { tipo: 'rede', op: { oque: 'publicar', plataforma: id, tema: t.tema } });
            const pode = podeTentar(d);
            return (
              <li key={t.tema}>
                <button type="button" className={`botao botao--${arriscado(t.tema) ? 'discreto' : 'secundario'} fluxo-post__opcao`} disabled={!pode} onClick={() => { setTema(t.tema); setPasso('configurar'); }}>
                  <span><TemaDesenho tema={t.tema} tamanho={18} /> {t.rotulo}</span>
                  {t.dica && <span className="fluxo-post__dica">{t.dica}</span>}
                  {!pode && d.motivo && <span className="fluxo-post__dica">{d.motivo}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {passo === 'configurar' && escolhido && (
        <div className="plataforma-painel__bloco">
          <p><strong>{escolhido.rotulo}</strong>{escolhido.dica ? <span className="nota"> — {escolhido.dica}</span> : null}</p>
          {id !== 'onlyfans' && <label className="rede__promover"><input type="checkbox" checked={promover} onChange={e => setPromover(e.target.checked)} /> Impulsionar a publicação ({dinheiroCurto(custoDePromover(vida))}): alcança mais gente — e chama mais atenção.</label>}
          {arriscado(escolhido.tema) && <p className="nota nota--atencao">Pode virar briga nos comentários — e a briga pode ser denunciada (advertência, suspensão; na terceira suspensão, a conta é banida).</p>}
          <div className="grupo-acoes grupo-acoes--linha">
            <button type="button" className="botao botao--secundario" onClick={() => setPasso('confirmar')}>Continuar</button>
            <button type="button" className="link" onClick={() => { setTema(null); setPasso('tipo'); }}>← Escolher outro</button>
          </div>
        </div>
      )}
      {passo === 'confirmar' && escolhido && (
        <div className="plataforma-painel__bloco">
          <p>No {pl.nome}: <strong>{escolhido.rotulo}</strong>{promover ? `, impulsionada (${dinheiroCurto(custoDePromover(vida))})` : ''}.</p>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'publicar', plataforma: id, tema: escolhido.tema, promover } }} agir={agir} variante="principal" aoAgir={() => { setTema(null); setPasso('tipo'); aoPublicar?.(); }}>{pl.verbo}</BotaoAcao>
            <button type="button" className="link" onClick={() => setPasso('configurar')}>← Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
}
