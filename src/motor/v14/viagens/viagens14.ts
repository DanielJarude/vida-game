/**
 * VIDA 14 · VIAGENS — além do turismo de sempre (`sistemas/experiencias`: a viagem pelo país e a de férias para fora
 * continuam lá): a viagem de NEGÓCIOS (feira, cliente, sede — pede trabalho ou empresa e rende contatos e prestígio),
 * a CULTURAL (aprender: pratica a língua, a dança, o desenho), o EVENTO internacional (a Oktoberfest, o Carnaval de
 * Veneza, a Copa do Mundo no ano dela), os LUGARES conhecidos e o LUXO. Cada destino tem passagem, diária e durações;
 * o preço muda com o câmbio de quem mora fora e com quem vai junto. Nada é obrigatório: a vida segue sem viajar.
 *
 * Fica a memória (a biografia com o fato `m_viagem`, que as viagens antigas já usavam), os países conhecidos
 * (`Vida.viagens14.paises`, lidos pelos objetivos) e o que a viagem fez — descanso, prática, contato, prestígio.
 */
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { Pessoa, Vida } from '../../tipos';
import { escrever, idade, lembrarCom } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt, listaNatural } from '../../texto';
import { bloqueio, type Veredito } from '../../plausibilidade';
import { paisDaVida } from '../../mundo/vida';
import { precosDoPais } from '../../mundo/moeda';
import { pagar, vereditoDePagar } from '../../sistemas/dinheiro';
import { praticar } from '../../sistemas/frentes';
import { apresentarAlguem } from '../../sistemas/social';
import { companhiasDeViagem } from '../../sistemas/experiencias';
import { empresasAtivas } from '../../sistemas/empresas';
import { ocupacao } from '../../dados/ocupacoes';
import { municipio } from '../../dados/lugares';
import {
  CANDIDATAS_COPA, DESTINOS_14, DESTINOS_ANTIGOS_PAIS, NOMES_PAISES_14, SEDES_DA_COPA, type Destino14, type TipoViagem14
} from '../../dados14/viagens/destinos14';

export const NOME_TIPO_VIAGEM14: Record<TipoViagem14, string> = {
  negocios: 'Viagens de negócios', cultural: 'Experiências culturais', evento: 'Eventos internacionais', marco: 'Lugares conhecidos', luxo: 'Viagens de luxo'
};
/** O intervalo mínimo entre viagens do mesmo tipo (meses): a de negócios pode repetir no ano; o resto, uma por ano. */
const INTERVALO: Record<TipoViagem14, number> = { negocios: 4, cultural: 10, evento: 10, marco: 10, luxo: 10 };

/** A Copa do Mundo do ano (as sedes reais até 2034; depois, uma candidata plausível pelo ano). */
export function copaDoAno(ano: number): Destino14 | undefined {
  if (ano % 2 !== 0 || ano % 4 === 0) return undefined;
  const sede = SEDES_DA_COPA[ano] ?? rngDe('copa14', ano).pick(CANDIDATAS_COPA as { paises: string[]; onde: string; passagem: number }[]);
  return { id: `evt_copa_${ano}`, tipo: 'evento', nome: `a Copa do Mundo (${sede.onde})`, paises: sede.paises, onde: sede.onde, passagem: sede.passagem, diaria: 1400, dias: [7, 14], descricao: 'Ingresso para três jogos, a torcida de todo o mundo na rua, a camisa da seleção na mala.', epoca: 'junho e julho' };
}

/** Os destinos desta vida agora (a Copa só no ano dela; o próprio país fica de fora). */
export function destinos14(v: Vida): Destino14[] {
  const aqui = paisDaVida(v);
  const copa = copaDoAno(anoDe(v.t));
  return [...DESTINOS_14, ...(copa ? [copa] : [])].filter(d => !(d.paises.length === 1 && d.paises[0] === aqui && d.tipo !== 'negocios'));
}
const destino14 = (v: Vida, id: string) => destinos14(v).find(d => d.id === id);

const gente = (n: number) => 1 + n * 0.8;
function quem(v: Vida, id?: string): Pessoa[] {
  return companhiasDeViagem(v).find(c => c.id === (id ?? 'so'))?.pessoas ?? [];
}

/** O preço da viagem (passagem ida e volta + diárias), pelo câmbio de quem mora fora e por quem vai. */
export function custoDaViagem14(v: Vida, d: Destino14, dias: number, comId?: string): number {
  const aqui = paisDaVida(v);
  const f = 1 / precosDoPais(aqui);
  const longe = municipio(v.moradia.municipioId).perfil === 'pequena' ? 600 : 0;
  const passagem = d.paises.includes(aqui) ? d.passagem * 0.3 : d.passagem;
  const pessoa = (passagem + longe) * f + d.diaria * f * dias;
  return Math.round(pessoa * gente(quem(v, comId).length) / 100) * 100;
}

/** Negócios: o motivo de ir (o emprego ou a empresa, e a área da feira). */
function motivoDeNegocios(v: Vida, d: Destino14): string | undefined {
  const e = v.trabalho.atual;
  const emp = empresasAtivas(v).find(x => x.papel === 'dono' || x.papel === 'socio');
  if (!e && !emp) return undefined;
  if (d.areas && !emp && e) {
    const oc = ocupacao(e.ocupacaoId);
    const areas = [oc.trilha, ...(oc.area ?? [])].map(String);
    if (!d.areas.some(a => areas.some(x => x.includes(a)))) return undefined;
  }
  return emp ? emp.nome : 'o trabalho';
}

export interface OquaViagem14 { destino: string; dias: number; com?: string }

export function disponibilidadeViagem14(v: Vida, a: OquaViagem14): Veredito {
  if (idade(v) < 18) return bloqueio('requisito', 'A partir dos 18.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  const d = destino14(v, a.destino);
  if (!d) return bloqueio('impossivel', 'Esse destino não existe agora.');
  if (!d.dias.includes(a.dias)) return bloqueio('impossivel', 'Essa duração não existe para esse destino.');
  if (v.justica?.foragido && !d.paises.includes(paisDaVida(v))) return bloqueio('impossivel', 'Quem é procurado não passa por uma fronteira.');
  if (d.tipo === 'negocios') {
    if (!motivoDeNegocios(v, d)) return bloqueio('requisito', d.areas ? 'Essa feira é de outra área: o seu trabalho (ou a sua empresa) não tem o que fazer lá.' : 'Viagem de negócios pede um trabalho ou uma empresa.');
    if (a.com && a.com !== 'so') return bloqueio('impossivel', 'A viagem de negócios é a trabalho: vai só você.');
  }
  if (a.com && !companhiasDeViagem(v).some(c => c.id === a.com)) return bloqueio('impossivel', 'Essa companhia não pode ir agora.');
  const ultima = v.viagens14?.ultima?.[d.tipo];
  if (ultima !== undefined && v.t - ultima < INTERVALO[d.tipo]) return bloqueio('incompativel', d.tipo === 'negocios' ? 'A última viagem a trabalho foi há pouco.' : 'Uma viagem dessas por ano: a próxima fica para o ano que vem.');
  return vereditoDePagar(v, custoDaViagem14(v, d, a.dias, a.com), 'Custa uns');
}

/** Os países conhecidos (os registrados, o natal, as nacionalidades e onde mora). */
export function paisesVisitados(v: Vida): string[] {
  const s = new Set<string>(Object.keys(v.viagens14?.paises ?? {}));
  s.add(paisDaVida(v));
  for (const n of v.eu.nacionalidades ?? []) s.add(n);
  return [...s];
}
export const nomeDoPais14 = (iso: string) => NOMES_PAISES_14[iso] ?? iso;

function registrar(v: Vida, d: Destino14): string[] {
  const x = (v.viagens14 ??= { paises: {} });
  const novos = d.paises.filter(p => x.paises[p] === undefined && p !== paisDaVida(v));
  for (const p of d.paises) x.paises[p] ??= v.t;
  (x.ultima ??= {})[d.tipo] = v.t;
  x.n = (x.n ?? 0) + 1;
  return novos;
}

/** O que pode acontecer pelo caminho (às vezes): bom, ruim ou só uma história. */
function acaso(v: Vida, r: Rng, d: Destino14, com: Pessoa[]): string | undefined {
  if (!r.chance(0.3)) return undefined;
  const x = r.next();
  if (x < 0.3) {
    const p = apresentarAlguem(v, r, { idade: [Math.max(20, idade(v) - 12), idade(v) + 12], origem: 'apresentado' });
    lembrarCom(v, p.id, `Vocês se conheceram em ${d.nome}.`, 'inicio', 2);
    return `Em ${d.nome}, conheceu ${p.nome} — trocaram contato e continuam se falando.`;
  }
  if (x < 0.5) { pagar(v, Math.min(Math.round(d.diaria * 1.5 / 100) * 100, Math.max(0, v.financas.conta))); return 'A mala ficou numa conexão e chegou três dias depois: roupa nova comprada às pressas, preço de aeroporto.'; }
  if (x < 0.65) { v.corpo.saude = clamp(v.corpo.saude - 3); return 'Uma comida de rua cobrou o preço: dois dias de cama no hotel.'; }
  return com.length ? `O dia que deu errado (a chuva, o passeio cancelado) virou a melhor história da viagem — ${listaNatural(com.map(p => p.nome))} conta até hoje.` : 'Um dia inteiro perdido sem plano, andando sem rumo — foi o melhor da viagem.';
}

export function executarViagem14(v: Vida, r: Rng, a: OquaViagem14): { texto: string; tom: 'bom' | 'neutro' } {
  const d = destino14(v, a.destino)!;
  const com = quem(v, a.com);
  const custo = custoDaViagem14(v, d, a.dias, a.com);
  pagar(v, custo);
  const novos = registrar(v, d);
  const fator = Math.min(1.5, 0.5 + a.dias / 10);
  const efeitos: string[] = [];
  // O descanso (a de negócios descansa pouco: é trabalho em outro fuso).
  const desc = d.tipo === 'negocios' ? 0.3 : d.tipo === 'luxo' ? 1.4 : 1;
  v.mente.felicidade = clamp(v.mente.felicidade + 6 * fator * desc);
  v.mente.estresse = clamp(v.mente.estresse - 8 * fator * desc + (d.tipo === 'negocios' ? 2 : 0));
  for (const p of com) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + Math.round(5 * fator)); lembrarCom(v, p.id, `A viagem para ${d.nome}.`, 'ritual', 2); } }
  if (d.dominio) { praticar(v, r, d.dominio, 0.5 * a.dias / 7, 1.3); efeitos.push(d.tipo === 'cultural' ? 'voltou sabendo mais do que foi aprender' : 'voltou com vontade de praticar'); }
  if (d.tipo === 'negocios') {
    const motivo = motivoDeNegocios(v, d)!;
    const emp = empresasAtivas(v).find(x => x.nome === motivo);
    if (emp) { emp.reputacao = clamp(emp.reputacao + 2); efeitos.push(`${emp.nome} voltou com contatos e um nome mais conhecido no ramo`); }
    else if (v.trabalho.atual) { v.fatos['v14_rede_negocios'] = (v.fatos['v14_rede_negocios'] ?? 0) + 1; efeitos.push('o cartão de visitas voltou cheio'); }
    if (r.chance(0.35)) { const p = apresentarAlguem(v, r, { idade: [30, 60], origem: 'trabalho' as never }); lembrarCom(v, p.id, `Vocês se conheceram numa viagem a trabalho, em ${d.nome}.`, 'trabalho', 1); efeitos.push(`${p.nome}, de lá, ficou como contato`); }
    // O prestígio do meio (a frente de reconhecimento lê este fato no ano): quem viaja a trabalho circula.
    v.fatos['v14_viagem_negocios'] = v.t;
  }
  if (novos.length) efeitos.push(novos.length === 1 ? `o primeiro carimbo de ${nomeDoPais14(novos[0])} no passaporte` : `${novos.length} países novos no passaporte`);
  const companhia = com.length ? `, com ${listaNatural(com.map(p => p.nome))}` : '';
  const texto = `${d.tipo === 'negocios' ? 'Viajou a trabalho para' : 'Viajou para'} ${d.nome} (${a.dias} dias)${companhia}.`;
  escrever(v, { texto, relevancia: d.tipo === 'luxo' || novos.length ? 'biografia' : 'cotidiano', tema: d.tipo === 'negocios' ? 'trabalho' : 'lazer', tom: 'bom', escolha: true, pessoas: com.map(p => p.id), fato: { tipo: 'm_viagem', dados: { destino: d.nome, tipo14: d.tipo } } });
  const historia = acaso(v, r, d, com);
  return { texto: `${fmt(custo)} entre passagem, hospedagem e o resto. ${d.descricao}${efeitos.length ? ` ${efeitos.join('; ').replace(/^./, c => c.toUpperCase())}.` : ''}${historia ? ` ${historia}` : ''}`, tom: 'bom' };
}

/** Para a tela: os destinos por tipo, com a duração, o preço e o que falta. */
export function catalogoViagens14(v: Vida) {
  const tipos = Object.keys(NOME_TIPO_VIAGEM14) as TipoViagem14[];
  return tipos.map(t => ({
    tipo: t, nome: NOME_TIPO_VIAGEM14[t],
    destinos: destinos14(v).filter(d => d.tipo === t).map(d => ({ id: d.id, nome: d.nome.charAt(0).toUpperCase() + d.nome.slice(1), onde: d.onde, descricao: d.descricao, epoca: d.epoca, dias: d.dias, aPartirDe: custoDaViagem14(v, d, d.dias[0]), conhecido: d.paises.every(p => v.viagens14?.paises[p] !== undefined) }))
  })).filter(g => g.destinos.length);
}

/** Saves: as viagens antigas (o fato `m_viagem` com o destino) entram nos países conhecidos. */
export function normalizarVida14Viagens(v: Vida): void {
  if (v.viagens14) return;
  const paises: Record<string, number> = {};
  for (const e of v.biografia ?? []) {
    const dest = e.fato?.tipo === 'm_viagem' ? String(e.fato.dados.destino ?? '') : '';
    const iso = DESTINOS_ANTIGOS_PAIS[dest];
    if (iso && iso !== paisDaVida(v) && paises[iso] === undefined) paises[iso] = e.t ?? v.t;
  }
  if (Object.keys(paises).length) v.viagens14 = { paises };
}
