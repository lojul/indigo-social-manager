/**
 * Buffer API Integration
 * Post to Facebook via Buffer's Publish API
 *
 * Docs: https://buffer.com/developers/api
 */

export interface BufferPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export interface BufferProfile {
  id: string;
  service: string;
  formatted_username: string;
}

const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN;
const BUFFER_PROFILE_ID = process.env.BUFFER_PROFILE_ID;
const BUFFER_BASE_URL = 'https://api.bufferapp.com/1';

/**
 * Post content to Facebook via Buffer
 */
export async function postToFacebook(
  content: string,
  options?: {
    scheduleDate?: Date;
    mediaUrl?: string;
  }
): Promise<BufferPostResult> {
  if (!BUFFER_ACCESS_TOKEN) {
    throw new Error('BUFFER_ACCESS_TOKEN environment variable is required');
  }
  if (!BUFFER_PROFILE_ID) {
    throw new Error('BUFFER_PROFILE_ID environment variable is required');
  }

  const formData = new URLSearchParams();
  formData.append('access_token', BUFFER_ACCESS_TOKEN);
  formData.append('profile_ids[]', BUFFER_PROFILE_ID);
  formData.append('text', content);

  if (options?.scheduleDate) {
    formData.append('scheduled_at', Math.floor(options.scheduleDate.getTime() / 1000).toString());
  } else {
    // Post immediately by adding to queue with "now" parameter
    formData.append('now', 'true');
  }

  if (options?.mediaUrl) {
    formData.append('media[link]', options.mediaUrl);
  }

  try {
    const response = await fetch(`${BUFFER_BASE_URL}/updates/create.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[Buffer] API error:', data);
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      postId: data.updates?.[0]?.id || data.update?.id,
    };
  } catch (error: any) {
    console.error('[Buffer] Request failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get all connected profiles from Buffer
 * Use this to find your BUFFER_PROFILE_ID
 */
export async function getProfiles(): Promise<BufferProfile[]> {
  if (!BUFFER_ACCESS_TOKEN) {
    throw new Error('BUFFER_ACCESS_TOKEN environment variable is required');
  }

  try {
    const response = await fetch(
      `${BUFFER_BASE_URL}/profiles.json?access_token=${BUFFER_ACCESS_TOKEN}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Buffer] Failed to get profiles:', data);
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      service: p.service,
      formatted_username: p.formatted_username,
    }));
  } catch (error) {
    console.error('[Buffer] Failed to get profiles:', error);
    return [];
  }
}

/**
 * Check Buffer connection status
 */
export async function checkConnection(): Promise<boolean> {
  if (!BUFFER_ACCESS_TOKEN) {
    return false;
  }

  try {
    const response = await fetch(
      `${BUFFER_BASE_URL}/user.json?access_token=${BUFFER_ACCESS_TOKEN}`
    );

    return response.ok;
  } catch {
    return false;
  }
}
