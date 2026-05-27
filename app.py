"""
Indigo Foundry Social Media Manager
"""

import streamlit as st
import requests
import base64
import io
import os
import json
from datetime import datetime

# Page config
st.set_page_config(
    page_title="Social Media Manager | Indigo Foundry",
    page_icon="https://indigofoundry.app/favicon-512.png",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Buffer-like design
st.markdown("""
<style>
    /* Main background */
    .stApp {
        background-color: #FAFAFA;
    }

    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background-color: #FFFFFF;
        border-right: 1px solid #E5E7EB;
    }

    [data-testid="stSidebar"] .stRadio > label {
        font-size: 14px;
        color: #374151;
    }

    /* Cards */
    .card {
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
    }

    .card-header {
        font-size: 14px;
        font-weight: 500;
        color: #6B7280;
        margin-bottom: 8px;
    }

    .card-value {
        font-size: 28px;
        font-weight: 600;
        color: #111827;
    }

    /* Section headers */
    .section-header {
        font-size: 11px;
        font-weight: 600;
        color: #9CA3AF;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 24px 0 12px 0;
    }

    /* Topic cards */
    .topic-card {
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 16px 20px;
        margin-bottom: 12px;
        transition: border-color 0.2s;
    }

    .topic-card:hover {
        border-color: #4F46E5;
    }

    .topic-title {
        font-size: 15px;
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
    }

    .topic-summary {
        font-size: 13px;
        color: #6B7280;
        line-height: 1.5;
    }

    /* Buttons */
    .stButton > button {
        border-radius: 6px;
        font-weight: 500;
        font-size: 14px;
    }

    /* Hide default streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}

    /* Tab styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0;
        border-bottom: 1px solid #E5E7EB;
    }

    .stTabs [data-baseweb="tab"] {
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 500;
    }

    /* Form inputs */
    .stTextInput input, .stTextArea textarea, .stSelectbox select {
        border-radius: 6px;
        border-color: #E5E7EB;
    }

    /* Success/error messages */
    .stSuccess, .stError, .stWarning, .stInfo {
        border-radius: 6px;
    }
</style>
""", unsafe_allow_html=True)

# Load PIL
try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Load env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ============================================================================
# Configuration
# ============================================================================

def get_secret(key, default=""):
    try:
        if key in st.secrets:
            return st.secrets[key]
    except:
        pass
    return os.getenv(key, default)

BUFFER_API_URL = "https://api.buffer.com/rpc"
IMGBB_API_KEY = get_secret("IMGBB_API_KEY", "")
BUFFER_API_TOKEN = get_secret("BUFFER_API_TOKEN", "")
OPENROUTER_API_KEY = get_secret("OPENROUTER_API_KEY", "")
TAVILY_API_KEY = get_secret("TAVILY_API_KEY", "")

THEMES = {
    'indigo': {'bg': '#4F46E5', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': 'Indigo'},
    'navy': {'bg': '#1E1B4B', 'text': '#FFFFFF', 'accent': '#818CF8', 'name': 'Navy'},
    'teal': {'bg': '#0F766E', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': 'Teal'},
    'slate': {'bg': '#1E293B', 'text': '#FFFFFF', 'accent': '#14B8A6', 'name': 'Slate'},
    'purple': {'bg': '#7C3AED', 'text': '#FFFFFF', 'accent': '#FCD34D', 'name': 'Purple'},
}

IMAGE_WIDTH = 1200
IMAGE_HEIGHT = 630
MARGIN = 60

# ============================================================================
# Image Generation
# ============================================================================

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def get_font(size):
    font_paths = [
        '/System/Library/Fonts/PingFang.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
        '/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc',
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue
    return ImageFont.load_default()

def wrap_text(draw, text, font, max_width):
    lines, current_line = [], ""
    for char in text:
        test_line = current_line + char
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
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

    accent = hex_to_rgb(colors['accent'])
    draw.line([(MARGIN, MARGIN), (MARGIN + 100, MARGIN)], fill=accent, width=3)
    draw.line([(MARGIN, MARGIN), (MARGIN, MARGIN + 100)], fill=accent, width=3)
    draw.line([(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN), (IMAGE_WIDTH - MARGIN - 100, IMAGE_HEIGHT - MARGIN)], fill=accent, width=3)
    draw.line([(IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN), (IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT - MARGIN - 100)], fill=accent, width=3)

    font_main = get_font(52)
    font_hashtag = get_font(24)
    text_color = hex_to_rgb(colors['text'])

    lines = wrap_text(draw, headline, font_main, IMAGE_WIDTH - MARGIN * 2)
    line_height = 70
    start_y = (IMAGE_HEIGHT * 0.45) - (len(lines) * line_height / 2)

    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font_main)
        x = (IMAGE_WIDTH - (bbox[2] - bbox[0])) / 2
        draw.text((x, start_y + i * line_height), line, font=font_main, fill=text_color)

    if hashtags:
        hashtag_text = '  '.join(f'#{tag}' for tag in hashtags if tag.strip())
        if hashtag_text:
            draw.text((MARGIN, IMAGE_HEIGHT - 50), hashtag_text, font=font_hashtag, fill=text_color)

    if logo_url:
        try:
            response = requests.get(logo_url, timeout=10)
            logo = Image.open(io.BytesIO(response.content)).convert('RGBA')
            logo.thumbnail((50, 50), Image.LANCZOS)
            img_rgba = img.convert('RGBA')
            img_rgba.paste(logo, (IMAGE_WIDTH - MARGIN - 50, IMAGE_HEIGHT - 100), logo)
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
    response = requests.post('https://api.imgbb.com/1/upload', data={'key': api_key, 'image': image_base64}, timeout=30)
    data = response.json()
    if not data.get('success'):
        raise Exception(f"Upload failed: {data.get('error', {}).get('message', 'Unknown')}")
    return data['data']['url']

# ============================================================================
# AI & Search
# ============================================================================

def fetch_live_trends(category="AI"):
    if not TAVILY_API_KEY:
        return None, "TAVILY_API_KEY not configured"

    queries = {
        "AI": "AI artificial intelligence trends news 2026",
        "Odoo": "Odoo ERP news updates 2026",
        "Tech": "technology digital transformation trends 2026",
    }

    try:
        response = requests.post("https://api.tavily.com/search", json={
            "api_key": TAVILY_API_KEY,
            "query": queries.get(category, queries["AI"]),
            "search_depth": "basic",
            "max_results": 8,
        }, timeout=30)
        data = response.json()
        if 'error' in data:
            return None, f"Search error: {data['error']}"

        results = data.get('results', [])
        return [{'title': r.get('title', ''), 'summary': r.get('content', '')[:180], 'url': r.get('url', '')} for r in results], None
    except Exception as e:
        return None, str(e)

def generate_ai_content(topic):
    if not OPENROUTER_API_KEY:
        return None, "OPENROUTER_API_KEY not configured"

    # Clean the topic text - remove URLs and special characters
    clean_topic = topic.replace('http://', '').replace('https://', '')
    clean_topic = ' '.join(clean_topic.split()[:50])  # Limit length

    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://indigofoundry.app",
            "X-Title": "Indigo Social Manager",
        }, json={
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "messages": [
                {"role": "system", "content": "You are a social media content creator for a tech company. Write engaging Facebook posts in Traditional Chinese (繁體中文). Keep it professional, 150-250 characters, end with a question. Output only the post content."},
                {"role": "user", "content": f"Write a Facebook post about: {clean_topic}"}
            ],
            "temperature": 0.7,
            "max_tokens": 400,
        }, timeout=30)

        data = response.json()
        if 'error' in data:
            error_msg = data['error'].get('message', 'API Error')
            # Try fallback model
            return try_fallback_model(clean_topic)

        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        return content.strip() if content else None, None
    except Exception as e:
        return None, str(e)


def try_fallback_model(topic):
    """Fallback to a different model if primary fails"""
    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }, json={
            "model": "mistralai/mistral-7b-instruct:free",
            "messages": [
                {"role": "user", "content": f"Write a short engaging Facebook post in Traditional Chinese about this topic. Keep it professional, around 150-200 characters, end with a question to engage readers:\n\nTopic: {topic}"}
            ],
            "temperature": 0.7,
            "max_tokens": 400,
        }, timeout=30)

        data = response.json()
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        return content.strip() if content else None, None
    except Exception as e:
        return None, str(e)

# ============================================================================
# Buffer API
# ============================================================================

def buffer_request(query, variables=None):
    if not BUFFER_API_TOKEN:
        return None
    response = requests.post(BUFFER_API_URL, headers={
        'Authorization': f'Bearer {BUFFER_API_TOKEN}',
        'Content-Type': 'application/json',
    }, json={'query': query, 'variables': variables or {}}, timeout=30)
    return response.json()

def get_channels():
    result = buffer_request("query { account { organizations { id } } }")
    if not result or 'data' not in result:
        return []
    orgs = result['data'].get('account', {}).get('organizations', [])
    if not orgs:
        return []

    org_id = orgs[0]['id']
    result = buffer_request("query($input: ChannelsInput!) { channels(input: $input) { id name service } }", {'input': {'organizationId': org_id}})
    return result.get('data', {}).get('channels', []) if result else []

def get_posts(channel_id):
    result = buffer_request(
        "query($input: PostsInput!) { posts(input: $input) { edges { node { id text status dueAt assets { images { url } } } } } }",
        {'input': {'channelId': channel_id, 'status': ['scheduled', 'draft'], 'first': 20}}
    )
    if result and 'data' in result:
        return [e['node'] for e in result['data'].get('posts', {}).get('edges', [])]
    return []

def create_post(channel_id, text, image_url=None):
    post_input = {
        'channelId': channel_id,
        'schedulingType': 'automatic',
        'mode': 'addToQueue',
        'text': text,
        'metadata': {'facebook': {'type': 'post'}}
    }
    if image_url:
        post_input['assets'] = {'images': [{'url': image_url}]}

    return buffer_request("""
        mutation($input: CreatePostInput!) {
            createPost(input: $input) {
                __typename
                ... on PostActionSuccess { post { id status } }
                ... on UnexpectedError { message }
            }
        }
    """, {'input': post_input})

# ============================================================================
# UI Components
# ============================================================================

def render_metric_card(label, value, subtext=""):
    st.markdown(f"""
    <div class="card">
        <div class="card-header">{label}</div>
        <div class="card-value">{value}</div>
        {f'<div style="font-size:12px;color:#9CA3AF;margin-top:4px;">{subtext}</div>' if subtext else ''}
    </div>
    """, unsafe_allow_html=True)

def render_topic_card(title, summary, index):
    col1, col2 = st.columns([5, 1])
    with col1:
        st.markdown(f"""
        <div class="topic-card">
            <div class="topic-title">{title}</div>
            <div class="topic-summary">{summary}</div>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        if st.button("Select", key=f"sel_{index}", use_container_width=True):
            st.session_state['selected_topic'] = {'title': title, 'summary': summary}
            st.success("Topic selected")

# ============================================================================
# Main App
# ============================================================================

def main():
    # Sidebar
    with st.sidebar:
        st.image("https://indigofoundry.app/favicon-512.png", width=40)
        st.markdown("### Indigo Foundry")
        st.caption("Social Media Manager")

        st.markdown('<div class="section-header">Channel</div>', unsafe_allow_html=True)

        channels = get_channels()
        if channels:
            channel_map = {c['name']: c['id'] for c in channels}
            selected = st.selectbox("", list(channel_map.keys()), label_visibility="collapsed")
            st.session_state['channel_id'] = channel_map.get(selected)
            st.success(f"Connected")
        else:
            st.warning("No channels")
            st.session_state['channel_id'] = None

        st.markdown('<div class="section-header">Navigation</div>', unsafe_allow_html=True)
        page = st.radio("", ["Search Trends", "Create Post", "Post Queue"], label_visibility="collapsed")

    # Main content
    st.markdown(f"## {page}")

    if page == "Search Trends":
        render_search_page()
    elif page == "Create Post":
        render_create_page()
    elif page == "Post Queue":
        render_queue_page()

def render_search_page():
    st.caption("Search for trending topics and select one to generate a post")

    # Search buttons
    col1, col2, col3, col4 = st.columns([1, 1, 1, 2])
    with col1:
        ai_btn = st.button("AI Trends", use_container_width=True)
    with col2:
        odoo_btn = st.button("Odoo News", use_container_width=True)
    with col3:
        tech_btn = st.button("Tech", use_container_width=True)

    if ai_btn:
        do_search("AI")
    elif odoo_btn:
        do_search("Odoo")
    elif tech_btn:
        do_search("Tech")

    st.divider()

    # Results
    if 'search_results' in st.session_state and st.session_state['search_results']:
        st.markdown("### Results")
        for i, topic in enumerate(st.session_state['search_results']):
            render_topic_card(topic['title'], topic['summary'], i)
    else:
        st.info("Click a button above to search")

def do_search(category):
    with st.spinner("Searching..."):
        results, error = fetch_live_trends(category)
        if error:
            st.error(error)
        elif results:
            st.session_state['search_results'] = results
            st.rerun()

def render_create_page():
    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown("### Content")

        # Selected topic
        topic = st.session_state.get('selected_topic')
        if topic:
            st.info(f"Selected: {topic['title']}")
            if st.button("Generate with AI", type="primary"):
                with st.spinner("Generating..."):
                    content, error = generate_ai_content(f"{topic['title']} - {topic['summary']}")
                    if content:
                        st.session_state['post_text'] = content
                        st.rerun()
                    else:
                        st.error(error or "Failed")

        # Manual input
        with st.expander("Manual Input"):
            manual = st.text_input("Topic")
            if st.button("Generate"):
                if manual:
                    with st.spinner("Generating..."):
                        content, error = generate_ai_content(manual)
                        if content:
                            st.session_state['post_text'] = content
                            st.rerun()
                        else:
                            st.error(error)

        # Post text
        post_text = st.text_area("Post Text", value=st.session_state.get('post_text', ''), height=180)

        st.markdown("### Image")
        headline = st.text_input("Headline", value=post_text.split('\n')[0][:60] if post_text else "")
        theme = st.selectbox("Theme", list(THEMES.keys()), format_func=lambda x: THEMES[x]['name'])
        hashtags = st.text_input("Hashtags", value="AI, IndigoFoundry")

        if st.button("Generate Preview", type="primary", use_container_width=True):
            if headline:
                img = generate_image(headline, theme, [h.strip() for h in hashtags.split(',')], "https://indigofoundry.app/favicon-512.png")
                if img:
                    st.session_state['preview'] = img
                    st.session_state['final_text'] = post_text

    with col2:
        st.markdown("### Preview")
        if 'preview' in st.session_state:
            st.image(st.session_state['preview'], use_container_width=True)

            if st.button("Post to Buffer", type="primary", use_container_width=True):
                channel_id = st.session_state.get('channel_id')
                if not channel_id:
                    st.error("Select a channel")
                elif not st.session_state.get('final_text'):
                    st.error("Enter post text")
                else:
                    with st.spinner("Publishing..."):
                        try:
                            img_b64 = image_to_base64(st.session_state['preview'])
                            img_url = upload_to_imgbb(img_b64, IMGBB_API_KEY)
                            result = create_post(channel_id, st.session_state['final_text'], img_url)

                            if result and result.get('data', {}).get('createPost', {}).get('__typename') == 'PostActionSuccess':
                                st.success("Posted to Buffer")
                            else:
                                st.error("Failed to post")
                        except Exception as e:
                            st.error(str(e))

            if st.button("Clear"):
                for k in ['preview', 'post_text', 'final_text', 'selected_topic']:
                    st.session_state.pop(k, None)
                st.rerun()
        else:
            st.caption("Generate a preview to see it here")

def render_queue_page():
    channel_id = st.session_state.get('channel_id')
    if not channel_id:
        st.warning("Select a channel first")
        return

    if st.button("Refresh"):
        st.rerun()

    posts = get_posts(channel_id)
    if not posts:
        st.info("No scheduled posts")
        return

    # Metrics
    col1, col2, col3 = st.columns(3)
    with col1:
        render_metric_card("Scheduled", len([p for p in posts if p.get('status') == 'scheduled']))
    with col2:
        render_metric_card("Drafts", len([p for p in posts if p.get('status') == 'draft']))
    with col3:
        render_metric_card("Total", len(posts))

    st.markdown("### Posts")
    for post in posts:
        with st.container():
            col1, col2 = st.columns([4, 1])
            with col1:
                text = post.get('text', '')[:150]
                st.markdown(f"**{text}{'...' if len(post.get('text', '')) > 150 else ''}**")
                st.caption(f"Status: {post.get('status', 'unknown')} | Due: {post.get('dueAt', 'N/A')}")
            with col2:
                images = post.get('assets', {}).get('images', [])
                if images:
                    st.image(images[0]['url'], width=80)
            st.divider()

if __name__ == "__main__":
    main()
