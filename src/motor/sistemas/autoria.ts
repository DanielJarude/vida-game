/**
 * Autoria: o que a pessoa criou, fundou ou possui tem o nome que ela der. O
 * jogo sugere (o nome que nasce com a banda, com o negócio, com a obra); o
 * jogador mantém ou renomeia. O nome novo passa a valer em tudo o que vem
 * depois (telas, acontecimentos, currículo) e a troca fica na Linha da Vida.
 * Instituições alheias (a escola, o clube, a empresa em que se trabalha) não
 * se renomeiam.
 */

import type { Vida } from '../tipos';
import { escrever } from '../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';

export type AlvoDeNome = 'grupo' | 'negocio' | 'obra';

/** Um nome aceitável: 2 a 40 caracteres visíveis, sem símbolos de controle. */
export function nomeValido(nome: string): string | undefined {
  const n = nome.replace(/\s+/g, ' ').trim();
  if (n.length < 2) return undefined;
  if (n.length > 40) return undefined;
  if (/[\u0000-\u001f<>{}]/.test(n)) return undefined;
  return n;
}

function atual(v: Vida, alvo: AlvoDeNome, k?: number): string | undefined {
  if (alvo === 'grupo') return v.caminhos.arte?.nome;
  if (alvo === 'negocio') return v.caminhos.negocio && v.caminhos.negocio.estado !== 'fechado' ? v.caminhos.negocio.nome : undefined;
  const obras = v.caminhos.obras ?? [];
  return obras[k ?? obras.length - 1]?.titulo;
}

export function disponibilidadeRenomear(v: Vida, alvo: AlvoDeNome, nome: string, k?: number): Veredito {
  const antes = atual(v, alvo, k);
  if (!antes) return bloqueio('impossivel', alvo === 'grupo' ? 'Não há grupo para nomear.' : alvo === 'negocio' ? 'Não há negócio aberto.' : 'Não há obra para nomear.');
  const n = nomeValido(nome);
  if (!n) return bloqueio('requisito', 'Um nome de 2 a 40 letras.');
  if (n === antes) return bloqueio('incompativel', 'Já tem esse nome.');
  if (alvo === 'grupo' && v.caminhos.arte && !v.caminhos.arte.ativo) return bloqueio('incompativel', 'O grupo já acabou: o nome fica como foi.');
  return PERMITIDO;
}

export function renomear(v: Vida, alvo: AlvoDeNome, nome: string, k?: number): string {
  const n = nomeValido(nome)!;
  const antes = atual(v, alvo, k)!;
  if (alvo === 'grupo') v.caminhos.arte!.nome = n;
  else if (alvo === 'negocio') v.caminhos.negocio!.nome = n;
  else { const obras = v.caminhos.obras!; obras[k ?? obras.length - 1].titulo = n; for (const c of v.caminhos.curriculo ?? []) if (c.titulo === antes) c.titulo = n; }
  const oque = alvo === 'grupo' ? (v.caminhos.arte!.tipo === 'banda' ? 'a banda' : 'o grupo') : alvo === 'negocio' ? 'o negócio' : 'a obra';
  escrever(v, { texto: `Rebatizou ${oque}: "${antes}" passou a se chamar "${n}".`, relevancia: 'cotidiano', tema: alvo === 'negocio' ? 'trabalho' : 'lazer', escolha: true });
  return `${oque.charAt(0).toUpperCase() + oque.slice(1)} agora se chama "${n}".`;
}
