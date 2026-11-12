/**
 * VIDA 17 · O CELULAR NA PRISÃO — quem está preso não usa o próprio celular: o aparelho fica retido na unidade.
 *
 *   O BLOQUEIO   todas as operações do celular (`celular15`: mensagens, responder, escrever, namoro, rede dos amigos) e
 *                as redes sociais (`rede`, também no semiaberto) são recusadas no motor — esconder o botão não basta;
 *                as mensagens novas não chegam enquanto durar a pena (a cota do ano fica intacta).
 *   O QUE SOBRA  o telefone da unidade: ligações curtas para os contatos autorizados (a família próxima e a parceria),
 *                poucas por ano (4 no fechado, 6 no semiaberto). Cada ligação aproxima e acalma — dentro do possível.
 *   A SAÍDA      nada a restaurar: o bloqueio lê `justica.prisao` na hora; solto, o celular volta como estava.
 */
import type { Rng } from '../../rng';
import { clamp } from '../../rng';
import type { Pessoa, Vida, Vinculo } from '../../tipos';
import { lembrarCom, vinculosVivos } from '../../nucleo';
import { bloqueio, PERMITIDO, type Veredito } from '../../plausibilidade';
import { papelDe } from '../../sistemas/vinculos';
import { anoDe } from '../../tempo';

export const preso17 = (v: Vida) => !!v.justica?.prisao;

export const MOTIVO_PRESO17 = 'O celular fica retido na unidade enquanto durar a pena. Daqui, só o telefone da unidade, para os contatos autorizados.';

const AUTORIZADOS = new Set(['genitor', 'irmao', 'filho', 'avo', 'parceiro', 'neto', 'parente']);

/** Os contatos autorizados (a lista que a unidade aceita): família próxima e a parceria. */
export function contatosAutorizados17(v: Vida): { p: Pessoa; vin: Vinculo; papel: string }[] {
  return vinculosVivos(v)
    .map(x => ({ ...x, papel: papelDe(x.p, x.vin) }))
    .filter(x => !x.p.especie && x.p.vivo && AUTORIZADOS.has(x.papel) && !x.vin.ruptura)
    .sort((a, b) => b.vin.proximidade - a.vin.proximidade)
    .slice(0, 8);
}

const chave = (v: Vida) => `lig17_${anoDe(v.t)}`;
export const limiteDeLigacoes17 = (v: Vida) => (v.justica?.prisao?.regime === 'semiaberto' ? 6 : 4);
export const ligacoesRestantes17 = (v: Vida) => Math.max(0, limiteDeLigacoes17(v) - (v.fatos[chave(v)] ?? 0));

export function disponibilidadeLigacao17(v: Vida, pid: string): Veredito {
  if (!preso17(v)) return bloqueio('impossivel', 'O telefone da unidade é só para quem está cumprindo pena.');
  if (!contatosAutorizados17(v).some(x => x.p.id === pid)) return bloqueio('impossivel', 'Essa pessoa não está na lista de contatos autorizados.');
  if (ligacoesRestantes17(v) <= 0) return bloqueio('requisito', 'As ligações deste ano já foram usadas. A próxima, só no ano que vem.');
  if (v.fatos[`lig17_${pid}`] === v.t) return bloqueio('requisito', 'Vocês já se falaram agora há pouco.');
  return PERMITIDO;
}

export function ligarDaUnidade17(v: Vida, r: Rng, pid: string): { texto: string; pessoaId: string; tom: 'bom' | 'neutro' } {
  const p = v.pessoas[pid];
  const vin = v.vinculos[pid];
  v.fatos[chave(v)] = (v.fatos[chave(v)] ?? 0) + 1;
  v.fatos[`lig17_${pid}`] = v.t;
  vin.proximidade = clamp(vin.proximidade + 3);
  vin.tensao = clamp(vin.tensao - 3);
  vin.tUltimoContato = v.t;
  v.mente.estresse = clamp(v.mente.estresse - 4);
  v.mente.felicidade = clamp(v.mente.felicidade + 2);
  const papel = papelDe(p, vin);
  const texto = r.pick(papel === 'genitor' || papel === 'avo'
    ? [`A ligação durou os minutos permitidos. ${p.nome} perguntou se você está comendo, e segurou o choro até o fim.`, `${p.nome} atendeu no primeiro toque, como se esperasse ao lado do telefone. Falou da casa, do bairro, de quando você sair.`]
    : papel === 'parceiro' ? [`Dez minutos com ${p.nome}, com fila atrás e um agente olhando o relógio. Deu para dizer o que importava.`, `${p.nome} contou as contas, as saudades e as novidades — tudo correndo, antes de a linha cair.`]
      : papel === 'filho' || papel === 'neto' ? [`${p.nome} contou da escola, do trabalho, da vida lá fora. Você ouviu mais do que falou.`, `A voz de ${p.nome} do outro lado. A ligação acabou cedo demais.`]
        : [`Uma ligação curta para ${p.nome}, do telefone da unidade. Valeu a fila.`, `${p.nome} atendeu desconfiad${p.genero === 'feminino' ? 'a' : 'o'} do número — e depois não queria desligar.`]);
  lembrarCom(v, pid, 'Uma ligação do telefone da unidade, durante a pena.', 'apoio', 1);
  return { texto, pessoaId: pid, tom: 'bom' };
}
