/**
 * REWORK 11 · ESP-11.7 — o CLUBE da comissão técnica. Antes, o auxiliar trabalhava em "um clube" (sem nome, sem
 * cidade, sem divisão) e, promovido, assumia um clube sorteado em outro estado, com mudança automática. Agora a
 * comissão é de um clube concreto: no futebol, um clube do catálogo — o último clube de quem jogou, se ele fica onde a
 * pessoa vive; senão, um clube profissional da cidade (ou do estado) —; nas outras modalidades, a equipe da cidade.
 * Folha (só catálogo e a tabela das ligas): o trabalho e o banco a chamam.
 */

import { hashMisturado } from '../rng';
import type { Dominio, Vida } from '../tipos';
import { clubePorNome, clubesDaCidade, clubesDoPais, type Clube } from '../dados/clubes';
import { municipio, paisDaCidade } from '../dados/lugares';
import { divisaoDoClube } from './ligas';

const NOME_MOD: Partial<Record<Dominio, string>> = { volei: 'vôlei', natacao: 'natação', atletismo: 'atletismo', lutas: 'luta', basquete: 'basquete', tenis: 'tênis' };

export interface ClubeDaComissao { nome: string; cidade: string; nivel?: number }

/** O clube onde a comissão técnica trabalha (determinístico: a mesma pergunta, o mesmo clube). */
export function clubeDaComissao(v: Vida, d: Dominio | undefined): ClubeDaComissao {
  const aqui = v.moradia.municipioId;
  const pais = paisDaCidade(aqui);
  if (d && d !== 'futebol') return { nome: `equipe de ${NOME_MOD[d] ?? d} de ${municipio(aqui).nome}`, cidade: aqui };
  const uf = municipio(aqui).uf;
  const prof = (c: Clube) => divisaoDoClube(v, c.nome, pais) >= 2;
  // O último clube de quem jogou, se fica na cidade ou no estado de agora (o vestiário lembra de quem jogou ali).
  const jogou = [v.caminhos.esporte, ...(v.caminhos.carreirasEsportivas ?? [])].filter(x => x && x.modalidade === 'futebol' && x.fase !== 'base').map(x => clubePorNome(x!.clube, pais)).filter((c): c is Clube => !!c && paisDaCidade(c.cidade) === pais && municipio(c.cidade).uf === uf && prof(c));
  const escolher = (xs: Clube[]) => xs[Math.floor(hashMisturado(`${v.id}:comissao:${xs.length}`) * xs.length) % xs.length];
  const pick = jogou.length ? jogou[jogou.length - 1]
    : clubesDaCidade(aqui).filter(prof).length ? escolher(clubesDaCidade(aqui).filter(prof))
      : clubesDoPais(pais).filter(c => municipio(c.cidade).uf === uf && prof(c)).length ? escolher(clubesDoPais(pais).filter(c => municipio(c.cidade).uf === uf && prof(c)))
        : clubesDoPais(pais).filter(prof).length ? escolher(clubesDoPais(pais).filter(prof)) : undefined;
  return pick ? { nome: pick.nome, cidade: pick.cidade, nivel: divisaoDoClube(v, pick.nome, pais) } : { nome: 'um clube', cidade: aqui };
}
