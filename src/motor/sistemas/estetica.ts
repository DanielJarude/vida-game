/**
 * CIRURGIA PLÁSTICA E ESTÉTICA (FIX pós-playtest humano). Não é "pagar → +10 de aparência":
 *
 *   a clínica (popular, boa, renomada: preço, mão, risco) → o procedimento (o que muda no rosto, quanto custa aqui,
 *   a recuperação, a idade mínima, a saúde que precisa) → a decisão → o resultado (satisfatório, neutro, abaixo do
 *   esperado, complicação — preço alto não garante, preço baixo não condena) → a mudança no VISUAL (o retrato mostra)
 *   → a autoimagem, a cabeça e a saúde → quem está perto repara → a revisão, quando faz sentido.
 *
 * GENÉTICA ≠ APARÊNCIA: antes da primeira mudança, os genes são guardados (`identidade.guardarGenes`); a cirurgia mexe
 * no `visual`, nunca nos genes — o filho de quem operou o nariz herda o nariz de antes (teste C).
 *
 * Só entra o que tem consequência visível no retrato: rinoplastia, otoplastia, blefaroplastia, lifting, transplante
 * capilar e preenchimento labial (que passa: o lábio volta ao natural em ano e meio). Lipoaspiração ficou de fora: o
 * retrato não desenha o corpo (seria número sem corpo).
 */
import { clamp, type Rng } from '../rng';
import type { Vida } from '../tipos';
import { escrever, idade, lembrarCom, parceiro } from '../nucleo';
import { flex } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { pagar, vereditoDePagar } from './dinheiro';
import { abalar } from './abalo';
import { estagioDaCalvicie, geneticaDe, guardarGenes } from './identidade';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export type IdProcedimento = 'rinoplastia' | 'otoplastia' | 'blefaroplastia' | 'lifting' | 'transplante' | 'labios';
export type Clinica = 'popular' | 'boa' | 'renomada';
export type Resultado = 'satisfatorio' | 'neutro' | 'abaixo' | 'complicacao';

export const CLINICAS: Record<Clinica, { nome: string; preco: number; mao: number; risco: number; sobre: string }> = {
  popular: { nome: 'Clínica popular', preco: 0.6, mao: 0.52, risco: 1.5, sobre: 'Mais barata, fila longa, cirurgião com muito volume. Costuma dar certo; quando não dá, a revisão é com você.' },
  boa: { nome: 'Clínica de bairro bem falada', preco: 1, mao: 0.66, risco: 1, sobre: 'O preço do mercado, um cirurgião com nome na cidade.' },
  renomada: { nome: 'Clínica renomada', preco: 1.9, mao: 0.78, risco: 0.7, sobre: 'Cara. Um nome que aparece em revista — o que melhora as chances, não garante o resultado.' }
};

interface Procedimento {
  id: IdProcedimento;
  nome: string;
  /** O que muda, em palavras. */
  oque: string;
  preco: number;
  recuperacao: number;
  idadeMin: number;
  /** A chance de complicação na clínica "boa", para alguém saudável e jovem. */
  risco: number;
  /** Faz sentido para esta pessoa agora? (o motivo, se não). */
  cabe: (v: Vida) => string | null;
  /** O que muda no visual (alvo: a escolha, quando há). */
  aplicar: (v: Vida, alvo?: string, parcial?: boolean) => void;
  alvos?: (v: Vida) => { id: string; rotulo: string }[];
}

const vis = (v: Vida) => v.eu.visual;
const masc = (v: Vida) => v.eu.genero === 'masculino';

export const PROCEDIMENTOS: Procedimento[] = [
  {
    id: 'rinoplastia', nome: 'Rinoplastia', oque: 'muda a forma do nariz', preco: 14000, recuperacao: 2, idadeMin: 18, risco: 0.04,
    cabe: () => null,
    alvos: v => [{ id: 'fino', rotulo: 'Afinar' }, { id: 'pequeno', rotulo: 'Diminuir' }, { id: 'medio', rotulo: 'Corrigir o dorso, discreto' }].filter(a => a.id !== vis(v).nariz),
    aplicar: (v, alvo, parcial) => { vis(v).nariz = parcial ? (alvo === 'fino' ? 'arrebitado' : 'medio') : alvo ?? 'fino'; }
  },
  {
    id: 'otoplastia', nome: 'Otoplastia', oque: 'aproxima as orelhas da cabeça', preco: 7000, recuperacao: 1, idadeMin: 16, risco: 0.02,
    cabe: v => (vis(v).orelhas === 'de_abano' ? null : 'As suas orelhas não são de abano: não há o que corrigir.'),
    aplicar: (v, _a, parcial) => { vis(v).orelhas = parcial ? 'medias' : 'coladas'; }
  },
  {
    id: 'blefaroplastia', nome: 'Blefaroplastia', oque: 'tira o excesso das pálpebras (o olhar cansado)', preco: 9000, recuperacao: 1, idadeMin: 30, risco: 0.03,
    cabe: v => (vis(v).olhosForma === 'caido' || idade(v) >= 45 ? null : 'Nada a tirar das pálpebras ainda.'),
    aplicar: (v, _a, parcial) => { if (vis(v).olhosForma === 'caido' && !parcial) vis(v).olhosForma = 'amendoado'; if (idade(v) >= 45) vis(v).lifting = idade(v) - (parcial ? 5 : 2); }
  },
  {
    id: 'lifting', nome: 'Lifting facial', oque: 'estica a pele do rosto: as rugas somem por uns anos', preco: 25000, recuperacao: 3, idadeMin: 40, risco: 0.05,
    cabe: v => (idade(v) >= 45 ? null : 'Antes dos 45, não há o que esticar.'),
    aplicar: (v, _a, parcial) => { vis(v).lifting = idade(v) - (parcial ? 5 : 0); }
  },
  {
    id: 'transplante', nome: 'Transplante capilar', oque: 'cabelo de volta nas entradas e na coroa', preco: 18000, recuperacao: 6, idadeMin: 25, risco: 0.02,
    // Só quando a calvície já aparece (as entradas, a coroa) — a mesma conta que o retrato usa.
    cabe: v => (!masc(v) ? 'O transplante aqui é para calvície masculina.' : vis(v).transplante ? 'Já fez.' : (estagioDaCalvicie(geneticaDe(v.eu)?.calvicie, true, idade(v)) ?? (idade(v) >= 50 ? 1 : 0)) === 0 ? 'Seu cabelo está todo aí.' : null),
    aplicar: v => { vis(v).transplante = true; }
  },
  {
    id: 'labios', nome: 'Preenchimento labial', oque: 'lábios mais cheios (dura um ano e meio)', preco: 2200, recuperacao: 0, idadeMin: 18, risco: 0.015,
    cabe: v => (vis(v).boca === 'cheia' ? 'Os lábios já são cheios.' : null),
    aplicar: (v, _a, parcial) => { vis(v).boca = parcial ? 'media' : vis(v).boca === 'fina' ? 'media' : 'cheia'; v.fatos.preenchimento_labial = v.t; }
  }
];
export const procedimento = (id: string) => PROCEDIMENTOS.find(p => p.id === id);

/** O preço aqui (a cidade e a clínica). */
export const precoDoProcedimento = (v: Vida, id: IdProcedimento, clinica: Clinica, revisao = false) =>
  Math.round(procedimento(id)!.preco * CLINICAS[clinica].preco * economiaLocal(v.moradia.municipioId).custo * (revisao ? 0.5 : 1) / 10) * 10;

/** Em recuperação de um procedimento (não se opera de novo nesse tempo). */
export function emRecuperacao(v: Vida): string | undefined {
  const u = (v.eu.procedimentos ?? []).slice(-1)[0];
  if (!u) return undefined;
  const p = procedimento(u.id);
  return p && v.t - u.t < Math.max(1, p.recuperacao + (u.resultado === 'complicacao' ? 4 : 0)) ? p.nome.toLowerCase() : undefined;
}

/** Dá para revisar? (Resultado ruim nos últimos cinco anos.) */
export const revisavel = (v: Vida, id: IdProcedimento) => (v.eu.procedimentos ?? []).some(x => x.id === id && (x.resultado === 'abaixo' || x.resultado === 'complicacao') && v.t - x.t <= 60 && !x.revisado);

export function disponibilidadeProcedimento(v: Vida, id: string, clinica: Clinica, alvo?: string, revisao = false): Veredito {
  const p = procedimento(id);
  if (!p || !CLINICAS[clinica]) return bloqueio('impossivel', 'Esse procedimento não existe.');
  const i = idade(v);
  if (i < p.idadeMin) return bloqueio('impossivel', `A partir dos ${p.idadeMin} anos.`);
  if (v.justica?.prisao) return bloqueio('incompativel', 'Não da prisão.');
  if (revisao && !revisavel(v, p.id)) return bloqueio('impossivel', 'Não há o que revisar.');
  if (!revisao) { const c = p.cabe(v); if (c) return bloqueio('impossivel', c); }
  const rec = emRecuperacao(v);
  if (rec) return bloqueio('incompativel', `Ainda em recuperação da ${rec}.`);
  if (v.corpo.saude < 45) return bloqueio('incompativel', 'Com a saúde assim, nenhum cirurgião sério opera — e é bom que não opere.');
  if (p.alvos && !revisao && (!alvo || !p.alvos(v).some(a => a.id === alvo))) return bloqueio('impossivel', 'Escolha o que mudar.');
  return vereditoDePagar(v, precoDoProcedimento(v, p.id, clinica, revisao), 'Custa') ?? PERMITIDO;
}

/** A chance de complicação (o risco do procedimento, a clínica, a idade, a saúde, o fumo). */
export function riscoDe(v: Vida, id: IdProcedimento, clinica: Clinica): number {
  const p = procedimento(id)!;
  const i = idade(v);
  return Math.min(0.3, p.risco * CLINICAS[clinica].risco * (1 + (i >= 60 ? 0.6 : 0) + (v.corpo.saude < 65 ? 0.6 : 0) + (v.corpo.habitos.fuma ? 0.5 : 0)));
}

export function fazerProcedimento(v: Vida, r: Rng, id: IdProcedimento, clinica: Clinica, alvo?: string, revisao = false): { texto: string; titulo: string; resultado: Resultado } {
  const p = procedimento(id)!;
  const c = CLINICAS[clinica];
  const preco = precoDoProcedimento(v, id, clinica, revisao);
  pagar(v, preco);
  // Antes de qualquer mudança no corpo: a genética guardada (é dela que os filhos herdam).
  guardarGenes(v.eu);
  const o = flex(v.eu.tratamento ?? v.eu.genero, 'o', 'a', 'e');
  const risco = riscoDe(v, id, clinica) * (revisao ? 1.2 : 1);
  let resultado: Resultado;
  if (r.chance(risco)) resultado = 'complicacao';
  else {
    const nota = c.mao + (revisao ? 0.08 : 0) + (r.next() - 0.5) * 0.7;
    resultado = nota > 0.66 ? 'satisfatorio' : nota > 0.4 ? 'neutro' : 'abaixo';
  }
  const alvoReal = revisao ? (v.eu.procedimentos ?? []).slice().reverse().find(x => x.id === id)?.alvo : alvo;
  if (resultado === 'satisfatorio' || resultado === 'neutro') p.aplicar(v, alvoReal);
  else if (resultado === 'abaixo') p.aplicar(v, alvoReal, true);
  else if (r.chance(0.5)) p.aplicar(v, alvoReal, true);
  if (revisao) for (const x of v.eu.procedimentos ?? []) if (x.id === id) x.revisado = true;
  v.eu.procedimentos = [...(v.eu.procedimentos ?? []), { id, t: v.t, resultado, ...(alvoReal ? { alvo: alvoReal } : {}), clinica }].slice(-12);

  const nome = p.nome.toLowerCase();
  let texto: string;
  if (resultado === 'satisfatorio') {
    v.corpo.aparencia = clamp(v.corpo.aparencia + 4); v.mente.felicidade = clamp(v.mente.felicidade + 5);
    abalar(v, `o rosto novo no espelho`, 5, -2);
    texto = `${revisao ? 'A revisão deu certo. ' : ''}${p.recuperacao ? `${p.recuperacao === 1 ? 'Um mês' : `${p.recuperacao} meses`} de inchaço e paciência — e depois, ` : ''}o espelho devolveu o que você queria. Você se pegou olhando duas vezes.`;
  } else if (resultado === 'neutro') {
    v.corpo.aparencia = clamp(v.corpo.aparencia + 1);
    texto = `Ficou bem feito — e mais discreto do que você imaginava. Quem não sabia não reparou. Você reparou: valeu, mas não mudou a vida.`;
  } else if (resultado === 'abaixo') {
    v.mente.felicidade = clamp(v.mente.felicidade - 6); v.mente.estresse = clamp(v.mente.estresse + 5);
    abalar(v, `o resultado da ${nome}`, -5, 4);
    texto = `Desinchou e não era aquilo. Não ficou feio — ficou outro. ${c.mao < 0.6 ? 'Na clínica, disseram que "é assim mesmo".' : 'O cirurgião ouviu e falou em revisão.'} Dá para revisar, pagando metade.`;
  } else {
    v.corpo.saude = clamp(v.corpo.saude - (8 + r.int(0, 6))); v.mente.estresse = clamp(v.mente.estresse + 10); v.mente.felicidade = clamp(v.mente.felicidade - 8);
    abalar(v, `a complicação da ${nome}`, -7, 8);
    texto = `Complicação: ${r.pick(['uma infecção que pediu antibiótico e mais um mês em casa', 'um hematoma que voltou para a mesa de cirurgia', 'uma cicatrização difícil, devagar, com curativo todo dia'])}. ${resultado === 'complicacao' && c.mao >= 0.7 ? 'A clínica acompanhou de perto.' : 'Você passou mais tempo no telefone com a clínica do que gostaria.'} Passou — e a saúde sentiu.`;
  }
  // Quem está perto repara (a repercussão: a parceria, a mãe).
  const par = parceiro(v);
  if (par && resultado !== 'neutro') {
    const gostou = resultado === 'satisfatorio' ? par.p.temperamento.afabilidade > -0.4 : false;
    lembrarCom(v, par.p.id, gostou ? `${par.p.nome} achou que você ficou ótim${o} depois da ${nome}.` : resultado === 'complicacao' ? `${par.p.nome} cuidou de você na recuperação da ${nome}.` : `${par.p.nome} disse que gostava de você do jeito que era.`, resultado === 'complicacao' ? 'apoio' : 'romance', 1);
    if (resultado === 'complicacao') par.vin.proximidade = clamp(par.vin.proximidade + 3);
    texto += gostou ? ` ${par.p.nome} reparou antes de você falar.` : resultado === 'complicacao' ? ` ${par.p.nome} ficou do seu lado o tempo todo.` : ` ${par.p.nome} disse que gostava de você do jeito que era.`;
  }
  escrever(v, {
    texto: resultado === 'complicacao' ? `Fez uma ${nome} (${c.nome.toLowerCase()}) e teve uma complicação na recuperação.` : `${revisao ? 'Revisou' : 'Fez'} uma ${nome}${resultado === 'satisfatorio' ? ' — e gostou do resultado' : resultado === 'abaixo' ? ' — o resultado ficou abaixo do esperado' : ''}.`,
    relevancia: resultado === 'neutro' ? 'cotidiano' : 'biografia', tema: 'saude', tom: resultado === 'satisfatorio' ? 'bom' : resultado === 'neutro' ? 'neutro' : 'ruim', escolha: true
  });
  return { texto, titulo: revisao ? `Revisão: ${nome}` : p.nome, resultado };
}

/** O ano: o preenchimento passa (o lábio volta ao natural, o da genética). */
export function processarEstetica(v: Vida): void {
  const t = v.fatos.preenchimento_labial;
  if (t === undefined || v.t - t < 18) return;
  delete v.fatos.preenchimento_labial;
  const g = geneticaDe(v.eu);
  if (g?.boca) v.eu.visual.boca = g.boca;
  escrever(v, { texto: 'O preenchimento dos lábios foi embora, como prometido. Voltou o seu.', relevancia: 'tecnico', tema: 'saude' });
}
