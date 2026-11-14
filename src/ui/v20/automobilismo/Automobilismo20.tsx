/**
 * VIDA 20 · A carreira nas pistas: do kart à Fórmula 1 (em Caminhos · Outros caminhos e, na F1, também em Trabalho).
 * O caminho de categorias, a equipe e o carro, os atributos de piloto, a última temporada, a Superlicença, o orçamento
 * (quem paga), a proposta na mesa e o que dá para fazer no ano.
 */
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import { leituraAuto20, podeComecar20, type OqueAuto20 } from '../../../motor/v20/automobilismo/automobilismo20';
import { podeTentar } from '../../../motor/plausibilidade';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import './automobilismo20.css';

const A = (oque: OqueAuto20): Acao => ({ tipo: 'auto20', oque } as Acao);
const NOMES_ATRIBUTOS: [keyof NonNullable<ReturnType<typeof leituraAuto20>>['a']['atributos'], string][] = [
  ['pilotagem', 'Pilotagem'], ['consistencia', 'Consistência'], ['adaptacao', 'Adaptação aos circuitos'], ['fisico', 'Preparo físico'], ['experiencia', 'Experiência'], ['pressao', 'Cabeça sob pressão']
];

export function Automobilismo20({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const l = leituraAuto20(vida);
  if (!l) {
    if (!podeTentar(podeComecar20(vida))) return null;
    return (
      <section className="auto20 auto20--convite" aria-labelledby="auto20-titulo">
        <h3 id="auto20-titulo" className="subtitulo">Automobilismo</h3>
        <p className="nota">Quem chega à Fórmula 1 começa no kart, criança ou adolescente. A escolinha e o kart alugado custam pouco nos dois primeiros anos; depois, cada categoria custa mais — e alguém precisa pagar (a família, um patrocinador, a academia de uma equipe).</p>
        <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'comecar' })} variante="principal">Começar no kart</BotaoAcao>
      </section>
    );
  }
  const { a, cat } = l;
  const ult = a.temporadas[a.temporadas.length - 1];
  return (
    <section className="auto20" aria-labelledby="auto20-titulo" data-fase={a.fase}>
      <h3 id="auto20-titulo" className="subtitulo">Automobilismo · {l.nome}</h3>
      <ol className="auto20__caminho" aria-label="O caminho até a Fórmula 1">
        {l.caminho.map(c => <li key={c.c} className={`auto20__degrau${c.atual ? ' auto20__degrau--atual' : ''}${c.feita ? ' auto20__degrau--feita' : ''}`} title={`a partir dos ${c.idade} anos`}>{c.nome}</li>)}
      </ol>
      {cat && (
        <dl className="auto20__ficha">
          <div><dt>Equipe</dt><dd>{a.equipe}{l.forcaEquipe !== undefined && <small> · carro {l.forcaEquipe}/100</small>}</dd></div>
          {a.companheiro && <div><dt>Companheiro</dt><dd>{a.companheiro}</dd></div>}
          {a.rival && <div><dt>Rival</dt><dd>{a.rival}</dd></div>}
          {a.academia && <div><dt>Academia</dt><dd>programa de jovens da equipe {a.academia}</dd></div>}
          {cat === 'f1' && a.salario && <div><dt>Contrato</dt><dd>{dinheiroCurto(a.salario)}/ano até {a.contratoAte}</dd></div>}
          {cat !== 'f1' && <div><dt>Superlicença</dt><dd>{l.sl} de {l.slNecessario} pontos (três anos)</dd></div>}
        </dl>
      )}
      <ul className="auto20__atributos" aria-label="Atributos de piloto">
        {NOMES_ATRIBUTOS.map(([k, nome]) => <li key={k}><span>{nome}</span><meter min={0} max={100} value={a.atributos[k]} aria-label={nome} /><b>{Math.round(a.atributos[k])}</b></li>)}
      </ul>
      {ult && (
        <p className="auto20__temporada">Última temporada ({ult.ano}, {ult.categoria === 'f1' ? 'Fórmula 1' : l.caminho.find(x => x.c === ult.categoria)?.nome}): <b>{ult.titulo ? 'campeão' : `${ult.posicao}º`}</b> · {ult.pontos} pts · {ult.vitorias} vitória{ult.vitorias === 1 ? '' : 's'} · {ult.podios} pódio{ult.podios === 1 ? '' : 's'} · {ult.abandonos} abandono{ult.abandonos === 1 ? '' : 's'}{ult.campeao ? ` · campeão: ${ult.campeao}` : ''}</p>
      )}
      {a.temporadas.length > 0 && <p className="nota">Na carreira: {a.largadas} largada{a.largadas === 1 ? '' : 's'}, {a.vitorias} vitória{a.vitorias === 1 ? '' : 's'}, {a.podios} pódio{a.podios === 1 ? '' : 's'}, {a.titulos} título{a.titulos === 1 ? '' : 's'}.</p>}
      {l.orcamento && (
        <p className="auto20__orcamento">Orçamento da temporada: {dinheiroCurto(l.orcamento.custo)} — patrocínio {dinheiroCurto(l.orcamento.patrocinio)}, academia {dinheiroCurto(l.orcamento.academia)}, família {dinheiroCurto(l.orcamento.familia)}{l.orcamento.falta > 0 ? <strong> · faltam {dinheiroCurto(l.orcamento.falta)}</strong> : ' · fechado'}.</p>
      )}
      {l.proposta && (
        <div className="auto20__proposta" role="group" aria-label="Proposta">
          <p><b>Proposta:</b> {l.proposta.equipe}, {l.caminho.find(x => x.c === l.proposta!.categoria)?.nome} (carro {l.proposta.forca}/100){l.proposta.salario ? `, ${dinheiroCurto(l.proposta.salario)} por ano` : ''}.</p>
          <div className="auto20__botoes">
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'aceitar' })} variante="principal">Aceitar</BotaoAcao>
            <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'recusar' })}>Recusar</BotaoAcao>
          </div>
        </div>
      )}
      {cat && (
        <div className="auto20__botoes">
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'simulador' })}>Simulador</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'fisico' })}>Preparação física</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'circuitos' })}>Estudar circuitos</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'treinar', foco: 'mental' })}>Psicólogo do esporte</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'patrocinio' })}>Buscar patrocínio</BotaoAcao>
          <BotaoAcao vida={vida} agir={agir} acao={A({ op: 'parar' })}>Encerrar a carreira</BotaoAcao>
        </div>
      )}
      {a.temporadas.length > 1 && (
        <details className="auto20__historico">
          <summary>Todas as temporadas</summary>
          <table>
            <thead><tr><th>Ano</th><th>Categoria</th><th>Equipe</th><th>Pos.</th><th>V</th><th>P</th><th>SL</th></tr></thead>
            <tbody>{[...a.temporadas].reverse().map(t => <tr key={t.ano}><td>{t.ano}</td><td>{l.caminho.find(x => x.c === t.categoria)?.nome}</td><td>{t.equipe}</td><td>{t.titulo ? '1º 🏆' : `${t.posicao}º`}</td><td>{t.vitorias}</td><td>{t.podios}</td><td>{t.sl ?? 0}</td></tr>)}</tbody>
          </table>
        </details>
      )}
      <p className="nota">Equipes e pilotos adversários são fictícios. A idade mínima da F1 (18 anos) e os 40 pontos de Superlicença em três anos são as regras da FIA.</p>
    </section>
  );
}
export default Automobilismo20;
