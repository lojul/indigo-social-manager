/**
 * SerpAPI Google Trends Integration
 * Fetches trending topics from configurable regions with news context
 *
 * Adapted from CatPawVote - can be configured for different regions
 */

export interface TrendingTopic {
  title: string;
  category?: string;
  newsHeadlines: string[];
  trafficVolume?: string;
  region: string;
}

interface SerpApiCategory {
  id: number;
  name: string;
}

interface SerpApiTrendingSearch {
  query: string;
  search_volume?: number;
  increase_percentage?: number;
  categories?: SerpApiCategory[];
  news_page_token?: string;
}

interface SerpApiResponse {
  trending_searches?: SerpApiTrendingSearch[];
  error?: string;
}

interface SerpApiNewsResponse {
  news?: Array<{ title: string; source: string }>;
  error?: string;
}

const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

// Categories to skip (political, sensitive)
const BLOCKED_CATEGORIES = new Set([
  'Politics',
  'Law and Government',
  'Sensitive Subjects',
]);

/**
 * Fetch news headlines for a trending topic
 */
async function fetchNewsForTopic(newsPageToken: string): Promise<string[]> {
  if (!SERPAPI_API_KEY || !newsPageToken) return [];

  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_trends_news');
    url.searchParams.set('page_token', newsPageToken);
    url.searchParams.set('api_key', SERPAPI_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) return [];

    const data = await response.json() as SerpApiNewsResponse;
    if (data.error || !data.news) return [];

    return data.news
      .slice(0, 3)
      .map(n => n.title)
      .filter(t => t && t.length > 0);
  } catch (error) {
    console.error('[SerpAPI] Failed to fetch news:', error);
    return [];
  }
}

/**
 * Check if a topic has blocked categories
 */
function hasBlockedCategory(categories?: SerpApiCategory[]): boolean {
  if (!categories) return false;
  return categories.some(c => BLOCKED_CATEGORIES.has(c.name));
}

/**
 * Fetch trending topics from Google Trends via SerpAPI
 */
export async function fetchTrendingTopics(
  region: string = 'HK',
  limit: number = 10
): Promise<TrendingTopic[]> {
  if (!SERPAPI_API_KEY) {
    throw new Error('SERPAPI_API_KEY environment variable is required');
  }

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_trends_trending_now');
  url.searchParams.set('geo', region);
  url.searchParams.set('api_key', SERPAPI_API_KEY);

  console.log(`[SerpAPI] Fetching trending topics for region: ${region}`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SerpAPI request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as SerpApiResponse;

  if (data.error) {
    throw new Error(`SerpAPI error: ${data.error}`);
  }

  if (!data.trending_searches || !Array.isArray(data.trending_searches)) {
    console.warn('[SerpAPI] No trending searches found in response');
    return [];
  }

  // Filter out invalid and political topics
  const validTopics = data.trending_searches.filter((search): search is SerpApiTrendingSearch => {
    if (!search?.query || typeof search.query !== 'string') return false;
    if (hasBlockedCategory(search.categories)) {
      console.log(`[SerpAPI] Skipping political topic: ${search.query}`);
      return false;
    }
    return true;
  });

  // Fetch news context for each topic
  const topicsToProcess = validTopics.slice(0, limit);
  const topicsWithNews = await Promise.all(
    topicsToProcess.map(async (search) => {
      const newsHeadlines = search.news_page_token
        ? await fetchNewsForTopic(search.news_page_token)
        : [];

      return {
        title: search.query,
        category: search.categories?.[0]?.name,
        newsHeadlines,
        trafficVolume: search.search_volume?.toString(),
        region,
      };
    })
  );

  // Filter out topics with no news
  const topicsWithContext = topicsWithNews.filter(t => t.newsHeadlines.length > 0);

  console.log(`[SerpAPI] Found ${topicsWithContext.length} topics with news context`);
  return topicsWithContext;
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
        console.error(`[SerpAPI] Failed to fetch ${region} topics:`, err);
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
