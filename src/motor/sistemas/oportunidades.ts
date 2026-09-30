/**
 * Oportunidades: portas que a vida abre AGORA, por um motivo.
 *
 * O jogador não escolhe de um catálogo universal de profissões; ele vê o que
 * está ao alcance por causa do que viveu: a escola divulgou vaga de jovem
 * aprendiz, o curso abriu estágio, uma amiga que trabalha numa loja pode
 * indicar, o treinador indicou para a peneira, a vizinha quer encomendar um
 * bolo, o sítio da família precisa de alguém. Cada porta expira. Aceitar é
 * escolha; deixar passar também.
 *
 * Os geradores olham o estado (idade, estudo, trabalho, frentes, pessoas com
 * ocupação, cidade) e têm intervalo mínimo — ninguém recebe a mesma porta
 * todo ano.
 */

import { OCUPACOES_DE_ATLETA } from './esporte';
import { conviteDaEspecialidade } from './medicina';
import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Oportunidade, TipoOportunidade, Vida } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, novoId, parentes, temFato, vinculosVivos } from '../nucleo';
import { ocupacao, ocupacaoOuNula, type Ocupacao } from '../dados/ocupacoes';
import { cursoOuNulo } from '../dados/cursos';
import { municipio, nivelDeOferta } from '../dados/lugares';
import { forcaDoSetor } from '../dados/mercado';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { elegibilidade, experienciaNaTrilha, nomeOcupacao, porContaPropria, semOcupacao } from './trabalho';
import { mediaEscolar } from './frentes';
import { modeloRotina, podeComecarRotina } from './rotinas';
import { semana } from './semana';
import { voltarAEstudar } from './escola';
import { anoDe } from '../tempo';
import { rngDe } from '../rng';
import { podeTentar } from '../plausibilidade';
import { conviteDoProfessor, exColegasDaArea, ofereceAqui } from './formacao';
import { flex, ge } from '../texto';
import { apresentarNoFestival } from './cena';

export const LIMITE_OPORTUNIDADES = 4;

export function novaOportunidade(v: Vida, o: { tipo: TipoOportunidade; titulo: string; texto: string; meses: number; chave: string; ocupacaoId?: string; dominio?: Dominio; pessoaId?: string; municipioId?: string; bonus?: number; atividade?: string }): Oportunidade | undefined {
  const lista = v.caminhos.oportunidades;
  if (lista.some(x => x.tipo === o.tipo && x.ocupacaoId === o.ocupacaoId && x.dominio === o.dominio)) return undefined;
  if (lista.length >= LIMITE_OPORTUNIDADES) lista.shift();
  const op: Oportunidade = { id: novoId(v, 'op'), tipo: o.tipo, titulo: o.titulo, texto: o.texto, tInicio: v.t, tFim: v.t + o.meses, ocupacaoId: o.ocupacaoId, dominio: o.dominio, pessoaId: o.pessoaId, municipioId: o.municipioId, bonus: o.bonus, ...(o.atividade ? { atividade: o.atividade } : {}) };
  lista.push(op);
  v.caminhos.ultimas[o.chave] = v.t;
  return op;
}

const podeGerar = (v: Vida, chave: string, anos: number) => v.caminhos.ultimas[chave] === undefined || v.t - v.caminhos.ultimas[chave] >= anos * 12;
const semTrabalho = (v: Vida) => semOcupacao(v);
const trabalhoFraco = (v: Vida) => !!v.trabalho.atual && (['informal', 'temporario'].includes(v.trabalho.atual.contrato) || (ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.nivel ?? 0) <= 1);

/* -------------------------------------------------------------- Geradores */

export function processarOportunidades(v: Vida, r: Rng): void {
  const i = idade(v);
  // Portas que expiraram (ou deixaram de fazer sentido).
  v.caminhos.oportunidades = v.caminhos.oportunidades.filter(o => o.tFim > v.t && (!o.pessoaId || v.pessoas[o.pessoaId]?.vivo));
  if (v.morte) return;
  const b = v.educacao.basica;
  const m = v.educacao.matricula;

  // Jovem aprendiz: a escola divulga.
  // A escola com parceria (empresas da cidade) divulga mais (o perfil da instituição: `formacao`).
  if (i >= 14 && i <= 17 && b && semTrabalho(v) && podeGerar(v, 'aprendiz', 2) && r.chance(ofereceAqui(v, 'parceria') ? 0.45 : 0.3)) {
    const oc = ocupacao('jovem_aprendiz');
    if (elegibilidade(v, oc).grau !== 'ilegal') novaOportunidade(v, { tipo: 'aprendiz', ocupacaoId: oc.id, meses: 12, chave: 'aprendiz', bonus: 0.25, titulo: 'Jovem aprendiz', texto: `A escola divulgou vagas de jovem aprendiz ${r.pick(['numa rede de supermercados', 'num escritório do centro', 'numa distribuidora', 'numa agência bancária'])}. Meio período, carteira assinada, escola garantida.` });
  }

  // Estágio pelo curso (técnico, integrado ou faculdade).
  const cursoAtual = m && !m.trancado ? cursoOuNulo(m.cursoId) : b?.integrado ? cursoOuNulo(b.integrado) : undefined;
  // Quem tem projeto técnico, empresa júnior ou iniciação na área recebe mais chamados de estágio — às vezes pela mão de quem orienta.
  const vivenciaDeCurso = (v.educacao.vivencias ?? []).find(x => x.tFim === undefined && ['projeto_tecnico', 'empresa_junior', 'iniciacao'].includes(x.tipo));
  if (cursoAtual && i >= 16 && (semTrabalho(v) || v.trabalho.atual?.contrato === 'aprendiz') && podeGerar(v, 'estagio', 1) && r.chance(vivenciaDeCurso ? 0.6 : 0.4)) {
    const estagios = ['estagio_ti', 'estagio_direito', 'estagio_eng', 'estagio_adm'].map(ocupacao).filter(oc => elegibilidade(v, oc).grau === 'permitido' || elegibilidade(v, oc).grau === 'improvavel');
    const naArea = estagios.find(oc => oc.area?.includes(cursoAtual.area as never)) ?? (cursoAtual.nivel !== 'livre' ? estagios.find(oc => oc.id === 'estagio_adm') : undefined);
    const quemIndica = vivenciaDeCurso?.pessoaId && v.pessoas[vivenciaDeCurso.pessoaId]?.vivo ? v.pessoas[vivenciaDeCurso.pessoaId] : undefined;
    if (naArea) novaOportunidade(v, { tipo: 'estagio', ocupacaoId: naArea.id, meses: 12, chave: 'estagio', bonus: vivenciaDeCurso ? 0.38 : 0.3, pessoaId: quemIndica?.id, titulo: `Estágio: ${nomeOcupacao(v, naArea)}`,
      texto: quemIndica ? `${quemIndica.nome}, que orienta o seu ${vivenciaDeCurso!.tipo === 'iniciacao' ? 'projeto de pesquisa' : 'projeto'}, indicou você para um estágio na área.` : vivenciaDeCurso ? `Uma empresa que viu o ${vivenciaDeCurso.tipo === 'empresa_junior' ? 'trabalho da empresa júnior' : 'projeto do laboratório'} abriu uma vaga de estágio e perguntou por você.` : `${cursoAtual.nivel === 'superior' ? 'A coordenação do curso' : 'A escola técnica'} divulgou uma vaga de estágio que pede exatamente o que você estuda.` });
  }

  // Temporário: fim de ano no comércio, safra no interior.
  if (i >= 16 && i <= 30 && semTrabalho(v) && (!m || m.trancado) && podeGerar(v, 'temporario', 2) && r.chance(0.25)) {
    const safra = forcaDoSetor(v.moradia.municipioId, 'agro', anoDe(v.t)) > 1.1 && i >= 18;
    novaOportunidade(v, { tipo: 'temporario', ocupacaoId: safra ? 'trabalhador_rural' : 'atendente', meses: 6, chave: 'temporario', titulo: safra ? 'Contratam para a colheita' : 'Temporário de fim de ano',
      texto: safra ? `A ${r.pick(['colheita de café', 'safra de laranja', 'colheita da soja', 'safra de uva'])} está contratando por três meses. Trabalho pesado, pagamento certo.` : 'Uma loja do centro contrata temporários para o Natal. Três meses — e às vezes alguém é efetivado.' });
  }

  // Indicação: gente que você conhece, trabalhando em algum lugar.
  if (i >= 17 && i <= 64 && (semTrabalho(v) || trabalhoFraco(v)) && !v.trabalho.aposentadoria && podeGerar(v, 'indicacao', 1)) {
    const conhecidos = vinculosVivos(v).filter(x => x.p.ocupacaoId && x.p.renda > 0 && x.p.municipioId === v.moradia.municipioId && idadePessoa(v, x.p) >= 18 && x.vin.proximidade >= 40 && !x.p.especie);
    // Quem está sem trabalho ou no informal é quem mais recebe indicação (e quem mais precisa).
    const chance = clamp(0.1 + conhecidos.length * 0.05, 0, 0.55) * (semTrabalho(v) ? 1 : v.trabalho.atual?.contrato === 'informal' ? 0.8 : 0.5);
    if (conhecidos.length && r.chance(chance)) {
      const quem = r.pick(conhecidos);
      const trilha = ocupacao(quem.p.ocupacaoId!).trilha;
      const entradas = OCUPACOES_POR_TRILHA(trilha).filter(oc => !oc.concurso && !oc.entrada && oc.contrato !== 'estagio' && oc.contrato !== 'aprendiz' && v.trabalho.atual?.ocupacaoId !== oc.id)
        .filter(oc => { const d = elegibilidade(v, oc); return d.grau === 'permitido' || d.grau === 'improvavel'; })
        .sort((a, b) => b.nivel - a.nivel);
      const oc = entradas.find(x => x.nivel <= Math.max(1, ocupacao(quem.p.ocupacaoId!).nivel)) ?? entradas[entradas.length - 1];
      if (oc) {
        const onde = porContaPropria(oc) ? 'passar serviço para você' : 'indicar você onde trabalha';
        novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: oc.id, pessoaId: quem.p.id, meses: 12, chave: 'indicacao', bonus: 0.28, titulo: `Indicação de ${quem.p.nome}`,
          texto: `${quem.p.nome}, que trabalha como ${quem.p.ocupacao}, disse que pode ${onde}: ${nomeOcupacao(v, oc)}${porContaPropria(oc) ? ' — por conta própria (clientes seus, preço seu, sem patrão nem salário fixo)' : ' — vaga de emprego, com entrevista'}.` });
      }
    }
  }

  // A especialidade médica atrai o convite da área (a equipe cirúrgica, o hospital infantil, a saúde da família):
  // aceitar passa pela pergunta do que fazer com o trabalho de agora.
  if (i >= 26 && podeGerar(v, 'convite_medico', 4) && r.chance(0.3)) {
    const c = conviteDaEspecialidade(v);
    if (c && podeTentar(elegibilidade(v, c.oc, 'oportunidade'))) novaOportunidade(v, { tipo: 'convite', ocupacaoId: c.oc.id, meses: 12, chave: 'convite_medico', titulo: c.titulo, texto: c.texto });
  }

  // Freguesia: quem sabe fazer algo começa a receber pedidos.
  if (i >= 16 && podeGerar(v, 'clientela', 3)) {
    const oficios: [Dominio, string, number, string][] = [
      ['cozinha', 'encomendas', 40, 'Uma vizinha provou sua comida e quer encomendar para a festa da filha. Depois dela, vem a prima.'],
      ['manual', 'consertos', 42, 'O vizinho pediu para você dar um jeito na instalação da casa dele — e contou para o prédio inteiro.'],
      ['beleza', 'cortes_por_fora', 40, 'Os amigos começaram a pedir para cortar o cabelo. Alguns já querem pagar.'],
      ['musica', 'tocar_na_noite', 52, 'O dono de um bar ouviu você tocar e perguntou se toparia umas noites por mês, com cachê.'],
      ['desenho', 'freelas', 56, 'Alguém viu seus desenhos e perguntou quanto você cobraria por uma arte.'],
      ['fotografia', 'freelas', 56, 'Uma amiga quer que você fotografe o casamento dela — e paga.'],
      ['programacao', 'freelas', 58, 'Um comerciante do bairro quer um site e ouviu dizer que você sabe fazer.']
    ];
    const possiveis = oficios.filter(([d, rot, min]) => habilidade(v, d) >= min && !v.rotinas.some(x => x.id === rot) && podeComecarRotina(v, rot).grau !== 'requisito');
    if (possiveis.length && r.chance(0.22)) {
      const [d, rot, , texto] = r.pick(possiveis);
      novaOportunidade(v, { tipo: 'clientela', dominio: d, meses: 12, chave: 'clientela', titulo: 'Começaram a pedir', texto, ocupacaoId: undefined, bonus: undefined });
      v.fatos[`clientela_rotina_${d}`] = ROTINA_ID[rot] ?? 0;
    }
  }

  // Um sonho antigo: a frente parada há anos, tempo sobrando.
  if (i >= 30 && i <= 75 && podeGerar(v, 'retomar', 6)) {
    const antigas = (Object.entries(v.caminhos.frentes) as [Dominio, NonNullable<Vida['caminhos']['frentes'][Dominio]>][])
      .filter(([d, f]) => f.auge >= 42 && (v.t - f.tUltimo) >= 96 && modeloRotina(d) && !['exatas', 'linguagens', 'ciencias', 'humanas'].includes(d));
    const folga = semana(v).livre >= 0.5;
    if (antigas.length && folga && r.chance(0.2)) {
      const [d] = r.pick(antigas);
      const t = TEXTO_RETOMAR[d] ?? 'Uma coisa que você fazia muito bem, anos atrás, apareceu de novo no caminho.';
      novaOportunidade(v, { tipo: 'retomar', dominio: d, meses: 12, chave: 'retomar', titulo: 'Uma coisa antiga', texto: t });
    }
  }

  // Proposta de outra empresa: quem é bom e tem estrada.
  const e = v.trabalho.atual;
  if (e && e.contrato === 'clt' && e.desempenho >= 70 && !e.posAposentadoria && i <= 58 && podeGerar(v, 'proposta', 5)) {
    const oc = ocupacao(e.ocupacaoId);
    if (experienciaNaTrilha(v, oc.trilha) >= 36 && r.chance(0.15)) {
      const melhor = OCUPACOES_POR_TRILHA(oc.trilha).filter(x => x.nivel === oc.nivel + 1 && !x.concurso && !x.entrada && elegibilidade(v, x).grau === 'permitido')[0] ?? oc;
      novaOportunidade(v, { tipo: 'proposta', ocupacaoId: melhor.id, meses: 12, chave: 'proposta', bonus: 0.18, titulo: 'Uma proposta', texto: `Uma concorrente${melhor.id !== oc.id ? ` quer você como ${nomeOcupacao(v, melhor)}` : ' quer você para a mesma função'}, com salário melhor. Seria recomeçar num lugar novo, sem os anos de casa.` });
    }
  }

  // Bolsa em colégio particular para quem vai muito bem na pública.
  if (i >= 10 && i <= 14 && b?.rede === 'publica' && !temFato(v, 'bolsa_escola') && podeGerar(v, 'bolsa', 20) && (mediaEscolar(v) >= 62 || temFato(v, 'medalha_obmep')) && r.chance(0.3)) {
    novaOportunidade(v, { tipo: 'bolsa', meses: 12, chave: 'bolsa', titulo: 'Bolsa num colégio particular', texto: 'Um colégio particular da cidade oferece bolsa integral a alunos de escola pública que vão muito bem. A professora mandou seu nome.' });
  }

  // Seleção do instituto federal (médio integrado ao técnico).
  if (i >= 14 && i <= 15 && b && (b.etapa === 'fundamental2' && b.serie >= 9 || b.etapa === 'medio' && b.serie === 1) && !b.integrado && podeGerar(v, 'selecao_tecnico', 3)
    // Quem vai bem na escola ouve falar da prova (a professora avisa, os colegas comentam); quem vai mal, nem sempre.
    && r.chance(clamp((nivelDeOferta(v.moradia.municipioId) >= 1 ? 0.35 : 0.2) + ((b.desempenho ?? 50) - 50) / 60 + (v.educacao.postura === 'dedicada' ? 0.15 : 0) + (temFato(v, 'incentivo_if') ? 0.4 : 0), 0.1, 0.95))) {
    novaOportunidade(v, { tipo: 'selecao_tecnico', meses: 12, chave: 'selecao_tecnico', titulo: 'Seleção do instituto federal', texto: `O instituto federal ${nivelDeOferta(v.moradia.municipioId) >= 1 ? 'da cidade' : 'da região'} abriu a prova para o ensino médio integrado ao técnico: três anos, dia inteiro, e um diploma de técnico junto com o do médio.${temFato(v, 'incentivo_if') ? ' A professora que tinha sugerido a prova lembrou você da inscrição.' : ''}` });
  }

  // Ensinar o ofício: quem tem técnico e muitos anos de estrada vira instrutor.
  if (i >= 32 && i <= 62 && podeGerar(v, 'instrutor', 8) && v.trabalho.atual?.ocupacaoId !== 'instrutor_tecnico') {
    const oc = ocupacao('instrutor_tecnico');
    const d = elegibilidade(v, oc);
    if ((d.grau === 'permitido' || d.grau === 'improvavel') && r.chance(0.15)) {
      novaOportunidade(v, { tipo: 'vaga', ocupacaoId: oc.id, meses: 12, chave: 'instrutor', bonus: 0.3, titulo: 'Ensinar o ofício', texto: 'A escola técnica da cidade procura instrutores com muitos anos de prática. Alguém lembrou do seu nome.' });
    }
  }

  // Quem largou a escola: a EJA à noite.
  if (v.educacao.evadiu && !b && i >= 18 && i <= 60 && podeGerar(v, 'eja', 5) && r.chance(0.3)) {
    novaOportunidade(v, { tipo: 'convite', meses: 12, chave: 'eja', titulo: 'Terminar a escola', texto: 'A escola do bairro abriu turma de EJA à noite: dá para terminar o ensino que ficou pela metade, sem largar o trabalho.' });
  }

  // Pesquisa depois do doutorado.
  // Quem trabalha fora da pesquisa também recebe o chamado (menos: quem está longe da universidade ouve menos) — a vida acumulada abre a porta.
  const doutorado = [...v.educacao.concluidos].filter(c => c.nivel === 'doutorado').sort((a, b) => b.tFim - a.tFim)[0];
  const naPesquisa = ['pesquisador', 'professor_univ', 'pesquisador_instituto'].includes(v.trabalho.atual?.ocupacaoId ?? '');
  if (doutorado && !naPesquisa && i <= 55 && podeGerar(v, 'posdoc', 3) && r.chance(semTrabalho(v) ? 0.5 : v.t - doutorado.tFim <= 96 ? 0.25 : 0.1)) {
    const area = doutorado.nome.replace(/^Doutorado ?/, '').replace(/^em /, '');
    novaOportunidade(v, { tipo: 'bolsa', ocupacaoId: 'pesquisador', meses: 12, chave: 'posdoc', titulo: 'Bolsa de pesquisa', texto: `Um programa de pós-graduação abriu bolsa de pós-doutorado${area ? ` em ${area}` : ' na sua área'}. Dois anos de pesquisa, sem vínculo.` });
  }

  // A formação como lugar (REWORK 3): o professor que reparou faz UM convite; a turma de faculdade, anos depois, indica.
  portasDaFormacao(v);

  // A terra da família.
  if (i >= 18 && i <= 55 && habilidade(v, 'campo') >= 35 && podeGerar(v, 'terra', 8) && v.trabalho.atual?.ocupacaoId !== 'produtor_rural') {
    const rural = parentes(v, 'mae', 'pai', 'avo', 'tio').find(p => p.ocupacaoId && ['campo', 'agro'].includes(ocupacaoOuNula(p.ocupacaoId)?.trilha ?? ''));
    if ((rural || forcaDoSetor(v.moradia.municipioId, 'agro', anoDe(v.t)) > 1.2) && r.chance(0.18)) {
      novaOportunidade(v, { tipo: 'convite', ocupacaoId: 'produtor_rural', pessoaId: rural?.id, meses: 12, chave: 'terra', titulo: rural ? `O sítio de ${rural.nome}` : 'Uma terra para arrendar',
        texto: rural ? `${rural.nome} não dá mais conta do sítio sozinh${flex(rural.genero, 'o', 'a', 'e')} e quer que você assuma a produção.` : 'Um conhecido arrenda um pedaço de terra por um preço que dá para pagar com a primeira safra.' });
    }
  }
}

/**
 * As portas que a formação abre (geradores derivados: não mexem no gerador
 * principal). O convite do professor aparece uma vez; a indicação de um
 * ex-colega, quando a vida pede (sem trabalho, ou num trabalho aquém) e há
 * alguém da turma trabalhando na área.
 */
function portasDaFormacao(v: Vida): void {
  const i = idade(v);
  const convite = conviteDoProfessor(v);
  if (convite) {
    v.fatos[`convite_prof_${convite.pessoaId}`] = v.t;
    if (convite.incentivoIf) {
      marcarFato(v, 'incentivo_if');
      lembrarCom(v, convite.pessoaId, 'Sugeriu a prova do instituto federal e ofereceu aulas de preparação.', 'apoio', 2);
      escrever(v, { texto: `${convite.texto}`, relevancia: 'biografia', tema: 'escola', pessoas: [convite.pessoaId] });
    } else if (convite.atividade) {
      novaOportunidade(v, { tipo: 'iniciacao', meses: 12, chave: `convite_${convite.atividade}`, pessoaId: convite.pessoaId, titulo: convite.titulo, texto: convite.texto, atividade: convite.atividade });
    }
  }
  const r = rngDe(v.id, 'rede_formacao', v.t);
  if (i >= 21 && i <= 50 && (semTrabalho(v) || trabalhoFraco(v)) && !v.trabalho.aposentadoria && podeGerar(v, 'indicacao_formacao', 4)) {
    const areas = [...new Set(v.educacao.concluidos.filter(c => c.nivel !== 'livre').map(c => c.area))];
    for (const area of areas) {
      const quem = exColegasDaArea(v, area).find(p => p.municipioId === v.moradia.municipioId);
      if (!quem || !r.chance(0.3)) continue;
      const oc = OCUPACOES.filter(o => o.area?.includes(area as never) && !o.concurso && !o.entrada && o.contrato !== 'estagio' && o.contrato !== 'aprendiz' && v.trabalho.atual?.ocupacaoId !== o.id)
        .filter(o => { const d = elegibilidade(v, o); return d.grau === 'permitido' || d.grau === 'improvavel'; })
        .sort((a, b) => a.nivel - b.nivel)[0];
      if (!oc) continue;
      const vin = v.vinculos[quem.id];
      const anos = vin?.formacao?.tFim !== undefined ? Math.max(1, Math.floor((v.t - vin.formacao.tFim) / 12)) : 0;
      novaOportunidade(v, { tipo: 'indicacao', ocupacaoId: oc.id, pessoaId: quem.id, meses: 12, chave: 'indicacao_formacao', bonus: 0.3, titulo: `Indicação de ${quem.nome}, da sua turma`,
        texto: `${quem.nome} estudou com você${anos ? ` — faz ${anos} ${anos === 1 ? 'ano' : 'anos'} que não se viam` : ''}. Hoje trabalha como ${quem.ocupacao} e lembrou de você para uma vaga: ${nomeOcupacao(v, oc)}.` });
      break;
    }
  }
}

const ROTINA_ID: Record<string, number> = { encomendas: 1, consertos: 2, cortes_por_fora: 3, tocar_na_noite: 4, freelas: 5 };
const ROTINA_POR_NUMERO = ['', 'encomendas', 'consertos', 'cortes_por_fora', 'tocar_na_noite', 'freelas'];

const TEXTO_RETOMAR: Partial<Record<Dominio, string>> = {
  musica: 'O instrumento que ficou anos no armário. Um amigo antigo chamou para tocar num sarau.',
  futebol: 'Montaram um time de veteranos no bairro e estão chamando quem já jogou.',
  volei: 'Tem vôlei de veteranos na praça, aos sábados.',
  basquete: 'Tem um racha de basquete na quadra do parque, de terça e quinta à noite.',
  tenis: 'O clube do bairro abriu horário de tênis para adultos, com torneio interno.',
  teatro: 'Um grupo de teatro amador está procurando gente para a próxima peça.',
  danca: 'Abriu uma turma de dança para adultos perto de casa.',
  desenho: 'Você encontrou um caderno de desenhos antigo. Ainda dá vontade.',
  escrita: 'Um concurso de contos da prefeitura abriu inscrições.',
  natacao: 'A piscina do clube abriu horário para adultos.',
  lutas: 'A academia antiga tem turma para quem voltou a treinar.',
  xadrez: 'Tem torneio de xadrez na praça todo domingo.',
  fotografia: 'A câmera antiga voltou a funcionar.',
  cozinha: 'A família inteira pede aquela receita que você fazia.'
};

import { OCUPACOES } from '../dados/ocupacoes';
const OCUPACOES_POR_TRILHA = (trilha: string): Ocupacao[] => OCUPACOES.filter(x => x.trilha === trilha);

/* ------------------------------------------------------------- Aceitar */

import { propor } from './compromissos';

export interface Aceite {
  texto: string;
  tom?: 'bom' | 'ruim' | 'neutro';
  /** Decisão que precisa abrir em seguida (a peneira, a seleção). */
  decisao?: string;
  /** Candidatura com entrevista (e o bônus que a porta dá). */
  entrevista?: { ocupacaoId: string; bonus: number; via: string };
}

export function aceitarOportunidade(v: Vida, r: Rng, id: string): Aceite {
  const o = v.caminhos.oportunidades.find(x => x.id === id);
  if (!o) return { texto: 'Essa porta já fechou.', tom: 'ruim' };
  v.caminhos.oportunidades = v.caminhos.oportunidades.filter(x => x.id !== id);
  const oc = o.ocupacaoId ? ocupacaoOuNula(o.ocupacaoId) : undefined;
  switch (o.tipo) {
    case 'aprendiz': case 'estagio': case 'indicacao': case 'vaga': case 'proposta': case 'reinsercao': {
      if (!oc) return { texto: 'A vaga sumiu.' };
      if (o.pessoaId) lembrarCom(v, o.pessoaId, `Indicou você para um trabalho: ${nomeOcupacao(v, oc)}.`, 'apoio', 2);
      if (porContaPropria(oc)) {
        const res = propor(v, r, { tipo: 'emprego', ocupacaoId: oc.id, via: o.tipo === 'indicacao' ? 'indicacao' : o.tipo });
        return { texto: res === 'feito' ? `Começou a trabalhar como ${nomeOcupacao(v, oc)}.` : res === 'perdido' ? PASSOU : '', tom: res === 'perdido' ? 'neutro' : 'bom' };
      }
      return { texto: '', entrevista: { ocupacaoId: oc.id, bonus: o.bonus ?? 0.15, via: o.tipo === 'indicacao' ? 'indicacao' : o.tipo } };
    }
    case 'temporario': {
      const agro = o.ocupacaoId === 'trabalhador_rural';
      const trilha = agro ? 'agro' : 'comercio';
      v.trabalho.experiencia[trilha] = (v.trabalho.experiencia[trilha] ?? 0) + 3;
      v.financas.conta += agro ? 5200 : 4600;
      if (!temFato(v, 'primeiro_emprego')) { marcarFato(v, 'primeiro_emprego'); marcar(v, 'primeiro_emprego', `Primeiro trabalho: temporário ${agro ? 'na colheita' : 'no comércio'}, aos ${idade(v)}.`, 2, { trilha }); }
      const efetivado = !agro && r.chance(0.3 + v.personalidade.tracos.disciplina / 300);
      if (efetivado) {
        // A efetivação é uma vaga como qualquer outra: se não cabe com o que já existe, o jogo pergunta.
        escrever(v, { texto: 'O temporário de fim de ano acabou em convite para ficar.', relevancia: 'cotidiano', tema: 'trabalho', tom: 'bom' });
        const res = propor(v, r, { tipo: 'emprego', ocupacaoId: 'atendente', via: 'temporario', texto: 'Em janeiro, a loja chamou para ficar: atendente, de carteira assinada.' });
        return { texto: res === 'feito' ? 'Três meses de correria — e em janeiro chamaram para ficar.' : 'Três meses de correria — e um convite para ficar.', tom: 'bom' };
      }
      escrever(v, { texto: agro ? 'Trabalhou três meses na colheita. Dinheiro no bolso e as costas doendo.' : 'Trabalhou como temporário no fim de ano. Em janeiro, o contrato acabou.', relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return { texto: 'Três meses de trabalho, dinheiro no bolso. Depois, acabou.' };
    }
    case 'peneira': case 'seletiva': {
      const d = o.dominio ?? 'futebol';
      const lugar = o.municipioId ?? v.moradia.municipioId;
      v.fatos['peneira_mod'] = MODS.indexOf(d);
      v.fatos['peneira_lugar'] = municipioIndex(lugar);
      const clube = o.titulo.replace(/^(Peneira|Seletiva) (no|na) /, '').replace(/^Seletiva: /, '');
      v.caminhos.processo = { tipo: 'peneira', dominio: d, municipioId: lugar, bonus: 0, via: o.pessoaId ? 'indicacao' : 'oportunidade', etapas: [], atual: 0, lugar: clube };
      return { texto: '', decisao: 'esp_peneira' };
    }
    case 'convite': {
      if (!oc && v.educacao.evadiu && !v.educacao.basica && o.titulo === 'Terminar a escola') { voltarAEstudar(v); return { texto: 'Caderno novo, turma cansada e adulta, aula das sete às dez.', tom: 'bom' }; }
      if (!oc) return { texto: 'O convite não se confirmou.' };
      if (OCUPACOES_DE_ATLETA.includes(oc.id)) { v.fatos['contrato_nivel'] = o.bonus ?? 1; return { texto: '', decisao: 'esp_contrato' }; }
      const arte = ['musico_profissional', 'ator', 'ator_reconhecido', 'bailarino', 'criador_conteudo', 'escritor'].includes(oc.id);
      const res = propor(v, r, { tipo: 'emprego', ocupacaoId: oc.id, via: 'convite', pessoaId: o.pessoaId, extra: oc.id === 'produtor_rural' ? (o.pessoaId ? 'rural_familia' : 'rural_arrendada') : arte ? 'arte' : undefined });
      return { texto: res === 'feito' ? `Agora é ${nomeOcupacao(v, oc)}.` : res === 'perdido' ? PASSOU : '', tom: res === 'perdido' ? 'neutro' : 'bom' };
    }
    case 'clientela': {
      const rot = ROTINA_POR_NUMERO[v.fatos[`clientela_rotina_${o.dominio}`] ?? 0];
      delete v.fatos[`clientela_rotina_${o.dominio}`];
      if (!rot) return { texto: 'Os pedidos pararam.' };
      const d = podeComecarRotina(v, rot, 1);
      if (d.grau !== 'permitido' && d.grau !== 'irregular') return { texto: d.motivo ?? 'Não coube agora.', tom: 'ruim' };
      v.rotinas.push({ id: rot, tInicio: v.t, nivel: 1 });
      escrever(v, { texto: `Começou a ganhar um dinheiro por fora: ${modeloRotina(rot)!.nome.toLowerCase()}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      return { texto: 'Os primeiros pedidos vieram de conhecidos. O resto, de boca em boca.', tom: 'bom' };
    }
    case 'retomar': {
      const d = o.dominio!;
      const mod = modeloRotina(d);
      if (!mod) return { texto: 'Não deu.' };
      const disp = podeComecarRotina(v, d, 1);
      if (disp.grau !== 'permitido') return { texto: disp.motivo ?? 'Não coube agora.', tom: 'ruim' };
      v.rotinas.push({ id: d, tInicio: v.t, nivel: 1 });
      const f = v.caminhos.frentes[d];
      if (f) f.interesse = clamp(f.interesse + 25);
      const texto = `Voltou a ${VERBO[d] ?? 'praticar'} depois de ${Math.floor((v.t - (f?.tUltimo ?? v.t)) / 12)} anos.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom', escolha: true });
      marcar(v, 'retomada', texto, 2, { dominio: d });
      return { texto: 'Nas primeiras vezes, a mão estranhou. Depois, lembrou.', tom: 'bom' };
    }
    case 'bolsa': {
      if (oc) {
        const res = propor(v, r, { tipo: 'emprego', ocupacaoId: oc.id, via: 'bolsa' });
        return { texto: res === 'feito' ? 'Dois anos de pesquisa pela frente.' : res === 'perdido' ? PASSOU : '', tom: res === 'perdido' ? 'neutro' : 'bom' };
      }
      const b = v.educacao.basica;
      if (!b) return { texto: 'A bolsa já não se aplica.' };
      b.rede = 'privada';
      marcarFato(v, 'bolsa_escola');
      const texto = 'Ganhou bolsa integral num colégio particular.';
      escrever(v, { texto, relevancia: 'marco', tema: 'escola', tom: 'bom', escolha: true });
      marcar(v, 'conquista', texto, 2);
      return { texto: 'Uniforme novo, colegas novos, uma escola que cobra mais.', tom: 'bom' };
    }
    case 'selecao_tecnico':
      return { texto: '', decisao: 'esc_selecao_if' };
    case 'iniciacao': {
      // O convite de um professor: a atividade começa (se cabe na semana), com quem convidou por perto.
      const id = o.atividade;
      const mod = id ? modeloRotina(id) : undefined;
      if (!id || !mod) return { texto: 'O convite não se confirmou.' };
      const disp = podeComecarRotina(v, id, 1);
      if (!podeTentar(disp)) return { texto: disp.motivo ?? 'Não coube agora.', tom: 'ruim' };
      v.rotinas.push({ id, tInicio: v.t, nivel: 1 });
      const p = o.pessoaId ? v.pessoas[o.pessoaId] : undefined;
      if (p && v.vinculos[p.id]) {
        v.vinculos[p.id].proximidade = clamp(v.vinculos[p.id].proximidade + 8);
        v.vinculos[p.id].aproximacao = v.t;
        if (id === 'iniciacao' && v.vinculos[p.id].formacao) v.vinculos[p.id].formacao!.papel = 'orientador';
        lembrarCom(v, p.id, `Aceitou o convite: ${mod.nome.toLowerCase()}.`, 'apoio', 2);
      }
      escrever(v, { texto: `Aceitou o convite${p ? ` de ${p.nome}` : ''}: ${mod.nome.toLowerCase()}.`, relevancia: 'biografia', tema: id === 'iniciacao' || id === 'monitoria' ? 'estudo' : 'escola', escolha: true, pessoas: p ? [p.id] : undefined });
      return { texto: p ? `${p.nome} sorriu como quem já esperava o sim.` : 'Começou na semana seguinte.', tom: 'bom' };
    }
    case 'banda': case 'grupo':
      v.fatos['projeto_convite'] = MODS_ARTE.indexOf(o.dominio ?? 'musica');
      if (o.pessoaId) v.fatos['projeto_pessoa_marca'] = v.t;
      return { texto: '', decisao: 'arte_projeto' };
    case 'edital_cultura':
      // O festival que chamou: aceitar é ir lá e se apresentar — com o resultado que vier (`cena`).
      return apresentarNoFestival(v, r, o);
  }
  // Toda escolha consumida tem uma resolução observável (nunca "nada aconteceu"): uma porta sem regra própria vira registro do sim.
  escrever(v, { texto: `Aceitou: ${o.titulo.toLowerCase()}.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  return { texto: `Você disse que sim (${o.titulo.toLowerCase()}). Por ora, ficou combinado — e registrado.` };
}

/** O que dizer quando a oferta não entrou agora porque outra escolha grande está em aberto (`propor` → 'perdido'). */
const PASSOU = 'Chegou quando outra escolha grande estava em aberto — e o prazo passou. Ficou registrado na Linha da Vida.';

const VERBO: Partial<Record<Dominio, string>> = { musica: 'tocar', futebol: 'jogar bola', volei: 'jogar vôlei', basquete: 'jogar basquete', tenis: 'jogar tênis', teatro: 'fazer teatro', danca: 'dançar', desenho: 'desenhar', escrita: 'escrever', natacao: 'nadar', lutas: 'treinar luta', xadrez: 'jogar xadrez', fotografia: 'fotografar', cozinha: 'cozinhar' };
// (Novas modalidades entram no FIM: o índice é guardado nos fatos da peneira.)
export const MODS: Dominio[] = ['futebol', 'volei', 'natacao', 'atletismo', 'lutas', 'basquete', 'tenis'];
export const MODS_ARTE: Dominio[] = ['musica', 'teatro', 'danca'];

import { MUNICIPIOS } from '../dados/lugares';
const municipioIndex = (id: string) => Math.max(0, MUNICIPIOS.findIndex(m => m.id === id));
export const municipioPorIndice = (n: number) => MUNICIPIOS[n]?.id;
export const municipioIndice = municipioIndex;

export function recusarOportunidade(v: Vida, id: string): void {
  v.caminhos.oportunidades = v.caminhos.oportunidades.filter(x => x.id !== id);
}

export { municipio, ge };
