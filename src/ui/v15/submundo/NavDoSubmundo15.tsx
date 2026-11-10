/**
 * VIDA 15 · O SUBMUNDO ORGANIZADO — as até dez partes do Submundo (antes, uma fileira de abas que no celular rolava de
 * lado) agrupadas pelo que o jogador procura: VOCÊ NO MEIO (a situação, a carreira, o que ficou), O QUE SE FAZ (as
 * propostas, os negócios, os mercados, os pedidos), GENTE E PODER (os contatos, as organizações) e A LEI (a justiça).
 * Cada parte diz numa linha o que tem; o número é o que pede resposta. As abas continuam abas (mesmos nomes, mesmas
 * setas do teclado): só a arrumação muda.
 */
import { navegarAbas, type ItemDeSubnav } from '../../comum';

const GRUPOS: { rotulo: string; ids: string[] }[] = [
  { rotulo: 'Você no meio', ids: ['geral', 'carreira', 'historico'] },
  { rotulo: 'O que se faz', ids: ['atividades', 'negocios', 'mercados', 'pedidos'] },
  { rotulo: 'Gente e poder', ids: ['contatos', 'organizacoes'] },
  { rotulo: 'A lei', ids: ['justica'] }
];
const OQUE: Record<string, string> = {
  geral: 'a situação, o rumo, o dinheiro do ano, a família',
  carreira: 'o patamar, os marcos, as frentes e o risco de cada uma',
  historico: 'o que você viveu, os rumos escolhidos, as anotações',
  atividades: 'as propostas que chegaram, as que correm, encomendar',
  negocios: 'os negócios por fora e a organização própria',
  mercados: 'o que se compra e vende sem nota',
  pedidos: 'pedir a alguém do meio um serviço por fora',
  contatos: 'quem é cada um, o que quer, deve e lembra',
  organizacoes: 'a relação, o posto, a disputa, o território',
  justica: 'a etapa, o processo, a defesa, a pena'
};

export function NavDoSubmundo15<T extends string>({ itens, atual, aoMudar }: { itens: ItemDeSubnav<T>[]; atual: T; aoMudar: (id: T) => void }) {
  const por = new Map(itens.map(x => [x.id as string, x]));
  const grupos = GRUPOS.map(g => ({ ...g, itens: g.ids.map(id => por.get(id)).filter((x): x is ItemDeSubnav<T> => !!x) })).filter(g => g.itens.length);
  return (
    <nav className="svivo15-nav" aria-label="Partes do Submundo">
      <div role="tablist" className="svivo15-nav__grupos" onKeyDown={navegarAbas}>
        {grupos.map(g => (
          <div key={g.rotulo} role="presentation" className="svivo15-nav__grupo">
            <span role="presentation" className="svivo15-nav__titulo">{g.rotulo}</span>
            {g.itens.map(x => (
              <button key={x.id} type="button" role="tab" id={`svivo-aba-${x.id}`} aria-selected={atual === x.id} aria-controls={atual === x.id ? 'svivo-painel' : undefined} tabIndex={atual === x.id ? 0 : -1}
                className={`svivo15-nav__item${atual === x.id ? ' svivo15-nav__item--ativo' : ''}`} onClick={() => aoMudar(x.id)}>
                <span className="svivo15-nav__rotulo">{x.rotulo}{x.conta !== undefined && x.conta > 0 ? <span className="subnav__conta">{x.conta}</span> : null}</span>
                <span className="svivo15-nav__oque">{x.oque && x.id === 'contatos' ? x.oque : OQUE[x.id] ?? x.oque ?? ''}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
