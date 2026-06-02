'use client';

interface Step {
  label: string;
  index: number;
}

const STEPS: Step[] = [
  { label: 'Search', index: 0 },
  { label: 'Write', index: 1 },
  { label: 'Design', index: 2 },
  { label: 'Publish', index: 3 },
];

interface StepperProps {
  currentStep: number;
}

export default function Stepper({ currentStep }: StepperProps) {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.index} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step.index <= currentStep
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {step.index < currentStep ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.index + 1
              )}
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                step.index <= currentStep ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 flex-1 mt-[-14px] transition-all ${
                step.index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
