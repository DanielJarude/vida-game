/**
 * VIDA 30 · O QUE VOCÊ PUBLICOU, como post de verdade: você e o @, a mídia (a miniatura do vídeo ou da live, com título,
 * categoria, duração ou "ao vivo" e espectadores), a legenda que você escreveu, curtidas e comentários de quem reagiu.
 */
import type { PlataformaId, Publicacao, Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { idade } from '../../../motor/nucleo';
import { anoDe, MESES, mesDe } from '../../../motor/tempo';
import { seguidoresEmPalavras } from '../../../motor/sistemas/redesBase';
import { comentariosProprios30, curtidasProprias30, legendaPropria30, previaPropria30 } from '../../../motor/v30/redes/redes30';
import { BotaoAcao } from '../../comum';
import { Retrato } from '../../avatar/Retrato';
import { TemaDesenho } from '../../jogo/Redes';
import './redes30.css';

const COR_DO_TEMA: Record<string, [string, string]> = {
  jogo: ['#3b1d6e', '#9146ff'], musica: ['#5a1a3a', '#e0457b'], viagem: ['#0b4f6c', '#20bf55'], pet: ['#7a4b12', '#f2b134'], humor: ['#6a2c70', '#f08a5d'],
  receita: ['#7d2e0b', '#f4a261'], esporte: ['#123c69', '#2ec4b6'], conversa: ['#2b2d42', '#8d99ae'], trabalho: ['#22333b', '#5e7d8e'], estilo: ['#5f0f40', '#fb8b24']
};

export function Previa30({ vida, pl, pub, grande, n = 0 }: { vida: Vida; pl: PlataformaId; pub: Publicacao; grande?: boolean; n?: number }) {
  const p = previaPropria30(vida, pl, pub, n);
  if (!p) return null;
  const [a, b] = COR_DO_TEMA[pub.tema] ?? ['#1f2a44', '#4f6d9a'];
  return (
    <div className={`previa30 previa30--${pl}${grande ? ' previa30--grande' : ''}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} role="img" aria-label={`${p.aoVivo ? 'Live' : 'Vídeo'}: ${p.titulo}`}>
      <span className="previa30__arte"><TemaDesenho tema={pub.tema} tamanho={grande ? 54 : 40} /></span>
      <span className="previa30__rosto"><Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} tamanho={grande ? 72 : 52} rotulo="" /></span>
      {p.aoVivo ? <span className="previa30__vivo">AO VIVO</span> : <span className="previa30__duracao">{p.duracao}</span>}
      {p.aoVivo && <span className="previa30__esp">{seguidoresEmPalavras(p.espectadores ?? 0)} espectadores</span>}
      {!p.aoVivo && pl !== 'tiktok' && <span className="previa30__play" aria-hidden>▶</span>}
      <span className="previa30__titulo">{p.titulo}</span>
      <span className="previa30__cat">{p.categoria}</span>
    </div>
  );
}

export default function MeusPosts30({ vida, agir, id, arroba, lista }: { vida: Vida; agir: (a: Acao) => boolean; id: PlataformaId; arroba: string; lista: Publicacao[] }) {
  return (
    <ol className="meus30" aria-label="O que você publicou">
      {lista.map((x, n) => {
        const coms = comentariosProprios30(vida, x);
        const video = id === 'twitch' || id === 'youtube' || id === 'tiktok';
        return (
          <li key={x.id} className={`meus30__post${x.polemica ? ' meus30__post--polemica' : ''}${x.viral ? ' meus30__post--viral' : ''}`}>
            <header className="meus30__quem">
              <Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={idade(vida)} semente={vida.eu.semente ?? 'eu'} tamanho={34} rotulo="" />
              <span><strong>@{arroba}</strong><span>{MESES[mesDe(x.t)].slice(0, 3)} de {anoDe(x.t)}{x.promovida ? ' · impulsionado' : ''}{x.viral ? ' · viralizou' : ''}</span></span>
            </header>
            {video ? <Previa30 vida={vida} pl={id} pub={x} n={n} /> : id !== 'x' && <div className="meus30__foto"><TemaDesenho tema={x.tema} tamanho={46} /><span>{x.texto}</span></div>}
            <p className="meus30__legenda">{legendaPropria30(vida, x, n)}</p>
            {id === 'x' && <p className="meus30__sobre">{x.texto}</p>}
            <p className="meus30__numeros"><span>♥ {seguidoresEmPalavras(curtidasProprias30(x))}</span><span>{seguidoresEmPalavras(x.alcance)} {video ? 'visualizações' : 'alcance'}</span>{x.novos > 0 && <span>+{seguidoresEmPalavras(x.novos)} seguidores</span>}{x.reacao && <span>{x.reacao}</span>}</p>
            {coms.length > 0 && <ul className="meus30__coms">{coms.map(c => <li key={c.pid}><strong>{c.nome}</strong> {c.texto}</li>)}</ul>}
            {x.polemica && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'apagar_publicacao', plataforma: id, id: x.id } }} agir={agir} variante="discreto">Apagar</BotaoAcao>}
          </li>
        );
      })}
    </ol>
  );
}
