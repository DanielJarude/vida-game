/**
 * No dia a dia do trabalho (FIX pós-REWORK 4): "tenho uma profissão → consigo agir dentro dela".
 *
 * As decisões grandes da carreira (ritmo, promoção, aumento, transferência,
 * pendurar as chuteiras) já existem (`profissao.acoesDoTrabalho`). O que
 * faltava era o MIÚDO que faz uma carreira por dentro: pegar o projeto difícil,
 * almoçar com a chefia, ajudar o colega enrolado, fazer a capacitação; para
 * quem atende por conta, divulgar e caprichar; para o atleta, o treino
 * específico, o vídeo dos adversários, a fisioterapia extra, a torcida.
 *
 * Arquitetura reutilizável: CARREIRA → VERBOS DO CONTEXTO (`verbosDoOficio`)
 * → RESULTADO (com sorte e com o que a pessoa sabe) → HISTÓRICO (a marca da
 * trajetória, a Linha da Vida quando é biografia) → CONSEQUÊNCIA (desempenho,
 * clima, freguesia, relação com o colega, prática, corpo, estresse). Uma vez
 * por ano cada verbo (o ano do jogo é longo: é a fase, não o clique).
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Dominio, Pessoa, Vida } from '../tipos';
import { PERMITIDO, bloqueio, type Veredito } from '../plausibilidade';
import { escrever, idade, lembrarCom, vinculosVivos } from '../nucleo';
import { flex } from '../texto';
import { economiaLocal } from '../dados/lugares';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { modoDoTrabalho, type ModoTrabalho } from './profissao';
import { pagar, vereditoDePagar } from './dinheiro';
import { praticar, habilidade } from './frentes';
import { marcar } from './marcas';
import { lesaoAtiva } from './lesoes';
import { contaAtiva } from './redesBase';

export type OqueOficio =
  | 'projeto' | 'chefia' | 'colega' | 'capacitacao'
  | 'divulgar' | 'caprichar'
  | 'treino_finalizacao' | 'treino_fisico' | 'treino_tatico' | 'video' | 'fisio' | 'torcida';

export interface VerboDoOficio { oque: OqueOficio; rotulo: string; porque: string }

const COM_CHEFIA = new Set<ModoTrabalho>(['empregado', 'servidor', 'docente', 'saude', 'seguranca', 'militar', 'estagio', 'aprendiz']);
const POR_CONTA = new Set<ModoTrabalho>(['autonomo', 'informal', 'plataforma', 'artista']);
const chave = (v: Vida, oque: OqueOficio) => `oficio:${oque}:${Math.floor(v.t / 12)}`;
const feito = (v: Vida, oque: OqueOficio) => v.fatos[chave(v, oque)] !== undefined;
const preco = (v: Vida, x: number) => Math.round(x * economiaLocal(v.moradia.municipioId).custo / 10) * 10;
const TREINOS: OqueOficio[] = ['treino_finalizacao', 'treino_fisico', 'treino_tatico'];

/** O colega de trabalho mais perto de você (gente de verdade, do convívio do trabalho). */
function colegaDeTrabalho(v: Vida): Pessoa | undefined {
  return vinculosVivos(v).filter(x => !x.p.especie && !x.vin.parentesco && !x.vin.romance && x.vin.convivio.includes('trabalho')).sort((a, b) => b.vin.proximidade - a.vin.proximidade)[0]?.p;
}

/** A frente que o trabalho pratica (a do esporte, a da ocupação), quando há. */
function frenteDoTrabalho(v: Vida): Dominio | undefined {
  const es = v.caminhos.esporte;
  if (es?.fase === 'profissional') return es.modalidade;
  return undefined;
}

/** Os verbos que fazem sentido AGORA, com o porquê (nenhum impossível entra; o já feito no ano sai). */
export function verbosDoOficio(v: Vida): VerboDoOficio[] {
  const e = v.trabalho.atual;
  if (!e || idade(v) < 14) return [];
  const modo = modoDoTrabalho(v);
  const out: VerboDoOficio[] = [];
  const add = (x: VerboDoOficio) => { if (!feito(v, x.oque)) out.push(x); };
  if (COM_CHEFIA.has(modo)) {
    add({ oque: 'projeto', rotulo: modo === 'docente' ? 'Assumir a turma mais difícil da escola' : modo === 'saude' ? 'Pegar os casos mais difíceis do plantão' : 'Assumir um projeto difícil', porque: 'Se der certo, o desempenho e o nome sobem; se der errado, cobra. E pesa no estresse.' });
    add({ oque: 'chefia', rotulo: 'Almoçar com a chefia', porque: 'Ser lembrado quando a vaga de cima abrir.' });
    const col = colegaDeTrabalho(v);
    if (col) add({ oque: 'colega', rotulo: `Ajudar ${col.nome}, que anda enrolad${flex(col.genero, 'o', 'a', 'e')}`, porque: 'O clima da equipe e uma amizade de trabalho.' });
    add({ oque: 'capacitacao', rotulo: 'Fazer uma capacitação (curso da empresa)', porque: 'O desempenho sobe devagar — e o próximo passo pede.' });
  }
  if (POR_CONTA.has(modo) && e.clientela !== undefined) {
    add({ oque: 'divulgar', rotulo: contaAtiva(v, 'instagram') ? 'Divulgar o trabalho (no boca a boca e no Instagram)' : 'Divulgar o trabalho no bairro', porque: `Uns ${preco(v, 250)} em material; cliente novo vem de quem ouviu falar.` });
    add({ oque: 'caprichar', rotulo: 'Caprichar num trabalho difícil (o cliente exigente)', porque: 'Cliente exigente satisfeito indica outros. Cansa.' });
  }
  if (modo === 'atleta' && v.caminhos.esporte?.fase === 'profissional') {
    const es = v.caminhos.esporte;
    const futebol = es.modalidade === 'futebol';
    if (!TREINOS.some(t => feito(v, t))) {
      add({ oque: 'treino_finalizacao', rotulo: futebol ? 'Treino extra: finalização' : 'Treino extra: técnica', porque: 'Depois do treino, sozinho: a técnica sobe.' });
      add({ oque: 'treino_fisico', rotulo: 'Treino extra: físico', porque: 'O corpo aguenta mais — e o risco de lesão sobe um pouco.' });
      add({ oque: 'treino_tatico', rotulo: 'Treino extra: tático, com a comissão', porque: 'Entender o jogo; o treinador repara.' });
    }
    add({ oque: 'video', rotulo: 'Estudar os adversários em vídeo', porque: 'Chega ao jogo sabendo o que vem.' });
    const l = lesaoAtiva(v);
    if (l && l.lesao.cuidado && l.lesao.cuidado !== 'sacrificio') add({ oque: 'fisio', rotulo: `Fisioterapia extra, por fora (${l.lesao.parte})`, porque: `Uns ${preco(v, 1200)}; volta antes.` });
    if ((v.notoriedade?.valor ?? 0) >= 10) add({ oque: 'torcida', rotulo: 'Atender a torcida na saída do treino', porque: 'Foto, autógrafo, conversa: o nome agradece.' });
  }
  return out;
}

export function disponibilidadeOficio(v: Vida, oque: OqueOficio): Veredito {
  if (!v.trabalho.atual) return bloqueio('impossivel', 'Sem trabalho agora.');
  if (feito(v, oque) || (TREINOS.includes(oque) && TREINOS.some(t => feito(v, t)))) return bloqueio('incompativel', 'Isso já foi feito neste ano.');
  if (!verbosDoOficio(v).some(x => x.oque === oque)) return bloqueio('impossivel', 'Isso não faz sentido no seu trabalho agora.');
  if (oque === 'divulgar') return vereditoDePagar(v, preco(v, 250), 'O material custa uns');
  if (oque === 'fisio') return vereditoDePagar(v, preco(v, 1200), 'A fisioterapia custa uns');
  return PERMITIDO;
}

/** Faz: o resultado tem sorte e mérito; a consequência vai para os sistemas de sempre. Devolve o que aconteceu. */
export function executarOficio(v: Vida, r: Rng, oque: OqueOficio): string {
  const e = v.trabalho.atual!;
  v.fatos[chave(v, oque)] = v.t;
  const oc = ocupacaoOuNula(e.ocupacaoId);
  const nome = oc ? oc.nome[v.eu.genero === 'feminino' ? 1 : 0] : 'trabalho';
  const estresse = (n: number) => { v.mente.estresse = clamp(v.mente.estresse + n); };
  const desempenho = (n: number) => { e.desempenho = clamp(Math.round(e.desempenho + n)); };
  const clima = (n: number) => { e.clima = clamp(Math.round((e.clima ?? 50) + n)); };
  switch (oque) {
    case 'projeto': {
      const chance = 0.35 + e.desempenho / 250 - Math.max(0, v.mente.estresse - 60) / 200 + (v.personalidade.tracos.disciplina ?? 0) / 400;
      estresse(6);
      if (r.chance(chance)) {
        desempenho(9); clima(3);
        const texto = `Assumiu um projeto difícil como ${nome} — e entregou.`;
        marcar(v, 'conquista', texto, 2, { ocupacaoId: e.ocupacaoId });
        escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
        return 'Noites longas, uma semana ruim no meio — e no fim deu certo. A chefia citou o seu nome na reunião.';
      }
      desempenho(-4); estresse(4);
      escrever(v, { texto: `Assumiu um projeto difícil como ${nome}, e ele não saiu como devia.`, relevancia: 'cotidiano', tema: 'trabalho', tom: 'ruim', escolha: true });
      return 'Não deu. O prazo estourou, a culpa se espalhou — e uma parte ficou com você.';
    }
    case 'chefia': {
      const bom = r.chance(0.55 + (v.personalidade.tracos.sociabilidade ?? 0) / 250);
      clima(bom ? 5 : 1);
      if (bom) v.fatos['oficio:lembrado'] = v.t;
      return bom ? 'O almoço foi bom: falaram de trabalho e de futebol, e a chefia perguntou o que você queria fazer daqui a uns anos.' : 'Um almoço protocolar. A chefia olhou o celular metade do tempo.';
    }
    case 'colega': {
      const col = colegaDeTrabalho(v)!;
      const vin = v.vinculos[col.id];
      vin.proximidade = clamp(vin.proximidade + 7); vin.confianca = clamp(vin.confianca + 5); vin.aproximacao = v.t; vin.tUltimoContato = v.t;
      clima(2); estresse(2);
      lembrarCom(v, col.id, `Você ajudou ${col.nome} quando o trabalho apertou.`, 'apoio', 2);
      return `Você ficou até mais tarde ajudando ${col.nome}. No dia seguinte, tinha café na sua mesa.`;
    }
    case 'capacitacao': {
      desempenho(4); estresse(2);
      const d = frenteDoTrabalho(v);
      if (d) praticar(v, r, d, 0.2, 1);
      return 'Quarenta horas de curso, um certificado — e uma ou outra coisa que você usou já na semana seguinte.';
    }
    case 'divulgar': {
      pagar(v, preco(v, 250));
      const insta = contaAtiva(v, 'instagram');
      const ganho = Math.round((3 + r.next() * 5) * (insta ? 1.4 : 1));
      e.clientela = clamp((e.clientela ?? 30) + ganho);
      return insta ? `Panfleto na padaria e post no Instagram: ${ganho >= 6 ? 'a agenda encheu nas semanas seguintes' : 'apareceram uns clientes novos'}.` : `Panfleto na padaria, cartão no mercado: ${ganho >= 6 ? 'o telefone tocou mais do que o normal' : 'apareceram uns clientes novos'}.`;
    }
    case 'caprichar': {
      estresse(4);
      const deu = r.chance(0.6 + (habilidade(v, frenteDoTrabalho(v) ?? 'manual') / 300));
      if (deu) { e.clientela = clamp((e.clientela ?? 30) + 4); return 'O cliente mais chato da sua vida saiu satisfeito — e mandou dois amigos.'; }
      e.clientela = clamp((e.clientela ?? 30) - 2);
      return 'Não teve jeito: o cliente reclamou de tudo e falou mal para quem quis ouvir.';
    }
    case 'treino_finalizacao': case 'treino_tatico': case 'treino_fisico': {
      const es = v.caminhos.esporte!;
      estresse(3);
      if (oque === 'treino_fisico') { v.corpo.forma = clamp(v.corpo.forma + 4); praticar(v, r, es.modalidade, 0.1, 1); v.fatos['oficio:fisico'] = v.t; }
      else praticar(v, r, es.modalidade, oque === 'treino_finalizacao' ? 0.35 : 0.25, 1.1);
      if (oque === 'treino_tatico') es.reputacao = clamp((es.reputacao ?? 40) + 1);
      return oque === 'treino_fisico' ? 'Academia antes do treino, tiro de cem metros depois. O corpo reclamou — e respondeu.' : oque === 'treino_tatico' ? 'Uma hora a mais com a comissão, prancheta na mão. O treinador passou a te chamar para explicar o posicionamento.' : 'Duzentos chutes depois que todo mundo foi embora. Os últimos entraram todos.';
    }
    case 'video': {
      const es = v.caminhos.esporte!;
      praticar(v, r, es.modalidade, 0.15, 1);
      es.reputacao = clamp((es.reputacao ?? 40) + 1);
      return 'Três jogos do adversário, pausando a cada lance. No domingo, você sabia para onde o lateral ia antes dele.';
    }
    case 'fisio': {
      pagar(v, preco(v, 1200));
      const l = lesaoAtiva(v)!;
      l.lesao.tFim = Math.max(v.t, l.lesao.tFim - 2);
      return 'Duas sessões por dia, gelo, elástico, paciência. A volta ficou dois meses mais perto.';
    }
    case 'torcida': {
      if (v.notoriedade) v.notoriedade.valor = clamp(v.notoriedade.valor + 1);
      v.fatos['vis_boa'] = v.t;
      return 'Meia hora de fotos e autógrafos. Um menino com a sua camisa não acreditou que era você.';
    }
  }
}
