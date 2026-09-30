/**
 * Experiências: o que o dinheiro compra além de objetos — possibilidades de
 * vida. A viagem com quem se ama, o curso caro de um gosto antigo, o ano
 * sabático curto, o projeto de alguém que se decide bancar. Cada uma custa,
 * deixa memória (na Linha da Vida e com quem foi junto) e muda algo real: a
 * cabeça descansa, um vínculo se aproxima, uma prática começa, uma causa anda.
 *
 * Luxo não dá fama: nada aqui mexe na notoriedade. Uma doação grande pode
 * virar notícia local — e isso é imagem, não fama.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Pessoa, Vida } from '../tipos';
import { escrever, idade, lembrarCom, moraCom } from '../nucleo';
import { bloqueio, type Veredito } from '../plausibilidade';
import { economiaLocal, municipio } from '../dados/lugares';
import { dinheiro as fmt, listaNatural } from '../texto';
import { disponivel, pagar, vereditoDePagar } from './dinheiro';
import { garantirFrente, praticar } from './frentes';
import { marcar } from './marcas';

export type TipoExperiencia = 'viagem_pais' | 'viagem_exterior' | 'curso_caro' | 'sabatico' | 'bancar_projeto' | 'presente_familia';

interface ModeloExperiencia {
  id: TipoExperiencia;
  nome: string;
  /** Custo de referência (a cidade ajusta; a companhia multiplica a viagem). */
  custo: number;
  /** Uma vez a cada tantos meses. */
  intervalo: number;
  /** A partir de quanto dinheiro disponível faz sentido oferecer (não é "pode comprar": é "aparece"). */
  aparece: number;
  descricao: string;
}

export const EXPERIENCIAS: readonly ModeloExperiencia[] = [
  { id: 'viagem_pais', nome: 'Uma viagem pelo Brasil', custo: 5500, intervalo: 12, aparece: 12000, descricao: 'Uma semana longe: Chapada, Lençóis, uma capital que você nunca viu.' },
  { id: 'viagem_exterior', nome: 'Uma viagem para fora do país', custo: 16000, intervalo: 24, aparece: 45000, descricao: 'Passaporte, avião, outra língua na rua. Duas semanas.' },
  { id: 'curso_caro', nome: 'Um curso de um gosto antigo', custo: 7000, intervalo: 24, aparece: 25000, descricao: 'Gastronomia, fotografia, música, cerâmica — com gente boa ensinando.' },
  { id: 'sabatico', nome: 'Três meses sem trabalhar (um tempo sabático)', custo: 0, intervalo: 60, aparece: 120000, descricao: 'Parar por uns meses, com o dinheiro que se guardou. O trabalho espera — ou não.' },
  { id: 'bancar_projeto', nome: 'Bancar o projeto de alguém (uma doação)', custo: 20000, intervalo: 24, aparece: 150000, descricao: 'A biblioteca do bairro, o time da escola, a ONG de uma amiga.' },
  { id: 'presente_familia', nome: 'Um presente grande para a família', custo: 12000, intervalo: 24, aparece: 60000, descricao: 'A reforma da casa dos pais, a viagem que eles nunca fizeram.' }
];

const modelo = (id: TipoExperiencia) => EXPERIENCIAS.find(x => x.id === id)!;
const chave = (id: TipoExperiencia) => `exp_${id}`;

/** Quem vai junto (a parceria, os filhos em casa). */
function companhia(v: Vida): Pessoa[] {
  return moraCom(v).filter(p => !p.especie && (v.vinculos[p.id]?.romance || ['filho', 'enteado'].includes(v.vinculos[p.id]?.parentesco ?? ''))).slice(0, 4);
}

/** Pais vivos (para o presente). */
const pais = (v: Vida) => Object.values(v.vinculos).filter(x => ['mae', 'pai'].includes(x.parentesco ?? '') && v.pessoas[x.pessoaId]?.vivo).map(x => v.pessoas[x.pessoaId]);

export function custoDaExperiencia(v: Vida, id: TipoExperiencia): number {
  const m = modelo(id);
  const c = economiaLocal(v.moradia.municipioId).custo;
  const gente = id === 'viagem_pais' || id === 'viagem_exterior' ? 1 + companhia(v).length * 0.8 : 1;
  if (id === 'sabatico') return Math.round(Math.max(9000, (v.trabalho.atual?.salario ?? 3000) * 3) / 100) * 100;
  return Math.round(m.custo * c * gente / 100) * 100;
}

/** O que aparece para esta vida agora (pelo que ela tem, não pelo que o catálogo tem). */
export function experienciasPossiveis(v: Vida): TipoExperiencia[] {
  if (idade(v) < 18 || v.justica?.prisao) return [];
  const d = disponivel(v);
  return EXPERIENCIAS.filter(x => d >= x.aparece && (x.id !== 'presente_familia' || pais(v).length > 0) && (x.id !== 'sabatico' || !!v.trabalho.atual)).map(x => x.id);
}

export function disponibilidadeExperiencia(v: Vida, id: TipoExperiencia): Veredito {
  const m = EXPERIENCIAS.find(x => x.id === id);
  if (!m) return bloqueio('impossivel', 'Não existe.');
  if (idade(v) < 18) return bloqueio('requisito', 'A partir dos 18.');
  if (v.justica?.prisao) return bloqueio('impossivel', 'Não enquanto cumpre pena.');
  const t = v.fatos[chave(id)];
  if (t !== undefined && v.t - t < m.intervalo) return bloqueio('incompativel', m.intervalo >= 24 ? 'Foi há pouco — a próxima fica para daqui a um tempo.' : 'Já foi este ano.');
  if (id === 'presente_familia' && !pais(v).length) return bloqueio('impossivel', 'Não há pai nem mãe para presentear.');
  if (id === 'sabatico' && !v.trabalho.atual) return bloqueio('impossivel', 'Sem trabalho, não há de que tirar um tempo.');
  return vereditoDePagar(v, custoDaExperiencia(v, id), 'Custa uns');
}

export function viverExperiencia(v: Vida, r: Rng, id: TipoExperiencia): string {
  const custo = custoDaExperiencia(v, id);
  pagar(v, custo);
  v.fatos[chave(id)] = v.t;
  const com = companhia(v);
  const nomes = listaNatural(com.map(p => p.nome));
  const perto = (n: number, texto: string) => { for (const p of com) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + n); lembrarCom(v, p.id, texto, 'ritual', 2); } } };
  switch (id) {
    case 'viagem_pais': case 'viagem_exterior': {
      const fora = id === 'viagem_exterior';
      const lugar = fora ? r.pick(['Lisboa', 'Buenos Aires', 'Santiago', 'Paris', 'Nova York', 'Cidade do México', 'Roma']) : r.pick(['a Chapada Diamantina', 'os Lençóis Maranhenses', 'Bonito', 'Foz do Iguaçu', 'Ouro Preto', 'Jericoacoara', 'Fernando de Noronha'].filter(x => !x.includes(municipio(v.moradia.municipioId).nome)));
      v.mente.felicidade = clamp(v.mente.felicidade + (fora ? 8 : 6));
      v.mente.estresse = clamp(v.mente.estresse - (fora ? 10 : 7));
      perto(fora ? 7 : 5, `A viagem para ${lugar}.`);
      const texto = `Viajou para ${lugar}${com.length ? `, com ${nomes}` : v.eu.genero === 'feminino' ? ', sozinha' : ', sozinho'}.`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'lazer', tom: 'bom', escolha: true, pessoas: com.map(p => p.id) });
      return `${fmt(custo)} entre passagem, hospedagem e o resto. ${com.length ? 'Voltaram com fotos demais e uma história que vão repetir por anos.' : 'Voltou outra pessoa — um pouco.'}`;
    }
    case 'curso_caro': {
      const d: Dominio = r.pick(['cozinha', 'fotografia', 'musica', 'desenho'] as Dominio[]);
      garantirFrente(v, d);
      const f = v.caminhos.frentes[d]!;
      f.interesse = clamp(f.interesse + 15);
      praticar(v, r, d, 1.2, 1.5);
      v.mente.felicidade = clamp(v.mente.felicidade + 4);
      const nome = { cozinha: 'gastronomia', fotografia: 'fotografia', musica: 'música', desenho: 'desenho e pintura' }[d as 'cozinha'];
      escrever(v, { texto: `Fez um curso de ${nome} com gente muito boa. O gosto antigo virou prática.`, relevancia: 'biografia', tema: 'lazer', tom: 'bom', escolha: true });
      return `Um curso de ${nome}: aulas, material, e a vontade de continuar em casa (dá para virar atividade da semana, em Tempo livre).`;
    }
    case 'sabatico': {
      v.mente.estresse = clamp(v.mente.estresse - 22);
      v.mente.felicidade = clamp(v.mente.felicidade + 7);
      const e = v.trabalho.atual!;
      const clt = e.contrato === 'clt' || e.contrato === 'servidor';
      if (clt) { e.desempenho = clamp(e.desempenho - 4); }
      else if (e.clientela !== undefined) { e.clientela = Math.round(e.clientela * 0.85); }
      escrever(v, { texto: `Tirou três meses para si: sem trabalho, sem pressa. ${clt ? 'Uma licença negociada no trabalho.' : 'A freguesia sentiu a ausência.'}`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
      return `Três meses vivendo do que guardou (${fmt(custo)}). A cabeça voltou a caber no corpo; ${clt ? 'no trabalho, a volta pede um tempo de readaptação' : 'parte da freguesia foi atrás de outro'}.`;
    }
    case 'bancar_projeto': {
      v.mente.felicidade = clamp(v.mente.felicidade + 5);
      const oque = r.pick(['a biblioteca comunitária do bairro', 'o time de futebol das meninas da escola pública', 'a reforma da creche da rua de baixo', 'o cursinho popular da região']);
      const texto = `Bancou ${oque} (${fmt(custo)}).`;
      escrever(v, { texto, relevancia: 'biografia', tema: 'escolha', tom: 'bom', escolha: true });
      marcar(v, 'conquista', texto, 2);
      return `${oque.charAt(0).toUpperCase() + oque.slice(1)} saiu do papel. Alguém que você nunca vai conhecer vai lembrar disso.`;
    }
    case 'presente_familia': {
      const ps = pais(v);
      for (const p of ps) { const vin = v.vinculos[p.id]; if (vin) { vin.proximidade = clamp(vin.proximidade + 8); lembrarCom(v, p.id, 'Você deu um presente grande: a casa, a viagem.', 'apoio', 3); } if (p.aperto && !p.aperto.resolvido) p.aperto.resolvido = v.t; }
      const quem = listaNatural(ps.map(p => p.nome));
      escrever(v, { texto: `Deu um presente grande para ${quem}: a reforma, a viagem que nunca tinham feito.`, relevancia: 'biografia', tema: 'familia', tom: 'bom', escolha: true, pessoas: ps.map(p => p.id) });
      return `${quem} ${ps.length > 1 ? 'choraram' : 'chorou'} um pouco. Presente assim é também um jeito de agradecer.`;
    }
  }
  return '';
}

export const nomeDaExperiencia = (id: TipoExperiencia) => modelo(id).nome;
export const descricaoDaExperiencia = (id: TipoExperiencia) => modelo(id).descricao;
