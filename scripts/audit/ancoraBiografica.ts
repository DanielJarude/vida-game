/**
 * F6-FIX §14/§16 — ÂNCORA BIOGRÁFICA.
 *
 * Critério do playtest: uma linha da biografia precisa ser compreensível
 * DEZ ANOS DEPOIS, sozinha. Não basta ser gramatical.
 *
 * Isto NÃO decide sozinho: marca SUSPEITOS para leitura humana. O sinal é
 * a ausência de âncora — o texto não diz de quem/do que se trata, e o
 * evento que lhe daria sentido não está na linha.
 */
import { MASTER_EVENTS_LIST } from '../../src/data/events/allEvents';
import { memoriaDoDesfecho, temMemoriaDedicada } from '../../src/systems/narrativa/memoriaDoEvento';

/**
 * O defeito real do playtest NÃO é "a frase não tem substantivo concreto" —
 * "marcou um golaço ovacionado pelo quarteirão" é perfeitamente legível dez
 * anos depois. O defeito é a frase ANAFÓRICA: ela se refere a algo que só
 * existia no enunciado do evento, que a Linha da Vida não guarda.
 *
 *   "Foi uma visita curta: o café mal esfriou..."      visita A QUEM?
 *   "Você conseguiu alguns minutos extras..."          extras DE QUÊ?
 *
 * O sinal é sintático, não lexical: o texto ABRE referenciando uma entidade
 * definida ("a visita", "os minutos extras", "o esquema") sem jamais
 * nomeá-la. Por isso a checagem procura a referência pendente, não a
 * presença de vocabulário.
 */

/** Abre com artigo definido/pronome apontando para fora da própria frase. */
const ABERTURA_PENDENTE = [
  /^foi (uma|um|o|a) /i,
  /^(a|o|as|os) (visita|conversa|tarde|noite|reunião|proposta|resposta|briga|viagem|festa|encontro|assunto|esquema|convite|pedido)\b/i,
  /^você conseguiu (alguns|algumas|mais|uns|umas)\b/i,
  /^(ele|ela|eles|elas|isso|aquilo|aquele|aquela)\b/i,
  /^(deu|acabou|terminou|rendeu) (certo|bem|mal|em nada)\b/i
];

/** Entidade citada como conhecida, sem ter sido apresentada na linha. */
const ENTIDADE_NAO_APRESENTADA = [
  /\b(a|o) (visita|proposta|convite|esquema|acordo|combinado)\b/i,
  /\bminutos extras\b/i,
  /\bna próxima vez\b/i
];

function nomeiaAlguem(t: string): boolean {
  // Qualquer papel/pessoa/lugar explícito já ancora a cena.
  return /\b(mãe|pai|avó|avô|avós|irmã|irmão|filh[oa]|ti[ao]|prim[ao]|escola|colégio|professor|aula|turma|recreio|prova|faculdade|trabalho|emprego|chefe|colega|amig[oa]|vizinh[oa]|médico|hospital|casa|quarto|rua|praça|igreja|ônibus|carro|cachorro|gato|tablet|celular|violão|futebol|gol|festa|aniversário|natal|praia|carnaval|réveillon|fogos|baile|dança|excursão|águas|fofoca|copa|escritório|time|jogo|videogame|dinheiro|banda|música|bicicleta)\b/i.test(t);
}

interface Suspeito { evento: string; titulo: string; opcao: string; texto: string; motivo: string; natureza: string }
const suspeitos: Suspeito[] = [];
let lidos = 0, comMemoria = 0, comAncora = 0, silencio = 0;

for (const e of MASTER_EVENTS_LIST) {
  for (const o of e.opcoes) {
    const texto = memoriaDoDesfecho(o);
    lidos++;
    if (!texto) { silencio++; continue; }
    if (temMemoriaDedicada(o)) comMemoria++;
    if (nomeiaAlguem(texto)) { comAncora++; continue; }

    const abrePendente = ABERTURA_PENDENTE.find(r => r.test(texto.trim()));
    const entidade = ENTIDADE_NAO_APRESENTADA.find(r => r.test(texto));
    if (!abrePendente && !entidade) { comAncora++; continue; }

    suspeitos.push({
      evento: e.id, titulo: e.titulo, opcao: o.id, texto,
      natureza: e.natureza ?? 'decisao',
      motivo: abrePendente ? `abre com referência pendente: ${abrePendente}` : `cita entidade não apresentada: ${entidade}`
    });
  }
}

console.log('='.repeat(78));
console.log('F6-FIX §16 — AUDITORIA DE ÂNCORA BIOGRÁFICA');
console.log('='.repeat(78));
console.log(`eventos lidos ..................... ${MASTER_EVENTS_LIST.length}`);
console.log(`desfechos lidos ................... ${lidos}`);
console.log(`  com descricaoMemoria dedicada ... ${comMemoria}`);
console.log(`  com âncora no próprio texto ..... ${comAncora}`);
console.log(`  silêncio (nada a registrar) ..... ${silencio}`);
console.log(`  SUSPEITOS (ler à mão) ........... ${suspeitos.length}\n`);
for (const s of suspeitos) {
  console.log(`${s.evento} · ${s.opcao}  [${s.natureza}]`);
  console.log(`   evento : ${s.titulo}`);
  console.log(`   linha  : "${s.texto}"`);
  console.log(`   motivo : ${s.motivo}\n`);
}
