/**
 * Saves dos cenários do REWORK Caminhos, Agência e UX para o playtest visual (`rework2.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarRework2.ts --bundle --platform=node --outfile=/tmp/gr2.cjs && SP=/tmp/vida-rework2 node /tmp/gr2.cjs
 *
 * Os casos do playtest humano, levados ao estado pelo motor (a vida vivida
 * até ali; o cenário ajusta só a premissa — o emprego, a formação, o treino).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { curso } from '../../src/motor/dados/cursos';
import { areaDaPos, nomeDaFormacao } from '../../src/motor/sistemas/escola';
import { entrarNaPolitica } from '../../src/motor/sistemas/politica';
import { abrirNegocio } from '../../src/motor/sistemas/negocio';

const SP = process.env.SP ?? '/tmp/vida-rework2';
mkdirSync(SP, { recursive: true });
const QUIETAS = ['ficar', 'recusar', 'nao', 'seguir', 'aguentar', 'depois', 'manter', 'renovar', 'assinar', 'voltar'];
function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) { const l = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: (l.find(o => QUIETAS.includes(o.id)) ?? l[0]).id }).vida; }
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Caio', sobrenome: 'Prado', genero, municipioId, semente: s });
const ate = (s: number, i: number, genero: 'masculino' | 'feminino', municipioId: string) => { let k = s; let v = viver(nasce(k, genero, municipioId), i); while (v.morte) v = viver(nasce(++k, genero, municipioId), i); return v; };
const gravar = (nome: string, v: Vida, manterMomento = false) => { if (!manterMomento) v.momento = null; writeFileSync(`${SP}/save-${nome}.json`, JSON.stringify(v)); console.log(nome.padEnd(18), idade(v), v.momento?.situacaoId ?? '', v.trabalho.atual?.ocupacaoId ?? '—'); };
const limpar = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.caminhos.politica = undefined; x.caminhos.pendente = undefined; x.caminhos.esporte = undefined; x.corpo.saude = Math.max(72, x.corpo.saude); };
const r = criarRng(55);
function formar(x: Vida, area: string, ...niveis: ('superior' | 'mestrado' | 'doutorado')[]) {
  x.educacao.concluidos = x.educacao.concluidos.filter(c => c.nivel === 'livre' || c.nivel === 'tecnico');
  let t = x.t - 12 * 3 * niveis.length;
  for (const n of niveis) { const c = n === 'superior' ? curso(area) : curso(n); const a = n === 'superior' ? c.area : areaDaPos(x, c) ?? c.area; x.educacao.concluidos.push({ cursoId: c.id, nome: nomeDaFormacao(c, a), nivel: c.nivel, area: a, tFim: t, instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial' }); t += 36; }
  x.educacao.escolaridade = niveis[niveis.length - 1];
}
const emprego = (x: Vida, id: string, anos: number, noPosto = anos) => { const oc = ocupacao(id); const e = contratar(x, r, oc, 'concurso'); e.tInicio = x.t - anos * 12; e.tPosto = x.t - noPosto * 12; x.trabalho.experiencia[oc.trilha] = anos * 12; return e; };
const treino = (x: Vida, d: 'volei' | 'futebol' | 'musica', h: number, nivel: 1 | 2 | 3) => { x.rotinas = x.rotinas.filter(y => y.id !== d); x.rotinas.push({ id: d, tInicio: x.t - 60, nivel }); x.caminhos.frentes[d] = { interesse: 85, meses: 70, habilidade: h, tInicio: x.t - 60, tUltimo: x.t, retomadas: 0, auge: h }; };

// Cabo da PM, estudando para concurso (área policial), na política com bandeira de segurança, sem partido.
gravar('cabo-pm', transacao(ate(2001, 34, 'feminino', 'salvador-ba'), x => {
  limpar(x); emprego(x, 'cabo_pm', 13, 6);
  x.rotinas = x.rotinas.filter(y => y.id !== 'estudar_concurso'); x.rotinas.push({ id: 'estudar_concurso', tInicio: x.t - 96, nivel: 2 });
  x.caminhos.concurso.meses = 96; x.caminhos.concurso.foco = 'policial'; x.caminhos.concurso.mesesFoco = 36;
  const p = entrarNaPolitica(x, 'servidor', 1); p.prioridade = 'seguranca';
}).vida);
// Doutora em Nutrição procurando trabalho.
gravar('doutora', transacao(ate(2002, 36, 'feminino', 'belo-horizonte-mg'), x => { limpar(x); formar(x, 'nutricao', 'superior', 'mestrado', 'doutorado'); x.trabalho.desempregadoDesde = x.t - 8; }).vida);
// Doutora em Nutrição trabalhando de diarista (o caso do playtest).
gravar('doutora-diarista', transacao(ate(2003, 38, 'feminino', 'belo-horizonte-mg'), x => { limpar(x); formar(x, 'nutricao', 'superior', 'mestrado', 'doutorado'); emprego(x, 'diarista', 3); x.trabalho.atual!.clientela = 40; }).vida);
// Adolescente do vôlei: treina a sério, já foi reprovada numa seletiva pela técnica.
gravar('volei', transacao(ate(2004, 14, 'feminino', 'belo-horizonte-mg'), x => {
  treino(x, 'volei', 63, 2); x.caminhos.oportunidades = [];
  x.caminhos.devolutivas.push({ t: x.t - 14, tipo: 'peneira', titulo: 'A seletiva do Minas Tênis Clube', texto: 'O treinador gostou da sua calma, mas a técnica ainda não está no nível da equipe. A técnica está "de escolinha".', passou: false, falta: 'tecnica', dominio: 'volei', nivel: 1 });
  x.fatos['peneiras_volei'] = 1; x.caminhos.ultimas['peneira_volei'] = x.t - 14; x.fatos['tec_volei_antes'] = 59; x.fatos['tec_volei'] = 63;
}).vida);
// A peneira em andamento (decisão aberta, primeira etapa), pedida pelo jogador.
{
  let v = transacao(ate(2005, 15, 'masculino', 'recife-pe'), x => { treino(x, 'futebol', 66, 3); x.caminhos.oportunidades = []; x.caminhos.esporte = undefined; }).vida;
  v = executar(v, { tipo: 'perseguir', oque: 'pedir_teste', valor: 'futebol' } as never).vida;
  gravar('peneira', v, true);
}
// Concurseira: três anos de estudo dirigido (prefeitura e tribunais), trabalhando no comércio.
gravar('concurseira', transacao(ate(2006, 27, 'feminino', 'fortaleza-ce'), x => {
  limpar(x); formar(x, 'direito', 'superior'); emprego(x, 'vendedor', 4);
  x.rotinas = x.rotinas.filter(y => y.id !== 'estudar_concurso'); x.rotinas.push({ id: 'estudar_concurso', tInicio: x.t - 36, nivel: 2 });
  x.caminhos.concurso.meses = 40; x.caminhos.concurso.foco = 'administrativo'; x.caminhos.concurso.mesesFoco = 30;
  x.caminhos.devolutivas.push({ t: x.t - 12, tipo: 'concurso', titulo: 'Concurso para técnico administrativo', texto: 'Faltou preparo (em construção).', passou: false, falta: 'preparo', ocupacaoId: 'tecnico_publico', nivel: 2 });
}).vida);
// Músico de 19 anos, toca firme, sem banda.
gravar('musico', transacao(ate(2007, 19, 'masculino', 'porto-alegre-rs'), x => { limpar(x); x.educacao.escolaridade = 'medio'; treino(x, 'musica', 58, 3); emprego(x, 'atendente', 1); }).vida);
// Confeiteira que sabe cozinhar, procurando: vaga de confeitaria × por conta × negócio.
gravar('confeiteira', transacao(ate(2008, 25, 'feminino', 'curitiba-pr'), x => { limpar(x); x.educacao.escolaridade = 'medio'; x.caminhos.frentes.cozinha = { interesse: 80, meses: 80, habilidade: 58, tInicio: x.t - 80, tUltimo: x.t, retomadas: 0, auge: 58 }; x.trabalho.experiencia['alimentacao'] = 24; x.trabalho.desempregadoDesde = x.t - 3; }).vida);
// Dona de negócio (lanchonete), sem outro trabalho.
gravar('dona', transacao(ate(2009, 40, 'feminino', 'goiania-go'), x => { limpar(x); x.trabalho.experiencia['alimentacao'] = 96; x.financas.conta = Math.max(x.financas.conta, 80000); abrirNegocio(x, r, 'lanchonete', { modo: 'guardado' }); x.caminhos.negocio!.clientela = 55; }).vida);
// Vestibulanda: terminou o médio, nota do ENEM.
gravar('vestibulanda', transacao(ate(2010, 18, 'feminino', 'recife-pe'), x => { limpar(x); x.educacao.escolaridade = 'medio'; x.educacao.enem = [{ t: x.t - 14, nota: 610 }, { t: x.t - 2, nota: 668 }]; x.rotinas = x.rotinas.filter(y => y.id !== 'cursinho'); x.rotinas.push({ id: 'cursinho', tInicio: x.t - 10, nivel: 1 }); }).vida);
// No meio do mestrado (depois de Psicologia).
gravar('mestrando', transacao(ate(2011, 27, 'masculino', 'recife-pe'), x => { limpar(x); formar(x, 'psicologia', 'superior'); x.educacao.matricula = { cursoId: 'mestrado', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: x.t - 6, mesesRestantes: 18, mensalidade: 0, desempenho: 70, trancado: false, municipioId: x.moradia.municipioId, area: 'psicologia' }; }).vida);
// A entrevista aberta (vaga de nutricionista especialista, para a doutora).
{
  let v = transacao(ate(2012, 35, 'feminino', 'belo-horizonte-mg'), x => { limpar(x); formar(x, 'nutricao', 'superior', 'mestrado', 'doutorado'); }).vida;
  v = executar(v, { tipo: 'candidatar', ocupacaoId: 'nutricionista_especialista' }).vida;
  gravar('entrevista', v, true);
}
// Sargento do Exército: o próximo posto pede curso e tempo.
gravar('sargento', transacao(ate(2013, 30, 'masculino', 'campinas-sp'), x => {
  limpar(x); x.educacao.escolaridade = 'medio';
  x.caminhos.militar = { forca: 'exercito', quadro: 'praca', tIngresso: x.t - 96, guarnicao: x.moradia.municipioId, tGuarnicao: x.t - 36, transferencias: 1, cursos: [], especialidade: 'combatente' } as never;
  const e = contratar(x, r, ocupacao('sargento'), 'concurso'); e.tInicio = x.t - 96; e.tPosto = x.t - 72; x.trabalho.experiencia['exercito_sargento'] = 96;
}).vida);
