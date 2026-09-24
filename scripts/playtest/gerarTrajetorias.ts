/**
 * Saves de cenários para o playtest visual dos Caminhos de Vida (`trajetorias.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarTrajetorias.ts --bundle --platform=node --outfile=/tmp/gt.cjs && SP=/tmp/vida-traj node /tmp/gt.cjs
 *
 * Cada save é uma vida vivida pelo motor até a idade do cenário e depois
 * levada ao estado que se quer fotografar — pelos comandos e sistemas do
 * próprio motor sempre que possível (contratar, abrir negócio, formalizar,
 * pausar para cuidar, entrar num esquema, processo e sentença).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao, vinculosVivos } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { curso } from '../../src/motor/dados/cursos';
import { criarRng } from '../../src/motor/rng';
import { entrarNaBase } from '../../src/motor/sistemas/esporte';
import { criarProjeto } from '../../src/motor/sistemas/arte';
import { iniciarRural } from '../../src/motor/sistemas/rural';
import { iniciarPausa } from '../../src/motor/sistemas/pausa';
import { entrar } from '../../src/motor/sistemas/ilicito';
import { garantirFrente } from '../../src/motor/sistemas/frentes';
import { novaOportunidade } from '../../src/motor/sistemas/oportunidades';

const SP = process.env.SP ?? '/tmp/vida-traj';
mkdirSync(SP, { recursive: true });

function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida;
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Davi', sobrenome: 'Araújo', genero, municipioId, semente: s });
const ate = (s: number, i: number, genero: 'masculino' | 'feminino', municipioId: string) => { let k = s; let v = viver(nasce(k, genero, municipioId), i); while (v.morte) v = viver(nasce(++k, genero, municipioId), i); return v; };
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${SP}/save-${nome}.json`, JSON.stringify(v)); console.log(nome, idade(v), v.trabalho.atual?.ocupacaoId ?? '—', v.moradia.tipo); };
const limpar = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.corpo.saude = Math.max(70, x.corpo.saude); };
const formar = (x: Vida, id: string) => { const c = curso(id); x.educacao.concluidos.push({ cursoId: c.id, nome: c.nome, nivel: c.nivel, area: c.area, tFim: x.t - 24, instituicao: 'o instituto federal' }); if (c.nivel === 'superior') x.educacao.escolaridade = 'superior'; else if (x.educacao.escolaridade === 'medio') x.educacao.escolaridade = 'tecnico'; };
const r = criarRng(7);

// 1. Técnico → ofício → por conta.
gravar('tecnico', transacao(ate(101, 27, 'masculino', 'curitiba-pr'), x => { limpar(x); x.educacao.escolaridade = 'medio'; formar(x, 'tec_eletrotecnica'); x.trabalho.experiencia['eletrica'] = 48; const e = contratar(x, r, ocupacao('eletricista'), 'por_conta'); e.clientela = 48; e.mei = true; }).vida);

// 2. Militar de carreira, na Aeronáutica, depois da formação (o motor conclui a formação e a primeira guarnição).
{
  let v = transacao(ate(202, 20, 'feminino', 'belem-pa'), x => { limpar(x); x.educacao.escolaridade = 'medio'; x.corpo.forma = 75; contratar(x, r, ocupacao('aluno_sargento'), 'concurso'); x.caminhos.militar!.forca = 'aeronautica'; x.trabalho.atual!.empregador = 'a Aeronáutica'; }).vida;
  v = viver(v, 27);
  gravar('militar', v);
}

// 3. Artista com trabalho paralelo e banda.
gravar('artista', transacao(ate(303, 28, 'feminino', 'salvador-ba'), x => { limpar(x); garantirFrente(x, 'musica'); const f = x.caminhos.frentes.musica!; f.habilidade = 72; f.interesse = 85; f.meses = 180; f.auge = 72; x.rotinas = x.rotinas.filter(q => q.id !== 'musica'); x.rotinas.push({ id: 'musica', tInicio: x.t - 120, nivel: 2 }); contratar(x, r, ocupacao('atendente')); const p = criarProjeto(x, r, 'musica'); p.publico = 38; }).vida);

// 4. Atleta na base, aos 17.
gravar('atleta', transacao(ate(404, 16, 'masculino', 'sao-paulo-sp'), x => { limpar(x); garantirFrente(x, 'futebol'); const f = x.caminhos.frentes.futebol!; f.habilidade = 76; f.interesse = 90; f.meses = 120; f.auge = 76; entrarNaBase(x, 'futebol', x.moradia.municipioId, 'Esporte Clube São Paulo'); x.t += 12; }).vida);

// 5. Servidor: professora da rede, com mestrado, anos de casa.
gravar('servidor', transacao(ate(505, 44, 'feminino', 'fortaleza-ce'), x => { limpar(x); formar(x, 'licenciatura'); formar(x, 'mestrado'); const e = contratar(x, r, ocupacao('professor_concursado'), 'concurso'); e.tInicio = x.t - 12 * 14; x.trabalho.experiencia['educacao'] = 12 * 16; }).vida);

// 6. Autônomo: fotógrafo com freguesia.
gravar('autonomo', transacao(ate(606, 33, 'masculino', 'belo-horizonte-mg'), x => { limpar(x); garantirFrente(x, 'fotografia'); const f = x.caminhos.frentes.fotografia!; f.habilidade = 70; f.interesse = 80; f.meses = 100; f.auge = 70; x.trabalho.experiencia['imagem'] = 60; const e = contratar(x, r, ocupacao('fotografo'), 'por_conta'); e.clientela = 55; }).vida);

// 7. Informal: feirante sem registro (o MEI aparece como porta).
gravar('informal', transacao(ate(707, 35, 'feminino', 'recife-pe'), x => { limpar(x); x.trabalho.experiencia['informal'] = 96; const e = contratar(x, r, ocupacao('feirante'), 'por_conta'); e.clientela = 42; e.tInicio = x.t - 60; }).vida);

// 8. Empreendedora: uma lanchonete aberta pelo comando do jogo.
{
  let v = transacao(ate(808, 34, 'feminino', 'goiania-go'), x => { limpar(x); x.trabalho.experiencia['alimentacao'] = 60; x.financas.conta = 60000; contratar(x, r, ocupacao('cozinheiro')); }).vida;
  v = executar(v, { tipo: 'abrir_negocio', negocio: 'lanchonete' }).vida;
  v = viver(v, 36);
  gravar('empreendedor', v);
}

// 9. Rural: produtor na terra da família, no Mato Grosso.
{
  let v = transacao(ate(909, 32, 'masculino', 'sinop-mt'), x => { limpar(x); garantirFrente(x, 'campo'); const f = x.caminhos.frentes.campo!; f.habilidade = 62; f.interesse = 75; f.meses = 120; f.auge = 62; x.trabalho.experiencia['agro'] = 72; const e = contratar(x, r, ocupacao('produtor_rural'), 'oportunidade'); e.clientela = 45; iniciarRural(x, 'arrendada'); }).vida;
  v = viver(v, 34);
  gravar('rural', v);
}

// 10. Cuidadora: parou de trabalhar para cuidar da mãe.
gravar('cuidador', transacao(ate(1010, 52, 'feminino', 'porto-alegre-rs'), x => { limpar(x); contratar(x, r, ocupacao('aux_adm')); const mae = vinculosVivos(x).find(q => q.vin.parentesco === 'mae'); if (mae) { mae.p.vivo = true; mae.p.saude = 30; mae.p.municipioId = x.moradia.municipioId; if (!mae.vin.convivio.includes('casa')) mae.vin.convivio.push('casa'); } iniciarPausa(x, 'pais', 'total', mae?.p.id); x.trabalho.pausa!.tInicio = x.t - 36; }).vida);

// 11. Envolvimento: um dinheiro por fora, com o risco crescendo.
gravar('envolvido', transacao(ate(1111, 29, 'masculino', 'rio-de-janeiro-rj'), x => { limpar(x); contratar(x, r, ocupacao('estoquista')); entrar(x, 'patrimonial', undefined, r); x.caminhos.envolvimento!.nivel = 2; x.caminhos.envolvimento!.exposicao = 48; x.caminhos.envolvimento!.tInicio = x.t - 36; }).vida);

// 12. Preso: cumprindo pena, estudando na unidade.
gravar('preso', transacao(ate(1212, 31, 'masculino', 'salvador-ba'), x => { limpar(x); x.justica = { antecedentes: [{ t: x.t - 12, categoria: 'mercado', desfecho: 'prisao', anos: 5 }], prisao: { tInicio: x.t - 12, tFim: x.t + 30, regime: 'fechado' } }; x.fatos['esteve_preso'] = x.t - 12; x.fatos['remicao_decidida'] = x.t - 12; x.fatos['remicao_estudo'] = x.t - 12; x.rotinas = [{ id: 'leitura', tInicio: x.t - 12, nivel: 1 }]; for (const q of vinculosVivos(x)) q.vin.convivio = []; }).vida);

// 13. Egresso: saiu há um ano, procurando trabalho, com a porta do programa de egressos.
gravar('egresso', transacao(ate(1313, 34, 'feminino', 'campinas-sp'), x => { limpar(x); x.justica = { antecedentes: [{ t: x.t - 60, categoria: 'patrimonial', desfecho: 'prisao', anos: 3 }], tSaida: x.t - 12 }; x.fatos['esteve_preso'] = x.t - 60; x.trabalho.desempregadoDesde = x.t - 12; novaOportunidade(x, { tipo: 'reinsercao', ocupacaoId: 'aux_limpeza', meses: 24, chave: 'reinsercao', bonus: 0.3, titulo: 'Um programa para quem saiu', texto: 'Um programa de apoio a egressos tem empresas parceiras que contratam quem cumpriu pena. Carteira assinada, salário de começo e ninguém perguntando duas vezes.' }); }).vida);

// 14. Mudança aos 40+: anos de comércio, voltando a estudar enfermagem à noite.
gravar('mudanca40', transacao(ate(1414, 44, 'masculino', 'recife-pe'), x => { limpar(x); x.trabalho.experiencia['comercio'] = 12 * 20; const e = contratar(x, r, ocupacao('gerente_loja')); e.tInicio = x.t - 12 * 9; e.tPosto = e.tInicio; x.fatos['plano_estudar'] = x.t; }).vida);
