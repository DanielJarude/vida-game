/**
 * VIDA 12.6 — OS HOBBIES QUE FALTAVAM, COM CAMINHO. A auditoria achou jardinagem inexistente, pintura e artesanato só
 * como "linguagem" de obra, colecionar só como investimento, e nenhum clube de leitura. Aqui, atividades de tempo livre
 * no mesmo molde das outras (`rotinas.ModeloRotina`: o tempo, o custo, as frentes que praticam, o lugar onde se conhece
 * gente) — e cada uma com MARCOS que dependem do tempo de dedicação e da habilidade, nunca de sorteio sem critério: a
 * primeira flor que abriu, a primeira tela pendurada, a primeira feira, a peça rara da coleção, o livro que o clube
 * inteiro discutiu. Nem todo hobby vira dinheiro: só a pintura e o artesanato, e só com mão boa e anos de prática.
 *
 * Também o HÁBITO DA CASA (arrumar a casa toda semana): pouco tempo, menos estresse, e menos atrito com quem divide a casa.
 *
 * Camada de base (só lê o núcleo e o gerador estável): `rotinas` junta estas às outras.
 */
import type { ModeloRotina } from './rotinas';
import type { Dominio, Vida } from '../tipos';
import { escrever, marcarFato, temFato, parceiro } from '../nucleo';
import { clamp, rngDe } from '../rng';

const hab = (v: Vida, d: Dominio) => v.caminhos.frentes[d]?.habilidade ?? 0;
const anosDe = (v: Vida, id: string) => { const r = v.rotinas.find(x => x.id === id); return r ? (v.t - r.tInicio) / 12 : 0; };
const umaVez = (v: Vida, chave: string, f: () => void) => { if (temFato(v, chave)) return; marcarFato(v, chave); f(); };
const naoPreso = (v: Vida): true | string => (v.justica?.prisao ? 'Não da prisão.' : true);

export const ROTINAS_126: ModeloRotina[] = [
  {
    id: 'jardinagem', nome: 'Cuidar de plantas', descricao: 'Vasos na janela, uma horta de temperos, o canteiro do quintal — terra na unha.',
    categoria: 'lazer', idadeMin: 10, requer: naoPreso,
    niveis: [{ rotulo: 'Uns vasos', tempo: 0.25, custo: 25 }, { rotulo: 'Horta e canteiro', tempo: 0.5, custo: 60, qualidade: 1.2 }],
    pratica: { campo: 0.5, manual: 0.3 }, comportamento: { disciplina: 0.5 },
    efeito: (v, _r, nivel) => {
      v.mente.estresse = clamp(v.mente.estresse - (nivel >= 2 ? 1.5 : 1));
      const anos = anosDe(v, 'jardinagem');
      if (anos >= 1) umaVez(v, 'hob126_planta', () => escrever(v, { texto: 'A primeira flor que você plantou abriu. Mandou foto para meio mundo.', relevancia: 'cotidiano', tema: 'lazer', tom: 'bom' }));
      if (anos >= 3 && nivel >= 2) umaVez(v, 'hob126_horta', () => escrever(v, { texto: 'Os temperos e os tomates da horta já vão para a mesa — e para os vizinhos.', relevancia: 'biografia', tema: 'lazer', tom: 'bom', fato: { tipo: 'm_hobby', dados: { hobby: 'jardinagem' } } }));
    }
  },
  {
    id: 'pintura', nome: 'Pintar', descricao: 'Aquarela no caderno, depois tinta acrílica e tela no cavalete.',
    categoria: 'arte', idadeMin: 8,
    niveis: [{ rotulo: 'Por conta própria', tempo: 0.5, custo: 60, qualidade: 0.85 }, { rotulo: 'Ateliê com professor', tempo: 1, custo: 220, qualidade: 1.25 }],
    pratica: { desenho: 0.8 }, social: { onde: 'no ateliê de pintura', fluxo: 0.4, amplitude: 5 }, comportamento: { disciplina: 0.5 },
    efeito: v => {
      const anos = anosDe(v, 'pintura'), h = hab(v, 'desenho');
      if (anos >= 1) umaVez(v, 'hob126_tela', () => escrever(v, { texto: 'A primeira tela que ficou boa o bastante para pendurar na parede.', relevancia: 'cotidiano', tema: 'lazer', tom: 'bom' }));
      if (anos >= 4 && h >= 62) umaVez(v, 'hob126_expo', () => escrever(v, { texto: 'Três quadros seus numa exposição coletiva do bairro. A família foi em peso.', relevancia: 'biografia', tema: 'lazer', tom: 'bom', fato: { tipo: 'm_hobby', dados: { hobby: 'pintura' } } }));
      // Vender um quadro: só com mão boa (a habilidade alta), e uma vez a cada tantos anos.
      if (anos >= 5 && h >= 72 && rngDe(v.id, 'pintura126', Math.floor(v.t / 36)).next() < 0.35 && !temFato(v, `hob126_venda_${Math.floor(v.t / 36)}`)) {
        marcarFato(v, `hob126_venda_${Math.floor(v.t / 36)}`);
        const valor = Math.round((300 + (h - 70) * 60) / 10) * 10;
        v.financas.conta += valor;
        escrever(v, { texto: `Alguém quis comprar um quadro seu. Vendeu — e pendurou o recibo na geladeira.`, relevancia: 'cotidiano', tema: 'lazer', tom: 'bom' });
      }
    }
  },
  {
    id: 'artesanato', nome: 'Artesanato', descricao: 'Crochê, cerâmica, madeira, bijuteria: o que as mãos aprendem devagar.',
    categoria: 'oficio', idadeMin: 9,
    niveis: [{ rotulo: 'Para casa e para presentear', tempo: 0.5, custo: 50, qualidade: 0.9 }, { rotulo: 'Vender na feira', tempo: 1, custo: 120, qualidade: 1.1, requer: v => (hab(v, 'manual') >= 50 ? true : 'Para vender, a mão precisa estar pronta (pratique mais antes).') }],
    pratica: { manual: 0.7, desenho: 0.2 }, social: { onde: 'na feira de artesanato', fluxo: 0.4, amplitude: 6 },
    // Só o nível da feira dá dinheiro, e pouco (paga o material e sobra algum).
    renda: (v, nivel) => (nivel >= 2 ? Math.round((80 + Math.max(0, hab(v, 'manual') - 50) * 8) / 10) * 10 : 0),
    efeito: v => {
      const anos = anosDe(v, 'artesanato');
      if (anos >= 1) umaVez(v, 'hob126_peca', () => escrever(v, { texto: 'A primeira peça que alguém pediu para encomendar.', relevancia: 'cotidiano', tema: 'lazer', tom: 'bom' }));
      if (anos >= 3 && hab(v, 'manual') >= 60) umaVez(v, 'hob126_feira', () => escrever(v, { texto: 'A sua banca na feira tem freguesa certa: as mesmas pessoas voltam todo mês.', relevancia: 'biografia', tema: 'lazer', tom: 'bom', fato: { tipo: 'm_hobby', dados: { hobby: 'artesanato' } } }));
    }
  },
  {
    id: 'colecionar', nome: 'Colecionar', descricao: 'Selos, discos, miniaturas, moedas: a caça, a troca, a prateleira.',
    categoria: 'lazer', idadeMin: 8,
    niveis: [{ rotulo: 'Sem pressa', tempo: 0.25, custo: 40 }, { rotulo: 'Feiras e trocas', tempo: 0.5, custo: 110, qualidade: 1.2 }],
    pratica: { humanas: 0.2 }, social: { onde: 'nas feiras de colecionador', fluxo: 0.3, amplitude: 5 },
    efeito: (v, _r, nivel) => {
      const anos = anosDe(v, 'colecionar');
      // A peça rara: não é sorteio solto — precisa de anos de caça e de ir às feiras.
      const janela = Math.floor(v.t / 48);
      if (anos >= 3 && nivel >= 2 && rngDe(v.id, 'colecao126', janela).next() < 0.4) umaVez(v, `hob126_rara_${janela}`, () => escrever(v, { texto: 'Achou numa feira a peça que faltava na coleção — pelo preço de uma pizza.', relevancia: 'cotidiano', tema: 'lazer', tom: 'bom' }));
      if (anos >= 10) umaVez(v, 'hob126_colecao', () => escrever(v, { texto: 'Dez anos de coleção: cada peça com uma história de onde veio.', relevancia: 'biografia', tema: 'lazer', tom: 'bom', fato: { tipo: 'm_hobby', dados: { hobby: 'colecionar' } } }));
    }
  },
  {
    id: 'clube_leitura', nome: 'Clube do livro', descricao: 'Um livro por mês e uma noite para discutir — na livraria, na biblioteca, na casa de alguém.',
    categoria: 'social', idadeMin: 14,
    niveis: [{ rotulo: 'Uma noite por mês', tempo: 0.25, custo: 45 }],
    pratica: { linguagens: 0.4, humanas: 0.3 }, social: { onde: 'no clube do livro', fluxo: 0.7, amplitude: 8 }, comportamento: { sociabilidade: 0.5 },
    efeito: v => {
      if (anosDe(v, 'clube_leitura') >= 2) umaVez(v, 'hob126_clube', () => escrever(v, { texto: 'O clube do livro discutiu um livro que você indicou. A noite foi até tarde.', relevancia: 'cotidiano', tema: 'lazer', tom: 'bom' }));
    }
  },
  {
    id: 'arrumar_casa', nome: 'Arrumar a casa toda semana', descricao: 'Faxina no sábado, roupa lavada, a cozinha em ordem — o hábito que ninguém aplaude.',
    categoria: 'cuidado', idadeMin: 12,
    requer: v => (v.justica?.prisao ? 'Não da prisão.' : true),
    niveis: [{ rotulo: 'O básico', tempo: 0.25, custo: 0 }, { rotulo: 'A casa impecável', tempo: 0.5, custo: 40 }],
    comportamento: { disciplina: 1 },
    efeito: (v, _r, nivel) => {
      v.mente.estresse = clamp(v.mente.estresse - (nivel >= 2 ? 1 : 0.5));
      // Quem divide a casa sente: menos briga por louça.
      const par = parceiro(v);
      if (par && par.vin.convivio.includes('casa')) par.vin.tensao = clamp(par.vin.tensao - (nivel >= 2 ? 3 : 2));
    }
  }
];
