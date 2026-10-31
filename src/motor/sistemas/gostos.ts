/**
 * REWORK 12.4 — OS GOSTOS: a música que se ama, a arte que se faz.
 *
 * O gosto nasce da CASA (o que tocava em casa — o gosto de quem cuidava, também sorteado sem ler classe nem bairro),
 * e muda com a vida: o par e os amigos de perto puxam a música deles; a adolescência descobre; o instrumento que se
 * aprende puxa o gênero dele; o show, a roda, o baile ensinam. Nada aqui lê a origem, a cidade ou a renda — o funk, o
 * samba, a ópera e o metal estão abertos a qualquer vida (há um teste que garante isso).
 *
 * O que se faz (ações de `personalizacao`): ouvir música com calma (montar a playlist do ano), ir a um programa cultural
 * (sozinho ou com alguém), produzir uma obra (a tela, a foto, o conto — vira peça sua, com história, que se expõe em
 * casa ou se dá de presente). Cada coisa custa dinheiro e tempo de verdade, e rende pouco por vez.
 *
 * Os sorteios são derivados (`rngDe`): ouvir um disco não muda o acaso do resto da vida.
 */

import type { Colecionavel, Gostos, Pessoa, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { escrever, idade, lembrarCom, novoId } from '../nucleo';
import { aplicarPersonalidade } from '../personalidade';
import { GENEROS, generoMusical, linguagemArte, LINGUAGENS, programaCultural, PROGRAMAS, type LinguagemArte } from '../dados/gostos';
import { economiaLocal, nivelDeOferta } from '../dados/lugares';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { pagar, vereditoDePagar } from './dinheiro';
import { habilidade, praticar } from './frentes';
import { coisasDaVida } from './coisas';
import { naCasaAtual } from './lar';
import { dinheiro as fmt } from '../texto';
import { anoDe } from '../tempo';

const ano = (v: Vida) => Math.floor(v.t / 12);

/** O gosto de alguém (sem guardar nada): três gêneros preferidos, estáveis pela pessoa — nunca pela classe ou pelo lugar. */
export function preferidosDaPessoa(id: string): string[] {
  const r = rngDe(id, 'gosto-musical');
  const lista = [...GENEROS];
  const out: string[] = [];
  for (let k = 0; k < 3; k++) out.push(lista.splice(Math.floor(r.next() * lista.length), 1)[0].id);
  return out;
}

/** Os gostos da pessoa (criados na primeira vez que se precisa deles: a casa da infância e o acaso). */
export function gostosDe(v: Vida): Gostos {
  if (v.eu.gostos) return v.eu.gostos;
  const r = rngDe(v.id, 'gostos-iniciais');
  const musica: Record<string, number> = {};
  for (const g of GENEROS) musica[g.id] = Math.round(15 + r.next() * 30);
  // O que tocava em casa: o gosto de quem cuidava (os pais, os avós — o que houver), sem ler o que a casa tinha.
  const cuidadores = Object.values(v.vinculos).filter(x => ['mae', 'pai', 'avo', 'madrasta', 'padrasto'].includes(x.parentesco ?? '')).map(x => x.pessoaId).slice(0, 2);
  for (const id of cuidadores) { const g = preferidosDaPessoa(id)[0]; musica[g] = Math.max(musica[g], Math.round(50 + r.next() * 15)); }
  // E o que é só seu: um ou dois gêneros que ninguém em casa ouvia.
  for (let k = 0; k < 2; k++) { const g = GENEROS[Math.floor(r.next() * GENEROS.length)].id; musica[g] = Math.max(musica[g], Math.round(55 + r.next() * 25)); }
  const arte: Record<string, number> = {};
  for (const l of LINGUAGENS) arte[l.id] = Math.round(10 + r.next() * 30);
  v.eu.gostos = { musica, arte };
  return v.eu.gostos;
}

export const NOME_DO_GOSTO = (x: number) => (x >= 75 ? 'ama' : x >= 55 ? 'gosta muito' : x >= 35 ? 'gosta' : x >= 20 ? 'ouve às vezes' : 'não é a sua');

/** Os gêneros preferidos (em ordem), para a tela e para as frases. */
export function generosPreferidos(v: Vida, n = 3): { id: string; nome: string; valor: number }[] {
  const g = gostosDe(v);
  return Object.entries(g.musica).sort((a, b) => b[1] - a[1]).slice(0, n).map(([id, valor]) => ({ id, nome: generoMusical(id)?.nome ?? id, valor }));
}

/** Gostam da mesma música (um dos três preferidos de cada lado em comum)? */
export function afinidadeMusical(v: Vida, p: Pessoa): string | undefined {
  const meus = generosPreferidos(v, 3).map(x => x.id);
  return preferidosDaPessoa(p.id).find(g => meus.includes(g));
}

/** Muda um gosto (e registra a descoberta quando um gênero passa a ser dos seus). */
function mexer(v: Vida, tipo: 'musica' | 'arte', id: string, delta: number, como?: string): void {
  const g = gostosDe(v);
  const antes = g[tipo][id] ?? 20;
  const depois = clamp(Math.round(antes + delta), 0, 100);
  g[tipo][id] = depois;
  if (como && antes < 55 && depois >= 55) {
    const nome = tipo === 'musica' ? generoMusical(id)?.nome ?? id : linguagemArte(id)?.nome ?? id;
    (g.descobertas ??= []).push({ t: v.t, oque: nome, como });
    if (g.descobertas.length > 12) g.descobertas.splice(0, g.descobertas.length - 12);
    const oque = tipo === 'musica' ? (nome.startsWith('música') ? `a ${nome}` : `o ${nome}`) : `${linguagemArte(id)?.artigo ?? 'a'} ${nome}`;
    escrever(v, { texto: `Descobriu ${oque} ${como}.`, relevancia: 'cotidiano', tema: 'lazer' });
  }
}

/**
 * O ano do gosto: o instrumento que se pratica puxa a música dele; quem mora junto (o par) e os amigos de perto puxam
 * a deles; na adolescência, o acaso abre portas; o que não se ouve há tempo esfria devagar (o gosto muda, não some).
 */
export function processarGostos(v: Vida): void {
  const i = idade(v);
  if (i < 6) return;
  const g = gostosDe(v);
  const r = rngDe(v.id, 'gostos', ano(v));
  const tocando = new Set(coisasDaVida(v).filter(t => naCasaAtual(t) && !t.lembranca).map(t => t.coisaId));
  if (v.rotinas.some(x => x.id === 'musica')) for (const gen of GENEROS) if (gen.instrumentos?.some(x => tocando.has(x))) mexer(v, 'musica', gen.id, 1.5, 'tocando');
  // Quem está perto: o par e quem mora junto puxam um pouco (mais o par).
  for (const vin of Object.values(v.vinculos)) {
    const p = v.pessoas[vin.pessoaId];
    if (!p?.vivo || p.especie || vin.parentesco === 'pet') continue;
    const casa = vin.convivio.includes('casa');
    const peso = vin.romance && casa ? 2 : casa ? 1 : vin.proximidade >= 70 ? 0.6 : 0;
    if (!peso) continue;
    const fav = preferidosDaPessoa(p.id)[0];
    mexer(v, 'musica', fav, peso, `com ${p.nome}`);
  }
  if (i >= 12 && i <= 19 && r.chance(0.35)) { const gen = GENEROS[Math.floor(r.next() * GENEROS.length)]; mexer(v, 'musica', gen.id, 6 + r.int(0, 6), 'numa fase de descobrir de tudo'); }
  // Esfria devagar o que se gostava muito e ninguém alimenta.
  for (const [id, x] of Object.entries(g.musica)) if (x > 60 && r.chance(0.25)) g.musica[id] = x - 1;
  // A arte praticada vira gosto (quem desenha toda semana passa a gostar de desenho).
  for (const l of LINGUAGENS) if (habilidade(v, l.frente) >= 25 && r.chance(0.3)) mexer(v, 'arte', l.id, 1);
}

/* ------------------------------------------------------------ atividades */

export type AtividadeCultural = 'ouvir' | string;

const chaveDoAno = (oque: string) => `gosto:${oque}`;
const jaFezNoAno = (v: Vida, oque: string) => { const f = v.fatos[chaveDoAno(oque)]; return f !== undefined && Math.floor(f / 12) === ano(v); };

export function precoDoPrograma(v: Vida, id: string): number {
  const p = programaCultural(id);
  return p ? Math.round(p.preco * economiaLocal(v.moradia.municipioId).custo / 10) * 10 : 0;
}

/** Os programas culturais possíveis aqui (o festival e o concerto, onde há oferta). */
export function programasPossiveis(v: Vida): typeof PROGRAMAS {
  const oferta = nivelDeOferta(v.moradia.municipioId);
  return PROGRAMAS.filter(p => !p.cidade || oferta >= 1);
}

export function disponibilidadeCultural(v: Vida, oque: AtividadeCultural, genero?: string, pessoaId?: string): Veredito {
  const i = idade(v);
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if (oque === 'ouvir') {
    if (i < 8) return bloqueio('impossivel', 'A música, por enquanto, é a que toca em casa.');
    return jaFezNoAno(v, 'ouvir') ? bloqueio('incompativel', 'A playlist do ano já está feita.') : PERMITIDO;
  }
  const p = programaCultural(oque);
  if (!p) return bloqueio('impossivel', 'Esse programa não existe.');
  if (i < 14) return bloqueio('impossivel', 'Com a família, por enquanto (a partir dos 14, por conta própria).');
  if (p.cidade && nivelDeOferta(v.moradia.municipioId) < 1) return bloqueio('impossivel', 'Aqui não tem — só numa cidade maior.');
  if (oque === 'baile' && i < 16) return bloqueio('impossivel', 'A partir dos 16.');
  if (jaFezNoAno(v, oque)) return bloqueio('incompativel', 'Já foi neste ano.');
  if (oque === 'show' && genero && !generoMusical(genero)) return bloqueio('impossivel', 'Esse gênero não existe.');
  if (pessoaId) {
    const vin = v.vinculos[pessoaId];
    const pe = v.pessoas[pessoaId];
    if (!vin || !pe?.vivo || pe.especie || pe.municipioId !== v.moradia.municipioId) return bloqueio('incompativel', 'Essa pessoa não está por perto.');
  }
  return vereditoDePagar(v, precoDoPrograma(v, oque) * (pessoaId ? 2 : 1));
}

/** Ouvir música com calma (a playlist do ano) ou ir a um programa cultural. */
export function fazerCultural(v: Vida, oque: AtividadeCultural, genero?: string, pessoaId?: string): string {
  v.fatos[chaveDoAno(oque)] = v.t;
  const r = rngDe(v.id, 'cultural', oque, v.t);
  if (oque === 'ouvir') {
    const fav = generosPreferidos(v, 1)[0];
    // Uma vizinha do gênero preferido entra na playlist (é assim que o gosto caminha).
    const vizinho = generoMusical(fav.id)?.perto[Math.floor(r.next() * (generoMusical(fav.id)?.perto.length ?? 1))];
    if (vizinho) mexer(v, 'musica', vizinho, 4, 'montando a playlist do ano');
    mexer(v, 'musica', fav.id, 2);
    const som = coisasDaVida(v).some(t => t.coisaId === 'som_hifi' && naCasaAtual(t));
    v.mente.felicidade = clamp(v.mente.felicidade + (som ? 2 : 1));
    v.mente.estresse = clamp(v.mente.estresse - 2);
    return `${som ? 'No som da sala, alto: ' : ''}a playlist do ano tem muito ${fav.nome}${vizinho ? ` — e, desta vez, ${generoMusical(vizinho)?.nome}` : ''}.`;
  }
  const p = programaCultural(oque)!;
  const preco = precoDoPrograma(v, oque) * (pessoaId ? 2 : 1);
  if (preco) pagar(v, preco);
  const gen = oque === 'show' ? genero ?? generosPreferidos(v, 1)[0].id : p.generos[Math.floor(r.next() * Math.max(1, p.generos.length))];
  if (gen) mexer(v, 'musica', gen, 6, `${oque === 'show' ? 'num show' : `em ${p.nome}`}`);
  for (const a of p.artes ?? []) mexer(v, 'arte', a, 4, `em ${p.nome}`);
  v.mente.felicidade = clamp(v.mente.felicidade + 3);
  v.mente.estresse = clamp(v.mente.estresse - 2);
  aplicarPersonalidade(v, `acao:cultural_${oque}`, { sociabilidade: 1 });
  const nomeProg = oque === 'show' && gen ? `um show de ${generoMusical(gen)?.nome}` : p.nome;
  const pe = pessoaId ? v.pessoas[pessoaId] : undefined;
  if (pe) {
    const vin = v.vinculos[pe.id];
    // Quem gosta do mesmo aproveita junto (e aproxima mais); quem não gosta foi por você — também conta.
    const junto = gen && preferidosDaPessoa(pe.id).includes(gen);
    vin.proximidade = clamp(vin.proximidade + (junto ? 5 : 3));
    vin.tUltimoContato = v.t;
    lembrarCom(v, pe.id, `${nomeProg.charAt(0).toUpperCase()}${nomeProg.slice(1)}, juntos, em ${anoDe(v.t)}.`, 'ritual', junto ? 2 : 1);
    // E o gosto dela pode virar seu.
    const dela = preferidosDaPessoa(pe.id)[0];
    if (dela !== gen) mexer(v, 'musica', dela, 3, `com ${pe.nome}`);
    return `Foi a ${nomeProg} com ${pe.nome}${preco ? ` (${fmt(preco)} os dois)` : ''}. ${junto ? `${pe.nome} sabia todas as letras.` : `${pe.nome} foi por você — e saiu falando de uma música.`}`;
  }
  return `Foi a ${nomeProg}${preco ? ` (${fmt(preco)})` : ''}. ${['Voltou para casa cantando.', 'Saiu com o ouvido zumbindo e a semana leve.', 'Conheceu gente no meio da multidão.'][Math.floor(r.next() * 3)]}`;
}

/* ------------------------------------------------------------ a obra */

const temAlgum = (v: Vida, ids: string[]) => !ids.length || coisasDaVida(v).some(t => ids.includes(t.coisaId) && naCasaAtual(t) && !t.lembranca && t.estado > 0);

export function precoDoMaterial(v: Vida, l: LinguagemArte): number { return Math.round(l.material * economiaLocal(v.moradia.municipioId).custo / 10) * 10; }

export function disponibilidadeObra(v: Vida, id: string): Veredito {
  const l = linguagemArte(id);
  if (!l) return bloqueio('impossivel', 'Essa linguagem não existe.');
  if (idade(v) < 8) return bloqueio('impossivel', 'A partir dos 8.');
  if (v.justica?.prisao) return bloqueio('incompativel', 'Na prisão, não.');
  if (!temAlgum(v, l.pede)) return bloqueio('requisito', `Precisa ${l.pede.length > 1 ? 'de um destes' : 'de'}: ${l.pede.map(x => x.replace(/_/g, ' ')).join(', ')} (em casa).`);
  if (jaFezNoAno(v, `obra:${id}`)) return bloqueio('incompativel', 'Uma obra desta por ano: a próxima ainda está na cabeça.');
  return vereditoDePagar(v, precoDoMaterial(v, l));
}

const TITULOS = ['Varanda em junho', 'Quintal', 'A rua de cima', 'Domingo', 'Retrato de família', 'Maré', 'Feira', 'Janela', 'Ônibus das seis', 'Laje', 'Cidade baixa', 'Avó', 'Chuva', 'Fim de tarde', 'Vizinhança'];

/**
 * Produz uma obra: pratica a frente, gasta o material e vira uma peça sua (`Colecionavel` de procedência `propria`),
 * com o valor que uma obra de quem tem a sua habilidade e o seu nome teria — quase nada no começo. A obra é sua para
 * expor em casa, dar de presente ou guardar.
 */
export function produzirObra(v: Vida, id: string): string {
  const l = linguagemArte(id)!;
  const r = rngDe(v.id, 'obra', id, v.t);
  v.fatos[chaveDoAno(`obra:${id}`)] = v.t;
  const material = precoDoMaterial(v, l);
  pagar(v, material);
  praticar(v, r, l.frente, 0.4, 1.1);
  mexer(v, 'arte', l.id, 5, 'produzindo');
  const g = gostosDe(v);
  const n = ((g.obras ??= {})[l.id] = (g.obras[l.id] ?? 0) + 1);
  const h = habilidade(v, l.frente);
  const nome = v.notoriedade?.valor ?? 0;
  const valor = Math.round((60 + Math.pow(h / 100, 2) * 2200 * (1 + nome / 60)) / 10) * 10;
  const titulo = TITULOS[Math.floor(r.next() * TITULOS.length)];
  const peca: Colecionavel = {
    id: novoId(v, 'obra'), pecaId: `obra_propria:${l.id}`, nome: `${l.obra.replace(/^uma? /, '').replace(/^./, c => c.toUpperCase())} — "${titulo}"`,
    categoria: 'arte', raridade: 'unica', procedencia: 'propria', certificado: false, autenticidade: 'verificada', estado: 100,
    valor, precoPago: material, tCompra: v.t, detalhe: `${l.obra.charAt(0).toUpperCase()}${l.obra.slice(1)} sua (${l.nome}), de ${anoDe(v.t)}.`,
    memoria: { origem: 'feito', afeto: 30 }, historia: [{ t: v.t, texto: 'Feita por você.' }]
  };
  (v.financas.colecao ??= []).push(peca);
  if (n === 1) escrever(v, { texto: `Terminou ${l.obra} — a primeira de ${l.artigo === 'a' ? 'sua' : 'seu'} ${l.nome}: "${titulo}".`, relevancia: 'biografia', tema: 'lazer', escolha: true });
  aplicarPersonalidade(v, 'acao:produzir_obra', { disciplina: 1 });
  v.mente.felicidade = clamp(v.mente.felicidade + 2);
  return `"${titulo}": ${l.obra} sua, pronta (${fmt(material)} de material). ${h < 20 ? 'Ainda dá para ver onde a mão hesitou.' : h < 50 ? 'Tem coisa boa ali.' : 'Quem vê para na frente.'} Está em Patrimônio · Coleção: dá para expor em casa ou dar de presente.`;
}

/** O hobby que já pode virar ofício (para a tela: o ofício existe em Trabalho). */
export function hobbiesQueViramOficio(v: Vida): { linguagem: string; oficio: string }[] {
  const out: { linguagem: string; oficio: string }[] = [];
  for (const l of LINGUAGENS) if (l.oficio && habilidade(v, l.frente) >= 40 && (gostosDe(v).obras?.[l.id] ?? 0) >= 2) out.push({ linguagem: l.nome, oficio: l.oficio });
  if (habilidade(v, 'musica') >= 40) out.push({ linguagem: 'música', oficio: 'musico_noite' });
  return out.filter((x, k, a) => a.findIndex(y => y.oficio === x.oficio) === k);
}
