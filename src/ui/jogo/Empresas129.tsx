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
import type { CargoExecutivo, DecisaoDaEmpresa13, Empresa, PerfilExecutivo, ProjetoDaEmpresa, TipoEmpresa, Vida } from '../../motor/tipos';
import { anoDe } from '../../motor/tempo';
import {
  alavancasDe, aportesPossiveis, cargosPossiveis, catalogoDeProdutos13, catalogoPequeno13, custoEmpresa129, decisoesRecentes13, ehGrande, leituraDaAceitacao, leituraDaLinha13, NOME_PORTE, opcaoAtual,
  ofertasDeAquisicao, painelDaEmpresa, planoDeFundacao, precoDaFatia129, projetosPossiveis, setoresAoAlcance
} from '../../motor/sistemas/empresas129';
import { IndicadoresEmpresa14 } from '../v14/empresas/IndicadoresEmpresa14';
import { NOME_POSICAO_13, POSICOES_13, produtosDoSetor13 } from '../../motor/sistemas/empresas13';
import { indicadores, NOME_ESCALA } from '../../motor/sistemas/fortuna129';
import { DESCRICAO_PERFIL, NOME_CARGO, NOME_PERFIL, setorGrande } from '../../motor/dados/empresas129';
import { BotaoAcao, navegarAbas } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import { Evolucao } from './material/Desenhos';
import '../empresas129.css';

type Agir = (a: Acao) => boolean;
const PERFIS: PerfilExecutivo[] = ['conservador', 'agressivo', 'inovador', 'expansao', 'eficiencia', 'financas'];
const sinal = (x: number) => `${x < 0 ? '− ' : ''}${dinheiroCurto(Math.abs(x))}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ================================================================ O painel de uma empresa */

type FazerAcao = (o: Extract<Acao, { tipo: 'empresa129' }>['oque'], alvo?: string) => Acao;

export function PainelDaEmpresa129({ vida, agir, e }: { vida: Vida; agir: Agir; e: Empresa }) {
  const p = painelDaEmpresa(vida, e);
  const manda = e.papel !== 'investidor' && e.estado !== 'encerrada';
  const a: FazerAcao = (oque, alvo) => ({ tipo: 'empresa129', empresaId: e.id, oque, ...(alvo !== undefined ? { alvo } : {}) });
  const recentes = decisoesRecentes13(vida, e);
  const vivos = p.projetos.filter(x => x.p.estado === 'ativo' || x.p.estado === 'desenvolvimento');
  const encerrados = p.projetos.filter(x => x.p.estado !== 'ativo' && x.p.estado !== 'desenvolvimento');
  return (
    <div className="e129">
      <section className="e13-bloco" aria-labelledby={`e13-numeros-${e.id}`}>
        <h4 className="e13-titulo" id={`e13-numeros-${e.id}`}>Como a empresa está</h4>
        {/* VIDA 14: os números em grupos (o que é seu, o ano, o balanço, a operação). A pequena já os mostra no cartão. */}
        {p.grande && <IndicadoresEmpresa14 vida={vida} e={e} />}
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
      </section>

      {manda && recentes.length > 0 && <DecisoesRecentes vida={vida} decisoes={recentes} />}

      {(vivos.length > 0 || encerrados.length > 0) && (
        <section className="e13-bloco" aria-labelledby={`e13-linhas-${e.id}`}>
          <h4 className="e13-titulo" id={`e13-linhas-${e.id}`}>{p.grande ? 'Produtos e linhas' : 'Produtos e serviços novos'}</h4>
          <p className="nota e13-descricao">{p.grande ? 'O que a empresa vende e o que está sendo desenvolvido. Em cada linha à venda dá para expandir, lançar versão nova, investir em qualidade, reposicionar, mudar o preço ou descontinuar.' : 'O que a casa lançou além do de sempre.'}</p>
          <ul className="e129-projetos">
            {vivos.map(({ p: pj, progresso, descricao }) => <LinhaDaEmpresa key={pj.id} vida={vida} agir={agir} e={e} pj={pj} progresso={progresso} descricao={descricao} grande={p.grande} manda={manda} a={a} />)}
          </ul>
          {encerrados.length > 0 && (
            <details className="detalhes"><summary>{`Fora de linha ou fracassados (${encerrados.length})`}</summary>
              <ul className="e129-projetos">{encerrados.map(({ p: pj }) => <li key={pj.id} className={`e129-projeto e129-projeto--${pj.estado}`}><p className="e129-projeto__nome"><strong>{pj.nome}</strong> <span className="nota">{pj.estado === 'fracassado' ? 'fracassou' : 'fora de linha'}</span></p></li>)}</ul>
            </details>
          )}
        </section>
      )}
      {manda && <Decidir vida={vida} agir={agir} e={e} grande={p.grande} delegado={p.delegado} a={a} />}
      <Diretoria vida={vida} agir={agir} e={e} manda={manda} diretoria={p.diretoria} a={a} />
    </div>
  );
}

/** O que foi decidido há pouco: o que, quanto custou e de onde saiu, o que mudou na hora, o que se espera e o que já aconteceu. */
function DecisoesRecentes({ vida, decisoes }: { vida: Vida; decisoes: DecisaoDaEmpresa13[] }) {
  return (
    <section className="e13-bloco e13-decisoes" aria-label="Decisões recentes">
      <h4 className="e13-titulo">O que você decidiu</h4>
      <ol className="e13-decisoes__lista">
        {decisoes.slice(0, 5).map((d, k) => (
          <li key={`${d.t}-${k}`} className="e13-decisao">
            <p className="e13-decisao__cabeca"><strong>{d.titulo}</strong> <span className="e129-selo">{d.t === vida.t ? 'este ano' : anoDe(d.t)}</span></p>
            {d.custo > 0 && <p className="e13-decisao__custo">Custo: <strong>{dinheiroCurto(d.custo)}</strong>{d.pago ? ` — ${[d.pago.caixa && `${dinheiroCurto(d.pago.caixa)} do caixa da empresa`, d.pago.credito && `${dinheiroCurto(d.pago.credito)} de crédito`, d.pago.conta && `${dinheiroCurto(d.pago.conta)} da sua conta`].filter(Boolean).join(', ') || 'a pagar ao longo dos meses'}` : ''}</p>}
            {d.mudou.length > 0 && <ul className="e13-decisao__mudou" aria-label="O que mudou na hora">{d.mudou.map(m => <li key={m}>{m}</li>)}</ul>}
            <p className="nota">{d.esperado}</p>
            <p className={`nota e13-decisao__depois${d.ocorreu ? ' e13-decisao__depois--feito' : ''}`}>{d.ocorreu ? `O que aconteceu: ${d.ocorreu}` : 'O efeito nas vendas aparece no fechamento do ano.'}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Uma linha (um projeto): o que é, como vai, e — se manda — as decisões dela. */
function LinhaDaEmpresa({ vida, agir, e, pj, progresso, descricao, grande, manda, a }: { vida: Vida; agir: Agir; e: Empresa; pj: ProjetoDaEmpresa; progresso: number; descricao?: string; grande: boolean; manda: boolean; a: FazerAcao }) {
  const l = pj.estado === 'ativo' ? leituraDaLinha13(vida, e, pj) : undefined;
  const ativo = pj.estado === 'ativo';
  return (
    <li className={`e129-projeto e129-projeto--${pj.estado}`}>
      <p className="e129-projeto__nome"><strong>{pj.nome}</strong>{l && <span className="e13-chip">{l.produto}</span>} <span className="nota">{pj.estado === 'desenvolvimento' ? `em desenvolvimento · ${Math.round(progresso * 100)}% · ${dinheiroCurto(pj.investido)} de ${dinheiroCurto(pj.orcamento)}` : `à venda desde ${anoDe(pj.tLanc ?? vida.t)} · o mercado recebeu ${leituraDaAceitacao(pj.aceitacao ?? 50)}${pj.receitaAno ? ` · vendeu ${dinheiroCurto(pj.receitaAno)} no ano` : ''}`}</span></p>
      {pj.estado === 'desenvolvimento' && <div className="e129-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso * 100)} aria-label={`Andamento de ${pj.nome}`}><span style={{ width: `${Math.round(progresso * 100)}%` }} /></div>}
      {l && (
        <dl className="e13-ficha e13-ficha--linha">
          <div><dt>Posicionamento</dt><dd>{cap(NOME_POSICAO_13[l.pos])}</dd></div>
          <div><dt>Preço</dt><dd>{cap(l.precoTexto)}</dd></div>
          <div><dt>Qualidade</dt><dd>{cap(l.qualidadeTexto)}</dd></div>
          <div><dt>Versão</dt><dd>{l.versao}ª{l.anosDaVersao ? ` · há ${l.anosDaVersao} ${l.anosDaVersao > 1 ? 'anos' : 'ano'}` : ''}{l.envelhece < 0.97 ? ' · envelhecendo' : ''}</dd></div>
          <div><dt>Margem</dt><dd>{Math.round(l.margem * 100)}%</dd></div>
          {l.fatia !== undefined && <div><dt>Fatia do mercado</dt><dd>{(l.fatia * 100).toFixed(l.fatia < 0.01 ? 2 : 1).replace('.', ',')}%</dd></div>}
        </dl>
      )}
      {descricao && !l && <p className="nota">{descricao}</p>}
      {pj.marcos && pj.marcos.length > 1 && <p className="nota">{pj.marcos.slice(-2).map(m => `${anoDe(m.t)}: ${m.texto}`).join(' · ')}</p>}
      {manda && (
        <div className="e13-linha-acoes">
          {ativo && grande && l && (
            <>
              <div className="grupo-acoes grupo-acoes--linha e13-acoes">
                <BotaoAcao vida={vida} acao={a('ampliar', pj.id)} agir={agir} variante="discreto">{`Expandir a produção (${dinheiroCurto(custoEmpresa129(vida, e, 'ampliar', pj.id))})`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={a('melhorar', pj.id)} agir={agir} variante="discreto">{`Lançar versão nova (${dinheiroCurto(custoEmpresa129(vida, e, 'melhorar', pj.id))})`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={a('qualidade', pj.id)} agir={agir} variante="discreto">{`Investir em qualidade (${dinheiroCurto(custoEmpresa129(vida, e, 'qualidade', pj.id))})`}</BotaoAcao>
              </div>
              <Escolha vida={vida} agir={agir} rotulo="Reposicionar" atual={l.pos}
                opcoes={POSICOES_13.map(x => ({ id: x, rotulo: cap(NOME_POSICAO_13[x]), acao: a('reposicionar', `${pj.id}:${x}`), custo: x === l.pos ? 0 : custoEmpresa129(vida, e, 'reposicionar', `${pj.id}:${x}`), dica: x === l.posNascenca ? 'O posicionamento de nascença deste produto.' : x === 'premium' ? 'Preço uns 20% acima, um quarto menos de volume. Pede marca forte ou qualidade.' : x === 'popular' ? 'Preço uns 15% abaixo, um quinto a mais de volume, margem menor.' : 'O meio do mercado.' }))} />
              <Escolha vida={vida} agir={agir} rotulo={`Preço · hoje, ${l.precoTexto}`} atual=""
                opcoes={[{ id: '-', rotulo: 'Baixar 10%', acao: a('preco', `${pj.id}:-`), custo: 0, dica: 'Vende mais e ganha menos em cada venda.' }, { id: '+', rotulo: 'Subir 10%', acao: a('preco', `${pj.id}:+`), custo: 0, dica: 'Ganha mais em cada venda; vende menos (quanto, depende do público).' }]} />
            </>
          )}
          {ativo && !grande && <div className="grupo-acoes grupo-acoes--linha e13-acoes"><BotaoAcao vida={vida} acao={a('melhorar', pj.id)} agir={agir} variante="discreto" ocultarImpossivel>{`Renovar (${dinheiroCurto(custoEmpresa129(vida, e, 'melhorar', pj.id))})`}</BotaoAcao></div>}
          <div className="e13-perigo">
            <BotaoAcao vida={vida} acao={a('descontinuar', pj.id)} agir={agir} variante="discreto">{ativo ? 'Descontinuar esta linha' : 'Cancelar o desenvolvimento'}</BotaoAcao>
          </div>
        </div>
      )}
    </li>
  );
}

/** Uma escolha entre opções (cara de controle: a atual marcada; a indisponível diz por quê; o custo antes). */
function Escolha({ vida, agir, rotulo, atual, opcoes }: { vida: Vida; agir: Agir; rotulo: string; atual: string; opcoes: { id: string; rotulo: string; acao: Acao; custo: number; dica: string }[] }) {
  const [dica, setDica] = useState<string | undefined>();
  const motivos = opcoes.map(o => (o.id === atual ? undefined : disponibilidade(vida, o.acao))).map(d => (d && !podeTentar(d) ? d.motivo : undefined));
  const bloqueio = [...new Set(motivos.filter((m): m is string => !!m))];
  return (
    <div className="e129-alavanca">
      <p className="e129-alavanca__rotulo">{rotulo}</p>
      <div className="e129-opcoes" role={atual ? 'radiogroup' : 'group'} aria-label={rotulo}>
        {opcoes.map((o, k) => {
          const sel = o.id === atual;
          const pode = !motivos[k];
          return (
            <button key={o.id} type="button" {...(atual ? { role: 'radio', 'aria-checked': sel } : {})} className={`e129-opcao${sel ? ' e129-opcao--atual' : ''}`} aria-disabled={!sel && !pode} title={pode ? o.dica : motivos[k]}
              onMouseEnter={() => setDica(sel ? o.dica : pode ? o.dica : motivos[k])} onFocus={() => setDica(sel ? o.dica : pode ? o.dica : motivos[k])}
              onClick={() => { if (sel) return; if (!pode) { setDica(motivos[k]); return; } setDica(agir(o.acao) ? undefined : motivos[k]); }}>
              <span>{o.rotulo}</span>{o.custo > 0 && !sel && <small>{dinheiroCurto(o.custo)}</small>}
            </button>
          );
        })}
      </div>
      <p className="nota e129-alavanca__dica">{dica ?? (bloqueio.length ? `Indisponível agora: ${bloqueio.join(' ')}` : opcoes.find(o => o.id === atual)?.dica ?? '')}</p>
    </div>
  );
}

const ABAS_GRANDE = [['lancar', 'Lançar produto'], ['mercado', 'Mercado e operação'], ['crescer', 'Crescer e financiar'], ['capital', 'Lucro e capital']] as const;
const ABAS_PEQUENA = [['lancar', 'Lançar'], ['mercado', 'Estratégia'], ['capital', 'Capital']] as const;
type Aba = (typeof ABAS_GRANDE)[number][0];

function Decidir({ vida, agir, e, grande, delegado, a }: { vida: Vida; agir: Agir; e: Empresa; grande: boolean; delegado: boolean; a: FazerAcao }) {
  const [aba, setAba] = useState<Aba>('lancar');
  const alavancas = alavancasDe(e);
  const grupos = [...new Set(alavancas.map(x => x.grupo))];
  const s = setorGrande(e.tipo);
  const abas = grande ? ABAS_GRANDE : ABAS_PEQUENA;
  const idBase = `e13-decidir-${e.id}`;
  return (
    <section className="e13-bloco e13-decidir" aria-labelledby={`${idBase}-titulo`}>
      <h4 className="e13-titulo" id={`${idBase}-titulo`}>Decisões de {e.nome}</h4>
      <p className="nota e13-descricao">{delegado ? `${e.gestao.nome ?? 'A gestão'} decide no dia a dia (com o juízo e o viés de quem está lá); o que você mudar aqui, a gestão respeita por dois anos.` : 'Você decide a estratégia; a gestão executa. Cada escolha diz o custo antes e mostra o que mudou depois.'}</p>
      {e.gestao.quem === 'contratada' && (
        <div className="e129-delegar">
          <BotaoAcao vida={vida} acao={a('delegar', delegado ? 'nao' : 'sim')} agir={agir} variante="discreto">{delegado ? `Decidir eu mesm${vida.eu.genero === 'feminino' ? 'a' : 'o'}` : 'Delegar a estratégia à gestão'}</BotaoAcao>
        </div>
      )}
      <div className="e13-abas" role="tablist" aria-label={`Decisões de ${e.nome}`} onKeyDown={navegarAbas}>
        {abas.map(([id, rot]) => <button key={id} type="button" role="tab" id={`${idBase}-aba-${id}`} aria-selected={aba === id} aria-controls={`${idBase}-painel`} tabIndex={aba === id ? 0 : -1} className={`e13-aba${aba === id ? ' e13-aba--atual' : ''}`} onClick={() => setAba(id)}>{rot}</button>)}
      </div>
      <div className="e13-painel" role="tabpanel" id={`${idBase}-painel`} aria-labelledby={`${idBase}-aba-${aba}`}>
        {aba === 'lancar' && (grande && s ? <CatalogoGrande vida={vida} agir={agir} e={e} a={a} unidade={s.unidade[0]} /> : <CatalogoPequeno vida={vida} agir={agir} e={e} a={a} />)}
        {aba === 'mercado' && grupos.filter(g => g !== 'Finanças').map(g => (
          <section key={g} className="e129-grupo" aria-label={g}>
            <h5 className="e13-subtitulo">{g}</h5>
            {alavancas.filter(x => x.grupo === g).map(al => <Alavanca key={al.id} vida={vida} agir={agir} e={e} id={al.id} rotulo={al.rotulo} opcoes={al.opcoes} atual={opcaoAtual(e, al).id} a={a} />)}
          </section>
        ))}
        {aba === 'crescer' && grande && s && (
          <>
            <section className="e129-grupo" aria-label="Crescer">
              <h5 className="e13-subtitulo">Crescer</h5>
              <p className="nota">Uma {s.unidade[0]} sem produto é capacidade parada: para dizer o que ela vai produzir, use "Lançar produto".</p>
              <div className="grupo-acoes">
                <BotaoAcao vida={vida} acao={a('capacidade')} agir={agir} variante="discreto">{`Mais uma ${s.unidade[0]}, sem produto definido (${dinheiroCurto(custoEmpresa129(vida, e, 'capacidade'))}, ${s.mesesCapacidade} meses)`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={a('concorrente')} agir={agir} variante="discreto">{`Comprar uma concorrente (${dinheiroCurto(custoEmpresa129(vida, e, 'concorrente'))})`}</BotaoAcao>
              </div>
              {(e.corp?.rivais?.length ?? 0) > 0 && <p className="nota">Concorrentes de {e.nome} hoje: {e.corp!.rivais!.join(', ')}.{e.corp?.aquisicoes?.length ? ` Já comprou: ${e.corp.aquisicoes.join(', ')}.` : ''}</p>}
            </section>
            <section className="e129-grupo" aria-label="Financiar">
              <h5 className="e13-subtitulo">Financiar</h5>
              {alavancas.filter(x => x.grupo === 'Finanças').map(al => <Alavanca key={al.id} vida={vida} agir={agir} e={e} id={al.id} rotulo={al.rotulo} opcoes={al.opcoes} atual={opcaoAtual(e, al).id} a={a} />)}
              <div className="grupo-acoes">
                <BotaoAcao vida={vida} acao={a('captar')} agir={agir} variante="discreto">{`Tomar crédito para a empresa (${dinheiroCurto(custoEmpresa129(vida, e, 'captar'))})`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={a('amortizar')} agir={agir} variante="discreto">{`Pagar dívida com o caixa (${dinheiroCurto(custoEmpresa129(vida, e, 'amortizar'))})`}</BotaoAcao>
                <BotaoAcao vida={vida} acao={a('investidores')} agir={agir} variante="discreto">Trazer investidores (a sua parte dilui)</BotaoAcao>
              </div>
            </section>
          </>
        )}
        {aba === 'capital' && (
          <>
            {grande && (
              <section className="e129-grupo" aria-label="O lucro">
                <h5 className="e13-subtitulo">O lucro</h5>
                <p className="nota">{e.distribuir ? 'Hoje: o que passa de uma reserva vira dividendo (a sua parte cai na sua conta).' : 'Hoje: o lucro fica na empresa — caixa para os projetos e para atravessar crise.'}</p>
                <Escolha vida={vida} agir={agir} rotulo="Destino do lucro" atual={e.distribuir ? 'distribuir' : 'reinvestir'}
                  opcoes={[{ id: 'distribuir', rotulo: 'Distribuir dividendos', acao: { tipo: 'empresa', empresaId: e.id, decisao: 'distribuir' }, custo: 0, dica: 'O que passa da reserva vai aos donos.' }, { id: 'reinvestir', rotulo: 'Reinvestir tudo', acao: { tipo: 'empresa', empresaId: e.id, decisao: 'reinvestir' }, custo: 0, dica: 'O lucro fica no caixa da empresa.' }]} />
              </section>
            )}
            <section className="e129-grupo" aria-label="Pôr dinheiro">
              <h5 className="e13-subtitulo">Pôr dinheiro seu</h5>
              <p className="nota">Sai da sua conta e entra no caixa da empresa: aumenta a sua exposição.</p>
              <div className="grupo-acoes grupo-acoes--linha">
                {aportesPossiveis(vida, e).map(x => <BotaoAcao key={x} vida={vida} acao={a('aportar', String(x))} agir={agir} variante="discreto">{`Aportar ${dinheiroCurto(x)}`}</BotaoAcao>)}
              </div>
            </section>
          </>
        )}
      </div>
    </section>
  );
}

/** O catálogo do ramo: famílias, produtos (selecionáveis) e a ficha completa do escolhido — com os dois jeitos de lançar. */
function CatalogoGrande({ vida, agir, e, a, unidade }: { vida: Vida; agir: Agir; e: Empresa; a: FazerAcao; unidade: string }) {
  const cat = catalogoDeProdutos13(vida, e);
  const todos = cat.flatMap(g => g.produtos);
  const [sel, setSel] = useState<string>(() => todos.find(x => !x.jaTem && !x.requer)?.id ?? todos[0]?.id ?? '');
  const f = todos.find(x => x.id === sel);
  return (
    <div className="e13-catalogo">
      <p className="nota">Escolha o que produzir. Cada produto tem investimento, prazo, público, concorrência e margem próprios; lançar com a capacidade que sobra é mais barato, e uma {unidade} nova resolve quando não sobra.</p>
      {cat.map(g => (
        <fieldset key={g.familia} className="e13-familia">
          <legend className="e13-subtitulo">{g.familia}</legend>
          <div className="e13-produtos">
            {g.produtos.map(x => (
              <button key={x.id} type="button" className={`e13-produto${x.id === sel ? ' e13-produto--sel' : ''}`} aria-pressed={x.id === sel} onClick={() => setSel(x.id)}>
                <span className="e13-produto__nome">{x.nome}</span>
                <span className="e13-produto__meta">{dinheiroCurto(x.investimento)} · {x.meses} meses{x.jaTem ? ' · já tem' : ''}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {f && (
        <div className="e13-escolhido" aria-live="polite">
          <h5 className="e13-subtitulo">{f.nome}</h5>
          <p className="nota">{f.descricao}{f.requer ? ` Precisa antes de ${f.requer.charAt(0).toLowerCase()}${f.requer.slice(1)} pronto.` : ''}</p>
          <dl className="e13-ficha">
            <div><dt>Investimento</dt><dd>{dinheiroCurto(f.investimento)}</dd></div>
            <div><dt>Prazo até vender</dt><dd>{f.meses} meses</dd></div>
            <div><dt>Capacidade que ocupa</dt><dd>{String(Math.round(f.capacidade * 100) / 100).replace('.', ',')} {unidade}</dd></div>
            <div><dt>Faturamento maduro</dt><dd>{dinheiroCurto(f.faturamento)}/ano</dd></div>
            <div><dt>Custos (maduro)</dt><dd>{dinheiroCurto(f.custoAnual)}/ano</dd></div>
            <div><dt>Margem</dt><dd>{Math.round(f.margem * 100)}%</dd></div>
            <div><dt>Público</dt><dd>{cap(f.publico)}</dd></div>
            <div><dt>Posicionamento</dt><dd>{cap(f.posicionamento)}</dd></div>
            <div><dt>Preço</dt><dd>{cap(f.preco)}</dd></div>
            <div><dt>Concorrência</dt><dd>{cap(f.concorrencia)}{f.rivais.length ? ` (${f.rivais.join(', ')})` : ''}</dd></div>
            <div><dt>Mercado</dt><dd>{dinheiroCurto(f.mercado)}/ano · {f.potencial}</dd></div>
            <div><dt>Risco</dt><dd>{cap(f.risco)}</dd></div>
          </dl>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={a('projeto', f.id)} agir={agir} variante="secundario">{`Lançar com a capacidade que sobra (${dinheiroCurto(f.investimento)})`}</BotaoAcao>
            <BotaoAcao vida={vida} acao={a('linha', f.id)} agir={agir} variante="secundario">{`${f.unidadesLinha > 1 ? `${f.unidadesLinha} ${unidade}s novas` : `Nova ${unidade}`} para este produto (${dinheiroCurto(f.custoLinha)})`}</BotaoAcao>
          </div>
        </div>
      )}
    </div>
  );
}

function CatalogoPequeno({ vida, agir, e, a }: { vida: Vida; agir: Agir; e: Empresa; a: FazerAcao }) {
  const cat = catalogoPequeno13(vida, e);
  const outros = projetosPossiveis(vida, e).filter(x => !cat.some(c => c.id === x.id));
  const [sel, setSel] = useState<string>(() => cat.find(x => !x.jaTem)?.id ?? cat[0]?.id ?? '');
  const f = cat.find(x => x.id === sel);
  if (!cat.length && !outros.length) return <p className="nota">Esta casa não lança produtos: o que muda o público é o acervo, os recintos e o que se decide no painel do ramo.</p>;
  return (
    <div className="e13-catalogo">
      {cat.length > 0 && (
        <fieldset className="e13-familia">
          <legend className="e13-subtitulo">Produtos e serviços</legend>
          <div className="e13-produtos">
            {cat.map(x => (
              <button key={x.id} type="button" className={`e13-produto${x.id === sel ? ' e13-produto--sel' : ''}`} aria-pressed={x.id === sel} onClick={() => setSel(x.id)}>
                <span className="e13-produto__nome">{x.nome}</span>
                <span className="e13-produto__meta">{dinheiroCurto(x.custo)} · {x.meses} meses{x.jaTem ? ' · já tem' : ''}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {f && (
        <div className="e13-escolhido" aria-live="polite">
          <h5 className="e13-subtitulo">{f.nome}</h5>
          <p className="nota">{f.descricao}</p>
          <dl className="e13-ficha">
            <div><dt>Investimento</dt><dd>{dinheiroCurto(f.custo)}</dd></div>
            <div><dt>Prazo</dt><dd>{f.meses} meses</dd></div>
            <div><dt>Se pegar, a procura sobe</dt><dd>até {Math.round(f.ganho * 100)}%</dd></div>
            <div><dt>Custo de cada venda</dt><dd>{f.variavel > 1.001 ? `+${Math.round((f.variavel - 1) * 100)}%` : f.variavel < 0.999 ? `−${Math.round((1 - f.variavel) * 100)}%` : 'o mesmo'}</dd></div>
            <div><dt>Público</dt><dd>{cap(f.publico)}</dd></div>
            <div><dt>Posicionamento</dt><dd>{cap(f.posicionamento)}</dd></div>
            <div><dt>Concorrência</dt><dd>{cap(f.concorrencia)}</dd></div>
            <div><dt>Mercado</dt><dd>{cap(f.potencial)}</dd></div>
            <div><dt>Risco</dt><dd>O público pode não gostar: aí, foi dinheiro perdido</dd></div>
          </dl>
          <div className="grupo-acoes grupo-acoes--linha">
            <BotaoAcao vida={vida} acao={a('projeto', f.id)} agir={agir} variante="secundario">{`Lançar (${dinheiroCurto(f.custo)})`}</BotaoAcao>
          </div>
        </div>
      )}
      {outros.length > 0 && (
        <section className="e129-grupo" aria-label="Canais">
          <h5 className="e13-subtitulo">Canais</h5>
          <ul className="e129-lancar">
            {outros.map(x => (
              <li key={x.id}>
                <BotaoAcao vida={vida} acao={a('projeto', x.id)} agir={agir} variante="discreto">{`${x.nome} (${dinheiroCurto(x.custo)})`}</BotaoAcao>
                <p className="nota">{x.descricao} Uns {x.meses} meses até ficar pronto.</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Alavanca({ vida, agir, e, id, rotulo, opcoes, atual, a }: { vida: Vida; agir: Agir; e: Empresa; id: string; rotulo: string; opcoes: { id: string; rotulo: string; descricao: string }[]; atual: string; a: FazerAcao }) {
  return <Escolha vida={vida} agir={agir} rotulo={rotulo} atual={atual} opcoes={opcoes.map(o => ({ id: o.id, rotulo: o.rotulo, acao: a('alavanca', `${id}:${o.id}`), custo: custoEmpresa129(vida, e, 'alavanca', `${id}:${o.id}`), dica: o.descricao }))} />;
}

function Diretoria({ vida, agir, e, manda, diretoria, a }: { vida: Vida; agir: Agir; e: Empresa; manda: boolean; diretoria: ReturnType<typeof painelDaEmpresa>['diretoria']; a: FazerAcao }) {
  const [perfil, setPerfil] = useState<PerfilExecutivo>('conservador');
  const cargos = cargosPossiveis(e);
  return (
    <section className="e13-bloco" aria-labelledby={`e13-diretoria-${e.id}`}>
      <h4 className="e13-titulo" id={`e13-diretoria-${e.id}`}>{ehGrande(e) ? 'A diretoria' : 'A gestão'}</h4>
      <ul className="e129-diretoria">
        {diretoria.map(d => (
          <li key={d.cargo}>
            <span><strong>{NOME_CARGO[d.cargo]}:</strong> {d.nome}{d.perfil ? ` — perfil ${NOME_PERFIL[d.perfil]}` : ''} <span className="nota">· até aqui, {d.leitura}{d.salario ? ` · ${dinheiroCurto(d.salario)}/mês` : ''}</span></span>
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
    </section>
  );
}

/* ================================================================ Fundar e comprar */

export function FundarOuAdquirir129({ vida, agir }: { vida: Vida; agir: Agir }) {
  const ramos = setoresAoAlcance(vida);
  const perto = ramos.filter(x => x.perto);
  const [setor, setSetor] = useState<TipoEmpresa | undefined>(perto[0]?.s.id);
  const s = setor ? setorGrande(setor) : undefined;
  const [item, setItem] = useState<string>(s ? produtosDoSetor13(s.id)[0]?.id ?? s.itens[0].id : '');
  const plano = s ? planoDeFundacao(vida, s.id, item, false) : undefined;
  const ofertas = ofertasDeAquisicao(vida);
  const longe = ramos.filter(x => !x.perto).sort((a, b) => a.minimo - b.minimo);
  return (
    <div className="e129-fundar">
      <h3 className="subtitulo">Empresas médias, grandes e bilionárias</h3>
      <p className="nota">Não é a loja da esquina: é capacidade (fábrica, frota, plataforma) e projetos que gastam por anos antes de vender. O valor da empresa não é dinheiro seu; o que você põe é exposição.</p>
      {perto.length > 0 ? (
        <>
          <label className="campo"><span className="campo__rotulo">Ramo</span>
            <select value={setor} onChange={ev => { const x = ev.target.value as TipoEmpresa; setSetor(x); setItem(produtosDoSetor13(x)[0]?.id ?? setorGrande(x)!.itens[0].id); }}>
              {perto.map(x => <option key={x.s.id} value={x.s.id}>{x.s.rotulo} ({NOME_PORTE[x.s.porte]})</option>)}
            </select>
          </label>
          {s && <p className="nota">{s.descricao}</p>}
          {s && (
            <label className="campo"><span className="campo__rotulo">Primeiro produto</span>
              <select value={item} onChange={ev => setItem(ev.target.value)}>
                {[...new Set(produtosDoSetor13(s.id).map(x => x.familia))].map(fam => (
                  <optgroup key={fam} label={fam}>
                    {produtosDoSetor13(s.id).filter(x => x.familia === fam && !s.itens.find(i => i.id === x.item)?.requer).map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
                  </optgroup>
                ))}
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
                <p className="nota">Faturou {dinheiroCurto(o.receita)} e {o.lucro >= 0 ? `lucrou ${dinheiroCurto(o.lucro)}` : `perdeu ${dinheiroCurto(-o.lucro)}`} no último ano · dívida de {dinheiroCurto(o.divida)} · {o.linhas.join(', ')}. {o.nota} A empresa toda vale uns {dinheiroCurto(o.preco)}. Quem vende: {o.vendedor}.</p>
                <div className="grupo-acoes grupo-acoes--linha">
                  {o.partes.map(parte => <BotaoAcao key={parte} vida={vida} acao={{ tipo: 'adquirir129', ofertaId: o.id, parte }} agir={agir} variante={parte === 1 ? 'secundario' : 'discreto'}>{parte === 1 ? `Comprar o controle (${dinheiroCurto(o.preco)})` : `Comprar ${Math.round(parte * 100)}% (${dinheiroCurto(precoDaFatia129(o.preco, parte))})`}</BotaoAcao>)}
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
