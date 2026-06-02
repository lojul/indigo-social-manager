/**
 * Tavily API Integration
 * Fetches trending topics/news from configurable regions
 *
 * Docs: https://docs.tavily.com/
 */

export interface TrendingTopic {
  title: string;
  category?: string;
  newsHeadlines: string[];
  trafficVolume?: string;
  region: string;
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  query: string;
}

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Region-specific search queries
const REGION_QUERIES: Record<string, string[]> = {
  HK: ['香港熱門話題', '香港trending news today', '香港最新熱搜'],
  TW: ['台灣熱門話題', '台灣trending news today', '台灣最新熱搜'],
  US: ['trending topics today', 'viral news today', 'what is trending now'],
};

// Keywords to filter out (political, sensitive)
const BLOCKED_KEYWORDS = [
  'politics', 'election', 'government', 'protest', 'war',
  '政治', '選舉', '政府', '抗議', '戰爭',
];

/**
 * Check if content contains blocked keywords
 */
function hasBlockedContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BLOCKED_KEYWORDS.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Extract topic title from news result
 */
function extractTopicTitle(result: TavilyResult): string {
  // Clean up the title - remove source names, dates, etc.
  let title = result.title
    .replace(/\s*[-|]\s*[^-|]+$/, '') // Remove trailing source name
    .replace(/^\d{4}[年/-]\d{1,2}[月/-]\d{1,2}[日]?\s*/, '') // Remove leading dates
    .trim();

  // Truncate if too long
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }

  return title;
}

/**
 * Fetch trending topics from Tavily search
 */
export async function fetchTrendingTopics(
  region: string = 'HK',
  limit: number = 10
): Promise<TrendingTopic[]> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY environment variable is required');
  }

  const queries = REGION_QUERIES[region] || REGION_QUERIES['US'];
  const topics: TrendingTopic[] = [];
  const seenTitles = new Set<string>();

  console.log(`[Tavily] Fetching trending topics for region: ${region}`);

  for (const query of queries) {
    if (topics.length >= limit) break;

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query,
          search_depth: 'basic',
          include_domains: [],
          exclude_domains: [],
          max_results: 10,
        }),
      });

      if (!response.ok) {
        console.error(`[Tavily] Search failed: ${response.status}`);
        continue;
      }

      const data: TavilyResponse = await response.json();

      for (const result of data.results) {
        if (topics.length >= limit) break;

        // Skip if blocked content
        if (hasBlockedContent(result.title) || hasBlockedContent(result.content)) {
          console.log(`[Tavily] Skipping sensitive topic: ${result.title.substring(0, 30)}...`);
          continue;
        }

        const title = extractTopicTitle(result);
        const normalizedTitle = title.toLowerCase();

        // Skip duplicates
        if (seenTitles.has(normalizedTitle)) continue;
        seenTitles.add(normalizedTitle);

        topics.push({
          title,
          newsHeadlines: [result.content.substring(0, 200)],
          region,
        });
      }
    } catch (error) {
      console.error(`[Tavily] Query failed for "${query}":`, error);
    }
  }

  console.log(`[Tavily] Found ${topics.length} topics for ${region}`);
  return topics;
}

/**
 * Fetch topics from multiple regions and deduplicate
 */
export async function fetchMultiRegionTopics(
  regions: string[] = ['HK', 'TW'],
  limit: number = 10
): Promise<TrendingTopic[]> {
  const allTopics = await Promise.all(
    regions.map(region =>
      fetchTrendingTopics(region, limit).catch(err => {
        console.error(`[Tavily] Failed to fetch ${region} topics:`, err);
        return [] as TrendingTopic[];
      })
    )
  );

  // Merge and deduplicate by title
  const seen = new Set<string>();
  const merged: TrendingTopic[] = [];

  for (const topics of allTopics) {
    for (const topic of topics) {
      if (!topic?.title) continue;
      const normalizedTitle = topic.title.toLowerCase().trim();
      if (!seen.has(normalizedTitle)) {
        seen.add(normalizedTitle);
        merged.push(topic);
      }
    }
  }

  return merged.slice(0, limit);
}
