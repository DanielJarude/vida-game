/**
 * O dinheiro, em Vida · Dinheiro (REWORK 3; antes, dentro de "Você" — Você
 * guarda um atalho): porque a situação material faz parte de
 * como a pessoa está. Responde "como eu estou de dinheiro?" — o que tenho
 * à mão, quanto entra que é meu, quanto ponho em casa, quanto sai, o que
 * devo, para onde a coisa anda — e as duas escolhas de todo mês (padrão de
 * vida, plano de saúde). Não é extrato de banco: a casa, os bens, as
 * aplicações ficam logo abaixo; as lojas, em Compras.
 */

import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { idade } from '../../motor/nucleo';
import { balanco, rendaPropriaMensal } from '../../motor/sistemas/dinheiro';
import { totalAplicado } from '../../motor/sistemas/investimentos';
import { negocioAberto } from '../../motor/sistemas/negocio';
import { BotaoAcao, Dado, Escolha, Linha } from '../comum';
import { dinheiroCheio, dinheiroCurto, leituraDaSeguranca, leituraDoExtrato, leituraDoMes, type LeituraDoExtrato } from '../leituraMaterial';
import { intencaoProfissional } from '../../motor/sistemas/intencao';

const TONS = ['t1', 't2', 't3', 't4', 't5', 't6'];

function tendencia(v: Vida): { palavra: string; seta: string } | undefined {
  const h = v.financas.historico.map(x => x.ativos - x.obrigacoes);
  if (h.length < 3) return undefined;
  const a = h[h.length - 3];
  const b = h[h.length - 1];
  const base = Math.max(5000, Math.abs(a));
  const d = (b - a) / base;
  return d > 0.08 ? { palavra: 'vem crescendo', seta: '↗' } : d < -0.08 ? { palavra: 'vem encolhendo', seta: '↘' } : { palavra: 'parado', seta: '→' };
}

export function ODinheiro({ vida, agir, irParaCasa }: { vida: Vida; agir: (a: Acao) => boolean; irParaCasa?: () => void }) {
  const m = leituraDoMes(vida);
  const seg = leituraDaSeguranca(vida);
  const i = idade(vida);
  const f = vida.financas;
  if (m.dependente) {
    return (
      <section className="dinheiro dinheiro--dependente" aria-labelledby="titulo-dinheiro">
        <h2 id="titulo-dinheiro" className="secao-fio">O dinheiro</h2>
        <div className="mes mes--dependente">
          <div className="mes__seu">
            <span className="rotulo-pequeno">O que é seu</span>
            <strong className="valor-grande">{dinheiroCheio(Math.max(0, f.conta))}</strong>
            <p className="nota">{m.frase}</p>
          </div>
          {m.casa && (
            <div className={`mes__casa mes__casa--${m.casa.folga}`}>
              <span className="rotulo-pequeno">A casa (não é seu)</span>
              <p>{m.casa.texto}</p>
            </div>
          )}
        </div>
      </section>
    );
  }
  const b = balanco(vida);
  const aplicado = totalAplicado(vida);
  const negocio = negocioAberto(vida);
  const proprio = rendaPropriaMensal(vida);
  const emCasa = -m.orcamento.saidas.filter(l => l.grupo === 'moradia' || l.grupo === 'casa' || l.grupo === 'filhos').reduce((s, l) => s + l.valor, 0);
  const parcelas = f.dividas.filter(d => d.parcela > 0 && d.saldo > 0);
  const atrasadas = f.dividas.filter(d => (d.atraso ?? 0) > 0).length + ((vida.moradia.atraso ?? 0) > 0 ? 1 : 0);
  const t = tendencia(vida);
  const extrato = leituraDoExtrato(vida);
  const intencao = intencaoProfissional(vida);
  const total = Math.max(m.orcamento.renda, m.orcamento.despesa, 1);
  const principais = m.saidas.slice(0, 5);
  const outras = m.saidas.slice(5);
  const outrasValor = outras.reduce((s, x) => s + x.valor, 0);
  return (
    <section className={`dinheiro dinheiro--${seg.nivel}`} aria-labelledby="titulo-dinheiro">
      <div className="dinheiro__cabeca">
        <h2 id="titulo-dinheiro" className="secao-fio">O dinheiro</h2>
        <Seguranca s={seg} />
      </div>
      <p className="mes__frase">{m.frase}</p>
      <dl className="dados dados--dinheiro">
        {/* A conta como ela está: no vermelho aparece no vermelho (antes, um saldo negativo virava "R$ 0" na tela). */}
        <Dado rotulo="Na conta">{dinheiroCurto(f.conta)}{f.conta < -0.5 ? <small> (no vermelho)</small> : null}</Dado>
        {aplicado > 0 && <Dado rotulo="Aplicado">{dinheiroCurto(aplicado)}<small> (dá para tirar)</small></Dado>}
        <Dado rotulo="Seu, por mês">{proprio > 0 ? dinheiroCurto(proprio) : 'nada ainda'}</Dado>
        {emCasa > 0 && <Dado rotulo="Casa e família">{dinheiroCurto(emCasa)}/mês</Dado>}
        <Dado rotulo="Deve">{b.obrigacoes > 0 ? dinheiroCurto(b.obrigacoes) : 'nada'}{atrasadas ? <small> · {atrasadas} em atraso</small> : null}</Dado>
        <Dado rotulo="Patrimônio">{dinheiroCurto(b.liquido)}{t && <small> {t.seta} {t.palavra}</small>}</Dado>
      </dl>
      {aplicado > 0 && <p className="nota">{rendeuTexto(vida)}</p>}
      {/* A mesma leitura que Trabalho e Você usam (`intencao`): o patrimônio que paga a vida e o que a pessoa quer fazer com o tempo. */}
      {intencao.intencao !== 'nao_se_aplica' && (intencao.livre || intencao.intencao === 'sem_procurar') && <p className="nota">{intencao.texto}</p>}
      {negocio && (negocio.caixa ?? 0) >= 1000 && <p className="nota">No caixa de {negocio.nome}: {dinheiroCurto(negocio.caixa ?? 0)} — do negócio; vira seu quando você tira (em Trabalho).</p>}
      {parcelas.length > 0 && <p className="nota">Compromissos de todo mês: {parcelas.length === 1 ? parcelas[0].descricao.toLowerCase() : `${parcelas.length} parcelas`}, {dinheiroCurto(parcelas.reduce((s, d) => s + d.parcela, 0))} por mês.</p>}
      {(m.orcamento.renda > 0 || m.orcamento.despesa > 0) && (
        <div className="balanca" role="group" aria-label="Quanto entra e quanto sai por mês">
          <div className="balanca__linha">
            <span className="balanca__rotulo">Entra</span>
            <div className="mes-barra" aria-hidden>
              {m.entradas.map((e, k) => <span key={e.origem} className={`mes-barra__parte mes-barra__parte--entra-${k}`} style={{ width: `${(e.valor / total) * 100}%` }} />)}
            </div>
            <span className="balanca__valor">{dinheiroCurto(m.orcamento.renda)}</span>
          </div>
          <div className="balanca__linha">
            <span className="balanca__rotulo">Sai</span>
            <div className="mes-barra" aria-hidden>
              {principais.map((s, k) => <span key={s.grupo} className={`mes-barra__parte mes-barra__parte--${TONS[k]}`} style={{ width: `${(s.valor / total) * 100}%` }} />)}
              {outrasValor > 0 && <span className="mes-barra__parte mes-barra__parte--t6" style={{ width: `${(outrasValor / total) * 100}%` }} />}
            </div>
            <span className="balanca__valor">{dinheiroCurto(m.orcamento.despesa)}</span>
          </div>
          <p className={`balanca__resultado balanca__resultado--${m.sobra >= 0 ? 'bom' : 'ruim'}`}>
            {m.sobra >= 0 ? 'Sobra' : 'Falta'} <strong>{dinheiroCheio(Math.abs(m.sobra))}</strong> por mês
          </p>
          <ul className="legenda">
            {m.entradas.map((e, k) => <li key={e.origem}><span className={`legenda__cor mes-barra__parte--entra-${k}`} aria-hidden />{e.origem}<span className="legenda__valor">+ {dinheiroCurto(e.valor)}</span></li>)}
            {principais.map((s, k) => <li key={s.grupo}><span className={`legenda__cor mes-barra__parte--${TONS[k]}`} aria-hidden />{s.rotulo}<span className="legenda__valor">− {dinheiroCurto(s.valor)}</span></li>)}
            {outrasValor > 0 && <li><span className="legenda__cor mes-barra__parte--t6" aria-hidden />{outras.map(o => o.rotulo.toLowerCase()).join(', ').replace(/^./, c => c.toUpperCase())}<span className="legenda__valor">− {dinheiroCurto(outrasValor)}</span></li>}
          </ul>
          <details className="detalhes">
            <summary>Ver cada linha</summary>
            {m.orcamento.entradas.map(l => <Linha key={`e${l.rotulo}`} rotulo={l.rotulo} valor={`+ ${dinheiroCheio(l.valor)}`} />)}
            {m.orcamento.saidas.map(l => <Linha key={`s${l.rotulo}`} rotulo={l.rotulo} valor={`− ${dinheiroCheio(-l.valor)}`} />)}
          </details>
        </div>
      )}
      {extrato && <ContaDoAno x={extrato} />}
      {m.casa && <p className="nota">{m.casa.texto}</p>}
      {i >= 18 && (
        <div className="campo">
          <span className="campo__rotulo">Padrão de vida</span>
          <Escolha rotulo="Padrão de vida" valor={f.estilo} aoMudar={x => agir({ tipo: 'estilo', valor: x })}
            opcoes={[{ id: 'apertado', rotulo: 'Apertado' }, { id: 'modesto', rotulo: 'Modesto' }, { id: 'confortavel', rotulo: 'Confortável' }, { id: 'folgado', rotulo: 'Folgado' }]} />
          <p className="nota">{({ apertado: 'O mínimo: quase tudo o que sobra fica guardado.', modesto: 'Um pouco de tudo: metade do que sobra vira vida, metade fica.', confortavel: 'Restaurante, viagem, coisa boa: guarda pouco.', folgado: 'O que entra, sai. Quase nada fica.' } as const)[f.estilo]}</p>
        </div>
      )}
      <div className="grupo-acoes grupo-acoes--linha">
        {i >= 18 && <BotaoAcao vida={vida} acao={{ tipo: 'plano_saude', ativo: !f.planoDeSaude }} agir={agir} variante="discreto">{f.planoDeSaude ? 'Cancelar o plano de saúde' : 'Contratar plano de saúde'}</BotaoAcao>}
        {i >= 16 && irParaCasa && <button type="button" className="botao botao--discreto" onClick={irParaCasa}>Onde você mora (Casa) ↗</button>}
      </div>
    </section>
  );
}

/**
 * O que as aplicações fizeram no último ano, em reais: o que rendeu (e ficou
 * aplicado) e o que pagaram na conta. Sem isso, um milhão aplicado parece
 * dinheiro que não existe.
 */
function rendeuTexto(v: Vida): string {
  const r = v.financas.razao;
  const val = r.find(l => l.rotulo === 'Valorização das aplicações')?.valor ?? 0;
  const pago = r.find(l => l.rotulo === 'Dividendos e aluguéis de fundos')?.valor ?? 0;
  const tirado = r.find(l => l.rotulo === 'Tirado das aplicações para cobrir o ano')?.valor ?? 0;
  const partes: string[] = [];
  if (val > 0) partes.push(`renderam ${dinheiroCurto(val)} (ficou aplicado)`);
  else if (val < 0) partes.push(`perderam ${dinheiroCurto(-val)} de valor`);
  if (pago > 0) partes.push(`pagaram ${dinheiroCurto(pago)} na conta`);
  const ano = partes.length ? `No último ano, as aplicações ${partes.join(' e ')}.` : 'As aplicações ainda não fecharam um ano.';
  // (A1: a frase dizia "o jogo pergunta antes" — verdade para uma compra, não para o ano que fecha no vermelho, quando
  // elas cobrem a diferença sozinhas. Agora diz as duas coisas, e o resgate do ano aparece com o valor.)
  return `${ano}${tirado > 0 ? ` O ano fechou no vermelho e saíram ${dinheiroCurto(tirado)} delas para cobrir.` : ''} Para uma compra que a conta não cobre, o jogo pergunta antes de tirar delas; se o ano fechar no vermelho, elas cobrem a diferença.`;
}

/**
 * A conta do último ano, real por real (`sistemas/extrato`): começou com X,
 * entrou, saiu, foi para as aplicações, voltou delas, terminou com Y. Responde
 * "a sobra do mês foi para onde?" — sem isso, uma conta parada em zero com
 * sobra todo mês parece dinheiro sumindo (A1, playtest).
 */
function ContaDoAno({ x }: { x: LeituraDoExtrato }) {
  const sinal = (n: number) => `${n >= 0 ? '+' : '−'} ${dinheiroCheio(Math.abs(n))}`;
  const a = x.aplicacoes;
  return (
    <details className="detalhes">
      <summary>A conta de {x.ano}: começou com {dinheiroCurto(x.inicio)}, terminou com {dinheiroCurto(x.fim)}</summary>
      <Linha rotulo="Na conta, no começo do ano" valor={dinheiroCheio(x.inicio)} />
      {x.conta.map(g => (
        <Linha key={g.rotulo} rotulo={g.linhas.length === 1 ? g.linhas[0].rotulo : <>{g.rotulo} <small>({g.linhas.map(l => l.rotulo.toLowerCase()).slice(0, 4).join('; ')}{g.linhas.length > 4 ? '…' : ''})</small></>} valor={sinal(g.valor)} tom={g.valor < 0 ? 'ruim' : undefined} />
      ))}
      <Linha rotulo="Na conta, no fim do ano" valor={<strong>{dinheiroCheio(x.fim)}</strong>} />
      {x.depois !== 0 && <p className="nota">Depois do fechamento, {x.depois > 0 ? 'entraram' : 'saíram'} {dinheiroCurto(Math.abs(x.depois))} (acontecimentos e escolhas deste ano, que entram na conta do ano que vem).</p>}
      {a && <p className="nota">Nas aplicações: {dinheiroCurto(a.inicio)} no começo, {dinheiroCurto(a.fim)} no fim{[a.rendeu ? `${a.rendeu > 0 ? 'renderam' : 'perderam'} ${dinheiroCurto(Math.abs(a.rendeu))}` : '', a.posto ? `você pôs ${dinheiroCurto(a.posto)}` : '', a.tirado ? `saíram ${dinheiroCurto(-a.tirado)}` : '', a.outros ? `${a.outros > 0 ? 'entraram' : 'saíram'} ${dinheiroCurto(Math.abs(a.outros))} por outros caminhos (herança, partilha, compras pagas com elas)` : ''].filter(Boolean).map((p, k) => `${k === 0 ? ' — ' : '; '}${p}`).join('')}. Nada vai para as aplicações sozinho: só o que você põe.</p>}
    </details>
  );
}

function Seguranca({ s }: { s: ReturnType<typeof leituraDaSeguranca> }) {
  if (s.marca < 0) return null;
  return (
    <div className={`seguranca seguranca--${s.nivel}`} title={s.texto}>
      <span className="escala" aria-hidden>{[0, 1, 2, 3, 4].map(k => <span key={k} className={`escala__marca${k <= s.marca ? ' escala__marca--cheia' : ''}`} />)}</span>
      <span className="seguranca__palavra">{s.palavra}</span>
      <span className="sr-only">: {s.texto}</span>
    </div>
  );
}
