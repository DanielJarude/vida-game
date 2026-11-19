/**
 * ERAS v3 · "A época" fora do Brasil — o mesmo painel, com os dados do pacote do país: quem governa e o nome do Estado, a
 * moeda do mês, o salário mínimo (quando havia), a inflação, a economia e o desemprego do ano anterior, quanto se vivia,
 * as regras de direitos em vigor, a guerra em curso, como a pessoa se comunica e a tecnologia que tem ou ainda não chegou.
 * Tudo lido do pacote e das séries; a tela não inventa número.
 */
import type { Vida } from '../../motor/tipos';
import { anoDe, mesDe, MESES } from '../../motor/tempo';
import { moedaNoMes, naSerie, pacoteDaEra, type PacoteDeEra } from '../../motor/eras/base/pacote';
import { tecnologia, meioDeComunicacao, paisDaEpoca, eraImperialEm, datasNoPais } from '../../motor/eras/base/contexto';
import { TECNOLOGIAS_BR } from '../../motor/eras/base/tecnologias';
import { mortalidadeNoAno } from '../../motor/eras/base/mortalidade';
import { regrasDoPais, regraValeEm, guerraEmCurso } from '../../motor/eras/base/sociedade';
import { ladoDaVida } from '../../motor/mundo/vida';
import { municipio, economiaLocal } from '../../motor/dados/lugares';
import { formatarDinheiro, daMoedaLocal } from '../../motor/mundo/moeda';
import { ObjetosDaEpoca } from './Aparelhos';
import { decadaVisual } from './epoca';
import './eras.css';

const VITRINE = ['radio', 'tv', 'telefone_fixo', 'geladeira', 'maquina_lavar', 'tv_cores', 'videocassete', 'computador', 'internet', 'celular', 'smartphone', 'redes_modernas', 'streaming'];
const MEIO: Record<string, string> = { cartas: 'Cartas, telegrama e visita (sem telefone em casa)', fixo: 'Telefone fixo, telefone público e carta', celular: 'Celular de teclas (e o telefone de casa)', smartphone: 'Smartphone' };
const pct = (x: number) => `${(x * 100).toLocaleString('pt-BR', { maximumFractionDigits: Math.abs(x) >= 1 ? 0 : 1 })}%`;
const TEMA: Record<string, string> = {
  voto_feminino: 'Voto', mulher_casada: 'Mulheres', divorcio: 'Divórcio', casamento_igualitario: 'Casamento', homossexualidade_crime: 'Vida privada', segregacao: 'Segregação',
  servico_militar: 'Serviço militar', escola_obrigatoria: 'Escola', trabalho_infantil: 'Trabalho infantil', maioridade: 'Maioridade', previdencia: 'Aposentadoria',
  saude_publica: 'Saúde', censura: 'Liberdades', perseguicao: 'Perseguição', sem_eleicoes: 'Eleições'
};

function nomeDoEstado(p: PacoteDeEra, ano: number, lado: 'oeste' | 'leste'): string {
  for (const n of p.nomesOficiais ?? []) if (ano < n.ate && (!n.lado || n.lado === lado)) return n.nome;
  return p.nome;
}

export function PainelDaEpocaPais({ vida }: { vida: Vida }) {
  const pais = paisDaEpoca(vida);
  const p = pacoteDaEra(pais);
  if (!vida.era || !p) return null;
  const t = vida.t, ano = anoDe(t);
  const dentro = ano <= 2025;
  const lado = ladoDaVida(vida);
  const moeda = moedaNoMes(p, t, lado);
  const gov = [...p.governantes].filter(g => !g.lado || g.lado === lado).reverse().find(g => g.desde[0] * 12 + g.desde[1] - 1 <= t);
  const inf = (() => { const a = naSerie(p.serie, p.serie.PRECOS, ano - 1), b = naSerie(p.serie, p.serie.PRECOS, ano - 2); return a !== null && b !== null ? a / b - 1 : undefined; })();
  const pib = naSerie(p.serie, p.serie.PIB, ano - 1);
  const desemprego = naSerie(p.serie, p.serie.DESEMPREGO, ano - 1);
  const renda = naSerie(p.serie, p.serie.RENDA, ano);
  const mort = mortalidadeNoAno(pais, ano);
  let minimo: number | undefined;
  for (const [desde, valor] of p.salarioMinimo ?? []) if (desde <= t) minimo = valor;
  const div = municipio(vida.moradia.municipioId).uf;
  const regras = dentro ? regrasDoPais(pais).filter(r => r.texto && regraValeEm(r, ano, div, lado) && r.tema !== 'escola_obrigatoria') : [];
  const guerra = guerraEmCurso(t);
  const imperial = pais === 'JP' ? eraImperialEm(ano, mesDe(t)) : undefined;
  const dec = decadaVisual(vida) ?? 2020;
  const proximas = TECNOLOGIAS_BR.filter(x => VITRINE.includes(x.id)).map(x => ({ x, d: datasNoPais(pais, x.id)! })).filter(({ d }) => d.chega > ano && d.chega < 9999).sort((a, b) => a.d.chega - b.d.chega).slice(0, 3);
  return (
    <section className="painel-epoca" data-era={dec} aria-label="A época">
      <div className="painel-epoca__topo">
        <ObjetosDaEpoca decada={dec as 1980} tamanho={48} />
        <div>
          <p className="painel-epoca__titulo">{MESES[mesDe(t)]} de {ano}{imperial ? ` · ano ${imperial.ano} da era ${imperial.nome}` : ''}</p>
          <p className="painel-epoca__sub">Você nasceu em {vida.era.ano}. {nomeDoEstado(p, ano, lado)}{p.divisao && lado === 'leste' ? ' — o lado leste do país dividido' : ''}.</p>
        </div>
      </div>
      <dl className="painel-epoca__grade">
        {gov && dentro && <div className="painel-epoca__dado"><dt>Governo</dt><dd>{gov.nome}<small>{gov.cargo}, desde {gov.desde[0]}</small></dd></div>}
        <div className="painel-epoca__dado"><dt>Moeda</dt><dd>{dentro ? `${moeda.nome.charAt(0).toUpperCase()}${moeda.nome.slice(1)} (${moeda.simbolo})` : 'a moeda de hoje'}<small>{dentro && moeda.troca ? `desde ${moeda.dataOficial}: ${moeda.troca}` : 'valores na moeda do mês'}</small></dd></div>
        {minimo !== undefined && dentro && <div className="painel-epoca__dado"><dt>Salário mínimo</dt><dd>{formatarDinheiro(daMoedaLocal(minimo))}<small>por mês, pela lei vigente</small></dd></div>}
        {minimo === undefined && dentro && <div className="painel-epoca__dado"><dt>Salário mínimo</dt><dd>não havia<small>sem piso nacional em lei</small></dd></div>}
        {inf !== undefined && <div className="painel-epoca__dado"><dt>Preços em {ano - 1}</dt><dd>{inf >= 0 ? '+' : '−'}{pct(Math.abs(inf))}<small>média do ano</small></dd></div>}
        {pib !== null && <div className="painel-epoca__dado"><dt>Economia em {ano - 1}</dt><dd>{pib >= 0 ? '+' : '−'}{Math.abs(pib).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%<small>PIB por pessoa</small></dd></div>}
        {desemprego !== null && dentro && <div className="painel-epoca__dado"><dt>Desemprego em {ano - 1}</dt><dd>{desemprego.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</dd></div>}
        {mort && <div className="painel-epoca__dado"><dt>Expectativa de vida</dt><dd>{Math.round(mort.e0)} anos<small>ao nascer, no país</small></dd></div>}
      </dl>
      {dentro && renda !== null && (
        <>
          <h3>Quanto rende o trabalho</h3>
          <ul className="painel-epoca__lista">
            <li>A renda por pessoa do país é <strong>{Math.round(renda * 100)}% da de 2025</strong>{p.divisao && lado === 'leste' ? `, e do lado leste, cerca de ${Math.round(p.divisao.rendaLeste * 100)}% da do oeste` : ''} (PIB real por pessoa — aproximação do rendimento).</li>
            <li>O aluguel de dois quartos na sua cidade: <strong>{formatarDinheiro(economiaLocal(vida.moradia.municipioId).aluguel)}</strong>.</li>
          </ul>
        </>
      )}
      {guerra && <p className="painel-epoca__nota"><strong>Em guerra:</strong> {guerra.nome}.</p>}
      {regras.length > 0 && (
        <>
          <h3>A lei e a sociedade, agora</h3>
          <ul className="painel-epoca__lista">{regras.slice(0, 5).map(r => <li key={r.id}><strong>{TEMA[r.tema]}:</strong> {r.texto.charAt(0).toUpperCase() + r.texto.slice(1)}</li>)}</ul>
        </>
      )}
      <h3>Como você fala com as pessoas</h3>
      <p className="painel-epoca__nota">{MEIO[meioDeComunicacao(vida)]}.</p>
      <h3>A tecnologia na sua vida</h3>
      <ul className="painel-epoca__tec">
        {VITRINE.map(id => ({ id, x: TECNOLOGIAS_BR.find(y => y.id === id)!, d: datasNoPais(pais, id)! })).filter(({ d }) => d.chega <= ano && (d.fim === undefined || ano < d.fim)).map(({ id, x }) => {
          const a = tecnologia(vida, id);
          return <li key={id} data-acesso={a}>{x.nome}{a === 'rara' ? ' · novidade' : a === 'indisponivel' ? ' · fora do alcance' : ''}</li>;
        })}
      </ul>
      {proximas.length > 0 && <p className="painel-epoca__nota">Ainda não chegou ao país: {proximas.map(({ x, d }) => `${x.nome} (${d.chega})`).join(', ')}.</p>}
      <p className="painel-epoca__nota">Fontes: Macrohistory Database (Jordà, Schularick e Taylor), Banco Mundial, Maddison Project e os institutos nacionais de estatística (preços, renda, desemprego); Our World in Data (expectativa de vida); leis e acontecimentos com a fonte de cada um. O jogo guarda o dinheiro em poder de compra de hoje e mostra cada valor na moeda do mês.</p>
    </section>
  );
}
