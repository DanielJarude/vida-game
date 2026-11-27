/**
 * REWORK 10 · UX-13 — a História em duas partes. A página única empilhava o retrato, o ano que passou e vinte anos de
 * biografia (≈ dez telas no celular): o que pedia atenção e o próximo passo ficavam no painel lateral, que no celular
 * nem aparece. Agora:
 *
 *   Agora      onde a vida está (o retrato), o ano que passou, o que pede você (no celular, o mesmo painel "Agora" do
 *              lado) e os últimos anos que marcaram — com o caminho para a biografia inteira;
 *   Biografia  a Linha da Vida completa, com os fios e as conquistas.
 *
 * Depois de viver um ano, a História abre no "Agora" (o Jogo volta a parte), no ano que passou.
 */
import type { ReactNode } from 'react';
import type { Vida } from '../../motor/tipos';
import { MemoriaDeEscolhas } from '../v38/MemoriaDeEscolhas';
import { idade } from '../../motor/nucleo';
import { Subnav } from '../comum';
import { faseDaVida } from '../apresentar';
import type { Aba } from '../navegacao';
import { RetratoDaVida } from './RetratoDaVida';
import { LinhaDaVida } from './LinhaDaVida';
import { sobDemanda } from '../util/sobDemanda';
import { FitaDaVida } from '../v17/areas/Capas17';
import { StatusDaVida31 } from '../v31/StatusDaVida31';

/** VIDA 12.5: a Retrospectiva (o álbum e a linha do tempo) vem sob demanda. */
const Retrospectiva = sobDemanda(() => import('./Retrospectiva').then(m => m.Retrospectiva));

export type ParteHistoria = 'agora' | 'biografia' | 'retrospectiva';
export const PARTES_HISTORIA: { id: ParteHistoria; rotulo: string; oque: string }[] = [
  { id: 'agora', rotulo: 'Agora', oque: 'Onde a vida está, o ano que passou e o que pede você' },
  { id: 'biografia', rotulo: 'Biografia', oque: 'A Linha da Vida inteira, por fios e conquistas' },
  { id: 'retrospectiva', rotulo: 'Retrospectiva', oque: 'O álbum da vida: a linha do tempo e os momentos marcantes' }
];

/** Quantos anos o "Agora" mostra da Linha da Vida. */
export const ANOS_NO_AGORA = 3;

export function Historia({ vida, marca, parte, irParte, irPara, abrirPessoa, anoQuePassou, pedeVoce }: {
  vida: Vida; marca: number; parte: ParteHistoria; irParte: (p: ParteHistoria) => void; irPara: (a: Aba) => void; abrirPessoa: (id: string) => void;
  /** O fechamento do ano que acabou de passar (o Jogo monta). */
  anoQuePassou?: ReactNode;
  /** No celular, o painel "Agora" (o que pede atenção, as portas, o que está em andamento) dentro da página. */
  pedeVoce?: ReactNode;
}) {
  const i = idade(vida);
  const subnav = <Subnav rotulo="Partes da História" prefixo="historia" itens={PARTES_HISTORIA} atual={parte} aoMudar={irParte} classe="subnav--historia" />;
  // VIDA 31 · O HOJE: o alto (quem, onde, as barras da vida), o que pede você ao lado (no celular, logo abaixo do alto) e,
  // embaixo, o ano que passou e os últimos anos. A Biografia e a Retrospectiva continuam como partes.
  if (parte === 'agora') return (
    <div className="historia historia--agora hoje31">
      <div className="hoje31__topo">
        <RetratoDaVida vida={vida} irPara={irPara} abrirPessoa={abrirPessoa} />
        <StatusDaVida31 vida={vida} irPara={irPara} />
        <FitaDaVida vida={vida} />
        {subnav}
      </div>
      {pedeVoce && <section className="pede-voce hoje31__lado" aria-label="O que pede você"><h2 className="secao__titulo">O que pede você</h2>{pedeVoce}</section>}
      <div role="tabpanel" id="historia-painel" aria-labelledby={`historia-aba-${parte}`} className="hoje31__corpo">
        {anoQuePassou}
        <h2 className="secao__titulo historia__recente">Os últimos anos</h2>
        <LinhaDaVida vida={vida} marca={marca} abrirPessoa={abrirPessoa} compacta={{ anos: ANOS_NO_AGORA, aoVerTudo: () => irParte('biografia') }} />
      </div>
    </div>
  );
  return (
    <div className={`historia historia--${parte}`}>
      {parte !== 'biografia' && <FitaDaVida vida={vida} />}
      {/* VIDA 38 · bloco 3: as escolhas que a pessoa fez, recolhidas, sem repetir a Linha da Vida */}
      {parte === 'biografia' && <MemoriaDeEscolhas vida={vida} />}
      <header className="folio">
        <p className="folio__kicker"><span className="folio__area">Hoje</span> · {parte === 'biografia' ? 'Biografia' : 'Retrospectiva'} · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
        <h1 className="folio__titulo">{vida.eu.nome} {vida.eu.sobrenome}</h1>
      </header>
      {subnav}
      <div role="tabpanel" id="historia-painel" aria-labelledby={`historia-aba-${parte}`}>
        {parte === 'biografia' && <LinhaDaVida vida={vida} marca={marca} abrirPessoa={abrirPessoa} />}
        {parte === 'retrospectiva' && <Retrospectiva vida={vida} abrirPessoa={abrirPessoa} />}
      </div>
    </div>
  );
}
