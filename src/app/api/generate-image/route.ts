import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Pollinations can take up to 30s

const MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'google/gemma-4-31b-it:free',
];

async function generatePrompt(
  title: string,
  summary: string,
  companyCategory: string,
  apiKey: string
): Promise<string> {
  const instruction = `You are an expert AI image prompt engineer for the FLUX photorealistic image model.

Write a concise image generation prompt (max 40 words) for a professional business image that visually represents this news story.

Topic: ${title}
Summary: ${summary}
Industry: ${companyCategory || 'business'}

Requirements:
- Photorealistic, cinematic style
- NO text, letters, words, or numbers in the image
- Modern, corporate aesthetic
- Describe the scene, lighting, colors, and mood
- Suitable for a professional social media post

Return only the prompt, nothing else.`;

  let lastError = '';
  for (const model of MODELS) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://social-manager.app',
        'X-Title': 'Social Media Manager',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: instruction }],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (res.status === 429 || res.status === 404 || res.status === 503) { lastError = `${model} unavailable (${res.status})`; continue; }
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);

    const data = await res.json();
    const prompt = data.choices?.[0]?.message?.content?.trim();
    if (prompt) return prompt;
    lastError = `${model} returned empty`;
  }
  throw new Error(`Prompt generation failed: ${lastError}`);
}

export async function POST(req: NextRequest) {
  try {
    const { title, summary, companyName, companyCategory, width = 1200, height = 630 } = await req.json();

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });

    const imgbbKey = process.env.IMGBB_API_KEY;
    if (!imgbbKey) return NextResponse.json({ error: 'IMGBB_API_KEY not configured' }, { status: 500 });

    // Step 1: Generate a FLUX-optimised prompt
    const basePrompt = await generatePrompt(title, summary || '', companyCategory || '', apiKey);
    const fullPrompt = `${basePrompt}, professional photography, high quality, 8k`;

    // Step 2: Fetch image from Pollinations.ai
    const pollinationsUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}` +
      `?width=${width}&height=${height}&nologo=true&safe=true&model=flux`;

    const imgRes = await fetch(pollinationsUrl);
    if (!imgRes.ok) throw new Error(`Pollinations returned ${imgRes.status}`);

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Step 3: Upload to imgbb for a permanent URL
    const form = new URLSearchParams();
    form.append('key', imgbbKey);
    form.append('image', base64);

    const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!uploadRes.ok) throw new Error(`imgbb upload failed: ${uploadRes.status}`);

    const uploadData = await uploadRes.json();
    const imageUrl = uploadData?.data?.url;
    if (!imageUrl) throw new Error('No URL returned from imgbb');

    return NextResponse.json({ imageUrl, prompt: fullPrompt });
  } catch (err) {
    console.error('POST /api/generate-image:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}
