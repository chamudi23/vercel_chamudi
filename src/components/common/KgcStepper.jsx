import clsx from 'clsx';

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center w-full mb-12 relative">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={step.label} className="flex flex-col items-center relative z-10 w-48">
            <div
              className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mb-3 border-2 transition-colors',
                isActive ? 'bg-brand-green border-brand-green' : isCompleted ? 'bg-brand-blue border-brand-blue' : 'bg-dark-main border-brand-blue text-brand-blue'
              )}
            >
              {stepNum}
            </div>
            <span
              className={clsx(
                'text-sm font-medium transition-colors',
                isActive ? 'text-brand-green' : isCompleted ? 'text-text-primary' : 'text-text-secondary'
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}

      {/* Connecting line */}
      <div className="absolute top-5 left-[50%] -translate-x-[50%] w-[50%] h-[2px] bg-brand-blue -z-10" />
    </div>
  );
}
