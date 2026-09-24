/**
 * Onde se mora. Continuar com os pais, sair para estudar, alugar, dividir,
 * morar junto, voltar para a família, comprar depois.
 *
 * Alugar é uma escolha legítima, não uma derrota: pede menos dinheiro de uma
 * vez, deixa mudar com facilidade — e custa todo mês. As ofertas vêm do
 * mercado da cidade (`sistemas/mercado`).
 */

import type { Pessoa, Vida } from '../tipos';
import { escrever, idade, lembrarCom, moraCom, vinculosVivos } from '../nucleo';
import { anoDe } from '../tempo';
import { economiaLocal } from '../dados/lugares';
import { modeloMoradia, type ModeloMoradia } from '../dados/bens';
import { bloqueio, type Veredito } from '../plausibilidade';
import { moraComFamiliaDeOrigem } from './domicilio';
import { disponivel, rendaPropriaMensal } from './dinheiro';
import { aluguelDe, ofertaPorModelo, ofertasDeImoveis, type OfertaImovel } from './mercado';
import { seusPets } from './pets';
import { dinheiro as fmt } from '../texto';

export { aluguelDe };

/** Renda que conta para pagar o aluguel: a sua, e a da parceria se vão morar juntos. */
function rendaParaAluguel(v: Vida, comParceria?: Pessoa): number {
  return rendaPropriaMensal(v) + (comParceria?.renda ?? 0);
}

/** Custo de entrar num aluguel: caução (dois aluguéis) e a mudança. */
export function custoDeEntrada(v: Vida, aluguel: number): number {
  return Math.round((aluguel * 2 + 900 * economiaLocal(v.moradia.municipioId).custo) / 10) * 10;
}

export interface OpcaoAluguel { o: OfertaImovel; m: ModeloMoradia; aluguel: number; veredito: Veredito }

/** Veredito de alugar uma oferta (idade, renda, animais, entrada). */
export function vereditoAluguel(v: Vida, o: OfertaImovel, dividir = 0, comParceria?: Pessoa): Veredito {
  if (idade(v) < 18) return bloqueio('ilegal', 'Contrato de aluguel exige maioridade.');
  if (v.moradia.modeloId === o.modeloId && v.moradia.bairro === o.bairro && !moraComFamiliaDeOrigem(v)) return bloqueio('incompativel', 'Você já mora aqui.');
  const pets = seusPets(v);
  if (pets.length && !o.aceitaPet) return bloqueio('incompativel', `Não aceita animais — e ${pets[0].nome} vai junto.`);
  const parte = o.modeloId === 'republica' ? o.aluguel : o.aluguel / (1 + dividir);
  const renda = rendaParaAluguel(v, comParceria);
  const entrada = custoDeEntrada(v, parte);
  if (disponivel(v) < entrada) return bloqueio('requisito', `Para entrar: caução e mudança, uns ${fmt(entrada)}.`);
  if (renda === 0 && disponivel(v) < parte * 6 + entrada) return bloqueio('requisito', 'Sem renda, só com seis meses de aluguel guardados.');
  if (renda > 0 && parte > renda * 0.5) return { grau: 'improvavel', motivo: 'O aluguel passaria de metade da renda. A imobiliária vai pedir fiador.', chance: 0.4 };
  return { grau: 'permitido' };
}

/** Opções de aluguel na cidade atual, com o peso no orçamento. */
export function opcoesDeAluguel(v: Vida): OpcaoAluguel[] {
  return ofertasDeImoveis(v, 'aluguel').map(o => ({ o, m: modeloMoradia(o.modeloId), aluguel: o.aluguel, veredito: vereditoAluguel(v, o) }));
}

/** Sair da casa da família fica na história de quem ficou lá. */
export function marcarSaidaDeCasa(v: Vida): void {
  const i = idade(v);
  for (const { vin } of vinculosVivos(v)) {
    if (!vin.convivio.includes('casa')) continue;
    if (vin.parentesco === 'mae' || vin.parentesco === 'pai' || vin.parentesco === 'avo') lembrarCom(v, vin.pessoaId, `Você saiu de casa, aos ${i}.`, 'casa', 2);
    else if (vin.parentesco === 'irmao' || vin.parentesco === 'meio_irmao') lembrarCom(v, vin.pessoaId, `Dividiram a casa da infância até ${anoDe(v.t)}.`, 'casa', 2);
  }
  v.fatos['saiu_de_casa'] = v.t;
}

/** Deixa a casa da família: os parentes ficam, os bichos da família também. Os seus vão junto. */
function deixarCasaDaFamilia(v: Vida): void {
  marcarSaidaDeCasa(v);
  for (const { p, vin } of vinculosVivos(v)) {
    if (vin.parentesco && ['mae', 'pai', 'irmao', 'meio_irmao', 'avo', 'madrasta', 'padrasto', 'tio', 'primo'].includes(vin.parentesco)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
    if (vin.parentesco === 'pet' && (p.pet?.tutor ?? 'familia') !== 'eu') vin.convivio = vin.convivio.filter(c => c !== 'casa');
  }
}

const artigo = (m: ModeloMoradia) => (m.nome.startsWith('casa') || m.nome.startsWith('kitnet') ? 'uma' : 'um');

/**
 * Passa a morar num lugar alugado (saindo da casa dos pais ou trocando de
 * casa). Aceita a oferta ou, para comandos antigos, o tipo de moradia.
 */
export function alugar(v: Vida, alvo: OfertaImovel | string, motivo?: string, silencioso = false, dividirCom?: Pessoa): void {
  const o = typeof alvo === 'string' ? ofertaPorModelo(v, 'aluguel', alvo) : alvo;
  const m = modeloMoradia(o?.modeloId ?? (alvo as string));
  const saiuDosPais = moraComFamiliaDeOrigem(v);
  const aluguel = o?.aluguel ?? aluguelDe(v, m, v.moradia.municipioId);
  const parte = m.id === 'republica' ? aluguel : dividirCom ? aluguel / 2 : aluguel;
  const entrada = custoDeEntrada(v, parte);
  if (!silencioso) v.financas.conta -= entrada;
  if (saiuDosPais) deixarCasaDaFamilia(v);
  v.moradia = {
    tipo: m.id === 'republica' ? 'republica' : 'aluguel',
    municipioId: v.moradia.municipioId,
    modeloId: m.id,
    aluguel,
    padrao: m.padrao,
    tInicio: v.t,
    bairro: o?.bairro,
    aceitaPet: o?.aceitaPet ?? true,
    divide: dividirCom ? 1 : undefined
  };
  if (dividirCom) {
    v.fatos[`divide_com_${dividirCom.id}`] = v.t;
    lembrarCom(v, dividirCom.id, `Dividiram ${artigo(m)} ${m.nome} ${o?.bairro ?? ''}.`.replace(' .', '.'), 'casa', 2);
  }
  const onde = m.id === 'republica' ? 'numa república' : `n${artigo(m) === 'uma' ? 'uma' : 'um'} ${m.nome} alugad${artigo(m) === 'uma' ? 'a' : 'o'}${o?.bairro ? ` ${o.bairro}` : ''}`;
  if (saiuDosPais) {
    if (silencioso) return;
    escrever(v, { texto: `Saiu da casa da família e foi morar ${onde}${dividirCom ? `, dividindo com ${dividirCom.nome}` : ''}${motivo ? `, ${motivo}` : ''}.`, relevancia: 'marco', tema: 'casa', escolha: true, pessoas: dividirCom ? [dividirCom.id] : undefined });
  } else if (!silencioso) {
    escrever(v, { texto: `Mudou-se para ${artigo(m)} ${m.nome}${o?.bairro ? ` ${o.bairro}` : ''}.`, relevancia: 'biografia', tema: 'casa', escolha: true });
  }
}

/** Volta para a casa dos pais (se ainda há casa dos pais para onde voltar). */
export function voltarParaCasaDosPais(v: Vida): boolean {
  const pais = vinculosVivos(v).filter(x => x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai');
  const casa = pais.find(x => x.p.municipioId === v.moradia.municipioId);
  if (!casa) return false;
  for (const x of pais) if (x.p.municipioId === v.moradia.municipioId && (!x.p.parceiroId || pais.some(o => o.p.id === x.p.parceiroId))) x.vin.convivio.push('casa');
  for (const { p, vin } of vinculosVivos(v)) if (p.especie && p.municipioId === v.moradia.municipioId && p.pet?.tutor !== 'eu' && vin.proximidade > 0 && !vin.convivio.includes('casa') && p.pet?.origem === 'familia') vin.convivio.push('casa');
  v.moradia = { tipo: 'pais', municipioId: v.moradia.municipioId, aluguel: 0, padrao: Math.max(1, v.moradia.padrao - 1), tInicio: v.t, aceitaPet: true };
  const vezes = (v.fatos['voltas_para_os_pais'] ?? 0) + 1;
  v.fatos['voltas_para_os_pais'] = vezes;
  const quem = casa.vin.parentesco === 'mae' ? 'a mãe' : 'o pai';
  escrever(v, { texto: vezes === 1 ? `Voltou a morar com ${quem}.` : vezes === 2 ? `Mais uma vez, voltou para a casa d${quem === 'a mãe' ? 'a' : 'o'} ${quem.slice(2)}.` : `De volta à casa d${quem === 'a mãe' ? 'a' : 'o'} ${quem.slice(2)}, outra vez.`, relevancia: vezes === 1 ? 'marco' : 'biografia', tema: 'casa' });
  v.fatos['voltou_para_os_pais'] = v.t;
  return true;
}

/** O parceiro passa a morar junto (na casa do jogador, ou os dois alugam juntos). */
export function morarJuntos(v: Vida, p: Pessoa): void {
  if (moraComFamiliaDeOrigem(v) || v.moradia.tipo === 'republica' || v.moradia.tipo === 'cedida') {
    const renda = rendaParaAluguel(v, p);
    const pets = seusPets(v).length > 0;
    const opcoes = ofertasDeImoveis(v, 'aluguel').filter(o => o.modeloId !== 'republica' && o.modeloId !== 'kitnet' && (!pets || o.aceitaPet) && o.aluguel <= Math.max(900, renda * 0.3));
    const o = opcoes.sort((a, b) => b.quartos - a.quartos || a.aluguel - b.aluguel)[0] ?? ofertaPorModelo(v, 'aluguel', 'kitnet');
    if (o) alugar(v, o, `com ${p.nome}`, true);
    v.moradia.divide = undefined;
  }
  p.municipioId = v.moradia.municipioId;
  const vin = v.vinculos[p.id];
  if (!vin.convivio.includes('casa')) vin.convivio.push('casa');
}

/** Um amigo com quem dá para dividir apartamento (mesma cidade, adulto jovem, próximo). */
export function amigoParaDividir(v: Vida): Pessoa | undefined {
  const i = idade(v);
  return vinculosVivos(v)
    .filter(x => !x.vin.parentesco && !x.vin.romance && (x.vin.estagio === 'amigo_proximo' || x.vin.estagio === 'amigo') && x.p.municipioId === v.moradia.municipioId && !x.p.parceiroId)
    .filter(x => { const ip = Math.floor((v.t - x.p.tNasc) / 12); return ip >= 18 && ip <= 40 && Math.abs(ip - i) <= 8; })
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0]?.p;
}

export const moradores = moraCom;
