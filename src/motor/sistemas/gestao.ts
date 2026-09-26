/**
 * Gestão do próprio negócio: o que dá para FAZER por ele, no idioma de cada
 * ofício. Não é um tycoon — são poucas ações fortes, escolhidas pelo
 * contexto (o movimento não reage, a casa enche, o caixa sobra, o sócio
 * cobra), e o resto atrás de "mais".
 *
 *   DIVULGAR — panfleto e faixa na rua; anúncio pago e influenciador na loja
 *   on-line; parceria com quem indica, no consultório; placa na obra.
 *   ESTRUTURA — o salão reformado, a cozinha nova, o elevador e o scanner
 *   da oficina, o estoque maior da loja on-line, o centro cirúrgico da
 *   clínica. Dura, e sobe o teto e a margem.
 *   ESPECIALIZAR — noivas e coloração, um prato da casa, injeção eletrônica,
 *   um nicho de produtos, uma especialização clínica. Dá nome; pode não pegar.
 *   CANAIS — aplicativo de entrega (lanchonete), agenda on-line (quem vive de
 *   horário marcado), transportadora melhor (loja on-line).
 *   FORNECEDOR, EQUIPE, CRÉDITO, GESTÃO, SÓCIO — o miúdo que faz a diferença.
 *
 * Tudo sai do caixa do negócio (e, se faltar, do seu bolso); tudo entra na
 * Linha da Vida quando muda alguma coisa de verdade.
 */

import type { Rng } from '../rng';
import { clamp } from '../rng';
import type { Acao } from '../acoes';
import type { Negocio, Vida } from '../tipos';
import { escrever, idade, lembrarCom } from '../nucleo';
import { bloqueio, podeTentar, PERMITIDO, type Veredito } from '../plausibilidade';
import { dinheiro as fmt } from '../texto';
import { disponivel, parcelaPrice } from './dinheiro';
import { juroDeFinanciamento } from './economia';
import { marcar } from './marcas';
import { aplicarPersonalidade } from '../personalidade';
import {
  cabeNoCaixaEBolso, custoLocal, dedicacaoDe, donoIntegral, em, nivelDe, pagarPeloCaixa, parteDoSocio, podeAbrirUnidade, podeAmpliar, podeTocarNasHorasVagas,
  passarParaHorasVagas, precoDaParteDoSocio, presencaDe, reservaDoCaixa, tamanhoDaEquipe, tem, tetoDoMovimento, tipoDoNegocio, nomeDaUnidade, negocioAberto
} from './negocio';
import type { AcaoProfissional } from './profissao';
import { seguranca } from './dinheiro';

/* ================================================================== Ações */

export type OqueGestao = 'divulgar' | 'estrutura_negocio' | 'especializar' | 'delivery' | 'agenda_online' | 'logistica' | 'fornecedor' | 'treinar' | 'credito_negocio' | 'gestao' | 'dedicacao' | 'comprar_parte' | 'conversar_socio';

const custoFrac = (v: Vida, n: Negocio, f: number) => Math.round(custoLocal(v, tipoDoNegocio(n)!) * f / 100) * 100;

/** Os nomes das ações, por ofício. */
const ROTULO_ESTRUTURA: Record<string, string> = {
  salao: 'Reformar o salão: cadeiras novas, lavatório, espelho grande', lanchonete: 'Cozinha nova: chapa, fritadeira, freezer maior', comercio: 'Reformar a loja e a vitrine',
  oficina: 'Comprar elevador e scanner de diagnóstico', loja_online: 'Estoque maior e um catálogo mais amplo', marcenaria: 'Máquinas melhores: seccionadora, coladeira de borda',
  estudio: 'Câmera, luz e lentes novas', consultoria_ti: 'Um escritório de verdade e ferramentas pagas', escritorio_contabil: 'Sistema contábil e uma sala maior',
  consultorio_psicologia: 'Uma sala mais acolhedora, com isolamento acústico', clinica_fisio: 'Aparelhos novos de fisioterapia', clinica_vet: 'Centro cirúrgico e raio-x', empreiteira: 'Andaimes, betoneira e ferramentas próprias'
};
const ROTULO_ESPECIALIZAR: Record<string, string> = {
  salao: 'Especializar-se em coloração e noivas', lanchonete: 'Um cardápio novo, com um prato da casa', comercio: 'Mudar o mix: produtos que o bairro não acha',
  oficina: 'Especializar-se em injeção eletrônica e carros híbridos', loja_online: 'Focar num nicho: menos produtos, cliente fiel', marcenaria: 'Móveis planejados, sob medida',
  estudio: 'Focar em casamentos e eventos', consultoria_ti: 'Especializar-se num setor (saúde, agro, varejo)', escritorio_contabil: 'Especializar-se em empresas do campo e do comércio',
  consultorio_psicologia: 'Fazer uma especialização clínica', clinica_fisio: 'Especializar-se em fisioterapia esportiva e pilates', clinica_vet: 'Atender também animais exóticos legalizados', empreiteira: 'Especializar-se em reforma com acabamento fino'
};
const DIVULGAR: Record<string, [rotulo: string, texto: string]> = {
  rua: ['Divulgar no bairro', 'Faixa na fachada, panfleto no semáforo, um perfil caprichado nas redes do bairro.'],
  online: ['Pagar anúncios e chamar um influenciador', 'Anúncio pago nas redes e um influenciador pequeno mostrando o produto.'],
  atendimento: ['Fazer parcerias com quem indica', 'Conversa com quem costuma indicar gente.'],
  obra: ['Divulgar nas obras e lojas de material', 'Placa em toda obra, cartão no balcão das lojas de material de construção.']
};

/** Quem indica, por ofício (a parceria de um consultório não é a de uma consultoria de software). */
const QUEM_INDICA: Record<string, string> = {
  consultorio_psicologia: 'médicos, escolas e o RH de empresas', clinica_fisio: 'ortopedistas, academias e clubes', clinica_vet: 'pet shops, criadores e abrigos',
  consultoria_ti: 'contadores, associações comerciais e agências', escritorio_contabil: 'bancos, sindicatos patronais e quem abre empresa', estudio: 'cerimonialistas, buffets e salões de festa'
};

/** O que a especialização vira, dito como fato ("a referência em noivas da cidade"). */
const ESPECIALIDADE: Record<string, string> = {
  salao: 'coloração e noivas', lanchonete: 'o prato da casa, que atrai gente de outros bairros', comercio: 'os produtos que o bairro não achava em outro lugar',
  oficina: 'injeção eletrônica e carros híbridos', loja_online: 'um nicho, com cliente que volta a comprar', marcenaria: 'móveis planejados, sob medida',
  estudio: 'casamentos e eventos', consultoria_ti: 'sistemas para um setor só (saúde, agro, varejo)', escritorio_contabil: 'empresas do campo e do comércio',
  consultorio_psicologia: 'uma especialização clínica', clinica_fisio: 'fisioterapia esportiva e pilates', clinica_vet: 'animais exóticos legalizados', empreiteira: 'reforma com acabamento fino'
};

/** As ações de gestão que fazem sentido agora (a UI separa em agora/mais/saídas). */
export function acoesDoNegocio(v: Vida, disp: (v: Vida, a: Acao) => Veredito): AcaoProfissional[] {
  const n = negocioAberto(v);
  if (!n) return [];
  const t = tipoDoNegocio(n)!;
  const out: AcaoProfissional[] = [];
  const P = (oque: string, extra: Record<string, unknown> = {}): Acao => ({ tipo: 'profissao', oque, ...extra } as unknown as Acao);
  const add = (x: AcaoProfissional) => {
    if (x.acao) { const d = disp(v, x.acao); if (!podeTentar(d)) return; if (d.grau === 'improvavel' || d.grau === 'irregular') x.aviso = x.aviso ?? d.motivo; }
    out.push(x);
  };
  const p = presencaDe(n);
  const teto = tetoDoMovimento(n);
  const eq = tamanhoDaEquipe(n);
  const cheio = n.clientela >= teto - 3 && teto < 100;
  const apertado = n.estado === 'apertado';
  const paralela = dedicacaoDe(n) === 'paralela';
  const seg = seguranca(v);
  const aperto = seg.nivel === 'no_vermelho' || seg.nivel === 'apertado';
  const sobra = (n.caixa ?? 0) - reservaDoCaixa(v, n);

  // Crescer.
  add({ id: 'contratar', rotulo: eq === 0 ? 'Contratar a primeira pessoa' : 'Contratar mais alguém', porque: cheio ? (eq === 0 ? (paralela ? 'Sem ninguém no dia a dia, o negócio abre pouco.' : 'Sozinho, não dá para atender mais.') : 'A equipe já não dá conta.') : apertado ? 'Com o movimento fraco, é mais uma conta.' : undefined, acao: P('contratar'), peso: cheio ? 8 : apertado ? 0 : paralela && eq === 0 && p === 'rua' ? 6 : 2 });
  if (podeTentar(podeAmpliar(v))) add({ id: 'ampliar', rotulo: n.emCasa ? (p === 'online' ? 'Sair de casa: um galpão pequeno' : p === 'atendimento' ? 'Sair de casa: uma sala de atendimento' : 'Sair de casa: abrir um ponto') : 'Ampliar o negócio', porque: 'Dá para crescer — e a conta cresce junto.', acao: P('ampliar'), peso: 6 });
  if (podeTentar(podeAbrirUnidade(v))) add({ id: 'unidade', rotulo: `Abrir ${nomeDaUnidade(n)}`, porque: 'A primeira frente está firme.', acao: P('unidade'), peso: 5 });
  // O ofício.
  add({ id: 'divulgar', rotulo: DIVULGAR[p][0], porque: n.clientela < 35 ? 'Pouca gente sabe que você existe.' : undefined, acao: P('divulgar'), peso: n.clientela < 35 ? 6 : 1 });
  if (t.acoes.includes('estrutura') && nivelDe(n, 'estrutura') < 2) add({ id: 'estrutura_negocio', rotulo: ROTULO_ESTRUTURA[t.id] ?? 'Investir na estrutura', porque: cheio ? 'Mais estrutura, mais gente atendida.' : `Uns ${fmt(custoFrac(v, n, 0.25))}.`, acao: P('estrutura_negocio'), peso: cheio ? 5 : 2 });
  if (t.acoes.includes('especializar') && !tem(n, 'especialidade')) add({ id: 'especializar', rotulo: ROTULO_ESPECIALIZAR[t.id] ?? 'Especializar-se', porque: (n.reputacao ?? 40) < 50 ? 'Um nome se faz com alguma coisa que só você faz.' : undefined, acao: P('especializar'), peso: (v.t - n.tInicio) / 12 >= 2 ? 3 : 1 });
  if (t.acoes.includes('delivery') && !tem(n, 'delivery')) add({ id: 'delivery', rotulo: 'Entrar nos aplicativos de entrega', porque: n.clientela < 45 ? 'Metade da cidade pede comida pelo celular.' : undefined, acao: P('delivery'), peso: n.clientela < 45 ? 5 : 2 });
  if (t.acoes.includes('agenda_online') && !tem(n, 'agenda')) add({ id: 'agenda_online', rotulo: 'Agenda on-line, com lembrete por mensagem', porque: 'Menos horário vazio por esquecimento.', acao: P('agenda_online'), peso: 2 });
  if (t.acoes.includes('logistica') && !tem(n, 'logistica')) add({ id: 'logistica', rotulo: 'Trocar de transportadora e embalar melhor', porque: 'Entrega que atrasa vira avaliação ruim.', acao: P('logistica'), peso: (n.reputacao ?? 40) < 45 ? 5 : 2 });
  if (t.acoes.includes('fornecedor') && !tem(n, 'fornecedor') && !tem(n, 'fornecedor_ruim')) add({ id: 'fornecedor', rotulo: p === 'obra' ? 'Negociar com outra loja de material' : 'Trocar de fornecedor', porque: apertado ? 'Cada real de margem conta.' : undefined, acao: P('fornecedor'), peso: apertado ? 4 : 1 });
  if (eq >= 2 && !tem(n, 'treino')) add({ id: 'treinar', rotulo: 'Treinar a equipe', porque: 'Gente bem treinada fica e atende melhor.', acao: P('treinar'), peso: 2 });
  if ((eq >= 2 || (n.porte ?? 1) >= 2 || (n.unidades ?? 1) >= 2) && !tem(n, 'gestao')) add({ id: 'gestao', rotulo: 'Profissionalizar a gestão: contador, sistema, processos', porque: (n.unidades ?? 1) >= 2 ? 'Com mais de uma frente, dinheiro some sem controle.' : undefined, acao: P('gestao'), peso: (n.unidades ?? 1) >= 2 ? 5 : 2 });
  add({ id: 'estrategia', rotulo: 'Mudar o jeito de vender', porque: apertado ? 'O movimento não reage.' : undefined, acao: P('estrategia'), peso: apertado ? 6 : (v.fatos['negocio_estrategia'] === undefined && (v.t - n.tInicio) / 12 >= 3) ? 2 : 0 });
  // Dinheiro.
  if (sobra >= 3000) add({ id: 'retirar', rotulo: `Tirar ${fmt(Math.round(sobra / 100) * 100)} do caixa`, porque: paralela ? 'Nas horas vagas não há retirada fixa: o que sobra só vira seu quando você tira.' : 'O que sobra no caixa não é seu até você tirar.', acao: P('retirar'), peso: aperto ? 8 : 5 });
  if ((n.caixa ?? 0) < reservaDoCaixa(v, n) && !v.financas.negativado) add({ id: 'credito_negocio', rotulo: 'Pegar crédito para o negócio', porque: apertado ? 'O caixa secou.' : undefined, acao: P('credito_negocio'), peso: apertado ? 3 : 0, aviso: 'É dívida no seu nome, mesmo que o negócio feche.' });
  // Gente.
  if (!n.socioId) add({ id: 'socio', rotulo: 'Trazer um sócio', porque: apertado ? 'Dinheiro novo, e alguém para dividir o risco.' : undefined, acao: P('socio'), peso: apertado ? 3 : 1 });
  if (n.socioId && v.pessoas[n.socioId]?.vivo) {
    const s = v.pessoas[n.socioId];
    add({ id: 'conversar_socio', rotulo: `Conversar com ${s.nome} sobre o negócio`, porque: (v.vinculos[s.id]?.tensao ?? 0) > 35 ? 'A relação anda estremecida.' : undefined, acao: P('conversar_socio'), peso: (v.vinculos[s.id]?.tensao ?? 0) > 35 ? 6 : 2 });
    add({ id: 'comprar_parte', rotulo: `Comprar a parte de ${s.nome} (${fmt(precoDaParteDoSocio(v, n))})`, acao: P('comprar_parte'), peso: 1 });
  }
  for (const f of n.equipe ?? []) { const q = v.pessoas[f.pessoaId]; if (q) add({ id: `demitir_${q.id}`, rotulo: `Demitir ${q.nome}`, porque: apertado ? 'A folha pesa mais do que o movimento paga.' : undefined, acao: P('demitir', { pessoaId: q.id }), peso: apertado ? 4 : 0 }); }
  // A vida em volta do negócio.
  if (paralela) add({ id: 'dedicacao', rotulo: `Dedicar-se só a ${n.nome}`, porque: n.clientela >= 50 ? 'Nas horas vagas, o negócio já não cabe.' : undefined, acao: P('dedicacao', { valor: 'integral' }), peso: n.clientela >= 50 ? 5 : 1 });
  else if (donoIntegral(v) && podeTocarNasHorasVagas(v, n)) add({ id: 'dedicacao', rotulo: `Passar ${n.nome} para as horas vagas`, porque: 'Para ter outro trabalho, ou mais vida fora dele.', acao: P('dedicacao', { valor: 'paralela' }), peso: 0 });
  add({ id: 'vender', rotulo: parteDoSocio(n) ? 'Vender a sua parte' : 'Vender o negócio', porque: idade(v) >= 60 ? 'Passar adiante enquanto vale.' : undefined, acao: P('vender'), peso: idade(v) >= 60 ? 5 : 0 });
  add({ id: 'fechar', rotulo: p === 'online' ? 'Tirar a loja do ar' : 'Fechar o negócio', acao: P('fechar'), peso: 0, saida: true });
  return out;
}

/* ============================================================ Disponibilidade */

export function disponibilidadeGestao(v: Vida, oque: OqueGestao, valor?: string): Veredito {
  const n = negocioAberto(v);
  if (!n) return bloqueio('impossivel', 'Não há negócio.');
  const t = tipoDoNegocio(n)!;
  const ja = (k: string) => v.anoAtual.acoes.includes(k);
  const custa = (f: number, oq: string): Veredito => cabeNoCaixaEBolso(v, n, custoFrac(v, n, f)) ? PERMITIDO : bloqueio('requisito', `${oq} custa uns ${fmt(custoFrac(v, n, f))} — entre o caixa e o seu bolso, não há.`);
  switch (oque) {
    case 'divulgar': {
      const ult = v.fatos[`neg_divulgou_${n.tInicio}`];
      if (ult !== undefined && v.t - ult < 24) return bloqueio('incompativel', 'A última campanha foi há pouco: espere o efeito passar.');
      return custa(0.08, 'Divulgar');
    }
    case 'estrutura_negocio': if (!t.acoes.includes('estrutura')) return bloqueio('impossivel', 'Não se aplica.'); if (nivelDe(n, 'estrutura') >= 2) return bloqueio('impossivel', 'Já investiu o que dá.'); if (ja('neg_estrutura')) return bloqueio('incompativel', 'Uma obra por ano já é bastante.'); return custa(0.25, 'Isso');
    case 'especializar': if (!t.acoes.includes('especializar') || tem(n, 'especialidade')) return bloqueio('impossivel', 'Não se aplica.'); if (v.fatos[`neg_espec_falhou_${n.tInicio}`] !== undefined && v.t - v.fatos[`neg_espec_falhou_${n.tInicio}`] < 36) return bloqueio('incompativel', 'A última tentativa não pegou; ainda é cedo para outra.'); return custa(0.15, 'Especializar-se');
    case 'delivery': return t.acoes.includes('delivery') && !tem(n, 'delivery') ? PERMITIDO : bloqueio('impossivel', 'Não se aplica.');
    case 'agenda_online': return t.acoes.includes('agenda_online') && !tem(n, 'agenda') ? custa(0.03, 'A agenda on-line') : bloqueio('impossivel', 'Não se aplica.');
    case 'logistica': return t.acoes.includes('logistica') && !tem(n, 'logistica') ? custa(0.06, 'Isso') : bloqueio('impossivel', 'Não se aplica.');
    case 'fornecedor': return t.acoes.includes('fornecedor') && !tem(n, 'fornecedor') && !tem(n, 'fornecedor_ruim') ? PERMITIDO : bloqueio('impossivel', 'Não se aplica.');
    case 'treinar': return tamanhoDaEquipe(n) >= 1 && !tem(n, 'treino') ? custa(0.02 * tamanhoDaEquipe(n), 'Treinar a equipe') : bloqueio('impossivel', 'Não se aplica.');
    case 'gestao': return tem(n, 'gestao') ? bloqueio('impossivel', 'Já é assim.') : custa(0.05, 'Isso');
    case 'credito_negocio': {
      if (v.financas.negativado) return bloqueio('requisito', 'Com o nome sujo, o banco não empresta nem para o negócio.');
      if (ja('neg_credito')) return bloqueio('incompativel', 'Já pediu crédito neste ano.');
      if (v.financas.dividas.some(d => d.descricao.startsWith('Crédito para ') && d.saldo > 0)) return bloqueio('incompativel', 'Ainda está pagando o último crédito do negócio.');
      return PERMITIDO;
    }
    case 'dedicacao':
      if (valor === 'integral') return dedicacaoDe(n) === 'paralela' ? PERMITIDO : bloqueio('impossivel', 'Já é o seu trabalho de todo dia.');
      if (valor === 'paralela') return donoIntegral(v) ? (podeTocarNasHorasVagas(v, n) ? PERMITIDO : bloqueio('requisito', 'Sem ninguém para abrir a porta todo dia, o negócio não anda nas horas vagas: primeiro, alguém na equipe.')) : bloqueio('impossivel', 'Já está nas horas vagas.');
      return bloqueio('impossivel', 'Não se aplica.');
    case 'comprar_parte': {
      if (!n.socioId) return bloqueio('impossivel', 'Não há sócio.');
      const preco = precoDaParteDoSocio(v, n);
      return disponivel(v) >= preco ? PERMITIDO : bloqueio('requisito', `A parte vale uns ${fmt(preco)}; você não tem esse dinheiro.`);
    }
    case 'conversar_socio': return n.socioId && v.pessoas[n.socioId]?.vivo ? (ja('neg_socio_conversa') ? bloqueio('incompativel', 'Vocês já sentaram para conversar neste ano.') : PERMITIDO) : bloqueio('impossivel', 'Não há sócio.');
  }
}

/* ================================================================ Execução */

export interface SaidaGestao { texto?: string; tom?: 'bom' | 'ruim' | 'neutro'; decisao?: string; papeis?: Record<string, string>; conflito?: boolean }

export function executarGestao(v: Vida, r: Rng, oque: OqueGestao, valor?: string): SaidaGestao {
  const n = negocioAberto(v)!;
  const t = tipoDoNegocio(n)!;
  const p = presencaDe(n);
  const melhorar = (m: string) => { (n.melhorias ??= []).push(m); };
  const movimento = (x: number) => { n.clientela = Math.round(clamp(n.clientela + x, 0, tetoDoMovimento(n))); if (donoIntegral(v)) v.trabalho.atual!.clientela = n.clientela; };
  switch (oque) {
    case 'divulgar': {
      const custo = custoFrac(v, n, 0.08);
      pagarPeloCaixa(v, n, custo);
      v.fatos[`neg_divulgou_${n.tInicio}`] = v.t;
      const deu = r.chance(0.7);
      movimento(deu ? 6 : 2);
      if (deu) n.reputacao = clamp((n.reputacao ?? 40) + 2);
      const como = p === 'atendimento' && QUEM_INDICA[t.id] ? `Conversa com quem costuma indicar gente: ${QUEM_INDICA[t.id]}.` : DIVULGAR[p][1];
      escrever(v, { texto: `${como} ${deu ? `Veio gente nova para ${n.nome}.` : 'O retorno foi menor do que o esperado.'}`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: `${fmt(custo)} em divulgação. ${deu ? 'Chegou gente nova — e o efeito dura um tempo.' : 'Pouca gente nova apareceu.'}`, tom: deu ? 'bom' : 'neutro' };
    }
    case 'estrutura_negocio': {
      const custo = custoFrac(v, n, 0.25);
      pagarPeloCaixa(v, n, custo);
      n.capital += Math.round(custo * 0.5);
      v.anoAtual.acoes.push('neg_estrutura');
      const nivel = nivelDe(n, 'estrutura') + 1;
      melhorar(`estrutura${nivel}`);
      n.reputacao = clamp((n.reputacao ?? 40) + 3);
      const rotulo = ROTULO_ESTRUTURA[t.id] ?? 'Investiu na estrutura';
      escrever(v, { texto: `${n.nome}: ${rotulo.charAt(0).toLowerCase() + rotulo.slice(1)}. Custou ${fmt(custo)}.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      aplicarPersonalidade(v, 'acao:neg_estrutura', { disciplina: 1 });
      return { texto: `Feito, por ${fmt(custo)}: mais gente atendida, margem melhor — o retorno vem com o tempo.`, tom: 'bom' };
    }
    case 'especializar': {
      const custo = custoFrac(v, n, 0.15);
      pagarPeloCaixa(v, n, custo);
      const pegou = r.chance(0.65 + Math.min(0.15, (n.reputacao ?? 40) / 400));
      if (pegou) {
        melhorar('especialidade');
        n.reputacao = clamp((n.reputacao ?? 40) + 8);
        const texto = `${n.nome} ganhou um nome na praça: ${ESPECIALIDADE[t.id] ?? 'uma especialidade que é só dela'}.`;
        escrever(v, { texto, relevancia: 'biografia', tema: 'trabalho', escolha: true, tom: 'bom' });
        marcar(v, 'conquista', texto, 2, { ocupacaoId: n.ocupacaoId });
        return { texto: `Pegou. Agora é disso que falam quando falam de ${n.nome}.`, tom: 'bom' };
      }
      v.fatos[`neg_espec_falhou_${n.tInicio}`] = v.t;
      escrever(v, { texto: `Tentou fazer de ${n.nome} referência em ${ESPECIALIDADE[t.id]?.replace(/^(a|o|as|os) /, '') ?? 'alguma coisa só sua'}. Não pegou: ${fmt(custo)} a menos no caixa.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true, tom: 'ruim' });
      return { texto: 'Não pegou. Quem vinha continuou vindo pelo de sempre.', tom: 'ruim' };
    }
    case 'delivery': {
      melhorar('delivery');
      movimento(5);
      escrever(v, { texto: `${n.nome} entrou nos aplicativos de entrega: mais pedido, taxa de cada um, motoboy na porta.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: 'Mais pedidos a cada ano — e cada um deixa menos, com a taxa do aplicativo.', tom: 'neutro' };
    }
    case 'agenda_online': {
      const custo = custoFrac(v, n, 0.03);
      pagarPeloCaixa(v, n, custo);
      melhorar('agenda');
      movimento(2);
      escrever(v, { texto: `${n.nome} passou a marcar horário on-line, com lembrete por mensagem.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: 'Menos falta, menos buraco na agenda.', tom: 'bom' };
    }
    case 'logistica': {
      const custo = custoFrac(v, n, 0.06);
      pagarPeloCaixa(v, n, custo);
      melhorar('logistica');
      n.reputacao = clamp((n.reputacao ?? 40) + 5);
      escrever(v, { texto: `${n.nome} trocou de transportadora e passou a embalar melhor: menos atraso, menos devolução.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      return { texto: 'Entrega no prazo, avaliação melhor.', tom: 'bom' };
    }
    case 'fornecedor': {
      const deu = r.chance(0.6);
      if (deu) melhorar('fornecedor'); else { melhorar('fornecedor_ruim'); n.reputacao = clamp((n.reputacao ?? 40) - 5); }
      escrever(v, { texto: deu ? `${n.nome} trocou de fornecedor e passou a comprar melhor: a margem subiu.` : `O fornecedor novo de ${n.nome} saiu mais barato — e pior. ${t.cliente === 'freguês' ? 'Freguês' : 'Cliente'} reparou.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true, tom: deu ? 'bom' : 'ruim' });
      return { texto: deu ? 'Comprar melhor é lucro que não aparece na porta.' : 'Barato demais saiu caro: a qualidade caiu.', tom: deu ? 'bom' : 'ruim' };
    }
    case 'treinar': {
      const custo = custoFrac(v, n, 0.02 * tamanhoDaEquipe(n));
      pagarPeloCaixa(v, n, custo);
      melhorar('treino');
      n.reputacao = clamp((n.reputacao ?? 40) + 4);
      movimento(2);
      for (const f of n.equipe ?? []) { const vin = v.vinculos[f.pessoaId]; if (vin) vin.proximidade = clamp(vin.proximidade + 3); }
      escrever(v, { texto: `A equipe ${em(n.nome)} passou por um treinamento, pago pelo caixa.`, relevancia: 'cotidiano', tema: 'trabalho', escolha: true });
      aplicarPersonalidade(v, 'acao:treinar_equipe', { generosidade: 1 });
      return { texto: 'Gente que sabe o que faz fica mais e atende melhor.', tom: 'bom' };
    }
    case 'gestao': {
      const custo = custoFrac(v, n, 0.05);
      pagarPeloCaixa(v, n, custo);
      melhorar('gestao');
      escrever(v, { texto: `${n.nome} ganhou contador de verdade, sistema e processos: o dinheiro passou a ter caminho.`, relevancia: 'biografia', tema: 'trabalho', escolha: true });
      aplicarPersonalidade(v, 'acao:gestao', { disciplina: 1 });
      return { texto: 'Mais controle: menos chance de o dinheiro sumir, um pouco mais de custo todo mês.', tom: 'bom' };
    }
    case 'credito_negocio': {
      const valorCred = custoFrac(v, n, 0.4);
      const j = juroDeFinanciamento(v, 'emprestimo');
      v.financas.dividas.push({ id: `d${v.seq++}`, tipo: 'emprestimo', saldo: valorCred, jurosMes: j, parcela: Math.round(parcelaPrice(valorCred, j, 36)), descricao: `Crédito para ${n.nome}`, tInicio: v.t, prazo: 36 });
      n.caixa = (n.caixa ?? 0) + valorCred;
      v.anoAtual.acoes.push('neg_credito');
      escrever(v, { texto: `Pegou ${fmt(valorCred)} de crédito para ${n.nome}, em 36 parcelas no seu nome.`, relevancia: 'cotidiano', tema: 'dinheiro', escolha: true });
      aplicarPersonalidade(v, 'acao:credito_negocio', { coragem: 1 });
      return { texto: `${fmt(valorCred)} no caixa. A dívida é sua, mesmo que o negócio feche.`, tom: 'neutro' };
    }
    case 'dedicacao': {
      if (valor === 'paralela') {
        passarParaHorasVagas(v, n, 'por escolha');
        return { texto: `${n.nome} fica para as horas vagas: dá para procurar outro trabalho. Sem retirada fixa; o que sobrar fica no caixa.`, tom: 'neutro' };
      }
      return { conflito: true };
    }
    case 'comprar_parte': return { decisao: 'neg_comprar_parte', papeis: n.socioId ? { socio: n.socioId } : {} };
    case 'conversar_socio': {
      v.anoAtual.acoes.push('neg_socio_conversa');
      return { decisao: 'negsoc_conversa', papeis: n.socioId ? { socio: n.socioId } : {} };
    }
  }
}

export { lembrarCom };
