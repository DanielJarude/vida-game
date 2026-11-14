/** VIDA 20 · saves para a inspeção visual (OUT=<pasta>): kart, F1, dono de clube, comprador, joias. */
import { writeFileSync } from 'fs';
import { criarVida } from '../../src/motor/criacao';
import { avancarAno } from '../../src/motor/ano';
import { executar, disponibilidade, type Acao } from '../../src/motor/acoes';
import { podeTentar } from '../../src/motor/plausibilidade';
import { idade } from '../../src/motor/nucleo';
import { anoDe } from '../../src/motor/tempo';
import type { Vida } from '../../src/motor/tipos';
const OUT = process.env.OUT!;
const ano = (v: Vida) => { const x = avancarAno(v).vida; x.momento = null; x.fila = undefined; return x; };
const ate = (v: Vida, i: number) => { while (idade(v) < i) v = ano(v); return v; };
const faz = (v: Vida, a: unknown) => (podeTentar(disponibilidade(v, a as Acao)) ? executar(v, a as Acao).vida : v);
const salvar = (n: string, v: Vida) => writeFileSync(`${OUT}/vida-v20-${n}.json`, JSON.stringify(v));

let k = ate(criarVida({ nome: 'Lia', sobrenome: 'Prado', genero: 'feminino', municipioId: 'sao-paulo-sp', semente: 2001, classe: 'alta' }), 8);
k = faz(k, { tipo: 'auto20', oque: { op: 'comecar' } });
for (let i = 0; i < 4; i++) { k = faz(k, { tipo: 'auto20', oque: { op: 'patrocinio' } }); k = ano(k); }
salvar('kart', k);

let f = ate(criarVida({ nome: 'Rafa', sobrenome: 'Lemos', genero: 'masculino', municipioId: 'sao-paulo-sp', semente: 2002, classe: 'alta' }), 21);
const y = anoDe(f.t);
f.automobilismo20 = { fase: 'f2', inicio: f.t - 13 * 12, desde: f.t - 12, equipe: 'Altamira', talento: 70, atributos: { pilotagem: 76, consistencia: 72, adaptacao: 70, fisico: 70, experiencia: 80, pressao: 70 }, temporadas: [
  { ano: y - 3, categoria: 'f4', equipe: 'Cardinal Motorsport', corridas: 20, vitorias: 5, podios: 9, poles: 3, pontos: 260, posicao: 1, abandonos: 1, acidentes: 0, titulo: true, sl: 12 },
  { ano: y - 2, categoria: 'f3', equipe: 'Halcyon GP', corridas: 20, vitorias: 2, podios: 6, poles: 1, pontos: 160, posicao: 3, abandonos: 2, acidentes: 1, sl: 20 },
  { ano: y - 1, categoria: 'f2', equipe: 'Altamira', corridas: 28, vitorias: 4, podios: 10, poles: 2, pontos: 230, posicao: 2, abandonos: 2, acidentes: 0, sl: 40 }], vitorias: 11, podios: 25, titulos: 1, largadas: 68, academia: 'Aurora Racing' };
f.automobilismo20.proposta = { categoria: 'f1', equipe: 'Kestrel Grand Prix', forca: 82, validaAte: f.t + 11, salario: 7000000 };
f = faz(f, { tipo: 'auto20', oque: { op: 'aceitar' } });
f = ano(f); f = ano(f);
salvar('f1', f);

let c = ate(criarVida({ nome: 'Bia', sobrenome: 'Nunes', genero: 'feminino', municipioId: 'salvador-ba', semente: 2003 }), 40);
c.financas.conta = 2e9;
salvar('comprador', c);
c = faz(c, { tipo: 'clube20', oque: { op: 'comprar', nome: 'Bahia', pais: 'BR' } });
c = ano(c); c = ano(c);
salvar('clube', c);

let j = ate(criarVida({ nome: 'Duda', sobrenome: 'Reis', genero: 'feminino', municipioId: 'recife-pe', semente: 2004 }), 30);
j.financas.conta = 1e6;
for (const id of ['short_jeans', 'j20_ponto_de_luz_ouro_branco_diamante', 'j20_argola_m_ouro_amarelo', 'j20_solitario_ouro_rose_diamante', 'j20_alianca_classica_ouro_amarelo', 'j20_riviera_pulso_prata_zirconia', 'j20_tornozeleira_bolinhas_prata']) {
  j = executar(j, { tipo: 'comprar_item', itemId: id } as Acao).vida;
  if (!j.eu.estilo!.itens.find(x => x.itemId === id)!.usando) j = executar(j, { tipo: 'usar_item', itemId: id, usar: true } as Acao).vida;
}
salvar('joias', j);
console.log('ok', k.automobilismo20?.fase, f.automobilismo20?.fase, c.clube20?.nome, j.eu.visual.modeloJoia);

// Redes: contas em quatro plataformas, publicações, alguns anos.
let rd = ate(criarVida({ nome: 'Nina', sobrenome: 'Alves', genero: 'feminino', municipioId: 'rio-de-janeiro-rj', semente: 2005 }), 22);
rd.financas.conta = 50000;
for (const pl of ['instagram', 'tiktok', 'youtube', 'x']) rd = faz(rd, { tipo: 'rede', op: { oque: 'criar', plataforma: pl } });
for (let a = 0; a < 3; a++) {
  for (const [pl, tema] of [['instagram', 'viagem'], ['tiktok', 'humor'], ['youtube', 'tutorial'], ['x', 'opiniao']] as const) rd = faz(rd, { tipo: 'rede', op: { oque: 'publicar', plataforma: pl, tema } });
  rd = ano(rd);
}
salvar('redes', rd);
console.log('redes', Object.keys(rd.redes?.contas ?? {}).join(','));
