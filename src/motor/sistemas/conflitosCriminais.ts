/**
 * REWORK 12.35 · CONFLITOS JOGÁVEIS — o que o mundo do crime faz (`faccoes`: a guerra, a operação) chega ao jogador como
 * SITUAÇÃO, com escolha e consequência medida, e não como uma frase e +3 de exposição.
 *
 *   CONFRONTO     cada ano de guerra da sua organização traz um caso (a disputa por um pedaço, a retaliação, a emboscada, o
 *                 recado, a briga por um negócio, o aliado que pede ajuda). As escolhas dependem do posto: quem está embaixo
 *                 vai, fica de fora, protege os seus ou questiona a ordem; quem está no meio negocia; quem manda retalia,
 *                 intimida, recua ou negocia. O resultado mexe no território, na força, no quadro (gente com nome presa
 *                 ou morta), na lealdade, na exposição — e às vezes no corpo e na família.
 *   OPERAÇÃO      a operação contra a sua organização chega a você pela proximidade (o posto, a exposição, a cautela): o
 *                 contato seu que é levado (e pode falar), a investigação que abre ou acelera, a busca na sua casa (o
 *                 dinheiro achado, os veículos bloqueados) — e a decisão: advogado, parar tudo, colaborar, seguir.
 *   PERSEGUIÇÃO   o trabalho grande que dá errado, o confronto perdido, a busca: fugir, pedir ajuda, entregar-se ou
 *                 enfrentar — e cada escolha tem chance, custo e consequência na Justiça e no corpo.
 *   O CORPO       o ferimento é a lesão de sempre (`lesoes`: a decisão de cuidado, a recuperação, a sequela); o grave é
 *                 internação (pela rede de saúde do país, com o custo de cada sistema). A morte é rara — e real.
 *
 * Abstrato sempre: confronto, troca de tiros, emboscada são palavras de um jogo de vida, sem instrução de coisa alguma.
 * Sorteios derivados (`rngDe`): a sequência do ano não muda.
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { CasoDoSubmundo, OrgViva, RelacaoComOrganizacao, Vida } from '../tipos';
import { escrever, filhos, idade, lembrarCom, marcarFato, parceiro } from '../nucleo';
import { economiaLocal } from '../dados/lugares';
import { contrair, dinheiro, flex, ge } from '../texto';
import { abalar } from './abalo';
import { lesionar } from './lesoes';
import { redeDeSaude } from './saude';
import { medir } from './extrato';
import { pagar } from './dinheiro';
import { abrirProcesso, preso, prender } from './justica';
import { ativo, moita } from './ilicito';
import { anotar, contatosAtivos, lembrarOrg } from './submundo';
import { historiaDoContato } from './redeCriminal';
import { pagarPorFora } from './porFora';
import { registrarMortes } from './luto';
import { bloquearBens } from './bensDoCrime';
import { perfilPenal } from '../mundo/justicaPorPais';
import { paisDaVida } from '../mundo/vida';
import { custoDeComando, deDentro, definirEstado, definirNivel, estadoEntre, jeitoDe, lider, nivelDe, nomeDaRegiao, nomeDoNivel, orgViva, regiaoDaPessoa } from './faccoes';

const env = (v: Vida) => v.caminhos.envolvimento;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

/* ================================================================ os casos (a memória do que se viveu) */

/** Abre um caso (e a cena dele: o fato do dia e o id em `cenas125`). */
export function novoCaso(v: Vida, cena: string, c: Omit<CasoDoSubmundo, 'id' | 't'>): CasoDoSubmundo {
  const e = env(v)!;
  const caso: CasoDoSubmundo = { id: `caso${v.seq++}`, t: v.t, ...c };
  (e.casos ??= []).push(caso);
  if (e.casos.length > 40) e.casos.splice(0, e.casos.length - 40);
  (e.cenas125 ??= {})[cena] = caso.id;
  v.fatos[cena] = v.t;
  return caso;
}
export const casoDaCena = (v: Vida, cena: string): CasoDoSubmundo | undefined => {
  const e = env(v);
  const id = e?.cenas125?.[cena];
  return id ? e?.casos?.find(x => x.id === id) : undefined;
};
export const casoPorId = (v: Vida, id: string) => env(v)?.casos?.find(x => x.id === id);
const ultimoCaso = (v: Vida, tipo: CasoDoSubmundo['tipo']) => [...(env(v)?.casos ?? [])].reverse().find(x => x.tipo === tipo);

/** Fecha o caso com a escolha e o que de fato mudou (o texto da tela e a memória saem daqui). */
export function fecharCaso(_v: Vida, caso: CasoDoSubmundo, escolha: string, resultado: string[], tom?: 'bom' | 'ruim'): string {
  caso.escolha = escolha;
  caso.resultado = resultado.filter(Boolean);
  caso.tom = tom;
  const texto = contrair(caso.resultado.join(' '));
  return texto;
}

/* ================================================================ o corpo */

/**
 * Um ferimento (pelo sistema de lesões: a decisão de cuidado, o prazo, a sequela). O sério é internação, pela rede do país:
 * com plano, quase nada; na rede pública, nada (e a espera); onde a saúde é seguro privado e não há plano, a conta.
 */
export function ferir(v: Vida, r: Rng, g: 1 | 2 | 3, onde: string): string[] {
  const out: string[] = [];
  lesionar(v, r, g, 'briga');
  v.corpo.saude = clamp(v.corpo.saude - [0, 3, 8, 16][g]);
  marcarFato(v, 'ferido_no_crime');
  v.fatos['ferimentos_crime'] = (v.fatos['ferimentos_crime'] ?? 0) + 1;
  if (g === 1) { out.push(`Você saiu ${onde} com um ferimento leve — semanas para passar.`); return out; }
  const dias = g === 3 ? r.int(10, 25) : r.int(2, 6);
  const rede = redeDeSaude(v);
  const custo = v.financas.planoDeSaude ? preco(v, g === 3 ? 1500 : 400) : rede.sistema === 'seguro' ? Math.round(preco(v, g === 3 ? 30000 : 7000) * Math.max(1, rede.fatorParticular) / 100) * 100 : 0;
  if (custo > 0) medir(v, 'Saúde: internação', 'despesa', () => pagar(v, custo));
  v.fatos['internacoes_crime'] = (v.fatos['internacoes_crime'] ?? 0) + 1;
  v.fatos['internado_no_ano'] = v.t;
  out.push(`${g === 3 ? 'Ferimento grave' : 'Um ferimento sério'} ${onde}: ${dias} dias internad${flex(ge(v), 'o', 'a', 'e')}${v.financas.planoDeSaude ? ' (o plano cobriu quase tudo)' : custo > 0 ? ` (a conta do hospital: ${dinheiro(custo)})` : ` ${rede.pelo}`}.`);
  abalar(v, 'o hospital', g === 3 ? -10 : -5, g === 3 ? 14 : 8);
  // A família vê: quem mora junto passa a saber, ou a desconfiar mais.
  const par = parceiro(v);
  if (par) { par.vin.tensao = clamp(par.vin.tensao + (g === 3 ? 12 : 6)); lembrarCom(v, par.p.id, 'Ficou ao seu lado no hospital, sem saber direito o que tinha acontecido.', 'conflito', 2); }
  for (const f of filhos(v).filter(x => x.vivo)) lembrarCom(v, f.id, 'O tempo em que você esteve no hospital.', 'perda', 1);
  return out;
}

/** A morte por causa do crime (rara): o ano termina com ela (`corpo.morreEsteAno` lê). */
function morrer(v: Vida, causa: string): void {
  const e = env(v)!;
  e.morteNoCrime = { t: v.t, causa };
}

/* ================================================================ a família no meio */

/** O recado que chega à casa (abstrato: o carro na esquina, a mensagem, o medo). Quem mora junto sente e lembra. */
export function ameacarFamilia(v: Vida, de: string): string[] {
  const e = env(v)!;
  const par = parceiro(v);
  const fs = filhos(v).filter(x => x.vivo && v.vinculos[x.id]);
  if (!par && !fs.length) return [];
  v.fatos['familia_ameacada'] = v.t;
  abalar(v, 'o recado em casa', -8, 14);
  if (par) {
    par.vin.tensao = clamp(par.vin.tensao + 14);
    lembrarCom(v, par.p.id, `O medo em casa depois de um recado de ${de}.`, 'conflito', 3);
    const f = (e.familia ??= {})[par.p.id];
    if (!f) e.familia[par.p.id] = { sabe: 2, postura: 'pede_para_sair', t: v.t };
    else { f.sabe = 2; if (f.postura !== 'rejeita') f.postura = 'pede_para_sair'; }
  }
  for (const f of fs) { v.vinculos[f.id].tensao = clamp(v.vinculos[f.id].tensao + 6); lembrarCom(v, f.id, 'O tempo em que a casa vivia com medo.', 'conflito', 2); }
  return [`Um recado de ${de} chegou até a sua casa. ${par ? `${par.p.nome} não dormiu direito por semanas — e pediu, com todas as letras, que você saia disso.` : 'Os seus sentiram o medo.'}`];
}

/* ================================================================ o ano dos conflitos */

/** O ano: as operações que chegam a você; o confronto da guerra da sua organização; a perseguição depois de um erro. */
export function processarConflitosCriminais(v: Vida): void {
  const e = env(v);
  if (!e || preso(v) || v.morte) return;
  const r = rngDe(v.id, 'conflitos', v.t);
  operacoesQueChegam(v, r);
  if (!ativo(v) || v.justica?.foragido) return;
  perseguicaoPendente(v, r);
  confrontoDoAno(v, r);
}

/** A organização de que se é de dentro (a de posto mais alto, ao alcance). */
export function minhaOrg(v: Vida): { rel: RelacaoComOrganizacao; o: OrgViva; n: number } | undefined {
  const xs = deDentro(v).filter(rel => rel.distancia !== 'fora').map(rel => ({ rel, o: orgViva(v, rel.id)!, n: nivelDe(v, rel) })).filter(x => x.o && x.o.estado !== 'extinta');
  return xs.sort((a, b) => b.n - a.n)[0];
}

/* ---------------------------------------------------------------- o confronto */

export type SituacaoDeConfronto = 'territorio' | 'retaliacao' | 'emboscada' | 'ameaca' | 'negocio' | 'aliado';
const GRAVIDADE_DA_SITUACAO: Record<SituacaoDeConfronto, 1 | 2 | 3> = { territorio: 2, retaliacao: 3, emboscada: 3, ameaca: 2, negocio: 1, aliado: 2 };

function confrontoDoAno(v: Vida, r: Rng): void {
  const m = minhaOrg(v);
  if (!m) return;
  const { o } = m;
  const guerra = Object.keys(o.relacoes ?? {}).map(id => orgViva(v, id)).find((b): b is OrgViva => !!b && b.estado !== 'extinta' && estadoEntre(o, b) === 'conflito');
  if (!guerra) return;
  const ult = ultimoCaso(v, 'confronto');
  if (ult && v.t - ult.t < 10) return;
  if (!r.chance(0.75)) return;
  const reg = regiaoDaPessoa(v);
  const situacao: SituacaoDeConfronto =
    ult && v.t - ult.t <= 24 && ult.outraId === guerra.id && (ult.escolha === 'ir' || ult.escolha === 'retaliar' || ult.escolha === 'intimidar') && ult.tom === 'bom' ? 'retaliacao'
      : jeitoDe(guerra).escala >= 1.5 && r.chance(0.4) ? 'emboscada'
        : (guerra.influencia[reg] ?? 0) >= 15 && (o.influencia[reg] ?? 0) >= 10 ? 'territorio'
          : perfilEconomico(guerra) && r.chance(0.5) ? 'negocio'
            : guerra.forca > o.forca + 15 ? 'ameaca'
              : o.aliadas.length && r.chance(0.3) ? 'aliado' : 'territorio';
  novoCaso(v, 'sub1235_confronto', { tipo: 'confronto', situacao, orgId: o.id, outraId: guerra.id, gravidade: GRAVIDADE_DA_SITUACAO[situacao] });
}
const perfilEconomico = (o: OrgViva) => jeitoDe(o).paga >= 1.2;

export type EscolhaDeConfronto = 'ir' | 'ficar_fora' | 'negociar' | 'proteger' | 'questionar' | 'retaliar' | 'recuar' | 'intimidar';

/** O que cabe a cada posto (as outras não aparecem: nada de botão inútil). */
export function escolhasDoConfronto(v: Vida, caso: CasoDoSubmundo): EscolhaDeConfronto[] {
  const rel = env(v)?.organizacoes?.find(x => x.id === caso.orgId);
  if (!rel) return ['ficar_fora'];
  const n = nivelDe(v, rel);
  const tem = !!parceiro(v) || filhos(v).some(f => f.vivo);
  const proteger: EscolhaDeConfronto[] = tem || caso.situacao === 'ameaca' ? ['proteger'] : [];
  if (rel.propria || n >= 6) return ['retaliar', 'intimidar', 'negociar', 'recuar', ...proteger];
  if (n >= 3) return ['ir', 'negociar', 'questionar', 'ficar_fora', ...proteger];
  return ['ir', 'questionar', 'ficar_fora', ...proteger];
}

/** A situação em palavras (a cena lê). */
export function textoDoConfronto(v: Vida, caso: CasoDoSubmundo): string {
  const o = orgViva(v, caso.orgId!)!, b = orgViva(v, caso.outraId!)!;
  const reg = nomeDaRegiao(v.moradia.municipioId, regiaoDaPessoa(v));
  const rel = env(v)?.organizacoes?.find(x => x.id === o.id);
  const n = rel ? nivelDe(v, rel) : 0;
  const l = lider(o);
  const quemDecide = rel && (rel.propria || n >= 6) ? 'A decisão é sua.' : `${l ? l.nome : 'Quem manda'} já decidiu responder — e espera saber com quem pode contar.`;
  const T: Record<SituacaoDeConfronto, string> = {
    territorio: `${cap(b.nome)} avançou sobre ${reg}, onde ${o.nome} sempre esteve. Gente dos dois lados se encara na rua; os moradores fecham a porta mais cedo.`,
    retaliacao: `Depois do que aconteceu da última vez, ${b.nome} quer revide. O assunto em ${o.nome} é um só: quando, e contra quem.`,
    emboscada: `${cap(b.nome)} armou uma emboscada contra gente de ${o.nome}. Houve troca de tiros, e todo mundo sabe que vai haver mais.`,
    ameaca: `${cap(b.nome)}, mais forte, mandou um recado: ou ${o.nome} recua, ou a coisa vai chegar perto de quem é de dentro — e da família de quem é de dentro.`,
    negocio: `${cap(b.nome)} quer um negócio que é de ${o.nome}: o ponto, os clientes, o fornecedor. Por enquanto é pressão; pode virar coisa pior.`,
    aliado: `Uma aliada de ${o.nome} está sendo atacada por ${b.nome} e pediu ajuda. Ajudar é entrar na guerra dos outros; não ajudar é perder um aliado.`
  };
  return `${T[caso.situacao as SituacaoDeConfronto] ?? T.territorio} ${quemDecide}`;
}

export const ROTULO_DO_CONFRONTO: Record<EscolhaDeConfronto, string> = {
  ir: 'Ir junto (participar)', ficar_fora: 'Ficar de fora desta', negociar: 'Tentar uma conversa com o outro lado', proteger: 'Proteger os seus (tirar a família de perto)',
  questionar: 'Questionar a ordem: propor esfriar', retaliar: 'Mandar responder à altura', recuar: 'Recuar e ceder o pedaço', intimidar: 'Mostrar força, sem confronto'
};

/** O que pesa em cada escolha (dito antes, para decidir sabendo). */
export function pesoDaEscolha(v: Vida, caso: CasoDoSubmundo, x: EscolhaDeConfronto): string {
  const o = orgViva(v, caso.orgId!)!, b = orgViva(v, caso.outraId!)!;
  const chance = Math.round(clamp(0.45 + vantagem(o, b), 0.12, 0.85) * 100);
  switch (x) {
    case 'ir': return `Chance de levar a melhor: ~${chance}%. Risco de ferimento e de flagrante; a organização lembra de quem foi.`;
    case 'ficar_fora': return `Sem risco para o corpo. ${cap(o.nome)} lembra de quem não foi${jeitoDe(o).traicao === 'cobra' ? ' — e cobra' : ''}.`;
    case 'negociar': return `Se colar, trégua e ninguém se machuca. ${jeitoDe(b).negocia > 0 ? 'Do outro lado, costumam ouvir.' : jeitoDe(b).negocia < 0 ? 'Do outro lado, não costumam ouvir.' : ''}`;
    case 'proteger': return `Custa uns ${dinheiro(custoDeProteger(v, o))}. A família fica longe do perigo; a briga segue sem você.`;
    case 'questionar': return 'Pode convencer o comando a esfriar — ou ser visto como fraqueza.';
    case 'retaliar': return `Chance de levar a melhor: ~${chance}%. Mais pressão da polícia; quem perde, perde gente.`;
    case 'recuar': return 'Ninguém se machuca. Perde-se o pedaço — e um pouco do respeito de dentro.';
    case 'intimidar': return `Se funcionar (~${Math.round(clamp(0.4 + vantagem(o, b) + (jeitoDe(b).escala < 1 ? 0.15 : 0), 0.1, 0.85) * 100)}%), o outro lado recua sem baixas. Se não, a guerra esquenta.`;
  }
}

const vantagem = (o: OrgViva, b: OrgViva) => (o.forca - b.forca) / 120 + (o.coesao - 50) / 300 + (jeitoDe(o).escala - 1) * 0.05;
const custoDeProteger = (v: Vida, o: OrgViva) => Math.max(preco(v, 4000), Math.round(custoDeComando(v, o) * 0.6 / 100) * 100);

/** O pedaço disputado (a região onde as duas estão; na falta, a da pessoa). */
function regiaoDisputada(v: Vida, o: OrgViva, b: OrgViva): string {
  const aqui = regiaoDaPessoa(v);
  if ((b.influencia[aqui] ?? 0) > 0 || (o.influencia[aqui] ?? 0) > 0) return aqui;
  return Object.keys(b.influencia).sort((x, y) => (b.influencia[y] ?? 0) - (b.influencia[x] ?? 0))[0] ?? aqui;
}

/** A guerra leva alguém do quadro (com nome): preso ou morto. */
function baixa(v: Vida, r: Rng, o: OrgViva, outra: OrgViva, chanceMorte = 0.4): string | undefined {
  const alvos = o.quadro.filter(x => x.estado === 'ativo' && x.nivel < 6 && !x.pessoaId);
  if (!alvos.length) return undefined;
  const m = r.pick(alvos);
  if (r.chance(chanceMorte)) { m.estado = 'morto'; m.causa = `na guerra com ${outra.nome}`; o.historia.push({ t: v.t, texto: contrair(`${m.nome} morreu na guerra com ${outra.nome}.`) }); return `${m.nome} (${nomeDoNivel(o, m.nivel)}) morreu.`; }
  m.estado = 'preso'; m.causa = `preso na guerra com ${outra.nome}`;
  o.historia.push({ t: v.t, texto: contrair(`${m.nome} foi pres${m.genero === 'feminino' ? 'a' : 'o'} no meio da guerra com ${outra.nome}.`) });
  return `${m.nome} (${nomeDoNivel(o, m.nivel)}) foi pres${m.genero === 'feminino' ? 'a' : 'o'}.`;
}

/** Um contato seu, da mesma organização, pode morrer na guerra (o luto é o de sempre: `luto.registrarMortes`). */
function contatoNaGuerra(v: Vida, r: Rng, o: OrgViva, chance: number): string | undefined {
  const c = contatosAtivos(v).find(x => x.f.organizacao === o.id && v.vinculos[x.id]);
  if (!c || !r.chance(chance)) return undefined;
  const p = v.pessoas[c.id];
  registrarMortes(v, r, [{ p, vin: v.vinculos[c.id], causa: 'violência ligada ao crime' }], () => {});
  v.fatos['contatos_mortos_crime'] = (v.fatos['contatos_mortos_crime'] ?? 0) + 1;
  return `${p.nome}, ${flex(p.genero, 'que trabalhava com você', 'que trabalhava com você', 'que trabalhava com você')}, não voltou: morreu no confronto.`;
}

/** Quando se vai junto: o corpo, o flagrante, a morte (rara). */
function riscoPessoal(v: Vida, r: Rng, caso: CasoDoSubmundo, perdeu: boolean, peso: number): string[] {
  const e = env(v)!;
  const out: string[] = [];
  const g = caso.gravidade ?? 2;
  const fisico = (v.corpo.forma - 50) / 300;
  if (r.chance(clamp(([0, 0.15, 0.3, 0.45][g]) * (perdeu ? 1.4 : 0.7) * peso - fisico, 0.02, 0.8))) {
    const x = r.next() - fisico;
    const gr: 1 | 2 | 3 = x < 0.12 * g ? 3 : x < 0.45 ? 2 : 1;
    out.push(...ferir(v, r, gr, 'do confronto'));
    // A morte é rara — e real (calibrada no simulador: com 0,12 nenhuma vida de 30 anos de guerra morria).
    if (gr === 3 && perdeu && r.chance(0.3 + (idade(v) >= 50 ? 0.1 : 0))) morrer(v, 'violência ligada ao crime');
  }
  if (perdeu && !v.justica?.processo && r.chance(clamp(0.06 + e.exposicao / 600, 0.04, 0.25) * peso)) {
    abrirProcesso(v, r, 'grupo');
    // (A espera presa é para o grave: quem espera preso perde a pena alternativa — calibrado no simulador.)
    if (v.justica?.processo && !v.justica.prisao && r.chance(0.15)) prender(v, v.justica.processo.tJulgamento, 'fechado', 'preventiva');
    v.fatos['flagrantes'] = (v.fatos['flagrantes'] ?? 0) + 1;
    out.push('A polícia chegou antes de todo mundo sair: você foi pego no meio da confusão.');
  }
  return out;
}

/** A escolha do confronto: o resultado sai do estado (as forças, o perfil, a sua posição) e muda o estado. */
export function resolverConfronto(v: Vida, casoId: string, x: EscolhaDeConfronto): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const o = orgViva(v, caso.orgId!)!, b = orgViva(v, caso.outraId!)!;
  const rel = e.organizacoes!.find(y => y.id === o.id)!;
  const n = nivelDe(v, rel);
  const r = rngDe(v.id, 'confronto', caso.id, x);
  const reg = regiaoDisputada(v, o, b);
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  const venceu = () => {
    const ganho = 6 + r.int(0, 6);
    o.influencia[reg] = clamp((o.influencia[reg] ?? 0) + ganho); b.influencia[reg] = clamp((b.influencia[reg] ?? 0) - ganho);
    b.forca = clamp(b.forca - 5);
    res.push(`${cap(o.nome)} levou a melhor: ${nomeDaRegiao(o.municipioId, reg)} continua de vocês.`);
    const q = baixa(v, r, b, o, 0.35); if (q && r.chance(0.5)) res.push(`Do outro lado, ${q.charAt(0).toLowerCase()}${q.slice(1)}`);
    if (r.chance(0.3 + jeitoDe(b).negocia)) { definirEstado(o, b, 'tregua'); res.push(`${cap(b.nome)} pediu trégua.`); }
  };
  const perdeuA = () => {
    const perda = 6 + r.int(0, 6);
    o.influencia[reg] = clamp((o.influencia[reg] ?? 0) - perda); b.influencia[reg] = clamp((b.influencia[reg] ?? 0) + Math.round(perda * 0.8));
    o.forca = clamp(o.forca - 5);
    res.push(`${cap(b.nome)} levou a melhor: ${o.nome} perdeu espaço em ${nomeDaRegiao(o.municipioId, reg)}.`);
    const q = baixa(v, r, o, b); if (q) res.push(q);
    const c = contatoNaGuerra(v, r, o, 0.12); if (c) res.push(c);
  };
  const lealdade = (d: number, fato: 'favor' | 'conflito' | 'alianca') => lembrarOrg(rel, v.t, fato, d);
  switch (x) {
    case 'ir': {
      const ok = r.chance(clamp(0.45 + vantagem(o, b) + Math.min(0.08, (e.carreira?.xp ?? 0) / 1000), 0.12, 0.85));
      if (ok) venceu(); else perdeuA();
      e.exposicao = clamp(e.exposicao + 8);
      lealdade(ok ? 12 : 6, 'favor');
      if (ok) e.reputacao = clamp((e.reputacao ?? 0) + 5);
      res.push(...riscoPessoal(v, r, caso, !ok, 1));
      if (!ok && ['ameaca', 'retaliacao', 'emboscada'].includes(caso.situacao) && r.chance(0.4)) res.push(...ameacarFamilia(v, b.nome));
      tom = ok ? 'bom' : 'ruim';
      res.push(`Em ${o.nome}, lembram que você foi.`);
      break;
    }
    case 'ficar_fora': {
      const ok = r.chance(clamp(0.4 + vantagem(o, b), 0.1, 0.8));
      if (ok) venceu(); else perdeuA();
      const j = jeitoDe(o);
      const custo = Math.round(10 * (j.traicao === 'cobra' ? 1.5 : j.traicao === 'esquece' ? 0.6 : 1));
      lealdade(-custo, 'conflito');
      res.push(`Você ficou de fora. Em ${o.nome}, ${j.traicao === 'cobra' ? 'isso foi anotado — e vai ser cobrado' : 'alguns entenderam; outros, não'}.`);
      if (n > 0 && j.traicao === 'cobra' && r.chance(0.25)) { definirNivel(v, rel, n - 1); res.push(`Desceu um posto: ${nomeDoNivel(o, n - 1)}.`); }
      if (!ok && ['ameaca', 'retaliacao', 'emboscada'].includes(caso.situacao) && r.chance(0.3)) res.push(...ameacarFamilia(v, b.nome));
      tom = 'ruim';
      break;
    }
    case 'proteger': {
      const custo = custoDeProteger(v, o);
      pagarPorFora(v, 'custos', custo);
      v.fatos['protegeu_familia'] = v.t;
      const ok = r.chance(clamp(0.4 + vantagem(o, b) - 0.05, 0.1, 0.8));
      if (ok) venceu(); else perdeuA();
      if (!(rel.propria || n >= 6)) lealdade(-4, 'conflito');
      res.push(`Você pôs os seus longe do perigo por umas semanas (${dinheiro(custo)}). Ninguém em casa ficou exposto.`);
      tom = ok ? 'bom' : undefined;
      break;
    }
    case 'negociar': {
      const chance = clamp(0.25 + (e.reputacao ?? 0) / 300 + jeitoDe(b).negocia + (b.pressao >= 50 ? 0.1 : 0) + (n >= 6 || rel.propria ? 0.1 : 0) - (caso.situacao === 'emboscada' ? 0.15 : 0), 0.08, 0.8);
      if (r.chance(chance)) {
        definirEstado(o, b, 'tregua');
        o.historia.push({ t: v.t, texto: contrair(`Trégua com ${b.nome}, numa conversa puxada por você.`) });
        e.exposicao = clamp(e.exposicao - 2);
        lealdade(n < 4 && jeitoDe(o).contesta < 1 ? 1 : 5, 'favor');
        res.push(`A conversa colou: ${b.nome} topou uma trégua. Ninguém se machucou desta vez.`);
        tom = 'bom';
      } else {
        o.influencia[reg] = clamp((o.influencia[reg] ?? 0) - 4);
        lealdade(-3, 'conflito');
        res.push(`Do outro lado, ninguém quis conversa — e leram isso como fraqueza. A guerra continua.`);
        tom = 'ruim';
      }
      break;
    }
    case 'questionar': {
      const chance = clamp(0.15 + rel.lealdade / 300 + (e.reputacao ?? 0) / 400 + (jeitoDe(o).contesta > 1.2 ? 0.1 : jeitoDe(o).contesta < 0.8 ? -0.1 : 0), 0.05, 0.6);
      if (r.chance(chance)) {
        if (r.chance(0.5)) { definirEstado(o, b, 'tregua'); res.push(`O comando ouviu: em vez de responder, mandou propor trégua — e ${b.nome} aceitou.`); }
        else res.push('O comando ouviu e mandou segurar, desta vez. Ninguém saiu para a rua.');
        lealdade(2, 'favor');
        tom = 'bom';
      } else {
        lealdade(-8, 'conflito');
        res.push(`O comando não gostou de ser questionado. Em ${o.nome}, agora há quem ache que você amoleceu.`);
        if (n > 0 && jeitoDe(o).contesta < 0.8 && r.chance(0.25)) { definirNivel(v, rel, n - 1); res.push(`Desceu um posto: ${nomeDoNivel(o, n - 1)}.`); }
        const ok = r.chance(clamp(0.45 + vantagem(o, b), 0.12, 0.85));
        if (ok) venceu(); else perdeuA();
        tom = 'ruim';
      }
      break;
    }
    case 'retaliar': {
      const ok = r.chance(clamp(0.45 + vantagem(o, b), 0.12, 0.85));
      if (ok) { venceu(); o.coesao = clamp(o.coesao + 4); } else { perdeuA(); o.coesao = clamp(o.coesao - 6); }
      o.pressao = clamp(o.pressao + 8);
      e.exposicao = clamp(e.exposicao + 5);
      pagarPorFora(v, 'custos', custoDeComando(v, o));
      res.push(...riscoPessoal(v, r, caso, !ok, 0.35));
      res.push(`A ordem foi sua — e a conta da guerra também (${dinheiro(custoDeComando(v, o))}). A polícia aumentou o cerco sobre ${o.nome}.`);
      tom = ok ? 'bom' : 'ruim';
      break;
    }
    case 'intimidar': {
      const ok = r.chance(clamp(0.4 + vantagem(o, b) + (jeitoDe(b).escala < 1 ? 0.15 : 0), 0.1, 0.85));
      e.exposicao = clamp(e.exposicao + 6);
      o.pressao = clamp(o.pressao + 6);
      if (ok) {
        o.influencia[reg] = clamp((o.influencia[reg] ?? 0) + 6); b.influencia[reg] = clamp((b.influencia[reg] ?? 0) - 8);
        definirEstado(o, b, 'rivalidade');
        res.push(`${cap(b.nome)} mediu a força e recuou sem confronto. A guerra esfriou para rivalidade.`);
        tom = 'bom';
      } else {
        o.coesao = clamp(o.coesao - 3);
        v.fatos['escalada'] = v.t;
        res.push(`${cap(b.nome)} não recuou: leu como provocação. A guerra esquentou.`);
        tom = 'ruim';
      }
      break;
    }
    case 'recuar': {
      o.influencia[reg] = clamp((o.influencia[reg] ?? 0) - 12); b.influencia[reg] = clamp((b.influencia[reg] ?? 0) + 10);
      o.coesao = clamp(o.coesao - (jeitoDe(o).escala >= 1.5 ? 10 : 6));
      v.fatos['recuou_na_guerra'] = v.t;
      if (r.chance(0.7)) { definirEstado(o, b, 'tregua'); res.push(`Vocês cederam ${nomeDaRegiao(o.municipioId, reg)}, e ${b.nome} aceitou parar.`); }
      else res.push(`Vocês cederam ${nomeDaRegiao(o.municipioId, reg)}; ${b.nome} pegou o pedaço e não prometeu nada.`);
      res.push('Ninguém se machucou. Dentro, há quem chame isso de prudência — e quem chame de fraqueza.');
      break;
    }
  }
  o.historia.push({ t: v.t, texto: contrair(`${cap(o.nome)} × ${b.nome}: ${tom === 'bom' ? 'um ano bom na guerra' : tom === 'ruim' ? 'um ano ruim na guerra' : 'a guerra seguiu'}.`) });
  if (o.historia.length > 20) o.historia.splice(0, o.historia.length - 20);
  const texto = fecharCaso(v, caso, x, res, tom);
  anotar(v, `${cap(o.nome)} × ${b.nome}: ${ROTULO_DO_CONFRONTO[x].toLowerCase()}. ${res[0] ?? ''}`, tom);
  escrever(v, { texto: contrair(`Na guerra entre ${o.nome} e ${b.nome}: ${ROTULO_DO_CONFRONTO[x].toLowerCase()}. ${res.slice(0, 2).join(' ')}`), relevancia: tom === 'ruim' || caso.gravidade === 3 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: tom ?? 'neutro', escolha: true });
  return { texto, tom };
}

/* ---------------------------------------------------------------- a operação que chega */

const NOME_DA_OPERACAO = { integrantes: 'contra gente do quadro', lideranca: 'contra o comando', busca: 'de busca num território', patrimonio: 'contra o patrimônio', desmantelamento: 'para desmantelar a organização' } as const;

/** As operações do ano nas organizações ligadas a você: o aviso, os contatos levados, a investigação, a busca. */
function operacoesQueChegam(v: Vida, r: Rng): void {
  const e = env(v)!;
  for (const o of Object.values(v.mundoCriminal?.orgs ?? {})) {
    if (o.operacao?.t !== v.t) continue;
    const rel = e.organizacoes?.find(x => x.id === o.id);
    const dentro = !!rel && (rel.relacao === 'membro' || !!rel.propria) && rel.saiu === undefined && rel.expulso === undefined;
    const aliado = !!rel && rel.relacao === 'aliada' && rel.saiu === undefined;
    const meus = contatosAtivos(v).filter(c => c.f.organizacao === o.id);
    if (!dentro && !aliado && !meus.length) continue;
    const tipo = o.operacao.tipo;
    const ult = o.historia[o.historia.length - 1]?.texto;
    const linhas: string[] = [`Uma operação ${NOME_DA_OPERACAO[tipo]} atingiu ${o.nome}.${ult && ult.startsWith('Uma operação') ? ` ${ult}` : ''}`];
    // Um contato seu, de lá, é levado (e pode falar).
    if (meus.length && tipo !== 'busca' && tipo !== 'patrimonio' && r.chance(tipo === 'desmantelamento' ? 0.8 : 0.45)) {
      const c = meus[0];
      const p = v.pessoas[c.id];
      c.f.afastado = v.t;
      historiaDoContato(v, c.id, 'Foi levado numa operação.', 'ruim');
      linhas.push(`${p.nome} foi pres${flex(p.genero, 'o', 'a', 'e')} na operação.`);
      if (r.chance(0.2 + Math.max(0, 50 - c.f.confianca) / 200)) {
        c.f.traiu = v.t; e.exposicao = clamp(e.exposicao + 8);
        linhas.push(`Depois, soube-se que ${p.nome} falou de você no depoimento.`);
      }
    }
    if (aliado && !dentro) e.exposicao = clamp(e.exposicao + 3);
    if (dentro && ativo(v)) chegaAVoce(v, r, o, rel!, linhas);
    const texto = contrair(linhas.join(' '));
    anotar(v, texto, 'ruim');
    escrever(v, { texto, relevancia: dentro ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: 'ruim' });
  }
}

/** Pela proximidade (o posto, a exposição, a cautela, a distância): a investigação, a busca na sua casa. */
function chegaAVoce(v: Vida, r: Rng, o: OrgViva, rel: RelacaoComOrganizacao, linhas: string[]): void {
  const e = env(v)!;
  const tipo = o.operacao!.tipo;
  const n = nivelDe(v, rel);
  const perto = clamp(0.12 + n * 0.06 + e.exposicao / 300 + (tipo === 'desmantelamento' ? 0.25 : tipo === 'busca' || tipo === 'lideranca' ? 0.1 : 0) - (e.cautela ? 0.15 : 0) - (rel.distancia === 'longe' ? 0.1 : 0), 0.03, 0.85);
  if (!r.chance(perto)) { linhas.push(e.cautela ? 'Você estava na moita: a operação passou longe.' : 'Desta vez, passou longe de você.'); return; }
  v.fatos['operacoes_no_jogador'] = (v.fatos['operacoes_no_jogador'] ?? 0) + 1;
  if (e.investigado === undefined && !v.justica?.processo) {
    e.investigado = v.t;
    v.fatos['investigacoes'] = (v.fatos['investigacoes'] ?? 0) + 1;
    linhas.push('O seu nome apareceu nos papéis da operação: abriu-se uma investigação sobre você.');
  } else {
    e.exposicao = clamp(e.exposicao + 10);
    linhas.push('O seu nome apareceu de novo nos papéis: o que já se investigava ganhou mais peso.');
  }
  if (tipo === 'busca' || tipo === 'patrimonio' || tipo === 'desmantelamento' || r.chance(0.35)) {
    // A busca na sua casa: o que estava à vista é levado; os veículos comprados com isso ficam bloqueados.
    const achado = Math.round(Math.min(Math.max(0, v.financas.conta) * 0.1, Math.max(0, e.ganhos) * 0.04) / 100) * 100;
    if (achado >= 500) pagarPorFora(v, 'perdas', achado);
    const bens = bloquearBens(v, 'busca', true);
    v.fatos['ultima_busca'] = v.t;
    const caso = novoCaso(v, 'sub1235_operacao', { tipo: 'operacao', situacao: tipo, orgId: o.id, gravidade: tipo === 'desmantelamento' ? 3 : 2 });
    caso.resultado = [`A polícia bateu na sua porta com um mandado de busca.${achado >= 500 ? ` Levaram ${dinheiro(achado)} que estavam à vista.` : ''}${bens.length ? ` Bloquearam ${bens.join(', ')}.` : ''}`];
    linhas.push(caso.resultado[0]);
    const par = parceiro(v);
    if (par) { par.vin.tensao = clamp(par.vin.tensao + 15); lembrarCom(v, par.p.id, 'O dia da busca em casa.', 'conflito', 3); const f = (e.familia ??= {})[par.p.id]; if (!f) e.familia[par.p.id] = { sabe: 2, postura: 'preocupada', t: v.t }; else f.sabe = 2; }
    abalar(v, 'a busca em casa', -8, 14);
  }
}

export type EscolhaDaOperacao = 'advogado' | 'parar' | 'colaborar' | 'seguir';
export function escolhasDaOperacao(v: Vida): EscolhaDaOperacao[] {
  const xs: EscolhaDaOperacao[] = ['advogado', 'parar', 'seguir'];
  if (perfilPenal(paisDaVida(v)).colaboracao) xs.splice(2, 0, 'colaborar');
  return xs;
}
export const ROTULO_DA_OPERACAO: Record<EscolhaDaOperacao, string> = { advogado: 'Pôr um advogado no caso já', parar: 'Parar tudo por um tempo (a moita, sem trabalho novo)', colaborar: 'Colaborar com a investigação', seguir: 'Seguir como está' };
export function pesoDaOperacao(v: Vida, x: EscolhaDaOperacao): string {
  switch (x) {
    case 'advogado': return `Uns ${dinheiro(preco(v, 9000))}: a investigação pesa menos, e os bloqueios podem ser revistos.`;
    case 'parar': return 'Menos dinheiro; a exposição esfria; a organização entende — ou não.';
    case 'colaborar': return 'A Justiça pega leve com você. A organização, não: quem colabora vira traidor.';
    case 'seguir': return 'Nada muda agora. O que existe contra você continua lá.';
  }
}

export function resolverOperacao(v: Vida, casoId: string, x: EscolhaDaOperacao): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const o = orgViva(v, caso.orgId!);
  const rel = e.organizacoes?.find(y => y.id === caso.orgId);
  const r = rngDe(v.id, 'operacao_resp', caso.id, x);
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  switch (x) {
    case 'advogado': {
      const custo = preco(v, 9000);
      medir(v, 'Justiça: advogados, fianças e custas', 'despesa', () => pagar(v, custo));
      v.fatos['advogado_preventivo'] = v.t;
      e.exposicao = clamp(e.exposicao - 6);
      const liberados = r.chance(0.5) ? v.financas.bens.filter(b => b.bloqueio?.motivo === 'busca') : [];
      for (const b of liberados) delete b.bloqueio;
      res.push(`O advogado entrou no caso (${dinheiro(custo)}): o que existe contra você passou a pesar menos.${liberados.length ? ` E conseguiu liberar ${liberados.map(b => b.nome).join(', ')}.` : ''}`);
      tom = 'bom';
      break;
    }
    case 'parar':
      moita(v, true);
      e.exposicao = clamp(e.exposicao - 10);
      for (const y of e.encomendas ?? []) if (y.direcao === 'recebida' && y.estado === 'aberta') { y.estado = 'recusada'; y.tFim = v.t; }
      if (rel) lembrarOrg(rel, v.t, 'conflito', jeitoDe(o!).traicao === 'cobra' ? -6 : -2);
      res.push('Você parou tudo: telefone desligado, nenhuma proposta aceita. A exposição esfriou; o dinheiro também.');
      break;
    case 'colaborar': {
      e.exposicao = clamp(e.exposicao - 25);
      if (e.investigado !== undefined && r.chance(0.6)) { e.investigado = undefined; res.push('A investigação sobre você foi arquivada em troca do que você contou.'); }
      else res.push('O que você contou vai pesar a seu favor se houver processo.');
      v.fatos['colaborou'] = v.t;
      if (o) { o.pressao = clamp(o.pressao + 20); o.forca = clamp(o.forca - 8); }
      if (rel) { rel.expulso = v.t; rel.saiu = v.t; lembrarOrg(rel, v.t, 'traicao', -40); }
      v.fatos['pressao_grupo'] = v.t;
      res.push(`Em ${o?.nome ?? 'sua organização'}, o seu nome virou o de quem colaborou. Você está fora — e há quem não esqueça.`);
      if (r.chance(jeitoDe(o!).traicao === 'cobra' ? 0.5 : 0.2)) res.push(...ameacarFamilia(v, o?.nome ?? 'gente de antes'));
      tom = 'ruim';
      break;
    }
    case 'seguir':
      res.push('Você seguiu como estava. A busca ficou na memória da casa — e nos papéis da polícia.');
      break;
  }
  return { texto: fecharCaso(v, caso, x, res, tom), tom };
}

/* ---------------------------------------------------------------- a perseguição */

/** Marca que houve um erro grave (o trabalho grande que deu errado): no fim do ano, pode virar perseguição. */
export function marcarFalhaGrave(v: Vida, g: 1 | 2 | 3): void { if (g >= 3 || (g === 2 && rngDe(v.id, 'falha_grave', v.t).chance(0.4))) v.fatos['falha_grave'] = v.t; }

function perseguicaoPendente(v: Vida, r: Rng): void {
  const t = v.fatos['falha_grave'];
  if (t === undefined || v.t - t > 12 || v.t - t < 0) return;
  delete v.fatos['falha_grave'];
  const ult = ultimoCaso(v, 'perseguicao');
  if (ult && v.t - ult.t < 24) return;
  if (!r.chance(0.25)) return;
  novoCaso(v, 'sub1235_perseguicao', { tipo: 'perseguicao', situacao: 'trabalho', gravidade: 2 });
}

export type EscolhaDaPerseguicao = 'fugir' | 'ajuda' | 'entregar' | 'enfrentar';
export const ROTULO_DA_PERSEGUICAO: Record<EscolhaDaPerseguicao, string> = { fugir: 'Tentar sair dali', ajuda: 'Pedir ajuda a quem tem presença por perto', entregar: 'Entregar-se', enfrentar: 'Enfrentar' };

/** Quem pode ajudar (um contato de confiança na cidade, ou uma organização sua com presença na região). */
export function quemAjuda(v: Vida): string | undefined {
  const c = contatosAtivos(v).find(x => x.f.confianca >= 45 && v.pessoas[x.id]?.municipioId === v.moradia.municipioId);
  if (c) return v.pessoas[c.id].nome;
  const m = minhaOrg(v);
  return m && (m.o.influencia[regiaoDaPessoa(v)] ?? 0) >= 20 ? m.o.nome : undefined;
}

const chanceDeFugir = (v: Vida) => clamp(0.55 + (v.corpo.forma - 50) / 200 - (idade(v) >= 45 ? 0.1 : 0) - (v.corpo.saude < 50 ? 0.1 : 0), 0.15, 0.8);
export function pesoDaPerseguicao(v: Vida, x: EscolhaDaPerseguicao): string {
  switch (x) {
    case 'fugir': return `Chance de escapar: ~${Math.round(chanceDeFugir(v) * 100)}% (o seu físico pesa). Se escapar, pode ter sido visto; se não, quase sempre é processo.`;
    case 'ajuda': return `Com ajuda, ~65%. Depois, você fica devendo.`;
    case 'entregar': return 'Processo certo — e com a confissão pesando a favor na pena. Nenhum risco para o corpo.';
    case 'enfrentar': return 'Quase sempre termina mal: ferimento, um processo mais pesado. Às vezes dá certo.';
  }
}

export function resolverPerseguicao(v: Vida, casoId: string, x: EscolhaDaPerseguicao): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const r = rngDe(v.id, 'perseguicao', caso.id, x);
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  const pego = (categoria: 'patrimonial' | 'grupo' | 'violencia', assumiu = false) => {
    if (!v.justica?.processo) abrirProcesso(v, r, categoria);
    const p = v.justica?.processo;
    if (p && assumiu) p.assumiu = true;
    if (p && !v.justica?.prisao && categoria !== 'patrimonial' && r.chance(assumiu ? 0.05 : 0.2)) prender(v, p.tJulgamento, 'fechado', 'preventiva');
    v.fatos['flagrantes'] = (v.fatos['flagrantes'] ?? 0) + 1;
  };
  const cat = e.categoria === 'grupo' ? 'grupo' : 'patrimonial';
  switch (x) {
    case 'fugir':
      if (r.chance(chanceDeFugir(v))) {
        res.push('Você conseguiu sair dali.');
        if (r.chance(0.4)) { e.exposicao = clamp(e.exposicao + 10); res.push('Mas alguém viu o seu rosto: o seu nome entrou nos papéis.'); }
        if (r.chance(0.3)) { const perda = Math.round(Math.max(0, v.financas.conta) * 0.03 / 100) * 100; if (perda >= 300) { pagarPorFora(v, 'perdas', perda); res.push(`No caminho, ficou para trás o que você levava (${dinheiro(perda)}).`); } }
        tom = 'bom';
      } else if (r.chance(0.35)) {
        e.exposicao = clamp(e.exposicao + 8);
        res.push('Você foi alcançad' + flex(ge(v), 'o', 'a', 'e') + ' — e solt' + flex(ge(v), 'o', 'a', 'e') + ' horas depois: não havia o que segurar. Mas agora a polícia sabe quem você é.');
        tom = 'ruim';
      } else {
        pego(cat);
        res.push('Não deu: você foi alcançad' + flex(ge(v), 'o', 'a', 'e') + ' e levad' + flex(ge(v), 'o', 'a', 'e') + '. Um processo começa.');
        if (r.chance(0.3)) res.push(...ferir(v, r, 1, 'na fuga'));
        tom = 'ruim';
      }
      break;
    case 'ajuda': {
      const quem = quemAjuda(v);
      if (quem && r.chance(0.65)) {
        const c = contatosAtivos(v).find(y => v.pessoas[y.id].nome === quem);
        if (c) { c.f.favores = (c.f.favores ?? 0) - 1; historiaDoContato(v, c.id, 'Tirou você de uma enrascada.', 'bom'); }
        else { const m = minhaOrg(v); if (m) lembrarOrg(m.rel, v.t, 'favor', -3); }
        res.push(`${quem} tirou você dali. Agora você deve essa.`);
        tom = 'bom';
      } else { pego(cat); res.push('A ajuda não chegou a tempo. Você foi levad' + flex(ge(v), 'o', 'a', 'e') + ', e um processo começa.'); tom = 'ruim'; }
      break;
    }
    case 'entregar':
      pego(cat, true);
      { const m = minhaOrg(v); if (m) lembrarOrg(m.rel, v.t, 'conflito', jeitoDe(m.o).traicao === 'cobra' ? -6 : -2); }
      res.push('Você parou e se entregou. Sem correria, sem ferimento — e com a confissão pesando a favor quando a pena for decidida.');
      break;
    case 'enfrentar':
      res.push(...ferir(v, r, r.chance(0.35) ? 3 : 2, 'no enfrentamento'));
      if (r.chance(0.35)) { res.push('Você conseguiu sair — machucad' + flex(ge(v), 'o', 'a', 'e') + ', e com mais gente atrás de você.'); e.exposicao = clamp(e.exposicao + 15); }
      else { pego('violencia'); res.push('Terminou como quase sempre termina: com você detid' + flex(ge(v), 'o', 'a', 'e') + ', e um processo mais pesado.'); }
      if (r.chance(0.06)) morrer(v, 'violência ligada ao crime');
      tom = 'ruim';
      break;
  }
  const texto = fecharCaso(v, caso, x, res, tom);
  escrever(v, { texto: contrair(`Depois de um trabalho que deu errado, uma perseguição: ${ROTULO_DA_PERSEGUICAO[x].toLowerCase()}. ${res[0]}`), relevancia: 'biografia', tema: 'trabalho', tom: tom ?? 'neutro', escolha: true });
  return { texto, tom };
}

/** Para o resumo e a tela: os casos do ano (o que se viveu, não só o que se ganhou). */
export const casosDoAno = (v: Vida, t = v.t) => (env(v)?.casos ?? []).filter(c => t - c.t < 12 && c.t <= t);
