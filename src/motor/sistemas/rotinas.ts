/**
 * Rotinas: o que a pessoa escolhe fazer com o tempo livre, ano após ano.
 *
 * Uma rotina é compromisso contínuo, não clique: dura até o jogador parar.
 * Custa tempo (há um limite, que encolhe com trabalho, faculdade e filhos
 * pequenos), às vezes custa dinheiro, e coloca o jogador num ambiente onde
 * conhece gente. Rotina repetida por anos é evidência de comportamento.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Traco, Vida } from '../tipos';
import { escrever, filhos, idade, idadePessoa, marcarFato, temFato, parceiro } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { ROTINAS_SOCIAIS } from './social';
import { CUSTO_ROTINA, ROTULO_ROTINA_CUSTO } from './dinheiro';
import { aplicarPersonalidade } from '../personalidade';
import { moraComFamiliaDeOrigem } from './domicilio';

export interface ModeloRotina {
  id: string;
  nome: string;
  descricao: string;
  idadeMin: number;
  idadeMax?: number;
  /** Custo mensal (antes do custo de vida local). */
  custo: number;
  /** Quanto do tempo livre ocupa. */
  tempo: number;
  social?: { onde: string; fluxo: number; amplitude: number };
  /** Evidência comportamental acumulada por ano de prática. */
  comportamento?: Partial<Record<Traco, number>>;
  efeito: (v: Vida, r: Rng) => void;
  requer?: (v: Vida) => true | string;
  irregular?: boolean;
  /** Renda mensal que a rotina traz (bicos). */
  renda?: number;
}

export const ROTINAS: readonly ModeloRotina[] = [
  {
    id: 'futebol', nome: 'Jogar bola', descricao: 'Pelada no campinho ou quadra, fim de semana ou fim de tarde.', idadeMin: 5, custo: 20, tempo: 1,
    social: { onde: 'no futebol', fluxo: 1.2, amplitude: 4 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 9); v.mente.felicidade = clamp(v.mente.felicidade + 2); v.mente.estresse = clamp(v.mente.estresse - 3); }
  },
  {
    id: 'danca', nome: 'Aulas de dança', descricao: 'Balé, jazz, forró ou hip-hop — escola do bairro.', idadeMin: 4, custo: 150, tempo: 1,
    social: { onde: 'nas aulas de dança', fluxo: 1, amplitude: 5 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 6); v.corpo.aparencia = clamp(v.corpo.aparencia + 1); v.mente.felicidade = clamp(v.mente.felicidade + 2); }
  },
  {
    id: 'musica', nome: 'Aprender um instrumento', descricao: 'Violão, teclado, bateria. Aula semanal e muito treino.', idadeMin: 7, custo: 140, tempo: 1,
    social: { onde: 'nas aulas de música', fluxo: 0.6, amplitude: 8 },
    comportamento: { disciplina: 1 },
    efeito: v => { v.mente.cognicao = clamp(v.mente.cognicao + 1); v.mente.felicidade = clamp(v.mente.felicidade + 2); marcarAnos(v, 'musica'); }
  },
  {
    id: 'igreja', nome: 'Frequentar a igreja', descricao: 'Cultos ou missas, grupo de jovens, festas da comunidade.', idadeMin: 0, custo: 0, tempo: 0.5,
    social: { onde: 'na igreja', fluxo: 1.2, amplitude: 25 },
    efeito: v => { v.mente.felicidade = clamp(v.mente.felicidade + 2); v.mente.estresse = clamp(v.mente.estresse - 3); }
  },
  {
    id: 'ingles', nome: 'Curso de inglês', descricao: 'Duas aulas por semana num curso de idiomas.', idadeMin: 8, custo: 260, tempo: 1,
    social: { onde: 'no curso de inglês', fluxo: 0.7, amplitude: 6 },
    comportamento: { disciplina: 1 },
    efeito: v => { v.mente.cognicao = clamp(v.mente.cognicao + 1); if (marcarAnos(v, 'ingles') === 3) { marcarFato(v, 'fala_ingles'); escrever(v, { texto: 'Depois de três anos de curso, o inglês ficou de verdade.', relevancia: 'biografia', tema: 'estudo', tom: 'bom' }); } }
  },
  {
    id: 'leitura', nome: 'Ler', descricao: 'Livros emprestados, da biblioteca ou do celular.', idadeMin: 7, custo: 30, tempo: 0.5,
    efeito: v => { v.mente.cognicao = clamp(v.mente.cognicao + 1); v.mente.estresse = clamp(v.mente.estresse - 2); }
  },
  {
    id: 'videogame', nome: 'Jogar videogame', descricao: 'Horas no console, no PC ou no celular.', idadeMin: 6, custo: 50, tempo: 0.5,
    social: { onde: 'jogando online', fluxo: 0.4, amplitude: 6 },
    efeito: v => { v.mente.felicidade = clamp(v.mente.felicidade + 3); v.corpo.forma = clamp(v.corpo.forma - 2); }
  },
  {
    id: 'academia', nome: 'Academia', descricao: 'Musculação e esteira, três vezes por semana.', idadeMin: 15, custo: 110, tempo: 1,
    social: { onde: 'na academia', fluxo: 0.5, amplitude: 10 },
    comportamento: { disciplina: 1 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 11); v.corpo.aparencia = clamp(v.corpo.aparencia + 2); v.mente.estresse = clamp(v.mente.estresse - 4); }
  },
  {
    id: 'corrida', nome: 'Correr ou caminhar', descricao: 'Na praça, na orla, no parque. De graça.', idadeMin: 12, custo: 0, tempo: 0.5,
    comportamento: { disciplina: 1 },
    efeito: v => { v.corpo.forma = clamp(v.corpo.forma + 7); v.mente.estresse = clamp(v.mente.estresse - 3); }
  },
  {
    id: 'voluntariado', nome: 'Voluntariado', descricao: 'ONG, cozinha comunitária, projeto social do bairro.', idadeMin: 14, custo: 0, tempo: 1,
    social: { onde: 'no voluntariado', fluxo: 0.8, amplitude: 25 },
    comportamento: { generosidade: 1, empatia: 1 },
    efeito: v => { v.mente.felicidade = clamp(v.mente.felicidade + 3); }
  },
  {
    id: 'sair_noite', nome: 'Sair à noite', descricao: 'Bar, balada, show. Gente nova toda semana.', idadeMin: 18, custo: 280, tempo: 1,
    social: { onde: 'na noite', fluxo: 1.5, amplitude: 8 },
    comportamento: { sociabilidade: 1 },
    efeito: (v, r) => {
      v.mente.felicidade = clamp(v.mente.felicidade + 4);
      v.corpo.saude = clamp(v.corpo.saude - 1);
      if (v.corpo.habitos.bebe === 'nao' && r.chance(0.35)) v.corpo.habitos.bebe = 'social';
      else if (v.corpo.habitos.bebe === 'social' && r.chance(0.06 + Math.max(0, v.personalidade.tracos.impulsividade) / 400)) v.corpo.habitos.bebe = 'muito';
    }
  },
  {
    id: 'terapia', nome: 'Terapia', descricao: 'Sessão semanal com psicólogo (particular ou pelo SUS, com fila).', idadeMin: 12, custo: 280, tempo: 0.5,
    efeito: v => {
      v.mente.estresse = clamp(v.mente.estresse - 10);
      v.mente.felicidade = clamp(v.mente.felicidade + 3);
      for (const c of v.corpo.condicoes) if (c.id === 'depressao' || c.id === 'ansiedade') c.tratando = true;
    }
  },
  {
    id: 'estudar_concurso', nome: 'Estudar para concurso', descricao: 'Apostilas, videoaulas e simulados à noite.', idadeMin: 17, custo: 180, tempo: 1,
    comportamento: { disciplina: 1 },
    efeito: v => { marcarFato(v, 'estudando_concurso'); v.mente.estresse = clamp(v.mente.estresse + 4); v.mente.cognicao = clamp(v.mente.cognicao + 1); }
  },
  {
    id: 'cursinho', nome: 'Cursinho pré-vestibular', descricao: 'Aulas para o ENEM. Ajuda muito na nota.', idadeMin: 16, custo: 0, tempo: 1,
    social: { onde: 'no cursinho', fluxo: 1, amplitude: 3 },
    requer: v => (v.educacao.matricula ? 'Já está fazendo faculdade.' : true),
    efeito: v => { v.educacao.cursinho = true; v.mente.estresse = clamp(v.mente.estresse + 5); }
  },
  {
    id: 'tempo_familia', nome: 'Tempo com a família', descricao: 'Almoço de domingo, dever de casa junto, passeio. Tempo que não volta.', idadeMin: 18, custo: 0, tempo: 1,
    requer: v => (filhos(v).some(f => v.vinculos[f.id].convivio.includes('casa')) || parceiro(v) ? true : 'Precisa ter parceiro ou filhos em casa.'),
    comportamento: { familia: 1 },
    efeito: v => {
      for (const f of filhos(v)) v.vinculos[f.id].proximidade = clamp(v.vinculos[f.id].proximidade + 5);
      const par = parceiro(v);
      if (par?.vin.romance) par.vin.romance.envolvimento = clamp(par.vin.romance.envolvimento + 6);
      v.mente.felicidade = clamp(v.mente.felicidade + 2);
    }
  },
  {
    id: 'bico', nome: 'Fazer bicos', descricao: 'Trabalho avulso nos fins de semana: entrega, evento, faxina, obra.', idadeMin: 16, custo: 0, tempo: 1, renda: 750,
    efeito: v => { v.mente.estresse = clamp(v.mente.estresse + 5); v.corpo.forma = clamp(v.corpo.forma + 1); }
  },
  {
    id: 'vender_doces', nome: 'Vender doces na rua', descricao: 'Bala, brigadeiro, paçoca no semáforo ou na porta da escola.', idadeMin: 8, idadeMax: 15, custo: 0, tempo: 1, renda: 220, irregular: true,
    requer: v => (moraComFamiliaDeOrigem(v) ? true : 'Só faz sentido morando com a família.'),
    efeito: (v, r) => {
      v.mente.estresse = clamp(v.mente.estresse + 4);
      if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho - 8);
      if (!temFato(v, 'conselho_tutelar') && r.chance(0.25)) {
        marcarFato(v, 'conselho_tutelar');
        escrever(v, { texto: 'O Conselho Tutelar apareceu em casa depois de alguém denunciar criança trabalhando na rua. A família levou uma advertência.', relevancia: 'biografia', tema: 'familia', tom: 'ruim' });
      }
    }
  }
];

for (const r of ROTINAS) {
  if (r.social) ROTINAS_SOCIAIS[r.id] = r.social;
  if (r.custo) { CUSTO_ROTINA[r.id] = r.custo; ROTULO_ROTINA_CUSTO[r.id] = r.nome; }
}

export const modeloRotina = (id: string) => ROTINAS.find(r => r.id === id);

function marcarAnos(v: Vida, chave: string): number {
  const k = `anos_${chave}`;
  v.fatos[k] = (v.fatos[k] ?? 0) + 1;
  return v.fatos[k];
}

/* ------------------------------------------------------------ Tempo livre */

export function tempoLivre(v: Vida): number {
  const i = idade(v);
  if (i < 5) return 1;
  let t = i < 12 ? 2 : 3;
  const e = v.trabalho.atual;
  if (e) t -= e.carga === 'integral' ? 1.5 : 0.75;
  const m = v.educacao.matricula;
  if (m && !m.trancado) t -= m.modalidade === 'ead' ? 0.5 : m.cursoId && ['medicina', 'residencia', 'eng_civil', 'computacao', 'arquitetura', 'enfermagem', 'agronomia', 'mestrado', 'doutorado'].includes(m.cursoId) ? 1.5 : 0.75;
  const pequenos = filhos(v).filter(f => idadePessoa(v, f) < 6 && v.vinculos[f.id].convivio.includes('casa')).length;
  t -= Math.min(1.5, pequenos * 0.75);
  return Math.max(0.5, t);
}

export const tempoOcupado = (v: Vida) => v.rotinas.reduce((s, r) => s + (modeloRotina(r.id)?.tempo ?? 0), 0);

export function podeComecarRotina(v: Vida, id: string): Veredito {
  const m = modeloRotina(id);
  if (!m) return bloqueio('impossivel', 'Rotina desconhecida.');
  const i = idade(v);
  if (i < m.idadeMin) return bloqueio('impossivel', `A partir dos ${m.idadeMin} anos.`);
  if (m.idadeMax && i > m.idadeMax) return bloqueio('impossivel', 'Não é para a sua idade.');
  if (v.rotinas.some(r => r.id === id)) return bloqueio('incompativel', 'Já faz parte da sua rotina.');
  const req = m.requer?.(v);
  if (typeof req === 'string') return bloqueio('requisito', req);
  if (tempoOcupado(v) + m.tempo > tempoLivre(v) + 0.01) return bloqueio('incompativel', 'Não sobra tempo na semana. Largue outra coisa antes.');
  if (i < 12 && m.custo > 60 && ['vulneravel', 'trabalhadora'].includes(v.origem.classe) && moraComFamiliaDeOrigem(v)) {
    return bloqueio('requisito', 'A família não tem como pagar isso agora.');
  }
  if (m.irregular) return { grau: 'irregular', motivo: 'Trabalho infantil é proibido. Acontece — e tem consequência.' };
  return { grau: 'permitido' };
}

export function processarRotinas(v: Vida, r: Rng): void {
  const excesso = tempoOcupado(v) - tempoLivre(v);
  for (const rot of [...v.rotinas]) {
    const m = modeloRotina(rot.id);
    if (!m) continue;
    if (idade(v) < m.idadeMin || (m.idadeMax && idade(v) > m.idadeMax)) {
      v.rotinas = v.rotinas.filter(x => x.id !== rot.id);
      continue;
    }
    m.efeito(v, r);
    if (m.comportamento && v.t - rot.tInicio >= 12) aplicarPersonalidade(v, `rotina:${m.id}`, m.comportamento);
    if (m.renda) v.financas.conta += Math.round(m.renda * 12 * (0.8 + r.next() * 0.4));
  }
  if (excesso > 0.01) v.mente.estresse = clamp(v.mente.estresse + Math.round(excesso * 10));
  v.corpo.habitos.sedentario = !v.rotinas.some(x => ['futebol', 'academia', 'corrida', 'danca'].includes(x.id)) && idade(v) >= 12;
  if (!v.rotinas.some(x => x.id === 'cursinho')) v.educacao.cursinho = false;
  if (!v.rotinas.some(x => x.id === 'estudar_concurso')) delete v.fatos['estudando_concurso'];
}
