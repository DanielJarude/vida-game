/**
 * A vida política em processos. O mundo convida, a crise acontece, o
 * apoiador pede; a reação é sempre do jogador. Nada aqui tem lado: os
 * partidos são os reais, só pelo nome (`dados/partidos`), sem ideologia nem
 * bônus; as prioridades são metas de gestão, e as
 * decisões são sobre COMO fazer política (rua, redes, alianças, barganha,
 * franqueza, atalho) — nunca sobre o que defender ideologicamente.
 */

import { paisDaVida } from '../mundo/vida';
import { podeTentar } from '../plausibilidade';
import type { Conteudo, Ctx, Resultado } from './base';
import type { CargoEletivo, Vida, VidaPolitica } from '../tipos';
import { clamp } from '../rng';
import { escrever, filhos, idadePessoa, lembrarCom, parceiro } from '../nucleo';
import { estresse, custa } from './efeitos';
import { pagar } from '../sistemas/dinheiro';
import { municipio } from '../dados/lugares';
import { abalar } from '../sistemas/abalo';
import { marcar } from '../sistemas/marcas';
import { valorDoNegocio } from '../sistemas/negocio';
import {
  calendarioDoMandato, tiposDeEleicao, criarAliado, custoDeCampanha, definirBandeira, eleicaoNaJanela, encerrarVidaPolitica, entrarNaPolitica, NOME_PRIORIDADE, nomeCargo, ORDEM_CARGOS, ORIGENS, partidosDoPais, existeCargo, cargoNoPais,
  podeConcorrer, PRIORIDADES, registrarCandidatura, registrarNoMandato, renunciar, voltarAoTrabalho, perspectiva, regraDaTroca, trocarDePartido } from '../sistemas/politica';
import { anoDe } from '../tempo';
import { registrarMomento } from '../sistemas/situacoes';
import { habilidade } from '../sistemas/frentes';
import { dinheiro as fmt } from '../texto';
import { aoPartido, nomeCompletoPartido, oPartido, partidoDe, peloPartido } from '../dados/partidos';

const doPartido = (s: string | undefined) => { const p = partidoDe(s); return p ? `${p.artigo === 'a' ? 'da' : 'do'} ${p.chamado}` : 'do partido'; };

const deHoje = (c: Ctx, chave: string) => c.v.fatos[chave] !== undefined && c.v.fatos[chave] === c.v.t;
const pol = (c: Ctx) => c.v.caminhos.politica!;
const comFamilia = (v: Vida) => !!parceiro(v)?.vin.convivio.includes('casa') || filhos(v).some(f => v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(v, f) < 18);
const etapa = (c: Ctx) => c.v.caminhos.politica?.campanha?.etapa ?? 0;
const origemDoConvite = (c: Ctx): VidaPolitica['origem'] => ORIGENS[c.v.fatos['pol_origem'] ?? 0] ?? 'convite';

const TEXTO_CONVITE: Record<VidaPolitica['origem'], (c: Ctx) => string> = {
  comunidade: () => 'A associação de moradores vai renovar a diretoria e pediram o seu nome: dizem que é você quem resolve as coisas no bairro.',
  estudantil: () => 'Chamaram você para encabeçar a chapa do diretório estudantil. Na última reunião, um vereador da cidade apareceu para ouvir.',
  sindicato: () => 'O sindicato da categoria quer você na diretoria: gente que conhece o trabalho por dentro.',
  causa: () => 'Depois do que aconteceu, um grupo de famílias que passou pelo mesmo quer levar a causa à Câmara — e quer você na frente.',
  notoriedade: c => `Um partido procurou você: nome conhecido em ${municipio(c.v.moradia.municipioId).nome}. Querem saber se toparia entrar na vida pública.`,
  empresario: () => 'A associação comercial quer você na diretoria — e, no café depois da reunião, alguém sugeriu que você pensasse em algo maior.',
  servidor: () => 'Colegas de muitos anos de serviço acham que você deveria representá-los na política.',
  convite: () => 'Uma liderança do bairro chamou você para uma reunião "sobre o futuro da cidade".',
  decisao: () => 'Você resolveu procurar a vida política.'
};

/**
 * Os três partidos que conversaram com você nesta cidade, neste ano
 * (determinístico). A ordem é o tamanho do DIRETÓRIO LOCAL — grande, médio,
 * pequeno — sorteado pela cidade: não diz nada sobre o partido no país.
 */
function partidosOferecidos(c: Ctx): string[] {
  let h = anoDe(c.v.t);
  for (const ch of c.v.moradia.municipioId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out: string[] = [];
  const lista = partidosDoPais(paisDaVida(c.v));
  // O passo precisa ser primo com o tamanho da lista (7 partidos do espectro: passo 7 voltaria sempre ao mesmo). No Brasil, 7 de sempre.
  const passo = lista.length % 7 === 0 ? 3 : 7;
  for (let k = 0; out.length < Math.min(3, lista.length) && k < 200; k++) { const x = lista[(h + k * passo) % lista.length]; if (!out.includes(x)) out.push(x); }
  return out;
}

/** Os partidos que conversariam sobre uma troca (sem o atual), com o tamanho do diretório daqui. */
function oferecidosParaTroca(c: Ctx): { sigla: string; porte: number }[] {
  const atual = pol(c).partido;
  let h = anoDe(c.v.t) * 17 + 5;
  for (const ch of c.v.moradia.municipioId + (atual ?? '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out: { sigla: string; porte: number }[] = [];
  const lista = partidosDoPais(paisDaVida(c.v));
  const passo = lista.length % 11 === 0 ? 3 : 11;
  for (let k = 0; out.length < 3 && k < 60; k++) { const x = lista[(h + k * passo) % lista.length]; if (x !== atual && !out.some(o => o.sigla === x)) out.push({ sigla: x, porte: out.length }); }
  return out;
}

const PORTE_CURTO = ['diretório grande aqui', 'diretório médio aqui', 'diretório pequeno aqui'];
const noPartido = (s?: string) => { const x = partidoDe(s); return x ? `${x.artigo === 'a' ? 'na' : 'no'} ${x.chamado}` : 'no partido'; };
const anosNoPartido = (c: Ctx) => { const n = Math.max(0, Math.floor((c.v.t - (pol(c).tFiliacao ?? c.v.t)) / 12)); return n <= 1 ? 'pouco mais de um ano' : `${n} anos`; };

/** O que a troca muda, dito antes: o mandato (pela regra), a base, a próxima eleição. */
function consequenciaDaTroca(c: Ctx, o: { sigla: string; porte: number } | undefined): string {
  const regra = regraDaTroca(c.v);
  const partes: string[] = [];
  if (regra.como === 'fora_da_janela') partes.push(`Risco alto de perder o mandato: ${oPartido(pol(c).partido)} pode pedir a cadeira na Justiça Eleitoral (fidelidade partidária).`);
  else if (regra.como === 'majoritario') partes.push('O mandato fica com você.');
  else if (regra.como === 'janela') partes.push('Na janela partidária: o mandato fica com você.');
  partes.push('Parte da base, que votava pela legenda, fica para trás.');
  if (o) {
    const e = eleicaoNaJanela(c.v);
    partes.push(e && e.t - c.v.t < 6 ? `A filiação nova não chega a seis meses antes da eleição de ${e.ano}: essa, não dá para disputar.` : 'A filiação nova precisa de seis meses antes da próxima eleição.');
    partes.push(o.porte === 0 ? 'Um diretório grande dá estrutura na campanha.' : o.porte === 2 ? 'Um diretório pequeno dá espaço rápido, e pouca estrutura.' : 'Um diretório médio: estrutura razoável.');
  } else partes.push('Sem partido, não há candidatura até se filiar de novo.');
  return partes.join(' ');
}

const PORTE = ['o diretório daqui é grande, com estrutura e fila de gente esperando a vez', 'o diretório daqui é médio, organizado em alguns bairros', 'o diretório daqui é pequeno: precisa de nomes novos e dá espaço rápido'];

function filiar(c: Ctx, k: number): Resultado {
  const sigla = partidosOferecidos(c)[k];
  return {
    texto: `Assinou a ficha de filiação ${doPartido(sigla)}. Uma foto, um aperto de mão, um grupo de mensagens novo.`,
    memoria: `Filiou-se ${aoPartido(sigla)}.`,
    relevancia: 'biografia',
    efeito: () => { const p = pol(c); if (p.indicacaoMilitar && p.partido) { const aberto = (p.partidos ?? []).find(x => x.sigla === p.partido && x.tFim === undefined); if (aberto) aberto.tFim = c.v.t; } p.indicacaoMilitar = undefined; p.partido = sigla; p.tFiliacao = c.v.t; (p.partidos ??= []).push({ sigla, tInicio: c.v.t }); p.fase = p.fase === 'envolvido' ? 'filiado' : p.fase; c.v.fatos['pol_partido_porte'] = k; marcar(c.v, 'politica', `Filiou-se ${aoPartido(sigla)}.`, 2); }
  };
}

/** Militar da ativa: o partido escolhe o nome em convenção; não há ficha de filiação. */
function indicar(c: Ctx, k: number): Resultado {
  const sigla = partidosOferecidos(c)[k];
  return {
    texto: `${cap(oPartido(sigla))} vai levar o seu nome à convenção. Sem ficha, sem carteirinha: a farda continua até o registro.`,
    memoria: `Aceitou a indicação ${doPartido(sigla)} para disputar uma eleição, ainda na ativa.`,
    relevancia: 'biografia',
    efeito: () => { const p = pol(c); p.partido = sigla; p.tFiliacao = undefined; p.indicacaoMilitar = true; (p.partidos ??= []).push({ sigla, tInicio: c.v.t }); p.fase = p.fase === 'envolvido' ? 'filiado' : p.fase; c.v.fatos['pol_partido_porte'] = k; marcar(c.v, 'politica', `Indicado ${peloPartido(sigla)}, ainda na farda.`, 2); }
  };
}

/**
 * A pergunta da eleição para quem tem mandato: o texto sai do calendário do
 * mandato (`calendarioDoMandato`), o mesmo que abre a janela no motor. "Último
 * ano" só quando é mesmo o último; a eleição do meio do mandato é outra conversa.
 */
function textoDoMandatoNaEleicao(c: Ctx): string {
  const p = pol(c);
  const cal = calendarioDoMandato(c.v)!;
  const cargo = nomeCargo(c.v, cal.cargo);
  const e = cal.naJanela;
  if (!e || e.encerra) {
    const quando = cal.ultimoAno ? `O mandato de ${cargo} entra no último ano.` : `Em janeiro começa o último ano do mandato de ${cargo}, e a eleição de outubro de ${cal.eleicaoDoFim.ano} decide quem fica com o cargo.`;
    return `${quando} O partido quer saber o que você vai fazer — e a casa também.`;
  }
  const tipo = e.tipo === 'municipal' ? 'municipal' : 'geral';
  const regra = cargoNoPais(cal.cargo).executivo ? `Para disputar outro cargo, é preciso renunciar ao mandato de ${cargo} seis meses antes.` : `Dá para disputar outro cargo sem largar o mandato de ${cargo}.`;
  return `O mandato de ${cargo} vai até ${cal.anoFinal} (este é o ano ${cal.ano} de ${cal.anos}), mas em outubro de ${e.ano} tem eleição ${tipo}. ${regra} ${cap(oPartido(p.partido))} quer saber o que você vai fazer.`;
}

function cargoOpcao(cargo: CargoEletivo) {
  return {
    id: `cargo_${cargo}`,
    texto: (c: Ctx) => (pol(c).mandato?.cargo === cargo ? `Tentar a reeleição (${nomeCargo(c.v, cargo)})` : `Candidatar-se a ${nomeCargo(c.v, cargo)}`),
    disponivel: (c: Ctx) => {
      if (etapa(c) !== 0) return false;
      const e = eleicaoNaJanela(c.v);
      // Um degrau que o país não tem (ou que não cai nesta eleição) não aparece.
      if (!e || !existeCargo(cargo, paisDaVida(c.v)) || !tiposDeEleicao(e.ano).includes(cargoNoPais(cargo).tipo)) return false;
      const d = podeConcorrer(c.v, cargo, e.t);
      return d.grau === 'permitido' || d.grau === 'improvavel' || d.grau === 'irregular' ? true : (d.motivo ?? 'Não é possível.');
    },
    comportamento: undefined,
    consequencia: (c: Ctx) => { const e = eleicaoNaJanela(c.v); return e && tiposDeEleicao(e.ano).includes(cargoNoPais(cargo).tipo) && podeTentar(podeConcorrer(c.v, cargo, e.t)) ? perspectiva(c.v, cargo, e.t) : undefined; },
    resolver: (c: Ctx): Resultado => {
      const e = eleicaoNaJanela(c.v)!;
      const d = podeConcorrer(c.v, cargo, e.t);
      return { texto: `${d.motivo && d.grau === 'irregular' ? `${d.motivo} ` : ''}A candidatura está registrada. Agora, a campanha.`, memoria: null, reabrir: true, efeito: () => registrarCandidatura(c.v, cargo, e.t) };
    }
  };
}

function passo(c: Ctx, f: (x: NonNullable<VidaPolitica['campanha']>) => void, nota: number): void {
  const camp = pol(c).campanha;
  if (!camp) return;
  f(camp);
  camp.nota += nota;
  camp.etapa += 1;
}

const CARGO_OPCOES = ORDEM_CARGOS.map(cargoOpcao);

export const POLITICA: Conteudo[] = [
  {
    id: 'pol_convite', tipo: 'decisao', idade: [16, 76], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 1,
    quando: c => deHoje(c, 'pol_porta'),
    titulo: 'Um convite',
    texto: c => TEXTO_CONVITE[origemDoConvite(c)](c),
    opcoes: [
      { id: 'entrar', texto: 'Aceitar e entrar de cabeça', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'A primeira reunião foi numa sala abafada, com café de garrafa térmica. Você falou mais do que esperava.', memoria: 'Entrou na vida política.', relevancia: 'marco', efeito: () => { entrarNaPolitica(c.v, origemDoConvite(c), 1.2); const a = criarAliado(c.v, c.r); lembrarCom(c.v, a.id, 'Chamou você para a vida política.', 'inicio', 2); } }) },
      { id: 'pouco', texto: 'Ajudar, sem se expor',
        resolver: c => ({ texto: 'Você topou ajudar nos bastidores: planilha, telefone, carona.', memoria: null, efeito: () => { entrarNaPolitica(c.v, origemDoConvite(c), 0.7); } }) },
      { id: 'nao', texto: 'Agradecer e recusar', resolver: c => ({ texto: 'Você disse que política não era para você. Por enquanto.', memoria: null, efeito: () => { c.v.fatos['pol_recusas'] = (c.v.fatos['pol_recusas'] ?? 0) + 1; } }) }
    ]
  },
  {
    id: 'pol_aproximar', tipo: 'decisao', idade: [16, 90], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'A vida política',
    texto: () => 'Ninguém nasce candidato. Dá para começar de mais de um jeito.',
    opcoes: [
      { id: 'bairro', texto: 'Procurar a associação do bairro', comportamento: { sociabilidade: 1 },
        resolver: c => ({ texto: 'Numa terça à noite, você foi à reunião da associação. Na terceira, já estava na mesa.', memoria: 'Começou a participar da associação do bairro.', relevancia: 'biografia', efeito: () => { entrarNaPolitica(c.v, 'comunidade', 0.8); } }) },
      { id: 'causa', texto: 'Abraçar uma causa da cidade',
        resolver: c => ({ texto: 'Um abaixo-assinado, uma audiência pública, um grupo de mensagens que não para.', memoria: 'Abraçou uma causa da cidade.', relevancia: 'biografia', efeito: () => { entrarNaPolitica(c.v, 'causa', 0.6); } }) },
      { id: 'partido', texto: 'Procurar um partido da cidade',
        resolver: c => ({ texto: 'Você ligou para a sede de um partido. Marcaram um café.', memoria: null, efeito: () => { entrarNaPolitica(c.v, 'decisao', 1); } }) },
      { id: 'nao', texto: 'Deixar para depois', resolver: () => ({ texto: 'A ideia ficou.', memoria: null }) }
    ]
  },
  {
    id: 'pol_filiacao', tipo: 'decisao', idade: [16, 95], tema: 'escolha', manual: true, repetir: 0, biografica: true,
    titulo: 'A filiação',
    texto: c => `Três partidos conversaram com você. Nenhum pede que você mude o que pensa; todos querem saber quantos votos você traz. ${partidosOferecidos(c).map((p, k) => `${cap(oPartido(p))}: ${PORTE[k]}.`).join(' ')}`,
    opcoes: [
      ...[0, 1, 2].map(k => ({ id: `p${k}`, texto: (c: Ctx) => `Filiar-se ${aoPartido(partidosOferecidos(c)[k])}`, consequencia: (c: Ctx) => nomeCompletoPartido(partidosOferecidos(c)[k]), resolver: (c: Ctx) => filiar(c, k) })),
      { id: 'nenhum', texto: 'Ainda não se filiar', resolver: () => ({ texto: 'Você disse que ia pensar.', memoria: null }) }
    ]
  },
  {
    id: 'pol_indicacao', tipo: 'decisao', idade: [18, 95], tema: 'escolha', manual: true, repetir: 0, biografica: true,
    titulo: 'A indicação',
    texto: c => `Farda não se filia — mas pode disputar, se um partido escolher o seu nome na convenção. Três partidos toparam conversar. ${partidosOferecidos(c).map((p, k) => `${cap(oPartido(p))}: ${PORTE[k]}.`).join(' ')}`,
    opcoes: [
      ...[0, 1, 2].map(k => ({ id: `p${k}`, texto: (c: Ctx) => `Aceitar a indicação ${doPartido(partidosOferecidos(c)[k])}`, consequencia: (c: Ctx) => `${nomeCompletoPartido(partidosOferecidos(c)[k])} — sem ficha de filiação: você segue na ativa até registrar a candidatura.`, resolver: (c: Ctx) => indicar(c, k) })),
      { id: 'nenhum', texto: 'Ainda não aceitar nenhuma', resolver: () => ({ texto: 'Você agradeceu e disse que ia pensar.', memoria: null }) }
    ]
  },
  {
    id: 'pol_escandalo', tipo: 'decisao', idade: [16, 99], tema: 'escolha', prioritario: true, prioridade: 8, repetir: 0,
    quando: c => deHoje(c, 'pol_escandalo') && !!c.v.caminhos.politica?.escandalo && !c.v.caminhos.politica.escandalo.resposta,
    titulo: 'Virou notícia',
    texto: c => {
      const p = pol(c);
      const e = p.escandalo!;
      const oque = e.tipo === 'caso' ? 'o caso' : e.tipo === 'prisao' ? 'a prisão' : 'o processo';
      const par = parceiro(c.v);
      return `O telefone não para: todo mundo quer saber d${oque.startsWith('a ') ? 'a' : 'o'} ${oque.slice(2)}. ${cap(oPartido(p.partido))} pediu uma posição até amanhã.${e.tipo === 'caso' && par ? ` Em casa, ${par.p.nome} lê as mesmas manchetes.` : ''}`;
    },
    opcoes: [
      { id: 'desculpas', texto: 'Vir a público e pedir desculpas', comportamento: { coragem: 1 },
        consequencia: () => 'Assumir diminui o peso na próxima eleição — e expõe ainda mais a vida de quem está perto.',
        resolver: c => ({ texto: 'Você leu uma nota curta, sem se esconder atrás de advogado. A repercussão foi grande — e depois foi diminuindo.', memoria: 'Pediu desculpas em público.', relevancia: 'biografia',
          efeito: () => { const p = pol(c); p.escandalo!.resposta = 'desculpas'; p.desgaste = clamp(p.desgaste - 6); const par = parceiro(c.v); if (p.escandalo!.tipo === 'caso' && par) par.vin.tensao = clamp(par.vin.tensao + 6); } }) },
      // Uma prisão não se nega: é registro público.
      { id: 'negar', texto: 'Negar tudo', comportamento: { empatia: -1 }, disponivel: c => pol(c).escandalo!.tipo !== 'prisao',
        consequencia: () => 'Se colar, passa; se não colar, pesa mais na próxima eleição do que o próprio fato.',
        resolver: c => ({ texto: 'Você negou. Parte da base acreditou; a imprensa, não.', memoria: 'Negou em público.', relevancia: 'biografia',
          efeito: () => { const p = pol(c); p.escandalo!.resposta = 'negou'; p.apoio = clamp(p.apoio + 2); } }) },
      { id: 'silencio', texto: 'Não falar do assunto',
        consequencia: () => 'O assunto esfria no tempo dele; na próxima eleição, pesa o que pesa.',
        resolver: c => ({ texto: 'Você não deu entrevista nenhuma. Em duas semanas, o assunto era outro — até a campanha.', memoria: null, efeito: () => { pol(c).escandalo!.resposta = 'silencio'; } }) },
      { id: 'renunciar', texto: c => `Renunciar ao mandato de ${pol(c).mandato ? nomeCargo(c.v, pol(c).mandato!.cargo) : ''}`, disponivel: c => (pol(c).mandato ? true : false),
        consequencia: () => 'O cargo acaba agora; o desgaste diminui, e a volta, se vier, é mais adiante.',
        resolver: c => ({ texto: 'Você entregou a carta de renúncia numa sexta-feira à tarde.', memoria: null, efeito: () => { const p = pol(c); p.escandalo!.resposta = 'desculpas'; renunciar(c.v, 'depois do escândalo'); voltarAoTrabalho(c.v, 'depois da renúncia'); p.desgaste = clamp(p.desgaste - 8); } }) }
    ]
  },
  {
    id: 'pol_troca_partido', tipo: 'decisao', idade: [16, 95], tema: 'escolha', manual: true, repetir: 0, biografica: true,
    titulo: 'Trocar de partido?',
    texto: c => {
      const p = pol(c);
      const regra = regraDaTroca(c.v);
      const ultima = p.historico[p.historico.length - 1];
      const pesou = ultima?.fatores?.find(k => k.id === 'partido' && k.valor < 0) ? ` Na última eleição, o diretório pequeno ${doPartido(p.partido)} pesou contra.` : '';
      const outros = oferecidosParaTroca(c);
      return `Há ${anosNoPartido(c)} você está ${noPartido(p.partido)}.${pesou} ${regra.texto} Outros partidos conversaram: ${outros.map(o => `${oPartido(o.sigla)} (${PORTE_CURTO[o.porte]})`).join(', ')}.`;
    },
    opcoes: [
      ...[0, 1, 2].map(k => ({
        id: `t${k}`, texto: (c: Ctx) => `Filiar-se ${aoPartido(oferecidosParaTroca(c)[k]?.sigla)}`,
        disponivel: (c: Ctx) => (oferecidosParaTroca(c)[k] ? true : false),
        consequencia: (c: Ctx) => consequenciaDaTroca(c, oferecidosParaTroca(c)[k]),
        resolver: (c: Ctx): Resultado => { const o = oferecidosParaTroca(c)[k]; return { texto: trocarDePartido(c.v, c.r, o.sigla, o.porte), memoria: null }; }
      })),
      { id: 'sair', texto: c => `Só sair ${doPartido(pol(c).partido)}, sem entrar em outro`, consequencia: c => consequenciaDaTroca(c, undefined), resolver: c => ({ texto: trocarDePartido(c.v, c.r, undefined, 1), memoria: null }) },
      { id: 'ficar', texto: c => `Ficar ${noPartido(pol(c).partido)}`, consequencia: () => 'Nada muda.', resolver: () => ({ texto: 'Você ficou. A troca ficou para outra hora.', memoria: null }) }
    ]
  },
  {
    id: 'pol_eleicao', tipo: 'decisao', idade: [16, 95], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 0,
    quando: c => deHoje(c, 'pol_eleicao') && !!c.v.caminhos.politica?.partido && !c.v.caminhos.politica.campanha,
    titulo: c => { const e = etapa(c); const cam = c.v.caminhos.politica?.campanha; return e === 0 ? `A eleição de ${eleicaoNaJanela(c.v)?.ano ?? anoDe(c.v.t)}` : `A campanha${cam ? ` para ${nomeCargo(c.v, cam.cargo)}` : ''} · ${e} de 3`; },
    texto: c => {
      const e = etapa(c);
      const p = pol(c);
      if (e === 0) return p.mandato ? textoDoMandatoNaEleicao(c) : `Em outubro tem eleição ${eleicaoNaJanela(c.v)?.tipo === 'municipal' ? 'municipal' : 'geral'}. ${cap(oPartido(p.partido))} quer saber se você vem.${comFamilia(c.v) ? ' Em casa, a pergunta é outra: vale o preço?' : ''}`;
      if (e === 1) return `De onde vem o dinheiro da campanha? Material, ${paisDaVida(c.v) === 'BR' ? 'carro de som, ' : ''}gente na rua: uma campanha como se deve custa uns ${fmt(custoDeCampanha(c.v, p.campanha!.cargo))}.`;
      if (e === 2) return 'Como chegar em quem vota?';
      return 'Faltam três semanas. O debate é quinta-feira.';
    },
    opcoes: [
      ...CARGO_OPCOES,
      { id: 'nao', texto: 'Não concorrer desta vez', disponivel: c => (etapa(c) === 0 && !pol(c).mandato ? true : false),
        resolver: c => ({ texto: 'Você disse ao partido que desta vez não. A próxima eleição fica no horizonte.', memoria: null, efeito: () => { delete c.v.fatos['pol_quer']; } }) },
      // O mesmo calendário do texto: só a eleição que encerra o mandato é "terminar e voltar"; a do meio do mandato é "seguir nele".
      { id: 'voltar', texto: c => (calendarioDoMandato(c.v)?.naJanela?.encerra === false ? `Não disputar: seguir no mandato de ${nomeCargo(c.v, pol(c).mandato!.cargo)} até o fim` : 'Não concorrer: terminar o mandato e voltar para a vida de antes'), disponivel: c => (etapa(c) === 0 && !!pol(c).mandato ? true : false),
        resolver: c => {
          const cal = calendarioDoMandato(c.v);
          const texto = cal?.naJanela?.encerra === false ? `Você fica onde está: o mandato segue até ${cal.anoFinal}.` : cal?.ultimoAno ? 'Você avisou que não vai disputar. O último ano do mandato segue com outra cabeça.' : 'Você avisou que não vai disputar. O último ano do mandato vai começar com outra cabeça.';
          return { texto, memoria: null };
        } },
      { id: 'encerrar', texto: 'Encerrar a vida pública ao fim do mandato', comportamento: { familia: 1 }, disponivel: c => (etapa(c) === 0 && !!pol(c).mandato ? true : false),
        resolver: c => ({ texto: 'Você anunciou que este é o último mandato. Houve quem chorasse na reunião.', memoria: 'Anunciou que não disputaria mais eleições.', relevancia: 'biografia', efeito: () => { c.v.fatos['pol_nao_concorre'] = c.v.t; } }) },
      // Etapa 1: o dinheiro.
      { id: 'fin_pequenas', texto: 'Só com doações pequenas e o fundo do partido', disponivel: c => etapa(c) === 1,
        resolver: c => ({ texto: 'Vaquinha, rifa, a cota do partido. Pouco dinheiro, nenhum dono.', memoria: null, reabrir: true, efeito: () => passo(c, x => { x.financiamento = 'pequenas'; }, pol(c).apoio >= 40 ? 3 : 0) }) },
      { id: 'fin_proprio', texto: c => `Pôr dinheiro do próprio bolso (${fmt(custoDeCampanha(c.v, pol(c).campanha?.cargo ?? 'vereador'))})`, comportamento: { coragem: 1 },
        disponivel: c => (etapa(c) !== 1 ? false : custa(c, custoDeCampanha(c.v, pol(c).campanha!.cargo), 'Não há esse dinheiro guardado.')),
        resolver: c => ({ texto: paisDaVida(c.v) === 'BR' ? 'O dinheiro da reserva virou santinho, carro de som e gasolina.' : 'O dinheiro da reserva virou panfleto, cartaz e gasolina.', memoria: null, reabrir: true, efeito: () => { const custo = custoDeCampanha(c.v, pol(c).campanha!.cargo); pagar(c.v, custo); passo(c, x => { x.financiamento = 'proprio'; x.gasto += custo; }, 8); } }) },
      { id: 'fin_empresario', texto: 'Aceitar o apoio de um empresário da cidade', comportamento: { impulsividade: 1 }, disponivel: c => etapa(c) === 1,
        resolver: c => ({ texto: 'Um empresário conhecido bancou boa parte da campanha. "Depois a gente conversa", ele disse.', memoria: null, reabrir: true, efeito: () => { c.v.fatos['pol_empresario'] = c.v.t; passo(c, x => { x.financiamento = 'empresario'; }, 10); } }) },
      // Etapa 2: a rua.
      { id: 'rua_porta', texto: 'Porta a porta, bairro por bairro', comportamento: { sociabilidade: 1 }, disponivel: c => etapa(c) === 2,
        resolver: c => ({ texto: 'Sapato gasto, voz rouca, café em cada casa. Em casa, você chegava depois das dez.', memoria: null, reabrir: true, efeito: () => { passo(c, x => { x.rua = 'porta'; }, 6 + Math.max(0, c.v.personalidade.tracos.sociabilidade) / 20); c.v.corpo.saude = clamp(c.v.corpo.saude - 2); estresse(c, 5); const par = parceiro(c.v); if (par) par.vin.tensao = clamp(par.vin.tensao + 4); for (const f of filhos(c.v)) if (c.v.vinculos[f.id]?.convivio.includes('casa') && idadePessoa(c.v, f) < 14) c.v.vinculos[f.id].presenca = clamp((c.v.vinculos[f.id].presenca ?? 50) - 3); } }) },
      { id: 'rua_redes', texto: 'Redes e vídeos', disponivel: c => etapa(c) === 2,
        resolver: c => ({ texto: 'Um vídeo por dia, uma live por semana, comentário respondido de madrugada.', memoria: null, reabrir: true, efeito: () => { passo(c, x => { x.rua = 'redes'; }, 4 + (pol(c).reputacao > 50 ? 4 : 0)); estresse(c, 3); } }) },
      { id: 'rua_aliancas', texto: 'Alianças com lideranças da região', disponivel: c => etapa(c) === 2,
        resolver: c => ({ texto: 'Almoços, telefonemas, fotos com quem tem voto. Cada apoio veio com um pedido.', memoria: null, reabrir: true, efeito: () => { const p = pol(c); p.desgaste = clamp(p.desgaste + 5); p.apoio = clamp(p.apoio + 5); criarAliado(c.v, c.r); passo(c, x => { x.rua = 'aliancas'; }, 7); } }) },
      // Etapa 3: o tom.
      { id: 'tom_propostas', texto: 'Falar das propostas', disponivel: c => etapa(c) === 3,
        resolver: c => ({ texto: 'No debate, você falou de rua, posto e creche, com número na mão. Não viralizou; convenceu.', memoria: null, efeito: () => passo(c, x => { x.tom = 'propostas'; }, 3 + (pol(c).prioridade ? 2 : 0)) }) },
      { id: 'tom_ataques', texto: 'Partir para cima do adversário', comportamento: { impulsividade: 1 }, disponivel: c => etapa(c) === 3,
        resolver: c => { const deu = c.r.chance(0.5); return { texto: deu ? 'O ataque colou: o adversário passou o resto da campanha se explicando.' : 'O ataque voltou contra você: o assunto da semana virou o seu tom.', memoria: null, tom: deu ? 'bom' : 'ruim', efeito: () => { pol(c).desgaste = clamp(pol(c).desgaste + 6); passo(c, x => { x.tom = 'ataques'; }, deu ? 7 : -6); } }; } },
      { id: 'tom_cautela', texto: 'Evitar polêmica e não errar', disponivel: c => etapa(c) === 3,
        resolver: c => ({ texto: 'Você não errou. Também não marcou.', memoria: null, efeito: () => passo(c, x => { x.tom = 'cautela'; }, 1) }) }
    ]
  },
  {
    id: 'pol_bandeira', tipo: 'decisao', idade: [16, 99], tema: 'escolha', manual: true, repetir: 0, biografica: true,
    titulo: c => (pol(c).mandato ? 'A prioridade do mandato' : pol(c).prioridade ? 'Trocar de bandeira?' : 'Uma bandeira'),
    texto: c => {
      const p = pol(c);
      if (p.mandato) return `${p.prioridade ? `Hoje, a prioridade é ${NOME_PRIORIDADE[p.prioridade]}. ` : 'O gabinete pergunta por onde começar. '}O que o mandato vai empurrar — e mostrar na próxima eleição?`;
      return `${p.prioridade ? `Até agora, a sua causa é ${NOME_PRIORIDADE[p.prioridade]}. ` : ''}Quem entra na política defendendo tudo acaba lembrado por nada. Por qual causa você quer ser conhecido?`.replace('conhecido', c.g('conhecido', 'conhecida', 'conhecide'));
    },
    opcoes: [
      ...PRIORIDADES.map(prio => ({
        id: `b_${prio}`,
        texto: () => cap(NOME_PRIORIDADE[prio]),
        disponivel: (c: Ctx) => (pol(c).prioridade === prio ? false : true),
        consequencia: (c: Ctx) => (pol(c).prioridade ? (pol(c).mandato ? 'Mudar a prioridade no meio do mandato atrasa o que estava andando.' : 'Trocar de causa confunde quem acompanhava: um pouco de base se perde.') : undefined),
        // A bandeira grava a própria linha na Linha da Vida (escolher e trocar dizem coisas diferentes).
        resolver: (c: Ctx): Resultado => ({ texto: definirBandeira(c.v, prio), memoria: null })
      })),
      { id: 'nao', texto: 'Ainda não', resolver: () => ({ texto: 'Você disse que ia pensar melhor.', memoria: null }) }
    ]
  },
  {
    id: 'pol_negociar', tipo: 'decisao', idade: [16, 95], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'Negociar apoio',
    texto: c => `${c.p.aliado ? c.p.aliado.nome : 'Uma liderança do partido'} topa trazer gente para o seu lado. Em troca, quer ouvir o que você oferece.`,
    opcoes: [
      { id: 'pauta', texto: 'Prometer apoio a uma pauta do grupo',
        resolver: c => ({ texto: 'Apertaram as mãos. Agora a pauta deles também é sua.', memoria: null, efeito: () => { const p = pol(c); p.apoio = clamp(p.apoio + 8); p.desgaste = clamp(p.desgaste + 3); } }) },
      { id: 'espaco', texto: 'Prometer espaço na equipe, se der certo', comportamento: { impulsividade: 1 },
        resolver: c => ({ texto: 'Um nome para um cargo, se você ganhar. A conta chega depois.', memoria: null, efeito: () => { const p = pol(c); p.apoio = clamp(p.apoio + 11); p.desgaste = clamp(p.desgaste + 5); c.v.fatos['pol_divida'] = c.v.t; } }) },
      { id: 'nada', texto: 'Recusar barganhas: apoio só pelo trabalho', comportamento: { independencia: 1 },
        resolver: c => ({ texto: 'Ouviram com respeito. Alguns vieram mesmo assim.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio + 2); } }) }
    ]
  },
  {
    id: 'pol_crise', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 3, repetir: 0,
    quando: c => !!c.v.caminhos.politica?.mandato?.crise && c.v.caminhos.politica.mandato.crise.t === c.v.t,
    titulo: c => ({ chuva: 'A chuva', greve: 'A greve', verba: 'O dinheiro que não fecha', obra: 'A obra parada', aliado: 'O aliado no noticiário', votacao: 'A votação', pedido: 'O pedido' } as Record<string, string>)[crise(c)] ?? 'Uma crise',
    texto: c => (({
      chuva: 'Uma chuva de uma noite derrubou uma barreira e alagou três bairros. Tem gente dormindo na escola.',
      greve: 'Os professores entraram em greve: o reajuste prometido não veio.',
      verba: 'A arrecadação caiu e o dinheiro não fecha a folha do fim do ano.',
      obra: 'A obra que era a vitrine do mandato parou: a empreiteira sumiu no meio do caminho.',
      aliado: 'Um aliado próximo apareceu no noticiário num caso mal explicado. Os jornalistas ligam para você.',
      votacao: 'O seu grupo quer o seu voto num projeto que contraria o que você prometeu na campanha.',
      pedido: 'Um apoiador de campanha pede "uma força" num contrato público. Diz que é tudo dentro da lei.'
    } as Record<string, string>)[crise(c)] ?? 'Uma crise.') + lembrancaDaCrise(c),
    opcoes: [
      // As três respostas mudam coisas DIFERENTES (não só a frase final): a aprovação, a base, o desgaste, o nome, o
      // que sai do papel e a memória. E o desfecho sai do estado (liderança, cabeça, capital político, base), não de
      // uma moeda fixa.
      { id: 'frente', texto: 'Ir até lá e assumir a frente', comportamento: { coragem: 1 }, disponivel: c => ['chuva', 'greve', 'verba', 'obra'].includes(crise(c)) || false,
        consequencia: () => 'A base vê você lá. Se não resolver, a foto vira cobrança.',
        resolver: c => {
          const p = pol(c);
          const deu = c.r.chance(chanceDaCrise(c, (habilidade(c.v, 'lideranca') - 40) / 40 + c.v.personalidade.tracos.coragem / 200 + (p.apoio - 40) / 80 - p.desgaste / 120));
          const fim = ({ greve: deu ? 'A greve acabou num acordo costurado por você, na mesa com o sindicato.' : 'A greve continuou depois que as câmeras saíram.', chuva: deu ? 'As famílias voltaram para casa em uma semana; a barreira foi refeita.' : 'O abrigo na escola durou um mês.', verba: deu ? 'A folha fechou: você cortou na própria carne e explicou na rua.' : 'A folha atrasou duas semanas.', obra: deu ? 'A obra recomeçou com outra empresa em três meses.' : 'A obra continuou parada.' } as Record<string, string>)[crise(c)] ?? '';
          return { texto: deu ? `Você passou a madrugada no lugar. A foto correu a cidade — e o problema andou. ${fim}` : `Você foi, falou, prometeu. ${fim}`, memoria: null, tom: deu ? 'bom' : 'ruim',
            efeito: () => { p.apoio = clamp(p.apoio + (deu ? 4 : -1)); p.reputacao = clamp(p.reputacao + (deu ? 2 : 0)); if (deu && p.mandato) p.mandato.feito += 1; fecharCrise(c, deu ? 6 : 1, deu ? 2 : 6, 6, 'assumiu a frente', deu ? `Assumiu a frente ${daCrise(c)} — e resolveu: ${fim.charAt(0).toLowerCase()}${fim.slice(1)}` : undefined); } };
        } },
      { id: 'tecnica', texto: 'Montar uma equipe técnica e explicar os números', comportamento: { disciplina: 1 }, disponivel: c => ['chuva', 'greve', 'verba', 'obra'].includes(crise(c)) || false,
        consequencia: () => 'Menos aplauso, menos vaia. A base pode achar frio.',
        resolver: c => {
          const p = pol(c);
          const deu = c.r.chance(chanceDaCrise(c, (c.v.mente.cognicao - 50) / 40 + c.v.personalidade.tracos.disciplina / 200 + Math.min(8, (c.v.t - (p.mandato?.tInicio ?? c.v.t)) / 12) / 16));
          const fim = ({ greve: deu ? 'Com os números na mesa, o reajuste saiu parcelado e as aulas voltaram.' : 'Os números não convenceram o sindicato; a greve seguiu.', chuva: deu ? 'O plano de contenção das encostas virou obra no orçamento.' : 'O plano ficou no papel.', verba: deu ? 'O corte técnico fechou a conta sem atrasar salário.' : 'A conta não fechou mesmo assim.', obra: deu ? 'A nova licitação saiu rápida e limpa.' : 'A licitação nova empacou.' } as Record<string, string>)[crise(c)] ?? '';
          return { texto: `Planilha, entrevista, calendário. ${fim}`, memoria: null, tom: deu ? 'bom' : 'neutro',
            efeito: () => { p.apoio = clamp(p.apoio - 2); if (deu && p.mandato) p.mandato.feito += 1; fecharCrise(c, deu ? 3 : -1, deu ? -3 : 1, 3, 'montou uma equipe técnica', undefined); } };
        } },
      { id: 'culpar', texto: 'Culpar a gestão anterior', comportamento: { impulsividade: 1 }, disponivel: c => ['chuva', 'greve', 'verba', 'obra'].includes(crise(c)) || false,
        consequencia: () => 'Tira o peso de agora. O eleitor pode cobrar a solução.',
        resolver: c => {
          const p = pol(c);
          // Colar depende de quanto tempo de cargo já se tem: no primeiro ano, a culpa do antecessor convence; no quarto, não.
          const anosNoCargo = (c.v.t - (p.mandato?.tInicio ?? c.v.t)) / 12;
          const colou = c.r.chance(chanceDaCrise(c, (p.reputacao - 40) / 60 - anosNoCargo / 2 + 0.4));
          return { texto: colou ? 'A culpa colou no outro — por enquanto. O problema continua lá.' : 'Ninguém quis saber de quem era a culpa: queriam solução. O vídeo da entrevista virou piada.', memoria: null, tom: colou ? 'neutro' : 'ruim',
            efeito: () => { p.apoio = clamp(p.apoio + (colou ? 1 : -3)); if (!colou) c.v.fatos['vis_polemica'] = c.v.t; fecharCrise(c, colou ? 2 : -5, colou ? 4 : 5, 2, 'culpou a gestão anterior', undefined); } };
        } },
      { id: 'afastar', texto: 'Afastar o aliado', comportamento: { coragem: 1 }, disponivel: c => crise(c) === 'aliado' || false,
        resolver: c => ({ texto: 'Você anunciou o afastamento antes do fim do dia. Parte do grupo nunca perdoou.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio - 6); fecharCrise(c, 5, 0, 4, 'afastou o aliado'); } }) },
      { id: 'defender', texto: 'Defender o aliado', disponivel: c => crise(c) === 'aliado' || false,
        resolver: c => ({ texto: 'Você disse que confiava nele. A oposição guardou o vídeo.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio + 3); fecharCrise(c, -6, 6, 3, 'defendeu o aliado'); } }) },
      { id: 'promessa', texto: 'Votar como prometeu na campanha', comportamento: { independencia: 1 }, disponivel: c => crise(c) === 'votacao' || false,
        resolver: c => ({ texto: 'Você votou contra o próprio grupo. No corredor, silêncio; na rua, respeito.', memoria: 'Votou contra o próprio grupo para cumprir uma promessa de campanha.', relevancia: 'biografia', efeito: () => { pol(c).apoio = clamp(pol(c).apoio - 5); fecharCrise(c, 4, 0, 2, 'votou como prometeu'); } }) },
      { id: 'grupo', texto: 'Votar com o grupo', disponivel: c => crise(c) === 'votacao' || false,
        resolver: c => ({ texto: 'O projeto passou. Na rua, alguém lembrou do que você tinha dito.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio + 5); fecharCrise(c, -4, 2, 1, 'votou com o grupo'); } }) },
      { id: 'faltar', texto: 'Não aparecer na sessão', disponivel: c => crise(c) === 'votacao' || false,
        resolver: c => ({ texto: 'Você não foi. Os dois lados notaram.', memoria: null, efeito: () => fecharCrise(c, -2, 3, 1, 'não apareceu na sessão') }) },
      { id: 'recusar', texto: 'Recusar o pedido', comportamento: { coragem: 1 }, disponivel: c => crise(c) === 'pedido' || false,
        resolver: c => ({ texto: 'Você disse que não. O apoiador foi procurar outro nome para a próxima eleição.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio - 4); fecharCrise(c, 0, 0, 2, 'recusou o pedido'); } }) },
      { id: 'ajudar', texto: 'Ajudar, "dentro da lei", como ele diz', comportamento: { impulsividade: 1, generosidade: -1 }, disponivel: c => crise(c) === 'pedido' || false,
        resolver: c => ({ texto: 'Um telefonema, uma reunião, um contrato assinado. Nada no seu nome — por enquanto.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio + 4); c.v.fatos['pol_risco'] = c.v.t; fecharCrise(c, 0, 2, 1, 'ajudou o apoiador'); } }) }
    ]
  },
  {
    id: 'pol_cobranca', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 4,
    quando: c => !!c.v.caminhos.politica?.mandato && (c.v.fatos['pol_empresario'] !== undefined || c.v.fatos['pol_divida'] !== undefined) && c.v.t - c.v.caminhos.politica.mandato.tInicio >= 12 && c.r.chance(0.5),
    titulo: 'A conta da campanha',
    texto: c => (c.v.fatos['pol_empresario'] !== undefined ? 'O empresário que bancou a campanha marcou um almoço. Quer "conversar sobre uma licitação".' : 'A liderança que trouxe votos quer o cargo que você prometeu — para um sobrinho.'),
    opcoes: [
      { id: 'nao', texto: 'Dizer que não', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'O almoço acabou antes da sobremesa. Na próxima eleição, esse apoio não vem.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio - 8); delete c.v.fatos['pol_empresario']; delete c.v.fatos['pol_divida']; } }) },
      { id: 'pagar', texto: 'Pagar a conta', comportamento: { impulsividade: 1, generosidade: -1 },
        resolver: c => ({ texto: 'Você cumpriu o combinado. Ninguém viu. Por enquanto.', memoria: null, efeito: () => { pol(c).apoio = clamp(pol(c).apoio + 4); c.v.fatos['pol_risco'] = c.v.t; delete c.v.fatos['pol_empresario']; delete c.v.fatos['pol_divida']; } }) },
      { id: 'enrolar', texto: 'Enrolar', resolver: c => ({ texto: 'Você disse que ia ver. A cobrança volta.', memoria: null, efeito: () => { pol(c).desgaste = clamp(pol(c).desgaste + 3); } }) }
    ]
  },
  {
    id: 'pol_conflito', tipo: 'decisao', idade: [18, 95], tema: 'escolha', prioritario: true, prioridade: 2, repetir: 0,
    quando: c => deHoje(c, 'pol_conflito') && !!c.v.caminhos.negocio?.passivo,
    titulo: 'O negócio e o mandato',
    texto: c => `Um jornal da cidade perguntou se ${c.v.caminhos.negocio!.nome}, que ainda é seu, tem negócio com o poder público. Não tem — mas a pergunta ficou no ar.`,
    opcoes: [
      { id: 'vender', texto: 'Vender o negócio e encerrar a dúvida',
        resolver: c => ({ texto: 'Você vendeu. Doeu menos do que parecia.', memoria: null, efeito: () => { const n = c.v.caminhos.negocio!; const valor = valorDoNegocio(c.v, n); c.v.financas.conta += valor + Math.max(0, n.caixa ?? 0); n.caixa = 0; n.estado = 'fechado'; n.tFim = c.v.t; n.passivo = undefined; n.equipe = []; escrever(c.v, { texto: `Vendeu ${n.nome} por ${fmt(valor)} para afastar qualquer conflito com o mandato.`, relevancia: 'marco', tema: 'trabalho', escolha: true }); marcar(c.v, 'negocio_fechado', `Vendeu ${n.nome} durante o mandato.`, 2); if (c.v.caminhos.politica?.anterior) c.v.caminhos.politica.anterior.negocio = undefined; } }) },
      { id: 'explicar', texto: 'Explicar publicamente, com os documentos', comportamento: { coragem: 1 },
        resolver: c => ({ texto: 'Você mostrou os papéis. A maioria acreditou.', memoria: null, efeito: () => { pol(c).desgaste = clamp(pol(c).desgaste + 2); } }) },
      { id: 'ignorar', texto: 'Não responder',
        resolver: c => ({ texto: 'A pergunta continuou no ar — e virou a pergunta de outros jornais.', memoria: null, efeito: () => { pol(c).desgaste = clamp(pol(c).desgaste + 6); if (c.v.caminhos.politica!.mandato) c.v.caminhos.politica!.mandato.aprovacao = clamp(c.v.caminhos.politica!.mandato.aprovacao - 3); } }) }
    ]
  },
  {
    id: 'pol_deixar', tipo: 'decisao', idade: [16, 99], tema: 'escolha', manual: true, repetir: 0,
    titulo: 'Sair da vida pública?',
    texto: c => { const p = pol(c); const cal = calendarioDoMandato(c.v); return p.mandato && cal ? `${cal.ultimoAno ? `É o último ano do mandato (vai até o fim de ${cal.anoFinal}).` : `O mandato vai até ${cal.anoFinal}: ${cal.anos - cal.ano === 1 ? 'falta mais um ano' : `faltam mais ${cal.anos - cal.ano} anos`} depois deste.`} Quem votou em você espera até o fim.` : `${Math.max(1, Math.round((c.v.t - p.tInicio) / 12))} anos de reunião, campanha, telefone tocando.`; },
    opcoes: [
      { id: 'renunciar', texto: 'Renunciar ao mandato', comportamento: { independencia: 1 }, disponivel: c => (pol(c).mandato ? true : false),
        resolver: c => ({ texto: 'A carta de renúncia foi lida numa sessão esvaziada.', memoria: null, efeito: () => { renunciar(c.v, 'por decisão própria'); voltarAoTrabalho(c.v, 'depois da renúncia'); } }) },
      { id: 'renunciar_familia', texto: 'Renunciar pela família', comportamento: { familia: 2 }, disponivel: c => (pol(c).mandato && comFamilia(c.v) ? true : false),
        resolver: c => ({ texto: 'Você disse, na tribuna, que ia para casa. E foi.', memoria: 'Renunciou ao mandato para ficar com a família.', relevancia: 'marco', efeito: () => { encerrarVidaPolitica(c.v, 'pela família'); const par = parceiro(c.v); if (par) { par.vin.tensao = clamp(par.vin.tensao - 10); par.vin.proximidade = clamp(par.vin.proximidade + 5); } } }) },
      { id: 'terminar', texto: 'Terminar o mandato e não concorrer mais', disponivel: c => (pol(c).mandato ? true : false),
        resolver: c => ({ texto: 'Você cumpre até o último dia. Depois, fim.', memoria: 'Decidiu que este seria o último mandato.', relevancia: 'biografia', efeito: () => { c.v.fatos['pol_nao_concorre'] = c.v.t; } }) },
      { id: 'sair', texto: 'Sair da vida política', disponivel: c => (pol(c).mandato ? false : true),
        resolver: c => ({ texto: 'Você saiu do grupo de mensagens. Nos primeiros dias, o telefone ainda tocava.', memoria: null, efeito: () => encerrarVidaPolitica(c.v, 'por decisão própria') }) },
      { id: 'sair_familia', texto: 'Sair pela família', comportamento: { familia: 1 }, disponivel: c => (!pol(c).mandato && comFamilia(c.v) ? true : false),
        resolver: c => ({ texto: 'Os sábados voltaram a ser de casa.', memoria: null, efeito: () => { encerrarVidaPolitica(c.v, 'pela família'); const par = parceiro(c.v); if (par) par.vin.tensao = clamp(par.vin.tensao - 6); } }) },
      { id: 'ficar', texto: 'Continuar', resolver: () => ({ texto: 'Amanhã tem reunião às sete.', memoria: null }) }
    ]
  }
];

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

function crise(c: Ctx): string { return c.v.caminhos.politica?.mandato?.crise?.tipo ?? ''; }

const NOME_CRISE: Record<string, string> = { chuva: 'a chuva que alagou os bairros', greve: 'a greve dos professores', verba: 'o dinheiro que não fechava', obra: 'a obra parada', aliado: 'o aliado no noticiário', votacao: 'a votação contra a promessa', pedido: 'o pedido de um apoiador' };
const daCrise = (c: Ctx) => (NOME_CRISE[crise(c)] ?? 'uma crise').replace(/^a /, 'na ').replace(/^o /, 'no ');
/** A chance de a resposta dar certo: o estado (o que a pessoa é e o que o mandato tem), não uma moeda fixa. */
const chanceDaCrise = (_c: Ctx, x: number) => 1 / (1 + Math.exp(-(x + 0.5) * 1.6));

/**
 * Quando a mesma crise volta (a segunda greve, outra chuva), a cena lembra do
 * que aconteceu da outra vez — o que se fez e como saiu — pelos marcos do
 * mandato (deste e dos anteriores).
 */
function lembrancaDaCrise(c: Ctx): string {
  const nome = NOME_CRISE[crise(c)];
  if (!nome) return '';
  const p = pol(c);
  const marcos = [...(p.historico ?? []).flatMap(h => h.marcos ?? []), ...(p.mandato?.marcos ?? [])];
  const antes = [...marcos].reverse().find(m => m.includes(nome));
  if (!antes) return '';
  const ano = /^(\d{4})/.exec(antes)?.[1];
  const como = /\(([^)]+)\)/.exec(antes)?.[1];
  const saiu = /saiu maior/.test(antes) ? 'saiu maior do que entrou' : /saiu mal/.test(antes) ? 'saiu mal' : 'atravessou sem ganhar nem perder muito';
  return ` De novo. Em ${ano}, você ${como ?? 'respondeu'} — e ${saiu}.`;
}

/**
 * A crise se resolve (bem ou mal): aprovação, desgaste, cabeça — e a memória:
 * o marco no mandato (com a resposta escolhida, que a próxima crise do mesmo
 * tipo lê), o registro nos momentos da carreira (a crise É o momento do ano)
 * e, quando marca, a Linha da Vida.
 */
function fecharCrise(c: Ctx, aprovacao: number, desgaste: number, cabeca: number, como: string, memoria?: string): void {
  const p = pol(c);
  const m = p.mandato;
  if (!m) return;
  m.aprovacao = clamp(m.aprovacao + aprovacao);
  const tipo = m.crise?.tipo ?? '';
  const nome = NOME_CRISE[tipo] ?? 'uma crise';
  const saiu = aprovacao >= 4 ? 'saiu maior do que entrou' : aprovacao <= -4 ? 'saiu mal' : 'atravessou sem ganhar nem perder muito';
  registrarNoMandato(c.v, `${anoDe(c.v.t)} · ${nome} (${como}): ${saiu}`);
  registrarMomento(c.v, { id: `pol_crise_${tipo}`, t: c.v.t, trajetoria: 'politica', intencao: como.charAt(0).toUpperCase() + como.slice(1), desfecho: aprovacao >= 5 ? 'otimo' : aprovacao >= 1 ? 'bom' : aprovacao > -4 ? 'ruim' : 'pessimo', texto: memoria ?? `${nome.charAt(0).toUpperCase()}${nome.slice(1)}: ${como}; ${saiu}.` });
  if (memoria) escrever(c.v, { texto: memoria.endsWith('.') ? memoria : `${memoria}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'bom', escolha: true });
  m.crise = undefined;
  p.desgaste = clamp(p.desgaste + desgaste);
  estresse(c, cabeca);
  if (aprovacao >= 5) abalar(c.v, 'a crise bem resolvida', 3, 0);
  if (aprovacao <= -4) abalar(c.v, 'a crise que saiu mal', -3, 3);
}
