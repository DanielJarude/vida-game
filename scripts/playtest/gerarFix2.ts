/**
 * Saves de cenários para o playtest visual do FIX pós-playtest 2 (`fix2.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarFix2.ts --bundle --platform=node --outfile=/tmp/g2.cjs && SP=/tmp/vida-fix2 node /tmp/g2.cjs
 *
 * Cada save é uma vida vivida pelo motor até a idade do cenário e, quando
 * preciso, um empurrão de estado (um emprego, um amigo próximo, uma
 * condição) — para fotografar Você, Pessoas, Estudo, Trabalho, Tempo livre,
 * a entrevista e a peneira em momentos reais.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { novaOportunidade } from '../../src/motor/sistemas/oportunidades';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { abalar } from '../../src/motor/sistemas/abalo';

const SP = process.env.SP ?? '/tmp/vida-fix2';
mkdirSync(SP, { recursive: true });

function viver(v: Vida, ate: number, rotinas: [string, number, 1 | 2 | 3][] = []): Vida {
  while (!v.morte && idade(v) < ate) {
    for (const [id, min, nivel] of rotinas) {
      if (idade(v) < min) continue;
      const atual = v.rotinas.find(r => r.id === id);
      const alvo = atual ? Math.min(nivel, (atual.nivel ?? 1) + 1) as 1 | 2 | 3 : 1;
      if (!atual || (atual.nivel ?? 1) < alvo) v = executar(v, { tipo: 'rotina', id, ativa: true, nivel: alvo }).vida;
    }
    v = avancarAno(v).vida;
    while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida;
  }
  return v;
}

const nasce = (semente: number, genero: 'masculino' | 'feminino' = 'feminino', municipioId = 'recife-pe') =>
  criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Davi', sobrenome: 'Araújo', genero, municipioId, semente });
const gravar = (nome: string, v: Vida) => writeFileSync(`${SP}/save-${nome}.json`, JSON.stringify(v));

// 1. Criança de 8.
gravar('crianca', viver(nasce(31), 8, [['futebol', 5, 2], ['desenho', 6, 1]]));

// 2. Adolescente de 15 na peneira (a primeira etapa aberta).
{
  let v = viver(nasce(32, 'masculino'), 15, [['futebol', 6, 2], ['corrida', 12, 1]]);
  v = transacao(v, x => { novaOportunidade(x, { tipo: 'peneira', dominio: 'futebol', municipioId: 'recife-pe', meses: 12, chave: 'peneira_futebol', titulo: 'Peneira no Sport Recife', texto: 'O treinador viu você jogar e indicou para a peneira do Sport Recife. Centenas de garotos, poucas vagas.' }); }).vida;
  gravar('adolescente', v);
  const op = v.caminhos.oportunidades.find(o => o.tipo === 'peneira')!;
  gravar('peneira', executar(v, { tipo: 'oportunidade', id: op.id, aceitar: true }).vida);
}

// 3. Jovem de 22, recém-formada, na entrevista (primeira pergunta aberta).
{
  let v = viver(nasce(33), 22, [['leitura', 10, 1]]);
  v = transacao(v, x => {
    x.trabalho.atual = undefined;
    x.educacao.matricula = undefined;
    x.educacao.escolaridade = 'superior';
    x.educacao.concluidos.push({ cursoId: 'administracao', nome: 'Administração', nivel: 'superior', area: 'administracao', tFim: x.t - 3, instituicao: 'a universidade federal' });
  }).vida;
  gravar('jovem', v);
  gravar('entrevista', executar(v, { tipo: 'candidatar', ocupacaoId: 'analista_adm' }).vida);
}

// 4. Solteiro de 25 com uma amiga de longa data (romance possível).
{
  let v = viver(nasce(34, 'masculino'), 25, [['futebol', 8, 1]]);
  v = transacao(v, (x, r) => {
    for (const vin of Object.values(x.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
    x.eu.atracao = 'mulheres';
    const p = criarPessoa(x, r, { idade: 24, genero: 'feminino', municipioId: x.moradia.municipioId, nome: 'Marina' });
    p.atracao = 'homens';
    p.ocupacao = 'fisioterapeuta';
    const vin = vincular(x, p, { origem: 'escola', proximidade: 74, convivio: ['rotina'] });
    vin.estagio = 'amigo_proximo';
    vin.tInicio = x.t - 96;
    vin.confianca = 72;
    vin.historia.push({ t: x.t - 96, texto: 'Viraram amigos no ensino médio.', tipo: 'amizade', peso: 2 }, { t: x.t - 30, texto: 'Você esteve lá quando perdeu o emprego.', tipo: 'apoio', peso: 2 });
    if (!x.trabalho.atual) contratar(x, r, ocupacao('vendedor'));
  }).vida;
  gravar('romance', v);
}

// 5. Casada de 34 com um filho pequeno.
{
  let v = viver(nasce(35), 34, [['musica', 9, 1]]);
  v = transacao(v, (x, r) => {
    for (const vin of Object.values(x.vinculos)) { vin.convivio = vin.convivio.filter(c => c !== 'casa'); if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined; }
    x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'apto_2q', aluguel: 1600, padrao: 3, tInicio: x.t - 60 };
    const par = criarPessoa(x, r, { idade: 35, genero: 'masculino', municipioId: x.moradia.municipioId, nome: 'Rafael' });
    par.ocupacao = 'técnico de enfermagem'; par.renda = 2900;
    const vp = vincular(x, par, { origem: 'trabalho', proximidade: 82, convivio: ['casa'] });
    vp.tInicio = x.t - 120;
    vp.romance = { estagio: 'casamento', tEstagio: x.t - 72, tInicio: x.t - 120, envolvimento: 78, planoFilhos: 'evitando' };
    vp.historia.push({ t: x.t - 120, texto: 'O primeiro encontro: um bar pequeno onde a música deixava conversar.', tipo: 'romance', peso: 2 }, { t: x.t - 96, texto: 'Começaram a namorar.', tipo: 'romance', peso: 2 }, { t: x.t - 72, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 }, { t: x.t - 50, texto: 'Mantiveram as saídas só de vocês dois, mesmo com a vida corrida.', tipo: 'ritual', peso: 2 });
    vp.habitos = { sair: 6, carinho: 3 };
    const bebe = criarPessoa(x, r, { idade: 3, genero: 'feminino', municipioId: x.moradia.municipioId, nome: 'Alice' });
    bebe.genitores = ['eu', par.id];
    vincular(x, bebe, { parentesco: 'filho', origem: 'familia', proximidade: 85, convivio: ['casa'] });
    if (!x.trabalho.atual) contratar(x, r, ocupacao('assistente_adm'));
  }).vida;
  gravar('familia', v);
}

// 6. Adulto sobrecarregado de 36: trabalho integral, faculdade à noite, filho pequeno, horas extras — há seis anos.
{
  let v = viver(nasce(36, 'masculino'), 30, []);
  let ano = 0;
  const carga = (x: Vida, r: Parameters<Parameters<typeof transacao>[1]>[1]) => {
    x.educacao.escolaridade = 'medio';
    if (x.trabalho.atual?.ocupacaoId !== 'supervisor_loja') { x.trabalho.atual = undefined; contratar(x, r, ocupacao('supervisor_loja')); }
    x.trabalho.experiencia['comercio'] = Math.max(70, x.trabalho.experiencia['comercio'] ?? 0);
    if (!x.educacao.matricula) x.educacao.matricula = { cursoId: 'administracao', instituicao: 'uma faculdade particular', rede: 'privada', modalidade: 'presencial', tInicio: x.t - 12, mesesRestantes: 30, mensalidade: 890, desempenho: 52, trancado: false, municipioId: x.moradia.municipioId };
    if (ano >= 4 && !Object.values(x.pessoas).some(p => p.nome === 'Theo')) {
      const bebe = criarPessoa(x, r, { idade: 0, genero: 'masculino', municipioId: x.moradia.municipioId, nome: 'Theo' });
      bebe.genitores = ['eu'];
      vincular(x, bebe, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
    }
    x.rotinas = [{ id: 'futebol', tInicio: x.t - 60, nivel: 1 }];
  };
  for (let k = 0; k < 6; k++) {
    ano = k;
    v = transacao(v, carga).vida;
    v = executar(v, { tipo: 'horas_extras' }).vida;
    v = avancarAno(v).vida;
    while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida;
  }
  v = transacao(v, carga).vida;
  v = executar(v, { tipo: 'horas_extras' }).vida;
  gravar('sobrecarga', v);
}

// 7. Desempregada de 41.
{
  let v = viver(nasce(37), 40, []);
  v = transacao(v, x => { x.trabalho.atual = undefined; x.trabalho.desempregadoDesde = x.t - 14; x.educacao.matricula = undefined; }).vida;
  v = viver(v, 41);
  v = transacao(v, x => { x.trabalho.atual = undefined; if (x.trabalho.desempregadoDesde === undefined) x.trabalho.desempregadoDesde = x.t - 26; }).vida;
  gravar('desemprego', v);
}

// 8. Homem de 58 com a saúde cobrando: fuma, parado, pressão alta sem tratamento.
{
  let v = viver(nasce(38, 'masculino'), 58, []);
  v = transacao(v, x => {
    x.corpo.habitos.fuma = true;
    x.corpo.habitos.sedentario = true;
    x.corpo.forma = 18;
    x.corpo.saude = 41;
    x.rotinas = x.rotinas.filter(r => !['futebol', 'academia', 'corrida', 'danca', 'volei', 'natacao', 'atletismo', 'lutas'].includes(r.id));
    if (!x.corpo.condicoes.some(c => c.id === 'hipertensao')) x.corpo.condicoes.push({ id: 'hipertensao', nome: 'pressão alta', tInicio: x.t - 24, cronica: true, gravidade: 1, tratando: false });
    x.processos = x.processos.filter(p => p.tipo !== 'tratamento');
  }).vida;
  gravar('saude', v);
}

// 9. Mulher de 45 num bom momento.
{
  let v = viver(nasce(39), 45, [['danca', 10, 1], ['leitura', 12, 1], ['voluntariado', 25, 1]]);
  v = transacao(v, x => { x.mente.felicidade = 82; x.mente.estresse = 18; x.corpo.saude = Math.max(x.corpo.saude, 80); }).vida;
  gravar('bem', v);
}

// 10. Luto: a parceria morreu há pouco.
{
  let v = viver(nasce(40, 'masculino'), 52, []);
  v = transacao(v, (x, r) => {
    const par = criarPessoa(x, r, { idade: 50, genero: 'feminino', municipioId: x.moradia.municipioId, nome: 'Célia' });
    const vp = vincular(x, par, { origem: 'trabalho', proximidade: 88, convivio: [] });
    vp.tInicio = x.t - 300;
    vp.romance = { estagio: 'ex', fim: 'morte', tEstagio: x.t, tInicio: x.t - 300, envolvimento: 80 };
    vp.historia.push({ t: x.t - 300, texto: 'Vocês se conheceram no trabalho.', tipo: 'inicio', peso: 2 }, { t: x.t - 270, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 });
    par.vivo = false; par.tMorte = x.t; par.causaMorte = 'AVC';
    x.luto.push({ pessoaId: par.id, t: x.t, peso: 100 });
    abalar(x, `a morte de ${par.nome}`, -15, 10);
  }).vida;
  gravar('luto', v);
}

// 11. Idosa de 74 (a primeira semente em que ela chega lá).
{
  let s = 41;
  let v = viver(nasce(s), 74, [['igreja', 30, 1], ['corrida', 40, 1]]);
  while (v.morte) v = viver(nasce(++s), 74, [['igreja', 30, 1], ['corrida', 40, 1]]);
  gravar('idosa', v);
}

console.log('saves em', SP);
