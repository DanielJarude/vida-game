/**
 * REWORK 10 · ECO-03 — O SEGURO-DESEMPREGO EM PARCELAS. A demissão (`trabalho`) diz quantas parcelas e de quanto (pelas
 * regras do país e pelo tempo de casa); aqui, a cada ano, entram as parcelas cujos meses já passaram — cada uma no
 * extrato. Um emprego formal novo encerra o benefício (as parcelas depois do mês da contratação não vêm); o trabalho
 * por conta própria ou informal não encerra. Sem emprego e sem parcelas, o benefício acaba sem barulho.
 */
import type { Vida } from '../tipos';
import { escrever } from '../nucleo';
import { lancar } from './extrato';
import { dinheiro as fmt } from '../texto';

const FORMAL = new Set(['clt', 'servidor', 'militar', 'temporario', 'aprendiz', 'eletivo']);

export function processarSeguroDesemprego(v: Vida): void {
  const s = v.trabalho.seguroDesemprego;
  if (!s) return;
  const e = v.trabalho.atual;
  const voltou = e && FORMAL.has(e.contrato) && e.tInicio >= s.tProxima - 1 ? e.tInicio : undefined;
  const ate = voltou ?? v.t;
  let pagas = 0;
  while (s.restantes > 0 && s.tProxima <= ate) { pagas++; s.restantes--; s.tProxima++; }
  if (pagas > 0) {
    v.financas.conta += pagas * s.parcela;
    lancar(v, `Seguro-desemprego: ${pagas} ${pagas === 1 ? 'parcela' : 'parcelas'} de ${fmt(s.parcela)}`, 'renda', pagas * s.parcela);
  }
  if (voltou !== undefined && s.restantes > 0) {
    escrever(v, { texto: `Com o emprego novo, o seguro-desemprego parou: ${s.total - s.restantes} de ${s.total} parcelas recebidas.`, relevancia: 'cotidiano', tema: 'dinheiro' });
    v.trabalho.seguroDesemprego = undefined;
  } else if (s.restantes === 0) v.trabalho.seguroDesemprego = undefined;
}
