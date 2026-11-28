/**
 * VIDA 39 · o preconceito do dia a dia, por país (dados puros). Cada país tem o seu: a Itália tem o do sul italiano; o
 * Brasil, o do nordestino, o do negro e o do pobre; a França e a Alemanha, o do estrangeiro. Escopo declarado: cada
 * episódio vale só no país que indica (`pais`, ISO 3166-1) e só para quem tem o marcador daquele episódio.
 *
 * Os marcadores são lidos do que o jogo já sabe de quem vive a vida (`sistemas/preconceito39`): a origem da cidade
 * natal (região do Brasil, sul da Itália), a ascendência (a parcela africana, `identidade.ancestralidadeDe`), o
 * gênero, a classe de origem, a nacionalidade diferente da do país onde se vive.
 *
 * Os textos mostram o que acontece e o que custa. Não há episódio que recompense quem o sofre. Intensidade 1 (um
 * comentário), 2 (uma porta fechada), 3 (uma humilhação com testemunhas).
 */

export type Marcador39 = 'nordestino' | 'sulista' | 'negro' | 'mulher' | 'classe_baixa' | 'estrangeiro';
export type TemaDoEpisodio39 = 'trabalho' | 'lugar' | 'amizade' | 'cotidiano';

export interface Episodio39 {
  id: string;
  pais: string;
  marcador: Marcador39;
  intensidade: 1 | 2 | 3;
  tema: TemaDoEpisodio39;
  texto: string;
  /** Quando é a família ou um amigo que está perto: a frase de quem ouviu (o apoio, quando acontece). */
  apoio?: string;
}

export const MARCADORES39: Record<Marcador39, string> = {
  nordestino: 'nordestino (cidade natal no Nordeste do Brasil)',
  sulista: 'do sul da Itália (cidade natal no Mezzogiorno)',
  negro: 'de ascendência africana predominante',
  mulher: 'mulher',
  classe_baixa: 'de origem de classe baixa',
  estrangeiro: 'estrangeiro (nacionalidade diferente da do país onde vive)',
};

export const EPISODIOS39: Episodio39[] = [
  // Brasil — o nordestino
  { id: 'br_nordeste_sotaque', pais: 'BR', marcador: 'nordestino', intensidade: 2, tema: 'trabalho', texto: 'Numa roda de trabalho, alguém imitou o seu sotaque e riu sozinho. Você ficou quieto até a pausa do café.', apoio: 'depois, um colega de outro estado disse que também já tinha ouvido aquilo.' },
  { id: 'br_nordeste_vaga', pais: 'BR', marcador: 'nordestino', intensidade: 2, tema: 'trabalho', texto: 'Na entrevista, o recrutador perguntou se você ia "aguentar o ritmo daqui", sem perguntar nada do que você sabia fazer.' },
  { id: 'br_nordeste_piada', pais: 'BR', marcador: 'nordestino', intensidade: 1, tema: 'amizade', texto: 'Uma piada sobre "nordestino" passou na mesa do almoço, e a turma olhou para você antes de rir.', apoio: 'alguém mudou de assunto de propósito, e foi o seu melhor amigo.' },
  // Brasil — o negro
  { id: 'br_negro_loja', pais: 'BR', marcador: 'negro', intensidade: 3, tema: 'cotidiano', texto: 'No shopping, o segurança seguiu você do começo ao fim da loja. Ninguém seguiu a pessoa que saiu com a sacola da loja ao lado.' },
  { id: 'br_negro_vaga', pais: 'BR', marcador: 'negro', intensidade: 3, tema: 'trabalho', texto: 'Por telefone, a vaga "já foi preenchida". Na semana seguinte, a mesma vaga apareceu anunciada de novo, com outro nome.', apoio: 'a sua mãe ligou, ouviu tudo e disse que aquilo não era culpa sua.' },
  { id: 'br_negro_portaria', pais: 'BR', marcador: 'negro', intensidade: 2, tema: 'lugar', texto: 'Na portaria do prédio, o porteiro pediu identificação. O morador que entrou logo atrás de você não foi perguntado.' },
  { id: 'br_negro_comentario', pais: 'BR', marcador: 'negro', intensidade: 1, tema: 'cotidiano', texto: 'Um conhecido disse que você "nem parecia" do jeito que ele imaginava. Ele achou que era elogio.' },
  // Brasil — a mulher
  { id: 'br_mulher_reuniao', pais: 'BR', marcador: 'mulher', intensidade: 2, tema: 'trabalho', texto: 'Na reunião, a sua ideia passou sem resposta. Minutos depois, um colega repetiu a mesma coisa e foi aplaudido.' },
  { id: 'br_mulher_obra', pais: 'BR', marcador: 'mulher', intensidade: 1, tema: 'trabalho', texto: 'Na obra, o mestre de obras falou com o seu colega sobre um trabalho que era seu, como se você não estivesse ali.' },
  // Brasil — a origem de classe baixa
  { id: 'br_classe_restaurante', pais: 'BR', marcador: 'classe_baixa', intensidade: 1, tema: 'cotidiano', texto: 'No restaurante, o garçom trouxe a conta antes da sobremesa, sem perguntar se você queria pedir mais.' },
  { id: 'br_classe_cartao', pais: 'BR', marcador: 'classe_baixa', intensidade: 2, tema: 'cotidiano', texto: 'Na loja, a atendente perguntou se o cartão ia "passar", e olhou para a sua roupa antes de olhar para o cartão.' },
  // Brasil — o estrangeiro que mora aqui
  { id: 'br_estrangeiro_sotaque', pais: 'BR', marcador: 'estrangeiro', intensidade: 2, tema: 'cotidiano', texto: 'Ao ouvir o seu sotaque, o vizinho perguntou de que país você "era de verdade".' },
  // Itália — o sul italiano
  { id: 'it_sul_aluguel', pais: 'IT', marcador: 'sulista', intensidade: 2, tema: 'lugar', texto: 'Um senhorio de Milão disse que não alugava "para gente do Sul". Não disse mais nada e fechou a porta.' },
  { id: 'it_sul_trabalho', pais: 'IT', marcador: 'sulista', intensidade: 2, tema: 'trabalho', texto: 'Numa entrevista em Turim, a recrutadora comentou que "no Sul as coisas funcionam de outro jeito", e a conversa acabou ali.' },
  { id: 'it_sul_piada', pais: 'IT', marcador: 'sulista', intensidade: 1, tema: 'amizade', texto: 'Uma piada sobre o Sul passou na mesa do trabalho. O colega ao lado olhou para você e pediu desculpas em voz baixa.', apoio: 'o colega ao lado, depois do almoço, disse que a piada não tinha graça nenhuma.' },
  // Itália — o estrangeiro
  { id: 'it_estrangeiro_documento', pais: 'IT', marcador: 'estrangeiro', intensidade: 3, tema: 'cotidiano', texto: 'Na estação, a polícia pediu os documentos. Só a você, entre todos que desciam do mesmo trem.' },
  { id: 'it_estrangeiro_anuncio', pais: 'IT', marcador: 'estrangeiro', intensidade: 2, tema: 'lugar', texto: 'O anúncio do apartamento sumiu do site assim que você disse de onde era.' },
  // França — o estrangeiro e o negro
  { id: 'fr_estrangeiro_controle', pais: 'FR', marcador: 'estrangeiro', intensidade: 3, tema: 'cotidiano', texto: 'Na estação, a polícia pediu os documentos pela terceira vez na semana, sempre a você.' },
  { id: 'fr_estrangeiro_entrevista', pais: 'FR', marcador: 'estrangeiro', intensidade: 3, tema: 'trabalho', texto: 'Na entrevista, o seu nome foi lido com uma pausa. A vaga foi para outro candidato, com um nome "mais francês".' },
  { id: 'fr_negro_bairro', pais: 'FR', marcador: 'negro', intensidade: 2, tema: 'lugar', texto: 'Ao procurar casa, o corretor mostrou só apartamentos de outros bairros, e nunca os daquela rua.' },
  // Estados Unidos — o negro
  { id: 'us_negro_corretora', pais: 'US', marcador: 'negro', intensidade: 2, tema: 'lugar', texto: 'A corretora mostrou apartamentos só de um lado da cidade, e nunca os do outro.' },
  { id: 'us_negro_loja', pais: 'US', marcador: 'negro', intensidade: 2, tema: 'cotidiano', texto: 'Na loja de luxo, a vendedora não saiu do lado da sua bolsa durante toda a visita.', apoio: 'uma amiga, na saída, disse que tinha visto tudo e que a vendedora tinha sido ridícula.' },
  // Alemanha — o estrangeiro
  { id: 'de_estrangeiro_idioma', pais: 'DE', marcador: 'estrangeiro', intensidade: 1, tema: 'cotidiano', texto: 'Um vizinho pediu para você falar alemão "de verdade", como se o seu já não fosse.' },
  { id: 'de_estrangeiro_vaga', pais: 'DE', marcador: 'estrangeiro', intensidade: 2, tema: 'trabalho', texto: 'A vaga pedia "falante nativo". A sua fluência, de anos de trabalho, não contou.' },
  // Reino Unido — a origem de classe baixa
  { id: 'gb_classe_sotaque', pais: 'GB', marcador: 'classe_baixa', intensidade: 1, tema: 'trabalho', texto: 'Um colega disse que você "soava menos educado", e a reunião não passou disso.' }
];
