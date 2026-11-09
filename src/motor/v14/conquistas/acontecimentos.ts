/**
 * VIDA 14 · RECONHECIMENTO PROFISSIONAL — os convites do meio (`c14p_*`). Sorteados só pelo pass anual próprio
 * (`reconhecimento.reconhecimentoDoMeio14`, gerador derivado): `manual`, nunca no sorteio principal. Cada um lê o meio
 * da pessoa (`perfilDoMeio14`: a área, o prestígio, o desempenho, os anos) e fala com as palavras da área (`HONRAS14`).
 * Aceitar custa tempo, cabeça e às vezes dinheiro; recusar não castiga — o convite só não acontece.
 */
import type { Conteudo, Ctx } from '../../conteudo/base';
import type { Vida } from '../../tipos';
import { clamp, rngDe } from '../../rng';
import { dinheiro as fmt } from '../../texto';
import { custa, dinheiro, estresse, feliz, local } from '../../conteudo/efeitos';
import { lembrarCom } from '../../nucleo';
import { apresentarAlguem } from '../../sistemas/social';
import { novoContexto } from '../../sistemas/relacoes';
import { novaOportunidade } from '../../sistemas/oportunidades';
import { somarAoNome } from '../../sistemas/notoriedade';
import { marcar } from '../../sistemas/marcas';
import { grandesCentros, municipio } from '../../dados/lugares';
import { paisDaVida } from '../../mundo/vida';
import { HONRAS14 } from '../../dados14/conquistas/catalogo';
import { perfilDoMeio14, registrarReconhecimento14, somarPrestigio14, valorizar14, type PerfilDoMeio14 } from './reconhecimento';

/** O meio de agora (a decisão pode abrir da fila depois de uma mudança: nunca quebra, cai no ofício genérico). */
const meio = (c: Ctx): PerfilDoMeio14 => perfilDoMeio14(c.v) ?? { area: 'oficio', honra: HONRAS14.oficio, prestigio: 0, desempenho: 50, anos: 0, nivel: 1, como: 'emprego' };
const tem = (c: Ctx) => !!perfilDoMeio14(c.v);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Alguém do meio que entra na rede de contatos (com o contexto de onde veio). */
function conhecerDoMeio(v: Vida, onde: string, chave: string): string {
  const r = rngDe(v.id, 'c14_contato', chave, v.t);
  const p = apresentarAlguem(v, r, { idade: [28, 66], origem: 'trabalho' });
  const vin = v.vinculos[p.id];
  if (vin) { vin.contexto = novoContexto('evento'); vin.proximidade = clamp(vin.proximidade + 6); }
  lembrarCom(v, p.id, `Se conheceram ${onde}.`, 'inicio', 2);
  return p.nome;
}

/** Uma proposta de outro lugar (a mesma função, salário melhor) — só no emprego, pela porta de sempre. */
function propostaDepois(v: Vida, onde: string): boolean {
  const e = v.trabalho.atual;
  if (!e || perfilDoMeio14(v)?.como !== 'emprego') return false;
  return !!novaOportunidade(v, { tipo: 'proposta', ocupacaoId: e.ocupacaoId, meses: 12, chave: 'proposta_c14', bonus: 0.15, titulo: 'Uma proposta', texto: `Alguém que viu você ${onde} quer você na equipe dele, na mesma função, com salário melhor.` });
}

/** A feira: a internacional para quem tem nome no meio ou é dono; o estande do dono custa mais que a visita. */
const feiraDeFora = (c: Ctx) => meio(c).prestigio >= 35 || meio(c).como === 'dono';
const custoDaFeira = (c: Ctx) => local(c, meio(c).como === 'dono' ? (feiraDeFora(c) && meio(c).nivel >= 3 ? 16000 : 6000) : feiraDeFora(c) ? 3000 : 900);

const cidadeGrande = (v: Vida) => municipio(grandesCentros(paisDaVida(v))[0]).nome;

export const ACONTECIMENTOS_14_CONQUISTAS: Conteudo[] = [
  {
    id: 'c14p_premio', manual: true, tipo: 'decisao', idade: [22, 85], tema: 'trabalho', repetir: 4, peso: 2,
    quando: c => tem(c) && meio(c).desempenho >= 72 && meio(c).anos >= 3,
    titulo: 'Um prêmio do meio',
    texto: c => `${cap(meio(c).honra.quem)} escolheu você para ${meio(c).honra.premio}. A cerimônia é num sábado à noite, com jantar e discurso curto.`,
    opcoes: [
      { id: 'ir', texto: 'Ir à cerimônia', consequencia: c => `A roupa e a noite custam ${fmt(local(c, 500))}; o nome circula no meio.`, disponivel: c => custa(c, local(c, 500)),
        resolver: c => {
          const h = meio(c).honra;
          return { texto: 'Você subiu, agradeceu, desceu. No jantar, três pessoas vieram falar com você — e uma deixou o cartão.', memoria: `Recebeu ${h.premio}.`, relevancia: 'marco', tom: 'bom',
            efeito: () => { dinheiro(c, -local(c, 500)); feliz(c, 5); somarPrestigio14(c.v, 7); registrarReconhecimento14(c.v, 'premio', cap(h.premio), 2); valorizar14(c.v, 0.04); conhecerDoMeio(c.v, `na entrega de ${h.premio}`, 'premio'); marcar(c.v, 'destaque', `Recebeu ${h.premio}.`, 2); } };
        } },
      { id: 'nao_ir', texto: 'Agradecer e não ir',
        resolver: c => {
          const h = meio(c).honra;
          return { texto: 'O prêmio é seu do mesmo jeito; alguém leu o seu agradecimento ao microfone.', memoria: `Recebeu ${h.premio} (sem ir à cerimônia).`, relevancia: 'biografia', tom: 'bom',
            efeito: () => { somarPrestigio14(c.v, 4); registrarReconhecimento14(c.v, 'premio', cap(h.premio), 2); valorizar14(c.v, 0.02); } };
        } }
    ]
  },
  {
    id: 'c14p_descoberta', manual: true, tipo: 'decisao', idade: [24, 85], tema: 'trabalho', repetir: 6, peso: 1.5,
    quando: c => tem(c) && !!meio(c).honra.descoberta && (meio(c).como === 'academia' ? (c.v.caminhos.academia?.publicacoes ?? 0) >= 4 : meio(c).nivel >= 3 && meio(c).desempenho >= 80),
    titulo: 'O seu trabalho foi reconhecido',
    texto: c => `${cap(meio(c).honra.descoberta!)}. ${cap(meio(c).honra.quem)} quer reconhecer isso publicamente — com um prêmio de ${fmt(local(c, 6000))} e uma apresentação.`,
    opcoes: [
      { id: 'apresentar', texto: 'Receber e apresentar o trabalho', consequencia: () => 'Semanas preparando a apresentação; o nome fica no meio.',
        resolver: c => ({ texto: 'A sala estava cheia. Na fila das perguntas, gente de outros lugares querendo levar a ideia adiante.', memoria: 'Foi reconhecido no meio por um trabalho que outros passaram a usar.', relevancia: 'marco', tom: 'bom',
          efeito: () => { dinheiro(c, local(c, 6000)); estresse(c, 3); feliz(c, 6); somarPrestigio14(c.v, 9); registrarReconhecimento14(c.v, 'descoberta', cap(meio(c).honra.descoberta!), 2); valorizar14(c.v, 0.05); conhecerDoMeio(c.v, 'quando você apresentou o seu trabalho', 'descoberta'); marcar(c.v, 'conquista', 'Um trabalho seu foi reconhecido no meio.', 3); } }) },
      { id: 'discreto', texto: 'Aceitar o prêmio sem holofote',
        resolver: c => ({ texto: 'O dinheiro caiu na conta e o certificado de participação ficou na gaveta. Quem precisava saber, soube.', memoria: 'Um trabalho seu foi premiado no meio.', relevancia: 'biografia', tom: 'bom',
          efeito: () => { dinheiro(c, local(c, 6000)); somarPrestigio14(c.v, 5); registrarReconhecimento14(c.v, 'descoberta', cap(meio(c).honra.descoberta!), 2); } }) }
    ]
  },
  {
    id: 'c14p_congresso', manual: true, tipo: 'decisao', idade: [22, 80], tema: 'trabalho', repetir: 2, peso: 3,
    quando: c => tem(c) && (meio(c).prestigio >= 12 || meio(c).como === 'academia' || meio(c).nivel >= 3),
    titulo: 'Um convite para o congresso',
    texto: c => `O congresso da sua área convidou você para falar numa mesa sobre ${meio(c).honra.assunto}. São três dias em ${cidadeGrande(c.v)}; a inscrição e a viagem saem por ${fmt(local(c, 1800))}.`,
    opcoes: [
      { id: 'apresentar', texto: 'Ir e falar na mesa', disponivel: c => custa(c, local(c, 1800)), consequencia: () => 'Preparar a fala pesa na semana; quem assiste lembra de você.',
        resolver: c => {
          const prop = rngDe(c.v.id, 'c14_congresso', c.v.t).chance(0.3);
          return { texto: `A sua fala terminou com perguntas de sobra e um café que durou o intervalo inteiro.${prop ? ' Na volta, um e-mail: uma proposta de trabalho.' : ''}`, memoria: 'Falou numa mesa do congresso da área.', relevancia: 'biografia', tom: 'bom',
            efeito: () => { dinheiro(c, -local(c, 1800)); estresse(c, 3); somarPrestigio14(c.v, 4); registrarReconhecimento14(c.v, 'congresso', 'Falou numa mesa do congresso da área'); valorizar14(c.v, 0.02); conhecerDoMeio(c.v, 'no congresso da área', 'congresso'); if (prop) propostaDepois(c.v, 'falar no congresso'); } };
        } },
      { id: 'assistir', texto: 'Ir só para assistir', disponivel: c => custa(c, local(c, 1500)),
        resolver: c => ({ texto: 'Três dias de palestras, um caderno cheio e duas ideias para testar na segunda-feira.', memoria: null, tom: 'bom',
          efeito: () => { dinheiro(c, -local(c, 1500)); const e = c.v.trabalho.atual; if (e) e.desempenho = clamp(e.desempenho + 3); somarPrestigio14(c.v, 1); registrarReconhecimento14(c.v, 'congresso', 'Foi ao congresso da área'); if (rngDe(c.v.id, 'c14_assistir', c.v.t).chance(0.5)) conhecerDoMeio(c.v, 'no congresso da área', 'assistir'); } }) },
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'Fica para o ano que vem. Ou não.', memoria: null }) }
    ]
  },
  {
    id: 'c14p_feira', manual: true, tipo: 'decisao', idade: [22, 80], tema: 'trabalho', repetir: 2, peso: 2.5,
    quando: c => tem(c) && ['negocios', 'comercio', 'industria', 'agro', 'tecnologia', 'oficio'].includes(meio(c).area),
    titulo: c => (feiraDeFora(c) ? 'Uma feira internacional do setor' : 'A feira do setor'),
    texto: c => {
      const fora = feiraDeFora(c);
      return `${cap(meio(c).honra.feira)}${fora ? ', na edição internacional, com expositores de vários países,' : ''} acontece em ${cidadeGrande(c.v)}. ${meio(c).como === 'dono' ? `Um estande custa ${fmt(custoDaFeira(c))}.` : `Ir custa uns ${fmt(custoDaFeira(c))}, entre viagem e dias fora.`}`;
    },
    opcoes: [
      { id: 'ir', texto: c => (meio(c).como === 'dono' ? 'Montar um estande' : 'Ir à feira'),
        disponivel: c => custa(c, custoDaFeira(c)),
        consequencia: c => (meio(c).como === 'dono' ? 'Dias de estande: gente nova, pedidos novos — ou nem tanto.' : 'Fornecedores, máquinas, gente do ramo: o que se aprende volta para o trabalho.'),
        resolver: c => {
          const dono = meio(c).como === 'dono';
          const custo = custoDaFeira(c);
          const deu = rngDe(c.v.id, 'c14_feira', c.v.t).chance(dono ? 0.6 : 0.8);
          return { texto: dono ? (deu ? 'O estande encheu no segundo dia. Saiu de lá com uma pilha de cartões e três pedidos fechados.' : 'Muita gente passou, pouca parou. O estande se pagou em contatos — não em vendas.') : 'Você voltou com catálogos, ideias e o nome de quem resolve o que você vinha travando.', memoria: dono ? 'Expôs numa feira do setor.' : null, relevancia: 'biografia', tom: deu ? 'bom' : 'neutro',
            efeito: () => { dinheiro(c, -custo); estresse(c, 2); registrarReconhecimento14(c.v, 'feira', dono ? 'Expôs numa feira do setor' : 'Foi à feira do setor'); if (deu) { valorizar14(c.v, dono ? 0.06 : 0.02); somarPrestigio14(c.v, 2); } conhecerDoMeio(c.v, 'numa feira do setor', 'feira'); } };
        } },
      { id: 'recusar', texto: 'Deixar passar', resolver: () => ({ texto: 'A feira aconteceu sem você. O setor seguiu igual — por enquanto.', memoria: null }) }
    ]
  },
  {
    id: 'c14p_palestra', manual: true, tipo: 'decisao', idade: [25, 85], tema: 'trabalho', repetir: 2, peso: 2,
    quando: c => tem(c) && meio(c).prestigio >= 30 && (c.v.notoriedade?.valor ?? 0) < 35,
    titulo: 'Uma palestra',
    texto: c => `Uma faculdade quer que você fale para os alunos sobre ${meio(c).honra.assunto}. Uma noite, uma hora de fala; pagam ${fmt(local(c, 800 + meio(c).prestigio * 40))}.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar',
        resolver: c => ({ texto: 'No fim, uma aluna perguntou como você começou. Você contou a versão verdadeira.', memoria: null, tom: 'bom',
          efeito: () => { dinheiro(c, local(c, 800 + meio(c).prestigio * 40)); estresse(c, 1); feliz(c, 2); somarPrestigio14(c.v, 2); registrarReconhecimento14(c.v, 'palestra', `Palestra para alunos sobre ${meio(c).honra.assunto}`); } }) },
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'A noite ficou em casa.', memoria: null }) }
    ]
  },
  {
    id: 'c14p_entrevista', manual: true, tipo: 'decisao', idade: [24, 85], tema: 'trabalho', repetir: 2, peso: 2,
    quando: c => tem(c) && meio(c).prestigio >= 25,
    titulo: 'Querem entrevistar você',
    texto: c => `Um jornal da cidade (e o podcast dele) quer ouvir alguém do meio sobre ${meio(c).honra.assunto} — e o seu nome foi o indicado.`,
    opcoes: [
      { id: 'aceitar', texto: 'Dar a entrevista', consequencia: () => 'O nome aparece fora do meio; uma frase pode ser recortada.',
        resolver: c => {
          const ruim = rngDe(c.v.id, 'c14_entrevista', c.v.t).chance(0.2);
          return ruim
            ? { texto: 'Uma frase sua, tirada do contexto, virou manchete. Você passou a semana explicando o que quis dizer.', memoria: 'Uma entrevista sua foi recortada e deu o que falar.', relevancia: 'biografia', tom: 'ruim', efeito: () => { estresse(c, 5); somarPrestigio14(c.v, -2); somarAoNome(c.v, c.v.notoriedade?.fonte ?? 'negocio', 2); registrarReconhecimento14(c.v, 'entrevista', 'Uma entrevista que deu o que falar'); } }
            : { texto: 'A entrevista saiu num domingo. Conhecidos mandaram a foto da página; um cliente antigo ligou.', memoria: null, tom: 'bom', efeito: () => { feliz(c, 2); somarPrestigio14(c.v, 2); somarAoNome(c.v, c.v.notoriedade?.fonte ?? 'negocio', 3); registrarReconhecimento14(c.v, 'entrevista', `Entrevista sobre ${meio(c).honra.assunto}`); } };
        } },
      { id: 'recusar', texto: 'Indicar outra pessoa', resolver: () => ({ texto: 'Você passou o contato de um colega. Ele agradeceu — e ficou devendo uma.', memoria: null }) }
    ]
  },
  {
    id: 'c14p_projeto', manual: true, tipo: 'decisao', idade: [22, 75], tema: 'trabalho', repetir: 3, peso: 2.5,
    quando: c => tem(c) && meio(c).como !== 'academia' && meio(c).nivel >= 2 && meio(c).desempenho >= 68,
    titulo: 'Um projeto que importa',
    texto: c => `Chamaram você para ${meio(c).honra.projeto}. É o tipo de coisa que entra no currículo — e que come as noites durante meses.`,
    opcoes: [
      { id: 'aceitar', texto: 'Aceitar o projeto', consequencia: () => 'Meses de pressão; se der certo, o meio nota.',
        resolver: c => {
          const deu = rngDe(c.v.id, 'c14_projeto', c.v.t).chance(clamp(0.45 + meio(c).desempenho / 250, 0.5, 0.85));
          return deu
            ? { texto: 'Saiu. Atrasou duas semanas, mas saiu — e o seu nome está no relatório final.', memoria: 'Tocou um projeto importante, que deu certo.', relevancia: 'biografia', tom: 'bom', efeito: () => { estresse(c, 6); somarPrestigio14(c.v, 4); registrarReconhecimento14(c.v, 'projeto', 'Tocou um projeto importante, que deu certo'); valorizar14(c.v, 0.05); } }
            : { texto: 'O projeto empacou no meio e foi engavetado. Você aprendeu muito — e dormiu pouco.', memoria: 'Um projeto importante que você tocou foi engavetado.', relevancia: 'biografia', tom: 'ruim', efeito: () => { estresse(c, 8); const e = c.v.trabalho.atual; if (e) e.desempenho = clamp(e.desempenho - 3); } };
        } },
      { id: 'recusar', texto: 'Recusar', resolver: () => ({ texto: 'Outra pessoa pegou. A sua rotina continuou a mesma.', memoria: null }) }
    ]
  },
  {
    id: 'c14p_evento', manual: true, tipo: 'decisao', idade: [24, 85], tema: 'trabalho', repetir: 2, peso: 2,
    quando: c => tem(c) && meio(c).prestigio >= 20,
    titulo: 'Um convite para um evento importante',
    texto: c => `Chegou o convite para ${meio(c).honra.evento}. Quem é alguém no meio estará lá.`,
    opcoes: [
      { id: 'ir', texto: 'Ir', disponivel: c => custa(c, local(c, 300)), consequencia: c => `A roupa e o táxi: uns ${fmt(local(c, 300))}.`,
        resolver: c => ({ texto: 'Entre um brinde e outro, alguém do meio quis saber o que você anda fazendo. Trocaram contato.', memoria: null, tom: 'bom',
          efeito: () => { const ev = meio(c).honra.evento; dinheiro(c, -local(c, 300)); somarPrestigio14(c.v, 1); registrarReconhecimento14(c.v, 'evento', cap(ev)); conhecerDoMeio(c.v, `em ${ev}`, 'evento'); } }) },
      { id: 'nao', texto: 'Não ir', resolver: () => ({ texto: 'Você ficou em casa. Ninguém cobrou.', memoria: null }) }
    ]
  }
];
