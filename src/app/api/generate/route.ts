import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LANGUAGE_NAMES: Record<string, string> = {
  en:    'English',
  'zh-TW': 'Traditional Chinese (繁體中文)',
  'zh-CN': 'Simplified Chinese (简体中文)',
  yue:   'Cantonese (粵語)',
  ms:    'Malay (Bahasa Melayu)',
  ja:    'Japanese (日本語)',
  ko:    'Korean (한국어)',
  th:    'Thai (ภาษาไทย)',
};

export async function POST(req: NextRequest) {
  try {
    const { title, summary, companyName, companyDescription, companyCategory, language, mode = 'post' } = await req.json();

    if (!title || !summary) {
      return NextResponse.json({ error: 'title and summary are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
    }

    const targetLang = LANGUAGE_NAMES[language] || 'English';

    const MODELS = process.env.OPENROUTER_MODEL
      ? [process.env.OPENROUTER_MODEL]
      : [
          'meta-llama/llama-3.3-70b-instruct:free',
          'qwen/qwen3-next-80b-a3b-instruct:free',
          'openai/gpt-oss-120b:free',
          'google/gemma-4-31b-it:free',
        ];

    const headlinePrompt = `Generate a punchy image headline for a Facebook post about this topic.
Rules:
- Maximum 7 words
- No hashtags, no emojis, no punctuation at the end
- Written in ${targetLang}
- Designed to be read at a glance on a branded image
- Bold and specific — not generic

Topic: ${title}
Post: ${summary}

Return only the headline, nothing else.`;

    const postPrompt = `You are a social media content writer for ${companyName || 'a company'}${companyCategory ? `, a ${companyCategory} business` : ''}.

Company background: ${companyDescription || 'No description provided.'}

Write an engaging Facebook post based on this news article:
Title: ${title}
Summary: ${summary}

Requirements:
- Write entirely in ${targetLang}
- 150–280 characters of body text (excluding the CTA and hashtags)
- Conversational and punchy tone — write like a knowledgeable friend sharing news, not a press release
- Include ONE creative engagement line before the hashtags. Rotate naturally among styles such as:
  • A bold opinion prompt ("Hot take: this changes everything — agree or disagree?")
  • A personal question ("What's your experience with this? Drop it below 👇")
  • A prediction challenge ("Where do you see this going in 12 months? Let's hear it.")
  • A poll-style nudge ("Team A or Team B? Vote in the comments.")
  • A curiosity hook ("The part that surprised us most? Tell us if you saw it coming.")
  • A community call ("Tag someone who needs to read this!")
  • A challenge ("Can you name one company already doing this right? Go.")
  Make the engagement line feel natural and specific to the article topic — never generic.
- End with 2–3 relevant hashtags on a new line
- No extra commentary — return only the post text`;

    const prompt = mode === 'headline' ? headlinePrompt : postPrompt;

    let lastError = '';
    for (const model of MODELS) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://social-manager.app',
          'X-Title': 'Social Media Manager',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.75,
          max_tokens: 400,
        }),
      });

      if (res.status === 429 || res.status === 404) {
        lastError = `${model} unavailable (${res.status})`;
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${err}`);
      }

      const data = await res.json();
      const post = data.choices?.[0]?.message?.content?.trim();
      if (post) return NextResponse.json(mode === 'headline' ? { headline: post, model } : { post, model });
      lastError = `${model} returned empty response`;
    }

    throw new Error(`All models unavailable: ${lastError}`);
  } catch (err) {
    console.error('POST /api/generate:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
