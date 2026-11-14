/**
 * VIDA 20 — OS APLICATIVOS SOCIAIS DO CELULAR. Cada rede é um app próprio (Instagram, TikTok, YouTube, X, Facebook,
 * Twitch, OnlyFans), com o cabeçalho, as cores e a barra de navegação dela — e com o botão de criar sempre à vista.
 *
 * Nada aqui é sistema novo: as publicações das pessoas da sua vida são as da VIDA Conectada (`feed19`, filtradas pela
 * rede), as suas são as da conta (`redes`), publicar é a ação de sempre (`rede · publicar`, um toque por conteúdo — o
 * impulso é um interruptor ao lado), e a gestão (selo, monetizar, campanha, comprar público, apagar) é o mesmo painel
 * da tela de Redes (`GestaoDaConta`). Seguidores, alcance, viral, renda e consequências vêm do motor, como sempre.
 */
import { useState, type ReactNode } from 'react';
import type { PlataformaId, Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { anoDe } from '../../../motor/tempo';
import { PLATAFORMAS } from '../../../motor/dados/redes';
import { conteudosPossiveis, custoDePromover, leituraDaConta, seguidoresConhecidos } from '../../../motor/sistemas/redes';
import { seguidoresEmPalavras } from '../../../motor/sistemas/redesBase';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { Retrato } from '../../avatar/Retrato';
import { BalancoDoPublico, Feed, GestaoDaConta, Glifo, notificacoes, perfilDaRede, TemaDesenho, crescimentoNoAno } from '../../jogo/Redes';
import { EmAlta19, FeedDaPlataforma19 } from '../../v19/conectada/Feed19';
import './appSocial20.css';

type Tela = 'inicio' | 'alta' | 'criar' | 'avisos' | 'perfil';
interface Props { vida: Vida; agir: (a: Acao) => boolean; id: PlataformaId; abrirPessoa: (id: string) => void; abrirConversa: (id: string) => void; voltar?: () => void }

/** A barra de cada app (o que cada rede chama de quê). */
const NAV: Record<PlataformaId, { tela: Tela; rotulo: string }[]> = {
  instagram: [{ tela: 'inicio', rotulo: 'Início' }, { tela: 'criar', rotulo: 'Criar' }, { tela: 'avisos', rotulo: 'Atividade' }, { tela: 'perfil', rotulo: 'Perfil' }],
  tiktok: [{ tela: 'inicio', rotulo: 'Para você' }, { tela: 'criar', rotulo: 'Postar' }, { tela: 'avisos', rotulo: 'Caixa' }, { tela: 'perfil', rotulo: 'Perfil' }],
  youtube: [{ tela: 'inicio', rotulo: 'Início' }, { tela: 'criar', rotulo: 'Enviar' }, { tela: 'avisos', rotulo: 'Avisos' }, { tela: 'perfil', rotulo: 'Seu canal' }],
  x: [{ tela: 'inicio', rotulo: 'Para você' }, { tela: 'alta', rotulo: 'Em alta' }, { tela: 'avisos', rotulo: 'Notificações' }, { tela: 'perfil', rotulo: 'Perfil' }],
  facebook: [{ tela: 'inicio', rotulo: 'Feed' }, { tela: 'criar', rotulo: 'Publicar' }, { tela: 'avisos', rotulo: 'Notificações' }, { tela: 'perfil', rotulo: 'Perfil' }],
  twitch: [{ tela: 'inicio', rotulo: 'Seguindo' }, { tela: 'criar', rotulo: 'Ir ao vivo' }, { tela: 'perfil', rotulo: 'Canal' }],
  onlyfans: [{ tela: 'inicio', rotulo: 'Início' }, { tela: 'criar', rotulo: 'Postar' }, { tela: 'perfil', rotulo: 'Perfil' }]
};
/** O botão de criar de cada app (o rótulo da composição). */
const CRIAR: Record<PlataformaId, string> = { instagram: 'Nova publicação', tiktok: 'Novo vídeo', youtube: 'Enviar vídeo', x: 'Postar', facebook: 'No que você está pensando?', twitch: 'Ir ao vivo', onlyfans: 'Novo conteúdo' };
const VAZIO: Record<PlataformaId, string> = {
  instagram: 'Ninguém da sua vida postou no Instagram nos últimos dois anos.', tiktok: 'Nenhum vídeo de quem você conhece por aqui ainda.', youtube: 'Nenhum canal de quem você conhece publicou vídeo.',
  x: 'Ninguém que você conhece postou no X por agora.', facebook: 'O mural de quem você conhece está quieto.', twitch: 'Ninguém que você conhece está ao vivo.', onlyfans: 'Aqui só aparece o que você publica.'
};
const ICONE_NAV: Record<Tela, string> = {
  inicio: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z', alta: 'M4 17l5-5 4 4 7-8M15 8h5v5', criar: 'M12 5v14M5 12h14',
  avisos: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0', perfil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0'
};
const Ico = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;

export function AppSocial20({ vida, agir, id, abrirPessoa, abrirConversa, voltar }: Props) {
  const pl = PLATAFORMAS[id];
  const l = leituraDaConta(vida, id);
  const [tela, setTela] = useState<Tela>('inicio');
  const nav = NAV[id];
  const avisos = notificacoes(vida).filter(a => a.app === id);
  const menor = idade(vida) < pl.idadeMin;
  let corpo: ReactNode;
  if (menor) corpo = <p className="app20__vazio">O {pl.nome} é a partir dos {pl.idadeMin} anos.</p>;
  else if (tela === 'inicio') corpo = <>
    {!l && <CriarConta vida={vida} agir={agir} id={id} />}
    {l && id !== 'onlyfans' && <button type="button" className="app20__compor" onClick={() => setTela('criar')}><Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} tamanho={32} rotulo="" /><span>{CRIAR[id]}</span></button>}
    {id === 'onlyfans' ? (l ? <MinhasPublicacoes vida={vida} agir={agir} id={id} /> : null) : <FeedDaPlataforma19 vida={vida} agir={agir} abrirPessoa={abrirPessoa} abrirConversa={abrirConversa} plataforma={id} vazio={VAZIO[id]} />}
  </>;
  else if (tela === 'alta') corpo = <EmAlta19 vida={vida} />;
  else if (tela === 'criar') corpo = l ? <Compor vida={vida} agir={agir} id={id} aoPublicar={() => setTela('perfil')} /> : <CriarConta vida={vida} agir={agir} id={id} />;
  else if (tela === 'avisos') corpo = l ? (avisos.length ? <ul className="app20__avisos">{avisos.map(a => <li key={a.id} className={`app20__aviso app20__aviso--${a.tom}`}>{a.texto}</li>)}</ul> : <p className="app20__vazio">Nada novo por aqui neste ano.</p>) : <CriarConta vida={vida} agir={agir} id={id} />;
  else corpo = l ? <PerfilDaConta vida={vida} agir={agir} id={id} abrirPessoa={abrirPessoa} /> : <CriarConta vida={vida} agir={agir} id={id} />;
  return (
    <div className={`app20 app20--${id}`} style={{ ['--cor-plataforma' as string]: pl.cor }} data-plataforma={id} data-tela={tela}>
      <header className="app20__topo">
        <span className="app20__esq">{voltar && <button type="button" className="app20__voltar" onClick={voltar} aria-label="Voltar à tela inicial">‹</button>}<span className="app20__marca"><Glifo id={id} tamanho={22} /><span>{pl.nome}</span></span></span>
        {l && !menor && <span className="app20__acoes">
          {nav.some(n => n.tela === 'avisos') && <button type="button" className="app20__icone" aria-label={`Notificações${avisos.length ? `, ${avisos.length}` : ''}`} onClick={() => setTela('avisos')}><Ico d={ICONE_NAV.avisos} />{avisos.length > 0 && <span className="app20__ponto" aria-hidden />}</button>}
          <button type="button" className="app20__criar" aria-label={CRIAR[id]} onClick={() => setTela('criar')}><Ico d={ICONE_NAV.criar} /></button>
        </span>}
      </header>
      <div className="app20__corpo">{corpo}</div>
      <nav className="app20__nav" aria-label={`Navegação do ${pl.nome}`}>
        {nav.map(n => (
          <button key={n.tela} type="button" className={`app20__nav-item${n.tela === 'criar' ? ' app20__nav-item--criar' : ''}`} aria-current={tela === n.tela ? 'page' : undefined} onClick={() => setTela(n.tela)}>
            <Ico d={ICONE_NAV[n.tela]} /><span>{n.rotulo}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
export default AppSocial20;

function CriarConta({ vida, agir, id }: { vida: Vida; agir: Props['agir']; id: PlataformaId }) {
  const pl = PLATAFORMAS[id];
  const conhecidos = seguidoresConhecidos(vida, id).length;
  return (
    <div className="app20__boas-vindas">
      <span className="app20__logo"><Glifo id={id} tamanho={44} /></span>
      <p>{pl.como}</p>
      {conhecidos > 0 && <p className="app20__nota">{conhecidos === 1 ? 'Uma pessoa da sua vida já está' : `${conhecidos} pessoas da sua vida já estão`} aqui.</p>}
      <BotaoAcao vida={vida} agir={agir} acao={{ tipo: 'rede', op: { oque: 'criar', plataforma: id } }} variante="principal">Criar conta</BotaoAcao>
    </div>
  );
}

/** Publicar: abrir, escolher o conteúdo, pronto — um toque (o impulso é um interruptor; o risco, dito no próprio botão). */
function Compor({ vida, agir, id, aoPublicar }: { vida: Vida; agir: Props['agir']; id: PlataformaId; aoPublicar: () => void }) {
  const [promover, setPromover] = useState(false);
  const pl = PLATAFORMAS[id];
  const l = leituraDaConta(vida, id)!;
  const conteudos = conteudosPossiveis(vida, id);
  const arriscado = (t: string) => t === 'opiniao' || t === 'rebater' || t === 'politica';
  return (
    <div className="app20__compor-tela">
      <h3 className="app20__titulo">{CRIAR[id]}</h3>
      <p className="app20__nota">{l.suspensa ? 'Conta suspensa: nada de publicar até a punição acabar.' : l.noAno >= 3 ? `Já foram ${l.noAno} neste ano: cada nova alcança um pouco menos.` : 'Toque no que você quer publicar.'}</p>
      {id !== 'onlyfans' && <label className="app20__impulso"><input type="checkbox" checked={promover} onChange={e => setPromover(e.target.checked)} /> Impulsionar ({dinheiroCurto(custoDePromover(vida))}) — mais alcance, mais atenção</label>}
      <ul className="app20__conteudos">
        {conteudos.map(t => {
          const acao: Acao = { tipo: 'rede', op: { oque: 'publicar', plataforma: id, tema: t.tema, promover } };
          return (
            <li key={t.tema}>
              <BotaoAcao vida={vida} agir={agir} acao={acao} variante="secundario" aoAgir={aoPublicar}>
                <span className="app20__conteudo"><TemaDesenho tema={t.tema} tamanho={20} /><span><strong>{t.rotulo}</strong>{(t.dica || arriscado(t.tema)) && <small>{arriscado(t.tema) ? 'Pode virar briga — e denúncia.' : t.dica}</small>}</span></span>
              </BotaoAcao>
            </li>
          );
        })}
      </ul>
      <p className="app20__nota">Publicado no {pl.nome}: o alcance, quem reagiu e os {pl.publico[1]} novos aparecem no seu perfil.</p>
    </div>
  );
}

function MinhasPublicacoes({ vida, agir, id }: { vida: Vida; agir: Props['agir']; id: PlataformaId }) {
  const l = leituraDaConta(vida, id);
  const ultimas = l ? l.conta.publicacoes.filter(x => !x.apagada).slice(-9).reverse() : [];
  return ultimas.length ? <Feed vida={vida} agir={agir} id={id} lista={ultimas} /> : <p className="app20__vazio">Nada publicado ainda — o botão de criar fica no alto.</p>;
}

function PerfilDaConta({ vida, agir, id, abrirPessoa }: { vida: Vida; agir: Props['agir']; id: PlataformaId; abrirPessoa: (id: string) => void }) {
  const pl = PLATAFORMAS[id];
  const l = leituraDaConta(vida, id)!;
  const c = l.conta;
  const conhecidos = seguidoresConhecidos(vida, id);
  const vistas = c.publicacoes.reduce((s, x) => s + x.alcance, 0);
  const cresc = crescimentoNoAno(vida, c);
  return (
    <div className="app20__perfil">
      <div className="app20__perfil-cabeca">
        <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} tamanho={64} rotulo={`@${c.arroba}`} />
        <div>
          <strong className="app20__arroba">@{c.arroba}{l.verificacao && /verificad|selo/.test(l.verificacao) ? <span className="selo-verificado" title={l.verificacao}> ✓</span> : null}</strong>
          <p className="app20__nota">{perfilDaRede(id, c)}</p>
        </div>
      </div>
      <dl className="app20__numeros">
        <div><dt>{pl.publico[1]}</dt><dd>{seguidoresEmPalavras(c.seguidores)}</dd></div>
        <div><dt>{id === 'youtube' || id === 'tiktok' ? 'visualizações' : 'alcance'}</dt><dd>{seguidoresEmPalavras(vistas)}</dd></div>
        <div><dt>seguindo</dt><dd>{conhecidos.length}</dd></div>
        {l.renda > 0 && <div><dt>renda</dt><dd>{dinheiroCurto(l.renda)}/mês</dd></div>}
      </dl>
      {cresc && <p className="app20__nota">{cresc.texto}.</p>}
      {l.suspensa && <p className="app20__alerta">Conta suspensa até {anoDe(c.suspensaAte!)}.</p>}
      <MinhasPublicacoes vida={vida} agir={agir} id={id} />
      {id === 'youtube' && <BalancoDoPublico vida={vida} conta={c} publico={pl.publico[1]} />}
      <details className="app20__gestao">
        <summary>Configurações da conta</summary>
        <GestaoDaConta vida={vida} agir={agir} id={id} abrirPessoa={abrirPessoa} />
        {id !== 'youtube' && <BalancoDoPublico vida={vida} conta={c} publico={pl.publico[1]} />}
      </details>
    </div>
  );
}
