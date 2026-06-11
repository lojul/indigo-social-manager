'use client';

import { useState } from 'react';
import Link from 'next/link';
import { THEMES, ThemeKey } from '@/lib/themes';
import Stepper from './Stepper';
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

interface SocialManagerProps {
  company: Company;
}

export default function SocialManager({ company }: SocialManagerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [postText, setPostText] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const themeKey = (company.theme in THEMES ? company.theme : 'indigo') as ThemeKey;
  const theme = THEMES[themeKey];

  function handleTopicSelect(topic: Topic) {
    setSelectedTopic(topic);
    setCurrentStep(Math.max(currentStep, 1));
  }

  function handlePostTextChange(text: string) {
    setPostText(text);
    setCurrentStep(Math.max(currentStep, 1));
  }

function handlePostSuccess() {
    setCurrentStep(3);
  }

  function handleClearAll() {
    setSelectedTopic(null);
    setPostText('');
    setCurrentStep(0);
    setResetKey(k => k + 1);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/social"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Social Manager</h1>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: theme.bg }}
            >
              {company.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/social/company/${company.id}/settings`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              title="Company Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stepper */}
        <Stepper currentStep={currentStep} />

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 – Search Topics */}
          <div
            className={`bg-white rounded-xl p-5 shadow-sm transition-all ${
              currentStep >= 0 ? 'ring-2 ring-indigo-200' : ''
            }`}
            onClick={() => setCurrentStep(0)}
          >
            <SearchStep key={resetKey} onTopicSelect={handleTopicSelect} companyCategory={company.category ?? ''} />
          </div>

          {/* Col 2 – Write Post */}
          <div
            className={`bg-white rounded-xl p-5 shadow-sm transition-all ${
              currentStep >= 1 ? 'ring-2 ring-indigo-200' : ''
            }`}
          >
            <WriteStep
              key={resetKey}
              postText={postText}
              onPostTextChange={handlePostTextChange}
              selectedTopic={selectedTopic}
              companyName={company.name}
              companyDescription={company.description ?? ''}
              companyCategory={company.category ?? ''}
              companyLanguage={company.language ?? 'en'}
            />
          </div>

          {/* Col 3 – Design & Publish */}
          <div
            className={`bg-white rounded-xl p-5 shadow-sm transition-all ${
              currentStep >= 2 ? 'ring-2 ring-indigo-200' : ''
            }`}
          >
            <DesignStep
              key={resetKey}
              postText={postText}
              companyTheme={company.theme}
              companyName={company.name}
              companyLanguage={company.language ?? 'en'}
              companyCategory={company.category ?? ''}
              selectedTopicTitle={selectedTopic?.title}
              selectedTopicSummary={selectedTopic?.summary}
              onPostSuccess={handlePostSuccess}
            />
          </div>
        </div>

        {/* Success banner */}
        {currentStep === 3 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-green-700 font-medium">Post published to Buffer!</p>
            <button
              onClick={handleClearAll}
              className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
            >
              Start a new post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
