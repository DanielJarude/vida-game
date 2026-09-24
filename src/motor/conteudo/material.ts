/**
 * Vida material: as decisões que o dinheiro, a casa, os bens e os bichos
 * pedem. Cada uma nasce de um ESTADO (a parcela atrasou, o carro parou, o
 * bicho adoeceu) — nunca é um "imposto aleatório".
 */

import type { Conteudo, Ctx } from './base';
import type { Veiculo } from '../tipos';
import { vinculosVivos, idadePessoa, lembrarCom } from '../nucleo';
import { dinheiro as fmt, flex } from '../texto';
import { estresse } from './efeitos';
import { podeRenegociarFinanciamento, renegociarFinanciamento } from '../sistemas/obrigacoes';
import { disponivel, pagar } from '../sistemas/dinheiro';
import { valorDeVenda, textoVeiculo } from '../sistemas/veiculos';
import { valorDeVendaImovel } from '../sistemas/imoveis';
import { aluguelDe } from '../sistemas/mercado';
import { modeloMoradia } from '../dados/bens';
import { adotarPet, custoDoTratamento, infoPet, podeTerPet, seusPets } from '../sistemas/pets';
import { moraComFamiliaDeOrigem } from '../sistemas/domicilio';
import { nomeDePet } from '../sistemas/mercado';

const financiamentoAtrasado = (c: Ctx) => c.v.financas.dividas.filter(d => (d.tipo === 'financiamento_imovel' || d.tipo === 'financiamento_veiculo') && (d.atraso ?? 0) >= 3).sort((a, b) => (b.atraso ?? 0) - (a.atraso ?? 0))[0];

const carroParado = (c: Ctx) => c.v.financas.bens.find((b): b is Veiculo => b.tipo === 'veiculo' && !!b.problema && b.problema.gravidade === 3 && b.problema.desde === c.v.t && !b.parado);

const petMuitoDoente = (c: Ctx) => vinculosVivos(c.v).find(x => x.p.especie && x.vin.convivio.includes('casa') && x.p.pet?.tutor === 'eu' && x.p.pet.doenca?.gravidade === 3 && !x.p.pet.doenca.tratando && c.v.fatos[`paliativo_${x.p.id}`] === undefined)?.p;

export const MATERIAL: Conteudo[] = [
  {
    id: 'mat_atraso', tipo: 'decisao', idade: [18, 110], tema: 'dinheiro', prioritario: true, prioridade: 3, repetir: 1,
    quando: c => !!financiamentoAtrasado(c),
    titulo: c => (financiamentoAtrasado(c)!.tipo === 'financiamento_imovel' ? 'As parcelas da casa atrasaram' : 'As parcelas do carro atrasaram'),
    texto: c => {
      const d = financiamentoAtrasado(c)!;
      const casa = d.tipo === 'financiamento_imovel';
      return `Já são ${Math.round(d.atraso!)} meses sem conseguir pagar a parcela de ${fmt(d.parcela)}. O banco ligou três vezes. ${casa ? 'Se passar de um ano, eles retomam o imóvel.' : 'Mais uns meses e eles vêm buscar o carro.'}`;
    },
    opcoes: [
      { id: 'renegociar', texto: 'Renegociar: parcela menor, mais anos pagando',
        disponivel: c => { const d = podeRenegociarFinanciamento(c.v, financiamentoAtrasado(c)); return d.ok ? true : d.motivo!; },
        resolver: c => ({ texto: renegociarFinanciamento(c.v, financiamentoAtrasado(c)!), memoria: null }) },
      { id: 'vender', texto: c => (financiamentoAtrasado(c)!.tipo === 'financiamento_imovel' ? 'Vender antes de perder' : 'Vender o carro e quitar'),
        resolver: c => {
          const d = financiamentoAtrasado(c)!;
          const b = c.v.financas.bens.find(x => x.id === d.bemId);
          const bruto = b ? (b.tipo === 'veiculo' ? valorDeVenda(b) : valorDeVendaImovel(b)) : 0;
          const liquido = bruto - d.saldo;
          c.v.financas.bens = c.v.financas.bens.filter(x => x.id !== d.bemId);
          c.v.financas.dividas = c.v.financas.dividas.filter(x => x.id !== d.id);
          c.v.financas.conta += liquido;
          const morava = c.v.moradia.imovelId === d.bemId;
          if (morava) {
            const m = modeloMoradia(b?.modeloId ?? 'kitnet');
            const menor = modeloMoradia(m.quartos >= 3 ? 'apto_2q' : m.quartos >= 2 ? 'apto_1q' : 'kitnet');
            c.v.moradia = { tipo: 'aluguel', municipioId: c.v.moradia.municipioId, modeloId: menor.id, aluguel: aluguelDe(c.v, menor, c.v.moradia.municipioId), padrao: menor.padrao, tInicio: c.v.t, aceitaPet: true };
          }
          return { texto: liquido >= 0 ? `Vendeu. Pagou o banco e sobraram ${fmt(liquido)}.` : `Vendeu, mas não cobriu tudo: ficaram ${fmt(-liquido)} para acertar.`, memoria: d.tipo === 'financiamento_imovel' ? 'Vendeu a casa para não perdê-la para o banco.' : 'Vendeu o carro para quitar o financiamento atrasado.', relevancia: d.tipo === 'financiamento_imovel' ? 'marco' : 'biografia', tom: 'ruim' };
        } },
      { id: 'apertar', texto: 'Cortar tudo o que der e tentar pôr em dia', comportamento: { disciplina: 1 },
        resolver: c => ({ texto: 'Padrão de vida no mínimo, cada real contado. O atraso continua — mas agora há um plano.', memoria: null, efeito: () => { c.v.financas.estilo = 'apertado'; estresse(c, 4); } }) }
    ]
  },
  {
    id: 'mat_carro_parou', tipo: 'decisao', idade: [18, 110], tema: 'dinheiro', prioritario: true, prioridade: 2, repetir: 2,
    quando: c => !!carroParado(c),
    titulo: c => `${capital(textoVeiculo(carroParado(c)!))} parou`,
    texto: c => {
      const b = carroParado(c)!;
      const p = b.problema!;
      return `Na oficina, o mecânico limpou as mãos na estopa antes de dar a notícia: ${p.texto}. O conserto sai por ${fmt(p.custo)}. ${capital(textoVeiculo(b))} vale uns ${fmt(b.valor)}.`;
    },
    opcoes: [
      { id: 'consertar', texto: c => `Consertar (${fmt(carroParado(c)!.problema!.custo)})`,
        disponivel: c => (disponivel(c.v) >= carroParado(c)!.problema!.custo ? true : 'Não há esse dinheiro.'),
        resolver: c => { const b = carroParado(c)!; const p = b.problema!; pagar(c.v, p.custo); b.problema = undefined; b.estado = Math.min(b.usado ? 92 : 100, b.estado + 30); (b.historia ??= []).push({ t: c.v.t, texto: `Consertou ${p.texto} (${fmt(p.custo)}).` }); return { texto: 'Duas semanas depois, voltou a rodar.', memoria: null }; } },
      { id: 'vender', texto: 'Vender como está', resolver: c => {
        const b = carroParado(c)!;
        const d = c.v.financas.dividas.find(x => x.bemId === b.id);
        const liquido = valorDeVenda(b) - (d?.saldo ?? 0);
        c.v.financas.bens = c.v.financas.bens.filter(x => x.id !== b.id);
        c.v.financas.dividas = c.v.financas.dividas.filter(x => x.bemId !== b.id);
        c.v.financas.conta += liquido;
        return { texto: `Vendeu para um mecânico por ${fmt(Math.max(0, valorDeVenda(b)))}.`, memoria: `Vendeu ${textoVeiculo(b)} quebrado, depois de ${Math.max(1, Math.round((c.v.t - b.tCompra) / 12))} anos.`, relevancia: 'cotidiano' };
      } },
      { id: 'parar', texto: 'Deixar parado por enquanto', resolver: c => { const b = carroParado(c)!; b.parado = true; return { texto: 'Ficou na garagem. Sem conserto, sem condução — e sem gastar com ele, por ora.', memoria: null }; } }
    ]
  },
  {
    id: 'mat_pet_doente', tipo: 'decisao', idade: [18, 110], tema: 'casa', prioritario: true, prioridade: 2, repetir: 1,
    quando: c => !!petMuitoDoente(c),
    titulo: c => `${petMuitoDoente(c)!.nome} está muito doente`,
    texto: c => {
      const p = petMuitoDoente(c)!;
      const d = infoPet(c.v, p).doenca!;
      const ip = idadePessoa(c.v, p);
      return `O veterinário explicou devagar: ${d.nome}${ip >= infoPet(c.v, p).vidaMax - 3 ? `, e ${flex(p.genero, 'ele', 'ela')} já tem ${ip} anos` : ''}. ${d.tratavel ? `Há tratamento, sem garantia — uns ${fmt(custoDoTratamento(c.v, p, true))}.` : 'Não tem cura; dá para dar tempo e conforto.'}`;
    },
    opcoes: [
      { id: 'tratar', texto: c => `Tratar (${fmt(custoDoTratamento(c.v, petMuitoDoente(c)!, true))})`,
        disponivel: c => (disponivel(c.v) >= custoDoTratamento(c.v, petMuitoDoente(c)!, true) ? true : 'Não há esse dinheiro.'),
        resolver: c => {
          const p = petMuitoDoente(c)!;
          const info = infoPet(c.v, p);
          const d = info.doenca!;
          pagar(c.v, custoDoTratamento(c.v, p, true));
          info.tVeterinario = c.v.t;
          const sarou = d.tratavel && c.r.chance(0.6);
          if (sarou) { info.doenca = undefined; lembrarCom(c.v, p.id, `Sobreviveu a ${d.nome}.`, 'apoio', 2); }
          else d.tratando = true;
          return { texto: sarou ? `Semanas de remédio e retorno. ${p.nome} se recuperou.` : `O tratamento começou. ${p.nome} tem dias bons e dias ruins.`, memoria: sarou ? `Pagou o tratamento de ${p.nome}, que se recuperou.` : null };
        } },
      { id: 'conforto', texto: 'Cuidar para que não sofra', comportamento: { empatia: 1 },
        resolver: c => { const p = petMuitoDoente(c)!; c.v.fatos[`paliativo_${p.id}`] = c.v.t; infoPet(c.v, p).doenca!.tratando = true; lembrarCom(c.v, p.id, 'Os últimos tempos foram de colo e cuidado.', 'perda', 2); return { texto: `Remédio para a dor, a caminha perto da sua. ${p.nome} vai ter os dias que tiver, sem sofrer.`, memoria: null }; } }
    ]
  },
  {
    id: 'mat_pet_oferta', tipo: 'decisao', idade: [18, 85], tema: 'casa', repetir: 6, peso: 0.7,
    quando: c => seusPets(c.v).length < 2 && podeTerPet(c.v, 'gato', 'pequeno').grau === 'permitido' && !moraComFamiliaDeOrigem(c.v),
    titulo: 'Alguém precisa de um lar',
    texto: c => {
      const quem = conhecido(c);
      const k = c.r.int(0, OFERTAS.length - 1);
      c.v.fatos['oferta_pet'] = k;
      const o = OFERTAS[k];
      return o.especie === 'gato' ? `${quem ? `A gata de ${quem.nome}` : 'A gata de uma vizinha'} teve filhotes. Sobrou um, ${o.jeito}.` : `${quem ? quem.nome : 'Um colega'} vai se mudar para um lugar que não aceita cachorro e está procurando quem fique com ${o.genero === 'feminino' ? 'a' : 'o'} ${o.nome}, ${o.jeito}.`;
    },
    opcoes: [
      { id: 'ficar', texto: 'Ficar com ele', comportamento: { empatia: 1 },
        resolver: c => {
          const o = OFERTAS[c.v.fatos['oferta_pet'] ?? 0] ?? OFERTAS[0];
          const quem = conhecido(c);
          const nome = o.nome || nomeDePet(c.r, 'gato', o.genero);
          const pet = adotarPet(c.v, c.r, { especie: o.especie, nome, genero: o.genero, idade: o.idade, porte: o.porte, jeito: o.jeito, historia: '' }, o.especie === 'gato' ? 'ninhada' : 'doacao', quem?.nome);
          if (quem) lembrarCom(c.v, quem.id, `Você ficou com ${pet.nome}.`, 'apoio', 1);
          return { texto: `${pet.nome} chegou com um saco de ração pela metade e um brinquedo roído.`, memoria: null };
        } },
      { id: 'nao', texto: 'Agora não dá', resolver: () => ({ texto: 'Você indicou um abrigo e desejou sorte.', memoria: null }) }
    ]
  }
];

const OFERTAS: { especie: 'cachorro' | 'gato'; nome: string; genero: 'masculino' | 'feminino'; idade: number; porte: 'pequeno' | 'medio'; jeito: string }[] = [
  { especie: 'gato', nome: '', genero: 'masculino', idade: 0, porte: 'pequeno', jeito: 'cinza e desconfiado' },
  { especie: 'gato', nome: '', genero: 'masculino', idade: 0, porte: 'pequeno', jeito: 'laranja e barulhento' },
  { especie: 'gato', nome: '', genero: 'feminino', idade: 0, porte: 'pequeno', jeito: 'preta, com uma mancha branca no peito' },
  { especie: 'cachorro', nome: 'Tobias', genero: 'masculino', idade: 4, porte: 'medio', jeito: 'um vira-lata de quatro anos que dorme no pé da cama' },
  { especie: 'cachorro', nome: 'Mel', genero: 'feminino', idade: 9, porte: 'pequeno', jeito: 'uma cachorra velhinha e calma' },
  { especie: 'cachorro', nome: 'Bolinha', genero: 'masculino', idade: 2, porte: 'pequeno', jeito: 'que late para moto e ama criança' }
];

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function conhecido(c: Ctx) {
  return vinculosVivos(c.v).filter(x => !x.vin.parentesco && !x.p.especie && x.vin.proximidade >= 30 && x.p.municipioId === c.v.moradia.municipioId).sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0]?.p;
}
