/**
 * VIDA 28 — ARQUÉTIPOS EMERGENTES: o perfil reconhecível de um atleta (o Matador, o Garçom, o Muralha, o Marrento, o
 * Capitão; o Pontuador do basquete, o Central Bloqueador do vôlei, o Sacador do tênis) — nunca sorteado, nunca escolhido
 * num menu. Ele SURGE da combinação do que já existe e é medido:
 *
 *   os atributos da posição/função (`atributosEsportivos`: o desvio de cada um em relação ao nível do atleta),
 *   a personalidade (disciplina, impulsividade, coragem, sociabilidade, empatia) e o estresse,
 *   a trajetória (idade, anos no clube, a braçadeira, as temporadas: gols, assistências, nota, títulos).
 *
 * Cada arquétipo é uma conta de pontos; o maior acima do limiar é o PRINCIPAL, e até dois outros acima do limiar são
 * características SECUNDÁRIAS. A leitura é refeita no fim de cada temporada: o perfil evolui (o garoto que vira o
 * Capitão; o Matador que, depois dos 32, vira o Cerebral) e a troca entra na História.
 *
 * E não é título decorativo — cada perfil tem EFEITOS que a temporada lê (`efeitosDoPerfil`):
 *   variancia     o ruído da nota (o Marrento oscila; o Cerebral e o Incansável não);
 *   titularidade  pontos na decisão do treinador (o Capitão e o Incansável ganham a confiança; o Marrento a gasta);
 *   imprensa      o nome no mercado (o Marrento e o Talento precoce rendem manchete);
 *   vestiario     a relação com os companheiros do elenco (`elenco28`): o Capitão aproxima, o Marrento desgasta;
 *   producao      o que o estilo produz a mais (o Matador finaliza; o Garçom serve; o Muralha segura o placar).
 *
 * Folha (só tipos e `clamp`): `esporte`, `elenco28`, a ficha e o e-sports leem daqui sem ciclo de chunks.
 */
import { clamp } from '../rng';
import type { Dominio } from '../tipos';

export interface EfeitosDoPerfil {
  /** Multiplica o ruído da nota da temporada (1 = como antes). */
  variancia?: number;
  /** Pontos na régua do treinador para ser titular (escala da técnica). */
  titularidade?: number;
  /** Pontos de reputação por temporada (o nome na imprensa e na torcida). */
  imprensa?: number;
  /** Proximidade (+) ou atrito (−) com os companheiros por temporada. */
  vestiario?: number;
  /** Multiplicadores da produção da temporada. */
  gols?: number;
  assistencias?: number;
  defesa?: number;
  /** A nota nas finais, nos jogos grandes (o Decisivo, o Clutch). */
  decisivo?: number;
}

/** O que a leitura do perfil precisa — montado por quem lê (o atleta, o jogador de e-sports, o piloto). */
export interface LeituraDoPerfil {
  modalidade: Dominio | 'esports' | 'automobilismo';
  /** A posição (futebol), a função (basquete, vôlei, e-sports), a categoria (luta). */
  papel?: string;
  /** O desvio de cada atributo em relação ao nível (positivo = ponto forte). Ausente = 0. */
  desvio: Partial<Record<string, number>>;
  /** O nível (0..100) contra a régua da divisão onde joga (positivo = acima dela). */
  acimaDaDivisao: number;
  tracos: Partial<Record<string, number>>;
  idade: number;
  /** Temporadas seguidas no clube de agora. */
  anosNoClube: number;
  capitao: boolean;
  /** Reserva no ano (o sexto homem sai do banco). */
  reserva: boolean;
  /** Médias das últimas temporadas (até 3): a nota e a produção por jogo. */
  nota?: number;
  golsPorJogo?: number;
  assistPorJogo?: number;
  /** Títulos e finais nas últimas 3 temporadas. */
  titulos?: number;
}

export interface Arquetipo {
  id: string;
  nome: [string, string];
  sobre: string;
  modalidades: (Dominio | 'esports' | 'automobilismo')[] | '*';
  /** Os papéis em que faz sentido (vazio = todos). */
  papeis?: string[];
  pontos: (x: LeituraDoPerfil) => number;
  efeitos: EfeitosDoPerfil;
}

const d = (x: LeituraDoPerfil, id: string) => x.desvio[id] ?? 0;
const t = (x: LeituraDoPerfil, id: string) => (x.tracos[id] ?? 0) / 25;
const soma = (x: LeituraDoPerfil, ids: [string, number][]) => ids.reduce((s, [id, w]) => s + d(x, id) * w, 0);

const FUT: Dominio[] = ['futebol', 'futsal'];
export const ARQUETIPOS: Arquetipo[] = [
  /* ------------------------------------------------ futebol (e futsal, onde cabe) */
  { id: 'matador', nome: ['Matador', 'Matadora'], modalidades: FUT, papeis: ['atacante', 'ponta', 'pivo'], sobre: 'Vive da finalização: precisa de meia chance para fazer o gol.',
    pontos: x => soma(x, [['finalizacao', 0.5], ['compostura', 0.25], ['movimentacao', 0.25]]) + (x.golsPorJogo ?? 0) * 6 - 1, efeitos: { gols: 1.08, imprensa: 1 } },
  { id: 'garcom', nome: ['Garçom', 'Garçonete'], modalidades: FUT, papeis: ['meia', 'ponta', 'lateral', 'ala_esquerda', 'ala_direita'], sobre: 'Joga para os outros: o último passe, a bola servida na medida.',
    pontos: x => soma(x, [['criacao', 0.4], ['passe', 0.3], ['visao', 0.2], ['cruzamento', 0.1]]) + (x.assistPorJogo ?? 0) * 8 - 1, efeitos: { assistencias: 1.1, vestiario: 1 } },
  { id: 'muralha', nome: ['Muralha', 'Muralha'], modalidades: FUT, papeis: ['goleiro', 'zagueiro', 'fixo'], sobre: 'Ninguém passa: a defesa do time começa (e termina) ali.',
    pontos: x => (x.papel === 'goleiro' ? soma(x, [['reflexos', 0.4], ['posicionamento', 0.3], ['saidas', 0.3]]) : soma(x, [['marcacao', 0.3], ['duelos', 0.3], ['aereo', 0.2], ['antecipacao', 0.2]])) - 0.5, efeitos: { defesa: 1.08, variancia: 0.9 } },
  { id: 'cerebral', nome: ['Cerebral', 'Cerebral'], modalidades: FUT, papeis: ['meia', 'volante', 'zagueiro', 'fixo'], sobre: 'Joga com a cabeça: lê o jogo antes dos outros e dita o ritmo.',
    pontos: x => soma(x, [['visao', 0.35], ['decisao', 0.35], ['passe_longo', 0.15], ['posicionamento', 0.15]]) + Math.max(0, x.idade - 29) * 0.4 - 0.5, efeitos: { variancia: 0.8 } },
  { id: 'incansavel', nome: ['Incansável', 'Incansável'], modalidades: FUT, papeis: ['lateral', 'volante', 'meia', 'ponta'], sobre: 'Corre o jogo inteiro e a temporada inteira; o treinador confia.',
    pontos: x => soma(x, [['resistencia', 0.5], ['determinacao', 0.3], ['cobertura', 0.2]]) + t(x, 'disciplina') - 0.5, efeitos: { titularidade: 1, variancia: 0.85 } },
  { id: 'bola_parada', nome: ['Especialista em bola parada', 'Especialista em bola parada'], modalidades: FUT, sobre: 'A falta, o escanteio, o pênalti: a bola parada é dele.',
    pontos: x => d(x, 'bola_parada') * 0.9 - 2.5, efeitos: { gols: 1.04, assistencias: 1.04 } },
  /* ------------------------------------------------ basquete */
  { id: 'pontuador', nome: ['Pontuador', 'Pontuadora'], modalidades: ['basquete'], sobre: 'A bola na mão dele vira ponto: de média, de três, no contra-ataque.',
    pontos: x => soma(x, [['arremesso', 0.45], ['tres_pontos', 0.4], ['compostura', 0.15]]) - 0.5, efeitos: { gols: 1.06, imprensa: 1 } },
  { id: 'armador_cerebral', nome: ['Armador cerebral', 'Armadora cerebral'], modalidades: ['basquete'], papeis: ['armador'], sobre: 'Organiza a quadra: o passe certo, a jogada que o técnico desenhou.',
    pontos: x => soma(x, [['passe', 0.3], ['visao', 0.3], ['decisao', 0.25], ['criacao', 0.15]]) - 0.5, efeitos: { assistencias: 1.1, variancia: 0.85 } },
  { id: 'defensor_perimetro', nome: ['Defensor de perímetro', 'Defensora de perímetro'], modalidades: ['basquete'], papeis: ['armador', 'ala'], sobre: 'Gruda no melhor arremessador do outro lado.',
    pontos: x => soma(x, [['defesa', 0.5], ['agilidade', 0.3], ['velocidade', 0.2]]) - 0.5, efeitos: { defesa: 1.08, titularidade: 0.5 } },
  { id: 'reboteiro', nome: ['Reboteiro', 'Reboteira'], modalidades: ['basquete'], papeis: ['pivo', 'ala'], sobre: 'Toda bola que sobra no garrafão é dele.',
    pontos: x => soma(x, [['rebote', 0.5], ['alcance', 0.25], ['forca', 0.25]]) - 0.5, efeitos: { defesa: 1.06 } },
  { id: 'sexto_homem', nome: ['Sexto homem', 'Sexta mulher'], modalidades: ['basquete', 'volei', 'futsal'], sobre: 'Sai do banco e muda o jogo — melhor como arma do que como titular.',
    pontos: x => (x.reserva && (x.nota ?? 0) >= 6.6 ? 2 + ((x.nota ?? 6.6) - 6.6) * 3 : -9), efeitos: { imprensa: 0.5, vestiario: 0.5 } },
  /* ------------------------------------------------ vôlei */
  { id: 'ponteiro_completo', nome: ['Ponteiro completo', 'Ponteira completa'], modalidades: ['volei'], papeis: ['ponteiro'], sobre: 'Passa e ataca: o jogador que o técnico não tira.',
    pontos: x => soma(x, [['ataque', 0.4], ['recepcao', 0.4], ['saque', 0.2]]) - 0.5, efeitos: { titularidade: 1, variancia: 0.9 } },
  { id: 'central_bloqueador', nome: ['Central bloqueador', 'Central bloqueadora'], modalidades: ['volei'], papeis: ['central'], sobre: 'Fecha a rede: o bloqueio que muda a cabeça do atacante.',
    pontos: x => soma(x, [['bloqueio', 0.6], ['alcance', 0.2], ['posicionamento', 0.2]]) - 0.5, efeitos: { defesa: 1.08 } },
  { id: 'levantador_estrategico', nome: ['Levantador estratégico', 'Levantadora estratégica'], modalidades: ['volei'], papeis: ['levantador'], sobre: 'Engana o bloqueio: a bola certa para quem está livre.',
    pontos: x => soma(x, [['levantamento', 0.5], ['decisao', 0.3], ['consistencia', 0.2]]) - 0.5, efeitos: { assistencias: 1.08, variancia: 0.85 } },
  { id: 'oposto_matador', nome: ['Oposto matador', 'Oposta matadora'], modalidades: ['volei'], papeis: ['oposto'], sobre: 'A bola da decisão vai para ele — e ele põe no chão.',
    pontos: x => soma(x, [['ataque', 0.5], ['saque', 0.25], ['compostura', 0.25]]) - 0.5, efeitos: { gols: 1.08, decisivo: 0.3 } },
  { id: 'libero_defensivo', nome: ['Líbero defensivo', 'Líbero defensiva'], modalidades: ['volei'], papeis: ['libero'], sobre: 'Nenhuma bola cai sem briga: a recepção e a defesa que seguram o time.',
    pontos: x => soma(x, [['recepcao', 0.5], ['defesa', 0.3], ['agilidade', 0.2]]) - 0.5, efeitos: { defesa: 1.08, variancia: 0.85 } },
  /* ------------------------------------------------ tênis */
  { id: 'agressivo_fundo', nome: ['Agressivo de fundo', 'Agressiva de fundo'], modalidades: ['tenis'], sobre: 'Toma a iniciativa do fundo: o forehand que encurta o ponto.',
    pontos: x => soma(x, [['forehand', 0.5], ['backhand', 0.2], ['saque', 0.15]]) + t(x, 'coragem') * 0.5 - 0.5, efeitos: { variancia: 1.15, imprensa: 0.5 } },
  { id: 'defensor_incansavel', nome: ['Defensor incansável', 'Defensora incansável'], modalidades: ['tenis'], sobre: 'Devolve tudo: o adversário precisa ganhar o ponto três vezes.',
    pontos: x => soma(x, [['resistencia', 0.35], ['agilidade', 0.25], ['consistencia', 0.25], ['devolucao', 0.15]]) - 0.5, efeitos: { variancia: 0.8 } },
  { id: 'sacador', nome: ['Sacador dominante', 'Sacadora dominante'], modalidades: ['tenis'], sobre: 'O saque ganha metade dos pontos antes de o ponto começar.',
    pontos: x => d(x, 'saque') * 0.8 + d(x, 'rede') * 0.2 - 1, efeitos: { decisivo: 0.2 } },
  { id: 'estrategista_tenis', nome: ['Estrategista', 'Estrategista'], modalidades: ['tenis'], sobre: 'Muda o plano no meio do jogo: lê o adversário e desmonta.',
    pontos: x => soma(x, [['decisao', 0.5], ['compostura', 0.3], ['consistencia', 0.2]]) + Math.max(0, x.idade - 26) * 0.3 - 0.5, efeitos: { variancia: 0.85, decisivo: 0.2 } },
  /* ------------------------------------------------ de todas as modalidades de equipe e de clube: a pessoa */
  { id: 'capitao', nome: ['Capitão', 'Capitã'], modalidades: '*', sobre: 'Puxa o grupo: a voz no vestiário, o primeiro a cobrar e a defender.',
    pontos: x => (x.capitao ? 2 : 0) + d(x, 'lideranca') * 0.4 + t(x, 'sociabilidade') * 0.6 + t(x, 'coragem') * 0.4 + Math.min(4, x.anosNoClube) * 0.4 + (x.idade >= 25 ? 0.5 : -2) - 2, efeitos: { vestiario: 2, titularidade: 1 } },
  { id: 'marrento', nome: ['Marrento', 'Marrenta'], modalidades: '*', sobre: 'Talento e língua solta: brilha, provoca, compra briga com treinador e imprensa.',
    pontos: x => t(x, 'impulsividade') * 1.1 + t(x, 'coragem') * 0.5 - t(x, 'empatia') * 0.5 + Math.max(0, x.acimaDaDivisao) * 0.12 - 1.8, efeitos: { variancia: 1.3, titularidade: -1.5, imprensa: 2, vestiario: -2 } },
  { id: 'talento_precoce', nome: ['Talento precoce', 'Talento precoce'], modalidades: '*', sobre: 'Joga como adulto antes da hora: o clube e o mercado olham para o futuro.',
    pontos: x => (x.idade <= 21 ? x.acimaDaDivisao * 0.25 + (21 - x.idade) * 0.3 : -9), efeitos: { imprensa: 1.5, titularidade: 0.5 } },
  { id: 'decisivo', nome: ['Jogador decisivo', 'Jogadora decisiva'], modalidades: '*', sobre: 'Aparece no jogo grande: a final, o mata-mata, o último minuto.',
    pontos: x => d(x, 'compostura') * 0.45 + d(x, 'concentracao') * 0.15 + (x.titulos ?? 0) * 0.8 + t(x, 'coragem') * 0.3 - 1.5, efeitos: { decisivo: 0.4, imprensa: 1 } },
  /* ------------------------------------------------ e-sports (a função do jogo e os atributos dele) */
  { id: 'entry', nome: ['Entry fragger', 'Entry fragger'], modalidades: ['esports'], papeis: ['entry', 'duelista'], sobre: 'Abre o round: o primeiro a entrar e o primeiro a trocar.',
    pontos: x => soma(x, [['mira', 0.45], ['reflexos', 0.35], ['movimentacao', 0.2]]) + t(x, 'coragem') * 0.5 - 0.5, efeitos: { variancia: 1.15, imprensa: 1 } },
  { id: 'igl', nome: ['IGL (capitão de jogo)', 'IGL (capitã de jogo)'], modalidades: ['esports'], sobre: 'Faz as calls: lê o adversário e conduz a equipe dentro da partida.',
    pontos: x => soma(x, [['comunicacao', 0.4], ['estrategia', 0.3], ['decisao', 0.2], ['leitura', 0.1]]) + t(x, 'sociabilidade') * 0.4 + (x.papel === 'igl' ? 1 : 0) - 0.5, efeitos: { vestiario: 1.5, titularidade: 1 } },
  { id: 'awper', nome: ['AWPer', 'AWPer'], modalidades: ['esports'], papeis: ['awp', 'awper', 'sniper'], sobre: 'O rifle de precisão: um tiro, um abate, o mapa trancado.',
    pontos: x => soma(x, [['mira', 0.6], ['posicionamento', 0.4]]) - 0.3, efeitos: { imprensa: 1 } },
  { id: 'suporte', nome: ['Suporte', 'Suporte'], modalidades: ['esports'], papeis: ['suporte', 'support', 'sentinela'], sobre: 'Joga para os outros brilharem: a granada certa, a visão do mapa.',
    pontos: x => soma(x, [['utilitarios', 0.4], ['comunicacao', 0.3], ['equipe', 0.3]]) + t(x, 'empatia') * 0.4 - 0.5, efeitos: { vestiario: 1.5, variancia: 0.85 } },
  { id: 'clutch', nome: ['Clutch player', 'Clutch player'], modalidades: ['esports'], sobre: 'Sozinho contra três, no último round, com o chat gritando: é quando ele aparece.',
    pontos: x => soma(x, [['mental', 0.6], ['consistencia', 0.4]]) + (x.titulos ?? 0) * 0.6 - 0.8, efeitos: { decisivo: 0.4, imprensa: 1 } },
  /* ------------------------------------------------ automobilismo (os atributos do piloto) */
  { id: 'classificador', nome: ['Classificador', 'Classificadora'], modalidades: ['automobilismo'], sobre: 'A volta lançada perfeita: larga na frente.',
    pontos: x => d(x, 'classificacao') * 0.8 + d(x, 'pilotagem') * 0.2 - 1, efeitos: {} },
  { id: 'ultrapassador', nome: ['Especialista em ultrapassagens', 'Especialista em ultrapassagens'], modalidades: ['automobilismo'], sobre: 'Larga atrás e chega na frente: a freada no limite, o espaço que ninguém viu.',
    pontos: x => d(x, 'ultrapassagem') * 0.8 + t(x, 'coragem') * 0.4 - 1, efeitos: { imprensa: 1 } },
  { id: 'gestor_pneus', nome: ['Gestor de pneus', 'Gestora de pneus'], modalidades: ['automobilismo'], sobre: 'Faz o pneu durar: o ritmo que cresce quando os outros caem.',
    pontos: x => d(x, 'pneus') * 0.7 + d(x, 'consistencia') * 0.3 - 1, efeitos: { variancia: 0.85 } },
  { id: 'estrategista_pista', nome: ['Estrategista', 'Estrategista'], modalidades: ['automobilismo'], sobre: 'Lê a corrida: a parada na hora certa, a chuva que vem, o combustível que sobra.',
    pontos: x => d(x, 'leitura') * 0.6 + d(x, 'adaptacao') * 0.4 + Math.max(0, x.idade - 25) * 0.25 - 1, efeitos: { variancia: 0.85 } },
  { id: 'agressivo_pista', nome: ['Piloto agressivo', 'Pilota agressiva'], modalidades: ['automobilismo'], sobre: 'Ataca sempre: ganha posições — e às vezes perde o carro.',
    pontos: x => t(x, 'impulsividade') * 0.8 + t(x, 'coragem') * 0.6 + d(x, 'ultrapassagem') * 0.2 - 1.2, efeitos: { variancia: 1.3, imprensa: 1 } }
];
export const arquetipo = (id: string) => ARQUETIPOS.find(a => a.id === id);

/** O limiar: abaixo disso, não é um traço reconhecível (o atleta "comum" não tem rótulo). */
const LIMIAR = 1;

export interface PerfilEmergente { principal?: string; secundarios: string[]; pontos: Record<string, number> }

/** A leitura: os arquétipos possíveis para a modalidade e o papel, pontuados; o principal e até dois secundários. */
export function lerPerfil(x: LeituraDoPerfil): PerfilEmergente {
  const pontos: Record<string, number> = {};
  for (const a of ARQUETIPOS) {
    if (a.modalidades !== '*' && !a.modalidades.includes(x.modalidade)) continue;
    // Os da pessoa (capitão, marrento, precoce, decisivo) valem em todo esporte; mas o e-sports e o automobilismo têm os seus.
    if (a.papeis?.length && x.papel && !a.papeis.includes(x.papel)) continue;
    if (a.papeis?.length && !x.papel && a.modalidades !== '*' && x.modalidade !== 'esports') continue;
    pontos[a.id] = Math.round(a.pontos(x) * 100) / 100;
  }
  const lista = Object.entries(pontos).filter(([, p]) => p >= LIMIAR).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  return { principal: lista[0], secundarios: lista.slice(1, 3), pontos };
}

/**
 * Os efeitos somados do perfil: o principal inteiro, cada secundário pela metade (o traço que aparece às vezes).
 * Multiplicadores combinam por produto; pontos, por soma — e tudo tem teto (o perfil pesa, não decide sozinho).
 */
export function efeitosDoPerfil(p: { principal?: string; secundarios?: string[] } | undefined): Required<EfeitosDoPerfil> {
  const r: Required<EfeitosDoPerfil> = { variancia: 1, titularidade: 0, imprensa: 0, vestiario: 0, gols: 1, assistencias: 1, defesa: 1, decisivo: 0 };
  if (!p?.principal) return r;
  const ids: [string, number][] = [[p.principal, 1], ...(p.secundarios ?? []).map(id => [id, 0.5] as [string, number])];
  for (const [id, w] of ids) {
    const e = arquetipo(id)?.efeitos;
    if (!e) continue;
    if (e.variancia) r.variancia *= 1 + (e.variancia - 1) * w;
    if (e.gols) r.gols *= 1 + (e.gols - 1) * w;
    if (e.assistencias) r.assistencias *= 1 + (e.assistencias - 1) * w;
    if (e.defesa) r.defesa *= 1 + (e.defesa - 1) * w;
    r.titularidade += (e.titularidade ?? 0) * w;
    r.imprensa += (e.imprensa ?? 0) * w;
    r.vestiario += (e.vestiario ?? 0) * w;
    r.decisivo += (e.decisivo ?? 0) * w;
  }
  r.variancia = clamp(r.variancia, 0.7, 1.4);
  r.titularidade = clamp(r.titularidade, -2, 2);
  return r;
}

/** O nome do arquétipo no gênero de quem é. */
export const nomeDoArquetipo = (id: string, genero?: string) => { const a = arquetipo(id); return a ? a.nome[genero === 'feminino' ? 1 : 0] : id; };

/** O perfil guardado na carreira (o principal, os secundários, desde quando e a história das trocas). */
export interface PerfilGuardado { principal?: string; secundarios: string[]; desde: number; historico?: { ano: number; principal?: string }[] }

/**
 * Guarda a leitura nova e diz se o principal mudou (quem chama escreve a mudança na História). A história guarda até
 * 12 trocas. Devolve o principal anterior quando houve troca (ou `null` na primeira vez que um perfil aparece).
 */
export function guardarPerfil(antes: PerfilGuardado | undefined, novo: PerfilEmergente, ano: number, t: number): { perfil: PerfilGuardado; mudou: boolean; anterior?: string } {
  const mudou = (antes?.principal ?? undefined) !== novo.principal;
  const historico = [...(antes?.historico ?? [])];
  if (mudou) { historico.push({ ano, principal: novo.principal }); if (historico.length > 12) historico.splice(0, historico.length - 12); }
  return { perfil: { principal: novo.principal, secundarios: novo.secundarios, desde: mudou ? t : antes?.desde ?? t, historico }, mudou, anterior: antes?.principal };
}

/** O que o perfil FAZ, em palavras (a ficha diz o efeito; nunca o número). */
export function oQueOPerfilFaz(p: { principal?: string; secundarios?: string[] } | undefined): string[] {
  const e = efeitosDoPerfil(p);
  const out: string[] = [];
  if (e.variancia < 0.95) out.push('rende sem altos e baixos');
  if (e.variancia > 1.05) out.push('oscila mais de um jogo para outro');
  if (e.gols > 1.02) out.push('finaliza mais');
  if (e.assistencias > 1.02) out.push('serve mais os companheiros');
  if (e.defesa > 1.02) out.push('segura mais o adversário');
  if (e.decisivo > 0.05) out.push('cresce nos jogos grandes');
  if (e.titularidade > 0.2) out.push('ganha a confiança do treinador');
  if (e.titularidade < -0.2) out.push('gasta a paciência do treinador');
  if (e.imprensa > 0.2) out.push('rende manchete');
  if (e.vestiario > 0.2) out.push('aproxima o grupo');
  if (e.vestiario < -0.2) out.push('desgasta o vestiário');
  return out;
}
