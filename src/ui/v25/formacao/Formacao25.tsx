/**
 * VIDA 25 · A FORMAÇÃO — o caminho do atleta antes do profissional, do jeito que o motor registrou (`CarreiraEsportiva.
 * formacao`): onde começou, as categorias por onde passou (no futebol e no futsal, sub-15 → sub-17 → sub-20; nas outras
 * modalidades, a equipe de base ou o circuito juvenil — sem inventar categorias que não existem nelas), os anos com
 * jogos, titularidade, números, nota, colocação e a avaliação da comissão, os títulos e a promoção ao profissional.
 */
import type { CarreiraEsportiva, Vida } from '../../../motor/tipos';
import { anoDe } from '../../../motor/tempo';
import { NOME_MOD } from '../../../motor/sistemas/esporte';
import { IDADE_LEGAL_CONTRATO } from '../../../motor/sistemas/jovemAtleta';
import { palavraDoValor25 } from '../ficha/FichaDeAtleta25';
import './formacao25.css';

const num = (x: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Evolucao({ serie }: { serie: number[] }) {
  if (serie.length < 2) return null;
  const min = Math.min(...serie), max = Math.max(...serie), amp = Math.max(4, max - min);
  const pts = serie.map((y, k) => `${(k / (serie.length - 1)) * 120},${30 - ((y - min) / amp) * 26 - 2}`).join(' ');
  return <svg className="form25__evolucao" viewBox="0 0 120 30" width={120} height={30} role="img" aria-label={`A técnica na formação: ${serie.map(num).join(' → ')}`}><polyline points={pts} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function Formacao25({ vida, e }: { vida: Vida; e: CarreiraEsportiva }) {
  const anos = e.formacao ?? [];
  const mod = NOME_MOD[e.modalidade] ?? e.modalidade;
  const chegou = e.fase !== 'base' && e.origem !== 'amador';
  const anoPro = chegou ? anoDe(e.tFase) : undefined;
  if (!anos.length) {
    if (e.fase !== 'base' && e.origem === 'amador') return <p className="nota form25__vazio">Chegou ao profissional pela porta amadora, sem passar por categoria de base.</p>;
    return <p className="nota form25__vazio">{e.fase === 'base' ? `Começou ${e.clube ? `na base ${e.clube.startsWith('a ') ? '' : 'de '}${e.clube}` : 'na base'} em ${anoDe(e.tInicio)}. O primeiro ano de formação aparece aqui quando fechar.` : `A formação (desde ${anoDe(e.tInicio)}) é anterior aos registros ano a ano: o que ficou dela está na Linha da Vida.`}</p>;
  }
  const categorias: string[] = [];
  for (const a of anos) if (categorias[categorias.length - 1] !== a.categoria) categorias.push(a.categoria);
  const titulos = anos.filter(a => a.titulo);
  const jogos = anos.reduce((s, a) => s + a.jogos, 0);
  const titular = anos.reduce((s, a) => s + a.titular, 0);
  const gols = anos.reduce((s, a) => s + (a.gols ?? 0), 0);
  const individual = anos.some(a => a.podios !== undefined) || e.modalidade === 'tenis';
  const ultimo = anos[anos.length - 1];
  // VIDA 28: a coluna da produção é a da modalidade (o vôlei de base não faz "gols · assistências").
  const comGols = e.modalidade === 'futebol' || e.modalidade === 'futsal';
  const producao = e.modalidade === 'basquete' ? 'Pts/jogo' : individual ? 'Pódios' : comGols ? 'G · A' : undefined;
  return (
    <section className="form25" aria-labelledby="form25-t">
      <h3 id="form25-t" className="form25__titulo">A formação</h3>
      <p className="form25__inicio">Começou em {anoDe(e.tInicio)}, aos {Math.floor((e.tInicio - vida.eu.tNasc) / 12)} anos, {e.modalidade === 'tenis' ? 'numa academia de tênis' : `na base de ${mod}`} — {anos[0].clube}.</p>
      <ol className="form25__caminho" aria-label="As categorias">
        {categorias.map((c, k) => <li key={c} className={`form25__degrau${k === categorias.length - 1 && !chegou ? ' form25__degrau--atual' : ''}`}>{cap(c)}</li>)}
        {chegou && <li className="form25__degrau form25__degrau--pro">Profissional{anoPro ? ` · ${anoPro}` : ''}</li>}
      </ol>
      <dl className="form25__resumo">
        <div><dt>Anos de formação</dt><dd>{anos.length}</dd></div>
        <div><dt>{individual ? 'Competições' : 'Jogos'}</dt><dd>{jogos}{!individual && <small> · {titular} como titular</small>}</dd></div>
        {(e.modalidade === 'futebol' || e.modalidade === 'futsal') && <div><dt>Gols</dt><dd>{gols}</dd></div>}
        <div><dt>Títulos</dt><dd>{titulos.length}</dd></div>
        <div><dt>Técnica</dt><dd>{num(anos[0].tecnica)} → {num(ultimo.tecnica)} <Evolucao serie={anos.map(a => a.tecnica)} /></dd></div>
      </dl>
      <div className="form25__tabela" role="region" aria-label="Ano a ano" tabIndex={0}>
        <table>
          <thead><tr><th>Ano</th><th>Categoria</th><th>{individual ? 'Disputas' : 'Jogos (tit.)'}</th>{producao && <th>{producao}</th>}<th>Nota</th><th>Colocação</th></tr></thead>
          <tbody>
            {anos.map(a => (
              <tr key={a.ano} className={a.titulo ? 'form25__linha--titulo' : undefined}>
                <td>{a.ano}<small> · {a.idade}a</small></td>
                <td>{a.categoria}{a.papel ? <small> · {a.papel}</small> : null}{a.acima ? <small className="form26__acima"> · {a.acima === 'profissional' ? 'treinou com o profissional' : `subiu ao ${a.acima}`}</small> : null}</td>
                <td>{individual ? a.jogos : `${a.jogos} (${a.titular})`}</td>
                {producao && <td>{e.modalidade === 'basquete' ? num(a.pontos ?? 0) : individual ? (a.podios ?? '—') : `${a.gols ?? 0} · ${a.assistencias ?? 0}`}</td>}
                <td>{num(a.nota)}</td>
                <td>{a.titulo && <b className="form25__selo">campeão</b>}{a.colocacao}º de {a.participantes}{a.desfecho === 'dispensa' && <small className="form25__dispensa"> · dispensad{vida.eu.genero === 'feminino' ? 'a' : 'o'} no fim do ano</small>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="form25__avaliacao"><span className="form25__rotulo">A comissão, sobre {ultimo.ano}:</span> {ultimo.avaliacao}</p>
      {ultimo.prontidao !== undefined && <LeituraDaComissao a={ultimo} base={e.fase === 'base'} />}
      {titulos.length > 0 && <ul className="form25__titulos" aria-label="Títulos na formação">{titulos.map(a => <li key={a.ano}>{a.ano} · {cap(a.competicao)} ({a.clube})</li>)}</ul>}
      {chegou && <p className="form25__pro">Profissionalizou-se em {anoPro}, {e.temporadas?.[0]?.clube ? `${e.temporadas[0].clube === anos[anos.length - 1].clube ? 'no mesmo clube que o formou' : `por ${e.temporadas[0].clube}`}` : ''}{vida.caminhos.palmares?.some(x => x.tipo === 'marco' && /Primeiro contrato profissional/.test(x.texto)) ? ' — o primeiro contrato está entre os marcos da carreira' : ''}.</p>}
    </section>
  );
}

/**
 * VIDA 26 · a leitura da comissão no fim do ano, em três coisas que não se confundem: o que o atleta faz HOJE (capacidade
 * atual), até onde PODE chegar (potencial — estimativa, com a margem de quem ainda cresce) e o quanto está PRONTO para um
 * ambiente mais exigente (a prontidão e as suas quatro partes). E as etapas, cada uma com o seu nome.
 */
function LeituraDaComissao({ a, base }: { a: NonNullable<CarreiraEsportiva['formacao']>[number]; base: boolean }) {
  const p = a.prontidao ?? 0;
  const [lo, hi] = a.potencial ?? [0, 0];
  const palavraProntidao = p >= 75 ? 'pronto para um ambiente mais exigente' : p >= 55 ? 'perto de estar pronto' : p >= 40 ? 'ainda em preparação' : 'longe de estar pronto';
  return (
    <div className="form26" aria-label="A leitura da comissão">
      <div className="form26__cartao" data-leitura="capacidade">
        <span className="form26__rot">Capacidade atual</span>
        <b className="form26__num">{Math.round(a.capacidade ?? a.tecnica)}</b>
        <span className="form26__nota">{palavraDoValor25(a.capacidade ?? a.tecnica)} — o que faz hoje, com o corpo e a cabeça que tem aos {a.idade}.</span>
      </div>
      <div className="form26__cartao" data-leitura="potencial">
        <span className="form26__rot">Potencial (estimativa)</span>
        <b className="form26__num">{lo}–{hi}</b>
        <span className="form26__nota">Até onde a comissão acha que pode chegar. Não é habilidade: depende de treino, saúde e oportunidade{a.idade < 17 ? ' — e quanto mais novo, mais larga a margem' : ''}.</span>
      </div>
      <div className="form26__cartao" data-leitura="prontidao">
        <span className="form26__rot">Prontidão para o profissional</span>
        <b className="form26__num">{p}<small>/100</small></b>
        <span className="form26__nota">{palavraProntidao}. Técnica, físico, experiência e maturidade — não só o talento.</span>
      </div>
      <p className="form26__etapas">{base ? `As etapas são diferentes: destacar-se na categoria, subir de categoria, treinar com o elenco profissional, o primeiro contrato (a lei permite a partir dos ${IDADE_LEGAL_CONTRATO} anos — aqui, aos ${IDADE_LEGAL_CONTRATO} só o excepcional) e, depois, a estreia. Uma não garante a outra.` : 'A leitura do último ano de formação, antes do profissional.'}</p>
    </div>
  );
}
