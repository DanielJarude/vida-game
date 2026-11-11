/**
 * VIDA 16 · CARREIRAS RELIGIOSAS — a vocação como caminho com identidade (o catálogo: `dados16/religiao/tradicoes16`).
 *
 * Não é uma lista de cargos com salário. O que a carreira guarda (`Vida.religiao16`):
 *
 *   a FORMAÇÃO     o seminário, a yeshivá, os fundamentos aprendidos com a mãe de santo, as obras básicas;
 *   o PRESTÍGIO    o reconhecimento dentro da tradição (os superiores, os mais velhos, a assembleia, a congregação);
 *   a COMUNIDADE   quantas pessoas estão sob o seu cuidado (quando a etapa guia alguém);
 *   a COESÃO       o quanto a comunidade está unida (cai com o descaso, as disputas, as decisões que dividem);
 *   a INFLUÊNCIA   o peso fora dos muros: a cidade, a imprensa, o poder público;
 *   o CAIXA        os recursos da instituição (dízimo, doações, a contribuição dos filhos de santo) — não são seus.
 *
 * O ano tem três gestos (formar, servir, acolher, nas palavras de cada tradição), um projeto comunitário quando se
 * lidera, e às vezes uma QUESTÃO (uma disputa de liderança, um pedido político, uma doação suspeita, uma denúncia, a
 * intolerância contra o terreiro, a crise de vocação, o celibato posto à prova, a sucessão da casa). Subir de etapa
 * depende do caminho: o tempo e a formação, a obrigação (com o custo dela), a nomeação, a eleição, abrir a casa ou
 * herdá-la, o conclave. Sorteios derivados (`rngDe`): quem não segue a vocação não tem o acaso mexido.
 */
import type { Rng } from '../../rng';
import { clamp, rngDe } from '../../rng';
import type { Vida } from '../../tipos';
import { escrever, idade, parceiro, saindoCom } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { vereditoDePagar } from '../../sistemas/dinheiro';
import { marcar } from '../../sistemas/marcas';
import { praticar } from '../../sistemas/frentes';
import { anoDe } from '../../tempo';
import { crencaDe } from '../../v14/crencas/crencas';
import { TRADICOES16, caminhosDaCrenca16, type Etapa16, type Tradicao16 } from '../../dados16/religiao/tradicoes16';

export type GestoRel16 = 'formar' | 'servir' | 'acolher';

export interface Questao16 { id: string; tipo: string; titulo: string; texto: string; opcoes: { id: string; rotulo: string }[]; t: number }

export interface Religiao16 {
  tradicao: Tradicao16;
  etapa: number;
  tEtapa: number;
  tInicio: number;
  formacao: number;
  prestigio: number;
  coesao: number;
  influencia: number;
  comunidade: number;
  caixa: number;
  /** O ano dos gestos (e os gestos já feitos nele). */
  ano: number;
  gestos: GestoRel16[];
  projeto?: { id: string; t: number };
  projetosFeitos?: { id: string; t: number; bom: boolean }[];
  questao?: Questao16;
  /** A casa (o terreiro, a igreja) é sua: aberta por você. */
  casaPropria?: boolean;
  historico: { t: number; texto: string }[];
  /** Deixou o caminho (quando, e por quê). */
  saiu?: { t: number; motivo: string };
}

/* ------------------------------------------------------------------ Leitura */

const G = (v: Vida) => (v.eu.genero === 'feminino' ? 1 : 0);
export const etapaAtual16 = (r: Religiao16): Etapa16 => TRADICOES16[r.tradicao].etapas[r.etapa];
export const proximaEtapa16 = (r: Religiao16): Etapa16 | undefined => TRADICOES16[r.tradicao].etapas[r.etapa + 1];
export const nomeDaEtapa16 = (v: Vida, e: Etapa16) => e.nome[G(v)];
export const ativa16 = (v: Vida) => !!v.religiao16 && !v.religiao16.saiu;

/** Os caminhos possíveis para a crença de agora, com o porquê de cada um não dar (quando não dá). */
export function caminhosPossiveis16(v: Vida): { t: Tradicao16; veredito: Veredito }[] {
  return caminhosDaCrenca16(crencaDe(v).atual).map(t => ({ t, veredito: disponibilidadeReligiao16(v, { op: 'entrar', tradicao: t }) }));
}

/** O que falta para a próxima etapa, em palavras (vazio: nada falta além do que não depende de você). */
export function oQueFalta16(v: Vida, r: Religiao16): string[] {
  const e = proximaEtapa16(r);
  if (!e) return [];
  const out: string[] = [];
  const anos = (v.t - r.tEtapa) / 12;
  if (anos < e.anos) out.push(`${Math.ceil(e.anos - anos)} ${Math.ceil(e.anos - anos) === 1 ? 'ano' : 'anos'} na etapa de agora`);
  if (e.formacao && r.formacao < e.formacao) out.push('mais formação');
  if (e.prestigio && r.prestigio < e.prestigio) out.push('mais reconhecimento');
  if (e.idadeMin && idade(v) < e.idadeMin) out.push(`ter ${e.idadeMin} anos`);
  return out;
}

const COMO: Record<string, string> = {
  tempo: 'Quando estiver pronto, é um passo seu.', obrigacao: 'A obrigação se faz quando o tempo de santo e a casa permitem — e tem custo.',
  nomeacao: 'Não se pede: vem por nomeação, quando o reconhecimento chega.', eleicao: 'Vem por eleição: a comunidade escolhe.',
  casa: 'Abrir a própria casa, ou receber uma casa na sucessão.', conclave: 'Só o conclave elege — e quase nunca quem espera.'
};
export const comoSeChega16 = (e: Etapa16) => COMO[e.como];

/* ------------------------------------------------------------------ Ações */

export type OqueReligiao16 =
  | { op: 'entrar'; tradicao: Tradicao16 }
  | { op: 'gesto'; g: GestoRel16 }
  | { op: 'avancar' }
  | { op: 'abrir_casa' }
  | { op: 'projeto'; id: string }
  | { op: 'questao'; escolha: string }
  | { op: 'sair' };

const custoDaObrigacao = (t: Tradicao16, e: Etapa16) => (e.como !== 'obrigacao' ? 0 : t === 'candomble' ? (e.id === 'iao' ? 7000 : 9000) : t === 'candomble_cargo' ? 4000 : t === 'umbanda' ? 1500 : 0);
const custoDaCasa = (t: Tradicao16) => (t === 'candomble' ? 30000 : 15000);
export const custos16 = { obrigacao: custoDaObrigacao, casa: custoDaCasa };

export function disponibilidadeReligiao16(v: Vida, q: OqueReligiao16): Veredito {
  const i = idade(v);
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não daqui.');
  const r = v.religiao16;
  if (q.op === 'entrar') {
    const T = TRADICOES16[q.tradicao];
    if (!T) return bloqueio('impossivel', 'Esse caminho não existe aqui.');
    if (r && !r.saiu) return bloqueio('incompativel', 'Você já segue um caminho religioso.');
    if (!T.crencas.includes(crencaDe(v).atual)) return bloqueio('requisito', `Esse caminho é de quem pertence à tradição (${T.nome.toLowerCase()}).`);
    if (i < T.idadeMin) return bloqueio('requisito', `A partir dos ${T.idadeMin} anos.`);
    if (T.genero && v.eu.genero !== T.genero) return bloqueio('impossivel', T.nota ?? 'Nesta tradição, este caminho é de outro gênero.');
    const par = parceiro(v);
    if (T.celibato && (par || saindoCom(v).length)) return bloqueio('incompativel', `Este caminho pede o celibato: com ${par?.p.nome ?? saindoCom(v)[0].p.nome} na sua vida, não dá para começar.`);
    if (T.casado && par?.vin.romance?.estagio !== 'casamento') return bloqueio('requisito', 'O diaconato permanente é para homens casados.');
    if (r?.saiu && v.t - r.saiu.t < 24) return bloqueio('incompativel', 'Faz pouco tempo que você deixou o caminho.');
    return PERMITIDO;
  }
  if (!r || r.saiu) return bloqueio('impossivel', 'Você não segue um caminho religioso.');
  const T = TRADICOES16[r.tradicao];
  const e = etapaAtual16(r);
  switch (q.op) {
    case 'gesto':
      if (r.ano === anoDe(v.t) && r.gestos.includes(q.g)) return bloqueio('incompativel', 'Este ano, já foi.');
      return PERMITIDO;
    case 'avancar': {
      const n = proximaEtapa16(r);
      if (!n) return bloqueio('impossivel', 'Não há etapa além desta.');
      if (n.como !== 'tempo' && n.como !== 'obrigacao') return bloqueio('requisito', comoSeChega16(n));
      const falta = oQueFalta16(v, r);
      if (falta.length) return bloqueio('requisito', `Falta: ${falta.join(', ')}.`);
      if (T.celibato && parceiro(v)) return bloqueio('incompativel', 'Com uma parceria, este passo não se dá.');
      const c = custoDaObrigacao(r.tradicao, n);
      return c ? vereditoDePagar(v, c, 'A obrigação custa uns') : PERMITIDO;
    }
    case 'abrir_casa': {
      const n = proximaEtapa16(r);
      if (!n || n.como !== 'casa') return bloqueio('impossivel', 'Não é o momento de abrir casa.');
      const falta = oQueFalta16(v, r);
      if (falta.length) return bloqueio('requisito', `Falta: ${falta.join(', ')}.`);
      return vereditoDePagar(v, custoDaCasa(r.tradicao), 'Abrir a casa custa uns');
    }
    case 'projeto': {
      if (!e.lidera) return bloqueio('requisito', 'Projetos são de quem conduz uma comunidade.');
      if (r.projeto) return bloqueio('incompativel', 'Já há um projeto em andamento.');
      const p = T.projetos.find(x => x.id === q.id);
      if (!p) return bloqueio('impossivel', 'Esse projeto não existe aqui.');
      if (r.caixa < p.custo * 0.5) return bloqueio('requisito', `O caixa da comunidade não chega à metade do que o projeto pede (${p.custo.toLocaleString('pt-BR')}).`);
      return PERMITIDO;
    }
    case 'questao': return r.questao?.opcoes.some(x => x.id === q.escolha) ? PERMITIDO : bloqueio('impossivel', 'Não há nada a decidir.');
    case 'sair': return PERMITIDO;
  }
}

export interface SaidaReligiao16 { texto: string; tom: 'bom' | 'ruim' | 'neutro' }

const registrar = (v: Vida, r: Religiao16, texto: string, biografia = true) => {
  r.historico.push({ t: v.t, texto });
  if (r.historico.length > 40) r.historico.splice(0, r.historico.length - 40);
  if (biografia) escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true });
};

function subir(v: Vida, r: Religiao16, texto?: string): string {
  r.etapa++;
  r.tEtapa = v.t;
  const e = etapaAtual16(r);
  if (e.comunidade > r.comunidade) r.comunidade = e.comunidade;
  const t = texto ?? `Tornou-se ${nomeDaEtapa16(v, e).toLowerCase()}.`;
  registrar(v, r, t);
  marcar(v, e.lidera ? 'lideranca' : 'promocao', t, e.lidera ? 3 : 2);
  return t;
}

export function executarReligiao16(v: Vida, rr: Rng, q: OqueReligiao16): SaidaReligiao16 {
  if (q.op === 'entrar') {
    const T = TRADICOES16[q.tradicao];
    v.religiao16 = { tradicao: q.tradicao, etapa: 0, tEtapa: v.t, tInicio: v.t, formacao: 5, prestigio: 10, coesao: 60, influencia: 0, comunidade: 0, caixa: 0, ano: anoDe(v.t), gestos: [], historico: [] };
    const t = `Começou o caminho: ${T.nome.toLowerCase()} — ${nomeDaEtapa16(v, T.etapas[0]).toLowerCase()}.`;
    registrar(v, v.religiao16, t);
    marcar(v, 'comecou', t, 2);
    return { texto: t, tom: 'bom' };
  }
  const r = v.religiao16!;
  const T = TRADICOES16[r.tradicao];
  if (r.ano !== anoDe(v.t)) { r.ano = anoDe(v.t); r.gestos = []; }
  switch (q.op) {
    case 'gesto': {
      r.gestos.push(q.g);
      const e = etapaAtual16(r);
      v.mente.estresse = clamp(v.mente.estresse + 2);
      if (q.g === 'formar') {
        r.formacao = clamp(r.formacao + rr.int(7, 12));
        praticar(v, rr, 'humanas', 0.8);
        return { texto: `${T.verbos.formar}: um ano de estudo que se vê no jeito de falar.`, tom: 'neutro' };
      }
      if (q.g === 'servir') {
        // O reconhecimento rende menos lá em cima (o topo é de poucos).
        r.prestigio = clamp(r.prestigio + Math.round(rr.int(4, 8) * (1 - r.prestigio / 130)));
        r.coesao = clamp(r.coesao + 3);
        if (e.lidera) r.comunidade = Math.round(r.comunidade * (1 + rr.int(2, 8) / 100));
        praticar(v, rr, 'lideranca', 0.6);
        return { texto: `${T.verbos.servir}: ${e.lidera ? `${T.lugar} cheia${r.comunidade > 50 ? ', gente de pé no fundo' : ''}` : 'quem está acima reparou'}.`, tom: 'bom' };
      }
      r.coesao = clamp(r.coesao + 6);
      r.prestigio = clamp(r.prestigio + 2);
      v.mente.felicidade = clamp(v.mente.felicidade + 2);
      praticar(v, rr, 'comunidade', 0.8);
      return { texto: `${T.verbos.acolher}: as pessoas voltam, e trazem outras.`, tom: 'bom' };
    }
    case 'avancar': {
      const n = proximaEtapa16(r)!;
      const c = custoDaObrigacao(r.tradicao, n);
      if (c) v.financas.conta -= c;
      const t = n.como === 'obrigacao'
        ? (r.tradicao === 'candomble' || r.tradicao === 'candomble_cargo' ? `Cumpriu a obrigação e tornou-se ${nomeDaEtapa16(v, n).toLowerCase()}. A casa inteira esteve lá.` : `Fez os votos: tornou-se ${nomeDaEtapa16(v, n).toLowerCase()}.`)
        : n.id === 'padre' ? 'Foi ordenado padre. A família inteira na primeira fila.' : n.id === 'diacono' ? 'Foi ordenado diácono.' : undefined;
      return { texto: subir(v, r, t), tom: 'bom' };
    }
    case 'abrir_casa': {
      v.financas.conta -= custoDaCasa(r.tradicao);
      r.casaPropria = true;
      r.coesao = 70;
      const t = subir(v, r, `Abriu a própria casa: tornou-se ${nomeDaEtapa16(v, proximaEtapa16(r)!).toLowerCase()}. Os primeiros filhos chegaram antes de o barracão ficar pronto.`);
      return { texto: t, tom: 'bom' };
    }
    case 'projeto': {
      r.projeto = { id: q.id, t: v.t };
      const p = T.projetos.find(x => x.id === q.id)!;
      r.caixa = Math.max(0, r.caixa - p.custo);
      return { texto: `${p.nome}: começou. O resultado se vê no fim do ano.`, tom: 'neutro' };
    }
    case 'questao': return responderQuestao(v, rr, r, q.escolha);
    case 'sair': {
      const e = etapaAtual16(r);
      r.saiu = { t: v.t, motivo: 'escolha' };
      const t = r.tradicao === 'catolica' && r.etapa >= 3 ? 'Pediu dispensa do ministério sacerdotal.' : `Deixou o caminho religioso (${nomeDaEtapa16(v, e).toLowerCase()}).`;
      registrar(v, r, t);
      marcar(v, 'fim_carreira', t, 2);
      return { texto: t, tom: 'neutro' };
    }
  }
}

/* ------------------------------------------------------------------ As questões do ano */

function gerarQuestao(v: Vida, rr: Rng, r: Religiao16): Questao16 | undefined {
  const T = TRADICOES16[r.tradicao];
  const e = etapaAtual16(r);
  const afro = r.tradicao === 'candomble' || r.tradicao === 'umbanda' || r.tradicao === 'candomble_cargo';
  const par = parceiro(v);
  const q = (id: string, tipo: string, titulo: string, texto: string, opcoes: [string, string][]): Questao16 => ({ id: `${id}_${anoDe(v.t)}`, tipo, titulo, texto, opcoes: opcoes.map(([a, b]) => ({ id: a, rotulo: b })), t: v.t });
  // O celibato posto à prova: o relacionamento existe — o caminho pede uma escolha.
  if (T.celibato && (par || saindoCom(v).length)) {
    const nome = par?.p.nome ?? saindoCom(v)[0].p.nome;
    return q('celibato', 'celibato', 'O celibato', `O que existe entre você e ${nome} não cabe nos votos. Alguém da comunidade já reparou.`, [['romper', `Terminar com ${nome} e seguir o caminho`], ['deixar', 'Deixar o caminho religioso']]);
  }
  const pool: Questao16[] = [];
  if (e.lidera) {
    pool.push(q('politico', 'politico', 'O pedido do candidato', `Um candidato a prefeito quer falar à comunidade n${T.lugar.startsWith('a ') ? 'a' : 'o'} ${T.lugar.slice(2)} e pede o seu apoio público.`, [['apoiar', 'Apoiar publicamente'], ['receber', 'Receber em particular, sem apoio público'], ['recusar', 'Recusar: o espaço não é palanque']]));
    pool.push(q('doacao', 'doacao', 'A doação', 'Um empresário conhecido na cidade — com fama de negócios mal explicados — oferece uma doação grande para a comunidade.', [['aceitar', 'Aceitar'], ['recusar', 'Recusar com educação'], ['condicoes', 'Aceitar com prestação de contas pública']]));
    pool.push(q('disputa', 'disputa', 'A disputa', `Um grupo d${T.fieis.startsWith('filhos') ? 'os' : 'os'} ${T.fieis} questiona as suas decisões e quer outra liderança.`, [['dialogar', 'Chamar todo mundo para conversar'], ['enfrentar', 'Firmar a autoridade'], ['ceder', 'Ceder parte da condução']]));
    pool.push(q('denuncia', 'denuncia', 'A denúncia', 'Chega até você uma denúncia grave contra alguém que trabalha com você na comunidade.', [['autoridades', 'Afastar a pessoa e levar às autoridades'], ['internamente', 'Resolver internamente'], ['abafar', 'Deixar quieto para proteger o nome da comunidade']]));
    if (afro) pool.push(q('intolerancia', 'intolerancia', 'O ataque ao terreiro', 'De madrugada, o terreiro foi pichado e as imagens, quebradas. Não foi a primeira ameaça.', [['denunciar', 'Registrar a ocorrência e chamar a imprensa'], ['reconstruir', 'Reconstruir em silêncio, com a comunidade'], ['mudar', 'Procurar outro lugar para a casa']]));
  } else {
    pool.push(q('duvida', 'duvida', 'A dúvida', 'Um ano difícil: a fé continua, mas a certeza do caminho balançou.', [['ficar', 'Ficar e atravessar a dúvida'], ['tempo', 'Pedir um tempo para pensar'], ['sair', 'Deixar o caminho']]));
    if ((r.tradicao === 'candomble' || r.tradicao === 'umbanda') && proximaEtapa16(r)?.como === 'casa' && !r.casaPropria && oQueFalta16(v, r).length === 0)
      pool.push(q('sucessao', 'sucessao', 'A sucessão da casa', `${r.tradicao === 'candomble' ? 'A ialorixá' : 'O dirigente'} da sua casa morreu. O jogo de búzios e os mais velhos apontam para você — e há quem prefira outra pessoa.`, [['assumir', 'Assumir a casa'], ['apoiar', 'Apoiar a outra pessoa'], ['abrir', 'Sair para abrir a própria casa, mais tarde']]));
  }
  if (!pool.length) return undefined;
  return rr.pick(pool);
}

function responderQuestao(v: Vida, rr: Rng, r: Religiao16, escolha: string): SaidaReligiao16 {
  const qq = r.questao!;
  r.questao = undefined;
  const T = TRADICOES16[r.tradicao];
  const bio = (t: string) => { registrar(v, r, t); return t; };
  switch (qq.tipo) {
    case 'celibato': {
      const par = parceiro(v) ?? saindoCom(v)[0];
      if (escolha === 'romper') {
        if (par?.vin.romance) { par.vin.romance.estagio = 'ex'; par.vin.romance.tEstagio = v.t; par.vin.romance.fim = 'termino'; }
        v.mente.felicidade = clamp(v.mente.felicidade - 8);
        r.formacao = clamp(r.formacao + 3);
        return { texto: bio(`Terminou com ${par?.p.nome ?? 'quem amava'} para seguir o caminho.`), tom: 'neutro' };
      }
      r.saiu = { t: v.t, motivo: 'celibato' };
      return { texto: bio(r.tradicao === 'catolica' && r.etapa >= 3 ? `Deixou o sacerdócio para viver com ${par?.p.nome ?? 'quem amava'}.` : 'Deixou o caminho religioso por amor.'), tom: 'neutro' };
    }
    case 'politico':
      if (escolha === 'apoiar') { r.influencia = clamp(r.influencia + 12); r.coesao = clamp(r.coesao - 12); return { texto: rr.chance(0.5) ? 'O candidato ganhou e lembrou de você. Metade da comunidade não gostou.' : 'O candidato perdeu — e a comunidade ficou dividida por nada.', tom: 'neutro' }; }
      if (escolha === 'receber') { r.influencia = clamp(r.influencia + 5); return { texto: 'Uma conversa longa, uma promessa de praça reformada. Nenhuma foto.', tom: 'neutro' }; }
      r.coesao = clamp(r.coesao + 4); r.prestigio = clamp(r.prestigio + 2);
      return { texto: 'O espaço continuou de todos.', tom: 'bom' };
    case 'doacao':
      if (escolha === 'aceitar') { r.caixa += 40000; if (rr.chance(0.35)) { r.prestigio = clamp(r.prestigio - 12); r.influencia = clamp(r.influencia - 6); return { texto: bio('A doação virou notícia: o empresário foi preso meses depois, e o nome da comunidade apareceu junto.'), tom: 'ruim' }; } return { texto: 'O dinheiro entrou. Ninguém perguntou de onde veio.', tom: 'neutro' }; }
      if (escolha === 'condicoes') { r.caixa += 25000; r.prestigio = clamp(r.prestigio + 3); return { texto: 'Com prestação de contas pública, a doação veio menor — e limpa.', tom: 'bom' }; }
      r.prestigio = clamp(r.prestigio + 2);
      return { texto: 'Você recusou. O caixa continua apertado.', tom: 'neutro' };
    case 'disputa':
      if (escolha === 'dialogar') { const ok = rr.chance(clamp(0.4 + r.coesao / 200 + r.prestigio / 300, 0.3, 0.85)); r.coesao = clamp(r.coesao + (ok ? 10 : -6)); return { texto: ok ? 'A reunião durou a noite inteira. No fim, ficaram todos.' : 'Conversaram, mas o grupo foi embora e levou gente junto.', tom: ok ? 'bom' : 'ruim' }; }
      if (escolha === 'enfrentar') { r.prestigio = clamp(r.prestigio + 3); r.coesao = clamp(r.coesao - 10); r.comunidade = Math.round(r.comunidade * 0.85); return { texto: bio('A autoridade ficou de pé; uma parte da comunidade saiu.'), tom: 'neutro' }; }
      r.coesao = clamp(r.coesao + 6); r.prestigio = clamp(r.prestigio - 4);
      return { texto: 'Você dividiu a condução. A paz voltou, a palavra final ficou menos sua.', tom: 'neutro' };
    case 'denuncia':
      if (escolha === 'autoridades') { r.coesao = clamp(r.coesao - 6); r.prestigio = clamp(r.prestigio + 6); return { texto: bio('Afastou a pessoa e levou a denúncia às autoridades. Doeu na comunidade — e era o certo.'), tom: 'neutro' }; }
      if (escolha === 'internamente') { r.coesao = clamp(r.coesao - 2); if (rr.chance(0.3)) { r.prestigio = clamp(r.prestigio - 10); return { texto: bio('A história saiu de dentro: perguntaram por que ninguém chamou a polícia.'), tom: 'ruim' }; } return { texto: 'A pessoa foi afastada em silêncio.', tom: 'neutro' }; }
      if (rr.chance(0.6)) { r.prestigio = clamp(r.prestigio - 25); r.coesao = clamp(r.coesao - 20); r.influencia = clamp(r.influencia - 15); return { texto: bio('Anos depois, veio à tona — e o silêncio de quem sabia virou a notícia.'), tom: 'ruim' }; }
      r.coesao = clamp(r.coesao - 4);
      return { texto: 'O assunto morreu. Por enquanto.', tom: 'ruim' };
    case 'intolerancia':
      if (escolha === 'denunciar') { r.influencia = clamp(r.influencia + 10); r.coesao = clamp(r.coesao + 8); return { texto: bio('A ocorrência foi registrada como intolerância religiosa; a imprensa veio, e terreiros da cidade inteira apareceram para ajudar.'), tom: 'bom' }; }
      if (escolha === 'reconstruir') { r.coesao = clamp(r.coesao + 6); r.caixa = Math.max(0, r.caixa - 5000); return { texto: 'Em duas semanas, as imagens estavam de volta. A casa continuou.', tom: 'neutro' }; }
      r.comunidade = Math.round(r.comunidade * 0.8); r.coesao = clamp(r.coesao - 5);
      return { texto: bio('A casa mudou de lugar. Nem todos os filhos acompanharam.'), tom: 'ruim' };
    case 'duvida':
      if (escolha === 'ficar') { r.formacao = clamp(r.formacao + 6); return { texto: 'Atravessou. A fé que ficou é mais sua.', tom: 'bom' }; }
      if (escolha === 'tempo') { r.prestigio = clamp(r.prestigio - 3); return { texto: 'Um tempo afastado, sem pressa. Voltou.', tom: 'neutro' }; }
      r.saiu = { t: v.t, motivo: 'duvida' };
      return { texto: bio(`Deixou o caminho (${T.nome.toLowerCase()}).`), tom: 'neutro' };
    case 'sucessao':
      if (escolha === 'assumir') {
        const ok = rr.chance(clamp(0.45 + r.prestigio / 200, 0.4, 0.85));
        if (ok) { r.coesao = 55; return { texto: subir(v, r, `Assumiu a casa na sucessão: tornou-se ${nomeDaEtapa16(v, proximaEtapa16(r)!).toLowerCase()}.`), tom: 'bom' }; }
        r.coesao = clamp(r.coesao - 15);
        return { texto: bio('A disputa pela casa dividiu os filhos. A outra pessoa ficou com a casa.'), tom: 'ruim' };
      }
      if (escolha === 'apoiar') { r.prestigio = clamp(r.prestigio + 5); return { texto: 'Você apoiou a outra pessoa. A casa seguiu inteira — e lembra disso.', tom: 'bom' }; }
      return { texto: 'Você esperou: a sua casa virá a seu tempo.', tom: 'neutro' };
  }
  return { texto: '', tom: 'neutro' };
}

/* ------------------------------------------------------------------ O ano */

export function processarReligiao16(v: Vida): void {
  const r = v.religiao16;
  if (!r || r.saiu) return;
  if (r.ano >= anoDe(v.t)) return;
  const T = TRADICOES16[r.tradicao];
  const rr = rngDe(v.id, 'religiao16', anoDe(v.t));
  // Mudou de crença: o caminho acaba (sem drama inventado).
  if (!T.crencas.includes(crencaDe(v).atual)) { r.saiu = { t: v.t, motivo: 'crenca' }; registrar(v, r, `Deixou o caminho religioso ao mudar de crença.`); return; }
  const e = etapaAtual16(r);
  const fezAlgo = r.gestos.length;
  // A questão que ficou sem resposta: o silêncio também decide.
  if (r.questao) {
    if (r.questao.tipo === 'celibato') { r.prestigio = clamp(r.prestigio - 10); r.coesao = clamp(r.coesao - 8); registrar(v, r, 'O relacionamento escondido virou assunto na comunidade.'); }
    else r.coesao = clamp(r.coesao - 4);
    r.questao = undefined;
  }
  // O descaso pesa; o cuidado sustenta.
  if (!fezAlgo) { r.prestigio = clamp(r.prestigio - 2); r.coesao = clamp(r.coesao - 3); }
  // Nas etapas de formação, o ano vivido na comunidade também forma (a rotina, os mais velhos, a liturgia).
  else if (!e.lidera) r.formacao = clamp(r.formacao + 4);
  r.coesao = clamp(Math.round(r.coesao + (55 - r.coesao) * 0.08));
  // O caixa da comunidade (o dízimo, as doações, a contribuição da casa) — proporcional à comunidade e à união dela.
  if (e.lidera) r.caixa = Math.round(r.caixa + r.comunidade * (r.tradicao === 'evangelica' ? 30 : r.tradicao === 'catolica' ? 15 : 10) * (0.5 + r.coesao / 100));
  // O sustento: côngrua, prebenda, salário da igreja — onde há. Muitos caminhos não pagam nada.
  if (e.sustento) v.financas.conta += e.sustento;
  // A influência acompanha o tamanho e a união da comunidade, devagar.
  if (e.lidera) r.influencia = clamp(Math.round(r.influencia + (Math.log10(1 + r.comunidade) * 8 - r.influencia) * 0.1));
  // O projeto do ano se decide.
  if (r.projeto) {
    const p = T.projetos.find(x => x.id === r.projeto!.id);
    const ok = rr.chance(clamp(0.45 + r.coesao / 200 + r.prestigio / 300, 0.3, 0.9));
    (r.projetosFeitos ??= []).push({ id: r.projeto.id, t: v.t, bom: ok });
    r.projeto = undefined;
    if (p) {
      if (ok) { r.coesao = clamp(r.coesao + 8); r.influencia = clamp(r.influencia + 6); r.prestigio = clamp(r.prestigio + 4); registrar(v, r, `${p.nome}: saiu do papel.`); }
      else { r.coesao = clamp(r.coesao - 4); registrar(v, r, `${p.nome}: ficou pela metade.`, false); }
    }
  }
  // Nomeação, eleição, conclave: não se pede — vem (ou não).
  const n = proximaEtapa16(r);
  if (n && (n.como === 'nomeacao' || n.como === 'eleicao') && oQueFalta16(v, r).length === 0 && !(T.celibato && parceiro(v))) {
    // O topo de cada caminho é de poucos: a última etapa vem raramente, mesmo para quem tem todo o reconhecimento.
    const topo = r.etapa + 1 === TRADICOES16[r.tradicao].etapas.length - 1 || n.id === 'cardeal' || n.id === 'arcebispo';
    const chance = topo ? clamp(0.012 + (r.prestigio - (n.prestigio ?? 0)) / 600 + r.coesao / 3000, 0.008, 0.04) : clamp(0.12 + (r.prestigio - (n.prestigio ?? 0)) / 120 + r.coesao / 800, 0.05, 0.4);
    if (rr.chance(chance)) {
      const t = n.como === 'eleicao' ? `Foi eleit${G(v) ? 'a' : 'o'} ${nomeDaEtapa16(v, n).toLowerCase()}.` : r.tradicao === 'catolica' && n.id === 'bispo' ? 'O papa o nomeou bispo. A ordenação episcopal lotou a catedral.' : r.tradicao === 'catolica' && n.id === 'cardeal' ? 'Foi criado cardeal no consistório, em Roma.' : `Foi nomead${G(v) ? 'a' : 'o'} ${nomeDaEtapa16(v, n).toLowerCase()}.`;
      subir(v, r, t);
    }
  }
  if (n?.como === 'conclave' && idade(v) < 80 && oQueFalta16(v, r).length === 0 && rr.chance(0.08)) {
    const eleito = rr.chance(clamp(0.02 + (r.prestigio - 85) / 150 + r.influencia / 400, 0.01, 0.15));
    if (eleito) subir(v, r, 'Fumaça branca: o conclave o elegeu papa.');
    else registrar(v, r, 'Entrou no conclave como cardeal eleitor. A fumaça branca saiu para outro.');
  }
  // A questão do novo ano (nem todo ano tem uma; o celibato posto à prova sempre tem).
  r.ano = anoDe(v.t);
  r.gestos = [];
  const qq = gerarQuestao(v, rr, r);
  // A dúvida de vocação é rara (e não volta logo); as questões de quem lidera, mais comuns.
  const recente = (tipo: string) => r.historico.length && v.fatos[`rel16_${tipo}`] !== undefined && v.t - v.fatos[`rel16_${tipo}`] < 72;
  if (qq && (qq.tipo === 'celibato' || (qq.tipo === 'duvida' ? !recente('duvida') && rr.chance(0.12) : rr.chance(0.4)))) { r.questao = qq; v.fatos[`rel16_${qq.tipo}`] = v.t; }
}

export function normalizarReligiao16(v: Vida): void {
  const r = v.religiao16;
  if (!r) return;
  if (!TRADICOES16[r.tradicao]) { v.religiao16 = undefined; return; }
  if (!Array.isArray(r.historico)) r.historico = [];
  if (!Array.isArray(r.gestos)) r.gestos = [];
  r.etapa = Math.max(0, Math.min(TRADICOES16[r.tradicao].etapas.length - 1, r.etapa | 0));
}
