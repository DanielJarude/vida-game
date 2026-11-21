/**
 * VIDA 33 · O PAINEL DO DONO — o mesmo para o clube de futebol, o time de quadra e a organização de e-sports: os
 * patrocínios (as cotas, a busca, as propostas, a negociação, as metas, o departamento comercial), a camisa e a loja (os
 * produtos, o preço, os canais, a previsão de vendas) e a identidade (escudo, cores, apelido, casa). E o seletor do
 * investimento inicial da fundação.
 */
import { useState, type ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import type { Dono33, OpDono33 } from '../../../motor/v33/dono/dono33';
import { custoDoRebranding33 } from '../../../motor/v33/dono/dono33';
import {
  buscasFeitas33, buscasPorAno33, contratoDaCota33, cotasDe33, cotasDisponiveis33, custoDaBusca33, custoDoDepartamento33, DEPARTAMENTOS33,
  multaDeRompimento33, receitaDePatrocinio33, type Contexto33
} from '../../../motor/v33/dono/patrocinio33';
import { CANAIS33, custoDaCamisa33, custoDoCanal33, custoDoProduto33, nomeDoProduto33, PRECOS33, previsaoDaLoja33, produtosDe33, type Camisa33 } from '../../../motor/v33/dono/loja33';
import type { Identidade33 } from '../../../motor/v33/dono/identidade33';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../apresentar';
import { camisaDaIdentidade33, DesenhoCamisa33, EditorCamisa33 } from './Camisa33';
import { EditorIdentidade33, identidadeInicial33 } from './EditorIdentidade33';
import './dono33.css';

type Agir = (a: Acao) => boolean;
interface Props { vida: Vida; agir: Agir; nome: string; dono: Dono33; ctx: Contexto33; acao: (sub: OpDono33) => Acao; anoInicio: number; abaInicial?: Aba }
type Aba = 'patrocinios' | 'loja' | 'identidade';

export function PainelDono33(p: Props) {
  const [aba, setAba] = useState<Aba>(p.abaInicial ?? 'patrocinios');
  const ABAS: Record<Aba, string> = { patrocinios: 'Patrocínios', loja: 'Camisa e loja', identidade: 'Escudo e identidade' };
  return (
    <section className="dono33" aria-label="Negócios do dono">
      <div className="dono33__abas" role="tablist">
        {(Object.keys(ABAS) as Aba[]).map(x => <button key={x} type="button" role="tab" aria-selected={aba === x} className="chip" aria-pressed={aba === x} onClick={() => setAba(x)}>{ABAS[x]}</button>)}
      </div>
      {aba === 'patrocinios' && <Patrocinios {...p} />}
      {aba === 'loja' && <Loja {...p} />}
      {aba === 'identidade' && <Identidade {...p} />}
    </section>
  );
}

function Patrocinios({ vida, agir, dono, ctx, acao }: Props) {
  const c = dono.comercial33;
  const ano = ctx.ano;
  const A = (sub: Extract<OpDono33, { op: 'comercial' }>['sub']) => acao({ op: 'comercial', sub });
  const disponiveis = cotasDisponiveis33(ctx);
  return (
    <>
      <div className="dono33__resumo">
        <div><span>Patrocínios por ano</span><strong>{dinheiroCurto(receitaDePatrocinio33(c, ano))}</strong></div>
        <div><span>Buscas neste ano</span><strong>{buscasFeitas33(c, ano)} de {buscasPorAno33(c)}</strong></div>
        <div><span>Comercial</span><strong>{DEPARTAMENTOS33[c?.departamento ?? 0]}</strong></div>
      </div>
      <p className="nota">Patrocinador não liga sozinho: busque por cota (cada busca custa {dinheiroCurto(custoDaBusca33(ctx, c))} do caixa), compare as propostas — valem até o fim do ano —, negocie (a marca pode subir o valor ou desistir) e assine. Metas pagam bônus; as "de cláusula" encerram o contrato se falharem. Quanto mais torcida e nome, melhores as propostas.</p>
      <ul className="dono33__cotas">
        {cotasDe33(ctx.tipo).map(def => {
          const livre = disponiveis.some(d => d.id === def.id);
          const k = contratoDaCota33(c, def.id, ano);
          const ofertas = (c?.ofertas ?? []).filter(o => o.cota === def.id && o.ano === ano);
          return (
            <li key={def.id} className={`dono33__cota${k ? ' dono33__cota--fechada' : ''}`}>
              <header><strong>{def.nome}</strong><span className="nota">{def.sobre}</span></header>
              {k ? (
                <>
                  <p className="dono33__contrato"><b>{k.marca}</b> · {dinheiroCurto(k.valor)}/ano · até {k.ate}{k.meta ? ` · meta: ${k.meta.texto}${k.meta.clausula ? ' (cláusula)' : ` (bônus ${dinheiroCurto(k.bonus ?? 0)})`}` : ''}</p>
                  <BotaoAcao vida={vida} agir={agir} acao={A({ acao: 'romper', cota: def.id })} variante="discreto">Romper · multa {dinheiroCurto(multaDeRompimento33(k, ano))}</BotaoAcao>
                </>
              ) : !livre ? <p className="nota">Só com casa própria: amplie {ctx.tipo === 'futebol' ? 'o estádio (nível 3)' : 'o ginásio (nível 3)'}.</p> : (
                <>
                  {ofertas.length > 0 && (
                    <ul className="dono33__ofertas">
                      {ofertas.map(o => (
                        <li key={o.id} className="dono33__oferta">
                          <div><b>{o.marca}</b><span className="nota">{o.setor}{o.renovacao ? ' · renovação' : ''}{o.negociada ? ' · já negociada' : ''}</span></div>
                          <strong>{dinheiroCurto(o.valor)}/ano</strong>
                          <span className="nota">{o.sobre}</span>
                          <div className="dono33__botoes">
                            <BotaoAcao vida={vida} agir={agir} acao={A({ acao: 'aceitar', id: o.id })} variante="principal">Assinar</BotaoAcao>
                            <BotaoAcao vida={vida} agir={agir} acao={A({ acao: 'negociar', id: o.id })} ocultarBloqueado>Pedir mais 15%</BotaoAcao>
                            <BotaoAcao vida={vida} agir={agir} acao={A({ acao: 'recusar', id: o.id })} variante="discreto">Recusar</BotaoAcao>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <BotaoAcao vida={vida} agir={agir} acao={A({ acao: 'buscar', cota: def.id })}>{ofertas.length ? 'Buscar de novo' : 'Buscar patrocinadores'} · {dinheiroCurto(custoDaBusca33(ctx, c))}</BotaoAcao>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <section className="dono33__bloco" aria-label="Departamento comercial">
        <h4>Departamento comercial</h4>
        <div className="dono33__botoes">
          {([0, 1, 2, 3] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={A({ acao: 'departamento', nivel: n })} variante={(c?.departamento ?? 0) === n ? 'principal' : 'secundario'}>{DEPARTAMENTOS33[n]}{n ? ` · ${dinheiroCurto(custoDoDepartamento33(ctx, n))}/ano` : ''}</BotaoAcao>)}
        </div>
        <p className="nota">O departamento custa por ano e trabalha por você: propostas até 21% maiores, mais buscas por ano, renovação oferecida por quem gostou da parceria e uma proposta espontânea por temporada.</p>
      </section>
      {(c?.hist.length ?? 0) > 0 && <details className="dono33__hist"><summary>Contratos assinados e rompidos</summary><ul>{c!.hist.slice(0, 8).map((h, k) => <li key={k}><b>{h.ano}</b> {h.texto}</li>)}</ul></details>}
    </>
  );
}

function Loja({ vida, agir, dono, ctx, acao, nome }: Props) {
  const l = dono.loja33;
  const esports = ctx.tipo === 'esports';
  const [camisa, setCamisa] = useState<Omit<Camisa33, 'ano'>>(() => l?.camisa ?? camisaDaIdentidade33(dono.identidade33, esports));
  const A = (sub: Extract<OpDono33, { op: 'loja' }>['sub']) => acao({ op: 'loja', sub });
  const master = contratoDaCota33(dono.comercial33, 'master', ctx.ano)?.marca;
  const fornecedor = !!contratoDaCota33(dono.comercial33, 'material', ctx.ano);
  const prev = previsaoDaLoja33(ctx, l ?? { produtos: ['camisa'], preco: 1, canal: 0, hist: [] }, fornecedor);
  const produtos = l?.produtos ?? ['camisa'];
  const doAno = l?.camisa?.ano === ctx.ano;
  return (
    <>
      <div className="dono33__camisa-area">
        <DesenhoCamisa33 camisa={camisa} nome={nome} identidade={dono.identidade33} patrocinador={master} tamanho={180} />
        <EditorCamisa33 camisa={camisa} mudar={setCamisa} esports={esports} />
      </div>
      <BotaoAcao vida={vida} agir={agir} acao={A({ acao: 'camisa', camisa })} variante="principal">{doAno ? `Ajustar a camisa de ${ctx.ano}` : `Lançar a camisa de ${ctx.ano} · ${dinheiroCurto(custoDaCamisa33(ctx))}`}</BotaoAcao>
      <p className="nota">{l?.camisa ? (doAno ? 'A camisa do ano está nas lojas: vende 25% a mais.' : `A camisa à venda é a de ${l.camisa.ano}. Uma camisa nova por temporada vende mais.`) : 'Ainda não há uma camisa desenhada por você: a loja vende um modelo genérico (20% a menos).'} {master ? `O master (${master}) aparece no peito.` : 'Sem patrocinador master, o peito fica limpo.'}</p>
      <section className="dono33__bloco" aria-label="Produtos">
        <h4>Produtos na loja</h4>
        <ul className="dono33__produtos">
          {produtosDe33(ctx.tipo).map(pd => {
            const tem = produtos.includes(pd.id);
            return (
              <li key={pd.id} className={tem ? 'dono33__produto dono33__produto--ativo' : 'dono33__produto'}>
                <span>{nomeDoProduto33(ctx.tipo, pd.id)}</span>
                {pd.id === 'camisa' ? <span className="nota">sempre</span>
                  : <BotaoAcao vida={vida} agir={agir} acao={A({ acao: 'produto', produto: pd.id, ligar: !tem })} variante={tem ? 'discreto' : 'secundario'}>{tem ? 'Tirar da loja' : `Lançar · ${dinheiroCurto(custoDoProduto33(ctx))}`}</BotaoAcao>}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="dono33__bloco" aria-label="Preço e canais">
        <h4>Preço</h4>
        <div className="dono33__botoes">{([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={A({ acao: 'preco', nivel: n })} variante={(l?.preco ?? 1) === n ? 'principal' : 'secundario'}>{PRECOS33[n]}</BotaoAcao>)}</div>
        <h4>Onde vender</h4>
        <div className="dono33__botoes">{([0, 1, 2] as const).map(n => <BotaoAcao key={n} vida={vida} agir={agir} acao={A({ acao: 'canal', nivel: n })} variante={(l?.canal ?? 0) === n ? 'principal' : 'secundario'}>{CANAIS33[n]}{n ? ` · ${dinheiroCurto(custoDoCanal33(ctx, n))}/ano` : ''}</BotaoAcao>)}</div>
        <p className="nota">Popular vende mais com margem menor; premium, o contrário. A loja na casa e o licenciamento vendem mais, mas custam por ano (no licenciamento, a rede fica com uma parte).</p>
      </section>
      <div className="dono33__resumo">
        <div><span>Vendas previstas no ano</span><strong>{dinheiroCurto(prev.bruto)}</strong></div>
        <div><span>Fica para o time</span><strong>{dinheiroCurto(prev.liquido)}</strong><small>margem de {Math.round(prev.margem * 100)}%</small></div>
        <div><span>Fabricação</span><strong>{fornecedor ? 'Fornecedor' : 'Própria'}</strong><small>{fornecedor ? 'royalties, sem encalhe' : 'margem maior; ano ruim deixa encalhe'}</small></div>
      </div>
      {(l?.hist.length ?? 0) > 0 && <p className="nota">Anos anteriores: {l!.hist.slice(-4).reverse().map(h => `${h.ano}: ${dinheiroCurto(h.bruto)} vendidos${h.encalhe ? ' (encalhe)' : ''}`).join(' · ')}.</p>}
    </>
  );
}

function Identidade({ vida, agir, dono, ctx, acao, nome, anoInicio }: Props) {
  const [ident, setIdent] = useState<Identidade33>(() => dono.identidade33 ?? identidadeInicial33(nome, ctx.tipo === 'esports'));
  const livre = !dono.identidade33 || ctx.ano <= anoInicio;
  return (
    <>
      <EditorIdentidade33 nome={nome} ident={ident} mudar={setIdent} tipo={ctx.tipo} />
      <BotaoAcao vida={vida} agir={agir} acao={acao({ op: 'identidade', identidade: ident })} variante="principal">{livre ? 'Salvar a identidade' : `Fazer o rebranding · ${dinheiroCurto(custoDoRebranding33(ctx))}`}</BotaoAcao>
      <p className="nota">{livre ? 'No primeiro ano, mudar o escudo e as cores é de graça.' : 'Depois do primeiro ano, mudar a identidade é um rebranding: custa e parte da torcida estranha.'}</p>
    </>
  );
}

/* ------------------------------------------------------------------ o investimento da fundação */

const DEGRAUS = [0, 50e3, 100e3, 250e3, 500e3, 1e6, 2.5e6, 5e6, 10e6, 25e6, 50e6, 100e6, 250e6, 500e6];
export type Foco33 = 'elenco' | 'equilibrado' | 'estrutura';
export function Investimento33({ valor, mudar, conta, base, foco, mudarFoco, children }: { valor: number; mudar: (v: number) => void; conta: number; base: number; foco?: Foco33; mudarFoco?: (f: Foco33) => void; children?: ReactNode }) {
  const degraus = DEGRAUS.filter(d => d === 0 || d + base <= Math.max(conta, base));
  const i = Math.max(0, degraus.findIndex(d => d >= valor));
  return (
    <fieldset className="dono33__campo dono33__investimento"><legend>Investimento inicial</legend>
      <input type="range" min={0} max={Math.max(0, degraus.length - 1)} step={1} value={i} onChange={e => mudar(degraus[Number(e.target.value)] ?? 0)} aria-label="Investimento inicial" aria-valuetext={dinheiroCurto(degraus[i] ?? 0)} />
      <div className="dono33__linha"><strong>{valor ? `+ ${dinheiroCurto(valor)}` : 'O mínimo'}</strong><span className="nota">{valor ? 'além do custo de fundar' : 'só o custo de fundar'}{degraus.length < DEGRAUS.length ? ` · o teto é o que há na conta` : ''}</span></div>
      {mudarFoco && (
        <div className="dono33__fichas" role="group" aria-label="Onde investir">
          {(['elenco', 'equilibrado', 'estrutura'] as const).map(f => <button key={f} type="button" className="chip" aria-pressed={foco === f} onClick={() => mudarFoco(f)}>{{ elenco: 'Tudo no elenco', equilibrado: 'Elenco e estrutura', estrutura: 'Estrutura primeiro' }[f]}</button>)}
        </div>
      )}
      {children}
    </fieldset>
  );
}
