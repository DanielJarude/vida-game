/**
 * Saves dos cenários do FIX #4 para o playtest visual (`fix4.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarFix4.ts --bundle --platform=node --outfile=/tmp/g4.cjs && SP=/tmp/vida-fix4 node /tmp/g4.cjs
 *
 * Cada save é uma vida vivida pelo motor e levada ao estado do cenário pelos
 * próprios sistemas (mortes pela rede, negócio pela conta do ano, eleição
 * pela apuração, conflito pela `propor`, veículos do catálogo).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar } from '../../src/motor/acoes';
import type { Moradia, Vida } from '../../src/motor/tipos';
import { idade, transacao } from '../../src/motor/nucleo';
import { criarRng } from '../../src/motor/rng';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { garantirVida } from '../../src/motor/sistemas/filhos';
import { registrarMortes } from '../../src/motor/sistemas/luto';
import { abrirNegocio, passarParaHorasVagas, processarNegocio } from '../../src/motor/sistemas/negocio';
import { aplicar } from '../../src/motor/sistemas/investimentos';
import { entrarNaPolitica, proximaEleicao, registrarCandidatura, processarPolitica } from '../../src/motor/sistemas/politica';
import { propor } from '../../src/motor/sistemas/compromissos';
import { abrirConflitoPendente } from '../../src/motor/conteudo/compromissos';
import { abrirDecisao, conteudoPorId } from '../../src/motor/conteudo/motor';
import { contexto } from '../../src/motor/conteudo/base';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { VERSOES_VEICULO } from '../../src/motor/dados/bens';

const SP = process.env.SP ?? '/tmp/vida-fix4';
mkdirSync(SP, { recursive: true });
const QUIETAS = ['ficar', 'recusar', 'nao', 'seguir', 'aguentar', 'depois', 'manter', 'renovar', 'assinar', 'voltar'];
function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) { const l = v.momento.opcoes.filter(o => !o.bloqueio); v = executar(v, { tipo: 'decidir', opcaoId: (l.find(o => QUIETAS.includes(o.id)) ?? l[0]).id }).vida; }
  }
  return v;
}
const nasce = (s: number, genero: 'masculino' | 'feminino', municipioId: string) => criarVida({ nome: genero === 'feminino' ? 'Lara' : 'Lucca', sobrenome: 'Moreira', genero, municipioId, semente: s });
const ate = (s: number, i: number, genero: 'masculino' | 'feminino', municipioId: string) => { let k = s; let v = viver(nasce(k, genero, municipioId), i); while (v.morte) v = viver(nasce(++k, genero, municipioId), i); return v; };
const gravar = (nome: string, v: Vida, manterMomento = false) => { if (!manterMomento) v.momento = null; writeFileSync(`${SP}/save-${nome}.json`, JSON.stringify(v)); console.log(nome.padEnd(16), idade(v), v.momento?.situacaoId ?? '', v.trabalho.atual?.ocupacaoId ?? '—'); };
const limpar = (x: Vida) => { x.caminhos.processo = undefined; x.trabalho.atual = undefined; x.educacao.matricula = undefined; x.educacao.basica = undefined; x.caminhos.oportunidades = []; x.justica = undefined; x.caminhos.envolvimento = undefined; x.trabalho.pausa = undefined; x.caminhos.militar = undefined; x.caminhos.negocio = undefined; x.caminhos.politica = undefined; x.caminhos.pendente = undefined; x.corpo.saude = Math.max(72, x.corpo.saude); for (const w of Object.values(x.vinculos)) if (w.romance) w.romance = undefined; };
const r = criarRng(44);
const casa = (x: Vida, modeloId: string, tipo: Moradia['tipo'] = 'aluguel') => { x.moradia = { tipo, municipioId: x.moradia.municipioId, modeloId, aluguel: tipo === 'aluguel' ? 1400 : 0, padrao: 3, tInicio: x.t - 60 }; for (const w of Object.values(x.vinculos)) if (!w.romance) w.convivio = w.convivio.filter(c => c !== 'casa'); };
const versao = (classe: string) => VERSOES_VEICULO.find(x => x.classe === classe)!;
const veiculo = (x: Vida, classe: string) => { const ve = versao(classe); x.financas.bens.push({ id: `b${x.seq++}`, tipo: 'veiculo', modeloId: classe, versaoId: ve.id, nome: `${ve.marca} ${ve.modelo}`, valor: Math.round(ve.preco * 0.8), tCompra: x.t - 24, estado: 82, anoFabricacao: Math.floor(x.t / 12) - 2, historia: [] }); if (!x.trabalho.licencas.includes('cnh') && classe !== 'bike') x.trabalho.licencas.push('cnh'); };

/** Casal de meia-idade com filhos adultos e netos (a família para a rede e para a meia-idade). */
function familia(x: Vida) {
  const esposa = criarPessoa(x, r, { idade: idade(x) - 2, municipioId: x.moradia.municipioId, genero: 'feminino', nome: 'Ana Clara' });
  const vin = vincular(x, esposa, { origem: 'romance', proximidade: 82, convivio: ['casa'] });
  vin.romance = { estagio: 'casamento', tEstagio: x.t - 300, tInicio: x.t - 330, envolvimento: 76, planoFilhos: 'evitando' };
  vin.historia.push({ t: x.t - 300, texto: 'Casaram-se.', tipo: 'casamento', peso: 3 });
  const filha = criarPessoa(x, r, { idade: 30, municipioId: x.moradia.municipioId, genero: 'feminino', nome: 'Maitê', sobrenome: x.eu.sobrenome });
  filha.genitores = ['eu', esposa.id]; vincular(x, filha, { parentesco: 'filho', origem: 'familia', proximidade: 74 }).tInicio = filha.tNasc; garantirVida(filha);
  const filho = criarPessoa(x, r, { idade: 26, municipioId: x.moradia.municipioId, genero: 'masculino', nome: 'Ryan', sobrenome: x.eu.sobrenome });
  filho.genitores = ['eu', esposa.id]; vincular(x, filho, { parentesco: 'filho', origem: 'familia', proximidade: 66 }).tInicio = filho.tNasc; garantirVida(filho);
  const genro = criarPessoa(x, r, { idade: 32, municipioId: x.moradia.municipioId, genero: 'masculino', nome: 'Benjamin' });
  vincular(x, genro, { parentesco: 'genro', origem: 'familia', proximidade: 42 }); genro.parceiroId = filha.id; filha.parceiroId = genro.id;
  const neta = criarPessoa(x, r, { idade: 6, municipioId: x.moradia.municipioId, genero: 'feminino', nome: 'Júlia' });
  neta.genitores = [filha.id, genro.id]; vincular(x, neta, { parentesco: 'neto', origem: 'familia', proximidade: 58 }); garantirVida(neta);
  return { esposa, filha, filho, genro, neta };
}

// 1. A filha morreu de AVC este ano: a mãe, o irmão, o marido e a neta de luto (Pessoas).
{
  let v = transacao(ate(4101, 58, 'masculino', 'recife-pe'), x => { limpar(x); casa(x, 'casa_3q', 'propria'); const f = familia(x); registrarMortes(x, r, [{ p: x.pessoas[f.filha.id], vin: x.vinculos[f.filha.id], causa: 'AVC' }], () => {}); for (const k of Object.keys(x.fatos)) if (k.startsWith('despedida:')) delete x.fatos[k]; }).vida;
  gravar('luto', v);
  // Um ano depois: a pergunta do luto do casal aberta.
  v = transacao(v, (x, rr) => { x.t += 12; const d = conteudoPorId('rede_luto_casal')!; if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, rr, { falecido: Object.values(x.pessoas).find(p => p.nome === 'Maitê')! })); }).vida;
  gravar('luto-casal', v, true);
}
// 2. Dono de salão que vai bem, com carro (Trabalho, Tempo).
gravar('salao', transacao(ate(4202, 38, 'masculino', 'salvador-ba'), x => { limpar(x); x.trabalho.experiencia['beleza'] = 120; x.financas.conta = 80000; abrirNegocio(x, r, 'salao', { modo: 'guardado' }); const n = x.caminhos.negocio!; n.clientela = 66; x.trabalho.atual!.clientela = 66; x.t += 12; processarNegocio(x, r); x.t -= 12; veiculo(x, 'carro_compacto'); }).vida);
// 3. Dono sem outro trabalho, com o negócio nas horas vagas (não "procurando").
gravar('dono-horas', transacao(ate(4303, 41, 'feminino', 'curitiba-pr'), x => { limpar(x); x.trabalho.experiencia['comercio'] = 80; x.financas.conta = 50000; const n = abrirNegocio(x, r, 'loja_online', { modo: 'guardado' }); n.clientela = 48; passarParaHorasVagas(x, n); n.caixa = 12400; }).vida);
// 4. Um milhão aplicado, pouco na conta (Você/dinheiro, Cidade: comprar com resgate).
gravar('investidor', transacao(ate(4404, 55, 'masculino', 'campinas-sp'), x => { limpar(x); contratar(x, r, ocupacao('gerente_adm'), 'curriculo'); x.financas.conta = 1_003_000; aplicar(x, 'pos_fixado', 800_000); aplicar(x, 'acoes', 200_000); x.t += 12; x.financas.razao = [{ rotulo: 'Valorização das aplicações', valor: 58000, grupo: 'renda', de: 'patrimonio' }, { rotulo: 'Dividendos e aluguéis de fundos', valor: 9000, grupo: 'renda', de: 'patrimonio' }]; x.t -= 12; x.trabalho.licencas.push('cnh'); }).vida);
// 5. Político que perdeu a eleição com base grande (Trabalho: a explicação e a perspectiva).
{
  let v = transacao(ate(4505, 44, 'feminino', 'sao-paulo-sp'), x => { limpar(x); contratar(x, r, ocupacao('professor_concursado'), 'concurso'); const p = entrarNaPolitica(x, 'comunidade', 1.2); p.partido = 'PSD'; p.tFiliacao = x.t - 60; p.fase = 'filiado'; p.apoio = 72; p.reputacao = 45; x.fatos['pol_partido_porte'] = 2; const e = proximaEleicao(x.t, 'municipal'); registrarCandidatura(x, 'vereador', e.t); p.campanha!.nota = 8; x.t = e.t; processarPolitica(x, criarRng(2)); }).vida;
  gravar('derrota', v);
  v = transacao(v, (x, rr) => { x.anoAtual = { acoes: [] }; x.caminhos.politica!.tFiliacao = x.t - 30; const d = conteudoPorId('pol_troca_partido')!; if (d.tipo === 'decisao') abrirDecisao(x, d, contexto(x, rr)); }).vida;
  gravar('troca-partido', v, true);
}
// 6. Aprovado num curso integral com trabalho integral: a pergunta antes da matrícula.
gravar('curso-integral', transacao(ate(4606, 24, 'masculino', 'recife-pe'), x => { limpar(x); x.educacao.escolaridade = 'medio'; contratar(x, r, ocupacao('vendedor')); propor(x, r, { tipo: 'curso', cursoId: 'eng_civil', via: 'privada', modalidade: 'presencial', rede: 'privada', mensalidade: 1500, municipioId: x.moradia.municipioId, instituicao: 'uma faculdade particular em Recife' }); abrirConflitoPendente(x, r); }).vida, true);
// 7. Moto e bicicleta (Tempo: o trajeto de todo dia).
gravar('moto', transacao(ate(4707, 27, 'masculino', 'fortaleza-ce'), x => { limpar(x); contratar(x, r, ocupacao('vendedor')); casa(x, 'apto_1q'); veiculo(x, 'moto_pequena'); }).vida);
gravar('bicicleta', transacao(ate(4808, 25, 'feminino', 'chapeco-sc'), x => { limpar(x); contratar(x, r, ocupacao('atendente')); casa(x, 'kitnet'); veiculo(x, 'bike'); }).vida);
// 8. Casas (Casa: cada moradia com o seu desenho).
for (const [nome, modelo, tipo, s] of [['casa-kitnet', 'kitnet', 'aluguel', 4901], ['casa-apto3', 'apto_3q', 'aluguel', 4902], ['casa-alto', 'alto_padrao', 'propria', 4903], ['casa-simples', 'casa_simples', 'propria', 4904], ['casa-sitio', 'sitio', 'propria', 4905], ['casa-republica', 'republica', 'republica', 4906]] as const) {
  gravar(nome, transacao(ate(s, 34, 'feminino', 'belo-horizonte-mg'), x => {
    limpar(x); contratar(x, r, ocupacao('assistente_adm')); casa(x, modelo, tipo);
    if (tipo === 'propria') { const id = `im${x.seq++}`; x.financas.bens.push({ id, tipo: 'imovel', modeloId: modelo, nome: modelo.replace(/_/g, ' '), valor: 300000, tCompra: x.t - 60, municipioId: x.moradia.municipioId, estado: nome === 'casa-simples' ? 30 : 80, problema: nome === 'casa-simples' ? { id: 'p1', texto: 'o telhado', custo: 6500, desde: x.t - 12, gravidade: 2, adiado: 1 } : undefined }); x.moradia.imovelId = id; }
  }).vida);
}
// 9. Meia-idade com filhos e netos (Pessoas).
gravar('meia-idade', transacao(ate(5010, 56, 'masculino', 'porto-alegre-rs'), x => { limpar(x); casa(x, 'casa_3q', 'propria'); familia(x); contratar(x, r, ocupacao('gerente_adm')); }).vida);
// 10. O fim: a tela de morte com a retrospectiva.
{
  let v = transacao(ate(5111, 70, 'masculino', 'recife-pe'), x => { limpar(x); familia(x); }).vida;
  for (let k = 0; k < 30 && !v.morte; k++) { v = transacao(v, x => { x.corpo.saude = Math.min(x.corpo.saude, 8); }).vida; v = viver(v, idade(v) + 1); }
  gravar('morto', v);
}
