/**
 * REWORK 10 · NPC-03 — QUEM ESTÁ NA VIDA DE QUEM VOCÊ CONHECE. O cônjuge de um irmão, a namorada de um filho, os pais
 * da sua parceria, o outro pai de um neto: gente sem vínculo direto com você — `processarMortes` percorre os vínculos e
 * não passava por elas, que ficavam vivas para sempre. Aqui elas envelhecem e morrem pelo mesmo corpo de NPC
 * (`corpo.processarCorpoDePessoa`), e a perda chega a quem você conhece: a parceria acaba, o luto fica na pessoa
 * (o "estar junto" abre), e a história de vocês dois lembra.
 *
 * Só entra quem está ligado a alguém vivo da sua vida (a parceria ou a filiação de um vínculo): o resto do mundo não
 * pesa no ano. O sorteio é derivado (da pessoa e do ano): não mexe no gerador da vida.
 */
import type { Pessoa, Vida } from '../tipos';
import { rngDe } from '../rng';
import { escrever, idadePessoa, lembrarCom, vinculosVivos } from '../nucleo';
import { processarCorpoDePessoa } from './corpo';
import { flex } from '../texto';
import { citadosEmRegistrosVivos, esquecerMorto } from './citacoes';

/** Os indiretos vivos de agora, cada um com a pessoa da sua vida a quem está ligado (e como). */
export function indiretos(v: Vida): { q: Pessoa; de: Pessoa; como: 'parceria' | 'genitor' }[] {
  const out: { q: Pessoa; de: Pessoa; como: 'parceria' | 'genitor' }[] = [];
  const vistos = new Set<string>();
  for (const { p } of vinculosVivos(v)) {
    if (p.especie) continue;
    const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
    if (par?.vivo && !v.vinculos[par.id] && !vistos.has(par.id)) { vistos.add(par.id); out.push({ q: par, de: p, como: 'parceria' }); }
    for (const g of p.genitores ?? []) {
      const q = v.pessoas[g];
      if (q?.vivo && !q.especie && !v.vinculos[q.id] && !vistos.has(q.id)) { vistos.add(q.id); out.push({ q, de: p, como: 'genitor' }); }
    }
  }
  return out;
}

export function processarIndiretos(v: Vida): void {
  for (const { q, de, como } of indiretos(v)) {
    const causa = processarCorpoDePessoa(v, rngDe(v.id, 'indireto', q.id, v.t), q, false);
    if (!causa) continue;
    const anos = idadePessoa(v, q);
    q.vivo = false;
    q.tMorte = v.t;
    q.causaMorte = causa;
    if (como === 'parceria') { de.parceiroId = undefined; q.parceiroId = undefined; }
    de.aperto = { tipo: 'luto', t: v.t };
    const rotulo = como === 'parceria' ? flex(q.genero, 'o companheiro', 'a companheira', 'e companheire') : flex(q.genero, 'o pai', 'a mãe', 'e genitore');
    const vin = v.vinculos[de.id];
    const perto = (vin?.proximidade ?? 0) >= 55 || !!vin?.romance;
    escrever(v, { texto: `${q.nome}, ${rotulo} de ${de.nome}, morreu aos ${anos} anos.${perto ? ` ${de.nome} ficou muito abalad${flex(de.genero, 'o', 'a', 'e')}.` : ''}`, relevancia: perto ? 'biografia' : 'cotidiano', tema: 'familia', pessoas: [de.id] });
    lembrarCom(v, de.id, como === 'parceria' ? `Perdeu ${q.nome}.` : `Perdeu ${flex(q.genero, 'o pai', 'a mãe', 'e genitore')}, ${q.nome}.`, 'perda', 2);
  }
}

/**
 * REWORK 10.6 · P8 — O RESTO DO MUNDO TAMBÉM ENVELHECE. Quem não tem vínculo com você nem está ligado a alguém da sua vida
 * (o colega de um emprego antigo que saiu da lista, o filho de um conhecido, a família de quem já morreu) ficava vivo
 * para sempre: o mundo acumulava gente imortal. Aqui, uma conta leve por ano (a mortalidade pela idade, sem o corpo
 * detalhado de quem importa): sem notícia — não há ninguém da sua vida para quem isso seja perda —, mas a pessoa deixa
 * de existir para os registros e os acontecimentos (ninguém liga de um morto). Sorteio derivado: não mexe na vida.
 */
export function processarDistantes(v: Vida): number {
  // REWORK 11 · NPC-11.2: quem um registro em curso cita (a proposta, a produção, o agente) também está ligado.
  const ligados = new Set([...indiretos(v).map(x => x.q.id), ...v.caminhos.oportunidades.map(o => o.pessoaId).filter((x): x is string => !!x), ...citadosEmRegistrosVivos(v)]);
  let mortes = 0;
  for (const p of Object.values(v.pessoas)) {
    if (!p.vivo || p.especie || v.vinculos[p.id] || ligados.has(p.id)) continue;
    const anos = idadePessoa(v, p);
    // Uma curva de mortalidade simples (Gompertz): quase nada na juventude, ~1% aos 60, ~6% aos 80, quase certo aos 105.
    const q = anos < 1 ? 0.004 : Math.min(0.6, 0.0004 + 0.00005 * Math.exp(0.088 * anos));
    if (!rngDe(v.id, 'distante', p.id, v.t).chance(q)) continue;
    p.vivo = false;
    p.tMorte = v.t;
    p.causaMorte = anos >= 80 ? 'causas naturais' : 'uma doença';
    esquecerMorto(v, p.id);
    const par = p.parceiroId ? v.pessoas[p.parceiroId] : undefined;
    if (par && par.parceiroId === p.id && !v.vinculos[par.id]) par.parceiroId = undefined;
    mortes++;
  }
  return mortes;
}
