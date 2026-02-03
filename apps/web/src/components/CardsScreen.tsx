import { CreditCard } from "../types/card";
import { CardListItem } from "./CardListItem";
import { Plus } from "lucide-react";

interface CardsScreenProps {
  cards: CreditCard[];
  onCardClick: (cardId: string) => void;
  onAddCardClick: () => void;
}

export function CardsScreen({
  cards,
  onCardClick,
  onAddCardClick,
}: CardsScreenProps) {
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const totalLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
  const overallUtilization =
    totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  const getUtilizationColor = (util: number) => {
    if (util >= 50) return "bg-red-500";
    if (util >= 30) return "bg-orange-500";
    if (util >= 10) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1C1C1C] pb-20">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-medium text-[#1C1C1C] dark:text-[#E4E4E4] mb-4">
            Cards
          </h1>

          <div className="bg-white dark:bg-[#252525] border border-[#E4E4E4] dark:border-[#3F3F3F] rounded-lg p-4 mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                Total balance
              </span>
              <span className="text-xl font-medium text-[#1C1C1C] dark:text-[#E4E4E4]">
                ${totalBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                Total credit limit
              </span>
              <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                ${totalLimit.toLocaleString()}
              </span>
            </div>
            <div className="mb-2">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                  Overall utilization
                </span>
                <span
                  className={`font-medium ${
                    totalLimit === 0
                      ? "text-[#6B6B6B] dark:text-[#9B9B9B]"
                      : overallUtilization >= 50
                      ? "text-red-600 dark:text-red-400"
                      : overallUtilization >= 30
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-[#1C1C1C] dark:text-[#E4E4E4]"
                  }`}
                >
                  {totalLimit === 0 ? "—" : `${overallUtilization.toFixed(1)}%`}
                </span>
              </div>
              {/* Utilization Progress Bar — no width when totalLimit is 0 to avoid divide-by-zero */}
              <div className="w-full h-2 bg-[#E4E4E4] dark:bg-[#3F3F3F] rounded-full overflow-hidden">
                <div
                  className={`h-full ${getUtilizationColor(
                    overallUtilization
                  )} transition-all duration-300`}
                  style={{
                    width:
                      totalLimit === 0
                        ? "0%"
                        : `${Math.min(overallUtilization, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider between summary and card list */}
        <div className="mb-4"></div>

        <div className="space-y-3 mb-4">
          {cards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              onClick={() => onCardClick(card.id)}
            />
          ))}
        </div>

        {/* Add Card Button */}
        <button
          onClick={onAddCardClick}
          className="w-full py-3 border-2 border-[#BEBEBE] dark:border-[#3F3F3F] rounded-lg font-medium text-[#3F3F3F] dark:text-[#BEBEBE] hover:border-[#6B6B6B] dark:hover:border-[#9B9B9B] hover:bg-[#F5F5F5] dark:hover:bg-[#252525] transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          <span>Add Card</span>
        </button>
      </div>
    </div>
  );
}
