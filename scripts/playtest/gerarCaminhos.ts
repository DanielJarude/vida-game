/**
 * Gera saves de momentos de CAMINHO para o playtest visual (`caminhos.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarCaminhos.ts --bundle --platform=node --outfile=/tmp/gc.cjs && SP=/tmp/vida-caminhos node /tmp/gc.cjs
 *
 * Momentos: criança com atividades; adolescente com portas abertas (peneira,
 * aprendiz, instituto federal); jovem com trabalho + faculdade (semana cheia);
 * adulto de meia carreira parado no cargo; aposentado.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar, aposentar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { novaOportunidade } from '../../src/motor/sistemas/oportunidades';

const SP = process.env.SP ?? '/tmp/vida-caminhos';
mkdirSync(SP, { recursive: true });

function viver(v: Vida, ate: number, rotinas: [string, number, number][] = []): Vida {
  while (!v.morte && idade(v) < ate) {
    for (const [id, min, nivel] of rotinas) {
      if (idade(v) < min) continue;
      const atual = v.rotinas.find(r => r.id === id);
      const alvo = atual ? Math.min(nivel, (atual.nivel ?? 1) + 1) as 1 | 2 | 3 : 1;
      if (!atual || (atual.nivel ?? 1) < alvo) v = executar(v, { tipo: 'rotina', id, ativa: true, nivel: alvo }).vida;
    }
    v = avancarAno(v).vida;
    while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida;
  }
  return v;
}

const nasce = (semente: number, genero: 'masculino' | 'feminino' = 'feminino') => criarVida({ nome: 'Samuel', sobrenome: 'Sales', genero, municipioId: 'feira-de-santana-ba', semente, classe: 'trabalhadora' });

// 1. Criança de 10 com bola, desenho e leitura.
writeFileSync(`${SP}/save-crianca.json`, JSON.stringify(viver(nasce(3, 'masculino'), 10, [['futebol', 5, 2], ['desenho', 6, 1], ['leitura', 8, 1]])));

// 2. Adolescente de 15 com portas: peneira, aprendiz, instituto federal.
{
  let v = viver(nasce(5, 'masculino'), 15, [['futebol', 5, 2], ['musica', 9, 2]]);
  v = transacao(v, x => {
    novaOportunidade(x, { tipo: 'peneira', dominio: 'futebol', municipioId: 'salvador-ba', meses: 12, chave: 'peneira_futebol', titulo: 'Peneira no Esporte Clube Salvador', texto: 'O treinador viu você jogar e indicou para a peneira do Esporte Clube Salvador, em Salvador. Centenas de garotos, poucas vagas.' });
    novaOportunidade(x, { tipo: 'aprendiz', ocupacaoId: 'jovem_aprendiz', meses: 12, chave: 'aprendiz', bonus: 0.25, titulo: 'Jovem aprendiz', texto: 'A escola divulgou vagas de jovem aprendiz numa rede de supermercados. Meio período, carteira assinada, escola garantida.' });
    novaOportunidade(x, { tipo: 'selecao_tecnico', meses: 12, chave: 'selecao_tecnico', titulo: 'Seleção do instituto federal', texto: 'O instituto federal da cidade abriu a prova para o ensino médio integrado ao técnico: três anos, dia inteiro, e um diploma de técnico junto com o do médio.' });
  }).vida;
  writeFileSync(`${SP}/save-adolescente.json`, JSON.stringify(v));
}

// 3. Jovem de 23 com trabalho e faculdade: a semana cheia.
{
  let v = viver(nasce(7), 22, [['corrida', 14, 1]]);
  v = transacao(v, (x, r) => {
    x.educacao.escolaridade = 'medio';
    if (!x.trabalho.atual) contratar(x, r, ocupacao('atendente'));
    x.educacao.matricula = { cursoId: 'enfermagem', instituicao: 'a universidade federal em Feira de Santana', rede: 'publica', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 48, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId };
  }).vida;
  writeFileSync(`${SP}/save-semana-cheia.json`, JSON.stringify(v));
}

// 4. Adulto de 44 há anos no mesmo cargo.
{
  let v = viver(nasce(11, 'masculino'), 44, [['futebol', 6, 1]]);
  v = transacao(v, (x, r) => {
    x.educacao.escolaridade = 'medio';
    contratar(x, r, ocupacao('assistente_adm'));
    x.trabalho.atual!.tInicio = x.t - 96; x.trabalho.atual!.tPosto = x.t - 96;
    x.trabalho.experiencia['administrativo'] = 200;
  }).vida;
  writeFileSync(`${SP}/save-meia-carreira.json`, JSON.stringify(v));
}

// 5. Aposentada de 66.
{
  let v = viver(nasce(13), 65, [['musica', 8, 2]]);
  v = transacao(v, (x, r) => { x.educacao.escolaridade = 'medio'; contratar(x, r, ocupacao('tecnico_publico')); x.trabalho.contribuicao = 420; aposentar(x); }).vida;
  v = viver(v, 66);
  writeFileSync(`${SP}/save-aposentada.json`, JSON.stringify(v));
}
console.log('saves em', SP);
