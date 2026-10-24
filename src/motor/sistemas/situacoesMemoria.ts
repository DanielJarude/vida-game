/**
 * REWORK 11 · Fase F (CAR-11.9) — AS CENAS QUE LEMBRAM. Os momentos de carreira eram quase todos "um jogo qualquer": o
 * lance, o pênalti, a pergunta do repórter. Aqui ficam as cenas que só existem por causa do que a carreira JÁ viveu — e
 * que dizem isso com os dados reais do estado:
 *
 *   - o ex-clube na mesma divisão (as temporadas lá, os gols, como se saiu)          → o reencontro / a revanche
 *   - o título da temporada passada (o palmarés)                                     → o reconhecimento
 *   - o conflito registrado no mesmo clube (o vestiário, a imprensa, a torcida)       → a consequência que volta
 *   - a dispensa da base (a marca de fracasso antes do profissional)                  → o garoto dispensado que pede conselho
 *   - as temporadas no mesmo clube                                                     → a homenagem
 *   - a convocação recente                                                             → a volta da seleção
 *   - o técnico que volta ao clube onde jogou, ou enfrenta o clube que o demitiu       → o banco que lembra
 *
 * São modelos como os outros (contexto → intenção → fatores → desfecho → memória), só que `natureza: 'consequencia'`:
 * a tela os separa dos momentos de decisão comuns e dos marcos automáticos (títulos, transferências). Nenhum inventa um
 * fato passado: o contexto é lido do estado (temporadas, transferências, palmarés, situações registradas, marcas).
 *
 * Os ajudantes (fatores, desfechos-padrão) vêm de `situacoes` por parâmetro — este módulo não importa `situacoes` em
 * tempo de execução (sem ciclo na inicialização).
 */
import type { ConquistaEsportiva, RegistroDeSituacao, Temporada, Vida, PassagemDeTecnico } from '../tipos';
import type { DesfechoModelo, Desfecho, Efeitos, Fator, ModeloSituacao, Trajetoria } from './situacoes';
import { anoDe, idadeEm } from '../tempo';
import { aoClube, doClube, noClube, oClube } from '../dados/clubes';
import { daCompeticao } from './palmares';
import { carreirasEsportivas } from './esporte';
import { passagemAtual } from './tecnico';

type Dados = Record<string, string | number>;
type T = string | ((v: Vida, d: Dados) => string);
export interface AjudaDosModelos {
  F: (id: string, valor: number) => Fator;
  D: (otimo: string, bom: string, ruim: string, pessimo: string, ef?: Partial<Record<Desfecho, Efeitos>>, mem?: Partial<Record<Desfecho, string>>) => Record<Desfecho, DesfechoModelo>;
  DT: (otimo: T, bom: T, ruim: T, pessimo: T, ef: Partial<Record<Desfecho, Efeitos>>, mem?: Partial<Record<Desfecho, T>>) => Record<Desfecho, DesfechoModelo>;
  trajetoria: (v: Vida) => Trajetoria | undefined;
  coragem: (v: Vida) => Fator;
  social: (v: Vida) => Fator;
  disciplina: (v: Vida) => Fator;
  leitura: (v: Vida) => Fator;
  cabeca: (v: Vida, d?: Dados) => Fator;
  tecnica: (v: Vida) => Fator;
  nomeNoElenco: (v: Vida) => Fator;
  nomeTec: (v: Vida) => Fator;
  vestiario: (v: Vida) => Fator;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ESPORTE_DE_CLUBE: Trajetoria[] = ['futebol', 'basquete'];
const temporadasDe = (v: Vida): Temporada[] => v.caminhos.esporte?.temporadas ?? [];
/** O clube em que se jogava num instante (a temporada daquele ano, ou a anterior). */
export function clubeEm(v: Vida, t: number): string | undefined {
  const ano = anoDe(t);
  const ts = temporadasDe(v);
  return (ts.find(x => x.ano === ano) ?? ts.find(x => x.ano === ano - 1))?.clube;
}

/** O ex-clube que hoje está na mesma divisão (pelos dados das temporadas): o mais marcante, com os números de lá. */
export function exClubeNaDivisao(v: Vida): { clube: string; temporadas: number; gols: number; ultimo: number; vendido: boolean } | undefined {
  const es = v.caminhos.esporte;
  if (!es || es.fase !== 'profissional') return undefined;
  const ts = temporadasDe(v);
  const porClube = new Map<string, Temporada[]>();
  for (const t of ts) if (t.clube !== es.clube && t.clube !== es.emprestimo?.clube && t.nivel === es.nivel) porClube.set(t.clube, [...(porClube.get(t.clube) ?? []), t]);
  const melhor = [...porClube.entries()].sort((a, b) => b[1].length - a[1].length || b[1][b[1].length - 1].ano - a[1][a[1].length - 1].ano)[0];
  if (!melhor) return undefined;
  const [clube, xs] = melhor;
  const vendido = (es.transferencias ?? []).some(x => x.de === clube && x.taxa > 0);
  return { clube, temporadas: xs.length, gols: xs.reduce((a, x) => a + x.gols, 0), ultimo: xs[xs.length - 1].ano, vendido };
}

/** O título da última temporada no clube de agora (o palmarés). */
export function tituloRecente(v: Vida): ConquistaEsportiva | undefined {
  const es = v.caminhos.esporte;
  if (!es) return undefined;
  const ano = anoDe(v.t);
  return [...(v.caminhos.palmares ?? [])].reverse().find(c => c.tipo === 'titulo' && c.modalidade === es.modalidade && c.clube === es.clube && c.ano >= ano - 1);
}

/** Os momentos de atrito (vestiário, imprensa, torcida, treinador) que deram errado — e no clube de agora. */
const ATRITOS = new Set(['fut_vestiario', 'fut_jornalista', 'fut_torcida', 'fut_posicao', 'fut_capitania', 'esp_atrito']);
export function atritoNoClube(v: Vida): RegistroDeSituacao | undefined {
  const es = v.caminhos.esporte;
  if (!es) return undefined;
  return [...(v.caminhos.situacoes ?? [])].reverse().find(x => ATRITOS.has(x.id) && (x.desfecho === 'ruim' || x.desfecho === 'pessimo') && v.t - x.t >= 12 && v.t - x.t <= 72 && clubeEm(v, x.t) === es.clube);
}

/** A dispensa da base, antes do profissional desta modalidade (a marca de fracasso que a carreira superou). */
export function dispensaSuperada(v: Vida) {
  const es = v.caminhos.esporte;
  if (!es || es.fase !== 'profissional') return undefined;
  return v.caminhos.marcas.find(m => m.tipo === 'fracasso' && m.dominio === es.modalidade && m.t < es.tFase);
}

const noClubeAtual = (v: Vida) => temporadasDe(v).filter(t => t.clube === v.caminhos.esporte?.clube);

/** Técnico: o clube onde jogou (as temporadas de jogador, de qualquer carreira arquivada). */
function jogouNoClube(v: Vida, clube: string): Temporada[] {
  return carreirasEsportivas(v).filter(c => c.modalidade === 'futebol').flatMap(c => (c.temporadas ?? []).filter(t => t.clube === clube));
}
/** Técnico: a passagem anterior que acabou em demissão. */
function demitidoAntes(v: Vida): PassagemDeTecnico | undefined {
  const c = v.caminhos.tecnico;
  const atual = passagemAtual(v);
  return c ? [...c.passagens].reverse().find(p => p !== atual && p.saida === 'demissao' && p.ate !== undefined && p.clube !== atual?.clube) : undefined;
}

export function modelosComMemoria(h: AjudaDosModelos): ModeloSituacao[] {
  const { F, D, DT, coragem, social, disciplina, leitura, cabeca, tecnica, nomeNoElenco, nomeTec, vestiario } = h;
  const em = (...trs: Trajetoria[]) => (v: Vida) => { const t = h.trajetoria(v); return !!t && trs.includes(t); };
  const fut = em('futebol');
  const clube = em(...ESPORTE_DE_CLUBE);
  const atleta = em('futebol', 'basquete', 'atleta');
  const ponto = (v: Vida) => (v.caminhos.esporte?.modalidade === 'futebol' ? 'o gol' : 'a jogada decisiva');
  const out: ModeloSituacao[] = [
    /* ---------------------------------------------------------------- O ex-clube */
    { id: 'fut11_ex_clube', trajetoria: 'futebol', natureza: 'consequencia', tema: 'fut11_passado', recarga: 4, peso: () => 2.2, cabe: v => clube(v) && !!exClubeNaDivisao(v),
      contexto: v => { const x = exClubeNaDivisao(v)!; return { ex: x.clube, temporadas: x.temporadas, gols: x.gols, ultimo: x.ultimo, vendido: x.vendido ? 1 : 0, clube: v.caminhos.esporte!.clube }; },
      titulo: (_v, d) => `Contra ${oClube(String(d.ex))}`,
      texto: (v, d) => `O calendário pôs ${oClube(String(d.ex))} pela frente — o clube em que você jogou ${d.temporadas} ${Number(d.temporadas) === 1 ? 'temporada' : 'temporadas'}${v.caminhos.esporte?.modalidade === 'futebol' && Number(d.gols) > 0 ? ` e fez ${d.gols} ${Number(d.gols) === 1 ? 'gol' : 'gols'}` : ''}, até ${d.ultimo}. ${Number(d.vendido) ? 'Saiu vendido, e a torcida de lá ainda discute se foi bom negócio.' : 'A torcida de lá lembra de você — uns com carinho, outros não.'}`,
      retorno: (_v, d) => `De novo ${oClube(String(d.ex))}.`,
      intencoes: [
        { id: 'provocar', texto: v => `Se fizer ${ponto(v)}, comemorar na frente deles`, dica: 'A rivalidade cresce — para os dois lados.', risco: 0.6, fatores: (v, d) => [tecnica(v), coragem(v), cabeca(v, d)],
          desfechos: DT((v, d) => `Fez ${ponto(v)} e correu para a torcida ${doClube(String(d.ex))}. A foto rodou o país.`, 'Jogou bem; a provocação ficou na entrevista.', 'Não fez nada — e a torcida de lá cantou o seu nome, rindo.', (_v, d) => `Provocou, errou, e ${oClube(String(d.ex))} ganhou. A imprensa não perdoou.`, { otimo: { nome: 3, noto: 1, imagem: 'polemica', humor: 4 }, ruim: { estresse: 4 }, pessimo: { nome: -3, imagem: 'polemica', estresse: 6 } }, { otimo: (v, d) => `Fez ${ponto(v)} contra ${oClube(String(d.ex))}, o ex-clube, e comemorou na frente da torcida de lá.` }) },
        { id: 'respeitar', texto: 'Jogar sério e não comemorar contra o ex-clube', dica: 'Quem lembra de você agradece.', risco: 0.3, fatores: (v, d) => [tecnica(v), disciplina(v), cabeca(v, d)],
          desfechos: DT(v => `Fez ${ponto(v)} e levantou as mãos, sem comemorar. As duas torcidas aplaudiram.`, 'Um jogo correto contra quem você conhece bem.', 'O jogo passou sem você.', 'Nervoso, errou o que não costuma errar.', { otimo: { nome: 2, imagem: 'boa', humor: 3 }, pessimo: { nome: -1, estresse: 3 } }, { otimo: (_v, d) => `Fez o ponto contra ${oClube(String(d.ex))}, o ex-clube, e não comemorou — as duas torcidas aplaudiram.` }) },
        { id: 'normal', texto: 'Tratar como mais um jogo', dica: 'Nada de especial — até ser.', risco: 0.15, fatores: v => [disciplina(v), leitura(v)],
          desfechos: D('Jogou o seu jogo, e o seu jogo bastou.', 'Mais um jogo.', 'Faltou alguma coisa.', 'A cabeça foi para o passado; o jogo, embora.', { otimo: { nome: 1 }, bom: { nome: 0 } }) }
      ] },
    /* ---------------------------------------------------------------- O título reconhecido */
    { id: 'fut11_titulo', trajetoria: 'futebol', natureza: 'consequencia', tema: 'fut11_titulo', recarga: 2, peso: () => 2.5, cabe: v => fut(v) && !!tituloRecente(v),
      contexto: v => { const c = tituloRecente(v)!; return { competicao: c.competicao, ano: c.ano, papel: c.papel ?? 'elenco', clube: v.caminhos.esporte!.clube }; },
      titulo: 'Depois do título',
      texto: (_v, d) => `O título ${daCompeticao(String(d.competicao))} de ${d.ano} ainda está na parede do CT. ${d.papel === 'protagonista' ? 'Você foi peça central da campanha' : 'Você fez parte do elenco campeão'} — e a cidade não deixou ninguém esquecer.`,
      intencoes: [
        { id: 'torcida', texto: 'Levar a taça ao bairro, com a torcida', dica: 'Aproxima. Expõe.', risco: 0.35, fatores: v => [social(v), nomeNoElenco(v)],
          desfechos: DT((_v, d) => `O bairro parou. Uma criança com a camisa ${doClube(String(d.clube))} não soltou a sua mão a tarde inteira.`, 'Uma festa bonita.', 'A festa virou tumulto e acabou cedo.', 'A festa saiu de controle; o clube teve de se explicar.', { otimo: { humor: 6, noto: 1, imagem: 'boa' }, pessimo: { imagem: 'polemica' } }, { otimo: (_v, d) => `Levou a taça de ${d.ano} ao bairro, com a torcida ${doClube(String(d.clube))}.` }) },
        { id: 'trabalho', texto: 'Agradecer e voltar ao treino: a próxima temporada já começou', dica: 'O treinador gosta. A festa passa sem você.', risco: 0.15, fatores: v => [disciplina(v)],
          desfechos: D('O treinador citou o seu exemplo na primeira reunião.', 'Voltou ao trabalho.', 'Alguns acharam que você se achava acima da festa.', 'O elenco estranhou a distância.', { otimo: { confianca: 1 } }) },
        { id: 'contrato', texto: 'Usar o título para negociar o seu lugar no time', dica: 'O momento é bom — se você foi peça central.', risco: 0.5, fatores: (v, d) => [nomeNoElenco(v), F('papel no título', d.papel === 'protagonista' ? 0.3 : -0.2), coragem(v)],
          desfechos: D('O clube garantiu: o time começa por você.', 'Ouviram, e anotaram.', 'A diretoria lembrou que título é do grupo.', 'Pegou mal: "ganhou um e já quer tudo".', { otimo: { confianca: 1, nome: 2 }, pessimo: { confianca: -1, imagem: 'polemica' } }) }
      ] },
    /* ---------------------------------------------------------------- A consequência do atrito */
    { id: 'fut11_atrito_volta', trajetoria: 'futebol', natureza: 'consequencia', tema: 'fut11_atrito', recarga: 6, peso: () => 2, cabe: v => fut(v) && !!atritoNoClube(v),
      contexto: v => { const x = atritoNoClube(v)!; return { de: anoDe(x.t), oque: x.texto.replace(/\.$/, ''), escolha: x.intencao, clube: v.caminhos.esporte!.clube }; },
      titulo: 'O assunto que voltou',
      texto: (_v, d) => `Em ${d.de}, ${noClube(String(d.clube))}: ${String(d.oque).charAt(0).toLowerCase()}${String(d.oque).slice(1)}. Ninguém esqueceu. Numa semana ruim, o assunto voltou — no vestiário e na imprensa.`,
      intencoes: [
        { id: 'encarar', texto: 'Falar do assunto de frente, de uma vez', dica: 'Fecha a história — ou reabre.', risco: 0.45, fatores: v => [coragem(v), social(v), nomeNoElenco(v)],
          desfechos: D('Falou, ouviu, e o assunto morreu ali.', 'O clima melhorou.', 'Reabriu a ferida.', 'A conversa virou manchete, de novo.', { otimo: { confianca: 1 }, pessimo: { imagem: 'polemica', confianca: -1 } }, { otimo: 'Encarou de frente um atrito antigo no clube — e o assunto morreu ali.' }) },
        { id: 'campo', texto: 'Deixar o futebol responder', dica: 'Depende de jogar bem já.', risco: 0.4, fatores: v => [tecnica(v), cabeca(v)],
          desfechos: D('Duas grandes atuações seguidas e ninguém lembrou mais.', 'Jogou bem; o assunto esfriou.', 'Não jogou bem, e o assunto cresceu.', 'O assunto cresceu até o treinador tirar você do time.', { pessimo: { banco: true } }) },
        { id: 'sair', texto: 'Pedir ao empresário para buscar outro clube', dica: 'Sair do problema não resolve o problema.', risco: 0.3, fatores: v => [nomeNoElenco(v)],
          desfechos: D('O empresário achou interessados; a diretoria, com medo de perder, fez as pazes.', 'Ficou a ideia no ar.', 'O pedido vazou.', 'O pedido vazou e a torcida virou de vez.', { pessimo: { imagem: 'polemica', nome: -2 } }) }
      ] },
    /* ---------------------------------------------------------------- O garoto dispensado */
    { id: 'esp11_dispensado', trajetoria: 'futebol', natureza: 'consequencia', tema: 'esp11_base', recarga: 15, peso: () => 1.6, cabe: v => atleta(v) && !!dispensaSuperada(v) && (v.caminhos.esporte?.temporadas?.length ?? 0) >= 3,
      contexto: v => { const m = dispensaSuperada(v)!; return { ano: anoDe(m.t), aos: idadeEm(v.eu.tNasc, m.t), temporadas: v.caminhos.esporte?.temporadas?.length ?? 0 }; },
      titulo: 'O garoto dispensado',
      texto: (_v, d) => `Depois do treino, um garoto de catorze anos espera você no portão: foi dispensado da base esta semana. Ele não sabe que você também foi, em ${d.ano}, aos ${d.aos} — e que depois vieram ${d.temporadas} temporadas no profissional.`,
      intencoes: [
        { id: 'contar', texto: 'Contar a sua história', dica: 'Expor uma ferida antiga para curar a de outro.', risco: 0.25, fatores: v => [social(v), F('o que superou', 0.2)],
          desfechos: D('Ele ouviu até o fim. Meses depois, o pai dele mandou uma foto: aprovado em outra peneira.', 'Ele foi embora com outro rosto.', 'Ele ouviu, mas não acreditou.', 'Ele não quis ouvir.', { otimo: { humor: 6, imagem: 'boa' }, bom: { humor: 3 } }, { otimo: 'Contou a um garoto dispensado da base que também tinha sido — e ele passou noutra peneira.' }) },
        { id: 'indicar', texto: 'Ligar para um conhecido de outro clube', dica: 'Uma porta; o resto é dele.', risco: 0.35, fatores: v => [nomeNoElenco(v)],
          desfechos: D('O conhecido chamou o garoto para um teste — e ele ficou.', 'O teste foi marcado.', 'O conhecido não respondeu.', 'O clube estranhou você indicando um dispensado deles.', { pessimo: { confianca: -1 } }) },
        { id: 'conselho', texto: 'Dar um conselho rápido e seguir', dica: 'É o que dá para fazer hoje.', risco: 0.1, fatores: () => [],
          desfechos: D('"Não para." Ele não parou.', 'Ele agradeceu.', 'Ficou a sensação de que dava para mais.', 'Você pensou nele a semana inteira.', {}) }
      ] },
    /* ---------------------------------------------------------------- A homenagem */
    { id: 'esp11_homenagem', trajetoria: 'futebol', natureza: 'consequencia', tema: 'esp11_homenagem', recarga: 40, peso: () => 2, cabe: v => clube(v) && noClubeAtual(v).length >= 6,
      contexto: v => { const ts = noClubeAtual(v); return { temporadas: ts.length, desde: ts[0].ano, gols: ts.reduce((a, t) => a + t.gols, 0), clube: v.caminhos.esporte!.clube }; },
      titulo: 'A homenagem',
      texto: (v, d) => `${cap(oClube(String(d.clube)))} quer homenagear as ${d.temporadas} temporadas desde ${d.desde}${v.caminhos.esporte?.modalidade === 'futebol' && Number(d.gols) > 0 ? ` (${d.gols} gols pelo clube)` : ''}: uma placa, a camisa emoldurada, o estádio cheio antes do jogo.`,
      intencoes: [
        { id: 'aceitar', texto: 'Aceitar e falar ao microfone', dica: 'Uma tarde que fica.', risco: 0.3, fatores: v => [social(v), cabeca(v)],
          desfechos: D('A voz falhou na terceira frase e o estádio inteiro esperou. Ninguém esquece.', 'Uma tarde bonita.', 'O discurso saiu curto e engasgado.', 'Uma parte da torcida vaiou — a outra não gostou da vaia.', { otimo: { humor: 8, noto: 1, imagem: 'boa' }, bom: { humor: 4 } }, { otimo: 'Recebeu a homenagem do clube pelas temporadas — e o estádio cheio esperou a voz voltar.' }) },
        { id: 'projeto', texto: 'Pedir que a homenagem vire apoio às categorias de base', dica: 'Menos holofote, mais legado.', risco: 0.25, fatores: v => [social(v), nomeNoElenco(v)],
          desfechos: D('O clube topou: uma bolsa da base leva o seu nome.', 'O clube prometeu.', 'O pedido ficou na gaveta.', 'A diretoria achou que era crítica velada.', { otimo: { imagem: 'boa', humor: 5 } }) },
        { id: 'discreto', texto: 'Agradecer e pedir algo simples, no vestiário', dica: 'Do seu jeito.', risco: 0.1, fatores: () => [],
          desfechos: D('Os companheiros fizeram a homenagem deles — e foi a que valeu.', 'Foi simples.', 'A diretoria se sentiu desprestigiada.', 'Ficou um mal-estar com a diretoria.', {}) }
      ] },
    /* ---------------------------------------------------------------- A volta da seleção */
    { id: 'esp11_selecao_volta', trajetoria: 'futebol', natureza: 'consequencia', tema: 'esp11_selecao', recarga: 5, peso: () => 1.5, cabe: v => atleta(v) && !!v.caminhos.esporte?.selecao?.tUltima && v.t - v.caminhos.esporte.selecao.tUltima! <= 12,
      contexto: v => { const s = v.caminhos.esporte!.selecao!; return { convocacoes: s.convocacoes, primeira: s.tPrimeira !== undefined ? anoDe(s.tPrimeira) : anoDe(v.t) }; },
      titulo: 'De volta da seleção',
      texto: (_v, d) => `${Number(d.convocacoes) <= 1 ? `A primeira convocação (${d.primeira})` : `A ${d.convocacoes}ª convocação`} mudou o jeito como o elenco olha para você. No primeiro treino da volta, todo mundo quer saber como foi — e o treinador quer saber se você voltou com a cabeça no clube.`,
      intencoes: [
        { id: 'humilde', texto: 'Voltar quieto e treinar como antes', dica: 'O grupo percebe.', risco: 0.15, fatores: v => [disciplina(v)],
          desfechos: D('O treinador comentou com a imprensa: "voltou melhor".', 'Normal.', 'Pareceu cansado da viagem.', 'Rendeu mal e ouviu que a cabeça estava na seleção.', { otimo: { confianca: 1 } }) },
        { id: 'lider', texto: 'Assumir mais responsabilidade no time', dica: 'Quem voltou da seleção é cobrado como tal.', risco: 0.45, fatores: v => [nomeNoElenco(v), coragem(v), tecnica(v)],
          desfechos: D('Virou referência do elenco naquela temporada.', 'Ganhou espaço.', 'Cobraram de você o que cobram de quem é de seleção.', 'Uma atuação ruim, e o rótulo de "só joga na seleção".', { otimo: { nome: 3, confianca: 1 }, pessimo: { nome: -2 } }, { otimo: 'Voltou da seleção e virou referência do elenco.' }) }
      ] },
    /* ---------------------------------------------------------------- Técnico: a casa antiga */
    { id: 'tec11_casa_antiga', trajetoria: 'tecnico', natureza: 'consequencia', tema: 'tec11_passado', recarga: 30, peso: () => 2.4, cabe: v => { if (h.trajetoria(v) !== 'tecnico') return false; const p = passagemAtual(v); return !!p && !p.selecao && jogouNoClube(v, p.clube).length >= 1; },
      contexto: v => { const p = passagemAtual(v)!; const ts = jogouNoClube(v, p.clube); return { clube: p.clube, temporadas: ts.length, de: ts[0].ano, ate: ts[ts.length - 1].ano }; },
      titulo: 'De volta, no banco',
      texto: (_v, d) => `Você jogou ${Number(d.temporadas) === 1 ? `uma temporada ${noClube(String(d.clube))}, em ${d.de}` : `${d.temporadas} temporadas ${noClube(String(d.clube))}, de ${d.de} a ${d.ate}`}. Agora o vestiário é seu, e o funcionário mais antigo do clube ainda chama você pelo apelido de jogador.`,
      intencoes: [
        { id: 'identidade', texto: 'Usar a identificação com a torcida', dica: 'Ganha tempo. Cobra em dobro se der errado.', risco: 0.45, fatores: v => [nomeTec(v), social(v)],
          desfechos: DT((_v, d) => `A torcida ${doClube(String(d.clube))} abraçou o projeto: a pressão quase sumiu.`, 'A torcida deu um crédito.', 'A cobrança veio com mágoa: "logo você".', 'Na primeira sequência ruim, a faixa no estádio dizia "ídolo não é técnico".', { otimo: { pressao: -15, humor: 4 }, bom: { pressao: -6 }, ruim: { pressao: 6 }, pessimo: { pressao: 14 } }, { otimo: (_v, d) => `Voltou ${aoClube(String(d.clube))}, onde jogou, agora como técnico — e a torcida abraçou o trabalho.` }) },
        { id: 'separar', texto: 'Separar as coisas: o passado é do jogador', dica: 'Profissional. Frio, para alguns.', risco: 0.25, fatores: v => [disciplina(v), leitura(v)],
          desfechos: DT('A diretoria elogiou a postura; o trabalho falou.', 'Começou do zero, como qualquer um.', 'Parte da torcida achou distante.', 'A torcida esperava outra coisa, e cobrou.', { otimo: { pressao: -8, nome: 1 }, ruim: { pressao: 3 }, pessimo: { pressao: 8 } }) },
        { id: 'vestiario', texto: 'Contar ao elenco como era vestir aquela camisa', dica: 'Pode inflamar — ou soar como sermão.', risco: 0.4, fatores: v => [vestiario(v), social(v)],
          desfechos: DT('O elenco comprou a ideia: o vestiário fechou com você.', 'Os mais novos ouviram com atenção.', 'Soou como sermão para os veteranos.', 'Os veteranos riram pelas costas.', { otimo: { vestiario: 12 }, bom: { vestiario: 5 }, ruim: { vestiario: -4 }, pessimo: { vestiario: -8 } }) }
      ] },
    /* ---------------------------------------------------------------- Técnico: o clube que demitiu */
    { id: 'tec11_reencontro', trajetoria: 'tecnico', natureza: 'consequencia', tema: 'tec11_passado', recarga: 5, peso: () => 1.8, cabe: v => h.trajetoria(v) === 'tecnico' && !passagemAtual(v)?.selecao && !!demitidoAntes(v),
      contexto: v => { const p = demitidoAntes(v)!; return { ex: p.clube, ano: anoDe(p.ate!), clube: passagemAtual(v)!.clube }; },
      titulo: 'O clube que demitiu você',
      texto: (_v, d) => `No domingo, ${oClube(String(d.clube))} enfrenta ${oClube(String(d.ex))} — o clube que demitiu você em ${d.ano}. A imprensa já quer saber se é revanche.`,
      intencoes: [
        { id: 'revanche', texto: 'Admitir que é especial', dica: 'Motiva o elenco. Pesa se perder.', risco: 0.55, fatores: v => [nomeTec(v), vestiario(v), cabeca(v)],
          desfechos: DT((_v, d) => `Venceram ${oClube(String(d.ex))}, e a entrevista depois do jogo foi a mais vista da semana.`, 'Venceram — sem festa.', 'Empataram, e a pergunta virou piada.', (_v, d) => `Perderam para ${oClube(String(d.ex))}, e a demissão de ${d.ano} voltou às manchetes.`, { otimo: { pressao: -10, nome: 2 }, bom: { pressao: -4 }, ruim: { pressao: 4 }, pessimo: { pressao: 12 } }, { otimo: (_v, d) => `Venceu ${oClube(String(d.ex))}, o clube que o demitiu em ${d.ano}.` }) },
        { id: 'neutro', texto: '"É um jogo como outro qualquer"', dica: 'Ninguém acredita, mas ninguém cobra.', risco: 0.2, fatores: v => [leitura(v)],
          desfechos: DT('O time jogou leve e venceu.', 'Um jogo normal.', 'O time jogou travado.', 'Perderam, e disseram que você se escondeu.', { otimo: { pressao: -5 }, pessimo: { pressao: 6 } }) }
      ] }
  ];
  // O basquete (e as outras modalidades de equipe com clube) recebe as mesmas cenas de memória, nos termos dele.
  const doBasquete = out.filter(m => ['fut11_ex_clube', 'esp11_dispensado', 'esp11_homenagem', 'esp11_selecao_volta'].includes(m.id)).map(m => ({ ...m, id: `${m.id}_bas`, trajetoria: 'basquete' as const }));
  const doAtleta = out.filter(m => ['esp11_dispensado', 'esp11_selecao_volta'].includes(m.id)).map(m => ({ ...m, id: `${m.id}_atl`, trajetoria: 'atleta' as const }));
  return [...out, ...doBasquete, ...doAtleta].map(m => (m.trajetoria === 'futebol' && m.id.startsWith('esp11_') ? { ...m, cabe: (v: Vida) => fut(v) && m.cabe(v) } : m));
}
