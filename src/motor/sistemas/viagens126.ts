/**
 * VIDA 12.6 — A VIAGEM QUE TEM HISTÓRIA PRÓPRIA. Quando a viagem não teve o seu acontecimento de sempre (a pessoa nova,
 * a primeira vez da criança, o momento a dois, o imprevisto), ela ainda pode ter o seu: o que o bolso, a idade, a
 * companhia e o lugar fazem acontecer — o mochilão de albergue, a excursão da terceira idade, a festa de rua que
 * ninguém planejou, o jantar na casa de uma família local, a carteira perdida, o museu que só um dos dois queria. E o
 * MARCO da primeira viagem sozinho. Sorteio derivado: nada muda na sequência das vidas.
 */
import type { Pessoa, Vida } from '../tipos';
import { escrever, idade, lembrarCom, registrarMarco } from '../nucleo';
import { clamp, rngDe, type Rng } from '../rng';
import { emComum } from './jeito';
import { aplicarPersonalidade } from '../personalidade';
import { condicaoEconomica } from './dinheiro';

const um = <T,>(r: Rng, xs: T[]): T => xs[Math.floor(r.next() * xs.length) % xs.length];

export function viagem126(v: Vida, onde: string, com: Pessoa[], fora: boolean, jaTeveHistoria: boolean): string | undefined {
  const i = idade(v);
  const r = rngDe(v.id, 'viagem126', v.t, onde);
  const sozinho = com.length === 0;
  // O marco: a primeira viagem sozinho (de adulto).
  if (sozinho && i >= 16 && !v.eu.marcos?.primeira_viagem_sozinho) {
    registrarMarco(v, 'eu', 'primeira_viagem_sozinho');
    escrever(v, { texto: `A primeira viagem sozinh${v.eu.genero === 'feminino' ? 'a' : 'o'}: ${onde}. Ninguém para decidir o roteiro — nem para culpar.`, relevancia: 'biografia', tema: 'lugar', tom: 'bom', fato: { tipo: 'm_marco', dados: { marco: 'primeira_viagem_sozinho', destino: onde } } });
    aplicarPersonalidade(v, 'acao:viagem_sozinho', { coragem: 1 });
    if (!jaTeveHistoria) return 'Na volta, ficou a sensação de que dá para ir a qualquer lugar.';
  }
  if (jaTeveHistoria || r.next() > 0.6) return undefined;
  // 12.7: o dinheiro de mexer (conta e aplicações), não só a conta corrente.
  const conta = condicaoEconomica(v).liquidez;
  const apertado = conta < 4000, folgado = conta > 150000;
  const amigo = com.find(p => { const vin = v.vinculos[p.id]; return vin && !vin.romance && !vin.parentesco; });
  const opcoes: (() => string)[] = [];
  if (i <= 26 && apertado) opcoes.push(() => um(r, [`Albergue de doze camas em ${onde}, miojo no fogareiro, e a melhor viagem da vida até agora.`, `Pegou carona com um casal de outro país até ${onde}. Trocaram contato; prometeram se ver.`]));
  if (i >= 65) opcoes.push(() => um(r, [`A excursão para ${onde} tinha um ônibus inteiro da sua idade. Você voltou com três amigas novas e um caderninho de receitas.`, `Em ${onde}, subiu a ladeira mais devagar que os outros — e chegou lá em cima, que é o que importa.`]));
  if (folgado) opcoes.push(() => `O hotel em ${onde} tinha vista e um frigobar mais caro que o jantar. Ninguém olhou a conta.`);
  if (amigo) opcoes.push(() => {
    const vin = v.vinculos[amigo.id];
    const comum = emComum(v, amigo);
    if (vin.tensao >= 35) { vin.tensao = clamp(vin.tensao + 5); return `Viajar com ${amigo.nome} mostrou o que o dia a dia escondia: um acordava cedo, o outro não. Voltaram menos amigos.`; }
    vin.proximidade = clamp(vin.proximidade + 4);
    lembrarCom(v, amigo.id, `A viagem para ${onde}.`, 'ritual', 2);
    return comum.length ? `Você e ${amigo.nome} montaram o roteiro em volta do que os dois gostam (${comum[0]}). Vão contar essa viagem por anos.` : `Você e ${amigo.nome} brigaram pelo mapa e riram da briga no jantar. Amizade de estrada.`;
  });
  opcoes.push(() => um(r, [
    `Caiu, sem querer, numa festa de rua em ${onde}. Dançou com desconhecidos até tarde.`,
    `Uma família de ${onde} chamou você para jantar em casa. A comida era simples; a noite, inesquecível.`,
    fora ? 'Perdeu a carteira no segundo dia. Um desconhecido devolveu no hotel, sem tirar nada.' : 'Esqueceu o carregador, o guarda-chuva e a escova de dentes. Comprou tudo de novo, mais caro.',
    `Em ${onde}, entrou num museu para fugir da chuva e saiu três horas depois, pensando na vida.`
  ]));
  return um(r, opcoes)();
}
