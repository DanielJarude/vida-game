/**
 * REWORK 11 · MUS-02 / MUS-03 — o PAPEL na música e os DIREITOS da obra.
 *
 * Carreira solo, integrante de banda, instrumentista contratado por outros artistas e compositor eram o mesmo emprego.
 * Agora o papel muda a conta, sem sistema paralelo: o palco (`palco.temporadaDePalco`) lê o papel — o contratado tem
 * mais datas e é pago pelo mercado de quem contrata (não pelo nome próprio, com teto); o compositor tem poucas datas — e
 * os DIREITOS das obras lançadas são a renda recorrente dele (a obra pagava uma vez só, no lançamento).
 *
 * Estado mínimo e opcional: `caminhos.papelMusica` (escolhido pelo jogador); ausente, o papel é deduzido do que a vida
 * tem (a banda ativa, o emprego). Sem importar `cena`/`palco` (este módulo é lido pelo palco).
 */

import type { Vida } from '../tipos';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { escrever } from '../nucleo';

export type PapelMusica = 'solo' | 'banda' | 'contratado' | 'compositor';
export const PAPEIS_DA_MUSICA: PapelMusica[] = ['solo', 'banda', 'contratado', 'compositor'];

/** Vive de música agora (o trabalho principal ou o paralelo é da música). */
export function viveDeMusica(v: Vida): boolean {
  return [v.trabalho.atual, v.trabalho.paralela].some(e => { const tr = e ? ocupacaoOuNula(e.ocupacaoId)?.trilha : undefined; return tr === 'musica' || tr === 'orquestra'; });
}

/** O papel na música (o escolhido; ou o que a vida mostra). Fora da música: indefinido. */
export function papelNaMusica(v: Vida): PapelMusica | undefined {
  const banda = !!v.caminhos.arte?.ativo && v.caminhos.arte.linguagem === 'musica';
  if (!viveDeMusica(v) && !banda) return undefined;
  const escolhido = v.caminhos.papelMusica;
  // A banda acabou: quem era "da banda" passa a solo (o papel escolhido não sobrevive ao fim do grupo).
  if (escolhido === 'banda' && !banda) return 'solo';
  if (escolhido) return escolhido;
  if (banda) return 'banda';
  const id = v.trabalho.atual?.ocupacaoId;
  if (id === 'musico_orquestra' || id === 'musico_noite') return 'contratado';
  return 'solo';
}

export const NOME_DO_PAPEL: Record<PapelMusica, string> = { solo: 'carreira solo', banda: 'integrante de banda', contratado: 'instrumentista contratado', compositor: 'compositor' };
export const PORQUE_DO_PAPEL: Record<PapelMusica, string> = {
  solo: 'O nome é seu: o público cresce com você, e o ano magro também é seu.',
  banda: 'O palco é dividido — o público, as decisões e as brigas também.',
  contratado: 'Tocar para outros artistas: mais datas e cachê por data, sem público próprio — o nome cresce pouco.',
  compositor: 'Poucas datas; a renda vem dos direitos das músicas lançadas (e dos que gravam o que você escreve).'
};

export function disponibilidadePapelMusica(v: Vida, alvo?: string): Veredito {
  if (!viveDeMusica(v)) return bloqueio('impossivel', 'O papel na música é de quem vive de música.');
  if (!alvo || !PAPEIS_DA_MUSICA.includes(alvo as PapelMusica)) return bloqueio('impossivel', 'Esse papel não existe.');
  if (papelNaMusica(v) === alvo) return bloqueio('impossivel', 'Já é o seu papel.');
  if (alvo === 'banda' && !(v.caminhos.arte?.ativo && v.caminhos.arte.linguagem === 'musica')) return bloqueio('requisito', 'Integrante de banda pede uma banda em atividade.');
  if (alvo === 'compositor' && !(v.caminhos.obras ?? []).some(o => o.linguagem === 'musica')) return bloqueio('requisito', 'Viver de compor pede obra lançada: o catálogo é o que paga.');
  if (v.anoAtual.acoes.includes('papel_musica')) return bloqueio('incompativel', 'O rumo já mudou neste ano.');
  return PERMITIDO;
}

export function mudarPapelMusica(v: Vida, alvo: PapelMusica): string {
  v.anoAtual.acoes.push('papel_musica');
  v.caminhos.papelMusica = alvo;
  const texto = alvo === 'contratado' ? 'Passou a tocar contratado por outros artistas: a agenda dos outros, o cachê da data.'
    : alvo === 'compositor' ? 'Passou a viver mais de compor do que de subir ao palco.'
      : alvo === 'banda' ? 'Voltou a pôr a banda na frente da própria carreira.'
        : 'Assumiu a carreira solo: o nome na frente.';
  escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true });
  return `${texto} ${PORQUE_DO_PAPEL[alvo]}`;
}

/**
 * REWORK 11 · MUS-03 — os direitos das obras lançadas (mensal, reais de hoje): uma parte pequena do que a obra rendeu,
 * enquanto ela ainda é tocada/lida (até 15 anos, decaindo). Só a obra que achou público rende; o compositor vive mais disso.
 */
export function rendaDeDireitos(v: Vida): number {
  const obras = v.caminhos.obras ?? [];
  if (!obras.length) return 0;
  const fator = papelNaMusica(v) === 'compositor' ? 2.5 : 1;
  let soma = 0;
  for (const o of obras) {
    const idadeObra = (v.t - o.t) / 12;
    if (idadeObra < 1 || idadeObra > 15) continue;
    const publico = o.comercial ?? o.recepcao;
    if (publico < 1) continue;
    soma += o.renda * 0.08 * (1 - idadeObra / 15) * (o.linguagem === 'musica' ? fator : 1);
  }
  return Math.round(soma / 12 / 10) * 10;
}
