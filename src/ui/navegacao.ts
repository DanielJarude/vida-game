/**
 * A arquitetura de navegação. REWORK 9 — a vida organizada: SEIS áreas
 * estáveis, que não mudam de lugar a cada aniversário (muda o conteúdo, o
 * destaque, o que está disponível). Cada área responde a uma pergunta:
 *
 *   História       o que aconteceu (a Linha da Vida, as trajetórias, o ano que passou)
 *   Você           quem eu sou: corpo, cabeça, aparência, habilidades
 *   Pessoas        com quem vivo e me relaciono
 *   Caminhos       estudos, trabalho e trajetória — UMA área (antes, Formação e
 *                  Trabalho eram duas). REWORK 9.6: uma página inicial curta e
 *                  quatro divisões que não se misturam — Estudos e Trabalho (cada
 *                  um com agora, desempenho, oportunidades e histórico), Vida
 *                  pública e Outros caminhos
 *   Minha Semana   como organizo o tempo: a agenda, o corpo, os hobbies, sair, o celular
 *   Vida           a vida concreta: casa, dinheiro, compras, pertences, cidade, viagens
 *
 * Os ids internos de duas áreas ficam os de antes ('linha' = História, 'tempo'
 * = Minha Semana): só o nome mudou. Os destinos antigos ('formacao',
 * 'trabalho', 'estudos', 'viagens' em Tempo livre) continuam aceitos e levam
 * ao lugar novo. O MAPA DE INTENÇÕES é a fonte única de "onde começo?": o menu
 * o mostra e os testes de navegação o percorrem.
 */

export type Area = 'linha' | 'voce' | 'pessoas' | 'caminhos' | 'tempo' | 'vida';
export type SecaoVida = 'casa' | 'dinheiro' | 'compras' | 'pertences' | 'cidade' | 'viagens';
/** As abas de Minha Semana: a agenda primeiro; depois "quero fazer algo físico", "um hobby", "sair, ver gente", "o celular". */
export type SecaoTempo = 'semana' | 'corpo' | 'atividades' | 'gente' | 'redes';
/**
 * REWORK 9.6 · UX-09/10 — as DIVISÕES de Caminhos: uma página inicial curta (a situação, o próximo passo, as entradas)
 * e quatro experiências que não se misturam. Estudos (a escola, o boletim, os cursos, o histórico acadêmico); Trabalho
 * (o emprego, as vagas, as candidaturas, o negócio, o histórico profissional); Vida pública (concursos, política,
 * serviço público); Outros caminhos (esporte, arte, a universidade como carreira, os projetos).
 */
export type DivisaoCaminhos = 'inicio' | 'estudos' | 'trabalho' | 'publica' | 'outros';
/** As partes de Estudos e de Trabalho: o que ocupa agora, como venho me saindo, o que está ao alcance, por onde passei. */
export type ParteCaminhos = 'agora' | 'desenvolvimento' | 'oportunidades' | 'historico';

/** Um destino: uma área, uma seção de Vida, uma aba de Minha Semana, uma parte de Caminhos — ou um nome antigo que continua aceito. */
export type Aba = Area | SecaoVida | SecaoTempo | ParteCaminhos | 'estudos' | 'formacao' | 'trabalho' | 'cursos' | 'vagas' | 'concursos' | 'negocio' | 'vida_publica' | 'outros_caminhos' | 'inicio_caminhos';

export interface Lugar {
  area: Area;
  secao?: SecaoVida;
  aba?: SecaoTempo;
  /** Em Caminhos, a divisão (ausente: a que estava aberta — ou a inicial). */
  divisao?: DivisaoCaminhos;
  parte?: ParteCaminhos;
  /** Em Caminhos, qual dos dois lados o destino quer à vista (a formação ou o trabalho). */
  foco?: 'formacao' | 'trabalho';
  /** Em Caminhos · Oportunidades, o que procurar (vagas, concursos, negócio). */
  explorar?: 'vagas' | 'concursos' | 'negocio';
  /** REWORK 10 · UX-13: em Você, a parte do retrato (Resumo, Saúde, Habilidades, Aparência, No mundo). */
  voce?: 'resumo' | 'saude' | 'habilidades' | 'aparencia' | 'mundo';
  /** REWORK 10: na História, a parte (o Agora ou a Biografia). */
  historia?: 'agora' | 'biografia';
}

const DE_TEMPO = new Set<string>(['semana', 'corpo', 'atividades', 'gente', 'redes']);
const DE_VIDA = new Set<string>(['casa', 'dinheiro', 'compras', 'pertences', 'cidade', 'viagens']);
const DE_CAMINHOS = new Set<string>(['agora', 'desenvolvimento', 'oportunidades', 'historico']);
export function resolverDestino(d: Aba): Lugar {
  if (d === 'estudos' || d === 'formacao') return { area: 'caminhos', divisao: 'estudos', parte: 'agora', foco: 'formacao' };
  if (d === 'trabalho') return { area: 'caminhos', divisao: 'trabalho', parte: 'agora', foco: 'trabalho' };
  if (d === 'cursos') return { area: 'caminhos', divisao: 'estudos', parte: 'oportunidades', foco: 'formacao' };
  if (d === 'vagas' || d === 'negocio') return { area: 'caminhos', divisao: 'trabalho', parte: 'oportunidades', foco: 'trabalho', explorar: d };
  // Os concursos são vida pública (antes, uma pasta da procura de emprego).
  if (d === 'concursos' || d === 'vida_publica') return { area: 'caminhos', divisao: 'publica' };
  if (d === 'outros_caminhos') return { area: 'caminhos', divisao: 'outros' };
  if (d === 'inicio_caminhos') return { area: 'caminhos', divisao: 'inicio' };
  if (DE_VIDA.has(d)) return { area: 'vida', secao: d as SecaoVida };
  if (DE_TEMPO.has(d)) return { area: 'tempo', aba: d as SecaoTempo };
  if (DE_CAMINHOS.has(d)) return { area: 'caminhos', parte: d as ParteCaminhos };
  return { area: d as Area };
}

export const SECOES_TEMPO: { id: SecaoTempo; rotulo: string; oque: string }[] = [
  { id: 'semana', rotulo: 'Agenda', oque: 'A semana em horários: cada compromisso, os conflitos, o tempo livre — e o estresse' },
  { id: 'corpo', rotulo: 'Corpo e mente', oque: 'Esporte, academia, corrida, terapia, descanso' },
  { id: 'atividades', rotulo: 'Hobbies', oque: 'Arte, música, leitura, estudo, ofícios, dinheiro por fora' },
  { id: 'gente', rotulo: 'Sair e ver gente', oque: 'Comunidade, noite, família, voluntariado — e com quem fazer' },
  { id: 'redes', rotulo: 'Celular', oque: 'As redes sociais: Instagram, TikTok, YouTube, X, Facebook, Twitch, OnlyFans' }
];

export const DIVISOES_CAMINHOS: { id: DivisaoCaminhos; rotulo: string; oque: string }[] = [
  { id: 'inicio', rotulo: 'Início', oque: 'A situação de agora, o próximo passo e as entradas de cada caminho' },
  { id: 'estudos', rotulo: 'Estudos', oque: 'Escola, boletim, cursos, técnico, faculdade, qualificações, histórico acadêmico, preparação para provas' },
  { id: 'trabalho', rotulo: 'Trabalho', oque: 'O emprego de agora, vagas, candidaturas, promoções, experiência, o próprio negócio, histórico profissional' },
  { id: 'publica', rotulo: 'Vida pública', oque: 'Concursos, política, serviço público, farda' },
  { id: 'outros', rotulo: 'Outros caminhos', oque: 'Esporte, arte, a universidade como carreira, os projetos' }
];

/** Os rótulos das partes, em cada divisão (a mesma estrutura, o nome de cada lugar). */
export const PARTES_DA_DIVISAO: Record<'estudos' | 'trabalho', { id: ParteCaminhos; rotulo: string; oque: string }[]> = {
  estudos: [
    { id: 'agora', rotulo: 'Agora', oque: 'A escola ou o curso de agora, o que dá para fazer lá, a dedicação' },
    { id: 'desenvolvimento', rotulo: 'Boletim', oque: 'Como você vem se saindo: as matérias, a nota, a frequência' },
    { id: 'oportunidades', rotulo: 'Cursos', oque: 'O que está ao alcance: cursos, técnico, faculdade, pós, a preparação para provas' },
    { id: 'historico', rotulo: 'Histórico', oque: 'As escolas, os diplomas, o que ficou' }
  ],
  trabalho: [
    { id: 'agora', rotulo: 'Agora', oque: 'O trabalho de agora (ou a procura), o dia a dia, o que corre em paralelo' },
    { id: 'desenvolvimento', rotulo: 'Desempenho', oque: 'O desempenho, o salário, o que você está construindo, os retornos das tentativas' },
    { id: 'oportunidades', rotulo: 'Vagas', oque: 'Vagas, candidaturas, trabalhar por conta, abrir um negócio' },
    { id: 'historico', rotulo: 'Currículo', oque: 'Por onde você passou: empregos, promoções, os momentos da carreira' }
  ]
};

export const SECOES_CAMINHOS: { id: ParteCaminhos; rotulo: string; oque: string }[] = [
  { id: 'agora', rotulo: 'Agora', oque: 'O que ocupa a sua vida agora: a escola, o curso, o trabalho, a carreira — e o que dá para fazer neles' },
  { id: 'desenvolvimento', rotulo: 'Desenvolvimento', oque: 'Como você vem se saindo: as matérias, as competências, a experiência, o desempenho' },
  { id: 'oportunidades', rotulo: 'Oportunidades', oque: 'O que está ao alcance: cursos, vagas, seleções, concursos, propostas, outros caminhos' },
  { id: 'historico', rotulo: 'Histórico', oque: 'Por onde você passou: escolas, diplomas, empregos, temporadas, conquistas' }
];

export const AREAS: { id: Area; rotulo: string; curto: string; icone: string }[] = [
  { id: 'linha', rotulo: 'História', curto: 'História', icone: 'M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4zm0 12a4 4 0 0 0 4 4' },
  { id: 'voce', rotulo: 'Você', curto: 'Você', icone: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-7.5 9a7.5 7.5 0 0 1 15 0' },
  { id: 'pessoas', rotulo: 'Pessoas', curto: 'Pessoas', icone: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3' },
  // Caminhos: a estrada que se bifurca (a formação e o trabalho são partes de uma trajetória só).
  { id: 'caminhos', rotulo: 'Caminhos', curto: 'Caminhos', icone: 'M12 21v-7M12 14l-6-6M12 14l6-6M6 8V4M18 8V4M4 6l2-2 2 2M16 6l2-2 2 2' },
  { id: 'tempo', rotulo: 'Minha Semana', curto: 'Semana', icone: 'M4 6.5h16V20H4zM4 10.5h16M8.5 4v4M15.5 4v4M8 14h3M13 14h3M8 17h3' },
  { id: 'vida', rotulo: 'Vida', curto: 'Vida', icone: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z' }
];

export const SECOES_VIDA: { id: SecaoVida; rotulo: string; oque: string }[] = [
  { id: 'casa', rotulo: 'Casa', oque: 'Onde e com quem você mora; sair de casa, voltar' },
  { id: 'dinheiro', rotulo: 'Dinheiro', oque: 'O mês, o patrimônio e as dívidas; a ajuda da família' },
  { id: 'compras', rotulo: 'Compras', oque: 'Imóveis, carros, motos, bicicletas, óculos e roupas, serviços, banco' },
  // REWORK 4: o que é seu (e o que dá para fazer com isso) saiu de Casa — Casa é onde e com quem se mora.
  // REWORK 9.5: Pertences virou PATRIMÔNIO — o inventário inteiro (o balanço, os imóveis, os veículos, o aplicado, os
  // objetos). O id fica 'pertences' (destinos antigos continuam valendo); Dinheiro fica com o mês e a família.
  { id: 'pertences', rotulo: 'Patrimônio', oque: 'O que é seu: imóveis, veículos, aplicações e objetos — o estado, usar, vender' },
  { id: 'cidade', rotulo: 'Cidade', oque: 'Onde você vive, quanto custa viver aqui, o trajeto, mudar de cidade ou de país' },
  // REWORK 9: as viagens são experiência material (destino, custo, com quem) — saíram do tempo livre para Vida.
  { id: 'viagens', rotulo: 'Viagens', oque: 'Viagens e experiências: destino, duração, com quem' }
];

export const rotuloDoLugar = (l: Lugar) => {
  const a = AREAS.find(x => x.id === l.area)!.rotulo;
  if (l.aba) return `${a} · ${SECOES_TEMPO.find(x => x.id === l.aba)!.rotulo}`;
  if (l.divisao && l.divisao !== 'inicio') {
    const div = DIVISOES_CAMINHOS.find(x => x.id === l.divisao)!.rotulo;
    const parte = l.parte && (l.divisao === 'estudos' || l.divisao === 'trabalho') ? PARTES_DA_DIVISAO[l.divisao].find(x => x.id === l.parte)!.rotulo : undefined;
    return parte && parte !== 'Agora' ? `${a} · ${div} · ${parte}` : `${a} · ${div}`;
  }
  if (l.parte) return `${a} · ${SECOES_CAMINHOS.find(x => x.id === l.parte)!.rotulo}`;
  if (!l.secao) return a;
  return `${a} · ${SECOES_VIDA.find(x => x.id === l.secao)!.rotulo}`;
};

/**
 * "Eu quero fazer X. Onde eu começo?" Cada intenção aponta para UM lugar
 * (a área e, em Vida, a seção) e diz o que procurar lá. É o teste mental
 * da navegação, escrito — e usado pelo menu e pelos testes.
 */
export interface Intencao { id: string; quero: string; lugar: Lugar; la: string }

export const MAPA_DE_INTENCOES: Intencao[] = [
  { id: 'estudar', quero: 'Estudar, ver a escola, a faculdade', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'agora' }, la: 'a escola ou o curso, as atividades de lá (os cursos possíveis estão em Cursos)' },
  { id: 'atividade_escolar', quero: 'Entrar numa atividade da escola ou da faculdade', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'agora' }, la: '"O que dá para fazer aqui"' },
  { id: 'faculdade', quero: 'Fazer faculdade, técnico, pós', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'oportunidades' }, la: 'a preparação e os cursos' },
  { id: 'falar_mae', quero: 'Falar com a mãe, com a família', lugar: { area: 'pessoas' }, la: 'o rosto de quem você quer' },
  { id: 'namoro', quero: 'Procurar alguém para namorar', lugar: { area: 'pessoas' }, la: '"Conhecer alguém"' },
  // FIX pós-playtest humano: da amizade ao romance — na ficha, "Algo mais".
  { id: 'romance_amigo', quero: 'Tentar transformar uma amizade em romance', lugar: { area: 'pessoas' }, la: 'o rosto da pessoa: "Algo mais" (demonstrar interesse — a resposta é dela)' },
  { id: 'fazer_junto', quero: 'Fazer algo com quem eu amo, com o meu filho, com um amigo', lugar: { area: 'pessoas' }, la: 'o rosto da pessoa: "Fazer juntos" (cinema, jantar, parque, ensinar, viajar)' },
  { id: 'agir_trabalho', quero: 'Agir no trabalho: um projeto, a chefia, o treino de atleta', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'agora' }, la: '"No dia a dia do trabalho"' },
  { id: 'emprego', quero: 'Procurar emprego, ver a profissão', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'oportunidades' }, la: 'as vagas e as portas abertas (os concursos ficam em Vida pública)' },
  { id: 'negocio', quero: 'Abrir um negócio', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'oportunidades' }, la: 'a pasta "Negócio próprio"' },
  { id: 'futebol', quero: 'Jogar futebol, treinar, fazer algo físico', lugar: { area: 'tempo', aba: 'corpo' }, la: 'esportes, academia, corrida (o time da escola fica em Caminhos)' },
  { id: 'hobby', quero: 'Praticar um hobby: música, desenho, leitura', lugar: { area: 'tempo', aba: 'atividades' }, la: 'as atividades por tipo' },
  { id: 'sair', quero: 'Sair, ver gente, fazer algo com alguém', lugar: { area: 'tempo', aba: 'gente' }, la: 'o que fazer com quem — e as atividades com gente' },
  { id: 'estresse', quero: 'Entender (e diminuir) o meu estresse', lugar: { area: 'tempo', aba: 'semana' }, la: '"Estresse": o que pesa, o que ajuda, o que dá para fazer' },
  { id: 'viajar', quero: 'Viajar (sozinho ou com a família)', lugar: { area: 'vida', secao: 'viagens' }, la: 'o destino, quanto tempo, com quem' },
  { id: 'carro', quero: 'Comprar carro, moto ou bicicleta', lugar: { area: 'vida', secao: 'compras' }, la: 'concessionária, usados, motos e bicicletas' },
  { id: 'casa', quero: 'Procurar casa, sair da casa dos pais', lugar: { area: 'vida', secao: 'casa' }, la: '"Procurar um lugar para morar"' },
  { id: 'onde_moro', quero: 'Saber onde moro e com quem', lugar: { area: 'vida', secao: 'casa' }, la: 'a casa, no alto' },
  { id: 'mudar_cidade', quero: 'Mudar de cidade', lugar: { area: 'vida', secao: 'cidade' }, la: '"Mudar de cidade"' },
  { id: 'mudar_pais', quero: 'Mudar de país, estudar ou trabalhar fora', lugar: { area: 'vida', secao: 'cidade' }, la: '"Mudar de país": o motivo, o país (com a porta de cada um), a cidade' },
  { id: 'custo_de_vida', quero: 'Saber quanto custa viver aqui', lugar: { area: 'vida', secao: 'cidade' }, la: 'a moeda, o custo do mês, o salário mínimo, a saúde' },
  { id: 'nacionalidade', quero: 'Onde nasci, minha nacionalidade, onde moro', lugar: { area: 'voce', voce: 'mundo' }, la: 'Você · "No mundo"' },
  { id: 'pertences', quero: 'Usar o que é meu: tocar o violão, jogar, fotografar', lugar: { area: 'vida', secao: 'pertences' }, la: 'cada coisa sua, com o que dá para fazer com ela' },
  { id: 'rede', quero: 'Postar no Instagram, crescer no YouTube, as redes sociais', lugar: { area: 'tempo', aba: 'redes' }, la: 'cada plataforma: postar, crescer, monetizar, apagar a conta' },
  { id: 'usar_carro', quero: 'Usar o meu carro, a moto, a bicicleta', lugar: { area: 'vida', secao: 'pertences' }, la: 'o veículo, com o que dá para fazer com ele' },
  { id: 'dinheiro', quero: 'Ver meu dinheiro, pedir ajuda à família', lugar: { area: 'vida', secao: 'dinheiro' }, la: 'o mês, o que é seu, a família' },
  { id: 'cabelo', quero: 'Mudar o cabelo, a barba, pôr óculos', lugar: { area: 'voce', voce: 'aparencia' }, la: 'Você · "Aparência e estilo"' },
  { id: 'cirurgia', quero: 'Fazer uma cirurgia plástica (nariz, orelhas, cabelo, lifting)', lugar: { area: 'vida', secao: 'compras' }, la: '"Você": a clínica de cirurgia plástica' },
  { id: 'saude', quero: 'Cuidar da saúde, da cabeça', lugar: { area: 'voce', voce: 'resumo' }, la: 'Você · Resumo: humor, cabeça e saúde (e o prontuário, em Saúde)' },
  { id: 'historia', quero: 'Acompanhar a minha história', lugar: { area: 'linha' }, la: 'a biografia, ano a ano' },
  // REWORK 7: os testes de intenção do playtest — cada um com um lugar previsível (e conferido por `navegacao.test`).
  { id: 'sair_amigo', quero: 'Sair com um amigo', lugar: { area: 'pessoas' }, la: 'o rosto do amigo: "Fazer juntos"' },
  { id: 'violao', quero: 'Começar a tocar violão (ou outro instrumento)', lugar: { area: 'tempo', aba: 'atividades' }, la: '"Tocar um instrumento" — e o violão, nas lojas de Vida · Compras' },
  { id: 'condicionamento', quero: 'Melhorar o condicionamento', lugar: { area: 'tempo', aba: 'corpo' }, la: 'academia, corrida, um esporte (Você mostra como o corpo está)' },
  { id: 'praticas', quero: 'Ver o que eu pratico e como venho evoluindo', lugar: { area: 'tempo', aba: 'semana' }, la: '"O que você pratica": um toque abre a história de cada atividade' },
  { id: 'carreira', quero: 'Ver a minha carreira', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'historico' }, la: 'a situação em Agora; "Por onde você passou" em Currículo' },
  { id: 'quanto_ganho', quero: 'Saber quanto ganho e quanto gasto', lugar: { area: 'vida', secao: 'dinheiro' }, la: 'o mês: o que entra, o que sai, o que sobra' },
  { id: 'em_casa', quero: 'Ver o que tenho em casa', lugar: { area: 'vida', secao: 'casa' }, la: '"O que há em casa" (usar e vender, em Patrimônio)' },
  { id: 'historico_escolar', quero: 'Ver o meu histórico escolar', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'historico' }, la: 'a formação que já é sua e a história de cada escola' },
  { id: 'familia_aconteceu', quero: 'Saber o que aconteceu com a minha família', lugar: { area: 'pessoas' }, la: '"Pedem atenção", a ficha de cada um — e "Enquanto isso", depois de cada ano' },
  // REWORK 7.5 — as intenções do playtest das interfaces do cotidiano.
  { id: 'agenda', quero: 'Consultar a minha semana, a agenda', lugar: { area: 'tempo', aba: 'semana' }, la: 'a agenda: cada compromisso no seu horário, os conflitos, o tempo livre' },
  { id: 'dedicacao', quero: 'Diminuir (ou aumentar) a dedicação a uma atividade', lugar: { area: 'tempo', aba: 'semana' }, la: 'na agenda, "Mais leve" e "Mais a sério" — ou na ficha da prática' },
  { id: 'celular', quero: 'Abrir o celular, o Instagram, publicar um vídeo', lugar: { area: 'tempo', aba: 'redes' }, la: 'o celular: um app por rede, a tela inicial com o que chegou' },
  { id: 'homenagear', quero: 'Homenagear alguém que morreu, ir ao velório, visitar o túmulo', lugar: { area: 'pessoas' }, la: '"Em memória" (ou "Quem se foi"): a ficha da pessoa, "Lembrar de…"' },
  { id: 'agradecer', quero: 'Agradecer a alguém por uma ajuda', lugar: { area: 'pessoas' }, la: 'a ficha da pessoa, "Conversar": só aparece pelo que ela fez de verdade' },
  { id: 'triste', quero: 'Saber por que ainda estou triste', lugar: { area: 'voce', voce: 'resumo' }, la: 'Você · Resumo, "Como você está": o que pesa (o luto que se acalma, um acontecimento recente) e o que ajuda' },
  { id: 'aparencia', quero: 'Mudar a aparência do jogo, as cores', lugar: { area: 'linha' }, la: 'o Menu (a marca VIDA, no alto): "Aparência", com as quatro paletas' },
  { id: 'profissional', quero: 'Ver as minhas informações profissionais', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'agora' }, la: 'o ofício, a situação agora; a trajetória em Currículo' },
  // REWORK 9.6 · UX-09/10: as divisões novas de Caminhos.
  { id: 'concurso', quero: 'Prestar concurso, entrar na política', lugar: { area: 'caminhos', divisao: 'publica' }, la: 'os editais abertos, o preparo, a política, as carreiras de farda' },
  { id: 'carreira_esporte', quero: 'Seguir carreira no esporte ou na arte', lugar: { area: 'caminhos', divisao: 'outros' }, la: 'as peneiras, as seletivas, a banda, o grupo — e como cada caminho começa' },
  { id: 'boletim', quero: 'Ver o meu boletim, as minhas notas', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'desenvolvimento' }, la: 'o boletim: as matérias, a nota, a frequência' }
];
