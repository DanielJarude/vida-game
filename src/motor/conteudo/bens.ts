/**
 * O que é seu também acontece: o bicho que aprendeu a assobiar, a oferta
 * ilegal na feira, a moto que sumiu da porta. O mundo narra; quando a
 * reação importa, é decisão.
 */

import type { Conteudo, Ctx } from './base';
import type { Especie, Pessoa, Vida } from '../tipos';
import { clamp } from '../rng';
import { idade, vinculosVivos } from '../nucleo';
import { animal, OFERTAS_ILEGAIS } from '../dados/animais';
import { adotarPet, podeTerPet } from '../sistemas/pets';
import { nomeDePet } from '../sistemas/mercado';
import { dinheiro as fmt } from '../texto';
import { categoriaDoVeiculo, textoVeiculo } from '../sistemas/veiculos';

const seusBichos = (v: Vida): Pessoa[] => vinculosVivos(v).filter(x => x.p.especie && x.vin.convivio.includes('casa') && x.p.pet?.tutor === 'eu').map(x => x.p);
const ofertaDoAno = (c: Ctx) => OFERTAS_ILEGAIS[Math.floor(c.v.t / 12 + c.v.id.length) % OFERTAS_ILEGAIS.length];
/** O bem some; o financiamento, não: a parcela continua (sem o bem). */
function semBem(v: Vida, id: string): void {
  v.financas.bens = v.financas.bens.filter(x => x.id !== id);
  v.financas.dividas = v.financas.dividas.map(d => (d.bemId === id ? { ...d, bemId: undefined, descricao: `${d.descricao} (roubada)` } : d));
}
const motos = (v: Vida) => v.financas.bens.filter(b => b.tipo === 'veiculo' && categoriaDoVeiculo(b) === 'moto' && !b.parado);

export const BENS: Conteudo[] = [
  {
    id: 'pet_cotidiano', tipo: 'acontecimento', idade: [3, 110], tema: 'casa', repetir: 3, peso: 1.2,
    papeis: { bicho: seusBichos },
    quando: c => animal(c.p.bicho.especie).cotidiano.length > 0 && c.r.chance(0.45),
    narrar: c => {
      const a = animal(c.p.bicho.especie);
      const texto = c.r.pick(a.cotidiano).replace(/\{nome\}/g, c.p.bicho.nome);
      return { texto, relevancia: 'cotidiano', tom: 'bom', lembrar: ['bicho', texto, 'ritual'], efeito: () => { const vin = c.v.vinculos[c.p.bicho.id]; if (vin) vin.proximidade = clamp(vin.proximidade + 2); } };
    }
  },
  {
    id: 'pet_feira', tipo: 'decisao', idade: [18, 90], tema: 'casa', repetir: 12, peso: 0.6,
    quando: c => !c.v.justica?.prisao && seusBichos(c.v).length < 4,
    titulo: 'A oferta na feira',
    texto: c => { const o = ofertaDoAno(c); return `Na feira de domingo, um homem abre uma caixa e mostra ${o.bicho}, ${o.texto}. "Sem papel sai bem mais barato", ele diz, baixinho.`; },
    opcoes: [
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'Você seguiu em frente. O bicho ficou na caixa, olhando.', memoria: null }) },
      { id: 'denunciar', texto: 'Recusar e avisar a polícia ambiental', comportamento: { coragem: 1 },
        consequencia: () => 'Tráfico de animal silvestre é crime; denunciar é anônimo.',
        resolver: () => ({ texto: 'Você ligou para a polícia ambiental. Na semana seguinte, a barraca não estava mais lá.', memoria: 'Denunciou um vendedor de animais silvestres na feira.', relevancia: 'cotidiano' }) },
      { id: 'comprar', texto: 'Comprar assim mesmo', comportamento: { impulsividade: 1 },
        consequencia: () => 'É crime (Lei 9.605/1998, art. 29): a fiscalização pode apreender e multar em R$ 5.000 por animal de espécie protegida.',
        disponivel: c => { const o = ofertaDoAno(c); const d = podeTerPet(c.v, o.especie, 'pequeno'); return d.grau === 'incompativel' ? (d.motivo ?? 'Não cabe agora.') : idade(c.v) < 18 ? false : true; },
        resolver: c => {
          const o = ofertaDoAno(c);
          const esp: Especie = o.especie;
          const genero = c.r.chance(0.5) ? 'masculino' : 'feminino';
          const nome = nomeDePet(c.r, esp, genero);
          return { texto: `Você levou ${o.bicho} para casa numa caixa de papelão. Sem nota, sem anilha, sem saber a idade.`, memoria: null, tom: 'ruim', efeito: () => { c.v.financas.conta -= 400; adotarPet(c.v, c.r, { especie: esp, nome, genero, idade: 0, porte: 'pequeno', jeito: 'assustado, ainda sem confiar em ninguém', historia: 'da feira' }, 'ilegal'); } };
        } }
    ]
  },
  {
    id: 'bem_moto_roubada', tipo: 'decisao', idade: [18, 80], tema: 'dinheiro', repetir: 8, peso: 0.8,
    quando: c => motos(c.v).length > 0 && c.r.chance(0.35),
    titulo: 'A moto sumiu',
    texto: c => `Você desceu de manhã e ${textoVeiculo(motos(c.v)[0] as never)} não estava mais na porta. O cadeado cortado ficou no chão.`,
    opcoes: [
      { id: 'bo', texto: 'Registrar o boletim e procurar', resolver: c => { const achou = c.r.chance(0.3); const b = motos(c.v)[0]; return { texto: achou ? 'Três semanas depois, a polícia ligou: acharam a moto num terreno, sem o banco e sem o retrovisor.' : 'O boletim ficou registrado. A moto, nunca mais.', memoria: achou ? null : 'Teve a moto roubada da porta de casa.', relevancia: 'cotidiano', tom: 'ruim', efeito: () => { if (!b) return; if (achou) { b.estado = clamp(b.estado - 20); (b.historia ??= []).push({ t: c.v.t, texto: 'Roubada e recuperada, sem o banco e o retrovisor.' }); } else { semBem(c.v, b.id); } } }; } },
      { id: 'seguro', texto: 'Acionar o seguro', disponivel: c => ((motos(c.v)[0]?.valor ?? 0) > 12000 ? true : 'A moto era barata demais para ter seguro.'),
        consequencia: c => `O seguro paga uns ${fmt(Math.round((motos(c.v)[0]?.valor ?? 0) * 0.8 / 100) * 100)}; a franquia fica com você.`,
        resolver: c => { const b = motos(c.v)[0]; const valor = Math.round((b?.valor ?? 0) * 0.8 / 100) * 100; return { texto: `Um mês de papelada depois, o seguro pagou ${fmt(valor)}.`, memoria: 'Teve a moto roubada; o seguro cobriu parte.', relevancia: 'cotidiano', efeito: () => { if (!b) return; c.v.financas.conta += valor; semBem(c.v, b.id); } }; } }
    ]
  }
];
