/**
 * O que o protagonista SABE de cada pessoa (REWORK 4).
 *
 * VERDADE DO NPC ≠ CONHECIMENTO DO PROTAGONISTA. O motor sabe onde Eleanor
 * nasceu, o que ela faz, o que estudou, se tem filhos; o protagonista só sabe
 * o que descobriu — conversando, convivendo, perguntando. Antes, a ficha dizia
 * "Descobriu de onde Eleanor veio" sem dizer DE ONDE: a descoberta era uma
 * frase, não um fato.
 *
 * Agora a descoberta grava o FATO (`Vinculo.sabe`: a chave, quando, e o valor
 * daquele momento) e a ficha o mostra ("Eleanor nasceu em Adelaide."). O valor
 * é o de quando se soube: se ela trocou de emprego e você não sabe, a ficha diz
 * o que você sabia ("Quando vocês falaram disso, trabalhava como enfermeira").
 *
 * Nada é inventado: o fato vem do estado da pessoa. A cidade natal de quem foi
 * criado antes de o motor guardá-la é decidida UMA vez, pelo próprio motor
 * (coerente com a nacionalidade e com onde mora), e fica gravada como verdade.
 *
 * Família de convivência (pais, irmãos, avós, filhos, quem mora junto) se sabe
 * por ter crescido junto: não precisa de conversa. Na sucessão, cada vínculo
 * novo começa sem o que o morto sabia — quem continua só sabe o que é dele.
 */

import type { Pessoa, Saber, Vida, Vinculo } from '../tipos';
import { rngDe } from '../rng';
import { flex } from '../texto';
import { cidadesDoPais, existeMunicipio, grandesCentros, municipio, paisDaCidade } from '../dados/lugares';
import { noPais } from '../mundo/registro';
import { nacionalidadesDaPessoa } from '../mundo/vida';

export type ChaveSaber = 'origem' | 'trabalho' | 'formacao' | 'familia' | 'curiosa' | 'rotina' | 'gente' | 'quieta' | 'ansiosa';

const FAMILIA_DE_CONVIVENCIA = new Set(['pai', 'mae', 'madrasta', 'padrasto', 'irmao', 'meio_irmao', 'avo', 'filho', 'enteado']);

/** Onde a pessoa nasceu: o que o motor guarda, ou — para quem veio de antes — decidido agora, uma vez, e gravado. */
export function naturalidade(p: Pessoa): string {
  if (p.municipioNatal && existeMunicipio(p.municipioNatal)) return p.municipioNatal;
  const aqui = existeMunicipio(p.municipioId) ? p.municipioId : undefined;
  const paisAqui = aqui ? paisDaCidade(aqui) : undefined;
  const nac = nacionalidadesDaPessoa(p);
  const r = rngDe(p.id, 'naturalidade');
  let natal: string | undefined;
  // Quem tem só a nacionalidade de outro país nasceu lá (uma cidade grande de lá, se o país tem cidades no jogo).
  if (paisAqui && nac.length && !nac.includes(paisAqui) && cidadesDoPais(nac[0]).length) natal = r.chance(0.6) ? grandesCentros(nac[0])[0] : r.pick(cidadesDoPais(nac[0])).id;
  else if (aqui && r.chance(0.62)) natal = aqui;
  else if (paisAqui && cidadesDoPais(paisAqui).length) natal = r.pick(cidadesDoPais(paisAqui)).id;
  p.municipioNatal = natal ?? aqui ?? p.municipioId;
  return p.municipioNatal;
}

/** O valor de um fato agora (a verdade do motor), ou nada se a pessoa não tem esse fato. */
function verdade(v: Vida, p: Pessoa, k: ChaveSaber): string | undefined {
  const t = p.temperamento;
  switch (k) {
    case 'origem': return naturalidade(p);
    case 'trabalho': return p.ocupacao || undefined;
    case 'formacao': return p.formacao ?? (p.estudo ? `cursando:${p.estudo.curso}` : p.vida?.escolaridade);
    case 'familia': {
      const filhos = Object.values(v.pessoas).filter(x => x.genitores?.includes(p.id) && !x.especie && x.vivo).length;
      const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
      return `${filhos}|${par?.vivo ? par.nome : ''}`;
    }
    case 'curiosa': return t.abertura > 0.3 ? '1' : undefined;
    case 'rotina': return t.abertura < -0.3 ? '1' : undefined;
    case 'gente': return t.extroversao > 0.3 ? '1' : undefined;
    case 'quieta': return t.extroversao < -0.3 ? '1' : undefined;
    case 'ansiosa': return t.estabilidade < -0.3 ? '1' : undefined;
  }
}

const ORDEM: ChaveSaber[] = ['origem', 'trabalho', 'curiosa', 'rotina', 'gente', 'quieta', 'ansiosa', 'formacao', 'familia'];

/** Sabe-se por ter crescido junto (ou morar junto): a família de convivência. */
function sabidoPorConvivencia(vin: Vinculo): boolean {
  return (!!vin.parentesco && FAMILIA_DE_CONVIVENCIA.has(vin.parentesco)) || vin.convivio.includes('casa') || vin.romance?.estagio === 'casamento' || vin.romance?.estagio === 'morando_junto';
}

/** O que o protagonista sabe desta pessoa (os fatos guardados; a família de convivência, pelo que é agora). */
export function saberes(v: Vida, p: Pessoa, vin: Vinculo): Saber[] {
  const gravados = vin.sabe ?? [];
  const chaves = new Set(gravados.map(s => s.k));
  const out = [...gravados];
  // Saves de antes: as descobertas eram só frases na história — a de origem e a do trabalho viram o fato.
  for (const h of vin.historia) {
    if (h.tipo !== 'descoberta') continue;
    const k: ChaveSaber | undefined = /^Descobriu de onde /.test(h.texto) ? 'origem' : /^Entendeu o trabalho de /.test(h.texto) ? 'trabalho' : undefined;
    if (k && !chaves.has(k)) { const x = verdade(v, p, k); if (x) { out.push({ k, t: h.t, v: x }); chaves.add(k); } }
  }
  if (sabidoPorConvivencia(vin) && !p.especie) {
    for (const k of ['origem', 'trabalho', 'formacao', 'familia'] as ChaveSaber[]) {
      if (chaves.has(k)) continue;
      const x = verdade(v, p, k);
      if (x) out.push({ k, t: v.t, v: x });
    }
  }
  return out.sort((a, b) => ORDEM.indexOf(a.k as ChaveSaber) - ORDEM.indexOf(b.k as ChaveSaber));
}

/** O que ainda dá para descobrir sobre a pessoa (os fatos que ela tem e o protagonista não sabe). */
export function pendentes(v: Vida, p: Pessoa, vin: Vinculo): ChaveSaber[] {
  if (p.especie) return [];
  const ja = new Set(saberes(v, p, vin).map(s => s.k));
  return ORDEM.filter(k => !ja.has(k) && verdade(v, p, k) !== undefined);
}

/** O protagonista descobre um fato: guarda a chave, quando, e o valor de agora. */
export function revelar(v: Vida, p: Pessoa, vin: Vinculo, k: ChaveSaber): Saber | undefined {
  const x = verdade(v, p, k);
  if (x === undefined) return undefined;
  const s: Saber = { k, t: v.t, v: x };
  vin.sabe = [...(vin.sabe ?? []).filter(y => y.k !== k), s];
  return s;
}

const NOMES_ESCOLARIDADE: Record<string, string> = { fundamental: 'Estudou até o fundamental', medio: 'Terminou o ensino médio', tecnico: 'Fez curso técnico', superior: 'Tem curso superior' };
const extenso = (n: number) => ['nenhum', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis'][n] ?? String(n);

/** O fato em uma frase — o que a ficha mostra ("Eleanor nasceu em Adelaide."). */
export function fraseDoSaber(v: Vida, p: Pessoa, s: Saber): string {
  const nome = p.nome;
  const o = flex(p.genero, 'o', 'a', 'e');
  switch (s.k as ChaveSaber) {
    case 'origem': {
      if (!existeMunicipio(s.v)) return `${nome} contou de onde veio.`;
      const m = municipio(s.v);
      const paisNatal = paisDaCidade(s.v);
      const daqui = existeMunicipio(v.moradia.municipioId) ? paisDaCidade(v.moradia.municipioId) : paisNatal;
      const mesmaCidade = s.v === p.municipioId;
      return `${nome} nasceu em ${m.nome}${paisNatal !== daqui ? `, ${noPais(paisNatal)}` : ''}${mesmaCidade ? ' — e nunca saiu de lá' : ''}.`;
    }
    case 'trabalho': {
      const quando = p.ocupacao === s.v;
      if (s.v === 'estudante') return quando ? `Estuda.` : `Quando vocês falaram disso, estudava.`;
      if (/^aposentad/.test(s.v)) return `Está aposentad${o}.`;
      return quando ? `Trabalha como ${s.v}.` : `Quando vocês falaram disso, trabalhava como ${s.v}.`;
    }
    case 'formacao':
      if (s.v.startsWith('cursando:')) return `Estava cursando ${s.v.slice(9)}.`;
      return NOMES_ESCOLARIDADE[s.v] ? `${NOMES_ESCOLARIDADE[s.v]}.` : `Formou-se em ${s.v}.`;
    case 'familia': {
      const [n, par] = s.v.split('|');
      const filhos = Number(n) || 0;
      return `${filhos ? `Tem ${extenso(filhos)} ${filhos === 1 ? 'filho' : 'filhos'}` : 'Não tem filhos'}${par ? `; vive com ${par}` : ''}.`;
    }
    case 'curiosa': return 'Tem uma lista enorme de lugares para conhecer e de coisas para aprender.';
    case 'rotina': return 'Gosta das coisas do jeito de sempre: o mesmo café, o mesmo caminho.';
    case 'gente': return 'Conhece meio mundo e fica mais feliz no meio de gente.';
    case 'quieta': return 'É de pouca gente: poucos amigos, e para a vida toda.';
    case 'ansiosa': return 'Carrega mais preocupação do que mostra.';
  }
  return '';
}

/** Como a descoberta acontece, em cena (o resultado da conversa). */
export function cenaDaDescoberta(v: Vida, p: Pessoa, s: Saber): string {
  const nome = p.nome;
  switch (s.k as ChaveSaber) {
    case 'origem': return `${nome} contou da cidade onde nasceu, da família, de uma infância que você não imaginava. ${fraseDoSaber(v, p, s)}`;
    case 'trabalho': return `${nome} explicou o que faz — as partes boas e as que ninguém vê. ${fraseDoSaber(v, p, s)}`;
    case 'formacao': return `Falaram de escola, de professores, do que cada um estudou. ${fraseDoSaber(v, p, s)}`;
    case 'familia': return `${nome} falou da família de agora. ${fraseDoSaber(v, p, s)}`;
    default: return `${nome} falou de si com mais calma do que de costume. ${fraseDoSaber(v, p, s)}`;
  }
}

/** Conviver também revela: quem divide a escola, o trabalho ou a rotina acaba contando as coisas (sem cena, um fato por ano). */
export function processarConhecimento(v: Vida): void {
  for (const vin of Object.values(v.vinculos)) {
    const p = v.pessoas[vin.pessoaId];
    if (!p || !p.vivo || p.especie || !vin.convivio.length || vin.proximidade < 45) continue;
    // O sorteio antes da lista (o mesmo resultado; só não monta a lista dos que não vão contar nada neste ano).
    if (!rngDe(v.id, 'conviver', p.id, v.t).chance(0.22)) continue;
    const falta = pendentes(v, p, vin);
    if (falta.length) revelar(v, p, vin, falta[0]);
  }
}
