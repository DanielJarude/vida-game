/**
 * ERAS HISTÓRICAS · "A época" — o contexto do ano para uma vida histórica (Você → No mundo): quem governa, a moeda e o
 * salário mínimo do mês, a inflação e o PIB do ano anterior (séries oficiais), a tecnologia que a pessoa tem e a que
 * ainda não chegou. Tudo lido da camada histórica; a tela não inventa número.
 */
import type { Vida } from '../../motor/tipos';
import { anoDe, mesDe, MESES } from '../../motor/tempo';
import { fatorNominal, ipcaDoAno, nivelDePrecos, padraoEm, salarioMinimoNominal, FIM_DA_SERIE } from '../../motor/eras/base/moedas';
import { tecnologia, meioDeComunicacao } from '../../motor/eras/base/contexto';
import { TECNOLOGIAS_BR } from '../../motor/eras/base/tecnologias';
import { PIB_BR, PRESIDENTES_BR } from '../../motor/eras/dados/acontecimentosBR';
import { ObjetosDaEpoca } from './Aparelhos';
import { decadaVisual } from './epoca';
import './eras.css';

const VITRINE = ['telefone_fixo', 'videocassete', 'computador', 'internet', 'celular', 'sms', 'mensageiro_pc', 'rede_comunidades', 'smartphone', 'mensageiro_app', 'redes_modernas', 'app_namoro', 'streaming', 'pix'];
const MEIO: Record<string, string> = { fixo: 'telefone fixo, orelhão e carta', celular: 'celular de teclas', smartphone: 'smartphone' };

const nominal = (valorReais: number, t: number) => {
  const p = padraoEm(t);
  const n = valorReais * p.porReal;
  return `${p.simbolo} ${n.toLocaleString('pt-BR', { maximumFractionDigits: n < 100 ? 2 : 0, minimumFractionDigits: n < 100 ? 2 : 0 })}`;
};
const pct = (x: number) => `${(x * 100).toLocaleString('pt-BR', { maximumFractionDigits: x >= 1 ? 0 : 1 })}%`;

export function PainelDaEpoca({ vida }: { vida: Vida }) {
  if (!vida.era) return null;
  const t = vida.t, ano = anoDe(t);
  const dentro = t <= FIM_DA_SERIE;
  const p = padraoEm(t);
  const pres = [...PRESIDENTES_BR].reverse().find(x => x.desde[0] * 12 + x.desde[1] - 1 <= t);
  const sm = salarioMinimoNominal(t);
  const ipca = ipcaDoAno(ano - 1), pib = PIB_BR[ano - 1];
  const dec = decadaVisual(vida) ?? 2020;
  const proximas = TECNOLOGIAS_BR.filter(x => VITRINE.includes(x.id) && x.brasil > ano).sort((a, b) => a.brasil - b.brasil).slice(0, 3);
  return (
    <section className="painel-epoca" data-era={dec} aria-label="A época">
      <div className="painel-epoca__topo">
        <ObjetosDaEpoca decada={dec as 1980} tamanho={48} />
        <div>
          <p className="painel-epoca__titulo">{MESES[mesDe(t)]} de {ano}</p>
          <p className="painel-epoca__sub">Você nasceu em {vida.era.ano}. A vida segue o calendário do Brasil.</p>
        </div>
      </div>
      <dl className="painel-epoca__grade">
        {pres && dentro && <div className="painel-epoca__dado"><dt>Presidência</dt><dd>{pres.nome}<small>{pres.nota ?? `desde ${pres.desde[0]}`}</small></dd></div>}
        <div className="painel-epoca__dado"><dt>Moeda</dt><dd>{dentro ? `${p.nome.charAt(0).toUpperCase()}${p.nome.slice(1)} (${p.simbolo})` : 'Real (R$)'}<small>{dentro && p.troca ? `desde ${p.dataOficial}: ${p.troca}` : 'valores em reais de hoje'}</small></dd></div>
        {sm !== undefined && dentro && <div className="painel-epoca__dado"><dt>Salário mínimo</dt><dd>{nominal(sm, t)}<small>vigente no mês (Ipeadata/MTE)</small></dd></div>}
        {ipca !== undefined && <div className="painel-epoca__dado"><dt>Inflação de {ano - 1}</dt><dd>{pct(ipca)}<small>IPCA, IBGE</small></dd></div>}
        {pib !== undefined && <div className="painel-epoca__dado"><dt>Economia em {ano - 1}</dt><dd>{pib >= 0 ? '+' : '−'}{Math.abs(pib).toLocaleString('pt-BR')}%<small>PIB, IBGE</small></dd></div>}
        {dentro && <div className="painel-epoca__dado"><dt>Poder de compra</dt><dd>{nominal(nivelDePrecos(t), t)}<small>compram o que R$ 1,00 compra hoje</small></dd></div>}
      </dl>
      <h3>Como você fala com as pessoas</h3>
      <p className="painel-epoca__nota">{MEIO[meioDeComunicacao(vida)]}.</p>
      <h3>A tecnologia na sua vida</h3>
      <ul className="painel-epoca__tec">
        {VITRINE.map(id => TECNOLOGIAS_BR.find(x => x.id === id)!).filter(x => x.brasil <= ano && (x.fim === undefined || ano < x.fim)).map(x => {
          const a = tecnologia(vida, x.id);
          return <li key={x.id} data-acesso={a}>{x.nome}{a === 'rara' ? ' · novidade' : a === 'indisponivel' ? ' · fora do alcance' : ''}</li>;
        })}
      </ul>
      {proximas.length > 0 && <p className="painel-epoca__nota">Ainda não existe no Brasil: {proximas.map(x => `${x.nome} (${x.brasil})`).join(', ')}.</p>}
      <p className="painel-epoca__nota">Fontes: IBGE (IPCA, PIB), Ipeadata (salário mínimo), Banco Central (moedas). O jogo guarda o dinheiro em poder de compra de hoje e mostra cada valor na moeda do mês — {fatorNominal(t) > 1e6 ? 'por isso os zeros' : 'por isso os números mudam com o tempo'}.</p>
    </section>
  );
}
