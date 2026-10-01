/**
 * Atividades com HISTÓRIA INTERNA (pacote pós-playtest).
 *
 * Entrar numa atividade não é "ocupar a semana e ganhar atributo": é começar
 * uma história, com etapas, papel e marcos — que depende de permanência,
 * dedicação (o nível da rotina), dos atributos que a atividade pede, das
 * relações, da liderança, do contexto e de uma sorte plausível. Ninguém é
 * obrigado a ganhar prêmio: a maioria das histórias termina no meio.
 *
 *   time da escola   treinos → reserva/titular → jogos escolares → destaque →
 *                    capitão; o campeonato (fase de grupos → semifinal →
 *                    final → campeão ou vice)
 *   olimpíada        preparação → fase escolar → regional → estadual →
 *                    nacional (menção ou medalha)
 *   projeto          participante → responsável → desenvolvimento →
 *                    apresentação → reconhecido (ou não saiu)
 *   ciências e       membro → projeto (o robô) → feira → competição →
 *   robótica         premiado ou participou
 *   reforço          dificuldade → acompanhamento → melhora (ou estagnação) →
 *                    recuperação / domínio
 *   xadrez (escola)  treino → equipe → torneio → colocação
 *
 * As histórias alimentam o que vem depois: o destaque e o capitão do time
 * pesam na peneira (`esporte`); a medalha, na bolsa e no instituto federal
 * (`medalha_obmep`) e na seleção acadêmica; a robótica premiada conta nas
 * vagas de engenharia e TI (`formacao.vivenciaQuePesa`); a capitania e a
 * responsabilidade no projeto exercitam a liderança.
 *
 * Arquitetura genérica (`ModeloDeArco`): etapas ordenadas + o ano de cada
 * uma — pronta para servir à universidade, a clubes, hobbies, grupos
 * artísticos, voluntariado e esporte amador.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Vida, Vivencia } from '../tipos';
import { escrever, idade, marcarFato } from '../nucleo';
import { flex, ge } from '../texto';
import { habilidade, materiasExtremas, praticar } from './frentes';
import { marcar } from './marcas';

export interface ModeloDeArco {
  /** O nome de cada etapa, em palavras (para a tela). */
  etapas: Record<string, string>;
  /** O ano da atividade: avança (ou não), escreve o que marca. */
  ano: (v: Vida, x: Vivencia, nivel: number, r: Rng) => void;
}

const g = (v: Vida) => v.eu.tratamento ?? v.eu.genero;
function marco(v: Vida, x: Vivencia, texto: string, bio = false, peso: 1 | 2 | 3 = 2, dominio?: Dominio): void {
  (x.marcos ??= []).push({ t: v.t, texto });
  if (x.marcos.length > 10) x.marcos.splice(0, x.marcos.length - 10);
  escrever(v, { texto, relevancia: bio ? 'biografia' : 'cotidiano', tema: 'escola', tom: 'bom' });
  if (bio) marcar(v, 'destaque', texto, peso, dominio ? { dominio } : {});
}
const etapa = (x: Vivencia, e: string) => { x.etapa = e; };

/* ------------------------------------------------------------ Time da escola */

const TIME: ModeloDeArco = {
  etapas: { treinos: 'nos treinos', reserva: 'reserva', titular: 'titular', destaque: 'destaque do time', capitao: 'capitão do time' },
  ano: (v, x, nivel, r) => {
    const h = habilidade(v, 'futebol');
    const lider = Math.max(habilidade(v, 'lideranca'), 20 + v.personalidade.tracos.sociabilidade / 3);
    if (!x.etapa) { etapa(x, 'treinos'); x.papel = 'nos treinos'; return; }
    // A vaga: técnica, dedicação, tempo de time — e a concorrência do ano.
    const vaga = h + (nivel - 1) * 4 + x.anos * 2 + r.normal() * 6;
    if (x.etapa === 'treinos' || x.etapa === 'reserva') {
      if (vaga >= 48) { etapa(x, 'titular'); x.papel = 'titular'; marco(v, x, 'Ganhou a vaga de titular no time da escola.'); }
      else { etapa(x, 'reserva'); x.papel = 'reserva'; }
    } else if (x.etapa === 'titular' && h >= 55 && vaga >= 62) {
      etapa(x, 'destaque'); x.papel = 'destaque';
      marcarFato(v, 'destaque_escolar_futebol');
      marco(v, x, `Virou o destaque do time da escola: o professor de educação física passou a falar ${flex(g(v), 'dele', 'dela', 'delu')} para quem entende de futebol.`, true, 2, 'futebol');
    } else if ((x.etapa === 'destaque' || x.etapa === 'titular') && x.anos >= 2 && lider >= 35 && r.chance(clamp((lider - 30) / 60, 0.08, 0.5))) {
      etapa(x, 'capitao'); x.papel = flex(g(v), 'capitão', 'capitã', 'capitão');
      praticar(v, r, 'lideranca', 0.8, 1.2);
      marco(v, x, `Virou ${flex(g(v), 'o capitão', 'a capitã', 'o capitão')} do time da escola.`, true, 2, 'lideranca');
    }
    // Os jogos escolares do ano: o time vai até onde vai (a força do time + quanto você joga).
    const contribuicao = x.etapa === 'reserva' || x.etapa === 'treinos' ? 0 : x.etapa === 'titular' ? 0.06 : 0.12;
    const forca = r.next() + contribuicao;
    const fase = forca > 0.93 ? 'campeao' : forca > 0.83 ? 'vice' : forca > 0.6 ? 'semifinal' : 'grupos';
    if (fase === 'campeao') {
      const primeira = !x.feito?.startsWith('título');
      x.feito = 'título nos jogos escolares';
      marco(v, x, x.etapa === 'reserva' || x.etapa === 'treinos' ? 'O time da escola ganhou os jogos escolares da cidade; você estava no grupo.' : 'O time da escola ganhou os jogos escolares da cidade, com você em campo.', primeira && x.etapa !== 'reserva', 2, 'futebol');
    } else if (fase === 'vice') {
      x.feito ??= 'vice nos jogos escolares';
      marco(v, x, 'O time da escola chegou à final dos jogos escolares — e perdeu. O vice doeu e ficou.');
    }
  }
};

/* ------------------------------------------------------------ Olimpíada */

const FASES_OLIMPIADA = ['preparacao', 'escolar', 'regional', 'estadual', 'nacional'];
const OLIMPIADA: ModeloDeArco = {
  etapas: { preparacao: 'em preparação', escolar: 'passou da fase escolar', regional: 'chegou à fase regional', estadual: 'chegou à fase estadual', nacional: 'chegou à fase nacional' },
  ano: (v, x, nivel, r) => {
    const h = Math.max(habilidade(v, 'exatas'), habilidade(v, 'ciencias') * 0.92);
    // O ciclo do ano: cada fase é uma prova; quem se preparou mais (nível, anos) vai mais longe — e o dia pesa.
    let k = 0;
    const barra = [0, 40, 58, 72, 84];
    while (k < 4 && h + (nivel - 1) * 3 + Math.min(6, x.anos * 1.5) + r.normal() * 7 >= barra[k + 1]) k++;
    const melhor = Math.max(FASES_OLIMPIADA.indexOf(x.etapa ?? 'preparacao'), k);
    etapa(x, FASES_OLIMPIADA[melhor]);
    if (k <= 1) return;
    // O resultado: menção honrosa, bronze, prata, ouro — conforme a fase e a nota do dia.
    // A medalha é para poucos: mesmo quem chega longe, quase sempre, volta sem ela.
    const nota = h + r.normal() * 8;
    const medalha = k === 4 ? (nota >= 91 ? 'de ouro' : nota >= 87 ? 'de prata' : nota >= 82 ? 'de bronze' : undefined) : k === 3 ? (nota >= 84 ? 'de prata' : nota >= 78 ? 'de bronze' : undefined) : undefined;
    const ondeTxt = k === 4 ? 'nacional' : k === 3 ? 'estadual' : 'regional';
    if (medalha) {
      const primeira = !x.feito?.startsWith('medalha');
      x.feito = `medalha ${medalha} (fase ${ondeTxt})`;
      marcarFato(v, 'medalha_obmep');
      if (k === 4) marcarFato(v, 'medalha_nacional');
      marco(v, x, primeira ? `Depois de ${x.anos >= 2 ? 'anos' : 'um ano'} de preparação, veio a medalha ${medalha} na fase ${ondeTxt} da olimpíada de matemática. O nome saiu no mural da escola.` : `Mais uma medalha na olimpíada (${medalha}, fase ${ondeTxt}).`, primeira, k === 4 ? 3 : 2, 'exatas');
      const f = v.caminhos.frentes.exatas; if (f) f.interesse = clamp(f.interesse + 8);
    } else if (k >= 2) {
      x.feito ??= k === 4 ? 'menção honrosa na fase nacional' : `classificação para a fase ${ondeTxt}`;
      marco(v, x, k === 4 ? 'Chegou à fase nacional da olimpíada e voltou com uma menção honrosa.' : `Passou para a fase ${ondeTxt} da olimpíada. A medalha não veio — a vontade de tentar de novo, sim.`, k === 4);
    }
  }
};

/* ------------------------------------------------------------ Projeto da escola */

const PROJETO: ModeloDeArco = {
  etapas: { participante: 'participante', responsavel: 'responsável por uma parte', desenvolvimento: 'em desenvolvimento', apresentacao: 'apresentado', reconhecido: 'reconhecido', parado: 'parado' },
  ano: (v, x, nivel, r) => {
    const h = Math.max(habilidade(v, 'ciencias'), habilidade(v, 'linguagens'), habilidade(v, 'comunidade'));
    const resp = v.personalidade.tracos.disciplina / 3 + habilidade(v, 'lideranca') / 2 + (nivel - 1) * 8;
    if (!x.etapa) { etapa(x, 'participante'); x.papel = 'participante'; return; }
    if (x.etapa === 'participante') {
      if (r.chance(clamp(resp / 60, 0.15, 0.7))) { etapa(x, 'responsavel'); x.papel = 'responsável por uma parte'; marco(v, x, 'No projeto da escola, ficou com uma parte inteira sob sua responsabilidade.'); praticar(v, r, 'lideranca', 0.4, 1); }
      else etapa(x, 'desenvolvimento');
    } else if (x.etapa === 'responsavel' || x.etapa === 'desenvolvimento') {
      etapa(x, 'apresentacao');
      if (r.chance(clamp((h - 35) / 55 + (x.papel?.startsWith('responsável') ? 0.1 : 0), 0.08, 0.6))) {
        etapa(x, 'reconhecido');
        x.feito = 'o projeto apresentado e premiado na mostra da cidade';
        marco(v, x, `O projeto da escola ${r.pick(['— a horta que abastece a merenda —', '— a rádio do recreio —', '— o jornal da turma —', '— a oficina de reciclagem —'])} foi apresentado na mostra da cidade e levou menção.`, true, 2, 'comunidade');
        praticar(v, r, 'comunidade', 0.6, 1);
      } else { x.feito ??= 'o projeto apresentado na mostra da escola'; marco(v, x, 'O projeto foi apresentado na mostra da escola. Não ganhou nada — e funcionou.'); }
    }
  }
};

/* ------------------------------------------------------------ Ciências e robótica */

const CIENCIAS: ModeloDeArco = {
  etapas: { membro: 'membro', projeto: 'construindo o robô', feira: 'na feira de ciências', competicao: 'na competição de robótica', premiado: 'premiado' },
  ano: (v, x, nivel, r) => {
    const h = (habilidade(v, 'ciencias') + habilidade(v, 'exatas') + habilidade(v, 'programacao')) / 3 + (nivel - 1) * 2;
    if (!x.etapa) { etapa(x, 'membro'); return; }
    if (x.etapa === 'membro') { etapa(x, 'projeto'); marco(v, x, 'No clube de ciências, a turma começou a montar um robô com sucata e uma placa emprestada.'); return; }
    if (x.etapa === 'projeto') {
      if (h + x.anos * 2 + r.normal() * 8 >= 38) { etapa(x, 'feira'); marco(v, x, 'O robô do clube andou — e foi para a feira de ciências da escola.'); }
      return;
    }
    if (x.etapa === 'feira' && h + x.anos * 2 + r.normal() * 8 >= 50) { etapa(x, 'competicao'); marco(v, x, 'A equipe do clube foi classificada para a competição regional de robótica.', true, 2, 'ciencias'); return; }
    if (x.etapa === 'competicao') {
      if (h + x.anos + r.normal() * 8 >= 60) {
        etapa(x, 'premiado'); x.feito = 'prêmio na competição regional de robótica'; x.area = 'engenharia';
        marco(v, x, 'A equipe de robótica voltou da competição regional com um prêmio. Você explicou o código para os jurados.', true, 2, 'programacao');
        const f = v.caminhos.frentes.programacao; if (f) f.interesse = clamp(f.interesse + 10);
      } else { x.feito ??= 'participação na competição regional de robótica'; x.area ??= 'engenharia'; marco(v, x, 'A equipe de robótica não passou da primeira fase na regional. Voltou com uma lista de coisas para consertar.'); }
    }
  }
};

/* ------------------------------------------------------------ Reforço */

const REFORCO: ModeloDeArco = {
  etapas: { dificuldade: 'na dificuldade', acompanhamento: 'com acompanhamento', melhora: 'melhorando', estagnacao: 'sem melhora ainda', recuperacao: 'recuperado', dominio: 'dominando a matéria' },
  ano: (v, x, nivel, r) => {
    const fraca = materiasExtremas(v).fraca;
    const b = v.educacao.basica;
    if (!x.etapa) { etapa(x, 'dificuldade'); x.area ??= fraca; return; }
    if (x.etapa === 'dificuldade') { etapa(x, 'acompanhamento'); return; }
    // Melhora quem vai e se dedica (disciplina, o ano anterior); às vezes, mesmo indo, não melhora.
    const melhora = r.chance(clamp(0.45 + v.personalidade.tracos.disciplina / 250 + (v.educacao.postura === 'dedicada' ? 0.15 : v.educacao.postura === 'relaxada' ? -0.15 : 0) + (nivel - 1) * 0.05, 0.15, 0.85));
    if (!melhora) { etapa(x, 'estagnacao'); if (x.anos >= 2 && !x.marcos?.some(m => m.texto.includes('não melhorou'))) marco(v, x, 'Um ano inteiro de reforço, e a nota não melhorou. A professora disse para não desistir.'); return; }
    const d = (x.area as Dominio | undefined) ?? fraca;
    if (d) praticar(v, r, d, 0.6, 1.2);
    if (b) b.desempenho = clamp(b.desempenho + 4);
    if (x.etapa === 'melhora') {
      const dominou = habilidade(v, d ?? 'exatas') >= 60;
      etapa(x, dominou ? 'dominio' : 'recuperacao');
      x.feito = dominou ? 'a matéria que era difícil virou a mais fácil' : 'a recuperação da matéria';
      marco(v, x, dominou ? 'A matéria que era um pesadelo virou das melhores notas da turma.' : 'Saiu da recuperação. O reforço tinha valido.', dominou);
    }
    else { etapa(x, 'melhora'); marco(v, x, 'Com o reforço, a nota começou a subir.'); }
  }
};

/* ------------------------------------------------------------ Xadrez (na escola) */

const XADREZ: ModeloDeArco = {
  etapas: { treino: 'treinando', equipe: 'na equipe da escola', torneio: 'jogando torneios' },
  ano: (v, x, nivel, r) => {
    const h = habilidade(v, 'xadrez');
    if (!x.etapa) { etapa(x, 'treino'); return; }
    if (x.etapa === 'treino') { if (h + r.normal() * 6 >= 40) { etapa(x, 'equipe'); x.papel = 'da equipe'; marco(v, x, 'Entrou para a equipe de xadrez da escola.'); } return; }
    etapa(x, 'torneio');
    const nota = h + (nivel - 1) * 3 + r.normal() * 7;
    const col = nota >= 72 ? 1 : nota >= 64 ? 2 : nota >= 58 ? 3 : 0;
    if (col) {
      const texto = col === 1 ? 'Ganhou o torneio de xadrez entre escolas da cidade.' : `Ficou em ${col}º lugar no torneio de xadrez entre escolas.`;
      if (col === 1 || !x.feito) x.feito = col === 1 ? 'campeão do torneio escolar de xadrez'.replace('campeão', flex(g(v), 'campeão', 'campeã', 'campeão')) : `${col}º lugar no torneio escolar de xadrez`;
      marco(v, x, texto, col === 1, 2, 'xadrez');
    }
  }
};

/* ============================================================ Universidade (generalização de carreiras) */

/**
 * A universidade como experiência vivida: nem todo aluno participa de tudo, e
 * cada atividade tem a sua história. Os "feitos" que já tinham consequência
 * depois continuam com o mesmo nome (a iniciação que pesa no mestrado e nas
 * vagas de pesquisa; a coordenação do centro acadêmico que abre a porta da
 * política estudantil; a empresa júnior e a monitoria no currículo).
 */
function marcoUni(v: Vida, x: Vivencia, texto: string, bio = false, peso: 1 | 2 | 3 = 2, dominio?: Dominio): void {
  (x.marcos ??= []).push({ t: v.t, texto });
  if (x.marcos.length > 10) x.marcos.splice(0, x.marcos.length - 10);
  escrever(v, { texto, relevancia: bio ? 'biografia' : 'cotidiano', tema: 'estudo', tom: 'bom' });
  if (bio) marcar(v, 'vivencia', texto, peso, dominio ? { dominio } : {});
}
const cognicao = (v: Vida) => v.mente.cognicao;

const INICIACAO: ModeloDeArco = {
  etapas: { leitura: 'lendo e aprendendo o método', coleta: 'na coleta de dados', resultados: 'com os primeiros resultados', sem_resultado: 'o experimento não deu o que se esperava', congresso: 'apresentou num congresso', artigo: 'com um artigo publicado' },
  ano: (v, x, nivel, r) => {
    if (!x.etapa) { etapa(x, 'leitura'); x.papel = 'bolsista'; return; }
    const forca = (cognicao(v) - 45) / 60 + (nivel - 1) * 0.12 + Math.min(0.2, x.anos * 0.05) + r.normal() * 0.25;
    if (x.etapa === 'leitura') { etapa(x, 'coleta'); marcoUni(v, x, 'Na iniciação, saiu das leituras para a bancada: a coleta de dados começou.'); return; }
    if (x.etapa === 'coleta' || x.etapa === 'sem_resultado') {
      if (forca >= 0.25) { etapa(x, 'resultados'); marcoUni(v, x, 'A iniciação deu os primeiros resultados: um gráfico que a orientação mostrou na reunião do grupo.'); }
      else if (x.etapa === 'coleta' && forca < -0.1) { etapa(x, 'sem_resultado'); marcoUni(v, x, 'O experimento da iniciação não deu o que se esperava. A orientação disse que isso também é pesquisa.'); }
      return;
    }
    if (x.etapa === 'resultados' && forca >= 0.2) {
      etapa(x, 'congresso');
      x.feito ??= 'um trabalho apresentado num congresso';
      marcoUni(v, x, 'Apresentou o trabalho da iniciação num congresso, com a voz tremendo nos primeiros minutos.', true, 2);
      marcar(v, 'conquista', `Iniciação científica: ${x.feito}.`, 2);
      return;
    }
    if (x.etapa === 'congresso' && forca >= 0.45) {
      etapa(x, 'artigo');
      x.feito = 'um artigo publicado com a orientadora';
      marcoUni(v, x, 'Saiu o primeiro artigo com o seu nome — o último da lista de autores, mas o seu.', true, 2);
      marcar(v, 'conquista', `Iniciação científica: ${x.feito}.`, 2);
    }
  }
};

/** A modalidade que a pessoa joga (para a atlética): a mais treinada entre as que se jogam em equipe universitária. */
const MODALIDADES_UNI: Dominio[] = ['futebol', 'volei', 'basquete', 'natacao', 'atletismo', 'lutas', 'tenis'];
const ATLETICA: ModeloDeArco = {
  etapas: { treinos: 'treinando com a atlética', equipe: 'na equipe da atlética', jogos: 'nos jogos universitários', titulo: 'campeão dos jogos universitários', diretoria: 'na diretoria da atlética' },
  ano: (v, x, nivel, r) => {
    const d = [...MODALIDADES_UNI].sort((a, b) => habilidade(v, b) - habilidade(v, a))[0];
    const h = habilidade(v, d);
    // Treinar pela atlética também é treino (pouco, mas conta): o esporte universitário mantém o corpo e a técnica.
    praticar(v, r, d, 0.4 + (nivel - 1) * 0.2, 1);
    v.corpo.forma = clamp(v.corpo.forma + 1);
    if (!x.etapa) { etapa(x, 'treinos'); x.papel = 'nos treinos'; x.area = x.area ?? d; return; }
    if (x.etapa === 'treinos' && h + r.normal() * 8 >= 38) { etapa(x, 'equipe'); x.papel = 'da equipe'; marcoUni(v, x, `Entrou para a equipe de ${NOME_MOD_UNI[d] ?? d} da atlética.`); return; }
    if (x.etapa === 'equipe' || x.etapa === 'jogos' || x.etapa === 'titulo') {
      etapa(x, x.etapa === 'titulo' ? 'titulo' : 'jogos');
      const forca = r.next() + (h - 50) / 200;
      if (forca > 0.9) { const primeira = !x.feito; x.feito = flex(g(v), 'campeão', 'campeã', 'campeão') + ' dos jogos universitários'; etapa(x, 'titulo'); marcoUni(v, x, `A equipe da atlética ganhou os jogos universitários${primeira ? ' — e a festa durou três dias' : ' de novo'}.`, primeira, 2, d); }
      else if (forca > 0.7) marcoUni(v, x, 'A atlética chegou à final dos jogos universitários e perdeu nos detalhes.');
    }
    const lider = Math.max(habilidade(v, 'lideranca'), 20 + v.personalidade.tracos.sociabilidade / 3);
    if (x.anos >= 2 && x.etapa !== 'diretoria' && lider >= 40 && r.chance(0.25)) {
      etapa(x, 'diretoria'); x.papel = 'da diretoria';
      x.feito ??= 'a diretoria da atlética';
      praticar(v, r, 'lideranca', 0.6, 1.1);
      marcoUni(v, x, 'Entrou para a diretoria da atlética: calendário de treinos, festa, patrocínio de padaria.', true, 1, 'lideranca');
    }
  }
};
const NOME_MOD_UNI: Partial<Record<Dominio, string>> = { futebol: 'futebol', volei: 'vôlei', basquete: 'basquete', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta', tenis: 'tênis' };

const CENTRO_ACADEMICO: ModeloDeArco = {
  etapas: { membro: 'nas reuniões', chapa: 'numa chapa', coordenacao: 'na coordenação', mobilizacao: 'liderou uma mobilização' },
  ano: (v, x, nivel, r) => {
    const lider = habilidade(v, 'lideranca');
    const social = v.personalidade.tracos.sociabilidade;
    praticar(v, r, 'lideranca', 0.35 + (nivel - 1) * 0.15, 1);
    if (!x.etapa) { etapa(x, 'membro'); x.papel = 'participante'; return; }
    if (x.etapa === 'membro' && (lider >= 35 || social >= 30) && r.chance(0.45)) { etapa(x, 'chapa'); x.papel = 'da chapa'; marcoUni(v, x, 'Entrou numa chapa para a eleição do centro acadêmico.'); return; }
    if (x.etapa === 'chapa') {
      if (lider + social / 4 + r.normal() * 12 >= 45) {
        etapa(x, 'coordenacao'); x.papel = 'da coordenação';
        x.feito = 'a coordenação do centro acadêmico';
        marcarFato(v, 'gremio_eleito');
        marcoUni(v, x, `${flex(g(v), 'Eleito', 'Eleita', 'Eleite')} para a coordenação do centro acadêmico.`, true, 2, 'lideranca');
        marcar(v, 'conquista', 'Coordenação do centro acadêmico.', 2, { dominio: 'lideranca' });
      } else { etapa(x, 'membro'); marcoUni(v, x, 'A chapa perdeu a eleição do centro acadêmico por poucos votos.'); }
      return;
    }
    if (x.etapa === 'coordenacao' && r.chance(0.35)) {
      etapa(x, 'mobilizacao');
      const pauta = r.pick(['a reabertura do restaurante universitário', 'a reforma da biblioteca', 'o ônibus noturno até o campus', 'a volta das bolsas cortadas']);
      x.feito = `a mobilização por ${pauta}`;
      marcoUni(v, x, `Liderou a mobilização dos estudantes por ${pauta} — e a reitoria cedeu.`, true, 2, 'lideranca');
    }
  }
};

const EXTENSAO: ModeloDeArco = {
  etapas: { participante: 'participando', frente: 'cuidando de uma frente', comunidade: 'o projeto chegou à comunidade', coordenacao: 'coordenando o projeto' },
  ano: (v, x, nivel, r) => {
    praticar(v, r, 'comunidade', 0.4 + (nivel - 1) * 0.15, 1);
    if (!x.etapa) { etapa(x, 'participante'); x.papel = 'participante'; return; }
    if (x.etapa === 'participante' && r.chance(0.5 + (nivel - 1) * 0.1)) { etapa(x, 'frente'); x.papel = 'responsável por uma frente'; marcoUni(v, x, 'No projeto de extensão, ficou responsável por uma frente de trabalho.'); return; }
    if (x.etapa === 'frente' && r.chance(0.4)) {
      etapa(x, 'comunidade');
      x.feito = 'um projeto de extensão que chegou à comunidade';
      marcoUni(v, x, `O projeto de extensão ${r.pick(['levou atendimento a um bairro sem posto', 'abriu um cursinho popular no bairro', 'assessorou uma cooperativa da periferia', 'montou oficinas numa escola pública'])}. Gente de fora da universidade passou a contar com vocês.`, true, 2, 'comunidade');
      return;
    }
    if (x.etapa === 'comunidade' && x.anos >= 3 && r.chance(0.3)) { etapa(x, 'coordenacao'); x.papel = 'coordenação'; marcoUni(v, x, 'Passou a coordenar o projeto de extensão: os calouros chegam e perguntam para você.'); }
  }
};

const EMPRESA_JUNIOR: ModeloDeArco = {
  etapas: { trainee: 'trainee', consultor: 'consultor', projeto: 'entregou projeto a cliente', diretoria: 'na diretoria' },
  ano: (v, x, nivel, r) => {
    if (!x.etapa) { etapa(x, 'trainee'); x.papel = 'trainee'; return; }
    if (x.etapa === 'trainee') { etapa(x, 'consultor'); x.papel = 'consultor'; marcoUni(v, x, 'Passou do processo de trainee: agora é consultor da empresa júnior.'.replace('consultor da', `${flex(g(v), 'consultor', 'consultora', 'consultore')} da`)); return; }
    if (x.etapa === 'consultor' && r.chance(0.35 + (nivel - 1) * 0.1)) {
      etapa(x, 'projeto');
      x.feito = 'o primeiro projeto para um cliente de verdade';
      marcoUni(v, x, 'Na empresa júnior, entregou o primeiro projeto para um cliente de verdade — com prazo, reunião e reclamação.');
      return;
    }
    if (x.etapa === 'projeto' && x.anos >= 2 && habilidade(v, 'lideranca') + r.normal() * 10 >= 38) {
      etapa(x, 'diretoria'); x.papel = 'diretoria';
      x.feito = 'a diretoria da empresa júnior';
      praticar(v, r, 'lideranca', 0.6, 1.1);
      marcoUni(v, x, 'Assumiu uma diretoria da empresa júnior: meta, equipe, cliente que atrasa pagamento.', true, 2, 'lideranca');
    }
  }
};

const MONITORIA: ModeloDeArco = {
  etapas: { monitor: 'monitor da disciplina', turmas: 'atendendo turmas', referencia: 'a referência da disciplina' },
  ano: (v, x, nivel, r) => {
    if (!x.etapa) { etapa(x, 'monitor'); x.papel = 'monitoria'; return; }
    if (x.etapa === 'monitor') { etapa(x, 'turmas'); marcoUni(v, x, 'A monitoria virou rotina: plantão de dúvidas antes da prova, a sala cheia na véspera.'); return; }
    if (x.etapa === 'turmas' && cognicao(v) + (nivel - 1) * 5 + r.normal() * 10 >= 60) {
      etapa(x, 'referencia');
      x.feito = 'a monitoria que virou referência na disciplina';
      marcoUni(v, x, 'O professor disse, na frente da turma, que a monitoria tinha mudado a média da disciplina.', true, 1);
    }
  }
};

const ARCOS: Partial<Record<string, ModeloDeArco>> = { time_escola: TIME, olimpiada: OLIMPIADA, projeto_escola: PROJETO, clube_ciencias: CIENCIAS, reforco: REFORCO, xadrez: XADREZ, iniciacao: INICIACAO, atletica: ATLETICA, centro_academico: CENTRO_ACADEMICO, extensao: EXTENSAO, empresa_junior: EMPRESA_JUNIOR, monitoria: MONITORIA };

/** O ano de uma atividade com história: avança o arco (se a atividade tem um). Devolve se tinha. */
export function anoDoArco(v: Vida, rotinaId: string, x: Vivencia, nivel: number, r: Rng): boolean {
  const m = ARCOS[rotinaId];
  if (!m || idade(v) < 6) return false;
  m.ano(v, x, nivel, r);
  return true;
}

/** Onde a história da atividade está, em palavras ("titular · campeão dos jogos escolares (2039)"). */
export function estadoDoArco(rotinaId: string, x: Vivencia | undefined): string | undefined {
  const m = ARCOS[rotinaId];
  if (!m || !x?.etapa) return undefined;
  const papel = x.papel && x.papel !== m.etapas[x.etapa] ? `${x.papel} · ` : '';
  return `${papel}${m.etapas[x.etapa] ?? x.etapa}${x.feito ? ` · ${x.feito}` : ''}`;
}

export const temArco = (rotinaId: string) => !!ARCOS[rotinaId];

export { ge };
