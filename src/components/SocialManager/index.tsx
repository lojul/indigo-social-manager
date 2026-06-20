'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { THEMES, ThemeKey } from '@/lib/themes';
import SearchStep, { Topic } from './SearchStep';
import WriteStep from './WriteStep';
import DesignStep from './DesignStep';

interface Company {
  id: number;
  name: string;
  tagline: string;
  theme: string;
  category: string;
  description: string;
  language: string;
}

const STEPS = ['search', 'write', 'design'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  search: 'Find a Topic',
  write: 'Write Post',
  design: 'Design & Publish',
};

export default function SocialManager({ company }: { company: Company }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawStep = searchParams.get('step') as Step | null;
  const step: Step = STEPS.includes(rawStep as Step) ? (rawStep as Step) : 'search';
  const stepIndex = STEPS.indexOf(step);

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [postText, setPostText] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [published, setPublished] = useState(false);

  const themeKey = (company.theme in THEMES ? company.theme : 'indigo') as ThemeKey;
  const theme = THEMES[themeKey];
  const initials = company.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  function goToStep(s: Step) {
    router.push(`/social/company/${company.id}?step=${s}`);
  }

  function canGoNext(): boolean {
    if (step === 'search') return selectedTopic !== null;
    if (step === 'write') return postText.trim().length > 0;
    return false;
  }

  function handleBack() {
    if (stepIndex === 0) {
      router.push('/social');
    } else {
      goToStep(STEPS[stepIndex - 1]);
    }
  }

  function handleReset() {
    setSelectedTopic(null);
    setPostText('');
    setPublished(false);
    setResetKey(k => k + 1);
    router.push(`/social/company/${company.id}`);
  }

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Post queued in Buffer!</h2>
        <p className="text-sm text-gray-500 mb-6">Your post has been added to the publishing queue.</p>
        <button
          onClick={handleReset}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Create another post
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      {/* Breadcrumb / context bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <Link href="/social" className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              Companies
            </Link>
            <span className="text-gray-200 shrink-0">/</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: theme.bg }}
              >
                {initials}
              </div>
              <span className="font-medium text-gray-700 truncate">{company.name}</span>
            </div>
          </div>
          <Link
            href={`/social/company/${company.id}/settings`}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <p className="text-xs text-gray-500 font-medium">{STEP_LABELS[step]}</p>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= stepIndex ? 'bg-indigo-500' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {step === 'search' && (
          <SearchStep
            key={resetKey}
            onTopicSelect={setSelectedTopic}
            companyCategory={company.category ?? ''}
            companyId={company.id}
          />
        )}
        {step === 'write' && (
          <WriteStep
            key={resetKey}
            postText={postText}
            onPostTextChange={setPostText}
            selectedTopic={selectedTopic}
            companyName={company.name}
            companyDescription={company.description ?? ''}
            companyCategory={company.category ?? ''}
            companyLanguage={company.language ?? 'en'}
          />
        )}
        {step === 'design' && (
          <DesignStep
            key={resetKey}
            postText={postText}
            companyTheme={company.theme}
            companyName={company.name}
            companyLanguage={company.language ?? 'en'}
            companyCategory={company.category ?? ''}
            companyId={company.id}
            selectedTopicTitle={selectedTopic?.title}
            selectedTopicSummary={selectedTopic?.summary}
            onPostSuccess={() => setPublished(true)}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="bg-white border-t border-gray-100 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {stepIndex === 0 ? 'All companies' : 'Back'}
          </button>

          {stepIndex < STEPS.length - 1 && (
            <button
              onClick={() => goToStep(STEPS[stepIndex + 1])}
              disabled={!canGoNext()}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
