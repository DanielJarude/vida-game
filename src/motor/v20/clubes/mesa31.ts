/**
 * VIDA 31 · A MESA DO PRESIDENTE — o clube do dono vivo: a cada temporada, de um a três ASSUNTOS chegam à mesa (a torcida,
 * o técnico, os jogadores), cada um com escolhas. O resultado sai do estado do clube (o nome, a torcida, o humor do
 * técnico, o vestiário, o caixa) e de um acaso próprio (`rngDe`: o sorteio do jogo não muda), e mexe no que existe:
 * o caixa, a torcida, o nome, o CLIMA DO VESTIÁRIO (`moral31`, que entra na força da temporada), o humor do técnico, o
 * salário e a força de um jogador, uma venda, uma contratação.
 *
 * Assunto sem resposta até a temporada seguinte não some sem custo: fica a impressão de que a diretoria não decide.
 */
import { clamp, rngDe, type Rng } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { oClube } from '../../dados/clubes';
import type { Clube20, Jogador20, Setor20 } from '../../dados20/tipos20';
import { perfisDoElenco } from './perfil31';

export interface Situacao31 {
  id: string; tipo: string; ano: number; titulo: string; texto: string;
  /** Com quem é (o jogador do assunto, o reforço sugerido) e os números combinados (o preço, a proposta). */
  jogadorId?: string; alvo?: Jogador20 & { preco: number; clube: string }; valor?: number;
  opcoes: { id: string; texto: string; dica?: string }[];
}

/** O que o motor do clube empresta à mesa (para não haver ciclo: `clubes20` importa a mesa, não o contrário). */
export interface Ferramentas31 {
  mercado: (v: Vida) => (Jogador20 & { preco: number; clube: string })[];
  valor: (j: Jogador20, ano: number) => number;
  media: (c: Clube20) => number;
  comprador: (c: Clube20, r: Rng) => string;
}

const DO = (nome: string) => oClube(nome).replace(/^o /, 'do ').replace(/^a /, 'da ');
const CAP = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SETOR: Record<Setor20, string> = { GOL: 'o gol', DEF: 'a defesa', MEI: 'o meio-campo', ATA: 'o ataque' };
const humor = (c: Clube20) => c.humorTecnico31 ?? 60;
const mexer = (c: Clube20, o: { torcida?: number; reputacao?: number; moral?: number; humor?: number; caixa?: number }) => {
  if (o.torcida) c.torcida = clamp(Math.round(c.torcida + o.torcida));
  if (o.reputacao) c.reputacao = clamp(Math.round(c.reputacao + o.reputacao));
  if (o.moral) c.moral31 = clamp(Math.round(((c.moral31 ?? 0) + o.moral) * 10) / 10, -3, 3);
  if (o.humor && c.tecnico31) c.humorTecnico31 = clamp(Math.round(humor(c) + o.humor));
  if (o.caixa) c.caixa = Math.round(c.caixa + o.caixa);
};
/** A chance de dar certo: o nome do clube, a torcida e um tanto de sorte. */
const deuCerto = (r: Rng, base: number) => r.chance(clamp(base, 0.1, 0.9));

/* ------------------------------------------------------------------ o catálogo */

interface Modelo31 {
  tipo: string;
  cabe: (v: Vida, c: Clube20, f: Ferramentas31) => boolean;
  peso: (v: Vida, c: Clube20) => number;
  montar: (v: Vida, c: Clube20, r: Rng, f: Ferramentas31) => Omit<Situacao31, 'id' | 'tipo' | 'ano'> | undefined;
  resolver: (v: Vida, c: Clube20, s: Situacao31, opcao: string, r: Rng, f: Ferramentas31) => string;
  /** Sem resposta até a temporada seguinte. */
  ignorar: (c: Clube20) => string;
}

const ult = (c: Clube20) => c.historico[c.historico.length - 1];
const craque = (c: Clube20) => [...c.elenco].sort((a, b) => b.forca - a.forca)[0];

const MODELOS: Modelo31[] = [
  {
    tipo: 'boas_vindas', cabe: (v, c) => anoDe(c.desde) === anoDe(v.t) && !c.historico.length, peso: () => 100,
    montar: (_v, c) => ({ titulo: 'A torcida quer ouvir o novo dono', texto: `A imprensa e as organizadas ${DO(c.nome)} esperam a sua primeira entrevista. O que você promete define o humor da arquibancada — e a cobrança no fim do ano.`,
      opcoes: [{ id: 'titulo', texto: 'Prometer briga pelo título', dica: 'A torcida vibra; não cumprir pesa no nome.' }, { id: 'projeto', texto: 'Falar em projeto, com pé no chão', dica: 'Menos festa, menos cobrança.' }, { id: 'base', texto: 'Prometer investir na base', dica: 'Agrada quem pensa no longo prazo.' }] }),
    resolver: (_v, c, _s, o) => {
      if (o === 'titulo') { c.objetivo = 'titulo'; mexer(c, { torcida: 5 }); return 'A torcida saiu da entrevista cantando. O objetivo da temporada é o título — e ela vai cobrar.'; }
      if (o === 'base') { c.investimentoBase = 2; mexer(c, { torcida: 2, reputacao: 1 }); return 'A base passa a receber investimento forte: os olheiros comemoraram.'; }
      mexer(c, { torcida: 1, reputacao: 1 }); return 'A entrevista foi sóbria. Ninguém se empolgou, ninguém reclamou.';
    },
    ignorar: c => { mexer(c, { torcida: -2 }); return 'O novo dono não falou com a torcida: a arquibancada estranhou o silêncio.'; }
  },
  {
    tipo: 'torcida_protesto', cabe: (_v, c) => { const h = ult(c); return !!h && (!!h.queda || (h.posicao ?? 0) >= 14 || c.torcida < 40); }, peso: (_v, c) => (ult(c)?.queda ? 4 : 2),
    montar: (_v, c) => ({ titulo: 'Protesto no portão do CT', texto: `Faixas, rojões e cobrança: a organizada ${DO(c.nome)} quer respostas depois da temporada${ult(c)?.queda ? ' do rebaixamento' : ' ruim'}.`,
      opcoes: [{ id: 'receber', texto: 'Receber os líderes da organizada', dica: 'Pode acalmar — ou virar foto de diretoria acuada.' }, { id: 'ingresso', texto: 'Baixar o ingresso no próximo jogo', dica: 'Custa bilheteria; a arquibancada enche.' }, { id: 'nota', texto: 'Soltar uma nota oficial', dica: 'Seguro e frio.' }] }),
    resolver: (_v, c, _s, o, r) => {
      if (o === 'receber') { if (deuCerto(r, 0.35 + c.reputacao / 200)) { mexer(c, { torcida: 5, reputacao: 2 }); return 'A conversa foi dura, mas franca: a organizada suspendeu os protestos.'; } mexer(c, { torcida: -2, reputacao: -2 }); return 'A reunião vazou, editada: a diretoria pareceu refém.'; }
      if (o === 'ingresso') { const custo = Math.round((ult(c)?.receita ?? 0) * 0.01 / 1e4) * 1e4; mexer(c, { torcida: 6, caixa: -custo, moral: 0.3 }); return `Estádio lotado com ingresso popular (${fmt(custo)} a menos na bilheteria): o time sentiu o apoio.`; }
      mexer(c, { torcida: -1 }); return 'A nota oficial saiu. A torcida leu e continuou desconfiada.';
    },
    ignorar: c => { mexer(c, { torcida: -3, reputacao: -1 }); return 'O protesto ficou sem resposta da diretoria — e cresceu.'; }
  },
  {
    tipo: 'torcida_festa', cabe: (_v, c) => { const h = ult(c); return !!h && (!!h.titulo || !!h.acesso || (h.posicao ?? 99) <= 4); }, peso: (_v, c) => (ult(c)?.titulo ? 5 : 2),
    montar: (_v, c) => ({ titulo: 'A cidade quer festa', texto: `${CAP(oClube(c.nome))} ${ult(c)?.titulo ? 'foi campeão' : ult(c)?.acesso ? 'subiu de divisão' : 'fez uma grande temporada'}, e a torcida pede carreata, camisa comemorativa e homenagem.`,
      opcoes: [{ id: 'carreata', texto: 'Bancar a carreata e a festa', dica: 'Custa caro; o elenco e a torcida não esquecem.' }, { id: 'camisa', texto: 'Lançar uma camisa comemorativa', dica: 'Vende bem.' }, { id: 'discreto', texto: 'Comemorar só com o elenco', dica: 'Barato e íntimo.' }] }),
    resolver: (_v, c, _s, o) => {
      const rec = ult(c)?.receita ?? 0;
      if (o === 'carreata') { const custo = Math.round(rec * 0.012 / 1e4) * 1e4; mexer(c, { torcida: 6, moral: 0.6, caixa: -custo }); return `A carreata parou a cidade (${fmt(custo)} de festa). Ninguém esquece um dia assim.`; }
      if (o === 'camisa') { const ganho = Math.round(rec * 0.025 / 1e4) * 1e4; mexer(c, { torcida: 2, caixa: ganho }); return `A camisa comemorativa esgotou na primeira semana: ${fmt(ganho)} no caixa.`; }
      mexer(c, { moral: 0.4 }); return 'Um churrasco no CT com o elenco e os funcionários. O vestiário gostou.';
    },
    ignorar: c => { mexer(c, { torcida: -1 }); return 'A diretoria nem comentou a campanha. A torcida festejou sozinha.'; }
  },
  {
    tipo: 'tecnico_sugere', cabe: (v, c, f) => !!sugestao(v, c, f), peso: (_v, c) => (c.tecnico31 ? 3 : 1.5),
    montar: (v, c, _r, f) => {
      const s = sugestao(v, c, f)!;
      const quem = c.tecnico31 ? `O técnico ${c.tecnico31.nome}` : 'A comissão técnica interina';
      return { titulo: `${quem.split(' ').slice(0, 2).join(' ')} pede um reforço`, texto: `${quem} viu ${SETOR[s.alvo.pos]} como o ponto fraco do time e indica ${s.alvo.nome} (${s.alvo.forca} de força, ${anoDe(v.t) - anoDe(s.alvo.tNasc)} anos), que está no ${s.alvo.clube}. O clube dele pede ${fmt(s.alvo.preco)}.`,
        alvo: s.alvo, valor: s.alvo.preco,
        opcoes: [{ id: 'contratar', texto: `Contratar por ${fmt(s.alvo.preco)}`, dica: 'Sai do caixa do clube.' }, { id: 'negociar', texto: 'Negociar um preço menor', dica: 'Pode sair mais barato — ou o jogador ir para outro clube.' }, { id: 'recusar', texto: 'Recusar: o elenco é esse', dica: c.tecnico31 ? 'O técnico não vai gostar.' : 'A comissão anota.' }] };
    },
    resolver: (v, c, s, o, r) => {
      const a = s.alvo!;
      const contratar = (preco: number) => {
        if (c.caixa < preco) return false;
        c.caixa -= preco; c.comprados.push(a.id);
        const { preco: _p, clube: _c, ...j } = a; void _p; void _c;
        c.elenco.push(j); (c.chegada31 ??= {})[j.id] = anoDe(v.t);
        return true;
      };
      if (o === 'contratar') { if (contratar(a.preco)) { mexer(c, { humor: 12, moral: 0.2 }); return `${a.nome} chegou: o técnico ganhou a peça que pediu.`; } mexer(c, { humor: -4 }); return 'Não havia caixa para a contratação: o reforço ficou para depois.'; }
      if (o === 'negociar') {
        if (deuCerto(r, 0.4 + c.reputacao / 250)) { const preco = Math.round(a.preco * 0.82 / 1e4) * 1e4; if (contratar(preco)) { mexer(c, { humor: 10 }); return `Negociação boa: ${a.nome} veio por ${fmt(preco)}.`; } }
        c.comprados.push(a.id); mexer(c, { humor: -3 }); return `Enquanto a diretoria negociava, ${a.nome} acertou com outro clube.`;
      }
      c.comprados.push(a.id); mexer(c, { humor: -8 }); return c.tecnico31 ? `${c.tecnico31.nome} engoliu a recusa — mas comentou com a imprensa que "o elenco é curto".` : 'A comissão anotou a recusa.';
    },
    ignorar: c => { mexer(c, { humor: -5 }); return 'O pedido de reforço ficou sem resposta: o técnico se sentiu ignorado.'; }
  },
  {
    tipo: 'tecnico_atrito', cabe: (_v, c) => !!c.tecnico31 && humor(c) < 40, peso: () => 4,
    montar: (_v, c) => ({ titulo: 'O técnico reclama em público', texto: `${c.tecnico31!.nome} disse na coletiva que "falta apoio da diretoria". A imprensa quer saber se ele fica.`,
      opcoes: [{ id: 'apoiar', texto: 'Bancar o técnico publicamente', dica: 'Recupera a relação; você fica associado ao trabalho dele.' }, { id: 'conversar', texto: 'Chamar para uma conversa franca', dica: 'Pode reaproximar — ou azedar de vez.' }, { id: 'demitir', texto: 'Demitir o técnico', dica: 'Paga a multa; a comissão interina assume.' }] }),
    resolver: (_v, c, _s, o, r) => {
      const t = c.tecnico31; if (!t) return 'O técnico já não estava mais no clube.';
      if (o === 'apoiar') { mexer(c, { humor: 20, moral: 0.2 }); return `"O ${t.nome.split(' ')[0]} fica": o recado acalmou o vestiário.`; }
      if (o === 'conversar') { if (deuCerto(r, 0.55)) { mexer(c, { humor: 15 }); return 'A conversa foi longa e honesta: saíram alinhados.'; } mexer(c, { humor: -10, moral: -0.3 }); return 'A conversa azedou. O clima no CT pesou.'; }
      const multa = Math.round(t.salario * 0.5); c.caixa -= multa; c.tecnico31 = undefined; c.humorTecnico31 = undefined;
      return `${t.nome} foi demitido (multa de ${fmt(multa)}). A comissão interina assume.`;
    },
    ignorar: c => { mexer(c, { humor: -8, moral: -0.3 }); return 'A crise com o técnico ficou no ar, e o vestiário sentiu.'; }
  },
  {
    tipo: 'jogador_aumento', cabe: (v, c) => { const j = craque(c); return !!j && j.contratoAte >= anoDe(v.t); }, peso: () => 2,
    montar: (_v, c) => { const j = craque(c); return { titulo: `${j.nome.split(' ')[0]} pede aumento`, texto: `${j.nome}, o melhor jogador do elenco (${j.forca} de força), quer ganhar como a referência que é. O empresário fala em "valorização" — e em sondagens de fora.`, jogadorId: j.id,
      opcoes: [{ id: 'aceitar', texto: 'Dar o aumento (30%)', dica: 'Pesa na folha; o craque fica feliz.' }, { id: 'recusar', texto: 'Segurar o salário', dica: 'Pode passar — ou ele pode baixar o rendimento.' }, { id: 'vender', texto: 'Ouvir propostas e vender', dica: 'Caixa no bolso, time mais fraco.' }] }; },
    resolver: (v, c, s, o, r, f) => {
      const j = c.elenco.find(x => x.id === s.jogadorId); if (!j) return 'O jogador já não estava no elenco.';
      if (o === 'aceitar') { j.salario = Math.round(j.salario * 1.3 / 1000) * 1000; j.contratoAte = Math.max(j.contratoAte, anoDe(v.t) + 2); mexer(c, { moral: 0.4 }); return `${j.nome} renovou com aumento até ${j.contratoAte}: "aqui é a minha casa".`; }
      if (o === 'recusar') { if (deuCerto(r, 0.5)) return `${j.nome} entendeu: seguiu sendo o melhor do time.`; j.forca = Math.max(30, j.forca - 2); mexer(c, { moral: -0.4 }); return `${j.nome} ficou contrariado e caiu de rendimento.`; }
      const valor = Math.round(f.valor(j, anoDe(v.t)) * 1.1 / 1e4) * 1e4; const para = f.comprador(c, r);
      c.elenco.splice(c.elenco.indexOf(j), 1); c.caixa += valor; c.vendas.unshift({ nome: j.nome, para, valor, ano: anoDe(v.t) }); if (c.vendas.length > 20) c.vendas.length = 20;
      mexer(c, { torcida: -2 }); if (c.capitao31 === j.id) c.capitao31 = undefined;
      return `${j.nome} foi vendido para ${para.startsWith('um ') ? para : oClube(para)} por ${fmt(valor)}.`;
    },
    ignorar: c => { mexer(c, { moral: -0.3 }); return 'O pedido de aumento ficou sem resposta, e o craque se sentiu desvalorizado.'; }
  },
  {
    tipo: 'jogador_indisciplina', cabe: (v, c) => !!indisciplinado(v, c), peso: () => 2,
    montar: (v, c) => { const j = indisciplinado(v, c)!; return { titulo: `${j.nome.split(' ')[0]} aprontou`, texto: `${j.nome} chegou atrasado ao treino depois de uma noitada que foi parar nas redes. O elenco olha para a diretoria.`, jogadorId: j.id,
      opcoes: [{ id: 'multar', texto: 'Multar e seguir', dica: 'O regulamento existe para isso.' }, { id: 'afastar', texto: 'Afastar por duas semanas', dica: 'Recado firme; ele perde ritmo.' }, { id: 'perdoar', texto: 'Deixar passar', dica: 'Ele agradece; o grupo repara.' }] }; },
    resolver: (_v, c, s, o, r) => {
      const j = c.elenco.find(x => x.id === s.jogadorId); if (!j) return 'O jogador já não estava no elenco.';
      if (o === 'multar') { const multa = Math.round(j.salario * 0.05 / 1000) * 1000; mexer(c, { caixa: multa, moral: deuCerto(r, 0.6) ? 0.3 : -0.2 }); return `${j.nome} pagou ${fmt(multa)} de multa.`; }
      if (o === 'afastar') { j.forca = Math.max(30, j.forca - 2); mexer(c, { moral: 0.5 }); return `${j.nome} treinou separado por duas semanas. O grupo entendeu o recado.`; }
      mexer(c, { moral: -0.5 }); return `Ninguém foi punido. ${j.nome} agradeceu; alguns veteranos, não.`;
    },
    ignorar: c => { mexer(c, { moral: -0.4 }); return 'A indisciplina passou batida — e virou exemplo para os outros.'; }
  },
  {
    tipo: 'proposta_exterior', cabe: (v, c) => !!revelacao(v, c), peso: () => 2.5,
    montar: (v, c, r, f) => { const j = revelacao(v, c)!; const valor = Math.round(f.valor(j, anoDe(v.t)) * (1.35 + r.next() * 0.3) / 1e5) * 1e5; return { titulo: 'Proposta da Europa', texto: `Um clube europeu oferece ${fmt(valor)} por ${j.nome}, ${anoDe(v.t) - anoDe(j.tNasc)} anos (${j.forca} de força, potencial ${j.potencial}).`, jogadorId: j.id, valor,
      opcoes: [{ id: 'vender', texto: `Vender por ${fmt(valor)}`, dica: 'Dinheiro garantido; a torcida lamenta.' }, { id: 'segurar', texto: 'Recusar e renovar com aumento', dica: 'Ele fica; a folha cresce.' }, { id: 'pedir_mais', texto: 'Pedir mais', dica: 'Pode render muito — ou o interesse esfriar.' }] }; },
    resolver: (v, c, s, o, r) => {
      const j = c.elenco.find(x => x.id === s.jogadorId); if (!j) return 'O jogador já não estava no elenco.';
      const vender = (valor: number) => { c.elenco.splice(c.elenco.indexOf(j), 1); c.caixa += valor; c.vendas.unshift({ nome: j.nome, para: 'um clube da Europa', valor, ano: anoDe(v.t) }); if (c.vendas.length > 20) c.vendas.length = 20; if (c.capitao31 === j.id) c.capitao31 = undefined; };
      if (o === 'vender') { vender(s.valor!); mexer(c, { torcida: -2 }); return `${j.nome} foi para a Europa por ${fmt(s.valor!)}.`; }
      if (o === 'segurar') { j.salario = Math.round(j.salario * 1.35 / 1000) * 1000; j.contratoAte = anoDe(v.t) + 3; mexer(c, { torcida: 3, moral: 0.3 }); return `${j.nome} fica: renovou até ${j.contratoAte}. A torcida aplaudiu.`; }
      if (deuCerto(r, 0.45)) { const mais = Math.round(s.valor! * 1.25 / 1e5) * 1e5; vender(mais); mexer(c, { torcida: -1 }); return `Os europeus subiram para ${fmt(mais)}, e ${j.nome} foi vendido.`; }
      mexer(c, { moral: -0.2 }); return `O interesse esfriou: ${j.nome} fica — meio frustrado.`;
    },
    ignorar: c => { mexer(c, { moral: -0.2 }); return 'A proposta da Europa ficou sem resposta e caducou.'; }
  },
  {
    tipo: 'bicho', cabe: (_v, c) => c.historico.length > 0 && c.elenco.length > 0, peso: () => 1.5,
    montar: () => ({ titulo: 'O bicho do clássico', texto: `Vem aí o clássico da temporada. O capitão pergunta se haverá bicho (prêmio) pela vitória.`,
      opcoes: [{ id: 'pagar', texto: 'Prometer um bicho dobrado', dica: 'Custa; motiva.' }, { id: 'normal', texto: 'O bicho de sempre', dica: 'Sem surpresa.' }, { id: 'nada', texto: 'Clássico se joga por amor', dica: 'Economiza; o grupo pode não gostar.' }] }),
    resolver: (_v, c, _s, o, r) => {
      const folha = c.elenco.reduce((s, j) => s + j.salario, 0);
      if (o === 'pagar') { const custo = Math.round(folha * 0.03 / 1e4) * 1e4; mexer(c, { caixa: -custo, moral: 0.6 }); return deuCerto(r, 0.6) ? `Vitória no clássico, com o bicho dobrado pago (${fmt(custo)}). O vestiário vibrou.` : `O bicho dobrado não bastou: empate no clássico. Mas o grupo fechou com a diretoria.`; }
      if (o === 'normal') { mexer(c, { moral: 0.1 }); return 'O bicho de sempre. O clássico foi equilibrado.'; }
      mexer(c, { moral: -0.4 }); return 'Sem bicho: o elenco entrou mordido — com a diretoria.';
    },
    ignorar: () => 'O clássico passou sem conversa sobre o bicho.'
  }
];

/** O reforço que o técnico indicaria: o melhor do mercado no setor mais fraco do time, MELHOR do que o titular de lá. */
function sugestao(v: Vida, c: Clube20, f: Ferramentas31): { alvo: Jogador20 & { preco: number; clube: string } } | undefined {
  const melhor = (p: Setor20) => Math.max(0, ...c.elenco.filter(j => j.pos === p).map(j => j.forca));
  const fraco = (['GOL', 'DEF', 'MEI', 'ATA'] as Setor20[]).sort((a, b) => melhor(a) - melhor(b))[0];
  const alvo = f.mercado(v).filter(j => j.pos === fraco && j.forca > melhor(fraco)).sort((a, b) => b.forca - a.forca)[0];
  return alvo ? { alvo } : undefined;
}
function indisciplinado(v: Vida, c: Clube20): Jogador20 | undefined {
  const ano = anoDe(v.t);
  const perfis = perfisDoElenco(c, ano, 60);
  return c.elenco.find(j => perfis.get(j.id)?.perfil.principal === 'marrento' || perfis.get(j.id)?.perfil.secundarios.includes('marrento'))
    ?? (c.elenco.length >= 20 ? [...c.elenco].filter(j => ano - anoDe(j.tNasc) <= 25).sort((a, b) => a.id.localeCompare(b.id))[0] : undefined);
}
function revelacao(v: Vida, c: Clube20): Jogador20 | undefined {
  const ano = anoDe(v.t);
  return [...c.elenco].filter(j => ano - anoDe(j.tNasc) <= 23 && (j.potencial >= 80 || j.forca >= 72)).sort((a, b) => b.potencial - a.potencial)[0];
}

/* ------------------------------------------------------------------ o ciclo */

/** Os assuntos novos da temporada (até `n`, sem repetir o mesmo tema por dois anos). Os sem resposta custam algo. */
export function abrirMesa31(v: Vida, c: Clube20, f: Ferramentas31, n = 2): void {
  const ano = anoDe(v.t);
  for (const s of c.mesa31 ?? []) {
    const m = MODELOS.find(x => x.tipo === s.tipo);
    if (!m) continue;
    const texto = m.ignorar(c);
    (c.mesaHist31 ??= []).unshift({ ano: s.ano, tipo: s.tipo, titulo: s.titulo, texto, ignorado: true });
  }
  c.mesa31 = [];
  const r = rngDe(v.id, 'clube20_mesa', c.nome, ano);
  const recentes = new Set((c.mesaHist31 ?? []).filter(h => ano - h.ano <= 1).map(h => h.tipo));
  const candidatos = MODELOS.filter(m => !recentes.has(m.tipo) && m.cabe(v, c, f));
  for (let k = 0; k < n && candidatos.length; k++) {
    const total = candidatos.reduce((s, m) => s + m.peso(v, c), 0);
    let u = r.next() * total, i = 0;
    for (; i < candidatos.length - 1; i++) { u -= candidatos[i].peso(v, c); if (u <= 0) break; }
    const m = candidatos.splice(i, 1)[0];
    const corpo = m.montar(v, c, r, f);
    if (!corpo) continue;
    c.mesa31.push({ id: `${m.tipo}_${ano}_${k}`, tipo: m.tipo, ano, ...corpo });
  }
  if ((c.mesaHist31?.length ?? 0) > 30) c.mesaHist31!.length = 30;
}

/** Responder a um assunto da mesa: o desfecho mexe no clube e entra na história. */
export function responderMesa31(v: Vida, c: Clube20, id: string, opcao: string, f: Ferramentas31): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const s = (c.mesa31 ?? []).find(x => x.id === id)!;
  const m = MODELOS.find(x => x.tipo === s.tipo)!;
  const antes = { torcida: c.torcida, moral: c.moral31 ?? 0, caixa: c.caixa };
  const texto = m.resolver(v, c, s, opcao, rngDe(v.id, 'clube20_resposta', s.id, opcao), f);
  c.mesa31 = (c.mesa31 ?? []).filter(x => x.id !== id);
  (c.mesaHist31 ??= []).unshift({ ano: s.ano, tipo: s.tipo, titulo: s.titulo, texto, opcao: s.opcoes.find(o => o.id === opcao)?.texto });
  if (c.mesaHist31.length > 30) c.mesaHist31.length = 30;
  escrever(v, { texto: `${CAP(oClube(c.nome))} · ${s.titulo}: ${texto}`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
  const saldo = (c.torcida - antes.torcida) + ((c.moral31 ?? 0) - antes.moral) * 5;
  return { texto, tom: saldo > 0 ? 'bom' : saldo < 0 ? 'ruim' : 'neutro' };
}

export const opcaoValida31 = (c: Clube20, id: string, opcao: string) => !!(c.mesa31 ?? []).find(x => x.id === id)?.opcoes.some(o => o.id === opcao);
