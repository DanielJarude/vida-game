/**
 * VIDA 16 · OFÍCIOS POR DENTRO — direito, docência e tecnologia com a mecânica de cada uma.
 *
 * Antes, as três (com outras) dividiam o mesmo "desafio" de `conteudo/oficios`: uma frase da profissão, encarar ou não.
 * Agora cada uma tem a sua PASTA do ano (`Vida.oficio16`), gerada com sorteio derivado (`rngDe`) — nada muda para quem
 * não abre a pasta, e o acaso das vidas continua o mesmo:
 *
 *   DIREITO     os clientes chegam com processos (a área, as provas, o valor, quem está do outro lado). Pegar ou não;
 *               a ESTRATÉGIA (acordo agora, ou ir a julgamento, que se decide no fim do ano); preparar a fundo; recorrer
 *               da derrota. Quem advoga por conta recebe honorários; no escritório, conta o desempenho. Às vezes, um
 *               dilema ético (a testemunha ensaiada, o documento que "some") — e a OAB existe.
 *   DOCÊNCIA    as turmas do ano (o perfil de cada uma), a ABORDAGEM que você escolhe (que funciona melhor ou pior para
 *               cada turma), o aluno que precisa de você (e que pode reaparecer anos depois), o projeto da escola e a
 *               pressão para mudar uma nota.
 *   TECNOLOGIA  o projeto do ano (a complexidade), o RITMO (prazo × qualidade) e a DÍVIDA TÉCNICA que atravessa os anos,
 *               o incidente em produção (mais provável com dívida alta), a falha conhecida antes do lançamento, assumir
 *               a liderança técnica.
 *
 * O que fica: a reputação no ofício, o placar (causas, turmas, entregas), os feitos (na trajetória e na Linha da Vida).
 */
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { ocupacaoOuNula } from '../../dados/ocupacoes';
import { municipio } from '../../dados/lugares';
import { sortearNome } from '../../dados/nomes';
import { anoDe } from '../../tempo';
import { flex } from '../../texto';
import { marcar } from '../../sistemas/marcas';
import { habilidade, praticar } from '../../sistemas/frentes';
import { areaAtual } from '../../sistemas/areasDoOficio';
import {
  ABORDAGENS16, ALUNOS16, AREA_DO_ESCRITORIO16, CASOS16, DILEMAS_DIREITO16, INCIDENTES16, PERFIS_DE_TURMA16, PROJETOS_ESCOLARES16,
  PROJETOS_TEC16, RITMOS16, type Abordagem16, type AreaJuridica16, type PerfilDeTurma16, type Ramo16, type Ritmo16
} from '../../dados16/oficios/catalogo16';
import { decidirB, disponibilidadePlanoB, ehRamoB, fimB, novaPastaB, PLANOS_B } from './oficios16b';

/* ------------------------------------------------------------------ O estado guardado */

export type TipoItem16 = 'caso' | 'dilema' | 'turma' | 'aluno' | 'projeto_escola' | 'projeto' | 'incidente' | 'falha' | 'lideranca'
  /** VIDA 16.1 */
  | 'obra' | 'imprevisto' | 'patologia' | 'plantao' | 'fechamento' | 'pauta' | 'paciente';
export type EstadoItem16 = 'aberto' | 'aceito' | 'andamento' | 'resolvido' | 'recusado';

export interface Item16 {
  id: string;
  tipo: TipoItem16;
  titulo: string;
  texto: string;
  estado: EstadoItem16;
  /** Direito: a força das provas; docência: o quanto a turma já sabe; tecnologia: a complexidade (0..100). */
  forca?: number;
  /** Direito: o valor em jogo. */
  valor?: number;
  adversario?: 0 | 1 | 2;
  area?: AreaJuridica16;
  perfil?: PerfilDeTurma16;
  /** O nome de quem está na história (o cliente, o aluno). */
  nome?: string;
  /** A estratégia, a decisão tomada. */
  escolha?: string;
  preparo?: boolean;
  /** Direito: o recurso de uma derrota (decide no fim do ano seguinte). */
  recurso?: boolean;
  resultado?: string;
  bom?: boolean;
  genero?: 'masculino' | 'feminino';
  /** VIDA 16.1: as decisões deste item (as profissões de `oficios16b` trazem as opções nos dados). */
  opcoes?: { escolha: string; rotulo: string }[];
  /** VIDA 16.1: a referência (o paciente). */
  ref?: string;
  /** VIDA 16.1 · engenharia: o risco que o improviso pôs na obra. */
  latente?: number;
}

export interface AlunoMarcante16 { nome: string; t: number; situacao: string; desfecho: 'bem' | 'mal'; voltou?: boolean; genero?: 'masculino' | 'feminino' }

export interface Oficio16 {
  ramo: Ramo16;
  /** O ano (calendário) da pasta. */
  ano: number;
  itens: Item16[];
  /** A reputação no ofício (0..100): os colegas, os clientes, a direção, o mercado. */
  rep: number;
  /** Direito. */
  placar?: { ganhas: number; perdidas: number; acordos: number };
  /** Docência. */
  abordagem?: Abordagem16;
  turmas?: number;
  alunos?: AlunoMarcante16[];
  /** Tecnologia. */
  ritmo?: Ritmo16;
  divida?: number;
  entregas?: { ok: number; atrasos: number; incidentes: number };
  /** VIDA 16.1: o plano do ano (o padrão da obra, a escala, a carteira, a linha, a agenda). */
  plano?: string;
  /** Engenharia: as obras entregues, com o risco latente de cada uma. */
  obras?: { nome: string; t: number; padrao: string; risco: number; patologia?: boolean }[];
  /** Enfermagem: a sobrecarga que atravessa os anos, os plantões da carreira, as notificações de segurança. */
  sobrecarga?: number;
  plantoes?: number;
  seguranca?: number;
  /** Contabilidade: a carteira. */
  carteira?: { clientes: number; perdidos: number; multas: number; agressivo?: number };
  /** Jornalismo: a credibilidade (não é audiência) e as fontes cultivadas. */
  credibilidade?: number;
  fontes?: number;
  /** Psicologia: os pacientes (ficam de um ano para o outro) e as altas. */
  pacientes?: import('./oficios16b').Paciente16[];
  altas?: number;
  /** Os feitos do ofício (os últimos 30). */
  feitos: { t: number; texto: string; bom: boolean }[];
}

/* ------------------------------------------------------------------ Quem tem pasta */

const RAMO_DA_TRILHA: Record<string, Ramo16> = { direito: 'direito', educacao: 'docencia', docencia_superior: 'docencia', ti: 'tecnologia', dados: 'tecnologia',
  // VIDA 16.1
  engenharia: 'engenharia', eng_industrial: 'engenharia', enfermagem: 'enfermagem', contabil: 'contabilidade', comunicacao: 'jornalismo', psicologia: 'psicologia' };

/** O ramo do emprego de agora (só quem exerce: estágio, aprendiz e curso de formação ainda não têm pasta). */
export function ramoDe16(v: Vida): Ramo16 | undefined {
  const e = v.trabalho.atual;
  if (!e || e.formacaoAte || e.contrato === 'estagio' || e.contrato === 'aprendiz' || idade(v) < 18 || v.justica?.prisao) return undefined;
  const o = ocupacaoOuNula(e.ocupacaoId);
  if (!o || o.contrato === 'estagio' || o.contrato === 'aprendiz' || o.id === 'aux_creche' || o.id === 'suporte_ti') return undefined;
  return RAMO_DA_TRILHA[o.trilha];
}

const porConta = (v: Vida) => { const o = ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? ''); return o?.contrato === 'autonomo'; };
const superior = (v: Vida) => ocupacaoOuNula(v.trabalho.atual?.ocupacaoId ?? '')?.trilha === 'docencia_superior';
const ANO = (v: Vida) => anoDe(v.t);

/** A pasta do ano, como está (ou como será quando for aberta: sem gravar nada). */
export function pastaDe16(v: Vida): Oficio16 | undefined {
  const ramo = ramoDe16(v);
  if (!ramo) return undefined;
  const o = v.oficio16;
  if (o && o.ramo === ramo && o.ano === ANO(v)) return o;
  return novaPasta(v, ramo, o && o.ramo === ramo ? o : undefined);
}

/** Grava a pasta do ano (o primeiro gesto do ano no ofício a materializa). */
function garantir(v: Vida): Oficio16 {
  const p = pastaDe16(v)!;
  v.oficio16 = p;
  return p;
}

function novaPasta(v: Vida, ramo: Ramo16, antes?: Oficio16): Oficio16 {
  const r = rngDe(v.id, 'oficio16', ANO(v), ramo);
  const base: Oficio16 = {
    ramo, ano: ANO(v), itens: [], rep: antes?.rep ?? 40, feitos: antes?.feitos ?? [],
    ...(ramo === 'direito' ? { placar: antes?.placar ?? { ganhas: 0, perdidas: 0, acordos: 0 } } : {}),
    ...(ramo === 'docencia' ? { turmas: antes?.turmas ?? 0, alunos: antes?.alunos ?? [] } : {}),
    ...(ramo === 'tecnologia' ? { divida: antes?.divida ?? 20, entregas: antes?.entregas ?? { ok: 0, atrasos: 0, incidentes: 0 } } : {})
  };
  // O recurso de uma derrota do ano passado continua na pasta.
  for (const x of antes?.itens ?? []) if (x.tipo === 'caso' && x.recurso && x.estado === 'andamento') base.itens.push({ ...x, id: `${x.id}r`, titulo: `${x.titulo} (recurso)` });
  const pais = municipio(v.moradia.municipioId).pais;
  const nome = (g?: 'masculino' | 'feminino', idadeDe = 35) => sortearNome(r, g ?? (r.chance(0.5) ? 'masculino' : 'feminino'), ANO(v) - idadeDe, pais);
  const id = (k: string) => `o16_${ANO(v)}_${k}`;
  // VIDA 16.1: engenharia, enfermagem, contabilidade, jornalismo e psicologia têm a pasta delas (`oficios16b`).
  if (ehRamoB(ramo)) { novaPastaB(v, r, base, antes); return base; }
  if (ramo === 'direito') {
    const area = AREA_DO_ESCRITORIO16[areaAtual(v, 'direito') ?? ''];
    const pool = [...CASOS16];
    for (let k = 0; k < 3; k++) {
      const m = area && r.chance(0.6) ? r.pick(pool.filter(c => c.area === area)) : r.pick(pool);
      pool.splice(pool.indexOf(m), 1);
      const c = nome(m.texto.includes('demitida três semanas') || m.texto.includes('{c} quer sair da sociedade') || m.texto.includes('cria a filha') ? 'feminino' : undefined, r.int(25, 60));
      base.itens.push({ id: id(`c${k}`), tipo: 'caso', titulo: m.titulo, texto: m.texto.replace('{c}', c), estado: 'aberto', forca: r.int(20, 85), valor: Math.round(r.int(m.valor[0], m.valor[1]) / 100) * 100, adversario: m.adversario, area: m.area, nome: c });
    }
    if (r.chance(0.35)) {
      const d = r.pick(DILEMAS_DIREITO16);
      const c = nome(undefined, r.int(30, 60));
      base.itens.push({ id: id('d'), tipo: 'dilema', titulo: d.titulo, texto: d.texto.replace('{c}', c), estado: 'aberto', escolha: undefined, nome: c, area: d.id as AreaJuridica16 });
    }
  } else if (ramo === 'docencia') {
    const n = superior(v) ? 2 : r.chance(0.5) ? 3 : 2;
    const perfis = Object.keys(PERFIS_DE_TURMA16) as PerfilDeTurma16[];
    const serie = (k: number) => superior(v) ? `Turma ${k + 1} (${r.pick(['manhã', 'noite'])})` : r.pick(['6º ano A', '7º ano B', '8º ano C', '9º ano A', '5º ano B', '1º ano C', '3º ano A']);
    for (let k = 0; k < n; k++) {
      const pf = r.pick(perfis);
      base.itens.push({ id: id(`t${k}`), tipo: 'turma', titulo: serie(k), texto: `${r.int(superior(v) ? 30 : 24, superior(v) ? 60 : 38)} alunos — ${PERFIS_DE_TURMA16[pf].texto}.`, estado: 'andamento', perfil: pf, forca: r.int(25, 70) });
    }
    if (r.chance(0.65)) {
      const s = r.pick(superior(v) ? ALUNOS16.filter(x => x.id !== 'leitura') : ALUNOS16);
      const g = r.chance(0.5) ? 'masculino' : 'feminino';
      const a = nome(g, superior(v) ? 21 : 12).split(' ')[0];
      base.itens.push({ id: id('a'), tipo: 'aluno', titulo: a, texto: s.texto.replace('{a}', a).replace('{i}', String(superior(v) ? 20 : 11)).replace(/\{o\}/g, flex(g, 'o', 'a', 'e')), estado: 'aberto', nome: a, genero: g, area: s.id as AreaJuridica16 });
    }
    if (!superior(v) && r.chance(0.5)) {
      const p = r.pick(PROJETOS_ESCOLARES16);
      base.itens.push({ id: id('p'), tipo: 'projeto_escola', titulo: p.nome, texto: p.texto, estado: 'aberto', area: p.id as AreaJuridica16 });
    }
    if (r.chance(0.3)) {
      const quem = r.pick(['O pai de um aluno', 'A mãe de uma aluna', 'A direção']);
      base.itens.push({ id: id('n'), tipo: 'dilema', titulo: 'A nota', texto: quem === 'A direção' ? 'A direção pede para "rever" as notas baixas: o índice de aprovação da escola precisa subir.' : `${quem} quer que você mude uma nota que, você sabe, está certa. Ameaça ir à direção.`, estado: 'aberto' });
    }
  } else {
    const p = r.pick(PROJETOS_TEC16);
    base.itens.push({ id: id('j'), tipo: 'projeto', titulo: p.nome, texto: p.texto, estado: 'andamento', forca: p.complexidade + r.int(-10, 10) });
    const divida = base.divida ?? 20;
    if (r.chance(clamp(0.1 + divida / 140, 0.1, 0.75))) {
      const inc = r.pick(INCIDENTES16);
      base.itens.push({ id: id('i'), tipo: 'incidente', titulo: 'Incidente em produção', texto: inc.texto, estado: 'aberto' });
    }
    if (r.chance(0.3)) base.itens.push({ id: id('f'), tipo: 'falha', titulo: 'A falha conhecida', texto: 'A dois dias do lançamento, você acha uma falha de segurança. Corrigir direito leva três semanas.', estado: 'aberto' });
    const nivel = ocupacaoOuNula(v.trabalho.atual!.ocupacaoId)?.nivel ?? 2;
    if (nivel >= 3 && nivel <= 4 && r.chance(0.4)) base.itens.push({ id: id('l'), tipo: 'lideranca', titulo: 'Liderar o time', texto: 'O líder técnico saiu. Alguém precisa decidir a arquitetura e destravar o time — e responder quando der errado.', estado: 'aberto' });
  }
  return base;
}

/* ------------------------------------------------------------------ As ações */

export type OqueOficio16 =
  | { op: 'aceitar'; id: string }
  | { op: 'recusar'; id: string }
  | { op: 'estrategia'; id: string; escolha: 'acordo' | 'julgamento' }
  | { op: 'preparar'; id: string }
  | { op: 'recorrer'; id: string }
  | { op: 'decidir'; id: string; escolha: string }
  | { op: 'abordagem'; escolha: Abordagem16 }
  | { op: 'ritmo'; escolha: Ritmo16 }
  /** VIDA 16.1: o plano do ano das profissões de `oficios16b`. */
  | { op: 'plano'; escolha: string };

/** As decisões de um item (para a tela): o rótulo de cada uma. */
export function decisoesDe16(it: Item16): { escolha: string; rotulo: string }[] {
  if (it.estado !== 'aberto') return [];
  if (it.opcoes) return it.opcoes;
  switch (it.tipo) {
    case 'dilema':
      if (it.titulo === 'A nota') return [{ escolha: 'manter', rotulo: 'Manter a nota e explicar o critério' }, { escolha: 'ceder', rotulo: 'Ceder e mudar a nota' }];
      if ((it.area as string) === 'gratis') return [{ escolha: 'aceitar', rotulo: 'Defender de graça (pro bono)' }, { escolha: 'recusar', rotulo: 'Indicar a defensoria' }];
      if ((it.area as string) === 'conflito') return [{ escolha: 'recusar', rotulo: 'Recusar: conflito de interesses' }, { escolha: 'aceitar', rotulo: 'Aceitar os dois clientes' }];
      return [{ escolha: 'recusar', rotulo: 'Recusar — e dizer por quê' }, { escolha: 'aceitar', rotulo: 'Fazer o que o cliente pede' }];
    case 'aluno': return [
      { escolha: 'familia', rotulo: 'Chamar a família para conversar' }, { escolha: 'apoio', rotulo: 'Encaminhar ao apoio da escola' },
      { escolha: 'tempo', rotulo: 'Ficar depois da aula com ' + (it.nome ?? 'o aluno') }, { escolha: 'nada', rotulo: 'Seguir o planejamento' }];
    case 'incidente': return [{ escolha: 'noite', rotulo: 'Virar a noite e resolver' }, { escolha: 'time', rotulo: 'Chamar o time e dividir' }, { escolha: 'rollback', rotulo: 'Voltar a versão e investigar com calma' }];
    case 'falha': return [{ escolha: 'adiar', rotulo: 'Adiar o lançamento e corrigir' }, { escolha: 'lancar', rotulo: 'Lançar e corrigir depois' }];
    default: return [];
  }
}

export function disponibilidadeOficio16(v: Vida, q: OqueOficio16): Veredito {
  const p = pastaDe16(v);
  if (!p) return bloqueio('impossivel', 'Isso é do dia a dia de quem exerce a profissão.');
  if (q.op === 'abordagem') {
    if (p.ramo !== 'docencia') return bloqueio('impossivel', 'Não é o seu ofício.');
    if (p.abordagem && p.ano === ANO(v) && v.oficio16?.ano === ANO(v)) return p.abordagem === q.escolha ? bloqueio('incompativel', 'É a abordagem deste ano.') : bloqueio('incompativel', 'A abordagem do ano já foi escolhida: as turmas já se acostumaram.');
    return PERMITIDO;
  }
  if (q.op === 'plano') return disponibilidadePlanoB(p, v, q.escolha);
  if (q.op === 'ritmo') {
    if (p.ramo !== 'tecnologia') return bloqueio('impossivel', 'Não é o seu ofício.');
    if (p.ritmo && v.oficio16?.ano === ANO(v)) return p.ritmo === q.escolha ? bloqueio('incompativel', 'É o ritmo deste ano.') : bloqueio('incompativel', 'O ritmo do projeto já está combinado com o time.');
    return PERMITIDO;
  }
  const it = p.itens.find(x => x.id === q.id);
  if (!it) return bloqueio('impossivel', 'Isso não está mais na pasta.');
  switch (q.op) {
    case 'aceitar': {
      if (it.tipo !== 'caso' && it.tipo !== 'projeto_escola' && it.tipo !== 'lideranca') return bloqueio('impossivel', 'Não há o que aceitar.');
      if (it.estado !== 'aberto') return bloqueio('incompativel', 'Já foi decidido.');
      const ativos = p.itens.filter(x => x.tipo === 'caso' && (x.estado === 'aceito' || x.estado === 'andamento') && !x.recurso).length;
      if (it.tipo === 'caso' && ativos >= 2) return bloqueio('incompativel', 'Já são dois processos neste ano: mais um e nenhum recebe a atenção que precisa.');
      return PERMITIDO;
    }
    case 'recusar': return it.estado === 'aberto' && (it.tipo === 'caso' || it.tipo === 'projeto_escola' || it.tipo === 'lideranca') ? PERMITIDO : bloqueio('incompativel', 'Já foi decidido.');
    case 'estrategia': return it.tipo === 'caso' && it.estado === 'aceito' ? PERMITIDO : bloqueio('incompativel', 'A estratégia é de um processo aceito.');
    case 'preparar': return it.tipo === 'caso' && it.estado === 'andamento' && !it.preparo ? PERMITIDO : bloqueio('incompativel', it.preparo ? 'O processo já está preparado a fundo.' : 'Só um processo que vai a julgamento.');
    case 'recorrer': return it.tipo === 'caso' && it.estado === 'resolvido' && it.bom === false && !it.recurso && it.escolha === 'julgamento' ? PERMITIDO : bloqueio('incompativel', 'Só se recorre de uma derrota no julgamento.');
    case 'decidir': return decisoesDe16(it).some(x => x.escolha === q.escolha) ? PERMITIDO : bloqueio('incompativel', 'Já foi decidido.');
  }
}

export interface SaidaOficio16 { texto: string; tom: 'bom' | 'ruim' | 'neutro' }

const feito = (v: Vida, p: Oficio16, texto: string, bom: boolean, biografia = false) => {
  p.feitos.push({ t: v.t, texto, bom });
  if (p.feitos.length > 30) p.feitos.splice(0, p.feitos.length - 30);
  if (biografia) escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true });
};
const desemp = (v: Vida, n: number) => { const e = v.trabalho.atual; if (e) e.desempenho = clamp(Math.round(e.desempenho + n)); };
const cansar = (v: Vida, n: number) => { v.mente.estresse = clamp(Math.round(v.mente.estresse + n)); };
const reputar = (p: Oficio16, n: number) => { p.rep = clamp(Math.round(p.rep + n)); };

export function executarOficio16(v: Vida, r: Rng, q: OqueOficio16): SaidaOficio16 {
  const p = garantir(v);
  if (q.op === 'abordagem') {
    p.abordagem = q.escolha;
    cansar(v, ABORDAGENS16[q.escolha].cansa);
    return { texto: `${ABORDAGENS16[q.escolha].nome}: é assim que você vai conduzir as turmas este ano.`, tom: 'neutro' };
  }
  if (q.op === 'plano') {
    p.plano = q.escolha;
    return { texto: `${PLANOS_B[p.ramo].feita}: ${PLANOS_B[p.ramo].opcoes.find(o => o.id === q.escolha)!.nome.toLowerCase()}.`, tom: 'neutro' };
  }
  if (q.op === 'ritmo') {
    p.ritmo = q.escolha;
    return { texto: `Combinado com o time: ${RITMOS16[q.escolha].nome.toLowerCase()}.`, tom: 'neutro' };
  }
  const it = p.itens.find(x => x.id === q.id)!;
  switch (q.op) {
    case 'aceitar':
      if (it.tipo === 'caso') { it.estado = 'aceito'; praticar(v, r, 'humanas', 0.5); return { texto: `Você pegou o caso de ${it.nome}. Agora, a estratégia.`, tom: 'neutro' }; }
      it.estado = 'andamento';
      cansar(v, it.tipo === 'lideranca' ? 6 : 4);
      if (it.tipo === 'lideranca') { praticar(v, r, 'lideranca', 1); desemp(v, 4); }
      return { texto: it.tipo === 'lideranca' ? 'Você assumiu a liderança técnica. O time agora olha para você.' : `Você topou: ${it.titulo.toLowerCase()} é seu este ano.`, tom: 'neutro' };
    case 'recusar':
      it.estado = 'recusado';
      return { texto: it.tipo === 'caso' ? `${it.nome} vai procurar outro escritório.` : 'Fica para outra pessoa — ou para outro ano.', tom: 'neutro' };
    case 'estrategia': {
      it.escolha = q.escolha;
      if (q.escolha === 'acordo') {
        // O acordo: certo e menor agora. Quanto mais fracas as provas, melhor ele parece.
        it.estado = 'resolvido';
        it.bom = true;
        const parte = clamp(0.35 + (it.forca ?? 50) / 250, 0.35, 0.7);
        it.resultado = `Acordo fechado: ${it.nome} recebe ${Math.round(parte * 100)}% do que pedia, sem esperar anos.`;
        p.placar!.acordos++;
        reputar(p, 1); desemp(v, 2);
        if (porConta(v)) v.financas.conta += Math.round((it.valor ?? 0) * parte * 0.12);
        feito(v, p, `${it.titulo}: acordo para ${it.nome}.`, true);
        return { texto: it.resultado, tom: 'bom' };
      }
      it.estado = 'andamento';
      cansar(v, 3);
      return { texto: `Vai a julgamento. A sentença sai no fim do ano.`, tom: 'neutro' };
    }
    case 'preparar':
      it.preparo = true;
      cansar(v, 5);
      praticar(v, r, 'humanas', 1); praticar(v, r, 'linguagens', 0.6);
      return { texto: `Noites com o processo de ${it.nome}: jurisprudência, perícia, cada testemunha ouvida de novo.`, tom: 'neutro' };
    case 'recorrer':
      it.recurso = true;
      it.estado = 'andamento';
      it.resultado = undefined;
      it.bom = undefined;
      cansar(v, 2);
      return { texto: `Recurso apresentado. O tribunal decide no ano que vem.`, tom: 'neutro' };
    case 'decidir': return decidir(v, r, p, it, q.escolha);
  }
}

function decidir(v: Vida, r: Rng, p: Oficio16, it: Item16, escolha: string): SaidaOficio16 {
  if (ehRamoB(p.ramo)) return decidirB(v, r, p, it, escolha);
  it.escolha = escolha;
  it.estado = 'resolvido';
  switch (it.tipo) {
    case 'dilema': {
      if (it.titulo === 'A nota') {
        if (escolha === 'manter') { reputar(p, 3); desemp(v, -2); cansar(v, 3); it.bom = true; it.resultado = 'A nota ficou. A conversa foi dura; o critério, claro.'; feito(v, p, 'Manteve uma nota sob pressão.', true); return { texto: it.resultado, tom: 'neutro' }; }
        reputar(p, -4); desemp(v, 2); it.bom = false; it.resultado = 'A nota mudou. A sala inteira soube no dia seguinte.'; return { texto: it.resultado, tom: 'ruim' };
      }
      const tipo = it.area as string;
      if (tipo === 'gratis') {
        if (escolha === 'aceitar') { reputar(p, 4); cansar(v, 4); it.bom = true; it.resultado = `Você defendeu a vizinha de ${it.nome} de graça. Ela levou um bolo ao escritório.`; feito(v, p, 'Defendeu de graça quem não podia pagar.', true, true); return { texto: it.resultado, tom: 'bom' }; }
        it.resultado = 'Você indicou a defensoria.'; it.bom = true; return { texto: it.resultado, tom: 'neutro' };
      }
      if (escolha === 'recusar') { reputar(p, 2); it.bom = true; it.resultado = tipo === 'conflito' ? 'Você recusou o cliente novo: não se advoga para os dois lados.' : `Você disse não a ${it.nome}. Perdeu o cliente — e dormiu tranquil${flex(v.eu.tratamento ?? v.eu.genero, 'o', 'a', 'e')}.`; return { texto: it.resultado, tom: 'neutro' }; }
      // Fazer o que o cliente pede: dinheiro agora; a OAB pode saber.
      if (porConta(v)) v.financas.conta += tipo === 'conflito' ? 15000 : 4000;
      it.bom = false;
      if (r.chance(0.4)) {
        reputar(p, -15); desemp(v, -12); cansar(v, 10);
        it.resultado = 'A outra parte descobriu. Uma representação na OAB: o processo disciplinar vai pesar no nome por anos.';
        v.fatos['oab16_representacao'] = v.t;
        feito(v, p, 'Respondeu a um processo disciplinar na OAB.', false, true);
        marcar(v, 'fracasso', 'Respondeu a um processo disciplinar na OAB.', 2, { trilha: 'direito' });
        return { texto: it.resultado, tom: 'ruim' };
      }
      it.resultado = 'Ninguém percebeu. Por enquanto.';
      return { texto: it.resultado, tom: 'neutro' };
    }
    case 'aluno': {
      const efeito: Record<string, number> = { familia: 0.55, apoio: 0.5, tempo: 0.62, nada: 0.18 };
      if (escolha === 'tempo') cansar(v, 4);
      const bem = r.chance(clamp(efeito[escolha] + habilidade(v, 'comunidade') / 300 + p.rep / 400, 0.1, 0.85));
      it.bom = bem;
      it.resultado = escolha === 'nada' ? (bem ? `${it.nome} se acertou sozinh${flex(it.genero ?? 'masculino', 'o', 'a', 'e')} — dessa vez.` : `No fim do ano, ${it.nome} não voltou mais.`)
        : bem ? `Não foi de uma vez, mas ${it.nome} mudou. No último bimestre, foi ${it.nome} quem levantou a mão primeiro.` : `Você tentou. ${it.nome} terminou o ano do mesmo jeito — algumas coisas a escola não alcança sozinha.`;
      if (escolha !== 'nada') { (p.alunos ??= []).push({ nome: it.nome!, t: v.t, situacao: it.area as string, desfecho: bem ? 'bem' : 'mal', genero: it.genero }); if (p.alunos.length > 20) p.alunos.splice(0, p.alunos.length - 20); }
      if (bem && escolha !== 'nada') { reputar(p, 2); feito(v, p, `Ajudou ${it.nome} a atravessar um ano difícil.`, true); }
      return { texto: it.resultado, tom: bem ? 'bom' : 'neutro' };
    }
    case 'incidente': {
      const e = p.entregas!;
      e.incidentes++;
      if (escolha === 'noite') { cansar(v, 10); reputar(p, 2); desemp(v, 3); it.bom = true; it.resultado = 'Às 5h da manhã voltou tudo. Você dormiu no sofá do escritório.'; }
      else if (escolha === 'time') { cansar(v, 4); praticar(v, r, 'lideranca', 0.6); reputar(p, 3); it.bom = true; it.resultado = 'O time dividiu o problema em três; em duas horas estava resolvido.'; }
      else { p.divida = clamp((p.divida ?? 20) - 10); reputar(p, 1); desemp(v, -1); it.bom = true; it.resultado = 'Versão anterior no ar, e um relatório honesto do que deu errado. A causa foi corrigida na raiz.'; }
      praticar(v, r, 'programacao', 0.8);
      return { texto: it.resultado, tom: 'neutro' };
    }
    case 'falha': {
      if (escolha === 'adiar') { reputar(p, 3); desemp(v, -2); it.bom = true; it.resultado = 'O lançamento atrasou três semanas. A diretoria não gostou; ninguém teve os dados expostos.'; return { texto: it.resultado, tom: 'neutro' }; }
      desemp(v, 3);
      it.bom = false;
      if (r.chance(0.35)) {
        reputar(p, -10); desemp(v, -10); cansar(v, 8);
        it.resultado = 'Um mês depois, a falha foi explorada. Dados de clientes vazaram, e o seu nome estava no relatório.';
        feito(v, p, 'Um vazamento de dados por uma falha conhecida.', false, true);
        return { texto: it.resultado, tom: 'ruim' };
      }
      it.resultado = 'Lançou no prazo. A correção saiu duas semanas depois, sem ninguém notar.';
      return { texto: it.resultado, tom: 'neutro' };
    }
    default: return { texto: '', tom: 'neutro' };
  }
}

/* ------------------------------------------------------------------ O fim do ano */

/**
 * A virada do ano: o que estava em andamento se decide (o julgamento, as turmas, a entrega do projeto, o projeto da
 * escola) — só para quem abriu a pasta no ano (`v.oficio16.ano` é o ano que acabou). Depois, os alunos que reaparecem.
 */
export function processarOficio16(v: Vida): void {
  const p = v.oficio16;
  if (!p || p.ano >= anoDe(v.t)) return;
  const r = rngDe(v.id, 'oficio16_fim', p.ano, p.ramo);
  if (ramoDe16(v) !== p.ramo) { p.itens = []; return; }
  if (p.ramo === 'direito') fimDireito(v, r, p);
  else if (p.ramo === 'docencia') fimDocencia(v, r, p);
  else if (p.ramo === 'tecnologia') fimTecnologia(v, r, p);
  else fimB(v, r, p);
  alunosQueVoltam(v, r, p);
}

function fimDireito(v: Vida, r: Rng, p: Oficio16): void {
  for (const it of p.itens) {
    if (it.tipo !== 'caso' || it.estado !== 'andamento') continue;
    const chance = clamp(0.2 + (it.forca ?? 50) / 140 + habilidade(v, 'humanas') / 300 + p.rep / 350 + (it.preparo ? 0.13 : 0) - (it.adversario ?? 0) * 0.07 - (it.recurso ? 0.08 : 0), 0.08, 0.9);
    const ganhou = r.chance(chance);
    it.estado = 'resolvido';
    it.bom = ganhou;
    if (ganhou) {
      p.placar!.ganhas++;
      reputar(p, it.adversario === 2 ? 6 : 4); desemp(v, 6);
      if (porConta(v)) v.financas.conta += Math.round((it.valor ?? 0) * 0.2);
      it.resultado = it.recurso ? `O tribunal reformou a sentença: vitória de ${it.nome} no recurso.` : `Sentença favorável: ${it.nome} ganhou.`;
      const grande = (it.valor ?? 0) >= 80000 || it.adversario === 2;
      feito(v, p, `${it.titulo}: vitória para ${it.nome}${it.adversario === 2 ? ', contra quem quase nunca perde' : ''}.`, true, grande);
      if (grande) marcar(v, 'destaque', `Venceu ${it.titulo.toLowerCase()} para ${it.nome}.`, 2, { trilha: 'direito' });
    } else {
      p.placar!.perdidas++;
      reputar(p, -2); desemp(v, -3); cansar(v, 3);
      it.resultado = it.recurso ? 'O recurso foi negado. Não há mais o que fazer.' : `A sentença foi contra ${it.nome}. Dá para recorrer.`;
      feito(v, p, `${it.titulo}: derrota${it.recurso ? ' no recurso' : ''}.`, false);
    }
  }
}

function fimDocencia(v: Vida, r: Rng, p: Oficio16): void {
  const ab = p.abordagem;
  let soma = 0, n = 0;
  for (const it of p.itens) {
    if (it.tipo !== 'turma') continue;
    const a = ab ? ABORDAGENS16[ab] : undefined;
    const encaixe = !a ? 0 : a.boaPara.includes(it.perfil!) ? 14 : a.ruimPara.includes(it.perfil!) ? -10 : 3;
    const aprend = clamp(Math.round((it.forca ?? 45) + encaixe + habilidade(v, 'linguagens') / 10 + p.rep / 12 + r.normal() * 8));
    it.estado = 'resolvido';
    it.bom = aprend >= 55;
    it.resultado = aprend >= 70 ? 'Um ano que a turma vai lembrar: o salto apareceu nas avaliações.' : aprend >= 55 ? 'A turma avançou.' : aprend >= 40 ? 'Um ano arrastado: avançou pouco.' : 'A turma terminou o ano pior do que começou.';
    soma += aprend; n++;
    p.turmas = (p.turmas ?? 0) + 1;
  }
  if (!ab) return;
  const media = n ? soma / n : 50;
  desemp(v, Math.round((media - 52) / 4));
  reputar(p, Math.round((media - 50) / 6));
  if (media >= 70) feito(v, p, `${anoDe(v.t) - 1}: as turmas renderam como poucas vezes.`, true, media >= 76);
  for (const it of p.itens) {
    if (it.tipo !== 'projeto_escola' || it.estado !== 'andamento') continue;
    const premio = PROJETOS_ESCOLARES16.find(x => x.id === (it.area as string));
    const deu = r.chance(clamp(0.3 + p.rep / 200 + (ab === 'projetos' ? 0.12 : 0), 0.2, 0.75));
    it.estado = 'resolvido';
    it.bom = deu;
    it.resultado = deu ? premio?.premio ?? 'Deu certo.' : 'Saiu — menor do que o planejado, mas saiu.';
    if (deu) { reputar(p, 6); desemp(v, 4); feito(v, p, it.resultado, true, true); marcar(v, 'destaque', it.resultado, 2, { trilha: 'educacao' }); }
  }
  if ((p.turmas ?? 0) >= 40 && v.fatos['doc16_quarenta'] === undefined) {
    v.fatos['doc16_quarenta'] = v.t;
    feito(v, p, 'Quarenta turmas depois, alguns alunos já trazem os filhos para conhecer você.', true, true);
  }
}

function fimTecnologia(v: Vida, r: Rng, p: Oficio16): void {
  const proj = p.itens.find(x => x.tipo === 'projeto');
  const rit = p.ritmo;
  for (const it of p.itens) if ((it.tipo === 'incidente' || it.tipo === 'falha') && it.estado === 'aberto') {
    // O incidente ignorado: o problema não espera ninguém.
    if (it.tipo === 'incidente') { it.estado = 'resolvido'; it.bom = false; it.resultado = 'Ficou sem dono. Os clientes ficaram dois dias sem o sistema.'; desemp(v, -8); reputar(p, -6); p.entregas!.incidentes++; }
  }
  for (const it of p.itens) if (it.tipo === 'lideranca' && it.estado === 'andamento') {
    it.estado = 'resolvido';
    it.bom = true;
    it.resultado = 'Um ano decidindo a arquitetura e destravando os outros.';
    reputar(p, 4);
    feito(v, p, 'Liderou tecnicamente um time pela primeira vez.', true, true);
    marcar(v, 'lideranca', 'Assumiu a liderança técnica de um time.', 2, { trilha: 'ti' });
  }
  if (!proj || !rit) return;
  const R = RITMOS16[rit];
  const chance = clamp(0.55 + R.entrega + habilidade(v, 'programacao') / 250 - (proj.forca ?? 60) / 400 - (p.divida ?? 20) / 300, 0.1, 0.92);
  const ok = r.chance(chance);
  p.divida = clamp((p.divida ?? 20) + R.divida);
  cansar(v, R.cansa);
  proj.estado = 'resolvido';
  proj.bom = ok;
  if (ok) {
    p.entregas!.ok++;
    reputar(p, 4); desemp(v, 6);
    proj.resultado = rit === 'prazo' ? 'Entregue no prazo — com remendos que alguém vai ter de desfazer.' : rit === 'qualidade' ? 'Entregue, testado e limpo. O próximo projeto vai começar do chão firme.' : 'Entregue. Nada de heroísmo, nada de incêndio.';
    feito(v, p, `${proj.titulo}: entregue.`, true, (proj.forca ?? 0) >= 75);
  } else {
    p.entregas!.atrasos++;
    reputar(p, -3); desemp(v, -5);
    proj.resultado = 'Atrasou. A data nova foi anunciada duas vezes.';
    feito(v, p, `${proj.titulo}: atrasou.`, false);
  }
}

/** Anos depois, o aluno que você ajudou reaparece (uma vez cada um) — a cena é da história, não um bônus. */
function alunosQueVoltam(v: Vida, r: Rng, p: Oficio16): void {
  for (const a of p.alunos ?? []) {
    if (a.voltou || a.desfecho !== 'bem' || v.t - a.t < 96) continue;
    if (!r.chance(0.18)) continue;
    a.voltou = true;
    const g = a.genero ?? 'masculino';
    const hoje = r.pick([['enfermeiro', 'enfermeira'], ['engenheiro', 'engenheira'], ['professor', 'professora'], ['mecânico', 'mecânica'], ['advogado', 'advogada'], ['dono de uma padaria', 'dona de uma padaria'], ['médico', 'médica'], ['designer', 'designer']]);
    escrever(v, { texto: `${a.nome}, ${flex(g, 'aquele aluno', 'aquela aluna', 'aquele aluno')} de ${anoDe(a.t)}, mandou mensagem: hoje é ${g === 'feminino' ? hoje[1] : hoje[0]}, e disse que aquele ano mudou tudo.`, relevancia: 'biografia', tema: 'trabalho' });
    v.mente.felicidade = clamp(v.mente.felicidade + 4);
    p.feitos.push({ t: v.t, texto: `${a.nome} voltou para agradecer.`, bom: true });
    break;
  }
}

export function normalizarOficio16(v: Vida): void {
  const p = v.oficio16;
  if (!p) return;
  if (!Array.isArray(p.itens)) p.itens = [];
  if (!Array.isArray(p.feitos)) p.feitos = [];
  if (typeof p.rep !== 'number') p.rep = 40;
}
