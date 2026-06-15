import { NextRequest, NextResponse } from 'next/server';
import { logGeneration } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TEXT_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'google/gemma-4-31b-it:free',
];

async function callOpenRouter(instruction: string, apiKey: string, maxTokens: number): Promise<string> {
  let lastError = '';
  for (const model of TEXT_MODELS) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://admin.indigofoundry.app',
        'X-Title': 'Indigo Admin',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: instruction }],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (res.status === 429 || res.status === 404 || res.status === 503) { lastError = `${model} unavailable (${res.status})`; continue; }
    if (!res.ok) throw new Error(`OpenRouter ${res.status}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (text) return text;
    lastError = `${model} returned empty`;
  }
  throw new Error(`OpenRouter call failed: ${lastError}`);
}

async function generatePrompt(
  title: string,
  summary: string,
  companyCategory: string,
  apiKey: string
): Promise<string> {
  // Single call: scene + text overlay design in one JSON response
  const raw = await callOpenRouter(
    `You are an expert AI image prompt engineer and social media designer.

Generate an image prompt and text overlay for a professional business social media post.

Topic: ${title}
Summary: ${summary}
Industry: ${companyCategory || 'business'}

Return ONLY this JSON (no markdown, no explanation):
{"scene":"<max 30-word photorealistic cinematic scene, dark bottom third, corporate aesthetic>","headline":"<max 6 words>","subtext":"<3-5 words or empty string>","placement":"bottom-left","style":"bold white"}`,
    apiKey,
    180,
  );

  let scene = '';
  let headline = title.split(' ').slice(0, 6).join(' ');
  let subtext = '';

  try {
    const json = raw.replace(/```json\n?|\n?```/g, '').trim();
    const d = JSON.parse(json);
    scene = d.scene || '';
    headline = d.headline || headline;
    subtext = d.subtext || '';
  } catch {
    // Model returned plain text — use it as the scene directly
    scene = raw.slice(0, 200);
  }

  if (!scene) scene = `Professional ${companyCategory || 'business'} scene representing ${title}, cinematic lighting, dark lower third`;

  const overlay = [
    `Text overlay at bottom-left: headline "${headline}"`,
    subtext ? `subtext "${subtext}"` : '',
    `in bold white typography.`,
  ].filter(Boolean).join(', ');

  return `${scene}, professional photography, high quality. ${overlay}`;
}

async function generateImageBase64(prompt: string, azureKey: string, azureEndpoint: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(azureEndpoint, {
      method: 'POST',
      headers: { 'api-key': azureKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, quality: 'low', size: '1024x1024' }),
      signal: AbortSignal.timeout(50000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Azure timed out or unreachable: ${msg}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Azure OpenAI ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('Azure returned no image data');
  return b64;
}

export async function POST(req: NextRequest) {
  try {
    const { title, summary, companyCategory, companyId, width = 1080, height = 1080 } = await req.json();

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });

    const imgbbKey = process.env.IMGBB_API_KEY;
    if (!imgbbKey) return NextResponse.json({ error: 'IMGBB_API_KEY not configured' }, { status: 500 });

    const azureKey = process.env.AZURE_OPENAI_IMAGE_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT;
    if (!azureKey || !azureEndpoint) return NextResponse.json({ error: 'Azure OpenAI image env vars not configured' }, { status: 500 });

    // Step 1: Generate scene + AI-designed text overlay prompt
    const fullPrompt = await generatePrompt(title, summary || '', companyCategory || '', apiKey);

    // Step 2: Generate image via Azure OpenAI
    const base64 = await generateImageBase64(fullPrompt, azureKey, azureEndpoint);

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

    await logGeneration('image', 'gpt-image-1-mini', 0.04, companyId ?? null, {
      imageUrl, size: `${width}x${height}`,
    });

    return NextResponse.json({ imageUrl, prompt: fullPrompt });
  } catch (err) {
    console.error('POST /api/generate-image:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}
