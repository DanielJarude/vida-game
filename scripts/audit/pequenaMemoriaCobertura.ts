/**
 * AUDITORIA PÓS-PLAYTEST — Achado 3, causa raiz da pequena memória.
 *
 * DIAGNÓSTICO APENAS.
 *
 * Pergunta: quando um ano fica sem nenhuma linha, a pequena memória é
 * chamada? E, sendo chamada, ela tem algo verdadeiro a dizer?
 *
 * As duas respostas são diferentes e a distinção importa:
 *   - não é chamada  -> guarda no motor (pulso != 'silencio')
 *   - é chamada e devolve null -> o CATÁLOGO de memórias não cobre o estado
 *
 * Uso: npx tsx scripts/audit/pequenaMemoriaCobertura.ts
 */

import { gerarPequenaMemoria } from '../../src/systems/memorias/pequenaMemoria';
import { criarEstadoTeste } from '../../src/systems/__tests__/fixtures';

const IDADES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 17, 18, 22, 30, 45, 60, 70, 80];

console.log('='.repeat(78));
console.log('PEQUENA MEMÓRIA — COBERTURA POR IDADE (ano que ficaria vazio)');
console.log('='.repeat(78));
console.log();
console.log('Cenário: ano SEM nenhuma linha, personagem sem emprego/curso/filhos,');
console.log('que é exatamente a situação de uma criança comum.\n');
console.log('idade | pequena memória gerada?');
console.log('-'.repeat(78));

let semCobertura = 0;
for (const idade of IDADES) {
  const base = criarEstadoTeste({ idade });
  const memoria = gerarPequenaMemoria(
    {
      personagem: base.personagem,
      carreira: base.carreira,
      educacao: base.educacao,
      economia: base.economia,
      familia: base.familia
    },
    [],
    idade,
    2026 + idade
  );
  if (!memoria) semCobertura++;
  console.log(
    `${String(idade).padStart(5)} | ${memoria ? `SIM  "${memoria.texto}"` : 'NÃO — nenhuma candidata é verdadeira'}`
  );
}

console.log();
console.log(`idades testadas sem nenhuma memória possível: ${semCobertura}/${IDADES.length}`);

console.log('\n' + '='.repeat(78));
console.log('POR QUE: as condições declaradas no catálogo de memórias');
console.log('='.repeat(78));
console.log(`
  mem_filhos_pequenos ..... exige filho <= 6
  mem_filhos_escola ....... exige filho 7-17
  mem_divida .............. exige dívida > dinheiro
  mem_estudo .............. exige emCurso E idade >= 18
  mem_trabalho_longo ...... exige empregado E 5+ anos no cargo
  mem_trabalho ............ exige empregado
  mem_aposentado_parceiro . exige aposentado E parceiro
  mem_aposentado .......... exige aposentado
  mem_desempregado ........ exige idade >= 25
  mem_cidade (rede final) . exige idade >= 18   <-- a rede não cobre criança

  As dez candidatas descrevem uma vida ADULTA: trabalho, curso superior,
  filhos, dívida, aposentadoria. A última rede, que deveria pegar qualquer
  caso restante, tem 'idade >= 18' na condição.

  Consequência: para uma criança de 1 a 17 anos sem emprego e sem filhos,
  gerarPequenaMemoria() SEMPRE devolve null. O ano fica sem nenhuma linha
  e desaparece da Linha da Vida — o salto "7 anos -> 10 anos" do playtest.
`);
