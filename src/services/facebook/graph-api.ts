/**
 * Facebook Graph API Direct Integration
 * For use after Meta App Review approval
 *
 * Requires:
 * - FACEBOOK_PAGE_ID
 * - FACEBOOK_PAGE_ACCESS_TOKEN
 *
 * Docs: https://developers.facebook.com/docs/pages-api/posts/
 */

export interface GraphApiPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Post content to Facebook Page via Graph API
 */
export async function postToFacebookDirect(
  content: string,
  options?: {
    scheduleDate?: Date;
    link?: string;
    photoUrl?: string;
  }
): Promise<GraphApiPostResult> {
  if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error('FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are required');
  }

  // If posting a photo, use /photos endpoint
  if (options?.photoUrl) {
    return postPhotoToFacebook(content, options.photoUrl, options.scheduleDate);
  }

  const body: Record<string, any> = {
    message: content,
    access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
  };

  // Add link if provided
  if (options?.link) {
    body.link = options.link;
  }

  // Schedule for later
  if (options?.scheduleDate) {
    body.published = false;
    body.scheduled_publish_time = Math.floor(options.scheduleDate.getTime() / 1000);
  }

  try {
    const response = await fetch(`${GRAPH_API_BASE}/${FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error('[GraphAPI] Error:', data.error);
      return {
        success: false,
        error: data.error.message,
      };
    }

    return {
      success: true,
      postId: data.id,
    };
  } catch (error: any) {
    console.error('[GraphAPI] Request failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Post a photo with caption to Facebook Page
 */
async function postPhotoToFacebook(
  caption: string,
  photoUrl: string,
  scheduleDate?: Date
): Promise<GraphApiPostResult> {
  const body: Record<string, any> = {
    url: photoUrl,
    caption: caption,
    access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
  };

  if (scheduleDate) {
    body.published = false;
    body.scheduled_publish_time = Math.floor(scheduleDate.getTime() / 1000);
  }

  try {
    const response = await fetch(`${GRAPH_API_BASE}/${FACEBOOK_PAGE_ID}/photos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error('[GraphAPI] Photo upload error:', data.error);
      return {
        success: false,
        error: data.error.message,
      };
    }

    return {
      success: true,
      postId: data.post_id || data.id,
    };
  } catch (error: any) {
    console.error('[GraphAPI] Photo upload failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify the Page Access Token is valid
 */
export async function verifyToken(): Promise<{
  valid: boolean;
  pageName?: string;
  error?: string;
}> {
  if (!FACEBOOK_PAGE_ACCESS_TOKEN) {
    return { valid: false, error: 'No token configured' };
  }

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/me?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
    );

    const data = await response.json();

    if (data.error) {
      return { valid: false, error: data.error.message };
    }

    return { valid: true, pageName: data.name };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get insights for a post
 */
export async function getPostInsights(postId: string): Promise<any> {
  if (!FACEBOOK_PAGE_ACCESS_TOKEN) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN is required');
  }

  try {
    const metrics = 'post_impressions,post_engaged_users,post_reactions_by_type_total';
    const response = await fetch(
      `${GRAPH_API_BASE}/${postId}/insights?metric=${metrics}&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`
    );

    return await response.json();
  } catch (error) {
    console.error('[GraphAPI] Failed to get insights:', error);
    return null;
  }
}
