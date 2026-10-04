/**
 * PLAYTEST ADVERSARIAL do FIX pós-REWORK 4: "eu sei o que quero fazer — onde começo, e o que acontece?".
 *
 * Para cada pergunta de jogador, o roteiro faz o que uma pessoa faria: procura ONDE (o mapa de intenções da navegação,
 * a mesma fonte do menu "Onde fica cada coisa"), olha o que dá para fazer ALI (os verbos que a tela mostra, lidos da
 * mesma fonte que ela), faz uma coisa e confere a CONSEQUÊNCIA no estado. Se a pergunta não tem lugar no mapa, ou o
 * lugar não tem verbo, ou o verbo não muda nada, é falha de agência.
 *
 *   npx esbuild scripts/sim/agir.ts --bundle --platform=node --outfile=<scratch>/agir.cjs && OUT=<pasta> node <scratch>/agir.cjs
 *
 * As vidas nascem e vivem pelo motor (as estratégias dos sims); o roteiro só acrescenta o que a pergunta pressupõe
 * (o violão comprado, a família, o carro) — por AÇÕES quando a ação existe (comprar, contratar), e pelos cenários dos
 * testes quando é gente (a parceria, o filho). Com OUT, grava os saves para as capturas (`scripts/playtest/agir.mjs`).
 */
import * as fs from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { idade, transacao } from '../../src/motor/nucleo';
import { estrategia } from './estrategias';
import type { PlataformaId, Vida } from '../../src/motor/tipos';
import { MAPA_DE_INTENCOES, rotuloDoLugar } from '../../src/ui/navegacao';
import { comFilho, comParceiro } from '../../src/motor/__tests__/cenarios';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { ofertasDeVeiculos } from '../../src/motor/sistemas/mercado';
import { coisasDaVida } from '../../src/motor/sistemas/coisas';
import { usosPara } from '../../src/motor/sistemas/pertences';
import { habilidade } from '../../src/motor/sistemas/frentes';
import { interacoesPara, rotuloInteracao } from '../../src/motor/sistemas/interacoes';
import { grupoDaInteracao } from '../../src/motor/sistemas/juntos';
import { conteudosPossiveis, leituraDaConta } from '../../src/motor/sistemas/redes';
import { contaAtiva } from '../../src/motor/sistemas/redesBase';
import { leituraDoEstresse } from '../../src/motor/sistemas/leituraDoEstresse';
import { alvoCabeca } from '../../src/motor/sistemas/estado';
import { disponibilidadeUsoVeiculo, rotuloUsoVeiculo, USOS_VEICULO } from '../../src/motor/sistemas/usos';
import { nomeComCor } from '../../src/motor/sistemas/veiculos';
import { verbosDaFormacao } from '../../src/motor/sistemas/naFormacao';
import { verbosDoOficio } from '../../src/motor/sistemas/noOficio';
import { companhiasDeViagem, escolhasDaExperiencia } from '../../src/motor/sistemas/experiencias';

const OUT = process.env.OUT;
const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));
const fazer = (v: Vida, a: Acao): { v: Vida; disse: string } => { const r = executar(v, a); return { v: r.vida, disse: r.aviso?.texto ?? r.resultado ?? '' }; };
const onde = (id: string) => { const x = MAPA_DE_INTENCOES.find(i => i.id === id); return x ? `${rotuloDoLugar(x.lugar)} → ${x.la}` : undefined; };

function viver(semente: number, municipioId: string, ate: number, perfil: string, genero: 'feminino' | 'masculino' = 'feminino'): Vida {
  let v = criarVida({ nome: genero === 'feminino' ? 'Bia' : 'Davi', sobrenome: 'Prado', genero, municipioId, semente });
  const e = estrategia(perfil);
  const r = criarRng(semente * 13 + 5);
  for (let k = 0; k < ate && !v.morte; k++) {
    for (const a of e.agir(v, r)) if (tenta(v, a)) v = executar(v, a).vida;
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento, r) }).vida;
  }
  return v;
}

interface Pergunta { pergunta: string; onde?: string; verbos: string[]; fez: string; consequencia: string; ok: boolean }
const relatorio: Pergunta[] = [];
const registrar = (p: Pergunta) => { relatorio.push(p); console.log(`${p.ok ? 'OK   ' : 'FALHA'} ${p.pergunta}\n      onde: ${p.onde ?? '(sem lugar no mapa)'}\n      dá para: ${p.verbos.slice(0, 6).join(' · ')}\n      fez: ${p.fez}\n      → ${p.consequencia}\n`); };

async function principal() {
  await carregarMundo();

  /* ---------------------------------------------------- A vida de Bia: casada, um filho, violão, carro, emprego */
  let v = viver(4242, 'recife-pe', 30, 'familiar');
  v.momento = null; v.caminhos.pendente = undefined;
  v = transacao(v, (x, r) => {
    x.financas.conta = 250000; x.financas.negativado = false;
    if (!x.trabalho.atual) { x.trabalho.experiencia.ti = 48; contratar(x, r, ocupacao('dev_pleno')); }
    if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh');
    if (!Object.values(x.vinculos).some(w => w.romance && w.romance.estagio === 'casamento')) comParceiro(x, { estagio: 'casamento' });
    comFilho(x, 6, { casa: true });
  }).vida;
  if (v.moradia.tipo === 'pais' || v.moradia.tipo === 'parente') v = transacao(v, x => { x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'casa_2q', aluguel: 1800, padrao: 3, tInicio: x.t }; }).vida;
  v = fazer(v, { tipo: 'comprar_coisa', coisaId: 'violao' }).v;
  const carro = ofertasDeVeiculos(v, 'concessionaria').filter(o => o.preco < 120000).sort((a, b) => a.preco - b.preco)[0];
  v = fazer(v, { tipo: 'comprar_veiculo', ofertaId: carro.id, financiar: false }).v;
  const par = Object.values(v.vinculos).find(w => w.romance && w.romance.estagio === 'casamento')!;
  const filho = Object.values(v.vinculos).find(w => w.parentesco === 'filho' && w.convivio.includes('casa'))!;
  if (OUT) { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(`${OUT}/vida-agir-familia.json`, JSON.stringify({ versao: 20, ...v })); }

  // 1. O violão.
  {
    const t = coisasDaVida(v).find(x => x.coisaId === 'violao')!;
    const usos = usosPara(v, t);
    const antes = habilidade(v, 'musica');
    const r = fazer(v, { tipo: 'usar_coisa', coisaTidaId: t.id, uso: 'tocar' });
    registrar({ pergunta: 'Quero usar meu violão. Onde clico?', onde: onde('pertences'), verbos: usos.map(u => u.uso.rotulo), fez: 'Tocar', consequencia: `música ${antes.toFixed(1)} → ${habilidade(r.v, 'musica').toFixed(1)}. "${r.disse}"`, ok: habilidade(r.v, 'musica') > antes });
  }
  // 2. A esposa.
  {
    const lista = interacoesPara(v, par.pessoaId);
    const juntos = lista.filter(x => grupoDaInteracao(x.id) === 'juntos');
    const id = juntos.find(x => x.id === 'jantar_romantico')?.id ?? juntos[0].id;
    const antes = v.vinculos[par.pessoaId].proximidade;
    const r = fazer(v, { tipo: 'pessoa', pessoaId: par.pessoaId, interacao: id });
    registrar({ pergunta: 'Quero fazer algo com quem sou casada (o marido, a esposa).', onde: onde('fazer_junto'), verbos: juntos.map(x => rotuloInteracao(v, par.pessoaId, x.id)), fez: rotuloInteracao(v, par.pessoaId, id), consequencia: `proximidade ${antes} → ${r.v.vinculos[par.pessoaId].proximidade}. "${r.disse}"`, ok: juntos.length >= 4 && r.v.anoAtual.acoes.some(a => a.includes(id)) });
  }
  // 3. O filho.
  {
    const juntos = interacoesPara(v, filho.pessoaId).filter(x => grupoDaInteracao(x.id) === 'juntos');
    const id = juntos.find(x => x.id === 'ensinar')?.id ?? juntos.find(x => x.id === 'parque')?.id ?? juntos[0].id;
    const r = fazer(v, { tipo: 'pessoa', pessoaId: filho.pessoaId, interacao: id });
    registrar({ pergunta: 'Quero passar tempo com meu filho.', onde: onde('fazer_junto'), verbos: juntos.map(x => rotuloInteracao(v, filho.pessoaId, x.id)), fez: rotuloInteracao(v, filho.pessoaId, id), consequencia: `presença ${v.vinculos[filho.pessoaId].presenca ?? 30} → ${r.v.vinculos[filho.pessoaId].presenca}. "${r.disse}"`, ok: juntos.length >= 3 });
  }
  // 4–7. As redes.
  let w = v;
  {
    w = fazer(w, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } }).v;
    const temas = conteudosPossiveis(w, 'instagram');
    const r = fazer(w, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'instagram', tema: temas[0].tema } });
    w = r.v;
    registrar({ pergunta: 'Quero postar no Instagram.', onde: onde('rede'), verbos: temas.map(t => t.rotulo), fez: temas[0].rotulo, consequencia: `${contaAtiva(w, 'instagram')!.seguidores} seguidores. "${r.disse}"`, ok: !!contaAtiva(w, 'instagram')?.publicacoes.length });
  }
  {
    w = fazer(w, { tipo: 'rede', op: { oque: 'criar', plataforma: 'youtube' } }).v;
    const temas = conteudosPossiveis(w, 'youtube');
    const antes = contaAtiva(w, 'youtube')!.seguidores;
    for (const t of temas.slice(0, 3)) if (tenta(w, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'youtube', tema: t.tema } })) w = fazer(w, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'youtube', tema: t.tema } }).v;
    const camp = fazer(w, { tipo: 'rede', op: { oque: 'promover_conta', plataforma: 'youtube' } });
    w = camp.v;
    const l = leituraDaConta(w, 'youtube')!;
    registrar({ pergunta: 'Quero tentar crescer no YouTube.', onde: onde('rede'), verbos: [...temas.map(t => t.rotulo), 'Fazer uma campanha paga', 'Monetizar (pede 1.000 inscritos e 10 vídeos)'], fez: '3 vídeos e uma campanha', consequencia: `${antes} → ${l.conta.seguidores} inscritos (engajamento ${l.engajamento}). "${camp.disse}"`, ok: l.conta.seguidores > antes });
  }
  {
    w = fazer(w, { tipo: 'rede', op: { oque: 'criar', plataforma: 'x' } }).v;
    const ditos: string[] = [];
    for (let k = 0; k < 3; k++) { const r = fazer(w, { tipo: 'rede', op: { oque: 'trollar', plataforma: 'x', alvo: 'estranho' } }); w = r.v; ditos.push(r.disse); }
    const c = contaAtiva(w, 'x')!;
    registrar({ pergunta: 'Quero ser tóxico no Twitter/X.', onde: onde('rede'), verbos: ['Provocar um estranho', 'Atacar uma celebridade', 'Provocar alguém da sua vida em público', 'Dar uma opinião forte'], fez: 'Provocar estranhos, três vezes', consequencia: `toxicidade ${c.toxicidade}, credibilidade ${c.credibilidade}, advertências ${c.advertencias ?? 0}. "${ditos[2]}"`, ok: (c.toxicidade ?? 0) >= 30 });
  }
  {
    const r = fazer(w, { tipo: 'rede', op: { oque: 'apagar_conta', plataforma: 'x' } });
    registrar({ pergunta: 'Quero apagar minha conta.', onde: onde('rede'), verbos: ['A conta: crescer, verificar, monetizar, apagar → Apagar a conta… → Sim, apagar'], fez: 'Apagar a conta no X', consequencia: `conta ativa: ${contaAtiva(r.v, 'x') ? 'sim' : 'não'}; a biografia guarda: ${r.v.biografia.some(e => /Apagou a conta no X/.test(e.texto)) ? 'sim (cotidiano)' : 'não'}. "${r.disse}"`, ok: !contaAtiva(r.v, 'x') });
    w = r.v;
    // O peso das redes no save, depois de um uso intenso (o teto: 8 publicações por conta, o resto vira número).
    let pesada = w;
    for (let ano = 0; ano < 10; ano++) { for (const pl of ['instagram', 'youtube'] as PlataformaId[]) for (const t of conteudosPossiveis(pesada, pl).slice(0, 6)) { const a: Acao = { tipo: 'rede', op: { oque: 'publicar', plataforma: pl, tema: t.tema } }; if (tenta(pesada, a)) pesada = fazer(pesada, a).v; } pesada = transacao(pesada, x => { x.t += 12; x.anoAtual.acoes = []; }).vida; }
    console.log(`(redes no save depois de 10 anos publicando em 2 plataformas: ${(JSON.stringify(pesada.redes).length / 1024).toFixed(1)} kB)\n`);
    if (OUT) fs.writeFileSync(`${OUT}/vida-agir-redes.json`, JSON.stringify({ versao: 20, ...w }));
  }
  // 8. O carro.
  {
    const b = v.financas.bens.find(x => x.tipo === 'veiculo')!;
    const usos = USOS_VEICULO.filter(u => b.tipo === 'veiculo' && disponibilidadeUsoVeiculo(v, b, u).ok);
    const r = fazer(v, { tipo: 'usar_veiculo', bemId: b.id, oque: usos[0] });
    registrar({ pergunta: 'Quero usar meu carro.', onde: onde('usar_carro'), verbos: usos.map(u => rotuloUsoVeiculo(v, b as never, u)), fez: `${rotuloUsoVeiculo(v, b as never, usos[0])} (${nomeComCor(b as never)})`, consequencia: `"${r.disse}"`, ok: usos.length >= 2 });
  }
  // 9–10. O estresse.
  {
    let s = transacao(v, x => { x.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: x.t, mesesRestantes: 48, mensalidade: 0, desempenho: 60, trancado: false, municipioId: x.moradia.municipioId }; x.mente.estresse = 72; }).vida;
    const l = leituraDoEstresse(s);
    registrar({ pergunta: 'Quero entender por que estou estressado.', onde: onde('estresse'), verbos: l.pesando.map(c => `${c.texto} (${c.peso})`), fez: 'Ler "A semana"', consequencia: `${l.valor}% ${l.nivel}, ${l.tendencia}. Ajuda: ${l.ajudando.map(c => c.texto).join(', ') || 'nada'}. Se continuar: ${l.riscos.join('; ')}`, ok: l.pesando.length >= 2 });
    const alvo = alvoCabeca(s);
    const r = fazer(s, { tipo: 'rotina', id: 'terapia', ativa: true, nivel: 1 });
    s = r.v;
    registrar({ pergunta: 'Quero diminuir meu estresse.', onde: onde('estresse'), verbos: ['Tirar uns dias de descanso', 'Começar terapia', 'Uma atividade que alivia', 'Um ritmo mais leve no trabalho', 'Uma viagem'], fez: 'Começar terapia', consequencia: `para onde o estresse vai: ${Math.round(alvo)} → ${Math.round(alvoCabeca(s))}. "${r.disse}"`, ok: alvoCabeca(s) < alvo });
  }
  // 13. A viagem com a família.
  {
    const comp = companhiasDeViagem(v);
    const destino = escolhasDaExperiencia(v, 'viagem_pais')[0];
    const r = fazer(v, { tipo: 'experiencia', id: 'viagem_pais', escolha: `${destino.id}:casa` });
    registrar({ pergunta: 'Quero viajar com minha família.', onde: onde('viajar'), verbos: comp.map(c => c.rotulo), fez: `${destino.rotulo}, ${comp.find(c => c.id === 'casa')?.rotulo}`, consequencia: `"${r.disse}" Biografia: ${r.v.biografia.filter(e => /Viajou para/.test(e.texto)).pop()?.texto}`, ok: r.v.biografia.some(e => /Viajou para .* com /.test(e.texto)) });
  }

  /* ---------------------------------------------------- Estudante (faculdade) e atleta */
  {
    let e = viver(5151, 'sao-paulo-sp', 19, 'estudioso', 'masculino');
    e.momento = null;
    if (!e.educacao.matricula) e = transacao(e, x => { x.educacao.basica = undefined; x.educacao.matricula = { cursoId: 'computacao', instituicao: 'a universidade federal', rede: 'publica', modalidade: 'presencial', tInicio: x.t - 12, mesesRestantes: 36, mensalidade: 0, desempenho: 72, trancado: false, municipioId: x.moradia.municipioId }; }).vida;
    const verbos = verbosDaFormacao(e);
    const r = fazer(e, { tipo: 'formacao', oque: verbos.find(x => x.oque === 'projeto')?.oque ?? verbos[0].oque });
    registrar({ pergunta: 'Quero fazer alguma coisa na faculdade.', onde: onde('atividade_escolar'), verbos: verbos.map(x => x.rotulo), fez: verbos.find(x => x.oque === 'projeto')?.rotulo ?? verbos[0].rotulo, consequencia: `"${r.disse}" (história da formação: ${(r.v.educacao.trajetoria ?? []).length} momentos)`, ok: verbos.length >= 4 });
    if (OUT) fs.writeFileSync(`${OUT}/vida-agir-estudante.json`, JSON.stringify({ versao: 20, ...e }));
  }
  {
    let a = viver(6262, 'belo-horizonte-mg', 23, 'ambicioso', 'masculino');
    a.momento = null;
    a = transacao(a, x => {
      x.trabalho.atual = { ocupacaoId: 'jogador_futebol', empregador: 'Atlético da Serra', contrato: 'clt', salario: 6000, tInicio: x.t - 24, desempenho: 60, municipioId: x.moradia.municipioId, carga: 'integral' };
      x.caminhos.esporte = { modalidade: 'futebol', fase: 'profissional', clube: 'Atlético da Serra', nivel: 3, tInicio: x.t - 60, tFase: x.t - 24, lesoes: 0, municipioId: x.moradia.municipioId, reputacao: 42, temporadas: [{ ano: Math.floor(x.t / 12) - 1, clube: 'Atlético da Serra', nivel: 3, partidas: 28, titular: 20, gols: 3, assistencias: 2, nota: 5.9, colocacao: 14, mesesFora: 0 }] };
      x.notoriedade = { valor: 22, pico: 22, t: x.t, fonte: 'esporte' };
    }).vida;
    const verbos = verbosDoOficio(a);
    const h = habilidade(a, 'futebol');
    const r = fazer(a, { tipo: 'oficio', oque: 'treino_finalizacao' });
    registrar({ pergunta: 'Quero treinar como atleta.', onde: onde('agir_trabalho'), verbos: verbos.map(x => x.rotulo), fez: 'Treino extra: finalização', consequencia: `futebol ${h.toFixed(1)} → ${habilidade(r.v, 'futebol').toFixed(1)}. "${r.disse}"`, ok: habilidade(r.v, 'futebol') >= h && verbos.length >= 4 });
    // E o atleta numa fase ruim tem o que dizer à torcida (o que uma pessoa comum não tem).
    let x = fazer(r.v, { tipo: 'rede', op: { oque: 'criar', plataforma: 'instagram' } }).v;
    const temas = conteudosPossiveis(x, 'instagram' as PlataformaId).map(t => t.rotulo);
    const p = fazer(x, { tipo: 'rede', op: { oque: 'publicar', plataforma: 'instagram', tema: 'desculpas' } });
    x = p.v;
    registrar({ pergunta: 'Sou atleta numa fase ruim: o que posto?', onde: onde('rede'), verbos: temas, fez: 'Pedir desculpas à torcida pela fase', consequencia: `"${p.disse}"`, ok: temas.some(t => /torcida/.test(t)) });
    if (OUT) fs.writeFileSync(`${OUT}/vida-agir-atleta.json`, JSON.stringify({ versao: 20, ...x }));
  }

  const falhas = relatorio.filter(p => !p.ok);
  console.log(`${relatorio.length - falhas.length}/${relatorio.length} perguntas respondidas com lugar, verbo e consequência.`);
  if (OUT) fs.writeFileSync(`${OUT}/agir.json`, JSON.stringify(relatorio, null, 2));
  void idade;
  process.exit(falhas.length ? 1 : 0);
}
void principal();
