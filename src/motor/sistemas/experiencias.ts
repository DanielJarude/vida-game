/**
 * Experiências: o que o dinheiro compra além de objetos — possibilidades de
 * vida. A viagem com quem se ama, o curso caro de um gosto antigo, o ano
 * sabático curto, o projeto de alguém que se decide bancar. Cada uma custa,
 * deixa memória (na Linha da Vida e com quem foi junto) e muda algo real: a
 * cabeça descansa, um vínculo se aproxima, uma prática começa, uma causa anda.
 *
 * AÇÕES GENÉRICAS SÃO PORTAS, NÃO RESULTADOS (pacote pós-playtest). A
 * categoria continua limpa na tela; a profundidade vem DEPOIS de abri-la:
 *
 *   viagem pelo país     → o destino e a duração (o preço sai da origem, do
 *                           destino, de quantos vão e de quantos dias) — o
 *                           país é o de onde a pessoa MORA (viajar não é
 *                           migrar: a casa continua onde está)
 *   viagem para fora     → o país/cidade e a duração (o mundo menos o país
 *                           onde se mora — o Brasil entra para quem mora fora)
 *   curso                → o domínio (fotografia, gastronomia, cerâmica,
 *                           dança, escrita) — e, na música, o instrumento
 *   bancar um projeto    → de quem/do quê, entre o que existe nesta vida (o
 *                           amigo, a família, a escola onde estudou, a causa)
 *   presente grande      → para quem, e qual presente (a reforma, a viagem,
 *                           o carro, quitar a dívida, a entrada do imóvel, o
 *                           estudo)
 *
 * Uma viagem pode render um encontro (alguém que fica na vida, com o
 * contexto de onde veio) ou um imprevisto; a memória fica.
 *
 * Luxo não dá fama: nada aqui mexe na notoriedade. Uma doação grande pode
 * virar notícia local — e isso é imagem, não fama.
 */

import { educacaoDaVida, paisDaVida } from '../mundo/vida';
import { ORDEM_REGIOES, PAIS_PADRAO, ROTULO_REGIAO, doPais, existePais, paisDoCatalogo, paisesVivenciaveis, perfilDoPais } from '../mundo/registro';
import { paisCorrente, precosDoPais } from '../mundo/moeda';
import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Pessoa, Vida } from '../tipos';
import { escrever, idade, idadePessoa, lembrarCom, moraCom, parceiro, vinculosVivos } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { cidadesDoPais, economiaLocal, grandesCentros, municipio, nomeDaDivisao, regiaoDaUf, type Municipio } from '../dados/lugares';
import { dinheiro as fmt, flex, listaNatural } from '../texto';
import { disponivel, pagar, vereditoDePagar } from './dinheiro';
import { garantirFrente, praticar } from './frentes';
import { marcar } from './marcas';
import { criarPessoa, vincular } from '../pessoas';
import { novoContexto, registrarFase } from './relacoes';

export type TipoExperiencia = 'viagem_pais' | 'viagem_exterior' | 'curso_caro' | 'sabatico' | 'bancar_projeto' | 'presente_familia';

interface ModeloExperiencia {
  id: TipoExperiencia;
  nome: string;
  /** Custo de referência (a escolha concreta define o preço; este é o "a partir de"). */
  custo: number;
  /** Uma vez a cada tantos meses. */
  intervalo: number;
  /** A partir de quanto dinheiro disponível faz sentido oferecer (não é "pode comprar": é "aparece"). */
  aparece: number;
  descricao: string;
}

export const EXPERIENCIAS: readonly ModeloExperiencia[] = [
  { id: 'viagem_pais', nome: 'Uma viagem pelo país', custo: 5500, intervalo: 12, aparece: 12000, descricao: 'Escolher o destino e quantos dias.' },
  { id: 'viagem_exterior', nome: 'Uma viagem para fora do país', custo: 16000, intervalo: 24, aparece: 45000, descricao: 'Escolher o país, a cidade e quanto tempo.' },
  { id: 'curso_caro', nome: 'Um curso de um gosto antigo', custo: 7000, intervalo: 24, aparece: 25000, descricao: 'Escolher o quê: fotografia, gastronomia, cerâmica, música, dança, escrita.' },
  { id: 'sabatico', nome: 'Três meses sem trabalhar (um tempo sabático)', custo: 0, intervalo: 60, aparece: 120000, descricao: 'Parar por uns meses, com o dinheiro que se guardou. O trabalho espera — ou não.' },
  { id: 'bancar_projeto', nome: 'Bancar o projeto de alguém', custo: 20000, intervalo: 24, aparece: 150000, descricao: 'Escolher de quem, ou de quê: gente e lugares da sua vida.' },
  { id: 'presente_familia', nome: 'Um presente grande para a família', custo: 12000, intervalo: 24, aparece: 60000, descricao: 'Escolher para quem e qual presente.' }
];

const modelo = (id: TipoExperiencia) => EXPERIENCIAS.find(x => x.id === id)!;
const chave = (id: TipoExperiencia) => `exp_${id}`;

/** Quem vai junto (a parceria, os filhos em casa). */
function companhia(v: Vida): Pessoa[] {
  return moraCom(v).filter(p => !p.especie && (v.vinculos[p.id]?.romance || ['filho', 'enteado'].includes(v.vinculos[p.id]?.parentesco ?? ''))).slice(0, 4);
}

/* ------------------------------------------------------------ Os destinos */

/** Destinos do país: a região define a distância (e o transporte); `diaria` é o custo local por pessoa e dia. */
const DESTINOS_BR = [
  { id: 'chapada', nome: 'a Chapada Diamantina', uf: 'BA', diaria: 330 }, { id: 'lencois', nome: 'os Lençóis Maranhenses', uf: 'MA', diaria: 360 },
  { id: 'bonito', nome: 'Bonito', uf: 'MS', diaria: 480 }, { id: 'foz', nome: 'Foz do Iguaçu', uf: 'PR', diaria: 380 },
  { id: 'ouro_preto', nome: 'Ouro Preto', uf: 'MG', diaria: 290 }, { id: 'jeri', nome: 'Jericoacoara', uf: 'CE', diaria: 420 },
  { id: 'noronha', nome: 'Fernando de Noronha', uf: 'PE', diaria: 1150 }, { id: 'rio', nome: 'o Rio de Janeiro', uf: 'RJ', diaria: 480 },
  { id: 'gramado', nome: 'Gramado', uf: 'RS', diaria: 460 }, { id: 'salvador', nome: 'Salvador', uf: 'BA', diaria: 350 },
  { id: 'amazonia', nome: 'a Amazônia, a partir de Manaus', uf: 'AM', diaria: 520 }, { id: 'pantanal', nome: 'o Pantanal', uf: 'MT', diaria: 560 }
] as const;
/** Destinos de fora: a distância do Brasil define a passagem (por pessoa, ida e volta). */
const DESTINOS_FORA = [
  { id: 'buenos_aires', nome: 'Buenos Aires', passagem: 2400, diaria: 520 }, { id: 'montevideu', nome: 'Montevidéu', passagem: 2300, diaria: 560 },
  { id: 'santiago', nome: 'Santiago', passagem: 2900, diaria: 560 }, { id: 'cusco', nome: 'Cusco e o Vale Sagrado', passagem: 3600, diaria: 460 },
  { id: 'cartagena', nome: 'Cartagena', passagem: 3800, diaria: 540 }, { id: 'cidade_mexico', nome: 'a Cidade do México', passagem: 4800, diaria: 520 },
  { id: 'lisboa', nome: 'Lisboa', passagem: 5600, diaria: 760 }, { id: 'paris', nome: 'Paris', passagem: 6200, diaria: 1100 },
  { id: 'roma', nome: 'Roma', passagem: 6000, diaria: 980 }, { id: 'nova_york', nome: 'Nova York', passagem: 6400, diaria: 1350 },
  { id: 'toquio', nome: 'Tóquio', passagem: 9800, diaria: 1100 }
] as const;
const DURACOES = [{ id: 'curta', nome: 'fim de semana prolongado', dias: 4 }, { id: 'semana', nome: 'uma semana', dias: 7 }, { id: 'duas', nome: 'duas semanas', dias: 14 }] as const;

const CURSOS: { id: string; nome: string; dominio: Dominio; custo: number; instrumento?: string }[] = [
  { id: 'fotografia', nome: 'fotografia', dominio: 'fotografia', custo: 6500 }, { id: 'gastronomia', nome: 'gastronomia', dominio: 'cozinha', custo: 8500 },
  { id: 'ceramica', nome: 'cerâmica', dominio: 'manual', custo: 5200 }, { id: 'danca', nome: 'dança', dominio: 'danca', custo: 4800 },
  { id: 'escrita', nome: 'escrita criativa', dominio: 'escrita', custo: 4200 }, { id: 'desenho', nome: 'desenho e pintura', dominio: 'desenho', custo: 5000 },
  { id: 'musica:violao', nome: 'violão', dominio: 'musica', custo: 5400, instrumento: 'violão' }, { id: 'musica:piano', nome: 'piano', dominio: 'musica', custo: 7800, instrumento: 'piano' },
  { id: 'musica:bateria', nome: 'bateria', dominio: 'musica', custo: 6800, instrumento: 'bateria' }, { id: 'musica:canto', nome: 'canto', dominio: 'musica', custo: 5600, instrumento: 'canto' }
];

const PRESENTES = [
  { id: 'reforma', nome: 'a reforma da casa', custo: 28000, para: 'pais' }, { id: 'viagem', nome: 'a viagem que nunca fizeram', custo: 12000, para: 'qualquer' },
  { id: 'carro', nome: 'um carro', custo: 55000, para: 'qualquer' }, { id: 'divida', nome: 'quitar a dívida', custo: 15000, para: 'aperto' },
  { id: 'entrada', nome: 'a entrada de um imóvel', custo: 60000, para: 'adulto' }, { id: 'estudo', nome: 'pagar os estudos', custo: 30000, para: 'jovem' }
] as const;

/* ------------------------------------------------------------ As escolhas de cada porta */

export interface EscolhaDeExperiencia { id: string; rotulo: string; descricao?: string; custo: number; grupo?: string }

/** Pessoas a quem dar um presente grande (família próxima, viva). */
function presenteaveis(v: Vida): Pessoa[] {
  return vinculosVivos(v).filter(x => !x.p.especie && (['mae', 'pai', 'avo', 'irmao', 'filho', 'enteado'].includes(x.vin.parentesco ?? '') || (x.vin.romance && ['namoro', 'morando_junto', 'casamento'].includes(x.vin.romance.estagio)))).map(x => x.p).slice(0, 6);
}

/** Os projetos que esta vida conhece (gente, lugares, causas) — o que se pode bancar. */
function projetosPossiveis(v: Vida): { id: string; rotulo: string; pessoaId?: string; custo: number; descricao: string }[] {
  const out: { id: string; rotulo: string; pessoaId?: string; custo: number; descricao: string }[] = [];
  const amigos = vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && (x.vin.estagio === 'amigo' || x.vin.estagio === 'amigo_proximo')).sort((a, b) => b.vin.proximidade - a.vin.proximidade);
  const amigo = amigos[0];
  if (amigo) out.push({ id: `amigo:${amigo.p.id}`, pessoaId: amigo.p.id, rotulo: `o projeto de ${amigo.p.nome}`, custo: 25000, descricao: `${amigo.p.nome} quer ${amigo.p.ocupacao ? 'abrir o próprio negócio' : 'tirar uma ideia do papel'} e não tem como começar.` });
  const parente = vinculosVivos(v).find(x => !x.p.especie && ['irmao', 'tio', 'primo'].includes(x.vin.parentesco ?? '') && idadePessoa(v, x.p) >= 22 && (x.p.renda < 4000 || !!x.p.aperto));
  if (parente) out.push({ id: `familia:${parente.p.id}`, pessoaId: parente.p.id, rotulo: `o pequeno negócio de ${parente.p.nome}`, custo: 20000, descricao: `${parente.p.nome} vende por encomenda e precisa de equipamento para crescer.` });
  const natal = municipio(v.eu.municipioNatal).nome;
  out.push({ id: 'escola', rotulo: `a biblioteca da escola onde você estudou, em ${natal}`, custo: 18000, descricao: 'Livros, cadeiras, computador: a escola que ajudou a fazer você.' });
  out.push({ id: 'ong', rotulo: 'o cursinho popular do bairro', custo: 15000, descricao: `Um ano de aulas de graça para quem vai fazer ${educacaoDaVida(v).o}.` });
  if (Object.entries(v.caminhos.frentes).some(([d, f]) => ['musica', 'teatro', 'danca', 'escrita'].includes(d) && (f?.habilidade ?? 0) >= 40)) out.push({ id: 'cultura', rotulo: 'um grupo de cultura da cidade', custo: 20000, descricao: 'O grupo que ensaia na quadra precisa de som, luz e transporte.' });
  if (v.educacao.concluidos.some(c => ['mestrado', 'doutorado'].includes(c.nivel)) || (v.educacao.vivencias ?? []).some(x => x.tipo === 'iniciacao')) out.push({ id: 'pesquisa', rotulo: 'a pesquisa de um laboratório da universidade', custo: 30000, descricao: 'Um equipamento que o edital não cobriu.' });
  return out;
}

/** As escolhas DENTRO da porta (a tela mostra depois de abrir a categoria). */
export function escolhasDaExperiencia(v: Vida, id: TipoExperiencia): EscolhaDeExperiencia[] {
  const c = economiaLocal(v.moradia.municipioId).custo;
  const gente = 1 + companhia(v).length * 0.8;
  switch (id) {
    case 'viagem_pais': case 'viagem_exterior':
      return destinosDeViagem(v, id === 'viagem_exterior').flatMap(d => DURACOES.filter(du => du.id !== 'curta' || d.curta).map(du => ({
        id: `${d.id}:${du.id}`, grupo: d.nome, rotulo: `${cap(d.nome)} — ${du.nome}`, custo: Math.round((d.ida + d.diaria * du.dias) * gente / 100) * 100
      })));
    case 'curso_caro':
      return CURSOS.map(x => ({ id: x.id, rotulo: x.instrumento ? `Música: ${x.nome}` : cap(x.nome), custo: Math.round(x.custo * c / 100) * 100, grupo: x.instrumento ? 'música' : undefined }));
    case 'bancar_projeto':
      return projetosPossiveis(v).map(x => ({ id: x.id, rotulo: cap(x.rotulo), descricao: x.descricao, custo: Math.round(x.custo * c / 100) * 100 }));
    case 'presente_familia':
      return presenteaveis(v).flatMap(p => {
        const vin = v.vinculos[p.id];
        const i = idadePessoa(v, p);
        const pais = ['mae', 'pai', 'avo'].includes(vin?.parentesco ?? '');
        return PRESENTES.filter(x => x.para === 'qualquer' || (x.para === 'pais' && pais) || (x.para === 'aperto' && p.aperto?.tipo === 'dinheiro' && !p.aperto.resolvido) || (x.para === 'adulto' && i >= 22 && !pais) || (x.para === 'jovem' && i >= 15 && i <= 26 && !pais))
          .map(x => ({ id: `${p.id}:${x.id}`, grupo: p.nome, rotulo: `${p.nome}: ${x.nome}`, custo: Math.round(x.custo * (x.id === 'reforma' || x.id === 'entrada' ? c : 1) / 100) * 100 }));
      });
    case 'sabatico':
      return [];
  }
}

/* ------------------------------------------------------------ O catálogo das viagens (a forma da escolha) */

/**
 * Para fora, a escolha anda em níveis: o país, depois a cidade. Os países
 * daqui têm cidades escolhidas à mão (DESTINOS_FORA — o id da escolha
 * continua `cidade:duração`: saves e ações antigas valem); os outros países
 * que podem ser vividos entram com a capital e o maior centro. O Brasil
 * entra para quem mora fora (com destinos de DESTINOS_BR).
 */
const PAISES_FORA: readonly { id: string; iso: string; nome: string; continente: string; cidades: readonly string[] }[] = [
  { id: 'argentina', iso: 'AR', nome: 'Argentina', continente: 'América do Sul', cidades: ['buenos_aires'] },
  { id: 'uruguai', iso: 'UY', nome: 'Uruguai', continente: 'América do Sul', cidades: ['montevideu'] },
  { id: 'chile', iso: 'CL', nome: 'Chile', continente: 'América do Sul', cidades: ['santiago'] },
  { id: 'peru', iso: 'PE', nome: 'Peru', continente: 'América do Sul', cidades: ['cusco'] },
  { id: 'colombia', iso: 'CO', nome: 'Colômbia', continente: 'América do Sul', cidades: ['cartagena'] },
  { id: 'mexico', iso: 'MX', nome: 'México', continente: 'América do Norte', cidades: ['cidade_mexico'] },
  { id: 'estados_unidos', iso: 'US', nome: 'Estados Unidos', continente: 'América do Norte', cidades: ['nova_york'] },
  { id: 'portugal', iso: 'PT', nome: 'Portugal', continente: 'Europa', cidades: ['lisboa'] },
  { id: 'franca', iso: 'FR', nome: 'França', continente: 'Europa', cidades: ['paris'] },
  { id: 'italia', iso: 'IT', nome: 'Itália', continente: 'Europa', cidades: ['roma'] },
  { id: 'japao', iso: 'JP', nome: 'Japão', continente: 'Ásia', cidades: ['toquio'] }
];
/** O Brasil, visto de fora: destinos de DESTINOS_BR. */
const BRASIL_DE_FORA = ['rio', 'salvador', 'foz'] as const;
const REGIOES_BR = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const;

/**
 * A passagem de avião (ida e volta, por pessoa) entre dois países, na
 * unidade do Brasil: a mesma régua dos destinos de DESTINOS_FORA (vizinho,
 * mesmo continente, oceano no meio, meio mundo).
 */
function passagemEntre(de: string, para: string): number {
  const a = paisDoCatalogo(de), b = paisDoCatalogo(para);
  if (a.sub === b.sub) return 2400;
  if (a.regiao === b.regiao) return 3200;
  const bloco = (r: string) => (r.startsWith('america') ? 'A' : r === 'europa' || r === 'africa' ? 'E' : 'O');
  const x = bloco(a.regiao), y = bloco(b.regiao);
  if (x === y) return 4800;
  return x === 'A' && y === 'O' || x === 'O' && y === 'A' ? 9800 : 6000;
}

/** Um destino, já com o preço desta vida: `ida` é o transporte (ida e volta, por pessoa); `diaria`, o custo local por pessoa e dia. */
interface DestinoDeViagem {
  id: string; nome: string; ida: number; diaria: number;
  /** Aceita o fim de semana prolongado (perto o bastante). */
  curta: boolean;
  grupo: string; grupoNome: string; secao?: string; ordem: number;
}

const pontoDeTurismo = (m: Municipio) => (m.capitalNacional ? 4 : 0) + (m.perfil === 'metropole' ? 3 : 0) + (m.litoral ? 2 : 0) + (m.capital ? 1 : 0);

/** Os destinos de uma viagem: pelo país onde se mora, ou para fora dele. */
function destinosDeViagem(v: Vida, fora: boolean): DestinoDeViagem[] {
  const aqui = municipio(v.moradia.municipioId);
  const pais = paisDaVida(v);
  const longe = aqui.perfil === 'pequena' || aqui.perfil === 'polo' ? 1 : 0;
  if (!fora) {
    if (pais === PAIS_PADRAO) {
      return DESTINOS_BR.filter(d => d.uf !== aqui.uf || d.id === 'noronha').map(d => {
        // O transporte: na mesma região, ônibus ou um voo curto; de outra região, avião (mais caro saindo de cidade pequena).
        const mesmaRegiao = regiaoDaUf(d.uf) === aqui.regiao;
        const rg = regiaoDaUf(d.uf);
        return { id: d.id, nome: d.nome, ida: (mesmaRegiao ? 650 : 1500) + longe * 450 + (d.id === 'noronha' ? 900 : 0), diaria: d.diaria, curta: true, grupo: rg, grupoNome: rg, ordem: REGIOES_BR.indexOf(rg) };
      });
    }
    // Fora do Brasil: as cidades do país que atraem visita (a capital, as metrópoles, o litoral), longe de casa.
    const divisoes = perfilDoPais(pais).divisao.lista.map(d => d.codigo);
    const mesmaMetro = (m: Municipio) => m.id === aqui.id || m.metropole === aqui.id || aqui.metropole === m.id || (!!m.metropole && m.metropole === aqui.metropole);
    return cidadesDoPais(pais).filter(m => !mesmaMetro(m) && pontoDeTurismo(m) > 0)
      .sort((a, b) => pontoDeTurismo(b) - pontoDeTurismo(a)).slice(0, 12)
      .map(m => ({
        id: m.id.replace(':', '.'), nome: m.nome,
        ida: (m.uf === aqui.uf ? 650 : 1500) + longe * 450,
        diaria: Math.round(400 * economiaLocal(m.id).custo / 10) * 10,
        curta: true, grupo: m.uf, grupoNome: nomeDaDivisao(m), ordem: Math.max(0, divisoes.indexOf(m.uf))
      }));
  }
  // Para fora: a passagem e a diária estão na unidade do Brasil (o preço de mercado de lá); quem mora num país de preços
  // mais altos paga menos unidades pelo mesmo voo e pelo mesmo hotel (o câmbio, `mundo/moeda`). Do Brasil, os de sempre.
  const f = 1 / precosDoPais(pais);
  const regiao = (iso: string) => Math.max(0, ORDEM_REGIOES.indexOf(paisDoCatalogo(iso).regiao));
  const out: DestinoDeViagem[] = [];
  const curados = new Set(PAISES_FORA.map(p => p.iso));
  for (const p of PAISES_FORA) {
    if (p.iso === pais) continue;
    for (const c of p.cidades) {
      const d = DESTINOS_FORA.find(x => x.id === c)!;
      const passagem = pais === PAIS_PADRAO ? d.passagem : passagemEntre(pais, p.iso);
      out.push({ id: d.id, nome: d.nome, ida: (passagem + longe * 700) * f, diaria: d.diaria * f, curta: passagem < 3000, grupo: p.id, grupoNome: p.nome, secao: p.continente, ordem: regiao(p.iso) });
    }
  }
  if (pais !== PAIS_PADRAO) {
    const passagem = passagemEntre(pais, PAIS_PADRAO);
    for (const c of BRASIL_DE_FORA) {
      const d = DESTINOS_BR.find(x => x.id === c)!;
      out.push({ id: d.id, nome: d.nome, ida: (passagem + longe * 700) * f, diaria: d.diaria * f, curta: passagem < 3000, grupo: 'brasil', grupoNome: 'Brasil', secao: ROTULO_REGIAO.america_sul, ordem: regiao(PAIS_PADRAO) });
    }
  }
  for (const p of paisesVivenciaveis()) {
    if (p.id === pais || p.id === PAIS_PADRAO || curados.has(p.id) || !p.economia) continue;
    const passagem = passagemEntre(pais, p.id);
    const diaria = Math.round(560 * precosDoPais(p.id) / 10) * 10;
    for (const id of [...new Set(grandesCentros(p.id))].reverse()) {
      const m = municipio(id);
      out.push({ id: m.id.replace(':', '.'), nome: m.nome, ida: (passagem + longe * 700) * f, diaria: diaria * f, curta: passagem < 3000, grupo: p.id.toLowerCase(), grupoNome: p.nome, secao: ROTULO_REGIAO[p.regiao], ordem: regiao(p.id) });
    }
  }
  // Por continente (a ordem de sempre dentro dele).
  return out.map((d, i) => ({ d, i })).sort((a, b) => a.d.ordem - b.d.ordem || a.i - b.i).map(x => x.d);
}

export interface DuracaoDeViagem { /** O id da escolha da ação (`destino:duração`). */ escolha: string; id: string; nome: string; dias: number; custo: number }
export interface LugarDeViagem { id: string; nome: string; duracoes: DuracaoDeViagem[]; aPartirDe: number }
export interface GrupoDeViagem { id: string; nome: string; /** Agrupamento acima do grupo (o continente), só para a leitura da lista. */ secao?: string; lugares: LugarDeViagem[]; aPartirDe: number }
export interface CatalogoDeViagem {
  tipo: 'viagem_pais' | 'viagem_exterior';
  /** O que é cada nível: o país e a cidade (fora), a região e o destino (no Brasil). */
  nivelGrupo: 'país' | 'região';
  nivelLugar: 'cidade' | 'destino';
  grupos: GrupoDeViagem[];
  /** Quem vai junto (entra no preço). */
  companhia: string[];
  /** A pergunta do primeiro nível ("Para que parte do Brasil?", "Para que parte do Japão?"). */
  perguntaGrupo: string;
}

/**
 * A viagem em níveis, DERIVADA das mesmas escolhas da ação (mesmos ids,
 * mesmos preços): a tela percorre país → cidade → duração (ou região →
 * destino → duração) sem nunca mostrar todas as combinações de uma vez.
 */
export function catalogoDeViagem(v: Vida, id: 'viagem_pais' | 'viagem_exterior'): CatalogoDeViagem {
  const fora = id === 'viagem_exterior';
  const porLugar = new Map<string, DuracaoDeViagem[]>();
  for (const e of escolhasDaExperiencia(v, id)) {
    const [destId, durId] = e.id.split(':');
    const du = DURACOES.find(d => d.id === durId);
    if (!du) continue;
    const xs = porLugar.get(destId) ?? [];
    xs.push({ escolha: e.id, id: du.id, nome: du.nome, dias: du.dias, custo: e.custo });
    porLugar.set(destId, xs);
  }
  const lugar = (destId: string, nome: string): LugarDeViagem | undefined => {
    const duracoes = porLugar.get(destId);
    return duracoes?.length ? { id: destId, nome: cap(nome), duracoes, aPartirDe: Math.min(...duracoes.map(d => d.custo)) } : undefined;
  };
  const grupo = (gid: string, nome: string, lugares: (LugarDeViagem | undefined)[], secao?: string): GrupoDeViagem | undefined => {
    const ls = lugares.filter((x): x is LugarDeViagem => !!x);
    return ls.length ? { id: gid, nome, secao, lugares: ls, aPartirDe: Math.min(...ls.map(l => l.aPartirDe)) } : undefined;
  };
  const destinos = destinosDeViagem(v, fora);
  const ordemGrupos: string[] = [];
  for (const d of [...destinos].sort((a, b) => a.ordem - b.ordem)) if (!ordemGrupos.includes(d.grupo)) ordemGrupos.push(d.grupo);
  const grupos = ordemGrupos.map(gid => {
    const ds = destinos.filter(d => d.grupo === gid);
    return grupo(gid, ds[0].grupoNome, ds.map(d => lugar(d.id, d.nome)), ds[0].secao);
  });
  const pais = paisDaVida(v);
  return {
    tipo: id, nivelGrupo: fora ? 'país' : 'região', nivelLugar: fora ? 'cidade' : 'destino', grupos: grupos.filter((g): g is GrupoDeViagem => !!g), companhia: companhia(v).map(p => p.nome),
    perguntaGrupo: fora ? 'Para qual país?' : `Para que parte ${doPais(pais)}?`
  };
}

export function custoDaExperiencia(v: Vida, id: TipoExperiencia, escolha?: string): number {
  if (id === 'sabatico') return Math.round(Math.max(9000, (v.trabalho.atual?.salario ?? 3000) * 3) / 100) * 100;
  const xs = escolhasDaExperiencia(v, id);
  const x = escolha ? xs.find(e => e.id === escolha) : undefined;
  const aPartirDe = xs.length ? Math.min(...xs.map(e => e.custo)) : modelo(id).custo;
  return x?.custo ?? aPartirDe;
}

/** O que aparece para esta vida agora (pelo que ela tem, não pelo que o catálogo tem). */
export function experienciasPossiveis(v: Vida): TipoExperiencia[] {
  if (idade(v) < 18 || v.justica?.prisao) return [];
  const d = disponivel(v);
  return EXPERIENCIAS.filter(x => d >= x.aparece && (x.id !== 'presente_familia' || presenteaveis(v).length > 0) && (x.id !== 'sabatico' || !!v.trabalho.atual)).map(x => x.id);
}

export function disponibilidadeExperiencia(v: Vida, id: TipoExperiencia, escolha?: string): Veredito {
  const m = EXPERIENCIAS.find(x => x.id === id);
  if (!m) return bloqueio('impossivel', 'Não existe.');
  if (idade(v) < 18) return bloqueio('requisito', 'A partir dos 18.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  const t = v.fatos[chave(id)];
  if (t !== undefined && v.t - t < m.intervalo) return bloqueio('incompativel', m.intervalo >= 24 ? 'Foi há pouco — a próxima fica para daqui a um tempo.' : 'Já foi este ano.');
  if (id === 'presente_familia' && !presenteaveis(v).length) return bloqueio('impossivel', 'Não há ninguém da família por perto para presentear.');
  if (id === 'sabatico' && !v.trabalho.atual) return bloqueio('impossivel', 'Sem trabalho, não há de que tirar um tempo.');
  if (escolha && id !== 'sabatico' && !escolhasDaExperiencia(v, id).some(e => e.id === escolha)) return bloqueio('impossivel', 'Essa opção não existe nesta vida.');
  return vereditoDePagar(v, custoDaExperiencia(v, id, escolha), 'Custa uns');
}

/** Viver a experiência escolhida. Sem escolha (saves e simulações antigas), vale a primeira opção da porta. */
export function viverExperiencia(v: Vida, r: Rng, id: TipoExperiencia, escolha?: string): string {
  const opcoes = escolhasDaExperiencia(v, id);
  const esc = id === 'sabatico' ? undefined : opcoes.find(e => e.id === escolha) ?? opcoes[0];
  const custo = custoDaExperiencia(v, id, esc?.id);
  pagar(v, custo);
  v.fatos[chave(id)] = v.t;
  const com = companhia(v);
  const nomes = listaNatural(com.map(p => p.nome));
  const perto = (n: number, texto: string) => { for (const p of com) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + n); lembrarCom(v, p.id, texto, 'ritual', 2); } } };
  switch (id) {
    case 'viagem_pais': case 'viagem_exterior': {
      const fora = id === 'viagem_exterior';
      const [destId, durId] = (esc?.id ?? '').split(':');
      const dest = destinosDeViagem(v, fora).find(d => d.id === destId) ?? destinosDeViagem(v, fora)[0];
      const dur = DURACOES.find(d => d.id === durId) ?? DURACOES[1];
      const fator = dur.dias / 7;
      v.mente.felicidade = clamp(v.mente.felicidade + (fora ? 7 : 5) * Math.min(1.4, 0.6 + fator * 0.4));
      v.mente.estresse = clamp(v.mente.estresse - (fora ? 9 : 6) * Math.min(1.5, 0.6 + fator * 0.4));
      perto(Math.round((fora ? 7 : 5) * Math.min(1.3, 0.7 + fator * 0.3)), `A viagem para ${dest.nome}.`);
      const texto = `Viajou para ${dest.nome} (${dur.nome})${com.length ? `, com ${nomes}` : flex(v.eu.genero, ', sozinho', ', sozinha', ', sozinhe')}.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom', escolha: true, pessoas: com.map(p => p.id) });
      const extra = acontecimentoDeViagem(v, r, dest.nome, com.length === 0, fora);
      return `${fmt(custo)} entre passagem, hospedagem e o resto. ${com.length ? 'Voltaram com fotos demais e uma história que vão repetir por anos.' : 'Voltou outra pessoa — um pouco.'}${extra ? ` ${extra}` : ''}`;
    }
    case 'curso_caro': {
      const curso = CURSOS.find(x => x.id === esc?.id) ?? CURSOS[0];
      garantirFrente(v, curso.dominio);
      const f = v.caminhos.frentes[curso.dominio]!;
      f.interesse = clamp(f.interesse + 15);
      praticar(v, r, curso.dominio, 1.2, 1.5);
      v.mente.felicidade = clamp(v.mente.felicidade + 4);
      if (curso.instrumento) v.fatos[`instrumento:${curso.id.split(':')[1]}`] = v.t;
      const nome = curso.instrumento ? `${curso.instrumento === 'canto' ? 'canto' : curso.instrumento}` : curso.nome;
      escrever(v, { texto: `Fez um curso de ${nome} com gente muito boa. O gosto antigo virou prática.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom', escolha: true });
      return `Um curso de ${nome}: aulas, material, e a vontade de continuar em casa (dá para virar atividade da semana, em Tempo livre).`;
    }
    case 'sabatico': {
      v.mente.estresse = clamp(v.mente.estresse - 22);
      v.mente.felicidade = clamp(v.mente.felicidade + 7);
      const e = v.trabalho.atual!;
      const clt = e.contrato === 'clt' || e.contrato === 'servidor';
      if (clt) { e.desempenho = clamp(e.desempenho - 4); }
      else if (e.clientela !== undefined) { e.clientela = Math.round(e.clientela * 0.85); }
      escrever(v, { texto: `Tirou três meses para si: sem trabalho, sem pressa. ${clt ? 'Uma licença negociada no trabalho.' : 'A freguesia sentiu a ausência.'}`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
      return `Três meses vivendo do que guardou (${fmt(custo)}). A cabeça voltou a caber no corpo; ${clt ? 'no trabalho, a volta pede um tempo de readaptação' : 'parte da freguesia foi atrás de outro'}.`;
    }
    case 'bancar_projeto': {
      const proj = projetosPossiveis(v).find(x => x.id === esc?.id) ?? projetosPossiveis(v)[0];
      v.mente.felicidade = clamp(v.mente.felicidade + 5);
      const p = proj?.pessoaId ? v.pessoas[proj.pessoaId] : undefined;
      if (p) {
        const vin = v.vinculos[p.id];
        if (vin) { vin.proximidade = clamp(vin.proximidade + 10); vin.confianca = clamp(vin.confianca + 8); lembrarCom(v, p.id, 'Você bancou o projeto que era um sonho.', 'apoio', 3); }
        // O dinheiro mudou a vida dele também: um começo de renda própria.
        p.renda = Math.round(Math.max(p.renda, 2200) * 1.25 / 10) * 10;
        if (p.aperto && !p.aperto.resolvido) p.aperto.resolvido = v.t;
      }
      const texto = `Bancou ${proj?.rotulo ?? 'um projeto'} (${fmt(custo)}).`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'escolha', tom: 'bom', escolha: true, pessoas: p ? [p.id] : undefined });
      marcar(v, 'conquista', texto, 2);
      return p ? `${p.nome} chorou no telefone. Daqui a um ano, você vai ver no que deu — com o seu nome no começo da história.` : `${cap(proj?.rotulo ?? 'o projeto')} saiu do papel. Alguém que você nunca vai conhecer vai lembrar disso.`;
    }
    case 'presente_familia': {
      const [pid, presId] = (esc?.id ?? '').split(':');
      const p = v.pessoas[pid] ?? presenteaveis(v)[0];
      const pres = PRESENTES.find(x => x.id === presId) ?? PRESENTES[1];
      const vin = p ? v.vinculos[p.id] : undefined;
      if (!p || !vin) return 'O presente não encontrou para quem ir.';
      vin.proximidade = clamp(vin.proximidade + (pres.custo >= 30000 ? 10 : 7));
      vin.confianca = clamp(vin.confianca + 4);
      if (pres.id === 'divida' && p.aperto) p.aperto.resolvido = v.t;
      if (pres.id === 'estudo') v.fatos[`estudo_pago_${p.id}`] = v.t;
      lembrarCom(v, p.id, `Você deu ${pres.nome} de presente.`, 'apoio', 3);
      escrever(v, { texto: `Deu ${pres.nome} de presente para ${p.nome}.`, relevancia: 'biografia', tema: 'familia', tom: 'bom', escolha: true, pessoas: [p.id] });
      return `${p.nome} não sabia o que dizer. ${pres.id === 'divida' ? 'A dívida que tirava o sono acabou.' : pres.id === 'entrada' ? 'A chave da casa própria ficou mais perto.' : pres.id === 'estudo' ? 'O curso começa no próximo semestre.' : 'Presente assim é também um jeito de agradecer.'}`;
    }
  }
  return '';
}

/**
 * O que a viagem pode trazer além da memória: alguém que fica na vida
 * (quem viaja sozinho conhece mais gente — com o contexto de onde veio) ou
 * um imprevisto contado depois rindo. Nem toda viagem traz algo.
 */
function acontecimentoDeViagem(v: Vida, r: Rng, onde: string, sozinho: boolean, fora: boolean): string | undefined {
  const x = r.next();
  if (sozinho && x < 0.28 && idade(v) >= 18 && idade(v) <= 70) {
    const genero = v.eu.atracao === 'homens' ? 'masculino' : v.eu.atracao === 'mulheres' ? 'feminino' : r.chance(0.5) ? 'masculino' : 'feminino';
    const p = criarPessoa(v, r, { idade: clamp(idade(v) + r.int(-5, 5), 18, 85), genero, municipioId: r.chance(0.5) ? v.moradia.municipioId : v.eu.municipioNatal });
    const vin = vincular(v, p, { origem: 'apresentado', proximidade: r.int(26, 38), estagio: 'conhecido' });
    vin.contexto = novoContexto('viagem');
    registrarFase(v, vin, 'conhecido');
    lembrarCom(v, p.id, `Se conheceram numa viagem para ${onde}.`, 'inicio', 2);
    escrever(v, { texto: `Na viagem para ${onde}, conheceu ${p.nome}. Trocaram contato na volta.`, relevancia: 'biografia', tema: parceiro(v) ? 'amizade' : 'amor', pessoas: [p.id] });
    return `E ${p.nome}, ${flex(p.genero, 'que você conheceu', 'que você conheceu')} lá, mandou mensagem na semana seguinte.`;
  }
  if (x > 0.86) {
    const imprevisto = fora ? 'A mala foi para outro país e chegou três dias depois.' : 'O voo de volta atrasou um dia inteiro; a história virou piada de família.';
    escrever(v, { texto: imprevisto, relevancia: 'cotidiano', tema: 'lazer' });
    return imprevisto;
  }
  return undefined;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** O nome da porta; a viagem "pelo país" fala do país onde a pessoa mora ("pelo Brasil", "pela Argentina", "por Portugal"). */
export const nomeDaExperiencia = (id: TipoExperiencia, pais = paisCorrente()) =>
  id === 'viagem_pais' && existePais(pais) ? `Uma viagem ${pelo(pais)}` : modelo(id).nome;
const pelo = (pais: string) => { const p = paisDoCatalogo(pais); return ({ '': 'por ', o: 'pelo ', a: 'pela ', os: 'pelos ', as: 'pelas ' } as const)[p.artigo] + p.nome; };
export const descricaoDaExperiencia = (id: TipoExperiencia) => modelo(id).descricao;
