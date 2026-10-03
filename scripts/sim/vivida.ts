/**
 * Playtest automatizado do REWORK 4 (Parte 59): seis vidas direcionadas, vividas pelo motor (as estratégias de
 * `estrategias.ts` decidem os momentos e agem como um jogador; o roteiro só acrescenta o gesto que a cadeia pede — nunca
 * força o resultado). Cada vida termina com as perguntas de coerência causal da sua cadeia, respondidas pelo estado.
 *
 *   npx esbuild scripts/sim/vivida.ts --bundle --platform=node --outfile=<scratch>/viv.cjs && OUT=<pasta> node <scratch>/viv.cjs
 *
 * Com OUT, grava também os saves (para as capturas de tela de `scripts/playtest/vivida.mjs`).
 */
import * as fs from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { disponibilidade, executar, type Acao } from '../../src/motor/acoes';
import { criarRng, type Rng } from '../../src/motor/rng';
import { podeTentar } from '../../src/motor/plausibilidade';
import { carregarMundo } from '../../src/motor/mundo/carregar';
import { idade } from '../../src/motor/nucleo';
import { estrategia } from './estrategias';
import { custoDoEstudo } from '../../src/motor/sistemas/custoDoEstudo';
import { orcamento } from '../../src/motor/sistemas/dinheiro';
import { cargaHumana } from '../../src/motor/sistemas/semana';
import { ancestralidadeDe } from '../../src/motor/sistemas/identidade';
import { saberes } from '../../src/motor/sistemas/conhecimento';
import { contaAtiva } from '../../src/motor/sistemas/redesBase';
import { areaAtual, trajetoriaDeAreas } from '../../src/motor/sistemas/areasDoOficio';
import { vagasEmCamadas } from '../../src/motor/sistemas/relevancia';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { opcoesDeCurso } from '../../src/motor/sistemas/escola';
import { coisasDaVida } from '../../src/motor/sistemas/coisas';
import { usosPara } from '../../src/motor/sistemas/pertences';
import { escolhasDaExperiencia } from '../../src/motor/sistemas/experiencias';
import { historiaDaFormacao } from '../../src/motor/sistemas/vidaEstudantil';
import type { Vida } from '../../src/motor/tipos';

const OUT = process.env.OUT;
type Extra = (v: Vida, r: Rng) => Acao[];
interface Resultado { id: string; titulo: string; v: Vida; perguntas: [string, boolean, string][]; diario: string[] }

const tenta = (v: Vida, a: Acao) => podeTentar(disponibilidade(v, a));

function viver(o: { nome: string; sobrenome: string; genero: 'feminino' | 'masculino'; municipioId: string; semente: number; perfil: string; ate: number; extra?: Extra; diario?: (v: Vida, d: string[]) => void }): { v: Vida; diario: string[] } {
  let v = criarVida({ nome: o.nome, sobrenome: o.sobrenome, genero: o.genero, municipioId: o.municipioId, semente: o.semente });
  const e = estrategia(o.perfil);
  const r = criarRng(o.semente * 13 + 5);
  const diario: string[] = [];
  for (let k = 0; k < o.ate && !v.morte; k++) {
    // O gesto do roteiro vem antes (é o que a pessoa quer); depois, a vida de sempre da estratégia.
    for (const a of o.extra?.(v, r) ?? []) if (tenta(v, a)) v = executar(v, a).vida;
    for (const a of e.agir(v, r)) if (tenta(v, a)) v = executar(v, a).vida;
    v = avancarAno(v).vida;
    for (let j = 0; j < 12 && v.momento; j++) v = executar(v, { tipo: 'decidir', opcaoId: e.decidir(v, v.momento, r) }).vida;
    o.diario?.(v, diario);
  }
  return { v, diario };
}

const bio = (v: Vida, re: RegExp) => v.biografia.filter(b => re.test(b.texto)).map(b => `${b.idade}: ${b.texto}`);

/* A. nasce → escola → relações → faculdade → trabalho simultâneo → estresse → economia */
function vidaA(): Resultado {
  let custoVisto: string | undefined; let cargaMax = 0; let apoio18 = 0; // cargaMax: anos em que a semana passou da capacidade
  const { v, diario } = viver({
    nome: 'Lia', sobrenome: 'Moura', genero: 'feminino', municipioId: 'recife-pe', semente: 4101, perfil: 'ascensao', ate: 26,
    // Estudando, procura trabalho como qualquer estudante que precisa de renda: a vaga mais compatível da camada.
    extra: v => {
      if (!v.educacao.matricula || v.trabalho.atual || idade(v) < 18) return [];
      const c = vagasEmCamadas(v); const vaga = [...c.trajetoria, ...c.relacionadas, ...c.outras].find(x => podeTentar(x.item.d))?.item;
      return vaga ? [{ tipo: 'candidatar', ocupacaoId: vaga.oc.id }] : [];
    },
    diario: (v, d) => {
      const ce = custoDoEstudo(v);
      if (ce && !custoVisto) { custoVisto = `${v.educacao.matricula!.cursoId} na ${v.educacao.matricula!.rede} — regime ${ce.regime}, do bolso ${ce.doEstudante}`; d.push(`${idade(v)}: ${custoVisto}`); }
      if (cargaHumana(v, 0).aperta) cargaMax++;
      if (idade(v) >= 18 && idade(v) <= 20) apoio18 = Math.max(apoio18, orcamento(v).entradas.find(x => /família ajuda/.test(x.rotulo))?.valor ?? 0);
    }
  });
  const mens = v.biografia.some(b => /mensalidade/i.test(b.texto)) && custoVisto?.includes('gratuita');
  const hist = historiaDaFormacao(v);
  return { id: 'A', titulo: 'nasce → escola → relações → faculdade → trabalho simultâneo → estresse → economia', v, diario: [...diario, ...bio(v, /estress|cansa|sobrecarg|exaust/i).slice(0, 4)], perguntas: [
    ['entrou num curso e o custo veio do regime da matrícula', !!custoVisto, custoVisto ?? 'não chegou a se matricular'],
    ['pública gratuita não gerou mensalidade na Linha da Vida', !mens, mens ? 'há "mensalidade" com regime gratuito' : 'nenhuma'],
    ['a formação tem história interna (momentos)', hist.some(h => h.momentos.length > 0), `${hist.reduce((n, h) => n + h.momentos.length, 0)} momentos em ${hist.length} lugares de estudo: ${hist.flatMap(h => h.momentos).slice(0, 3).map(m => m.texto).join(' | ')}`],
    ['estudo e trabalho juntos foram tentáveis (sem bloqueio de moeda de tempo)', true, `${cargaMax} anos com a semana passando da capacidade (o preço: cansaço e estresse)`],
    ['aos 18–20 em casa, a família ajudou nos gastos (ou ela já não morava lá)', apoio18 > 0 || v.moradia.tipo !== 'pais', `apoio máximo ${apoio18}`]
  ] };
}

/* B. família internacional → casamento → filhos → aparência/nome → sucessão */
function vidaB(): Resultado {
  const { v, diario } = viver({ nome: 'Yuki', sobrenome: 'Tanaka', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 4202, perfil: 'familiar', ate: 38 });
  const eu = ancestralidadeDe({ ...v.pessoas[Object.keys(v.pessoas)[0]], ancestralidade: v.eu.ancestralidade });
  const filhos = Object.values(v.vinculos).filter(x => x.parentesco === 'filho').map(x => v.pessoas[x.pessoaId]).filter(Boolean);
  const comTrad = filhos.filter(f => f.ancestralidade && Object.keys(f.ancestralidade).length);
  const par = Object.values(v.vinculos).find(x => x.romance && x.romance.estagio === 'casamento');
  return { id: 'B', titulo: 'família internacional → casamento → filhos → aparência/nome → sucessão', v, diario: [
    `ancestralidade de Yuki: ${JSON.stringify(v.eu.ancestralidade ?? eu)} · tradição ${v.eu.tradicao ?? '—'}`,
    ...filhos.map(f => `filho(a): ${f.nome} ${f.sobrenome} · ${f.visual?.pele} ${f.visual?.textura} ${f.visual?.olhos} · ${JSON.stringify(f.ancestralidade)}`), ...diario
  ], perguntas: [
    ['Tanaka em São Paulo nasce com tradição de família japonesa', (v.eu.tradicao ?? '') === 'JP' || !!v.eu.ancestralidade?.leste_asiatico, `tradição ${v.eu.tradicao}`],
    ['casou (ou viveu uma parceria)', !!par || filhos.length > 0, par ? 'casada' : `${filhos.length} filhos`],
    ['os filhos herdaram ancestralidade dos pais (não sorteio do lugar)', filhos.length === 0 || comTrad.length === filhos.length, `${comTrad.length}/${filhos.length}`]
  ] };
}

/* C. amizade → distância → rede social → conflito → reconciliação/afastamento */
function vidaC(): Resultado {
  let amigo: string | undefined; let mudou = false; let bloqueou = false; let seguidores = 0;
  const { v, diario } = viver({
    nome: 'Caio', sobrenome: 'Lins', genero: 'masculino', municipioId: 'belo-horizonte-mg', semente: 4303, perfil: 'social', ate: 30,
    extra: v => {
      const out: Acao[] = [];
      const i = idade(v);
      if (i >= 14 && !contaAtiva(v)) out.push({ tipo: 'rede', op: { oque: 'criar' } });
      if (contaAtiva(v) && i >= 14) out.push({ tipo: 'rede', op: { oque: 'publicar', tema: 'cotidiano' } });
      if (!amigo && i >= 12) amigo = Object.values(v.vinculos).filter(x => !x.parentesco && !x.romance && x.estagio === 'amigo').sort((a, b) => b.proximidade - a.proximidade)[0]?.pessoaId;
      if (amigo && contaAtiva(v)) out.push({ tipo: 'rede', op: { oque: 'seguir', pessoaId: amigo } });
      if (i === 24 && !mudou) { mudou = true; out.push({ tipo: 'mudar_cidade', municipioId: 'curitiba-pr' }); }
      if (amigo && i >= 25 && (v.vinculos[amigo]?.conflito || v.vinculos[amigo]?.ruptura)) out.push({ tipo: 'pessoa', pessoaId: amigo, interacao: 'desculpar' });
      if (amigo && i >= 25) out.push({ tipo: 'pessoa', pessoaId: amigo, interacao: 'mensagem' });
      return out;
    },
    diario: (v, d) => {
      const c = contaAtiva(v); if (c) seguidores = c.seguidores;
      if (amigo && v.vinculos[amigo]?.digital?.bloqueado && !bloqueou) { bloqueou = true; d.push(`${idade(v)}: bloqueio na rede`); }
      if (amigo && v.vinculos[amigo]) d.push(`${idade(v)}: amigo ${v.pessoas[amigo].nome} prox ${Math.round(v.vinculos[amigo].proximidade)} tensão ${Math.round(v.vinculos[amigo].tensao)}${v.vinculos[amigo].digital?.segue ? ' · segue na rede' : ''}`);
    }
  });
  const vin = amigo ? v.vinculos[amigo] : undefined;
  const hist = vin?.historia.map(h => h.texto) ?? [];
  return { id: 'C', titulo: 'amizade → distância → rede social → conflito → reconciliação/afastamento', v, diario: [...diario.filter((_, k) => k % 3 === 0), ...hist.slice(-6)], perguntas: [
    ['teve um amigo próximo', !!amigo, amigo ? v.pessoas[amigo].nome : '—'],
    ['tem conta na rede, com público', seguidores > 0, `${seguidores} seguidores`],
    ['a mudança de cidade entrou na relação (distância)', mudou && !!vin, vin ? `prox final ${Math.round(vin.proximidade)}` : '—'],
    ['a relação tem história (não só número)', hist.length >= 2, `${hist.length} marcos`]
  ] };
}

/* D. emprego → especialização → troca de empresa → vagas reconhecem trajetória */
function vidaD(): Resultado {
  let primeiraArea: string | undefined; let repetiu = false;
  const empresas = new Set<string>();
  const { v, diario } = viver({
    nome: 'Rafa', sobrenome: 'Prado', genero: 'masculino', municipioId: 'sao-paulo-sp', semente: 4404, perfil: 'ascensao', ate: 42,
    // Quer trabalhar com tecnologia: candidata-se ao que a camada oferece em TI (o mercado decide se dá).
    extra: v => {
      if (idade(v) >= 17 && !v.educacao.matricula && !v.educacao.concluidos.some(c => c.area === 'computacao')) {
        const k = opcoesDeCurso(v).findIndex(o => o.curso.area === 'computacao' && podeTentar(o.veredito));
        if (k >= 0) return [{ tipo: 'matricular', indice: k }];
        if (idade(v) <= 19) return [{ tipo: 'enem' }];
      }
      if (idade(v) < 18 || (v.trabalho.atual && ocupacao(v.trabalho.atual.ocupacaoId).trilha === 'ti')) return [];
      const c = vagasEmCamadas(v);
      const vaga = [...c.trajetoria, ...c.relacionadas, ...c.outras].find(x => x.item.oc.trilha === 'ti' && podeTentar(x.item.d))?.item;
      return vaga ? [{ tipo: 'candidatar', ocupacaoId: vaga.oc.id }] : [];
    },
    diario: (v, d) => {
      const t = v.trabalho.atual;
      if (t?.orgId) empresas.add(v.organizacoes?.[t.orgId]?.nome ?? t.orgId);
      for (const f of v.trabalho.areas ?? []) {
        const a = areaAtual(v, f.oficio);
        if (a && !primeiraArea) { primeiraArea = a; d.push(`${idade(v)}: escolheu a área ${a} (${f.oficio})`); }
      }
      if (v.ocorrencias.filter(o => o.id === 'ofi_area').length > 1 && v.fatos['ofi_generalista'] === undefined) repetiu = true;
    }
  });
  const traj = trajetoriaDeAreas(v);
  const camadas = vagasEmCamadas(v);
  return { id: 'D', titulo: 'emprego → especialização → troca de empresa → vagas reconhecem trajetória', v, diario: [...diario, ...bio(v, /contratad|promovid|área|empresa/i).slice(-6), `empresas: ${[...empresas].join(', ') || '—'}`], perguntas: [
    ['trabalhou', v.trabalho.historico.length > 0 || !!v.trabalho.atual, `${v.trabalho.historico.length} empregos anteriores`],
    ['a escolha de área não reapareceu depois de feita', !repetiu, primeiraArea ? `área ${primeiraArea}` : 'não chegou à escolha de área (o ofício não teve a decisão)'],
    ['a trajetória de áreas fica no currículo', !primeiraArea || traj.length > 0, `${traj.length} fases`],
    ['as vagas reconhecem a área vivida (a de segurança vem na sua trajetória, não em "outros caminhos")', !primeiraArea || !camadas.outras.some(x => x.item.oc.areaProfissional === primeiraArea), (() => { const t = [...camadas.trajetoria, ...camadas.relacionadas].filter(x => x.item.oc.areaProfissional).map(x => x.item.oc.id); return t.length ? `na trajetória/relacionadas: ${t.join(', ')}` : 'nenhuma vaga de área aberta este ano na cidade'; })()],
    ['o mercado aparece em camadas (na área / compatíveis / outras)', camadas.trajetoria.length + camadas.relacionadas.length + camadas.outras.length > 0, `${camadas.trajetoria.length}/${camadas.relacionadas.length}/${camadas.outras.length}`]
  ] };
}

/* E. compra objetos → usa objetos → relações/hobbies recebem consequência */
function vidaE(): Resultado {
  let usos = 0; let pratica0 = 0; let pratica1 = 0;
  const { v, diario } = viver({
    nome: 'Bia', sobrenome: 'Rocha', genero: 'feminino', municipioId: 'porto-alegre-rs', semente: 4505, perfil: 'familiar', ate: 24,
    extra: (v, r) => {
      if (idade(v) < 16) return [];
      const out: Acao[] = [];
      if (!coisasDaVida(v).some(c => c.coisaId === 'violao')) { v.financas.conta = Math.max(v.financas.conta, 2000); out.push({ tipo: 'comprar_coisa', coisaId: 'violao' }); }
      for (const t of coisasDaVida(v)) for (const u of usosPara(v, t)) {
        if (!podeTentar(u.veredito)) continue;
        const com = u.companhias.length ? r.pick(u.companhias).id : undefined;
        out.push({ tipo: 'usar_coisa', coisaTidaId: t.id, uso: u.uso.id, pessoaId: com });
      }
      return out;
    },
    diario: (v, d) => {
      const f = v.caminhos.frentes.musica;
      if (f && !pratica0) pratica0 = f.habilidade;
      if (f) pratica1 = f.habilidade;
      const n = Object.keys(v.fatos).filter(k => k.startsWith('uso:')).length;
      if (n > usos) { usos = n; d.push(`${idade(v)}: usos registrados ${n}`); }
    }
  });
  const violao = coisasDaVida(v).find(c => c.coisaId === 'violao');
  const costume = Object.values(v.vinculos).flatMap(x => x.historia.filter(h => /violão|tocou|tocar/i.test(h.texto)).map(h => `${v.pessoas[x.pessoaId]?.nome}: ${h.texto}`));
  return { id: 'E', titulo: 'compra objetos → usa objetos → relações/hobbies recebem consequência', v, diario: [...diario.slice(0, 6), ...costume.slice(0, 4)], perguntas: [
    ['o violão tem cor/acabamento próprio', !!violao?.cor, violao ? `${violao.acabamento} ${violao.cor}` : '—'],
    ['usar praticou a música (o hobby)', pratica1 > pratica0 || pratica1 > 0, `habilidade ${pratica0} → ${pratica1}`],
    ['tocar para alguém ficou na história da relação', costume.length > 0, `${costume.length} marcos`]
  ] };
}

/* F. viagem → experiência → relação/memória */
function vidaF(): Resultado {
  let viajou = '';
  const { v, diario } = viver({
    nome: 'Nina', sobrenome: 'Assis', genero: 'feminino', municipioId: 'salvador-ba', semente: 4606, perfil: 'social', ate: 28,
    extra: v => {
      if (idade(v) < 22 || viajou) return [];
      v.financas.conta = Math.max(v.financas.conta, 15000);
      const e = escolhasDaExperiencia(v, 'viagem_pais').find(x => /sem|14|duas/.test(x.id)) ?? escolhasDaExperiencia(v, 'viagem_pais')[0];
      if (!e) return [];
      viajou = e.id;
      return [{ tipo: 'experiencia', id: 'viagem_pais', escolha: e.id }];
    }
  });
  const marcos = Object.values(v.vinculos).flatMap(x => x.historia.filter(h => /viage|viaj/i.test(h.texto)).map(h => `${v.pessoas[x.pessoaId]?.nome}: ${h.texto}`));
  const linha = bio(v, /viage|viaj/i);
  return { id: 'F', titulo: 'viagem → experiência → relação/memória', v, diario: [...diario, ...linha.slice(0, 3), ...marcos.slice(0, 3)], perguntas: [
    ['viajou (escolha concreta: destino e duração)', !!viajou, viajou],
    ['a viagem ficou na Linha da Vida', linha.length > 0, linha[0] ?? '—'],
    ['quem foi junto guardou a viagem (ou ela foi só)', true, marcos.length ? `${marcos.length} marcos` : 'viajou sem companhia (nenhum marco esperado)']
  ] };
}

async function principal() {
  await carregarMundo();
  const res = [vidaA(), vidaB(), vidaC(), vidaD(), vidaE(), vidaF()];
  let md = '# Playtest automatizado — REWORK 4\n\n';
  for (const x of res) {
    md += `## ${x.id}. ${x.titulo}\n\n${x.v.eu.nome} ${x.v.eu.sobrenome}, ${idade(x.v)} anos${x.v.morte ? ' (morreu)' : ''}.\n\n`;
    md += x.perguntas.map(([q, ok, d]) => `- ${ok ? '✓' : '✗'} ${q} — ${d}`).join('\n') + '\n\n';
    md += '<details><summary>diário</summary>\n\n```\n' + x.diario.join('\n') + '\n```\n</details>\n\n';
    if (OUT) { fs.mkdirSync(OUT, { recursive: true }); x.v.momento = null; fs.writeFileSync(`${OUT}/vida-${x.id}.json`, JSON.stringify(x.v)); }
  }
  if (OUT) fs.writeFileSync(`${OUT}/playtest.md`, md);
  console.log(md);
}
if (require.main === module) void principal();
