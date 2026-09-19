import { GameEvent } from '../../types';

export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'rnd_carteira_perdida',
    titulo: 'Carteira Achada na Rua',
    descricao: 'Ao caminhar pela calçada perto de uma agência bancária, você encontra uma carteira de couro caída com R$ 450 e documentos dentro.',
    idadeMinima: 14,
    idadeMaxima: 90,
    categoria: 'cotidiano',
    peso: 70,
    opcoes: [
      {
        id: 'opt_devolver_dono',
        texto: 'Procurar o dono pelos documentos e devolver tudo intacto',
        descricaoResultado: 'O dono, um senhor aposentado, chorou de emoção e te agradeceu com um abraço caloroso pela sua honestidade!',
        consequencias: {
          stats: { felicidade: 20 },
          hiddenStats: { empatia: 25, reputacao: 25, disciplina: 15 },
          adicionarFlag: 'pessoa_honesta'
        }
      },
      {
        id: 'opt_ficar_dinheiro',
        texto: 'Ficar com o dinheiro e descartar a carteira',
        descricaoResultado: 'Você embolsou os R$ 450, mas a sua consciência pesou toda vez que lembrou do ocorrido.',
        consequencias: {
          stats: { felicidade: -10 },
          dinheiro: 450,
          hiddenStats: { empatia: -20, reputacao: -10 }
        }
      }
    ]
  },
  {
    id: 'rnd_som_alto_vizinho',
    titulo: 'Som Alto do Vizinho de Madrugada',
    descricao: 'São 2 horas da manhã de uma terça-feira e o vizinho do lado está ouvindo música no volume máximo com paredão de som.',
    idadeMinima: 18,
    idadeMaxima: 90,
    categoria: 'cotidiano',
    peso: 75,
    opcoes: [
      {
        id: 'opt_conversar_educado',
        texto: 'Tocar a campainha e pedir com educação para abaixar o volume',
        descricaoResultado: 'O vizinho percebeu o exagero, pediu desculpas cordiais e desligou o som.',
        consequencias: {
          stats: { felicidade: 10 },
          hiddenStats: { sociabilidade: 10, empatia: 10 }
        }
      },
      {
        id: 'opt_chamar_policia',
        texto: 'Ligar para a polícia reclamando de perturbação do sossego (190)',
        descricaoResultado: 'A viatura passou, o som foi desligado, mas o clima com a vizinhança ficou tenso.',
        consequencias: {
          stats: { felicidade: 5 },
          hiddenStats: { estresse: 10 }
        }
      },
      {
        id: 'opt_protetor_ouvido',
        texto: 'Colocar protetor auricular e tentar dormir',
        descricaoResultado: 'Você demorou para pegar no sono e acordou com olheiras no dia seguinte.',
        consequencias: {
          stats: { felicidade: -10 },
          hiddenStats: { estresse: 15 }
        }
      }
    ]
  },
  {
    id: 'rnd_panela_pressao',
    titulo: 'O Feijão na Panela de Pressão',
    descricao: 'Você colocou o feijão de molho para cozinhar na panela de pressão com alho, louro e bacon.',
    idadeMinima: 16,
    idadeMaxima: 90,
    categoria: 'cotidiano',
    peso: 65,
    opcoes: [
      {
        id: 'opt_feijao_perfeito',
        texto: 'Esperar a pressão sair naturalmente e temperar caprichado',
        descricaoResultado: 'O feijão ficou grosso, perfumado e maravilhoso! O melhor prato do dia!',
        consequencias: {
          stats: { felicidade: 15, saude: 5 },
          hiddenStats: { disciplina: 5 }
        }
      },
      {
        id: 'opt_levantar_valvula',
        texto: 'Levantar a válvula com o garfo embaixo da torneira',
        descricaoResultado: 'Deu certo sem explodir o teto da cozinha, mas o susto com o chiado foi grande!',
        consequencias: {
          stats: { felicidade: 8 }
        }
      }
    ]
  },
  {
    id: 'rnd_sorteio_shopping',
    titulo: 'Cupom de Sorteio do Shopping',
    descricao: 'Após fazer compras de fim de ano, você deposita seus cupons na urna do shopping da cidade.',
    idadeMinima: 18,
    idadeMaxima: 90,
    categoria: 'dinheiro',
    peso: 40,
    opcoes: [
      {
        id: 'opt_torcer_sorte',
        texto: 'Cruzar os dedos e esperar o resultado da apuração',
        descricaoResultado: 'Inacreditável! Seu nome foi sorteado para um vale-compras de R$ 3.000!',
        consequencias: {
          stats: { felicidade: 25 },
          dinheiro: 3000,
          hiddenStats: { reputacao: 10 }
        }
      }
    ]
  },
  {
    id: 'rnd_assalto_relampago',
    titulo: 'Abordagem Suspeita no Ponto de Ônibus',
    descricao: 'Voltando à noite para casa, dois rapazes em uma moto desaceleram perto de você na calçada escura.',
    idadeMinima: 16,
    idadeMaxima: 80,
    categoria: 'cotidiano',
    peso: 60,
    opcoes: [
      {
        id: 'opt_entrar_padaria',
        texto: 'Apertar o passo e entrar rápido na padaria iluminada da esquina',
        descricaoResultado: 'Sua percepção aguçada te salvou! A moto seguiu reto sem parar.',
        consequencias: {
          stats: { felicidade: 12, saude: 5 },
          hiddenStats: { disciplina: 10, estresse: -10 }
        }
      },
      {
        id: 'opt_entregar_celular_velho',
        texto: 'Manter a calma e entregar o celular do ladrão sem reagir',
        descricaoResultado: 'Eles levaram o celular, mas você saiu são e salvo sem nenhum ferimento.',
        consequencias: {
          stats: { felicidade: -15 },
          dinheiro: -800,
          hiddenStats: { estresse: 25 }
        }
      }
    ]
  }
];
