/**
 * Desenhos da vida material: a casa onde se mora (com a luz acesa de quem mora ali, o bicho na frente, o carro na
 * porta), o veículo e os ícones dos bens.
 *
 * REWORK 8 (Fase B): a casa e o veículo vêm da linguagem nova (`ilustracao/`): a parede no material dela, o telhado de
 * barro, o vidro, a luz quente da janela acesa — a mesma família dos carros, das coisas e das fachadas. Cada tipo de
 * moradia tem a sua silhueta (o prédio baixo não é a torre de alto padrão, a casa simples de laje não é a casa grande
 * de dois andares), e o estado aparece com forma (mancha, rachadura, andaime, pintura nova), sempre com o texto na
 * descrição — nunca só com cor.
 */

import type { FormaDaCasa, LeituraLar } from '../../leituraMaterial';
import { IlustracaoVeiculo } from '../../ilustracao/veiculos';
import { Ilustracao } from '../../ilustracao/nucleo';
import { amostraDaCasa, amostraDaMiniatura, PLANTAS } from '../../ilustracao/casas';
import { NOME_FORMA, type FormaVeiculo } from '../../../motor/dados/bens';

const DESCRICAO: Record<FormaDaCasa, string> = {
  republica: 'uma república: sobrado dividido, com muitas janelas pequenas e varal na frente',
  kitnet: 'um corredor de kitnets, portas iguais lado a lado em dois pisos',
  apto_1q: 'um prédio baixo de três andares, com caixa-d\'água em cima',
  apto_2q: 'um prédio de cinco andares, com marquise na entrada',
  apto_3q: 'um prédio alto com varanda em todos os andares',
  alto_padrao: 'uma torre envidraçada de alto padrão, com portaria, piscina e palmeira',
  cobertura: 'um prédio alto com a cobertura de dois andares no topo, terraço e pérgola',
  mansao: 'uma mansão de dois andares, com colunas na entrada, piscina e jardim',
  casa_simples: 'uma casa simples de laje, com ferro para cima e caixa-d\'água, sem garagem',
  casa_2q: 'uma casa de dois quartos, com muro baixo, portão e árvore no quintal',
  casa_3q: 'uma casa de três quartos, com garagem ao lado e quintal',
  casa_grande: 'uma casa grande de dois andares, com sacada, garagem dupla e jardim',
  sitio: 'um sítio: casa com varanda, cerca, árvores, roça e caixa-d\'água na torre',
  familia: 'a casa da família, antiga, com alpendre, vasos de planta e varal',
  parente: 'a casa de parentes, com um puxadinho em cima e escada de fora',
  favor: 'a casa de conhecidos, com um quartinho de favor nos fundos',
  funcional: 'uma moradia funcional: casas iguais da vila, com mastro e bandeira'
};

/** O que o desenho mostra, em palavras (tipo de casa e estado). */
export function descricaoDaCasa(l: LeituraLar): string {
  const c = l.condicao;
  const partes = [DESCRICAO[l.forma]];
  if (l.fachada) partes.push(['apto_1q', 'apto_2q', 'apto_3q', 'kitnet', 'alto_padrao', 'cobertura', 'funcional'].includes(l.forma) ? `de fachada ${l.fachada.nome}` : `pintada de ${l.fachada.nome}`);
  if (c.nivel === 'problema') partes.push(`com andaime e rachadura na parede, pedindo reparo${c.problema ? ` (${c.problema})` : ''}`);
  else if (c.nivel === 'ruim') partes.push('com rachaduras na parede');
  else if (c.nivel === 'gasta') partes.push('com manchas de umidade na parede');
  if (c.reformaRecente && c.nivel !== 'problema') partes.push('com pintura nova');
  else if (PLANTAS[l.forma].tijolo && l.padrao <= 1) partes.push('tijolo à vista');
  return partes.join(', ');
}

export function CenaDaCasa({ l }: { l: LeituraLar }) {
  const acesas = Math.max(1, l.janelasAcesas);
  const c = l.condicao;
  const tijolo = PLANTAS[l.forma].tijolo && l.padrao <= 1 && !(c.reformaRecente && c.nivel !== 'problema');
  const formaV = formaNaPorta(l);
  const rotulo = `Desenho: ${descricaoDaCasa(l)}; ${acesas} ${acesas === 1 ? 'janela acesa' : 'janelas acesas'}${l.bichos.length ? `, ${l.bichos.map(b => b.nome).join(' e ')} na frente` : ''}${l.veiculo ? `, ${l.veiculo === 'carro' ? 'um carro' : l.veiculo === 'moto' ? 'uma moto' : 'uma bicicleta'} (${NOME_FORMA[formaV!]}) na porta` : ''}.`;
  const a = amostraDaCasa({
    forma: l.forma, acesas, tijolo, fachada: l.fachada?.cor, nivel: c.nivel, reforma: !!c.reformaRecente,
    veiculo: l.veiculo && formaV ? { tipo: l.veiculo, forma: formaV, cor: l.corVeiculo, versaoId: l.versaoVeiculo, estado: l.estadoVeiculo } : undefined,
    bichos: l.bichos.filter(b => b.especie === 'gato' || b.especie === 'cachorro')
  });
  return <Ilustracao a={a} largura={312} rotulo={rotulo} className={`cena cena--${l.forma} cena--${c.nivel}${l.fachada ? ' cena--colorida' : ''}`} dados={{ 'data-forma': l.forma }} />;
}

/** A forma do veículo na porta (sem a versão, a forma típica da categoria). */
const formaNaPorta = (l: LeituraLar): FormaVeiculo | undefined => l.formaVeiculo ?? (l.veiculo === 'carro' ? 'hatch' : l.veiculo === 'moto' ? 'street' : l.veiculo === 'bicicleta' ? 'urbana' : undefined);

/**
 * O estilo de um veículo com cor (as variáveis que o CSS e os testes leem: a cor do anúncio, a lataria opaca, o vidro).
 */
function luminancia(hex: string): number {
  const c = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16) / 255).map(x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const escurecer = (hex: string, t: number) => '#' + [1, 3, 5].map(k => Math.round(parseInt(hex.slice(k, k + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('');
/** O estilo de um veículo com cor: a lataria na cor (opaca), o vidro escuro, o contorno escuro da própria cor — claro
 *  só quando a lataria é escura (o carro preto não some no fundo escuro). */
export function estiloDaLataria(cor: string): Record<string, string | number> {
  const valida = /^#[0-9a-f]{6}$/i.test(cor) ? cor : '#888888';
  const escura = luminancia(valida) < 0.025;
  return { '--cor-veiculo': valida, '--lataria': valida, '--lataria-op': 1, '--vidro': escura ? '#9fb2c2' : '#1f2a33', '--vidro-op': escura ? 0.55 : 0.82, '--pneu': '#181513', '--cubo': '#a8a29a', color: escura ? '#d8d1c4' : escurecer(valida, 0.62) };
}

/**
 * REWORK 8 (Fase B): o desenho de um veículo vem da linguagem nova (`ilustracao/`): a forma da família, os números do
 * MODELO (`versaoId`), a cor do anúncio ou do bem e o estado. `semente` continua valendo para o que não tem modelo (a
 * pequena variação). As classes e as variáveis de estilo de antes ficam (o CSS e os testes leem a cor do anúncio aqui).
 */
export function DesenhoVeiculo({ forma, rotulo, largura = 48, semente, versaoId, cor, estado }: { forma: FormaVeiculo; rotulo?: string; largura?: number; semente?: string; versaoId?: string; cor?: string; estado?: number }) {
  return (
    <IlustracaoVeiculo forma={forma} rotulo={rotulo} largura={largura} semente={semente} versaoId={versaoId ?? semente} cor={cor} estado={estado}
      className={`desenho-veiculo desenho-veiculo--${forma}${cor ? ' desenho-veiculo--colorido' : ''}`} style={cor ? estiloDaLataria(cor) : undefined} />
  );
}

const TRACO = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const ICONES: Record<string, string> = {
  // As lojas das coisas da vida (`dados/coisas`).
  eletronicos: 'M3 6h12v9H3zM1 18h16M18 8h4v12h-4zM19.5 17h1',
  eletrodomesticos: 'M5 3h14v18H5zM5 7h14M8 5h1M8 14a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  instrumentos: 'M14 4l6 6M17 7l-6 6M10 12a4 4 0 1 0 1 5a3 3 0 0 0-1-5zM7.5 16.5h.5',
  esportes: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  livraria: 'M4 5c3-1 6-1 8 1c2-2 5-2 8-1v14c-3-1-6-1-8 1c-2-2-5-2-8-1zM12 6v14',
  predio: 'M5 21V4h10v17M15 9h4v12M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1M3 21h18',
  kitnet: 'M4 21V5h16v16M8 9h2M14 9h2M8 13h2M14 13h2M11 21v-4h2v4M2 21h20',
  casa: 'M3 11l9-7 9 7M5 10v11h14V10M10 21v-6h4v6',
  carro: 'M3 16h18M5 16v-4l3-4h8l4 4v4M7.5 18.5a1.5 1.5 0 1 0 0-.01M16.5 18.5a1.5 1.5 0 1 0 0-.01',
  moto: 'M5 17a3 3 0 1 0 0-.01M19 17a3 3 0 1 0 0-.01M5 17l5-6h5l4 6M10 11l-1-3h3',
  bicicleta: 'M5 17a3 3 0 1 0 0-.01M19 17a3 3 0 1 0 0-.01M5 17l4-7h6l4 7M9 10l3 7',
  nautica: 'M3 15h18l-3 4H6zM12 15V4M12 5l6 8h-6M2 21c3-1 5 1 8 0s5-1 8 0 3 1 4 0',
  aeroclube: 'M2 13h16l4-2M11 13l-4 6M11 13l-4-6M20 11v4M2 11v4',
  banco: 'M3 9l9-5 9 5M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18',
  // A clínica: o prédio com a cruz e o perfil de um rosto (estética, não hospital).
  clinica: 'M4 21V7h10v14M9 10v4M7 12h4M17 9c2 0 3 2 3 4s-1 2-2 2l1 3h-3M2 21h20',
  abrigo: 'M4 12c0-4 3-6 5-6M20 12c0-4-3-6-5-6M7 14c1 4 9 4 10 0M9 9h.01M15 9h.01M12 12v1',
  oficina: 'M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9M7 17l-3 3',
  imobiliaria: 'M4 20V9l6-4 6 4v11M16 12h4v8M8 13h4M8 16h4M2 20h20',
  usados: 'M3 16h18M5 16v-4l3-4h8l4 4v4M12 4v3M10 5h4',
  concessionaria: 'M3 16h18M5 16v-4l3-4h8l4 4v4M4 4h16',
  loja_pets: 'M4 10h16v10H4zM3 10l2-5h14l2 5M9 14c0-1 1-2 3-2s3 1 3 2-1 2-3 2-3-1-3-2M8 12.5h.01M16 12.5h.01',
  loja: 'M3 9h18l-1.5 11h-15zM8 9V7a4 4 0 0 1 8 0v2M5 13a2.5 2.5 0 0 0 5 0M14 13a2.5 2.5 0 0 0 5 0',
  republica: 'M3 11l9-7 9 7M5 10v11h14V10M8 13h2M14 13h2M8 17h2M14 17h2',
  casa_simples: 'M4 12l8-6 8 6M6 11v9h12v-9M11 20v-4h2v4',
  casa_2q: 'M3 11l9-7 9 7M5 10v11h14V10M8 14h3M13 14h3M10 21v-3h4v3',
  casa_3q: 'M2 11l7-6 7 6M4 10v11h10V10M14 13l4-3 4 3M16 13v8h5v-8M7 14h4',
  casa_grande: 'M1 11l6-6 6 6 5-4 5 4M3 10v11h18V10M6 14h3M11 14h2M15 14h3M10 21v-4h4v4',
  sitio: 'M3 13l6-5 6 5M5 12v8h8v-8M15 20c0-4 3-7 6-7M17 20c0-3 2-5 4-5M2 20h20',
  apto_1q: 'M7 21V5h10v16M10 9h1M13 9h1M10 13h1M13 13h1M11 21v-3h2v3M4 21h16',
  apto_2q: 'M6 21V4h12v17M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2M3 21h18',
  apto_3q: 'M4 21V3h16v18M7 7h2M11 7h2M15 7h2M7 11h2M11 11h2M15 11h2M7 15h2M15 15h2M11 21v-4h2v4M2 21h20',
  alto_padrao: 'M5 21V2h14v19M8 5h2M14 5h2M8 9h2M14 9h2M8 13h2M14 13h2M3 21h18M9 21v-4h6v4'
};

/** Cada tipo de moradia tem a sua silhueta (e o tamanho aparece no desenho, não só no texto). */
const ICONE_MORADIA: Record<string, string> = { republica: 'republica', kitnet: 'kitnet', casa_simples: 'casa_simples', apto_1q: 'apto_1q', apto_2q: 'apto_2q', casa_2q: 'casa_2q', apto_3q: 'apto_3q', casa_3q: 'casa_3q', casa_grande: 'casa_grande', sitio: 'sitio', alto_padrao: 'alto_padrao', cobertura: 'alto_padrao', mansao: 'casa_grande' };

/**
 * FIX pós-REWORK 4 → REWORK 8: a miniatura da casa — a MESMA silhueta da cena (o prédio baixo, a torre, a casa de
 * laje, a casa grande), na cor da fachada dela. Na vitrine da imobiliária e entre os bens: reconhecível antes do rótulo.
 */
export function MiniaturaDaCasa({ forma, fachada, rotulo, largura = 104 }: { forma: FormaDaCasa; fachada?: { cor: string; nome: string }; rotulo?: string; largura?: number }) {
  return <Ilustracao a={amostraDaMiniatura(forma, fachada?.cor)} largura={largura} rotulo={rotulo} className={`cena cena--miniatura cena--${forma}${fachada ? ' cena--colorida' : ''}`} style={{ width: largura }} dados={{ 'data-forma': forma }} />;
}


export function IconeMoradia({ modeloId, estado }: { modeloId: string; estado?: string }) {
  const nome = ICONE_MORADIA[modeloId] ?? 'casa';
  return (
    <span className={`icone-moradia icone-moradia--${nome}${estado === 'reforma' ? ' icone-moradia--reforma' : ''}`} aria-hidden>
      <Icone nome={nome} tamanho={34} />
      {estado === 'reforma' && <span className="icone-moradia__selo">obra</span>}
      {estado === 'novo' && <span className="icone-moradia__selo">novo</span>}
    </span>
  );
}

export function Icone({ nome, tamanho = 28 }: { nome: string; tamanho?: number }) {
  return (
    <svg className="icone-bem" width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden {...TRACO}>
      <path d={ICONES[nome] ?? ICONES.casa} />
    </svg>
  );
}

/** Linha de evolução (patrimônio, aplicação) — com descrição acessível. */
export function Evolucao({ valores, rotulo, altura = 44 }: { valores: number[]; rotulo: string; altura?: number }) {
  if (valores.length < 2) return null;
  const min = Math.min(0, ...valores);
  const max = Math.max(...valores, 1);
  const w = 200;
  const pts = valores.map((x, k) => `${(k / (valores.length - 1)) * w},${altura - 4 - ((x - min) / (max - min || 1)) * (altura - 8)}`);
  const zero = altura - 4 - ((0 - min) / (max - min || 1)) * (altura - 8);
  return (
    <svg className="evolucao" viewBox={`0 0 ${w} ${altura}`} preserveAspectRatio="none" role="img" aria-label={rotulo}>
      {min < 0 && <line x1={0} x2={w} y1={zero} y2={zero} className="evolucao__zero" />}
      <polyline points={pts.join(' ')} className="evolucao__linha" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export type { LeituraLar };
