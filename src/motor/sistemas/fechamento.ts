/**
 * O fechamento do ano das carreiras especiais: esporte, arte, política,
 * negócio. Um momento editorial — poucos números, com o que eles mudaram —
 * derivado do estado do ano que acabou de passar (nada é guardado à parte).
 *
 * A Linha da Vida NÃO recebe isto: ela registra só o biográfico (a primeira
 * temporada, o título, a obra que marcou, a eleição). O resumo mora aqui,
 * e aparece na abertura do ano e na tela Trabalho.
 */

import type { Vida } from '../tipos';
import { anoDe } from '../tempo';
import { capitalizar, dinheiro as fmt } from '../texto';
import { perfilDe, semVinculo } from './perfisEsportivos';
import { divisaoDe, linhaDaTemporada, nomePosicao, palavraDaNota, palavraDaReputacao } from './esporte';
import { leituraDoNome } from './notoriedade';
import { leituraPolitica } from './politica';
import { negocioAberto } from './negocio';

export interface Fechamento { titulo: string; linhas: string[] }

const RECEPCAO = ['passou em branco', 'achou o seu público', 'repercutiu', 'marcou'];

export function fechamentoDoAno(v: Vida): Fechamento[] {
  const out: Fechamento[] = [];
  const ano = anoDe(v.t - 6);
  const e = v.caminhos.esporte;
  const t = e?.temporadas?.[e.temporadas.length - 1];
  if (e && t && t.ano === ano && e.fase !== 'base') {
    const linhas = [linhaDaTemporada(v, t), `${palavraDaNota(t.nota).charAt(0).toUpperCase() + palavraDaNota(t.nota).slice(1)} — no mercado: ${palavraDaReputacao(e.reputacao ?? 30, e.modalidade)}.`];
    if (e.fase === 'profissional') linhas.push(perfilDe(e.modalidade).estrutura === 'circuito' ? `O próximo ano é no ${divisaoDe(e.modalidade, e.nivel)}.` : e.espaco === 'titular' ? (perfilDe(e.modalidade).estrutura === 'equipe' ? 'A próxima temporada começa nas provas principais.' : 'A próxima temporada começa como titular.') : e.espaco === 'reserva' ? (perfilDe(e.modalidade).estrutura === 'equipe' ? 'A próxima temporada começa fora das provas principais.' : 'A próxima temporada começa no banco.') : `${capitalizar(semVinculo(e.modalidade))}, esperando proposta.`);
    { const nome = leituraDoNome(v); if (nome && nome.valor >= 30 && nome.origem === 'esporte') linhas.push(`Para o público: ${nome.frase}.`); }
    out.push({ titulo: `Temporada ${t.ano} — ${t.clube}${t.posicao ? ` · ${nomePosicao(v, t.posicao)}` : ''}`, linhas });
  }
  const obras = (v.caminhos.obras ?? []).filter(o => o.t > v.t - 12 && o.t <= v.t);
  const a = v.caminhos.arte;
  if (obras.length || v.caminhos.palco || (a?.ativo && (v.trabalho.atual?.clientela !== undefined || a.publico >= 30))) {
    const linhas = obras.map(o => `"${o.titulo}" ${RECEPCAO[o.recepcao]}${o.renda ? ` (rendeu ${fmt(o.renda)})` : ''}.`);
    const pl = v.caminhos.palco;
    if (pl && pl.ano === ano) linhas.push(pl.apresentacoes ? `${pl.apresentacoes} ${pl.linguagem === 'musica' ? 'shows' : 'apresentações'}, ${fmt(pl.bruto)} contratados; depois de equipe, produção e agência, ${fmt(pl.artista)} para você.` : 'Nenhuma apresentação paga no ano.');
    if (a?.ativo) linhas.push(`${a.nome}: público ${a.publico >= 70 ? 'grande' : a.publico >= 45 ? 'crescendo' : a.publico >= 20 ? 'pequeno e fiel' : 'ainda de amigos'}.`);
    if (!obras.length) linhas.push('Nenhum trabalho novo lançado neste ano.');
    out.push({ titulo: `A obra em ${ano}`, linhas });
  }
  const pol = v.caminhos.politica;
  if (pol?.mandato) {
    const l = leituraPolitica(v);
    if (l) out.push({ titulo: `${l.titulo} — ${ano}`, linhas: [l.etapa ?? '', `Nas ruas: ${l.aprovacao ?? '—'}. Base: ${l.apoio}.`, ...(pol.mandato.crise ? ['Há uma crise aberta no mandato.'] : [])] });
  }
  const n = negocioAberto(v);
  if (n && n.faturamentoAno !== undefined) {
    const r = n.resultadoAno ?? 0;
    out.push({ titulo: `${n.nome.charAt(0).toUpperCase() + n.nome.slice(1)} — ${ano}`, linhas: [`Faturou ${fmt(n.faturamentoAno)}; ${(n.lucroAno ?? 0) >= 0 ? `lucro de ${fmt(n.lucroAno ?? 0)}` : `prejuízo de ${fmt(-(n.lucroAno ?? 0))}`} antes da sua retirada.`, r >= 0 ? `Depois da retirada, sobrou ${fmt(r)} no caixa.` : `Faltou ${fmt(-r)} depois da retirada.`, n.estado === 'apertado' ? 'O negócio está apertado.' : n.estado === 'firme' ? 'O negócio está firme.' : 'O negócio ainda está começando.'] });
  }
  return out;
}

/** O que conta como conquista (o mesmo critério da sala de troféus da Linha da Vida). */
export const MARCAS_DE_CONQUISTA = new Set(['conquista', 'aprovacao', 'formacao', 'promocao', 'profissional', 'estreia', 'eleicao', 'lideranca', 'ingresso', 'primeiro_emprego', 'negocio_aberto']);

/**
 * REWORK 10.5 · EVT-06 — AS CONQUISTAS DO ANO: o prêmio, a promoção, a formatura, a aprovação, a estreia — o que pesou
 * (peso 2 ou 3) e aconteceu no ano que fechou. Antes, um concurso literário ganho só aparecia procurando na Linha da
 * Vida. Hierarquia: a decisão obrigatória abre por cima; a conquista vem no alto do ano que passou; o resultado das
 * carreiras, logo abaixo; o cotidiano, na biografia.
 */
export function conquistasDoAno(v: Vida): string[] {
  const vistos = new Set<string>();
  return v.caminhos.marcas.filter(m => MARCAS_DE_CONQUISTA.has(m.tipo) && m.peso >= 2 && m.t > v.t - 12 && m.t <= v.t)
    .sort((a, b) => b.peso - a.peso).map(m => m.texto).filter(t => (vistos.has(t) ? false : (vistos.add(t), true))).slice(0, 4);
}

const PESO_DA_SEMANA: Record<string, string> = { folgada: 'leve', ocupada: 'movimentada', cheia: 'exigente', sobrecarregada: 'pesada', alem: 'além do que se aguenta' };

/**
 * REWORK 9.5 · ROT-01 — a rotina do ano que fechou (a fotografia do ano, `FotoDoAno.rotina`: o que de fato foi). Só
 * aparece quando há o que dizer: a semana mudou de peso, passou do que se aguenta, teve conflito de horário, a
 * dedicação aos estudos não achou horário, ou a cabeça mudou de verdade.
 */
export function rotinaDoAno(v: Vida): Fechamento | undefined {
  const ev = v.evolucao ?? [];
  const f = ev[ev.length - 1];
  const r = f?.rotina;
  if (!f || !r || f.t < v.t - 12) return undefined;
  const antes = ev[ev.length - 2]?.rotina;
  const linhas: string[] = [];
  const peso = PESO_DA_SEMANA[r.faixa] ?? r.faixa;
  const mudou = antes && PESO_DA_SEMANA[antes.faixa] !== peso;
  if (mudou || r.faixa === 'sobrecarregada' || r.faixa === 'alem') linhas.push(`A semana foi ${peso}${mudou ? ` (no ano anterior, ${PESO_DA_SEMANA[antes!.faixa] ?? antes!.faixa})` : ''}.`);
  if (r.conflitos) linhas.push(r.conflitos === 1 ? 'Um conflito de horário ficou sem resolver: o que perdeu as horas não aconteceu inteiro.' : `${r.conflitos} conflitos de horário ficaram sem resolver.`);
  if (r.postura === 'dedicada' && r.estudo !== undefined && r.estudo < 0.99) linhas.push(r.estudo <= 0 ? 'A dedicação aos estudos não achou horário na semana: ficou na intenção.' : `Das horas de estudo em casa, ${Math.round(r.estudo * 100)}% acharam horário — a dedicação rendeu nessa medida.`);
  if (antes && Math.abs(r.estresse - antes.estresse) >= 12) linhas.push(`A cabeça ${r.estresse > antes.estresse ? 'pesou mais' : 'aliviou'}: o estresse foi de ${antes.estresse}% para ${r.estresse}%.`);
  return linhas.length ? { titulo: `A rotina em ${anoDe(v.t - 6)}`, linhas } : undefined;
}
