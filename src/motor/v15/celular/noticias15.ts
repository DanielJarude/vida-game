/**
 * VIDA 15 · O JORNAL — as notícias do ano, lidas do que JÁ aconteceu no mundo da vida (nada sorteado na hora da leitura):
 * os acontecimentos mundiais do ano (`mundo14`), a economia (a fase, a inflação, a bolsa), as eleições na janela, os
 * campeões do futebol do país (o mesmo sorteio estável das competições), a vida das pessoas da cidade (a Linha da Vida),
 * as pessoas da sua vida que viraram notícia (`celebridade15`) e — quando há nome público — VOCÊ (os marcos da fama, o
 * romance que a imprensa viu, as respostas que você deu a ela). Coerência temporal: cada edição é de um ano; no ano
 * seguinte, outra edição. Nada se repete indefinidamente: o que é velho sai.
 */
import type { Vida } from '../../tipos';
import { anoDe } from '../../tempo';
import { idade, parceiro, vinculosVivos } from '../../nucleo';
import { municipio, nomeLugar } from '../../dados/lugares';
import { paisDoCatalogo } from '../../mundo/registro';
import { campeaoContinentalNoAno, campeaoDaCopaNoAno } from '../../sistemas/competicoes';
import { eleicaoNaJanela } from '../../sistemas/politica';
import { marcosDaFama13 } from '../../sistemas/reconhecimento13';
import { ROTULO_AREA15, nivelDaFama15 } from './celular15';

export type Editoria15 = 'voce' | 'mundo' | 'pais' | 'politica' | 'economia' | 'esportes' | 'cultura' | 'tecnologia' | 'pessoas';
export const ROTULO_EDITORIA15: Record<Editoria15, string> = {
  voce: 'Sobre você', mundo: 'Mundo', pais: 'País', politica: 'Política', economia: 'Economia', esportes: 'Esportes', cultura: 'Cultura', tecnologia: 'Ciência e tecnologia', pessoas: 'Gente'
};

export interface Materia15 { id: string; editoria: Editoria15; titulo: string; linha?: string; ano: number; destaque?: boolean; tom?: 'bom' | 'ruim' | 'neutro' }

const SEM_CATALOGO = /^\u0000|^~/;
const limpar = (s?: string) => (s ? s.replace(SEM_CATALOGO, '') : s);

export interface Jornal15 { nome: string; edicao: number; materias: Materia15[] }

/** O jornal do ano corrente (e o que sobrou do anterior, quando o ano está calmo). */
export function jornal15(v: Vida): Jornal15 {
  const ano = anoDe(v.t);
  const m = municipio(v.moradia.municipioId);
  const out: Materia15[] = [];
  const add = (x: Materia15) => { if (!out.some(y => y.id === x.id)) out.push(x); };

  // O mundo, o país, a cultura, a tecnologia: os acontecimentos do ano (e do ano passado, como repercussão).
  for (const e of (v.mundo14?.eventos ?? []).filter(e => e.ano >= ano - 1 && e.ano <= ano).reverse()) {
    const ed: Editoria15 = e.tipo === 'economia' || e.tipo === 'trabalho' ? 'economia' : e.tipo === 'esporte' ? 'esportes' : e.tipo === 'cultura' ? 'cultura'
      : e.tipo === 'tecnologia' || e.tipo === 'ciencia' || e.tipo === 'produtos' ? 'tecnologia' : e.escopo === 'pais' || e.escopo === 'regiao' ? 'pais' : 'mundo';
    add({ id: `m:${e.id}`, editoria: ed, titulo: e.titulo, linha: [e.lugar && e.escopo !== 'mundo' ? e.lugar : '', e.texto, e.efeito ?? ''].filter(Boolean).join(' · '), ano: e.ano, destaque: e.ano === ano && (e.tipo === 'pandemia' || e.tipo === 'desastre' || !!e.marco) });
  }

  // A economia do país (a fase do ciclo, a inflação, a bolsa).
  const ec = v.economia;
  if (ec) {
    const infl = Math.round(ec.inflacao * 1000) / 10;
    const fase = ec.fase === 'crise' ? { t: 'Economia entra em recessão; desemprego sobe', tom: 'ruim' as const } : ec.fase === 'desaceleracao' ? { t: 'Economia desacelera e empresas seguram contratações', tom: 'ruim' as const }
      : ec.fase === 'recuperacao' ? { t: 'Sinais de recuperação: comércio volta a contratar', tom: 'bom' as const } : ec.fase === 'expansao' ? { t: 'Economia aquecida: vagas sobram em vários setores', tom: 'bom' as const } : { t: 'Economia segue em ritmo moderado', tom: 'neutro' as const };
    add({ id: `ec:${ano}:${ec.fase}`, editoria: 'economia', titulo: fase.t, linha: `Inflação de ${infl.toLocaleString('pt-BR')}% no último ano${ec.bolsa ? `; bolsa ${ec.bolsa >= 1.15 ? 'em alta' : ec.bolsa <= 0.85 ? 'em baixa' : 'de lado'}` : ''}.`, ano, tom: fase.tom });
  }

  // Política: o ano de eleição.
  const el = eleicaoNaJanela(v);
  if (el && el.ano === ano) add({ id: `el:${ano}:${el.tipo}`, editoria: 'politica', titulo: el.tipo === 'geral' ? `Ano de eleições gerais: campanha nas ruas em ${ano}` : `Eleições municipais: ${nomeLugar(m.id)} escolhe prefeito em ${ano}`, linha: 'Debates, pesquisas e santinhos: a cidade só fala nisso.', ano });

  // Esportes: os campeões do ano que passou (o mesmo resultado das competições da vida).
  const copa = limpar(campeaoDaCopaNoAno(v, m.pais, ano - 1));
  if (copa) add({ id: `copa:${ano - 1}`, editoria: 'esportes', titulo: `${copa} é campeão da copa nacional de ${ano - 1}`, linha: 'Festa da torcida na volta para casa.', ano: ano - 1 });
  const cont = limpar(campeaoContinentalNoAno(v, m.pais, ano - 1));
  if (cont) add({ id: `cont:${ano - 1}`, editoria: 'esportes', titulo: `${cont} conquista o continental de ${ano - 1}`, ano: ano - 1 });

  // Gente: quem da sua vida virou notícia (a fama delas é delas, e fica).
  for (const { p } of vinculosVivos(v)) {
    const c = p.celebridade15;
    if (!c || p.especie) continue;
    if (c.desde !== undefined && anoDe(c.desde) >= ano - 1) add({ id: `gente:${p.id}:${anoDe(c.desde)}`, editoria: 'pessoas', titulo: `${p.nome} ${p.sobrenome}, ${ROTULO_AREA15[c.area][p.genero === 'feminino' ? 1 : 0]}, é o nome do momento`, linha: 'Entrevistas, fotos, gente pedindo autógrafo na rua.', ano: anoDe(c.desde) });
  }

  // A cidade: o que a Linha da Vida registrou do mundo à volta (a crise que chegou, a fábrica que abriu).
  for (const e of v.biografia.filter(e => e.t >= v.t - 12 && e.fato?.tipo === 'mundo' && !e.pessoas?.length).slice(-3)) add({ id: `cid:${e.id}`, editoria: 'pais', titulo: e.texto.replace(/\.$/, ''), linha: nomeLugar(m.id), ano: anoDe(e.t), tom: e.tom });

  // VOCÊ: só quando há nome público — o que o público viu (os marcos), o romance, o que você respondeu à imprensa.
  if (nivelDaFama15(v) >= 1 && idade(v) >= 12) {
    for (const mc of marcosDaFama13(v).filter(x => anoDe(x.t) >= ano - 1 && x.tipo !== 'causa').slice(-4).reverse()) {
      add({ id: `voce:${mc.ref}`, editoria: 'voce', titulo: `${v.eu.nome} ${v.eu.sobrenome ?? ''}: ${mc.texto.replace(/ \(\d{4}\)$/, '').replace(/\.$/, '')}`.replace(/\s+:/, ':'), ano: anoDe(mc.t), destaque: mc.peso >= 15 || mc.peso <= -15, tom: mc.peso > 0 ? 'bom' : mc.peso < 0 ? 'ruim' : 'neutro' });
    }
    const par = parceiro(v);
    if (par && nivelDaFama15(v) >= 2) add({ id: `casal:${par.p.id}`, editoria: 'voce', titulo: `${v.eu.nome} e ${par.p.nome}${par.p.celebridade15 ? ` ${par.p.sobrenome}` : ''}: ${par.vin.romance?.estagio === 'casamento' ? 'o casamento visto de perto' : 'o romance que virou assunto'}`, linha: par.p.celebridade15 ? 'Dois nomes conhecidos, uma agenda disputada pelos fotógrafos.' : 'Os fotógrafos descobriram o endereço.', ano });
    for (const msg of (v.celular15?.msgs ?? []).filter(x => x.tipo === 'imprensa' && x.resposta && anoDe(x.t) >= ano - 1)) {
      const alvo = msg.assunto ? v.pessoas[msg.assunto]?.nome : undefined;
      const t = msg.resposta!.op === 'confirmar' ? `${v.eu.nome} confirma romance com ${alvo ?? 'novo amor'}` : msg.resposta!.op === 'negar' ? `${v.eu.nome} nega romance com ${alvo ?? 'affair'}; fotos dizem outra coisa` : `Flagra: ${v.eu.nome} e ${alvo ?? 'acompanhante'} saindo de restaurante`;
      add({ id: `imp:${msg.id}`, editoria: 'voce', titulo: t, linha: msg.remetente, ano: anoDe(msg.t) });
    }
  }

  const ordem: Editoria15[] = ['voce', 'pais', 'mundo', 'politica', 'economia', 'esportes', 'pessoas', 'cultura', 'tecnologia'];
  out.sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque) || b.ano - a.ano || ordem.indexOf(a.editoria) - ordem.indexOf(b.editoria));
  const pais = m.pais === 'BR' ? 'Brasil' : paisDoCatalogo(m.pais).nome;
  return { nome: m.pais === 'BR' ? 'Folha do Brasil' : `${pais} Hoje`, edicao: ano, materias: out.slice(0, 40) };
}
