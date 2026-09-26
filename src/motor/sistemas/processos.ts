/**
 * Processos com duração: coisas que começam num ano e terminam depois.
 * (A gestação vive em `familia`; o curso, em `escola`.)
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Processo, Vida } from '../tipos';
import { escrever, idade, marcarFato, moraCom, novoId, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { municipio, nomeLugar } from '../dados/lugares';
import { encerrarEmprego } from './trabalho';
import { modeloMoradia } from '../dados/bens';
import { aluguelDe, marcarSaidaDeCasa } from './moradia';
import { flex, ge, listaNatural } from '../texto';
import { curso } from '../dados/cursos';
import { nomeOcupacaoId } from './trabalho';
import { fecharNegocio, negocioAberto, presencaDe, valorDoNegocio, venderNegocio } from './negocio';
import type { Negocio } from '../tipos';
import { doClube } from '../dados/clubes';
import { abalar } from './abalo';

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
  // Domicílio eleitoral: desde quando se vive na cidade (conta para candidatura).
  v.fatos['chegou_cidade'] = v.t;
  // Quem morava com a família de origem vai sozinho: a família fica.
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') {
    marcarSaidaDeCasa(v);
    for (const { p: pessoa, vin } of vinculosVivos(v)) {
      if (vin.parentesco && vin.parentesco !== 'filho' && (vin.parentesco !== 'pet' || pessoa.pet?.tutor !== 'eu')) vin.convivio = vin.convivio.filter(c => c !== 'casa');
    }
    const kit = modeloMoradia(idade(v) < 26 ? 'republica' : 'kitnet');
    v.moradia = { tipo: kit.id === 'republica' ? 'republica' : 'aluguel', municipioId: origem, modeloId: kit.id, aluguel: aluguelDe(v, kit, p.destinoId), padrao: kit.padrao, tInicio: v.t, aceitaPet: true };
    escrever(v, { texto: 'Saiu da casa da família.', relevancia: 'biografia', tema: 'casa' });
  } else if (v.moradia.tipo === 'propria') {
    // A casa própria fica na cidade de origem (dá para alugar ou vender); no destino, aluga-se algo parecido.
    const casa = v.financas.bens.find(b => b.id === v.moradia.imovelId);
    const m = modeloMoradia(v.moradia.modeloId ?? 'apto_2q');
    if (casa && casa.tipo === 'imovel') (casa.historia ??= []).push({ t: v.t, texto: `Ficou para trás na mudança para ${municipio(p.destinoId).nome}.` });
    v.moradia = { tipo: 'aluguel', municipioId: origem, modeloId: m.id, aluguel: aluguelDe(v, m, p.destinoId), padrao: m.padrao, tInicio: v.t, aceitaPet: true };
    escrever(v, { texto: `A casa em ${municipio(origem).nome} ficou fechada: dá para alugar ou vender. Em ${municipio(p.destinoId).nome}, por enquanto, aluguel.`, relevancia: 'cotidiano', tema: 'casa' });
  } else if (v.moradia.tipo === 'aluguel' || v.moradia.tipo === 'republica') {
    const m = modeloMoradia(v.moradia.modeloId ?? 'kitnet');
    v.moradia.aluguel = aluguelDe(v, m, p.destinoId);
    v.moradia.atraso = 0;
    v.moradia.bairro = undefined;
  }
  const juntos = moraCom(v);
  for (const x of juntos) x.municipioId = p.destinoId;
  for (const { p: pet, vin } of vinculosVivos(v)) if (pet.especie && vin.convivio.includes('casa')) pet.municipioId = p.destinoId;

  // O negócio: o que é da cidade fica na cidade (com quem o toque, ou fecha); o que é da internet vai junto.
  const n = negocioAberto(v);
  if (n && !negocioViaja(n)) negocioFicaParaTras(v, n, origem);
  const e = v.trabalho.atual;
  if (e && e.municipioId !== p.destinoId && e.contrato !== 'autonomo' && e.contrato !== 'informal') {
    const nome = nomeOcupacaoId(v, e.ocupacaoId);
    encerrarEmprego(v, 'mudança de cidade');
    escrever(v, { texto: `A mudança encerrou o trabalho de ${nome} em ${municipio(origem).nome}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  } else if (e) {
    // Quem trabalha por conta leva o ofício; a freguesia, não.
    if (e.clientela !== undefined && !(n && e.ocupacaoId === n.ocupacaoId)) {
      e.clientela = Math.round(e.clientela * 0.4);
      escrever(v, { texto: `A freguesia ficou em ${municipio(origem).nome}: em ${municipio(p.destinoId).nome}, recomeçar de quase nada.`, relevancia: 'cotidiano', tema: 'trabalho' });
    }
    e.municipioId = p.destinoId;
  }
  const m = v.educacao.matricula;
  if (m && m.modalidade === 'presencial' && m.municipioId !== p.destinoId && !m.trancado) {
    // Trancada, não perdida: a vaga espera quatro anos (e voltar para a cidade devolve o curso).
    m.trancado = true;
    m.tTrancou = v.t;
    escrever(v, { texto: `Com a mudança, trancou ${curso(m.cursoId).nome}: o curso é presencial em ${municipio(m.municipioId).nome}.`, relevancia: 'biografia', tema: 'estudo', tom: 'ruim' });
  }
  const es = v.caminhos.esporte;
  if (es?.fase === 'base' && es.municipioId === origem) {
    es.fase = 'encerrada'; es.tFim = v.t; es.motivoFim = 'escolha';
    escrever(v, { texto: `A mudança deixou para trás ${es.modalidade === 'futebol' ? 'a base' : 'a equipe'} ${doClube(es.clube)}.`, relevancia: 'biografia', tema: 'lazer', tom: 'ruim' });
  }
  for (const b of v.financas.bens) if (b.tipo === 'veiculo') (b.historia ??= []).push({ t: v.t, texto: `Foi junto na mudança para ${municipio(p.destinoId).nome}.` });
  v.moradia.municipioId = p.destinoId;
  v.moradia.tInicio = v.t;
  marcarFato(v, 'mudou_de_cidade');
  const destino = municipio(p.destinoId);
  escrever(v, {
    texto: `Mudou-se de ${municipio(origem).nome} para ${destino.nome}${p.motivo ? `, ${p.motivo}` : ''}.`,
    relevancia: 'marco', tema: 'lugar'
  });
  abalar(v, `a mudança para ${destino.nome}`, 0, 8);
}

/** A internet (e o que se faz de qualquer lugar) muda junto; o balcão, a sala e a obra ficam. */
const negocioViaja = (n: Negocio) => presencaDe(n) === 'online' || n.tipo === 'consultoria_ti' || n.tipo === 'escritorio_contabil';

function negocioFicaParaTras(v: Vida, n: Negocio, origem: string): void {
  const dono = v.trabalho.atual?.ocupacaoId === n.ocupacaoId;
  const quem = (n.equipe?.length ?? 0) > 0 ? 'da equipe' : n.socioId && v.pessoas[n.socioId]?.vivo ? `de ${v.pessoas[n.socioId].nome}` : undefined;
  if (quem) {
    n.dedicacao = 'paralela';
    n.passivo = true;
    if (dono) encerrarEmprego(v, 'mudança de cidade');
    escrever(v, { texto: `${n.nome} ficou em ${municipio(origem).nome}, nas mãos ${quem}: de longe, só o que sobra no caixa.`, relevancia: 'biografia', tema: 'trabalho' });
    return;
  }
  const valor = valorDoNegocio(v, n);
  if (valor > 0) { venderNegocio(v, valor); return; }
  fecharNegocio(v, 'a mudança de cidade levou você para longe, e não havia quem tocasse');
  if (dono) encerrarEmprego(v, 'fechou o negócio');
}

/**
 * O que uma mudança de cidade faria com esta vida — dito ANTES de mudar
 * (a tela de mudança mostra; a mudança faz exatamente isto).
 */
export function consequenciasDaMudanca(v: Vida, destinoId: string): string[] {
  const out: string[] = [];
  const aqui = municipio(v.moradia.municipioId).nome;
  const n = negocioAberto(v);
  if (n && !negocioViaja(n)) {
    const quem = (n.equipe?.length ?? 0) > 0 ? 'a equipe' : n.socioId && v.pessoas[n.socioId]?.vivo ? v.pessoas[n.socioId].nome : undefined;
    out.push(quem ? `${n.nome} fica em ${aqui}, tocado por ${quem}; você só recebe o que sobrar.` : valorDoNegocio(v, n) > 0 ? `${n.nome} é vendido: não há quem toque o ${presencaDe(n) === 'atendimento' ? 'consultório' : 'ponto'} sem você.` : `${n.nome} fecha: não há quem toque sem você.`);
  } else if (n) out.push(`${n.nome} vai junto: ${presencaDe(n) === 'online' ? 'a loja é na internet' : 'os clientes são atendidos à distância'}.`);
  const e = v.trabalho.atual;
  if (e && !(n && e.ocupacaoId === n.ocupacaoId)) {
    const nome = nomeOcupacaoId(v, e.ocupacaoId);
    if (e.contrato === 'autonomo' || e.contrato === 'informal') out.push(`O trabalho de ${nome} vai junto, mas a freguesia fica: recomeçar lá.`);
    else if (e.municipioId !== destinoId) out.push(`O trabalho de ${nome} acaba (é em ${municipio(e.municipioId).nome}).`);
  }
  const m = v.educacao.matricula;
  if (m && !m.trancado && m.modalidade === 'presencial' && m.municipioId !== destinoId) out.push(`${curso(m.cursoId).nome} fica trancado: é presencial em ${municipio(m.municipioId).nome}.`);
  const es = v.caminhos.esporte;
  if (es?.fase === 'base' && es.municipioId === v.moradia.municipioId) out.push(`${es.modalidade === 'futebol' ? 'A base' : 'A equipe'} ${doClube(es.clube)} fica para trás.`);
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') out.push('Você sai da casa da família: aluguel, mercado e contas passam a ser seus.');
  if (v.moradia.tipo === 'propria') out.push(`A casa própria fica em ${aqui} (dá para alugar ou vender); lá, começa-se de aluguel.`);
  // Da casa da família, só você sai; da sua casa, vai quem mora nela.
  const naFamilia = v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente';
  const vai = naFamilia ? [] : moraCom(v).filter(p => !p.especie);
  const bichos = vinculosVivos(v).filter(x => x.p.especie && x.vin.convivio.includes('casa') && x.p.pet?.tutor === 'eu').map(x => x.p.nome);
  if (vai.length) out.push(`Vão junto: ${listaNatural([...vai.map(p => p.nome), ...bichos])}.`);
  else if (bichos.length) out.push(`Vão junto: ${listaNatural(bichos)}.`);
  const longe = vinculosVivos(v).filter(x => !x.p.especie && (x.vin.estagio === 'amigo_proximo' || ['mae', 'pai'].includes(x.vin.parentesco ?? '')) && x.p.municipioId === v.moradia.municipioId && !vai.includes(x.p)).map(x => x.p.nome);
  if (longe.length) out.push(`Ficam longe: ${longe.length > 3 ? `${longe.slice(0, 3).join(', ')} e outros` : listaNatural(longe)}.`);
  return out;
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
  escrever(v, { texto: `Depois de ${Math.round((v.t - p.tInicio) / 12)} anos de espera, ${crianca.nome}, de ${idadeCrianca} ${idadeCrianca === 1 ? 'ano' : 'anos'}, chegou em casa. ${flex(ge(v), 'Pai', 'Mãe', 'Mãe')} por adoção aos ${idade(v)}.`, relevancia: 'marco', tema: 'filhos', tom: 'bom', pessoas: [crianca.id] });
  abalar(v, `a chegada de ${crianca.nome}`, 12, 0);
}

export { nomeLugar };
