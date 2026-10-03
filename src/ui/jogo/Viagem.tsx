/**
 * A viagem escolhida em passos, não numa lista de tudo com tudo.
 *
 *   para fora:      país → cidade → duração → o resumo (com o preço) → confirmar
 *   pelo Brasil:    região → destino → duração → o resumo (com o preço) → confirmar
 *
 * Cada passo mostra só o nível em que se está; "Voltar" sobe um nível. O
 * catálogo vem do motor (catalogoDeViagem), derivado das mesmas escolhas da
 * ação: o que se confirma aqui é a mesma ação `experiencia` de sempre, com o
 * mesmo id de escolha e o mesmo preço. Restrições da porta inteira (a viagem
 * foi há pouco, falta dinheiro até para a mais barata) são ditas uma vez, em
 * Tempo livre, antes de abrir — não aqui, nem a cada duração.
 */

import { previsaoDaViagem } from '../../motor/sistemas/experiencias';
import { useEffect, useRef, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { catalogoDeViagem, type GrupoDeViagem } from '../../motor/sistemas/experiencias';
import { listaNatural } from '../../motor/texto';
import { BotaoAcao } from '../comum';
import { dinheiroCurto } from '../apresentar';

type Passo = 'grupo' | 'lugar' | 'duracao' | 'resumo';

const PERGUNTA: Record<'país' | 'região', Record<Passo, string>> = {
  'país': { grupo: 'Para qual país?', lugar: 'Qual cidade?', duracao: 'Por quanto tempo?', resumo: 'A viagem' },
  'região': { grupo: 'Para que parte do Brasil?', lugar: 'Qual destino?', duracao: 'Por quanto tempo?', resumo: 'A viagem' }
};

function Seta() {
  return <svg className="viagem__seta" viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
}

export function EscolherViagem({ vida, id, agir, aoConcluir }: { vida: Vida; id: 'viagem_pais' | 'viagem_exterior'; agir: (a: Acao) => boolean; aoConcluir?: () => void }) {
  const cat = catalogoDeViagem(vida, id);
  const [sel, setSel] = useState<{ grupo?: string; lugar?: string; duracao?: string }>({});
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeiraVez = useRef(true);

  const grupo = cat.grupos.find(g => g.id === sel.grupo);
  const lugar = grupo?.lugares.find(l => l.id === sel.lugar);
  const duracao = lugar?.duracoes.find(d => d.id === sel.duracao);
  const passo: Passo = !grupo ? 'grupo' : !lugar ? 'lugar' : !duracao ? 'duracao' : 'resumo';

  // A cada passo, o foco vai para a pergunta (quem navega por teclado ou leitor de tela sabe onde está).
  useEffect(() => {
    if (primeiraVez.current) { primeiraVez.current = false; return; }
    titulo.current?.focus();
  }, [passo]);

  const voltar = () => setSel(s => (s.duracao ? { grupo: s.grupo, lugar: s.lugar } : s.lugar ? { grupo: s.grupo } : {}));
  const fora = cat.nivelGrupo === 'país';
  const trilha = [grupo?.nome, lugar?.nome, duracao?.nome].filter(Boolean).join(' · ');

  if (!cat.grupos.length) return <p className="nota">Nenhum destino ao alcance agora.</p>;

  // Os grupos, com o continente (ou o que vier acima) uma vez só, como sobretítulo.
  const secoes: { secao?: string; grupos: GrupoDeViagem[] }[] = [];
  for (const g of cat.grupos) {
    const ultima = secoes[secoes.length - 1];
    if (ultima && ultima.secao === g.secao) ultima.grupos.push(g);
    else secoes.push({ secao: g.secao, grupos: [g] });
  }

  return (
    <div className="viagem">
      {passo !== 'grupo' && (
        <div className="viagem__trilha">
          <button type="button" className="link viagem__voltar" onClick={voltar}>← Voltar</button>
          <span className="viagem__onde">{trilha}</span>
        </div>
      )}
      <h3 ref={titulo} tabIndex={-1} className="viagem__pergunta">{passo === 'grupo' ? cat.perguntaGrupo : PERGUNTA[cat.nivelGrupo][passo]}</h3>

      {passo === 'grupo' && secoes.map(s => (
        <div key={s.secao ?? '-'} className="viagem__secao">
          {s.secao && <p className="viagem__secao-nome">{s.secao}</p>}
          <ul className="viagem__opcoes">
            {s.grupos.map(g => (
              <li key={g.id}>
                <button type="button" className="viagem__opcao" onClick={() => setSel({ grupo: g.id })}>
                  <span className="viagem__nome">{g.nome}<span className="viagem__sub">{listaNatural(g.lugares.map(l => l.nome))}</span></span>
                  <span className="viagem__preco">a partir de {dinheiroCurto(g.aPartirDe)}</span>
                  <Seta />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {passo === 'lugar' && grupo && (
        <ul className="viagem__opcoes">
          {grupo.lugares.map(l => (
            <li key={l.id}>
              <button type="button" className="viagem__opcao" onClick={() => setSel({ grupo: grupo.id, lugar: l.id })}>
                <span className="viagem__nome">{l.nome}</span>
                <span className="viagem__preco">a partir de {dinheiroCurto(l.aPartirDe)}</span>
                <Seta />
              </button>
            </li>
          ))}
        </ul>
      )}

      {passo === 'duracao' && grupo && lugar && (
        <ul className="viagem__opcoes">
          {lugar.duracoes.map(d => (
            <li key={d.id}>
              <button type="button" className="viagem__opcao" onClick={() => setSel({ grupo: grupo.id, lugar: lugar.id, duracao: d.id })}>
                <span className="viagem__nome">{d.nome.charAt(0).toUpperCase() + d.nome.slice(1)}<span className="viagem__sub">{d.dias} dias · {previsaoDaViagem(vida, d.dias)[0]}</span></span>
                <span className="viagem__preco">{dinheiroCurto(d.custo)}</span>
                <Seta />
              </button>
            </li>
          ))}
        </ul>
      )}

      {passo === 'resumo' && grupo && lugar && duracao && (
        <div className="viagem__resumo">
          <div className="postal" style={{ ['--postal' as string]: corDoDestino(lugar.nome) }}>
            <span className="postal__selo">{fora ? grupo.nome : 'por aqui'}</span>
            <span className="postal__nome">{lugar.nome}</span>
            <span className="postal__dias">{duracao.dias} dias</span>
          </div>
          <ul className="viagem__efeitos">{previsaoDaViagem(vida, duracao.dias).map((x, k) => <li key={k}>{x}</li>)}</ul>
          <p className="nota">{cat.companhia.length ? `Vão você e ${listaNatural(cat.companhia)}: o preço já conta todo mundo.` : 'Vai só você.'} {fora ? 'Passagem de ida e volta, hospedagem e o dia a dia lá.' : 'O transporte daqui até lá, hospedagem e o dia a dia.'}</p>
          <p className="viagem__total"><span>Ao todo, uns</span> <strong>{dinheiroCurto(duracao.custo)}</strong></p>
          <BotaoAcao vida={vida} acao={{ tipo: 'experiencia', id, escolha: duracao.escolha }} agir={agir} variante="principal" aoAgir={aoConcluir}>Confirmar a viagem</BotaoAcao>
        </div>
      )}
    </div>
  );
}

/** A cor do cartão-postal: uma das cores do mundo (mar, terra, mata, pôr do sol), estável para o destino. */
const POSTAIS = ['#2f6f9a', '#b85c3a', '#3f7a52', '#c9962f', '#7a4b8c', '#2a8a86', '#a83f4f', '#4d6a9a'];
export function corDoDestino(nome: string): string {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return POSTAIS[h % POSTAIS.length];
}
