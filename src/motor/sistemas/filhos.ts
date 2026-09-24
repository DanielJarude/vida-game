/**
 * Filhos, netos, bisnetos: gente que cresce com o jogador.
 *
 * PARENTALIDADE — a relação com um filho acumula PRESENÇA (tempo dedicado,
 * ano a ano) e ATRITO (as brigas da adolescência). Nada disso é um medidor de
 * "bom pai": é o que faz o afeto de um filho de 30 anos ser o que é, e o que
 * a ficha conta em palavras ("você esteve presente nos anos que contam").
 *
 * TRAJETÓRIA — descendentes não rodam o motor do jogador. Têm uma vida
 * simplificada e coerente: escola → formação ou outro caminho → trabalho →
 * progressão, estagnação explicada, desemprego → parceria → filhos. As
 * escolhas deles são deles (passar na pública, largar o curso, casar,
 * mudar de cidade). O jogador não decide por um filho adulto — mas fica
 * sabendo: AUTONOMIA NÃO É OPACIDADE.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Pessoa, TipoEvento, TipoTrajetoria, Vida, Vinculo, Relevancia } from '../tipos';
import { emRecessao, escrever, idade, idadePessoa, lembrarCom, marcarFato, temFato, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular, visualHerdado } from '../pessoas';
import { OCUPACOES, OCUPACOES_POR_CLASSE, ocupacao, type Ocupacao } from '../dados/ocupacoes';
import type { AreaFormacao } from '../dados/cursos';
import { liquido, salarioLocal } from './renda';
import { rendaPerCapita } from './domicilio';
import { sortearNome } from '../dados/nomes';
import { MUNICIPIOS, municipio } from '../dados/lugares';
import { flex, ge } from '../texto';
import { anoDe, MESES, mesDe } from '../tempo';
import { faseDeIdade, mesmaCidade, moraJunto } from './vinculos';

/** Cursos que os descendentes fazem: nome, ocupação de entrada, área de formação. */
export const CURSOS_DOS_FILHOS: [curso: string, ocupacaoId: string, area: AreaFormacao][] = [
  ['Direito', 'advogado_jr', 'direito'], ['Enfermagem', 'enfermeiro', 'enfermagem'], ['Engenharia Civil', 'eng_jr', 'engenharia_civil'],
  ['Administração', 'analista_adm', 'administracao'], ['Pedagogia', 'professor_fund', 'educacao'], ['Ciência da Computação', 'dev_jr', 'computacao'],
  ['Psicologia', 'psicologo', 'psicologia'], ['Ciências Contábeis', 'contador', 'contabilidade']
];
const TECNICOS: [curso: string, ocupacaoId: string, area: AreaFormacao][] = [
  ['Técnico em Enfermagem', 'tec_enfermagem', 'enfermagem'], ['Técnico em Informática', 'suporte_ti', 'computacao'], ['Técnico em Eletrotécnica', 'tecnico_industrial', 'eletrotecnica']
];
const areaDoCurso = (curso?: string) => [...CURSOS_DOS_FILHOS, ...TECNICOS].find(c => c[0] === curso)?.[2];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/** A vida própria de alguém começa com uma sorte que não se escolhe. */
export function garantirVida(p: Pessoa): NonNullable<Pessoa['vida']> {
  if (!p.vida) {
    p.vida = {
      aptidao: Math.round((hash(p.id + 'apt') * 2 - 1) * 0.5 * 100) / 100,
      escolaridade: 'fundamental',
      experiencia: 0,
      trajetoria: []
    };
    if (p.formacao) p.vida.escolaridade = p.formacao.startsWith('Técnico') ? 'tecnico' : 'superior';
  }
  return p.vida;
}

function garantirVidaEm(v: Vida, p: Pessoa): NonNullable<Pessoa['vida']> {
  const nova = !p.vida;
  const vida = garantirVida(p);
  if (nova) {
    const i = idadePessoa(v, p);
    if (!p.formacao && i >= 18 && p.ocupacao && p.ocupacao !== 'estudante') vida.escolaridade = 'medio';
    if (p.ocupacaoId) vida.tCargo = v.t - 12;
  }
  return vida;
}

/* ------------------------------------------------------------ Comunicação */

interface Cota { bio: number }

/**
 * O jogador fica sabendo. Uma linha na Linha da Vida (biografia ou cotidiano,
 * conforme o peso e quantas notícias já houve no ano) e um marco na vida da pessoa.
 */
function comunicar(v: Vida, p: Pessoa, cota: Cota, o: {
  texto: string; tipo: TipoTrajetoria; relevancia?: Relevancia; tom?: 'bom' | 'ruim' | 'neutro';
  evento?: TipoEvento; peso?: number; marco?: string; pesoMarco?: number; t?: number;
}): void {
  const vida = garantirVidaEm(v, p);
  vida.trajetoria.push({ t: o.t ?? v.t, texto: o.texto, tipo: o.tipo });
  if (vida.trajetoria.length > 24) vida.trajetoria.splice(0, vida.trajetoria.length - 24);
  let rel = o.relevancia ?? 'biografia';
  if (rel === 'biografia') { if (cota.bio >= 3) rel = 'cotidiano'; else cota.bio++; }
  const vin = v.vinculos[p.id];
  const tema = vin?.parentesco === 'filho' || vin?.parentesco === 'enteado' ? 'filhos' : 'familia';
  escrever(v, { texto: o.texto, relevancia: rel, tema, tom: o.tom, pessoas: [p.id], t: o.t, evento: o.evento ? { tipo: o.evento, pessoaId: p.id, peso: o.peso } : undefined });
  if (o.marco && vin) lembrarCom(v, p.id, o.marco, o.tipo === 'filho' ? 'filho' : o.tipo === 'estudo' || o.tipo === 'escola' ? 'escola' : o.tipo === 'trabalho' || o.tipo === 'promocao' ? 'trabalho' : o.tipo === 'casa' ? 'casa' : o.tipo === 'amor' ? 'romance' : 'antigo', o.pesoMarco ?? 1, o.t ?? v.t);
}

const nomeOc = (p: Pessoa, oc: Ocupacao) => (p.genero === 'feminino' ? oc.nome[1] : oc.nome[0]);
const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------- Processar */

/** Filhos, netos e bisnetos: vínculo com o jogador e vida própria. */
export function processarDescendentes(v: Vida, r: Rng): void {
  const cota: Cota = { bio: 0 };
  for (const { p, vin } of vinculosVivos(v)) {
    if (p.especie) continue;
    const par = vin.parentesco;
    if (par !== 'filho' && par !== 'enteado' && par !== 'neto' && par !== 'bisneto') continue;
    if (!p.nome) continue;
    const i = idadePessoa(v, p);
    garantirVidaEm(v, p);
    if (par === 'filho' || par === 'enteado') relacaoParental(v, r, p, vin, i);
    else relacaoComNeto(v, r, p, vin, i);
    trajetoria(v, r, p, vin, i, cota, par === 'filho' || par === 'enteado' ? 'filho' : 'neto');
  }
}

/* ------------------------------------------------------- Relação parental */

function dedicacaoNoAno(v: Vida, p: Pessoa): number {
  return v.anoAtual.acoes.filter(a => a.startsWith('pessoa:') && a.endsWith(`:${p.id}`)).length;
}

function relacaoParental(v: Vida, r: Rng, f: Pessoa, vin: Vinculo, i: number): void {
  const casa = moraJunto(vin);
  const ded = Math.min(3, dedicacaoNoAno(v, f));
  const rotina = v.rotinas.some(x => x.id === 'tempo_familia') ? 6 : 0;
  const pres = vin.presenca ?? (casa ? 45 : 20);
  if (i < 18) vin.presenca = clamp(Math.round(pres * 0.7 + ded * 7 + (casa ? 8 : 0) + rotina));
  else vin.presenca = clamp(Math.round(pres * 0.92 + ded * 4 + rotina / 2));
  const presenca = vin.presenca;
  if (i >= 4 && i < 18 && !f.vida?.parouDeEstudar) f.ocupacao = 'estudante';

  const contatoRecente = v.t - vin.tUltimoContato < 24 || casa;
  if (casa) vin.tUltimoContato = v.t;
  const alvo = i < 18
    ? (casa ? 45 : 25) + presenca * 0.45 - vin.tensao * 0.2
    : 32 + presenca * 0.3 + (contatoRecente ? 14 : 0) + (mesmaCidade(v, f) ? 6 : 0) + Math.min(10, vin.historia.filter(h => h.tipo === 'apoio').length * 3) - vin.tensao * 0.2;
  vin.proximidade = clamp(Math.round(vin.proximidade + (alvo - vin.proximidade) * 0.22 + r.normal() * 1.2));
  if (vin.tensao < 40) vin.confianca = clamp(Math.round(vin.confianca + ((i < 13 ? 70 : 40 + presenca * 0.45) - vin.confianca) * 0.08));

  // Adolescência: o atrito vem mais quando falta presença.
  if (i >= 13 && i <= 17 && casa) {
    const chance = presenca < 40 ? 0.32 : presenca < 65 ? 0.18 : 0.1;
    if (r.chance(chance)) {
      vin.tensao = clamp(vin.tensao + 15);
      const h = vin.habitos ?? (vin.habitos = {});
      h.atrito_adolescencia = (h.atrito_adolescencia ?? 0) + 1;
      v.fatos[`fil_problema_${f.id}`] = v.t;
    }
  }
  // Aos 18, a adolescência entra na história como ela foi.
  if (i === 18 && !temFato(v, `adolescencia_${f.id}`) && idade(v) - i >= 14) {
    marcarFato(v, `adolescencia_${f.id}`);
    const atrito = vin.habitos?.atrito_adolescencia ?? 0;
    const texto = atrito >= 3 ? `A adolescência de ${f.nome} teve porta batida, silêncio no jantar e muita briga — e passou.`
      : atrito >= 1 ? `A adolescência de ${f.nome} teve suas brigas, nenhuma que não passasse.`
        : presenca >= 60 ? `Atravessaram a adolescência de ${f.nome} sem grandes brigas.` : `A adolescência de ${f.nome} passou quieta — ${ele(f)} falava pouco em casa.`;
    lembrarCom(v, f.id, texto, atrito >= 3 ? 'conflito' : 'antigo', 2);
  }
}

function relacaoComNeto(v: Vida, r: Rng, n: Pessoa, vin: Vinculo, i: number): void {
  const ded = Math.min(3, dedicacaoNoAno(v, n));
  const perto = mesmaCidade(v, n);
  vin.presenca = clamp(Math.round((vin.presenca ?? (perto ? 30 : 10)) * 0.8 + ded * 8 + (moraJunto(vin) ? 8 : 0)));
  if (moraJunto(vin)) vin.tUltimoContato = v.t;
  const contato = v.t - vin.tUltimoContato < 24;
  const alvo = 28 + vin.presenca * 0.45 + (perto ? 12 : 0) + (contato ? 8 : 0) - vin.tensao * 0.2;
  vin.proximidade = clamp(Math.round(vin.proximidade + (alvo - vin.proximidade) * 0.2 + r.normal() * 1.2));
  if (i >= 4 && i < 18 && !n.vida?.parouDeEstudar) n.ocupacao = 'estudante';
}

/* -------------------------------------------------------------- Trajetória */

function classeDaCasa(v: Vida): string {
  const pc = rendaPerCapita(v);
  return pc > 6000 ? 'alta' : pc > 3000 ? 'media' : pc > 1600 ? 'media_baixa' : pc > 800 ? 'trabalhadora' : 'vulneravel';
}

function trajetoria(v: Vida, r: Rng, f: Pessoa, vin: Vinculo, i: number, cota: Cota, grau: 'filho' | 'neto'): void {
  const vida = garantirVidaEm(v, f);
  const k = f.id;
  const doJogador = grau === 'filho';
  const rel: Relevancia = doJogador ? 'biografia' : 'cotidiano';

  // Marcos de infância que o sistema registra na história (sem narrar a Linha da Vida: o catálogo já conta o primeiro dia).
  if (i === 6 && !vida.trajetoria.some(t => t.tipo === 'escola')) {
    vida.trajetoria.push({ t: v.t, texto: 'Começou na escola.', tipo: 'escola' });
    if (doJogador) lembrarCom(v, k, `Começou na escola${moraJunto(vin) ? ' — você levou até o portão' : ''}.`, 'escola', 1);
  }

  // Escola: quem larga o médio. Filho menor que mora com o jogador leva a pergunta para casa (decisão).
  if (i >= 15 && i <= 17 && !vida.parouDeEstudar && vida.escolaridade === 'fundamental' && !temFato(v, `fil_largar_${k}`)) {
    const risco = 0.025 + (vida.aptidao < -0.25 ? 0.05 : 0) + (classeDaCasa(v) === 'vulneravel' ? 0.03 : 0) - (vin.presenca ?? 30) / 2500;
    if (r.chance(Math.max(0.005, risco))) {
      v.fatos[`fil_largar_${k}`] = v.t;
      if (!(doJogador && moraJunto(vin))) {
        vida.parouDeEstudar = true;
        f.ocupacao = undefined;
        comunicar(v, f, cota, { texto: `${f.nome} largou a escola no ensino médio, aos ${i}.`, tipo: 'escola', relevancia: rel, tom: 'ruim', marco: doJogador ? `Largou a escola aos ${i}.` : undefined });
      }
      return;
    }
  }
  if (i >= 17 && vida.escolaridade === 'fundamental' && !vida.parouDeEstudar && !temFato(v, `concluiu_medio_${k}`)) {
    marcarFato(v, `concluiu_medio_${k}`);
    vida.escolaridade = 'medio';
    vida.trajetoria.push({ t: v.t, texto: 'Terminou o ensino médio.', tipo: 'escola' });
    if (doJogador) lembrarCom(v, k, 'Terminou o ensino médio.', 'escola', 1);
  }

  // Formatura
  if (f.estudo && v.t >= f.estudo.tFim) { formar(v, f, cota, rel, doJogador); return; }
  // Evasão da faculdade: acontece, e o jogador fica sabendo.
  if (f.estudo) {
    const e = f.estudo;
    const risco = (e.paga === 'familia' ? 0.018 : 0.035) + (vida.aptidao < -0.2 ? 0.04 : 0) + (e.paga === 'propria' ? 0.04 : 0) + (e.paga === 'familia' && v.financas.negativado ? 0.06 : 0);
    if (r.chance(risco)) {
      const ano = Math.max(1, Math.round((v.t - (e.tFim - (e.nivel === 'tecnico' ? 24 : 48))) / 12));
      if (e.paga === 'familia') delete v.fatos[`paga_faculdade_${k}`];
      f.estudo = undefined;
      vida.parouDeEstudar = true;
      f.ocupacao = f.renda > 0 ? f.ocupacao : undefined;
      comunicar(v, f, cota, { texto: `${f.nome} largou ${e.curso} no ${ano}º ano.`, tipo: 'estudo', relevancia: rel, tom: 'ruim', marco: doJogador ? `Largou ${e.curso}.` : undefined });
      f.aperto = { tipo: 'fase', t: v.t };
      return;
    }
  }
  if (f.estudo) { if (!f.renda) f.ocupacao = e2(f); return; }

  // Depois do médio: o caminho é da pessoa.
  if (i >= 17 && i <= 20 && vida.escolaridade === 'medio' && !f.formacao && !vida.parouDeEstudar && v.fatos[`fil_quer_${k}`] === undefined) {
    const pc = doJogador && moraJunto(vin) ? rendaPerCapita(v) : 1500;
    const conversou = v.fatos[`fil_conversou_${k}`] !== undefined ? 0.12 : 0;
    const quer = r.chance(clamp((pc > 2600 ? 0.72 : pc > 1200 ? 0.55 : 0.42) + vida.aptidao * 0.25 + conversou + ((vin.presenca ?? 30) - 40) / 400, 0.15, 0.92));
    v.fatos[`fil_quer_${k}`] = quer ? 1 : 0;
    if (!quer) {
      if (r.chance(0.3 + Math.max(0, vida.aptidao) * 0.3)) {
        const [curso] = r.pick(TECNICOS);
        f.estudo = { curso, paga: 'publica', tFim: v.t + 24, nivel: 'tecnico' };
        comunicar(v, f, cota, { texto: `${f.nome} entrou num curso técnico: ${curso}.`, tipo: 'estudo', relevancia: rel, marco: doJogador ? `Entrou no ${curso}.` : undefined });
      } else {
        vida.parouDeEstudar = true;
        comunicar(v, f, cota, { texto: `${f.nome} decidiu não fazer faculdade e ir trabalhar.`, tipo: 'estudo', relevancia: 'cotidiano' });
      }
      return;
    }
  }
  if (i >= 17 && i <= 21 && v.fatos[`fil_quer_${k}`] === 1 && !f.formacao && v.fatos[`fil_vest_privada_${k}`] === undefined && !f.estudo) {
    const pc = doJogador && moraJunto(vin) ? rendaPerCapita(v) : 1500;
    const idx = Math.floor(hash(k + 'curso') * CURSOS_DOS_FILHOS.length);
    const [curso] = CURSOS_DOS_FILHOS[idx];
    const escolaPrivada = doJogador && temFato(v, 'filhos_escola_privada') ? 0.22 : 0;
    const chancePublica = clamp(0.16 + escolaPrivada + (pc > 2600 ? 0.08 : 0) + vida.aptidao * 0.3 + ((vin.presenca ?? 30) > 60 ? 0.05 : 0), 0.04, 0.8);
    if (r.chance(chancePublica)) {
      f.estudo = { curso, paga: 'publica', tFim: v.t + 48, nivel: 'superior' };
      comunicar(v, f, cota, {
        texto: doJogador && moraJunto(vin) ? `${f.nome} passou no vestibular da federal para ${curso}. A lista saiu de madrugada; a casa acordou gritando.` : `${f.nome} passou na federal para ${curso}.`,
        tipo: 'estudo', relevancia: rel, tom: 'bom', evento: 'filho_marco', peso: 30, marco: `Passou na federal para ${curso}.`, pesoMarco: 2
      });
      if (doJogador) v.mente.felicidade = clamp(v.mente.felicidade + 5);
      return;
    }
    if (pc < 2200 && vida.aptidao > -0.1 && r.chance(0.4)) {
      f.estudo = { curso, paga: 'bolsa', tFim: v.t + 48, nivel: 'superior' };
      comunicar(v, f, cota, { texto: `${f.nome} conseguiu bolsa integral do ProUni para ${curso}.`, tipo: 'estudo', relevancia: rel, tom: 'bom', evento: 'filho_marco', peso: 25, marco: `Bolsa do ProUni para ${curso}.`, pesoMarco: 2 });
      return;
    }
    // Não passou na pública: se a casa é do jogador, a particular vira conversa em casa (decisão do jogador).
    if (doJogador && (moraJunto(vin) || mesmaCidade(v, f))) {
      v.fatos[`fil_vest_privada_${k}`] = v.t;
      v.fatos[`fil_curso_${k}`] = idx;
      return;
    }
    // Longe (ou neto): a pessoa resolve sozinha.
    const x = r.next();
    if (x < 0.45) {
      f.estudo = { curso, paga: 'fies', tFim: v.t + 48, nivel: 'superior' };
      comunicar(v, f, cota, { texto: `${f.nome} entrou em ${curso} numa particular, com o FIES.`, tipo: 'estudo', relevancia: rel, marco: doJogador ? `Entrou em ${curso}, com o FIES.` : undefined });
    } else if (x < 0.75) {
      f.estudo = { curso, paga: 'propria', tFim: v.t + 60, nivel: 'superior' };
      comunicar(v, f, cota, { texto: `${f.nome} começou ${curso} à noite, pagando com o próprio trabalho.`, tipo: 'estudo', relevancia: rel, marco: doJogador ? `Começou ${curso} à noite, trabalhando de dia.` : undefined });
    } else {
      v.fatos[`fil_quer_${k}`] = 0;
      vida.parouDeEstudar = true;
      comunicar(v, f, cota, { texto: `${f.nome} não passou no vestibular e foi trabalhar.`, tipo: 'estudo', relevancia: 'cotidiano' });
    }
    return;
  }

  if (i < 18) return;
  trabalho(v, r, f, vin, i, cota, rel, doJogador);
  if (i >= 19) amor(v, r, f, vin, i, cota, doJogador);
  if (i >= 20 && i <= 50) lugar(v, r, f, vin, cota, doJogador);
}

const e2 = (f: Pessoa) => (f.estudo?.nivel === 'tecnico' ? 'estudante de curso técnico' : 'estudante universitário');

function formar(v: Vida, f: Pessoa, cota: Cota, rel: Relevancia, doJogador: boolean): void {
  const e = f.estudo!;
  const vida = garantirVidaEm(v, f);
  if (e.paga === 'familia') delete v.fatos[`paga_faculdade_${f.id}`];
  f.estudo = undefined;
  f.formacao = e.curso;
  vida.escolaridade = e.nivel === 'tecnico' ? 'tecnico' : 'superior';
  const entrada = [...CURSOS_DOS_FILHOS, ...TECNICOS].find(c => c[0] === e.curso)?.[1] ?? 'analista_adm';
  const oc = ocupacao(entrada);
  const primeiro = doJogador && e.nivel !== 'tecnico' && !v.educacao.concluidos.some(c => c.nivel === 'superior');
  const foi = doJogador && v.vinculos[f.id]?.proximidade >= 40;
  comunicar(v, f, cota, {
    texto: `${f.nome} ${e.nivel === 'tecnico' ? `concluiu o curso ${e.curso.replace(/^Técnico em /, 'técnico de ')}` : `se formou em ${e.curso}`}${primeiro ? ` — ${flex(f.genero, 'o primeiro', 'a primeira', 'e primeire')} da casa com diploma` : ''}${e.paga === 'fies' ? ', com o FIES para pagar' : ''}.${foi ? ' Você aplaudiu até doer a mão.' : ''}`,
    tipo: 'estudo', relevancia: rel, tom: 'bom', evento: 'filho_marco', peso: 35, marco: foi ? `Formatura ${e.nivel === 'tecnico' ? 'do curso técnico' : `em ${e.curso}`}. Você estava lá.` : `Formou-se em ${e.curso}.`, pesoMarco: 2
  });
  if (doJogador) v.mente.felicidade = clamp(v.mente.felicidade + 6);
  empregar(v, f, oc);
  vida.trajetoria.push({ t: v.t, texto: `Primeiro emprego na área: ${nomeOc(f, oc)}.`, tipo: 'trabalho' });
}

function empregar(v: Vida, f: Pessoa, oc: Ocupacao): void {
  const vida = garantirVidaEm(v, f);
  if (f.ocupacaoId && ocupacao(f.ocupacaoId).trilha !== oc.trilha) vida.experiencia = 0;
  f.ocupacaoId = oc.id;
  f.ocupacao = nomeOc(f, oc);
  f.renda = liquido(salarioLocal(oc, f.municipioId), oc.contrato);
  vida.tCargo = v.t;
  if (f.aperto?.tipo === 'desemprego') f.aperto = undefined;
}

/** Ocupações a que a pessoa tem acesso pela formação, experiência e idade. */
function acessivel(f: Pessoa, o: Ocupacao, i: number): boolean {
  const vida = f.vida!;
  if (o.concurso || o.contrato === 'estagio' || o.contrato === 'aprendiz' || o.idadeMin > i) return false;
  const mesmaTrilha = !!f.ocupacaoId && ocupacao(f.ocupacaoId).trilha === o.trilha;
  if (o.experiencia && (!mesmaTrilha || o.experiencia > vida.experiencia)) return false;
  if (o.escolaridade === 'superior' && vida.escolaridade !== 'superior') return false;
  if (o.escolaridade === 'medio' && vida.escolaridade === 'fundamental') return false;
  if (o.area && !o.area.includes('qualquer')) {
    const area = areaDoCurso(f.formacao);
    if (!area || !o.area.includes(area)) return false;
    if (o.nivelCurso === 'superior' && vida.escolaridade !== 'superior') return false;
  }
  if (o.veiculo || (o.licenca && o.licenca !== 'oab' && o.licenca !== 'crea' && o.licenca !== 'coren' && o.licenca !== 'crp')) return false;
  return true;
}

function trabalho(v: Vida, r: Rng, f: Pessoa, _vin: Vinculo, i: number, cota: Cota, rel: Relevancia, doJogador: boolean): void {
  const vida = garantirVidaEm(v, f);
  const oc = f.ocupacaoId ? ocupacao(f.ocupacaoId) : undefined;
  const aposentado = f.ocupacao?.startsWith('aposentad');
  if (aposentado) return;
  // Aposentadoria
  if (oc && f.renda > 0 && i >= (f.genero === 'feminino' ? 62 : 65) && r.chance(0.6)) {
    f.renda = Math.max(1620, Math.round(f.renda * 0.7));
    f.ocupacao = flex(f.genero, 'aposentado', 'aposentada', 'aposentade');
    comunicar(v, f, cota, { texto: `${f.nome} se aposentou.`, tipo: 'trabalho', relevancia: 'cotidiano' });
    return;
  }
  // Sem trabalho: procura (e acha, com mais ou menos demora).
  if (f.renda === 0 && !f.estudo?.nivel) {
    const chance = f.aperto?.tipo === 'desemprego' ? 0.55 : 0.8;
    if (!r.chance(chance * (emRecessao(v) ? 0.7 : 1))) return;
    const naArea = f.formacao ? ocupacao([...CURSOS_DOS_FILHOS, ...TECNICOS].find(c => c[0] === f.formacao)?.[1] ?? 'analista_adm') : undefined;
    let escolhida = naArea && acessivel(f, naArea, i) ? naArea : undefined;
    if (!escolhida) {
      const base = OCUPACOES_POR_CLASSE[vida.escolaridade === 'fundamental' ? 'vulneravel' : vida.escolaridade === 'medio' ? 'trabalhadora' : 'media_baixa'].map(id => ocupacao(id));
      const lista = base.filter(o => acessivel(f, o, i) && o.nivel <= 2);
      escolhida = lista.length ? r.pick(lista) : ocupacao('atendente');
    }
    const antes = f.aperto?.tipo === 'desemprego';
    const primeiro = !vida.tCargo && !vida.trajetoria.some(t => t.tipo === 'trabalho' || t.tipo === 'promocao' || t.tipo === 'desemprego');
    empregar(v, f, escolhida);
    comunicar(v, f, cota, {
      texto: primeiro ? `${f.nome} arrumou o primeiro emprego: ${f.ocupacao}.` : antes ? `${f.nome} arrumou trabalho de novo, como ${f.ocupacao}.` : `${f.nome} começou a trabalhar como ${f.ocupacao}.`,
      tipo: 'trabalho', relevancia: primeiro ? rel : 'cotidiano', tom: 'bom', marco: primeiro && doJogador ? `Primeiro emprego: ${f.ocupacao}.` : undefined
    });
    return;
  }
  if (!oc || f.renda === 0) return;
  vida.experiencia += 12;
  const anosNoCargo = (v.t - (vida.tCargo ?? v.t)) / 12;
  // Demissão
  const risco = (oc.contrato === 'servidor' ? 0.003 : oc.contrato === 'clt' ? 0.04 : 0.055) * (emRecessao(v) ? 2 : 1);
  if (r.chance(risco)) {
    const cargo = f.ocupacao;
    f.renda = 0;
    f.ocupacao = flex(f.genero, 'desempregado', 'desempregada', 'desempregade');
    f.aperto = { tipo: 'desemprego', t: v.t };
    comunicar(v, f, cota, { texto: `${f.nome} perdeu o emprego de ${cargo}${emRecessao(v) ? ', no meio da crise' : ''}.`, tipo: 'desemprego', relevancia: doJogador ? 'biografia' : 'cotidiano', tom: 'ruim' });
    return;
  }
  // Promoção: depende do tempo no cargo, da experiência e da pessoa — não só da idade.
  const proximos = OCUPACOES.filter(o => o.trilha === oc.trilha && o.nivel === oc.nivel + 1 && acessivel(f, o, i));
  if (proximos.length && anosNoCargo >= 2) {
    const chance = clamp(0.22 + vida.aptidao * 0.15 + Math.min(0.15, (anosNoCargo - 2) * 0.04) - (emRecessao(v) ? 0.1 : 0), 0.05, 0.6);
    if (r.chance(chance)) {
      const novo = r.pick(proximos);
      empregar(v, f, novo);
      comunicar(v, f, cota, { texto: `${f.nome} foi ${flex(f.genero, 'promovido', 'promovida', 'promovide')}: agora é ${f.ocupacao}.`, tipo: 'promocao', relevancia: doJogador ? 'cotidiano' : 'tecnico', tom: 'bom', marco: doJogador && novo.nivel >= 4 ? `Chegou a ${f.ocupacao}.` : undefined });
      return;
    }
  }
  // Muitos anos parado no mesmo lugar: a vida explica (ou muda) — uma vez por cargo.
  const jaExplicado = v.fatos[`parado_${f.id}`] === vida.tCargo;
  if (anosNoCargo >= 5 && !jaExplicado && i < 58) {
    v.fatos[`parado_${f.id}`] = vida.tCargo ?? v.t;
    const acima = OCUPACOES.filter(o => o.trilha === oc.trilha && o.nivel === oc.nivel + 1 && !o.concurso);
    if (proximos.length) {
      // Existe o degrau e ela pode subir: a espera conta a favor na próxima chance.
      comunicar(v, f, cota, { texto: `${f.nome} segue como ${f.ocupacao}, esperando uma vaga acima que não abre.`, tipo: 'trabalho', relevancia: 'tecnico' });
      vida.tCargo = (vida.tCargo ?? v.t) - 12;
      v.fatos[`parado_${f.id}`] = vida.tCargo;
      return;
    }
    const pedeDiploma = acima.some(o => o.area || o.escolaridade === 'superior');
    const troca = !f.formacao && vida.aptidao > -0.1 && r.chance(0.35);
    if (troca && pedeDiploma) {
      f.estudo = { curso: CURSOS_DOS_FILHOS[Math.floor(hash(f.id + 'volta') * CURSOS_DOS_FILHOS.length)][0], paga: 'propria', tFim: v.t + 60, nivel: 'superior' };
      vida.parouDeEstudar = false;
      comunicar(v, f, cota, { texto: `${f.nome}, depois de anos como ${f.ocupacao}, voltou a estudar à noite: ${f.estudo.curso}.`, tipo: 'estudo', relevancia: doJogador ? 'biografia' : 'cotidiano', marco: doJogador ? `Voltou a estudar, adult${flex(f.genero, 'o', 'a', 'e')}.` : undefined });
      return;
    }
    const falta = !acima.length ? 'já chegou onde a carreira costuma chegar' : pedeDiploma ? 'sem diploma, o próximo degrau não abre' : 'a empresa não promove ninguém há anos';
    comunicar(v, f, cota, { texto: `${f.nome} segue como ${f.ocupacao}: ${falta}.`, tipo: 'trabalho', relevancia: 'cotidiano' });
  }
}

/* ----------------------------------------------------------------- Amor */

function amor(v: Vida, r: Rng, f: Pessoa, vin: Vinculo, i: number, cota: Cota, doJogador: boolean): void {
  const k = f.id;
  const par = f.parceiroId ? v.pessoas[f.parceiroId] : undefined;
  if (!par || !par.vivo) {
    if (f.parceiroId && !par) f.parceiroId = undefined;
    if (i > 55) return;
    const chance = i < 23 ? 0.1 : i < 33 ? 0.16 : i < 45 ? 0.08 : 0.04;
    if (!r.chance(chance)) return;
    const g = f.genero === 'masculino' ? (r.chance(0.9) ? 'feminino' : 'masculino') : f.genero === 'feminino' ? (r.chance(0.9) ? 'masculino' : 'feminino') : (r.chance(0.5) ? 'masculino' : 'feminino');
    const p = criarPessoa(v, r, { genero: g, idade: Math.max(18, i + r.int(-4, 4)), municipioId: f.municipioId });
    p.parceiroId = f.id;
    f.parceiroId = p.id;
    v.fatos[`namoro_${k}`] = v.t;
    delete v.fatos[`casou_${k}`];
    comunicar(v, f, cota, { texto: `${f.nome} começou a namorar ${p.nome}.`, tipo: 'amor', relevancia: 'cotidiano' });
    return;
  }
  const desde = v.fatos[`namoro_${k}`] ?? v.t;
  const casou = v.fatos[`casou_${k}`] !== undefined;
  // Separação
  if (r.chance(casou ? 0.025 : 0.1)) {
    f.parceiroId = undefined;
    par.parceiroId = undefined;
    const vinPar = v.vinculos[par.id];
    if (vinPar) { vinPar.parentesco = undefined; vinPar.estagio = 'afastado'; v.fatos[`ex_genro_${par.id}`] = v.t; }
    if (casou) f.aperto = { tipo: 'separacao', t: v.t };
    comunicar(v, f, cota, { texto: casou ? `${f.nome} e ${par.nome} se separaram.` : `${f.nome} e ${par.nome} terminaram.`, tipo: 'amor', relevancia: casou && doJogador ? 'biografia' : 'cotidiano', tom: 'ruim', marco: casou && doJogador ? `Separou-se de ${par.nome}.` : undefined });
    delete v.fatos[`casou_${k}`];
    return;
  }
  // União
  if (!casou && v.t - desde >= 12 && r.chance(0.3)) {
    v.fatos[`casou_${k}`] = v.t;
    const vinPar = v.vinculos[par.id] ?? vincular(v, par, { parentesco: 'genro', origem: 'familia', proximidade: 35 });
    vinPar.parentesco = 'genro';
    const noCartorio = r.chance(0.5);
    comunicar(v, f, cota, {
      texto: noCartorio ? `${f.nome} casou com ${par.nome}${doJogador ? '. Você foi testemunha no cartório' : ''}.` : `${f.nome} e ${par.nome} foram morar juntos.`,
      tipo: 'amor', relevancia: doJogador ? 'biografia' : 'cotidiano', tom: 'bom', evento: 'filho_marco', peso: 35,
      marco: doJogador ? (noCartorio ? `Casou com ${par.nome}.` : `Foi morar com ${par.nome}.`) : undefined, pesoMarco: 2
    });
    if (moraJunto(vin)) sairDeCasa(v, f, vin, cota, `para morar com ${par.nome}`, doJogador);
    par.municipioId = f.municipioId;
    return;
  }
  // Filhos: gestação com anúncio e parto meses depois (nunca instantâneo).
  if (casou && i >= 21 && i <= 44 && !f.gestacao && !par.gestacao) {
    const gestante = f.genero === 'feminino' ? f : par.genero === 'feminino' ? par : undefined;
    if (!gestante || idadePessoa(v, gestante) > 44) return;
    const nFilhos = Object.values(v.pessoas).filter(x => x.genitores?.includes(f.id)).length;
    const quer = hash(k + 'querfilhos');
    const alvo = quer < 0.18 ? 0 : quer < 0.55 ? 1 : quer < 0.88 ? 2 : 3;
    if (nFilhos >= alvo) return;
    if (!r.chance(nFilhos === 0 ? 0.28 : 0.18)) return;
    const tParto = v.t + r.int(3, 11);
    gestante.gestacao = { tParto, outroId: gestante === f ? par.id : f.id, anunciada: true };
    const quando = `${MESES[mesDe(tParto)]} de ${anoDe(tParto)}`;
    const texto = gestante === f
      ? `${f.nome} contou que está grávida${nFilhos ? ' de novo' : ''}. O bebê deve nascer em ${quando}.`
      : `${f.nome} contou que vai ser ${flex(f.genero, 'pai', 'mãe', 'mãe')}${nFilhos ? ' de novo' : ''}: ${par.nome} está grávida, o bebê deve nascer em ${quando}.`;
    comunicar(v, f, cota, { texto, tipo: 'filho', relevancia: doJogador ? 'biografia' : 'cotidiano', tom: 'bom', evento: 'gravidez', peso: 30 });
  }
}

/** Partos dos descendentes (e de quem é casado com eles). */
export function processarPartosDaFamilia(v: Vida, r: Rng): void {
  for (const g of Object.values(v.pessoas)) {
    if (!g.gestacao || g.gestacao.tParto > v.t) continue;
    const gest = g.gestacao;
    g.gestacao = undefined;
    if (!g.vivo) continue;
    const outro = gest.outroId ? v.pessoas[gest.outroId] : undefined;
    // Quem é do sangue do jogador (o filho ou a filha), para achar o grau do bebê.
    const doSangue = [g, outro].find(x => x && ['filho', 'enteado', 'neto'].includes(v.vinculos[x.id]?.parentesco ?? ''));
    if (!doSangue) continue;
    if (r.chance(0.1)) {
      escrever(v, { t: gest.tParto - 6, texto: `${g.nome} perdeu o bebê no terceiro mês.`, relevancia: 'biografia', tema: 'familia', tom: 'ruim', pessoas: [doSangue.id] });
      doSangue.aperto = { tipo: 'luto', t: v.t };
      continue;
    }
    nascerDescendente(v, r, doSangue, g === doSangue ? outro : g, gest.tParto);
  }
}

function nascerDescendente(v: Vida, r: Rng, pai: Pessoa, outro: Pessoa | undefined, tParto: number): void {
  const grauPai = v.vinculos[pai.id].parentesco;
  const parentesco = grauPai === 'neto' ? 'bisneto' : 'neto';
  const genero = r.chance(0.5) ? 'masculino' : 'feminino';
  const bebe = criarPessoa(v, r, { genero, idade: 0, municipioId: pai.municipioId, sobrenome: pai.sobrenome, visual: visualHerdado(r, genero, pai.visual, outro?.visual) });
  bebe.tNasc = tParto;
  const usados = new Set([v.eu.nome, ...Object.values(v.pessoas).filter(x => x.vivo).map(x => x.nome)]);
  let nome = bebe.nome;
  for (let k = 0; k < 12 && usados.has(nome); k++) nome = sortearNome(r, genero, anoDe(tParto));
  bebe.nome = nome;
  bebe.genitores = [pai.id, ...(outro ? [outro.id] : [])];
  const perto = pai.municipioId === v.moradia.municipioId;
  const vin = vincular(v, bebe, { parentesco, origem: 'familia', proximidade: perto ? 45 : 30, convivio: moraJunto(v.vinculos[pai.id]) ? ['casa'] : [] });
  vin.tInicio = tParto;
  garantirVida(bebe);
  const primeiroNeto = parentesco === 'neto' && !temFato(v, 'virou_avo');
  const primeiroBisneto = parentesco === 'bisneto' && !temFato(v, 'virou_bisavo');
  const g = ge(v);
  const deQuem = `${flex(bebe.genero, 'filho', 'filha', 'filhe')} de ${pai.nome}`;
  let texto: string;
  let evento: TipoEvento = 'neto_nasceu';
  if (primeiroNeto) {
    marcarFato(v, 'virou_avo');
    evento = 'virou_avo';
    texto = `Em ${MESES[mesDe(tParto)]}, nasceu ${nome}, ${deQuem}. ${flex(g, 'Avô', 'Avó', 'Avó')} pela primeira vez, aos ${idade(v)}.`;
  } else if (primeiroBisneto) {
    marcarFato(v, 'virou_bisavo');
    evento = 'virou_bisavo';
    texto = `Nasceu ${nome}, ${deQuem}. ${flex(g, 'Bisavô', 'Bisavó', 'Bisavó')}, aos ${idade(v)} — quatro gerações vivas ao mesmo tempo.`;
  } else {
    texto = `Nasceu ${nome}, ${deQuem}.`;
  }
  escrever(v, { t: tParto, texto, relevancia: primeiroNeto || primeiroBisneto ? 'marco' : parentesco === 'neto' ? 'biografia' : 'cotidiano', tema: 'familia', tom: 'bom', pessoas: [bebe.id, pai.id], evento: { tipo: evento, pessoaId: bebe.id, peso: primeiroNeto ? 60 : primeiroBisneto ? 50 : 25 } });
  lembrarCom(v, bebe.id, `Nasceu. ${capital(deQuem)}.`, 'inicio', 2, tParto);
  const vidaPai = garantirVida(pai);
  vidaPai.trajetoria.push({ t: tParto, texto: `Nasceu ${nome}.`, tipo: 'filho' });
  if (grauPai === 'filho' || grauPai === 'enteado') lembrarCom(v, pai.id, primeiroNeto ? `${nome} nasceu, e você virou ${flex(g, 'avô', 'avó', 'avó')}.` : `Nasceu ${nome}, ${flex(bebe.genero, 'seu neto', 'sua neta', 'sue nete')}.`, 'filho', primeiroNeto ? 3 : 2, tParto);
  v.mente.felicidade = clamp(v.mente.felicidade + (primeiroNeto ? 8 : 3));
}

/* ------------------------------------------------------------ Casa e lugar */

export function sairDeCasa(v: Vida, f: Pessoa, vin: Vinculo, cota: Cota | null, motivo: string, doJogador: boolean): void {
  if (!moraJunto(vin)) return;
  marcarFato(v, `saiu_de_casa_${f.id}`);
  vin.convivio = vin.convivio.filter(c => c !== 'casa');
  const i = idadePessoa(v, f);
  const texto = `${f.nome} saiu de casa, aos ${i}${motivo ? `, ${motivo}` : f.renda > 0 && f.ocupacao ? `, já trabalhando como ${f.ocupacao}` : ''}.`;
  if (cota) comunicar(v, f, cota, { texto, tipo: 'casa', relevancia: doJogador ? 'biografia' : 'cotidiano', evento: 'filho_saiu', peso: 35, marco: doJogador ? `Saiu de casa aos ${i}.` : undefined, pesoMarco: 2 });
  else escrever(v, { texto, relevancia: 'biografia', tema: 'filhos', pessoas: [f.id], evento: { tipo: 'filho_saiu', pessoaId: f.id, peso: 35 } });
}

function lugar(v: Vida, r: Rng, f: Pessoa, vin: Vinculo, cota: Cota, doJogador: boolean): void {
  // Sair de casa: quem trabalha sai mais cedo; quem estuda, mais tarde.
  const i = idadePessoa(v, f);
  if (moraJunto(vin) && !v.fatos[`casou_${f.id}`]) {
    const chance = 0.05 + Math.max(0, i - 20) * 0.035 + (f.renda > 0 && !f.estudo ? 0.08 : 0);
    if (r.chance(chance)) { sairDeCasa(v, f, vin, cota, '', doJogador); return; }
  }
  // Mudar de cidade (trabalho, estudo, parceria): raro, e muda a convivência.
  if (!moraJunto(vin) && r.chance(f.renda > 0 ? 0.018 : 0.008)) {
    const aqui = municipio(f.municipioId);
    const destinos = MUNICIPIOS.filter(m => m.id !== aqui.id && (m.perfil === 'metropole' || m.perfil === 'capital'));
    const destino = r.pick(destinos);
    f.municipioId = destino.id;
    if (f.parceiroId && v.pessoas[f.parceiroId]) v.pessoas[f.parceiroId].municipioId = destino.id;
    for (const x of Object.values(v.pessoas)) if (x.genitores?.includes(f.id) && x.vivo && idadePessoa(v, x) < 18) x.municipioId = destino.id;
    const eraPerto = aqui.id === v.moradia.municipioId;
    comunicar(v, f, cota, { texto: `${f.nome} se mudou para ${destino.nome}${eraPerto ? '. As visitas passaram a ser de feriado' : ''}.`, tipo: 'lugar', relevancia: doJogador && eraPerto ? 'biografia' : 'cotidiano', marco: doJogador && eraPerto ? `Mudou-se para ${destino.nome}.` : undefined, pesoMarco: 1 });
    if (eraPerto) lembrarCom(v, f.id, `Foi morar em ${destino.nome}, longe.`, 'distancia', 1);
  }
}

/** Faixa de vida da pessoa, para quem precisa (UI, conteúdo). */
export const faseDoDescendente = (v: Vida, p: Pessoa) => faseDeIdade(idadePessoa(v, p));
