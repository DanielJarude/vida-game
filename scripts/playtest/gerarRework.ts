/**
 * Saves de cenários para o playtest visual do rework (`rework.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarRework.ts --bundle --platform=node --outfile=/tmp/gr.cjs && SP=/tmp/vida-rework node /tmp/gr.cjs
 *
 * Cada save é uma vida vivida pelo motor até a idade do cenário e depois
 * levada ao estado que se quer fotografar pelos sistemas do próprio motor
 * (contratar, abrir negócio, contratar gente, profissionalizar, entrar na
 * política, registrar candidatura, tomar posse vivendo o ano).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { curso } from '../../src/motor/dados/cursos';
import { criarRng } from '../../src/motor/rng';
import { abrirNegocio, contratarFuncionario } from '../../src/motor/sistemas/negocio';
import { entrarNaBase, profissionalizar } from '../../src/motor/sistemas/esporte';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { iniciarRural } from '../../src/motor/sistemas/rural';
import { entrarNaPolitica, eleicaoNaJanela } from '../../src/motor/sistemas/politica';
import { novaOportunidade } from '../../src/motor/sistemas/oportunidades';

const SP = process.env.SP ?? '/tmp/vida-rework';
mkdirSync(SP, { recursive: true });

const QUIETAS = ['ficar', 'recusar', 'nao', 'seguir', 'aguentar', 'depois', 'manter', 'renovar', 'assinar', 'voltar'];
function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) { const l = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: (l.find(o => QUIETAS.includes(o.id)) ?? l[0]).id }).vida; }
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Davi', sobrenome: 'Araújo', genero, municipioId, semente: s });
const ate = (s: number, i: number, genero: 'masculino' | 'feminino', municipioId: string) => { let k = s; let v = viver(nasce(k, genero, municipioId), i); while (v.morte) v = viver(nasce(++k, genero, municipioId), i); return v; };
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${SP}/save-${nome}.json`, JSON.stringify(v)); console.log(nome.padEnd(14), idade(v), v.trabalho.atual?.ocupacaoId ?? '—', v.caminhos.politica?.fase ?? ''); };
const limpar = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.caminhos.politica = undefined; x.corpo.saude = Math.max(72, x.corpo.saude); };
const formar = (x: Vida, id: string) => { const c = curso(id); x.educacao.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: x.t - 24, instituicao: 'o instituto federal' }); if (c.nivel === 'superior') x.educacao.escolaridade = 'superior'; };
const r = criarRng(9);

gravar('empregada', transacao(ate(111, 31, 'feminino', 'recife-pe'), x => { limpar(x); x.educacao.escolaridade = 'medio'; x.trabalho.experiencia['comercio'] = 60; const e = contratar(x, r, ocupacao('vendedor')); e.tInicio = x.t - 50; e.tPosto = x.t - 50; e.clima = 34; novaOportunidade(x, { tipo: 'indicacao', ocupacaoId: 'supervisor_loja', meses: 12, chave: 'teste', titulo: 'Uma indicação', texto: 'Uma ex-colega indicou você para supervisora numa loja do centro.', bonus: 0.2 }); }).vida);
gravar('professora', transacao(ate(222, 38, 'feminino', 'curitiba-pr'), x => { limpar(x); formar(x, 'pedagogia'); const e = contratar(x, r, ocupacao('professor_concursado'), 'concurso'); e.tInicio = x.t - 96; e.ritmo = 'puxado'; e.anosPuxado = 2; e.salario = Math.round(e.salario * 1.25); }).vida);
{
  let v = transacao(ate(333, 36, 'feminino', 'salvador-ba'), x => { limpar(x); x.trabalho.experiencia['alimentacao'] = 60; x.financas.conta = 60000; abrirNegocio(x, r, 'lanchonete', { modo: 'guardado' }); }).vida;
  v = viver(v, 39);
  v = transacao(v, x => { const n = x.caminhos.negocio; if (n && n.estado !== 'fechado' && x.trabalho.atual?.ocupacaoId === n.ocupacaoId) { contratarFuncionario(x, r, 'indicacao'); contratarFuncionario(x, r, 'jovem'); n.clientela = 68; x.trabalho.atual!.clientela = 68; n.caixa = 14000; n.reputacao = 58; n.resultadoAno = 9200; } }).vida;
  gravar('negocio', v);
}
gravar('autonomo', transacao(ate(444, 33, 'masculino', 'belo-horizonte-mg'), x => { limpar(x); x.trabalho.experiencia['eletrica'] = 80; const e = contratar(x, r, ocupacao('eletricista')); e.clientela = 66; e.mei = true; }).vida);
gravar('informal', transacao(ate(555, 41, 'feminino', 'fortaleza-ce'), x => { limpar(x); const e = contratar(x, r, ocupacao('feirante')); e.clientela = 24; }).vida);
gravar('rural', transacao(ate(666, 45, 'masculino', 'chapeco-sc'), x => { limpar(x); garantirFrente(x, 'campo'); x.caminhos.frentes.campo!.habilidade = 70; const e = contratar(x, r, ocupacao('produtor_rural'), 'oportunidade'); iniciarRural(x, 'arrendada'); e.clientela = 44; x.caminhos.rural!.ultimaSafra = 'ruim'; x.caminhos.rural!.anosRuins = 1; }).vida);
gravar('atleta', transacao(ate(777, 22, 'masculino', 'porto-alegre-rs'), x => { limpar(x); garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = 78; f.interesse = 90; f.meses = 140; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'União Porto Alegre'); profissionalizar(x, r, 2); x.caminhos.esporte!.espaco = 'reserva'; x.caminhos.esporte!.lesoes = 1; }).vida);
{
  let v = transacao(ate(888, 20, 'feminino', 'natal-rn'), x => { limpar(x); x.educacao.escolaridade = 'medio'; x.corpo.forma = 75; contratar(x, r, ocupacao('aluno_sargento'), 'concurso'); x.caminhos.militar!.forca = 'aeronautica'; x.trabalho.atual!.empregador = 'a Aeronáutica'; }).vida;
  gravar('militar', viver(v, 28));
}
{
  let v = transacao(ate(999, 42, 'feminino', 'goiania-go'), x => { limpar(x); formar(x, 'enfermagem'); const e = contratar(x, r, ocupacao('agente_saude'), 'concurso'); e.tInicio = x.t - 72; x.rotinas.push({ id: 'voluntariado', tInicio: x.t - 60, nivel: 2 }); const p = entrarNaPolitica(x, 'comunidade', 1.2); p.partido = 'Frente Jequitibá'; p.tFiliacao = x.t - 30; p.fase = 'filiado'; p.apoio = 70; p.reputacao = 55; p.prioridade = 'saude'; }).vida;
  for (let k = 0; k < 8 && eleicaoNaJanela(v)?.tipo !== 'municipal'; k++) v = viver(v, idade(v) + 1);
  v = executar(v, { tipo: 'politica', oque: 'candidatura' }).vida;
  for (const o of ['cargo_vereador', 'fin_pequenas', 'rua_porta', 'tom_propostas']) v = executar(v, { tipo: 'decidir', opcaoId: o }).vida;
  gravar('candidata', v);
  v = transacao(v, x => { const p = x.caminhos.politica!; p.apoio = 92; p.campanha!.nota = 30; }).vida;
  v = viver(v, idade(v) + 2);
  v = transacao(v, x => { const m = x.caminhos.politica?.mandato; if (m) m.crise = { t: x.t, tipo: 'votacao' }; }).vida;
  gravar('vereadora', v);
}
gravar('procurando', transacao(ate(1111, 29, 'masculino', 'manaus-am'), x => { limpar(x); x.educacao.escolaridade = 'medio'; x.trabalho.experiencia['logistica'] = 36; x.trabalho.desempregadoDesde = x.t - 30; x.trabalho.historico.push({ ocupacaoId: 'estoquista', empregador: 'um atacadista', contrato: 'clt', salario: 2100, tInicio: x.t - 70, tPosto: x.t - 70, desempenho: 55, municipioId: x.moradia.municipioId, carga: 'integral', tFim: x.t - 30, motivo: 'demissão' }); }).vida);
gravar('crianca', viver(nasce(1212, 'feminino', 'sao-paulo-sp'), 9));
gravar('adolescente', viver(nasce(1313, 'masculino', 'belem-pa'), 16));
gravar('preso', transacao(ate(1414, 31, 'masculino', 'rio-de-janeiro-rj'), x => { limpar(x); x.justica = { antecedentes: [{ t: x.t, categoria: 'mercado', desfecho: 'prisao', anos: 4 }], prisao: { tInicio: x.t, tFim: x.t + 36, regime: 'fechado' } }; }).vida);
gravar('aposentada', transacao(ate(1515, 68, 'feminino', 'porto-alegre-rs'), x => { limpar(x); x.trabalho.aposentadoria = { t: x.t - 36, beneficio: 3200 }; }).vida);
