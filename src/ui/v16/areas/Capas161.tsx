/**
 * VIDA 16.1 · AS CAPAS DAS ÁREAS — a "folha de rosto" própria de cada área, inspirada em serviços reais (o perfil de uma
 * rede, o cartão de embarque, a carteirinha de estudante, o placar), no traço do VIDA. Cada capa só LÊ o que os sistemas
 * já guardam — nenhum dado é inventado para preencher a tela; sem dado, a capa encolhe ou não aparece.
 */
import type { ReactNode } from 'react';
import type { Vida } from '../../../motor/tipos';
import { idade } from '../../../motor/nucleo';
import { anoDe } from '../../../motor/tempo';
import { nomeLugar } from '../../../motor/dados/lugares';
import { nomeDoPais14 } from '../../../motor/v14/viagens/viagens14';
import { leituraDaFama13, marcosDaFama13 } from '../../../motor/sistemas/reconhecimento13';
import { leituraDaSeguranca } from '../../leituraMaterial';
import { dinheiroCurto } from '../../apresentar';
import { balanco } from '../../../motor/sistemas/dinheiro';
import type { SecaoVida } from '../../navegacao';
import './areas161.css';

/* ------------------------------------------------------------------ Os ícones das seções de Vida */

const ICONES_VIDA: Record<SecaoVida, string> = {
  casa: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  dinheiro: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M6 10v4M18 10v4',
  compras: 'M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8zM9 8V6a3 3 0 0 1 6 0v2',
  pertences: 'M4 9l8-5 8 5v10H4zM9 19v-5h6v5M4 9h16',
  cidade: 'M3 21V10l5-3v14M8 21V5l6 3v13M14 21v-9l7 3v6M2 21h20',
  viagens: 'M2.5 15.5l19-7-3.5-2-7 2.6L6 5 4 6l3.2 4.4-3.7 1.4-2-1.2L0 11.5zM3 20h18',
  campo: 'M3 20h18M5 20V11l7-5 7 5v9M9 20v-5h6v5M2 11l10-7 10 7',
  apostas: 'M5 4h14v16H5zM9 8h.01M15 8h.01M12 12h.01M9 16h.01M15 16h.01'
} as Record<SecaoVida, string>;

export function IconeDaSecao161({ s }: { s: SecaoVida }) {
  const d = ICONES_VIDA[s];
  if (!d) return null;
  return <svg className="nav161__icone" viewBox="0 0 24 24" width="16" height="16" aria-hidden><path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/* ------------------------------------------------------------------ Você: a ficha do perfil */

/** As linhas da identidade, no alto do perfil (o que o retrato e os números não repetem). */
export function Identidade161({ vida }: { vida: Vida }) {
  const i = idade(vida);
  // Só o que o retrato e os números do perfil não dizem: o dinheiro, o que é seu, a cidade.
  const liquido = i >= 12 ? balanco(vida).liquido : 0;
  const itens: { k: string; r: string; v: ReactNode }[] = [
    ...(i >= 14 ? [{ k: 'dinheiro', r: 'Dinheiro', v: leituraDaSeguranca(vida).palavra }] : []),
    ...(liquido !== 0 ? [{ k: 'patrimonio', r: 'O que é seu', v: dinheiroCurto(liquido) }] : []),
    { k: 'cidade', r: 'Cidade', v: nomeLugar(vida.moradia.municipioId) }
  ];
  return (
    <dl className="perfil161__ficha">
      {itens.map(x => <div key={x.k} className={`perfil161__linha perfil161__linha--${x.k}`}><dt>{x.r}</dt><dd>{x.v}</dd></div>)}
    </dl>
  );
}

/* ------------------------------------------------------------------ Fama: a capa de revista */

export function Manchete161({ vida }: { vida: Vida }) {
  const l = leituraDaFama13(vida);
  const ultimo = marcosDaFama13(vida).slice(-1)[0];
  return (
    <div className="fama161__masthead" aria-hidden={!ultimo}>
      <span className="fama161__titulo-revista">Holofote</span>
      <span className="fama161__edicao">edição de {anoDe(vida.t)} · {l.valor} de 100</span>
      {ultimo && <p className="fama161__manchete"><span>Na capa</span> {ultimo.texto}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Viagens: o passaporte */

export function Passaporte161({ vida }: { vida: Vida }) {
  // Os países de fora por onde passou (o de casa não carimba).
  const paises = Object.keys(vida.viagens14?.paises ?? {}).map(nomeDoPais14);
  const n = vida.viagens14?.n ?? 0;
  const casa = nomeLugar(vida.moradia.municipioId);
  return (
    <section className="passaporte161" aria-label="O seu passaporte">
      <div className="passaporte161__capa">
        <span className="passaporte161__brasao" aria-hidden>✈</span>
        <span className="passaporte161__rotulo">Passaporte</span>
        <span className="passaporte161__nome">{vida.eu.nome} {vida.eu.sobrenome ?? ''}</span>
      </div>
      <div className="passaporte161__paginas">
        <p className="passaporte161__partida"><span>Partindo de</span><strong>{casa}</strong></p>
        <p className="passaporte161__conta"><strong>{n}</strong> {n === 1 ? 'viagem registrada' : 'viagens registradas'} · <strong>{paises.length}</strong> {paises.length === 1 ? 'país fora' : 'países fora'}</p>
        {paises.length > 0
          ? <ul className="passaporte161__carimbos" aria-label="Países visitados">{paises.slice(0, 12).map((p, k) => <li key={p} className={`passaporte161__carimbo passaporte161__carimbo--${k % 4}`}>{p}</li>)}</ul>
          : <p className="passaporte161__vazio">Nenhum carimbo ainda. A primeira viagem começa logo abaixo.</p>}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ Estudos: a carteirinha */

export function Carteirinha161({ vida, formacao }: { vida: Vida; formacao?: { rotulo: string; detalhe?: string } }) {
  const e = vida.educacao;
  const diplomas = e.concluidos.length;
  const anos = e.historicoAcademico?.length ?? 0;
  const selecoes = e.processos129?.length ?? 0;
  if (!formacao && !diplomas && !anos) return null;
  return (
    <section className="carteirinha161" aria-label="A sua carteirinha de estudante">
      <div className="carteirinha161__faixa"><span>{formacao ? 'Estudante' : 'Formação'}</span><span>{anoDe(vida.t)}</span></div>
      <div className="carteirinha161__corpo">
        <p className="carteirinha161__nome">{vida.eu.nome} {vida.eu.sobrenome ?? ''}</p>
        {formacao ? <p className="carteirinha161__curso">{formacao.rotulo}{formacao.detalhe ? <span> · {formacao.detalhe}</span> : null}</p> : <p className="carteirinha161__curso">Sem matrícula agora</p>}
        <dl className="carteirinha161__dados">
          <div><dt>Diplomas</dt><dd>{diplomas}</dd></div>
          <div><dt>Anos letivos no histórico</dt><dd>{anos}</dd></div>
          {selecoes > 0 && <div><dt>Processos seletivos</dt><dd>{selecoes}</dd></div>}
          {e.concluidos.length > 0 && <div><dt>Último diploma</dt><dd>{e.concluidos[e.concluidos.length - 1].nome} ({anoDe(e.concluidos[e.concluidos.length - 1].tFim)})</dd></div>}
        </dl>
      </div>
    </section>
  );
}
