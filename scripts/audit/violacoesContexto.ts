/**
 * F4 — VIOLAÇÕES REAIS DE CONTEXTO nas 105 vidas.
 *
 * A auditoria pós-playtest listou 32 pares "texto pressupõe × motor não
 * valida" por varredura léxica. Isso responde "quais eventos PODERIAM
 * aparecer sem o estado". Este script responde a pergunta que interessa para
 * medir antes/depois: **quantas vezes isso REALMENTE aconteceu**.
 *
 * A diferença importa. Um evento de escola entre 10 e 17 anos quase nunca
 * dispara fora da escola, porque o personagem entra no fundamental aos 6
 * automaticamente — o par é real na teoria e quase inócuo na prática. Já o
 * evento do pet dispara sem pet em quase toda vida.
 *
 * Roda ANTES e DEPOIS da F4 com o mesmo comando, e a comparação é a métrica
 * da fase.
 *
 * Uso: npx tsx scripts/audit/violacoesContexto.ts   (env VIDAS, default 15)
 */

import { simularVida, PERFIS } from './simulador';
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import type { GameEvent } from '../../src/types';

const VIDAS_POR_PERFIL = Number(process.env.VIDAS ?? 15);

/**
 * Pressupostos que serão checados contra o estado REAL no instante em que o
 * evento ocorreu. Cada entrada nasce da leitura do texto do evento — não de
 * regex sobre o catálogo.
 */
const PRESSUPOSTOS: Record<string, { grupo: string; exige: string }> = {
  // --- PET: o texto fala de um animal que já é da casa
  fam_pet_veterinario: { grupo: 'pet', exige: 'pet' },
  // bb_cachorro_familia foi RECLASSIFICADO como falso positivo na F4: o texto
  // fala do cachorro que já era da casa quando o bebê nasceu, não de um pet
  // adquirido pelo personagem. Exigir `temPet` (0-2 anos) o tornava
  // estruturalmente inalcançável, porque pet só se adquire a partir dos 4.
  // Ver a justificativa completa no próprio evento, em babyEvents.ts.

  // --- PATRIMÔNIO
  adm_assembleia_condominio: { grupo: 'patrimonio', exige: 'imovel' },

  // --- RELAÇÕES
  fam_padrinho_casamento: { grupo: 'relacionamento', exige: 'amigo' },
  adm_reencontro_de_turma: { grupo: 'relacionamento', exige: 'estudou' },

  // --- ESCOLA (texto se passa dentro da escola)
  ado_cola_prova: { grupo: 'estudo', exige: 'emEscola' },
  esc_olimpiada_matematica: { grupo: 'estudo', exige: 'emEscola' },
  esc_achado_perdido_dinheiro: { grupo: 'estudo', exige: 'emEscola' },
  inf_bullying_defesa: { grupo: 'estudo', exige: 'emEscola' },
  esp_selecao_natacao: { grupo: 'estudo', exige: 'emEscola' },
  hob_colecao_figurinhas: { grupo: 'estudo', exige: 'emEscola' },
  ext_festa_junina: { grupo: 'estudo', exige: 'emEscola' },
  ext_vender_brigadeiro: { grupo: 'estudo', exige: 'emEscola' },
  // ado_trote_festa e ado_preparacao_enem: classificados na F4 como
  // DEPENDENTES DE SISTEMA FUTURO. Os dois acontecem no ano em que o Ensino
  // Médio termina, quando `emCurso` ja e false (medido: 0/105 matriculados
  // aos 17). O pressuposto real e "chegou ao fim do EM" — nivel de
  // escolaridade, nao matricula ativa — e o vocabulario de elegibilidade nao
  // tem predicado de escolaridade. Exigir emEscola zerava os dois eventos.
  // Nao ha correcao honesta dentro do escopo da F4.

  // --- TRABALHO
  car_exame_ordem_conselho: { grupo: 'emprego', exige: 'empregado' }
};

type Contagem = { ocorrencias: number; violacoes: number };
const porEvento = new Map<string, Contagem>();
const porGrupo = new Map<string, Contagem>();

function reg(mapa: Map<string, Contagem>, chave: string, violou: boolean) {
  const c = mapa.get(chave) ?? { ocorrencias: 0, violacoes: 0 };
  c.ocorrencias++;
  if (violou) c.violacoes++;
  mapa.set(chave, c);
}

let vidas = 0;
let totalOcorrencias = 0;
let totalViolacoes = 0;

for (const perfil of PERFIS) {
  for (let i = 0; i < VIDAS_POR_PERFIL; i++) {
    const vida = simularVida(1000 + i * 37, perfil);
    vidas++;

    for (const ano of vida.anos) {
      for (const id of ano.ocorrenciasDoAno) {
        const p = PRESSUPOSTOS[id];
        if (!p) continue;

        const ctx = ano.contexto;
        if (!ctx) continue;

        let violou = false;
        switch (p.exige) {
          case 'pet': violou = !ctx.temPet; break;
          case 'imovel': violou = !ctx.temImovel; break;
          case 'veiculo': violou = !ctx.temVeiculo; break;
          case 'amigo': violou = !ctx.temAmigo; break;
          case 'emEscola': violou = !ctx.emEscola; break;
          case 'empregado': violou = !ctx.empregado; break;
          case 'estudou': violou = !ctx.estudouAlgumaVez; break;
        }

        totalOcorrencias++;
        if (violou) totalViolacoes++;
        reg(porEvento, id, violou);
        reg(porGrupo, p.grupo, violou);
      }
    }
  }
}

const pct = (n: number, d: number) => (d === 0 ? '   —  ' : `${((n / d) * 100).toFixed(1).padStart(5)}%`);

console.log('='.repeat(78));
console.log('F4 — VIOLAÇÕES REAIS DE PRESSUPOSTO DE CONTEXTO');
console.log('='.repeat(78));
console.log(`\n${vidas} vidas · ${totalOcorrencias} ocorrências de eventos com pressuposto declarado\n`);

console.log('POR GRUPO:');
console.log('grupo           | ocorrências | violações |     %');
console.log('-'.repeat(56));
for (const [g, c] of [...porGrupo].sort((a, b) => b[1].violacoes - a[1].violacoes)) {
  console.log(
    `${g.padEnd(15)} | ${String(c.ocorrencias).padStart(11)} | ${String(c.violacoes).padStart(9)} | ${pct(c.violacoes, c.ocorrencias)}`
  );
}

console.log('\nPOR EVENTO:');
console.log('evento                          | ocorrências | violações |     %');
console.log('-'.repeat(72));
for (const [id, c] of [...porEvento].sort((a, b) => b[1].violacoes - a[1].violacoes)) {
  const marca = c.violacoes > 0 ? ' <--' : '';
  console.log(
    `${id.padEnd(31)} | ${String(c.ocorrencias).padStart(11)} | ${String(c.violacoes).padStart(9)} | ${pct(c.violacoes, c.ocorrencias)}${marca}`
  );
}

console.log(`\nTOTAL DE VIOLAÇÕES: ${totalViolacoes}/${totalOcorrencias} (${pct(totalViolacoes, totalOcorrencias)})`);
