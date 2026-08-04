type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
};

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  label = "Progression du questionnaire",
  showPercentage = true,
  className = "",
}: ProgressIndicatorProps) {
  const total = Math.max(1, totalSteps);
  const current = Math.min(
    total,
    Math.max(1, currentStep),
  );

  const percentage = Math.round(
    (current / total) * 100,
  );

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
          Étape {current} sur {total}
        </span>

        {showPercentage && (
          <span className="text-xs font-bold text-slate-400">
            {percentage} %
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`Étape ${current} sur ${total}`}
        className="h-2 overflow-hidden rounded-full bg-orange-100"
      >
        <div
          className="h-full rounded-full bg-orange-600 transition-[width] duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}