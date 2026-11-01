/**
 * VIDA 12.5 — A RETROSPECTIVA DA VIDA: a linha do tempo e o álbum de memórias, montados SÓ do que o save já registra.
 *
 * Nada novo é guardado: o álbum é lido a cada vez (por isso sobrevive a salvar, sair e carregar, e funciona em saves
 * antigos — com o que eles tiverem). As fontes, das mais confiáveis para as menos (auditoria 12.5, `memorias.md`):
 *
 *   estruturas   o nascimento (`eu.tNasc`), as formaturas (`educacao.concluidos`), os empregos (`trabalho.historico`),
 *                a aposentadoria, os filhos e netos (`pessoas`, por `tNasc`), as mortes da família (`tMorte`), os
 *                títulos e prêmios (`caminhos.palmares`), os mandatos (`politica.historico`), as mudanças de país
 *                (`mundo.migracoes`), a prisão (`justica.antecedentes`);
 *   biografia    a Linha da Vida nunca é podada: as entradas de relevância 'marco' e 'biografia' viram memórias — pelo
 *                `fato` (as marcadas desde a 12.5: viagem, compra, mudança, promoção, prêmio, fama, tatuagem, pet),
 *                pelo `evento` (namoro, união, divórcio, viuvez…) ou, nos saves antigos, pelo começo da frase e o tema.
 *
 * Quando a estrutura e a biografia contam a mesma coisa (o filho que nasceu, a formatura), fica uma memória só: o
 * título da estrutura e a frase da biografia. As frases repetidas (a fila do banco ×14) e o noticiário do mundo ficam
 * de fora. Nunca se inventa uma memória: sem registro, a categoria fica vazia.
 */
import type { Entrada, Vida } from '../tipos';
import { anoDe, idadeEm } from '../tempo';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { existeMunicipio, municipio } from '../dados/lugares';

export type CategoriaDaMemoria = 'familia' | 'relacionamentos' | 'educacao' | 'carreira' | 'esportes' | 'patrimonio' | 'viagens' | 'conquistas' | 'momentos';

export const CATEGORIAS_DA_MEMORIA: { id: CategoriaDaMemoria; rotulo: string }[] = [
  { id: 'familia', rotulo: 'Família' }, { id: 'relacionamentos', rotulo: 'Relacionamentos' }, { id: 'educacao', rotulo: 'Educação' },
  { id: 'carreira', rotulo: 'Carreira' }, { id: 'esportes', rotulo: 'Esportes' }, { id: 'patrimonio', rotulo: 'Patrimônio' },
  { id: 'viagens', rotulo: 'Viagens' }, { id: 'conquistas', rotulo: 'Conquistas' }, { id: 'momentos', rotulo: 'Momentos especiais' }
];

export interface Memoria {
  id: string;
  t: number;
  idade: number;
  ano: number;
  categoria: CategoriaDaMemoria;
  /** O tipo do acontecimento (para o ícone e para juntar a estrutura com a frase da biografia). */
  tipo: string;
  titulo: string;
  texto: string;
  /** 0 comum · 1 importante · 2 marcante (destaque visual). */
  destaque: 0 | 1 | 2;
  tom?: 'bom' | 'ruim' | 'neutro';
  pessoaId?: string;
  /** Veio de uma entrada da Linha da Vida (o id dela). */
  entradaId?: string;
}

const g = (v: Vida, m: string, f: string) => (v.eu.genero === 'feminino' ? f : m);
const ocNome = (v: Vida, id: string) => { const oc = ocupacaoOuNula(id); return oc ? oc.nome[v.eu.genero === 'feminino' ? 1 : 0] : id.replace(/_/g, ' '); };
const cidade = (id?: string) => (id && existeMunicipio(id) ? municipio(id).nome : undefined);

/* ------------------------------------------------------------------ a biografia: o que cada entrada é */

interface Leitura { categoria: CategoriaDaMemoria; tipo: string; titulo: string; destaque: 0 | 1 | 2; pessoaId?: string }

/** Os começos de frase que identificam o acontecimento nos saves antigos (sem `fato` nem `evento`). */
const PELO_TEXTO: [RegExp, (e: Entrada, v: Vida) => Leitura][] = [
  [/^Casou-se com ([^:.,]+)/, (e, v) => ({ categoria: 'relacionamentos', tipo: 'casamento', titulo: `Casamento com ${nomeNaFrase(e, /^Casou-se com ([^:.,]+)/)}`, destaque: 2, pessoaId: e.pessoas?.[0] ?? quemNaFrase(v, e) })],
  [/^Foi morar junto com |^Foi morar com /, e => ({ categoria: 'relacionamentos', tipo: 'uniao', titulo: 'Morar junto', destaque: 1, pessoaId: e.pessoas?.[0] })],
  [/^Começou a namorar |^Começaram a namorar/, e => ({ categoria: 'relacionamentos', tipo: 'namoro', titulo: 'Um namoro', destaque: 0, pessoaId: e.pessoas?.[0] })],
  [/^(Divorciou-se|Separou-se)/, e => ({ categoria: 'relacionamentos', tipo: 'divorcio', titulo: 'O fim do casamento', destaque: 1, pessoaId: e.pessoas?.[0] })],
  [/^(Aprovad[oae] em|Passou no vestibular)/, () => ({ categoria: 'educacao', tipo: 'aprovacao', titulo: 'Aprovação', destaque: 1 })],
  [/^Primeiro emprego|^Começou a ganhar a vida como/, () => ({ categoria: 'carreira', tipo: 'primeiro_emprego', titulo: 'O primeiro emprego', destaque: 1 })],
  [/^Novo emprego: |^Mudou de emprego/, () => ({ categoria: 'carreira', tipo: 'emprego', titulo: 'Um trabalho novo', destaque: 0 })],
  [/^Foi demitid[oae]|^Perdeu o emprego/, () => ({ categoria: 'carreira', tipo: 'demissao', titulo: 'Uma demissão', destaque: 0 })],
  [/^Promovid[oae]/, () => ({ categoria: 'carreira', tipo: 'promocao', titulo: 'Promoção', destaque: 1 })],
  [/^Aposentou-se|^Foi para a reserva/, () => ({ categoria: 'carreira', tipo: 'aposentadoria', titulo: 'A aposentadoria', destaque: 1 })],
  [/^Abriu /, () => ({ categoria: 'carreira', tipo: 'negocio', titulo: 'O próprio negócio', destaque: 1 })],
  [/^Eleit[oae] /, () => ({ categoria: 'conquistas', tipo: 'mandato', titulo: 'Eleição', destaque: 2 })],
  // Só prêmio de verdade ("Ganhou o prêmio…", "Ganhou: …"); "Ganhou bicicleta de aniversário" não é conquista.
  [/^Ganhou: |^Ganhou (o |um |a )?(prêmio|troféu)/i, () => ({ categoria: 'conquistas', tipo: 'premio', titulo: 'Um prêmio', destaque: 2 })],
  [/^(Passou a ser reconhecid|Ficou famos|Virou um nome)/, () => ({ categoria: 'conquistas', tipo: 'fama', titulo: 'O reconhecimento', destaque: 1 })],
  [/^(Viajou para|Lua de mel em) /, () => ({ categoria: 'viagens', tipo: 'viagem', titulo: 'Uma viagem', destaque: 0 })],
  [/^Comprou (a primeira casa|o primeiro imóvel)/, () => ({ categoria: 'patrimonio', tipo: 'imovel', titulo: 'A primeira casa própria', destaque: 2 })],
  [/^Comprou (o primeiro|a primeira) /, () => ({ categoria: 'patrimonio', tipo: 'veiculo', titulo: 'O primeiro veículo', destaque: 1 })],
  [/^Mudou-se de |(^|e )mudou-se para /, () => ({ categoria: 'momentos', tipo: 'mudanca', titulo: 'Uma mudança', destaque: 1 })],
  [/primeiros passos/i, () => ({ categoria: 'familia', tipo: 'primeiros_passos', titulo: 'Os primeiros passos', destaque: 0 })],
  [/^Saiu da casa d(a família|os pais)/, () => ({ categoria: 'momentos', tipo: 'saiu_de_casa', titulo: 'Saiu de casa', destaque: 1 })],
  [/^A primeira tatuagem/, () => ({ categoria: 'momentos', tipo: 'tatuagem', titulo: 'A primeira tatuagem', destaque: 0 })],
  [/^Condenad[oae] a/, () => ({ categoria: 'momentos', tipo: 'prisao', titulo: 'A condenação', destaque: 1 })]
];

function nomeNaFrase(e: Entrada, re: RegExp): string { return re.exec(e.texto)?.[1]?.trim() ?? ''; }
function quemNaFrase(v: Vida, e: Entrada): string | undefined {
  const nome = nomeNaFrase(e, /^Casou-se com ([^:.,]+)/);
  return Object.values(v.pessoas).find(p => p.nome === nome)?.id;
}
const nomeDe = (v: Vida, id?: string) => (id ? v.pessoas[id]?.nome : undefined);

/** O que a entrada é (ou nada, se não é memória de álbum). */
export function lerEntrada(v: Vida, e: Entrada): Leitura | undefined {
  const f = e.fato;
  if (f) {
    const d = f.dados ?? {};
    switch (f.tipo) {
      case 'mundo': case 'febre': return undefined;
      case 'primeiro_dia': return { categoria: 'educacao', tipo: 'escola', titulo: 'O primeiro dia de aula', destaque: 1 };
      case 'm_viagem': return { categoria: 'viagens', tipo: 'viagem', titulo: d.lua ? `Lua de mel: ${d.destino}` : `Viagem: ${d.destino}`, destaque: d.lua ? 1 : 0 };
      case 'm_veiculo': return d.primeiro ? { categoria: 'patrimonio', tipo: 'veiculo', titulo: 'O primeiro veículo', destaque: 1 } : e.relevancia === 'cotidiano' ? undefined : { categoria: 'patrimonio', tipo: 'veiculo', titulo: 'Um veículo novo', destaque: 0 };
      case 'm_imovel': return { categoria: 'patrimonio', tipo: 'imovel', titulo: d.primeiro ? 'A primeira casa própria' : 'Mais um imóvel', destaque: d.primeiro ? 2 : 1 };
      case 'm_mudanca': return { categoria: 'momentos', tipo: 'mudanca', titulo: `Mudança para ${d.para}`, destaque: 1 };
      case 'm_migracao': return { categoria: 'momentos', tipo: 'migracao', titulo: `Outro país: ${d.para}`, destaque: 2 };
      case 'm_promocao': return { categoria: 'carreira', tipo: 'promocao', titulo: `Promoção: ${d.para}`, destaque: Number(d.nivel) >= 4 ? 2 : 1 };
      case 'm_aposentadoria': return { categoria: 'carreira', tipo: 'aposentadoria', titulo: 'A aposentadoria', destaque: 1 };
      case 'm_fama': return { categoria: 'conquistas', tipo: 'fama', titulo: 'O reconhecimento', destaque: Number(d.faixa) >= 3 ? 2 : 1 };
      case 'm_premio': return { categoria: 'conquistas', tipo: 'premio', titulo: d.venceu ? `Prêmio: ${d.nome}` : `Indicação: ${d.nome}`, destaque: d.venceu ? 2 : 1 };
      case 'm_tatuagem': return d.primeira ? { categoria: 'momentos', tipo: 'tatuagem', titulo: 'A primeira tatuagem', destaque: 0 } : undefined;
      case 'm_pet': return { categoria: 'familia', tipo: 'pet', titulo: `${nomeDe(v, String(d.quem)) ?? 'Um bicho'} chegou`, destaque: 0, pessoaId: String(d.quem) };
    }
  }
  const ev = e.evento;
  if (ev) {
    const quem = nomeDe(v, ev.pessoaId);
    switch (ev.tipo) {
      case 'casamento': return { categoria: 'relacionamentos', tipo: 'casamento', titulo: quem ? `Casamento com ${quem}` : 'O casamento', destaque: 2, pessoaId: ev.pessoaId };
      case 'uniao': return { categoria: 'relacionamentos', tipo: 'uniao', titulo: quem ? `Morar junto com ${quem}` : 'Morar junto', destaque: 1, pessoaId: ev.pessoaId };
      case 'namoro': return { categoria: 'relacionamentos', tipo: 'namoro', titulo: quem ? `Namoro com ${quem}` : 'Um namoro', destaque: 0, pessoaId: ev.pessoaId };
      case 'divorcio': return { categoria: 'relacionamentos', tipo: 'divorcio', titulo: 'O fim do casamento', destaque: 1, pessoaId: ev.pessoaId };
      case 'viuvez': return { categoria: 'familia', tipo: 'viuvez', titulo: quem ? `A perda de ${quem}` : 'A viuvez', destaque: 2, pessoaId: ev.pessoaId };
      case 'filho_nasceu': return { categoria: 'familia', tipo: 'filho', titulo: quem ? `Nasceu ${quem}` : 'Um filho', destaque: 2, pessoaId: ev.pessoaId };
      case 'neto_nasceu': case 'virou_avo': return { categoria: 'familia', tipo: 'neto', titulo: quem ? `Nasceu ${quem}` : 'Um neto', destaque: 1, pessoaId: ev.pessoaId };
      case 'morte': {
        const par = ev.pessoaId ? v.vinculos[ev.pessoaId]?.parentesco : undefined;
        if (!par || !['mae', 'pai', 'filho', 'irmao', 'avo', 'conjuge'].includes(par)) return undefined;
        return { categoria: 'familia', tipo: 'morte', titulo: quem ? `A despedida de ${quem}` : 'Uma despedida', destaque: par === 'filho' ? 2 : 1, pessoaId: ev.pessoaId };
      }
    }
  }
  for (const [re, ler] of PELO_TEXTO) if (re.test(e.texto)) return ler(e, v);
  if (e.relevancia !== 'marco') return undefined;
  // Um marco que nenhuma regra reconheceu: vale pelo tema (nunca se perde um marco da vida).
  const porTema: Partial<Record<Entrada['tema'], CategoriaDaMemoria>> = {
    familia: 'familia', filhos: 'familia', nascimento: 'familia', perda: 'familia', morte: 'familia', amor: 'relacionamentos', amizade: 'relacionamentos',
    escola: 'educacao', estudo: 'educacao', trabalho: 'carreira', dinheiro: 'patrimonio', casa: 'patrimonio', lazer: 'viagens'
  };
  return { categoria: porTema[e.tema] ?? 'momentos', tipo: `marco_${e.tema}`, titulo: TITULO_DO_TEMA[e.tema] ?? 'Um momento', destaque: 1 };
}

const TITULO_DO_TEMA: Partial<Record<Entrada['tema'], string>> = {
  nascimento: 'O nascimento', infancia: 'A infância', familia: 'Em família', amizade: 'Uma amizade', amor: 'O amor', escola: 'A escola', estudo: 'Os estudos',
  trabalho: 'O trabalho', dinheiro: 'O dinheiro', casa: 'A casa', saude: 'A saúde', lugar: 'Um lugar', lazer: 'Um passeio', perda: 'Uma perda', filhos: 'Os filhos', morte: 'Uma despedida', escolha: 'Uma escolha'
};

/* ------------------------------------------------------------------ as estruturas */

const NIVEL_DA_FORMATURA: Record<string, [string, 0 | 1 | 2]> = {
  tecnico: ['Formatura no técnico', 1], superior: ['Formatura na faculdade', 2], pos: ['A pós-graduação', 1], mestrado: ['O mestrado', 2], doutorado: ['O doutorado', 2], residencia: ['A residência', 2]
};

function daEstrutura(v: Vida): Omit<Memoria, 'id' | 'idade' | 'ano'>[] {
  const out: Omit<Memoria, 'id' | 'idade' | 'ano'>[] = [];
  const natal = cidade(v.eu.municipioNatal);
  out.push({ t: v.eu.tNasc, categoria: 'familia', tipo: 'nascimento', titulo: 'O nascimento', texto: natal ? `Nasceu em ${natal}.` : 'Nasceu.', destaque: 2, tom: 'bom' });
  for (const c of v.educacao.concluidos) {
    const [titulo, destaque] = NIVEL_DA_FORMATURA[c.nivel] ?? [null, 0];
    if (!titulo) continue;
    out.push({ t: c.tFim, categoria: 'educacao', tipo: 'formatura', titulo: `${titulo}: ${c.nome}`, texto: `${g(v, 'Formado', 'Formada')} em ${c.nome}${c.instituicao ? `, ${c.instituicao}` : ''}.`, destaque, tom: 'bom' });
  }
  const empregos = [...v.trabalho.historico, ...(v.trabalho.atual ? [v.trabalho.atual] : [])].filter(e => e.contrato !== 'aprendiz' && e.contrato !== 'estagio').sort((a, b) => a.tInicio - b.tInicio);
  empregos.forEach((e, k) => {
    const nome = ocNome(v, e.ocupacaoId);
    const onde = /^por /.test(e.empregador) ? '' : ` (${e.empregador})`;
    if (k === 0) out.push({ t: e.tInicio, categoria: 'carreira', tipo: 'primeiro_emprego', titulo: 'O primeiro emprego', texto: `Começou a trabalhar como ${nome}${onde}.`, destaque: 1, tom: 'bom' });
    else if (empregos[k - 1].empregador !== e.empregador && !(empregos[k - 1].ocupacaoId === e.ocupacaoId && (/^por /.test(e.empregador) || e.contrato === 'informal' || e.contrato === 'autonomo'))) out.push({ t: e.tInicio, categoria: 'carreira', tipo: 'emprego', titulo: `Novo trabalho: ${nome}`, texto: `Passou a trabalhar como ${nome}${onde}.`, destaque: 0 });
  });
  if (v.trabalho.aposentadoria) out.push({ t: v.trabalho.aposentadoria.t, categoria: 'carreira', tipo: 'aposentadoria', titulo: 'A aposentadoria', texto: 'Aposentou-se.', destaque: 1, tom: 'bom' });
  for (const [id, vin] of Object.entries(v.vinculos)) {
    const p = v.pessoas[id];
    if (!p || p.especie) continue;
    if (vin.parentesco === 'filho' && p.tNasc >= v.eu.tNasc) out.push({ t: p.tNasc, categoria: 'familia', tipo: 'filho', titulo: `Nasceu ${p.nome}`, texto: `${p.nome} nasceu.`, destaque: 2, tom: 'bom', pessoaId: id });
    if (vin.parentesco === 'neto' && p.tNasc >= v.eu.tNasc) out.push({ t: p.tNasc, categoria: 'familia', tipo: 'neto', titulo: `Nasceu ${p.nome}`, texto: `${p.nome}, ${p.genero === 'feminino' ? 'a neta' : 'o neto'}, nasceu.`, destaque: 1, tom: 'bom', pessoaId: id });
    if ((vin.parentesco === 'mae' || vin.parentesco === 'pai') && !p.vivo && p.tMorte !== undefined && p.tMorte >= v.eu.tNasc)
      out.push({ t: p.tMorte, categoria: 'familia', tipo: 'morte', titulo: `A despedida de ${p.nome}`, texto: `${vin.parentesco === 'mae' ? 'A mãe' : 'O pai'}, ${p.nome}, morreu.`, destaque: 1, tom: 'ruim', pessoaId: id });
  }
  for (const c of v.caminhos.palmares ?? []) {
    if (c.tipo !== 'titulo' && c.tipo !== 'premio' && c.tipo !== 'selecao') continue;
    out.push({ t: c.t, categoria: 'esportes', tipo: c.tipo, titulo: c.tipo === 'titulo' ? `Campeão: ${c.competicao}` : c.tipo === 'premio' ? `Prêmio: ${c.competicao}` : `Seleção: ${c.competicao}`, texto: c.texto, destaque: c.tipo === 'selecao' ? 1 : 2, tom: 'bom' });
  }
  for (const h of v.caminhos.politica?.historico ?? []) if (h.resultado === 'eleito')
    out.push({ t: h.t, categoria: 'conquistas', tipo: 'mandato', titulo: `${g(v, 'Eleito', 'Eleita')}: ${ocNome(v, String(h.cargo))}`, texto: `Venceu a eleição${h.partido ? `, pelo ${h.partido}` : ''}.`, destaque: 2, tom: 'bom' });
  for (const m of v.mundo?.migracoes ?? []) {
    const para = cidade(m.para);
    out.push({ t: m.t, categoria: 'momentos', tipo: 'migracao', titulo: `Outro país${para ? `: ${para}` : ''}`, texto: `Mudou-se para ${para ?? 'outro país'}.`, destaque: 2 });
  }
  for (const a of v.justica?.antecedentes ?? []) if (a.desfecho === 'prisao')
    out.push({ t: a.t, categoria: 'momentos', tipo: 'prisao', titulo: 'A condenação', texto: `${g(v, 'Condenado', 'Condenada')}${a.anos ? ` a ${a.anos} ${a.anos === 1 ? 'ano' : 'anos'}` : ''}.`, destaque: 1, tom: 'ruim' });
  return out;
}

/* ------------------------------------------------------------------ juntar */

/** A chave que junta a estrutura e a frase da biografia sobre a mesma coisa (o tipo, a pessoa, o ano). */
const chave = (tipo: string, t: number, pessoaId?: string) => `${tipo}|${pessoaId ?? ''}|${anoDe(t)}`;
/** Tipos que a estrutura já conta (a frase da biografia só empresta o texto). */
const JUNTAR: Record<string, string> = { emprego: 'emprego', filho: 'filho', neto: 'neto', morte: 'morte', aposentadoria: 'aposentadoria', primeiro_emprego: 'primeiro_emprego', migracao: 'migracao', prisao: 'prisao', mandato: 'mandato', titulo: 'titulo', premio: 'premio' };

export function memoriasDaVida(v: Vida): Memoria[] {
  const estrutura = daEstrutura(v);
  const porChave = new Map<string, Omit<Memoria, 'id' | 'idade' | 'ano'>>();
  for (const m of estrutura) porChave.set(chave(m.tipo, m.t, m.pessoaId), m);
  // As frases repetidas (a mesma linha 3 vezes ou mais) são rotina, não memória.
  const vezes = new Map<string, number>();
  for (const e of v.biografia) vezes.set(e.texto, (vezes.get(e.texto) ?? 0) + 1);
  const daBiografia: Omit<Memoria, 'id' | 'idade' | 'ano'>[] = [];
  let primeiroNamoro = false, nascimentoNaBio = false;
  const vistas = new Set<string>();
  for (const e of v.biografia) {
    if (e.relevancia === 'tecnico' || (vezes.get(e.texto) ?? 0) >= 3) continue;
    // A mesma frase duas vezes no mesmo ano é uma memória só.
    const dupla = `${anoDe(e.t)}|${e.texto}`;
    if (vistas.has(dupla)) continue;
    vistas.add(dupla);
    if (e.relevancia === 'cotidiano' && !e.fato?.tipo.startsWith('m_')) continue;
    const l = lerEntrada(v, e);
    if (!l) continue;
    if (l.tipo === 'marco_nascimento') {
      // A frase do nascimento é melhor que a da estrutura: fica a dela.
      const n = estrutura.find(x => x.tipo === 'nascimento');
      if (n && !nascimentoNaBio) { n.texto = e.texto; nascimentoNaBio = true; }
      continue;
    }
    // Do namoro, o primeiro (os outros ficam na Linha da Vida).
    if (l.tipo === 'namoro') { if (primeiroNamoro) continue; primeiroNamoro = true; l.titulo = l.pessoaId && nomeDe(v, l.pessoaId) ? `O primeiro namoro: ${nomeDe(v, l.pessoaId)}` : 'O primeiro namoro'; l.destaque = 1; }
    const tipoEstrutura = JUNTAR[l.tipo];
    if (tipoEstrutura) {
      const igual = porChave.get(chave(tipoEstrutura, e.t, l.pessoaId)) ?? porChave.get(chave(tipoEstrutura, e.t - 12, l.pessoaId))
        ?? (l.pessoaId ? undefined : estrutura.find(x => x.tipo === tipoEstrutura && (anoDe(x.t) === anoDe(e.t) || (tipoEstrutura === 'mandato' && anoDe(x.t) === anoDe(e.t) - 1)) && !x.entradaId));
      if (igual) { igual.texto = e.texto; igual.entradaId = e.id; continue; }
    }
    if (l.tipo === 'primeiro_emprego' && estrutura.some(x => x.tipo === 'primeiro_emprego')) {
      const pe = estrutura.find(x => x.tipo === 'primeiro_emprego')!;
      if (Math.abs(anoDe(pe.t) - anoDe(e.t)) <= 1) pe.texto = e.texto;
      continue;
    }
    if (l.tipo === 'aprovacao' && estrutura.some(x => x.tipo === 'formatura' && anoDe(x.t) === anoDe(e.t))) continue;
    daBiografia.push({ t: e.t, categoria: l.categoria, tipo: l.tipo, titulo: l.titulo, texto: e.texto, destaque: l.destaque, tom: e.tom, pessoaId: l.pessoaId, entradaId: e.id });
  }
  // As formaturas que a biografia também conta ("Concluiu o curso…"): a frase entra na estrutura.
  for (const m of daBiografia) if (/^(Concluiu|Formou-se)/.test(m.texto) && m.categoria === 'educacao') {
    const f = estrutura.find(x => x.tipo === 'formatura' && anoDe(x.t) === anoDe(m.t));
    if (f) { f.texto = m.texto; m.tipo = '__fora'; }
  }
  const todas = [...estrutura, ...daBiografia.filter(m => m.tipo !== '__fora')].sort((a, b) => a.t - b.t);
  return todas.map((m, k) => ({ ...m, id: `mem${k}`, idade: Math.max(0, idadeEm(v.eu.tNasc, m.t)), ano: anoDe(m.t) }));
}

/** Os marcantes (destaque 2), para a abertura do álbum. */
export const momentosMarcantes = (ms: Memoria[]) => ms.filter(m => m.destaque === 2);

/** A frase da memória, como o álbum diz: "Aos 28 anos, em 2034." */
export function quandoFoi(m: Memoria): string {
  return m.idade === 0 ? `Ao nascer, em ${m.ano}` : `Aos ${m.idade} ${m.idade === 1 ? 'ano' : 'anos'}, em ${m.ano}`;
}
