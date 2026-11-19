/**
 * ERAS v3 · AS REGRAS SOCIAIS E DE DIREITOS DO BRASIL (1900–2025), no mesmo formato dos pacotes dos outros países
 * (`pacote.RegraSocial`, `pacote.GuerraDaEpoca`). As leis que o jogo já aplicava (divórcio, casamento entre pessoas do
 * mesmo gênero, maioridade, reeleição) continuam em `leis.ts`; aqui ficam as que a v3 traz para antes de 1970.
 * Fonte no próprio dado; texto sem adjetivo.
 */
import type { GuerraDaEpoca, RegraSocial } from './pacote';

export const REGRAS_BR: readonly RegraSocial[] = [
  { id: 'br_voto_feminino', tema: 'voto_feminino', quem: 'mulher', de: 1900, ate: 1932, valor: 21, texto: 'Pela lei da época, mulher não votava: o voto era dos homens alfabetizados maiores de 21 anos. O direito só viria com o Código Eleitoral de 1932.', fonte: 'Constituição de 1891, art. 70; Decreto 21.076/1932 (Código Eleitoral), que instituiu o voto feminino.' },
  { id: 'br_voto_analfabeto', tema: 'censura', quem: 'pobre', de: 1900, ate: 1985, valor: 18, texto: 'Quem não sabia ler e escrever não votava — uma regra que valeu de 1881 até 1985 e deixava de fora boa parte do país.', fonte: 'Lei Saraiva (Decreto 3.029/1881); Constituições de 1891, 1934, 1946 e 1967; Emenda Constitucional 25/1985.' },
  { id: 'br_mulher_casada', tema: 'mulher_casada', quem: 'mulher', de: 1917, ate: 1962, texto: 'Pelo Código Civil da época, a mulher casada precisava da autorização do marido para trabalhar fora, abrir conta ou viajar: ele era o "chefe da sociedade conjugal". A regra só mudou com o Estatuto da Mulher Casada, em 1962.', fonte: 'Código Civil de 1916 (Lei 3.071/1916, em vigor em 1º/01/1917), arts. 6º e 242; Lei 4.121/1962 (Estatuto da Mulher Casada).' },
  { id: 'br_estado_novo', tema: 'censura', de: 1937, ate: 1945, texto: 'No Estado Novo não havia eleições nem partidos; jornais, rádios e livros passavam pela censura do Departamento de Imprensa e Propaganda.', fonte: 'Constituição de 10/11/1937; Decreto-Lei 37/1937 (extinção dos partidos); Decreto-Lei 1.915/1939 (DIP).' },
  { id: 'br_sem_eleicoes_37', tema: 'sem_eleicoes', de: 1937, ate: 1945, texto: 'No Estado Novo não havia eleições: os partidos foram extintos em dezembro de 1937 e só voltaram em 1945.', fonte: 'Constituição de 1937; Decreto-Lei 37/1937; eleições gerais de 02/12/1945.' },
  { id: 'br_governador_indireto', tema: 'sem_eleicoes', de: 1966, ate: 1982, cargos: ['governador'], texto: 'Os governadores eram escolhidos pelas assembleias, não pelo voto direto: a eleição direta para governador só voltou em 1982.', fonte: 'Ato Institucional nº 3 (05/02/1966); Emenda Constitucional 15/1980; eleições de 15/11/1982.' },
  { id: 'br_ai5', tema: 'censura', de: 1968, ate: 1979, texto: 'Com o AI-5, a censura prévia chegou a jornais, músicas, peças e novelas; o habeas corpus para crimes políticos foi suspenso.', fonte: 'Ato Institucional nº 5, de 13/12/1968; revogado pela Emenda Constitucional 11/1978, em vigor em 1º/01/1979.' },
  { id: 'br_escola', tema: 'escola_obrigatoria', de: 1934, valor: 4, texto: 'O ensino primário passou a ser obrigatório e gratuito pela Constituição — mas faltava escola, sobretudo no campo, e muita criança trabalhava em vez de estudar.', fonte: 'Constituição de 1934, art. 150, parágrafo único.' },
  { id: 'br_trabalho_infantil', tema: 'trabalho_infantil', quem: 'pobre', de: 1900, ate: 1943, texto: 'Criança trabalhando era comum: na roça, nas fábricas de tecido, na rua. Só aos poucos a lei pôs limites (o Código de Menores de 1927; a CLT, em 1943).', fonte: 'Decreto 17.943-A/1927 (Código de Menores); Decreto-Lei 5.452/1943 (CLT), arts. 402–441.' }
];

export const GUERRAS_BR: readonly GuerraDaEpoca[] = [
  { id: 'br_feb', nome: 'Força Expedicionária Brasileira (Segunda Guerra Mundial)', de: [1943, 8], ate: [1945, 5], idades: [19, 28], alcance: 0.006, letalidade: 0.018, fonte: 'O Brasil declarou guerra em 22/08/1942; a FEB, criada em 09/08/1943, mandou cerca de 25,8 mil militares à Itália (1944–1945), com 467 mortos (Ministério da Defesa / Exército Brasileiro). Alcance: aproximação [A].' }
];
