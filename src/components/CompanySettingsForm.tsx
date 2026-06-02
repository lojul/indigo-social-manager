'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES, ThemeKey } from '@/lib/themes';
import { COMPANY_SIZES } from '@/lib/constants';
import { CategorySelector, LanguageSelector } from '@/components/CompanyOnboarding';
import { Company } from '@/lib/db';

interface Props { company: Company; }

export default function CompanySettingsForm({ company }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name:        company.name,
    tagline:     company.tagline        ?? '',
    theme:       (company.theme in THEMES ? company.theme : 'indigo') as ThemeKey,
    size:        company.size           ?? '',
    category:    company.category       ?? '',
    url:         company.url            ?? '',
    description: company.description    ?? '',
    language:    company.language       ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Company name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      router.refresh();
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const themeConfig = THEMES[form.theme];

  return (
    <div className="space-y-6">

      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <Section title="Identity" subtitle="How your company appears across the workspace">
        <Field label="Company Name" required>
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
            className={INPUT} placeholder="Acme Corp" />
        </Field>

        <Field label="Tagline" hint="Short one-liner shown on the company card">
          <input type="text" value={form.tagline} onChange={(e) => set('tagline', e.target.value)}
            className={INPUT} placeholder="Building the future of commerce" />
        </Field>

        <Field label="Brand Colour">
          <div className="flex gap-3 flex-wrap mt-1">
            {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
              <button key={key} type="button" title={THEMES[key].name} onClick={() => set('theme', key)}
                className={`w-9 h-9 rounded-full border-4 transition-all ${
                  form.theme === key ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: THEMES[key].bg }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Selected: <span className="font-medium" style={{ color: themeConfig.bg }}>{themeConfig.name}</span>
          </p>
        </Field>
      </Section>

      {/* ── Company Profile ───────────────────────────────────────────────── */}
      <Section title="Company Profile" subtitle="Helps our AI tailor content for your context">
        <Field label="Team Size">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 mt-1">
            {COMPANY_SIZES.map((s) => (
              <button key={s.value} type="button" onClick={() => set('size', s.value)}
                className={`flex flex-col items-center py-3 rounded-xl border-2 text-sm transition-all ${
                  form.size === s.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span className="font-bold text-sm">{s.label}</span>
                <span className="text-xs text-gray-400">{s.sublabel}</span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Industry">
          <div className="mt-1">
            <CategorySelector value={form.category} onChange={(v) => set('category', v)} />
          </div>
        </Field>

        <Field label="Website" hint="Optional">
          <input type="url" value={form.url} onChange={(e) => set('url', e.target.value)}
            className={INPUT} placeholder="https://yourcompany.com" />
        </Field>
      </Section>

      {/* ── Social Media Preferences ──────────────────────────────────────── */}
      <Section
        title="Social Media Preferences"
        subtitle="Controls the language AI uses when generating posts and captions"
      >
        <Field label="Facebook Post Language">
          <div className="mt-1">
            <LanguageSelector value={form.language} onChange={(v) => set('language', v)} />
          </div>
        </Field>
      </Section>

      {/* ── AI Context ────────────────────────────────────────────────────── */}
      <Section
        title="Product & Service Description"
        subtitle="The most important input for AI content generation — be as detailed as possible"
      >
        <textarea
          value={form.description} onChange={(e) => set('description', e.target.value)}
          rows={7} className={`${INPUT} resize-none`}
          placeholder="Describe what your company does, who your customers are, what problems you solve, and your key differentiators. The AI uses this context to generate relevant, on-brand social content for you."
        />
        <p className="mt-1.5 text-xs text-gray-400">
          {form.description.length} characters · Aim for at least 100 for best AI results
        </p>
      </Section>

      {/* ── Save bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2 pb-8">
        <button
          onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, required, children }: {
  label: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 text-xs text-gray-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300';
