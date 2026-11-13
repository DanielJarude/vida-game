/**
 * VIDA 19 · O HARAS QUE CRIA — reprodução e genética dos cavalos de corrida (pendência da VIDA 18).
 *
 * Os cavalos de corrida continuam individuais (`PropriedadeRural18.cavalos`) e o resto da tropa continua agregado no
 * rebanho `cavalos` (o custo de cada cabeça já está lá — o potro que nasce entra como uma cabeça a mais, o vendido sai).
 *
 *   COBRIR        a égua da casa (3 a 16 anos) com um garanhão da casa (3 anos ou mais) ou de fora (a monta paga, por
 *                 qualidade). Dá cria ou não (a idade da égua pesa); a gestação é de onze meses: o potro nasce no ano
 *                 seguinte. A égua prenhe não corre.
 *   GENÉTICA      o potro herda a média dos pais puxada para a média da raça (herdabilidade parcial) e um acaso próprio:
 *                 filhos de campeões tendem a correr bem, nunca com garantia.
 *   DESENVOLVER   potro até 2 anos não corre; a forma vem com a idade (`fazenda18.envelhecerCavalo`).
 *   VENDER        o valor sai do que o cavalo mostrou (velocidade, fundo, vitórias) e, no potro, da linhagem.
 *
 * Sorteios: `rngDe` da propriedade, da égua e do ano — o acaso do resto da vida não muda.
 */
import type { Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { escrever } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { lancar } from '../../sistemas/extrato';
import { vereditoDePagar } from '../../sistemas/dinheiro';
import { acharPropriedade, sincronizarValor, todasAsPropriedades, valorDoCavalo, type CavaloDeCorrida18, type PropriedadeRural18 } from '../../v18/rural/fazenda18';

/** Os garanhões de fora (a monta paga, em reais de 2026): o regional, o de ponta nacional, o importado. */
export const GARANHOES19 = [
  { id: 'regional', nome: 'Fogo de Palha', origem: 'garanhão de haras vizinho', velocidade: 60, fundo: 58, monta: 6000 },
  { id: 'nacional', nome: 'Rei do Cristal', origem: 'campeão do Grande Prêmio Brasil', velocidade: 74, fundo: 72, monta: 28000 },
  { id: 'importado', nome: 'Northern Wind', origem: 'garanhão importado, linhagem de clássicos', velocidade: 83, fundo: 80, monta: 95000 }
] as const;

const NOMES = ['Faísca', 'Pampa', 'Sereno', 'Tufão', 'Garoa', 'Lampejo', 'Rosa dos Ventos', 'Siroco', 'Boiadeira', 'Zéfiro', 'Minuano', 'Nordestino', 'Pororoca', 'Ventarola', 'Mandacaru', 'Jangada', 'Seresta', 'Cantiga', 'Arribação', 'Cerração'];
const MAX_CAVALOS = 14;

export type OqueHaras19 =
  | { op: 'cobrir'; propriedade: string; egua: string; garanhao: string }
  | { op: 'vender'; propriedade: string; cavalo: string }
  | { op: 'reproducao'; propriedade: string; cavalo: string };

export const idadeDoCavalo = (v: Vida, c: CavaloDeCorrida18) => anoDe(v.t) - c.nasc;

/** O potencial de um potro (o que a filiação permite esperar, antes de correr). */
export function potencial19(pai: { velocidade: number; fundo: number }, mae: { velocidade: number; fundo: number }): { velocidade: number; fundo: number } {
  return { velocidade: Math.round(0.35 * pai.velocidade + 0.35 * mae.velocidade + 0.3 * 50), fundo: Math.round(0.35 * pai.fundo + 0.35 * mae.fundo + 0.3 * 50) };
}

function garanhaoDe(p: PropriedadeRural18, id: string): { nome: string; velocidade: number; fundo: number; monta: number } | undefined {
  const fora = GARANHOES19.find(g => `fora:${g.id}` === id);
  if (fora) return fora;
  const c = (p.cavalos ?? []).find(x => x.id === id && x.sexo === 'macho');
  return c ? { nome: c.nome, velocidade: c.velocidade, fundo: c.fundo, monta: 0 } : undefined;
}

const custoVeterinario = 2500;

export function disponibilidadeHaras19(v: Vida, q: OqueHaras19): Veredito {
  const x = acharPropriedade(v, q.propriedade);
  if (!x) return bloqueio('impossivel', 'Essa propriedade não é sua.');
  const p = x.p;
  if (!p.rebanhos.some(r => r.especie === 'cavalos')) return bloqueio('requisito', 'Sem cavalos na propriedade.');
  const ano = anoDe(v.t);
  if (q.op === 'cobrir') {
    if (p.tipo !== 'haras') return bloqueio('requisito', 'Cobertura de cavalo de corrida é coisa de haras (cocheira, piquete, veterinário).');
    const egua = (p.cavalos ?? []).find(c => c.id === q.egua);
    if (!egua || egua.sexo !== 'femea') return bloqueio('impossivel', 'Escolha uma égua da casa.');
    const i = ano - egua.nasc;
    if (i < 3 || i > 16) return bloqueio('impossivel', `${egua.nome} tem ${i} ${i === 1 ? 'ano' : 'anos'}: a égua cobre dos 3 aos 16.`);
    if (egua.prenhe) return bloqueio('incompativel', `${egua.nome} já está prenhe: o potro nasce em ${egua.prenhe.ano}.`);
    if (v.fatos[`haras19_cob_${egua.id}_${ano}`] !== undefined) return bloqueio('incompativel', `${egua.nome} já foi coberta este ano.`);
    const g = garanhaoDe(p, q.garanhao);
    if (!g) return bloqueio('impossivel', 'Escolha o garanhão.');
    if (!q.garanhao.startsWith('fora:')) { const c = p.cavalos!.find(z => z.id === q.garanhao)!; if (ano - c.nasc < 3) return bloqueio('impossivel', `${c.nome} ainda é potro.`); }
    if ((p.cavalos?.length ?? 0) >= MAX_CAVALOS) return bloqueio('incompativel', 'As cocheiras estão cheias: venda algum cavalo antes de criar mais.');
    return vereditoDePagar(v, g.monta + custoVeterinario, 'Custa');
  }
  const c = (p.cavalos ?? []).find(z => z.id === q.cavalo);
  if (!c) return bloqueio('impossivel', 'Esse cavalo não é seu.');
  if (q.op === 'vender') return c.prenhe ? bloqueio('incompativel', 'Égua prenhe: espere o potro.') : PERMITIDO;
  return c.reproducao ? bloqueio('incompativel', 'Já está na reprodução.') : ano - c.nasc < 3 ? bloqueio('impossivel', 'Ainda é potro.') : PERMITIDO;
}

export function valorDoCavalo19(v: Vida, c: CavaloDeCorrida18): number {
  const i = idadeDoCavalo(v, c);
  // O potro vale pela linhagem; o cavalo de pista, pelo que mostrou (a régua da VIDA 18); o velho, pela reprodução.
  const base = valorDoCavalo(c);
  return Math.round((i < 2 ? base * 0.8 : i >= 9 ? base * 0.45 : base) / 100) * 100;
}

export function executarHaras19(v: Vida, q: OqueHaras19): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  const x = acharPropriedade(v, q.propriedade)!;
  const p = x.p;
  const ano = anoDe(v.t);
  if (q.op === 'cobrir') {
    const egua = p.cavalos!.find(c => c.id === q.egua)!;
    const g = garanhaoDe(p, q.garanhao)!;
    const custo = g.monta + custoVeterinario;
    v.financas.conta -= custo;
    lancar(v, `Cobertura de ${egua.nome} (${g.nome})`, 'despesa', -custo);
    v.fatos[`haras19_cob_${egua.id}_${ano}`] = v.t;
    const i = ano - egua.nasc;
    const chance = i <= 12 ? 0.72 : 0.5;
    if (!rngDe(v.id, 'cobertura19', egua.id, ano).chance(chance)) return { texto: `${egua.nome} foi coberta por ${g.nome}, mas não emprenhou. Dá para tentar de novo no ano que vem.`, tom: 'ruim' };
    egua.prenhe = { ano: ano + 1, garanhao: g.nome, velocidade: g.velocidade, fundo: g.fundo };
    const pot = potencial19(g, egua);
    return { texto: `${egua.nome} está prenhe de ${g.nome}. O potro nasce em ${ano + 1}; pela filiação, dá para esperar velocidade perto de ${pot.velocidade} e fundo perto de ${pot.fundo} — nada garantido.`, tom: 'bom' };
  }
  const c = p.cavalos!.find(z => z.id === q.cavalo)!;
  if (q.op === 'reproducao') {
    c.reproducao = true;
    c.aposentado = true;
    return { texto: `${c.nome} deixou as pistas: agora é ${c.sexo === 'femea' ? 'matriz' : 'reprodutor'} do haras.` };
  }
  const valor = valorDoCavalo19(v, c);
  p.cavalos = p.cavalos!.filter(z => z.id !== c.id);
  const rb = p.rebanhos.find(r => r.especie === 'cavalos');
  if (rb) rb.cabecas = Math.max(0, rb.cabecas - 1);
  v.financas.conta += valor;
  lancar(v, `Venda do cavalo ${c.nome}`, 'renda', valor);
  sincronizarValor(v, x.imovel);
  return { texto: `${c.nome} foi vendido por ${fmt(valor)}.`, tom: 'bom' };
}

/** O ano do haras: os potros nascem (a herança dos pais, com o acaso de cada um); alguns não vingam. */
export function processarHaras19(v: Vida): void {
  const ano = anoDe(v.t);
  for (const { p, imovel } of todasAsPropriedades(v)) {
    for (const egua of [...(p.cavalos ?? [])]) {
      const pr = egua.prenhe;
      if (!pr || pr.ano > ano) continue;
      egua.prenhe = undefined;
      const r = rngDe(v.id, 'potro19', egua.id, pr.ano);
      if (r.chance(0.08)) { escrever(v, { texto: `${egua.nome} perdeu o potro no fim da gestação.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' }); continue; }
      const pot = potencial19(pr, egua);
      const lista = (p.cavalos ??= []);
      const usados = new Set(lista.map(c => c.nome));
      const nome = NOMES.find(n => !usados.has(n) && r.chance(0.5)) ?? NOMES.find(n => !usados.has(n)) ?? `Potro de ${egua.nome}`;
      const filho: CavaloDeCorrida18 = {
        id: `cv19_${egua.id}_${pr.ano}`, nome, nasc: pr.ano, sexo: r.chance(0.5) ? 'macho' : 'femea',
        velocidade: clamp(Math.round(pot.velocidade + r.normal() * 7)), fundo: clamp(Math.round(pot.fundo + r.normal() * 7)),
        forma: 50, corridas: 0, vitorias: 0, premios: 0, pai: pr.garanhao, mae: egua.nome
      };
      lista.push(filho);
      const rb = p.rebanhos.find(x => x.especie === 'cavalos');
      if (rb) rb.cabecas += 1;
      sincronizarValor(v, imovel);
      escrever(v, { texto: `Nasceu ${nome}, ${filho.sexo === 'macho' ? 'filho' : 'filha'} de ${pr.garanhao} e ${egua.nome}, no haras.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
    }
  }
}
