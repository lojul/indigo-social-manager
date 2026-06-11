'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { THEMES, ThemeKey } from '@/lib/themes';

const IMAGE_SIZES = {
  facebook:  { label: 'Facebook (1200×630)',   width: 1200, height: 630  },
  instagram: { label: 'Instagram (1080×1080)', width: 1080, height: 1080 },
  story:     { label: 'Story (1080×1920)',      width: 1080, height: 1920 },
} as const;
type SizeKey = keyof typeof IMAGE_SIZES;
type Mode = 'ai' | 'text';

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0].toUpperCase()).join('');
}

function extractHashtags(text: string) {
  return (text.match(/#\S+/g) || []).slice(0, 4).join(' ');
}

// Strip CTA/engagement paragraph and hashtags, keep main content only
function stripCTA(text: string): string {
  return text
    .split(/\n\n+/)
    .map(p => p.replace(/#\S+/g, '').trim())
    .filter(p =>
      p.length > 0 &&
      !/[？?]/.test(p) &&                           // remove question-based engagement lines
      !/👇|留言|tag someone|vote|tell us|drop it|let us|讓我們|tag a|comment below/i.test(p)
    )
    .join('\n\n')
    .trim();
}

function cleanForCanvas(text: string): string {
  const clean = stripCTA(text);
  if (clean.length <= 200) return clean;
  const cut = clean.slice(0, 200);
  const lastPunct = Math.max(
    cut.lastIndexOf('。'), cut.lastIndexOf('.'),
    cut.lastIndexOf('！'), cut.lastIndexOf('!')
  );
  return lastPunct > 80 ? clean.slice(0, lastPunct + 1) : cut + '…';
}

// CJK-aware tokenizer: CJK chars are individual tokens, Latin words stay together
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let latin = '';
  for (const ch of text) {
    if (/[一-鿿぀-ヿ＀-￯　-〿]/.test(ch)) {
      if (latin) { tokens.push(latin); latin = ''; }
      tokens.push(ch);
    } else if (ch === ' ' || ch === '　') {
      if (latin) { tokens.push(latin); latin = ''; }
    } else {
      latin += ch;
    }
  }
  if (latin) tokens.push(latin);
  return tokens;
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    const tokens = tokenize(para);
    let line = '';
    for (const token of tokens) {
      // Add a space between two Latin tokens
      const sep = line && /[a-zA-Z0-9]$/.test(line) && /^[a-zA-Z0-9]/.test(token) ? ' ' : '';
      const test = line + sep + token;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = token;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [''];
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxH: number) {
  for (let size = 60; size >= 20; size -= 4) {
    ctx.font = `bold ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    const lh = size * 1.45;
    const lines = wrapWords(ctx, text, maxW);
    if (lines.length * lh <= maxH) return { lines, fontSize: size, lineHeight: lh };
  }
  const size = 20;
  ctx.font = `bold ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const lh = size * 1.45;
  const maxLines = Math.floor(maxH / lh);
  let lines = wrapWords(ctx, text, maxW);
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    while (ctx.measureText(lines[maxLines - 1] + '…').width > maxW)
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1).trim();
    lines[maxLines - 1] += '…';
  }
  return { lines, fontSize: size, lineHeight: lh };
}

interface DesignStepProps {
  postText: string;
  companyTheme: string;
  companyName: string;
  companyLanguage: string;
  companyCategory?: string;
  selectedTopicTitle?: string;
  selectedTopicSummary?: string;
  onPostSuccess: () => void;
}

export default function DesignStep({
  postText, companyTheme, companyName, companyCategory,
  selectedTopicTitle, selectedTopicSummary, onPostSuccess,
}: DesignStepProps) {
  const [mode, setMode] = useState<Mode>('ai');
  const [sizeKey, setSizeKey] = useState<SizeKey>('instagram');
  const [themeKey, setThemeKey] = useState<ThemeKey>(
    (companyTheme in THEMES ? companyTheme : 'indigo') as ThemeKey
  );

  // AI image state
  const [aiImageUrl, setAiImageUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Text card state
  const [canvasDataUrl, setCanvasDataUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Video / Reel state
  const [videoUrl, setVideoUrl] = useState('');
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

  // Post state
  const [posting, setPosting] = useState(false);
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [postMessage, setPostMessage] = useState('');

  const activeImageUrl = mode === 'ai' ? aiImageUrl : canvasDataUrl;
  const canGenerate = !!(selectedTopicTitle || postText.trim());

  async function handleGenerateAI() {
    if (!canGenerate) return;
    setGeneratingAI(true); setAiError(''); setAiImageUrl('');
    try {
      const size = IMAGE_SIZES[sizeKey];
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTopicTitle || postText.split('\n')[0],
          summary: selectedTopicSummary || postText.slice(0, 300),
          companyName, companyCategory,
          width: size.width, height: size.height,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setAiImageUrl(data.imageUrl);
      setAiPrompt(data.prompt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      setAiError(msg.includes('Load failed') || msg.includes('fetch') ? 'Request timed out — please try again' : msg);
    } finally {
      setGeneratingAI(false);
    }
  }

  const handleGenerateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !postText.trim()) return;

    const size = IMAGE_SIZES[sizeKey];
    const theme = THEMES[themeKey];
    const m = 60;  // margin
    const cl = 90; // corner line length

    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, size.width, size.height);

    // Corner linings — top-left and bottom-right
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(m, m + cl); ctx.lineTo(m, m); ctx.lineTo(m + cl, m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(size.width - m - cl, size.height - m); ctx.lineTo(size.width - m, size.height - m); ctx.lineTo(size.width - m, size.height - m - cl); ctx.stroke();

    // Circle badge — bottom-middle
    const r = 46;
    const cx = size.width / 2;
    const cy = size.height - m - r;
    const nameParts = companyName.split(/\s+/).filter(Boolean);
    const badgeLine1 = nameParts[0] || '';
    const badgeLine2 = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();
    const badgeFontSize = Math.max(11, Math.min(16, r * 0.38));
    ctx.fillStyle = theme.bg;
    ctx.font = `bold ${badgeFontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(badgeLine1, cx, badgeLine2 ? cy - badgeFontSize * 0.4 : cy + badgeFontSize * 0.35);
    if (badgeLine2) ctx.fillText(badgeLine2, cx, cy + badgeFontSize * 1.1);

    // Text area — leave room for corner linings (top/left) and hashtag bar (bottom)
    const padH = m * 2;
    const textAreaW = size.width - padH * 2;
    const bottomReserve = m + r * 2 + 20; // badge (bottom-middle) + margin
    const textAreaH = size.height - m * 2 - bottomReserve;

    const displayText = cleanForCanvas(postText);
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';

    const { lines, fontSize, lineHeight } = fitText(ctx, displayText, textAreaW, textAreaH);
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

    const totalH = lines.length * lineHeight;
    // Centre within the safe text zone (between top margin and bottom reserve)
    const safeTop = m + cl * 0.4; // clear the corner bracket
    const safeHeight = size.height - safeTop - bottomReserve;
    let y = safeTop + (safeHeight - totalH) / 2 + fontSize;
    for (const line of lines) { ctx.fillText(line, size.width / 2, y); y += lineHeight; }

    // Hashtags
    const tags = extractHashtags(postText) || `#${companyName.replace(/\s+/g, '')}`;
    const hSize = Math.max(18, Math.min(26, size.width / 45));
    ctx.font = `${hSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'left';
    ctx.fillText(tags, m + 10, cy - r - 12);

    setCanvasDataUrl(canvas.toDataURL('image/png'));
  }, [sizeKey, themeKey, postText, companyName]);

  async function pollVideo(jobId: string) {
    try {
      const res = await fetch(`/api/generate-video?jobId=${jobId}`);
      const data = await res.json();
      if (data.status === 'completed' && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setGeneratingVideo(false);
      } else if (data.status === 'failed' || data.error) {
        setVideoError(data.error || 'Video generation failed');
        setGeneratingVideo(false);
      } else {
        pollRef.current = setTimeout(() => pollVideo(jobId), 4000);
      }
    } catch {
      setVideoError('Failed to check video status');
      setGeneratingVideo(false);
    }
  }

  async function handleGenerateVideo() {
    if (!aiImageUrl) return;
    setGeneratingVideo(true);
    setVideoError('');
    setVideoUrl('');
    if (pollRef.current) clearTimeout(pollRef.current);

    const aspectRatio = sizeKey === 'story' ? '9:16' : sizeKey === 'instagram' ? '1:1' : '16:9';

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: aiImageUrl,
          prompt: `Animate this professional ${companyCategory || 'business'} image with subtle cinematic motion, slow zoom, gentle parallax effect`,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start video generation');
      pollRef.current = setTimeout(() => pollVideo(data.jobId), 5000);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Failed to generate video');
      setGeneratingVideo(false);
    }
  }

  async function handlePost() {
    if (!activeImageUrl) { setPostStatus('error'); setPostMessage('Generate an image first'); return; }
    setPosting(true); setPostStatus('idle');
    try {
      let imageUrlToPost = activeImageUrl;

      // Canvas mode: upload data URL to imgbb first
      if (mode === 'text') {
        const base64 = activeImageUrl.replace(/^data:image\/png;base64,/, '');
        const imgRes = await fetch('/api/imgbb', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        if (!imgRes.ok) throw new Error('Image upload failed');
        imageUrlToPost = (await imgRes.json()).url;
      }

      // Step 1: fetch channels
      const chanRes = await fetch('/api/buffer/channel');
      const chanData = await chanRes.json();
      if (!chanRes.ok) throw new Error(`Channel error: ${chanData?.error || chanRes.status}`);
      const channels: { id: string; name: string; service: string }[] = chanData?.channels ?? [];
      if (channels.length === 0) throw new Error(`No channels returned. Raw: ${JSON.stringify(chanData)}`);

      // Step 2: post to buffer
      const captionText = mode === 'text' ? '' : (postText || 'Posted via Social Media Manager');
      const postRes = await fetch('/api/buffer/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelIds: channels,
          text: captionText,
          imageUrl: imageUrlToPost,
        }),
      });
      const postData = await postRes.json();
      if (!postRes.ok) throw new Error(`Post error: ${postData?.error || postRes.status}`);

      const channelNames = channels.map((c) => c.name).join(' & ');
      const partial = postData.errors?.length ? ` | Failed: ${postData.errors.join('; ')}` : '';
      setPostStatus(postData.posted === postData.total ? 'success' : 'error');
      setPostMessage(`Posted to ${postData.posted}/${postData.total} channels (${channelNames})!${partial}`);
      onPostSuccess();
    } catch (err) {
      setPostStatus('error');
      setPostMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
        Design & Publish
      </h2>

      {/* Mode tabs */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-3 text-xs font-medium">
        {(['ai', 'text'] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 transition-colors ${mode === m ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            {m === 'ai' ? '✦ AI Image' : '📝 Text Card'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* Size selector — both modes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Image Size</label>
          <select value={sizeKey} onChange={e => setSizeKey(e.target.value as SizeKey)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {(Object.keys(IMAGE_SIZES) as SizeKey[]).map(k => (
              <option key={k} value={k}>{IMAGE_SIZES[k].label}</option>
            ))}
          </select>
        </div>

        {/* ── AI Image mode ── */}
        {mode === 'ai' && (
          <>
            <button onClick={handleGenerateAI} disabled={generatingAI || !canGenerate}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {generatingAI
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating… (up to 30s)</>
                : '✦ Generate AI Image'}
            </button>
            {aiError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{aiError}</p>}
            {aiImageUrl && (
              <>
                <img src={aiImageUrl} alt="AI generated" className="w-full rounded-lg border border-gray-200 shadow-sm" />
                {aiPrompt && <p className="text-xs text-gray-400 italic leading-snug line-clamp-2">Prompt: {aiPrompt}</p>}
                <button onClick={handleGenerateAI} disabled={generatingAI}
                  className="w-full py-1.5 border border-indigo-300 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-50 disabled:opacity-40 transition-colors">
                  ↺ Regenerate
                </button>

                {/* Reel generation */}
                <div className="border-t border-gray-100 pt-3">
                  <button
                    onClick={handleGenerateVideo}
                    disabled={generatingVideo}
                    className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingVideo
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Reel… (30–60s)</>
                      : '🎬 Generate Reel (~$0.25)'}
                  </button>
                  {videoError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{videoError}</p>
                  )}
                  {videoUrl && (
                    <div className="mt-2 space-y-2">
                      <video src={videoUrl} controls playsInline className="w-full rounded-lg border border-gray-200 shadow-sm" />
                      <a
                        href={videoUrl}
                        download="reel.mp4"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-1.5 text-center border border-purple-300 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-50 transition-colors"
                      >
                        ↓ Download Reel
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ── Text Card mode ── */}
        {mode === 'text' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Theme</label>
              <select value={themeKey} onChange={e => setThemeKey(e.target.value as ThemeKey)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {(Object.keys(THEMES) as ThemeKey[]).map(k => (
                  <option key={k} value={k}>{THEMES[k].name}</option>
                ))}
              </select>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={handleGenerateCanvas} disabled={!postText.trim()}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              Generate Summary as Image
            </button>
            {canvasDataUrl && (
              <img src={canvasDataUrl} alt="Text card" className="w-full rounded-lg border border-gray-200 shadow-sm" />
            )}
          </>
        )}

        {/* ── Facebook Preview ── */}
        {activeImageUrl && (
          <FacebookPreview
            companyName={companyName}
            postText={postText}
            imageUrl={activeImageUrl}
            themeKey={themeKey}
            mode={mode}
          />
        )}

        {/* Post to Buffer */}
        <button onClick={handlePost} disabled={posting || !activeImageUrl}
          className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
          {posting ? 'Posting…' : 'Post to Buffer'}
        </button>

        {postStatus !== 'idle' && (
          <div className={`p-3 rounded-lg text-sm ${postStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {postMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function FacebookPreview({ companyName, postText, imageUrl, themeKey, mode }: {
  companyName: string; postText: string; imageUrl: string; themeKey: ThemeKey; mode: Mode;
}) {
  const theme = THEMES[themeKey];
  const initials = getInitials(companyName);

  // Text Card: no caption posted, so show nothing. AI Image: show full text including CTA.
  const previewText = mode === 'text' ? '' : postText;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 pt-2 pb-1">
        Preview
      </p>
      <div className="flex items-center gap-2.5 px-3 pb-2">
        <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: theme.bg }}>
          {initials}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 leading-tight">{companyName}</p>
          <p className="text-xs text-gray-400">Facebook Page · Just now · 🌐</p>
        </div>
      </div>
      {previewText && (
        <div className="px-3 pb-2 overflow-hidden" style={{ maxHeight: '96px' }}>
          <p className="text-xs text-gray-800 leading-relaxed" style={{
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}>
            {previewText}
          </p>
        </div>
      )}
      <img src={imageUrl} alt="Post" className="w-full block" />
      <div className="px-3 py-2 border-t border-gray-100 flex gap-5">
        <span className="text-xs text-gray-500">👍 Like</span>
        <span className="text-xs text-gray-500">💬 Comment</span>
        <span className="text-xs text-gray-500">↗ Share</span>
      </div>
    </div>
  );
}
