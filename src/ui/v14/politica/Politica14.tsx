/**
 * VIDA 14 · o mandato que deixa marca, no plenário (sob demanda): os indicadores da gestão e as contas públicas, as
 * medidas em vigor (o efeito, quando aparece, até quando vale, revogar), as que dá para tomar agrupadas por tipo, o
 * legado dos mandatos, a filiação (a permanência mínima, a justa causa) e Belém (Portugal). Lido de `leituraPolitica14`.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { BotaoAcao } from '../../comum';
import { acaoMedida14, leituraPolitica14, type LeituraPolitica14 } from '../../../motor/v14/politica/politica14';
import './politica14.css';

const n = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');
const palavra = (x: number) => (x >= 65 ? 'muito bem' : x >= 55 ? 'bem' : x >= 45 ? 'estável' : x >= 35 ? 'mal' : 'muito mal');

function Gestao({ g, vida, agir }: { g: NonNullable<LeituraPolitica14['gestao']>; vida: Vida; agir: (a: Acao) => boolean }) {
  const [aberto, setAberto] = useState(false);
  const tipos = [...new Set(g.possiveis.map(x => x.tipo))];
  return (
    <div className="p14__bloco">
      <p className="p14__kicker">A gestão · {g.cargo}</p>
      <div className="p14__inds">
        {g.indicadores.map(x => {
          const d = Math.round((x.valor - x.inicio) * 10) / 10;
          return (
            <div key={x.rotulo} className={`p14__ind${d > 1 ? ' p14__ind--bom' : d < -1 ? ' p14__ind--ruim' : ''}`}>
              <span className="p14__ind-rotulo">{x.rotulo}</span>
              <span className="p14__ind-valor">{palavra(x.valor)}</span>
              <span className="p14__ind-delta">{d === 0 ? 'como na posse' : `${d > 0 ? '▲' : '▼'} ${n(Math.abs(d))} desde a posse`}</span>
            </div>
          );
        })}
      </div>
      <dl className="dados">
        <div className="dado"><dt>Contas do último ano</dt><dd>{g.saldo >= 0 ? `sobra de ${n(g.saldo)}% da receita` : `rombo de ${n(-g.saldo)}% da receita`}</dd></div>
        <div className="dado"><dt>Dívida pública</dt><dd>{n(g.divida)}% da receita</dd></div>
        <div className="dado"><dt>Votam com você</dt><dd>{g.apoio}% da casa</dd></div>
        <div className="dado"><dt>Oposição</dt><dd>{g.oposicao >= 65 ? 'mobilizada' : g.oposicao >= 40 ? 'atenta' : 'dispersa'}</dd></div>
      </dl>
      {g.alerta && <p className="nota nota--atencao">{g.alerta}</p>}
      <p className="p14__sub">Em vigor</p>
      {g.emVigor.length === 0 && <p className="nota">Nenhuma medida em vigor: o mandato ainda não mudou nada que dure.</p>}
      <ul className="p14__medidas">
        {g.emVigor.map(x => (
          <li key={x.id} className="p14__medida">
            <p className="p14__medida-nome"><span>{x.nome.charAt(0).toUpperCase() + x.nome.slice(1)}</span><small>{x.tipo} · desde {x.desde}{x.votos !== undefined ? ` · ${x.votos}% na votação` : ''} · vale até {x.ate}</small></p>
            <p className="p14__medida-efeito">{x.carencia > 0 ? `O efeito ainda não apareceu (falta${x.carencia > 1 ? 'm' : ''} ${x.carencia} ano${x.carencia > 1 ? 's' : ''}). ` : ''}{x.efeito.charAt(0).toUpperCase() + x.efeito.slice(1)}.</p>
            <BotaoAcao vida={vida} acao={acaoMedida14(x.id, true)} agir={agir} variante="discreto" ocultarImpossivel>Revogar</BotaoAcao>
          </li>
        ))}
      </ul>
      {g.ultimas.length > 0 && <ul className="historico-politico">{g.ultimas.map((x, k) => <li key={k}>{x.nome}: {x.texto}</li>)}</ul>}
      <button type="button" className="botao botao--secundario" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Fechar as medidas possíveis' : `Tomar uma medida (${g.possiveis.length} possíveis)`}</button>
      {aberto && tipos.map(t => (
        <div key={t} className="p14__grupo">
          <p className="p14__sub">{t}</p>
          <ul className="p14__medidas">
            {g.possiveis.filter(x => x.tipo === t).map(x => (
              <li key={x.id} className="p14__medida">
                <p className="p14__medida-nome"><span>{x.nome.charAt(0).toUpperCase() + x.nome.slice(1)}</span><small>{x.votacao ?? 'ato do Executivo'}</small></p>
                <p className="p14__medida-efeito">{x.oque} Por ano em vigor: {x.efeito}. Quem perde: {x.quemPerde}.</p>
                <BotaoAcao vida={vida} acao={acaoMedida14(x.id)} agir={agir} variante="secundario" mostrarChance>Propor</BotaoAcao>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function Politica14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraPolitica14(vida);
  if (!l) return null;
  return (
    <section className="p14" aria-label="Gestão, filiação e legado">
      {l.gestao && <Gestao g={l.gestao} vida={vida} agir={agir} />}
      {l.belem && (
        <div className="p14__bloco">
          <p className="p14__kicker">Belém · a Presidência da República</p>
          <dl className="dados">
            {l.belem.governo && <div className="dado"><dt>O Governo</dt><dd>{l.belem.governo}</dd></div>}
            {l.belem.estabilidade !== undefined && <div className="dado"><dt>Estabilidade do Governo</dt><dd>{palavra(l.belem.estabilidade)}</dd></div>}
            <div className="dado"><dt>Relação com o Governo</dt><dd>{palavra(l.belem.relacao)}</dd></div>
            <div className="dado"><dt>Magistratura de influência</dt><dd>{palavra(l.belem.influencia)}</dd></div>
            {l.belem.diploma && <div className="dado"><dt>Na secretária</dt><dd>{l.belem.diploma}</dd></div>}
            {l.belem.crise && <div className="dado"><dt>Crise política</dt><dd>{l.belem.crise}</dd></div>}
          </dl>
          {l.belem.formar && <p className="nota nota--atencao">Há um Governo a formar: ouvir os partidos e nomear o Primeiro-Ministro.</p>}
          <p className="nota">{l.belem.numeros}.</p>
          {l.belem.registro.length > 0 && <ul className="historico-politico">{l.belem.registro.map((x, k) => <li key={k}>{x}</li>)}</ul>}
        </div>
      )}
      {l.filiacao && (
        <div className="p14__bloco">
          <p className="p14__kicker">O partido</p>
          <dl className="dados">
            <div className="dado"><dt>Com a direção</dt><dd>{l.filiacao.palavra}</dd></div>
            {l.filiacao.trocas > 0 && <div className="dado"><dt>Trocas sem justa causa (8 anos)</dt><dd>{l.filiacao.trocas}</dd></div>}
          </dl>
          <p className="nota">{l.filiacao.regra}</p>
          {l.filiacao.excecao && <p className="nota nota--atencao">{l.filiacao.excecao}</p>}
        </div>
      )}
      {l.legados.length > 0 && (
        <div className="p14__bloco">
          <p className="p14__kicker">O legado</p>
          <ul className="historico-politico">
            {l.legados.slice(-5).map((x, k) => <li key={k}><strong>{x.de}–{x.ate}</strong> · {x.veredito}{x.aprovadas.length ? ` · ${x.aprovadas.slice(0, 3).join(', ')}` : ''}{x.delta.divida > 10 ? ' · a dívida subiu' : x.delta.divida < -10 ? ' · a dívida caiu' : ''}.</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

export default Politica14;
