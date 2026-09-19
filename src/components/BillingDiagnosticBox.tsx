import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Wrench, Sparkles } from 'lucide-react';
import { ValidationIssue } from '../utils/billingValidator';

interface BillingDiagnosticBoxProps {
  issues: ValidationIssue[];
  isSubmitting?: boolean;
}

export const BillingDiagnosticBox: React.FC<BillingDiagnosticBoxProps> = ({
  issues,
  isSubmitting = false,
}) => {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  if (issues.length === 0) {
    return (
      <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between text-xs transition-all">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>सर्व हिशोब व माहिती अचूक आहे (All checks passed • Ready to save bill)</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
          ✓ 0 त्रुटी
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 my-2">
      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>त्रुटी आढळल्या (Errors Detected - कृपया दुरुस्त करा):</span>
            </div>
            <span className="text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 px-2 py-0.5 rounded-full">
              {errors.length} त्रुटी
            </span>
          </div>

          <div className="divide-y divide-rose-200/70 dark:divide-rose-800/60 space-y-1.5 pt-1">
            {errors.map((err) => (
              <div
                key={err.id}
                className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="text-rose-900 dark:text-rose-200">
                  <span className="font-bold">{err.title}: </span>
                  <span>{err.message}</span>
                </div>

                {err.onFix && (
                  <button
                    type="button"
                    onClick={err.onFix}
                    disabled={isSubmitting}
                    className="self-start sm:self-auto shrink-0 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>{err.fixLabel || 'दुरुस्त करा (Fix)'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings / Mismatches Section */}
      {warnings.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>विसंगती / स्मार्ट सूचना (Mismatches & Suggestions):</span>
            </div>
            <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
              {warnings.length} सूचना
            </span>
          </div>

          <div className="divide-y divide-amber-200/70 dark:divide-amber-800/60 space-y-1.5 pt-1">
            {warnings.map((warn) => (
              <div
                key={warn.id}
                className="pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="text-amber-900 dark:text-amber-200">
                  <span className="font-bold">{warn.title}: </span>
                  <span>{warn.message}</span>
                </div>

                {warn.onFix && (
                  <button
                    type="button"
                    onClick={warn.onFix}
                    disabled={isSubmitting}
                    className="self-start sm:self-auto shrink-0 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{warn.fixLabel || 'लागू करा (Apply)'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
