/**
 * VIDA 12.8 — A CASA VIVA: o que se faz em cada cômodo e o lado de fora da casa.
 *
 * OS CÔMODOS SERVEM. A sala de cinema passa o filme de sábado para a família; a academia treina sem trânsito; a piscina é
 * nado, tarde de folga e festa; a biblioteca é leitura e estudo; o escritório é o dia de trabalho em casa (para quem tem
 * trabalho que se faz de casa); o estúdio é ensaio e gravação; a adega é a garrafa aberta com alguém. Nenhum uso é um
 * sistema novo: o efeito vai para a prática das frentes (`frentes.praticar`), o corpo, a cabeça, o estudo de agora, o
 * desempenho no emprego e a relação — como os usos das coisas (`pertences`). Cada uso, uma vez por ano. O cômodo vazio
 * não serve (a academia sem aparelho é um quarto vazio). A qualidade do que está nele mexe pouco: do básico ao exclusivo,
 * o efeito vai de 0,9× a 1,25× — o luxo é mais agradável, não um atalho.
 *
 * O LADO DE FORA. Casa própria tem fachada, jardim, caminho, luz e portão para escolher (o prédio decide a fachada do
 * apartamento). A prévia é a mesma da reforma de dentro: escolhe, vê o desenho, e só então paga uma conta só.
 *
 * Sorteios derivados (`rngDe`): usar a casa não mexe no acaso do resto da vida.
 */
import type { Pessoa, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { escrever, idade, idadePessoa, lembrarCom } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { coisa } from '../dados/coisas';
import { COMODOS } from '../dados/lar';
import { modeloMoradia } from '../dados/bens';
import { economiaLocal } from '../dados/lugares';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { AREA_DA_FACHADA, AREA_DO_CAMINHO, ASPECTOS_EXTERNOS, NOME_DO_ASPECTO_EXTERNO, OPCOES_EXTERNAS, SETORES_DE_CASA, USOS_DOS_COMODOS, type AspectoExterno, type OpcaoExterna, type UsoDoComodo } from '../dados/casa128';
import { coisasPorComodo, comodoEquipado, comodosDaCasa, donoDoLar, imovelDaMoradia, nivelDaCoisa, plantaDaCasa, poderSobreACasa, type ComodoDaCasa } from './lar';
import { praticar } from './frentes';
import { pagar, PATRIMONIO_NO_MES, vereditoDePagar } from './dinheiro';
import { mesmaCidade, moraJunto } from './vinculos';
import { estadoDaRelacao } from './lacos';
import { registrarNoObjeto } from './memoriaDosObjetos';
import { dinheiro as fmt } from '../texto';

const ano = (v: Vida) => Math.floor(v.t / 12);
const custo = (v: Vida) => economiaLocal(v.moradia.municipioId).custo;
const arred = (x: number) => Math.round(x / 10) * 10;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ================================================================ os usos */

export const usosDoTipo = (tipo: string): UsoDoComodo[] => USOS_DOS_COMODOS[tipo] ?? [];

/**
 * A qualidade do cômodo: o segmento médio do que está nele (as coisas que ele pede, quando pede; senão, todas), de 1
 * (básico) a 6 (exclusivo). O cômodo de obra sem nada dentro (a piscina, a quadra) vale pela obra: 3.
 */
export function nivelDoComodo(v: Vida, cm: ComodoDaCasa, porComodo = coisasPorComodo(v)): number {
  const pede = COMODOS[cm.tipo]?.pede;
  const aqui = (porComodo.get(cm.id) ?? []).filter(t => t.estado > 0 && !t.lembranca && (!pede || pede.includes(t.coisaId)));
  if (!aqui.length) return 3;
  return aqui.reduce((s, t) => s + nivelDaCoisa(t), 0) / aqui.length;
}
/** Do básico (0,9×) ao exclusivo (1,25×). */
export const fatorDaQualidade = (nivel: number) => Math.round((0.9 + (clamp(nivel, 1, 6) - 1) * 0.07) * 100) / 100;

/** Quem trabalha em algo que se faz de casa uns dias (o escritório, o computador): o setor, ou o trabalho por conta. */
export function trabalhaDeCasa(v: Vida): boolean {
  const e = v.trabalho.atual;
  if (!e || e.formacaoAte) return false;
  const o = ocupacaoOuNula(e.ocupacaoId);
  return !!o && (SETORES_DE_CASA.includes(o.setor) || e.contrato === 'autonomo');
}

/** Com quem dá para usar: quem mora junto, ou quem está na cidade (os mais próximos primeiro). */
export function companhiasDoComodo(v: Vida, u: UsoDoComodo, todas = false): Pessoa[] {
  if (!u.com) return [];
  return Object.values(v.vinculos)
    .map(vin => ({ vin, p: v.pessoas[vin.pessoaId] }))
    .filter(({ vin, p }) => p && p.vivo && !p.especie && p.nome && idadePessoa(v, p) >= 4
      && (u.com === 'casa' ? moraJunto(vin) : moraJunto(vin) || mesmaCidade(v, p))
      && estadoDaRelacao(v, vin) !== 'rompido' && vin.digital?.bloqueado === undefined
      && (vin.parentesco || vin.romance || vin.convivio.length > 0 || vin.proximidade >= 35)
      && (!u.idadeMin || idadePessoa(v, p) >= Math.min(u.idadeMin, 16)))
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)
    .slice(0, todas ? undefined : u.com === 'grupo' ? 5 : 6)
    .map(x => x.p);
}

const chave = (cm: ComodoDaCasa, usoId: string) => `ucomodo:${cm.tipo}:${usoId}`;

export function disponibilidadeUsarComodo(v: Vida, comodoId: string, usoId: string, pessoaId?: string): Veredito {
  const cm = comodosDaCasa(v).find(x => x.id === comodoId);
  if (!cm) return bloqueio('impossivel', 'A casa não tem esse cômodo.');
  const u = usosDoTipo(cm.tipo).find(x => x.id === usoId);
  if (!u) return bloqueio('impossivel', 'Isso não se faz aí.');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if (u.idadeMin && idade(v) < u.idadeMin) return bloqueio('impossivel', `A partir dos ${u.idadeMin} anos.`);
  if (!comodoEquipado(v, cm)) {
    const pede = COMODOS[cm.tipo]?.pede ?? [];
    return bloqueio('impossivel', `${cap(COMODOS[cm.tipo].artigo)} ${cm.nome} está vazi${COMODOS[cm.tipo].artigo === 'a' ? 'a' : 'o'}: falta ${pede.slice(0, 2).map(id => coisa(id)?.nome ?? id).join(' ou ')}.`);
  }
  if (u.trabalho && !trabalhaDeCasa(v)) return bloqueio('incompativel', v.trabalho.atual ? 'O seu trabalho não se faz de casa.' : 'Sem um trabalho agora.');
  if (u.estudo && !(v.educacao.basica && !v.educacao.evadiu) && !(v.educacao.matricula && !v.educacao.matricula.trancado)) return bloqueio('incompativel', 'Você não está estudando agora.');
  const f = v.fatos[chave(cm, usoId)];
  if (f !== undefined && Math.floor(f / 12) === ano(v)) return bloqueio('incompativel', 'Você já fez isso neste ano.');
  if (u.com === 'grupo') {
    if (!companhiasDoComodo(v, u).length) return bloqueio('incompativel', 'Ninguém por perto para chamar.');
  } else if (u.com) {
    if (!pessoaId) return companhiasDoComodo(v, u).length ? PERMITIDO : bloqueio('incompativel', u.com === 'casa' ? 'Ninguém mora com você para isso.' : 'Ninguém perto para isso agora.');
    if (!companhiasDoComodo(v, u, true).some(p => p.id === pessoaId)) return bloqueio('incompativel', 'Essa pessoa não está por perto para isso.');
  }
  if (u.custo) return vereditoDePagar(v, arred(u.custo * custo(v)), 'Custa');
  return PERMITIDO;
}

/** Usa o cômodo: a prática, o corpo, a cabeça, o estudo, o trabalho e a relação. Devolve o que aconteceu. */
export function usarComodo(v: Vida, comodoId: string, usoId: string, pessoaId?: string): string {
  const cm = comodosDaCasa(v).find(x => x.id === comodoId)!;
  const u = usosDoTipo(cm.tipo).find(x => x.id === usoId)!;
  const r = rngDe(v.id, 'ucomodo', usoId, v.t);
  const k = u.qualidade ? fatorDaQualidade(nivelDoComodo(v, cm)) : 1;
  v.fatos[chave(cm, usoId)] = v.t;
  const vezes = (v.fatos[`ucomodo_vezes:${cm.tipo}:${usoId}`] = (v.fatos[`ucomodo_vezes:${cm.tipo}:${usoId}`] ?? 0) + 1);
  if (u.custo) pagar(v, arred(u.custo * custo(v)));
  if (u.pratica) praticar(v, r, u.pratica[0], u.pratica[1], 1.05 * k);
  if (u.feliz) v.mente.felicidade = clamp(v.mente.felicidade + Math.round(u.feliz * k));
  if (u.estresse) v.mente.estresse = clamp(v.mente.estresse + Math.round(u.estresse * k));
  if (u.forma) v.corpo.forma = clamp(v.corpo.forma + Math.round(u.forma * k));
  if (u.estudo) {
    const m = v.educacao.matricula;
    if (m && !m.trancado) m.desempenho = clamp(m.desempenho + u.estudo);
    else if (v.educacao.basica) v.educacao.basica.desempenho = clamp(v.educacao.basica.desempenho + u.estudo);
  }
  if (u.trabalho && v.trabalho.atual) v.trabalho.atual.desempenho = clamp(v.trabalho.atual.desempenho + Math.round(u.trabalho * k));
  const juntos: Pessoa[] = u.com === 'grupo' ? companhiasDoComodo(v, u) : pessoaId && v.pessoas[pessoaId] ? [v.pessoas[pessoaId]] : [];
  for (const p of juntos) {
    const vin = v.vinculos[p.id];
    if (!vin) continue;
    const h = (vin.habitos ??= {});
    const n = (h[`comodo:${cm.tipo}`] = (h[`comodo:${cm.tipo}`] ?? 0) + 1);
    // Com a mesma pessoa, o ganho encolhe (como em qualquer convivência repetida).
    const f = n <= 2 ? 1 : n <= 5 ? 0.7 : 0.45;
    vin.tUltimoContato = v.t;
    vin.proximidade = clamp(Math.round(vin.proximidade + (u.prox ?? 2) * f));
    if (u.com !== 'grupo') {
      v.anoAtual.acoes.push(`pessoa:comodo_${usoId}:${p.id}`);
      if (n === 1) lembrarCom(v, p.id, `${(u.rotuloCom ?? u.rotulo).replace('{nome}', p.nome)} pela primeira vez.`, 'ritual', 1);
      if (n === 3) lembrarCom(v, p.id, `${cap(u.rotulo.replace(/ com alguém| alguém/, ''))} com ${p.nome} virou costume de vocês.`, 'ritual', 2);
    }
  }
  // A primeira festa, a primeira sessão para todos: entra na Linha da Vida.
  if (u.com === 'grupo' && v.fatos[`ucomodo_primeiro:${cm.tipo}:${usoId}`] === undefined) {
    v.fatos[`ucomodo_primeiro:${cm.tipo}:${usoId}`] = v.t;
    escrever(v, { texto: `${cap(u.rotulo)} pela primeira vez: ${juntos.map(p => p.nome).slice(0, 4).join(', ')}${juntos.length > 4 ? ' e mais gente' : ''}.`, relevancia: 'cotidiano', tema: 'casa', escolha: true, pessoas: juntos.map(p => p.id) });
  }
  const nome = juntos.length === 1 ? juntos[0].nome : juntos.length ? 'todo mundo' : '';
  const texto = u.textos[(vezes - 1 + Math.floor(r.next() * u.textos.length)) % u.textos.length];
  const extra = u.custo ? ` (${fmt(arred(u.custo * custo(v)))})` : '';
  return cap(texto.replace(/\{nome\}/g, nome)) + extra;
}

/** Os usos de um cômodo, para a tela (com o veredito e quem pode ir junto). */
export function usosDoComodo(v: Vida, comodoId: string): { uso: UsoDoComodo; veredito: Veredito; companhias: Pessoa[] }[] {
  const cm = comodosDaCasa(v).find(x => x.id === comodoId);
  if (!cm) return [];
  return usosDoTipo(cm.tipo).map(uso => ({ uso, veredito: disponibilidadeUsarComodo(v, comodoId, uso.id), companhias: companhiasDoComodo(v, uso) }));
}

/* ================================================================ o lado de fora */

/** Só casa própria tem o lado de fora para escolher (o apartamento tem a fachada do prédio). */
export function externoDisponivel(v: Vida): { ok: boolean; motivo?: string } {
  const m = v.moradia.modeloId ? modeloMoradia(v.moradia.modeloId) : undefined;
  if (!m?.casa) return { ok: false, motivo: 'Num apartamento, a fachada é do prédio: só a assembleia decide.' };
  if (poderSobreACasa(v) !== 'tudo') return { ok: false, motivo: 'A fachada e o jardim são do dono da casa.' };
  return { ok: true };
}

export const opcaoExterna = (a: AspectoExterno, id?: string): OpcaoExterna | undefined => OPCOES_EXTERNAS[a].find(o => o.id === id);
export const externoAtual = (v: Vida, a: AspectoExterno): string => donoDoLar(v)?.lar?.externo?.[a] ?? OPCOES_EXTERNAS[a][0].id;

/** As opções de um aspecto que cabem nesta casa (o paisagismo assinado pede terreno). */
export function opcoesExternasPara(v: Vida, a: AspectoExterno): OpcaoExterna[] {
  const terreno = plantaDaCasa(v).terreno;
  return OPCOES_EXTERNAS[a].filter(o => !o.terrenoMin || terreno >= o.terrenoMin);
}

/** A área que um aspecto cobre nesta casa (a frente, o terreno ajardinado, o caminho). */
function areaDoAspecto(v: Vida, a: AspectoExterno): number {
  const id = v.moradia.modeloId ?? 'casa_2q';
  if (a === 'fachada') return AREA_DA_FACHADA[id] ?? 40;
  if (a === 'caminho') return AREA_DO_CAMINHO[id] ?? 10;
  if (a === 'paisagismo') return Math.min(600, Math.max(15, plantaDaCasa(v).terreno * 0.6));
  return 1;
}

export function precoExterno(v: Vida, a: AspectoExterno, id: string): number {
  const o = opcaoExterna(a, id);
  if (!o) return 0;
  return arred((o.fixo ? o.preco : o.preco * areaDoAspecto(v, a)) * custo(v));
}

export interface ItemExterno { aspecto: AspectoExterno; opcao: string; nome: string; antes: string; preco: number }
export function reformaExterna(v: Vida, mudancas: Partial<Record<AspectoExterno, string>>): { itens: ItemExterno[]; total: number } {
  const itens: ItemExterno[] = [];
  for (const a of ASPECTOS_EXTERNOS) {
    const id = mudancas[a];
    if (!id || id === externoAtual(v, a)) continue;
    const o = opcaoExterna(a, id);
    if (!o) continue;
    itens.push({ aspecto: a, opcao: id, nome: o.nome, antes: opcaoExterna(a, externoAtual(v, a))?.nome ?? '', preco: precoExterno(v, a, id) });
  }
  return { itens, total: itens.reduce((s, x) => s + x.preco, 0) };
}

export function disponibilidadeReformaExterna(v: Vida, mudancas: Partial<Record<AspectoExterno, string>>): Veredito {
  if (idade(v) < 18) return bloqueio('impossivel', 'A partir dos 18.');
  const d = externoDisponivel(v);
  if (!d.ok) return bloqueio('impossivel', d.motivo!);
  const im = imovelDaMoradia(v);
  if (im?.problema) return bloqueio('incompativel', 'Primeiro, o reparo que está pendente.');
  for (const a of Object.keys(mudancas) as AspectoExterno[]) {
    if (!ASPECTOS_EXTERNOS.includes(a)) return bloqueio('impossivel', 'Isso não existe.');
    const id = mudancas[a];
    if (id && !opcoesExternasPara(v, a).some(o => o.id === id)) return bloqueio('impossivel', `${NOME_DO_ASPECTO_EXTERNO[a]}: o terreno desta casa não comporta isso.`);
  }
  const r = reformaExterna(v, mudancas);
  if (!r.itens.length) return bloqueio('incompativel', 'Nada mudou na prévia.');
  return vereditoDePagar(v, r.total, 'A obra custa');
}

export function fazerReformaExterna(v: Vida, mudancas: Partial<Record<AspectoExterno, string>>): string {
  const r = reformaExterna(v, mudancas);
  pagar(v, r.total);
  const dono = donoDoLar(v)!;
  const lar = (dono.lar ??= { extras: [], acabamentos: {} });
  const ext = (lar.externo ??= {});
  for (const x of r.itens) ext[x.aspecto] = x.opcao;
  const partes = r.itens.map(x => `${NOME_DO_ASPECTO_EXTERNO[x.aspecto].toLowerCase()}: ${x.nome}`);
  registrarNoObjeto(lar, v.t, `Lado de fora: ${partes.join('; ')} (${fmt(r.total)}).`);
  const im = imovelDaMoradia(v);
  // A obra de fora valoriza o imóvel pela metade do que custou (a fachada boa vende a casa; o gosto pessoal, não tanto).
  if (im) { im.valor = Math.round((im.valor + r.total * 0.5) / 1000) * 1000; (im.historia ??= []).push({ t: v.t, texto: `Obra do lado de fora: ${partes.join('; ')}.` }); }
  v.mente.felicidade = clamp(v.mente.felicidade + 1);
  if (r.total >= 20000) escrever(v, { texto: `A casa ganhou outra cara do lado de fora: ${partes.join('; ')}.`, relevancia: 'cotidiano', tema: 'casa', escolha: true });
  return `Obra feita: ${partes.join('; ')}. ${fmt(r.total)}, entre material e mão de obra.`;
}

/** O que custa por mês o lado de fora escolhido (o jardineiro do paisagismo, a luz, o verniz da madeira). */
export function custoMensalDoExterno(v: Vida): { rotulo: string; valor: number }[] {
  const ext = donoDoLar(v)?.lar?.externo;
  if (!ext || poderSobreACasa(v) !== 'tudo') return [];
  let soma = 0;
  for (const a of ASPECTOS_EXTERNOS) {
    const o = opcaoExterna(a, ext[a]);
    if (!o?.manutencao) continue;
    soma += o.fixo ? o.manutencao : o.manutencao * areaDoAspecto(v, a);
  }
  return soma > 0 ? [{ rotulo: 'Jardim, fachada e luz de fora (manutenção)', valor: Math.round(soma * custo(v)) }] : [];
}
PATRIMONIO_NO_MES.push(custoMensalDoExterno);
