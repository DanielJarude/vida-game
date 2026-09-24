/**
 * Cuidar: a trajetória que quase nunca aparece no currículo.
 *
 * Reduzir a jornada ou parar de trabalhar para cuidar de um filho pequeno,
 * de um pai que não se vira mais sozinho, de uma parceria doente — ou da
 * casa. Não é profissão, e o jogo não finge que é: é um pedaço da vida com
 * CUSTO (renda, carreira, tempo de contribuição, a semana inteira) e com
 * SENTIDO (a proximidade com quem é cuidado, a presença quando importa).
 *
 *   PARCIAL — a jornada cai (e o salário junto); a carreira anda devagar.
 *   TOTAL   — o trabalho pago para; o INSS também, a não ser que se pague
 *             como contribuinte facultativo (11% do mínimo, aprox.).
 *   VOLTAR  — quando a necessidade muda (a criança cresce, a pessoa melhora
 *             ou se vai), a vida pergunta. Voltar tem atrito: o tempo parado
 *             pesa na entrevista; alguém da antiga área às vezes indica.
 *
 * Nada aqui escolhe por gênero: a decisão é do jogador, e a parceria pode
 * ser quem reduz.
 */

import type { PausaDeCuidado, Vida } from '../tipos';
import { clamp } from '../rng';
import { escrever, filhos, idade, idadePessoa, marcarFato } from '../nucleo';
import { encerrarEmprego, nomeOcupacao, tetoSalarial } from './trabalho';
import { ocupacao } from '../dados/ocupacoes';
import { marcar } from './marcas';
import { abalar } from './abalo';
import { CUSTO_FACULTATIVO } from './renda';
import { novaOportunidade } from './oportunidades';
import { flex, ge } from '../texto';
import { anoDe } from '../tempo';

export { CUSTO_FACULTATIVO };

export function podeReduzir(v: Vida): true | string {
  const e = v.trabalho.atual;
  if (!e) return 'Sem trabalho para reduzir.';
  if (e.reduzida) return 'A jornada já está reduzida.';
  if (e.carga === 'parcial') return 'O trabalho já é de meio período.';
  if (e.contrato === 'militar') return 'A carreira militar não tem jornada reduzida.';
  if (e.formacaoAte) return 'Durante o curso de formação, não.';
  return true;
}

export function iniciarPausa(v: Vida, motivo: PausaDeCuidado['motivo'], intensidade: PausaDeCuidado['intensidade'], pessoaId?: string): void {
  if (v.trabalho.pausa) return; // uma pausa por vez: quem já cuida, segue cuidando
  const e = v.trabalho.atual;
  const p = pessoaId ? v.pessoas[pessoaId] : undefined;
  const quem = motivo === 'casa' ? 'da casa e da família' : p ? `de ${p.nome}` : motivo === 'filhos' ? 'dos filhos' : 'de quem precisava';
  if (intensidade === 'parcial' && e && podeReduzir(v) === true) {
    e.reduzida = true;
    e.salario = Math.round(e.salario * 0.6 / 10) * 10;
    if (e.clientela !== undefined) e.clientela = Math.round(e.clientela * 0.75);
    escrever(v, { texto: `Reduziu a jornada de ${nomeOcupacao(v, ocupacao(e.ocupacaoId))} para cuidar ${quem}. O salário encolheu junto.`, relevancia: 'marco', tema: 'familia', escolha: true, pessoas: p ? [p.id] : undefined });
  } else {
    if (e) encerrarEmprego(v, 'parou para cuidar');
    escrever(v, { texto: e ? `Parou de trabalhar para cuidar ${quem}.` : `Passou a cuidar ${quem} em tempo integral.`, relevancia: 'marco', tema: 'familia', escolha: true, pessoas: p ? [p.id] : undefined });
    intensidade = 'total';
  }
  v.trabalho.desempregadoDesde = undefined;
  v.trabalho.pausa = { motivo, pessoaId, tInicio: v.t, intensidade };
  marcar(v, 'pausa', intensidade === 'total' ? `Pausa no trabalho para cuidar ${quem}.` : `Jornada reduzida para cuidar ${quem}.`, 3, { pessoaId });
  v.fatos['pausas_de_cuidado'] = (v.fatos['pausas_de_cuidado'] ?? 0) + 1;
}

/** Encerra a pausa: a jornada volta, ou começa a procura. */
export function encerrarPausa(v: Vida, voltar: 'procurar' | 'estudar' | 'nao_voltar'): void {
  const pa = v.trabalho.pausa;
  if (!pa) return;
  const anos = Math.max(1, Math.round((v.t - pa.tInicio) / 12));
  v.trabalho.pausa = undefined;
  const e = v.trabalho.atual;
  if (e?.reduzida) {
    e.reduzida = false;
    e.salario = Math.round(Math.min(tetoSalarial(e), e.salario / 0.6) / 10) * 10;
    escrever(v, { texto: `Voltou à jornada inteira depois de ${anos} ${anos === 1 ? 'ano' : 'anos'} reduzida.`, relevancia: 'biografia', tema: 'trabalho' });
    marcar(v, 'retorno', 'Voltou à jornada inteira.', 2);
    return;
  }
  if (voltar === 'nao_voltar') { marcarFato(v, 'ficou_em_casa'); return; }
  v.trabalho.desempregadoDesde = v.t;
  const texto = `Depois de ${anos} ${anos === 1 ? 'ano' : 'anos'} cuidando, decidiu voltar ao mercado${voltar === 'estudar' ? ' — primeiro, estudando' : ''}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'retorno', texto, 3);
  marcarFato(v, 'voltou_ao_mercado');
  if (voltar === 'estudar') v.fatos['plano_estudar'] = v.t;
  // Quem já teve estrada às vezes é lembrado por alguém da área.
  const ultimo = v.trabalho.historico[v.trabalho.historico.length - 1];
  if (ultimo && voltar === 'procurar') {
    const oc = ocupacao(ultimo.ocupacaoId);
    if (!oc.concurso && !oc.entrada && !oc.formacaoInicial) novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: oc.id, meses: 12, chave: 'retorno', bonus: 0.2, titulo: 'Uma porta na antiga área', texto: `Uma ex-colega soube que você quer voltar e disse que ${ultimo.empregador.replace(/^(um|uma) /, 'um lugar como ')} está contratando para ${nomeOcupacao(v, oc)}.` });
  }
}

/** O ano de quem cuida: o INSS facultativo, a proximidade, e a hora de pensar em voltar. */
export function processarPausa(v: Vida): void {
  const pa = v.trabalho.pausa;
  if (!pa) return;
  if (pa.facultativo) v.trabalho.contribuicao += 12;
  const p = pa.pessoaId ? v.pessoas[pa.pessoaId] : undefined;
  const vin = p ? v.vinculos[p.id] : undefined;
  if (vin && p?.vivo) { vin.proximidade = clamp(vin.proximidade + 4); vin.tUltimoContato = v.t; }
  if (pa.motivo === 'filhos') for (const f of filhos(v)) if (idadePessoa(v, f) < 12 && v.vinculos[f.id]?.convivio.includes('casa')) v.vinculos[f.id].proximidade = clamp(v.vinculos[f.id].proximidade + 3);
  const anos = (v.t - pa.tInicio) / 12;
  // A necessidade mudou? Então a vida pergunta.
  const pequenos = filhos(v).filter(f => idadePessoa(v, f) < 5 && v.vinculos[f.id]?.convivio.includes('casa')).length;
  const mudou = (pa.motivo === 'filhos' && pequenos === 0 && anos >= 2)
    || ((pa.motivo === 'pais' || pa.motivo === 'parceiro' || pa.motivo === 'familiar') && (!p?.vivo || (p.saude >= 62 && anos >= 1)))
    || (pa.motivo === 'casa' && anos >= 4 && anos % 4 < 1);
  if (mudou && v.fatos['pausa_voltar'] === undefined && idade(v) < 64) v.fatos['pausa_voltar'] = v.t;
  if (p && !p.vivo && !v.fatos[`cuidou_ate_o_fim_${p.id}`]) {
    v.fatos[`cuidou_ate_o_fim_${p.id}`] = v.t;
    escrever(v, { texto: `Cuidou de ${p.nome} até o fim.`, relevancia: 'marco', tema: 'familia', pessoas: [p.id] });
  }
  // Quem tinha uma carreira de que gostava sente falta dela, com os anos.
  const estrada = Math.max(0, ...Object.values(v.trabalho.experiencia));
  if (pa.intensidade === 'total' && anos >= 3 && estrada >= 120 && !v.fatos['sentiu_falta_trabalho']) {
    v.fatos['sentiu_falta_trabalho'] = v.t;
    abalar(v, 'a falta do trabalho de antes', -4, 2);
  }
}

/** Em palavras (para Trabalho e Você). */
export function leituraDaPausa(v: Vida): string | undefined {
  const pa = v.trabalho.pausa;
  if (!pa) return undefined;
  const p = pa.pessoaId ? v.pessoas[pa.pessoaId] : undefined;
  const quem = pa.motivo === 'casa' ? 'da casa e da família' : p ? `de ${p.nome}` : ({ filhos: 'dos filhos', pais: 'de quem é da família', parceiro: 'da parceria', familiar: 'de quem é da família', casa: 'da casa' } as const)[pa.motivo];
  const inss = pa.intensidade === 'total' ? (pa.facultativo ? ' O INSS segue, pago como facultativo.' : ' O tempo de contribuição do INSS parou.') : '';
  return pa.intensidade === 'total' ? `Sem trabalho pago desde ${anoDe(pa.tInicio)}: cuidando ${quem}.${inss}` : `Jornada reduzida para cuidar ${quem}.`;
}

export { flex, ge };
