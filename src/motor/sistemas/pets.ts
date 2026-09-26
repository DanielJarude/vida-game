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
import type { Especie, InfoPet, Pessoa, Vida } from '../tipos';
import { animal, bichoFeminino, palavraDoBicho, umBicho, type GrupoAnimal } from '../dados/animais';
import { escrever, idade, idadePessoa, lembrarCom, moraCom, parentes, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { economiaLocal, municipio } from '../dados/lugares';
import { dinheiro as fmt, flex } from '../texto';
import { abalar } from './abalo';
import { moraComFamiliaDeOrigem } from './domicilio';
import type { AnimalDoAbrigo } from './mercado';
import { modeloMoradia } from '../dados/bens';

export const petsDaCasa = (v: Vida) => vinculosVivos(v).filter(x => x.p.especie && x.vin.convivio.includes('casa')).map(x => x.p);

/** Os animais que são SEUS (você cuida e paga), estejam onde estiverem. */
export const seusPets = (v: Vida) => parentes(v, 'pet').filter(p => (p.pet?.tutor ?? (moraComFamiliaDeOrigem(v) ? 'familia' : 'eu')) === 'eu');

export function infoPet(v: Vida, p: Pessoa): InfoPet {
  if (!p.pet) {
    const a = animal(p.especie);
    p.pet = { porte: p.especie === 'cachorro' ? 'medio' : 'pequeno', origem: 'familia', tChegada: v.vinculos[p.id]?.tInicio ?? v.t, tutor: moraComFamiliaDeOrigem(v) ? 'familia' : 'eu', jeito: p.especie === 'gato' ? 'dono da casa' : p.especie === 'cachorro' ? 'fiel' : a.jeitos[0][0], vidaMax: Math.round((a.vida[0] + a.vida[1]) / 2) };
  }
  return p.pet;
}

/** Custo mensal dos animais que o jogador sustenta. */
export function custoDosPets(v: Vida, c: number, soTutor?: 'eu'): number {
  const lista = soTutor ? seusPets(v) : moraComFamiliaDeOrigem(v) ? [] : petsDaCasa(v);
  let total = 0;
  for (const p of lista) {
    const porte = p.pet?.porte ?? 'medio';
    const a = animal(p.especie);
    const base = p.especie === 'cachorro' ? (porte === 'pequeno' ? 140 : porte === 'medio' ? 190 : 260) : a.custo;
    const velho = idadePessoa(v, p) >= (p.pet?.vidaMax ?? a.vida[1]) * 0.75 ? 1.4 : 1;
    total += base * velho * c;
  }
  return total;
}

/* --------------------------------------------------------------- Adoção */

export function podeTerPet(v: Vida, especie: Especie, porte: InfoPet['porte']): { grau: 'permitido' | 'improvavel' | 'requisito' | 'ilegal' | 'incompativel'; motivo?: string } {
  const i = idade(v);
  const a = animal(especie);
  if (i < 18 && moraComFamiliaDeOrigem(v)) return { grau: 'ilegal', motivo: 'Quem decide ter um bicho em casa são os adultos da família.' };
  if (seusPets(v).length >= 4) return { grau: 'incompativel', motivo: 'Já são muitos bichos para uma casa só.' };
  const m = v.moradia;
  if ((m.tipo === 'aluguel' || m.tipo === 'republica') && m.aceitaPet === false && (a.grupo === 'cao' || a.grupo === 'gato' || a.grupo === 'coelho')) return { grau: 'requisito', motivo: 'O contrato do aluguel não aceita animais.' };
  if (m.tipo === 'cedida' && a.grupo !== 'peixe') return { grau: 'requisito', motivo: 'Morando de favor, não dá para levar um bicho.' };
  if (moraComFamiliaDeOrigem(v) && petsDaCasa(v).length >= 2) return { grau: 'improvavel', motivo: 'A casa da família já tem bicho que chegue.' };
  const modelo = m.modeloId ? modeloMoradia(m.modeloId) : undefined;
  const pequeno = modelo && !modelo.casa && modelo.quartos <= 1;
  if (especie === 'cachorro' && porte === 'grande' && pequeno) return { grau: 'improvavel', motivo: 'Um cachorro grande num lugar tão pequeno sofre — e o condomínio reclama.' };
  if (a.espaco === 'quintal' && modelo && !modelo.casa) return { grau: 'improvavel', motivo: `${cap(palavraDoBicho(especie, 'masculino'))} vive bem com quintal e sol; num apartamento, sofre.` };
  if (a.espaco === 'espaco' && pequeno) return { grau: 'improvavel', motivo: `${cap(palavraDoBicho(especie, 'masculino'))} precisa de espaço — num lugar deste tamanho, não vive bem.` };
  if (a.calorFaz && ['Norte', 'Nordeste', 'Centro-Oeste'].includes(regiaoDe(v))) return { grau: 'improvavel', motivo: 'Chinchila sofre com o calor forte: aqui, só com ar-condicionado o ano inteiro.' };
  if (a.barulho && modelo && !modelo.casa && especie === 'papagaio') return { grau: 'improvavel', motivo: 'Papagaio grita — e num prédio o vizinho escuta.' };
  return { grau: 'permitido' };
}

const regiaoDe = (v: Vida) => municipio(v.moradia.municipioId).regiao;

function vidaMaxima(r: Rng, especie: Especie, porte: InfoPet['porte']): number {
  if (especie === 'cachorro') return porte === 'pequeno' ? r.int(13, 16) : porte === 'medio' ? r.int(11, 14) : r.int(9, 12);
  const a = animal(especie);
  return r.int(a.vida[0], a.vida[1]);
}

export function adotarPet(v: Vida, r: Rng, a: Omit<AnimalDoAbrigo, 'id'>, origem: InfoPet['origem'], deQuem?: string): Pessoa {
  const pet = criarPessoa(v, r, { especie: a.especie, idade: a.idade, municipioId: v.moradia.municipioId, nome: a.nome, sobrenome: '', genero: a.genero });
  pet.pet = { porte: a.porte, origem, tChegada: v.t, tutor: 'eu', jeito: a.jeito, vidaMax: Math.max(a.idade + 1, vidaMaxima(r, a.especie, a.porte)), ...(animal(a.especie).silvestre ? { documentado: origem !== 'ilegal' } : {}) };
  vincular(v, pet, { parentesco: 'pet', origem: 'familia', proximidade: 45, convivio: ['casa'] });
  const bicho = umBicho(a.especie, a.genero);
  const idadeTxt = a.idade === 0 ? 'filhote' : `de ${a.idade} ${a.idade === 1 ? 'ano' : 'anos'}`;
  const comprado = origem === 'loja' || origem === 'criador' || origem === 'ilegal';
  const como = origem === 'abrigo' ? `no abrigo${a.historia ? ` (${a.historia})` : ''}` : origem === 'doacao' ? `de ${deQuem ?? 'um conhecido'}, que não podia ficar` : origem === 'ninhada' ? `de uma ninhada${deQuem ? ` de ${deQuem}` : ''}` : origem === 'rua' ? 'da rua: apareceu na porta e foi ficando' : origem === 'ilegal' ? 'na feira, sem nota nem anilha' : origem === 'criador' ? (animal(a.especie).silvestre ? 'de um criadouro autorizado, com nota fiscal e marcação' : 'de um criador') : 'numa loja de animais';
  const fem = bichoFeminino(a.especie, a.genero);
  const verbo = origem === 'rua' ? 'que veio' : `${comprado ? 'comprad' : 'adotad'}${fem ? 'a' : 'o'}`;
  escrever(v, { texto: `${a.nome} chegou: ${bicho} ${idadeTxt}, ${verbo} ${como}. ${cap(a.jeito)}.`, relevancia: 'biografia', tema: 'casa', tom: origem === 'ilegal' ? undefined : 'bom', escolha: origem !== 'rua', pessoas: [pet.id] });
  lembrarCom(v, pet.id, `Chegou em casa ${como.startsWith('da rua') ? 'vind' + (fem ? 'a' : 'o') + ' da rua' : `${verbo} ${como.split(' (')[0].split(',')[0]}`}.`, 'inicio', 2);
  for (const p of moraCom(v)) if (idadePessoa(v, p) < 14 && v.vinculos[p.id]?.parentesco === 'filho') lembrarCom(v, p.id, `A chegada de ${a.nome} em casa.`, 'ritual', 1);
  abalar(v, `a chegada de ${a.nome}`, 5, 0);
  return pet;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ------------------------------------------------------------- Saúde */

type Doenca = { nome: string; gravidade: 1 | 2 | 3; tratavel: boolean; custo: [number, number] };
const DOENCAS_GRUPO: Partial<Record<GrupoAnimal, Doenca[]>> = {
  ave: [
    { nome: 'uma infecção respiratória', gravidade: 2, tratavel: true, custo: [300, 900] },
    { nome: 'penas caindo, de estresse', gravidade: 1, tratavel: true, custo: [150, 400] },
    { nome: 'um problema no bico', gravidade: 1, tratavel: true, custo: [150, 400] },
    { nome: 'um tumor', gravidade: 3, tratavel: false, custo: [800, 2500] }
  ],
  roedor: [
    { nome: 'um problema nos dentes', gravidade: 2, tratavel: true, custo: [200, 600] },
    { nome: 'uma infecção respiratória', gravidade: 2, tratavel: true, custo: [200, 600] },
    { nome: 'um tumor', gravidade: 3, tratavel: false, custo: [500, 1500] }
  ],
  coelho: [
    { nome: 'um problema nos dentes', gravidade: 2, tratavel: true, custo: [300, 900] },
    { nome: 'um problema intestinal', gravidade: 2, tratavel: true, custo: [400, 1200] },
    { nome: 'um tumor', gravidade: 3, tratavel: false, custo: [900, 2500] }
  ],
  peixe: [
    { nome: 'pontos brancos na pele', gravidade: 1, tratavel: true, custo: [40, 120] },
    { nome: 'um fungo nas nadadeiras', gravidade: 1, tratavel: true, custo: [40, 120] },
    { nome: 'um problema na bexiga natatória', gravidade: 2, tratavel: false, custo: [60, 200] }
  ],
  reptil: [
    { nome: 'uma infecção respiratória', gravidade: 2, tratavel: true, custo: [400, 1200] },
    { nome: 'uma doença dos ossos, de falta de luz', gravidade: 2, tratavel: true, custo: [500, 1500] },
    { nome: 'um problema no casco ou na pele', gravidade: 1, tratavel: true, custo: [200, 600] }
  ]
};
const DOENCAS: Doenca[] = [
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
    if (vin.convivio.includes('casa')) vin.proximidade = clamp(vin.proximidade + animal(p.especie).vinculo, 0, 95);
    // Silvestre sem documento: a fiscalização pode chegar (e entregar por conta própria afasta a multa).
    if (info.origem === 'ilegal' && info.tutor === 'eu' && r.chance(0.2)) { apreender(v, p); continue; }
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
    const velho = Math.max(0, ip - (info.vidaMax - Math.max(2, Math.round(info.vidaMax * 0.4))));
    const chance = 0.05 + velho * 0.07 - (info.tVeterinario !== undefined && v.t - info.tVeterinario <= 12 ? 0.03 : 0);
    if (r.chance(Math.min(0.6, chance))) {
      const lista = (DOENCAS_GRUPO[animal(p.especie).grupo] ?? DOENCAS).filter(x => (velho >= 3 ? true : x.gravidade < 3));
      const x = r.weighted(lista, y => (y.gravidade === 3 ? velho * 0.5 : y.gravidade === 2 ? 1 : 1.5))!;
      info.doenca = { nome: x.nome, desde: v.t, gravidade: x.gravidade, tratando: false, tratavel: x.tratavel };
      if (info.tutor === 'eu' && vin.convivio.includes('casa')) {
        escrever(v, { texto: `${p.nome} ficou doente: ${x.nome}. ${x.gravidade === 3 ? 'O veterinário foi sério ao explicar.' : 'Precisa de veterinário.'}`, relevancia: x.gravidade === 3 ? 'biografia' : 'cotidiano', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
        abalar(v, `${p.nome} doente`, -2, 3);
      }
    }
  }
}

/** Risco de morte de um pet neste ano (usado por `corpo`), relativo ao tempo de vida da espécie. */
export function riscoDoPet(v: Vida, p: Pessoa): number {
  const info = infoPet(v, p);
  const ip = idadePessoa(v, p);
  const f = ip / Math.max(1, info.vidaMax);
  // Passado o tempo da espécie, cada ano a mais pesa mais (um cachorro de 20 anos é raríssimo; de 24, não existe).
  let risco = f >= 1 ? 0.75 + (ip - info.vidaMax) * 0.1 : f >= 0.85 ? 0.2 : f >= 0.7 ? 0.06 : 0.008;
  const d = info.doenca;
  if (d?.gravidade === 3) risco += d.tratando ? (d.tratavel ? 0.08 : 0.25) : 0.45;
  else if (d?.gravidade === 2 && !d.tratando) risco += 0.03;
  if (v.fatos[`paliativo_${p.id}`] !== undefined) risco = Math.max(risco, 0.85);
  return Math.min(0.95, risco);
}

/**
 * Do que um bicho morreu. "Velhice" só quando a idade é de velhice para a
 * espécie; antes disso, a morte tem causa (a doença que havia, um acidente,
 * algo que apareceu de repente).
 */
export function causaDaMortePet(v: Vida, p: Pessoa, r: Rng): string {
  const info = infoPet(v, p);
  const a = animal(p.especie);
  const ip = idadePessoa(v, p);
  const d = info.doenca;
  if (d && d.gravidade >= 2) return d.nome.replace(/^um |^uma /, '');
  const velhice = ip >= Math.max(a.vida[0] * 0.8, info.vidaMax - Math.max(1, Math.round(info.vidaMax * 0.15)));
  if (velhice) return 'velhice';
  return r.pick(a.morteCedo);
}

/** O bicho deixa a vida do jogador sem morrer (vai para um centro de triagem): o vínculo acaba; a Linha da Vida guarda. */
function sairDaVida(v: Vida, p: Pessoa): void {
  delete v.vinculos[p.id];
  if (p.pet) p.pet.tutor = 'familia';
}

/** A fiscalização ambiental levou o bicho sem origem legal (Decreto 6.514/2008, art. 24). */
function apreender(v: Vida, p: Pessoa): void {
  const multa = 5000;
  v.financas.conta -= multa;
  sairDaVida(v, p);
  v.fatos[`apreendido_${p.id}`] = v.t;
  escrever(v, { texto: `A fiscalização ambiental apareceu: ${p.nome}, ${umBicho(p.especie, p.genero)} sem origem legal, foi levado para um centro de triagem de animais silvestres. Multa de ${fmt(multa)}.`.replace('levado', bichoFeminino(p.especie, p.genero) ? 'levada' : 'levado'), relevancia: 'biografia', tema: 'casa', tom: 'ruim', pessoas: [p.id] });
  abalar(v, `a apreensão de ${p.nome}`, -5, 5);
}

/** Entregar por conta própria um silvestre sem documento: sem multa (Decreto 6.514/2008, art. 24, §5º). */
export function entregarPet(v: Vida, p: Pessoa): string {
  sairDaVida(v, p);
  v.fatos[`entregue_${p.id}`] = v.t;
  escrever(v, { texto: `Entregou ${p.nome} ao órgão ambiental: sem documento, ${palavraDoBicho(p.especie, p.genero)} não podia ficar. Quem entrega por conta própria não é multado.`, relevancia: 'biografia', tema: 'casa', escolha: true, pessoas: [p.id] });
  return `${p.nome} foi para um centro de triagem, onde vai ser cuidado e, se der, devolvido à natureza.`;
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
  if (ip >= info.vidaMax * 0.8) return animal(p.especie).grupo === 'peixe' ? 'mais lento, perto do fundo' : 'velhinho, mais lento, dorme mais';
  if (ip <= 1 && ['cao', 'gato', 'coelho'].includes(animal(p.especie).grupo)) return 'filhote, cheio de energia';
  return 'saudável';
}
