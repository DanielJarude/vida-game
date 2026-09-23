/**
 * Processos com duração: coisas que começam num ano e terminam depois.
 * (A gestação vive em `familia`; o curso, em `escola`.)
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Processo, Vida } from '../tipos';
import { escrever, idade, marcarFato, moraCom, novoId, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { economiaLocal, municipio, nomeLugar } from '../dados/lugares';
import { encerrarEmprego } from './trabalho';
import { modeloMoradia } from '../dados/bens';
import { aluguelDe } from './moradia';
import { flex } from '../texto';

export function processarProcessos(v: Vida, r: Rng): void {
  for (const p of [...v.processos]) {
    if (p.tipo === 'mudanca' && p.tEfetiva <= v.t) concluirMudanca(v, p);
    else if (p.tipo === 'cnh' && p.tFim <= v.t) concluirCnh(v, r, p);
    else if (p.tipo === 'adocao' && p.tFim <= v.t) concluirAdocao(v, r, p);
    else if (p.tipo === 'tratamento' && p.tFim <= v.t) {
      v.processos = v.processos.filter(x => x.id !== p.id);
      const c = v.corpo.condicoes.find(x => x.id === p.condicaoId);
      if (c) c.tratando = true;
    }
  }
}

/* --------------------------------------------------------------- Mudança */

export function agendarMudanca(v: Vida, destinoId: string, motivo: string, tEfetiva = v.t): void {
  v.processos.push({ tipo: 'mudanca', id: novoId(v, 'mud'), tEfetiva, destinoId, motivo });
}

/** Muda de cidade agora (a decisão já foi tomada e o caminhão já saiu). */
export function mudarAgora(v: Vida, destinoId: string, motivo: string): void {
  const id = novoId(v, 'mud');
  const p = { tipo: 'mudanca' as const, id, tEfetiva: v.t, destinoId, motivo };
  v.processos.push(p);
  concluirMudanca(v, p);
}

/**
 * Mudar de cidade leva gente junto (quem mora na casa) e deixa gente para
 * trás. O emprego local acaba, a faculdade presencial também (a não ser que
 * a mudança seja por causa dela), amizades passam a ser à distância.
 */
export function concluirMudanca(v: Vida, p: Extract<Processo, { tipo: 'mudanca' }>): void {
  v.processos = v.processos.filter(x => x.id !== p.id);
  const origem = v.moradia.municipioId;
  if (origem === p.destinoId) return;
  // Quem morava com a família de origem vai sozinho: a família fica.
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') {
    for (const { p: pessoa, vin } of vinculosVivos(v)) {
      if (vin.parentesco && vin.parentesco !== 'filho') vin.convivio = vin.convivio.filter(c => c !== 'casa');
      void pessoa;
    }
    const kit = modeloMoradia(idade(v) < 26 ? 'republica' : 'kitnet');
    v.moradia = { tipo: kit.id === 'republica' ? 'republica' : 'aluguel', municipioId: origem, modeloId: kit.id, aluguel: aluguelDe(kit, p.destinoId), padrao: kit.padrao, tInicio: v.t };
    escrever(v, { texto: 'Saiu da casa da família.', relevancia: 'biografia', tema: 'casa' });
  }
  const juntos = moraCom(v);
  for (const x of juntos) x.municipioId = p.destinoId;
  for (const { p: pet, vin } of vinculosVivos(v)) if (pet.especie && vin.convivio.includes('casa')) pet.municipioId = p.destinoId;

  if (v.trabalho.atual && v.trabalho.atual.municipioId !== p.destinoId && v.trabalho.atual.contrato !== 'autonomo') {
    encerrarEmprego(v, 'mudança de cidade');
  } else if (v.trabalho.atual) {
    v.trabalho.atual.municipioId = p.destinoId;
  }
  const m = v.educacao.matricula;
  if (m && m.modalidade === 'presencial' && m.municipioId !== p.destinoId) {
    escrever(v, { texto: 'A mudança interrompeu a faculdade: o curso presencial ficou para trás.', relevancia: 'biografia', tema: 'estudo', tom: 'ruim' });
    v.educacao.matricula = undefined;
  }
  const custoAntes = economiaLocal(origem).custo;
  const custoDepois = economiaLocal(p.destinoId).custo;
  if (v.moradia.tipo === 'aluguel' || v.moradia.tipo === 'republica') v.moradia.aluguel = Math.round(v.moradia.aluguel * custoDepois / custoAntes / 10) * 10;
  v.moradia.municipioId = p.destinoId;
  v.moradia.tInicio = v.t;
  marcarFato(v, 'mudou_de_cidade');
  const destino = municipio(p.destinoId);
  escrever(v, {
    texto: `Mudou-se de ${municipio(origem).nome} para ${destino.nome}${p.motivo ? `, ${p.motivo}` : ''}.`,
    relevancia: 'marco', tema: 'lugar'
  });
  v.mente.estresse = clamp(v.mente.estresse + 8);
}

export const custoDeMudanca = (origemId: string, destinoId: string) =>
  municipio(origemId).uf === municipio(destinoId).uf ? 2500 : 6500;

/* ------------------------------------------------------------------- CNH */

export function iniciarCnh(v: Vida): void {
  v.processos.push({ tipo: 'cnh', id: novoId(v, 'cnh'), tInicio: v.t, tFim: v.t + 4, tentativas: 0 });
}

function concluirCnh(v: Vida, r: Rng, p: Extract<Processo, { tipo: 'cnh' }>): void {
  const chance = clamp(0.62 + (v.mente.cognicao - 50) / 200 - p.tentativas * 0.05 + (v.mente.estresse > 60 ? -0.1 : 0), 0.3, 0.9);
  if (r.chance(chance)) {
    v.processos = v.processos.filter(x => x.id !== p.id);
    v.trabalho.licencas.push('cnh');
    escrever(v, { texto: p.tentativas === 0 ? 'Passou na prova do Detran de primeira e tirou a carteira de motorista.' : 'Tirou a carteira de motorista, depois de reprovar na baliza.', relevancia: 'biografia', tema: 'lugar', tom: 'bom' });
  } else {
    p.tentativas += 1;
    p.tFim = v.t + 3;
    v.financas.conta -= 450; // taxas e aulas extras
    if (p.tentativas >= 3) {
      v.processos = v.processos.filter(x => x.id !== p.id);
      escrever(v, { texto: 'Depois de três reprovações no Detran, desistiu da carteira por um tempo.', relevancia: 'cotidiano', tema: 'lugar', tom: 'ruim' });
    }
  }
}

/* ---------------------------------------------------------------- Adoção */

export function iniciarAdocao(v: Vida, parceiroId?: string): void {
  v.processos.push({ tipo: 'adocao', id: novoId(v, 'ado'), tInicio: v.t, tFim: v.t + 36, parceiroId });
  escrever(v, { texto: 'Entrou com o pedido de habilitação para adoção na Vara da Infância. O processo leva anos.', relevancia: 'biografia', tema: 'filhos', escolha: true });
}

function concluirAdocao(v: Vida, r: Rng, p: Extract<Processo, { tipo: 'adocao' }>): void {
  v.processos = v.processos.filter(x => x.id !== p.id);
  const genero = r.chance(0.5) ? 'masculino' : 'feminino';
  const idadeCrianca = r.int(1, 8);
  const crianca = criarPessoa(v, r, { genero, idade: idadeCrianca, municipioId: v.moradia.municipioId, sobrenome: v.eu.sobrenome });
  crianca.ocupacao = idadeCrianca >= 4 ? 'estudante' : undefined;
  vincular(v, crianca, { parentesco: 'filho', origem: 'familia', proximidade: 55, convivio: ['casa'] });
  marcarFato(v, `adotado_${crianca.id}`);
  escrever(v, { texto: `Depois de ${Math.round((v.t - p.tInicio) / 12)} anos de espera, ${crianca.nome}, de ${idadeCrianca} ${idadeCrianca === 1 ? 'ano' : 'anos'}, chegou em casa. ${flex(v.eu.genero, 'Pai', 'Mãe', 'Mãe')} por adoção aos ${idade(v)}.`, relevancia: 'marco', tema: 'filhos', tom: 'bom', pessoas: [crianca.id] });
  v.mente.felicidade = clamp(v.mente.felicidade + 12);
}

export { nomeLugar };
