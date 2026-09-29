/**
 * Arte: hobby de décadas ou, às vezes, profissão.
 *
 *   interesse → praticar → tocar/atuar/dançar em público pela primeira vez →
 *   um grupo (banda, grupo de teatro, companhia), com gente real da vida →
 *   ensaios, apresentações, público que cresce devagar → às vezes um convite
 *   para viver disso; quase sempre, a arte fica como parte da vida.
 *
 * Tentar é mais comum que conseguir. Um projeto acaba quando a vida dos
 * membros puxa para outro lado (trabalho, filhos, mudança) ou quando o
 * público não vem. Nada disso impede de tocar no casamento da filha aos 60.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Obra, ProjetoArtistico, Vida } from '../tipos';
import { amigos, escrever, idade, lembrarCom, marcarFato, temFato, vinculosVivos } from '../nucleo';
import { forcaDoSetor } from '../dados/mercado';
import { habilidade } from './frentes';
import { marcar } from './marcas';
import { novaOportunidade } from './oportunidades';
import { anoDe } from '../tempo';
import { flex, ge } from '../texto';
import { criarPessoa, vincular } from '../pessoas';
import { temporadaDePalco } from './palco';

const LINGUAGENS: Dominio[] = ['musica', 'teatro', 'danca'];

const PRIMEIRA_VEZ: Partial<Record<Dominio, string[]>> = {
  musica: ['Tocou em público pela primeira vez, no sarau da escola. As mãos tremiam; ninguém percebeu.', 'Tocou na missa de domingo pela primeira vez.', 'Tocou pela primeira vez para gente de fora, numa festa de aniversário.'],
  teatro: ['Subiu no palco pela primeira vez, na peça de fim de ano. Esqueceu uma fala e improvisou.', 'Estreou na primeira peça do grupo, para um auditório quase cheio.'],
  danca: ['Dançou pela primeira vez num festival, com a turma inteira no palco.', 'Primeira apresentação de dança, com figurino costurado em casa.']
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

function nomeDoProjeto(v: Vida, d: Dominio): string {
  const h = hash(`${v.id}:${v.t}:${d}`);
  if (d === 'musica') return ['Madrugada Fria', 'Os Últimos da Fila', 'Quintal Elétrico', 'Sete Cordas', 'Maré Baixa', 'Fim de Feira', 'Varanda'][Math.floor(h * 7)];
  if (d === 'teatro') return ['Grupo Tapete Vermelho', 'Cia. Porão', 'Grupo Pano de Boca', 'Coletivo Palco Aberto'][Math.floor(h * 4)];
  return ['Cia. Chão Batido', 'Grupo Passo Largo', 'Coletivo Corpo Aberto'][Math.floor(h * 3)];
}

export function processarArte(v: Vida, r: Rng): void {
  const i = idade(v);
  for (const d of LINGUAGENS) {
    const praticando = v.rotinas.some(x => x.id === d);
    const h = habilidade(v, d);
    // Primeira vez em público.
    if (praticando && h >= 32 && i >= 8 && !temFato(v, `estreia_${d}`) && r.chance(0.55)) {
      marcarFato(v, `estreia_${d}`);
      // Sarau da escola, peça de fim de ano: só para quem ainda está na escola.
      const lista = PRIMEIRA_VEZ[d]!.filter(t => v.educacao.basica || !/escola|fim de ano/.test(t));
      const texto = r.pick(lista.length ? lista : PRIMEIRA_VEZ[d]!);
      escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
      marcar(v, 'estreia', texto, 2, { dominio: d });
    }
    // Um grupo: alguém chama (ou a turma se junta).
    const p = v.caminhos.arte;
    if (praticando && (!p || !p.ativo) && i >= 13 && i <= 75 && h >= (d === 'musica' ? 40 : d === 'teatro' ? 38 : 45)
      && (v.caminhos.ultimas[`projeto_${d}`] === undefined || v.t - v.caminhos.ultimas[`projeto_${d}`] >= 36) && r.chance(0.22)) {
      const colega = amigos(v).find(x => !x.especie && Math.abs(i - Math.floor((v.t - x.tNasc) / 12)) <= 8 && x.municipioId === v.moradia.municipioId);
      const tipo = d === 'musica' ? 'banda' : 'grupo';
      novaOportunidade(v, {
        tipo, dominio: d, pessoaId: colega?.id, meses: 12, chave: `projeto_${d}`,
        titulo: d === 'musica' ? 'Uma banda' : d === 'teatro' ? 'Um grupo de teatro' : 'Um grupo de dança',
        texto: colega ? `${colega.nome} quer montar ${d === 'musica' ? 'uma banda' : 'um grupo'} e chamou você. Ensaios no fim de semana, ${d === 'musica' ? 'na garagem de alguém' : 'num salão emprestado'}.` : `${d === 'musica' ? 'Uma banda do bairro' : 'Um grupo da cidade'} está procurando gente e ouviu falar de você.`
      });
    }
  }
  const p = v.caminhos.arte;
  if (p?.ativo) anoDoProjeto(v, r, p);
  // O ano no palco: datas, valor contratado, custos, o que ficou (e, para quem vive disso, a renda do trabalho).
  temporadaDePalco(v, r);

  // Vídeos que viram público.
  const aud = v.fatos['audiencia'] ?? 0;
  if (aud >= 60 && v.rotinas.some(x => x.id === 'criar_conteudo') && v.trabalho.atual?.ocupacaoId !== 'criador_conteudo' && (v.caminhos.ultimas['criador'] === undefined || v.t - v.caminhos.ultimas['criador'] >= 36) && r.chance((aud - 50) / 80)) {
    novaOportunidade(v, { tipo: 'convite', ocupacaoId: 'criador_conteudo', meses: 12, chave: 'criador', titulo: 'Os vídeos começaram a pagar', texto: 'Marcas começaram a mandar proposta. Pela primeira vez, a conta fecha só com os vídeos — por enquanto.' });
  }
  // Escrita: um prêmio, um livro.
  if (v.rotinas.some(x => x.id === 'escrever') && habilidade(v, 'escrita') >= 70 && !temFato(v, 'premio_literario') && r.chance(0.08)) {
    marcarFato(v, 'premio_literario');
    const texto = 'Um conto ganhou um concurso literário. Saiu numa antologia com o nome inteiro na capa.';
    escrever(v, { texto, relevancia: 'marco', tema: 'lazer', tom: 'bom' });
    marcar(v, 'conquista', texto, 3, { dominio: 'escrita' });
    if (habilidade(v, 'escrita') >= 74) novaOportunidade(v, { tipo: 'convite', ocupacaoId: 'escritor', meses: 24, chave: 'livro', titulo: 'Um livro', texto: 'Uma editora pequena leu o conto e quer publicar um livro seu. Paga pouco. Mas é um livro.' });
  }
}

export function criarProjeto(v: Vida, r: Rng, d: Dominio, pessoaId?: string): ProjetoArtistico {
  const membros: string[] = [];
  if (pessoaId && v.pessoas[pessoaId]?.vivo) membros.push(pessoaId);
  else {
    const i = idade(v);
    const novo = criarPessoa(v, r, { genero: r.chance(0.5) ? 'masculino' : 'feminino', idade: Math.max(13, i + r.int(-3, 4)), municipioId: v.moradia.municipioId });
    vincular(v, novo, { origem: 'rotina', estagio: 'colega', proximidade: 38, convivio: ['rotina'] });
    membros.push(novo.id);
  }
  const p: ProjetoArtistico = { linguagem: d, nome: nomeDoProjeto(v, d), tipo: d === 'musica' ? 'banda' : d === 'teatro' ? 'grupo' : 'companhia', tInicio: v.t, publico: 5, membros, ativo: true };
  v.caminhos.arte = p;
  const rot = v.rotinas.find(x => x.id === d);
  if (rot) rot.nivel = 3;
  for (const id of membros) lembrarCom(v, id, `${d === 'musica' ? 'Montaram a banda' : 'Entraram juntos no grupo'} ${p.nome}.`, 'amizade', 2);
  const texto = d === 'musica' ? `Entrou para uma banda: ${p.nome}.` : `Entrou para ${d === 'teatro' ? 'o grupo de teatro' : 'o grupo de dança'} ${p.nome}.`;
  escrever(v, { texto, relevancia: 'marco', tema: 'lazer', tom: 'bom', escolha: true, pessoas: membros });
  marcar(v, 'ingresso', texto, 2, { dominio: d });
  return p;
}

function anoDoProjeto(v: Vida, r: Rng, p: ProjetoArtistico): void {
  const i = idade(v);
  const h = habilidade(v, p.linguagem);
  const ensaiando = v.rotinas.find(x => x.id === p.linguagem);
  const anos = (v.t - p.tInicio) / 12;
  const cena = forcaDoSetor(v.moradia.municipioId, 'criativo', anoDe(v.t));
  const n = ensaiando?.nivel ?? 0;
  // Público cresce devagar e cansa de quem para.
  const delta = n === 0 ? -8 : (h - 50) / 10 + (n >= 3 ? 2 : 0) + (cena - 1) * 6 + v.personalidade.tracos.sociabilidade / 50 + r.normal() * 4 - p.publico / 14;
  p.publico = Math.round(clamp(p.publico + delta, 0, 100));
  // Marcos de quem insiste.
  if (p.publico >= 20 && !temFato(v, `show_pago_${p.nome}`) && r.chance(0.5)) {
    marcarFato(v, `show_pago_${p.nome}`);
    const texto = p.linguagem === 'musica' ? `${p.nome} fez o primeiro show pago. Deu para a gasolina e uma pizza.` : `${p.nome} fez a primeira temporada com ingresso cobrado.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
    marcar(v, 'conquista', texto, 2, { dominio: p.linguagem });
  }
  if (p.linguagem === 'musica' && p.publico >= 40 && !temFato(v, `gravou_${p.nome}`) && r.chance(0.35)) {
    marcarFato(v, `gravou_${p.nome}`);
    const texto = `${p.nome} gravou as primeiras músicas. Alguém de outra cidade comentou que ouvia no carro.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
    marcar(v, 'conquista', texto, 2, { dominio: 'musica' });
  }
  // Um convite para viver disso: raro, e só para quem construiu.
  const oc = p.linguagem === 'musica' ? 'musico_profissional' : p.linguagem === 'teatro' ? (p.publico >= 80 && h >= 75 && cena > 1.2 ? 'ator_reconhecido' : 'ator') : 'bailarino';
  const minimoH = p.linguagem === 'musica' ? 78 : p.linguagem === 'teatro' ? 68 : 78;
  if (h >= minimoH && p.publico >= (p.linguagem === 'teatro' ? 58 : 72) && v.trabalho.atual?.ocupacaoId !== oc && !(p.linguagem === 'danca' && i > 27)
    && (v.caminhos.ultimas['convite_arte'] === undefined || v.t - v.caminhos.ultimas['convite_arte'] >= 36) && r.chance(clamp((p.publico - 66) / 300 + (h - minimoH) / 350, 0.01, 0.045))) {
    novaOportunidade(v, {
      tipo: 'convite', ocupacaoId: oc, dominio: p.linguagem, meses: 12, chave: 'convite_arte',
      titulo: p.linguagem === 'musica' ? 'Um convite para viver de música' : p.linguagem === 'teatro' ? 'Um papel' : 'Uma audição',
      texto: p.linguagem === 'musica' ? `Um produtor viu ${p.nome} e propôs agenda cheia de shows: dá para largar o resto e viver disso — com o risco de sempre.` : p.linguagem === 'teatro' ? (oc === 'ator_reconhecido' ? 'Um diretor de elenco viu a peça e chamou para um teste de novela.' : 'Uma companhia profissional chamou para a próxima montagem, com cachê.') : 'Uma companhia profissional abriu audição e o seu nome foi indicado.'
    });
  }
  // O grupo acaba: gente cresce, muda, cansa.
  const vivos = p.membros.filter(id => v.pessoas[id]?.vivo);
  const longe = vivos.filter(id => v.pessoas[id].municipioId !== v.moradia.municipioId).length;
  const fim = n === 0 ? 0.6 : clamp(0.08 + anos * 0.02 + longe * 0.2 + (i >= 28 ? 0.05 : 0) + (p.publico < 10 && anos >= 3 ? 0.2 : 0) - p.publico / 300, 0.04, 0.8);
  if (r.chance(fim)) {
    p.ativo = false;
    p.tFim = v.t;
    const motivo = longe ? 'gente foi morar longe' : n === 0 ? 'você parou de ensaiar' : p.publico < 15 ? 'o público não veio' : 'a vida de cada um puxou para um lado';
    const texto = `${p.nome} acabou depois de ${Math.max(1, Math.round(anos))} ${Math.round(anos) === 1 ? 'ano' : 'anos'}: ${motivo}.`;
    escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'ruim', pessoas: vivos });
    marcar(v, 'abandono', texto, 2, { dominio: p.linguagem });
    for (const id of vivos) lembrarCom(v, id, `O fim de ${p.nome}.`, 'antigo', 1);
    if (ensaiando && ensaiando.nivel === 3) ensaiando.nivel = 2;
  }
  void vinculosVivos; void flex; void ge;
}

/* ------------------------------------------------------------ A obra */

const TITULOS: Partial<Record<Dominio, string[]>> = {
  musica: ['Ruas de Dentro', 'Canções para Depois', 'Maré', 'O Que Sobrou do Verão', 'Quintal', 'Barulho Bom', 'Linha de Ônibus'],
  teatro: ['A Casa Vazia', 'Três Cadeiras', 'O Último Ensaio', 'Janela para a Rua'],
  danca: ['Chão', 'Corpo Aberto', 'Passo em Falso', 'Travessia'],
  desenho: ['Cadernos', 'Retratos da Rua', 'Linhas'], escrita: ['O Ano da Chuva', 'Contos de Esquina', 'A Filha do Porteiro'],
  fotografia: ['Periferia em Preto e Branco', 'Gente da Feira', 'Luz de Fim de Tarde']
};
const ARTES: Dominio[] = ['musica', 'teatro', 'danca', 'desenho', 'escrita', 'fotografia'];

/** A linguagem da carreira: a do projeto, a do trabalho, ou a arte mais praticada. */
export function linguagemDaCarreira(v: Vida): Dominio {
  if (v.caminhos.arte?.ativo) return v.caminhos.arte.linguagem;
  const trilha = v.trabalho.atual?.ocupacaoId ?? '';
  const pelo = ARTES.find(d => trilha.includes(d === 'musica' ? 'music' : d === 'fotografia' ? 'fotog' : d));
  return pelo ?? [...ARTES].sort((a, b) => habilidade(v, b) - habilidade(v, a))[0];
}

/**
 * Lançar um trabalho: a obra sai para o mundo e é RECEBIDA (ou não). A
 * recepção nasce da habilidade construída, do público que já existe, da
 * sensibilidade de nascença (pouco) e do acaso; e tem consumidores: público,
 * renda, clientela, notoriedade, convites, a Linha da Vida quando marca.
 */
export function lancarObra(v: Vida, r: Rng): Obra {
  const d = linguagemDaCarreira(v);
  const p = v.caminhos.arte;
  const publico = p?.ativo ? p.publico : v.trabalho.atual?.clientela ?? 15;
  const q = habilidade(v, d) / 100 * 0.62 + publico / 100 * 0.25 + (v.predisposicoes?.artistica ?? 0) * 0.08 + r.normal() * 0.13;
  const recepcao: Obra['recepcao'] = q >= 0.66 ? 3 : q >= 0.52 ? 2 : q >= 0.38 ? 1 : 0;
  const lista = TITULOS[d] ?? TITULOS.musica!;
  const titulo = lista[((v.caminhos.obras?.length ?? 0) + Math.floor(v.t / 12)) % lista.length];
  const renda = Math.round([0, 1500, 6000, 22000][recepcao] * Math.max(0.4, publico / 50) / 100) * 100;
  const o: Obra = { t: v.t, titulo, linguagem: d, recepcao, renda };
  (v.caminhos.obras ??= []).push(o);
  if (v.caminhos.obras.length > 20) v.caminhos.obras.splice(0, v.caminhos.obras.length - 20);
  v.financas.conta += renda;
  if (p?.ativo) p.publico = clamp(p.publico + [2, 6, 12, 20][recepcao]);
  const e = v.trabalho.atual;
  if (e?.clientela !== undefined) e.clientela = clamp(e.clientela + [1, 4, 8, 14][recepcao]);
  const quem = p?.ativo ? ` com ${p.nome}` : '';
  const oque = d === 'musica' ? `o disco "${titulo}"` : d === 'teatro' ? `a peça "${titulo}"` : d === 'danca' ? `o espetáculo "${titulo}"` : d === 'escrita' ? `o livro "${titulo}"` : `"${titulo}"`;
  const texto = recepcao === 3 ? `Lançou ${oque}${quem} — e ele marcou: crítica, público, gente cantando junto em cidade onde você nunca tinha ido.`
    : recepcao === 2 ? `Lançou ${oque}${quem}. Repercutiu: saiu na imprensa da região, apareceu convite de fora.`
      : recepcao === 1 ? `Lançou ${oque}${quem}. Achou o seu público, pequeno e fiel.`
        : `Lançou ${oque}${quem}. Quem conhecia gostou; o resto nem ficou sabendo.`;
  escrever(v, { texto, relevancia: recepcao >= 3 ? 'marco' : recepcao >= 1 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: recepcao >= 2 ? 'bom' : undefined, escolha: true });
  if (recepcao >= 2) marcar(v, 'conquista', texto, recepcao >= 3 ? 3 : 2, { dominio: d });
  // Quem repercute é chamado: um festival, um edital, uma casa maior (a porta abre; entrar é escolha).
  if (recepcao >= 2 && (v.caminhos.ultimas['arte_convite'] === undefined || v.t - v.caminhos.ultimas['arte_convite'] >= 24)) {
    novaOportunidade(v, { tipo: 'edital_cultura', dominio: d, meses: 12, chave: 'arte_convite', titulo: 'Um convite', texto: `Depois de ${oque}, um festival da capital chamou para uma apresentação — cachê e público novo.` });
  }
  return o;
}
