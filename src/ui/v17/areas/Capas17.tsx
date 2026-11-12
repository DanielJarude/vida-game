/**
 * VIDA 17 · o rework visual de Pessoas, Minha Semana e História — cada área ganha a sua peça principal, lida só do
 * estado real (nada fictício; sem dado, a peça encolhe ou diz que está vazia):
 *
 *   Pessoas       a CONSTELAÇÃO: você no meio; quem está em casa no primeiro anel; quem é perto, no segundo; quem
 *                 anda longe, na borda. A cor diz o laço (família, amor, amizade); tocar abre a pessoa.
 *   Minha Semana  a SEMANA EM TIRAS: os sete dias lado a lado, quanto cada um tem de compromisso (das 7h às 23h) e o
 *                 que ocupa cada dia; o fim de semana separado.
 *   História      a FITA DA VIDA: do nascimento até hoje, as fases e os marcos de verdade (o que a biografia guardou
 *                 como marco), cada um no ano em que aconteceu.
 */
import { useMemo } from 'react';
import type { Pessoa, Vida, Vinculo } from '../../../motor/tipos';
import { idade, idadePessoa, vinculosVivos } from '../../../motor/nucleo';
import { papelDe } from '../../../motor/sistemas/vinculos';
import { agendaDaSemana, DIAS_CURTOS } from '../../../motor/sistemas/agenda';
import { anoDe } from '../../../motor/tempo';
import { Retrato } from '../../avatar/Retrato';

/* ================================================================ Pessoas: a constelação */

type Laco = 'familia' | 'amor' | 'amizade' | 'outros';
const COR_LACO: Record<Laco, string> = { familia: '#b8653a', amor: '#c0395a', amizade: '#3d7a8c', outros: '#8a8478' };
const NOME_LACO: Record<Laco, string> = { familia: 'Família', amor: 'Amor', amizade: 'Amizade', outros: 'Outros' };

function lacoDe(p: Pessoa, vin: Vinculo): Laco {
  const papel = papelDe(p, vin);
  if (['parceiro', 'saindo', 'caso', 'interesse'].includes(papel)) return 'amor';
  if (vin.parentesco || ['filho', 'neto', 'genitor', 'irmao', 'avo', 'parente', 'sogro', 'genro', 'bisneto'].includes(papel)) return 'familia';
  if (['amigo', 'amigo_proximo'].includes(papel)) return 'amizade';
  return 'outros';
}

export function ConstelacaoDePessoas({ vida, abrir }: { vida: Vida; abrir: (id: string) => void }) {
  const W = 360, H = 230, cx = W / 2, cy = H / 2;
  const pontos = useMemo(() => {
    const gente = vinculosVivos(vida).filter(x => !x.p.especie && x.p.nome && x.vin.estagio !== 'ex_amigo' && !x.vin.ruptura)
      .sort((a, b) => b.vin.proximidade - a.vin.proximidade).slice(0, 16);
    const ordem: Laco[] = ['familia', 'amor', 'amizade', 'outros'];
    const porLaco = ordem.map(l => gente.filter(x => lacoDe(x.p, x.vin) === l));
    const out: { p: Pessoa; x: number; y: number; laco: Laco; casa: boolean; prox: number }[] = [];
    // Cada laço num setor do círculo; dentro do setor, espalhados; o raio vem da proximidade (perto = no centro).
    let inicio = -Math.PI / 2;
    const total = Math.max(1, gente.length);
    porLaco.forEach((lista, k) => {
      if (!lista.length) return;
      const setor = (lista.length / total) * Math.PI * 2;
      lista.forEach((x, j) => {
        const a = inicio + setor * ((j + 0.5) / lista.length);
        const casa = x.vin.convivio.includes('casa');
        const anel = (casa ? 0.36 : x.vin.proximidade >= 60 ? 0.62 : x.vin.proximidade >= 35 ? 0.8 : 0.96) + (j % 2 ? 0.1 : 0) * (casa ? 0.6 : 1) - (j % 3 === 2 ? 0.06 : 0);
        out.push({ p: x.p, x: cx + Math.cos(a) * (W * 0.44) * anel, y: cy + Math.sin(a) * (H * 0.43) * anel, laco: ordem[k], casa, prox: x.vin.proximidade });
      });
      inicio += setor;
    });
    return out;
  }, [vida]);
  if (!pontos.length) return null;
  const lacos = [...new Set(pontos.map(x => x.laco))];
  const i = idade(vida);
  return (
    <figure className="constelacao17" aria-label="O seu círculo">
      <svg viewBox={`0 0 ${W} ${H}`} className="constelacao17__svg">
        {[0.36, 0.62, 0.8, 0.96].map((r, k) => <ellipse key={k} cx={cx} cy={cy} rx={W * 0.44 * r} ry={H * 0.43 * r} className={`constelacao17__anel constelacao17__anel--${k}`} />)}
        {pontos.map(x => <line key={`l${x.p.id}`} x1={cx} y1={cy} x2={x.x} y2={x.y} stroke={COR_LACO[x.laco]} strokeOpacity={0.18 + x.prox / 250} strokeWidth={0.6 + x.prox / 70} />)}
        <g transform={`translate(${cx - 22} ${cy - 22})`} className="constelacao17__eu"><circle cx={22} cy={22} r={23} className="constelacao17__eu-halo" /><Retrato visual={vida.eu.visual} genero={vida.eu.genero} idade={i} semente={vida.eu.semente ?? 'eu'} tamanho={44} rotulo="Você" /></g>
        {pontos.map(x => (
          <g key={x.p.id} transform={`translate(${(x.x - 15).toFixed(1)} ${(x.y - 15).toFixed(1)})`} className="constelacao17__pessoa">
            <circle cx={15} cy={15} r={16} fill="none" stroke={COR_LACO[x.laco]} strokeWidth={x.casa ? 2.6 : 1.6} />
            <Retrato visual={x.p.visual} genero={x.p.genero} idade={idadePessoa(vida, x.p)} semente={x.p.id} tamanho={30} rotulo={x.p.nome} especie={x.p.especie} />
            {/* O toque é um botão de verdade (teclado, leitor de tela): o retrato e o nome abrem a pessoa. */}
            <foreignObject x={-13} y={-2} width={56} height={46}>
              <button type="button" className="constelacao17__botao" onClick={() => abrir(x.p.id)} aria-label={`Abrir ${x.p.nome}`}><span>{x.p.nome}</span></button>
            </foreignObject>
          </g>
        ))}
      </svg>
      <figcaption className="constelacao17__legenda">
        {lacos.map(l => <span key={l}><i style={{ background: COR_LACO[l] }} />{NOME_LACO[l]}</span>)}
        <span className="constelacao17__anel-nota">no centro, quem mora com você; na borda, quem anda longe</span>
      </figcaption>
    </figure>
  );
}

/* ================================================================ Minha Semana: a semana em tiras */

export function SemanaEmTiras({ vida }: { vida: Vida }) {
  const a = useMemo(() => agendaDaSemana(vida), [vida]);
  const ABRE = 7 * 60, FECHA = 23 * 60, DIA = FECHA - ABRE;
  const dias = DIAS_CURTOS.map((nome, d) => {
    const blocos = a.blocos.filter(b => b.dias.includes(d as never)).sort((x, y) => x.inicio - y.inicio);
    const livre = a.livre[d] ?? DIA;
    const ocupado = Math.max(0, DIA - livre);
    return { nome, d, blocos, ocupado, conflito: a.conflitos.some(c => c.dias.includes(d as never)) };
  });
  const totalLivre = Math.round(a.livre.reduce((s, x) => s + x, 0) / 60);
  return (
    <section className="semana17" aria-label="A semana em tiras">
      <div className="semana17__topo">
        <strong>{a.blocos.length ? `${a.blocos.length} ${a.blocos.length === 1 ? 'compromisso fixo' : 'compromissos fixos'}` : 'Semana em branco'}</strong>
        <span>{totalLivre} h livres entre 7h e 23h</span>
      </div>
      <ol className="semana17__dias">
        {dias.map(x => (
          <li key={x.d} className={`semana17__dia${x.d >= 5 ? ' semana17__dia--fds' : ''}${x.conflito ? ' semana17__dia--conflito' : ''}`}>
            <span className="semana17__nome">{x.nome}</span>
            <span className="semana17__barra" aria-label={`${Math.round(x.ocupado / 60)} h ocupadas`}>
              {x.blocos.map(b => <i key={b.id} style={{ top: `${((Math.max(ABRE, b.inicio) - ABRE) / DIA) * 100}%`, height: `${Math.max(3, ((Math.min(FECHA, b.fim) - Math.max(ABRE, b.inicio)) / DIA) * 100)}%` }} className={b.obrigatorio ? 'semana17__bloco semana17__bloco--fixo' : 'semana17__bloco'} title={b.rotulo} />)}
            </span>
            <span className="semana17__horas">{x.ocupado ? `${Math.round(x.ocupado / 60)} h` : 'livre'}</span>
            <span className="semana17__oque">{x.blocos.slice(0, 2).map(b => b.rotulo).join(' · ') || '—'}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ================================================================ História: a fita da vida */

const FASES = [{ ate: 2, nome: 'Bebê' }, { ate: 12, nome: 'Infância' }, { ate: 17, nome: 'Adolescência' }, { ate: 29, nome: 'Juventude' }, { ate: 59, nome: 'Vida adulta' }, { ate: 200, nome: 'Maturidade' }];
const COR_TEMA: Record<string, string> = { amor: '#c0395a', familia: '#b8653a', filhos: '#b8653a', nascimento: '#b8653a', trabalho: '#4b5bb5', estudo: '#2f6d5a', escola: '#2f6d5a', perda: '#4a4a4a', morte: '#4a4a4a', saude: '#7a5c8c', casa: '#8a6a2e', lugar: '#3d7a8c', dinheiro: '#6b8a2e', amizade: '#3d7a8c', lazer: '#c08a1e', escolha: '#8a8478', infancia: '#c08a1e' };

export function FitaDaVida({ vida }: { vida: Vida }) {
  const i = Math.max(1, idade(vida));
  const marcos = useMemo(() => {
    const ms = vida.biografia.filter(e => e.relevancia === 'marco');
    // Um por ano no máximo (o primeiro), para a fita não virar um borrão.
    const vistos = new Set<number>();
    return ms.filter(e => { if (vistos.has(e.idade)) return false; vistos.add(e.idade); return true; }).slice(-40);
  }, [vida]);
  const pct = (anos: number) => `${Math.min(100, (anos / i) * 100)}%`;
  let de = 0;
  return (
    <figure className="fita17" aria-label="A fita da vida">
      <div className="fita17__trilho">
        {FASES.map(f => { const ini = de; const fim = Math.min(i, f.ate + 1); de = f.ate + 1; return fim > ini ? <span key={f.nome} className="fita17__fase" style={{ left: pct(ini), width: `calc(${pct(fim)} - ${pct(ini)})` }}><span>{f.nome}</span></span> : null; })}
        {marcos.map(e => <span key={e.id} className="fita17__marco" style={{ left: pct(e.idade), background: COR_TEMA[e.tema] ?? '#8a8478' }} title={`${e.idade} anos (${anoDe(e.t)}): ${e.texto}`} tabIndex={0} aria-label={`${e.idade} anos: ${e.texto}`} />)}
        <span className="fita17__hoje" style={{ left: '100%' }} />
      </div>
      <div className="fita17__escala"><span>{anoDe(vida.eu.tNasc)}</span><span>{marcos.length} {marcos.length === 1 ? 'marco' : 'marcos'}</span><span>{anoDe(vida.t)} · {i} anos</span></div>
    </figure>
  );
}
