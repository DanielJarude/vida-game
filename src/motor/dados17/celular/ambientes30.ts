/**
 * VIDA 30 · §2.3 — O TRABALHO NO CELULAR, NO AMBIENTE DE CADA UM. As mensagens de trabalho da VIDA 17 eram de escritório
 * ("reunião que podia ter sido um e-mail", "o projeto", "a chefia") e chegavam ao soldado, ao pintor, à manicure, ao
 * personal e ao atleta. Aqui, o ambiente sai da ocupação (folha: só dados e uma função pura), e cada situação tem as
 * falas do lugar: a obra, o clube, a organização de e-sports, o quartel, o hospital, a escola, o salão, a cozinha, o
 * campo, o palco, a loja, a clientela de quem trabalha por conta, o escritório. A proposta que chega por um contato
 * (`celular15`) também: o atleta não recebe "um cliente meu precisa de alguém de confiança".
 *
 * Marcas: {po} a flexão de quem manda · {eu} o seu nome.
 */

export type Ambiente30 = 'escritorio' | 'obra' | 'loja' | 'saude' | 'escola' | 'clube' | 'esports' | 'quartel' | 'campo' | 'palco' | 'clientes' | 'cozinha' | 'empresa';

/** O ambiente pela ocupação (trilha, setor, contrato, entrada). */
export function ambienteDoTrabalho30(o: { id: string; trilha: string; setor?: string; contrato?: string; entrada?: string }): Ambiente30 {
  const t = o.trilha;
  if (o.id === 'jogador_esports' || t === 'esports') return 'esports';
  if (t === 'atleta' || t === 'treino' || o.setor === 'esporte') return 'clube';
  if (o.contrato === 'militar' || /militar|exercito|marinha|aeronautica|pm|bombeiro|policia/.test(t)) return 'quartel';
  if (o.entrada === 'negocio') return 'empresa';
  if (['construcao', 'eletrica', 'reparos', 'marcenaria', 'mecanica', 'manutencao', 'industria', 'logistica', 'transporte'].includes(t) || o.setor === 'construcao' || o.setor === 'industria' || o.setor === 'logistica') return 'obra';
  if (['medicina', 'enfermagem', 'odontologia', 'farmacia', 'saude_publica', 'fisioterapia', 'nutricao', 'psicologia', 'veterinaria', 'cuidado'].includes(t) || o.setor === 'saude') return 'saude';
  if (['educacao', 'docencia_superior', 'educacao_fisica'].includes(t) || o.setor === 'educacao') return 'escola';
  if (['agro', 'campo'].includes(t) || o.setor === 'agro') return 'campo';
  if (['cena', 'musica', 'danca', 'literatura', 'conteudo', 'ilustracao', 'imagem', 'orquestra'].includes(t) || o.setor === 'criativo') return 'palco';
  if (['alimentacao', 'confeitaria'].includes(t) || o.setor === 'alimentacao') return 'cozinha';
  if (o.contrato === 'autonomo' || o.contrato === 'informal' || ['beleza', 'costura'].includes(t)) return 'clientes';
  if (['comercio', 'vendas', 'atendimento', 'posto'].includes(t) || o.setor === 'comercio') return 'loja';
  return 'escritorio';
}

/** Quem manda no lugar (para as respostas: "ir falar com ..."). */
export const QUEM_MANDA30: Record<Ambiente30, string> = {
  escritorio: 'a chefia', obra: 'o encarregado', loja: 'a gerência', saude: 'a coordenação', escola: 'a coordenação', clube: 'o técnico', esports: 'o coach',
  quartel: 'o comandante', campo: 'o dono da terra', palco: 'a produção', clientes: 'o cliente', cozinha: 'o chef', empresa: 'o sócio'
};

type Sit = 'trabalho_bastidor' | 'trabalho_parceria' | 'trabalho_credito';
export const FALAS_TRABALHO30: Record<Sit, Record<Ambiente30, string[]>> = {
  trabalho_bastidor: {
    escritorio: ['"Você viu o e-mail?! Vão mudar tudo no setor."', '"Ouvi falar que vão cortar gente. Fica de olho."', '"Mais uma reunião que podia ter sido um e-mail. Sobrevivemos?"'],
    obra: ['"Amanhã a concretagem começa às seis. O encarregado tá uma fera com o atraso."', '"Ouvi que a empreiteira vai trocar a equipe da outra obra. Fica esperto."', '"Choveu, perdemos o dia de novo. O prazo não vai fechar."'],
    loja: ['"Vem auditoria de estoque na segunda. Prepara o coração."', '"A gerente nova chegou mudando a escala de todo mundo."', '"Black Friday chegando. Já pode ir avisando em casa que vai sumir."'],
    saude: ['"Plantão de amanhã tá desfalcado: duas faltas. Vai ser puxado."', '"Chegou protocolo novo da coordenação. Ninguém leu ainda."', '"Ontem a emergência lotou de novo. Tá todo mundo no limite."'],
    escola: ['"Conselho de classe na sexta, e a direção quer as notas até quarta."', '"A coordenação mudou o calendário de provas DE NOVO."', '"A turma do terceiro ano aprontou hoje. Te conto amanhã no intervalo."'],
    clube: ['"O professor vai mexer no time pro jogo de domingo. Ouvi no vestiário."', '"Diretoria atrasou o salário de novo. O pessoal tá falando em não treinar."', '"Chegou um reforço pra sua posição. Fica de olho no treino de amanhã."'],
    esports: ['"O coach vai rever a line no bootcamp. Ninguém tá garantido."', '"Ouvi que a org tá negociando com outro jogador da sua função."', '"Scrim de amanhã é contra os favoritos. Dorme cedo, por favor."'],
    quartel: ['"Formatura amanhã às seis. Farda passada, coturno engraxado."', '"Saiu a escala de serviço: pegamos o fim de semana."', '"Tem inspeção do comando na semana que vem. Tá todo mundo tenso."'],
    campo: ['"Vai ter geada essa semana, segundo o rádio. Melhor adiantar a colheita."', '"O comprador baixou o preço da saca. Tá todo mundo segurando a venda."', '"O trator quebrou de novo no meio da roça."'],
    palco: ['"A produção mudou o roteiro de última hora. Ensaio extra amanhã."', '"Ouvi que o patrocínio do festival caiu. Pode ter corte na programação."', '"O diretor tá de mau humor. Chega cedo no ensaio."'],
    clientes: ['"Aquela cliente difícil voltou a marcar. Coragem."', '"O preço do material subiu de novo. Vai ter que repassar."', '"Semana parada, ninguém agendou. Tá assim pra você também?"'],
    cozinha: ['"O chef mudou o cardápio pro fim de semana. Pré-preparo dobrado."', '"Vigilância sanitária passou na casa do lado. Pode ser a gente amanhã."', '"Salão lotado sábado, reserva até de mesa de canto."'],
    empresa: ['"O contador ligou: tem imposto vencendo semana que vem."', '"O fornecedor quer reajuste de novo. Vamos ter que conversar."', '"Um funcionário pediu as contas hoje. Precisamos repor rápido."']
  },
  trabalho_parceria: {
    escritorio: ['"Tive uma ideia pra um projeto e você é a pessoa certa. Bora apresentar juntos?"', '"Quer dividir aquele projeto novo comigo? Acho que a gente funciona."'],
    obra: ['"Peguei uma reforma por fora, no fim de semana. Topa dividir o serviço comigo?"', '"O encarregado pediu dois pra adiantar a laje. Vamos nós?"'],
    loja: ['"Vamos montar a vitrine nova juntos? Se bater a meta, a comissão é boa."', '"A gerência quer uma dupla pra abrir a filial. Coloquei seu nome."'],
    saude: ['"Vou propor uma melhoria no protocolo do setor. Escreve comigo?"', '"Troca de plantão comigo e a gente faz o mutirão juntos no sábado?"'],
    escola: ['"Quer montar uma feira de ciências com as nossas turmas juntas?"', '"Vamos fazer um projeto entre as nossas disciplinas? Os alunos vão gostar."'],
    clube: ['"Fica depois do treino pra gente ensaiar aquela jogada de bola parada?"', '"O professor pediu dupla pra treino extra de finalização. Vamos?"'],
    esports: ['"Vamos ficar depois do scrim revendo as rodadas? Acho que a gente encaixa a estratégia."', '"Topa fazer uma live em dupla no fim de semana? Os patrocinadores gostam."'],
    quartel: ['"Vão escolher dupla pro curso de especialização. Vamos nos inscrever juntos?"', '"Pediram voluntários pra operação no interior. Vamos?"'],
    campo: ['"Vamos dividir a máquina na colheita? Sai mais barato pros dois."', '"Tô pensando em entrar na cooperativa. Entra comigo?"'],
    palco: ['"Tô montando um espetáculo novo e queria você no elenco. Topa?"', '"Vamos fazer uma parceria numa música? Sua voz e meu arranjo."'],
    clientes: ['"Peguei um serviço grande demais pra fazer sozinh{po}. Divide comigo?"', '"Vamos fazer um pacote juntos pros clientes? Um indica o outro."'],
    cozinha: ['"Vamos sugerir um prato novo pro chef? Montei a receita, falta você."', '"Topa fazer um evento por fora no sábado? Bufê pra cem pessoas."'],
    empresa: ['"Apareceu um cliente grande. Vamos fechar juntos?"', '"Tô pensando em abrir uma segunda unidade. Entra comigo?"']
  },
  trabalho_credito: {
    escritorio: ['"Levaram o crédito pelo nosso trabalho. Vai deixar passar?"', '"Apresentaram a NOSSA ideia como se fosse só deles!"'],
    obra: ['"O encarregado falou pro engenheiro que a ideia da escora foi dele. A ideia foi sua!"', '"Mediram o serviço errado e o pagamento veio menor. Vamos reclamar?"'],
    loja: ['"Registraram a sua venda no código de outra pessoa. A comissão era sua!"', '"A gerente elogiou a vitrine… pra quem não fez nada."'],
    saude: ['"No relatório do caso de ontem, só saiu o nome do chefe de equipe. Quem segurou foi você."', '"Ignoraram a sua sugestão na reunião e agora aplicam como se fosse nova."'],
    escola: ['"A direção apresentou o seu projeto na secretaria como se fosse da coordenação."', '"Deram a turma que você queria pra quem chegou agora. Não foi justo."'],
    clube: ['"O professor deu entrevista dizendo que a jogada foi ideia do auxiliar. Foi sua!"', '"Te tiraram do time e ninguém explicou nada. Isso não tá certo."'],
    esports: ['"O coach falou na entrevista que a call do round decisivo foi dele. Foi sua!"', '"Te tiraram da line titular sem conversar. Vai deixar assim?"'],
    quartel: ['"O elogio da operação saiu no nome do sargento. Quem resolveu foi você."', '"Te escalaram de novo no fim de semana. Já é a terceira vez seguida."'],
    campo: ['"O vizinho tá dizendo pra todo mundo que o seu jeito de irrigar foi ideia dele."', '"O comprador pagou o seu lote como se fosse de segunda. Era de primeira!"'],
    palco: ['"Tiraram o seu nome dos créditos do espetáculo. Vai deixar passar?"', '"A crítica elogiou a cena que você criou — no nome do diretor."'],
    clientes: ['"Um concorrente tá copiando o seu trabalho e cobrando mais barato."', '"Aquele cliente postou o seu serviço sem te marcar. De novo."'],
    cozinha: ['"O chef serviu a sua receita no evento e não falou o seu nome."', '"A sobremesa que você criou foi pra revista como se fosse dele."'],
    empresa: ['"O sócio apresentou o seu plano pro banco como se fosse dele."', '"Um ex-funcionário abriu concorrência copiando o seu negócio."']
  }
};

/** A proposta que chega por um contato de trabalho (`celular15`): no ambiente de cada um. `extra` paga; o resto é indicação. */
export const PROPOSTAS30: Record<Ambiente30, { texto: string; extra: boolean }[]> = {
  escritorio: [{ texto: '"Tenho um trabalho extra, coisa de algumas semanas, e pensei em você. Paga bem. Topa?"', extra: true }, { texto: '"Um cliente meu precisa de alguém de confiança. Quer que eu indique você?"', extra: false }, { texto: '"Abriu uma vaga boa onde eu tô. Posso passar o seu nome?"', extra: false }],
  obra: [{ texto: '"Peguei uma reforma por fora, quinze dias de serviço, pagamento certo. Vem comigo?"', extra: true }, { texto: '"Uma construtora tá pegando gente boa de acabamento. Posso indicar você?"', extra: false }],
  loja: [{ texto: '"Tô precisando de gente pra uma feira de fim de semana. Paga a diária mais comissão. Topa?"', extra: true }, { texto: '"A loja do shopping vai abrir vaga de supervisão. Quer que eu indique você?"', extra: false }],
  saude: [{ texto: '"Tem uns plantões extras na clínica onde eu cubro. Quer pegar alguns?"', extra: true }, { texto: '"O hospital novo vai montar equipe. Posso passar o seu nome?"', extra: false }],
  escola: [{ texto: '"Um cursinho precisa de professor pra turma de fim de semana. Paga por aula. Topa?"', extra: true }, { texto: '"A escola onde eu dou aula vai abrir turma nova. Quer que eu indique você?"', extra: false }],
  clube: [{ texto: '"Uma escolinha quer você pra uma clínica com a criançada no fim de semana. Tem cachê. Topa?"', extra: true }, { texto: '"Um empresário que eu conheço perguntou de você. Posso passar o seu contato?"', extra: false }],
  esports: [{ texto: '"Uma marca quer jogadores pra um evento de lançamento. Cachê bom, uma tarde só. Topa?"', extra: true }, { texto: '"Uma org de fora tá olhando jogadores da sua função. Posso passar o seu contato?"', extra: false }],
  quartel: [{ texto: '"Tem um curso de especialização com vaga sobrando. Quer que eu fale de você pro instrutor?"', extra: false }],
  campo: [{ texto: '"O vizinho precisa de gente na colheita, duas semanas, paga por dia. Vem?"', extra: true }, { texto: '"A cooperativa vai contratar técnico de campo. Posso indicar você?"', extra: false }],
  palco: [{ texto: '"Um evento corporativo precisa de alguém como você. Uma noite, cachê fechado. Topa?"', extra: true }, { texto: '"Uma produtora tá montando elenco. Posso mandar o seu material?"', extra: false }],
  clientes: [{ texto: '"Tenho um cliente grande que não consigo atender. Quer pegar? Paga bem."', extra: true }, { texto: '"Uma amiga quer abrir um espaço e procura alguém do seu ramo. Posso passar o seu contato?"', extra: false }],
  cozinha: [{ texto: '"Tô fazendo um bufê de casamento no sábado e falta gente boa. Paga a diária. Vem?"', extra: true }, { texto: '"Um restaurante novo tá montando a cozinha. Posso indicar você?"', extra: false }],
  empresa: [{ texto: '"Um conhecido quer vender a carteira de clientes dele. Interessa? Posso apresentar vocês."', extra: false }, { texto: '"Tem uma licitação pequena que é a cara do seu negócio. Te mando os detalhes?"', extra: true }]
};
