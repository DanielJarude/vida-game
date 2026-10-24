/**
 * REWORK 11 · POL-02 — O CARGO DETERMINA AS AÇÕES. O mandato tinha o mesmo menu para vereador, prefeito, deputado,
 * senador e governador (prioridade, comunidade, negociar, candidatura). Agora cada casa tem os seus verbos, e cada um
 * mexe no que a política já tem (`politica`, `desgastePolitico`) — aprovação, entrega (`feito`), base, nome, desgaste
 * com causa, o aliado, a crise do mandato:
 *
 *   LEGISLATIVO (vereador, deputados, senador): apresentar projeto de lei · fiscalizar (comissão de investigação) ·
 *     emenda para a base · votar com ou contra o Executivo · (senador) sabatina de autoridade
 *   EXECUTIVO (prefeito, governador): montar o secretariado (técnico ou de aliados) · o orçamento do ano · sancionar
 *     ou vetar o projeto polêmico · lançar uma obra grande
 *
 * No máximo duas destas por ano (o mandato tem agenda); cada uma uma vez. Os resultados vêm do estado (a base, o
 * partido na cidade, o aliado, a economia, a liderança) e do acaso — nunca garantidos. Os textos são genéricos (casa
 * legislativa, Executivo): valem fora do Brasil também (`politica.nomeCargo` dá o nome do cargo no país).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CargoEletivo, Vida } from '../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { escrever, lembrarCom } from '../nucleo';
import { habilidade } from './frentes';
import { aliviar, desgastar } from './desgastePolitico';
import { aliado, cargoNoPais, criarAliado, NOME_PRIORIDADE, nomeCargo, registrarNoMandato } from './politica';
import { anoDe } from '../tempo';

export type AcaoDoCargo = 'projeto_lei' | 'fiscalizar' | 'emenda' | 'votar_com' | 'votar_contra' | 'sabatina'
  | 'secretariado_tecnico' | 'secretariado_aliados' | 'orcamento' | 'sancionar' | 'vetar' | 'obra';

const LEGISLATIVO: AcaoDoCargo[] = ['projeto_lei', 'fiscalizar', 'emenda', 'votar_com', 'votar_contra'];
const EXECUTIVO: AcaoDoCargo[] = ['secretariado_tecnico', 'secretariado_aliados', 'orcamento', 'sancionar', 'vetar', 'obra'];
export const ACOES_DO_CARGO: Record<CargoEletivo, AcaoDoCargo[]> = {
  vereador: LEGISLATIVO, deputado_estadual: LEGISLATIVO, deputado_federal: LEGISLATIVO, senador: [...LEGISLATIVO, 'sabatina'],
  prefeito: EXECUTIVO, governador: EXECUTIVO
};
const POR_ANO = 2;
const feita = (v: Vida, a: AcaoDoCargo) => v.anoAtual.acoes.includes(`pol_cargo:${a}`);
const feitasNoAno = (v: Vida) => v.anoAtual.acoes.filter(x => x.startsWith('pol_cargo:')).length;

/** O Executivo a quem a casa responde (em palavras genéricas). */
function executivoDe(_v: Vida, c: CargoEletivo): string {
  return c === 'vereador' ? 'o Executivo da cidade' : c === 'deputado_estadual' ? 'o Executivo do estado' : 'o governo';
}
const casaDe = (c: CargoEletivo) => (c === 'senador' ? 'o senado' : c === 'deputado_estadual' || c === 'governador' ? 'a assembleia' : 'a câmara');

export function rotuloDoCargo(v: Vida, a: AcaoDoCargo): { rotulo: string; porque: string } {
  const c = v.caminhos.politica?.mandato?.cargo ?? 'vereador';
  const prio = v.caminhos.politica?.prioridade;
  const tema = prio ? NOME_PRIORIDADE[prio].split(':')[0] : 'a sua bandeira';
  switch (a) {
    case 'projeto_lei': return { rotulo: `Apresentar um projeto de lei (${tema})`, porque: 'Aprovado, é entrega com o seu nome; parado na comissão, é cobrança.' };
    case 'fiscalizar': return { rotulo: 'Fiscalizar: abrir uma comissão de investigação', porque: `Dá nome e cobra ${executivoDe(v, c)} — e cria inimigos.` };
    case 'emenda': return { rotulo: 'Destinar uma emenda para a base', porque: 'Verba para um bairro, uma cidade que apoia você — se o Executivo liberar.' };
    case 'votar_com': return { rotulo: `Votar com ${executivoDe(v, c)} na votação do ano`, porque: 'Aliança e espaço; a rua pode cobrar.' };
    case 'votar_contra': return { rotulo: `Votar contra ${executivoDe(v, c)} na votação do ano`, porque: 'A rua pode aplaudir; o partido e os aliados, não.' };
    case 'sabatina': return { rotulo: 'Relatar a sabatina de uma autoridade', porque: 'Visibilidade e responsabilidade: o nome fica ligado à escolha.' };
    case 'secretariado_tecnico': return { rotulo: 'Montar o secretariado com nomes técnicos', porque: 'As entregas andam melhor; os aliados ficam sem espaço.' };
    case 'secretariado_aliados': return { rotulo: 'Montar o secretariado com aliados', porque: `Base firme em ${casaDe(c)}; as entregas, nem sempre — e o risco de nome ruim por perto.` };
    case 'orcamento': return { rotulo: `Fechar o orçamento do ano priorizando ${tema}`, porque: 'A prioridade anda; as áreas que perderam reclamam.' };
    case 'sancionar': return { rotulo: `Sancionar o projeto polêmico que ${casaDe(c)} aprovou`, porque: 'Agrada a base em plenário; parte da rua não.' };
    case 'vetar': return { rotulo: `Vetar o projeto polêmico que ${casaDe(c)} aprovou`, porque: 'A rua pode gostar; o veto pode ser derrubado.' };
    case 'obra': return { rotulo: 'Lançar uma obra grande', porque: 'Entrega que se vê — se terminar. Atraso e aditivo viram crise.' };
  }
}

export function disponibilidadeDoCargo(v: Vida, valor?: string): Veredito {
  const p = v.caminhos.politica;
  const m = p?.mandato;
  if (!p || !m) return bloqueio('impossivel', 'Isso é do exercício de um mandato.');
  const a = valor as AcaoDoCargo;
  if (!ACOES_DO_CARGO[m.cargo]?.includes(a)) return bloqueio('impossivel', `Não é atribuição de ${nomeCargo(v, m.cargo)}.`);
  if (feita(v, a) || ((a === 'votar_com' || a === 'votar_contra') && (feita(v, 'votar_com') || feita(v, 'votar_contra'))) || ((a === 'sancionar' || a === 'vetar') && (feita(v, 'sancionar') || feita(v, 'vetar'))) || ((a === 'secretariado_tecnico' || a === 'secretariado_aliados') && (feita(v, 'secretariado_tecnico') || feita(v, 'secretariado_aliados'))))
    return bloqueio('incompativel', 'Isso já foi decidido neste ano.');
  if ((a === 'secretariado_tecnico' || a === 'secretariado_aliados') && v.fatos['pol_secretariado_t'] !== undefined && v.fatos['pol_secretariado_t'] >= m.tInicio && v.t - v.fatos['pol_secretariado_t'] < 24) return bloqueio('incompativel', 'O secretariado foi montado há pouco: trocar agora parece desgoverno.');
  if (a === 'obra' && v.fatos['pol_obra_t'] !== undefined && v.t - v.fatos['pol_obra_t'] < 36) return bloqueio('incompativel', 'A obra grande anterior ainda não acabou.');
  if (feitasNoAno(v) >= POR_ANO) return bloqueio('incompativel', 'A agenda do mandato neste ano já está tomada (duas frentes por ano).');
  return PERMITIDO;
}

/** A chance-base de algo passar pela casa / pela máquina: a base, o partido na cidade, o aliado, a liderança. */
function forcaPolitica(v: Vida): number {
  const p = v.caminhos.politica!;
  const porte = [0.08, 0, -0.08][v.fatos['pol_partido_porte'] ?? 1] ?? 0;
  return p.apoio / 250 + porte + (aliado(v) ? 0.06 : 0) + habilidade(v, 'lideranca') / 500 - p.desgaste / 400;
}

export function executarDoCargo(v: Vida, r: Rng, valor: string): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const p = v.caminhos.politica!;
  const m = p.mandato!;
  const a = valor as AcaoDoCargo;
  v.anoAtual.acoes.push(`pol_cargo:${a}`);
  const c = m.cargo;
  const federal = c === 'deputado_federal' || c === 'senador' || c === 'governador';
  const prio = p.prioridade ? NOME_PRIORIDADE[p.prioridade].split(':')[0] : 'a sua bandeira';
  const crise = v.economia?.fase === 'crise';
  const fim = (texto: string, tom: 'bom' | 'ruim' | 'neutro', bio = false) => { escrever(v, { texto, relevancia: bio ? 'biografia' : 'cotidiano', tema: 'trabalho', escolha: true, tom: tom === 'neutro' ? undefined : tom }); return { texto, tom }; };
  switch (a) {
    case 'projeto_lei': {
      const deu = r.chance(clamp(0.28 + forcaPolitica(v) - (federal ? 0.06 : 0), 0.08, 0.75));
      if (deu) { m.feito += 2; m.aprovacao = clamp(m.aprovacao + 4); p.reputacao = clamp(p.reputacao + 1); registrarNoMandato(v, `${anoDe(v.t)} · aprovou um projeto de lei (${prio})`); return fim(`O projeto de lei sobre ${prio} passou em ${casaDe(c)}: votação apertada, e o seu nome no texto.`, 'bom', true); }
      desgastar(p, 2, 'promessas'); m.aprovacao = clamp(m.aprovacao - 1);
      return fim(`O projeto de lei sobre ${prio} parou na comissão. Quem esperava por ele começou a cobrar.`, 'ruim');
    }
    case 'fiscalizar': {
      p.reputacao = clamp(p.reputacao + 3);
      const deu = r.chance(clamp(0.4 + v.personalidade.tracos.coragem / 300 + habilidade(v, 'lideranca') / 400, 0.15, 0.7));
      const al = aliado(v);
      if (al) { const vin = v.vinculos[al.id]; if (vin) vin.tensao = clamp(vin.tensao + 8); }
      if (deu) { m.aprovacao = clamp(m.aprovacao + 5); desgastar(p, 2, 'exposicao'); registrarNoMandato(v, `${anoDe(v.t)} · comandou uma investigação que apontou irregularidades`); return fim(`A investigação que você puxou achou o que procurava: o relatório saiu, e a imprensa repetiu o seu nome. ${al ? `${al.nome} não gostou.` : 'Do outro lado, ficaram inimigos.'}`, 'bom', true); }
      desgastar(p, 5, 'exposicao');
      if (!m.crise && r.chance(0.3)) m.crise = { t: v.t, tipo: 'aliado' };
      return fim('A investigação virou briga de plenário e terminou sem conclusão. Ficou a fama de quem compra briga — e os inimigos.', 'ruim');
    }
    case 'emenda': {
      const libera = r.chance(clamp(0.6 + (aliado(v) ? 0.1 : 0) - (crise ? 0.2 : 0) + ([0.05, 0, -0.08][v.fatos['pol_partido_porte'] ?? 1] ?? 0), 0.2, 0.85));
      if (libera) { p.apoio = clamp(p.apoio + 4); m.feito += 1; registrarNoMandato(v, `${anoDe(v.t)} · emenda liberada para a base`); return fim('A emenda foi liberada: a verba chegou à obra do bairro que apoia você, com placa e inauguração.', 'bom'); }
      desgastar(p, 3, 'promessas');
      return fim(`A emenda ficou contingenciada: ${executivoDe(v, c)} segurou a verba, e a base que esperava cobra de você.`, 'ruim');
    }
    case 'votar_com': {
      const al = criarAliado(v, r);
      const vin = v.vinculos[al.id];
      if (vin) { vin.proximidade = clamp(vin.proximidade + 6); vin.tensao = clamp(vin.tensao - 5); }
      aliviar(p, 3, ['partido']);
      const impopular = r.chance(0.45);
      if (impopular) m.aprovacao = clamp(m.aprovacao - 3);
      lembrarCom(v, al.id, 'Votaram juntos na votação do ano.', 'trabalho', 1);
      return fim(`Votou com ${executivoDe(v, c)}. ${al.nome} agradeceu com espaço${impopular ? '; na rua, a votação pegou mal.' : '; a votação passou sem barulho.'}`, impopular ? 'neutro' : 'bom');
    }
    case 'votar_contra': {
      const al = aliado(v);
      if (al) { const vin = v.vinculos[al.id]; if (vin) vin.tensao = clamp(vin.tensao + 12); }
      desgastar(p, 3, 'partido');
      const rua = r.chance(0.6);
      if (rua) { m.aprovacao = clamp(m.aprovacao + 3); p.reputacao = clamp(p.reputacao + 1); }
      return fim(`Votou contra ${executivoDe(v, c)}. ${rua ? 'A rua aplaudiu;' : 'A rua nem percebeu;'} no partido, ficou anotado.`, rua ? 'bom' : 'neutro');
    }
    case 'sabatina': {
      p.reputacao = clamp(p.reputacao + 2);
      const bem = r.chance(0.6 + habilidade(v, 'lideranca') / 500);
      if (bem) { m.aprovacao = clamp(m.aprovacao + 2); return fim('Relatou a sabatina com perguntas duras e voto fundamentado: saiu maior do que entrou.', 'bom'); }
      desgastar(p, 3, 'exposicao');
      return fim('A sabatina que você relatou virou polêmica: a autoridade aprovada foi parar no noticiário pelo motivo errado.', 'ruim');
    }
    case 'secretariado_tecnico': {
      v.fatos['pol_secretariado_t'] = v.t; v.fatos['pol_secretariado'] = 1;
      desgastar(p, 2, 'partido');
      return fim('Montou um secretariado de nomes técnicos: as pastas começaram a andar; os aliados que esperavam cargo saíram da sala calados.', 'neutro', true);
    }
    case 'secretariado_aliados': {
      v.fatos['pol_secretariado_t'] = v.t; v.fatos['pol_secretariado'] = 2;
      p.apoio = clamp(p.apoio + 5); aliviar(p, 4, ['partido']);
      const al = criarAliado(v, r);
      const vin = v.vinculos[al.id];
      if (vin) vin.proximidade = clamp(vin.proximidade + 8);
      // Um nome ruim por perto: a chance de o favor virar caso (a mesma porta do favor de campanha, `politica.processarRiscoPolitico`).
      if (r.chance(0.12) && v.fatos['pol_risco'] === undefined) v.fatos['pol_risco'] = v.t;
      return fim(`Montou o secretariado com aliados: ${al.nome} indicou metade dos nomes. A base em ${casaDe(c)} ficou firme.`, 'neutro', true);
    }
    case 'orcamento': {
      const tecnico = v.fatos['pol_secretariado'] === 1 && (v.fatos['pol_secretariado_t'] ?? -1) >= m.tInicio;
      const deu = r.chance(clamp(0.55 + (tecnico ? 0.12 : 0) - (crise ? 0.2 : 0) + forcaPolitica(v) / 2, 0.15, 0.85));
      desgastar(p, 1, 'mandato');
      if (deu) { m.feito += 3; m.aprovacao = clamp(m.aprovacao + 2); registrarNoMandato(v, `${anoDe(v.t)} · o orçamento priorizou ${prio}`); return fim(`O orçamento do ano saiu com ${prio} na frente: dinheiro carimbado, e as outras secretarias reclamando.`, 'bom'); }
      m.aprovacao = clamp(m.aprovacao - 3);
      return fim(`O caixa não fechou${crise ? ' (a arrecadação caiu com a crise)' : ''}: o orçamento de ${prio} foi cortado no meio do ano.`, 'ruim');
    }
    case 'sancionar': {
      aliviar(p, 3, ['partido']); p.apoio = clamp(p.apoio + 2);
      const rua = r.chance(0.5);
      if (rua) { desgastar(p, 3, 'exposicao'); m.aprovacao = clamp(m.aprovacao - 2); }
      return fim(`Sancionou o projeto. A base em ${casaDe(c)} agradeceu${rua ? '; parte da rua protestou na porta.' : '; a rua seguiu a vida.'}`, rua ? 'neutro' : 'bom');
    }
    case 'vetar': {
      desgastar(p, 4, 'partido');
      const derrubado = r.chance(clamp(0.45 - forcaPolitica(v), 0.1, 0.7));
      if (derrubado) { m.aprovacao = clamp(m.aprovacao - 2); return fim(`Vetou o projeto — e ${casaDe(c)} derrubou o veto. Derrota em plenário, com foto.`, 'ruim'); }
      m.aprovacao = clamp(m.aprovacao + 3);
      return fim(`Vetou o projeto, e o veto ficou de pé. ${cap(casaDe(c))} resmungou; a rua, em boa parte, gostou.`, 'bom');
    }
    case 'obra': {
      v.fatos['pol_obra_t'] = v.t;
      const deu = r.chance(clamp(0.5 + (v.fatos['pol_secretariado'] === 1 ? 0.1 : 0) - (crise ? 0.15 : 0) + forcaPolitica(v) / 3, 0.15, 0.8));
      if (deu) { m.feito += 4; m.aprovacao = clamp(m.aprovacao + 6); registrarNoMandato(v, `${anoDe(v.t)} · a obra grande saiu do papel`); return fim('A obra grande saiu do papel e terminou dentro do prazo: inauguração, fita, e gente usando no dia seguinte.', 'bom', true); }
      desgastar(p, 4, 'mandato');
      if (!m.crise) m.crise = { t: v.t, tipo: 'obra' };
      if (r.chance(0.15)) { desgastar(p, 5, 'escandalo'); v.fatos['vis_polemica'] = v.t; return fim('A obra atrasou, ganhou aditivo e foi parar no jornal como suspeita. O canteiro parado virou símbolo do mandato.', 'ruim', true); }
      return fim('A obra atrasou: o canteiro parado virou a crise do ano.', 'ruim');
    }
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** O executivo do cargo é Executivo? (para a tela e os testes). */
export const ehExecutivo = (c: CargoEletivo) => cargoNoPais(c).executivo;
