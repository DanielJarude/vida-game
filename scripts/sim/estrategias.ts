/**
 * Estratégias de jogador para o simulador. Cada uma escolhe ações no ano e
 * responde às decisões. Não são "jogadores ótimos": são jeitos de viver.
 */

import type { Rng } from '../../src/motor/rng';
import type { Momento, Vida } from '../../src/motor/tipos';
import type { Acao } from '../../src/motor/acoes';
import { disponibilidade, opcoesDeCurso, opcoesDeAluguel } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { idade, idadePessoa, parceiro, vinculosVivos, filhos } from '../../src/motor/nucleo';
import { OCUPACOES } from '../../src/motor/dados/ocupacoes';
import { saldoMensal } from '../../src/motor/sistemas/dinheiro';
import { moraComFamiliaDeOrigem } from '../../src/motor/sistemas/domicilio';

export interface Estrategia {
  nome: string;
  agir(v: Vida, r: Rng): Acao[];
  decidir(v: Vida, m: Momento, r: Rng): string;
}

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

/** Preferências de uma estratégia sobre as opções das decisões (por id). */
function escolher(m: Momento, r: Rng, pref: string[]): string {
  const livres = m.opcoes.filter(o => !o.bloqueio);
  for (const p of pref) {
    const o = livres.find(x => x.id === p || x.id.startsWith(p));
    if (o) return o.id;
  }
  return r.pick(livres.length ? livres : m.opcoes).id;
}

interface Perfil {
  nome: string;
  rotinas: string[];
  postura: Vida['educacao']['postura'];
  estudo: 'alto' | 'medio' | 'baixo';
  trilhas: string[];     // trilhas de trabalho preferidas
  social: number;        // interações com pessoas por ano
  romance: boolean;
  filhos: boolean;
  estilo: Vida['financas']['estilo'];
  poupa: boolean;
  preferencias: string[];
  saiDeCasaAos: number;
}

const PERFIS: Perfil[] = [
  { nome: 'passivo', rotinas: [], postura: 'normal', estudo: 'baixo', trilhas: [], social: 0, romance: false, filhos: false, estilo: 'modesto', poupa: false, preferencias: [], saiDeCasaAos: 99 },
  { nome: 'familiar', rotinas: ['igreja', 'tempo_familia'], postura: 'normal', estudo: 'medio', trilhas: ['administrativo', 'comercio', 'educacao', 'enfermagem'], social: 3, romance: true, filhos: true, estilo: 'modesto', poupa: true, preferencias: ['sim', 'contar', 'chamar', 'ouvir', 'conversar', 'revezar', 'mensal', 'trazer', 'cartorio', 'familia', 'publica', 'enem', 'ficar'], saiDeCasaAos: 23 },
  { nome: 'ambicioso', rotinas: ['ingles', 'academia'], postura: 'dedicada', estudo: 'alto', trilhas: ['ti', 'direito', 'engenharia', 'financas', 'administrativo', 'medicina'], social: 1, romance: true, filhos: false, estilo: 'confortavel', poupa: true, preferencias: ['aceitar', 'preparo', 'negociar', 'enem', 'recusar', 'ainda_nao', 'nao_agora', 'particular', 'seguir', 'guardar', 'privada'], saiDeCasaAos: 22 },
  { nome: 'estudioso', rotinas: ['leitura', 'musica'], postura: 'dedicada', estudo: 'alto', trilhas: ['educacao', 'psicologia', 'medicina', 'ti'], social: 1, romance: true, filhos: true, estilo: 'modesto', poupa: true, preferencias: ['recusar', 'preparo', 'enem', 'ouvir', 'sim', 'guardar', 'desligar', 'publica', 'ficar'], saiDeCasaAos: 24 },
  { nome: 'impulsivo', rotinas: ['sair_noite', 'videogame'], postura: 'relaxada', estudo: 'baixo', trilhas: ['comercio', 'alimentacao', 'transporte', 'construcao'], social: 3, romance: true, filhos: true, estilo: 'confortavel', poupa: false, preferencias: ['escondido', 'beber', 'puxar', 'copiar', 'revidar', 'gritar', 'confianca', 'passar', 'festao', 'entrar', 'trair', 'pedir_conta', 'largar', 'chamar'], saiDeCasaAos: 19 },
  { nome: 'social', rotinas: ['futebol', 'sair_noite', 'voluntariado'], postura: 'normal', estudo: 'medio', trilhas: ['comercio', 'administrativo', 'alimentacao', 'educacao'], social: 5, romance: true, filhos: true, estilo: 'confortavel', poupa: false, preferencias: ['chamar', 'revezar', 'defender', 'aceitar', 'festa', 'cafe', 'confianca', 'grupo', 'tirar', 'indicar', 'emprestar'], saiDeCasaAos: 22 },
  { nome: 'antissocial', rotinas: ['videogame', 'leitura'], postura: 'normal', estudo: 'medio', trilhas: ['ti', 'administrativo', 'manutencao'], social: 0, romance: false, filhos: false, estilo: 'modesto', poupa: true, preferencias: ['guardar', 'soltar', 'passar', 'fones', 'ficar', 'nada', 'ignorar', 'coberta', 'olhar', 'sinceridade'], saiDeCasaAos: 30 },
  { nome: 'economico', rotinas: ['corrida'], postura: 'dedicada', estudo: 'medio', trilhas: ['administrativo', 'publico', 'financas', 'manutencao'], social: 1, romance: true, filhos: true, estilo: 'apertado', poupa: true, preferencias: ['cartorio', 'guardar', 'desligar', 'recusar', 'publica', 'negar', 'sus', 'preparo'], saiDeCasaAos: 27 },
  { nome: 'gastador', rotinas: ['sair_noite', 'academia'], postura: 'relaxada', estudo: 'baixo', trilhas: ['comercio', 'administrativo', 'beleza'], social: 3, romance: true, filhos: true, estilo: 'folgado', poupa: false, preferencias: ['festao', 'praia', 'entrar', 'emprestar', 'confianca', 'particular', 'privada'], saiDeCasaAos: 20 },
  { nome: 'ascensao', rotinas: ['estudar_concurso', 'ingles'], postura: 'dedicada', estudo: 'alto', trilhas: ['publico', 'ti', 'administrativo', 'enfermagem', 'direito'], social: 1, romance: true, filhos: true, estilo: 'apertado', poupa: true, preferencias: ['enem', 'ficar', 'preparo', 'aceitar', 'cartorio', 'recusar', 'desligar', 'publica', 'sus'], saiDeCasaAos: 25 }
];

export const NOMES_ESTRATEGIAS = PERFIS.map(p => p.nome);

export function estrategia(nome: string): Estrategia {
  const p = PERFIS.find(x => x.nome === nome) ?? PERFIS[0];
  return {
    nome: p.nome,
    decidir: (_v, m, r) => escolher(m, r, p.preferencias),
    agir: (v, r) => {
      const i = idade(v);
      const out: Acao[] = [];
      if (p.nome === 'passivo') return out;
      // Postura nos estudos
      if ((v.educacao.basica || v.educacao.matricula) && v.educacao.postura !== p.postura) out.push({ tipo: 'postura', valor: p.postura });
      // Rotinas
      for (const id of p.rotinas) if (tenta(v, { tipo: 'rotina', id, ativa: true })) out.push({ tipo: 'rotina', id, ativa: true });
      if (i >= 16 && i <= 18 && p.estudo === 'alto' && !v.educacao.matricula && tenta(v, { tipo: 'rotina', id: 'cursinho', ativa: true }) && v.educacao.enem.length > 0) out.push({ tipo: 'rotina', id: 'cursinho', ativa: true });
      if (v.educacao.matricula) out.push({ tipo: 'rotina', id: 'cursinho', ativa: false });
      // ENEM e faculdade
      if (i >= 17 && i <= 30 && p.estudo !== 'baixo' && !v.educacao.matricula && !v.educacao.concluidos.some(c => c.nivel === 'superior')) {
        if (tenta(v, { tipo: 'enem' })) out.push({ tipo: 'enem' });
      }
      // Pessoas
      const gente = vinculosVivos(v).filter(x => !x.p.especie && (x.vin.parentesco || x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo' || x.vin.estagio === 'colega' || x.vin.romance));
      const alvos = r.pick([true, false]) ? gente.sort((a, b) => b.vin.proximidade - a.vin.proximidade) : gente;
      let n = 0;
      const par = parceiro(v);
      if (par && p.social > 0) { out.push({ tipo: 'pessoa', pessoaId: par.p.id, interacao: 'tempo' }); n++; }
      for (const f of filhos(v)) if (p.filhos && n < p.social + 1) { out.push({ tipo: 'pessoa', pessoaId: f.id, interacao: 'tempo' }); n++; }
      for (const x of alvos) {
        if (n >= p.social) break;
        out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: r.chance(0.7) ? 'tempo' : 'conversar' });
        n++;
      }
      // Romance: avançar etapas
      if (p.romance) {
        for (const x of vinculosVivos(v)) {
          const rom = x.vin.romance;
          if (!rom) continue;
          if (rom.estagio === 'saindo') out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'pedir_namoro' });
          if (rom.estagio === 'namoro' && i >= 22) out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'morar_junto' });
          if ((rom.estagio === 'namoro' || rom.estagio === 'morando_junto') && i >= 25 && p.nome !== 'antissocial') out.push({ tipo: 'pessoa', pessoaId: x.p.id, interacao: 'pedir_casamento' });
        }
        if (!par && i >= 18 && r.chance(0.35)) {
          const alvo = vinculosVivos(v).find(x => !x.vin.parentesco && !x.vin.romance && (x.vin.estagio === 'amigo' || x.vin.estagio === 'colega'));
          if (alvo) out.push({ tipo: 'pessoa', pessoaId: alvo.p.id, interacao: 'convidar' });
        }
      }
      if (p.filhos && par && i >= 26 && i <= 40 && filhos(v).length < 2) out.push({ tipo: 'filhos', plano: 'tentando' });
      if (par && filhos(v).length >= 2) out.push({ tipo: 'filhos', plano: 'evitando' });

      if (v.educacao.matricula?.trancado && p.estudo !== 'baixo' && saldoMensal(v).renda >= saldoMensal(v).despesa && tenta(v, { tipo: 'destrancar' })) out.push({ tipo: 'destrancar' });
      // Faculdade: escolher uma opção viável
      if (i >= 17 && p.estudo !== 'baixo' && !v.educacao.matricula) {
        const opcoes = opcoesDeCurso(v).map((o, idx) => ({ o, idx }))
          .filter(x => podeTentar(x.o.veredito) && (x.o.curso.nivel === 'superior' || (p.estudo === 'medio' && x.o.curso.nivel === 'tecnico') || (x.o.curso.nivel !== 'tecnico' && v.educacao.concluidos.some(c => c.nivel === 'superior') && p.estudo === 'alto' && i < 35)))
          .filter(x => !v.educacao.concluidos.some(c => c.nivel === 'superior') || x.o.curso.nivel !== 'superior')
          .filter(x => x.o.curso.nivel !== 'tecnico' || !v.educacao.concluidos.some(c => c.nivel === 'tecnico' || c.nivel === 'superior'))
          .filter(x => x.o.curso.nivel === 'superior' || x.o.curso.nivel === 'tecnico' || i < 32)
          .filter(x => x.o.mensalidade <= Math.max(400, saldoMensal(v).renda * 0.3) || x.o.via === 'sisu' || x.o.via === 'prouni' || x.o.via === 'fies' || x.o.via === 'selecao_publica');
        // Quem pode tenta a pública presencial; EAD paga é o plano B.
        const ordemVia = p.estudo === 'alto' ? { sisu: 5, prouni: 4, selecao_publica: 4, fies: 3, privada: 2, ead: 1 } : { sisu: 4, selecao_publica: 4, prouni: 3, ead: 3, fies: 2, privada: 2 };
        const nota = (x: typeof opcoes[number]) => ordemVia[x.o.via] + (x.o.veredito.chance ?? 0) * 2;
        const preferidas = opcoes.sort((a, b) => nota(b) - nota(a));
        if (preferidas.length) out.push({ tipo: 'matricular', indice: preferidas[0].idx });
      }
      // Trabalho
      if (i >= 16 && (!v.trabalho.atual || v.trabalho.atual.contrato === 'aprendiz' || v.trabalho.atual.contrato === 'informal') && !v.trabalho.aposentadoria) {
        const estudandoIntegral = v.educacao.matricula && ['medicina', 'eng_civil', 'computacao'].includes(v.educacao.matricula.cursoId);
        if (!estudandoIntegral || i >= 22) {
          const vagas = OCUPACOES.filter(o => tenta(v, { tipo: 'candidatar', ocupacaoId: o.id }))
            .filter(o => i >= 18 || o.contrato === 'aprendiz' || o.contrato === 'estagio')
            .sort((a, b) => (p.trilhas.includes(b.trilha) ? 10 : 0) + b.nivel - ((p.trilhas.includes(a.trilha) ? 10 : 0) + a.nivel));
          if (vagas.length) out.push({ tipo: 'candidatar', ocupacaoId: vagas[0].id });
        }
      } else if (v.trabalho.atual && p.nome === 'ambicioso' && r.chance(0.4)) {
        const atual = OCUPACOES.find(o => o.id === v.trabalho.atual!.ocupacaoId)!;
        const melhor = OCUPACOES.filter(o => o.nivel > atual.nivel && tenta(v, { tipo: 'candidatar', ocupacaoId: o.id })).sort((a, b) => b.salario - a.salario)[0];
        if (melhor) out.push({ tipo: 'candidatar', ocupacaoId: melhor.id });
        out.push({ tipo: 'pedir_aumento' }, { tipo: 'horas_extras' });
      }
      if (p.trilhas.includes('publico') && i >= 18 && !v.trabalho.atual?.contrato.includes('servidor')) {
        const conc = OCUPACOES.filter(o => o.concurso && tenta(v, { tipo: 'candidatar', ocupacaoId: o.id })).sort((a, b) => b.salario - a.salario)[0];
        if (conc) out.push({ tipo: 'candidatar', ocupacaoId: conc.id });
      }
      if (v.trabalho.atual && tenta(v, { tipo: 'aposentar' }) && i >= 66) out.push({ tipo: 'aposentar' });

      // Casa
      if (moraComFamiliaDeOrigem(v) && i >= p.saiDeCasaAos) {
        const alvo = opcoesDeAluguel(v).filter(o => podeTentar(o.veredito)).sort((a, b) => a.aluguel - b.aluguel)[p.estilo === 'folgado' ? 3 : 1];
        if (alvo) out.push({ tipo: 'sair_de_casa', modeloId: alvo.m.id });
      }
      // Dinheiro
      if (i >= 18 && !moraComFamiliaDeOrigem(v) && v.financas.estilo !== p.estilo) out.push({ tipo: 'estilo', valor: p.estilo });
      if (i >= 18 && tenta(v, { tipo: 'renegociar' }) && p.poupa) out.push({ tipo: 'renegociar' });
      if (i >= 18 && !v.trabalho.licencas.includes('cnh') && (p.nome === 'gastador' || p.nome === 'familiar' || p.nome === 'impulsivo' || i >= 25)) out.push({ tipo: 'cnh' });
      if (v.trabalho.licencas.includes('cnh') && !v.financas.bens.some(b => b.tipo === 'veiculo')) {
        out.push({ tipo: 'comprar_veiculo', modeloId: p.estilo === 'folgado' ? 'carro_novo' : 'carro_usado', financiar: !p.poupa });
      }
      const mensal = saldoMensal(v);
      if (p.poupa && i >= 18 && v.financas.conta > Math.max(3000, mensal.despesa * 3)) {
        out.push({ tipo: 'investir', destino: p.nome === 'ambicioso' ? 'acoes' : 'reserva', valor: Math.round(v.financas.conta - mensal.despesa * 2) });
      }
      if (p.poupa && i >= 28 && !v.financas.bens.some(b => b.tipo === 'imovel')) {
        out.push({ tipo: 'comprar_imovel', modeloId: filhos(v).length ? 'apto_2q' : 'kitnet', financiar: true, morar: true });
      }
      if (p.nome === 'gastador' && i >= 30 && !v.financas.bens.some(b => b.tipo === 'imovel')) out.push({ tipo: 'comprar_imovel', modeloId: 'casa_3q', financiar: true, morar: true });
      if (i >= 30 && tenta(v, { tipo: 'plano_saude', ativo: true }) && !v.financas.planoDeSaude && (p.nome === 'ambicioso' || p.nome === 'familiar') && mensal.renda > 6000) out.push({ tipo: 'plano_saude', ativo: true });
      void idadePessoa;
      return out;
    }
  };
}
