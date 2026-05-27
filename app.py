"""
Indigo Foundry Social Media Manager
Streamlit app for managing Facebook posts with AI-generated images
"""

import streamlit as st
import requests
import base64
import io
import os
from datetime import datetime, timedelta

# Must be first Streamlit command
st.set_page_config(
    page_title="Indigo Foundry - Social Manager",
    page_icon="🚀",
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
# Configuration - supports both Streamlit Cloud secrets and local .env
# ============================================================================

def get_secret(key, default=""):
    """Get secret from Streamlit Cloud or environment variable"""
    try:
        # Try st.secrets first (Streamlit Cloud)
        if key in st.secrets:
            return st.secrets[key]
    except Exception:
        pass
    # Fall back to environment variable
    return os.getenv(key, default)

BUFFER_API_URL = "https://api.buffer.com/rpc"
IMGBB_API_KEY = get_secret("IMGBB_API_KEY", "")
BUFFER_API_TOKEN = get_secret("BUFFER_API_TOKEN", "")
OPENROUTER_API_KEY = get_secret("OPENROUTER_API_KEY", "")
TAVILY_API_KEY = get_secret("TAVILY_API_KEY", "")

# Brand colors
THEMES = {
    'indigo': {'bg': '#4F46E5', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': '靛藍 Indigo'},
    'navy': {'bg': '#1E1B4B', 'text': '#FFFFFF', 'accent': '#818CF8', 'name': '深藍 Navy'},
    'teal': {'bg': '#0F766E', 'text': '#FFFFFF', 'accent': '#F59E0B', 'name': '青綠 Teal'},
    'coral': {'bg': '#EA580C', 'text': '#FFFFFF', 'accent': '#1E1B4B', 'name': '珊瑚 Coral'},
    'slate': {'bg': '#1E293B', 'text': '#FFFFFF', 'accent': '#14B8A6', 'name': '石板灰 Slate'},
    'purple': {'bg': '#7C3AED', 'text': '#FFFFFF', 'accent': '#FCD34D', 'name': '紫色 Purple'},
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

AI_SYSTEM_PROMPT = """你是青藍科技 (Indigo Foundry) 的社交媒體內容創作者，專門為香港和台灣的Facebook用戶設計科技相關貼文。

你的任務是根據提供的主題，創建吸引人的Facebook貼文。

要求：
1. 貼文長度：150-280字
2. 使用繁體中文
3. 包含2-4個相關emoji，自然地融入文字中
4. 語氣專業但親切、有趣、引發討論
5. 結尾加入互動問題或行動呼籲
6. 聚焦於：AI趨勢、Odoo ERP、數位轉型、科技新聞

風格指南：
- 開頭要吸引眼球
- 內容要有觀點但不偏激
- 適當使用換行增加可讀性
- 語氣像是專業顧問分享見解

避免：
- 政治敏感話題
- 過於銷售導向的語氣
- 虛假或未經證實的資訊"""


def fetch_live_trends(category="AI"):
    """Fetch live trending topics using Tavily search API"""
    if not TAVILY_API_KEY:
        return None, "請在 secrets 中設定 TAVILY_API_KEY"

    search_queries = {
        "AI": "AI artificial intelligence trends news 2026",
        "Odoo": "Odoo ERP news updates 2026",
        "Tech": "technology trends Hong Kong Taiwan 2026",
    }

    query = search_queries.get(category, search_queries["AI"])

    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "max_results": 10,
                "include_answer": True,
            },
            timeout=30
        )

        data = response.json()

        if 'error' in data:
            return None, f"Search error: {data['error']}"

        results = data.get('results', [])
        topics = []
        for r in results:
            topics.append({
                'title': r.get('title', ''),
                'summary': r.get('content', '')[:200] + '...' if len(r.get('content', '')) > 200 else r.get('content', ''),
                'url': r.get('url', ''),
            })

        return topics, None

    except Exception as e:
        return None, f"Error: {str(e)}"


def summarize_trends_with_ai(topics):
    """Use AI to create post-worthy summaries from search results"""
    if not OPENROUTER_API_KEY or not topics:
        return topics

    # Create a prompt to extract key trending topics
    topics_text = "\n".join([f"- {t['title']}: {t['summary']}" for t in topics[:10]])

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "anthropic/claude-3-haiku",
                "messages": [
                    {"role": "system", "content": """你是一個科技趨勢分析師。根據提供的搜尋結果，提取5-8個最適合社交媒體發布的熱門話題。

請用JSON格式回覆，格式如下：
[
  {"title": "話題標題（簡短有力）", "summary": "一句話摘要（50字內）", "angle": "建議的貼文角度"}
]

只回覆JSON，不要其他文字。"""},
                    {"role": "user", "content": f"搜尋結果：\n{topics_text}"}
                ],
                "temperature": 0.7,
                "max_tokens": 800,
            },
            timeout=30
        )

        data = response.json()
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')

        # Parse JSON from response
        import json
        # Try to extract JSON from the response
        try:
            parsed = json.loads(content)
            return parsed
        except:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                return json.loads(json_match.group())

    except Exception as e:
        pass

    return topics


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
                "model": "anthropic/claude-3-haiku",
                "messages": [
                    {"role": "system", "content": AI_SYSTEM_PROMPT},
                    {"role": "user", "content": f"請根據以下主題創建一則Facebook貼文：\n\n{topic}"}
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
    """Get the first organization ID from Buffer account"""
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
    variables = {
        'input': {
            'organizationId': org_id
        }
    }
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
        'metadata': {
            'facebook': {'type': 'post'}
        }
    }

    if image_url:
        post_input['assets'] = {
            'images': [{'url': image_url}]
        }

    result = buffer_request(mutation, {'input': post_input}, token=token)
    return result


# ============================================================================
# Trending Topics
# ============================================================================

def fetch_trending_topics():
    """Fetch trending AI/Tech/Odoo topics"""
    topics = [
        # AI Trends
        {'title': 'Agentic AI 成為2026年最熱門趨勢', 'category': 'AI'},
        {'title': 'AI代理團隊協作處理複雜任務', 'category': 'AI'},
        {'title': '全球17.8%工作人口使用AI協作', 'category': 'AI'},
        {'title': 'Google TurboQuant 突破性演算法', 'category': 'AI'},
        {'title': 'AI從工具進化為工作夥伴', 'category': 'AI'},
        {'title': 'Claude 4 Opus 多模態能力大躍進', 'category': 'AI'},
        {'title': 'GPT-5 即將發布的傳聞', 'category': 'AI'},
        {'title': 'AI程式碼助手提升開發效率50%', 'category': 'AI'},
        {'title': '企業AI採用率創新高', 'category': 'AI'},
        {'title': 'AI自動化客服解決方案', 'category': 'AI'},
        {'title': 'RAG技術讓AI更準確', 'category': 'AI'},
        {'title': 'AI影像生成技術突破', 'category': 'AI'},
        {'title': '小型語言模型(SLM)崛起', 'category': 'AI'},
        {'title': 'AI安全與倫理議題', 'category': 'AI'},
        {'title': 'Vibe Coding 用自然語言寫程式', 'category': 'AI'},

        # Odoo
        {'title': 'Odoo 20 即將於9月發布', 'category': 'Odoo'},
        {'title': 'Odoo全面整合AI功能', 'category': 'Odoo'},
        {'title': 'Claude Code 整合進 Odoo.sh', 'category': 'Odoo'},
        {'title': 'Odoo Experience 2026 全球活動', 'category': 'Odoo'},
        {'title': 'Odoo營收突破6億歐元', 'category': 'Odoo'},
        {'title': 'Odoo vs SAP：中小企業的選擇', 'category': 'Odoo'},
        {'title': 'Odoo電商模組新功能', 'category': 'Odoo'},
        {'title': 'Odoo庫存管理最佳實踐', 'category': 'Odoo'},
        {'title': 'Odoo會計模組自動化', 'category': 'Odoo'},
        {'title': 'Odoo CRM提升銷售效率', 'category': 'Odoo'},
        {'title': 'Odoo製造模組MRP應用', 'category': 'Odoo'},
        {'title': 'Odoo人資模組簡化HR流程', 'category': 'Odoo'},
        {'title': 'Odoo多公司管理功能', 'category': 'Odoo'},
        {'title': 'Odoo開源ERP成本優勢', 'category': 'Odoo'},
        {'title': 'Odoo Studio低代碼開發', 'category': 'Odoo'},

        # Digital Transformation
        {'title': 'ERP系統助企業降低25-35%營運成本', 'category': '數位轉型'},
        {'title': '中小企業數位轉型指南', 'category': '數位轉型'},
        {'title': '雲端ERP vs 本地部署', 'category': '數位轉型'},
        {'title': '自動化流程提升營運效率', 'category': '數位轉型'},
        {'title': '數據驅動決策的重要性', 'category': '數位轉型'},
        {'title': '電子發票與數位化轉型', 'category': '數位轉型'},
        {'title': '遠端工作與協作工具', 'category': '數位轉型'},
        {'title': 'API整合打通企業系統', 'category': '數位轉型'},
        {'title': '低代碼平台加速開發', 'category': '數位轉型'},
        {'title': '企業資安防護策略', 'category': '數位轉型'},

        # Hong Kong / Taiwan Business
        {'title': '香港中小企數位化補助計劃', 'category': '商業'},
        {'title': '台灣產業AI應用案例', 'category': '商業'},
        {'title': '大灣區科技發展機遇', 'category': '商業'},
        {'title': '跨境電商經營策略', 'category': '商業'},
        {'title': '香港Fintech發展趨勢', 'category': '商業'},
        {'title': '台灣製造業智慧轉型', 'category': '商業'},
        {'title': '零售業O2O整合方案', 'category': '商業'},
        {'title': '餐飲業POS系統選擇', 'category': '商業'},
    ]
    return topics


# ============================================================================
# Streamlit UI
# ============================================================================

def main():
    # Sidebar
    with st.sidebar:
        st.image("https://indigofoundry.app/favicon-512.png", width=80)
        st.title("青藍科技")
        st.caption("Social Media Manager")

        st.divider()

        # Use token from secrets
        buffer_token = BUFFER_API_TOKEN
        selected_channel_id = None

        if buffer_token:
            try:
                channels = get_channels(buffer_token)
                if channels:
                    st.success(f"✓ Connected ({len(channels)} channels)")
                    channel_options = {c['name']: c['id'] for c in channels}
                    selected_channel_name = st.selectbox("Select Channel", options=list(channel_options.keys()))
                    selected_channel_id = channel_options.get(selected_channel_name)
                else:
                    st.warning("No channels found. The token may be invalid or have no channels connected.")
            except Exception as e:
                st.error(f"Buffer API error: {str(e)}")
        else:
            st.error("Buffer token not configured. Add BUFFER_API_TOKEN to secrets.")

        st.divider()

        # Navigation
        page = st.radio(
            "Navigation",
            ["🔍 獲取熱門話題", "📝 Create Post", "📋 Post Queue"],
            label_visibility="collapsed"
        )

    # Main content
    if page == "🔍 獲取熱門話題":
        render_fetch_trends()
    elif page == "📝 Create Post":
        render_create_post(buffer_token, selected_channel_id)
    elif page == "📋 Post Queue":
        render_post_queue(buffer_token, selected_channel_id)


def render_fetch_trends():
    st.header("🔍 獲取熱門話題")
    st.caption("點擊按鈕讓 AI 搜尋最新熱門話題，選擇後自動生成貼文")

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("🤖 AI 趨勢", type="primary", use_container_width=True):
            fetch_and_display_trends("AI")

    with col2:
        if st.button("📊 Odoo 新聞", type="primary", use_container_width=True):
            fetch_and_display_trends("Odoo")

    with col3:
        if st.button("💡 科技趨勢", type="primary", use_container_width=True):
            fetch_and_display_trends("Tech")

    st.divider()

    # Display fetched trends
    if 'fetched_trends' in st.session_state and st.session_state['fetched_trends']:
        st.subheader("📋 選擇話題")

        for i, topic in enumerate(st.session_state['fetched_trends']):
            with st.container():
                col_a, col_b = st.columns([4, 1])

                with col_a:
                    st.markdown(f"**{topic.get('title', '')}**")
                    summary = topic.get('summary', topic.get('angle', ''))
                    if summary:
                        st.caption(summary)

                with col_b:
                    if st.button("使用", key=f"use_trend_{i}", use_container_width=True):
                        # Generate post content for this topic
                        with st.spinner("AI 正在生成貼文..."):
                            topic_text = f"{topic.get('title', '')} - {topic.get('summary', topic.get('angle', ''))}"
                            content, error = generate_ai_content(topic_text)
                            if content:
                                st.session_state['generated_text'] = content
                                st.session_state['selected_topic'] = topic.get('title', '')
                                st.success("✅ 已生成貼文！請到「Create Post」查看")
                            else:
                                st.error(error or "生成失敗")

                st.divider()
    else:
        st.info("👆 點擊上方按鈕獲取最新熱門話題")


def fetch_and_display_trends(category):
    """Fetch trends and store in session state"""
    with st.spinner(f"正在搜尋 {category} 相關熱門話題..."):
        topics, error = fetch_live_trends(category)

        if error:
            st.error(error)
            return

        if topics:
            # Summarize with AI
            with st.spinner("AI 正在分析話題..."):
                summarized = summarize_trends_with_ai(topics)
                st.session_state['fetched_trends'] = summarized
                st.rerun()
        else:
            st.warning("未找到相關話題")


def render_create_post(buffer_token, channel_id):
    st.header("📝 Create Post")

    # Show selected topic if any
    if 'selected_topic' in st.session_state:
        st.info(f"📌 選定話題: {st.session_state['selected_topic']}")

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("Post Content")

        # Post text - use generated text if available
        default_text = st.session_state.get('generated_text', '')
        post_text = st.text_area(
            "Post Text",
            value=default_text,
            height=180,
            placeholder="輸入貼文內容，或先到「獲取熱門話題」讓 AI 生成...",
            help="The caption for your Facebook post"
        )

        # Manual AI generate option
        with st.expander("🤖 手動輸入主題生成"):
            manual_topic = st.text_input("輸入主題", placeholder="例如：Agentic AI 最新趨勢")
            if st.button("✨ 生成", use_container_width=True):
                if manual_topic:
                    with st.spinner("生成中..."):
                        content, error = generate_ai_content(manual_topic)
                        if content:
                            st.session_state['generated_text'] = content
                            st.rerun()
                        else:
                            st.error(error)

        # Image headline (can be different from post text)
        use_custom_headline = st.checkbox("Use different text for image")
        if use_custom_headline:
            image_headline = st.text_input("Image Headline", value=post_text[:50] if post_text else "")
        else:
            # Extract first line or first 50 chars for image
            image_headline = post_text.split('\n')[0][:80] if post_text else ""

        # Theme selection
        theme_options = {v['name']: k for k, v in THEMES.items()}
        selected_theme_name = st.selectbox("Color Theme", options=list(theme_options.keys()))
        selected_theme = theme_options[selected_theme_name]

        # Preview theme colors
        colors = THEMES[selected_theme]
        st.markdown(
            f"""<div style="display:flex; gap:10px; margin:10px 0;">
                <div style="width:30px;height:30px;background:{colors['bg']};border-radius:4px;border:1px solid #ddd;"></div>
                <div style="width:30px;height:30px;background:{colors['accent']};border-radius:4px;border:1px solid #ddd;"></div>
            </div>""",
            unsafe_allow_html=True
        )

        # Hashtags
        hashtags_input = st.text_input(
            "Hashtags (comma separated)",
            value="AI人工智能, 數位轉型, 青藍科技",
            help="Will appear on the image"
        )
        hashtags = [tag.strip() for tag in hashtags_input.split(',') if tag.strip()]

        # Generate button
        generate_clicked = st.button("🎨 Generate Preview", type="primary", use_container_width=True)

    with col2:
        st.subheader("Image Preview")

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
                    st.session_state['image_headline'] = image_headline

        # Display preview
        if 'preview_image' in st.session_state:
            st.image(st.session_state['preview_image'], use_container_width=True)

            # Post actions
            st.divider()

            col_a, col_b = st.columns(2)

            with col_a:
                if st.button("📤 Post to Buffer", type="primary", use_container_width=True):
                    if not buffer_token or not channel_id:
                        st.error("Please connect Buffer and select a channel")
                    elif not st.session_state.get('post_text'):
                        st.error("Please enter post text")
                    else:
                        with st.spinner("Uploading image and creating post..."):
                            try:
                                # Upload image
                                img_base64 = image_to_base64(st.session_state['preview_image'])
                                image_url = upload_to_imgbb(img_base64, IMGBB_API_KEY)

                                # Create post
                                result = create_buffer_post(
                                    channel_id=channel_id,
                                    text=st.session_state['post_text'],
                                    image_url=image_url,
                                    token=buffer_token
                                )

                                if result and 'data' in result:
                                    post_result = result['data'].get('createPost', {})
                                    if post_result.get('__typename') == 'PostActionSuccess':
                                        st.success("✅ Post added to Buffer queue!")
                                        st.balloons()
                                    else:
                                        st.error(f"Error: {post_result.get('message', 'Unknown error')}")
                                else:
                                    st.error("Failed to create post")
                            except Exception as e:
                                st.error(f"Error: {str(e)}")

            with col_b:
                if st.button("🗑️ Clear", use_container_width=True):
                    if 'preview_image' in st.session_state:
                        del st.session_state['preview_image']
                    st.rerun()
        else:
            st.info("Enter post content and click 'Generate Preview'")


def render_trending_topics(buffer_token, channel_id):
    st.header("🔥 Trending Topics")
    st.caption("Click on a topic to create a post")

    # Category filter
    categories = ['All', 'AI', 'Odoo']
    selected_category = st.radio("Filter", categories, horizontal=True)

    topics = fetch_trending_topics()

    if selected_category != 'All':
        topics = [t for t in topics if t['category'] == selected_category]

    for topic in topics:
        with st.container():
            col1, col2 = st.columns([4, 1])

            with col1:
                st.markdown(f"**{topic['title']}**")
                st.caption(topic['description'])

            with col2:
                if st.button("Use", key=f"use_{topic['title'][:20]}"):
                    st.session_state['post_text'] = f"{topic['title']}\n\n{topic['description']}"
                    st.session_state['image_headline'] = topic['title']
                    st.info("Topic selected! Go to 'Create Post' to continue.")

            st.divider()


def render_post_queue(buffer_token, channel_id):
    st.header("📋 Post Queue")

    if not buffer_token or not channel_id:
        st.warning("Connect Buffer and select a channel to view queue")
        return

    with st.spinner("Loading posts..."):
        posts = get_posts(channel_id, buffer_token)

    if not posts:
        st.info("No scheduled posts")
        return

    for post in posts:
        with st.container():
            col1, col2 = st.columns([3, 1])

            with col1:
                # Show post text (truncated)
                text = post.get('text', '')[:200]
                if len(post.get('text', '')) > 200:
                    text += '...'
                st.markdown(f"**{text}**")

                # Show scheduled time
                due_at = post.get('dueAt')
                if due_at:
                    st.caption(f"📅 Scheduled: {due_at}")

                # Show status
                status = post.get('status', 'unknown')
                if status == 'scheduled':
                    st.caption("🟢 Scheduled")
                elif status == 'draft':
                    st.caption("🟡 Draft")

            with col2:
                # Show image thumbnail if available
                images = post.get('assets', {}).get('images', [])
                if images:
                    st.image(images[0]['url'], width=100)

            st.divider()


if __name__ == "__main__":
    main()
