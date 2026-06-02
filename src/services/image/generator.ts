/**
 * Image Generator for Indigo Foundry branded social media posts
 * Uses canvas to generate images with text overlay
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// Brand colors for Indigo Foundry
export const COLORS = {
  indigo: '#4F46E5',
  indigo_dark: '#3730A3',
  indigo_light: '#818CF8',
  navy: '#1E1B4B',
  slate: '#334155',
  white: '#FFFFFF',
  gold: '#F59E0B',
  teal: '#14B8A6',
  coral: '#F97316',
};

// Background color themes for variety
export const THEMES = {
  indigo: { bg: '#4F46E5', text: '#FFFFFF', accent: '#F59E0B' },
  navy: { bg: '#1E1B4B', text: '#FFFFFF', accent: '#818CF8' },
  teal: { bg: '#0F766E', text: '#FFFFFF', accent: '#F59E0B' },
  coral: { bg: '#EA580C', text: '#FFFFFF', accent: '#1E1B4B' },
  slate: { bg: '#1E293B', text: '#FFFFFF', accent: '#14B8A6' },
};

// Image dimensions (1200x630 for Facebook link preview, 1080x1080 for square)
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const MARGIN = 60;

export interface PostImageOptions {
  headline: string;
  subtext?: string;
  theme?: keyof typeof THEMES;
  hashtags?: string[];
  logoUrl?: string;
}

/**
 * Generate a branded social media post image
 */
export async function generatePostImage(options: PostImageOptions): Promise<Buffer> {
  const { headline, subtext, theme = 'indigo', hashtags = [] } = options;
  const colors = THEMES[theme];

  // Create canvas
  const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  // Draw decorative elements
  drawDecorations(ctx, colors);

  // Draw headline
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 52px "Noto Sans TC", "PingFang TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const wrappedLines = wrapText(ctx, headline, IMAGE_WIDTH - MARGIN * 2);
  const lineHeight = 70;
  const startY = IMAGE_HEIGHT * 0.4 - ((wrappedLines.length - 1) * lineHeight) / 2;

  wrappedLines.forEach((line, i) => {
    ctx.fillText(line, IMAGE_WIDTH / 2, startY + i * lineHeight);
  });

  // Draw subtext if provided
  if (subtext) {
    ctx.font = '32px "Noto Sans TC", "PingFang TC", sans-serif';
    ctx.fillStyle = colors.accent;
    const subtextY = startY + wrappedLines.length * lineHeight + 30;
    ctx.fillText(subtext, IMAGE_WIDTH / 2, subtextY);
  }

  // Draw hashtags at bottom
  if (hashtags.length > 0) {
    ctx.font = '24px "Noto Sans TC", "PingFang TC", sans-serif';
    ctx.fillStyle = `${colors.text}CC`; // 80% opacity
    ctx.textAlign = 'left';
    const hashtagText = hashtags.map(t => `#${t}`).join('  ');
    ctx.fillText(hashtagText, MARGIN, IMAGE_HEIGHT - 40);
  }

  // Draw logo
  try {
    const logoUrl = options.logoUrl || 'https://indigofoundry.app/favicon-512.png';
    const logo = await loadImage(logoUrl);
    const logoSize = 50;
    ctx.drawImage(logo, IMAGE_WIDTH - MARGIN - logoSize, IMAGE_HEIGHT - 40 - logoSize, logoSize, logoSize);
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  return canvas.toBuffer('image/png');
}

function drawDecorations(ctx: CanvasRenderingContext2D, colors: typeof THEMES['indigo']) {
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 3;

  // Top-left corner accent
  ctx.beginPath();
  ctx.moveTo(MARGIN, MARGIN);
  ctx.lineTo(MARGIN + 100, MARGIN);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(MARGIN, MARGIN);
  ctx.lineTo(MARGIN, MARGIN + 100);
  ctx.stroke();

  // Bottom-right corner accent
  ctx.beginPath();
  ctx.moveTo(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN);
  ctx.lineTo(IMAGE_WIDTH - MARGIN - 100, IMAGE_HEIGHT - MARGIN);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN);
  ctx.lineTo(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN - 100);
  ctx.stroke();

  // Subtle gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  gradient.addColorStop(0, 'rgba(255,255,255,0.05)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';

  // For Chinese text, split by character
  for (const char of text) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Upload image to imgbb and return public URL
 */
export async function uploadToImgbb(imageBuffer: Buffer, apiKey: string): Promise<string> {
  const base64 = imageBuffer.toString('base64');

  const formData = new URLSearchParams();
  formData.append('key', apiKey);
  formData.append('image', base64);

  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(`imgbb upload failed: ${data.error?.message || 'Unknown error'}`);
  }

  return data.data.url;
}

/**
 * Generate and upload a post image, returning the public URL
 */
export async function createPostImage(options: PostImageOptions, imgbbApiKey: string): Promise<string> {
  const imageBuffer = await generatePostImage(options);
  const imageUrl = await uploadToImgbb(imageBuffer, imgbbApiKey);
  return imageUrl;
}
