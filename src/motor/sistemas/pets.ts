/**
 * Animais de estimação: alguém que mora junto, não um bem.
 *
 * Um pet chega por um caminho (o abrigo, a ninhada de um vizinho, a rua, o
 * cachorro que já era da casa dos pais), tem nome, idade, jeito, vínculo e
 * história. Custa todo mês (ração, vacina, areia), pede tempo (o passeio do
 * cachorro entra na semana), envelhece mais depressa que a gente, adoece —
 * e quando adoece há sempre o que fazer: veterinário, com custo e
 * prognóstico incertos. A morte pesa na medida do vínculo (`luto`), nunca
 * como a de um filho, nunca como "item removido".
 */

import type { Rng } from '../rng';
import { clamp, criarRng } from '../rng';
import type { InfoPet, Pessoa, Vida } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, moraCom, parentes, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { economiaLocal } from '../dados/lugares';
import { dinheiro as fmt, flex } from '../texto';
import { abalar } from './abalo';
import { moraComFamiliaDeOrigem } from './domicilio';
import type { AnimalDoAbrigo } from './mercado';
import { modeloMoradia } from '../dados/bens';

export const petsDaCasa = (v: Vida) => vinculosVivos(v).filter(x => x.p.especie && x.vin.convivio.includes('casa')).map(x => x.p);

/** Os animais que são SEUS (você cuida e paga), estejam onde estiverem. */
export const seusPets = (v: Vida) => parentes(v, 'pet').filter(p => (p.pet?.tutor ?? (moraComFamiliaDeOrigem(v) ? 'familia' : 'eu')) === 'eu');

export function infoPet(v: Vida, p: Pessoa): InfoPet {
  if (!p.pet) p.pet = { porte: p.especie === 'gato' ? 'pequeno' : 'medio', origem: 'familia', tChegada: v.vinculos[p.id]?.tInicio ?? v.t, tutor: moraComFamiliaDeOrigem(v) ? 'familia' : 'eu', jeito: p.especie === 'gato' ? 'dono da casa' : 'fiel', vidaMax: p.especie === 'gato' ? 15 : 13 };
  return p.pet;
}

/** Custo mensal dos animais que o jogador sustenta. */
export function custoDosPets(v: Vida, c: number, soTutor?: 'eu'): number {
  const lista = soTutor ? seusPets(v) : moraComFamiliaDeOrigem(v) ? [] : petsDaCasa(v);
  let total = 0;
  for (const p of lista) {
    const porte = p.pet?.porte ?? 'medio';
    const base = p.especie === 'gato' ? 120 : porte === 'pequeno' ? 140 : porte === 'medio' ? 190 : 260;
    const velho = idadePessoa(v, p) >= (p.especie === 'gato' ? 11 : 9) ? 1.4 : 1;
    total += base * velho * c;
  }
  return total;
}

/* --------------------------------------------------------------- Adoção */

export function podeTerPet(v: Vida, especie: 'cachorro' | 'gato', porte: InfoPet['porte']): { grau: 'permitido' | 'improvavel' | 'requisito' | 'ilegal' | 'incompativel'; motivo?: string } {
  const i = idade(v);
  if (i < 18 && moraComFamiliaDeOrigem(v)) return { grau: 'ilegal', motivo: 'Quem decide ter um bicho em casa são os adultos da família.' };
  if (seusPets(v).length >= 4) return { grau: 'incompativel', motivo: 'Já são muitos bichos para uma casa só.' };
  const m = v.moradia;
  if ((m.tipo === 'aluguel' || m.tipo === 'republica') && m.aceitaPet === false) return { grau: 'requisito', motivo: 'O contrato do aluguel não aceita animais.' };
  if (m.tipo === 'cedida') return { grau: 'requisito', motivo: 'Morando de favor, não dá para levar um bicho.' };
  if (moraComFamiliaDeOrigem(v) && petsDaCasa(v).length >= 2) return { grau: 'improvavel', motivo: 'A casa da família já tem bicho que chegue.' };
  const modelo = m.modeloId ? modeloMoradia(m.modeloId) : undefined;
  if (especie === 'cachorro' && porte === 'grande' && modelo && !modelo.casa && modelo.quartos <= 1) return { grau: 'improvavel', motivo: 'Um cachorro grande num lugar tão pequeno sofre — e o condomínio reclama.' };
  return { grau: 'permitido' };
}

function vidaMaxima(r: Rng, especie: 'cachorro' | 'gato', porte: InfoPet['porte']): number {
  if (especie === 'gato') return r.int(13, 18);
  return porte === 'pequeno' ? r.int(13, 16) : porte === 'medio' ? r.int(11, 14) : r.int(9, 12);
}

export function adotarPet(v: Vida, r: Rng, a: Omit<AnimalDoAbrigo, 'id'>, origem: InfoPet['origem'], deQuem?: string): Pessoa {
  const pet = criarPessoa(v, r, { especie: a.especie, idade: a.idade, municipioId: v.moradia.municipioId, nome: a.nome, sobrenome: '', genero: a.genero });
  pet.pet = { porte: a.porte, origem, tChegada: v.t, tutor: 'eu', jeito: a.jeito, vidaMax: Math.max(a.idade + 2, vidaMaxima(r, a.especie, a.porte)) };
  vincular(v, pet, { parentesco: 'pet', origem: 'familia', proximidade: 45, convivio: ['casa'] });
  const bicho = a.especie === 'gato' ? flex(a.genero, 'um gato', 'uma gata') : flex(a.genero, 'um cachorro', 'uma cachorra');
  const idadeTxt = a.idade === 0 ? 'filhote' : `de ${a.idade} ${a.idade === 1 ? 'ano' : 'anos'}`;
  const como = origem === 'abrigo' ? `no abrigo${a.historia ? ` (${a.historia})` : ''}` : origem === 'doacao' ? `de ${deQuem ?? 'um conhecido'}, que não podia ficar` : origem === 'ninhada' ? `de uma ninhada${deQuem ? ` de ${deQuem}` : ''}` : origem === 'rua' ? 'da rua: apareceu na porta e foi ficando' : 'de um criador';
  escrever(v, { texto: `${a.nome} chegou: ${bicho} ${idadeTxt}, ${origem === 'rua' ? 'que veio' : `adotad${a.genero === 'feminino' ? 'a' : 'o'}`} ${como}. ${cap(a.jeito)}.`, relevancia: 'biografia', tema: 'casa', tom: 'bom', escolha: origem !== 'rua', pessoas: [pet.id] });
  lembrarCom(v, pet.id, `Chegou em casa ${como.startsWith('da rua') ? 'vind' + (a.genero === 'feminino' ? 'a' : 'o') + ' da rua' : `adotad${a.genero === 'feminino' ? 'a' : 'o'} ${como.split(' (')[0]}`}.`, 'inicio', 2);
  for (const p of moraCom(v)) if (idadePessoa(v, p) < 14 && v.vinculos[p.id]?.parentesco === 'filho') lembrarCom(v, p.id, `A chegada de ${a.nome} em casa.`, 'ritual', 1);
  abalar(v, `a chegada de ${a.nome}`, 5, 0);
  return pet;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------- Saúde */

const DOENCAS: { nome: string; gravidade: 1 | 2 | 3; tratavel: boolean; custo: [number, number] }[] = [
  { nome: 'uma otite', gravidade: 1, tratavel: true, custo: [250, 600] },
  { nome: 'uma alergia de pele', gravidade: 1, tratavel: true, custo: [300, 800] },
  { nome: 'um problema nos dentes', gravidade: 2, tratavel: true, custo: [800, 2200] },
  { nome: 'uma infecção urinária', gravidade: 2, tratavel: true, custo: [600, 1800] },
  { nome: 'uma dor na coluna', gravidade: 2, tratavel: true, custo: [1200, 3500] },
  { nome: 'um problema nos rins', gravidade: 3, tratavel: false, custo: [2500, 6000] },
  { nome: 'um tumor', gravidade: 3, tratavel: true, custo: [4000, 9500] },
  { nome: 'o coração cansado', gravidade: 3, tratavel: false, custo: [2000, 5000] }
];

/** Custo de tratar a doença de um pet nesta cidade. */
export function custoDoTratamento(v: Vida, p: Pessoa, completo: boolean): number {
  const d = p.pet?.doenca;
  if (!d) return 0;
  const base = d.gravidade === 1 ? 450 : d.gravidade === 2 ? 1600 : 5500;
  const porte = p.pet!.porte === 'grande' ? 1.3 : p.pet!.porte === 'pequeno' ? 0.85 : 1;
  return Math.round(base * porte * (completo ? 1 : 0.4) * Math.sqrt(economiaLocal(v.moradia.municipioId).custo) / 10) * 10;
}

export const custoDaConsulta = (v: Vida) => Math.round(250 * Math.sqrt(economiaLocal(v.moradia.municipioId).custo) / 10) * 10;

/**
 * O ano dos animais: o vínculo cresce convivendo; com a idade, as doenças
 * aparecem. Os bichos da casa dos pais, os pais cuidam.
 */
export function processarPets(v: Vida, _r: Rng): void {
  for (const { p, vin } of vinculosVivos(v)) {
    if (!p.especie) continue;
    // Cada bicho tem o próprio acaso (não mexe no resto da vida).
    let h = (v.economia?.semente ?? 1) ^ Math.imul(v.t, 0x9e3779b1);
    for (let k = 0; k < p.id.length; k++) h = Math.imul(h ^ p.id.charCodeAt(k), 0x01000193);
    const r = criarRng(h >>> 0);
    const info = infoPet(v, p);
    const ip = idadePessoa(v, p);
    if (vin.convivio.includes('casa')) vin.proximidade = clamp(vin.proximidade + 3, 0, 95);
    const d = info.doenca;
    if (d) {
      if (info.tutor === 'familia' || !vin.convivio.includes('casa')) {
        // Na casa dos pais, eles cuidam.
        if (d.tratavel && r.chance(0.7)) info.doenca = undefined;
        continue;
      }
      if (!d.tratando && v.t - d.desde >= 12 && d.gravidade < 3 && r.chance(0.4)) {
        d.gravidade = (d.gravidade + 1) as 1 | 2 | 3;
        escrever(v, { texto: `${p.nome} piorou: ${d.nome.replace(/^um |^uma |^o /, 'o ')} sem tratamento foi ficando sério.`.replace('o o ', 'o '), relevancia: 'cotidiano', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
      }
      continue;
    }
    const velho = Math.max(0, ip - (info.vidaMax - 6));
    const chance = 0.05 + velho * 0.07 - (info.tVeterinario !== undefined && v.t - info.tVeterinario <= 12 ? 0.03 : 0);
    if (r.chance(Math.min(0.6, chance))) {
      const lista = DOENCAS.filter(x => (velho >= 3 ? true : x.gravidade < 3));
      const x = r.weighted(lista, y => (y.gravidade === 3 ? velho * 0.5 : y.gravidade === 2 ? 1 : 1.5))!;
      info.doenca = { nome: x.nome, desde: v.t, gravidade: x.gravidade, tratando: false, tratavel: x.tratavel };
      if (info.tutor === 'eu' && vin.convivio.includes('casa')) {
        escrever(v, { texto: `${p.nome} ficou doente: ${x.nome}. ${x.gravidade === 3 ? 'O veterinário foi sério ao explicar.' : 'Precisa de veterinário.'}`, relevancia: x.gravidade === 3 ? 'biografia' : 'cotidiano', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
        abalar(v, `${p.nome} doente`, -2, 3);
      }
    }
  }
}

/** Risco de morte de um pet neste ano (usado por `corpo`). */
export function riscoDoPet(v: Vida, p: Pessoa): number {
  const info = infoPet(v, p);
  const ip = idadePessoa(v, p);
  let risco = ip >= info.vidaMax ? 0.6 : ip >= info.vidaMax - 2 ? 0.2 : ip >= info.vidaMax - 4 ? 0.06 : 0.01;
  const d = info.doenca;
  if (d?.gravidade === 3) risco += d.tratando ? (d.tratavel ? 0.08 : 0.25) : 0.45;
  else if (d?.gravidade === 2 && !d.tratando) risco += 0.03;
  if (v.fatos[`paliativo_${p.id}`] !== undefined) risco = Math.max(risco, 0.85);
  return Math.min(0.95, risco);
}

/* ------------------------------------------------------------ Veterinário */

export type OpcaoVeterinario = 'consulta' | 'tratar' | 'basico' | 'paliativo';

export function disponibilidadeVeterinario(v: Vida, p: Pessoa | undefined, opcao: OpcaoVeterinario): { ok: boolean; motivo?: string } {
  if (!p || !p.especie || !p.vivo) return { ok: false, motivo: 'Não há esse animal.' };
  const info = infoPet(v, p);
  if (!v.vinculos[p.id]?.convivio.includes('casa') && info.tutor !== 'eu') return { ok: false, motivo: `${p.nome} mora com a família; lá cuidam dele.` };
  if (info.tutor === 'familia' && moraComFamiliaDeOrigem(v) && idade(v) < 18) return { ok: false, motivo: 'Quem leva ao veterinário são os adultos da casa.' };
  const d = info.doenca;
  const conta = v.financas.conta;
  switch (opcao) {
    case 'consulta': {
      if (d) return { ok: false, motivo: 'Já está doente: é caso de tratar.' };
      if (info.tVeterinario !== undefined && v.t - info.tVeterinario < 12) return { ok: false, motivo: 'Já passou no veterinário este ano.' };
      return conta >= custoDaConsulta(v) ? { ok: true } : { ok: false, motivo: `A consulta custa ${fmt(custoDaConsulta(v))}.` };
    }
    case 'tratar': case 'basico': {
      if (!d) return { ok: false, motivo: 'Não está doente.' };
      if (d.tratando) return { ok: false, motivo: 'Já está em tratamento.' };
      const custo = custoDoTratamento(v, p, opcao === 'tratar');
      return conta >= custo ? { ok: true } : { ok: false, motivo: `Custa ${fmt(custo)}; na conta há ${fmt(Math.max(0, conta))}.` };
    }
    case 'paliativo':
      if (!d || d.gravidade < 3) return { ok: false, motivo: 'Não é o caso.' };
      if (v.fatos[`paliativo_${p.id}`] !== undefined) return { ok: false, motivo: 'Já está sendo cuidado para não sofrer.' };
      return { ok: true };
  }
}

export function executarVeterinario(v: Vida, r: Rng, p: Pessoa, opcao: OpcaoVeterinario): string {
  const info = infoPet(v, p);
  const d = info.doenca;
  info.tVeterinario = v.t;
  const ele = flex(p.genero, 'ele', 'ela');
  if (opcao === 'consulta') {
    const custo = custoDaConsulta(v);
    v.financas.conta -= custo;
    return `Consulta, vacinas em dia (${fmt(custo)}). O veterinário disse que ${p.nome} está bem${idadePessoa(v, p) >= info.vidaMax - 4 ? ' para a idade — mas que é hora de acompanhar mais de perto' : ''}.`;
  }
  if (opcao === 'paliativo') {
    v.fatos[`paliativo_${p.id}`] = v.t;
    d!.tratando = true;
    lembrarCom(v, p.id, 'Os últimos tempos foram de colo e cuidado, sem sofrimento.', 'perda', 2);
    return `Com o veterinário, você decidiu não insistir no que só prolongaria a dor. ${p.nome} vai ter colo, remédio para não sentir dor e a casa por perto.`;
  }
  const completo = opcao === 'tratar';
  const custo = custoDoTratamento(v, p, completo);
  v.financas.conta -= custo;
  const chance = !d!.tratavel ? 0 : d!.gravidade === 1 ? (completo ? 0.95 : 0.8) : d!.gravidade === 2 ? (completo ? 0.88 : 0.5) : (completo ? 0.6 : 0.2);
  if (r.chance(chance)) {
    info.doenca = undefined;
    v.vinculos[p.id].proximidade = clamp(v.vinculos[p.id].proximidade + 3);
    if (d!.gravidade >= 2) lembrarCom(v, p.id, `Sarou de ${d!.nome}.`, 'apoio', 1);
    return `${completo ? 'Tratamento completo' : 'O tratamento possível'} (${fmt(custo)}). Deu certo: ${p.nome} voltou a ser ${ele} mesm${flex(p.genero, 'o', 'a')}.`;
  }
  d!.tratando = true;
  if (!d!.tratavel) return `O veterinário foi honesto: ${d!.nome} não tem cura. O tratamento (${fmt(custo)}) dá mais tempo e menos dor.`;
  return `Tratamento feito (${fmt(custo)}), mas ${p.nome} ainda não se recuperou. É esperar e acompanhar.`;
}

/** Texto do estado de um pet (ficha). */
export function estadoDoPet(v: Vida, p: Pessoa): string {
  const info = infoPet(v, p);
  const ip = idadePessoa(v, p);
  if (info.doenca) return `${info.doenca.tratando ? 'em tratamento' : 'doente'}: ${info.doenca.nome}`;
  if (ip >= info.vidaMax - 3) return 'velhinho, mais lento, dorme mais';
  if (ip <= 1) return 'filhote, cheio de energia';
  return 'saudável';
}
