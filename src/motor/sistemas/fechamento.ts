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
