import { PaymentRecommendation as PaymentRec } from "../types/card";
import { CheckCircle2 } from "lucide-react";

interface PaymentRecommendationProps {
  payment: PaymentRec;
  label: string;
  isEstimated?: boolean;
  showMarkPaid?: boolean;
  onMarkPaid?: () => void;
}

export function PaymentRecommendation({
  payment,
  label,
  isEstimated,
  showMarkPaid = false,
  onMarkPaid,
}: PaymentRecommendationProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleMarkPaid = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkPaid?.();
  };

  return (
    <div className="border border-[#E4E4E4] dark:border-[#3F3F3F] rounded-lg p-3 bg-[#FAFAFA] dark:bg-[#2C2C2C]">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs text-[#6B6B6B] dark:text-[#9B9B9B]">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {isEstimated && (
            <span className="text-xs text-[#BEBEBE] dark:text-[#6B6B6B]">
              Estimated
            </span>
          )}
          {showMarkPaid && (
            <span
              onClick={handleMarkPaid}
              className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Mark paid</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-medium text-[#1C1C1C] dark:text-[#E4E4E4]">
          ${payment.amount.toLocaleString()}
        </span>
        <span className="text-sm text-[#9B9B9B] dark:text-[#6B6B6B]">
          by {formatDate(payment.date)}
        </span>
      </div>
      <p className="text-xs text-[#6B6B6B] dark:text-[#9B9B9B] leading-relaxed">
        {payment.explanation}
      </p>
    </div>
  );
}
