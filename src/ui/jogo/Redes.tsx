/**
 * Tempo livre → Redes sociais (FIX pós-REWORK 4).
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
import { celebridadesDoPais, conteudosPossiveis, custoDaCampanha, custoDePromover, custoDoPacote, custoDoSelo, LIMITE_DO_ANO, leituraDaConta, PACOTES, seguidoresConhecidos, usaPlataforma } from '../../motor/sistemas/redes';
import { contaAtiva, seguidoresEmPalavras } from '../../motor/sistemas/redesBase';
import { BotaoAcao } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import { Retrato } from '../avatar/Retrato';
import { DESENHOS } from './Emblemas';
import type { Publicacao, TemaPublicacao } from '../../motor/tipos';

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
    <div className="redes">
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
      <p className="nota redes__intro">Tudo é simulado dentro do jogo, sem internet. Cada rede funciona de um jeito: o mesmo vídeo explode numa e passa batido na outra — e quem da sua vida está lá reage.</p>
    </div>
  );
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
    const l = leituraDaConta(vida, id);
    if (!l) continue;
    const c = l.conta;
    const pl = PLATAFORMAS[id];
    const ult = c.publicacoes.filter(x => !x.apagada).slice(-1)[0];
    if (l.suspensa) out.push({ id: `${id}:susp`, app: id, texto: `A conta foi suspensa depois das denúncias.`, tom: 'ruim' });
    if (ult && vida.t - ult.t <= 12) out.push({ id: `${id}:${ult.id}`, app: id, texto: `${ult.viral ? 'Viralizou: ' : ''}“${ult.texto}” — ${seguidoresEmPalavras(ult.alcance)} ${VER[id]}${ult.novos > 0 ? `, +${seguidoresEmPalavras(ult.novos)} ${ult.novos === 1 ? pl.publico[0] : pl.publico[1]}` : ''}${ult.reacao ? ` · ${ult.reacao}` : ''}.`, tom: ult.polemica ? 'ruim' : ult.viral ? 'bom' : 'neutro' });
    if (l.renda > 0) out.push({ id: `${id}:renda`, app: id, texto: `Rendendo ${dinheiroCurto(l.renda)} por mês.`, tom: 'bom' });
    if (c.pedidoVerificacao !== undefined) out.push({ id: `${id}:verif`, app: id, texto: 'O pedido de verificação está em análise — a resposta sai na virada do ano.', tom: 'neutro' });
  }
  return out;
}

function TelaInicial({ vida, avisos, abrir }: { vida: Vida; avisos: Notificacao[]; abrir: (id: PlataformaId) => void }) {
  return (
    <div className="celular__inicio">
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

function Plataforma({ vida, agir, id, abrirPessoa }: { vida: Vida; agir: (a: Acao) => boolean; id: PlataformaId; abrirPessoa?: (id: string) => void }) {
  const [promover, setPromover] = useState(false);
  const [mais, setMais] = useState<null | 'celebridade' | 'provocar' | 'conta'>(null);
  const [apagar, setApagar] = useState(false);
  const pl = PLATAFORMAS[id];
  const l = leituraDaConta(vida, id);
  const estilo = { ['--cor-plataforma' as string]: pl.cor };
  if (!l) {
    const conhecidos = Object.values(vida.vinculos).map(x => vida.pessoas[x.pessoaId]).filter(p => p?.vivo && !p.especie && usaPlataforma(vida, p, id)).length;
    return (
      <section className="plataforma-painel" style={estilo} aria-label={pl.nome}>
        <h3 className="plataforma-painel__titulo"><Glifo id={id} tamanho={26} /> {pl.nome}</h3>
        <p className="plataforma-painel__como">{pl.como}</p>
        {id !== 'onlyfans' && conhecidos > 0 && <p className="nota">{conhecidos === 1 ? 'Uma pessoa da sua vida está' : `${conhecidos} pessoas da sua vida estão`} lá.</p>}
        {id === 'onlyfans' && <p className="nota">Só para maiores de idade, com documento. Paga por assinante; quem você conhece pode descobrir — o parceiro, a família, o trabalho.</p>}
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
  return (
    <section className="plataforma-painel" style={estilo} aria-label={pl.nome}>
      <header className={`plataforma-painel__cabeca plataforma-painel__cabeca--${id}`}>
        {/* REWORK 7.5: o perfil no formato da rede — o banner do canal, a fileira de números do perfil, o "ao vivo". */}
        <span className="plataforma-painel__avatar"><Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} tamanho={id === 'youtube' || id === 'twitch' ? 48 : 56} rotulo={`@${c.arroba}`} /></span>
        <h3 className="plataforma-painel__titulo"><Glifo id={id} tamanho={26} /> @{c.arroba}{l.verificacao && (l.verificacao.startsWith('verificada') || l.verificacao === 'selo pago' || l.verificacao === 'identidade verificada') ? <span className="selo-verificado" title={l.verificacao} aria-label={l.verificacao}>✓</span> : null}</h3>
        <p className="plataforma-painel__numero"><strong>{seguidoresEmPalavras(c.seguidores)}</strong> {pl.publico[1]}{c.comprados ? <span className="nota"> ({seguidoresEmPalavras(l.real)} de verdade)</span> : null}</p>
        <p className="plataforma-painel__perfil">{perfilDaRede(id, c)}</p>
      </header>
      <dl className="plataforma-painel__dados">
        <div><dt>Engajamento</dt><dd>{l.engajamento}</dd></div>
        <div><dt>Credibilidade</dt><dd>{l.credibilidade}</dd></div>
        <div><dt>Renda</dt><dd>{l.renda > 0 ? `${dinheiroCurto(l.renda)}/mês` : c.monetizada !== undefined ? 'monetizada (sem renda agora)' : 'não monetizada'}</dd></div>
        {l.verificacao && <div><dt>Selo</dt><dd>{l.verificacao}</dd></div>}
      </dl>
      {l.suspensa && <p className="nota nota--ruim"><span aria-hidden>! </span>A conta está suspensa: a {pl.nome} puniu as denúncias. Até lá, nada de publicar.</p>}
      {l.toxica && !l.suspensa && <p className="nota nota--atencao">A conta ficou com fama de briguenta: menos gente quer ser marcada por você, e a próxima denúncia pesa.</p>}
      {(c.advertencias ?? 0) > 0 && !l.suspensa && <p className="nota">Advertências: {c.advertencias} de 3.</p>}
      {conhecidos.length > 0 && <p className="nota">Da sua vida, acompanham você aqui: {conhecidos.slice(0, 4).map(p => p.nome).join(', ')}{conhecidos.length > 4 ? ` e mais ${conhecidos.length - 4}` : ''}.</p>}

      <h4 className="plataforma-painel__sub">{pl.verbo}</h4>
      <p className="nota">{l.noAno >= LIMITE_DO_ANO ? 'O ano já teve publicação demais.' : l.noAno >= 3 ? `Já foram ${l.noAno} neste ano: cada nova alcança um pouco menos.` : 'O que a sua vida tem para mostrar agora:'}</p>
      <div className="grupo-acoes grupo-acoes--linha plataforma-painel__temas">
        {conteudos.map(t => (
          <div key={t.tema} className="tema-post">
            <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'publicar', plataforma: id, tema: t.tema, promover } }} agir={agir} variante={t.tema === 'opiniao' || t.tema === 'rebater' || t.tema === 'politica' ? 'discreto' : 'secundario'}>{t.rotulo}</BotaoAcao>
            {t.dica && <span className="tema-post__dica">{t.dica}</span>}
          </div>
        ))}
      </div>
      {id !== 'onlyfans' && <label className="rede__promover"><input type="checkbox" checked={promover} onChange={e => setPromover(e.target.checked)} /> Impulsionar a publicação ({dinheiroCurto(custoDePromover(vida))})</label>}
      {ultimas.length > 0 && <Feed vida={vida} agir={agir} id={id} lista={ultimas} />}

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
    </section>
  );
}
