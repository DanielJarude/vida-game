/**
 * Coisas que são suas continuam na vida.
 *
 * Um carro não é só "vender": dá para pegar a estrada num fim de semana,
 * levar a família para a praia, fazer entregas nas horas vagas, emprestar a
 * um amigo (e torcer), deixar do seu jeito. Uma casa não é só "reformar":
 * dá para fazer festa, juntar a família no domingo, deixar com a sua cara.
 *
 * Não é microgerenciamento: poucas ações, uma vez por ano cada uma, e o que
 * acontece fica na história do bem, nas pessoas e, quando importa, na Linha
 * da Vida.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Imovel, Pessoa, Veiculo, Vida } from '../tipos';
import { escrever, filhos, idade, idadePessoa, lembrarCom, moraCom, parceiro, vinculosVivos } from '../nucleo';
import { modeloMoradia, modeloVeiculo } from '../dados/bens';
import { economiaLocal, municipio, MUNICIPIOS, pertoDaAgua } from '../dados/lugares';
import { dinheiro as fmt, listaNatural } from '../texto';
import { disponivel, okDePagar, pagar } from './dinheiro';
import type { Veredito } from '../plausibilidade';
import { abalar } from './abalo';
import { aplicarPersonalidade } from '../personalidade';
import { moraComFamiliaDeOrigem } from './domicilio';
import { podeComecarRotina } from './rotinas';
import { gv, textoVeiculo, usoMensalDoVeiculo, veiculoUtil } from './veiculos';

export type UsoVeiculo = 'passear' | 'viajar' | 'app' | 'personalizar' | 'emprestar';
export type UsoCasa = 'festa' | 'familia' | 'decorar' | 'reformar';

const ja = (v: Vida, k: string) => v.anoAtual.acoes.includes(k);
const c = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Com quem se vai: quem mora junto (parceria, filhos) — ou ninguém. */
function companhia(v: Vida): Pessoa[] {
  return moraCom(v).filter(p => !p.especie && (v.vinculos[p.id]?.romance || v.vinculos[p.id]?.parentesco === 'filho' || v.vinculos[p.id]?.parentesco === 'enteado')).slice(0, 4);
}

/** Um amigo próximo que poderia pedir o carro emprestado. */
function amigoQuePede(v: Vida): Pessoa | undefined {
  return vinculosVivos(v).filter(x => !x.p.especie && !x.vin.romance && idadePessoa(v, x.p) >= 18 && (x.vin.estagio === 'amigo_proximo' || x.vin.estagio === 'amigo' || x.vin.parentesco === 'irmao' || x.vin.parentesco === 'primo') && x.p.municipioId === v.moradia.municipioId).sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0]?.p;
}

/** Um destino de estrada plausível (determinístico no ano). */
function destino(v: Vida): string {
  const aqui = municipio(v.moradia.municipioId);
  const perto = MUNICIPIOS.filter(m => m.id !== aqui.id && m.uf === aqui.uf);
  const praia = perto.find(m => pertoDaAgua(m.id));
  const lista = praia ? [praia, ...perto] : perto;
  if (!lista.length) return 'a serra';
  const k = (Math.floor(v.t / 12) + v.id.length) % lista.length;
  return lista[k].nome;
}

/* ================================================================ Veículo */

export function disponibilidadeUsoVeiculo(v: Vida, b: Veiculo | undefined, oque: UsoVeiculo): { ok: boolean; motivo?: string; resgate?: Veredito['resgate'] } {
  if (!b) return { ok: false, motivo: 'Veículo não encontrado.' };
  const m = modeloVeiculo(b.modeloId);
  if (!veiculoUtil(b)) return { ok: false, motivo: b.parado ? 'Está parado na garagem.' : 'Precisa de conserto antes.' };
  if (m.cnh && !v.trabalho.licencas.includes('cnh')) return { ok: false, motivo: 'Sem carteira de motorista, não dá para dirigir.' };
  const custo = custoUso(v, b, oque);
  if (custo > 0 && disponivel(v) < custo) return { ok: false, motivo: `Custa uns ${fmt(custo)}.` };
  // O dinheiro existe, mas parte está aplicada: tirar é escolha (a interface oferece).
  if (custo > 0 && v.financas.conta < custo) return okDePagar(v, custo, 'Custa uns');
  switch (oque) {
    case 'passear': return ja(v, `uso:passear:${b.id}`) ? { ok: false, motivo: 'Já passearam bastante este ano.' } : { ok: true };
    case 'viajar': if (m.categoria === 'bicicleta') return { ok: false, motivo: 'De bicicleta, a estrada é outra história.' }; return ja(v, `uso:viajar:${b.id}`) ? { ok: false, motivo: 'Uma viagem de estrada por ano já é bastante.' } : { ok: true };
    case 'app': {
      if (m.categoria === 'bicicleta') return { ok: false, motivo: 'Para aplicativo, só moto ou carro.' };
      if (v.rotinas.some(r => r.id === 'corridas_app')) return { ok: false, motivo: 'Já faz entregas com ele.' };
      const d = podeComecarRotina(v, 'corridas_app', 1);
      return d.grau === 'permitido' ? { ok: true } : { ok: false, motivo: d.motivo };
    }
    case 'personalizar': if (m.categoria === 'bicicleta') return { ok: false, motivo: 'Não se aplica.' }; return (b.historia ?? []).some(h => h.texto.startsWith('Ficou do seu jeito')) ? { ok: false, motivo: 'Já está do seu jeito.' } : { ok: true };
    case 'emprestar': if (m.categoria === 'bicicleta') return { ok: false, motivo: 'Não se aplica.' }; if (!amigoQuePede(v)) return { ok: false, motivo: 'Ninguém próximo pediu.' }; return ja(v, `uso:emprestar:${b.id}`) ? { ok: false, motivo: 'Já emprestou este ano.' } : { ok: true };
  }
}

function custoUso(v: Vida, b: Veiculo, oque: UsoVeiculo): number {
  const m = modeloVeiculo(b.modeloId);
  if (oque === 'passear') return m.categoria === 'bicicleta' ? 0 : Math.round(usoMensalDoVeiculo(b) * 0.3 * c(v) / 10) * 10;
  if (oque === 'viajar') return Math.round((m.categoria === 'moto' ? 900 : 1600) * c(v) / 100) * 100;
  if (oque === 'personalizar') return Math.round(Math.max(800, b.valor * 0.04) / 100) * 100;
  return 0;
}

export function rotuloUsoVeiculo(v: Vida, b: Veiculo, oque: UsoVeiculo): string {
  const m = modeloVeiculo(b.modeloId);
  const com = companhia(v);
  switch (oque) {
    case 'passear': return m.categoria === 'bicicleta' ? 'Pedalar no domingo' : com.length ? 'Um domingo de passeio com a família' : m.categoria === 'moto' ? 'Uma volta de moto no fim da tarde' : 'Um domingo de estrada';
    case 'viajar': return `Pegar a estrada até ${destino(v)}`;
    case 'app': return m.categoria === 'moto' ? 'Fazer entregas por aplicativo nas horas vagas' : 'Fazer corridas por aplicativo nas horas vagas';
    case 'personalizar': return m.categoria === 'moto' ? 'Deixar a moto do seu jeito' : 'Deixar o carro do seu jeito';
    case 'emprestar': { const a = amigoQuePede(v); return a ? `Emprestar para ${a.nome}` : 'Emprestar'; }
  }
}

export function executarUsoVeiculo(v: Vida, r: Rng, b: Veiculo, oque: UsoVeiculo): string {
  const m = modeloVeiculo(b.modeloId);
  const custo = custoUso(v, b, oque);
  if (custo) pagar(v, custo);
  const com = companhia(v);
  const nomes = listaNatural(com.map(p => p.nome));
  const hist = (texto: string) => { (b.historia ??= []).push({ t: v.t, texto }); };
  switch (oque) {
    case 'passear': {
      v.anoAtual.acoes.push(`uso:passear:${b.id}`);
      v.mente.felicidade = clamp(v.mente.felicidade + 3);
      v.mente.estresse = clamp(v.mente.estresse - 3);
      for (const p of com) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + 3); vin.presenca = clamp((vin.presenca ?? 50) + 2); } }
      if (com.length) lembrarCom(v, com[0].id, `Um domingo de passeio de ${m.categoria === 'bicicleta' ? 'bicicleta' : m.categoria}.`, 'ritual', 1);
      return m.categoria === 'bicicleta' ? 'Pedal no parque, água de coco na volta.' : com.length ? `Um domingo inteiro fora, com ${nomes}. Ninguém pegou no celular.` : 'Janela aberta, música alta, lugar nenhum para ir. Foi bom.';
    }
    case 'viajar': {
      v.anoAtual.acoes.push(`uso:viajar:${b.id}`);
      b.estado = clamp(b.estado - 4);
      const lugar = destino(v);
      v.mente.felicidade = clamp(v.mente.felicidade + 6);
      v.mente.estresse = clamp(v.mente.estresse - 6);
      for (const p of com) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + 5); vin.presenca = clamp((vin.presenca ?? 50) + 3); lembrarCom(v, p.id, `A viagem de estrada até ${lugar}.`, 'ritual', 2); } }
      hist(`Levou ${com.length ? 'a família' : 'você'} até ${lugar}.`);
      const pneu = r.chance(0.15);
      escrever(v, { texto: `Pegou a estrada ${m.categoria === 'moto' ? 'de moto' : 'de carro'} até ${lugar}${com.length ? `, com ${nomes}` : ''}.${pneu ? ' Um pneu furou no meio do caminho — virou a história da viagem.' : ''}`, relevancia: com.length ? 'biografia' : 'cotidiano', tema: 'lazer', tom: 'bom', escolha: true, pessoas: com.map(p => p.id) });
      return `${fmt(custo)} entre combustível, pedágio e pousada. ${com.length ? 'Voltaram cansados e perto.' : 'Voltou com a cabeça mais leve.'}`;
    }
    case 'app': {
      v.rotinas.push({ id: 'corridas_app', tInicio: v.t, nivel: 1 });
      hist('Virou ferramenta de trabalho: entregas e corridas por aplicativo.');
      escrever(v, { texto: `Começou a fazer ${m.categoria === 'moto' ? 'entregas' : 'corridas'} por aplicativo com ${textoVeiculo(b)}, nas horas vagas.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return 'Um dinheiro a mais todo mês — e mais quilômetros, mais desgaste, mais noite na rua.';
    }
    case 'personalizar': {
      b.valor = Math.round(b.valor * 0.97 / 100) * 100;
      v.mente.felicidade = clamp(v.mente.felicidade + 2);
      hist('Ficou do seu jeito: som, rodas, os detalhes.');
      aplicarPersonalidade(v, 'acao:personalizar_veiculo', { independencia: 1 });
      return `${cap(textoVeiculo(b))} ficou com a sua cara. Quem compra usado, porém, paga menos por gosto dos outros.`;
    }
    case 'emprestar': {
      v.anoAtual.acoes.push(`uso:emprestar:${b.id}`);
      const a = amigoQuePede(v)!;
      const vin = v.vinculos[a.id];
      aplicarPersonalidade(v, 'acao:emprestar_veiculo', { generosidade: 1 });
      const sorte = r.next();
      if (sorte < 0.72) {
        if (vin) { vin.proximidade = clamp(vin.proximidade + 4); vin.confianca = clamp(vin.confianca + 4); }
        lembrarCom(v, a.id, `Pegou ${textoVeiculo(b)} ${gv(b, 'emprestado', 'emprestada')} e devolveu de tanque cheio.`, 'apoio', 1);
        return `${a.nome} devolveu no dia combinado, de tanque cheio e com uma caixa de bombom no banco.`;
      }
      if (sorte < 0.92) {
        b.estado = clamp(b.estado - 6);
        if (vin) vin.confianca = clamp(vin.confianca - 3);
        hist(`Voltou do empréstimo com um arranhão, pago por ${a.nome}.`);
        return `Voltou com um arranhão na porta. ${a.nome} pediu desculpas e pagou o conserto.`;
      }
      b.estado = clamp(b.estado - 15);
      b.problema = { id: `pb${v.seq++}`, texto: 'a lataria amassada e o farol quebrado', custo: Math.round(Math.max(1200, b.valor * 0.06) / 10) * 10, desde: v.t, gravidade: 1, adiado: 0 };
      if (vin) { vin.confianca = clamp(vin.confianca - 15); vin.tensao = clamp(vin.tensao + 15); }
      hist(`Voltou ${gv(b, 'batido', 'batida')} de um empréstimo para ${a.nome}.`);
      lembrarCom(v, a.id, `Bateu ${textoVeiculo(b)} que você emprestou — e sumiu.`, 'conflito', 2);
      abalar(v, `${textoVeiculo(b)} ${gv(b, 'batido', 'batida')}`, -3, 4);
      return `${a.nome} bateu ${textoVeiculo(b)} e demorou uma semana para contar. O conserto ficou com você.`;
    }
  }
}

/* =================================================================== Casa */

const minhaCasa = (v: Vida) => !moraComFamiliaDeOrigem(v) && v.moradia.tipo !== 'cedida';
const imovelDaCasa = (v: Vida) => v.financas.bens.find((b): b is Imovel => b.tipo === 'imovel' && b.id === v.moradia.imovelId);

export function disponibilidadeUsoCasa(v: Vida, oque: UsoCasa): { ok: boolean; motivo?: string; resgate?: Veredito['resgate'] } {
  if (idade(v) < 18) return { ok: false, motivo: 'A casa é dos adultos da família.' };
  const custo = custoCasa(v, oque);
  if (custo > 0 && disponivel(v) < custo) return { ok: false, motivo: `Custa uns ${fmt(custo)}.` };
  // O dinheiro existe, mas parte está aplicada: tirar é escolha (a interface oferece).
  if (custo > 0 && v.financas.conta < custo) return okDePagar(v, custo, 'Custa uns');
  switch (oque) {
    case 'festa': {
      if (moraComFamiliaDeOrigem(v)) return { ok: false, motivo: 'Na casa da família, a festa é dos adultos da casa.' };
      if (!convidadosDaFesta(v).length) return { ok: false, motivo: 'Ninguém para chamar, por enquanto.' };
      return ja(v, 'casa:festa') ? { ok: false, motivo: 'Já teve festa este ano.' } : { ok: true };
    }
    case 'familia': {
      if (moraComFamiliaDeOrigem(v)) return { ok: false, motivo: 'Você já mora com a família.' };
      if (!familiaPerto(v).length) return { ok: false, motivo: 'Não há família por perto para juntar.' };
      return ja(v, 'casa:familia') ? { ok: false, motivo: 'Já juntou a família este ano.' } : { ok: true };
    }
    case 'decorar': if (!minhaCasa(v)) return { ok: false, motivo: 'Não se aplica.' }; return v.fatos['casa_decorada'] !== undefined && v.t - v.fatos['casa_decorada'] < 36 && v.moradia.tInicio <= v.fatos['casa_decorada'] ? { ok: false, motivo: 'A casa já está com a sua cara.' } : { ok: true };
    case 'reformar': {
      const b = imovelDaCasa(v);
      if (!b) return { ok: false, motivo: 'Reforma grande, só em casa própria.' };
      if (b.problema) return { ok: false, motivo: 'Primeiro, o reparo que está pendente.' };
      return b.tManutencao !== undefined && v.t - b.tManutencao < 60 ? { ok: false, motivo: 'A última reforma foi há pouco.' } : { ok: true };
    }
  }
}

function custoCasa(v: Vida, oque: UsoCasa): number {
  if (oque === 'festa') return Math.round((400 + convidadosDaFesta(v).length * 120) * c(v) / 50) * 50;
  if (oque === 'familia') return Math.round(350 * c(v) / 50) * 50;
  if (oque === 'decorar') return Math.round(1500 * c(v) / 100) * 100;
  const b = imovelDaCasa(v);
  return b ? Math.round(b.valor * 0.08 / 1000) * 1000 : 0;
}

function convidadosDaFesta(v: Vida): Pessoa[] {
  return vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo') && x.p.municipioId === v.moradia.municipioId).map(x => x.p).slice(0, 6);
}
function familiaPerto(v: Vida): Pessoa[] {
  return vinculosVivos(v).filter(x => !x.p.especie && x.vin.parentesco && ['mae', 'pai', 'irmao', 'meio_irmao', 'avo', 'filho', 'neto', 'tio', 'primo'].includes(x.vin.parentesco) && x.p.municipioId === v.moradia.municipioId && !x.vin.convivio.includes('casa')).map(x => x.p).slice(0, 8);
}

export function rotuloUsoCasa(v: Vida, oque: UsoCasa): string {
  const m = v.moradia.modeloId ? modeloMoradia(v.moradia.modeloId) : undefined;
  switch (oque) {
    case 'festa': return m?.casa ? 'Fazer um churrasco em casa' : 'Chamar os amigos para uma festa em casa';
    case 'familia': return 'Juntar a família para um almoço de domingo';
    case 'decorar': return 'Deixar a casa com a sua cara';
    case 'reformar': return m?.casa ? 'Reformar a casa (cozinha, banheiro, pintura)' : 'Reformar o apartamento';
  }
}

export function executarUsoCasa(v: Vida, r: Rng, oque: UsoCasa): string {
  const custo = custoCasa(v, oque);
  if (custo) pagar(v, custo);
  switch (oque) {
    case 'festa': {
      v.anoAtual.acoes.push('casa:festa');
      const gente = convidadosDaFesta(v);
      for (const p of gente) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + 4); vin.tUltimoContato = v.t; } }
      if (gente[0]) lembrarCom(v, gente[0].id, 'A festa na sua casa.', 'ritual', 1);
      aplicarPersonalidade(v, 'acao:festa_em_casa', { sociabilidade: 1 });
      v.mente.felicidade = clamp(v.mente.felicidade + 4);
      const m = v.moradia.modeloId ? modeloMoradia(v.moradia.modeloId) : undefined;
      const reclamou = !m?.casa && r.chance(0.3);
      escrever(v, { texto: `Fez uma festa em casa com ${listaNatural(gente.map(p => p.nome).slice(0, 3))}${gente.length > 3 ? ' e mais gente' : ''}.${reclamou ? ' O vizinho de baixo reclamou do barulho.' : ''}`, relevancia: 'cotidiano', tema: 'amizade', tom: 'bom', escolha: true, pessoas: gente.map(p => p.id) });
      return `${fmt(custo)} entre bebida, carne e gelo. A casa ficou cheia até tarde.${reclamou ? ' O síndico mandou um recado no dia seguinte.' : ''}`;
    }
    case 'familia': {
      v.anoAtual.acoes.push('casa:familia');
      const fam = familiaPerto(v);
      for (const p of fam) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + 5); vin.tensao = clamp(vin.tensao - 4); vin.tUltimoContato = v.t; } }
      aplicarPersonalidade(v, 'acao:juntar_familia', { familia: 1 });
      v.mente.felicidade = clamp(v.mente.felicidade + 4);
      const nomes = fam.map(p => p.nome);
      const par = parceiro(v);
      escrever(v, { texto: `Juntou a família num almoço de domingo em casa: ${listaNatural(nomes.slice(0, 4))}${nomes.length > 4 ? ' e o resto' : ''}.`, relevancia: 'cotidiano', tema: 'familia', tom: 'bom', escolha: true, pessoas: fam.map(p => p.id) });
      if (par) lembrarCom(v, par.p.id, 'O almoço com a família toda em casa.', 'ritual', 1);
      for (const f of filhos(v)) if (v.vinculos[f.id]?.convivio.includes('casa')) lembrarCom(v, f.id, 'O almoço de domingo com a família toda.', 'ritual', 1);
      return 'Mesa grande, conversa alta, louça até a noite. Todo mundo foi embora com marmita.';
    }
    case 'decorar': {
      v.fatos['casa_decorada'] = v.t;
      v.mente.felicidade = clamp(v.mente.felicidade + 3);
      return 'Um quadro, uma planta, a luz certa, a estante arrumada: a casa ficou sua.';
    }
    case 'reformar': {
      const b = imovelDaCasa(v)!;
      b.estado = clamp(b.estado + 25);
      b.valor = Math.round(b.valor * 1.05 / 1000) * 1000;
      b.tManutencao = v.t;
      v.moradia.padrao = Math.min(5, v.moradia.padrao + (b.estado >= 90 ? 1 : 0));
      (b.historia ??= []).push({ t: v.t, texto: `Reforma: cozinha, banheiro e pintura (${fmt(custo)}).` });
      escrever(v, { texto: `Reformou ${b.nome.startsWith('casa') ? 'a casa' : 'o apartamento'}: dois meses de pó e barulho, ${fmt(custo)} — e a casa parece outra.`, relevancia: 'biografia', tema: 'casa', tom: 'bom', escolha: true });
      return `${fmt(custo)} e dois meses de obra. Valeu mais quando ficou pronta do que custou em paciência.`;
    }
  }
}

export const USOS_VEICULO: UsoVeiculo[] = ['passear', 'viajar', 'app', 'personalizar', 'emprestar'];
export const USOS_CASA: UsoCasa[] = ['festa', 'familia', 'decorar', 'reformar'];
