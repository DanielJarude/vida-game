/**
 * ERAS HISTÓRICAS · PROFISSÕES E ESTUDOS NO TEMPO (dados e portões; reaproveita `dados/ocupacoes` e `dados/cursos`).
 *
 * Profissões: só as que surgiram no período (ano em que passam a existir como ocupação no Brasil). As demais existem
 * desde antes de 1980 — o que muda nelas são as ferramentas (ver `FERRAMENTAS`, lembranças do ofício).
 * Estudos: as portas de entrada que dependem de lei (ProUni, FIES, cotas federais, graduação a distância) e os cursos
 * de nome recente.
 */

import type { Vida } from '../../tipos';
/** O ano civil de um instante (sem importar `tempo`: a base histórica não depende de nenhum pacote de cima). */
const anoDe = (t: number) => Math.floor(t / 12);
import { mesHistoricoCorrente, paisHistoricoCorrente } from './moedas';
import { pacoteDaEra } from './pacote';

/** Ocupação → ano em que passa a existir no Brasil. */
export const OCUPACOES_DESDE: Readonly<Record<string, { desde: number; fonte: string }>> = {
  motorista_app: { desde: 2014, fonte: 'Transporte por aplicativo começa no Rio de Janeiro em maio de 2014.' },
  entregador_app: { desde: 2015, fonte: 'Aproximação: entregas por aplicativo de restaurantes se espalham a partir de meados dos anos 2010.' },
  dono_loja_online: { desde: 2000, fonte: 'Aproximação: comércio eletrônico no Brasil a partir do fim dos anos 1990.' },
  tecnico_celular: { desde: 1997, fonte: 'Aproximação: assistência técnica de celulares com a expansão da telefonia móvel.' },
  analista_seguranca: { desde: 1998, fonte: 'Aproximação.' },
  gerente_produto: { desde: 2005, fonte: 'Aproximação: gestão de produto digital.' },
  analista_dados: { desde: 2010, fonte: 'Aproximação.' },
  cientista_dados: { desde: 2012, fonte: 'Aproximação: o termo e a função se difundem a partir de 2012.' },
  criador_conteudo: { desde: 2008, fonte: 'Aproximação: vídeo e conteúdo na internet como ocupação remunerada.' },
  instalador_solar: { desde: 2012, fonte: 'Resolução Normativa ANEEL 482/2012 (geração distribuída).' },
  policial_penal: { desde: 2019, fonte: 'Emenda Constitucional 104/2019 (polícias penais); antes, agente penitenciário.' },
  agente_saude: { desde: 1991, fonte: 'Programa de Agentes Comunitários de Saúde (Ministério da Saúde, 1991).' },
  medico_familia: { desde: 1994, fonte: 'Programa Saúde da Família (Ministério da Saúde, 1994).' },
  jovem_aprendiz: { desde: 2000, fonte: 'Lei 10.097/2000 (Lei da Aprendizagem).' },
  // ERAS v3 · antes de 1970 (APROXIMAÇÕES do ano em que a ocupação passa a existir como trabalho corrente; datas do Brasil —
  // os pacotes dos outros países sobrepõem as que diferem lá: `PacoteDeEra.ocupacoes`).
  dev_jr: { desde: 1960, fonte: 'Aproximação: programador de computador de grande porte a partir dos anos 1960.' },
  dev_pleno: { desde: 1960, fonte: 'Aproximação.' }, dev_senior: { desde: 1962, fonte: 'Aproximação.' }, tech_lead: { desde: 1975, fonte: 'Aproximação.' },
  consultor_ti: { desde: 1975, fonte: 'Aproximação.' }, suporte_ti: { desde: 1982, fonte: 'Aproximação: suporte de microcomputadores.' }, estagio_ti: { desde: 1975, fonte: 'Aproximação.' },
  engenheiro_infra: { desde: 1992, fonte: 'Aproximação: redes e servidores.' }, operador_telemarketing: { desde: 1985, fonte: 'Aproximação: centrais de atendimento por telefone.' },
  supervisor_atendimento: { desde: 1985, fonte: 'Aproximação.' }, motoboy: { desde: 1985, fonte: 'Aproximação: o motofrete nas capitais nos anos 1980.' },
  cooperado_reciclagem: { desde: 1990, fonte: 'Aproximação: as primeiras cooperativas de catadores (São Paulo, 1989).' },
  personal: { desde: 1985, fonte: 'Aproximação.' }, coordenador_academia: { desde: 1980, fonte: 'Aproximação.' }, preparador_fisico: { desde: 1930, fonte: 'Aproximação.' },
  frentista: { desde: 1920, fonte: 'Aproximação: os postos de gasolina com bomba nos anos 1920.' }, motorista_onibus: { desde: 1912, fonte: 'Aproximação.' },
  motorista_caminhao: { desde: 1918, fonte: 'Aproximação.' }, caminhoneiro: { desde: 1918, fonte: 'Aproximação.' }, operador_empilhadeira: { desde: 1935, fonte: 'Aproximação.' },
  tecnico_refrigeracao: { desde: 1930, fonte: 'Aproximação.' }, tec_radiologia: { desde: 1920, fonte: 'Aproximação: os raios X nos hospitais.' },
  fisioterapeuta: { desde: 1940, fonte: 'Aproximação.' }, fisio_clinica: { desde: 1950, fonte: 'Aproximação.' }, fisio_especialista: { desde: 1970, fonte: 'Aproximação.' },
  nutricionista: { desde: 1940, fonte: 'Aproximação: primeiros cursos de nutricionistas no fim dos anos 1930.' }, nutricionista_especialista: { desde: 1970, fonte: 'Aproximação.' }, coordenador_nutricao: { desde: 1965, fonte: 'Aproximação.' },
  psicologo: { desde: 1940, fonte: 'Aproximação.' }, psicologo_clinico: { desde: 1945, fonte: 'Aproximação.' }, psicologo_hospitalar: { desde: 1970, fonte: 'Aproximação.' },
  designer_jr: { desde: 1955, fonte: 'Aproximação.' }, designer: { desde: 1950, fonte: 'Aproximação.' }, produtor_audiovisual: { desde: 1950, fonte: 'Aproximação.' }, produtor_musical: { desde: 1950, fonte: 'Aproximação.' },
  analista_rh: { desde: 1950, fonte: 'Aproximação: os departamentos de pessoal das grandes empresas.' }, analista_logistica: { desde: 1970, fonte: 'Aproximação.' }, coordenador_logistica: { desde: 1970, fonte: 'Aproximação.' },
  analista_financeiro: { desde: 1950, fonte: 'Aproximação.' }, tec_seguranca: { desde: 1972, fonte: 'Portaria 3.237/1972 (Ministério do Trabalho); aproximação para os outros países.' },
  supervisor_vigilancia: { desde: 1970, fonte: 'Aproximação.' }, vigilante: { desde: 1950, fonte: 'Aproximação.' }, perito_criminal: { desde: 1910, fonte: 'Aproximação.' },
  cuidador: { desde: 1950, fonte: 'Aproximação.' }, aux_creche: { desde: 1940, fonte: 'Aproximação.' }, instrutor_tecnico: { desde: 1940, fonte: 'Aproximação: o ensino industrial (SENAI, 1942).' },
  operador_maquinas: { desde: 1920, fonte: 'Aproximação: o trator no campo.' }, tecnico_agricola: { desde: 1930, fonte: 'Aproximação.' }, tatuador: { desde: 1959, fonte: 'Primeiro estúdio de tatuagem do Brasil: Santos, 1959 (aproximação).' },
  jogador_futebol: { desde: 1933, fonte: 'O profissionalismo no futebol brasileiro: 1933 (antes, amador).' }, piloto_corrida: { desde: 1950, fonte: 'Primeiro campeonato mundial de Fórmula 1: 1950.' },
  tenista: { desde: 1968, fonte: 'A era aberta do tênis (1968): antes, o circuito principal era amador.' }, atleta: { desde: 1982, fonte: 'A IAAF admite atletas profissionais em 1982 (antes, o atletismo olímpico era amador).' },
  jogador_basquete: { desde: 1965, fonte: 'Aproximação: as ligas nacionais semiprofissionais.' }, jogador_esports: { desde: 2000, fonte: 'Aproximação.' },
  // As profissões que o jogo põe no futuro (`surge`): numa vida histórica, nunca antes do ano em que surgem.
  operador_drone: { desde: 2028, fonte: 'Profissão do futuro do jogo (dados/ocupacoes, surge).' }, tecnico_energia: { desde: 2032, fonte: 'Idem.' }, tecnico_sistemas_automatizados: { desde: 2034, fonte: 'Idem.' }
};

/** ERAS v3: o ano em que a ocupação passa a existir NO PAÍS da época (o pacote do país sobrepõe a data brasileira). */
function desdeNoPais(id: string, pais: string): number | undefined {
  const p = pais === 'BR' ? undefined : pacoteDaEra(pais)?.ocupacoes?.[id];
  return p ?? OCUPACOES_DESDE[id]?.desde;
}

/** A ocupação não existe ainda no ano desta vida (vida contemporânea: sempre existe). */
export function ocupacaoAindaNaoExiste(v: Vida, id: string): number | undefined {
  if (!v.era) return undefined;
  const d = desdeNoPais(id, mesHistoricoCorrente() !== null ? paisHistoricoCorrente() : v.era.pais);
  return d !== undefined && anoDe(v.t) < d ? d : undefined;
}

/**
 * ERAS v2: a ocupação existe no mês da vida histórica que o motor está processando (para quem sorteia a profissão dos
 * pais, dos irmãos, dos filhos e das pessoas do mundo — elas também não podem ser motorista de aplicativo em 1990).
 */
export function ocupacaoExisteAgora(id: string): boolean {
  const t = mesHistoricoCorrente();
  const d = t === null ? undefined : desdeNoPais(id, paisHistoricoCorrente());
  return t === null || d === undefined || anoDe(t) >= d;
}

/** Cursos de nome ou existência recentes: o ano em que passam a ser oferecidos (e o nome de antes, quando havia). */
export const CURSOS_NO_TEMPO: Readonly<Record<string, { desde?: number; antes?: { ate: number; nome: string } }>> = {
  // ERAS v3: e o primeiro ano (os cursos de processamento de dados nascem no começo dos anos 1970 — aproximação).
  ads: { desde: 1972, antes: { ate: 2005, nome: 'Tecnologia em Processamento de Dados' } },
  tec_informatica: { desde: 1970, antes: { ate: 1999, nome: 'Técnico em Processamento de Dados' } },
  tec_desenvolvimento: { desde: 2008 },
  tec_redes: { desde: 2000 },
  mba: { desde: 1993 },
  // ERAS v3 · antes de 1970 (APROXIMAÇÕES do ano em que o curso passa a ser oferecido de forma corrente; datas do Brasil —
  // os pacotes dos outros países sobrepõem as que diferem lá: `PacoteDeEra.cursos`).
  computacao: { desde: 1968 }, estatistica: { desde: 1935 }, administracao: { desde: 1952 }, economia: { desde: 1935 }, psicologia: { desde: 1953 },
  fisioterapia: { desde: 1951 }, nutricao: { desde: 1939 }, jornalismo: { desde: 1947 }, publicidade: { desde: 1951 }, design: { desde: 1963 },
  eng_producao: { desde: 1958 }, ed_fisica: { desde: 1939 }, artes_cenicas: { desde: 1948 }, pedagogia: { desde: 1939 },
  mestrado: { desde: 1965 }, doutorado: { desde: 1965 }, especializacao: { desde: 1950 }, esp_educacao: { desde: 1960 }, residencia: { desde: 1945 },
  tec_eletronica: { desde: 1950 }, tec_telecomunicacoes: { desde: 1960 }, tec_mecatronica: { desde: 1992 }, tec_automacao: { desde: 1980 },
  tec_radiologia: { desde: 1950 }, tec_seguranca: { desde: 1972 }, tec_logistica: { desde: 1995 }, tec_marketing: { desde: 1990 }, tec_recursos_humanos: { desde: 1985 },
  tec_design: { desde: 1970 }, tec_audiovisual: { desde: 1970 }, tec_hospedagem: { desde: 1970 }, tecn_gastronomia: { desde: 1999 }, tec_imoveis: { desde: 1975 },
  tec_alimentos: { desde: 1960 }, tec_refrigeracao: { desde: 1950 }, q_refrigeracao: { desde: 1965 }, q_empilhadeira: { desde: 1945 }, q_vigilante: { desde: 1983 },
  tec_agronegocio: { desde: 1995 }, tec_zootecnia: { desde: 1950 }, tec_cozinha: { desde: 1990 }, tec_jogos_digitais: { desde: 2010 }, tec_informatica_internet: { desde: 2008 },
  tec_energia_renovavel: { desde: 2008 }, q_solar: { desde: 2012 }, tec_enfermagem: { desde: 1950 }, tec_administracao: { desde: 1950 }, tec_contabilidade: { desde: 1931 },
  tec_eletrotecnica: { desde: 1920 }, tec_mecanica: { desde: 1920 }, tec_edificacoes: { desde: 1940 }, tec_manutencao_automotiva: { desde: 1940 }, tec_soldagem: { desde: 1940 }
};

/** As vias de entrada que dependem de lei: o ano de início. */
export const VIAS_DESDE: Readonly<Record<string, { desde: number; fonte: string }>> = {
  prouni: { desde: 2005, fonte: 'MP 213/2004 → Lei 11.096/2005 (primeiras bolsas em 2005).' },
  // ERAS v2: antes do FIES, a mesma via é o Crédito Educativo (CREDUC, 1976; Lei 8.436/1992), com o nome da época (`anacronismos`).
  fies: { desde: 1976, fonte: 'Crédito Educativo (CREDUC, 1976; Lei 8.436/1992), substituído pelo FIES (MP 1.827/1999 → Lei 10.260/2001).' },
  ead: { desde: 2000, fonte: 'LDB (Lei 9.394/1996, art. 80) e Decreto 2.494/1998; as graduações a distância se espalham a partir de 2000 (aproximação).' }
};

/** Cotas federais para escola pública e renda (Lei 12.711/2012). */
export const COTAS_DESDE = 2013;

export const viaExiste = (v: Vida, via: string) => !v.era || anoDe(v.t) >= (VIAS_DESDE[via]?.desde ?? -Infinity);
export const cursoExiste = (v: Vida, id: string) => {
  if (!v.era) return true;
  const pais = mesHistoricoCorrente() !== null ? paisHistoricoCorrente() : v.era.pais;
  const d = (pais !== 'BR' ? pacoteDaEra(pais)?.cursos?.[id] : undefined) ?? CURSOS_NO_TEMPO[id]?.desde ?? -Infinity;
  return anoDe(v.t) >= d;
};
export function nomeDoCursoNoAno(v: Vida, id: string, nome: string): string {
  const a = v.era ? CURSOS_NO_TEMPO[id]?.antes : undefined;
  return a && anoDe(v.t) <= a.ate ? a.nome : nome;
}

/**
 * As ferramentas do ofício por época (lembrança do trabalho, uma vez por fase): o que mudou no dia a dia da profissão.
 * Chave: trilha de carreira (`dados/carreiras`) ou id de ocupação.
 */
export const FERRAMENTAS: readonly { de: string[]; ate: number; texto: string }[] = [
  { de: ['jornalista', 'redator', 'editor'], ate: 1995, texto: 'Na redação, a matéria saía na máquina de escrever, a apuração era por telefone e o arquivo era de papel, em pastas.' },
  { de: ['jornalista', 'redator', 'editor'], ate: 2008, texto: 'A redação ganhou computadores em rede; a matéria passou a ir para o site antes de ir para o papel.' },
  { de: ['contador', 'contador_socio', 'coordenador_contabil'], ate: 1993, texto: 'A escrita contábil era feita nos livros, com calculadora de fita; cada mudança de moeda e cada plano econômico refazia as contas.' },
  { de: ['contador', 'contador_socio', 'coordenador_contabil'], ate: 2008, texto: 'As planilhas e os programas de contabilidade tomaram o lugar dos livros; as declarações começaram a ir pela internet.' },
  { de: ['dev_jr', 'dev_pleno', 'dev_senior', 'tech_lead', 'suporte_ti', 'estagio_ti', 'consultor_ti'], ate: 1995, texto: 'O trabalho era no CPD da empresa: computador de grande porte, terminais, cartões e listagens impressas.' },
  { de: ['dev_jr', 'dev_pleno', 'dev_senior', 'tech_lead', 'suporte_ti', 'estagio_ti', 'consultor_ti'], ate: 2008, texto: 'Sistemas cliente-servidor e os primeiros sites: a internet entrou no escritório e mudou o que se programava.' },
  { de: ['eng_jr', 'eng_pleno', 'gerente_obras', 'arquiteto', 'tecnico_edificacoes'], ate: 1995, texto: 'O projeto era desenhado na prancheta, com régua paralela, normógrafo e cópia heliográfica.' },
  { de: ['eng_jr', 'eng_pleno', 'gerente_obras', 'arquiteto', 'tecnico_edificacoes'], ate: 2010, texto: 'A prancheta deu lugar ao desenho no computador; a planta passou a ir por e-mail para a obra.' },
  { de: ['advogado_jr', 'advogado_pleno', 'advogado', 'socio_advocacia', 'estagio_direito'], ate: 2006, texto: 'O processo era de papel: petição protocolada no balcão do fórum e o andamento conferido no Diário Oficial.' },
  { de: ['aux_adm', 'assistente_adm', 'analista_adm', 'recepcionista'], ate: 1995, texto: 'No escritório, máquina de escrever, papel-carbono, telex e arquivo de aço: cópia era com estêncil ou mimeógrafo.' },
  { de: ['escriturario_banco', 'gerente_banco'], ate: 1994, texto: 'No banco, a remarcação dos índices era diária e as filas, longas: o salário era sacado no dia e gasto logo, antes que a inflação comesse.' }
];

/**
 * ERAS v3: a bolsa pública do perfil do país (o ProUni, a Pell Grant) já existia no ano? Datas: ProUni 2005 (BR); Pell Grant
 * 1972 (EUA, Higher Education Act de 1972); bolsas de manutenção do Estado 1962 (Reino Unido, Education Act 1962); BAföG
 * 1971 (Alemanha Ocidental); bolsas da JASSO desde 1943 (Japão); PROGRESAR 2014 e bolsas nacionais desde 1990 (Argentina, aproximação).
 */
const BOLSA_DESDE: Readonly<Record<string, number>> = { BR: 2005, US: 1972, GB: 1962, DE: 1971, JP: 1943, AR: 1990 };
export function bolsaDaEpoca(v: Vida): boolean {
  if (!v.era) return true;
  const pais = mesHistoricoCorrente() !== null ? paisHistoricoCorrente() : v.era.pais;
  return anoDe(v.t) >= (BOLSA_DESDE[pais] ?? 1990);
}
