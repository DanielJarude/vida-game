/**
 * VIDA 12.9 — A GESTÃO ATIVA (pacote sob demanda): o painel de cada empresa (números, o porquê do ano, o que pede atenção,
 * a evolução, os projetos, as alavancas, a diretoria, o capital), o fundar e o comprar das empresas grandes, e o raio-x
 * financeiro do resumo (disponível × patrimônio × liquidez × renda × fluxo).
 *
 * Nada aqui calcula regra: as leituras, os custos e os bloqueios vêm do motor (`sistemas/empresas129`, `sistemas/fortuna129`).
 */

import { useState } from 'react';
import type { Acao } from '../../motor/acoes';
import { disponibilidade } from '../../motor/acoes';
import { podeTentar } from '../../motor/plausibilidade';
import type { CargoExecutivo, Empresa, PerfilExecutivo, TipoEmpresa, Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import {
  alavancasDe, aportesPossiveis, cargosPossiveis, custoEmpresa129, ehGrande, leituraDaAceitacao, NOME_PORTE, opcaoAtual, ofertasDeAquisicao, painelDaEmpresa, planoDeFundacao,
  projetosPossiveis, setoresAoAlcance
} from '../../motor/sistemas/empresas129';
import { indicadores, NOME_ESCALA } from '../../motor/sistemas/fortuna129';
import { DESCRICAO_PERFIL, NOME_CARGO, NOME_PERFIL, setorGrande } from '../../motor/dados/empresas129';
import { BotaoAcao } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import { Evolucao } from './material/Desenhos';
import '../empresas129.css';

type Agir = (a: Acao) => boolean;
const PERFIS: PerfilExecutivo[] = ['conservador', 'agressivo', 'inovador', 'expansao', 'eficiencia', 'financas'];
const sinal = (x: number) => `${x < 0 ? '− ' : ''}${dinheiroCurto(Math.abs(x))}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ================================================================ O painel de uma empresa */

export function PainelDaEmpresa129({ vida, agir, e }: { vida: Vida; agir: Agir; e: Empresa }) {
  const p = painelDaEmpresa(vida, e);
  const manda = e.papel !== 'investidor' && e.estado !== 'encerrada';
  const a = (oque: Extract<Acao, { tipo: 'empresa129' }>['oque'], alvo?: string): Acao => ({ tipo: 'empresa129', empresaId: e.id, oque, ...(alvo !== undefined ? { alvo } : {}) });
  return (
    <div className="e129">
      <dl className="e129-kpis">
        {p.kpis.map(k => (
          <div key={k.rotulo} className={`e129-kpi${k.tom ? ` e129-kpi--${k.tom}` : ''}`}>
            <dt>{k.rotulo}</dt>
            <dd>{k.tipo === 'dinheiro' ? sinal(k.valor) : k.tipo === 'pct' ? `${(k.valor * 100).toFixed(k.valor < 0.01 ? 2 : 1).replace('.', ',')}%` : `${Math.round(k.valor)}/100`}</dd>
          </div>
        ))}
      </dl>
      {p.alertas.length > 0 && (
        <div className="e129-atencao" role="status">
          <p className="rotulo-pequeno">Pede atenção</p>
          <ul>{p.alertas.map(x => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
      {p.causas.length > 0 && (
        <div className="e129-causas">
          <p className="rotulo-pequeno">Por que o último ano foi assim</p>
          <ul>{p.causas.map((c, k) => <li key={k} className={`e129-causa e129-causa--${c.tom}`}><span className="e129-selo">{c.acaso ? 'acaso' : 'escolha'}</span> {c.texto}</li>)}</ul>
        </div>
      )}
      {p.serie.length >= 2 && (
        <div className="e129-evolucao">
          <p className="rotulo-pequeno">Resultado, ano a ano (desde {p.serie[0].ano})</p>
          <Evolucao valores={p.serie.map(x => x.lucro)} rotulo={`Resultado de ${p.serie[0].ano} a ${p.serie[p.serie.length - 1].ano}: de ${sinal(p.serie[0].lucro)} para ${sinal(p.serie[p.serie.length - 1].lucro)}.`} />
          <details className="detalhes"><summary>Os números de cada ano</summary>
            <div className="pat-rolagem" data-rola-x>
              <table className="pat-tabela"><thead><tr><th scope="col">Ano</th><th scope="col">Faturamento</th><th scope="col">Resultado</th><th scope="col">Valor</th></tr></thead>
                <tbody>{p.serie.slice(-8).reverse().map(x => <tr key={x.ano}><th scope="row">{x.ano}</th><td>{dinheiroCurto(x.receita)}</td><td className={x.lucro < 0 ? 'perda' : 'ganho'}>{sinal(x.lucro)}</td><td>{dinheiroCurto(x.valor)}</td></tr>)}</tbody></table>
            </div>
          </details>
        </div>
      )}
      {p.projetos.length > 0 && (
        <div className="e129-bloco">
          <p className="rotulo-pequeno">{p.grande ? 'Projetos e linhas' : 'Produtos e serviços novos'}</p>
          <ul className="e129-projetos">
            {p.projetos.map(({ p: pj, progresso, descricao }) => (
              <li key={pj.id} className={`e129-projeto e129-projeto--${pj.estado}`}>
                <p className="e129-projeto__nome"><strong>{pj.nome}</strong> <span className="nota">{pj.estado === 'desenvolvimento' ? `em desenvolvimento · ${Math.round(progresso * 100)}% · ${dinheiroCurto(pj.investido)} de ${dinheiroCurto(pj.orcamento)}` : pj.estado === 'ativo' ? `à venda desde ${anoDe(pj.tLanc ?? vida.t)} · o mercado recebeu ${leituraDaAceitacao(pj.aceitacao ?? 50)}${pj.receitaAno ? ` · vendeu ${dinheiroCurto(pj.receitaAno)} no ano` : ''}` : pj.estado === 'fracassado' ? 'fracassou' : 'fora de linha'}</span></p>
                {pj.estado === 'desenvolvimento' && <div className="e129-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso * 100)} aria-label={`Andamento de ${pj.nome}`}><span style={{ width: `${Math.round(progresso * 100)}%` }} /></div>}
                {descricao && <p className="nota">{descricao}</p>}
                {pj.marcos && pj.marcos.length > 1 && <p className="nota">{pj.marcos.slice(-2).map(m => `${anoDe(m.t)}: ${m.texto}`).join(' · ')}</p>}
                {manda && (pj.estado === 'ativo' || pj.estado === 'desenvolvimento') && (
                  <div className="grupo-acoes grupo-acoes--linha">
                    {pj.estado === 'ativo' && p.grande && <BotaoAcao vida={vida} acao={a('ampliar', pj.id)} agir={agir} variante="discreto" ocultarImpossivel>{`Ampliar a produção (${dinheiroCurto(custoEmpresa129(vida, e, 'ampliar', pj.id))})`}</BotaoAcao>}
                    <BotaoAcao vida={vida} acao={a('descontinuar', pj.id)} agir={agir} variante="discreto">{pj.estado === 'ativo' ? 'Descontinuar' : 'Cancelar'}</BotaoAcao>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {manda && <Decidir vida={vida} agir={agir} e={e} grande={p.grande} delegado={p.delegado} a={a} />}
      <Diretoria vida={vida} agir={agir} e={e} manda={manda} diretoria={p.diretoria} a={a} />
    </div>
  );
}

function Decidir({ vida, agir, e, grande, delegado, a }: { vida: Vida; agir: Agir; e: Empresa; grande: boolean; delegado: boolean; a: (o: Extract<Acao, { tipo: 'empresa129' }>['oque'], alvo?: string) => Acao }) {
  const lancaveis = projetosPossiveis(vida, e);
  const alavancas = alavancasDe(e);
  const grupos = [...new Set(alavancas.map(x => x.grupo))];
  const s = setorGrande(e.tipo);
  return (
    <details className="objeto__fazer e129-decidir">
      <summary className="objeto__fazer-titulo">Estratégia de {e.nome}</summary>
      {e.gestao.quem === 'contratada' && (
        <div className="e129-delegar">
          <p className="nota">{delegado ? `${e.gestao.nome ?? 'A gestão'} decide as alavancas e os projetos (com o juízo e o viés de quem está lá). O que você mudar, a gestão respeita por dois anos.` : 'Você decide a estratégia; a gestão executa o que estiver decidido.'}</p>
          <BotaoAcao vida={vida} acao={a('delegar', delegado ? 'nao' : 'sim')} agir={agir} variante="discreto">{delegado ? `Decidir eu mesm${vida.eu.genero === 'feminino' ? 'a' : 'o'}` : 'Delegar a estratégia à gestão'}</BotaoAcao>
        </div>
      )}
      {grupos.map(g => (
        <section key={g} className="e129-grupo" aria-label={g}>
          <p className="rotulo-pequeno">{g}</p>
          {alavancas.filter(x => x.grupo === g).map(al => <Alavanca key={al.id} vida={vida} agir={agir} e={e} id={al.id} rotulo={al.rotulo} opcoes={al.opcoes} atual={opcaoAtual(e, al).id} a={a} />)}
        </section>
      ))}
      {lancaveis.length > 0 && (
        <section className="e129-grupo" aria-label="Lançar">
          <p className="rotulo-pequeno">{grande ? 'Começar um projeto' : 'Lançar um produto ou serviço'}</p>
          <ul className="e129-lancar">
            {lancaveis.map(x => (
              <li key={x.id}>
                <BotaoAcao vida={vida} acao={a('projeto', x.id)} agir={agir} variante="discreto" ocultarImpossivel>{`${x.nome} (${dinheiroCurto(x.custo)})`}</BotaoAcao>
                <p className="nota">{x.descricao} {grande ? `Uns ${Math.round(x.meses / 12 * 10) / 10} anos até vender; maduro, deve faturar uns ${dinheiroCurto(x.receita ?? 0)} por ano. Risco ${x.risco}.` : `Uns ${x.meses} meses até ficar pronto.`}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {grande && s && (
        <section className="e129-grupo" aria-label="Crescer e financiar">
          <p className="rotulo-pequeno">Crescer e financiar</p>
          <div className="grupo-acoes">
            <BotaoAcao vida={vida} acao={a('capacidade')} agir={agir} variante="discreto">{`Mais uma ${s.unidade[0]} (${dinheiroCurto(custoEmpresa129(vida, e, 'capacidade'))}, ${s.mesesCapacidade} meses)`}</BotaoAcao>
            <BotaoAcao vida={vida} acao={a('concorrente')} agir={agir} variante="discreto" ocultarImpossivel>{`Comprar um concorrente (${dinheiroCurto(custoEmpresa129(vida, e, 'concorrente'))})`}</BotaoAcao>
            <BotaoAcao vida={vida} acao={a('captar')} agir={agir} variante="discreto" ocultarImpossivel>{`Tomar crédito para a empresa (${dinheiroCurto(custoEmpresa129(vida, e, 'captar'))})`}</BotaoAcao>
            <BotaoAcao vida={vida} acao={a('amortizar')} agir={agir} variante="discreto" ocultarImpossivel>{`Pagar dívida com o caixa (${dinheiroCurto(custoEmpresa129(vida, e, 'amortizar'))})`}</BotaoAcao>
            <BotaoAcao vida={vida} acao={a('investidores')} agir={agir} variante="discreto" ocultarImpossivel>Trazer investidores (a sua parte dilui)</BotaoAcao>
          </div>
        </section>
      )}
      {grande && (
        <section className="e129-grupo" aria-label="O lucro">
          <p className="rotulo-pequeno">O lucro</p>
          <p className="nota">{e.distribuir ? 'O que passa de uma reserva vira dividendo (a sua parte cai na sua conta).' : 'O lucro fica na empresa: caixa para os projetos e para atravessar crise.'}</p>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={{ tipo: 'empresa', empresaId: e.id, decisao: 'distribuir' }} agir={agir} variante="discreto" ocultarBloqueado>Distribuir dividendos</BotaoAcao>
            <BotaoAcao vida={vida} acao={{ tipo: 'empresa', empresaId: e.id, decisao: 'reinvestir' }} agir={agir} variante="discreto" ocultarBloqueado>Reinvestir tudo</BotaoAcao>
          </div>
        </section>
      )}
      <section className="e129-grupo" aria-label="Pôr dinheiro">
        <p className="rotulo-pequeno">Pôr dinheiro seu (aumenta a sua exposição)</p>
        <div className="grupo-acoes grupo-acoes--linha">
          {aportesPossiveis(vida, e).map(x => <BotaoAcao key={x} vida={vida} acao={a('aportar', String(x))} agir={agir} variante="discreto">{dinheiroCurto(x)}</BotaoAcao>)}
        </div>
      </section>
    </details>
  );
}

function Alavanca({ vida, agir, e, id, rotulo, opcoes, atual, a }: { vida: Vida; agir: Agir; e: Empresa; id: string; rotulo: string; opcoes: { id: string; rotulo: string; descricao: string }[]; atual: string; a: (o: 'alavanca', alvo: string) => Acao }) {
  const [dica, setDica] = useState<string | undefined>();
  const descAtual = opcoes.find(o => o.id === atual)?.descricao;
  return (
    <div className="e129-alavanca">
      <p className="e129-alavanca__rotulo">{rotulo}</p>
      <div className="e129-opcoes" role="radiogroup" aria-label={rotulo}>
        {opcoes.map(o => {
          const acao = a('alavanca', `${id}:${o.id}`);
          const d = disponibilidade(vida, acao);
          const pode = podeTentar(d);
          const custo = custoEmpresa129(vida, e, 'alavanca', `${id}:${o.id}`);
          return (
            <button key={o.id} type="button" role="radio" aria-checked={o.id === atual} className={`e129-opcao${o.id === atual ? ' e129-opcao--atual' : ''}`} disabled={o.id !== atual && !pode}
              title={o.descricao} onFocus={() => setDica(o.id === atual ? o.descricao : pode ? o.descricao : d.motivo)} onClick={() => { if (o.id === atual) return; setDica(agir(acao) ? undefined : d.motivo); }}>
              <span>{o.rotulo}</span>{custo > 0 && o.id !== atual && <small>{dinheiroCurto(custo)}</small>}
            </button>
          );
        })}
      </div>
      <p className="nota e129-alavanca__dica">{dica ?? descAtual}</p>
    </div>
  );
}

function Diretoria({ vida, agir, e, manda, diretoria, a }: { vida: Vida; agir: Agir; e: Empresa; manda: boolean; diretoria: ReturnType<typeof painelDaEmpresa>['diretoria']; a: (o: Extract<Acao, { tipo: 'empresa129' }>['oque'], alvo?: string) => Acao }) {
  const [perfil, setPerfil] = useState<PerfilExecutivo>('conservador');
  const cargos = cargosPossiveis(e);
  return (
    <div className="e129-bloco">
      <p className="rotulo-pequeno">{ehGrande(e) ? 'A diretoria' : 'A gestão'}</p>
      <ul className="e129-diretoria">
        {diretoria.map(d => (
          <li key={d.cargo}>
            <strong>{NOME_CARGO[d.cargo]}:</strong> {d.nome}{d.perfil ? ` — perfil ${NOME_PERFIL[d.perfil]}` : ''} <span className="nota">· até aqui, {d.leitura}{d.salario ? ` · ${dinheiroCurto(d.salario)}/mês` : ''}</span>
            {manda && d.cargo !== 'ceo' && <BotaoAcao vida={vida} acao={a('demitir', d.cargo)} agir={agir} variante="discreto">{`Dispensar (${dinheiroCurto(d.salario * 6)} de rescisão)`}</BotaoAcao>}
          </li>
        ))}
      </ul>
      {manda && (
        <div className="e129-contratar">
          <label className="campo"><span className="campo__rotulo">Perfil de quem contratar</span>
            <select value={perfil} onChange={ev => setPerfil(ev.target.value as PerfilExecutivo)}>
              {PERFIS.map(x => <option key={x} value={x}>{cap(NOME_PERFIL[x])}</option>)}
            </select>
          </label>
          <p className="nota">{cap(DESCRICAO_PERFIL[perfil])}. Encaixa melhor: {perfil === 'financas' ? 'na diretoria financeira' : perfil === 'eficiencia' ? 'em operações' : perfil === 'inovador' ? 'em tecnologia' : perfil === 'expansao' ? 'em operações ou na presidência' : 'na presidência'}. Fora do lugar, custa e não entrega.</p>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={a('ceo', perfil)} agir={agir} variante="discreto">{e.gestao.quem === 'propria' ? (ehGrande(e) ? 'Contratar um CEO' : 'Contratar uma gestão') : (ehGrande(e) ? 'Trocar o CEO' : 'Trocar a gestão')}</BotaoAcao>
            {cargos.map((c: CargoExecutivo) => <BotaoAcao key={c} vida={vida} acao={a('executivo', `${c}:${perfil}`)} agir={agir} variante="discreto">{`${diretoria.some(d => d.cargo === c) ? 'Trocar' : 'Contratar'}: ${NOME_CARGO[c].toLowerCase()}`}</BotaoAcao>)}
          </div>
          {!cargos.length && <p className="nota">Com uma unidade só, a gestão dá conta. Diretoria é para a rede (duas unidades ou mais) e para as empresas grandes.</p>}
        </div>
      )}
    </div>
  );
}

/* ================================================================ Fundar e comprar */

export function FundarOuAdquirir129({ vida, agir }: { vida: Vida; agir: Agir }) {
  const ramos = setoresAoAlcance(vida);
  const perto = ramos.filter(x => x.perto);
  const [setor, setSetor] = useState<TipoEmpresa | undefined>(perto[0]?.s.id);
  const s = setor ? setorGrande(setor) : undefined;
  const [item, setItem] = useState<string>(s?.itens[0].id ?? '');
  const it = s?.itens.find(x => x.id === item) ?? s?.itens[0];
  const plano = s && it ? planoDeFundacao(vida, s.id, it.id, false) : undefined;
  const ofertas = ofertasDeAquisicao(vida);
  const longe = ramos.filter(x => !x.perto).sort((a, b) => a.minimo - b.minimo);
  return (
    <div className="e129-fundar">
      <h3 className="subtitulo">Empresas médias, grandes e bilionárias</h3>
      <p className="nota">Não é a loja da esquina: é capacidade (fábrica, frota, plataforma) e projetos que gastam por anos antes de vender. O valor da empresa não é dinheiro seu; o que você põe é exposição.</p>
      {perto.length > 0 ? (
        <>
          <label className="campo"><span className="campo__rotulo">Ramo</span>
            <select value={setor} onChange={ev => { const x = ev.target.value as TipoEmpresa; setSetor(x); setItem(setorGrande(x)!.itens[0].id); }}>
              {perto.map(x => <option key={x.s.id} value={x.s.id}>{x.s.rotulo} ({NOME_PORTE[x.s.porte]})</option>)}
            </select>
          </label>
          {s && <p className="nota">{s.descricao}</p>}
          {s && (
            <label className="campo"><span className="campo__rotulo">Primeiro projeto</span>
              <select value={it?.id} onChange={ev => setItem(ev.target.value)}>
                {s.itens.filter(x => !x.requer).map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
              </select>
            </label>
          )}
          {plano && (
            <>
              <dl className="e129-kpis">
                <div className="e129-kpi"><dt>Capital para fundar</dt><dd>{dinheiroCurto(plano.capital)}</dd></div>
                <div className="e129-kpi"><dt>Até vender</dt><dd>uns {String(plano.anosAteVender).replace('.', ',')} anos</dd></div>
                <div className="e129-kpi"><dt>Consome por ano até lá</dt><dd>{dinheiroCurto(plano.consumoAnual)}</dd></div>
                <div className="e129-kpi"><dt>Maduro, deve faturar</dt><dd>{dinheiroCurto(plano.receitaPrevista)}/ano</dd></div>
              </dl>
              {!plano.disponivel && <p className="nota nota--ruim">{plano.motivo}</p>}
              <div className="grupo-acoes grupo-acoes--linha">
                <BotaoAcao vida={vida} acao={{ tipo: 'fundar129', setor: plano.setor, item: plano.item, comSocio: false }} agir={agir} variante="principal">{`Fundar sozinh${vida.eu.genero === 'feminino' ? 'a' : 'o'} (${dinheiroCurto(plano.capitalDaPessoa)})`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={{ tipo: 'fundar129', setor: plano.setor, item: plano.item, comSocio: true }} agir={agir} variante="secundario">{`Com investidores, meio a meio (${dinheiroCurto(planoDeFundacao(vida, plano.setor, plano.item, true).capitalDaPessoa)})`}</BotaoAcao>
              </div>
            </>
          )}
        </>
      ) : <p className="nota">Nenhum ramo grande cabe no que você tem hoje.</p>}
      {longe.length > 0 && <p className="nota">Fora do alcance por enquanto: {longe.slice(0, 4).map(x => `${x.s.rotulo.toLowerCase()} (a partir de uns ${dinheiroCurto(x.minimo)})`).join(', ')}{longe.length > 4 ? '…' : ''}.</p>}
      {ofertas.length > 0 && (
        <div className="e129-ofertas">
          <h3 className="subtitulo">À venda neste ano</h3>
          <ul className="ofertas">
            {ofertas.map(o => (
              <li key={o.id} className="e129-oferta">
                <p><strong>{o.nome}</strong> <span className="nota">({setorGrande(o.setor)!.rotulo.toLowerCase()})</span></p>
                <p className="nota">Faturou {dinheiroCurto(o.receita)} e {o.lucro >= 0 ? `lucrou ${dinheiroCurto(o.lucro)}` : `perdeu ${dinheiroCurto(-o.lucro)}`} no último ano · dívida de {dinheiroCurto(o.divida)} · {o.linhas.join(', ')}. {o.nota} A empresa toda vale uns {dinheiroCurto(o.preco)}.</p>
                <div className="grupo-acoes grupo-acoes--linha">
                  {o.partes.map(parte => <BotaoAcao key={parte} vida={vida} acao={{ tipo: 'adquirir129', ofertaId: o.id, parte }} agir={agir} variante={parte === 1 ? 'secundario' : 'discreto'}>{parte === 1 ? `Comprar o controle (${dinheiroCurto(o.preco)})` : `Comprar ${Math.round(parte * 100)}% (${dinheiroCurto(o.preco * parte)})`}</BotaoAcao>)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ================================================================ O raio-x financeiro (resumo) */

export function RaioX129({ vida }: { vida: Vida }) {
  const x = indicadores(vida);
  return (
    <div className="e129-raiox">
      <p className="rotulo-pequeno">Raio-x · {NOME_ESCALA[x.escala]}</p>
      <p className="e129-raiox__frase">{x.frase}</p>
      <dl className="e129-kpis">
        <div className="e129-kpi"><dt>Dinheiro na conta</dt><dd>{sinal(x.conta)}</dd></div>
        <div className="e129-kpi"><dt>À mão em dias</dt><dd>{dinheiroCurto(x.liquidezImediata)}</dd></div>
        <div className="e129-kpi"><dt>Mobilizável em semanas</dt><dd>{dinheiroCurto(x.liquidez)}</dd></div>
        <div className="e129-kpi"><dt>Patrimônio bruto</dt><dd>{dinheiroCurto(x.bruto)}</dd></div>
        <div className="e129-kpi e129-kpi--ruim"><dt>Dívidas e obrigações</dt><dd>{x.dividas ? `− ${dinheiroCurto(x.dividas)}` : 'nenhuma'}</dd></div>
        <div className="e129-kpi"><dt>Patrimônio líquido</dt><dd>{sinal(x.liquido)}</dd></div>
        <div className="e129-kpi"><dt>Renda recorrente</dt><dd>{dinheiroCurto(x.rendaAno)}/ano</dd></div>
        {x.fluxo && <div className={`e129-kpi${x.fluxo.saldo < 0 ? ' e129-kpi--ruim' : ' e129-kpi--bom'}`}><dt>Fluxo de caixa ({x.fluxo.ano})</dt><dd>{sinal(x.fluxo.saldo)}</dd></div>}
      </dl>
      <details className="detalhes">
        <summary>De onde vem e onde está</summary>
        {x.renda.length > 0 && <><p className="rotulo-pequeno">O que entra por ano</p><ul className="e129-lista">{x.renda.map(r => <li key={r.rotulo}><span>{r.rotulo}</span><strong>{dinheiroCurto(r.valor)}</strong></li>)}</ul></>}
        {x.fluxo && <p className="nota">No último ano fechado, entraram {dinheiroCurto(x.fluxo.entradas)} e saíram {dinheiroCurto(x.fluxo.saidas)} (sem contar o que só passou da conta para as aplicações).</p>}
        {x.imobilizado.length > 0 && <><p className="rotulo-pequeno">Preso em bens (não é dinheiro disponível)</p><ul className="e129-lista">{x.imobilizado.map(r => <li key={r.rotulo}><span>{r.rotulo}</span><strong>{dinheiroCurto(r.valor)}</strong></li>)}</ul></>}
        {x.exposicao.investido > 0 && <p className="nota">Nas empresas você pôs {dinheiroCurto(x.exposicao.investido)}; a sua parte vale hoje uns {dinheiroCurto(x.exposicao.valor)}{x.exposicao.dividaDasEmpresas ? `, e elas devem ${dinheiroCurto(x.exposicao.dividaDasEmpresas)} (na sua proporção — a dívida é delas, não sua)` : ''}.</p>}
      </details>
    </div>
  );
}
