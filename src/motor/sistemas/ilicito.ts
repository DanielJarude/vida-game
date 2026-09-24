/**
 * Envolvimento com atividade ilegal: OPORTUNIDADE → DECISÃO → RISCO → CONSEQUÊNCIA.
 *
 * Não existe profissão "criminoso" nem tutorial. O jogo nunca descreve como
 * se faz, se esconde, se vende ou se engana: fala em "um esquema", "um
 * dinheiro por fora", "gente que você preferia não conhecer". O que ele
 * modela é o que acontece com uma vida que passa por isso.
 *
 * ENTRADA — contextual e rara. Pesam: quem está por perto (a turma, um
 * conhecido, um contato antigo), a necessidade (desemprego longo, contas
 * atrasadas), o impulso (traço construído por escolhas), o ambiente (bairro,
 * cidade grande), o passado (quem já esteve dentro reencontra quem estava
 * junto). Pesam CONTRA: trabalho formal, gente de apoio, estudo indo bem,
 * disciplina. Pobreza muda a oportunidade, não o destino: ninguém é
 * empurrado — a porta aparece e a decisão é do jogador. E gente com
 * dinheiro também erra: quem tem acesso (finanças, escritório, serviço
 * público, o próprio negócio) pode ser chamado para uma fraude.
 *
 * DEPOIS — dinheiro rápido e exposição que cresce ano a ano; a cada tanto,
 * decidir: seguir, ir mais fundo ou parar. Parar é possível sempre (num
 * grupo, custa pressão; mudar de cidade corta os contatos). O passado não
 * some: a exposição acumulada ainda pode virar processo depois de parar.
 * Descoberta abre processo (`justica.ts`).
 *
 * Balanço: nunca uma estratégia melhor de enriquecer. O ganho tem teto e a
 * conta chega — em anos de prisão, emprego perdido, antecedentes, pessoas.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { CategoriaIlicita, Envolvimento, Pessoa, Vida } from '../tipos';
import { escrever, idade, idadePessoa, marcarFato, parceiro, vinculosVivos } from '../nucleo';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { nivelDeOferta } from '../dados/lugares';
import { seguranca } from './dinheiro';
import { redeDeApoio } from './estado';
import { abalar } from './abalo';
import { abrirProcesso, preso, reincidente } from './justica';
import { marcar } from './marcas';
import { flex, ge } from '../texto';
import { criarPessoa, vincular } from '../pessoas';

/** Renda mensal por categoria e nível (reais de hoje): dinheiro rápido, com teto. */
const RENDA: Record<CategoriaIlicita, [number, number, number]> = {
  pequenos: [120, 250, 400], patrimonial: [700, 1400, 2400], fraude: [1500, 3200, 5500], mercado: [1100, 2600, 4800], grupo: [2000, 3600, 5600]
};
const EXPOSICAO: Record<CategoriaIlicita, number> = { pequenos: 14, patrimonial: 14, fraude: 12, mercado: 18, grupo: 24 };
const DESCOBERTA: Record<1 | 2 | 3, number> = { 1: 0.3, 2: 0.42, 3: 0.52 };

export const ativo = (v: Vida) => { const e = v.caminhos.envolvimento; return !!e && e.parou === undefined; };

/** Acesso a dinheiro que não é seu: o que torna uma fraude possível (sem dizer como). */
function temAcesso(v: Vida): boolean {
  const e = v.trabalho.atual;
  if (v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado') return true;
  if (!e) return false;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  if (!oc) return false;
  return ['financas', 'contabil', 'publico', 'fiscal', 'judiciario'].includes(oc.trilha) || (['administrativo', 'logistica'].includes(oc.trilha) && oc.nivel >= 2) || (oc.trilha === 'comercio' && oc.nivel >= 3);
}

/** Quem, da vida real do jogador, poderia trazer a proposta. */
function contatoPossivel(v: Vida): Pessoa | undefined {
  const i = idade(v);
  const antigo = v.caminhos.envolvimento?.contatoId;
  if (antigo && v.pessoas[antigo]?.vivo) return v.pessoas[antigo];
  return vinculosVivos(v)
    .filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && x.p.municipioId === v.moradia.municipioId && Math.abs(idadePessoa(v, x.p) - i) <= 12 && idadePessoa(v, x.p) >= 14)
    .filter(x => x.p.temperamento.responsabilidade < -0.25)
    .sort((a, b) => a.p.temperamento.responsabilidade - b.p.temperamento.responsabilidade)[0]?.p;
}

/** A chance de uma porta dessas aparecer neste ano — pequena, e feita de contexto. */
export function chanceDeProposta(v: Vida): number {
  const i = idade(v);
  if (i < 13 || i > 72 || preso(v) || v.justica?.processo || ativo(v)) return 0;
  const ult = v.caminhos.ultimas['proposta_ilicita'];
  const egresso = v.justica?.tSaida !== undefined;
  if (ult !== undefined && v.t - ult < (egresso ? 36 : 60)) return 0;
  const t = v.personalidade.tracos;
  const e = v.trabalho.atual;
  let p = 0.0012;
  if (i >= 14 && i <= 22) p += 0.004;
  if (!e && v.trabalho.desempregadoDesde !== undefined && v.t - v.trabalho.desempregadoDesde >= 12 && i >= 18) p += 0.006;
  if (seguranca(v).nivel === 'no_vermelho') p += 0.006;
  p += 0.006 * clamp(t.impulsividade / 40, -0.5, 1.5);
  if (v.moradia.padrao <= 2) p += 0.002;
  if (nivelDeOferta(v.moradia.municipioId) >= 2) p += 0.0015;
  if (egresso || v.caminhos.envolvimento) p += 0.012;
  if (contatoPossivel(v)) p += 0.004;
  if (temAcesso(v)) p += 0.004;
  // O que protege.
  if (e && ['clt', 'servidor', 'militar'].includes(e.contrato)) p -= 0.003;
  if (redeDeApoio(v) >= 2) p -= 0.002;
  if (v.educacao.basica && v.educacao.basica.desempenho >= 60) p -= 0.002;
  p -= 0.003 * clamp(t.disciplina / 40, -0.5, 1.5);
  p -= 0.002 * clamp(t.empatia / 40, -0.5, 1.5);
  return clamp(p, 0, 0.05);
}

/** Qual tipo de porta faz sentido nesta vida (a cena, não o método). */
export function categoriaPara(v: Vida, r: Rng): CategoriaIlicita {
  const i = idade(v);
  if (i < 18) return 'pequenos';
  if (temAcesso(v) && (r.chance(0.7) || seguranca(v).nivel === 'no_vermelho')) return 'fraude';
  if (v.caminhos.envolvimento?.categoria === 'mercado' || v.caminhos.envolvimento?.categoria === 'grupo') return 'mercado';
  return r.chance(nivelDeOferta(v.moradia.municipioId) >= 2 || v.moradia.padrao <= 2 ? 0.45 : 0.25) ? 'mercado' : 'patrimonial';
}

/* ---------------------------------------------------------------- O ano */

/**
 * Antes do conteúdo: renda, exposição, riscos e descoberta de quem está
 * envolvido; e, para quem não está, a chance de a porta aparecer (vira uma
 * decisão prioritária, com a pessoa que trouxe a proposta).
 */
export function processarIlicito(v: Vida, r: Rng): void {
  const env = v.caminhos.envolvimento;
  if (env) anoEnvolvido(v, r, env);
  if (!ativo(v) && !v.momento && r.chance(chanceDeProposta(v))) {
    const cat = categoriaPara(v, r);
    let contato = contatoPossivel(v);
    if (!contato && cat !== 'fraude') {
      const i = idade(v);
      contato = criarPessoa(v, r, { genero: r.chance(0.6) ? 'masculino' : 'feminino', idade: Math.max(15, i + r.int(-2, 8)), municipioId: v.moradia.municipioId });
      contato.temperamento.responsabilidade = -0.6;
      vincular(v, contato, { origem: 'vizinhanca', estagio: 'colega', proximidade: 42, convivio: ['vizinhanca'] });
    }
    v.fatos['proposta_ilicita'] = v.t;
    v.fatos['proposta_categoria'] = CATEGORIAS.indexOf(cat);
    for (const k of Object.keys(v.fatos)) if (k.startsWith('proposta_de_')) delete v.fatos[k];
    if (contato) v.fatos[`proposta_de_${contato.id}`] = v.t;
    v.caminhos.ultimas['proposta_ilicita'] = v.t;
  }
}

export const CATEGORIAS: CategoriaIlicita[] = ['pequenos', 'patrimonial', 'fraude', 'mercado', 'grupo'];

function anoEnvolvido(v: Vida, r: Rng, env: Envolvimento): void {
  if (preso(v)) return;
  if (env.parou !== undefined) {
    // O passado esfria devagar — mas pode chegar.
    if (env.exposicao > 4 && r.chance(env.exposicao / 100 * 0.18)) {
      escrever(v, { texto: 'Uma investigação antiga chegou até você, anos depois de ter parado.', relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
      abrirProcesso(v, r, env.categoria);
      return;
    }
    env.exposicao = Math.round(env.exposicao * 0.6);
    return;
  }
  const renda = RENDA[env.categoria][env.nivel - 1];
  const ganho = Math.round(renda * 12 * (0.6 + r.next() * 0.8) / 100) * 100;
  v.financas.conta += ganho;
  env.ganhos += ganho;
  env.exposicao = clamp(env.exposicao + EXPOSICAO[env.categoria] + (env.nivel - 1) * 6 + (reincidente(v) ? 6 : 0));
  // A cabeça de quem vive com medo de ser descoberto; a casa que desconfia.
  abalar(v, 'o que se faz por fora', 0, 4 + env.nivel * 2);
  const par = parceiro(v);
  if (par) par.vin.tensao = clamp(par.vin.tensao + 4 + env.nivel * 2);
  // Riscos do caminho (sem cena): uma confusão, um susto.
  if ((env.categoria === 'mercado' || env.categoria === 'grupo') && r.chance(0.08 + env.nivel * 0.04)) {
    const grave = r.chance(0.2);
    v.corpo.saude = clamp(v.corpo.saude - (grave ? 22 : 7));
    escrever(v, { texto: grave ? 'Uma confusão com gente do esquema terminou no pronto-socorro. Meses para se recuperar.' : 'Um susto com gente do esquema. Ninguém se machucou de verdade, dessa vez.', relevancia: grave ? 'marco' : 'biografia', tema: 'saude', tom: 'ruim' });
    abalar(v, 'o susto', -6, 10);
  }
  // Descoberta: a exposição acumulada é o que pesa.
  if (r.chance(env.exposicao / 100 * DESCOBERTA[env.nivel])) { abrirProcesso(v, r, env.categoria); return; }
  // A cada dois anos, a vida pergunta de novo.
  if ((v.t - env.tInicio) % 24 === 12 || (v.t - env.tInicio) === 12) v.fatos['ilic_rumo'] = v.t;
}

/* ------------------------------------------------------------ Escolhas */

export function entrar(v: Vida, cat: CategoriaIlicita, contatoId: string | undefined, r: Rng): void {
  const antes = v.caminhos.envolvimento;
  v.caminhos.envolvimento = { categoria: cat, nivel: 1, tInicio: v.t, exposicao: Math.round((antes?.exposicao ?? 0) * 0.5) + 8, contatoId, ganhos: antes?.ganhos ?? 0 };
  const primeiro = Math.round(RENDA[cat][0] * (2 + r.next() * 2) / 100) * 100;
  v.financas.conta += primeiro;
  v.caminhos.envolvimento.ganhos += primeiro;
  v.fatos['vezes_envolvido'] = (v.fatos['vezes_envolvido'] ?? 0) + 1;
  marcarFato(v, 'envolveu_se');
  if (antes) marcarFato(v, 'reincidiu');
  marcar(v, 'desvio', antes ? 'Voltou a se envolver com o que tinha deixado.' : 'Entrou num esquema ilegal.', 2);
}

export function escalar(v: Vida): void {
  const e = v.caminhos.envolvimento;
  if (!e || e.parou !== undefined || e.nivel >= 3) return;
  e.nivel = (e.nivel + 1) as 2 | 3;
  if (e.nivel === 3 && e.categoria === 'mercado') e.categoria = 'grupo';
  e.exposicao = clamp(e.exposicao + 8);
}

export function parar(v: Vida, motivo: string): void {
  const e = v.caminhos.envolvimento;
  if (!e || e.parou !== undefined) return;
  e.parou = v.t;
  marcarFato(v, 'saiu_do_esquema');
  if (e.nivel === 3) v.fatos['pressao_grupo'] = v.t;
  const texto = `Largou o esquema${motivo ? `: ${motivo}` : ''}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'trabalho', escolha: true });
  marcar(v, 'recomeco', texto, 3);
}

/** Uma frase, para a tela (só quem está envolvido vê). */
export function leituraDoEnvolvimento(v: Vida): string | undefined {
  const e = v.caminhos.envolvimento;
  if (!e || e.parou !== undefined) return undefined;
  const risco = e.exposicao < 25 ? 'por enquanto, pouca gente sabe' : e.exposicao < 55 ? 'gente demais já sabe' : 'é questão de tempo até alguém chegar';
  return `Há um dinheiro entrando por fora, ${e.nivel === 1 ? 'de vez em quando' : e.nivel === 2 ? 'com frequência' : 'e um grupo que conta com você'}: ${risco}.`;
}

export { flex, ge };
