'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES, ThemeKey } from '@/lib/themes';
import { COMPANY_SIZES, COMPANY_CATEGORIES, FACEBOOK_LANGUAGES } from '@/lib/constants';

interface FormData {
  name: string;
  size: string;
  category: string;
  language: string;
  url: string;
  description: string;
  theme: ThemeKey;
}

const TOTAL_STEPS = 6;

export default function CompanyOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    name: '', size: '', category: '', language: '', url: '', description: '', theme: 'indigo',
  });

  function set<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function canAdvance(): boolean {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 2) return form.size !== '';
    if (step === 3) return form.category.trim().length > 0;
    if (step === 4) return form.language !== '';
    if (step === 5) return true;          // URL is optional
    if (step === 6) return form.description.trim().length > 0;
    return true;
  }

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tagline: '' }),
      });
      if (!res.ok) throw new Error('Failed to create company');
      const company = await res.json();
      router.push(`/dashboard/company/${company.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Back link */}
      <div className="w-full max-w-xl mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Companies
        </button>
      </div>

      {/* Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="px-8 py-10">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-6">
            Step {step} of {TOTAL_STEPS}
          </p>

          <div key={step} className="animate-fadein">
            {step === 1 && (
              <StepName value={form.name} onChange={(v) => set('name', v)}
                onEnter={canAdvance() ? next : undefined} />
            )}
            {step === 2 && (
              <StepSize value={form.size} onChange={(v) => set('size', v)} />
            )}
            {step === 3 && (
              <StepCategory value={form.category} onChange={(v) => set('category', v)} />
            )}
            {step === 4 && (
              <StepLanguage value={form.language} onChange={(v) => set('language', v)} />
            )}
            {step === 5 && (
              <StepUrl value={form.url} onChange={(v) => set('url', v)}
                onEnter={next} />
            )}
            {step === 6 && (
              <StepDescription
                value={form.description} onChange={(v) => set('description', v)}
                theme={form.theme} onThemeChange={(v) => set('theme', v)}
              />
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={back}
              className={`text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors ${step === 1 ? 'invisible' : ''}`}
            >
              ← Back
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                disabled={!canAdvance()}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canAdvance() || submitting}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Company →'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-2 mt-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i + 1 === step ? 'bg-indigo-500 w-4' : i + 1 < step ? 'bg-indigo-300 w-2' : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Step 1: Company Name ───────────────────────────────────────────────────────

function StepName({ value, onChange, onEnter }: {
  value: string; onChange: (v: string) => void; onEnter?: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What&apos;s your company called?</h2>
      <p className="text-sm text-gray-500 mb-6">This is how it&apos;ll appear across your workspace.</p>
      <input
        type="text" autoFocus value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        placeholder="e.g. Acme Corp"
        className="w-full text-lg border-b-2 border-gray-200 focus:border-indigo-500 outline-none py-2 bg-transparent placeholder-gray-300 transition-colors"
      />
    </div>
  );
}

// ── Step 2: Company Size ───────────────────────────────────────────────────────

function StepSize({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">How big is your team?</h2>
      <p className="text-sm text-gray-500 mb-6">Helps us tailor content for your scale.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {COMPANY_SIZES.map((s) => (
          <button key={s.value} type="button" onClick={() => onChange(s.value)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              value === s.value
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            <span className="text-xl font-bold">{s.label}</span>
            <span className="text-xs text-gray-400 mt-0.5">{s.sublabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 3: Industry (+ custom entry) ────────────────────────────────────────

export function CategorySelector({ value, onChange }: {
  value: string; onChange: (v: string) => void;
}) {
  const isCustom = value !== '' && !(COMPANY_CATEGORIES as readonly string[]).includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);
  const [customText, setCustomText] = useState(isCustom ? value : '');

  function selectPreset(cat: string) {
    setShowCustom(false);
    onChange(cat);
  }

  function openCustom() {
    setShowCustom(true);
    onChange(customText);
  }

  function handleCustomChange(v: string) {
    setCustomText(v);
    onChange(v);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {COMPANY_CATEGORIES.map((cat) => (
          <button key={cat} type="button" onClick={() => selectPreset(cat)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
              value === cat && !showCustom
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {cat}
          </button>
        ))}

        {/* Custom entry trigger */}
        <button type="button" onClick={openCustom}
          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
            showCustom
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : 'border-dashed border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500'
          }`}
        >
          + Add your own
        </button>
      </div>

      {showCustom && (
        <div className="mt-4">
          <input
            type="text" autoFocus value={customText}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="e.g. Logistics, Legal Tech, Automotive…"
            className="w-full border-b-2 border-indigo-300 focus:border-indigo-500 outline-none py-2 text-sm bg-transparent placeholder-gray-300 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-400">Type your industry and continue.</p>
        </div>
      )}
    </div>
  );
}

function StepCategory({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What industry are you in?</h2>
      <p className="text-sm text-gray-500 mb-6">We&apos;ll use this to suggest relevant topics and tone.</p>
      <CategorySelector value={value} onChange={onChange} />
    </div>
  );
}

// ── Step 4: Facebook Language ─────────────────────────────────────────────────

export function LanguageSelector({ value, onChange }: {
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FACEBOOK_LANGUAGES.map((lang) => (
        <button key={lang.value} type="button" onClick={() => onChange(lang.value)}
          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-sm transition-all ${
            value === lang.value
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <span className={`font-medium ${value === lang.value ? 'text-indigo-700' : 'text-gray-700'}`}>
            {lang.label}
          </span>
          <span className="text-gray-400 text-xs">{lang.native}</span>
        </button>
      ))}
    </div>
  );
}

function StepLanguage({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What language do you post in?</h2>
      <p className="text-sm text-gray-500 mb-6">
        AI-generated content and image captions will be written in this language.
      </p>
      <LanguageSelector value={value} onChange={onChange} />
    </div>
  );
}

// ── Step 5: Website URL (optional) ────────────────────────────────────────────

function StepUrl({ value, onChange, onEnter }: {
  value: string; onChange: (v: string) => void; onEnter?: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Do you have a website?</h2>
      <p className="text-sm text-gray-500 mb-6">Optional — helps our AI understand your brand voice.</p>
      <input
        type="url" autoFocus value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter(); }}
        placeholder="https://yourcompany.com"
        className="w-full text-lg border-b-2 border-gray-200 focus:border-indigo-500 outline-none py-2 bg-transparent placeholder-gray-300 transition-colors"
      />
      <p className="mt-3 text-xs text-gray-400">Leave blank to skip.</p>
    </div>
  );
}

// ── Step 6: Description + Theme ───────────────────────────────────────────────

function StepDescription({ value, onChange, theme, onThemeChange }: {
  value: string; onChange: (v: string) => void;
  theme: ThemeKey; onThemeChange: (v: ThemeKey) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Describe your product or service</h2>
      <p className="text-sm text-gray-500 mb-4">
        The more detail you provide, the better our AI can create relevant content for your audience.
      </p>
      <textarea
        autoFocus value={value} onChange={(e) => onChange(e.target.value)} rows={5}
        placeholder="We help B2B SaaS companies automate their onboarding workflows…"
        className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
      />
      <div className="mt-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Pick a brand colour</p>
        <div className="flex gap-3 flex-wrap">
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
            <button key={key} type="button" title={THEMES[key].name} onClick={() => onThemeChange(key)}
              className={`w-8 h-8 rounded-full border-4 transition-all ${
                theme === key ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: THEMES[key].bg }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
