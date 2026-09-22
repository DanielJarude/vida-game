/**
 * AUDITORIA PÓS-PLAYTEST — Achado 6: existe vida social?
 *
 * DIAGNÓSTICO APENAS.
 *
 * Mede, nas mesmas 105 vidas, quantas pessoas NÃO-FAMILIARES aparecem, quanto
 * tempo duram e se alguma relação evolui. A hipótese do playtest é que a vida
 * social se resume a "vida a dois + família de origem", e que amigos só
 * existem via o botão "Conhecer novas pessoas".
 *
 * Uso: npx tsx scripts/audit/vidaSocial.ts   (env VIDAS, default 15)
 */

import { simularVida, PERFIS } from './simulador';

const VIDAS_POR_PERFIL = Number(process.env.VIDAS ?? 15);

const TIPOS_FAMILIA_ORIGEM = ['pai', 'mae', 'irmao', 'irma'];
const TIPOS_PARCEIRO = ['namorado', 'namorada', 'noivo', 'noiva', 'esposo', 'esposa'];
const TIPOS_AMIZADE = ['amigo', 'amiga', 'colega', 'mentor', 'rival', 'paixao'];

let vidas = 0;
const contagens = {
  familiaOrigem: 0,
  parceiros: 0,
  filhos: 0,
  amizades: 0,
  pets: 0,
  outros: 0
};

const amigosPorVida: number[] = [];
const vidasComAlgumAmigo: number[] = [];
const idadesDeAmizade: number[] = [];
/** Tipos exatos encontrados, para não depender da minha lista. */
const tiposVistos = new Map<string, number>();

for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS_POR_PERFIL; i++) {
    const seed = 1000 + i * 37;
    const vida = simularVida(seed, perfil);
    vidas++;

    const familiaFinal = vida.familiaFinal ?? [];
    let amigosNestaVida = 0;

    for (const m of familiaFinal) {
      const tipo = String(m.tipo);
      tiposVistos.set(tipo, (tiposVistos.get(tipo) ?? 0) + 1);

      if (TIPOS_FAMILIA_ORIGEM.includes(tipo)) contagens.familiaOrigem++;
      else if (TIPOS_PARCEIRO.includes(tipo)) contagens.parceiros++;
      else if (tipo === 'filho' || tipo === 'filha') contagens.filhos++;
      else if (tipo === 'pet') contagens.pets++;
      else if (TIPOS_AMIZADE.includes(tipo)) {
        contagens.amizades++;
        amigosNestaVida++;
      } else contagens.outros++;
    }

    amigosPorVida.push(amigosNestaVida);
    if (amigosNestaVida > 0) vidasComAlgumAmigo.push(1);
  }
}

function mediana(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

console.log('='.repeat(78));
console.log('ACHADO 6 — VIDA SOCIAL EM 105 VIDAS (estado final de cada vida)');
console.log('='.repeat(78));
console.log(`\n${vidas} vidas simuladas\n`);

console.log('PESSOAS NA VIDA, POR CATEGORIA (soma de todas as vidas):');
console.log(`  família de origem (pai/mãe/irmãos) .. ${contagens.familiaOrigem}`);
console.log(`  parceiros ........................... ${contagens.parceiros}`);
console.log(`  filhos .............................. ${contagens.filhos}`);
console.log(`  AMIZADES (amigo/colega/mentor/...) .. ${contagens.amizades}`);
console.log(`  pets ................................ ${contagens.pets}`);
console.log(`  outros .............................. ${contagens.outros}`);

console.log('\nTIPOS EXATOS ENCONTRADOS NO ESTADO FINAL:');
for (const [t, n] of [...tiposVistos].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${t.padEnd(14)} ${String(n).padStart(5)}  (${(n / vidas).toFixed(2)} por vida)`);
}

console.log('\nAMIZADES POR VIDA:');
console.log(`  mediana ................. ${mediana(amigosPorVida)}`);
console.log(`  média ................... ${(amigosPorVida.reduce((a, b) => a + b, 0) / vidas).toFixed(2)}`);
console.log(`  máximo .................. ${Math.max(...amigosPorVida)}`);
console.log(`  vidas com ALGUM amigo ... ${vidasComAlgumAmigo.length}/${vidas}`);
console.log(`  vidas SEM nenhum amigo .. ${vidas - vidasComAlgumAmigo.length}/${vidas}`);

console.log('\n' + '='.repeat(78));
console.log('COMO UMA AMIZADE PODE NASCER HOJE (leitura do código)');
console.log('='.repeat(78));
console.log(`
  1. ação voluntária "Conhecer novas pessoas" -> gerarCandidatosNamoro()
     O nome da função diz o propósito: o caminho social principal do jogo
     produz CANDIDATOS A NAMORO, não amigos.

  2. consequência de evento 'adicionarFamiliar' -> eventSystem cria o membro
     com tipo padrão 'pet' quando o evento não especifica.

  NÃO EXISTE:
  · convivência (escola/trabalho/bairro) que produza conhecido;
  · progressão conhecido -> amigo -> amigo próximo;
  · afastamento gradual por falta de convívio;
  · amizade que vira romance por proximidade;
  · reencontro de quem já existiu na vida.

  O campo 'relacionamento' (0-100) existe em cada pessoa e é lido por
  eventSystem/familySystem/relationshipSystem, mas NÃO há nenhuma regra que
  o faça subir por convivência: ele muda por evento pontual.
`);
