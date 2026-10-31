/**
 * REWORK 12.35 · PODER E POLÍTICA INTERNA — quem manda pode deixar de mandar; quem está embaixo tem interesse próprio.
 *
 *   O COMANDO     o apoio de quem está dentro (a união, a lealdade do quadro, os resultados, a pressão, o desgaste) é
 *                 medido todo ano. Com pouco apoio e alguém ambicioso por perto, vem a contestação — negociar, dividir,
 *                 chamar os antigos, afastar o desafiante, ceder o comando. Sem apoio nenhum, o comando cai sozinho: não
 *                 dá para mandar para sempre sem consequência.
 *   SUBORDINADOS  quem está abaixo de você tem lealdade, ambição e o que acha de você — e responde ao que se faz com ele:
 *                 promover, cobrar, proteger quando é preso, afastar. Quem foi bem tratado segura a casa; quem foi
 *                 humilhado e é ambicioso é o próximo desafiante.
 *   TRAIÇÃO       com motivo, nunca sorteio solto: o preso que não deve nada à casa fala (a delação pesa nas provas); quem
 *                 perdeu a fé e quer subir vai para a rival, levando o que sabe.
 *   BOATOS        "fulano está falando com a polícia": às vezes é verdade, às vezes não. A fonte tem credibilidade (o
 *                 informante de confiança, o boato de corredor) — e agir sobre um boato falso também tem preço.
 *   RAROS         a aliança inesperada, a rival que pede socorro, o chefe que some, o comando oferecido, o aliado que paga a
 *                 defesa, a paz que ninguém esperava — com condição, intervalo e memória.
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { MembroDaOrg, OrgViva, RelacaoComOrganizacao, Vida } from '../tipos';
import { escrever } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { contrair, dinheiro, flex } from '../texto';
import { vereditoDePagar } from './dinheiro';
import { preso } from './justica';
import { ativo, moita } from './ilicito';
import { anotar, contatosAtivos, lembrarOrg } from './submundo';
import { pagarPorFora } from './porFora';
import { medir } from './extrato';
import { pagar } from './dinheiro';
import { valorDeFavor } from './redeCriminal';
import { economiaLocal } from '../dados/lugares';
import { abrirDisputa, ambicaoDoMembro, custoDeComando, definirEstado, definirNivel, deDentro, estadoEntre, historia, jeitoDe, lealdadeDoMembro, lider, nivelDe, nomeDoNivel, orgViva, orgsDaCidade, parteDoAno, rachar, relacaoCom } from './faccoes';
import { ameacarFamilia, casoPorId, fecharCaso, minhaOrg, novoCaso } from './conflitosCriminais';

const env = (v: Vida) => v.caminhos.envolvimento;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 100) * 100;
const ult = (v: Vida, tipo: string) => [...(env(v)?.casos ?? [])].reverse().find(x => x.tipo === tipo);
const ele = (m: MembroDaOrg) => flex(m.genero, 'ele', 'ela', 'elu');

/** Quem está abaixo de você na organização (os ativos de posto menor; os presos também, para a proteção). */
export function subordinados(v: Vida, o: OrgViva, rel: RelacaoComOrganizacao): MembroDaOrg[] {
  const n = nivelDe(v, rel);
  return o.quadro.filter(m => (m.estado === 'ativo' || m.estado === 'preso') && m.nivel < n && m.nivel < 6).sort((a, b) => b.nivel - a.nivel);
}

/* ================================================================ o ano */

export function processarPoderInterno(v: Vida): void {
  const e = env(v);
  if (!e || preso(v) || !ativo(v) || v.morte) return;
  const r = rngDe(v.id, 'poder', v.t);
  apoioDoComando(v, r);
  traicoesDoAno(v, r);
  boatosDoAno(v, r);
  acontecimentosRaros(v, r);
}

/* ---------------------------------------------------------------- o comando contestável */

/** O apoio que o seu comando tem dentro (0..100): a união, a lealdade do quadro, os resultados, a pressão, o desgaste. */
export function apoioAoComando(v: Vida, o: OrgViva, rel: RelacaoComOrganizacao): number {
  const subs = subordinados(v, o, rel).filter(m => m.estado === 'ativo');
  const media = subs.length ? subs.reduce((s, m) => s + lealdadeDoMembro(m) * 0.7 + 50 * 0.3 + (m.comVoce ?? 0) * 0.15, 0) / subs.length : 55;
  const resultados = clamp(50 + (o.forca - (o.forcaAntes ?? o.forca)) * 3, 0, 100);
  const desde = rel.memoria.find(m => m.fato === 'alianca' && nivelDe(v, rel) >= 6)?.t ?? rel.desde;
  const desgaste = Math.max(0, (v.t - desde) / 12 - 6) * 1.2;
  const recuou = v.fatos['recuou_na_guerra'] !== undefined && v.t - v.fatos['recuou_na_guerra'] <= 12 ? 8 : 0;
  return clamp(Math.round(0.35 * o.coesao + 0.35 * media + 0.3 * resultados - Math.max(0, o.pressao - 50) / 3 - desgaste - recuou));
}

function apoioDoComando(v: Vida, r: Rng): void {
  const m = minhaOrg(v);
  if (!m || !(m.rel.propria || m.n >= 6)) { for (const rel of deDentro(v)) { const o = orgViva(v, rel.id); if (o) o.forcaAntes = o.forca; } return; }
  const { o, rel } = m;
  const apoio = apoioAoComando(v, o, rel);
  o.apoio = apoio;
  o.forcaAntes = o.forca;
  const recente = ult(v, 'contestacao');
  if (recente && v.t - recente.t < 24) return;
  // Sem apoio nenhum, o comando cai sozinho.
  if (apoio < 22) { deposto(v, r, o, rel, 'perdeu o apoio de quem mandava junto'); return; }
  if (apoio >= 48) return;
  const desafiante = subordinados(v, o, rel).filter(x => x.estado === 'ativo' && x.nivel >= 4 && ambicaoDoMembro(x) >= 0.45 && lealdadeDoMembro(x) < 58)
    .sort((a, b) => ambicaoDoMembro(b) * (100 - lealdadeDoMembro(b)) - ambicaoDoMembro(a) * (100 - lealdadeDoMembro(a)))[0];
  if (!desafiante || !r.chance(clamp((0.3 + (48 - apoio) / 50) * jeitoDe(o).contesta, 0.05, 0.9))) return;
  novoCaso(v, 'sub1235_contestacao', { tipo: 'contestacao', situacao: 'desafio', orgId: o.id, membroId: desafiante.id });
}

/** O comando cai: no próprio grupo, ele racha; numa organização de que se é de dentro, outro passa a mandar. */
function deposto(v: Vida, r: Rng, o: OrgViva, rel: RelacaoComOrganizacao, porque: string, quemId?: string): string {
  const quem = (quemId ? o.quadro.find(x => x.id === quemId) : undefined) ?? subordinados(v, o, rel).filter(x => x.estado === 'ativo').sort((a, b) => b.nivel - a.nivel || ambicaoDoMembro(b) - ambicaoDoMembro(a))[0];
  let texto: string;
  if (rel.propria) {
    if (quem) rachar(v, o, quem.id, false);
    o.coesao = clamp(o.coesao - 10);
    texto = quem ? `${quem.nome} saiu com gente sua e fundou outro grupo: o seu ficou menor.` : 'O grupo se esvaziou: gente sua foi embora.';
  } else {
    definirNivel(v, rel, 5);
    if (quem) { quem.nivel = 6; quem.comVoce = clamp((quem.comVoce ?? 0) - 10, -100, 100); }
    lembrarOrg(rel, v.t, 'conflito', -6);
    texto = `Você perdeu o comando de ${o.nome}${quem ? `: agora quem manda é ${quem.nome}` : ''}. Você ficou como ${nomeDoNivel(o, 5)}.`;
  }
  historia(o, v.t, `O comando mudou de mãos (${porque}).`);
  v.fatos['perdeu_comando'] = v.t;
  v.fatos['comandos_perdidos'] = (v.fatos['comandos_perdidos'] ?? 0) + 1;
  anotar(v, texto, 'ruim');
  escrever(v, { texto: contrair(texto), relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  void r;
  return texto;
}

export type EscolhaDaContestacao = 'negociar' | 'dividir' | 'conselho' | 'afastar' | 'ceder';
export const ROTULO_DA_CONTESTACAO: Record<EscolhaDaContestacao, string> = {
  negociar: 'Negociar: dar mais a quem contesta', dividir: 'Dividir o comando: uma área para quem contesta', conselho: 'Chamar os antigos para decidir',
  afastar: 'Afastar quem contesta', ceder: 'Ceder o comando com honra'
};
export function escolhasDaContestacao(v: Vida, orgId: string): EscolhaDaContestacao[] {
  const rel = env(v)?.organizacoes?.find(x => x.id === orgId);
  return rel?.propria ? ['negociar', 'dividir', 'conselho', 'afastar'] : ['negociar', 'dividir', 'conselho', 'afastar', 'ceder'];
}
const custoDaNegociacao = (v: Vida, o: OrgViva, rel: RelacaoComOrganizacao) => Math.max(custoDeComando(v, o), Math.round((rel.propria ? custoDeComando(v, o) * 2 : parteDoAno(v, o, 6) * 0.25) / 100) * 100);
export function pesoDaContestacao(v: Vida, orgId: string, x: EscolhaDaContestacao): string {
  const o = orgViva(v, orgId)!, rel = env(v)!.organizacoes!.find(y => y.id === orgId)!;
  switch (x) {
    case 'negociar': return `Uns ${dinheiro(custoDaNegociacao(v, o, rel))}. Costuma acalmar — por um tempo.`;
    case 'dividir': return 'Você manda menos (e ganha menos por uns anos); a casa fica em paz.';
    case 'conselho': return `Os antigos decidem. Com a casa unida (${o.coesao}) e o seu nome, pode dar certo; se não der, você cai.`;
    case 'afastar': return `Quem contesta sai. Pode sair levando gente${jeitoDe(o).contesta > 1.2 ? ' — e aqui isso é comum' : ''}.`;
    case 'ceder': return `Você deixa o comando e fica como ${nomeDoNivel(o, 5)}: menos dinheiro, menos exposição, nenhuma guerra.`;
  }
}

export function resolverContestacao(v: Vida, casoId: string, x: EscolhaDaContestacao): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const o = orgViva(v, caso.orgId!)!;
  const rel = e.organizacoes!.find(y => y.id === o.id)!;
  const m = o.quadro.find(y => y.id === caso.membroId);
  const r = rngDe(v.id, 'contestacao', caso.id, x);
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  if (!m || m.estado !== 'ativo') return { texto: fecharCaso(v, caso, x, ['Quem contestava já não está mais na casa. O assunto morreu.']) };
  switch (x) {
    case 'negociar': {
      const custo = custoDaNegociacao(v, o, rel);
      pagarPorFora(v, 'custos', custo);
      if (r.chance(clamp(0.55 + o.coesao / 300, 0.3, 0.9))) {
        m.lealdade = clamp(lealdadeDoMembro(m) + 20); m.comVoce = clamp((m.comVoce ?? 0) + 20, -100, 100);
        res.push(`${m.nome} aceitou o que você ofereceu (${dinheiro(custo)}). Por enquanto, o comando é seu.`);
        tom = 'bom';
      } else {
        m.lealdade = clamp(lealdadeDoMembro(m) - 5); o.coesao = clamp(o.coesao - 6);
        res.push(`${m.nome} pegou o dinheiro (${dinheiro(custo)}) e continuou falando pelos cantos. A contestação não acabou.`);
        tom = 'ruim';
      }
      break;
    }
    case 'dividir':
      m.lealdade = clamp(lealdadeDoMembro(m) + 30); m.comVoce = clamp((m.comVoce ?? 0) + 15, -100, 100); m.nivel = 5;
      o.coesao = clamp(o.coesao + 6);
      v.fatos['comando_dividido'] = v.t;
      res.push(`${m.nome} passou a cuidar de uma área com autonomia. A casa ficou em paz; a sua parte, menor por uns anos.`);
      tom = 'bom';
      break;
    case 'conselho': {
      const chance = clamp(0.35 + (e.reputacao ?? 0) / 300 + (o.coesao - 40) / 150 + (jeitoDe(o).contesta < 0.8 ? 0.15 : jeitoDe(o).contesta > 1.2 ? -0.1 : 0), 0.1, 0.85);
      if (r.chance(chance)) {
        m.nivel = 3; m.lealdade = clamp(lealdadeDoMembro(m) - 15); m.comVoce = clamp((m.comVoce ?? 0) - 25, -100, 100);
        o.coesao = clamp(o.coesao + 5);
        res.push(`Os antigos ficaram com você. ${m.nome} desceu para ${nomeDoNivel(o, 3)} — e não esqueceu.`);
        tom = 'bom';
      } else { res.push('Os antigos ouviram os dois lados — e ficaram com o outro.'); res.push(deposto(v, r, o, rel, 'os antigos decidiram', m.id)); tom = 'ruim'; }
      break;
    }
    case 'afastar': {
      m.estado = 'saiu'; m.causa = 'afastad' + (m.genero === 'feminino' ? 'a' : 'o') + ' por quem mandava';
      for (const y of subordinados(v, o, rel)) if (y.estado === 'ativo') y.lealdade = clamp(lealdadeDoMembro(y) - 4);
      o.coesao = clamp(o.coesao - 4);
      if (r.chance(0.35 * jeitoDe(o).contesta)) { m.estado = 'ativo'; rachar(v, o, m.id, false); res.push(`${m.nome} saiu — e levou gente junto: agora há um grupo rival, nascido da sua casa.`); tom = 'ruim'; }
      else res.push(`${m.nome} foi posto para fora. Os outros entenderam o recado — e ficaram com um pouco mais de medo.`);
      if (r.chance(0.2)) { e.exposicao = clamp(e.exposicao + 6); res.push(`Depois, ${ele(m)} falou de você a quem não devia.`); }
      break;
    }
    case 'ceder':
      definirNivel(v, rel, 5);
      m.nivel = 6; m.comVoce = clamp((m.comVoce ?? 0) + 25, -100, 100);
      rel.lealdade = clamp(rel.lealdade + 10);
      e.exposicao = clamp(e.exposicao - 8);
      historia(o, v.t, `${m.nome} passou a mandar: o comando anterior saiu sem guerra.`);
      v.fatos['cedeu_comando'] = v.t;
      res.push(`Você passou o comando a ${m.nome}, sem guerra. Ficou como ${nomeDoNivel(o, 5)} — com menos dinheiro, menos olhos em cima e o respeito de quem viu.`);
      break;
  }
  const texto = fecharCaso(v, caso, x, res, tom);
  anotar(v, `${m.nome} contestou o seu comando em ${o.nome}: ${ROTULO_DA_CONTESTACAO[x].toLowerCase()}.`, tom);
  return { texto, tom };
}

/* ---------------------------------------------------------------- as traições (com motivo) */

function traicoesDoAno(v: Vida, r: Rng): void {
  const x = minhaOrg(v);
  if (!x) return;
  const { o, rel, n } = x;
  const e = env(v)!;
  // Quem está dentro e fala com a polícia: você não sabe quem — mas sente.
  const informantes = o.quadro.filter(m => m.informante !== undefined && m.estado === 'ativo');
  if (informantes.length && !e.cautela) e.exposicao = clamp(e.exposicao + 3);
  // A delação de quem foi preso e já não deve nada à casa (só quem conhece você: posto perto do seu).
  const delator = o.quadro.find(m => m.estado === 'preso' && m.informante === v.t && Math.abs(m.nivel - n) <= 2);
  if (delator && !(ult(v, 'traicao') && v.t - ult(v, 'traicao')!.t < 12)) {
    v.fatos['delatado_por_dentro'] = v.t;
    e.exposicao = clamp(e.exposicao + 12);
    if (e.investigado === undefined && !v.justica?.processo && r.chance(0.5)) { e.investigado = v.t; v.fatos['investigacoes'] = (v.fatos['investigacoes'] ?? 0) + 1; }
    novoCaso(v, 'sub1235_traicao', { tipo: 'traicao', situacao: 'delacao', orgId: o.id, membroId: delator.id });
    return;
  }
  // Quem perdeu a fé e quer subir vai para a rival — levando o que sabe.
  const rival = Object.keys(o.relacoes ?? {}).map(id => orgViva(v, id)).find((b): b is OrgViva => !!b && b.estado !== 'extinta' && ['rivalidade', 'conflito', 'ruptura', 'concorrencia'].includes(estadoEntre(o, b)));
  if (!rival) return;
  const vira = o.quadro.find(m => m.estado === 'ativo' && m.nivel < 6 && lealdadeDoMembro(m) < 25 && ambicaoDoMembro(m) >= 0.5);
  if (!vira || !r.chance(0.2)) return;
  vira.estado = 'saiu'; vira.causa = `foi para ${rival.nome}`;
  rival.quadro.push({ ...vira, id: `${rival.id}_v${v.t}`, estado: 'ativo', desde: v.t, nivel: Math.min(5, vira.nivel + 1), lealdade: 55, informante: undefined, causa: undefined });
  o.forca = clamp(o.forca - 3); rival.forca = clamp(rival.forca + 3);
  historia(o, v.t, `${vira.nome} trocou ${o.nome} por ${rival.nome}, levando o que sabia.`);
  if (n >= 1) novoCaso(v, 'sub1235_traicao', { tipo: 'traicao', situacao: 'mudou', orgId: o.id, outraId: rival.id, membroId: vira.id });
  void rel;
}

export type EscolhaDaTraicao = 'advogado' | 'moita' | 'proteger' | 'deixar' | 'cobrar' | 'reforcar';
export const ROTULO_DA_TRAICAO: Record<EscolhaDaTraicao, string> = {
  advogado: 'Pôr um advogado para acompanhar desde já', moita: 'Sumir do radar por um tempo', proteger: 'Proteger a família', deixar: 'Deixar ir',
  cobrar: 'Cobrar a traição (a organização responde)', reforcar: 'Fechar a casa: mudar o que se sabia'
};
export function escolhasDaTraicao(_v: Vida, situacao: string): EscolhaDaTraicao[] {
  return situacao === 'delacao' ? ['advogado', 'moita', 'proteger'] : ['deixar', 'reforcar', 'cobrar'];
}
export function pesoDaTraicao(v: Vida, x: EscolhaDaTraicao): string {
  switch (x) {
    case 'advogado': return `Uns ${dinheiro(preco(v, 9000))}: o que foi dito pesa menos se virar processo.`;
    case 'moita': return 'Menos dinheiro; a exposição esfria.';
    case 'proteger': return `Uns ${dinheiro(preco(v, 4000))}: a família longe de quem quer que esteja ouvindo.`;
    case 'deixar': return 'Nada agora. O que ele sabia vai junto.';
    case 'reforcar': return 'Custa; a rival aproveita menos o que levou.';
    case 'cobrar': return 'A organização lembra de quem não deixou passar. A rivalidade esquenta — talvez vire guerra.';
  }
}
export function resolverTraicao(v: Vida, casoId: string, x: EscolhaDaTraicao): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const o = orgViva(v, caso.orgId!)!;
  const b = caso.outraId ? orgViva(v, caso.outraId) : undefined;
  const rel = e.organizacoes!.find(y => y.id === o.id)!;
  const r = rngDe(v.id, 'traicao', caso.id, x);
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  switch (x) {
    case 'advogado': { const c = preco(v, 9000); medir(v, 'Justiça: advogados, fianças e custas', 'despesa', () => pagar(v, c)); v.fatos['advogado_preventivo'] = v.t; e.exposicao = clamp(e.exposicao - 6); res.push(`Um advogado passou a acompanhar o caso (${dinheiro(c)}).`); tom = 'bom'; break; }
    case 'moita': moita(v, true); e.exposicao = clamp(e.exposicao - 8); res.push('Você sumiu do radar: menos movimento, menos telefone.'); break;
    case 'proteger': { const c = preco(v, 4000); pagarPorFora(v, 'custos', c); v.fatos['protegeu_familia'] = v.t; res.push(`A família passou uns tempos longe (${dinheiro(c)}).`); break; }
    case 'deixar': e.exposicao = clamp(e.exposicao + 3); res.push('Você deixou ir. O que se sabia de você foi junto.'); break;
    case 'reforcar': pagarPorFora(v, 'custos', custoDeComando(v, o)); if (b) b.forca = clamp(b.forca - 3); o.coesao = clamp(o.coesao + 3); res.push(`A casa mudou o que precisava mudar (${dinheiro(custoDeComando(v, o))}). ${b ? cap(b.nome) : 'A rival'} aproveitou pouco do que levou.`); tom = 'bom'; break;
    case 'cobrar':
      lembrarOrg(rel, v.t, 'favor', 6); e.exposicao = clamp(e.exposicao + 5);
      if (b && r.chance(0.5)) { definirEstado(o, b, 'conflito'); res.push(`${cap(o.nome)} cobrou de ${b.nome} — e a rivalidade virou guerra.`); tom = 'ruim'; }
      else res.push(`${cap(o.nome)} cobrou. A rival entendeu o recado, por enquanto.`);
      break;
  }
  const m = o.quadro.find(y => y.id === caso.membroId);
  if (caso.situacao === 'delacao' && m) res.unshift(`${m.nome}, pres${flex(m.genero, 'o', 'a', 'e')}, falou à polícia — e o seu nome estava no que ${ele(m)} disse.`);
  return { texto: fecharCaso(v, caso, x, res, tom), tom };
}

/* ---------------------------------------------------------------- os boatos (informação imperfeita) */

function boatosDoAno(v: Vida, r: Rng): void {
  const x = minhaOrg(v);
  if (!x || x.n < 1) return;
  const { o } = x;
  const u = ult(v, 'suspeita');
  if (u && v.t - u.t < 24) return;
  const ativos = o.quadro.filter(m => m.estado === 'ativo' && m.nivel < 6);
  const verdadeiros = ativos.filter(m => m.informante !== undefined);
  if (!ativos.length) return;
  if (!r.chance(verdadeiros.length ? 0.4 : o.coesao < 40 ? 0.12 : 0)) return;
  const fonte = contatosAtivos(v).find(c => c.f.papel === 'informante');
  const acerta = verdadeiros.length > 0 && r.chance(fonte ? 0.5 + fonte.f.confianca / 200 : 0.5);
  const alvo = acerta ? r.pick(verdadeiros) : r.pick(ativos.filter(m => m.informante === undefined).length ? ativos.filter(m => m.informante === undefined) : ativos);
  const credibilidade = clamp(Math.round((fonte ? 35 + fonte.f.confianca / 2 : 25) + (acerta ? 10 : 0) + (r.next() - 0.5) * 20));
  novoCaso(v, 'sub1235_suspeita', { tipo: 'suspeita', situacao: fonte ? 'fonte' : 'boato', orgId: o.id, membroId: alvo.id, verdade: alvo.informante !== undefined, credibilidade, ...(fonte ? { pessoaId: fonte.id } : {}) });
}

export type EscolhaDaSuspeita = 'apurar' | 'confrontar' | 'avisar' | 'ignorar';
export const ROTULO_DA_SUSPEITA: Record<EscolhaDaSuspeita, string> = { apurar: 'Apurar antes de qualquer coisa', confrontar: 'Confrontar a pessoa', avisar: 'Levar ao comando', ignorar: 'Não dar ouvidos' };
export function escolhasDaSuspeita(v: Vida, orgId: string): EscolhaDaSuspeita[] {
  const rel = env(v)?.organizacoes?.find(x => x.id === orgId);
  return rel && (rel.propria || nivelDe(v, rel) >= 6) ? ['apurar', 'confrontar', 'ignorar'] : ['apurar', 'confrontar', 'avisar', 'ignorar'];
}
export function pesoDaSuspeita(v: Vida, x: EscolhaDaSuspeita): string {
  switch (x) {
    case 'apurar': return `Uns ${dinheiro(valorDeFavor(v) * 2)} e um ano de paciência. Quase sempre se descobre a verdade.`;
    case 'confrontar': return 'Se for verdade, a pessoa some. Se não for, você fez um inimigo — e a casa racha um pouco.';
    case 'avisar': return 'O comando resolve do jeito dele. Se o boato for falso, quem pagou foi um inocente — e você vira alarmista.';
    case 'ignorar': return 'Se for boato, nada muda. Se for verdade, a polícia continua ouvindo.';
  }
}
export function resolverSuspeita(v: Vida, casoId: string, x: EscolhaDaSuspeita): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const o = orgViva(v, caso.orgId!)!;
  const rel = e.organizacoes!.find(y => y.id === o.id)!;
  const m = o.quadro.find(y => y.id === caso.membroId);
  const r = rngDe(v.id, 'suspeita', caso.id, x);
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  if (!m || m.estado !== 'ativo') return { texto: fecharCaso(v, caso, x, ['Quando você foi atrás, a pessoa já não estava na casa.']) };
  const verdade = m.informante !== undefined;
  const sai = () => { m.estado = 'saiu'; m.causa = 'descobriram que falava com a polícia'; m.informante = undefined; o.pressao = clamp(o.pressao - 8); historia(o, v.t, `${m.nome} foi posto para fora: falava com a polícia.`); };
  switch (x) {
    case 'apurar':
      pagarPorFora(v, 'custos', valorDeFavor(v) * 2);
      if (r.chance(0.75)) {
        if (verdade) { sai(); e.reputacao = clamp((e.reputacao ?? 0) + 4); res.push(`Era verdade: ${m.nome} falava com a polícia. Apurado com calma, ${ele(m)} foi posto para fora sem barulho.`); tom = 'bom'; }
        else { res.push(`Não era verdade: ${m.nome} não tinha nada a ver. Ainda bem que você apurou antes.`); tom = 'bom'; }
      } else res.push('A apuração não chegou a lugar nenhum. A dúvida ficou.');
      break;
    case 'confrontar':
      if (verdade) { sai(); e.reputacao = clamp((e.reputacao ?? 0) + 3); res.push(`${m.nome} não sustentou o olhar. Sumiu no dia seguinte — era verdade.`); tom = 'bom'; }
      else {
        m.lealdade = clamp(lealdadeDoMembro(m) - 30); m.comVoce = clamp((m.comVoce ?? 0) - 40, -100, 100); o.coesao = clamp(o.coesao - 6);
        res.push(`${m.nome} não tinha nada a ver — e não perdoou a acusação. A casa rachou um pouco.`);
        tom = 'ruim';
      }
      break;
    case 'avisar':
      if (verdade) { sai(); lembrarOrg(rel, v.t, 'favor', 6); res.push(`O comando apurou: era verdade. ${m.nome} saiu, e lembraram de quem avisou.`); tom = 'bom'; }
      else { m.estado = 'saiu'; m.causa = 'afastad' + (m.genero === 'feminino' ? 'a' : 'o') + ' por um boato'; o.coesao = clamp(o.coesao - 5); lembrarOrg(rel, v.t, 'conflito', -3); res.push(`O comando afastou ${m.nome} — e depois ficou claro que era só boato. Um inocente pagou; a casa sabe quem levou o assunto.`); tom = 'ruim'; }
      break;
    case 'ignorar':
      if (verdade) { o.pressao = clamp(o.pressao + 8); e.exposicao = clamp(e.exposicao + 6); res.push('Você deixou para lá. A polícia continuou sabendo mais do que devia.'); tom = 'ruim'; }
      else res.push('Você deixou para lá. Era só boato — e morreu como boato.');
      break;
  }
  return { texto: fecharCaso(v, caso, x, res, tom), tom };
}

/* ---------------------------------------------------------------- os subordinados */

export type OqueSubordinado = 'promover' | 'cobrar' | 'proteger' | 'afastar';
export const ROTULO_DO_SUBORDINADO: Record<OqueSubordinado, string> = { promover: 'Promover', cobrar: 'Cobrar resultado', proteger: 'Pagar a defesa', afastar: 'Afastar' };

export function disponibilidadeSubordinado(v: Vida, orgId: string, membroId: string, oque: OqueSubordinado): Veredito {
  const e = env(v);
  const o = orgViva(v, orgId);
  const rel = e?.organizacoes?.find(x => x.id === orgId);
  if (!e || !o || !rel) return bloqueio('impossivel', 'Essa organização não é sua.');
  if (preso(v)) return bloqueio('impossivel', 'Da prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  if (!ativo(v)) return bloqueio('incompativel', 'Você não está mais nisso.');
  const n = nivelDe(v, rel);
  if (n < 3 && !rel.propria) return bloqueio('requisito', `Ter gente sob o seu comando começa em ${nomeDoNivel(o, 3)}.`);
  const m = o.quadro.find(x => x.id === membroId);
  if (!m || m.nivel >= n || m.nivel >= 6) return bloqueio('impossivel', 'Essa pessoa não responde a você.');
  if (m.tAcao === v.t) return bloqueio('incompativel', 'Já se tratou disso com essa pessoa neste ano.');
  switch (oque) {
    case 'proteger': return m.estado === 'preso' ? vereditoDePagar(v, custoDeComando(v, o), 'A defesa custa uns') : bloqueio('impossivel', `${m.nome} não está pres${flex(m.genero, 'o', 'a', 'e')}.`);
    case 'promover': return m.estado !== 'ativo' ? bloqueio('impossivel', 'Só quem está na ativa.') : m.nivel + 1 >= n ? bloqueio('incompativel', 'Acima disso, só o seu lugar.') : PERMITIDO;
    case 'cobrar': case 'afastar': return m.estado !== 'ativo' ? bloqueio('impossivel', 'Só quem está na ativa.') : PERMITIDO;
  }
}

export function agirComSubordinado(v: Vida, orgId: string, membroId: string, oque: OqueSubordinado): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const o = orgViva(v, orgId)!;
  const rel = e.organizacoes!.find(x => x.id === orgId)!;
  const m = o.quadro.find(x => x.id === membroId)!;
  const r = rngDe(v.id, 'subordinado', m.id, oque, v.t);
  m.tAcao = v.t;
  const amb = ambicaoDoMembro(m);
  switch (oque) {
    case 'promover':
      m.nivel++; m.lealdade = clamp(lealdadeDoMembro(m) + 15); m.comVoce = clamp((m.comVoce ?? 0) + 20, -100, 100);
      o.coesao = clamp(o.coesao + 2);
      return { texto: `${m.nome} subiu para ${nomeDoNivel(o, m.nivel)}. ${amb >= 0.6 ? `Agradeceu — e já olha para o próximo degrau.` : 'Agradeceu, e vai lembrar de quem fez isso.'}`, tom: 'bom' };
    case 'cobrar': {
      const rende = r.chance(0.6);
      m.lealdade = clamp(lealdadeDoMembro(m) - 8); m.comVoce = clamp((m.comVoce ?? 0) - 12, -100, 100);
      if (rende) { o.forca = clamp(o.forca + 2); return { texto: `Você cobrou ${m.nome} na frente dos outros. O resultado veio — e o ressentimento também.` }; }
      return { texto: `Você cobrou ${m.nome}. ${amb >= 0.6 ? `${cap(ele(m))} ouviu calad${flex(m.genero, 'o', 'a', 'e')}, do jeito de quem guarda.` : 'Não mudou muita coisa.'}`, tom: 'ruim' };
    }
    case 'proteger': {
      pagarPorFora(v, 'custos', custoDeComando(v, o));
      m.lealdade = clamp(lealdadeDoMembro(m) + 25); m.comVoce = clamp((m.comVoce ?? 0) + 30, -100, 100);
      if (m.informante !== undefined && r.chance(0.6)) m.informante = undefined;
      for (const y of subordinados(v, o, rel)) if (y.estado === 'ativo') y.lealdade = clamp(lealdadeDoMembro(y) + 3);
      if (r.chance(0.4)) { m.estado = 'ativo'; return { texto: `A defesa que você pagou (${dinheiro(custoDeComando(v, o))}) tirou ${m.nome} de lá. A casa inteira viu.`, tom: 'bom' }; }
      return { texto: `Você pagou a defesa de ${m.nome} (${dinheiro(custoDeComando(v, o))}). Ainda não saiu — mas sabe quem não ${flex(m.genero, 'o', 'a', 'e')} deixou sozinh${flex(m.genero, 'o', 'a', 'e')}.`, tom: 'bom' };
    }
    case 'afastar':
      m.estado = 'saiu'; m.causa = 'afastad' + (m.genero === 'feminino' ? 'a' : 'o') + ' por você';
      o.coesao = clamp(o.coesao - (jeitoDe(o).contesta < 0.8 ? 0 : 3));
      historia(o, v.t, `${m.nome} foi afastad${m.genero === 'feminino' ? 'a' : 'o'} de ${o.nome}.`);
      if (amb >= 0.6 && lealdadeDoMembro(m) < 40 && r.chance(0.3)) {
        const rival = orgsDaCidade(v, o.municipioId).find(b => b.id !== o.id && o.rivais.includes(b.id));
        if (rival) { rival.quadro.push({ ...m, id: `${rival.id}_a${v.t}`, estado: 'ativo', desde: v.t, lealdade: 55, causa: undefined }); return { texto: `${m.nome} saiu — e foi direto para ${rival.nome}.`, tom: 'ruim' }; }
      }
      return { texto: `${m.nome} está fora. Ninguém discutiu.` };
  }
}

/* ---------------------------------------------------------------- os raros */

const intervalo = (v: Vida, k: string, meses: number) => { const t = v.mundoCriminal?.raros?.[k]; return t !== undefined && v.t - t < meses; };
const marcarRaro = (v: Vida, k: string) => { const m = v.mundoCriminal; if (m) { (m.raros ??= {})[k] = v.t; m.raros['_'] = v.t; } };

/** Os acontecimentos raros: condição de verdade, intervalo longo (um raro a cada três anos, no máximo), memória. */
function acontecimentosRaros(v: Vida, r: Rng): void {
  if (intervalo(v, '_', 36)) return;
  const e = env(v)!;
  const x = minhaOrg(v);
  // O aliado que paga a defesa (quem tem processo e amigos no meio).
  const p = v.justica?.processo;
  if (p && p.defesa === 'publica' && !intervalo(v, 'aliado_ajuda', 120)) {
    const amigo = contatosAtivos(v).find(c => (c.f.amizade ?? 0) >= 60 && (c.f.favores ?? 0) >= 0);
    if (amigo && r.chance(0.3)) {
      p.defesa = 'particular'; p.pagaPor = 'organizacao';
      marcarRaro(v, 'aliado_ajuda');
      const t = `${v.pessoas[amigo.id].nome} apareceu com um advogado pago: "você fez por mim, eu faço por você". A defesa deixou de ser a pública.`;
      anotar(v, t, 'bom'); escrever(v, { texto: t, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
      return;
    }
  }
  if (!x) return;
  const { o, rel, n } = x;
  // O chefe que some (sem explicação): a cadeira vaga.
  const l = lider(o);
  if (l && !o.disputa && !(rel.propria || n >= 6) && !intervalo(v, 'lider_some', 120) && r.chance(0.04)) {
    l.estado = 'saiu'; l.causa = 'sumiu sem deixar rastro';
    historia(o, v.t, `${l.nome} sumiu sem deixar rastro.`);
    abrirDisputa(v, o, r, `${l.nome} sumiu sem deixar rastro`);
    marcarRaro(v, 'lider_some');
    return;
  }
  // A rival que pede socorro (enfraquecida, sem saída).
  const fraca = Object.keys(o.relacoes ?? {}).map(id => orgViva(v, id)).find((b): b is OrgViva => !!b && b.estado === 'enfraquecida' && b.municipioId === o.municipioId);
  if (fraca && (rel.propria || n >= 4) && !intervalo(v, 'rival_pede', 120) && r.chance(0.35)) {
    novoCaso(v, 'sub1235_raro', { tipo: 'raro', situacao: 'rival_pede', orgId: o.id, outraId: fraca.id });
    marcarRaro(v, 'rival_pede');
    return;
  }
  // A aliança inesperada (uma rival trocou de comando, e o novo comando quer outra coisa).
  const mudou = Object.keys(o.relacoes ?? {}).map(id => orgViva(v, id)).find((b): b is OrgViva => !!b && b.estado === 'ativa' && ['rivalidade', 'concorrencia'].includes(estadoEntre(o, b)) && b.historia.some(h => v.t - h.t <= 24 && /passou a mandar/.test(h.texto)));
  if (mudou && (rel.propria || n >= 4) && !intervalo(v, 'alianca', 120) && r.chance(0.4)) {
    novoCaso(v, 'sub1235_raro', { tipo: 'raro', situacao: 'alianca', orgId: o.id, outraId: mudou.id });
    marcarRaro(v, 'alianca');
    return;
  }
  // O comando oferecido (quem mandava caiu, e o seu nome é o mais forte).
  if (o.disputa && o.disputa.candidatos.includes('jogador') && n >= 4 && !intervalo(v, 'comando', 120) && r.chance(0.3) && (e.reputacao ?? 0) >= 50) {
    novoCaso(v, 'sub1235_raro', { tipo: 'raro', situacao: 'comando', orgId: o.id });
    marcarRaro(v, 'comando');
    return;
  }
  // A paz que ninguém esperava (uma guerra longa, terminada por alguém de fora).
  const guerra = Object.keys(o.relacoes ?? {}).map(id => orgViva(v, id)).find((b): b is OrgViva => !!b && estadoEntre(o, b) === 'conflito');
  if (guerra && !intervalo(v, 'paz', 120) && r.chance(0.1)) {
    definirEstado(o, guerra, 'tregua');
    historia(o, v.t, `Uma conversa puxada por gente de fora terminou a guerra com ${guerra.nome}.`);
    const t = contrair(`Ninguém esperava: gente de fora sentou ${o.nome} e ${guerra.nome} à mesma mesa, e a guerra acabou numa trégua.`);
    anotar(v, t, 'bom'); escrever(v, { texto: t, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcarRaro(v, 'paz');
  }
}

export type EscolhaRara = 'aceitar' | 'recusar' | 'absorver' | 'explorar';
export function escolhasDoRaro(situacao: string): EscolhaRara[] {
  return situacao === 'rival_pede' ? ['absorver', 'explorar', 'recusar'] : ['aceitar', 'recusar'];
}
export const ROTULO_DO_RARO: Record<EscolhaRara, string> = { aceitar: 'Aceitar', recusar: 'Recusar', absorver: 'Acolher quem sobrou (a rival vira parte de vocês)', explorar: 'Aproveitar a fraqueza: tomar o espaço deles' };
export function resolverRaro(v: Vida, casoId: string, x: EscolhaRara): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const o = orgViva(v, caso.orgId!)!;
  const b = caso.outraId ? orgViva(v, caso.outraId) : undefined;
  const rel = e.organizacoes!.find(y => y.id === o.id)!;
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  switch (caso.situacao) {
    case 'rival_pede':
      if (x === 'absorver' && b) {
        o.forca = clamp(o.forca + Math.round(b.forca / 2)); o.coesao = clamp(o.coesao - 4);
        for (const m of b.quadro.filter(y => y.estado === 'ativo' && y.nivel < 6).slice(0, 3)) o.quadro.push({ ...m, id: `${o.id}_b${v.seq++}`, nivel: Math.max(0, m.nivel - 1), lealdade: 40, desde: v.t });
        b.estado = 'extinta'; historia(b, v.t, `O que sobrou de ${b.nome} foi acolhido por ${o.nome}.`);
        e.reputacao = clamp((e.reputacao ?? 0) + 6);
        res.push(`O que sobrou de ${b.nome} passou para ${o.nome}: gente nova, ressentimentos novos.`); tom = 'bom';
      } else if (x === 'explorar' && b) {
        for (const [reg, inf] of Object.entries(b.influencia)) { o.influencia[reg] = clamp((o.influencia[reg] ?? 0) + Math.round(inf * 0.6)); delete b.influencia[reg]; }
        b.estado = 'extinta'; o.pressao = clamp(o.pressao + 8); e.exposicao = clamp(e.exposicao + 5);
        historia(b, v.t, `${cap(o.nome)} tomou o espaço de ${b.nome}, que deixou de existir.`);
        res.push(`${cap(o.nome)} tomou o espaço de ${b.nome}. Mais território — e mais olhos em cima.`); tom = 'bom';
      } else res.push(`Você deixou ${b?.nome ?? 'a rival'} com os problemas dela.`);
      break;
    case 'alianca':
      if (x === 'aceitar' && b) { definirEstado(o, b, 'alianca'); historia(o, v.t, `Aliança inesperada com ${b.nome}, sob o novo comando de lá.`); res.push(`O novo comando de ${b.nome} queria paz — e agora vocês são aliados.`); tom = 'bom'; }
      else res.push('Você agradeceu e recusou. A rivalidade segue — mais fria.');
      break;
    case 'comando':
      if (x === 'aceitar') {
        o.disputa = undefined; definirNivel(v, rel, 6); lembrarOrg(rel, v.t, 'alianca', 8);
        for (const m of o.quadro) if (m.nivel >= 6) m.nivel = 5;
        historia(o, v.t, 'O comando foi oferecido a você — e você aceitou.');
        res.push(`Os antigos ofereceram, e você aceitou: agora quem manda em ${o.nome} é você.`); tom = 'bom';
      } else { res.push('Você recusou o comando. Há quem tenha achado sábio — e quem tenha achado fraqueza.'); rel.lealdade = clamp(rel.lealdade + 3); }
      break;
  }
  return { texto: fecharCaso(v, caso, x, res, tom), tom };
}

/** Para o legado e a tela: o que cada membro do quadro acha de você (a tela de subordinados lê). */
export function leituraDosSubordinados(v: Vida, orgId: string) {
  const o = orgViva(v, orgId);
  const rel = env(v)?.organizacoes?.find(x => x.id === orgId);
  if (!o || !rel) return [];
  return subordinados(v, o, rel).slice(0, 6).map(m => {
    const l = lealdadeDoMembro(m), a = ambicaoDoMembro(m);
    return { id: m.id, nome: m.nome, posto: nomeDoNivel(o, m.nivel), preso: m.estado === 'preso', lealdade: l, ambicao: a >= 0.66 ? 'muita' : a >= 0.33 ? 'alguma' : 'pouca', comVoce: m.comVoce ?? 0, risco: a >= 0.45 && l < 45 ? 'pode querer o seu lugar' : l < 25 ? 'anda com a cabeça em outro lugar' : undefined };
  });
}

/** A ficha do caso para as cenas (reexporta o que precisam). */
export { ameacarFamilia, relacaoCom };
