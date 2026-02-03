import { useState } from "react";
import { CreditCard } from "../types/card";
import {
  ChevronLeft,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";

interface CardDetailScreenProps {
  card: CreditCard;
  onBack: () => void;
  onSave: (updatedCard: CreditCard) => void;
  onDeleteCard: (cardId: string) => void;
}

export function CardDetailScreen({
  card,
  onBack,
  onSave,
  onDeleteCard,
}: CardDetailScreenProps) {
  const [editedCard, setEditedCard] = useState(card);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [promoAPR, setPromoAPR] = useState("");
  const [promoExpiration, setPromoExpiration] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateCard = (c: CreditCard): Record<string, string> => {
    const err: Record<string, string> = {};
    if (typeof c.name !== "string" || c.name.trim() === "") {
      err.name = "Card name is required.";
    }
    if (typeof c.creditLimit !== "number" || c.creditLimit <= 0) {
      err.creditLimit = "Credit limit must be greater than 0.";
    }
    if (typeof c.balance !== "number" || c.balance < 0) {
      err.balance = "Balance must be 0 or greater.";
    }
    if (c.creditLimit > 0 && c.balance > c.creditLimit) {
      err.balance = "Balance cannot exceed credit limit.";
    }
    if (typeof c.minimumPayment !== "number" || c.minimumPayment < 0) {
      err.minimumPayment = "Minimum payment must be 0 or greater.";
    }
    if (c.minimumPayment > c.balance) {
      err.minimumPayment = "Minimum payment cannot exceed balance.";
    }
    if (typeof c.apr !== "number" || c.apr < 0 || c.apr > 99.99) {
      err.apr = "APR must be between 0 and 99.99.";
    }
    const dayOfMonth = (dateStr: string) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return Number.isNaN(d.getTime()) ? null : d.getDate();
    };
    const closeDay = dayOfMonth(c.statementCloseDate);
    if (
      c.statementCloseDate &&
      (closeDay === null || closeDay < 1 || closeDay > 31)
    ) {
      err.statementCloseDate =
        "Statement close date must be a valid date (day 1–31).";
    }
    const dueDay = dayOfMonth(c.dueDate);
    if (c.dueDate && (dueDay === null || dueDay < 1 || dueDay > 31)) {
      err.dueDate = "Due date must be a valid date (day 1–31).";
    }
    return err;
  };

  const handleSave = () => {
    const err = validateCard(editedCard);
    setFieldErrors(err);
    if (Object.keys(err).length > 0) return;
    onSave(editedCard);
    onBack();
  };

  const resetField = (field: keyof CreditCard["editedFields"]) => {
    setEditedCard({
      ...editedCard,
      editedFields: {
        ...editedCard.editedFields,
        [field]: false,
      },
    });
  };

  const updateField = (
    field: keyof CreditCard,
    value: string | number | boolean
  ) => {
    const editableFields: (keyof CreditCard)[] = [
      "apr",
      "dueDate",
      "statementCloseDate",
      "creditLimit",
      "balance",
      "minimumPayment",
      "excludeFromOptimization",
    ];
    setEditedCard({
      ...editedCard,
      [field]: value,
      editedFields: {
        ...editedCard.editedFields,
        ...(editableFields.includes(field) &&
          field !== "excludeFromOptimization" && { [field]: true }),
      },
    });
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const formatDateForInput = (dateStr: string) => {
    return dateStr;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1C1C1C] pb-20">
      <div className="max-w-md mx-auto">
        <div className="sticky top-0 bg-white dark:bg-[#252525] border-b border-[#E4E4E4] dark:border-[#3F3F3F] px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-[#F5F5F5] dark:hover:bg-[#2C2C2C] rounded-full"
          >
            <ChevronLeft
              size={24}
              className="text-[#1C1C1C] dark:text-[#E4E4E4]"
            />
          </button>
          <h1 className="text-lg font-medium text-[#1C1C1C] dark:text-[#E4E4E4]">
            Edit Card
          </h1>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Summary Section */}
          <div className="bg-[#F5F5F5] dark:bg-[#252525] rounded-lg p-4 border border-[#E4E4E4] dark:border-[#3F3F3F]">
            <h2 className="font-medium text-[#1C1C1C] dark:text-[#E4E4E4] mb-1">
              {card.name}
            </h2>
            <p className="text-sm text-[#6B6B6B] dark:text-[#9B9B9B] mb-3">
              {card.issuer}
            </p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[#6B6B6B] dark:text-[#9B9B9B]">
                  Balance
                </span>
                <p className="font-medium text-[#1C1C1C] dark:text-[#E4E4E4] mt-0.5">
                  ${card.balance.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[#6B6B6B] dark:text-[#9B9B9B]">
                  Utilization
                </span>
                <p
                  className={`font-medium mt-0.5 ${
                    card.currentUtilization >= 50
                      ? "text-red-600 dark:text-red-400"
                      : card.currentUtilization >= 30
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-[#1C1C1C] dark:text-[#E4E4E4]"
                  }`}
                >
                  {card.currentUtilization.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-[#3F3F3F] dark:text-[#BEBEBE]">
              Card Details
            </h3>

            {/* APR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="apr"
                  className="text-sm text-[#3F3F3F] dark:text-[#BEBEBE]"
                >
                  APR
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9B9B9B] dark:text-[#6B6B6B]">
                    {editedCard.editedFields.apr ? "Edited" : "From bank"}
                  </span>
                  {editedCard.editedFields.apr && (
                    <button
                      onClick={() => resetField("apr")}
                      className="p-1 hover:bg-[#E4E4E4] dark:hover:bg-[#3F3F3F] rounded"
                      aria-label="Reset APR"
                    >
                      <RotateCcw
                        size={14}
                        className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                      />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <input
                  id="apr"
                  type="number"
                  step="0.01"
                  value={editedCard.apr}
                  onChange={(e) =>
                    updateField("apr", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-3 py-2.5 pr-8 border rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                    fieldErrors.apr
                      ? "border-red-500"
                      : "border-[#BEBEBE] dark:border-[#3F3F3F]"
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] dark:text-[#6B6B6B]">
                  %
                </span>
              </div>
              {fieldErrors.apr && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.apr}
                </p>
              )}
            </div>

            {/* Credit Limit */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="creditLimit"
                  className="text-sm text-[#3F3F3F] dark:text-[#BEBEBE]"
                >
                  Credit Limit
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9B9B9B] dark:text-[#6B6B6B]">
                    {editedCard.editedFields.creditLimit
                      ? "Edited"
                      : "From bank"}
                  </span>
                  {editedCard.editedFields.creditLimit && (
                    <button
                      onClick={() => resetField("creditLimit")}
                      className="p-1 hover:bg-[#E4E4E4] dark:hover:bg-[#3F3F3F] rounded"
                      aria-label="Reset credit limit"
                    >
                      <RotateCcw
                        size={14}
                        className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                      />
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] dark:text-[#6B6B6B]">
                  $
                </span>
                <input
                  id="creditLimit"
                  type="number"
                  value={editedCard.creditLimit}
                  onChange={(e) =>
                    updateField(
                      "creditLimit",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  className={`w-full pl-7 pr-3 py-2.5 border rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                    fieldErrors.creditLimit
                      ? "border-red-500"
                      : "border-[#BEBEBE] dark:border-[#3F3F3F]"
                  }`}
                />
              </div>
              {fieldErrors.creditLimit && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.creditLimit}
                </p>
              )}
            </div>

            {/* Current Balance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="currentBalance"
                  className="text-sm text-[#3F3F3F] dark:text-[#BEBEBE]"
                >
                  Current Balance
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] dark:text-[#6B6B6B]">
                  $
                </span>
                <input
                  id="currentBalance"
                  type="number"
                  value={editedCard.balance}
                  onChange={(e) =>
                    updateField("balance", parseInt(e.target.value, 10) || 0)
                  }
                  className={`w-full pl-7 pr-3 py-2.5 border rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                    fieldErrors.balance
                      ? "border-red-500"
                      : "border-[#BEBEBE] dark:border-[#3F3F3F]"
                  }`}
                />
              </div>
              {fieldErrors.balance && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.balance}
                </p>
              )}
            </div>

            {/* Minimum Payment */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="minimumPayment"
                  className="text-sm text-[#3F3F3F] dark:text-[#BEBEBE]"
                >
                  Minimum Payment
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] dark:text-[#6B6B6B]">
                  $
                </span>
                <input
                  id="minimumPayment"
                  type="number"
                  value={editedCard.minimumPayment}
                  onChange={(e) =>
                    updateField(
                      "minimumPayment",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  className={`w-full pl-7 pr-3 py-2.5 border rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                    fieldErrors.minimumPayment
                      ? "border-red-500"
                      : "border-[#BEBEBE] dark:border-[#3F3F3F]"
                  }`}
                />
              </div>
              {fieldErrors.minimumPayment && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.minimumPayment}
                </p>
              )}
            </div>

            {/* Statement Close Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="statementClose"
                  className="text-sm text-[#3F3F3F] dark:text-[#BEBEBE]"
                >
                  Statement Closing Date
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9B9B9B] dark:text-[#6B6B6B]">
                    {editedCard.editedFields.statementCloseDate
                      ? "Edited"
                      : "From bank"}
                  </span>
                  {editedCard.editedFields.statementCloseDate && (
                    <button
                      onClick={() => resetField("statementCloseDate")}
                      className="p-1 hover:bg-[#E4E4E4] dark:hover:bg-[#3F3F3F] rounded"
                      aria-label="Reset statement close date"
                    >
                      <RotateCcw
                        size={14}
                        className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                      />
                    </button>
                  )}
                </div>
              </div>
              <input
                id="statementClose"
                type="date"
                value={formatDateForInput(editedCard.statementCloseDate)}
                onChange={(e) =>
                  updateField("statementCloseDate", e.target.value)
                }
                className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                  fieldErrors.statementCloseDate
                    ? "border-red-500"
                    : "border-[#BEBEBE] dark:border-[#3F3F3F]"
                }`}
              />
              {fieldErrors.statementCloseDate && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.statementCloseDate}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="dueDate"
                  className="text-sm text-[#3F3F3F] dark:text-[#BEBEBE]"
                >
                  Payment Due Date
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#9B9B9B] dark:text-[#6B6B6B]">
                    {editedCard.editedFields.dueDate ? "Edited" : "From bank"}
                  </span>
                  {editedCard.editedFields.dueDate && (
                    <button
                      onClick={() => resetField("dueDate")}
                      className="p-1 hover:bg-[#E4E4E4] dark:hover:bg-[#3F3F3F] rounded"
                      aria-label="Reset due date"
                    >
                      <RotateCcw
                        size={14}
                        className="text-[#9B9B9B] dark:text-[#6B6B6B]"
                      />
                    </button>
                  )}
                </div>
              </div>
              <input
                id="dueDate"
                type="date"
                value={formatDateForInput(editedCard.dueDate)}
                onChange={(e) => updateField("dueDate", e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent ${
                  fieldErrors.dueDate
                    ? "border-red-500"
                    : "border-[#BEBEBE] dark:border-[#3F3F3F]"
                }`}
              />
              {fieldErrors.dueDate && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {fieldErrors.dueDate}
                </p>
              )}
            </div>
          </div>

          {/* Exclude from Optimization */}
          <div className="pt-4 border-t border-[#E4E4E4] dark:border-[#3F3F3F]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editedCard.excludeFromOptimization}
                onChange={(e) =>
                  updateField("excludeFromOptimization", e.target.checked)
                }
                className="mt-0.5 w-5 h-5 rounded border-[#BEBEBE] dark:border-[#3F3F3F] focus:ring-2 focus:ring-[#6B6B6B]"
              />
              <div>
                <span className="text-sm text-[#1C1C1C] dark:text-[#E4E4E4]">
                  Exclude from optimization
                </span>
                <p className="text-xs text-[#6B6B6B] dark:text-[#9B9B9B] mt-0.5">
                  This card will not appear in your payment plan
                </p>
              </div>
            </label>
          </div>

          {/* Advanced Section - Collapsible */}
          <div className="pt-4 border-t border-[#E4E4E4] dark:border-[#3F3F3F]">
            <button
              onClick={() => setAdvancedExpanded(!advancedExpanded)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-medium text-[#3F3F3F] dark:text-[#BEBEBE]">
                Advanced
              </h3>
              {advancedExpanded ? (
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

            {advancedExpanded && (
              <div className="space-y-4">
                {/* Promotional APR */}
                <div>
                  <label
                    htmlFor="promoAPR"
                    className="block text-sm text-[#3F3F3F] dark:text-[#BEBEBE] mb-2"
                  >
                    Promotional APR
                  </label>
                  <div className="relative">
                    <input
                      id="promoAPR"
                      type="number"
                      step="0.01"
                      value={promoAPR}
                      onChange={(e) => setPromoAPR(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 pr-8 border border-[#BEBEBE] dark:border-[#3F3F3F] rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] placeholder:text-[#BEBEBE] dark:placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] dark:text-[#6B6B6B]">
                      %
                    </span>
                  </div>
                </div>

                {/* Promo Expiration Date */}
                <div>
                  <label
                    htmlFor="promoExpiration"
                    className="block text-sm text-[#3F3F3F] dark:text-[#BEBEBE] mb-2"
                  >
                    Promo Expiration Date
                  </label>
                  <input
                    id="promoExpiration"
                    type="date"
                    value={promoExpiration}
                    onChange={(e) => setPromoExpiration(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#BEBEBE] dark:border-[#3F3F3F] rounded-lg bg-white dark:bg-[#252525] text-[#1C1C1C] dark:text-[#E4E4E4] focus:outline-none focus:ring-2 focus:ring-[#6B6B6B] focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-center text-xs text-[#9B9B9B] dark:text-[#6B6B6B]">
            Last updated: Jan 28, 2026
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={handleSave}
              className="w-full py-3 bg-[#1C1C1C] dark:bg-[#E4E4E4] text-white dark:text-[#1C1C1C] rounded-lg font-medium hover:bg-[#3F3F3F] dark:hover:bg-[#BEBEBE] transition-colors"
            >
              Save Changes
            </button>
          </div>

          {/* Delete Card */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to delete this card?")
                ) {
                  onDeleteCard(card.id);
                  onBack();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 size={16} />
              <span className="text-sm font-medium">Delete Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
