/**
 * VIDA 26 · no cartão da atividade da semana: o que ela é (hobby, parte de um caminho, dinheiro por fora...) e, quando
 * há, para onde PODE levar — a sequência possível, o próximo passo real e o que pesa (`v26/hobby/hobbyCaminho26`).
 * Possibilidade, não obrigação: o hobby que fica hobby não ganha aviso nenhum.
 */
import type { Vida } from '../../../motor/tipos';
import { modeloRotina } from '../../../motor/sistemas/rotinas';
import { naturezaDaAtividade26, NOME_NATUREZA26, portaDoHobby26 } from '../../../motor/v26/hobby/hobbyCaminho26';
import type { Aba } from '../../navegacao';
import './hobby26.css';

export function HobbyPorta26({ vida, id, categoria, irPara }: { vida: Vida; id: string; categoria: string; irPara?: (a: Aba) => void }) {
  const nat = naturezaDaAtividade26(id, categoria);
  const porta = nat === 'hobby' ? portaDoHobby26(vida, id, modeloRotina(id)?.pratica) : undefined;
  if (nat === 'hobby' && !porta) return null;
  return (
    <div className="h26" data-natureza={nat}>
      {nat !== 'hobby' && <span className={`h26__natureza h26__natureza--${nat}`}>{NOME_NATUREZA26[nat]}{nat === 'renda' ? ' — trabalho por conta, não hobby' : nat === 'caminho' ? ' — o caminho está em Caminhos · Outros caminhos' : ''}</span>}
      {porta && (
        <details className="h26__porta">
          <summary><span className="h26__rot">{porta.dentro ? 'O caminho em que você está' : 'Pode levar a'}</span> {porta.sequencia.join(' → ')}</summary>
          <p>{porta.passo}</p>
          <p className="h26__pesa">O que pesa: {porta.pesa.join(' · ')}. É uma possibilidade — dá para manter como hobby a vida toda.</p>
          {irPara && <button type="button" className="link" onClick={() => irPara('guia_carreiras')}>Ver em Caminhos de carreira →</button>}
        </details>
      )}
    </div>
  );
}

/**
 * Em Caminhos · Outros caminhos: as portas que os hobbies de agora podem abrir (o esporte, o videogame, a arte) — para
 * quem ainda não está no caminho. Os que já estão nele aparecem nas seções próprias logo abaixo.
 */
export function HobbiesQueAbrem26({ vida, irPara }: { vida: Vida; irPara?: (a: Aba) => void }) {
  const lista = vida.rotinas.map(r => modeloRotina(r.id)).filter((m): m is NonNullable<typeof m> => !!m && naturezaDaAtividade26(m.id, m.categoria) === 'hobby')
    .map(m => ({ m, p: portaDoHobby26(vida, m.id, m.pratica) })).filter(x => x.p && !x.p.dentro && (x.p.sequencia.length >= 4));
  if (!lista.length) return null;
  return (
    <section className="divisao__secao h26-lista" aria-labelledby="h26-t">
      <h2 id="h26-t" className="secao-fio">Dos seus hobbies</h2>
      <p className="nota">O que você faz por gosto pode virar um caminho — ou continuar só gosto. Nenhuma das duas coisas é a certa.</p>
      <ul>{lista.map(({ m, p }) => (
        <li key={m.id} className="h26-lista__item" data-hobby={m.id}>
          <b>{m.nome}</b> <span className="h26-lista__seq">{p!.sequencia.join(' → ')}</span>
          <p>{p!.passo}</p>
        </li>
      ))}</ul>
      {irPara && <button type="button" className="link" onClick={() => irPara('guia_carreiras')}>Todos os caminhos, etapa por etapa, em Caminhos de carreira →</button>}
    </section>
  );
}
