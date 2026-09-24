/**
 * Saves de cenários para o playtest visual da ATT 3 (`material.mjs`).
 *
 *   npx esbuild scripts/playtest/gerarMaterial.ts --bundle --platform=node --outfile=/tmp/gm.cjs && SP=/tmp/vida-mat node /tmp/gm.cjs
 *
 * Cada save é uma vida vivida pelo motor até a idade do cenário e depois
 * levada, por comandos do próprio jogo sempre que possível (alugar, comprar,
 * financiar, aplicar, adotar), ao estado material que se quer fotografar.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, type Acao } from '../../src/motor/acoes';
import type { Vida } from '../../src/motor/tipos';
import { idade, transacao, vinculosVivos } from '../../src/motor/nucleo';
import { contratar } from '../../src/motor/sistemas/trabalho';
import { ocupacao } from '../../src/motor/dados/ocupacoes';
import { criarPessoa, vincular } from '../../src/motor/pessoas';
import { mudarEstagio } from '../../src/motor/sistemas/romance';
import { imoveisParaVoce, veiculosParaVoce } from '../../src/motor/sistemas/relevancia';
import { animaisDoAbrigo } from '../../src/motor/sistemas/mercado';
import { criarRng } from '../../src/motor/rng';

const SP = process.env.SP ?? '/tmp/vida-mat';
mkdirSync(SP, { recursive: true });

function viver(v: Vida, ate: number): Vida {
  while (!v.morte && idade(v) < ate) {
    v = avancarAno(v).vida;
    while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(o => !o.bloqueio)!.id }).vida;
  }
  return v;
}

const nasce = (semente: number, genero: 'masculino' | 'feminino' = 'feminino', municipioId = 'recife-pe', classe?: Vida['origem']['classe']) =>
  criarVida({ nome: genero === 'feminino' ? 'Helena' : 'Davi', sobrenome: 'Araújo', genero, municipioId, semente, classe });
/** Vive até a idade; se a vida acabar antes, tenta a semente seguinte. */
const ate = (semente: number, i: number, genero: 'masculino' | 'feminino', municipioId: string, classe?: Vida['origem']['classe']) => {
  let s = semente; let v = viver(nasce(s, genero, municipioId, classe), i);
  while (v.morte) v = viver(nasce(++s, genero, municipioId, classe), i);
  return v;
};
const gravar = (nome: string, v: Vida) => { v.momento = null; writeFileSync(`${SP}/save-${nome}.json`, JSON.stringify(v)); console.log(nome, idade(v), v.moradia.tipo, Math.round(v.financas.conta)); };
const fazer = (v: Vida, a: Acao) => { const r = executar(v, a); if (r.aviso?.tom === 'ruim' && r.vida === v) console.log('  não deu:', a.tipo, r.aviso.texto); let w = r.vida; while (w.momento) w = executar(w, { tipo: 'decidir', opcaoId: w.momento.opcoes.find(o => !o.bloqueio)!.id }).vida; return w; };

/** Solta dos laços de casa (para montar o próprio domicílio) e dá um emprego. */
function adulta(v: Vida, oc = 'assistente_adm', conta = 30000, salario?: number): Vida {
  return transacao(v, x => {
    x.caminhos.processo = undefined;
    for (const vin of Object.values(x.vinculos)) if (vin.romance && vin.romance.estagio !== 'ex') vin.romance = undefined;
    x.trabalho.atual = undefined;
    x.trabalho.aposentadoria = undefined;
    contratar(x, criarRng(2), ocupacao(oc));
    if (salario) x.trabalho.atual!.salario = salario;
    x.financas.conta = conta;
    x.financas.dividas = [];
    x.financas.negativado = false;
  }).vida;
}

function sairDeCasa(v: Vida): Vida {
  const o = imoveisParaVoce(v, 'aluguel').para[0]?.item;
  return o ? fazer(v, { tipo: v.moradia.tipo === 'pais' ? 'sair_de_casa' : 'trocar_moradia', ofertaId: o.id }) : v;
}

function casal(v: Vida, renda: number, estagio: 'morando_junto' | 'casamento'): Vida {
  return transacao(v, x => {
    const p = criarPessoa(x, criarRng(x.seq), { idade: idade(x) + 1, genero: 'masculino', municipioId: x.moradia.municipioId, renda, ocupacao: 'enfermeiro' });
    vincular(x, p, { origem: 'romance', proximidade: 80, convivio: ['casa'] });
    x.vinculos[p.id].romance = { estagio: 'namoro', tEstagio: x.t - 36, envolvimento: 80, tInicio: x.t - 60 };
    mudarEstagio(x, x.vinculos[p.id], estagio);
    if (!x.vinculos[p.id].convivio.includes('casa')) x.vinculos[p.id].convivio.push('casa');
  }).vida;
}

function filho(v: Vida, i: number, nome: string): Vida {
  return transacao(v, x => {
    const f = criarPessoa(x, criarRng(x.seq + i), { idade: i, genero: i % 2 ? 'masculino' : 'feminino', municipioId: x.moradia.municipioId, nome, sobrenome: x.eu.sobrenome });
    f.genitores = ['eu'];
    vincular(x, f, { parentesco: 'filho', origem: 'familia', proximidade: 80, convivio: ['casa'] });
  }).vida;
}

// 1. Criança morando com os responsáveis (10).
gravar('crianca', ate(41, 10, 'feminino', 'recife-pe', 'trabalhadora'));

// 2. Jovem sem renda (18), na casa dos pais.
gravar('jovem-sem-renda', transacao(ate(42, 18, 'masculino', 'belo-horizonte-mg', 'media_baixa'), x => { x.trabalho.atual = undefined; x.financas.conta = 900; }).vida);

// 3. Jovem trabalhando, morando com os pais (21).
gravar('jovem-trabalhando', adulta(ate(43, 21, 'feminino', 'salvador-ba', 'trabalhadora'), 'atendente', 4200));

// 4. Aluguel, sozinha (26).
gravar('aluguel', sairDeCasa(adulta(ate(44, 26, 'feminino', 'porto-alegre-rs', 'media'), 'analista_adm', 25000)));

// 5. Casal morando junto (30).
gravar('casal', casal(sairDeCasa(adulta(ate(45, 30, 'masculino', 'fortaleza-ce', 'media_baixa'), 'assistente_adm', 18000)), 3800, 'morando_junto'));

// 6. Família com filhos, de aluguel (38).
{
  let v = casal(sairDeCasa(adulta(ate(46, 38, 'feminino', 'curitiba-pr', 'media'), 'analista_adm', 30000)), 5200, 'casamento');
  v = filho(filho(v, 4, 'Theo'), 9, 'Alice');
  gravar('familia', v);
}

// 7. Financiamento: apartamento financiado, com filho (35).
{
  let v = casal(sairDeCasa(adulta(ate(47, 35, 'feminino', 'recife-pe', 'media'), 'analista_adm', 160000, 9000)), 4500, 'casamento');
  v = filho(v, 3, 'Davi');
  const o = imoveisParaVoce(v, 'venda').para.find(x => x.item.quartos >= 2)?.item ?? (imoveisParaVoce(v, 'venda').para[0]?.item ?? imoveisParaVoce(v, 'venda').resto[0]);
  v = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: true, morar: true, prazo: 30 });
  for (let k = 0; k < 3; k++) { v = avancarAno(v).vida; while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(op => !op.bloqueio)!.id }).vida; }
  gravar('financiamento', v);
}

// 8. Proprietária (50), casa quitada, carro.
{
  let v = adulta(ate(48, 50, 'feminino', 'goiania-go', 'media'), 'gerente_adm', 900000);
  v = sairDeCasa(v);
  const o = (imoveisParaVoce(v, 'venda').para[0]?.item ?? imoveisParaVoce(v, 'venda').resto[0]);
  v = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: true });
  v = transacao(v, x => { if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh'); }).vida;
  const c = veiculosParaVoce(v, 'concessionaria').para[0]?.item;
  if (c) v = fazer(v, { tipo: 'comprar_veiculo', ofertaId: c.id, financiar: false });
  gravar('proprietaria', v);
}

// 9. Veículo usado, bem (30).
{
  let v = sairDeCasa(adulta(ate(49, 30, 'masculino', 'campinas-sp', 'trabalhadora'), 'mecanico', 45000));
  v = transacao(v, x => { if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh'); }).vida;
  const o = veiculosParaVoce(v, 'usados').para[0]?.item;
  if (o) v = fazer(v, { tipo: 'comprar_veiculo', ofertaId: o.id, financiar: false });
  gravar('veiculo', v);
  // 10. Oficina: o mesmo carro, anos depois, com problema.
  let w = v;
  for (let k = 0; k < 4; k++) { w = avancarAno(w).vida; while (w.momento) w = executar(w, { tipo: 'decidir', opcaoId: w.momento.opcoes.find(op => !op.bloqueio)!.id }).vida; }
  w = transacao(w, x => { const b = x.financas.bens.find(y => y.tipo === 'veiculo'); if (b && b.tipo === 'veiculo') b.problema = { id: 'pb1', texto: 'a embreagem patinando', custo: 2800, desde: x.t, gravidade: 2, adiado: 1 }; }).vida;
  gravar('oficina', w);
}

// 11. Investimentos (45): várias aplicações, uma com perda.
{
  let v = sairDeCasa(adulta(ate(50, 40, 'feminino', 'sao-paulo-sp', 'media'), 'analista_adm', 260000, 11000));
  for (const [p, valor] of [['reserva', 40000], ['pos_fixado', 60000], ['acoes', 80000], ['imobiliario', 30000], ['acao_unica', 15000]] as const) v = fazer(v, { tipo: 'investir', destino: p, valor });
  for (let k = 0; k < 5; k++) { v = avancarAno(v).vida; while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(op => !op.bloqueio)!.id }).vida; }
  gravar('investimentos', v);
}

// 12. Dívida: parcela atrasada, cartão, nome sujo (33).
{
  let v = sairDeCasa(adulta(ate(51, 33, 'masculino', 'belem-pa', 'trabalhadora'), 'vendedor', 9000));
  v = transacao(v, x => {
    if (x.moradia.tipo === 'pais') {
      for (const vin of Object.values(x.vinculos)) vin.convivio = vin.convivio.filter(c => c !== 'casa');
      x.moradia = { tipo: 'aluguel', municipioId: x.moradia.municipioId, modeloId: 'kitnet', aluguel: 950, padrao: 2, tInicio: x.t - 30, aceitaPet: true, bairro: 'na periferia', atraso: 2, atrasoDesde: x.t - 5 };
    }
    if (!x.trabalho.licencas.includes('cnh')) x.trabalho.licencas.push('cnh');
    x.financas.bens.push({ id: 'car', tipo: 'veiculo', modeloId: 'carro_compacto', nome: 'carro compacto', valor: 42000, precoPago: 52000, tCompra: x.t - 24, estado: 62, anoFabricacao: Math.floor(x.t / 12) - 6, usado: true, historia: [{ t: x.t - 24, texto: 'Comprado usado, financiado.' }] });
    x.financas.dividas.push({ id: 'fv', tipo: 'financiamento_veiculo', saldo: 28000, jurosMes: 0.018, parcela: 1150, bemId: 'car', descricao: 'Financiamento: carro compacto', tInicio: x.t - 24, prazo: 48, atraso: 3, atrasoDesde: x.t - 6 });
    x.financas.dividas.push({ id: 'cc', tipo: 'cartao', saldo: 9400, jurosMes: 0.045, parcela: 0, descricao: 'Cartão e cheque especial', tInicio: x.t - 12 });
    x.financas.negativado = true;
    x.fatos['negativado_desde'] = x.t - 6;
    x.financas.conta = 0;
    x.trabalho.atual = undefined;
    x.trabalho.desempregadoDesde = x.t - 8;
  }).vida;
  gravar('divida', v);
}

// 13. Pet (com a família): um cachorro velho e doente, uma gata nova (32).
{
  let v = sairDeCasa(adulta(ate(52, 32, 'feminino', 'florianopolis-sc', 'media'), 'professor_fund', 20000));
  v = transacao(v, x => { x.moradia.aceitaPet = true; }).vida;
  const a = animaisDoAbrigo(v).filter(x => x.especie === 'cachorro');
  if (a[0]) v = fazer(v, { tipo: 'adotar_pet', animalId: a[0].id });
  v = transacao(v, x => {
    const pet = Object.values(x.pessoas).find(p => p.especie && p.pet?.tutor === 'eu');
    if (pet) { pet.tNasc = x.t - 12 * 11; pet.pet!.vidaMax = 13; pet.pet!.doenca = { nome: 'um problema nos rins', desde: x.t, gravidade: 3, tratando: false, tratavel: false }; }
  }).vida;
  gravar('pet', v);
}

// 14. Aposentada (70): casa própria, aposentadoria e aplicações.
{
  let v = adulta(ate(53, 68, 'feminino', 'vitoria-es', 'media_baixa'), 'assistente_adm', 700000);
  v = sairDeCasa(v);
  const o = (imoveisParaVoce(v, 'venda').para[0]?.item ?? imoveisParaVoce(v, 'venda').resto[0]);
  v = fazer(v, { tipo: 'comprar_imovel', ofertaId: o.id, financiar: false, morar: true });
  v = transacao(v, x => { x.trabalho.atual = undefined; x.trabalho.aposentadoria = { t: x.t, beneficio: 3100 }; }).vida;
  v = fazer(v, { tipo: 'investir', destino: 'inflacao', valor: Math.round(v.financas.conta * 0.6) });
  v = fazer(v, { tipo: 'investir', destino: 'imobiliario', valor: Math.round(v.financas.conta * 0.5) });
  for (let k = 0; k < 2; k++) { v = avancarAno(v).vida; while (v.momento) v = executar(v, { tipo: 'decidir', opcaoId: v.momento.opcoes.find(op => !op.bloqueio)!.id }).vida; }
  gravar('aposentada', v);
}
void vinculosVivos;
