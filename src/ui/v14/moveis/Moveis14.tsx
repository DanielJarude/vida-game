/**
 * VIDA 14 · os móveis na tela: o encaixe no cartão da loja (a área, cabe ou não, a PRÉVIA no cômodo), os conjuntos por
 * estilo, o espaço da casa e o depósito (guardar, retirar, trocar) e a mobília das ofertas da imobiliária. Lido de
 * `motor/v14/moveis` — a tela não faz conta.
 */
import { useState } from 'react';
import type { Vida } from '../../../motor/tipos';
import type { Acao } from '../../../motor/acoes';
import type { OfertaImovel } from '../../../motor/sistemas/mercado';
import { BotaoAcao } from '../../comum';
import { dinheiroCurto } from '../../leituraMaterial';
import { coisa } from '../../../motor/dados/coisas';
import { CONJUNTOS, ESTILOS, NOME_DA_CENA, NOME_DA_MOBILIA } from '../../../motor/dados14/moveis/catalogo';
import { encaixe14, leituraMoveis14, mobiliaDaOferta14, precoDoConjunto14 } from '../../../motor/v14/moveis/moveis14';
import { vagaPara17 } from '../../../motor/v14/moveis/funcoes17';
import './moveis14.css';

const m2 = (x: number) => `${String(Math.round(x * 10) / 10).replace('.', ',')} m²`;
const M = (oque: unknown) => ({ tipo: 'moveis14', oque } as unknown as Acao);

/** A planta do cômodo em blocos: o que já está lá, o espaço livre e a peça nova (destacada). */
function Planta({ capacidade, pecas, nova, nomeNova }: { capacidade: number; pecas: { nome: string; ocupa: number; doImovel?: boolean }[]; nova?: number; nomeNova?: string }) {
  const usado = pecas.reduce((s, p) => s + p.ocupa, 0) + (nova ?? 0);
  const total = Math.max(capacidade, usado);
  return (
    <div className="m14-planta" role="img" aria-label={`Ocupação do cômodo: ${pecas.map(p => `${p.nome}, ${m2(p.ocupa)}`).join('; ')}${nova ? `; a peça nova, ${m2(nova)}` : ''}; cabem ${m2(capacidade)}.`}>
      {pecas.map((p, k) => <span key={k} className={`m14-planta__peca${p.doImovel ? ' m14-planta__peca--dono' : ''}`} style={{ flexGrow: p.ocupa }} title={`${p.nome} · ${m2(p.ocupa)}`}>{p.nome}</span>)}
      {nova !== undefined && <span className="m14-planta__peca m14-planta__peca--nova" style={{ flexGrow: nova }} title={`${nomeNova} · ${m2(nova)}`}>{nomeNova}</span>}
      {total > capacidade && <span className="m14-planta__limite" style={{ left: `${(capacidade / total) * 100}%` }} aria-hidden />}
      {capacidade > usado && <span className="m14-planta__livre" style={{ flexGrow: capacidade - usado }} />}
    </div>
  );
}

/** No cartão da loja: a área, o encaixe e a prévia (só para o que ocupa chão). */
export function EncaixeNaLoja14({ vida, coisaId }: { vida: Vida; coisaId: string }) {
  const [ver, setVer] = useState(false);
  const e = encaixe14(vida, coisaId);
  if (!e.ocupa) return null;
  const l = ver ? leituraMoveis14(vida) : undefined;
  const c = l?.comodos.find(x => x.id === e.comodo?.id);
  return (
    <span className="m14-encaixe">
      <span className={`nota m14-encaixe__linha${e.semControle ? '' : e.cabe ? ' m14-ok' : ' m14-falta'}`}>
        Ocupa {m2(e.ocupa)}. {e.semControle ? 'Na casa da família, quem decide o espaço é a família.' : e.cabe ? `Cabe ${e.comodo ? `n${e.comodo.nome.startsWith('a') ? 'a' : 'o'} ${e.comodo.nome} (${m2(e.comodo.livre)} livres)` : ''}.` : e.outro ? `Na ${e.comodo?.nome} não cabe; iria para ${e.outro.nome}.` : `Não cabe agora (${m2(e.comodo?.livre ?? 0)} livres): iria para o depósito${e.substituiveis.length ? `, ou substituiria ${coisa(e.substituiveis[0].coisaId)?.nome}` : ''}.`}
      </span>
      {!e.semControle && <button type="button" className="link" aria-expanded={ver} onClick={() => setVer(x => !x)}>{ver ? 'Fechar a prévia' : 'Ver no cômodo'}</button>}
      {ver && c && <Planta capacidade={c.capacidade} pecas={c.pecas} nova={e.ocupa} nomeNova={coisa(coisaId)?.nome} />}
    </span>
  );
}

/**
 * VIDA 17 · a função do móvel na loja: o que já é seu nessa função (e onde), para onde a peça nova vai (a 2ª cama, o 2º
 * quarto), ou — sem vaga — o porquê e a troca (a antiga vai para o depósito). `acao` é a compra do cartão (marca, loja).
 */
export function FuncaoNaLoja17({ vida, agir, coisaId, acao }: { vida: Vida; agir: (a: Acao) => boolean; coisaId: string; acao: Extract<Acao, { tipo: 'comprar_coisa' }> }) {
  const vg = vagaPara17(vida, coisaId);
  if (!vg) return null;
  const nomeDa = (id: string) => coisa(id)?.nome ?? id;
  return (
    <span className="m17-funcao" data-funcao={vg.funcao.id}>
      {vg.ocupantes.length > 0 && (
        <span className="m17-funcao__seus">
          <span className="m17-funcao__rotulo">Já é seu</span>
          {vg.ocupantes.slice(0, 4).map(o => (
            <span key={o.t.id} className={`m17-funcao__peca${o.t.coisaId === coisaId ? ' m17-funcao__peca--este' : ''}`}>{nomeDa(o.t.coisaId)}{o.comodo ? ` · ${o.comodo.nome}` : ''}{o.t.doImovel ? ' (do proprietário)' : ''}</span>
          ))}
        </span>
      )}
      {vg.livre ? (
        <>
          <span className="nota m14-ok">{vg.ocupantes.length ? `Mais ${vg.funcao.artigo === 'a' ? 'uma' : 'um'}: iria para ${vg.livre.nome.startsWith('a') ? 'a' : 'o'} ${vg.livre.nome}.` : `Iria para ${vg.livre.nome.startsWith('a') ? 'a' : 'o'} ${vg.livre.nome}.`}</span>
          <BotaoAcao vida={vida} acao={acao} agir={agir} variante="secundario">Comprar</BotaoAcao>
        </>
      ) : (
        <>
          <span className="nota m14-falta">{vg.motivo}</span>
          <span className="m17-funcao__trocas">
            {vg.ocupantes.filter(o => !o.t.lembranca).slice(0, 3).map(o => (
              <BotaoAcao key={o.t.id} vida={vida} acao={{ ...acao, substituir: o.t.id }} agir={agir} variante="secundario">{`Trocar ${o.t.coisaId === coisaId ? 'o seu' : `${coisa(o.t.coisaId)?.artigo ?? 'o'} ${nomeDa(o.t.coisaId)}`}${vg.ocupantes.length > 1 && o.comodo ? ` (${o.comodo.nome})` : ''}`}</BotaoAcao>
            ))}
          </span>
        </>
      )}
    </span>
  );
}

/** Os conjuntos (sala, quarto, jantar, área externa) por estilo, com as peças e o preço com desconto. */
export function Conjuntos14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [cena, setCena] = useState<string | null>(null);
  const cenas = Object.keys(NOME_DA_CENA) as (keyof typeof NOME_DA_CENA)[];
  return (
    <section className="m14-conjuntos" aria-label="Conjuntos">
      <p className="m14-titulo">Conjuntos por cômodo e estilo</p>
      <div className="v14v__tipos" role="tablist">
        {cenas.map(c => <button key={c} type="button" role="tab" aria-selected={cena === c} className={`v14v__tipo${cena === c ? ' v14v__tipo--ativo' : ''}`} onClick={() => setCena(x => (x === c ? null : c))}>{NOME_DA_CENA[c]}</button>)}
      </div>
      {cena && (
        <ul className="m14-lista">
          {CONJUNTOS.filter(c => c.cena === cena).map(c => (
            <li key={c.id} className="m14-conj">
              <p className="m14-conj__nome"><span>{ESTILOS.find(e => e.id === c.estilo)!.nome}</span><small>{ESTILOS.find(e => e.id === c.estilo)!.frase}</small></p>
              <p className="nota">{c.pecas.map(p => `${coisa(p.coisaId)?.nome ?? p.coisaId}${p.acabamento?.[0] ? ` (${p.acabamento[0]})` : ''}`).join(' + ')}</p>
              <BotaoAcao vida={vida} acao={M({ op: 'conjunto', id: c.id })} agir={agir} variante="secundario">{`Comprar o conjunto · ${dinheiroCurto(precoDoConjunto14(vida, c.id))}`}</BotaoAcao>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Na casa: o espaço de cada cômodo, a mobília do proprietário e o depósito (guardar, retirar, trocar). */
export function EspacoDaCasa14({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [aberto, setAberto] = useState(false);
  const l = leituraMoveis14(vida);
  if (!l.comodos.length && !l.deposito.length) return null;
  return (
    <section className="m14-casa" aria-label="Espaço e depósito">
      <button type="button" className="botao botao--discreto" aria-expanded={aberto} onClick={() => setAberto(x => !x)}>{aberto ? 'Fechar o espaço da casa' : `Espaço da casa${l.deposito.length ? ` · ${l.deposito.length} no depósito` : ''}`}</button>
      {aberto && (
        <>
          {l.mobilia && <p className="nota">{l.mobilia.nivel} (estilo {l.mobilia.estilo.toLowerCase()}): as peças marcadas são do proprietário — ficam quando o aluguel acabar.{l.mobilia.guardados ? ` Ele guardou ${l.mobilia.guardados} que repetiam as suas.` : ''}</p>}
          <ul className="m14-lista">
            {l.comodos.map(c => (
              <li key={c.id} className="m14-comodo">
                <p className="m14-conj__nome"><span>{c.nome.charAt(0).toUpperCase() + c.nome.slice(1)}</span><small>{m2(c.usado)} ocupados de {m2(c.capacidade)} úteis ({m2(c.area)} de piso)</small></p>
                <Planta capacidade={c.capacidade} pecas={c.pecas} />
                <div className="grupo-acoes">
                  {c.pecas.map(p => p.doImovel
                    ? <BotaoAcao key={p.id} vida={vida} acao={M({ op: 'devolver', id: p.id })} agir={agir} variante="discreto">{`Pedir ao proprietário que guarde: ${p.nome}`}</BotaoAcao>
                    : <BotaoAcao key={p.id} vida={vida} acao={M({ op: 'guardar', id: p.id })} agir={agir} variante="discreto" ocultarImpossivel>{`Guardar no depósito: ${p.nome}`}</BotaoAcao>)}
                </div>
              </li>
            ))}
          </ul>
          {l.deposito.length > 0 && (
            <div className="m14-deposito">
              <p className="m14-titulo">No depósito · {dinheiroCurto(l.custoDeposito)}/ano</p>
              <ul className="m14-lista">
                {l.deposito.map(d => {
                  const e = encaixe14(vida, d.coisaId);
                  return (
                    <li key={d.id} className="m14-comodo">
                      <p className="m14-conj__nome"><span>{d.nome}</span><small>{m2(d.ocupa)}</small></p>
                      <div className="grupo-acoes">
                        <BotaoAcao vida={vida} acao={M({ op: 'retirar', id: d.id })} agir={agir} variante="discreto">Levar para casa</BotaoAcao>
                        {e.substituiveis.filter(s => !s.doImovel).slice(0, 2).map(s => <BotaoAcao key={s.id} vida={vida} acao={M({ op: 'substituir', novo: d.id, sai: s.id })} agir={agir} variante="discreto">{`Trocar por ${coisa(s.coisaId)?.nome}`}</BotaoAcao>)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Na imobiliária: o que vem com o imóvel (antes de fechar), quanto custa a mais e de quem fica. */
export function MobiliaDaOferta14({ vida, o }: { vida: Vida; o: OfertaImovel }) {
  const mob = mobiliaDaOferta14(vida, o);
  if (mob.nivel === 'vazio') return <p className="nota">Vazio: você mobilia (o que é seu vem junto; o que não couber vai para um depósito).</p>;
  return (
    <div className="m14-mobilia">
      <p className="m14-titulo">{NOME_DA_MOBILIA[mob.nivel]} · estilo {ESTILOS.find(e => e.id === mob.estilo)!.nome.toLowerCase()}</p>
      <ul className="m14-pecas">{mob.pecas.map(id => <li key={id}>{coisa(id)?.nome ?? id}</li>)}</ul>
      <p className="nota">{o.modo === 'aluguel'
        ? `O aluguel anunciado já inclui a mobília (+${Math.round(mob.acrescimo * 100)}% sobre o vazio). As peças são do proprietário: ficam no imóvel ao sair. O que repetir o que você já tem, ele guarda — ninguém paga duas vezes.`
        : `Para quem vai morar, dá para levar a mobília por ${dinheiroCurto(mob.precoExtra)} (valor de usada): passa a ser sua. Sem ela, o vendedor leva.`}</p>
    </div>
  );
}
