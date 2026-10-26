/**
 * REWORK 12.25 — as ações novas do Submundo, num lugar só (a ação `crime` de `acoes`): as encomendas, os contatos, as
 * organizações, a Justiça e o rumo (que agora se escolhe na tela, a qualquer hora — NAR-12.25-01). Cada área tem a sua
 * disponibilidade (o risco e o preço ditos antes) e a sua execução, nos módulos dela.
 */
import type { Vida } from '../tipos';
import { bloqueio, PERMITIDO, type Veredito } from '../plausibilidade';
import { disponibilidadeEncomenda, executarEncomenda, type OqueEncomenda } from './encomendas';
import { disponibilidadeContato, executarContato, type OqueContato } from './redeCriminal';
import { disponibilidadeOrg, executarOrg, type OqueOrg } from './faccoes';
import { disponibilidadeDefesa, executarDefesa, type OqueDefesa } from './defesa';
import { comecarASair } from './carreiraCriminal';
import { registrarRumo } from './porFora';
import { escalar, moita } from './ilicito';
import { preso } from './justica';
import { anotar } from './submundo';
import { escrever } from '../nucleo';
import { contrair } from '../texto';

export type OqueRumo = 'moita' | 'voltar_ritmo' | 'fundo' | 'sair_aos_poucos' | 'desistir_de_sair';

export type AcaoDoCrime =
  | { area: 'encomenda'; oque: OqueEncomenda; id?: string; pessoaId?: string; trabalho?: string }
  | { area: 'contato'; oque: OqueContato; pessoaId: string }
  | { area: 'org'; oque: OqueOrg; orgId: string; alvo?: string }
  | { area: 'justica'; oque: OqueDefesa }
  | { area: 'rumo'; oque: OqueRumo };

export const ROTULO_DO_RUMO: Record<OqueRumo, string> = {
  moita: 'Ficar na moita (menos dinheiro, menos exposição)', voltar_ritmo: 'Voltar ao ritmo de antes', fundo: 'Ir mais fundo (mais dinheiro, mais compromisso)',
  sair_aos_poucos: 'Sair aos poucos (em um ano, sem porta batida)', desistir_de_sair: 'Desistir de sair'
};

function disponibilidadeRumo(v: Vida, oque: OqueRumo): Veredito {
  const e = v.caminhos.envolvimento;
  if (!e || e.parou !== undefined) return bloqueio('impossivel', 'Você não está nisso agora.');
  if (preso(v)) return bloqueio('impossivel', 'Na prisão, não.');
  if (v.momento) return bloqueio('incompativel', 'Há uma decisão esperando antes.');
  if (e.rumo?.some(x => x.t === v.t)) return bloqueio('incompativel', 'O rumo deste ano já foi decidido.');
  switch (oque) {
    case 'moita': return e.cautela ? bloqueio('incompativel', 'Você já está na moita.') : PERMITIDO;
    case 'voltar_ritmo': return e.cautela && e.saindo === undefined ? PERMITIDO : bloqueio('incompativel', 'Você já está no ritmo de sempre.');
    case 'fundo': return e.nivel >= 3 ? bloqueio('incompativel', 'Mais fundo do que isso, não há.') : e.saindo !== undefined ? bloqueio('incompativel', 'Você está saindo.') : { grau: 'irregular', motivo: 'Mais dinheiro, mais gente em volta — e mais exposição, todo ano.' };
    case 'sair_aos_poucos': return e.saindo !== undefined ? bloqueio('incompativel', 'Você já está saindo.') : PERMITIDO;
    case 'desistir_de_sair': return e.saindo !== undefined ? PERMITIDO : bloqueio('impossivel', 'Você não está saindo.');
  }
}

function executarRumo(v: Vida, oque: OqueRumo): { texto: string; tom?: 'bom' | 'ruim' } {
  const e = v.caminhos.envolvimento!;
  switch (oque) {
    case 'moita': moita(v, true); registrarRumo(v, 'moita', 'na tela'); anotar(v, 'Passou a ficar na moita.'); return { texto: 'Menos encomenda, menos gente sabendo, o telefone desligado mais cedo. O dinheiro cai; o medo, um pouco.' };
    case 'voltar_ritmo': moita(v, false); registrarRumo(v, 'seguir', 'na tela'); anotar(v, 'Voltou ao ritmo de antes.'); return { texto: 'Você voltou ao ritmo de antes. Mais dinheiro, mais gente em volta.' };
    case 'fundo':
      escalar(v); registrarRumo(v, 'fundo', 'na tela'); anotar(v, 'Foi mais fundo.');
      escrever(v, { texto: 'Foi mais fundo no que fazia por fora.', relevancia: 'biografia', tema: 'trabalho', tom: 'ruim', escolha: true });
      return { texto: 'Mais dinheiro, mais gente em volta, mais coisa para esconder.', tom: 'ruim' };
    case 'sair_aos_poucos': return { texto: comecarASair(v), tom: 'bom' };
    case 'desistir_de_sair': delete e.saindo; e.cautela = undefined; registrarRumo(v, 'seguir', 'desistiu de sair'); anotar(v, 'Desistiu de sair.'); return { texto: 'Você desistiu de sair. Quem tinha sido avisado agora sabe que era só conversa.', tom: 'ruim' };
  }
}

export function disponibilidadeCrime(v: Vida, a: AcaoDoCrime): Veredito {
  switch (a.area) {
    case 'encomenda': return disponibilidadeEncomenda(v, a.oque, a.id, a.pessoaId, a.trabalho);
    case 'contato': return disponibilidadeContato(v, a.pessoaId, a.oque);
    case 'org': return disponibilidadeOrg(v, a.orgId, a.oque, a.alvo);
    case 'justica': return disponibilidadeDefesa(v, a.oque);
    case 'rumo': return disponibilidadeRumo(v, a.oque);
  }
}

export function executarCrime(v: Vida, a: AcaoDoCrime): { texto: string; tom?: 'bom' | 'ruim'; titulo: string } {
  const x = executarNaArea(v, a);
  return { ...x, texto: contrair(x.texto) };
}

function executarNaArea(v: Vida, a: AcaoDoCrime): { texto: string; tom?: 'bom' | 'ruim'; titulo: string } {
  switch (a.area) {
    case 'encomenda': return { ...executarEncomenda(v, a.oque, a.id, a.pessoaId, a.trabalho), titulo: a.oque === 'delegar' ? 'Uma encomenda' : 'O trabalho' };
    case 'contato': return { ...executarContato(v, a.pessoaId, a.oque), titulo: v.pessoas[a.pessoaId]?.nome ?? 'O contato' };
    case 'org': return { ...executarOrg(v, a.orgId, a.oque, a.alvo), titulo: 'A organização' };
    case 'justica': return { ...executarDefesa(v, a.oque), titulo: 'A Justiça' };
    case 'rumo': return { ...executarRumo(v, a.oque), titulo: 'O rumo' };
  }
}
