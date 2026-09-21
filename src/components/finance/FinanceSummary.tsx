import React from 'react';
import type { EconomyState } from '../../types';
import { formatarDinheiro } from '../../utils/formatters';
import { calcularPatrimonioLiquido } from '../../systems/economySystem';

interface FinanceSummaryProps {
  economia: EconomyState;
}

/**
 * Finanças na visão geral: só o necessário.
 *
 * Saldo, e uma nota curta sobre a situação quando ela for relevante.
 * O detalhamento (renda, despesas, bens, investimentos) permanece na seção
 * Finanças — a visão geral não vira planilha.
 *
 * Todos os valores vêm do estado real do motor. Nenhum número do mockup de
 * referência é reproduzido aqui.
 */
export const FinanceSummary: React.FC<FinanceSummaryProps> = ({ economia }) => {
  const saldo = economia.dinheiro;
  const negativo = saldo < 0;
  const patrimonio = calcularPatrimonioLiquido(economia);

  // Só comentamos o patrimônio quando ele difere de forma relevante do saldo.
  const temPatrimonioAlemDoSaldo =
    economia.propriedades.length > 0 || economia.investimentos.length > 0;

  return (
    <div>
      <p className="finance-summary__balance">
        <span
          className={`finance-summary__amount${
            negativo ? ' finance-summary__amount--negativo' : ''
          }`}
        >
          {formatarDinheiro(saldo)}
        </span>
      </p>

      {/* O estado negativo é dito em palavras, não apenas pela cor. */}
      {negativo && (
        <p className="finance-summary__note">Sua conta está no vermelho.</p>
      )}

      {temPatrimonioAlemDoSaldo && (
        <p className="finance-summary__note">
          Patrimônio: {formatarDinheiro(patrimonio)}
        </p>
      )}

      {economia.dividas > 0 && (
        <p className="finance-summary__note">
          Dívidas: {formatarDinheiro(economia.dividas)}
        </p>
      )}
    </div>
  );
};
