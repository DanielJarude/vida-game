/**
 * ERAS HISTÓRICAS · PROFISSÕES E ESTUDOS NO TEMPO (dados e portões; reaproveita `dados/ocupacoes` e `dados/cursos`).
 *
 * Profissões: só as que surgiram no período (ano em que passam a existir como ocupação no Brasil). As demais existem
 * desde antes de 1980 — o que muda nelas são as ferramentas (ver `FERRAMENTAS`, lembranças do ofício).
 * Estudos: as portas de entrada que dependem de lei (ProUni, FIES, cotas federais, graduação a distância) e os cursos
 * de nome recente.
 */

import type { Vida } from '../../tipos';
import { anoDe } from '../../tempo';

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
  jovem_aprendiz: { desde: 2000, fonte: 'Lei 10.097/2000 (Lei da Aprendizagem).' }
};

/** A ocupação não existe ainda no ano desta vida (vida contemporânea: sempre existe). */
export function ocupacaoAindaNaoExiste(v: Vida, id: string): number | undefined {
  if (!v.era) return undefined;
  const d = OCUPACOES_DESDE[id]?.desde;
  return d !== undefined && anoDe(v.t) < d ? d : undefined;
}

/** Cursos de nome ou existência recentes: o ano em que passam a ser oferecidos (e o nome de antes, quando havia). */
export const CURSOS_NO_TEMPO: Readonly<Record<string, { desde?: number; antes?: { ate: number; nome: string } }>> = {
  ads: { antes: { ate: 2005, nome: 'Tecnologia em Processamento de Dados' } },
  tec_informatica: { antes: { ate: 1999, nome: 'Técnico em Processamento de Dados' } },
  tec_desenvolvimento: { desde: 2008 },
  tec_redes: { desde: 2000 },
  mba: { desde: 1993 }
};

/** As vias de entrada que dependem de lei: o ano de início. */
export const VIAS_DESDE: Readonly<Record<string, { desde: number; fonte: string }>> = {
  prouni: { desde: 2005, fonte: 'MP 213/2004 → Lei 11.096/2005 (primeiras bolsas em 2005).' },
  fies: { desde: 1999, fonte: 'MP 1.827/1999 → Lei 10.260/2001 (FIES). Antes, o Crédito Educativo (não simulado nesta versão).' },
  ead: { desde: 2000, fonte: 'LDB (Lei 9.394/1996, art. 80) e Decreto 2.494/1998; as graduações a distância se espalham a partir de 2000 (aproximação).' }
};

/** Cotas federais para escola pública e renda (Lei 12.711/2012). */
export const COTAS_DESDE = 2013;

export const viaExiste = (v: Vida, via: string) => !v.era || anoDe(v.t) >= (VIAS_DESDE[via]?.desde ?? -Infinity);
export const cursoExiste = (v: Vida, id: string) => !v.era || anoDe(v.t) >= (CURSOS_NO_TEMPO[id]?.desde ?? -Infinity);
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
