/**
 * VIDA 14 · CRENÇAS — as decisões e cenas da fé (`c14_*`). Todas `manual`: só o pass anual próprio as sorteia
 * (`crencas.vidaDeCrencas14`, gerador derivado), e as vidas que não as vivem seguem iguais.
 *
 * As escolhas não carregam `comportamento` (não dizem nada do caráter de quem crê ou deixa de crer): mudar de crença, ficar,
 * voltar ou combinar a criação dos filhos são escolhas de vida, não traços. Nenhum texto supõe o que alguém é pela fé.
 */
import type { Conteudo, Ctx } from '../../conteudo/base';
import type { Pessoa } from '../../tipos';
import { custa, dinheiro, estresse, feliz, local, prox } from '../../conteudo/efeitos';
import * as P from '../../conteudo/papeis';
import { dinheiro as fmt } from '../../texto';
import { CELEBRACOES14, CRENCAS14, crencaDaPessoa, crencaDe, garantirCrenca14, mudarCrenca14, praticaDe, religiosa, type Crenca14 } from './crencas';

const eu = (c: Ctx) => garantirCrenca14(c.v);
const nomeMin = (x: Crenca14) => CRENCAS14[x].nome.toLowerCase();
const lutoRecente = (c: Ctx) => c.v.luto.find(l => l.peso >= 25 && c.v.t - l.t <= 24);
const tirarDaSemana = (c: Ctx) => { const k = c.v.rotinas.findIndex(r => r.id === 'igreja'); if (k >= 0) c.v.rotinas.splice(k, 1); eu(c).pratica = 'nenhuma'; };
/** Alguém próximo de outra tradição religiosa (o amigo, o par). */
const deOutraFe = (v: Ctx['v']): Pessoa[] => [...P.amigo(v), ...P.parceiro(v)].filter(p => { const x = crencaDaPessoa(v, p); return religiosa(x) && x !== crencaDe(v).atual; });
const primeiraCelebracao = (x: Crenca14) => { const id = CRENCAS14[x].celebracoes[0]; return id ? CELEBRACOES14[id].nome : undefined; };

export const ACONTECIMENTOS14_CRENCAS: Conteudo[] = [
  {
    id: 'c14_duvida', tipo: 'decisao', manual: true, idade: [15, 85], tema: 'escolha', repetir: 12,
    quando: c => religiosa(eu(c).atual),
    titulo: 'As perguntas',
    texto: c => {
      const l = lutoRecente(c);
      const quem = l && c.v.pessoas[l.pessoaId]?.nome;
      return `${quem ? `Desde a morte de ${quem}, ` : ''}${CRENCAS14[eu(c).atual].lugar ? `${CRENCAS14[eu(c).atual].lugar!.charAt(0).toUpperCase()}${CRENCAS14[eu(c).atual].lugar!.slice(1)} não diz` : 'A fé não diz'} o que dizia. Perguntas que antes tinham resposta ficam abertas — e ninguém em volta parece ter as mesmas.`;
    },
    opcoes: [
      { id: 'ficar', texto: 'Seguir na fé, com as perguntas', resolver: () => ({ texto: 'As perguntas ficaram. A fé também — de um jeito mais seu.', memoria: null, efeito: c => estresse(c, -2) }) },
      { id: 'conversar', texto: 'Conversar com alguém da comunidade', resolver: c => ({ texto: 'Uma conversa longa, sem pressa. Não fechou tudo, mas ajudou.', memoria: null, efeito: () => { if (eu(c).pratica === 'nenhuma') eu(c).pratica = 'ocasional'; feliz(c, 2); } }) },
      { id: 'afastar', texto: 'Afastar-se da prática, sem decidir nada', resolver: () => ({ texto: 'Parou de ir. A crença ficou num canto, sem nome novo.', memoria: null, efeito: tirarDaSemana }) },
      { id: 'deixar', texto: 'Deixar a religião', resolver: () => ({ texto: 'Foi uma decisão lenta, e depois simples.', memoria: null, efeito: c2 => { mudarCrenca14(c2.v, 'sem_religiao', 'duvida'); } }) }
    ]
  },
  {
    id: 'c14_convite', tipo: 'decisao', manual: true, idade: [14, 85], tema: 'amizade', repetir: 8,
    papeis: { quem: deOutraFe },
    titulo: 'O convite',
    texto: c => {
      const x = crencaDaPessoa(c.v, c.p.quem);
      const festa = primeiraCelebracao(x);
      return `${c.p.quem.nome} chamou você para ${festa ? `o ${festa}` : `um encontro de ${nomeMin(x)}`} — "${CRENCAS14[x].lugar ? `é ${CRENCAS14[x].lugar}` : 'é na casa da família'}, vai ter comida, ninguém vai pedir nada".`;
    },
    opcoes: [
      { id: 'ir', texto: 'Ir conhecer', resolver: c => {
        const x = crencaDaPessoa(c.v, c.p.quem);
        return { texto: `Você foi, olhou, perguntou o que não sabia. Foi ${c.g('recebido', 'recebida', 'recebide')} com calma.`, memoria: null, efeito: () => { const e = eu(c); e.conheceu = [...new Set([...(e.conheceu ?? []), x])]; prox(c, 'quem', 4); feliz(c, 2); } };
      } },
      { id: 'nao', texto: 'Agradecer e não ir', resolver: () => ({ texto: 'Você agradeceu. O convite ficou de pé para outra vez.', memoria: null }) }
    ]
  },
  {
    id: 'c14_conversao', tipo: 'decisao', manual: true, idade: [15, 90], tema: 'escolha', repetir: 6,
    quando: c => (eu(c).conheceu ?? []).some(x => x !== eu(c).atual),
    titulo: 'Voltar lá',
    texto: c => {
      const x = (eu(c).conheceu ?? []).filter(y => y !== eu(c).atual)[0];
      return `Você voltou ${CRENCAS14[x].lugar ? `a ${CRENCAS14[x].lugar}` : 'aos encontros'} mais vezes do que planejou. O que se diz ali — ${nomeMin(x)} — tem feito sentido.`;
    },
    opcoes: [
      { id: 'converter', texto: 'Converter-se', resolver: c => {
        const x = (eu(c).conheceu ?? []).filter(y => y !== eu(c).atual)[0];
        return { texto: 'Um passo dado com calma, depois de muita conversa.', memoria: null, efeito: () => { mudarCrenca14(c.v, x, 'conversao'); eu(c).conheceu = (eu(c).conheceu ?? []).filter(y => y !== x); } };
      } },
      { id: 'ficar', texto: 'Ficar com o que aprendeu, sem trocar de nome', resolver: c => ({ texto: 'Você continua indo de vez em quando. Ninguém cobra nada.', memoria: null, efeito: () => { const x = (eu(c).conheceu ?? []).filter(y => y !== eu(c).atual)[0]; eu(c).conheceu = (eu(c).conheceu ?? []).filter(y => y !== x); } }) }
    ]
  },
  {
    id: 'c14_retomada', tipo: 'decisao', manual: true, idade: [22, 95], tema: 'escolha', repetir: 12,
    quando: c => !religiosa(eu(c).atual) && religiosa(eu(c).familia) && eu(c).historia.some(h => religiosa(h.de) && !religiosa(h.para) && c.v.t - h.t >= 60),
    titulo: 'A saudade do rito',
    texto: c => { const f = primeiraCelebracao(eu(c).familia); return `${f ? `Chegou ${f === 'Páscoa' ? 'a' : 'o'} ${f}` : 'Chegou uma data antiga'} e veio junto a saudade: o canto, a mesa, as vozes de quando você era criança.`; },
    opcoes: [
      { id: 'voltar', texto: 'Voltar à fé da família', resolver: c => ({ texto: 'Na primeira vez, sentou lá atrás. Na segunda, já sabia as palavras de novo.', memoria: null, efeito: () => { mudarCrenca14(c.v, eu(c).familia, 'retomada'); } }) },
      { id: 'lembrar', texto: 'Ir uma vez, só para lembrar', resolver: () => ({ texto: 'Foi bonito. Não voltou — e tudo bem.', memoria: null, efeito: c => feliz(c, 2) }) },
      { id: 'nao', texto: 'Deixar a saudade passar', resolver: () => ({ texto: 'A data passou. A lembrança ficou.', memoria: null }) }
    ]
  },
  {
    id: 'c14_filhos', tipo: 'decisao', manual: true, idade: [20, 55], tema: 'filhos', repetir: 30,
    papeis: { par: P.conjuge },
    quando: c => { const a = eu(c).atual, b = crencaDaPessoa(c.v, c.p.par); return a !== b && (religiosa(a) || religiosa(b)) && !eu(c).filhos; },
    titulo: 'Em que fé criar',
    texto: c => `${c.p.par.nome} cresceu em ${nomeMin(crencaDaPessoa(c.v, c.p.par))}; você, em ${nomeMin(eu(c).atual)}. A conversa de hoje é sobre os filhos — os que vierem ou os que já estão aí.`,
    opcoes: [
      { id: 'minha', texto: 'Na sua tradição', resolver: c => ({ texto: `${c.p.par.nome} topou, com uma condição: as datas da família dele${c.p.par.genero === 'feminino' ? 'a' : ''} também valem.`, memoria: null, efeito: () => { eu(c).filhos = 'minha'; } }) },
      { id: 'par', texto: c => `Na tradição de ${c.p.par.nome}`, resolver: c => ({ texto: 'Combinado. Você vai junto nas datas que importam.', memoria: null, efeito: () => { eu(c).filhos = 'par'; prox(c, 'par', 2); } }) },
      { id: 'ambas', texto: 'Nas duas, com as datas das duas', resolver: c => ({ texto: 'Casa com dois calendários: mais festa, mais explicação.', memoria: null, efeito: () => { eu(c).filhos = 'ambas'; } }) },
      { id: 'escolha', texto: 'Sem religião em casa: que escolham quando crescerem', resolver: c => ({ texto: 'As perguntas vão ser respondidas com "o que você acha?".', memoria: null, efeito: () => { eu(c).filhos = 'escolha'; } }) }
    ]
  },
  {
    id: 'c14_jornada', tipo: 'decisao', manual: true, idade: [18, 85], tema: 'lazer', repetir: 10,
    quando: c => !!CRENCAS14[eu(c).atual].jornada && (praticaDe(c.v) !== 'nenhuma' || eu(c).atual === 'espiritualidade') && !c.v.justica?.prisao,
    titulo: 'A viagem da fé',
    texto: c => `Faz anos que você pensa nisso: ${CRENCAS14[eu(c).atual].jornada!.texto}. Este ano, daria.`,
    opcoes: [
      { id: 'ir', texto: c => `Ir (${fmt(local(c, CRENCAS14[eu(c).atual].jornada!.custo))})`, disponivel: c => custa(c, local(c, CRENCAS14[eu(c).atual].jornada!.custo)),
        resolver: c => ({ texto: `Voltou ${c.g('cansado', 'cansada', 'cansade')} do corpo e ${c.g('descansado', 'descansada', 'descansade')} de outro jeito.`, memoria: `Fez ${CRENCAS14[eu(c).atual].jornada!.texto.split(',')[0]}.`, relevancia: 'biografia', tom: 'bom',
          efeito: () => { dinheiro(c, -local(c, CRENCAS14[eu(c).atual].jornada!.custo)); feliz(c, 6); estresse(c, -8); eu(c).jornada = c.v.t; } }) },
      { id: 'adiar', texto: 'Deixar para outro ano', resolver: () => ({ texto: 'Ficou para depois. A vontade também.', memoria: null }) }
    ]
  },
  {
    id: 'c14_amparo', tipo: 'acontecimento', manual: true, idade: [12, 100], tema: 'perda', repetir: 5,
    quando: c => religiosa(eu(c).atual) && praticaDe(c.v) === 'regular' && !!lutoRecente(c),
    narrar: c => {
      const l = lutoRecente(c)!;
      const nome = c.v.pessoas[l.pessoaId]?.nome ?? 'quem se foi';
      return { texto: `A comunidade apareceu depois da morte de ${nome}: comida na porta, gente no velório, alguém ligando toda semana para saber.`, relevancia: 'cotidiano', tom: 'bom',
        efeito: cx => { estresse(cx, -5); feliz(cx, 2); } };
    }
  }
];
