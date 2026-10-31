/**
 * REWORK 12.3 · PILAR B — O CONTRATANTE OCASIONAL. Quem leva vida legal pode, numa circunstância, encomendar um serviço por
 * fora — sem virar do meio: não ganha carreira, organização, nem prática (isso é `envolvimento`). Ganha um intermediário
 * (alguém que conhece alguém) e um risco que não some de uma vez.
 *
 *   SERVIÇOS     saber o que não devia (uma informação), um favor que fura a fila, uma fraude pequena, intimidar alguém,
 *                mandar machucar alguém, ser apresentado a quem é do meio. Tudo abstrato: o que se pediu, contra quem e no
 *                que deu — nunca como se faz.
 *   QUEM PEDE    precisa de um intermediário: alguém das suas relações que vive na beira (o temperamento e a confiança),
 *                ou um contato antigo do caminho. Sem isso, não há a quem pedir.
 *   O QUE PESA   o intermediário pode sumir com o dinheiro; o serviço pode falhar; e o que foi feito pode vir à tona anos
 *                depois (um processo — como mandante —, a família que descobre, o emprego). Contra uma pessoa, a relação
 *                com ela acaba; a violência encomendada é o que mais pesa.
 *   ANTES        a tela sempre mostra as saídas legais (conversar, mediar, denunciar, um advogado): o serviço por fora não
 *                é a resposta padrão para um conflito.
 */
import { clamp, rngDe } from '../rng';
import type { Pessoa, ServicoPorFora, Vida } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, marcarFato, parceiro, vinculosVivos } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { economiaLocal } from '../dados/lugares';
import { vereditoDePagar } from './dinheiro';
import { abrirProcesso } from './justica';
import { movimentoPorFora, pagarPorFora } from './porFora';
import { abalar } from './abalo';
import { encerrarEmprego } from './trabalho';
import { dinheiro, flex } from '../texto';
import { paisDaCidade } from '../dados/lugares';
import { NOME_DO_PAPEL } from './submundo';
import { anoDe } from '../tempo';

export type TipoDeServico = ServicoPorFora['tipo'];
export const SERVICOS: Record<TipoDeServico, { nome: string; frase: string; preco: number; risco: number; contraAlguem: boolean; legal: string }> = {
  informacao: { nome: 'Saber o que não devia', frase: 'uma informação sobre alguém, conseguida por fora', preco: 2500, risco: 0.04, contraAlguem: true, legal: 'Perguntar direto, ou procurar um advogado.' },
  favor: { nome: 'Um papel que anda mais depressa', frase: 'um favor que fura a fila', preco: 3500, risco: 0.05, contraAlguem: false, legal: 'Esperar a fila, reclamar na ouvidoria.' },
  fraude: { nome: 'Uma fraude pequena', frase: 'um desconto que não devia existir', preco: 4000, risco: 0.07, contraAlguem: false, legal: '—' },
  intimidacao: { nome: 'Fazer alguém recuar', frase: 'um recado duro a alguém', preco: 8000, risco: 0.1, contraAlguem: true, legal: 'Conversar, pedir mediação, registrar ocorrência, um advogado.' },
  agressao: { nome: 'Mandar machucar alguém', frase: 'uma violência encomendada contra alguém', preco: 20000, risco: 0.16, contraAlguem: true, legal: 'Afastar-se, registrar ocorrência, pedir medida protetiva, um advogado.' },
  apresentacao: { nome: 'Ser apresentado a quem é do meio', frase: 'uma apresentação a alguém do meio', preco: 1500, risco: 0.02, contraAlguem: false, legal: '—' }
};

const preco = (v: Vida, t: TipoDeServico) => Math.round(SERVICOS[t].preco * economiaLocal(v.moradia.municipioId).custo / 100) * 100;

/** REWORK 12.35 · D1: a família e o par não são "quem conhece alguém" (antes, o intermediário era a mãe, o tio, o avô). */
const daFamilia = (v: Vida, id: string) => !!v.vinculos[id]?.parentesco || !!v.vinculos[id]?.romance;
const ORIGEM: Partial<Record<string, string>> = { trabalho: 'do trabalho', escola: 'dos tempos de escola', faculdade: 'da faculdade', vizinhanca: 'da vizinhança', rotina: 'de onde você vai sempre', online: 'de um grupo na internet', apresentado: 'que alguém apresentou' };

/**
 * Quem pode servir de intermediário: um contato do caminho, ou alguém das relações — de fora da família — que vive na beira
 * (o temperamento) e confia em você o bastante para apresentar a quem faz. Leitura pura (a tela chama a cada desenho).
 */
export function intermediario(v: Vida): Pessoa | undefined {
  const ja = v.caminhos.contratante?.intermediarioId;
  if (ja && v.pessoas[ja]?.vivo && !daFamilia(v, ja) && v.vinculos[ja]?.ruptura === undefined) return v.pessoas[ja];
  const e = v.caminhos.envolvimento;
  const doCaminho = Object.entries(e?.fichas ?? {}).find(([id, f]) => f.afastado === undefined && f.traiu === undefined && v.pessoas[id]?.vivo && !daFamilia(v, id) && perto(v, id));
  if (doCaminho) return v.pessoas[doCaminho[0]];
  return vinculosVivos(v).filter(x => !x.p.especie && !daFamilia(v, x.p.id) && x.vin.ruptura === undefined && idadePessoa(v, x.p) >= 18 && x.p.temperamento.responsabilidade <= -0.3 && x.vin.confianca >= 30)
    .sort((a, b) => a.p.temperamento.responsabilidade - b.p.temperamento.responsabilidade)[0]?.p;
}

/** Quem é essa pessoa e por que tem acesso a quem faz (a tela diz; não é um parente). */
export function quemEoIntermediario(v: Vida, p: Pessoa): string {
  const f = v.caminhos.envolvimento?.fichas?.[p.id];
  if (f) return `${NOME_DO_PAPEL[f.papel]} do seu caminho: conhece quem faz porque é do meio`;
  const vin = v.vinculos[p.id];
  const de = vin ? ORIGEM[vin.origem] ?? '' : '';
  const ocup = p.ocupacao ? `, ${p.ocupacao.toLowerCase()}` : '';
  return `${flex(p.genero, 'um conhecido', 'uma conhecida', 'ume conhecide')} ${de}${ocup}: vive na beira e conhece quem faz esse tipo de coisa`.replace(/ +/g, ' ').replace(' :', ':');
}

/** O contato do caminho está na mesma cidade (ou alcança: o mesmo país e confiança alta). */
function perto(v: Vida, id: string): boolean {
  const p = v.pessoas[id];
  if (!p?.municipioId || p.municipioId === v.moradia.municipioId) return true;
  try { return paisDaCidade(p.municipioId) === paisDaCidade(v.moradia.municipioId) && (v.caminhos.envolvimento?.fichas?.[id]?.confianca ?? 0) >= 50; } catch { return false; }
}

/**
 * REWORK 12.35 · D2: contra quem se pode pedir algo — quem está em conflito de verdade com você: a tensão alta, a ruptura,
 * o rival declarado, o conflito aberto, o rival do trabalho. (Antes, só a tensão ≥ 45, que quase nenhuma vida comum alcança.)
 */
export function alvosPossiveis(v: Vida): Pessoa[] {
  const rivalNoTrabalho = v.trabalho.atual?.equipe?.rivalId;
  return vinculosVivos(v).filter(x => !x.p.especie && idadePessoa(v, x.p) >= 16 && (
    x.vin.tensao >= 45 || (x.vin.tensao >= 20 && (x.vin.ruptura !== undefined || x.vin.estagio === 'rival' || x.vin.conflito !== undefined || x.p.id === rivalNoTrabalho))
  )).sort((a, b) => b.vin.tensao - a.vin.tensao).map(x => x.p);
}

/** O que a tela mostra ANTES de pedir (D11/D12): o preço, a chance de o pedido não dar em nada, o risco de vir à tona. */
export function condicoesDoServico(v: Vida, tipo: TipoDeServico): { preco: number; golpe: number; falha: number; risco: number; peso: string } {
  const s = SERVICOS[tipo];
  return { preco: preco(v, tipo), golpe: CHANCE_DE_GOLPE, falha: tipo === 'agressao' || tipo === 'intimidacao' ? 0.2 : 0.12, risco: s.risco, peso: PESO_SE_VIER[tipo] };
}
const CHANCE_DE_GOLPE = 0.12;
const PESO_SE_VIER: Record<TipoDeServico, string> = {
  informacao: 'a relação com a pessoa, e a confiança de quem souber',
  favor: 'um processo leve (cabe pena alternativa a quem é primário)',
  fraude: 'um processo por fraude, e o emprego',
  intimidacao: 'um processo como mandante',
  agressao: 'um processo como mandante de violência, o emprego, a família',
  apresentacao: 'quase nada — a não ser o que você fizer depois'
};

export function disponibilidadeServico(v: Vida, tipo: TipoDeServico, alvoId?: string): Veredito {
  if (idade(v) < 18) return bloqueio('impossivel', 'Cedo demais.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Da prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  const s = SERVICOS[tipo];
  if ((v.caminhos.contratante?.servicos ?? []).some(x => x.t === v.t)) return bloqueio('incompativel', 'Já se pediu algo assim neste ano. Repetir chama atenção.');
  const quem = intermediario(v);
  if (!quem) return bloqueio('requisito', 'Não há a quem pedir: ninguém das suas relações (fora da família) vive na beira o bastante para conhecer quem faz isso. Isso muda com amizades, colegas, vizinhos — ou com um contato do meio.');
  if (s.contraAlguem) {
    const alvo = alvoId ? v.pessoas[alvoId] : undefined;
    if (!alvo || !alvosPossiveis(v).some(p => p.id === alvo.id)) return bloqueio('requisito', 'Contra quem? (Só aparece quem está em conflito de verdade com você: uma briga aberta, uma ruptura, um rival.)');
  }
  const c = condicoesDoServico(v, tipo);
  const d = vereditoDePagar(v, c.preco, `${quem.nome} disse que custa uns`);
  if (d.grau !== 'permitido') return d;
  return { grau: 'irregular', motivo: `É crime${s.contraAlguem ? ' — contra uma pessoa' : ''}. Custa ${dinheiro(c.preco)}, adiantado. Em ${Math.round(c.golpe * 100)}% das vezes o dinheiro some; em ${Math.round(c.falha * 100)}%, não dá certo. A chance de vir à tona começa em ${Math.round(c.risco * 100)}% ao ano e cai com o tempo; se vier, pesa ${c.peso}. ${s.legal !== '—' ? `Saída legal: ${s.legal}` : ''}`.trim() };
}

export function encomendarServico(v: Vida, tipo: TipoDeServico, alvoId?: string): { texto: string; tom?: 'bom' | 'ruim' } {
  const s = SERVICOS[tipo];
  const quem = intermediario(v)!;
  const alvo = alvoId ? v.pessoas[alvoId] : undefined;
  const valor = preco(v, tipo);
  const r = rngDe(v.id, 'servico', tipo, alvoId ?? '', v.t);
  pagarPorFora(v, 'custos', valor);
  const c = (v.caminhos.contratante ??= { servicos: [] });
  c.intermediarioId = quem.id;
  marcarFato(v, 'encomendou_servico');
  const reg: ServicoPorFora = { t: v.t, tipo, ...(alvo ? { alvoId: alvo.id } : {}), valor, resultado: 'feito', risco: s.risco };
  c.servicos.push(reg);
  if (c.servicos.length > 12) c.servicos.splice(0, c.servicos.length - 12);
  if (r.chance(CHANCE_DE_GOLPE)) {
    reg.resultado = 'golpe';
    reg.risco = s.risco / 3;
    const vin = v.vinculos[quem.id];
    if (vin) { vin.confianca = clamp(vin.confianca - 25); lembrarCom(v, quem.id, 'Ficou com o dinheiro de um pedido seu e não fez nada.', 'conflito', 2); }
    c.golpeDe = quem.id;
    return { texto: `${quem.nome} pegou ${dinheiro(valor)} e disse que ia resolver. Não resolveu nada. Dá para ir cobrar — ou deixar quieto, que também é uma escolha.`, tom: 'ruim' };
  }
  if (r.chance(tipo === 'agressao' || tipo === 'intimidacao' ? 0.2 : 0.12)) {
    reg.resultado = 'falhou';
    reg.risco = s.risco * 1.5;
    return { texto: `Por ${quem.nome}, o pedido chegou a quem faz — e deu errado. Nada se resolveu, e mais gente ficou sabendo que alguém pediu ${s.frase}.`, tom: 'ruim' };
  }
  abalar(v, 'o que você mandou fazer', -2, 6);
  switch (tipo) {
    case 'informacao': {
      const vin = alvo ? v.vinculos[alvo.id] : undefined;
      const sabe = alvo ? `${alvo.nome} ${alvo.ocupacao ? `trabalha como ${alvo.ocupacao.toLowerCase()}` : 'vive de um jeito que não conta a ninguém'}, ${alvo.renda > 0 ? `ganha uns ${dinheiro(alvo.renda)} por mês` : 'não tem renda própria'}${alvo.parceiroId && v.pessoas[alvo.parceiroId] ? ` e está com ${v.pessoas[alvo.parceiroId].nome}` : ''}` : 'o que você queria saber';
      if (vin) vin.tensao = clamp(vin.tensao - 5);
      return { texto: `${quem.nome} trouxe o que pediu: ${sabe}. Saber não resolve o conflito — mas agora você sabe.` };
    }
    case 'favor':
      v.mente.estresse = clamp(v.mente.estresse - 6);
      return { texto: `O papel que estava parado andou numa semana. ${quem.nome} disse que "tem gente que resolve". Ninguém perguntou mais nada.` };
    case 'fraude': {
      const ganho = Math.round(valor * 2.5 / 100) * 100;
      movimentoPorFora(v, 'ocasional', ganho);
      return { texto: `A fraude passou: ${dinheiro(ganho)} que não deviam ter vindo. Por enquanto, ninguém conferiu.` };
    }
    case 'intimidacao': {
      const vin = v.vinculos[alvo!.id];
      vin.tensao = clamp(vin.tensao + 30);
      vin.proximidade = clamp(vin.proximidade - 30);
      vin.confianca = 0;
      lembrarCom(v, alvo!.id, 'Recebeu um recado duro, e desconfia de quem mandou.', 'conflito', 3);
      return { texto: `${alvo!.nome} recebeu o recado e recuou. Não fala mais com você — e olha para os lados quando você passa.`, tom: 'ruim' };
    }
    case 'agressao': {
      alvo!.saude = clamp(alvo!.saude - 30);
      const vin = v.vinculos[alvo!.id];
      vin.tensao = 100; vin.proximidade = 0; vin.confianca = 0;
      lembrarCom(v, alvo!.id, 'Foi atacado. Acha que sabe quem mandou.', 'conflito', 5);
      reg.risco = s.risco * (vin.parentesco ? 1.6 : 1);
      escrever(v, { texto: `Mandou machucar ${alvo!.nome}.`, relevancia: 'biografia', tema: 'escolha', tom: 'ruim', escolha: true, pessoas: [alvo!.id] });
      return { texto: `${alvo!.nome} passou semanas se recuperando. Ninguém foi preso — ainda. ${quem.nome} disse para você não aparecer por uns tempos.`, tom: 'ruim' };
    }
    case 'apresentacao': {
      if (v.caminhos.envolvimento) return { texto: `${quem.nome} apresentou você a gente do meio. Você já conhecia o caminho.` };
      const c2 = (v.caminhos.contratante ??= { servicos: [] });
      c2.apresentado = v.t;
      return { texto: `${quem.nome} apresentou você a quem compra e vende por fora. Você não é do meio — mas agora sabe onde fica o mercado por fora.` };
    }
  }
}

/** O ano: o que foi encomendado pode vir à tona (o processo como mandante; a família; o emprego). O risco cai com o tempo. */
export function processarServicos(v: Vida): void {
  const c = v.caminhos.contratante;
  if (!c?.servicos.length || v.justica?.prisao) return;
  for (const s of c.servicos) {
    if (s.descoberto !== undefined || s.risco <= 0.004) continue;
    const r = rngDe(v.id, 'servico_vem', s.t, v.t);
    if (!r.chance(s.risco)) { s.risco = Math.round(s.risco * 0.8 * 1000) / 1000; continue; }
    s.descoberto = v.t;
    const nome = SERVICOS[s.tipo].frase;
    const alvo = s.alvoId ? v.pessoas[s.alvoId] : undefined;
    const par = parceiro(v);
    if (par) { par.vin.tensao = clamp(par.vin.tensao + 25); par.vin.confianca = clamp(par.vin.confianca - 20); lembrarCom(v, par.p.id, 'Descobriu o que você mandou fazer.', 'conflito', 3); }
    const perdeu = (s.tipo === 'fraude' || s.tipo === 'agressao') && v.trabalho.atual && r.chance(0.4);
    if (perdeu) encerrarEmprego(v, 'justa causa');
    // D4/D9/D10: o texto lê o mesmo estado que abre o processo; o golpe é narrado como tentativa; o favor é infração leve.
    const processa = s.tipo !== 'apresentacao' && s.tipo !== 'informacao' && !v.justica?.processo;
    const tentativa = s.resultado !== 'feito' ? ' (uma tentativa: não deu em nada, mas foi pedido)' : '';
    escrever(v, { texto: `Veio à tona que, em ${anoDe(s.t)}, você encomendou ${nome}${alvo ? ` contra ${alvo.nome}` : ''}${tentativa}.${par ? ` ${par.p.nome} soube.` : ''}${perdeu ? ' No trabalho, a resposta foi a demissão.' : ''}${processa ? ' Vem um processo.' : ''}`, relevancia: 'marco', tema: 'trabalho', tom: 'ruim' });
    abalar(v, 'o que veio à tona', -8, 12);
    if (processa) abrirProcesso(v, rngDe(v.id, 'servico_proc', s.t), s.tipo === 'agressao' || s.tipo === 'intimidacao' ? 'violencia' : s.tipo === 'fraude' ? 'fraude' : 'pequenos');
    return;
  }
}

/**
 * REWORK 12.35 · golpe com saída: cobrar quem sumiu com o dinheiro (às vezes devolve metade; o vínculo acaba, e quem foi
 * cobrado pode falar do pedido) ou deixar quieto (a perda fica, o risco não cresce).
 */
export function disponibilidadeCobrarGolpe(v: Vida): Veredito {
  const id = v.caminhos.contratante?.golpeDe;
  if (!id || !v.pessoas[id]?.vivo) return bloqueio('impossivel', 'Ninguém está devendo um pedido seu.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Da prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  return { grau: 'irregular', motivo: `Cobrar ${v.pessoas[id].nome}: às vezes devolve uma parte; a amizade acaba, e quem é cobrado pode falar do pedido.` };
}
export function cobrarGolpe(v: Vida, deixar: boolean): { texto: string; tom?: 'bom' | 'ruim' } {
  const c = v.caminhos.contratante!;
  const p = v.pessoas[c.golpeDe!];
  const s = [...c.servicos].reverse().find(x => x.resultado === 'golpe');
  delete c.golpeDe;
  if (c.intermediarioId === p.id) delete c.intermediarioId;
  if (deixar) return { texto: `Você deixou quieto. O dinheiro não volta — e ${p.nome} sabe que você sabe.` };
  const r = rngDe(v.id, 'cobrar_golpe', p.id, v.t);
  const vin = v.vinculos[p.id];
  if (vin) { vin.tensao = clamp(vin.tensao + 25); vin.confianca = 0; lembrarCom(v, p.id, 'Você foi cobrar o dinheiro de um pedido.', 'conflito', 2); }
  if (s && r.chance(0.45)) {
    const volta = Math.round(s.valor * 0.5 / 100) * 100;
    movimentoPorFora(v, 'ocasional', volta);
    return { texto: `${p.nome} devolveu ${dinheiro(volta)}, de cara fechada. O resto, "gastou". Entre vocês, acabou.`, tom: 'bom' };
  }
  if (s) s.risco = Math.min(0.2, s.risco + 0.05);
  return { texto: `${p.nome} disse que não deve nada — e saiu falando alto. Agora mais gente sabe que você pediu algo por fora.`, tom: 'ruim' };
}

/** Quem não é do meio, mas foi apresentado (ou tem contato antigo), chega ao mercado por fora (B4). */
export const acessoAoMercadoPorFora = (v: Vida) => v.caminhos.contratante?.apresentado !== undefined;

