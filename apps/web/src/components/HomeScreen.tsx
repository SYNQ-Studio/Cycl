import { useState, useMemo } from "react";
import { CreditCard } from "../types/card";
import { CardRow } from "./CardRow";
import { Info, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import type { Strategy } from "./StrategyModal";
import {
  generatePlan,
  applyPlanToCards,
  categorizeByPlan,
} from "../lib/planGenerator";

interface HomeScreenProps {
  cards: CreditCard[];
  onCardClick: (cardId: string) => void;
  onExplanationClick: () => void;
  strategy: Strategy;
  onOpenStrategyModal: () => void;
  onMarkPaid?: (cardId: string, amount: number) => void;
}

export function HomeScreen({
  cards,
  onCardClick,
  onExplanationClick,
  strategy,
  onOpenStrategyModal,
  onMarkPaid,
}: HomeScreenProps) {
  const [availableCash, setAvailableCash] = useState<string>("");
  const [onTrackExpanded, setOnTrackExpanded] = useState(false);

  const availableCashNum = parseFloat(availableCash) || 0;
  const activeCards = cards.filter((c) => !c.excludeFromOptimization);

  const planActions = useMemo(
    () => generatePlan(cards, availableCashNum, strategy),
    [cards, availableCashNum, strategy]
  );
  const cardsWithPlan = useMemo(
    () => applyPlanToCards(cards, planActions),
    [cards, planActions]
  );
  const { needsAttention, onTrack } = useMemo(
    () => categorizeByPlan(cardsWithPlan),
    [cardsWithPlan]
  );
  const activeCardsWithPlan = cardsWithPlan.filter(
    (c) => !c.excludeFromOptimization
  );

  const handleGeneratePlan = () => {
    // Plan is derived from cards, availableCash, strategy via useMemo.
  };

  const getStrategyLabel = (s: Strategy) => {
    const labels = {
      snowball: "Snowball",
      avalanche: "Avalanche",
      utilization: "Utilization",
    };
    return labels[s];
  };

  return (
    <>
      <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#1C1C1C] pb-20">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-[#1C1C1C] dark:text-[#E4E4E4] mb-1">
              This Cycle
            </h1>
            <p className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
              Optimized payment plan for your current statement period
            </p>
            <button
              onClick={onExplanationClick}
              className="flex items-center gap-1.5 mt-3 text-sm text-[#6B6B6B] dark:text-[#9B9B9B] hover:text-[#1C1C1C] dark:hover:text-[#E4E4E4] transition-colors"
            >
              <Info size={16} />
              <span>Why this plan?</span>
            </button>
          </div>

          {/* Plan Controls */}
          <div className="bg-white dark:bg-[#252525] border border-[#E4E4E4] dark:border-[#3F3F3F] rounded-lg p-4 mb-6 space-y-4">
            <div>
              <label
                htmlFor="availableCash"
                className="block text-sm text-[#3F3F3F] dark:text-[#BEBEBE] mb-2"
              >
                Available Cash
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] dark:text-[#6B6B6B]">
                  $
                </span>
                <input
                  id="availableCash"
                  type="number"
                  value={availableCash}
                  onChange={(e) => setAvailableCash(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2.5 border border-[#BEBEBE] dark:border-[#3F3F3F] rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] placeholder:text-[#BEBEBE] dark:placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="strategy"
                className="block text-sm text-[#3F3F3F] dark:text-[#BEBEBE] mb-2"
              >
                Strategy
              </label>
              <button
                type="button"
                onClick={onOpenStrategyModal}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-[#BEBEBE] dark:border-[#3F3F3F] rounded-lg bg-white dark:bg-[#252525] text-left hover:border-[#6B6B6B] dark:hover:border-[#9B9B9B] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#1C1C1C] dark:text-[#E4E4E4]">
                    {getStrategyLabel(strategy)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenStrategyModal();
                    }}
                    className="p-0.5 hover:bg-[#F5F5F5] dark:hover:bg-[#2C2C2C] rounded"
                  >
                    <HelpCircle
                      size={16}
                      className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                    />
                  </button>
                </div>
                <ChevronDown
                  size={20}
                  className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                />
              </button>
            </div>

            <button
              onClick={handleGeneratePlan}
              className="w-full py-2.5 bg-[#1C1C1C] dark:bg-[#E4E4E4] text-white dark:text-[#1C1C1C] rounded-lg font-medium hover:bg-[#3F3F3F] dark:hover:bg-[#BEBEBE] transition-colors"
            >
              Generate Plan
            </button>
          </div>

          {/* Plan Summary Card — from computed plan */}
          <div className="bg-white dark:bg-[#252525] border border-[#E4E4E4] dark:border-[#3F3F3F] rounded-lg p-4 mb-6">
            <h3 className="text-xs font-semibold tracking-wider text-[#6B6B6B] dark:text-[#9B9B9B] mb-3">
              PLAN SUMMARY
            </h3>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                  Total payments
                </span>
                <span className="text-xl font-medium text-[#1C1C1C] dark:text-[#E4E4E4]">
                  $
                  {activeCardsWithPlan
                    .reduce(
                      (sum, card) =>
                        sum +
                        (card.paymentBeforeStatement?.amount || 0) +
                        card.paymentByDueDate.amount,
                      0
                    )
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                  Required minimums
                </span>
                <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                  $
                  {activeCardsWithPlan
                    .reduce((sum, card) => sum + card.minimumPayment, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                  Extra toward balances
                </span>
                <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                  $
                  {(
                    activeCardsWithPlan.reduce(
                      (sum, card) =>
                        sum +
                        (card.paymentBeforeStatement?.amount || 0) +
                        card.paymentByDueDate.amount,
                      0
                    ) -
                    activeCardsWithPlan.reduce(
                      (sum, card) => sum + card.minimumPayment,
                      0
                    )
                  ).toLocaleString()}
                </span>
              </div>
              <div className="border-t border-[#E4E4E4] dark:border-[#3F3F3F] pt-3 mt-3">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                    Cards in this plan
                  </span>
                  <span className="text-sm font-medium text-[#1C1C1C] dark:text-[#E4E4E4]">
                    {activeCardsWithPlan.length}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B]">
                    Cards needing attention
                  </span>
                  <span className="text-sm font-medium text-[#1C1C1C] dark:text-[#E4E4E4]">
                    {needsAttention.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Needs Attention Section */}
          <div className="mb-4">
            <button className="w-full flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold tracking-wider text-[#6B6B6B] dark:text-[#9B9B9B]">
                NEEDS ATTENTION ({needsAttention.length})
              </h2>
            </button>
            <div className="space-y-4">
              {needsAttention.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  onClick={() => onCardClick(card.id)}
                  showElimination={true}
                  onMarkPaid={
                    onMarkPaid
                      ? (amount) => onMarkPaid(card.id, amount)
                      : undefined
                  }
                />
              ))}
            </div>
          </div>

          {/* On Track Section */}
          <div>
            <button
              onClick={() => setOnTrackExpanded(!onTrackExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h2 className="text-xs font-semibold tracking-wider text-[#6B6B6B] dark:text-[#9B9B9B]">
                ON TRACK ({onTrack.length})
              </h2>
              {onTrackExpanded ? (
                <ChevronUp
                  size={20}
                  className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                />
              ) : (
                <ChevronDown
                  size={20}
                  className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                />
              )}
            </button>
            {onTrackExpanded && (
              <div className="space-y-4">
                {onTrack.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    onClick={() => onCardClick(card.id)}
                    showElimination={false}
                    onMarkPaid={
                      onMarkPaid
                        ? (amount) => onMarkPaid(card.id, amount)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
