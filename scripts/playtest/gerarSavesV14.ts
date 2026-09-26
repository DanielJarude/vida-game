/**
 * Saves v14 REAIS, gerados com o motor da base do REWORK (955d5d4, FIX #4),
 * para a migração v14 → v15 ser testada com o que o jogo de fato produzia —
 * os casos do playtest humano que levaram ao rework:
 *
 *   - a nutricionista com mestrado e doutorado que só via diarista e doméstica
 *     (o doutorado sai "Doutorado", sem área, porque o motor antigo o gravava assim);
 *   - a cabo da PM com anos de estudo para concurso, na vida política, sem opção de filiar-se;
 *   - a adolescente do vôlei reprovada na seletiva pela técnica;
 *   - quem está no meio de um mestrado.
 *
 *   (na worktree da base)
 *   npx esbuild scripts/playtest/gerarSavesV14.ts --bundle --platform=node --outfile=/tmp/gs14.cjs && DIR=<fixtures> node /tmp/gs14.cjs
 */
import { writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { entrarNaPolitica } from '../../src/motor/sistemas/politica';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';

const DIR = process.env.DIR ?? 'src/motor/__tests__/fixtures';
const QUIETAS = ['ficar', 'recusar', 'nao', 'seguir', 'aguentar', 'depois', 'manter', 'renovar', 'assinar'];
function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) { const livres = v.momento.opcoes.filter(o => !o.bloqueio); const o = livres.find(x => QUIETAS.includes(x.id)) ?? livres[0]; v = executar(v, { tipo: 'decidir', opcaoId: o.id }).vida; }
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Caio', sobrenome: 'Prado', genero, municipioId, semente: s });
const r = criarRng(14);
const limpo = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.caminhos.pendente = undefined; x.corpo.saude = Math.max(75, x.corpo.saude); };
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${DIR}/${nome}`, JSON.stringify(v)); console.log(nome, 'versão', v.versao, 'idade', idade(v), v.trabalho.atual?.ocupacaoId ?? '—', v.educacao.concluidos.map(c => c.nome).join(', ')); };
const matricula = (x: Vida, cursoId: string, meses: number) => { x.educacao.matricula = { cursoId, instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: x.t - 12, mesesRestantes: meses, mensalidade: 0, desempenho: 70, trancado: false, municipioId: x.moradia.municipioId }; };

// 1. Nutricionista com mestrado e doutorado (concluídos pelo motor antigo), trabalhando de diarista.
{
  let v = viver(nasce(1401, 'feminino', 'belo-horizonte-mg'), 30);
  v = transacao(v, x => {
    limpo(x);
    x.educacao.concluidos = x.educacao.concluidos.filter(c => c.nivel === 'livre' || c.nivel === 'tecnico');
    x.educacao.concluidos.push({ cursoId: 'nutricao', nome: 'Nutrição', nivel: 'superior', area: 'nutricao', tFim: x.t - 96, instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial' });
    x.educacao.escolaridade = 'superior';
    matricula(x, 'mestrado', 1);
  }).vida;
  v = viver(v, 31); // o motor antigo conclui o mestrado: "Mestrado", área "qualquer"
  v = transacao(v, x => { matricula(x, 'doutorado', 1); }).vida;
  v = viver(v, 32);
  v = transacao(v, x => { if (!x.trabalho.atual) contratar(x, r, ocupacao('diarista'), 'curriculo'); }).vida;
  v = viver(v, 34);
  gravar('save-v14-doutora-nutricao.json', v);
}
// 2. Cabo da PM, anos de estudo para concurso, na política com bandeira de segurança.
{
  let v = viver(nasce(1402, 'feminino', 'salvador-ba'), 33);
  v = transacao(v, x => {
    limpo(x);
    const e = contratar(x, r, ocupacao('cabo_pm'), 'concurso');
    e.tInicio = x.t - 156; e.tPosto = x.t - 72;
    x.trabalho.experiencia['pm'] = 156;
    x.rotinas = x.rotinas.filter(y => y.id !== 'estudar_concurso');
    x.rotinas.push({ id: 'estudar_concurso', tInicio: x.t - 108, nivel: 2 });
    x.caminhos.concurso.meses = 108;
    const p = entrarNaPolitica(x, 'servidor', 1);
    p.prioridade = 'seguranca';
  }).vida;
  v = viver(v, 34);
  gravar('save-v14-cabo-pm-politica.json', v);
}
// 3. Adolescente de vôlei, reprovada na seletiva pela técnica.
{
  let v = viver(nasce(1403, 'feminino', 'belo-horizonte-mg'), 14);
  v = transacao(v, x => {
    x.rotinas = x.rotinas.filter(y => y.id !== 'volei');
    x.rotinas.push({ id: 'volei', tInicio: x.t - 48, nivel: 2 });
    x.caminhos.frentes.volei = { interesse: 85, meses: 60, habilidade: 58, tInicio: x.t - 48, tUltimo: x.t, retomadas: 0, auge: 58 };
    x.caminhos.devolutivas.push({ t: x.t - 6, tipo: 'peneira', titulo: 'A seletiva do Minas Tênis Clube', texto: 'O treinador gostou da sua calma, mas a técnica ainda não está no nível da equipe.', passou: false, falta: 'tecnica', dominio: 'volei' });
    x.fatos['peneiras_volei'] = 1;
    x.caminhos.ultimas['peneira_volei'] = x.t - 6;
  }).vida;
  v = viver(v, 15);
  gravar('save-v14-volei-seletiva.json', v);
}
// 4. No meio de um mestrado (depois de Psicologia).
{
  let v = viver(nasce(1404, 'masculino', 'recife-pe'), 26);
  v = transacao(v, x => {
    limpo(x);
    x.educacao.concluidos = x.educacao.concluidos.filter(c => c.nivel === 'livre' || c.nivel === 'tecnico');
    x.educacao.concluidos.push({ cursoId: 'psicologia', nome: 'Psicologia', nivel: 'superior', area: 'psicologia', tFim: x.t - 18, instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial' });
    x.educacao.escolaridade = 'superior';
    matricula(x, 'mestrado', 20);
  }).vida;
  v = viver(v, 27);
  gravar('save-v14-mestrando.json', v);
}
