/**
 * Academia: docência e pesquisa como carreira especial, e não emprego raso.
 *
 *   graduação → iniciação → mestrado → doutorado → seleção → docência/pesquisa
 *   → projetos → produção → orientação → colaboração → financiamento
 *
 * Sem simulador burocrático: poucas ações, cada uma com custo (semana,
 * cabeça) e consequência (produção, orientandos, o nome na área). A produção
 * pesa em portas reais: a bolsa de pós-doutorado, o concurso de professor
 * universitário, o desempenho no cargo. Titulação já concluída nunca volta
 * como "próximo passo".
 */

import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Vida, VidaAcademica } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { ROTULO_AREA, type AreaFormacao } from '../dados/cursos';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { marcar } from './marcas';
import { criarPessoa, vincular } from '../pessoas';
import { anoDe } from '../tempo';

export const OCUPACOES_ACADEMICAS = new Set(['professor_univ', 'pesquisador', 'pesquisador_instituto', 'professor_faculdade', 'coordenador_curso']);

export type OqueAcademia = 'projeto' | 'orientar' | 'colaborar' | 'financiamento';

/** O emprego acadêmico (principal ou em paralelo), quando há. */
export function empregoAcademico(v: Vida) {
  return [v.trabalho.atual, v.trabalho.paralela].find(e => e && OCUPACOES_ACADEMICAS.has(e.ocupacaoId));
}

export function vidaAcademica(v: Vida): VidaAcademica {
  return (v.caminhos.academia ??= { projetos: 0, orientacoes: 0, orientandos: [], publicacoes: 0, colaboracoes: 0, financiamentos: 0, ultimas: {} });
}

/** A área da pesquisa: a do doutorado (ou mestrado), em palavras. */
export function linhaDePesquisa(v: Vida): string {
  const a = v.caminhos.academia?.linha;
  if (a) return a;
  const tit = [...v.educacao.concluidos].filter(c => c.nivel === 'doutorado' || c.nivel === 'mestrado').sort((x, y) => (y.nivel === 'doutorado' ? 1 : 0) - (x.nivel === 'doutorado' ? 1 : 0) || y.tFim - x.tFim)[0];
  const area = tit?.area ?? v.educacao.concluidos.find(c => c.nivel === 'superior')?.area;
  return area ? (ROTULO_AREA[area as AreaFormacao] ?? area).toLowerCase() : 'a sua área';
}

/** A produção acadêmica, 0..1 (publicações, orientações, projetos, financiamento). */
export function pesoDaProducao(v: Vida): number {
  const a = v.caminhos.academia;
  if (!a) return 0;
  return clamp((a.publicacoes * 1.2 + a.orientacoes * 1.5 + a.projetos + a.financiamentos * 2 + a.colaboracoes) / 30, 0, 1);
}

const recente = (v: Vida, a: VidaAcademica, k: string, meses: number) => a.ultimas[k] !== undefined && v.t - a.ultimas[k] < meses;

export function disponibilidadeAcademia(v: Vida, oque: OqueAcademia): Veredito {
  const e = empregoAcademico(v);
  if (!e) return bloqueio('impossivel', 'Isso é da vida acadêmica (docência e pesquisa).');
  const a = v.caminhos.academia ?? { projetos: 0, orientacoes: 0, orientandos: [], publicacoes: 0, colaboracoes: 0, financiamentos: 0, ultimas: {} };
  const doutor = v.educacao.concluidos.some(c => c.nivel === 'doutorado');
  switch (oque) {
    case 'projeto':
      if (a.projeto) return bloqueio('incompativel', `O projeto "${a.projeto.titulo}" está em andamento até ${anoDe(a.projeto.tFim)}.`);
      return PERMITIDO;
    case 'orientar':
      if (e.ocupacaoId === 'pesquisador') return bloqueio('requisito', 'Com bolsa de pós-doutorado, a orientação formal é de quem tem vínculo com o programa.');
      if (a.orientandos.length >= 3) return bloqueio('incompativel', 'Três orientandos já ocupam a semana.');
      if (recente(v, a, 'orientar', 12)) return bloqueio('incompativel', 'Um orientando novo por ano.');
      if (!doutor && e.ocupacaoId !== 'professor_faculdade' && e.ocupacaoId !== 'coordenador_curso') return bloqueio('requisito', 'Orientar na pós pede o doutorado.');
      return PERMITIDO;
    case 'colaborar':
      if (recente(v, a, 'colaborar', 24)) return bloqueio('incompativel', `A última colaboração começou em ${anoDe(a.ultimas['colaborar'])}.`);
      return PERMITIDO;
    case 'financiamento':
      if (!a.projeto) return bloqueio('requisito', 'Pedir financiamento pede um projeto em andamento.');
      if (a.projeto.financiado) return bloqueio('impossivel', 'O projeto já tem financiamento.');
      if (recente(v, a, 'financiamento', 12)) return bloqueio('incompativel', 'Os editais de pesquisa abrem uma vez por ano.');
      return PERMITIDO;
  }
}

export function executarAcademia(v: Vida, r: Rng, oque: OqueAcademia): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const a = vidaAcademica(v);
  const e = empregoAcademico(v)!;
  const linha = linhaDePesquisa(v);
  a.linha ??= linha;
  a.ultimas[oque] = v.t;
  switch (oque) {
    case 'projeto': {
      const titulo = rngDe(v.id, 'projeto', v.t).pick([`Um estudo sobre ${linha}`, `Novos caminhos em ${linha}`, `${linha.charAt(0).toUpperCase() + linha.slice(1)}: o que os dados mostram`, `Práticas e desafios em ${linha}`]);
      a.projeto = { titulo, tInicio: v.t, tFim: v.t + 24 };
      v.mente.estresse = clamp(v.mente.estresse + 3);
      const texto = `Começou um projeto de pesquisa: "${titulo}". Dois anos de trabalho — o resultado vem em artigos, se vier.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return { texto, tom: 'neutro' };
    }
    case 'orientar': {
      const p = criarPessoa(v, r, { genero: r.chance(0.5) ? 'masculino' : 'feminino', idade: Math.max(22, 24 + r.int(0, 6)), municipioId: v.moradia.municipioId });
      p.ocupacao = p.genero === 'feminino' ? 'mestranda' : 'mestrando';
      vincular(v, p, { origem: 'trabalho', estagio: 'colega', proximidade: 30, convivio: ['trabalho'] });
      lembrarCom(v, p.id, 'Você aceitou orientar a pesquisa dela.'.replace('dela', p.genero === 'feminino' ? 'dela' : 'dele'), 'trabalho', 2);
      a.orientandos.push(p.id);
      v.mente.estresse = clamp(v.mente.estresse + 2);
      const texto = `Passou a orientar ${p.nome} no mestrado, em ${linha}.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true, pessoas: [p.id] });
      return { texto, tom: 'neutro' };
    }
    case 'colaborar': {
      const deu = r.chance(clamp(0.45 + (v.mente.cognicao - 50) / 150 + pesoDaProducao(v) * 0.2, 0.2, 0.8));
      a.colaboracoes += 1;
      if (deu) {
        a.publicacoes += 1;
        e.feitos = (e.feitos ?? 0) + 1;
        const texto = `Entrou numa colaboração com um grupo de outra universidade: saiu um artigo em conjunto, em ${linha}.`;
        escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
        return { texto, tom: 'bom' };
      }
      const texto = 'Entrou numa colaboração com um grupo de outra universidade. As reuniões andaram, o artigo não saiu — ficaram os contatos.';
      escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto, tom: 'neutro' };
    }
    case 'financiamento': {
      const chance = clamp(0.2 + pesoDaProducao(v) * 0.4 + (v.mente.cognicao - 50) / 200 + a.financiamentos * 0.03, 0.08, 0.65);
      if (r.chance(chance)) {
        a.financiamentos += 1;
        a.projeto!.financiado = true;
        e.feitos = (e.feitos ?? 0) + 1;
        const texto = `O projeto "${a.projeto!.titulo}" foi aprovado num edital de pesquisa: verba para equipamento, bolsa para alunos, viagens a congressos.`;
        escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
        marcar(v, 'aprovacao', texto, 2, { ocupacaoId: e.ocupacaoId });
        return { texto, tom: 'bom' };
      }
      const motivo = pesoDaProducao(v) < 0.2 ? 'o parecer pediu mais produção recente (artigos, orientações)' : 'o projeto foi bem avaliado, mas a verba do edital acabou antes';
      const texto = `O pedido de financiamento não foi aprovado: ${motivo}.`;
      escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto, tom: 'ruim' };
    }
  }
}

/** O ano da academia: projetos terminam em produção, orientandos defendem. */
export function processarAcademia(v: Vida): void {
  const a = v.caminhos.academia;
  if (!a) return;
  const r = rngDe(v.id, 'academia', v.t);
  const e = empregoAcademico(v);
  if (a.projeto && v.t >= a.projeto.tFim) {
    const n = Math.max(0, Math.round((v.mente.cognicao - 40) / 25 + (a.projeto.financiado ? 1.2 : 0) + r.normal() * 0.8));
    a.projetos += 1;
    a.publicacoes += n;
    if (e) e.feitos = (e.feitos ?? 0) + (n > 0 ? 1 : 0);
    escrever(v, { texto: n > 0 ? `O projeto "${a.projeto.titulo}" terminou em ${n} ${n === 1 ? 'artigo publicado' : 'artigos publicados'}.` : `O projeto "${a.projeto.titulo}" terminou sem artigo publicado: os resultados não fecharam.`, relevancia: n > 0 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: n > 0 ? 'bom' : 'ruim' });
    a.projeto = undefined;
  }
  // Orientandos defendem em uns dois anos (ou largam).
  for (const id of [...a.orientandos]) {
    const p = v.pessoas[id];
    const vin = v.vinculos[id];
    const desde = vin?.historia[0]?.t ?? v.t;
    if (!p || !p.vivo) { a.orientandos = a.orientandos.filter(x => x !== id); continue; }
    if (v.t - desde >= 24) {
      a.orientandos = a.orientandos.filter(x => x !== id);
      if (r.chance(0.85)) {
        a.orientacoes += 1;
        a.publicacoes += r.chance(0.5) ? 1 : 0;
        p.ocupacao = p.genero === 'feminino' ? 'mestra, pesquisadora' : 'mestre, pesquisador';
        p.formacao = `Mestrado em ${linhaDePesquisa(v)}`;
        if (e) e.feitos = (e.feitos ?? 0) + 1;
        lembrarCom(v, id, 'Defendeu o mestrado com você na banca.', 'trabalho', 2);
        escrever(v, { texto: `${p.nome} defendeu o mestrado que você orientou.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom', pessoas: [id] });
      } else {
        p.ocupacao = undefined;
        escrever(v, { texto: `${p.nome} largou o mestrado antes de defender.`, relevancia: 'cotidiano', tema: 'trabalho', pessoas: [id] });
      }
    }
  }
  void idade; void ocupacaoOuNula;
}

/** Em palavras (para a tela). */
export function leituraAcademica(v: Vida): { linha: string; dados: [string, string][] } | undefined {
  const a = v.caminhos.academia;
  if (!empregoAcademico(v) && !a) return undefined;
  const dados: [string, string][] = [
    ['Linha de pesquisa', linhaDePesquisa(v)],
    ['Projeto', a?.projeto ? `"${a.projeto.titulo}", até ${anoDe(a.projeto.tFim)}${a.projeto.financiado ? ' (financiado)' : ''}` : 'nenhum em andamento'],
    ['Produção', a ? `${a.publicacoes} ${a.publicacoes === 1 ? 'artigo' : 'artigos'} · ${a.orientacoes} ${a.orientacoes === 1 ? 'orientação concluída' : 'orientações concluídas'}${a.orientandos.length ? ` · ${a.orientandos.length} em curso` : ''}` : 'ainda nenhuma']
  ];
  return { linha: linhaDePesquisa(v), dados };
}
