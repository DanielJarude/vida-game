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

export function RedesSociais({ vida, agir, abrirPessoa }: { vida: Vida; agir: (a: Acao) => boolean; abrirPessoa?: (id: string) => void }) {
  const i = idade(vida);
  const primeira = ORDEM_PLATAFORMAS.find(p => contaAtiva(vida, p)) ?? 'instagram';
  const [aberta, setAberta] = useState<PlataformaId>(primeira);
  if (i < 10) return <p className="nota">Rede social, por enquanto, é coisa dos mais velhos da casa.</p>;
  return (
    <div className="redes">
      <p className="nota redes__intro">Tudo aqui é simulado dentro do jogo. Cada rede funciona de um jeito: o mesmo vídeo explode numa e passa batido na outra. Quem da sua vida está em cada uma reage ao que você publica.</p>
      <ul className="redes__plataformas" role="tablist" aria-label="Plataformas">
        {ORDEM_PLATAFORMAS.map(id => {
          const pl = PLATAFORMAS[id];
          const c = contaAtiva(vida, id);
          const fora = i < pl.idadeMin;
          return (
            <li key={id} role="presentation">
              <button type="button" role="tab" aria-selected={aberta === id} className={`plataforma${aberta === id ? ' plataforma--aberta' : ''}${c ? ' plataforma--com-conta' : ''}${fora ? ' plataforma--fora' : ''}`} style={{ ['--cor-plataforma' as string]: pl.cor }} onClick={() => setAberta(id)}>
                <span className="plataforma__glifo"><Glifo id={id} /></span>
                <span className="plataforma__nome">{pl.nome}</span>
                <span className="plataforma__estado">{c ? `${seguidoresEmPalavras(c.seguidores)} ${c.seguidores === 1 ? pl.publico[0] : pl.publico[1]}` : fora ? `a partir dos ${pl.idadeMin}` : 'sem conta'}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Plataforma key={aberta} vida={vida} agir={agir} id={aberta} abrirPessoa={abrirPessoa} />
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
  const ultimas = c.publicacoes.filter(x => !x.apagada).slice(-3).reverse();
  const celebridades = celebridadesDoPais(vida);
  const provocaveis = conhecidos.slice(0, 4);
  return (
    <section className="plataforma-painel" style={estilo} aria-label={pl.nome}>
      <header className="plataforma-painel__cabeca">
        <h3 className="plataforma-painel__titulo"><Glifo id={id} tamanho={26} /> @{c.arroba}{l.verificacao && (l.verificacao.startsWith('verificada') || l.verificacao === 'selo pago' || l.verificacao === 'identidade verificada') ? <span className="selo" title={l.verificacao} aria-label={l.verificacao}>✓</span> : null}</h3>
        <p className="plataforma-painel__numero"><strong>{seguidoresEmPalavras(c.seguidores)}</strong> {pl.publico[1]}{c.comprados ? <span className="nota"> ({seguidoresEmPalavras(l.real)} de verdade)</span> : null}</p>
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
      {ultimas.length > 0 && (
        <ul className="rede__publicacoes">
          {ultimas.map(x => (
            <li key={x.id} className={`publicacao${x.polemica ? ' publicacao--polemica' : ''}${x.viral ? ' publicacao--viral' : ''}`}>
              <span className="publicacao__ano">{anoDe(x.t)}</span>
              <span className="publicacao__texto">{x.texto}{x.reacao ? <span className="publicacao__reacao"> — {x.reacao}</span> : null}</span>
              <span className="publicacao__alcance">{seguidoresEmPalavras(x.alcance)} viram{x.pessoas?.length ? ` · ${x.pessoas.map(p => vida.pessoas[p]?.nome).filter(Boolean).slice(0, 2).join(', ')}` : ''}</span>
              {x.polemica && <BotaoAcao vida={vida} acao={{ tipo: 'rede', op: { oque: 'apagar_publicacao', plataforma: id, id: x.id } }} agir={agir} variante="discreto">Apagar</BotaoAcao>}
            </li>
          ))}
        </ul>
      )}

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
