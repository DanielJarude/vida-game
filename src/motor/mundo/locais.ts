/**
 * TEXTOS COM LUGAR — o que muda de nome (ou de instituição) com o país.
 *
 * Cada entrada tem a forma UNIVERSAL — neutra e plausível em qualquer país
 * — e as variantes onde o lugar tem a sua (o SESC, o SUS, o INSS, o
 * IBAMA). A mais específica vence (`resolver`: cidade → divisão → país →
 * universal). Um país sem variante recebe o universal; nunca o texto de
 * outro país por ter sido "a única string que existia".
 *
 * O que é instituição do país com campo próprio no perfil (o exame, a rede
 * pública de saúde, a previdência, o cartório) continua no perfil; aqui
 * ficam as frases e os nomes miúdos do dia a dia, sem campo.
 */

import type { Vida } from '../tipos';
import { lugarDe, resolver, type PorLugar } from './escopo';
import { perfilDaVida } from './vida';

export const TEXTOS_LOCAIS = {
  // Tempo livre (descrições das atividades)
  natacao: { universal: 'Piscina pública do bairro, do clube ou da academia.', BR: 'Piscina do clube, do SESC ou da prefeitura.', US: 'Piscina pública, da YMCA ou do clube.' },
  lutas: { universal: 'Judô, karatê, taekwondo ou boxe.', BR: 'Judô, jiu-jítsu, karatê ou capoeira.', JP: 'Judô, karatê, kendô ou aikidô.', KR: 'Taekwondo, judô ou hapkido.' },
  corrida: { universal: 'Na praça, no parque, na rua de casa. De graça.', BR: 'Na praça, na orla, no parque. De graça.' },
  musica: { universal: 'Violão, teclado, bateria, violino.', BR: 'Violão, teclado, bateria, cavaquinho.' },
  danca: { universal: 'Balé, jazz, hip-hop, dança de salão.', BR: 'Balé, jazz, forró, hip-hop, dança de salão.', AR: 'Balé, jazz, tango, hip-hop, dança de salão.' },
  gremio: { universal: 'Reunião, eleição, festa da escola, briga por um banheiro novo.', BR: 'Reunião, eleição, festa junina, briga por um banheiro novo.' },
  fanfarra: { universal: 'Tambor, corneta e o desfile da escola.', BR: 'Tambor, corneta e o desfile de Sete de Setembro.' },
  vender_doces: { universal: 'Bala, chocolate, salgado no ponto de ônibus — dinheiro pouco, rua muita.', BR: 'Bala, brigadeiro, paçoca no semáforo — dinheiro pouco, rua muita.' },
  conselho_tutelar: { universal: 'O serviço de proteção à criança apareceu em casa, e a família teve de explicar.', BR: 'O Conselho Tutelar apareceu em casa, e a família teve de explicar.' },
  // Bichos: o órgão que autoriza o criadouro de silvestres e a lei que proíbe o tráfico.
  orgaoAmbiental: { universal: 'o órgão ambiental', BR: 'o IBAMA' },
  leiDeFauna: { universal: 'a lei de proteção da fauna', BR: 'a Lei 9.605/1998' },
  // Carro: o imposto anual do veículo.
  impostoVeiculo: { universal: 'imposto do veículo', BR: 'IPVA' },
  // Registro profissional (o conselho de classe) e o exame da ordem dos advogados.
  conselhoDeClasse: { universal: 'conselho profissional', BR: 'conselho de classe' },
  exameDaOrdem: { universal: 'o exame da ordem dos advogados', BR: 'o Exame da OAB', US: 'o bar exam', GB: 'o exame da ordem (SQE)' },
  // Saúde pública da atenção básica (posto, CAPS).
  postoDeSaude: { universal: 'o posto de saúde', BR: 'a UBS' },
  saudeMental: { universal: 'o centro de saúde mental', BR: 'o CAPS' },
  // Quem distribui vagas no ensino técnico público.
  provaTecnica: { universal: 'a prova da escola técnica pública', BR: 'a prova do instituto federal' },
  // Educação de jovens e adultos.
  eja: { universal: 'o curso noturno para adultos', BR: 'a EJA' },
  supletivo: { universal: 'o curso para adultos', BR: 'o supletivo' },
  // Preparação para o exame de ingresso.
  cursinho: { universal: 'curso preparatório', BR: 'cursinho' },
  // O campeonato do nível de baixo, no texto de técnico e de clube.
  campeonatoRegional: { universal: 'a copa regional', BR: 'o campeonato estadual' },
  // Bairro pobre e o morro.
  bairroPobre: { universal: 'num bairro pobre da periferia', BR: 'numa comunidade no morro' },
  // Programa de casa e comida de festa.
  festaEmCasa: { universal: 'Fazer uma festa em casa', BR: 'Fazer um churrasco em casa', AR: 'Fazer um asado em casa', US: 'Fazer um churrasco no quintal' },
  docinho: { universal: 'docinho', BR: 'docinho de brigadeiro' },
  praiaComFarofa: { universal: 'com guarda-sol, cooler e sanduíche', BR: 'com isopor, farofa e guarda-sol' },
  // Empréstimo com desconto em folha.
  olimpiada: { universal: 'olimpíada de matemática', BR: 'olimpíada de matemática das escolas públicas' },
  consignado: { universal: 'empréstimo com desconto em folha', BR: 'consignado' },
  // Contribuir para a previdência sem renda (no Brasil, o contribuinte facultativo).
  // Estar no cadastro de devedores (no Brasil, "o nome sujo").
  comNomeSujo: { universal: 'Com o nome no cadastro de devedores', BR: 'Com o nome sujo' },
  nomeSujo: { universal: 'o nome no cadastro de devedores', BR: 'o nome sujo' },
  // Os salários extras do ano (no Brasil, o 13º).
  comSalariosExtras: { universal: 'com os pagamentos extras e as férias', BR: 'com 13º e férias' },
  comContrato: { universal: 'com contrato', BR: 'com carteira' },
  // A justiça juvenil (no Brasil, o ECA e as medidas socioeducativas).
  medidaJuvenil: { universal: 'uma medida para adolescentes', BR: 'uma medida socioeducativa' },
  unidadeJuvenil: { universal: 'uma unidade de internação para adolescentes', BR: 'uma unidade socioeducativa' },
  facultativo: { universal: 'como contribuição voluntária', BR: 'como facultativo' }
} satisfies Record<string, PorLugar<string>>;

export type ChaveLocal = keyof typeof TEXTOS_LOCAIS;

/**
 * A previdência pública do lugar onde se mora, nas formas que a frase pede:
 * "o INSS" / "ao INSS" / "do INSS" quando o perfil diz o artigo; senão,
 * "a previdência (Kosei Nenkin)".
 */
export function previdenciaDaVida(v: Vida) {
  const p = perfilDaVida(v).trabalho.previdencia;
  if (p.artigo === 'o' || p.artigo === 'a') {
    const o = p.artigo === 'o';
    return { nome: p.nome, o: `${p.artigo} ${p.nome}`, O: `${o ? 'O' : 'A'} ${p.nome}`, do: `${o ? 'do' : 'da'} ${p.nome}`, ao: `${o ? 'ao' : 'à'} ${p.nome}` };
  }
  return { nome: p.nome, o: `a previdência (${p.nome})`, O: `A previdência (${p.nome})`, do: 'da previdência', ao: `à previdência (${p.nome})` };
}

/** As siglas brasileiras dos conselhos; fora do Brasil, o registro pelo que ele é. */
const REGISTROS: Record<string, [sigla: string, universal: string]> = {
  crm: ['CRM', 'registro de médico'], coren: ['COREN', 'registro de enfermagem'], crc: ['CRC', 'registro de contador'], crea: ['CREA', 'registro de engenheiro'],
  creci: ['CRECI', 'licença de corretor de imóveis'], crefito: ['CREFITO', 'registro de fisioterapeuta'], crf: ['CRF', 'registro de farmacêutico'],
  crmv: ['CRMV', 'registro de veterinário'], cro: ['CRO', 'registro de dentista'], crp: ['CRP', 'registro de psicólogo'], oab: ['OAB', 'habilitação para advogar']
};
/** O nome de um registro profissional aqui: "CRM" no Brasil; "registro de médico" no resto (sem inventar a sigla de outro país). */
export function nomeDoRegistro(v: Vida, licenca: string): string {
  const r = REGISTROS[licenca];
  if (!r) return licenca.toUpperCase();
  return lugarDe(v.moradia.municipioId).pais === 'BR' ? r[0] : r[1];
}

/** Onde se casa e se divorcia no civil ("o cartório" no Brasil; "o registro civil" no universal). */
export const registroCivilDe = (v: Vida): string => perfilDaVida(v).cotidiano?.registroCivil ?? 'o registro civil';

/** O texto deste lugar (a moradia atual): a variante mais específica, senão o universal. */
export const textoLocal = (v: Vida, chave: ChaveLocal): string => resolver(TEXTOS_LOCAIS[chave] as PorLugar<string>, lugarDe(v.moradia.municipioId));
/** O mesmo, para um município qualquer (onde mora um NPC, a cidade de uma oferta). */
export const textoLocalEm = (municipioId: string, chave: ChaveLocal): string => resolver(TEXTOS_LOCAIS[chave] as PorLugar<string>, lugarDe(municipioId));
