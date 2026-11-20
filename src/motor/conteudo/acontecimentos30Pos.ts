/**
 * VIDA 30 · as escolhas do ofício depois de competir (`v30/oficio/oficio30`): o jeito no ar, o ex-companheiro comentado
 * ao vivo, a revelação da escolinha, a própria escolinha, o convite para assumir interino, o atrito com o técnico, a
 * janela de contratações, a pressão da torcida. Abertas pelo fluxo do ano (`anoDoOficio30`), num ano sem decisão.
 */
import type { Conteudo, Ctx } from './base';
import { clamp } from '../rng';
import { anoDe } from '../tempo';
import { lembrarCom } from '../nucleo';
import { dinheiro, estresse, feliz, local } from './efeitos';
import { alunoDaCena30, cenaDoOficio30, chefeDaComissao30, exCompanheiro30 } from '../v30/oficio/oficio30';
import { propor } from '../sistemas/compromissos';
import { comissaoDe, ocupacaoOuNula } from '../dados/ocupacoes';
import { somarAoNome } from '../sistemas/notoriedade';

const of = (c: Ctx) => c.v.oficio30!;
const mexe = (c: Ctx, da: number, db: number) => { const o = of(c); o.a = clamp(o.a + da); o.b = clamp(o.b + db); };
const fim = (c: Ctx) => { delete of(c).cena; };
const nota = (c: Ctx, n: number) => { const e = c.v.trabalho.atual; if (e) e.desempenho = clamp(e.desempenho + n); };

export const ACONTECIMENTOS_30_POS: Conteudo[] = [
  {
    id: 'pos30_estilo', manual: true, tipo: 'decisao', idade: [18, 90], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_estilo'),
    titulo: c => `No ar, na ${of(c).casa}`,
    texto: c => `Primeira temporada no ${of(c).programa ?? 'programa'}. O diretor quer saber que comentarista você vai ser — "o público decide em três semanas".`,
    opcoes: [
      { id: 'tecnico', texto: 'O técnico: a tática, o porquê do lance', consequencia: () => 'Credibilidade sobe devagar; a audiência, também.', resolver: c => ({ texto: 'Você levou a prancheta para o estúdio. Os outros comentaristas passaram a perguntar a sua opinião antes do programa.', memoria: null, efeito: () => { of(c).estilo = 'tecnico'; mexe(c, 0, 6); fim(c); } }) },
      { id: 'polemico', texto: 'O polêmico: opinião forte, sem medo', consequencia: () => 'Audiência alta, credibilidade em risco — e ex-companheiros incomodados.', resolver: c => ({ texto: 'A primeira opinião forte virou trecho compartilhado. O telefone da emissora não parou.', memoria: null, efeito: () => { of(c).estilo = 'polemico'; mexe(c, 8, -4); fim(c); } }) },
      { id: 'humor', texto: 'O bem-humorado: as histórias de vestiário', consequencia: () => 'O público gosta de você; a análise fica em segundo plano.', resolver: c => ({ texto: 'As histórias do vestiário viraram quadro fixo. O público começou a rir antes da piada.', memoria: null, efeito: () => { of(c).estilo = 'humor'; mexe(c, 5, 0); fim(c); } }) }
    ]
  },
  {
    id: 'pos30_aovivo', manual: true, tipo: 'decisao', idade: [18, 90], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_aovivo'),
    titulo: () => 'Ao vivo',
    texto: c => { const ex = exCompanheiro30(c.v); return `No jogo grande da rodada, ${ex ? `${ex.nome}, que jogou com você,` : 'um jogador que você conhece do vestiário'} errou o lance decisivo. A câmera voltou para você: "e aí, o que você achou?".`; },
    opcoes: [
      { id: 'duro', texto: 'Criticar com dureza', resolver: c => { const ex = exCompanheiro30(c.v); return { texto: `A crítica virou manchete. ${ex ? `${ex.nome} não atendeu mais as suas ligações.` : 'O vestiário não gostou.'}`, memoria: ex ? `Criticou ${ex.nome} ao vivo, sem poupar.` : null, efeito: () => { mexe(c, 6, -2); if (ex && c.v.vinculos[ex.id]) { c.v.vinculos[ex.id].tensao = clamp(c.v.vinculos[ex.id].tensao + 15); lembrarCom(c.v, ex.id, 'Criticou ao vivo, na televisão.', 'conflito', 2); } fim(c); } }; } },
      { id: 'analisar', texto: 'Explicar o lance, sem crucificar', resolver: c => ({ texto: 'Você mostrou o que deu errado — e o que quase deu certo. Ninguém virou vilão.', memoria: null, efeito: () => { mexe(c, 1, 5); nota(c, 2); fim(c); } }) },
      { id: 'proteger', texto: 'Defender o jogador', resolver: c => { const ex = exCompanheiro30(c.v); return { texto: `Você defendeu. Nas redes, "corporativismo"; ${ex ? `no celular, uma mensagem de ${ex.nome}: "valeu, parceiro".` : 'no vestiário, gratidão.'}`, memoria: null, efeito: () => { mexe(c, -2, -3); if (ex && c.v.vinculos[ex.id]) c.v.vinculos[ex.id].proximidade = clamp(c.v.vinculos[ex.id].proximidade + 6); fim(c); } }; } }
    ]
  },
  {
    id: 'pos30_revelacao', manual: true, tipo: 'decisao', idade: [18, 90], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_revelacao') && !!alunoDaCena30(c.v),
    titulo: c => `${alunoDaCena30(c.v)!.nome}`,
    texto: c => { const a = alunoDaCena30(c.v)!; return `${a.nome}, de ${anoDe(c.v.t) - a.nasc} anos, é diferente dos outros da ${of(c).casa}: entende o jogo antes de a bola chegar. A família pergunta o que fazer.`; },
    opcoes: [
      { id: 'indicar', texto: 'Indicar para a peneira de um clube grande', resolver: c => { const a = alunoDaCena30(c.v)!; return { texto: `Você ligou para um conhecido do tempo de jogador. ${a.nome} vai fazer o teste — e a família saiu do seu escritório chorando.`, memoria: `Indicou ${a.nome}, alun${a.nome.endsWith('a') ? 'a' : 'o'} da escolinha, para um clube grande.`, relevancia: 'biografia', tom: 'bom', efeito: () => { a.indicado = c.v.t; mexe(c, 2, 4); feliz(c, 3); fim(c); } }; } },
      { id: 'segurar', texto: 'Segurar mais um ano: ainda é cedo', resolver: c => { const a = alunoDaCena30(c.v)!; return { texto: `Você explicou à família que pressa estraga talento. ${a.nome} ficou — mais um ano de base com você.`, memoria: null, efeito: () => { a.talento = clamp(a.talento + 4); a.indicado = c.v.t + 12; fim(c); } }; } },
      { id: 'familia', texto: 'Conversar com a família sobre estudo e futebol', resolver: c => { const a = alunoDaCena30(c.v)!; return { texto: 'A conversa foi longa. A família decidiu que a escola vem junto — e que você é a pessoa de confiança.', memoria: null, efeito: () => { a.indicado = c.v.t + 6; mexe(c, 0, 5); fim(c); } }; } }
    ]
  },
  {
    id: 'pos30_propria', manual: true, tipo: 'decisao', idade: [22, 80], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_propria') && !of(c).propria,
    titulo: () => 'A própria escolinha?',
    texto: c => `Pais de alunos perguntam por que você não abre a sua. Há um terreno com quadra para alugar perto de casa. Montar sai uns ${local(c, 60000)}.`,
    opcoes: [
      { id: 'abrir', texto: 'Abrir', disponivel: c => (c.v.financas.conta >= local(c, 60000) ? true : 'Não há esse dinheiro agora.'), consequencia: () => 'Mais alunos e um resultado que é seu — bom ou ruim.', resolver: c => ({ texto: 'Placa na porta, bolas novas, a primeira turma de sábado cheia. O nome é seu.', memoria: 'Abriu a própria escolinha.', relevancia: 'marco', tom: 'bom', efeito: () => { dinheiro(c, -local(c, 60000)); const o = of(c); o.propria = true; o.casa = `${o.oc === 'treinador_escolinha' ? 'Escolinha' : 'Academia'} ${c.v.eu.nome}`; estresse(c, 6); fim(c); } }) },
      { id: 'nao', texto: 'Continuar como está', resolver: c => ({ texto: 'Você agradeceu. Ser dono é outro emprego.', memoria: null, efeito: () => fim(c) }) }
    ]
  },
  {
    id: 'pos30_interino', manual: true, tipo: 'decisao', idade: [26, 80], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_interino'),
    titulo: c => `${of(c).casa}: o técnico caiu`,
    texto: c => { const ch = chefeDaComissao30(c.v, of(c)); return `Depois de mais uma derrota, a diretoria demitiu ${ch?.nome ?? 'o técnico'}. O presidente ligou para você: "assume até o fim da temporada? Se for bem, o cargo é seu".`; },
    opcoes: [
      { id: 'assumir', texto: 'Assumir o comando', consequencia: () => 'A carreira de técnico começa aqui, no mesmo clube.', resolver: c => {
        const o = of(c);
        const oc = ocupacaoOuNula(o.oc);
        const tec = oc?.modalidade ? comissaoDe(oc.modalidade).tecnico : o.oc.includes('esports') ? 'tecnico_esports' : undefined;
        const ch = chefeDaComissao30(c.v, o);
        if (ch && c.v.vinculos[ch.id]) lembrarCom(c.v, ch.id, 'Assumiu o time quando você caiu.', 'conflito', 1);
        if (!tec || tec === o.oc) return { texto: 'O clube preferiu buscar um nome de fora. Você seguiu na comissão — mas o presidente lembrou do sim.', memoria: null, efeito: () => { mexe(c, 6, 0); fim(c); } };
        const clube = c.v.trabalho.atual?.clube;
        const res = propor(c.v, c.r, { tipo: 'emprego', ocupacaoId: tec, via: 'promocao', substitui: true, texto: `O comando d${o.casa.startsWith('equipe') ? 'a' : 'o'} ${o.casa}.`, ...(clube ? { ajuste: { clube, clubeCidade: c.v.trabalho.atual?.municipioId } } : {}) });
        return { texto: res === 'feito' ? `Prancheta na mão, vestiário em silêncio. Você é o técnico d${o.casa.startsWith('equipe') ? 'a' : 'o'} ${o.casa}.` : 'O convite esbarrou no que você já tem — a vida pergunta o que fazer.', memoria: res === 'feito' ? `Assumiu como técnic${c.v.eu.genero === 'feminino' ? 'a' : 'o'} interin${c.v.eu.genero === 'feminino' ? 'a' : 'o'} d${o.casa.startsWith('equipe') ? 'a' : 'o'} ${o.casa}.` : null, relevancia: 'marco', tom: 'bom', efeito: () => { somarAoNome(c.v, 'esporte', 2); fim(c); } };
      } },
      { id: 'recusar', texto: 'Recusar: o seu lugar é na comissão', resolver: c => ({ texto: 'Veio um técnico de fora. Ele manteve você — e soube que você recusou o cargo.', memoria: null, efeito: () => { mexe(c, 4, 0); fim(c); } }) }
    ]
  },
  {
    id: 'pos30_vestiario', manual: true, tipo: 'decisao', idade: [22, 80], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_vestiario'),
    titulo: () => 'O atrito com o técnico',
    texto: c => { const ch = chefeDaComissao30(c.v, of(c)); return `${ch?.nome ?? 'O técnico'} ignorou o seu relatório duas vezes seguidas — e o time perdeu exatamente como você tinha previsto. Os jogadores perceberam.`; },
    opcoes: [
      { id: 'conversar', texto: 'Conversar a sós', resolver: c => { const ch = chefeDaComissao30(c.v, of(c)); const ouviu = c.r.chance(0.55); return { texto: ouviu ? `${ch?.nome ?? 'Ele'} ouviu, resmungou e, no jogo seguinte, usou a sua ideia.` : `${ch?.nome ?? 'Ele'} disse que quem decide é ele. Ponto.`, memoria: null, tom: ouviu ? 'bom' : 'neutro', efeito: () => { mexe(c, ouviu ? 12 : 2, 0); if (ch && c.v.vinculos[ch.id]) c.v.vinculos[ch.id].confianca = clamp(c.v.vinculos[ch.id].confianca + (ouviu ? 8 : 0)); fim(c); } }; } },
      { id: 'publico', texto: 'Comentar com os jogadores', resolver: c => ({ texto: 'A conversa chegou ao técnico em uma hora. O clima azedou.', memoria: null, tom: 'ruim', efeito: () => { mexe(c, -12, 0); nota(c, -4); fim(c); } }) },
      { id: 'calar', texto: 'Fazer o seu trabalho e esperar', resolver: c => ({ texto: 'Você seguiu entregando os relatórios. Um dia, alguém vai ler.', memoria: null, efeito: () => { mexe(c, 2, 0); estresse(c, 3); fim(c); } }) }
    ]
  },
  {
    id: 'pos30_janela', manual: true, tipo: 'decisao', idade: [25, 85], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_janela'),
    titulo: c => `A janela d${of(c).casa.startsWith('equipe') ? 'a' : 'o'} ${of(c).casa}`,
    texto: () => 'A janela abriu. Há dinheiro para uma aposta: o veterano conhecido (caro, resolve agora), a promessa de 19 anos (barata, pode virar craque ou não) — ou guardar o orçamento.',
    opcoes: [
      { id: 'veterano', texto: 'O veterano', resolver: c => { const deu = c.r.chance(0.6); return { texto: deu ? 'Ele chegou, vestiu a camisa e decidiu dois jogos grandes. A torcida cantou o nome dele — e o seu, na diretoria.' : 'Ele chegou machucado e jogou cinco partidas. O salário dele virou piada nos programas.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { mexe(c, deu ? 14 : -14, -10); fim(c); } }; } },
      { id: 'promessa', texto: 'A promessa', resolver: c => { const deu = c.r.chance(0.45); return { texto: deu ? 'No segundo semestre, o menino virou titular. O valor de mercado dele já pagou a contratação três vezes.' : 'Ele ainda não estava pronto. Ficou no banco o ano todo — mas está aprendendo.', memoria: null, tom: deu ? 'bom' : 'neutro', efeito: () => { mexe(c, deu ? 12 : -3, 4); fim(c); } }; } },
      { id: 'guardar', texto: 'Guardar o orçamento', resolver: c => ({ texto: 'O caixa agradeceu. A torcida, não.', memoria: null, efeito: () => { mexe(c, -2, 10); fim(c); } }) }
    ]
  },
  {
    id: 'pos30_pressao', manual: true, tipo: 'decisao', idade: [25, 85], tema: 'trabalho',
    quando: c => cenaDoOficio30(c.v, 'pos30_pressao'),
    titulo: () => 'A torcida no portão',
    texto: c => `Depois da quarta derrota seguida, a torcida foi para o portão d${of(c).casa.startsWith('equipe') ? 'a' : 'o'} ${of(c).casa}. A faixa tinha o seu nome. O presidente quer uma resposta até amanhã.`,
    opcoes: [
      { id: 'demitir', texto: 'Demitir o técnico', resolver: c => ({ texto: 'A notícia acalmou a arquibancada por uma semana. O técnico novo pediu dois reforços.', memoria: null, efeito: () => { mexe(c, 3, -6); fim(c); } }) },
      { id: 'bancar', texto: 'Bancar o trabalho e explicar à torcida', resolver: c => { const deu = c.r.chance(0.5); return { texto: deu ? 'Você deu a entrevista, o time reagiu, e a faixa virou outra: "confiamos".' : 'Você bancou. Vieram mais duas derrotas — e a cobrança agora é só sua.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { mexe(c, deu ? 10 : -8, 0); estresse(c, 6); fim(c); } }; } },
      { id: 'reforco', texto: 'Contratar às pressas', resolver: c => ({ texto: 'Dois reforços chegaram em uma semana. Um deu certo.', memoria: null, efeito: () => { mexe(c, 4, -12); fim(c); } }) }
    ]
  }
];
