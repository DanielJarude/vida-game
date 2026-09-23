/**
 * Primeira infância (3–5): o mundo vai ficando maior que a casa.
 * Acontecimentos são fatos (quem levou, aonde, o que houve); a reação da
 * criança só entra quando é dela a escolha.
 */

import type { Conteudo } from './base';
import * as P from './papeis';
import { feliz, gp, prox, saude } from './efeitos';
import { municipio } from '../dados/lugares';

const litoral = (id: string) => ['AL', 'BA', 'CE', 'ES', 'MA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RS', 'SC', 'SE', 'SP', 'PA', 'AP'].includes(municipio(id).uf);

export const PRIMEIROS: Conteudo[] = [
  {
    id: 'pri_praia', tipo: 'acontecimento', idade: [3, 6], tema: 'infancia',
    papeis: { quem: P.genitorEmCasa },
    quando: c => litoral(c.v.moradia.municipioId),
    narrar: c => ({
      texto: `A primeira vez na praia foi num domingo de sol, com isopor, farofa e ${c.p.quem.nome} segurando sua mão na beira da água.`,
      relevancia: 'biografia', tom: 'bom', efeito: () => prox(c, 'quem', 4)
    })
  },
  {
    id: 'pri_casa_avo', tipo: 'acontecimento', idade: [3, 6], tema: 'familia',
    papeis: { avo: P.avo },
    quando: c => !c.v.vinculos[c.p.avo.id].convivio.includes('casa'),
    narrar: c => ({
      texto: `Passou uma semana inteira na casa ${gp(c, 'avo', 'do avô', 'da avó')} ${c.p.avo.nome}${c.p.avo.municipioId !== c.v.moradia.municipioId ? ', em outra cidade' : ''}: café com pão na chapa, novela à noite, cama grande.`,
      relevancia: 'biografia', efeito: () => prox(c, 'avo', 12), lembrar: ['avo', 'Uma semana na casa dos avós quando você era pequeno.'.replace('pequeno', c.g('pequeno', 'pequena', 'pequene'))]
    })
  },
  {
    id: 'pri_circo', tipo: 'acontecimento', idade: [3, 7], tema: 'lazer',
    papeis: { quem: P.qualquer(P.genitorEmCasa, P.avoPerto, P.tioOuPrimo) },
    quando: c => municipio(c.v.moradia.municipioId).perfil !== 'metropole',
    narrar: c => ({
      texto: `Um circo armou a lona num terreno baldio da cidade, e ${c.p.quem.nome} levou você numa noite de sábado. Tinha palhaço, mágico e cheiro de pipoca.`,
      relevancia: 'cotidiano', efeito: () => prox(c, 'quem', 3)
    })
  },
  {
    id: 'pri_hospital_braco', tipo: 'acontecimento', idade: [3, 9], tema: 'saude',
    narrar: c => ({
      texto: `Uma queda do trepa-trepa terminou com o braço engessado por um mês. O gesso voltou para casa cheio de assinaturas.`,
      relevancia: 'biografia', efeito: () => saude(c, -2)
    })
  },
  {
    id: 'pri_irmao_bebe', tipo: 'decisao', idade: [3, 7], tema: 'familia',
    papeis: { bebe: P.comIdade(P.irmaoEmCasa, 0, 1), adulto: P.genitorEmCasa },
    titulo: c => `${c.p.bebe.nome}`,
    texto: c => `${c.p.bebe.nome} chegou em casa, pequen${gp(c, 'bebe', 'o', 'a', 'e')} e barulhent${gp(c, 'bebe', 'o', 'a', 'e')}, e todo mundo agora só olha para o berço. ${c.p.adulto.nome} pergunta se você quer ajudar a dar banho.`,
    opcoes: [
      { id: 'ajudar', texto: 'Ajudar', comportamento: { familia: 1, empatia: 1 },
        resolver: c => ({ texto: `Você segurou a toalha com toda a seriedade do mundo.`, memoria: `Ajudava a dar banho em ${c.p.bebe.nome} quando ${gp(c, 'bebe', 'ele', 'ela', 'elu')} chegou em casa.`, efeito: () => { prox(c, 'bebe', 12); prox(c, 'adulto', 4); } }) },
      { id: 'nao', texto: 'Ir brincar', resolver: () => ({ texto: 'Você foi brincar no quarto, de porta fechada.', memoria: null }) }
    ]
  },
  {
    id: 'pri_mentira_doce', tipo: 'decisao', idade: [3, 6], tema: 'infancia',
    papeis: { adulto: P.qualquer(P.genitorEmCasa, P.avoPerto) },
    titulo: 'O pote de doce',
    texto: c => `${c.p.adulto.nome} deixou um pote de doce de leite em cima da mesa e disse "é para depois do almoço". Não tem ninguém na cozinha.`,
    opcoes: [
      { id: 'esperar', texto: 'Esperar o almoço', comportamento: { disciplina: 1 }, resolver: () => ({ texto: 'Depois do almoço, a colherada teve outro gosto.', memoria: null }) },
      { id: 'pegar', texto: 'Pegar uma colherada escondido', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: c.r.chance(0.6) ? `A cara lambuzada entregou tudo. ${c.p.adulto.nome} riu antes de dar bronca.` : 'Ninguém percebeu. O pote baixou um dedo.', memoria: null }) }
    ]
  },
  {
    id: 'pri_escolinha_amigo', tipo: 'acontecimento', idade: [4, 5], tema: 'amizade',
    papeis: { colega: P.genteDe('escola') },
    narrar: c => ({
      texto: `Na pré-escola, a professora juntou você e ${c.p.colega.nome} para pintar o mesmo painel da festa da primavera.`,
      relevancia: 'cotidiano', efeito: () => prox(c, 'colega', 10)
    })
  },
  {
    id: 'pri_perdido', tipo: 'acontecimento', idade: [3, 6], tema: 'infancia',
    papeis: { quem: P.genitorEmCasa },
    quando: c => ['metropole', 'metropolitana', 'capital'].includes(municipio(c.v.moradia.municipioId).perfil),
    narrar: c => ({
      texto: `Num sábado de supermercado cheio, você sumiu da vista de ${c.p.quem.nome} por dez minutos. Chamaram seu nome no alto-falante. ${c.p.quem.nome} conta essa história com as mãos tremendo até hoje.`,
      relevancia: 'biografia'
    })
  },
  {
    id: 'pri_foto_estudio', tipo: 'acontecimento', idade: [3, 5], tema: 'familia',
    papeis: { quem: P.genitorEmCasa },
    quando: c => c.v.origem.classe !== 'vulneravel',
    narrar: c => ({
      texto: `${c.p.quem.nome} pagou uma sessão de fotos num estúdio do centro. A foto emoldurada ficou na parede da sala por anos.`,
      relevancia: 'cotidiano'
    })
  },
  {
    id: 'pri_natal', tipo: 'acontecimento', idade: [3, 7], tema: 'familia',
    papeis: { quem: P.qualquer(P.genitorEmCasa, P.avo, P.tioOuPrimo) },
    narrar: c => ({
      texto: c.v.origem.classe === 'vulneravel'
        ? `No Natal, ${c.p.quem.nome} conseguiu um presente numa campanha da igreja do bairro: uma boneca de pano e um carrinho, embrulhados em jornal.`
        : `No Natal, ${c.p.quem.nome} se vestiu de Papai Noel com barba de algodão. Todo mundo fingiu não reconhecer.`,
      relevancia: 'cotidiano', tom: 'bom', efeito: () => { feliz(c, 3); prox(c, 'quem', 4); }
    })
  }
];
