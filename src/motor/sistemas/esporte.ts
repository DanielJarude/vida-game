/**
 * Esporte: do campinho ao contrato — e, quase sempre, de volta à vida comum.
 *
 *   jogar → treinar (escolinha, time) → destacar-se nos campeonatos → um
 *   treinador indica para a PENEIRA → passar (raro) → BASE (treino todo dia,
 *   escola à noite, às vezes longe de casa) → dispensa (o mais comum) ou
 *   CONTRATO profissional (raríssimo) → clubes, lesões, reserva, transferência
 *   → fim de carreira cedo → o próximo caminho.
 *
 * Nada disso é sorteio puro: a peneira aparece para quem pratica e se
 * destaca; passar depende da habilidade construída (facilidade × anos ×
 * intensidade × idade certa); o contrato depende de continuar evoluindo na
 * base. Tentar é bem mais comum que conseguir. Fracassar no sonho também é
 * biografia — e a escola, o trabalho e as outras frentes continuam lá.
 *
 * Futebol é o caminho mais fundo (contexto brasileiro); vôlei, natação,
 * atletismo e lutas usam a mesma estrutura, com seletivas e equipes.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CarreiraEsportiva, Dominio, Vida } from '../tipos';
import { escrever, idade, lembrarCom, marcarFato, pais, temFato } from '../nucleo';
import { municipio, MUNICIPIOS } from '../dados/lugares';
import { estruturaEsportiva } from '../dados/mercado';
import { ocupacao } from '../dados/ocupacoes';
import { habilidade, praticar } from './frentes';
import { marcar } from './marcas';
import { contratar, encerrarEmprego } from './trabalho';
import { capitalDoEstado } from './escola';
import { flex, ge } from '../texto';
import { novaOportunidade } from './oportunidades';
import { abalar } from './abalo';

export const MODALIDADES: Dominio[] = ['futebol', 'volei', 'natacao', 'atletismo', 'lutas'];

const NOME_MOD: Partial<Record<Dominio, string>> = { futebol: 'futebol', volei: 'vôlei', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta' };
const EQUIPE: Partial<Record<Dominio, string>> = { futebol: 'a base', volei: 'a equipe de base', natacao: 'a equipe de natação', atletismo: 'a equipe de atletismo', lutas: 'a equipe de competição' };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

/** Um clube plausível e fictício para uma cidade (sem marcas reais). */
export function nomeDeClube(municipioId: string, semente: string, d: Dominio = 'futebol'): string {
  const cidade = municipio(municipioId).nome;
  const h = hash(`${municipioId}:${semente}`);
  if (d !== 'futebol') return ['Clube', 'Associação Atlética', 'Sociedade Esportiva'][Math.floor(h * 3)] + ` ${cidade}`;
  return [`Esporte Clube ${cidade}`, `Atlético ${cidade}`, `${cidade} Futebol Clube`, `União ${cidade}`, `Sport ${cidade}`][Math.floor(h * 5)];
}

/** Onde fica a peneira: na própria cidade, se há estrutura; senão, na capital. */
function ondeTreina(v: Vida): string {
  const aqui = v.moradia.municipioId;
  return estruturaEsportiva(aqui) >= 1 ? aqui : capitalDoEstado(aqui);
}

/** A modalidade que a pessoa pratica com mais seriedade agora. */
export function modalidadePrincipal(v: Vida): { d: Dominio; nivel: number } | undefined {
  const lista = v.rotinas.filter(r => MODALIDADES.includes(r.id as Dominio)).map(r => ({ d: r.id as Dominio, nivel: r.nivel ?? 1 }));
  return lista.sort((a, b) => b.nivel - a.nivel || habilidade(v, b.d) - habilidade(v, a.d))[0];
}

const nivelPelaHabilidade = (h: number): 1 | 2 | 3 | 4 => (h < 74 ? 1 : h < 81 ? 2 : h < 88 ? 3 : 4);
const DIVISAO = ['', 'um time do campeonato estadual', 'um clube da Série C', 'um clube da Série B', 'um clube da Série A'];
const SALARIO_FUTEBOL = [0, 1800, 4800, 16000, 55000];
const SALARIO_OUTROS = [0, 1500, 3500, 8500, 22000];

/* ------------------------------------------------------------ O ano */

export function processarEsporte(v: Vida, r: Rng): void {
  const i = idade(v);
  const e = v.caminhos.esporte;
  const mod = modalidadePrincipal(v);

  // Campeonatos da infância e da adolescência: destaque é marca.
  if (mod && i >= 8 && i <= 18 && !e) {
    const h = habilidade(v, mod.d);
    if (mod.nivel >= 2 && h >= 50 && !temFato(v, `destaque_${mod.d}`) && r.chance(0.5)) {
      marcarFato(v, `destaque_${mod.d}`);
      const texto = mod.d === 'futebol' ? `Foi ${flex(ge(v), 'o artilheiro', 'a artilheira')} do campeonato ${i <= 12 ? 'da escolinha' : 'entre escolas da cidade'}.` : `Ganhou a primeira medalha de ${NOME_MOD[mod.d]} num torneio regional.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
      marcar(v, 'destaque', texto, 2, { dominio: mod.d });
    }
    // A peneira aparece para quem se destaca — raramente para quem só brinca.
    const ultimaPeneira = v.caminhos.ultimas[`peneira_${mod.d}`];
    const tentativas = v.fatos[`peneiras_${mod.d}`] ?? 0;
    const janela = mod.d === 'futebol' ? i >= 11 && i <= 17 : i >= 12 && i <= 18;
    if (janela && h >= 42 && tentativas < 3 && (ultimaPeneira === undefined || v.t - ultimaPeneira >= 24)) {
      const serio = mod.nivel >= 2 ? 1 : 0.35;
      const chance = clamp((h - 36) / 32, 0, 0.6) * serio * (0.6 + estruturaEsportiva(v.moradia.municipioId) * 0.15);
      if (r.chance(chance)) {
        const lugar = ondeTreina(v);
        const clube = nomeDeClube(lugar, `${v.id}:${i}`, mod.d);
        const longe = lugar !== v.moradia.municipioId;
        novaOportunidade(v, {
          tipo: mod.d === 'futebol' ? 'peneira' : 'seletiva', dominio: mod.d, municipioId: lugar, meses: 12, chave: `peneira_${mod.d}`,
          titulo: mod.d === 'futebol' ? `Peneira no ${clube}` : `Seletiva: ${clube}`,
          texto: `${mod.nivel >= 2 ? 'O treinador' : 'Um conhecido que entende de esporte'} viu você ${mod.d === 'futebol' ? 'jogar' : 'competir'} e indicou para ${mod.d === 'futebol' ? 'a peneira' : 'a seletiva'} do ${clube}${longe ? `, em ${municipio(lugar).nome}` : ''}. Centenas de garotos, poucas vagas.`
        });
      }
    }
  }

  if (!e) return;
  if (e.fase === 'base') anoNaBase(v, r, e);
  else if (e.fase === 'profissional') anoProfissional(v, r, e);
}

/** A peneira em si: resultado da habilidade construída — e um pouco do dia. */
export function fazerPeneira(v: Vida, r: Rng, d: Dominio, ajuste: number): boolean {
  const h = habilidade(v, d);
  v.fatos[`peneiras_${d}`] = (v.fatos[`peneiras_${d}`] ?? 0) + 1;
  const chance = clamp((h - 58) / 27 + ajuste, 0.02, 0.75);
  const passou = r.chance(chance);
  if (!passou) marcar(v, 'fracasso', `Não passou na ${d === 'futebol' ? 'peneira' : 'seletiva'} (${NOME_MOD[d]}).`, 2, { dominio: d });
  return passou;
}

export function entrarNaBase(v: Vida, d: Dominio, municipioId: string, clube: string): void {
  v.caminhos.esporte = { modalidade: d, fase: 'base', clube, nivel: 1, tInicio: v.t, tFase: v.t, lesoes: 0, municipioId };
  const rot = v.rotinas.find(x => x.id === d);
  if (rot) rot.nivel = 3; else v.rotinas.push({ id: d, tInicio: v.t, nivel: 3 });
  const longe = municipioId !== v.moradia.municipioId;
  const texto = `Entrou para ${EQUIPE[d]} do ${clube}${longe ? `, em ${municipio(municipioId).nome}: alojamento do clube durante a semana, casa nos domingos` : ''}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'lazer', tom: 'bom', escolha: true });
  marcar(v, 'ingresso', texto, 3, { dominio: d });
  for (const p of pais(v)) lembrarCom(v, p.id, `${d === 'futebol' ? 'A base' : 'A equipe'} do ${clube}.`, 'escola', 2);
}

function anoNaBase(v: Vida, r: Rng, e: CarreiraEsportiva): void {
  const i = idade(v);
  const h = habilidade(v, e.modalidade);
  const anos = (v.t - e.tFase) / 12;
  // Rotina dura: a escola sente, a família sente se é longe.
  if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - 5);
  if (e.municipioId !== v.moradia.municipioId) for (const p of pais(v)) { const vin = v.vinculos[p.id]; if (vin) vin.proximidade = clamp(vin.proximidade - 2); }
  // Lesão
  if (r.chance(0.06)) {
    e.lesoes += 1;
    const f = v.caminhos.frentes[e.modalidade];
    if (f) f.habilidade = clamp(f.habilidade - 6);
    escrever(v, { texto: 'Uma lesão tirou alguns meses de treino.', relevancia: 'cotidiano', tema: 'saude', tom: 'ruim' });
  }
  // Contrato profissional: só para quem segue evoluindo.
  const idadeContrato = e.modalidade === 'futebol' ? [17, 20] : [17, 22];
  const limiar = e.modalidade === 'futebol' ? 79 : 82;
  if (i >= idadeContrato[0] && i <= idadeContrato[1] && h >= limiar && r.chance(clamp((h - limiar + 2) / 16, 0.08, 0.6))) {
    const nivel = nivelPelaHabilidade(h);
    novaOportunidade(v, {
      tipo: 'convite', ocupacaoId: e.modalidade === 'futebol' ? 'jogador_futebol' : 'atleta', dominio: e.modalidade, meses: 12, chave: 'contrato_esporte',
      titulo: 'Contrato profissional',
      texto: e.modalidade === 'futebol' ? `O ${e.clube} ofereceu o primeiro contrato profissional${nivel >= 3 ? ' — e há sondagem de um clube maior' : ''}. Salário de verdade, prazo de dois anos.` : `A equipe ofereceu contrato de atleta profissional, com salário e calendário de competições.`,
      bonus: nivel
    });
    return;
  }
  // Dispensa: o destino da maioria.
  const risco = clamp(0.4 - (h - 72) / 40 + e.lesoes * 0.05 + (i > idadeContrato[1] ? 0.5 : 0), 0.1, 0.95);
  if (anos >= 1 && r.chance(risco)) encerrarCarreira(v, e, 'dispensa');
}

export function profissionalizar(v: Vida, r: Rng, nivel: number): void {
  const e = v.caminhos.esporte;
  if (!e) return;
  const oc = ocupacao(e.modalidade === 'futebol' ? 'jogador_futebol' : 'atleta');
  e.fase = 'profissional';
  e.tFase = v.t;
  e.nivel = Math.max(1, Math.min(4, nivel)) as 1 | 2 | 3 | 4;
  const emp = contratar(v, r, oc, 'oportunidade');
  emp.empregador = e.nivel >= 2 ? DIVISAO[e.nivel] : `o ${e.clube}`;
  emp.salario = (e.modalidade === 'futebol' ? SALARIO_FUTEBOL : SALARIO_OUTROS)[e.nivel];
  // O primeiro contrato é curto; o espaço no time depende do que se joga.
  e.contratoAte = v.t + 24;
  e.espaco = habilidade(v, e.modalidade) >= 72 + e.nivel * 2 ? 'titular' : 'reserva';
  const texto = e.modalidade === 'futebol' ? `Assinou o primeiro contrato profissional de jogador, aos ${idade(v)}.` : `Virou atleta profissional de ${NOME_MOD[e.modalidade]}, aos ${idade(v)}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'bom', escolha: true });
  marcar(v, 'profissional', texto, 3, { dominio: e.modalidade, ocupacaoId: oc.id });
  marcarFato(v, 'atleta_profissional');
}

function anoProfissional(v: Vida, r: Rng, e: CarreiraEsportiva): void {
  const i = idade(v);
  const emp = v.trabalho.atual;
  const f = v.caminhos.frentes[e.modalidade];
  // Suspenso pelo antidoping: parado, sem contrato, até a pena acabar.
  if (e.suspensoAte !== undefined) {
    if (v.t < e.suspensoAte) return;
    e.suspensoAte = undefined;
    const h = habilidade(v, e.modalidade);
    if (i <= 31 && h >= 66) {
      novaOportunidade(v, { tipo: 'convite', ocupacaoId: e.modalidade === 'futebol' ? 'jogador_futebol' : 'atleta', dominio: e.modalidade, meses: 12, chave: 'volta_suspensao', titulo: 'Voltar a jogar', texto: 'Acabou a suspensão. Um clube pequeno topa dar uma chance — salário baixo, olhar desconfiado.', bonus: 1 });
      escrever(v, { texto: 'A suspensão acabou. O nome ficou marcado, mas um clube pequeno ligou.', relevancia: 'biografia', tema: 'trabalho' });
    } else encerrarCarreira(v, e, 'suspensao');
    return;
  }
  if (!emp || !['jogador_futebol', 'atleta'].includes(emp.ocupacaoId)) { e.fase = 'encerrada'; e.tFim = v.t; e.motivoFim = e.motivoFim ?? 'escolha'; return; }
  const tabela = e.modalidade === 'futebol' ? SALARIO_FUTEBOL : SALARIO_OUTROS;
  const forcar = e.foco === 'forcar';
  const preservar = e.foco === 'preservar';
  // O jeito de treinar: forçar evolui (e machuca); preservar segura o corpo (e a evolução).
  if (f) {
    // Forçar rende enquanto o corpo é novo; depois dos 29, gasta. Preservar segura o declínio.
    if (forcar) f.habilidade = clamp(f.habilidade + (i < 29 ? 1.2 : -0.8));
    if (preservar && i >= 29) f.habilidade = clamp(f.habilidade + 0.4);
    // O que não aparece no exame (até aparecer): rende em campo, cobra do corpo.
    if (e.doping) { f.habilidade = clamp(f.habilidade + 2); v.corpo.saude = clamp(v.corpo.saude - 2.5); }
  }
  if (e.doping && r.chance(0.24)) { flagrado(v, e); return; }
  // Lesões ficam mais prováveis com a idade — e com o treino forçado.
  const lesao = (0.07 + Math.max(0, i - 26) * 0.012) * (forcar ? 1.6 : preservar ? 0.6 : 1) * (e.doping ? 1.3 : 1);
  if (r.chance(lesao)) {
    e.lesoes += 1;
    const grave = r.chance(forcar ? 0.28 : 0.2);
    if (f) f.habilidade = clamp(f.habilidade - (grave ? 10 : 4));
    escrever(v, { texto: grave ? 'Rompeu o ligamento do joelho: cirurgia e quase um ano fora.' : 'Uma lesão muscular tirou algumas semanas de jogo.', relevancia: grave ? 'biografia' : 'cotidiano', tema: 'saude', tom: 'ruim' });
    if (grave) { e.espaco = 'reserva'; v.corpo.saude = clamp(v.corpo.saude - 6); }
    if (grave && e.lesoes >= 3 && i >= 27 && r.chance(0.5)) { encerrarCarreira(v, e, 'lesao'); return; }
  }
  const h = habilidade(v, e.modalidade);
  // Clube sobe e desce com o jogo.
  const alvo = nivelPelaHabilidade(h);
  if (alvo > e.nivel && r.chance(0.35)) {
    e.nivel = (e.nivel + 1) as 1 | 2 | 3 | 4;
    emp.empregador = DIVISAO[e.nivel];
    emp.salario = tabela[e.nivel];
    e.contratoAte = v.t + 36;
    e.espaco = 'reserva';
    const texto = `Foi negociado com ${DIVISAO[e.nivel]}.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
    marcar(v, 'promocao', texto, e.nivel >= 3 ? 3 : 2, { dominio: e.modalidade });
  } else if (alvo < e.nivel && r.chance(0.4)) {
    e.nivel = (e.nivel - 1) as 1 | 2 | 3 | 4;
    emp.empregador = DIVISAO[e.nivel];
    emp.salario = tabela[e.nivel];
    e.contratoAte = v.t + 24;
    escrever(v, { texto: `Sem espaço no time, foi para ${DIVISAO[e.nivel]}.`, relevancia: 'cotidiano', tema: 'trabalho' });
  }
  // Titular ou banco: o que se joga, a conversa com o treinador, o nível do clube.
  const conversa = v.fatos['esp_treinador_ok'] !== undefined && v.t - v.fatos['esp_treinador_ok'] <= 12 ? 3 : 0;
  const antes = e.espaco;
  e.espaco = h + conversa >= 72 + e.nivel * 2 ? 'titular' : 'reserva';
  if (antes === 'titular' && e.espaco === 'reserva') { escrever(v, { texto: 'Perdeu a posição: a temporada foi mais de banco do que de campo.', relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim' }); abalar(v, 'perder a posição no time', -4, 3); }
  else if (antes === 'reserva' && e.espaco === 'titular') escrever(v, { texto: 'Ganhou a posição: titular a temporada inteira.', relevancia: 'biografia', tema: 'trabalho', tom: 'bom' });
  // O contrato vence: renovar é conversa (`esp_renovacao`).
  e.contratoAte ??= v.t + 24;
  if (v.t >= e.contratoAte) v.fatos['esp_renovacao'] = v.t;
  // O corpo encerra a carreira cedo (quem se preservou, dura um pouco mais).
  const limite = (e.modalidade === 'futebol' ? 33 : 31) + (preservar ? 2 : 0) - (forcar ? 1 : 0) - (e.lesoes >= 4 ? 1 : 0);
  if (i >= limite && r.chance(0.2 + (i - limite) * 0.15)) { encerrarCarreira(v, e, 'idade'); return; }
}

/** O exame pegou: suspensão, contrato rescindido, o nome nos jornais. */
function flagrado(v: Vida, e: CarreiraEsportiva): void {
  e.doping = undefined;
  e.suspensoAte = v.t + 24;
  e.espaco = undefined;
  if (v.trabalho.atual && ['jogador_futebol', 'atleta'].includes(v.trabalho.atual.ocupacaoId)) encerrarEmprego(v, 'suspensão por doping');
  const texto = `O controle antidoping deu positivo. Dois anos de suspensão, contrato rescindido, o nome no noticiário esportivo.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
  marcar(v, 'fracasso', 'Suspenso por doping.', 3, { dominio: e.modalidade });
  marcarFato(v, 'suspenso_doping');
  abalar(v, 'a suspensão por doping', -14, 14);
  for (const p of pais(v)) { const vin = v.vinculos[p.id]; if (vin) vin.confianca = clamp(vin.confianca - 8); }
}

export function encerrarCarreira(v: Vida, e: CarreiraEsportiva, motivo: NonNullable<CarreiraEsportiva['motivoFim']>): void {
  const i = idade(v);
  const eraPro = e.fase === 'profissional';
  e.fase = 'encerrada';
  e.tFim = v.t;
  e.motivoFim = motivo;
  const rot = v.rotinas.find(x => x.id === e.modalidade);
  if (rot) rot.nivel = 1;
  if (eraPro && v.trabalho.atual && ['jogador_futebol', 'atleta'].includes(v.trabalho.atual.ocupacaoId)) encerrarEmprego(v, 'fim da carreira esportiva');
  const g = ge(v);
  const texto = !eraPro
    ? motivo === 'dispensa' ? `${flex(g, 'Dispensado', 'Dispensada')} ${e.modalidade === 'futebol' ? 'da base' : 'da equipe'} do ${e.clube}, aos ${i}. O sonho de viver do ${NOME_MOD[e.modalidade]} ficou para trás.` : `Deixou ${EQUIPE[e.modalidade]} do ${e.clube}, aos ${i}.`
    : motivo === 'lesao' ? `Encerrou a carreira aos ${i}, depois de lesões demais.` : motivo === 'sem_contrato' ? `Aos ${i}, nenhum clube renovou: a carreira de ${flex(g, 'atleta', 'atleta')} acabou sem despedida.` : `Pendurou as chuteiras aos ${i}.`.replace('as chuteiras', e.modalidade === 'futebol' ? 'as chuteiras' : 'a carreira');
  escrever(v, { texto, relevancia: 'marco', tema: eraPro ? 'trabalho' : 'lazer', tom: 'ruim' });
  marcar(v, eraPro ? 'fim_carreira' : 'fracasso', texto, 3, { dominio: e.modalidade });
  marcarFato(v, eraPro ? 'fim_carreira_esportiva' : 'dispensado_base');
  // Quem se preparou ainda jogando tem para onde ir: a comissão técnica, a escolinha.
  if (eraPro && temFato(v, 'pos_treinador')) {
    const oc = i >= 28 ? 'auxiliar_tecnico' : 'treinador_escolinha';
    novaOportunidade(v, { tipo: 'convite', ocupacaoId: oc, dominio: e.modalidade, meses: 24, chave: 'pos_treinador', titulo: 'Do campo para o banco', texto: oc === 'auxiliar_tecnico' ? 'O treinador que você conheceu no clube montou uma comissão técnica e lembrou de quem tirou os cursos ainda jogando.' : 'Uma escolinha do bairro precisa de alguém que saiba ensinar e que já tenha jogado de verdade.' });
  }
  abalar(v, eraPro ? 'o fim da carreira no esporte' : `a dispensa ${e.modalidade === 'futebol' ? 'da base' : 'da equipe'}`, -(eraPro ? 8 : 10), 6);
}

/** Continua praticando o esporte como profissional (o treino do clube). */
export function treinoProfissional(v: Vida, r: Rng): void {
  const e = v.caminhos.esporte;
  if (e?.fase !== 'profissional') return;
  if (!v.rotinas.some(x => x.id === e.modalidade)) praticar(v, r, e.modalidade, 1.6, 1.45);
}

export { NOME_MOD, MUNICIPIOS };
