/**
 * Caminhos de vida, do ponto de vista de quem QUER um deles.
 *
 *   INTENÇÃO → descoberta → requisitos → preparação → tentativa → processo
 *   → resultado → explicação → consequência → próximo passo
 *
 * Dois olhares, os dois derivados do estado (nada aqui decide nada):
 *
 *   `emConstrucao` — o que esta vida está construindo agora: a técnica que
 *   se treina para uma base, o estudo para concurso (e para que área), a
 *   pós que aponta para a universidade, a banda que ainda não paga. Para
 *   cada um: onde está, se está melhorando, o que falta e o próximo passo
 *   (uma ação do jogador, quando existe).
 *
 *   `caminhosPossiveis` — por onde se começa cada vida diferente (esporte,
 *   arte, universidade, farda, serviço público, negócio, por conta, política),
 *   a partir de onde a pessoa está. Não é um menu de carreiras: é o que uma
 *   pessoa perguntaria a quem sabe ("como alguém vira atleta?"), com a
 *   resposta para ESTA vida — e a primeira ação, quando dá para dar agora.
 */

import type { Acao } from '../acoes';
import type { Dominio, Vida } from '../tipos';
import type { Veredito } from '../plausibilidade';
import { podeTentar } from '../plausibilidade';
import { idade } from '../nucleo';
import { ocupacao, OCUPACOES } from '../dados/ocupacoes';
import { habilidade } from './frentes';
import { MODALIDADES, NOME_MOD } from './esporte';
import { lerTecnica } from './peneira';
import { editaisAbertos, FOCO_DO_CARGO, lerPreparo, NOME_FOCO } from './concurso';
import { janelaDaBase, modalidadeSeria } from './perseguir';
import { nomeDaMatricula } from './escola';
import { eDasForcas, elegibilidade, nomeOcupacao } from './trabalho';
import { naPolitica } from './politica';
import { negocioAberto } from './negocio';

export interface PassoDoCaminho {
  rotulo: string;
  /** A ação do jogador que dá este passo (quando existe agora). */
  acao?: Acao;
  /** Onde se dá este passo (outra área da tela). */
  ir?: 'tempo' | 'estudos' | 'explorar' | 'concursos' | 'negocio';
  porque?: string;
}

export interface CaminhoEmConstrucao {
  id: 'esporte' | 'concurso' | 'arte' | 'academia';
  /** A intenção, em palavras ("Chegar a uma base de vôlei"). */
  titulo: string;
  /** Onde está (estado, em palavras). */
  onde: string;
  /** Está melhorando? (o que mudou desde a última vez) */
  progresso?: string;
  /** O que falta, em linhas curtas. */
  falta: string[];
  proximo?: PassoDoCaminho;
}

type Disp = (v: Vida, a: Acao) => Veredito;
const P = (oque: string, valor?: string) => ({ tipo: 'perseguir', oque, valor } as unknown as Acao);

const ARTE_PALAVRA = (h: number) => (h < 40 ? 'começando' : h < 55 ? 'toca com outras pessoas' : h < 68 ? 'bom o bastante para palco' : h < 78 ? 'de nível profissional' : 'de primeira linha');
const NOME_ARTE: Partial<Record<Dominio, string>> = { musica: 'música', teatro: 'teatro', danca: 'dança' };
const ACADEMIA = ['pesquisador', 'professor_univ', 'pesquisador_instituto', 'professor_faculdade', 'coordenador_curso'];

/** O que esta vida está construindo agora, e o próximo passo de cada coisa. */
export function emConstrucao(v: Vida, disp: Disp): CaminhoEmConstrucao[] {
  const out: CaminhoEmConstrucao[] = [];
  const i = idade(v);
  const e = v.trabalho.atual;
  const pode = (a: Acao) => podeTentar(disp(v, a));

  // Esporte: treino sério, ainda sem clube.
  const d = modalidadeSeria(v);
  const es = v.caminhos.esporte;
  if (d && (!es || es.fase === 'encerrada') && i >= 8 && i <= janelaDaBase(d)[1]) {
    const t = lerTecnica(v, d);
    const pedir = P('pedir_teste', d);
    const veredito = disp(v, pedir);
    out.push({
      id: 'esporte', titulo: `Chegar a uma ${d === 'futebol' ? 'base' : 'equipe'} de ${NOME_MOD[d]}`,
      onde: `A técnica está "${t.palavra}". ${t.tentar}`,
      progresso: t.desde ?? t.ano,
      falta: [t.nivel < 4 ? 'Técnica no nível de uma base: treino regular, e a sério (ritmo de treino dobrado encurta).' : '', v.corpo.forma < 55 ? 'Fôlego: o fim do teste cobra quem não tem.' : ''].filter(Boolean),
      proximo: podeTentar(veredito) ? { rotulo: 'Pedir um teste num clube', acao: pedir, porque: t.nivel >= 3 ? 'O nível já permite tentar.' : 'Dá para tentar — sabendo que ainda falta técnica.' } : { rotulo: 'Treinar mais antes do próximo teste', ir: 'tempo', porque: veredito.motivo }
    });
  }

  // Concurso: estudando (ou com estudo guardado).
  const c = v.caminhos.concurso;
  const estudando = v.rotinas.some(r => r.id === 'estudar_concurso');
  if ((estudando || c.meses >= 12) && !(e?.contrato === 'servidor' && !estudando)) {
    const foco = c.foco;
    const alvo = editaisAbertos(v).filter(oc => podeTentar(elegibilidade(v, oc)) && (!foco || FOCO_DO_CARGO[oc.id] === foco))[0]
      ?? OCUPACOES.find(oc => oc.concurso && foco && FOCO_DO_CARGO[oc.id] === foco && podeTentar(elegibilidade(v, oc, 'oportunidade')));
    const l = alvo ? lerPreparo(v, alvo) : undefined;
    out.push({
      id: 'concurso', titulo: foco ? `Passar num concurso: ${NOME_FOCO[foco]}` : 'Passar num concurso',
      onde: `${estudando ? 'Estudando' : 'O estudo parou; o preparo esfria'} — ${foco ? `dirigido para ${NOME_FOCO[foco]}` : 'estudo geral, sem área'}.${l && alvo ? ` Para ${nomeOcupacao(v, alvo)}: ${l.palavra}.` : ''}`,
      progresso: l?.desde,
      falta: [...(l?.fatores ?? []).filter(x => /fraca|metade|renderia|teste físico/.test(x)), ...(foco ? [] : ['Escolher uma área: o edital de polícia não cobra o mesmo que o de tribunal.'])].slice(0, 3),
      proximo: !foco && pode(P('foco_concurso', 'administrativo')) ? { rotulo: 'Escolher para que área estudar', ir: 'concursos' } : editaisAbertos(v).some(oc => podeTentar(elegibilidade(v, oc))) ? { rotulo: 'Ver os editais abertos', ir: 'concursos' } : { rotulo: 'Seguir estudando', ir: 'tempo', porque: 'Nenhum edital que caiba abriu este ano: os concursos abrem em anos diferentes.' }
    });
  }

  // Arte: pratica, ainda não vive disso.
  const artes = (['musica', 'teatro', 'danca'] as Dominio[]).filter(x => v.rotinas.some(r => r.id === x && (r.nivel ?? 1) >= 2));
  const vivendo = e && ['musica', 'orquestra', 'cena', 'danca', 'literatura', 'conteudo'].includes(ocupacao(e.ocupacaoId).trilha);
  if (artes.length && !vivendo && i >= 13) {
    const a = artes.sort((x, y) => habilidade(v, y) - habilidade(v, x))[0];
    const p = v.caminhos.arte?.ativo ? v.caminhos.arte : undefined;
    const montar = P('montar_grupo', a);
    const publico = p ? (p.publico < 15 ? 'quase ninguém conhece ainda' : p.publico < 40 ? 'já tem quem vá ver' : p.publico < 65 ? 'público fiel na cidade' : 'gente de fora já conhece') : undefined;
    out.push({
      id: 'arte', titulo: `Viver de ${NOME_ARTE[a]}`,
      onde: `Na ${NOME_ARTE[a]}, você está "${ARTE_PALAVRA(habilidade(v, a))}".${p ? ` ${p.nome}: ${publico}.` : ' Ainda sem grupo.'}`,
      falta: [p ? (p.publico < 40 ? 'Público: é ele que traz convite para viver disso — ensaio firme, shows, edital de cultura.' : 'O convite para viver disso costuma vir com o público grande.') : 'Um grupo: é no palco com outras pessoas que o público começa.', habilidade(v, a) < 55 ? 'Técnica de palco: prática firme.' : ''].filter(Boolean),
      proximo: !p && pode(montar) ? { rotulo: a === 'musica' ? 'Montar uma banda' : 'Montar um grupo', acao: montar }
        : p && pode(P('mostrar_trabalho')) ? { rotulo: a === 'musica' ? 'Mandar o material para produtores e festivais' : 'Fazer uma audição numa companhia', acao: P('mostrar_trabalho'), porque: 'É pedir para ser visto: o parecer diz o que faltou.' }
          : { rotulo: 'Seguir ensaiando', ir: 'tempo', porque: p ? disp(v, P('mostrar_trabalho')).motivo ?? 'Os editais de cultura e os convites aparecem para quem está em cena.' : disp(v, montar).motivo }
    });
  }

  // Universidade: pós stricto sensu em andamento ou feita, fora da academia.
  const m = v.educacao.matricula;
  const stricto = v.educacao.concluidos.filter(x => x.nivel === 'mestrado' || x.nivel === 'doutorado').sort((a, b) => b.tFim - a.tFim)[0];
  const cursando = m && ['mestrado', 'doutorado'].includes(m.cursoId) ? m : undefined;
  const naAcademia = e && ACADEMIA.includes(e.ocupacaoId);
  if ((cursando || stricto) && !naAcademia) {
    const doutor = v.educacao.concluidos.some(x => x.nivel === 'doutorado');
    const fac = ocupacao('professor_faculdade');
    const facPode = podeTentar(elegibilidade(v, fac));
    const edital = editaisAbertos(v).find(oc => oc.id === 'professor_univ' && podeTentar(elegibilidade(v, oc)));
    const bolsa = P('bolsa_pesquisa');
    out.push({
      id: 'academia', titulo: 'Carreira acadêmica',
      onde: cursando ? `Cursando ${nomeDaMatricula(v, cursando)}.` : `${stricto!.nome} concluído.`,
      falta: [!doutor ? 'O doutorado: é o que abre a universidade pública e a pesquisa.' : '', !edital && doutor ? 'Concurso de professor universitário: só quando sai edital (raro).' : ''].filter(Boolean),
      proximo: edital ? { rotulo: 'Inscrever-se no concurso para professor universitário', ir: 'concursos' }
        : doutor && pode(bolsa) ? { rotulo: 'Candidatar-se a uma bolsa de pós-doutorado', acao: bolsa, porque: 'Editais saem todo ano; pesquisar conta para a universidade.' }
          : facPode && !cursando ? { rotulo: 'Procurar vaga de professor de faculdade', ir: 'explorar', porque: 'Faculdade particular contrata mestres por seleção.' }
            : cursando ? { rotulo: 'Terminar a pós', ir: 'estudos' } : { rotulo: 'O doutorado', ir: 'estudos' }
    });
  }
  return out;
}

/* ================================================== Por onde se começa */

export interface CaminhoPossivel {
  id: 'esporte' | 'arte' | 'academia' | 'forcas' | 'seguranca' | 'publico' | 'negocio' | 'por_conta' | 'politica';
  titulo: string;
  /** Como essa vida começa, em uma frase. */
  como: string;
  /** Para esta vida, agora. */
  agora: string;
  /** 'aqui': já está nisso · 'pronto': dá para dar o primeiro passo · 'preparar': há o que fazer antes · 'fora': fora do alcance agora. */
  estado: 'aqui' | 'pronto' | 'preparar' | 'fora';
  passo?: PassoDoCaminho;
}

export function caminhosPossiveis(v: Vida, disp: Disp): CaminhoPossivel[] {
  const i = idade(v);
  const e = v.trabalho.atual;
  const out: CaminhoPossivel[] = [];
  const pode = (a: Acao) => podeTentar(disp(v, a));

  // Esporte.
  {
    const d = modalidadeSeria(v) ?? (v.rotinas.find(r => MODALIDADES.includes(r.id as Dominio))?.id as Dominio | undefined);
    const es = v.caminhos.esporte;
    const pedir = P('pedir_teste', d);
    const [, fim] = janelaDaBase(d ?? 'volei');
    const dentro = es && (es.fase === 'base' || es.fase === 'profissional');
    out.push({
      id: 'esporte', titulo: 'Esporte',
      como: 'Treino a sério desde cedo → um teste num clube (peneira ou seletiva) → a base → o contrato. Quase ninguém chega; quem se prepara ainda jogando tem para onde ir.',
      agora: dentro ? 'Você está num clube.' : i > fim ? `A janela das bases já passou (vai até uns ${fim} anos). O esporte segue como treino, arbitragem, preparação física, escolinha.` : d ? `Você treina ${NOME_MOD[d]}: a técnica está "${lerTecnica(v, d).palavra}".` : 'Começa escolhendo uma modalidade e treinando a sério (Tempo livre).',
      estado: dentro ? 'aqui' : i > fim ? 'fora' : pode(pedir) ? 'pronto' : 'preparar',
      passo: dentro ? undefined : pode(pedir) ? { rotulo: 'Pedir um teste num clube', acao: pedir } : i <= fim ? { rotulo: d ? 'Treinar mais' : 'Começar a treinar', ir: 'tempo', porque: disp(v, pedir).motivo } : undefined
    });
  }
  // Arte.
  {
    const a = (['musica', 'teatro', 'danca'] as Dominio[]).find(x => v.rotinas.some(r => r.id === x));
    const montar = P('montar_grupo', a);
    const dentro = e && ['musica', 'orquestra', 'cena', 'danca', 'literatura', 'conteudo'].includes(ocupacao(e.ocupacaoId).trilha);
    out.push({
      id: 'arte', titulo: 'Arte',
      como: 'Praticar → tocar ou atuar com outras pessoas (uma banda, um grupo) → público que cresce devagar → editais de cultura e convites. Quase sempre começa ao lado de outro trabalho.',
      agora: dentro ? 'Você vive disso.' : v.caminhos.arte?.ativo ? `Você está em ${v.caminhos.arte.nome}.` : a ? `Você pratica ${NOME_ARTE[a]}.` : 'Começa praticando música, teatro ou dança (Tempo livre).',
      estado: dentro || v.caminhos.arte?.ativo ? 'aqui' : pode(montar) ? 'pronto' : 'preparar',
      passo: dentro || v.caminhos.arte?.ativo ? undefined : pode(montar) ? { rotulo: a === 'musica' ? 'Montar uma banda' : 'Montar um grupo', acao: montar } : { rotulo: a ? 'Praticar mais' : 'Começar a praticar', ir: 'tempo', porque: disp(v, montar).motivo }
    });
  }
  // Universidade.
  {
    const sup = v.educacao.concluidos.some(x => x.nivel === 'superior');
    const mest = v.educacao.concluidos.some(x => x.nivel === 'mestrado');
    const dout = v.educacao.concluidos.some(x => x.nivel === 'doutorado');
    const dentro = e && ACADEMIA.includes(e.ocupacaoId);
    out.push({
      id: 'academia', titulo: 'Universidade e pesquisa',
      como: 'Graduação → mestrado (com bolsa, quando há) → doutorado → pós-doutorado, docência em faculdade, concurso de professor universitário ou de instituto de pesquisa.',
      agora: dentro ? 'Você está na universidade.' : dout ? 'Com o doutorado, as portas são o pós-doutorado, a faculdade e os concursos.' : mest ? 'Com o mestrado: docência em faculdade particular e o doutorado.' : sup ? 'Com a graduação, o próximo passo é o mestrado.' : 'Começa pela graduação.',
      estado: dentro ? 'aqui' : sup ? 'pronto' : i >= 17 ? 'preparar' : 'preparar',
      passo: dentro ? undefined : dout && pode(P('bolsa_pesquisa')) ? { rotulo: 'Candidatar-se a uma bolsa de pós-doutorado', acao: P('bolsa_pesquisa') } : { rotulo: sup ? (mest ? 'O doutorado' : 'O mestrado') : 'A graduação', ir: 'estudos' }
    });
  }
  // Forças Armadas.
  {
    const dentro = !!e && eDasForcas(ocupacao(e.ocupacaoId));
    const escola = ['aluno_sargento', 'cadete'].map(ocupacao).find(oc => podeTentar(elegibilidade(v, oc, 'oportunidade')));
    out.push({
      id: 'forcas', titulo: 'Forças Armadas',
      como: 'O serviço militar aos 18 (obrigatório para homens, voluntário para mulheres) — ou o concurso para a escola de sargentos ou a academia, com estudo e teste físico. Formação longe de casa; transferências pela carreira.',
      agora: dentro ? 'Você está na farda.' : escola ? `Dá para prestar ${nomeOcupacao(v, escola)} (estudo para concurso, área de carreiras policiais e militares).` : i < 17 ? 'Aos 17, os concursos das escolas militares abrem para você.' : 'Os concursos das escolas têm limite de idade (e pedem ensino médio).',
      estado: dentro ? 'aqui' : escola ? 'pronto' : i < 17 ? 'preparar' : 'fora',
      passo: dentro ? undefined : escola ? { rotulo: 'Estudar para o concurso (e ver os editais)', ir: 'concursos' } : undefined
    });
  }
  // Segurança pública.
  {
    const dentro = !!e && ['pm', 'pm_oficial', 'bombeiro', 'guarda', 'policia_civil', 'penal', 'pericia', 'federal'].includes(ocupacao(e.ocupacaoId).trilha);
    const alvo = ['aluno_pm', 'policial_penal', 'guarda_municipal', 'policial_civil'].map(ocupacao).find(oc => podeTentar(elegibilidade(v, oc, 'oportunidade')));
    out.push({
      id: 'seguranca', titulo: 'Polícia e bombeiros',
      como: 'Concurso estadual (prova, teste físico, investigação social: pede ficha limpa) → curso de formação → a carreira, que sobe por antiguidade.',
      agora: dentro ? 'Você está na segurança pública.' : alvo ? `Dá para prestar ${nomeOcupacao(v, alvo)}: estudo dirigido para carreiras policiais, e o físico em dia.` : 'Fora do alcance agora (idade, escolaridade ou antecedentes).',
      estado: dentro ? 'aqui' : alvo ? 'pronto' : 'fora',
      passo: dentro || !alvo ? undefined : { rotulo: 'Estudar para o concurso (e ver os editais)', ir: 'concursos' }
    });
  }
  // Serviço público (civil).
  {
    const dentro = e?.contrato === 'servidor';
    out.push({
      id: 'publico', titulo: 'Serviço público',
      como: 'Estudo para concurso, dirigido para uma área (prefeitura e tribunais, fiscal, bancos públicos, magistério, saúde) → edital → prova → estabilidade. Costuma levar mais de uma tentativa.',
      agora: dentro ? 'Você é servidor.' : v.rotinas.some(r => r.id === 'estudar_concurso') ? 'Você estuda para concurso.' : i >= 17 ? 'Começa estudando (Tempo livre) e escolhendo a área.' : 'A partir dos 17.',
      estado: dentro ? 'aqui' : i >= 17 ? 'pronto' : 'preparar',
      passo: dentro ? undefined : { rotulo: 'Ver os concursos', ir: 'concursos' }
    });
  }
  // Negócio próprio.
  {
    const n = negocioAberto(v);
    out.push({
      id: 'negocio', titulo: 'O próprio negócio',
      como: 'Um ramo que você conhece (ou não, com risco maior) → abrir com o guardado, pequeno em casa, com empréstimo ou sócio → caixa, clientes, talvez equipe. Dá para começar nas horas vagas.',
      agora: n ? `Você tem ${n.nome}.` : i >= 18 ? 'Os ramos e o custo de cada um estão em "Negócio próprio".' : 'A partir dos 18.',
      estado: n ? 'aqui' : i >= 18 ? 'pronto' : 'preparar',
      passo: n ? undefined : i >= 18 ? { rotulo: 'Ver os negócios possíveis', ir: 'negocio' } : undefined
    });
  }
  // Por conta.
  {
    const conta = !!e && (e.contrato === 'autonomo' || e.contrato === 'informal') && e.clientela !== undefined;
    out.push({
      id: 'por_conta', titulo: 'Trabalhar por conta própria',
      como: 'Um ofício (curso curto ou mão boa) → os primeiros clientes (conhecidos, indicação) → freguesia que cresce → MEI, preço, agenda. Sem patrão, sem salário fixo.',
      agora: conta ? 'Você trabalha por conta.' : 'Os ofícios por conta estão nas vagas, marcados "por conta própria".',
      estado: conta ? 'aqui' : 'pronto',
      passo: conta ? undefined : { rotulo: 'Ver os trabalhos por conta', ir: 'explorar' }
    });
  }
  // Política (uma entre as outras; nunca em destaque por si).
  {
    const dentro = naPolitica(v);
    out.push({
      id: 'politica', titulo: 'Vida política',
      como: 'A associação do bairro, uma causa, um nome conhecido → um partido (militar da ativa não se filia: um partido o escolhe em convenção) → a candidatura, seis meses depois da filiação → a eleição.',
      agora: dentro ? 'Você está na vida política.' : i >= 16 ? 'Começa se aproximando: a associação, a causa, o partido da cidade.' : 'A partir dos 16.',
      estado: dentro ? 'aqui' : i >= 16 ? 'pronto' : 'preparar',
      passo: dentro ? undefined : pode({ tipo: 'politica', oque: 'aproximar' } as unknown as Acao) ? { rotulo: 'Aproximar-se da vida política', acao: { tipo: 'politica', oque: 'aproximar' } as unknown as Acao } : undefined
    });
  }
  return out;
}
