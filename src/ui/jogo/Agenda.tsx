/**
 * REWORK 7.5 — a semana como uma AGENDA.
 *
 * O motor não simula dias nem horas: simula a FREQUÊNCIA (o "pedaço" de `sistemas/semana` — meio pedaço é uma vez por
 * semana) e o TAMANHO da semana (a base pela idade, o que já vem ocupado, o teto humano). A agenda é honesta com isso:
 * uma página de caderno com uma linha por compromisso e um quadrinho por "vez na semana", sem dia nem hora marcados.
 * Os quadrinhos enchem a semana na ordem — o que já vem ocupado, o que você escolheu — e, quando passam do tamanho
 * dela, mudam de natureza com as MESMAS faixas de `encaixe`: tirado do descanso, além do que cabe, além do possível.
 *
 * O que dá para fazer daqui: abrir a ficha de uma prática (um toque na linha), deixar uma atividade mais leve ou mais a
 * sério (o mesmo comando de sempre, `rotina` com outro nível — o motor diz se cabe), ver o que pesa e o que ajuda no
 * estresse, ir à causa de um compromisso fixo. A lista de sempre continua logo abaixo, como alternativa.
 */

import { useState } from 'react';
import type { Vida } from '../../motor/tipos';
import type { Acao } from '../../motor/acoes';
import { dose, encaixe, MARGEM_DO_DESCANSO, PALAVRA_DA_FAIXA, TETO_HUMANO, type Semana } from '../../motor/sistemas/semana';
import { DE_ESTUDOS, modeloRotina } from '../../motor/sistemas/rotinas';
import { DE_FORMACAO } from '../../motor/sistemas/formacao';
import { leituraDoEstresse } from '../../motor/sistemas/leituraDoEstresse';
import { idade } from '../../motor/nucleo';
import { BotaoAcao } from '../comum';
import { leituraDaPratica, type LeituraPratica } from '../leituraPratica';
import { FichaPratica } from './Pratica';
import { Emblema } from './Emblemas';
import type { Aba } from '../navegacao';

/** Um quadrinho é meio pedaço: "uma vez por semana". */
const POR_PEDACO = 2;
const quadrinhos = (peso: number) => Math.max(1, Math.round(peso * POR_PEDACO));

type Zona = 'dentro' | 'descanso' | 'alem' | 'impossivel';

const NOME_DA_ZONA: Record<Exclude<Zona, 'dentro'>, string> = { descanso: 'tirado do descanso', alem: 'além do que cabe', impossivel: 'além do possível' };

interface Linha {
  id: string;
  rotulo: string;
  peso: number;
  tipo: 'fixo' | 'pratica';
  /** Para onde leva (a causa de um fixo mora em outra área). */
  area?: Aba;
  l?: LeituraPratica;
}

const AREA_DO_FIXO: Record<string, Aba> = {
  trabalho: 'trabalho', horas_extras: 'trabalho', politica: 'trabalho', negocio: 'trabalho', paralela: 'trabalho', cuidado_pausa: 'trabalho', pena: 'trabalho',
  curso: 'formacao', integrado: 'formacao', filhos_pequenos: 'pessoas', filhos_escola: 'pessoas', cuidar: 'pessoas', pets: 'pessoas', deslocamento: 'cidade'
};

export function Agenda({ vida, s, agir, irPara, abrirPessoa }: { vida: Vida; s: Semana; agir: (a: Acao) => boolean; irPara?: (a: Aba) => void; abrirPessoa?: (id: string) => void }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const i = idade(vida);
  const enc = encaixe(vida, 0);
  // A capacidade em quadrinhos: o tamanho da semana; a margem do descanso; o teto humano (as faixas de `encaixe`).
  const base = Math.round(s.base * POR_PEDACO);
  const descanso = Math.round((s.base + MARGEM_DO_DESCANSO) * POR_PEDACO);
  const teto = Math.round((i < 12 ? s.base + 0.75 : s.base * TETO_HUMANO) * POR_PEDACO);
  const ganho = s.ganhos.reduce((t, g) => t + g.peso, 0);
  const linhas: Linha[] = [
    ...s.fixos.filter(f => f.peso >= 0.2).map(f => ({ id: f.id, rotulo: f.rotulo, peso: Math.max(0.25, f.id === 'trabalho' ? f.peso - ganho : f.peso), tipo: 'fixo' as const, area: AREA_DO_FIXO[f.id] })),
    ...s.rotinas.map(r => {
      const rot = vida.rotinas.find(x => x.id === r.id);
      const l = rot ? leituraDaPratica(vida, rot, DE_ESTUDOS.has(r.id) || DE_FORMACAO.has(r.id)) : undefined;
      return { id: r.id, rotulo: l?.nome ?? r.rotulo.replace(/ — .*/, ''), peso: r.peso, tipo: 'pratica' as const, l };
    })
  ];
  // Os quadrinhos andam pela semana na ordem das linhas: cada um sabe em que zona caiu.
  let n = 0;
  // O arredondamento dos quadrinhos nunca contradiz o motor: a zona de um quadrinho não passa da faixa que `encaixe` deu.
  const ORDEM: Zona[] = ['dentro', 'descanso', 'alem', 'impossivel'];
  const maxima = ORDEM.indexOf(enc.faixa === 'folgada' || enc.faixa === 'ocupada' ? 'dentro' : enc.faixa === 'cheia' ? 'descanso' : enc.faixa === 'sobrecarregada' ? 'alem' : 'impossivel');
  const zonaDe = (k: number): Zona => ORDEM[Math.min(maxima, ORDEM.indexOf(k < base ? 'dentro' : k < descanso ? 'descanso' : k < teto ? 'alem' : 'impossivel'))];
  const comQuadros = linhas.map(x => ({ ...x, zonas: Array.from({ length: quadrinhos(x.peso) }, () => zonaDe(n++)) }));
  const usados = n;
  const livres = Math.max(0, base - usados);
  const estresse = i >= 10 ? leituraDoEstresse(vida) : undefined;
  const aberto = comQuadros.find(x => x.id === aberta)?.l;
  const escola = i >= 4 && i < 18 && vida.educacao.basica;
  const fora = escola ? 'fora as aulas e o sono' : 'fora o sono e o básico de todo dia';

  return (
    <section className="agenda" aria-labelledby="titulo-agenda">
      <header className="agenda__cabeca">
        <h3 id="titulo-agenda" className="agenda__titulo">A agenda da semana</h3>
        <p className="agenda__ritmo">
          <span className={`agenda__faixa agenda__faixa--${enc.faixa}`}>{PALAVRA_DA_FAIXA[enc.faixa]}</span>
          {' '}· {usados} {usados === 1 ? 'vez' : 'vezes'} na semana para {base} que cabem com folga
        </p>
        <p className="agenda__como">Cada quadrinho é uma vez por semana ({fora}). O jogo conta quantas vezes, não em que dia nem a que horas.</p>
        {/* A semana inteira numa fileira: de quem é cada vez; o livre é só contorno; o que passa do que cabe muda de textura. */}
        <div className="agenda__semana" role="img" aria-label={`A semana inteira: ${usados} de ${base} vezes${usados > base ? `, ${usados - base} além do que cabe com folga` : ''}.`}>
          {comQuadros.flatMap(x => x.zonas.map((z, k) => <span key={`${x.id}${k}`} className={`agenda__q agenda__q--${x.tipo} agenda__q--${z}`} title={x.rotulo} />))}
          {Array.from({ length: livres }, (_, k) => <span key={`l${k}`} className="agenda__q agenda__q--livre" />)}
        </div>
      </header>

      <ol className="agenda__linhas">
        {escola && (
          <li className="agenda__linha agenda__linha--escola">
            <span className="agenda__nome"><span className="agenda__marca agenda__marca--escola" aria-hidden />Escola</span>
            <span className="agenda__nota">as aulas da semana — já descontadas do tamanho dela</span>
          </li>
        )}
        {comQuadros.map(x => {
          const nivel = x.l?.nivel;
          const podeMudar = x.tipo === 'pratica' && x.l && !x.l.daFormacao;
          const mais = podeMudar && nivel && nivel < 3 ? x.l!.niveis.find(q => q.n === nivel + 1) : undefined;
          const menos = podeMudar && nivel && nivel > 1 ? x.l!.niveis.find(q => q.n === nivel - 1) : undefined;
          const passa = x.zonas.find(z => z !== 'dentro');
          return (
            <li key={x.id} className={`agenda__linha agenda__linha--${x.tipo}${passa ? ` agenda__linha--${passa}` : ''}`}>
              {x.tipo === 'pratica' && x.l
                ? <button type="button" className="agenda__nome agenda__abrir" onClick={() => setAberta(x.id)} aria-label={`${x.rotulo}: ${dose(x.peso)}. Abrir a ficha`}>
                    <Emblema id={x.id} categoria={modeloRotina(x.id)?.categoria} tamanho={26} />
                    <span>{x.rotulo}</span>
                  </button>
                : <span className="agenda__nome"><span className="agenda__marca" aria-hidden />{x.rotulo.replace(/ \(.*\)$/, '')}</span>}
              <span className="agenda__quadros" role="img" aria-label={`${dose(x.peso)}${passa ? `, parte ${NOME_DA_ZONA[passa as Exclude<Zona, 'dentro'>]}` : ''}`}>
                {x.zonas.map((z, k) => <span key={k} className={`agenda__q agenda__q--${x.tipo} agenda__q--${z}`} />)}
              </span>
              <span className="agenda__dose">
                {dose(x.peso)}{x.tipo === 'fixo' ? ' · fixo' : x.l && !/semana|mês|dia/.test(x.l.rotuloNivel) ? ` · ${x.l.rotuloNivel.toLowerCase()}` : ''}
                {x.tipo === 'fixo' && x.area && irPara && <> · <button type="button" className="link agenda__ir" onClick={() => irPara(x.area!)} aria-label={`${x.rotulo.replace(/ \(.*\)$/, '')}: ver onde isso mora`}>ver →</button></>}
              </span>
              <span className="agenda__acoes">
                {menos && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: x.id, ativa: true, nivel: menos.n }} agir={agir} variante="discreto" ocultarBloqueado>Mais leve: {menos.rotulo.toLowerCase()}</BotaoAcao>}
                {mais && <BotaoAcao vida={vida} acao={{ tipo: 'rotina', id: x.id, ativa: true, nivel: mais.n }} agir={agir} variante="discreto" ocultarBloqueado>Mais a sério: {mais.rotulo.toLowerCase()}</BotaoAcao>}
              </span>
            </li>
          );
        })}
        {livres > 0 && (
          <li className="agenda__linha agenda__linha--livre">
            <span className="agenda__nome"><span className="agenda__marca agenda__marca--livre" aria-hidden />Livre</span>
            <span className="agenda__quadros" role="img" aria-label={`${livres} ${livres === 1 ? 'vez livre' : 'vezes livres'} na semana`}>
              {Array.from({ length: livres }, (_, k) => <span key={k} className="agenda__q agenda__q--livre" />)}
            </span>
            <span className="agenda__dose">{livres === 1 ? 'uma vez livre' : `${livres} vezes livres`}</span>
          </li>
        )}
      </ol>

      {enc.motivo && enc.faixa !== 'folgada' && enc.faixa !== 'ocupada' && <p className={`agenda__conflito agenda__conflito--${enc.faixa}`}><strong>Conflito de tempo.</strong> {enc.motivo}</p>}

      {estresse && (estresse.pesando.length > 0 || estresse.ajudando.length > 0) && (
        <p className="agenda__estresse">
          {estresse.pesando.length > 0 && <span><strong>Pesa:</strong> {estresse.pesando.slice(0, 3).map(c => c.texto).join(', ')}.</span>}
          {estresse.ajudando.length > 0 && <span> <strong>Ajuda:</strong> {estresse.ajudando.slice(0, 3).map(c => c.texto).join(', ')}.</span>}
          {' '}<a className="link" href="#titulo-estresse">O estresse, em detalhe ↓</a>
        </p>
      )}

      {aberto && <FichaPratica vida={vida} l={aberto} agir={agir} aoFechar={() => setAberta(null)} irPara={irPara} abrirPessoa={abrirPessoa} />}
    </section>
  );
}
