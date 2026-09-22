/**
 * AUDITORIA PÓS-PLAYTEST — "o dado existe, mas ninguém lê".
 *
 * DIAGNÓSTICO APENAS.
 *
 * A auditoria anterior (pré-F1) encontrou esse padrão várias vezes: um campo
 * gravado com cuidado, exibido na interface, e nunca consultado por nenhuma
 * regra. Este script repete a abordagem de forma sistemática: para cada dado
 * concreto do estado, conta QUEM ESCREVE e QUEM LÊ, varrendo o código de
 * produção (fora de testes e scripts).
 *
 * A contagem é textual e serve para DIRIGIR A LEITURA — cada linha do
 * relatório foi conferida no código. Um número alto não prova consumo real
 * (pode ser a própria definição); um zero, porém, é conclusivo.
 *
 * Uso: npx tsx scripts/audit/dadosNaoConsumidos.ts
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const RAIZ = join(import.meta.dirname, '../..');
const SRC = join(RAIZ, 'src');

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      if (nome === '__tests__' || nome === '__playtest__') return [];
      return arquivos(caminho);
    }
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

const FONTES = arquivos(SRC).map((f) => ({
  caminho: relative(RAIZ, f),
  texto: readFileSync(f, 'utf-8')
}));

const ehMotor = (c: string) => c.includes('/systems/');
const ehUI = (c: string) => c.includes('/components/') || c.includes('/presentation/');

interface Dado {
  nome: string;
  padrao: RegExp;
  /** Onde o dado é definido/escrito — para não contar como "leitura". */
  donos: RegExp;
  pergunta: string;
}

const DADOS: Dado[] = [
  {
    nome: "pet (FamilyMember 'pet')",
    padrao: /'pet'|"pet"/,
    donos: /types\/index|familySystem|relationshipSystem/,
    pergunta: 'eventos de pet checam se existe pet?'
  },
  {
    nome: 'propriedade: imóvel',
    padrao: /tipo === 'imovel'|'imovel'/,
    donos: /types\/index|economySystem|assetsData|data\//,
    pergunta: 'morar, mudar, sair da casa dos pais usam o imóvel?'
  },
  {
    nome: 'propriedade: veículo',
    padrao: /tipo === 'veiculo'|'veiculo'/,
    donos: /types\/index|economySystem|assetsData|data\//,
    pergunta: 'deslocamento/emprego/lazer usam o veículo?'
  },
  {
    nome: 'custoAnualManutencao',
    padrao: /custoAnualManutencao/,
    donos: /types\/index|data\//,
    pergunta: 'a economia cobra a manutenção?'
  },
  {
    nome: 'cidade / estado do personagem',
    padrao: /\.cidade\b|\.estado\b/,
    donos: /types\/index|data\/|characterCreation|localizacao/,
    pergunta: 'educação e trabalho usam a localidade?'
  },
  {
    nome: 'padraoDeVida',
    padrao: /padraoDeVida/,
    donos: /types\/index/,
    pergunta: 'quem muda e quem lê o padrão de vida?'
  },
  {
    nome: 'dividas',
    padrao: /\.dividas\b/,
    donos: /types\/index/,
    pergunta: 'a dívida gera juros e consequência?'
  },
  {
    nome: 'parceiro (cônjuge/namorado)',
    padrao: /'esposo'|'esposa'|'namorado'|'namorada'/,
    donos: /types\/index|relationshipSystem/,
    pergunta: 'a economia doméstica conhece o parceiro?'
  },
  {
    nome: "amigo (FamilyMember 'amigo')",
    padrao: /'amigo'|'amiga'/,
    donos: /types\/index|relationshipSystem/,
    pergunta: 'amizade evolui por convivência?'
  },
  {
    nome: 'relacionamento (0-100)',
    padrao: /\.relacionamento\b/,
    donos: /types\/index/,
    pergunta: 'o grau de proximidade muda o que acontece?'
  },
  {
    nome: 'genero do personagem',
    padrao: /\.genero\b/,
    donos: /types\/index|data\//,
    pergunta: 'o avatar usa o gênero?'
  },
  {
    nome: 'areaFormacao',
    padrao: /areaFormacao/,
    donos: /types\/index|data\//,
    pergunta: 'a carreira usa a formação? (F1)'
  }
];

console.log('='.repeat(78));
console.log('MATRIZ — DADO EXISTE? QUEM ESCREVE? QUEM LÊ?');
console.log('='.repeat(78));
console.log();

for (const d of DADOS) {
  const usos = FONTES.filter((f) => d.padrao.test(f.texto));
  const consumidores = usos.filter((f) => !d.donos.test(f.caminho));
  const motor = consumidores.filter((f) => ehMotor(f.caminho));
  const ui = consumidores.filter((f) => ehUI(f.caminho));

  console.log(`${d.nome}`);
  console.log(`  ${d.pergunta}`);
  console.log(
    `  arquivos que citam: ${usos.length}  ·  fora da definição: ${consumidores.length}` +
      `  ·  no MOTOR: ${motor.length}  ·  na UI: ${ui.length}`
  );
  if (motor.length > 0) {
    console.log(`  motor: ${motor.map((f) => f.caminho.replace('src/systems/', '')).join(', ')}`);
  } else {
    console.log('  motor: NENHUM  <-- dado sem consumidor de regra');
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Verificação dirigida: o vocabulário de elegibilidade de eventos.
// ---------------------------------------------------------------------------
console.log('='.repeat(78));
console.log('VOCABULÁRIO DE ELEGIBILIDADE DE EVENTOS (GameEvent.condicoes)');
console.log('='.repeat(78));
const tipos = readFileSync(join(SRC, 'types/index.ts'), 'utf-8');
const bloco = tipos.match(/condicoes\?:\s*\{([\s\S]*?)\n  \};/);
const campos = bloco
  ? [...bloco[1].matchAll(/^\s{4}(\w+)\?:/gm)].map((m) => m[1])
  : [];
console.log(`\npredicados existentes (${campos.length}): ${campos.join(', ')}\n`);

const FALTANTES = [
  ['temPet', 'Achado 4 — o caso reproduzido no playtest'],
  ['temVeiculo', 'eventos de carro/oficina/garagem'],
  ['temImovel', 'eventos de condomínio/síndico/mudança'],
  ['temIrmaos', 'eventos que citam irmãos'],
  ['temAmigos', 'eventos que citam "seu amigo"'],
  ['cidade/porte', 'eventos e oferta educacional por localidade'],
  ['temDivida', 'eventos de cobrança/negativação'],
  ['moraComPais', 'eventos de saída/retorno à casa dos pais']
];
console.log('predicados AUSENTES que o catálogo já pressupõe em texto:');
for (const [nome, motivo] of FALTANTES) {
  console.log(`  · ${nome.padEnd(16)} ${motivo}`);
}
