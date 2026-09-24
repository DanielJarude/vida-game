/**
 * Onde se mora. Sair da casa dos pais, alugar, dividir, comprar, voltar.
 */

import type { Pessoa, Vida } from '../tipos';
import { escrever, idade, lembrarCom, moraCom, vinculosVivos } from '../nucleo';
import { anoDe } from '../tempo';
import { economiaLocal } from '../dados/lugares';
import { MORADIAS, modeloMoradia, type ModeloMoradia } from '../dados/bens';
import { bloqueio, type Veredito } from '../plausibilidade';
import { moraComFamiliaDeOrigem } from './domicilio';
import { saldoMensal } from './dinheiro';

export function aluguelDe(m: ModeloMoradia, municipioId: string): number {
  return Math.round(economiaLocal(municipioId).aluguel * m.fatorAluguel / 10) * 10;
}

/** Opções de aluguel na cidade atual, com o peso no orçamento. */
export function opcoesDeAluguel(v: Vida): { m: ModeloMoradia; aluguel: number; veredito: Veredito }[] {
  const renda = saldoMensal(v).renda;
  return MORADIAS.map(m => {
    const aluguel = aluguelDe(m, v.moradia.municipioId);
    let veredito: Veredito = { grau: 'permitido' };
    if (idade(v) < 18) veredito = bloqueio('ilegal', 'Contrato de aluguel exige maioridade.');
    else if (v.moradia.modeloId === m.id && !moraComFamiliaDeOrigem(v)) veredito = bloqueio('incompativel', 'Você já mora num lugar assim.');
    else if (renda > 0 && aluguel > renda * 0.5) veredito = { grau: 'improvavel', motivo: 'O aluguel passaria de metade da renda. A imobiliária vai pedir fiador.', chance: 0.4 };
    else if (renda === 0 && v.financas.conta < aluguel * 6) veredito = bloqueio('requisito', 'Sem renda, só com seis meses de aluguel guardados.');
    return { m, aluguel, veredito };
  });
}

/** Sair da casa da família fica na história de quem ficou lá. */
export function marcarSaidaDeCasa(v: Vida): void {
  const i = idade(v);
  for (const { vin } of vinculosVivos(v)) {
    if (!vin.convivio.includes('casa')) continue;
    if (vin.parentesco === 'mae' || vin.parentesco === 'pai' || vin.parentesco === 'avo') lembrarCom(v, vin.pessoaId, `Você saiu de casa, aos ${i}.`, 'casa', 2);
    else if (vin.parentesco === 'irmao' || vin.parentesco === 'meio_irmao') lembrarCom(v, vin.pessoaId, `Dividiram a casa da infância até ${anoDe(v.t)}.`, 'casa', 2);
  }
}

/** Passa a morar num lugar alugado (saindo da casa dos pais ou trocando de casa). */
export function alugar(v: Vida, modeloId: string, motivo?: string, silencioso = false): void {
  const m = modeloMoradia(modeloId);
  const saiuDosPais = moraComFamiliaDeOrigem(v);
  if (saiuDosPais) marcarSaidaDeCasa(v);
  v.moradia = {
    tipo: m.id === 'republica' ? 'republica' : 'aluguel',
    municipioId: v.moradia.municipioId,
    modeloId: m.id,
    aluguel: aluguelDe(m, v.moradia.municipioId),
    padrao: m.padrao,
    tInicio: v.t
  };
  if (saiuDosPais) {
    for (const { vin } of vinculosVivos(v)) {
      if (vin.parentesco && ['mae', 'pai', 'irmao', 'meio_irmao', 'avo', 'madrasta', 'padrasto'].includes(vin.parentesco)) {
        vin.convivio = vin.convivio.filter(c => c !== 'casa');
      }
      if (vin.parentesco === 'pet') vin.convivio = vin.convivio.filter(c => c !== 'casa');
    }
    if (silencioso) return;
    escrever(v, { texto: `Saiu da casa da família e foi morar ${m.id === 'republica' ? 'numa república' : `num${m.nome.startsWith('casa') ? 'a' : ''} ${m.nome}`} alugad${m.nome.startsWith('casa') ? 'a' : 'o'}${motivo ? `, ${motivo}` : ''}.`, relevancia: 'marco', tema: 'casa', escolha: true });
  } else if (!silencioso) {
    escrever(v, { texto: `Mudou-se para ${m.nome.startsWith('casa') ? 'uma' : 'um'} ${m.nome}.`, relevancia: 'biografia', tema: 'casa', escolha: true });
  }
}

/** Volta para a casa dos pais (se ainda há casa dos pais para onde voltar). */
export function voltarParaCasaDosPais(v: Vida): boolean {
  const pais = vinculosVivos(v).filter(x => x.vin.parentesco === 'mae' || x.vin.parentesco === 'pai');
  const casa = pais.find(x => x.p.municipioId === v.moradia.municipioId);
  if (!casa) return false;
  for (const x of pais) if (x.p.municipioId === v.moradia.municipioId && (!x.p.parceiroId || pais.some(o => o.p.id === x.p.parceiroId))) x.vin.convivio.push('casa');
  v.moradia = { tipo: 'pais', municipioId: v.moradia.municipioId, aluguel: 0, padrao: Math.max(1, v.moradia.padrao - 1), tInicio: v.t };
  escrever(v, { texto: `Voltou a morar com ${casa.vin.parentesco === 'mae' ? 'a mãe' : 'o pai'}.`, relevancia: 'marco', tema: 'casa' });
  return true;
}

/** O parceiro passa a morar junto (na casa do jogador, ou os dois alugam juntos). */
export function morarJuntos(v: Vida, p: Pessoa): void {
  if (moraComFamiliaDeOrigem(v)) {
    const renda = saldoMensal(v).renda + p.renda;
    const modelo = renda > 7000 ? 'apto_2q' : 'kitnet';
    alugar(v, modelo, `com ${p.nome}`, true);
  }
  p.municipioId = v.moradia.municipioId;
  const vin = v.vinculos[p.id];
  if (!vin.convivio.includes('casa')) vin.convivio.push('casa');
}

export const moradores = moraCom;

/**
 * Despejo: aluguel sem renda nenhuma, sem reserva e com o nome sujo há mais
 * de um ano. A pessoa volta para a família — ou vai para o sofá de alguém.
 */
export function verificarDespejo(v: Vida): void {
  const m = v.moradia;
  if (m.tipo !== 'aluguel' && m.tipo !== 'republica') return;
  const f = v.financas;
  const semNada = saldoMensal(v).renda === 0 && f.conta <= 0 && f.reserva <= 0;
  const desde = v.fatos['negativado_desde'];
  if (!semNada || !f.negativado || desde === undefined || v.t - desde < 12) return;
  if (voltarParaCasaDosPais(v)) {
    escrever(v, { texto: 'O aluguel atrasado virou ação de despejo. As coisas couberam num carro emprestado.', relevancia: 'biografia', tema: 'casa', tom: 'ruim' });
    return;
  }
  const amigo = vinculosVivos(v).find(x => !x.vin.parentesco && (x.vin.estagio === 'amigo_proximo' || x.vin.estagio === 'amigo') && x.p.municipioId === m.municipioId);
  v.moradia = { tipo: 'cedida', municipioId: m.municipioId, aluguel: 0, padrao: 1, tInicio: v.t };
  escrever(v, {
    texto: amigo ? `Despejo. ${amigo.p.nome} ofereceu o sofá da sala "por uns dias", que viraram meses.` : 'Despejo. Sem ter para onde ir, foi dormir de favor num quartinho nos fundos da casa de um conhecido.',
    relevancia: 'marco', tema: 'casa', tom: 'ruim', pessoas: amigo ? [amigo.p.id] : []
  });
  v.mente.estresse = Math.min(100, v.mente.estresse + 15);
}
