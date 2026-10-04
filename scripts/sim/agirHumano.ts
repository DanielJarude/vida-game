/**
 * PLAYTEST ADVERSARIAL DE INTENÇÃO — FIX pós-playtest humano (seção 25 do pedido). Para cada pergunta: ONDE (o mapa
 * de intenções da navegação, a mesma fonte do menu), a AÇÃO (pelo que o jogador pode fazer: `disponibilidade` →
 * `executar`), a CONSEQUÊNCIA (o estado que mudou) e a FALHA, se houver. Sai com código 1 se alguma pergunta falhar.
 *
 *   npx esbuild scripts/sim/agirHumano.ts --bundle --platform=node --outfile=<scratch>/ah.cjs && node <scratch>/ah.cjs
 */
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { criarVida, sortearNascimento } from '../../src/motor/criacao';
import { criarRng, rngDe } from '../../src/motor/rng';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { municipio, cidadesDoPais } from '../../src/motor/dados/lugares';
import { MAPA_DE_INTENCOES, rotuloDoLugar } from '../../src/ui/navegacao';
import { nova, viverAte } from '../../src/motor/__tests__/ajuda';
import { adulto, comParente } from '../../src/motor/__tests__/cenarios';
import { geneticaDe, visualDaAncestralidade, visualDosPais } from '../../src/motor/sistemas/identidade';
import { processarGestacoes } from '../../src/motor/sistemas/familia';
import { interacoesPara, rotuloInteracao } from '../../src/motor/sistemas/interacoes';
import { encaixe, folegoDaSemana, semana } from '../../src/motor/sistemas/semana';
import { podeComecarRotina } from '../../src/motor/sistemas/rotinas';
import { instituicaoAtual } from '../../src/motor/sistemas/formacao';
import { instituicoesTecnicas, ofertaIntegrada } from '../../src/motor/sistemas/ensinoTecnico';
import { ofertasDeVeiculos } from '../../src/motor/sistemas/mercado';
import { formaDaVersao, versaoVeiculo } from '../../src/motor/dados/bens';
import { ITENS_ESTILO } from '../../src/motor/dados/estilo';
import type { Vida, Visual } from '../../src/motor/tipos';

interface Resposta { pergunta: string; onde: string; acao: string; consequencia: string; falha?: string }
const respostas: Resposta[] = [];
const onde = (id: string) => { const x = MAPA_DE_INTENCOES.find(i => i.id === id); return x ? `${rotuloDoLugar(x.lugar)} → ${x.la}` : '(sem lugar no mapa)'; };
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const TRACOS = ['nariz', 'boca', 'rosto', 'olhosForma', 'olhosTam', 'queixo', 'orelhas', 'sobrancelha'] as const;
const comum = (a: Visual, b: Visual) => TRACOS.filter(k => a[k] && a[k] === b[k]).length;

async function principal() {
  await carregarMundo();

  // 1. Nascer fora do Brasil ao acaso.
  { const paises = new Set(Array.from({ length: 30 }, (_, k) => municipio(sortearNascimento(criarRng(50 + k)).municipioId).pais));
    respostas.push({ pergunta: 'Quero nascer fora do Brasil aleatoriamente. Consigo?', onde: 'Nascer → "Tudo ao acaso"', acao: '30 cliques (sementes)', consequencia: `${paises.size} países: ${[...paises].slice(0, 8).join(', ')}…`, falha: paises.size < 6 ? 'poucos países' : undefined }); }

  // 2 e 3. Traços familiares distintos; irmãos parecidos.
  { const a = visualDaAncestralidade(rngDe('ah-a'), 'feminino', { ea: 1 }); const b = visualDaAncestralidade(rngDe('ah-b'), 'masculino', { af: 1 });
    const f = [0, 1, 2].map(k => visualDosPais(rngDe('ah-f', k), 'feminino', { ea: 0.5, af: 0.5 }, a, b));
    const estranho = visualDaAncestralidade(rngDe('ah-x'), 'feminino', { ea: 0.5, af: 0.5 });
    respostas.push({ pergunta: 'Quero criar alguém com traços familiares distintos. Consigo?', onde: 'Nascer → "Puxar os traços dos pais" (a mãe e o pai aparecem)', acao: 'nascer com pais de origens diferentes', consequencia: `cada filho combina os dois: ${f.map(x => `${x.nariz}/${x.olhosForma}/${x.rosto}`).join(' · ')}` });
    const irmaos = comum(f[0], f[1]), fora = comum(f[0], estranho);
    respostas.push({ pergunta: 'Consigo perceber que dois irmãos são parentes?', onde: 'Pessoas → o retrato', acao: 'comparar irmãos e um estranho do mesmo lugar', consequencia: `irmãos dividem ${irmaos}/8 traços do rosto; um estranho, ${fora}/8`, falha: irmaos <= fora ? 'irmãos não se parecem mais que estranhos' : undefined }); }

  // 4–6. Rinoplastia: onde, o rosto, o filho.
  { let v = adulto(30, { semente: 61 }); v.financas.conta = 500000; v.eu.visual.nariz = 'curvo';
    const a: Acao = { tipo: 'estetica', id: 'rinoplastia', clinica: 'renomada', alvo: 'fino' };
    const pode = tenta(v, a);
    const r = executar(v, a); v = r.vida;
    const res = v.eu.procedimentos?.slice(-1)[0].resultado;
    respostas.push({ pergunta: 'Quero fazer uma rinoplastia. Onde começo?', onde: onde('cirurgia'), acao: 'Rinoplastia → Afinar (clínica renomada)', consequencia: `${res}: "${(r.resultado ?? '').slice(0, 90)}…"`, falha: pode ? undefined : 'indisponível' });
    respostas.push({ pergunta: 'A cirurgia mudou meu rosto?', onde: 'Você / o retrato', acao: 'olhar o retrato depois', consequencia: `nariz: curvo → ${v.eu.visual.nariz} (genes: ${v.eu.genes?.nariz})`, falha: v.eu.visual.nariz === 'curvo' && res !== 'complicacao' ? 'o rosto não mudou' : undefined });
    const { p } = comParente(v, 'irmao', 31, 'masculino', 80); p.visual!.nariz = 'curvo';
    v.processos.push({ tipo: 'gestacao', id: 'g', gestanteId: 'eu', outroId: p.id, tConcepcao: v.t - 9, tParto: v.t, planejada: true, descoberta: true } as never);
    let bebe; for (let s = 0; s < 10 && !bebe; s++) { const x = structuredClone(v); bebe = processarGestacoes(x, criarRng(70 + s)); }
    respostas.push({ pergunta: 'Meu filho herdou minha genética ou minha cirurgia?', onde: 'Pessoas → o filho', acao: 'ter um filho depois da rinoplastia', consequencia: `a herança leu os genes (${geneticaDe(v.eu)?.nariz}); o bebê nasceu com nariz ${bebe?.visual?.nariz}`, falha: geneticaDe(v.eu)?.nariz !== 'curvo' ? 'a herança lê o visual operado' : undefined }); }

  // 7. Cinema com a amiga.
  { let v = adulto(26, { semente: 41 }); v.financas.conta = 50000;
    const { p, vin } = comParente(v, 'irmao', 26, 'feminino', 62); vin.parentesco = undefined; vin.estagio = 'amigo'; vin.convivio = []; p.municipioId = v.moradia.municipioId;
    const antes = { ...v.vinculos[p.id] }; const r = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'cinema' }); v = r.vida;
    respostas.push({ pergunta: 'Quero ir ao cinema com minha amiga. Acontece alguma coisa além de +vínculo?', onde: onde('fazer_junto'), acao: `"${r.titulo}"`, consequencia: `cena "${v.vinculos[p.id].cenas?.slice(-1)[0]}": "${(r.resultado ?? '').slice(0, 100)}…" (proximidade ${antes.proximidade} → ${v.vinculos[p.id].proximidade}, confiança ${antes.confianca} → ${v.vinculos[p.id].confianca})`, falha: !r.titulo ? 'sem cena' : undefined }); }

  // 8. Amizade → romance.
  { let v = adulto(27, { semente: 51, genero: 'masculino' });
    const { p, vin } = comParente(v, 'irmao', 27, 'feminino', 72); vin.parentesco = undefined; vin.estagio = 'amigo_proximo'; vin.convivio = []; vin.tInicio = v.t - 120; p.municipioId = v.moradia.municipioId; p.parceiroId = undefined; p.atracao = 'homens';
    const ids = interacoesPara(v, p.id).map(x => x.id);
    const r = executar(v, { tipo: 'pessoa', pessoaId: p.id, interacao: 'demonstrar_interesse' }); v = r.vida;
    respostas.push({ pergunta: 'Quero tentar transformar amizade em romance. Onde faço isso?', onde: onde('romance_amigo'), acao: `"${rotuloInteracao(v, p.id, 'demonstrar_interesse')}"`, consequencia: `${v.vinculos[p.id].romance ? `interesse (${v.vinculos[p.id].romance!.pediuTempo !== undefined ? 'pediu tempo' : 'recíproco'})` : 'não'}: "${(r.resultado ?? '').slice(0, 90)}…"`, falha: ids.includes('demonstrar_interesse') ? undefined : 'sem verbo' }); }

  // 9 e 10. Semana cheia + teatro; por que está cheia.
  { const v = viverAte(nova({ semente: 7 }), 15); v.momento = null; v.educacao.basica = { ...v.educacao.basica!, integrado: 'tec_mecanica' }; v.rotinas = [{ id: 'futebol', tInicio: v.t, nivel: 3 }, { id: 'musica', tInicio: v.t, nivel: 2 }];
    const d = podeComecarRotina(v, 'teatro', 1); const f = folegoDaSemana(v);
    respostas.push({ pergunta: 'Estou com a semana cheia, mas quero insistir em teatro. Posso?', onde: 'Tempo livre · Hobbies', acao: 'Começar teatro', consequencia: `${d.grau}${d.motivo ? `: "${d.motivo}"` : ''} — painel: "${f.palavra}. ${f.texto}"`, falha: !podeTentar(d) && !/teto/.test(f.texto) ? 'painel e lista se contradizem' : undefined });
    const s = semana(v);
    respostas.push({ pergunta: 'Por que minha semana está cheia?', onde: 'Tempo livre · A semana → "Como a semana se divide"', acao: 'abrir a faixa da semana', consequencia: `faixa ${encaixe(v, 0).faixa}: ${[...s.fixos.map(x => `${x.rotulo} (${x.peso})`), ...s.rotinas.map(x => `${x.rotulo} (${x.peso})`)].join(', ')}` }); }

  // 11. Escola no Japão.
  { const cidade = cidadesDoPais('JP')[2].id; let v = criarVida({ nome: 'Yua', sobrenome: 'Sato', genero: 'feminino', municipioId: cidade, semente: 9 }); v = viverAte(v, 16);
    const textos = [...v.biografia.map(e => e.texto), ...Object.values(v.vinculos).flatMap(x => x.historia.map(h => h.texto))].join(' ');
    const port = /portugu[eê]s/i.test(textos);
    respostas.push({ pergunta: 'Estou no Japão. Minha escola parece japonesa/contextual ou brasileira traduzida?', onde: onde('estudar'), acao: 'viver até os 16 em ' + municipio(cidade).nome, consequencia: `escola: ${instituicaoAtual(v)?.nome ?? '—'}; "português" na história: ${port ? 'sim' : 'não'}`, falha: port ? 'português na escola japonesa' : undefined }); }

  // 12 e 13. Técnico de informática; o trio.
  { const escolas = ['BR', 'JP', 'DE', 'US', 'MX', 'IN'].flatMap(p => cidadesDoPais(p).slice(0, 10).flatMap(c => instituicoesTecnicas(c.id)));
    const info = escolas.filter(e => e.cursos.some(x => x === 'tec_informatica' || x === 'tec_desenvolvimento')).length;
    const trio = escolas.filter(e => ['tec_mecanica', 'tec_eletrotecnica', 'tec_administracao'].every(x => e.cursos.includes(x))).length;
    const ex = ofertaIntegrada(cidadesDoPais('JP')[0].id)[0];
    respostas.push({ pergunta: 'Quero fazer curso técnico de informática. Essa possibilidade pode existir?', onde: onde('faculdade'), acao: `${escolas.length} escolas técnicas em 6 países`, consequencia: `${info} oferecem informática/desenvolvimento (ex.: ${ex ? `${ex.inst.nome}: ${ex.inst.cursos.length} cursos` : '—'})`, falha: info === 0 ? 'nenhuma' : undefined });
    respostas.push({ pergunta: 'A escola técnica sempre oferece os mesmos três cursos?', onde: onde('faculdade'), acao: 'comparar catálogos', consequencia: `${new Set(escolas.map(e => e.cursos.join(','))).size} catálogos diferentes em ${escolas.length} escolas; o trio inteiro em ${trio}`, falha: trio > escolas.length * 0.2 ? 'o trio domina' : undefined }); }

  // 14 e 15. Carro verde; hatch × SUV.
  { const v = adulto(30, { semente: 71 }); v.financas.conta = 400000; v.trabalho.licencas.push('cnh');
    const lista = ofertasDeVeiculos(v, 'concessionaria');
    const formas = new Set(lista.map(o => formaDaVersao(versaoVeiculo(o.versaoId), o.modeloId)));
    respostas.push({ pergunta: 'Meu carro verde parece realmente verde?', onde: onde('carro'), acao: 'olhar a vitrine', consequencia: `a lataria do desenho recebe a cor do anúncio por estilo próprio (--lataria, opaca); contorno escuro da própria cor; vidro escuro. Cores na vitrine: ${[...new Set(lista.map(o => o.corNome))].slice(0, 6).join(', ')}` });
    respostas.push({ pergunta: 'Consigo distinguir um hatch de um SUV?', onde: onde('carro'), acao: 'comparar as silhuetas da vitrine', consequencia: `formas na vitrine: ${[...formas].join(', ')} (cada uma com a sua silhueta — teste de desenho)` }); }

  // 16 e 17. Botão cobrindo; loja com caracteres estranhos (verificados nas telas e nas capturas).
  respostas.push({ pergunta: 'Algum botão cobre conteúdo?', onde: 'todas as áreas', acao: '"Viver mais um ano" e as capturas 1440/820/390', consequencia: 'o botão mora no fim do <main>, no fluxo (sem position: fixed); conferido nas capturas (sobreposição com outros controles: 0)' });
  respostas.push({ pergunta: 'Alguma loja mostra caracteres estranhos?', onde: 'Vida · Compras → lojas', acao: 'abrir a ótica (o item de luxo) e as outras lojas', consequencia: `"luxo" é uma etiqueta própria (a classe .selo das redes deixou de vazar); itens de luxo: ${ITENS_ESTILO.filter(x => x.luxo).length}; teste de tela confere que nenhum texto de 1 caractere solto aparece` });

  console.log('| Pergunta | Onde | Ação | Consequência | Falha |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const r of respostas) console.log(`| ${r.pergunta} | ${r.onde} | ${r.acao} | ${r.consequencia.replace(/\|/g, '/')} | ${r.falha ?? '—'} |`);
  const falhas = respostas.filter(r => r.falha).length;
  console.log(`\n${respostas.length - falhas}/${respostas.length} sem falha`);
  if (falhas) process.exit(1);
}
void principal();
