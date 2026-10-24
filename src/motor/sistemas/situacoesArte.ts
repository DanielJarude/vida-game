/**
 * REWORK 11 · Fase D — cenas recorrentes de quem vive de música e de atuação, com CONTEXTO (a fase da carreira, o
 * sucesso ou o fracasso recente, a banda e quem está nela) e consequência que fica (o público, o nome, a banda que
 * perde alguém ou acaba, a relação com o colega, o dinheiro). Antes, a música tinha três cenas genéricas (A4: 32% dos
 * anos de músico sem cena nenhuma); a atuação não reagia ao que tinha acabado de acontecer.
 *
 * Módulo próprio (fora do pacote de textos, que está no limite): os modelos seguem o contrato de `situacoes` e entram em
 * `situacoes.MODELOS`. Sorteios do contexto com gerador próprio (`rngDe`): a sequência do ano não muda.
 */

import type { Desfecho, DesfechoModelo, Efeitos, Fator, ModeloSituacao } from './situacoes';
import type { Vida } from '../tipos';
import { clamp, rngDe } from '../rng';
import { idade, lembrarCom, escrever } from '../nucleo';
import { ocupacaoOuNula } from '../dados/ocupacoes';
import { habilidade } from './frentes';
import { praticar } from './frentes';

type Dados = Record<string, string | number>;
const F = (id: string, valor: number): Fator => ({ id, valor: Math.round(valor * 100) / 100 });
const D = (otimo: string, bom: string, ruim: string, pessimo: string, ef: Partial<Record<Desfecho, Efeitos>> = {}, mem: Partial<Record<Desfecho, string>> = {}): Record<Desfecho, DesfechoModelo> => ({
  otimo: { texto: otimo, efeitos: { nome: 2, humor: 3, ...ef.otimo }, memoria: mem.otimo },
  bom: { texto: bom, efeitos: { nome: 1, ...ef.bom }, memoria: mem.bom },
  ruim: { texto: ruim, efeitos: { estresse: 3, ...ef.ruim }, memoria: mem.ruim },
  pessimo: { texto: pessimo, efeitos: { nome: -2, estresse: 6, ...ef.pessimo }, memoria: mem.pessimo }
});

const trilha = (v: Vida) => (v.trabalho.atual ? ocupacaoOuNula(v.trabalho.atual.ocupacaoId)?.trilha : undefined);
const musico = (v: Vida) => trilha(v) === 'musica' || trilha(v) === 'orquestra';
const atua = (v: Vida) => trilha(v) === 'cena';
const tecnica = (v: Vida, d: 'musica' | 'teatro') => F('técnica', (habilidade(v, d) - 60) / 40);
const social = (v: Vida) => F('jeito com gente', v.personalidade.tracos.sociabilidade / 250);
const coragem = (v: Vida) => F('coragem', v.personalidade.tracos.coragem / 300);
const disciplina = (v: Vida) => F('disciplina', v.personalidade.tracos.disciplina / 300);
const cabeca = (v: Vida) => F('cabeça', -(v.mente.estresse - 45) / 110);
const nome = (v: Vida) => F('o nome', ((v.notoriedade?.valor ?? 0) - 30) / 150);
const recente = (v: Vida, chave: string, meses: number) => v.fatos[chave] !== undefined && v.t - v.fatos[chave] <= meses;

/* ------------------------------------------------------------ A banda */

/** A banda de música ativa, com pelo menos uma pessoa viva além de você. */
function banda(v: Vida) {
  const p = v.caminhos.arte;
  return p?.ativo && p.linguagem === 'musica' ? p : undefined;
}
function contextoDaBanda(v: Vida): Dados {
  const p = banda(v)!;
  const vivos = p.membros.filter(id => v.pessoas[id]?.vivo);
  const r = rngDe(v.id, 'banda_cena', v.t);
  const id = vivos.length ? r.pick(vivos) : '';
  return { banda: p.nome, quem: id, nome: id ? v.pessoas[id].nome : 'o baixista', motivo: r.pick(['um emprego fixo em outra cidade', 'um filho a caminho', 'cansaço da estrada', 'um convite de outra banda']) };
}
const doMembro = (v: Vida, d: Dados, f: (vin: NonNullable<Vida['vinculos'][string]>) => void) => { const vin = v.vinculos[String(d.quem)]; if (vin) f(vin); };
function saiDaBanda(v: Vida, d: Dados): void {
  const p = banda(v);
  if (!p) return;
  p.membros = p.membros.filter(id => id !== d.quem);
  p.publico = Math.max(0, p.publico - 4);
  if (d.quem) lembrarCom(v, String(d.quem), `Saiu de ${p.nome}.`, 'antigo', 1);
}
function acabarBanda(v: Vida, motivo: string): void {
  const p = banda(v);
  if (!p) return;
  p.ativo = false;
  p.tFim = v.t;
  escrever(v, { texto: `${p.nome} acabou: ${motivo}.`, relevancia: 'biografia', tema: 'trabalho', tom: 'ruim' });
}

/* ------------------------------------------------------------ Fase da carreira */

/** A agenda minguou: o último ano de palco foi fraco (ou nada saiu há três anos). */
function faseFria(v: Vida): boolean {
  const ult = v.caminhos.palcos?.slice(-1)[0];
  const obras = (v.caminhos.obras ?? []).filter(o => o.linguagem === 'musica');
  const semObra = !obras.length || v.t - obras[obras.length - 1].t >= 36;
  return (!!ult && ult.apresentacoes <= 4) || (semObra && v.t - (v.trabalho.atual?.tInicio ?? v.t) >= 36);
}
/** Uma música lançada há pouco que o público abraçou. */
function obraQuePegou(v: Vida) {
  return [...(v.caminhos.obras ?? [])].reverse().find(o => o.linguagem === 'musica' && v.t - o.t <= 24 && (o.comercial ?? o.recepcao) >= 2);
}
/** Os "nãos" recentes nos testes de elenco. */
const naosRecentes = (v: Vida) => v.caminhos.devolutivas.filter(x => x.tipo === 'arte' && !x.passou && v.t - x.t <= 24 && /Teste/.test(x.titulo)).length;

export const MODELOS_ARTE_11: ModeloSituacao[] = [
  /* ---------------------------------------------- Música: a banda */
  { id: 'mus_integrante_sai', trajetoria: 'cena', tema: 'mus_banda', recarga: 6, peso: () => 1.2,
    cabe: v => musico(v) && !!banda(v) && banda(v)!.membros.some(id => v.pessoas[id]?.vivo) && (v.t - banda(v)!.tInicio) >= 24,
    contexto: v => contextoDaBanda(v),
    titulo: (_v, d) => `${d.nome} quer sair de ${d.banda}`,
    texto: (_v, d) => `Depois do ensaio, ${d.nome} avisou: por causa de ${d.motivo}, quer sair de ${d.banda}. Há datas marcadas para os próximos meses.`,
    intencoes: [
      { id: 'convencer', texto: 'Tentar convencer a ficar', dica: 'Pode segurar a banda — ou só adiar a saída.', risco: 0.4, fatores: v => [social(v), F('a banda', ((banda(v)?.publico ?? 0) - 40) / 120)],
        desfechos: D('Ficou — e voltou com ideias novas para o disco.', 'Ficou até cumprir as datas; depois, conversam de novo.', 'Ficou de corpo; a cabeça já estava longe.', 'Saiu do mesmo jeito, magoado com a pressão.', {
          otimo: { extra: (v, d) => doMembro(v, d, vin => { vin.proximidade = clamp(vin.proximidade + 8); }) },
          pessimo: { extra: (v, d) => { saiDaBanda(v, d); doMembro(v, d, vin => { vin.tensao = clamp(vin.tensao + 20); }); } }
        }, { otimo: 'Convenceu um integrante a não sair da banda — e ele voltou com o melhor repertório da fase.' }) },
      { id: 'substituir', texto: 'Deixar ir e procurar alguém', dica: 'A banda segue; o som muda.', risco: 0.35, fatores: v => [tecnica(v, 'musica'), disciplina(v)],
        desfechos: D('O substituto encaixou na primeira semana: o show ficou melhor.', 'Uma fase de ajuste, e a banda seguiu.', 'Dois substitutos em seis meses; datas canceladas.', 'Ninguém encaixou: a banda perdeu o ritmo e parte do público.', {
          otimo: { extra: (v, d) => saiDaBanda(v, d) }, bom: { extra: (v, d) => saiDaBanda(v, d) },
          ruim: { dinheiro: -1500, extra: (v, d) => saiDaBanda(v, d) }, pessimo: { extra: (v, d) => { saiDaBanda(v, d); const p = banda(v); if (p) p.publico = Math.max(0, p.publico - 6); } }
        }) },
      { id: 'encerrar', texto: 'Encerrar a banda e seguir sozinho', dica: 'O nome é seu; o público era da banda.', risco: 0.5, fatores: v => [nome(v), coragem(v)],
        desfechos: D('A carreira solo pegou: parte do público veio junto.', 'Começo solo, devagar.', 'Sem a banda, a agenda caiu pela metade.', 'Sem a banda, quase ninguém lembrou de chamar.', {
          otimo: { extra: v => { acabarBanda(v, 'cada um seguiu o seu caminho, e você foi solo'); v.caminhos.papelMusica = 'solo'; } },
          bom: { extra: v => { acabarBanda(v, 'cada um seguiu o seu caminho'); v.caminhos.papelMusica = 'solo'; } },
          ruim: { extra: v => { acabarBanda(v, 'a saída de um integrante foi o fim'); v.caminhos.papelMusica = 'solo'; } },
          pessimo: { extra: v => { acabarBanda(v, 'a saída de um integrante foi o fim'); v.caminhos.papelMusica = 'solo'; } }
        }, { otimo: 'A banda acabou e a carreira solo pegou: parte do público veio junto.' }) }
    ] },
  { id: 'mus_conflito_criativo', trajetoria: 'cena', tema: 'mus_banda', recarga: 6,
    cabe: v => musico(v) && !!banda(v) && banda(v)!.membros.some(id => v.pessoas[id]?.vivo),
    contexto: v => contextoDaBanda(v),
    titulo: (_v, d) => `O rumo de ${d.banda}`,
    texto: (_v, d) => `${d.nome} quer gravar o que toca no rádio ("é o que paga as contas"); você quer o repertório autoral. O próximo disco de ${d.banda} depende disso.`,
    intencoes: [
      { id: 'ceder', texto: 'Ceder: o repertório que o público pede', dica: 'Mais público; menos de você no disco.', risco: 0.3, fatores: v => [tecnica(v, 'musica'), F('a banda', ((banda(v)?.publico ?? 0) - 40) / 100)],
        desfechos: D('O disco "de rádio" lotou as datas do ano — e abriu espaço para o autoral depois.', 'Agenda boa; você canta umas que não escolheria.', 'O público gostou; você, menos.', 'Nem o público novo veio, nem o antigo ficou.', {
          otimo: { extra: v => { const p = banda(v); if (p) p.publico = clamp(p.publico + 5); } }, bom: { humor: -1, extra: v => { const p = banda(v); if (p) p.publico = clamp(p.publico + 3); } },
          ruim: { humor: -4 }, pessimo: { extra: v => { const p = banda(v); if (p) p.publico = Math.max(0, p.publico - 4); } }
        }) },
      { id: 'impor', texto: 'Bancar o autoral', dica: 'O disco é seu — a banda pode rachar.', risco: 0.55, fatores: v => [coragem(v), tecnica(v, 'musica'), cabeca(v)],
        desfechos: D('O autoral virou a marca da banda: crítica e um público fiel.', 'Um disco de que você se orgulha, de público pequeno.', `A tensão ficou nos ensaios.`, 'A briga terminou com a saída de quem discordava.', {
          otimo: { noto: 1, extra: (v, d) => doMembro(v, d, vin => { vin.proximidade = clamp(vin.proximidade + 5); }) },
          ruim: { extra: (v, d) => doMembro(v, d, vin => { vin.tensao = clamp(vin.tensao + 15); }) },
          pessimo: { extra: (v, d) => { doMembro(v, d, vin => { vin.tensao = clamp(vin.tensao + 30); vin.conflito = { t: v.t, assunto: `o rumo de ${d.banda}`, gravidade: 2, quem: 'eu' }; }); saiDaBanda(v, d); } }
        }, { otimo: 'Bancou o repertório autoral da banda — e ele virou a marca dela.' }) },
      { id: 'meio', texto: 'Meio a meio no disco', dica: 'Ninguém sai inteiro satisfeito.', risco: 0.2, fatores: v => [social(v)],
        desfechos: D('O meio a meio deu o disco mais coerente da banda.', 'Um acordo que segurou a banda.', 'O disco saiu com cara de dois discos.', 'O acordo não segurou: as brigas voltaram.', { pessimo: { extra: (v, d) => doMembro(v, d, vin => { vin.tensao = clamp(vin.tensao + 12); }) } }) }
    ] },
  /* ---------------------------------------------- Música: a fase */
  { id: 'mus_fase_fria', trajetoria: 'cena', tema: 'mus_rumo', recarga: 6, peso: v => (faseFria(v) ? 1.6 : 0),
    cabe: v => musico(v) && faseFria(v) && idade(v) >= 20,
    titulo: 'A agenda minguou',
    texto: v => `O último ano teve ${v.caminhos.palcos?.slice(-1)[0]?.apresentacoes ?? 'poucas'} datas. As casas que chamavam pararam de ligar; o celular quase não toca.`,
    intencoes: [
      { id: 'reinventar', texto: 'Reinventar o som e voltar com um trabalho novo', dica: 'Pode recomeçar a carreira — ou custar o que sobrou.', risco: 0.55, fatores: v => [tecnica(v, 'musica'), coragem(v), disciplina(v)],
        desfechos: D('O trabalho novo achou um público que não era o seu: a agenda voltou.', 'Um recomeço modesto.', 'O trabalho novo passou em branco.', 'Gastou o guardado num disco que ninguém ouviu.', { otimo: { nome: 4, noto: 1 }, ruim: { dinheiro: -2500 }, pessimo: { dinheiro: -6000, humor: -5 } },
          { otimo: 'Numa fase de agenda vazia, reinventou o som — e a carreira voltou.' }) },
      { id: 'contratado', texto: 'Tocar contratado por outros artistas por um tempo', dica: 'Dinheiro certo; o nome próprio espera.', risco: 0.15, fatores: v => [tecnica(v, 'musica'), social(v)],
        desfechos: D('Virou o instrumentista que todo mundo quer na banda: agenda cheia.', 'Agenda dos outros, conta paga.', 'Pouco trabalho, mesmo assim.', 'Ninguém chamou.', { otimo: { dinheiro: 9000, extra: v => { v.caminhos.papelMusica = 'contratado'; } }, bom: { dinheiro: 5000, extra: v => { v.caminhos.papelMusica = 'contratado'; } } }) },
      { id: 'estudar', texto: 'Parar de correr atrás e estudar', dica: 'A técnica sobe; a agenda, não agora.', risco: 0.1, fatores: v => [disciplina(v)],
        desfechos: D('Um ano de estudo que mudou o jeito de tocar.', 'Estudou, sem pressa.', 'A conta apertou durante o estudo.', 'O dinheiro acabou antes do ano.', {
          otimo: { extra: v => praticar(v, rngDe(v.id, 'mus_estudo', v.t), 'musica', 0.5, 1.2) }, bom: { extra: v => praticar(v, rngDe(v.id, 'mus_estudo', v.t), 'musica', 0.3, 1.1) },
          ruim: { dinheiro: -2000 }, pessimo: { dinheiro: -4000 }
        }) }
    ] },
  { id: 'mus_musica_pegou', trajetoria: 'cena', tema: 'mus_palco', recarga: 6, peso: v => (obraQuePegou(v) ? 1.6 : 0),
    cabe: v => musico(v) && !!obraQuePegou(v),
    titulo: v => `"${obraQuePegou(v)!.titulo}" pegou`,
    texto: v => `"${obraQuePegou(v)!.titulo}" está tocando: gente de outras cidades manda vídeo cantando junto, e três produtores ligaram na mesma semana.`,
    intencoes: [
      { id: 'agenda', texto: 'Aproveitar: agenda cheia enquanto dura', dica: 'Dinheiro e público agora — e o corpo e a casa pagam.', risco: 0.45, fatores: v => [F('fôlego', (v.corpo.forma - 60) / 80), cabeca(v)],
        desfechos: D('Meses de casas cheias: o nome subiu de patamar.', 'Uma fase boa e cansativa.', 'Datas demais: o show caiu de qualidade.', 'Estafa no meio da agenda: shows cancelados.', { otimo: { noto: 2, nome: 4, dinheiro: 12000, estresse: 6 }, bom: { dinheiro: 7000, estresse: 5 }, ruim: { estresse: 8 }, pessimo: { estresse: 12, extra: v => { v.corpo.saude = clamp(v.corpo.saude - 5); } } },
          { otimo: 'Uma música estourou — e a agenda cheia levou o nome a outro patamar.' }) },
      { id: 'cuidar', texto: 'Segurar o ritmo e preparar o próximo trabalho', dica: 'Menos dinheiro agora; a próxima obra sai mais cuidada.', risco: 0.25, fatores: v => [disciplina(v), tecnica(v, 'musica')],
        desfechos: D('A música abriu a porta; o trabalho seguinte confirmou que não era sorte.', 'Uma fase equilibrada.', 'O momento passou mais rápido do que o próximo disco.', 'Quando o disco novo saiu, ninguém lembrava mais.', { otimo: { nome: 3 }, pessimo: { nome: -1 } }) }
    ] },
  /* ---------------------------------------------- Atuação: a fase */
  { id: 'cena_naos', trajetoria: 'cena', tema: 'cena_rumo', recarga: 5, peso: v => (naosRecentes(v) >= 2 ? 1.8 : 0),
    cabe: v => atua(v) && naosRecentes(v) >= 2,
    titulo: 'Mais um "não"',
    texto: v => `${naosRecentes(v)} testes sem passar nos últimos dois anos. A última banca agradeceu, sorriu — e chamou outra pessoa.`,
    intencoes: [
      { id: 'preparador', texto: 'Voltar a estudar com um preparador de elenco', dica: 'Custa; a técnica sobe.', risco: 0.2, fatores: v => [disciplina(v), tecnica(v, 'teatro')],
        desfechos: D('O preparador mudou o jeito de você entrar numa sala de teste: o próximo foi outro.', 'Aulas boas, resultado devagar.', 'Pagou as aulas; os testes seguiram iguais.', 'Gastou o que não tinha — e a insegurança cresceu.', {
          otimo: { dinheiro: -2500, extra: v => praticar(v, rngDe(v.id, 'cena_prep', v.t), 'teatro', 0.45, 1.2) }, bom: { dinheiro: -2500, extra: v => praticar(v, rngDe(v.id, 'cena_prep', v.t), 'teatro', 0.3, 1.1) }, ruim: { dinheiro: -2500 }, pessimo: { dinheiro: -2500, humor: -4 }
        }) },
      { id: 'agente', texto: 'Trocar de agente (ou procurar um)', dica: 'Outros testes, outras portas — e a comissão de alguém novo.', risco: 0.4, fatores: v => [nome(v), social(v)],
        desfechos: D('A agência nova abriu uma porta que a antiga nunca abriu.', 'Testes diferentes, por enquanto.', 'A agência nova pediu tempo.', 'Ninguém quis representar agora.', { otimo: { nome: 3 }, bom: { nome: 1 }, pessimo: { nome: -1, extra: v => { const a = v.caminhos.audiovisual; if (a) a.agente = undefined; } } }) },
      { id: 'proprio', texto: 'Parar de esperar teste e montar o próprio trabalho', dica: 'Você decide o papel; você paga a sala.', risco: 0.5, fatores: v => [coragem(v), tecnica(v, 'teatro')],
        desfechos: D('O trabalho próprio virou vitrine: uma produtora viu e chamou.', 'Uma temporada curta, de público bom.', 'A sala ficou meio vazia.', 'O prejuízo da temporada levou meses para pagar.', { otimo: { nome: 4, noto: 1 }, ruim: { dinheiro: -2000 }, pessimo: { dinheiro: -5000 } }, { otimo: 'Cansou de esperar teste e montou o próprio trabalho — que virou vitrine.' }) }
    ] },
  { id: 'cena_cult', trajetoria: 'cena', tema: 'cena_rumo', recarga: 8, peso: v => (recente(v, 'av_cult', 24) ? 1.6 : 0),
    cabe: v => atua(v) && recente(v, 'av_cult', 24),
    titulo: 'A crítica amou; o público não veio',
    texto: () => 'O último trabalho saiu nas listas de melhores do ano — e foi visto por quase ninguém. Agora chegam dois convites: um festival de prestígio que paga pouco e uma novela popular que paga bem.',
    intencoes: [
      { id: 'festival', texto: 'O festival: seguir no trabalho de prestígio', dica: 'Prêmio e respeito, pouco dinheiro.', risco: 0.4, fatores: v => [tecnica(v, 'teatro'), nome(v)],
        desfechos: D('O festival deu prêmio — e a crítica passou a acompanhar cada trabalho seu.', 'Mais uma linha de prestígio.', 'Um festival bonito; a conta não fechou.', 'O festival foi cancelado em cima da hora.', { otimo: { nome: 3 }, ruim: { dinheiro: -1500 }, pessimo: { dinheiro: -2500 } }, { otimo: 'Escolheu o festival de prestígio em vez da novela — e saiu de lá com um prêmio.' }) },
      { id: 'novela', texto: 'A novela: o público grande', dica: 'Dinheiro e nome; a crítica torce o nariz.', risco: 0.3, fatores: v => [nome(v), social(v)],
        desfechos: D('O país inteiro passou a conhecer o seu rosto.', 'Um papel popular; a conta respirou.', 'O papel era pequeno, e a crítica cobrou.', 'O papel foi cortado na metade da novela.', { otimo: { noto: 3, nome: 3, dinheiro: 20000 }, bom: { noto: 1, dinheiro: 12000 }, ruim: { dinheiro: 6000 }, pessimo: { dinheiro: 4000, humor: -4 } }) }
    ] },
  { id: 'cena_sucesso_popular', trajetoria: 'cena', tema: 'cena_rumo', recarga: 8, peso: v => (recente(v, 'av_repercutiu', 18) ? 1.2 : 0),
    cabe: v => atua(v) && recente(v, 'av_repercutiu', 18),
    titulo: 'O papel que o público não esquece',
    texto: () => 'O último trabalho foi um sucesso de público: na rua, chamam você pelo nome da personagem. As propostas que chegam são todas para fazer o mesmo tipo de papel.',
    intencoes: [
      { id: 'repetir', texto: 'Aceitar o mesmo tipo de papel enquanto pagam', dica: 'Dinheiro certo; o risco de virar sempre o mesmo tipo.', risco: 0.25, fatores: v => [nome(v)],
        desfechos: D('Virou a cara de um gênero: trabalho garantido por anos.', 'Mais um papel parecido, bem pago.', 'O público começou a cansar da mesma personagem.', 'O tipo grudou: os testes para outros papéis pararam de chamar.', { otimo: { dinheiro: 15000 }, bom: { dinheiro: 9000 }, pessimo: { nome: -3 } }) },
      { id: 'contraste', texto: 'Recusar e procurar um papel que ninguém espera', dica: 'Pode mostrar alcance — ou sumir por um tempo.', risco: 0.55, fatores: v => [tecnica(v, 'teatro'), coragem(v)],
        desfechos: D('O papel inesperado mostrou um alcance que ninguém conhecia: a crítica e o público foram juntos.', 'Um trabalho diferente, respeitado.', 'Um ano de pouco trabalho esperando o papel certo.', 'O papel diferente não convenceu ninguém.', { otimo: { nome: 4, noto: 1 }, ruim: { dinheiro: -3000 }, pessimo: { nome: -2 } }, { otimo: 'Depois de um sucesso popular, recusou repetir a personagem — e o papel inesperado mostrou outro alcance.' }) }
    ] }
];
