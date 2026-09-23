/**
 * Romance.
 *
 * interesse → saindo → namoro → morando junto → casamento (ou ex).
 *
 * A outra pessoa tem vontade própria: `envolvimento` é o quanto ELA está na
 * relação. Ele sobe com compatibilidade e tempo juntos, desce com tensão,
 * distância, dinheiro apertado e descaso. Quem termina pode ser ela.
 *
 * Limites: ninguém com menos de 14 anos namora; menores só com gente da
 * mesma faixa; adulto nunca com menor. A orientação de cada NPC é respeitada.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { EstagioRomance, Genero, Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, parceiro, vinculosVivos } from '../nucleo';
import { compatibilidade } from './social';
import { flex } from '../texto';

const ESTAGIOS_ATIVOS: EstagioRomance[] = ['saindo', 'namoro', 'morando_junto', 'casamento'];

export function atraiGenero(atracao: Pessoa['atracao'] | undefined, g: Genero): boolean {
  if (!atracao) return false;
  if (atracao === 'ambos') return true;
  if (g === 'nao_binario') return false;
  return (atracao === 'homens') === (g === 'masculino');
}

/** Os dois podem, legal e mutuamente, ter algo? */
export function podeTerRomance(v: Vida, p: Pessoa, vin: Vinculo): boolean {
  if (p.especie || vin.parentesco || !p.vivo) return false;
  const i = idade(v);
  const ip = idadePessoa(v, p);
  if (i < 14 || ip < 14) return false;
  if (i < 18 || ip < 18) {
    if (i >= 18 || ip >= 18) return false;
    if (Math.abs(i - ip) > 3) return false;
  }
  if (!atraiGenero(p.atracao, v.eu.genero)) return false;
  if (v.eu.atracao && !atraiGenero(v.eu.atracao, p.genero)) return false;
  if (p.parceiroId) return false;
  return true;
}

/** O quanto a pessoa se interessa pelo jogador, de saída. */
export function interesseInicial(v: Vida, p: Pessoa): number {
  const c = compatibilidade(v, p);
  const aparencia = (v.corpo.aparencia - 50) / 2;
  const difIdade = Math.abs(idade(v) - idadePessoa(v, p));
  return clamp(Math.round(40 + c * 30 + aparencia * 0.5 - Math.max(0, difIdade - 6) * 2));
}

export const romanceAtivo = (vin: Vinculo) => !!vin.romance && ESTAGIOS_ATIVOS.includes(vin.romance.estagio);

export function mudarEstagio(v: Vida, vin: Vinculo, estagio: EstagioRomance): void {
  if (!vin.romance) vin.romance = { estagio, tEstagio: v.t, envolvimento: 50 };
  vin.romance.estagio = estagio;
  vin.romance.tEstagio = v.t;
  if (estagio === 'namoro' && !vin.romance.planoFilhos) vin.romance.planoFilhos = 'evitando';
  if (estagio === 'ex') {
    vin.estagio = vin.proximidade >= 45 ? 'amigo' : 'afastado';
    vin.convivio = vin.convivio.filter(c => c !== 'casa');
    vin.romance.planoFilhos = undefined;
  }
}

/* ------------------------------------------------------------- Interesse */

/**
 * De vez em quando alguém do convívio chama atenção. Isso só cria o
 * INTERESSE — o que fazer com ele é decisão do jogador (conteúdo
 * `rom_alguem_especial`). Quem já está num relacionamento raramente sente.
 */
export function surgirInteresse(v: Vida, r: Rng): void {
  const i = idade(v);
  if (i < 13) return;
  const temParceiro = !!parceiro(v);
  const chance = temParceiro ? 0.04 : i < 16 ? 0.35 : i < 30 ? 0.4 : i < 50 ? 0.22 : 0.1;
  if (!r.chance(chance)) return;
  const jaInteressado = vinculosVivos(v).some(x => x.vin.romance?.estagio === 'interesse' || x.vin.romance?.estagio === 'saindo');
  if (jaInteressado) return;
  // Quem desperta interesse é alguém do convívio (ou amigo). O jogador
  // ainda sem orientação definida pode se interessar por qualquer gênero —
  // quem define isso é o jogador, na decisão que vem a seguir.
  const candidatos = vinculosVivos(v).filter(({ p, vin }) =>
    !vin.parentesco && !vin.romance && (vin.convivio.length > 0 || vin.estagio === 'amigo' || vin.estagio === 'amigo_proximo') &&
    podeTerRomanceSemOrientacaoDoJogador(v, p, vin));
  const escolhido = r.weighted(candidatos, ({ p }) => 1 + Math.max(0, compatibilidade(v, p) + 0.5) * 2);
  if (!escolhido) return;
  escolhido.vin.romance = { estagio: 'interesse', tEstagio: v.t, envolvimento: interesseInicial(v, escolhido.p) };
}

function podeTerRomanceSemOrientacaoDoJogador(v: Vida, p: Pessoa, vin: Vinculo): boolean {
  if (v.eu.atracao) return podeTerRomance(v, p, vin);
  const atracaoOriginal = v.eu.atracao;
  v.eu.atracao = 'ambos';
  const ok = podeTerRomance(v, p, vin);
  v.eu.atracao = atracaoOriginal;
  return ok;
}

/* ---------------------------------------------------------- Evolução */

export function processarRomance(v: Vida, r: Rng): void {
  for (const { p, vin } of vinculosVivos(v)) {
    const rom = vin.romance;
    if (!rom) continue;
    const meses = v.t - rom.tEstagio;

    if (rom.estagio === 'interesse') {
      // Interesse sem atitude se dissolve.
      if (meses >= 24) vin.romance = undefined;
      continue;
    }
    if (rom.estagio === 'ex') continue;

    const c = compatibilidade(v, p);
    const juntos = vin.convivio.includes('casa');
    const longe = p.municipioId !== v.moradia.municipioId;
    const cuidou = v.anoAtual.acoes.some(a => a.endsWith(`:${p.id}`));
    let delta = c * 8 + (cuidou ? 7 : -3) + (juntos ? 1 : 0) - (longe ? 9 : 0);
    delta -= vin.tensao / 8;
    if (v.financas.negativado) delta -= 4;
    if (v.mente.estresse > 70) delta -= 3;
    if (v.personalidade.tracos.empatia > 20) delta += 2;
    if (v.personalidade.tracos.impulsividade > 30) delta -= 2;
    rom.envolvimento = clamp(Math.round(rom.envolvimento + delta + r.normal() * 5));
    vin.proximidade = clamp(Math.round(vin.proximidade * 0.6 + rom.envolvimento * 0.4));
    vin.tensao = Math.round(vin.tensao * 0.7);
    vin.tUltimoContato = v.t;

    if (rom.estagio === 'saindo') {
      if (rom.envolvimento < 32 || (meses >= 24 && rom.envolvimento < 55)) {
        mudarEstagio(v, vin, 'ex');
        vin.estagio = 'conhecido';
        escrever(v, { texto: `As saídas com ${p.nome} foram rareando até pararem.`, relevancia: 'cotidiano', tema: 'amor', pessoas: [p.id] });
      }
      continue;
    }

    // Namoro em diante: a outra pessoa pode terminar.
    if (rom.envolvimento < 18 || vin.tensao >= 85) {
      terminar(v, p, vin, 'ela');
    }
  }
}

/** Fim de relacionamento. `quem`: 'jogador' ou 'ela' (a outra pessoa, qualquer gênero). */
export function terminar(v: Vida, p: Pessoa, vin: Vinculo, quem: 'jogador' | 'ela'): void {
  const rom = vin.romance;
  if (!rom) return;
  const anos = Math.max(1, Math.round((v.t - vin.tInicio) / 12));
  const era = rom.estagio;
  const moravam = era === 'morando_junto' || era === 'casamento';
  mudarEstagio(v, vin, 'ex');
  let texto: string;
  if (era === 'casamento') {
    texto = quem === 'jogador'
      ? `Pediu o divórcio. ${anos} anos de casamento com ${p.nome} terminaram num cartório.`
      : `${p.nome} pediu o divórcio depois de ${anos} anos juntos.`;
  } else if (moravam) {
    texto = quem === 'jogador' ? `Decidiu se separar de ${p.nome}. Cada um foi para um lado.` : `${p.nome} fez as malas e foi embora.`;
  } else {
    texto = quem === 'jogador' ? `Terminou o namoro com ${p.nome}.` : `${p.nome} terminou o namoro.`;
  }
  escrever(v, { texto, relevancia: era === 'namoro' && anos < 2 ? 'biografia' : 'marco', tema: 'amor', tom: 'ruim', pessoas: [p.id], escolha: quem === 'jogador' });
  lembrarCom(v, p.id, era === 'casamento' ? 'Divorciaram-se.' : 'Terminaram.');
  v.mente.felicidade = clamp(v.mente.felicidade - (era === 'casamento' ? 18 : 10));
  v.mente.estresse = clamp(v.mente.estresse + (moravam ? 14 : 6));

  if (moravam) dividirVida(v, p);
}

/** Separação de quem morava junto: bens, casa e filhos. */
function dividirVida(v: Vida, p: Pessoa): void {
  const f = v.financas;
  // Partilha simplificada: metade do que foi construído junto fica com a outra pessoa.
  const imovel = f.bens.find(b => b.tipo === 'imovel' && b.id === v.moradia.imovelId);
  if (imovel) {
    const divida = f.dividas.find(d => d.bemId === imovel.id)?.saldo ?? 0;
    const metade = Math.max(0, Math.round((imovel.valor - divida) / 2));
    f.conta -= metade;
    if (f.conta < 0) { f.reserva += f.conta; f.conta = 0; }
  }
  f.reserva = Math.round(f.reserva * 0.5);
  // Filhos em comum: ficam com quem gestou na maioria das vezes.
  for (const { p: filho, vin } of vinculosVivos(v)) {
    if (vin.parentesco !== 'filho' || idadePessoa(v, filho) >= 18) continue;
    const ficaComigo = v.corpo.podeGestar || !p.vivo;
    if (!ficaComigo) {
      vin.convivio = vin.convivio.filter(c => c !== 'casa');
      filho.municipioId = p.municipioId;
    }
  }
}

export function descreverEstagio(g: Genero, estagio: EstagioRomance): string {
  return ({
    interesse: 'alguém especial',
    saindo: 'saindo juntos',
    namoro: flex(g, 'namorado', 'namorada', 'namorade'),
    morando_junto: flex(g, 'companheiro', 'companheira', 'companheire'),
    casamento: flex(g, 'marido', 'esposa', 'cônjuge'),
    ex: flex(g, 'ex', 'ex')
  } as Record<EstagioRomance, string>)[estagio];
}
