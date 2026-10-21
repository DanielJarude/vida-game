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
import { idade } from '../../motor/nucleo';
import { Subnav } from '../comum';
import { faseDaVida } from '../apresentar';
import type { Aba } from '../navegacao';
import { RetratoDaVida } from './RetratoDaVida';
import { LinhaDaVida } from './LinhaDaVida';

export type ParteHistoria = 'agora' | 'biografia';
export const PARTES_HISTORIA: { id: ParteHistoria; rotulo: string; oque: string }[] = [
  { id: 'agora', rotulo: 'Agora', oque: 'Onde a vida está, o ano que passou e o que pede você' },
  { id: 'biografia', rotulo: 'Biografia', oque: 'A Linha da Vida inteira, por fios e conquistas' }
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
  return (
    <div className={`historia historia--${parte}`}>
      {parte === 'agora' && <RetratoDaVida vida={vida} irPara={irPara} abrirPessoa={abrirPessoa} />}
      {parte === 'biografia' && (
        <header className="folio">
          <p className="folio__kicker"><span className="folio__area">História</span> · Biografia · {i} {i === 1 ? 'ano' : 'anos'} · {faseDaVida(i)}</p>
          <h1 className="folio__titulo">{vida.eu.nome} {vida.eu.sobrenome}</h1>
        </header>
      )}
      <Subnav rotulo="Partes da História" prefixo="historia" itens={PARTES_HISTORIA} atual={parte} aoMudar={irParte} classe="subnav--historia" />
      <div role="tabpanel" id="historia-painel" aria-labelledby={`historia-aba-${parte}`}>
        {parte === 'agora' && (
          <>
            {anoQuePassou}
            {pedeVoce && <section className="pede-voce" aria-label="O que pede você"><h2 className="secao__titulo">O que pede você</h2>{pedeVoce}</section>}
            <h2 className="secao__titulo historia__recente">Os últimos anos</h2>
            <LinhaDaVida vida={vida} marca={marca} abrirPessoa={abrirPessoa} compacta={{ anos: ANOS_NO_AGORA, aoVerTudo: () => irParte('biografia') }} />
          </>
        )}
        {parte === 'biografia' && <LinhaDaVida vida={vida} marca={marca} abrirPessoa={abrirPessoa} />}
      </div>
    </div>
  );
}
