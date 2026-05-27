"""
Indigo Foundry Social Media Manager
Single-page workflow with stepper
"""

import streamlit as st
import requests
import base64
import io
import os
from datetime import datetime

st.set_page_config(
    page_title="Social Media Manager | Indigo Foundry",
    page_icon="https://indigofoundry.app/favicon-512.png",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS
st.markdown("""
<style>
    .stApp { background-color: #FAFAFA; }
    #MainMenu, footer, header {visibility: hidden;}

    /* Stepper */
    .stepper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px 0 30px 0;
        gap: 0;
    }
    .step {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .step-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
    }
    .step-active .step-circle {
        background: #4F46E5;
        color: white;
    }
    .step-completed .step-circle {
        background: #10B981;
        color: white;
    }
    .step-inactive .step-circle {
        background: #E5E7EB;
        color: #9CA3AF;
    }
    .step-label {
        font-size: 13px;
        font-weight: 500;
    }
    .step-active .step-label { color: #4F46E5; }
    .step-completed .step-label { color: #10B981; }
    .step-inactive .step-label { color: #9CA3AF; }
    .step-arrow {
        color: #D1D5DB;
        margin: 0 16px;
        font-size: 18px;
    }

    /* Cards */
    .card {
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 16px;
    }
    .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 16px;
    }

    /* Topic cards */
    .topic-item {
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .topic-item:hover {
        border-color: #4F46E5;
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1);
    }
    .topic-title {
        font-size: 14px;
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
    }
    .topic-summary {
        font-size: 13px;
        color: #6B7280;
        line-height: 1.4;
    }

    /* Header */
    .app-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 0;
        border-bottom: 1px solid #E5E7EB;
        margin-bottom: 20px;
    }
    .app-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
    }

    /* Section */
    .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
    }

    .stButton > button { border-radius: 8px; }
    .stTextArea textarea, .stTextInput input, .stSelectbox select { border-radius: 8px; }
</style>
""", unsafe_allow_html=True)

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ============================================================================
# Config
# ============================================================================

def get_secret(key, default=""):
    try:
        if key in st.secrets:
            return st.secrets[key]
    except:
        pass
    return os.getenv(key, default)

IMGBB_API_KEY = get_secret("IMGBB_API_KEY", "")
BUFFER_API_TOKEN = get_secret("BUFFER_API_TOKEN", "")
TAVILY_API_KEY = get_secret("TAVILY_API_KEY", "")

THEMES = {
    'indigo': {'bg': '#4F46E5', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': 'Indigo'},
    'navy': {'bg': '#1E1B4B', 'text': '#FFFFFF', 'accent': '#818CF8', 'name': 'Navy'},
    'teal': {'bg': '#0F766E', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': 'Teal'},
    'slate': {'bg': '#1E293B', 'text': '#FFFFFF', 'accent': '#14B8A6', 'name': 'Slate'},
}

# ============================================================================
# Image Generation
# ============================================================================

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def get_font(size):
    paths = ['/System/Library/Fonts/PingFang.ttc', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', '/usr/share/fonts/noto-cjk/NotoSansCJK-Bold.ttc']
    for p in paths:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except: continue
    return ImageFont.load_default()

def wrap_text(draw, text, font, max_width):
    lines, line = [], ""
    for char in text:
        test = line + char
        if draw.textbbox((0,0), test, font=font)[2] <= max_width:
            line = test
        else:
            if line: lines.append(line)
            line = char
    if line: lines.append(line)
    return lines

def generate_image(headline, theme='indigo', hashtags=None):
    if not PIL_AVAILABLE: return None
    W, H, M = 1200, 630, 60
    colors = THEMES.get(theme, THEMES['indigo'])
    img = Image.new('RGB', (W, H), hex_to_rgb(colors['bg']))
    draw = ImageDraw.Draw(img)

    accent = hex_to_rgb(colors['accent'])
    draw.line([(M, M), (M+100, M)], fill=accent, width=3)
    draw.line([(M, M), (M, M+100)], fill=accent, width=3)
    draw.line([(W-M, H-M), (W-M-100, H-M)], fill=accent, width=3)
    draw.line([(W-M, H-M), (W-M, H-M-100)], fill=accent, width=3)

    font = get_font(52)
    text_color = hex_to_rgb(colors['text'])
    lines = wrap_text(draw, headline, font, W - M*2)
    lh = 70
    y = (H * 0.45) - (len(lines) * lh / 2)
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0,0), line, font=font)
        draw.text(((W - (bbox[2]-bbox[0]))/2, y + i*lh), line, font=font, fill=text_color)

    if hashtags:
        ht = '  '.join(f'#{t}' for t in hashtags if t.strip())
        draw.text((M, H-50), ht, font=get_font(24), fill=text_color)

    try:
        logo = Image.open(io.BytesIO(requests.get("https://indigofoundry.app/favicon-512.png", timeout=5).content)).convert('RGBA')
        logo.thumbnail((50,50), Image.LANCZOS)
        img_rgba = img.convert('RGBA')
        img_rgba.paste(logo, (W-M-50, H-100), logo)
        img = img_rgba.convert('RGB')
    except: pass
    return img

def image_to_base64(img):
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()

def upload_to_imgbb(b64):
    r = requests.post('https://api.imgbb.com/1/upload', data={'key': IMGBB_API_KEY, 'image': b64}, timeout=30)
    d = r.json()
    if d.get('success'): return d['data']['url']
    raise Exception("Upload failed")

# ============================================================================
# Search & Buffer
# ============================================================================

def search_trends(category):
    if not TAVILY_API_KEY: return [], "TAVILY_API_KEY not set"
    queries = {"AI": "AI trends 2026", "Odoo": "Odoo ERP 2026", "Tech": "technology trends 2026"}
    try:
        r = requests.post("https://api.tavily.com/search", json={"api_key": TAVILY_API_KEY, "query": queries.get(category, "AI trends"), "max_results": 6}, timeout=30)
        d = r.json()
        return [{'title': x['title'], 'summary': x.get('content','')[:150]} for x in d.get('results', [])], None
    except Exception as e:
        return [], str(e)

def buffer_request(query, variables=None):
    if not BUFFER_API_TOKEN: return None
    return requests.post("https://api.buffer.com/rpc", headers={'Authorization': f'Bearer {BUFFER_API_TOKEN}', 'Content-Type': 'application/json'}, json={'query': query, 'variables': variables or {}}, timeout=30).json()

def get_channel():
    r = buffer_request("query { account { organizations { id } } }")
    if not r or 'data' not in r: return None, None
    orgs = r['data'].get('account', {}).get('organizations', [])
    if not orgs: return None, None
    org_id = orgs[0]['id']
    r = buffer_request("query($i: ChannelsInput!) { channels(input: $i) { id name } }", {'i': {'organizationId': org_id}})
    channels = r.get('data', {}).get('channels', []) if r else []
    return channels[0] if channels else None, channels

def create_post(channel_id, text, image_url):
    inp = {'channelId': channel_id, 'schedulingType': 'automatic', 'mode': 'addToQueue', 'text': text, 'metadata': {'facebook': {'type': 'post'}}}
    if image_url: inp['assets'] = {'images': [{'url': image_url}]}
    return buffer_request("mutation($i: CreatePostInput!) { createPost(input: $i) { __typename ... on PostActionSuccess { post { id } } ... on UnexpectedError { message } } }", {'i': inp})

# ============================================================================
# App
# ============================================================================

def render_stepper(step):
    steps = [("1", "Search"), ("2", "Write"), ("3", "Design"), ("4", "Publish")]
    html = '<div class="stepper">'
    for i, (num, label) in enumerate(steps):
        cls = "step-completed" if i < step else ("step-active" if i == step else "step-inactive")
        html += f'<div class="step {cls}"><div class="step-circle">{num}</div><span class="step-label">{label}</span></div>'
        if i < len(steps) - 1:
            html += '<span class="step-arrow">→</span>'
    html += '</div>'
    st.markdown(html, unsafe_allow_html=True)

def main():
    # Header
    col1, col2 = st.columns([6, 1])
    with col1:
        st.markdown("""
        <div class="app-header">
            <img src="https://indigofoundry.app/favicon-512.png" width="32">
            <span class="app-title">Indigo Foundry Social Manager</span>
        </div>
        """, unsafe_allow_html=True)
    with col2:
        channel, channels = get_channel()
        if channel:
            st.success(f"Connected: {channel['name'][:15]}")
            st.session_state['channel_id'] = channel['id']
        else:
            st.error("No channel")

    # Calculate current step
    step = 0
    if st.session_state.get('selected_topic'): step = 1
    if st.session_state.get('post_text'): step = 2
    if st.session_state.get('preview'): step = 3

    render_stepper(step)

    # Main content in columns
    col1, col2, col3 = st.columns([1, 1, 1])

    # Step 1: Search
    with col1:
        st.markdown('<div class="card"><div class="card-title">1. Search Topics</div>', unsafe_allow_html=True)

        c1, c2, c3 = st.columns(3)
        with c1:
            if st.button("AI", use_container_width=True): do_search("AI")
        with c2:
            if st.button("Odoo", use_container_width=True): do_search("Odoo")
        with c3:
            if st.button("Tech", use_container_width=True): do_search("Tech")

        results = st.session_state.get('search_results', [])
        if results:
            for i, t in enumerate(results[:5]):
                if st.button(f"{t['title'][:50]}...", key=f"t{i}", use_container_width=True):
                    st.session_state['selected_topic'] = t
                    st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)

    # Step 2: Write
    with col2:
        st.markdown('<div class="card"><div class="card-title">2. Write Post</div>', unsafe_allow_html=True)

        topic = st.session_state.get('selected_topic')
        if topic:
            st.info(f"Topic: {topic['title'][:60]}")

        post_text = st.text_area(
            "Post Content",
            value=st.session_state.get('post_text', ''),
            height=200,
            placeholder="Write your post content here...\n\nOr paste the topic summary and edit it.",
            label_visibility="collapsed"
        )

        if topic and st.button("Use Topic as Draft"):
            st.session_state['post_text'] = f"{topic['title']}\n\n{topic['summary']}"
            st.rerun()

        if post_text:
            st.session_state['post_text'] = post_text

        st.markdown('</div>', unsafe_allow_html=True)

    # Step 3: Design & Publish
    with col3:
        st.markdown('<div class="card"><div class="card-title">3. Design & Publish</div>', unsafe_allow_html=True)

        post_text = st.session_state.get('post_text', '')

        headline = st.text_input("Image Headline", value=post_text.split('\n')[0][:50] if post_text else "")
        theme = st.selectbox("Theme", list(THEMES.keys()), format_func=lambda x: THEMES[x]['name'])
        hashtags = st.text_input("Hashtags", value="AI, IndigoFoundry")

        if st.button("Generate Preview", type="primary", use_container_width=True):
            if headline:
                img = generate_image(headline, theme, [h.strip() for h in hashtags.split(',')])
                if img:
                    st.session_state['preview'] = img

        if 'preview' in st.session_state:
            st.image(st.session_state['preview'], use_container_width=True)

            if st.button("Post to Buffer", type="primary", use_container_width=True):
                cid = st.session_state.get('channel_id')
                txt = st.session_state.get('post_text')
                if cid and txt:
                    with st.spinner("Publishing..."):
                        try:
                            url = upload_to_imgbb(image_to_base64(st.session_state['preview']))
                            r = create_post(cid, txt, url)
                            if r and r.get('data', {}).get('createPost', {}).get('__typename') == 'PostActionSuccess':
                                st.success("Posted!")
                                st.balloons()
                            else:
                                st.error("Failed")
                        except Exception as e:
                            st.error(str(e))
                else:
                    st.error("Missing channel or text")

            if st.button("Clear All"):
                for k in ['preview', 'post_text', 'selected_topic', 'search_results']:
                    st.session_state.pop(k, None)
                st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)

def do_search(cat):
    with st.spinner("Searching..."):
        results, err = search_trends(cat)
        if err:
            st.error(err)
        else:
            st.session_state['search_results'] = results
            st.rerun()

if __name__ == "__main__":
    main()
