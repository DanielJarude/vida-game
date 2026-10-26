/**
 * REWORK 12.25 — OS ACONTECIMENTOS DO SUBMUNDO VIVO: nascem do histórico real da partida (quem é cada pessoa, o que
 * cada organização lembra, o que a família sabe), não de um sorteio genérico. Cada um tem memória (o fato do dia, o
 * intervalo de `repetir`) e pode terminar bem, mal ou nem uma coisa nem outra. Disparados pelos sistemas
 * (`carreiraCriminal`, `redeCriminal`, `faccoes`) ou lidos do estado aqui mesmo (`quando`).
 *
 *   sub125_familia      alguém da família descobriu (ou pede que você saia) — contar, negar, prometer, pedir apoio
 *   sub125_pedido       um contato pede um favor (ajudar, recusar, deixar para depois)
 *   sub125_cobra        a dívida de favores é cobrada
 *   sub125_mudou_org    um contato foi para outra organização
 *   sub125_disputa      a liderança da sua organização ficou vaga
 *   sub125_novo_lider   uma organização com que você trabalha trocou de comando
 *   sub125_rivalidade   a rival disputa o mesmo pedaço da cidade
 *   sub125_alianca      uma organização oferece aliança a quem tem nome
 *   sub125_reaparece    um parceiro antigo reaparece
 *   sub125_retorno      para quem saiu: a proposta de voltar
 *   sub125_legado       para quem herdou o nome: a organização do pai (ou da mãe) aparece
 *   sub125_abrigo       para quem é procurado: o abrigo que oferecem
 *   sub125_pavilhao     na prisão: a sua organização lá dentro
 *
 * Nenhuma opção descreve como se faz coisa alguma.
 */
import type { Conteudo, Ctx, Papel } from './base';
import { comContracao } from './base';
import type { Pessoa, Vida } from '../tipos';
import { feliz, estresse } from './efeitos';
import { clamp } from '../rng';
import { lembrarCom } from '../nucleo';
import { dinheiroCurto as fmt } from '../texto';
import { disponivel } from '../sistemas/dinheiro';
import { entrar, parar } from '../sistemas/ilicito';
import { afastar, anotar, lembrarOrg, orgPorId } from '../sistemas/submundo';
import { comecarASair, garantirCarreira } from '../sistemas/carreiraCriminal';
import { pagarPorFora, pedirRumo } from '../sistemas/porFora';
import { historiaDoContato, mudarConfianca, valorDeFavor } from '../sistemas/redeCriminal';
import { executarOrg, lider, orgViva, relacaoCom, nivelDe, regiaoDaPessoa, nomeDaRegiao } from '../sistemas/faccoes';
import { abrigoPossivel, custoDaMudanca, executarDefesa } from '../sistemas/defesa';
import { abalar } from '../sistemas/abalo';
import { proporEncomenda } from '../sistemas/encomendas';
import { rngDe } from '../rng';

const deHoje = (c: Ctx, id: string) => c.v.fatos[id] === c.v.t;
const env = (c: Ctx) => c.v.caminhos.envolvimento!;
const ativo = (c: Ctx) => !!c.v.caminhos.envolvimento && c.v.caminhos.envolvimento.parou === undefined && !c.v.justica?.prisao;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** A pessoa (ou a organização) da cena de hoje, escolhida pelo sistema que a disparou. */
const daCena = (id: string): Papel => Object.assign((v: Vida): Pessoa[] => { const p = v.caminhos.envolvimento?.cenas125?.[id]; return p && v.pessoas[p]?.vivo ? [v.pessoas[p]] : []; }, { fixo: true });
const orgDaCena = (c: Ctx, id: string) => { const o = c.v.caminhos.envolvimento?.cenas125?.[id]; return o ? orgViva(c.v, o) : undefined; };
const quem = (c: Ctx) => c.p.quem;
const ficha = (c: Ctx) => env(c).fichas?.[quem(c).id];

export const ACONTECIMENTOS_125: Conteudo[] = ([
  /* ------------------------------------------------------------- a família */
  {
    id: 'sub125_familia', tipo: 'decisao', idade: [14, 95], tema: 'familia', prioritario: true, prioridade: 3, repetir: 3,
    papeis: { quem: daCena('sub125_familia') },
    quando: c => deHoje(c, 'sub125_familia') && !!c.v.caminhos.envolvimento?.familia?.[quem(c).id] && !c.v.justica?.prisao,
    titulo: c => { const f = env(c).familia![quem(c).id]; return f.postura === 'pede_para_sair' && f.t !== c.v.t ? `${quem(c).nome} pede que você saia` : `${quem(c).nome} sabe`; },
    texto: c => {
      const f = env(c).familia![quem(c).id];
      const ativoAgora = env(c).parou === undefined;
      const fala = { apoia: 'Não disse que estava certo — disse que está do seu lado, aconteça o que acontecer.', preocupada: 'Não gritou nem ameaçou: perguntou se você está seguro, e a voz tremeu.', rejeita: 'Disse que não reconhece mais você. A porta ficou entreaberta, mas não por muito tempo.', pede_para_sair: 'Pediu, com todas as letras, que você saia disso enquanto dá.', reconciliada: 'Disse que fica feliz por você ter saído.' }[f.postura];
      return `${quem(c).nome} ${f.t === c.v.t ? 'descobriu o que você faz por fora' : 'voltou ao assunto'}${ativoAgora ? '' : ' — o que você fazia'}. ${fala}`;
    },
    opcoes: [
      { id: 'contar', texto: 'Contar a verdade', comportamento: { empatia: 1 },
        consequencia: () => 'A confiança sobe com a verdade — mesmo quando a verdade dói.',
        resolver: c => ({ texto: 'Você contou tudo, do começo. Houve silêncio, e depois uma pergunta: "e agora?".', memoria: null, efeito: () => { const vin = c.v.vinculos[quem(c).id]; const f = env(c).familia![quem(c).id]; f.tConversa = c.v.t; f.sabe = 2; if (vin) { vin.confianca = clamp(vin.confianca + 8); vin.tensao = clamp(vin.tensao + (f.postura === 'rejeita' ? 8 : -4)); } lembrarCom(c.v, quem(c).id, 'Você contou a verdade sobre o que fazia por fora.', 'descoberta', 2); } }) },
      { id: 'negar', texto: 'Negar', comportamento: { empatia: -1 },
        consequencia: c => (env(c).familia![quem(c).id].sabe === 2 ? 'Quem já sabe não acredita — e perde a confiança.' : 'Pode colar, por um tempo.'),
        resolver: c => { const sabe = env(c).familia![quem(c).id].sabe === 2; return { texto: sabe ? 'Você negou. Pela cara, não colou.' : 'Você negou. A desconfiança ficou guardada, não resolvida.', memoria: null, tom: sabe ? 'ruim' : undefined, efeito: () => { const vin = c.v.vinculos[quem(c).id]; env(c).familia![quem(c).id].tConversa = c.v.t; if (vin && sabe) { vin.confianca = clamp(vin.confianca - 10); vin.tensao = clamp(vin.tensao + 8); } } }; } },
      { id: 'prometer', texto: 'Prometer sair (aos poucos, em um ano)', comportamento: { disciplina: 1 }, disponivel: c => (env(c).parou === undefined && env(c).saindo === undefined ? true : false),
        consequencia: () => 'Começa a saída agora. Promessa feita à família é cobrada.',
        resolver: c => ({ texto: `${quem(c).nome} segurou a sua mão por um tempo. Depois disse: "eu vou cobrar".`, memoria: `Prometeu a ${quem(c).nome} que sairia do que fazia por fora.`, efeito: () => { comecarASair(c.v); const f = env(c).familia![quem(c).id]; f.tConversa = c.v.t; const vin = c.v.vinculos[quem(c).id]; if (vin) { vin.tensao = clamp(vin.tensao - 8); vin.confianca = clamp(vin.confianca + 4); } } }) },
      { id: 'apoio', texto: c => (env(c).familia![quem(c).id].postura === 'apoia' ? 'Agradecer e pedir que guarde segredo' : 'Pedir que tente entender'),
        resolver: c => { const p = env(c).familia![quem(c).id].postura; const bem = p === 'apoia' || p === 'preocupada' || p === 'reconciliada'; return { texto: bem ? `${quem(c).nome} prometeu não contar a ninguém. Um segredo a mais na família — e alguém do seu lado.` : `${quem(c).nome} não quis entender. A conversa acabou em briga.`, memoria: null, tom: bem ? undefined : 'ruim', efeito: () => { const vin = c.v.vinculos[quem(c).id]; env(c).familia![quem(c).id].tConversa = c.v.t; if (vin) { if (bem) vin.proximidade = clamp(vin.proximidade + 4); else { vin.tensao = clamp(vin.tensao + 12); pedirRumo(c.v, 'familia'); } } } }; } }
    ]
  },
  /* ------------------------------------------------------------- o pedido de um contato */
  {
    id: 'sub125_pedido', tipo: 'decisao', idade: [14, 90], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 3,
    papeis: { quem: daCena('sub125_pedido') },
    quando: c => deHoje(c, 'sub125_pedido') && !!ficha(c) && !c.v.justica?.prisao,
    titulo: c => `${quem(c).nome} pediu uma coisa`,
    texto: c => { const f = ficha(c)!; const o = f.interesse === 'familia' ? 'um dinheiro emprestado para a família (alguém doente, uma conta atrasada)' : f.interesse === 'seguranca' ? 'um lugar para guardar umas coisas por um tempo, sem perguntas' : f.interesse === 'vinganca' ? 'que você não se meta quando ele for acertar uma conta antiga' : 'uma ajuda para resolver um problema com gente de fora'; return `${quem(c).nome} pediu ${o}. Quem ajuda fica com um crédito; quem nega, com uma lembrança.`; },
    opcoes: [
      { id: 'ajudar', texto: c => `Ajudar (uns ${fmt(valorDeFavor(c.v))})`, disponivel: c => (disponivel(c.v) >= valorDeFavor(c.v) ? true : 'Não há dinheiro para isso agora.'),
        resolver: c => ({ texto: `${quem(c).nome} não esquece de quem ajudou. Agora ele deve uma a você.`, memoria: null, efeito: () => { pagarPorFora(c.v, 'custos', valorDeFavor(c.v)); const f = ficha(c)!; f.favores = (f.favores ?? 0) + 1; f.amizade = clamp((f.amizade ?? 20) + 6); mudarConfianca(c.v, quem(c).id, 4); historiaDoContato(c.v, quem(c).id, 'Você o ajudou quando ele pediu.', 'bom'); } }) },
      { id: 'depois', texto: 'Dizer que ajuda mais para a frente',
        consequencia: () => 'Ganha tempo; a promessa fica — e é lembrada.',
        resolver: c => ({ texto: 'Ele aceitou. "Mais para a frente", repetiu, como quem anota.', memoria: null, efeito: () => { c.v.fatos[`sub_ultima_${quem(c).id}`] = c.v.t; const f = ficha(c)!; f.quebradas++; historiaDoContato(c.v, quem(c).id, 'Você prometeu ajudar depois.'); } }) },
      { id: 'recusar', texto: 'Recusar', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Você disse que não dava. Ele entendeu — do jeito dele.', memoria: null, efeito: () => { const f = ficha(c)!; f.amizade = clamp((f.amizade ?? 20) - 6); mudarConfianca(c.v, quem(c).id, -3); historiaDoContato(c.v, quem(c).id, 'Você recusou um pedido dele.', 'ruim'); } }) }
    ]
  },
  /* ------------------------------------------------------------- a cobrança dos favores */
  {
    id: 'sub125_cobra', tipo: 'decisao', idade: [14, 90], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 1,
    papeis: { quem: daCena('sub125_cobra') },
    quando: c => deHoje(c, 'sub125_cobra') && (ficha(c)?.favores ?? 0) < 0 && ativo(c),
    titulo: c => `${quem(c).nome} veio cobrar os favores`,
    texto: c => `${quem(c).nome} fez as contas: você deve ${-(ficha(c)!.favores ?? 0)} favores a ele. ${(ficha(c)!.amizade ?? 20) >= 50 ? 'Disse isso rindo — mas disse.' : 'Não estava rindo.'}`,
    opcoes: [
      { id: 'pagar', texto: c => `Acertar (uns ${fmt(valorDeFavor(c.v) * -(ficha(c)!.favores ?? 0))})`, disponivel: c => (disponivel(c.v) >= valorDeFavor(c.v) * -(ficha(c)!.favores ?? 0) ? true : 'O que você tem não cobre.'),
        resolver: c => ({ texto: 'Contas zeradas. Ele saiu satisfeito — e com mais vontade de trabalhar com você.', memoria: null, efeito: () => { const f = ficha(c)!; pagarPorFora(c.v, 'custos', valorDeFavor(c.v) * -(f.favores ?? 0)); f.favores = 0; f.cumpridas++; mudarConfianca(c.v, quem(c).id, 6); } }) },
      { id: 'trabalho', texto: 'Pagar com trabalho: fazer um serviço para ele', disponivel: c => (ativo(c) ? true : false),
        consequencia: () => 'Sem dinheiro agora; um trabalho dele chega em Encomendas, pagando menos.',
        resolver: c => ({ texto: 'Fechado: um trabalho para ele, e ficam quites.', memoria: null, efeito: () => { const f = ficha(c)!; f.favores = 0; const x = proporEncomenda(c.v, c.r, f.especialidade, { pessoaId: quem(c).id }, 1); if (x) x.valor = Math.round(x.valor * 0.4 / 100) * 100; } }) },
      { id: 'negar', texto: 'Dizer que não deve nada', comportamento: { impulsividade: 1 },
        resolver: c => { const fala = c.r.chance(0.4); return { texto: fala ? 'Ele foi embora — e foi falar de você a quem não devia.' : 'Ele foi embora. Não volta mais.', memoria: null, tom: 'ruim', efeito: () => { const f = ficha(c)!; if (fala) { f.traiu = c.v.t; env(c).exposicao = clamp(env(c).exposicao + 10); env(c).traicoes = (env(c).traicoes ?? 0) + 1; anotar(c.v, `${quem(c).nome} falou de você depois da cobrança.`, 'ruim'); } else afastar(c.v, quem(c).id, 'você não reconheceu o que devia'); } }; } }
    ]
  },
  /* ------------------------------------------------------------- o contato que mudou de lado */
  {
    id: 'sub125_mudou_org', tipo: 'decisao', idade: [16, 90], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 2,
    papeis: { quem: daCena('sub125_mudou_org') },
    quando: c => deHoje(c, 'sub125_mudou_org') && !!ficha(c)?.organizacao && ativo(c),
    titulo: c => `${quem(c).nome} mudou de lado`,
    texto: c => `${quem(c).nome} agora é de ${orgPorId(c.v, ficha(c)!.organizacao!)?.nome ?? 'outra organização'}. Leva o que sabe — inclusive de você. E traz o que sabe de lá.`,
    opcoes: [
      { id: 'manter', texto: 'Manter a amizade, longe dos negócios',
        resolver: c => ({ texto: 'Vocês combinaram não falar de trabalho. Sabem que vão falar.', memoria: null, efeito: () => { const m = (env(c).organizacoes ?? []).find(o => o.relacao === 'membro' && o.saiu === undefined); if (m) lembrarOrg(m, c.v.t, 'conflito', -2); } }) },
      { id: 'informar', texto: 'Pedir que conte como é do outro lado',
        consequencia: () => 'O que se sabe vale — e o que se pede, também.',
        resolver: c => ({ texto: `${quem(c).nome} contou o que pôde. Agora você deve uma a ele.`, memoria: null, efeito: () => { const f = ficha(c)!; f.favores = (f.favores ?? 0) - 1; const m = (env(c).organizacoes ?? []).find(o => o.relacao === 'membro' && o.saiu === undefined); if (m) lembrarOrg(m, c.v.t, 'favor', 4); } }) },
      { id: 'cortar', texto: 'Cortar o contato', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você deixou de atender. Cada um do seu lado.', memoria: null, efeito: () => afastar(c.v, quem(c).id, 'foi para outra organização') }) }
    ]
  },
  /* ------------------------------------------------------------- a disputa pela liderança */
  {
    id: 'sub125_disputa', tipo: 'decisao', idade: [16, 90], tema: 'escolha', prioritario: true, prioridade: 4, repetir: 1,
    quando: c => deHoje(c, 'sub125_disputa') && !!orgDaCena(c, 'sub125_disputa')?.disputa && ativo(c),
    titulo: c => `${cap(orgDaCena(c, 'sub125_disputa')!.nome)}: a liderança está vaga`,
    texto: c => { const o = orgDaCena(c, 'sub125_disputa')!; const nomes = o.disputa!.candidatos.filter(x => x !== 'jogador').map(x => o.quadro.find(m => m.id === x)?.nome).filter(Boolean); return `Em ${o.nome}, ${o.disputa!.motivo}. ${nomes.length > 1 ? `${nomes.join(' e ')} querem o comando` : nomes.length ? `${nomes[0]} quer o comando` : 'Ninguém assumiu ainda'}${o.disputa!.candidatos.includes('jogador') ? ' — e o seu nome também está na mesa' : ''}. Todo mundo quer saber de que lado você fica. Nem toda disputa acaba em guerra: algumas acabam em acordo, outras em racha.`; },
    opcoes: [
      { id: 'apoiar_1', texto: c => { const o = orgDaCena(c, 'sub125_disputa')!; const id = o.disputa!.candidatos.filter(x => x !== 'jogador')[0]; return `Apoiar ${o.quadro.find(m => m.id === id)?.nome ?? 'o primeiro nome'}`; },
        disponivel: c => (orgDaCena(c, 'sub125_disputa')!.disputa!.candidatos.filter(x => x !== 'jogador').length >= 1 ? true : false),
        resolver: c => { const o = orgDaCena(c, 'sub125_disputa')!; const id = o.disputa!.candidatos.filter(x => x !== 'jogador')[0]; return { texto: executarOrg(c.v, o.id, 'apoiar', id).texto, memoria: null }; } },
      { id: 'apoiar_2', texto: c => { const o = orgDaCena(c, 'sub125_disputa')!; const id = o.disputa!.candidatos.filter(x => x !== 'jogador')[1]; return `Apoiar ${o.quadro.find(m => m.id === id)?.nome ?? 'o outro nome'}`; },
        disponivel: c => (orgDaCena(c, 'sub125_disputa')!.disputa!.candidatos.filter(x => x !== 'jogador').length >= 2 ? true : false),
        resolver: c => { const o = orgDaCena(c, 'sub125_disputa')!; const id = o.disputa!.candidatos.filter(x => x !== 'jogador')[1]; return { texto: executarOrg(c.v, o.id, 'apoiar', id).texto, memoria: null }; } },
      { id: 'disputar', texto: 'Disputar o comando', comportamento: { coragem: 2 },
        disponivel: c => { const o = orgDaCena(c, 'sub125_disputa')!; const rel = env(c).organizacoes?.find(x => x.id === o.id); return o.disputa!.candidatos.includes('jogador') ? false : rel && nivelDe(c.v, rel) >= 4 ? true : 'Para disputar, é preciso estar perto do comando (um posto alto).'; },
        resolver: c => ({ texto: executarOrg(c.v, orgDaCena(c, 'sub125_disputa')!.id, 'disputar').texto, memoria: null, relevancia: 'marco' }) },
      { id: 'neutro', texto: 'Ficar de fora',
        resolver: c => ({ texto: executarOrg(c.v, orgDaCena(c, 'sub125_disputa')!.id, 'neutro').texto, memoria: null }) },
      { id: 'sair', texto: 'Aproveitar a confusão para sair', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: executarOrg(c.v, orgDaCena(c, 'sub125_disputa')!.id, 'sair').texto, memoria: null }) }
    ]
  },
  /* ------------------------------------------------------------- outra organização trocou de comando */
  {
    id: 'sub125_novo_lider', tipo: 'acontecimento', idade: [16, 95], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 2,
    quando: c => deHoje(c, 'sub125_novo_lider') && !!orgDaCena(c, 'sub125_novo_lider') && ativo(c),
    narrar: c => { const o = orgDaCena(c, 'sub125_novo_lider')!; const l = lider(o); return { texto: `${cap(o.nome)} tem novo comando: ${l?.nome ?? 'alguém de fora'}. O que se combinou com a direção de antes vale menos agora — e o que se fizer daqui em diante conta em dobro.`, relevancia: 'cotidiano', efeito: () => { const rel = env(c).organizacoes?.find(x => x.id === o.id); if (rel) rel.lealdade = Math.round(rel.lealdade * 0.8 + 8); } }; }
  },
  /* ------------------------------------------------------------- a rivalidade que esquenta */
  {
    id: 'sub125_rivalidade', tipo: 'decisao', idade: [16, 90], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 3,
    quando: c => deHoje(c, 'sub125_rivalidade') && ativo(c) && (env(c).cenas125?.['sub125_rivalidade'] ?? '').split('|').every(x => !!orgViva(c.v, x)),
    titulo: 'O mesmo pedaço da cidade',
    texto: c => { const [a, b] = env(c).cenas125!['sub125_rivalidade'].split('|').map(x => orgViva(c.v, x)!); return `${cap(b.nome)} quer mais espaço em ${nomeDaRegiao(c.v.moradia.municipioId, regiaoDaPessoa(c.v))} — onde ${a.nome} também está. Os moradores e o comércio já reclamam do clima; quem manda em ${a.nome} quer saber o que você acha.`; },
    opcoes: [
      { id: 'tregua', texto: 'Propor uma conversa com o outro lado', comportamento: { empatia: 1 },
        resolver: c => { const [a, b] = env(c).cenas125!['sub125_rivalidade'].split('|').map(x => orgViva(c.v, x)!); const deu = c.r.chance(0.5); return { texto: deu ? 'Houve conversa. Cada um ficou com o seu pedaço — por enquanto. O bairro respirou.' : 'A conversa não aconteceu: do outro lado, ninguém quis sentar.', memoria: null, efeito: () => { if (deu) { b.rivais = b.rivais.filter(x => x !== a.id); a.rivais = a.rivais.filter(x => x !== b.id); } const rel = env(c).organizacoes?.find(x => x.id === a.id); if (rel) lembrarOrg(rel, c.v.t, deu ? 'favor' : 'conflito', deu ? 5 : -2); } }; } },
      { id: 'firme', texto: 'Defender o espaço', comportamento: { coragem: 1 },
        consequencia: () => 'A organização lembra de quem ficou firme; a Justiça e o bairro também reparam.',
        resolver: c => { const [a, b] = env(c).cenas125!['sub125_rivalidade'].split('|').map(x => orgViva(c.v, x)!); const reg = regiaoDaPessoa(c.v); return { texto: 'Vocês não recuaram. O pedaço continua de quem estava — com mais gente olhando.', memoria: null, efeito: () => { a.influencia[reg] = clamp((a.influencia[reg] ?? 0) + 6); b.influencia[reg] = clamp((b.influencia[reg] ?? 0) - 6); a.pressao = clamp(a.pressao + 8); env(c).exposicao = clamp(env(c).exposicao + 6); const rel = env(c).organizacoes?.find(x => x.id === a.id); if (rel) lembrarOrg(rel, c.v.t, 'favor', 6); estresse(c, 4); } }; } },
      { id: 'recuar', texto: 'Recuar: não vale a briga', comportamento: { disciplina: 1 },
        resolver: c => { const [a, b] = env(c).cenas125!['sub125_rivalidade'].split('|').map(x => orgViva(c.v, x)!); const reg = regiaoDaPessoa(c.v); return { texto: 'Vocês cederam um pedaço. Menos dinheiro ali — e menos risco.', memoria: null, efeito: () => { a.influencia[reg] = clamp((a.influencia[reg] ?? 0) - 8); b.influencia[reg] = clamp((b.influencia[reg] ?? 0) + 6); const rel = env(c).organizacoes?.find(x => x.id === a.id); if (rel && rel.relacao === 'membro') lembrarOrg(rel, c.v.t, 'conflito', -4); } }; } }
    ]
  },
  /* ------------------------------------------------------------- a oferta de aliança */
  {
    id: 'sub125_alianca', tipo: 'decisao', idade: [18, 90], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 4,
    quando: c => deHoje(c, 'sub125_alianca') && ativo(c) && !!orgDaCena(c, 'sub125_alianca'),
    titulo: c => `${cap(orgDaCena(c, 'sub125_alianca')!.nome)} quer conversar`,
    texto: c => { const o = orgDaCena(c, 'sub125_alianca')!; return `${cap(o.nome)} ouviu falar de você. Um recado: trabalhar junto, sem ser de dentro — eles mandam trabalho, você manda o seu. Aliado não é integrante; mas aliado também deve lealdade.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar a aliança', resolver: c => ({ texto: 'Fechado. Agora há um nome a mais do seu lado — e um a mais esperando algo de você.', memoria: null, efeito: () => { const o = orgDaCena(c, 'sub125_alianca')!; const rel = relacaoCom(c.v, o); rel.relacao = 'aliada'; rel.lealdade = Math.max(rel.lealdade, 50); lembrarOrg(rel, c.v.t, 'alianca', 0); } }) },
      { id: 'ouvir', texto: 'Ouvir, sem compromisso', resolver: c => ({ texto: 'Você ouviu e não prometeu nada. Eles anotaram o seu nome.', memoria: null, efeito: () => { relacaoCom(c.v, orgDaCena(c, 'sub125_alianca')!); } }) },
      { id: 'recusar', texto: 'Recusar', comportamento: { independencia: 1 }, resolver: c => ({ texto: 'Você agradeceu e recusou. Ninguém gostou, ninguém reclamou.', memoria: null, efeito: () => { const rel = relacaoCom(c.v, orgDaCena(c, 'sub125_alianca')!); rel.lealdade = clamp(rel.lealdade - 5); } }) }
    ]
  },
  /* ------------------------------------------------------------- o parceiro antigo que reaparece */
  {
    id: 'sub125_reaparece', tipo: 'decisao', idade: [18, 90], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 4,
    papeis: { quem: daCena('sub125_reaparece') },
    quando: c => deHoje(c, 'sub125_reaparece') && !!ficha(c) && !c.v.justica?.prisao,
    titulo: c => `${quem(c).nome} apareceu de novo`,
    texto: c => `Anos depois, ${quem(c).nome} bateu à porta. ${env(c).parou === undefined ? 'Quer voltar a trabalhar com você.' : 'Diz que só veio ver como você está — e talvez seja verdade.'} ${ficha(c)?.historia?.length ? `Vocês têm história: ${ficha(c)!.historia![ficha(c)!.historia!.length - 1].texto.charAt(0).toLowerCase()}${ficha(c)!.historia![ficha(c)!.historia!.length - 1].texto.slice(1)}` : ''}`,
    opcoes: [
      { id: 'reatar', texto: c => (env(c).parou === undefined ? 'Voltar a trabalhar juntos' : 'Retomar a amizade, longe do resto'),
        resolver: c => ({ texto: env(c).parou === undefined ? 'Como nos velhos tempos — com os riscos de sempre.' : 'Um café, uma conversa longa. Ninguém tocou no passado.', memoria: null, efeito: () => { const f = ficha(c)!; delete f.afastado; f.reconciliado = c.v.t; f.confianca = Math.max(f.confianca, 35); f.amizade = clamp((f.amizade ?? 30) + 8); historiaDoContato(c.v, quem(c).id, 'Reapareceu, e vocês retomaram.', 'bom'); if (env(c).parou !== undefined) f.afastado = c.v.t; } }) },
      { id: 'ajudar', texto: 'Ajudar no que ele precisa, e só', disponivel: c => (disponivel(c.v) >= valorDeFavor(c.v) ? true : 'Não há dinheiro para isso agora.'),
        resolver: c => ({ texto: 'Ele precisava de ajuda, não de sócio. Você ajudou.', memoria: null, efeito: () => { pagarPorFora(c.v, 'custos', valorDeFavor(c.v)); const f = ficha(c)!; f.favores = (f.favores ?? 0) + 1; f.amizade = clamp((f.amizade ?? 30) + 6); feliz(c, 2); } }) },
      { id: 'recusar', texto: 'Fechar a porta', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Você agradeceu a visita e não convidou para entrar.', memoria: null }) }
    ]
  },
  /* ------------------------------------------------------------- para quem saiu: a volta oferecida */
  {
    id: 'sub125_retorno', tipo: 'decisao', idade: [18, 85], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 5,
    quando: c => { const e = c.v.caminhos.envolvimento; return !!e && e.parou !== undefined && c.v.t - e.parou >= 24 && !c.v.justica?.prisao && !c.v.justica?.processo && !c.v.momento && rngDe(c.v.id, 'retorno', c.v.t).chance(0.08 + (e.reputacao ?? 0) / 600 + (c.v.trabalho.atual ? 0 : 0.05)); },
    titulo: 'Uma proposta do tempo de antes',
    texto: c => `Alguém do tempo de antes ligou com uma proposta: "${c.v.trabalho.atual ? 'é coisa rápida, você nem precisa largar o emprego' : 'você sabe fazer isso melhor que ninguém'}". ${Math.round((c.v.t - env(c).parou!) / 12)} anos fora — e o telefone ainda tem o número.`,
    opcoes: [
      { id: 'recusar', texto: 'Recusar', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Você disse que não. Doeu menos do que esperava.', memoria: 'Recusou voltar ao que tinha deixado.', efeito: () => { c.v.fatos['recusou_voltar'] = c.v.t; feliz(c, 2); } }) },
      { id: 'ouvir', texto: 'Ouvir, sem prometer nada', resolver: () => ({ texto: 'Você ouviu. A proposta ficou na cabeça uns dias, depois foi embora.', memoria: null }) },
      { id: 'voltar', texto: 'Voltar', comportamento: { impulsividade: 1 },
        consequencia: () => 'A prática e os contatos de antes voltam com você — e a exposição também começa a contar de novo.',
        resolver: c => ({ texto: 'Você voltou. As mãos lembravam; o medo, também.', memoria: 'Voltou ao caminho que tinha deixado.', relevancia: 'marco', tom: 'ruim', efeito: () => { const e = env(c); entrar(c.v, e.categoria, e.contatoId, c.r); pedirRumo(c.v, 'volta'); } }) }
    ]
  },
  /* ------------------------------------------------------------- o legado: quem herdou o nome */
  {
    id: 'sub125_legado', tipo: 'decisao', idade: [18, 50], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 0,
    quando: c => deHoje(c, 'sub125_legado') && !c.v.justica?.prisao,
    titulo: 'Gente que conhecia a sua família',
    texto: c => { const l = c.v.mundoCriminal?.legado; const o = l?.orgs.map(x => orgViva(c.v, x)).find(Boolean); return `${o ? `Gente de ${o.nome}` : 'Gente do tempo de quem veio antes de você'} apareceu. Falaram de ${l?.de ?? 'alguém da família'} com respeito — e de um lugar que, dizem, "sempre foi da família". Não é herança: é um convite. A escolha é sua.`; },
    opcoes: [
      { id: 'recusar', texto: 'Recusar: esse caminho não é o seu', comportamento: { disciplina: 1 }, resolver: c => ({ texto: 'Você agradeceu e recusou. Eles disseram que entendiam. Talvez entendessem.', memoria: 'Recusou o lugar que ofereceram por causa do nome da família.', efeito: () => { c.v.fatos['legado_recusou'] = c.v.t; } }) },
      { id: 'ouvir', texto: 'Ouvir a história', resolver: c => ({ texto: 'Você ouviu histórias que ninguém da família tinha contado. Algumas fizeram sentido; outras, medo.', memoria: 'Ouviu do pessoal antigo o que a família fazia por fora.', efeito: () => { c.v.fatos['legado_ouviu'] = c.v.t; } }) },
      { id: 'aceitar', texto: 'Aceitar o convite', comportamento: { impulsividade: 1 },
        consequencia: () => 'Entrar no caminho, com um nome que abre portas — e que carrega o que a família deixou.',
        resolver: c => ({ texto: 'Você aceitou. O nome abriu a porta; o resto vai ser seu.', memoria: 'Entrou no caminho que a família tinha seguido.', relevancia: 'marco', tom: 'ruim', efeito: () => { const l = c.v.mundoCriminal?.legado; const o = l?.orgs.map(x => orgViva(c.v, x)).find(Boolean); entrar(c.v, o?.ramo === 'organizado' ? 'grupo' : o?.ramo === 'fraudes' ? 'fraude' : 'mercado', undefined, c.r); if (o) { const rel = relacaoCom(c.v, o); rel.relacao = 'aliada'; rel.lealdade = 55; } const e = env(c); e.reputacao = clamp((e.reputacao ?? 0) + Math.round((l?.nome ?? 0) / 2)); garantirCarreira(e); } }) }
    ]
  },
  /* ------------------------------------------------------------- procurado: o abrigo */
  {
    id: 'sub125_abrigo', tipo: 'decisao', idade: [16, 95], tema: 'escolha', prioritario: true, prioridade: 4, repetir: 2,
    quando: c => !!c.v.justica?.foragido && !c.v.justica.prisao && !!abrigoPossivel(c.v) && (c.v.justica.foragido.abrigo === undefined || c.v.t - c.v.justica.foragido.abrigo >= 24) && (c.v.justica.foragido.t === c.v.t || rngDe(c.v.id, 'abrigo', c.v.t).chance(0.4)),
    titulo: 'Um lugar para ficar',
    texto: c => `${cap(abrigoPossivel(c.v)!.org.nome)} mandou dizer que tem onde você ficar, entre gente que não pergunta. Ser procurad${c.g('o', 'a', 'e')} cansa; ficar devendo a eles, também.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar o abrigo', consequencia: () => 'Fica mais difícil achar você. Depois, eles cobram.', resolver: c => ({ texto: executarDefesa(c.v, 'abrigo').texto, memoria: null }) },
      { id: 'mudar', texto: c => `Mudar de endereço por conta própria (uns ${fmt(custoDaMudanca(c.v))})`, disponivel: c => (disponivel(c.v) >= custoDaMudanca(c.v) ? true : 'Não há dinheiro para isso.'), resolver: c => ({ texto: executarDefesa(c.v, 'mudar_endereco').texto, memoria: null }) },
      { id: 'apresentar', texto: 'Apresentar-se à Justiça', comportamento: { coragem: 1 }, disponivel: c => (c.v.justica?.foragido?.motivo === 'fuga' || !c.v.justica?.foragido?.motivo ? 'Quem fugiu da pena se entrega na unidade.' : true), resolver: c => ({ texto: executarDefesa(c.v, 'apresentar_se').texto, memoria: null }) },
      { id: 'seguir', texto: 'Seguir como está', resolver: () => ({ texto: 'Você agradeceu e ficou onde estava. Cada barulho na rua ainda faz você olhar.', memoria: null }) }
    ]
  },
  /* ------------------------------------------------------------- na prisão: a sua organização lá dentro */
  {
    id: 'sub125_pavilhao', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 3,
    quando: c => !!c.v.justica?.prisao && !c.v.justica.prisao.pendente && !!(c.v.caminhos.envolvimento?.organizacoes ?? []).find(o => o.relacao === 'membro' && o.saiu === undefined && o.especialidade === 'organizado') && rngDe(c.v.id, 'pavilhao_org', c.v.t).chance(0.45),
    titulo: 'Gente sua lá dentro',
    texto: c => { const o = (env(c).organizacoes ?? []).find(x => x.relacao === 'membro' && x.saiu === undefined && x.especialidade === 'organizado')!; return `No pavilhão, há gente de ${o.nome}. Eles sabem quem você é: oferecem proteção, um lugar melhor, notícias de fora. Nada é de graça — nem lá dentro.`; },
    opcoes: [
      { id: 'aceitar', texto: 'Ficar com eles', consequencia: () => 'Proteção agora; a disciplina sente, e a organização lembra.',
        resolver: c => ({ texto: 'Ninguém mais encara você no pátio. Em troca, você passou a fazer parte do que acontece ali dentro.', memoria: null, efeito: () => { const p = c.v.justica!.prisao!; p.faccao = 'dentro'; p.disciplina = clamp((p.disciplina ?? 70) - 8); const o = (env(c).organizacoes ?? []).find(x => x.relacao === 'membro' && x.saiu === undefined && x.especialidade === 'organizado'); if (o) lembrarOrg(o, c.v.t, 'favor', 5); } }) },
      { id: 'distancia', texto: 'Manter distância e cumprir a pena', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Você agradeceu e ficou na sua. Eles não gostaram — mas respeitaram.', memoria: null, efeito: () => { const p = c.v.justica!.prisao!; p.faccao = 'recusou'; p.disciplina = clamp((p.disciplina ?? 70) + 4); const o = (env(c).organizacoes ?? []).find(x => x.relacao === 'membro' && x.saiu === undefined && x.especialidade === 'organizado'); if (o) lembrarOrg(o, c.v.t, 'conflito', -4); } }) },
      { id: 'sair', texto: 'Dizer que, quando sair, está fora', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Você disse com calma: quando a pena acabar, acabou tudo. Ninguém respondeu.', memoria: 'Na prisão, avisou à organização que estava fora.', efeito: () => { const o = (env(c).organizacoes ?? []).find(x => x.relacao === 'membro' && x.saiu === undefined && x.especialidade === 'organizado'); if (o) { o.saiu = c.v.t; lembrarOrg(o, c.v.t, 'saida', -8); } if (env(c).parou === undefined) parar(c.v, 'decidiu, na prisão, que estava fora'); abalar(c.v, 'a decisão', 2, 4); } }) }
    ]
  }
] as Conteudo[]).map(comContracao);

/** Para os testes e a contagem de conteúdo. */
export const IDS_DO_125 = ACONTECIMENTOS_125.map(x => x.id);
