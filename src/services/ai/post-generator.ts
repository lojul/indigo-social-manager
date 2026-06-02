/**
 * AI Post Generator using OpenRouter API
 * Generates engaging Facebook posts from trending news topics
 */

import OpenAI from 'openai';
import { z } from 'zod';
import type { TrendingTopic } from '../trends/serpapi.js';

// Schema for generated post
export const GeneratedPostSchema = z.object({
  content: z.string().min(50).max(500),
  hashtags: z.array(z.string()).max(5).optional(),
  callToAction: z.string().max(100).optional(),
});

export type GeneratedPost = z.infer<typeof GeneratedPostSchema>;

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY || 'missing-key',
  defaultHeaders: {
    'HTTP-Referer': 'https://facebook-trending-posts.app',
    'X-Title': 'Facebook Trending Posts Generator',
  },
});

const SYSTEM_PROMPT = `你是一個專業的社交媒體內容創作者，專為香港和台灣Facebook用戶設計。

根據提供的新聞標題，創建吸引人的Facebook貼文。

要求：
1. 貼文長度：100-280字（適合Facebook閱讀習慣）
2. 使用繁體中文
3. 包含2-4個相關emoji，自然地融入文字中
4. 語氣親切、有趣、引發討論
5. 結尾加入互動問題或行動呼籲（如「你怎麼看？」「留言告訴我們！」）
6. 可以加入2-3個相關hashtag

風格指南：
- 開頭要吸引眼球（可用emoji或有趣的觀點）
- 內容要有觀點但不偏激
- 適當使用換行增加可讀性
- 語氣像是朋友分享有趣新聞

避免：
- 政治敏感話題（選舉、政黨、政治人物批評）
- 爭議性觀點或挑起對立
- 虛假或未經證實的資訊
- 負面或悲觀的語氣
- 過於正式或官方的語氣

回覆格式必須是 JSON：
{
  "content": "你的貼文內容（包含emoji和換行）",
  "hashtags": ["標籤1", "標籤2"],
  "callToAction": "互動呼籲（如有的話）"
}`;

/**
 * Generate a Facebook post from a trending topic with news context
 */
export async function generatePostFromTopic(topic: TrendingTopic): Promise<GeneratedPost | null> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  if (topic.newsHeadlines.length === 0) {
    console.log(`[PostGenerator] Skipping topic without news: ${topic.title}`);
    return null;
  }

  console.log(`[PostGenerator] Generating post for: ${topic.title}`);
  console.log(`[PostGenerator] News context: ${topic.newsHeadlines[0]}`);

  try {
    const newsContext = topic.newsHeadlines
      .map((headline, i) => `${i + 1}. ${headline}`)
      .join('\n');

    const userPrompt = `請根據以下新聞標題創建一則Facebook貼文：

話題關鍵字：${topic.title}
${topic.category ? `分類：${topic.category}` : ''}
地區：${topic.region}

相關新聞標題：
${newsContext}

請創建一則與這些新聞直接相關、適合在Facebook分享的貼文。`;

    console.log(`[PostGenerator] Using model: ${OPENROUTER_MODEL}`);
    const completion = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error('[PostGenerator] Empty response from AI');
      return null;
    }

    // Parse and validate the response
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          console.error('[PostGenerator] Failed to parse JSON response:', content.substring(0, 300));
          return null;
        }
      } else {
        console.error('[PostGenerator] No JSON found in response:', content.substring(0, 300));
        return null;
      }
    }

    const result = GeneratedPostSchema.safeParse(parsed);
    if (!result.success) {
      console.error('[PostGenerator] Invalid post structure:', result.error.errors);
      return null;
    }

    console.log(`[PostGenerator] Generated post: ${result.data.content.substring(0, 50)}...`);
    return result.data;
  } catch (error: any) {
    console.error('[PostGenerator] Error generating post:', error?.message || error);
    return null;
  }
}

/**
 * Generate multiple posts from a list of topics
 */
export async function generatePostsFromTopics(
  topics: TrendingTopic[],
  maxPosts: number = 3
): Promise<Array<{ topic: TrendingTopic; post: GeneratedPost }>> {
  const results: Array<{ topic: TrendingTopic; post: GeneratedPost }> = [];

  for (const topic of topics) {
    if (results.length >= maxPosts) break;

    const post = await generatePostFromTopic(topic);
    if (post) {
      results.push({ topic, post });
    }

    // Small delay between API calls
    if (results.length < maxPosts && topics.indexOf(topic) < topics.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
