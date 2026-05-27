#!/usr/bin/env python3
"""
Image Generator for Indigo Foundry branded social media posts.
Generates images with text overlay and uploads to imgbb.

Usage:
    python generate_image.py "Your headline text" --theme indigo --output image.png
    python generate_image.py "Your headline text" --upload --api-key YOUR_IMGBB_KEY
"""

import argparse
import base64
import io
import os
import sys
import requests

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow not installed. Run: pip install Pillow requests")
    sys.exit(1)

# Brand colors for Indigo Foundry
THEMES = {
    'indigo': {'bg': '#4F46E5', 'text': '#FFFFFF', 'accent': '#F59E0B'},
    'navy': {'bg': '#1E1B4B', 'text': '#FFFFFF', 'accent': '#818CF8'},
    'teal': {'bg': '#0F766E', 'text': '#FFFFFF', 'accent': '#F59E0B'},
    'coral': {'bg': '#EA580C', 'text': '#FFFFFF', 'accent': '#1E1B4B'},
    'slate': {'bg': '#1E293B', 'text': '#FFFFFF', 'accent': '#14B8A6'},
    'purple': {'bg': '#7C3AED', 'text': '#FFFFFF', 'accent': '#FCD34D'},
}

# Image dimensions (Facebook recommended)
IMAGE_WIDTH = 1200
IMAGE_HEIGHT = 630
MARGIN = 60


def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_font(size):
    """Get Chinese-compatible font"""
    font_paths = [
        # macOS
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Medium.ttc',
        '/Library/Fonts/Arial Unicode.ttf',
        # Linux
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc',
        # Windows
        'C:\\Windows\\Fonts\\msjh.ttc',
        'C:\\Windows\\Fonts\\msyh.ttc',
    ]

    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue

    print("Warning: No Chinese font found, using default")
    return ImageFont.load_default()


def wrap_text(draw, text, font, max_width):
    """Wrap text to fit within max_width"""
    lines = []
    current_line = ""

    for char in text:
        test_line = current_line + char
        bbox = draw.textbbox((0, 0), test_line, font=font)
        width = bbox[2] - bbox[0]

        if width <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = char

    if current_line:
        lines.append(current_line)

    return lines


def draw_decorations(draw, colors):
    """Draw decorative corner accents"""
    accent = hex_to_rgb(colors['accent'])

    # Top-left corner
    draw.line([(MARGIN, MARGIN), (MARGIN + 100, MARGIN)], fill=accent, width=3)
    draw.line([(MARGIN, MARGIN), (MARGIN, MARGIN + 100)], fill=accent, width=3)

    # Bottom-right corner
    draw.line([(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN),
               (IMAGE_WIDTH - MARGIN - 100, IMAGE_HEIGHT - MARGIN)], fill=accent, width=3)
    draw.line([(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN),
               (IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN - 100)], fill=accent, width=3)


def generate_image(headline, theme='indigo', hashtags=None, logo_url=None):
    """Generate a branded social media post image"""
    colors = THEMES.get(theme, THEMES['indigo'])

    # Create image
    img = Image.new('RGB', (IMAGE_WIDTH, IMAGE_HEIGHT), hex_to_rgb(colors['bg']))
    draw = ImageDraw.Draw(img)

    # Draw decorations
    draw_decorations(draw, colors)

    # Load fonts
    font_main = get_font(52)
    font_hashtag = get_font(24)

    # Draw headline (centered)
    text_color = hex_to_rgb(colors['text'])
    max_text_width = IMAGE_WIDTH - MARGIN * 2
    lines = wrap_text(draw, headline, font_main, max_text_width)

    line_height = 70
    total_height = len(lines) * line_height
    start_y = (IMAGE_HEIGHT * 0.45) - (total_height / 2)

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font_main)
        text_width = bbox[2] - bbox[0]
        x = (IMAGE_WIDTH - text_width) / 2
        y = start_y + (i * line_height)
        draw.text((x, y), line, font=font_main, fill=text_color)

    # Draw hashtags
    if hashtags:
        hashtag_text = '  '.join(f'#{tag}' for tag in hashtags)
        # Add slight transparency effect with lighter color
        hashtag_color = tuple(int(c * 0.8) for c in text_color)
        draw.text((MARGIN, IMAGE_HEIGHT - 50), hashtag_text, font=font_hashtag, fill=hashtag_color)

    # Draw logo
    if logo_url:
        try:
            response = requests.get(logo_url, timeout=10)
            logo = Image.open(io.BytesIO(response.content)).convert('RGBA')
            logo_size = 50
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)

            # Position at bottom-right
            logo_x = IMAGE_WIDTH - MARGIN - logo_size
            logo_y = IMAGE_HEIGHT - 50 - logo_size

            # Create a copy to paste with transparency
            img_rgba = img.convert('RGBA')
            img_rgba.paste(logo, (logo_x, logo_y), logo)
            img = img_rgba.convert('RGB')
        except Exception as e:
            print(f"Warning: Could not load logo: {e}")

    return img


def image_to_base64(img):
    """Convert PIL Image to base64 string"""
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', quality=95)
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def upload_to_imgbb(image_base64, api_key):
    """Upload image to imgbb and return public URL"""
    response = requests.post(
        'https://api.imgbb.com/1/upload',
        data={
            'key': api_key,
            'image': image_base64,
        },
        timeout=30
    )

    data = response.json()

    if not data.get('success'):
        raise Exception(f"imgbb upload failed: {data.get('error', {}).get('message', 'Unknown error')}")

    return data['data']['url']


def main():
    parser = argparse.ArgumentParser(description='Generate branded social media images')
    parser.add_argument('headline', help='Main headline text')
    parser.add_argument('--theme', choices=THEMES.keys(), default='indigo', help='Color theme')
    parser.add_argument('--hashtags', nargs='*', help='Hashtags to include')
    parser.add_argument('--logo', default='https://indigofoundry.app/favicon-512.png', help='Logo URL')
    parser.add_argument('--output', '-o', help='Output file path (PNG)')
    parser.add_argument('--upload', action='store_true', help='Upload to imgbb')
    parser.add_argument('--api-key', default=os.environ.get('IMGBB_API_KEY'), help='imgbb API key')

    args = parser.parse_args()

    # Generate image
    print(f"Generating image with theme: {args.theme}")
    img = generate_image(
        headline=args.headline,
        theme=args.theme,
        hashtags=args.hashtags,
        logo_url=args.logo
    )

    # Save to file if requested
    if args.output:
        img.save(args.output, 'PNG')
        print(f"Saved to: {args.output}")

    # Upload to imgbb if requested
    if args.upload:
        if not args.api_key:
            print("Error: --api-key required for upload")
            sys.exit(1)

        print("Uploading to imgbb...")
        image_base64 = image_to_base64(img)
        url = upload_to_imgbb(image_base64, args.api_key)
        print(f"Image URL: {url}")
        return url

    return None


if __name__ == '__main__':
    main()
