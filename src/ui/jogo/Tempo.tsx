/**
 * Tempo livre: o que você faz com a semana, ano após ano.
 *
 * A semana desenhada aqui e a regra que decide se uma atividade cabe vêm da
 * MESMA conta (`motor/sistemas/semana`). Quando algo não cabe, o motivo diz
 * o que ocupa a semana e o que teria de sair.
 */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { ROTINAS, atividadeExiste, modeloRotina, nivelDa, nivelModelo, type CategoriaAtividade, type ModeloRotina } from '../../motor/sistemas/rotinas';
import { dose, semana } from '../../motor/sistemas/semana';
import { frentesDaVida, leituraDaFrente } from '../../motor/sistemas/frentes';
import { economiaLocal } from '../../motor/dados/lugares';
import { idade } from '../../motor/nucleo';
import type { Dominio } from '../../motor/tipos';
import { BotaoAcao, Secao, Vazio } from '../comum';
import { dinheiroCurto } from '../apresentar';

const GRUPOS: { id: CategoriaAtividade; rotulo: string }[] = [
  { id: 'esporte', rotulo: 'Esporte' }, { id: 'arte', rotulo: 'Arte' }, { id: 'estudo', rotulo: 'Estudo' },
  { id: 'oficio', rotulo: 'Ofício' }, { id: 'social', rotulo: 'Gente e comunidade' }, { id: 'corpo', rotulo: 'Corpo' },
  { id: 'renda', rotulo: 'Dinheiro por fora' }, { id: 'cuidado', rotulo: 'Cuidado' }, { id: 'lazer', rotulo: 'Lazer' }
];

function resumoDaSemana(s: ReturnType<typeof semana>): string {
  if (s.ocupado > s.capacidade + 0.01) return 'Você está fazendo mais do que cabe na semana — o cansaço aparece.';
  if (s.livre >= 1.5) return 'Sobra bastante tempo para escolher o que fazer.';
  if (s.livre >= 1) return 'Sobra tempo para mais uma ou duas coisas.';
  if (s.livre >= 0.5) return 'Sobra espaço para uma coisa leve, uma vez por semana.';
  return 'Sua semana está cheia.';
}

export function Tempo({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const i = idade(vida);
  if (i < 3) return <Vazio>Nesta idade, o tempo é de quem cuida de você.</Vazio>;
  const s = semana(vida);
  const custo = economiaLocal(vida.moradia.municipioId).custo;
  const blocos = Math.round(s.capacidade * 2);
  const usados = Math.round(s.ocupado * 2);
  const ativas = vida.rotinas.map(r => ({ r, m: modeloRotina(r.id) })).filter((x): x is { r: Vida['rotinas'][number]; m: ModeloRotina } => !!x.m);
  const outras = ROTINAS.filter(m => !vida.rotinas.some(x => x.id === m.id) && atividadeExiste(vida, m));
  const frentes = frentesDaVida(vida);
  const fixos = s.fixos.filter(f => f.peso >= 0.25);
  return (
    <div className="tempo">
      <Secao titulo="Sua semana">
        {fixos.length > 0 ? (
          <>
            <p className="nota">Antes de qualquer escolha, a semana já tem:</p>
            <ul className="semana-fixos">
              {fixos.map(f => <li key={f.id}><span>{f.rotulo}</span><span className="semana-fixos__dose">{dose(f.peso)}</span></li>)}
              {s.ganhos.map(g => <li key={g.id} className="semana-fixos__ganho"><span>{g.rotulo}</span><span className="semana-fixos__dose">devolve tempo</span></li>)}
            </ul>
          </>
        ) : <p className="nota">{i < 18 ? 'Além da escola, a semana é sua.' : 'Nada fixo ocupa a semana: nem trabalho, nem curso.'}</p>}
        <div className="medidor" role="img" aria-label={`O que sobra da semana: ${blocos} partes; ${usados} ocupadas pelas suas atividades.`}>
          {Array.from({ length: Math.max(blocos, usados) }, (_, k) => <span key={k} className={`medidor__bloco${k < usados ? ' medidor__bloco--cheio' : ''}${k >= blocos ? ' medidor__bloco--excesso' : ''}`} />)}
        </div>
        <p className="nota">{resumoDaSemana(s)} O que você mantém por anos vira parte de quem você é — e cada lugar desses tem gente.</p>
      </Secao>

      <Secao titulo="O que você faz">
        {ativas.length === 0 && <Vazio>Nada fixo na semana por enquanto.</Vazio>}
        <ul className="lista-rotinas">
          {ativas.map(({ r, m }) => {
            const n = nivelDa(r);
            const nm = nivelModelo(m, n);
            const dominio = m.pratica ? (Object.keys(m.pratica)[0] as Dominio) : undefined;
            const leitura = dominio && vida.caminhos.frentes[dominio] ? leituraDaFrente(vida, dominio) : '';
            const anos = Math.floor((vida.t - r.tInicio) / 12);
            const renda = m.renda?.(vida, n);
            return (
              <li key={r.id} className="rotina rotina--ativa">
                <div className="rotina__texto">
                  <strong>{m.nome}</strong>
                  <span>{m.niveis.length > 1 ? `${nm.rotulo} · ` : ''}{dose(nm.tempo)}{anos >= 1 ? ` · há ${anos} ${anos === 1 ? 'ano' : 'anos'}` : ''}{nm.custo ? ` · ${dinheiroCurto(nm.custo * custo)}/mês` : ''}{renda ? ` · rende uns ${dinheiroCurto(renda)}/mês` : ''}</span>
                  {leitura && <span className="rotina__leitura">{leitura}</span>}
                </div>
                <div className="rotina__acoes">
                  {n < m.niveis.length && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: true, nivel: (n + 1) as 2 | 3 }} agir={agir} variante="discreto">{`Mais a sério: ${nivelModelo(m, n + 1).rotulo.toLowerCase()}`}</BotaoAcao>}
                  {n > 1 && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: true, nivel: (n - 1) as 1 | 2 }} agir={agir} variante="discreto">Mais leve</BotaoAcao>}
                  <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: r.id, ativa: false }} agir={agir} variante="discreto">Parar</BotaoAcao>
                </div>
              </li>
            );
          })}
        </ul>
      </Secao>

      {frentes.length > 0 && (
        <Secao titulo="O que você sabe fazer" recolhivel aberta={frentes.length <= 3}>
          <ul className="frentes">
            {frentes.map(f => <li key={f.d}><strong>{f.nome.charAt(0).toUpperCase() + f.nome.slice(1)}</strong><span>{f.texto}</span></li>)}
          </ul>
        </Secao>
      )}

      <Secao titulo="Dá para começar">
        {outras.length === 0 && <Vazio>Nada novo por aqui agora.</Vazio>}
        {GRUPOS.map(g => {
          const lista = outras.filter(m => m.categoria === g.id);
          if (!lista.length) return null;
          return (
            <div key={g.id} className="grupo-atividades">
              <h3 className="grupo-atividades__titulo">{g.rotulo}</h3>
              <ul className="lista-rotinas">
                {lista.map(m => {
                  const n1 = m.niveis[0];
                  const renda = m.renda?.(vida, 1);
                  return (
                    <li key={m.id} className="rotina">
                      <div className="rotina__texto"><strong>{m.nome}</strong><span>{m.descricao} {dose(n1.tempo)}{n1.custo ? ` · ${dinheiroCurto(n1.custo * custo)}/mês` : ' · de graça'}{renda ? ` · rende uns ${dinheiroCurto(renda)}/mês` : ''}</span></div>
                      <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: m.id, ativa: true, nivel: 1 }} agir={agir}>{m.niveis.length > 1 ? `Começar: ${n1.rotulo.toLowerCase()}` : 'Começar'}</BotaoAcao>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </Secao>
    </div>
  );
}
