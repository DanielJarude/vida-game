/**
 * REWORK 11 · REL-16 — O PLANEJAMENTO DO CASAMENTO, na ficha de quem está noivo de você: o lugar, o tipo de cerimônia,
 * quantos convidados, o estilo e a lua de mel. O preço é o do motor (`casamento.custoDoCasamento`, nos preços de onde
 * se mora), e a tela diz antes quem paga o quê — e se a outra pessoa preferia outra coisa. Depois da cerimônia, a lua de
 * mel abre a escolha de viagem de sempre (`EscolherViagem`), a dois.
 */

import { useState } from 'react';
import type { Acao } from '../../motor/acoes';
import type { Pessoa, PlanoDeCasamento, Vida, Vinculo } from '../../motor/tipos';
import { CERIMONIAS, CONVIDADOS, custoDoCasamento, discordaDoPlano, ESTILOS, LOCAIS, luaDeMelPendente, pagamentoDoCasamento, preferenciaDoPar, PRAZO_DA_FESTA } from '../../motor/sistemas/casamento';
import { estaNoivo } from '../../motor/sistemas/romance';
import { BotaoAcao, Escolha } from '../comum';
import { dinheiroCurto } from '../leituraMaterial';
import { EscolherViagem } from './Viagem';

type Plano = Omit<PlanoDeCasamento, 't' | 'discorda'>;
const PADRAO: Plano = { local: 'salao', cerimonia: 'civil', convidados: 60, estilo: 'classico', luaDeMel: true };

export function PlanejarCasamento({ vida, p, vin, agir }: { vida: Vida; p: Pessoa; vin: Vinculo; agir: (a: Acao) => boolean }) {
  const salvo = vin.romance?.noivado?.plano;
  const [plano, setPlano] = useState<Plano>(salvo ? { local: salvo.local, cerimonia: salvo.cerimonia, convidados: salvo.convidados, estilo: salvo.estilo, luaDeMel: salvo.luaDeMel } : PADRAO);
  if (!estaNoivo(vida, vin)) return null;
  const mudar = <K extends keyof Plano>(k: K, x: Plano[K]) => setPlano(s => ({ ...s, [k]: x }));
  const maxLocal = LOCAIS[plano.local].max;
  const custo = custoDoCasamento(vida, plano);
  const pg = pagamentoDoCasamento(vida, p, custo);
  const pref = preferenciaDoPar(vida, p);
  const discorda = discordaDoPlano(vida, p, plano);
  const igualAoSalvo = !!salvo && salvo.local === plano.local && salvo.cerimonia === plano.cerimonia && salvo.convidados === plano.convidados && salvo.estilo === plano.estilo && salvo.luaDeMel === plano.luaDeMel;
  return (
    <section className="casamento" aria-label="O planejamento do casamento">
      <h3 className="ficha__subtitulo">O casamento</h3>
      {/* REWORK 11.5 · REL-24: o convite — o que já está combinado, dito como um convite (os nomes, o pedido, o plano). */}
      <div className="convite" aria-label="O convite">
        <p className="convite__ornamento" aria-hidden>✦</p>
        <p className="convite__nomes manuscrito">{vida.eu.nome} &amp; {p.nome}</p>
        <p className="convite__linha">Noivos desde {Math.floor((vin.romance?.noivado?.t ?? vida.t) / 12)}{vin.romance?.noivado?.lugar ? ` · o pedido foi ${vin.romance.noivado.lugar === 'casa' ? 'em casa' : vin.romance.noivado.lugar === 'publico' ? 'em público' : 'num jantar'}` : ''}{vin.romance?.noivado?.anel ? ` · ${vin.romance.noivado.anel === 'nenhum' ? 'sem anel' : `anel ${vin.romance.noivado.anel === 'classico' ? 'clássico' : vin.romance.noivado.anel}`}` : ''}</p>
        <p className="convite__plano">{LOCAIS[plano.local].rotulo} · {CERIMONIAS[plano.cerimonia].rotulo} · {plano.convidados} convidados · {ESTILOS[plano.estilo].rotulo}{plano.luaDeMel ? ' · lua de mel' : ''}</p>
        <p className="convite__linha">{salvo ? (igualAoSalvo ? 'Este é o plano combinado.' : 'Mudanças ainda não combinadas.') : 'Ainda um rascunho: nada combinado.'} Orçamento: {dinheiroCurto(custo)}.</p>
      </div>
      <p className="ficha__porque">{pref.texto}</p>
      <div className="campo"><span className="campo__rotulo">Onde</span>
        <Escolha rotulo="Onde" opcoes={Object.entries(LOCAIS).map(([id, l]) => ({ id: id as Plano['local'], rotulo: l.rotulo }))} valor={plano.local} aoMudar={x => { mudar('local', x); const m = LOCAIS[x].max; if (m !== undefined && plano.convidados > m) mudar('convidados', [...CONVIDADOS].reverse().find(n => n <= m) ?? 10); }} />
      </div>
      <div className="campo"><span className="campo__rotulo">A cerimônia</span>
        <Escolha rotulo="A cerimônia" opcoes={Object.entries(CERIMONIAS).map(([id, c]) => ({ id: id as Plano['cerimonia'], rotulo: c.rotulo }))} valor={plano.cerimonia} aoMudar={x => mudar('cerimonia', x)} />
      </div>
      <div className="campo"><span className="campo__rotulo">Convidados</span>
        <Escolha rotulo="Convidados" opcoes={CONVIDADOS.filter(n => maxLocal === undefined || n <= maxLocal).map(n => ({ id: String(n), rotulo: String(n) }))} valor={String(plano.convidados)} aoMudar={x => mudar('convidados', Number(x))} />
      </div>
      <div className="campo"><span className="campo__rotulo">O estilo</span>
        <Escolha rotulo="O estilo" opcoes={Object.entries(ESTILOS).map(([id, e]) => ({ id: id as Plano['estilo'], rotulo: e.rotulo }))} valor={plano.estilo} aoMudar={x => mudar('estilo', x)} />
      </div>
      <label className="rede__promover"><input type="checkbox" checked={plano.luaDeMel} onChange={e => mudar('luaDeMel', e.target.checked)} /> Lua de mel depois (uma viagem a dois, escolhida depois do casamento)</label>
      <dl className="casamento__conta" aria-label="O orçamento">
        <div><dt>Ao todo</dt><dd>{dinheiroCurto(custo)}</dd></div>
        <div><dt>A sua parte</dt><dd>{dinheiroCurto(pg.parte)}</dd></div>
        <div><dt>O que você tem</dt><dd>{dinheiroCurto(pg.tem)}</dd></div>
        {pg.falta > 0 && <div><dt>Falta</dt><dd>{dinheiroCurto(pg.falta)} — {pg.cabe ? `${PRAZO_DA_FESTA} parcelas de ${dinheiroCurto(pg.parcela)}` : 'a parcela não caberia na renda de vocês'}</dd></div>}
      </dl>
      <p className="nota">{p.nome} e a família pagam o resto. {pg.falta === 0 ? 'Sem parcelamento: a sua parte já está guardada.' : ''}</p>
      {discorda && <p className="nota nota--atencao">{discorda} Dá para casar assim — mas fica dito.</p>}
      <div className="grupo-acoes">
        {!igualAoSalvo && <BotaoAcao vida={vida} acao={{ tipo: 'casamento', pessoaId: p.id, op: 'planejar', plano }} agir={agir} variante="secundario">{salvo ? 'Mudar o plano' : 'Combinar este plano'}</BotaoAcao>}
        {salvo && <BotaoAcao vida={vida} acao={{ tipo: 'casamento', pessoaId: p.id, op: 'celebrar' }} agir={agir} variante="principal">Casar, como combinado</BotaoAcao>}
      </div>
    </section>
  );
}

/** A lua de mel: a escolha de viagem de sempre, a dois, logo depois do casamento (uma vez). */
export function LuaDeMel({ vida, agir }: { vida: Vida; agir: (a: Acao) => boolean }) {
  const [aberta, setAberta] = useState<null | 'viagem_pais' | 'viagem_exterior'>(null);
  const par = luaDeMelPendente(vida);
  if (!par) return null;
  return (
    <section className="casamento casamento--lua" aria-label="A lua de mel">
      <h3 className="ficha__subtitulo">A lua de mel</h3>
      <p className="nota">Uma viagem a dois com {par.nome}, logo depois do casamento — fora da conta das viagens do ano, uma vez.</p>
      <div className="grupo-acoes">
        <button type="button" className="botao botao--secundario" aria-expanded={aberta === 'viagem_pais'} onClick={() => setAberta(a => (a === 'viagem_pais' ? null : 'viagem_pais'))}>Pelo país</button>
        <button type="button" className="botao botao--secundario" aria-expanded={aberta === 'viagem_exterior'} onClick={() => setAberta(a => (a === 'viagem_exterior' ? null : 'viagem_exterior'))}>Para fora do país</button>
      </div>
      {aberta && <EscolherViagem vida={vida} id={aberta} agir={agir} luaDeMel aoConcluir={() => setAberta(null)} />}
    </section>
  );
}
