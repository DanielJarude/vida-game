/**
 * Cena: a carreira artística como vida dentro da vida — e não só "seguir
 * ensaiando".
 *
 *   prática → apresentar-se (a sala pequena, o sarau, a mostra) → testes e
 *   trabalhos pequenos (figuração, publicidade, curta) → edital de cultura →
 *   currículo → convites maiores → público, reconhecimento
 *
 * Tudo aqui é TENTATIVA do jogador, com resultado que pode ser ruim — mas
 * nunca "nada aconteceu": toda tentativa deixa algo (o cachê pequeno, a sala
 * vazia, o parecer do edital, um nome no elenco). O que se faz fica no
 * CURRÍCULO (`caminhos.curriculo`), que pesa nas tentativas seguintes e
 * continua depois que a carreira pausa. Produções e títulos são fictícios,
 * do universo desta vida; as casas são genéricas (uma produtora, um canal).
 */

import { agenteDe, cacheAudiovisual, contaDoContrato, intervaloDeTestes, novaProposta, porteMaximoDoTeste } from './audiovisual';
import type { Rng } from '../rng';
import { clamp, rngDe } from '../rng';
import type { Dominio, ItemCurriculo, Oportunidade, Vida } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { habilidade, praticar } from './frentes';
import { marcar } from './marcas';
import { registrarDevolutiva } from './devolutivas';
import { novaOportunidade } from './oportunidades';
import { cacheDeApresentacao } from './palco';
import { lancarObra } from './arte';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { municipio, nivelDeOferta } from '../dados/lugares';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { anoDe } from '../tempo';
import { dinheiro as fmt } from '../texto';
import { criarPessoa, vincular } from '../pessoas';
import { capitalDoEstado } from './escola';
import { nomePor } from './notoriedade';

export const LINGUAGENS_DE_CENA: Dominio[] = ['teatro', 'musica', 'danca'];
const TRILHA_DA: Partial<Record<Dominio, string[]>> = { teatro: ['cena'], musica: ['musica', 'orquestra'], danca: ['danca'] };
export const LIMITE_CURRICULO = 40;

/* ----------------------------------------------------------------- Quem */

/** A linguagem artística desta vida, se há uma a sério (o grupo, o trabalho, a prática firme). */
export function linguagemEmCena(v: Vida): Dominio | undefined {
  const p = v.caminhos.arte;
  if (p?.ativo && LINGUAGENS_DE_CENA.includes(p.linguagem)) return p.linguagem;
  for (const e of [v.trabalho.atual, v.trabalho.paralela]) {
    const tr = e ? ocupacaoOuNula(e.ocupacaoId)?.trilha : undefined;
    const d = LINGUAGENS_DE_CENA.find(x => tr && TRILHA_DA[x]?.includes(tr));
    if (d) return d;
  }
  return LINGUAGENS_DE_CENA.filter(d => v.rotinas.some(r => r.id === d && (r.nivel ?? 1) >= 2)).sort((a, b) => habilidade(v, b) - habilidade(v, a))[0];
}

/** Vive (ou viveu em paralelo) da arte agora? */
export function trabalhaComArte(v: Vida, d?: Dominio): boolean {
  return [v.trabalho.atual, v.trabalho.paralela].some(e => {
    const tr = e ? ocupacaoOuNula(e.ocupacaoId)?.trilha : undefined;
    return !!tr && (d ? !!TRILHA_DA[d]?.includes(tr) : LINGUAGENS_DE_CENA.some(x => TRILHA_DA[x]?.includes(tr)));
  });
}

/* ------------------------------------------------------------- Currículo */

export function registrarNoCurriculo(v: Vida, item: Omit<ItemCurriculo, 't'>): ItemCurriculo {
  const x: ItemCurriculo = { t: v.t, ...item };
  const lista = (v.caminhos.curriculo ??= []);
  lista.push(x);
  if (lista.length > LIMITE_CURRICULO) lista.splice(0, lista.length - LIMITE_CURRICULO);
  return x;
}

/** O peso do currículo (0..1): quanto se fez, quão recente e quão bem recebido (a obra própria conta junto). */
export function pesoDoCurriculo(v: Vida): number {
  const itens = v.caminhos.curriculo ?? [];
  const obras = (v.caminhos.obras ?? []).filter(o => ['teatro', 'musica', 'danca'].includes(o.linguagem));
  const s = itens.reduce((acc, x) => acc + (1 + x.repercussao) * (v.t - x.t <= 96 ? 1 : 0.5), 0) + obras.reduce((acc, o) => acc + (1 + o.recepcao) * 0.8, 0);
  return clamp(s / 22, 0, 1);
}

/** O currículo em palavras (a régua das devolutivas). */
export const PALAVRA_CURRICULO = ['sem trabalhos ainda', 'alguns trabalhos', 'um currículo', 'um currículo sólido', 'um currículo de peso'] as const;
export const nivelDoCurriculo = (x: number) => (x < 0.08 ? 0 : x < 0.25 ? 1 : x < 0.5 ? 2 : x < 0.75 ? 3 : 4);

/* ------------------------------------------------------------ Nomes fictícios */

const TITULOS_PECA = ['O Quarto de Cima', 'Vento Norte', 'A Última Festa', 'Rua das Palmeiras', 'Os Dias Contados', 'Casa de Farinha', 'Travessia Noturna', 'O Peso das Coisas', 'Mar de Dentro', 'Retrato de Família'];
const TITULOS_TELA = ['Horizonte Partido', 'Os Herdeiros da Serra', 'Pelas Margens', 'Rota 116', 'A Cidade Acorda', 'Fronteira Sul', 'Laços de Maré', 'O Contador de Histórias', 'Sol de Inverno', 'Terra Vermelha'];
const PRODUTOS = ['uma rede de farmácias', 'um banco digital', 'uma marca de refrigerante', 'um supermercado da região', 'uma loja de eletrodomésticos', 'uma operadora de celular'];
export const CASAS: Record<ItemCurriculo['tipo'], string[]> = {
  teatro: ['um teatro do centro', 'uma sala independente', 'o teatro municipal'], festival: ['um festival da capital'], publicidade: ['uma agência de publicidade'],
  curta: ['uma produtora independente'], serie: ['uma plataforma de streaming', 'um canal por assinatura'], novela: ['uma emissora de TV aberta'], filme: ['uma produtora de cinema'],
  show: ['uma casa de shows'], espetaculo: ['uma companhia de dança'], edital: ['um edital de cultura']
};

export function tituloFicticio(v: Vida, tipo: ItemCurriculo['tipo'], salt: string): string {
  const r = rngDe(v.id, 'titulo', tipo, v.t, salt, v.caminhos.curriculo?.length ?? 0);
  if (tipo === 'publicidade') return `Comercial de ${r.pick(PRODUTOS)}`;
  if (tipo === 'serie' || tipo === 'novela' || tipo === 'filme' || tipo === 'curta') return r.pick(TITULOS_TELA);
  return r.pick(TITULOS_PECA);
}

/* -------------------------------------------------------- Apresentar-se */

export type OqueCena = 'apresentar' | 'edital' | 'audicao' | 'trabalho_pequeno';

const jaFezNoAno = (v: Vida, chave: string) => v.fatos[chave] !== undefined && v.t - v.fatos[chave] < 12;

export function disponibilidadeCena(v: Vida, oque: OqueCena): Veredito {
  const i = idade(v);
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre a pena.');
  const d = linguagemEmCena(v);
  if (!d) return bloqueio('requisito', 'Isso pede uma arte praticada a sério (teatro, música ou dança na semana, em ritmo de ensaio), um grupo ou um trabalho artístico.');
  const h = habilidade(v, d);
  switch (oque) {
    case 'apresentar': {
      if (i < 12) return bloqueio('requisito', 'A partir dos 12.');
      if (h < 38) return bloqueio('requisito', 'Ainda falta prática para segurar uma apresentação inteira: ensaiar mais vem antes.');
      if (jaFezNoAno(v, 'cena_apresentou')) return bloqueio('incompativel', `A última temporada foi em ${anoDe(v.fatos['cena_apresentou'])}: montar outra leva um ano.`);
      return PERMITIDO;
    }
    case 'edital': {
      if (i < 18) return bloqueio('requisito', 'Editais de cultura pedem proponente maior de idade.');
      if (!v.caminhos.arte?.ativo && !trabalhaComArte(v)) return bloqueio('requisito', 'Um edital pede um projeto: um grupo em atividade ou uma carreira artística.');
      if (jaFezNoAno(v, 'cena_edital')) return bloqueio('incompativel', `O último edital foi em ${anoDe(v.fatos['cena_edital'])}: os editais abrem uma vez por ano.`);
      return PERMITIDO;
    }
    case 'audicao': {
      if (d !== 'teatro' && d !== 'danca') return bloqueio('impossivel', 'Testes de elenco são para quem atua ou dança.');
      if (i < 14) return bloqueio('requisito', 'A partir dos 14 (com autorização dos responsáveis, até os 18).');
      if (h < 45) return bloqueio('requisito', 'Um teste de elenco pede o básico de cena: prática firme primeiro.');
      // O agente marca mais testes (um a cada seis meses); sem agente, um ciclo por ano.
      if (v.fatos['cena_audicao'] !== undefined && v.t - v.fatos['cena_audicao'] < intervaloDeTestes(v)) return bloqueio('incompativel', agenteDe(v) ? 'O agente já marcou o próximo teste: daqui a alguns meses.' : `O último teste foi em ${anoDe(v.fatos['cena_audicao'])}: o próximo ciclo de testes vem no ano que vem (com agente, vêm mais).`);
      return PERMITIDO;
    }
    case 'trabalho_pequeno': {
      if (i < 14) return bloqueio('requisito', 'A partir dos 14.');
      if (d !== 'teatro' && d !== 'musica') return bloqueio('impossivel', 'Não se aplica.');
      if (h < 35) return bloqueio('requisito', 'Até para figuração pedem um mínimo de desenvoltura.');
      if (jaFezNoAno(v, 'cena_pequeno')) return bloqueio('incompativel', 'Já fez um trabalho desses este ano.');
      return PERMITIDO;
    }
  }
}

/** O público de agora (0..100): o do grupo, o da freguesia do trabalho, o do nome. */
export function publicoAgora(v: Vida): number {
  const p = v.caminhos.arte?.ativo ? v.caminhos.arte.publico : 0;
  const c = [v.trabalho.atual, v.trabalho.paralela].reduce((m, e) => Math.max(m, e?.clientela ?? 0), 0);
  const n = nomePor(v, 'arte');
  return Math.max(p, c * 0.7, n);
}

export function crescerPublico(v: Vida, quanto: number): void {
  const p = v.caminhos.arte;
  if (p?.ativo) p.publico = Math.round(clamp(p.publico + quanto, 0, 100));
  for (const e of [v.trabalho.atual, v.trabalho.paralela]) if (e?.clientela !== undefined && trabalhaComArte(v)) e.clientela = Math.round(clamp(e.clientela + quanto * 0.6, 0, 100));
}

export function executarCena(v: Vida, r: Rng, oque: OqueCena): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const d = linguagemEmCena(v)!;
  const h = habilidade(v, d);
  const p = v.caminhos.arte?.ativo ? v.caminhos.arte : undefined;
  const pub = publicoAgora(v);
  const cv = pesoDoCurriculo(v);
  const cidade = municipio(v.moradia.municipioId).nome;
  switch (oque) {
    case 'apresentar': {
      v.fatos['cena_apresentou'] = v.t;
      praticar(v, r, d, 0.2, 1);
      const q = h / 100 * 0.55 + pub / 100 * 0.25 + cv * 0.1 + r.normal() * 0.12;
      const repercussao: ItemCurriculo['repercussao'] = q >= 0.62 ? 3 : q >= 0.5 ? 2 : q >= 0.36 ? 1 : 0;
      // Uma sala pequena: a bilheteria paga pouco — às vezes nem o aluguel.
      const bruto = Math.round((200 + pub * 60) * [0.4, 1, 1.6, 2.4][repercussao] / 10) * 10;
      const custo = Math.round((d === 'musica' ? 600 : 1200) * (nivelDeOferta(v.moradia.municipioId) >= 2 ? 1.3 : 1) / 10) * 10;
      const saldo = bruto - custo;
      v.financas.conta += saldo;
      crescerPublico(v, [1, 3, 6, 10][repercussao]);
      const tipo: ItemCurriculo['tipo'] = d === 'musica' ? 'show' : d === 'danca' ? 'espetaculo' : 'teatro';
      const titulo = tituloFicticio(v, tipo, 'apresentar');
      registrarNoCurriculo(v, { tipo, titulo, papel: p ? `com ${p.nome}` : d === 'musica' ? 'show próprio' : 'elenco', onde: `${CASAS[tipo][0]}, em ${cidade}`, repercussao, cache: Math.max(0, saldo) });
      const oque2 = d === 'musica' ? `um show ("${titulo}")` : d === 'danca' ? `o espetáculo "${titulo}"` : `uma temporada curta de "${titulo}"`;
      const dinheiroTxt = saldo >= 0 ? `sobrou ${fmt(saldo)}` : `a bilheteria não cobriu a sala: faltaram ${fmt(-saldo)}`;
      const texto = repercussao >= 3 ? `Fez ${oque2}${p ? ` com ${p.nome}` : ''}: casa cheia nas últimas sessões, gente comentando depois — ${dinheiroTxt}.`
        : repercussao === 2 ? `Fez ${oque2}${p ? ` com ${p.nome}` : ''}. Público bom, um comentário no jornal da cidade — ${dinheiroTxt}.`
          : repercussao === 1 ? `Fez ${oque2}${p ? ` com ${p.nome}` : ''}. Plateia de amigos e alguns desconhecidos — ${dinheiroTxt}.`
            : `Fez ${oque2}${p ? ` com ${p.nome}` : ''}. Plateia pequena; ninguém de fora apareceu — ${dinheiroTxt}. Ficou a experiência.`;
      escrever(v, { texto, relevancia: repercussao >= 2 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: repercussao >= 2 ? 'bom' : repercussao === 0 ? 'ruim' : undefined, escolha: true });
      if (repercussao >= 3) marcar(v, 'conquista', texto, 2, { dominio: d });
      v.mente.felicidade = clamp(v.mente.felicidade + [0, 2, 4, 6][repercussao]);
      return { texto, tom: repercussao >= 2 ? 'bom' : repercussao === 0 ? 'ruim' : 'neutro' };
    }
    case 'edital': {
      v.fatos['cena_edital'] = v.t;
      // O que pesa num edital: a técnica (o material), o currículo (o que já foi feito) e o público (o alcance do projeto).
      const tec = (h - 55) / 150;
      const curr = cv * 0.22;
      const alc = pub / 400;
      const chance = clamp(0.12 + tec + curr + alc, 0.05, 0.55);
      const aprovado = r.chance(chance);
      const nomeProj = p?.nome ?? 'o seu projeto';
      if (aprovado) {
        const verba = Math.round((15000 + cv * 30000 + pub * 200) / 1000) * 1000;
        const parte = Math.round(verba * 0.25 / 100) * 100;
        v.financas.conta += parte;
        registrarNoCurriculo(v, { tipo: 'edital', titulo: `Edital de cultura: ${nomeProj}`, papel: 'proponente', onde: `${cidade}`, repercussao: 1, cache: parte });
        const obra = lancarObra(v, r);
        const texto = `O edital de cultura aprovou ${nomeProj}: ${fmt(verba)} para a montagem (${fmt(parte)} de cachê para você; o resto pagou equipe, sala e figurino). A estreia foi "${obra.titulo}".`;
        escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
        marcar(v, 'aprovacao', `Aprovado em edital de cultura (${nomeProj}).`, 2, { dominio: d });
        return { texto, tom: 'bom' };
      }
      const falta = h < 58 ? 'tecnica' : cv < 0.2 ? 'experiencia' : pub < 25 ? 'publico' : 'concorrencia';
      const motivo = falta === 'tecnica' ? 'o parecer disse que o material ainda não está no nível do projeto' : falta === 'experiencia' ? 'o parecer pediu mais trabalhos no currículo (apresentações, testes, trabalhos pequenos contam)' : falta === 'publico' ? 'o parecer achou o alcance do projeto pequeno (quem vê o trabalho hoje)' : 'o projeto foi bem avaliado, mas eram muitos projetos para poucas vagas';
      registrarDevolutiva(v, { tipo: 'arte', titulo: 'Edital de cultura', texto: `Não aprovado: ${motivo}.`, passou: false, perto: chance >= 0.3, falta, dominio: d, nivel: nivelDoCurriculo(cv) });
      escrever(v, { texto: `Inscreveu ${nomeProj} num edital de cultura. Não foi aprovado desta vez: ${motivo}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: `Não aprovado: ${motivo}.`, tom: 'ruim' };
    }
    case 'audicao': {
      v.fatos['cena_audicao'] = v.t;
      const noto = nomePor(v, 'arte');
      // O tamanho da produção que chama para teste depende do que já se fez (o currículo, o nome).
      // Sem agente, novela e filme de estúdio não chamam (o porte para em 2); o trabalho que repercutiu abre um degrau.
      const repercutiu = v.fatos['av_repercutiu'] !== undefined && v.t - v.fatos['av_repercutiu'] <= 24 ? 0.15 : 0;
      const porte = Math.min(porteMaximoDoTeste(v), cv + noto / 100 + repercutiu >= 0.7 ? 3 : cv + noto / 100 + repercutiu >= 0.4 ? 2 : cv >= 0.12 ? 1 : 0) as 0 | 1 | 2 | 3;
      const tipos: ItemCurriculo['tipo'][][] = [['teatro', 'curta'], ['teatro', 'curta', 'serie'], ['serie', 'filme', 'teatro'], ['novela', 'filme', 'serie']];
      const tipo = r.pick(tipos[porte]);
      const exige = [52, 60, 68, 74][porte];
      const chance = clamp(0.3 + (h - exige) / 70 + cv * 0.15, 0.04, 0.7);
      const titulo = tituloFicticio(v, tipo, 'audicao');
      const onde = r.pick(CASAS[tipo]);
      const nomeTipo = { teatro: 'a montagem', curta: 'o curta', serie: 'a série', novela: 'a novela', filme: 'o filme', festival: 'o festival', publicidade: 'o comercial', show: 'o show', espetaculo: 'o espetáculo', edital: 'o projeto' }[tipo];
      if (r.chance(chance)) {
        const papel = h >= exige + 12 && r.chance(0.3) ? (porte >= 2 ? 'papel de destaque' : 'protagonista') : h >= exige ? 'coadjuvante' : 'elenco de apoio';
        // Alguém da produção fica na vida (a diretora, um colega de elenco): contato que pode chamar de novo.
        const contato = criarPessoa(v, r, { genero: r.chance(0.5) ? 'masculino' : 'feminino', idade: Math.max(20, idade(v) + r.int(-6, 15)), municipioId: v.moradia.municipioId });
        contato.ocupacao = r.chance(0.5) ? (contato.genero === 'feminino' ? 'diretora' : 'diretor') : (contato.genero === 'feminino' ? 'atriz' : 'ator');
        contato.ocupacaoId = contato.ocupacao.startsWith('diret') ? undefined : 'ator';
        vincular(v, contato, { origem: 'trabalho', estagio: 'colega', proximidade: 30, convivio: [] });
        lembrarCom(v, contato.id, `O teste de "${titulo}".`, 'trabalho', 1);
        // Passar não é receber: a produção manda a PROPOSTA (papel, duração, cachê) — aceitar é escolha (`audiovisual`).
        const prop = novaProposta(v, { tipo, porte, papel, casa: onde, titulo, pessoaId: contato.id });
        const texto = `Passou no teste: ${papel} ${nomeTipo.replace(/^o /, 'no ').replace(/^a /, 'na ')} "${titulo}", de ${onde}. A proposta chegou — ${prop.meses ? `${prop.meses} ${prop.meses === 1 ? 'mês' : 'meses'} de produção${prop.integral ? ', dedicação integral' : ''}, ` : ''}${contaDoContrato(prop)}.`;
        escrever(v, { texto, relevancia: porte >= 2 ? 'marco' : 'biografia', tema: 'trabalho', tom: 'bom', escolha: true, pessoas: [contato.id] });
        marcar(v, 'conquista', `Passou num teste de elenco: ${papel} ${nomeTipo.replace(/^o /, 'no ').replace(/^a /, 'na ')} "${titulo}".`, porte >= 2 ? 3 : 2, { dominio: d });
        // Quem ainda não vive disso e vai acumulando trabalhos recebe a porta para viver disso (aceitar é escolha).
        if (!trabalhaComArte(v, d) && pesoDoCurriculo(v) >= 0.25 && d === 'teatro') {
          novaOportunidade(v, { tipo: 'convite', ocupacaoId: porte >= 3 && h >= 75 ? 'ator_reconhecido' : 'ator', dominio: d, meses: 24, chave: 'convite_arte', titulo: 'Um convite para viver de atuar', texto: `Depois de "${titulo}", uma agência de atores ofereceu representar você: testes com frequência, trabalhos pagos — sem salário fixo.`, pessoaId: contato.id });
        }
        return { texto, tom: 'bom' };
      }
      const falta = h < exige - 5 ? 'tecnica' : cv < 0.12 ? 'experiencia' : 'concorrencia';
      const motivo = falta === 'tecnica' ? `a banca elogiou a presença, mas a cena ainda não está no nível que ${nomeTipo} pedia` : falta === 'experiencia' ? 'escolheram alguém com mais trabalhos no currículo — apresentações e trabalhos pequenos contam' : 'eram centenas de inscritos para poucos papéis; o seu nome ficou entre os últimos cortados';
      registrarDevolutiva(v, { tipo: 'arte', titulo: `Teste para ${nomeTipo} "${titulo}"`, texto: `Não passou: ${motivo}.`, passou: false, perto: chance >= 0.35, falta, dominio: d, nivel: nivelDoCurriculo(cv) });
      escrever(v, { texto: `Fez o teste para ${nomeTipo} "${titulo}". Não passou: ${motivo}.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: `Não passou: ${motivo}.`, tom: 'ruim' };
    }
    case 'trabalho_pequeno': {
      v.fatos['cena_pequeno'] = v.t;
      const tipo: ItemCurriculo['tipo'] = d === 'musica' ? 'show' : r.chance(0.6) ? 'publicidade' : 'curta';
      const titulo = d === 'musica' ? 'Casamento e festas' : tituloFicticio(v, tipo, 'pequeno');
      // Música de festa tem preço de mercado; o trabalho de tela, o cachê do audiovisual (a casa, o papel, o nome, o agente).
      const av = d === 'musica' ? undefined : cacheAudiovisual(v, { tipo, porte: 0, papel: tipo === 'publicidade' ? 'elenco' : 'figuração', casa: CASAS[tipo][0], titulo });
      const cache = av ? av.liquido : Math.round(900 * (0.8 + pub / 250 + h / 400) / 50) * 50;
      v.financas.conta += cache;
      registrarNoCurriculo(v, { tipo, titulo, papel: d === 'musica' ? 'músico contratado' : tipo === 'publicidade' ? 'elenco' : 'figuração', onde: CASAS[tipo][0], repercussao: 0, cache: av?.bruto ?? cache });
      crescerPublico(v, 1);
      const conta = av && av.comissao ? ` (${fmt(av.bruto)} bruto, ${fmt(av.comissao)} do agente)` : '';
      const texto = d === 'musica' ? `Tocou em festas e casamentos por um cachê (${fmt(cache)}). Não é o palco dos sonhos; pagou as cordas novas.` : tipo === 'publicidade' ? `Fez ${titulo.toLowerCase()} (${fmt(cache)}${conta}). Três segundos de tela — mas é um trabalho no currículo.` : `Fez figuração no curta "${titulo}" (${fmt(cache)}${conta}). Poucas falas, muita espera, e alguns contatos.`;
      escrever(v, { texto, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto, tom: 'neutro' };
    }
  }
}

/* ---------------------------------------------------- O convite do festival */

/**
 * O festival que chamou depois de uma obra que repercutiu: aceitar é
 * apresentar-se lá. O resultado pode ser bom ou fraco — mas sempre é um
 * resultado (cachê, público, currículo, às vezes um convite).
 */
export function apresentarNoFestival(v: Vida, r: Rng, o: Oportunidade): { texto: string; tom: 'bom' | 'ruim' | 'neutro' } {
  const d = (o.dominio && LINGUAGENS_DE_CENA.includes(o.dominio) ? o.dominio : linguagemEmCena(v)) ?? 'teatro';
  const h = habilidade(v, d);
  const pub = publicoAgora(v);
  const q = h / 100 * 0.5 + pub / 100 * 0.3 + pesoDoCurriculo(v) * 0.1 + r.normal() * 0.13;
  const repercussao: ItemCurriculo['repercussao'] = q >= 0.6 ? 3 : q >= 0.48 ? 2 : q >= 0.34 ? 1 : 0;
  const cache = Math.max(800, Math.round(cacheDeApresentacao(v, d) * 1.5 / 100) * 100);
  v.financas.conta += cache;
  crescerPublico(v, [1, 4, 8, 13][repercussao]);
  praticar(v, r, d, 0.15, 1);
  const capital = municipio(capitalDoEstado(v.moradia.municipioId)).nome;
  const titulo = (o.texto.match(/"([^"]+)"/)?.[1]) ?? tituloFicticio(v, 'festival', 'festival');
  registrarNoCurriculo(v, { tipo: 'festival', titulo, papel: v.caminhos.arte?.ativo ? `com ${v.caminhos.arte.nome}` : 'apresentação', onde: `um festival em ${capital}`, repercussao, cache });
  const texto = repercussao >= 3 ? `Apresentou "${titulo}" no festival de ${capital}: plateia cheia, crítica boa, gente pedindo contato na saída. Cachê de ${fmt(cache)}.`
    : repercussao === 2 ? `Apresentou "${titulo}" no festival de ${capital}. Público novo, um bom comentário na programação. Cachê de ${fmt(cache)}.`
      : repercussao === 1 ? `Apresentou "${titulo}" no festival de ${capital}. Recepção morna, alguns contatos. Cachê de ${fmt(cache)}.`
        : `Apresentou "${titulo}" no festival de ${capital}, num horário ruim e para pouca gente. Não trouxe novos convites — mas o cachê (${fmt(cache)}) e a experiência ficaram.`;
  escrever(v, { texto, relevancia: repercussao >= 2 ? 'biografia' : 'cotidiano', tema: 'trabalho', tom: repercussao >= 2 ? 'bom' : repercussao === 0 ? 'ruim' : undefined, escolha: true });
  if (repercussao >= 2) marcar(v, 'conquista', texto, repercussao >= 3 ? 3 : 2, { dominio: d });
  if (repercussao >= 3 && d === 'teatro' && !trabalhaComArte(v, d)) {
    novaOportunidade(v, { tipo: 'convite', ocupacaoId: 'ator', dominio: d, meses: 24, chave: 'convite_arte', titulo: 'Depois do festival', texto: 'Uma produtora que viu o festival chamou para a próxima montagem, com cachê — e a chance de viver de atuar.' });
  }
  return { texto, tom: repercussao >= 2 ? 'bom' : repercussao === 0 ? 'ruim' : 'neutro' };
}

/* ---------------------------------------------------------------- Leitura */

export function leituraDoCurriculo(v: Vida): { linhas: string[]; palavra: string } {
  const itens = [...(v.caminhos.curriculo ?? [])].sort((a, b) => b.t - a.t);
  const NOME = { teatro: 'teatro', festival: 'festival', publicidade: 'publicidade', curta: 'curta', serie: 'série', novela: 'novela', filme: 'filme', show: 'show', espetaculo: 'espetáculo', edital: 'edital' } as const;
  const REP = ['', ' · teve público', ' · repercutiu', ' · marcou'];
  return {
    palavra: PALAVRA_CURRICULO[nivelDoCurriculo(pesoDoCurriculo(v))],
    linhas: itens.slice(0, 12).map(x => `${anoDe(x.t)} — ${x.titulo} — ${NOME[x.tipo]}${x.papel ? ` — ${x.papel}` : ''}${REP[x.repercussao]}`)
  };
}
