/**
 * VIDA 12.9 — O CALENDÁRIO DO ANO (Tempo → Agenda): os doze meses do ano que está passando, com as datas que importam —
 * o seu aniversário e o das pessoas próximas (com quantos anos fazem), as bodas, os feriados do país, a eleição, o fim
 * do curso, o mandato que acaba, o bebê que vem — e, nos meses que já viraram história, o que aconteceu (da Linha da
 * Vida, nada inventado). Não passa o tempo nem cria compromisso: é uma leitura das datas que o jogo já tem.
 */
import { useMemo, useState } from 'react';
import type { Vida } from '../../motor/tipos';
import { idade } from '../../motor/nucleo';
import { anoDe, mesDe, MESES } from '../../motor/tempo';
import { paisCorrente } from '../../motor/mundo/moeda';
import { proximaEleicao } from '../../motor/sistemas/politica';
import { gestacaoEmCurso } from '../../motor/sistemas/familia';
import { cursoOuNulo } from '../../motor/dados/cursos';
import '../cotidiano.css';

export type TipoDeData = 'aniversario' | 'meu' | 'bodas' | 'feriado' | 'eleicao' | 'estudo' | 'mandato' | 'bebe' | 'aconteceu';
export interface DataDoAno { mes: number; dia?: number; tipo: TipoDeData; texto: string; pessoaId?: string }

/** A Páscoa (algoritmo de Meeus/Jones/Butcher): o Carnaval é 47 dias antes. */
function pascoa(ano: number): Date {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}
function feriados(ano: number, pais: string): DataDoAno[] {
  const f = (mes: number, dia: number, texto: string): DataDoAno => ({ mes, dia, tipo: 'feriado', texto });
  if (pais !== 'BR') return [f(0, 1, 'Ano-novo'), f(11, 25, 'Natal')];
  const carnaval = new Date(pascoa(ano).getTime() - 47 * 86400000);
  const paixao = new Date(pascoa(ano).getTime() - 2 * 86400000);
  return [f(0, 1, 'Ano-novo'), f(carnaval.getUTCMonth(), carnaval.getUTCDate(), 'Carnaval'), f(paixao.getUTCMonth(), paixao.getUTCDate(), 'Sexta-feira Santa'), f(3, 21, 'Tiradentes'), f(4, 1, 'Dia do Trabalho'),
    f(8, 7, 'Independência'), f(9, 12, 'Nossa Senhora Aparecida'), f(10, 2, 'Finados'), f(10, 15, 'Proclamação da República'), f(10, 20, 'Consciência Negra'), f(11, 25, 'Natal')];
}

export function datasDoAno(v: Vida): DataDoAno[] {
  const ano = anoDe(v.t);
  const out: DataDoAno[] = [];
  const faz = (tNasc: number) => ano - anoDe(tNasc);
  if (!v.morte) out.push({ mes: mesDe(v.eu.tNasc), tipo: 'meu', texto: `Seu aniversário (${faz(v.eu.tNasc)} anos)` });
  // As pessoas que importam: a família, o par, os amigos próximos (vivos).
  for (const vin of Object.values(v.vinculos)) {
    const p = v.pessoas[vin.pessoaId];
    if (!p || !p.vivo || p.especie || !p.nome) continue;
    const perto = !!vin.parentesco || (vin.romance && vin.romance.estagio !== 'ex') || vin.proximidade >= 55;
    if (!perto || p.tNasc > v.t + 12) continue;
    const anos = faz(p.tNasc);
    if (anos >= 1) out.push({ mes: mesDe(p.tNasc), tipo: 'aniversario', texto: `${p.nome} faz ${anos} ${anos === 1 ? 'ano' : 'anos'}`, pessoaId: p.id });
    if (vin.romance?.estagio === 'casamento') {
      const n = ano - anoDe(vin.romance.tEstagio);
      if (n >= 1) out.push({ mes: mesDe(vin.romance.tEstagio), tipo: 'bodas', texto: `${n} ${n === 1 ? 'ano' : 'anos'} de casamento com ${p.nome}`, pessoaId: p.id });
    }
  }
  out.push(...feriados(ano, paisCorrente()));
  try {
    const e = proximaEleicao(v.t);
    if (e.ano === ano && idade(v) >= 16) out.push({ mes: mesDe(e.t), tipo: 'eleicao', texto: e.tipo === 'municipal' ? 'Eleição municipal' : 'Eleição geral' });
  } catch { /* país sem eleição no calendário */ }
  const m = v.educacao.matricula;
  if (m && !m.trancado && m.mesesRestantes <= 12 + (11 - mesDe(v.t))) out.push({ mes: Math.min(11, mesDe(v.t) + Math.max(0, m.mesesRestantes)), tipo: 'estudo', texto: `Fim do curso: ${cursoOuNulo(m.cursoId)?.nome ?? 'o curso'}` });
  const mand = v.caminhos?.politica?.mandato;
  if (mand && anoDe(mand.tFim) === ano) out.push({ mes: mesDe(mand.tFim), tipo: 'mandato', texto: 'Fim do mandato' });
  const g = gestacaoEmCurso(v);
  if (g && g.descoberta && anoDe(g.tParto) === ano) out.push({ mes: mesDe(g.tParto), tipo: 'bebe', texto: 'O bebê deve nascer' });
  // O que já aconteceu neste ano (a Linha da Vida: só o que importa).
  for (const e of v.biografia) if (anoDe(e.t) === ano && (e.relevancia === 'marco' || e.relevancia === 'biografia')) out.push({ mes: mesDe(e.t), tipo: 'aconteceu', texto: e.texto });
  return out.sort((a, b) => a.mes - b.mes || (a.dia ?? 0) - (b.dia ?? 0));
}

const ICONE: Record<TipoDeData, string> = { aniversario: '🎂', meu: '🎉', bodas: '💍', feriado: '📅', eleicao: '🗳️', estudo: '🎓', mandato: '🏛️', bebe: '👶', aconteceu: '•' };

export function Calendario({ vida, abrirPessoa }: { vida: Vida; abrirPessoa?: (id: string) => void }) {
  const datas = useMemo(() => datasDoAno(vida), [vida]);
  const agora = mesDe(vida.t);
  const [so, setSo] = useState<'tudo' | 'pessoas'>('tudo');
  const visiveis = so === 'pessoas' ? datas.filter(d => d.tipo === 'aniversario' || d.tipo === 'bodas' || d.tipo === 'meu') : datas;
  return (
    <section className="calendario" aria-labelledby="titulo-calendario">
      <h2 id="titulo-calendario" className="secao-fio">O ano de {anoDe(vida.t)}</h2>
      <p className="nota">As datas que importam neste ano — e o que já aconteceu. Um ano passa a cada rodada.</p>
      <div className="calendario__filtro" role="radiogroup" aria-label="Mostrar">
        {(['tudo', 'pessoas'] as const).map(x => <button key={x} type="button" role="radio" aria-checked={so === x} className={`escolha__item${so === x ? ' escolha__item--ativo' : ''}`} onClick={() => setSo(x)}>{x === 'tudo' ? 'Tudo' : 'Aniversários e datas de gente'}</button>)}
      </div>
      <ol className="calendario__meses">
        {MESES.map((nome, mes) => {
          const doMes = visiveis.filter(d => d.mes === mes);
          return (
            <li key={nome} className={`calendario__mes${mes === agora ? ' calendario__mes--agora' : ''}`} data-mes={mes}>
              <h3 className="calendario__nome">{nome.charAt(0).toUpperCase() + nome.slice(1)}</h3>
              {doMes.length === 0 ? <p className="nota calendario__vazio">—</p> : (
                <ul className="calendario__datas">
                  {doMes.map((d, k) => (
                    <li key={k} className={`calendario__data calendario__data--${d.tipo}`}>
                      <span aria-hidden className="calendario__icone">{ICONE[d.tipo]}</span>
                      <span>{d.dia ? <span className="calendario__dia">{d.dia}</span> : null}{d.pessoaId && abrirPessoa ? <button type="button" className="link" onClick={() => abrirPessoa(d.pessoaId!)}>{d.texto}</button> : d.texto}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
