/**
 * AUDITORIA PÓS-PLAYTEST — Achado 8: de onde nasce o dinheiro.
 *
 * DIAGNÓSTICO APENAS. Nada de produção é alterado; o script só CHAMA
 * `processarAnoEconomia` com estados controlados e lê o resultado.
 *
 * Oito perfis (A-H) exigidos pela auditoria, cada um simulado por 10 anos com
 * o MESMO motor que o jogo usa. O objetivo não é achar "o número errado" e sim
 * mostrar quais rubricas existem de verdade no caixa e quais são só narrativa.
 *
 * Uso: npx tsx scripts/audit/economiaControlada.ts
 */

import { processarAnoEconomia, criarEconomiaInicial } from '../../src/systems/economySystem';
import { criarEstadoTeste } from '../../src/systems/__tests__/fixtures';
import type { EconomyState, FamilyMember, Property } from '../../src/types';

function filho(nome: string, idade: number): FamilyMember {
  return {
    id: `f_${nome}`,
    nome,
    tipo: idade % 2 === 0 ? 'filho' : 'filha',
    idade,
    vivo: true,
    relacionamento: 80
  } as FamilyMember;
}

function parceiro(nome: string): FamilyMember {
  return {
    id: 'p_1',
    nome,
    tipo: 'esposa',
    idade: 35,
    vivo: true,
    relacionamento: 85
  } as FamilyMember;
}

function bem(
  tipo: 'imovel' | 'veiculo',
  nome: string,
  valor: number,
  manutencao: number
): Property {
  return {
    id: `b_${nome}`,
    tipo,
    nome,
    valorCompra: valor,
    valorAtual: valor,
    custoAnualManutencao: manutencao,
    anoCompra: 2026,
    quitado: true
  };
}

interface Perfil {
  letra: string;
  nome: string;
  idade: number;
  salarioMensal: number;
  familia: FamilyMember[];
  propriedades: Property[];
  padrao: EconomyState['padraoDeVida'];
}

const PERFIS: Perfil[] = [
  { letra: 'A', nome: 'solteiro, sem filhos, baixa renda', idade: 25, salarioMensal: 1800, familia: [], propriedades: [], padrao: 'modesto' },
  { letra: 'B', nome: 'solteiro, renda média', idade: 30, salarioMensal: 5000, familia: [], propriedades: [], padrao: 'confortavel' },
  { letra: 'C', nome: 'casado, 2 filhos, renda média', idade: 35, salarioMensal: 5000, familia: [parceiro('Ana'), filho('Bia', 6), filho('Caio', 10)], propriedades: [], padrao: 'confortavel' },
  { letra: 'D', nome: 'casado, 2 filhos, alta renda', idade: 40, salarioMensal: 18000, familia: [parceiro('Ana'), filho('Bia', 6), filho('Caio', 10)], propriedades: [], padrao: 'confortavel' },
  { letra: 'E', nome: 'imóvel + carro popular', idade: 40, salarioMensal: 6000, familia: [], propriedades: [bem('imovel', 'Apartamento', 350000, 6000), bem('veiculo', 'Carro popular', 60000, 5000)], padrao: 'confortavel' },
  { letra: 'F', nome: 'imóvel caro + carro premium', idade: 45, salarioMensal: 25000, familia: [], propriedades: [bem('imovel', 'Cobertura Duplex', 1650000, 24000), bem('veiculo', 'SUV Premium', 340000, 26000)], padrao: 'luxuoso' },
  { letra: 'G', nome: 'desempregado com família', idade: 40, salarioMensal: 0, familia: [parceiro('Ana'), filho('Bia', 8)], propriedades: [], padrao: 'modesto' },
  { letra: 'H', nome: 'idoso', idade: 70, salarioMensal: 2500, familia: [], propriedades: [bem('imovel', 'Casa', 300000, 5000)], padrao: 'modesto' }
];

const ANOS = 10;
const brl = (n: number) =>
  (n < 0 ? '-' : '') + 'R$ ' + Math.abs(Math.round(n)).toLocaleString('pt-BR');

console.log('='.repeat(78));
console.log('ACHADO 8 — CENÁRIOS ECONÔMICOS CONTROLADOS (10 anos cada)');
console.log('='.repeat(78));
console.log('\nMotor real: processarAnoEconomia(). Sem eventos, sem sorte, sem bicos —');
console.log('só o fluxo estrutural de entradas e saídas.\n');

interface Linha {
  letra: string;
  nome: string;
  rendaAno: number;
  despesaAno: number;
  saldo5: number;
  saldo10: number;
  divida10: number;
  patrimonio10: number;
}
const resultados: Linha[] = [];

for (const p of PERFIS) {
  const base = criarEstadoTeste({ idade: p.idade });
  let eco: EconomyState = {
    ...criarEconomiaInicial('classe_media'),
    dinheiro: 0,
    padraoDeVida: p.padrao,
    propriedades: p.propriedades.map((x) => ({ ...x }))
  };
  const personagem = { ...base.personagem, idade: p.idade };
  const salarioAnual = p.salarioMensal * 12;

  let saldo5 = 0;
  let despesaObservada = 0;

  for (let ano = 1; ano <= ANOS; ano++) {
    const antes = eco.dinheiro;
    const r = processarAnoEconomia(
      eco,
      { ...personagem, idade: p.idade + ano - 1 },
      p.familia,
      salarioAnual,
      0,
      2026 + ano
    );
    eco = r.economiaAtualizada;
    if (ano === 1) despesaObservada = salarioAnual - (eco.dinheiro - antes);
    if (ano === 5) saldo5 = eco.dinheiro;
  }

  const patrimonio =
    eco.dinheiro +
    eco.propriedades.reduce((s, x) => s + x.valorAtual, 0) +
    eco.investimentos.reduce((s, x) => s + x.saldo, 0) -
    eco.dividas;

  resultados.push({
    letra: p.letra,
    nome: p.nome,
    rendaAno: salarioAnual,
    despesaAno: despesaObservada,
    saldo5,
    saldo10: eco.dinheiro,
    divida10: eco.dividas,
    patrimonio10: patrimonio
  });
}

console.log(
  'perfil | renda/ano    | despesa/ano  | saldo 5a     | saldo 10a    | dívida 10a  | patrimônio 10a'
);
console.log('-'.repeat(103));
for (const r of resultados) {
  console.log(
    `${r.letra}      | ${brl(r.rendaAno).padStart(12)} | ${brl(r.despesaAno).padStart(12)} | ` +
      `${brl(r.saldo5).padStart(12)} | ${brl(r.saldo10).padStart(12)} | ${brl(r.divida10).padStart(11)} | ${brl(r.patrimonio10).padStart(14)}`
  );
}
console.log();
for (const r of resultados) console.log(`  ${r.letra} = ${r.nome}`);

console.log('\n' + '='.repeat(78));
console.log('RUBRICAS: o que o caixa REALMENTE cobra');
console.log('='.repeat(78));
console.log(`
ENTRADAS que o motor soma:
  · salário do personagem ............... SIM (carreira -> salarioTotalAnual)
  · rendimento de investimento .......... SIM (se houver investimento)
  · prêmio/mega-sena .................... SIM (ação voluntária)
  · venda de bem ........................ SIM (ação voluntária)
  · RENDA DO PARCEIRO ................... NÃO EXISTE
  · bico / renda informal ............... NÃO EXISTE
  · benefício / aposentadoria pública ... NÃO EXISTE (ver SEM_APOSENTADORIA)
  · pensão, herança, aluguel recebido ... NÃO EXISTE

SAÍDAS que o motor cobra:
  · despesa base por padrão de vida ..... SIM (9k / 14k / 45k por ano)
  · filhos menores de 18 ................ SIM (7.000/ano cada)
  · manutenção de propriedades .......... SIM (campo custoAnualManutencao)
  · mensalidade de educação ............. SIM
  · desconto de 40% com imóvel quitado .. SIM (proxy de "não paga aluguel")
  · ALUGUEL de quem não tem imóvel ...... NÃO (embutido na despesa base)
  · CUSTO DO PARCEIRO ................... NÃO EXISTE
  · IPVA / seguro / combustível ......... NÃO separadamente (só manutenção)
  · condomínio / IPTU ................... NÃO separadamente
  · juros de dívida ..................... ver bloco de dívida em economySystem
  · impostos sobre salário .............. NÃO (salário é líquido por suposição)
  · saúde, transporte, lazer ............ NÃO (embutidos na despesa base)

LEITURA: a lista de saídas não é curta demais por si só — agregar custo de
vida numa rubrica é uma decisão de design legítima para não virar planilha.
O problema é OUTRO: um parceiro entra na vida sem trazer nem renda nem
custo, e os filhos custam um valor fixo que não acompanha padrão de vida
nem idade. Some-se a isso a ausência de qualquer imposto sobre salário alto,
e o resultado é o perfil D/F acumulando caixa sem resistência.
`);
