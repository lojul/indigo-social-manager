"""
Indigo Foundry Social Media Manager
Streamlit app for managing Facebook posts with AI-generated images
"""

import streamlit as st
import requests
import base64
import io
import os
import json
import re
from datetime import datetime, timedelta

# Must be first Streamlit command
st.set_page_config(
    page_title="Indigo Foundry - Social Manager",
    page_icon="https://indigofoundry.app/favicon-512.png",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Try to load PIL
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    st.error("Pillow not installed. Run: pip install Pillow")

# Load environment variables (local dev)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ============================================================================
# Configuration
# ============================================================================

def get_secret(key, default=""):
    """Get secret from Streamlit Cloud or environment variable"""
    try:
        if key in st.secrets:
            return st.secrets[key]
    except Exception:
        pass
    return os.getenv(key, default)

BUFFER_API_URL = "https://api.buffer.com/rpc"
IMGBB_API_KEY = get_secret("IMGBB_API_KEY", "")
BUFFER_API_TOKEN = get_secret("BUFFER_API_TOKEN", "")
OPENROUTER_API_KEY = get_secret("OPENROUTER_API_KEY", "")
TAVILY_API_KEY = get_secret("TAVILY_API_KEY", "")

# Brand colors
THEMES = {
    'indigo': {'bg': '#4F46E5', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': 'Indigo'},
    'navy': {'bg': '#1E1B4B', 'text': '#FFFFFF', 'accent': '#818CF8', 'name': 'Navy'},
    'teal': {'bg': '#0F766E', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': 'Teal'},
    'coral': {'bg': '#EA580C', 'text': '#FFFFFF', 'accent': '#1E1B4B', 'name': 'Coral'},
    'slate': {'bg': '#1E293B', 'text': '#FFFFFF', 'accent': '#14B8A6', 'name': 'Slate'},
    'purple': {'bg': '#7C3AED', 'text': '#FFFFFF', 'accent': '#FCD34D', 'name': 'Purple'},
}

IMAGE_WIDTH = 1200
IMAGE_HEIGHT = 630
MARGIN = 60

# ============================================================================
# Image Generation Functions
# ============================================================================

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_font(size):
    font_paths = [
        '/System/Library/Fonts/PingFang.ttc',
        '/System/Library/Fonts/STHeiti Medium.ttc',
        '/Library/Fonts/Arial Unicode.ttf',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc',
        'C:\\Windows\\Fonts\\msjh.ttc',
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue
    return ImageFont.load_default()


def wrap_text(draw, text, font, max_width):
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


def generate_image(headline, theme='indigo', hashtags=None, logo_url=None):
    if not PIL_AVAILABLE:
        return None

    colors = THEMES.get(theme, THEMES['indigo'])

    img = Image.new('RGB', (IMAGE_WIDTH, IMAGE_HEIGHT), hex_to_rgb(colors['bg']))
    draw = ImageDraw.Draw(img)

    # Draw corner accents
    accent = hex_to_rgb(colors['accent'])
    draw.line([(MARGIN, MARGIN), (MARGIN + 100, MARGIN)], fill=accent, width=3)
    draw.line([(MARGIN, MARGIN), (MARGIN, MARGIN + 100)], fill=accent, width=3)
    draw.line([(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN),
               (IMAGE_WIDTH - MARGIN - 100, IMAGE_HEIGHT - MARGIN)], fill=accent, width=3)
    draw.line([(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN),
               (IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN - 100)], fill=accent, width=3)

    # Draw headline
    font_main = get_font(52)
    font_hashtag = get_font(24)
    text_color = hex_to_rgb(colors['text'])

    lines = wrap_text(draw, headline, font_main, IMAGE_WIDTH - MARGIN * 2)
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
        hashtag_text = '  '.join(f'#{tag}' for tag in hashtags if tag.strip())
        if hashtag_text:
            draw.text((MARGIN, IMAGE_HEIGHT - 50), hashtag_text, font=font_hashtag, fill=text_color)

    # Draw logo
    if logo_url:
        try:
            response = requests.get(logo_url, timeout=10)
            logo = Image.open(io.BytesIO(response.content)).convert('RGBA')
            logo_size = 50
            logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
            logo_x = IMAGE_WIDTH - MARGIN - logo_size
            logo_y = IMAGE_HEIGHT - 50 - logo_size
            img_rgba = img.convert('RGBA')
            img_rgba.paste(logo, (logo_x, logo_y), logo)
            img = img_rgba.convert('RGB')
        except:
            pass

    return img


def image_to_base64(img):
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', quality=95)
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def upload_to_imgbb(image_base64, api_key):
    response = requests.post(
        'https://api.imgbb.com/1/upload',
        data={'key': api_key, 'image': image_base64},
        timeout=30
    )
    data = response.json()
    if not data.get('success'):
        raise Exception(f"Upload failed: {data.get('error', {}).get('message', 'Unknown')}")
    return data['data']['url']


# ============================================================================
# AI Content Generation
# ============================================================================

AI_SYSTEM_PROMPT = """你是青藍科技的社交媒體內容創作者。根據提供的主題創建Facebook貼文。

要求：
- 150-280字，繁體中文
- 專業但親切的語氣
- 結尾加入互動問題
- 聚焦於AI趨勢、Odoo ERP、數位轉型

請直接輸出貼文內容，不要加入任何前綴或說明。"""


def fetch_live_trends(category="AI"):
    """Fetch live trending topics using Tavily search API"""
    if not TAVILY_API_KEY:
        return None, "Please configure TAVILY_API_KEY in secrets"

    search_queries = {
        "AI": "AI artificial intelligence trends news 2026",
        "Odoo": "Odoo ERP news updates 2026",
        "Tech": "technology digital transformation trends 2026",
    }

    query = search_queries.get(category, search_queries["AI"])

    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "max_results": 8,
                "include_answer": False,
            },
            timeout=30
        )

        data = response.json()

        if 'error' in data:
            return None, f"Search error: {data['error']}"

        results = data.get('results', [])
        topics = []
        for r in results:
            content = r.get('content', '')
            topics.append({
                'title': r.get('title', ''),
                'summary': content[:180] + '...' if len(content) > 180 else content,
                'url': r.get('url', ''),
            })

        return topics, None

    except Exception as e:
        return None, f"Error: {str(e)}"


def generate_ai_content(topic, api_key=None):
    """Generate post content using OpenRouter API"""
    api_key = api_key or OPENROUTER_API_KEY
    if not api_key:
        return None, "OpenRouter API key not configured"

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemini-2.0-flash-001",
                "messages": [
                    {"role": "system", "content": AI_SYSTEM_PROMPT},
                    {"role": "user", "content": f"主題：{topic}"}
                ],
                "temperature": 0.8,
                "max_tokens": 500,
            },
            timeout=30
        )

        data = response.json()

        if 'error' in data:
            return None, f"API Error: {data['error'].get('message', 'Unknown error')}"

        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        if content:
            return content.strip(), None
        return None, "Empty response from AI"

    except Exception as e:
        return None, f"Error: {str(e)}"


# ============================================================================
# Buffer API Functions
# ============================================================================

def buffer_request(query, variables=None, token=None):
    token = token or BUFFER_API_TOKEN
    if not token:
        return None

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }

    payload = {'query': query}
    if variables:
        payload['variables'] = variables

    response = requests.post(BUFFER_API_URL, headers=headers, json=payload, timeout=30)
    return response.json()


def get_organization_id(token=None):
    query = """
    query GetAccount {
        account {
            id
            organizations {
                id
                name
            }
        }
    }
    """
    result = buffer_request(query, token=token)
    if result and 'data' in result:
        orgs = result['data'].get('account', {}).get('organizations', [])
        if orgs:
            return orgs[0]['id']
    return None


def get_channels(token=None):
    org_id = get_organization_id(token)
    if not org_id:
        return []

    query = """
    query GetChannels($input: ChannelsInput!) {
        channels(input: $input) {
            id
            name
            service
            avatar
        }
    }
    """
    variables = {'input': {'organizationId': org_id}}
    result = buffer_request(query, variables, token=token)
    if result and 'data' in result:
        return result.get('data', {}).get('channels', [])
    return []


def get_posts(channel_id, token=None):
    query = """
    query GetPosts($input: PostsInput!) {
        posts(input: $input) {
            edges {
                node {
                    id
                    text
                    status
                    dueAt
                    assets {
                        images {
                            url
                        }
                    }
                }
            }
        }
    }
    """
    variables = {
        'input': {
            'channelId': channel_id,
            'status': ['scheduled', 'draft'],
            'first': 20
        }
    }
    result = buffer_request(query, variables, token=token)
    if result and 'data' in result:
        edges = result['data'].get('posts', {}).get('edges', [])
        return [edge['node'] for edge in edges]
    return []


def create_buffer_post(channel_id, text, image_url=None, token=None):
    mutation = """
    mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
            __typename
            ... on PostActionSuccess {
                post {
                    id
                    status
                }
            }
            ... on UnexpectedError {
                message
            }
        }
    }
    """

    post_input = {
        'channelId': channel_id,
        'schedulingType': 'automatic',
        'mode': 'addToQueue',
        'text': text,
        'metadata': {'facebook': {'type': 'post'}}
    }

    if image_url:
        post_input['assets'] = {'images': [{'url': image_url}]}

    result = buffer_request(mutation, {'input': post_input}, token=token)
    return result


# ============================================================================
# Streamlit UI
# ============================================================================

def main():
    # Sidebar
    with st.sidebar:
        st.image("https://indigofoundry.app/favicon-512.png", width=80)
        st.title("Indigo Foundry")
        st.caption("Social Media Manager")

        st.divider()

        buffer_token = BUFFER_API_TOKEN
        selected_channel_id = None

        if buffer_token:
            try:
                channels = get_channels(buffer_token)
                if channels:
                    st.success(f"Connected ({len(channels)} channels)")
                    channel_options = {c['name']: c['id'] for c in channels}
                    selected_channel_name = st.selectbox("Select Channel", options=list(channel_options.keys()))
                    selected_channel_id = channel_options.get(selected_channel_name)
                else:
                    st.warning("No channels found")
            except Exception as e:
                st.error(f"Buffer API error: {str(e)}")
        else:
            st.error("Buffer token not configured")

        st.divider()

        page = st.radio(
            "Navigation",
            ["Search Trends", "Create Post", "Post Queue"],
            label_visibility="collapsed"
        )

    # Main content
    if page == "Search Trends":
        render_search_trends()
    elif page == "Create Post":
        render_create_post(buffer_token, selected_channel_id)
    elif page == "Post Queue":
        render_post_queue(buffer_token, selected_channel_id)


def render_search_trends():
    st.header("Search Trends")
    st.caption("Search for trending topics and generate posts with AI")

    # Search section
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("AI Trends", type="primary", use_container_width=True):
            search_and_display("AI")

    with col2:
        if st.button("Odoo News", type="primary", use_container_width=True):
            search_and_display("Odoo")

    with col3:
        if st.button("Tech Trends", type="primary", use_container_width=True):
            search_and_display("Tech")

    st.divider()

    # Results
    if 'search_results' in st.session_state and st.session_state['search_results']:
        st.subheader("Search Results")

        for i, topic in enumerate(st.session_state['search_results']):
            with st.container():
                col_a, col_b = st.columns([4, 1])

                with col_a:
                    st.markdown(f"**{topic.get('title', '')}**")
                    st.caption(topic.get('summary', ''))

                with col_b:
                    if st.button("Select", key=f"select_{i}", use_container_width=True):
                        st.session_state['selected_topic_title'] = topic.get('title', '')
                        st.session_state['selected_topic_summary'] = topic.get('summary', '')
                        st.info("Topic selected. Go to Create Post to generate content.")

                st.divider()
    else:
        st.info("Click a button above to search for trending topics")


def search_and_display(category):
    with st.spinner(f"Searching {category} trends..."):
        topics, error = fetch_live_trends(category)

        if error:
            st.error(error)
            return

        if topics:
            st.session_state['search_results'] = topics
            st.rerun()
        else:
            st.warning("No results found")


def render_create_post(buffer_token, channel_id):
    st.header("Create Post")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("Content")

        # Show selected topic if any
        selected_title = st.session_state.get('selected_topic_title', '')
        selected_summary = st.session_state.get('selected_topic_summary', '')

        if selected_title:
            st.info(f"Selected: {selected_title}")

            if st.button("Generate Post with AI", type="primary", use_container_width=True):
                with st.spinner("Generating..."):
                    topic_text = f"{selected_title}\n{selected_summary}"
                    content, error = generate_ai_content(topic_text)
                    if content:
                        st.session_state['generated_text'] = content
                        st.rerun()
                    else:
                        st.error(error or "Generation failed")

        # Manual input
        with st.expander("Manual Topic Input"):
            manual_topic = st.text_input("Enter topic", placeholder="e.g., AI trends in enterprise")
            if st.button("Generate", use_container_width=True):
                if manual_topic:
                    with st.spinner("Generating..."):
                        content, error = generate_ai_content(manual_topic)
                        if content:
                            st.session_state['generated_text'] = content
                            st.rerun()
                        else:
                            st.error(error)

        # Post text
        default_text = st.session_state.get('generated_text', '')
        post_text = st.text_area(
            "Post Text",
            value=default_text,
            height=180,
            placeholder="Enter post content or generate with AI..."
        )

        # Image settings
        st.subheader("Image Settings")

        use_custom_headline = st.checkbox("Custom image headline")
        if use_custom_headline:
            image_headline = st.text_input("Image Headline", value=post_text[:50] if post_text else "")
        else:
            image_headline = post_text.split('\n')[0][:80] if post_text else ""

        theme_options = {v['name']: k for k, v in THEMES.items()}
        selected_theme_name = st.selectbox("Color Theme", options=list(theme_options.keys()))
        selected_theme = theme_options[selected_theme_name]

        colors = THEMES[selected_theme]
        st.markdown(
            f"""<div style="display:flex; gap:10px; margin:10px 0;">
                <div style="width:30px;height:30px;background:{colors['bg']};border-radius:4px;border:1px solid #ddd;"></div>
                <div style="width:30px;height:30px;background:{colors['accent']};border-radius:4px;border:1px solid #ddd;"></div>
            </div>""",
            unsafe_allow_html=True
        )

        hashtags_input = st.text_input("Hashtags (comma separated)", value="AI, DigitalTransformation, IndigoFoundry")
        hashtags = [tag.strip() for tag in hashtags_input.split(',') if tag.strip()]

        generate_clicked = st.button("Generate Preview", type="primary", use_container_width=True)

    with col2:
        st.subheader("Preview")

        if generate_clicked and image_headline:
            with st.spinner("Generating image..."):
                img = generate_image(
                    headline=image_headline,
                    theme=selected_theme,
                    hashtags=hashtags,
                    logo_url="https://indigofoundry.app/favicon-512.png"
                )

                if img:
                    st.session_state['preview_image'] = img
                    st.session_state['post_text'] = post_text

        if 'preview_image' in st.session_state:
            st.image(st.session_state['preview_image'], use_container_width=True)

            st.divider()

            col_a, col_b = st.columns(2)

            with col_a:
                if st.button("Post to Buffer", type="primary", use_container_width=True):
                    if not buffer_token or not channel_id:
                        st.error("Please connect Buffer and select a channel")
                    elif not st.session_state.get('post_text'):
                        st.error("Please enter post text")
                    else:
                        with st.spinner("Publishing..."):
                            try:
                                img_base64 = image_to_base64(st.session_state['preview_image'])
                                image_url = upload_to_imgbb(img_base64, IMGBB_API_KEY)

                                result = create_buffer_post(
                                    channel_id=channel_id,
                                    text=st.session_state['post_text'],
                                    image_url=image_url,
                                    token=buffer_token
                                )

                                if result and 'data' in result:
                                    post_result = result['data'].get('createPost', {})
                                    if post_result.get('__typename') == 'PostActionSuccess':
                                        st.success("Post added to Buffer queue")
                                    else:
                                        st.error(f"Error: {post_result.get('message', 'Unknown error')}")
                                else:
                                    st.error("Failed to create post")
                            except Exception as e:
                                st.error(f"Error: {str(e)}")

            with col_b:
                if st.button("Clear", use_container_width=True):
                    for key in ['preview_image', 'post_text', 'generated_text', 'selected_topic_title', 'selected_topic_summary']:
                        if key in st.session_state:
                            del st.session_state[key]
                    st.rerun()
        else:
            st.info("Enter content and click Generate Preview")


def render_post_queue(buffer_token, channel_id):
    st.header("Post Queue")

    if not buffer_token or not channel_id:
        st.warning("Connect Buffer and select a channel to view queue")
        return

    if st.button("Refresh", use_container_width=False):
        st.rerun()

    with st.spinner("Loading..."):
        posts = get_posts(channel_id, buffer_token)

    if not posts:
        st.info("No scheduled posts")
        return

    for post in posts:
        with st.container():
            col1, col2 = st.columns([3, 1])

            with col1:
                text = post.get('text', '')[:200]
                if len(post.get('text', '')) > 200:
                    text += '...'
                st.markdown(f"**{text}**")

                due_at = post.get('dueAt')
                if due_at:
                    st.caption(f"Scheduled: {due_at}")

                status = post.get('status', 'unknown')
                st.caption(f"Status: {status}")

            with col2:
                images = post.get('assets', {}).get('images', [])
                if images:
                    st.image(images[0]['url'], width=100)

            st.divider()


if __name__ == "__main__":
    main()
