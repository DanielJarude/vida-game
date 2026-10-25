/**
 * REWORK 12.2 — OS ANIMAIS EXÓTICOS: a loja especializada, a lei de cada lugar, a instalação, o cuidado.
 *
 * O exótico é um animal da casa como os outros (`pets`: alguém, não um bem), com o que é dele a mais:
 *
 *   A LEI      cada país (e, nos EUA, cada estado) diz o que se vende livre, o que pede licença e o que é proibido.
 *              O proibido não aparece como produto: aparece dito, com o porquê. A licença é paga e vira documento.
 *   A CASA     o terrário, o viveiro, o aquário marinho: sem a instalação, a loja não vende (e o bicho sem ela sofre).
 *   O CUIDADO  veterinário que conheça a espécie, custo todo mês, tempo na semana — ou alguém pago para cuidar
 *              (quem viaja e trabalha muito). Sem nada disso, adoece, foge.
 *   A MUDANÇA  o bicho vai junto (com a instalação); se a lei do lugar novo não deixa, fica com quem possa ficar —
 *              dito na história, nunca sumido.
 *   O ZOOLÓGICO quem tem um zoológico pode entregar o animal à instituição (se houver recinto): o mesmo bicho, com o
 *              nome, a idade, a saúde e a história.
 *
 * Nada aqui ensina a capturar, transportar ou esconder animal: a ilegalidade aparece como oferta recusável,
 * denúncia, apreensão e resgate (`paralelos`, `conteudo/bens`).
 */

import type { Especie, InstalacaoAnimal, Pessoa, Vida } from '../tipos';
import type { Rng } from '../rng';
import { rngDe } from '../rng';
import { escrever, idade, lembrarCom, vinculosVivos } from '../nucleo';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { animal, ANIMAIS } from '../dados/animais';
import { economiaLocal, municipio, paisDaCidade } from '../dados/lugares';
import { modeloMoradia } from '../dados/bens';
import { adotarPet, infoPet, podeTerPet } from './pets';
import { nomeDePet } from './mercado';
import { okDePagar, PATRIMONIO_NO_MES } from './dinheiro';
import { AO_MUDAR } from './processos';
import { empresasAtivas } from './empresas';
import { podeReceberAnimal, receberAnimalDeEstimacao } from './setores';

export type Legalidade = 'livre' | 'licenca' | 'proibido';

export interface RegraDoExotico {
  /** A instalação sem a qual a loja não vende. */
  instalacao: string;
  /** Pede veterinário de exóticos (cidade grande). */
  especialista: boolean;
  /** Os riscos do ano (fuga, doença por falta de cuidado especializado, acidente com gente). */
  riscos: { fuga: number; doenca: number; acidente: number };
  /** Em palavras: com quem vive, onde, o que come. */
  social: string;
  ambiente: string;
  alimentacao: string;
  /** A espécie no catálogo do zoológico (quando dá para entregar à instituição). */
  zoo?: string;
  /** A lei: por divisão ("US-CA"), por país ("BR") e o padrão de onde não há regra escrita. */
  lei: Record<string, Legalidade>;
  padrao: Legalidade;
  porque: string;
}

export const EXOTICOS: Partial<Record<Especie, RegraDoExotico>> = {
  arara: { instalacao: 'viveiro', especialista: true, riscos: { fuga: 0.04, doenca: 0.1, acidente: 0.03 }, social: 'precisa de companhia todo dia (ou de outra arara)', ambiente: 'viveiro grande, ao ar livre', alimentacao: 'frutas, sementes, castanhas', zoo: 'arara_caninde', lei: { BR: 'licenca', AU: 'proibido' }, padrao: 'licenca', porque: 'ave protegida pela convenção internacional de comércio de espécies: só de criadouro, com documento de cada ave' },
  furao: { instalacao: 'gaiola_ampla', especialista: true, riscos: { fuga: 0.08, doenca: 0.12, acidente: 0.01 }, social: 'brinca com quem estiver em casa', ambiente: 'gaiola ampla e algumas horas soltas por dia', alimentacao: 'ração específica de carnívoro', lei: { BR: 'licenca', 'US-CA': 'proibido', 'US-HI': 'proibido', AU: 'proibido', NZ: 'proibido' }, padrao: 'livre', porque: 'espécie que, solta, vira praga e ameaça a fauna local' },
  ourico: { instalacao: 'gaiola_ampla', especialista: true, riscos: { fuga: 0.05, doenca: 0.12, acidente: 0 }, social: 'solitário', ambiente: 'gaiola ampla aquecida, com roda', alimentacao: 'ração e insetos', lei: { BR: 'proibido', 'US-CA': 'proibido', 'US-GA': 'proibido', 'US-PA': 'proibido', AU: 'proibido', NZ: 'proibido' }, padrao: 'livre', porque: 'a importação de ouriço-pigmeu é proibida (risco sanitário e de invasão)' },
  gecko: { instalacao: 'terrario', especialista: false, riscos: { fuga: 0.03, doenca: 0.06, acidente: 0 }, social: 'sozinho ou em par de fêmeas', ambiente: 'terrário com ponto quente e toca úmida', alimentacao: 'insetos vivos e cálcio', lei: { BR: 'proibido', AU: 'proibido' }, padrao: 'livre', porque: 'répteis exóticos não podem ser importados nem vendidos aqui' },
  dragao_barbudo: { instalacao: 'terrario', especialista: true, riscos: { fuga: 0.03, doenca: 0.08, acidente: 0 }, social: 'sozinho', ambiente: 'terrário grande, luz ultravioleta e calor', alimentacao: 'verduras e insetos', lei: { BR: 'proibido', AU: 'licenca' }, padrao: 'livre', porque: 'répteis exóticos não podem ser importados nem vendidos aqui' },
  piton_bola: { instalacao: 'terrario_trancado', especialista: true, riscos: { fuga: 0.06, doenca: 0.07, acidente: 0.02 }, social: 'sozinha', ambiente: 'terrário trancado, calor e umidade certos', alimentacao: 'roedores, a cada uma ou duas semanas', zoo: 'piton_real', lei: { BR: 'proibido', AU: 'proibido', 'US-FL': 'licenca', 'US-NY': 'licenca', GB: 'livre', DE: 'livre', JP: 'licenca' }, padrao: 'licenca', porque: 'serpentes exóticas não podem ser importadas nem vendidas aqui' },
  acara_disco: { instalacao: 'aquario_plantado', especialista: false, riscos: { fuga: 0, doenca: 0.08, acidente: 0 }, social: 'em cardume pequeno', ambiente: 'aquário quente de água mole', alimentacao: 'ração e alimento vivo', lei: {}, padrao: 'livre', porque: '' },
  peixe_palhaco: { instalacao: 'aquario_marinho', especialista: false, riscos: { fuga: 0, doenca: 0.1, acidente: 0 }, social: 'em casal', ambiente: 'aquário marinho com anêmona', alimentacao: 'ração marinha e artêmia', lei: {}, padrao: 'livre', porque: '' }
};

export interface Instalacao { id: string; nome: string; preco: number; mensal: number; descricao: string; precisaCasa?: boolean }
export const INSTALACOES: Instalacao[] = [
  { id: 'terrario', nome: 'Terrário com aquecimento e luz', preco: 1800, mensal: 60, descricao: 'Vidro, ponto quente, lâmpada ultravioleta, termostato.' },
  { id: 'terrario_trancado', nome: 'Terrário grande com tranca', preco: 3200, mensal: 80, descricao: 'Para serpente: grande, trancado, com controle de umidade.' },
  { id: 'gaiola_ampla', nome: 'Gaiola ampla com área de brincar', preco: 1500, mensal: 30, descricao: 'Andares, rede, toca; um canto da casa à prova de fuga.' },
  { id: 'viveiro', nome: 'Viveiro ao ar livre', preco: 14000, mensal: 120, descricao: 'Estrutura telada de vários metros, poleiros, abrigo da chuva. Pede casa com quintal.', precisaCasa: true },
  { id: 'aquario_plantado', nome: 'Aquário plantado de água quente', preco: 2600, mensal: 70, descricao: 'Duzentos litros, aquecedor, filtro, plantas, teste de água.' },
  { id: 'aquario_marinho', nome: 'Aquário marinho completo', preco: 9000, mensal: 220, descricao: 'Água salgada, rocha viva, anêmona, skimmer, iluminação — o mar em casa, com a conta de luz junto.' }
];
export const instalacao = (id: string) => INSTALACOES.find(x => x.id === id);

const custo = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const grande = (municipioId: string) => ['metropole', 'capital'].includes(municipio(municipioId).perfil);

/** A lei do lugar para a espécie (a divisão primeiro, depois o país, depois o padrão). */
export function legalidade(especie: Especie, municipioId: string): Legalidade {
  const x = EXOTICOS[especie];
  if (!x) return 'livre';
  const m = municipio(municipioId);
  const pais = paisDaCidade(municipioId);
  return x.lei[`${pais}-${m.uf}`] ?? x.lei[pais] ?? x.padrao;
}

export const ehExotico = (p: Pessoa) => !!p.especie && !!animal(p.especie).exotico;
/** Os exóticos que são seus e estão com você (não os que fugiram nem os que foram para uma instituição). */
export const seusExoticos = (v: Vida) => vinculosVivos(v).filter(x => ehExotico(x.p) && x.p.pet?.tutor === 'eu' && x.vin.convivio.includes('casa')).map(x => x.p);
export const instalacoes = (v: Vida): InstalacaoAnimal[] => v.financas.instalacoes ?? [];
export const temInstalacao = (v: Vida, tipo: string, municipioId = v.moradia.municipioId) => instalacoes(v).some(i => i.tipo === tipo && i.municipioId === municipioId);

/* ------------------------------------------------------------------ a loja */

export interface OfertaExotica { id: string; especie: Especie; nome: string; genero: 'masculino' | 'feminino'; idade: number; jeito: string; preco: number; licenca: number; legal: Legalidade; instalacao: string; documentos: string }

/** A loja existe (só em cidade grande: o veterinário de exóticos e o criadouro autorizado moram lá). */
export const lojaDeExoticosNaCidade = (municipioId: string) => grande(municipioId);

/** O que a loja tem neste ano (só o que a lei do lugar deixa vender). */
export function ofertasExoticas(v: Vida): OfertaExotica[] {
  const onde = v.moradia.municipioId;
  if (!lojaDeExoticosNaCidade(onde)) return [];
  const ano = anoDe(v.t);
  const r = rngDe(v.economia?.semente ?? 1, 'exoticos', ano, onde);
  const c = custo(v);
  const out: OfertaExotica[] = [];
  let i = 0;
  for (const a of ANIMAIS.filter(x => x.exotico)) {
    const legal = legalidade(a.id, onde);
    const aparece = r.chance(0.75);
    const genero = r.chance(0.5) ? 'masculino' : 'feminino';
    const preco = Math.round(r.int(a.preco[0], a.preco[1]) * c / 10) * 10;
    if (legal === 'proibido' || !aparece) { i++; continue; }
    const regra = EXOTICOS[a.id]!;
    out.push({
      id: `ex-${ano}-${i++}`, especie: a.id, nome: nomeDePet(r, a.id, genero), genero, idade: a.grupo === 'peixe' ? 0 : r.int(0, 2), jeito: r.pick(a.jeitos)[genero === 'feminino' ? 1 : 0], preco,
      licenca: legal === 'licenca' ? Math.round(900 * c / 10) * 10 : 0, legal, instalacao: regra.instalacao,
      documentos: legal === 'licenca' ? 'nota fiscal do criadouro, marcação individual e licença de mantenedor em seu nome' : a.grupo === 'peixe' ? 'nota fiscal (nascido em cativeiro)' : 'nota fiscal do criadouro e microchip'
    });
  }
  return out;
}

/** As espécies que a lei daqui não deixa vender (a tela diz quais e por quê — não vira produto). */
export const proibidosAqui = (v: Vida) => ANIMAIS.filter(a => a.exotico && legalidade(a.id, v.moradia.municipioId) === 'proibido').map(a => ({ especie: a.id, nome: a.nome[0], porque: EXOTICOS[a.id]!.porque }));

export function disponibilidadeComprarExotico(v: Vida, id: string): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  const o = ofertasExoticas(v).find(x => x.id === id);
  if (!o) return { ok: false, motivo: 'Esse animal já foi vendido.' };
  if (idade(v) < 18) return { ok: false, motivo: 'Comprar um animal é coisa de adulto.' };
  if (v.anoAtual.acoes.includes('adotou_pet')) return { ok: false, motivo: 'Um bicho novo por ano já é bastante.' };
  const d = podeTerPet(v, o.especie, 'pequeno');
  if (d.grau !== 'permitido') return { ok: false, motivo: d.motivo };
  if (!temInstalacao(v, o.instalacao)) return { ok: false, motivo: `Sem ${instalacao(o.instalacao)!.nome.toLowerCase()} montado em casa, a loja não vende — é a regra (e é o que o bicho precisa).` };
  return okDePagar(v, o.preco + o.licenca, o.licenca ? 'Com a licença, custa' : 'Custa');
}

export function comprarExotico(v: Vida, r: Rng, id: string): Pessoa {
  const o = ofertasExoticas(v).find(x => x.id === id)!;
  v.financas.conta -= o.preco + o.licenca;
  v.anoAtual.acoes.push('adotou_pet');
  const pet = adotarPet(v, r, { especie: o.especie, nome: o.nome, genero: o.genero, idade: o.idade, jeito: o.jeito, porte: 'pequeno', historia: 'de um criadouro autorizado' }, 'criador');
  const p = infoPet(v, pet);
  p.documentado = true;
  p.instalacao = instalacoes(v).find(i => i.tipo === o.instalacao && i.municipioId === v.moradia.municipioId)?.id;
  return pet;
}

/* ------------------------------------------------------------ as instalações */

export function disponibilidadeInstalacao(v: Vida, tipo: string): { ok: boolean; motivo?: string; resgate?: { valor: number; naBaixa: string[] } } {
  const x = instalacao(tipo);
  if (!x) return { ok: false, motivo: 'Isso não existe.' };
  if (idade(v) < 18) return { ok: false, motivo: 'A partir dos 18.' };
  if (temInstalacao(v, tipo)) return { ok: false, motivo: 'Já tem um montado em casa.' };
  if (x.precisaCasa) {
    const m = v.moradia.modeloId ? modeloMoradia(v.moradia.modeloId) : undefined;
    if (!m?.casa) return { ok: false, motivo: 'Viveiro pede casa com quintal: num apartamento, não cabe (nem o condomínio deixa).' };
  }
  return okDePagar(v, precoDaInstalacao(v, tipo), 'Custa');
}
export const precoDaInstalacao = (v: Vida, tipo: string) => Math.round((instalacao(tipo)?.preco ?? 0) * custo(v) / 10) * 10;

export function comprarInstalacao(v: Vida, tipo: string): string {
  const x = instalacao(tipo)!;
  const preco = precoDaInstalacao(v, tipo);
  v.financas.conta -= preco;
  (v.financas.instalacoes ??= []).push({ id: `inst${v.seq++}`, tipo, t: v.t, preco, municipioId: v.moradia.municipioId });
  return `${x.nome} montado em casa (${fmt(preco)}). Custa uns ${fmt(Math.round(x.mensal * custo(v)))} por mês de luz, filtro, lâmpada e manutenção.`;
}

/** O custo do mês: as instalações (luz, filtro, lâmpada) e o cuidador dos que têm cuidador. */
export function custoMensalDosExoticos(v: Vida): { rotulo: string; valor: number }[] {
  const c = custo(v);
  const out: { rotulo: string; valor: number }[] = [];
  const inst = instalacoes(v).reduce((s, i) => s + (instalacao(i.tipo)?.mensal ?? 0), 0) * c;
  if (inst > 0) out.push({ rotulo: 'Instalações dos animais (luz, filtro, manutenção)', valor: inst });
  const cuidados = vinculosVivos(v).filter(x => x.p.especie && x.p.pet?.tutor === 'eu' && x.p.pet.cuidador && x.vin.convivio.includes('casa')).length;
  if (cuidados) out.push({ rotulo: 'Cuidador dos animais', valor: cuidados * 480 * c });
  return out;
}
PATRIMONIO_NO_MES.push(custoMensalDosExoticos);

/* ------------------------------------------------------------ o cuidador */

export function disponibilidadeCuidador(v: Vida, petId: string, ligar: boolean): { ok: boolean; motivo?: string } {
  const p = v.pessoas[petId];
  if (!p?.especie || !p.vivo || p.pet?.tutor !== 'eu') return { ok: false, motivo: 'Não se aplica.' };
  if (!!p.pet.cuidador === ligar) return { ok: false, motivo: ligar ? 'Já tem quem cuide.' : 'Não tem cuidador.' };
  return { ok: true };
}

export function definirCuidador(v: Vida, petId: string, ligar: boolean): string {
  const p = v.pessoas[petId];
  infoPet(v, p).cuidador = ligar || undefined;
  if (!ligar) delete p.pet!.cuidador;
  return ligar ? `Alguém de confiança passa a cuidar de ${p.nome} no dia a dia (${fmt(Math.round(480 * custo(v)))} por mês): viagem e semana puxada deixam de ser um problema para o bicho.` : `${p.nome} volta a ser cuidado só por você.`;
}

/* ------------------------------------------------------------ o ano */

/**
 * O ano dos exóticos: sem a instalação, sem veterinário de exótico há tempo, sozinho numa viagem — o bicho adoece, ou
 * foge. O documentado não teme fiscalização; o sem papel, sim. Sorteios derivados: o acaso da vida não muda.
 */
export function processarExoticos(v: Vida): void {
  const viajou = ['exp_viagem_pais', 'exp_viagem_exterior'].some(k => v.fatos[k] !== undefined && v.t - v.fatos[k] < 12);
  for (const p of seusExoticos(v)) {
    const regra = EXOTICOS[p.especie!];
    if (!regra) continue;
    const info = infoPet(v, p);
    const r = rngDe(v.id, 'exotico', p.id, v.t);
    const semCasa = !temInstalacao(v, regra.instalacao);
    const semVet = regra.especialista && (info.tVeterinario === undefined || v.t - info.tVeterinario > 24);
    const sozinho = viajou && !info.cuidador;
    if (semCasa) info.instalacao = undefined;
    // A doença que só o veterinário de exóticos reconhece.
    if (!info.doenca && r.chance(regra.riscos.doenca * (semVet ? 1.6 : 0.7) * (semCasa ? 2 : 1) * (sozinho ? 1.4 : 1))) {
      info.doenca = { nome: semCasa ? 'um problema de saúde de quem vive sem o ambiente certo' : 'um problema que só um veterinário de exóticos reconhece', desde: v.t, gravidade: 2, tratando: false, tratavel: true };
      escrever(v, { texto: `${p.nome} adoeceu: ${info.doenca.nome}.`, relevancia: 'cotidiano', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
    }
    // A fuga: a gaiola sem tranca, a janela aberta, a viagem sem ninguém.
    if (r.chance(regra.riscos.fuga * (semCasa ? 3 : 1) * (sozinho ? 2 : 1) * (info.cuidador ? 0.5 : 1))) { fugir(v, p, r); continue; }
    if (regra.riscos.acidente && r.chance(regra.riscos.acidente)) {
      const multa = Math.round(1500 * custo(v) / 10) * 10;
      v.financas.conta -= multa;
      escrever(v, { texto: `${p.nome} assustou (e machucou de leve) uma visita. Pediu desculpa, pagou a farmácia e um jantar — ${fmt(multa)} no total.`, relevancia: 'cotidiano', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
    }
  }
}

function fugir(v: Vida, p: Pessoa, r: Rng): void {
  const vin = v.vinculos[p.id];
  if (vin) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  infoPet(v, p).fugiu = v.t;
  const achou = r.chance(0.35);
  if (achou) {
    if (vin) vin.convivio.push('casa');
    delete p.pet!.fugiu;
    escrever(v, { texto: `${p.nome} fugiu — e, dois dias depois, um vizinho achou e devolveu.`, relevancia: 'cotidiano', tema: 'casa', pessoas: [p.id] });
    return;
  }
  lembrarCom(v, p.id, 'O dia em que fugiu e não voltou.', 'perda', 2);
  escrever(v, { texto: `${p.nome} fugiu e não foi encontrad${animal(p.especie).generoFixo === 'f' ? 'a' : 'o'}. A casa ficou estranha.`, relevancia: 'biografia', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
}

/* ------------------------------------------------------------ a mudança */

AO_MUDAR.push((v, origem, destino) => {
  for (const p of vinculosVivos(v).filter(x => ehExotico(x.p) && x.p.pet?.tutor === 'eu').map(x => x.p)) {
    const lei = legalidade(p.especie!, destino);
    const info = infoPet(v, p);
    const inst = instalacoes(v).find(i => i.id === info.instalacao);
    if (lei === 'proibido') {
      // Não pode entrar: fica com quem pode ficar (um criadouro autorizado, uma instituição) — nunca some.
      const vin = v.vinculos[p.id];
      if (vin) vin.convivio = vin.convivio.filter(c => c !== 'casa');
      p.municipioId = origem;
      info.tutor = 'familia';
      info.instituicao = 'um criadouro autorizado';
      lembrarCom(v, p.id, `Ficou em ${municipio(origem).nome} quando você se mudou: no lugar novo, a lei não deixa.`, 'distancia', 2);
      escrever(v, { texto: `${p.nome} não pôde ir na mudança para ${municipio(destino).nome}: lá, a lei proíbe a espécie. Ficou com um criadouro autorizado de ${municipio(origem).nome}, que manda notícias.`, relevancia: 'biografia', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
      continue;
    }
    if (inst) inst.municipioId = destino;
    if (lei === 'licenca' && paisDaCidade(origem) !== paisDaCidade(destino)) {
      const taxa = Math.round(1200 * economiaLocal(destino).custo / 10) * 10;
      v.financas.conta -= taxa;
      escrever(v, { texto: `${p.nome} foi junto, com quarentena, papéis e a licença do lugar novo (${fmt(taxa)}).`, relevancia: 'cotidiano', tema: 'casa', pessoas: [p.id] });
    }
  }
  // As instalações sem bicho que vá junto ficam e são vendidas como usadas (dito no extrato da mudança).
  for (const i of instalacoes(v).filter(x => x.municipioId === origem)) {
    const usada = vinculosVivos(v).some(x => x.p.pet?.instalacao === i.id && x.p.pet?.tutor === 'eu');
    if (!usada) { v.financas.conta += Math.round(i.preco * 0.3); v.financas.instalacoes = instalacoes(v).filter(x => x !== i); }
  }
});

/* ------------------------------------------------------------ o zoológico */

/** Os seus zoológicos que podem receber este animal (a espécie existe no acervo; há recinto com vaga). */
export function zoologicosParaOPet(v: Vida, p: Pessoa) {
  const x = p.especie ? EXOTICOS[p.especie] ?? (p.especie === 'papagaio' ? { zoo: 'papagaio' } as RegraDoExotico : p.especie === 'jabuti' ? { zoo: 'jabuti' } as RegraDoExotico : undefined) : undefined;
  if (!x?.zoo) return [];
  return empresasAtivas(v).filter(e => e.tipo === 'zoologico' && e.papel !== 'investidor').map(e => ({ e, motivo: podeReceberAnimal(e, x.zoo!, true) }));
}

export function disponibilidadePetAoZoo(v: Vida, petId: string, empresaId: string): { ok: boolean; motivo?: string } {
  const p = v.pessoas[petId];
  if (!p?.especie || !p.vivo || p.pet?.tutor !== 'eu') return { ok: false, motivo: 'Não se aplica.' };
  const z = zoologicosParaOPet(v, p).find(x => x.e.id === empresaId);
  if (!z) return { ok: false, motivo: 'Esse zoológico não recebe esta espécie.' };
  if (z.motivo) return { ok: false, motivo: z.motivo };
  return { ok: true };
}

/** Entregar o seu animal ao seu zoológico: o mesmo indivíduo (nome, idade, saúde, história) passa a viver no recinto. */
export function petAoZoo(v: Vida, petId: string, empresaId: string): string {
  const p = v.pessoas[petId];
  const e = empresasAtivas(v).find(x => x.id === empresaId)!;
  const x = EXOTICOS[p.especie!]?.zoo ?? p.especie!;
  const saude = p.pet?.doenca ? 50 : 82;
  receberAnimalDeEstimacao(v, e, x, p.nome, p.genero === 'feminino' ? 'feminino' : 'masculino', p.tNasc, saude, p.id, `Era de ${v.eu.nome}; entregue à instituição em ${anoDe(v.t)}.`);
  const vin = v.vinculos[p.id];
  if (vin) vin.convivio = vin.convivio.filter(c => c !== 'casa');
  infoPet(v, p).tutor = 'familia';
  p.pet!.instituicao = e.nome;
  lembrarCom(v, p.id, `Foi morar no ${e.nome}, num recinto de verdade.`, 'distancia', 2);
  (e.historia ??= []).push({ t: v.t, texto: `Recebeu ${p.nome}, que era seu.` });
  escrever(v, { texto: `${p.nome} foi morar no ${e.nome}: recinto de verdade, outros da espécie, veterinário todo dia. Dá para visitar.`, relevancia: 'biografia', tema: 'casa', pessoas: [p.id] });
  return `${p.nome} está no ${e.nome} — o mesmo bicho, com o mesmo nome, agora com espaço e companhia.`;
}

