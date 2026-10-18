/**
 * REWORK 9.5 · ROT-01 — A ROTINA EM TRÊS LEITURAS, como notas presas na agenda: os HORÁRIOS (o que a agenda tem
 * livre), a EXIGÊNCIA (o que a rotina cobra do descanso) e a CABEÇA (o estresse). Tudo de `avaliacaoDaRotina` — a mesma
 * conta que decide o que cabe, que a escola e as atividades leem e que o ano cobra. Cada nota diz uma coisa só; a frase
 * de cima junta as três sem repetir.
 */

import type { Vida } from '../../motor/tipos';
import { avaliarRotina, type AvaliacaoDaRotina, type PesoDaRotina } from '../../motor/sistemas/avaliacaoDaRotina';
import { folegoDaSemana } from '../../motor/sistemas/semana';
import { listaNatural } from '../../motor/texto';
import { idade } from '../../motor/nucleo';

const PALAVRA_DO_PESO: Record<PesoDaRotina, string> = { leve: 'leve', movimentada: 'movimentada', pesada: 'pesada' };

/** O título curto de Minha Semana (a frase inteira mora na leitura logo abaixo). */
export function tituloDaRotina(av: AvaliacaoDaRotina): string {
  const bem = (av.cabeca.nivel === 'baixo' || av.cabeca.nivel === 'moderado') && av.cabeca.tendencia !== 'subindo';
  if (av.exigencia.peso === 'leve') return bem ? 'Uma rotina leve.' : 'A rotina é leve; a cabeça, não.';
  if (av.exigencia.peso === 'movimentada') return bem ? 'Uma semana movimentada, bem levada.' : 'Uma semana movimentada — e a cabeça sente.';
  return av.exigencia.faixa === 'alem' ? 'A rotina passou do que se aguenta.' : 'A rotina está pesando.';
}

export function LeituraDaRotina({ vida, av = avaliarRotina(vida) }: { vida: Vida; av?: AvaliacaoDaRotina }) {
  const fol = folegoDaSemana(vida);
  const i = idade(vida);
  const h = av.horarios;
  return (
    <section className="rotina-leitura" aria-labelledby="titulo-rotina" data-faixa={av.exigencia.faixa} data-estresse={av.cabeca.valor}>
      <h2 id="titulo-rotina" className="secao-fio">Como está a rotina</h2>
      <p className="rotina-leitura__resumo">{av.resumo}</p>
      <div className="rotina-leitura__notas">
        <article className="nota-agenda nota-agenda--horarios" aria-labelledby="nota-horarios">
          <h3 id="nota-horarios" className="nota-agenda__rotulo">Horários</h3>
          <p className="nota-agenda__palavra">{h.conflitos ? `${h.conflitos} ${h.conflitos === 1 ? 'conflito' : 'conflitos'}` : `${h.livres} h livres`}</p>
          <p className="nota-agenda__texto">{h.conflitos ? h.texto : `${h.diasComFolga === 7 ? 'Todos os dias têm' : h.diasComFolga ? `${h.diasComFolga} ${h.diasComFolga === 1 ? 'dia tem' : 'dias têm'}` : 'Nenhum dia tem'} ao menos uma hora seguida livre, ${h.janela}${i < 12 ? ' (criança não treina mais tarde)' : ''}.`}</p>
        </article>
        <article className={`nota-agenda nota-agenda--exigencia nota-agenda--${av.exigencia.peso}`} aria-labelledby="nota-exigencia">
          <h3 id="nota-exigencia" className="nota-agenda__rotulo">Exigência</h3>
          <p className="nota-agenda__palavra">{PALAVRA_DO_PESO[av.exigencia.peso]}</p>
          <p className="nota-agenda__texto">{av.exigencia.texto}{av.exigencia.exige.length ? ` O que mais exige: ${listaNatural(av.exigencia.exige)}.` : ''}</p>
          <p className="nota-agenda__texto nota-agenda__folego"><strong>Dá para assumir mais?</strong> {fol.texto}</p>
        </article>
        <article className={`nota-agenda nota-agenda--cabeca nota-agenda--estresse-${av.cabeca.nivel.replace(' ', '-')}`} aria-labelledby="nota-cabeca">
          <h3 id="nota-cabeca" className="nota-agenda__rotulo">Cabeça</h3>
          <p className="nota-agenda__palavra">{av.cabeca.valor}% <span>{av.cabeca.nivel}</span></p>
          <p className="nota-agenda__texto">{av.cabeca.texto}{av.cabeca.pesa && av.cabeca.nivel !== 'baixo' ? ` O que mais pesa: ${av.cabeca.pesa.charAt(0).toLowerCase()}${av.cabeca.pesa.slice(1)}.` : ''}</p>
          {i >= 10 && <a className="link nota-agenda__ir" href="#titulo-estresse">O estresse em detalhe ↓</a>}
        </article>
      </div>
    </section>
  );
}

/** Uma linha só (para outras áreas: a escola, o trabalho, Você) — a mesma leitura, sem repetir as notas. */
export function ResumoDaRotina({ vida, av = avaliarRotina(vida), irPara }: { vida: Vida; av?: AvaliacaoDaRotina; irPara?: () => void }) {
  return (
    <p className="rotina-resumo" data-faixa={av.exigencia.faixa}>
      <span className="rotina-resumo__rotulo">A rotina</span> {av.resumo}
      {irPara && <> <button type="button" className="link" onClick={irPara}>Ver a semana →</button></>}
    </p>
  );
}
