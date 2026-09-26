/**
 * Os negócios que alguém pode abrir — e o que faz cada um ser diferente.
 *
 *   PRESENÇA — onde o negócio encontra quem compra: `rua` (porta aberta,
 *   freguesia que entra), `online` (a loja é o site e as plataformas; não há
 *   balcão nem vitrine), `atendimento` (agenda: paciente, cliente, tutor) e
 *   `obra` (o serviço acontece na casa do cliente). Um acontecimento, uma
 *   palavra ou um jeito de vender só aparece onde cabe: loja on-line não
 *   recebe "freguesia do bairro"; consultório não vende em marketplace.
 *
 *   PALAVRAS — o medidor, as frases do movimento e da reputação saem da
 *   presença (pedidos, agenda, obras), nunca do "casa cheia" genérico.
 *
 *   ESTRATÉGIAS — os jeitos de vender que existem para cada presença, com o
 *   que custam e rendem (`FATOR_ESTRATEGIA`).
 *
 *   AÇÕES — o que dá para fazer PELO negócio (reformar, especializar,
 *   divulgar, entrar nos aplicativos de entrega, trocar de transportadora),
 *   com o nome de cada ofício (`sistemas/gestao`).
 */

import type { Dominio, EstrategiaNegocio } from '../tipos';

export type PresencaNegocio = 'rua' | 'online' | 'atendimento' | 'obra';

export interface TipoNegocio {
  id: string;
  nome: string;
  ocupacaoId: string;
  capital: number;
  /** Estrada que conta (meses) na trilha — ou o ofício equivalente. */
  trilhas: string[];
  meses: number;
  dominio?: Dominio;
  habilidade?: number;
  /** Registro profissional exigido (consultório, escritório de profissão regulamentada). */
  licenca?: string;
  /** O que faz quem trabalha nele [masculino, feminino]. */
  funcoes: [string, string][];
  /** Salário de quem trabalha nele, em salários mínimos. */
  folha: number;
  /** Dá para começar pequeno, em casa. */
  emCasa?: boolean;
  presenca: PresencaNegocio;
  /** Os jeitos de vender que existem para este negócio (o primeiro é o de partida). */
  estrategias: EstrategiaNegocio[];
  /** Ações próprias deste ofício (além das comuns a todo negócio). */
  acoes: string[];
  /** Quem compra, no singular ("freguês", "cliente", "paciente", "tutor"). */
  cliente: string;
}

export const NEGOCIOS: readonly TipoNegocio[] = [
  { id: 'salao', nome: 'um salão', ocupacaoId: 'dono_salao', capital: 12000, trilhas: ['beleza'], meses: 24, dominio: 'beleza', habilidade: 55, funcoes: [['cabeleireiro', 'cabeleireira'], ['manicure', 'manicure'], ['auxiliar de salão', 'auxiliar de salão']], folha: 1.3, emCasa: true,
    presenca: 'rua', estrategias: ['bairro', 'qualidade', 'preco', 'online'], acoes: ['estrutura', 'especializar', 'agenda_online', 'fornecedor'], cliente: 'cliente' },
  { id: 'oficina', nome: 'uma oficina', ocupacaoId: 'dono_oficina', capital: 25000, trilhas: ['mecanica', 'manutencao'], meses: 36, dominio: 'manual', habilidade: 62, funcoes: [['mecânico', 'mecânica'], ['ajudante de oficina', 'ajudante de oficina']], folha: 1.5,
    presenca: 'rua', estrategias: ['bairro', 'qualidade', 'preco', 'escala'], acoes: ['estrutura', 'especializar', 'fornecedor'], cliente: 'cliente' },
  { id: 'lanchonete', nome: 'uma lanchonete', ocupacaoId: 'dono_lanchonete', capital: 20000, trilhas: ['alimentacao', 'confeitaria'], meses: 12, dominio: 'cozinha', habilidade: 52, funcoes: [['atendente', 'atendente'], ['ajudante de cozinha', 'ajudante de cozinha'], ['chapeiro', 'chapeira']], folha: 1.15, emCasa: true,
    presenca: 'rua', estrategias: ['bairro', 'qualidade', 'preco', 'online'], acoes: ['estrutura', 'especializar', 'delivery', 'fornecedor'], cliente: 'freguês' },
  { id: 'comercio', nome: 'um comércio', ocupacaoId: 'dono_comercio', capital: 30000, trilhas: ['comercio', 'vendas'], meses: 24, dominio: 'vendas', habilidade: 52, funcoes: [['atendente', 'atendente'], ['caixa', 'caixa'], ['repositor', 'repositora']], folha: 1.15,
    presenca: 'rua', estrategias: ['bairro', 'qualidade', 'preco', 'online'], acoes: ['estrutura', 'especializar', 'fornecedor'], cliente: 'freguês' },
  { id: 'loja_online', nome: 'uma loja on-line', ocupacaoId: 'dono_loja_online', capital: 9000, trilhas: ['comercio', 'vendas', 'informal', 'conteudo'], meses: 12, dominio: 'vendas', habilidade: 48, funcoes: [['ajudante de expedição', 'ajudante de expedição'], ['atendente on-line', 'atendente on-line']], folha: 1.2, emCasa: true,
    presenca: 'online', estrategias: ['escala', 'marca', 'qualidade', 'preco'], acoes: ['estrutura', 'especializar', 'logistica', 'fornecedor'], cliente: 'cliente' },
  { id: 'empreiteira', nome: 'uma empreiteira', ocupacaoId: 'empreiteiro', capital: 22000, trilhas: ['construcao'], meses: 72, funcoes: [['pedreiro', 'pedreira'], ['servente', 'servente'], ['eletricista', 'eletricista']], folha: 1.6,
    presenca: 'obra', estrategias: ['bairro', 'qualidade', 'preco', 'escala'], acoes: ['estrutura', 'especializar', 'fornecedor'], cliente: 'cliente' },
  { id: 'marcenaria', nome: 'uma marcenaria', ocupacaoId: 'dono_marcenaria', capital: 28000, trilhas: ['marcenaria'], meses: 48, dominio: 'manual', habilidade: 66, funcoes: [['marceneiro', 'marceneira'], ['ajudante de marcenaria', 'ajudante de marcenaria']], folha: 1.6,
    presenca: 'rua', estrategias: ['bairro', 'qualidade', 'preco', 'online'], acoes: ['estrutura', 'especializar', 'fornecedor'], cliente: 'cliente' },
  { id: 'estudio', nome: 'um estúdio de foto e vídeo', ocupacaoId: 'dono_estudio', capital: 26000, trilhas: ['imagem', 'conteudo'], meses: 36, dominio: 'fotografia', habilidade: 66, funcoes: [['assistente de estúdio', 'assistente de estúdio'], ['editor de vídeo', 'editora de vídeo']], folha: 1.8, emCasa: true,
    presenca: 'atendimento', estrategias: ['bairro', 'qualidade', 'preco', 'escala'], acoes: ['estrutura', 'especializar', 'agenda_online'], cliente: 'cliente' },
  { id: 'consultoria_ti', nome: 'uma consultoria de tecnologia', ocupacaoId: 'consultor_ti', capital: 12000, trilhas: ['ti', 'dados'], meses: 60, funcoes: [['desenvolvedor', 'desenvolvedora'], ['analista de sistemas', 'analista de sistemas']], folha: 3.2, emCasa: true,
    presenca: 'atendimento', estrategias: ['bairro', 'qualidade', 'escala', 'online'], acoes: ['estrutura', 'especializar'], cliente: 'cliente' },
  { id: 'escritorio_contabil', nome: 'um escritório de contabilidade', ocupacaoId: 'contador_socio', capital: 15000, trilhas: ['contabil'], meses: 60, licenca: 'crc', funcoes: [['assistente contábil', 'assistente contábil'], ['auxiliar de escritório', 'auxiliar de escritório']], folha: 1.7,
    presenca: 'atendimento', estrategias: ['bairro', 'qualidade', 'escala', 'online'], acoes: ['estrutura', 'especializar'], cliente: 'cliente' },
  { id: 'consultorio_psicologia', nome: 'um consultório de psicologia', ocupacaoId: 'psicologo_clinico', capital: 14000, trilhas: ['psicologia'], meses: 36, licenca: 'crp', funcoes: [['secretário', 'secretária']], folha: 1.3,
    presenca: 'atendimento', estrategias: ['bairro', 'qualidade', 'escala', 'online'], acoes: ['estrutura', 'especializar', 'agenda_online'], cliente: 'paciente' },
  { id: 'clinica_fisio', nome: 'uma clínica de fisioterapia', ocupacaoId: 'fisio_clinica', capital: 45000, trilhas: ['fisioterapia'], meses: 48, licenca: 'crefito', funcoes: [['fisioterapeuta', 'fisioterapeuta'], ['recepcionista', 'recepcionista']], folha: 2.2,
    presenca: 'atendimento', estrategias: ['bairro', 'qualidade', 'escala'], acoes: ['estrutura', 'especializar', 'agenda_online'], cliente: 'paciente' },
  { id: 'clinica_vet', nome: 'uma clínica veterinária', ocupacaoId: 'veterinario_clinica', capital: 60000, trilhas: ['veterinaria'], meses: 48, licenca: 'crmv', funcoes: [['auxiliar veterinário', 'auxiliar veterinária'], ['recepcionista', 'recepcionista'], ['veterinário', 'veterinária']], folha: 1.9,
    presenca: 'atendimento', estrategias: ['bairro', 'qualidade', 'preco', 'escala'], acoes: ['estrutura', 'especializar', 'agenda_online'], cliente: 'tutor' }
];

export const tipoNegocio = (id: string) => NEGOCIOS.find(n => n.id === id);

/* ================================================================ Palavras */

interface Palavras {
  medidor: string;
  /** Uma palavra por faixa (fraco → cheio). */
  niveis: [string, string, string, string];
  /** Uma frase por faixa. */
  frases: [string, string, string, string];
  /** Quando não dá para atender mais com a gente que há. */
  limite: [sozinho: string, equipe: string];
  reputacao: [string, string, string, string];
}

export const PALAVRAS: Record<PresencaNegocio, Palavras> = {
  rua: {
    medidor: 'Movimento',
    niveis: ['fraco', 'crescendo', 'bom', 'casa cheia'],
    frases: ['Pouco movimento: tem dia em que quase ninguém entra.', 'O movimento vem crescendo, mas ainda oscila.', 'Freguesia certa: a casa enche nos dias bons.', 'Casa cheia: tem fila, tem gente esperando.'],
    limite: ['Sozinho, não dá para atender mais.', 'Com a equipe que há, não dá para atender mais.'],
    reputacao: ['Pouca gente conhece.', 'Conhecido no bairro.', 'Tem nome na cidade.', 'Referência: gente vem de longe.']
  },
  online: {
    medidor: 'Pedidos',
    niveis: ['poucos', 'crescendo', 'constantes', 'sem dar conta'],
    frases: ['Poucos pedidos: tem semana sem nenhuma venda.', 'Os pedidos vêm crescendo, mas oscilam com os anúncios.', 'Pedido todo dia, e cliente que volta a comprar.', 'Pedido demais para despachar: o estoque não acompanha.'],
    limite: ['Sozinho, não dá para embalar e despachar mais.', 'Com a equipe que há, não dá para despachar mais.'],
    reputacao: ['Poucas avaliações ainda.', 'Boas avaliações; cliente que volta.', 'Nota alta nas plataformas.', 'Marca conhecida: procuram pelo nome.']
  },
  atendimento: {
    medidor: 'Agenda',
    niveis: ['vazia', 'enchendo', 'cheia', 'lista de espera'],
    frases: ['A agenda tem mais buraco do que horário marcado.', 'A agenda vem enchendo, mas ainda oscila.', 'Agenda cheia na maior parte da semana.', 'Lista de espera: gente pedindo encaixe.'],
    limite: ['Sozinho, a agenda não comporta mais.', 'Com a equipe que há, a agenda não comporta mais.'],
    reputacao: ['Pouca gente conhece.', 'Indicado por quem já foi atendido.', 'Nome respeitado na cidade.', 'Referência na área.']
  },
  obra: {
    medidor: 'Obras',
    niveis: ['pouca', 'aparecendo', 'constante', 'fila de clientes'],
    frases: ['Pouca obra: meses parados entre um serviço e outro.', 'As obras vêm aparecendo, uma de cada vez.', 'Obra atrás de obra, com cliente indicando cliente.', 'Mais obra do que equipe: tem cliente esperando vaga.'],
    limite: ['Sem mais gente, não dá para pegar mais obra.', 'Com a equipe que há, não dá para pegar mais obra.'],
    reputacao: ['Pouca gente conhece.', 'Conhecido na vizinhança.', 'Indicado por arquitetos e clientes.', 'Referência na cidade.']
  }
};

export const faixa = (x: number, cortes: [number, number, number] = [20, 45, 70]) => (x < cortes[0] ? 0 : x < cortes[1] ? 1 : x < cortes[2] ? 2 : 3);

/* ============================================================= Estratégias */

/** O que cada jeito de vender faz com a margem, o custo, o movimento (por ano) e a reputação. */
export const FATOR_ESTRATEGIA: Record<EstrategiaNegocio, { margem: number; custo: number; movimento: number; reputacao: number }> = {
  bairro: { margem: 1, custo: 1, movimento: 0, reputacao: 0 },
  qualidade: { margem: 1.12, custo: 1.1, movimento: -1, reputacao: 3 },
  preco: { margem: 0.85, custo: 1, movimento: 3, reputacao: -1 },
  online: { margem: 1, custo: 0.9, movimento: 1.5, reputacao: 0 },
  escala: { margem: 0.82, custo: 0.95, movimento: 3.5, reputacao: -0.5 },
  marca: { margem: 1.08, custo: 1.05, movimento: 0.8, reputacao: 2 }
};

/** Como se chama cada jeito, em cada presença (o rótulo da opção e a frase de "hoje"). */
export function rotuloEstrategia(p: PresencaNegocio, e: EstrategiaNegocio, tipoId?: string): { opcao: string; hoje: string } | undefined {
  const saude = tipoId === 'consultorio_psicologia' || tipoId === 'clinica_fisio';
  const tabela: Record<PresencaNegocio, Partial<Record<EstrategiaNegocio, { opcao: string; hoje: string }>>> = {
    rua: {
      bairro: { opcao: 'O de sempre: freguesia do bairro, preço justo', hoje: 'vive da freguesia do bairro, com preço justo' },
      qualidade: { opcao: 'Apostar na qualidade (custa mais, cobra mais, demora a pegar)', hoje: 'aposta na qualidade' },
      preco: { opcao: 'Preço baixo para encher a casa (menos margem)', hoje: 'enche a casa com preço baixo' },
      online: { opcao: tipoId === 'lanchonete' ? 'Vender também por aplicativo e redes' : 'Vender também pela internet', hoje: 'vende também pela internet' },
      escala: { opcao: tipoId === 'oficina' ? 'Atender frotas de empresas (volume, margem apertada)' : 'Vender em volume para empresas (margem apertada)', hoje: tipoId === 'oficina' ? 'vive de contratos com frotas de empresas' : 'vende em volume para empresas' }
    },
    online: {
      escala: { opcao: 'Vender nas grandes plataformas (muito pedido, taxa alta)', hoje: 'vende nas grandes plataformas, com taxa alta e muito pedido' },
      marca: { opcao: 'Site e redes próprios (devagar, margem melhor)', hoje: 'vende pelo próprio site e pelas redes' },
      qualidade: { opcao: 'Catálogo escolhido a dedo (menos itens, cliente fiel)', hoje: 'tem um catálogo pequeno, escolhido a dedo' },
      preco: { opcao: 'O menor preço da categoria (vende muito, sobra pouco)', hoje: 'briga pelo menor preço da categoria' }
    },
    atendimento: {
      bairro: { opcao: 'Indicação e boca a boca', hoje: 'vive de indicação' },
      qualidade: { opcao: saude ? 'Só particular, com atendimento caprichado' : 'Poucos clientes, trabalho de primeira', hoje: saude ? 'atende só particular' : 'atende poucos clientes, com trabalho de primeira' },
      preco: { opcao: 'Preço popular (agenda cheia, valor menor)', hoje: 'cobra preço popular' },
      escala: { opcao: saude || tipoId === 'clinica_vet' ? 'Atender convênios (agenda cheia, valor menor, pagamento que atrasa)' : 'Carteira de empresas (volume, contrato, margem apertada)', hoje: saude || tipoId === 'clinica_vet' ? 'atende convênios' : 'vive de uma carteira de empresas' },
      online: { opcao: tipoId === 'consultorio_psicologia' ? 'Atender também on-line' : 'Atender clientes de outras cidades, on-line', hoje: 'atende também on-line' }
    },
    obra: {
      bairro: { opcao: 'Indicação de clientes', hoje: 'vive de indicação' },
      qualidade: { opcao: 'Acabamento de primeira (cobra mais, demora mais)', hoje: 'aposta em acabamento de primeira' },
      preco: { opcao: 'O orçamento mais baixo da praça', hoje: 'ganha obra pelo orçamento mais baixo' },
      escala: { opcao: 'Empreitadas para construtoras (volume, margem apertada)', hoje: 'pega empreitadas de construtoras' }
    }
  };
  return tabela[p][e];
}

export const estrategiaPadrao = (t: TipoNegocio): EstrategiaNegocio => t.estrategias[0];
