/**
 * Corpo: envelhecer, adoecer, morrer.
 *
 * Saúde não é um número que só cai com a idade. Ela responde a hábitos
 * (sedentarismo, cigarro, bebida), a estresse prolongado, a condições
 * crônicas e ao acesso a tratamento (SUS ou plano). A morte é um risco anual
 * que cresce com a idade (curva de Gompertz) e com a saúde ruim, mais as
 * causas externas que pesam sobre jovens no Brasil.
 */

import { redeDeSaude } from './saude';
import { causaDaMortePet, riscoDoPet } from './pets';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Condicao, CondicaoNpc, Pessoa, Vida } from '../tipos';
import { escrever, idade, novoId, pais } from '../nucleo';
import { municipio } from '../dados/lugares';
import { idadeEm } from '../tempo';
import { derivaDaSaude } from './estado';
import { registrarQuemApareceu } from './rede';
import { checkupDoPlano, evoluirCondicoes, MENTAIS, perdaDaCondicao, SINAIS } from './saude';
import { flex, listaNatural, rotuloParentesco } from '../texto';

/**
 * O que pesa no risco de uma condição surgir. É o MESMO para o protagonista
 * (lido do estado dele) e para as pessoas do mundo (lido da ficha delas,
 * mais leve): um catálogo só, uma conta só.
 */
export interface FatoresDeRisco {
  sedentario: boolean;
  fuma: boolean;
  estresse: number;
  felicidade: number;
  /** Trabalho que cobra do corpo (obra, roça, cuidado). */
  trabalhoPesado: boolean;
  municipioId: string;
  /** Pai ou mãe com a mesma condição (com nome: a família sabe). */
  naFamilia: (id: string) => boolean;
}

const PESADO = ['construcao', 'agro', 'cuidado'];
const temNaFamilia = (genitores: (Condicao | CondicaoNpc)[][]) => (id: string) => genitores.some(cs => cs.some(c => c.id === id && c.diagnosticada !== false));

export function fatoresDoProtagonista(v: Vida): FatoresDeRisco {
  return {
    sedentario: v.corpo.habitos.sedentario, fuma: v.corpo.habitos.fuma, estresse: v.mente.estresse, felicidade: v.mente.felicidade,
    trabalhoPesado: !!v.trabalho.atual && PESADO.some(t => v.trabalho.atual!.ocupacaoId.includes(t)),
    municipioId: v.moradia.municipioId,
    naFamilia: temNaFamilia(pais(v).map(p => p.condicoes ?? []))
  };
}

export interface ModeloCondicao {
  id: string;
  nome: string;
  cronica: boolean;
  /** Chance anual de surgir, dada a idade e o que pesa (`FatoresDeRisco`). */
  risco: (f: FatoresDeRisco, idade: number) => number;
  gravidade: number;
  /** Perda anual de saúde sem tratamento / com tratamento. */
  perda: [number, number];
  /** Condição aguda: dura um ano e some (curada ou não). */
  descoberta: string;
}

const MODELOS: ModeloCondicao[] = [
  {
    id: 'hipertensao', nome: 'pressão alta', cronica: true, gravidade: 1, perda: [1, 0.2],
    risco: (f, i) => i < 28 ? 0 : (0.004 + (i - 28) * 0.0012) * (f.sedentario ? 1.5 : 1) * (f.estresse > 60 ? 1.4 : 1) * (f.naFamilia('hipertensao') ? 1.4 : 1),
    descoberta: 'Uma medição de pressão num posto de saúde deu alta. O médico falou em remédio para o resto da vida.'
  },
  {
    id: 'diabetes', nome: 'diabetes', cronica: true, gravidade: 2, perda: [1.5, 0.4],
    risco: (f, i) => i < 35 ? 0 : (0.002 + (i - 35) * 0.0006) * (f.sedentario ? 1.8 : 1) * (f.naFamilia('diabetes') ? 1.5 : 1),
    descoberta: 'Um exame de sangue apontou diabetes. A comida da casa precisou mudar.'
  },
  {
    id: 'depressao', nome: 'depressão', cronica: true, gravidade: 2, perda: [1.5, 0.3],
    risco: (f, i) => i < 14 ? 0 : (0.006 + Math.max(0, f.estresse - 55) * 0.0012 + Math.max(0, 40 - f.felicidade) * 0.0012) * (f.naFamilia('depressao') ? 1.3 : 1),
    descoberta: 'Os meses pesados ganharam um nome no consultório: depressão.'
  },
  {
    id: 'ansiedade', nome: 'transtorno de ansiedade', cronica: true, gravidade: 1, perda: [1, 0.2],
    risco: (f, i) => i < 13 ? 0 : 0.005 + Math.max(0, f.estresse - 50) * 0.0015,
    descoberta: 'As crises de falta de ar sem motivo tinham diagnóstico: ansiedade.'
  },
  {
    id: 'coluna', nome: 'problema de coluna', cronica: true, gravidade: 1, perda: [0.6, 0.2],
    risco: (f, i) => i < 25 ? 0 : 0.006 + (f.trabalhoPesado ? 0.01 : 0),
    descoberta: 'A dor nas costas virou hérnia de disco na ressonância.'
  },
  {
    id: 'cancer', nome: 'câncer', cronica: true, gravidade: 3, perda: [9, 3],
    risco: (f, i) => (i < 35 ? 0.00015 : (0.0005 + (i - 35) * 0.00018) * (f.fuma ? 2.2 : 1)) * (f.naFamilia('cancer') ? 1.3 : 1),
    descoberta: 'Um nódulo, uma biópsia, uma palavra que ninguém quer ouvir: câncer.'
  },
  {
    id: 'dengue', nome: 'dengue', cronica: false, gravidade: 1, perda: [4, 2],
    risco: f => {
      const m = municipio(f.municipioId);
      return m.regiao === 'Sudeste' || m.regiao === 'Centro-Oeste' || m.regiao === 'Nordeste' || m.regiao === 'Norte' ? 0.02 : 0.004;
    },
    descoberta: 'Febre alta, dor atrás dos olhos, manchas pelo corpo: dengue. Foram duas semanas de cama.'
  }
];

export const modeloCondicao = (id: string) => MODELOS.find(m => m.id === id);

/** A chance de a condição surgir neste ano para o protagonista. */
export const riscoNoAno = (v: Vida, m: ModeloCondicao, i = idade(v)) => m.risco(fatoresDoProtagonista(v), i);

/** Envelhecimento e condições do ano. Devolve se algo marcante aconteceu. */
export function processarCorpo(v: Vida, r: Rng): void {
  const i = idade(v);
  const c = v.corpo;

  // Deriva do ano: idade, movimento, hábitos, cabeça e condições — a mesma
  // soma que a tela "Você" mostra como o que ajuda e o que pesa na saúde.
  const delta = derivaDaSaude(v);

  // Condições em curso
  for (const cond of c.condicoes) {
    const m = modeloCondicao(cond.id);
    if (!m) continue;
    if (cond.id === 'depressao' || cond.id === 'ansiedade') {
      v.mente.felicidade = clamp(v.mente.felicidade - (cond.tratando ? 2 : 6));
      // Transtornos mentais melhoram com o tempo e com a vida melhorando — com tratamento, bem mais.
      if (v.mente.estresse < 40 && v.mente.felicidade > 60 && r.chance(cond.tratando ? 0.3 : 0.12)) {
        c.condicoes = c.condicoes.filter(x => x !== cond);
        escrever(v, { texto: `A ${cond.nome} foi embora devagar, sem data certa.`, relevancia: 'cotidiano', tema: 'saude', tom: 'bom' });
      }
    }
  }
  // Agudas duram um ano
  c.condicoes = c.condicoes.filter(cond => modeloCondicao(cond.id)?.cronica !== false || cond.tInicio > v.t - 12);

  c.saude = clamp(Math.round(c.saude + delta + r.normal() * 1.5));

  // O que ainda não tem nome pode se revelar (check-up do plano, ou um susto); o que é tratado evolui.
  checkupDoPlano(v, r);
  evoluirCondicoes(v, r);

  // O condicionamento do ano (treino, piso do dia a dia, idade) já foi feito em `pessoa.desenvolverCondicionamento`.

  // Novas condições (no máximo uma por ano, para não virar lista)
  const candidatas = MODELOS.filter(m => !c.condicoes.some(x => x.id === m.id));
  const fatores = fatoresDoProtagonista(v);
  for (const m of candidatas) {
    if (r.chance(m.risco(fatores, i))) {
      // Uma condição crônica nasce sem nome: o corpo dá sinais, e o diagnóstico depende de alguém procurar cuidado
      // (`sistemas/saude`). Com plano, o check-up pega parte logo; criança e adolescente, quem leva são os adultos.
      const pegaCedo = m.cronica && (v.financas.planoDeSaude ? r.chance(0.5) : i < 14 && r.chance(0.5));
      const nova: Condicao = { id: m.id, nome: m.nome, tInicio: v.t, cronica: m.cronica, gravidade: m.gravidade, tratando: m.cronica && pegaCedo && (v.financas.planoDeSaude || i < 18) };
      if (m.cronica) { nova.diagnosticada = pegaCedo; if (pegaCedo) nova.tDiagnostico = v.t; }
      c.condicoes.push(nova);
      const vezes = v.fatos[`teve_${m.id}`] ?? 0;
      v.fatos[`teve_${m.id}`] = vezes + 1;
      const repetida = !m.cronica && vezes > 0;
      if (repetida && m.id === 'dengue') c.saude = clamp(c.saude - 3); // a segunda dengue costuma ser pior
      if (m.cronica && !pegaCedo) {
        // Só o sinal (a tela "Você" o mostra, com o cuidado possível) — a Linha da Vida registra o diagnóstico, quando vier.
        // O começo de algo sério (diabetes, depressão, câncer) é lembrado mesmo antes de ter nome.
        escrever(v, { texto: `Começou a sentir ${SINAIS[m.id] ?? 'um incômodo que não passa'}.`, relevancia: m.gravidade >= 2 ? 'biografia' : 'cotidiano', tema: 'saude', tom: 'ruim' });
        break;
      }
      if (m.cronica) v.fatos[`diagnostico_${m.id}`] = v.t;
      escrever(v, {
        texto: repetida
          ? m.id === 'dengue' ? `Dengue outra vez${vezes === 1 ? ' — e a segunda foi pior que a primeira' : ''}.` : `${m.nome[0].toUpperCase() + m.nome.slice(1)} de novo.`
          : m.descoberta + (nova.tratando ? ' O plano de saúde cobriu o tratamento.' : m.cronica ? (redeDeSaude(v).sistema === 'seguro' ? ' Tratar ia depender de um plano ou de pagar do bolso.' : ` Tratar ia depender de fila ${redeDeSaude(v).no} ou de pagar do bolso.`) : ''),
        relevancia: repetida ? 'cotidiano' : m.gravidade >= 2 ? 'marco' : 'biografia',
        tema: 'saude',
        tom: 'ruim'
      });
      // Doença grave: quem esteve perto no tratamento (e quem não esteve) fica na história com cada um.
      if (m.gravidade >= 3 && !repetida) { const junto = registrarQuemApareceu(v, 'doenca', m.nome); if (junto) escrever(v, { texto: junto, relevancia: 'biografia', tema: 'saude' }); }
      break;
    }
  }
}

/* ---------------------------------------------------------------- Morte */

/**
 * Risco anual de morte. Calibrado para expectativa de vida perto de 76 anos
 * (mais para mulheres, menos para homens), com saúde e condições mexendo
 * no risco e causas externas pesando sobre homens jovens.
 */
function riscoBase(i: number, saude: number, masculino: boolean, condicoes: { id: string; tratando: boolean }[] = []): number {
  const gompertz = 0.0000085 * Math.exp(0.1 * i) * (masculino ? 1.35 : 1);
  const externas = i >= 15 && i <= 34 ? (masculino ? 0.0018 : 0.0004) : 0;
  const infantil = i <= 1 ? 0.003 : 0;
  const fatorSaude = Math.exp((70 - saude) / 22);
  let fatorCondicoes = 1;
  for (const c of condicoes) {
    if (c.id === 'hipertensao') fatorCondicoes *= c.tratando ? 1.15 : 1.6;
    if (c.id === 'diabetes') fatorCondicoes *= c.tratando ? 1.25 : 1.8;
  }
  return (gompertz + infantil) * fatorSaude * fatorCondicoes + externas;
}

export function causaDaMorte(r: Rng, i: number, masculino: boolean, condicoes: string[]): string {
  if (condicoes.includes('cancer') && r.chance(0.7)) return 'câncer';
  if (i >= 15 && i <= 34 && r.chance(0.6)) return r.chance(masculino ? 0.45 : 0.25) ? 'violência urbana' : 'acidente de trânsito';
  if (i >= 88 && r.chance(0.5)) return 'causas naturais, dormindo';
  if (condicoes.includes('diabetes') && r.chance(0.2)) return 'complicações do diabetes';
  if (condicoes.includes('hipertensao') && r.chance(0.5)) return r.chance(0.5) ? 'infarto' : 'AVC';
  return r.weighted(['infarto', 'AVC', 'pneumonia', 'câncer', 'insuficiência renal'], c => ({ infarto: 3, AVC: 2.5, pneumonia: 2, 'câncer': 2, 'insuficiência renal': 1 } as Record<string, number>)[c])!;
}

/** O risco de morrer no ano: idade, saúde e condições — a mesma conta para o protagonista e para as pessoas do mundo. */
function riscoDeMorte(i: number, saude: number, masculino: boolean, condicoes: { id: string; tratando: boolean; tarde?: boolean }[]): number {
  return riscoBase(i, saude, masculino, condicoes)
    + condicoes.reduce((s, c) => s + (c.id === 'cancer' ? (c.tratando ? (c.tarde ? 0.045 : 0.025) : 0.08) : 0), 0);
}

/**
 * REWORK 4: o estresse PROLONGADO entra no risco — nunca sozinho ("estresse 100 = morte" não existe). Só pesa depois
 * de anos seguidos com a cabeça no limite E com o corpo já vulnerável: pressão alta, diabetes, uma condição crônica
 * séria, a idade (50+) ou a saúde baixa. Aí multiplica o risco (até 1,6×) e puxa a causa para o coração.
 */
export function fatorDoEstresseProlongado(v: Vida): number {
  const anos = v.mente.estresseAlto?.anos ?? 0;
  if (anos < 3) return 1;
  const vulneravel = v.corpo.condicoes.some(c => c.id === 'hipertensao' || c.id === 'diabetes' || (c.cronica && c.gravidade >= 2));
  const i = idade(v);
  if (!vulneravel && i < 50 && v.corpo.saude >= 50) return 1;
  return Math.min(1.6, 1 + 0.06 * Math.min(8, anos) * (vulneravel ? 1.4 : 1) * (i >= 50 ? 1.2 : 1) * (v.corpo.saude < 40 ? 1.2 : 1));
}

/** Sorteia a morte do personagem neste ano. */
export function morreEsteAno(v: Vida, r: Rng): string | null {
  const i = idade(v);
  const fator = fatorDoEstresseProlongado(v);
  const risco = riscoDeMorte(i, v.corpo.saude, v.eu.genero === 'masculino', v.corpo.condicoes) * fator;
  if (!r.chance(Math.min(0.95, risco))) return null;
  const causa = causaDaMorte(r, i, v.eu.genero === 'masculino', v.corpo.condicoes.map(c => c.id));
  // O coração cobra o que a cabeça carregou (sorteio derivado: não mexe no acaso de quem não chegou aqui).
  if (fator > 1.15 && causa !== 'câncer' && !/violência|acidente/.test(causa) && rngDe(v.id, 'causa_estresse', v.t).chance(0.5)) return rngDe(v.id, 'causa_estresse2', v.t).chance(0.6) ? 'infarto' : 'AVC';
  return causa;
}

/**
 * Envelhece e, às vezes, leva uma pessoa da vida do jogador. De quem é da
 * família (`acompanhar`), a saúde é acompanhada com as condições dela: o que
 * surgiu, o que tem nome, o que é tratado — e isso pesa na saúde e no risco
 * de morte pela mesma conta do protagonista.
 */
export function processarCorpoDePessoa(v: Vida, r: Rng, p: Pessoa, acompanhar = false): string | null {
  if (!p.vivo) return null;
  const i = idadeEm(p.tNasc, v.t);
  if (p.especie) {
    if (!r.chance(riscoDoPet(v, p))) return null;
    return causaDaMortePet(v, p, r);
  }
  let perda = 0;
  if (acompanhar) {
    garantirCondicoes(v, p);
    // Um gerador derivado (da pessoa e do ano): a saúde dela não mexe na sequência do gerador da vida.
    perda = anoDeSaudeDaPessoa(v, p, v.t, rngDe(v.id, 'saude', p.id, v.t), true);
  }
  // A deriva da idade. De quem é acompanhado, parte do que ela embutia (a pressão alta, o diabetes que ninguém
  // nomeava) agora vem das condições, com nome e causa: a deriva é menor, e a expectativa de vida fica a mesma.
  const deriva = acompanhar ? (i < 60 ? 0 : i < 75 ? -0.3 : -1.3) : i < 40 ? 0 : i < 60 ? -0.8 : i < 75 ? -1.5 : -2.5;
  p.saude = clamp(Math.round(p.saude + deriva - perda + r.normal() * 2));
  const conds = p.condicoes ?? [];
  if (r.chance(Math.min(0.95, riscoDeMorte(i, p.saude, p.genero === 'masculino', conds)))) {
    return causaDaMorte(r, i, p.genero === 'masculino', conds.map(c => c.id));
  }
  return null;
}

/* ------------------------------------------- A saúde de quem não é o protagonista */

function hashDe(s: string): number {
  let h = 2166136261;
  for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/**
 * Os hábitos de uma pessoa do mundo: da semente dela (estáveis, sem gastar o
 * gerador). Perto da proporção do país: ~12% fumam, ~45% quase não se mexem.
 * Se ela passar a ser jogada, os hábitos vão junto (`sucessao`).
 */
export function habitosDaPessoa(p: Pessoa, i: number): { fuma: boolean; sedentario: boolean } {
  return { fuma: i >= 16 && hashDe(`${p.id}:fuma`) < 0.12, sedentario: i >= 12 && hashDe(`${p.id}:sedentario`) < 0.45 };
}

/** Os fatores de risco de uma pessoa do mundo: os hábitos dela, o aperto que atravessa, o trabalho, a família. */
export function fatoresDaPessoa(v: Vida, p: Pessoa, t = v.t): FatoresDeRisco {
  const i = idadeEm(p.tNasc, t);
  const h = habitosDaPessoa(p, i);
  const aperto = p.aperto && t - p.aperto.t <= 24 && t >= p.aperto.t ? p.aperto.tipo : undefined;
  const genitores = (p.genitores ?? []).map(g => (g === 'eu' ? v.corpo.condicoes : v.pessoas[g]?.condicoes ?? []));
  return {
    ...h,
    estresse: aperto && aperto !== 'fase' ? 70 : 35,
    felicidade: aperto === 'luto' || aperto === 'separacao' ? 30 : 60,
    trabalhoPesado: !!p.ocupacaoId && PESADO.some(x => p.ocupacaoId!.includes(x)),
    municipioId: p.municipioId,
    naFamilia: temNaFamilia(genitores)
  };
}

/** A condição de uma pessoa do mundo lida como a do protagonista (o mesmo catálogo, os mesmos campos). */
export function condicaoDaPessoa(c: CondicaoNpc): Condicao | undefined {
  const m = modeloCondicao(c.id);
  if (!m) return undefined;
  return {
    id: c.id, nome: m.nome, tInicio: c.tInicio, cronica: m.cronica, gravidade: c.gravidade, tratando: c.tratando, diagnosticada: c.diagnosticada,
    ...(c.tDiagnostico !== undefined ? { tDiagnostico: c.tDiagnostico } : {}), ...(c.tarde ? { tarde: true } : {})
  };
}

/**
 * Um ano de saúde de uma pessoa do mundo, pelas regras do protagonista em
 * versão leve: a condição surge pelo risco do catálogo (no máximo uma por
 * ano), nasce sem nome, ganha nome (a criança, pelos adultos da casa; o
 * adulto, num consultório — mais cedo com renda para um plano), é tratada ou
 * não, entra em remissão ou se controla. `efeitos`: o ano é de verdade (a
 * família fica sabendo); sem ele, é a reconstrução do passado de quem ainda
 * não era acompanhado. Devolve o que as condições tiram da saúde no ano (a
 * deriva do ano soma, como a do protagonista: frações de ponto contam).
 */
export function anoDeSaudeDaPessoa(v: Vida, p: Pessoa, t: number, r: Rng, efeitos: boolean): number {
  const i = idadeEm(p.tNasc, t);
  const conds = p.condicoes ?? (p.condicoes = []);
  const f = fatoresDaPessoa(v, p, t);
  for (const c of [...conds]) {
    const m = modeloCondicao(c.id);
    if (!m) continue;
    // Saúde mental melhora com o tempo e com a vida melhorando — com tratamento, bem mais.
    if (MENTAIS.has(c.id) && f.estresse < 60 && r.chance(c.tratando ? 0.3 : 0.12)) { conds.splice(conds.indexOf(c), 1); continue; }
    if (!c.diagnosticada) {
      const anos = (t - c.tInicio) / 12;
      const chance = i < 18 ? (MENTAIS.has(c.id) ? 0.2 : 0.6) : c.id === 'cancer' ? (anos >= 1 ? 0.45 : 0.15) : 0.15 + (p.renda > 5000 ? 0.15 : 0) + (anos >= 3 ? 0.1 : 0);
      if (!r.chance(chance)) continue;
      c.diagnosticada = true;
      c.tDiagnostico = t;
      c.tarde = c.id === 'cancer' ? anos >= 1 : anos >= 3;
      c.tratando = i < 18 || r.chance(0.8);
      if (efeitos) noticiaDoDiagnostico(v, p, c, m.nome);
      continue;
    }
    if (!c.tratando) { if (r.chance(0.3)) c.tratando = true; continue; }
    const tratandoHa = (t - (c.tDiagnostico ?? c.tInicio)) / 12;
    if ((c.id === 'cancer' && tratandoHa >= 1 && r.chance(c.tarde ? 0.14 : 0.32)) || (c.id === 'coluna' && tratandoHa >= 1 && r.chance(0.2))) {
      conds.splice(conds.indexOf(c), 1);
      if (efeitos && c.id === 'cancer') registrarNaVidaDela(p, t, 'Terminou o tratamento do câncer: remissão.');
    }
  }
  for (const m of MODELOS) {
    if (!m.cronica || conds.some(c => c.id === m.id)) continue;
    if (!r.chance(m.risco(f, i))) continue;
    const cedo = i < 14 && r.chance(0.5);
    conds.push({ id: m.id, tInicio: t, gravidade: m.gravidade, diagnosticada: cedo, tratando: cedo, ...(cedo ? { tDiagnostico: t } : {}) });
    break;
  }
  // O que as condições tiram da saúde no ano: a mesma perda do protagonista (`estado.fatoresSaude`).
  return conds.reduce((s, c) => { const m = modeloCondicao(c.id); return s + (m ? perdaDaCondicao(condicaoDaPessoa(c)!, m.perda) : 0); }, 0) * (i < 45 ? 0.5 : 1);
}

/** A reconstrução de quem ainda não era acompanhado (saves anteriores, quem acabou de entrar na família): os anos vividos até aqui. */
export function garantirCondicoes(v: Vida, p: Pessoa): CondicaoNpc[] {
  if (p.condicoes) return p.condicoes;
  p.condicoes = [];
  const i = idadeEm(p.tNasc, v.t);
  for (let a = 1; a < i; a++) { const t = p.tNasc + a * 12; anoDeSaudeDaPessoa(v, p, t, rngDe(v.id, 'saude', p.id, t), false); }
  return p.condicoes;
}

function registrarNaVidaDela(p: Pessoa, t: number, texto: string): void {
  if (!p.vida) return;
  p.vida.trajetoria.push({ t, texto, tipo: 'saude' });
  if (p.vida.trajetoria.length > 24) p.vida.trajetoria.splice(0, p.vida.trajetoria.length - 24);
}

/** O diagnóstico de alguém da família: entra na vida dela; o que é grave chega a você (e vira um momento difícil em que dá para estar junto). */
function noticiaDoDiagnostico(v: Vida, p: Pessoa, c: CondicaoNpc, nome: string): void {
  registrarNaVidaDela(p, v.t, `Recebeu o diagnóstico: ${nome}${c.tratando ? '. Começou o tratamento' : ''}.`);
  const vin = v.vinculos[p.id];
  if (!vin || c.gravidade < 2 || MENTAIS.has(c.id) || vin.proximidade < 35) return;
  const quem = vin.parentesco ? `${flex(p.genero, 'seu', 'sua', 'sue')} ${rotuloParentesco(p, vin.parentesco)}, ${p.nome},` : p.nome;
  escrever(v, { texto: `${quem.charAt(0).toUpperCase() + quem.slice(1)} recebeu o diagnóstico: ${nome}${c.tarde ? ', descoberto tarde' : ''}.`, relevancia: c.gravidade >= 3 ? 'biografia' : 'cotidiano', tema: 'familia', tom: 'ruim', pessoas: [p.id] });
  if (c.gravidade >= 3 && (!p.aperto || v.t - p.aperto.t > 24)) p.aperto = { tipo: 'doenca', t: v.t };
}

/** O que a família sabe da saúde de uma pessoa do mundo — só o que tem nome —, em palavras (a ficha e o legado leem daqui). */
export function saudeConhecida(p: Pessoa): string | undefined {
  const conhecidas = p.vivo && !p.especie ? (p.condicoes ?? []).filter(c => c.diagnosticada) : [];
  if (!conhecidas.length) return undefined;
  return listaNatural(conhecidas.map(c => `${modeloCondicao(c.id)?.nome ?? c.id} (${c.tratando ? 'em tratamento' : 'sem tratamento'})`));
}

export { novoId };
