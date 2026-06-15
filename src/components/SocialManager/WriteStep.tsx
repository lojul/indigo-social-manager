'use client';

import { useState } from 'react';
import { Topic } from './SearchStep';

interface WriteStepProps {
  postText: string;
  onPostTextChange: (text: string) => void;
  selectedTopic: Topic | null;
  companyName: string;
  companyDescription: string;
  companyCategory: string;
  companyLanguage: string;
}

export default function WriteStep({
  postText,
  onPostTextChange,
  selectedTopic,
  companyName,
  companyDescription,
  companyCategory,
  companyLanguage,
}: WriteStepProps) {
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState<'zh-TW' | 'zh-CN' | null>(null);
  const [genError, setGenError] = useState('');

  function sourceFooter(url?: string | null) {
    return url ? `\n\nSource: ${url}` : '';
  }

  function useDraft() {
    if (!selectedTopic) return;
    onPostTextChange(`${selectedTopic.title}\n\n${selectedTopic.summary}${sourceFooter(selectedTopic.url)}`);
    setGenError('');
  }

  async function handleGenerate() {
    if (!selectedTopic) return;
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTopic.title,
          summary: selectedTopic.summary,
          companyName,
          companyDescription,
          companyCategory,
          language: companyLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      onPostTextChange(`${data.post}${sourceFooter(selectedTopic.url)}`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleTranslate(targetLang: 'zh-TW' | 'zh-CN') {
    if (!postText.trim()) return;
    setTranslating(targetLang);
    try {
      // Strip hashtags and source URL before translating, re-append after
      const hashtags = (postText.match(/#\S+/g) || []).join(' ');
      const sourceMatch = postText.match(/\n\nSource: (https?:\/\/\S+)/);
      const sourceUrl = sourceMatch ? sourceMatch[0] : '';
      const body = postText.replace(/#\S+/g, '').replace(/\n\nSource: https?:\/\/\S+/, '').trim();

      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: body, targetLang }),
      });
      const data = await res.json();
      if (data.translated) {
        const parts = [data.translated, hashtags, sourceUrl].filter(Boolean);
        onPostTextChange(parts.join('\n\n').replace(/\n\n\n\n/g, '\n\n'));
      }
    } catch {
      // silently fail
    } finally {
      setTranslating(null);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Write Post
      </h2>

      {selectedTopic && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-blue-700 mb-1">Selected Topic</p>
          <p className="text-xs text-blue-600 mb-2 line-clamp-2">{selectedTopic.title}</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={useDraft}
              className="text-xs px-3 py-1.5 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              Use as Draft
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {generating ? (
                <>
                  <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>✦ Generate with AI</>
              )}
            </button>
          </div>
          {genError && <p className="mt-2 text-xs text-red-600">{genError}</p>}
        </div>
      )}

      <textarea
        value={postText}
        onChange={(e) => onPostTextChange(e.target.value)}
        placeholder="Select a topic and click Generate with AI, or write your post here…"
        rows={10}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />

      <div className="flex items-center justify-between mt-1.5">
        <div className="flex gap-2">
          <button
            onClick={() => handleTranslate('zh-TW')}
            disabled={!postText.trim() || translating !== null}
            className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {translating === 'zh-TW' ? '…' : '繁中'}
          </button>
          <button
            onClick={() => handleTranslate('zh-CN')}
            disabled={!postText.trim() || translating !== null}
            className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {translating === 'zh-CN' ? '…' : '简中'}
          </button>
        </div>
        <p className="text-xs text-gray-400">{postText.length} characters</p>
      </div>
    </div>
  );
}
