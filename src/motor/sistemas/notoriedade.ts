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
import type { FonteDoNome, Notoriedade, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { flex, ge } from '../texto';
import { sinalDoEstilo } from '../dados/estilo';
import { ocupacaoOuNula } from '../dados/ocupacoes';

/** Trilhas em que o trabalho, por si, põe o nome na frente do público. */
const TRILHAS_DE_NOME = new Set(['cena', 'musica', 'danca', 'conteudo', 'literatura']);

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

/**
 * O que cada motivo daria de nome HOJE (antes da inércia). A carreira em
 * curso é o motivo principal; uma carreira que acabou deixa um LEGADO
 * proporcional ao que ficou registrado (títulos, seleção, obras que
 * marcaram) — o campeão do mundo não volta a ser anônimo quando para.
 */
export function candidatosDaNotoriedade(v: Vida): { valor: number; fonte: FonteDoNome }[] {
  const cands: { valor: number; fonte: FonteDoNome }[] = [];
  const e = v.caminhos.esporte;
  // O palmarés e a seleção também põem o nome na frente do público (não só a divisão).
  const pal = v.caminhos.palmares ?? [];
  const recentes = pal.filter(x => v.t - x.t <= 36);
  const sel = e?.selecao;
  const daSelecao = sel && sel.tUltima !== undefined && v.t - sel.tUltima <= 24 ? 10 + Math.min(10, sel.jogos / 3) : 0;
  const conquistas = Math.min(10, recentes.filter(x => x.tipo === 'premio' || (x.tipo === 'titulo' && x.papel === 'protagonista' && /Série A|elite/.test(x.competicao))).length * 4);
  if (e?.fase === 'profissional' && !e.suspensoAte) {
    const rep = e.reputacao ?? 30;
    cands.push({ valor: rep * PESO_DIVISAO[e.nivel] * (e.espaco === 'titular' ? 1 : 0.6) + daSelecao + conquistas, fonte: 'esporte' });
  } else if (pal.length) {
    // O legado: o que ficou registrado, não o que se fazia. Seleção, títulos da elite, prêmios, torneios de seleções.
    const legado = Math.min(10, (sel?.jogos ?? 0) / 4) + (sel?.capitao ? 6 : 0) + pal.filter(x => x.tipo === 'selecao' && /^Campe/.test(x.texto)).length * 14
      + Math.min(12, pal.filter(x => x.tipo === 'titulo' && /Série A|elite/.test(x.competicao) && x.papel === 'protagonista').length * 4) + Math.min(8, pal.filter(x => x.tipo === 'premio').length * 2);
    if (legado > 0) cands.push({ valor: legado, fonte: 'esporte' });
  }
  const a = v.caminhos.arte;
  const obras = (v.caminhos.obras ?? []).filter(o => v.t - o.t <= 60);
  const marcou = obras.reduce((s, o) => s + (o.recepcao >= 3 ? 12 : o.recepcao === 2 ? 5 : 0), 0);
  // O trabalho artístico (principal ou em paralelo) e o currículo recente também dão nome — não só o grupo.
  const freguesia = [v.trabalho.atual, v.trabalho.paralela].reduce((m, x) => {
    const oc = x ? ocupacaoOuNula(x.ocupacaoId) : undefined;
    if (!oc || !TRILHAS_DE_NOME.has(oc.trilha)) return m;
    const base = x!.clientela ?? (oc.nivel >= 5 ? 70 : 40);
    return Math.max(m, base * (x === v.trabalho.paralela ? 0.3 : 0.45));
  }, 0);
  const trabalhos = (v.caminhos.curriculo ?? []).filter(x => v.t - x.t <= 60).reduce((s2, x) => s2 + (x.repercussao >= 3 ? 10 : x.repercussao === 2 ? 4 : 0) + (['novela', 'filme', 'serie'].includes(x.tipo) ? 3 : 0), 0);
  // O legado da obra: o que marcou de verdade continua sendo lembrado (menos que o trabalho em curso).
  const legadoArte = Math.min(16, (v.caminhos.obras ?? []).filter(o => o.recepcao >= 3).length * 5 + (v.caminhos.curriculo ?? []).filter(x => x.repercussao >= 3).length * 3);
  const artista = Math.max(a?.ativo ? a.publico * 0.62 : 0, freguesia, legadoArte) + Math.min(24, marcou) + Math.min(18, trabalhos);
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
  return cands.map(c => ({ valor: clamp(c.valor), fonte: c.fonte }));
}

/** O que o público conheceria de você HOJE, pela vida que você tem (antes da inércia). */
export function alvoDaNotoriedade(v: Vida): { valor: number; fonte?: Notoriedade['fonte'] } {
  const top = candidatosDaNotoriedade(v).sort((x, y) => y.valor - x.valor)[0];
  return top && top.valor >= 1 ? { valor: clamp(top.valor), fonte: top.fonte } : { valor: 0 };
}

/**
 * Por que o público conhece você: o motivo que mais deu nome na vida
 * (`origens`), não o trabalho de agora. Saves de antes: a fonte guardada.
 */
export function origemDoNome(v: Vida): FonteDoNome | undefined {
  const n = v.notoriedade;
  if (!n) return undefined;
  const o = Object.entries(n.origens ?? {}) as [FonteDoNome, number][];
  return o.length ? o.sort((a, b) => b[1] - a[1])[0][0] : n.fonte;
}

/**
 * O nome que conta numa área (o cachê da atriz, o salário do atleta): o
 * público que conhece você POR aquilo — pela origem do nome ou pelo que o
 * alimenta agora. Trocar de trabalho não apaga o nome do palco.
 */
export function nomePor(v: Vida, f: FonteDoNome): number {
  const n = v.notoriedade;
  return n && (n.fonte === f || origemDoNome(v) === f) ? n.valor : 0;
}

/** "pelo futebol", "pela atuação", "pela vida pública", "pelos negócios" — a origem, em palavras. */
export function porOrigem(v: Vida, f: FonteDoNome | undefined = origemDoNome(v)): string {
  if (f === 'esporte') { const d = v.caminhos.esporte?.modalidade; return d === 'futebol' ? 'pelo futebol' : d === 'volei' ? 'pelo vôlei' : d === 'basquete' ? 'pelo basquete' : d === 'tenis' ? 'pelo tênis' : 'pelo esporte'; }
  if (f === 'arte') return 'pela obra e pelos trabalhos';
  if (f === 'politica') return 'pela vida pública';
  if (f === 'negocio') return 'pelo negócio';
  // Sucessão: sem nome próprio, o que o público conhece é o sobrenome — a associação com quem veio antes (nunca o mérito dela).
  const antes = [...(v.linhagem?.geracoes ?? [])].reverse().find(g => (g.notoriedade?.pico ?? 0) >= 25);
  if (!f && antes) { const g = v.eu.tratamento ?? v.eu.genero; return `por ser ${g === 'masculino' ? 'filho' : g === 'feminino' ? 'filha' : 'filhe'} de ${antes.nome} ${antes.sobrenome}`; }
  return '';
}

/**
 * A leitura do nome para TODAS as telas (Você, Política, Trabalho, a
 * biografia): a notoriedade pública, a origem, e se o nome é do passado.
 * Uma tela não pode dizer "famoso" e outra "pouco conhecido" sobre a mesma
 * coisa: a Política diz o nome DAQUI e a presença política à parte.
 */
export function leituraDoNome(v: Vida): { valor: number; palavra: string; origem?: FonteDoNome; por: string; passado: boolean; frase: string } | undefined {
  const n = v.notoriedade;
  if (!n || n.valor < 10) return undefined;
  const origem = origemDoNome(v);
  const por = porOrigem(v, origem);
  const passado = notoriedadeDoPassado(v);
  const palavra = palavraDaNotoriedade(v);
  return { valor: n.valor, palavra, origem, por, passado, frase: `${palavra} ${por}${passado ? ' — o público ainda lembra; sem exposição, o nome esfria devagar' : ''}` };
}

/** A notoriedade vem de uma vida que não está mais em curso (a carreira pausou, acabou): "de quem já foi conhecido". */
export function notoriedadeDoPassado(v: Vida): boolean {
  const n = v.notoriedade;
  if (!n || n.valor < 10) return false;
  const alvo = alvoDaNotoriedade(v);
  return alvo.valor < n.valor * 0.5;
}

/** O ano do nome: sobe depressa, cai devagar; a Linha da Vida registra quando muda de patamar. */
export function processarNotoriedade(v: Vida, _r?: Rng): void {
  const cands = candidatosDaNotoriedade(v);
  const alvo = alvoDaNotoriedade(v);
  const antes = v.notoriedade?.valor ?? 0;
  if (antes === 0 && alvo.valor < 3) return;
  // A origem do nome persiste (o pico que cada motivo já deu); saves de antes começam pela fonte guardada.
  const origens: Partial<Record<FonteDoNome, number>> = { ...(v.notoriedade?.origens ?? (v.notoriedade?.fonte ? { [v.notoriedade.fonte]: v.notoriedade.pico } : {})) };
  // O nome sobe depressa e cai devagar — mais devagar quando a ORIGEM é o palco ou o campo (o público lembra), mesmo
  // que hoje a pessoa faça outra coisa. Trocar de trabalho não zera ninguém.
  const marca = (Object.entries(origens) as [FonteDoNome, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? v.notoriedade?.fonte;
  const vel = alvo.valor > antes ? 0.55 : marca === 'arte' || marca === 'esporte' ? 0.14 : 0.22;
  const valor = Math.round(clamp(antes + (alvo.valor - antes) * vel) * 10) / 10;
  if (valor < 1 && alvo.valor < 1) { v.notoriedade = undefined; return; }
  const pico = Math.max(v.notoriedade?.pico ?? 0, valor);
  for (const c of cands) if (c.valor >= 1) origens[c.fonte] = Math.round(Math.max(origens[c.fonte] ?? 0, Math.min(c.valor, valor + 0.01)) * 10) / 10;
  // A fonte de agora: o que alimenta o nome este ano (um motivo fraco não rouba a fonte de um nome grande).
  const fonte = alvo.fonte && alvo.valor >= Math.min(5, valor * 0.25) ? alvo.fonte : v.notoriedade?.fonte ?? alvo.fonte;
  v.notoriedade = { valor, pico, fonte, t: v.t, origens };
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
  // A imagem que as marcas compram é a da ORIGEM do nome (o ex-jogador ainda vende chuteira; o político, não — o mandato fecha essa porta).
  const fonte = origemDoNome(v);
  if (fonte !== 'esporte' && fonte !== 'arte') return 0;
  if (v.caminhos.politica?.mandato) return 0;
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
  // O que a própria pessoa fez com a visibilidade (`visibilidade`): uma frase que pegou mal; uma causa, uma entrevista boa.
  const polemica = v.fatos['vis_polemica'] !== undefined && v.t - v.fatos['vis_polemica'] <= 24;
  const boa = v.fatos['vis_boa'] !== undefined && v.t - v.fatos['vis_boa'] <= 24;
  if (escandalo) return { palavra: 'polêmica', texto: 'O nome anda ligado a um escândalo: marcas se afastam, a rua comenta.', fator: 0.7 };
  if (polemica && !boa) return { palavra: 'polêmica', texto: 'Uma fala sua virou polêmica: a rua ainda comenta.', fator: 0.8 };
  if (desgaste) return { palavra: 'desgastada', texto: 'A imagem anda desgastada: o público cobra.', fator: 0.85 };
  if (est.marcante && n.valor >= 30) return { palavra: 'marcante', texto: `Um visual que o público reconhece de longe${est.luxo ? ' — e o luxo aparece nas fotos' : ''}.`, fator: querida ? 1.2 : 1.1 };
  if (querida || boa) return { palavra: 'querida', texto: boa && !querida ? 'O público gosta do que vê: o que você fez com o nome ajudou.' : 'O público gosta do que vê: a fase é boa.', fator: 1.15 };
  return { palavra: 'discreta', texto: 'Conhecido pelo que faz, sem muito barulho em volta.', fator: 1 };
}

/** A pressão de ser visto: pesa na cabeça de quem é famoso. */
export function pesoDaExposicao(v: Vida): { texto: string; efeito: number } | undefined {
  const x = v.notoriedade?.valor ?? 0;
  if (x < 55) return undefined;
  // Um ano de privacidade escolhida (`visibilidade`) alivia — sem apagar o que é ser conhecido.
  const recolhido = v.fatos['vis_privacidade'] !== undefined && v.t - v.fatos['vis_privacidade'] <= 12;
  return { texto: recolhido ? 'ser reconhecido na rua (menos, num ano de recolhimento)' : 'viver sendo reconhecido na rua (e comentado)', efeito: Math.round((x - 45) / 7 * (recolhido ? 0.5 : 1)) };
}
