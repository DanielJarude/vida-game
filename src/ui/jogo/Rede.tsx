/**
 * Na rede (REWORK 4): o Mural, a rede social do VIDA (simulada, offline).
 *
 * Não é um contador ao lado da vida: o que dá para publicar sai do que
 * aconteceu (a viagem, o trabalho, o bicho, a arte que você pratica); quem
 * reage é gente da sua vida; quem está longe às vezes comenta — e a conversa
 * recomeça. Monetizar, promover e comprar seguidores existem, com o preço de
 * cada um dito antes.
 */

import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { anoDe } from '../../motor/tempo';
import { custoDePromover, custoDoPacote, leituraDaConta, PACOTES, seguidoresConhecidos, temasPossiveis } from '../../motor/sistemas/redes';
import { PLATAFORMAS, PLATAFORMA_PADRAO, rendaDaRede, seguidoresEmPalavras } from '../../motor/sistemas/redesBase';
import { BotaoAcao, Secao } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';

export function NaRede({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [mais, setMais] = useState(false);
  const [promover, setPromover] = useState(false);
  const pl = PLATAFORMAS[PLATAFORMA_PADRAO];
  if (idade(vida) < pl.idadeMin) return null;
  const l = leituraDaConta(vida);
  if (!l) return (
    <Secao titulo="Na rede" recolhivel aberta={false}>
      <p className="nota">{pl.nome}: {pl.descricao.toLowerCase()} Quem da sua vida está lá segue você de volta; quem está longe às vezes aparece nos comentários.</p>
      <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'criar' } }} agir={agir} variante="secundario">Criar uma conta no {pl.nome}</BotaoAcao>
    </Secao>
  );
  const c = l.conta;
  const conhecidos = seguidoresConhecidos(vida);
  const ultimas = c.publicacoes.filter(x => !x.apagada).slice(-4).reverse();
  const renda = rendaDaRede(vida);
  return (
    <Secao titulo="Na rede" recolhivel aberta>
      <div className="rede">
        <div className="rede__conta">
          <span className="rede__arroba">@{c.arroba}</span>
          <span className="rede__numero"><strong>{seguidoresEmPalavras(c.seguidores)}</strong> seguidores</span>
          <span className="rede__cred">credibilidade {l.credibilidade}{renda > 0 ? ` · ${dinheiroCurto(renda)}/mês` : ''}</span>
        </div>
        {conhecidos.length > 0 && <p className="nota">Da sua vida, seguem você: {conhecidos.slice(0, 5).map(p => p.nome).join(', ')}{conhecidos.length > 5 ? ` e mais ${conhecidos.length - 5}` : ''}.</p>}
        <p className="rede__titulo">Publicar</p>
        <div className="grupo-acoes grupo-acoes--linha">
          {temasPossiveis(vida).map(t => <BotaoAcao key={t.tema} vida={vida} acao={{ tipo: 'rede', op: { oque: 'publicar', tema: t.tema, promover } }} agir={agir} variante={t.tema === 'opiniao' ? 'discreto' : 'secundario'}>{t.rotulo}</BotaoAcao>)}
        </div>
        <label className="rede__promover"><input type="checkbox" checked={promover} onChange={e => setPromover(e.target.checked)} /> Promover a publicação ({dinheiroCurto(custoDePromover(vida))})</label>
        {ultimas.length > 0 && (
          <ul className="rede__publicacoes">
            {ultimas.map(x => (
              <li key={x.id} className={`publicacao${x.polemica ? ' publicacao--polemica' : ''}${x.viral ? ' publicacao--viral' : ''}`}>
                <span className="publicacao__ano">{anoDe(x.t)}</span>
                <span className="publicacao__texto">{x.texto}</span>
                <span className="publicacao__alcance">{seguidoresEmPalavras(x.alcance)} viram{x.pessoas?.length ? ` · ${x.pessoas.map(id => vida.pessoas[id]?.nome).filter(Boolean).slice(0, 2).join(', ')}` : ''}</span>
                {x.polemica && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'apagar_publicacao', id: x.id } }} agir={agir} variante="discreto">Apagar</BotaoAcao>}
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="link link--discreto" aria-expanded={mais} onClick={() => setMais(x => !x)}>{mais ? 'Menos' : 'Monetizar, comprar seguidores, apagar a conta…'}</button>
        {mais && (
          <div className="grupo-acoes grupo-acoes--linha">
            {!l.renda && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'monetizar' } }} agir={agir} variante="secundario">Monetizar a conta</BotaoAcao>}
            {PACOTES.map((pk, k) => <BotaoAcao key={k} vida={vida} acao={{ tipo: 'rede', op: { oque: 'comprar', pacote: k as 0 | 1 | 2 } }} agir={agir} variante="discreto">Comprar {seguidoresEmPalavras(pk.n)} seguidores ({dinheiroCurto(custoDoPacote(vida, k as 0 | 1 | 2))}) — e a credibilidade?</BotaoAcao>)}
            <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'apagar_conta' } }} agir={agir} variante="perigo">Apagar a conta</BotaoAcao>
          </div>
        )}
      </div>
    </Secao>
  );
}
