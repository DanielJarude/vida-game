/** Tempo livre: o que você escolhe fazer com a semana, ano após ano. */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { ROTINAS, tempoLivre, tempoOcupado } from '../../motor/sistemas/rotinas';
import { economiaLocal } from '../../motor/dados/lugares';
import { idade } from '../../motor/nucleo';
import { BotaoAcao, Secao, Vazio } from '../comum';
import { dinheiroCurto } from '../apresentar';

export function Tempo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  const livre = tempoLivre(vida);
  const ocupado = tempoOcupado(vida);
  const ativas = ROTINAS.filter(r => vida.rotinas.some(x => x.id === r.id));
  const outras = ROTINAS.filter(r => !vida.rotinas.some(x => x.id === r.id) && i >= r.idadeMin && (!r.idadeMax || i <= r.idadeMax));
  const custo = economiaLocal(vida.moradia.municipioId).custo;
  if (i < 3) return <Vazio>Nesta idade, o tempo é de quem cuida de você.</Vazio>;
  const blocos = Math.round(livre * 2);
  const usados = Math.round(ocupado * 2);
  return (
    <div className="tempo">
      <Secao titulo="Sua semana">
        <div className="medidor" aria-label={`Tempo livre ocupado: ${ocupado} de ${livre}`}>
          {Array.from({ length: Math.max(blocos, usados) }, (_, k) => <span key={k} className={`medidor__bloco${k < usados ? ' medidor__bloco--cheio' : ''}${k >= blocos ? ' medidor__bloco--excesso' : ''}`} />)}
        </div>
        <p className="nota">{ocupado > livre ? 'Você está fazendo mais do que cabe na semana — o cansaço aparece.' : 'Trabalho, estudo e filhos pequenos encolhem o tempo livre.'} O que você mantém por anos vira parte de quem você é, e cada lugar desses tem gente.</p>
        {ativas.length === 0 && <Vazio>Nada fixo na semana por enquanto.</Vazio>}
        <ul className="lista-rotinas">
          {ativas.map(r => (
            <li key={r.id} className="rotina rotina--ativa">
              <div className="rotina__texto"><strong>{r.nome}</strong><span>{r.descricao}{r.custo ? ` · ${dinheiroCurto(r.custo * custo)}/mês` : ''}{r.renda ? ` · rende uns ${dinheiroCurto(r.renda)}/mês` : ''}</span></div>
              <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: false }} agir={agir} variante="discreto">Parar</BotaoAcao>
            </li>
          ))}
        </ul>
      </Secao>
      <Secao titulo="O que dá para começar">
        <ul className="lista-rotinas">
          {outras.map(r => (
            <li key={r.id} className="rotina">
              <div className="rotina__texto"><strong>{r.nome}</strong><span>{r.descricao}{r.custo ? ` · ${dinheiroCurto(r.custo * custo)}/mês` : ' · de graça'}{r.renda ? ` · rende uns ${dinheiroCurto(r.renda)}/mês` : ''}</span></div>
              <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: true }} agir={agir}>Começar</BotaoAcao>
            </li>
          ))}
        </ul>
      </Secao>
    </div>
  );
}
