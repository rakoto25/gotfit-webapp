import type { ReactNode } from "react";

import ProgressIndicator from "@/components/onboarding/ProgressIndicator";

type FormStepProps = {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  active?: boolean;
  className?: string;
};

export default function FormStep({
  step,
  totalSteps,
  title,
  description,
  icon,
  children,
  active = true,
  className = "",
}: FormStepProps) {
  if (!active) {
    return null;
  }

  const safeTotal = Math.max(
    1,
    totalSteps,
  );

  const safeStep = Math.min(
    safeTotal,
    Math.max(1, step),
  );

  const headingId =
    `form-step-${safeStep}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`grid gap-5 ${className}`}
    >
      <header className="rounded-[2rem] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {icon && (
            <div
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"
            >
              {icon}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2
              id={headingId}
              className="text-xl font-black text-slate-950"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <ProgressIndicator
          currentStep={safeStep}
          totalSteps={safeTotal}
          className="mt-5"
        />
      </header>

      <div className="grid gap-5">
        {children}
      </div>
    </section>
  );
}