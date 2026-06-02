/**
 * Ayrshare API Integration
 * Simplified Facebook posting without dealing with Meta App Review
 *
 * Docs: https://www.ayrshare.com/docs/
 */

export interface AyrsharePostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY;
const AYRSHARE_BASE_URL = 'https://api.ayrshare.com/api';

/**
 * Post content to Facebook via Ayrshare
 */
export async function postToFacebook(
  content: string,
  options?: {
    scheduleDate?: Date;
    mediaUrls?: string[];
  }
): Promise<AyrsharePostResult> {
  if (!AYRSHARE_API_KEY) {
    throw new Error('AYRSHARE_API_KEY environment variable is required');
  }

  const body: Record<string, any> = {
    post: content,
    platforms: ['facebook'],
  };

  if (options?.scheduleDate) {
    body.scheduleDate = options.scheduleDate.toISOString();
  }

  if (options?.mediaUrls && options.mediaUrls.length > 0) {
    body.mediaUrls = options.mediaUrls;
  }

  try {
    const response = await fetch(`${AYRSHARE_BASE_URL}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Ayrshare] API error:', data);
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      };
    }

    // Ayrshare returns array of results per platform
    const fbResult = data.postIds?.find((p: any) => p.platform === 'facebook');

    return {
      success: true,
      postId: fbResult?.id || data.id,
      postUrl: fbResult?.postUrl,
    };
  } catch (error: any) {
    console.error('[Ayrshare] Request failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get post analytics from Ayrshare
 */
export async function getPostAnalytics(postId: string): Promise<any> {
  if (!AYRSHARE_API_KEY) {
    throw new Error('AYRSHARE_API_KEY environment variable is required');
  }

  try {
    const response = await fetch(`${AYRSHARE_BASE_URL}/analytics/post?id=${postId}`, {
      headers: {
        'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
      },
    });

    return await response.json();
  } catch (error) {
    console.error('[Ayrshare] Failed to get analytics:', error);
    return null;
  }
}

/**
 * Check Ayrshare connection status
 */
export async function checkConnection(): Promise<boolean> {
  if (!AYRSHARE_API_KEY) {
    return false;
  }

  try {
    const response = await fetch(`${AYRSHARE_BASE_URL}/user`, {
      headers: {
        'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
