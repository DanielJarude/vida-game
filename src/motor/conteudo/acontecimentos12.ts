/**
 * REWORK 12 — os acontecimentos do patrimônio: o inquilino que parou de pagar, a empresa no vermelho, o gestor que
 * não presta conta, a proposta de compra, o carro guardado longe, a doação ao museu, o filhote do programa de
 * conservação. Regras da casa (REWORK 10/11.5): sem sorteio em `quando` (o estado decide se cabe; o peso e o
 * intervalo decidem quanto), nenhuma resposta cosmética, a fila do ano decide quando a decisão abre.
 */

import type { Conteudo, Ctx } from './base';
import type { Empresa, Imovel, Veiculo, Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { dinheiro as fmt } from '../texto';
import { anoDe } from '../tempo';
import { municipio } from '../dados/lugares';
import { modeloVeiculo } from '../dados/bens';
import { empresasAtivas, decidirEmpresa, disponibilidadeEmpresa, valorDaParte } from '../sistemas/empresas';
import { guardadoLonge, textoVeiculo, valorDeVenda } from '../sistemas/veiculos';

const imovelComCalote = (v: Vida) => v.financas.bens.find((b): b is Imovel => b.tipo === 'imovel' && !!b.alugadoPor && (b.calote ?? 0) > 0);
const empresaEmCrise = (v: Vida) => empresasAtivas(v).find(e => e.papel !== 'investidor' && e.estado === 'em_crise' && e.anosNoVermelho >= 1);
const empresaDeGestorRuim = (v: Vida) => empresasAtivas(v).find(e => e.estado === 'operando' && e.gestao.quem === 'contratada' && (e.gestao.competencia ?? 50) < 38 && v.t - e.gestao.tInicio >= 24);
const empresaCobicada = (v: Vida) => empresasAtivas(v).find(e => e.papel !== 'investidor' && e.estado === 'operando' && (e.historico ?? []).slice(-3).length === 3 && (e.historico ?? []).slice(-3).every(x => x > 0) && valorDaParte(e) > 0);
const guardadoHaTempo = (v: Vida) => v.financas.bens.find((b): b is Veiculo => b.tipo === 'veiculo' && guardadoLonge(v, b) && (b.historia ?? []).some(h => /Ficou guardad/.test(h.texto) && v.t - h.t >= 18));
const classicoCobicado = (v: Vida) => v.financas.bens.find((b): b is Veiculo => b.tipo === 'veiculo' && modeloVeiculo(b.modeloId).segmento === 'classico' && b.estado >= 70 && v.t - b.tCompra >= 24);
const museu = (v: Vida) => empresasAtivas(v).find(e => !!e.acervo && e.estado === 'operando' && e.papel !== 'investidor' && e.reputacao >= 45);
const zooQueConserva = (v: Vida) => empresasAtivas(v).find(e => !!e.zoo?.conservacao && e.estado === 'operando' && e.zoo.bemEstar >= 65);

/** A proposta de compra (o prêmio sobre a avaliação): estável no ano, sem gastar o gerador do ano. */
const premio = (v: Vida, e: Empresa) => 1.08 + rngDe(v.id, e.id, 'proposta', anoDe(v.t)).next() * 0.22;
const proposta = (v: Vida, e: Empresa) => Math.round(valorDaParte(e) * premio(v, e) / 1000) * 1000;
const ofertaPeloClassico = (v: Vida, b: Veiculo) => Math.round(b.valor * (1.1 + rngDe(v.id, b.id, 'classico', anoDe(v.t)).next() * 0.2) / 1000) * 1000;

function decidir(c: Ctx, e: Empresa, d: Parameters<typeof decidirEmpresa>[2]): string {
  return disponibilidadeEmpresa(c.v, e, d).ok ? decidirEmpresa(c.v, e, d) : '';
}

export const ACONTECIMENTOS_12: Conteudo[] = [
  {
    // O inquilino parou de pagar (o calote que a imobiliária não segurou, ou o de quem administra sozinho).
    id: 'pat12_calote', tipo: 'decisao', idade: [18, 100], tema: 'dinheiro', prioritario: true, prioridade: 4, repetir: 0,
    quando: c => !!imovelComCalote(c.v),
    titulo: 'O inquilino parou de pagar',
    texto: c => { const b = imovelComCalote(c.v)!; return `O aluguel ${b.nome.startsWith('casa') ? 'da casa' : `do ${b.nome}`} ${b.bairro ?? ''} não entra há ${b.calote! >= 2 ? `${b.calote} meses` : 'um mês'}. O inquilino promete, some, promete de novo. O imposto e o condomínio, esses, chegam em dia.`.replace('  ', ' '); },
    opcoes: [
      {
        id: 'negociar', texto: 'Negociar: um acordo para quitar aos poucos', comportamento: { empatia: 1 },
        consequencia: () => 'Recupera parte; o contrato segue.',
        resolver: c => {
          const b = imovelComCalote(c.v)!;
          const meses = b.calote ?? 1;
          b.calote = undefined;
          c.v.financas.conta += Math.round(b.alugadoPor! * meses * 0.5);
          return { texto: `Fecharam um acordo: metade do atrasado em parcelas, o aluguel volta a entrar. O resto, você deixou para lá.`, memoria: `O inquilino ${b.nome.startsWith('casa') ? 'da casa' : 'do apartamento'} atrasou; fecharam um acordo.`, relevancia: 'cotidiano' };
        }
      },
      {
        id: 'despejo', texto: 'Entrar com a ação de despejo', comportamento: { independencia: 1 },
        consequencia: c => `Advogado e custas (uns ${fmt(Math.round((imovelComCalote(c.v)?.alugadoPor ?? 1000) * 2))}); meses de imóvel parado.`,
        resolver: c => {
          const b = imovelComCalote(c.v)!;
          const custo = Math.round(b.alugadoPor! * 2);
          c.v.financas.conta -= custo + b.alugadoPor! * 3;
          b.calote = undefined;
          b.estado = clamp(b.estado - 8);
          (b.historia ??= []).push({ t: c.v.t, texto: 'Despejo do inquilino que não pagava.' });
          c.v.mente.estresse = clamp(c.v.mente.estresse + 4);
          return { texto: `Meses de cartório e audiência. O imóvel voltou — com as paredes marcadas e ${fmt(custo)} de advogado e custas. Outro inquilino vem depois da pintura.`, memoria: `Despejou o inquilino que não pagava ${b.nome.startsWith('casa') ? 'a casa' : 'o apartamento'}.`, relevancia: 'biografia', tom: 'ruim' };
        }
      },
      {
        id: 'esperar', texto: 'Esperar mais um pouco',
        consequencia: () => 'O atrasado cresce; o calote pode virar prejuízo inteiro.',
        resolver: c => {
          const b = imovelComCalote(c.v)!;
          b.calote = (b.calote ?? 1) + 3;
          if (b.calote >= 7) { b.calote = undefined; b.alugadoPor = undefined; b.estado = clamp(b.estado - 12); return { texto: 'Esperou demais: o inquilino foi embora de madrugada, devendo tudo. O imóvel ficou vazio — e precisando de reforma.', memoria: 'Levou um calote do inquilino.', relevancia: 'biografia', tom: 'ruim' }; }
          return { texto: 'Mais uns meses de promessa. O aluguel não entra; o imposto, sim.', memoria: null };
        }
      }
    ]
  },
  {
    // A empresa no vermelho: a crise pede decisão (pôr dinheiro, cortar, trocar quem toca, vender, fechar) — ou esperar.
    id: 'pat12_empresa_crise', tipo: 'decisao', idade: [18, 100], tema: 'trabalho', prioritario: true, prioridade: 5, repetir: 1,
    quando: c => !!empresaEmCrise(c.v),
    titulo: c => `${empresaEmCrise(c.v)!.nome} no vermelho`,
    texto: c => { const e = empresaEmCrise(c.v)!; const u = e.ultimo; return `O caixa ${e.nome.startsWith('Clínica') || e.nome.startsWith('Academia') || e.nome.startsWith('Loja') ? 'da' : 'do'} ${e.nome} fechou o ano negativo${u ? ` (${fmt(u.resultado)} no ano)` : ''}${e.anosNoVermelho >= 2 ? `, pelo ${e.anosNoVermelho}º ano seguido` : ''}. O banco já cobra juros do cheque especial da empresa. ${e.anosNoVermelho >= 2 ? 'Mais um ano assim e a falência bate à porta.' : 'Um ano ruim não quebra ninguém — dois começam a quebrar.'}`; },
    opcoes: [
      { id: 'aportar', texto: 'Pôr dinheiro seu no caixa', disponivel: c => { const e = empresaEmCrise(c.v)!; const d = disponibilidadeEmpresa(c.v, e, 'aportar'); return d.ok || d.motivo || false; },
        resolver: c => { const t = decidir(c, empresaEmCrise(c.v)!, 'aportar'); return { texto: t, memoria: `Pôs dinheiro do próprio bolso para segurar ${empresaEmCrise(c.v)?.nome ?? 'a empresa'}.`, relevancia: 'cotidiano' }; } },
      { id: 'cortar', texto: 'Cortar custos (equipe menor)', disponivel: c => { const d = disponibilidadeEmpresa(c.v, empresaEmCrise(c.v)!, 'cortar'); return d.ok || d.motivo || false; },
        resolver: c => ({ texto: decidir(c, empresaEmCrise(c.v)!, 'cortar'), memoria: null }) },
      { id: 'gestor', texto: c => (empresaEmCrise(c.v)!.gestao.quem === 'propria' ? 'Contratar alguém para tocar' : 'Trocar o gestor'),
        resolver: c => ({ texto: decidir(c, empresaEmCrise(c.v)!, 'contratar_gestor'), memoria: null }) },
      { id: 'vender', texto: 'Vender enquanto alguém paga alguma coisa', disponivel: c => { const d = disponibilidadeEmpresa(c.v, empresaEmCrise(c.v)!, 'vender'); return d.ok || d.motivo || false; },
        resolver: c => { const n = empresaEmCrise(c.v)!.nome; return { texto: decidir(c, empresaEmCrise(c.v)!, 'vender'), memoria: `Vendeu ${n} em plena crise.`, relevancia: 'biografia' }; } },
      { id: 'esperar', texto: 'Segurar e esperar o ano que vem', consequencia: () => 'Sem custo agora; o vermelho, se continuar, cresce com os juros.',
        resolver: () => ({ texto: 'Fica como está. O ano que vem dirá.', memoria: null }) }
    ]
  },
  {
    // O gestor que não presta conta: os números não fecham (só para quem contratou mal e esperou dois anos).
    id: 'pat12_gestor', tipo: 'decisao', idade: [18, 100], tema: 'trabalho', repetir: 4, peso: 3,
    quando: c => !!empresaDeGestorRuim(c.v),
    titulo: 'Os números não fecham',
    texto: c => { const e = empresaDeGestorRuim(c.v)!; return `O contador de ${e.nome} ligou: notas sem lastro, fornecedor pago duas vezes, um estoque que some. ${e.gestao.nome} tem explicação para tudo — e nenhuma convence.`; },
    opcoes: [
      { id: 'demitir', texto: 'Demitir e contratar outra pessoa', comportamento: { independencia: 1 },
        resolver: c => { const e = empresaDeGestorRuim(c.v)!; const perda = Math.round(Math.max(20000, (e.ultimo?.receita ?? 0) * 0.03) / 1000) * 1000; e.caixa -= perda; const t = decidirEmpresa(c.v, e, 'contratar_gestor'); return { texto: `Auditoria: ${fmt(perda)} perdidos. ${t}`, memoria: `Demitiu o gestor de ${e.nome} depois de achar o rombo.`, relevancia: 'biografia', tom: 'ruim' }; } },
      { id: 'assumir', texto: c => `Assumir você mesm${c.g('o', 'a')}`, disponivel: c => { const d = disponibilidadeEmpresa(c.v, empresaDeGestorRuim(c.v)!, 'assumir'); return d.ok || d.motivo || false; },
        resolver: c => { const e = empresaDeGestorRuim(c.v)!; const t = decidirEmpresa(c.v, e, 'assumir'); return { texto: t, memoria: `Assumiu a gestão de ${e.nome}.`, relevancia: 'biografia' }; } },
      { id: 'confiar', texto: 'Dar mais uma chance', consequencia: () => 'Se for o que parece, o rombo continua.',
        resolver: c => { const e = empresaDeGestorRuim(c.v)!; e.caixa -= Math.round(Math.max(15000, (e.ultimo?.receita ?? 0) * 0.04) / 1000) * 1000; e.gestao.tInicio = c.v.t; return { texto: `${e.gestao.nome} agradeceu. O caixa seguiu minguando.`, memoria: null, tom: 'ruim' }; } }
    ]
  },
  {
    // A proposta: alguém quer comprar a empresa que vai bem (um prêmio sobre o que ela vale — e o fim da história dela com você).
    id: 'pat12_proposta', tipo: 'decisao', idade: [20, 100], tema: 'trabalho', repetir: 6, peso: 2,
    quando: c => !!empresaCobicada(c.v),
    titulo: 'Uma proposta pela empresa',
    texto: c => { const e = empresaCobicada(c.v)!; return `Um grupo do ramo quer comprar ${e.parte < 1 ? 'a sua parte d' : ''}${e.nome}: ${fmt(proposta(c.v, e))}, à vista — uns ${Math.round((premio(c.v, e) - 1) * 100)}% acima do que ela vale hoje. Os números dos últimos anos são bons; os dos próximos, ninguém sabe.`; },
    opcoes: [
      { id: 'vender', texto: 'Vender', resolver: c => {
        const e = empresaCobicada(c.v)!;
        const valor = proposta(c.v, e);
        c.v.financas.conta += valor;
        e.estado = 'encerrada'; e.tFim = c.v.t;
        c.v.financas.empresas = (c.v.financas.empresas ?? []).filter(x => x.id !== e.id);
        return { texto: `Assinou. ${fmt(valor)} na conta — e ${e.nome} segue com outros donos.`, memoria: `Vendeu ${e.nome} por ${fmt(valor)}.`, relevancia: 'marco', tom: 'bom' };
      } },
      { id: 'recusar', texto: 'Recusar: ela vale mais nas suas mãos', comportamento: { independencia: 1 }, resolver: () => ({ texto: 'Recusou. A empresa continua sua — com o risco e o que vier.', memoria: null }) }
    ]
  },
  {
    // O veículo guardado na cidade (ou no país) de antes: a guarda custa todo mês, e ele envelhece parado.
    id: 'pat12_guardado', tipo: 'decisao', idade: [18, 100], tema: 'dinheiro', repetir: 5, peso: 3,
    quando: c => !!guardadoHaTempo(c.v),
    titulo: c => `${(textoVeiculo(guardadoHaTempo(c.v)!).replace(/^(o|a) /, '')).replace(/^./, s => s.toUpperCase())}, guardad${textoVeiculo(guardadoHaTempo(c.v)!).startsWith('a ') ? 'a' : 'o'} longe`,
    texto: c => { const b = guardadoHaTempo(c.v)!; return `${textoVeiculo(b).replace(/^./, s => s.toUpperCase())} continua em ${municipio(b.local!).nome}: seguro e guarda todo mês, a bateria arriando, o valor caindo devagar. Vale a pena manter?`; },
    opcoes: [
      { id: 'vender', texto: c => `Vender de longe (uns ${fmt(Math.max(0, valorDeVenda(guardadoHaTempo(c.v)!, c.v) - (c.v.financas.dividas.find(d => d.bemId === guardadoHaTempo(c.v)!.id)?.saldo ?? 0)))})`,
        disponivel: c => { const b = guardadoHaTempo(c.v)!; const d = c.v.financas.dividas.find(x => x.bemId === b.id); return !d || d.saldo <= valorDeVenda(b, c.v) || 'A venda não cobre o financiamento.'; },
        resolver: c => {
          const b = guardadoHaTempo(c.v)!;
          const d = c.v.financas.dividas.find(x => x.bemId === b.id);
          const liquido = valorDeVenda(b, c.v) - (d?.saldo ?? 0);
          c.v.financas.conta += liquido;
          c.v.financas.bens = c.v.financas.bens.filter(x => x.id !== b.id);
          c.v.financas.dividas = c.v.financas.dividas.filter(x => x.bemId !== b.id);
          return { texto: `Vendid${textoVeiculo(b).startsWith('a ') ? 'a' : 'o'} por procuração: ${fmt(liquido)} livres.`, memoria: `Vendeu de longe ${textoVeiculo(b)} que tinha ficado em ${municipio(b.local!).nome}.`, relevancia: 'cotidiano' };
        } },
      { id: 'manter', texto: 'Manter guardado', resolver: c => { const b = guardadoHaTempo(c.v)!; (b.historia ??= []).push({ t: c.v.t, texto: `Ficou guardad${textoVeiculo(b).startsWith('a ') ? 'a' : 'o'} (decisão de manter).` }); b.historia = b.historia.filter(h => !/Ficou guardad.*mudança/.test(h.texto) || c.v.t - h.t < 18); return { texto: 'Fica onde está. Dá para mandar buscar quando quiser (em Patrimônio → Garagem).', memoria: null }; } }
    ]
  },
  {
    // O colecionador que quer o seu clássico (o valor do mercado não é o que um apaixonado paga — às vezes paga mais).
    id: 'pat12_classico', tipo: 'decisao', idade: [25, 100], tema: 'dinheiro', repetir: 5, peso: 1.5,
    quando: c => !!classicoCobicado(c.v),
    titulo: 'Um colecionador bate à porta',
    texto: c => { const b = classicoCobicado(c.v)!; return `Um colecionador viu ${textoVeiculo(b)} num encontro de carros antigos e não esqueceu: oferece ${fmt(ofertaPeloClassico(c.v, b))}. É acima do que o mercado paga hoje — e é o seu carro.`; },
    opcoes: [
      { id: 'vender', texto: 'Vender', disponivel: c => !c.v.financas.dividas.some(d => d.bemId === classicoCobicado(c.v)!.id) || 'Ainda está financiado.',
        resolver: c => { const b = classicoCobicado(c.v)!; const valor = ofertaPeloClassico(c.v, b); c.v.financas.conta += valor; c.v.financas.bens = c.v.financas.bens.filter(x => x.id !== b.id); return { texto: `Apertaram a mão. ${fmt(valor)} — e ${textoVeiculo(b)} foi embora num caminhão fechado.`, memoria: `Vendeu ${textoVeiculo(b)} para um colecionador.`, relevancia: 'biografia', tom: 'bom' }; } },
      { id: 'recusar', texto: 'Não está à venda', resolver: c => { c.v.mente.felicidade = clamp(c.v.mente.felicidade + 1); return { texto: 'Não está à venda. Ele deixou o cartão — "se mudar de ideia".', memoria: null }; } }
    ]
  },
  {
    // A doação ao museu: uma família oferece uma peça com uma condição (o nome dela na sala).
    id: 'pat12_doacao_museu', tipo: 'decisao', idade: [25, 100], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => !!museu(c.v),
    titulo: 'Uma doação para o museu',
    texto: c => `A família de um colecionador que morreu quer doar uma parte do acervo dele ao ${museu(c.v)!.nome}. A condição: uma sala com o nome dele, e a peça sempre exposta.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar', resolver: c => { const e = museu(c.v)!; const valor = Math.round(e.acervo!.valor * 0.08 / 1000) * 1000; e.acervo!.valor += valor; e.acervo!.pecas += 14; e.reputacao = clamp(e.reputacao + 4); return { texto: `Catorze peças novas no acervo (uns ${fmt(valor)}) e uma sala com nome de gente. O museu ganhou — e a conservação também cresceu.`, memoria: `${e.nome} recebeu uma doação de acervo.`, relevancia: 'biografia', tom: 'bom' }; } },
      { id: 'recusar', texto: 'Recusar: o museu escolhe o que expõe', resolver: () => ({ texto: 'Recusou com educação. A família procurou outro museu.', memoria: null }) }
    ]
  },
  {
    // O filhote do programa de conservação: o zoológico que cuida bem vira notícia boa.
    id: 'pat12_zoo_filhote', tipo: 'acontecimento', idade: [18, 100], tema: 'trabalho', repetir: 3, peso: 2,
    quando: c => !!zooQueConserva(c.v),
    narrar: c => {
      const e = zooQueConserva(c.v)!;
      const especie = ['um filhote de mico-leão-dourado', 'dois filhotes de onça-pintada', 'um filhote de anta', 'um filhote de arara-azul', 'um filhote de lobo-guará'][Math.floor(rngDe(c.v.id, e.id, anoDe(c.v.t)).next() * 5)];
      return { texto: `Nasceu ${especie} no ${e.nome}, dentro do programa de conservação: fila no recinto, foto no jornal, a equipe veterinária de plantão.`, relevancia: 'biografia', tom: 'bom', efeito: () => { e.reputacao = clamp(e.reputacao + 5); } };
    }
  }
];
