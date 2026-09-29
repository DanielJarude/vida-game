/**
 * Notoriedade: quanto o PÚBLICO conhece a pessoa.
 *
 * Quase toda vida passa inteira no anonimato — e está certo. A notoriedade
 * só nasce de um motivo: temporadas boas num clube grande, uma obra que
 * repercutiu, um mandato, um negócio que virou nome na cidade. Sobe mais
 * rápido do que cai (o nome fica um tempo depois do auge) e CAI quando o
 * motivo acaba.
 *
 *   anônimo → conhecido localmente → reconhecido → famoso → muito famoso
 *
 * Fonte única: `v.notoriedade`. Consumidores: patrocínio e publicidade
 * (`rendaDeImagem`, na conta), convites e entrevistas (`noto_convite`), a
 * porta da política (`portasDaPolitica`), a pressão na cabeça
 * (`pesoDaExposicao`), a exposição do que é privado (`exposicao`), a
 * Linha da Vida quando o nome muda de patamar.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Notoriedade, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { flex, ge } from '../texto';
import { sinalDoEstilo } from '../dados/estilo';

const FAIXAS = [10, 30, 55, 78];
const PALAVRAS = ['anônimo', 'conhecido localmente', 'reconhecido', 'famoso', 'muito famoso'];

export const faixaDaNotoriedade = (x: number) => FAIXAS.filter(f => x >= f).length;

/** A notoriedade em palavras (concordando com quem é). */
export function palavraDaNotoriedade(v: Vida, x = v.notoriedade?.valor ?? 0): string {
  const g = ge(v);
  const k = faixaDaNotoriedade(x);
  return [flex(g, 'anônimo', 'anônima', 'anônime'), flex(g, 'conhecido', 'conhecida', 'conhecide') + ' localmente', flex(g, 'reconhecido', 'reconhecida', 'reconhecide'), flex(g, 'famoso', 'famosa', 'famose'), flex(g, 'muito famoso', 'muito famosa', 'muito famose')][k] ?? PALAVRAS[k];
}

const ESCOPO_CARGO: Record<string, number> = { vereador: 0.45, prefeito: 0.7, deputado_estadual: 0.6, deputado_federal: 0.8, senador: 0.9, governador: 0.95 };
const PESO_DIVISAO = [0, 0.12, 0.28, 0.55, 0.85];

/** O que o público conheceria de você HOJE, pela vida que você tem (antes da inércia). */
export function alvoDaNotoriedade(v: Vida): { valor: number; fonte?: Notoriedade['fonte'] } {
  const cands: { valor: number; fonte: Notoriedade['fonte'] }[] = [];
  const e = v.caminhos.esporte;
  if (e?.fase === 'profissional' && !e.suspensoAte) {
    const rep = e.reputacao ?? 30;
    cands.push({ valor: rep * PESO_DIVISAO[e.nivel] * (e.espaco === 'titular' ? 1 : 0.6), fonte: 'esporte' });
  }
  const a = v.caminhos.arte;
  const obras = (v.caminhos.obras ?? []).filter(o => v.t - o.t <= 60);
  const marcou = obras.reduce((s, o) => s + (o.recepcao >= 3 ? 12 : o.recepcao === 2 ? 5 : 0), 0);
  const artista = (a?.ativo ? a.publico * 0.62 : 0) + Math.min(24, marcou);
  if (artista > 0) cands.push({ valor: artista, fonte: 'arte' });
  const p = v.caminhos.politica;
  if (p && p.fase !== 'encerrada') {
    const cargo = p.mandato?.cargo;
    cands.push({ valor: p.reputacao * (cargo ? ESCOPO_CARGO[cargo] ?? 0.5 : 0.35), fonte: 'politica' });
  }
  const n = v.caminhos.negocio;
  if (n && n.estado !== 'fechado') {
    const grande = (n.porte ?? 1) >= 3 ? 1 : (n.porte ?? 1) === 2 ? 0.5 : 0.2;
    cands.push({ valor: Math.max(0, (n.reputacao ?? 0) - 40) * grande * 0.7 + Math.max(0, (n.unidades ?? 1) - 1) * 4, fonte: 'negocio' });
  }
  const top = cands.sort((x, y) => y.valor - x.valor)[0];
  return top && top.valor >= 1 ? { valor: clamp(top.valor), fonte: top.fonte } : { valor: 0 };
}

/** O ano do nome: sobe depressa, cai devagar; a Linha da Vida registra quando muda de patamar. */
export function processarNotoriedade(v: Vida, _r?: Rng): void {
  const alvo = alvoDaNotoriedade(v);
  const antes = v.notoriedade?.valor ?? 0;
  if (antes === 0 && alvo.valor < 3) return;
  const vel = alvo.valor > antes ? 0.55 : 0.22;
  const valor = Math.round(clamp(antes + (alvo.valor - antes) * vel) * 10) / 10;
  if (valor < 1 && alvo.valor < 1) { v.notoriedade = undefined; return; }
  const pico = Math.max(v.notoriedade?.pico ?? 0, valor);
  v.notoriedade = { valor, pico, fonte: alvo.fonte ?? v.notoriedade?.fonte, t: v.t };
  const fa = faixaDaNotoriedade(antes);
  const fd = faixaDaNotoriedade(valor);
  // Subiu de patamar pela primeira vez: é biografia.
  if (fd > fa && fd >= 2 && v.fatos[`noto_faixa_${fd}`] === undefined) {
    v.fatos[`noto_faixa_${fd}`] = v.t;
    const de = alvo.fonte === 'esporte' ? 'pelo que fez em campo' : alvo.fonte === 'arte' ? 'pela obra' : alvo.fonte === 'politica' ? 'pela vida pública' : 'pelo negócio';
    const texto = fd >= 4 ? `Virou ${flex(ge(v), 'um nome', 'um nome', 'um nome')} que o país inteiro reconhece, ${de}.`
      : fd === 3 ? `Ficou ${flex(ge(v), 'famoso', 'famosa', 'famose')} ${de}: gente que você nunca viu sabe o seu nome.`
        : `Passou a ser ${flex(ge(v), 'reconhecido', 'reconhecida', 'reconhecide')} na rua ${de}.`;
    escrever(v, { texto, relevancia: fd >= 3 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom' });
  }
  // O nome esfriou de vez (depois de ter sido famoso).
  if (fa >= 3 && fd <= 1 && v.fatos['noto_esqueceu'] === undefined) {
    v.fatos['noto_esqueceu'] = v.t;
    escrever(v, { texto: 'O nome saiu das manchetes. De vez em quando, alguém ainda pergunta se você não é quem era.', relevancia: 'biografia', tema: 'trabalho' });
  }
}

/**
 * Patrocínio, publicidade, presença paga: só para quem tem nome E um motivo
 * de imagem (atleta, artista). Mensal, em reais. Entra na conta como linha
 * própria (`dinheiro.entradasProprias`).
 */
export function rendaDeImagem(v: Vida): number {
  const x = v.notoriedade?.valor ?? 0;
  if (x < 35) return 0;
  const fonte = v.notoriedade?.fonte;
  if (fonte !== 'esporte' && fonte !== 'arte') return 0;
  if (v.caminhos.esporte?.suspensoAte && v.t < v.caminhos.esporte.suspensoAte) return 0;
  // O esporte de alto nível paga imagem mais do que o palco paga publicidade (o palco tem cachê próprio: `palco`).
  // A imagem (como o público vê quem já é conhecido) mexe um pouco no que as marcas pagam.
  const im = imagemPublica(v);
  return Math.round(((x - 30) ** 2) * (fonte === 'esporte' ? 22 : 11) * (im?.fator ?? 1) / 100) * 100;
}

/* ------------------------------------------------------------ Imagem pública */

export type PalavraImagem = 'discreta' | 'querida' | 'marcante' | 'desgastada' | 'polêmica';

/**
 * Como o público vê quem JÁ é conhecido. Não existe para anônimos (e não é
 * uma segunda "fama"): deriva da notoriedade que existe, do que se tornou
 * público (um escândalo), do que a carreira entregou (a temporada, a obra,
 * a aprovação do mandato) — e, só aqui, do estilo (uma identidade visual
 * marcante; o luxo exibido). Consumidores: o patrocínio (`rendaDeImagem`),
 * a frase em Você.
 */
export function imagemPublica(v: Vida): { palavra: PalavraImagem; texto: string; fator: number } | undefined {
  const n = v.notoriedade;
  if (!n || n.valor < 20) return undefined;
  const escandalo = (v.segredos ?? []).some(s => s.publico && s.publico > 0 && v.t - s.publico <= 60);
  const pol = v.caminhos.politica;
  const desgaste = pol && pol.fase !== 'encerrada' && (pol.desgaste >= 60 || (pol.mandato?.aprovacao ?? 50) < 30);
  const t = v.caminhos.esporte?.temporadas?.slice(-1)[0];
  const obraBoa = (v.caminhos.obras ?? []).some(o => v.t - o.t <= 36 && o.recepcao >= 2);
  const querida = (t && t.nota >= 7.2) || obraBoa || (pol?.mandato && pol.mandato.aprovacao >= 65);
  const est = sinalDoEstilo(v);
  if (escandalo) return { palavra: 'polêmica', texto: 'O nome anda ligado a um escândalo: marcas se afastam, a rua comenta.', fator: 0.7 };
  if (desgaste) return { palavra: 'desgastada', texto: 'A imagem anda desgastada: o público cobra.', fator: 0.85 };
  if (est.marcante && n.valor >= 30) return { palavra: 'marcante', texto: `Um visual que o público reconhece de longe${est.luxo ? ' — e o luxo aparece nas fotos' : ''}.`, fator: querida ? 1.2 : 1.1 };
  if (querida) return { palavra: 'querida', texto: 'O público gosta do que vê: a fase é boa.', fator: 1.15 };
  return { palavra: 'discreta', texto: 'Conhecido pelo que faz, sem muito barulho em volta.', fator: 1 };
}

/** A pressão de ser visto: pesa na cabeça de quem é famoso. */
export function pesoDaExposicao(v: Vida): { texto: string; efeito: number } | undefined {
  const x = v.notoriedade?.valor ?? 0;
  if (x < 55) return undefined;
  return { texto: 'viver sendo reconhecido na rua (e comentado)', efeito: Math.round((x - 45) / 7) };
}
