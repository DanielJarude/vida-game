/**
 * VIDA 12.6 — O QUE A VIDA DEVOLVE. Acontecimentos que só existem por causa do que já aconteceu (e de quem está vivo),
 * sorteados pelo fluxo derivado das fases (`motor.vidaPorFasesDoAno`): as vidas que não os vivem seguem iguais.
 *
 * - FAMÍLIA: a reunião grande (com gente de verdade: tios, primos, avós), os 80 anos de um dos pais, ensinar um neto o
 *   que você sabe fazer (o hobby de uma vida), a última conversa longa com um pai ou mãe muito velho.
 * - CONSEQUÊNCIAS: o favor devolvido (quem você ajudou, anos atrás, aparece quando você precisa — `jeito.gratidao`); a
 *   tatuagem com o nome de um amor que acabou; o reencontro com alguém importante depois de anos sem contato (a mágoa,
 *   se havia, vem junto); a promessa a um filho que não foi cumprida, cobrada anos depois.
 * - RAROS, por regra (não por sorte solta): conhecer um ídolo (só quem pratica música há anos, numa cidade grande); achar
 *   uma carta antiga de um pai ou mãe que morreu (anos depois da morte); socorrer alguém na rua (quem tem coragem).
 */
import type { Conteudo, Ctx } from './base';
import type { Pessoa, Vida } from '../tipos';
import { dinheiro, estresse, feliz, local, prox, tensao } from './efeitos';
import { clamp } from '../rng';
import { idade, idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { gratidao, feridaAberta, tem } from '../sistemas/jeito';
import { mesmaCidade } from '../sistemas/vinculos';
import { disponibilidadePedido, nomeDaTatuagem, ondeEsta, regiaoDe, tatuagensDeAmorPerdido, tatuarPedido, removerTatuagem, disponibilidadeRemover, precoDaRemocao } from '../sistemas/tatuagens';
import { podeTentar } from '../plausibilidade';
import { anoDe } from '../tempo';
import { nivelDeOferta } from '../dados/lugares';
import { flex } from '../texto';

const o = (p: Pessoa) => flex(p.genero, 'o', 'a', 'e');
const ele = (p: Pessoa) => flex(p.genero, 'ele', 'ela', 'elu');
const vivos = (v: Vida, ...ps: string[]) => vinculosVivos(v).filter(x => x.vin.parentesco && ps.includes(x.vin.parentesco)).map(x => x.p);
const hab = (v: Vida, d: string) => (v.caminhos.frentes as Record<string, { habilidade: number } | undefined>)[d]?.habilidade ?? 0;
const emApuro = (v: Vida) => (!v.trabalho.atual && idade(v) >= 20 && idade(v) < 65) || v.corpo.saude < 45 || v.financas.conta < 0;

/** Quem guarda gratidão de verdade por você (uma ajuda de anos atrás) e está vivo e por perto. */
const quemDeve = (v: Vida) => vinculosVivos(v).filter(x => !x.p.especie && x.vin.tensao < 40 && (() => { const g = gratidao(v, x.vin, x.p); return !!g && v.t - g.t >= 24; })()).map(x => x.p);
/** Alguém importante, sem contato há anos (a história pesou: peso 2+), vivo. */
const sumido = (v: Vida) => vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && v.t - x.vin.tUltimoContato >= 96 && (x.vin.historia ?? []).some(m => (m.peso ?? 1) >= 2) && idadePessoa(v, x.p) >= 18).map(x => x.p);
const melhorHobby = (v: Vida): { d: string; nome: string } | undefined => {
  const nomes: Record<string, string> = { musica: 'tocar', cozinha: 'cozinhar', manual: 'consertar as coisas', desenho: 'desenhar', fotografia: 'fotografar', xadrez: 'jogar xadrez', campo: 'cuidar das plantas', futebol: 'jogar bola', escrita: 'escrever', natacao: 'nadar' };
  const melhor = Object.keys(nomes).map(d => ({ d, h: hab(v, d) })).sort((a, b) => b.h - a.h)[0];
  return melhor && melhor.h >= 50 ? { d: melhor.d, nome: nomes[melhor.d] } : undefined;
};
const coberturas = ['rosa_tradicional', 'peonia', 'andorinha', 'corvo', 'sol_tribal', 'mandala', 'cerejeira', 'tribal_faixa'];

export const ACONTECIMENTOS_126: Conteudo[] = [
  /* ================================================================ família */
  {
    id: 'v126_reuniao_familia', manual: true, tipo: 'decisao', idade: [12, 85], tema: 'familia', peso: 1.5, repetir: 8,
    quando: c => vivos(c.v, 'tio', 'primo', 'avo').length >= 3,
    titulo: 'A família inteira',
    texto: c => `${vivos(c.v, 'avo').length ? 'Os avós fazem anos de casados' : 'Um tio resolveu juntar todo mundo'}: um fim de semana com ${vivos(c.v, 'tio', 'primo', 'avo').slice(0, 3).map(p => p.nome).join(', ')} e mais uma multidão de primos.`,
    opcoes: [
      { id: 'ir', texto: 'Ir, e ficar até o fim', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Churrasco, foto com todo mundo apertado, a história da família contada pela décima vez — e pela primeira vez você prestou atenção.', relevancia: 'biografia', tom: 'bom', efeito: () => { feliz(c, 4); for (const p of vivos(c.v, 'tio', 'primo', 'avo')) { const vin = c.v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + 4); vin.tUltimoContato = c.v.t; } } } }) },
      { id: 'passar', texto: 'Passar rapidinho', resolver: c => ({ texto: 'Apareceu, abraçou quem dava, comeu um pedaço de bolo e foi embora antes da foto.', memoria: null, efeito: () => { for (const p of vivos(c.v, 'avo')) { const vin = c.v.vinculos[p.id]; if (vin) vin.proximidade = clamp(vin.proximidade + 2); } } }) },
      { id: 'faltar', texto: 'Não ir', resolver: c => ({ texto: 'Não foi. Na segunda, a foto da família inteira apareceu no grupo — com um buraco onde você estaria.', memoria: null, efeito: () => { for (const p of vivos(c.v, 'avo')) { const vin = c.v.vinculos[p.id]; if (vin) vin.proximidade = clamp(vin.proximidade - 3); } } }) }
    ]
  },
  {
    id: 'v126_oitenta_anos', manual: true, tipo: 'decisao', idade: [35, 75], tema: 'familia', peso: 3,
    papeis: { pai: v => vivos(v, 'mae', 'pai').filter(p => { const i = idadePessoa(v, p); return i >= 79 && i <= 81; }) },
    titulo: c => `Os 80 anos de ${c.p.pai.nome}`,
    texto: c => `${c.p.pai.nome} faz 80 anos. ${ele(c.p.pai).replace(/^./, x => x.toUpperCase())} disse que não quer festa — mas comentou duas vezes que ninguém lembra mais de ninguém.`,
    opcoes: [
      { id: 'festa', texto: c => `Organizar uma festa surpresa (uns ${local(c, 1500)})`, disponivel: c => (c.v.financas.conta >= local(c, 1500) ? true : 'Agora não dá para bancar.'),
        resolver: c => ({ texto: `A família inteira, os amigos antigos, o bolo com as velas que ${c.p.pai.nome} não conseguiu apagar de uma vez. Chorou no parabéns.`, relevancia: 'marco', tom: 'bom', lembrar: ['pai', 'A festa surpresa dos 80 anos.', 'ritual'], efeito: () => { dinheiro(c, -local(c, 1500)); prox(c, 'pai', 8); feliz(c, 6); } }) },
      { id: 'almoco', texto: 'Um almoço só da família', resolver: c => ({ texto: `Almoço em casa, a comida preferida de ${c.p.pai.nome}, os netos em volta. Simples, do jeito que ${ele(c.p.pai)} gosta.`, relevancia: 'biografia', tom: 'bom', lembrar: ['pai', 'O almoço dos 80 anos.', 'ritual'], efeito: () => { prox(c, 'pai', 5); feliz(c, 3); } }) },
      { id: 'ligar', texto: 'Ligar e mandar um presente', resolver: c => ({ texto: `${c.p.pai.nome} agradeceu pelo telefone. A voz dizia outra coisa.`, memoria: null, efeito: () => { prox(c, 'pai', -2); } }) }
    ]
  },
  {
    id: 'v126_ensinar_neto', manual: true, tipo: 'acontecimento', idade: [55, 95], tema: 'familia', peso: 2, repetir: 10,
    papeis: { neto: v => vinculosVivos(v).filter(x => (x.vin.parentesco === 'neto') && idadePessoa(v, x.p) >= 7 && idadePessoa(v, x.p) <= 16 && mesmaCidade(v, x.p)).map(x => x.p) },
    quando: c => !!melhorHobby(c.v),
    narrar: c => {
      const h = melhorHobby(c.v)!;
      return { texto: `Ensinou ${c.p.neto.nome} a ${h.nome} — o que você levou a vida inteira para aprender, em tardes de sábado. ${c.p.neto.nome} já faz melhor do que você fazia na idade ${flex(c.p.neto.genero, 'dele', 'dela', 'delu')}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['neto', `Aprendeu com você a ${h.nome}.`, 'apoio'],
        efeito: () => { prox(c, 'neto', 8); feliz(c, 5); } };
    }
  },
  {
    id: 'v126_ultima_conversa', manual: true, tipo: 'decisao', idade: [40, 80], tema: 'familia', peso: 2,
    papeis: { pai: v => vivos(v, 'mae', 'pai').filter(p => idadePessoa(v, p) >= 86) },
    titulo: c => `${c.p.pai.nome} quer conversar`,
    texto: c => `${c.p.pai.nome}, com ${idadePessoa(c.v, c.p.pai)} anos, pediu para você ir lá num domingo — "com tempo". Tem coisas que ${ele(c.p.pai)} quer contar.`,
    opcoes: [
      { id: 'ir', texto: 'Ir, e ficar a tarde inteira',
        resolver: c => ({ texto: `Ouviu histórias que nunca tinha ouvido: o primeiro emprego, um amor antes da família, o medo que ${ele(c.p.pai)} sentiu quando você nasceu. Gravou tudo no celular.`, relevancia: 'marco', tom: 'bom', lembrar: ['pai', 'A tarde inteira de histórias, gravadas no celular.', 'ritual'], efeito: () => { prox(c, 'pai', 10); estresse(c, -4); } }) },
      { id: 'depois', texto: 'Marcar para outro dia', resolver: c => ({ texto: 'Marcou para o mês seguinte. O mês seguinte ficou para o outro.', memoria: null, efeito: () => { prox(c, 'pai', -3); } }) }
    ]
  },

  /* ================================================================ consequências */
  {
    id: 'v126_favor_devolvido', manual: true, tipo: 'acontecimento', idade: [20, 85], tema: 'amizade', peso: 4, repetir: 8,
    papeis: { quem: quemDeve },
    quando: c => emApuro(c.v),
    narrar: c => {
      const g = gratidao(c.v, c.v.vinculos[c.p.quem.id], c.p.quem)!;
      const semEmprego = !c.v.trabalho.atual;
      return { texto: `${c.p.quem.nome} soube da sua fase e apareceu sem ser chamad${o(c.p.quem)}: ${semEmprego ? 'passou o seu nome para duas vagas e pagou o almoço' : 'trouxe comida, resolveu o que dava e ficou para conversar'}. "Você esteve lá quando eu precisei" — ${g.texto ? `lembrando de ${anoDe(g.t)}` : 'e não precisou dizer mais nada'}.`, relevancia: 'biografia', tom: 'bom', lembrar: ['quem', 'Retribuiu a ajuda de anos atrás.', 'apoio'],
        efeito: () => { prox(c, 'quem', 6); estresse(c, -5); feliz(c, 4); if (semEmprego) c.v.fatos['indicacao_favor'] = c.v.t; } };
    }
  },
  {
    id: 'v126_tatuagem_do_ex', manual: true, tipo: 'decisao', idade: [18, 90], tema: 'amor', peso: 5,
    papeis: { ex: v => tatuagensDeAmorPerdido(v).map(t => v.pessoas[t.significado!.pessoaId!]).filter(Boolean) },
    quando: c => c.v.fatos[`tat_ex:${c.p.ex.id}`] === undefined,
    titulo: 'O nome na pele',
    texto: c => { const t = tatuagensDeAmorPerdido(c.v).find(x => x.significado?.pessoaId === c.p.ex.id)!; return `A ${nomeDaTatuagem(t).toLowerCase()} ${ondeEsta(regiaoDe(t), t.lado)} ainda é por ${c.p.ex.nome}. Acabou — e a tatuagem ficou.`; },
    opcoes: [
      { id: 'cobrir', texto: 'Cobrir com outro desenho', disponivel: c => (alvoECobertura(c) ? true : 'Nenhum estúdio consegue cobrir essa sem refazer o lugar.'),
        resolver: c => { const x = alvoECobertura(c)!; c.v.fatos[`tat_ex:${c.p.ex.id}`] = c.v.t; const texto = tatuarPedido(c.v, { desenho: x.desenho, regiao: regiaoDe(x.t), lado: x.t.lado, cobre: x.t.id, tamanho: x.tamanho }); return { texto: `${texto} ${c.p.ex.nome} virou só uma história.`, memoria: null, tom: 'bom', efeito: () => feliz(c, 3) }; } },
      { id: 'laser', texto: 'Tirar no laser', disponivel: c => { const t = alvo(c); return t && podeTentar(disponibilidadeRemover(c.v, t.id)) ? true : `O laser custa ${t ? precoDaRemocao(c.v, t) : '—'}.`; },
        resolver: c => { const t = alvo(c)!; c.v.fatos[`tat_ex:${c.p.ex.id}`] = c.v.t; return { texto: removerTatuagem(c.v, t.id), memoria: null }; } },
      { id: 'deixar', texto: 'Deixar: faz parte da história', comportamento: { coragem: 1 },
        resolver: c => ({ texto: `Ficou. Quem pergunta ouve a história inteira — e ela não dói mais como doía.`, memoria: `Decidiu manter a tatuagem feita por ${c.p.ex.nome}.`, relevancia: 'cotidiano', efeito: () => { c.v.fatos[`tat_ex:${c.p.ex.id}`] = c.v.t; } }) }
    ]
  },
  {
    id: 'v126_reencontro', manual: true, tipo: 'decisao', idade: [26, 85], tema: 'amizade', peso: 2.5, repetir: 6,
    papeis: { quem: sumido },
    titulo: c => `${c.p.quem.nome}, depois de tantos anos`,
    texto: c => {
      const ferida = feridaAberta(c.v, c.v.vinculos[c.p.quem.id], c.p.quem);
      const onde = idade(c.v) >= 60 ? 'num velório de um conhecido em comum' : idade(c.v) >= 40 ? 'na formatura do filho de um amigo' : 'na fila do supermercado';
      return `${onde.replace(/^./, x => x.toUpperCase())}, ${c.p.quem.nome}. ${Math.floor((c.v.t - c.v.vinculos[c.p.quem.id].tUltimoContato) / 12)} anos sem se falar.${ferida ? ` E ${ferida.tipo === 'traicao' ? 'aquela traição' : 'a briga de ' + anoDe(ferida.t)} no meio, sem resolver.` : ''}`;
    },
    opcoes: [
      { id: 'cafe', texto: 'Chamar para um café', comportamento: { sociabilidade: 1 },
        resolver: c => {
          const vin = c.v.vinculos[c.p.quem.id];
          const ferida = feridaAberta(c.v, vin, c.p.quem);
          vin.tUltimoContato = c.v.t;
          if (ferida && tem(c.p.quem, 'rancoroso')) return { texto: `O café foi educado. ${c.p.quem.nome} não esqueceu — e deixou claro, com um sorriso.`, memoria: null, efeito: () => tensao(c, 'quem', 3) };
          return { texto: `O café virou almoço, o almoço virou a tarde. ${ferida ? 'Falaram do que tinha ficado mal; ficou menos mal.' : 'Parecia que tinha sido semana passada.'}`, relevancia: 'biografia', tom: 'bom', lembrar: ['quem', 'O reencontro depois de anos.', ferida ? 'reconciliacao' : 'amizade'], efeito: () => { prox(c, 'quem', 14); if (vin.estagio === 'afastado' || vin.estagio === 'ex_amigo') vin.estagio = 'amigo'; } };
        } },
      { id: 'cumprimentar', texto: 'Só cumprimentar', resolver: c => ({ texto: `Um "quanto tempo!", um abraço rápido, a promessa de marcar algo. Ninguém marcou.`, memoria: null, efeito: () => { c.v.vinculos[c.p.quem.id].tUltimoContato = c.v.t; } }) }
    ]
  },
  {
    id: 'v126_promessa_cobrada', manual: true, tipo: 'acontecimento', idade: [30, 90], tema: 'filhos', peso: 3,
    papeis: { filho: v => vinculosVivos(v).filter(x => x.vin.parentesco === 'filho' && idadePessoa(v, x.p) >= 15 && (x.vin.historia ?? []).some(m => m.tipo === 'promessa_quebrada' && v.t - m.t >= 36)).map(x => x.p) },
    quando: c => c.v.fatos[`promessa_cobrada:${c.p.filho.id}`] === undefined,
    narrar: c => ({ texto: `Numa discussão qualquer, ${c.p.filho.nome} jogou na mesa: "você prometeu que ia estar mais presente". Anos depois, e ${ele(c.p.filho)} lembrava a data.`, relevancia: 'biografia', tom: 'ruim',
      efeito: () => { c.v.fatos[`promessa_cobrada:${c.p.filho.id}`] = c.v.t; tensao(c, 'filho', 8); estresse(c, 4); } })
  },

  /* ================================================================ raros (por regra) */
  {
    id: 'v126_raro_idolo', manual: true, tipo: 'acontecimento', idade: [16, 75], tema: 'lazer', peso: 0.4,
    quando: c => hab(c.v, 'musica') >= 55 && nivelDeOferta(c.v.moradia.municipioId) >= 3 && c.v.fatos['v126_idolo'] === undefined,
    narrar: c => ({ texto: 'Depois de um show pequeno, o músico que você ouve desde a adolescência estava no bar ao lado. Você foi falar — e ele pediu para ouvir você tocar. Disse que tinha "mão boa".', relevancia: 'biografia', tom: 'bom', efeito: () => { c.v.fatos['v126_idolo'] = c.v.t; feliz(c, 8); } })
  },
  {
    id: 'v126_raro_carta', manual: true, tipo: 'acontecimento', idade: [25, 90], tema: 'perda', peso: 0.6,
    papeis: { pai: v => Object.values(v.pessoas).filter(p => !p.vivo && p.tMorte !== undefined && v.t - p.tMorte >= 60 && ['mae', 'pai'].includes(v.vinculos[p.id]?.parentesco ?? '')) },
    quando: c => c.v.fatos[`v126_carta:${c.p.pai.id}`] === undefined,
    narrar: c => ({ texto: `Arrumando uma caixa antiga, achou uma carta de ${c.p.pai.nome}, escrita quando você era criança, para "abrir quando crescer". Leu três vezes.`, relevancia: 'biografia', tom: 'neutro', efeito: () => { c.v.fatos[`v126_carta:${c.p.pai.id}`] = c.v.t; lembrarCom(c.v, c.p.pai.id, 'A carta achada anos depois.', 'perda', 2); estresse(c, -3); } })
  },
  {
    id: 'v126_raro_socorro', manual: true, tipo: 'decisao', idade: [16, 75], tema: 'escolha', peso: 0.5, repetir: 20,
    quando: c => c.v.personalidade.tracos.coragem >= 10 || c.v.personalidade.tracos.empatia >= 25,
    titulo: 'Na calçada',
    texto: () => 'Uma pessoa caiu na calçada na sua frente e não se mexe. Os outros passam olhando o celular.',
    opcoes: [
      { id: 'socorrer', texto: 'Parar, chamar a ambulância e ficar junto', comportamento: { coragem: 1, empatia: 1 },
        resolver: c => ({ texto: 'Ficou até a ambulância chegar, segurando a mão de um desconhecido. Semanas depois, a família achou você para agradecer.', relevancia: 'biografia', tom: 'bom', efeito: () => feliz(c, 6) }) },
      { id: 'seguir', texto: 'Seguir: alguém vai parar', resolver: () => ({ texto: 'Seguiu. Olhou para trás no fim da quadra: ninguém tinha parado ainda.', memoria: null }) }
    ]
  }
];

function alvo(c: Ctx) { return tatuagensDeAmorPerdido(c.v).find(x => x.significado?.pessoaId === c.p.ex.id); }
/** A tatuagem do ex e o primeiro desenho que a cobre de verdade (maior, escuro, no mesmo lugar). */
function alvoECobertura(c: Ctx) {
  const t = alvo(c);
  if (!t) return undefined;
  for (const desenho of coberturas) for (const tamanho of [1, 2, 3] as const) {
    const d = { desenho, regiao: regiaoDe(t), lado: t.lado, cobre: t.id, tamanho };
    if (podeTentar(disponibilidadePedido(c.v, d))) return { t, desenho, tamanho };
  }
  return undefined;
}
