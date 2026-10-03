/**
 * A arquitetura de navegação (REWORK 3): seis áreas estáveis, que não mudam
 * de lugar a cada aniversário — muda o conteúdo, o destaque, o que está
 * disponível. Cada área responde a uma pergunta:
 *
 *   Linha da Vida  o que aconteceu (a biografia)
 *   Você           como eu estou: corpo, cabeça, aparência e estilo
 *   Pessoas        quem está na minha vida (família, amigos, amor)
 *   Formação       onde estudo, com quem, o que faço lá, o que posso estudar
 *   Trabalho       o que faço para viver (e o que posso vir a fazer)
 *   Tempo livre    a semana: atividades, esporte, arte, lazer (a área mais
 *                  visitada no dia a dia — FIX pós-REWORK 3: saiu de dentro
 *                  de Vida para não pedir dois toques toda vez)
 *   Vida           a vida concreta: onde moro, o dinheiro, as compras, a cidade
 *
 * Dentro de Vida há seções (navegação contextual interna), em vez de mais
 * abas no topo. O MAPA DE INTENÇÕES é a fonte única de "onde começo?": o
 * menu o mostra e os testes de navegação o percorrem.
 */

export type Area = 'linha' | 'voce' | 'pessoas' | 'formacao' | 'trabalho' | 'tempo' | 'vida';
export type SecaoVida = 'casa' | 'dinheiro' | 'compras' | 'pertences' | 'cidade';

/** Um destino: uma área, uma seção de Vida — ou um nome antigo que continua aceito. */
export type Aba = Area | SecaoVida | 'estudos';

export interface Lugar { area: Area; secao?: SecaoVida }

export function resolverDestino(d: Aba): Lugar {
  if (d === 'estudos') return { area: 'formacao' };
  if (d === 'casa' || d === 'dinheiro' || d === 'compras' || d === 'pertences' || d === 'cidade') return { area: 'vida', secao: d };
  return { area: d };
}

export const AREAS: { id: Area; rotulo: string; curto: string; icone: string }[] = [
  { id: 'linha', rotulo: 'Linha da Vida', curto: 'História', icone: 'M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4zm0 12a4 4 0 0 0 4 4' },
  { id: 'voce', rotulo: 'Você', curto: 'Você', icone: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-7.5 9a7.5 7.5 0 0 1 15 0' },
  { id: 'pessoas', rotulo: 'Pessoas', curto: 'Pessoas', icone: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3' },
  { id: 'formacao', rotulo: 'Formação', curto: 'Formação', icone: 'M12 3l10 5-10 5L2 8l10-5zm-6 7.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5' },
  { id: 'trabalho', rotulo: 'Trabalho', curto: 'Trabalho', icone: 'M3.5 8h17v11.5h-17zM9 8V5.5h6V8M3.5 13.5h17' },
  { id: 'tempo', rotulo: 'Tempo livre', curto: 'Tempo', icone: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2' },
  { id: 'vida', rotulo: 'Vida', curto: 'Vida', icone: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z' }
];

export const SECOES_VIDA: { id: SecaoVida; rotulo: string; oque: string }[] = [
  { id: 'casa', rotulo: 'Casa', oque: 'Onde e com quem você mora; sair de casa, voltar' },
  { id: 'dinheiro', rotulo: 'Dinheiro', oque: 'O mês, o que é seu e o que deve; a ajuda da família' },
  { id: 'compras', rotulo: 'Compras', oque: 'Imóveis, carros, motos, bicicletas, óculos e roupas, banco' },
  // REWORK 4: o que é seu (e o que dá para fazer com isso) saiu de Casa — Casa é onde e com quem se mora.
  { id: 'pertences', rotulo: 'Pertences', oque: 'O que é seu: usar (tocar, jogar, fotografar), o estado, vender' },
  { id: 'cidade', rotulo: 'Cidade', oque: 'Onde você vive, quanto custa viver aqui, o trajeto, mudar de cidade ou de país' }
];

export const rotuloDoLugar = (l: Lugar) => {
  const a = AREAS.find(x => x.id === l.area)!.rotulo;
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
  { id: 'estudar', quero: 'Estudar, ver a escola, a faculdade', lugar: { area: 'formacao' }, la: 'a instituição, as atividades de lá, os cursos possíveis' },
  { id: 'atividade_escolar', quero: 'Entrar numa atividade da escola ou da faculdade', lugar: { area: 'formacao' }, la: '"O que dá para fazer aqui"' },
  { id: 'faculdade', quero: 'Fazer faculdade, técnico, pós', lugar: { area: 'formacao' }, la: 'a preparação e os cursos' },
  { id: 'falar_mae', quero: 'Falar com a mãe, com a família', lugar: { area: 'pessoas' }, la: 'o rosto de quem você quer' },
  { id: 'namoro', quero: 'Procurar alguém para namorar', lugar: { area: 'pessoas' }, la: '"Conhecer alguém"' },
  { id: 'emprego', quero: 'Procurar emprego, ver a profissão', lugar: { area: 'trabalho' }, la: 'o trabalho de agora e as vagas' },
  { id: 'negocio', quero: 'Abrir um negócio', lugar: { area: 'trabalho' }, la: '"Outras possibilidades"' },
  { id: 'futebol', quero: 'Jogar futebol, treinar', lugar: { area: 'tempo' }, la: 'as atividades da semana (o time da escola fica em Formação)' },
  { id: 'carro', quero: 'Comprar carro, moto ou bicicleta', lugar: { area: 'vida', secao: 'compras' }, la: 'concessionária, usados, motos e bicicletas' },
  { id: 'casa', quero: 'Procurar casa, sair da casa dos pais', lugar: { area: 'vida', secao: 'casa' }, la: '"Procurar um lugar para morar"' },
  { id: 'onde_moro', quero: 'Saber onde moro e com quem', lugar: { area: 'vida', secao: 'casa' }, la: 'a casa, no alto' },
  { id: 'mudar_cidade', quero: 'Mudar de cidade', lugar: { area: 'vida', secao: 'cidade' }, la: '"Mudar de cidade"' },
  { id: 'mudar_pais', quero: 'Mudar de país, estudar ou trabalhar fora', lugar: { area: 'vida', secao: 'cidade' }, la: '"Mudar de país": o motivo, o país (com a porta de cada um), a cidade' },
  { id: 'custo_de_vida', quero: 'Saber quanto custa viver aqui', lugar: { area: 'vida', secao: 'cidade' }, la: 'a moeda, o custo do mês, o salário mínimo, a saúde' },
  { id: 'nacionalidade', quero: 'Onde nasci, minha nacionalidade, onde moro', lugar: { area: 'voce' }, la: '"No mundo"' },
  { id: 'pertences', quero: 'Usar o que é meu: tocar o violão, jogar, fotografar', lugar: { area: 'vida', secao: 'pertences' }, la: 'cada coisa sua, com o que dá para fazer com ela' },
  { id: 'rede', quero: 'Publicar, ver seguidores, a rede social', lugar: { area: 'pessoas' }, la: '"Na rede"' },
  { id: 'dinheiro', quero: 'Ver meu dinheiro, pedir ajuda à família', lugar: { area: 'vida', secao: 'dinheiro' }, la: 'o mês, o que é seu, a família' },
  { id: 'cabelo', quero: 'Mudar o cabelo, a barba, pôr óculos', lugar: { area: 'voce' }, la: '"Aparência e estilo"' },
  { id: 'saude', quero: 'Cuidar da saúde, da cabeça', lugar: { area: 'voce' }, la: 'humor, cabeça e saúde' },
  { id: 'historia', quero: 'Acompanhar a minha história', lugar: { area: 'linha' }, la: 'a biografia, ano a ano' }
];
