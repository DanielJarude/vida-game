/**
 * REWORK 12.35 · VIDA DUPLA, FAMÍLIA E RECOMEÇO — o crime entra em casa, e a casa responde.
 *
 *   O PAR         quem divide a vida com você decide também. Quando sabe e não aceita, quando a casa foi ameaçada, quando
 *                 houve busca, hospital ou prisão, vem a conversa: prometer sair (e a promessa é cobrada — quem promete e
 *                 não sai, perde), contar tudo e pedir tempo, mentir (colar ou não), ou aceitar que acabou. O par também
 *                 pode ir embora sem conversa, quando já não dá. Nada é forçado: é o temperamento, a relação e o que houve.
 *   OS FILHOS     o pai ou a mãe que não estava (o hospital, a prisão, a noite fora) fica na memória deles.
 *   O RECOMEÇO    sair não é virar uma chave: há o primeiro emprego, a família que volta (ou não), os contatos que é preciso
 *                 deixar, os anos limpos que apagam o nome no meio. Cada passo registrado, com efeito.
 *   O LEGADO      quem herdou recebe gente que conhecia a família (contatos, não cargo): a confiança é de partida, não de
 *                 chegada.
 */
import { clamp, rngDe } from '../rng';
import type { Rng } from '../rng';
import type { Vida } from '../tipos';
import { escrever, filhos, idadePessoa, lembrarCom, parceiro } from '../nucleo';
import { vincular } from '../pessoas';
import { terminar } from './romance';
import { abalar } from './abalo';
import { comecarASair } from './carreiraCriminal';
import { preso } from './justica';
import { anotar, afastar } from './submundo';
import { estudaAgora } from './semana';
import { flex, ge } from '../texto';
import { orgViva } from './faccoes';
import { casoPorId, fecharCaso, novoCaso } from './conflitosCriminais';

const env = (v: Vida) => v.caminhos.envolvimento;
const ativo = (v: Vida) => !!env(v) && env(v)!.parou === undefined;
const recente = (v: Vida, k: string, meses = 12) => v.fatos[k] !== undefined && v.t - v.fatos[k] <= meses && v.t >= v.fatos[k];

export function processarVidaDupla(v: Vida): void {
  const e = env(v);
  if (!e || v.morte) return;
  const r = rngDe(v.id, 'vida_dupla', v.t);
  oPar(v, r);
  osFilhos(v, r);
  oRecomeco(v, r);
}

/* ---------------------------------------------------------------- o par */

function oPar(v: Vida, r: Rng): void {
  const e = env(v)!;
  const par = parceiro(v);
  if (!par || !ativo(v)) return;
  const f = e.familia?.[par.p.id];
  const vin = par.vin;
  // A promessa de sair, cobrada: quem prometeu e, um ano e meio depois, continua — perde.
  const prometeu = v.fatos[`promessa_par_${par.p.id}`];
  if (prometeu !== undefined && v.t - prometeu >= 18 && e.saindo === undefined) {
    delete v.fatos[`promessa_par_${par.p.id}`];
    if (r.chance(0.6 + Math.max(0, vin.tensao - 50) / 100)) { irEmbora(v, 'a promessa de sair não foi cumprida'); return; }
    vin.tensao = clamp(vin.tensao + 20); vin.confianca = clamp(vin.confianca - 20);
    lembrarCom(v, par.p.id, 'Você prometeu sair e não saiu.', 'conflito', 3);
  }
  // A mentira descoberta.
  const mentiu = v.fatos[`mentiu_par_${par.p.id}`];
  if (mentiu !== undefined && v.t > mentiu && (recente(v, 'familia_ameacada') || recente(v, 'internado_no_ano') || v.justica?.processo || e.exposicao >= 60) && r.chance(0.5)) {
    delete v.fatos[`mentiu_par_${par.p.id}`];
    if (r.chance(0.55)) { irEmbora(v, 'descobriu que você tinha mentido'); return; }
    vin.confianca = clamp(vin.confianca - 25); vin.tensao = clamp(vin.tensao + 15);
  }
  if (!f || f.sabe < 2) return;
  const abalou = recente(v, 'familia_ameacada') || recente(v, 'internado_no_ano') || (v.fatos['operacoes_no_jogador'] !== undefined && recente(v, 'ultima_busca'));
  // Quando já não dá (rejeita, a tensão no limite): o par vai embora sem pedir conversa.
  if (f.postura === 'rejeita' && vin.tensao >= 80 && r.chance(0.25 + Math.max(0, -par.p.temperamento.afabilidade) * 0.2)) { irEmbora(v, 'não aguentou mais a vida que vocês levavam'); return; }
  if (recente(v, 'sub1235_conjuge', 24)) return;
  if (!(f.postura === 'rejeita' || f.postura === 'pede_para_sair' || abalou)) return;
  if (!r.chance(abalou ? 0.8 : 0.45)) return;
  novoCaso(v, 'sub1235_conjuge', { tipo: 'conjuge', situacao: recente(v, 'familia_ameacada') ? 'ameaca' : recente(v, 'internado_no_ano') ? 'hospital' : f.postura, pessoaId: par.p.id });
}

function irEmbora(v: Vida, porque: string): void {
  const par = parceiro(v)!;
  const nome = par.p.nome;
  terminar(v, par.p, par.vin, 'ela');
  v.fatos['par_foi_embora_crime'] = (v.fatos['par_foi_embora_crime'] ?? 0) + 1;
  anotar(v, `${nome} foi embora: ${porque}.`, 'ruim');
  escrever(v, { texto: `${nome} foi embora por causa do que você fazia por fora: ${porque}.`, relevancia: 'marco', tema: 'amor', tom: 'ruim', pessoas: [par.p.id] });
}

export type EscolhaDoPar = 'prometer' | 'explicar' | 'mentir' | 'separar';
export const ROTULO_DO_PAR: Record<EscolhaDoPar, string> = { prometer: 'Prometer sair (e começar a sair agora)', explicar: 'Contar tudo e pedir tempo', mentir: 'Dizer que já acabou (mentir)', separar: 'Aceitar que acabou entre vocês' };
export function pesoDoPar(v: Vida, x: EscolhaDoPar, pessoaId: string): string {
  const p = v.pessoas[pessoaId];
  switch (x) {
    case 'prometer': return 'Começa a saída aos poucos agora. Se em um ano e meio você ainda estiver nisso, a promessa cobra.';
    case 'explicar': return `${p?.temperamento.afabilidade && p.temperamento.afabilidade > 0.2 ? 'Quem acolhe costuma ouvir.' : 'Pode não ser ouvido.'} Se não colar, a relação piora.`;
    case 'mentir': return 'Pode colar por um tempo. Se vier à tona, quase sempre é o fim.';
    case 'separar': return 'Cada um para um lado: a casa, os filhos e o dinheiro se dividem.';
  }
}
export function resolverPar(v: Vida, casoId: string, x: EscolhaDoPar): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const par = parceiro(v);
  if (!par || par.p.id !== caso.pessoaId) return { texto: fecharCaso(v, caso, x, ['A conversa já não fazia sentido: vocês não estão mais juntos.']) };
  const r = rngDe(v.id, 'par', caso.id, x);
  const f = (e.familia ??= {})[par.p.id] ??= { sabe: 2, postura: 'pede_para_sair', t: v.t };
  const vin = par.vin;
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  switch (x) {
    case 'prometer':
      if (e.saindo === undefined && ativo(v)) comecarASair(v);
      v.fatos[`promessa_par_${par.p.id}`] = v.t;
      vin.tensao = clamp(vin.tensao - 10); vin.confianca = clamp(vin.confianca + 5);
      f.tConversa = v.t;
      res.push(`${par.p.nome} ouviu a promessa e disse só: "vou cobrar". A saída começou.`);
      tom = 'bom';
      break;
    case 'explicar': {
      const chance = clamp(0.35 + par.p.temperamento.afabilidade * 0.25 + (vin.proximidade - 50) / 200 - (caso.situacao === 'ameaca' ? 0.15 : 0), 0.1, 0.8);
      f.tConversa = v.t;
      if (r.chance(chance)) { f.postura = 'preocupada'; vin.tensao = clamp(vin.tensao - 8); vin.confianca = clamp(vin.confianca + 6); res.push(`${par.p.nome} ouviu tudo. Não disse que estava certo — disse que fica, por enquanto.`); tom = 'bom'; }
      else { f.postura = 'rejeita'; vin.tensao = clamp(vin.tensao + 12); res.push(`${par.p.nome} ouviu e não aceitou. A conversa terminou com a porta do quarto fechada.`); tom = 'ruim'; }
      break;
    }
    case 'mentir': {
      const colou = r.chance(f.sabe === 2 && caso.situacao !== 'pede_para_sair' ? 0.15 : 0.35);
      f.tConversa = v.t;
      if (colou) { v.fatos[`mentiu_par_${par.p.id}`] = v.t; vin.tensao = clamp(vin.tensao - 5); res.push(`${par.p.nome} quis acreditar. Por enquanto, acreditou.`); }
      else { vin.confianca = clamp(vin.confianca - 20); vin.tensao = clamp(vin.tensao + 15); res.push(`${par.p.nome} olhou para você do jeito de quem sabe. Não colou.`); tom = 'ruim'; }
      break;
    }
    case 'separar':
      terminar(v, par.p, par.vin, 'jogador');
      v.fatos['par_foi_embora_crime'] = (v.fatos['par_foi_embora_crime'] ?? 0) + 1;
      res.push('Vocês se separaram. A vida que você leva não cabia mais na casa de vocês dois.');
      tom = 'ruim';
      break;
  }
  return { texto: fecharCaso(v, caso, x, res, tom), tom };
}

/* ---------------------------------------------------------------- os filhos */

function osFilhos(v: Vida, r: Rng): void {
  const e = env(v)!;
  const fora = !!v.justica?.prisao || recente(v, 'internado_no_ano') || (ativo(v) && e.nivel >= 2 && r.chance(0.3));
  if (!fora) return;
  const porque = v.justica?.prisao ? `você estava pres${flex(ge(v), 'o', 'a', 'e')}` : recente(v, 'internado_no_ano') ? 'você estava no hospital' : 'você estava fora, por causa do que fazia';
  for (const f of filhos(v).filter(x => x.vivo && v.vinculos[x.id] && idadePessoa(v, x) >= 4 && idadePessoa(v, x) < 18)) {
    const vin = v.vinculos[f.id];
    vin.proximidade = clamp(vin.proximidade - 2);
    vin.tensao = clamp(vin.tensao + (v.justica?.prisao ? 6 : 3));
    lembrarCom(v, f.id, `Um dia importante em que ${porque} e não apareceu.`, 'conflito', 1);
  }
}

/* ---------------------------------------------------------------- o recomeço */

function oRecomeco(v: Vida, r: Rng): void {
  const e = env(v)!;
  if (e.parou === undefined || preso(v)) return;
  const rc = (e.recomeco ??= { t: e.parou, marcos: {} });
  const m = rc.marcos;
  const anos = (v.t - rc.t) / 12;
  const marco = (k: string, texto: string) => { if (m[k] !== undefined) return; m[k] = v.t; anotar(v, texto, 'bom'); escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' }); };
  if (v.trabalho.atual) marco('trabalho', 'Depois de sair, o primeiro trabalho de carteira: um salário que não precisa ser escondido.');
  if (estudaAgora(v)) marco('estudo', 'Voltou a estudar depois de sair do que fazia por fora.');
  if (Object.values(e.familia ?? {}).some(f => f.postura === 'reconciliada')) marco('familia', 'Alguém da família voltou a se aproximar depois que você saiu.');
  if (anos >= 5 && !v.justica?.processo) {
    if (m['limpo'] === undefined) {
      marco('limpo', 'Cinco anos fora, sem nada novo: no meio, o seu nome foi ficando para trás.');
      e.reputacao = Math.round((e.reputacao ?? 0) * 0.6);
      e.exposicao = Math.round(e.exposicao * 0.5);
    }
  }
  // A conversa do recomeço (uma vez): entre um e dois anos depois de sair.
  if (m['conversa'] === undefined && anos >= 1 && anos < 3 && !v.momento && r.chance(0.6)) {
    m['conversa'] = v.t;
    novoCaso(v, 'sub1235_recomeco', { tipo: 'recomeco', situacao: 'saida' });
  }
}

export type EscolhaDoRecomeco = 'familia' | 'cortar' | 'ajudar' | 'seguir';
export const ROTULO_DO_RECOMECO: Record<EscolhaDoRecomeco, string> = { familia: 'Procurar quem ficou magoado na família', cortar: 'Cortar de vez os contatos de antes', ajudar: 'Ajudar quem está entrando agora a não entrar', seguir: 'Seguir a vida, sem mexer em nada' };
export function resolverRecomeco(v: Vida, casoId: string, x: EscolhaDoRecomeco): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = env(v)!;
  const caso = casoPorId(v, casoId)!;
  const r = rngDe(v.id, 'recomeco', caso.id, x);
  const res: string[] = [];
  let tom: 'bom' | 'ruim' | undefined;
  switch (x) {
    case 'familia': {
      const magoados = Object.entries(e.familia ?? {}).filter(([id, f]) => (f.postura === 'rejeita' || f.postura === 'pede_para_sair') && v.pessoas[id]?.vivo);
      let voltaram = 0;
      for (const [id, f] of magoados) {
        const ameacada = v.fatos['familia_ameacada'] !== undefined;
        if (r.chance(ameacada ? 0.35 : 0.55)) { f.postura = 'reconciliada'; f.t = v.t; voltaram++; const vin = v.vinculos[id]; if (vin) { vin.tensao = clamp(vin.tensao - 15); vin.confianca = clamp(vin.confianca + 8); } lembrarCom(v, id, 'Você procurou para pedir desculpas pelo tempo de antes.', 'reconciliacao', 2); }
        else { const vin = v.vinculos[id]; if (vin) vin.tensao = clamp(vin.tensao - 4); }
      }
      res.push(!magoados.length ? 'Ninguém na família guardava mágoa grande — mas a conversa fez bem.' : voltaram ? `${voltaram === magoados.length ? 'Todos' : `${voltaram} de ${magoados.length}`} voltaram a se aproximar. O resto precisa de mais tempo.` : 'Ninguém quis voltar ainda. O tempo vai dizer.');
      tom = voltaram ? 'bom' : undefined;
      break;
    }
    case 'cortar': {
      for (const id of Object.keys(e.fichas ?? {})) if (e.fichas![id].afastado === undefined) afastar(v, id, 'você cortou os contatos de antes');
      e.exposicao = Math.round(e.exposicao * 0.5);
      v.fatos['recusou_voltar'] = v.t;
      res.push('Você trocou de número e deixou de responder quem era de antes. O telefone ficou mais quieto — e o passado, mais longe.');
      tom = 'bom';
      break;
    }
    case 'ajudar':
      abalar(v, 'ajudar quem estava entrando', 6, -4);
      { const k = Object.keys(v.mundoCriminal?.comunidade ?? {}).find(c => c.startsWith(`${v.moradia.municipioId}:`)); if (k && v.mundoCriminal?.comunidade) v.mundoCriminal.comunidade[k] = clamp(v.mundoCriminal.comunidade[k] + 4); }
      e.recomeco!.marcos['ajuda'] = v.t;
      res.push('Você passou a conversar com quem está na porta, contando o que viu. Nem todos ouvem — alguns ouvem.');
      tom = 'bom';
      break;
    case 'seguir':
      res.push('Você seguiu a vida. O passado continua onde estava.');
      break;
  }
  return { texto: fecharCaso(v, caso, x, res, tom), tom };
}

/** O legado: quem conhecia a família vira contato de partida de quem herdou (quando aceita o convite). Não é cargo. */
export function receberContatosDoLegado(v: Vida): string[] {
  const e = env(v);
  const l = v.mundoCriminal?.legado;
  if (!e || !l?.contatos?.length) return [];
  const nomes: string[] = [];
  for (const id of l.contatos) {
    const p = v.pessoas[id];
    if (!p?.vivo || e.fichas?.[id]) continue;
    if (!v.vinculos[id]) vincular(v, p, { origem: 'apresentado', estagio: 'conhecido', proximidade: 15, convivio: [] });
    (e.fichas ??= {})[id] = { papel: 'intermediario', especialidade: l.orgs.map(o => orgViva(v, o)?.ramo).find(Boolean) ?? 'organizado', confianca: 30, espera: 'lealdade', cumpridas: 0, quebradas: 0, desde: v.t, historia: [{ t: v.t, texto: `Conhecia ${l.de}: chegou até você por causa da família.` }] };
    (e.contatos ??= []).push(id);
    nomes.push(p.nome);
  }
  return nomes;
}
