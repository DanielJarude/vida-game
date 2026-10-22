/**
 * REWORK 5 — O MUNDO VIVO. "A vida acontece; às vezes você decide."
 *
 * O playtest sentiu um mundo que espera o clique. Muita vida de NPC já existia (amigos que mudam de cidade, irmãos que
 * casam, filhos com carreira, pais que adoecem, chamados), mas espalhada e, em boa parte, MUDA: o amigo "casava" sem que
 * ninguém soubesse. Este módulo faz duas coisas:
 *
 * 1. Acrescenta o que faltava acontecer SOZINHO, sempre com estado que fica (nunca só texto):
 *      colegas são promovidos e saem; a chefia é trocada (o clima recomeça — e o clima decide promoção e demissão);
 *      a empresa se reorganiza; amigos têm filhos, abrem negócios, se casam (agora contado), terminam;
 *      um parente adulto muda de cidade (e a convivência muda); o pai ou a mãe que ficou só refaz a vida;
 *      um professor nota o talento (o interesse sobe e a porta aparece); o filho descobre um interesse (fica na
 *      trajetória dele); quem tem um talento amador recebe um convite (tocar num casamento, o campeonato do bairro);
 *      a cidade muda (a economia que entra e sai da crise vira notícia).
 *    Simulação PROPORCIONAL à relevância: só os vínculos que importam (família, amigos, colegas, ex) são lidos; o resto
 *    do mundo segue a evolução simplificada de sempre (`social.envelhecerConhecidos`).
 *
 * 2. Dá a tudo o que aconteceu sem o jogador o mesmo lugar: a Linha da Vida (uma fonte só). `noticiasDoAno` lê o ano
 *    que passou — o que os outros viveram, o que mudou à volta — para o "Enquanto isso" da tela. Nada de modal: notícia é
 *    notícia; oportunidade vai para as portas abertas; crise já tem os seus chamados.
 *
 * Frequência: um ano comum produz 0 a 3 notícias; anos tranquilos existem. Sorteios derivados (`rngDe`): nada aqui mexe
 * no acaso do resto da vida.
 */

import { procuraComoSeNada } from './magoas';
import { clamp, rngDe, type Rng } from '../rng';
import type { Dominio, Entrada, Pessoa, Vida, Vinculo } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { criarPessoa, vincular } from '../pessoas';
import { papelDe } from './vinculos';
import { cidadesDoPais, municipio, paisDaCidade } from '../dados/lugares';
import { FRENTES } from '../dados/frentes';
import { garantirVida } from './filhos';
import { novaOportunidade } from './oportunidades';
import { chefiaAtual, temChefia } from './profissao';
import { emRecessao } from '../nucleo';
import { economiaLocal } from '../dados/lugares';
import { dinheiro } from '../texto';
import { ocupacao } from '../dados/ocupacoes';
import { liquido, salarioLocal } from './renda';

/** O que marca, na Linha da Vida, que foi o mundo (e não o jogador) quem fez acontecer. */
const MUNDO = 'mundo';
type Categoria = 'pessoas' | 'familia' | 'trabalho' | 'cidade' | 'portas';

function noticia(v: Vida, categoria: Categoria, texto: string, o: { pessoas?: string[]; relevancia?: Entrada['relevancia']; tema?: Entrada['tema']; tom?: Entrada['tom']; economia?: 'crise' | 'recuperacao' } = {}): void {
  escrever(v, { texto, relevancia: o.relevancia ?? 'cotidiano', tema: o.tema ?? (categoria === 'trabalho' ? 'trabalho' : categoria === 'familia' ? 'familia' : categoria === 'cidade' ? 'lugar' : 'amizade'), tom: o.tom, pessoas: o.pessoas, fato: { tipo: MUNDO, dados: { categoria, ...(o.economia ? { economia: o.economia } : {}) } } });
}

const nomeDominio = (d: Dominio) => FRENTES.find(f => f.id === d)?.nome ?? d;
const flexo = (p: Pessoa, m: string, f: string) => (p.genero === 'feminino' ? f : m);

/** Cada pessoa tem, no máximo, um acontecimento autônomo por ano (a vida dela não é uma novela). */
function livre(v: Vida, p: Pessoa): boolean {
  return v.fatos[`mv_${p.id}`] === undefined || v.t - v.fatos[`mv_${p.id}`] >= 12;
}
const usar = (v: Vida, p: Pessoa) => { v.fatos[`mv_${p.id}`] = v.t; };

/* =================================================================== O ano */

export function processarMundoVivo(v: Vida): void {
  const i = idade(v);
  if (i < 4) return;
  const r = rngDe(v.id, 'mundo_vivo', v.t);
  const cota = { n: 0, max: i < 12 ? 1 : 3 };
  const pode = () => cota.n < cota.max;
  const conta = () => { cota.n++; };
  anoDaCidade(v);
  if (!v.justica?.prisao) anoNoTrabalho(v, r, pode, conta);
  // Proporcional à relevância: só quem importa (família, romance passado, amigos, colegas próximos) é lido a cada ano.
  const gente = vinculosVivos(v).filter(x => !x.p.especie && x.p.vivo && (x.vin.proximidade >= 30 || !!x.vin.parentesco || x.vin.romance?.estagio === 'ex'));
  // Os mais próximos primeiro: a vida de quem importa acontece mais à vista.
  gente.sort((a, b) => b.vin.proximidade - a.vin.proximidade);
  for (const { p, vin } of gente) {
    if (!pode()) break;
    if (!livre(v, p)) continue;
    const rr = rngDe(v.id, 'mundo_pessoa', p.id, v.t);
    if (acontecerCom(v, rr, p, vin)) { usar(v, p); conta(); }
  }
  if (pode()) convitesDoTalento(v, r, conta);
  limparMarcas(v);
}

/**
 * Memória compacta: as marcas de "uma vez por ano" (`mv_<pessoa>`) somem depois de três anos; as que lembram o que já
 * foi contado (o casamento do amigo, o professor que notou, a crise em curso) ficam — senão a notícia voltaria.
 */
function limparMarcas(v: Vida): void {
  for (const k of Object.keys(v.fatos)) if (k.startsWith('mv_') && !k.startsWith('mv_casou_') && !k.startsWith('mv_prof_') && k !== 'mv_crise' && v.t - v.fatos[k] > 36) delete v.fatos[k];
}

/* ------------------------------------------------------------- A cidade */

function anoDaCidade(v: Vida): void {
  const crise = emRecessao(v);
  const antes = v.fatos['mv_crise'] !== undefined;
  if (crise && !antes) {
    v.fatos['mv_crise'] = v.t;
    noticia(v, 'cidade', `A economia entrou em crise em ${municipio(v.moradia.municipioId).nome}: lojas fechando na avenida, gente conhecida procurando emprego.`, { tom: 'ruim', relevancia: 'biografia', tema: 'dinheiro', economia: 'crise' });
  } else if (!crise && antes) {
    delete v.fatos['mv_crise'];
    noticia(v, 'cidade', 'A crise foi passando: as vagas voltaram aos poucos, os preços pararam de subir toda semana.', { tom: 'bom', tema: 'dinheiro', economia: 'recuperacao' });
  }
}

/* ------------------------------------------------------------ O trabalho */

/** Colegas sobem e saem; a chefia muda; a empresa se reorganiza. O clima (`Emprego.clima`) é o que fica. */
function anoNoTrabalho(v: Vida, r: Rng, pode: () => boolean, conta: () => void): void {
  const e = v.trabalho.atual;
  if (!e || e.contrato === 'informal' || v.t - e.tInicio < 12) return;
  const chave = `trabalho:${e.empregador}:${e.tInicio}`;
  const colegas = vinculosVivos(v).filter(x => x.vin.ambiente === chave && !x.p.especie && x.p.ocupacao !== 'gestor' && x.p.ocupacao !== 'gestora');
  // A chefia trocada: quem chefia sai; quem chega não conhece você — o clima recomeça perto do meio.
  if (pode() && temChefia(v) && r.chance(0.08)) {
    const antigo = chefiaAtual(v);
    if (antigo) { v.vinculos[antigo.id].ambiente = undefined; antigo.ocupacao = flexo(antigo, 'gestor em outra empresa', 'gestora em outra empresa'); }
    const novo = criarPessoa(v, r, { idade: r.int(32, 56), municipioId: v.moradia.municipioId, ocupacao: '' });
    novo.ocupacao = flexo(novo, 'gestor', 'gestora');
    // REWORK 9.7 · NPC-02: quem chefia ganha o que um gestor ganha (antes, renda 0 para sempre).
    novo.renda = liquido(salarioLocal(ocupacao('coordenador_adm'), novo.municipioId), 'clt', paisDaCidade(novo.municipioId));
    const vin = vincular(v, novo, { origem: 'trabalho', proximidade: 22, confianca: 25, estagio: 'colega', convivio: ['trabalho'] });
    vin.ambiente = chave;
    const exigente = novo.temperamento.afabilidade < 0;
    const antes = e.clima ?? 50;
    e.clima = Math.round(clamp(50 + (antes - 50) * 0.3 + (exigente ? -8 : 6)));
    noticia(v, 'trabalho', `${antigo ? `${antigo.nome} saiu da chefia` : 'A chefia mudou'}. Quem chegou foi ${novo.nome} — ${exigente ? 'cobrança dura, reunião toda segunda; o que você tinha construído com a chefia anterior não vale mais' : 'jeito tranquilo, quer conhecer a equipe um por um'}.`, { pessoas: [novo.id], relevancia: 'biografia', tom: exigente ? 'ruim' : 'neutro' });
    conta();
    return;
  }
  // A reorganização: o setor muda, o clima pesa um ano.
  if (pode() && r.chance(0.04)) {
    e.clima = Math.round(clamp((e.clima ?? 50) - 10));
    v.mente.estresse = clamp(v.mente.estresse + 4);
    noticia(v, 'trabalho', `${e.empregador.replace(/^./, c => c.toUpperCase())} anunciou uma reorganização: setores juntados, metas novas, gente demitida em outros andares. Ninguém dormiu bem naquela semana.`, { tom: 'ruim', relevancia: 'biografia' });
    conta();
    return;
  }
  // Um colega promovido (ou que sai para outra empresa): a régua da equipe muda.
  const c = colegas.length ? colegas[Math.floor(r.next() * colegas.length)] : undefined;
  if (c && pode() && livre(v, c.p) && r.chance(0.18)) {
    const sai = r.chance(0.4);
    usar(v, c.p); conta();
    if (sai) {
      c.vin.ambiente = undefined;
      c.vin.convivio = c.vin.convivio.filter(x => x !== 'trabalho');
      garantirVida(c.p).trajetoria.push({ t: v.t, texto: 'Saiu para outra empresa.', tipo: 'trabalho' });
      noticia(v, 'trabalho', `${c.p.nome} pediu as contas: foi para outra empresa${c.vin.proximidade >= 45 ? '. A despedida foi no bar da esquina, e prometeram não sumir' : ''}.`, { pessoas: [c.p.id] });
      if (c.vin.proximidade >= 45) lembrarCom(v, c.p.id, 'Trabalharam juntos até a saída para outra empresa.', 'trabalho', 1);
    } else {
      c.p.renda = Math.round(c.p.renda * 1.18);
      garantirVida(c.p).trajetoria.push({ t: v.t, texto: 'Foi promovido.'.replace('promovido', flexo(c.p, 'promovido', 'promovida')), tipo: 'promocao' });
      // A régua: quem trabalha bem e vê o outro subir sente — e quem é amigo, comemora.
      if (c.vin.proximidade >= 50) { c.vin.proximidade = clamp(c.vin.proximidade + 3); lembrarCom(v, c.p.id, `Comemoraram a promoção de ${c.p.nome}.`, 'trabalho', 1); }
      else if (e.desempenho >= 65) v.mente.estresse = clamp(v.mente.estresse + 2);
      noticia(v, 'trabalho', `${c.p.nome} foi ${flexo(c.p, 'promovido', 'promovida')}. ${c.vin.proximidade >= 50 ? 'Você foi ' + 'dos primeiros a dar os parabéns.' : e.desempenho >= 65 ? 'Você ficou pensando no que falta para a sua vez.' : 'A equipe ganhou outra chefia intermediária.'}`, { pessoas: [c.p.id] });
    }
  }
}

/* ------------------------------------------------------------- As pessoas */

/** Um acontecimento autônomo possível para esta pessoa, pela vida dela. Devolve se aconteceu. */
function acontecerCom(v: Vida, r: Rng, p: Pessoa, vin: Vinculo): boolean {
  const papel = papelDe(p, vin);
  const ip = idadePessoa(v, p);
  const perto = vin.proximidade >= 30;
  const amigo = papel === 'amigo' || papel === 'amigo_proximo';
  // Um amigo próximo se casa (antes, em silêncio: `social` só trocava o campo).
  if (amigo && p.parceiroId === 'fora' && v.fatos[`mv_casou_${p.id}`] === undefined && ip >= 22) {
    v.fatos[`mv_casou_${p.id}`] = v.t;
    noticia(v, 'pessoas', `${p.nome} se casou${vin.proximidade >= 60 ? ', e você estava na festa' : ''}.`, { pessoas: [p.id], relevancia: vin.estagio === 'amigo_proximo' ? 'biografia' : 'cotidiano', tema: 'amizade', tom: 'bom' });
    return true;
  }
  // Amigos têm filhos: a amizade muda de horário (e às vezes ganha um afilhado).
  if (amigo && perto && ip >= 24 && ip <= 42 && p.parceiroId && (p.nFilhos ?? 0) < 3 && r.chance(0.07)) {
    p.nFilhos = (p.nFilhos ?? 0) + 1;
    garantirVida(p).trajetoria.push({ t: v.t, texto: (p.nFilhos === 1 ? 'Teve o primeiro filho.' : 'Teve mais um filho.'), tipo: 'filho' });
    const padrinho = vin.proximidade >= 70 && p.nFilhos === 1 && r.chance(0.35);
    if (padrinho) { lembrarCom(v, p.id, `Apadrinhou o primeiro filho de ${p.nome}.`, 'ritual', 3); vin.proximidade = clamp(vin.proximidade + 6); }
    else vin.proximidade = clamp(vin.proximidade - 2);
    noticia(v, 'pessoas', `${p.nome} teve ${p.nFilhos === 1 ? 'o primeiro filho' : 'mais um filho'}.${padrinho ? ' E pediu que você fosse da família: apadrinhar.' : ' As conversas agora são no horário da soneca.'}`, { pessoas: [p.id], relevancia: padrinho ? 'biografia' : 'cotidiano', tom: 'bom' });
    return true;
  }
  // Um amigo abre um negócio (a vida dele muda de rumo — e a sua cidade ganha um endereço).
  // REWORK 9.7 · NPC-02: só quem trabalha "larga o emprego" para abrir um negócio — e o negócio vira o cargo e a renda
  // dele (antes, só o rótulo mudava: "dono de uma empresa de software" com o cargo de manicure e renda zero).
  if (amigo && ip >= 26 && ip <= 60 && p.renda > 0 && !p.ocupacao?.startsWith('dono') && !p.ocupacao?.startsWith('aposentad') && p.ocupacao !== 'estudante' && r.chance(0.025)) {
    const ramo = r.pick(['uma lanchonete', 'uma oficina', 'um salão', 'uma loja de roupas', 'uma padaria', 'um estúdio de tatuagem', 'uma pequena empresa de software', 'uma academia de bairro']);
    p.ocupacao = flexo(p, `dono de ${ramo}`, `dona de ${ramo}`);
    p.ocupacaoId = 'dono_comercio';
    p.renda = liquido(salarioLocal(ocupacao('dono_comercio'), p.municipioId, 0.7 + r.next() * 0.6), 'autonomo', paisDaCidade(p.municipioId));
    garantirVida(p).trajetoria.push({ t: v.t, texto: `Abriu ${ramo}.`, tipo: 'trabalho' });
    noticia(v, 'pessoas', `${p.nome} largou o emprego e abriu ${ramo}${p.municipioId === v.moradia.municipioId ? ' — você foi à inauguração' : ''}.`, { pessoas: [p.id] });
    if (p.municipioId === v.moradia.municipioId && perto) lembrarCom(v, p.id, `A inauguração de ${ramo.replace(/^uma? /, 'a ')} de ${p.nome}.`, 'ritual', 1);
    return true;
  }
  // Um parente adulto (irmão, primo, tio) muda de cidade: a convivência muda — e a visita vira viagem.
  if ((papel === 'irmao' || papel === 'parente') && ip >= 22 && ip <= 60 && p.municipioId === v.moradia.municipioId && !vin.convivio.includes('casa') && r.chance(0.02)) {
    const destinos = cidadesDoPais(paisDaCidade(p.municipioId)).filter(m => m.id !== p.municipioId && (m.perfil === 'metropole' || m.perfil === 'capital'));
    if (!destinos.length) return false;
    const d = destinos[Math.floor(r.next() * destinos.length)];
    p.municipioId = d.id;
    garantirVida(p).trajetoria.push({ t: v.t, texto: `Mudou-se para ${d.nome}.`, tipo: 'lugar' });
    noticia(v, 'familia', `${p.nome} se mudou para ${d.nome}${vin.proximidade >= 55 ? '. O almoço de domingo ficou com uma cadeira vazia' : ''}.`, { pessoas: [p.id], relevancia: vin.proximidade >= 55 ? 'biografia' : 'cotidiano' });
    return true;
  }
  // O pai ou a mãe que ficou só refaz a vida (e a família reage).
  if (papel === 'genitor' && ip >= 45 && ip <= 78 && !p.parceiroId && r.chance(0.04)) {
    p.parceiroId = 'fora';
    garantirVida(p).trajetoria.push({ t: v.t, texto: 'Começou um novo relacionamento.', tipo: 'amor' });
    const bem = vin.tensao < 35;
    noticia(v, 'familia', `${p.nome} apresentou alguém: está namorando de novo, aos ${ip}. ${bem ? 'Você gostou de ver a pessoa rindo à toa.' : 'Você ainda não sabe o que achar.'}`, { pessoas: [p.id], relevancia: 'biografia', tom: bem ? 'bom' : 'neutro' });
    return true;
  }
  // O filho descobre um interesse — fica na trajetória dele (e a ficha mostra).
  if ((papel === 'filho' || papel === 'neto') && ip >= 6 && ip <= 16 && r.chance(0.12)) {
    const ja = new Set((p.vida?.trajetoria ?? []).filter(x => x.texto.startsWith('Começou a gostar de')).map(x => x.texto));
    const op = r.pick(['futebol', 'música', 'desenho', 'dança', 'xadrez', 'programação', 'ler de tudo', 'natação', 'teatro', 'ciências', 'jogos de tabuleiro', 'skate']);
    const txt = `Começou a gostar de ${op}.`;
    if (ja.has(txt)) return false;
    garantirVida(p).trajetoria.push({ t: v.t, texto: txt, tipo: 'escola' });
    noticia(v, 'familia', `${p.nome} anda falando só de ${op}${ip <= 10 ? ' — pediu de aniversário tudo o que tem a ver com isso' : ''}.`, { pessoas: [p.id] });
    return true;
  }
  // Um ex segue a vida (às vezes é a notícia que dói).
  if (papel === 'ex' && ip >= 22 && !p.parceiroId && r.chance(0.05)) {
    p.parceiroId = 'fora';
    noticia(v, 'pessoas', `Soube por outras pessoas que ${p.nome} está com alguém. ${vin.proximidade >= 40 ? 'Doeu um pouco mais do que você esperava.' : 'Você desejou, sinceramente, que dê certo.'}`, { pessoas: [p.id] });
    if (vin.proximidade >= 40) v.mente.felicidade = clamp(v.mente.felicidade - 2);
    return true;
  }
  // Um amigo distante dá notícia sozinho (sem pedir nada): a amizade de longe também vive.
  // REWORK 10.5 · REL-07: quem está brigado, magoado, rompido ou bloqueado não manda "lembrei de você" do nada.
  if (amigo && p.municipioId !== v.moradia.municipioId && vin.proximidade >= 40 && v.t - vin.tUltimoContato >= 24 && procuraComoSeNada(v, vin) && r.chance(0.12)) {
    vin.tUltimoContato = v.t;
    vin.proximidade = clamp(vin.proximidade + 3);
    noticia(v, 'pessoas', `${p.nome} mandou mensagem do nada, de ${municipio(p.municipioId).nome}: uma foto antiga de vocês, e "lembrei de você". Conversaram até tarde.`, { pessoas: [p.id], tom: 'bom' });
    return true;
  }
  return false;
}

/* --------------------------------------------------- As portas do talento */

/**
 * Quem tem um talento de verdade — mesmo sem carreira — é notado: o professor que vê, a banda que precisa de alguém, o
 * campeonato do bairro. A porta é uma OPORTUNIDADE (aceitar ou deixar passar, com prazo) ou um convite com efeito.
 */
function convitesDoTalento(v: Vida, r: Rng, conta: () => void): void {
  const i = idade(v);
  const frentes = Object.entries(v.caminhos.frentes) as [Dominio, NonNullable<Vida['caminhos']['frentes'][Dominio]>][];
  const ativas = frentes.filter(([, f]) => v.t - f.tUltimo <= 12 && f.habilidade >= 55).sort((a, b) => b[1].habilidade - a[1].habilidade);
  const melhor = ativas[0];
  if (!melhor) return;
  const [d, f] = melhor;
  const cat = FRENTES.find(x => x.id === d)?.categoria;
  // Na escola: o professor nota (o interesse cresce, e às vezes a porta aparece: a olimpíada, o grupo, o festival).
  if (i >= 9 && i <= 17 && (v.educacao.basica || v.educacao.matricula) && v.fatos[`mv_prof_${d}`] === undefined && r.chance(0.18)) {
    v.fatos[`mv_prof_${d}`] = v.t;
    // O empurrão conta para quem ainda hesita; quem já vive disso ouve e segue igual.
    if (f.interesse < 65) f.interesse = clamp(f.interesse + 8);
    noticia(v, 'portas', `${cat === 'esporte' ? 'O professor de educação física' : cat === 'arte' ? 'A professora de artes' : 'Uma professora'} chamou você depois da aula: "você tem jeito para ${nomeDominio(d)}. Não para."`, { relevancia: 'biografia', tema: 'escola', tom: 'bom' });
    conta();
    return;
  }
  if (i < 16 || v.justica?.prisao || v.caminhos.esporte?.fase === 'profissional') return;
  // O amador com talento recebe um convite com cachê (a música, o teatro, a dança, a fotografia) ou um campeonato.
  const ultima = v.caminhos.ultimas['mv_convite'];
  if (ultima !== undefined && v.t - ultima < 24) return;
  if (cat === 'arte' && r.chance(0.22)) {
    v.caminhos.ultimas['mv_convite'] = v.t;
    // Talento grande e sem grupo: a banda (ou o grupo) que procura alguém — a porta do projeto coletivo (`arte_projeto`).
    if (f.habilidade >= 68 && i >= 17 && (d === 'musica' || d === 'teatro' || d === 'danca') && !v.caminhos.arte?.ativo) {
      novaOportunidade(v, { tipo: d === 'musica' ? 'banda' : 'grupo', dominio: d, meses: 12, chave: 'mv_projeto', titulo: d === 'musica' ? 'Uma banda procura alguém' : 'Um grupo procura alguém', texto: `${d === 'musica' ? 'Uma banda da cidade perdeu um integrante' : d === 'teatro' ? 'Um grupo de teatro da cidade precisa de elenco' : 'Uma companhia de dança da cidade abriu vaga'} — e alguém indicou você.` });
      noticia(v, 'portas', `Alguém indicou você para ${d === 'musica' ? 'uma banda da cidade' : 'um grupo da cidade'}. A conversa está marcada.`, { tema: 'lazer', tom: 'bom' });
      conta();
      return;
    }
    const [onde, base] = d === 'musica' ? ['tocar num casamento no sábado, porque o músico da banda furou', 600] as const : d === 'fotografia' ? ['fotografar a festa de quinze anos da filha de um conhecido', 500] as const : d === 'teatro' ? ['fazer uma participação numa peça do grupo da cidade', 300] as const : d === 'danca' ? ['dançar na abertura de um festival da cidade', 350] as const : d === 'desenho' ? ['desenhar o cardápio e a fachada de um bar novo', 450] as const : ['escrever o texto de apresentação de uma loja', 300] as const;
    const cache = Math.round(base * economiaLocal(v.moradia.municipioId).custo / 10) * 10;
    v.financas.conta += cache;
    f.interesse = clamp(f.interesse + 6);
    noticia(v, 'portas', `Chamaram você para ${onde}. Foi, fez bonito, e voltou com ${dinheiro(cache)} e dois contatos novos.`, { relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
    conta();
    return;
  }
  if (cat === 'esporte' && !v.caminhos.esporte && i <= 40 && r.chance(0.2)) {
    v.caminhos.ultimas['mv_convite'] = v.t;
    // O campeonato amador: o time chama, você joga — o corpo, o interesse e um colega novo ficam.
    v.corpo.forma = clamp(v.corpo.forma + 3);
    f.interesse = clamp(f.interesse + 6);
    const colega = criarPessoa(v, r, { idade: clamp(i + r.int(-4, 6), 16, 60), municipioId: v.moradia.municipioId, genero: v.eu.genero === 'feminino' ? 'feminino' : 'masculino' });
    vincular(v, colega, { origem: 'rotina', proximidade: 32, estagio: 'conhecido', convivio: ['rotina'] });
    lembrarCom(v, colega.id, `Jogaram juntos o campeonato amador de ${nomeDominio(d)}.`, 'amizade', 1);
    const foi = r.next();
    noticia(v, 'portas', `O time de ${nomeDominio(d)} da liga amadora chamou você para o campeonato da cidade. ${foi < 0.25 ? 'Chegaram à final — e a medalha está pendurada no quarto.' : foi < 0.6 ? 'Caíram nas quartas, depois de uma prorrogação que o bairro inteiro viu.' : 'Caíram cedo, mas o time continua se encontrando aos domingos.'} ${colega.nome} virou parceiro de jogo.`, { pessoas: [colega.id], relevancia: 'biografia', tema: 'lazer', tom: 'bom' });
    conta();
  }
}

/* ------------------------------------------------------------ "Enquanto isso" */

export interface Noticia { texto: string; categoria: Categoria | 'vida'; pessoas: string[]; tom?: Entrada['tom'] }

/**
 * O que aconteceu no ano SEM ser escolha do jogador — o mundo e as pessoas: a Linha da Vida lida de outro jeito (uma
 * fonte só). Inclui o que os outros sistemas já contavam (a mudança do amigo, o diagnóstico do pai, o neto que nasceu).
 */
const TEMAS_DOS_OUTROS = new Set<Entrada['tema']>(['amizade', 'familia', 'amor', 'perda', 'morte', 'filhos', 'trabalho', 'lugar']);

export function noticiasDoAno(v: Vida, desde: number): Noticia[] {
  const out: Noticia[] = [];
  for (const e of v.biografia.slice(desde)) {
    if (e.escolha || e.relevancia === 'tecnico') continue;
    const mundo = e.fato?.tipo === MUNDO;
    // O que os outros sistemas contam sobre os OUTROS (não a infância do jogador, que também cita a mãe).
    if (!mundo && (!e.pessoas?.length || !TEMAS_DOS_OUTROS.has(e.tema))) continue;
    const categoria = mundo ? (String(e.fato!.dados.categoria) as Categoria) : e.tema === 'familia' || e.tema === 'filhos' || e.tema === 'perda' || e.tema === 'morte' ? 'familia' : e.tema === 'trabalho' ? 'trabalho' : 'vida';
    out.push({ texto: e.texto, categoria, pessoas: e.pessoas ?? [], tom: e.tom });
  }
  return out.slice(-8);
}
