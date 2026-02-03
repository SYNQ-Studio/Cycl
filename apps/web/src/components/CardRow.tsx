import { CreditCard } from "../types/card";
import { UtilizationBar } from "./UtilizationBar";
import { PaymentRecommendation } from "./PaymentRecommendation";
import { CheckCircle2 } from "lucide-react";

interface CardRowProps {
  card: CreditCard;
  onClick?: () => void;
  showElimination?: boolean;
  onMarkPaid?: (amount: number) => void;
}

export function CardRow({
  card,
  onClick,
  showElimination = false,
  onMarkPaid,
}: CardRowProps) {
  // Mock calculation for elimination - in real app this would be based on actual plan
  const remainingToPayoff =
    card.balance -
    (card.paymentBeforeStatement?.amount || 0) -
    card.paymentByDueDate.amount;
  const canEliminate = remainingToPayoff > 0 && remainingToPayoff < 500;
  const willEliminate = remainingToPayoff <= 0;

  return (
    <div
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#252525] rounded-xl p-4 border border-[#E4E4E4] dark:border-[#3F3F3F] hover:bg-[#FAFAFA] dark:hover:bg-[#2C2C2C] transition-colors cursor-pointer"
    >
      <div className="mb-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-medium text-[#1C1C1C] dark:text-[#E4E4E4]">
              {card.name}
            </h3>
            <p className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
              {card.issuer}
            </p>
          </div>
          {Object.keys(card.editedFields).length > 0 && (
            <span className="text-xs text-[#6B6B6B] dark:text-[#9B9B9B] bg-[#E4E4E4] dark:bg-[#3F3F3F] px-2 py-1 rounded">
              Edited
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-2 text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
          <span>${card.balance.toLocaleString()}</span>
          <span className="text-[#BEBEBE] dark:text-[#6B6B6B]">/</span>
          <span>${card.creditLimit.toLocaleString()}</span>
        </div>
      </div>

      <div className="mb-4">
        <UtilizationBar
          current={card.currentUtilization}
          projected={card.projectedUtilization}
        />
      </div>

      <div className="space-y-2.5">
        {card.paymentBeforeStatement && (
          <PaymentRecommendation
            payment={card.paymentBeforeStatement}
            label="Before statement close"
            showMarkPaid={true}
            onMarkPaid={
              onMarkPaid
                ? () => onMarkPaid(card.paymentBeforeStatement?.amount ?? 0)
                : undefined
            }
          />
        )}
        <PaymentRecommendation
          payment={card.paymentByDueDate}
          label="By due date"
          showMarkPaid={true}
          onMarkPaid={
            onMarkPaid
              ? () => onMarkPaid(card.paymentByDueDate.amount)
              : undefined
          }
        />
      </div>

      {/* Elimination Callout */}
      {showElimination && (willEliminate || canEliminate) && (
        <div className="mt-3 px-3 py-2 bg-[#FEF9C3] dark:bg-yellow-900/20 border border-yellow-300/50 dark:border-yellow-700/30 rounded-lg">
          <p className="text-xs font-medium text-yellow-900 dark:text-yellow-200">
            {willEliminate ? (
              <>🎯 Pays off this card!</>
            ) : (
              <>
                🎯 ${Math.ceil(remainingToPayoff).toLocaleString()} more pays
                off this card!
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
