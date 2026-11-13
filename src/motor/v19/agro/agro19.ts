/**
 * VIDA 19 · O CAMPO NA JUSTIÇA, NO AMBIENTE E NA POLÍTICA AGRÍCOLA — e as empresas do campo (pendências da VIDA 18).
 *
 * Reaproveita tudo: a propriedade rural (`v18/rural`), a Justiça das causas cíveis e multas (`v14/justica`), o sistema
 * de empresas (`sistemas/empresas`). Nada paralelo.
 *
 *   CAR             Cadastro Ambiental Rural (Lei 12.651/2012, art. 29): obrigatório; sem ele, banco não empresta para a
 *                   lavoura (art. 78-A) e o seguro não tem a subvenção federal (PSR). Inscrever custa a consultoria.
 *   GEORREFERENCIAMENTO  o mapa certificado da divisa (Lei 10.267/2001): sem ele, a cerca do vizinho é discussão — às
 *                   vezes, ação de divisa (pela Justiça de sempre, `justica14`, tipo 'divisa').
 *   OUTORGA         irrigar tira água de rio ou poço: pede outorga de uso (Lei 9.433/1997). Sem ela, a fiscalização
 *                   ambiental multa (Decreto 6.514/2008) — a multa entra como causa, com defesa ou pagamento.
 *   PLANO SAFRA     o crédito de custeio com juros controlados (referências 2025/26, MAPA): Pronaf (agricultura familiar,
 *                   2% a 8% ao ano — aqui 4%), Pronamp (médio produtor, 10%), demais (14%); −0,5 ponto com o CAR já
 *                   validado (dois anos) e −0,5 com prática sustentável (orgânico). O crédito tem finalidade: dinheiro
 *                   tomado sem lavoura nem criação é desvio — o banco cobra tudo antes, com multa. Seca ou enchente na
 *                   região no ano do vencimento: a parcela é prorrogada uma vez (renegociação por frustração de safra).
 *   EMPRESAS DO CAMPO  a agroindústria e o laticínio (`dados/empresas`): quem tem a terra que produz a matéria-prima vende
 *                   para a própria empresa pelo preço de mercado — a fazenda conta a venda uma vez, a empresa conta a
 *                   compra uma vez (nenhuma receita contada duas vezes) — e ganha no frete curto e no selo de origem.
 *
 * Sorteios: `rngDe` da propriedade e do ano.
 */
import type { Empresa, Vida } from '../../tipos';
import { rngDe } from '../../rng';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { escrever, idade } from '../../nucleo';
import { anoDe } from '../../tempo';
import { dinheiro as fmt } from '../../texto';
import { lancar } from '../../sistemas/extrato';
import { vereditoDePagar } from '../../sistemas/dinheiro';
import { GANCHOS_EMPRESA } from '../../sistemas/empresas';
import { economiaLocal, paisDaCidade } from '../../dados/lugares';
import { novoCaso14, casos14 } from '../../v14/justica/justica14';
import { acharPropriedade, todasAsPropriedades, type PropriedadeRural18 } from '../../v18/rural/fazenda18';

export const SAFRA19 = {
  /** Os tetos de renda bruta agropecuária anual de cada linha (referências 2025/26). */
  tetoPronaf: 500_000, tetoPronamp: 3_500_000,
  taxa: { pronaf: 0.04, pronamp: 0.10, demais: 0.14 },
  descontoCar: 0.005, descontoSustentavel: 0.005,
  fontes: 'MAPA, Plano Safra 2025/26 (custeio Pronamp 10% a.a., demais 14% a.a., Pronaf 2–8% a.a.; desconto de 0,5 p.p. com CAR); Lei 12.651/2012 arts. 29 e 78-A; Lei 10.267/2001; Lei 9.433/1997; Decreto 6.514/2008; Lei 10.823/2003 (PSR).'
} as const;

export type OqueAgro19 =
  | { op: 'car'; id: string }
  | { op: 'georreferenciar'; id: string }
  | { op: 'outorga'; id: string }
  | { op: 'credito'; id: string }
  | { op: 'quitar'; id: string };

const custoLocal = (_v: Vida, municipioId: string) => Math.max(0.6, economiaLocal(municipioId).custo);
const r100 = (x: number) => Math.round(x / 100) * 100;
const irrigada = (p: PropriedadeRural18) => p.talhoes.filter(t => t.irrigado).reduce((s, t) => s + t.ha, 0);
const noBrasil = (p: PropriedadeRural18) => paisDaCidade(p.municipioId) === 'BR';

export function custoAgro19(v: Vida, p: PropriedadeRural18, op: OqueAgro19['op']): number {
  const c = custoLocal(v, p.municipioId);
  if (op === 'car') return r100((1500 + p.ha * 8) * c);
  if (op === 'georreferenciar') return r100(Math.max(3000, p.ha * 25) * c);
  if (op === 'outorga') return r100(4000 * c);
  return 0;
}

/** A linha do Plano Safra pela renda bruta da propriedade no último ano. */
export function linhaDoCredito19(p: PropriedadeRural18): { linha: 'pronaf' | 'pronamp' | 'demais'; taxa: number; limite: number } {
  const bruta = p.historico.slice(-1)[0]?.receita ?? 0;
  const linha = bruta <= SAFRA19.tetoPronaf ? 'pronaf' : bruta <= SAFRA19.tetoPronamp ? 'pronamp' : 'demais';
  const ano = p.historico.slice(-1)[0]?.ano ?? 0;
  const validado = p.car19 !== undefined && ano - p.car19 >= 2;
  const taxa = Math.round((SAFRA19.taxa[linha] - (validado ? SAFRA19.descontoCar : 0) - (p.manejo === 'organico' ? SAFRA19.descontoSustentavel : 0)) * 1000) / 1000;
  // O custeio cobre o custo de um ano de lavoura e criação (o que a fazenda gastou no último ano).
  const custo = p.historico.slice(-1)[0]?.custo ?? 0;
  const limite = r100(Math.min(linha === 'pronaf' ? 250_000 : linha === 'pronamp' ? 1_500_000 : 5_000_000, Math.max(0, custo)));
  return { linha, taxa, limite };
}

export function disponibilidadeAgro19(v: Vida, q: OqueAgro19): Veredito {
  if (idade(v) < 18) return bloqueio('requisito', 'Só a partir dos 18.');
  const x = acharPropriedade(v, q.id);
  if (!x || !x.imovel) return bloqueio('impossivel', 'Essa terra não é sua (arrendada: a documentação é do dono).');
  const p = x.p;
  if (!noBrasil(p)) return bloqueio('impossivel', 'Essas regras são as do Brasil; a propriedade fica em outro país.');
  const ano = anoDe(v.t);
  switch (q.op) {
    case 'car': return p.car19 !== undefined ? bloqueio('incompativel', `O CAR está feito desde ${p.car19}.`) : vereditoDePagar(v, custoAgro19(v, p, 'car'), 'Custa');
    case 'georreferenciar': return p.geo19 !== undefined ? bloqueio('incompativel', `A divisa está certificada desde ${p.geo19}.`) : vereditoDePagar(v, custoAgro19(v, p, 'georreferenciar'), 'Custa');
    case 'outorga': return p.outorga19 !== undefined ? bloqueio('incompativel', 'A outorga de água está em dia.') : !irrigada(p) ? bloqueio('incompativel', 'Sem irrigação, não precisa de outorga.') : vereditoDePagar(v, custoAgro19(v, p, 'outorga'), 'Custa');
    case 'credito': {
      if (p.car19 === undefined) return bloqueio('requisito', 'Sem o CAR, o banco não libera crédito rural (Código Florestal, art. 78-A).');
      if (p.uso !== 'producao') return bloqueio('requisito', 'Crédito de custeio é para quem produz.');
      if (p.safra19) return bloqueio('incompativel', `Já há um custeio em aberto (vence em ${p.safra19.vence}).`);
      if (!p.historico.length) return bloqueio('requisito', 'O banco pede ao menos um ano de produção registrado.');
      return linhaDoCredito19(p).limite > 0 ? PERMITIDO : bloqueio('incompativel', 'Sem custo de produção a financiar.');
    }
    case 'quitar': return !p.safra19 ? bloqueio('incompativel', 'Nenhum custeio em aberto.') : vereditoDePagar(v, r100(p.safra19.valor * (1 + p.safra19.taxa)), 'Custa');
  }
  void ano;
}

export function executarAgro19(v: Vida, q: OqueAgro19): { texto: string; tom?: 'bom' | 'ruim' | 'neutro' } {
  const p = acharPropriedade(v, q.id)!.p;
  const ano = anoDe(v.t);
  const pagar = (valor: number, oque: string) => { v.financas.conta -= valor; lancar(v, oque, 'despesa', -valor); };
  switch (q.op) {
    case 'car': pagar(custoAgro19(v, p, 'car'), `CAR: ${p.nome}`); p.car19 = ano; return { texto: `${p.nome} está no Cadastro Ambiental Rural. Abre o crédito rural e a subvenção do seguro; o desconto nos juros vem quando o cadastro for validado.`, tom: 'bom' };
    case 'georreferenciar': pagar(custoAgro19(v, p, 'georreferenciar'), `Georreferenciamento: ${p.nome}`); p.geo19 = ano; return { texto: `A divisa de ${p.nome} foi medida e certificada: acaba a discussão de cerca com os vizinhos.`, tom: 'bom' };
    case 'outorga': pagar(custoAgro19(v, p, 'outorga'), `Outorga de água: ${p.nome}`); p.outorga19 = ano; return { texto: 'A outorga de uso da água saiu: a irrigação está regularizada.', tom: 'bom' };
    case 'credito': {
      const l = linhaDoCredito19(p);
      p.safra19 = { ano, linha: l.linha, taxa: l.taxa, valor: l.limite, vence: ano + 1 };
      v.financas.conta += l.limite;
      lancar(v, `Custeio do Plano Safra (${l.linha === 'pronaf' ? 'Pronaf' : l.linha === 'pronamp' ? 'Pronamp' : 'demais produtores'}): ${p.nome}`, 'renda', l.limite);
      return { texto: `O banco liberou ${fmt(l.limite)} de custeio (${l.linha === 'pronaf' ? 'Pronaf' : l.linha === 'pronamp' ? 'Pronamp' : 'demais produtores'}, ${(l.taxa * 100).toFixed(1).replace('.', ',')}% ao ano). Vence em ${ano + 1}, e é para a lavoura e a criação: sem produção, é desvio de finalidade.`, tom: 'bom' };
    }
    case 'quitar': {
      const s = p.safra19!;
      const total = r100(s.valor * (1 + s.taxa));
      pagar(total, `Quitação do custeio: ${p.nome}`);
      p.safra19 = undefined;
      return { texto: `Custeio quitado: ${fmt(total)}.` };
    }
  }
}

/** O ano do campo na Justiça, no ambiente e no banco (depois do ano das fazendas: o clima e a produção já são sabidos). */
export function processarAgro19(v: Vida): void {
  if (v.morte || idade(v) < 18) return;
  const ano = anoDe(v.t);
  for (const { p, imovel } of todasAsPropriedades(v)) {
    if (!imovel || !noBrasil(p)) continue;
    const r = rngDe(v.id, 'agro19', p.id, ano);
    const c = custoLocal(v, p.municipioId);
    // O crédito vence: a seca ou a enchente da região prorroga uma vez; sem produção, é desvio de finalidade.
    const s = p.safra19;
    if (s && ano > s.ano) {
      const semProducao = !p.talhoes.length && !p.rebanhos.length;
      const ultimo = p.historico.slice(-1)[0];
      if (semProducao) {
        const total = r100(s.valor * (1 + s.taxa) * 1.1);
        v.financas.conta -= total; lancar(v, `Custeio cobrado antes do prazo (desvio de finalidade): ${p.nome}`, 'despesa', -total);
        p.safra19 = undefined;
        escrever(v, { texto: `O banco descobriu que o custeio de ${p.nome} não foi para lavoura nem criação: cobrou tudo de uma vez, com multa (${fmt(total)}).`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
      } else if (ano >= s.vence) {
        if (!s.prorrogado && ultimo && (ultimo.clima === 'seca' || ultimo.clima === 'enchente' || ultimo.clima === 'geada' || ultimo.clima === 'granizo')) {
          s.prorrogado = true; s.vence = ano + 1;
          escrever(v, { texto: `Com a quebra de safra na região, o banco prorrogou por um ano o custeio de ${p.nome} (renegociação por frustração de safra).`, relevancia: 'cotidiano', tema: 'dinheiro', tom: 'neutro' });
        } else {
          const total = r100(s.valor * (1 + s.taxa * (s.prorrogado ? 2 : 1)));
          v.financas.conta -= total; lancar(v, `Custeio do Plano Safra pago: ${p.nome}`, 'despesa', -total);
          p.safra19 = undefined;
          escrever(v, { texto: `O custeio de ${p.nome} venceu e foi pago: ${fmt(total)}.`, relevancia: 'cotidiano', tema: 'dinheiro' });
        }
      }
    }
    if (p.uso !== 'producao') continue;
    const jaTem = (tipo: 'multa' | 'divisa') => casos14(v).some(x => x.tipo === tipo && x.contra.includes(p.nome));
    // Irrigar sem outorga: a fiscalização ambiental passa (uma vez a cada alguns anos, em média).
    const ha = irrigada(p);
    if (ha > 0 && p.outorga19 === undefined && !jaTem('multa') && r.chance(0.14)) {
      const valor = r100((5000 + ha * 120) * c);
      novoCaso14(v, { tipo: 'multa', polo: 'reu', contra: `o órgão ambiental (irrigação sem outorga em ${p.nome})`, valor, razao: 0.18 });
      escrever(v, { texto: `A fiscalização ambiental passou por ${p.nome}: irrigação sem outorga de uso da água. Auto de infração de ${fmt(valor)} — dá para se defender ou pagar.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    }
    // A divisa sem certificação: a cerca do vizinho vira ação.
    if (p.geo19 === undefined && p.ha >= 20 && !jaTem('divisa') && r.chance(0.025)) {
      const faixa = Math.max(0.5, Math.round(p.ha * (0.01 + r.next() * 0.03) * 10) / 10);
      const valor = r100(faixa * p.valorHa);
      const autor = r.chance(0.5);
      novoCaso14(v, { tipo: 'divisa', polo: autor ? 'autor' : 'reu', contra: `o vizinho de ${p.nome}`, valor, razao: 0.5 + (autor ? 0.05 : 0), ...(autor ? { pendente: true } : {}) });
      escrever(v, { texto: autor ? `O vizinho de ${p.nome} avançou a cerca: ${faixa.toLocaleString('pt-BR')} ha que são seus, pela escritura. Dá para entrar com a ação de divisa.` : `O vizinho de ${p.nome} entrou na Justiça: diz que ${faixa.toLocaleString('pt-BR')} ha da sua cerca são dele.`, relevancia: 'biografia', tema: 'dinheiro', tom: 'ruim' });
    }
  }
}

/* ================================================================== As empresas do campo */

/**
 * A matéria-prima da terra da própria pessoa: a fração do que a empresa usa que sai das suas propriedades (o leite do
 * rebanho, para o laticínio; a lavoura, para a agroindústria). Sem atravessador: o variável cai até 12% na parte coberta;
 * o selo de origem puxa a procura até 5%. A venda da fazenda segue contada uma vez só, no ano da fazenda.
 */
export function insumoProprio19(v: Vida, e: Empresa): { fracao: number; procura: number; variavel: number } | undefined {
  if (e.tipo !== 'laticinio' && e.tipo !== 'agroindustria') return undefined;
  const props = todasAsPropriedades(v).map(x => x.p).filter(p => p.uso === 'producao');
  if (!props.length) return undefined;
  const fracao = e.tipo === 'laticinio'
    ? Math.min(1, props.reduce((s, p) => s + (p.rebanhos.find(r => r.especie === 'leite')?.cabecas ?? 0), 0) / (120 * Math.max(1, e.unidades)))
    : Math.min(1, props.reduce((s, p) => s + p.talhoes.reduce((a, t) => a + t.ha, 0), 0) / (150 * Math.max(1, e.unidades)));
  if (fracao <= 0) return undefined;
  return { fracao, procura: 1 + 0.05 * fracao, variavel: 1 - 0.12 * fracao };
}

GANCHOS_EMPRESA.insumo = (v, e) => { const i = insumoProprio19(v, e); return i ? { procura: i.procura, variavel: i.variavel } : undefined; };
