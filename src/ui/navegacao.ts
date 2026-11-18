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
export type SecaoVida = 'casa' | 'dinheiro' | 'compras' | 'pertences' | 'cidade' | 'viagens' | 'campo' | 'apostas';
/** As abas de Minha Semana: a agenda primeiro; depois "quero fazer algo físico", "um hobby", "sair, ver gente", "o celular". */
export type SecaoTempo = 'semana' | 'corpo' | 'atividades' | 'gente' | 'redes';
/**
 * REWORK 9.6 · UX-09/10 — as DIVISÕES de Caminhos: uma página inicial curta (a situação, o próximo passo, as entradas)
 * e quatro experiências que não se misturam. Estudos (a escola, o boletim, os cursos, o histórico acadêmico); Trabalho
 * (o emprego, as vagas, as candidaturas, o negócio, o histórico profissional); Vida pública (concursos, política,
 * serviço público); Outros caminhos (esporte, arte, a universidade como carreira, os projetos).
 */
export type DivisaoCaminhos = 'inicio' | 'estudos' | 'trabalho' | 'publica' | 'outros' | 'guia' | 'submundo';
/** As partes de Estudos e de Trabalho: o que ocupa agora, como venho me saindo, o que está ao alcance, por onde passei. */
export type ParteCaminhos = 'agora' | 'desenvolvimento' | 'oportunidades' | 'historico';

/** Um destino: uma área, uma seção de Vida, uma aba de Minha Semana, uma parte de Caminhos — ou um nome antigo que continua aceito. */
export type Aba = Area | SecaoVida | SecaoTempo | ParteCaminhos | 'estudos' | 'formacao' | 'trabalho' | 'cursos' | 'vagas' | 'concursos' | 'negocio' | 'vida_publica' | 'outros_caminhos' | 'inicio_caminhos' | 'prontuario' | 'submundo'
  /** REWORK 10.6 · C2/C3: os destinos das ações principais (entrar na faculdade, as bolsas, o histórico acadêmico, a carreira). */
  | 'faculdade' | 'bolsas' | 'historico_academico' | 'minha_carreira' | 'conquistas'
  /** VIDA 26: o explorador dos caminhos de carreira (Caminhos · Caminhos de carreira). */
  | 'guia_carreiras';

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
  explorar?: 'vagas' | 'concursos' | 'negocio' | 'faculdade' | 'bolsas';
  /** REWORK 10 · UX-13: em Você, a parte do retrato (Resumo, Saúde, Habilidades, Aparência, No mundo). */
  voce?: 'resumo' | 'saude' | 'habilidades' | 'aparencia' | 'fama' | 'mundo';
  /** REWORK 10: na História, a parte (o Agora ou a Biografia). */
  historia?: 'agora' | 'biografia';
  /** HOTFIX 11.5.1: em Vida · Compras, o segmento (Veículos, Serviços…). */
  segmento?: string;
}

const DE_TEMPO = new Set<string>(['semana', 'corpo', 'atividades', 'gente', 'redes']);
const DE_VIDA = new Set<string>(['casa', 'dinheiro', 'compras', 'pertences', 'cidade', 'viagens', 'campo', 'apostas']);
const DE_CAMINHOS = new Set<string>(['agora', 'desenvolvimento', 'oportunidades', 'historico']);
export function resolverDestino(d: Aba): Lugar {
  if (d === 'estudos' || d === 'formacao') return { area: 'caminhos', divisao: 'estudos', parte: 'agora', foco: 'formacao' };
  if (d === 'trabalho') return { area: 'caminhos', divisao: 'trabalho', parte: 'agora', foco: 'trabalho' };
  if (d === 'cursos') return { area: 'caminhos', divisao: 'estudos', parte: 'oportunidades', foco: 'formacao' };
  // REWORK 10.6 · C2: "Entrar na faculdade" e "Bolsas e auxílios" abrem direto o lugar (Caminhos · Estudos · Cursos e faculdade).
  if (d === 'faculdade' || d === 'bolsas') return { area: 'caminhos', divisao: 'estudos', parte: 'oportunidades', foco: 'formacao', explorar: d };
  if (d === 'historico_academico') return { area: 'caminhos', divisao: 'estudos', parte: 'historico', foco: 'formacao' };
  if (d === 'minha_carreira') return { area: 'caminhos', divisao: 'trabalho', parte: 'historico', foco: 'trabalho' };
  // REWORK 10.6 · J1: as conquistas moram na História (a biografia, com os marcos).
  if (d === 'conquistas') return { area: 'linha', historia: 'biografia' };
  if (d === 'vagas' || d === 'negocio') return { area: 'caminhos', divisao: 'trabalho', parte: 'oportunidades', foco: 'trabalho', explorar: d };
  // Os concursos são vida pública (antes, uma pasta da procura de emprego).
  if (d === 'concursos' || d === 'vida_publica') return { area: 'caminhos', divisao: 'publica' };
  if (d === 'outros_caminhos') return { area: 'caminhos', divisao: 'outros' };
  if (d === 'guia_carreiras') return { area: 'caminhos', divisao: 'guia' };
  if (d === 'inicio_caminhos') return { area: 'caminhos', divisao: 'inicio' };
  // REWORK 10.5 · CRI-02: o crime que existe (a trajetória, os contatos, o processo, a ficha) tem porta própria.
  if (d === 'submundo') return { area: 'caminhos', divisao: 'submundo' };
  // REWORK 10.5 · SAU-02: o prontuário (Você · Saúde) — onde se procura o médico, não o Resumo dos atributos.
  if (d === 'prontuario') return { area: 'voce', voce: 'saude' };
  if (DE_VIDA.has(d)) return { area: 'vida', secao: d as SecaoVida };
  if (DE_TEMPO.has(d)) return { area: 'tempo', aba: d as SecaoTempo };
  if (DE_CAMINHOS.has(d)) return { area: 'caminhos', parte: d as ParteCaminhos };
  return { area: d as Area };
}

export const SECOES_TEMPO: { id: SecaoTempo; rotulo: string; oque: string }[] = [
  { id: 'semana', rotulo: 'Agenda', oque: 'A semana em horários: cada compromisso, os conflitos, o tempo livre — e o estresse' },
  { id: 'corpo', rotulo: 'Corpo e mente', oque: 'Esporte, academia, corrida, terapia, descanso' },
  { id: 'atividades', rotulo: 'Hobbies', oque: 'Arte, música, leitura, estudo, ofícios, videogame — e, à parte, o dinheiro por fora' },
  { id: 'gente', rotulo: 'Sair e ver gente', oque: 'Comunidade, noite, família, voluntariado — e com quem fazer' },
  { id: 'redes', rotulo: 'Redes sociais', oque: 'As redes sociais: Instagram, TikTok, YouTube, X, Facebook, Twitch, OnlyFans (o celular, com mensagens, namoro e notícias, fica no topo da tela)' }
];

export const DIVISOES_CAMINHOS: { id: DivisaoCaminhos; rotulo: string; oque: string }[] = [
  { id: 'inicio', rotulo: 'Início', oque: 'A situação de agora, o próximo passo e as entradas de cada caminho' },
  { id: 'estudos', rotulo: 'Estudos', oque: 'Escola, boletim, cursos, técnico, faculdade, qualificações, histórico acadêmico, preparação para provas' },
  { id: 'trabalho', rotulo: 'Trabalho', oque: 'O emprego de agora, vagas, candidaturas, promoções, experiência, o próprio negócio, histórico profissional' },
  { id: 'publica', rotulo: 'Vida pública', oque: 'Concursos, política, serviço público, farda' },
  { id: 'outros', rotulo: 'Outros caminhos', oque: 'Esporte, arte, a universidade como carreira, os projetos' },
  // VIDA 26: a consulta dos caminhos profissionais (esporte, e-sports, pistas): do hobby ao profissional e ao depois.
  { id: 'guia', rotulo: 'Caminhos de carreira', oque: 'O explorador de trajetórias: esporte, e-sports, pistas e profissões — como começam, as etapas, os destinos, o depois e onde você está' },
  // REWORK 10.5 · CRI-02: antes, a vida à margem era a primeira seção de "Outros caminhos" (e só para quem já estava nela).
  { id: 'submundo', rotulo: 'Submundo', oque: 'O crime: o que você faz por fora, quem sabe o seu nome, a confiança do meio, investigações, processos, a ficha' }
];

/** Os rótulos das partes, em cada divisão (a mesma estrutura, o nome de cada lugar). */
export const PARTES_DA_DIVISAO: Record<'estudos' | 'trabalho', { id: ParteCaminhos; rotulo: string; oque: string }[]> = {
  estudos: [
    // REWORK 10.6 · C2: os nomes dizem o que o jogador procura ("Cursos e faculdade", não só "Cursos").
    { id: 'agora', rotulo: 'Minha formação', oque: 'A formação de agora (escola, curso, faculdade), o próximo marco e as ações principais' },
    { id: 'desenvolvimento', rotulo: 'Boletim', oque: 'Como você vem se saindo: as matérias, a nota, a frequência' },
    { id: 'oportunidades', rotulo: 'Cursos e faculdade', oque: 'Entrar na faculdade, cursos, técnico, pós, bolsas e auxílios, a preparação para provas' },
    { id: 'historico', rotulo: 'Histórico', oque: 'O histórico acadêmico: as escolas, as disciplinas e notas, os diplomas' }
  ],
  trabalho: [
    // REWORK 10.6 · C3: meu trabalho, procurar trabalho, minha carreira (e o desempenho de agora).
    { id: 'agora', rotulo: 'Meu trabalho', oque: 'O trabalho de agora (ou a procura), o dia a dia, o que corre em paralelo' },
    { id: 'desenvolvimento', rotulo: 'Desempenho', oque: 'O desempenho, o salário, o que você está construindo, os retornos das tentativas' },
    { id: 'oportunidades', rotulo: 'Procurar trabalho', oque: 'Vagas, candidaturas, entrevistas, trabalhar por conta, abrir um negócio' },
    { id: 'historico', rotulo: 'Minha carreira', oque: 'A experiência, o currículo, as promoções, os projetos e o reconhecimento' }
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
  { id: 'viagens', rotulo: 'Viagens', oque: 'Viagens e experiências: destino, duração, com quem' },
  // REWORK 10 · JOG-01: a loteria e o cassino, com o dinheiro do jogo (carregados sob demanda).
  // VIDA 18: a vida rural — as propriedades (sítio, fazenda, chácara, haras...), a lavoura, o rebanho, as festas do campo.
  { id: 'campo', rotulo: 'Campo', oque: 'Sítio, fazenda, chácara, haras: comprar, arrendar, plantar, criar, as festas do campo' },
  { id: 'apostas', rotulo: 'Apostas', oque: 'Loterias, apostas esportivas, turfe, bingo e cassino (onde a lei permite) — só com o dinheiro do jogo, para maiores de idade' }
];

const PARTE_VOCE: Record<NonNullable<Lugar['voce']>, string> = { resumo: 'Resumo', saude: 'Saúde', habilidades: 'Habilidades', aparencia: 'Aparência', fama: 'Fama', mundo: 'No mundo' };
export const rotuloDoLugar = (l: Lugar) => {
  const a = AREAS.find(x => x.id === l.area)!.rotulo;
  // REWORK 10.5 · UX-20: o destino diz a parte (antes, "Você" — e o jogador caía no Resumo procurando o médico).
  if (l.voce) return `${a} · ${PARTE_VOCE[l.voce]}`;
  if (l.historia) return `${a} · ${l.historia === 'agora' ? 'Agora' : 'Biografia'}`;
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
export interface Intencao {
  id: string; quero: string; lugar: Lugar; la: string;
  /** REWORK 10.5 · UX-20: outras palavras que levam aqui ("médico", "sintoma", "consulta"…). */
  chaves?: string;
  /** Fazer algo, ver uma informação ou acompanhar um problema (a busca mostra a diferença). Ausente: deduzido do verbo. */
  tipo?: 'fazer' | 'ver' | 'acompanhar';
}

/**
 * VIDA 26.1 — AS ÁREAS DA CENTRAL "Onde fica cada coisa": a intenção é agrupada pela FINALIDADE (o que a pessoa quer
 * resolver), não pela tela onde mora. Cada intenção pertence a uma área só (`GRUPO_DA_INTENCAO`); a tela mostra as áreas
 * primeiro, a busca atravessa todas. O lugar (a tela de destino) continua o mesmo — nenhum id ou destino mudou.
 */
export type GrupoDeIntencao = 'pessoas' | 'estudos' | 'trabalho' | 'esporte' | 'lazer' | 'semana' | 'corpo' | 'dinheiro' | 'casa' | 'publica' | 'historia';
export const GRUPOS_DE_INTENCAO: { id: GrupoDeIntencao; rotulo: string; oque: string }[] = [
  { id: 'pessoas', rotulo: 'Pessoas e relacionamentos', oque: 'Família, amizades, namoro, filhos, cuidar de alguém, quem se foi' },
  { id: 'estudos', rotulo: 'Estudos', oque: 'Escola, faculdade, cursos, bolsas, boletim e histórico' },
  { id: 'trabalho', rotulo: 'Trabalho e carreira', oque: 'Emprego, negócio, o dia a dia do trabalho, a carreira' },
  { id: 'esporte', rotulo: 'Esportes e competição', oque: 'Praticar, peneira e base, carreira de atleta, e-sports, kart, o depois' },
  { id: 'lazer', rotulo: 'Hobbies, lazer e redes', oque: 'Música, arte, videogame, sair, redes sociais, o celular' },
  { id: 'semana', rotulo: 'Rotina e semana', oque: 'A agenda, a dedicação a cada atividade, o estresse, o que você pratica' },
  { id: 'corpo', rotulo: 'Corpo, saúde e aparência', oque: 'Médico, tratamento, cabeça, atributos, o corpo, cabelo e estilo' },
  { id: 'dinheiro', rotulo: 'Dinheiro, compras e patrimônio', oque: 'O mês, compras, veículos, o que é seu, apostas, o campo' },
  { id: 'casa', rotulo: 'Casa, cidade e viagens', oque: 'Onde morar, mudar de cidade ou de país, viajar, custo de vida' },
  { id: 'publica', rotulo: 'Vida pública e outros rumos', oque: 'Concursos, política, o crime e a Justiça' },
  { id: 'historia', rotulo: 'História, avisos e o jogo', oque: 'A biografia, as conquistas, os convites com prazo, as cores do jogo' }
];
export const GRUPO_DA_INTENCAO: Record<string, GrupoDeIntencao> = {
  estudar: 'estudos', atividade_escolar: 'estudos', faculdade: 'estudos', cursos: 'estudos', bolsa: 'estudos', historico_escolar: 'estudos', boletim: 'estudos',
  convite: 'historia', conquistas: 'historia', historia: 'historia', aparencia: 'historia',
  pedir_compra: 'dinheiro', carro: 'dinheiro', usar_carro: 'dinheiro', dinheiro: 'dinheiro', quanto_ganho: 'dinheiro', apostar: 'dinheiro', campo: 'dinheiro', pertences: 'dinheiro',
  falar_mae: 'pessoas', namoro: 'pessoas', romance_amigo: 'pessoas', fazer_junto: 'pessoas', sair_amigo: 'pessoas', cuidar_de_alguem: 'pessoas', familia_aconteceu: 'pessoas', homenagear: 'pessoas', agradecer: 'pessoas',
  agir_trabalho: 'trabalho', emprego: 'trabalho', negocio: 'trabalho', carreira: 'trabalho', profissional: 'trabalho',
  futebol: 'esporte', carreira_esporte: 'esporte', base_esporte: 'esporte', formacao_atleta: 'esporte', esports: 'esporte', kart: 'esporte', pos_carreira: 'esporte', caminhos_carreira: 'esporte',
  hobby: 'lazer', violao: 'lazer', sair: 'lazer', rede: 'lazer', celular: 'lazer', videogame: 'lazer',
  estresse: 'semana', agenda: 'semana', dedicacao: 'semana', praticas: 'semana',
  condicionamento: 'corpo', cabelo: 'corpo', cirurgia: 'corpo', saude: 'corpo', tratamento: 'corpo', cabeca: 'corpo', atributos: 'corpo', triste: 'corpo', corpo_capacidades: 'corpo',
  viajar: 'casa', casa: 'casa', onde_moro: 'casa', mudar_cidade: 'casa', mudar_pais: 'casa', custo_de_vida: 'casa', nacionalidade: 'casa', em_casa: 'casa',
  concurso: 'publica', submundo: 'publica'
};
export const grupoDaIntencao = (x: Intencao): GrupoDeIntencao => GRUPO_DA_INTENCAO[x.id] ?? 'historia';

export const MAPA_DE_INTENCOES: Intencao[] = [
  { id: 'estudar', quero: 'Estudar, ver a escola, a faculdade', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'agora' }, la: 'a escola ou o curso, as atividades de lá (os cursos possíveis estão em Cursos)' },
  { id: 'atividade_escolar', quero: 'Entrar numa atividade da escola ou da faculdade', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'agora' }, la: '"O que dá para fazer aqui"' },
  { id: 'faculdade', quero: 'Entrar na faculdade (graduação)', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'oportunidades', explorar: 'faculdade' }, la: '"Entrar na faculdade": os cursos, o que cada um pede, quanto custa, as bolsas — candidatar-se e confirmar a matrícula', chaves: 'faculdade universidade graduacao vestibular enem sisu matricula curso superior', tipo: 'fazer' },
  { id: 'cursos', quero: 'Fazer um curso técnico, de qualificação ou uma pós', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'oportunidades' }, la: 'os cursos ao alcance, a preparação para provas', chaves: 'tecnico qualificacao pos mestrado doutorado curso livre', tipo: 'fazer' },
  { id: 'bolsa', quero: 'Conseguir bolsa, crédito ou auxílio para estudar', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'oportunidades', explorar: 'bolsas' }, la: '"Bolsas e auxílios": o que existe aqui e o que está ao seu alcance', chaves: 'bolsa prouni fies credito auxilio cota financiamento', tipo: 'fazer' },
  { id: 'convite', quero: 'Responder a um convite, uma proposta com prazo', lugar: { area: 'linha' }, la: 'o painel "Portas abertas" (ao lado; no celular, no alto da História): um toque abre o convite, com quem chamou, o prazo e o que muda', chaves: 'convite proposta projeto porta prazo oportunidade chamou', tipo: 'acompanhar' },
  { id: 'pedir_compra', quero: 'Pedir aos responsáveis para comprar algo (criança)', lugar: { area: 'vida', secao: 'compras' }, la: 'a loja: o preço, o que você tem, o que falta — "Pedir para comprar" ou "Pedir ajuda para completar"', chaves: 'pedir comprar mesada pai mae responsavel dinheiro crianca brinquedo chuteira', tipo: 'fazer' },
  { id: 'conquistas', quero: 'Ver as minhas conquistas e marcos', lugar: { area: 'linha', historia: 'biografia' }, la: 'História · Biografia: os marcos ano a ano (e "A conquista do ano" depois de cada ano)', chaves: 'conquista premio marco titulo medalha', tipo: 'ver' },
  { id: 'falar_mae', quero: 'Falar com a mãe, com a família', lugar: { area: 'pessoas' }, la: 'o rosto de quem você quer' },
  { id: 'namoro', quero: 'Procurar alguém para namorar', lugar: { area: 'pessoas' }, la: '"Conhecer alguém"' },
  // FIX pós-playtest humano: da amizade ao romance — na ficha, "Algo mais".
  { id: 'romance_amigo', quero: 'Tentar transformar uma amizade em romance', lugar: { area: 'pessoas' }, la: 'o rosto da pessoa: "Algo mais" (demonstrar interesse — a resposta é dela)' },
  { id: 'fazer_junto', quero: 'Fazer algo com quem eu amo, com o meu filho, com um amigo', lugar: { area: 'pessoas' }, la: 'o rosto da pessoa: "Fazer juntos" (cinema, jantar, parque, ensinar, viajar)' },
  { id: 'agir_trabalho', quero: 'Agir no trabalho: um projeto, a chefia, o treino de atleta', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'agora' }, la: '"No dia a dia do trabalho"' },
  { id: 'emprego', quero: 'Procurar emprego, mudar de trabalho', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'oportunidades' }, la: 'Caminhos · Trabalho · Procurar trabalho: as vagas, o que cada uma pede, as candidaturas (os concursos ficam em Vida pública)', chaves: 'emprego vaga trabalho curriculo entrevista candidatura', tipo: 'fazer' },
  { id: 'negocio', quero: 'Abrir um negócio', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'oportunidades' }, la: 'a pasta "Negócio próprio"' },
  { id: 'futebol', quero: 'Jogar futebol, treinar, fazer algo físico', lugar: { area: 'tempo', aba: 'corpo' }, la: 'esportes, academia, corrida (o time da escola fica em Caminhos)' },
  { id: 'hobby', quero: 'Praticar um hobby: música, desenho, leitura', lugar: { area: 'tempo', aba: 'atividades' }, la: 'as atividades por tipo' },
  { id: 'sair', quero: 'Sair, ver gente, fazer algo com alguém', lugar: { area: 'tempo', aba: 'gente' }, la: 'o que fazer com quem — e as atividades com gente' },
  { id: 'estresse', quero: 'Entender (e diminuir) o meu estresse', lugar: { area: 'tempo', aba: 'semana' }, la: '"Estresse": o que pesa, o que ajuda, o que dá para fazer' },
  { id: 'viajar', quero: 'Viajar (sozinho ou com a família)', lugar: { area: 'vida', secao: 'viagens' }, la: 'o destino, quanto tempo, com quem' },
  { id: 'carro', quero: 'Comprar carro, moto ou bicicleta', lugar: { area: 'vida', secao: 'compras', segmento: 'veiculos' }, la: 'concessionária, usados, motos e bicicletas' },
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
  { id: 'apostar', quero: 'Jogar na loteria, apostar no futebol, no turfe, no cassino', lugar: { area: 'vida', secao: 'apostas' }, la: 'Vida · Apostas: Mega-Sena e as outras loterias, bolões, futebol, turfe, bingo, cassino' },
  { id: 'campo', quero: 'Comprar um sítio ou uma fazenda, plantar, criar gado', lugar: { area: 'vida', secao: 'campo' }, la: 'Vida · Campo: as ofertas da região, a lavoura, o rebanho, as estruturas, as festas' },
  { id: 'cabelo', quero: 'Mudar o cabelo, a barba, pôr óculos', lugar: { area: 'voce', voce: 'aparencia' }, la: 'Você · "Aparência e estilo"' },
  { id: 'cirurgia', quero: 'Fazer uma cirurgia plástica (nariz, orelhas, cabelo, lifting)', lugar: { area: 'vida', secao: 'compras', segmento: 'servicos' }, la: '"Você": a clínica de cirurgia plástica' },
  // REWORK 10.5 · SAU-02 / UX-20: "saúde" e "cuidar" levam ao atendimento (o prontuário, com o médico), não aos atributos.
  { id: 'saude', quero: 'Ir ao médico (consulta, exames), cuidar da saúde', lugar: { area: 'voce', voce: 'saude' }, la: 'Você · Saúde: o prontuário, os sinais do corpo e "Procurar atendimento médico" (criança: pedir aos responsáveis)', chaves: 'medico consulta sintoma sinal doenca exame hospital posto pediatra remedio dor diagnostico check-up cuidar atendimento', tipo: 'fazer' },
  { id: 'tratamento', quero: 'Acompanhar um tratamento, uma condição de saúde', lugar: { area: 'voce', voce: 'saude' }, la: 'Você · Saúde: o que tem nome, o tratamento, a fila — parar (com o risco dito antes) ou retomar', chaves: 'tratamento condicao cancer pressao diabetes fila remedio acompanhamento parar retomar abandonar', tipo: 'acompanhar' },
  { id: 'cabeca', quero: 'Cuidar da cabeça, do estresse e do humor', lugar: { area: 'voce', voce: 'resumo' }, la: 'Você · Resumo: a cabeça e o humor, o que pesa e o que ajuda (terapia, descanso)', chaves: 'estresse ansiedade terapia psicologo humor triste cansado', tipo: 'fazer' },
  { id: 'atributos', quero: 'Ver os meus atributos (saúde, físico, felicidade, beleza, inteligência)', lugar: { area: 'voce', voce: 'resumo' }, la: 'Você · Resumo: a ficha dos cinco atributos, com as causas', chaves: 'atributo saude fisico felicidade beleza inteligencia', tipo: 'ver' },
  { id: 'cuidar_de_alguem', quero: 'Cuidar de alguém da família que adoeceu', lugar: { area: 'pessoas' }, la: 'a ficha da pessoa: "Família e cuidado" (acompanhar a consulta, ajudar, visitar)', chaves: 'cuidar doente pai mae filho avo hospital visitar', tipo: 'fazer' },
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
  { id: 'submundo', quero: 'Entrar para o crime, ver o processo e os antecedentes', lugar: { area: 'caminhos', divisao: 'submundo' }, la: 'Caminhos · Submundo: a situação, os contatos, o risco, o processo e a ficha', chaves: 'crime ilegal esquema por fora policia processo prisao antecedentes advogado submundo', tipo: 'fazer' },
  { id: 'boletim', quero: 'Ver o meu boletim, as minhas notas', lugar: { area: 'caminhos', divisao: 'estudos', parte: 'desenvolvimento' }, la: 'o boletim: as matérias, a nota, a frequência' },
  // VIDA 26.1 — esportes, e-sports, pistas, o depois da competição, o corpo, os caminhos de carreira (cada um com o lugar real).
  { id: 'caminhos_carreira', quero: 'Explorar caminhos de carreira: do hobby ao profissional', lugar: { area: 'caminhos', divisao: 'guia' }, la: 'Caminhos · Caminhos de carreira: cada esporte, jogo, as pistas e as profissões — como começa, as etapas, o depois', chaves: 'carreira trajetoria caminho profissao futuro sonho virar ser jogador atleta lutador piloto profissional explorar possibilidades', tipo: 'ver' },
  { id: 'base_esporte', quero: 'Fazer uma peneira ou seletiva, entrar numa base', lugar: { area: 'caminhos', divisao: 'outros' }, la: 'Caminhos · Outros caminhos: "Esporte" — pedir um teste num clube, o convite, a base', chaves: 'peneira seletiva base escolinha clube teste categoria sub futebol futsal basquete volei tenis natacao atletismo luta lutas arte marcial muay thai jiu jitsu judo boxe karate mma', tipo: 'fazer' },
  { id: 'formacao_atleta', quero: 'Ver a minha formação de atleta e os meus atributos', lugar: { area: 'caminhos', divisao: 'outros' }, la: 'na base: a formação ano a ano, a leitura da comissão (capacidade, potencial, prontidão) e a ficha; no profissional, em Trabalho', chaves: 'formacao base categoria avaliacao comissao potencial prontidao atributo ficha atleta jogador', tipo: 'ver' },
  { id: 'esports', quero: 'Competir em e-sports (CS, VALORANT, LoL, Fortnite...)', lugar: { area: 'caminhos', divisao: 'outros' }, la: 'Caminhos · Outros caminhos: "E-sports" — escolher o jogo, treinar a sério, peneiras, equipes', chaves: 'esports e-sports counter strike cs csgo cs2 valorant lol league of legends fortnite r6 rainbow six siege rocket league videogame competitivo gamer equipe campeonato', tipo: 'fazer' },
  { id: 'kart', quero: 'Correr de kart, tentar chegar à Fórmula 1', lugar: { area: 'caminhos', divisao: 'outros' }, la: 'Caminhos · Outros caminhos: "Automobilismo" — o kart, as categorias de fórmula, a F1', chaves: 'kart automobilismo formula f1 f2 f3 f4 piloto corrida carro pista', tipo: 'fazer' },
  { id: 'pos_carreira', quero: 'Depois de competir: treinador, analista, comentarista', lugar: { area: 'caminhos', divisao: 'trabalho', parte: 'oportunidades' }, la: '"Depois de competir": as portas que a sua carreira abriu (aparece para quem encerrou uma carreira esportiva ou de e-sports)', chaves: 'treinador tecnico auxiliar comentarista analista professor preparador dirigente gerente caster narrador streamer aposentar aposentadoria pos carreira', tipo: 'fazer' },
  { id: 'videogame', quero: 'Jogar videogame por diversão', lugar: { area: 'tempo', aba: 'atividades' }, la: '"Jogar videogame" — o hobby (e, se quiser, a porta para os e-sports)', chaves: 'videogame jogo jogar console pc gamer playstation xbox', tipo: 'fazer' },
  { id: 'corpo_capacidades', quero: 'Ver o meu corpo e as capacidades físicas', lugar: { area: 'voce', voce: 'aparencia' }, la: 'Você · Aparência · Corpo: a condição atual, as capacidades (força, velocidade...), a evolução, o objetivo, a constituição', chaves: 'corpo forca velocidade capacidade fisica musculo gordura peso altura treino academia condicionamento', tipo: 'ver' }
];

/** O que a intenção é: fazer algo, ver uma informação, acompanhar um problema (dito ou deduzido do verbo). */
export function tipoDaIntencao(x: Intencao): 'fazer' | 'ver' | 'acompanhar' {
  if (x.tipo) return x.tipo;
  return /^(Ver|Saber|Consultar|Entender|Onde)/.test(x.quero) ? 'ver' : /^Acompanhar/.test(x.quero) ? 'acompanhar' : 'fazer';
}

/** Sem acento, minúsculo, sem hífen (Counter-Strike = counter strike = counterstrike). */
export const normalizarBusca = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_./]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * VIDA 26.1 — palavras que querem dizer a mesma coisa na busca (o jogador escreve como fala). Cada palavra buscada vale
 * também pelas suas equivalentes; nada aqui leva a lugar que a intenção não declara.
 */
const SINONIMOS: Record<string, string[]> = {
  namorar: ['namoro', 'romance', 'paquera', 'conhecer alguem'], paquera: ['namoro'], romance: ['namoro'], crush: ['namoro', 'romance'],
  dinheiro: ['salario', 'conta', 'gasto', 'ganho', 'mes'], grana: ['dinheiro', 'salario'], financas: ['dinheiro'], investir: ['patrimonio', 'aplicacoes'],
  faculdade: ['universidade', 'graduacao'], universidade: ['faculdade', 'graduacao'], escola: ['estudar', 'boletim'], estudar: ['escola', 'faculdade', 'curso'],
  futebol: ['bola', 'peneira', 'base'], bola: ['futebol'], soccer: ['futebol'],
  cs: ['counter strike'], counterstrike: ['counter strike'], csgo: ['counter strike'], valorant: ['esports'], lol: ['league of legends'], fortnite: ['esports'],
  muay: ['luta', 'lutas', 'arte marcial'], thai: ['luta', 'lutas'], muaythai: ['luta', 'lutas', 'arte marcial'], luta: ['lutas', 'arte marcial'], lutador: ['luta', 'lutas'],
  boxe: ['luta', 'lutas'], judo: ['luta', 'lutas'], jiujitsu: ['luta', 'lutas'], karate: ['luta', 'lutas'], mma: ['luta', 'lutas'],
  emprego: ['trabalho', 'vaga'], trabalhar: ['trabalho', 'emprego'], profissao: ['carreira', 'trabalho'], carreira: ['trajetoria', 'profissao'],
  atleta: ['esporte', 'carreira'], jogador: ['atleta', 'esporte', 'peneira'], gamer: ['videogame', 'esports'], jogo: ['videogame'], game: ['videogame', 'esports'],
  piloto: ['kart', 'formula'], f1: ['formula'], corrida: ['kart', 'correr'],
  mae: ['familia'], pai: ['familia'], filho: ['familia', 'filhos'], amigo: ['amizade'],
  morar: ['casa', 'moro'], apartamento: ['casa'], mudar: ['mudar de cidade'], viagem: ['viajar'],
  carro: ['veiculo', 'moto'], moto: ['carro', 'veiculo'], celular: ['redes', 'instagram'], instagram: ['redes'],
  doente: ['saude', 'medico'], hospital: ['saude', 'medico'], academia: ['condicionamento', 'treinar', 'fisico'], musculo: ['corpo'],
  treinador: ['tecnico', 'depois de competir'], comentarista: ['depois de competir'], aposentar: ['depois de competir', 'aposentadoria']
};

const prefixoComum = (a: string, b: string) => { let k = 0; while (k < a.length && k < b.length && a[k] === b[k]) k++; return k; };
/** Uma letra a mais, a menos ou trocada (o erro de digitação), só em palavras de 5+ letras. */
function quase(a: string, b: string): boolean {
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, erros = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++erros > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return erros + (a.length - i) + (b.length - j) <= 1;
}
/** A palavra (ou uma equivalente) está no texto: inteira, no texto colado, pelo radical (5+ letras em comum) ou com um erro. */
function bate(w: string, texto: string): boolean {
  const colado = texto.replace(/ /g, '');
  const cands = [w, ...(SINONIMOS[w] ?? [])];
  const palavras = texto.split(' ');
  return cands.some(c => texto.includes(c) || (c.length >= 3 && colado.includes(c.replace(/ /g, '')))) ||
    palavras.some(t => (w.length >= 5 && t.length >= 5 && prefixoComum(w, t) >= Math.min(w.length, t.length, 6) - 1 && prefixoComum(w, t) >= 5) || quase(w, t));
}
/**
 * A pontuação de um item na busca: TODA palavra buscada precisa bater em algum campo; o campo pesa (o pedido > as
 * palavras-chave > o destino > a explicação). 0 = não é resultado. Usada também pelas trajetórias da central.
 */
export function pontuarBusca(busca: string, campos: [texto: string, peso: number][]): number {
  const palavras = normalizarBusca(busca).split(' ').filter(Boolean);
  if (!palavras.length) return 0;
  const cs = campos.map(([t, p]) => [normalizarBusca(t), p] as const);
  let total = 0;
  for (const w of palavras) {
    const melhor = Math.max(0, ...cs.filter(([t]) => bate(w, t)).map(([, p]) => p));
    if (!melhor) return 0;
    total += melhor;
  }
  return total;
}

/**
 * REWORK 10.5 · UX-20 — a busca de "onde fica": todas as palavras precisam aparecer (no que se quer, nas palavras-chave,
 * no "lá" ou no destino), e o que bate no PEDIDO vem antes do que só bate na explicação. VIDA 26.1: com sinônimos,
 * variação de escrita, radical comum e um erro de digitação (`pontuarBusca`); sem repetir resultado.
 */
export function buscarIntencoes(busca: string): Intencao[] {
  if (!normalizarBusca(busca)) return MAPA_DE_INTENCOES;
  const pontos = (x: Intencao) => {
    const p = pontuarBusca(busca, [[x.quero, 4], [x.chaves ?? '', 3], [rotuloDoLugar(x.lugar), 1.5], [x.la, 1]]);
    return p ? p + (tipoDaIntencao(x) === 'fazer' ? 0.2 : 0) : 0;
  };
  return MAPA_DE_INTENCOES.map(x => ({ x, p: pontos(x) })).filter(y => y.p > 0).sort((a, b) => b.p - a.p).map(y => y.x);
}
